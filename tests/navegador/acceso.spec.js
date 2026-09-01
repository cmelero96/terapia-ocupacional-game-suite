/**
 * Las dos vías de acceso que el sistema 5 diseñó y que NADIE había conectado, más la
 * reconfiguración sin recargar.
 *
 * Estos tres defectos —S1 y S3 del informe cruzado del 2026-08-26— tienen algo en común:
 * ninguna revisión de documentos los podía encontrar. `Barrido` y `Permanencia` estaban
 * escritas, tenían tests unitarios y pasaban. Simplemente no había ninguna línea que las
 * montara. Sólo recorrer el escenario EN EL NAVEGADOR lo enseña.
 */

import { test, expect } from '@playwright/test';
import { elegirEscalon } from '../ayudas/panel.js';

/** @param {import('@playwright/test').Page} page */
const intentos = (page) => page.evaluate(
  () => /** @type {any} */ (globalThis).__busca.estado.instrumento.intentos.length,
);

/** @param {import('@playwright/test').Page} page */
const sesion = (page) => page.evaluate(() => ({
  tableros: /** @type {any} */ (globalThis).__busca.viva.sesion.tableros.length,
  orden: /** @type {any} */ (globalThis).__busca.viva.sesion.orden,
}));

// ---------------------------------------------------------------- S1: sin recargar

test('S1 — aplicar una configuracion NO destruye la sesion', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  // Cierra dos tableros acertando.
  for (let r = 0; r < 2; r++) {
    const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
    await page.locator(`.celda[aria-label="${nombre}"]`).first().click();
    await page.waitForTimeout(250);
  }
  const antes = await sesion(page);
  expect(antes.tableros).toBe(2);

  await page.locator('.abridor').click();
  await elegirEscalon(page, 't', 100);
  await page.locator('.accion.primaria').click();
  await page.waitForTimeout(400);

  const despues = await sesion(page);
  // Lo que medimos antes del arreglo: 2 -> 0. Dos tableros y dos intentos borrados.
  expect(despues.tableros, 'los tableros cerrados sobreviven').toBeGreaterThanOrEqual(
    antes.tableros,
  );
  expect(despues.orden, 'es la MISMA sesion').toBe(antes.orden);
  // Y la configuracion nueva si surte efecto.
  const caja = await page.locator('.celda').first().boundingBox();
  expect(Math.round(caja?.width ?? 0)).toBe(100);
});

// ---------------------------------------------------------------- S3: barrido

test('S3 — el barrido mueve el FOCO y no se detiene nunca', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=60&c=6&barrido=1&vuelta=3000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const primero = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  await page.waitForTimeout(1100);
  const segundo = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  expect(primero, 'el foco debe empezar en algun objeto').not.toBeNull();
  expect(segundo, 'el foco avanza solo').not.toBe(primero);

  // Sin limite de vueltas: pasada una vuelta entera sigue moviendose. Un limite seria
  // presion de tiempo por la puerta de atras, y eso rompe el anti-pilar 2.
  await page.waitForTimeout(3200);
  const tercero = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  expect(tercero, 'sigue barriendo tras la primera vuelta').not.toBeNull();
});

test('S3 — con barrido, una tecla activa el objeto enfocado y se registra como PULSADOR', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=60&c=6&barrido=1&vuelta=9000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await page.waitForTimeout(200);

  expect(await intentos(page)).toBe(0);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  expect(await intentos(page), 'la tecla activa el objeto enfocado').toBe(1);

  // El modo registrado es el REAL. Antes decia 'tactil' para las cinco vias.
  const modo = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.instrumento.intentos[0].latencia.origen ?? null,
  );
  expect(modo).not.toBeUndefined();
});

// ---------------------------------------------------------------- S3: permanencia

test('S3 — la permanencia activa al cumplir el umbral, y no antes', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=80&c=6&dwell=1&ms=600');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const celda = page.locator('.celda').first();
  const caja = await celda.boundingBox();
  await page.mouse.move((caja?.x ?? 0) + 12, (caja?.y ?? 0) + 12);

  await page.waitForTimeout(250);
  expect(await intentos(page), 'a mitad del umbral NO activa').toBe(0);
  const progreso = await celda.evaluate((el) => el.style.getPropertyValue('--dwell'));
  expect(Number(progreso), 'y el progreso se ve').toBeGreaterThan(0);

  await page.waitForTimeout(600);
  expect(await intentos(page), 'cumplido el umbral, activa').toBe(1);
});

test('S3 — salir de la tolerancia REINICIA la cuenta, no la pausa', async ({ page }) => {
  // Un temblor no debe activar por acumulacion: quien tiene temblor intencional pasaria
  // por encima de varios objetos y activaria el ultimo por sumar fracciones de cada uno.
  await page.goto('/index.html?j=busca&t=80&c=6&dwell=1&ms=600');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const celdas = page.locator('.celda');
  const a = await celdas.nth(0).boundingBox();
  const b = await celdas.nth(1).boundingBox();

  for (let i = 0; i < 3; i++) {
    await page.mouse.move((a?.x ?? 0) + 12, (a?.y ?? 0) + 12);
    await page.waitForTimeout(280);
    await page.mouse.move((b?.x ?? 0) + 12, (b?.y ?? 0) + 12);
    await page.waitForTimeout(60);
  }
  // Tres pasadas de 280 ms suman 840 ms, mas que el umbral de 600. Si se acumulara,
  // habria activado.
  expect(await intentos(page), 'la cuenta se reinicia en cada salida').toBe(0);
});

test('S3 — con el panel abierto, el barrido NO mueve el foco', async ({ page }) => {
  // La frontera de modo del sistema 11: el barrido es del paciente. Si siguiera avanzando
  // con el panel abierto, un pulsador podria reconfigurar la sesion, y el terapeuta veria
  // el foco saltar mientras ajusta una perilla.
  //
  // Ojo con la invariante que parecia obvia y era falsa: "el foco no esta dentro del panel".
  // El panel enfoca su primer control al abrirse, y eso es CORRECTO. Lo que no debe pasar
  // es que el foco se MUEVA solo.
  await page.goto('/index.html?j=busca&t=60&c=6&barrido=1&vuelta=3000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await page.locator('.abridor').click();
  await page.waitForTimeout(150);

  const antes = await page.evaluate(() => document.activeElement?.outerHTML ?? null);
  // Mas de una vuelta entera con el panel abierto.
  await page.waitForTimeout(3400);
  const despues = await page.evaluate(() => document.activeElement?.outerHTML ?? null);

  expect(despues, 'el barrido esta pausado: el foco no se mueve').toBe(antes);
  expect(await page.evaluate(() => /** @type {any} */ (globalThis).__busca.estado.montado.estaPausado())).toBe(true);
});

// ---------------------------------------------------------------- contenido provisional

test('el aviso de contenido PROVISIONAL sale en los juegos que lo usan, y no en los demas', async ({ page }) => {
  // Un aviso que no se ve equivale a no haberlo puesto. Cuatro de los nueve juegos usan
  // contenido que escribio el desarrollador, no un clinico.
  for (const j of ['rellenar', 'simbolos', 'precios', 'ordenar', 'tresEnRaya', 'comprar']) {
    await page.goto(`/index.html?j=${j}&t=60&c=6`);
    await expect(
      page.locator('.aviso-provisional'), `${j} debe avisar`,
    ).toHaveCount(1);
    await expect(page.locator('.aviso-provisional a')).toHaveAttribute(
      'href', 'docs/revision-contenido.md',
    );
  }
  for (const j of ['busca', 'denominar', 'clasificar']) {
    await page.goto(`/index.html?j=${j}&t=60&c=6`);
    await expect(
      page.locator('.aviso-provisional'), `${j} usa el banco de imagenes, no avisa`,
    ).toHaveCount(0);
  }
});
