/**
 * Continuidad de identificadores entre versiones del manifiesto. Sistema 13 · AC-2.
 *
 * ## Qué defecto impide
 *
 * Un `id` que **desaparece** del manifiesto sin quedar `retired` deja huérfanos todos los
 * datos ya registrados que lo referencian. La pantalla de resultados no se rompe —tolera un
 * id desconocido a propósito— pero el terapeuta pierde el estímulo: sabe que el paciente
 * falló algo, y no qué.
 *
 * Retirar un id **conserva la fila**. Borrarla es lo que está prohibido.
 *
 * ## Contra qué versión se compara, que el GDD dejaba sin decidir
 *
 * El GDD del sistema 1 decía: *«Falta decidir contra qué versión se compara: último tag o
 * último commit en main.»*
 *
 * **Decidido: contra `origin/main`.** El proyecto es de desarrollo troncal y **no tiene
 * tags**, así que «último tag» no existe hoy y elegirlo sería aplazar la comprobación con
 * apariencia de haberla resuelto.
 *
 * Consecuencia asumida: la comprobación es contra la rama publicada, no contra una versión
 * liberada. El día que haya tags, el criterio cambia y esta decisión se revisa — pero
 * entonces habrá algo real contra lo que comparar.
 *
 * ## Función PURA
 *
 * No invoca git. Recibe los dos manifiestos ya cargados, igual que el validador recibe
 * `existeArchivo`. Quien hable con git es el CLI.
 */

/**
 * @typedef {object} Continuidad
 * @property {string[]} borrados
 *   **ERROR.** Estaban y ya no están, sin haber quedado retirados
 * @property {string[]} retirados Estaban activos y ahora están retirados. Legítimo
 * @property {string[]} reactivados
 *   Estaban retirados y ahora activos. Legítimo —el estado es bidireccional— y **se avisa**:
 *   un asset que vuelve cambia `clusterSize` y con él tres fórmulas
 * @property {string[]} nuevos Altas. Legítimo
 * @property {{ id: string, campo: string, antes: string, ahora: string }[]} mutados
 *   **ERROR.** Un `file` o un `cluster` que cambia bajo un id que se queda
 */

/**
 * @param {readonly import('../../src/banco/esquema.js').ImageAsset[]} antes
 * @param {readonly import('../../src/banco/esquema.js').ImageAsset[]} ahora
 * @returns {Continuidad}
 */
export function continuidad(antes, ahora) {
  const mapaAntes = new Map(antes.map((a) => [a.id, a]));
  const mapaAhora = new Map(ahora.map((a) => [a.id, a]));

  /** @type {Continuidad} */
  const out = { borrados: [], retirados: [], reactivados: [], nuevos: [], mutados: [] };

  for (const [id, a] of mapaAntes) {
    const b = mapaAhora.get(id);
    if (b === undefined) {
      out.borrados.push(id);
      continue;
    }
    if (a.status === 'active' && b.status === 'retired') out.retirados.push(id);
    if (a.status === 'retired' && b.status === 'active') out.reactivados.push(id);

    // Un `file` o un `cluster` que cambia bajo el mismo id es la misma clase de defecto que
    // sustituir el archivo: el id promete un estimulo estable, y aqui el estimulo cambia o
    // cambia el grupo visual que define su dificultad.
    for (const campo of /** @type {const} */ (['file', 'cluster'])) {
      if (a[campo] !== b[campo]) {
        out.mutados.push({ id, campo, antes: a[campo], ahora: b[campo] });
      }
    }
  }

  for (const id of mapaAhora.keys()) {
    if (!mapaAntes.has(id)) out.nuevos.push(id);
  }

  for (const k of /** @type {const} */ (['borrados', 'retirados', 'reactivados', 'nuevos'])) {
    out[k].sort();
  }
  return out;
}

/**
 * ¿Rompe el build?
 *
 * **Sólo `borrados` y `mutados`.** Las altas, las retiradas y las reactivaciones son
 * operaciones legítimas del banco; convertirlas en error obligaría a una bandera para
 * saltarse la comprobación, y una bandera así acaba siempre puesta.
 *
 * @param {Continuidad} c
 * @returns {boolean}
 */
export function rompe(c) {
  return c.borrados.length > 0 || c.mutados.length > 0;
}

/**
 * El informe legible.
 *
 * @param {Continuidad} c
 * @returns {string[]}
 */
export function informe(c) {
  /** @type {string[]} */
  const L = [];
  for (const id of c.borrados) {
    L.push(`ERROR  '${id}': desaparecio del manifiesto sin quedar retirado. Los datos ya `
      + 'registrados que lo referencian se quedan sin estimulo. Retiralo en lugar de '
      + 'borrarlo.');
  }
  for (const m of c.mutados) {
    L.push(`ERROR  '${m.id}': '${m.campo}' cambio de '${m.antes}' a '${m.ahora}' bajo el `
      + 'mismo id. Un id promete un estimulo estable: retira el id y crea otro.');
  }
  for (const id of c.reactivados) {
    L.push(`AVISO  '${id}': vuelve a estar activo. Eso cambia el tamano de su cluster, y `
      + 'con el tres formulas de dificultad.');
  }
  if (c.retirados.length > 0) L.push(`  retirados: ${c.retirados.length}`);
  if (c.nuevos.length > 0) L.push(`  nuevos:    ${c.nuevos.length}`);
  return L;
}
