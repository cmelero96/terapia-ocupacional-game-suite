/**
 * Instrumento Busca — busqueda visual. Sistema 10.
 *
 * Un objetivo visible y un tablero. El paciente lo encuentra y lo activa.
 *
 * **Activar el objetivo correcto avanza. Activar un distractor no hace NADA visible.** Ni
 * marca, ni sonido, ni temblor, ni anuncio. El acuse de recibo ocurre igual —el paciente
 * sabe que el sistema le oyo— pero es IDENTICO en los dos casos. Es el pilar 2 hecho
 * comportamiento, y es lo primero que alguien rompe "por claridad".
 *
 * design/gdd/instrumento-busca.md
 */

import { separacion } from '../theme/tokens-datos.js';

/**
 * F1 — cuantas columnas y cuanto ancho hace falta.
 *
 * El rechazo por no caber es de este sistema, porque es el unico que conoce la
 * disposicion. Y se **rechaza, no se ajusta**: reducir `C` en silencio moveria el eje
 * perceptivo porque el terapeuta toco el motor.
 *
 * @param {number} C
 * @param {number} t
 * @returns {{ columnas: number, anchoNecesario: number, sep: number }}
 */
export function disposicion(C, t) {
  const columnas = Math.ceil(Math.sqrt(C));
  const sep = separacion(t);
  return { columnas, sep, anchoNecesario: columnas * t + (columnas - 1) * sep };
}

/**
 * @param {number} C
 * @param {number} t
 * @param {number} anchoDisponible
 * @returns {boolean}
 */
export function cabe(C, t, anchoDisponible) {
  return disposicion(C, t).anchoNecesario <= anchoDisponible;
}

/**
 * @typedef {object} Estimulo
 * @property {string} id
 * @property {string} nombre Nombre accesible. Del campo `name` del manifiesto, NUNCA la ruta
 * @property {string} glifo
 *   Representacion visual **de texto**: un emoji del banco provisional, o el glifo de un
 *   instrumento de contenido. Vacio cuando el estimulo tiene archivo
 * @property {string} [archivo]
 *   Ruta del SVG dentro de `assets/art/banco/`, cuando el estimulo viene del banco real.
 *
 *   **Se pinta con `mask-image` y `currentColor`, nunca con `<img>`.** Medido: un SVG externo
 *   en `<img>` NO ve el color del documento y sale siempre negro, asi que ignoraria los tokens
 *   del proyecto y el modo de colores forzados. La biblia de arte afirmaba lo contrario y
 *   estaba equivocada.
 */

/**
 * Estado del instrumento. Puro: no toca el DOM.
 */
export class Busca {
  /**
   * @param {object} entrada
   * @param {number} entrada.t
   * @param {(id: string) => Estimulo} entrada.resolver Del sistema 1
   * @param {() => import('../tablero/generador.js').Tablero} entrada.siguienteTablero
   */
  constructor({ t, resolver, siguienteTablero }) {
    /** @type {number} */
    this.t = t;
    /** @type {(id: string) => Estimulo} */
    this.resolver = resolver;
    /** @type {() => import('../tablero/generador.js').Tablero} */
    this.siguienteTablero = siguienteTablero;
    /** @type {import('../tablero/generador.js').Tablero} */
    this.tablero = siguienteTablero();
    /** @type {import('../registro/sesion.js').Intento[]} */
    this.intentos = [];
    /** @type {number} */
    this.tableroNumero = 1;
  }

  /** @returns {Estimulo} El objetivo, siempre visible y fuera del tablero */
  objetivo() {
    return this.resolver(this.tablero.objetivo);
  }

  /**
   * Los elementos del tablero, en el orden en que se pintan.
   *
   * @returns {Estimulo[]}
   */
  celdas() {
    // Las trae el generador YA barajadas, objetivo incluido. Concatenarlas aqui haria que
    // el objetivo cayera siempre en la primera casilla.
    return this.tablero.celdas.map((id) => this.resolver(id));
  }

  /**
   * Procesa una activacion.
   *
   * **No recibe el modo de entrada para decidir nada.** El campo existe en el evento y va
   * al registro; este metodo no lo lee.
   *
   * @param {import('../entrada/adaptador.js').EventoActivacion} evento
   * @param {import('../registro/sesion.js').Latencia} latencia
   * @returns {{ correcto: boolean, avanza: boolean }}
   */
  activar(evento, latencia) {
    const correcto = evento.idObjetivo === this.tablero.objetivo;
    this.intentos.push({ idActivado: evento.idObjetivo, correcto, latencia, modo: evento.modo });
    if (correcto) {
      this.tablero = this.siguienteTablero();
      this.tableroNumero += 1;
    }
    // El acuse de recibo lo dispara el enlace con el DOM, y es identico en los dos casos.
    // Este metodo devuelve `correcto` para el REGISTRO, no para la presentacion.
    return { correcto, avanza: correcto };
  }

  /**
   * La sesion termina cuando una persona lo dice. **No hay condicion de fin**: ni numero de
   * tableros, ni tiempo, ni victoria. Anti-pilar 2.
   *
   * @returns {false}
   */
  haTerminado() {
    return false;
  }
}
