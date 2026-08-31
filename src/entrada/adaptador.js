/**
 * Capa de adaptacion de entrada. Modulo PURO: no toca el DOM, no lee relojes, no
 * programa temporizadores. Todo llega inyectado.
 *
 * Cinco vias de acceso colapsan en un unico `EventoActivacion`. El punto de colapso es
 * donde la accesibilidad se gana o se pierde: si un instrumento llega a ramificar por
 * modo de entrada, la abstraccion ha fallado y cada instrumento nuevo paga el coste de
 * las cinco vias otra vez.
 *
 * Sistema 5 · design/gdd/capa-adaptacion-entrada.md
 */

import {
  MS_PASO_MIN, MS_PASO_MAX, PX_TOLERANCIA_MIN, RATIO_TOLERANCIA,
} from './constantes.js';

/**
 * @typedef {object} EventoActivacion
 * @property {string} idObjetivo
 * @property {number} tActivacion Marca de tiempo, del origen que indica `origenTiempo`
 * @property {import('./constantes.js').Modo} modo Solo para el registro
 * @property {import('./constantes.js').OrigenTiempo} origenTiempo
 */

/**
 * @typedef {object} Programador
 * @property {(callback: () => void, ms: number) => number} programar
 * @property {(id: number) => void} cancelar
 */

// ---------------------------------------------------------------- F2

/**
 * F2 — cadencia del barrido automatico.
 *
 * **La perilla es la VUELTA, no el paso**, y no es un detalle de interfaz. Con la perilla
 * en el paso, subir `C` de 12 a 40 multiplicaria por 3,3 el tiempo de vuelta **sin que el
 * terapeuta tocara nada**: una entrada moviendo un parametro clinico en silencio, que es
 * el modo de fallo caracteristico de este proyecto.
 *
 * Con la perilla en la vuelta, subir `C` acorta el paso hasta el suelo y **ahi se
 * detiene**, señalando que ha recortado. Degradacion declarada en lugar de silenciosa.
 *
 * @param {number} nPasos Objetivos enfocables
 * @param {number} msVuelta Tiempo de una vuelta completa
 * @returns {{ msPorPaso: number, recortado: boolean, msVueltaReal: number }}
 */
export function cadenciaBarrido(nPasos, msVuelta) {
  if (!Number.isInteger(nPasos) || nPasos < 3) {
    throw new RangeError(`nPasos: se esperaba un entero >= 3, se recibio ${String(nPasos)}`);
  }
  if (!Number.isInteger(msVuelta) || msVuelta < 3000 || msVuelta > 60000) {
    throw new RangeError(`msVuelta: ${String(msVuelta)} fuera del rango [3000, 60000]`);
  }
  const bruto = msVuelta / nPasos;
  const msPorPaso = Math.min(Math.max(bruto, MS_PASO_MIN), MS_PASO_MAX);
  return {
    msPorPaso,
    recortado: msPorPaso !== bruto,
    msVueltaReal: msPorPaso * nPasos,
  };
}

// ---------------------------------------------------------------- F3

/**
 * F3 — radio de la zona de tolerancia.
 *
 * Sin ella, la permanencia y la cancelacion de puntero son inservibles para quien tiene
 * temblor, que es buena parte de quien las necesita.
 *
 * @param {number} t Tamaño de objetivo en px
 * @returns {number} Radio en px
 */
export function pxTolerancia(t) {
  if (!Number.isInteger(t) || t < 24 || t > 140) {
    throw new RangeError(`t: ${String(t)} fuera del limite duro [24, 140]`);
  }
  return Math.max(PX_TOLERANCIA_MIN, Math.round(RATIO_TOLERANCIA * t));
}

/**
 * ¿Cae un desplazamiento dentro de la tolerancia?
 *
 * @param {number} dx
 * @param {number} dy
 * @param {number} t
 * @returns {boolean}
 */
export function dentroDeTolerancia(dx, dy, t) {
  return Math.hypot(dx, dy) <= pxTolerancia(t);
}

// ---------------------------------------------------------------- F1

/**
 * F1 — la maquina de estados del puntero. WCAG 2.2 criterio 2.5.2.
 *
 * La activacion ocurre al **soltar**, sobre el mismo objetivo, y se puede abortar. Un
 * aborto **no es un fallo**: no se registra, no se anuncia, y no cuenta como intento.
 *
 * Un paciente con temblor toca y se desliza fuera constantemente. Contar eso como error
 * convertiria el temblor en un dato de busqueda.
 */
export class MaquinaPuntero {
  /** @param {number} t Tamaño de objetivo, del sistema 4 */
  constructor(t) {
    /** @type {number} */
    this.t = t;
    /** @type {{ id: string, x: number, y: number } | null} */
    this.candidato = null;
  }

  /**
   * @param {string} id
   * @param {number} x
   * @param {number} y
   * @returns {null} Nunca activa al pulsar
   */
  abajo(id, x, y) {
    this.candidato = { id, x, y };
    return null;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {null}
   */
  mover(x, y) {
    if (this.candidato === null) return null;
    const dx = x - this.candidato.x;
    const dy = y - this.candidato.y;
    if (!dentroDeTolerancia(dx, dy, this.t)) this.candidato = null;
    return null;
  }

  /**
   * @param {string | null} id Objetivo bajo el puntero al soltar, o null si ninguno
   * @param {number} tActivacion
   * @param {import('./constantes.js').Modo} modo
   * @param {import('./constantes.js').OrigenTiempo} origenTiempo
   * @returns {EventoActivacion | null}
   */
  arriba(id, tActivacion, modo, origenTiempo) {
    const c = this.candidato;
    this.candidato = null;
    if (c === null || id !== c.id) return null;
    return { idObjetivo: c.id, tActivacion, modo, origenTiempo };
  }

  /** El navegador cancelo el gesto. No es un fallo. @returns {null} */
  cancelar() {
    this.candidato = null;
    return null;
  }
}

// ---------------------------------------------------------------- F4

/**
 * F4 — la cuenta de la activacion por permanencia.
 *
 * Mide con el reloj **monotono** inyectado. Si el puntero sale de la tolerancia, la
 * cuenta se **reinicia** a 0, no se pausa: pausar haria que dos toques accidentales
 * separados por un minuto activaran algo.
 */
export class Permanencia {
  /**
   * @param {number} msPermanencia
   * @param {import('../plataforma/esquema.js').RelojMonotono} reloj
   */
  constructor(msPermanencia, reloj) {
    if (!Number.isInteger(msPermanencia) || msPermanencia < 300 || msPermanencia > 5000) {
      throw new RangeError(
        `msPermanencia: ${String(msPermanencia)} fuera del rango [300, 5000]`,
      );
    }
    /** @type {number} */
    this.msPermanencia = msPermanencia;
    /** @type {import('../plataforma/esquema.js').RelojMonotono} */
    this.reloj = reloj;
    /** @type {{ id: string, tInicio: number } | null} */
    this.actual = null;
  }

  /** @param {string} id */
  entrar(id) {
    if (this.actual !== null && this.actual.id === id) return;
    this.actual = { id, tInicio: this.reloj.now() };
  }

  /** Salir de la tolerancia REINICIA, no pausa. */
  salir() {
    this.actual = null;
  }

  /** @returns {number} [0, 1], para `--board-dwell-progress` */
  progreso() {
    if (this.actual === null) return 0;
    const transcurrido = this.reloj.now() - this.actual.tInicio;
    return Math.min(Math.max(transcurrido / this.msPermanencia, 0), 1);
  }

  /**
   * @param {import('./constantes.js').Modo} [modo]
   * @returns {EventoActivacion | null}
   */
  comprobar(modo = 'permanencia') {
    if (this.actual === null) return null;
    const transcurrido = this.reloj.now() - this.actual.tInicio;
    if (transcurrido < this.msPermanencia) return null;
    const id = this.actual.id;
    this.actual = null;
    return { idObjetivo: id, tActivacion: this.reloj.now(), modo, origenTiempo: 'reloj' };
  }
}

// ---------------------------------------------------------------- barrido

/**
 * Barrido por pulsador. **Mueve el FOCO**, no un cursor propio — lo fija ADR-0005.
 *
 * Esta clase solo lleva el indice; quien mueve el foco de verdad es el enlace con el DOM,
 * que recibe `indice()` y llama a `focus()`. Asi la logica es comprobable sin navegador.
 *
 * **Sin limite de vueltas.** Un limite seria presion de tiempo por la puerta de atras.
 */
export class Barrido {
  /**
   * @param {string[]} ids
   * @param {Programador} programador
   * @param {number} msPorPaso
   */
  constructor(ids, programador, msPorPaso) {
    if (ids.length < 3) throw new RangeError(`Barrido: se esperaban >= 3 objetivos, hay ${ids.length}`);
    /** @type {string[]} */
    this.ids = ids;
    /** @type {Programador} */
    this.programador = programador;
    /** @type {number} */
    this.msPorPaso = msPorPaso;
    /** @type {number} */
    this.i = 0;
    /** @type {number} */
    this.vueltas = 0;
    /** @type {number | null} */
    this.tarea = null;
    /** @type {boolean} */
    this.pulsadorMantenido = false;
  }

  /** Arranca el barrido automatico. */
  arrancarAutomatico() {
    const paso = () => {
      this.avanzar();
      this.tarea = this.programador.programar(paso, this.msPorPaso);
    };
    this.tarea = this.programador.programar(paso, this.msPorPaso);
  }

  detener() {
    if (this.tarea !== null) this.programador.cancelar(this.tarea);
    this.tarea = null;
  }

  /** Avanza un paso. Al llegar al final vuelve al principio, sin limite. */
  avanzar() {
    this.i = (this.i + 1) % this.ids.length;
    if (this.i === 0) this.vueltas += 1;
  }

  /** @returns {string} El id actualmente enfocado */
  actual() {
    return /** @type {string} */ (this.ids[this.i]);
  }

  /**
   * El pulsador de seleccion. **Mantenerlo pulsado es UNA activacion**: sin
   * autorrepeticion, porque con un pulsador de barbilla la autorrepeticion produce
   * activaciones que la persona no queria.
   *
   * @param {number} tActivacion
   * @param {import('./constantes.js').OrigenTiempo} origenTiempo
   * @returns {EventoActivacion | null}
   */
  seleccionar(tActivacion, origenTiempo) {
    if (this.pulsadorMantenido) return null;
    this.pulsadorMantenido = true;
    return { idObjetivo: this.actual(), tActivacion, modo: 'pulsador', origenTiempo };
  }

  /** El pulsador se suelta. Habilita la siguiente activacion. */
  soltar() {
    this.pulsadorMantenido = false;
  }
}

/**
 * Reasigna el modo de un evento cuando el barrido esta activo.
 *
 * **Por que existe esta funcion, y por que vive AQUI.**
 *
 * Con barrido activo, la tecla que activa el objeto enfocado no es "el teclado": es **el
 * pulsador**. El navegador no puede distinguirlos —un pulsador de barbilla se presenta al
 * sistema como una tecla— asi que el unico dato que separa las dos vias es la
 * configuracion de acceso.
 *
 * Sin esto, la sesion registra `'teclado'` para un paciente que jugo con pulsador, y el
 * dato de modo se vuelve falso justo para la poblacion en la que mas importa: la latencia
 * de una via de barrido no es comparable con la de un teclado.
 *
 * Y vive en `src/entrada/` porque **el modo es de la capa de entrada**. La barrera AC-2 del
 * sistema 5 prohibe el literal fuera de aqui, y tenia razon: el enlace con el DOM lo tenia
 * escrito a mano, y escrito MAL.
 *
 * @param {EventoActivacion} evento
 * @param {boolean} barridoActivo
 * @returns {EventoActivacion}
 */
export function conModoDeAcceso(evento, barridoActivo) {
  if (!barridoActivo) return evento;
  if (evento.modo !== 'teclado') return evento;
  return { ...evento, modo: 'pulsador' };
}
