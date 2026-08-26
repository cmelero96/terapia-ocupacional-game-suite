/**
 * Genera `src/theme/tokens.css` desde los datos normativos de `src/theme/tokens-datos.js`.
 *
 * ADR-0002: el JS es normativo, el CSS es un artefacto **generado y confirmado en git**.
 * El artefacto servido nunca depende de que esta herramienta se haya ejecutado — eso es el
 * corolario de ADR-0003.
 *
 * Y valida los pares ANTES de escribir: un par que no cumple su umbral **rompe la
 * generacion**. Es una puerta, no un aviso.
 *
 * Uso:  node tools/theme/generar-css.js [--comprobar]
 *   --comprobar  no escribe; falla si el CSS en disco no coincide con lo generado
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TOKENS_TABLERO, TOKENS_MARCO_CLARO, TOKENS_MARCO_OSCURO, PARES, contraste, separacion,
} from '../../src/theme/tokens-datos.js';

const DESTINO = join(process.cwd(), 'src', 'theme', 'tokens.css');
const soloComprobar = process.argv.includes('--comprobar');

/** @type {Record<string, Record<string, string>>} */
const AMBITOS = {
  tablero: TOKENS_TABLERO,
  'marco-claro': TOKENS_MARCO_CLARO,
  'marco-oscuro': TOKENS_MARCO_OSCURO,
};

// ---------------------------------------------------------------- validacion
/** @type {string[]} */
const fallos = [];
/** @type {string[]} */
const informe = [];

for (const par of PARES) {
  const tokens = AMBITOS[par.ambito];
  if (tokens === undefined) {
    fallos.push(`ambito desconocido: ${par.ambito}`);
    continue;
  }
  const fondo = tokens[par.fondo];
  const frente = tokens[par.frente];
  if (fondo === undefined || frente === undefined) {
    fallos.push(`${par.ambito}: falta ${fondo === undefined ? par.fondo : par.frente}`);
    continue;
  }
  const r = contraste(fondo, frente);
  const ok = r >= par.umbral;
  informe.push(
    `  ${ok ? 'OK  ' : 'FALLO'} ${par.ambito.padEnd(13)} ${par.frente.padEnd(22)} ` +
      `${r.toFixed(2).padStart(6)}:1  (umbral ${par.umbral})  ${par.nota}`,
  );
  if (!ok) {
    fallos.push(
      `${par.ambito} ${par.frente} sobre ${par.fondo}: ${r.toFixed(2)}:1 < ${par.umbral}:1`,
    );
  }
}

console.log(`tokens — ${PARES.length} pares comprobados\n`);
for (const l of informe) console.log(l);

if (fallos.length > 0) {
  console.error(`\nFALLO — ${fallos.length} par(es) por debajo del umbral:\n`);
  for (const f of fallos) console.error(`  ${f}`);
  process.exit(1);
}

// ---------------------------------------------------------------- generacion
/** @param {Record<string, string>} tokens @param {string} sangria */
const declara = (tokens, sangria) =>
  Object.entries(tokens).map(([k, v]) => `${sangria}${k}: ${v};`).join('\n');

const css = `/* ARCHIVO GENERADO — no editar a mano.
 *
 * Fuente: src/theme/tokens-datos.js
 * Generar: node tools/theme/generar-css.js
 *
 * ADR-0002: el JS es normativo y este CSS es un artefacto confirmado en git, para que el
 * artefacto servido no dependa de que la herramienta se haya ejecutado. Y sin proyeccion
 * en arranque, no hay parpadeo.
 */

/* Capas de cascada, en orden de fuerza creciente. Dos trampas documentadas:
 *   - una regla FUERA de toda capa vence a cualquier capa, incluida \`forced\`
 *   - \`!important\` INVIERTE el orden de las capas
 * Por eso todo lo de este archivo esta dentro de una capa y sin \`!important\`.
 */
@layer scheme, theme, forced;

/* Los tokens NO se declaran en \`:root\`.
 *
 * Viven en dos contenedores HERMANOS que nunca se anidan, y por tanto no heredan entre
 * si. Es lo que impide que un token del marco se filtre al tablero — donde el umbral de
 * contraste es clinico y no estetico.
 */
@layer theme {
  .frame-root {
${declara(TOKENS_MARCO_CLARO, '    ')}
    color-scheme: light dark;
    background: var(--frame-bg);
    color: var(--frame-ink);
  }

  .board-root {
${declara(TOKENS_TABLERO, '    ')}
    /* Invariante al tema. Ver la nota de tokens-datos.js. */
    color-scheme: light;
    background: var(--board-bg);
    color: var(--board-ink);
  }
}

@layer scheme {
  :root:not([data-theme='light']) .frame-root {
    /* Redefinido solo bajo preferencia oscura; la definicion completa esta arriba. */
  }
}

@media (prefers-color-scheme: dark) {
  @layer scheme {
    :root:not([data-theme='light']) .frame-root {
${declara(TOKENS_MARCO_OSCURO, '      ')}
    }
  }
}

@layer scheme {
  :root[data-theme='dark'] .frame-root {
${declara(TOKENS_MARCO_OSCURO, '    ')}
  }
  :root[data-theme='light'] .frame-root {
${declara(TOKENS_MARCO_CLARO, '    ')}
  }
}

/* Colores forzados del sistema operativo.
 *
 * NUNCA \`forced-color-adjust: none\` en el ambito del tablero: el usuario eligio alto
 * contraste, y anularlo para una poblacion de baja vision con el fin de preservar una
 * garantia de diseño esta del reves.
 */
@layer forced {
  @media (forced-colors: active) {
    .frame-root,
    .board-root {
      --frame-bg: Canvas;
      --frame-ink: CanvasText;
      --frame-ink-soft: GrayText;
      --frame-line: CanvasText;
      --frame-accent: LinkText;
      --board-bg: Canvas;
      --board-ink: CanvasText;
      --board-line: CanvasText;
      --board-accent: LinkText;
      /* \`Highlight\` tiene UN SOLO hogar: el indicador del objetivo actual. */
      --board-scan-cursor: Highlight;
      --board-dwell-progress: Highlight;
    }
  }
}

/* Separacion de la rejilla: F3, \`max(8, 0,18t)\`. Se publica como referencia; el valor
 * efectivo lo inyecta el instrumento, porque depende de \`t\`. */
.board-root {
  --board-sep-t24: ${separacion(24).toFixed(2)}px;
  --board-sep-t44: ${separacion(44).toFixed(2)}px;
  --board-sep-t60: ${separacion(60).toFixed(2)}px;
  --board-sep-t140: ${separacion(140).toFixed(2)}px;
}
`;

if (soloComprobar) {
  let enDisco = '';
  try {
    enDisco = readFileSync(DESTINO, 'utf8');
  } catch {
    console.error('\nFALLO — src/theme/tokens.css no existe. Ejecuta la generacion.');
    process.exit(1);
  }
  if (enDisco !== css) {
    console.error(
      '\nFALLO — src/theme/tokens.css no coincide con los datos normativos.\n' +
        '  Ejecuta: node tools/theme/generar-css.js',
    );
    process.exit(1);
  }
  console.log('\nEl CSS en disco coincide con los datos normativos.');
} else {
  writeFileSync(DESTINO, css, 'utf8');
  console.log(`\nEscrito ${DESTINO}`);
}
