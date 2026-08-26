/**
 * Constantes del modelo de dificultad. Sistema 4.
 *
 * Fuente de verdad: `design/registry/entities.yaml`. Si un valor cambia allí, cambia
 * aquí, y los canarios de test lo delatan.
 *
 * Sistema 4 · design/gdd/modelo-dificultad.md
 */

// --- Límites duros. No son preferencias. -------------------------------------

/** Mínimo absoluto de WCAG 2.2 criterio 2.5.8. */
export const T_MIN = 24;

/**
 * Mínimo AAA de WCAG 2.5.8. No es un límite: es la frontera donde los dos ejes
 * dejan de ser independientes. Ver la regla 5 del GDD.
 */
export const T_AAA = 44;

/** Techo de disposición: por encima, el tablero no cabe a C_MAX elementos. */
export const T_MAX = 140;

/** Con menos de 3 elementos no hay búsqueda. */
export const C_MIN = 3;

/** Registro de constantes, compartida con el sistema 1. */
export const C_MAX = 100;

// --- Perillas de proyecto. NINGUNA tiene validación empírica. ----------------

/** Peso de la cantidad en F2. SIN VALIDAR. */
export const W_C = 0.4;

/** Peso de la similitud visual en F2. SIN VALIDAR. */
export const W_V = 0.4;

/** Peso de la similitud semántica en F2. SIN VALIDAR. */
export const W_S = 0.2;

/** Precisión que se mantiene constante para medir el progreso. SIN VALIDAR. */
export const PRECISION_OBJETIVO = 0.8;

/** Intentos mínimos para que un nivel de dificultad cuente en F3. SIN VALIDAR. */
export const N_MIN = 5;

// --- Motivos por los que una métrica no se puede calcular --------------------

/**
 * Los tres motivos son distinguibles a propósito: uno se arregla con más sesiones,
 * otro con otra configuración, y el tercero no usando los dos ejes a la vez.
 *
 * @typedef {'datosInsuficientes' | 'ejesAcoplados' | 'ejesMezclados'} MotivoSinMetrica
 */

export {};
