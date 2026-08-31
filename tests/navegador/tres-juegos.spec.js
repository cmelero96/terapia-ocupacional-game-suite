/**
 * Los TRES instrumentos, jugables. Sistemas 10, 21 y 24.
 *
 * Es la definición de "pulida" del colaborador: "que se puedan iniciar múltiples juegos
 * de forma funcional y configurable, sin bugs evidentes".
 */

import { test, expect } from '@playwright/test';

/** @param {string} j @param {Record<string, string|number>} [extra] */
const url = (j, extra = {}) => {
  const p = new URLSearchParams({ j, t: '60', c: '9', sv: '0.25', ss: '0.25' });
  for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
  return `/index.html?${p.toString()}`;
};

test('los tres instrumentos arrancan y se pueden elegir', async ({ page }) => {
  for (const j of ['busca', 'clasificar', 'denominar']) {
    await page.goto(url(j));
    await expect(page.locator('.celda')).toHaveCount(9);
    await expect(page.locator(`.juegos a[aria-current="page"]`)).toHaveCount(1);
    // Y hay tres enlaces, uno por instrumento.
    await expect(page.locator('.juegos a')).toHaveCount(3);
  }
});

test('denominación NO muestra el glifo de referencia; los otros dos SÍ', async ({ page }) => {
  // Si mostrara la imagen, la tarea volvería a ser la de Busca.
  await page.goto(url('denominar'));
  await expect(page.locator('#zona-objetivo .objetivo-glifo')).toHaveCount(0);
  await expect(page.locator('#zona-objetivo .objetivo-nombre')).not.toBeEmpty();

  for (const j of ['busca', 'clasificar']) {
    await page.goto(url(j));
    await expect(page.locator('#zona-objetivo .objetivo-glifo')).toHaveCount(1);
  }
});

test('solo clasificar muestra contenedores, y son activables', async ({ page }) => {
  await page.goto(url('clasificar', { nc: 4 }));
  await expect(page.locator('.contenedor')).toHaveCount(4);
  for (const c of await page.locator('.contenedor').all()) {
    await expect(c).toHaveRole('button');
    const caja = await c.boundingBox();
    // Mismo tamaño mínimo que un objeto: WCAG 2.5.8.
    expect(caja?.height ?? 0).toBeGreaterThanOrEqual(24);
  }
  for (const j of ['busca', 'denominar']) {
    await page.goto(url(j));
    await expect(page.locator('.contenedor')).toHaveCount(0);
  }
});

test('clasificar: la PRIMERA activación selecciona y no registra nada', async ({ page }) => {
  await page.goto(url('clasificar'));
  await page.locator('.celda').first().click();
  await page.waitForTimeout(250);

  await expect(page.locator('.celda[data-seleccionado="si"]')).toHaveCount(1);
  // Un paciente que selecciona y se lo piensa no genera datos.
  expect(await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.instrumento.intentos.length,
  )).toBe(0);
});

test('clasificar: la SEGUNDA activación, sobre un contenedor, registra una vez', async ({ page }) => {
  await page.goto(url('clasificar'));
  await page.locator('.celda').first().click();
  await page.waitForTimeout(250);
  await page.locator('.contenedor').first().click();
  await page.waitForTimeout(250);

  expect(await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.instrumento.intentos.length,
  )).toBe(1);
});

test('clasificar: activar un contenedor SIN selección no hace nada', async ({ page }) => {
  await page.goto(url('clasificar'));
  await page.locator('.contenedor').first().click();
  await page.waitForTimeout(250);
  expect(await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.instrumento.intentos.length,
  )).toBe(0);
});

test('clasificar: el indicador de selección se distingue del foco SIN color', async ({ page }) => {
  await page.goto(url('clasificar'));
  await page.locator('.celda').first().click();
  await page.waitForTimeout(250);

  const [sel, noSel] = await page.locator('.celda').evaluateAll((els) => {
    const s = els.find((e) => e.dataset['seleccionado'] === 'si');
    const n = els.find((e) => e.dataset['seleccionado'] !== 'si');
    const leer = (/** @type {Element|undefined} */ el) => {
      if (el === undefined) return null;
      const c = getComputedStyle(el);
      return { grosor: c.borderTopWidth, radio: c.borderStartStartRadius, transform: c.transform };
    };
    return [leer(s), leer(n)];
  });

  // La diferencia sobrevive en escala de grises: es de forma, no de tono.
  expect(sel).not.toBeNull();
  expect(noSel).not.toBeNull();
  const difiereEnForma =
    sel?.grosor !== noSel?.grosor
    || sel?.radio !== noSel?.radio
    || sel?.transform !== noSel?.transform;
  expect(difiereEnForma).toBe(true);
});

test('EL BLOQUEANTE S2: el registro es POR TABLERO', async ({ page }) => {
  await page.goto(url('busca'));

  for (let ronda = 0; ronda < 3; ronda++) {
    const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
    const n = await page.locator('.celda').count();
    for (let i = 0; i < n; i++) {
      if ((await page.locator('.celda').nth(i).getAttribute('aria-label')) === nombre) {
        await page.locator('.celda').nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(250);
  }

  // Tres tableros resueltos, tres registros. Colapsarlos en uno hacía que
  // `dificultadTolerada` observase un solo nivel y reportase un valor falso.
  const tableros = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.sesionConTableros().tableros.length,
  );
  expect(tableros).toBe(3);
});

test('el instrumento elegido sobrevive a aplicar una configuración', async ({ page }) => {
  await page.goto(url('denominar'));
  await page.locator('.abridor').click();
  await page.locator('#perilla-t').fill('80');
  await page.locator('.accion.primaria').click();
  await expect(page.locator('.abridor')).toBeVisible();

  // Sigue siendo denominación, no vuelve a Busca.
  await expect(page.locator('.juegos a[aria-current="page"]')).toHaveText('Denominación');
  await expect(page.locator('#zona-objetivo .objetivo-glifo')).toHaveCount(0);
});
