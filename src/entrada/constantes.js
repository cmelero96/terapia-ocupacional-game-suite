/**
 * Constantes de la capa de adaptacion de entrada. Sistema 5.
 *
 * Fuente de verdad: `design/registry/entities.yaml`.
 *
 * Sistema 5 · design/gdd/capa-adaptacion-entrada.md
 */

/** Suelo de la cadencia de barrido. Por debajo nadie llega a reaccionar. SIN VALIDAR. */
export const MS_PASO_MIN = 400;

/** Techo de la cadencia de barrido. Por encima la espera es cruel. SIN VALIDAR. */
export const MS_PASO_MAX = 4000;

/** Suelo absoluto de la zona de tolerancia, en px CSS. SIN VALIDAR. */
export const PX_TOLERANCIA_MIN = 8;

/**
 * Fraccion del tamaño de objetivo que define la zona de tolerancia. SIN VALIDAR.
 *
 * Escala con el tamaño a proposito: un objetivo de 140 px con 8 px de tolerancia seria
 * igual de intolerante que uno de 24, cuando el terapeuta ha subido el tamaño
 * precisamente porque el paciente no apunta fino.
 */
export const RATIO_TOLERANCIA = 0.25;

/** Tiempo de una vuelta completa del barrido. Perilla CLINICA. */
export const MS_VUELTA_POR_DEFECTO = 12000;

/** Tiempo sobre el objetivo para que la permanencia active. Perilla CLINICA. */
export const MS_PERMANENCIA_POR_DEFECTO = 800;

/**
 * Los cinco modos de acceso. `modo` viaja SOLO para el registro: un instrumento que lo
 * lea para ramificar comportamiento esta roto, y el sistema 14 lo vigila.
 *
 * @typedef {'tactil' | 'raton' | 'teclado' | 'pulsador' | 'permanencia'} Modo
 */

/**
 * De donde salio la marca de tiempo de una activacion.
 *
 * Nunca se mezclan dos origenes en un mismo calculo de latencia.
 *
 * @typedef {'evento' | 'reloj'} OrigenTiempo
 */

export {};
