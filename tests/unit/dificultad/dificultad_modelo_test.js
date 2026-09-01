/**
 * Sistema 4 — criterios de aceptacion del modelo de dificultad.
 * Cubre AC-1 a AC-12 de design/gdd/modelo-dificultad.md
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dm, dp, ejesAcoplados, dificultadTolerada,
  validarConfiguracion, validarRango, resolver,
} from '../../../src/dificultad/modelo.js';
import {
  T_MIN, T_AAA, T_MAX, C_MIN, C_MAX, W_C, W_V, W_S,
} from '../../../src/dificultad/constantes.js';

// ---------------------------------------------------------------- AC-1, AC-2

test('test_canario_F1_la_tabla_publicada_exacta', () => {
  /** @type {[number, number][]} */
  const tabla = [[24, 100.0], [32, 83.7], [44, 65.6], [60, 48.0], [80, 31.7], [100, 19.1], [140, 0.0]];
  for (const [t, esperado] of tabla) {
    assert.equal(dm(t), esperado, `dm(${t})`);
  }
});

test('test_dm_es_monotona_decreciente_y_acotada', () => {
  let anterior = Infinity;
  for (let t = T_MIN; t <= T_MAX; t++) {
    const v = dm(t);
    assert.ok(v <= anterior, `dm no decrece en t=${t}: ${anterior} -> ${v}`);
    assert.ok(v >= 0 && v <= 100, `dm(${t}) = ${v} fuera de [0, 100]`);
    anterior = v;
  }
  assert.equal(dm(T_MIN), 100);
  assert.equal(dm(T_MAX), 0);
});

// ---------------------------------------------------------------- AC-3, AC-4, AC-5

test('test_canario_F2_la_tabla_publicada_exacta', () => {
  /** @type {[number, number, number, number][]} */
  const tabla = [
    // Recalculada el 2026-09-01 al bajar C_MAX de 100 a 60 (ADR-0006). `nC` se normaliza
    // contra C_MAX, asi que el techo mueve la dificultad de TODOS los tableros: el mismo
    // tablero de 12 objetos pasa de 3,7 a 6,3. Ejecutada, no recordada.
    [3, 0, 0, 0.0],
    [12, 0, 0, 6.3],
    [12, 0.5, 0, 26.3],
    [12, 0, 0.5, 16.3],
    [40, 0.5, 0.5, 56.0],
    [60, 1, 1, 100.0],
  ];
  for (const [C, sv, ss, esperado] of tabla) {
    assert.equal(dp(C, sv, ss), esperado, `dp(${C}, ${sv}, ${ss})`);
  }
});

test('test_dp_esta_acotada_en_los_extremos_y_en_el_interior', () => {
  assert.equal(dp(C_MIN, 0, 0), 0.0);
  assert.equal(dp(C_MAX, 1, 1), 100.0);
  // Barrido determinista, no aleatorio: los tests de este proyecto no usan azar.
  for (let C = C_MIN; C <= C_MAX; C += 7) {
    for (let i = 0; i <= 10; i++) {
      for (let j = 0; j <= 10; j++) {
        const v = dp(C, i / 10, j / 10);
        assert.ok(v >= 0 && v <= 100, `dp(${C}, ${i / 10}, ${j / 10}) = ${v}`);
      }
    }
  }
});

test('test_los_pesos_de_F2_suman_exactamente_1', () => {
  // Si alguien cambia un peso sin ajustar otro, dp deja de estar acotada en 100.
  assert.equal(W_C + W_V + W_S, 1);
});

test('test_la_similitud_visual_pesa_mas_que_la_semantica', () => {
  // No es un detalle de implementacion: es la afirmacion de diseño de F2.
  assert.ok(dp(12, 0.5, 0) > dp(12, 0, 0.5));
});

// ---------------------------------------------------------------- AC-6, AC-7, AC-8

test('test_un_rango_invertido_se_rechaza_y_no_se_intercambia', () => {
  assert.throws(
    () => validarRango('t', { min: 80, max: 40 }, T_MIN, T_MAX, true),
    (/** @type {unknown} */ err) => {
      assert.ok(err instanceof RangeError);
      assert.match(err.message, /rango invertido/);
      assert.match(err.message, /min=80/);
      assert.match(err.message, /max=40/);
      return true;
    },
  );
});

test('test_un_rango_degenerado_es_valido', () => {
  assert.doesNotThrow(() => validarRango('t', { min: 60, max: 60 }, T_MIN, T_MAX, true));
});

test('test_un_valor_fuera_del_limite_duro_se_rechaza_nunca_se_recorta', () => {
  /** @type {[string, () => unknown][]} */
  const casos = [
    ['t = 23', () => validarConfiguracion({ t: 23, C: 12, sv: 0, ss: 0 })],
    ['t = 141', () => validarConfiguracion({ t: 141, C: 12, sv: 0, ss: 0 })],
    ['C = 2', () => validarConfiguracion({ t: 60, C: 2, sv: 0, ss: 0 })],
    ['C = 101', () => validarConfiguracion({ t: 60, C: 101, sv: 0, ss: 0 })],
    ['sv = -0.1', () => validarConfiguracion({ t: 60, C: 12, sv: -0.1, ss: 0 })],
    ['ss = 1.1', () => validarConfiguracion({ t: 60, C: 12, sv: 0, ss: 1.1 })],
    ['t no entero', () => validarConfiguracion({ t: 60.5, C: 12, sv: 0, ss: 0 })],
    ['C no numero', () => validarConfiguracion({ t: 60, C: /** @type {any} */ ('12'), sv: 0, ss: 0 })],
  ];
  for (const [etiqueta, fn] of casos) {
    assert.throws(fn, RangeError, `${etiqueta} deberia lanzar`);
  }
});

test('test_las_fuentes_de_dm_y_dp_tambien_validan', () => {
  // Un valor invalido no puede colarse por la puerta de atras de la formula.
  assert.throws(() => dm(23), RangeError);
  assert.throws(() => dm(141), RangeError);
  assert.throws(() => dp(2, 0, 0), RangeError);
  assert.throws(() => dp(12, 1.5, 0), RangeError);
});

test('test_la_politica_fija_devuelve_min_no_el_punto_medio', () => {
  assert.equal(resolver({ min: 44, max: 100 }, 'fija'), 44);
  assert.equal(resolver({ min: 60, max: 60 }, 'fija'), 60);
});

test('test_la_politica_adaptativa_no_existe_en_el_nivel_0', () => {
  assert.throws(
    () => resolver({ min: 44, max: 100 }, 'adaptativa'),
    /sistema 17/,
  );
});

// ---------------------------------------------------------------- regla 5

test('test_ejesAcoplados_es_true_por_debajo_del_minimo_AAA', () => {
  assert.equal(ejesAcoplados(T_AAA), false);
  assert.equal(ejesAcoplados(T_AAA - 1), true);
  assert.equal(ejesAcoplados(T_MIN), true);
  assert.equal(ejesAcoplados(60), false);
});

// ---------------------------------------------------------------- AC-9

test('test_canario_F3_el_ejemplo_trabajado', () => {
  /** @type {import('../../../src/dificultad/modelo.js').Observacion[]} */
  const obs = [];
  /** @param {number} d @param {number} n @param {number} a */
  const anadir = (d, n, a) => {
    for (let i = 0; i < n; i++) obs.push({ d, acierto: i < a });
  };
  anadir(20.0, 10, 10);
  anadir(40.0, 10, 9);
  anadir(60.0, 10, 8);
  anadir(80.0, 10, 5); // precision 0,50 — descartado
  anadir(95.0, 3, 3);  // precision 1,00 pero solo 3 intentos — descartado

  const r = dificultadTolerada(obs);
  assert.equal(r.valor, 60.0);
});

test('test_nMin_impide_que_tres_aciertos_por_suerte_ganen', () => {
  // Es la razon de existir de nMin. Sin el, el registro diria que el paciente mejoro
  // un 58% en una sesion.
  /** @type {import('../../../src/dificultad/modelo.js').Observacion[]} */
  const obs = [
    ...Array.from({ length: 10 }, (_, i) => ({ d: 20.0, acierto: i < 9 })),
    ...Array.from({ length: 3 }, () => ({ d: 95.0, acierto: true })),
  ];
  assert.equal(dificultadTolerada(obs).valor, 20.0);
  // Y bajando nMin a 3, el mismo dato da otra respuesta: el umbral es lo que decide.
  assert.equal(dificultadTolerada(obs, { nMin: 3 }).valor, 95.0);
});

// ---------------------------------------------------------------- AC-10

test('test_sin_datos_suficientes_devuelve_undefined_NUNCA_0', () => {
  /** @type {import('../../../src/dificultad/modelo.js').Observacion[][]} */
  const casos = [
    [],
    // Ningun nivel alcanza nMin
    [{ d: 50, acierto: true }, { d: 50, acierto: true }],
    // Ningun nivel alcanza precisionObjetivo
    Array.from({ length: 10 }, (_, i) => ({ d: 50, acierto: i < 5 })),
  ];
  for (const obs of casos) {
    const r = dificultadTolerada(obs);
    assert.equal(r.valor, undefined, `deberia ser undefined: ${JSON.stringify(obs.slice(0, 2))}`);
    assert.equal(r.motivo, 'datosInsuficientes');
    // Las tres formas que este proyecto tiene prohibidas.
    assert.notEqual(r.valor, 0);
    assert.notEqual(r.valor, -Infinity);
    assert.ok(!Number.isNaN(r.valor));
  }
});

// ---------------------------------------------------------------- AC-11, AC-12

test('test_con_ejes_acoplados_la_metrica_perceptiva_no_se_calcula', () => {
  const obs = Array.from({ length: 10 }, () => ({ d: 40.0, acierto: true }));
  // Sin la marca, el dato da 40.
  assert.equal(dificultadTolerada(obs).valor, 40.0);
  // Con la marca, no se calcula, y el motivo es DISTINTO de datosInsuficientes.
  const r = dificultadTolerada(obs, { acoplados: true });
  assert.equal(r.valor, undefined);
  assert.equal(r.motivo, 'ejesAcoplados');
});

test('test_con_los_dos_ejes_movidos_ninguna_metrica_es_valida', () => {
  const obs = Array.from({ length: 10 }, () => ({ d: 40.0, acierto: true }));
  const r = dificultadTolerada(obs, { mezclados: true });
  assert.equal(r.valor, undefined);
  assert.equal(r.motivo, 'ejesMezclados');
});

/**
 * Lee el motivo de una metrica sin valor. Existe porque el tipo union NO permite leer
 * `motivo` sin comprobar antes que no hay valor — y eso es deliberado: obliga al
 * consumidor a distinguir "no hay dato" de "el dato es este".
 *
 * @param {import('../../../src/dificultad/modelo.js').Metrica} m
 * @returns {string}
 */
function motivoDe(m) {
  assert.equal(m.valor, undefined, 'se esperaba una metrica sin valor');
  return m.valor === undefined ? m.motivo : 'inalcanzable';
}

test('test_los_tres_motivos_son_distinguibles', () => {
  // Uno se arregla con mas sesiones, otro con otra configuracion, y el tercero no
  // usando los dos ejes a la vez. Confundirlos daria al terapeuta el consejo erroneo.
  const obs = Array.from({ length: 10 }, () => ({ d: 40.0, acierto: true }));
  const motivos = new Set([
    motivoDe(dificultadTolerada([])),
    motivoDe(dificultadTolerada(obs, { acoplados: true })),
    motivoDe(dificultadTolerada(obs, { mezclados: true })),
  ]);
  assert.equal(motivos.size, 3);
});
