/**
 * Tres en raya con cálculo. Juego 1 de la lista.
 *
 * Para poner ficha hay que resolver una operación: se muestra el enunciado y varias
 * opciones, y **acertar da derecho a colocar**. Fallar no coloca y no marca nada.
 *
 * Es el único instrumento del proyecto con **estado de partida** y con un oponente, y eso
 * trae tres decisiones que ningún otro necesitó.
 *
 * **1 · El oponente no compite.** El anti-pilar 1 prohíbe la puntuación comparativa, así
 * que la máquina juega **al azar entre las casillas libres**, sin estrategia. No busca
 * ganar: existe para que el tablero se llene y la partida tenga forma. Una máquina que
 * juega bien convertiría esto en una derrota repetida, que es lo contrario del pilar 2.
 *
 * **2 · Ganar y perder no se anuncian.** Cuando la partida acaba —tres en raya de
 * cualquiera, o tablero lleno— empieza otra. **El registro sabe quién hizo raya; la
 * pantalla del paciente no.** Es el pilar 2 aplicado a un juego que estructuralmente tiene
 * un ganador.
 *
 * **3 · La posición SÍ importa**, a diferencia de todos los demás instrumentos. Es el
 * primero donde el tablero no es una rejilla intercambiable, y por eso `C` no aplica: son
 * nueve casillas, siempre.
 */

import { barajar } from '../plataforma/aleatoriedad.js';
import { operacion } from '../contenido/provisional.js';

/** Las ocho líneas de tres en raya de un tablero 3×3. */
const LINEAS = Object.freeze([
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]);

/**
 * @param {readonly ('paciente' | 'maquina' | null)[]} casillas
 * @returns {'paciente' | 'maquina' | null}
 */
export function hayRaya(casillas) {
  for (const [a, b, c] of LINEAS) {
    const v = casillas[/** @type {number} */ (a)];
    if (v !== null && v !== undefined
      && v === casillas[/** @type {number} */ (b)]
      && v === casillas[/** @type {number} */ (c)]) {
      return v;
    }
  }
  return null;
}

/** @param {readonly ('paciente' | 'maquina' | null)[]} casillas */
export function tableroLleno(casillas) {
  return casillas.every((c) => c !== null);
}

/**
 * Estado del instrumento. PURO: no toca el DOM.
 */
export class TresEnRaya {
  /**
   * @param {object} entrada
   * @param {number} entrada.t
   * @param {import('../contenido/provisional.js').TipoOperacion} entrada.tipoOperacion
   * @param {number} entrada.nOpciones
   * @param {() => { semilla: number, fuenteAleatoria: import('../plataforma/esquema.js').FuenteAleatoria }} entrada.nuevaFuente
   */
  constructor({ t, tipoOperacion, nOpciones, nuevaFuente }) {
    /** @type {number} */
    this.t = t;
    /** @type {import('../contenido/provisional.js').TipoOperacion} */
    this.tipoOperacion = tipoOperacion;
    /** @type {number} */
    this.nOpciones = Math.min(Math.max(nOpciones, 2), 6);
    /** @type {() => { semilla: number, fuenteAleatoria: import('../plataforma/esquema.js').FuenteAleatoria }} */
    this.nuevaFuente = nuevaFuente;
    /** @type {import('../registro/sesion.js').Intento[]} */
    this.intentos = [];
    /** @type {number} */
    this.tableroNumero = 1;
    /** @type {'tresEnRaya'} */
    this.instrumento = 'tresEnRaya';
    /** @type {('paciente' | 'maquina' | null)[]} */
    this.casillas = Array.from({ length: 9 }, () => null);
    /**
     * **Solo el registro lo sabe.** No hay ninguna via desde aqui a la pantalla del
     * paciente: el pilar 2 aplicado a un juego que estructuralmente tiene un ganador.
     *
     * @type {{ paciente: number, maquina: number, empate: number }}
     */
    this.partidas = { paciente: 0, maquina: 0, empate: 0 };
    this.reto = this.#nuevoReto();
  }

  #nuevoReto() {
    const { semilla, fuenteAleatoria } = this.nuevaFuente();
    const { enunciado, resultado } = operacion(this.tipoOperacion, fuenteAleatoria);
    // Los distractores son resultados PLAUSIBLES: cerca del correcto. Un numero muy lejano
    // se descarta sin calcular, y la tarea deja de medir aritmetica.
    /** @type {number[]} */
    const cerca = [];
    for (const d of [1, -1, 2, -2, 3, -3, 10, -10]) {
      const v = resultado + d;
      if (v >= 0 && !cerca.includes(v)) cerca.push(v);
    }
    const opciones = barajar(
      [resultado, ...barajar(cerca, fuenteAleatoria).slice(0, this.nOpciones - 1)],
      fuenteAleatoria,
    );
    return { enunciado, resultado, opciones, semilla };
  }

  /** La zona de referencia: el enunciado de la operacion. */
  objetivo() {
    return { id: String(this.reto.resultado), nombre: this.reto.enunciado, glifo: '' };
  }

  /** Las opciones de respuesta, que es lo que el paciente activa primero. */
  celdas() {
    return this.reto.opciones.map((o) => ({
      id: `r:${o}`, nombre: String(o), glifo: String(o),
    }));
  }

  /**
   * Las nueve casillas del tablero, como contenedores activables.
   *
   * @returns {{ id: string, nombre: string, glifo: string, dueño: 'paciente' | 'maquina' | null }[]}
   */
  contenedoresTablero() {
    return this.casillas.map((v, i) => ({
      id: `c:${i}`,
      nombre: v === null ? `casilla ${i + 1}, libre` : `casilla ${i + 1}, ocupada`,
      glifo: v === 'paciente' ? '✕' : v === 'maquina' ? '○' : '',
      dueño: v,
    }));
  }

  /** ¿Ha acertado la operación y tiene derecho a colocar? */
  get puedeColocar() {
    return this.acertado;
  }

  /** @type {boolean} */
  acertado = false;

  /**
   * @param {import('../entrada/adaptador.js').EventoActivacion} evento
   * @param {import('../registro/sesion.js').Latencia} latencia
   * @returns {{ registrado: boolean, correcto: boolean, avanza: boolean }}
   */
  activar(evento, latencia) {
    const id = evento.idObjetivo;

    // --- Una respuesta a la operacion.
    if (id.startsWith('r:')) {
      if (this.acertado) return { registrado: false, correcto: false, avanza: false };
      const correcto = id === `r:${this.reto.resultado}`;
      this.intentos.push({ idActivado: id, correcto, latencia, modo: evento.modo });
      if (correcto) this.acertado = true;
      // Fallar no coloca y no marca nada. Se sortea otra operacion, sin decir por que.
      if (!correcto) this.reto = this.#nuevoReto();
      return { registrado: true, correcto, avanza: true };
    }

    // --- Una casilla del tablero. Solo cuenta si ha acertado antes.
    if (!id.startsWith('c:')) return { registrado: false, correcto: false, avanza: false };
    if (!this.acertado) return { registrado: false, correcto: false, avanza: false };

    const i = Number(id.slice(2));
    if (!Number.isInteger(i) || i < 0 || i > 8) {
      return { registrado: false, correcto: false, avanza: false };
    }
    // Una casilla ocupada no hace nada. No es un fallo: es una accion imposible.
    if (this.casillas[i] !== null) return { registrado: false, correcto: false, avanza: false };

    this.casillas[i] = 'paciente';
    this.acertado = false;
    this.reto = this.#nuevoReto();
    this.#cerrarOSeguir();
    return { registrado: false, correcto: true, avanza: true };
  }

  /**
   * Turno de la maquina y comprobacion de fin de partida.
   *
   * La maquina juega **al azar entre las casillas libres**, sin estrategia. Una maquina
   * que juega bien convertiria esto en una derrota repetida.
   */
  #cerrarOSeguir() {
    if (this.#finDePartida()) return;

    const { fuenteAleatoria } = this.nuevaFuente();
    const libres = this.casillas
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v === null)
      .map(({ i }) => i);
    const elegida = barajar(libres, fuenteAleatoria)[0];
    if (elegida !== undefined) this.casillas[elegida] = 'maquina';

    this.#finDePartida();
  }

  /** @returns {boolean} */
  #finDePartida() {
    const raya = hayRaya(this.casillas);
    if (raya === null && !tableroLleno(this.casillas)) return false;

    // El registro sabe quien hizo raya. La pantalla del paciente NO.
    if (raya === 'paciente') this.partidas.paciente += 1;
    else if (raya === 'maquina') this.partidas.maquina += 1;
    else this.partidas.empate += 1;

    this.casillas = Array.from({ length: 9 }, () => null);
    this.tableroNumero += 1;
    return true;
  }

  /** Forma de tablero, para que el registro sea igual que el de los demas. */
  get tablero() {
    return {
      objetivo: `r:${this.reto.resultado}`,
      distractores: this.reto.opciones.filter((o) => o !== this.reto.resultado).map((o) => `r:${o}`),
      celdas: this.reto.opciones.map((o) => `r:${o}`),
      semilla: this.reto.semilla,
      svPedida: 0, ssPedida: 0, svEfectiva: 0, ssEfectiva: 0,
    };
  }

  /** La respuesta acertada no sobrevive a la pausa. */
  limpiarSeleccion() {
    this.acertado = false;
  }

  /** @returns {false} */
  haTerminado() {
    return false;
  }
}
