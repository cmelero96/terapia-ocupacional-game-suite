// @borde-impuro
//
// ESTE ES EL UNICO ARCHIVO DE `src/` EXENTO DE LA REGLA 1.
//
// El marcador `@borde-impuro` de la primera linea es lo que cuenta AC-2, y el conteo
// debe dar exactamente 1 en todo `src/`. Si aparece un segundo archivo con este
// marcador, el build rompe nombrando los dos: fragmentar el borde es la forma de
// cumplir la regla 1 a la letra e incumplirla en espiritu.
//
// Aqui viven las tres unicas llamadas a fuentes no deterministas del entorno:
// `crypto.getRandomValues`, `performance.now` y `Date.now`. Todo lo demas en `src/`
// las recibe como parametro.
//
// Este archivo NO reparte. Construir y repartir son cosas distintas: la raiz de
// composicion pertenece al sistema 10, importa esta fabrica y pasa los valores hacia
// abajo. No necesita exencion, porque no llama a ninguna fuente — solo mueve
// parametros.
//
// Sistema 3 · F3, F4 y F5 de design/gdd/inyeccion-no-determinismo.md

import { crearFuenteAleatoria } from './aleatoriedad.js';

/**
 * F3 — de donde sale la semilla real.
 *
 * Se elige `crypto.getRandomValues` sobre `Date.now()` por **granularidad**, no por
 * criptografia: hay una llamada por tablero, y `Date.now()` tiene resolucion de
 * milisegundo, asi que dos tableros generados en el mismo milisegundo recibirian la
 * misma semilla y produciran el mismo tablero. Un tablero repetido no es un fallo
 * visible: es contaminacion por habituacion entrando en el registro como dato limpio.
 *
 * Sembrar un generador rapido con una fuente fuerte es la practica normal. Lo que se
 * compra es unicidad de la semilla, no imprevisibilidad de la secuencia.
 *
 * **La salida de mulberry32 NO vale para nada que deba ser imprevisible** — tokens,
 * codigos de emparejamiento, identificadores. Esas necesidades llaman a
 * `crypto.getRandomValues` directamente.
 *
 * `getRandomValues` es el unico miembro de `Crypto` que funciona en contexto no
 * seguro, a diferencia de `crypto.subtle` y de `crypto.randomUUID`. Por eso F3 arranca
 * sobre HTTP plano y desde `file://`. **No "simplificar" hacia `randomUUID`**: eso
 * introduciria el requisito de contexto seguro que hoy no existe.
 *
 * @returns {number} uint32 en [0, 4294967295]
 * @throws {Error} Si `crypto.getRandomValues` no esta disponible o no devuelve valor.
 *   Falla explicito, nunca degradacion silenciosa a `Date.now()`
 */
export function semillaProduccion() {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error(
      'semillaProduccion: crypto.getRandomValues no esta disponible en este navegador',
    );
  }
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const semilla = buf[0];
  if (semilla === undefined) {
    throw new Error('semillaProduccion: crypto no devolvio valor');
  }
  return semilla;
}

/**
 * F5 — el acuñador unico de la marca `FuenteAleatoria`.
 *
 * Valida cada valor que la fuente envuelta devuelve. Es el unico punto del sistema
 * donde una fuente inyectada se comprueba en ejecucion: F1 genera su valor por
 * aritmetica y nunca recibe uno externo, y `barajar` usa el resultado sin mirarlo.
 *
 * El cast es obligatorio y vive aqui, una sola vez. `Object.assign` sin cast no vale:
 * `kind` se ensancha a `string`. Aguas abajo no hay ningun cast.
 *
 * @param {() => number} fn
 * @returns {import('./esquema.js').FuenteAleatoria}
 */
export function envolverConValidacion(fn) {
  const validada = () => {
    const v = fn();
    if (!(v >= 0 && v < 1)) {
      throw new RangeError(`fuente aleatoria devolvio ${String(v)}, se esperaba [0, 1)`);
    }
    return v;
  };
  return /** @type {import('./esquema.js').FuenteAleatoria} */ (
    Object.assign(validada, { kind: 'aleatoria' })
  );
}

/**
 * La semilla junto a la fuente, nunca la fuente sola. Sujeto de AC-6.
 *
 * Una llamada por tablero: el sistema 9 graba esta semilla junto al tablero, y
 * reproducirlo es volver a sembrar y repetir la logica de generacion, sin necesidad de
 * rastrear cuantas llamadas se consumieron antes.
 *
 * @returns {import('./esquema.js').FuenteDeProduccion}
 */
export function crearFuenteDeProduccion() {
  const semilla = semillaProduccion();
  return { semilla, fuenteAleatoria: envolverConValidacion(crearFuenteAleatoria(semilla)) };
}

/**
 * F4 — reloj monotono. Mide DURACIONES.
 *
 * El presupuesto de latencia del proyecto —menos de 100 ms entre el toque y su acuse
 * de recibo visible— se mide con este reloj y nunca con el de pared. Es su razon de
 * ser.
 *
 * @type {import('./esquema.js').RelojMonotono}
 */
export const relojMonotono = { kind: 'monotono', now: () => performance.now() };

/**
 * F4 — reloj de pared. Sella FECHAS.
 *
 * Puede saltar. La causa real en este producto no es el cambio de hora estacional
 * —`Date.now()` es epoch UTC y el horario de verano solo cambia el formateo— sino una
 * tableta que pasa semanas apagada, acumula desviacion en su reloj de tiempo real y da
 * la correccion de golpe al reconectarse.
 *
 * Este contrato **no expone una operacion de diferencia**, y eso es deliberado: no es
 * una convencion que alguien deba recordar, la operacion no existe.
 *
 * @type {import('./esquema.js').RelojPared}
 */
export const relojPared = { kind: 'pared', now: () => Date.now() };

/**
 * Mide la resolucion real del reloj monotono, en ejecucion.
 *
 * Existe porque `performance.now()` esta degradado en resolucion por mitigaciones de
 * Spectre, y el grado depende del navegador y de la politica de privacidad — hasta el
 * orden de 100 ms en modos de privacidad reforzada, que es el mismo orden que el
 * presupuesto de latencia del proyecto. Un reloj asi no puede medir ese presupuesto.
 *
 * Medirlo en arranque en lugar de asumirlo elimina la dependencia de conocer el
 * hardware por adelantado: el sistema 9 registra este valor junto a la sesion, asi que
 * una latencia siempre viene acompañada de la precision con la que se tomo.
 *
 * Metodo: consumir CPU hasta observar `muestras` incrementos distintos del reloj, y
 * quedarse con el salto minimo observado. El salto minimo es la granularidad.
 *
 * @param {number} [muestras] Incrementos distintos a observar. Por defecto 20
 * @returns {import('./esquema.js').ResolucionReloj}
 */
export function medirResolucionReloj(muestras = 20) {
  const saltos = [];
  let anterior = performance.now();
  // Cota de seguridad: con un reloj muy grosero, esperar 20 saltos podria tardar.
  // 2e7 iteraciones son decimas de segundo en hardware de 2026.
  for (let i = 0; i < 2e7 && saltos.length < muestras; i++) {
    const ahora = performance.now();
    if (ahora > anterior) {
      saltos.push(ahora - anterior);
      anterior = ahora;
    }
  }
  // Sin ninguna muestra no hay dato, y falta de dato FALLA: nunca devolver 0, que se
  // leeria como "resolucion perfecta". Es el patron prohibido de `Math.min()` sobre
  // conjunto vacio.
  if (saltos.length === 0) {
    throw new Error('medirResolucionReloj: el reloj no avanzo en ninguna iteracion');
  }
  const resolucionMs = Math.min(...saltos);
  return {
    resolucionMs,
    muestras: saltos.length,
    // Un decimo del presupuesto de 100 ms. Con 10 ms o peor, una latencia individual
    // deja de ser interpretable.
    fiableParaPresupuesto: resolucionMs <= 10,
  };
}
