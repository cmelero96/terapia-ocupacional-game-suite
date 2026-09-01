/**
 * Genera los SVG **marcadores** del banco de imágenes. Sistema 13.
 *
 * ## Qué son y qué no son
 *
 * **No son imágenes de stock.** No hay red en el entorno de construcción, y meter arte de
 * terceros en el repositorio sin comprobar su licencia le deja al propietario del proyecto un
 * problema legal que hereda sin saberlo.
 *
 * Son **dibujos de línea originales**, generados aquí. Eso resuelve la licencia —son obra
 * propia— y resuelve además un problema que el arte de stock no resuelve: cumplen por
 * construcción los diez requisitos técnicos de la biblia de arte, incluido el de que el color
 * salga de los tokens del proyecto y no de literales.
 *
 * ## El cluster es una FORMA, y por eso los dibujos se parecen
 *
 * Dentro de un cluster los objetos **deben** ser confundibles: eso es lo que hace real la
 * perilla de similitud visual. Así que cada cluster tiene una función base y los dieciséis
 * objetos son variaciones de sus parámetros. No es una simplificación del generador: es lo que
 * el sistema 1 pide.
 *
 * Los cuatro clusters son los que la biblia de arte propone para el primer hito, elegidos por
 * ser formas muy distintas entre sí.
 *
 * ## Van al manifiesto REAL, y eso tiene un coste declarado
 *
 * Un `id` es la clave con la que se guarda qué estímulo vio el paciente. Cuando llegue el arte
 * definitivo, estos 64 identificadores **se retiran y se crean otros** — no se sustituye el
 * archivo, porque eso está prohibido y por buenos motivos.
 *
 * Son 64 retiradas futuras. Es el precio de tener el pipeline entero ejecutable hoy en lugar
 * de tener cuatro herramientas que nadie ha ejecutado contra un archivo real, y se paga a
 * gusto: `attrs.procedencia = 'marcador'` los identifica para retirarlos en lote.
 *
 * Uso:  node tools/banco/dibujar-marcadores.js
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'assets', 'art', 'banco');

/**
 * Envuelve un cuerpo de SVG.
 *
 * `stroke="currentColor"` y `fill="none"`: **el color no está en el archivo.** Lo pone el
 * documento, que es lo que hace que la regla del color se cumpla por construcción y lo que
 * permite que el modo de colores forzados funcione.
 *
 * Sin `<text>`, sin ráster, sin filtros, sin grupos: los cuatro están prohibidos por la
 * biblia de arte, y aquí no aparecen porque el generador no los puede producir.
 *
 * @param {string} cuerpo
 * @returns {string}
 */
const svg = (cuerpo) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" '
  + 'fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" '
  + `stroke-linejoin="round">${cuerpo}</svg>`;

/** @param {number} n */
const r1 = (n) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------- primitivas

/** @param {number} x @param {number} y @param {number} rx @param {number} ry */
const elipse = (x, y, rx, ry) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}"/>`;

/** @param {number[][]} puntos @param {boolean} [cerrado] */
const poli = (puntos, cerrado = false) => {
  const d = puntos.map(([x, y]) => `${r1(/** @type {number} */ (x))},${r1(/** @type {number} */ (y))}`).join(' ');
  return cerrado ? `<polygon points="${d}"/>` : `<polyline points="${d}"/>`;
};

/** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 */
const linea = (x1, y1, x2, y2) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;

/** @param {string} d */
const ruta = (d) => `<path d="${d}"/>`;

// ---------------------------------------------------------------- cluster 1: recipientes

/**
 * Cilindro o cono con **boca visible**. Cluster 1 de la biblia de arte.
 *
 * @param {object} p
 * @param {number} p.arriba Semiancho de la boca
 * @param {number} p.abajo Semiancho de la base
 * @param {number} p.alto
 * @param {'asa' | 'pico' | 'asa-alta' | 'patas' | 'tapa-abierta' | 'pie' | null} [p.rasgo]
 */
function recipiente({ arriba, abajo, alto, rasgo = null }) {
  const yT = 50 - alto / 2;
  const yB = 50 + alto / 2;
  const partes = [
    // La boca: una elipse abierta es lo que dice "esto está hueco".
    elipse(50, yT, arriba, arriba * 0.28),
    poli([[50 - arriba, yT], [50 - abajo, yB], [50 + abajo, yB], [50 + arriba, yT]]),
  ];
  if (rasgo === 'asa') {
    partes.push(ruta(`M ${r1(50 + arriba * 0.9)} ${r1(yT + alto * 0.25)} `
      + `q 16 6 0 ${r1(alto * 0.35)}`));
  }
  if (rasgo === 'asa-alta') {
    partes.push(ruta(`M ${r1(50 - arriba)} ${r1(yT)} q 0 -18 ${r1(arriba * 2)} 0`));
  }
  if (rasgo === 'pico') {
    partes.push(poli([[50 + arriba * 0.8, yT + 2], [50 + arriba + 10, yT - 4]]));
  }
  if (rasgo === 'patas') {
    partes.push(linea(50 - abajo * 0.6, yB, 50 - abajo * 0.7, yB + 8));
    partes.push(linea(50 + abajo * 0.6, yB, 50 + abajo * 0.7, yB + 8));
  }
  if (rasgo === 'pie') {
    partes.push(linea(50, yB, 50, yB + 9));
    partes.push(linea(50 - 12, yB + 9, 50 + 12, yB + 9));
  }
  if (rasgo === 'tapa-abierta') {
    partes.push(linea(50 - arriba, yT - 3, 50 + arriba * 0.2, yT - 12));
  }
  return svg(partes.join(''));
}

// ---------------------------------------------------------------- cluster 8: redondeados

/**
 * Volumen esférico u ovoide. Cluster 8.
 *
 * @param {object} p
 * @param {number} p.rx
 * @param {number} p.ry
 * @param {'rabo' | 'hoja' | 'gajos' | 'hoyo' | 'corona' | 'rabo-largo' | 'raya' | null} [p.rasgo]
 */
function redondo({ rx, ry, rasgo = null }) {
  const partes = [elipse(50, 52, rx, ry)];
  const yTop = 52 - ry;
  if (rasgo === 'rabo') partes.push(linea(50, yTop, 50, yTop - 8));
  if (rasgo === 'rabo-largo') partes.push(ruta(`M 50 ${r1(yTop)} q 4 -12 12 -14`));
  if (rasgo === 'hoja') {
    partes.push(linea(50, yTop, 50, yTop - 6));
    partes.push(ruta(`M 50 ${r1(yTop - 5)} q 12 -6 14 4 q -12 5 -14 -4`));
  }
  if (rasgo === 'gajos') {
    partes.push(linea(50 - rx * 0.55, 52 - ry * 0.75, 50 - rx * 0.3, 52 + ry * 0.85));
    partes.push(linea(50 + rx * 0.55, 52 - ry * 0.75, 50 + rx * 0.3, 52 + ry * 0.85));
  }
  if (rasgo === 'hoyo') partes.push(ruta(`M ${r1(50 - 7)} ${r1(yTop + 3)} q 7 6 14 0`));
  if (rasgo === 'corona') {
    for (const dx of [-8, 0, 8]) partes.push(linea(50 + dx, yTop + 1, 50 + dx * 1.6, yTop - 9));
  }
  if (rasgo === 'raya') partes.push(ruta(`M ${r1(50 - rx * 0.8)} 52 q ${r1(rx * 0.8)} 10 ${r1(rx * 1.6)} 0`));
  return svg(partes.join(''));
}

// ---------------------------------------------------------------- cluster 13: escritura

/**
 * Cilindro fino y alargado, en diagonal. Cluster 13.
 *
 * La diagonal no es estética: un eje vertical y uno diagonal son formas distintas, y el
 * cluster entero tiene que compartir eje para que la similitud sea real.
 *
 * **Reescrita tras MEDIR la distinguibilidad.** La primera versión variaba sólo el grosor y
 * añadía un detalle pequeño. El resultado: `boligrafo` y `estilografo` daban una diferencia
 * media de **1 sobre 255** a 24 px. Eran el mismo dibujo.
 *
 * El eje de similitud pide **parecido, no identidad**: si dos elementos de un tablero son
 * idénticos, el paciente no puede acertar y el fallo no es suyo.
 *
 * Ahora varían tres cosas con recorrido de verdad —el **largo** de 30 a 70, el **grosor** de 4
 * a 11, y el **tipo de punta**— y el detalle del cuerpo es lo último, no lo único.
 *
 * @param {object} p
 * @param {number} p.largo Longitud a lo largo de la diagonal
 * @param {number} p.grosor Semiancho del cuerpo
 * @param {'cono' | 'aguja' | 'plano' | 'redonda' | 'hendida' | 'cerdas' | 'bisel'} p.punta
 * @param {'banda' | 'banda-ancha' | 'virola' | 'clip' | 'capuchon' | null} [p.rasgo]
 */
function alargado({ largo, grosor, punta, rasgo = null }) {
  const D = 0.7071;
  // Centrado en la diagonal: el objeto queda en medio del lienzo a cualquier largo.
  const xA = 50 - (largo / 2) * D;
  const yA = 50 + (largo / 2) * D;
  const xB = 50 + (largo / 2) * D;
  const yB = 50 - (largo / 2) * D;

  /** Cuánto ocupa la punta, por tipo. Es parte de la silueta, no un adorno. */
  const largoPunta = {
    cono: 12, aguja: 22, plano: 0, redonda: 6, hendida: 10, cerdas: 14, bisel: 8,
  }[punta];
  const cx = xB - largoPunta * D;
  const cy = yB + largoPunta * D;
  const g = grosor;

  /** @param {number} x @param {number} y @param {number} s @returns {[number, number]} */
  const izq = (x, y, s) => [x - s * D, y - s * D];
  /** @param {number} x @param {number} y @param {number} s @returns {[number, number]} */
  const der = (x, y, s) => [x + s * D, y + s * D];

  const partes = [];
  // El cuerpo, siempre: es lo que hace que el cluster sea un cluster.
  partes.push(poli([izq(xA, yA, g), izq(cx, cy, g), der(cx, cy, g), der(xA, yA, g)], true));

  if (punta === 'plano') {
    // Sin punta: extremo cortado. Es la tiza y el carboncillo.
    const a = izq(xB, yB, g);
    const b = der(xB, yB, g);
    partes.push(linea(a[0], a[1], b[0], b[1]));
    partes.push(linea(izq(xA, yA, g)[0], izq(xA, yA, g)[1], der(xA, yA, g)[0], der(xA, yA, g)[1]));
  } else if (punta === 'redonda') {
    const a = izq(cx, cy, g);
    const b = der(cx, cy, g);
    partes.push(ruta(`M ${r1(a[0])} ${r1(a[1])} Q ${r1(xB)} ${r1(yB)} ${r1(b[0])} ${r1(b[1])}`));
  } else if (punta === 'hendida') {
    partes.push(poli([izq(cx, cy, g), [xB, yB], der(cx, cy, g)], true));
    partes.push(linea((cx + xB) / 2, (cy + yB) / 2, xB, yB));
  } else if (punta === 'cerdas') {
    partes.push(poli([
      izq(cx, cy, g * 1.4), izq(xB, yB, g * 0.9), der(xB, yB, g * 0.9), der(cx, cy, g * 1.4),
    ], true));
    // Tres pelos: sin ellos, unas cerdas son un cono gordo.
    for (const t of [-0.6, 0, 0.6]) {
      const p1 = [cx + t * g * 1.4 * D, cy + t * g * 1.4 * D];
      partes.push(linea(
        /** @type {number} */ (p1[0]), /** @type {number} */ (p1[1]),
        /** @type {number} */ (p1[0]) + (xB - cx) * 0.95,
        /** @type {number} */ (p1[1]) + (yB - cy) * 0.95,
      ));
    }
  } else if (punta === 'bisel') {
    // Corte oblicuo: una sola cara. Es lo que distingue un subrayador de un rotulador.
    partes.push(poli([izq(cx, cy, g), [xB, yB], der(xB, yB, g * 0.45)], true));
  } else {
    // cono y aguja: la misma forma, muy distinto largo.
    partes.push(poli([izq(cx, cy, g), [xB, yB], der(cx, cy, g)], true));
  }

  if (rasgo === 'banda' || rasgo === 'banda-ancha') {
    const dd = rasgo === 'banda' ? [largo * 0.3] : [largo * 0.24, largo * 0.42];
    for (const d of dd) {
      const bx = xA + d * D;
      const by = yA - d * D;
      const a = izq(bx, by, g);
      const b = der(bx, by, g);
      partes.push(linea(a[0], a[1], b[0], b[1]));
    }
  }
  if (rasgo === 'virola') {
    for (const d of [largo * 0.5, largo * 0.58]) {
      const bx = xA + d * D;
      const by = yA - d * D;
      const a = izq(bx, by, g * 1.3);
      const b = der(bx, by, g * 1.3);
      partes.push(linea(a[0], a[1], b[0], b[1]));
    }
  }
  if (rasgo === 'clip') {
    const p1 = der(xA, yA, g);
    partes.push(linea(p1[0], p1[1], p1[0] + largo * 0.24 * D, p1[1] - largo * 0.24 * D));
  }
  if (rasgo === 'capuchon') {
    const d = largo * 0.44;
    const bx = xA + d * D;
    const by = yA - d * D;
    partes.push(poli([
      izq(xA, yA, g * 1.35), izq(bx, by, g * 1.35), der(bx, by, g * 1.35), der(xA, yA, g * 1.35),
    ], true));
  }
  return svg(partes.join(''));
}

// ---------------------------------------------------------------- cluster 16: vehículos

/**
 * Cuerpo horizontal sobre círculos. Cluster 16.
 *
 * @param {object} p
 * @param {number} p.alto Alto del cuerpo
 * @param {number} p.rRueda
 * @param {number} p.nRuedas 2 o 3
 * @param {'cabina' | 'techo' | 'caja' | 'radios' | 'manillar' | 'plano' | null} [p.rasgo]
 */
function vehiculo({ alto, rRueda, nRuedas, rasgo = null }) {
  const yBase = 74 - rRueda;
  const partes = [];
  const x1 = 14;
  const x2 = 86;
  partes.push(poli([[x1, yBase], [x1, yBase - alto], [x2, yBase - alto], [x2, yBase]], false));
  partes.push(linea(x1, yBase, x2, yBase));

  const xs = nRuedas === 3 ? [26, 50, 74] : [30, 70];
  for (const x of xs) partes.push(elipse(x, 74 - rRueda + rRueda, rRueda, rRueda));

  if (rasgo === 'cabina') {
    partes.push(poli([[x1 + 12, yBase - alto], [x1 + 20, yBase - alto - 12],
      [x1 + 40, yBase - alto - 12], [x1 + 44, yBase - alto]], false));
  }
  if (rasgo === 'techo') {
    partes.push(linea(x1 + 6, yBase - alto - 10, x2 - 6, yBase - alto - 10));
    partes.push(linea(x1 + 6, yBase - alto, x1 + 6, yBase - alto - 10));
    partes.push(linea(x2 - 6, yBase - alto, x2 - 6, yBase - alto - 10));
  }
  if (rasgo === 'caja') {
    partes.push(poli([[x1 + 4, yBase - alto], [x1 + 4, yBase - alto - 14],
      [50, yBase - alto - 14], [50, yBase - alto]], false));
  }
  if (rasgo === 'radios') {
    for (const x of xs) {
      partes.push(linea(x - rRueda * 0.7, 74 - rRueda * 0.7, x + rRueda * 0.7, 74 + rRueda * 0.7));
      partes.push(linea(x - rRueda * 0.7, 74 + rRueda * 0.7, x + rRueda * 0.7, 74 - rRueda * 0.7));
    }
  }
  if (rasgo === 'manillar') {
    partes.push(linea(x2 - 8, yBase - alto, x2 - 4, yBase - alto - 14));
    partes.push(linea(x2 - 12, yBase - alto - 14, x2 + 4, yBase - alto - 14));
  }
  return svg(partes.join(''));
}

// ---------------------------------------------------------------- el catálogo

/**
 * @typedef {object} Marcador
 * @property {string} id
 * @property {string} name
 * @property {string[]} categories
 * @property {string} svg
 */

/** @type {{ cluster: string, objetos: Marcador[] }[]} */
const CATALOGO = [
  {
    cluster: 'recipientes-abiertos',
    objetos: [
      { id: 'taza', name: 'taza', categories: ['cocina', 'vajilla'], svg: recipiente({ arriba: 17, abajo: 14, alto: 34, rasgo: 'asa' }) },
      { id: 'vaso', name: 'vaso', categories: ['cocina', 'vajilla'], svg: recipiente({ arriba: 15, abajo: 12, alto: 40 }) },
      { id: 'bol', name: 'bol', categories: ['cocina', 'vajilla'], svg: recipiente({ arriba: 22, abajo: 9, alto: 24 }) },
      { id: 'cubo', name: 'cubo', categories: ['aseo', 'herramientas'], svg: recipiente({ arriba: 22, abajo: 15, alto: 34, rasgo: 'asa-alta' }) },
      { id: 'maceta', name: 'maceta', categories: ['jardin'], svg: recipiente({ arriba: 20, abajo: 12, alto: 30 }) },
      { id: 'cazo', name: 'cazo', categories: ['cocina'], svg: recipiente({ arriba: 18, abajo: 16, alto: 22, rasgo: 'asa' }) },
      { id: 'jarra', name: 'jarra', categories: ['cocina', 'vajilla'], svg: recipiente({ arriba: 16, abajo: 14, alto: 42, rasgo: 'pico' }) },
      { id: 'copa', name: 'copa', categories: ['cocina', 'vajilla'], svg: recipiente({ arriba: 16, abajo: 6, alto: 24, rasgo: 'pie' }) },
      { id: 'papelera', name: 'papelera', categories: ['oficina', 'aseo'], svg: recipiente({ arriba: 19, abajo: 13, alto: 42 }) },
      { id: 'barreno', name: 'barreño', categories: ['aseo', 'cocina'], svg: recipiente({ arriba: 26, abajo: 16, alto: 20 }) },
      { id: 'cazuela', name: 'cazuela', categories: ['cocina'], svg: recipiente({ arriba: 24, abajo: 20, alto: 22, rasgo: 'asa' }) },
      { id: 'cubilete', name: 'cubilete', categories: ['cocina'], svg: recipiente({ arriba: 12, abajo: 10, alto: 30 }) },
      { id: 'regadera', name: 'regadera', categories: ['jardin'], svg: recipiente({ arriba: 16, abajo: 15, alto: 30, rasgo: 'pico' }) },
      { id: 'tiesto', name: 'tiesto', categories: ['jardin'], svg: recipiente({ arriba: 21, abajo: 14, alto: 24, rasgo: 'patas' }) },
      { id: 'jarron', name: 'jarrón', categories: ['casa'], svg: recipiente({ arriba: 12, abajo: 16, alto: 44 }) },
      { id: 'olla-abierta', name: 'olla', categories: ['cocina'], svg: recipiente({ arriba: 21, abajo: 19, alto: 30, rasgo: 'tapa-abierta' }) },
    ],
  },
  {
    cluster: 'redondeados',
    objetos: [
      { id: 'manzana', name: 'manzana', categories: ['alimentos', 'frutas', 'cocina'], svg: redondo({ rx: 26, ry: 25, rasgo: 'hoja' }) },
      { id: 'naranja', name: 'naranja', categories: ['alimentos', 'frutas'], svg: redondo({ rx: 26, ry: 26, rasgo: 'gajos' }) },
      { id: 'tomate', name: 'tomate', categories: ['alimentos', 'verduras', 'cocina'], svg: redondo({ rx: 27, ry: 24, rasgo: 'corona' }) },
      { id: 'cebolla', name: 'cebolla', categories: ['alimentos', 'verduras', 'cocina'], svg: redondo({ rx: 25, ry: 26, rasgo: 'rabo' }) },
      { id: 'melon', name: 'melón', categories: ['alimentos', 'frutas'], svg: redondo({ rx: 30, ry: 24, rasgo: 'raya' }) },
      { id: 'sandia', name: 'sandía', categories: ['alimentos', 'frutas'], svg: redondo({ rx: 31, ry: 28 }) },
      { id: 'ciruela', name: 'ciruela', categories: ['alimentos', 'frutas'], svg: redondo({ rx: 20, ry: 22, rasgo: 'raya' }) },
      { id: 'mandarina', name: 'mandarina', categories: ['alimentos', 'frutas'], svg: redondo({ rx: 24, ry: 20, rasgo: 'gajos' }) },
      { id: 'granada', name: 'granada', categories: ['alimentos', 'frutas'], svg: redondo({ rx: 25, ry: 25, rasgo: 'corona' }) },
      { id: 'melocoton', name: 'melocotón', categories: ['alimentos', 'frutas'], svg: redondo({ rx: 25, ry: 25, rasgo: 'hoyo' }) },
      { id: 'pera', name: 'pera', categories: ['alimentos', 'frutas'], svg: redondo({ rx: 21, ry: 26, rasgo: 'rabo' }) },
      { id: 'kiwi', name: 'kiwi', categories: ['alimentos', 'frutas'], svg: redondo({ rx: 22, ry: 18 }) },
      { id: 'remolacha', name: 'remolacha', categories: ['alimentos', 'verduras'], svg: redondo({ rx: 23, ry: 22, rasgo: 'rabo-largo' }) },
      { id: 'nabo', name: 'nabo', categories: ['alimentos', 'verduras'], svg: redondo({ rx: 22, ry: 24, rasgo: 'hoja' }) },
      { id: 'pomelo', name: 'pomelo', categories: ['alimentos', 'frutas'], svg: redondo({ rx: 28, ry: 26, rasgo: 'gajos' }) },
      { id: 'nectarina', name: 'nectarina', categories: ['alimentos', 'frutas'], svg: redondo({ rx: 24, ry: 23, rasgo: 'hoyo' }) },
    ],
  },
  {
    cluster: 'escritura',
    objetos: [
      { id: 'lapiz', name: 'lápiz', categories: ['oficina', 'escuela'], svg: alargado({ largo: 66, grosor: 7, punta: 'cono', rasgo: 'banda' }) },
      { id: 'boligrafo', name: 'bolígrafo', categories: ['oficina', 'escuela'], svg: alargado({ largo: 62, grosor: 5, punta: 'aguja', rasgo: 'clip' }) },
      { id: 'rotulador', name: 'rotulador', categories: ['oficina', 'escuela'], svg: alargado({ largo: 54, grosor: 10, punta: 'plano', rasgo: 'banda-ancha' }) },
      { id: 'pincel', name: 'pincel', categories: ['oficina', 'arte'], svg: alargado({ largo: 70, grosor: 5, punta: 'cerdas', rasgo: 'virola' }) },
      { id: 'tiza', name: 'tiza', categories: ['escuela'], svg: alargado({ largo: 30, grosor: 9, punta: 'plano' }) },
      { id: 'pluma', name: 'pluma', categories: ['oficina'], svg: alargado({ largo: 64, grosor: 6, punta: 'hendida', rasgo: 'virola' }) },
      { id: 'portaminas', name: 'portaminas', categories: ['oficina', 'escuela'], svg: alargado({ largo: 58, grosor: 4, punta: 'aguja', rasgo: 'banda' }) },
      { id: 'subrayador', name: 'subrayador', categories: ['oficina', 'escuela'], svg: alargado({ largo: 44, grosor: 11, punta: 'bisel' }) },
      { id: 'carboncillo', name: 'carboncillo', categories: ['arte'], svg: alargado({ largo: 38, grosor: 6, punta: 'plano' }) },
      { id: 'cera', name: 'cera de color', categories: ['escuela', 'arte'], svg: alargado({ largo: 48, grosor: 8, punta: 'cono', rasgo: 'banda-ancha' }) },
      { id: 'brocha-fina', name: 'brocha fina', categories: ['arte', 'herramientas'], svg: alargado({ largo: 56, grosor: 8, punta: 'cerdas' }) },
      { id: 'marcador', name: 'marcador', categories: ['oficina'], svg: alargado({ largo: 58, grosor: 9, punta: 'redonda', rasgo: 'banda' }) },
      { id: 'lapiz-corto', name: 'lápiz corto', categories: ['oficina', 'escuela'], svg: alargado({ largo: 36, grosor: 7, punta: 'cono', rasgo: 'banda' }) },
      { id: 'plumilla', name: 'plumilla', categories: ['arte'], svg: alargado({ largo: 32, grosor: 5, punta: 'hendida' }) },
      { id: 'estilografo', name: 'estilógrafo', categories: ['oficina'], svg: alargado({ largo: 68, grosor: 6, punta: 'cono', rasgo: 'capuchon' }) },
      { id: 'punzon', name: 'punzón', categories: ['herramientas'], svg: alargado({ largo: 70, grosor: 4, punta: 'aguja', rasgo: 'capuchon' }) },
    ],
  },
  {
    cluster: 'vehiculos-ruedas',
    objetos: [
      { id: 'coche', name: 'coche', categories: ['transporte'], svg: vehiculo({ alto: 16, rRueda: 9, nRuedas: 2, rasgo: 'cabina' }) },
      { id: 'autobus', name: 'autobús', categories: ['transporte'], svg: vehiculo({ alto: 26, rRueda: 8, nRuedas: 2, rasgo: 'techo' }) },
      { id: 'camion', name: 'camión', categories: ['transporte'], svg: vehiculo({ alto: 15, rRueda: 9, nRuedas: 3, rasgo: 'caja' }) },
      { id: 'furgoneta', name: 'furgoneta', categories: ['transporte'], svg: vehiculo({ alto: 22, rRueda: 8, nRuedas: 2, rasgo: 'cabina' }) },
      { id: 'caravana', name: 'caravana', categories: ['transporte'], svg: vehiculo({ alto: 25, rRueda: 8, nRuedas: 2 }) },
      { id: 'ambulancia', name: 'ambulancia', categories: ['transporte', 'salud'], svg: vehiculo({ alto: 23, rRueda: 9, nRuedas: 2, rasgo: 'techo' }) },
      { id: 'taxi', name: 'taxi', categories: ['transporte'], svg: vehiculo({ alto: 17, rRueda: 9, nRuedas: 2, rasgo: 'techo' }) },
      { id: 'tractor', name: 'tractor', categories: ['transporte', 'campo'], svg: vehiculo({ alto: 18, rRueda: 10, nRuedas: 2, rasgo: 'caja' }) },
      { id: 'remolque', name: 'remolque', categories: ['transporte'], svg: vehiculo({ alto: 19, rRueda: 8, nRuedas: 3 }) },
      { id: 'camioneta', name: 'camioneta', categories: ['transporte'], svg: vehiculo({ alto: 16, rRueda: 8, nRuedas: 2, rasgo: 'caja' }) },
      { id: 'monovolumen', name: 'monovolumen', categories: ['transporte'], svg: vehiculo({ alto: 20, rRueda: 9, nRuedas: 2, rasgo: 'cabina' }) },
      { id: 'todoterreno', name: 'todoterreno', categories: ['transporte'], svg: vehiculo({ alto: 19, rRueda: 10, nRuedas: 2, rasgo: 'cabina' }) },
      { id: 'minibus', name: 'minibús', categories: ['transporte'], svg: vehiculo({ alto: 24, rRueda: 9, nRuedas: 2 }) },
      { id: 'volquete', name: 'volquete', categories: ['transporte', 'campo'], svg: vehiculo({ alto: 14, rRueda: 10, nRuedas: 3, rasgo: 'caja' }) },
      { id: 'furgon', name: 'furgón', categories: ['transporte'], svg: vehiculo({ alto: 27, rRueda: 8, nRuedas: 3 }) },
      { id: 'coche-pequeno', name: 'coche pequeño', categories: ['transporte'], svg: vehiculo({ alto: 15, rRueda: 8, nRuedas: 2, rasgo: 'techo' }) },
    ],
  },
];

// ---------------------------------------------------------------- escritura

/** @type {import('../../src/banco/esquema.js').ImageAsset[]} */
const entradas = [];
let bytesMax = 0;

for (const { cluster, objetos } of CATALOGO) {
  mkdirSync(join(DIR, cluster), { recursive: true });
  for (const o of objetos) {
    const file = `${cluster}/${o.id}.svg`;
    writeFileSync(join(DIR, file), o.svg, 'utf-8');
    bytesMax = Math.max(bytesMax, Buffer.byteLength(o.svg, 'utf-8'));
    entradas.push({
      id: o.id,
      file,
      categories: o.categories,
      cluster,
      name: o.name,
      status: 'active',
      // El punto de extensión del esquema, usado para lo que existe: identificar los
      // marcadores para poder retirarlos en lote cuando llegue el arte definitivo.
      attrs: { procedencia: 'marcador' },
    });
  }
}

writeFileSync(join(DIR, 'marcadores.json'), `${JSON.stringify(entradas, null, 2)}\n`, 'utf-8');

console.log(`Escritos ${entradas.length} SVG en ${DIR}`);
console.log(`  clusters: ${CATALOGO.map((c) => `${c.cluster} (${c.objetos.length})`).join(', ')}`);
console.log(`  archivo mas grande: ${bytesMax} bytes (limite de la biblia de arte: 4096)`);
console.log(`  lote para el importador: ${join(DIR, 'marcadores.json')}`);
