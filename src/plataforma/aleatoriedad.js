/**
 * Aleatoriedad determinista. Modulo PURO: no llama a ninguna fuente no determinista
 * del entorno, asi que NO esta exento de la regla 1 y no debe estarlo.
 *
 * Sistema 3 · F1 y F2 de design/gdd/inyeccion-no-determinismo.md
 */

/**
 * F1 — PRNG con semilla, mulberry32.
 *
 * Cuatro lineas, se siembra con un entero de 32 bits sin ceremonia, y su periodo son
 * los 2^32 estados: `a` avanza en una secuencia de Weyl con incremento impar
 * (0x6D2B79F5, coprimo con 2^32), asi que recorre todos sus valores antes de repetirse.
 * Es aritmetica modular, no una propiedad observada.
 *
 * Se elige sobre un generador congruencial lineal porque **con mulberry32 no hay
 * multiplicador que elegir mal**. Un LCG bien elegido tampoco sesga las permutaciones
 * en el rango de uso de este proyecto; uno mal elegido falla de forma catastrofica
 * desde n = 5, y el modo de fallo depende del multiplicador, no de la familia.
 *
 * La semilla se VALIDA, no se coerciona: `semilla >>> 0` convierte en silencio
 * `undefined`, `NaN`, `null` y 4294967296 en la semilla 0, y todos producen la misma
 * secuencia exacta. Un `undefined` que se escapase reconstruiria un tablero historico
 * con semilla 0 y lo presentaria como reproduccion correcta.
 *
 * @param {number} semilla Entero sin signo de 32 bits, en [0, 4294967295]
 * @returns {() => number} Fuente sin marca. Para produccion hay que envolverla en
 *   `envolverConValidacion`, que es el unico acuñador de la marca
 * @throws {RangeError} Si la semilla no es un entero del rango
 */
export function crearFuenteAleatoria(semilla) {
  if (!Number.isInteger(semilla) || semilla < 0 || semilla > 4294967295) {
    throw new RangeError(
      `semilla invalida: ${String(semilla)}, se esperaba entero en [0, 4294967295]`,
    );
  }
  let a = semilla >>> 0;
  return function fuenteAleatoria() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * F2 — barajado de Fisher-Yates, variante de Durstenfeld.
 *
 * No muta la entrada. Consume `max(0, n - 1)` llamadas a la fuente y devuelve una de
 * las n! permutaciones, cada una con probabilidad exactamente 1/n! si la fuente es
 * uniforme.
 *
 * **El rango de sorteo DECRECE con `i`, y eso no es un detalle.** La variante ingenua
 * sortea sobre el rango completo en cada iteracion, lo que produce n^n resultados
 * mapeados sobre n! permutaciones; para n >= 3, n! no divide a n^n, asi que el mapeo
 * no puede ser uniforme. El sesgo solo se detecta contando, y en este producto
 * significaria que **que distractores ve el paciente deja de ser uniforme sin que
 * ningun test funcional lo note** — contaminacion silenciosa de la medicion.
 *
 * El extremo superior esta probado, no supuesto: con `r_max = (2^32-1)/2^32`,
 * `floor(r_max * n)` da `n - 1` para toda n de este proyecto, porque la distancia a
 * `n` es `n * 2^-32` y el medio-ULP es `n * 2^-53`.
 *
 * @template T
 * @param {T[]} array No se muta
 * @param {() => number} fuenteAleatoria Inyectada. Nunca `Math.random`
 * @returns {T[]} Permutacion nueva
 */
export function barajar(array, fuenteAleatoria) {
  const copia = array.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(fuenteAleatoria() * (i + 1));
    const tmp = /** @type {T} */ (copia[i]);
    copia[i] = /** @type {T} */ (copia[j]);
    copia[j] = tmp;
  }
  return copia;
}
