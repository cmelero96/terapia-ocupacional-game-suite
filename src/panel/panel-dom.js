/**
 * Panel del terapeuta, y la frontera de modo. Sistema 11.
 *
 * **El panel es OPACO y cubre el tablero.** No es una barra lateral ni una superposicion
 * semitransparente: si el paciente viera el tablero, seguiria intentando resolverlo
 * mientras el terapeuta cambia la configuracion, y esos intentos entrarian al registro bajo
 * una configuracion que ya no es la que se estaba usando.
 *
 * design/gdd/panel-terapeuta.md
 */

import { conflictos, esAplicable, avisos, describirRango } from './conflictos.js';
import {
  presentarPrecision, presentarLatencia, presentarDificultadTolerada,
} from '../resultados/presentar.js';
import { resumenSesion } from '../registro/sesion.js';
import { dificultadTolerada } from '../dificultad/modelo.js';
import { T_MIN, T_MAX, C_MIN, C_MAX, T_AAA } from '../dificultad/constantes.js';

/**
 * @typedef {object} EstadoPanel
 * @property {boolean} abierto
 * @property {{ t: number, C: number, sv: number, ss: number }} config
 * @property {{ barrido: boolean, msVuelta: number, estimuloReducido: boolean, limitaciones: string[] }} acceso
 */

/** @param {string} etiqueta @param {HTMLElement[]} hijos @returns {HTMLFieldSetElement} */
function grupo(etiqueta, hijos) {
  const fs = document.createElement('fieldset');
  fs.className = 'grupo';
  const leyenda = document.createElement('legend');
  leyenda.textContent = etiqueta;
  fs.append(leyenda, ...hijos);
  return fs;
}

/**
 * @param {object} spec
 * @param {string} spec.id
 * @param {string} spec.etiqueta
 * @param {number} spec.valor
 * @param {number} spec.min
 * @param {number} spec.max
 * @param {number} spec.paso
 * @param {string} spec.unidad
 * @param {(v: number) => void} spec.alCambiar
 * @returns {HTMLElement}
 */
function deslizador({ id, etiqueta, valor, min, max, paso, unidad, alCambiar }) {
  const fila = document.createElement('div');
  fila.className = 'fila';

  const lab = document.createElement('label');
  lab.htmlFor = id;
  lab.textContent = etiqueta;

  const entrada = document.createElement('input');
  entrada.type = 'range';
  entrada.id = id;
  entrada.min = String(min);
  entrada.max = String(max);
  entrada.step = String(paso);
  entrada.value = String(valor);

  const salida = document.createElement('output');
  salida.className = 'valor';
  salida.htmlFor = id;
  // Los valores actuales son visibles SIN desplegar nada: si hay que abrir un menu para
  // ver a que esta `t`, el flujo de treinta segundos ya se rompio.
  salida.textContent = `${valor}${unidad}`;

  entrada.addEventListener('input', () => {
    const v = Number(entrada.value);
    salida.textContent = `${paso < 1 ? v.toFixed(2) : v}${unidad}`;
    alCambiar(v);
  });

  fila.append(lab, entrada, salida);
  return fila;
}

/**
 * @param {object} entrada
 * @param {HTMLElement} entrada.contenedor Dentro de `.frame-root`, NUNCA de `.board-root`
 * @param {EstadoPanel} entrada.estado
 * @param {number} entrada.bancoActivo
 * @param {() => number} entrada.anchoDisponible
 * @param {boolean} entrada.prefersReducedMotion
 * @param {() => { tableros: number, intentos: number, aciertos: number }} entrada.progreso
 * @param {() => import('../registro/sesion.js').Sesion | null} [entrada.sesion]
 * @param {() => { svPedida: number, svEfectiva: number } | null} entrada.ultimoTablero
 * @param {(config: EstadoPanel['config'], acceso: EstadoPanel['acceso']) => void} entrada.alAplicar
 * @param {() => void} [entrada.alAbrir] Pausa la sesion. LOGICA, no solo presentacional
 * @param {() => void} [entrada.alCerrar] Reanuda con un tablero nuevo
 * @returns {{ abrir: () => void, cerrar: () => void, estaAbierto: () => boolean }}
 */
export function montarPanel({
  contenedor, estado, bancoActivo, anchoDisponible, prefersReducedMotion,
  progreso, ultimoTablero, alAplicar, alAbrir, alCerrar, sesion,
}) {
  // Borrador: se edita aqui y solo pasa a `estado` al aplicar. Cerrar sin aplicar no
  // cambia nada.
  let borrador = { ...estado.config };
  let borradorAcceso = { ...estado.acceso };

  const dialogo = document.createElement('div');
  dialogo.className = 'panel';
  dialogo.setAttribute('role', 'dialog');
  dialogo.setAttribute('aria-modal', 'true');
  dialogo.setAttribute('aria-label', 'Panel del terapeuta');
  dialogo.hidden = true;

  const cuerpo = document.createElement('div');
  cuerpo.className = 'panel-cuerpo';

  const zonaAvisos = document.createElement('div');
  zonaAvisos.className = 'avisos';

  const aplicar = document.createElement('button');
  aplicar.type = 'button';
  aplicar.className = 'accion primaria';
  // El propio boton de aplicar ES la confirmacion, porque los cambios surten efecto en el
  // tablero SIGUIENTE. Un segundo paso de confirmacion en un flujo que debe durar treinta
  // segundos es exactamente lo que lo rompe.
  aplicar.textContent = 'Aplicar al tablero siguiente';

  const cerrarBoton = document.createElement('button');
  cerrarBoton.type = 'button';
  cerrarBoton.className = 'accion';
  cerrarBoton.textContent = 'Cerrar sin cambios';

  const zonaProgreso = document.createElement('p');
  zonaProgreso.className = 'progreso';

  function refrescarAvisos() {
    const lista = conflictos({
      config: borrador,
      acceso: { ...borradorAcceso },
      bancoActivo,
      anchoDisponible: anchoDisponible(),
    });
    const avs = avisos({
      config: borrador,
      prefersReducedMotion,
      ultimoTablero: ultimoTablero(),
    });

    zonaAvisos.replaceChildren();
    for (const c of lista) {
      const p = document.createElement('p');
      p.className = c.bloquea ? 'mensaje bloqueo' : 'mensaje aviso';
      p.dataset['bloquea'] = c.bloquea ? 'si' : 'no';
      // Icono MAS frase: la distincion entre bloqueo y aviso es de palabra, no de tono.
      // Un terapeuta con daltonismo tiene que poder distinguirlas.
      p.textContent = `${c.bloquea ? '⛔ No se puede aplicar. ' : '⚠ '}${c.mensaje}`;
      zonaAvisos.append(p);
    }
    for (const a of avs) {
      const p = document.createElement('p');
      p.className = 'mensaje aviso';
      p.dataset['bloquea'] = 'no';
      p.textContent = `⚠ ${a.mensaje}`;
      zonaAvisos.append(p);
    }

    aplicar.disabled = !esAplicable(lista);
  }

  /**
   * Pinta una metrica. **La limitacion va DENTRO del mismo contenedor que el valor**, no en
   * un pie ni en un `title`: un numero sin su limitacion adyacente es un numero que se va a
   * sobreinterpretar.
   *
   * Y una metrica sin dato **no se atenua**: "no se pudo medir" es informacion clinica, y a
   * menudo mas importante que el numero.
   *
   * @param {import('../resultados/presentar.js').Presentado} m
   * @returns {HTMLElement}
   */
  function metrica(m) {
    const bloque = document.createElement('div');
    bloque.className = 'metrica';
    bloque.dataset['tieneDato'] = m.tieneDato ? 'si' : 'no';

    const dt = document.createElement('span');
    dt.className = 'metrica-etiqueta';
    dt.textContent = m.etiqueta;

    const dd = document.createElement('span');
    dd.className = 'metrica-valor';
    dd.textContent = m.valor;

    bloque.append(dt, dd);

    if (m.limitacion !== undefined) {
      const lim = document.createElement('span');
      lim.className = 'metrica-limitacion';
      lim.textContent = m.limitacion;
      bloque.append(lim);
    }
    return bloque;
  }

  /** @returns {HTMLElement} */
  function seccionResultados() {
    const sec = document.createElement('section');
    sec.className = 'seccion resultados';
    const h = document.createElement('h2');
    h.textContent = 'Resultados de la sesión';
    sec.append(h);

    const s = sesion === undefined ? null : sesion();
    if (s === null || s.tableros.length === 0) {
      const p = document.createElement('p');
      p.className = 'metrica-valor';
      p.textContent = 'La sesión no llegó a empezar.';
      sec.append(p);
      return sec;
    }

    const res = resumenSesion(s);
    sec.append(metrica(presentarPrecision(res)));
    sec.append(metrica(presentarLatencia(res, {
      resolucionMs: s.resolucionMs, fiableParaPresupuesto: s.fiableParaPresupuesto,
    })));

    /** @type {import('../dificultad/modelo.js').Observacion[]} */
    const obsPerceptivo = [];
    for (const t of s.tableros) {
      for (const i of t.intentos) obsPerceptivo.push({ d: t.dp, acierto: i.correcto });
    }
    sec.append(metrica(presentarDificultadTolerada(
      dificultadTolerada(obsPerceptivo, { acoplados: s.ejesAcoplados }),
      'perceptivo',
    )));

    return sec;
  }

  function construir() {
    cuerpo.replaceChildren();

    // --- Ejercicio: se abre en esta pestaña, es la que se toca cada sesion.
    const seccionEjercicio = document.createElement('section');
    seccionEjercicio.className = 'seccion';
    const h2 = document.createElement('h2');
    h2.textContent = 'Ejercicio — de esta sesión';
    seccionEjercicio.append(h2);

    // Las cuatro perillas AGRUPADAS POR EJE. En lista plana, el terapeuta no descubre que
    // son dos ejes independientes, y la capacidad que el pilar 3 le da se queda sin usar.
    const ejeMotor = grupo('Eje motor — precisión del gesto', [
      deslizador({
        id: 'perilla-t', etiqueta: 'Tamaño de objetivo', valor: borrador.t,
        min: T_MIN, max: T_MAX, paso: 1, unidad: ' px',
        alCambiar: (v) => { borrador.t = v; refrescarAvisos(); },
      }),
      (() => {
        const nota = document.createElement('p');
        nota.className = 'nota';
        nota.textContent = describirRango({ min: borrador.t, max: borrador.t }, 'px');
        return nota;
      })(),
    ]);
    ejeMotor.setAttribute('aria-label', 'Eje motor');

    const ejePerceptivo = grupo('Eje perceptivo-cognitivo — dificultad de encontrar', [
      deslizador({
        id: 'perilla-c', etiqueta: 'Cantidad de objetos', valor: borrador.C,
        min: C_MIN, max: C_MAX, paso: 1, unidad: '',
        alCambiar: (v) => { borrador.C = v; refrescarAvisos(); },
      }),
      deslizador({
        id: 'perilla-sv', etiqueta: 'Similitud visual', valor: borrador.sv,
        min: 0, max: 1, paso: 0.05, unidad: '',
        alCambiar: (v) => { borrador.sv = v; refrescarAvisos(); },
      }),
      deslizador({
        id: 'perilla-ss', etiqueta: 'Similitud semántica', valor: borrador.ss,
        min: 0, max: 1, paso: 0.05, unidad: '',
        alCambiar: (v) => { borrador.ss = v; refrescarAvisos(); },
      }),
    ]);
    ejePerceptivo.setAttribute('aria-label', 'Eje perceptivo-cognitivo');

    seccionEjercicio.append(ejeMotor, ejePerceptivo);

    // --- Acceso: del PACIENTE, no del ejercicio. Separado a proposito: si estan en la
    // misma pantalla, alguien cambiara el modo de acceso creyendo que ajusta la dificultad.
    const seccionAcceso = document.createElement('section');
    seccionAcceso.className = 'seccion';
    const h2b = document.createElement('h2');
    h2b.textContent = 'Acceso — de este paciente, cambia poco';
    seccionAcceso.append(h2b);

    const reducido = document.createElement('div');
    reducido.className = 'fila';
    const chkReducido = document.createElement('input');
    chkReducido.type = 'checkbox';
    chkReducido.id = 'perilla-reducido';
    chkReducido.checked = borradorAcceso.estimuloReducido || prefersReducedMotion;
    // Si el sistema operativo lo pide, no se puede apagar. Un control que parece apagado y
    // no lo esta es peor que no tenerlo.
    chkReducido.disabled = prefersReducedMotion;
    chkReducido.addEventListener('change', () => {
      borradorAcceso.estimuloReducido = chkReducido.checked;
      refrescarAvisos();
    });
    const labReducido = document.createElement('label');
    labReducido.htmlFor = 'perilla-reducido';
    labReducido.textContent = 'Estímulo reducido';
    reducido.append(chkReducido, labReducido);

    const silencio = document.createElement('div');
    silencio.className = 'fila';
    const chkSilencio = document.createElement('input');
    chkSilencio.type = 'checkbox';
    chkSilencio.id = 'perilla-silencio';
    chkSilencio.checked = true;
    // Deshabilitado con nota. Ocultarlo haria que su reaparicion futura pareciera una
    // funcion nueva en lugar de una reserva cumplida.
    chkSilencio.disabled = true;
    const labSilencio = document.createElement('label');
    labSilencio.htmlFor = 'perilla-silencio';
    labSilencio.textContent = 'Silencio — no hay audio en esta versión';
    silencio.append(chkSilencio, labSilencio);

    seccionAcceso.append(grupo('Presentación', [reducido, silencio]));

    cuerpo.append(seccionEjercicio, seccionAcceso, zonaAvisos, seccionResultados(), zonaProgreso);
    refrescarAvisos();
  }

  const acciones = document.createElement('div');
  acciones.className = 'acciones';
  acciones.append(aplicar, cerrarBoton);
  dialogo.append(cuerpo, acciones);

  const abridor = document.createElement('button');
  abridor.type = 'button';
  abridor.className = 'abridor';
  // Boton visible y con tamaño de objetivo normal. NO una pulsacion larga ni un gesto: eso
  // violaria la regla de un solo punto de activacion del sistema 5, y haria el panel
  // inalcanzable para un terapeuta que use pulsador.
  abridor.textContent = 'Panel del terapeuta';
  abridor.setAttribute('aria-haspopup', 'dialog');

  function abrir() {
    borrador = { ...estado.config };
    borradorAcceso = { ...estado.acceso };
    const p = progreso();
    zonaProgreso.textContent =
      `Sesión: ${p.tableros} tableros, ${p.aciertos} de ${p.intentos} activaciones ` +
      `correctas.`;
    construir();
    dialogo.hidden = false;
    estado.abierto = true;
    if (alAbrir !== undefined) alAbrir();
    // La sesion se pausa: el tablero deja de ser alcanzable por teclado.
    document.body.dataset['panelAbierto'] = 'si';
    aplicar.focus();
  }

  function cerrar() {
    dialogo.hidden = true;
    estado.abierto = false;
    if (alCerrar !== undefined) alCerrar();
    delete document.body.dataset['panelAbierto'];
    abridor.focus();
  }

  abridor.addEventListener('click', abrir);
  cerrarBoton.addEventListener('click', cerrar);
  aplicar.addEventListener('click', () => {
    if (aplicar.disabled) return;
    estado.config = { ...borrador };
    estado.acceso = { ...borradorAcceso };
    alAplicar(estado.config, estado.acceso);
    cerrar();
  });
  dialogo.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrar();
  });

  contenedor.append(abridor, dialogo);
  return { abrir, cerrar, estaAbierto: () => estado.abierto };
}

export { T_AAA };
