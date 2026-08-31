/**
 * Sistemas 21 y 24 — criterios de aceptacion.
 * Cubre AC-1, AC-3 a AC-10 y AC-12. AC-2 y AC-11 necesitan navegador.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Clasificar, contenedores, puedeSerObjetivo as puedeClasificar, N_CONTENEDORES_MAX }
  from '../../../src/instrumentos/clasificar.js';
import { Denominar, puedeSerObjetivo as puedeDenominar, EXIGE_LECTURA }
  from '../../../src/instrumentos/denominar.js';
import { Busca } from '../../../src/instrumentos/busca.js';
import { crearFuenteAleatoria } from '../../../src/plataforma/aleatoriedad.js';
import { generarTablero } from '../../../src/tablero/generador.js';
import { envolverConValidacion } from '../../../src/plataforma/borde-impuro.js';

const CATS = ['cocina', 'alimento', 'oficina', 'calle', 'jardin'];

/** @returns {import('../../../src/tablero/generador.js').Elemento[]} */
function banco() {
  /** @type {import('../../../src/tablero/generador.js').Elemento[]} */
  const b = [];
  ['recipientes', 'redondeados', 'escritura', 'vehiculos'].forEach((cluster, ci) => {
    for (let i = 0; i < 8; i++) {
      b.push({
        id: `${cluster}-${i}`,
        cluster,
        categories: [
          /** @type {string} */ (CATS[ci]),
          /** @type {string} */ (CATS[(ci + i + 1) % CATS.length]),
        ],
        status: 'activo',
      });
    }
  });
  return b;
}

/** @param {string} id @returns {import('../../../src/instrumentos/clasificar.js').EstimuloClasificable} */
const resolver = (id) => {
  const e = banco().find((x) => x.id === id);
  return {
    id,
    nombre: id,
    glifo: '#',
    categories: e === undefined ? [] : e.categories,
  };
};

/** @param {number} s */
const fuente = (s) => envolverConValidacion(crearFuenteAleatoria(s));

/** @param {number} s */
const tablero = (s) => generarTablero({
  banco: banco(), objetivo: 'recipientes-0', C: 6, sv: 0.25, ss: 0.25,
  semilla: s, fuenteAleatoria: fuente(s),
});

/** @type {import('../../../src/registro/sesion.js').Latencia} */
const lat = { ms: 500 };

/** @param {string} id @returns {import('../../../src/entrada/adaptador.js').EventoActivacion} */
const ev = (id) => ({ idObjetivo: id, tActivacion: 1000, modo: 'tactil', origenTiempo: 'evento' });

// ---------------------------------------------------------------- AC-1

test('test_denominacion_usa_la_MISMA_regla_de_acierto_que_Busca', () => {
  const args = { t: 60, resolver, siguienteTablero: () => tablero(7) };
  const busca = new Busca(args);
  const denom = new Denominar(args);

  // Para toda celda, las dos reglas coinciden.
  for (const celda of busca.celdas()) {
    const b = busca.activar(ev(celda.id), lat);
    const d = denom.activar(ev(celda.id), lat);
    assert.equal(b.correcto, d.correcto, `divergen en ${celda.id}`);
  }
});

test('test_denominacion_no_muestra_el_glifo_de_referencia', () => {
  const d = new Denominar({ t: 60, resolver, siguienteTablero: () => tablero(1) });
  assert.equal(d.mostrarGlifoDeReferencia, false);
  // Y Busca sí: es la única diferencia funcional entre los dos.
  const b = new Busca({ t: 60, resolver, siguienteTablero: () => tablero(1) });
  assert.equal(/** @type {any} */ (b).mostrarGlifoDeReferencia, undefined);
});

test('test_denominacion_declara_que_exige_lectura', () => {
  // No se adapta: se declara. Un instrumento que exige leer no se puede hacer accesible a
  // quien no lee sin convertirse en otro instrumento.
  assert.equal(EXIGE_LECTURA, true);
});

// ---------------------------------------------------------------- AC-12

test('test_denominacion_excluye_los_elementos_sin_nombre', () => {
  assert.equal(puedeDenominar({ nombre: 'taza' }), true);
  assert.equal(puedeDenominar({ nombre: '' }), false);
  assert.equal(puedeDenominar({ nombre: '   ' }), false);
  assert.equal(puedeDenominar({}), false);
});

// ---------------------------------------------------------------- AC-3, AC-4, AC-5, AC-6

/** @returns {Clasificar} */
const nuevoClasificar = () => new Clasificar({
  t: 60,
  resolver,
  siguienteTablero: () => tablero(11),
  contenedoresDelTablero: () => contenedores({
    categoriasObjetivo: resolver('recipientes-0').categories,
    todasLasCategorias: CATS,
    nContenedores: 3,
    fuenteAleatoria: crearFuenteAleatoria(11),
  }),
});

test('test_la_primera_activacion_de_clasificar_NO_registra_nada', () => {
  const c = nuevoClasificar();
  const r = c.activar(ev('recipientes-0'), lat, 'objeto');
  assert.equal(r.registrado, false);
  assert.equal(c.seleccionado, 'recipientes-0');
  assert.equal(c.intentos.length, 0, 'el registro no debe ganar ningun intento');
});

test('test_activar_el_mismo_objeto_deselecciona_y_tampoco_registra', () => {
  const c = nuevoClasificar();
  c.activar(ev('recipientes-0'), lat, 'objeto');
  const r = c.activar(ev('recipientes-0'), lat, 'objeto');
  assert.equal(r.registrado, false);
  assert.equal(c.seleccionado, null);
  assert.equal(c.intentos.length, 0);
});

test('test_activar_otro_objeto_cambia_la_seleccion_sin_registrar', () => {
  const c = nuevoClasificar();
  const otro = c.celdas().find((x) => x.id !== 'recipientes-0');
  c.activar(ev('recipientes-0'), lat, 'objeto');
  c.activar(ev(/** @type {string} */ (otro?.id)), lat, 'objeto');
  assert.equal(c.seleccionado, otro?.id);
  assert.equal(c.intentos.length, 0);
});

test('test_solo_la_activacion_de_un_contenedor_registra', () => {
  const c = nuevoClasificar();
  c.activar(ev('recipientes-0'), lat, 'objeto');
  const correcto = /** @type {string} */ (
    c.contenedores.find((x) => resolver('recipientes-0').categories.includes(x))
  );
  const r = c.activar(ev(correcto), lat, 'contenedor');
  assert.equal(r.registrado, true);
  assert.equal(r.correcto, true);
  assert.equal(c.intentos.length, 1);
  // Y la seleccion se limpia tras registrar.
  assert.equal(c.seleccionado, null);
});

test('test_un_contenedor_equivocado_registra_un_fallo_y_NO_avanza', () => {
  const c = nuevoClasificar();
  const cats = resolver('recipientes-0').categories;
  const malo = c.contenedores.find((x) => !cats.includes(x));
  if (malo === undefined) return; // los tres contenedores eran suyos: caso legitimo
  const tableroAntes = c.tablero;
  c.activar(ev('recipientes-0'), lat, 'objeto');
  const r = c.activar(ev(malo), lat, 'contenedor');
  assert.equal(r.registrado, true);
  assert.equal(r.correcto, false);
  assert.equal(r.avanza, false);
  assert.equal(c.tablero, tableroAntes, 'un fallo no cambia el tablero');
});

test('test_activar_un_contenedor_sin_seleccion_no_hace_NADA', () => {
  const c = nuevoClasificar();
  const r = c.activar(ev(/** @type {string} */ (c.contenedores[0])), lat, 'contenedor');
  assert.equal(r.registrado, false);
  assert.equal(c.intentos.length, 0);
  assert.equal(c.seleccionado, null);
});

test('test_la_seleccion_no_sobrevive_a_la_pausa', () => {
  const c = nuevoClasificar();
  c.activar(ev('recipientes-0'), lat, 'objeto');
  c.limpiarSeleccion();
  assert.equal(c.seleccionado, null);
});

// ---------------------------------------------------------------- AC-7, AC-8, AC-9

test('test_al_menos_un_contenedor_es_SIEMPRE_correcto', () => {
  // Un ejercicio imposible es peor que uno dificil: el paciente no puede saber que lo es.
  for (let s = 1; s <= 500; s++) {
    for (let n = 2; n <= N_CONTENEDORES_MAX; n++) {
      const cats = resolver(`recipientes-${s % 8}`).categories;
      const lista = contenedores({
        categoriasObjetivo: cats,
        todasLasCategorias: CATS,
        nContenedores: n,
        fuenteAleatoria: crearFuenteAleatoria(s),
      });
      assert.equal(lista.length, n, `semilla ${s}, n ${n}`);
      assert.equal(new Set(lista).size, n, 'sin etiquetas repetidas');
      assert.ok(
        lista.some((x) => cats.includes(x)),
        `semilla ${s}, n ${n}: ningun contenedor correcto`,
      );
    }
  }
});

test('test_dos_contenedores_correctos_son_los_DOS_aciertos', () => {
  // Consecuencia de `categories[]` multiple, y es deseable.
  const c = nuevoClasificar();
  const cats = resolver('recipientes-0').categories;
  const correctos = c.contenedores.filter((x) => cats.includes(x));
  for (const cont of correctos) {
    const fresco = nuevoClasificar();
    fresco.activar(ev('recipientes-0'), lat, 'objeto');
    const r = fresco.activar(ev(cont), lat, 'contenedor');
    assert.equal(r.correcto, true, `${cont} deberia ser acierto`);
  }
});

test('test_sin_categorias_suficientes_se_RECHAZA_y_no_se_repite', () => {
  assert.throws(
    () => contenedores({
      categoriasObjetivo: ['cocina'],
      todasLasCategorias: ['cocina', 'alimento'],
      nContenedores: 4,
      fuenteAleatoria: crearFuenteAleatoria(1),
    }),
    (/** @type {unknown} */ err) => {
      assert.ok(err instanceof RangeError);
      assert.match(err.message, /2 categorias distintas/);
      return true;
    },
  );
});

test('test_nContenedores_fuera_de_rango_se_rechaza', () => {
  for (const n of [1, 5, 0, 2.5]) {
    assert.throws(() => contenedores({
      categoriasObjetivo: ['cocina'],
      todasLasCategorias: CATS,
      nContenedores: n,
      fuenteAleatoria: crearFuenteAleatoria(1),
    }), RangeError, `n = ${n}`);
  }
});

// ---------------------------------------------------------------- AC-10

test('test_un_objetivo_sin_categorias_no_puede_ser_objetivo_de_clasificar', () => {
  assert.equal(puedeClasificar({ categories: ['cocina'] }), true);
  assert.equal(puedeClasificar({ categories: [] }), false);
  // Y `contenedores` lo rechaza explicitamente.
  assert.throws(() => contenedores({
    categoriasObjetivo: [],
    todasLasCategorias: CATS,
    nContenedores: 3,
    fuenteAleatoria: crearFuenteAleatoria(1),
  }), /ninguna categoria/);
});

// ---------------------------------------------------------------- determinismo

test('test_los_contenedores_son_deterministas_con_la_misma_semilla', () => {
  const args = {
    categoriasObjetivo: resolver('recipientes-0').categories,
    todasLasCategorias: CATS,
    nContenedores: 3,
  };
  assert.deepStrictEqual(
    contenedores({ ...args, fuenteAleatoria: crearFuenteAleatoria(42) }),
    contenedores({ ...args, fuenteAleatoria: crearFuenteAleatoria(42) }),
  );
});
