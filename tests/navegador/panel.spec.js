/**
 * Sistema 11 — criterios de navegador del panel del terapeuta y la frontera de modo.
 * Cubre AC-1, AC-2, AC-3, AC-4, AC-6, AC-7, AC-8, AC-9, AC-10 y AC-11.
 */

import { test, expect } from '@playwright/test';
import { elegirEscalon } from '../ayudas/panel.js';

/** @param {Record<string, string|number>} [extra] */
const url = (extra = {}) => {
  const p = new URLSearchParams({ t: '60', c: '12', sv: '0.25', ss: '0.25' });
  for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
  return `/index.html?${p.toString()}`;
};

// ---------------------------------------------------------------- AC-1, AC-2

test('AC-1 — el panel es opaco y el tablero deja de ser alcanzable', async ({ page }) => {
  await page.goto(url());
  await expect(page.locator('.celda').first()).toBeVisible();

  await page.locator('.abridor').click();
  await expect(page.locator('.panel')).toBeVisible();

  // Ni visible ni alcanzable: si el paciente lo viera, seguiría intentando resolverlo
  // mientras el terapeuta cambia la configuración.
  await expect(page.locator('.celda').first()).not.toBeVisible();

  // Y el fondo del panel es opaco, no una superposición semitransparente.
  const fondo = await page.locator('.panel').evaluate((el) => {
    const s = getComputedStyle(el);
    return { bg: s.backgroundColor, opacidad: s.opacity };
  });
  expect(fondo.opacidad).toBe('1');
  expect(fondo.bg).not.toMatch(/rgba\([^)]*,\s*0?\.\d+\)/);
});

test('AC-2 — la sesión se pausa: con el panel abierto no se registra ningún intento', async ({ page }) => {
  await page.goto(url());
  const antes = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.instrumento.intentos.length,
  );

  await page.locator('.abridor').click();
  expect(await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.montado.estaPausado(),
  )).toBe(true);

  // Se despachan los eventos A MANO, saltándose `visibility` y `pointer-events`: ocultar
  // con CSS no basta, porque los escuchadores siguen conectados y un dispositivo de
  // asistencia que no respete `pointer-events` llegaría a registrarse.
  await page.evaluate(() => {
    const celda = document.querySelector('.celda');
    if (celda === null) return;
    const caja = celda.getBoundingClientRect();
    /** @param {string} tipo */
    const ev = (tipo) => new PointerEvent(tipo, {
      bubbles: true, clientX: caja.x + 5, clientY: caja.y + 5, pointerType: 'mouse',
    });
    celda.dispatchEvent(ev('pointerdown'));
    celda.dispatchEvent(ev('pointerup'));
    celda.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
  });

  const despues = await page.evaluate(
    () => /** @type {any} */ (globalThis).__busca.estado.instrumento.intentos.length,
  );
  expect(despues).toBe(antes);
});

// ---------------------------------------------------------------- AC-3, AC-4

test('AC-3 — aplicar surte efecto en el tablero siguiente, sin diálogo de confirmación', async ({ page }) => {
  await page.goto(url({ t: 60 }));
  await page.locator('.abridor').click();

  await elegirEscalon(page, 't', 100);
  const dialogosAntes = await page.locator('[role="dialog"]').count();

  await page.locator('.accion.primaria').click();
  // Esperar a que el módulo haya montado la página nueva, no solo a `load`.
  await expect(page.locator('.abridor')).toBeVisible();

  // El propio botón de aplicar ES la confirmación: no aparece un segundo diálogo.
  expect(await page.locator('[role="dialog"]').count()).toBe(dialogosAntes);
  await expect(page.locator('.panel')).not.toBeVisible();

  const caja = await page.locator('.celda').first().boundingBox();
  expect(Math.abs((caja?.width ?? 0) - 100)).toBeLessThanOrEqual(1);
});

test('AC-4 — las cuatro perillas están agrupadas por eje', async ({ page }) => {
  await page.goto(url());
  await page.locator('.abridor').click();

  const motor = page.locator('[aria-label="Eje motor"]');
  const perceptivo = page.locator('[aria-label="Eje perceptivo-cognitivo"]');
  await expect(motor).toBeVisible();
  await expect(perceptivo).toBeVisible();

  // `t` en el motor; `C`, `sv` y `ss` en el perceptivo.
  await expect(motor.locator('#perilla-t')).toHaveCount(1);
  await expect(motor.locator('#perilla-c')).toHaveCount(0);
  for (const id of ['#perilla-c', '#perilla-sv', '#perilla-ss']) {
    await expect(perceptivo.locator(id)).toHaveCount(1);
  }
  // Y los dos grupos son elementos distintos con rótulo visible.
  await expect(motor.locator('legend')).toContainText('motor');
  await expect(perceptivo.locator('legend')).toContainText('perceptivo');
});

// ---------------------------------------------------------------- AC-6, AC-7, AC-8

test('AC-6 — una configuración inválida no se puede aplicar, y el mensaje nombra el banco', async ({ page }) => {
  // Con el banco PROVISIONAL de 32 emoji, a propósito. El banco real tiene 64 marcadores, así
  // que `C = 60` ya es realizable: el criterio no ha cambiado, el montaje del test se quedó
  // obsoleto cuando el banco creció. Elegir el banco pequeño de forma explícita es mejor que
  // depender de cuántos elementos tenga el grande hoy.
  await page.goto(url({ banco: 'emoji' }));
  await page.locator('.abridor').click();

  await elegirEscalon(page, 'c', 60);
  await expect(page.locator('.accion.primaria')).toBeDisabled();

  const bloqueo = page.locator('.mensaje[data-bloquea="si"]');
  await expect(bloqueo).toHaveCount(1);
  await expect(bloqueo).toContainText('32 objetos activos');
});

test('con el banco REAL, C = 60 sí es realizable', async ({ page }) => {
  // La otra mitad de AC-6: que el bloqueo dependa del banco y no sea un límite fijo.
  await page.goto(url());
  await page.locator('.abridor').click();
  await elegirEscalon(page, 'c', 60);
  await expect(page.locator('.accion.primaria')).toBeEnabled();
  await expect(page.locator('.mensaje[data-bloquea="si"]')).toHaveCount(0);
});

test('AC-7 — el aviso de t < 44 aparece y NO bloquea', async ({ page }) => {
  await page.goto(url({ t: 32 }));
  await page.locator('.abridor').click();

  const avisos = page.locator('.mensaje[data-bloquea="no"]');
  await expect(avisos.filter({ hasText: 'no se pueden separar' })).toHaveCount(1);
  // El terapeuta manda: hay casos en que entrenar precisión fina es el objetivo.
  await expect(page.locator('.accion.primaria')).toBeEnabled();
});

test('AC-8 — los mensajes dicen CON PALABRAS si impiden continuar', async ({ page }) => {
  await page.goto(url({ t: 32, c: 100, lim: 'B1,B7', banco: 'emoji' }));
  // Con una configuración no realizable el panel se abre SOLO: no hay nada que hacer en la
  // pantalla del paciente hasta corregirla.
  await expect(page.locator('.panel')).toBeVisible();

  const bloqueos = await page.locator('.mensaje[data-bloquea="si"]').allTextContents();
  const avisos = await page.locator('.mensaje[data-bloquea="no"]').allTextContents();
  expect(bloqueos.length).toBeGreaterThan(0);
  expect(avisos.length).toBeGreaterThan(0);

  // La distinción es de palabra, no de tono: un terapeuta con daltonismo tiene que poder
  // distinguirlas leyendo.
  for (const t of bloqueos) expect(t).toContain('No se puede aplicar');
  for (const t of avisos) expect(t).not.toContain('No se puede aplicar');
});

test('el conflicto B1 + B7 avisa antes de que el paciente esté delante', async ({ page }) => {
  await page.goto(url({ t: 44, c: 12, lim: 'B1,B7' }));
  await page.locator('.abridor').click();
  await expect(
    page.locator('.mensaje').filter({ hasText: '60 px o mas y como maximo 30 objetos' }),
  ).toHaveCount(1);
  await expect(page.locator('.accion.primaria')).toBeEnabled();
});

// ---------------------------------------------------------------- AC-9

test('AC-9 — el progreso está en el panel y NO en la pantalla del paciente', async ({ page }) => {
  await page.goto(url());

  // Resolver un tablero: activar el objetivo correcto.
  const nombre = await page.locator('#zona-objetivo .objetivo-nombre').textContent();
  const celdas = page.locator('.celda');
  const n = await celdas.count();
  for (let i = 0; i < n; i++) {
    if ((await celdas.nth(i).getAttribute('aria-label')) === nombre) {
      await celdas.nth(i).click();
      break;
    }
  }
  await page.waitForTimeout(200);

  // Ningún contador fuera del panel.
  const textoPaciente = await page.locator('.frame-root').evaluate((el) => {
    const panel = el.querySelector('.panel');
    const clon = /** @type {HTMLElement} */ (el.cloneNode(true));
    clon.querySelector('.panel')?.remove();
    clon.querySelector('.abridor')?.remove();
    return { texto: clon.textContent ?? '', teniaPanel: panel !== null };
  });
  expect(textoPaciente.teniaPanel).toBe(true);
  expect(textoPaciente.texto).not.toMatch(/\b\d+\s*\/\s*\d+\b/);
  expect(textoPaciente.texto.toLowerCase()).not.toContain('tablero');

  // Y en el panel sí.
  await page.locator('.abridor').click();
  await expect(page.locator('.progreso')).toContainText('activaciones correctas');
});

// ---------------------------------------------------------------- AC-10

test('AC-10 — treinta segundos: el coste del SOFTWARE, medido', async ({ page }) => {
  await page.goto(url());

  const t0 = Date.now();
  await page.locator('.abridor').click();
  await elegirEscalon(page, 't', 100);
  await elegirEscalon(page, 'c', 20);
  await elegirEscalon(page, 'sv', 0.5);
  await elegirEscalon(page, 'ss', 0.25);
  await page.locator('.accion.primaria').click();
  await expect(page.locator('.celda')).toHaveCount(20);
  const ms = Date.now() - t0;

  console.log('\n  === pilar 1: coste del software ===');
  console.log(`  abrir + 4 perillas + aplicar + tablero nuevo: ${ms} ms`);
  console.log('  Es el coste del SOFTWARE, sin tiempo de decisión humana.');
  console.log('  Los 30 s del pilar 1 son para una PERSONA, y eso se mide con el');
  console.log('  colaborador y un cronómetro: este número no puede sustituirlo.\n');

  // Cota generosa: si el software solo se come 3 de los 30 s, quedan 27 para la persona.
  expect(ms).toBeLessThan(3000);
});

// ---------------------------------------------------------------- AC-11

test('AC-11 — el interruptor de estímulo reducido no se puede apagar si el sistema lo pide', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url());
  await page.locator('.abridor').click();

  const chk = page.locator('#perilla-reducido');
  await expect(chk).toBeChecked();
  await expect(chk).toBeDisabled();
  // Y con una explicación visible: un control que parece apagado y no lo está es peor que
  // no tenerlo.
  await expect(
    page.locator('.mensaje').filter({ hasText: 'no se puede apagar' }),
  ).toHaveCount(1);
});

test('el interruptor de silencio está deshabilitado con nota, no oculto', async ({ page }) => {
  await page.goto(url());
  await page.locator('.abridor').click();
  const chk = page.locator('#perilla-silencio');
  // Ocultarlo haría que su reaparición futura pareciera una función nueva en lugar de una
  // reserva cumplida.
  await expect(chk).toBeVisible();
  await expect(chk).toBeDisabled();
  await expect(chk).toBeChecked();
  await expect(page.locator('label[for="perilla-silencio"]')).toContainText('no hay audio');
});

// ---------------------------------------------------------------- cerrar sin aplicar

test('cerrar sin aplicar no cambia nada', async ({ page }) => {
  await page.goto(url({ t: 60 }));
  await page.locator('.abridor').click();
  await elegirEscalon(page, 't', 140);
  await page.locator('.accion', { hasText: 'Cerrar sin cambios' }).click();

  await expect(page.locator('.panel')).not.toBeVisible();
  const caja = await page.locator('.celda').first().boundingBox();
  expect(Math.abs((caja?.width ?? 0) - 60)).toBeLessThanOrEqual(1);
});

test('un panel oculto no intercepta la página', async ({ page }) => {
  // Regresión: `display: grid` en `.panel` sobrescribía el `display: none` de `hidden`,
  // porque una clase gana a un selector de atributo. El panel oculto cubría e interceptaba
  // toda la página, y la aplicación era inusable.
  await page.goto(url());
  const display = await page.locator('.panel').evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe('none');
  // Y una celda del tablero se puede activar de verdad.
  await page.locator('.celda').first().click();
  expect(
    await page.evaluate(
      () => /** @type {any} */ (globalThis).__busca.estado.instrumento.intentos.length,
    ),
  ).toBe(1);
});
