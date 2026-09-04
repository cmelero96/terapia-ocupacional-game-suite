/**
 * El panel declara `aria-modal="true"`, y eso hay que CUMPLIRLO.
 *
 * ## El defecto, medido
 *
 * Tabulando desde el panel recién abierto:
 *
 * ```
 * Aplicar | Cerrar | Terminar | BODY | A | A | A | A | A | A | A | A | A | abridor | ...
 * ```
 *
 * **Tres tabulaciones y el foco se iba del panel**, y después recorría los nueve enlaces del
 * selector de ejercicio POR DETRÁS de un panel opaco: foco invisible, y activar uno cambiaba
 * el ejercicio desde debajo de una ventana modal. Diez paradas de nada antes de volver a los
 * mandos, en un flujo que tiene que durar treinta segundos.
 */

import { test, expect } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
async function abrirPanel(page) {
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await page.locator('.abridor').click();
}

/** @param {import('@playwright/test').Page} page */
const foco = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (a === null) return { dentro: false, que: 'nada' };
  return {
    dentro: a.closest('.panel') !== null,
    que: `${a.tagName}.${(a.className || '').slice(0, 30)}`,
  };
});

test('el foco NO se sale del panel al tabular', async ({ page }) => {
  await abrirPanel(page);
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const f = await foco(page);
    expect(f.dentro, `tabulación ${i + 1} salió del panel: ${f.que}`).toBe(true);
  }
});

test('el foco NO se sale hacia atras con Mayus+Tab', async ({ page }) => {
  await abrirPanel(page);
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Shift+Tab');
    const f = await foco(page);
    expect(f.dentro, `Mayús+Tab ${i + 1} salió del panel: ${f.que}`).toBe(true);
  }
});

test('el selector de ejercicio NO es alcanzable con el panel abierto', async ({ page }) => {
  // Activarlo desde detras de un panel opaco cambiaria el ejercicio sin que el terapeuta vea
  // que lo esta cambiando.
  await abrirPanel(page);
  // El atributo va en el NAV, y se hereda: no hace falta marcar cada enlace.
  await expect(page.locator('nav.juegos')).toHaveAttribute('inert', '');
  const enlace = page.locator('.juegos a').first();
  const alcanzable = await enlace.evaluate((el) => {
    el.focus();
    return document.activeElement === el;
  });
  expect(alcanzable, 'un enlace inerte no puede recibir el foco').toBe(false);
});

test('al CERRAR el panel todo vuelve a ser alcanzable', async ({ page }) => {
  // Un aislamiento que no se deshace deja la pagina muerta, que es peor que el defecto.
  await abrirPanel(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('nav.juegos')).not.toHaveAttribute('inert', '');
  const inertes = await page.locator('[inert]').count();
  expect(inertes, 'no queda ni un elemento inerte').toBe(0);
});

test('abrir y cerrar diez veces no deja restos', async ({ page }) => {
  // El aislamiento se acumularia si la lista no se vaciara, y `removeAttribute` sobre un
  // elemento que ya lo tenia puesto por otro motivo lo borraria.
  await abrirPanel(page);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Escape');
    await page.locator('.abridor').click();
  }
  await page.keyboard.press('Escape');
  expect(await page.locator('[inert]').count()).toBe(0);
  await expect(page.locator('.celda').first()).toBeVisible();
});

test('el tablero sigue siendo jugable despues de cerrar el panel', async ({ page }) => {
  await abrirPanel(page);
  await page.keyboard.press('Escape');
  const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
  await page.locator(`.celda[aria-label="${nombre}"]`).first().click();
  await page.waitForTimeout(250);
  const tableros = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.viva.sesion.tableros.length,
  );
  expect(tableros, 'el acierto se registro').toBe(1);
});
