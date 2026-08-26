/**
 * Sistema 14 — invariantes como barreras de CI.
 *
 * Comprueba las tres barreras lexicas que el sistema 3 declara y este hace cumplir:
 *
 *   AC-1   ninguna llamada directa a una fuente no determinista fuera del borde impuro
 *   AC-2   el borde impuro es EXACTAMENTE un archivo, y es el declarado
 *   AC-2b  la marca nominal no se acuña ni se falsifica fuera del borde impuro
 *
 * Es la apuesta de ADR-0004 puesta a prueba: `tsc` rechaza el error accidental, y lo
 * unico que queda por vigilar es la falsificacion deliberada, que es lexica porque
 * obliga a escribir uno de un puñado de literales.
 *
 * Uso:  node tools/ci/invariantes.js
 * Sale con codigo 1 si alguna barrera falla.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const RAIZ = process.cwd();
const SRC = join(RAIZ, 'src');
const BORDE_IMPURO = join('src', 'plataforma', 'borde-impuro.js');
const MARCADOR = '@borde-impuro';

/** Fuentes no deterministas del entorno. La lista la POSEE el sistema 3, regla 1. */
const FUENTES_PROHIBIDAS = [
  'Math.random(',
  'crypto.getRandomValues(',
  'Date.now(',
  'new Date(',
  'performance.now(',
  '.timeStamp',
];

/**
 * Literales de acuñacion de marcas. Falsificar una marca obliga a escribir uno de
 * estos, y eso es lo que la hace visible.
 */
const ACUNACION = [
  'envolverConValidacion',
  "kind: 'aleatoria'",
  "kind: 'monotono'",
  "kind: 'pared'",
];

/**
 * Los temporizadores NO estan en la lista todavia, y es deliberado: inyectar el reloj
 * hace el tiempo legible, no hace el disparo programable. Entran cuando el sistema 5
 * publique el contrato del programador de tiempo inyectable.
 */
const RESERVADOS_SISTEMA_5 = ['setTimeout(', 'setInterval(', 'requestAnimationFrame('];

/**
 * Sistema 4, AC-13 — no existe un control de dificultad ESCALAR configurable.
 *
 * La dificultad es un vector `{ t, C, sv, ss }` en dos ejes independientes. El modo de
 * fallo que esto previene es que alguien añada un control de "nivel 1 a 10" por
 * comodidad de interfaz y colapse los dos ejes, rompiendo el pilar 3 sin que ningun
 * test funcional lo note.
 *
 * Se usan limites de palabra a proposito: `dificultadTolerada` y `pool_nivel` son
 * legitimos y NO deben coincidir.
 */
const ESCALARES_PROHIBIDOS = [/\bnivel\b/, /\bdificultad\b/, /\bdifficulty\b/, /\blevel\b/];

/**
 * Sistema 4, AC-14 — ninguna perilla de dificultad tiene unidades de tiempo.
 *
 * El anti-pilar 2 prohibe los limites de tiempo por defecto, y el modelo de dificultad
 * es exactamente donde se notaria la tentacion de añadir una perilla de velocidad.
 * El tiempo SE MIDE (sistema 9); no se impone.
 */
const TIEMPO_EN_DIFICULTAD = [
  /\bsegundos?\b/i, /\bmilisegundos?\b/i, /\btimeout\b/i, /\bduracion\b/i,
  /\bvelocidad\b/i, /\bcronometro\b/i, /_MS\b/, /\bplazo\b/i,
];

/**
 * Quita comentarios de bloque y de linea antes de buscar.
 *
 * Sin esto, la barrera marca cada mencion en un JSDoc — y los documentos de este
 * proyecto explican por escrito lo que prohiben, asi que los falsos positivos serian
 * constantes. Limitacion conocida y aceptada: un literal de cadena que contenga `//`
 * o `/*` puede confundir al recortador. Para codigo propio es suficiente; si algun dia
 * deja de serlo, la respuesta es un analizador, no un parche.
 *
 * @param {string} codigo
 * @returns {string} El mismo texto con los comentarios sustituidos por espacios, para
 *   que los numeros de linea no se muevan
 */
function sinComentarios(codigo) {
  let salida = '';
  let i = 0;
  let estado = 'codigo'; // codigo | bloque | linea | cadena | plantilla
  let delim = '';
  while (i < codigo.length) {
    const c = codigo[i];
    const d = codigo[i + 1];
    if (estado === 'codigo') {
      if (c === '/' && d === '*') { estado = 'bloque'; salida += '  '; i += 2; continue; }
      if (c === '/' && d === '/') { estado = 'linea'; salida += '  '; i += 2; continue; }
      if (c === '"' || c === "'") { estado = 'cadena'; delim = c; salida += c; i++; continue; }
      if (c === '`') { estado = 'plantilla'; salida += c; i++; continue; }
      salida += c; i++; continue;
    }
    if (estado === 'bloque') {
      if (c === '*' && d === '/') { estado = 'codigo'; salida += '  '; i += 2; continue; }
      salida += c === '\n' ? '\n' : ' '; i++; continue;
    }
    if (estado === 'linea') {
      if (c === '\n') { estado = 'codigo'; salida += '\n'; i++; continue; }
      salida += ' '; i++; continue;
    }
    // cadena o plantilla
    if (c === '\\') { salida += codigo.slice(i, i + 2); i += 2; continue; }
    if ((estado === 'cadena' && c === delim) || (estado === 'plantilla' && c === '`')) {
      estado = 'codigo';
    }
    salida += c; i++;
  }
  return salida;
}

/** @param {string} dir @returns {string[]} */
function archivosJs(dir) {
  /** @type {string[]} */
  const salida = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) salida.push(...archivosJs(ruta));
    else if (entrada.endsWith('.js') && !entrada.endsWith('.min.js')) salida.push(ruta);
  }
  return salida;
}

/** @type {{ barrera: string, mensaje: string }[]} */
const fallos = [];
/** @type {string[]} */
const avisos = [];

const archivos = archivosJs(SRC);
if (archivos.length === 0) {
  console.error('invariantes: no se encontro ningun .js en src/. Nada que comprobar.');
  process.exit(1);
}

// ---------------------------------------------------------------- AC-2
const exentos = archivos.filter((f) => readFileSync(f, 'utf8').includes(MARCADOR));
const exentosRel = exentos.map((f) => relative(RAIZ, f));

if (exentos.length !== 1) {
  fallos.push({
    barrera: 'AC-2',
    mensaje:
      `el borde impuro debe ser EXACTAMENTE 1 archivo, y hay ${exentos.length}:\n` +
      exentosRel.map((f) => `        ${f}`).join('\n'),
  });
} else if (exentosRel[0] !== BORDE_IMPURO.split(sep).join(sep)) {
  fallos.push({
    barrera: 'AC-2',
    mensaje:
      `el archivo exento no esta en la ruta declarada.\n` +
      `        declarada: ${BORDE_IMPURO}\n        encontrada: ${exentosRel[0]}`,
  });
}

// ---------------------------------------------------------------- AC-1 y AC-2b
for (const archivo of archivos) {
  const rel = relative(RAIZ, archivo);
  const esBorde = exentos.includes(archivo);
  const lineas = sinComentarios(readFileSync(archivo, 'utf8')).split('\n');

  lineas.forEach((linea, idx) => {
    const n = idx + 1;

    if (!esBorde) {
      for (const literal of FUENTES_PROHIBIDAS) {
        if (linea.includes(literal)) {
          fallos.push({
            barrera: 'AC-1',
            mensaje: `${rel}:${n} — fuente no determinista fuera del borde impuro: ${literal}`,
          });
        }
      }
      for (const literal of ACUNACION) {
        if (linea.includes(literal)) {
          fallos.push({
            barrera: 'AC-2b',
            mensaje: `${rel}:${n} — acuñacion de marca fuera del borde impuro: ${literal}`,
          });
        }
      }
    }

    for (const literal of RESERVADOS_SISTEMA_5) {
      if (linea.includes(literal)) {
        avisos.push(
          `${rel}:${n} — ${literal} · reservado. Entra en la lista prohibida cuando el ` +
            `sistema 5 publique el contrato del programador de tiempo inyectable`,
        );
      }
    }

    // AC-13 y AC-14 aplican a todo `src/`, incluido el borde impuro.
    for (const patron of ESCALARES_PROHIBIDOS) {
      if (patron.test(linea)) {
        fallos.push({
          barrera: 'AC-13',
          mensaje:
            `${rel}:${n} — dificultad escalar configurable: ${patron.source}. ` +
            `La dificultad es un vector de dos ejes, no un numero`,
        });
      }
    }

    if (rel.includes(`src${sep}dificultad`)) {
      for (const patron of TIEMPO_EN_DIFICULTAD) {
        if (patron.test(linea)) {
          fallos.push({
            barrera: 'AC-14',
            mensaje:
              `${rel}:${n} — perilla con unidades de tiempo en el modelo de dificultad: ` +
              `${patron.source}. El anti-pilar 2 lo prohibe`,
          });
        }
      }
    }
  });
}

// ---------------------------------------------------------------- informe
console.log(`invariantes de CI — ${archivos.length} archivos en src/\n`);
console.log(`  AC-2   borde impuro unico ......... ${exentos.length === 1 ? 'OK' : 'FALLO'}  (${exentosRel.join(', ') || 'ninguno'})`);
const fallosAC1 = fallos.filter((f) => f.barrera === 'AC-1').length;
const fallosAC2b = fallos.filter((f) => f.barrera === 'AC-2b').length;
console.log(`  AC-1   fuentes no deterministas ... ${fallosAC1 === 0 ? 'OK' : 'FALLO'}`);
console.log(`  AC-2b  acuñacion de marcas ........ ${fallosAC2b === 0 ? 'OK' : 'FALLO'}`);
const fallosAC13 = fallos.filter((f) => f.barrera === 'AC-13').length;
const fallosAC14 = fallos.filter((f) => f.barrera === 'AC-14').length;
console.log(`  AC-13  dificultad no escalar ...... ${fallosAC13 === 0 ? 'OK' : 'FALLO'}`);
console.log(`  AC-14  sin perillas de tiempo ..... ${fallosAC14 === 0 ? 'OK' : 'FALLO'}`);

if (avisos.length > 0) {
  console.log(`\n  AVISOS (${avisos.length}), no rompen el build:`);
  for (const a of avisos) console.log(`    ${a}`);
}

if (fallos.length > 0) {
  console.error(`\nFALLO — ${fallos.length} violacion(es):\n`);
  for (const f of fallos) console.error(`  [${f.barrera}] ${f.mensaje}`);
  process.exit(1);
}

console.log('\nTodas las barreras en verde.');
