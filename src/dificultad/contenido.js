/**
 * Eje de contenido: la dificultad que no es motora ni perceptiva. Sistema 32.
 *
 * `design/gdd/eje-contenido.md`
 *
 * **El invariante que protege este módulo.** La variante de contenido es **ordinal, no de
 * intervalo**: tiene orden pero no distancia. Nadie sabe si el salto de sumar a restar es
 * «el mismo» que el de restar a multiplicar, y no hay forma de averiguarlo sin un estudio
 * que este proyecto no va a hacer.
 *
 * De ahí la regla que la barrera AC-3 vigila en CI:
 *
 * > **Sobre el ordinal no se hace aritmética.** No se promedia, no se interpola, no se
 * > convierte a porcentaje, y no entra en `dp` ni en `dm`. Solo se **agrupa** y se **ordena**.
 *
 * Un `dc = 2,4` no significa nada. Y un `0,4·dm + 0,4·dp + 0,2·dc` sería exactamente el
 * control escalar que la barrera AC-13 del sistema 4 prohíbe: colapsa en un número tres
 * cosas que el terapeuta necesita mover por separado.
 *
 * **El eje es LOCAL a cada instrumento.** La variante 2 del tres en raya y la variante 2 de rellenar
 * palabras no tienen ninguna relación. No es una escala del producto: es una lista ordenada
 * que cada instrumento declara.
 */

import { TIPOS_OPERACION, ETIQUETA_OPERACION } from '../contenido/provisional.js';

/**
 * @typedef {object} VarianteContenido
 * @property {string} id
 *   Clave con la que se guarda el dato. **Estable: no se renombra nunca.** Misma regla que
 *   un identificador del banco de imágenes, y por el mismo motivo: es la clave con la que
 *   está registrado a qué jugó un paciente
 * @property {string} etiqueta Lo que lee el terapeuta. Esto SÍ se puede cambiar
 * @property {number} ordinal
 *   Orden de dificultad, de 1 a n. **Solo para ordenar y agrupar.** Ver AC-3
 */

/**
 * Las variantes de cada instrumento.
 *
 * **Una lista vacía es el caso NORMAL, no un hueco por rellenar.** Hoy solo el tres en raya
 * tiene variantes. Busca, denominación y clasificar no los necesitan: su dificultad *es* los
 * dos ejes del sistema 4. Y los otros cinco instrumentos de contenido podrían tenerlos y
 * todavía no las tienen, porque **inventar variantes clínicas sin un terapeuta es peor que no
 * tenerlos**. Los candidatos están anotados en la regla R3 del GDD.
 *
 * @type {Readonly<Record<string, readonly VarianteContenido[]>>}
 */
export const VARIANTES = Object.freeze({
  busca: Object.freeze([]),
  denominar: Object.freeze([]),
  clasificar: Object.freeze([]),
  rellenar: Object.freeze([]),
  simbolos: Object.freeze([]),
  precios: Object.freeze([]),
  ordenar: Object.freeze([]),
  comprar: Object.freeze([]),
  // El único con variantes hoy. Provisionales: los elegí yo, y van a la hoja de revisión.
  tresEnRaya: Object.freeze(
    TIPOS_OPERACION.map((tipo, i) => Object.freeze({
      id: tipo,
      etiqueta: ETIQUETA_OPERACION[tipo],
      ordinal: i + 1,
    })),
  ),
});

/**
 * F1 — las variantes de un instrumento. Lista posiblemente vacía.
 *
 * **Un instrumento desconocido devuelve lista vacía en lugar de lanzar.** Es una lectura de
 * catálogo, no una validación: quien valide una variante usa `varianteValida`.
 *
 * @param {string} instrumento
 * @returns {readonly VarianteContenido[]}
 */
export function variantesDe(instrumento) {
  return VARIANTES[instrumento] ?? [];
}

/**
 * ¿Tiene este instrumento eje de contenido?
 *
 * @param {string} instrumento
 * @returns {boolean}
 */
export function tieneEje(instrumento) {
  return variantesDe(instrumento).length > 0;
}

/**
 * F2 — ¿es `id` una variante de este instrumento?
 *
 * @param {string} instrumento
 * @param {string} id
 * @returns {boolean}
 */
export function varianteValida(instrumento, id) {
  return variantesDe(instrumento).some((n) => n.id === id);
}

/**
 * La variante a usar, validada.
 *
 * **Un `id` desconocido LANZA.** No se sustituye por el primero: una variante plausible e
 * inventado es la forma de defecto que este proyecto persigue, y aquí el valor sustituido
 * decidiría a qué aritmética juega un paciente sin que nadie lo pidiera.
 *
 * `id` ausente sí tiene respuesta: **el ordinal 1, el más fácil.** No es lo mismo que un
 * dato inválido — es la ausencia de una elección, y si hay que equivocarse se equivoca hacia
 * el lado que no frustra al paciente.
 *
 * @param {string} instrumento
 * @param {string} [id]
 * @returns {VarianteContenido | null} `null` si el instrumento no tiene eje
 */
export function resolverVariante(instrumento, id) {
  const variantes = variantesDe(instrumento);
  if (variantes.length === 0) {
    if (id !== undefined) {
      throw new RangeError(
        `resolverVariante: '${instrumento}' no tiene eje de contenido, y se pidió '${id}'`,
      );
    }
    return null;
  }
  if (id === undefined) {
    // El más fácil. `variantes` está ordenado por construcción, pero no se asume: se busca.
    const primero = variantes.find((n) => n.ordinal === 1);
    if (primero === undefined) {
      throw new RangeError(`resolverVariante: '${instrumento}' no declara una variante de ordinal 1`);
    }
    return primero;
  }
  const variante = variantes.find((n) => n.id === id);
  if (variante === undefined) {
    const validos = variantes.map((n) => n.id).join(', ');
    throw new RangeError(`resolverVariante: '${id}' no es una variante de '${instrumento}' (${validos})`);
  }
  return variante;
}

/**
 * La etiqueta de una variante para MOSTRAR, tolerando un dato antiguo.
 *
 * **Nunca lanza**, al contrario que `resolverVariante`. Es la asimetría deliberada del caso
 * límite del GDD: un `id` desconocido que llega **por la URL** es una configuración
 * imposible y falla; uno que llega **en un dato ya registrado** es una variante retirada, y una
 * pantalla que se rompe al abrir una sesión vieja es peor que una etiqueta fea.
 *
 * Misma regla que un id desconocido del banco de imágenes.
 *
 * @param {string} instrumento
 * @param {string | null | undefined} id
 * @returns {string}
 */
export function etiquetaParaMostrar(instrumento, id) {
  if (id === null || id === undefined) return 'sin variante de contenido';
  const variante = variantesDe(instrumento).find((n) => n.id === id);
  return variante === undefined ? `variante retirada: ${id}` : variante.etiqueta;
}

/**
 * F3 — la clave de agrupación de una celda de progreso.
 *
 * `contenido.id` **se añade** a las dos claves que ya había. `null` es una clave legítima:
 * agrupa los tableros de instrumentos sin eje de contenido.
 *
 * Mezclar variantes haría que `dificultadTolerada` no signifique nada: la precisión de un
 * paciente sumando hasta 10 y multiplicando no es una sola precisión.
 *
 * **Coste real, y hay que decirlo:** particionar reduce los intentos por celda, así que hace
 * falta más sesión para que la métrica tenga dato. La respuesta cuando falta es
 * `datosInsuficientes`, no un número inventado. Antes falta de dato que dato falso.
 *
 * @param {{ dm: number, dp: number, contenido: { id: string } | null }} tablero
 * @returns {string}
 */
export function claveDeProgreso(tablero) {
  const c = tablero.contenido === null ? '-' : tablero.contenido.id;
  return `${tablero.dm.toFixed(1)}|${tablero.dp.toFixed(1)}|${c}`;
}

/**
 * F4 — parte los intentos de una sesión POR VARIANTE de contenido.
 *
 * **Por qué esta función existe en lugar de dejarlo al llamador.** El panel construía una
 * sola lista plana con los intentos de todos los tableros y la pasaba a
 * `dificultadTolerada`. Con dos variantes en la misma sesión, eso mezcla la precisión de un
 * paciente sumando hasta 10 con la de multiplicar, y el número resultante no significa nada.
 *
 * El llamador no puede equivocarse si no tiene que acordarse: aquí se parte, y quien quiera
 * la métrica pide una variante concreta.
 *
 * **Coste, y hay que decirlo:** particionar reduce los intentos por celda, así que hace falta
 * más sesión para llegar a `N_MIN`. La respuesta correcta cuando falta dato ya existe y es
 * `datosInsuficientes`. Antes falta de dato que dato falso.
 *
 * @param {{ tableros: readonly { dp: number, dpPedida: number, dm: number, contenido: { id: string } | null, intentos: readonly { correcto: boolean }[] }[] }} sesion
 * @param {'dp' | 'dm'} eje
 * @returns {Map<string | null, import('./modelo.js').Observacion[]>}
 *   Clave `null` para los tableros sin eje de contenido. **Es una clave legítima**, no un
 *   hueco: agrupa los seis instrumentos que no declaran variantes.
 */
export function observacionesPorVariante(sesion, eje) {
  /** @type {Map<string | null, import('./modelo.js').Observacion[]>} */
  const porVariante = new Map();
  for (const t of sesion.tableros) {
    const clave = t.contenido === null ? null : t.contenido.id;
    const lista = porVariante.get(clave) ?? [];

    // La clave de agrupación es lo PEDIDO y el valor reportado es lo REALIZADO.
    //
    // Medido: con la configuración fija `t = 100, C = 9, sv = 0,25, ss = 0,25`, la `dp`
    // realizada salía 19,2 en unos tableros y 14,2 en otros —la similitud semántica no
    // siempre se puede servir con el banco que hay—. Agrupando por lo realizado, ocho
    // aciertos seguidos daban `datosInsuficientes`: cuatro y cuatro, y ninguna celda llegaba
    // a `N_MIN`.
    //
    // `dm` no tiene pedida y realizada: el tamaño de objetivo es el que es.
    const pedida = eje === 'dp' ? t.dpPedida : t.dm;
    for (const i of t.intentos) {
      lista.push({ d: pedida, dRealizada: t[eje], acierto: i.correcto });
    }
    porVariante.set(clave, lista);
  }
  return porVariante;
}
