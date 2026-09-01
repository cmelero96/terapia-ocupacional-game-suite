/**
 * El selector de instrumento. Los dos defectos que reporto este archivo, los dos reales.
 *
 * **1 · El barrido robaba el foco de la pagina entera.** Con `barrido=1`, el terapeuta
 * pulsaba Tab doce veces y **no llegaba al boton del panel**: el barrido se lo devolvia al
 * tablero cada 500 ms. Los enlaces seguian funcionando con raton, y con teclado no — Enter
 * caia sobre una celda.
 *
 * Lo grave es lo que implica: activar el barrido es un interruptor del panel, asi que
 * activarlo **dejaba al terapeuta sin via de teclado para volver a apagarlo**.
 *
 * El barrido es del PACIENTE; el marco es del TERAPEUTA. Es la frontera de modo del sistema
 * 11 aplicada al foco, y faltaba.
 *
 * **2 · Cambiar de juego perdia la configuracion aplicada.** Los `href` se construian al
 * cargar la pagina, y desde S1 aplicar ya NO recarga: se aplicaba `t = 100`, se cambiaba de
 * juego y volvia `t = 60`. El terapeuta perdia en silencio lo que acababa de ajustar.
 */

import { test, expect } from '@playwright/test';

/** @type {[string, string][]} */
const JUEGOS = [
  ['busca', 'Busca / Lince'], ['clasificar', 'Clasificar'], ['denominar', 'Denominación'],
  ['rellenar', 'Rellenar palabras'], ['ordenar', 'Ordenar palabras'], ['simbolos', 'Símbolos'],
  ['precios', 'Precio justo'], ['comprar', 'Comprar'], ['tresEnRaya', 'Tres en raya'],
];

for (const [id, etiqueta] of JUEGOS) {
  test(`el enlace de '${etiqueta}' lleva a su juego`, async ({ page }) => {
    await page.goto('/index.html?j=busca&t=60&c=9');
    await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
    await page.locator('.juegos a', { hasText: etiqueta }).first().click();
    await page.waitForTimeout(400);
    expect(new URL(page.url()).searchParams.get('j')).toBe(id);
    await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  });
}

test('con BARRIDO activo, el terapeuta llega al panel por teclado', async ({ page }) => {
  // El defecto 1. Shift+Tab, porque el marco va ANTES del tablero en el orden del documento
  // y el barrido arranca con el foco en una celda.
  await page.goto('/index.html?j=busca&t=60&c=9&barrido=1&vuelta=6000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.abridor')).toBeFocused();

  // Y el foco SE QUEDA. Antes el barrido lo devolvia al tablero en 500 ms.
  await page.waitForTimeout(1600);
  await expect(page.locator('.abridor'), 'el barrido no debe robar el foco del marco')
    .toBeFocused();
});

test('con BARRIDO activo, el terapeuta puede cambiar de juego por teclado', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=60&c=9&barrido=1&vuelta=6000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  // Shift+Tab: abridor, y despues los enlaces en orden inverso.
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  const texto = await page.evaluate(() => document.activeElement?.textContent?.trim());
  expect(texto).toBe('Tres en raya');

  await page.waitForTimeout(1200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  expect(new URL(page.url()).searchParams.get('j'), 'Enter sobre el enlace navega')
    .toBe('tresEnRaya');
});

test('el barrido SIGUE avanzando dentro del tablero', async ({ page }) => {
  // La otra mitad: confinarlo no puede apagarlo.
  await page.goto('/index.html?j=busca&t=60&c=9&barrido=1&vuelta=3000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  const foco = () => page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  const a = await foco();
  await page.waitForTimeout(1000);
  const b = await foco();
  expect(a, 'el barrido arranca en una celda').not.toBeNull();
  expect(b, 'y avanza').not.toBe(a);
});

test('el barrido se REANUDA al volver el foco al tablero', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=60&c=9&barrido=1&vuelta=3000');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.abridor')).toBeFocused();
  await page.waitForTimeout(800);

  // El terapeuta devuelve el foco al tablero.
  await page.locator('.celda').first().focus();
  const a = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  await page.waitForTimeout(900);
  const b = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  expect(b, 'el barrido vuelve a moverse').not.toBe(a);
});

test('cambiar de juego CONSERVA la configuracion aplicada', async ({ page }) => {
  // El defecto 2, medido: se aplicaba t = 100 y al cambiar de juego volvia t = 60.
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  await page.locator('.abridor').click();
  await page.locator('#perilla-t .escalon[data-valor="100"]').click();
  await page.locator('.accion.primaria').click();
  await page.waitForTimeout(400);

  // La URL refleja lo aplicado.
  expect(new URL(page.url()).searchParams.get('t')).toBe('100');
  // Y el enlace del selector se lo lleva.
  const href = await page.locator('.juegos a', { hasText: 'Clasificar' }).getAttribute('href');
  expect(new URL(href ?? '').searchParams.get('t')).toBe('100');

  await page.locator('.juegos a', { hasText: 'Clasificar' }).click();
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  const caja = await page.locator('.celda').first().boundingBox();
  expect(Math.round(caja?.width ?? 0), 'la celda mantiene los 100 px').toBe(100);
});

test('el juego activo se marca con aria-current', async ({ page }) => {
  await page.goto('/index.html?j=comprar&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await expect(page.locator('.juegos a[aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('.juegos a[aria-current="page"]')).toHaveText('Comprar');
});

// ---------------------------------------------------------------- cambio EN EL SITIO

test('cambiar de juego CONSERVA la sesion', async ({ page }) => {
  // El defecto que aparecio al buscar por que los botones podrian no funcionar, y es el
  // mismo que S1 con otra cara: el selector recargaba la pagina, asi que se llevaba por
  // delante el registro. Medido: dos tableros cerrados desaparecian.
  //
  // Y una sesion con VARIOS instrumentos es el caso normal: el terapeuta hace tres
  // ejercicios seguidos con el mismo paciente.
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  for (let r = 0; r < 2; r++) {
    const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
    await page.locator(`.celda[aria-label="${nombre}"]`).first().click();
    await page.waitForTimeout(250);
  }
  const antes = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.viva.sesion.tableros.length,
  );
  expect(antes).toBe(2);

  await page.locator('.juegos a', { hasText: 'Precio justo' }).click();
  await page.waitForTimeout(400);

  const despues = await page.evaluate(() => {
    const s = /** @type {any} */ (globalThis).__busca.viva.sesion;
    return { tableros: s.tableros.length, orden: s.orden };
  });
  expect(despues.tableros, 'los tableros cerrados sobreviven al cambio de juego').toBe(antes);
  expect(despues.orden, 'y es la MISMA sesion').toBe(0);
});

test('cada tablero registrado dice de QUE instrumento es', async ({ page }) => {
  // Sin este campo, una sesion que mezcla instrumentos no es interpretable: la precision
  // seria la media de tareas que no se pueden promediar.
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
  await page.locator(`.celda[aria-label="${nombre}"]`).first().click();
  await page.waitForTimeout(250);

  await page.locator('.juegos a', { hasText: 'Precio justo' }).click();
  await page.waitForTimeout(400);
  await page.locator('.celda').first().click();
  await page.waitForTimeout(300);

  const instrumentos = await page.evaluate(() => {
    const s = /** @type {any} */ (globalThis).__busca.viva.sesionConTableros();
    return s.tableros.map((/** @type {any} */ t) => t.instrumento);
  });
  expect(instrumentos).toContain('busca');
  expect(instrumentos).toContain('precios');
});

test('cambiar de juego NO recarga la pagina', async ({ page }) => {
  // Es lo que hace que la sesion sobreviva, y ademas quita la dependencia de que el
  // navegador resuelva `index.html?j=X` — que es lo que puede fallar al abrir el archivo
  // desde el disco.
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await page.evaluate(() => { /** @type {any} */ (globalThis).__marcaDeCarga = 'viva'; });

  await page.locator('.juegos a', { hasText: 'Comprar' }).click();
  await page.waitForTimeout(400);

  const marca = await page.evaluate(() => /** @type {any} */ (globalThis).__marcaDeCarga);
  expect(marca, 'si hubiera recargado, la marca se habria perdido').toBe('viva');
  expect(new URL(page.url()).searchParams.get('j')).toBe('comprar');
});

test('el aviso de caducidad de los precios NO se queda pegado al cambiar de juego', async ({ page }) => {
  // Otro defecto del cambio en el sitio: los avisos se pintaban una vez al cargar, asi que
  // un aviso que no se rehace es un aviso FALSO.
  await page.goto('/index.html?j=precios&t=60&c=6');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await expect(page.locator('.aviso-contenido')).toHaveCount(1);

  await page.locator('.juegos a', { hasText: 'Busca' }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('.aviso-contenido'), 'Busca no tiene precios').toHaveCount(0);
  await expect(page.locator('.aviso-provisional'), 'ni contenido provisional').toHaveCount(0);

  await page.locator('.juegos a', { hasText: 'Precio justo' }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('.aviso-contenido'), 'y vuelve al volver').toHaveCount(1);
});

test('el boton de ATRAS del navegador tambien cambia sin recargar', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await page.evaluate(() => { /** @type {any} */ (globalThis).__marcaDeCarga = 'viva'; });

  await page.locator('.juegos a', { hasText: 'Comprar' }).click();
  await page.waitForTimeout(300);
  await page.goBack();
  await page.waitForTimeout(400);

  expect(new URL(page.url()).searchParams.get('j')).toBe('busca');
  expect(
    await page.evaluate(() => /** @type {any} */ (globalThis).__marcaDeCarga),
    'atras tampoco recarga, asi que la sesion sigue viva',
  ).toBe('viva');
  expect(await page.evaluate(() => /** @type {any} */ (globalThis).__busca.estado.tipo))
    .toBe('busca');
});

test('un clic con Ctrl NO se intercepta: sigue siendo un enlace de verdad', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  const antes = page.url();
  await page.locator('.juegos a', { hasText: 'Comprar' }).click({ modifiers: ['Control'] });
  await page.waitForTimeout(300);
  expect(page.url(), 'con Ctrl el navegador abre otra pestana y esta no cambia').toBe(antes);
});

test('el aviso de arranque se ve SIN modulos y desaparece con ellos', async ({ page }) => {
  // Una pagina en blanco no dice que hacer. Esto si.
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await expect(page.locator('#aviso-arranque')).toHaveCount(0);

  // Y el texto estatico existe en el HTML servido, para quien lo abra sin poder ejecutarlo.
  const html = await page.evaluate(() => fetch('/index.html').then((r) => r.text()));
  expect(html).toContain('id="aviso-arranque"');
  expect(html).toContain('npm run servir');
});

test('el panel DESGLOSA por ejercicio y no publica un total mezclado', async ({ page }) => {
  // Medido antes del arreglo: 2 de 2 en Busca y 0 de 3 en Precio justo daban un 40 % de
  // sesion, que no le paso al paciente en ninguno de los dos ejercicios.
  await page.goto('/index.html?j=busca&t=100&c=4');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);

  for (let r = 0; r < 2; r++) {
    const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
    await page.locator(`.celda[aria-label="${nombre}"]`).first().click();
    await page.waitForTimeout(250);
  }
  await page.locator('.juegos a', { hasText: 'Precio justo' }).click();
  await page.waitForTimeout(400);
  // Tres FALLOS deliberados. Pulsar por indice no vale: podria acertar, y entonces el
  // recuento cambia y el test mide otra cosa cada vez.
  for (let k = 0; k < 3; k++) {
    const correcta = await page.evaluate(
      () => /** @type {any} */ (globalThis).__busca.estado.instrumento.ronda.correcta,
    );
    const celdas = page.locator('.celda');
    const n = await celdas.count();
    for (let i = 0; i < n; i++) {
      if ((await celdas.nth(i).getAttribute('aria-label')) !== correcta) {
        await celdas.nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(250);
  }

  await page.locator('.abridor').click();
  const texto = await page.locator('.panel').innerText();

  expect(texto, 'la precision de sesion manda al desglose').toMatch(/2 ejercicios distintos/);
  expect(texto, 'y NO publica el 40 % mezclado').not.toMatch(/40 %/);
  expect(texto, 'Busca al 100 %').toMatch(/100 % — 2 de 2/);
  expect(texto, 'Precio justo al 0 %').toMatch(/0 % — 0 de 3/);
});

test('con UN solo ejercicio no hay desglose: seria el mismo numero dos veces', async ({ page }) => {
  await page.goto('/index.html?j=busca&t=100&c=4');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
  await page.locator(`.celda[aria-label="${nombre}"]`).first().click();
  await page.waitForTimeout(300);

  await page.locator('.abridor').click();
  const texto = await page.locator('.panel').innerText();
  expect(texto).toMatch(/100 % — 1 de 1/);
  expect(texto, 'sin desglose').not.toMatch(/ejercicios distintos/);
  expect((texto.match(/100 % — 1 de 1/g) ?? []).length, 'el numero sale UNA vez').toBe(1);
});
