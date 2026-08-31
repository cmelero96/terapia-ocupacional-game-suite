/**
 * Enlace con el DOM para los TRES instrumentos. Sistemas 10, 21 y 24.
 *
 * Sustituye a `busca-dom.js`, que solo servia a uno. Un elemento por objeto, con
 * `role="button"`, nombre accesible y foco real — ADR-0005.
 *
 * Las tres diferencias entre instrumentos son de PRESENTACION, no de logica:
 *
 *   | Instrumento  | Zona de referencia        | Contenedores |
 *   |--------------|---------------------------|--------------|
 *   | busca        | glifo + nombre            | no           |
 *   | denominar    | **solo el nombre**        | no           |
 *   | clasificar   | glifo + nombre del objeto | **si**       |
 */

import { conectar } from '../entrada/borde-eventos.js';
import { disposicion } from './busca.js';
import { latencia } from '../registro/sesion.js';

/** El acuse existe antes de que el tablero cambie. Ver el GDD del sistema 10. */
const MS_ACUSE = 120;

/**
 * @param {object} entrada
 * @param {HTMLElement} entrada.raiz
 * @param {HTMLElement} entrada.zonaObjetivo
 * @param {HTMLElement} entrada.zonaContenedores
 * @param {'busca' | 'denominar' | 'clasificar'} entrada.tipo
 * @param {any} entrada.instrumento
 * @param {import('../plataforma/esquema.js').RelojMonotono} entrada.reloj
 * @param {import('../presentacion/estimulo.js').PoliticaPresentacion} entrada.politica
 * @param {import('../entrada/adaptador.js').Programador} entrada.programador
 * @param {() => void} [entrada.alAvanzar] Cierra el tablero en el registro ANTES de repintar
 * @returns {{ pintar: () => void, desconectar: () => void, pausar: () => void, reanudar: () => void, estaPausado: () => boolean }}
 */
export function montarInstrumento({
  raiz, zonaObjetivo, zonaContenedores, tipo, instrumento, reloj, politica, programador,
  alAvanzar,
}) {
  let pausado = false;
  /** @type {number | null} */
  let tInicio = null;

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

  function pintar() {
    const objetivo = instrumento.objetivo();

    // --- Zona de referencia. FUERA del tablero y no activable: si el paciente pudiera
    // activarla, la tarea cambia.
    zonaObjetivo.replaceChildren();
    // Denominacion NO muestra el glifo. Si lo mostrara, la tarea volveria a ser Busca.
    if (tipo !== 'denominar') {
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
    const { columnas, sep } = disposicion(celdas.length, instrumento.t);
    raiz.style.setProperty('--t', `${instrumento.t}px`);
    raiz.style.setProperty('--cols', String(columnas));
    raiz.style.setProperty('--sep', `${sep}px`);

    raiz.replaceChildren();
    for (const c of celdas) {
      const b = boton(c, 'celda');
      // La seleccion NO es el foco: el foco lo usa el barrido para recorrer, y la
      // seleccion sobrevive a su movimiento. Se distinguen por FORMA ademas de color.
      if (tipo === 'clasificar' && instrumento.seleccionado === c.id) {
        b.dataset['seleccionado'] = 'si';
        b.setAttribute('aria-pressed', 'true');
      } else if (tipo === 'clasificar') {
        b.setAttribute('aria-pressed', 'false');
      }
      raiz.append(b);
    }

    // --- Contenedores, solo en clasificar.
    zonaContenedores.replaceChildren();
    zonaContenedores.hidden = tipo !== 'clasificar';
    if (tipo === 'clasificar') {
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
  }

  const desconectar = conectar({
    contenedor: document.body,
    t: instrumento.t,
    reloj,
    alActivar: (evento) => {
      if (pausado) return;

      const lat = tInicio === null
        ? /** @type {import('../registro/sesion.js').Latencia} */ (
            { ms: undefined, motivo: 'relojRetrocedio' })
        : latencia(tInicio, evento.tActivacion, 'reloj', evento.origenTiempo);

      const elemento = document.querySelector(`[data-id="${CSS.escape(evento.idObjetivo)}"]`);
      const clase = elemento instanceof HTMLElement
        ? (elemento.dataset['clase'] ?? 'objeto')
        : 'objeto';

      // ACUSE DE RECIBO. Identico para acierto y para fallo: el elemento no sabe cual fue.
      if (elemento instanceof HTMLElement) {
        elemento.dataset['acuse'] = 'si';
        elemento.addEventListener(
          'transitionend',
          () => { delete elemento.dataset['acuse']; },
          { once: true },
        );
      }

      const r = tipo === 'clasificar'
        ? instrumento.activar(evento, lat, /** @type {'objeto'|'contenedor'} */ (clase))
        : instrumento.activar(evento, lat);

      // En clasificar, la primera activacion solo SELECCIONA: hay que repintar para que el
      // indicador aparezca, pero NADA se ha registrado.
      if (tipo === 'clasificar' && r.registrado === false) {
        programador.programar(() => { pintar(); }, MS_ACUSE);
        return;
      }
      if (r.avanza) {
        // El tablero se cierra en el registro ANTES de que el instrumento pinte el
        // siguiente: si no, sus intentos se atribuirian a la dificultad del tablero nuevo.
        if (alAvanzar !== undefined) alAvanzar();
        programador.programar(() => { pintar(); }, MS_ACUSE);
      }
    },
  });

  pintar();
  return {
    pintar,
    desconectar,
    pausar: () => { pausado = true; if (tipo === 'clasificar') instrumento.limpiarSeleccion(); },
    reanudar: () => { pausado = false; pintar(); },
    estaPausado: () => pausado,
  };
}
