/**
 * Esquema del banco de imágenes. Sistema 1 · ADR-0001.
 *
 * **Solo typedefs. Ningún código ejecutable**, para que cualquier módulo pueda importarlo
 * sin arrastrar dependencias — lo fija ADR-0001.
 *
 * El typedef da **forma, no invariantes**. Estas cuatro son responsabilidad exclusiva del
 * validador del sistema 13, porque JSDoc no las puede expresar:
 *
 * 1. `id` único en todo el manifiesto
 * 2. `retiredAt` presente si y solo si `status: 'retired'`
 * 3. El archivo de `file` existe en disco
 * 4. Cada cluster tiene al menos `clusterMin` elementos activos
 */

/**
 * @typedef {'active' | 'retired'} EstadoAsset
 */

/**
 * Una entrada del banco.
 *
 * @typedef {object} ImageAsset
 * @property {string} id
 *   Clave estable en kebab-case. **Nunca cambia.** Es la clave con la que queda registrado
 *   qué estímulo vio el paciente, y toda la medición asume que ese estímulo no cambia entre
 *   sesiones. Retirar un id y crear otro es la única vía: no existe «reemplazar manteniendo
 *   id»
 * @property {string} file Ruta relativa dentro de `assets/art/banco/`
 * @property {string[]} categories
 *   Grupos **semánticos**, varios por asset. Una manzana es `['frutas','cocina','alimentos']`
 * @property {string} cluster
 *   Grupo **visual**, global y único por asset. **Sin términos de color en el nombre**: la
 *   separación entre clusters debe sobrevivir en escala de grises
 * @property {string} name Etiqueta en español. La consumen denominación y la vista del terapeuta
 * @property {EstadoAsset} status
 * @property {string} [retiredAt]
 *   Fecha ISO. Obligatoria **si y solo si** `status: 'retired'`. Sin la fecha, el terapeuta
 *   no puede distinguir «el paciente empeoró» de «alguien retiró una imagen»
 * @property {Record<string, unknown>} [attrs]
 *   Atributos por instrumento. `price` para precio justo. Es el **punto de extensión** del
 *   esquema: un instrumento futuro entra por aquí y el esquema no cambia. Un asset sin el
 *   atributo que un instrumento pide queda fuera de **ese** pool, sin ser un error
 */

/**
 * Un problema encontrado por el validador.
 *
 * **`id` y `campo` van separados a propósito.** Un mensaje que dice «falta un campo» sin
 * decir cuál, en un manifiesto de 256 entradas curadas a mano, no es accionable.
 *
 * @typedef {object} Problema
 * @property {string} codigo Estable, para que un test lo pueda buscar sin depender del texto
 * @property {string} mensaje En español, accionable
 * @property {string} [id] El asset afectado, si el problema es de uno
 * @property {string} [campo] El campo afectado, si el problema es de uno
 * @property {string} [cluster] El cluster afectado, si el problema es de uno
 */

/**
 * @typedef {object} Informe
 * @property {Problema[]} errores **Bloquean.** Con uno solo, el validador no aprueba nada
 * @property {Problema[]} advertencias No bloquean, y se imprimen igual
 * @property {number} activos
 * @property {number} retirados
 * @property {Map<string, number>} porCluster Elementos **activos** por cluster
 */

export {};
