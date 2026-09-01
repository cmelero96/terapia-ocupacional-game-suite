/**
 * Cómo se pinta un dibujo del banco. Sistema 13 · ADR-0005.
 *
 * ## Los dos hallazgos que este archivo blinda, los dos MEDIDOS
 *
 * Con el color del documento en `#e11d48` (225,29,72):
 *
 * | Técnica | `forced-colors: none` | forzados, claro | forzados, oscuro |
 * |---|---|---|---|
 * | `<img src>` + `currentColor` | trazo **negro** | negro | negro |
 * | `mask-image` + `background: currentColor` | **225,29,72** ✓ | **INVISIBLE** | **INVISIBLE** |
 * | + `background: CanvasText` en forzados | ✓ | negro ✓ | blanco ✓ |
 *
 * **1 · `<img>` no ve `currentColor`.** Un SVG externo no hereda el color del documento. La
 * biblia de arte afirmaba lo contrario —*«un SVG en línea, o referenciado con `<img>` y
 * `currentColor`, responde al modo de colores forzados»*— y estaba equivocada en la mitad de
 * `<img>`.
 *
 * **2 · `mask-image` a secas DESAPARECE con colores forzados.** El navegador fuerza
 * `background-color` a `Canvas`, así que el dibujo se vuelve invisible **justo para la
 * población de baja visión que eligió activamente el alto contraste**. Eso es lo contrario de
 * lo que ADR-0005 buscaba al elegir DOM sobre canvas.
 *
 * El segundo es el importante: sin este archivo, el defecto vuelve la primera vez que alguien
 * "simplifique" el CSS del dibujo.
 */

import { test, expect } from '@playwright/test';

/**
 * El color del trazo más distinto del fondo, dentro de una celda.
 *
 * Se mide con el navegador como decodificador: captura, `drawImage` a un canvas, y lectura de
 * píxeles. Es la técnica que el proyecto ya declaró para Playwright.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ fondo: string, trazo: string, dif: number }>}
 */
async function colorDelTrazo(page) {
  const caja = await page.locator('.celda').first().boundingBox();
  const png = await page.screenshot({
    clip: {
      x: Math.floor(caja?.x ?? 0), y: Math.floor(caja?.y ?? 0),
      width: Math.ceil(caja?.width ?? 10), height: Math.ceil(caja?.height ?? 10),
    },
  });
  const url = `data:image/png;base64,${png.toString('base64')}`;
  return page.evaluate(async (u) => {
    const img = new Image();
    img.src = u;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    g.drawImage(img, 0, 0);
    /** @param {number} x @param {number} y */
    const px = (x, y) => {
      const d = g.getImageData(x, y, 1, 1).data;
      return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0];
    };
    // El fondo de la celda: cerca del borde interior, donde no hay ni borde ni dibujo.
    const fondo = px(Math.round(img.width * 0.12), Math.round(img.height * 0.5));
    const f0 = fondo[0] ?? 0;
    const f1 = fondo[1] ?? 0;
    const f2 = fondo[2] ?? 0;
    let mejor = { d: -1, color: fondo };
    for (let y = Math.round(img.height * 0.2); y < img.height * 0.8; y++) {
      for (let x = Math.round(img.width * 0.2); x < img.width * 0.8; x++) {
        const v = px(x, y);
        const d = Math.abs((v[0] ?? 0) - f0) + Math.abs((v[1] ?? 0) - f1) + Math.abs((v[2] ?? 0) - f2);
        if (d > mejor.d) mejor = { d, color: v };
      }
    }
    return { fondo: fondo.join(','), trazo: mejor.color.join(','), dif: mejor.d };
  }, url);
}

const URL_TABLERO = '/index.html?j=busca&t=100&c=9&sv=0&ss=0';

test('el dibujo del banco se pinta con mask-image, no con <img>', async ({ page }) => {
  await page.goto(URL_TABLERO);
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  // Ningún `<img>` en el tablero: con `<img>` el trazo ignoraría los tokens del proyecto.
  await expect(page.locator('#tablero img')).toHaveCount(0);

  const primera = page.locator('.celda span').first();
  await expect(primera).toHaveClass(/dibujo/);
  const src = await primera.evaluate((el) => el.style.getPropertyValue('--src'));
  expect(src, 'la ruta se compone en el enlace con el DOM, no en el instrumento')
    .toMatch(/assets\/art\/banco\/.+\.svg/);
});

test('el nombre accesible sale del manifiesto, NUNCA de la ruta', async ({ page }) => {
  await page.goto(URL_TABLERO);
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const etiquetas = await page.locator('.celda').evaluateAll(
    (els) => els.map((e) => e.getAttribute('aria-label') ?? ''),
  );
  expect(etiquetas.length).toBeGreaterThan(0);
  for (const t of etiquetas) {
    expect(t.length, 'toda celda tiene nombre').toBeGreaterThan(0);
    expect(t, 'el nombre no es una ruta').not.toMatch(/\.svg|\//);
  }
  // Y el `span` del dibujo está oculto al lector: el nombre ya lo da el botón.
  await expect(page.locator('.celda span').first()).toHaveAttribute('aria-hidden', 'true');
});

test('el dibujo toma el color del DOCUMENTO', async ({ page }) => {
  await page.goto(URL_TABLERO);
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  // Se fuerza un color imposible de confundir con el negro por omisión de un SVG.
  await page.locator('.board-root').evaluate((el) => {
    /** @type {HTMLElement} */ (el).style.setProperty('--board-ink', 'rgb(225, 29, 72)');
  });
  await page.waitForTimeout(120);

  const { fondo, trazo, dif } = await colorDelTrazo(page);
  expect(dif, `el dibujo debe verse: fondo ${fondo}, trazo ${trazo}`).toBeGreaterThan(60);
  expect(
    trazo,
    `el trazo debe ser el color del documento y no el negro de <img>: fondo ${fondo}`,
  ).toBe('225,29,72');
});

test('con COLORES FORZADOS el dibujo sigue VISIBLE — claro y oscuro', async ({ browser }) => {
  // El hallazgo importante. `mask-image` con `background: currentColor` a secas se vuelve
  // invisible: el navegador fuerza `background-color` a `Canvas`. El arreglo es declarar
  // `background: CanvasText` bajo `@media (forced-colors: active)`.
  for (const esquema of /** @type {const} */ (['light', 'dark'])) {
    const ctx = await browser.newContext({ forcedColors: 'active', colorScheme: esquema });
    const page = await ctx.newPage();
    await page.goto(URL_TABLERO);
    await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
    await page.waitForTimeout(150);

    const { fondo, trazo, dif } = await colorDelTrazo(page);
    expect(
      dif,
      `forced-colors ${esquema}: el dibujo DESAPARECE. fondo ${fondo}, trazo ${trazo}. `
      + 'Es la poblacion de baja vision que eligio alto contraste: es el peor sitio donde '
      + 'perder el estimulo.',
    ).toBeGreaterThan(60);
    await ctx.close();
  }
});

test('el banco de emoji sigue funcionando, y no usa mask-image', async ({ page }) => {
  // Los dos caminos coexisten: el provisional existe para poder medir sin arte, y el andamio
  // que mide el presupuesto de 60 elementos DOM se apoya en el.
  await page.goto('/index.html?j=busca&t=80&c=9&banco=emoji');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const primera = page.locator('.celda span').first();
  await expect(primera).not.toHaveClass(/dibujo/);
  const texto = await primera.textContent();
  expect((texto ?? '').length, 'el emoji se pinta como TEXTO').toBeGreaterThan(0);
});

test('la zona de objetivo pinta el dibujo, y denominacion NO', async ({ page }) => {
  await page.goto(URL_TABLERO);
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await expect(page.locator('#zona-objetivo .dibujo')).toHaveCount(1);

  // Denominación muestra la PALABRA, nunca el dibujo: si mostrara el dibujo, la tarea sería
  // Busca y no acceso léxico.
  await page.goto('/index.html?j=denominar&t=80&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await expect(page.locator('#zona-objetivo .dibujo')).toHaveCount(0);
  await expect(page.locator('#zona-objetivo .objetivo-nombre')).toHaveCount(1);
});
