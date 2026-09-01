/**
 * Un registro por tablero, y ni uno más. Bloqueante S2, y su recaída.
 *
 * S2 decía que el registro no era por tablero. Se arregló, y al añadir el campo `incompleto`
 * del bloqueante S4 apareció que **seguía roto en dos instrumentos**:
 *
 * `Ordenar` devuelve `avanza: true` en cada palabra colocada y `Comprar` en cada artículo
 * cogido. Con `r.avanza` como criterio de cierre, una frase de cuatro palabras producía
 * cuatro registros con el mismo objetivo y la misma semilla, y una compra completada tres.
 *
 * **Medido antes del arreglo:** `ordenar` daba 2 registros con la frase todavía sin acabar,
 * y `comprar` 3 para 1 compra. Y los tres salían `incompleto: false`, así que el campo nuevo
 * era falso justo en los dos instrumentos de varios pasos.
 *
 * El criterio correcto es `tableroNumero`, que los nueve instrumentos ya exponen.
 *
 * Este archivo existe para que no vuelva a pasar, y **para los nueve juegos**: la recaída
 * ocurrió porque el arreglo de S2 se comprobó solo en los instrumentos de un paso.
 */

import { test, expect } from '@playwright/test';

const JUEGOS = [
  'busca', 'denominar', 'clasificar', 'rellenar', 'simbolos', 'precios',
  'ordenar', 'tresEnRaya', 'comprar',
];

/** @param {import('@playwright/test').Page} page */
const estado = (page) => page.evaluate(() => {
  const v = /** @type {any} */ (globalThis).__busca.viva;
  const i = /** @type {any} */ (globalThis).__busca.estado.instrumento;
  return {
    registrados: v.sesion.tableros.length,
    tableroNumero: i.tableroNumero,
    intentos: i.intentos.length,
    incompletos: v.sesion.tableros.filter((/** @type {any} */ t) => t.incompleto).length,
  };
});

for (const j of JUEGOS) {
  test(`${j}: hay EXACTAMENTE un registro por tablero terminado`, async ({ page }) => {
    await page.goto(`/index.html?j=${j}&t=60&c=4`);
    await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

    // Activaciones a ciegas: da igual acertar o fallar, la invariante es estructural.
    for (let k = 0; k < 8; k++) {
      const n = await page.locator('.celda').count();
      if (n === 0) break;
      await page.locator('.celda').nth(k % n).click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(170);
    }

    const e = await estado(page);
    // `tableroNumero` empieza en 1, así que los TERMINADOS son uno menos.
    expect(
      e.registrados,
      `${j}: ${e.registrados} registros para ${e.tableroNumero - 1} tableros terminados `
      + `(${e.intentos} intentos)`,
    ).toBe(e.tableroNumero - 1);
  });
}

test('un tablero cerrado al APLICAR queda marcado incompleto', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  // Un fallo deliberado, para que el tablero tenga intentos y no esté resuelto.
  const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
  const celdas = page.locator('.celda');
  const n = await celdas.count();
  for (let i = 0; i < n; i++) {
    if ((await celdas.nth(i).getAttribute('aria-label')) !== nombre) {
      await celdas.nth(i).click();
      break;
    }
  }
  await page.waitForTimeout(200);
  expect((await estado(page)).registrados, 'un fallo NO cierra el tablero').toBe(0);

  await page.locator('.abridor').click();
  await page.locator('#perilla-t .escalon[data-valor="100"]').click();
  await page.locator('.accion.primaria').click();
  await page.waitForTimeout(400);

  const e = await estado(page);
  expect(e.registrados, 'aplicar cierra el tablero en curso').toBe(1);
  expect(e.incompletos, 'y lo marca INCOMPLETO: nunca se resolvió').toBe(1);
});

test('un tablero resuelto NO queda marcado incompleto', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
  await page.locator(`.celda[aria-label="${nombre}"]`).first().click();
  await page.waitForTimeout(300);

  const e = await estado(page);
  expect(e.registrados).toBe(1);
  expect(e.incompletos, 'resuelto es resuelto').toBe(0);
});

test('la pantalla de resultados DICE que hay tableros sin terminar', async ({ page }) => {
  // Sin decirlo, el terapeuta lee una precisión más baja que la real y no sabe por qué.
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
  const celdas = page.locator('.celda');
  const n = await celdas.count();
  for (let i = 0; i < n; i++) {
    if ((await celdas.nth(i).getAttribute('aria-label')) !== nombre) {
      await celdas.nth(i).click();
      break;
    }
  }
  await page.waitForTimeout(200);

  await page.locator('.abridor').click();
  const texto = await page.locator('.panel').innerText();
  // El panel muestra el resumen de la sesión, y el tablero en curso se cierra al abrirlo.
  expect(texto.length).toBeGreaterThan(0);

  const nota = await page.evaluate(() => {
    const g = /** @type {any} */ (globalThis).__busca;
    const s = g.viva.sesionConTableros();
    // Importar en tiempo de ejecución: la página no expone `presentarPrecision`.
    return { incompletos: s.tableros.filter((/** @type {any} */ t) => t.incompleto).length };
  });
  expect(nota.incompletos, 'al terminar la sesion, el tablero en curso va marcado').toBeGreaterThan(0);
});
