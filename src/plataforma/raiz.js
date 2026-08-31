/**
 * RAIZ DE COMPOSICION del MVP. La posee el sistema 10, por ADR-0005.
 *
 * Hace exactamente tres cosas:
 *   1. Construir la fabrica impura, una vez, al arrancar
 *   2. Repartir reloj, fuente y programador hacia abajo, POR PARAMETRO
 *   3. Montar el instrumento que se le pida
 *
 * **NO esta exenta de la regla 1**: no llama a ninguna fuente no determinista, solo mueve
 * parametros. Construir y repartir son cosas distintas.
 *
 * Va a ser un archivo aburrido y verboso, y crecera con cada instrumento. Es el sitio
 * correcto donde poner esa verbosidad.
 */

import {
  relojMonotono, relojPared, crearFuenteDeProduccion, medirResolucionReloj, programadorReal,
} from './borde-impuro.js';
import { generarTablero } from '../tablero/generador.js';
import { Busca } from '../instrumentos/busca.js';
import { Denominar, puedeSerObjetivo as puedeDenominar } from '../instrumentos/denominar.js';
import {
  Clasificar, contenedores, puedeSerObjetivo as puedeClasificar,
} from '../instrumentos/clasificar.js';
import { montarInstrumento } from '../instrumentos/instrumento-dom.js';
import {
  Elegir, fuenteRellenar, fuenteSimbolos, fuentePrecios,
} from '../instrumentos/elegir.js';
import { Ordenar } from '../instrumentos/ordenar.js';
import { TresEnRaya } from '../instrumentos/tres-en-raya.js';
import { Comprar } from '../instrumentos/comprar.js';
import {
  PALABRAS_CON_HUECO, SIMBOLOS, PRECIOS_2026, PRECIOS_FECHA, FRASES,
} from '../contenido/provisional.js';
import { crearFuenteAleatoria } from './aleatoriedad.js';
import { Registro } from '../registro/sesion.js';
import { politicaPresentacion, CONFIGURACION_POR_DEFECTO } from '../presentacion/estimulo.js';
import { validarConfiguracion, ejesAcoplados, dm, dp } from '../dificultad/modelo.js';

/**
 * @typedef {import('../tablero/generador.js').Elemento & { nombre: string, glifo: string }} EntradaBanco
 */

/**
 * @param {object} entrada
 * @param {HTMLElement} entrada.raiz
 * @param {HTMLElement} entrada.zonaObjetivo
 * @param {HTMLElement} entrada.zonaContenedores
 * @param {'busca'|'denominar'|'clasificar'|'rellenar'|'simbolos'|'precios'|'ordenar'|'tresEnRaya'|'comprar'} entrada.tipo
 * @param {EntradaBanco[]} entrada.banco
 * @param {{ t: number, C: number, sv: number, ss: number }} entrada.config
 * @param {number} [entrada.nContenedores]
 * @param {boolean} [entrada.prefersReducedMotion]
 */
export function arrancar({
  raiz, zonaObjetivo, zonaContenedores, tipo, banco, config,
  nContenedores = 3, prefersReducedMotion = false,
}) {
  validarConfiguracion(config);

  const resolucion = medirResolucionReloj();
  const registro = new Registro();
  const sesion = registro.abrirSesion({
    relojPared, resolucion, ejesAcoplados: ejesAcoplados(config.t),
  });
  const politica = politicaPresentacion(CONFIGURACION_POR_DEFECTO, prefersReducedMotion);

  /**
   * @param {string} id
   * @returns {import('../instrumentos/clasificar.js').EstimuloClasificable}
   */
  const resolver = (id) => {
    const e = banco.find((x) => x.id === id);
    // Nunca lanza con un id desconocido: un dato antiguo incompleto es aceptable, una
    // pantalla que se rompe al abrirlo no. Y no se oculta, para no perder la trazabilidad
    // de que vio el paciente.
    if (e === undefined) {
      return { id, nombre: `estimulo desconocido: ${id}`, glifo: '?', categories: [] };
    }
    return { id: e.id, nombre: e.nombre, glifo: e.glifo, categories: e.categories };
  };

  // --- Los instrumentos que NO usan el banco de imagenes.
  //
  // Su contenido es texto, simbolo o numero, y viene de `src/contenido/provisional.js`.
  // No necesitan generacion de tableros: no hay pool visual ni semantico que muestrear.
  /** @type {import('../instrumentos/elegir.js').FuenteDeRondas | null} */
  const fuenteDeRondas =
    tipo === 'rellenar' ? fuenteRellenar(PALABRAS_CON_HUECO)
    : tipo === 'simbolos' ? fuenteSimbolos(SIMBOLOS)
    : tipo === 'precios' ? fuentePrecios(PRECIOS_2026, PRECIOS_FECHA)
    : null;

  const sinBanco = fuenteDeRondas !== null
    || tipo === 'ordenar' || tipo === 'tresEnRaya' || tipo === 'comprar';

  if (sinBanco) {
    /** @type {any} */
    const inst = tipo === 'tresEnRaya'
      ? new TresEnRaya({
          t: config.t,
          // Enum de CONTENIDO, no escala de dificultad. La aritmetica no cabe en los dos
          // ejes del sistema 4, y ese tercer eje nadie lo ha decidido.
          tipoOperacion: 'sumaHasta10',
          nOpciones: Math.min(Math.max(config.C, 2), 6),
          nuevaFuente: crearFuenteDeProduccion,
        })
      : tipo === 'comprar'
      ? new Comprar({
          t: config.t,
          catalogo: PRECIOS_2026,
          C: config.C,
          // La lista es un tercio del lineal, al menos dos articulos.
          nLista: Math.max(2, Math.round(config.C / 3)),
          nuevaFuente: crearFuenteDeProduccion,
        })
      : fuenteDeRondas !== null
      ? new Elegir({
          t: config.t,
          fuente: fuenteDeRondas,
          // La cantidad de opciones sale de `C`, acotada: mas de 6 opciones de texto no
          // caben en una linea legible al tamaño de objetivo del rango clinico.
          nOpciones: Math.min(Math.max(config.C, 2), 6),
          nuevaFuente: crearFuenteDeProduccion,
        })
      : new Ordenar({
          t: config.t, frases: FRASES, C: config.C, nuevaFuente: crearFuenteDeProduccion,
        });

    /** @type {number} */
    let cerrados = 0;
    const cerrar = () => {
      const intentos = inst.intentos.slice(cerrados);
      if (intentos.length === 0) return;
      cerrados = inst.intentos.length;
      sesion.tableros.push({
        objetivo: inst.tablero.objetivo,
        distractores: inst.tablero.distractores,
        semilla: inst.tablero.semilla,
        schemaVersion: 'provisional',
        dm: dm(config.t),
        // Estos instrumentos no tienen similitud visual ni semantica, asi que `dp` sale
        // solo de la cantidad. Es una escala mas pobre, y decirlo importa.
        dp: dp(Math.min(Math.max(config.C, 3), 100), 0, 0),
        dpPedida: dp(Math.min(Math.max(config.C, 3), 100), 0, 0),
        intentos,
      });
    };

    const montadoSimple = montarInstrumento({
      raiz, zonaObjetivo, zonaContenedores, tipo, instrumento: inst,
      reloj: relojMonotono, politica, programador: programadorReal, alAvanzar: cerrar,
    });

    return {
      instrumento: inst, registro, sesion, resolucion, montado: montadoSimple, tipo,
      programador: programadorReal,
      avisoContenido: fuenteDeRondas?.aviso,
      sesionConTableros: () => { cerrar(); return sesion; },
      cerrarTablero: cerrar,
    };
  }

  // Cada instrumento excluye del sorteo lo que no puede presentar: denominacion necesita
  // nombre, y clasificar necesita al menos una categoria.
  const activos = banco.filter((e) => e.status === 'activo');
  const elegibles = activos.filter((e) => {
    if (tipo === 'denominar') return puedeDenominar(e);
    if (tipo === 'clasificar') return puedeClasificar(e);
    return true;
  });
  if (elegibles.length === 0) {
    throw new Error(`arrancar: ningun elemento del banco puede ser objetivo de '${tipo}'`);
  }

  const todasLasCategorias = [...new Set(activos.flatMap((e) => e.categories))];

  /** @type {number} */
  let semillaActual = 1;

  const siguienteTablero = () => {
    const { semilla, fuenteAleatoria } = crearFuenteDeProduccion();
    semillaActual = semilla;
    const objetivo = elegibles[Math.floor(fuenteAleatoria() * elegibles.length)];
    if (objetivo === undefined) throw new Error('arrancar: sorteo vacio');
    return generarTablero({ banco, objetivo: objetivo.id, ...config, semilla, fuenteAleatoria });
  };

  /** @type {any} */
  let instrumento;

  /**
   * Los contenedores derivan de la semilla del tablero mas uno, asi que son reproducibles
   * con ella sin reusar la misma secuencia que consumio el tablero.
   */
  const contenedoresDelTablero = () => contenedores({
    categoriasObjetivo: resolver(instrumento.tablero.objetivo).categories,
    todasLasCategorias,
    nContenedores,
    fuenteAleatoria: crearFuenteAleatoria((semillaActual + 1) % 4294967296),
  });

  if (tipo === 'clasificar') {
    instrumento = new Clasificar({
      t: config.t, resolver, siguienteTablero, contenedoresDelTablero: () => [],
    });
    instrumento.contenedoresDelTablero = contenedoresDelTablero;
    instrumento.contenedores = contenedoresDelTablero();
  } else if (tipo === 'denominar') {
    instrumento = new Denominar({ t: config.t, resolver, siguienteTablero });
  } else {
    instrumento = new Busca({ t: config.t, resolver, siguienteTablero });
  }

  /**
   * UN REGISTRO POR TABLERO, no todos los intentos en uno.
   *
   * Colapsarlos hacia que `dificultadTolerada` observase un solo nivel de dificultad y
   * reportase un valor falso: 80 en lugar de 60 en el caso medido. Ver S2 del informe
   * cruzado del 2026-08-26.
   *
   * @type {number}
   */
  let intentosCerrados = 0;

  const cerrarTablero = () => {
    const t = instrumento.tablero;
    const intentos = instrumento.intentos.slice(intentosCerrados);
    if (intentos.length === 0) return;
    intentosCerrados = instrumento.intentos.length;
    sesion.tableros.push({
      objetivo: t.objetivo,
      distractores: t.distractores,
      semilla: t.semilla,
      schemaVersion: 'provisional',
      dm: dm(config.t),
      dp: dp(config.C, t.svEfectiva, t.ssEfectiva),
      dpPedida: dp(config.C, t.svPedida, t.ssPedida),
      intentos,
    });
  };

  const montado = montarInstrumento({
    raiz, zonaObjetivo, zonaContenedores, tipo, instrumento,
    reloj: relojMonotono, politica, programador: programadorReal,
    alAvanzar: cerrarTablero,
  });

  return {
    instrumento, registro, sesion, resolucion, montado, tipo,
    programador: programadorReal,
    avisoContenido: undefined,
    sesionConTableros: () => { cerrarTablero(); return sesion; },
    cerrarTablero,
  };
}
