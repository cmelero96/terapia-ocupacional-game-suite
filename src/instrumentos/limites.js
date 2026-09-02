/**
 * Qué significa `C` en cada instrumento, y hasta dónde llega.
 *
 * ## Por qué existe este archivo
 *
 * `C` es **una** perilla del sistema 4 —«cantidad»— y cada instrumento la usa para otra cosa:
 * objetos en el tablero, opciones de una elección, palabras de una frase, artículos de un
 * lineal. Cada uno tiene su propio tope, y esos topes estaban **escritos a mano y dispersos**:
 * un `Math.min(Math.max(config.C, 2), 6)` en la raíz de composición, otro dentro de
 * `Comprar`, otro en `TresEnRaya`.
 *
 * Eso ya costó un defecto: el aviso de «el eje perceptivo no mide progreso aquí» se le
 * enseñaba a **tres** instrumentos con una lista escrita a mano, y el problema lo tienen
 * **seis**. Un dato duplicado en cuatro sitios no se mantiene sincronizado; uno declarado en
 * un sitio sí.
 *
 * ## Lo que este archivo NO decide
 *
 * Los topes son de proyecto y **ninguno está validado con personas**. El de 6 opciones tiene
 * un argumento —por encima, la tarea deja de ser reconocimiento y pasa a ser barrido de una
 * lista, que es lo que mide Busca— pero el número exacto lo elegí yo.
 */

import { C_MIN, C_MAX } from '../dificultad/constantes.js';
import { dp } from '../dificultad/modelo.js';
import { PRECIOS_2026, FRASES } from '../contenido/provisional.js';

/**
 * @typedef {object} LimiteC
 * @property {number} min
 * @property {number} max
 * @property {string} significado Qué cuenta `C` en este instrumento. Lo lee el terapeuta
 */

/** Tope de opciones en una elección. Ver la nota de arriba: sin validar. */
const MAX_OPCIONES = 6;

/**
 * Las longitudes de frase que el catálogo ofrece de verdad.
 *
 * **No es una constante:** si mañana se añade una frase de ocho palabras, el tope de
 * `ordenar` sube solo. Escribirlo a mano lo dejaría desincronizado con el contenido.
 */
const LONGITUDES_DE_FRASE = [...new Set(FRASES.map((f) => f.palabras.length))];

/**
 * @type {Readonly<Record<string, LimiteC>>}
 */
export const LIMITES_C = Object.freeze({
  busca: { min: C_MIN, max: C_MAX, significado: 'objetos en el tablero' },
  denominar: { min: C_MIN, max: C_MAX, significado: 'objetos en el tablero' },
  clasificar: { min: C_MIN, max: C_MAX, significado: 'objetos por clasificar' },
  rellenar: { min: 2, max: MAX_OPCIONES, significado: 'sílabas entre las que elegir' },
  simbolos: { min: 2, max: MAX_OPCIONES, significado: 'palabras entre las que elegir' },
  precios: { min: 2, max: MAX_OPCIONES, significado: 'precios entre los que elegir' },
  tresEnRaya: { min: 2, max: MAX_OPCIONES, significado: 'respuestas a la operación' },
  ordenar: {
    min: Math.min(...LONGITUDES_DE_FRASE),
    max: Math.max(...LONGITUDES_DE_FRASE),
    significado: 'palabras de la frase',
  },
  comprar: { min: 2, max: PRECIOS_2026.length, significado: 'artículos en el lineal' },
});

/**
 * Los límites de un instrumento.
 *
 * **Un instrumento desconocido devuelve los límites generales**, no lanza: es una lectura de
 * catálogo. Quien construye el instrumento ya valida su configuración.
 *
 * @param {string} instrumento
 * @returns {LimiteC}
 */
export function limitesDe(instrumento) {
  return LIMITES_C[instrumento] ?? { min: C_MIN, max: C_MAX, significado: 'elementos' };
}

/**
 * Acota `C` a lo que este instrumento puede servir.
 *
 * @param {string} instrumento
 * @param {number} C
 * @returns {number}
 */
export function acotarC(instrumento, C) {
  const l = limitesDe(instrumento);
  if (!Number.isFinite(C)) throw new RangeError(`acotarC: C no finita (${C})`);
  return Math.min(Math.max(Math.round(C), l.min), l.max);
}

/**
 * El recorrido de `dp` al que este instrumento llega, con similitud cero.
 *
 * Se mide con `sv = ss = 0` a propósito: los instrumentos sin banco de imágenes **no tienen**
 * similitud visual ni semántica, así que toda su variación de `dp` viene de la cantidad. Para
 * Busca el número sale bajo por el mismo motivo, y ahí sí sube con la similitud.
 *
 * @param {string} instrumento
 * @returns {{ min: number, max: number, rango: number }}
 */
export function rangoDeDp(instrumento) {
  const l = limitesDe(instrumento);
  const min = dp(Math.max(l.min, C_MIN), 0, 0);
  const max = dp(Math.max(l.max, C_MIN), 0, 0);
  return { min, max, rango: max - min };
}

/**
 * Recorrido mínimo de `dp` para que el eje perceptivo pueda mostrar progreso.
 *
 * **Sin validar, y es un juicio.** El razonamiento: `dp` se publica con un decimal, y la
 * diferencia entre dos ajustes que el terapeuta ve tiene que superar el redondeo por un
 * margen amplio. Con 10 puntos de recorrido y unos cinco escalones útiles, dos ajustes
 * contiguos se separan un par de puntos, que ya es el borde. Por debajo de 10, el eje es
 * ruido.
 *
 * Lo que NO se puede hacer es fijar el umbral contra el ruido de medida, porque no hay
 * estimación de ruido: haría falta medir con personas.
 */
export const RANGO_DP_MINIMO = 10;

/**
 * ¿El eje perceptivo de este instrumento puede mostrar progreso?
 *
 * Medido: los instrumentos de elección, el tres en raya y ordenar llegan a **2,1 puntos sobre
 * 100**; comprar a 6,3; Busca a 40 sólo con la cantidad, y a 100 con la similitud.
 *
 * En el tres en raya importa menos que en los demás, y es el único del que se puede decir eso:
 * **tiene eje de contenido**, así que su graduación real está en las variantes de aritmética.
 *
 * @param {string} instrumento
 * @returns {boolean}
 */
export function ejePerceptivoPlano(instrumento) {
  return rangoDeDp(instrumento).rango < RANGO_DP_MINIMO;
}
