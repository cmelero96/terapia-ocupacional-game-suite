/**
 * Banco de prueba compartido. Suficientemente GRANDE a propósito.
 *
 * Dos veces en este proyecto un test pidió una configuración imposible —`C = 12` contra un
 * banco de 7, y `C = 40` contra uno de 32— y el fallo pareció un defecto del código cuando
 * era del fixture. Cuatro clusters de ocho dan 32 elementos, que cubre cualquier `C`
 * realizable del panel.
 */

const CLUSTERS = ['recipientes', 'redondeados', 'escritura', 'vehiculos'];
const CATEGORIAS = ['cocina', 'oficina', 'transporte', 'aseo'];

/** @returns {import('../../src/plataforma/raiz.js').EntradaBanco[]} */
function construir() {
  /** @type {import('../../src/plataforma/raiz.js').EntradaBanco[]} */
  const b = [];
  CLUSTERS.forEach((cluster, ci) => {
    for (let i = 0; i < 8; i++) {
      b.push({
        id: `${cluster}-${i}`,
        cluster,
        categories: [
          /** @type {string} */ (CATEGORIAS[ci]),
          /** @type {string} */ (CATEGORIAS[(ci + i + 1) % CATEGORIAS.length]),
        ],
        status: 'activo',
        nombre: `${cluster} ${i}`,
        glifo: '#',
      });
    }
  });
  return b;
}

/** @type {readonly import('../../src/plataforma/raiz.js').EntradaBanco[]} */
export const BANCO_PRUEBA = Object.freeze(construir());
