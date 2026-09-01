/**
 * Traducción del manifiesto al banco que consume la generación de tableros.
 *
 * ## Por qué existe este archivo: dos vocabularios para lo mismo
 *
 * **Apareció al conectar el banco real, y no lo había visto ninguna revisión.**
 *
 * | Sistema | Campo | Valores |
 * |---|---|---|
 * | 1 · manifiesto (`ImageAsset`) | `status` | `'active'` / `'retired'` |
 * | 8 · generación de tableros (`Elemento`) | `status` | `'activo'` / `'retirado'` |
 *
 * El mismo concepto, dos idiomas. El resultado medido: al pasar el manifiesto real al
 * generador, **el filtro de elegibilidad descartó los 64 elementos** y la página arrancó con
 * cero celdas. Ningún tipo lo detuvo, porque `status` es una cadena en los dos sitios.
 *
 * ## Por qué no se unifica ahora mismo
 *
 * `'active'` / `'retired'` es **normativo**: está en el esquema del sistema 1, en ADR-0001, en
 * `entities.yaml` y en la pareja `status` / `retiredAt`. Cambiarlo cambia el formato de un
 * archivo de datos que ya existe.
 *
 * `'activo'` / `'retirado'` es **interno** del generador y no se persiste en ningún sitio.
 *
 * Así que lo correcto a largo plazo es unificar hacia el inglés en el generador, y eso es un
 * cambio del sistema 8. Mientras no se haga, **la traducción vive en UN sitio y sólo en uno**:
 * aquí. Dos traducciones separadas divergirían, y ese es el defecto que este módulo existe
 * para no repetir.
 */

/**
 * @param {import('./esquema.js').ImageAsset} asset
 * @returns {import('../plataforma/raiz.js').EntradaBanco}
 */
export function aEntradaBanco(asset) {
  return {
    id: asset.id,
    cluster: asset.cluster,
    categories: [...asset.categories],
    // La traducción. Ver la cabecera de este archivo.
    status: asset.status === 'active' ? 'activo' : 'retirado',
    nombre: asset.name,
    // **Sin glifo, a propósito.** El dibujo ES el archivo. Poner un emoji de repuesto aquí
    // escondería que falta el archivo, y eso es justo lo que no se quiere: un banco a medias
    // que parece completo produce tableros a medias.
    glifo: '',
    archivo: asset.file,
  };
}

/**
 * El manifiesto entero, sólo lo activo, listo para el generador.
 *
 * @param {readonly import('./esquema.js').ImageAsset[]} manifiesto
 * @returns {import('../plataforma/raiz.js').EntradaBanco[]}
 */
export function bancoDesdeManifiesto(manifiesto) {
  return manifiesto.filter((a) => a.status === 'active').map(aEntradaBanco);
}
