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
   * El registro de la PRIMERA construccion. Se conserva a traves de todo: es lo que no debe
   * morir, y guarda todas las sesiones de la jornada.
   */
  const registro = actual.registro;

  /**
   * La sesion EN CURSO. Cambia solo al terminar una y empezar otra.
   *
   * @type {import('../registro/sesion.js').Sesion}
   */
  let sesionActual = actual.sesion;

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
    actual = arrancar({ ...entrada, existente: { registro, sesion: sesionActual } });
    return actual;
  }

  /**
   * Termina la sesion en curso y empieza otra. **El paciente siguiente.**
   *
   * ## Por que hace falta, y por que no existia
   *
   * El GDD del sistema 9 dice que el registro guarda hasta 20 sesiones porque *«20 sesiones
   * son mucho mas de lo que una jornada de consulta produce»*. O sea que el diseño **cuenta
   * con varias sesiones por jornada**.
   *
   * Y no habia ninguna forma de abrir la segunda: una sesion se abria al cargar la pagina, y
   * punto. Para pasar al paciente siguiente habia que recargar, que es exactamente lo que
   * destruye el registro — el bloqueante S1 otra vez, ahora por la puerta de la jornada.
   *
   * ## Lo que hace y lo que NO hace
   *
   * Cierra el tablero en curso marcandolo incompleto, deja la sesion terminada **en el
   * registro** —de donde el terapeuta puede seguir leyendola— y abre una nueva en el mismo
   * registro.
   *
   * **No guarda nada en ningun sitio.** En el primer hito no hay persistencia por diseño: el
   * registro vive en memoria y muere al cerrar el navegador. Eso no es un descuido, es una
   * decision aplazada sobre datos de salud — y la pantalla lo tiene que decir.
   *
   * @returns {import('../registro/sesion.js').Sesion} La sesion que se acaba de terminar
   */
  function terminarYEmpezarOtra() {
    // El tablero en curso NO esta resuelto: si lo estuviera, se habria cerrado solo.
    actual.cerrarTablero({ resuelto: false });
    actual.montado.desconectar();
    const terminada = sesionActual;

    // Sin `sesion` en `existente`: eso es lo que hace que `arrancar` abra una nueva en el
    // MISMO registro, conservando las anteriores.
    actual = arrancar({ ...entrada, existente: { registro } });
    sesionActual = actual.sesion;
    return terminada;
  }

  return {
    get estado() { return actual; },
    registro,
    get sesion() { return sesionActual; },
    reconfigurar,
    terminarYEmpezarOtra,
    /** La sesion con TODOS los tableros cerrados, incluido el que esta en curso. */
    sesionConTableros: () => {
      actual.cerrarTablero({ resuelto: false });
      return sesionActual;
    },
  };
}
