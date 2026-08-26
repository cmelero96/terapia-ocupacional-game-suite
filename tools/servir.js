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
 *   node tools/servir.js [puerto]
 *
 * `crypto.getRandomValues` funciona sobre HTTP plano —es el unico miembro de `Crypto`
 * exento de contexto seguro— asi que no hace falta TLS en la red local de la consulta.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const RAIZ = resolve(process.cwd());
const PUERTO = Number(process.argv[2] ?? 8080);

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
  const url = new URL(peticion.url ?? '/', `http://localhost:${PUERTO}`);
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

servidor.listen(PUERTO, () => {
  console.log(`sirviendo ${RAIZ}`);
  console.log(`  http://localhost:${PUERTO}/`);
});
