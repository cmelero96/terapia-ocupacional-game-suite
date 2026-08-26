/**
 * Sistema 3 — criterios de aceptacion del modulo puro de aleatoriedad.
 * Cubre AC-4b, AC-5 y AC-5b de design/gdd/inyeccion-no-determinismo.md
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearFuenteAleatoria, barajar } from '../../../src/plataforma/aleatoriedad.js';

// --- Canarios de igualdad exacta. Verificados por ejecucion antes de publicarse. ---

const CANARIO_42 = [
  0.6011037519201636,
  0.44829055899754167,
  0.8524657934904099,
  0.6697340414393693,
  0.17481389874592423,
  0.5265925421845168,
];

const CANARIO_0 = [
  0.26642920868471265,
  0.0003297457005828619,
  0.2232720274478197,
  0.1462021479383111,
];

/** @param {number} semilla @param {number} n */
function extraer(semilla, n) {
  const f = crearFuenteAleatoria(semilla);
  return Array.from({ length: n }, () => f());
}

// ---------------------------------------------------------------- AC-5b

test('test_canario_semilla_42_es_exactamente_el_publicado', () => {
  assert.deepStrictEqual(extraer(42, 6), CANARIO_42);
});

test('test_canario_semilla_0_es_exactamente_el_publicado', () => {
  // Sirve doble: fija el extremo inferior, y detecta una regresion de la guarda de
  // AC-4b, porque es la secuencia que produciria un `undefined` colado.
  assert.deepStrictEqual(extraer(0, 4), CANARIO_0);
});

// ---------------------------------------------------------------- AC-5

test('test_semilla_fija_produce_secuencia_identica', () => {
  // N >= 20 no es decorativo: con N = 1 el criterio es casi trivial, y un bug de
  // aliasing —el estado en el ambito del modulo en lugar de dentro del cierre— no se
  // manifiesta hasta la segunda o tercera llamada.
  assert.deepStrictEqual(extraer(12345, 20), extraer(12345, 20));
});

test('test_dos_fuentes_con_semillas_distintas_no_comparten_estado', () => {
  const a = crearFuenteAleatoria(1);
  const b = crearFuenteAleatoria(1);
  a();
  a();
  // Si el estado viviera en el ambito del modulo, `b` habria avanzado con `a`.
  assert.equal(b(), extraer(1, 1)[0]);
});

test('test_toda_salida_esta_en_el_rango_semiabierto', () => {
  const f = crearFuenteAleatoria(777);
  for (let i = 0; i < 100000; i++) {
    const v = f();
    assert.ok(v >= 0 && v < 1, `salida fuera de [0, 1): ${v}`);
  }
});

// ---------------------------------------------------------------- AC-4b

test('test_semilla_no_uint32_lanza_RangeError', () => {
  const invalidas = [undefined, NaN, null, -1, 3.7, 4294967296, '42', {}, Infinity];
  for (const v of invalidas) {
    assert.throws(
      () => crearFuenteAleatoria(/** @type {any} */ (v)),
      (/** @type {unknown} */ err) => {
        assert.ok(err instanceof RangeError, `${String(v)}: no es RangeError`);
        assert.match(err.message, /se esperaba entero en \[0, 4294967295\]/);
        assert.ok(
          err.message.includes(String(v)),
          `${String(v)}: el mensaje no nombra el valor recibido`,
        );
        return true;
      },
      `la semilla ${String(v)} deberia lanzar`,
    );
  }
});

test('test_los_extremos_del_rango_son_validos', () => {
  assert.doesNotThrow(() => crearFuenteAleatoria(0));
  assert.doesNotThrow(() => crearFuenteAleatoria(4294967295));
});

// ---------------------------------------------------------------- F2, barajar

test('test_barajar_reproduce_el_ejemplo_trabajado', () => {
  const entrada = ['tomate', 'cereza', 'fresa', 'pera', 'uva'];
  const salida = barajar(entrada, crearFuenteAleatoria(42));
  assert.deepStrictEqual(salida, ['tomate', 'uva', 'fresa', 'cereza', 'pera']);
});

test('test_barajar_no_muta_la_entrada', () => {
  const entrada = ['a', 'b', 'c', 'd', 'e'];
  const copia = entrada.slice();
  barajar(entrada, crearFuenteAleatoria(1));
  assert.deepStrictEqual(entrada, copia);
});

test('test_barajar_conserva_el_multiconjunto', () => {
  const entrada = ['a', 'a', 'b', 'c', undefined, null, 0];
  const salida = barajar(entrada, crearFuenteAleatoria(9));
  assert.equal(salida.length, entrada.length);
  assert.deepStrictEqual([...salida].sort(), [...entrada].sort());
});

test('test_barajar_consume_max_0_n_menos_1_llamadas', () => {
  // La formula `n - 1` sin la guarda da -1 para n = 0. El conteo real es 0.
  for (const n of [0, 1, 2, 3, 5, 24]) {
    let llamadas = 0;
    const contador = () => {
      llamadas++;
      return 0.5;
    };
    barajar(Array.from({ length: n }, (_, k) => k), contador);
    assert.equal(llamadas, Math.max(0, n - 1), `n = ${n}`);
  }
});

test('test_barajar_nunca_produce_un_indice_fuera_de_rango', () => {
  // El extremo superior de F1: con r_max fijo, floor(r_max * n) debe dar n - 1 y no n.
  const rMax = (2 ** 32 - 1) / 2 ** 32;
  for (const n of [2, 5, 24, 100, 384, 1000]) {
    const salida = barajar(Array.from({ length: n }, (_, k) => k), () => rMax);
    assert.equal(salida.length, n);
    assert.deepStrictEqual([...salida].sort((a, b) => a - b), Array.from({ length: n }, (_, k) => k));
  }
});

test('test_una_fuente_constante_cercana_a_1_devuelve_la_identidad', () => {
  // Trampa documentada para quien escriba tests de F2: llama a la fuente el numero
  // correcto de veces, devuelve un array del tamaño correcto, y NO reordena nada.
  const rMax = (2 ** 32 - 1) / 2 ** 32;
  const base = ['a', 'b', 'c', 'd', 'e'];
  assert.deepStrictEqual(barajar(base, () => rMax), base);
  // Contraste, para que quede claro que el test de arriba detecta algo real.
  assert.notDeepStrictEqual(barajar(base, crearFuenteAleatoria(42)), base);
});
