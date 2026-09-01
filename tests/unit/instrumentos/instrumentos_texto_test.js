/**
 * Instrumentos de contenido que NO es imagen: rellenar, simbolos, precios y ordenar.
 * Juegos 2, 3, 8 y 9 de la lista.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Elegir, fuenteRellenar, fuenteSimbolos, fuentePrecios,
} from '../../../src/instrumentos/elegir.js';
import { Ordenar } from '../../../src/instrumentos/ordenar.js';
import {
  PALABRAS_CON_HUECO, SIMBOLOS, PRECIOS_2026, PRECIOS_FECHA, FRASES,
  operacion, TIPOS_OPERACION,
} from '../../../src/contenido/provisional.js';
import { crearFuenteAleatoria } from '../../../src/plataforma/aleatoriedad.js';
import { envolverConValidacion } from '../../../src/plataforma/borde-impuro.js';

/** @param {number} s */
const nuevaFuente = (s) => () => ({
  semilla: s, fuenteAleatoria: envolverConValidacion(crearFuenteAleatoria(s)),
});

/** @type {import('../../../src/registro/sesion.js').Latencia} */
const lat = { ms: 400 };

/** @param {string} id @returns {import('../../../src/entrada/adaptador.js').EventoActivacion} */
const ev = (id) => ({ idObjetivo: id, tActivacion: 1, modo: 'tactil', origenTiempo: 'evento' });

/** @param {string} s */
const aNumero = (s) => Number(s.replace(' €', '').replace(',', '.'));

// ---------------------------------------------------------------- las tres fuentes

test('test_las_tres_fuentes_producen_una_ronda_con_la_correcta_dentro', () => {
  const fuentes = [
    fuenteRellenar(PALABRAS_CON_HUECO),
    fuenteSimbolos(SIMBOLOS),
    fuentePrecios(PRECIOS_2026, PRECIOS_FECHA),
  ];
  for (const f of fuentes) {
    for (let s = 1; s <= 200; s++) {
      for (const n of [2, 3, 4, 5, 6]) {
        const r = f.siguiente(n, crearFuenteAleatoria(s), s);
        assert.ok(r.opciones.includes(r.correcta), `${f.etiqueta} s=${s} n=${n}: sin correcta`);
        assert.equal(new Set(r.opciones).size, r.opciones.length, 'opciones repetidas');
        assert.ok(r.opciones.length >= 2 && r.opciones.length <= n);
        assert.ok(r.estimuloTexto.length > 0, 'sin estimulo');
      }
    }
  }
});

test('test_rellenar_presenta_la_palabra_con_hueco', () => {
  // Si mostrara la palabra entera no habria tarea.
  const f = fuenteRellenar(PALABRAS_CON_HUECO);
  for (let s = 1; s <= 50; s++) {
    const r = f.siguiente(4, crearFuenteAleatoria(s), s);
    assert.match(r.estimuloTexto, /_/);
  }
});

test('test_simbolos_muestra_el_simbolo_y_las_opciones_son_palabras', () => {
  const f = fuenteSimbolos(SIMBOLOS);
  const r = f.siguiente(4, crearFuenteAleatoria(3), 3);
  assert.ok(r.estimuloGlifo.length > 0, 'debe haber simbolo');
  for (const o of r.opciones) assert.match(o, /[a-zaeiouñ ]/i);
});

test('test_los_distractores_de_precio_son_del_MISMO_objeto', () => {
  // Un precio de otro producto se descarta sin pensar, y la tarea deja de medir nada.
  const f = fuentePrecios(PRECIOS_2026, PRECIOS_FECHA);
  for (let s = 1; s <= 100; s++) {
    const r = f.siguiente(4, crearFuenteAleatoria(s), s);
    const correcto = aNumero(r.correcta);
    for (const o of r.opciones) {
      const n = aNumero(o);
      assert.ok(
        n >= correcto / 3.5 && n <= correcto * 3.5,
        `s=${s}: ${n} demasiado lejos de ${correcto}`,
      );
    }
  }
});

test('test_precios_lleva_AVISO_de_caducidad_y_las_otras_dos_no', () => {
  // Un precio de hace siete años confunde a un paciente que hace la compra cada semana.
  const f = fuentePrecios(PRECIOS_2026, PRECIOS_FECHA);
  assert.ok(f.aviso !== undefined);
  assert.match(f.aviso, /2026/);
  assert.match(f.aviso, /caducan/);
  assert.equal(fuenteRellenar(PALABRAS_CON_HUECO).aviso, undefined);
  assert.equal(fuenteSimbolos(SIMBOLOS).aviso, undefined);
});

// ---------------------------------------------------------------- Elegir

test('test_elegir_acierta_solo_con_la_opcion_correcta', () => {
  const e = new Elegir({
    t: 60, fuente: fuenteSimbolos(SIMBOLOS), nOpciones: 4, nuevaFuente: nuevaFuente(5),
  });
  const correcta = e.ronda.correcta;
  const mala = /** @type {string} */ (e.ronda.opciones.find((o) => o !== correcta));

  const r1 = e.activar(ev(mala), lat);
  assert.equal(r1.correcto, false);
  assert.equal(r1.avanza, false, 'un fallo no avanza');
  assert.equal(e.intentos.length, 1);

  const r2 = e.activar(ev(correcta), lat);
  assert.equal(r2.correcto, true);
  assert.equal(r2.avanza, true);
  assert.equal(e.tableroNumero, 2);
});

test('test_elegir_expone_forma_de_tablero_para_el_registro', () => {
  const e = new Elegir({
    t: 60, fuente: fuenteRellenar(PALABRAS_CON_HUECO), nOpciones: 4,
    nuevaFuente: nuevaFuente(9),
  });
  const t = e.tablero;
  assert.equal(t.objetivo, e.ronda.correcta);
  assert.equal(t.celdas.length, e.ronda.opciones.length);
  assert.ok(!t.distractores.includes(t.objetivo));
});

// ---------------------------------------------------------------- Ordenar

test('test_ordenar_elige_la_frase_mas_cercana_a_C', () => {
  for (const C of [3, 4, 5, 6]) {
    const o = new Ordenar({ t: 60, frases: FRASES, C, nuevaFuente: nuevaFuente(11) });
    assert.equal(o.frase.correcta.length, C, `C=${C}`);
  }
});

test('test_ordenar_no_presenta_la_frase_ya_ordenada', () => {
  for (let s = 1; s <= 300; s++) {
    const o = new Ordenar({ t: 60, frases: FRASES, C: 5, nuevaFuente: nuevaFuente(s) });
    if (o.frase.correcta.length > 1) {
      assert.notDeepStrictEqual(
        o.frase.mezcladas, o.frase.correcta, `semilla ${s}: la frase venia ordenada`,
      );
    }
  }
});

test('test_ordenar_registra_CADA_palabra_como_un_intento', () => {
  // Registrar solo la frase completa perderia que un paciente acerto cuatro de cinco.
  const o = new Ordenar({ t: 60, frases: FRASES, C: 3, nuevaFuente: nuevaFuente(21) });
  const total = o.frase.correcta.length;
  for (let paso = 0; paso < total; paso++) {
    const p = o.siguientePalabra();
    const celda = /** @type {import('../../../src/instrumentos/busca.js').Estimulo} */ (
      o.celdas().find((c) => c.nombre === p)
    );
    const r = o.activar(ev(celda.id), lat);
    assert.equal(r.correcto, true, `paso ${paso}`);
    assert.equal(o.intentos.length, paso + 1);
  }
  assert.equal(o.tableroNumero, 2, 'la frase completa avanza a la siguiente');
});

test('test_ordenar_un_fallo_no_retrocede_lo_ya_colocado', () => {
  // El pilar 2 prohibe marcar el fallo, y deshacer lo colocado seria marcarlo.
  const o = new Ordenar({ t: 60, frases: FRASES, C: 4, nuevaFuente: nuevaFuente(31) });
  const primera = o.siguientePalabra();
  const c1 = /** @type {any} */ (o.celdas().find((c) => c.nombre === primera));
  o.activar(ev(c1.id), lat);
  assert.equal(o.colocadas.length, 1);

  const siguiente = o.siguientePalabra();
  const mala = /** @type {any} */ (o.celdas().find((c) => c.nombre !== siguiente));
  if (mala !== undefined) {
    const r = o.activar(ev(mala.id), lat);
    assert.equal(r.correcto, false);
    assert.equal(o.colocadas.length, 1, 'no retrocede');
  }
});

test('test_ordenar_las_palabras_colocadas_desaparecen_del_tablero', () => {
  const o = new Ordenar({ t: 60, frases: FRASES, C: 5, nuevaFuente: nuevaFuente(41) });
  const antes = o.celdas().length;
  const p = o.siguientePalabra();
  const c = /** @type {any} */ (o.celdas().find((x) => x.nombre === p));
  o.activar(ev(c.id), lat);
  assert.equal(o.celdas().length, antes - 1);
});

test('test_ordenar_la_frase_en_curso_no_sobrevive_a_la_pausa', () => {
  const o = new Ordenar({ t: 60, frases: FRASES, C: 4, nuevaFuente: nuevaFuente(51) });
  const p = o.siguientePalabra();
  const c = /** @type {any} */ (o.celdas().find((x) => x.nombre === p));
  o.activar(ev(c.id), lat);
  o.limpiarSeleccion();
  assert.deepStrictEqual(o.colocadas, []);
});

// ---------------------------------------------------------------- operaciones

test('test_las_operaciones_de_los_tres_tipos_dan_resultados_validos', () => {
  for (const tipo of TIPOS_OPERACION) {
    for (let s = 1; s <= 2000; s++) {
      const { enunciado, resultado } = operacion(tipo, crearFuenteAleatoria(s));
      assert.ok(Number.isInteger(resultado), `${tipo} s=${s}: ${resultado}`);
      assert.ok(resultado >= 0, `${tipo} s=${s}: negativo en '${enunciado}'`);
      assert.match(enunciado, /[+−×]/);
    }
  }
});

test('test_la_ETIQUETA_no_miente_sobre_el_techo', () => {
  // La etiqueta que lee el terapeuta es una promesa clinica: «sumar y restar hasta 20»
  // significa que NINGUN numero de la operacion pasa de 20.
  //
  // La version anterior sorteaba `a` en [1,19] y `b` en [1,a-1], asi que la suma llegaba a
  // **37**: «19 + 18». Y este test lo dejaba pasar porque solo comprobaba `resultado >= 0`
  // — comprobaba lo que no fallaba.
  //
  // Se comprueban los OPERANDOS y el resultado, no solo el resultado: «25 - 5 = 20» cumple
  // el techo en el resultado y lo rompe en el enunciado.
  /** @type {Record<string, number>} */
  const TECHO = { sumaHasta10: 10, sumaRestaHasta20: 20 };
  for (const [tipo, techo] of Object.entries(TECHO)) {
    for (let s = 1; s <= 2000; s++) {
      const { enunciado, resultado } = operacion(
        /** @type {any} */ (tipo), crearFuenteAleatoria(s),
      );
      assert.ok(resultado <= techo, `${tipo} s=${s}: resultado ${resultado} pasa de ${techo}`);
      for (const m of enunciado.match(/\d+/g) ?? []) {
        assert.ok(
          Number(m) <= techo,
          `${tipo} s=${s}: el operando ${m} de '${enunciado}' pasa de ${techo}`,
        );
      }
    }
  }
});

test('test_las_dos_RAMAS_de_suma_y_resta_aparecen_las_dos', () => {
  // Acotar mal una rama podria dejarla imposible sin que nada fallara.
  const enunciados = [];
  for (let s = 1; s <= 500; s++) {
    enunciados.push(operacion('sumaRestaHasta20', crearFuenteAleatoria(s)).enunciado);
  }
  assert.ok(enunciados.some((e) => e.includes('+')), 'falta la rama de suma');
  assert.ok(enunciados.some((e) => e.includes('−')), 'falta la rama de resta');
});

test('test_el_tipo_de_operacion_es_un_ENUM_no_una_escala', () => {
  // La dificultad aritmetica no es motora ni perceptiva, asi que no cabe en los dos ejes
  // del sistema 4. Un tercer eje es una decision de diseño que nadie ha tomado, y meterla
  // como un escalar llamado `nivel` habria colapsado lo que el pilar 3 protege.
  assert.deepStrictEqual(
    [...TIPOS_OPERACION], ['sumaHasta10', 'sumaRestaHasta20', 'multiplicar'],
  );
  for (const t of TIPOS_OPERACION) assert.equal(typeof t, 'string');
});
