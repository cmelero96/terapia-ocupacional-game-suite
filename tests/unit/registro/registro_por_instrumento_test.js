/**
 * La precisión de una sesión que mezcla instrumentos. Sistema 9 · sistema 12.
 *
 * ## El defecto, medido
 *
 * Desde que cambiar de juego conserva la sesión, una sesión con varios ejercicios es el caso
 * NORMAL: el terapeuta hace tres seguidos con el mismo paciente.
 *
 * Y eso rompió la precisión de sesión. Medido en el navegador: **2 aciertos de 2 en Busca y 0
 * de 3 en Precio justo daban un 40 %** — un número que no le pasó al paciente en ninguno de
 * los dos ejercicios.
 *
 * Es el mismo defecto que el eje de contenido evitó particionando, una capa más arriba. Y la
 * respuesta es la que el proyecto ya usa tres veces: **antes falta de dato que dato falso.**
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resumenSesion } from '../../../src/registro/sesion.js';
import { presentarPrecision, presentarPorInstrumento } from '../../../src/resultados/presentar.js';

/**
 * @param {string} instrumento
 * @param {number} aciertos
 * @param {number} fallos
 * @returns {import('../../../src/registro/sesion.js').TableroRegistrado}
 */
function tablero(instrumento, aciertos, fallos) {
  /** @type {import('../../../src/registro/sesion.js').Intento[]} */
  const intentos = [];
  for (let i = 0; i < fallos; i++) {
    intentos.push({ idActivado: `mal-${i}`, correcto: false, latencia: { ms: 900 } });
  }
  for (let i = 0; i < aciertos; i++) {
    intentos.push({ idActivado: `bien-${i}`, correcto: true, latencia: { ms: 600 } });
  }
  return {
    objetivo: 'o', distractores: [], semilla: 1, schemaVersion: 'v1',
    dm: 48, dp: 20, dpPedida: 20, intentos, instrumento, contenido: null, incompleto: false,
  };
}

/** @param {import('../../../src/registro/sesion.js').TableroRegistrado[]} tableros */
const sesion = (tableros) => ({
  orden: 0, selloPared: 0, resolucionMs: 0.1, fiableParaPresupuesto: true,
  ejesAcoplados: false, tableros,
});

test('test_con_UN_instrumento_la_precision_de_sesion_SI_existe', () => {
  const r = resumenSesion(sesion([tablero('busca', 8, 2)]));
  assert.equal(r.precision, 0.8);
  assert.equal(r.motivoPrecision, undefined);
  assert.deepStrictEqual(r.instrumentos, ['busca']);
});

test('test_con_DOS_instrumentos_la_precision_de_sesion_NO_existe', () => {
  // El caso medido. Un 40 % aqui seria un numero que no le paso a nadie.
  const r = resumenSesion(sesion([tablero('busca', 2, 0), tablero('precios', 0, 3)]));
  assert.equal(r.precision, undefined, 'no hay precision de sesion');
  assert.equal(r.motivoPrecision, 'instrumentosMezclados');
  // Y NO existe una version "pooled" disponible: si existiera, alguien la leeria.
  assert.equal(/** @type {any} */ (r).precisionMezclada, undefined);
});

test('test_el_desglose_da_la_precision_REAL_de_cada_ejercicio', () => {
  const r = resumenSesion(sesion([tablero('busca', 2, 0), tablero('precios', 0, 3)]));
  assert.equal(r.porInstrumento.get('busca')?.precision, 1);
  assert.equal(r.porInstrumento.get('precios')?.precision, 0);
  assert.equal(r.porInstrumento.get('busca')?.intentos, 2);
  assert.equal(r.porInstrumento.get('precios')?.intentos, 3);
});

test('test_los_instrumentos_van_en_ORDEN_DE_APARICION', () => {
  // El orden en que el terapeuta los hizo. Alfabetico perderia la secuencia de la sesion.
  const r = resumenSesion(sesion([
    tablero('precios', 1, 0), tablero('busca', 1, 0), tablero('comprar', 1, 0),
  ]));
  assert.deepStrictEqual(r.instrumentos, ['precios', 'busca', 'comprar']);
});

test('test_varios_tableros_del_MISMO_instrumento_se_suman', () => {
  const r = resumenSesion(sesion([
    tablero('busca', 1, 1), tablero('busca', 3, 0), tablero('precios', 0, 2),
  ]));
  assert.deepStrictEqual(r.instrumentos, ['busca', 'precios']);
  assert.equal(r.porInstrumento.get('busca')?.intentos, 5);
  assert.equal(r.porInstrumento.get('busca')?.aciertos, 4);
});

test('test_sin_intentos_el_motivo_es_datosInsuficientes_y_NO_instrumentosMezclados', () => {
  // Los dos motivos son distinguibles a proposito: uno se arregla jugando y el otro mirando
  // el desglose.
  const r = resumenSesion(sesion([]));
  assert.equal(r.precision, undefined);
  assert.equal(r.motivoPrecision, 'datosInsuficientes');
});

test('test_el_texto_de_la_precision_MEZCLADA_manda_al_desglose', () => {
  const r = resumenSesion(sesion([tablero('busca', 2, 0), tablero('precios', 0, 3)]));
  const p = presentarPrecision(r);
  assert.equal(p.tieneDato, false);
  assert.match(p.valor, /2 ejercicios distintos/);
  assert.match(p.valor, /no se puede promediar/);
  assert.match(p.valor, /desglose/);
  // Y NO aparece ningun porcentaje de sesion en ese texto.
  assert.doesNotMatch(p.valor, /\d+ %/);
});

test('test_el_desglose_NO_publica_un_total', () => {
  // El total es justamente el numero que no significa nada.
  const r = resumenSesion(sesion([tablero('busca', 2, 0), tablero('precios', 0, 3)]));
  const filas = presentarPorInstrumento(r, { busca: 'Busca / Lince', precios: 'Precio justo' });
  assert.equal(filas.length, 2);
  assert.deepStrictEqual(filas.map((f) => f.etiqueta), ['Busca / Lince', 'Precio justo']);
  assert.match(/** @type {any} */ (filas[0]).valor, /100 % — 2 de 2/);
  assert.match(/** @type {any} */ (filas[1]).valor, /0 % — 0 de 3/);
  for (const f of filas) assert.doesNotMatch(f.etiqueta, /total/i);
});

test('test_un_instrumento_sin_etiqueta_usa_su_identificador', () => {
  // Un instrumento nuevo no debe salir con la etiqueta en blanco.
  const r = resumenSesion(sesion([tablero('inventado', 1, 0), tablero('busca', 1, 0)]));
  const filas = presentarPorInstrumento(r, { busca: 'Busca / Lince' });
  assert.equal(filas[0]?.etiqueta, 'inventado');
});
