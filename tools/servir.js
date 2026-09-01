/**
 * Servidor estatico minimo, sin dependencias.
 *
 * Existe por dos razones. La primera es que Playwright necesita servir la pagina por HTTP:
 * los modulos ES nativos no cargan desde `file://` por la politica de mismo origen.
 *
 * La segunda es que **este es el procedimiento de despliegue**, y era un hueco declarado.
 * El modelo que asumen las ADR es "copiar archivos al equipo que haya en la consulta"; esto
 * es lo que los sirve alli.
 *
 *   node tools/servir.js            busca un puerto libre desde el 8321
 *   node tools/servir.js 9000       usa el 9000, y falla si esta ocupado
 *
 * `crypto.getRandomValues` funciona sobre HTTP plano —es el unico miembro de `Crypto`
 * exento de contexto seguro— asi que no hace falta TLS en la red local de la consulta.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const RAIZ = resolve(process.cwd());
/**
 * Puerto por defecto.
 *
 * **8321, y el numero importa menos que la regla de abajo.**
 *
 * Estaba en 8080, que es el puerto de servidor de desarrollo mas comun que existe: la primera
 * vez que alguien uso este servidor de verdad se encontro con `EADDRINUSE`. El siguiente
 * candidato, 8123, **tambien estaba ocupado en la misma maquina y por el mismo proceso** — un
 * servicio de la familia NATS que retiene 8080, 8123, 8188 y 8222.
 *
 * De ahi la conclusion: **elegir un numero mejor no resuelve nada.** Cualquier puerto fijo
 * choca con algo en alguna maquina, y este servidor es el procedimiento de despliegue de la
 * consulta, donde no se sabe que hay corriendo.
 *
 * Asi que la regla es la de abajo, en `escuchar`: sin puerto explicito, busca uno libre.
 */
const PUERTO_POR_DEFECTO = 8321;

/** Cuantos puertos consecutivos se prueban antes de rendirse. */
const INTENTOS = 20;

const PUERTO_PEDIDO = process.argv[2];
const PUERTO = Number(PUERTO_PEDIDO ?? PUERTO_POR_DEFECTO);

/** @type {Record<string, string>} */
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const servidor = createServer(async (peticion, respuesta) => {
  // La base solo sirve para parsear la ruta; el host no se usa para nada.
  const url = new URL(peticion.url ?? '/', 'http://localhost');
  const relativa = url.pathname === '/' ? '/index.html' : url.pathname;

  // Sin traversal: la ruta resuelta tiene que quedar dentro de la raiz.
  const destino = join(RAIZ, normalize(decodeURIComponent(relativa)));
  if (!destino.startsWith(RAIZ)) {
    respuesta.writeHead(403).end('403');
    return;
  }

  try {
    const cuerpo = await readFile(destino);
    respuesta.writeHead(200, {
      'Content-Type': TIPOS[extname(destino).toLowerCase()] ?? 'application/octet-stream',
      // Sin cache: en la consulta se actualiza copiando archivos, y una cache haria que el
      // terapeuta viera la version anterior sin saberlo.
      'Cache-Control': 'no-store',
    });
    respuesta.end(cuerpo);
  } catch {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    respuesta.end(`404 — no encontrado: ${relativa}`);
  }
});

/**
 * Escucha, y si el puerto esta ocupado prueba el siguiente.
 *
 * **La busqueda solo ocurre si NO se paso un puerto explicito**, y esa asimetria es
 * deliberada:
 *
 * - **Sin puerto**, quien ejecuta esto quiere ver la pagina. Que el numero sea 8321 u 8322
 *   le da igual, y el servidor imprime cual ha cogido. Fallar aqui seria hacerle resolver un
 *   problema que no le interesa.
 * - **Con puerto**, alguien depende de ESE numero: Playwright lo fija en su configuracion y
 *   con `reuseExistingServer` conecta a el. Si el servidor se moviera solo, los tests
 *   hablarian con otra cosa y el fallo seria incomprensible. Ahi falla, y dice como elegir
 *   otro.
 *
 * @param {number} puerto
 * @param {number} quedan
 */
function escuchar(puerto, quedan) {
  servidor.once('error', (err) => {
    const codigo = /** @type {NodeJS.ErrnoException} */ (err).code;
    if (codigo !== 'EADDRINUSE') throw err;

    if (PUERTO_PEDIDO !== undefined) {
      console.error(`El puerto ${puerto} ya lo esta usando otro programa.`);
      console.error('');
      console.error('Elige otro, o deja que lo busque solo:');
      console.error(`  node tools/servir.js ${puerto + 1}`);
      console.error('  npm run servir');
      process.exit(1);
    }
    if (quedan <= 0) {
      console.error(`Probados ${INTENTOS} puertos desde ${PUERTO_POR_DEFECTO} y todos `
        + 'estan ocupados. Pasa uno a mano:');
      console.error('  node tools/servir.js 9999');
      process.exit(1);
    }
    console.log(`El puerto ${puerto} esta ocupado; probando el ${puerto + 1}.`);
    escuchar(puerto + 1, quedan - 1);
  });

  // **Sin callback en `listen`.** El callback se registra como oyente de `listening`, y en un
  // intento fallido NO se descarta: la primera version pasaba uno aqui y, al acertar al
  // tercer intento, se imprimian tres veces los datos del servidor, cada una con el numero
  // de puerto de su intento. Dos de los tres eran falsos.
  //
  // El anuncio se registra UNA vez, fuera, y lee el puerto REAL del socket.
  servidor.listen(puerto);
}

servidor.on('listening', () => {
  const dir = servidor.address();
  // El puerto de verdad, no el pedido: es el unico que sirve para abrir el navegador.
  const puerto = typeof dir === 'object' && dir !== null ? dir.port : PUERTO;
  console.log(`sirviendo ${RAIZ}`);
  console.log('');
  console.log(`  http://localhost:${puerto}/index.html`);
  console.log('');
  console.log('Para parar: Ctrl+C');
});

escuchar(PUERTO, PUERTO_PEDIDO === undefined ? INTENTOS : 0);
