/**
 * Instrumento Ordenar palabras. Juego 3 de la lista.
 *
 * Una frase desordenada. El paciente la reconstruye tocando las palabras **en orden**.
 *
 * Es el primer instrumento del proyecto con **estado de secuencia**: cada activacion
 * añade al final, y eso cambia dos cosas respecto a los demas.
 *
 * **La longitud de la frase es la perilla de dificultad**, y encaja con `C` del sistema 4
 * sin inventar una perilla nueva.
 *
 * **Y cada palabra colocada se registra como un intento**, no la frase entera: si solo se
 * registrara la frase, un paciente que acierta cuatro palabras de cinco daria el mismo dato
 * que uno que no acierta ninguna.
 */

import { barajar } from '../plataforma/aleatoriedad.js';

/**
 * Estado del instrumento. PURO: no toca el DOM.
 */
export class Ordenar {
  /**
   * @param {object} entrada
   * @param {number} entrada.t
   * @param {readonly { id: string, palabras: string[] }[]} entrada.frases
   * @param {number} entrada.C Longitud de frase objetivo. Se elige la mas cercana
   * @param {() => { semilla: number, fuenteAleatoria: import('../plataforma/esquema.js').FuenteAleatoria }} entrada.nuevaFuente
   */
  constructor({ t, frases, C, nuevaFuente }) {
    /** @type {number} */
    this.t = t;
    /** @type {readonly { id: string, palabras: string[] }[]} */
    this.frases = frases;
    /** @type {number} */
    this.C = C;
    /** @type {() => { semilla: number, fuenteAleatoria: import('../plataforma/esquema.js').FuenteAleatoria }} */
    this.nuevaFuente = nuevaFuente;
    /** @type {import('../registro/sesion.js').Intento[]} */
    this.intentos = [];
    /** @type {number} */
    this.tableroNumero = 1;
    /** @type {'ordenar'} */
    this.instrumento = 'ordenar';
    /** @type {{ id: string, correcta: string[], mezcladas: string[], semilla: number }} */
    this.frase = this.#sortear();
    /**
     * Indices de `mezcladas` ya colocados, en el orden en que se colocaron.
     * @type {number[]}
     */
    this.colocadas = [];
  }

  #sortear() {
    const { semilla, fuenteAleatoria } = this.nuevaFuente();
    // La frase mas cercana a `C` palabras. Si hay varias, se sortea entre ellas.
    const distancias = this.frases.map((f) => Math.abs(f.palabras.length - this.C));
    const minima = Math.min(...distancias);
    const candidatas = this.frases.filter((_, i) => distancias[i] === minima);
    const f = /** @type {typeof candidatas[number]} */ (
      barajar([...candidatas], fuenteAleatoria)[0]
    );
    let mezcladas = barajar(f.palabras, fuenteAleatoria);
    // Si el azar devuelve la frase ya ordenada, no hay tarea. Se rebaraja una vez.
    if (mezcladas.join(' ') === f.palabras.join(' ') && f.palabras.length > 1) {
      mezcladas = barajar(mezcladas, fuenteAleatoria);
    }
    return { id: f.id, correcta: [...f.palabras], mezcladas, semilla };
  }

  /** La zona de referencia muestra lo colocado hasta ahora. */
  objetivo() {
    const hechas = this.colocadas.map((i) => this.frase.mezcladas[i]);
    const pendientes = this.frase.correcta.length - hechas.length;
    return {
      id: this.frase.id,
      nombre: hechas.length === 0
        ? 'ordena las palabras'
        : `${hechas.join(' ')}${pendientes > 0 ? ' …' : ''}`,
      glifo: '',
    };
  }

  /**
   * Las palabras que quedan por colocar. Las ya colocadas desaparecen del tablero: dejarlas
   * visibles y desactivadas ocuparia superficie sin ser alcanzables, y con `C` alto eso
   * empuja al tablero fuera de la pantalla.
   *
   * @returns {import('./busca.js').Estimulo[]}
   */
  celdas() {
    return this.frase.mezcladas
      .map((p, i) => ({ p, i }))
      .filter(({ i }) => !this.colocadas.includes(i))
      .map(({ p, i }) => ({ id: `${i}:${p}`, nombre: p, glifo: p }));
  }

  /** @returns {string} La palabra que toca colocar ahora */
  siguientePalabra() {
    return /** @type {string} */ (this.frase.correcta[this.colocadas.length]);
  }

  /**
   * @param {import('../entrada/adaptador.js').EventoActivacion} evento
   * @param {import('../registro/sesion.js').Latencia} latencia
   * @returns {{ registrado: boolean, correcto: boolean, avanza: boolean }}
   */
  activar(evento, latencia) {
    const partes = evento.idObjetivo.split(':');
    const indice = Number(partes[0]);
    const palabra = partes.slice(1).join(':');
    if (!Number.isInteger(indice) || this.colocadas.includes(indice)) {
      return { registrado: false, correcto: false, avanza: false };
    }

    const correcto = palabra === this.siguientePalabra();
    // Cada palabra es un intento. Registrar solo la frase completa perderia que un paciente
    // acerto cuatro de cinco.
    this.intentos.push({ idActivado: evento.idObjetivo, correcto, latencia, modo: evento.modo });

    if (!correcto) {
      // Activar mal no hace NADA visible y no retrocede: el pilar 2 prohibe marcar el
      // fallo, y deshacer lo ya colocado seria marcarlo.
      return { registrado: true, correcto: false, avanza: false };
    }

    this.colocadas.push(indice);
    const completa = this.colocadas.length === this.frase.correcta.length;
    if (completa) {
      this.frase = this.#sortear();
      this.colocadas = [];
      this.tableroNumero += 1;
    }
    return { registrado: true, correcto: true, avanza: true };
  }

  /** La frase en curso no sobrevive a la pausa, igual que un tablero. */
  limpiarSeleccion() {
    this.colocadas = [];
  }

  /** Forma de tablero, para que el registro sea igual que el de los demas. */
  get tablero() {
    return {
      objetivo: this.frase.id,
      distractores: this.frase.mezcladas,
      celdas: this.frase.mezcladas,
      semilla: this.frase.semilla,
      svPedida: 0, ssPedida: 0, svEfectiva: 0, ssEfectiva: 0,
    };
  }

  /** @returns {false} */
  haTerminado() {
    return false;
  }
}
