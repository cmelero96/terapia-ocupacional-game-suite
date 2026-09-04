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
  presentarPorInstrumento, presentarLatenciaPorClase,
  presentarPrecision, presentarLatencia, presentarDificultadTolerada,
} from '../resultados/presentar.js';
import { resumenSesion } from '../registro/sesion.js';
import { dificultadTolerada } from '../dificultad/modelo.js';
import { T_AAA } from '../dificultad/constantes.js';
import {
  ESCALONES_T, ESCALONES_C, ESCALONES_PROPORCION, escalonMasCercano,
} from '../dificultad/escalones.js';
import { variantesDe, observacionesPorVariante } from '../dificultad/contenido.js';
import { informeDeJornada, AVISO_SIN_GUARDAR } from '../resultados/informe.js';

/**
 * Nombre legible de cada instrumento, para el desglose por ejercicio.
 *
 * Vive aquí y no en el índice de la página porque es del panel: lo lee el TERAPEUTA. El
 * paciente no ve el nombre del ejercicio en ningún sitio.
 *
 * @type {Record<string, string>}
 */
const ETIQUETA_INSTRUMENTO = {
  busca: 'Busca / Lince',
  clasificar: 'Clasificar',
  denominar: 'Denominación',
  rellenar: 'Rellenar palabras',
  ordenar: 'Ordenar palabras',
  simbolos: 'Símbolos',
  precios: 'Precio justo',
  comprar: 'Comprar',
  tresEnRaya: 'Tres en raya',
};

/**
 * @typedef {object} EstadoPanel
 * @property {boolean} abierto
 * @property {{ t: number, C: number, sv: number, ss: number }} config
 * @property {{ barrido: boolean, msVuelta: number, estimuloReducido: boolean, limitaciones: string[] }} acceso
 * @property {string} [instrumento] Para saber si hay eje de contenido. Sistema 32
 * @property {string} [varianteContenido] Identificador de la variante activa. Sistema 32
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
 * Ajusta una configuración a los escalones.
 *
 * Una configuración puede llegar por URL con `t = 63`, que no es un escalón. Sin ajustarla,
 * el grupo de botones se dibuja **sin ninguno elegido** y el terapeuta no ve a qué está
 * jugando. Se ajusta al escalón más cercano, y en caso de empate al más bajo.
 *
 * @param {EstadoPanel['config']} config
 * @returns {EstadoPanel['config']}
 */
function aEscalones(config) {
  return {
    t: escalonMasCercano(config.t, ESCALONES_T),
    C: escalonMasCercano(config.C, ESCALONES_C),
    sv: escalonMasCercano(config.sv, ESCALONES_PROPORCION),
    ss: escalonMasCercano(config.ss, ESCALONES_PROPORCION),
  };
}

/**
 * Control de ESCALONES: un grupo de botones, uno por valor permitido.
 *
 * Sustituye al deslizador en las cuatro perillas de dificultad — ADR-0006. Dos motivos, y
 * el segundo no estaba en el concepto:
 *
 * 1. **Comparabilidad.** Con un deslizador, 63 px y 64 px son sesiones distintas que
 *    parecen la misma. Con escalones, dos sesiones en el mismo escalón son comparables.
 * 2. **Un deslizador se ARRASTRA.** El proyecto prohíbe el arrastre como vía única y WCAG
 *    2.5.7 exige alternativa. Un botón se activa con un solo punto, así que también
 *    funciona con barrido y con permanencia. El deslizador era la única parte del producto
 *    que fallaba su propia regla de entrada.
 *
 * Se implementa con `role="radiogroup"`: para un lector de pantalla es un grupo de opciones
 * excluyentes, que es exactamente lo que es. Un grupo de `<button>` no comunicaría cuál
 * está elegido.
 *
 * @param {object} spec
 * @param {string} spec.id
 * @param {string} spec.etiqueta
 * @param {number} spec.valor
 * @param {readonly number[]} spec.escalones
 * @param {string} spec.unidad
 * @param {(v: number) => string} [spec.formato]
 * @param {(v: number) => void} spec.alCambiar
 * @returns {HTMLElement}
 */
function escalones({ id, etiqueta, valor, escalones: pasos, unidad, formato, alCambiar }) {
  const fila = document.createElement('div');
  fila.className = 'fila fila-escalones';

  const lab = document.createElement('span');
  lab.className = 'etiqueta-escalones';
  lab.id = `${id}-etiqueta`;
  lab.textContent = etiqueta;

  const grupo = document.createElement('div');
  grupo.className = 'escalones';
  grupo.id = id;
  grupo.setAttribute('role', 'radiogroup');
  grupo.setAttribute('aria-labelledby', lab.id);

  const texto = formato ?? ((v) => String(v));

  /** @type {HTMLButtonElement[]} */
  const botones = [];
  let elegido = valor;

  /** @param {number} v */
  const marcar = (v) => {
    elegido = v;
    for (const b of botones) {
      const suyo = Number(b.dataset['valor']);
      const activo = Math.abs(suyo - v) < 1e-9;
      b.setAttribute('aria-checked', activo ? 'true' : 'false');
      // `tabindex` gestionado: el grupo entero es UNA parada de tabulación, y dentro se
      // navega con las flechas. Es el patrón del ARIA APG para radiogroup.
      b.tabIndex = activo ? 0 : -1;
    }
  };

  /** @param {number} delta */
  const mover = (delta) => {
    const i = pasos.findIndex((e) => Math.abs(e - elegido) < 1e-9);
    const j = Math.min(Math.max((i === -1 ? 0 : i) + delta, 0), pasos.length - 1);
    const v = pasos[j];
    if (v === undefined) return;
    marcar(v);
    botones[j]?.focus();
    alCambiar(v);
  };

  pasos.forEach((e) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'escalon';
    b.setAttribute('role', 'radio');
    b.dataset['valor'] = String(e);
    b.textContent = `${texto(e)}${unidad}`;
    b.addEventListener('click', () => { marcar(e); alCambiar(e); });
    b.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); mover(1); }
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); mover(-1); }
    });
    botones.push(b);
    grupo.append(b);
  });

  marcar(valor);
  fila.append(lab, grupo);
  return fila;
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
 * @param {() => import('../registro/sesion.js').Sesion[]} [entrada.jornada]
 *   TODAS las sesiones de la jornada, en orden de inserción, incluida la que está en curso.
 *   Su ausencia oculta la sección de jornada entera
 * @param {(selloPared: number) => string} [entrada.formatoHora]
 *   Formatea la hora de una sesión para el informe. Va inyectada porque la hora local es una
 *   lectura del entorno. Su ausencia omite la hora, no la inventa
 * @param {() => void} [entrada.alTerminarSesion]
 *   Termina la sesión en curso y abre otra en el MISMO registro: el paciente siguiente.
 *   Sin esto, la única forma de pasar al siguiente era recargar, y recargar destruye el
 *   registro de la jornada entera
 * @param {() => { svPedida: number, svEfectiva: number } | null} entrada.ultimoTablero
 * @param {(C: number) => { pedidas: number, servidas: number }} [entrada.opciones]
 *   Solo los instrumentos de elección lo pasan. Su ausencia significa "este instrumento no
 *   tiene opciones", que no es lo mismo que "sirve todas las pedidas"
 * @param {(config: EstadoPanel['config'], acceso: EstadoPanel['acceso'], varianteContenido?: string) => void} entrada.alAplicar
 * @param {() => void} [entrada.alAbrir] Pausa la sesion. LOGICA, no solo presentacional
 * @param {() => void} [entrada.alCerrar] Reanuda con un tablero nuevo
 * @returns {{ abrir: () => void, cerrar: () => void, estaAbierto: () => boolean }}
 */
export function montarPanel({
  contenedor, estado, bancoActivo, anchoDisponible, prefersReducedMotion,
  progreso, ultimoTablero, opciones, alAplicar, alAbrir, alCerrar, sesion,
  jornada, alTerminarSesion, formatoHora,
}) {
  // Borrador: se edita aqui y solo pasa a `estado` al aplicar. Cerrar sin aplicar no
  // cambia nada.
  let borrador = aEscalones(estado.config);
  let borradorAcceso = { ...estado.acceso };
  /** @type {string | undefined} */
  let borradorVariante = estado.varianteContenido;

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

  // Terminar la sesion y empezar otra.
  //
  // Va con confirmacion de dos pasos, al contrario que `aplicar`, y por la razon opuesta: no
  // es reversible. La sesion terminada se queda en el registro y se puede leer, pero no se
  // puede volver a ella, y todo lo que se juegue despues va a la del paciente siguiente.
  const terminarBoton = document.createElement('button');
  terminarBoton.type = 'button';
  terminarBoton.className = 'accion terminar';
  const TEXTO_TERMINAR = 'Terminar sesión y empezar otra';
  terminarBoton.textContent = TEXTO_TERMINAR;
  let confirmandoTerminar = false;

  function cancelarConfirmacion() {
    confirmandoTerminar = false;
    terminarBoton.textContent = TEXTO_TERMINAR;
    delete terminarBoton.dataset['confirmando'];
  }

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
      opciones: opciones === undefined ? null : opciones(borrador.C),
      ...(estado.instrumento === undefined ? {} : { instrumento: estado.instrumento }),
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
    // El desglose por ejercicio. Sustituye a la precisión de sesión cuando hay más de uno, y
    // no se muestra cuando hay uno solo: repetir el mismo número con otra etiqueta es ruido.
    if (res.instrumentos.length > 1) {
      for (const fila of presentarPorInstrumento(res, ETIQUETA_INSTRUMENTO)) {
        sec.append(metrica(fila));
      }
    }
    sec.append(metrica(presentarLatencia(res, {
      resolucionMs: s.resolucionMs, fiableParaPresupuesto: s.fiableParaPresupuesto,
    })));
    // Desglose por clase de vía. Se muestra con más de una, y también con UNA sola cuando no
    // es reacción: «424 ms» no se puede interpretar sin saber que 500 de esos milisegundos
    // eran la cadencia del barrido.
    const clases = [...res.latenciaPorClase.keys()];
    if (clases.length > 1 || (clases.length === 1 && clases[0] !== 'reaccion')) {
      for (const fila of presentarLatenciaPorClase(res)) sec.append(metrica(fila));
    }

    // PARTIDO por variante de contenido (sistema 32, AC-4). Antes era una lista plana con
    // los intentos de TODOS los tableros, y con dos variantes en la misma sesión eso
    // mezclaba la precisión de sumar hasta 10 con la de multiplicar: el número no
    // significaba nada.
    //
    // Se muestra la variante ACTIVA. Las demás siguen en el registro, y la vista
    // longitudinal del sistema 20 las leerá cuando exista.
    const porVariante = observacionesPorVariante(s, 'dp');
    /** @type {import('../dificultad/modelo.js').Observacion[]} */
    const obsPerceptivo = porVariante.get(estado.varianteContenido ?? null) ?? [];

    sec.append(metrica(presentarDificultadTolerada(
      dificultadTolerada(obsPerceptivo, { acoplados: s.ejesAcoplados }),
      'perceptivo',
    )));

    // AC-9 — si la sesión tiene más de una variante, se DICE. Sin esto, el terapeuta ve un
    // número calculado sobre una parte de la sesión y cree que es de toda.
    if (porVariante.size > 1) {
      const aviso = document.createElement('p');
      aviso.className = 'nota';
      aviso.textContent =
        `Esta sesión tiene ${porVariante.size} tareas distintas. El número de arriba es solo `
        + 'de la tarea activa: los de tareas distintas no se suman.';
      sec.append(aviso);
    }

    return sec;
  }

  /**
   * La jornada: las sesiones anteriores, el informe copiable, y el paso al paciente
   * siguiente.
   *
   * ## Por qué el informe es un `<textarea>` y no texto normal
   *
   * Porque hay que poder **copiarlo**, y las dos alternativas fallan:
   *
   * - La API del portapapeles necesita contexto seguro. El proyecto se abre a menudo con
   *   `file://` —el terapeuta abre `index.html` directamente— y ahí no existe.
   * - Un bloque de texto suelto obliga a seleccionar arrastrando, y el arrastre está
   *   prohibido como vía única en todo el producto.
   *
   * Un `<textarea readonly>` se selecciona entero con `Ctrl+A` desde el teclado, sin
   * arrastrar y sin permisos. Y no es un campo de entrada disfrazado: es de sólo lectura y
   * lo dice su etiqueta.
   *
   * @returns {HTMLElement | null}
   */
  function seccionJornada() {
    if (jornada === undefined) return null;
    const sesiones = jornada();

    const sec = document.createElement('section');
    sec.className = 'seccion jornada';
    const h = document.createElement('h2');
    h.textContent = 'Jornada';
    sec.append(h);

    const cuenta = document.createElement('p');
    cuenta.className = 'metrica-valor';
    const anteriores = Math.max(0, sesiones.length - 1);
    cuenta.textContent = anteriores === 0
      ? 'Primera sesión de la jornada.'
      : `Sesión ${sesiones.length} de la jornada. Las ${anteriores} anteriores siguen en el `
        + 'informe de abajo.';
    sec.append(cuenta);

    // El aviso de que esto no se guarda va ARRIBA del informe, no debajo: debajo se lee
    // cuando ya se ha cerrado la pestaña.
    const aviso = document.createElement('p');
    aviso.className = 'mensaje aviso';
    aviso.dataset['bloquea'] = 'no';
    aviso.textContent = `⚠ ${AVISO_SIN_GUARDAR}`;

    const etiqueta = document.createElement('label');
    etiqueta.className = 'etiqueta-informe';
    etiqueta.htmlFor = 'informe-jornada';
    etiqueta.textContent = 'Informe de la jornada (sólo lectura). Ctrl+A y Ctrl+C para copiar.';

    const area = document.createElement('textarea');
    area.id = 'informe-jornada';
    area.className = 'informe';
    area.readOnly = true;
    area.rows = 14;
    area.spellcheck = false;
    area.value = informeDeJornada(sesiones, {
      etiquetas: ETIQUETA_INSTRUMENTO,
      ...(formatoHora === undefined ? {} : { formatoHora }),
    });

    // El informe va PLEGADO, y esto no es una preferencia de presentacion.
    //
    // El GDD declara —y acepta— que un paciente que pulse el boton del panel lo abre: *«no
    // hay proteccion, y es una decision declarada, no un olvido»*. Ese riesgo se evaluo
    // cuando el panel mostraba el progreso de LA SESION EN CURSO, o sea los datos del propio
    // paciente que esta delante.
    //
    // El informe de la jornada cambia la clase de riesgo: dentro estan **las sesiones de los
    // pacientes anteriores**. Un paciente que abre el panel por accidente ya no veria solo su
    // propia precision, sino la de otras personas.
    //
    // Plegarlo no revoca la decision del GDD ni esconde el panel tras un gesto: el panel
    // sigue abriendose de un toque y el progreso de la sesion en curso sigue a la vista. Lo
    // que exige un toque mas es lo que pertenece a terceros.
    const desplegar = document.createElement('button');
    desplegar.type = 'button';
    desplegar.className = 'accion desplegar-informe';
    desplegar.setAttribute('aria-expanded', 'false');
    desplegar.setAttribute('aria-controls', area.id);
    desplegar.textContent = sesiones.length === 1
      ? 'Ver el informe de esta sesión'
      : `Ver el informe de la jornada (${sesiones.length} sesiones)`;
    etiqueta.hidden = true;
    area.hidden = true;
    aviso.hidden = true;
    desplegar.addEventListener('click', () => {
      const abierto = desplegar.getAttribute('aria-expanded') === 'true';
      desplegar.setAttribute('aria-expanded', abierto ? 'false' : 'true');
      etiqueta.hidden = abierto;
      area.hidden = abierto;
      aviso.hidden = abierto;
      if (!abierto) area.focus();
    });

    sec.append(desplegar, aviso, etiqueta, area);
    return sec;
  }

  /**
   * Despliega el informe sin que haya que buscarlo.
   *
   * Se usa justo despues de terminar una sesion: ahi el terapeuta SI acaba de pedirlo, y el
   * paciente de esa sesion ya no esta delante.
   */
  function desplegarInforme() {
    const b = dialogo.querySelector('.desplegar-informe');
    if (b instanceof HTMLButtonElement && b.getAttribute('aria-expanded') !== 'true') b.click();
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
      escalones({
        id: 'perilla-t', etiqueta: 'Tamaño de objetivo', valor: borrador.t,
        escalones: ESCALONES_T, unidad: '',
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
      escalones({
        id: 'perilla-c', etiqueta: 'Cantidad de objetos', valor: borrador.C,
        escalones: ESCALONES_C, unidad: '',
        alCambiar: (v) => { borrador.C = v; refrescarAvisos(); },
      }),
      escalones({
        id: 'perilla-sv', etiqueta: 'Similitud visual', valor: borrador.sv,
        escalones: ESCALONES_PROPORCION, unidad: '',
        formato: (v) => (v === 0 || v === 1 ? String(v) : v.toFixed(2).replace('0.', ',')),
        alCambiar: (v) => { borrador.sv = v; refrescarAvisos(); },
      }),
      escalones({
        id: 'perilla-ss', etiqueta: 'Similitud semántica', valor: borrador.ss,
        escalones: ESCALONES_PROPORCION, unidad: '',
        formato: (v) => (v === 0 || v === 1 ? String(v) : v.toFixed(2).replace('0.', ',')),
        alCambiar: (v) => { borrador.ss = v; refrescarAvisos(); },
      }),
    ]);
    ejePerceptivo.setAttribute('aria-label', 'Eje perceptivo-cognitivo');

    seccionEjercicio.append(ejeMotor, ejePerceptivo);

    // --- Eje de CONTENIDO (sistema 32). Solo si este instrumento declara variantes.
    //
    // **La lista vacía es el caso normal**, no un hueco por rellenar: hoy solo el tres en
    // raya tiene variantes. Un control vacío o desactivado le diría al terapeuta que hay
    // algo que configurar cuando no lo hay.
    const variantes = variantesDe(estado.instrumento ?? '');
    if (variantes.length > 0) {
      const fila = document.createElement('div');
      fila.className = 'fila fila-escalones';

      const lab = document.createElement('span');
      lab.className = 'etiqueta-escalones';
      lab.id = 'perilla-contenido-etiqueta';
      lab.textContent = 'Tarea';

      const gr = document.createElement('div');
      gr.className = 'escalones';
      gr.id = 'perilla-contenido';
      gr.setAttribute('role', 'radiogroup');
      gr.setAttribute('aria-labelledby', lab.id);

      /** @type {HTMLButtonElement[]} */
      const botones = [];
      /** @param {string} id */
      const marcar = (id) => {
        borradorVariante = id;
        for (const b of botones) {
          const activo = b.dataset['valor'] === id;
          b.setAttribute('aria-checked', activo ? 'true' : 'false');
          b.tabIndex = activo ? 0 : -1;
        }
      };
      /** @param {number} delta */
      const mover = (delta) => {
        const i = variantes.findIndex((v) => v.id === borradorVariante);
        const j = Math.min(Math.max((i === -1 ? 0 : i) + delta, 0), variantes.length - 1);
        const v = variantes[j];
        if (v === undefined) return;
        marcar(v.id);
        botones[j]?.focus();
        refrescarAvisos();
      };

      variantes.forEach((v) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'escalon escalon-texto';
        b.setAttribute('role', 'radio');
        b.dataset['valor'] = v.id;
        // La ETIQUETA, nunca el ordinal. El ordinal sirve para ordenar y agrupar, no para
        // que nadie lo lea como una puntuación.
        b.textContent = v.etiqueta;
        b.addEventListener('click', () => { marcar(v.id); refrescarAvisos(); });
        b.addEventListener('keydown', (ev) => {
          if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); mover(1); }
          if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); mover(-1); }
        });
        botones.push(b);
        gr.append(b);
      });
      marcar(borradorVariante ?? /** @type {string} */ (variantes[0]?.id));
      fila.append(lab, gr);

      const ejeContenido = grupo('Eje de contenido — qué tarea, no cuánto cuesta verla', [fila]);
      ejeContenido.setAttribute('aria-label', 'Eje de contenido');
      seccionEjercicio.append(ejeContenido);
    }

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

    // --- Las dos vias de acceso que el sistema 5 diseño y no estaban conectadas.
    const chkBarrido = document.createElement('input');
    chkBarrido.type = 'checkbox';
    chkBarrido.id = 'perilla-barrido';
    chkBarrido.checked = borradorAcceso.barrido;
    chkBarrido.addEventListener('change', () => {
      borradorAcceso.barrido = chkBarrido.checked;
      refrescarAvisos();
    });
    const labBarrido = document.createElement('label');
    labBarrido.htmlFor = 'perilla-barrido';
    labBarrido.textContent = 'Barrido por pulsador — el foco avanza solo';
    const filaBarrido = document.createElement('div');
    filaBarrido.className = 'fila';
    filaBarrido.append(chkBarrido, labBarrido);

    const filaVuelta = deslizador({
      id: 'perilla-vuelta', etiqueta: 'Tiempo de una vuelta', valor: borradorAcceso.msVuelta,
      min: 3000, max: 60000, paso: 1000, unidad: ' ms',
      alCambiar: (v) => { borradorAcceso.msVuelta = v; refrescarAvisos(); },
    });

    seccionAcceso.append(
      grupo('Vía de acceso', [filaBarrido, filaVuelta]),
      grupo('Presentación', [reducido, silencio]),
    );

    const jor = seccionJornada();
    cuerpo.append(seccionEjercicio, seccionAcceso, zonaAvisos, seccionResultados());
    if (jor !== null) cuerpo.append(jor);
    cuerpo.append(zonaProgreso);
    refrescarAvisos();
  }

  const acciones = document.createElement('div');
  acciones.className = 'acciones';
  acciones.append(aplicar, cerrarBoton);
  if (alTerminarSesion !== undefined) acciones.append(terminarBoton);
  dialogo.append(cuerpo, acciones);

  const abridor = document.createElement('button');
  abridor.type = 'button';
  abridor.className = 'abridor';
  // Boton visible y con tamaño de objetivo normal. NO una pulsacion larga ni un gesto: eso
  // violaria la regla de un solo punto de activacion del sistema 5, y haria el panel
  // inalcanzable para un terapeuta que use pulsador.
  abridor.textContent = 'Panel del terapeuta';
  abridor.setAttribute('aria-haspopup', 'dialog');

  /**
   * Los elementos que el panel deja INERTES mientras está abierto.
   *
   * @type {Element[]}
   */
  const aislados = [];

  /**
   * Aísla el panel del resto de la página.
   *
   * ## El defecto, medido
   *
   * El panel declara `aria-modal="true"`, que promete que lo de fuera no está disponible. No
   * lo estaba cumpliendo. Tabulando desde el panel abierto:
   *
   * ```
   * Aplicar | Cerrar | Terminar | BODY | A | A | A | A | A | A | A | A | A | abridor | ...
   * ```
   *
   * **Tres tabulaciones y el foco se iba del panel**, y después recorría los nueve enlaces
   * del selector de ejercicio POR DETRÁS de un panel opaco: foco invisible, y activar uno
   * cambiaba el ejercicio desde debajo de una ventana modal. Diez paradas de nada antes de
   * volver a los mandos, en un flujo que tiene que durar treinta segundos.
   *
   * ## Por qué `inert` y no una trampa de foco en JavaScript
   *
   * `inert` quita los elementos del orden de tabulación **y del árbol de accesibilidad**, que
   * es exactamente lo que `aria-modal` promete. Una trampa hecha a mano sólo arregla la
   * tabulación, y además hay que capturarla en `document`: cuando el foco ya está en `body`,
   * el `keydown` del diálogo no lo ve.
   */
  function aislar() {
    /** @type {Element} */
    let nodo = dialogo;
    while (nodo.parentElement !== null && nodo.parentElement !== document.documentElement) {
      for (const hermano of nodo.parentElement.children) {
        if (hermano !== nodo && !hermano.hasAttribute('inert')) {
          hermano.setAttribute('inert', '');
          aislados.push(hermano);
        }
      }
      nodo = nodo.parentElement;
    }
  }

  function desaislar() {
    for (const el of aislados) el.removeAttribute('inert');
    aislados.length = 0;
  }

  function abrir() {
    borrador = aEscalones(estado.config);
    borradorAcceso = { ...estado.acceso };
    borradorVariante = estado.varianteContenido;
    const p = progreso();
    zonaProgreso.textContent =
      `Sesión: ${p.tableros} tableros, ${p.aciertos} de ${p.intentos} activaciones ` +
      `correctas.`;
    construir();
    dialogo.hidden = false;
    // El orden importa: primero visible, despues aislado. `inert` sobre un ancestro del
    // dialogo lo dejaria inerte a el tambien.
    aislar();
    estado.abierto = true;
    if (alAbrir !== undefined) alAbrir();
    // La sesion se pausa: el tablero deja de ser alcanzable por teclado.
    document.body.dataset['panelAbierto'] = 'si';
    aplicar.focus();
  }

  function cerrar() {
    // Una confirmacion a medias NO sobrevive al cierre: si sobreviviera, el terapeuta que
    // vuelve a abrir el panel encontraria el boton armado y terminaria la sesion de un toque.
    cancelarConfirmacion();
    desaislar();
    dialogo.hidden = true;
    estado.abierto = false;
    if (alCerrar !== undefined) alCerrar();
    delete document.body.dataset['panelAbierto'];
    abridor.focus();
  }

  abridor.addEventListener('click', abrir);
  cerrarBoton.addEventListener('click', cerrar);

  terminarBoton.addEventListener('click', () => {
    if (alTerminarSesion === undefined) return;
    if (!confirmandoTerminar) {
      confirmandoTerminar = true;
      terminarBoton.dataset['confirmando'] = 'si';
      terminarBoton.textContent = 'Confirmar: terminar y empezar otra';
      return;
    }
    cancelarConfirmacion();
    alTerminarSesion();
    // El panel se queda ABIERTO y se reconstruye. Es deliberado: la sesion que se acaba de
    // terminar solo existe en memoria, y cerrar el panel aqui esconderia el informe que el
    // terapeuta tiene que copiar antes de seguir.
    construir();
    desplegarInforme();
  });

  aplicar.addEventListener('click', () => {
    if (aplicar.disabled) return;
    cancelarConfirmacion();
    estado.config = { ...borrador };
    estado.acceso = { ...borradorAcceso };
    if (borradorVariante !== undefined) estado.varianteContenido = borradorVariante;
    alAplicar(estado.config, estado.acceso, borradorVariante);
    cerrar();
  });
  /**
   * Lo que puede recibir el foco DENTRO del panel, en orden de tabulación.
   *
   * `tabIndex >= 0` es el filtro, no una lista de selectores: los botones de escalón usan el
   * patrón del ARIA APG y sólo el elegido está en el orden de tabulación. Una lista de
   * selectores devolvería los diez y el ciclo se rompería.
   *
   * @returns {HTMLElement[]}
   */
  function enfocables() {
    return [...dialogo.querySelectorAll('button, input, textarea, select, a[href], [tabindex]')]
      .filter((el) => el instanceof HTMLElement && el.tabIndex >= 0 && !el.hidden)
      .filter((el) => !(el instanceof HTMLButtonElement && el.disabled))
      .map((el) => /** @type {HTMLElement} */ (el));
  }

  dialogo.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrar();

    // El CICLO de tabulación. `inert` ya impide que el foco llegue a lo de fuera, pero sin
    // esto la tabulación desde el último mando pasa por el documento —medido: una parada en
    // `BODY`, o sea en nada— antes de volver al panel. Para quien navega con teclado o con
    // pulsador, esa parada muerta es indistinguible de un panel que dejó de responder.
    if (e.key === 'Tab') {
      const lista = enfocables();
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (primero === undefined || ultimo === undefined) return;
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
  });

  contenedor.append(abridor, dialogo);
  return { abrir, cerrar, estaAbierto: () => estado.abierto };
}

export { T_AAA };
