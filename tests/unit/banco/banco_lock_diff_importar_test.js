/**
 * `banco.lock`, continuidad de ids e importador. Sistema 13.
 *
 * Los tres protegen el mismo invariante desde tres sitios distintos:
 *
 * > **Un `id` es la clave con la que se guarda qué estímulo vio el paciente, y toda la
 * > medición asume que ese estímulo no cambia entre sesiones.**
 *
 * El importador impide crear un id que ya existe. El diff impide borrar uno que existía. Y el
 * lock impide lo que ninguno de los dos ve: **que el archivo de detrás cambie con el id
 * intacto.**
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hash, construirLock, comparar, serializar, deserializar } from '../../../tools/banco/lock.js';
import { continuidad, rompe, informe } from '../../../tools/banco/diff-manifiestos.js';
import { fusionar, retirar, serializarManifiesto } from '../../../tools/banco/importar.js';
import { bancoValido } from '../../fixtures/banco-manifiesto.js';

/** Un lector de disco falso: mapa de ruta a contenido. */
const lector = (/** @type {Record<string, string>} */ disco) => (
  /** @type {string} */ file,
) => (Object.prototype.hasOwnProperty.call(disco, file) ? disco[file] ?? null : null);

/** @param {readonly import('../../../src/banco/esquema.js').ImageAsset[]} b */
const discoDe = (b) => Object.fromEntries(b.map((a) => [a.file, `contenido de ${a.id}`]));

// ---------------------------------------------------------------- lock

test('test_el_hash_es_estable_y_distinto_para_contenidos_distintos', () => {
  assert.equal(hash('abc'), hash('abc'));
  assert.notEqual(hash('abc'), hash('abd'));
  assert.equal(hash('abc').length, 32);
});

test('test_el_lock_ordena_por_id_para_que_el_diff_de_git_sea_legible', () => {
  // Un lock que cambia de orden entre ejecuciones produce un diff enorme en cada commit, y
  // nadie vuelve a leerlo. Este archivo existe para ser leido en una revision.
  const b = bancoValido(1);
  const { lock } = construirLock({ manifiesto: b.slice().reverse(), leer: lector(discoDe(b)) });
  const ids = Object.keys(lock);
  assert.deepStrictEqual(ids, [...ids].sort());
});

test('test_el_lock_solo_incluye_los_ACTIVOS', () => {
  // El archivo de un asset retirado puede haberse borrado del repositorio legitimamente, y
  // exigir su presencia para siempre convertiria cada retirada en un archivo eterno.
  const b = bancoValido(1);
  /** @type {any} */ (b[0]).status = 'retired';
  /** @type {any} */ (b[0]).retiredAt = '2026-09-01';
  const { lock, ausentes } = construirLock({ manifiesto: b, leer: lector(discoDe(b)) });
  assert.equal(Object.keys(lock).length, b.length - 1);
  assert.deepStrictEqual(ausentes, []);
});

test('test_un_archivo_ACTIVO_que_falta_en_disco_se_reporta_y_no_lanza', () => {
  const b = bancoValido(1);
  const disco = discoDe(b);
  delete disco[/** @type {any} */ (b[3]).file];
  const { lock, ausentes } = construirLock({ manifiesto: b, leer: lector(disco) });
  assert.deepStrictEqual(ausentes, [/** @type {any} */ (b[3]).id]);
  assert.equal(Object.keys(lock).length, b.length - 1);
});

test('test_un_archivo_SUSTITUIDO_bajo_un_id_intacto_se_detecta', () => {
  // El defecto que el lock existe para impedir, y que NI el manifiesto NI el diff ven: el id
  // sigue, el `file` sigue, y el contenido es otro.
  const b = bancoValido(1);
  const disco = discoDe(b);
  const { lock: antes } = construirLock({ manifiesto: b, leer: lector(disco) });

  const victima = /** @type {any} */ (b[7]);
  disco[victima.file] = 'un SVG completamente distinto';
  const { lock: ahora } = construirLock({ manifiesto: b, leer: lector(disco) });

  const c = comparar(antes, ahora);
  assert.deepStrictEqual(c.sustituidos, [victima.id]);
  assert.deepStrictEqual(c.nuevos, []);
  assert.deepStrictEqual(c.desaparecidos, []);
});

test('test_los_TRES_casos_de_comparacion_son_distinguibles', () => {
  // Piden acciones distintas: sustituido es un error, nuevo y desaparecido son avisos.
  const c = comparar(
    { a: 'h1', b: 'h2', c: 'h3' },
    { a: 'h1', b: 'CAMBIADO', d: 'h4' },
  );
  assert.deepStrictEqual(c.sustituidos, ['b']);
  assert.deepStrictEqual(c.nuevos, ['d']);
  assert.deepStrictEqual(c.desaparecidos, ['c']);
});

test('test_serializar_y_deserializar_es_ida_y_vuelta', () => {
  const b = bancoValido(1);
  const { lock } = construirLock({ manifiesto: b, leer: lector(discoDe(b)) });
  assert.deepStrictEqual(deserializar(serializar(lock)), lock);
});

test('test_el_lock_serializado_EXPLICA_que_significa_un_hash_cambiado', () => {
  // Quien se encuentre este archivo en una revision tiene que entender por que importa sin
  // ir a buscar el GDD.
  const texto = serializar({ a: hash('x') });
  assert.match(texto, /prohibido/);
  assert.match(texto, /retirar el id y/);
});

test('test_una_linea_MALFORMADA_del_lock_lanza_en_lugar_de_ignorarse', () => {
  // Un lock a medias aprobaria archivos que nadie ha comprobado, y eso es peor que no tener
  // lock.
  assert.throws(() => deserializar('a  h1\nb'), SyntaxError);
  assert.throws(() => deserializar('a  h1  sobra'), SyntaxError);
  assert.throws(() => deserializar('a  h1\na  h2'), SyntaxError, 'id repetido');
});

test('test_los_comentarios_y_las_lineas_vacias_del_lock_se_ignoran', () => {
  const l = deserializar('# comentario\n\na  h1\n   \nb  h2\n');
  assert.deepStrictEqual(l, { a: 'h1', b: 'h2' });
});

// ---------------------------------------------------------------- continuidad de ids

test('test_un_id_BORRADO_sin_retirar_es_un_error', () => {
  const antes = bancoValido(1);
  const ahora = antes.slice(1);
  const c = continuidad(antes, ahora);
  assert.deepStrictEqual(c.borrados, [/** @type {any} */ (antes[0]).id]);
  assert.equal(rompe(c), true);
  assert.match(informe(c).join(' '), /Retiralo en lugar de borrarlo/);
});

test('test_retirar_un_id_NO_rompe_la_continuidad', () => {
  const antes = bancoValido(1);
  const ahora = antes.map((a, i) => (
    i === 0 ? { ...a, status: /** @type {const} */ ('retired'), retiredAt: '2026-09-01' } : a
  ));
  const c = continuidad(antes, ahora);
  assert.deepStrictEqual(c.borrados, []);
  assert.deepStrictEqual(c.retirados, [/** @type {any} */ (antes[0]).id]);
  assert.equal(rompe(c), false);
});

test('test_un_ALTA_no_rompe_la_continuidad', () => {
  const antes = bancoValido(1);
  const ahora = [...antes, { ...(/** @type {any} */ (antes[0])), id: 'nuevo-01', file: 'n/01.svg' }];
  const c = continuidad(antes, ahora);
  assert.deepStrictEqual(c.nuevos, ['nuevo-01']);
  assert.equal(rompe(c), false);
});

test('test_una_REACTIVACION_avisa_y_no_rompe', () => {
  // El estado es bidireccional, asi que es legitimo. Se avisa porque un asset que vuelve
  // cambia `clusterSize`, y con el tres formulas de dificultad.
  const antes = bancoValido(1).map((a, i) => (
    i === 0 ? { ...a, status: /** @type {const} */ ('retired'), retiredAt: '2026-08-01' } : a
  ));
  const ahora = bancoValido(1);
  const c = continuidad(antes, ahora);
  assert.deepStrictEqual(c.reactivados, [/** @type {any} */ (ahora[0]).id]);
  assert.equal(rompe(c), false);
  assert.match(informe(c).join(' '), /tres formulas/);
});

test('test_un_FILE_o_un_CLUSTER_que_cambia_bajo_el_mismo_id_es_un_error', () => {
  // Es la misma clase de defecto que sustituir el archivo: el id promete un estimulo estable.
  for (const campo of /** @type {const} */ (['file', 'cluster'])) {
    const antes = bancoValido(1);
    const ahora = antes.map((a, i) => (i === 0 ? { ...a, [campo]: 'otra-cosa' } : a));
    const c = continuidad(antes, ahora);
    assert.equal(c.mutados.length, 1, `${campo} deberia detectarse`);
    assert.equal(c.mutados[0]?.campo, campo);
    assert.equal(rompe(c), true);
  }
});

test('test_sin_cambios_el_informe_esta_VACIO', () => {
  const b = bancoValido(2);
  const c = continuidad(b, b);
  assert.deepStrictEqual(informe(c), []);
  assert.equal(rompe(c), false);
});

// ---------------------------------------------------------------- importador

test('test_AC3a_el_importador_se_NIEGA_a_escribir_sobre_un_id_existente', () => {
  const manifiesto = bancoValido(1);
  const existente = /** @type {any} */ (manifiesto[0]);
  const { resultado, rechazos } = fusionar({
    manifiesto,
    nuevas: [{ ...existente, file: 'otro/nuevo.svg', name: 'otra imagen' }],
  });
  assert.equal(resultado, null, 'NO escribe nada');
  assert.equal(rechazos.length, 1);
  assert.equal(rechazos[0]?.codigo, 'idYaExiste');
  // Y el mensaje dice la via correcta, no solo que no se puede.
  assert.match(/** @type {any} */ (rechazos[0]).mensaje, /retira este id y crea otro/);
});

test('test_NO_existe_ninguna_bandera_que_fuerce_la_sobrescritura', () => {
  // La ausencia ES la decision. Una bandera asi acaba siempre puesta.
  const fuente = serializarManifiesto([]);
  void fuente;
  const claves = Object.keys(fusionar({ manifiesto: [], nuevas: [] }));
  assert.deepStrictEqual(claves.sort(), ['rechazos', 'resultado']);
  // `fusionar` toma exactamente dos entradas, y ninguna es un modo.
  assert.equal(fusionar.length, 1, 'un solo parametro de objeto');
});

test('test_con_UN_rechazo_no_se_importa_NADA_del_lote', () => {
  // Un lote a medias deja el manifiesto en un estado que nadie pidio, y obliga a averiguar
  // que entro y que no.
  const manifiesto = bancoValido(1);
  const buena = { ...(/** @type {any} */ (manifiesto[0])), id: 'nueva-01', file: 'n/01.svg' };
  const mala = { ...(/** @type {any} */ (manifiesto[0])) };
  const { resultado, rechazos } = fusionar({ manifiesto, nuevas: [buena, mala] });
  assert.equal(resultado, null);
  assert.equal(rechazos.length, 1);
});

test('test_un_lote_que_se_pisa_a_SI_MISMO_se_rechaza', () => {
  // Sin esta comprobacion, la ultima entrada del lote ganaria y las anteriores
  // desaparecerian sin aviso.
  const nueva = { ...(/** @type {any} */ (bancoValido(1)[0])), id: 'x-01', file: 'x/01.svg' };
  const { resultado, rechazos } = fusionar({
    manifiesto: [],
    nuevas: [nueva, { ...nueva, file: 'x/02.svg' }],
  });
  assert.equal(resultado, null);
  assert.equal(rechazos[0]?.codigo, 'idRepetidoEnElLote');
});

test('test_un_ARCHIVO_ya_usado_se_rechaza', () => {
  const manifiesto = bancoValido(1);
  const nueva = {
    ...(/** @type {any} */ (manifiesto[0])), id: 'otro-id', file: /** @type {any} */ (manifiesto[0]).file,
  };
  const { rechazos } = fusionar({ manifiesto, nuevas: [nueva] });
  assert.equal(rechazos[0]?.codigo, 'archivoYaUsado');
});

test('test_nadie_nace_RETIRADO', () => {
  const nueva = {
    ...(/** @type {any} */ (bancoValido(1)[0])),
    id: 'x-01', file: 'x/01.svg', status: /** @type {const} */ ('retired'), retiredAt: '2026-09-01',
  };
  const { rechazos } = fusionar({ manifiesto: [], nuevas: [nueva] });
  assert.equal(rechazos[0]?.codigo, 'altaRetirada');
});

test('test_un_lote_LIMPIO_entra_y_queda_ordenado_por_id', () => {
  const manifiesto = bancoValido(1);
  const base = /** @type {any} */ (manifiesto[0]);
  const { resultado, rechazos } = fusionar({
    manifiesto,
    nuevas: [
      { ...base, id: 'zzz-01', file: 'z/01.svg' },
      { ...base, id: 'aaa-01', file: 'a/01.svg' },
    ],
  });
  assert.deepStrictEqual(rechazos, []);
  const ids = /** @type {any[]} */ (resultado).map((a) => a.id);
  assert.deepStrictEqual(ids, [...ids].sort(), 'ordenado, para que el diff sea legible');
  assert.equal(ids[0], 'aaa-01');
});

// ---------------------------------------------------------------- retirar

test('test_retirar_CONSERVA_la_fila', () => {
  // Lo que esta prohibido es borrarla: los datos ya registrados que la referencian se
  // quedarian sin estimulo.
  const manifiesto = bancoValido(1);
  const id = /** @type {any} */ (manifiesto[0]).id;
  const { resultado } = retirar({ manifiesto, id, fecha: '2026-09-01' });
  assert.equal(/** @type {any} */ (resultado).length, manifiesto.length);
  const fila = /** @type {any} */ (resultado).find((/** @type {any} */ a) => a.id === id);
  assert.equal(fila.status, 'retired');
  assert.equal(fila.retiredAt, '2026-09-01');
});

test('test_retirar_exige_una_fecha_VALIDA_y_no_la_toma_del_reloj', () => {
  // Leer el reloj aqui haria la herramienta no determinista, y quien retira sabe la fecha.
  const manifiesto = bancoValido(1);
  const id = /** @type {any} */ (manifiesto[0]).id;
  for (const mala of ['hoy', '2026-9-1', '01-09-2026', '']) {
    const { resultado, rechazos } = retirar({ manifiesto, id, fecha: mala });
    assert.equal(resultado, null, `'${mala}' deberia rechazarse`);
    assert.equal(rechazos[0]?.codigo, 'fechaInvalida');
  }
});

test('test_retirar_un_id_DESCONOCIDO_o_ya_retirado_se_rechaza', () => {
  const manifiesto = bancoValido(1);
  assert.equal(
    retirar({ manifiesto, id: 'no-existe', fecha: '2026-09-01' }).rechazos[0]?.codigo,
    'idDesconocido',
  );
  const unaVez = /** @type {any} */ (
    retirar({ manifiesto, id: /** @type {any} */ (manifiesto[0]).id, fecha: '2026-09-01' }).resultado
  );
  assert.equal(
    retirar({ manifiesto: unaVez, id: /** @type {any} */ (manifiesto[0]).id, fecha: '2026-09-02' })
      .rechazos[0]?.codigo,
    'yaRetirado',
  );
});

// ---------------------------------------------------------------- serialización

test('test_el_manifiesto_serializado_es_un_MODULO_JS_no_JSON', () => {
  // Sin paso de build, `tsc --checkJs` solo comprueba de verdad literales de codigo: un JSON
  // cargado en ejecucion tipa como `any`. ADR-0001.
  const texto = serializarManifiesto(bancoValido(1).slice(0, 2));
  assert.match(texto, /export default BANCO;/);
  assert.match(texto, /@type \{import\('\.\/esquema\.js'\)\.ImageAsset\[\]\}/);
  assert.match(texto, /No se edita a mano/);
});

test('test_el_manifiesto_serializado_se_puede_volver_a_EVALUAR', async () => {
  // Ida y vuelta de verdad: si el generador produce algo que no es JS valido, el pipeline se
  // rompe en la siguiente ejecucion y no en esta.
  const original = bancoValido(1).slice(0, 3);
  const texto = serializarManifiesto(original);
  const url = `data:text/javascript;base64,${Buffer.from(texto, 'utf-8').toString('base64')}`;
  const mod = await import(url);
  assert.deepStrictEqual(mod.default, original);
});
