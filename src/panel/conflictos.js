/**
 * Deteccion de conflictos de configuracion. Sistema 11, F1 y F2.
 *
 * Modulo PURO. No toca el DOM: devuelve una lista de conflictos y avisos, y quien los
 * pinta es el enlace del panel.
 *
 * design/gdd/panel-terapeuta.md
 */

import { disposicion } from '../instrumentos/busca.js';
import { cadenciaBarrido } from '../entrada/adaptador.js';
import { T_AAA } from '../dificultad/constantes.js';

/**
 * @typedef {'noCabe' | 'bancoInsuficiente' | 'barridoRecortado' | 'perfilTenso'} CodigoConflicto
 */

/**
 * @typedef {object} Conflicto
 * @property {CodigoConflicto} codigo
 * @property {boolean} bloquea
 * @property {string} mensaje Con palabras, nunca solo color
 */

/**
 * F1 — los cuatro conflictos.
 *
 * **Dos bloquean y dos avisan, y la distincion importa:** bloquear algo que el terapeuta
 * tiene derecho a hacer es peor que avisarle. Solo se bloquea lo que fisicamente no
 * funciona.
 *
 * @param {object} entrada
 * @param {{ t: number, C: number }} entrada.config
 * @param {{ barrido: boolean, msVuelta: number, limitaciones: string[] }} entrada.acceso
 * @param {number} entrada.bancoActivo
 * @param {number} entrada.anchoDisponible
 * @returns {Conflicto[]}
 */
export function conflictos({ config, acceso, bancoActivo, anchoDisponible }) {
  /** @type {Conflicto[]} */
  const salida = [];
  const { t, C } = config;

  const { anchoNecesario } = disposicion(C, t);
  if (anchoNecesario > anchoDisponible) {
    salida.push({
      codigo: 'noCabe',
      bloquea: true,
      mensaje:
        `No cabe: ${C} objetos de ${t} px necesitan ${Math.round(anchoNecesario)} px de ` +
        `ancho y hay ${Math.round(anchoDisponible)}. Baja la cantidad o el tamaño.`,
    });
  }

  if (C - 1 > bancoActivo - 1) {
    salida.push({
      codigo: 'bancoInsuficiente',
      bloquea: true,
      mensaje:
        `El banco tiene ${bancoActivo} objetos activos: no se pueden poner ${C} en un ` +
        `tablero.`,
    });
  }

  if (acceso.barrido) {
    const c = cadenciaBarrido(C, acceso.msVuelta);
    if (c.recortado) {
      salida.push({
        codigo: 'barridoRecortado',
        bloquea: false,
        mensaje:
          `Con ${C} objetos el barrido tarda ${(c.msVueltaReal / 1000).toFixed(1)} s por ` +
          `vuelta, no los ${(acceso.msVuelta / 1000).toFixed(1)} configurados. Aviso: se ` +
          `puede aplicar.`,
      });
    }
  }

  // Conflicto B1 + B7 del sistema 15: control psicomotor reducido pide t >= 60, y un solo
  // punto de activacion pide C <= 30. Es un perfil PLAUSIBLE Y FRECUENTE, no un caso raro,
  // asi que el aviso llega antes de que el paciente este delante.
  const tieneB1 = acceso.limitaciones.includes('B1');
  const tieneB7 = acceso.limitaciones.includes('B7');
  if (tieneB1 && tieneB7 && (t < 60 || C > 30)) {
    salida.push({
      codigo: 'perfilTenso',
      bloquea: false,
      mensaje:
        'Este perfil pide objetivos de 60 px o mas y como maximo 30 objetos. ' +
        'Comprueba la configuracion antes de empezar. Aviso: se puede aplicar.',
    });
  }

  return salida;
}

/**
 * ¿Se puede aplicar esta configuracion?
 *
 * @param {Conflicto[]} lista
 * @returns {boolean}
 */
export function esAplicable(lista) {
  return !lista.some((c) => c.bloquea);
}

/**
 * @typedef {object} Aviso
 * @property {string} codigo
 * @property {string} mensaje
 */

/**
 * F2 — lo que hay que decir sin bloquear.
 *
 * @param {object} entrada
 * @param {{ t: number }} entrada.config
 * @param {boolean} entrada.prefersReducedMotion
 * @param {{ svPedida: number, svEfectiva: number } | null} [entrada.ultimoTablero]
 * @returns {Aviso[]}
 */
export function avisos({ config, prefersReducedMotion, ultimoTablero = null }) {
  /** @type {Aviso[]} */
  const salida = [];

  if (config.t < T_AAA) {
    salida.push({
      codigo: 'ejesAcoplados',
      mensaje:
        `Con objetivos de ${config.t} px, por debajo de ${T_AAA}, el error de gesto y el ` +
        `de busqueda no se pueden separar en la medicion. La configuracion es valida.`,
    });
  }

  if (prefersReducedMotion) {
    salida.push({
      codigo: 'movimientoReducidoDelSistema',
      mensaje:
        'Tu sistema pide movimiento reducido, asi que el interruptor esta activo y no se ' +
        'puede apagar desde aqui.',
    });
  }

  // El encargo del sistema 8: si el banco no da para lo pedido, el terapeuta necesita
  // saberlo ANTES de interpretar el resultado, no despues.
  if (ultimoTablero !== null) {
    const dif = Math.abs(ultimoTablero.svPedida - ultimoTablero.svEfectiva);
    if (dif > 0.1) {
      salida.push({
        codigo: 'similitudNoAlcanzada',
        mensaje:
          `El banco no da para la similitud visual pedida: el paciente vio ` +
          `${ultimoTablero.svEfectiva.toFixed(2)} en lugar de ` +
          `${ultimoTablero.svPedida.toFixed(2)}.`,
      });
    }
  }

  return salida;
}

/**
 * Como se describe un rango. **Un rango degenerado y uno abierto se distinguen a la
 * vista**: con la politica `fija` los dos se comportan igual, y confundirlos hara que
 * alguien crea que la adaptativa esta activa cuando no lo esta.
 *
 * @param {{ min: number, max: number }} rango
 * @param {string} unidad
 * @returns {string}
 */
export function describirRango(rango, unidad = '') {
  const u = unidad === '' ? '' : ` ${unidad}`;
  if (rango.min === rango.max) return `Valor fijo: ${rango.min}${u}`;
  return `Rango ${rango.min}–${rango.max}${u}, politica fija: se usa ${rango.min}${u}`;
}
