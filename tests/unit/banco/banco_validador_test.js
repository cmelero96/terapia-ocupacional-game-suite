/**
 * Validador del manifiesto. Sistema 13.
 *
 * Los criterios de aceptación del sistema 1, que estaban escritos y no tenían nada que
 * comprobar: AC-1, AC-3c, AC-4, AC-5a, AC-6.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarManifiesto } from '../../../tools/banco/validar.js';
import { CLUSTER_MIN, BANCO_TOTAL, G, R_MAX, C_MAX } from '../../../src/banco/constantes.js';
import { bancoValido, todoExiste, faltan } from '../../fixtures/banco-manifiesto.js';

/**
 * @param {readonly import('../../../src/banco/esquema.js').ImageAsset[]} manifiesto
 * @param {object} [opciones]
 * @param {(file: string) => boolean} [opciones.existeArchivo]
 * @param {'advertencia' | 'bloqueo'} [opciones.escalonClusterMin]
 */
const val = (manifiesto, opciones = {}) => validarManifiesto({
  manifiesto,
  existeArchivo: opciones.existeArchivo ?? todoExiste(),
  ...(opciones.escalonClusterMin === undefined
    ? {} : { escalonClusterMin: opciones.escalonClusterMin }),
});

/** @param {import('../../../src/banco/esquema.js').Informe} inf @param {string} codigo */
const tiene = (inf, codigo) => inf.errores.some((e) => e.codigo === codigo);

// ---------------------------------------------------------------- canario de la derivación

test('test_canario_clusterMin_COINCIDE_con_su_derivacion', () => {
  // ADR-0006 encontró que `clusterMin` estaba derivada de una fórmula MUERTA, y eso arrastró
  // el presupuesto de contenido entero durante meses. Este canario existe para que mover
  // `C_MAX` sin recalcular falle aquí en lugar de aparecer en una factura de arte.
  assert.equal(CLUSTER_MIN, Math.ceil((C_MAX - 1) / R_MAX) + 1);
  assert.equal(BANCO_TOTAL, CLUSTER_MIN * G);
  // Y los números publicados, para que un cambio silencioso se vea.
  assert.equal(C_MAX, 60);
  assert.equal(CLUSTER_MIN, 16);
  assert.equal(BANCO_TOTAL, 256);
});

// ---------------------------------------------------------------- el caso base

test('test_un_manifiesto_VALIDO_pasa_sin_errores', () => {
  // La mitad del valor del fixture: sin un caso base que pase, un test que falla no
  // distingue "encontre el defecto" de "el fixture esta mal".
  const inf = val(bancoValido(2));
  assert.deepStrictEqual(inf.errores, []);
  assert.equal(inf.activos, CLUSTER_MIN * 2);
  assert.equal(inf.retirados, 0);
  assert.equal(inf.porCluster.size, 2);
});

// ---------------------------------------------------------------- AC-1

test('test_AC1_un_id_DUPLICADO_es_un_error_que_nombra_el_id', () => {
  const b = bancoValido(1);
  const primero = /** @type {any} */ (b[0]);
  b.push({ ...primero, file: 'otro/archivo.svg' });
  const inf = val(b);
  assert.ok(tiene(inf, 'idDuplicado'));
  const e = /** @type {any} */ (inf.errores.find((x) => x.codigo === 'idDuplicado'));
  assert.equal(e.id, primero.id, 'el error nombra el id');
  assert.match(e.mensaje, /2 veces/);
});

test('test_un_id_que_no_es_kebab_case_es_un_error', () => {
  // Un id es una clave de datos: mayúsculas y acentos producen dos claves que un humano lee
  // como una.
  for (const malo of ['Manzana', 'manzana_roja', 'manzana roja', 'manzaná', '-manzana', 'a--b']) {
    const b = bancoValido(1);
    /** @type {any} */ (b[0]).id = malo;
    assert.ok(tiene(val(b), 'idNoKebab'), `'${malo}' deberia fallar`);
  }
});

test('test_los_ids_kebab_case_VALIDOS_no_fallan', () => {
  for (const bueno of ['manzana', 'manzana-roja', 'silla-madera-01', 'a1-b2']) {
    const b = bancoValido(1);
    /** @type {any} */ (b[0]).id = bueno;
    assert.equal(tiene(val(b), 'idNoKebab'), false, `'${bueno}' no deberia fallar`);
  }
});

// ---------------------------------------------------------------- AC-4

test('test_AC4_validacion_TOTAL_no_se_para_en_el_primer_error', () => {
  // Con 256 entradas curadas a mano, un validador que aborta obliga a 256 ejecuciones para
  // encontrar 256 erratas.
  const b = bancoValido(1);
  delete /** @type {any} */ (b[0]).categories;
  delete /** @type {any} */ (b[1]).name;
  /** @type {any} */ (b[2]).status = 'inventado';
  const inf = val(b);
  assert.ok(inf.errores.length >= 3, `esperaba 3 o mas, hubo ${inf.errores.length}`);
  assert.ok(tiene(inf, 'categoriesAusente'));
  assert.ok(tiene(inf, 'campoAusente'));
  assert.ok(tiene(inf, 'statusInvalido'));
});

test('test_los_seis_campos_obligatorios_se_comprueban', () => {
  for (const campo of ['id', 'file', 'categories', 'cluster', 'name', 'status']) {
    const b = bancoValido(1);
    delete /** @type {any} */ (b[0])[campo];
    assert.ok(val(b).errores.length > 0, `quitar '${campo}' deberia fallar`);
  }
});

test('test_un_error_nombra_la_ENTRADA_aunque_el_id_sea_lo_que_falta', () => {
  // Un mensaje que dice "falta un campo" sin decir cual ni donde no es accionable.
  const b = bancoValido(1);
  delete /** @type {any} */ (b[3]).id;
  const inf = val(b);
  const e = /** @type {any} */ (inf.errores.find((x) => x.codigo === 'idAusente'));
  assert.match(e.mensaje, /entrada #3/);
});

test('test_una_categoria_vacia_o_repetida_es_un_error', () => {
  const b1 = bancoValido(1);
  /** @type {any} */ (b1[0]).categories = ['cocina', ''];
  assert.ok(tiene(val(b1), 'categoriaVacia'));

  const b2 = bancoValido(1);
  /** @type {any} */ (b2[0]).categories = ['cocina', 'cocina'];
  assert.ok(tiene(val(b2), 'categoriaRepetida'));

  const b3 = bancoValido(1);
  /** @type {any} */ (b3[0]).categories = [];
  assert.ok(tiene(val(b3), 'categoriesAusente'));
});

// ---------------------------------------------------------------- AC-3c, las DOS direcciones

test('test_AC3c_retirado_SIN_retiredAt_falla', () => {
  const b = bancoValido(1);
  /** @type {any} */ (b[0]).status = 'retired';
  const inf = val(b);
  assert.ok(tiene(inf, 'retiredAtAusente'));
  // Y el mensaje dice POR QUÉ hace falta la fecha.
  const e = /** @type {any} */ (inf.errores.find((x) => x.codigo === 'retiredAtAusente'));
  assert.match(e.mensaje, /el paciente empeoro/);
});

test('test_AC3c_activo CON_retiredAt_tambien_falla', () => {
  // La otra dirección, que un `if (retired && !retiredAt)` deja pasar.
  const b = bancoValido(1);
  /** @type {any} */ (b[0]).retiredAt = '2026-09-01';
  assert.ok(tiene(val(b), 'retiredAtSobrante'));
});

test('test_una_fecha_de_retirada_MAL_FORMADA_falla', () => {
  for (const mala of ['01/09/2026', '2026-9-1', '2026-09-01T10:00:00Z', 'ayer', '']) {
    const b = bancoValido(1);
    /** @type {any} */ (b[0]).status = 'retired';
    /** @type {any} */ (b[0]).retiredAt = mala;
    assert.ok(tiene(val(b), 'retiredAtAusente'), `'${mala}' deberia fallar`);
  }
});

test('test_un_retirado_bien_formado_pasa_y_no_cuenta_en_su_cluster', () => {
  const b = bancoValido(1);
  /** @type {any} */ (b[0]).status = 'retired';
  /** @type {any} */ (b[0]).retiredAt = '2026-09-01';
  const inf = val(b, { escalonClusterMin: 'advertencia' });
  assert.deepStrictEqual(inf.errores, []);
  assert.equal(inf.retirados, 1);
  assert.equal(inf.activos, CLUSTER_MIN - 1);
  // Y por eso el cluster baja del mínimo: retirar CAMBIA la dificultad.
  assert.ok(inf.advertencias.some((a) => a.codigo === 'clusterPorDebajoDelMinimo'));
});

// ---------------------------------------------------------------- AC-5a

test('test_AC5a_un_archivo_AUSENTE_es_un_error_que_nombra_el_id', () => {
  const b = bancoValido(1);
  const victima = /** @type {any} */ (b[5]);
  const inf = val(b, { existeArchivo: faltan([victima.file]) });
  assert.ok(tiene(inf, 'archivoAusente'));
  const e = /** @type {any} */ (inf.errores.find((x) => x.codigo === 'archivoAusente'));
  assert.equal(e.id, victima.id);
});

test('test_dos_entradas_con_el_MISMO_archivo_es_un_error', () => {
  // Dos ids para un estímulo: la medición asume que un id es un estímulo.
  const b = bancoValido(1);
  /** @type {any} */ (b[1]).file = /** @type {any} */ (b[0]).file;
  const inf = val(b);
  assert.ok(tiene(inf, 'archivoCompartido'));
});

// ---------------------------------------------------------------- AC-6 y su escalón

test('test_AC6_un_cluster_por_debajo_del_minimo_BLOQUEA_con_el_banco_completo', () => {
  const b = bancoValido(1);
  b.pop();
  const inf = val(b, { escalonClusterMin: 'bloqueo' });
  assert.ok(tiene(inf, 'clusterPorDebajoDelMinimo'));
  const e = /** @type {any} */ (
    inf.errores.find((x) => x.codigo === 'clusterPorDebajoDelMinimo')
  );
  // El mensaje nombra el cluster, el recuento real y el mínimo.
  assert.equal(e.cluster, 'recipientes');
  assert.match(e.mensaje, new RegExp(String(CLUSTER_MIN - 1)));
  assert.match(e.mensaje, new RegExp(`minimo ${CLUSTER_MIN}`));
});

test('test_el_ESCALON_por_nivel_convierte_el_bloqueo_en_aviso', () => {
  // En el nivel 0 ningún reparto de las primeras imágenes satisface el mínimo, así que el
  // primer manifiesto sería inválido por construcción. El escalón existe para que la salida
  // fácil no sea BAJAR clusterMin, que es lo único que hace real la perilla de similitud.
  const b = bancoValido(1);
  b.pop();
  const inf = val(b, { escalonClusterMin: 'advertencia' });
  assert.deepStrictEqual(inf.errores, []);
  assert.equal(inf.advertencias.length, 1);
  assert.equal(inf.advertencias[0]?.codigo, 'clusterPorDebajoDelMinimo');
});

test('test_un_cluster_EXACTAMENTE_en_el_minimo_pasa', () => {
  // El límite, que es donde un `<` mal puesto se convierte en `<=`.
  const inf = val(bancoValido(1), { escalonClusterMin: 'bloqueo' });
  assert.deepStrictEqual(inf.errores, []);
  assert.equal(inf.porCluster.get('recipientes'), CLUSTER_MIN);
});

// ---------------------------------------------------------------- regla 9, el color

test('test_un_cluster_con_termino_de_COLOR_en_el_nombre_es_un_error', () => {
  // La separación entre clusters debe sobrevivir en escala de grises: si dos clusters sólo se
  // distinguen por matiz, un paciente con daltonismo recibe una dificultad que el terapeuta
  // no configuró.
  for (const malo of ['redondo-rojo', 'frutas-verdes', 'liso-dorado', 'formas-lilas']) {
    const b = bancoValido(1);
    for (const a of b) a.cluster = malo;
    const inf = val(b, { escalonClusterMin: 'advertencia' });
    assert.ok(tiene(inf, 'clusterConMatiz'), `'${malo}' deberia fallar`);
  }
});

test('test_un_cluster_SIN_color_no_falla_por_la_regla_9', () => {
  for (const bueno of ['redondo-liso', 'recipientes', 'objetos-alargados', 'vehiculos-ruedas']) {
    const b = bancoValido(1);
    for (const a of b) a.cluster = bueno;
    const inf = val(b, { escalonClusterMin: 'advertencia' });
    assert.equal(tiene(inf, 'clusterConMatiz'), false, `'${bueno}' no deberia fallar`);
  }
});

// ---------------------------------------------------------------- el manifiesto vacío

test('test_un_manifiesto_VACIO_es_valido_por_forma_y_lo_DICE', () => {
  // Hoy el manifiesto real está vacío: el banco de 256 imágenes todavía no existe. Que sea
  // válido por forma no puede leerse como "listo".
  const inf = val([]);
  assert.deepStrictEqual(inf.errores, []);
  assert.ok(inf.advertencias.some((a) => a.codigo === 'manifiestoVacio'));
  assert.match(
    /** @type {any} */ (inf.advertencias.find((a) => a.codigo === 'manifiestoVacio')).mensaje,
    /no sirve para jugar/,
  );
});

// ---------------------------------------------------------------- el manifiesto real

test('test_el_manifiesto_REAL_del_repositorio_es_valido', async () => {
  // Sin este test, el manifiesto confirmado en git podría estar roto y nadie lo sabría hasta
  // ejecutar el CLI a mano.
  const { default: real } = await import('../../../src/banco/manifiesto.js');
  const inf = validarManifiesto({
    manifiesto: real,
    // Todavía no hay archivos, así que el predicado no puede tocar disco: el manifiesto
    // real está vacío y ninguna entrada lo consulta.
    existeArchivo: () => true,
    escalonClusterMin: 'advertencia',
  });
  assert.deepStrictEqual(inf.errores, [], 'el manifiesto de git debe ser valido');
});

test('test_la_LUMINANCIA_avisa_pero_NO_es_un_error', () => {
  // La regla 9 habla de MATIZ. `claro` contra `oscuro` es luminancia, y la luminancia SÍ
  // sobrevive en escala de grises — que es exactamente lo que la regla pide. Mi primera
  // version de la lista los metia como error, y estaba mal.
  //
  // De lo que hay que avisar es de otra cosa: el pipeline de contraste puede descartar un
  // cluster claro entero. Un limon amarillo palido da 1,06:1 sobre el fondo del tablero.
  for (const luz of ['formas-claras', 'objetos-oscuros', 'liso-palido', 'siluetas-negras']) {
    const b = bancoValido(1);
    for (const a of b) a.cluster = luz;
    const inf = val(b, { escalonClusterMin: 'advertencia' });
    assert.equal(tiene(inf, 'clusterConMatiz'), false, `'${luz}' no es matiz`);
    assert.ok(
      inf.advertencias.some((x) => x.codigo === 'clusterConLuminancia'),
      `'${luz}' deberia avisar`,
    );
  }
});

test('test_un_cluster_sin_matiz_ni_luminancia_no_produce_NINGUN_aviso_de_color', () => {
  // Comprobar los falsos positivos, no solo los verdaderos: `recipientes` y `vehiculos`
  // acaban en `s`, y la comparacion quita la `s` final.
  for (const bueno of ['recipientes', 'vehiculos', 'objetos-alargados', 'redondo-liso',
    'herramientas', 'utensilios', 'mangos', 'prendas']) {
    const b = bancoValido(1);
    for (const a of b) a.cluster = bueno;
    const inf = val(b, { escalonClusterMin: 'advertencia' });
    assert.equal(tiene(inf, 'clusterConMatiz'), false, `'${bueno}' marcado como matiz`);
    assert.equal(
      inf.advertencias.some((x) => x.codigo === 'clusterConLuminancia'), false,
      `'${bueno}' marcado como luminancia`,
    );
  }
});
