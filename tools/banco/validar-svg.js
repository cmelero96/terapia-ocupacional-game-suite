/**
 * Puerta de los archivos SVG. Sistema 13.
 *
 * La biblia de arte define **qué** es un SVG válido para este banco. Este módulo lo hace
 * cumplir. Sin él, los diez requisitos son una lista que nadie comprueba.
 *
 * ## Función PURA
 *
 * Recibe el texto del SVG. No abre archivos. Mismo motivo que el validador del manifiesto: un
 * test unitario no toca el disco, y esto tiene que servir el día que el terapeuta suba sus
 * propias imágenes.
 *
 * ## Lo que NO comprueba
 *
 * - **Que el dibujo sea reconocible.** Eso lo ve una persona, en la galería.
 * - **Que el contraste sea suficiente.** Con `currentColor` **no es una propiedad del
 *   archivo**: el color lo pone el documento, así que el contraste lo deciden los tokens y
 *   ya hay una puerta que los comprueba. Es el motivo más fuerte para prohibir los literales
 *   de color aquí.
 */

/** El único `viewBox` admitido. Un solo sistema de coordenadas para los 256. */
const VIEW_BOX = '0 0 100 100';

/** Margen interior mínimo, en unidades del `viewBox`. */
export const MARGEN_MIN = 6;

/** Peso máximo por archivo, en bytes. */
export const BYTES_MAX = 4096;

/**
 * Elementos prohibidos, con el motivo de cada uno.
 *
 * @type {Record<string, string>}
 */
const PROHIBIDOS = {
  text: 'un texto sin convertir a trazo depende de las fuentes del sistema',
  tspan: 'lo mismo que <text>',
  image: 'un raster incrustado anularia las cinco razones de elegir vector',
  filter: 'coste de render y comportamiento inconsistente bajo forced-colors',
  mask: 'lo mismo que <filter>',
  clipPath: 'lo mismo que <filter>',
  foreignObject: 'superficie de ejecucion dentro de un activo de contenido',
  script: 'superficie de ejecucion dentro de un activo de contenido',
  style: 'el color debe venir del documento, no del archivo',
  g: 'los grupos van aplanados: simplifica la normalizacion y el diff',
  use: 'una referencia dentro del archivo complica el aplanado',
};

/** Un literal de color hexadecimal, o una función de color CSS. */
const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\bcolor\(/i;

/**
 * Nombres de color CSS que aparecen como literal.
 *
 * `currentColor` y `none` **no** están: son justamente lo que se quiere. Y las palabras clave
 * de color del sistema —`CanvasText` y compañía— tampoco: en un SVG del banco no tienen
 * sentido, pero prohibirlas por nombre daría un mensaje confuso, así que se dejan pasar y las
 * caza la regla de que sólo se admiten `currentColor` y `none`.
 */
const NOMBRES_COLOR = [
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'gray', 'grey',
  'brown', 'pink', 'cyan', 'magenta', 'silver', 'gold', 'navy', 'teal', 'olive', 'maroon',
];

/**
 * @param {object} entrada
 * @param {string} entrada.id
 * @param {string} entrada.texto El contenido del archivo
 * @returns {import('../../src/banco/esquema.js').Problema[]}
 */
export function validarSvg({ id, texto }) {
  /** @type {import('../../src/banco/esquema.js').Problema[]} */
  const problemas = [];
  /** @param {string} codigo @param {string} mensaje */
  const mal = (codigo, mensaje) => problemas.push({ codigo, id, mensaje: `${id}: ${mensaje}` });

  // --- viewBox
  const vb = texto.match(/viewBox\s*=\s*"([^"]*)"/);
  if (vb === null) mal('svgSinViewBox', 'no declara viewBox.');
  else if (vb[1]?.trim().replace(/\s+/g, ' ') !== VIEW_BOX) {
    mal('svgViewBoxDistinto', `viewBox es '${vb[1]}' y debe ser '${VIEW_BOX}'.`);
  }

  // --- ancho y alto fijos: anularían el escalado, que es la razón 2 de elegir vector
  if (/<svg[^>]*\s(width|height)\s*=/.test(texto)) {
    mal('svgConTamanoFijo', 'declara width o height. El tamano es un parametro clinico.');
  }

  // --- elementos prohibidos
  for (const [etiqueta, motivo] of Object.entries(PROHIBIDOS)) {
    if (new RegExp(`<${etiqueta}[\\s/>]`, 'i').test(texto)) {
      mal('svgElementoProhibido', `usa <${etiqueta}>: ${motivo}.`);
    }
  }

  // --- color: sólo `currentColor` y `none`
  if (COLOR_LITERAL.test(texto)) {
    mal('svgColorLiteral', 'lleva un color literal. El color viene del documento, con '
      + 'currentColor: es lo que hace que forced-colors funcione y que la regla del color se '
      + 'cumpla por construccion.');
  }
  for (const n of NOMBRES_COLOR) {
    if (new RegExp(`(?:fill|stroke)\\s*=\\s*"${n}"`, 'i').test(texto)) {
      mal('svgColorLiteral', `usa el color '${n}'. Solo se admiten currentColor y none.`);
    }
  }
  if (!texto.includes('currentColor')) {
    mal('svgSinCurrentColor', 'no usa currentColor en ningun sitio. El dibujo seria invisible '
      + 'o tendria color propio.');
  }

  // --- peso
  const bytes = Buffer.byteLength(texto, 'utf-8');
  if (bytes > BYTES_MAX) mal('svgDemasiadoGrande', `${bytes} bytes, maximo ${BYTES_MAX}.`);

  // --- margen: se comprueba sobre las COORDENADAS, no renderizando
  const fuera = coordenadasFueraDelMargen(texto);
  if (fuera.length > 0) {
    mal('svgSinMargen', `${fuera.length} coordenada(s) a menos de ${MARGEN_MIN} del borde `
      + `(${fuera.slice(0, 4).join(', ')}${fuera.length > 4 ? ', ...' : ''}). El objeto no `
      + 'debe tocar el borde a ningun tamano.');
  }

  return problemas;
}

/**
 * Coordenadas que se salen del margen.
 *
 * **Es una aproximación, y merece decirlo.** Comprueba los números de los atributos
 * geométricos que este banco usa, y **no** interpreta la `d` de un `<path>` con curvas: una
 * curva de Bézier puede salirse del margen sin que ninguno de sus puntos de control lo haga.
 *
 * Para un banco generado por `dibujar-marcadores.js` es suficiente, porque el generador
 * controla la geometría. Para arte que llegue de fuera hace falta medir la caja real
 * renderizando, y eso es trabajo del pipeline de contraste, que necesita un decodificador.
 *
 * @param {string} texto
 * @returns {string[]}
 */
export function coordenadasFueraDelMargen(texto) {
  /** @type {string[]} */
  const fuera = [];
  const min = MARGEN_MIN;
  const max = 100 - MARGEN_MIN;

  /** @param {string} etiqueta @param {(a: Record<string, number>) => [number, number][]} extremos */
  const revisar = (etiqueta, extremos) => {
    const re = new RegExp(`<${etiqueta}\\b([^>]*)>`, 'gi');
    let m;
    while ((m = re.exec(texto)) !== null) {
      /** @type {Record<string, number>} */
      const a = {};
      const attrs = m[1] ?? '';
      let n;
      const reAttr = /([a-z0-9-]+)\s*=\s*"([-0-9.]+)"/gi;
      while ((n = reAttr.exec(attrs)) !== null) a[/** @type {string} */ (n[1])] = Number(n[2]);
      for (const [x, y] of extremos(a)) {
        if (x < min || x > max || y < min || y > max) {
          fuera.push(`${etiqueta}(${Math.round(x)},${Math.round(y)})`);
        }
      }
    }
  };

  revisar('ellipse', (a) => {
    const { cx = 50, cy = 50, rx = 0, ry = 0 } = a;
    return [[cx - rx, cy], [cx + rx, cy], [cx, cy - ry], [cx, cy + ry]];
  });
  revisar('circle', (a) => {
    const { cx = 50, cy = 50, r = 0 } = a;
    return [[cx - r, cy], [cx + r, cy], [cx, cy - r], [cx, cy + r]];
  });
  revisar('line', (a) => {
    const { x1 = 50, y1 = 50, x2 = 50, y2 = 50 } = a;
    return [[x1, y1], [x2, y2]];
  });
  revisar('rect', (a) => {
    const { x = 0, y = 0, width = 0, height = 0 } = a;
    return [[x, y], [x + width, y + height]];
  });

  // polyline y polygon: la lista de puntos
  for (const etiqueta of ['polyline', 'polygon']) {
    const re = new RegExp(`<${etiqueta}\\b[^>]*points\\s*=\\s*"([^"]*)"`, 'gi');
    let m;
    while ((m = re.exec(texto)) !== null) {
      for (const par of (m[1] ?? '').trim().split(/\s+/)) {
        const [sx, sy] = par.split(',');
        const x = Number(sx);
        const y = Number(sy);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (x < min || x > max || y < min || y > max) {
          fuera.push(`${etiqueta}(${Math.round(x)},${Math.round(y)})`);
        }
      }
    }
  }

  return fuera;
}
