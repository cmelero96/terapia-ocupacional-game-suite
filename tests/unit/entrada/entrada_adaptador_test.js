/**
 * Sistema 5 — criterios de aceptacion de la capa de adaptacion de entrada.
 * Cubre AC-1, AC-3 a AC-6, AC-8 a AC-12, AC-14 y AC-15.
 *
 * AC-2, AC-7, AC-13, AC-16, AC-17 y AC-18 necesitan navegador o analisis estatico y no
 * viven aqui.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cadenciaBarrido, pxTolerancia, dentroDeTolerancia,
  MaquinaPuntero, Permanencia, Barrido,
} from '../../../src/entrada/adaptador.js';
import { relojFalso, programadorFalso } from '../../ayudas/dobles.js';

// ---------------------------------------------------------------- AC-1

test('test_los_cinco_modos_producen_eventos_indistinguibles_salvo_modo', () => {
  const reloj = relojFalso();
  /** @type {import('../../../src/entrada/adaptador.js').EventoActivacion[]} */
  const eventos = [];

  // Tactil, raton y teclado pasan por la misma maquina de puntero.
  for (const modo of /** @type {const} */ (['tactil', 'raton', 'teclado'])) {
    const m = new MaquinaPuntero(60);
    m.abajo('objetivo-7', 100, 100);
    const e = m.arriba('objetivo-7', 5000, modo, 'evento');
    assert.ok(e !== null);
    eventos.push(e);
  }

  // Pulsador.
  const b = new Barrido(['a', 'objetivo-7', 'c'], programadorFalso(), 1000);
  b.avanzar();
  const ePulsador = b.seleccionar(5000, 'evento');
  assert.ok(ePulsador !== null);
  eventos.push(ePulsador);

  // Permanencia.
  const p = new Permanencia(800, reloj);
  p.entrar('objetivo-7');
  reloj.avanzar(800);
  const ePerm = p.comprobar();
  assert.ok(ePerm !== null);
  eventos.push(ePerm);

  // Todos apuntan al mismo objetivo.
  assert.deepStrictEqual(
    [...new Set(eventos.map((e) => e.idObjetivo))],
    ['objetivo-7'],
  );
  // Y las claves del evento son las mismas en los cinco.
  const claves = eventos.map((e) => Object.keys(e).sort().join(','));
  assert.equal(new Set(claves).size, 1, 'la forma del evento difiere entre modos');
  // Los cinco modos estan representados.
  assert.equal(new Set(eventos.map((e) => e.modo)).size, 5);
});

// ---------------------------------------------------------------- AC-3, AC-4, AC-5

test('test_la_activacion_ocurre_al_soltar_no_al_pulsar', () => {
  const m = new MaquinaPuntero(60);
  assert.equal(m.abajo('a', 0, 0), null);
  assert.equal(m.mover(1, 1), null);
});

test('test_salir_antes_de_soltar_aborta_y_no_registra_nada', () => {
  const m = new MaquinaPuntero(60); // pxTolerancia(60) = 15
  m.abajo('a', 100, 100);
  m.mover(140, 100); // 40 px, fuera
  assert.equal(m.arriba('a', 5000, 'tactil', 'evento'), null);
});

test('test_soltar_sobre_otro_objetivo_no_activa', () => {
  const m = new MaquinaPuntero(60);
  m.abajo('a', 100, 100);
  assert.equal(m.arriba('b', 5000, 'tactil', 'evento'), null);
});

test('test_soltar_fuera_de_todo_objetivo_no_activa', () => {
  const m = new MaquinaPuntero(60);
  m.abajo('a', 100, 100);
  assert.equal(m.arriba(null, 5000, 'tactil', 'evento'), null);
});

test('test_un_movimiento_dentro_de_la_tolerancia_no_aborta', () => {
  const m = new MaquinaPuntero(60); // tolerancia 15 px
  m.abajo('a', 100, 100);
  m.mover(112, 100); // 12 px, dentro
  const e = m.arriba('a', 5000, 'tactil', 'evento');
  assert.ok(e !== null);
  assert.equal(e.idObjetivo, 'a');

  const m2 = new MaquinaPuntero(60);
  m2.abajo('a', 100, 100);
  m2.mover(120, 100); // 20 px, fuera
  assert.equal(m2.arriba('a', 5000, 'tactil', 'evento'), null);
});

test('test_cancelar_del_navegador_no_activa_y_no_es_fallo', () => {
  const m = new MaquinaPuntero(60);
  m.abajo('a', 100, 100);
  m.cancelar();
  assert.equal(m.arriba('a', 5000, 'tactil', 'evento'), null);
});

// ---------------------------------------------------------------- AC-6, AC-10

test('test_canario_F2_la_tabla_publicada_exacta', () => {
  /** @type {[number, number, boolean][]} */
  const tabla = [
    [3, 4000, false], [6, 2000, false], [12, 1000, false],
    [30, 400, false], [40, 400, true], [100, 400, true],
  ];
  for (const [nPasos, esperado, recortado] of tabla) {
    const r = cadenciaBarrido(nPasos, 12000);
    assert.equal(r.msPorPaso, esperado, `nPasos = ${nPasos}`);
    assert.equal(r.recortado, recortado, `recortado en nPasos = ${nPasos}`);
  }
});

test('test_la_vuelta_real_se_reporta_cuando_hay_recorte', () => {
  // Con 100 objetivos la vuelta real son 40 s, no los 12 configurados. El terapeuta
  // tiene que poder verlo antes de que el paciente lo sufra.
  const r = cadenciaBarrido(100, 12000);
  assert.equal(r.msVueltaReal, 40000);
  assert.equal(r.recortado, true);
});

test('test_canario_F3_la_tabla_de_tolerancia_exacta', () => {
  /** @type {[number, number][]} */
  const tabla = [[24, 8], [32, 8], [44, 11], [60, 15], [100, 25], [140, 35]];
  for (const [t, esperado] of tabla) {
    assert.equal(pxTolerancia(t), esperado, `t = ${t}`);
  }
});

test('test_la_tolerancia_escala_con_el_tamano_de_objetivo', () => {
  // Un objetivo de 140 px con 8 px de tolerancia seria igual de intolerante que uno de
  // 24, cuando el terapeuta subio el tamaño porque el paciente no apunta fino.
  assert.ok(pxTolerancia(140) > pxTolerancia(60));
  assert.ok(pxTolerancia(60) > pxTolerancia(24));
});

test('test_dentroDeTolerancia_usa_distancia_euclidea', () => {
  // 3-4-5: a t=60 la tolerancia es 15, asi que (9, 12) da 15 exacto y entra.
  assert.equal(dentroDeTolerancia(9, 12, 60), true);
  assert.equal(dentroDeTolerancia(10, 12, 60), false);
});

// ---------------------------------------------------------------- AC-8, AC-9

test('test_el_barrido_no_tiene_limite_de_vueltas', () => {
  const prog = programadorFalso();
  const b = new Barrido(['a', 'b', 'c', 'd', 'e', 'f'], prog, 1000);
  b.arrancarAutomatico();
  prog.avanzar(500 * 1000); // 500 pasos
  assert.equal(b.vueltas, 83, '500 pasos entre 6 objetivos son 83 vueltas');
  assert.ok(prog.pendientes() > 0, 'el barrido sigue activo');
});

test('test_mantener_pulsado_es_UNA_activacion_sin_autorrepeticion', () => {
  const b = new Barrido(['a', 'b', 'c'], programadorFalso(), 1000);
  const primera = b.seleccionar(1000, 'evento');
  assert.ok(primera !== null);
  // Mantenido: nueve intentos mas, ninguna activacion.
  for (let i = 0; i < 9; i++) {
    assert.equal(b.seleccionar(1000 + i, 'evento'), null);
  }
  // Al soltar, vuelve a poder activar.
  b.soltar();
  assert.ok(b.seleccionar(2000, 'evento') !== null);
});

test('test_el_barrido_selecciona_el_objetivo_enfocado', () => {
  const b = new Barrido(['a', 'b', 'c'], programadorFalso(), 1000);
  assert.equal(b.actual(), 'a');
  b.avanzar();
  const e = b.seleccionar(1000, 'evento');
  assert.ok(e !== null);
  assert.equal(e.idObjetivo, 'b');
});

// ---------------------------------------------------------------- AC-11, AC-12

test('test_la_permanencia_activa_al_cumplir_y_no_antes', () => {
  const reloj = relojFalso();
  const p = new Permanencia(800, reloj);
  p.entrar('a');
  reloj.avanzar(799);
  assert.equal(p.comprobar(), null, 'a 799 ms no debe activar');
  reloj.avanzar(1);
  const e = p.comprobar();
  assert.ok(e !== null, 'a 800 ms debe activar');
  assert.equal(e.idObjetivo, 'a');
  assert.equal(e.origenTiempo, 'reloj');
});

test('test_salir_de_la_tolerancia_REINICIA_la_cuenta_no_la_pausa', () => {
  const reloj = relojFalso();
  const p = new Permanencia(800, reloj);
  p.entrar('a');
  reloj.avanzar(700);
  p.salir();
  p.entrar('a');
  reloj.avanzar(700);
  assert.equal(p.comprobar(), null, 'la cuenta empezo de cero: 700 no basta');
  reloj.avanzar(100);
  assert.ok(p.comprobar() !== null, 'a 800 desde la reentrada, activa');
});

test('test_el_progreso_de_permanencia_va_de_0_a_1', () => {
  const reloj = relojFalso();
  const p = new Permanencia(800, reloj);
  assert.equal(p.progreso(), 0, 'sin objetivo, 0');
  p.entrar('a');
  assert.equal(p.progreso(), 0);
  reloj.avanzar(400);
  assert.equal(p.progreso(), 0.5);
  reloj.avanzar(400);
  assert.equal(p.progreso(), 1);
  reloj.avanzar(4000);
  assert.equal(p.progreso(), 1, 'no pasa de 1');
});

test('test_cambiar_de_objetivo_reinicia_la_permanencia', () => {
  const reloj = relojFalso();
  const p = new Permanencia(800, reloj);
  p.entrar('a');
  reloj.avanzar(700);
  p.entrar('b');
  reloj.avanzar(700);
  assert.equal(p.comprobar(), null);
});

// ---------------------------------------------------------------- AC-14, AC-15

test('test_nada_expira_tras_30_minutos_simulados', () => {
  // ESTE es el criterio que el sistema 3 declaro y no pudo escribir, porque su sujeto
  // —un temporizador real— no existia. El Programador inyectado lo crea.
  const prog = programadorFalso();
  const reloj = relojFalso();
  const b = new Barrido(['a', 'b', 'c', 'd'], prog, 1000);
  const p = new Permanencia(800, reloj);
  b.arrancarAutomatico();

  /** @type {string[]} */
  const eventos = [];
  const TREINTA_MINUTOS = 30 * 60 * 1000;
  for (let t = 0; t < TREINTA_MINUTOS; t += 60000) {
    prog.avanzar(60000);
    // La permanencia no esta sobre ningun objetivo: nada debe activarse.
    const e = p.comprobar();
    if (e !== null) eventos.push('permanencia');
  }

  assert.deepStrictEqual(eventos, [], 'no se disparo ningun evento en 30 minutos');
  assert.ok(prog.pendientes() > 0, 'la sesion sigue activa');
  assert.equal(b.vueltas, 450, '30 min a 1 s/paso entre 4 objetivos');
});

test('test_ningun_temporizador_de_esta_capa_puede_producir_un_fallo', () => {
  // La cadencia expirando AVANZA. La permanencia sin puntero no produce nada. Ninguno
  // de los dos puede generar un intento registrado.
  const prog = programadorFalso();
  const reloj = relojFalso();
  const b = new Barrido(['a', 'b', 'c'], prog, 1000);
  b.arrancarAutomatico();
  const iAntes = b.i;
  prog.avanzar(1000);
  assert.notEqual(b.i, iAntes, 'la cadencia avanza');

  const p = new Permanencia(800, reloj);
  reloj.avanzar(10000);
  assert.equal(p.comprobar(), null, 'sin puntero, la permanencia no produce nada');
});

// ---------------------------------------------------------------- validacion

test('test_las_entradas_fuera_de_rango_se_rechazan', () => {
  assert.throws(() => cadenciaBarrido(2, 12000), RangeError);
  assert.throws(() => cadenciaBarrido(12, 2999), RangeError);
  assert.throws(() => cadenciaBarrido(12, 60001), RangeError);
  assert.throws(() => pxTolerancia(23), RangeError);
  assert.throws(() => pxTolerancia(141), RangeError);
  assert.throws(() => new Permanencia(299, relojFalso()), RangeError);
  assert.throws(() => new Permanencia(5001, relojFalso()), RangeError);
  assert.throws(() => new Barrido(['a', 'b'], programadorFalso(), 1000), RangeError);
});
