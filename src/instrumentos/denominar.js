/**
 * Instrumento Denominacion. Sistema 24.
 *
 * **Es Busca con el objetivo presentado como PALABRA en lugar de como imagen.** La regla de
 * acierto es literalmente la misma, y eso es la prueba de que el coste marginal es cero:
 * lo que cambia es la presentacion, no la logica.
 *
 * Y la capacidad que entrena es completamente distinta: acceso lexico (A8) en lugar de
 * atencion selectiva y discriminacion visual (A5 y A6). Sin la imagen de referencia, el
 * paciente tiene que recuperar la forma a partir de la palabra.
 *
 * **Requiere lectura, y eso se declara, no se adapta.** La limitacion B6 del sistema 15
 * —comprension verbal limitada— hace este instrumento inadecuado para parte de la
 * poblacion. Un instrumento que exige leer no se puede hacer accesible a quien no lee sin
 * convertirse en otro instrumento.
 *
 * design/gdd/instrumentos-clasificar-y-denominar.md
 */

import { Busca } from './busca.js';

/** Este instrumento exige lectura. El panel lo dice al elegirlo. */
export const EXIGE_LECTURA = true;

/**
 * Un elemento solo puede ser objetivo de denominacion si tiene nombre. Un objetivo sin
 * nombre no se puede presentar como palabra.
 *
 * @param {{ nombre?: string }} estimulo
 * @returns {boolean}
 */
export function puedeSerObjetivo(estimulo) {
  return typeof estimulo.nombre === 'string' && estimulo.nombre.trim() !== '';
}

/**
 * El estado del instrumento es el de Busca. La unica diferencia vive en la presentacion,
 * asi que esta clase existe para nombrar el instrumento —el registro lo necesita— y para
 * declarar `mostrarGlifoDeReferencia`, que es lo que el enlace con el DOM consulta.
 */
export class Denominar extends Busca {
  /** @param {ConstructorParameters<typeof Busca>[0]} entrada */
  constructor(entrada) {
    super(entrada);
    /**
     * La zona de referencia muestra SOLO el nombre. Si mostrara la imagen, la tarea
     * volveria a ser la de Busca.
     *
     * @type {boolean}
     */
    this.mostrarGlifoDeReferencia = false;
    /** @type {'denominar'} */
    this.instrumento = 'denominar';
  }
}
