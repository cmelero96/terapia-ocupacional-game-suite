/**
 * El informe de la jornada: texto plano, seleccionable y copiable.
 *
 * ## Por qué existe
 *
 * Todo lo que el producto mide vivía **solo dentro del panel**, repartido en bloques de DOM,
 * y sólo de la sesión en curso. Con eso, el terapeuta que acaba una jornada de tres pacientes
 * no tenía ninguna forma de sacar los datos: ni de leerlos juntos, ni de copiarlos a su propia
 * historia clínica. Al cerrar la pestaña se perdían.
 *
 * No hay persistencia en el primer hito, y eso **no cambia aquí**: la persistencia de datos de
 * salud es una decisión aplazada a una ADR (sistema 18), no un olvido. Lo que sí se puede
 * hacer sin decidir nada es **enseñar los datos en texto plano** para que el profesional los
 * copie a donde ya guarda la historia del paciente, que es donde tienen que estar.
 *
 * ## Reglas que hereda
 *
 * - **Ninguna métrica sin dato se convierte en un número.** Se escribe el motivo, igual que en
 *   la pantalla. Antes falta de dato que dato falso.
 * - **La limitación viaja junto al número**, en la misma línea. Un informe que se copia y se
 *   pega en otro documento pierde cualquier pie de página, así que no hay pies.
 * - **El aviso de que esto no se guarda va arriba**, no al final.
 *
 * Módulo PURO: no toca el DOM ni lee ningún reloj.
 *
 * design/gdd/resultados-sesion.md · design/gdd/registro-rendimiento.md
 */

import { resumenSesion } from '../registro/sesion.js';
import { dificultadTolerada } from '../dificultad/modelo.js';
import { observacionesPorVariante } from '../dificultad/contenido.js';
import {
  LIMITACION_ESCALA, presentarPrecision, presentarPorInstrumento, presentarLatencia,
  presentarLatenciaPorClase, presentarDificultadTolerada,
} from './presentar.js';

/**
 * El aviso de arriba. Es lo primero que se lee y lo primero que se copia.
 *
 * Dice las dos cosas por separado a propósito: que no se guarda, y qué tiene que hacer el
 * terapeuta en consecuencia. La primera sin la segunda es una advertencia sin salida.
 */
export const AVISO_SIN_GUARDAR =
  'AVISO: este informe NO se guarda en ningún sitio. Vive en la memoria del navegador y se '
  + 'pierde al cerrar la pestaña o al recargar la página. Cópialo a la historia clínica del '
  + 'paciente antes de cerrar.';

/**
 * Una métrica ya presentada, en una línea de texto.
 *
 * @param {import('./presentar.js').Presentado} m
 * @returns {string}
 */
function linea(m) {
  const base = `  ${m.etiqueta}: ${m.valor}`;
  return m.limitacion === undefined ? base : `${base}\n    (${m.limitacion})`;
}

/**
 * El bloque de una sesión.
 *
 * @param {import('../registro/sesion.js').Sesion} s
 * @param {number} numero El que ve el terapeuta: 1 para la primera de la jornada
 * @param {Record<string, string>} etiquetas Nombres de instrumento para mostrar
 * @returns {string}
 */
export function bloqueDeSesion(s, numero, etiquetas = {}) {
  const partes = [`--- Sesión ${numero} ---`];

  if (s.tableros.length === 0) {
    // No es un cero: es una sesión que no llegó a empezar. Un «0 tableros, precisión 0 %»
    // se leería como un paciente que falló todo.
    partes.push('  La sesión no llegó a empezar: ningún tablero terminado.');
    return partes.join('\n');
  }

  const res = resumenSesion(s);

  const nombres = res.instrumentos.map((i) => etiquetas[i] ?? i);
  partes.push(`  Ejercicios: ${nombres.join(', ')}`);
  partes.push(
    res.tablerosIncompletos === 0
      ? `  Tableros terminados: ${res.tableros}`
      : `  Tableros terminados: ${res.tableros}, de los cuales ${res.tablerosIncompletos} `
        + `sin resolver (${res.intentosIncompletos} activaciones)`,
  );

  partes.push(linea(presentarPrecision(res)));
  if (res.instrumentos.length > 1) {
    for (const f of presentarPorInstrumento(res, etiquetas)) partes.push(linea(f));
  }

  partes.push(linea(presentarLatencia(res, {
    resolucionMs: s.resolucionMs, fiableParaPresupuesto: s.fiableParaPresupuesto,
  })));
  const clases = [...res.latenciaPorClase.keys()];
  if (clases.length > 1 || (clases.length === 1 && clases[0] !== 'reaccion')) {
    for (const f of presentarLatenciaPorClase(res)) partes.push(linea(f));
  }

  // TODAS las variantes de contenido, no sólo la activa.
  //
  // La pantalla muestra la activa porque es la que el terapeuta está tocando. El informe es
  // el registro de la jornada: dejar fuera una variante que el paciente jugó sería perder el
  // dato justo en el sitio donde se guarda.
  const porVariante = observacionesPorVariante(s, 'dp');
  for (const [clave, obs] of porVariante) {
    const m = presentarDificultadTolerada(
      dificultadTolerada(obs, { acoplados: s.ejesAcoplados }),
      'perceptivo',
    );
    const sufijo = clave === null ? '' : ` [tarea: ${clave}]`;
    partes.push(linea({ ...m, etiqueta: `${m.etiqueta}${sufijo}` }));
  }
  if (porVariante.size > 1) {
    partes.push(
      `  Nota: la sesión tiene ${porVariante.size} tareas distintas. Sus números NO se suman.`,
    );
  }

  return partes.join('\n');
}

/**
 * El informe completo de la jornada.
 *
 * Incluye la sesión en curso si se le pasa: el terapeuta que termina el día quiere el informe
 * de los tres pacientes, no de los dos primeros.
 *
 * @param {import('../registro/sesion.js').Sesion[]} sesiones En orden de inserción
 * @param {object} [opciones]
 * @param {Record<string, string>} [opciones.etiquetas]
 * @returns {string}
 */
export function informeDeJornada(sesiones, { etiquetas = {} } = {}) {
  const cabecera = [
    `INFORME DE LA JORNADA — ${sesiones.length} `
    + `${sesiones.length === 1 ? 'sesión' : 'sesiones'}`,
    '',
    AVISO_SIN_GUARDAR,
    '',
    LIMITACION_ESCALA,
  ];

  if (sesiones.length === 0) {
    // Sin sesiones no hay nada que copiar, y el aviso sobra: no hay dato que perder.
    return 'INFORME DE LA JORNADA — sin sesiones todavía.';
  }

  const bloques = sesiones.map((s, i) => bloqueDeSesion(s, i + 1, etiquetas));
  return [...cabecera, '', ...bloques].join('\n');
}
