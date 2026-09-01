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

/**
 * Tablero máximo. **Bajado de 100 a 60 el 2026-09-01 — ADR-0006.**
 *
 * Los 100 nunca se validaron con nadie: era un número redondo. Y arrastraban el activo más
 * caro del proyecto, porque el mínimo de imágenes por grupo visual se deriva de aquí:
 *
 * ```
 * Cmax = 100  ->  clusterMin = 26  ->  banco = 416 imágenes
 * Cmax =  60  ->  clusterMin = 16  ->  banco = 256 imágenes
 * ```
 *
 * **Bajar el techo no recorta una función: elimina 160 imágenes que nadie ha demostrado que
 * hagan falta.** Un tablero de 100 objetos a 24 px es, además, la esquina donde el pilar 3
 * ya está roto: los dos ejes dejan de ser independientes por debajo de 44 px.
 *
 * CUIDADO al cambiarlo: `nC` se normaliza contra este valor, así que mover `C_MAX` cambia
 * la dificultad calculada de TODOS los tableros, incluidos los ya registrados. Hoy sale
 * gratis porque no hay ninguna sesión real. Después de la primera, no.
 */
export const C_MAX = 60;

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
 * El cuarto motivo, `instrumentosMezclados`, se añadió el 2026-09-01 al hacer que una sesión
 * abarque varios instrumentos. Y es el mismo tipo de defecto que los otros tres: una
 * precisión calculada sobre dos ejercicios distintos es un número que no le pasó a nadie.
 *
 * @typedef {'datosInsuficientes' | 'ejesAcoplados' | 'ejesMezclados' | 'instrumentosMezclados'} MotivoSinMetrica
 */

export {};
