/**
 * Qué significa `C` en cada instrumento, y hasta dónde llega.
 *
 * ## Los dos defectos que este módulo cierra
 *
 * **1 · El aviso llegaba a tres instrumentos y el problema lo tienen seis.** El aviso de «el
 * eje perceptivo no mide progreso aquí» se decidía con una lista escrita a mano —rellenar,
 * símbolos, precios— y medido: `ordenar` y el tres en raya llegan a los mismos **2,1 puntos
 * sobre 100**, y `comprar` a 6,3.
 *
 * **2 · Y el grave: el registro guardaba la dificultad de la `C` PEDIDA, no de la servida.**
 * `dp` se calculaba con los límites generales, así que un terapeuta que pedía `C = 60` en
 * precio justo dejaba registrado `dp = 40` cuando el paciente vio **seis opciones**, que son
 * `dp = 2,1`. **37,9 puntos de dificultad inventada**, y siempre en la dirección peligrosa:
 * el registro dice que el paciente aguantó más de lo que aguantó.
 *
 * Es la misma clase de defecto que S2, que reportaba 80 en lugar de 60.
 *
 * La causa de los dos era la misma: **el mismo dato escrito a mano en cuatro sitios.**
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITES_C, limitesDe, acotarC, rangoDeDp, ejePerceptivoPlano, RANGO_DP_MINIMO,
} from '../../../src/instrumentos/limites.js';
import { C_MIN, C_MAX } from '../../../src/dificultad/constantes.js';
import { dp } from '../../../src/dificultad/modelo.js';
import { FRASES, PRECIOS_2026 } from '../../../src/contenido/provisional.js';

const NUEVE = [
  'busca', 'denominar', 'clasificar', 'rellenar', 'simbolos', 'precios',
  'ordenar', 'tresEnRaya', 'comprar',
];

test('test_los_NUEVE_instrumentos_declaran_sus_limites', () => {
  // Un instrumento que falta cae en los limites generales, que es indistinguible de "no tiene
  // tope propio". Estar en la tabla hace explicito que se penso en el.
  for (const i of NUEVE) assert.ok(i in LIMITES_C, `falta '${i}'`);
  assert.equal(Object.keys(LIMITES_C).length, NUEVE.length, 'y ninguno de mas');
});

test('test_cada_instrumento_dice_QUE_cuenta_su_C', () => {
  // `C` es una perilla y cada instrumento la usa para otra cosa. Sin el significado, el
  // terapeuta no sabe que esta moviendo.
  for (const i of NUEVE) {
    const l = limitesDe(i);
    assert.ok(l.significado.length > 0, `${i}: sin significado`);
    assert.ok(l.min >= 2, `${i}: min ${l.min}`);
    assert.ok(l.max >= l.min, `${i}: max ${l.max} < min ${l.min}`);
  }
});

test('test_los_limites_de_ordenar_salen_del_CATALOGO_de_frases', () => {
  // No es una constante: si se añade una frase de ocho palabras, el tope sube solo.
  // Escribirlo a mano lo dejaria desincronizado con el contenido.
  const longitudes = FRASES.map((f) => f.palabras.length);
  assert.equal(limitesDe('ordenar').min, Math.min(...longitudes));
  assert.equal(limitesDe('ordenar').max, Math.max(...longitudes));
});

test('test_el_tope_de_comprar_es_el_TAMANO_del_catalogo', () => {
  assert.equal(limitesDe('comprar').max, PRECIOS_2026.length);
});

test('test_un_instrumento_desconocido_cae_en_los_limites_generales_y_NO_lanza', () => {
  const l = limitesDe('inventado');
  assert.equal(l.min, C_MIN);
  assert.equal(l.max, C_MAX);
});

// ---------------------------------------------------------------- acotarC

test('test_acotarC_respeta_el_tope_de_CADA_instrumento', () => {
  assert.equal(acotarC('rellenar', 40), 6);
  assert.equal(acotarC('busca', 40), 40);
  assert.equal(acotarC('ordenar', 40), limitesDe('ordenar').max);
  assert.equal(acotarC('comprar', 40), PRECIOS_2026.length);
});

test('test_acotarC_sube_hasta_el_minimo', () => {
  assert.equal(acotarC('ordenar', 1), limitesDe('ordenar').min);
  assert.equal(acotarC('busca', 1), C_MIN);
});

test('test_acotarC_con_una_C_NO_FINITA_lanza', () => {
  // Un dato ausente coercionado a un valor de aspecto valido es la forma de defecto que este
  // proyecto persigue: aqui ese valor decidiria la dificultad registrada.
  for (const malo of [NaN, Infinity, -Infinity]) {
    assert.throws(() => acotarC('busca', malo), RangeError, `${malo}`);
  }
});

test('test_acotarC_redondea_en_lugar_de_truncar', () => {
  // `C` es un recuento: 5,6 opciones no existe, y truncar sesgaria siempre hacia abajo.
  assert.equal(acotarC('busca', 5.6), 6);
  assert.equal(acotarC('busca', 5.4), 5);
});

// ---------------------------------------------------------------- el defecto de dp

test('test_la_dificultad_se_calcula_con_la_C_SERVIDA_no_con_la_pedida', () => {
  // El defecto grave, con sus numeros. Antes `dp` salia de los limites generales.
  /** @type {[string, number, number][]} */
  const casos = [
    ['precios', 60, 37.9],
    ['rellenar', 40, 23.9],
    ['ordenar', 40, 23.9],
    ['tresEnRaya', 30, 16.8],
    ['comprar', 40, 19.7],
  ];
  for (const [inst, pedida, errorEsperado] of casos) {
    const conLimitesGenerales = Math.min(Math.max(pedida, C_MIN), C_MAX);
    const servida = acotarC(inst, pedida);
    const error = Math.round((dp(conLimitesGenerales, 0, 0) - dp(servida, 0, 0)) * 10) / 10;
    assert.equal(
      error, errorEsperado,
      `${inst} con C=${pedida}: el error era de ${error} puntos, esperaba ${errorEsperado}`,
    );
    assert.ok(error > 0, 'y el error va SIEMPRE hacia arriba: sobrestima');
  }
});

test('test_en_Busca_la_C_pedida_y_la_servida_COINCIDEN', () => {
  // La otra mitad: el arreglo no puede cambiar el instrumento que estaba bien.
  for (const C of [3, 9, 20, 40, 60]) assert.equal(acotarC('busca', C), C);
});

// ---------------------------------------------------------------- el eje plano

test('test_SEIS_instrumentos_tienen_el_eje_perceptivo_plano_y_tres_no', () => {
  const planos = NUEVE.filter((i) => ejePerceptivoPlano(i));
  assert.deepStrictEqual(
    planos.sort(),
    ['comprar', 'ordenar', 'precios', 'rellenar', 'simbolos', 'tresEnRaya'],
  );
  for (const i of ['busca', 'denominar', 'clasificar']) {
    assert.equal(ejePerceptivoPlano(i), false, `${i} NO deberia ser plano`);
  }
});

test('test_canario_de_los_rangos_de_dp_MEDIDOS', () => {
  // Publicados para que un cambio en `C_MAX` o en los topes se vea aqui, y no en una
  // interpretacion clinica.
  assert.equal(Math.round(rangoDeDp('busca').rango * 10) / 10, 40);
  assert.equal(Math.round(rangoDeDp('rellenar').rango * 10) / 10, 2.1);
  assert.equal(Math.round(rangoDeDp('ordenar').rango * 10) / 10, 2.1);
  assert.equal(Math.round(rangoDeDp('tresEnRaya').rango * 10) / 10, 2.1);
  assert.equal(Math.round(rangoDeDp('comprar').rango * 10) / 10, 6.3);
});

test('test_el_umbral_del_eje_plano_esta_DECLARADO_y_es_un_juicio', () => {
  // No sale de ninguna medida de ruido: no hay estimacion de ruido, haria falta medir con
  // personas. Que el numero sea explicito es lo que permite discutirlo.
  assert.equal(RANGO_DP_MINIMO, 10);
  // Y separa de verdad los dos grupos: nadie queda pegado al umbral.
  for (const i of NUEVE) {
    const r = rangoDeDp(i).rango;
    assert.ok(
      Math.abs(r - RANGO_DP_MINIMO) > 3,
      `${i} esta a ${Math.abs(r - RANGO_DP_MINIMO).toFixed(1)} del umbral: demasiado justo`,
    );
  }
});
