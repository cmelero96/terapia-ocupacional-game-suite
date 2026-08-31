# Instrumentos: Clasificar por categorías, y Denominación

> **Status**: In Design
> **Author**: Carlos + `gameplay-programmer`, `game-designer`
> **Last Updated**: 2026-08-26
> **Sistemas**: **#21** (clasificar) y **#24** (denominación) del índice · Instrumento ·
> adelantados de Alpha al **primer hito** · esfuerzo **S** los dos
> **Implements Pillar**: El 4 — el segundo y el tercer instrumento salen baratos

## Overview

**"Que se puedan iniciar múltiples juegos" es la definición de "pulida" del colaborador.**
Estos son el segundo y el tercero, y se eligieron **por coste marginal, no por interés**.

Aquí se comprueba la apuesta que el índice de sistemas declaró al principio: *"la mayoría
de los sistemas del MVP no son el juego, son la infraestructura que hace que el segundo,
tercer y cuarto instrumento salgan baratos"*.

### El coste marginal, contado

| Pieza | Busca (10) | Clasificar (21) | Denominación (24) |
|---|---|---|---|
| Manifiesto, tokens, inyección, dificultad | Reutiliza | **Reutiliza** | **Reutiliza** |
| Capa de entrada, estímulo reducido | Reutiliza | **Reutiliza** | **Reutiliza** |
| Generación de tableros | Reutiliza | **Reutiliza** | **Reutiliza** |
| Registro, resultados, panel | Reutiliza | **Reutiliza** | **Reutiliza** |
| Regla de acierto | Propia | **Propia** | **Propia** |
| Zona de referencia | Glifo + nombre | **Contenedores de categoría** | **Solo el nombre** |
| Estado de selección | No tiene | **Nuevo: dos toques** | No tiene |

**Denominación es Busca con el objetivo presentado como palabra en lugar de como imagen.**
Su coste marginal es casi cero, y la capacidad que entrena es completamente distinta:
acceso léxico (A8 del sistema 15) en lugar de atención selectiva (A5) y discriminación
visual (A6).

**Clasificar es el único que añade algo de verdad:** el estado de selección de dos toques.

## Player Fantasy

**Clasificar: "esto va aquí".** La satisfacción de ordenar, que es distinta de la de
encontrar. Y es la que más se parece a una tarea de la vida diaria — poner la compra en su
sitio — así que es la que un terapeuta puede justificar más fácil ante un paciente adulto.

**Denominación: "sé cómo se llama".** Reconocer el nombre de un objeto. Con una diferencia
importante: **el paciente no escribe ni habla.** Se le da la palabra y busca el objeto, no
al revés.

## Detailed Rules

### Comunes a los dos

1. **Los dos emiten y consumen exactamente lo mismo que Busca.** Reciben
   `EventoActivacion`, escriben en el registro, no leen de él, y no saben qué modo de
   entrada se usó.
2. **Los dos comparten la regla del pilar 2:** activar mal no hace **nada** visible, y el
   acuse de recibo es idéntico en los dos casos.
3. **Ninguno tiene condición de fin.** La sesión termina cuando una persona lo dice.

### Sistema 24 — Denominación

4. **La zona de referencia muestra SOLO el nombre, sin el glifo.** Es la única diferencia
   funcional con Busca, y es la que cambia la capacidad que se entrena: sin la imagen de
   referencia, el paciente tiene que recuperar la forma a partir de la palabra.
5. **La perilla de similitud visual sigue funcionando, y ahora significa otra cosa.** Con
   `sv` alto, el paciente tiene que distinguir entre objetos de forma parecida **partiendo
   de una palabra**, lo que carga acceso léxico y no solo discriminación visual.
6. **Requiere lectura, y eso hay que declararlo.** La limitación B6 del sistema 15
   —comprensión verbal limitada— hace este instrumento inadecuado para parte de la
   población. **No se adapta: se declara.** Un instrumento que exige leer no se puede hacer
   accesible a quien no lee sin convertirse en otro instrumento.

   El panel lo dice cuando se elige el instrumento. Es la primera vez en el proyecto que un
   instrumento **no sirve** para parte de la población, y esconderlo sería peor.

### Sistema 21 — Clasificar por categorías

7. **Dos toques, nunca arrastre.** Seleccionar el objeto, después el contenedor de destino.
   Es lo que el patrón prohibido del proyecto exige: *"el arrastre está descartado por
   completo: se implementa con dos toques"*.
8. **La selección es visible, reversible y no es un acierto ni un fallo.**

   | Estado | Qué pasa |
   |---|---|
   | Nada seleccionado | Activar un objeto lo **selecciona**. No se registra nada |
   | Objeto seleccionado | Activar **el mismo** objeto lo deselecciona. No se registra nada |
   | Objeto seleccionado | Activar **otro** objeto cambia la selección. No se registra nada |
   | Objeto seleccionado | Activar un **contenedor** registra el intento |

   **Solo la segunda activación registra.** Un paciente que selecciona y se lo piensa no
   genera datos, igual que un aborto de puntero en el sistema 5.
9. **El indicador de selección NO es el foco.** El foco lo usa el barrido por pulsador para
   recorrer, y la selección es un estado distinto que sobrevive al movimiento del foco.

   Dos indicadores visuales distintos, y esta es la única decisión de este documento que
   podría salir mal: si se parecen, el paciente que usa barrido no sabrá qué está mirando.
   **Se resuelve con forma, no con color** — la selección lleva un indicador de forma
   además del color, para que sobreviva en escala de grises.
10. **Los contenedores de destino son categorías del manifiesto**, y son activables como
    cualquier objeto: mismo tamaño mínimo, mismo acuse de recibo, mismo tratamiento en el
    barrido.
11. **Dos contenedores como mínimo, cuatro como máximo.** Con uno no hay clasificación; con
    más de cuatro, la pantalla no cabe junto al tablero al tamaño de objetivo del rango
    clínico.

    **Es un límite nuevo y es una perilla nueva**, la primera que un instrumento añade:
    `nContenedores`. Vive en el ámbito del ejercicio, junto a las cuatro del sistema 4.

### Qué NO es de estos sistemas

| No es de aquí | De quién es |
|---|---|
| Qué elementos van en el tablero | Sistema 8 |
| Cómo se activa algo | Sistema 5 |
| Qué categorías existen | Sistema 1, campo `categories[]` |
| Qué instrumento le va a qué paciente | Sistema 15, y no recomienda nada sin validar |
| Elegir el instrumento en pantalla | Sistema 11 |

## Formulas

### F1 — `esAcierto` de cada instrumento

> Excepción declarada: son tres reglas de una línea, no relaciones numéricas.

```
Busca (10):        activado == objetivo
Denominación (24): activado == objetivo            ← idéntica a Busca
Clasificar (21):   categorias(seleccionado) ∋ contenedorActivado
```

**La de denominación es literalmente la misma que la de Busca**, y eso es la prueba de que
el coste marginal es cero: lo que cambia es la presentación del objetivo, no la lógica.

**La de clasificar usa `categories[]` del manifiesto**, que ya existe y es de cardinalidad
múltiple. Un tomate está en `alimento` y en `cocina`: si los dos contenedores están en
pantalla, **las dos respuestas son correctas**, y eso no es un defecto — es lo que hace la
tarea interesante y lo que el campo múltiple del sistema 1 permitía desde el principio.

### F2 — `contenedores(objetivo, nContenedores, fuente)`

```
correcto  = una categoría del objetivo, elegida con la fuente inyectada
incorrectos = nContenedores − 1 categorías que el objetivo NO tiene
salida = barajar([correcto, ...incorrectos], fuente)
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `nContenedores` | int, **perilla clínica nueva** | [2, 4] · **3** | Contenedores en pantalla |
| salida | string[] | longitud `nContenedores` | Nombres de categoría, barajados |

**Al menos uno es siempre correcto**, por construcción. Un tablero sin respuesta correcta
sería un ejercicio imposible, y el paciente no tiene forma de saber que lo es.

**Si el banco no tiene suficientes categorías distintas**, se rechaza igual que el sistema 8
rechaza una `C` mayor que el banco. No se rellena con repeticiones: dos contenedores con la
misma etiqueta harían la tarea ambigua sin decirlo.

## Edge Cases

- **Si el objetivo no tiene ninguna categoría**: no puede ser objetivo de clasificar. Se
  excluye del sorteo de objetivos de ese instrumento, y **el panel avisa** de cuántos
  elementos del banco quedan disponibles.
- **Si dos contenedores en pantalla son los dos correctos**: las dos activaciones son
  aciertos. Es la consecuencia de `categories[]` múltiple y es deseable.
- **Si el paciente selecciona y abre el panel**: la selección se pierde y no se registra
  nada. Igual que el tablero, la selección no sobrevive a la pausa.
- **Si el paciente activa un contenedor sin haber seleccionado nada**: no pasa **nada**. No
  es un fallo, no se registra, y no se anuncia.
- **En denominación, si el nombre del manifiesto está vacío**: el elemento se excluye del
  sorteo. Un objetivo sin nombre no se puede presentar como palabra.

## Dependencies

**De entrada:** 1, 2, 3, 4, 5, 6, 8, 9, 11 — todas duras, y **todas ya implementadas**.

**Dependen de estos:** ninguno.

## Tuning Knobs

| Perilla | Rango | Propuesto | De quién | Instrumento |
|---|---|---|---|---|
| `nContenedores` | [2, 4] | **3** | **Nueva, del sistema 21** | Clasificar |

Las cuatro del sistema 4 se aplican a los tres instrumentos sin cambios. `nContenedores` es
la **primera perilla que un instrumento añade**, y su alcance es el ejercicio.

## Visual/Audio Requirements

| Elemento | Requisito |
|---|---|
| Zona de referencia de denominación | Solo el nombre, con el tamaño de texto del marco |
| Contenedores de clasificar | Activables, tamaño mínimo igual que un objeto, etiqueta de texto |
| Indicador de selección | **Distinto del foco, y con forma además de color** |
| Acuse de recibo | Idéntico a Busca, e idéntico entre acierto y fallo |
| Audio | Ninguno |

## Acceptance Criteria

**AC-1 — Denominación usa la misma regla de acierto que Busca** · Unit · **BLOCKING**
**DADO** el mismo tablero y el mismo objetivo,
**ENTONCES** las dos reglas devuelven el mismo resultado para toda activación.
*Es la prueba de que el coste marginal es cero: lo que cambia es la presentación.*

**AC-2 — Denominación NO muestra el glifo del objetivo** · Integration (Playwright) · **BLOCKING**
**DADO** el instrumento de denominación,
**ENTONCES** la zona de referencia contiene el nombre y **no** contiene el glifo, y el glifo
del objetivo **sí** aparece en el tablero.
*Si mostrara la imagen, la tarea volvería a ser la de Busca.*

**AC-3 — La primera activación de clasificar NO registra nada** · Unit · **BLOCKING**
**DADO** un tablero de clasificar y una activación sobre un objeto,
**ENTONCES** queda seleccionado y **el registro no gana ningún intento**.
*Un paciente que selecciona y se lo piensa no genera datos.*

**AC-4 — Activar el mismo objeto deselecciona, y tampoco registra** · Unit · **BLOCKING**
**DADO** un objeto seleccionado,
**CUANDO** se activa el mismo objeto,
**ENTONCES** queda deseleccionado y no hay ningún intento.

**AC-5 — Solo la activación de un contenedor registra** · Unit · **BLOCKING**
**DADO** un objeto seleccionado y un contenedor activado,
**ENTONCES** se registra **exactamente un** intento, con el acierto calculado según F1.

**AC-6 — Activar un contenedor sin selección no hace nada** · Unit · **BLOCKING**
**DADO** ninguna selección,
**CUANDO** se activa un contenedor,
**ENTONCES** no hay intento, no hay cambio de estado, y no hay anuncio.

**AC-7 — Al menos un contenedor es siempre correcto** · Unit · **BLOCKING**
**DADO** 500 tableros con semillas distintas y `nContenedores` de 2 a 4,
**ENTONCES** en todos hay al menos un contenedor cuya etiqueta está en las categorías del
objetivo.
*Un ejercicio imposible es peor que uno difícil, porque el paciente no puede saber que lo es.*

**AC-8 — Dos contenedores correctos son los dos aciertos** · Unit · **BLOCKING**
**DADO** un objetivo con dos categorías, y las dos en pantalla,
**ENTONCES** activar cualquiera de los dos es un acierto.
*Es la consecuencia de `categories[]` múltiple, y es deseable.*

**AC-9 — Sin categorías suficientes se RECHAZA, no se repite** · Unit · **BLOCKING**
**DADO** un banco con menos categorías distintas que `nContenedores`,
**ENTONCES** se lanza nombrando cuántas hay. **Nunca dos contenedores con la misma etiqueta.**

**AC-10 — Un objetivo sin categorías no puede ser objetivo de clasificar** · Unit · **BLOCKING**
**DADO** un elemento con `categories: []`,
**ENTONCES** no aparece nunca como objetivo en 500 sorteos.

**AC-11 — El indicador de selección es distinto del foco, y sobrevive en escala de grises** · Integration (Playwright) · **BLOCKING**
**DADO** un objeto seleccionado y otro enfocado,
**ENTONCES** los dos indicadores difieren en **algo que no es el color** — una propiedad de
forma o de trazo —, y el elemento seleccionado se distingue del no seleccionado con
`filter: grayscale(1)` aplicado.
*Si se parecen, el paciente que usa barrido no sabrá qué está mirando.*

**AC-12 — Denominación excluye los elementos sin nombre** · Unit · **BLOCKING**
**DADO** un banco con un elemento de `nombre` vacío,
**ENTONCES** no aparece como objetivo en 500 sorteos.

**AC-13 — Ninguno de los dos instrumentos ramifica por modo de entrada** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
Ya cubierto por AC-2 del sistema 5, y se declara aquí porque son los consumidores nuevos.

## Open Questions

| Pregunta | Quién | Cuándo |
|---|---|---|
| ¿Denominación necesita también la vía inversa —imagen y elegir la palabra—? | El colaborador | Sería un cuarto instrumento, no una variante |
| ¿Los contenedores arriba o a los lados? | El colaborador, mirándolo | Afecta al recorrido del barrido |
| ¿`nContenedores = 3` es el valor útil? | Observación | Es una perilla, así que el coste de equivocarse es bajo |
