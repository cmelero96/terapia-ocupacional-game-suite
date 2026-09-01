/**
 * Eje de contenido. Sistema 32 · `design/gdd/eje-contenido.md`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VARIANTES, variantesDe, tieneEje, varianteValida, resolverVariante,
  etiquetaParaMostrar, claveDeProgreso, observacionesPorVariante,
} from '../../../src/dificultad/contenido.js';
import { TIPOS_OPERACION } from '../../../src/contenido/provisional.js';

// ---------------------------------------------------------------- catálogo

test('test_AC1_solo_el_tres_en_raya_declara_variantes_hoy', () => {
  // Una lista vacia es el caso NORMAL, no un hueco por rellenar. Inventar variantes
  // clinicas sin un terapeuta es peor que no tenerlas.
  const conEje = Object.keys(VARIANTES).filter((i) => tieneEje(i));
  assert.deepStrictEqual(conEje, ['tresEnRaya']);
});

test('test_los_nueve_instrumentos_estan_en_el_catalogo', () => {
  // Un instrumento que falta devuelve lista vacia, que es indistinguible de "no tiene eje".
  // Estar en el catalogo hace explicito que se penso en el.
  const NUEVE = [
    'busca', 'denominar', 'clasificar', 'rellenar', 'simbolos', 'precios',
    'ordenar', 'tresEnRaya', 'comprar',
  ];
  for (const i of NUEVE) assert.ok(i in VARIANTES, `falta '${i}'`);
  assert.equal(Object.keys(VARIANTES).length, NUEVE.length, 'y ninguno de mas');
});

test('test_las_variantes_del_tres_en_raya_son_los_tipos_de_operacion', () => {
  const ids = variantesDe('tresEnRaya').map((v) => v.id);
  assert.deepStrictEqual(ids, [...TIPOS_OPERACION]);
});

test('test_los_ordinales_van_de_1_a_n_sin_huecos_ni_repetidos', () => {
  for (const instrumento of Object.keys(VARIANTES)) {
    const vs = variantesDe(instrumento);
    if (vs.length === 0) continue;
    const ordinales = vs.map((v) => v.ordinal).sort((a, b) => a - b);
    assert.deepStrictEqual(
      ordinales, Array.from({ length: vs.length }, (_, k) => k + 1),
      `${instrumento}: ordinales ${ordinales.join(',')}`,
    );
  }
});

test('test_los_ids_son_unicos_y_las_etiquetas_no_estan_vacias', () => {
  for (const instrumento of Object.keys(VARIANTES)) {
    const vs = variantesDe(instrumento);
    assert.equal(new Set(vs.map((v) => v.id)).size, vs.length, `${instrumento}: id repetido`);
    for (const v of vs) assert.ok(v.etiqueta.trim().length > 0, `${instrumento}/${v.id}`);
  }
});

test('test_un_instrumento_desconocido_da_lista_vacia_y_NO_lanza', () => {
  // Es una lectura de catalogo, no una validacion.
  assert.deepStrictEqual(variantesDe('inventado'), []);
  assert.equal(tieneEje('inventado'), false);
});

// ---------------------------------------------------------------- resolverVariante

test('test_AC8_sin_id_se_usa_el_ordinal_1_el_mas_FACIL', () => {
  // Si hay que equivocarse, se equivoca hacia el lado que no frustra al paciente.
  const v = resolverVariante('tresEnRaya');
  assert.equal(v?.ordinal, 1);
  assert.equal(v?.id, 'sumaHasta10');
});

test('test_AC5_un_id_desconocido_LANZA_y_no_se_sustituye', () => {
  // Un valor sustituido decidiria a que aritmetica juega un paciente sin que nadie lo
  // pidiera. Es la misma forma que `?? 0` sobre una semilla.
  assert.throws(() => resolverVariante('tresEnRaya', 'dividir'), RangeError);
  // Y el mensaje dice cuales SI valen, para que el terapeuta pueda arreglarlo.
  try {
    resolverVariante('tresEnRaya', 'dividir');
  } catch (e) {
    assert.match(String(e), /sumaHasta10/);
    assert.match(String(e), /multiplicar/);
  }
});

test('test_un_instrumento_sin_eje_devuelve_null', () => {
  assert.equal(resolverVariante('busca'), null);
});

test('test_pedir_una_variante_a_un_instrumento_SIN_eje_lanza', () => {
  // Aceptarlo en silencio dejaria que el panel de un instrumento pidiera una variante que
  // ese instrumento no puede aplicar, y el registro guardaria un dato falso.
  assert.throws(() => resolverVariante('busca', 'sumaHasta10'), RangeError);
});

test('test_varianteValida_no_lanza_nunca', () => {
  assert.equal(varianteValida('tresEnRaya', 'multiplicar'), true);
  assert.equal(varianteValida('tresEnRaya', 'dividir'), false);
  assert.equal(varianteValida('busca', 'sumaHasta10'), false);
  assert.equal(varianteValida('inventado', 'nada'), false);
});

// ---------------------------------------------------------------- etiquetaParaMostrar

test('test_AC5_una_variante_RETIRADA_no_rompe_la_pantalla', () => {
  // Asimetria deliberada: un id desconocido por URL FALLA, uno en un dato ya registrado NO.
  // Una pantalla que se rompe al abrir una sesion vieja es peor que una etiqueta fea.
  assert.equal(etiquetaParaMostrar('tresEnRaya', 'dividir'), 'variante retirada: dividir');
  assert.equal(etiquetaParaMostrar('tresEnRaya', 'multiplicar'), 'multiplicar');
  assert.equal(etiquetaParaMostrar('busca', null), 'sin variante de contenido');
  assert.equal(etiquetaParaMostrar('busca', undefined), 'sin variante de contenido');
});

// ---------------------------------------------------------------- claveDeProgreso

test('test_la_clave_de_progreso_SEPARA_variantes_distintas', () => {
  const base = { dm: 48, dp: 20 };
  const a = claveDeProgreso({ ...base, contenido: { id: 'sumaHasta10' } });
  const b = claveDeProgreso({ ...base, contenido: { id: 'multiplicar' } });
  assert.notEqual(a, b, 'misma dificultad, tarea distinta: celdas distintas');
});

test('test_null_es_una_clave_LEGITIMA', () => {
  const k = claveDeProgreso({ dm: 48, dp: 20, contenido: null });
  assert.equal(typeof k, 'string');
  assert.ok(k.length > 0);
  // Y dos tableros sin eje caen en la MISMA celda.
  assert.equal(k, claveDeProgreso({ dm: 48, dp: 20, contenido: null }));
});

test('test_la_misma_dificultad_y_la_misma_variante_caen_en_la_misma_celda', () => {
  const t = { dm: 48, dp: 20.04, contenido: { id: 'multiplicar' } };
  const u = { dm: 48, dp: 20.04, contenido: { id: 'multiplicar' } };
  assert.equal(claveDeProgreso(t), claveDeProgreso(u));
});

// ---------------------------------------------------------------- AC-4, la partición

/**
 * @param {string | null} id
 * @param {boolean[]} aciertos
 * @param {number} [dp]
 */
const tab = (id, aciertos, dp = 20) => ({
  dp, dm: 48,
  contenido: id === null ? null : { id },
  intentos: aciertos.map((correcto) => ({ correcto })),
});

test('test_AC4_los_intentos_se_PARTEN_por_variante', () => {
  const sesion = {
    tableros: [
      tab('sumaHasta10', [true, true, true]),
      tab('multiplicar', [false, false]),
    ],
  };
  const m = observacionesPorVariante(sesion, 'dp');
  assert.equal(m.size, 2);
  assert.equal(m.get('sumaHasta10')?.length, 3);
  assert.equal(m.get('multiplicar')?.length, 2);
  // Y no se mezclan: la precision de cada una es la suya.
  assert.deepStrictEqual(m.get('sumaHasta10')?.map((o) => o.acierto), [true, true, true]);
  assert.deepStrictEqual(m.get('multiplicar')?.map((o) => o.acierto), [false, false]);
});

test('test_AC4_sin_particion_la_precision_MEZCLADA_seria_otra', () => {
  // El numero que este AC evita. Con 3 aciertos de 3 en una variante y 0 de 2 en otra, la
  // lista plana da 60 % — una precision que el paciente no tuvo en ninguna de las dos.
  const sesion = {
    tableros: [
      tab('sumaHasta10', [true, true, true]),
      tab('multiplicar', [false, false]),
    ],
  };
  const m = observacionesPorVariante(sesion, 'dp');
  const prec = (/** @type {{acierto: boolean}[]} */ l) =>
    l.filter((o) => o.acierto).length / l.length;

  assert.equal(prec(/** @type {any} */ (m.get('sumaHasta10'))), 1);
  assert.equal(prec(/** @type {any} */ (m.get('multiplicar'))), 0);

  const plana = [...m.values()].flat();
  assert.equal(prec(plana), 0.6, 'la mezcla da 60 %, que no le paso a nadie');
});

test('test_los_tableros_sin_eje_van_todos_a_la_clave_null', () => {
  const m = observacionesPorVariante({
    tableros: [tab(null, [true]), tab(null, [false, true])],
  }, 'dp');
  assert.equal(m.size, 1);
  assert.equal(m.get(null)?.length, 3);
});

test('test_la_particion_respeta_el_EJE_que_se_le_pide', () => {
  const m = observacionesPorVariante({
    tableros: [{ dp: 20, dm: 48, contenido: null, intentos: [{ correcto: true }] }],
  }, 'dm');
  assert.equal(m.get(null)?.[0]?.d, 48, 'con eje dm, la dificultad es dm');
});

test('test_una_sesion_sin_tableros_da_un_mapa_VACIO_y_no_lanza', () => {
  const m = observacionesPorVariante({ tableros: [] }, 'dp');
  assert.equal(m.size, 0);
  // Y quien pida una variante recibe undefined, no una lista de ceros.
  assert.equal(m.get('multiplicar'), undefined);
});
