/**
 * Genera la hoja de revisión del contenido provisional, para el terapeuta.
 *
 * **Por qué existe.** Nueve juegos son jugables y SEIS de ellos usan contenido que escribí
 * yo: palabras con hueco, símbolos, precios, frases y las tareas de aritmética. (Dije
 * "cuatro" en una revisión anterior y estaba mal: `ordenar` usa las frases, `comprar` usa el
 * catálogo de precios, y el tres en raya las tareas.) No soy terapeuta ocupacional,
 * y ese contenido es el estímulo clínico — la parte del producto que decide si un ejercicio
 * mide lo que dice medir. Hasta que alguien con la titulación lo firme, es provisional, y
 * "provisional" tiene que ser algo más que un comentario en un módulo.
 *
 * **Qué hace.** Emite `docs/revision-contenido.md`, una hoja imprimible con TODO el
 * contenido, una casilla por elemento, y las preguntas concretas de cada familia. La
 * revisión de las sílabas es la urgente: una sílaba mal elegida da una palabra que no
 * existe, y eso no lo caza ningún test más allá de la reconstrucción.
 *
 * **Corolario de ADR-0003.** La salida se confirma en git como archivo estático. Nada de lo
 * que se sirve depende de que esta herramienta se haya ejecutado.
 *
 * Uso:  node tools/hoja-revision-contenido.js
 *       node tools/hoja-revision-contenido.js --comprobar   (para CI)
 *
 * `--comprobar` no escribe: falla si la hoja confirmada en git no coincide con el
 * contenido. Sin esa puerta, el terapeuta revisaria una hoja obsoleta —justo el fallo que
 * el corolario de ADR-0003 intenta evitar— y aprobaria palabras que ya no se usan.
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import {
  PALABRAS_CON_HUECO, SIMBOLOS, PRECIOS_2026, PRECIOS_FECHA, FRASES,
  TIPOS_OPERACION, ETIQUETA_OPERACION,
} from '../src/contenido/provisional.js';

/** @param {string} s */
const sinTilde = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Comillas invertidas para código en Markdown, sin pelearse con el intérprete. */
const T = String.fromCharCode(96);
/** @param {string} s */
const cod = (s) => `${T}${s}${T}`;

/** @type {string[]} */
const L = [];
/** @param {...string} lineas */
const w = (...lineas) => { L.push(...lineas); };

w(
  '# Hoja de revisión del contenido provisional',
  '',
  `> **Generada por ${cod('tools/hoja-revision-contenido.js')}. No se edita a mano.**`,
  `> Para cambiar el contenido, edita ${cod('src/contenido/provisional.js')} y vuelve a`,
  '> ejecutar la herramienta.',
  '',
  '## Para quién es esta hoja',
  '',
  'Para el terapeuta ocupacional. **Seis** de los nueve juegos usan contenido que escribió',
  'el desarrollador, no un clínico. Ese contenido **es** el estímulo: decide si el ejercicio',
  'mide la capacidad que dice medir.',
  '',
  'Marca cada elemento que apruebes. Lo que no esté marcado no se usa con un paciente.',
  '',
  '| Familia | Elementos | Juego que la usa | Urgencia |',
  '|---|---|---|---|',
  `| Palabras con hueco | ${PALABRAS_CON_HUECO.length} | Rellenar palabras | **ALTA** |`,
  `| Símbolos | ${SIMBOLOS.length} | Transcribir símbolos | media |`,
  `| Precios (${PRECIOS_FECHA}) | ${PRECIOS_2026.length} | Precio justo, Comprar | **ALTA — caducan** |`,
  `| Frases | ${FRASES.length} | Ordenar palabras | media |`,
  `| Tareas del tres en raya | ${TIPOS_OPERACION.length} | Tres en raya | media |`,
  '',
  '---',
  '',
  '## 1 · Palabras con hueco — URGENCIA ALTA',
  '',
  'El hueco es una **sílaba**, nunca una letra: rellenar una letra es ortografía, que es',
  'otra tarea y otra capacidad.',
  '',
  'Las tres preguntas de esta familia:',
  '',
  '1. ¿La sílaba que falta es la que hace falta quitar, o hay otra más informativa?',
  '2. ¿Los tres distractores son plausibles **para un hispanohablante con afasia**? Un',
  '   distractor que nadie elegiría convierte cuatro opciones en dos.',
  '3. ¿Alguna palabra es demasiado infrecuente para la población de la consulta?',
  '',
  '| ✓ | Palabra | Se presenta | Falta | Distractores | Reconstruye |',
  '|---|---|---|---|---|---|',
);

for (const p of PALABRAS_CON_HUECO) {
  const re = p.palabra.replace('_', p.hueco);
  const ok = sinTilde(re) === p.id ? cod(re) : `**MAL: da ${cod(re)}**`;
  const distractores = p.opciones.filter((o) => o !== p.hueco).map(cod).join(' ');
  w(`| ☐ | ${p.id} | ${cod(p.palabra)} | ${cod(p.hueco)} | ${distractores} | ${ok} |`);
}

w(
  '',
  '## 2 · Símbolos',
  '',
  'Son símbolos de señalización real, no abstractos: el objetivo es la lectura de',
  'señalización de la vida diaria, que es una habilidad funcional.',
  '',
  'Las dos preguntas de esta familia:',
  '',
  '1. ¿El glifo se corresponde con la señal que la persona ve **en la calle en España**?',
  '   Varios de estos son emoji, no señales normalizadas. El de escalera (🪜) es una',
  '   escalera de mano, no la señal de escaleras.',
  '2. ¿La palabra es la que usaría el paciente, o la de un cartel oficial?',
  '',
  '| ✓ | Glifo | Palabra | Identificador |',
  '|---|---|---|---|',
);

for (const s of SIMBOLOS) w(`| ☐ | ${s.simbolo} | ${s.palabra} | ${cod(s.id)} |`);

w(
  '',
  '## 3 · Precios — URGENCIA ALTA, Y CADUCAN',
  '',
  `Precios de supermercado español de **${PRECIOS_FECHA}**, redondeados. Un precio de hace`,
  'siete años confunde a un paciente que hace la compra cada semana, así que esta tabla',
  'tiene fecha de caducidad y hay que revisarla cada año.',
  '',
  'Las dos preguntas de esta familia:',
  '',
  '1. ¿El precio es el de la zona de la consulta? Varían mucho entre comunidades.',
  '2. ¿Sobra o falta algún artículo de la compra habitual de esta población?',
  '',
  '| ✓ | Artículo | Precio | Identificador |',
  '|---|---|---|---|',
);

for (const p of PRECIOS_2026) {
  const euros = p.euros.toFixed(2).replace('.', ',');
  w(`| ☐ | ${p.glifo} ${p.nombre} | ${euros} € | ${cod(p.id)} |`);
}

/** @type {Map<string, string[]>} */
const porPrecio = new Map();
for (const p of PRECIOS_2026) {
  const k = p.euros.toFixed(2);
  porPrecio.set(k, [...(porPrecio.get(k) ?? []), p.nombre]);
}
const iguales = [...porPrecio.entries()].filter(([, v]) => v.length > 1);
if (iguales.length > 0) {
  w(
    '',
    '> **Aviso.** Estos artículos tienen el mismo precio, y en el juego de comprar eso hace',
    '> que el total de la cesta no identifique qué se compró:',
    '>',
  );
  for (const [k, v] of iguales) w(`> - ${k.replace('.', ',')} € — ${v.join(', ')}`);
}

w(
  '',
  '## 4 · Frases para ordenar',
  '',
  'Frases de la vida diaria, en orden correcto. La longitud es la perilla de dificultad,',
  `y encaja con ${cod('C')} sin inventar una perilla nueva.`,
  '',
  'Las dos preguntas de esta familia:',
  '',
  '1. ¿Cada frase tiene **un solo** orden correcto? Si admite dos, un acierto se registra',
  '   como fallo. El test comprueba que no haya palabras repetidas, que es la causa obvia;',
  '   no puede comprobar que «hoy hace mucho calor» no admita «hace mucho calor hoy».',
  '2. ¿El registro es el que usaría el paciente? Son imperativos, y con algunos pacientes',
  '   un imperativo se lee como una orden.',
  '',
  '| ✓ | Palabras | Frase | Identificador |',
  '|---|---|---|---|',
);

for (const f of FRASES) {
  w(`| ☐ | ${f.palabras.length} | ${f.palabras.join(' ')} | ${cod(f.id)} |`);
}

w(
  '',
  '## 5 · Tareas del tres en raya — el eje de contenido',
  '',
  'La dificultad aritmética no es motora ni perceptiva, así que no cabe en los dos ejes del',
  'modelo de dificultad. **Ya tiene sitio: el eje de contenido, sistema 32.** Es ordinal, no',
  'una escala: hay orden pero no distancia, y sobre él no se hace aritmética.',
  '',
  'Las tres preguntas de esta familia:',
  '',
  '1. ¿Son estas tres las tareas que se trabajan en consulta, o falta alguna?',
  '2. ¿Está bien el ORDEN de dificultad? Hoy es sumar < sumar y restar < multiplicar, y lo',
  '   elegí yo. Con algunos pacientes, restar cuesta más que multiplicar.',
  '3. ¿La etiqueta es la que usaría el terapeuta al hablar con un colega?',
  '',
  '> El identificador **no se renombra nunca**: es la clave con la que queda registrado a qué',
  '> jugó un paciente. La etiqueta sí se puede cambiar.',
  '',
  '| ✓ | Identificador | Etiqueta que ve el terapeuta | Orden |',
  '|---|---|---|---|',
);

TIPOS_OPERACION.forEach((t, i) => {
  w(`| ☐ | ${cod(t)} | ${ETIQUETA_OPERACION[t]} | ${i + 1}.º |`);
});

w(
  '',
  '---',
  '',
  '## Lo que esta hoja NO pregunta, y hace falta decidir',
  '',
  '1. **¿Falta alguna familia de contenido?** Nueve juegos, cinco familias. Si un ejercicio',
  '   que el terapeuta usa en consulta no tiene aquí su contenido, no existe.',
  '2. **¿Cuántos elementos hacen falta por familia?** Doce da poca variedad si un paciente',
  '   viene cada semana: la repetición produce habituación, y la habituación falsea la',
  '   medida. El número que hace falta es clínico, no técnico.',
  '3. **¿Este contenido se puede usar con un paciente real, sin firmar?** La respuesta que',
  '   asume el proyecto es NO.',
  '',
  '## Qué se comprueba a máquina, y qué no',
  '',
  '| Comprobado | No comprobado |',
  '|---|---|',
  '| La sílaba reconstruye la palabra | Que la sílaba sea la mejor elección |',
  '| El hueco está entre las opciones | Que el distractor sea plausible |',
  '| El hueco tiene dos caracteres o más | Que sea una sílaba de verdad |',
  '| Ninguna frase repite palabra | Que el orden correcto sea único |',
  `| Las frases cubren ${cod('C')} de 3 a 6 | Que la frase suene natural |`,
  '| Los precios son positivos y menores de 100 € | Que el precio sea el real |',
  '| Los identificadores no se repiten | — |',
  '',
  `Todo lo comprobado vive en ${cod('tests/unit/contenido/contenido_provisional_test.js')}.`,
  '',
);

const salida = 'docs/revision-contenido.md';
const SALTO = String.fromCharCode(10);
const texto = L.join(SALTO) + SALTO;

if (process.argv.includes('--comprobar')) {
  if (!existsSync(salida)) {
    console.error(`FALLO — ${salida} no existe. Ejecuta: npm run revision`);
    process.exit(1);
  }
  if (readFileSync(salida, 'utf-8') !== texto) {
    console.error(`FALLO — ${salida} no coincide con src/contenido/provisional.js.`);
    console.error('        El terapeuta revisaria una hoja obsoleta.');
    console.error('        Ejecuta: npm run revision');
    process.exit(1);
  }
  console.log(`OK — ${salida} al dia (${L.length} lineas)`);
  process.exit(0);
}

writeFileSync(salida, texto, 'utf-8');
console.log(`Escrito ${salida} — ${L.length} lineas`);
console.log(`  palabras ${PALABRAS_CON_HUECO.length} · simbolos ${SIMBOLOS.length}`
  + ` · precios ${PRECIOS_2026.length} · frases ${FRASES.length}`);
if (iguales.length > 0) console.log(`  AVISO: ${iguales.length} precio(s) duplicado(s)`);
