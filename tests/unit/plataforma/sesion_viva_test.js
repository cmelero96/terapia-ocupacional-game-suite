/**
 * Reconfigurar sin recargar. Regresión del bloqueante S1 del informe cruzado.
 *
 * El defecto medido era: aplicar una configuración hacía `location.href = url`, la página
 * se recargaba, y el registro —que vive en memoria— desaparecía con ella. Dos tableros y
 * dos intentos borrados en silencio, en el flujo CENTRAL del producto.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearSesionViva } from '../../../src/plataforma/sesion-viva.js';
import { dm } from '../../../src/dificultad/modelo.js';
import { BANCO_PRUEBA } from '../../fixtures/banco-prueba.js';

/** Un DOM mínimo: la sesión viva monta de verdad, así que necesita dónde montar. */
function domFalso() {
  globalThis.document = /** @type {any} */ ({
    createElement: () => elemento(),
    querySelector: () => null,
    querySelectorAll: () => [],
    body: elemento(),
    documentElement: elemento(),
    activeElement: null,
  });
  globalThis.matchMedia = /** @type {any} */ (() => ({ matches: false }));
  return { raiz: elemento(), zonaObjetivo: elemento(), zonaContenedores: elemento() };
}

function elemento() {
  /** @type {any} */
  const el = {
    dataset: {}, style: { setProperty() {}, getPropertyValue: () => '' },
    classList: { add() {}, remove() {}, toggle() {} },
    children: [], hidden: false, textContent: '',
    append() {}, appendChild() {}, replaceChildren() {}, remove() {},
    addEventListener() {}, removeEventListener() {}, focus() {},
    setAttribute() {}, removeAttribute() {}, getAttribute: () => null,
    querySelector: () => null, querySelectorAll: () => [],
  };
  return el;
}

test('test_reconfigurar_CONSERVA_los_tableros_ya_cerrados', () => {
  const zonas = domFalso();
  const viva = crearSesionViva({
    ...zonas, tipo: 'busca', banco: [...BANCO_PRUEBA],
    config: { t: 60, C: 6, sv: 0.3, ss: 0.3 },
  });

  // Cierra dos tableros jugando de verdad.
  for (let i = 0; i < 2; i++) {
    const inst = viva.estado.instrumento;
    inst.activar(
      { idObjetivo: inst.tablero.objetivo, tActivacion: 1, modo: 'tactil', origenTiempo: 'evento' },
      { ms: 300 },
    );
    viva.estado.cerrarTablero();
  }
  const antes = viva.sesion.tableros.length;
  assert.equal(antes, 2, 'preparacion: debe haber dos tableros cerrados');
  const ordenAntes = viva.sesion.orden;

  viva.reconfigurar({ config: { t: 100, C: 9, sv: 0.5, ss: 0.2 } });

  assert.ok(viva.sesion.tableros.length >= antes, 'los tableros cerrados NO desaparecen');
  assert.equal(viva.sesion.orden, ordenAntes, 'es la MISMA sesion, no una nueva');
  assert.equal(viva.estado.instrumento.t, 100, 'la configuracion nueva SI se aplica');
});

test('test_reconfigurar_cierra_el_tablero_EN_CURSO_antes_de_cambiar', () => {
  // Sus intentos pertenecen a la configuracion con la que se jugaron. Atribuirlos a la
  // nueva sobrestimaria o subestimaria la dificultad tolerada, que es el defecto S2.
  const zonas = domFalso();
  const viva = crearSesionViva({
    ...zonas, tipo: 'busca', banco: [...BANCO_PRUEBA],
    config: { t: 60, C: 6, sv: 0.3, ss: 0.3 },
  });
  const inst = viva.estado.instrumento;
  const tPrevio = inst.t;
  inst.activar(
    { idObjetivo: inst.tablero.objetivo, tActivacion: 1, modo: 'tactil', origenTiempo: 'evento' },
    { ms: 300 },
  );

  viva.reconfigurar({ config: { t: 120, C: 6, sv: 0.3, ss: 0.3 } });

  const cerrado = viva.sesion.tableros[0];
  assert.ok(cerrado !== undefined, 'el tablero en curso debe haberse cerrado');
  assert.equal(cerrado.intentos.length, 1);
  // Su `dm` es el del tamaño VIEJO, no el del nuevo.
  assert.ok(Math.abs(cerrado.dm - dm(tPrevio)) < 1e-9, 'dm del tamaño con el que se jugo');
});

test('test_la_marca_de_ejes_acoplados_se_ENDURECE_y_no_se_relaja', () => {
  // Una sesion en la que en algun momento `t < 44` tiene la medicion perceptiva
  // contaminada, aunque despues se suba el tamaño.
  const zonas = domFalso();
  const viva = crearSesionViva({
    ...zonas, tipo: 'busca', banco: [...BANCO_PRUEBA],
    config: { t: 100, C: 6, sv: 0.3, ss: 0.3 },
  });
  assert.equal(viva.sesion.ejesAcoplados, false);

  viva.reconfigurar({ config: { t: 30, C: 6, sv: 0.3, ss: 0.3 } });
  assert.equal(viva.sesion.ejesAcoplados, true, 'un tamaño por debajo de 44 la marca');

  viva.reconfigurar({ config: { t: 100, C: 6, sv: 0.3, ss: 0.3 } });
  assert.equal(viva.sesion.ejesAcoplados, true, 'y subir el tamaño NO la borra');
});
