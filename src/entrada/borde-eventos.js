// @borde-impuro
//
// SEGUNDO archivo exento de `src/`, y su exencion es de UNA sola cosa: `event.timeStamp`.
//
// Esta es la razon por la que AC-2 del sistema 3 dejo de contar archivos y paso a una
// lista blanca por archivo. El conteo era mas debil de lo que parecia: con un solo numero,
// el borde impuro podia leer `.timeStamp` y nadie lo veia.
//
// `event.timeStamp` es un `DOMHighResTimeStamp` con el mismo origen que `performance.now()`,
// viene en todo evento de puntero, y es MAS PRECISO que llamar al reloj dentro del
// manejador, porque marca el evento de hardware en lugar de incluir la latencia de
// despacho. Por eso no se prohibe: prohibirlo degradaria justo la medida que el presupuesto
// de 100 ms necesita.
//
// Se lee UNA vez, aqui, y viaja como dato dentro del `EventoActivacion`.
//
// Sistema 5 · regla 7 y regla 10 de design/gdd/capa-adaptacion-entrada.md

import { MaquinaPuntero } from './adaptador.js';

/**
 * Extrae la marca de tiempo de un evento del DOM.
 *
 * Si `timeStamp` viene a 0 o ausente —ocurre con algunos eventos sinteticos— se usa la
 * lectura del reloj monotono inyectado, y el origen se marca `'reloj'`. **Nunca se mezclan
 * los dos en un mismo calculo de latencia**: el sistema 9 se niega a restarlos.
 *
 * @param {Event} evento
 * @param {import('../plataforma/esquema.js').RelojMonotono} reloj
 * @returns {{ t: number, origen: import('./constantes.js').OrigenTiempo }}
 */
export function marcaDeTiempo(evento, reloj) {
  const t = evento.timeStamp;
  if (typeof t === 'number' && t > 0) return { t, origen: 'evento' };
  return { t: reloj.now(), origen: 'reloj' };
}

/**
 * Conecta un contenedor del DOM a la capa de adaptacion.
 *
 * Todo lo que sale es un `EventoActivacion`. El consumidor no sabe —y no puede saber— si
 * la activacion vino de un dedo, un raton o una tecla.
 *
 * @param {object} entrada
 * @param {HTMLElement} entrada.contenedor
 * @param {number} entrada.t Tamaño de objetivo, del sistema 4
 * @param {import('../plataforma/esquema.js').RelojMonotono} entrada.reloj
 * @param {(e: import('./adaptador.js').EventoActivacion) => void} entrada.alActivar
 * @returns {() => void} Funcion para desconectar
 */
export function conectar({ contenedor, t, reloj, alActivar }) {
  const maquina = new MaquinaPuntero(t);

  /** @param {EventTarget | null} destino @returns {string | null} */
  const idDe = (destino) => {
    if (!(destino instanceof Element)) return null;
    const objeto = destino.closest('[data-id]');
    return objeto instanceof HTMLElement ? (objeto.dataset['id'] ?? null) : null;
  };

  /** @param {Event} e @returns {PointerEvent | null} */
  const comoPuntero = (e) => (e instanceof PointerEvent ? e : null);

  /** @param {Event} e */
  const abajo = (e) => {
    const p = comoPuntero(e);
    const id = idDe(e.target);
    if (p === null || id === null) return;
    maquina.abajo(id, p.clientX, p.clientY);
  };

  /** @param {Event} e */
  const mover = (e) => {
    const p = comoPuntero(e);
    if (p !== null) maquina.mover(p.clientX, p.clientY);
  };

  /** @param {Event} e */
  const arriba = (e) => {
    const p = comoPuntero(e);
    if (p === null) return;
    const { t: marca, origen } = marcaDeTiempo(e, reloj);
    // El modo se deduce del tipo de puntero, y viaja SOLO para el registro.
    const modo = p.pointerType === 'touch' ? 'tactil' : 'raton';
    const activacion = maquina.arriba(idDe(e.target), marca, modo, origen);
    if (activacion !== null) alActivar(activacion);
  };

  const cancelar = () => { maquina.cancelar(); };

  /** @param {Event} e */
  const tecla = (e) => {
    if (!(e instanceof KeyboardEvent)) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const id = idDe(e.target);
    if (id === null) return;
    e.preventDefault();
    const { t: marca, origen } = marcaDeTiempo(e, reloj);
    alActivar({ idObjetivo: id, tActivacion: marca, modo: 'teclado', origenTiempo: origen });
  };

  contenedor.addEventListener('pointerdown', abajo);
  contenedor.addEventListener('pointermove', mover);
  contenedor.addEventListener('pointerup', arriba);
  contenedor.addEventListener('pointercancel', cancelar);
  contenedor.addEventListener('keydown', tecla);

  return () => {
    contenedor.removeEventListener('pointerdown', abajo);
    contenedor.removeEventListener('pointermove', mover);
    contenedor.removeEventListener('pointerup', arriba);
    contenedor.removeEventListener('pointercancel', cancelar);
    contenedor.removeEventListener('keydown', tecla);
  };
}
