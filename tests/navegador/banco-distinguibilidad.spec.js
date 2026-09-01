/**
 * Distinguibilidad de los dibujos dentro de un cluster. Sistema 13.
 *
 * ## El criterio es COMPARATIVO, y por eso se puede medir
 *
 * La biblia de arte dice cuándo un cluster está bien formado:
 *
 * > *Un cluster está bien si un adulto sin daltonismo, viendo los elementos en escala de
 * > grises al tamaño mínimo de 24 px, **los confunde entre sí más que con elementos de otro
 * > cluster**.*
 *
 * Leído así parece que hace falta una persona, y para el juicio final sí. Pero la parte
 * comparativa —«más que con elementos de otro cluster»— **es una desigualdad entre dos
 * distancias**, y una distancia se mide.
 *
 * ## Por qué existe este archivo
 *
 * La primera versión de los dibujos de `escritura` daba, medido, una diferencia media de **1
 * sobre 255** entre `boligrafo` y `estilografo` a 24 px: eran el mismo dibujo.
 *
 * Y eso no es «muy parecido», es un defecto que rompe la tarea: **si dos elementos de un
 * tablero son idénticos, el paciente no puede acertar y el fallo no es suyo.** El eje de
 * similitud pide parecido, no identidad.
 *
 * Ninguna de las herramientas del sistema 13 lo veía. El validador del manifiesto mira
 * metadatos; el `banco.lock` compara bytes, y los archivos eran byte-distintos. Sólo aparece
 * al **renderizar**, y por eso vive aquí y no en `tools/`.
 *
 * ## Cómo se mide
 *
 * Cada SVG se pinta en un `<canvas>` de 24 × 24 y se lee el **canal alfa**: dónde hay trazo y
 * dónde no. La distancia entre dos dibujos es la diferencia media de alfa por píxel, de 0
 * —idénticos— a 255.
 *
 * El canal alfa y no el color, a propósito: el color de estos dibujos lo pone el documento
 * con `currentColor`, así que medirlo no diría nada del dibujo.
 */

import { test, expect } from '@playwright/test';

/** El tamaño donde la confusión importa: mínimo de WCAG 2.5.8. */
const T = 24;

/**
 * Suelo de distinguibilidad. **SIN VALIDAR con personas.**
 *
 * No pretende decir «a partir de aquí se distingue»: eso es empírico y nadie lo ha medido.
 * Lo que impide es lo que sí es un defecto objetivo: que dos dibujos sean **el mismo dibujo**.
 * Con 4 sobre 255 a 24 px, dos siluetas difieren en algo visible.
 */
const SUELO = 4;

/** @type {Record<string, string[]>} */
const CLUSTERS = {
  'recipientes-abiertos': [
    'taza', 'vaso', 'bol', 'cubo', 'maceta', 'cazo', 'jarra', 'copa', 'papelera', 'barreno',
    'cazuela', 'cubilete', 'regadera', 'tiesto', 'jarron', 'olla-abierta',
  ],
  redondeados: [
    'manzana', 'naranja', 'tomate', 'cebolla', 'melon', 'sandia', 'ciruela', 'mandarina',
    'granada', 'melocoton', 'pera', 'kiwi', 'remolacha', 'nabo', 'pomelo', 'nectarina',
  ],
  escritura: [
    'lapiz', 'boligrafo', 'rotulador', 'pincel', 'tiza', 'pluma', 'portaminas', 'subrayador',
    'carboncillo', 'cera', 'brocha-fina', 'marcador', 'lapiz-corto', 'plumilla',
    'estilografo', 'punzon',
  ],
  'vehiculos-ruedas': [
    'coche', 'autobus', 'camion', 'furgoneta', 'caravana', 'ambulancia', 'taxi', 'tractor',
    'remolque', 'camioneta', 'monovolumen', 'todoterreno', 'minibus', 'volquete', 'furgon',
    'coche-pequeno',
  ],
};

/**
 * Carga las siluetas y devuelve las distancias por pares.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ dentro: Record<string, { min: number, media: number, par: string }>, entre: number }>}
 */
async function medir(page) {
  await page.goto('/assets/art/banco/galeria.html');
  return page.evaluate(async ({ clusters, T: t }) => {
    /** @type {Record<string, Uint8Array>} */
    const siluetas = {};
    const cv = document.createElement('canvas');
    cv.width = t;
    cv.height = t;
    const g = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));

    for (const [cluster, ids] of Object.entries(clusters)) {
      for (const id of /** @type {string[]} */ (ids)) {
        const img = new Image();
        img.src = `/assets/art/banco/${cluster}/${id}.svg`;
        await img.decode();
        g.clearRect(0, 0, t, t);
        g.drawImage(img, 0, 0, t, t);
        const d = g.getImageData(0, 0, t, t).data;
        const a = new Uint8Array(t * t);
        for (let i = 0; i < t * t; i++) a[i] = /** @type {number} */ (d[i * 4 + 3]);
        siluetas[`${cluster}/${id}`] = a;
      }
    }

    /** @param {Uint8Array} A @param {Uint8Array} B */
    const dist = (A, B) => {
      let s = 0;
      for (let k = 0; k < A.length; k++) {
        s += Math.abs(/** @type {number} */ (A[k]) - /** @type {number} */ (B[k]));
      }
      return s / A.length;
    };

    /** @type {Record<string, { min: number, media: number, par: string }>} */
    const dentro = {};
    /** @type {number[]} */
    const todasDentro = [];

    for (const [cluster, ids] of Object.entries(clusters)) {
      const lista = /** @type {string[]} */ (ids);
      /** @type {number[]} */
      const ds = [];
      let min = Infinity;
      let par = '';
      for (let i = 0; i < lista.length; i++) {
        for (let j = i + 1; j < lista.length; j++) {
          const A = siluetas[`${cluster}/${lista[i]}`];
          const B = siluetas[`${cluster}/${lista[j]}`];
          if (A === undefined || B === undefined) continue;
          const d = dist(A, B);
          ds.push(d);
          if (d < min) {
            min = d;
            par = `${lista[i]} vs ${lista[j]}`;
          }
        }
      }
      const media = ds.reduce((x, y) => x + y, 0) / ds.length;
      dentro[cluster] = { min, media, par };
      todasDentro.push(...ds);
    }

    // Distancia ENTRE clusters: todos los pares de clusters distintos.
    const claves = Object.keys(siluetas);
    /** @type {number[]} */
    const dsEntre = [];
    for (let i = 0; i < claves.length; i++) {
      for (let j = i + 1; j < claves.length; j++) {
        const ci = /** @type {string} */ (claves[i]).split('/')[0];
        const cj = /** @type {string} */ (claves[j]).split('/')[0];
        if (ci === cj) continue;
        const A = siluetas[/** @type {string} */ (claves[i])];
        const B = siluetas[/** @type {string} */ (claves[j])];
        if (A === undefined || B === undefined) continue;
        dsEntre.push(dist(A, B));
      }
    }
    return { dentro, entre: dsEntre.reduce((x, y) => x + y, 0) / dsEntre.length };
  }, { clusters: CLUSTERS, T });
}

test('ningun par de un cluster es el MISMO dibujo', async ({ page }) => {
  const { dentro } = await medir(page);
  for (const [cluster, m] of Object.entries(dentro)) {
    expect(
      m.min,
      `${cluster}: el par mas parecido es '${m.par}' con ${m.min.toFixed(1)} sobre 255 a ${T} px. `
      + 'Dos dibujos identicos hacen que el paciente no pueda acertar, y el fallo no es suyo.',
    ).toBeGreaterThanOrEqual(SUELO);
  }
});

test('dentro de un cluster se parecen MAS que entre clusters', async ({ page }) => {
  // La desigualdad que la biblia de arte pide, medida. Si se invierte, el cluster no es un
  // cluster: la perilla de similitud visual no tendria nada que graduar.
  const { dentro, entre } = await medir(page);
  for (const [cluster, m] of Object.entries(dentro)) {
    expect(
      m.media,
      `${cluster}: distancia media DENTRO ${m.media.toFixed(1)}, ENTRE clusters `
      + `${entre.toFixed(1)}. Dentro tiene que ser menor.`,
    ).toBeLessThan(entre);
  }
});

test('la distinguibilidad medida, publicada', async ({ page }) => {
  // Publicar los numeros para que un cambio en los dibujos se vea, en lugar de solo pasar.
  const { dentro, entre } = await medir(page);
  console.log(`\n  === distinguibilidad a ${T} px (0 = identicos, 255 = maximo) ===`);
  console.log(`  distancia media ENTRE clusters: ${entre.toFixed(1)}`);
  for (const [cluster, m] of Object.entries(dentro)) {
    console.log(`  ${cluster.padEnd(22)} media ${m.media.toFixed(1).padStart(5)}`
      + `  minima ${m.min.toFixed(1).padStart(5)}  (${m.par})`);
  }
  console.log(`  suelo exigido: ${SUELO} — SIN VALIDAR con personas\n`);
  expect(entre).toBeGreaterThan(0);
});
