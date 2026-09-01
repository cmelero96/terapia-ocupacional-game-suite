/**
 * Manifiesto del banco de imagenes. Sistema 1 - ADR-0001.
 *
 * **GENERADO por tools/banco/importar.js. No se edita a mano.**
 *
 * Modulo JS con literales, no JSON: sin paso de build, `tsc --checkJs` solo comprueba de
 * verdad literales de codigo, y aqui hay registros curados a mano que necesitan esa
 * comprobacion entrada por entrada.
 *
 * Un `id` NUNCA se renombra ni se reutiliza. Para cambiar una imagen: retirar el id y crear
 * otro.
 *
 * ---
 *
 * **VACIO A PROPOSITO, y esto no es un hueco por rellenar.**
 *
 * El banco real son 256 imagenes vectoriales, 16 clusters de 16, y ADR-0006 acaba de
 * desbloquear su produccion. Todavia no existe ni una.
 *
 * Un manifiesto vacio es **valido por forma y no sirve para jugar**, y el validador lo dice
 * con esas palabras. Lo que se juega hoy sale de `src/banco-provisional.js`, cuatro clusters
 * de emoji que existen para poder medir antes de que haya arte.
 *
 * Este archivo existe vacio porque las herramientas del sistema 13 necesitan algo contra lo
 * que ejecutarse, y porque asi la primera imagen que llegue entra por el importador en lugar
 * de crear el manifiesto de cero a mano.
 */

/** @type {import('./esquema.js').ImageAsset[]} */
const BANCO = [
];

export default BANCO;
