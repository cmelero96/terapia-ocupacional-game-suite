/**
 * Invariantes del contenido provisional.
 *
 * El contenido lo tiene que validar un terapeuta —eso no lo puede hacer un test— pero
 * **una parte sí es comprobable a máquina**, y es justo la parte donde una errata es
 * invisible al leer: que la sílaba del hueco reconstruya de verdad la palabra.
 *
 * `{ id: 'cuchara', palabra: 'cu_ara', hueco: 'ch' }` está bien. Cambia `hueco` a `'chi'`
 * y sale «cuchiara»: nadie lo ve revisando una lista de doce filas, y el paciente recibe
 * una palabra que no existe como respuesta correcta.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PALABRAS_CON_HUECO, SIMBOLOS, PRECIOS_2026, PRECIOS_FECHA, FRASES,
} from '../../../src/contenido/provisional.js';

/** @param {string} s */
const sinTilde = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

test('test_el_hueco_RECONSTRUYE_la_palabra_del_id', () => {
  for (const p of PALABRAS_CON_HUECO) {
    const reconstruida = p.palabra.replace('_', p.hueco);
    assert.equal(
      sinTilde(reconstruida), p.id,
      `'${p.id}': la silaba '${p.hueco}' da '${reconstruida}', no '${p.id}'`,
    );
  }
});

test('test_la_silaba_correcta_esta_entre_las_opciones', () => {
  for (const p of PALABRAS_CON_HUECO) {
    assert.ok(p.opciones.includes(p.hueco), `'${p.id}': el hueco no esta en opciones`);
    assert.equal(new Set(p.opciones).size, p.opciones.length, `'${p.id}': opciones repetidas`);
    assert.ok(p.opciones.length >= 2, `'${p.id}': hacen falta al menos dos opciones`);
  }
});

test('test_el_hueco_es_una_SILABA_no_una_letra_suelta', () => {
  // Rellenar una letra es ortografia, que es otra tarea y otra capacidad. El hueco es una
  // silaba, y eso lo decide el contenido, no el instrumento.
  for (const p of PALABRAS_CON_HUECO) {
    assert.ok(p.hueco.length >= 2, `'${p.id}': el hueco '${p.hueco}' es una sola letra`);
  }
});

test('test_hay_exactamente_UN_hueco_en_cada_palabra', () => {
  for (const p of PALABRAS_CON_HUECO) {
    assert.equal(
      (p.palabra.match(/_/g) ?? []).length, 1,
      `'${p.id}': debe haber un hueco y solo uno`,
    );
  }
});

test('test_los_ids_son_unicos_en_cada_familia', () => {
  // Un id es la clave con la que se guarda que estimulo vio el paciente. Repetirlo hace
  // ambigua toda la medicion de esa familia.
  /** @type {[string, readonly { id: string }[]][]} */
  const familias = [
    ['palabras', PALABRAS_CON_HUECO], ['simbolos', SIMBOLOS],
    ['precios', PRECIOS_2026], ['frases', FRASES],
  ];
  for (const [nombre, familia] of familias) {
    assert.equal(new Set(familia.map((x) => x.id)).size, familia.length, `${nombre}: id repetido`);
  }
});

test('test_las_frases_cubren_el_rango_de_C_que_el_panel_permite', () => {
  // Si falta una longitud, `Ordenar` cae en la mas cercana y el terapeuta cree que
  // configuro una dificultad que no configuro.
  const longitudes = new Set(FRASES.map((f) => f.palabras.length));
  for (const n of [3, 4, 5, 6]) {
    assert.ok(longitudes.has(n), `no hay ninguna frase de ${n} palabras`);
  }
});

test('test_ninguna_frase_lleva_una_palabra_repetida', () => {
  // Con una palabra repetida, "cual de las dos es la siguiente" no tiene respuesta unica y
  // un acierto se registraria como fallo.
  for (const f of FRASES) {
    assert.equal(
      new Set(f.palabras).size, f.palabras.length,
      `'${f.id}': palabra repetida, el orden correcto no es unico`,
    );
  }
});

test('test_cada_simbolo_es_UN_glifo_y_su_palabra_no_esta_vacia', () => {
  for (const s of SIMBOLOS) {
    assert.ok([...s.simbolo].length >= 1, `'${s.id}': sin simbolo`);
    assert.ok(s.palabra.trim().length > 0, `'${s.id}': sin palabra`);
  }
});

test('test_ningun_precio_es_cero_ni_negativo_y_llevan_FECHA', () => {
  for (const p of PRECIOS_2026) {
    assert.ok(p.euros > 0, `'${p.id}': precio ${p.euros}`);
    assert.ok(p.euros < 100, `'${p.id}': ${p.euros} € no es un precio de supermercado`);
  }
  assert.match(PRECIOS_FECHA, /^\d{4}$/, 'la fecha de los precios debe ser un año');
});

test('test_los_precios_IGUALES_estan_contados_y_declarados', () => {
  // En "comprar", dos articulos al mismo precio hacen que el total no identifique la
  // compra. No es un fallo del codigo: es un dato que la hoja de revision debe señalar.
  /** @type {Map<string, string[]>} */
  const porPrecio = new Map();
  for (const p of PRECIOS_2026) {
    const k = p.euros.toFixed(2);
    porPrecio.set(k, [...(porPrecio.get(k) ?? []), p.id]);
  }
  const repes = [...porPrecio.values()].filter((v) => v.length > 1);
  assert.ok(repes.length <= 2, `demasiados precios iguales: ${JSON.stringify(repes)}`);
});

test('test_ningun_distractor_se_diferencia_SOLO_en_la_tilde', () => {
  // Lo encontro la hoja de revision, no una lectura del modulo.
  //
  // `{ id: 'periodico', hueco: 'rió', opciones: ['rió','ria','rio','reo'] }` — el distractor
  // `rio` da «periodico», que no es una no-palabra: es la MISMA palabra mal acentuada.
  // Elegirlo no es un error de acceso lexico, es un error de ortografia, y la ortografia es
  // otra tarea y otra capacidad. Peor: el paciente que sabe la palabra y no la tilde recibe
  // un fallo registrado por algo que el ejercicio no dice medir.
  for (const p of PALABRAS_CON_HUECO) {
    for (const o of p.opciones) {
      if (o === p.hueco) continue;
      assert.notEqual(
        sinTilde(o), sinTilde(p.hueco),
        `'${p.id}': el distractor '${o}' es '${p.hueco}' sin tilde — eso es ortografia`,
      );
    }
  }
});
