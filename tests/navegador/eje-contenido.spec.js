/**
 * Eje de contenido en el navegador. Sistema 32.
 *
 * `design/gdd/eje-contenido.md`
 */

import { test, expect } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
const registro = (page) => page.evaluate(() => {
  const s = /** @type {any} */ (globalThis).__busca.viva.sesionConTableros();
  return s.tableros.map((/** @type {any} */ t) => ({
    contenido: t.contenido, incompleto: t.incompleto,
  }));
});

test('AC-1 — el control sale SOLO en los instrumentos con variantes', async ({ page }) => {
  // Una lista vacía es el caso normal. Un control vacío o desactivado le diría al terapeuta
  // que hay algo que configurar cuando no lo hay.
  for (const j of ['tresEnRaya']) {
    await page.goto(`/index.html?j=${j}&t=60&c=4`);
    await page.locator('.abridor').click();
    await expect(page.locator('#perilla-contenido')).toHaveCount(1);
    await expect(page.locator('#perilla-contenido .escalon')).toHaveCount(3);
  }
  for (const j of ['busca', 'denominar', 'clasificar', 'rellenar', 'simbolos', 'precios',
    'ordenar', 'comprar']) {
    await page.goto(`/index.html?j=${j}&t=60&c=4`);
    await page.locator('.abridor').click();
    await expect(page.locator('#perilla-contenido'), `${j} no tiene eje`).toHaveCount(0);
  }
});

test('el control muestra la ETIQUETA, nunca el ordinal', async ({ page }) => {
  // Un «3» visible se lee como una puntuación. El ordinal sirve para ordenar y agrupar.
  await page.goto('/index.html?j=tresEnRaya&t=60&c=4');
  await page.locator('.abridor').click();
  const textos = await page.locator('#perilla-contenido .escalon').allTextContents();
  expect(textos).toEqual(['sumar hasta 10', 'sumar y restar hasta 20', 'multiplicar']);
  for (const t of textos) expect(t).not.toMatch(/^\d+$/);
});

test('AC-2 — la variante activa viaja en el tablero registrado', async ({ page }) => {
  await page.goto('/index.html?j=tresEnRaya&t=60&c=4&tarea=multiplicar');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  // El enunciado es de multiplicar, no de sumar.
  const enunciado = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
  expect(enunciado, `enunciado: ${enunciado}`).toMatch(/×/);

  for (let k = 0; k < 4; k++) {
    const n = await page.locator('.celda').count();
    if (n === 0) break;
    await page.locator('.celda').nth(k % n).click().catch(() => {});
    await page.waitForTimeout(160);
  }
  const t = await registro(page);
  expect(t.length).toBeGreaterThan(0);
  for (const x of t) expect(x.contenido).toEqual({ id: 'multiplicar', ordinal: 3 });
});

test('sin `tarea` en la URL se juega a la variante MÁS FÁCIL', async ({ page }) => {
  await page.goto('/index.html?j=tresEnRaya&t=60&c=4');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  const enunciado = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
  expect(enunciado, 'sumar hasta 10, no multiplicar').toMatch(/\+/);
  await expect(page.locator('.abridor')).toBeVisible();
  await page.locator('.abridor').click();
  await expect(page.locator('#perilla-contenido .escalon[aria-checked="true"]'))
    .toHaveAttribute('data-valor', 'sumaHasta10');
});

test('AC-5 — una variante inexistente en la URL abre el panel con el conflicto', async ({ page }) => {
  // Mismo camino que una `C` que el banco no puede servir: la página no muere, y el
  // terapeuta ve qué está mal.
  await page.goto('/index.html?j=tresEnRaya&t=60&c=4&tarea=dividir');
  await page.waitForTimeout(400);
  await expect(page.locator('.panel:not([hidden])')).toHaveCount(1);
  const fallo = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca?.arranqueFallido ?? null,
  );
  expect(fallo, 'y el mensaje nombra las variantes válidas').toMatch(/sumaHasta10/);
});

test('AC-6 — la variante NO aparece en la pantalla del paciente', async ({ page }) => {
  // Un «nivel 3» visible es una etiqueta de capacidad, y eso rompe el pilar 2 igual que
  // marcar un fallo.
  await page.goto('/index.html?j=tresEnRaya&t=60&c=4&tarea=multiplicar');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const tablero = page.locator('#tablero');
  const texto = await tablero.innerText();
  expect(texto).not.toMatch(/multiplicar/i);
  expect(texto).not.toMatch(/nivel/i);
  expect(texto).not.toMatch(/ordinal/i);

  // Tampoco por lector de pantalla: ni en `aria-label`, ni en `title`, ni en `data-*`.
  const atributos = await tablero.evaluate((raiz) => {
    /** @type {string[]} */
    const out = [];
    for (const el of [raiz, ...raiz.querySelectorAll('*')]) {
      for (const a of el.attributes) out.push(`${a.name}=${a.value}`);
    }
    return out.join(' ');
  });
  expect(atributos).not.toMatch(/multiplicar/i);
  expect(atributos.toLowerCase()).not.toContain('ordinal');
});

test('AC-7 — cambiar de variante cierra el tablero en curso marcado incompleto', async ({ page }) => {
  await page.goto('/index.html?j=tresEnRaya&t=60&c=4');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  // Un intento, para que el tablero tenga algo que conservar.
  await page.locator('.celda').first().click();
  await page.waitForTimeout(200);

  await page.locator('.abridor').click();
  await page.locator('#perilla-contenido .escalon[data-valor="multiplicar"]').click();
  await page.locator('.accion.primaria').click();
  await page.waitForTimeout(400);

  const t = await registro(page);
  expect(t.length, 'el tablero en curso se cerró').toBeGreaterThan(0);
  const primero = t[0];
  expect(primero.contenido.id, 'con la variante con la que se JUGÓ, no la nueva')
    .toBe('sumaHasta10');
  expect(primero.incompleto, 'y marcado incompleto').toBe(true);

  // Y el enunciado nuevo ya es de multiplicar.
  const enunciado = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
  expect(enunciado).toMatch(/×/);
});

test('las flechas mueven de variante, sin salirse por los extremos', async ({ page }) => {
  await page.goto('/index.html?j=tresEnRaya&t=60&c=4');
  await page.locator('.abridor').click();
  const elegido = () => page
    .locator('#perilla-contenido .escalon[aria-checked="true"]')
    .getAttribute('data-valor');

  await page.locator('#perilla-contenido .escalon[data-valor="sumaHasta10"]').click();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
  expect(await elegido()).toBe('sumaHasta10');

  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  expect(await elegido()).toBe('multiplicar');
});

test('AC-9 — con dos variantes en la sesion, el panel lo DICE', async ({ page }) => {
  // Sin esto, el terapeuta ve un número calculado sobre una parte de la sesión y cree que
  // es de toda.
  await page.goto('/index.html?j=tresEnRaya&t=60&c=4');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await page.locator('.celda').first().click();
  await page.waitForTimeout(200);

  await page.locator('.abridor').click();
  await page.locator('#perilla-contenido .escalon[data-valor="multiplicar"]').click();
  await page.locator('.accion.primaria').click();
  await page.waitForTimeout(300);
  await page.locator('.celda').first().click();
  await page.waitForTimeout(250);

  await page.locator('.abridor').click();
  const texto = await page.locator('.panel').innerText();
  expect(texto).toMatch(/tareas distintas/);
  expect(texto).toMatch(/no se suman/);
});

// ---------------------------------------------------------------- el eje perceptivo plano

test('el aviso del eje plano llega a los SEIS instrumentos que lo tienen', async ({ page }) => {
  // Se decidia con una lista escrita a mano que nombraba TRES. Medido: `ordenar` y el tres en
  // raya llegan a los mismos 2,1 puntos sobre 100, y `comprar` a 6,3.
  const PLANOS = ['rellenar', 'simbolos', 'precios', 'ordenar', 'comprar', 'tresEnRaya'];
  for (const j of PLANOS) {
    await page.goto(`/index.html?j=${j}&t=60&c=6`);
    await page.locator('.abridor').click();
    const avisos = await page.locator('.mensaje.aviso').allTextContents();
    expect(
      avisos.some((a) => /apenas varia/.test(a)),
      `${j} deberia avisar de que el eje perceptivo no mide progreso`,
    ).toBe(true);
  }
});

test('los tres instrumentos del banco NO reciben ese aviso', async ({ page }) => {
  // Un aviso que sale siempre se convierte en ruido y deja de leerse.
  for (const j of ['busca', 'denominar', 'clasificar']) {
    await page.goto(`/index.html?j=${j}&t=60&c=6`);
    await page.locator('.abridor').click();
    const avisos = await page.locator('.mensaje.aviso').allTextContents();
    expect(
      avisos.some((a) => /apenas varia/.test(a)),
      `${j} NO deberia avisar: llega a 40 puntos solo con la cantidad`,
    ).toBe(false);
  }
});

test('el aviso dice QUE cuenta la C de ese ejercicio y cuanto recorrido hay', async ({ page }) => {
  // «La cantidad» no dice nada: en rellenar son silabas y en comprar articulos de un lineal.
  await page.goto('/index.html?j=comprar&t=60&c=6');
  await page.locator('.abridor').click();
  const aviso = (await page.locator('.mensaje.aviso').allTextContents())
    .find((a) => /apenas varia/.test(a)) ?? '';
  expect(aviso).toMatch(/artículos en el lineal/);
  expect(aviso, 'y el recorrido medido').toMatch(/6\.3 puntos sobre 100/);
});

test('la dificultad registrada usa la C SERVIDA, no la pedida', async ({ page }) => {
  // El defecto grave: pedir C = 60 en precio justo dejaba registrado dp = 40 cuando el
  // paciente vio SEIS opciones, que son dp = 2,1. 37,9 puntos de dificultad inventada, y
  // siempre en la direccion peligrosa.
  await page.goto('/index.html?j=precios&t=60&c=60');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const celdas = await page.locator('.celda').count();
  expect(celdas, 'el paciente ve como mucho 6 opciones').toBeLessThanOrEqual(6);

  await page.locator('.celda').first().click();
  await page.waitForTimeout(300);

  const dps = await page.evaluate(() => {
    const s = /** @type {any} */ (globalThis).__busca.viva.sesionConTableros();
    return s.tableros.map((/** @type {any} */ t) => t.dp);
  });
  expect(dps.length).toBeGreaterThan(0);
  for (const d of dps) {
    expect(d, `dp registrada ${d}: tiene que ser la de 6 opciones, no la de 60`)
      .toBeLessThan(5);
  }
});
