/**
 * Enlace con el DOM para los NUEVE instrumentos.
 *
 * Un elemento por objeto, con `role="button"`, nombre accesible y foco real — ADR-0005.
 *
 * Y aqui viven las **cinco vias de acceso** del sistema 5. Las tres primeras las da el
 * navegador; las dos ultimas se construyen sobre el foco y el reloj inyectado:
 *
 *   tactil · raton · teclado      →  eventos de puntero y tecla
 *   pulsador por barrido          →  el foco AVANZA solo, y una tecla activa
 *   activacion por permanencia    →  mantener el puntero sobre un objeto activa
 *
 * **El barrido mueve el FOCO, no un cursor propio.** Lo fija ADR-0005: el foco ya existe,
 * ya es visible con `:focus-visible` y ya lo anuncia el lector de pantalla. Un cursor
 * propio seria un segundo modelo de foco que hay que mantener de acuerdo con el primero.
 */

import { conectar } from '../entrada/borde-eventos.js';
import { disposicion } from './busca.js';
import { latencia } from '../registro/sesion.js';
import { Permanencia, cadenciaBarrido, pxTolerancia, conModoDeAcceso } from '../entrada/adaptador.js';

/** El acuse existe antes de que el tablero cambie. Ver el GDD del sistema 10. */
const MS_ACUSE = 120;

/** Cada cuanto se muestrea la permanencia. Es un muestreo, no un limite de tiempo. */
const MS_TICK_PERMANENCIA = 50;

/**
 * @typedef {object} Acceso
 * @property {boolean} barrido
 * @property {number} msVuelta
 * @property {boolean} permanencia
 * @property {number} msPermanencia
 */

/**
 * @param {object} entrada
 * @param {HTMLElement} entrada.raiz
 * @param {HTMLElement} entrada.zonaObjetivo
 * @param {HTMLElement} entrada.zonaContenedores
 * @param {string} entrada.tipo
 * @param {any} entrada.instrumento
 * @param {import('../plataforma/esquema.js').RelojMonotono} entrada.reloj
 * @param {import('../presentacion/estimulo.js').PoliticaPresentacion} entrada.politica
 * @param {import('../entrada/adaptador.js').Programador} entrada.programador
 * @param {Acceso} [entrada.acceso]
 * @param {(cierre: { resuelto: boolean }) => void} [entrada.alAvanzar]
 *   Cierra el tablero en el registro ANTES de repintar.
 *
 *   `resuelto` es el dato que hacía falta para el bloqueante S4. Un tablero avanza por dos
 *   motivos distintos y hasta ahora se registraban igual: el paciente lo resolvió, o el
 *   instrumento pasó al siguiente sin que lo resolviera —el tres en raya sortea otra
 *   operación cuando se falla la anterior—. Sin distinguirlos, un tablero fallado se
 *   registra como uno completado.
 */
export function montarInstrumento({
  raiz, zonaObjetivo, zonaContenedores, tipo, instrumento, reloj, politica, programador,
  acceso = { barrido: false, msVuelta: 12000, permanencia: false, msPermanencia: 800 },
  alAvanzar,
}) {
  let pausado = false;
  /** @type {number | null} */
  let tInicio = null;
  /** @type {number} */
  let iBarrido = -1;
  /**
   * El número de tablero visto por última vez. Es el criterio para saber si un tablero
   * TERMINÓ, en lugar de `r.avanza`, que también es verdadero al avanzar dentro del tablero.
   *
   * @type {number}
   */
  let ultimoTableroNumero = instrumento.tableroNumero;

  raiz.dataset['sinMovimiento'] = politica.sinMovimiento ? 'si' : 'no';
  raiz.dataset['instrumento'] = tipo;

  /**
   * @param {import('./busca.js').Estimulo} e
   * @param {string} clase
   * @param {string} [claseExtra]
   * @returns {HTMLButtonElement}
   */
  function boton(e, clase, claseExtra = '') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `${clase}${claseExtra === '' ? '' : ` ${claseExtra}`}`;
    b.dataset['id'] = e.id;
    b.dataset['clase'] = clase === 'celda' ? 'objeto' : 'contenedor';
    // El nombre accesible sale del campo `name` del manifiesto, nunca de la ruta.
    b.setAttribute('aria-label', e.nombre);
    const g = document.createElement('span');
    g.setAttribute('aria-hidden', 'true');
    g.textContent = e.glifo;
    b.append(g);
    return b;
  }

  /** @returns {HTMLElement[]} Los objetos alcanzables, en orden de recorrido */
  function alcanzables() {
    /** @type {HTMLElement[]} */
    const salida = [];
    for (const e of raiz.querySelectorAll('.celda')) {
      if (e instanceof HTMLElement) salida.push(e);
    }
    if (!zonaContenedores.hidden) {
      for (const e of zonaContenedores.querySelectorAll('.contenedor:not([disabled])')) {
        if (e instanceof HTMLElement) salida.push(e);
      }
    }
    return salida;
  }

  /** @param {number} i */
  function enfocarBarrido(i) {
    const lista = alcanzables();
    if (lista.length === 0) return;
    iBarrido = ((i % lista.length) + lista.length) % lista.length;
    lista[iBarrido]?.focus();
  }

  function pintar() {
    const objetivo = instrumento.objetivo();

    // --- Zona de referencia. FUERA del tablero y no activable: si el paciente pudiera
    // activarla, la tarea cambia.
    zonaObjetivo.replaceChildren();
    // Denominacion NUNCA muestra glifo. Los de texto lo muestran solo si su estimulo tiene
    // uno: un simbolo si, una palabra con hueco no.
    if (tipo !== 'denominar' && objetivo.glifo !== '') {
      const g = document.createElement('span');
      g.className = 'objetivo-glifo';
      g.textContent = objetivo.glifo;
      g.setAttribute('aria-hidden', 'true');
      zonaObjetivo.append(g);
    }
    const n = document.createElement('span');
    n.className = 'objetivo-nombre';
    n.textContent = objetivo.nombre;
    zonaObjetivo.append(n);

    // --- Tablero.
    const celdas = instrumento.celdas();
    const { columnas, sep } = disposicion(Math.max(celdas.length, 2), instrumento.t);
    raiz.style.setProperty('--t', `${instrumento.t}px`);
    raiz.style.setProperty('--cols', String(columnas));
    raiz.style.setProperty('--sep', `${sep}px`);

    const esTexto = tipo === 'rellenar' || tipo === 'simbolos'
      || tipo === 'precios' || tipo === 'ordenar' || tipo === 'tresEnRaya';
    raiz.dataset['texto'] = esTexto ? 'si' : 'no';

    raiz.replaceChildren();
    for (const c of celdas) {
      const b = boton(c, 'celda', esTexto ? 'celda-texto' : '');
      // La seleccion NO es el foco: el foco lo usa el barrido para recorrer, y la seleccion
      // sobrevive a su movimiento. Se distinguen por FORMA ademas de color.
      if (tipo === 'clasificar' && instrumento.seleccionado === c.id) {
        b.dataset['seleccionado'] = 'si';
        b.setAttribute('aria-pressed', 'true');
      } else if (tipo === 'clasificar') {
        b.setAttribute('aria-pressed', 'false');
      }
      raiz.append(b);
    }

    // --- Zona de destino: contenedores de clasificar, o el tablero 3x3.
    zonaContenedores.replaceChildren();
    zonaContenedores.hidden = tipo !== 'clasificar' && tipo !== 'tresEnRaya';
    zonaContenedores.dataset['rejilla3'] = tipo === 'tresEnRaya' ? 'si' : 'no';

    if (tipo === 'tresEnRaya') {
      zonaContenedores.style.setProperty('--t', `${instrumento.t}px`);
      for (const c of instrumento.contenedoresTablero()) {
        const b = boton(c, 'contenedor', 'casilla');
        b.dataset['dueno'] = c.dueño ?? 'libre';
        // Con la operacion sin acertar, las casillas no son alcanzables: colocar sin
        // resolver saltaria la tarea entera.
        b.disabled = !instrumento.puedeColocar || c.dueño !== null;
        zonaContenedores.append(b);
      }
    } else if (tipo === 'clasificar') {
      zonaContenedores.style.setProperty('--t', `${instrumento.t}px`);
      for (const cat of instrumento.contenedores) {
        const b = boton({ id: cat, nombre: cat, glifo: '' }, 'contenedor');
        const et = document.createElement('span');
        et.className = 'contenedor-etiqueta';
        et.textContent = cat;
        b.append(et);
        zonaContenedores.append(b);
      }
    }

    tInicio = reloj.now();
    if (acceso.barrido) enfocarBarrido(0);
  }

  // ---------------------------------------------------------------- activacion comun

  /**
   * Una sola via de activacion para las cinco entradas. El instrumento no sabe —y no puede
   * saber— si vino de un dedo, una tecla, un pulsador o una permanencia.
   *
   * @param {import('../entrada/adaptador.js').EventoActivacion} eventoEntrada
   */
  function procesar(eventoEntrada) {
    const { idObjetivo, tActivacion, origenTiempo } = eventoEntrada;
    if (pausado) return;

    const lat = tInicio === null
      ? /** @type {import('../registro/sesion.js').Latencia} */ (
          { ms: undefined, motivo: 'relojRetrocedio' })
      : latencia(tInicio, tActivacion, 'reloj', origenTiempo);

    const elemento = document.querySelector(`[data-id="${CSS.escape(idObjetivo)}"]`);
    const clase = elemento instanceof HTMLElement
      ? (elemento.dataset['clase'] ?? 'objeto')
      : 'objeto';

    // ACUSE DE RECIBO. Identico para acierto y para fallo: el elemento no sabe cual fue.
    if (elemento instanceof HTMLElement) {
      elemento.dataset['acuse'] = 'si';
      elemento.addEventListener(
        'transitionend', () => { delete elemento.dataset['acuse']; }, { once: true },
      );
    }

    // **El modo NO se fabrica aqui.** Viene de la capa de entrada, que es la unica que
    // sabe por que via llego la activacion. Antes esto decia `modo: 'tactil'` a mano, y
    // registraba una via falsa para cada paciente que usara pulsador o permanencia.
    const evento = conModoDeAcceso(eventoEntrada, acceso.barrido);
    const r = tipo === 'clasificar'
      ? instrumento.activar(evento, lat, /** @type {'objeto'|'contenedor'} */ (clase))
      : instrumento.activar(evento, lat);

    // En clasificar, la primera activacion solo SELECCIONA: hay que repintar para que el
    // indicador aparezca, pero NADA se ha registrado.
    if (tipo === 'clasificar' && r.registrado === false) {
      programador.programar(() => { pintar(); }, MS_ACUSE);
      return;
    }
    // ¿Ha cambiado el TABLERO, o solo se ha avanzado dentro de él?
    //
    // `r.avanza` no sirve para decidirlo, y esto se midió en el navegador: `Ordenar`
    // devuelve `avanza: true` en CADA palabra colocada, y `Comprar` en cada artículo
    // cogido. Con `r.avanza` como criterio, una frase de cuatro palabras producía cuatro
    // registros de tablero con el mismo objetivo y la misma semilla, y una compra
    // completada producía tres. Medido: `ordenar` daba 2 registros con la frase todavía
    // sin acabar, y `comprar` 3 registros para 1 compra.
    //
    // Y con el campo `incompleto` del bloqueante S4 dejaba de ser solo un recuento
    // inflado: cada palabra cerraba un registro marcado como COMPLETO, así que el campo
    // nuevo era falso justo en los dos instrumentos de varios pasos.
    //
    // El criterio correcto es `tableroNumero`, que los nueve instrumentos ya exponen y
    // que **solo** cambia cuando el tablero de verdad termina.
    //
    // LIMITACIÓN DECLARADA — tres en raya: su `tableroNumero` cuenta PARTIDAS, mientras
    // que su `tablero` describe la operación en curso. El registro de una partida lleva
    // por tanto la última operación como objetivo, no todas. Es coherente con contar una
    // partida como un tablero, pero los datos de reproducción de ese registro describen
    // solo el último paso. Queda para el GDD del tercer eje de dificultad.
    const tableroCambio = instrumento.tableroNumero !== ultimoTableroNumero;
    if (tableroCambio) {
      ultimoTableroNumero = instrumento.tableroNumero;
      // El tablero se cierra en el registro ANTES de pintar el siguiente: si no, sus
      // intentos se atribuirian a la dificultad del tablero nuevo.
      // Y se resolvió si la activación que lo cerró fue CORRECTA: no basta con que haya
      // avanzado, porque hay instrumentos que avanzan tras un fallo.
      if (alAvanzar !== undefined) alAvanzar({ resuelto: r.correcto });
    }
    if (r.avanza) {
      programador.programar(() => { pintar(); }, MS_ACUSE);
    }
  }

  const desconectarPuntero = conectar({
    contenedor: document.body,
    t: instrumento.t,
    reloj,
    alActivar: (evento) => {
      procesar(evento);
    },
  });

  // ---------------------------------------------------------------- barrido por pulsador

  /** @type {number | null} */
  let tareaBarrido = null;

  function cadencia() {
    if (!acceso.barrido) return null;
    return cadenciaBarrido(Math.max(alcanzables().length, 3), acceso.msVuelta);
  }

  function arrancarBarrido() {
    const c = cadencia();
    if (c === null) return;
    const paso = () => {
      // **Sin limite de vueltas.** Un limite seria presion de tiempo por la puerta de
      // atras: que la cadencia expire solo puede producir "todavia no", nunca un fallo.
      if (!pausado) enfocarBarrido(iBarrido + 1);
      tareaBarrido = programador.programar(paso, c.msPorPaso);
    };
    tareaBarrido = programador.programar(paso, c.msPorPaso);
  }

  // ---------------------------------------------------------------- permanencia

  /** @type {Permanencia | null} */
  const permanencia = acceso.permanencia
    ? new Permanencia(acceso.msPermanencia, reloj)
    : null;
  /** @type {number | null} */
  let tareaPermanencia = null;
  /** @type {HTMLElement | null} */
  let sobre = null;
  /** @type {{ x: number, y: number } | null} */
  let ancla = null;

  function salirDeObjeto() {
    if (permanencia === null) return;
    // Salir REINICIA la cuenta, no la pausa: pausar haria que dos toques accidentales
    // separados por un minuto activaran algo.
    permanencia.salir();
    if (sobre !== null) sobre.style.removeProperty('--dwell');
    sobre = null;
    ancla = null;
  }

  /** @param {Event} e */
  function entrarEnObjeto(e) {
    if (permanencia === null || pausado) return;
    const destino = e.target;
    if (!(destino instanceof Element)) return;
    const objeto = destino.closest('[data-id]');
    if (!(objeto instanceof HTMLElement)) return;
    const id = objeto.dataset['id'];
    if (id === undefined) return;
    sobre = objeto;
    if (e instanceof PointerEvent) ancla = { x: e.clientX, y: e.clientY };
    permanencia.entrar(id);
  }

  /** @param {Event} e */
  function moverSobreObjeto(e) {
    if (permanencia === null || sobre === null || ancla === null) return;
    if (!(e instanceof PointerEvent)) return;
    // Un movimiento por debajo de la tolerancia NO reinicia la cuenta. Sin esta zona, la
    // permanencia es inservible para quien tiene temblor, que es buena parte de quien la
    // necesita.
    if (Math.hypot(e.clientX - ancla.x, e.clientY - ancla.y) > pxTolerancia(instrumento.t)) {
      salirDeObjeto();
    }
  }

  function arrancarPermanencia() {
    if (permanencia === null) return;
    const tick = () => {
      if (!pausado && sobre !== null) {
        // El progreso es VISIBLE y no viola el pilar 2: muestra "te estoy escuchando", no
        // "vas bien". Y NO se anuncia por lector de pantalla: un anuncio por fotograma
        // seria insoportable, y con sensibilidad sensorial confirmada, perjudicial.
        sobre.style.setProperty('--dwell', String(permanencia.progreso()));
        const activacion = permanencia.comprobar();
        if (activacion !== null) {
          const objeto = sobre;
          salirDeObjeto();
          objeto.style.removeProperty('--dwell');
          procesar(activacion);
        }
      }
      tareaPermanencia = programador.programar(tick, MS_TICK_PERMANENCIA);
    };
    tareaPermanencia = programador.programar(tick, MS_TICK_PERMANENCIA);
    document.body.addEventListener('pointerover', entrarEnObjeto);
    document.body.addEventListener('pointermove', moverSobreObjeto);
    document.body.addEventListener('pointerout', salirDeObjeto);
  }

  // ---------------------------------------------------------------- ciclo de vida

  pintar();
  if (acceso.barrido) arrancarBarrido();
  if (acceso.permanencia) arrancarPermanencia();

  return {
    pintar,
    cadencia,
    desconectar: () => {
      desconectarPuntero();
      if (tareaBarrido !== null) programador.cancelar(tareaBarrido);
      if (tareaPermanencia !== null) programador.cancelar(tareaPermanencia);
      document.body.removeEventListener('pointerover', entrarEnObjeto);
      document.body.removeEventListener('pointermove', moverSobreObjeto);
      document.body.removeEventListener('pointerout', salirDeObjeto);
    },
    pausar: () => {
      pausado = true;
      salirDeObjeto();
      if (typeof instrumento.limpiarSeleccion === 'function') instrumento.limpiarSeleccion();
    },
    reanudar: () => { pausado = false; pintar(); },
    estaPausado: () => pausado,
  };
}
