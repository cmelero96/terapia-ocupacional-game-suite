/**
 * Sistema 3 — criterios de aceptacion del borde impuro.
 * Cubre AC-4, AC-6 y AC-8 de design/gdd/inyeccion-no-determinismo.md
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  envolverConValidacion,
  crearFuenteDeProduccion,
  semillaProduccion,
  relojMonotono,
  relojPared,
  medirResolucionReloj,
} from '../../../src/plataforma/borde-impuro.js';
import { crearFuenteAleatoria } from '../../../src/plataforma/aleatoriedad.js';

// ---------------------------------------------------------------- AC-4

test('test_fuente_fuera_de_rango_lanza_RangeError_nombrando_valor_y_rango', () => {
  for (const malo of [1.0, -0.001, NaN, Infinity, 2]) {
    const fuente = envolverConValidacion(() => malo);
    assert.throws(
      fuente,
      (/** @type {unknown} */ err) => {
        assert.ok(err instanceof RangeError, `${String(malo)}: no es RangeError`);
        assert.match(err.message, /\[0, 1\)/);
        assert.ok(err.message.includes(String(malo)), `${String(malo)}: no nombra el valor`);
        return true;
      },
      `la salida ${String(malo)} deberia lanzar`,
    );
  }
});

test('test_fuente_en_rango_pasa_sin_alterar_el_valor', () => {
  for (const bueno of [0, 0.42, 0.9999999999]) {
    assert.equal(envolverConValidacion(() => bueno)(), bueno);
  }
});

test('test_la_validacion_ocurre_en_cada_llamada_no_solo_en_la_primera', () => {
  let i = 0;
  const fuente = envolverConValidacion(() => (i++ === 0 ? 0.5 : 1.5));
  assert.equal(fuente(), 0.5);
  assert.throws(fuente, RangeError);
});

test('test_la_fuente_envuelta_lleva_la_marca', () => {
  const fuente = envolverConValidacion(() => 0.42);
  assert.equal(fuente.kind, 'aleatoria');
});

// ---------------------------------------------------------------- AC-6

test('test_la_fabrica_devuelve_la_semilla_junto_a_la_fuente', () => {
  const { semilla, fuenteAleatoria } = crearFuenteDeProduccion();
  assert.equal(typeof semilla, 'number');
  assert.ok(Number.isInteger(semilla) && semilla >= 0 && semilla <= 4294967295);
  assert.equal(typeof fuenteAleatoria, 'function');
  assert.equal(fuenteAleatoria.kind, 'aleatoria');
});

test('test_la_semilla_registrada_reproduce_la_misma_secuencia', () => {
  // Es la propiedad clinica entera: con la semilla guardada, el tablero se reconstruye.
  const { semilla, fuenteAleatoria } = crearFuenteDeProduccion();
  const original = Array.from({ length: 10 }, () => fuenteAleatoria());

  // Y ahora, solo con el entero guardado:
  const rehecha = envolverConValidacion(crearFuenteAleatoria(semilla));
  assert.deepStrictEqual(Array.from({ length: 10 }, () => rehecha()), original);
});

test('test_dos_llamadas_a_la_fabrica_dan_semillas_distintas', () => {
  // Con Date.now() como fuente, dos tableros del mismo milisegundo colisionarian.
  const semillas = new Set(
    Array.from({ length: 200 }, () => crearFuenteDeProduccion().semilla),
  );
  assert.ok(semillas.size > 195, `demasiadas colisiones: ${200 - semillas.size}`);
});

test('test_semillaProduccion_devuelve_un_uint32', () => {
  for (let i = 0; i < 50; i++) {
    const s = semillaProduccion();
    assert.ok(Number.isInteger(s) && s >= 0 && s <= 4294967295, `fuera de rango: ${s}`);
  }
});

// ---------------------------------------------------------------- AC-8

test('test_latencia_con_reloj_monotono_inyectado', () => {
  /** @param {import('../../../src/plataforma/esquema.js').RelojMonotono} reloj */
  const latencia = (reloj) => {
    const t0 = reloj.now();
    const t1 = reloj.now();
    return t1 - t0;
  };

  let i = 0;
  const lecturas = [1000, 1016];
  /** @type {import('../../../src/plataforma/esquema.js').RelojMonotono} */
  const falso = { kind: 'monotono', now: () => /** @type {number} */ (lecturas[i++]) };

  assert.equal(latencia(falso), 16);
});

test('test_el_reloj_de_pared_no_expone_una_operacion_de_diferencia', () => {
  // El contrato es `{ kind, now }` y nada mas. No hay `desde()`, ni `entre()`, ni
  // `elapsed()`: la operacion no existe, asi que no hay convencion que recordar.
  assert.deepStrictEqual(Object.keys(relojPared).sort(), ['kind', 'now']);
  assert.deepStrictEqual(Object.keys(relojMonotono).sort(), ['kind', 'now']);
});

test('test_los_dos_relojes_llevan_marca_distinta', () => {
  assert.equal(relojMonotono.kind, 'monotono');
  assert.equal(relojPared.kind, 'pared');
  assert.notEqual(relojMonotono.kind, relojPared.kind);
});

test('test_el_reloj_monotono_no_decrece', () => {
  let anterior = relojMonotono.now();
  for (let i = 0; i < 10000; i++) {
    const ahora = relojMonotono.now();
    assert.ok(ahora >= anterior, `el reloj retrocedio: ${anterior} -> ${ahora}`);
    anterior = ahora;
  }
});

// ---------------------------------------------------------------- resolucion del reloj

test('test_medirResolucionReloj_devuelve_un_valor_positivo_y_su_veredicto', () => {
  const r = medirResolucionReloj();
  assert.ok(r.resolucionMs > 0, 'la resolucion debe ser positiva, nunca 0');
  assert.ok(r.muestras > 0);
  assert.equal(r.fiableParaPresupuesto, r.resolucionMs <= 10);
  // Informativo: es el dato que el sistema 9 debe registrar con cada sesion.
  console.log(
    `      resolucion del reloj monotono: ${r.resolucionMs.toFixed(6)} ms ` +
      `(${r.muestras} muestras) — fiable para el presupuesto de 100 ms: ${r.fiableParaPresupuesto}`,
  );
});
