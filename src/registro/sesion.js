/**
 * Registro de rendimiento. Modulo PURO: los relojes llegan inyectados.
 *
 * **El registro lo sabe todo; la pantalla del paciente no sabe nada.** Este modulo no
 * tiene ninguna via hacia la vista del paciente, y esa ausencia es su caracteristica
 * principal, no un detalle de organizacion.
 *
 * Sistema 9 · design/gdd/registro-rendimiento.md
 */

import { dm, dp } from '../dificultad/modelo.js';

/** Sin persistencia, el registro crece con la jornada. 20 es mucho mas de lo que una
 * consulta produce en un dia. */
export const MAX_SESIONES_EN_MEMORIA = 20;

/**
 * @typedef {'origenesMezclados' | 'relojRetrocedio'} MotivoSinLatencia
 */

/**
 * @typedef {{ ms: number, resolucionInsuficiente?: true } | { ms: undefined, motivo: MotivoSinLatencia }} Latencia
 */

/**
 * @typedef {object} Intento
 * @property {string} idActivado
 * @property {boolean} correcto
 * @property {Latencia} latencia
 */

/**
 * @typedef {object} TableroRegistrado
 * @property {string} objetivo
 * @property {string[]} distractores
 * @property {number | undefined} semilla
 * @property {string | undefined} schemaVersion
 * @property {number} dm
 * @property {number} dp
 * @property {number} dpPedida
 * @property {Intento[]} intentos
 */

/**
 * @typedef {object} Sesion
 * @property {number} orden Contador monotono de insercion. ES la clave de orden
 * @property {number} selloPared Informacion, NO indice
 * @property {number} resolucionMs
 * @property {boolean} fiableParaPresupuesto
 * @property {boolean} ejesAcoplados
 * @property {TableroRegistrado[]} tableros
 */

/**
 * F1 — latencia entre dos marcas de tiempo.
 *
 * Los tres casos degenerados son distinguibles a proposito, porque piden acciones
 * distintas: mezclar origenes es un defecto de codigo, un reloj que retrocede es un
 * defecto del entorno, y una resolucion insuficiente es una limitacion aceptable.
 *
 * @param {number} tInicio
 * @param {number} tFin
 * @param {import('../entrada/constantes.js').OrigenTiempo} origenInicio
 * @param {import('../entrada/constantes.js').OrigenTiempo} origenFin
 * @returns {Latencia}
 */
export function latencia(tInicio, tFin, origenInicio, origenFin) {
  // Aunque los dos numeros darian una diferencia plausible, no son comparables.
  if (origenInicio !== origenFin) return { ms: undefined, motivo: 'origenesMezclados' };
  // NUNCA 0 aqui: un 0 se leeria como un acierto instantaneo, que es un dato clinico
  // plausible y falso.
  if (tFin < tInicio) return { ms: undefined, motivo: 'relojRetrocedio' };
  // Y aqui SI 0, porque hubo un evento: fue mas rapido de lo que este reloj mide. Con la
  // resolucion de la sesion registrada, el dato es interpretable.
  if (tFin === tInicio) return { ms: 0, resolucionInsuficiente: true };
  return { ms: tFin - tInicio };
}

/**
 * F3 — la dificultad que se registra es la EFECTIVA.
 *
 * Guardar solo la pedida sobrestimaria la dificultad que el paciente afronto, y el error
 * va siempre en la misma direccion.
 *
 * @param {import('../tablero/generador.js').Tablero} tablero
 * @param {{ t: number, C: number }} config
 * @returns {{ dm: number, dp: number, dpPedida: number }}
 */
export function dificultadRegistrada(tablero, config) {
  return {
    dm: dm(config.t),
    dp: dp(config.C, tablero.svEfectiva, tablero.ssEfectiva),
    dpPedida: dp(config.C, tablero.svPedida, tablero.ssPedida),
  };
}

/**
 * @typedef {object} Resumen
 * @property {number} intentos
 * @property {number} aciertos
 * @property {number | undefined} precision
 * @property {number | undefined} latenciaMedia
 * @property {number} latenciasSinDato
 */

/**
 * F2 — resumen de una sesion, que es lo que el sistema 12 va a mostrar.
 *
 * `precision` con cero intentos es `undefined`, **no 0**: un 0 se leeria como "no acerto
 * ninguna", que es devastador, cuando lo que paso es que la sesion se cerro antes de
 * empezar.
 *
 * Y `latenciasSinDato` se publica **siempre**: sin ese numero, una media calculada sobre 3
 * de 40 latencias tendria el mismo aspecto que una calculada sobre 40.
 *
 * @param {Sesion} sesion
 * @returns {Resumen}
 */
export function resumenSesion(sesion) {
  /** @type {Intento[]} */
  const todos = [];
  for (const t of sesion.tableros) todos.push(...t.intentos);

  const intentos = todos.length;
  const aciertos = todos.filter((i) => i.correcto).length;

  /** @type {number[]} */
  const definidas = [];
  let sinDato = 0;
  for (const i of todos) {
    if (i.latencia.ms === undefined) sinDato += 1;
    else definidas.push(i.latencia.ms);
  }

  return {
    intentos,
    aciertos,
    precision: intentos === 0 ? undefined : aciertos / intentos,
    latenciaMedia:
      definidas.length === 0
        ? undefined
        : definidas.reduce((a, b) => a + b, 0) / definidas.length,
    latenciasSinDato: sinDato,
  };
}

/**
 * @typedef {'reproducible' | 'reproducibleAproximado' | 'noReproducible'} EstadoReproduccion
 */

/**
 * ¿Se puede reproducir este tablero?
 *
 * **Nunca lanza.** Un dato antiguo incompleto es aceptable; una pantalla que se rompe al
 * abrirlo no. Mismo principio que el id desconocido del sistema 1.
 *
 * @param {TableroRegistrado} tablero
 * @param {string} schemaVersionActual
 * @returns {EstadoReproduccion}
 */
export function estadoReproduccion(tablero, schemaVersionActual) {
  if (tablero.semilla === undefined) return 'noReproducible';
  if (tablero.schemaVersion !== schemaVersionActual) return 'reproducibleAproximado';
  return 'reproducible';
}

/**
 * El registro de una jornada. En memoria: sin persistencia, que es del sistema 18 y esta
 * fuera del primer hito.
 */
export class Registro {
  constructor() {
    /** @type {Sesion[]} */
    this.sesiones = [];
    /**
     * Contador monotono de insercion. **Es la clave de orden**, no el sello de pared.
     *
     * El sello puede desplazarse —una tableta que pasa semanas apagada corrige su reloj
     * de golpe— y si fuera la unica clave, un salto hacia atras mostraria las sesiones
     * desordenadas al terapeuta.
     *
     * @type {number}
     */
    this.siguienteOrden = 0;
  }

  /**
   * @param {object} entrada
   * @param {import('../plataforma/esquema.js').RelojPared} entrada.relojPared
   * @param {import('../plataforma/esquema.js').ResolucionReloj} entrada.resolucion
   * @param {boolean} entrada.ejesAcoplados
   * @returns {Sesion}
   */
  abrirSesion({ relojPared, resolucion, ejesAcoplados }) {
    /** @type {Sesion} */
    const sesion = {
      orden: this.siguienteOrden++,
      selloPared: relojPared.now(),
      resolucionMs: resolucion.resolucionMs,
      fiableParaPresupuesto: resolucion.fiableParaPresupuesto,
      ejesAcoplados,
      tableros: [],
    };
    this.sesiones.push(sesion);
    if (this.sesiones.length > MAX_SESIONES_EN_MEMORIA) this.sesiones.shift();
    return sesion;
  }

  /**
   * Las sesiones en orden de INSERCION. Inmune a un salto del reloj de pared.
   *
   * @returns {Sesion[]}
   */
  ordenadas() {
    return [...this.sesiones].sort((a, b) => a.orden - b.orden);
  }
}
