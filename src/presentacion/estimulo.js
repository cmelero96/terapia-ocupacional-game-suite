/**
 * Modo de estimulo reducido, y silencio. Sistemas 6 y 7.
 *
 * Modulo PURO: la preferencia del sistema operativo llega como parametro, no se consulta
 * aqui. Consultar `matchMedia` es del enlace con el DOM.
 *
 * design/gdd/estimulo-reducido-y-silencio.md
 */

/**
 * @typedef {object} ConfiguracionEstimulo
 * @property {boolean} estimuloReducido Perilla clinica, de paciente
 * @property {boolean} silencio Perilla clinica. Por defecto TRUE
 */

/** Con sensibilidad sensorial confirmada en la poblacion, el silencio es el estado del
 * que se sale a proposito, no una opcion que se activa. */
export const CONFIGURACION_POR_DEFECTO = Object.freeze({
  estimuloReducido: false,
  silencio: true,
});

/**
 * F1 — el modo efectivo.
 *
 * **Es un OR, y la asimetria es el punto.** Una entrada del entorno PUEDE endurecer una
 * garantia de accesibilidad; nunca puede relajarla. Con un `AND`, o con una asignacion
 * desde el sistema operativo, una preferencia del entorno podria apagar el modo que el
 * terapeuta encendio para este paciente.
 *
 * No existe la combinacion que lo apaga.
 *
 * @param {boolean} perillaTerapeuta
 * @param {boolean} prefersReducedMotion
 * @returns {boolean}
 */
export function estimuloReducidoEfectivo(perillaTerapeuta, prefersReducedMotion) {
  return perillaTerapeuta || prefersReducedMotion;
}

/**
 * ¿Puede el terapeuta apagar el modo desde el panel?
 *
 * Si el sistema operativo lo pide, no. Y el panel tiene que decirlo: un control que
 * parece apagado y no lo esta es peor que no tenerlo.
 *
 * @param {boolean} prefersReducedMotion
 * @returns {boolean}
 */
export function perillaEsApagable(prefersReducedMotion) {
  return !prefersReducedMotion;
}

/**
 * @typedef {object} PoliticaPresentacion
 * @property {boolean} sinMovimiento Ninguna transicion, ningun desvanecimiento
 * @property {boolean} acuseEstatico El acuse existe pero no se anima
 * @property {boolean} progresoEscalonado La permanencia avanza en pasos discretos
 * @property {boolean} sinDecoracion Fuera los elementos decorativos del marco
 * @property {boolean} silencio
 */

/**
 * La politica de presentacion que sale de la configuracion.
 *
 * **El acuse de recibo NUNCA desaparece.** Es la unica regla dura del sistema 6: el
 * presupuesto de menos de 100 ms existe porque un acuse tardio se percibe como "no me ha
 * hecho caso", asi que quitarlo entero es peor que hacerlo lento. En modo reducido pierde
 * el movimiento y conserva la existencia.
 *
 * @param {ConfiguracionEstimulo} config
 * @param {boolean} prefersReducedMotion
 * @returns {PoliticaPresentacion}
 */
export function politicaPresentacion(config, prefersReducedMotion) {
  const reducido = estimuloReducidoEfectivo(config.estimuloReducido, prefersReducedMotion);
  return {
    sinMovimiento: reducido,
    acuseEstatico: reducido,
    progresoEscalonado: reducido,
    sinDecoracion: reducido,
    // `estimuloReducido` implica silencio, no al reves: reducir el estimulo apaga
    // cualquier audio que existiera; silenciar no quita el movimiento.
    silencio: config.silencio || reducido,
  };
}

/**
 * Las cuatro condiciones que un instrumento futuro debe cumplir A LA VEZ para emitir
 * sonido.
 *
 * En el primer hito ninguna instancia la cumple, porque **no hay audio**. La funcion
 * existe para que la respuesta este escrita antes de que alguien pregunte, y para que el
 * dia que se relaje la barrera de CI quede constancia de contra que se comprobo.
 *
 * @param {object} propuesta
 * @param {boolean} propuesta.informativo No es recompensa ni celebracion
 * @param {boolean} propuesta.apagadoPorDefecto
 * @param {boolean} propuesta.noIndicaResultado El pilar 2 no se negocia
 * @param {boolean} propuesta.tieneAlternativaVisual
 * @returns {boolean}
 */
export function hayAudioPermitido(propuesta) {
  return (
    propuesta.informativo &&
    propuesta.apagadoPorDefecto &&
    propuesta.noIndicaResultado &&
    propuesta.tieneAlternativaVisual
  );
}
