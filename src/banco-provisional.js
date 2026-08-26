/**
 * Banco PROVISIONAL de emoji, para poder ejecutar antes de que existan los 96 SVG.
 *
 * **No es el banco.** El banco real es vectorial (biblia de arte), 16 clusters de 24, y su
 * esquema lo define el sistema 1. Esto son cuatro clusters de emoji para que el instrumento
 * se pueda ver y medir hoy.
 *
 * Los cuatro clusters son los que la biblia de arte propone para el primer hito, elegidos
 * por ser formas muy distintas entre si: recipientes, redondeados, escritura y vehiculos.
 *
 * **El color NO separa estos clusters.** La separacion es de forma, y sobrevive en escala
 * de grises — es la regla 9 del sistema 1.
 */

/**
 * @typedef {import('./tablero/generador.js').Elemento & { nombre: string, glifo: string }} EntradaProvisional
 */

/** @type {EntradaProvisional[]} */
const CRUDO = [
  // Cluster 1 — recipientes abiertos
  ['taza', '☕', 'recipientes', ['cocina', 'bebida']],
  ['vaso', '🥛', 'recipientes', ['cocina', 'bebida']],
  ['cubo', '🪣', 'recipientes', ['limpieza']],
  ['maceta', '🪴', 'recipientes', ['jardin']],
  ['cazo', '🍲', 'recipientes', ['cocina']],
  ['copa', '🍷', 'recipientes', ['bebida']],
  ['cesta', '🧺', 'recipientes', ['limpieza']],
  ['bol', '🥣', 'recipientes', ['cocina', 'alimento']],
  // Cluster 8 — frutas y verduras redondeadas
  ['manzana', '🍎', 'redondeados', ['alimento']],
  ['naranja', '🍊', 'redondeados', ['alimento']],
  ['tomate', '🍅', 'redondeados', ['alimento', 'cocina']],
  ['cebolla', '🧅', 'redondeados', ['alimento', 'cocina']],
  ['melocoton', '🍑', 'redondeados', ['alimento']],
  ['pera', '🍐', 'redondeados', ['alimento']],
  ['patata', '🥔', 'redondeados', ['alimento', 'cocina']],
  ['coco', '🥥', 'redondeados', ['alimento']],
  // Cluster 13 — objetos de escritura
  ['lapiz', '✏️', 'escritura', ['oficina']],
  ['boligrafo', '🖊️', 'escritura', ['oficina']],
  ['rotulador', '🖍️', 'escritura', ['oficina']],
  ['pincel', '🖌️', 'escritura', ['oficina', 'jardin']],
  ['pluma', '🖋️', 'escritura', ['oficina']],
  ['regla', '📏', 'escritura', ['oficina']],
  ['tijeras', '✂️', 'escritura', ['oficina']],
  ['clip', '📎', 'escritura', ['oficina']],
  // Cluster 16 — vehiculos con ruedas
  ['coche', '🚗', 'vehiculos', ['calle']],
  ['autobus', '🚌', 'vehiculos', ['calle']],
  ['bicicleta', '🚲', 'vehiculos', ['calle']],
  ['camion', '🚚', 'vehiculos', ['calle']],
  ['taxi', '🚕', 'vehiculos', ['calle']],
  ['tractor', '🚜', 'vehiculos', ['jardin', 'calle']],
  ['moto', '🏍️', 'vehiculos', ['calle']],
  ['furgoneta', '🚐', 'vehiculos', ['calle']],
].map(([id, glifo, cluster, categories]) => ({
  id: /** @type {string} */ (id),
  glifo: /** @type {string} */ (glifo),
  cluster: /** @type {string} */ (cluster),
  categories: /** @type {string[]} */ (categories),
  nombre: /** @type {string} */ (id),
  status: /** @type {'activo'} */ ('activo'),
}));

export const BANCO_PROVISIONAL = Object.freeze(CRUDO);

/**
 * `resolve(id)` provisional. El real es del sistema 1, y **nunca lanza con un id
 * desconocido**: devuelve `{ conocido: false, id }` para no perder la trazabilidad de que
 * vio el paciente.
 *
 * @param {string} id
 * @returns {import('./instrumentos/busca.js').Estimulo}
 */
export function resolverProvisional(id) {
  const e = BANCO_PROVISIONAL.find((x) => x.id === id);
  if (e === undefined) return { id, nombre: `estimulo desconocido: ${id}`, glifo: '?' };
  return { id: e.id, nombre: e.nombre, glifo: e.glifo };
}
