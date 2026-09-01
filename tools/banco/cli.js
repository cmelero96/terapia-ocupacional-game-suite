/**
 * CLI del banco de imágenes. Sistema 13.
 *
 * **Es la única parte impura de estas herramientas**: aquí viven el disco y git. La lógica
 * está en `validar.js`, `lock.js`, `diff-manifiestos.js` e `importar.js`, todas puras con
 * predicados inyectados.
 *
 * La separación no es estética. ADR-0001 la pide para que el mismo validador sirva en
 * construcción y en una futura ruta de ejecución (sistema 19, si el terapeuta sube sus
 * propias imágenes). Un validador que abre archivos sólo sirve en construcción.
 *
 * Uso:
 *   node tools/banco/cli.js validar            # esquema, ids, clusters, archivos
 *   node tools/banco/cli.js lock --generar     # escribe banco.lock
 *   node tools/banco/cli.js lock --comprobar   # CI: recalcula desde disco y compara
 *   node tools/banco/cli.js diff               # continuidad de ids contra origin/main
 *   node tools/banco/cli.js retirar <id> <AAAA-MM-DD>
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { validarManifiesto } from './validar.js';
import { construirLock, comparar, serializar, deserializar } from './lock.js';
import { continuidad, rompe, informe } from './diff-manifiestos.js';
import { retirar, serializarManifiesto } from './importar.js';
import { CLUSTER_MIN, BANCO_TOTAL, G } from '../../src/banco/constantes.js';

const RAIZ = process.cwd();
const DIR_ASSETS = join(RAIZ, 'assets', 'art', 'banco');
const RUTA_MANIFIESTO = join(RAIZ, 'src', 'banco', 'manifiesto.js');
const RUTA_LOCK = join(RAIZ, 'src', 'banco', 'banco.lock');

/** @returns {Promise<import('../../src/banco/esquema.js').ImageAsset[]>} */
async function cargarManifiesto() {
  const mod = await import(`file://${RUTA_MANIFIESTO.split('\\').join('/')}`);
  return mod.default;
}

/** @param {string} file */
const existeArchivo = (file) => existsSync(join(DIR_ASSETS, file));

/**
 * **Escalón por nivel.** Mientras el banco real esté por debajo de su tamaño objetivo,
 * `clusterMin` es ADVERTENCIA: ningún reparto de las primeras imágenes satisface un mínimo de
 * 16, y el primer manifiesto sería inválido por construcción.
 *
 * El escalón se decide por un dato, no por una bandera: **si el banco tiene menos entradas
 * activas que `BANCO_TOTAL`, todavía se está construyendo.** Una bandera `--permisivo`
 * acabaría puesta en CI para siempre.
 *
 * @param {readonly import('../../src/banco/esquema.js').ImageAsset[]} manifiesto
 * @returns {'advertencia' | 'bloqueo'}
 */
function escalon(manifiesto) {
  const activos = manifiesto.filter((a) => a.status === 'active').length;
  return activos < BANCO_TOTAL ? 'advertencia' : 'bloqueo';
}

/** @param {import('../../src/banco/esquema.js').Problema[]} lista @param {string} etiqueta */
function imprimir(lista, etiqueta) {
  for (const p of lista) console.error(`  ${etiqueta} [${p.codigo}] ${p.mensaje}`);
}

async function cmdValidar() {
  const manifiesto = await cargarManifiesto();
  const esc = escalon(manifiesto);
  const inf = validarManifiesto({
    manifiesto, existeArchivo, clusterMin: CLUSTER_MIN, escalonClusterMin: esc,
  });

  console.log(`banco: ${inf.activos} activos, ${inf.retirados} retirados, `
    + `${inf.porCluster.size} clusters`);
  console.log(`objetivo: ${BANCO_TOTAL} imagenes (${G} clusters de ${CLUSTER_MIN})`);
  console.log(`clusterMin: ${esc === 'bloqueo' ? 'BLOQUEA' : 'advierte'} `
    + `(${esc === 'bloqueo' ? 'banco completo' : 'banco en construccion'})`);

  if (inf.advertencias.length > 0) {
    console.error('');
    imprimir(inf.advertencias, 'aviso');
  }
  if (inf.errores.length > 0) {
    console.error(`\nFALLO — ${inf.errores.length} error(es):\n`);
    imprimir(inf.errores, 'ERROR');
    process.exit(1);
  }
  console.log('\nManifiesto valido.');
}

/** @param {boolean} comprobar */
async function cmdLock(comprobar) {
  const manifiesto = await cargarManifiesto();
  const { lock, ausentes } = construirLock({
    manifiesto,
    leer: (file) => {
      const ruta = join(DIR_ASSETS, file);
      return existsSync(ruta) ? readFileSync(ruta) : null;
    },
  });

  if (ausentes.length > 0) {
    console.error(`FALLO — ${ausentes.length} archivo(s) activo(s) que no estan en disco:`);
    for (const id of ausentes) console.error(`  ${id}`);
    process.exit(1);
  }

  if (!comprobar) {
    writeFileSync(RUTA_LOCK, serializar(lock), 'utf-8');
    console.log(`Escrito ${RUTA_LOCK} — ${Object.keys(lock).length} entrada(s)`);
    return;
  }

  if (!existsSync(RUTA_LOCK)) {
    if (Object.keys(lock).length === 0) {
      console.log('banco.lock no existe y el banco esta vacio. Nada que comprobar.');
      return;
    }
    console.error('FALLO — banco.lock no existe. Ejecuta: node tools/banco/cli.js lock --generar');
    process.exit(1);
  }

  const enGit = deserializar(readFileSync(RUTA_LOCK, 'utf-8'));
  const { sustituidos, nuevos, desaparecidos } = comparar(enGit, lock);

  for (const id of nuevos) console.error(`  aviso  '${id}': en disco y no en el lock.`);
  for (const id of desaparecidos) console.error(`  aviso  '${id}': en el lock y no activo.`);

  if (sustituidos.length > 0) {
    console.error(`\nFALLO — ${sustituidos.length} archivo(s) SUSTITUIDO(s) bajo un id `
      + 'existente:\n');
    for (const id of sustituidos) {
      console.error(`  ERROR  '${id}': el id sigue y el contenido cambio. Eso esta `
        + 'prohibido: el id es la clave con la que se guarda que estimulo vio el paciente. '
        + 'Retira el id y crea otro.');
    }
    process.exit(1);
  }
  // "Cuadra" solo si cuadra de verdad. La primera version imprimia "cuadra con el disco"
  // despues de listar 16 avisos, y eso es peor que no imprimir nada: un resumen que
  // contradice lo que hay tres lineas arriba entrena a no leer los avisos.
  const descuadres = nuevos.length + desaparecidos.length;
  if (descuadres > 0) {
    console.log('');
    console.log(`banco.lock: ${Object.keys(lock).length} entrada(s) en disco, `
      + `${descuadres} descuadre(s) sin sustituciones. Regenera el lock: `
      + 'node tools/banco/cli.js lock --generar');
    return;
  }
  console.log(`banco.lock cuadra con el disco — ${Object.keys(lock).length} entrada(s).`);
}

async function cmdDiff() {
  const ahora = await cargarManifiesto();

  // Decidido en `diff-manifiestos.js`: contra `origin/main`. El proyecto es troncal y no
  // tiene tags, asi que "ultimo tag" no existe hoy.
  let textoAntes = '';
  try {
    textoAntes = execFileSync(
      'git', ['show', 'origin/main:src/banco/manifiesto.js'], { encoding: 'utf-8' },
    );
  } catch {
    console.log('No hay manifiesto en origin/main todavia. Nada que comparar.');
    return;
  }

  // Se importa por data: URL en lugar de escribir un temporal. El manifiesto es un modulo
  // JS con literales, asi que evaluarlo es leerlo.
  const url = `data:text/javascript;base64,${Buffer.from(textoAntes, 'utf-8').toString('base64')}`;
  /** @type {{ default: import('../../src/banco/esquema.js').ImageAsset[] }} */
  const mod = await import(url);
  const antes = mod.default;

  const c = continuidad(antes, ahora);
  const lineas = informe(c);
  if (lineas.length === 0) {
    console.log(`Continuidad de ids: sin cambios (${ahora.length} entradas).`);
    return;
  }
  for (const l of lineas) console.error(l);
  if (rompe(c)) {
    console.error('\nFALLO — la continuidad de identificadores esta rota.');
    process.exit(1);
  }
  console.log('\nContinuidad de ids: correcta.');
}

/** @param {string} id @param {string} fecha */
async function cmdRetirar(id, fecha) {
  const manifiesto = await cargarManifiesto();
  const { resultado, rechazos } = retirar({ manifiesto, id, fecha });
  if (resultado === null) {
    for (const r of rechazos) console.error(`  ERROR [${r.codigo}] ${r.mensaje}`);
    process.exit(1);
  }
  writeFileSync(RUTA_MANIFIESTO, serializarManifiesto(resultado), 'utf-8');
  console.log(`'${id}' retirado con fecha ${fecha}. La fila se CONSERVA: los datos ya `
    + 'registrados que la referencian siguen teniendo su estimulo.');
  console.log('Recuerda regenerar el lock: node tools/banco/cli.js lock --generar');
}

// ---------------------------------------------------------------- despacho

const [comando, ...resto] = process.argv.slice(2);

switch (comando) {
  case 'validar':
    await cmdValidar();
    break;
  case 'lock':
    await cmdLock(resto.includes('--comprobar'));
    break;
  case 'diff':
    await cmdDiff();
    break;
  case 'retirar': {
    const id = resto[0];
    const fecha = resto[1];
    if (id === undefined || fecha === undefined) {
      console.error('Uso: node tools/banco/cli.js retirar <id> <AAAA-MM-DD>');
      process.exit(1);
    }
    await cmdRetirar(id, fecha);
    break;
  }
  default:
    console.error('Comandos: validar | lock [--generar|--comprobar] | diff | retirar <id> <fecha>');
    process.exit(1);
}
