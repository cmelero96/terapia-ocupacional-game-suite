/**
 * Reconfigurar sin recargar. Regresión del bloqueante S1 del informe cruzado.
 *
 * El defecto medido era: aplicar una configuración hacía `location.href = url`, la página
 * se recargaba, y el registro —que vive en memoria— desaparecía con ella. Dos tableros y
 * dos intentos borrados en silencio, en el flujo CENTRAL del producto.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearSesionViva } from '../../../src/plataforma/sesion-viva.js';
import { dm } from '../../../src/dificultad/modelo.js';
import { BANCO_PRUEBA } from '../../fixtures/banco-prueba.js';

/** Un DOM mínimo: la sesión viva monta de verdad, así que necesita dónde montar. */
function domFalso() {
  globalThis.document = /** @type {any} */ ({
    createElement: () => elemento(),
    querySelector: () => null,
    querySelectorAll: () => [],
    body: elemento(),
    documentElement: elemento(),
    activeElement: null,
  });
  globalThis.matchMedia = /** @type {any} */ (() => ({ matches: false }));
  return { raiz: elemento(), zonaObjetivo: elemento(), zonaContenedores: elemento() };
}

function elemento() {
  /** @type {any} */
  const el = {
    dataset: {}, style: { setProperty() {}, removeProperty() {}, getPropertyValue: () => '' },
    classList: { add() {}, remove() {}, toggle() {} },
    children: [], hidden: false, textContent: '',
    append() {}, appendChild() {}, replaceChildren() {}, remove() {},
    addEventListener() {}, removeEventListener() {}, focus() {},
    setAttribute() {}, removeAttribute() {}, getAttribute: () => null,
    querySelector: () => null, querySelectorAll: () => [],
  };
  return el;
}

test('test_reconfigurar_CONSERVA_los_tableros_ya_cerrados', () => {
  const zonas = domFalso();
  const viva = crearSesionViva({
    ...zonas, tipo: 'busca', banco: [...BANCO_PRUEBA],
    config: { t: 60, C: 6, sv: 0.3, ss: 0.3 },
  });

  // Cierra dos tableros jugando de verdad.
  for (let i = 0; i < 2; i++) {
    const inst = viva.estado.instrumento;
    inst.activar(
      { idObjetivo: inst.tablero.objetivo, tActivacion: 1, modo: 'tactil', origenTiempo: 'evento' },
      { ms: 300 },
    );
    viva.estado.cerrarTablero({ resuelto: true });
  }
  const antes = viva.sesion.tableros.length;
  assert.equal(antes, 2, 'preparacion: debe haber dos tableros cerrados');
  const ordenAntes = viva.sesion.orden;

  viva.reconfigurar({ config: { t: 100, C: 9, sv: 0.5, ss: 0.2 } });

  assert.ok(viva.sesion.tableros.length >= antes, 'los tableros cerrados NO desaparecen');
  assert.equal(viva.sesion.orden, ordenAntes, 'es la MISMA sesion, no una nueva');
  assert.equal(viva.estado.instrumento.t, 100, 'la configuracion nueva SI se aplica');
});

test('test_reconfigurar_cierra_el_tablero_EN_CURSO_antes_de_cambiar', () => {
  // Sus intentos pertenecen a la configuracion con la que se jugaron. Atribuirlos a la
  // nueva sobrestimaria o subestimaria la dificultad tolerada, que es el defecto S2.
  const zonas = domFalso();
  const viva = crearSesionViva({
    ...zonas, tipo: 'busca', banco: [...BANCO_PRUEBA],
    config: { t: 60, C: 6, sv: 0.3, ss: 0.3 },
  });
  const inst = viva.estado.instrumento;
  const tPrevio = inst.t;
  inst.activar(
    { idObjetivo: inst.tablero.objetivo, tActivacion: 1, modo: 'tactil', origenTiempo: 'evento' },
    { ms: 300 },
  );

  viva.reconfigurar({ config: { t: 120, C: 6, sv: 0.3, ss: 0.3 } });

  const cerrado = viva.sesion.tableros[0];
  assert.ok(cerrado !== undefined, 'el tablero en curso debe haberse cerrado');
  assert.equal(cerrado.intentos.length, 1);
  // Su `dm` es el del tamaño VIEJO, no el del nuevo.
  assert.ok(Math.abs(cerrado.dm - dm(tPrevio)) < 1e-9, 'dm del tamaño con el que se jugo');
});

test('test_la_marca_de_ejes_acoplados_se_ENDURECE_y_no_se_relaja', () => {
  // Una sesion en la que en algun momento `t < 44` tiene la medicion perceptiva
  // contaminada, aunque despues se suba el tamaño.
  const zonas = domFalso();
  const viva = crearSesionViva({
    ...zonas, tipo: 'busca', banco: [...BANCO_PRUEBA],
    config: { t: 100, C: 6, sv: 0.3, ss: 0.3 },
  });
  assert.equal(viva.sesion.ejesAcoplados, false);

  viva.reconfigurar({ config: { t: 30, C: 6, sv: 0.3, ss: 0.3 } });
  assert.equal(viva.sesion.ejesAcoplados, true, 'un tamaño por debajo de 44 la marca');

  viva.reconfigurar({ config: { t: 100, C: 6, sv: 0.3, ss: 0.3 } });
  assert.equal(viva.sesion.ejesAcoplados, true, 'y subir el tamaño NO la borra');
});

// -------------------------------------------------- terminar y empezar otra (la jornada)

/**
 * El bloqueante que apareció al medir una sesión larga: **no había forma de pasar al
 * paciente siguiente sin perder lo anterior.**
 *
 * El GDD del sistema 9 guarda hasta 20 sesiones porque *«20 sesiones son mucho más de lo
 * que una jornada de consulta produce»*. O sea que el diseño cuenta con varias sesiones por
 * jornada — y sólo se abría una, al cargar la página. Para pasar al siguiente había que
 * recargar, que es exactamente el bloqueante S1 otra vez, ahora por la puerta de la jornada.
 *
 * El tope de 20 era CÓDIGO MUERTO: nunca podía llegar a dos.
 */

/** @param {{ estado: any }} sesionViva */
function jugarUnTablero(sesionViva) {
  const inst = sesionViva.estado.instrumento;
  inst.activar(
    { idObjetivo: inst.tablero.objetivo, tActivacion: 1, modo: 'tactil', origenTiempo: 'evento' },
    { ms: 300 },
  );
  sesionViva.estado.cerrarTablero({ resuelto: true });
}

test('test_terminar_abre_una_sesion_NUEVA_y_conserva_la_anterior', () => {
  const zonas = domFalso();
  const viva = crearSesionViva({
    ...zonas, tipo: 'busca', banco: [...BANCO_PRUEBA],
    config: { t: 60, C: 6, sv: 0.3, ss: 0.3 },
  });
  jugarUnTablero(viva);
  jugarUnTablero(viva);

  const terminada = viva.terminarYEmpezarOtra();

  // DOS, no tres: el tablero en curso no tenia ni un intento, y un tablero que nadie toco no
  // es un dato. Registrarlo con cero intentos bajaria la precision de la sesion con un
  // tablero que el paciente no jugo.
  assert.equal(terminada.tableros.length, 2, 'los 2 jugados; el intacto no cuenta');
  assert.equal(viva.sesion.tableros.length, 0, 'la sesion nueva empieza VACIA');
  assert.notEqual(viva.sesion.orden, terminada.orden, 'y es otra sesion');
  assert.ok(viva.sesion.orden > terminada.orden, 'posterior en orden de insercion');

  const jornada = viva.registro.ordenadas();
  assert.equal(jornada.length, 2, 'las DOS estan en el registro de la jornada');
  assert.equal(jornada[0]?.orden, terminada.orden, 'y la terminada sigue siendo legible');
  assert.equal(jornada[0]?.tableros.length, 2);
});

test('test_el_tablero_en_curso_al_terminar_queda_marcado_INCOMPLETO', () => {
  // Nunca se resolvio: contarlo como resuelto inventaria un acierto que no ocurrio.
  const zonas = domFalso();
  const viva = crearSesionViva({
    ...zonas, tipo: 'busca', banco: [...BANCO_PRUEBA],
    config: { t: 60, C: 6, sv: 0.3, ss: 0.3 },
  });
  jugarUnTablero(viva);
  // Un fallo en el tablero SIGUIENTE: asi tiene un intento y no esta resuelto, que es el
  // estado real de un tablero a medias cuando el terapeuta termina la sesion.
  const inst = viva.estado.instrumento;
  const fallo = inst.tablero.distractores[0] ?? inst.tablero.objetivo;
  inst.activar(
    { idObjetivo: fallo, tActivacion: 1, modo: 'tactil', origenTiempo: 'evento' },
    { ms: 300 },
  );
  const terminada = viva.terminarYEmpezarOtra();

  assert.equal(terminada.tableros.length, 2, 'el resuelto y el que estaba a medias');
  assert.equal(terminada.tableros.filter((t) => t.incompleto).length, 1);
  assert.equal(terminada.tableros.filter((t) => !t.incompleto).length, 1, 'el resuelto, no');
});

test('test_la_sesion_nueva_sigue_siendo_JUGABLE', () => {
  // El instrumento se desmonta y se vuelve a montar. Si el montaje nuevo no quedara vivo, el
  // terapeuta terminaria la sesion y se encontraria un tablero que no responde.
  const zonas = domFalso();
  const viva = crearSesionViva({
    ...zonas, tipo: 'busca', banco: [...BANCO_PRUEBA],
    config: { t: 60, C: 6, sv: 0.3, ss: 0.3 },
  });
  viva.terminarYEmpezarOtra();
  jugarUnTablero(viva);

  assert.equal(viva.sesion.tableros.length, 1, 'lo jugado despues va a la sesion NUEVA');
  assert.equal(viva.registro.ordenadas().length, 2, 'y no se abrio una tercera');
});

test('test_terminar_conserva_la_CONFIGURACION_aplicada', () => {
  // Empezar con otro paciente no es reiniciar los ajustes: si volviera a los de la URL, el
  // terapeuta perderia en silencio todo lo que hubiera ajustado en la jornada.
  const zonas = domFalso();
  const viva = crearSesionViva({
    ...zonas, tipo: 'busca', banco: [...BANCO_PRUEBA],
    config: { t: 60, C: 6, sv: 0.3, ss: 0.3 },
  });
  viva.reconfigurar({ config: { t: 100, C: 9, sv: 0.5, ss: 0.2 } });
  viva.terminarYEmpezarOtra();

  assert.equal(viva.estado.instrumento.t, 100);
  assert.equal(dm(viva.estado.instrumento.t), dm(100));
});

test('test_tres_sesiones_seguidas_van_en_ORDEN', () => {
  const zonas = domFalso();
  const viva = crearSesionViva({
    ...zonas, tipo: 'busca', banco: [...BANCO_PRUEBA],
    config: { t: 60, C: 6, sv: 0.3, ss: 0.3 },
  });
  viva.terminarYEmpezarOtra();
  viva.terminarYEmpezarOtra();

  const ordenes = viva.registro.ordenadas().map((s) => s.orden);
  assert.equal(ordenes.length, 3);
  assert.deepStrictEqual([...ordenes].sort((a, b) => a - b), ordenes, 'en orden creciente');
});
