/**
 * Galería de clusters. Sistema 13 · la cuarta herramienta que ADR-0001 nombra.
 *
 * ## Para qué es, y por qué no la puede sustituir un test
 *
 * La biblia de arte define cuándo un cluster está bien formado:
 *
 * > *Un cluster está bien si **un adulto sin daltonismo, viendo los 16 elementos en escala de
 * > grises al tamaño mínimo de 24 px, los confunde entre sí más que con elementos de otro
 * > cluster.***
 *
 * Eso es exactamente la propiedad que la perilla de similitud visual necesita, y **ninguna
 * herramienta la puede comprobar**: hace falta una persona mirando. La galería existe para que
 * esa persona pueda mirar en un sitio en lugar de abrir 64 archivos.
 *
 * ## Tres condiciones de presentación, y las tres son el criterio
 *
 * 1. **Escala de grises**, porque la separación entre clusters debe sobrevivir sin color.
 * 2. **Al tamaño mínimo de 24 px**, porque es donde la confusión importa. A 140 px cualquier
 *    par de dibujos se distingue, y eso no dice nada.
 * 3. **Con `mask-image` y `currentColor`**, que es como los pinta el tablero de verdad. Una
 *    galería que use `<img>` estaría mostrando algo que el producto no muestra: medido, un SVG
 *    externo en `<img>` **no ve** el color del documento y sale siempre negro.
 *
 * ## Salida estática, confirmada en git
 *
 * Corolario de ADR-0003: la salida de una herramienta se confirma como archivo estático. Nada
 * de lo que se sirve depende de que esta herramienta se haya ejecutado.
 *
 * Uso:  node tools/banco/galeria.js
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.cwd();
const RUTA_MANIFIESTO = join(RAIZ, 'src', 'banco', 'manifiesto.js');
const SALIDA = join(RAIZ, 'assets', 'art', 'banco', 'galeria.html');
const SALTO = String.fromCharCode(10);

const mod = await import(`file://${RUTA_MANIFIESTO.split('\\').join('/')}`);
/** @type {import('../../src/banco/esquema.js').ImageAsset[]} */
const manifiesto = mod.default;

/** @type {Map<string, import('../../src/banco/esquema.js').ImageAsset[]>} */
const porCluster = new Map();
for (const a of manifiesto) {
  if (a.status !== 'active') continue;
  porCluster.set(a.cluster, [...(porCluster.get(a.cluster) ?? []), a]);
}

/** @param {string} s */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** @type {string[]} */
const L = [];
/** @param {...string} l */
const w = (...l) => { L.push(...l); };

w(
  '<!doctype html>',
  '<html lang="es"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<title>Galería de clusters del banco</title>',
  '<style>',
  '  :root { color-scheme: light dark; }',
  '  body { font: 15px/1.5 system-ui, sans-serif; margin: 0; padding: 1.5rem 2rem;',
  '         max-width: 70rem; }',
  '  h1 { font-size: 1.4rem; }',
  '  .nota { max-width: 44rem; }',
  '  .barra { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;',
  '           margin: 1rem 0 2rem; padding: 0.75rem 1rem; border: 2px solid; border-radius: 8px; }',
  '  .barra label { display: flex; gap: 0.4rem; align-items: center; }',
  '  section { margin-block: 2.5rem; }',
  '  h2 { font-size: 1.1rem; font-family: ui-monospace, monospace; }',
  '  .rejilla { display: flex; flex-wrap: wrap; gap: 1.25rem; }',
  '  figure { margin: 0; text-align: center; inline-size: 6rem; }',
  '  /* La MISMA tecnica que el tablero: mask-image + currentColor. Ver el comentario de',
  '     cabecera: con <img> el dibujo sale negro y la galeria mentiria. */',
  '  .glifo { display: block; margin: 0 auto 0.35rem; background: currentColor;',
  '           inline-size: var(--t); block-size: var(--t);',
  '           -webkit-mask: var(--src) center/contain no-repeat;',
  '           mask: var(--src) center/contain no-repeat; }',
  '  @media (forced-colors: active) { .glifo { background: CanvasText; } }',
  '  figcaption { font-size: 0.8rem; }',
  '  body { --t: 24px; }',
  '  body[data-gris="si"] { filter: grayscale(1); }',
  '</style></head><body data-gris="si">',
  '',
  '<h1>Galería de clusters del banco de imágenes</h1>',
  '',
  '<p class="nota"><strong>Generada por <code>tools/banco/galeria.js</code>. No se edita a',
  'mano.</strong></p>',
  '',
  '<p class="nota">Un cluster está bien formado si <strong>un adulto sin daltonismo, viendo',
  'los elementos en escala de grises al tamaño mínimo de 24 px, los confunde entre sí más que',
  'con elementos de otro cluster</strong>. Eso es la propiedad que necesita la perilla de',
  'similitud visual, y no la puede comprobar ninguna herramienta: hace falta mirar.</p>',
  '',
  '<p class="nota">Los dibujos de hoy son <strong>marcadores</strong>, no arte definitivo:',
  'dibujo de línea generado por <code>tools/banco/dibujar-marcadores.js</code>. Cuando llegue',
  'el arte real, estos identificadores <strong>se retiran y se crean otros</strong> — no se',
  'sustituye el archivo, porque un identificador es la clave con la que queda registrado qué',
  'vio el paciente.</p>',
  '',
  '<div class="barra">',
  '  <label><input type="checkbox" checked',
  '    onchange="document.body.dataset.gris = this.checked ? \'si\' : \'no\'"> escala de grises</label>',
  '  <label>tamaño',
  '    <select onchange="document.body.style.setProperty(\'--t\', this.value + \'px\')">',
  '      <option value="24" selected>24 px — mínimo de WCAG</option>',
  '      <option value="44">44 px — mínimo AAA</option>',
  '      <option value="60">60 px</option>',
  '      <option value="100">100 px</option>',
  '      <option value="140">140 px — techo</option>',
  '    </select></label>',
  `  <span>${manifiesto.filter((a) => a.status === 'active').length} activos ·`,
  `    ${porCluster.size} clusters</span>`,
  '</div>',
);

for (const [cluster, assets] of [...porCluster].sort()) {
  w('', `<section><h2>${esc(cluster)} — ${assets.length} elementos</h2>`, '<div class="rejilla">');
  for (const a of assets.slice().sort((x, y) => (x.id < y.id ? -1 : 1))) {
    const marcador = a.attrs?.['procedencia'] === 'marcador' ? ' ·' : '';
    w(
      '  <figure>',
      `    <span class="glifo" style="--src: url('${esc(a.file)}')" role="img"`,
      `      aria-label="${esc(a.name)}"></span>`,
      `    <figcaption>${esc(a.name)}${marcador}</figcaption>`,
      '  </figure>',
    );
  }
  w('</div></section>');
}

w(
  '',
  '<p class="nota">El punto tras el nombre marca un <strong>marcador</strong>.</p>',
  '</body></html>',
  '',
);

writeFileSync(SALIDA, L.join(SALTO), 'utf-8');
console.log(`Escrita ${SALIDA}`);
console.log(`  ${porCluster.size} clusters, `
  + `${manifiesto.filter((a) => a.status === 'active').length} elementos activos`);
