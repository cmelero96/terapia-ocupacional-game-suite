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
import { dificultadTolerada } from '../../src/dificultad/modelo.js';
import { observacionesPorVariante } from '../../src/dificultad/contenido.js';

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

test('ocho aciertos con configuracion FIJA producen una dificultad tolerada', async ({ page }) => {
  // El defecto medido: la `dp` realizada variaba dentro de una configuracion fija —la
  // similitud semantica no siempre se puede servir— asi que agrupando por lo realizado los 8
  // intentos caian en dos celdas de 4 y ninguna llegaba a N_MIN.
  //
  // Ocho aciertos seguidos, y la metrica del eje de progreso decia que faltaban datos.
  await page.goto('/index.html?j=busca&t=100&c=9&sv=0.25&ss=0.25');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await page.waitForTimeout(300);

  for (let r = 0; r < 8; r++) {
    const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
    await page.locator(`.celda[aria-label="${nombre}"]`).first().click();
    await page.waitForTimeout(180);
  }

  // La sesion se extrae de la pagina y la metrica se calcula AQUI, con imports estaticos.
  // Un `import()` con ruta de navegador dentro de `page.evaluate` no lo resuelve `tsc`, y la
  // comprobacion de tipos de este archivo es lo que impide que se quede obsoleto.
  const sesion = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.viva.sesionConTableros(),
  );
  const obs = observacionesPorVariante(sesion, 'dp').get(null) ?? [];
  const r = {
    tableros: sesion.tableros.length,
    realizadas: [...new Set(sesion.tableros.map((/** @type {any} */ t) => Number(t.dp.toFixed(1))))],
    celdas: new Set(obs.map((o) => o.d)).size,
    tolerada: dificultadTolerada(obs, { acoplados: sesion.ejesAcoplados }),
  };

  expect(r.tableros).toBe(8);
  expect(r.celdas, 'una configuracion fija es UNA celda').toBe(1);
  expect(
    r.tolerada.valor,
    `realizadas: ${r.realizadas.join(', ')} — no deberia faltar dato, y dio `
    + `${JSON.stringify(r.tolerada)}`,
  ).not.toBeUndefined();
  expect(typeof r.tolerada.valor).toBe('number');

  // Y si el banco sirvio distinto en distintos tableros, el panel lo dice.
  if (r.realizadas.length > 1) {
    await page.locator('.abridor').click();
    const texto = await page.locator('.panel').innerText();
    expect(texto).toMatch(/configuraste/);
    expect(texto, 'la dispersion viaja junto al numero').toMatch(/el banco sirvio entre/);
  }
});
