/**
 * Tipos de la plataforma. SOLO typedefs JSDoc — este archivo no contiene codigo
 * ejecutable y no importa nada.
 *
 * Las tres marcas nominales viven aqui. Ver ADR-0004: cuando dos valores comparten
 * forma y no significado, se les pone una marca discriminante OBLIGATORIA y la
 * incompatibilidad la hace cumplir `tsc --checkJs`.
 *
 * Sistema 3 · design/gdd/inyeccion-no-determinismo.md
 */

/**
 * Fuente de aleatoriedad de produccion. Devuelve un float en [0, 1).
 *
 * La marca `kind` es lo que impide que una funcion desnuda —`() => 0.42`, legitima
 * en un test— se conecte donde se espera una fuente de produccion. Sin ella, los dos
 * tipos son estructuralmente identicos y el error no se detecta en compilacion.
 *
 * La acuña UNICAMENTE `envolverConValidacion`, en `borde-impuro.js`.
 *
 * @typedef {{ (): number, kind: 'aleatoria' }} FuenteAleatoria
 */

/**
 * Reloj monotono. Mide DURACIONES y nada mas.
 *
 * Su origen es arbitrario y no esta anclado al calendario, asi que no sirve para
 * sellar un registro con una fecha.
 *
 * @typedef {{ kind: 'monotono', now: () => number }} RelojMonotono
 */

/**
 * Reloj de pared. Sella FECHAS y nada mas.
 *
 * Puede saltar —una correccion de reloj tras un periodo apagado mueve la hora sin que
 * transcurra tiempo real— asi que restar dos lecturas no mide una duracion. Este
 * contrato no expone ninguna operacion de diferencia: la operacion no existe.
 *
 * @typedef {{ kind: 'pared', now: () => number }} RelojPared
 */

/**
 * Lo que devuelve la fabrica de produccion: la semilla junto a la fuente, nunca la
 * fuente sola. Un consumidor no puede generar sin poder recuperar que semilla genero.
 *
 * @typedef {{ semilla: number, fuenteAleatoria: FuenteAleatoria }} FuenteDeProduccion
 */

/**
 * Resolucion medida del reloj monotono, en milisegundos.
 *
 * `performance.now()` esta degradado en resolucion por mitigaciones de Spectre, y el
 * grado depende del navegador y de la politica de privacidad. Se mide en ejecucion en
 * lugar de asumirse, porque si la granularidad se acerca a los 100 ms el presupuesto
 * de latencia del proyecto no tiene reloj que lo mida.
 *
 * @typedef {{ resolucionMs: number, muestras: number, fiableParaPresupuesto: boolean }} ResolucionReloj
 */

export {};
