/**
 * La latencia: el defecto más grave que llevaba el proyecto, y nadie lo veía.
 *
 * ## Ninguna latencia se midió nunca, en ningún modo de entrada
 *
 * El tablero marcaba su inicio con una lectura del reloj monótono, y la activación traía
 * `event.timeStamp`. `latencia()` comparaba las **etiquetas** de origen, así que ese par daba
 * siempre `origenesMezclados`.
 *
 * Y ese es el único par que el producto produce. Medido en el navegador, con ratón:
 *
 * ```
 * latencia registrada: { motivo: "origenesMezclados" }
 * ```
 *
 * Una de las dos métricas del producto, ausente desde el principio.
 *
 * ## Y era falso que no fueran comparables
 *
 * ```
 * event.timeStamp : 856.7
 * performance.now : 856.7      diferencia: 0.00 ms
 * ```
 *
 * **Son el mismo reloj.** `event.timeStamp` es un `DOMHighResTimeStamp` con el mismo origen de
 * tiempo que `performance.now()` dentro del mismo documento.
 *
 * La regla del proyecto dice *«un `event.timeStamp` y una lectura del reloj monótono **de otra
 * carga de página** no son comparables»*. La implementación la aplicaba dentro de la misma
 * carga. Y **dos tests fijaban el defecto**, comprobando que ese par se rechazaba.
 *
 * ## Por qué la clase de vía importa
 *
 * Con la latencia funcionando aparece lo siguiente: no mide lo mismo en cada vía. Medido,
 * **424 ms con pulsador** a 500 ms por paso, y **1.036 ms con permanencia** de 600 ms. Los dos
 * dominados por su propio ajuste, no por el paciente.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latencia, resumenSesion } from '../../../src/registro/sesion.js';
import { claseDeLatencia, claseDeReloj } from '../../../src/entrada/constantes.js';
import { presentarLatencia, presentarLatenciaPorClase } from '../../../src/resultados/presentar.js';

// ---------------------------------------------------------------- clases de reloj

test('test_evento_y_reloj_son_la_MISMA_clase_de_reloj', () => {
  assert.equal(claseDeReloj('evento'), 'monotono');
  assert.equal(claseDeReloj('reloj'), 'monotono');
  assert.equal(claseDeReloj('pared'), 'pared');
});

test('test_el_par_que_el_PRODUCTO_produce_da_una_latencia_de_verdad', () => {
  // Tablero con el reloj monotono, activacion con la marca del evento. Este par daba
  // `origenesMezclados`, y es el unico que el producto genera.
  assert.equal(latencia(1000, 1420, 'reloj', 'evento').ms, 420);
});

// ---------------------------------------------------------------- clases de latencia

test('test_las_cinco_vias_caen_en_TRES_clases', () => {
  assert.equal(claseDeLatencia('tactil'), 'reaccion');
  assert.equal(claseDeLatencia('raton'), 'reaccion');
  assert.equal(claseDeLatencia('teclado'), 'reaccion');
  assert.equal(claseDeLatencia('pulsador'), 'barrido');
  assert.equal(claseDeLatencia('permanencia'), 'permanencia');
});

test('test_un_modo_AUSENTE_no_se_confunde_con_reaccion', () => {
  // Un intento antiguo sin modo registrado no es un intento tactil: es un dato incompleto, y
  // meterlo en `reaccion` contaminaria la media de la clase que si se puede interpretar.
  assert.equal(claseDeLatencia(undefined), 'desconocida');
  assert.equal(claseDeLatencia(/** @type {any} */ ('inventado')), 'desconocida');
});

// ---------------------------------------------------------------- el resumen

/**
 * @param {[import('../../../src/entrada/constantes.js').Modo | undefined, number | undefined][]} pares
 * @returns {import('../../../src/registro/sesion.js').TableroRegistrado}
 */
function tablero(pares) {
  return {
    objetivo: 'o', distractores: [], semilla: 1, schemaVersion: 'v1',
    dm: 48, dp: 20, dpPedida: 20, instrumento: 'busca', contenido: null, incompleto: false,
    intentos: pares.map(([modo, ms], i) => ({
      idActivado: `x${i}`,
      correcto: true,
      latencia: ms === undefined ? { ms: undefined, motivo: 'relojRetrocedio' } : { ms },
      ...(modo === undefined ? {} : { modo }),
    })),
  };
}

/** @param {import('../../../src/registro/sesion.js').TableroRegistrado[]} tableros */
const sesion = (tableros) => ({
  orden: 0, selloPared: 0, resolucionMs: 0.1, fiableParaPresupuesto: true,
  ejesAcoplados: false, tableros,
});

test('test_con_UNA_clase_de_via_la_latencia_de_sesion_SI_existe', () => {
  const r = resumenSesion(sesion([tablero([['raton', 400], ['tactil', 600]])]));
  assert.equal(r.latenciaMedia, 500);
  assert.equal(r.motivoLatencia, undefined);
  assert.equal(r.latenciaPorClase.size, 1);
});

test('test_con_DOS_clases_la_latencia_de_sesion_NO_existe', () => {
  // 336 con pulsador y 606 con raton darian 471 de media, que no es de ninguna de las dos:
  // los 336 llevan dentro la cadencia del barrido.
  const r = resumenSesion(sesion([tablero([['pulsador', 336], ['raton', 606]])]));
  assert.equal(r.latenciaMedia, undefined);
  assert.equal(r.motivoLatencia, 'viasMezcladas');
  assert.equal(r.latenciaPorClase.get('barrido')?.media, 336);
  assert.equal(r.latenciaPorClase.get('reaccion')?.media, 606);
});

test('test_la_permanencia_es_su_PROPIA_clase', () => {
  // Su latencia lleva dentro el umbral entero: medido, 1.036 ms con un umbral de 600.
  const r = resumenSesion(sesion([tablero([['permanencia', 1036], ['tactil', 400]])]));
  assert.equal(r.motivoLatencia, 'viasMezcladas');
  assert.equal(r.latenciaPorClase.get('permanencia')?.media, 1036);
});

test('test_sin_ninguna_medida_el_motivo_es_datosInsuficientes', () => {
  // Distinguible de la mezcla: uno se arregla midiendo y el otro mirando el desglose.
  const r = resumenSesion(sesion([tablero([['raton', undefined]])]));
  assert.equal(r.latenciaMedia, undefined);
  assert.equal(r.motivoLatencia, 'datosInsuficientes');
});

test('test_un_intento_sin_modo_cae_en_DESCONOCIDA_y_no_contamina', () => {
  const r = resumenSesion(sesion([tablero([[undefined, 500], ['raton', 300]])]));
  assert.equal(r.motivoLatencia, 'viasMezcladas');
  assert.equal(r.latenciaPorClase.get('desconocida')?.media, 500);
  assert.equal(r.latenciaPorClase.get('reaccion')?.media, 300);
});

// ---------------------------------------------------------------- la presentacion

test('test_el_texto_de_la_latencia_MEZCLADA_manda_al_desglose', () => {
  const r = resumenSesion(sesion([tablero([['pulsador', 336], ['raton', 606]])]));
  const p = presentarLatencia(r);
  assert.equal(p.tieneDato, false);
  assert.match(p.valor, /2 vias de acceso distintas/);
  assert.match(p.valor, /espera del barrido/);
  // Y NO publica la media mezclada.
  assert.doesNotMatch(p.valor, /471/);
});

test('test_cada_fila_del_desglose_dice_QUE_incluye', () => {
  // «424 ms» no se puede interpretar sin saber que 500 de esos milisegundos eran la cadencia.
  const r = resumenSesion(sesion([tablero([['pulsador', 336], ['permanencia', 1036]])]));
  const filas = presentarLatenciaPorClase(r);
  const texto = filas.map((f) => `${f.etiqueta} ${f.valor}`).join(' | ');
  assert.match(texto, /incluye la espera del barrido/);
  assert.match(texto, /incluye el umbral/);
  // Y ninguna fila es un total.
  for (const f of filas) assert.doesNotMatch(f.etiqueta, /total|sesion/i);
});

test('test_el_singular_de_una_medida_esta_bien_escrito', () => {
  const r = resumenSesion(sesion([tablero([['pulsador', 336], ['raton', 606]])]));
  const filas = presentarLatenciaPorClase(r);
  assert.match(/** @type {any} */ (filas[0]).valor, /sobre 1 medida\./);
});
