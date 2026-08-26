# Modelo de dificultad: dos ejes, cuatro perillas

> **Status**: In Design
> **Author**: Carlos + `systems-designer`, `game-designer`
> **Last Updated**: 2026-08-26
> **Sistema**: #4 del índice · Clínico · MVP · capa Foundation · esfuerzo **M**
> **Implements Pillar**: **3 — la dificultad vive en un rango que fija el terapeuta.**
> Este sistema *es* ese pilar

## Overview

La dificultad de un ejercicio **no es un número**. Son dos ejes independientes que se
configuran por separado y se miden por separado:

| Eje | Qué limita | Perillas |
|---|---|---|
| **Motor** | La precisión del gesto necesaria para acertar | Tamaño de objetivo `t` |
| **Perceptivo-cognitivo** | La dificultad de *encontrar* el objetivo | Cantidad `C`, similitud visual `sv`, similitud semántica `ss` |

Cuatro perillas, dos ejes. Y la separación no es organizativa: **un paciente puede tener
control psicomotor muy reducido y percepción intacta, o al revés.** Colapsar los dos ejes
en un solo control de "dificultad" haría que subirla mueva las dos cosas a la vez, y el
terapeuta perdería exactamente la capacidad por la que usaría el producto.

Este sistema aporta tres cosas y nada más:

1. El **espacio de parámetros**: qué perillas hay, qué rango tiene cada una y qué
   significa un valor.
2. El **mecanismo de rango**: el terapeuta fija límites, no valores sueltos.
3. La **métrica de progreso**: dificultad tolerada a precisión constante.

Lo que **no** aporta: cómo se rellena un tablero (sistema 8), cómo se registra una sesión
(sistema 9), ni cómo se mueve la dificultad por sí sola (sistema 17).

## Player Fantasy

**Del terapeuta, y es la del pilar 3:** *"puedo hacerlo más difícil por donde yo quiera, no
por donde el juego decida"*.

La sensación concreta que se busca es la de un dial, no la de un botón de nivel. Un
terapeuta que quiere trabajar coordinación ojo-mano con un paciente que lee bien debe poder
bajar el tamaño de objetivo **sin** que el tablero se llene de distractores parecidos. Y al
revés.

**Del paciente: ninguna directamente**, y eso es deliberado. El paciente no ve un nivel, no
ve una dificultad, y no ve que haya cambiado. El pilar 2 lo exige: si el paciente percibe
"me lo han puesto más fácil", el instrumento deja de medir y empieza a comunicar un juicio.

## Detailed Rules

### Core Rules

1. **La dificultad es un vector, nunca un escalar configurable.** La configuración de un
   ejercicio es `{ t, C, sv, ss }`. No existe un control de "dificultad general", ni una
   escala de 1 a 10, ni presets que muevan las cuatro a la vez sin decirlo.

   Los escalares `dm` y `dp` de las fórmulas F1 y F2 **son derivados y solo se usan para
   registrar y comparar**. Nunca se fijan: se calculan.
2. **El terapeuta fija un RANGO por perilla, no un valor.** La unidad de configuración es
   `[min, max]` con `min ≤ max`. Un rango degenerado — `min == max` — es un valor fijo, y
   es lo único que usa el Nivel 0.

   El rango existe desde el primer día aunque el Nivel 0 no lo aproveche, para que la
   dificultad adaptativa del sistema 17 no obligue a cambiar el esquema después. Mismo
   patrón que `attrs` en el sistema 1 y las dos filas reservadas del sistema 2.
3. **Una política decide qué valor del rango se usa, y es explícita.** No se sortea en
   silencio.

   | Política | Qué hace | Nivel |
   |---|---|---|
   | `fija` | Usa `min`. Con rango degenerado es el único valor | **0** |
   | `adaptativa` | La mueve el sistema 17 dentro del rango | 1+ |

   El Nivel 0 usa `fija` y nada más. Que la dificultad no cambie sola es una **propiedad**
   del Nivel 0, no una carencia: el terapeuta necesita que dos tableros consecutivos sean
   comparables antes de confiar en el instrumento.
4. **Los límites duros no son negociables y no son preferencias.**

   | Perilla | Límite duro | De dónde sale |
   |---|---|---|
   | `t` | **≥ 24 px** | WCAG 2.2 — 2.5.8, mínimo absoluto. El terapeuta no puede bajar de aquí |
   | `t` | ≤ 140 px | Por encima, el tablero no cabe a `Cmax` |
   | `C` | ≥ 3 | Con menos de 3 no hay búsqueda |
   | `C` | ≤ `Cmax` = 100 | Registro de constantes |
   | `sv`, `ss` | [0, 1] | Son proporciones |

   Un valor fuera de rango **no se recorta en silencio**: se rechaza nombrando el valor y
   el límite. Recortar convertiría un error de configuración en un ejercicio distinto del
   que el terapeuta cree haber puesto.
5. **Por debajo de 44 px los dos ejes DEJAN de ser independientes, y hay que decirlo.**

   Es la regla más importante de este documento.

   `t = 44` px es el mínimo AAA de WCAG. Por debajo, un paciente con control psicomotor
   reducido falla tocando **al lado** del objetivo correcto — y ese fallo entra en el
   registro como si no hubiera **encontrado** el objetivo. El ruido motor se registra como
   fallo de búsqueda, y la medición del eje perceptivo queda contaminada sin que nada lo
   señale.

   Así que con `t < 44`:

   - La configuración es **válida**: hay casos en que entrenar precisión fina es el
     objetivo, y el terapeuta manda.
   - Pero el registro marca la sesión como **`ejesAcoplados: true`**, y la métrica de
     progreso del eje perceptivo **no se calcula** para esa sesión.
   - Y el panel del terapeuta lo dice, en una frase, cuando pone la perilla ahí.

   Es la cuarta aparición del modo de fallo característico del proyecto — *una entrada del
   entorno entrando en silencio en el espacio de parámetros clínicos* — salvo que aquí la
   entrada no es del entorno: **es del propio terapeuta**, y la respuesta correcta no es
   prohibirla, es declararla.
6. **La similitud son dos proporciones independientes, no un nivel.** `sv` es la fracción
   de distractores que salen del mismo cluster visual que el objetivo; `ss` la fracción que
   sale de alguna de sus categorías semánticas.

   Que sean independientes es exactamente lo que el colaborador confirmó el 2026-08-26, y
   es lo que sostiene un banco de 384 elementos en lugar de ~130.

   **Pueden solaparse**: un elemento puede ser del mismo cluster *y* de la misma categoría.
   Resolver ese solapamiento es del sistema 8; aquí solo se declara que las dos
   proporciones son entradas separadas y que su suma **puede pasar de 1**.
7. **Ninguna perilla es un límite de tiempo.** No hay perilla de velocidad, ni de tiempo
   por objetivo, ni de duración de sesión. El anti-pilar 2 lo prohíbe por defecto, y este
   sistema es donde se notaría la tentación de añadirla.

   El tiempo **se mide** — es del sistema 9 — pero no se **impone**.

### Qué NO es de este sistema

| No es de aquí | De quién es |
|---|---|
| Rellenar un tablero con `C` elementos según `sv` y `ss` | Sistema 8 |
| Resolver el solapamiento entre cluster y categoría | Sistema 8 |
| Guardar la configuración y los resultados de una sesión | Sistema 9 |
| Mover la dificultad automáticamente | Sistema 17 |
| Guardar configuraciones con nombre | Sistema 16, presets |
| Qué configuración le va bien a qué paciente | Sistema 15, taxonomía de perfiles |
| Cómo se ve el control en el panel | Sistema 11 |
| La cadencia visual y la separación en píxeles del tablero | Sistema 2, F3 |

### Interacciones con otros sistemas

| Sistema | Dirección | Interfaz |
|---|---|---|
| 8 · Generación de tableros | consume | El vector `{ t, C, sv, ss }` resuelto por la política |
| 9 · Registro | consume | El vector, más `dm`, `dp` y la marca `ejesAcoplados` |
| 11 · Panel del terapeuta | consume | Los rangos, los límites duros y el aviso de la regla 5 |
| 12 · Resultados de sesión | consume | `dificultadTolerada` de F3, vía el sistema 9 |
| 16 · Presets | consume | Un preset es un conjunto de rangos con nombre |
| 17 · Dificultad adaptativa | consume | El rango como espacio de búsqueda, y F3 como señal |
| 1 · Manifiesto | **no depende** | `sv` y `ss` se expresan como proporciones, no como consultas al banco. Quien consulta es el 8 |

## Formulas

**Convención de redondeo:** `t` y `C` son enteros. `sv` y `ss` son floats en [0, 1]. `dm`
y `dp` se publican con **un decimal**. La métrica de F3 se publica con un decimal o como
`undefined`.

### F1 — `dm(t)`: dificultad del eje motor

```
dm(t) = 100 · ln(tMax / t) / ln(tMax / tMin)
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `t` | int, entrada | [24, 140] px | Tamaño de objetivo |
| `tMin` | int, constante | 24 | Límite duro de WCAG 2.5.8 |
| `tMax` | int, constante | 140 | Techo de disposición a `Cmax` |
| `dm` | float, salida | **[0, 100]** | 0 = más fácil, 100 = más difícil |

**Por qué logarítmica y no lineal.** La ley de Fitts dice que el tiempo de un movimiento
apuntado escala con `log2(2D/W)`, donde `W` es el ancho del objetivo: la dificultad crece
con el **logaritmo** del inverso del tamaño, no con el inverso. Una escala lineal en píxeles
haría que bajar de 140 a 130 pareciera el mismo salto que bajar de 34 a 24, y no lo es ni
de lejos.

No se usa la ley de Fitts completa porque `D`, la distancia al objetivo, **no es una perilla
de este sistema**: depende de la disposición del tablero, que es del sistema 2. Lo que se
toma prestado es la forma logarítmica, no la fórmula.

**Valores, calculados:**

| `t` | `dm` | Nota |
|---|---|---|
| 24 | **100,0** | Mínimo WCAG. Máxima dificultad motora |
| 32 | 83,7 | |
| 44 | 65,6 | **Mínimo AAA. Por debajo, regla 5** |
| 60 | 48,0 | Recomendado para control psicomotor reducido |
| 80 | 31,7 | |
| 100 | 19,1 | |
| 140 | **0,0** | Máximo. Mínima dificultad motora |

### F2 — `dp(C, sv, ss)`: dificultad del eje perceptivo-cognitivo

```
nC = (C − Cmin) / (Cmax − Cmin)
dp = 100 · (wC·nC + wV·sv + wS·ss)
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `C` | int, entrada | [3, 100] | Elementos en el tablero |
| `sv` | float, entrada | [0, 1] | Fracción de distractores del mismo cluster visual |
| `ss` | float, entrada | [0, 1] | Fracción de distractores de la misma categoría semántica |
| `wC`, `wV`, `wS` | float, **perillas de proyecto** | suman 1 | **0,40 · 0,40 · 0,20** |
| `dp` | float, salida | **[0, 100]** | 0 = más fácil, 100 = más difícil |

**Rango de salida:** [0, 100] por construcción, porque los tres términos normalizados están
en [0, 1] y los pesos suman 1.

**Los tres pesos NO tienen validación empírica**, y se declaran como tal. El orden
—similitud visual y cantidad por encima de similitud semántica— sale de que en búsqueda
visual la **similitud entre objetivo y distractor** es el determinante principal del tiempo
de búsqueda, por encima del tamaño del conjunto. Es una elección defendible, no un dato de
este producto.

> Se suman al grupo de constantes sin validar del proyecto, junto a `k`, `separacionMin` y
> `Θ`. La forma de validarlos es comparar `dp` con la precisión observada en uso real, y
> eso llega con el sistema 9 y datos de verdad.

**Por qué es lícito colapsar tres perillas en un escalar aquí y no en la configuración.**
`dp` existe para **registrar y comparar**, no para configurar. La configuración conserva las
tres perillas separadas y el terapeuta las mueve por separado. Colapsarlas al configurar
rompería el pilar 3; colapsarlas al medir es lo que permite decir *"el paciente tolera un
`dp` de 60"* sin publicar una tabla de tres dimensiones.

**Ejemplos, calculados:**

| `C` | `sv` | `ss` | `nC` | `dp` | Lectura |
|---|---|---|---|---|---|
| 3 | 0,0 | 0,0 | 0,000 | **0,0** | El ejercicio más fácil posible del eje |
| 12 | 0,0 | 0,0 | 0,093 | 3,7 | Muchos elementos, ninguno parecido |
| 12 | 0,5 | 0,0 | 0,093 | 23,7 | La similitud visual pesa mucho más que la cantidad |
| 12 | 0,0 | 0,5 | 0,093 | 13,7 | La misma proporción, semántica: la mitad de efecto |
| 40 | 0,5 | 0,5 | 0,381 | 45,3 | Configuración intermedia plausible |
| 100 | 1,0 | 1,0 | 1,000 | **100,0** | El máximo del eje |

### F3 — `dificultadTolerada(observaciones, precisionObjetivo)`: la métrica de progreso

**Es el eje de progreso del producto, y no es la precisión.**

Un paciente que acierta el 95% de los objetivos no está progresando: está en un ejercicio
demasiado fácil. El progreso es **cuánta dificultad tolera manteniendo la misma precisión**.

```
Para cada nivel de dificultad d observado:
    precision(d) = aciertos(d) / intentos(d)

dificultadTolerada = max { d : intentos(d) ≥ nMin  ∧  precision(d) ≥ precisionObjetivo }
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `observaciones` | lista de `{ d, acierto }` | longitud ≥ 0 | `d` es `dm` o `dp`, **nunca los dos** |
| `precisionObjetivo` | float, perilla | [0,5, 0,95] · **0,80** | Precisión que se mantiene constante |
| `nMin` | int, perilla | [3, 20] · **5** | Intentos mínimos para que un nivel cuente |
| salida | float **o `undefined`** | [0, 100] o `undefined` | Ver la guarda |

**LA GUARDA, y es de patrón prohibido del proyecto.** Si ningún nivel de dificultad reúne
`nMin` intentos con precisión suficiente, **el resultado es `undefined`**, nunca 0.

`Math.max()` sobre un conjunto vacío devuelve `-Infinity` en JavaScript, y `0` sería peor
todavía: se leería como *"el paciente no tolera ninguna dificultad"*, que es un dato clínico
plausible y devastador, cuando lo que ocurre es que **faltan datos**. Un conjunto vacío en
una medición significa falta de dato, y falta de dato **falla**.

**Un eje a la vez, y esto restringe cómo se usa el producto.** F3 opera sobre **un** eje.
Si dentro de una misma sesión se mueven `t` y `C`, ninguna de las dos métricas es
interpretable: no se sabe a qué eje atribuir el cambio de precisión.

Consecuencia concreta para el sistema 17: **la dificultad adaptativa mueve un solo eje por
sesión.** Se declara aquí porque es una propiedad de la métrica, no de la adaptación.

**Y con `t < 44`, `dificultadTolerada` del eje perceptivo NO se calcula.** Devuelve
`undefined` con motivo `ejesAcoplados`. Es la regla 5 hecha código.

**Ejemplo trabajado.** `precisionObjetivo = 0,80`, `nMin = 5`, eje perceptivo:

| `dp` | intentos | aciertos | precisión | ¿cuenta? |
|---|---|---|---|---|
| 20,0 | 10 | 10 | 1,00 | Sí |
| 40,0 | 10 | 9 | 0,90 | Sí |
| 60,0 | 10 | 8 | 0,80 | **Sí — y es el máximo** |
| 80,0 | 10 | 5 | 0,50 | No, precisión insuficiente |
| 95,0 | 3 | 3 | 1,00 | **No, y esto es lo importante**: solo 3 intentos |

`dificultadTolerada = 60,0`.

La última fila es la razón de existir de `nMin`. Sin ella, tres aciertos por suerte en el
nivel más difícil darían 95,0 y el registro diría que el paciente mejoró un 58% en una
sesión.

### F4 — `resolver(rango, politica)`: del rango al valor

> Excepción declarada a la norma de fórmulas del proyecto: el dominio es una selección, no
> una relación numérica.

```
resolver({ min, max }, 'fija')        = min
resolver({ min, max }, 'adaptativa')  = del sistema 17, acotado a [min, max]
```

| Variable | Tipo | Descripción |
|---|---|---|
| `rango` | `{ min, max }` | Con `min ≤ max`. Degenerado si son iguales |
| `politica` | enum | `'fija'` en el Nivel 0 |
| salida | número | Del tipo de la perilla: entero para `t` y `C`, float para `sv` y `ss` |

**Por qué `fija` devuelve `min` y no el punto medio.** El punto medio sería un valor que el
terapeuta **no ha escrito en ningún sitio**, y tendría que deducirlo. Con `min`, un rango
degenerado y un rango abierto se comportan igual de forma predecible, y lo que el terapeuta
ve en la perilla es lo que el paciente recibe.

## Edge Cases

- **Si `min > max`**: la configuración se **rechaza** al guardarla, nombrando la perilla y
  los dos valores. No se intercambian en silencio: un rango invertido suele ser un error de
  interfaz, y corregirlo por dentro esconde el fallo.
- **Si un valor cae fuera del límite duro**: se **rechaza**, no se recorta. Ver la regla 4.
- **Si `t < 44`**: configuración válida, sesión marcada `ejesAcoplados: true`, métrica del
  eje perceptivo `undefined`. Ver la regla 5.
- **Si `C` es tan grande que el tablero no cabe al `t` elegido**: es un conflicto entre dos
  perillas de **ejes distintos**, y se resuelve **rechazando la combinación**, no ajustando
  una. Quién detecta el conflicto es el sistema 8, que conoce la disposición; este sistema
  solo declara que la resolución no es un ajuste automático. Reducir `C` en silencio movería
  el eje perceptivo porque el terapeuta tocó el motor.
- **Si `sv + ss > 1`**: es legítimo, y no se normaliza. Significa que el terapeuta quiere
  distractores parecidos por las dos vías, y el solapamiento lo resuelve el sistema 8.
- **Si no hay observaciones suficientes**: `dificultadTolerada` es `undefined` con motivo
  `datosInsuficientes`. La pantalla de resultados lo dice; **nunca muestra un 0**.
- **Si dentro de una sesión se movieron los dos ejes**: las dos métricas son `undefined`
  con motivo `ejesMezclados`. El dato de la sesión sigue siendo válido para ver qué pasó;
  lo que no es válido es la métrica de progreso.

## Dependencies

**Dependencias de entrada: ninguna.** Capa Foundation, y por eso va cuarto en el orden de
diseño.

**Sistemas que dependen de este:**

| Sistema | Prioridad | Dureza | Qué necesita |
|---|---|---|---|
| 8 · Generación de tableros | MVP | dura | El vector resuelto |
| 9 · Registro | MVP | dura | El vector, `dm`, `dp` y las marcas |
| 11 · Panel del terapeuta | MVP | dura | Rangos, límites duros y el aviso de la regla 5 |
| 12 · Resultados | MVP | dura | F3, vía el 9 |
| 16 · Presets | VS | dura | El rango como unidad de configuración |
| 17 · Dificultad adaptativa | VS | dura | El rango, F3, y la restricción de un eje por sesión |

**Consistencia bidireccional:** los sistemas 8, 9, 11, 12, 16 y 17 declaran el 4 en el
índice. El **1 no lo declara y es correcto**: este sistema expresa la similitud como
proporciones, y quien consulta el banco es el 8.

## Tuning Knobs

### Perillas clínicas — las mueve el terapeuta, por rango

| Perilla | Rango duro | Propuesto Nivel 0 | Eje | Qué cambia |
|---|---|---|---|---|
| `t` | [24, 140] px | **60** | Motor | Precisión de gesto necesaria. Bajo 44, ver regla 5 |
| `C` | [3, 100] | **12** | Perceptivo | Tamaño del conjunto de búsqueda |
| `sv` | [0, 1] | **0,25** | Perceptivo | Distractores del mismo cluster visual |
| `ss` | [0, 1] | **0,25** | Perceptivo | Distractores de la misma categoría semántica |

Los valores propuestos son un punto de partida seguro: `t = 60` es el recomendado para
control psicomotor reducido, y `C = 12` con similitudes bajas da `dp = 13,7`, holgadamente
en la mitad fácil.

### Perillas de proyecto — NO las toca el terapeuta

| Perilla | Rango | Propuesto | Validación |
|---|---|---|---|
| `wC` | [0, 1] | 0,40 | **Ninguna** |
| `wV` | [0, 1] | 0,40 | **Ninguna** |
| `wS` | [0, 1] | 0,20 | **Ninguna** |
| `precisionObjetivo` | [0,5, 0,95] | 0,80 | **Ninguna**. Candidata a ser clínica más adelante |
| `nMin` | [3, 20] | 5 | **Ninguna** |

**Cinco constantes sin validación empírica en un solo sistema.** Es el número más alto del
proyecto hasta ahora, y hay que decirlo en voz alta: `dm` y `dp` son escalas **ordinales
defendibles**, no medidas calibradas. Comparar el `dp` de un paciente consigo mismo a lo
largo del tiempo es legítimo; comparar el `dp` de dos pacientes distintos, o afirmar que
`dp = 60` es "el doble de difícil" que `dp = 30`, **no lo es**.

Esa limitación tiene que llegar hasta la pantalla del sistema 12, no quedarse aquí.

## Visual/Audio Requirements

**Ninguna propia.** El aspecto de los controles es del sistema 11.

Un requisito **negativo**, que sí es de aquí: la dificultad **no se representa nunca en la
pantalla del paciente**. Sin barra de nivel, sin estrellas, sin indicador de progreso. El
pilar 2 lo exige y el anti-pilar 3 lo refuerza.

## UI Requirements

Tres requisitos para el sistema 11, que salen de reglas de este documento:

1. **Las cuatro perillas se presentan agrupadas por eje**, con los dos grupos visualmente
   separados. Si se presentan como una lista plana de cuatro controles, el terapeuta no
   descubre que son dos ejes, y la capacidad que el pilar 3 le da se queda sin usar.
2. **Al poner `t` por debajo de 44 px, el panel lo dice en una frase**: que la medición del
   eje perceptivo queda acoplada al motor en esa sesión. Informa, no bloquea.
3. **Un rango degenerado y un rango abierto se distinguen a la vista.** Con la política
   `fija` los dos se comportan igual, y confundirlos hará que alguien crea que la adaptativa
   está activa cuando no lo está.

## Acceptance Criteria

> **Ninguno se puede ejecutar hasta que exista `src/dificultad/`.** La infraestructura de
> test ya existe: `npm run check` corre desde el 2026-08-26.

### Las fórmulas

**AC-1 — Canario de F1: la tabla publicada, exacta** · Unit · **BLOCKING**
**DADO** `t = 24, 32, 44, 60, 80, 100, 140` con `tMin = 24` y `tMax = 140`,
**CUANDO** se llama a `dm(t)`,
**ENTONCES** el resultado es **100,0 · 83,7 · 65,6 · 48,0 · 31,7 · 19,1 · 0,0**, a un
decimal.

**AC-2 — `dm` es monótona decreciente y acotada** · Unit · **BLOCKING**
**DADO** todo `t` entero en [24, 140],
**CUANDO** se calcula `dm(t)`,
**ENTONCES** `dm(t) ≥ dm(t+1)` para todo `t`, `dm(24) = 100` y `dm(140) = 0`, y ningún
valor sale de [0, 100].

**AC-3 — Canario de F2: la tabla publicada, exacta** · Unit · **BLOCKING**
**DADO** las seis combinaciones publicadas en F2,
**CUANDO** se calcula `dp`,
**ENTONCES** el resultado es **0,0 · 3,7 · 23,7 · 13,7 · 45,3 · 100,0**, a un decimal.

**AC-4 — `dp` está acotada en los extremos** · Unit · **BLOCKING**
**DADO** `(C, sv, ss) = (3, 0, 0)` y `(100, 1, 1)`,
**CUANDO** se calcula `dp`,
**ENTONCES** el resultado es exactamente **0,0** y **100,0**. Y para 10000 combinaciones
válidas al azar, ningún valor sale de [0, 100].

**AC-5 — Los pesos de F2 suman 1** · Unit · **BLOCKING**
**DADO** los pesos `wC`, `wV` y `wS` del registro de constantes,
**CUANDO** se suman,
**ENTONCES** el total es exactamente 1. Si alguien cambia un peso sin ajustar otro, `dp`
deja de estar acotada en 100 y este criterio lo delata.

### El mecanismo de rango

**AC-6 — Un rango invertido se rechaza** · Unit · **BLOCKING**
**DADO** `{ min: 80, max: 40 }` en cualquier perilla,
**CUANDO** se valida la configuración,
**ENTONCES** lanza nombrando la perilla y los dos valores. **Nunca los intercambia.**

**AC-7 — Un valor fuera del límite duro se rechaza, no se recorta** · Unit · **BLOCKING**
**DADO** `t = 23`, `t = 141`, `C = 2`, `C = 101`, `sv = -0.1` y `ss = 1.1`,
**CUANDO** se validan,
**ENTONCES** los seis lanzan nombrando el valor y el límite. Y **ninguna llamada devuelve
un valor recortado**: no existe una vía que acepte 23 y opere con 24.
*El límite de 24 px es WCAG 2.5.8, no una preferencia de este proyecto.*

**AC-8 — La política `fija` devuelve `min`** · Unit · **BLOCKING**
**DADO** `{ min: 44, max: 100 }` con política `'fija'`,
**CUANDO** se resuelve,
**ENTONCES** el resultado es **44**, no 72 ni ningún punto medio. Y con un rango degenerado
`{ min: 60, max: 60 }` devuelve 60.

### La métrica de progreso

**AC-9 — Canario de F3: el ejemplo trabajado** · Unit · **BLOCKING**
**DADO** las cinco filas del ejemplo trabajado de F3, con `precisionObjetivo = 0,80` y
`nMin = 5`,
**CUANDO** se calcula `dificultadTolerada`,
**ENTONCES** el resultado es **60,0**.
*Y el criterio prueba de paso que la fila de `dp = 95,0` con 3 intentos y precisión 1,00
**no** gana, que es la razón de existir de `nMin`.*

**AC-10 — Sin datos suficientes devuelve `undefined`, NUNCA 0** · Unit · **BLOCKING**
**DADO** una lista de observaciones vacía; y otra donde ningún nivel alcanza `nMin`
intentos; y otra donde ningún nivel alcanza `precisionObjetivo`,
**CUANDO** se calcula `dificultadTolerada`,
**ENTONCES** los tres devuelven `undefined` con motivo `datosInsuficientes`. **Ningún caso
devuelve 0, ni `-Infinity`, ni `NaN`.**
*Es el patrón prohibido del proyecto en su cuarta aparición. Un 0 se leería como "el
paciente no tolera ninguna dificultad": un dato clínico plausible y devastador, cuando lo
que ocurre es que faltan datos.*

**AC-11 — Con `t < 44` la métrica perceptiva no se calcula** · Unit · **BLOCKING**
**DADO** una sesión con `t = 32` y observaciones suficientes en el eje perceptivo,
**CUANDO** se calcula `dificultadTolerada` del eje perceptivo,
**ENTONCES** devuelve `undefined` con motivo **`ejesAcoplados`**, distinto de
`datosInsuficientes`. Y la métrica del eje **motor** sí se calcula.
*Los dos motivos tienen que ser distinguibles: uno se arregla con más sesiones y el otro
con otra configuración.*

**AC-12 — Con los dos ejes movidos, ninguna métrica es válida** · Unit · **BLOCKING**
**DADO** una sesión donde `t` y `C` tomaron más de un valor,
**CUANDO** se calculan las dos métricas,
**ENTONCES** las dos devuelven `undefined` con motivo `ejesMezclados`, y las observaciones
crudas siguen accesibles.

### Invariantes de arquitectura

**AC-13 — No existe un control de dificultad escalar** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de `src/`,
**CUANDO** se buscan firmas o campos con nombre de dificultad escalar configurable
—`nivel`, `dificultad`, `difficulty` como **entrada**—,
**ENTONCES** no aparece ninguno. `dm` y `dp` solo existen como **salida** de F1 y F2.
*Es la regla 1 hecha barrera. El modo de fallo que previene es que alguien añada un control
de "nivel 1 a 10" por comodidad de interfaz y colapse los dos ejes, rompiendo el pilar 3
sin que ningún test funcional lo note.*

**AC-14 — Ninguna perilla es un límite de tiempo** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el conjunto de perillas que este sistema declara,
**CUANDO** se comprueba contra el registro de constantes,
**ENTONCES** son exactamente cuatro clínicas y cinco de proyecto, y **ninguna tiene
unidades de tiempo**. Añadir una rompe el build.

### Infraestructura que falta

| Falta | Nota |
|---|---|
| `src/dificultad/` | Nuevo de este sistema. Módulo puro: no necesita reloj ni aleatoriedad |
| Las cinco constantes en `design/registry/entities.yaml` | `wC`, `wV`, `wS`, `precisionObjetivo`, `nMin` |
| La lista de literales de AC-13 y AC-14 | Cuarta lista del sistema 14, sobre la infraestructura que ya existe |

**Ningún criterio necesita Playwright ni navegador.** Este sistema es aritmética y
validación, y eso es lo que lo hace un buen candidato a implementarse justo después del 3.

## Open Questions

| Pregunta | Quién resuelve | Cuándo |
|---|---|---|
| ¿Los tres pesos de F2 reflejan la dificultad percibida? | Datos reales, vía el sistema 9 | Tras la primera prueba real. Hoy son defendibles y no calibrados |
| ¿`precisionObjetivo = 0,80` es el valor clínicamente útil? | El colaborador | Puede que deba ser una perilla clínica y no de proyecto |
| ¿Hay un quinto eje que falta — por ejemplo memoria de trabajo? | El colaborador, al validar la taxonomía de perfiles | Los instrumentos 22 y 24 pueden necesitarlo. Si aparece, es un eje nuevo, no una perilla dentro de los dos existentes |
