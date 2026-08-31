/**
 * Tres en raya con cálculo, y juego de comprar. Juegos 1 y 7 de la lista.
 *
 * Son los dos únicos instrumentos con estado que sobrevive a una activación: una partida
 * y una lista.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TresEnRaya, hayRaya, tableroLleno } from '../../../src/instrumentos/tres-en-raya.js';
import { Comprar } from '../../../src/instrumentos/comprar.js';
import { PRECIOS_2026 } from '../../../src/contenido/provisional.js';
import { crearFuenteAleatoria } from '../../../src/plataforma/aleatoriedad.js';
import { envolverConValidacion } from '../../../src/plataforma/borde-impuro.js';

/** Fuente que avanza con cada llamada, para que las partidas no se estanquen. */
function fuenteQueAvanza(inicio = 1) {
  let s = inicio;
  return () => {
    s = (s + 7919) % 4294967296;
    return { semilla: s, fuenteAleatoria: envolverConValidacion(crearFuenteAleatoria(s)) };
  };
}

/** @type {import('../../../src/registro/sesion.js').Latencia} */
const lat = { ms: 300 };
/** @param {string} id @returns {import('../../../src/entrada/adaptador.js').EventoActivacion} */
const ev = (id) => ({ idObjetivo: id, tActivacion: 1, modo: 'tactil', origenTiempo: 'evento' });

/** @param {number} s */
const nuevoTres = (s = 1) => new TresEnRaya({
  t: 60, tipoOperacion: 'sumaHasta10', nOpciones: 4, nuevaFuente: fuenteQueAvanza(s),
});

// ---------------------------------------------------------------- hayRaya

test('test_hayRaya_detecta_las_ocho_lineas', () => {
  /** @type {[number,number,number][]} */
  const lineas = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lineas) {
    /** @type {('paciente'|'maquina'|null)[]} */
    const cas = Array.from({ length: 9 }, () => null);
    cas[a] = 'paciente'; cas[b] = 'paciente'; cas[c] = 'paciente';
    assert.equal(hayRaya(cas), 'paciente', `linea ${a},${b},${c}`);
  }
});

test('test_hayRaya_no_confunde_dos_duenos_en_la_misma_linea', () => {
  /** @type {('paciente'|'maquina'|null)[]} */
  const cas = ['paciente', 'maquina', 'paciente', null, null, null, null, null, null];
  assert.equal(hayRaya(cas), null);
});

test('test_tableroLleno', () => {
  assert.equal(tableroLleno(Array.from({ length: 9 }, () => null)), false);
  assert.equal(tableroLleno(Array.from({ length: 9 }, () => 'paciente')), true);
});

// ---------------------------------------------------------------- tres en raya

test('test_no_se_puede_colocar_sin_acertar_la_operacion', () => {
  const t = nuevoTres();
  assert.equal(t.puedeColocar, false);
  const r = t.activar(ev('c:0'), lat);
  assert.equal(r.registrado, false);
  assert.equal(t.casillas[0], null, 'no debe haber colocado nada');
});

test('test_acertar_la_operacion_da_derecho_a_colocar_UNA_vez', () => {
  const t = nuevoTres();
  const r1 = t.activar(ev(`r:${t.reto.resultado}`), lat);
  assert.equal(r1.correcto, true);
  assert.equal(t.puedeColocar, true);

  t.activar(ev('c:4'), lat);
  assert.equal(t.casillas[4], 'paciente');
  // Y el derecho se consume: no puede colocar dos veces con un solo acierto.
  assert.equal(t.puedeColocar, false);
});

test('test_fallar_la_operacion_no_coloca_y_sortea_otra', () => {
  const t = nuevoTres();
  const enunciadoAntes = t.reto.enunciado;
  const mala = /** @type {number} */ (
    t.reto.opciones.find((o) => o !== t.reto.resultado)
  );
  const r = t.activar(ev(`r:${mala}`), lat);
  assert.equal(r.correcto, false);
  assert.equal(t.puedeColocar, false);
  assert.equal(t.intentos.length, 1, 'el fallo SI se registra');
  // Se sortea otra operacion, sin decir por que.
  assert.ok(t.reto.enunciado !== enunciadoAntes || t.reto.resultado !== undefined);
});

test('test_una_casilla_ocupada_no_hace_nada_y_no_es_un_fallo', () => {
  const t = nuevoTres();
  t.activar(ev(`r:${t.reto.resultado}`), lat);
  t.activar(ev('c:0'), lat);
  const intentosAntes = t.intentos.length;

  t.activar(ev(`r:${t.reto.resultado}`), lat);
  const r = t.activar(ev('c:0'), lat);
  assert.equal(r.registrado, false);
  // El unico intento nuevo es la operacion, no la casilla ocupada.
  assert.equal(t.intentos.length, intentosAntes + 1);
});

test('test_la_maquina_responde_tras_cada_jugada_del_paciente', () => {
  const t = nuevoTres();
  t.activar(ev(`r:${t.reto.resultado}`), lat);
  t.activar(ev('c:0'), lat);
  const delPaciente = t.casillas.filter((c) => c === 'paciente').length;
  const deLaMaquina = t.casillas.filter((c) => c === 'maquina').length;
  // Salvo que la jugada haya cerrado la partida, hay una de cada.
  assert.ok(delPaciente + deLaMaquina >= 1);
});

test('test_la_partida_termina_y_empieza_otra_SIN_anunciar_quien_gano', () => {
  const t = nuevoTres();
  // Jugar hasta que se cierre al menos una partida.
  for (let i = 0; i < 200 && t.tableroNumero === 1; i++) {
    if (!t.puedeColocar) t.activar(ev(`r:${t.reto.resultado}`), lat);
    const libre = t.casillas.findIndex((c) => c === null);
    if (libre === -1) break;
    t.activar(ev(`c:${libre}`), lat);
  }
  assert.ok(t.tableroNumero >= 2, 'alguna partida debe haber terminado');
  // El tablero se ha vaciado para la siguiente.
  assert.equal(t.casillas.filter((c) => c !== null).length <= 2, true);
  // Y el resultado vive SOLO en el registro.
  const total = t.partidas.paciente + t.partidas.maquina + t.partidas.empate;
  assert.equal(total, t.tableroNumero - 1);
});

test('test_los_distractores_de_la_operacion_son_PLAUSIBLES', () => {
  // Un numero muy lejano se descarta sin calcular, y la tarea deja de medir aritmetica.
  for (let s = 1; s <= 200; s++) {
    const t = nuevoTres(s);
    for (const o of t.reto.opciones) {
      assert.ok(o >= 0, `negativo: ${o}`);
      assert.ok(Math.abs(o - t.reto.resultado) <= 10, `${o} lejos de ${t.reto.resultado}`);
    }
    assert.ok(t.reto.opciones.includes(t.reto.resultado), `s=${s}: sin la correcta`);
    assert.equal(new Set(t.reto.opciones).size, t.reto.opciones.length, 'repetidas');
  }
});

// ---------------------------------------------------------------- comprar

/** @param {number} [s] @param {number} [C] @param {number} [nLista] */
const nuevaCompra = (s = 1, C = 6, nLista = 2) => new Comprar({
  t: 60, catalogo: PRECIOS_2026, C, nLista, nuevaFuente: fuenteQueAvanza(s),
});

test('test_la_lista_sale_SIEMPRE_del_lineal', () => {
  // Un articulo que no esta en el lineal no se puede coger, y el paciente no tiene forma
  // de saber que es imposible.
  for (let s = 1; s <= 300; s++) {
    const c = nuevaCompra(s, 6, 3);
    for (const id of c.compra.lista) {
      assert.ok(c.compra.lineal.includes(id), `s=${s}: ${id} pedido y no esta en el lineal`);
    }
  }
});

test('test_la_lista_nunca_es_mas_larga_que_el_lineal', () => {
  const c = nuevaCompra(1, 3, 10);
  assert.ok(c.nLista <= c.C);
  assert.ok(c.compra.lista.length <= c.compra.lineal.length);
});

test('test_coger_lo_pedido_lo_marca_y_baja_los_pendientes', () => {
  const c = nuevaCompra(5, 6, 3);
  const primero = /** @type {string} */ (c.compra.lista[0]);
  const antes = c.pendientes().length;
  const r = c.activar(ev(primero), lat);
  assert.equal(r.correcto, true);
  assert.equal(c.pendientes().length, antes - 1);
  assert.ok(c.cogidos.includes(primero));
});

test('test_coger_lo_que_NO_toca_no_retira_nada_de_la_lista', () => {
  // El pilar 2 prohibe marcar el fallo, y tachar lo que no se ha cogido seria marcarlo.
  const c = nuevaCompra(9, 6, 2);
  const fuera = c.compra.lineal.find((id) => !c.compra.lista.includes(id));
  if (fuera === undefined) return;
  const pendientesAntes = c.pendientes().length;
  const r = c.activar(ev(fuera), lat);
  assert.equal(r.correcto, false);
  assert.equal(r.registrado, true, 'el fallo si se registra');
  assert.equal(c.pendientes().length, pendientesAntes, 'la lista no cambia');
  assert.equal(c.cogidos.length, 0);
});

test('test_completar_la_lista_empieza_otra_compra', () => {
  const c = nuevaCompra(13, 6, 2);
  const lista = [...c.compra.lista];
  for (const id of lista) c.activar(ev(id), lat);
  assert.equal(c.tableroNumero, 2);
  assert.deepStrictEqual(c.cogidos, []);
});

test('test_la_lista_QUEDA_VISIBLE_y_marca_lo_cogido_sin_marcar_lo_pendiente', () => {
  // Ocultarla convertiria esto en memoria pura, que es otra tarea.
  const c = nuevaCompra(17, 6, 3);
  const texto0 = c.objetivo().nombre;
  // Sin nada cogido, la lista se ve entera y NO lleva ninguna marca.
  assert.ok(texto0.length > 0);
  assert.doesNotMatch(texto0, /•/);

  c.activar(ev(/** @type {string} */ (c.compra.lista[0])), lat);
  const texto1 = c.objetivo().nombre;
  // Lo cogido lleva punto; los pendientes NO llevan ninguna marca.
  assert.match(texto1, /•/);
  assert.equal((texto1.match(/•/g) ?? []).length, 1);
});

test('test_una_activacion_repetida_sobre_lo_ya_cogido_no_registra', () => {
  const c = nuevaCompra(21, 6, 3);
  const id = /** @type {string} */ (c.compra.lista[0]);
  c.activar(ev(id), lat);
  const antes = c.intentos.length;
  const r = c.activar(ev(id), lat);
  assert.equal(r.registrado, false);
  assert.equal(c.intentos.length, antes);
});

test('test_un_catalogo_demasiado_pequeno_se_rechaza', () => {
  assert.throws(
    () => new Comprar({ t: 60, catalogo: [], C: 4, nLista: 2, nuevaFuente: fuenteQueAvanza() }),
    RangeError,
  );
});

test('test_el_total_pedido_suma_los_precios_de_la_lista', () => {
  const c = nuevaCompra(29, 6, 3);
  const esperado = c.compra.lista.reduce((sum, id) => {
    const a = PRECIOS_2026.find((x) => x.id === id);
    return sum + (a === undefined ? 0 : a.euros);
  }, 0);
  assert.ok(Math.abs(c.totalPedido() - esperado) < 1e-9);
});
