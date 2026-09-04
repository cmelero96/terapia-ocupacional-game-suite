/**
 * La celda de progreso es una CONFIGURACIÓN del terapeuta, no una dificultad realizada.
 *
 * ## El defecto, medido en el navegador
 *
 * Con la configuración **fija** `t = 100, C = 9, sv = 0,25, ss = 0,25`, la `dp` realizada
 * salía **19,2 en unos tableros y 14,2 en otros**: la similitud semántica no siempre se puede
 * servir con el banco que hay, y `ssEfectiva` caía a 0.
 *
 * Agrupando por lo realizado, esa configuración se partía en **dos celdas**. Resultado:
 *
 * ```
 * 8 tableros, 8 aciertos, precisión 1
 * dificultad tolerada: { motivo: "datosInsuficientes" }
 * ```
 *
 * **Ocho aciertos seguidos con una configuración fija, y la métrica del eje de progreso —la
 * razón de ser del producto— decía que faltaban datos.** Cuatro intentos en una celda y cuatro
 * en la otra, y ninguna llegaba a `N_MIN = 5`. Medido: hacían falta 24 tableros para lo que el
 * criterio dice que son cinco intentos.
 *
 * ## El arreglo, y por qué es el correcto y no sólo el que funciona
 *
 * Se agrupa por lo **pedido** y se reporta lo **realizado**.
 *
 * Agrupar por lo pedido es lo correcto conceptualmente: una celda de progreso es una
 * configuración del terapeuta, que es lo que se compara entre sesiones. Y reportar lo
 * realizado conserva la regla que el campo `dp` efectiva existe para cumplir: **la pedida
 * sobrestima cuando el banco no da para lo configurado.**
 *
 * Y la dispersión viaja junto al número, porque «18,0» leído solo parece un ajuste estable.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dificultadTolerada } from '../../../src/dificultad/modelo.js';
import { observacionesPorVariante } from '../../../src/dificultad/contenido.js';
import { presentarDificultadTolerada } from '../../../src/resultados/presentar.js';
import { N_MIN } from '../../../src/dificultad/constantes.js';

/**
 * Un tablero con dificultad pedida y realizada distintas, como los reales.
 *
 * @param {number} pedida
 * @param {number} realizada
 * @param {number} aciertos
 * @param {number} [fallos]
 */
const tab = (pedida, realizada, aciertos, fallos = 0) => ({
  dp: realizada,
  dpPedida: pedida,
  dm: 48,
  contenido: null,
  intentos: [
    ...Array.from({ length: aciertos }, () => ({ correcto: true })),
    ...Array.from({ length: fallos }, () => ({ correcto: false })),
  ],
});

test('test_una_configuracion_FIJA_es_UNA_celda_aunque_lo_realizado_varie', () => {
  // El caso medido: 8 tableros de la misma configuracion, la mitad a 19,2 realizado y la
  // mitad a 14,2. Antes: dos celdas de 4 y `datosInsuficientes`.
  const sesion = {
    tableros: [
      tab(19.2, 19.2, 1), tab(19.2, 19.2, 1), tab(19.2, 19.2, 1), tab(19.2, 19.2, 1),
      tab(19.2, 14.2, 1), tab(19.2, 14.2, 1), tab(19.2, 14.2, 1), tab(19.2, 14.2, 1),
    ],
  };
  const obs = observacionesPorVariante(sesion, 'dp').get(null) ?? [];
  assert.equal(obs.length, 8);
  // Todas las observaciones comparten clave de agrupacion.
  assert.equal(new Set(obs.map((o) => o.d)).size, 1, 'una sola celda');

  const m = dificultadTolerada(obs);
  assert.notEqual(m.valor, undefined, 'ya NO dice datosInsuficientes');
  assert.equal(m.valor, 16.7, 'la media de lo realizado: (19,2·4 + 14,2·4) / 8');
});

test('test_el_valor_reportado_es_lo_REALIZADO_no_lo_pedido', () => {
  // Reportar lo pedido sobrestimaria, que es el defecto que el campo `dp` efectiva existe
  // para evitar. Es la misma regla que en `dificultadRegistrada`.
  const sesion = { tableros: [tab(40, 10, 5)] };
  const m = dificultadTolerada(observacionesPorVariante(sesion, 'dp').get(null) ?? []);
  assert.equal(m.valor, 10, 'lo realizado');
  assert.equal(m.valor === undefined ? -1 : m.pedida, 40, 'y la pedida viaja aparte');
});

test('test_la_DISPERSION_de_lo_realizado_se_publica', () => {
  const sesion = {
    tableros: [tab(19.2, 19.2, 3), tab(19.2, 14.2, 2)],
  };
  const m = dificultadTolerada(observacionesPorVariante(sesion, 'dp').get(null) ?? []);
  assert.equal(m.valor === undefined ? -1 : m.realizadaMin, 14.2);
  assert.equal(m.valor === undefined ? -1 : m.realizadaMax, 19.2);
});

test('test_la_celda_mas_dificil_se_elige_por_lo_PEDIDO', () => {
  // Si se eligiera por lo realizado, una configuracion facil que el banco sirvio "de mas"
  // podria ganarle a una dificil que el banco sirvio "de menos", y el terapeuta veria como
  // maximo tolerado un ajuste que no es el mas alto que puso.
  const sesion = {
    tableros: [
      // Configuracion FACIL, servida generosamente.
      tab(10, 18, 5),
      // Configuracion DIFICIL, servida pobremente. Es la que el terapeuta puso mas alta.
      tab(30, 12, 5),
    ],
  };
  const m = dificultadTolerada(observacionesPorVariante(sesion, 'dp').get(null) ?? []);
  assert.equal(m.valor === undefined ? -1 : m.pedida, 30, 'gana la configuracion mas alta');
  assert.equal(m.valor, 12, 'y se reporta lo que el paciente afronto de verdad');
});

test('test_una_celda_por_debajo_de_N_MIN_sigue_sin_contar', () => {
  // El arreglo no relaja el criterio: sigue haciendo falta el minimo de intentos.
  const sesion = { tableros: [tab(20, 20, N_MIN - 1)] };
  const m = dificultadTolerada(observacionesPorVariante(sesion, 'dp').get(null) ?? []);
  assert.equal(m.valor, undefined);
  assert.equal(m.valor === undefined ? m.motivo : '', 'datosInsuficientes');
});

test('test_una_celda_con_precision_BAJA_sigue_sin_contar', () => {
  const sesion = { tableros: [tab(20, 20, 2, 8)] };
  const m = dificultadTolerada(observacionesPorVariante(sesion, 'dp').get(null) ?? []);
  assert.equal(m.valor, undefined);
  assert.equal(m.valor === undefined ? m.motivo : '', 'datosInsuficientes');
});

test('test_el_eje_MOTOR_no_tiene_pedida_y_realizada', () => {
  // El tamaño de objetivo es el que es: no hay banco que pueda servirlo peor.
  const sesion = { tableros: [tab(19.2, 14.2, 5)] };
  const obs = observacionesPorVariante(sesion, 'dm').get(null) ?? [];
  assert.equal(obs[0]?.d, 48);
  assert.equal(obs[0]?.dRealizada, 48, 'la misma en los dos campos');
});

// ---------------------------------------------------------------- la presentación

test('test_la_dispersion_viaja_JUNTO_al_numero', () => {
  // «18,0» leido solo parece un ajuste estable, y no lo es.
  const sesion = { tableros: [tab(19.2, 19.2, 3), tab(19.2, 14.2, 2)] };
  const m = dificultadTolerada(observacionesPorVariante(sesion, 'dp').get(null) ?? []);
  const p = presentarDificultadTolerada(m, 'perceptivo');
  assert.equal(p.tieneDato, true);
  assert.match(p.valor, /configuraste 19\.2/);
  assert.match(p.valor, /entre 14\.2 y 19\.2/);
  assert.match(p.valor, /media/);
});

test('test_sin_dispersion_NO_se_añade_la_nota', () => {
  // Una nota permanente se convierte en ruido y deja de leerse.
  const sesion = { tableros: [tab(20, 20, 5)] };
  const m = dificultadTolerada(observacionesPorVariante(sesion, 'dp').get(null) ?? []);
  const p = presentarDificultadTolerada(m, 'perceptivo');
  assert.doesNotMatch(p.valor, /configuraste/);
  assert.match(p.valor, /^20\.0$/);
});

test('test_la_limitacion_de_escala_sigue_viajando_con_el_numero', () => {
  // La nota de dispersion no puede haber desplazado la de escala.
  const sesion = { tableros: [tab(19.2, 19.2, 3), tab(19.2, 14.2, 2)] };
  const m = dificultadTolerada(observacionesPorVariante(sesion, 'dp').get(null) ?? []);
  const p = presentarDificultadTolerada(m, 'perceptivo');
  assert.ok((p.limitacion ?? '').length > 0, 'la limitacion de escala sigue ahi');
});
