/**
 * `banco.lock` — integridad de los archivos del banco. Sistema 13.
 *
 * ## Qué defecto impide, y por qué no puede vivir dentro del manifiesto
 *
 * `technical-preferences.md` prohíbe **sustituir el archivo que hay detrás de un
 * identificador existente**. El identificador es la clave con la que se guarda qué estímulo
 * vio el paciente, y toda la medición asume que ese estímulo no cambia entre sesiones.
 *
 * Pero el manifiesto no puede detectarlo: un `id` que sigue ahí y un `file` que sigue
 * apuntando al mismo sitio son idénticos antes y después de reemplazar el PNG. **El
 * manifiesto no ve el contenido del archivo.**
 *
 * `banco.lock` guarda el hash de cada archivo, y CI lo recalcula **desde disco** en cada
 * ejecución.
 *
 * **CI nunca confía en un hash almacenado dentro del manifiesto** — lo fija ADR-0001, y el
 * motivo es que quien sustituye un archivo puede actualizar el hash en la misma edición si
 * los dos viven en el mismo sitio. El lock es un archivo aparte precisamente para que
 * cambiarlo sea un acto visible en la revisión.
 *
 * ## El hash se calcula sobre los archivos YA NORMALIZADOS
 *
 * Si se calculara antes de normalizar, el pipeline de normalización rompería el lock en cada
 * ejecución y la única salida sería regenerarlo — o sea, desactivar la comprobación.
 *
 * Uso:
 *   node tools/banco/lock.js --generar
 *   node tools/banco/lock.js --comprobar
 */

import { createHash } from 'node:crypto';

/**
 * Hash de un contenido. SHA-256, truncado a 32 caracteres hex.
 *
 * **128 bits, y truncar aquí no es un atajo peligroso.** Esto no es una firma: es detección
 * de cambio accidental o de una sustitución que alguien intentó pasar sin decirlo. Contra un
 * adversario que pueda construir colisiones, este archivo no es la defensa — la defensa es
 * la revisión de código.
 *
 * @param {Uint8Array | string} contenido
 * @returns {string}
 */
export function hash(contenido) {
  return createHash('sha256').update(contenido).digest('hex').slice(0, 32);
}

/**
 * Construye el lock a partir del manifiesto y de un lector inyectado.
 *
 * **Lector inyectado**, por el mismo motivo que el validador: un test unitario no toca el
 * disco, y ADR-0001 quiere que esto sirva también en una futura ruta de ejecución.
 *
 * Sólo se hashean las entradas **activas**. Una retirada conserva su fila si ya estaba —ver
 * `comparar`— pero no se vuelve a leer: el archivo de un asset retirado puede haberse
 * borrado del repositorio legítimamente, y exigir su presencia para siempre convertiría
 * cada retirada en un archivo eterno.
 *
 * @param {object} entrada
 * @param {readonly import('../../src/banco/esquema.js').ImageAsset[]} entrada.manifiesto
 * @param {(file: string) => Uint8Array | string | null} entrada.leer
 *   `null` si el archivo no existe. **No lanza**: la ausencia es un dato del informe.
 * @returns {{ lock: Record<string, string>, ausentes: string[] }}
 */
export function construirLock({ manifiesto, leer }) {
  /** @type {Record<string, string>} */
  const lock = {};
  /** @type {string[]} */
  const ausentes = [];

  // Orden estable por id: un lock que cambia de orden entre ejecuciones produce un diff
  // enorme en cada commit y nadie vuelve a leerlo.
  const activos = manifiesto
    .filter((a) => a.status === 'active')
    .slice()
    .sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));

  for (const a of activos) {
    const contenido = leer(a.file);
    if (contenido === null) {
      ausentes.push(a.id);
      continue;
    }
    lock[a.id] = hash(contenido);
  }
  return { lock, ausentes };
}

/**
 * Compara el lock de git con el recalculado desde disco.
 *
 * Los tres casos son **distinguibles a propósito**, porque piden acciones distintas:
 *
 * | Caso | Qué pasó | Qué hacer |
 * |---|---|---|
 * | `sustituido` | El id sigue y el contenido cambió | **Retirar el id y crear otro.** Es el patrón prohibido |
 * | `nuevo` | Hay un id en disco que no está en el lock | Regenerar el lock, es una alta legítima |
 * | `desaparecido` | Hay un id en el lock que ya no está activo | Regenerar. Pero comprobar que se retiró, no que se borró |
 *
 * Un único `sustituido` es un error. Los otros dos son avisos: no rompen la medición.
 *
 * @param {Record<string, string>} enGit
 * @param {Record<string, string>} enDisco
 * @returns {{ sustituidos: string[], nuevos: string[], desaparecidos: string[] }}
 */
export function comparar(enGit, enDisco) {
  /** @type {string[]} */
  const sustituidos = [];
  /** @type {string[]} */
  const nuevos = [];
  /** @type {string[]} */
  const desaparecidos = [];

  for (const [id, h] of Object.entries(enDisco)) {
    const previo = enGit[id];
    if (previo === undefined) nuevos.push(id);
    else if (previo !== h) sustituidos.push(id);
  }
  for (const id of Object.keys(enGit)) {
    if (enDisco[id] === undefined) desaparecidos.push(id);
  }
  return { sustituidos, nuevos, desaparecidos };
}

/**
 * El lock como texto, para escribirlo en git.
 *
 * Formato de una línea por asset, `id  hash`, ordenado. **No es JSON a propósito:** un diff
 * de git sobre líneas `id hash` se lee de un vistazo, y sobre JSON con llaves y comas no.
 * Este archivo existe para ser leído en una revisión.
 *
 * @param {Record<string, string>} lock
 * @returns {string}
 */
export function serializar(lock) {
  const SALTO = String.fromCharCode(10);
  const cabecera = [
    '# banco.lock — integridad de los archivos del banco de imagenes. Sistema 13.',
    '#',
    '# Generado por: node tools/banco/lock.js --generar',
    '# Comprobado por CI:  node tools/banco/lock.js --comprobar',
    '#',
    '# Un hash que CAMBIA con el id intacto significa que alguien sustituyo el archivo',
    '# detras de un identificador existente. Eso esta prohibido: el id es la clave con la',
    '# que se guarda que estimulo vio el paciente. La via correcta es retirar el id y',
    '# crear otro.',
    '',
  ];
  const filas = Object.keys(lock).sort().map((id) => `${id}  ${lock[id]}`);
  return [...cabecera, ...filas, ''].join(SALTO);
}

/**
 * Lee el formato de `serializar`.
 *
 * @param {string} texto
 * @returns {Record<string, string>}
 */
export function deserializar(texto) {
  /** @type {Record<string, string>} */
  const lock = {};
  for (const linea of texto.split(String.fromCharCode(10))) {
    const limpia = linea.trim();
    if (limpia.length === 0 || limpia.startsWith('#')) continue;
    const partes = limpia.split(/\s+/);
    const id = partes[0];
    const h = partes[1];
    // Una línea malformada NO se ignora en silencio: un lock a medias aprobaría archivos
    // que nadie ha comprobado, y eso es peor que no tener lock.
    if (id === undefined || h === undefined || partes.length !== 2) {
      throw new SyntaxError(`banco.lock: linea malformada: '${limpia}'`);
    }
    if (lock[id] !== undefined) {
      throw new SyntaxError(`banco.lock: el id '${id}' aparece dos veces`);
    }
    lock[id] = h;
  }
  return lock;
}
