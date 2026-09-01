/**
 * Los TRES instrumentos, jugables. Sistemas 10, 21 y 24.
 *
 * Es la definición de "pulida" del colaborador: "que se puedan iniciar múltiples juegos
 * de forma funcional y configurable, sin bugs evidentes".
 */

import { test, expect } from '@playwright/test';
import { elegirEscalon } from '../ayudas/panel.js';

/** @param {string} j @param {Record<string, string|number>} [extra] */
const url = (j, extra = {}) => {
  const p = new URLSearchParams({ j, t: '60', c: '9', sv: '0.25', ss: '0.25' });
  for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
  return `/index.html?${p.toString()}`;
};

/** Los siete instrumentos jugables de la lista de Carlos. */
const TODOS = [
  'busca', 'clasificar', 'denominar', 'rellenar', 'ordenar',
  'simbolos', 'precios', 'comprar', 'tresEnRaya',
];

test('los NUEVE instrumentos arrancan y se pueden elegir', async ({ page }) => {
  for (const j of TODOS) {
    await page.goto(url(j));
    // Cada uno pinta celdas activables, sea imagen o texto.
    await expect(page.locator('.celda').first()).toBeVisible();
    await expect(page.locator('.juegos a[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.juegos a')).toHaveCount(TODOS.length);
  }
});

test('los nueve respetan el tamaño mínimo de objetivo de WCAG 2.5.8', async ({ page }) => {
  for (const j of TODOS) {
    await page.goto(url(j, { t: 24 }));
    const cajas = await page.locator('.celda').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height };
      }),
    );
    expect(cajas.length).toBeGreaterThan(0);
    for (const c of cajas) {
      // Las celdas de texto crecen a lo ancho, pero el ALTO es el tamaño de objetivo.
      expect(c.h, `${j}: alto`).toBeGreaterThanOrEqual(24);
      expect(c.w, `${j}: ancho`).toBeGreaterThanOrEqual(24);
    }
  }
});

test('el aviso de caducidad sale SOLO en precio justo', async ({ page }) => {
  await page.goto(url('precios'));
  await expect(page.locator('.aviso-contenido')).toContainText('caducan');
  for (const j of ['busca', 'rellenar', 'simbolos', 'ordenar']) {
    await page.goto(url(j));
    await expect(page.locator('.aviso-contenido')).toHaveCount(0);
  }
});

test('ordenar construye la frase paso a paso y no marca el fallo', async ({ page }) => {
  await page.goto(url('ordenar', { c: 3 }));
  const refInicial = await page.locator('#zona-objetivo').textContent();
  expect(refInicial).toContain('ordena');

  for (let paso = 0; paso < 3; paso++) {
    const correcta = await page.evaluate(
      () => /** @type {any} */ (globalThis).__busca.estado.instrumento.siguientePalabra(),
    );
    const n = await page.locator('.celda').count();
    for (let i = 0; i < n; i++) {
      if ((await page.locator('.celda').nth(i).getAttribute('aria-label')) === correcta) {
        await page.locator('.celda').nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(220);
  }
  // Frase completa: vuelve a empezar con otra.
  await expect(page.locator('#zona-objetivo')).toContainText('ordena');
  expect(await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.instrumento.tableroNumero,
  )).toBe(2);
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
  await elegirEscalon(page, 't', 80);
  await page.locator('.accion.primaria').click();
  await expect(page.locator('.abridor')).toBeVisible();

  // Sigue siendo denominación, no vuelve a Busca.
  await expect(page.locator('.juegos a[aria-current="page"]')).toHaveText('Denominación');
  await expect(page.locator('#zona-objetivo .objetivo-glifo')).toHaveCount(0);
});

// ---------------------------------------------------------------- juegos 1 y 7

test('tres en raya: no se puede colocar sin acertar la operación', async ({ page }) => {
  await page.goto(url('tresEnRaya', { c: 4 }));
  // Las nueve casillas bloqueadas: colocar sin resolver saltaría la tarea entera.
  await expect(page.locator('.casilla:disabled')).toHaveCount(9);

  const correcta = await page.evaluate(
    () => `r:${/** @type {any} */ (globalThis).__busca.estado.instrumento.reto.resultado}`,
  );
  await page.locator(`.celda[data-id="${correcta}"]`).click();
  await page.waitForTimeout(250);
  await expect(page.locator('.casilla:not(:disabled)')).toHaveCount(9);

  await page.locator('.casilla:not(:disabled)').first().click();
  await page.waitForTimeout(250);
  await expect(page.locator('.casilla[data-dueno="paciente"]')).toHaveCount(1);
  // Y la máquina responde.
  await expect(page.locator('.casilla[data-dueno="maquina"]')).toHaveCount(1);
});

test('tres en raya: el resultado de la partida NO llega a la pantalla', async ({ page }) => {
  await page.goto(url('tresEnRaya', { c: 4 }));
  // Jugar hasta cerrar una partida.
  for (let i = 0; i < 40; i++) {
    const cerradas = await page.evaluate(
      () => /** @type {any} */ (globalThis).__busca.estado.instrumento.tableroNumero,
    );
    if (cerradas >= 2) break;
    const puede = await page.evaluate(
      () => /** @type {any} */ (globalThis).__busca.estado.instrumento.puedeColocar,
    );
    if (!puede) {
      const correcta = await page.evaluate(
        () => `r:${/** @type {any} */ (globalThis).__busca.estado.instrumento.reto.resultado}`,
      );
      await page.locator(`.celda[data-id="${correcta}"]`).click();
      await page.waitForTimeout(180);
      continue;
    }
    const libres = page.locator('.casilla:not(:disabled)');
    if (await libres.count() === 0) break;
    await libres.first().click();
    await page.waitForTimeout(180);
  }

  // El registro sabe quién hizo raya; la pantalla del paciente no.
  const texto = (await page.locator('.frame-root').evaluate((el) => {
    const clon = /** @type {HTMLElement} */ (el.cloneNode(true));
    clon.querySelector('.panel')?.remove();
    return clon.textContent ?? '';
  })).toLowerCase();
  for (const palabra of ['ganas', 'pierdes', 'has ganado', 'empate', 'victoria', 'derrota']) {
    expect(texto).not.toContain(palabra);
  }
});

test('comprar: la lista queda visible y un fallo no retira nada', async ({ page }) => {
  await page.goto(url('comprar', { c: 6 }));
  const lista = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.instrumento.compra.lista,
  );
  const fuera = await page.evaluate(
    () => {
      const i = /** @type {any} */ (globalThis).__busca.estado.instrumento;
      return i.compra.lineal.find((/** @type {string} */ id) => !i.compra.lista.includes(id));
    },
  );

  const pendientesAntes = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.instrumento.pendientes().length,
  );

  if (fuera !== undefined) {
    await page.locator(`.celda[data-id="${fuera}"]`).click();
    await page.waitForTimeout(250);
    // El fallo no retira nada de la lista: tachar lo no cogido sería marcar el fallo.
    expect(await page.evaluate(
      () => /** @type {any} */ (globalThis).__busca.estado.instrumento.pendientes().length,
    )).toBe(pendientesAntes);
  }

  // Y coger lo pedido sí lo marca, con un punto.
  await page.locator(`.celda[data-id="${lista[0]}"]`).click();
  await page.waitForTimeout(250);
  await expect(page.locator('#zona-objetivo')).toContainText('•');
});
