# Hoja de revisión del contenido provisional

> **Generada por `tools/hoja-revision-contenido.js`. No se edita a mano.**
> Para cambiar el contenido, edita `src/contenido/provisional.js` y vuelve a
> ejecutar la herramienta.

## Para quién es esta hoja

Para el terapeuta ocupacional. **Seis** de los nueve juegos usan contenido que escribió
el desarrollador, no un clínico. Ese contenido **es** el estímulo: decide si el ejercicio
mide la capacidad que dice medir.

Marca cada elemento que apruebes. Lo que no esté marcado no se usa con un paciente.

| Familia | Elementos | Juego que la usa | Urgencia |
|---|---|---|---|
| Palabras con hueco | 12 | Rellenar palabras | **ALTA** |
| Símbolos | 12 | Transcribir símbolos | media |
| Precios (2026) | 12 | Precio justo, Comprar | **ALTA — caducan** |
| Frases | 12 | Ordenar palabras | media |
| Tareas del tres en raya | 3 | Tres en raya | media |

---

## 1 · Palabras con hueco — URGENCIA ALTA

El hueco es una **sílaba**, nunca una letra: rellenar una letra es ortografía, que es
otra tarea y otra capacidad.

Las tres preguntas de esta familia:

1. ¿La sílaba que falta es la que hace falta quitar, o hay otra más informativa?
2. ¿Los tres distractores son plausibles **para un hispanohablante con afasia**? Un
   distractor que nadie elegiría convierte cuatro opciones en dos.
3. ¿Alguna palabra es demasiado infrecuente para la población de la consulta?

| ✓ | Palabra | Se presenta | Falta | Distractores | Reconstruye |
|---|---|---|---|---|---|
| ☐ | ventana | `ven_na` | `ta` | `te` `to` `da` | `ventana` |
| ☐ | cuchara | `cu_ara` | `ch` | `ll` `rr` `qu` | `cuchara` |
| ☐ | zapato | `za_to` | `pa` | `ba` `po` `pe` | `zapato` |
| ☐ | camisa | `ca_sa` | `mi` | `me` `ni` `mo` | `camisa` |
| ☐ | botella | `bo_lla` | `te` | `ta` `de` `ti` | `botella` |
| ☐ | manzana | `man_na` | `za` | `sa` `ce` `zo` | `manzana` |
| ☐ | periodico | `pe_dico` | `rió` | `ria` `ro` `reo` | `periódico` |
| ☐ | telefono | `te_fono` | `lé` | `la` `li` `ne` | `teléfono` |
| ☐ | bicicleta | `bici_ta` | `cle` | `cla` `que` `gle` | `bicicleta` |
| ☐ | escalera | `esca_ra` | `le` | `la` `li` `ne` | `escalera` |
| ☐ | cepillo | `ce_llo` | `pi` | `pe` `bi` `po` | `cepillo` |
| ☐ | armario | `ar_rio` | `ma` | `me` `na` `mo` | `armario` |

## 2 · Símbolos

Son símbolos de señalización real, no abstractos: el objetivo es la lectura de
señalización de la vida diaria, que es una habilidad funcional.

Las dos preguntas de esta familia:

1. ¿El glifo se corresponde con la señal que la persona ve **en la calle en España**?
   Varios de estos son emoji, no señales normalizadas. El de escalera (🪜) es una
   escalera de mano, no la señal de escaleras.
2. ¿La palabra es la que usaría el paciente, o la de un cartel oficial?

| ✓ | Glifo | Palabra | Identificador |
|---|---|---|---|
| ☐ | 🚭 | no fumar | `prohibido-fumar` |
| ☐ | 🚪 | salida | `salida` |
| ☐ | 📞 | teléfono | `telefono` |
| ☐ | 🚻 | aseo | `aseo` |
| ☐ | 🛗 | ascensor | `ascensor` |
| ☐ | 🪜 | escalera | `escalera` |
| ☐ | 🅿️ | aparcamiento | `aparcamiento` |
| ☐ | 💊 | farmacia | `farmacia` |
| ☐ | 🚌 | autobús | `autobus` |
| ☐ | 🏥 | hospital | `hospital` |
| ☐ | 📮 | correos | `correo` |
| ☐ | 🚰 | agua potable | `agua` |

## 3 · Precios — URGENCIA ALTA, Y CADUCAN

Precios de supermercado español de **2026**, redondeados. Un precio de hace
siete años confunde a un paciente que hace la compra cada semana, así que esta tabla
tiene fecha de caducidad y hay que revisarla cada año.

Las dos preguntas de esta familia:

1. ¿El precio es el de la zona de la consulta? Varían mucho entre comunidades.
2. ¿Sobra o falta algún artículo de la compra habitual de esta población?

| ✓ | Artículo | Precio | Identificador |
|---|---|---|---|
| ☐ | 🥖 barra de pan | 1,10 € | `barra-pan` |
| ☐ | 🥛 litro de leche | 1,20 € | `leche` |
| ☐ | 🥚 docena de huevos | 2,90 € | `docena-huevos` |
| ☐ | 🥔 kilo de patatas | 1,50 € | `kilo-patatas` |
| ☐ | ☕ café en el bar | 1,60 € | `cafe` |
| ☐ | 📰 periódico | 2,00 € | `periodico` |
| ☐ | 🚌 billete de autobús | 1,50 € | `billete-bus` |
| ☐ | 🍊 kilo de naranjas | 2,20 € | `kilo-naranjas` |
| ☐ | 🍗 pollo entero | 7,50 € | `pollo` |
| ☐ | 🫒 litro de aceite | 8,50 € | `aceite` |
| ☐ | 🍝 paquete de pasta | 1,30 € | `pasta` |
| ☐ | 🧀 cuña de queso | 4,50 € | `queso` |

> **Aviso.** Estos artículos tienen el mismo precio, y en el juego de comprar eso hace
> que el total de la cesta no identifique qué se compró:
>
> - 1,50 € — kilo de patatas, billete de autobús

## 4 · Frases para ordenar

Frases de la vida diaria, en orden correcto. La longitud es la perilla de dificultad,
y encaja con `C` sin inventar una perilla nueva.

Las dos preguntas de esta familia:

1. ¿Cada frase tiene **un solo** orden correcto? Si admite dos, un acierto se registra
   como fallo. El test comprueba que no haya palabras repetidas, que es la causa obvia;
   no puede comprobar que «hoy hace mucho calor» no admita «hace mucho calor hoy».
2. ¿El registro es el que usaría el paciente? Son imperativos, y con algunos pacientes
   un imperativo se lee como una orden.

| ✓ | Palabras | Frase | Identificador |
|---|---|---|---|
| ☐ | 3 | abre la puerta | `f3-1` |
| ☐ | 3 | pon la mesa | `f3-2` |
| ☐ | 3 | bebe el agua | `f3-3` |
| ☐ | 4 | el perro come pan | `f4-1` |
| ☐ | 4 | guarda la ropa limpia | `f4-2` |
| ☐ | 4 | hoy hace mucho calor | `f4-3` |
| ☐ | 5 | voy a comprar el pan | `f5-1` |
| ☐ | 5 | deja las llaves en casa | `f5-2` |
| ☐ | 5 | el autobús llega a tiempo | `f5-3` |
| ☐ | 6 | por la mañana tomo un café | `f6-1` |
| ☐ | 6 | mi hija viene a verme hoy | `f6-2` |
| ☐ | 6 | tengo que ir al médico mañana | `f6-3` |

## 5 · Tareas del tres en raya — el eje de contenido

La dificultad aritmética no es motora ni perceptiva, así que no cabe en los dos ejes del
modelo de dificultad. **Ya tiene sitio: el eje de contenido, sistema 32.** Es ordinal, no
una escala: hay orden pero no distancia, y sobre él no se hace aritmética.

Las tres preguntas de esta familia:

1. ¿Son estas tres las tareas que se trabajan en consulta, o falta alguna?
2. ¿Está bien el ORDEN de dificultad? Hoy es sumar < sumar y restar < multiplicar, y lo
   elegí yo. Con algunos pacientes, restar cuesta más que multiplicar.
3. ¿La etiqueta es la que usaría el terapeuta al hablar con un colega?

> El identificador **no se renombra nunca**: es la clave con la que queda registrado a qué
> jugó un paciente. La etiqueta sí se puede cambiar.

| ✓ | Identificador | Etiqueta que ve el terapeuta | Orden |
|---|---|---|---|
| ☐ | `sumaHasta10` | sumar hasta 10 | 1.º |
| ☐ | `sumaRestaHasta20` | sumar y restar hasta 20 | 2.º |
| ☐ | `multiplicar` | multiplicar | 3.º |

---

## Lo que esta hoja NO pregunta, y hace falta decidir

1. **¿Falta alguna familia de contenido?** Nueve juegos, cinco familias. Si un ejercicio
   que el terapeuta usa en consulta no tiene aquí su contenido, no existe.
2. **¿Cuántos elementos hacen falta por familia?** Doce da poca variedad si un paciente
   viene cada semana: la repetición produce habituación, y la habituación falsea la
   medida. El número que hace falta es clínico, no técnico.
3. **¿Este contenido se puede usar con un paciente real, sin firmar?** La respuesta que
   asume el proyecto es NO.

## Qué se comprueba a máquina, y qué no

| Comprobado | No comprobado |
|---|---|
| La sílaba reconstruye la palabra | Que la sílaba sea la mejor elección |
| El hueco está entre las opciones | Que el distractor sea plausible |
| El hueco tiene dos caracteres o más | Que sea una sílaba de verdad |
| Ninguna frase repite palabra | Que el orden correcto sea único |
| Las frases cubren `C` de 3 a 6 | Que la frase suene natural |
| Los precios son positivos y menores de 100 € | Que el precio sea el real |
| Los identificadores no se repiten | — |

Todo lo comprobado vive en `tests/unit/contenido/contenido_provisional_test.js`.

