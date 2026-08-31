/**
 * Instrumento GENERICO de eleccion: un estimulo y varias opciones, una correcta.
 *
 * Tres de los juegos de la lista tienen exactamente esta forma, y por eso salen casi
 * gratis:
 *
 *   | Juego                 | Estimulo            | Opciones          |
 *   |-----------------------|---------------------|-------------------|
 *   | Rellenar palabras     | `ven_na`            | silabas           |
 *   | Transcribir simbolos  | 🚭                  | palabras          |
 *   | Precio justo          | barra de pan 🥖     | precios en euros  |
 *
 * Y comparte con Busca y Denominacion todo lo demas: la capa de entrada, el registro, el
 * panel, los resultados y la politica de presentacion.
 *
 * **Lo que NO comparte es el banco de imagenes.** El manifiesto del sistema 1 asume
 * contenido de imagen; estos tres usan `src/contenido/provisional.js`. Es una segunda
 * fuente de contenido, y no cuesta 416 SVG: se escribe.
 */

import { barajar } from '../plataforma/aleatoriedad.js';

/**
 * @typedef {object} Ronda
 * @property {string} id
 * @property {string} estimuloGlifo Vacio si el estimulo es solo texto
 * @property {string} estimuloTexto
 * @property {string} correcta
 * @property {string[]} opciones Ya barajadas
 * @property {number} semilla
 */

/**
 * @typedef {object} FuenteDeRondas
 * @property {(nOpciones: number, fuenteAleatoria: () => number, semilla: number) => Ronda} siguiente
 * @property {string} etiqueta Lo que el terapeuta ve en el selector
 * @property {string} [aviso] Advertencia que el panel debe mostrar. Los precios caducan
 */

/**
 * Estado del instrumento. PURO: no toca el DOM.
 */
export class Elegir {
  /**
   * @param {object} entrada
   * @param {number} entrada.t
   * @param {FuenteDeRondas} entrada.fuente
   * @param {number} entrada.nOpciones
   * @param {() => { semilla: number, fuenteAleatoria: import('../plataforma/esquema.js').FuenteAleatoria }} entrada.nuevaFuente
   */
  constructor({ t, fuente, nOpciones, nuevaFuente }) {
    /** @type {number} */
    this.t = t;
    /** @type {FuenteDeRondas} */
    this.fuente = fuente;
    /** @type {number} */
    this.nOpciones = nOpciones;
    /** @type {() => { semilla: number, fuenteAleatoria: import('../plataforma/esquema.js').FuenteAleatoria }} */
    this.nuevaFuente = nuevaFuente;
    /** @type {Ronda} */
    this.ronda = this.#sortear();
    /** @type {import('../registro/sesion.js').Intento[]} */
    this.intentos = [];
    /** @type {number} */
    this.tableroNumero = 1;
    /** @type {'elegir'} */
    this.instrumento = 'elegir';
  }

  /** @returns {Ronda} */
  #sortear() {
    const { semilla, fuenteAleatoria } = this.nuevaFuente();
    return this.fuente.siguiente(this.nOpciones, fuenteAleatoria, semilla);
  }

  /** Compatibilidad con el enlace del DOM: la zona de referencia. */
  objetivo() {
    return {
      id: this.ronda.correcta,
      nombre: this.ronda.estimuloTexto,
      glifo: this.ronda.estimuloGlifo,
    };
  }

  /** @returns {import('./busca.js').Estimulo[]} */
  celdas() {
    return this.ronda.opciones.map((o) => ({ id: o, nombre: o, glifo: o }));
  }

  /**
   * @param {import('../entrada/adaptador.js').EventoActivacion} evento
   * @param {import('../registro/sesion.js').Latencia} latencia
   * @returns {{ registrado: boolean, correcto: boolean, avanza: boolean }}
   */
  activar(evento, latencia) {
    const correcto = evento.idObjetivo === this.ronda.correcta;
    this.intentos.push({ idActivado: evento.idObjetivo, correcto, latencia });
    if (correcto) {
      this.ronda = this.#sortear();
      this.tableroNumero += 1;
    }
    // Activar mal no hace NADA visible. El acuse es identico en los dos casos.
    return { registrado: true, correcto, avanza: correcto };
  }

  /** El "tablero" de este instrumento, para que el registro tenga la misma forma. */
  get tablero() {
    return {
      objetivo: this.ronda.correcta,
      distractores: this.ronda.opciones.filter((o) => o !== this.ronda.correcta),
      celdas: this.ronda.opciones,
      semilla: this.ronda.semilla,
      svPedida: 0, ssPedida: 0, svEfectiva: 0, ssEfectiva: 0,
    };
  }

  /** @returns {false} */
  haTerminado() {
    return false;
  }
}

// ---------------------------------------------------------------- las tres fuentes

/**
 * Elige `n − 1` distractores de una lista, sin repetir y sin incluir el correcto.
 *
 * @template T
 * @param {T[]} pool
 * @param {T} correcto
 * @param {number} n
 * @param {() => number} fuenteAleatoria
 * @returns {T[]}
 */
function conDistractores(pool, correcto, n, fuenteAleatoria) {
  const otros = barajar(pool.filter((x) => x !== correcto), fuenteAleatoria);
  return barajar([correcto, ...otros.slice(0, n - 1)], fuenteAleatoria);
}

/**
 * Rellenar palabras. El hueco es una SILABA, no una letra: una silaba es una unidad de
 * lectura, y una letra suelta convierte la tarea en deletreo.
 *
 * @param {readonly { id: string, palabra: string, hueco: string, opciones: string[] }[]} banco
 * @returns {FuenteDeRondas}
 */
export function fuenteRellenar(banco) {
  return {
    etiqueta: 'Rellenar palabras',
    siguiente: (nOpciones, fuenteAleatoria, semilla) => {
      const p = /** @type {typeof banco[number]} */ (
        barajar([...banco], fuenteAleatoria)[0]
      );
      return {
        id: p.id,
        estimuloGlifo: '',
        estimuloTexto: p.palabra,
        correcta: p.hueco,
        opciones: conDistractores([...p.opciones], p.hueco, nOpciones, fuenteAleatoria),
        semilla,
      };
    },
  };
}

/**
 * Transcribir simbolos. Simbolos de señalizacion real, no abstractos: el objetivo
 * clinico es leer la señalizacion de la calle, que es una habilidad funcional.
 *
 * @param {readonly { id: string, simbolo: string, palabra: string }[]} banco
 * @returns {FuenteDeRondas}
 */
export function fuenteSimbolos(banco) {
  return {
    etiqueta: 'Transcribir símbolos',
    siguiente: (nOpciones, fuenteAleatoria, semilla) => {
      const s = /** @type {typeof banco[number]} */ (
        barajar([...banco], fuenteAleatoria)[0]
      );
      return {
        id: s.id,
        estimuloGlifo: s.simbolo,
        estimuloTexto: '¿qué significa?',
        correcta: s.palabra,
        opciones: conDistractores(
          banco.map((x) => x.palabra), s.palabra, nOpciones, fuenteAleatoria,
        ),
        semilla,
      };
    },
  };
}

/**
 * Precio justo.
 *
 * **Los precios caducan**, y por eso lleva aviso: un precio de hace siete años confunde a
 * un paciente que hace la compra cada semana. Es la razon por la que el GDD del sistema 23
 * lo habia descartado del primer hito.
 *
 * @param {readonly { id: string, nombre: string, glifo: string, euros: number }[]} banco
 * @param {string} fecha
 * @returns {FuenteDeRondas}
 */
export function fuentePrecios(banco, fecha) {
  /** @param {number} e */
  const fmt = (e) => `${e.toFixed(2).replace('.', ',')} €`;
  return {
    etiqueta: 'Precio justo',
    aviso: `Los precios son de ${fecha} y caducan: revísalos antes de usar este ejercicio.`,
    siguiente: (nOpciones, fuenteAleatoria, semilla) => {
      const o = /** @type {typeof banco[number]} */ (
        barajar([...banco], fuenteAleatoria)[0]
      );
      // Los distractores son precios PLAUSIBLES del mismo objeto, no de otros: un precio
      // de otro producto se descarta sin pensar, y la tarea deja de medir nada.
      const factores = [0.5, 0.7, 1.5, 2, 3];
      const candidatos = barajar(factores, fuenteAleatoria)
        .map((f) => Math.round(o.euros * f * 10) / 10)
        .filter((v) => v > 0 && Math.abs(v - o.euros) > 0.05);
      const opciones = [o.euros, ...candidatos.slice(0, nOpciones - 1)];
      return {
        id: o.id,
        estimuloGlifo: o.glifo,
        estimuloTexto: `¿cuánto cuesta ${o.nombre}?`,
        correcta: fmt(o.euros),
        opciones: barajar(opciones.map(fmt), fuenteAleatoria),
        semilla,
      };
    },
  };
}
