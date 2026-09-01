/**
 * Sistema 8 — criterios de aceptacion de la generacion de tableros.
 * Cubre AC-1 a AC-12. AC-13 lo aplica `tools/ci/invariantes.js`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reparto, muestrear, generarTablero } from '../../../src/tablero/generador.js';
import { crearFuenteAleatoria } from '../../../src/plataforma/aleatoriedad.js';
import { envolverConValidacion } from '../../../src/plataforma/borde-impuro.js';
import { dp } from '../../../src/dificultad/modelo.js';

/** @param {number} semilla */
const fuente = (semilla) => envolverConValidacion(crearFuenteAleatoria(semilla));

/**
 * Banco de prueba: 4 clusters de 24 = 96 elementos, que es exactamente el banco del
 * primer hito segun la biblia de arte.
 *
 * @param {object} [opciones]
 * @param {number} [opciones.porCluster]
 * @param {string[]} [opciones.retirados]
 * @param {boolean} [opciones.clusterObjetivoSolitario] Deja el cluster del objetivo con
 *   un unico elemento activo, para probar el pool vacio
 * @returns {import('../../../src/tablero/generador.js').Elemento[]}
 */
function bancoDePrueba({ porCluster = 24, retirados = [], clusterObjetivoSolitario = false } = {}) {
  const clusters = ['recipientes', 'redondeados', 'escritura', 'vehiculos'];
  const cats = ['cocina', 'alimento', 'oficina', 'calle'];
  /** @type {import('../../../src/tablero/generador.js').Elemento[]} */
  const banco = [];
  clusters.forEach((cluster, ci) => {
    for (let i = 0; i < porCluster; i++) {
      const id = `${cluster}-${i}`;
      banco.push({
        id,
        cluster,
        // Dos categorias por elemento, y la asignacion cruza clusters a proposito: es lo
        // que hace que los dos ejes sean realmente independientes.
        categories: [/** @type {string} */ (cats[ci]), /** @type {string} */ (cats[(ci + i) % cats.length])],
        status:
          retirados.includes(id) || (clusterObjetivoSolitario && cluster === 'recipientes' && i > 0)
            ? 'retirado'
            : 'activo',
      });
    }
  });
  return banco;
}

// ---------------------------------------------------------------- AC-1, AC-2, AC-3

test('test_canario_F1_la_tabla_publicada_exacta', () => {
  /** @type {[number, number, number, number, number, number][]} */
  const tabla = [
    [11, 0.0, 0.0, 0, 0, 11],
    [11, 0.25, 0.25, 3, 3, 5],
    [11, 0.5, 0.5, 6, 5, 0],
    [11, 0.8, 0.8, 9, 2, 0],
    [11, 1.0, 1.0, 11, 0, 0],
    [99, 0.25, 0.25, 25, 25, 49],
  ];
  for (const [nD, sv, ss, nV, nS, nR] of tabla) {
    assert.deepStrictEqual(reparto(nD, sv, ss), { nV, nS, nR }, `nD=${nD} sv=${sv} ss=${ss}`);
  }
});

test('test_con_sv_mas_ss_mayor_que_1_gana_la_visual', () => {
  // La visual cumple lo pedido y la semantica se recorta, porque su peso en dp es el doble.
  const r = reparto(11, 0.8, 0.8);
  assert.equal(r.nV, 9, 'la visual cumple');
  assert.equal(r.nS, 2, 'la semantica se queda con lo que sobra');
});

test('test_el_reparto_siempre_suma_nD', () => {
  let comprobadas = 0;
  for (let nD = 2; nD <= 99; nD++) {
    for (let a = 0; a <= 20; a++) {
      for (let b = 0; b <= 20; b++) {
        const r = reparto(nD, a / 20, b / 20);
        assert.equal(r.nV + r.nS + r.nR, nD, `nD=${nD} sv=${a / 20} ss=${b / 20}`);
        assert.ok(r.nV >= 0 && r.nS >= 0 && r.nR >= 0);
        comprobadas++;
      }
    }
  }
  assert.equal(comprobadas, 98 * 21 * 21);
});

// ---------------------------------------------------------------- AC-4, AC-5

test('test_muestreo_con_techo_duro', () => {
  const pool = ['a', 'b', 'c', 'd'];
  const salida = muestrear(pool, 9, crearFuenteAleatoria(1));
  assert.equal(salida.length, 9);
  /** @type {Map<string, number>} */
  const cuenta = new Map();
  for (const x of salida) cuenta.set(x, (cuenta.get(x) ?? 0) + 1);
  const techo = Math.ceil(9 / 4); // 3
  for (const [id, n] of cuenta) {
    assert.ok(n <= techo, `${id} aparece ${n} veces, techo ${techo}`);
  }
});

test('test_se_rebaraja_entre_pasadas', () => {
  const pool = ['a', 'b', 'c', 'd'];
  const salida = muestrear(pool, 12, crearFuenteAleatoria(7));
  const p1 = salida.slice(0, 4).join('');
  const p2 = salida.slice(4, 8).join('');
  const p3 = salida.slice(8, 12).join('');
  assert.equal(new Set([p1, p2, p3]).size > 1, true, 'las tres pasadas tienen el mismo orden');
  // Y cada pasada es una permutacion completa del pool.
  for (const p of [p1, p2, p3]) {
    assert.deepStrictEqual([...p].sort().join(''), 'abcd');
  }
});

test('test_un_pool_vacio_no_devuelve_nada_y_no_lanza', () => {
  assert.deepStrictEqual(muestrear([], 5, crearFuenteAleatoria(1)), []);
  assert.deepStrictEqual(muestrear(['a'], 0, crearFuenteAleatoria(1)), []);
});

// ---------------------------------------------------------------- AC-6, AC-7

test('test_semilla_fija_tablero_identico_incluido_el_orden', () => {
  const banco = bancoDePrueba();
  /** @param {number} s */
  const gen = (s) => generarTablero({
    banco, objetivo: 'recipientes-0', C: 12, sv: 0.25, ss: 0.25, semilla: s, fuenteAleatoria: fuente(s),
  });
  assert.deepStrictEqual(gen(42), gen(42));
});

test('test_semillas_distintas_tableros_distintos', () => {
  const banco = bancoDePrueba();
  const vistos = new Set();
  for (let s = 1; s <= 100; s++) {
    const t = generarTablero({
      banco, objetivo: 'recipientes-0', C: 12, sv: 0.25, ss: 0.25, semilla: s, fuenteAleatoria: fuente(s),
    });
    vistos.add(t.distractores.join(','));
  }
  assert.ok(vistos.size >= 95, `solo ${vistos.size} de 100 tableros distintos`);
});

// ---------------------------------------------------------------- AC-8, AC-9

test('test_el_objetivo_nunca_aparece_como_distractor', () => {
  const banco = bancoDePrueba();
  for (let s = 1; s <= 200; s++) {
    // sv = 1,0 es el caso peor: todos los distractores del cluster del objetivo.
    const t = generarTablero({
      banco, objetivo: 'recipientes-0', C: 12, sv: 1.0, ss: 0.0, semilla: s, fuenteAleatoria: fuente(s),
    });
    assert.ok(!t.distractores.includes('recipientes-0'), `semilla ${s}`);
  }
});

test('test_el_tablero_tiene_exactamente_C_elementos', () => {
  const banco = bancoDePrueba();
  for (const C of [3, 6, 12, 24, 40, 90]) {
    const t = generarTablero({
      banco, objetivo: 'recipientes-0', C, sv: 0.25, ss: 0.25, semilla: 5, fuenteAleatoria: fuente(5),
    });
    assert.equal(1 + t.distractores.length, C, `C = ${C}`);
  }
});

test('test_un_cluster_pequeno_reutiliza_pero_nunca_devuelve_un_tablero_corto', () => {
  // Cluster de 5 elementos: el pool visual son 4. Con sv = 0,8 y nD = 11 hacen falta 9.
  const banco = bancoDePrueba({ porCluster: 5 });
  const t = generarTablero({
    banco, objetivo: 'recipientes-0', C: 12, sv: 0.8, ss: 0.0, semilla: 3, fuenteAleatoria: fuente(3),
  });
  assert.equal(1 + t.distractores.length, 12);
  assert.equal(t.svEfectiva, 9 / 11, 'con reutilizacion se consigue el numero pedido');
});

// ---------------------------------------------------------------- AC-10, AC-11

test('test_las_proporciones_efectivas_nunca_superan_las_pedidas', () => {
  for (const porCluster of [5, 12, 24]) {
    const banco = bancoDePrueba({ porCluster });
    /** @type {[number, number][]} */
    const pares = [[0, 0], [0.25, 0.25], [0.5, 0.5], [0.8, 0.8], [1, 1]];
    for (const [sv, ss] of pares) {
      const t = generarTablero({
        banco, objetivo: 'recipientes-0', C: 12, sv, ss, semilla: 11, fuenteAleatoria: fuente(11),
      });
      // Margen de un elemento por el redondeo declarado de F1.
      assert.ok(t.svEfectiva <= sv + 1 / 11, `svEfectiva ${t.svEfectiva} > ${sv}`);
      assert.ok(t.ssEfectiva <= ss + 1 / 11, `ssEfectiva ${t.ssEfectiva} > ${ss}`);
    }
  }
});

test('test_dp_recalculada_con_las_efectivas_difiere_cuando_sv_mas_ss_pasa_de_1', () => {
  // El caso real que motiva la regla 3, y NO es el de un cluster pequeño: la regla 4
  // reutiliza, asi que un pool de un elemento da los nueve distractores pedidos. Lo que
  // si recorta es que sv + ss pase de 1.
  const banco = bancoDePrueba();
  const t = generarTablero({
    banco, objetivo: 'recipientes-0', C: 12, sv: 0.8, ss: 0.8, semilla: 3, fuenteAleatoria: fuente(3),
  });
  assert.equal(t.svEfectiva, 9 / 11, 'la visual cumple');
  assert.equal(t.ssEfectiva, 2 / 11, 'la semantica se recorta');

  const dpPedida = dp(12, t.svPedida, t.ssPedida);
  const dpEfectiva = dp(12, t.svEfectiva, t.ssEfectiva);
  // Recalculadas al bajar C_MAX a 60 (ADR-0006). La DIFERENCIA no cambia —11,6— porque
  // `nC` no depende de sv ni de ss: el techo desplaza las dos por igual.
  assert.equal(dpPedida, 54.3);
  assert.equal(dpEfectiva, 42.7);
  // El error va SIEMPRE hacia arriba: registrar la pedida sobrestimaria la dificultad
  // que el paciente afronto de verdad.
  assert.ok(dpPedida > dpEfectiva);
  assert.equal(Math.round((dpPedida - dpEfectiva) * 10) / 10, 11.6);
});

test('test_un_cluster_pequeno_NO_reduce_la_proporcion_efectiva', () => {
  // Hallazgo que solo aparecio al implementar: la reutilizacion de la regla 4 hace que
  // un pool de 4 elementos entregue los 9 distractores pedidos.
  const banco = bancoDePrueba({ porCluster: 5 });
  const t = generarTablero({
    banco, objetivo: 'recipientes-0', C: 12, sv: 0.8, ss: 0.0, semilla: 3, fuenteAleatoria: fuente(3),
  });
  assert.equal(t.svEfectiva, 9 / 11, 'un pool de 4 no recorta la proporcion');
});

test('test_un_pool_vacio_da_proporcion_0_y_no_un_tablero_corto', () => {
  // Cluster cuyo unico elemento activo es el objetivo: no hay de donde sacar.
  const banco = bancoDePrueba({ clusterObjetivoSolitario: true });
  const t = generarTablero({
    banco, objetivo: 'recipientes-0', C: 12, sv: 1.0, ss: 0.0, semilla: 3, fuenteAleatoria: fuente(3),
  });
  assert.equal(t.svEfectiva, 0, 'sin pool visual, la proporcion efectiva es 0');
  assert.equal(1 + t.distractores.length, 12, 'el tablero sigue teniendo C elementos');
  assert.ok(!t.distractores.some((d) => d.startsWith('recipientes-')), 'ninguno del cluster');
});

// ---------------------------------------------------------------- AC-12

test('test_un_id_retirado_no_entra_en_ningun_pool', () => {
  const retirados = ['recipientes-3', 'recipientes-7', 'redondeados-1'];
  const banco = bancoDePrueba({ retirados });
  for (let s = 1; s <= 200; s++) {
    const t = generarTablero({
      banco, objetivo: 'recipientes-0', C: 12, sv: 0.5, ss: 0.5, semilla: s, fuenteAleatoria: fuente(s),
    });
    for (const r of retirados) {
      assert.ok(!t.distractores.includes(r), `semilla ${s}: aparecio ${r}`);
    }
  }
});

test('test_un_objetivo_retirado_o_inexistente_se_rechaza', () => {
  const banco = bancoDePrueba({ retirados: ['recipientes-0'] });
  assert.throws(
    () => generarTablero({
      banco, objetivo: 'recipientes-0', C: 12, sv: 0, ss: 0, semilla: 1, fuenteAleatoria: fuente(1),
    }),
    /no esta activo en el banco/,
  );
  assert.throws(
    () => generarTablero({
      banco: bancoDePrueba(), objetivo: 'no-existe', C: 12, sv: 0, ss: 0, semilla: 1, fuenteAleatoria: fuente(1),
    }),
    /no esta activo en el banco/,
  );
});

test('test_una_C_mayor_que_el_banco_se_rechaza', () => {
  const banco = bancoDePrueba({ porCluster: 3 }); // 12 activos
  assert.throws(
    () => generarTablero({
      banco, objetivo: 'recipientes-0', C: 50, sv: 0, ss: 0, semilla: 1, fuenteAleatoria: fuente(1),
    }),
    /el banco activo solo tiene/,
  );
});
