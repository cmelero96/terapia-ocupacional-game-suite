/**
 * Sistema 12 — criterios de aceptacion de la presentacion de resultados.
 * Cubre AC-2, AC-4, AC-8 y AC-9. AC-1, AC-3, AC-5 y AC-6 necesitan navegador.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITACION_ESCALA, TEXTO_MOTIVO, textoDeMotivo,
  presentarPrecision, presentarLatencia, presentarDificultadTolerada,
  presentarDificultadTablero, presentarReproduccion,
} from '../../../src/resultados/presentar.js';

/** @param {object} [p] @returns {import('../../../src/registro/sesion.js').Resumen} */
const resumen = (p = {}) => ({
  intentos: 10, aciertos: 8, precision: 0.8, latenciaMedia: 1240, latenciasSinDato: 0,
  tableros: 2, tablerosIncompletos: 0, intentosIncompletos: 0,
  motivoPrecision: undefined, instrumentos: ['busca'],
  porInstrumento: new Map([['busca', { intentos: 10, aciertos: 8, precision: 0.8 }]]),
  motivoLatencia: undefined,
  latenciaPorClase: new Map([['reaccion', { media: 1240, medidas: 10, vias: ['tactil'] }]]),
  ...p,
});

// ---------------------------------------------------------------- AC-1, sin ceros

test('test_precision_sin_intentos_no_es_0_y_dice_el_motivo', () => {
  const p = presentarPrecision(resumen({
    intentos: 0, aciertos: 0, precision: undefined, latenciaMedia: undefined,
  }));
  assert.equal(p.tieneDato, false);
  assert.match(p.valor, /Sin dato/);
  // Ningun 0 como valor: se leeria como "no acerto ninguna".
  assert.doesNotMatch(p.valor, /\b0 %/);
  assert.doesNotMatch(p.valor, /^0$/);
});

test('test_latencia_sin_medidas_no_es_0_y_dice_cuantas_faltaron', () => {
  const p = presentarLatencia(resumen({
    intentos: 40, latenciaMedia: undefined, latenciasSinDato: 40,
  }));
  assert.equal(p.tieneDato, false);
  assert.match(p.valor, /Sin dato/);
  assert.match(p.valor, /40 de 40 sin medida/);
  assert.doesNotMatch(p.valor, /0 ms de media/);
});

test('test_dificultad_tolerada_sin_dato_no_es_0', () => {
  const p = presentarDificultadTolerada(
    { valor: undefined, motivo: 'datosInsuficientes' }, 'perceptivo',
  );
  assert.equal(p.tieneDato, false);
  // Un 0 se leeria como "no tolera ninguna dificultad".
  assert.doesNotMatch(p.valor, /^0/);
  assert.match(p.valor, /Sin dato/);
});

// ---------------------------------------------------------------- AC-2

test('test_TODOS_los_motivos_producen_textos_DISTINTOS', () => {
  // La lista sale de `TEXTO_MOTIVO`, no escrita a mano.
  //
  // La version anterior nombraba CUATRO, y el GDD del sistema 12 tambien. En el codigo habia
  // cinco —`relojRetrocedio` nunca entro en la tabla del documento— y con el eje de
  // instrumentos mezclados son seis. Un recuento escrito a mano se queda obsoleto en silencio,
  // y este llevaba obsoleto desde antes de que yo tocara nada.
  const motivos = Object.keys(TEXTO_MOTIVO);
  assert.ok(motivos.length >= 6, `esperaba 6 o mas motivos, hay ${motivos.length}`);
  const textos = motivos.map((m) => textoDeMotivo(/** @type {any} */ (m)));
  assert.equal(new Set(textos).size, motivos.length, 'todos los textos deben diferir');
  for (const t of textos) {
    // Ni un guion ni "N/A" como unica explicacion.
    assert.ok(t.length > 30, `texto demasiado corto: ${t}`);
    assert.doesNotMatch(t, /^[-–—]$/);
    assert.doesNotMatch(t, /N\/A/);
  }
});

test('test_ningun_motivo_cae_en_el_texto_de_DESCONOCIDO', () => {
  // `textoDeMotivo` no lanza con un motivo desconocido, y hace bien: una pantalla que se rompe
  // al abrir una sesion vieja es peor. Pero eso hace que un motivo sin texto no falle en
  // ningun sitio, y salga como cadena de depuracion. La barrera AC-2c del sistema 14 compara
  // los emisores de `src/` con esta tabla; aqui se comprueba la otra mitad.
  for (const m of Object.keys(TEXTO_MOTIVO)) {
    assert.doesNotMatch(
      textoDeMotivo(/** @type {any} */ (m)), /motivo desconocido/,
      `'${m}' cae en el texto de desconocido`,
    );
  }
  // Y uno que de verdad no existe SI lo hace, sin lanzar.
  assert.match(textoDeMotivo(/** @type {any} */ ('inventado')), /motivo desconocido/);
});

test('test_cada_motivo_dice_que_deberia_hacer_el_terapeuta', () => {
  // Piden acciones distintas: confundirlos le da el consejo equivocado.
  assert.match(TEXTO_MOTIVO['datosInsuficientes'] ?? '', /al menos 5/);
  assert.match(TEXTO_MOTIVO['ejesAcoplados'] ?? '', /Sube el tamaño/);
  assert.match(TEXTO_MOTIVO['ejesMezclados'] ?? '', /un eje por sesion/);
  assert.match(TEXTO_MOTIVO['origenesMezclados'] ?? '', /defecto de software/);
});

test('test_un_motivo_desconocido_no_lanza_y_no_devuelve_un_guion', () => {
  const t = textoDeMotivo('algoNuevo');
  assert.match(t, /Sin dato/);
  assert.match(t, /algoNuevo/, 'debe nombrar el motivo para poder rastrearlo');
});

// ---------------------------------------------------------------- AC-3, AC-4

test('test_la_limitacion_de_escala_viaja_JUNTO_al_numero', () => {
  const p = presentarDificultadTolerada({ valor: 60 }, 'perceptivo');
  assert.equal(p.tieneDato, true);
  assert.equal(p.valor, '60.0');
  // La limitacion es un campo del MISMO objeto, no una nota aparte.
  assert.equal(p.limitacion, LIMITACION_ESCALA);
});

test('test_la_limitacion_dice_que_comparacion_NO_es_valida', () => {
  // Una etiqueta corta como "escala relativa" no transmite que comparacion es invalida, y
  // la invalida es la que un profesional hara sin pensarlo: mirar dos pacientes.
  assert.match(LIMITACION_ESCALA, /NO comparable entre pacientes/);
  assert.match(LIMITACION_ESCALA, /mismo paciente/);
  assert.match(LIMITACION_ESCALA, /no es el doble/);
  assert.ok(LIMITACION_ESCALA.length > 100, 'es larga a proposito');
});

test('test_una_metrica_sin_dato_no_lleva_limitacion_de_escala', () => {
  // No hay numero que limitar.
  const p = presentarDificultadTolerada(
    { valor: undefined, motivo: 'ejesAcoplados' }, 'perceptivo',
  );
  assert.equal(p.limitacion, undefined);
});

// ---------------------------------------------------------------- AC-5

test('test_la_latencia_lleva_SIEMPRE_sobre_cuantas_medidas', () => {
  const p = presentarLatencia(resumen({ intentos: 40, latenciaMedia: 138, latenciasSinDato: 37 }));
  assert.equal(p.tieneDato, true);
  assert.match(p.valor, /138 ms de media/);
  // Los dos numeros en el MISMO texto: separarlos permitiria leer la media sin la muestra.
  assert.match(p.valor, /sobre 3 de 40 medidas/);
});

test('test_la_latencia_lleva_sobre_cuantas_incluso_cuando_no_falta_ninguna', () => {
  const p = presentarLatencia(resumen({ intentos: 10, latenciaMedia: 500, latenciasSinDato: 0 }));
  assert.match(p.valor, /sobre 10 de 10 medidas/);
});

test('test_una_resolucion_de_reloj_no_fiable_se_avisa_junto_a_la_latencia', () => {
  const p = presentarLatencia(
    resumen({ intentos: 10, latenciaMedia: 15, latenciasSinDato: 0 }),
    { resolucionMs: 100, fiableParaPresupuesto: false },
  );
  // Una latencia de 15 ms con una resolucion de 100 ms no significa nada.
  assert.match(p.valor, /resolucion del reloj era de 100 ms/);
  assert.match(p.valor, /no son interpretables/);
});

test('test_una_resolucion_fiable_no_añade_ruido', () => {
  const p = presentarLatencia(
    resumen({ intentos: 10, latenciaMedia: 500, latenciasSinDato: 0 }),
    { resolucionMs: 0.1, fiableParaPresupuesto: true },
  );
  assert.doesNotMatch(p.valor, /Aviso/);
});

// ---------------------------------------------------------------- AC-8

test('test_la_diferencia_entre_pedida_y_efectiva_se_muestra_cuando_existe', () => {
  const p = presentarDificultadTablero({ dm: 48, dp: 40.1, dpPedida: 51.7 });
  assert.match(p.valor, /40\.1/);
  assert.match(p.valor, /se pidio 51\.7/);
  assert.match(p.valor, /el banco no dio/);
});

test('test_sin_diferencia_no_se_menciona_el_banco', () => {
  const p = presentarDificultadTablero({ dm: 48, dp: 40.1, dpPedida: 40.1 });
  assert.doesNotMatch(p.valor, /se pidio/);
  assert.doesNotMatch(p.valor, /banco/);
  assert.match(p.valor, /Motor 48\.0/);
});

test('test_la_dificultad_del_tablero_tambien_lleva_la_limitacion', () => {
  const p = presentarDificultadTablero({ dm: 48, dp: 40.1, dpPedida: 40.1 });
  assert.equal(p.limitacion, LIMITACION_ESCALA);
});

// ---------------------------------------------------------------- AC-9

test('test_los_tres_estados_de_reproduccion_son_distintos', () => {
  const textos = [
    presentarReproduccion('reproducible'),
    presentarReproduccion('reproducibleAproximado', 'v0'),
    presentarReproduccion('noReproducible'),
  ];
  assert.equal(new Set(textos).size, 3);
  // El aproximado NOMBRA la version.
  assert.match(textos[1] ?? '', /era v0/);
  assert.match(textos[2] ?? '', /No reproducible/);
});

// ---------------------------------------------------------------- AC-7

test('test_ningun_texto_de_esta_pantalla_emite_un_juicio', () => {
  // Un juicio automatico sobre una escala sin calibrar es peor que ningun juicio.
  const todos = [
    LIMITACION_ESCALA,
    ...Object.values(TEXTO_MOTIVO),
    presentarPrecision(resumen()).valor,
    presentarLatencia(resumen()).valor,
    presentarDificultadTolerada({ valor: 60 }, 'perceptivo').valor,
    presentarDificultadTablero({ dm: 48, dp: 40.1, dpPedida: 51.7 }).valor,
  ];
  const juicios = [/\bmejora/i, /\bempeora/i, /\bbien\b/i, /\bmal\b/i, /esperado/i, /\benhorabuena/i];
  for (const t of todos) {
    for (const j of juicios) {
      assert.doesNotMatch(t, j, `emite un juicio: "${t}"`);
    }
  }
});
