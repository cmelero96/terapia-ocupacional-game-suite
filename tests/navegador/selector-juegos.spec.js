/**
 * El selector de instrumento. Los dos defectos que reporto este archivo, los dos reales.
 *
 * **1 · El barrido robaba el foco de la pagina entera.** Con `barrido=1`, el terapeuta
 * pulsaba Tab doce veces y **no llegaba al boton del panel**: el barrido se lo devolvia al
 * tablero cada 500 ms. Los enlaces seguian funcionando con raton, y con teclado no — Enter
 * caia sobre una celda.
 *
 * Lo grave es lo que implica: activar el barrido es un interruptor del panel, asi que
 * activarlo **dejaba al terapeuta sin via de teclado para volver a apagarlo**.
 *
 * El barrido es del PACIENTE; el marco es del TERAPEUTA. Es la frontera de modo del sistema
 * 11 aplicada al foco, y faltaba.
 *
 * **2 · Cambiar de juego perdia la configuracion aplicada.** Los `href` se construian al
 * cargar la pagina, y desde S1 aplicar ya NO recarga: se aplicaba `t = 100`, se cambiaba de
 * juego y volvia `t = 60`. El terapeuta perdia en silencio lo que acababa de ajustar.
 */

import { test, expect } from '@playwright/test';

/** @type {[string, string][]} */
const JUEGOS = [
  ['busca', 'Busca / Lince'], ['clasificar', 'Clasificar'], ['denominar', 'Denominación'],
  ['rellenar', 'Rellenar palabras'], ['ordenar', 'Ordenar palabras'], ['simbolos', 'Símbolos'],
  ['precios', 'Precio justo'], ['comprar', 'Comprar'], ['tresEnRaya', 'Tres en raya'],
];

for (const [id, etiqueta] of JUEGOS) {
  test(`el enlace de '${etiqueta}' lleva a su juego`, async ({ page }) => {
    await page.goto('/index.html?j=busca&t=60&c=9');
    await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
    await page.locator('.juegos a', { hasText: etiqueta }).first().click();
    await page.waitForTimeout(400);
    expect(new URL(page.url()).searchParams.get('j')).toBe(id);
    await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  });
}

test('con BARRIDO activo, el terapeuta llega al panel por teclado', async ({ page }) => {
  // El defecto 1. Shift+Tab, porque el marco va ANTES del tablero en el orden del documento
  // y el barrido arranca con el foco en una celda.
  await page.goto('/index.html?j=busca&t=60&c=9&barrido=1&vuelta=6000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.abridor')).toBeFocused();

  // Y el foco SE QUEDA. Antes el barrido lo devolvia al tablero en 500 ms.
  await page.waitForTimeout(1600);
  await expect(page.locator('.abridor'), 'el barrido no debe robar el foco del marco')
    .toBeFocused();
});

test('con BARRIDO activo, el terapeuta puede cambiar de juego por teclado', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=60&c=9&barrido=1&vuelta=6000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  // Shift+Tab: abridor, y despues los enlaces en orden inverso.
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  const texto = await page.evaluate(() => document.activeElement?.textContent?.trim());
  expect(texto).toBe('Tres en raya');

  await page.waitForTimeout(1200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  expect(new URL(page.url()).searchParams.get('j'), 'Enter sobre el enlace navega')
    .toBe('tresEnRaya');
});

test('el barrido SIGUE avanzando dentro del tablero', async ({ page }) => {
  // La otra mitad: confinarlo no puede apagarlo.
  await page.goto('/index.html?j=busca&t=60&c=9&barrido=1&vuelta=3000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  const foco = () => page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  const a = await foco();
  await page.waitForTimeout(1000);
  const b = await foco();
  expect(a, 'el barrido arranca en una celda').not.toBeNull();
  expect(b, 'y avanza').not.toBe(a);
});

test('el barrido se REANUDA al volver el foco al tablero', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=60&c=9&barrido=1&vuelta=3000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.abridor')).toBeFocused();
  await page.waitForTimeout(800);

  // El terapeuta devuelve el foco al tablero.
  await page.locator('.celda').first().focus();
  const a = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  await page.waitForTimeout(900);
  const b = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  expect(b, 'el barrido vuelve a moverse').not.toBe(a);
});

test('cambiar de juego CONSERVA la configuracion aplicada', async ({ page }) => {
  // El defecto 2, medido: se aplicaba t = 100 y al cambiar de juego volvia t = 60.
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  await page.locator('.abridor').click();
  await page.locator('#perilla-t .escalon[data-valor="100"]').click();
  await page.locator('.accion.primaria').click();
  await page.waitForTimeout(400);

  // La URL refleja lo aplicado.
  expect(new URL(page.url()).searchParams.get('t')).toBe('100');
  // Y el enlace del selector se lo lleva.
  const href = await page.locator('.juegos a', { hasText: 'Clasificar' }).getAttribute('href');
  expect(new URL(href ?? '').searchParams.get('t')).toBe('100');

  await page.locator('.juegos a', { hasText: 'Clasificar' }).click();
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  const caja = await page.locator('.celda').first().boundingBox();
  expect(Math.round(caja?.width ?? 0), 'la celda mantiene los 100 px').toBe(100);
});

test('el juego activo se marca con aria-current', async ({ page }) => {
  await page.goto('/index.html?j=comprar&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await expect(page.locator('.juegos a[aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('.juegos a[aria-current="page"]')).toHaveText('Comprar');
});
