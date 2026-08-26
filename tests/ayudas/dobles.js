/**
 * Dobles de prueba compartidos. Viven en `tests/`, nunca en `src/`.
 *
 * Un reloj y un programador que se avanzan a mano son lo que hace que criterios como
 * "nada expira en treinta minutos" corran en microsegundos.
 */

/**
 * Reloj monotono falso, avanzable a mano.
 *
 * @param {number} [inicio]
 * @returns {import('../../src/plataforma/esquema.js').RelojMonotono & { avanzar: (ms: number) => void }}
 */
export function relojFalso(inicio = 1000) {
  let t = inicio;
  return {
    kind: 'monotono',
    now: () => t,
    avanzar: (ms) => { t += ms; },
  };
}

/**
 * @typedef {object} ProgramadorFalso
 * @property {(callback: () => void, ms: number) => number} programar
 * @property {(id: number) => void} cancelar
 * @property {(ms: number) => void} avanzar Dispara todo lo que venza en esa ventana
 * @property {() => number} pendientes
 */

/**
 * Programador falso. `avanzar(ms)` dispara en orden todas las tareas que vencen.
 *
 * Soporta reprogramacion desde dentro de un callback, que es como el barrido automatico
 * se encadena: si no la soportara, AC-8 (500 pasos) seria inescribible.
 *
 * @returns {ProgramadorFalso}
 */
export function programadorFalso() {
  let ahora = 0;
  let siguienteId = 1;
  /** @type {Map<number, { vence: number, callback: () => void }>} */
  const tareas = new Map();

  return {
    programar(callback, ms) {
      const id = siguienteId++;
      tareas.set(id, { vence: ahora + ms, callback });
      return id;
    },
    cancelar(id) {
      tareas.delete(id);
    },
    avanzar(ms) {
      const limite = ahora + ms;
      // Bucle porque un callback puede reprogramarse dentro de la misma ventana.
      // La cota evita que un bug de reprogramacion a 0 ms cuelgue el test.
      for (let iter = 0; iter < 1e6; iter++) {
        /** @type {{ id: number, vence: number } | null} */
        let proxima = null;
        for (const [id, t] of tareas) {
          if (t.vence <= limite && (proxima === null || t.vence < proxima.vence)) {
            proxima = { id, vence: t.vence };
          }
        }
        if (proxima === null) break;
        const t = /** @type {{ vence: number, callback: () => void }} */ (tareas.get(proxima.id));
        tareas.delete(proxima.id);
        ahora = t.vence;
        t.callback();
      }
      ahora = limite;
    },
    pendientes() {
      return tareas.size;
    },
  };
}
