/**
 * Escalones de las perillas de dificultad. ADR-0006.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESCALONES_T, ESCALONES_C, ESCALONES_PROPORCION, escalonMasCercano, esEscalon,
} from '../../../src/dificultad/escalones.js';
import { T_MIN, T_AAA, T_MAX, C_MIN, C_MAX } from '../../../src/dificultad/constantes.js';

test('test_los_escalones_de_t_incluyen_los_TRES_limites_normativos', () => {
  // 24 es el minimo de WCAG 2.5.8, 44 el minimo AAA y la frontera donde los dos ejes dejan
  // de ser independientes, y 140 el techo de disposicion. Si un limite no es alcanzable, el
  // terapeuta no puede configurar el caso que la norma nombra.
  for (const v of [T_MIN, T_AAA, T_MAX]) {
    assert.ok(ESCALONES_T.includes(v), `falta el escalon ${v}`);
  }
});

test('test_los_escalones_de_C_van_de_C_MIN_a_C_MAX', () => {
  assert.equal(ESCALONES_C[0], C_MIN);
  assert.equal(ESCALONES_C[ESCALONES_C.length - 1], C_MAX);
});

test('test_todos_los_escalones_estan_DENTRO_de_los_limites_duros', () => {
  for (const v of ESCALONES_T) assert.ok(v >= T_MIN && v <= T_MAX, `t=${v} fuera`);
  for (const v of ESCALONES_C) assert.ok(v >= C_MIN && v <= C_MAX, `C=${v} fuera`);
  for (const v of ESCALONES_PROPORCION) assert.ok(v >= 0 && v <= 1, `p=${v} fuera`);
});

test('test_los_escalones_estan_ORDENADOS_y_sin_repetir', () => {
  // El control se navega con las flechas: desordenado, la flecha derecha bajaria la
  // dificultad a veces.
  for (const esc of [ESCALONES_T, ESCALONES_C, ESCALONES_PROPORCION]) {
    for (let i = 1; i < esc.length; i++) {
      assert.ok(
        /** @type {number} */ (esc[i]) > /** @type {number} */ (esc[i - 1]),
        `no crece en ${i}: ${esc.join(', ')}`,
      );
    }
  }
});

test('test_los_escalones_de_t_estan_espaciados_de_forma_CRECIENTE', () => {
  // La dificultad motora es logaritmica: de 24 a 32 se nota mucho mas que de 120 a 140.
  // Escalones equiespaciados darian saltos de dificultad muy desiguales.
  /** @type {number[]} */
  const saltos = [];
  for (let i = 1; i < ESCALONES_T.length; i++) {
    saltos.push(/** @type {number} */ (ESCALONES_T[i]) - /** @type {number} */ (ESCALONES_T[i - 1]));
  }
  for (let i = 1; i < saltos.length; i++) {
    assert.ok(
      /** @type {number} */ (saltos[i]) >= /** @type {number} */ (saltos[i - 1]),
      `el salto ${i} (${saltos[i]}) es menor que el anterior (${saltos[i - 1]})`,
    );
  }
});

// ---------------------------------------------------------------- escalonMasCercano

test('test_un_valor_que_ya_es_escalon_no_se_mueve', () => {
  for (const v of ESCALONES_T) assert.equal(escalonMasCercano(v, ESCALONES_T), v);
});

test('test_un_valor_intermedio_va_al_mas_cercano', () => {
  assert.equal(escalonMasCercano(63, ESCALONES_T), 60);
  assert.equal(escalonMasCercano(70, ESCALONES_T), 60, 'empate: gana el mas BAJO');
  assert.equal(escalonMasCercano(71, ESCALONES_T), 80);
});

test('test_en_un_EMPATE_gana_el_escalon_mas_bajo', () => {
  // Si hay que equivocarse al migrar una configuracion, se equivoca hacia el lado que no
  // frustra al paciente: el objetivo mas grande y el tablero mas pequeño.
  assert.equal(escalonMasCercano(28, ESCALONES_T), 24);
  assert.equal(escalonMasCercano(0.125, ESCALONES_PROPORCION), 0);
});

test('test_un_valor_fuera_de_rango_se_ajusta_al_extremo', () => {
  assert.equal(escalonMasCercano(1, ESCALONES_T), T_MIN);
  assert.equal(escalonMasCercano(9999, ESCALONES_T), T_MAX);
});

test('test_un_valor_NO_FINITO_lanza_y_no_se_coerciona', () => {
  // `?? 0` sobre una perilla ausente da una configuracion plausible e inventada, que es la
  // forma de defecto que este proyecto persigue. Un dato ausente FALLA.
  for (const malo of [NaN, Infinity, -Infinity]) {
    assert.throws(() => escalonMasCercano(malo, ESCALONES_T), RangeError, `${malo}`);
  }
});

test('test_un_conjunto_de_escalones_VACIO_lanza', () => {
  // Sin guarda, el bucle no entra y devuelve `undefined` disfrazado de valor valido.
  assert.throws(() => escalonMasCercano(60, []), RangeError);
});

test('test_esEscalon_tolera_el_error_de_coma_flotante', () => {
  assert.equal(esEscalon(0.25, ESCALONES_PROPORCION), true);
  assert.equal(esEscalon(0.1 + 0.15, ESCALONES_PROPORCION), true, '0.1+0.15 no es 0.25 exacto');
  assert.equal(esEscalon(0.3, ESCALONES_PROPORCION), false);
});
