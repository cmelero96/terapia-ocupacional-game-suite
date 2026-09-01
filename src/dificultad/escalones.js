/**
 * Escalones de las perillas de dificultad. Sistema 4 · ADR-0006.
 *
 * **Por qué existen.** Con un deslizador continuo, la sesión de marzo a 63 px y la de junio
 * a 64 px no son comparables: no se puede saber si el paciente mejoró o si el terapeuta
 * movió el control un pelo. Y todo el producto existe para medir progreso.
 *
 * Los escalones lo arreglan por construcción: **dos sesiones en el mismo escalón son
 * comparables, y punto.** El eje de progreso deja de necesitar un margen de tolerancia
 * inventado para decidir si dos configuraciones "son la misma".
 *
 * **Y hay un segundo motivo que el concepto no menciona.** Un `<input type="range">` se
 * opera arrastrando. `technical-preferences.md` prohíbe el arrastre como vía única, y el
 * criterio 2.5.7 de WCAG 2.2 exige alternativa. Un grupo de botones no se arrastra: es
 * alcanzable con un solo punto de activación, y por tanto también con barrido y con
 * permanencia. El deslizador era, además, la única parte del producto que fallaba su propia
 * regla de entrada.
 *
 * **Lo que se pierde.** Ajuste fino. Si un paciente necesita exactamente 63 px y el escalón
 * más cercano es 60, se juega a 60. Es el precio de poder comparar, y es el que el concepto
 * eligió pagar.
 */

import { T_MIN, T_AAA, T_MAX, C_MIN, C_MAX } from './constantes.js';

/**
 * Tamaño del objetivo, en píxeles.
 *
 * Los tres primeros no son arbitrarios: **24 es el mínimo de WCAG 2.5.8**, **44 es el mínimo
 * AAA** y a la vez la frontera donde los dos ejes dejan de ser independientes, y **140 es el
 * techo de disposición**. Los intermedios están espaciados de forma aproximadamente
 * logarítmica, porque la dificultad motora lo es: de 24 a 32 se nota mucho más que de 120 a
 * 140.
 *
 * @type {readonly number[]}
 */
export const ESCALONES_T = Object.freeze([T_MIN, 32, T_AAA, 60, 80, 100, 120, T_MAX]);

/**
 * Objetos en el tablero.
 *
 * Denso abajo y disperso arriba, por el mismo motivo: de 3 a 4 objetos es un salto grande
 * de carga, y de 40 a 60 es casi imperceptible. El techo es `C_MAX`, bajado a 60 en
 * ADR-0006.
 *
 * @type {readonly number[]}
 */
export const ESCALONES_C = Object.freeze([C_MIN, 4, 6, 9, 12, 16, 20, 30, 40, C_MAX]);

/**
 * Proporción de distractores con similitud alta, visual o semántica.
 *
 * Cuartos. Cinco escalones bastan: nadie ha demostrado que la diferencia entre 0,30 y 0,35
 * sea perceptible, y fingir esa precisión es justo lo que rompe la comparabilidad.
 *
 * @type {readonly number[]}
 */
export const ESCALONES_PROPORCION = Object.freeze([0, 0.25, 0.5, 0.75, 1]);

/**
 * El escalón más cercano a un valor, para migrar una configuración antigua.
 *
 * **Nunca coerciona en silencio un dato ausente**: `valor` tiene que ser un número finito.
 * Un `undefined` convertido al primer escalón sería una configuración plausible e
 * inventada, que es la forma de defecto que este proyecto persigue.
 *
 * @param {number} valor
 * @param {readonly number[]} escalones
 * @returns {number}
 */
export function escalonMasCercano(valor, escalones) {
  if (!Number.isFinite(valor)) {
    throw new RangeError(`escalonMasCercano: valor no finito (${valor})`);
  }
  const primero = escalones[0];
  if (primero === undefined) throw new RangeError('escalonMasCercano: sin escalones');

  let mejor = primero;
  let distancia = Math.abs(valor - primero);
  for (const e of escalones) {
    const d = Math.abs(valor - e);
    // `<` y no `<=`: con un empate gana el escalón MÁS BAJO, que es el más fácil. Si hay
    // que equivocarse al migrar, se equivoca hacia el lado que no frustra al paciente.
    if (d < distancia) {
      mejor = e;
      distancia = d;
    }
  }
  return mejor;
}

/**
 * ¿Es este valor exactamente un escalón?
 *
 * @param {number} valor
 * @param {readonly number[]} escalones
 * @returns {boolean}
 */
export function esEscalon(valor, escalones) {
  return escalones.some((e) => Math.abs(e - valor) < 1e-9);
}
