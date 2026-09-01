/**
 * Constantes del banco de imágenes. Sistema 1.
 *
 * Fuente de verdad: `design/registry/entities.yaml`. Si un valor cambia allí, cambia aquí, y
 * los canarios de test lo delatan.
 */

/**
 * Tablero máximo, reexportado del sistema 4 por claridad de dependencia.
 *
 * No se redeclara: `clusterMin` se DERIVA de él, y tener dos copias del techo del tablero es
 * exactamente el defecto que ADR-0006 encontró en `Cmin`.
 */
export { C_MAX } from '../dificultad/constantes.js';

/**
 * Repeticiones medias máximas por distractor, nivel visual, en el tablero máximo.
 *
 * **Perilla de proyecto SIN VALIDAR.** Subirla encoge el banco y empeora la habituación;
 * bajarla lo agranda. Es el intercambio coste-validez, y no está resuelto.
 */
export const R_MAX = 4;

/**
 * Mínimo de elementos activos por grupo visual. **DERIVADA, no elegida.**
 *
 * ```
 * clusterMin = ceil( (Cmax − 1) / Rmax ) + 1 = ceil(59 / 4) + 1 = 16
 * ```
 *
 * `Cmax − 1` es el número de distractores en el tablero máximo: **un objetivo por tablero**.
 * La versión anterior usaba `distractores(Cmax)`, una fórmula muerta que publicaba 90 en un
 * tablero de 100 cuando el código real hace 99 — ver ADR-0006.
 *
 * **Es la variable con más impacto económico de todo el proyecto**, porque multiplica por el
 * número de clusters para dar el coste total de contenido: 16 × 16 = 256 imágenes.
 */
export const CLUSTER_MIN = 16;

/**
 * Clusters visuales del banco.
 *
 * Es el coste real de producción: **las categorías semánticas son gratis, los clusters no.**
 * Añadir la categoría `cocina` cuesta cero imágenes nuevas; producir un cluster visual nuevo
 * cuesta `CLUSTER_MIN` imágenes.
 */
export const G = 16;

/** Coste total de contenido, en imágenes. `CLUSTER_MIN × G`. */
export const BANCO_TOTAL = CLUSTER_MIN * G;
