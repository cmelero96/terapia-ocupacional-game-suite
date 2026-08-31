/**
 * Sistema 12 — criterios de navegador de la pantalla de resultados.
 * Cubre AC-1, AC-3, AC-5 y AC-6.
 */

import { test, expect } from '@playwright/test';

/** @param {Record<string, string|number>} [extra] */
const url = (extra = {}) => {
  const p = new URLSearchParams({ t: '60', c: '12', sv: '0.25', ss: '0.25' });
  for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
  return `/index.html?${p.toString()}`;
};

/** Activa `n` celdas cualesquiera y devuelve cuántas fueron aciertos. @param {import('@playwright/test').Page} page @param {number} n */
async function activar(page, n) {
  const celdas = page.locator('.celda');
  for (let i = 0; i < n; i++) {
    const total = await celdas.count();
    if (total === 0) break;
    await celdas.nth(i % total).click();
    await page.waitForTimeout(160);
  }
}

// ---------------------------------------------------------------- AC-1

test('AC-1 — ninguna métrica sin dato se muestra como 0', async ({ page }) => {
  await page.goto(url());
  // Sesión sin ninguna activación.
  await page.locator('.abridor').click();

  const resultados = page.locator('.resultados');
  await expect(resultados).toBeVisible();
  const texto = (await resultados.textContent()) ?? '';

  // Ni un 0 como valor de métrica.
  expect(texto).not.toMatch(/\b0\s*%/);
  expect(texto).not.toMatch(/\b0\s*ms de media/);
  expect(texto).toContain('no llegó a empezar');
});

test('AC-1b — con activaciones pero sin nivel suficiente, sale el MOTIVO y no un 0', async ({ page }) => {
  await page.goto(url());
  await activar(page, 3);
  await page.locator('.abridor').click();

  const sinDato = page.locator('.metrica[data-tiene-dato="no"]');
  await expect(sinDato).not.toHaveCount(0);
  for (const t of await sinDato.locator('.metrica-valor').allTextContents()) {
    expect(t).toContain('Sin dato');
    expect(t).not.toMatch(/^0/);
  }
});

// ---------------------------------------------------------------- AC-3

test('AC-3 — la limitación de escala es ADYACENTE al número', async ({ page }) => {
  await page.goto(url());
  // Diez activaciones sobre el mismo nivel: suficiente para que la métrica exista.
  await activar(page, 10);
  await page.locator('.abridor').click();

  const conDato = page.locator('.metrica[data-tiene-dato="si"]').filter({
    hasText: 'Dificultad tolerada',
  });
  const cuenta = await conDato.count();
  if (cuenta === 0) {
    // Si el azar no dio 5 aciertos en un nivel, la métrica sale sin dato — y eso también
    // es correcto. Lo que se comprueba entonces es que el motivo está presente.
    await expect(
      page.locator('.metrica').filter({ hasText: 'Dificultad tolerada' })
        .locator('.metrica-valor'),
    ).toContainText('Sin dato');
    return;
  }

  // La limitación vive DENTRO del mismo contenedor que el valor.
  await expect(conDato.locator('.metrica-limitacion')).toHaveCount(1);
  const dentro = await conDato.evaluate(
    (el) => el.querySelector('.metrica-limitacion') !== null
      && el.querySelector('.metrica-valor') !== null,
  );
  expect(dentro).toBe(true);

  // Y no está escondida en un `title`, ni colapsada, ni en un pie.
  const lim = conDato.locator('.metrica-limitacion');
  await expect(lim).toBeVisible();
  await expect(lim).toContainText('NO comparable entre pacientes');
});

// ---------------------------------------------------------------- AC-5

test('AC-5 — la latencia lleva siempre sobre cuántas medidas, en el mismo texto', async ({ page }) => {
  await page.goto(url());
  await activar(page, 5);
  await page.locator('.abridor').click();

  const latencia = page.locator('.metrica').filter({ hasText: 'Latencia' })
    .locator('.metrica-valor');
  await expect(latencia).toContainText(/sobre \d+ de \d+ medidas|de \d+ sin medida/);
});

// ---------------------------------------------------------------- AC-6

test('AC-6 — ninguna métrica sin dato aparece atenuada', async ({ page }) => {
  await page.goto(url());
  await activar(page, 4);
  await page.locator('.abridor').click();

  const estilos = await page.locator('.metrica .metrica-valor').evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      const padre = /** @type {HTMLElement} */ (el.parentElement);
      return { dato: padre.dataset['tieneDato'], color: s.color, opacidad: s.opacity };
    }),
  );

  const con = estilos.filter((e) => e.dato === 'si');
  const sin = estilos.filter((e) => e.dato === 'no');
  expect(con.length + sin.length).toBeGreaterThan(0);

  // "No se pudo medir" es información clínica, y a menudo más importante que el número.
  if (con.length > 0 && sin.length > 0) {
    expect(sin[0]?.color).toBe(con[0]?.color);
    expect(sin[0]?.opacidad).toBe(con[0]?.opacidad);
  }
  for (const e of estilos) expect(e.opacidad).toBe('1');
});

// ---------------------------------------------------------------- pilar 2

test('los resultados viven detrás de la frontera: el paciente no los ve', async ({ page }) => {
  await page.goto(url());
  await activar(page, 3);

  // Con el panel cerrado, nada de resultados es visible.
  await expect(page.locator('.resultados')).not.toBeVisible();

  const textoPaciente = await page.locator('.frame-root').evaluate((el) => {
    const clon = /** @type {HTMLElement} */ (el.cloneNode(true));
    clon.querySelector('.panel')?.remove();
    clon.querySelector('.abridor')?.remove();
    return clon.textContent ?? '';
  });
  expect(textoPaciente).not.toContain('Aciertos');
  expect(textoPaciente).not.toContain('Latencia');
  expect(textoPaciente).not.toContain('Dificultad');
});

test('la pantalla de resultados no emite ningún juicio', async ({ page }) => {
  await page.goto(url());
  await activar(page, 6);
  await page.locator('.abridor').click();

  const texto = ((await page.locator('.resultados').textContent()) ?? '').toLowerCase();
  for (const juicio of ['mejora', 'empeora', 'enhorabuena', 'excelente', 'esperado']) {
    expect(texto).not.toContain(juicio);
  }
});
