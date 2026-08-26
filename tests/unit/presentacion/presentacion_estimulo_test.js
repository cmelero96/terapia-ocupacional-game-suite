/**
 * Sistemas 6 y 7 — criterios de aceptacion de estimulo reducido y silencio.
 * Cubre AC-1 y AC-2. AC-3, AC-4 y AC-7 necesitan navegador; AC-5 y AC-6 son barreras.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimuloReducidoEfectivo, perillaEsApagable, politicaPresentacion,
  hayAudioPermitido, CONFIGURACION_POR_DEFECTO,
} from '../../../src/presentacion/estimulo.js';

// ---------------------------------------------------------------- AC-1

test('test_canario_F1_la_tabla_de_verdad_completa', () => {
  /** @type {[boolean, boolean, boolean][]} */
  const tabla = [
    [false, false, false],
    [false, true, true],
    [true, false, true],
    [true, true, true],
  ];
  for (const [perilla, so, esperado] of tabla) {
    assert.equal(estimuloReducidoEfectivo(perilla, so), esperado, `${perilla} / ${so}`);
  }
});

// ---------------------------------------------------------------- AC-2

test('test_el_sistema_operativo_no_puede_APAGAR_el_modo', () => {
  // Con un AND o una asignacion, este criterio fallaria. Una entrada del entorno puede
  // endurecer una garantia de accesibilidad; nunca relajarla.
  assert.equal(estimuloReducidoEfectivo(false, true), true);
  assert.equal(estimuloReducidoEfectivo(true, true), true);
  // Y no existe ninguna combinacion en que el sistema operativo lo apague.
  const apagados = [[false, true], [true, true]].filter(
    ([p, s]) => estimuloReducidoEfectivo(Boolean(p), Boolean(s)) === false,
  );
  assert.deepStrictEqual(apagados, []);
});

test('test_la_perilla_no_es_apagable_si_el_sistema_operativo_lo_pide', () => {
  // El panel tiene que decirlo: un control que parece apagado y no lo esta es peor que
  // no tenerlo.
  assert.equal(perillaEsApagable(true), false);
  assert.equal(perillaEsApagable(false), true);
});

// ---------------------------------------------------------------- la politica

test('test_el_acuse_de_recibo_nunca_desaparece', () => {
  // Unica regla dura del sistema 6. En modo reducido pierde el movimiento y conserva la
  // existencia: no hay ninguna combinacion que lo elimine.
  for (const reducido of [false, true]) {
    for (const so of [false, true]) {
      const p = politicaPresentacion({ estimuloReducido: reducido, silencio: true }, so);
      assert.ok(!Object.hasOwn(p, 'sinAcuse'), 'no debe existir una via para quitar el acuse');
      assert.equal(typeof p.acuseEstatico, 'boolean');
    }
  }
});

test('test_en_modo_reducido_no_queda_movimiento', () => {
  const p = politicaPresentacion({ estimuloReducido: true, silencio: true }, false);
  assert.equal(p.sinMovimiento, true);
  assert.equal(p.acuseEstatico, true);
  assert.equal(p.progresoEscalonado, true);
  assert.equal(p.sinDecoracion, true);
});

test('test_estimulo_reducido_implica_silencio_pero_no_al_reves', () => {
  const reducidoConAudio = politicaPresentacion(
    { estimuloReducido: true, silencio: false },
    false,
  );
  assert.equal(reducidoConAudio.silencio, true, 'reducir el estimulo apaga el audio');

  const silencioSinReducir = politicaPresentacion(
    { estimuloReducido: false, silencio: true },
    false,
  );
  assert.equal(silencioSinReducir.sinMovimiento, false, 'silenciar no quita el movimiento');
});

test('test_el_silencio_es_el_valor_por_defecto', () => {
  // Con sensibilidad sensorial confirmada, el silencio es el estado del que se sale a
  // proposito, no una opcion que se activa.
  assert.equal(CONFIGURACION_POR_DEFECTO.silencio, true);
  assert.equal(CONFIGURACION_POR_DEFECTO.estimuloReducido, false);
});

// ---------------------------------------------------------------- F2, audio

test('test_hayAudioPermitido_exige_las_cuatro_condiciones', () => {
  const todas = {
    informativo: true,
    apagadoPorDefecto: true,
    noIndicaResultado: true,
    tieneAlternativaVisual: true,
  };
  assert.equal(hayAudioPermitido(todas), true);
  // Quitar cualquiera de las cuatro lo invalida.
  for (const clave of Object.keys(todas)) {
    assert.equal(
      hayAudioPermitido({ ...todas, [clave]: false }),
      false,
      `sin ${clave} no deberia permitirse`,
    );
  }
});

test('test_un_sonido_de_acierto_nunca_se_permite', () => {
  // El caso concreto que la fórmula existe para rechazar: un sonido de recompensa que
  // indica resultado. Rompe el pilar 2 y el anti-pilar 3 a la vez.
  assert.equal(
    hayAudioPermitido({
      informativo: false,
      apagadoPorDefecto: true,
      noIndicaResultado: false,
      tieneAlternativaVisual: true,
    }),
    false,
  );
});
