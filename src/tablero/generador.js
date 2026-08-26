/**
 * Generacion de tableros. Modulo PURO: la fuente aleatoria y el banco llegan como
 * parametros, y **nada de aqui mira el reloj**.
 *
 * Devuelve datos, nunca coordenadas de pixel: lo fija ADR-0005, la disposicion es del CSS.
 *
 * Sistema 8 · design/gdd/generacion-tableros.md
 */

import { barajar } from '../plataforma/aleatoriedad.js';

/**
 * @typedef {object} Elemento
 * @property {string} id
 * @property {string} cluster
 * @property {string[]} categories
 * @property {'activo' | 'retirado'} status
 */

/**
 * @typedef {object} Tablero
 * @property {string} objetivo
 * @property {string[]} distractores
 * @property {number} svPedida
 * @property {number} ssPedida
 * @property {number} svEfectiva
 * @property {number} ssEfectiva
 * @property {number} semilla
 */

/**
 * F1 — cuantos distractores de cada grupo.
 *
 * Con `sv + ss > 1` **gana la visual**, porque su peso en `dp` es el doble (0,40 contra
 * 0,20): es el eje que el terapeuta nota mas, asi que es el que debe cumplirse. El
 * sistema 4 declaro que la combinacion es legitima y delego aqui la resolucion.
 *
 * @param {number} nD Distractores totales
 * @param {number} sv
 * @param {number} ss
 * @returns {{ nV: number, nS: number, nR: number }} Suman exactamente `nD`
 */
export function reparto(nD, sv, ss) {
  if (!Number.isInteger(nD) || nD < 0) {
    throw new RangeError(`nD: se esperaba un entero >= 0, se recibio ${String(nD)}`);
  }
  if (!(sv >= 0 && sv <= 1) || !(ss >= 0 && ss <= 1)) {
    throw new RangeError(`sv y ss deben estar en [0, 1]; se recibio ${String(sv)}, ${String(ss)}`);
  }
  const nV = Math.min(Math.round(sv * nD), nD);
  const nS = Math.min(Math.round(ss * nD), nD - nV);
  return { nV, nS, nR: nD - nV - nS };
}

/**
 * F3 — muestreo sin reemplazo con techo duro POR SEMILLA.
 *
 * Es lo que F3 del sistema 1 exige para que el techo de repeticiones sea duro y no una
 * media. **Se rebaraja entre pasadas**: sin eso, las pasadas 2 y 3 tendrian el mismo
 * orden que la 1 y los primeros elementos del pool apareceran siempre antes.
 *
 * El cursor nace y muere dentro de esta llamada. No hay estado que sobreviva entre
 * tableros, y por eso la semilla sola reproduce el tablero.
 *
 * @template T
 * @param {T[]} pool
 * @param {number} n
 * @param {() => number} fuenteAleatoria
 * @returns {T[]} Longitud `min(n, ...)`. Si el pool esta vacio, longitud 0
 */
export function muestrear(pool, n, fuenteAleatoria) {
  if (n <= 0 || pool.length === 0) return [];
  /** @type {T[]} */
  const salida = [];
  while (salida.length < n) {
    const pasada = barajar(pool, fuenteAleatoria);
    for (const x of pasada) {
      if (salida.length >= n) break;
      salida.push(x);
    }
  }
  return salida;
}

/**
 * Genera un tablero.
 *
 * @param {object} entrada
 * @param {Elemento[]} entrada.banco
 * @param {string} entrada.objetivo Id del objetivo. Lo elige el instrumento
 * @param {number} entrada.C
 * @param {number} entrada.sv
 * @param {number} entrada.ss
 * @param {number} entrada.semilla Se guarda en el tablero, para reproducirlo
 * @param {import('../plataforma/esquema.js').FuenteAleatoria} entrada.fuenteAleatoria
 * @returns {Tablero}
 */
export function generarTablero({ banco, objetivo, C, sv, ss, semilla, fuenteAleatoria }) {
  const activos = banco.filter((e) => e.status === 'activo');
  const elObjetivo = activos.find((e) => e.id === objetivo);
  if (elObjetivo === undefined) {
    throw new Error(`generarTablero: el objetivo '${objetivo}' no esta activo en el banco`);
  }

  const nD = C - 1;
  if (nD > activos.length - 1) {
    throw new RangeError(
      `C = ${C} pide ${nD} distractores y el banco activo solo tiene ${activos.length - 1}`,
    );
  }

  // Los tres pools son DISJUNTOS. Restar el cluster del pool semantico es lo que hace
  // que las dos perillas tengan efectos independientes y sumables: sin eso, un elemento
  // del mismo cluster Y la misma categoria contaria en las dos, y el terapeuta no
  // sabria cual ha movido.
  const otros = activos.filter((e) => e.id !== objetivo);
  const cats = new Set(elObjetivo.categories);
  const poolV = otros.filter((e) => e.cluster === elObjetivo.cluster).map((e) => e.id);
  const poolS = otros
    .filter((e) => e.cluster !== elObjetivo.cluster && e.categories.some((c) => cats.has(c)))
    .map((e) => e.id);
  const poolR = otros
    .filter((e) => e.cluster !== elObjetivo.cluster && !e.categories.some((c) => cats.has(c)))
    .map((e) => e.id);

  // `nR` del reparto no se usa: el resto se calcula por DIFERENCIA REAL sobre lo que
  // los dos pools anteriores pudieron dar, que puede ser menos que lo pedido. Usar el
  // `nR` teorico dejaria el tablero corto cuando un pool se queda sin elementos.
  const { nV, nS } = reparto(nD, sv, ss);

  const tomadosV = muestrear(poolV, nV, fuenteAleatoria);
  const tomadosS = muestrear(poolS, nS, fuenteAleatoria);
  // El resto absorbe lo que los dos pools anteriores no pudieron dar. Nunca se devuelve
  // un tablero corto: `C` es una perilla clinica, y un tablero con menos elementos de
  // los que `C` dice seria un ejercicio distinto del que el terapeuta puso.
  const faltan = nD - tomadosV.length - tomadosS.length;
  const tomadosR = muestrear(poolR.length > 0 ? poolR : otros.map((e) => e.id), faltan, fuenteAleatoria);

  const distractores = barajar([...tomadosV, ...tomadosS, ...tomadosR], fuenteAleatoria);

  return {
    objetivo,
    distractores,
    svPedida: sv,
    ssPedida: ss,
    // Las EFECTIVAS son lo que el paciente vio de verdad, y el sistema 9 recalcula `dp`
    // con estas. Si el registro guardara la pedida, `dp` mentiria — y siempre hacia
    // arriba, porque las proporciones solo pueden bajar.
    svEfectiva: nD === 0 ? 0 : tomadosV.length / nD,
    ssEfectiva: nD === 0 ? 0 : tomadosS.length / nD,
    semilla,
  };
}
