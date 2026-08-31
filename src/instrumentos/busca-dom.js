/**
 * Enlace del instrumento Busca con el DOM. Sistema 10.
 *
 * Un elemento por objeto, con `role="button"`, nombre accesible y foco real — lo fija
 * ADR-0005. El barrido por pulsador movera el FOCO, no un cursor propio, porque el foco ya
 * existe, ya es visible y ya lo anuncia el lector de pantalla.
 *
 * design/gdd/instrumento-busca.md
 */

import { conectar } from '../entrada/borde-eventos.js';
import { disposicion } from './busca.js';
import { latencia } from '../registro/sesion.js';

/**
 * El acuse de recibo tiene que EXISTIR antes de que el tablero cambie.
 *
 * Sin este aplazamiento, un acierto repinta al instante y borra el acuse antes de que el
 * paciente lo vea: el tablero cambia solo, y la persona no registra que fue ELLA quien lo
 * cambio. Lo destapo una prueba de navegador.
 *
 * No es presion de tiempo y no viola el anti-pilar 2, por la prueba de la regla 8 del
 * sistema 5: que expire no puede producir un fallo. Solo puede producir "ya avanzo".
 */
const MS_ACUSE = 120;

/**
 * @param {object} entrada
 * @param {HTMLElement} entrada.raiz Contenedor con la clase `board-root`
 * @param {HTMLElement} entrada.zonaObjetivo
 * @param {import('./busca.js').Busca} entrada.instrumento
 * @param {import('../plataforma/esquema.js').RelojMonotono} entrada.reloj
 * @param {import('../presentacion/estimulo.js').PoliticaPresentacion} entrada.politica
 * @param {import('../entrada/adaptador.js').Programador} entrada.programador
 * @param {(intento: { correcto: boolean, latencia: import('../registro/sesion.js').Latencia }) => void} [entrada.alRegistrar]
 * @returns {{ pintar: () => void, desconectar: () => void, pausar: () => void, reanudar: () => void, estaPausado: () => boolean }}
 */
export function montarBusca({ raiz, zonaObjetivo, instrumento, reloj, politica, programador, alRegistrar }) {
  const { columnas, sep } = disposicion(
    1 + instrumento.tablero.distractores.length,
    instrumento.t,
  );

  raiz.style.setProperty('--t', `${instrumento.t}px`);
  raiz.style.setProperty('--sep', `${sep}px`);
  raiz.style.setProperty('--cols', String(columnas));
  raiz.dataset['sinMovimiento'] = politica.sinMovimiento ? 'si' : 'no';

  /**
   * La pausa es LOGICA, no solo presentacional.
   *
   * Ocultar el tablero con CSS no basta: los escuchadores siguen conectados, y un evento
   * programatico —o un lector de pantalla, o un dispositivo de asistencia que no respete
   * `pointer-events`— llegaria a registrarse. Lo destapo una prueba de navegador que
   * despachaba el evento a mano.
   *
   * @type {boolean}
   */
  let pausado = false;

  /** @type {number | null} */
  let tInicioBusqueda = null;
  /** @type {import('../entrada/constantes.js').OrigenTiempo} */
  let origenInicio = 'reloj';

  function pintar() {
    const objetivo = instrumento.objetivo();

    // Zona de referencia: FUERA del tablero y no activable. Si el paciente pudiera
    // activarla, la tarea cambia.
    zonaObjetivo.replaceChildren();
    const muestra = document.createElement('span');
    muestra.className = 'objetivo-glifo';
    muestra.textContent = objetivo.glifo;
    muestra.setAttribute('aria-hidden', 'true');
    const etiqueta = document.createElement('span');
    etiqueta.className = 'objetivo-nombre';
    etiqueta.textContent = objetivo.nombre;
    zonaObjetivo.append(muestra, etiqueta);

    const celdas = instrumento.celdas();
    const { columnas: cols, sep: s } = disposicion(celdas.length, instrumento.t);
    raiz.style.setProperty('--cols', String(cols));
    raiz.style.setProperty('--sep', `${s}px`);

    raiz.replaceChildren();
    for (const celda of celdas) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'celda';
      boton.dataset['id'] = celda.id;
      // El nombre accesible sale del campo `name` del manifiesto, nunca de la ruta.
      boton.setAttribute('aria-label', celda.nombre);
      const glifo = document.createElement('span');
      glifo.setAttribute('aria-hidden', 'true');
      glifo.textContent = celda.glifo;
      boton.append(glifo);
      raiz.append(boton);
    }

    // El cronometro de la ronda arranca cuando el tablero esta en pantalla.
    tInicioBusqueda = reloj.now();
    origenInicio = 'reloj';
  }

  const desconectar = conectar({
    contenedor: raiz,
    t: instrumento.t,
    reloj,
    alActivar: (evento) => {
      // Con la sesion pausada NADA se registra. Un intento hecho mientras el terapeuta
      // cambia la configuracion entraria al registro bajo una configuracion que ya no es
      // la que se estaba usando.
      if (pausado) return;

      // Latencia: entre el inicio de la ronda y la activacion. Si los origenes no
      // coinciden, el sistema 9 devuelve `undefined` en lugar de restar dos cosas que no
      // son comparables.
      const lat =
        tInicioBusqueda === null
          ? /** @type {import('../registro/sesion.js').Latencia} */ ({
              ms: undefined, motivo: 'relojRetrocedio',
            })
          : latencia(tInicioBusqueda, evento.tActivacion, origenInicio, evento.origenTiempo);

      // ACUSE DE RECIBO. Identico para acierto y para fallo: el elemento no sabe cual fue,
      // porque no se le pasa esa informacion.
      const boton = raiz.querySelector(`[data-id="${CSS.escape(evento.idObjetivo)}"]`);
      if (boton instanceof HTMLElement) {
        boton.dataset['acuse'] = 'si';
        // Se retira en el siguiente fotograma de reposo, sin temporizador: el acuse no
        // necesita durar, necesita ocurrir.
        boton.addEventListener('transitionend', () => { delete boton.dataset['acuse']; }, { once: true });
      }

      const { avanza } = instrumento.activar(evento, lat);
      if (alRegistrar !== undefined) alRegistrar({ correcto: avanza, latencia: lat });
      // El acuse existe primero; el tablero cambia despues. Y el aplazamiento pasa por el
      // programador inyectado, no por `setTimeout`: la regla 1 del sistema 3 lo exige.
      if (avanza) programador.programar(() => { pintar(); }, MS_ACUSE);
    },
  });

  pintar();
  return {
    pintar,
    desconectar,
    pausar: () => { pausado = true; },
    // Al reanudar se pinta un tablero NUEVO, no el que estaba a medias: un tablero cuya
    // configuracion cambio a mitad no es un dato interpretable.
    reanudar: () => { pausado = false; pintar(); },
    estaPausado: () => pausado,
  };
}
