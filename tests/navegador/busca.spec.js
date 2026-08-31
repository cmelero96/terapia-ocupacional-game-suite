/**
 * Sistema 10 — criterios que necesitan navegador de verdad.
 *
 * Cubre AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7 y AC-8 de
 * design/gdd/instrumento-busca.md, más AC-3 y AC-4 de los sistemas 6 y 7.
 *
 * Es lo que ADR-0005 compró: sobre un canvas, ninguno de estos criterios sería
 * observable — solo se podría sacar una captura.
 */

import { test, expect } from '@playwright/test';

/** @param {number} t @param {number} c */
const url = (t = 60, c = 12, sv = 0.25, ss = 0.25) =>
  `/index.html?t=${t}&c=${c}&sv=${sv}&ss=${ss}`;

// ---------------------------------------------------------------- AC-1, AC-8

test('AC-1 — un elemento por objeto, con nombre accesible y enfocable', async ({ page }) => {
  await page.goto(url(60, 12));
  const celdas = page.locator('.celda');
  await expect(celdas).toHaveCount(12);

  for (let i = 0; i < 12; i++) {
    const celda = celdas.nth(i);
    await expect(celda).toHaveRole('button');
    const nombre = await celda.getAttribute('aria-label');
    expect(nombre, `celda ${i} sin nombre accesible`).toBeTruthy();
    expect(nombre?.length ?? 0).toBeGreaterThan(0);
  }

  // Todas enfocables por teclado.
  await celdas.first().focus();
  await expect(celdas.first()).toBeFocused();
});

test('AC-8 — ningún elemento activable mide menos de 24 px (WCAG 2.5.8)', async ({ page }) => {
  for (const t of [24, 44, 60, 140]) {
    await page.goto(url(t, 9));
    const cajas = await page.locator('.celda').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height };
      }),
    );
    for (const c of cajas) {
      expect(c.w, `t=${t}: ancho`).toBeGreaterThanOrEqual(24);
      expect(c.h, `t=${t}: alto`).toBeGreaterThanOrEqual(24);
    }
  }
});

// ---------------------------------------------------------------- AC-4, AC-5

test('AC-4 — el tamaño renderizado es el configurado', async ({ page }) => {
  for (const t of [24, 44, 60, 140]) {
    await page.goto(url(t, 9));
    const caja = await page.locator('.celda').first().boundingBox();
    expect(caja, `t=${t}`).not.toBeNull();
    // Tolerancia de 1 px por redondeo de subpixel.
    expect(Math.abs((caja?.width ?? 0) - t), `t=${t}: ancho ${caja?.width}`).toBeLessThanOrEqual(1);
    expect(Math.abs((caja?.height ?? 0) - t), `t=${t}: alto ${caja?.height}`).toBeLessThanOrEqual(1);
  }
});

test('AC-5 — la separación renderizada es separacion(t)', async ({ page }) => {
  /** @type {[number, number][]} */
  const casos = [[24, 8], [60, 10.8], [140, 25.2]];
  for (const [t, esperado] of casos) {
    await page.goto(url(t, 9));
    const gap = await page.locator('.board-root').evaluate((el) =>
      getComputedStyle(el).columnGap,
    );
    const valor = Number.parseFloat(gap);
    expect(Math.abs(valor - esperado), `t=${t}: gap ${gap}`).toBeLessThan(0.5);
  }
});

// ---------------------------------------------------------------- AC-2, AC-3

test('AC-2 — el acuse de recibo es IDÉNTICO para acierto y para fallo', async ({ page }) => {
  // Con movimiento reducido no hay transición, así que la lectura es DETERMINISTA.
  //
  // Sin esto el test medía el reloj de la animación y no el estilo: el borde va de
  // `--board-line` a `--board-ink`, y dos lecturas a distinta altura de la transición dan
  // colores distintos aunque el estado final sea el mismo.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url(60, 12));

  /** Devuelve los estilos del acuse tras activar la celda indicada. */
  const acuseDe = async (/** @type {boolean} */ correcto) => {
    const objetivo = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
    const celdas = page.locator('.celda');
    const n = await celdas.count();
    /** @type {import('@playwright/test').Locator | null} */
    let elegida = null;
    for (let i = 0; i < n; i++) {
      const etiqueta = await celdas.nth(i).getAttribute('aria-label');
      const esObjetivo = etiqueta === objetivo;
      if (esObjetivo === correcto) { elegida = celdas.nth(i); break; }
    }
    expect(elegida, 'no se encontró celda').not.toBeNull();
    const caja = await elegida?.boundingBox();
    await page.mouse.move((caja?.x ?? 0) + 5, (caja?.y ?? 0) + 5);
    await page.mouse.down();
    await page.mouse.up();
    // Se lee el estado del acuse inmediatamente, antes de que la transición lo retire.
    return elegida?.evaluate((el) => ({
      acuse: el.dataset['acuse'] ?? null,
      borde: getComputedStyle(el).borderColor,
      grosor: getComputedStyle(el).borderWidth,
      clases: el.className,
      atributos: [...el.attributes].map((a) => a.name).sort().join(','),
    }));
  };

  const fallo = await acuseDe(false);
  await page.goto(url(60, 12));
  const acierto = await acuseDe(true);

  expect(fallo?.acuse).toBe('si');
  expect(acierto?.acuse).toBe('si');
  expect(fallo?.borde).toBe(acierto?.borde);
  expect(fallo?.grosor).toBe(acierto?.grosor);
  expect(fallo?.clases).toBe(acierto?.clases);
  expect(fallo?.atributos).toBe(acierto?.atributos);
});

test('AC-2b — ninguna regla de CSS puede distinguir un acierto de un fallo', async ({ page }) => {
  await page.goto(url(60, 12));

  // El invariante ESTRUCTURAL, más fuerte que comparar dos estilos: el DOM no lleva la
  // información de si la activación fue correcta, así que ningún selector puede
  // ramificar por ella aunque quiera.
  const reglas = await page.evaluate(() => {
    /** @type {string[]} */
    const salida = [];
    for (const hoja of document.styleSheets) {
      try {
        for (const r of hoja.cssRules) salida.push(r.cssText);
      } catch { /* hoja de otro origen */ }
    }
    return salida;
  });
  const sospechosas = reglas.filter((r) => /correcto|acierto|fallo|error/i.test(r));
  expect(sospechosas).toEqual([]);

  // Y el atributo del acuse no lleva la información tampoco.
  const celda = page.locator('.celda').first();
  const caja = await celda.boundingBox();
  await page.mouse.move((caja?.x ?? 0) + 5, (caja?.y ?? 0) + 5);
  await page.mouse.down();
  await page.mouse.up();
  const atributos = await celda.evaluate(
    (el) => [...el.attributes].map((a) => `${a.name}=${a.value}`),
  );
  for (const a of atributos) {
    expect(a).not.toMatch(/correcto|acierto|fallo/i);
  }
});

test('AC-3 — activar un distractor no produce ningún anuncio', async ({ page }) => {
  await page.goto(url(60, 12));

  const antes = await page.evaluate(() => ({
    live: document.querySelectorAll('[aria-live]').length,
    alert: document.querySelectorAll('[role="alert"], [role="status"]').length,
  }));

  // Activar todas las celdas: al menos 11 son distractores.
  const celdas = page.locator('.celda');
  const n = await celdas.count();
  for (let i = 0; i < n; i++) {
    const caja = await celdas.nth(i).boundingBox();
    if (caja === null) continue;
    await page.mouse.move(caja.x + 5, caja.y + 5);
    await page.mouse.down();
    await page.mouse.up();
  }

  const despues = await page.evaluate(() => ({
    live: document.querySelectorAll('[aria-live]').length,
    alert: document.querySelectorAll('[role="alert"], [role="status"]').length,
  }));

  expect(despues.live).toBe(antes.live);
  expect(despues.alert).toBe(antes.alert);
  expect(despues.alert).toBe(0);
});

// ---------------------------------------------------------------- WCAG 2.5.2

test('la activación ocurre al soltar, y salir del objetivo la aborta', async ({ page }) => {
  await page.goto(url(60, 12));
  const objetivoInicial = await page.locator('#zona-objetivo .objetivo-nombre').textContent();

  const celdas = page.locator('.celda');
  const n = await celdas.count();
  /** @type {{ x: number, y: number } | null} */
  let cajaObjetivo = null;
  for (let i = 0; i < n; i++) {
    if ((await celdas.nth(i).getAttribute('aria-label')) === objetivoInicial) {
      const c = await celdas.nth(i).boundingBox();
      if (c !== null) cajaObjetivo = { x: c.x + c.width / 2, y: c.y + c.height / 2 };
      break;
    }
  }
  expect(cajaObjetivo).not.toBeNull();

  // Pulsar sobre el objetivo correcto, salir muy lejos, y soltar: NO debe avanzar.
  await page.mouse.move(cajaObjetivo?.x ?? 0, cajaObjetivo?.y ?? 0);
  await page.mouse.down();
  await page.mouse.move(10, 10);
  await page.mouse.up();
  await expect(page.locator('#zona-objetivo .objetivo-nombre')).toHaveText(
    objetivoInicial ?? '',
  );
});

// ---------------------------------------------------------------- AC-6, AC-7

test('AC-6 y AC-7 — los presupuestos, MEDIDOS y publicados', async ({ page }) => {
  // `rep=4` repite el banco provisional de 32 para llegar a 100. Es un andamio de
  // medición declarado, no una función de producto: el banco real tendrá 96 elementos.
  await page.goto(`${url(60, 100)}&rep=4`);

  const resolucion = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca?.estado?.resolucion ?? null,
  );

  const render = await page.evaluate(() => {
    const t0 = performance.now();
    /** @type {any} */ (globalThis).__busca?.estado?.montado?.pintar();
    return performance.now() - t0;
  });

  await expect(page.locator('.celda')).toHaveCount(100);

  const caja = await page.locator('.celda').first().boundingBox();
  const t0 = Date.now();
  await page.mouse.move((caja?.x ?? 0) + 5, (caja?.y ?? 0) + 5);
  await page.mouse.down();
  await page.mouse.up();
  await expect(page.locator('.celda').first()).toHaveAttribute('data-acuse', 'si');
  const latencia = Date.now() - t0;

  console.log('\n  === presupuestos medidos ===');
  console.log(`  resolución del reloj monótono: ${resolucion?.resolucionMs} ms ` +
    `(fiable: ${resolucion?.fiableParaPresupuesto})`);
  console.log(`  render de 100 elementos DOM:   ${render.toFixed(2)} ms  (presupuesto 16,6)`);
  console.log(`  latencia hasta el acuse:       ${latencia} ms  (presupuesto 100)`);
  console.log('  Nota: la latencia incluye la ida y vuelta del protocolo de Playwright,');
  console.log('  así que es una COTA SUPERIOR generosa, no la latencia real del gesto.\n');

  // ADR-0005 dejó esto como predicción sin medir. Aquí se mide.
  expect(render, `render de 100 elementos: ${render.toFixed(2)} ms`).toBeLessThan(16.6);
  expect(resolucion?.fiableParaPresupuesto).toBe(true);
});

// ---------------------------------------------------------------- sistemas 6 y 7

test('AC-3/s6 — con movimiento reducido no queda ninguna transición', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url(60, 12));

  const duraciones = await page.locator('.celda').evaluateAll((els) =>
    els.map((el) => ({
      transicion: getComputedStyle(el).transitionDuration,
      animacion: getComputedStyle(el).animationDuration,
    })),
  );
  for (const d of duraciones) {
    expect(d.transicion).toBe('0s');
    expect(d.animacion).toBe('0s');
  }
});

test('AC-4/s6 — el acuse de recibo SIGUE EXISTIENDO con movimiento reducido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url(60, 12));

  const celda = page.locator('.celda').first();
  const antes = await celda.evaluate((el) => getComputedStyle(el).borderWidth);
  const caja = await celda.boundingBox();
  await page.mouse.move((caja?.x ?? 0) + 5, (caja?.y ?? 0) + 5);
  await page.mouse.down();
  await page.mouse.up();

  await expect(celda).toHaveAttribute('data-acuse', 'si');
  const despues = await celda.evaluate((el) => getComputedStyle(el).borderWidth);
  // Hay un cambio visual observable, y no tiene transición.
  expect(despues).not.toBe(antes);
});

// ---------------------------------------------------------------- colores forzados

test('bajo forced-colors el tablero no anula la elección del usuario', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(url(60, 12));

  const ajuste = await page.locator('.board-root').evaluate(
    (el) => getComputedStyle(el).forcedColorAdjust,
  );
  // `forced-color-adjust: none` en el ámbito del tablero es patrón prohibido del proyecto.
  expect(ajuste).not.toBe('none');

  const celdas = await page.locator('.celda').evaluateAll(
    (els) => els.map((el) => getComputedStyle(el).forcedColorAdjust),
  );
  for (const a of celdas) expect(a).not.toBe('none');
});
