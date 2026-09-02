/**
 * Presentacion de resultados de sesion. Sistema 12.
 *
 * Modulo PURO: convierte datos del sistema 9 en texto. No toca el DOM.
 *
 * **Nunca devuelve un 0 por ausencia de datos.** Cuando una metrica no tiene valor,
 * devuelve el MOTIVO — y los cuatro motivos son distinguibles porque piden acciones
 * distintas del terapeuta.
 *
 * design/gdd/resultados-sesion.md
 */

/**
 * @typedef {object} Presentado
 * @property {string} etiqueta
 * @property {string} valor Texto ya formateado. Nunca '0' por ausencia de dato
 * @property {boolean} tieneDato
 * @property {string} [limitacion] Va ADYACENTE al valor, nunca en un pie
 */

/**
 * F2 — la frase de limitacion de las escalas ordinales.
 *
 * Es larga a proposito. Una etiqueta corta —"escala relativa"— no transmite QUE
 * comparacion es invalida, y la invalida es la que un profesional hara sin pensarlo:
 * mirar dos pacientes.
 *
 * El encargo viene del sistema 4, que lo escribio y dejo dicho que "tiene que llegar hasta
 * la pantalla, no quedarse en el GDD". Este es el sistema donde eso se cumple o se rompe.
 */
export const LIMITACION_ESCALA =
  'Escala ordinal, sin calibrar. Comparable con este mismo paciente a lo largo del tiempo; ' +
  'NO comparable entre pacientes, y un 60 no es el doble de dificil que un 30.';

/**
 * Los cuatro motivos, con el texto que el terapeuta lee y la accion que implica.
 *
 * @type {Record<string, string>}
 */
export const TEXTO_MOTIVO = {
  datosInsuficientes:
    'Sin dato: faltan intentos. Hacen falta al menos 5 en un mismo nivel de dificultad.',
  ejesAcoplados:
    'Sin dato: con objetivos por debajo de 44 px, el error de gesto y el de busqueda no se ' +
    'pueden separar. Sube el tamaño si quieres medir el eje perceptivo.',
  ejesMezclados:
    'Sin dato: se movieron los dos ejes en la misma sesion. Mueve un eje por sesion.',
  viasMezcladas:
    'Sin dato de sesion: se usaron vias de acceso distintas, y una latencia con pulsador ' +
    'incluye la espera del barrido mientras que una tactil no. Mira el desglose por via.',
  instrumentosMezclados:
    'Sin dato de sesion: hay varios ejercicios distintos y su precision no se puede ' +
    'promediar. Mira el desglose por ejercicio.',
  origenesMezclados:
    'Sin dato: fallo de medicion de tiempo. Es un defecto de software, no de la sesion.',
  relojRetrocedio:
    'Sin dato: el reloj retrocedio durante la medicion. Es un defecto del entorno.',
};

/**
 * @param {string} motivo
 * @returns {string}
 */
export function textoDeMotivo(motivo) {
  return TEXTO_MOTIVO[motivo] ?? `Sin dato: motivo desconocido (${motivo}).`;
}

/**
 * Precision. Con cero intentos NO es 0: es "sin dato" con su motivo.
 *
 * Y el numero de intentos va SIEMPRE junto a la proporcion: un 80 % de 5 intentos y un
 * 80 % de 200 no son el mismo dato.
 *
 * @param {import('../registro/sesion.js').Resumen} resumen
 * @returns {Presentado}
 */
export function presentarPrecision(resumen) {
  if (resumen.precision === undefined) {
    // Los dos motivos son distinguibles a proposito, porque piden acciones distintas: uno se
    // arregla jugando, y el otro mirando el desglose que YA existe.
    if (resumen.motivoPrecision === 'instrumentosMezclados') {
      return {
        etiqueta: 'Aciertos',
        valor:
          `Sin dato de sesion: hay ${resumen.instrumentos.length} ejercicios distintos, y su `
          + 'precision no se puede promediar. Mira el desglose de abajo.',
        tieneDato: false,
      };
    }
    return {
      etiqueta: 'Aciertos',
      valor: 'Sin dato: no hubo ninguna activacion en la sesion.',
      tieneDato: false,
    };
  }
  // La limitación viaja JUNTO al número, en el mismo texto. Es la misma regla que la de la
  // latencia y la de la limitación de escala: dos textos separados se leen por separado, y
  // el que matiza se pierde.
  //
  // Y el sesgo tiene DIRECCIÓN, así que se dice. El último intento de un tablero completo
  // es, por construcción, el acierto que lo cerró; truncar quita ese acierto y deja los
  // fallos. La precisión de una sesión con tableros incompletos sale más BAJA que la real.
  const nota = resumen.tablerosIncompletos > 0
    ? ` · incluye ${resumen.intentosIncompletos} de ${resumen.tablerosIncompletos} `
      + `tablero${resumen.tablerosIncompletos === 1 ? '' : 's'} sin terminar, así que este `
      + 'porcentaje es más bajo que el real'
    : '';

  return {
    etiqueta: 'Aciertos',
    valor:
      `${Math.round(resumen.precision * 100)} % — ${resumen.aciertos} de ` +
      `${resumen.intentos} activaciones${nota}`,
    tieneDato: true,
  };
}

/**
 * Qué incluye una latencia en cada clase de vía. Lo lee el terapeuta.
 *
 * @type {Record<string, string>}
 */
export const ETIQUETA_CLASE_LATENCIA = {
  reaccion: 'Reaccion (tactil, raton o teclado)',
  barrido: 'Con pulsador — incluye la espera del barrido',
  permanencia: 'Con permanencia — incluye el umbral',
  desconocida: 'Via sin registrar',
};

/**
 * El desglose de latencia por clase de via.
 *
 * **Nunca un total**, por el mismo motivo que en los instrumentos: el total es el numero que
 * no significa nada. Y cada fila dice QUE incluye, porque «424 ms» no se puede interpretar
 * sin saber que 500 de esos milisegundos eran la cadencia del barrido.
 *
 * @param {import('../registro/sesion.js').Resumen} resumen
 * @returns {Presentado[]}
 */
export function presentarLatenciaPorClase(resumen) {
  /** @type {Presentado[]} */
  const filas = [];
  for (const [clase, v] of resumen.latenciaPorClase) {
    const etiqueta = ETIQUETA_CLASE_LATENCIA[clase] ?? clase;
    if (v.media === undefined) {
      filas.push({ etiqueta, valor: 'Sin dato: ninguna latencia se pudo medir.', tieneDato: false });
      continue;
    }
    filas.push({
      etiqueta,
      valor: `${Math.round(v.media)} ms de media, sobre ${v.medidas} medida${v.medidas === 1 ? '' : 's'}.`,
      tieneDato: true,
    });
  }
  return filas;
}

/**
 * El desglose por instrumento. Es lo que sustituye a la precision de sesion cuando hay mas
 * de un ejercicio.
 *
 * **Una fila por instrumento, con su recuento.** Nunca un total: el total es justamente el
 * numero que no significa nada. Medido: 2 de 2 en Busca y 0 de 3 en Precio justo daban un
 * 40 % que no le paso al paciente en ninguno de los dos.
 *
 * @param {import('../registro/sesion.js').Resumen} resumen
 * @param {Record<string, string>} [etiquetas] Nombre legible por instrumento
 * @returns {Presentado[]}
 */
export function presentarPorInstrumento(resumen, etiquetas = {}) {
  /** @type {Presentado[]} */
  const filas = [];
  for (const nombre of resumen.instrumentos) {
    const v = resumen.porInstrumento.get(nombre);
    if (v === undefined) continue;
    filas.push({
      etiqueta: etiquetas[nombre] ?? nombre,
      valor: `${Math.round(v.precision * 100)} % — ${v.aciertos} de ${v.intentos} activaciones`,
      tieneDato: true,
    });
  }
  return filas;
}

/**
 * Latencia media, **siempre acompañada de sobre cuantas medidas se calculo**.
 *
 * Sin ese segundo numero, una media sobre 3 de 40 latencias tiene el mismo aspecto que una
 * sobre 40. Es el encargo del sistema 9, y los dos numeros van en el MISMO texto para que
 * no se puedan leer por separado.
 *
 * @param {import('../registro/sesion.js').Resumen} resumen
 * @param {{ resolucionMs: number, fiableParaPresupuesto: boolean }} [reloj]
 * @returns {Presentado}
 */
export function presentarLatencia(resumen, reloj) {
  const medidas = resumen.intentos - resumen.latenciasSinDato;
  if (resumen.latenciaMedia === undefined) {
    // Los dos motivos piden acciones distintas: uno se arregla midiendo, y el otro mirando
    // el desglose por via que YA existe.
    if (resumen.motivoLatencia === 'viasMezcladas') {
      return {
        etiqueta: 'Latencia',
        valor:
          `Sin dato de sesion: se usaron ${resumen.latenciaPorClase.size} vias de acceso `
          + 'distintas. Una latencia con pulsador incluye la espera del barrido y una tactil '
          + 'no. Mira el desglose de abajo.',
        tieneDato: false,
      };
    }
    return {
      etiqueta: 'Latencia',
      valor:
        `Sin dato: ninguna latencia se pudo medir (${resumen.latenciasSinDato} de ` +
        `${resumen.intentos} sin medida).`,
      tieneDato: false,
    };
  }
  const aviso =
    reloj !== undefined && !reloj.fiableParaPresupuesto
      ? ` Aviso: la resolucion del reloj era de ${reloj.resolucionMs} ms, asi que las ` +
        `latencias bajas no son interpretables.`
      : '';
  return {
    etiqueta: 'Latencia',
    valor:
      `${Math.round(resumen.latenciaMedia)} ms de media, sobre ${medidas} de ` +
      `${resumen.intentos} medidas.${aviso}`,
    tieneDato: true,
  };
}

/**
 * Dificultad tolerada. **La limitacion va adyacente al numero**, no en un pie.
 *
 * @param {import('../dificultad/modelo.js').Metrica} metrica
 * @param {'motor' | 'perceptivo'} eje
 * @returns {Presentado}
 */
export function presentarDificultadTolerada(metrica, eje) {
  const etiqueta = `Dificultad tolerada — eje ${eje}`;
  if (metrica.valor === undefined) {
    // Sin dato NO es 0. Un 0 se leeria como "no tolera ninguna dificultad": un dato
    // clinico plausible y devastador cuando lo que ocurre es que faltan datos.
    return { etiqueta, valor: textoDeMotivo(metrica.motivo), tieneDato: false };
  }
  return {
    etiqueta,
    valor: `${metrica.valor.toFixed(1)}`,
    tieneDato: true,
    limitacion: LIMITACION_ESCALA,
  };
}

/**
 * La dificultad de un tablero. Si la pedida y la efectiva difieren, se muestran las dos:
 * significa que el banco no daba para la configuracion puesta, y el terapeuta necesita
 * saberlo ANTES de interpretar el resultado.
 *
 * @param {{ dp: number, dpPedida: number, dm: number }} d
 * @returns {Presentado}
 */
export function presentarDificultadTablero(d) {
  const difiere = Math.abs(d.dp - d.dpPedida) > 0.05;
  return {
    etiqueta: 'Dificultad del tablero',
    valor: difiere
      ? `Motor ${d.dm.toFixed(1)} · perceptivo ${d.dp.toFixed(1)} (se pidio ` +
        `${d.dpPedida.toFixed(1)}: el banco no dio para la similitud configurada)`
      : `Motor ${d.dm.toFixed(1)} · perceptivo ${d.dp.toFixed(1)}`,
    tieneDato: true,
    limitacion: LIMITACION_ESCALA,
  };
}

/**
 * @param {import('../registro/sesion.js').EstadoReproduccion} estado
 * @param {string} [version]
 * @returns {string}
 */
export function presentarReproduccion(estado, version) {
  if (estado === 'reproducible') return 'Reproducible con su semilla.';
  if (estado === 'reproducibleAproximado') {
    return `Reproducible solo de forma aproximada: el banco cambio de version${
      version === undefined ? '' : ` (era ${version})`
    }.`;
  }
  return 'No reproducible: no se guardo la semilla.';
}
