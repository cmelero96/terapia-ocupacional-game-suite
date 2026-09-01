/**
 * Sesion VIVA: reconfigurar sin recargar la pagina.
 *
 * Era el bloqueante S1 del informe cruzado del 2026-08-26, y el peor de los evitables:
 *
 * > Medido en el navegador: dos tableros y dos intentos DESAPARECEN. `alAplicar` hacia
 * > `location.href = url`, una recarga completa, y el registro vive en memoria. Es el
 * > flujo central del producto —el terapeuta ajusta una perilla a mitad de sesion— y
 * > borraba en silencio todo lo medido.
 *
 * La solucion no es guardar antes de recargar: es **no recargar**. Se desmonta el
 * instrumento, se construye otro con la configuracion nueva, y **el registro y la sesion
 * sobreviven** porque nunca se destruyeron.
 *
 * Y eso cumple lo que el GDD del sistema 11 ya decia: *"aplicar surte efecto en el tablero
 * siguiente"*. Un tablero nuevo, no una sesion nueva.
 */

import { arrancar } from './raiz.js';

/**
 * @typedef {Parameters<typeof arrancar>[0]} Entrada
 */

/**
 * @param {Entrada} entradaInicial
 */
export function crearSesionViva(entradaInicial) {
  /** @type {Entrada} */
  let entrada = { ...entradaInicial };
  /** @type {ReturnType<typeof arrancar>} */
  let actual = arrancar(entrada);

  /**
   * El registro y la sesion de la PRIMERA construccion. Se conservan a traves de cada
   * reconfiguracion: son lo que no debe morir.
   */
  const registro = actual.registro;
  const sesion = actual.sesion;

  /**
   * Reconfigura sin recargar. Los tableros ya cerrados siguen en la sesion.
   *
   * @param {object} cambios
   * @param {{ t: number, C: number, sv: number, ss: number }} [cambios.config]
   * @param {import('../instrumentos/instrumento-dom.js').Acceso} [cambios.acceso]
   * @param {string} [cambios.varianteContenido] Sistema 32
   * @param {Entrada['tipo']} [cambios.tipo]
   */
  function reconfigurar(cambios) {
    // Cierra el tablero en curso ANTES de cambiar nada: sus intentos pertenecen a la
    // configuracion con la que se jugaron, no a la nueva.
    // El tablero en curso NO está resuelto: si lo estuviera, se habría cerrado solo al
    // avanzar. Sus intentos se conservan marcados como incompletos — bloqueante S4.
    actual.cerrarTablero({ resuelto: false });
    actual.montado.desconectar();

    entrada = {
      ...entrada,
      ...(cambios.config === undefined ? {} : { config: cambios.config }),
      ...(cambios.acceso === undefined ? {} : { acceso: cambios.acceso }),
      ...(cambios.varianteContenido === undefined
        ? {} : { varianteContenido: cambios.varianteContenido }),
      ...(cambios.tipo === undefined ? {} : { tipo: cambios.tipo }),
    };

    // Se le PASA la sesion existente: si no, el instrumento nuevo cerraria sus tableros
    // en una sesion recien creada y los datos se partirian en dos.
    actual = arrancar({ ...entrada, existente: { registro, sesion } });
    return actual;
  }

  return {
    get estado() { return actual; },
    registro,
    sesion,
    reconfigurar,
    /** La sesion con TODOS los tableros cerrados, incluido el que esta en curso. */
    sesionConTableros: () => {
      actual.cerrarTablero({ resuelto: false });
      return sesion;
    },
  };
}
