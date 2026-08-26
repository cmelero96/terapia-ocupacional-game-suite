# Instrumento: Busca (búsqueda visual)

> **Status**: In Design
> **Author**: Carlos + `gameplay-programmer`, `game-designer`
> **Last Updated**: 2026-08-26
> **Sistema**: #10 del índice · Instrumento · MVP · capa Feature · esfuerzo **M**
> **Implements Pillar**: Es el primero que hace visibles los cinco

## Overview

El primer instrumento, y el que valida toda la infraestructura. Se muestra un objetivo y un
tablero; el paciente lo encuentra y lo activa.

**Y es el sistema que posee la raíz de composición del MVP**, que ADR-0005 le adjudicó: es
quien construye la fábrica impura al arrancar y reparte el reloj, la fuente aleatoria y el
programador hacia abajo. Ese archivo va a ser aburrido y verboso, y es el sitio correcto
donde poner esa verbosidad.

Tres cosas se miden por primera vez aquí:

1. **El presupuesto de rendimiento**, que ADR-0005 dejó como predicción sin medir.
2. **El presupuesto de latencia** de menos de 100 ms, con la resolución de reloj real.
3. **Los treinta segundos del pilar 1**, sobre el flujo completo.

## Player Fantasy

**Del paciente: encontrar algo.** El instrumento más antiguo que existe, y funciona porque
el hallazgo es intrínsecamente satisfactorio: no hace falta añadirle nada, y el anti-pilar 3
prohíbe hacerlo.

**Del terapeuta: ver trabajar a su paciente sin mirar la pantalla.** Su atención está en la
persona. El registro es lo que le permite eso.

## Detailed Rules

### Core Rules

1. **Un objetivo visible, siempre.** El objetivo se muestra **a la vez** que el tablero, en
   una zona propia y fuera del tablero. No se retira.

   Consecuencia declarada: **este instrumento no carga memoria de trabajo.** El sistema 15
   lo identificó (capacidad A9 sin instrumento). Si el colaborador la prioriza, hace falta un
   instrumento distinto, no una variante de este.
2. **Un elemento del DOM por objeto del tablero**, con `role="button"`, nombre accesible del
   campo `name` del manifiesto, y foco real. Lo fija ADR-0005.
3. **Activar el objetivo correcto avanza al tablero siguiente. Activar un distractor no hace
   nada visible.**

   Nada. Ni marca, ni sonido, ni temblor, ni anuncio. El acuse de recibo de la activación
   ocurre igual —el paciente sabe que el sistema le oyó— pero **es idéntico en los dos
   casos**. El pilar 2 hecho comportamiento.
4. **El acuse de recibo es idéntico para acierto y para fallo.** Es lo primero que alguien
   rompería "por claridad", y rompería el pilar 2 con él. Tiene criterio propio.
5. **La sesión termina cuando una persona lo dice.** No hay número de tableros, ni tiempo, ni
   condición de victoria. El anti-pilar 2.
6. **El instrumento no sabe qué modo de entrada se usó.** Recibe `EventoActivacion` y nada
   más. El sistema 14 lo vigila.
7. **El instrumento no lee del registro.** Escribe y no lee. La separación del pilar 2 es de
   código.

### La raíz de composición

Es de este sistema, y hace exactamente tres cosas:

```
1. Construir la fábrica impura una vez, al arrancar
2. Repartir reloj, fuente y programador hacia abajo, por parámetro
3. Montar el instrumento
```

**No está exenta de la regla 1**, porque no llama a ninguna fuente no determinista: solo
mueve parámetros. Es la distinción que el GDD del sistema 5 forzó al separar la fábrica del
reparto.

### Qué NO es de este sistema

| No es de aquí | De quién es |
|---|---|
| Qué elementos van en el tablero | Sistema 8 |
| Cómo se activa un objetivo | Sistema 5 |
| Dónde se coloca cada uno | CSS, con `separacion(t)` del sistema 2 |
| Los colores | Sistema 2 |
| Guardar lo que pasó | Sistema 9 |
| El panel del terapeuta | Sistema 11 |

## Formulas

### F1 — `disposicion(C, t, separacion)`: cuántas columnas

```
columnas = ceil( sqrt(C) )
anchoNecesario = columnas · t + (columnas − 1) · separacion(t)
```

| Variable | Tipo | Descripción |
|---|---|---|
| `C` | int | Elementos del tablero |
| `t` | int px | Tamaño de objetivo |
| `separacion(t)` | int px | `max(8, 0,18·t)`, F3 del sistema 2 |
| `columnas` | int | Rejilla lo más cuadrada posible |
| `anchoNecesario` | int px | **Si supera el ancho disponible, se rechaza la combinación** |

**El rechazo es de aquí**, porque es el único sistema que conoce la disposición. Y se
rechaza, no se ajusta: reducir `C` en silencio movería el eje perceptivo porque el terapeuta
tocó el motor.

**Valores, con `separacion` de F3 del sistema 2:**

| `C` | `t` | columnas | `separacion` | ancho necesario | ¿Cabe en 1280 px? |
|---|---|---|---|---|---|
| 12 | 60 | 4 | 10,8 | 272 | Sí |
| 12 | 140 | 4 | 25,2 | 636 | Sí |
| 30 | 60 | 6 | 10,8 | 414 | Sí |
| 30 | 140 | 6 | 25,2 | 966 | Sí |
| 100 | 60 | 10 | 10,8 | 697 | Sí |
| 100 | 140 | 10 | 25,2 | 1627 | **No. Se rechaza** |

**El conflicto B1 + B7 del sistema 15 cabe**: `t = 60` con `C = 30` son 414 px. La tensión
que ese documento anticipó existe en la altura y en el barrido, no en el ancho.

## Edge Cases

- **Si el tablero no cabe**: se rechaza la combinación nombrando `C`, `t` y el ancho
  necesario. **Antes de que el paciente esté delante**, en el panel.
- **Si el paciente activa el objetivo dos veces** por rebote: la segunda no cuenta. El
  sistema 5 ya lo filtra.
- **Si el manifiesto no conoce un id del tablero**: se muestra un hueco con el id y **la
  ronda se marca inválida**. Nunca se sustituye por otro: sustituirlo perdería la
  trazabilidad de qué vio el paciente.
- **Si `estimuloReducido` está activo**: el acuse pierde la transición y conserva la
  existencia. Sistema 6.
- **Si la sesión se abandona a mitad de tablero**: lo registrado se conserva. Un tablero
  incompleto es un dato, no un error.

## Dependencies

**De entrada:** 2, 3, 4, 5, 6, 8, 9 — todas duras. Es el primer sistema que consume
prácticamente toda la infraestructura, y eso es la prueba de que la infraestructura sirve.

**Dependen de este:** 11, 12.

## Tuning Knobs

**Ninguna propia.** Todas vienen del sistema 4 y del 5. Si aparece una perilla aquí, es un
parámetro clínico fuera de su sitio.

## Visual/Audio Requirements

| Elemento | Requisito |
|---|---|
| Zona del objetivo | Fuera del tablero, siempre visible, con el único uso del color de acento |
| Objetos del tablero | Cuadrados de `t` px, rejilla con `gap: separacion(t)` |
| Acuse de recibo | Realce del borde. **Idéntico en acierto y fallo.** Menos de 100 ms |
| Foco | `:focus-visible` con `--board-scan-cursor` |
| Progreso de permanencia | `--board-dwell-progress` |
| Audio | **Ninguno.** Sistema 7 |

## UI Requirements

1. **La zona del objetivo y el tablero no se confunden.** Si el paciente puede activar el
   objetivo de referencia, la tarea cambia.
2. **El contador de progreso, si existe, va en el panel del terapeuta.** Nunca en la pantalla
   del paciente: fue uno de los cuatro defectos que la revisión del prototipo encontró.

## Acceptance Criteria

**AC-1 — Un elemento del DOM por objeto, con nombre accesible** · Integration (Playwright) · **BLOCKING**
**DADO** un tablero de `C` elementos,
**ENTONCES** hay exactamente `C` elementos con `role="button"`, cada uno con nombre
accesible no vacío, y **todos enfocables por teclado**.

**AC-2 — El acuse de recibo es idéntico para acierto y fallo** · Integration (Playwright) · **BLOCKING**
**DADO** una activación sobre el objetivo correcto y otra sobre un distractor,
**CUANDO** se comparan los estilos calculados y los atributos durante el acuse,
**ENTONCES** son **idénticos**.
*Es lo primero que se rompería "por claridad".*

**AC-3 — Activar un distractor no produce ningún anuncio** · Integration (Playwright) · **BLOCKING**
**DADO** una activación sobre un distractor,
**ENTONCES** ninguna región `aria-live` cambia de contenido, y no aparece ningún elemento con
`role="alert"` o `role="status"`.

**AC-4 — El tamaño de objetivo renderizado es el configurado** · Integration (Playwright) · **BLOCKING**
**DADO** `t = 24, 44, 60, 140`,
**ENTONCES** el `getBoundingClientRect()` de cada objeto mide `t` px de lado, con una
tolerancia de 1 px por redondeo de subpíxel.
*El tamaño de objetivo es un parámetro clínico. Que lo sea de verdad exige que se pueda
medir en el navegador, y esto es lo que ADR-0005 compró.*

**AC-5 — La separación renderizada es `separacion(t)`** · Integration (Playwright) · **BLOCKING**
**DADO** `t = 60`, con `separacion(60) = 10,8`,
**ENTONCES** el `gap` calculado de la rejilla es **10,8 px**.

**AC-6 — El presupuesto de rendimiento, MEDIDO** · Integration (Playwright) · **BLOCKING**
**DADO** un tablero de **100** elementos,
**CUANDO** se mide el tiempo desde la orden de render hasta que el último elemento está en
pantalla,
**ENTONCES** el resultado se **publica en el informe** y se compara contra 16,6 ms.
*ADR-0005 dejó esto como predicción falsable y sin medir. Aquí se mide. **Si falla, la salida
no es Canvas: es reducir `Cmax`**, que ya es una perilla clínica.*

**AC-7 — El presupuesto de latencia, MEDIDO** · Integration (Playwright) · **BLOCKING**
**DADO** una activación por puntero,
**CUANDO** se mide entre `event.timeStamp` y el acuse visible,
**ENTONCES** es **menor que 100 ms**, y el informe publica el valor junto a la resolución de
reloj medida.

**AC-8 — Ningún elemento activable mide menos de 24 px** · Integration (Playwright) · **BLOCKING**
**DADO** cualquier configuración admisible,
**ENTONCES** todo elemento con `role="button"` mide al menos 24 px de lado. WCAG 2.5.8.

**AC-9 — La raíz de composición no llama a ninguna fuente no determinista** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el archivo de la raíz de composición,
**ENTONCES** no contiene ningún literal prohibido, y **no lleva el marcador de exención**.
*Construir y repartir son cosas distintas. Si la raíz necesitara exención, la separación que
el sistema 5 forzó no se aplicó.*

**AC-10 — El instrumento no ramifica por modo de entrada** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
Ya cubierto por AC-2 del sistema 5, y se declara aquí porque este es el primer consumidor
real.

## Open Questions

| Pregunta | Quién | Cuándo |
|---|---|---|
| ¿Cuántos tableros aguanta una sesión antes de la habituación? | Observación, con el registro | F7 del sistema 1 predijo ~56 reapariciones en 15 tableros |
| ¿La zona del objetivo arriba o al lado? | El colaborador, mirándolo | Afecta al recorrido del barrido |
