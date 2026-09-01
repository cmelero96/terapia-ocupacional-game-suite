/**
 * Sistema 9 — criterios de aceptacion del registro de rendimiento.
 * Cubre AC-1 a AC-9. AC-10 lo aplica invariantes.js; AC-11 vive en el sistema 5.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  latencia, resumenSesion, dificultadRegistrada, estadoReproduccion, Registro,
} from '../../../src/registro/sesion.js';

/**
 * @param {Partial<import('../../../src/registro/sesion.js').Sesion>} [parcial]
 * @returns {import('../../../src/registro/sesion.js').Sesion}
 */
function sesionDePrueba(parcial = {}) {
  return {
    orden: 0,
    selloPared: 1_700_000_000_000,
    resolucionMs: 0.0001,
    fiableParaPresupuesto: true,
    ejesAcoplados: false,
    tableros: [],
    ...parcial,
  };
}

/**
 * @param {number} n
 * @param {number} aciertos
 * @param {number} sinDato
 * @returns {import('../../../src/registro/sesion.js').TableroRegistrado}
 */
function tableroConIntentos(n, aciertos, sinDato) {
  /** @type {import('../../../src/registro/sesion.js').Intento[]} */
  const intentos = [];
  for (let i = 0; i < n; i++) {
    intentos.push({
      idActivado: `id-${i}`,
      correcto: i < aciertos,
      latencia: i < sinDato ? { ms: undefined, motivo: 'relojRetrocedio' } : { ms: 100 + i },
    });
  }
  return {
    objetivo: 'obj', distractores: [], semilla: 1, schemaVersion: 'v1',
    dm: 48, dp: 20, dpPedida: 20, intentos, incompleto: false,
  };
}

// ---------------------------------------------------------------- AC-1, AC-2, AC-3

test('test_canario_F1_los_cuatro_casos', () => {
  const normal = latencia(1000, 1016, 'evento', 'evento');
  assert.equal(normal.ms, 16);

  const igual = latencia(1000, 1000, 'evento', 'evento');
  assert.equal(igual.ms, 0);
  assert.equal(igual.ms === 0 ? igual.resolucionInsuficiente : undefined, true);

  const atras = latencia(1000, 999, 'evento', 'evento');
  assert.equal(atras.ms, undefined);
  assert.equal(atras.ms === undefined ? atras.motivo : '', 'relojRetrocedio');

  const mezcla = latencia(1000, 1016, 'evento', 'reloj');
  assert.equal(mezcla.ms, undefined);
  assert.equal(mezcla.ms === undefined ? mezcla.motivo : '', 'origenesMezclados');
});

test('test_una_latencia_negativa_NUNCA_se_registra_como_0', () => {
  /** @type {[number, number][]} */
  const pares = [[1000, 999], [1000, 0], [3_600_000, 16]];
  for (const [a, b] of pares) {
    const r = latencia(a, b, 'reloj', 'reloj');
    assert.equal(r.ms, undefined, `${a} -> ${b}`);
    assert.notEqual(r.ms, 0);
    assert.ok(!Number.isNaN(r.ms));
  }
});

test('test_no_se_restan_dos_origenes_de_reloj_distintos', () => {
  // Los dos numeros darian 16, que es plausible. No importa: no son comparables.
  const r = latencia(1000, 1016, 'evento', 'reloj');
  assert.equal(r.ms, undefined);
  assert.equal(r.ms === undefined ? r.motivo : '', 'origenesMezclados');
});

test('test_los_tres_motivos_degenerados_son_distinguibles', () => {
  // Piden acciones distintas: defecto de codigo, defecto del entorno, limitacion aceptable.
  const a = latencia(1000, 1016, 'evento', 'reloj');
  const b = latencia(1000, 999, 'reloj', 'reloj');
  const c = latencia(1000, 1000, 'reloj', 'reloj');
  assert.notEqual(
    a.ms === undefined ? a.motivo : '',
    b.ms === undefined ? b.motivo : '',
  );
  assert.equal(c.ms, 0, 'el tercero SI tiene valor: hubo un evento');
});

// ---------------------------------------------------------------- AC-4, AC-5

test('test_precision_con_cero_intentos_es_undefined_no_0', () => {
  const r = resumenSesion(sesionDePrueba());
  assert.equal(r.intentos, 0);
  assert.equal(r.precision, undefined);
  assert.equal(r.latenciaMedia, undefined);
  // Ningun campo vale 0 por ausencia de datos.
  assert.notEqual(r.precision, 0);
  assert.notEqual(r.latenciaMedia, 0);
});

test('test_latenciasSinDato_se_publica_siempre', () => {
  // 40 activaciones, 37 sin latencia. La media es de 3 valores, y hay que decirlo.
  const sesion = sesionDePrueba({ tableros: [tableroConIntentos(40, 30, 37)] });
  const r = resumenSesion(sesion);
  assert.equal(r.intentos, 40);
  assert.equal(r.latenciasSinDato, 37);
  // Los tres definidos son i = 37, 38, 39 -> 137, 138, 139
  assert.equal(r.latenciaMedia, 138);
});

test('test_latenciasSinDato_se_publica_incluso_cuando_es_0', () => {
  const sesion = sesionDePrueba({ tableros: [tableroConIntentos(10, 8, 0)] });
  const r = resumenSesion(sesion);
  assert.equal(r.latenciasSinDato, 0);
  assert.ok(Object.hasOwn(r, 'latenciasSinDato'));
});

test('test_la_precision_se_calcula_sobre_todos_los_tableros_de_la_sesion', () => {
  const sesion = sesionDePrueba({
    tableros: [tableroConIntentos(10, 8, 0), tableroConIntentos(10, 2, 0)],
  });
  const r = resumenSesion(sesion);
  assert.equal(r.intentos, 20);
  assert.equal(r.aciertos, 10);
  assert.equal(r.precision, 0.5);
});

// ---------------------------------------------------------------- AC-6

test('test_la_dificultad_registrada_es_la_EFECTIVA', () => {
  /** @type {import('../../../src/tablero/generador.js').Tablero} */
  const tablero = {
    objetivo: 'o', distractores: [], celdas: ['o'], semilla: 1,
    svPedida: 0.8, ssPedida: 0.8, svEfectiva: 9 / 11, ssEfectiva: 2 / 11,
  };
  const d = dificultadRegistrada(tablero, { t: 60, C: 12 });
  assert.equal(d.dp, 42.7, 'la registrada sale de las efectivas');
  assert.equal(d.dpPedida, 54.3, 'y la pedida se guarda tambien');
  assert.equal(d.dm, 48.0);
  // El error va siempre hacia arriba: guardar solo la pedida sobrestimaria.
  assert.ok(d.dpPedida > d.dp);
});

// ---------------------------------------------------------------- AC-7

test('test_el_orden_de_sesiones_sobrevive_a_un_salto_del_reloj_de_pared', () => {
  const registro = new Registro();
  /** @type {import('../../../src/plataforma/esquema.js').ResolucionReloj} */
  const resolucion = { resolucionMs: 0.1, muestras: 20, fiableParaPresupuesto: true };

  let sello = 1_700_000_000_000;
  /** @returns {import('../../../src/plataforma/esquema.js').RelojPared} */
  const pared = () => ({ kind: 'pared', now: () => sello });

  registro.abrirSesion({ relojPared: pared(), resolucion, ejesAcoplados: false });
  // Una tableta que paso semanas apagada corrige su reloj: retrocede una hora.
  sello -= 3_600_000;
  registro.abrirSesion({ relojPared: pared(), resolucion, ejesAcoplados: false });
  sello += 60_000;
  registro.abrirSesion({ relojPared: pared(), resolucion, ejesAcoplados: false });

  const ordenadas = registro.ordenadas();
  assert.deepStrictEqual(ordenadas.map((s) => s.orden), [0, 1, 2]);
  // Y por sello saldrian desordenadas: es la razon de existir del contador.
  const porSello = [...registro.sesiones].sort((a, b) => a.selloPared - b.selloPared);
  assert.notDeepStrictEqual(porSello.map((s) => s.orden), [0, 1, 2]);
});

test('test_el_registro_no_crece_sin_limite', () => {
  const registro = new Registro();
  /** @type {import('../../../src/plataforma/esquema.js').ResolucionReloj} */
  const resolucion = { resolucionMs: 0.1, muestras: 20, fiableParaPresupuesto: true };
  /** @type {import('../../../src/plataforma/esquema.js').RelojPared} */
  const pared = { kind: 'pared', now: () => 1_700_000_000_000 };
  for (let i = 0; i < 50; i++) {
    registro.abrirSesion({ relojPared: pared, resolucion, ejesAcoplados: false });
  }
  assert.equal(registro.sesiones.length, 20);
  // Y el contador de orden NO se reinicia: sigue siendo monotono.
  assert.equal(registro.ordenadas()[19]?.orden, 49);
});

// ---------------------------------------------------------------- AC-8, AC-9

test('test_un_tablero_sin_semilla_se_marca_no_reproducible_y_no_lanza', () => {
  const base = tableroConIntentos(1, 1, 0);
  assert.equal(estadoReproduccion({ ...base, semilla: undefined }, 'v1'), 'noReproducible');
  assert.equal(estadoReproduccion({ ...base, schemaVersion: 'v0' }, 'v1'), 'reproducibleAproximado');
  assert.equal(estadoReproduccion(base, 'v1'), 'reproducible');
});

test('test_la_resolucion_del_reloj_se_registra_con_la_sesion', () => {
  const registro = new Registro();
  /** @type {import('../../../src/plataforma/esquema.js').RelojPared} */
  const pared = { kind: 'pared', now: () => 1_700_000_000_000 };
  const s = registro.abrirSesion({
    relojPared: pared,
    resolucion: { resolucionMs: 25, muestras: 20, fiableParaPresupuesto: false },
    ejesAcoplados: false,
  });
  // Sin este dato, una latencia de 0 ms no se distingue de un fallo de medicion.
  assert.equal(s.resolucionMs, 25);
  assert.equal(s.fiableParaPresupuesto, false);
});

test('test_la_marca_de_ejes_acoplados_viaja_con_la_sesion', () => {
  const registro = new Registro();
  /** @type {import('../../../src/plataforma/esquema.js').RelojPared} */
  const pared = { kind: 'pared', now: () => 1 };
  /** @type {import('../../../src/plataforma/esquema.js').ResolucionReloj} */
  const resolucion = { resolucionMs: 0.1, muestras: 20, fiableParaPresupuesto: true };
  const s = registro.abrirSesion({ relojPared: pared, resolucion, ejesAcoplados: true });
  assert.equal(s.ejesAcoplados, true);
});
