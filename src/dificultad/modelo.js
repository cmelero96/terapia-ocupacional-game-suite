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
 * @property {number} d
 *   **La dificultad PEDIDA del eje observado**, que es la clave de agrupación: `dm` o `dp`,
 *   nunca los dos.
 *
 *   Se agrupa por lo pedido y no por lo realizado, y eso lo obligó una medición. Con la
 *   configuración FIJA `t = 100, C = 9, sv = 0,25, ss = 0,25`, la `dp` realizada salía **19,2
 *   en unos tableros y 14,2 en otros**: la similitud semántica no siempre se puede servir con
 *   el banco que hay, y `ssEfectiva` caía a 0.
 *
 *   Agrupando por lo realizado, esa configuración se partía en **dos celdas**, así que ocho
 *   aciertos seguidos daban `datosInsuficientes` — cuatro y cuatro, y ninguna llegaba a
 *   `N_MIN`. Medido: hacían falta 24 tableros para lo que el criterio dice que son cinco
 *   intentos.
 *
 *   Y agrupar por lo pedido es además lo correcto conceptualmente: **una celda de progreso es
 *   una configuración del terapeuta.** Es lo que se compara entre sesiones.
 * @property {number} [dRealizada]
 *   La dificultad que el paciente afrontó de verdad. **Es la que se REPORTA**, porque la
 *   pedida sobrestima cuando el banco no da para lo configurado.
 *
 *   Si falta, se usa `d`.
 * @property {boolean} acierto
 */

/**
 * Una métrica: o tiene valor, o tiene motivo. **Nunca las dos, y nunca ninguna.**
 *
 * Cuando tiene valor, puede traer además la dispersión de lo realizado dentro de la celda: la
 * `pedida` con la que el terapeuta la configuró, y el mínimo y el máximo de lo que el banco
 * sirvió de verdad. Si el rango es ancho, la media no es un ajuste estable.
 *
 * @typedef {{ valor: number, pedida?: number, realizadaMin?: number, realizadaMax?: number } | { valor: undefined, motivo: import('./constantes.js').MotivoSinMetrica }} Metrica
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

  /** @type {Map<number, { intentos: number, aciertos: number, realizadas: number[] }>} */
  const porNivel = new Map();
  for (const o of observaciones) {
    const bucket = porNivel.get(o.d) ?? { intentos: 0, aciertos: 0, realizadas: [] };
    bucket.intentos += 1;
    if (o.acierto) bucket.aciertos += 1;
    bucket.realizadas.push(o.dRealizada ?? o.d);
    porNivel.set(o.d, bucket);
  }

  /** @type {{ pedida: number, realizadas: number[] }[]} */
  const niveles = [];
  for (const [d, { intentos, aciertos, realizadas }] of porNivel) {
    if (intentos >= minimo && aciertos / intentos >= precision) {
      niveles.push({ pedida: d, realizadas });
    }
  }

  // Conjunto vacio significa FALTA EL DATO, y falta de dato FALLA.
  if (niveles.length === 0) return { valor: undefined, motivo: 'datosInsuficientes' };

  // La celda mas dificil que TOLERO, elegida por lo PEDIDO —que es la escala en la que el
  // terapeuta se mueve— y reportada por lo REALIZADO, que es lo que el paciente afronto.
  //
  // Si se reportara lo pedido, el numero sobrestimaria cuando el banco no da para lo
  // configurado: exactamente el defecto que el campo `dp` efectiva existe para evitar.
  let mejor = /** @type {{ pedida: number, realizadas: number[] }} */ (niveles[0]);
  for (const n of niveles) if (n.pedida > mejor.pedida) mejor = n;

  const media = mejor.realizadas.reduce((a, b) => a + b, 0) / mejor.realizadas.length;
  const min = Math.min(...mejor.realizadas);
  const max = Math.max(...mejor.realizadas);

  return {
    valor: d1(media),
    pedida: d1(mejor.pedida),
    // La DISPERSION de lo realizado dentro de una sola configuracion. Si es ancha, el banco
    // no esta dando lo mismo en cada tablero, y el terapeuta necesita saberlo para no leer la
    // media como si fuera un ajuste estable.
    realizadaMin: d1(min),
    realizadaMax: d1(max),
  };
}
