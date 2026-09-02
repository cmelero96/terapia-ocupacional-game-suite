/**
 * Constantes de la capa de adaptacion de entrada. Sistema 5.
 *
 * Fuente de verdad: `design/registry/entities.yaml`.
 *
 * Sistema 5 · design/gdd/capa-adaptacion-entrada.md
 */

/** Suelo de la cadencia de barrido. Por debajo nadie llega a reaccionar. SIN VALIDAR. */
export const MS_PASO_MIN = 400;

/** Techo de la cadencia de barrido. Por encima la espera es cruel. SIN VALIDAR. */
export const MS_PASO_MAX = 4000;

/** Suelo absoluto de la zona de tolerancia, en px CSS. SIN VALIDAR. */
export const PX_TOLERANCIA_MIN = 8;

/**
 * Fraccion del tamaño de objetivo que define la zona de tolerancia. SIN VALIDAR.
 *
 * Escala con el tamaño a proposito: un objetivo de 140 px con 8 px de tolerancia seria
 * igual de intolerante que uno de 24, cuando el terapeuta ha subido el tamaño
 * precisamente porque el paciente no apunta fino.
 */
export const RATIO_TOLERANCIA = 0.25;

/** Tiempo de una vuelta completa del barrido. Perilla CLINICA. */
export const MS_VUELTA_POR_DEFECTO = 12000;

/** Tiempo sobre el objetivo para que la permanencia active. Perilla CLINICA. */
export const MS_PERMANENCIA_POR_DEFECTO = 800;

/**
 * Los cinco modos de acceso. `modo` viaja SOLO para el registro: un instrumento que lo
 * lea para ramificar comportamiento esta roto, y el sistema 14 lo vigila.
 *
 * @typedef {'tactil' | 'raton' | 'teclado' | 'pulsador' | 'permanencia'} Modo
 */

/**
 * Qué cantidad mide una latencia en cada vía. **No son comparables entre clases.**
 *
 * | Clase | Vías | Qué incluye |
 * |---|---|---|
 * | `reaccion` | táctil, ratón, teclado | el tiempo de reacción |
 * | `barrido` | pulsador | la espera de que el barrido llegue, MÁS la reacción |
 * | `permanencia` | permanencia | el umbral de permanencia, MÁS la reacción |
 *
 * Medido: 424 ms con pulsador a 500 ms por paso, y 1.036 ms con una permanencia de 600 ms.
 * Los dos están dominados por su propio ajuste, no por el paciente.
 *
 * Promediar dos clases produce un número que no es de ninguna de las dos — la misma forma que
 * mezclar instrumentos o variantes de contenido.
 *
 * @type {Readonly<Record<Modo, 'reaccion' | 'barrido' | 'permanencia'>>}
 */
export const CLASE_DE_LATENCIA = Object.freeze({
  tactil: 'reaccion',
  raton: 'reaccion',
  teclado: 'reaccion',
  pulsador: 'barrido',
  permanencia: 'permanencia',
});

/**
 * @param {Modo | undefined} modo
 * @returns {'reaccion' | 'barrido' | 'permanencia' | 'desconocida'}
 */
export function claseDeLatencia(modo) {
  if (modo === undefined) return 'desconocida';
  return CLASE_DE_LATENCIA[modo] ?? 'desconocida';
}

/**
 * De donde salio la marca de tiempo de una activacion.
 *
 * ## Dos conceptos que estaban confundidos en uno, y eso rompio la latencia
 *
 * Este typedef mezclaba **procedencia** —¿vino del evento o de una lectura de reloj?— con
 * **comparabilidad** —¿se pueden restar dos marcas?—. Y `latencia()` rechazaba cualquier par
 * con etiquetas distintas, asi que un `'evento'` contra un `'reloj'` daba siempre
 * `origenesMezclados`.
 *
 * El tablero marca su inicio con una lectura del reloj monotono y la activacion trae
 * `event.timeStamp`. Nunca coincidian. **Resultado medido: ninguna latencia se midio nunca,
 * en ningun modo de entrada.** Una de las dos metricas del producto.
 *
 * Y es falso que no sean comparables. Medido en el navegador:
 *
 * ```
 * event.timeStamp : 856.7
 * performance.now : 856.7      diferencia: 0.00 ms
 * ```
 *
 * **Son el mismo reloj.** `event.timeStamp` es un `DOMHighResTimeStamp` con el mismo origen
 * de tiempo que `performance.now()` dentro del mismo documento.
 *
 * La regla del proyecto dice: *«un `event.timeStamp` y una lectura del reloj monotono **de
 * otra carga de pagina** no son comparables»*. La implementacion la aplicaba dentro de la
 * misma carga, donde si lo son.
 *
 * ## Ahora
 *
 * La etiqueta conserva la PROCEDENCIA, que es informacion util: una marca del evento dice
 * cuando ocurrio la entrada, y una lectura de reloj dice cuando se ejecuto el JavaScript.
 * La COMPARABILIDAD la decide `claseDeReloj`, y ahi `'evento'` y `'reloj'` son la misma clase.
 *
 * `'pared'` es la que de verdad no se puede mezclar: un `event.timeStamp` heredado basado en
 * epoch, que algunos navegadores antiguos producen.
 *
 * @typedef {'evento' | 'reloj' | 'pared'} OrigenTiempo
 */

/**
 * A que reloj pertenece cada procedencia. **Solo esto decide si dos marcas se pueden restar.**
 *
 * @type {Readonly<Record<OrigenTiempo, 'monotono' | 'pared'>>}
 */
export const CLASE_DE_RELOJ = Object.freeze({
  evento: 'monotono',
  reloj: 'monotono',
  pared: 'pared',
});

/**
 * @param {OrigenTiempo} origen
 * @returns {'monotono' | 'pared'}
 */
export function claseDeReloj(origen) {
  return CLASE_DE_RELOJ[origen] ?? 'pared';
}

export {};
