/**
 * El modo registrado tiene que ser el modo REAL.
 *
 * El enlace con el DOM escribía `modo: 'tactil'` a mano para las cinco vías, así que la
 * sesión de un paciente que jugó con pulsador decía «táctil». La barrera AC-2 del sistema 5
 * lo cazó, y tenía razón dos veces: el literal no debía estar ahí, y además era falso.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conModoDeAcceso } from '../../../src/entrada/adaptador.js';

/** @param {import('../../../src/entrada/constantes.js').Modo} modo */
const ev = (modo) => ({
  idObjetivo: 'taza', tActivacion: 10, modo,
  origenTiempo: /** @type {const} */ ('evento'),
});

test('test_sin_barrido_el_modo_no_se_toca', () => {
  for (const m of /** @type {const} */ (['tactil', 'raton', 'teclado', 'pulsador', 'permanencia'])) {
    assert.equal(conModoDeAcceso(ev(m), false).modo, m);
  }
});

test('test_con_barrido_una_tecla_ES_el_pulsador', () => {
  // El navegador no puede distinguirlos: un pulsador de barbilla llega como una tecla. El
  // unico dato que separa las dos vias es la configuracion de acceso.
  assert.equal(conModoDeAcceso(ev('teclado'), true).modo, 'pulsador');
});

test('test_con_barrido_las_OTRAS_vias_no_se_reasignan', () => {
  // Con barrido activo el terapeuta puede seguir tocando la pantalla, y eso es tactil.
  assert.equal(conModoDeAcceso(ev('tactil'), true).modo, 'tactil');
  assert.equal(conModoDeAcceso(ev('raton'), true).modo, 'raton');
  assert.equal(conModoDeAcceso(ev('permanencia'), true).modo, 'permanencia');
});

test('test_no_muta_el_evento_de_entrada', () => {
  const original = ev('teclado');
  conModoDeAcceso(original, true);
  assert.equal(original.modo, 'teclado');
});
