/**
 * Importador de lote. **El único escritor legítimo del manifiesto.** Sistema 13 · ADR-0001.
 *
 * ## La regla que define esta herramienta
 *
 * > **Se niega a escribir sobre un `id` existente. No existe bandera ni opción que fuerce la
 * > sobrescritura.**
 *
 * No es una precaución: es la consecuencia directa de qué es un `id`. Es la clave con la que
 * se guarda qué estímulo vio el paciente, y toda la medición asume que ese estímulo no cambia
 * entre sesiones. Sobrescribir un id significa que la sesión 4 y la sesión 7 de un paciente
 * dicen que vio lo mismo, y vio dos cosas distintas.
 *
 * La vía correcta para cambiar una imagen es **retirar el id y crear otro**. Cuesta una fila
 * más en el manifiesto y conserva la validez de todo lo medido.
 *
 * Por eso `--forzar` no existe, y no se va a añadir. Una bandera así acaba siempre puesta.
 *
 * ## Función PURA
 *
 * `fusionar` no escribe nada: devuelve el manifiesto nuevo o los rechazos. Quien escribe es
 * el CLI, y sólo si no hay ningún rechazo — validación total, nunca parcial.
 */

/**
 * @typedef {object} Rechazo
 * @property {string} codigo
 * @property {string} id
 * @property {string} mensaje
 */

/**
 * Fusiona entradas nuevas en el manifiesto.
 *
 * **Con un solo rechazo, no se importa NADA.** Un lote a medias deja el manifiesto en un
 * estado que nadie pidió, y obliga a averiguar qué entró y qué no.
 *
 * @param {object} entrada
 * @param {readonly import('../../src/banco/esquema.js').ImageAsset[]} entrada.manifiesto
 * @param {readonly import('../../src/banco/esquema.js').ImageAsset[]} entrada.nuevas
 * @returns {{ resultado: import('../../src/banco/esquema.js').ImageAsset[] | null, rechazos: Rechazo[] }}
 */
export function fusionar({ manifiesto, nuevas }) {
  /** @type {Rechazo[]} */
  const rechazos = [];
  const existentes = new Set(manifiesto.map((a) => a.id));
  const archivosExistentes = new Set(manifiesto.map((a) => a.file));

  /** @type {Set<string>} */
  const dentroDelLote = new Set();
  /** @type {Set<string>} */
  const archivosDelLote = new Set();

  for (const a of nuevas) {
    const id = typeof a?.id === 'string' ? a.id : '(sin id)';

    if (existentes.has(id)) {
      rechazos.push({
        codigo: 'idYaExiste', id,
        mensaje: `'${id}': ya esta en el manifiesto. NO se sobrescribe, y no hay bandera `
          + 'que lo fuerce. Para cambiar la imagen: retira este id y crea otro.',
      });
      continue;
    }
    // Un lote que se pisa a sí mismo. Sin esta comprobación, la última entrada del lote
    // ganaría y las anteriores desaparecerían sin aviso.
    if (dentroDelLote.has(id)) {
      rechazos.push({
        codigo: 'idRepetidoEnElLote', id,
        mensaje: `'${id}': aparece dos veces en el lote que se importa.`,
      });
      continue;
    }
    // Y un archivo ya usado: sería el mismo estímulo con dos claves.
    if (typeof a?.file === 'string'
      && (archivosExistentes.has(a.file) || archivosDelLote.has(a.file))) {
      rechazos.push({
        codigo: 'archivoYaUsado', id,
        mensaje: `'${id}': el archivo '${a.file}' ya lo usa otra entrada. Dos ids para el `
          + 'mismo estimulo hacen ambigua la medicion.',
      });
      continue;
    }
    // Nadie nace retirado, así que un alta con `retiredAt` es un error de datos.
    if (a?.status === 'retired') {
      rechazos.push({
        codigo: 'altaRetirada', id,
        mensaje: `'${id}': se importa como 'retired'. Ningun asset nace retirado.`,
      });
      continue;
    }

    dentroDelLote.add(id);
    if (typeof a?.file === 'string') archivosDelLote.add(a.file);
  }

  if (rechazos.length > 0) return { resultado: null, rechazos };

  // Orden estable por id, para que el diff de git de un lote sea legible.
  const resultado = [...manifiesto, ...nuevas]
    .slice()
    .sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
  return { resultado, rechazos: [] };
}

/**
 * Retira un id. Es la operación que sustituye a «reemplazar manteniendo id».
 *
 * **Conserva la fila.** Lo que está prohibido es borrarla: los datos ya registrados que la
 * referencian se quedarían sin estímulo.
 *
 * @param {object} entrada
 * @param {readonly import('../../src/banco/esquema.js').ImageAsset[]} entrada.manifiesto
 * @param {string} entrada.id
 * @param {string} entrada.fecha `AAAA-MM-DD`. **Obligatoria**, y no se toma del reloj:
 *   leer el reloj aquí haría la herramienta no determinista, y quien retira sabe la fecha.
 * @returns {{ resultado: import('../../src/banco/esquema.js').ImageAsset[] | null, rechazos: Rechazo[] }}
 */
export function retirar({ manifiesto, id, fecha }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return {
      resultado: null,
      rechazos: [{ codigo: 'fechaInvalida', id, mensaje: `fecha '${fecha}' no es AAAA-MM-DD.` }],
    };
  }
  const actual = manifiesto.find((a) => a.id === id);
  if (actual === undefined) {
    return {
      resultado: null,
      rechazos: [{ codigo: 'idDesconocido', id, mensaje: `'${id}': no esta en el manifiesto.` }],
    };
  }
  if (actual.status === 'retired') {
    return {
      resultado: null,
      rechazos: [{ codigo: 'yaRetirado', id, mensaje: `'${id}': ya estaba retirado.` }],
    };
  }
  return {
    resultado: manifiesto.map((a) => (
      a.id === id ? { ...a, status: /** @type {const} */ ('retired'), retiredAt: fecha } : a
    )),
    rechazos: [],
  };
}

/**
 * El manifiesto como módulo JS con literales, que es el formato de ADR-0001.
 *
 * **No es JSON**, y el motivo es que sin paso de build `tsc --checkJs` sólo comprueba de
 * verdad literales de código: un JSON cargado en ejecución tipa como `any`, y la
 * comprobación de tipos se evapora exactamente en la frontera donde 256 registros curados a
 * mano la necesitan.
 *
 * @param {readonly import('../../src/banco/esquema.js').ImageAsset[]} manifiesto
 * @returns {string}
 */
export function serializarManifiesto(manifiesto) {
  const SALTO = String.fromCharCode(10);
  const cabecera = [
    '/**',
    ' * Manifiesto del banco de imagenes. Sistema 1 · ADR-0001.',
    ' *',
    ' * **GENERADO por tools/banco/importar.js. No se edita a mano.**',
    ' *',
    ' * Modulo JS con literales, no JSON: sin paso de build, `tsc --checkJs` solo comprueba',
    ' * de verdad literales de codigo, y aqui hay registros curados a mano que necesitan esa',
    ' * comprobacion entrada por entrada.',
    ' *',
    ' * Un `id` NUNCA se renombra ni se reutiliza. Para cambiar una imagen: retirar el id y',
    ' * crear otro.',
    ' */',
    '',
    "/** @type {import('./esquema.js').ImageAsset[]} */",
    'const BANCO = [',
  ];
  const filas = manifiesto.map((a) => `  ${JSON.stringify(a)},`);
  const cola = ['];', '', 'export default BANCO;', ''];
  return [...cabecera, ...filas, ...cola].join(SALTO);
}
