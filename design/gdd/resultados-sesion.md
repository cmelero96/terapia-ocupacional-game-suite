# Pantalla de resultados de sesión

> **Status**: In Design
> **Author**: Carlos + `ux-designer`
> **Last Updated**: 2026-08-26
> **Sistema**: #12 del índice · UI · MVP · capa Presentation · esfuerzo **M**
> **Implements Pillar**: **2 — el error se mide, no se muestra.** Este sistema es la mitad
> que se muestra, y solo al terapeuta

## Overview

Cierra el bucle del pilar 2: **el terapeuta ve la medición que el paciente no vio.**

Y es donde aterriza el encargo que el sistema 4 lleva arrastrando desde que se escribió, y
que ningún documento posterior ha cumplido:

> `dm` y `dp` son **escalas ordinales defendibles, no medidas calibradas**. Comparar un
> paciente consigo mismo a lo largo del tiempo es legítimo; comparar dos pacientes
> distintos, o afirmar que `dp = 60` es "el doble de difícil" que `dp = 30`, **no lo es**.
> Esa limitación tiene que llegar hasta la pantalla, no quedarse en el GDD.

**Este es el sistema donde eso se cumple o se rompe.** Un número en pantalla sin su
limitación al lado se lee como si midiera algo absoluto, y nueve de las trece constantes
del proyecto no tienen validación empírica.

## Player Fantasy

**Del terapeuta: "puedo mirar qué pasó sin haber estado mirando".** Durante la sesión su
atención está en la persona.

Y una segunda, más incómoda y más importante: **"sé qué NO me está diciendo esta
pantalla"**. Un profesional que sobreinterpreta un número por confiar en él más de lo que
merece toma una decisión clínica peor que si no tuviera el número.

**Del paciente: no ver esta pantalla nunca.** Vive en el ámbito del marco, detrás de la
frontera de modo del sistema 11.

## Detailed Rules

### Core Rules

1. **Esta pantalla vive detrás de la frontera de modo.** Mismo ámbito que el panel: el
   paciente no llega a ella. No es una pantalla de "fin de partida".
2. **Nunca se muestra un 0 por ausencia de datos.** Cuando una métrica es `undefined`, la
   pantalla dice **el motivo**, no un guion, no un cero, no "N/A".

   Cada motivo pide una acción distinta del terapeuta, **y ésa es la razón de que sean
   varios**: colapsarlos en un «sin dato» genérico le quitaría lo único que puede usar.

   | Motivo | Qué se le dice | Qué debería hacer |
   |---|---|---|
   | `datosInsuficientes` | *"Faltan intentos: hacen falta al menos 5 en un mismo nivel."* | Más sesiones, o menos variación |
   | `ejesAcoplados` | *"Con objetivos por debajo de 44 px, el error de gesto y el de búsqueda no se pueden separar."* | Subir `t` si quiere medir el eje perceptivo |
   | `ejesMezclados` | *"Se movieron los dos ejes en la misma sesión."* | Mover un eje por sesión |
   | `instrumentosMezclados` | *"Hay varios ejercicios distintos y su precisión no se puede promediar."* | Mirar el desglose por ejercicio |
   | `origenesMezclados` | *"Fallo de medición de tiempo."* | Es un defecto de software: avisar |
   | `relojRetrocedio` | *"El reloj retrocedió durante la medición."* | Es un defecto del entorno: avisar |

   > **Este documento decía «los cuatro motivos» y llevaba obsoleto desde antes de la
   > revisión cruzada.** `relojRetrocedio` existía en el código y nunca entró en la tabla; con
   > `instrumentosMezclados` son seis. Lo encontró el repaso de criterios cruzados del
   > 2026-09-02, que es lo que el pase de consistencia había dejado sin cubrir.
   >
   > **No se arregla contando otra vez.** Un recuento escrito a mano se vuelve a quedar
   > obsoleto: el test deriva ahora la lista de `TEXTO_MOTIVO`, y la barrera AC-2c del sistema
   > 14 compara los motivos que `src/` emite con los que tienen texto. Un motivo sin texto
   > sale en la pantalla del terapeuta como «motivo desconocido», y eso no fallaba en ningún
   > sitio.

   Un 0 se leería como *"no acertó ninguna"* o *"no tolera ninguna dificultad"* — datos
   clínicos plausibles y devastadores. Es la cuarta aparición del patrón prohibido.
3. **La limitación de escala se muestra JUNTO a `dm` y `dp`, no en una nota al pie.**

   No en un pie de página, no en un icono de información, no en un desplegable. **Al lado
   del número.** Un número sin su limitación adyacente es un número que se va a
   sobreinterpretar.

   Y la frase dice las dos cosas: qué comparación es válida y cuál no.
4. **`latenciasSinDato` se muestra SIEMPRE junto a la latencia media.** Incluso cuando es 0.

   Sin ese segundo número, una media calculada sobre 3 de 40 latencias tiene el mismo
   aspecto que una calculada sobre 40. Es el encargo del sistema 9.
5. **La diferencia entre dificultad pedida y efectiva se muestra cuando existe.**

   Significa que el banco no daba para la configuración puesta, y el terapeuta necesita
   saberlo **antes** de interpretar el resultado. Encargo del sistema 8.
6. **Nada de esta pantalla emite un juicio.** No hay "bien", "mejorando", "por debajo de lo
   esperado", ni flechas verdes. Se muestran números y su procedencia; la interpretación es
   del profesional.

   Es el pilar 2 aplicado al terapeuta, no solo al paciente: un juicio automático sobre una
   escala sin calibrar es peor que ningún juicio.
7. **Cada tablero dice si es reproducible.** `reproducible`, `reproducibleAproximado` con la
   versión anotada, o `noReproducible`. Encargo del sistema 9, y en el Nivel 0 casi siempre
   será reproducible porque nada sobrevive a la recarga.

### Qué NO es de este sistema

| No es de aquí | De quién es |
|---|---|
| Calcular las métricas | Sistema 9 |
| Guardarlas | Sistema 18. **Fuera del primer hito** |
| Comparar sesiones a lo largo del tiempo | Sistema 20. Fuera del primer hito |
| Recomendar una configuración | Sistema 15, y **no recomienda nada** sin validar |
| El aspecto del panel | Sistema 11, y comparte estilos con él |

## Formulas

### F1 — `presentar(resumen, metricas)`: de dato a texto

> Excepción declarada: el dominio es una tabla de formateo, no una relación numérica.

| Dato | Con valor | Sin valor |
|---|---|---|
| `precision` | `"80 % — 8 de 10 activaciones"` | `"Sin dato: no hubo ninguna activación."` |
| `latenciaMedia` | `"1240 ms de media, sobre 37 de 40 medidas"` | `"Sin dato: ninguna latencia se pudo medir."` |
| `dificultadTolerada` | `"60,0 en el eje perceptivo"` **más la limitación** | El motivo de la regla 2 |
| `dp` contra `dpPedida` | `"40,1 (se pidió 51,7)"` cuando difieren | — |

**El orden de los dos números de la latencia no es intercambiable**: primero la media,
inmediatamente después sobre cuántas medidas se calculó. Separarlos permite leer la primera
sin la segunda.

### F2 — `frasesDeLimitacion(metrica)`

```
Para dm y dp:
  "Escala ordinal, sin calibrar. Comparable con este mismo paciente a lo largo del
   tiempo; NO comparable entre pacientes, y un 60 no es el doble de difícil que un 30."
```

Es una frase larga a propósito. Una etiqueta corta —"escala relativa"— no transmite qué
comparación es inválida, y la comparación inválida es la que un profesional hará sin
pensarlo: mirar dos pacientes.

## Edge Cases

- **Sesión con cero tableros**: se muestra *"La sesión no llegó a empezar"*. Ninguna métrica,
  ningún cero.
- **Sesión con tableros pero cero activaciones**: `precision` sin dato con su motivo, y el
  número de tableros presentados sí se muestra.
- **Todas las latencias `undefined`**: `latenciaMedia` sin dato, y `latenciasSinDato` igual
  al total de intentos. Los dos números juntos cuentan la historia completa.
- **`t < 44` en la sesión**: la métrica del eje perceptivo sale con motivo `ejesAcoplados` y
  **la del eje motor sí se calcula**. La pantalla lo distingue.
- **Un id que el manifiesto ya no conoce**: se muestra *"estímulo desconocido"* con el id.
  Nunca se oculta: ocultarlo perdería la trazabilidad de qué vio el paciente.
- **La resolución del reloj no era fiable**: se muestra un aviso junto a la latencia, con el
  valor medido. Una latencia de 0 ms con una resolución de 100 ms no significa lo mismo que
  con una de 0,1 ms.

## Dependencies

**De entrada:** 9 (dura), 4 (dura, para las escalas), 11 (dura, la frontera), 2 (dura).

**Dependen de este:** ninguno en el primer hito. El 20 cuando llegue.

**Actualizado el 2026-09-01.** Dos entradas nuevas, y las dos son limitaciones que viajan
junto al número en lugar de en un texto aparte:

- **`incompleto`** (bloqueante S4): la precisión dice cuántos intentos vienen de tableros sin
  terminar, y **en qué dirección** sesgan — más baja que la real, porque truncar un tablero
  quita el acierto que lo habría cerrado.
- **`contenido`** (sistema 32): cuando la sesión tiene más de una variante, se dice que los
  números de variantes distintas no se suman.

## Tuning Knobs

**Ninguna.** Una pantalla de resultados con perillas sería una pantalla que se puede
configurar para decir lo que uno quiere oír.

## Visual/Audio Requirements

| Elemento | Requisito |
|---|---|
| Ámbito | `.frame-root`. **Nunca** tokens del tablero |
| Métricas sin dato | Mismo peso tipográfico que las que tienen dato. No atenuadas |
| Limitación de escala | **Adyacente** al número, no en un pie |
| Juicios | **Ninguno.** Sin colores de "bien" y "mal", sin flechas |
| Audio | Ninguno |

**Que una métrica sin dato no se atenúe es deliberado.** Atenuarla la haría parecer menos
importante que las que sí tienen dato, y a menudo es más importante: *"no se pudo medir"*
es información clínica.

## UI Requirements

1. **Se llega desde el panel**, no desde la pantalla del paciente.
2. **Un solo desplazamiento vertical.** Si hay que navegar entre pestañas para ver una
   sesión, no se va a mirar.
3. **El número de intentos siempre visible junto a cualquier proporción.** Un 80 % de 5
   intentos y un 80 % de 200 no son el mismo dato.

## Acceptance Criteria

**AC-1 — Ninguna métrica sin dato se muestra como 0** · Integration (Playwright) · **BLOCKING**
**DADO** una sesión sin ninguna activación,
**CUANDO** se abre la pantalla de resultados,
**ENTONCES** ningún elemento de métrica contiene `"0 %"`, `"0 ms"` ni `"0"` como valor, y
cada una muestra **su motivo**.

**AC-2 — TODOS los motivos son distinguibles en pantalla** · Unit · **BLOCKING**
*Decía «los cuatro» y son seis. El recuento no se escribe a mano: la lista se deriva de
`TEXTO_MOTIVO`, y la barrera AC-2c comprueba que no falte ninguno.*
**DADO** cada motivo declarado,
**ENTONCES** cada uno produce un texto **distinto**, y ninguno contiene un guion ni "N/A"
como única explicación.
*Piden acciones distintas del terapeuta: confundirlos le da el consejo equivocado.*

**AC-3 — La limitación de escala es ADYACENTE al número** · Integration (Playwright) · **BLOCKING**
**DADO** una sesión con `dificultadTolerada` calculada,
**CUANDO** se inspecciona el DOM,
**ENTONCES** el texto de la limitación está **dentro del mismo elemento contenedor** que el
número, y no en un pie de página, un `title`, ni un elemento colapsado.
*Un número sin su limitación adyacente es un número que se va a sobreinterpretar. Y nueve de
las trece constantes de este proyecto no tienen validación empírica.*

**AC-4 — La limitación dice qué comparación NO es válida** · Unit · **BLOCKING**
**DADO** la frase de limitación de `dp`,
**ENTONCES** menciona explícitamente que **no** es comparable entre pacientes.
*Una etiqueta corta como "escala relativa" no transmite qué comparación es inválida, y la
inválida es la que un profesional hará sin pensarlo.*

**AC-5 — `latenciasSinDato` se muestra siempre, junto a la media** · Integration (Playwright) · **BLOCKING**
**DADO** una sesión con 40 intentos de los que 37 no dieron latencia,
**ENTONCES** la pantalla muestra la media **y** "sobre 3 de 40", en el mismo elemento.

**AC-6 — Ninguna métrica sin dato aparece atenuada** · Integration (Playwright) · **BLOCKING**
**DADO** una métrica con dato y otra sin dato,
**CUANDO** se comparan `opacity` y `color` calculados,
**ENTONCES** son **iguales**.
*"No se pudo medir" es información clínica, y a menudo más importante que el número.*

**AC-7 — La pantalla no emite ningún juicio** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el código de esta pantalla,
**CUANDO** se buscan literales de juicio — `mejora`, `empeora`, `bien`, `mal`, `esperado`,
`objetivo cumplido` —,
**ENTONCES** no aparece ninguno.
*Un juicio automático sobre una escala sin calibrar es peor que ningún juicio.*

**AC-8 — La diferencia entre pedida y efectiva se muestra cuando existe** · Unit · **BLOCKING**
**DADO** un tablero con `dp = 40,1` y `dpPedida = 51,7`,
**ENTONCES** la pantalla muestra las dos, y dice que el banco no dio para lo pedido.

**AC-9 — El estado de reproducción se muestra por tablero** · Unit · **BLOCKING**
**DADO** tres tableros, uno de cada estado,
**ENTONCES** los tres textos son distintos, y el aproximado **nombra la versión**.

**AC-10 — El paciente no llega a esta pantalla** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de `src/`,
**ENTONCES** ningún módulo del ámbito del paciente importa de `src/resultados/`.

## Open Questions

| Pregunta | Quién | Cuándo |
|---|---|---|
| ¿El terapeuta quiere ver esto durante la sesión o al final? | El colaborador | Cambia si es una pestaña del panel o una pantalla aparte |
| ¿La frase de limitación se lee o se ignora? | Observación | Si se ignora, el problema no es la frase: es publicar el número |
