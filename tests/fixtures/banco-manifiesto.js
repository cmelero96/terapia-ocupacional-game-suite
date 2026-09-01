/**
 * Manifiestos de prueba para el sistema 13.
 *
 * **Fixture de factoría, no literales sueltos**, como piden los estándares de test: un
 * manifiesto válido y funciones que le introducen UN defecto cada vez. Así cada test dice qué
 * defecto prueba en lugar de repetir 16 entradas.
 */

import { CLUSTER_MIN } from '../../src/banco/constantes.js';

/**
 * Un manifiesto VÁLIDO: dos clusters completos.
 *
 * Que sea válido es la mitad del valor del fixture. Sin un caso base que pase, un test que
 * falla no distingue «encontré el defecto» de «el fixture está mal».
 *
 * @param {number} [clusters]
 * @returns {import('../../src/banco/esquema.js').ImageAsset[]}
 */
export function bancoValido(clusters = 2) {
  const NOMBRES = ['recipientes', 'redondeados', 'escritura', 'vehiculos'];
  const CATS = ['cocina', 'oficina', 'transporte', 'aseo'];
  /** @type {import('../../src/banco/esquema.js').ImageAsset[]} */
  const out = [];
  for (let c = 0; c < clusters; c++) {
    const cluster = /** @type {string} */ (NOMBRES[c % NOMBRES.length]);
    for (let i = 0; i < CLUSTER_MIN; i++) {
      out.push({
        id: `${cluster}-${String(i).padStart(2, '0')}`,
        file: `${cluster}/${String(i).padStart(2, '0')}.svg`,
        // La segunda categoria NUNCA coincide con la primera. El primer intento usaba
        // `(c + i + 1) % 4`, que colisiona cuando `i` es 3, 7, 11 o 15 — y el validador lo
        // cazó como categoria repetida. El fixture estaba mal, no el validador.
        categories: [
          /** @type {string} */ (CATS[c % CATS.length]),
          /** @type {string} */ (CATS[(c + 1 + (i % (CATS.length - 1))) % CATS.length]),
        ],
        cluster,
        name: `${cluster} ${i}`,
        status: 'active',
      });
    }
  }
  return out;
}

/**
 * Un `existeArchivo` que dice sí a todo. El caso base.
 *
 * @returns {(file: string) => boolean}
 */
export const todoExiste = () => () => true;

/**
 * Un `existeArchivo` que dice no a los archivos nombrados.
 *
 * @param {readonly string[]} ausentes
 * @returns {(file: string) => boolean}
 */
export const faltan = (ausentes) => (file) => !ausentes.includes(file);
