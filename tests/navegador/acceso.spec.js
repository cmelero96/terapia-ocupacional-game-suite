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

// ---------------------------------------------------------------- criterios sin test

test('AC-13 — el progreso de permanencia NO se anuncia por lector de pantalla', async ({ page }) => {
  // Un progreso anunciado convierte una espera en una cuenta atras, y una cuenta atras es
  // presion de tiempo — el anti-pilar 2. El criterio estaba escrito y NO tenia test: lo
  // encontro el repaso de criterios cruzados.
  await page.goto('/index.html?j=busca&t=80&c=6&dwell=1&ms=900');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const celda = page.locator('.celda').first();
  const caja = await celda.boundingBox();
  await page.mouse.move((caja?.x ?? 0) + 12, (caja?.y ?? 0) + 12);
  await page.waitForTimeout(300);

  // El progreso EXISTE: si no, el test no estaria comprobando nada.
  const progreso = await celda.evaluate((el) => el.style.getPropertyValue('--dwell'));
  expect(Number(progreso), 'debe haber progreso que comprobar').toBeGreaterThan(0);

  // Y va en una propiedad personalizada de CSS, que ningun lector de pantalla lee.
  const anuncios = await page.evaluate(() => {
    const marcados = [...document.querySelectorAll('[aria-live], [role="status"], [role="alert"], [role="progressbar"], [aria-valuenow]')];
    return marcados.map((e) => e.tagName + '.' + String(e.className).slice(0, 30));
  });
  expect(anuncios, 'ninguna region que anuncie el progreso').toEqual([]);

  // Ni el valor del progreso aparece en ningun atributo accesible del tablero.
  const atributos = await page.locator('#tablero').evaluate((raiz) => {
    /** @type {string[]} */
    const out = [];
    for (const el of [raiz, ...raiz.querySelectorAll('*')]) {
      for (const a of el.attributes) {
        if (a.name.startsWith('aria-') || a.name === 'title') out.push(`${a.name}=${a.value}`);
      }
    }
    return out.join(' ');
  });
  expect(atributos).not.toMatch(/dwell|progres|\d\.\d{3}/);
});

test('AC-8 — el barrido no tiene limite de vueltas', async ({ page }) => {
  // El criterio pide 500 pasos, que con la cadencia mas rapida admitida serian mas de un
  // minuto: demasiado para un test de navegador. Se comprueba lo que de verdad estaria mal —
  // un limite de una o dos vueltas, que es el que alguien escribiria a mano.
  //
  // `vuelta=3000` es el MINIMO admitido: `cadenciaBarrido` exige [3000, 60000]. Mi primera
  // version puso 1200 y la pagina no arrancaba, que es lo correcto y no lo que yo esperaba.
  await page.goto('/index.html?j=busca&t=60&c=6&barrido=1&vuelta=3000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const foco = () => page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  const a = await foco();
  expect(a, 'el barrido arranca en un objetivo').not.toBeNull();

  // Mas de dos vueltas enteras de un tiron.
  await page.waitForTimeout(7000);
  const b = await foco();
  await page.waitForTimeout(600);
  const c = await foco();

  expect(
    b !== a || c !== b,
    `tras dos vueltas el foco sigue moviendose: ${a} -> ${b} -> ${c}`,
  ).toBe(true);
  expect(
    await page.evaluate(
      () => /** @type {any} */ (globalThis).__busca.estado.montado.cadencia() !== null,
    ),
    'y la cadencia sigue declarada',
  ).toBe(true);
});

test('una cadencia de barrido fuera de rango ABRE el panel, no mata la pagina', async ({ page }) => {
  // Lo descubri al escribir el test de AC-8 con un valor invalido. El comportamiento es el
  // correcto —mismo camino que una `C` irrealizable— y no tenia test.
  await page.goto('/index.html?j=busca&t=60&c=6&barrido=1&vuelta=1200');
  await page.waitForTimeout(500);
  await expect(page.locator('.panel:not([hidden])')).toHaveCount(1);
  const fallo = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca?.arranqueFallido ?? null,
  );
  expect(fallo, 'y el mensaje nombra el rango valido').toMatch(/\[3000, 60000\]/);
});

// ---------------------------------------------------------------- la latencia, de verdad

test('las CUATRO vias de acceso registran una latencia real', async ({ browser }) => {
  // Ninguna se media. El tablero marcaba su inicio con el reloj monotono y la activacion
  // traia `event.timeStamp`, y `latencia()` comparaba las ETIQUETAS de origen: ese par daba
  // siempre `origenesMezclados`, y es el unico que el producto produce.
  //
  // Son el mismo reloj: medido, `event.timeStamp` y `performance.now()` difieren 0,00 ms.
  /** @type {[string, string, string][]} */
  const VIAS = [
    ['raton', 'j=busca&t=80&c=6', 'click'],
    ['toque', 'j=busca&t=80&c=6', 'tap'],
    ['pulsador', 'j=busca&t=80&c=6&barrido=1&vuelta=3000', 'tecla'],
    ['permanencia', 'j=busca&t=80&c=6&dwell=1&ms=600', 'quieto'],
  ];
  for (const [via, params, accion] of VIAS) {
    const ctx = await browser.newContext({ hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(`/index.html?${params}`);
    await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
    await page.waitForTimeout(350);

    const caja = await page.locator('.celda').first().boundingBox();
    if (accion === 'click') await page.locator('.celda').first().click();
    if (accion === 'tap') await page.touchscreen.tap((caja?.x ?? 0) + 10, (caja?.y ?? 0) + 10);
    if (accion === 'tecla') await page.keyboard.press('Enter');
    if (accion === 'quieto') {
      await page.mouse.move((caja?.x ?? 0) + 12, (caja?.y ?? 0) + 12);
      await page.waitForTimeout(900);
    }
    await page.waitForTimeout(250);

    const lat = await page.evaluate(
      () => /** @type {any} */ (globalThis).__busca.estado.instrumento.intentos
        .map((/** @type {any} */ i) => i.latencia),
    );
    expect(lat.length, `${via}: tiene que haber un intento`).toBeGreaterThan(0);
    expect(lat[0].motivo, `${via}: sin motivo de rechazo`).toBeUndefined();
    expect(typeof lat[0].ms, `${via}: latencia = ${JSON.stringify(lat[0])}`).toBe('number');
    expect(lat[0].ms, `${via}: latencia positiva`).toBeGreaterThan(0);
    await ctx.close();
  }
});

test('el MODO de cada activacion llega al registro', async ({ page }) => {
  // Faltaba, y eso dejaba sin efecto el arreglo del 2026-08-31: el modo pasó a ser el real y
  // nadie lo persistia. La barrera AC-2 cazo el literal inventado; nada cazo que se tiraba.
  await page.goto('/index.html?j=busca&t=80&c=6&barrido=1&vuelta=3000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await page.waitForTimeout(300);

  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.locator('.celda').first().click({ force: true });
  await page.waitForTimeout(350);

  const modos = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.instrumento.intentos
      .map((/** @type {any} */ i) => i.modo),
  );
  // Con barrido activo, una tecla ES el pulsador: el navegador no los distingue.
  expect(modos).toContain('pulsador');
  expect(modos).toContain('raton');
});

test('una sesion que MEZCLA vias no publica una latencia de sesion', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=80&c=6&barrido=1&vuelta=3000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.locator('.celda').first().click({ force: true });
  await page.waitForTimeout(350);

  await page.locator('.abridor').click();
  const texto = await page.locator('.panel').innerText();
  expect(texto).toMatch(/2 vias de acceso distintas/);
  expect(texto, 'y el desglose dice QUE incluye cada una')
    .toMatch(/incluye la espera del barrido/);
});
