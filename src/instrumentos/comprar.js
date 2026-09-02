/**
 * Juego de comprar. Juego 7 de la lista.
 *
 * Una lista de la compra y un lineal de productos. El paciente coge los de la lista.
 *
 * Es el primer instrumento con **varios objetivos a la vez**, y eso cambia dos cosas:
 *
 * **1 · La lista es la carga de memoria de trabajo que ningun otro instrumento tenia.** El
 * sistema 15 identifico la capacidad A9 sin instrumento; este la carga, porque el paciente
 * tiene que retener que le falta mientras busca. Y por eso la lista **se queda visible**:
 * ocultarla convertiria esto en un ejercicio de memoria pura, que es otra tarea. Ocultarla
 * es una perilla futura, no el comportamiento por defecto.
 *
 * **2 · El fallo no retira nada de la lista.** Coger algo que no toca no marca nada y no
 * quita el articulo pendiente: el pilar 2 prohibe marcar el fallo, y tachar de la lista lo
 * que no se ha cogido seria marcarlo.
 */

import { barajar } from '../plataforma/aleatoriedad.js';

/**
 * @typedef {import('./busca.js').Estimulo & { euros: number }} Articulo
 */

/**
 * Estado del instrumento. PURO: no toca el DOM.
 */
export class Comprar {
  /**
   * @param {object} entrada
   * @param {number} entrada.t
   * @param {readonly { id: string, nombre: string, glifo: string, euros: number }[]} entrada.catalogo
   * @param {number} entrada.C Articulos en el lineal
   * @param {number} entrada.nLista Cuantos hay que comprar
   * @param {() => { semilla: number, fuenteAleatoria: import('../plataforma/esquema.js').FuenteAleatoria }} entrada.nuevaFuente
   */
  constructor({ t, catalogo, C, nLista, nuevaFuente }) {
    if (catalogo.length < 2) throw new RangeError('Comprar: el catalogo necesita 2 articulos');
    /** @type {number} */
    this.t = t;
    /** @type {readonly { id: string, nombre: string, glifo: string, euros: number }[]} */
    this.catalogo = catalogo;
    /** @type {number} */
    this.C = Math.min(Math.max(C, 2), catalogo.length);
    /**
     * La lista nunca puede ser mas larga que el lineal: un articulo que no esta en el
     * lineal no se puede coger, y el paciente no tiene forma de saber que es imposible.
     *
     * @type {number}
     */
    this.nLista = Math.min(Math.max(nLista, 1), this.C);
    /** @type {() => { semilla: number, fuenteAleatoria: import('../plataforma/esquema.js').FuenteAleatoria }} */
    this.nuevaFuente = nuevaFuente;
    /** @type {import('../registro/sesion.js').Intento[]} */
    this.intentos = [];
    /** @type {number} */
    this.tableroNumero = 1;
    /** @type {'comprar'} */
    this.instrumento = 'comprar';
    /** @type {{ lista: string[], lineal: string[], semilla: number }} */
    this.compra = this.#sortear();
    /** @type {string[]} */
    this.cogidos = [];
  }

  #sortear() {
    const { semilla, fuenteAleatoria } = this.nuevaFuente();
    const lineal = barajar([...this.catalogo], fuenteAleatoria)
      .slice(0, this.C)
      .map((a) => a.id);
    // La lista sale SIEMPRE del lineal: todo lo pedido se puede coger.
    const lista = barajar(lineal, fuenteAleatoria).slice(0, this.nLista);
    return { lista, lineal: barajar(lineal, fuenteAleatoria), semilla };
  }

  /** @param {string} id */
  #articulo(id) {
    const a = this.catalogo.find((x) => x.id === id);
    if (a === undefined) return { id, nombre: `desconocido: ${id}`, glifo: '?', euros: 0 };
    return a;
  }

  /**
   * La zona de referencia es LA LISTA, y se queda visible.
   *
   * Ocultarla convertiria esto en memoria pura, que es otra tarea. Los ya cogidos se
   * marcan con un punto; **los pendientes no se marcan de ninguna forma**, para que la
   * ausencia de marca no se lea como reproche.
   */
  objetivo() {
    const texto = this.compra.lista
      .map((id) => `${this.cogidos.includes(id) ? '• ' : ''}${this.#articulo(id).nombre}`)
      .join(' · ');
    return { id: 'lista', nombre: texto, glifo: '🧺' };
  }

  /**
   * El lineal. Los ya cogidos desaparecen: dejarlos visibles invitaria a cogerlos otra vez,
   * y una segunda activacion sobre lo mismo no es un dato.
   *
   * @returns {import('./busca.js').Estimulo[]}
   */
  celdas() {
    return this.compra.lineal
      .filter((id) => !this.cogidos.includes(id))
      .map((id) => {
        const a = this.#articulo(id);
        return { id: a.id, nombre: a.nombre, glifo: a.glifo };
      });
  }

  /** Lo que falta por coger. Solo para el registro y el panel. */
  pendientes() {
    return this.compra.lista.filter((id) => !this.cogidos.includes(id));
  }

  /**
   * @param {import('../entrada/adaptador.js').EventoActivacion} evento
   * @param {import('../registro/sesion.js').Latencia} latencia
   * @returns {{ registrado: boolean, correcto: boolean, avanza: boolean }}
   */
  activar(evento, latencia) {
    const id = evento.idObjetivo;
    if (this.cogidos.includes(id)) return { registrado: false, correcto: false, avanza: false };
    if (!this.compra.lineal.includes(id)) {
      return { registrado: false, correcto: false, avanza: false };
    }

    const correcto = this.compra.lista.includes(id);
    this.intentos.push({ idActivado: id, correcto, latencia, modo: evento.modo });

    if (!correcto) {
      // Coger algo que no toca no marca nada y NO retira nada de la lista. Tachar lo que
      // no se ha cogido seria marcar el fallo.
      return { registrado: true, correcto: false, avanza: false };
    }

    this.cogidos.push(id);
    const completa = this.pendientes().length === 0;
    if (completa) {
      this.compra = this.#sortear();
      this.cogidos = [];
      this.tableroNumero += 1;
    }
    return { registrado: true, correcto: true, avanza: true };
  }

  /** El total de la compra pedida, en euros. Para el panel del terapeuta. */
  totalPedido() {
    return this.compra.lista.reduce((suma, id) => suma + this.#articulo(id).euros, 0);
  }

  /** La compra en curso no sobrevive a la pausa. */
  limpiarSeleccion() {
    this.cogidos = [];
  }

  /** Forma de tablero, para que el registro sea igual que el de los demas. */
  get tablero() {
    return {
      objetivo: /** @type {string} */ (this.compra.lista[0]),
      distractores: this.compra.lineal.filter((id) => !this.compra.lista.includes(id)),
      celdas: this.compra.lineal,
      semilla: this.compra.semilla,
      svPedida: 0, ssPedida: 0, svEfectiva: 0, ssEfectiva: 0,
    };
  }

  /** @returns {false} */
  haTerminado() {
    return false;
  }
}
