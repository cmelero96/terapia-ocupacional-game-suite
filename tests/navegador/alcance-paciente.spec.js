/**
 * Qué puede tocar el paciente. Apartado 2b de la revisión cruzada, declarado SIN CUBRIR.
 *
 * > *«2b contradicciones de regla — **Parcial.** No revisó "qué puede tocar el paciente"»*
 *
 * Un documento no puede responder a esto: la respuesta es la que dé el DOM que se sirve. Se
 * mide, en los nueve instrumentos, y se compara con una lista declarada. Un elemento nuevo
 * que el paciente pueda activar tiene que entrar en la lista a mano, y eso es el punto: obliga
 * a decidirlo en lugar de que aparezca solo.
 *
 * Lo medido el 2026-09-04, y el hallazgo que produjo: el paciente alcanza el botón del panel
 * —declarado y aceptado en el GDD— y dentro del panel estaba el informe con las sesiones de
 * **los pacientes anteriores**. Ver el caso límite del sistema 11.
 */

import { test, expect } from '@playwright/test';

const JUEGOS = [
  'busca', 'denominar', 'clasificar', 'rellenar', 'simbolos', 'precios',
  'ordenar', 'tresEnRaya', 'comprar',
];

/**
 * Lo que el paciente PUEDE activar, y por qué está permitido.
 *
 * `.dibujo`, `.contenedor-etiqueta` y los `<span>` de texto son hijos de una celda: heredan
 * el cursor, y activarlos ES activar la celda. No son un punto de activación aparte.
 */
const PERMITIDO = new Map([
  ['BUTTON.celda', 'el objeto del tablero: la tarea'],
  ['BUTTON.contenedor', 'el destino de Clasificar, activable como cualquier objeto'],
  ['BUTTON.casilla', 'la casilla del tres en raya'],
  ['A.enlace-juego', 'el selector de ejercicio: lo usa el terapeuta'],
  ['BUTTON.abridor', 'el botón del panel. Declarado y ACEPTADO en el GDD del sistema 11'],
  ['SPAN.hijo-de-celda', 'hijo de una celda: activarlo es activar la celda'],
]);

/** @param {import('@playwright/test').Page} page */
const alcanzables = (page) => page.evaluate(() => {
  /** @param {Element} e */
  const clasificar = (e) => {
    if (e.classList.contains('abridor')) return 'BUTTON.abridor';
    if (e.classList.contains('celda')) return 'BUTTON.celda';
    if (e.classList.contains('casilla')) return 'BUTTON.casilla';
    if (e.classList.contains('contenedor')) return 'BUTTON.contenedor';
    if (e.tagName === 'A') return 'A.enlace-juego';
    if (e.closest('.celda, .contenedor') !== null) return 'SPAN.hijo-de-celda';
    return `${e.tagName}.${String(e.className).slice(0, 24)} SIN CLASIFICAR`;
  };
  const puntero = new Set();
  const teclado = new Set();
  for (const e of document.querySelectorAll('*')) {
    if (e.closest('.panel') !== null) continue;
    const caja = e.getBoundingClientRect();
    if (caja.width === 0 || caja.height === 0) continue;
    const cs = getComputedStyle(e);
    const activable = e.tagName === 'BUTTON' || e.tagName === 'A' || e.tagName === 'INPUT'
      || cs.cursor === 'pointer';
    if (activable) puntero.add(clasificar(e));
    if (/** @type {HTMLElement} */ (e).tabIndex >= 0) teclado.add(clasificar(e));
  }
  return { puntero: [...puntero], teclado: [...teclado] };
});

for (const j of JUEGOS) {
  test(`${j}: el paciente no alcanza nada sin declarar`, async ({ page }) => {
    await page.goto(`/index.html?j=${j}&t=60&c=6`);
    await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
    const r = await alcanzables(page);
    for (const q of [...r.puntero, ...r.teclado]) {
      expect(
        PERMITIDO.has(q),
        `${j}: el paciente puede activar '${q}', y no está en la lista declarada`,
      ).toBe(true);
    }
    // Y el tablero SÍ es alcanzable: una lista vacía pasaría el test de arriba sin mérito.
    expect(r.puntero, `${j}: sin objetos alcanzables`).toContain('BUTTON.celda');
    expect(r.teclado, `${j}: el tablero no es alcanzable por teclado`).toContain('BUTTON.celda');
  });
}

test('el paciente NO alcanza los datos de otros pacientes', async ({ page }) => {
  // El caso límite del sistema 11: el panel se abre de un toque —aceptado— pero el informe de
  // la jornada va plegado, porque dentro están las sesiones de los pacientes anteriores.
  await page.goto('/index.html?j=busca&t=60&c=6');
  await page.waitForFunction(() => /** @type {any} */ (globalThis).__busca?.estado != null);
  await page.locator('.abridor').click();
  await expect(page.locator('#informe-jornada')).toBeHidden();
});
