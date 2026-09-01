/**
 * El servidor y el puerto. Sistema 13 · procedimiento de despliegue.
 *
 * Este archivo existe porque `EADDRINUSE` paró a Carlos dos veces seguidas, y la segunda con
 * el puerto que él mismo había propuesto:
 *
 * - el **8080** estaba ocupado — es el puerto de servidor de desarrollo más común que existe;
 * - el **8123** también, y **por el mismo proceso**: un servicio de la familia NATS que
 *   retiene 8080, 8123, 8188 y 8222 en esa máquina.
 *
 * La conclusión es la que da forma al arreglo: **elegir un número mejor no resuelve nada.**
 * Cualquier puerto fijo choca con algo en alguna máquina, y este servidor es el procedimiento
 * de despliegue de la consulta, donde no se sabe qué hay corriendo.
 *
 * Se prueba con un servidor de `node:http` de verdad y con el proceso real: el comportamiento
 * que importa está en el sistema operativo, y un doble no lo tendría.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const ejecutar = promisify(execFile);

/**
 * Ocupa un puerto y devuelve cómo liberarlo.
 *
 * @param {number} puerto
 * @returns {Promise<() => Promise<void>>}
 */
function ocupar(puerto) {
  return new Promise((res, rej) => {
    const s = createServer(() => {});
    s.once('error', rej);
    s.listen(puerto, () => res(() => new Promise((r) => { s.close(() => r()); })));
  });
}

/** Un puerto alto y poco probable, para no chocar con nada de la máquina. */
const LIBRE = 8747;

/** El puerto por defecto del servidor. Canario: si cambia, este test lo dice. */
const POR_DEFECTO = 8321;

/**
 * Arranca el servidor y devuelve lo que imprimió.
 *
 * @param {string[]} args
 * @returns {Promise<{ salida: string, error: string, codigo: number | null }>}
 */
async function arrancar(args) {
  try {
    const { stdout, stderr } = await ejecutar(
      process.execPath, ['tools/servir.js', ...args], { timeout: 3000 },
    );
    return { salida: stdout, error: stderr, codigo: 0 };
  } catch (e) {
    const err = /** @type {any} */ (e);
    // El tope de tiempo mata el proceso, y eso es lo que pasa cuando el servidor ARRANCA
    // bien y se queda escuchando. Lo que se comprueba es lo que ya imprimió.
    return { salida: err.stdout ?? '', error: err.stderr ?? '', codigo: err.code ?? null };
  }
}

test('test_con_un_puerto_LIBRE_anuncia_ese_puerto', async () => {
  const r = await arrancar([String(LIBRE)]);
  assert.match(r.salida, new RegExp(`http://localhost:${LIBRE}/index\.html`));
  assert.match(r.salida, /Para parar: Ctrl\+C/);
});

test('test_con_un_puerto_EXPLICITO_ocupado_FALLA_y_dice_como_elegir_otro', async () => {
  // Con puerto explicito alguien depende de ESE numero: Playwright lo fija en su
  // configuracion y con `reuseExistingServer` conecta a el. Si el servidor se moviera solo,
  // los tests hablarian con otra cosa y el fallo seria incomprensible.
  const liberar = await ocupar(LIBRE);
  try {
    const r = await arrancar([String(LIBRE)]);
    assert.match(r.error, new RegExp(`El puerto ${LIBRE} ya lo esta usando`));
    assert.match(r.error, /Elige otro/);
    assert.match(r.error, new RegExp(`servir\.js ${LIBRE + 1}`), 'propone el siguiente');
    assert.equal(r.codigo, 1, 'y termina con codigo distinto de cero');
    assert.doesNotMatch(r.salida, /sirviendo/, 'NO arranca en otro puerto a la callada');
  } finally {
    await liberar();
  }
});

test('test_SIN_puerto_anuncia_exactamente_UNA_vez', async () => {
  // La primera version pasaba un callback a `listen`, y un callback asi NO se descarta en un
  // intento fallido: al acertar al tercer intento imprimia tres anuncios, dos con un puerto
  // que no era el suyo.
  const r = await arrancar([]);
  const anuncios = (r.salida.match(/sirviendo /g) ?? []).length;
  assert.equal(anuncios, 1, `esperaba 1 anuncio, hubo ${anuncios}. Salida:\n${r.salida}`);
  assert.match(r.salida, /http:\/\/localhost:\d+\/index\.html/);
});

test('test_SIN_puerto_busca_uno_libre_y_anuncia_el_REAL', async () => {
  // Sin puerto, quien ejecuta esto quiere ver la pagina: que el numero sea uno u otro le da
  // igual. Fallar seria hacerle resolver un problema que no le interesa.
  /** @type {(() => Promise<void>)[]} */
  const liberar = [];
  try {
    for (const p of [POR_DEFECTO, POR_DEFECTO + 1, POR_DEFECTO + 2]) {
      // Si ya estaba ocupado por otra cosa de la maquina, sirve igual para el test.
      try { liberar.push(await ocupar(p)); } catch { /* ya ocupado */ }
    }
    const r = await arrancar([]);
    const m = r.salida.match(/http:\/\/localhost:(\d+)\/index\.html/);
    assert.ok(m !== null, `sin anuncio de puerto en: ${r.salida}`);
    const anunciado = Number(m[1]);
    assert.ok(
      anunciado >= POR_DEFECTO + 3,
      `anuncio el ${anunciado}, y del ${POR_DEFECTO} al ${POR_DEFECTO + 2} estaban ocupados`,
    );
    assert.match(r.salida, new RegExp(`El puerto ${POR_DEFECTO} esta ocupado`));
  } finally {
    for (const f of liberar) await f();
  }
});
