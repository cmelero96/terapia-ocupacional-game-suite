/**
 * Ayudas para manejar el panel en los tests de navegador.
 *
 * Existe porque ADR-0006 cambió las cuatro perillas de dificultad de deslizador a grupo de
 * escalones. Siete tests hacían `.fill('100')` sobre un `<input type="range">`, y con el
 * selector repetido en siete sitios el siguiente cambio del panel rompe siete archivos.
 */

/**
 * Elige un escalón por su valor.
 *
 * **Falla si el valor no es un escalón**, en lugar de no hacer nada en silencio. Un test que
 * pide `t = 63` y sigue adelante sin avisar mide otra configuración de la que cree.
 *
 * @param {import('@playwright/test').Page} page
 * @param {'t' | 'c' | 'sv' | 'ss'} perilla
 * @param {number | string} valor
 */
export async function elegirEscalon(page, perilla, valor) {
  const boton = page.locator(`#perilla-${perilla} .escalon[data-valor="${valor}"]`);
  if ((await boton.count()) === 0) {
    const hay = await page.locator(`#perilla-${perilla} .escalon`).evaluateAll(
      (els) => els.map((e) => e.getAttribute('data-valor')),
    );
    throw new Error(
      `elegirEscalon: '${valor}' no es un escalon de '${perilla}'. Escalones: ${hay.join(', ')}`,
    );
  }
  await boton.click();
}

/**
 * El valor elegido en una perilla, leído del DOM.
 *
 * @param {import('@playwright/test').Page} page
 * @param {'t' | 'c' | 'sv' | 'ss'} perilla
 * @returns {Promise<string | null>}
 */
export async function escalonElegido(page, perilla) {
  return page.locator(`#perilla-${perilla} .escalon[aria-checked="true"]`).getAttribute('data-valor');
}
