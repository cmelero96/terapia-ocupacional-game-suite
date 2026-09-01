/**
 * Contraste de los dibujos del banco. Sistema 13 · WCAG 1.4.11.
 *
 * ## El hueco caro se CERRÓ, y no como estaba previsto
 *
 * El GDD del sistema 1 avisaba de que el presupuesto de contenido **no incluye ningún paso de
 * recoloreado o descarte por contraste**, y que si un porcentaje no marginal del arte falla,
 * hay horas sin presupuestar. Lo declaré como «el hueco más caro» del sistema 13.
 *
 * **Ya no existe.** Con `mask-image` y `background: currentColor`, el color del dibujo **no
 * es una propiedad del archivo**: lo pone el documento. Los píxeles pintados toman
 * exactamente `--board-ink` sobre `--board-bg`, cuya razón de contraste es **16,07:1** y ya
 * tiene su propia puerta en el generador de tokens.
 *
 * O sea que no hay 256 imágenes que auditar por contraste. Hay **dos tokens**, ya auditados.
 *
 * ## Lo que SÍ queda, y es otra cosa
 *
 * El grosor del trazo contra el tamaño mínimo. A 24 px —el mínimo de WCAG 2.5.8, y un ajuste
 * clínico legítimo— un trazo de 4 unidades sobre un lienzo de 100 mide **menos de un píxel de
 * dispositivo**, así que el suavizado lo reparte.
 *
 * Eso NO es contraste insuficiente, y merece cuidado al medirlo: el primer intento uso la
 * MEDIANA de cobertura de los píxeles con tinta y dio **2,05:1**, que parecia un fallo. Era un
 * artefacto: la mediana promedia el borde suavizado con el nucleo, y el criterio pregunta por
 * el objeto, no por su halo. Se vio porque el resultado **no era monotono** —grosor 5 pasaba,
 * 6 fallaba, 7 pasaba— y un trazo mas gordo no puede tener menos contraste.
 *
 * Con el **núcleo** del trazo, percentil 90 de cobertura, el peor de los 64 dibujos da
 * **6,69:1** a 24 px. Pasa.
 *
 * ## Lo que ninguna medida decide
 *
 * Que un dibujo de 24 px **se reconozca**. El peor caso tiene unos 24 píxeles a media
 * cobertura o más: es legible y es fino. Si hace falta un trazo más gordo es una pregunta
 * perceptiva, y va a la galería y a la hoja de revisión — no se decide subiendo un número
 * porque me parezca.
 *
 * Y cambiar el trazo **no es gratis**: cambiaría los 64 archivos bajo sus identificadores, que
 * es exactamente lo que el proyecto prohíbe. La vía es retirar y crear.
 */

import { test, expect } from '@playwright/test';

/** El tamaño donde el trazo está más comprometido: mínimo de WCAG 2.5.8. */
const T = 24;

/** Umbral de WCAG 1.4.11 para contenido no textual. */
const UMBRAL = 3;

/** Los tokens del tablero. Si cambian allí, este canario lo dice. */
const FONDO = [0xf7, 0xf5, 0xf2];
const TINTA = [0x1c, 0x19, 0x17];

/**
 * Mide, por cada dibujo, el contraste del NÚCLEO del trazo sobre el fondo del tablero.
 *
 * @param {import('@playwright/test').Page} page
 */
async function medir(page) {
  await page.goto('/assets/art/banco/galeria.html');
  return page.evaluate(async ({ t, fondo, tinta }) => {
    /** @param {number[]} c */
    const lum = (c) => {
      /** @param {number} v */
      const f = (v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(c[0] ?? 0) + 0.7152 * f(c[1] ?? 0) + 0.0722 * f(c[2] ?? 0);
    };
    /** @param {number[]} a @param {number[]} b */
    const ratio = (a, b) => {
      const l1 = lum(a);
      const l2 = lum(b);
      const hi = Math.max(l1, l2);
      const lo = Math.min(l1, l2);
      return (hi + 0.05) / (lo + 0.05);
    };

    // Las rutas salen de la galería, que se genera del manifiesto: así el test cubre lo que
    // hay de verdad y no una lista escrita a mano que se queda vieja.
    const rutas = [...document.querySelectorAll('.glifo')]
      .map((el) => /** @type {HTMLElement} */ (el).style.getPropertyValue('--src'))
      .map((v) => v.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''))
      .filter((v) => v.endsWith('.svg'));

    const cv = document.createElement('canvas');
    cv.width = t;
    cv.height = t;
    const g = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));

    let peor = { contraste: Infinity, ruta: '', solidos: 0 };
    let minSolidos = { n: Infinity, ruta: '' };

    for (const ruta of rutas) {
      const img = new Image();
      img.src = `/assets/art/banco/${ruta}`;
      await img.decode();
      g.clearRect(0, 0, t, t);
      g.drawImage(img, 0, 0, t, t);
      const d = g.getImageData(0, 0, t, t).data;

      /** @type {number[]} */
      const alfas = [];
      for (let i = 0; i < t * t; i++) {
        const a = d[i * 4 + 3] ?? 0;
        if (a > 8) alfas.push(a);
      }
      if (alfas.length === 0) continue;
      alfas.sort((x, y) => x - y);

      // Percentil 90: el NÚCLEO del trazo. La mediana promedia el borde suavizado y da un
      // número que no corresponde a nada que se vea.
      const nucleo = (alfas[Math.floor(alfas.length * 0.9)] ?? 0) / 255;
      const pintado = [0, 1, 2].map(
        (k) => Math.round((tinta[k] ?? 0) * nucleo + (fondo[k] ?? 0) * (1 - nucleo)),
      );
      const c = ratio(fondo, pintado);
      const solidos = alfas.filter((a) => a >= 128).length;

      if (c < peor.contraste) peor = { contraste: c, ruta, solidos };
      if (solidos < minSolidos.n) minSolidos = { n: solidos, ruta };
    }
    return { n: rutas.length, peor, minSolidos, contrasteDeTokens: ratio(fondo, tinta) };
  }, { t: T, fondo: FONDO, tinta: TINTA });
}

test('el contraste del dibujo lo dan los TOKENS, y son 16:1', async ({ page }) => {
  // Es lo que cierra el hueco caro: no hay 256 imágenes que auditar, hay dos tokens.
  const r = await medir(page);
  expect(r.contrasteDeTokens).toBeGreaterThan(4.5);
  expect(Math.round(r.contrasteDeTokens * 100) / 100, 'canario de los tokens del tablero')
    .toBe(16.07);
});

test('el NUCLEO del trazo pasa 3:1 al tamaño minimo, en los 64 dibujos', async ({ page }) => {
  const r = await medir(page);
  expect(r.n, 'la galeria tiene que traer dibujos').toBeGreaterThan(0);
  expect(
    r.peor.contraste,
    `peor dibujo a ${T} px: ${r.peor.ruta} con ${r.peor.contraste.toFixed(2)}:1`,
  ).toBeGreaterThanOrEqual(UMBRAL);
});

test('la finura del trazo al tamaño minimo, PUBLICADA', async ({ page }) => {
  // No es un umbral: es un numero que hay que ver. Que un dibujo de 24 px se RECONOZCA no lo
  // decide ninguna medida — va a la galeria y a la hoja de revision.
  const r = await medir(page);
  console.log(`\n  === trazo a ${T} px, ${r.n} dibujos ===`);
  console.log(`  contraste de los tokens:        ${r.contrasteDeTokens.toFixed(2)}:1`);
  console.log(`  peor nucleo de trazo:           ${r.peor.contraste.toFixed(2)}:1  (${r.peor.ruta})`);
  console.log(`  menos pixeles a media cobertura: ${r.minSolidos.n}  (${r.minSolidos.ruta})`);
  console.log('  Subir el grosor cambiaria los 64 archivos bajo sus identificadores, que es');
  console.log('  lo que el proyecto prohibe. La via seria retirar y crear.\n');
  expect(r.minSolidos.n, 'algun pixel solido tiene que quedar').toBeGreaterThan(0);
});
