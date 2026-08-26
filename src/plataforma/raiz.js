/**
 * RAIZ DE COMPOSICION del MVP. La posee el sistema 10, por ADR-0005.
 *
 * Hace exactamente tres cosas:
 *   1. Construir la fabrica impura, una vez, al arrancar
 *   2. Repartir reloj, fuente y programador hacia abajo, POR PARAMETRO
 *   3. Montar el instrumento
 *
 * **NO esta exenta de la regla 1**, y eso es el punto: no llama a ninguna fuente no
 * determinista, solo mueve parametros. Construir y repartir son cosas distintas, y el GDD
 * del sistema 5 forzo esa separacion al descubrir que la redaccion anterior dejaba el
 * indice falso en las dos lecturas posibles.
 *
 * Va a ser un archivo aburrido y verboso, y crecera con cada instrumento. Es el sitio
 * correcto donde poner esa verbosidad.
 */

import {
  relojMonotono, relojPared, crearFuenteDeProduccion, medirResolucionReloj, programadorReal,
} from './borde-impuro.js';
import { generarTablero } from '../tablero/generador.js';
import { Busca } from '../instrumentos/busca.js';
import { montarBusca } from '../instrumentos/busca-dom.js';
import { Registro } from '../registro/sesion.js';
import { politicaPresentacion, CONFIGURACION_POR_DEFECTO } from '../presentacion/estimulo.js';
import { validarConfiguracion, ejesAcoplados } from '../dificultad/modelo.js';

/**
 * @param {object} entrada
 * @param {HTMLElement} entrada.raiz
 * @param {HTMLElement} entrada.zonaObjetivo
 * @param {import('../tablero/generador.js').Elemento[]} entrada.banco
 * @param {(id: string) => import('../instrumentos/busca.js').Estimulo} entrada.resolver
 * @param {{ t: number, C: number, sv: number, ss: number }} entrada.config
 * @param {boolean} [entrada.prefersReducedMotion]
 */
export function arrancar({
  raiz, zonaObjetivo, banco, resolver, config, prefersReducedMotion = false,
}) {
  validarConfiguracion(config);

  // 1. La fabrica impura, una vez.
  const resolucion = medirResolucionReloj();

  // 2. El registro abre sesion con la resolucion medida, no supuesta: sin ese dato una
  //    latencia de 0 ms no se distingue de un fallo de medicion.
  const registro = new Registro();
  const sesion = registro.abrirSesion({
    relojPared,
    resolucion,
    ejesAcoplados: ejesAcoplados(config.t),
  });

  const politica = politicaPresentacion(CONFIGURACION_POR_DEFECTO, prefersReducedMotion);

  // 3. El instrumento. Una semilla NUEVA por tablero, y cada una se registra con el suyo.
  const activos = banco.filter((e) => e.status === 'activo');
  const siguienteTablero = () => {
    const { semilla, fuenteAleatoria } = crearFuenteDeProduccion();
    const objetivo = activos[Math.floor(fuenteAleatoria() * activos.length)];
    if (objetivo === undefined) throw new Error('arrancar: el banco activo esta vacio');
    return generarTablero({
      banco, objetivo: objetivo.id, ...config, semilla, fuenteAleatoria,
    });
  };

  const instrumento = new Busca({ t: config.t, resolver, siguienteTablero });

  const montado = montarBusca({
    raiz, zonaObjetivo, instrumento, reloj: relojMonotono, politica,
    programador: programadorReal,
    alRegistrar: () => {
      // El instrumento acumula sus intentos; el registro los toma al cerrar el tablero.
      // Aqui no se lee nada del registro: el instrumento ESCRIBE y no LEE.
    },
  });

  return { instrumento, registro, sesion, resolucion, programador: programadorReal, montado };
}
