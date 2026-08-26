/**
 * Modelo de dificultad: dos ejes, cuatro perillas. Modulo PURO — sin reloj, sin
 * aleatoriedad, sin estado.
 *
 * La dificultad es un VECTOR, nunca un escalar configurable. `dm` y `dp` son salidas
 * derivadas que existen para registrar y comparar; no hay ninguna via para fijarlas.
 *
 * Sistema 4 · design/gdd/modelo-dificultad.md
 */

import {
  T_MIN, T_AAA, T_MAX, C_MIN, C_MAX,
  W_C, W_V, W_S, PRECISION_OBJETIVO, N_MIN,
} from './constantes.js';

/**
 * @typedef {object} Configuracion
 * @property {number} t  Tamaño de objetivo en px, [T_MIN, T_MAX]
 * @property {number} C  Elementos en el tablero, [C_MIN, C_MAX]
 * @property {number} sv Fraccion de distractores del mismo cluster visual, [0, 1]
 * @property {number} ss Fraccion de distractores de la misma categoria semantica, [0, 1]
 */

/**
 * @typedef {object} Rango
 * @property {number} min
 * @property {number} max
 */

/**
 * @typedef {object} Observacion
 * @property {number} d       Dificultad del eje observado: `dm` O `dp`, nunca los dos
 * @property {boolean} acierto
 */

/**
 * @typedef {{ valor: number } | { valor: undefined, motivo: import('./constantes.js').MotivoSinMetrica }} Metrica
 */

/** Redondeo a un decimal, la convencion publicada del sistema. @param {number} x */
const d1 = (x) => Math.round(x * 10) / 10;

// ---------------------------------------------------------------- validacion

/**
 * Valida una perilla contra su limite duro. **Rechaza, nunca recorta.**
 *
 * Recortar convertiria un error de configuracion en un ejercicio distinto del que el
 * terapeuta cree haber puesto, y el terapeuta no se enteraria.
 *
 * @param {string} nombre
 * @param {number} valor
 * @param {number} min
 * @param {number} max
 * @param {boolean} entero
 * @returns {number}
 */
function validarPerilla(nombre, valor, min, max, entero) {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    throw new RangeError(`${nombre}: se esperaba un numero finito, se recibio ${String(valor)}`);
  }
  if (entero && !Number.isInteger(valor)) {
    throw new RangeError(`${nombre}: se esperaba un entero, se recibio ${String(valor)}`);
  }
  if (valor < min || valor > max) {
    throw new RangeError(
      `${nombre}: ${String(valor)} esta fuera del limite duro [${min}, ${max}]`,
    );
  }
  return valor;
}

/**
 * Valida una configuracion completa.
 *
 * @param {Configuracion} config
 * @returns {Configuracion} La misma configuracion, si es valida
 * @throws {RangeError}
 */
export function validarConfiguracion(config) {
  validarPerilla('t', config.t, T_MIN, T_MAX, true);
  validarPerilla('C', config.C, C_MIN, C_MAX, true);
  validarPerilla('sv', config.sv, 0, 1, false);
  validarPerilla('ss', config.ss, 0, 1, false);
  return config;
}

/**
 * Valida un rango. **Un rango invertido se rechaza, no se intercambia**: suele ser un
 * error de interfaz, y corregirlo por dentro esconde el fallo.
 *
 * @param {string} nombre
 * @param {Rango} rango
 * @param {number} min Limite duro inferior
 * @param {number} max Limite duro superior
 * @param {boolean} entero
 * @returns {Rango}
 * @throws {RangeError}
 */
export function validarRango(nombre, rango, min, max, entero) {
  validarPerilla(`${nombre}.min`, rango.min, min, max, entero);
  validarPerilla(`${nombre}.max`, rango.max, min, max, entero);
  if (rango.min > rango.max) {
    throw new RangeError(
      `${nombre}: rango invertido, min=${rango.min} > max=${rango.max}. No se intercambian`,
    );
  }
  return rango;
}

/**
 * F4 — del rango al valor.
 *
 * La politica `fija` devuelve `min` y **no el punto medio**: el punto medio seria un
 * valor que el terapeuta no ha escrito en ningun sitio y tendria que deducir.
 *
 * @param {Rango} rango
 * @param {'fija' | 'adaptativa'} politica
 * @returns {number}
 */
export function resolver(rango, politica) {
  if (politica === 'fija') return rango.min;
  throw new Error(
    `resolver: la politica '${politica}' es del sistema 17 y no existe en el Nivel 0`,
  );
}

// ---------------------------------------------------------------- F1 y F2

/**
 * F1 — dificultad del eje motor.
 *
 * Logaritmica y no lineal por la forma de la ley de Fitts: el tiempo de un movimiento
 * apuntado escala con el logaritmo del inverso del tamaño del objetivo. Una escala
 * lineal en pixeles haria que bajar de 140 a 130 pareciera el mismo salto que bajar de
 * 34 a 24, y no lo es ni de lejos.
 *
 * No se usa la ley de Fitts completa porque la distancia al objetivo no es una perilla
 * de este sistema: depende de la disposicion, que es del sistema 2.
 *
 * @param {number} t Tamaño de objetivo en px
 * @returns {number} [0, 100], a un decimal. 0 = mas facil, 100 = mas dificil
 */
export function dm(t) {
  validarPerilla('t', t, T_MIN, T_MAX, true);
  return d1((100 * Math.log(T_MAX / t)) / Math.log(T_MAX / T_MIN));
}

/**
 * F2 — dificultad del eje perceptivo-cognitivo.
 *
 * Colapsa tres perillas en un escalar, y eso es licito **aqui y no en la
 * configuracion**: `dp` existe para registrar y comparar. La configuracion conserva
 * las tres perillas separadas y el terapeuta las mueve por separado. Colapsarlas al
 * configurar romperia el pilar 3.
 *
 * `sv + ss` puede pasar de 1, y no se normaliza: significa que el terapeuta quiere
 * distractores parecidos por las dos vias. El solapamiento lo resuelve el sistema 8.
 *
 * @param {number} C
 * @param {number} sv
 * @param {number} ss
 * @returns {number} [0, 100], a un decimal
 */
export function dp(C, sv, ss) {
  validarPerilla('C', C, C_MIN, C_MAX, true);
  validarPerilla('sv', sv, 0, 1, false);
  validarPerilla('ss', ss, 0, 1, false);
  const nC = (C - C_MIN) / (C_MAX - C_MIN);
  return d1(100 * (W_C * nC + W_V * sv + W_S * ss));
}

/**
 * ¿Estan los dos ejes acoplados en esta configuracion?
 *
 * Por debajo de T_AAA un paciente con control psicomotor reducido falla tocando **al
 * lado** del objetivo correcto, y ese fallo entra en el registro como si no hubiera
 * **encontrado** el objetivo. El ruido motor se registra como fallo de busqueda.
 *
 * La configuracion sigue siendo valida — hay casos en que entrenar precision fina es
 * el objetivo, y el terapeuta manda — pero la medicion del eje perceptivo queda
 * contaminada, y eso se declara en lugar de prohibirse.
 *
 * @param {number} t
 * @returns {boolean}
 */
export function ejesAcoplados(t) {
  validarPerilla('t', t, T_MIN, T_MAX, true);
  return t < T_AAA;
}

// ---------------------------------------------------------------- F3

/**
 * F3 — dificultad tolerada a precision constante. **El eje de progreso del producto.**
 *
 * Un paciente que acierta el 95% de los objetivos no esta progresando: esta en un
 * ejercicio demasiado facil. El progreso es cuanta dificultad tolera manteniendo la
 * misma precision.
 *
 * **LA GUARDA.** Si ningun nivel reune `nMin` intentos con precision suficiente, el
 * resultado es `undefined`, NUNCA 0. `Math.max()` sobre un conjunto vacio devuelve
 * `-Infinity`, y un 0 seria peor todavia: se leeria como "el paciente no tolera
 * ninguna dificultad", que es un dato clinico plausible y devastador, cuando lo que
 * ocurre es que faltan datos.
 *
 * Opera sobre UN eje. Si dentro de una sesion se movieron los dos, ninguna metrica es
 * interpretable: no se sabe a que eje atribuir el cambio de precision.
 *
 * @param {Observacion[]} observaciones
 * @param {object} [opciones]
 * @param {number} [opciones.precisionObjetivo]
 * @param {number} [opciones.nMin]
 * @param {boolean} [opciones.acoplados] Si true, devuelve `ejesAcoplados` sin calcular
 * @param {boolean} [opciones.mezclados] Si true, devuelve `ejesMezclados`
 * @returns {Metrica}
 */
export function dificultadTolerada(observaciones, opciones = {}) {
  const precision = opciones.precisionObjetivo ?? PRECISION_OBJETIVO;
  const minimo = opciones.nMin ?? N_MIN;

  if (opciones.mezclados === true) return { valor: undefined, motivo: 'ejesMezclados' };
  if (opciones.acoplados === true) return { valor: undefined, motivo: 'ejesAcoplados' };

  /** @type {Map<number, { intentos: number, aciertos: number }>} */
  const porNivel = new Map();
  for (const o of observaciones) {
    const bucket = porNivel.get(o.d) ?? { intentos: 0, aciertos: 0 };
    bucket.intentos += 1;
    if (o.acierto) bucket.aciertos += 1;
    porNivel.set(o.d, bucket);
  }

  /** @type {number[]} */
  const niveles = [];
  for (const [d, { intentos, aciertos }] of porNivel) {
    if (intentos >= minimo && aciertos / intentos >= precision) niveles.push(d);
  }

  // Conjunto vacio significa FALTA EL DATO, y falta de dato FALLA.
  if (niveles.length === 0) return { valor: undefined, motivo: 'datosInsuficientes' };

  return { valor: d1(Math.max(...niveles)) };
}
