/**
 * Reflujo y zoom. WCAG 1.4.10 y 1.4.4, y un hueco que el concepto declaraba abierto:
 *
 * > «Zoom y reflujo de texto (WCAG 1.4.4, 1.4.10, 1.4.12). El perfil incluye baja visión y
 * > ningún documento dice todavía qué pasa al 200 % de texto o al 400 % de zoom.»
 *
 * Un terapeuta con baja visión usa el zoom del navegador. Al 400 % sobre 1280 px, la anchura
 * efectiva es de **320 px CSS**, que es exactamente lo que mide 1.4.10.
 *
 * ## Lo medido
 *
 * | Qué | A 320 px | Al 200 % de texto |
 * |---|---|---|
 * | Tablero del paciente | 320 px justos, sin desbordar | nada recortado |
 * | Panel del terapeuta | **cuerpo de 450 px: desplazamiento en dos direcciones** | nada recortado |
 *
 * El tablero ya cumplía. Era sólo el panel, y la causa eran las filas de etiqueta más mando:
 * una rejilla de `14rem 1fr 5rem` que no cabe en 320 px. Ahora se apilan.
 */

import { test, expect } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
async function arrancar(page) {
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
}

/** Los elementos cuyo contenido no cabe en su caja. */
const desbordados = () => [...document.querySelectorAll('.panel *, .board-root *')]
  .filter((e) => e.scrollWidth > e.clientWidth + 1)
  .map((e) => `${e.tagName}.${String(e.className).slice(0, 24)} ${e.scrollWidth}>${e.clientWidth}`);

test('a 320 px CSS el TABLERO no se desplaza en horizontal', async ({ page }) => {
  // Es el lado del paciente: aquí un desplazamiento horizontal escondería objetos del
  // tablero, y un objeto que no se ve no es un distractor, es un dato perdido.
  await page.setViewportSize({ width: 320, height: 512 });
  await arrancar(page);
  const m = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    cli: document.documentElement.clientWidth,
  }));
  expect(m.doc, `documento de ${m.doc} px en una ventana de ${m.cli}`).toBeLessThanOrEqual(m.cli);
});

test('a 320 px CSS el PANEL no se desplaza en horizontal', async ({ page }) => {
  // El defecto medido: cuerpo de 450 px en una ventana de 320, o sea desplazamiento en las
  // dos direcciones, que es justo lo que 1.4.10 prohíbe.
  await page.setViewportSize({ width: 320, height: 512 });
  await arrancar(page);
  await page.locator('.abridor').click();
  const m = await page.evaluate(() => {
    const c = document.querySelector('.panel-cuerpo');
    const p = document.querySelector('.panel');
    return {
      cuerpoSW: c?.scrollWidth ?? 0, cuerpoCW: c?.clientWidth ?? 0,
      panelSW: p?.scrollWidth ?? 0, panelCW: p?.clientWidth ?? 0,
    };
  });
  expect(m.cuerpoSW, `cuerpo de ${m.cuerpoSW} px en ${m.cuerpoCW}`).toBeLessThanOrEqual(m.cuerpoCW + 1);
  expect(m.panelSW).toBeLessThanOrEqual(m.panelCW + 1);
});

test('a 320 px CSS los mandos del panel siguen siendo alcanzables', async ({ page }) => {
  // Apilar no puede haber dejado un mando fuera del alcance ni por debajo del tamaño mínimo.
  await page.setViewportSize({ width: 320, height: 512 });
  await arrancar(page);
  await page.locator('.abridor').click();

  // El escalón de 100 px de tamaño de objetivo, activado con un solo toque.
  await page.locator('#perilla-t .escalon[data-valor="100"]').scrollIntoViewIfNeeded();
  await page.locator('#perilla-t .escalon[data-valor="100"]').click();
  await expect(page.locator('#perilla-t .escalon[aria-checked="true"]'))
    .toHaveAttribute('data-valor', '100');

  // Y las acciones siguen visibles sin buscarlas: la fila envuelve, no se sale.
  const acc = await page.locator('.acciones').boundingBox();
  expect(acc?.width ?? 999).toBeLessThanOrEqual(321);
  for (const clase of ['.accion.primaria', '.accion.terminar']) {
    const b = await page.locator(clase).boundingBox();
    expect(b?.height ?? 0, `${clase} por debajo de 44 px`).toBeGreaterThanOrEqual(44);
  }
});

test('al 200 % de texto no se recorta nada', async ({ page }) => {
  // 1.4.4. Es zoom de TEXTO, no de página: la caja no crece y el texto sí, que es el caso
  // que rompe una interfaz con alturas fijas.
  await page.setViewportSize({ width: 1024, height: 768 });
  await arrancar(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });

  const tablero = await page.evaluate(desbordados);
  expect(tablero, `recortado en el tablero: ${tablero.join(' | ')}`).toEqual([]);

  await page.locator('.abridor').click();
  const panel = await page.evaluate(desbordados);
  expect(panel, `recortado en el panel: ${panel.join(' | ')}`).toEqual([]);
});

test('al 200 % de texto el tablero sigue siendo jugable', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await arrancar(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
  await page.locator(`.celda[aria-label="${nombre}"]`).first().click();
  await page.waitForTimeout(250);
  const tableros = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.viva.sesion.tableros.length,
  );
  expect(tableros).toBe(1);
});
