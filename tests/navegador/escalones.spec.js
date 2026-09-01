/**
 * Las cuatro perillas de dificultad, como grupo de escalones. ADR-0006.
 *
 * Dos motivos, y el segundo no estaba en el concepto:
 *
 * 1. **Comparabilidad.** Con un deslizador, la sesión de marzo a 63 px y la de junio a 64 px
 *    no son comparables. Todo el producto existe para medir progreso.
 * 2. **Un deslizador se ARRASTRA.** `technical-preferences.md` prohíbe el arrastre como vía
 *    única, y WCAG 2.2 criterio 2.5.7 exige alternativa. El deslizador era la única parte
 *    del producto que fallaba su propia regla de entrada.
 */

import { test, expect } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
const abrirPanel = async (page) => {
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.locator('.abridor').click();
};

test('las cuatro perillas de dificultad son ESCALONES, no deslizadores', async ({ page }) => {
  await abrirPanel(page);

  for (const p of ['t', 'c', 'sv', 'ss']) {
    const grupo = page.locator(`#perilla-${p}`);
    await expect(grupo, `perilla-${p}`).toHaveAttribute('role', 'radiogroup');
    await expect(grupo.locator('.escalon').first()).toHaveAttribute('role', 'radio');
    // EXACTAMENTE uno elegido: cero deja al terapeuta sin saber a qué juega.
    await expect(grupo.locator('.escalon[aria-checked="true"]')).toHaveCount(1);
    // Y ningún deslizador queda en una perilla de dificultad.
    await expect(grupo.locator('input[type="range"]')).toHaveCount(0);
  }
});

test('un escalon mide 44 px o mas — el minimo AAA de WCAG 2.5.8', async ({ page }) => {
  // El panel es la interfaz del terapeuta, pero tiene que ser operable con las mismas vías
  // que el tablero: un objetivo de 30 px no lo es con pulsador ni con permanencia.
  await abrirPanel(page);
  const botones = page.locator('#perilla-c .escalon');
  const n = await botones.count();
  expect(n, 'debe haber escalones').toBeGreaterThan(1);
  for (let i = 0; i < n; i++) {
    const caja = await botones.nth(i).boundingBox();
    expect(caja?.width ?? 0, `ancho del escalon ${i}`).toBeGreaterThanOrEqual(44);
    expect(caja?.height ?? 0, `alto del escalon ${i}`).toBeGreaterThanOrEqual(44);
  }
});

test('las flechas mueven de escalon, y el grupo es UNA parada de tabulacion', async ({ page }) => {
  await abrirPanel(page);

  const elegido = () => page
    .locator('#perilla-t .escalon[aria-checked="true"]')
    .getAttribute('data-valor');

  await page.locator('#perilla-t .escalon[data-valor="60"]').click();
  expect(await elegido()).toBe('60');

  await page.keyboard.press('ArrowRight');
  expect(await elegido(), 'la flecha derecha sube un escalon').toBe('80');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  expect(await elegido(), 'y la izquierda baja').toBe('44');

  // Solo el elegido es tabulable: el patrón de radiogroup del ARIA APG. Si todos lo fueran,
  // tabular por el panel costaría 33 pulsaciones en lugar de 4.
  expect(
    await page.locator('#perilla-t .escalon[tabindex="0"]').count(),
    'una sola parada de tabulacion en el grupo',
  ).toBe(1);
});

test('la flecha NO se sale por los extremos', async ({ page }) => {
  await abrirPanel(page);
  const elegido = () => page
    .locator('#perilla-t .escalon[aria-checked="true"]')
    .getAttribute('data-valor');

  await page.locator('#perilla-t .escalon[data-valor="24"]').click();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
  expect(await elegido(), 'se queda en el minimo de WCAG 2.5.8').toBe('24');

  await page.locator('#perilla-t .escalon[data-valor="140"]').click();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  expect(await elegido(), 'se queda en el techo de disposicion').toBe('140');
});

test('una configuracion de la URL que no es escalon se AJUSTA al mas cercano', async ({ page }) => {
  // Sin ajustar, el grupo se dibuja sin ninguno elegido y el terapeuta no ve a qué juega.
  await page.goto('/index.html?j=busca&t=63&c=9');
  await page.locator('.abridor').click();
  await expect(page.locator('#perilla-t .escalon[aria-checked="true"]')).toHaveAttribute(
    'data-valor', '60',
  );
});

test('la marca del escalon elegido NO es solo color', async ({ page }) => {
  // Con daltonismo, o en escala de grises, el color solo no distingue. Es la misma regla que
  // prohíbe separar dos clusters por matiz.
  await abrirPanel(page);
  const elegido = page.locator('#perilla-t .escalon[aria-checked="true"]');
  const otro = page.locator('#perilla-t .escalon[aria-checked="false"]').first();

  /** @param {import('@playwright/test').Locator} l */
  const leer = (l) => l.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { peso: cs.fontWeight, borde: cs.borderTopWidth };
  });
  const a = await leer(elegido);
  const b = await leer(otro);
  expect(
    a.peso !== b.peso || a.borde !== b.borde,
    `grosor o peso deben diferir: ${JSON.stringify(a)} contra ${JSON.stringify(b)}`,
  ).toBe(true);
});

test('el escalon elegido se puede ACTIVAR con un solo toque, sin arrastre', async ({ page }) => {
  // La prueba directa de por qué existe este control: un toque, sin `down`/`move`/`up`.
  await abrirPanel(page);
  const caja = await page.locator('#perilla-c .escalon[data-valor="20"]').boundingBox();
  await page.touchscreen.tap((caja?.x ?? 0) + 10, (caja?.y ?? 0) + 10);
  await expect(page.locator('#perilla-c .escalon[aria-checked="true"]')).toHaveAttribute(
    'data-valor', '20',
  );
});
