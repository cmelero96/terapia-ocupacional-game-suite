/**
 * Sistema 11 — criterios de aceptacion de la deteccion de conflictos.
 * Cubre AC-5. Los demas necesitan navegador.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  conflictos, esAplicable, avisos, describirRango,
} from '../../../src/panel/conflictos.js';

/** @param {object} [p] */
const entrada = (p = {}) => ({
  config: { t: 60, C: 12 },
  acceso: { barrido: false, msVuelta: 12000, limitaciones: /** @type {string[]} */ ([]) },
  bancoActivo: 32,
  anchoDisponible: 1280,
  ...p,
});

// ---------------------------------------------------------------- AC-5

test('test_una_configuracion_valida_no_produce_conflictos', () => {
  const lista = conflictos(entrada());
  assert.deepStrictEqual(lista, []);
  assert.equal(esAplicable(lista), true);
});

test('test_canario_F1_noCabe_bloquea_y_nombra_las_dos_cifras', () => {
  // 100 objetos de 140 px necesitan 1627 px y hay 1280.
  const lista = conflictos(entrada({
    config: { t: 140, C: 100 }, bancoActivo: 200,
  }));
  const c = lista.find((x) => x.codigo === 'noCabe');
  assert.ok(c !== undefined, 'deberia detectar noCabe');
  assert.equal(c.bloquea, true);
  assert.match(c.mensaje, /1627/);
  assert.match(c.mensaje, /1280/);
  assert.equal(esAplicable(lista), false);
});

test('test_canario_F1_bancoInsuficiente_bloquea_y_nombra_el_numero_real', () => {
  const lista = conflictos(entrada({ config: { t: 60, C: 100 } }));
  const c = lista.find((x) => x.codigo === 'bancoInsuficiente');
  assert.ok(c !== undefined);
  assert.equal(c.bloquea, true);
  // AC-6 exige que el mensaje nombre el numero real de objetos del banco.
  assert.match(c.mensaje, /32 objetos activos/);
  assert.equal(esAplicable(lista), false);
});

test('test_canario_F1_barridoRecortado_AVISA_y_no_bloquea', () => {
  // Banco de 200: si se deja en 32, salta tambien `bancoInsuficiente`, que SI bloquea, y
  // el test dejaria de aislar lo que dice medir.
  const lista = conflictos(entrada({
    config: { t: 60, C: 40 },
    acceso: { barrido: true, msVuelta: 12000, limitaciones: [] },
    bancoActivo: 200,
  }));
  const c = lista.find((x) => x.codigo === 'barridoRecortado');
  assert.ok(c !== undefined);
  assert.equal(c.bloquea, false, 'es una degradacion declarada, no un error');
  // 40 pasos al suelo de 400 ms son 16 s de vuelta real.
  assert.match(c.mensaje, /16\.0 s/);
  assert.equal(esAplicable(lista), true, 'un aviso no impide aplicar');
});

test('test_canario_F1_perfilTenso_AVISA_y_no_bloquea', () => {
  const lista = conflictos(entrada({
    config: { t: 44, C: 12 },
    acceso: { barrido: true, msVuelta: 12000, limitaciones: ['B1', 'B7'] },
  }));
  const c = lista.find((x) => x.codigo === 'perfilTenso');
  assert.ok(c !== undefined, 'B1 + B7 con t < 60 debe avisar');
  assert.equal(c.bloquea, false, 'el terapeuta manda');
  assert.equal(esAplicable(lista), true);
});

test('test_perfilTenso_no_salta_si_la_configuracion_respeta_el_perfil', () => {
  const lista = conflictos(entrada({
    config: { t: 60, C: 30 },
    acceso: { barrido: true, msVuelta: 12000, limitaciones: ['B1', 'B7'] },
  }));
  assert.equal(lista.find((x) => x.codigo === 'perfilTenso'), undefined);
});

test('test_perfilTenso_exige_las_DOS_limitaciones', () => {
  for (const limitaciones of [['B1'], ['B7'], []]) {
    const lista = conflictos(entrada({
      config: { t: 44, C: 40 },
      acceso: { barrido: false, msVuelta: 12000, limitaciones },
    }));
    assert.equal(
      lista.find((x) => x.codigo === 'perfilTenso'), undefined,
      `con ${JSON.stringify(limitaciones)} no debe saltar`,
    );
  }
});

test('test_solo_noCabe_y_bancoInsuficiente_bloquean', () => {
  // Los cuatro a la vez: dos bloquean, dos avisan.
  const lista = conflictos(entrada({
    config: { t: 140, C: 100 },
    acceso: { barrido: true, msVuelta: 12000, limitaciones: ['B1', 'B7'] },
    bancoActivo: 32,
  }));
  const codigos = lista.map((c) => c.codigo).sort();
  assert.deepStrictEqual(codigos, ['bancoInsuficiente', 'barridoRecortado', 'noCabe', 'perfilTenso']);
  const bloqueantes = lista.filter((c) => c.bloquea).map((c) => c.codigo).sort();
  assert.deepStrictEqual(bloqueantes, ['bancoInsuficiente', 'noCabe']);
});

test('test_todo_mensaje_dice_CON_PALABRAS_si_impide_continuar', () => {
  // AC-8: los mensajes no pueden depender del color.
  const lista = conflictos(entrada({
    config: { t: 60, C: 40 },
    acceso: { barrido: true, msVuelta: 12000, limitaciones: ['B1', 'B7'] },
    bancoActivo: 200,
  }));
  for (const c of lista) {
    assert.ok(c.mensaje.length > 20, `mensaje demasiado corto: ${c.mensaje}`);
    if (!c.bloquea) {
      assert.match(c.mensaje, /Aviso/, `un aviso debe decirlo: ${c.mensaje}`);
    }
  }
});

// ---------------------------------------------------------------- F2, avisos

test('test_el_aviso_de_ejes_acoplados_aparece_por_debajo_de_44', () => {
  const a = avisos({ config: { t: 32 }, prefersReducedMotion: false });
  const av = a.find((x) => x.codigo === 'ejesAcoplados');
  assert.ok(av !== undefined);
  assert.match(av.mensaje, /32 px/);
  assert.match(av.mensaje, /valida/, 'debe decir que la configuracion es valida');
  // A 44 exactos, no.
  assert.equal(
    avisos({ config: { t: 44 }, prefersReducedMotion: false })
      .find((x) => x.codigo === 'ejesAcoplados'),
    undefined,
  );
});

test('test_el_aviso_de_movimiento_reducido_explica_que_no_se_puede_apagar', () => {
  const a = avisos({ config: { t: 60 }, prefersReducedMotion: true });
  const av = a.find((x) => x.codigo === 'movimientoReducidoDelSistema');
  assert.ok(av !== undefined);
  assert.match(av.mensaje, /no se puede apagar/);
});

test('test_el_aviso_de_similitud_no_alcanzada_nombra_las_dos_cifras', () => {
  const a = avisos({
    config: { t: 60 },
    prefersReducedMotion: false,
    ultimoTablero: { svPedida: 0.8, svEfectiva: 0.36 },
  });
  const av = a.find((x) => x.codigo === 'similitudNoAlcanzada');
  assert.ok(av !== undefined);
  assert.match(av.mensaje, /0\.36/);
  assert.match(av.mensaje, /0\.80/);
});

test('test_una_diferencia_pequena_de_similitud_no_avisa', () => {
  // El redondeo de F1 del sistema 8 produce diferencias de un elemento. No es noticia.
  const a = avisos({
    config: { t: 60 },
    prefersReducedMotion: false,
    ultimoTablero: { svPedida: 0.25, svEfectiva: 3 / 11 },
  });
  assert.equal(a.find((x) => x.codigo === 'similitudNoAlcanzada'), undefined);
});

// ---------------------------------------------------------------- rangos

test('test_un_rango_degenerado_y_uno_abierto_se_distinguen_a_la_vista', () => {
  // Con la politica fija los dos se comportan igual, y confundirlos hara que alguien crea
  // que la adaptativa esta activa cuando no lo esta.
  const degenerado = describirRango({ min: 60, max: 60 }, 'px');
  const abierto = describirRango({ min: 44, max: 100 }, 'px');
  assert.notEqual(degenerado, abierto);
  assert.match(degenerado, /Valor fijo/);
  assert.match(abierto, /Rango 44–100/);
  assert.match(abierto, /se usa 44/);
});
