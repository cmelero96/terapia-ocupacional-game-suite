/**
 * Instrumento Clasificar por categorias. Sistema 21.
 *
 * **Dos toques, nunca arrastre.** Seleccionar el objeto, despues el contenedor de destino.
 * Es lo que el patron prohibido del proyecto exige, y lo que WCAG 2.2 criterio 2.5.7 pide
 * como alternativa — salvo que aqui el arrastre no existe en absoluto.
 *
 * **Solo la SEGUNDA activacion registra.** Un paciente que selecciona y se lo piensa no
 * genera datos, igual que un aborto de puntero en el sistema 5.
 *
 * design/gdd/instrumentos-clasificar-y-denominar.md
 */

import { barajar } from '../plataforma/aleatoriedad.js';

/** Con uno no hay clasificacion. */
export const N_CONTENEDORES_MIN = 2;

/**
 * Con mas de cuatro, la pantalla no cabe junto al tablero al tamaño de objetivo del rango
 * clinico. Es la PRIMERA perilla que un instrumento añade al proyecto.
 */
export const N_CONTENEDORES_MAX = 4;

/**
 * Un elemento solo puede ser objetivo de clasificar si tiene al menos una categoria.
 *
 * @param {{ categories: string[] }} elemento
 * @returns {boolean}
 */
export function puedeSerObjetivo(elemento) {
  return elemento.categories.length > 0;
}

/**
 * F2 — los contenedores de destino.
 *
 * **Al menos uno es siempre correcto, por construccion.** Un ejercicio imposible es peor
 * que uno dificil, porque el paciente no puede saber que lo es.
 *
 * Si no hay categorias suficientes se RECHAZA, no se repite: dos contenedores con la misma
 * etiqueta harian la tarea ambigua sin decirlo.
 *
 * @param {object} entrada
 * @param {string[]} entrada.categoriasObjetivo
 * @param {string[]} entrada.todasLasCategorias
 * @param {number} entrada.nContenedores
 * @param {() => number} entrada.fuenteAleatoria
 * @returns {string[]} Etiquetas barajadas, sin repeticiones
 */
export function contenedores({
  categoriasObjetivo, todasLasCategorias, nContenedores, fuenteAleatoria,
}) {
  if (!Number.isInteger(nContenedores)
    || nContenedores < N_CONTENEDORES_MIN || nContenedores > N_CONTENEDORES_MAX) {
    throw new RangeError(
      `nContenedores: ${String(nContenedores)} fuera del rango ` +
      `[${N_CONTENEDORES_MIN}, ${N_CONTENEDORES_MAX}]`,
    );
  }
  if (categoriasObjetivo.length === 0) {
    throw new Error('contenedores: el objetivo no tiene ninguna categoria');
  }

  const distintas = new Set(todasLasCategorias);
  if (distintas.size < nContenedores) {
    throw new RangeError(
      `el banco tiene ${distintas.size} categorias distintas: no se pueden poner ` +
      `${nContenedores} contenedores sin repetir etiqueta`,
    );
  }

  const propias = new Set(categoriasObjetivo);
  const correcto = barajar(categoriasObjetivo, fuenteAleatoria)[0];
  const ajenas = barajar(
    [...distintas].filter((c) => !propias.has(c)),
    fuenteAleatoria,
  );

  /** @type {string[]} */
  const salida = [/** @type {string} */ (correcto)];
  for (const c of ajenas) {
    if (salida.length >= nContenedores) break;
    salida.push(c);
  }
  // Si el objetivo pertenece a casi todas las categorias, se completan con OTRAS suyas.
  // Siguen siendo aciertos, y eso es correcto: es la consecuencia de `categories[]`
  // multiple, y es lo que hace la tarea interesante.
  for (const c of barajar(categoriasObjetivo, fuenteAleatoria)) {
    if (salida.length >= nContenedores) break;
    if (!salida.includes(c)) salida.push(c);
  }

  return barajar(salida, fuenteAleatoria);
}

/**
 * @typedef {import('./busca.js').Estimulo & { categories: string[] }} EstimuloClasificable
 */

/**
 * Estado del instrumento. PURO: no toca el DOM.
 */
export class Clasificar {
  /**
   * @param {object} entrada
   * @param {number} entrada.t
   * @param {(id: string) => EstimuloClasificable} entrada.resolver
   * @param {() => import('../tablero/generador.js').Tablero} entrada.siguienteTablero
   * @param {() => string[]} entrada.contenedoresDelTablero
   */
  constructor({ t, resolver, siguienteTablero, contenedoresDelTablero }) {
    /** @type {number} */
    this.t = t;
    /** @type {(id: string) => EstimuloClasificable} */
    this.resolver = resolver;
    /** @type {() => import('../tablero/generador.js').Tablero} */
    this.siguienteTablero = siguienteTablero;
    /** @type {() => string[]} */
    this.contenedoresDelTablero = contenedoresDelTablero;
    /** @type {import('../tablero/generador.js').Tablero} */
    this.tablero = siguienteTablero();
    /** @type {string[]} */
    this.contenedores = contenedoresDelTablero();
    /** @type {import('../registro/sesion.js').Intento[]} */
    this.intentos = [];
    /** @type {number} */
    this.tableroNumero = 1;
    /**
     * La seleccion NO es el foco. El foco lo usa el barrido para recorrer, y la seleccion
     * es un estado distinto que sobrevive al movimiento del foco.
     *
     * @type {string | null}
     */
    this.seleccionado = null;
    /** @type {'clasificar'} */
    this.instrumento = 'clasificar';
  }

  /** @returns {import('./busca.js').Estimulo} */
  objetivo() {
    return this.resolver(this.tablero.objetivo);
  }

  /** @returns {import('./busca.js').Estimulo[]} */
  celdas() {
    return this.tablero.celdas.map((id) => this.resolver(id));
  }

  /**
   * Procesa una activacion. **No lee el modo de entrada para decidir nada.**
   *
   * @param {import('../entrada/adaptador.js').EventoActivacion} evento
   * @param {import('../registro/sesion.js').Latencia} latencia
   * @param {'objeto' | 'contenedor'} clase Que se activo
   * @returns {{ registrado: boolean, correcto: boolean, avanza: boolean }}
   */
  activar(evento, latencia, clase) {
    if (clase === 'objeto') {
      // Seleccionar, deseleccionar o cambiar de seleccion. NADA se registra.
      this.seleccionado = this.seleccionado === evento.idObjetivo ? null : evento.idObjetivo;
      return { registrado: false, correcto: false, avanza: false };
    }

    // Activar un contenedor sin seleccion no hace NADA. No es un fallo.
    if (this.seleccionado === null) {
      return { registrado: false, correcto: false, avanza: false };
    }

    const cats = this.resolver(this.seleccionado).categories;
    const correcto = cats.includes(evento.idObjetivo);
    this.intentos.push({ idActivado: evento.idObjetivo, correcto, latencia });
    this.seleccionado = null;

    if (correcto) {
      this.tablero = this.siguienteTablero();
      this.contenedores = this.contenedoresDelTablero();
      this.tableroNumero += 1;
    }
    return { registrado: true, correcto, avanza: correcto };
  }

  /** La seleccion no sobrevive a la pausa, igual que el tablero. */
  limpiarSeleccion() {
    this.seleccionado = null;
  }

  /** @returns {false} */
  haTerminado() {
    return false;
  }
}
