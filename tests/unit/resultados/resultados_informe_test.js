/**
 * El informe de la jornada. Sistema 12, y el hueco que dejó medir una sesión larga.
 *
 * Todo lo medido vivía sólo dentro del panel y sólo de la sesión en curso. El terapeuta que
 * acababa una jornada de tres pacientes **no tenía forma de sacar los datos**: al cerrar la
 * pestaña se perdían, porque no hay persistencia en el primer hito.
 *
 * Estas pruebas fijan las reglas que el informe hereda del resto del producto:
 *
 * 1. Ninguna métrica sin dato se convierte en un número.
 * 2. La limitación de escala viaja junto al número, no en un pie: un texto que se copia y se
 *    pega en otro documento pierde cualquier pie.
 * 3. El aviso de que esto no se guarda va ARRIBA.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { informeDeJornada, bloqueDeSesion, AVISO_SIN_GUARDAR } from '../../../src/resultados/informe.js';
import { LIMITACION_ESCALA } from '../../../src/resultados/presentar.js';

/**
 * @param {object} spec
 * @param {number} spec.orden
 * @param {string} [spec.instrumento]
 * @param {number} [spec.aciertos]
 * @param {number} [spec.fallos]
 * @param {import('../../../src/entrada/constantes.js').Modo} [spec.modo]
 * @param {number} [spec.ms]
 * @param {boolean} [spec.incompleto]
 * @param {string | null} [spec.variante]
 * @returns {import('../../../src/registro/sesion.js').Sesion}
 */
function sesion({
  orden, instrumento = 'busca', aciertos = 3, fallos = 0, modo = 'tactil', ms = 400,
  incompleto = false, variante = null,
}) {
  /** @param {boolean} correcto */
  const intento = (correcto) => ({
    idActivado: 'x', correcto, latencia: { ms }, modo,
  });
  return {
    orden, selloPared: 0, resolucionMs: 0.1, fiableParaPresupuesto: true,
    ejesAcoplados: false,
    tableros: [{
      objetivo: 'o', distractores: [], semilla: 1, schemaVersion: 'v1',
      dm: 48, dp: 20, dpPedida: 20, instrumento,
      contenido: variante === null ? null : { id: variante, ordinal: 1 },
      incompleto,
      intentos: [
        ...Array.from({ length: aciertos }, () => intento(true)),
        ...Array.from({ length: fallos }, () => intento(false)),
      ],
    }],
  };
}

// ---------------------------------------------------------------- la cabecera

test('test_el_aviso_de_que_NO_se_guarda_va_en_la_cabecera', () => {
  const texto = informeDeJornada([sesion({ orden: 0 })]);
  const lineas = texto.split('\n');
  const dondeAviso = lineas.findIndex((l) => l.includes('NO se guarda'));
  const dondePrimeraSesion = lineas.findIndex((l) => l.startsWith('--- Sesión'));
  assert.ok(dondeAviso >= 0, 'el aviso existe');
  assert.ok(dondeAviso < dondePrimeraSesion, 'y va ANTES de los datos, no al final');
  assert.ok(texto.includes(AVISO_SIN_GUARDAR));
});

test('test_el_aviso_dice_QUE_hacer_y_no_solo_que_se_pierde', () => {
  // Una advertencia sin salida no es informacion util para un profesional con prisa.
  assert.match(AVISO_SIN_GUARDAR, /historia clínica/);
  assert.match(AVISO_SIN_GUARDAR, /se pierde/);
});

test('test_la_limitacion_de_escala_esta_en_el_texto_copiable', () => {
  // Si se quedara en la pantalla, el numero llegaria a la historia clinica sin ella, y la
  // comparacion invalida —dos pacientes— es la que un profesional hace sin pensarlo.
  assert.ok(informeDeJornada([sesion({ orden: 0 })]).includes(LIMITACION_ESCALA));
});

test('test_el_recuento_de_sesiones_esta_bien_escrito_en_singular', () => {
  assert.match(informeDeJornada([sesion({ orden: 0 })]), /1 sesión\b/);
  assert.match(informeDeJornada([sesion({ orden: 0 }), sesion({ orden: 1 })]), /2 sesiones/);
});

test('test_sin_sesiones_NO_se_avisa_de_nada', () => {
  // No hay dato que perder, y un aviso permanente se convierte en ruido y deja de leerse.
  const texto = informeDeJornada([]);
  assert.doesNotMatch(texto, /NO se guarda/);
  assert.match(texto, /sin sesiones/);
});

// ---------------------------------------------------------------- los bloques

test('test_la_jornada_lleva_UN_bloque_por_sesion_y_en_orden', () => {
  const texto = informeDeJornada([
    sesion({ orden: 0, instrumento: 'busca' }),
    sesion({ orden: 1, instrumento: 'precios' }),
    sesion({ orden: 2, instrumento: 'comprar' }),
  ]);
  assert.equal(texto.match(/--- Sesión \d/g)?.length, 3);
  assert.ok(texto.indexOf('--- Sesión 1') < texto.indexOf('--- Sesión 2'));
  assert.ok(texto.indexOf('--- Sesión 2') < texto.indexOf('--- Sesión 3'));
});

test('test_las_sesiones_se_numeran_desde_1_para_el_terapeuta', () => {
  // `orden` es un contador interno que puede empezar donde sea. El terapeuta cuenta desde 1.
  const texto = informeDeJornada([sesion({ orden: 7 }), sesion({ orden: 8 })]);
  assert.ok(texto.includes('--- Sesión 1 ---'));
  assert.ok(texto.includes('--- Sesión 2 ---'));
  assert.ok(!texto.includes('--- Sesión 7'));
});

test('test_una_sesion_VACIA_no_publica_una_precision_de_cero', () => {
  // «0 tableros, precisión 0 %» se leeria como un paciente que fallo todo. Lo que paso es
  // que la sesion no llego a empezar.
  const s = sesion({ orden: 0 });
  s.tableros = [];
  const bloque = bloqueDeSesion(s, 1);
  assert.match(bloque, /no llegó a empezar/);
  assert.doesNotMatch(bloque, /0 %/);
});

test('test_los_tableros_SIN_TERMINAR_se_cuentan_en_el_informe', () => {
  // Sin ese recuento, el terapeuta lee una precision mas baja que la real y no sabe por que.
  const conIncompleto = bloqueDeSesion(sesion({ orden: 0, incompleto: true }), 1);
  assert.match(conIncompleto, /sin resolver/);
  const sinIncompleto = bloqueDeSesion(sesion({ orden: 0 }), 1);
  assert.doesNotMatch(sinIncompleto, /sin resolver/);
});

test('test_el_nombre_del_ejercicio_se_muestra_LEGIBLE', () => {
  const bloque = bloqueDeSesion(
    sesion({ orden: 0, instrumento: 'tresEnRaya' }), 1,
    { etiquetas: { tresEnRaya: 'Tres en raya' } },
  );
  assert.match(bloque, /Ejercicios: Tres en raya/);
});

test('test_sin_etiqueta_se_usa_el_IDENTIFICADOR_y_no_se_omite', () => {
  // Omitirlo dejaria un informe que no dice a que jugo el paciente.
  assert.match(bloqueDeSesion(sesion({ orden: 0, instrumento: 'busca' }), 1), /Ejercicios: busca/);
});

// ---------------------------------------------------------------- las reglas heredadas

test('test_una_latencia_de_VIAS_MEZCLADAS_no_publica_una_media', () => {
  const s = sesion({ orden: 0, modo: 'pulsador', ms: 336 });
  const t = s.tableros[0];
  if (t === undefined) throw new Error('fixture');
  t.intentos.push({ idActivado: 'y', correcto: true, latencia: { ms: 606 }, modo: 'raton' });

  const bloque = bloqueDeSesion(s, 1);
  assert.match(bloque, /vias de acceso distintas/);
  // La media mezclada de 336 (x3) y 606 seria 403,5. No puede aparecer.
  assert.doesNotMatch(bloque, /403/);
  // Y el desglose SI aparece, con lo que cada fila incluye.
  assert.match(bloque, /espera del barrido/);
});

test('test_una_sesion_que_mezcla_EJERCICIOS_no_publica_una_precision_de_sesion', () => {
  // El defecto medido: 2/2 en un ejercicio y 0/3 en otro daban 40 %, un numero que no le
  // paso a nadie.
  const s = sesion({ orden: 0, instrumento: 'busca', aciertos: 2, fallos: 0 });
  const t = s.tableros[0];
  if (t === undefined) throw new Error('fixture');
  s.tableros.push({
    ...t, instrumento: 'precios',
    intentos: Array.from({ length: 3 }, () => ({
      idActivado: 'z', correcto: false, latencia: { ms: 400 },
      modo: /** @type {const} */ ('tactil'),
    })),
  });

  const bloque = bloqueDeSesion(s, 1, { etiquetas: { busca: 'Busca', precios: 'Precio justo' } });
  assert.doesNotMatch(bloque, /40 %/, 'la precision mezclada NO se publica');
  // Y el desglose por ejercicio si.
  assert.match(bloque, /Busca/);
  assert.match(bloque, /Precio justo/);
});

test('test_el_informe_incluye_TODAS_las_variantes_de_contenido', () => {
  // La pantalla muestra la activa, porque es la que el terapeuta esta tocando. El informe es
  // el registro de la jornada: dejar fuera una variante que el paciente jugo seria perder el
  // dato justo donde se guarda.
  const s = sesion({ orden: 0, instrumento: 'tresEnRaya', variante: 'sumaHasta10', aciertos: 5 });
  const t = s.tableros[0];
  if (t === undefined) throw new Error('fixture');
  s.tableros.push({ ...t, contenido: { id: 'multiplicar', ordinal: 3 } });

  const bloque = bloqueDeSesion(s, 1);
  assert.match(bloque, /sumaHasta10/);
  assert.match(bloque, /multiplicar/);
  assert.match(bloque, /2 tareas distintas/);
  assert.match(bloque, /NO se suman/);
});

test('test_una_metrica_sin_dato_escribe_el_MOTIVO_y_no_un_numero', () => {
  // Un solo acierto no llega al minimo de intentos de la dificultad tolerada.
  const bloque = bloqueDeSesion(sesion({ orden: 0, aciertos: 1 }), 1);
  assert.match(bloque, /Dificultad/);
  assert.doesNotMatch(bloque, /Dificultad[^\n]*: 20\.0/);
});

// ---------------------------------------------------------------- la hora, y el reparto

test('test_la_HORA_va_en_el_encabezado_de_cada_sesion', () => {
  // El terapeuta corta este texto en trozos y los pega en historias clinicas distintas.
  // Fuera de aqui, «Sesion 2» no se puede atribuir a un paciente.
  const texto = informeDeJornada(
    [sesion({ orden: 0 }), sesion({ orden: 1 })],
    { formatoHora: (ms) => (ms === 0 ? '09:30' : '11:05') },
  );
  assert.match(texto, /--- Sesión 1 · 09:30 ---/);
});

test('test_sin_funcion_de_hora_NO_se_inventa_una', () => {
  // `src/` no construye un `Date`: la hora local es una lectura del entorno. Sin funcion se
  // omite el dato, que es la regla de siempre — antes falta de dato que dato falso.
  const texto = informeDeJornada([sesion({ orden: 0 })]);
  assert.match(texto, /--- Sesión 1 ---/);
  assert.doesNotMatch(texto, /·/);
});

test('test_la_funcion_de_hora_recibe_el_SELLO_DE_PARED_de_esa_sesion', () => {
  const s = sesion({ orden: 3 });
  s.selloPared = 1770000000000;
  /** @type {number[]} */
  const recibidos = [];
  bloqueDeSesion(s, 1, { formatoHora: (ms) => { recibidos.push(ms); return 'x'; } });
  assert.deepStrictEqual(recibidos, [1770000000000]);
});

test('test_los_bloques_van_SEPARADOS_por_una_linea_en_blanco', () => {
  // Sin separacion, los limites entre pacientes no se ven de un vistazo al cortar el texto.
  const texto = informeDeJornada([sesion({ orden: 0 }), sesion({ orden: 1 })]);
  assert.match(texto, /\n\n--- Sesión 2 ---/);
});
