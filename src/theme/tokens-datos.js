/**
 * Tokens de tema y contraste. **Fuente de verdad normativa** — ADR-0002.
 *
 * El CSS es un archivo GENERADO y confirmado en git, producido por
 * `tools/theme/generar-css.js`. Nunca se edita a mano.
 *
 * Implementacion PARCIAL del sistema 2: cubre los tokens que el instrumento Busca
 * necesita. Las formulas F2 (contraste de silueta) y F6 (distancia perceptual) son del
 * sistema 13 y no estan aqui.
 *
 * Sistema 2 · design/gdd/tokens-tema-contraste.md
 */

/**
 * **`--board-bg` es INVARIANTE al tema.** No es una omision.
 *
 * La revision del sistema 2 demostro que la regla de tres temas completos y el umbral de
 * 4,5:1 en el tablero son mutuamente imposibles para cualquier banco fijo: de doce objetos
 * medidos, seis fallaban en claro, seis en oscuro, y **cero en ambos**. Los conjuntos son
 * complementarios.
 *
 * Asi que conmutar el tema —o no conmutar nada y que la tableta venga en oscuro de
 * fabrica— pondria la mitad del banco bajo el umbral clinico y **moveria la dificultad sin
 * que el terapeuta tocara una perilla**. El valor por defecto debe ser claro, y ademas
 * fijo: la halacion en cataratas lo confirma por una segunda via.
 */
export const TOKENS_TABLERO = Object.freeze({
  '--board-bg': '#f7f5f2',
  '--board-ink': '#1c1917',
  '--board-line': '#57534e',
  // Un solo uso en todo el producto: la barra del objetivo. Si aparece en un segundo
  // sitio, deja de significar "esto es lo que buscas".
  '--board-accent': '#1d4ed8',
  '--board-scan-cursor': '#0f766e',
  '--board-dwell-progress': '#0f766e',
});

/**
 * **NO existe un token de error en el ambito del paciente.** No hay rojo que leer.
 *
 * Es el pilar 2 hecho ausencia: si el token existiera, alguien lo usaria "para que se
 * entienda mejor". La forma de garantizar que no se marca un fallo es que no haya con que.
 */
export const TOKENS_ERROR_PACIENTE = Object.freeze({});

/** Tokens del marco. Estos SI siguen el tema del sistema operativo. */
export const TOKENS_MARCO_CLARO = Object.freeze({
  '--frame-bg': '#ffffff',
  '--frame-ink': '#1c1917',
  '--frame-ink-soft': '#57534e',
  // #a8a29e daba 2,52:1 sobre blanco: por debajo del 3:1 que WCAG 1.4.11 exige para
  // contraste no textual. Lo cazo la puerta de generacion, no una revision.
  '--frame-line': '#78716c',
  '--frame-accent': '#1d4ed8',
});

export const TOKENS_MARCO_OSCURO = Object.freeze({
  '--frame-bg': '#1c1917',
  '--frame-ink': '#f5f5f4',
  '--frame-ink-soft': '#d6d3d1',
  '--frame-line': '#78716c',
  '--frame-accent': '#93b4fd',
});

/**
 * Los PARES que deben cumplir un umbral de contraste.
 *
 * **El contraste es una propiedad de un PAR, no de un token.** Un token aislado no tiene
 * contraste; declararlo "accesible" por si solo no significa nada.
 *
 * @type {readonly { ambito: string, fondo: string, frente: string, umbral: number, nota: string }[]}
 */
export const PARES = Object.freeze([
  { ambito: 'tablero', fondo: '--board-bg', frente: '--board-ink', umbral: 4.5, nota: 'texto y borde de objeto' },
  { ambito: 'tablero', fondo: '--board-bg', frente: '--board-line', umbral: 3.0, nota: 'borde no textual, WCAG 1.4.11' },
  { ambito: 'tablero', fondo: '--board-bg', frente: '--board-accent', umbral: 4.5, nota: 'barra del objetivo' },
  { ambito: 'tablero', fondo: '--board-bg', frente: '--board-scan-cursor', umbral: 3.0, nota: 'indicador de foco' },
  { ambito: 'marco-claro', fondo: '--frame-bg', frente: '--frame-ink', umbral: 4.5, nota: 'texto principal' },
  { ambito: 'marco-claro', fondo: '--frame-bg', frente: '--frame-ink-soft', umbral: 4.5, nota: 'texto secundario' },
  { ambito: 'marco-claro', fondo: '--frame-bg', frente: '--frame-line', umbral: 3.0, nota: 'bordes' },
  { ambito: 'marco-claro', fondo: '--frame-bg', frente: '--frame-accent', umbral: 4.5, nota: 'acento' },
  { ambito: 'marco-oscuro', fondo: '--frame-bg', frente: '--frame-ink', umbral: 4.5, nota: 'texto principal' },
  { ambito: 'marco-oscuro', fondo: '--frame-bg', frente: '--frame-ink-soft', umbral: 4.5, nota: 'texto secundario' },
  { ambito: 'marco-oscuro', fondo: '--frame-bg', frente: '--frame-line', umbral: 3.0, nota: 'bordes' },
  { ambito: 'marco-oscuro', fondo: '--frame-bg', frente: '--frame-accent', umbral: 4.5, nota: 'acento' },
]);

/**
 * F1 — razon de contraste de WCAG.
 *
 * @param {string} hexA
 * @param {string} hexB
 * @returns {number}
 */
export function contraste(hexA, hexB) {
  /** @param {string} hex */
  const L = (hex) => {
    const n = hex.replace('#', '');
    const c = [0, 2, 4].map((i) => {
      const v = parseInt(n.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (c[0] ?? 0) + 0.7152 * (c[1] ?? 0) + 0.0722 * (c[2] ?? 0);
  };
  const a = L(hexA);
  const b = L(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * F3 — separacion entre objetivos, en px.
 *
 * @param {number} t Tamaño de objetivo
 * @returns {number}
 */
export function separacion(t) {
  return Math.max(8, 0.18 * t);
}
