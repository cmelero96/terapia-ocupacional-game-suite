/**
 * Intentos incompletos. Bloqueante S4 del informe cruzado del 2026-08-26.
 *
 * `panel-terapeuta.md` prometía: *"el tablero se descarta y sus intentos parciales se
 * conservan marcados como incompletos."* No existía el campo.
 *
 * **Los intentos se conservan, no se descartan.** Un fallo es un fallo, y descartarlos
 * inventaría un dato mejor que el real. Lo que se hace es marcar el tablero y publicar el
 * recuento, para que el sesgo viaje junto al número.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resumenSesion } from '../../../src/registro/sesion.js';
import { presentarPrecision } from '../../../src/resultados/presentar.js';

/**
 * @param {{ aciertos: number, fallos: number, incompleto: boolean }} spec
 * @returns {import('../../../src/registro/sesion.js').TableroRegistrado}
 */
function tablero({ aciertos, fallos, incompleto }) {
  /** @type {import('../../../src/registro/sesion.js').Intento[]} */
  const intentos = [];
  for (let i = 0; i < fallos; i++) {
    intentos.push({ idActivado: `mal-${i}`, correcto: false, latencia: { ms: 900 } });
  }
  for (let i = 0; i < aciertos; i++) {
    intentos.push({ idActivado: `bien-${i}`, correcto: true, latencia: { ms: 600 } });
  }
  return {
    objetivo: 'obj', distractores: [], semilla: 1, schemaVersion: 'v1',
    dm: 48, dp: 20, dpPedida: 20, intentos, instrumento: 'busca', contenido: null, incompleto,
  };
}

/** @param {import('../../../src/registro/sesion.js').TableroRegistrado[]} tableros */
const sesion = (tableros) => ({
  orden: 0, selloPared: 0, resolucionMs: 0.1, fiableParaPresupuesto: true,
  ejesAcoplados: false, tableros,
});

test('test_los_intentos_de_un_tablero_incompleto_SIGUEN_contando', () => {
  // Descartarlos inventaria una precision mejor que la real. El pilar de la medicion es
  // que el dato registrado sea el que paso.
  const s = sesion([
    tablero({ aciertos: 1, fallos: 1, incompleto: false }),
    tablero({ aciertos: 0, fallos: 2, incompleto: true }),
  ]);
  const r = resumenSesion(s);
  assert.equal(r.intentos, 4, 'los cuatro intentos estan');
  assert.equal(r.aciertos, 1);
  assert.equal(r.precision, 0.25);
});

test('test_el_resumen_cuenta_los_tableros_incompletos_y_sus_intentos', () => {
  const s = sesion([
    tablero({ aciertos: 1, fallos: 0, incompleto: false }),
    tablero({ aciertos: 0, fallos: 2, incompleto: true }),
    tablero({ aciertos: 0, fallos: 3, incompleto: true }),
  ]);
  const r = resumenSesion(s);
  assert.equal(r.tableros, 3);
  assert.equal(r.tablerosIncompletos, 2);
  assert.equal(r.intentosIncompletos, 5, 'los intentos que viven en tableros truncados');
});

test('test_sin_tableros_incompletos_los_recuentos_son_CERO_y_no_undefined', () => {
  // Un 0 aqui SI es un valor legitimo: significa "ninguno", no "sin dato". La regla contra
  // los ceros del sistema 12 es sobre metricas que no se pueden calcular, no sobre conteos.
  const r = resumenSesion(sesion([tablero({ aciertos: 2, fallos: 0, incompleto: false })]));
  assert.equal(r.tablerosIncompletos, 0);
  assert.equal(r.intentosIncompletos, 0);
});

test('test_la_precision_LLEVA_la_nota_en_el_mismo_texto', () => {
  // Dos textos separados se leen por separado, y el que matiza se pierde. Misma regla que
  // la latencia y la limitacion de escala.
  const con = presentarPrecision(resumenSesion(sesion([
    tablero({ aciertos: 1, fallos: 0, incompleto: false }),
    tablero({ aciertos: 0, fallos: 2, incompleto: true }),
  ])));
  assert.match(con.valor, /sin terminar/);
  assert.match(con.valor, /2 de 1 tablero sin terminar/);
  // Y dice la DIRECCION del sesgo: sale mas bajo que el real.
  assert.match(con.valor, /más bajo que el real/);
});

test('test_sin_incompletos_la_precision_NO_lleva_nota', () => {
  // Una nota permanente se convierte en ruido y deja de leerse.
  const sin = presentarPrecision(resumenSesion(sesion([
    tablero({ aciertos: 8, fallos: 2, incompleto: false }),
  ])));
  assert.doesNotMatch(sin.valor, /sin terminar/);
  assert.match(sin.valor, /80 %/);
});

test('test_el_plural_de_la_nota_es_correcto', () => {
  const uno = presentarPrecision(resumenSesion(sesion([
    tablero({ aciertos: 0, fallos: 1, incompleto: true }),
  ])));
  assert.match(uno.valor, /1 tablero sin terminar/);

  const dos = presentarPrecision(resumenSesion(sesion([
    tablero({ aciertos: 0, fallos: 1, incompleto: true }),
    tablero({ aciertos: 0, fallos: 1, incompleto: true }),
  ])));
  assert.match(dos.valor, /2 tableros sin terminar/);
});

test('test_la_DIRECCION_del_sesgo_es_la_que_dice_la_nota', () => {
  // El ultimo intento de un tablero completo es, por construccion, el acierto que lo cerro.
  // Truncar quita ese acierto y deja los fallos. Verificado con numeros, no afirmado.
  const completo = sesion([
    tablero({ aciertos: 1, fallos: 2, incompleto: false }),
    tablero({ aciertos: 1, fallos: 2, incompleto: false }),
  ]);
  const truncado = sesion([
    tablero({ aciertos: 1, fallos: 2, incompleto: false }),
    // El mismo tablero, cortado antes del acierto final.
    tablero({ aciertos: 0, fallos: 2, incompleto: true }),
  ]);
  const a = /** @type {number} */ (resumenSesion(completo).precision);
  const b = /** @type {number} */ (resumenSesion(truncado).precision);
  assert.ok(b < a, `truncado ${b} deberia ser menor que completo ${a}`);
});
