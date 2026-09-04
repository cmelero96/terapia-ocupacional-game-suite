/**
 * La jornada: pasar al paciente siguiente sin perder lo anterior, y poder sacar los datos.
 *
 * ## El bloqueante, medido
 *
 * Una sesión de 50 tableros salió sana: 10 MB de heap, 0,3 ms de pintado, cero errores. Lo
 * que apareció al mirar el registro fue otra cosa:
 *
 * > El registro guarda hasta 20 sesiones **y nunca podía llegar a dos.** Una sesión se abría
 * > al cargar la página, y punto. Para pasar al paciente siguiente había que recargar, que es
 * > exactamente lo que destruye el registro entero — el bloqueante S1 otra vez, ahora por la
 * > puerta de la jornada.
 *
 * Y no había ninguna forma de sacar los datos: sin persistencia por diseño, todo lo medido
 * vivía dentro del panel y sólo de la sesión en curso.
 *
 * Estas pruebas comprueban el flujo real de una consulta: jugar, terminar, leer el informe,
 * y jugar con el paciente siguiente sin que lo anterior desaparezca.
 */

import { test, expect } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
async function arrancar(page) {
  await page.goto('/index.html?j=busca&t=60&c=9');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
}

/**
 * Resuelve `n` tableros acertando.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} n
 */
async function acertar(page, n) {
  for (let i = 0; i < n; i++) {
    const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
    await page.locator(`.celda[aria-label="${nombre}"]`).first().click();
    await page.waitForTimeout(180);
  }
}

/**
 * Despliega el informe. Va PLEGADO a proposito: dentro estan las sesiones de los pacientes
 * anteriores, y el GDD acepta que un paciente que pulse el boton abra el panel.
 *
 * @param {import('@playwright/test').Page} page
 */
async function verInforme(page) {
  await page.locator('.desplegar-informe').click();
}

/** @param {import('@playwright/test').Page} page */
const jornada = (page) => page.evaluate(() => {
  const v = /** @type {any} */ (globalThis).__busca.viva;
  return v.registro.ordenadas().map((/** @type {any} */ s) => ({
    orden: s.orden,
    tableros: s.tableros.length,
  }));
});

test('terminar la sesion CONSERVA la anterior y abre una vacia', async ({ page }) => {
  await arrancar(page);
  await acertar(page, 3);

  await page.locator('.abridor').click();
  await page.locator('.accion.terminar').click();
  // Dos pasos: la accion no es reversible, asi que el primer toque solo arma el boton.
  await expect(page.locator('.accion.terminar')).toHaveAttribute('data-confirmando', 'si');
  await page.locator('.accion.terminar').click();

  const j = await jornada(page);
  expect(j.length, 'dos sesiones en la jornada').toBe(2);
  expect(j[0]?.tableros, 'la primera conserva sus 3 tableros').toBe(3);
  expect(j[1]?.tableros, 'la nueva empieza vacia').toBe(0);
});

test('el panel se queda ABIERTO con el informe despues de terminar', async ({ page }) => {
  // Cerrarlo aqui esconderia el informe que el terapeuta tiene que copiar, y la sesion
  // terminada solo existe en memoria: no hay segunda oportunidad.
  await arrancar(page);
  await acertar(page, 2);

  await page.locator('.abridor').click();
  await page.locator('.accion.terminar').click();
  await page.locator('.accion.terminar').click();

  await expect(page.locator('.panel')).toBeVisible();
  await expect(page.locator('#informe-jornada')).toBeVisible();
});

test('el informe es de SOLO LECTURA y se puede seleccionar sin arrastrar', async ({ page }) => {
  // El arrastre esta prohibido como via unica en todo el producto (WCAG 2.5.7), y la API del
  // portapapeles no existe con `file://`. Un textarea de solo lectura se selecciona con
  // Ctrl+A desde el teclado.
  await arrancar(page);
  await acertar(page, 2);
  await page.locator('.abridor').click();
  await verInforme(page);

  const area = page.locator('#informe-jornada');
  await expect(area).toHaveAttribute('readonly', '');
  await area.focus();
  await page.keyboard.press('Control+a');
  const seleccionado = await area.evaluate((el) => {
    const t = /** @type {HTMLTextAreaElement} */ (el);
    return t.value.slice(t.selectionStart, t.selectionEnd).length;
  });
  const largo = await area.evaluate((el) => /** @type {HTMLTextAreaElement} */ (el).value.length);
  expect(seleccionado, 'Ctrl+A selecciona el informe entero').toBe(largo);
  expect(largo).toBeGreaterThan(100);
});

test('el informe AVISA de que nada se guarda, y lo dice antes de los datos', async ({ page }) => {
  await arrancar(page);
  await acertar(page, 2);
  await page.locator('.abridor').click();
  await verInforme(page);

  const texto = await page.locator('#informe-jornada')
    .evaluate((el) => /** @type {HTMLTextAreaElement} */ (el).value);
  expect(texto).toMatch(/NO se guarda/);
  expect(texto.indexOf('NO se guarda')).toBeLessThan(texto.indexOf('--- Sesión 1'));

  // Y tambien en la pantalla, no solo dentro del texto copiable.
  await expect(page.locator('.seccion.jornada .mensaje.aviso')).toContainText('NO se guarda');
});

test('el informe incluye la sesion EN CURSO, no solo las terminadas', async ({ page }) => {
  // Un terapeuta que acaba el dia quiere el informe de los tres pacientes, no de los dos
  // primeros.
  await arrancar(page);
  await acertar(page, 3);
  await page.locator('.abridor').click();
  await page.locator('.accion.terminar').click();
  await page.locator('.accion.terminar').click();
  await page.locator('.accion').filter({ hasText: 'Cerrar sin cambios' }).click();

  await acertar(page, 2);
  await page.locator('.abridor').click();
  await verInforme(page);

  const texto = await page.locator('#informe-jornada')
    .evaluate((el) => /** @type {HTMLTextAreaElement} */ (el).value);
  expect(texto).toMatch(/2 sesiones/);
  // Con la HORA: el terapeuta reparte este texto entre historias clinicas distintas, y sin
  // ella «Sesion 2» no se puede atribuir a un paciente.
  expect(texto).toMatch(/--- Sesión 1 · \d\d:\d\d ---/);
  expect(texto).toMatch(/--- Sesión 2 · \d\d:\d\d ---/);
  // La primera tuvo 3 tableros y la segunda 2. Los dos recuentos tienen que estar.
  expect(texto).toMatch(/Tableros terminados: 3/);
  expect(texto).toMatch(/Tableros terminados: 2/);
});

test('la sesion nueva es JUGABLE despues de terminar', async ({ page }) => {
  // El instrumento se desmonta y se monta otro. Si el montaje nuevo quedara muerto, el
  // terapeuta terminaria la sesion y se encontraria un tablero que no responde.
  await arrancar(page);
  await acertar(page, 1);
  await page.locator('.abridor').click();
  await page.locator('.accion.terminar').click();
  await page.locator('.accion.terminar').click();
  await page.locator('.accion').filter({ hasText: 'Cerrar sin cambios' }).click();

  await acertar(page, 2);
  const j = await jornada(page);
  expect(j.length, 'no se abrio una tercera sesion').toBe(2);
  expect(j[1]?.tableros, 'lo jugado despues va a la sesion nueva').toBe(2);
});

test('una confirmacion a medias NO sobrevive al cierre del panel', async ({ page }) => {
  // Si sobreviviera, el terapeuta que vuelve a abrir el panel encontraria el boton armado y
  // terminaria la sesion de un solo toque, sin querer.
  await arrancar(page);
  await acertar(page, 2);

  await page.locator('.abridor').click();
  await page.locator('.accion.terminar').click();
  await expect(page.locator('.accion.terminar')).toHaveAttribute('data-confirmando', 'si');
  await page.keyboard.press('Escape');

  await page.locator('.abridor').click();
  await expect(page.locator('.accion.terminar')).not.toHaveAttribute('data-confirmando', 'si');
  await page.locator('.accion.terminar').click();
  const j = await jornada(page);
  expect(j.length, 'el primer toque tras reabrir solo arma').toBe(1);
});

test('el boton de terminar cumple el tamaño de objetivo del panel', async ({ page }) => {
  await arrancar(page);
  await page.locator('.abridor').click();
  const caja = await page.locator('.accion.terminar').boundingBox();
  expect(caja?.height ?? 0).toBeGreaterThanOrEqual(44);
});

test('terminar CONSERVA la configuracion aplicada en la jornada', async ({ page }) => {
  // Empezar con otro paciente no es reiniciar los ajustes: si volvieran a los de la URL, el
  // terapeuta perderia en silencio todo lo que hubiera ajustado.
  await arrancar(page);
  await page.locator('.abridor').click();
  await page.locator('#perilla-t .escalon[data-valor="100"]').click();
  await page.locator('.accion.primaria').click();
  await page.waitForTimeout(300);

  await page.locator('.abridor').click();
  await page.locator('.accion.terminar').click();
  await page.locator('.accion.terminar').click();

  const t = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.viva.estado.instrumento.t,
  );
  expect(t, 'el tamaño de objetivo aplicado sigue puesto').toBe(100);
  const conf = await page.evaluate(() => /** @type {any} */ (globalThis).__busca.config.t);
  expect(conf, 'y la superficie de depuracion no miente').toBe(100);
});

// -------------------------------------------------- el informe va PLEGADO, y por qué

test('el informe de la jornada NO se ve al abrir el panel', async ({ page }) => {
  // El GDD declara —y acepta— que un paciente que pulse el boton del panel lo abre: «no hay
  // proteccion, y es una decision declarada, no un olvido». Ese riesgo se evaluo cuando el
  // panel mostraba el progreso de LA SESION EN CURSO: los datos del paciente que esta
  // delante.
  //
  // El informe de la jornada cambia la clase de riesgo: dentro estan las sesiones de los
  // pacientes ANTERIORES. Plegarlo no revoca la decision ni esconde el panel tras un gesto.
  await arrancar(page);
  await acertar(page, 2);
  await page.locator('.abridor').click();

  await expect(page.locator('#informe-jornada')).toBeHidden();
  await expect(page.locator('.desplegar-informe')).toHaveAttribute('aria-expanded', 'false');
  // Y el progreso de la sesion EN CURSO sigue a la vista: eso no cambia.
  await expect(page.locator('.seccion.resultados')).toBeVisible();
});

test('un solo toque despliega el informe, y otro lo vuelve a plegar', async ({ page }) => {
  await arrancar(page);
  await acertar(page, 2);
  await page.locator('.abridor').click();

  await verInforme(page);
  await expect(page.locator('#informe-jornada')).toBeVisible();
  await expect(page.locator('.desplegar-informe')).toHaveAttribute('aria-expanded', 'true');

  await page.locator('.desplegar-informe').click();
  await expect(page.locator('#informe-jornada')).toBeHidden();
});

test('al TERMINAR la sesion el informe se despliega solo', async ({ page }) => {
  // Ahi el terapeuta si acaba de pedirlo, y el paciente de esa sesion ya no esta delante.
  await arrancar(page);
  await acertar(page, 2);
  await page.locator('.abridor').click();
  await page.locator('.accion.terminar').click();
  await page.locator('.accion.terminar').click();

  await expect(page.locator('#informe-jornada')).toBeVisible();
  await expect(page.locator('.desplegar-informe')).toHaveAttribute('aria-expanded', 'true');
});

test('el boton del informe DICE cuantas sesiones hay dentro', async ({ page }) => {
  // Sin el recuento, el terapeuta no sabe si desplegarlo delante del paciente es inocuo.
  await arrancar(page);
  await acertar(page, 1);
  await page.locator('.abridor').click();
  await expect(page.locator('.desplegar-informe')).toContainText('esta sesión');

  await page.locator('.accion.terminar').click();
  await page.locator('.accion.terminar').click();
  await expect(page.locator('.desplegar-informe')).toContainText('2 sesiones');
});

test('el boton del informe cumple el tamaño de objetivo', async ({ page }) => {
  await arrancar(page);
  await page.locator('.abridor').click();
  const caja = await page.locator('.desplegar-informe').boundingBox();
  expect(caja?.height ?? 0).toBeGreaterThanOrEqual(44);
});
