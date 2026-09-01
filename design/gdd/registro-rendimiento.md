# Registro de rendimiento

> **Status**: In Design
> **Author**: Carlos + `systems-designer`
> **Last Updated**: 2026-08-26
> **Sistema**: #9 del índice · Registro · MVP · capa Core · esfuerzo **M**
> **Implements Pillar**: **2 — el error se mide, no se muestra.** Este sistema es la mitad
> que mide

## Overview

**El registro lo sabe todo; la pantalla del paciente no sabe nada.** Esa separación no es
organizativa: es física. Este sistema no tiene ninguna vía para llegar a la vista del
paciente, y esa ausencia es su característica principal.

Es también donde aterrizan seis encargos que los sistemas anteriores le fueron dejando por
escrito:

| De | Qué |
|---|---|
| 3 | La guarda de diferencia negativa del reloj: latencia **indefinida**, nunca cero |
| 3 | El orden de inserción, porque el sello de pared puede desplazarse |
| 3 | La **resolución del reloj**, registrada junto a cada sesión |
| 4 | Las marcas `ejesAcoplados` y `ejesMezclados`, y `dificultadTolerada` |
| 8 | **`dp` recalculada con las proporciones efectivas**, no con las pedidas |
| 5 | El `origenTiempo` de cada activación, y la condición de no mezclar orígenes |

En el primer hito **no persiste nada**: el registro vive en memoria y muere al cerrar el
navegador. El colaborador definió "pulida" sin mencionar guardar, así que la persistencia es
del sistema 18 y no de aquí. Lo que sí existe desde el primer día es la **forma** del
registro, para que persistirlo después no obligue a rediseñarlo.

## Player Fantasy

**Del paciente: ninguna, y es un requisito.** Si el paciente percibe que se le está midiendo
—una barra que sube, un contador, un cambio de color al fallar— el pilar 2 está roto.

**Del terapeuta: "puedo mirar qué pasó sin haber estado mirando".** Durante la sesión su
atención está en la persona, no en la pantalla. El registro es lo que le permite eso.

## Detailed Rules

### Core Rules

1. **Este sistema no tiene ninguna vía hacia la vista del paciente.** Ni un evento, ni una
   suscripción, ni un objeto compartido. El instrumento **escribe** aquí y no **lee**.

   Es una propiedad de código fuente, y la vigila el sistema 14: ningún módulo del ámbito
   del paciente importa nada de `src/registro/`.
2. **Una latencia solo se calcula entre dos lecturas del MISMO origen de reloj.** Es la
   condición dura que el sistema 5 declaró. El registro guarda `origenTiempo` con cada
   activación y **se niega a restar dos marcas de orígenes distintos**.
3. **Una diferencia negativa da latencia `undefined`, nunca 0.**

   El reloj monótono no debería retroceder, pero si lo hace, un 0 se leería como un acierto
   instantáneo — un dato clínico plausible. La guarda que el sistema 3 declaró y delegó aquí.
4. **Si el reloj no avanzó entre dos lecturas, la latencia es 0 con marca
   `resolucionInsuficiente`.** Y esto es **distinto** del caso anterior: aquí sí hubo un
   evento, y el 0 es una medida real limitada por la granularidad del reloj.

   La diferencia importa: `undefined` significa *"el reloj falló"*; `0` con marca significa
   *"fue más rápido de lo que este reloj puede medir"*. Con la resolución de la sesión
   registrada, el segundo caso es interpretable.
5. **La dificultad registrada es la EFECTIVA.** `dp` se recalcula con `svEfectiva` y
   `ssEfectiva` del tablero, y se guardan también las pedidas. La diferencia entre las dos
   es un dato: significa que la configuración no era realizable con el banco que hay.

   Guardar solo la pedida sobrestimaría la dificultad que el paciente afrontó, y el error
   va **siempre en la misma dirección**.
6. **El orden de las sesiones es el de inserción, no el del sello de pared.**

   El sello puede desplazarse — una tableta que pasa semanas apagada corrige su reloj de
   golpe al reconectarse — y el sistema 3 aceptó ese desplazamiento porque un sello sirve
   para ordenar, no para medir. Pero si el sello es la **única** clave de orden, un salto
   hacia atrás muestra las sesiones desordenadas al terapeuta.

   Así que cada sesión lleva un **contador monótono de inserción**, y ese es el orden. El
   sello es información, no índice.
7. **Un fallo se registra y no se muestra.** El registro guarda cada activación con su
   objetivo, si era el correcto y su latencia. Nada de eso vuelve a la pantalla del paciente.

   Y **un aborto de puntero no es un intento.** El sistema 5 no lo emite, así que aquí no
   llega: un paciente con temblor no genera datos de error por temblar.
8. **La semilla y la versión del esquema del manifiesto viajan con cada tablero.** Es lo que
   hace reproducible un tablero histórico, y es el encargo que el sistema 3 dejó aquí por
   escrito.

   Si la versión del esquema cambió, el tablero se marca **reproducible solo
   aproximadamente**. Si falta la semilla, **no reproducible**. Nunca lanza: un dato antiguo
   incompleto es aceptable, una pantalla que se rompe al abrirlo no.

### Qué NO es de este sistema

| No es de aquí | De quién es |
|---|---|
| Guardar el registro en disco | Sistema 18 |
| Mostrarlo al terapeuta | Sistema 12 |
| Mover la dificultad con estos datos | Sistema 17 |
| Decidir qué activación es correcta | El instrumento |
| La política de muestreo contra la habituación | Sistema 8, con datos de aquí |

## Formulas

### F1 — `latencia(tInicio, tFin, origenInicio, origenFin)`

```
si origenInicio ≠ origenFin        →  undefined, motivo 'origenesMezclados'
si tFin < tInicio                  →  undefined, motivo 'relojRetrocedio'
si tFin == tInicio                 →  0,         marca 'resolucionInsuficiente'
en otro caso                       →  tFin − tInicio
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `tInicio`, `tFin` | float ms | [0, ∞) | Del reloj monótono o de `event.timeStamp` |
| salida | float **o `undefined`** | [0, ∞) | Con motivo cuando es `undefined` |

**Los tres casos degenerados son distinguibles a propósito**, porque piden acciones
distintas: mezclar orígenes es un defecto de código, un reloj que retrocede es un defecto
del entorno, y una resolución insuficiente es una limitación conocida y aceptable.

**Ejemplos:**

| `tInicio` | `tFin` | Orígenes | Resultado |
|---|---|---|---|
| 1000 | 1016 | iguales | **16** |
| 1000 | 1000 | iguales | **0**, `resolucionInsuficiente` |
| 1000 | 999 | iguales | **`undefined`**, `relojRetrocedio` |
| 1000 | 1016 | distintos | **`undefined`**, `origenesMezclados` |

### F2 — `resumenSesion(sesion)`: lo que el sistema 12 va a mostrar

```
intentos      = número de activaciones
aciertos      = activaciones sobre el objetivo correcto
precision     = aciertos / intentos          (undefined si intentos == 0)
latenciaMedia = media de las latencias DEFINIDAS
latenciasSinDato = cuántas salieron undefined
```

| Variable | Rango | Descripción |
|---|---|---|
| `precision` | [0, 1] o `undefined` | `undefined` con cero intentos, **nunca 0** |
| `latenciaMedia` | [0, ∞) o `undefined` | Media solo de las definidas |
| `latenciasSinDato` | [0, ∞) | **Se publica siempre.** Una media de 3 de 40 latencias no es una media |

**`precision` con cero intentos es `undefined`, no 0.** Un 0 se leería como *"no acertó
ninguna"*, que es un dato clínico devastador, cuando lo que pasó es que la sesión se cerró
antes de empezar. Cuarta aparición del mismo patrón prohibido del proyecto.

**Y `latenciasSinDato` se publica siempre**, incluso cuando es 0. Si se omitiera, una media
calculada sobre 3 de 40 latencias tendría el mismo aspecto que una calculada sobre 40.

### F3 — `dificultadRegistrada(tablero, config)`

```
dp = dp( config.C , tablero.svEfectiva , tablero.ssEfectiva )
dm = dm( config.t )
```

Y se guardan también `dpPedida`, `svPedida` y `ssPedida`. La diferencia entre `dp` y
`dpPedida` significa que el banco no daba para la configuración puesta.

## Edge Cases

- **Sesión con cero intentos**: `precision` es `undefined`, `latenciaMedia` es `undefined`,
  `dificultadTolerada` es `undefined` con motivo `datosInsuficientes`. **Ningún 0.**
- **Sesión con `t < 44`**: se marca `ejesAcoplados`, y `dificultadTolerada` del eje
  perceptivo devuelve `undefined` con ese motivo. La del eje motor sí se calcula.
- **Sesión donde se movieron los dos ejes**: las dos métricas devuelven `undefined` con
  motivo `ejesMezclados`, **y las observaciones crudas siguen accesibles**. El dato de qué
  pasó sigue siendo válido; lo que no es válido es la métrica de progreso.
- **Tablero sin semilla** (registro de una versión anterior): se marca **no reproducible**.
  Nunca lanza.
- **Versión del esquema del manifiesto distinta**: **reproducible solo aproximadamente**,
  con la versión anotada.
- **Un id del tablero que ya no existe en el manifiesto**: `resolve(id)` devuelve
  `conocido: false`, y el registro lo muestra como *"estímulo desconocido"* con el id. Nunca
  lanza y nunca lo oculta: ocultarlo perdería la trazabilidad de qué vio el paciente.
- **Dos sesiones con el mismo sello de pared** (reloj sin avanzar, o corregido hacia atrás):
  el orden lo decide el contador de inserción. Sin ambigüedad.

## Dependencies

**Dependencias de entrada:** 1 (dura), 3 (dura), 4 (dura), 5 (dura), 8 (dura). Es el sistema
con más dependencias del MVP, y es esperable: es el sumidero.

**Sistemas que dependen de este:** 12, 17, 18, 20 y **los nueve instrumentos** — 10, 21,
24, y los seis documentados el 2026-09-01: 22, 23, 28, 29, 30, 31 y 32.

El **32** es el que más lo cambió: añadió `contenido` a `TableroRegistrado` y `contenido.id`
a la clave de agrupación del progreso. Y el 2026-09-01 se añadió también `incompleto`,
que era el bloqueante S4.

## Tuning Knobs

**Ninguna clínica.** El registro no tiene parámetros que el terapeuta deba tocar: registra
lo que pasa.

| Perilla de proyecto | Valor | Nota |
|---|---|---|
| `maxSesionesEnMemoria` | **20** | Sin persistencia, el registro crece con la sesión. 20 sesiones son mucho más de lo que una jornada de consulta produce |

## Visual/Audio Requirements

**Ninguna, y es un requisito negativo:** este sistema no produce nada visible. Si alguna vez
lo hace, el pilar 2 está roto.

## UI Requirements

Para el sistema 12, y las tres salen de reglas de aquí:

1. **Cuando una métrica es `undefined`, la pantalla dice el motivo**, no un guion ni un 0.
   Los cuatro motivos piden acciones distintas del terapeuta.
2. **`latenciasSinDato` se muestra junto a la latencia media**, siempre.
3. **La limitación de escala se muestra donde se muestran `dm` y `dp`**: son escalas
   ordinales defendibles, no medidas calibradas. Comparar un paciente consigo mismo es
   legítimo; comparar dos pacientes no lo es. El sistema 4 lo declaró y **tiene que llegar
   hasta la pantalla**, no quedarse en el GDD.

## Acceptance Criteria

**AC-1 — Canario de F1: los cuatro casos** · Unit · **BLOCKING**
**DADO** las cuatro filas de la tabla de F1,
**ENTONCES** el resultado es **16**, **0 con `resolucionInsuficiente`**, **`undefined` con
`relojRetrocedio`** y **`undefined` con `origenesMezclados`**, y los tres motivos son
distinguibles entre sí.

**AC-2 — Una latencia negativa NUNCA se registra como 0** · Unit · **BLOCKING**
**DADO** `tFin < tInicio`,
**ENTONCES** el resultado es `undefined`. **Nunca 0, nunca el valor absoluto, nunca `NaN`.**
*Un 0 se leería como un acierto instantáneo: un dato clínico plausible y falso.*

**AC-3 — No se restan dos orígenes de reloj distintos** · Unit · **BLOCKING**
**DADO** `tInicio` de `event.timeStamp` y `tFin` del reloj monótono,
**ENTONCES** el resultado es `undefined` con `origenesMezclados`, **aunque los dos números
darían una diferencia plausible**.

**AC-4 — `precision` con cero intentos es `undefined`, no 0** · Unit · **BLOCKING**
**DADO** una sesión sin ninguna activación,
**ENTONCES** `precision` es `undefined` y `latenciaMedia` es `undefined`. **Ningún campo
del resumen vale 0 por ausencia de datos.**

**AC-5 — `latenciasSinDato` se publica siempre** · Unit · **BLOCKING**
**DADO** una sesión con 40 activaciones de las que 37 dieron latencia `undefined`,
**ENTONCES** `latenciaMedia` es la media de **3** valores y `latenciasSinDato` es **37**.
*Sin ese segundo número, la media tendría el mismo aspecto que una calculada sobre 40.*

**AC-6 — La dificultad registrada es la EFECTIVA** · Unit · **BLOCKING**
**DADO** un tablero con `svPedida = 0,8`, `ssPedida = 0,8`, `svEfectiva = 9/11` y
`ssEfectiva = 2/11`, con `C = 12`,
**ENTONCES** `dp` registrada es **40,1** y `dpPedida` es **51,7**, y **las dos se guardan**.

**AC-7 — El orden de sesiones sobrevive a un salto del reloj de pared** · Unit · **BLOCKING**
**DADO** tres sesiones insertadas en orden, y un reloj de pared que **retrocede una hora**
entre la primera y la segunda,
**CUANDO** se piden las sesiones ordenadas,
**ENTONCES** salen en el orden de inserción. **El sello desplazado no las reordena.**

**AC-8 — Un tablero sin semilla se marca no reproducible y no lanza** · Unit · **BLOCKING**
**DADO** un tablero histórico sin semilla, y otro con una versión de esquema distinta,
**ENTONCES** el primero es `noReproducible` y el segundo `reproducibleAproximado`, y
**ninguno lanza**.

**AC-9 — La resolución del reloj se registra con la sesión** · Unit · **BLOCKING**
**DADO** una sesión iniciada,
**ENTONCES** su registro incluye `resolucionMs` y `fiableParaPresupuesto`.
*Sin ese dato, una latencia de 0 ms no se distingue de un fallo de medición. Es el encargo
que el sistema 3 dejó aquí al añadir `medirResolucionReloj`.*

**AC-10 — Ningún módulo del ámbito del paciente importa del registro** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de `src/`,
**CUANDO** se buscan imports de `src/registro/` desde módulos de la vista del paciente,
**ENTONCES** no aparece ninguno.
*Es el pilar 2 hecho barrera. La separación entre lo que se mide y lo que se muestra tiene
que ser de código, no de disciplina.*

**AC-11 — Un aborto de puntero no llega al registro** · Unit · **BLOCKING**
**DADO** la secuencia de la capa de entrada que produce un aborto,
**ENTONCES** el registro **no recibe ningún intento**. Ni acierto, ni fallo.
*Un paciente con temblor no genera datos de error por temblar.*

### Infraestructura que falta

| Falta | Nota |
|---|---|
| `src/registro/` | Nuevo. Módulo puro: los relojes llegan inyectados |
| La lista de imports prohibidos de AC-10 | Séptima barrera del sistema 14 |
| **Nada de persistencia** | Es del sistema 18, y está fuera del primer hito |

## Open Questions

| Pregunta | Quién | Cuándo |
|---|---|---|
| ¿Cuánto dura una sesión en la práctica? | Observación | Decide si 20 sesiones en memoria bastan |
| ¿El terapeuta querrá guardar tras la primera prueba? | El colaborador | Muy probable. El diseño ya está listo para el sistema 18 |
| ¿Qué se hace con la habituación intra-sesión? | Con datos de aquí | F7 del sistema 1 la cuantificó y demostró que el banco no la arregla |
