/**
 * Sistema 14 — invariantes como barreras de CI.
 *
 * Es la apuesta de ADR-0004 puesta a prueba: `tsc` rechaza el error accidental, y lo
 * unico que queda por vigilar es la falsificacion deliberada, que es lexica porque
 * obliga a escribir uno de un puñado de literales.
 *
 * Barreras:
 *   AC-1   (sist. 3)  ninguna fuente no determinista fuera de su borde declarado
 *   AC-2   (sist. 3)  la lista de bordes exentos es EXACTAMENTE la declarada
 *   AC-2b  (sist. 3)  la marca nominal no se acuña ni se falsifica fuera del borde
 *   AC-13  (sist. 4)  no existe un control de dificultad escalar
 *   AC-14  (sist. 4)  ninguna perilla de dificultad tiene unidades de tiempo
 *   AC-2   (sist. 5)  ningun instrumento ramifica por modo de entrada
 *   AC-6   (sist. 6)  no existe ninguna API de audio en src/
 *
 * Uso:  node tools/ci/invariantes.js
 * Sale con codigo 1 si alguna barrera falla.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const RAIZ = process.cwd();
const SRC = join(RAIZ, 'src');
const MARCADOR = '@borde-impuro';

/**
 * LISTA BLANCA POR ARCHIVO, y esto sustituye al conteo "exactamente 1".
 *
 * El conteo era mas debil de lo que parecia: con un solo numero, el borde impuro podia
 * leer `event.timeStamp` y nadie lo veia. Con una lista por archivo, cada borde solo
 * puede tocar lo que su razon de existir justifica.
 *
 * El cambio lo identifico el GDD del sistema 5, al descubrir que necesita un SEGUNDO
 * borde —el de eventos— para leer `event.timeStamp` una vez y pasarlo como dato.
 *
 * @type {Record<string, string[]>}
 */
const BORDES = {
  // Sistema 3: aleatoriedad, relojes y, desde el sistema 5, temporizadores.
  'src/plataforma/borde-impuro.js': [
    'Math.random(',
    'crypto.getRandomValues(',
    'Date.now(',
    'new Date(',
    'performance.now(',
    'setTimeout(',
    'clearTimeout(',
    'setInterval(',
    'clearInterval(',
    'requestAnimationFrame(',
    'cancelAnimationFrame(',
  ],
  // Sistema 5: lee `event.timeStamp` UNA vez y lo pasa como dato. Nada mas.
  'src/entrada/borde-eventos.js': ['.timeStamp'],
};

/**
 * Fuentes no deterministas del entorno. La lista la POSEE el sistema 3, regla 1.
 *
 * Los tres temporizadores estaban reservados hasta que existiera el contrato del
 * `Programador`. El sistema 5 lo publico, asi que **desde hoy rompen el build** en lugar
 * de avisar.
 */
const PROHIBIDOS = [
  'Math.random(',
  'crypto.getRandomValues(',
  'Date.now(',
  'new Date(',
  'performance.now(',
  '.timeStamp',
  'setTimeout(',
  'setInterval(',
  'requestAnimationFrame(',
];

/** Literales de acuñacion de marcas. Sistema 3, F5. */
const ACUNACION = [
  'envolverConValidacion',
  "kind: 'aleatoria'",
  "kind: 'monotono'",
  "kind: 'pared'",
];

/**
 * Sistema 4, AC-13 — no existe un control de dificultad ESCALAR configurable.
 *
 * Limites de palabra a proposito: `dificultadTolerada` y `pool_nivel` son legitimos.
 */
const ESCALARES_PROHIBIDOS = [/\bnivel\b/, /\bdificultad\b/, /\bdifficulty\b/, /\blevel\b/];

/** Sistema 4, AC-14 — ninguna perilla de dificultad tiene unidades de tiempo. */
const TIEMPO_EN_DIFICULTAD = [
  /\bsegundos?\b/i, /\bmilisegundos?\b/i, /\btimeout\b/i, /\bduracion\b/i,
  /\bvelocidad\b/i, /\bcronometro\b/i, /_MS\b/, /\bplazo\b/i,
];

/**
 * Sistemas 6 y 7, AC-6 — no existe ninguna API de audio en `src/`.
 *
 * El anti-pilar 3 prohibe la gamificacion extrinseca, el pilar 2 prohibe anunciar un
 * fallo, y con sensibilidad sensorial confirmada el silencio es el valor por defecto. El
 * resultado es que no hay ningun sonido que controlar.
 *
 * El dia que un instrumento necesite audio, esta barrera se relaja A LA VEZ que se
 * documenta el cumplimiento de las cuatro condiciones de `hayAudioPermitido`, y no antes.
 */
const AUDIO_PROHIBIDO = [
  'AudioContext',
  'new Audio(',
  'HTMLAudioElement',
  'speechSynthesis',
  'SpeechSynthesisUtterance',
];

/**
 * Sistema 5, AC-2 — ningun instrumento ramifica por modo de entrada.
 *
 * El modo viaja SOLO para el registro. Un `if (modo === 'pulsador')` dentro de un
 * instrumento haria que cada instrumento nuevo pagara el coste de las cinco vias.
 */
const MODOS_LITERALES = [
  "'tactil'", "'raton'", "'teclado'", "'pulsador'", "'permanencia'",
];

/**
 * Quita comentarios de bloque y de linea antes de buscar.
 *
 * Sin esto la barrera marca cada mencion en un JSDoc, y los documentos de este proyecto
 * explican por escrito lo que prohiben. Limitacion aceptada: un literal de cadena que
 * contenga `//` o el inicio de un bloque puede confundir al recortador.
 *
 * @param {string} codigo
 * @returns {string}
 */
function sinComentarios(codigo) {
  let salida = '';
  let i = 0;
  let estado = 'codigo';
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

/** @param {string} ruta @returns {string} Ruta relativa con barras normales */
const rel = (ruta) => relative(RAIZ, ruta).split(sep).join('/');

/** @type {{ barrera: string, mensaje: string }[]} */
const fallos = [];

const archivos = archivosJs(SRC);
if (archivos.length === 0) {
  console.error('invariantes: no se encontro ningun .js en src/. Nada que comprobar.');
  process.exit(1);
}

// ---------------------------------------------------------------- AC-2, la lista blanca
const marcados = archivos.filter((f) => readFileSync(f, 'utf8').includes(MARCADOR)).map(rel);
const declarados = Object.keys(BORDES);
const declaradosExistentes = declarados.filter((d) => archivos.some((f) => rel(f) === d));

for (const m of marcados) {
  if (!declarados.includes(m)) {
    fallos.push({
      barrera: 'AC-2',
      mensaje: `${m} se declara borde con ${MARCADOR} y NO esta en la lista blanca`,
    });
  }
}
for (const d of declaradosExistentes) {
  if (!marcados.includes(d)) {
    fallos.push({
      barrera: 'AC-2',
      mensaje: `${d} esta en la lista blanca y le falta el marcador ${MARCADOR}`,
    });
  }
}

// ---------------------------------------------------------------- por archivo
for (const archivo of archivos) {
  const r = rel(archivo);
  const permitidos = BORDES[r] ?? [];
  const lineas = sinComentarios(readFileSync(archivo, 'utf8')).split('\n');

  lineas.forEach((linea, idx) => {
    const n = idx + 1;

    // AC-1 — cada borde solo puede tocar lo que su razon de existir justifica.
    for (const literal of PROHIBIDOS) {
      if (linea.includes(literal) && !permitidos.includes(literal)) {
        fallos.push({
          barrera: 'AC-1',
          mensaje: `${r}:${n} — fuente no determinista no permitida en este archivo: ${literal}`,
        });
      }
    }

    // AC-2b — la acuñacion vive solo en el borde impuro.
    if (r !== 'src/plataforma/borde-impuro.js' && r !== 'src/plataforma/esquema.js') {
      for (const literal of ACUNACION) {
        if (linea.includes(literal)) {
          fallos.push({
            barrera: 'AC-2b',
            mensaje: `${r}:${n} — acuñacion de marca fuera del borde impuro: ${literal}`,
          });
        }
      }
    }

    // AC-13 y AC-14 — sistema 4.
    //
    // Se salta la linea si es una sentencia de import o de reexportacion: una RUTA de
    // modulo que contenga "dificultad" no es un control escalar, y marcarla seria el
    // falso positivo que hace que una barrera se desactive por molesta.
    // Solo se salta una RUTA de modulo, nunca una declaracion: `export function
    // malo(nivel)` SI se comprueba. Una ruta que contenga "dificultad" no es un control
    // escalar, y marcarla seria el falso positivo que desactiva una barrera por molesta.
    const esRutaDeModulo = /\bfrom\s+['"]/.test(linea) || /^\s*import\s+['"]/.test(linea);
    for (const patron of esRutaDeModulo ? [] : ESCALARES_PROHIBIDOS) {
      if (patron.test(linea)) {
        fallos.push({
          barrera: 'AC-13',
          mensaje: `${r}:${n} — dificultad escalar configurable: ${patron.source}`,
        });
      }
    }
    if (r.startsWith('src/dificultad/')) {
      for (const patron of TIEMPO_EN_DIFICULTAD) {
        if (patron.test(linea)) {
          fallos.push({
            barrera: 'AC-14',
            mensaje: `${r}:${n} — perilla con unidades de tiempo en dificultad: ${patron.source}`,
          });
        }
      }
    }

    // AC-6 de los sistemas 6 y 7 — nada de audio en src/.
    for (const literal of AUDIO_PROHIBIDO) {
      if (linea.includes(literal)) {
        fallos.push({
          barrera: 'AC-6/s6',
          mensaje: `${r}:${n} — API de audio en src/: ${literal}. Ver hayAudioPermitido`,
        });
      }
    }

    // AC-2 del sistema 5 — ningun instrumento ramifica por modo de entrada.
    if (!r.startsWith('src/entrada/')) {
      for (const literal of MODOS_LITERALES) {
        if (linea.includes(literal)) {
          fallos.push({
            barrera: 'AC-2/s5',
            mensaje: `${r}:${n} — literal de modo de entrada fuera de src/entrada/: ${literal}`,
          });
        }
      }
    }
  });
}

// ---------------------------------------------------------------- informe
/** @param {string} b */
const cuenta = (b) => fallos.filter((f) => f.barrera === b).length;
/** @param {string} b */
const marca = (b) => (cuenta(b) === 0 ? 'OK' : 'FALLO');

console.log(`invariantes de CI — ${archivos.length} archivos en src/\n`);
console.log(`  AC-2   bordes en lista blanca ..... ${marca('AC-2')}  (${declaradosExistentes.join(', ') || 'ninguno'})`);
console.log(`  AC-1   fuentes no deterministas ... ${marca('AC-1')}`);
console.log(`  AC-2b  acuñacion de marcas ........ ${marca('AC-2b')}`);
console.log(`  AC-13  dificultad no escalar ...... ${marca('AC-13')}`);
console.log(`  AC-14  sin perillas de tiempo ..... ${marca('AC-14')}`);
console.log(`  AC-2   sin ramificar por modo ..... ${marca('AC-2/s5')}`);
console.log(`  AC-6   sin APIs de audio ........... ${marca('AC-6/s6')}`);

const noCreados = declarados.filter((d) => !declaradosExistentes.includes(d));
if (noCreados.length > 0) {
  console.log(`\n  Bordes declarados que aun no existen: ${noCreados.join(', ')}`);
}

if (fallos.length > 0) {
  console.error(`\nFALLO — ${fallos.length} violacion(es):\n`);
  for (const f of fallos) console.error(`  [${f.barrera}] ${f.mensaje}`);
  process.exit(1);
}

console.log('\nTodas las barreras en verde.');
