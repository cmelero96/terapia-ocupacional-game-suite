# Taxonomía de perfiles funcionales — PROVISIONAL

> **Status**: **Andamio de ingeniería. NO validado clínicamente**
> **Author**: `game-designer`, por delegación explícita del colaborador clínico (sesión 2,
> pregunta 0.2)
> **Last Updated**: 2026-08-26
> **Sistema**: #15 del índice · Clínico · Vertical Slice · esfuerzo M

---

## AVISO, y va primero porque es lo más importante del documento

**Esto no es un instrumento clínico. Es un andamio de ingeniería.**

El colaborador dijo que la taxonomía "no está clara" y delegó en el equipo de desarrollo.
Lo que sigue está construido sobre criterios que se pueden defender —terminología estándar
de terapia ocupacional y literatura de búsqueda visual— pero **nadie con formación clínica
ha validado ni una fila**.

Existe por una razón concreta: **es mucho más fácil corregir una tabla que inventarla de
cero.** Cuando el colaborador la revise, va a tachar y reescribir, y eso es exactamente lo
que se busca.

### Tres reglas que se derivan del aviso, y que son vinculantes

1. **El producto NO sugiere ejercicios por perfil mientras esta taxonomía siga sin
   validar.** El terapeuta elige y configura a mano; el sistema recuerda lo que eligió y
   nada más.
2. **Ninguna etiqueta de este documento se muestra al paciente.** Nunca. Ni la capacidad,
   ni la limitación, ni el perfil.
3. **Ninguna etiqueta se muestra al terapeuta como recomendación.** Como vocabulario para
   organizar sus propios presets, sí, cuando exista el sistema 16.

**Cuando la validación llegue, este documento se reescribe y cambia de Status.** Hasta
entonces, un `/gate-check` que dé por buena cualquier función basada en estas filas está
aplicando mal la puerta.

---

## Por qué la etiqueta diagnóstica no sirve

El colaborador dio la población: **personas mayores** y **adultos con diversidad funcional
del neurodesarrollo** (autismo, TDAH y similares). Y fue explícito en que los niños no son
un perfil del producto.

Pero eso son **categorías diagnósticas**, y para emparejar paciente con ejercicio no
sirven, por dos razones:

- **Dos personas con el mismo diagnóstico necesitan cosas distintas.** Dos pacientes con
  TDAH pueden diferir más entre sí en atención sostenida que uno de ellos con un paciente
  de 78 años.
- **El producto no puede leer un diagnóstico.** Lo que el producto configura son cuatro
  perillas. Lo que necesita saber es **qué capacidad se quiere entrenar** y **qué
  limitación hay que respetar**.

Así que la taxonomía tiene **dos ejes**, y no son los mismos dos que el modelo de
dificultad:

| Eje | Pregunta | Afecta a |
|---|---|---|
| **Capacidad a entrenar** | ¿Qué se quiere que mejore? | Qué **instrumento** se elige |
| **Limitación a respetar** | ¿Qué no se puede exigir? | Qué **configuración** es admisible |

Y esa separación es la aportación real de este documento: **la capacidad elige el
instrumento; la limitación acota el espacio de configuración.** Son decisiones distintas y
hoy están mezcladas en la cabeza del terapeuta.

---

## Eje A — Capacidades a entrenar

| # | Capacidad | Qué se observa | Instrumento del primer hito |
|---|---|---|---|
| A1 | **Precisión motora fina** | Acertar objetivos pequeños sin fallar al lado | 10 Busca, con `t` bajo |
| A2 | **Coordinación ojo-mano** | Llegar a un objetivo visto, en un solo gesto | 10 Busca |
| A3 | **Tiempo de reacción** | Cuánto tarda desde que aparece hasta que activa | Los tres, vía latencia |
| A4 | **Atención sostenida** | Mantener el rendimiento a lo largo de la sesión | Los tres, vía deriva de precisión |
| A5 | **Atención selectiva** | Filtrar distractores parecidos | 10 Busca, con `sv` alto |
| A6 | **Discriminación visual** | Distinguir formas parecidas | 10 Busca, con `sv` alto |
| A7 | **Categorización semántica** | Agrupar por significado | 21 Clasificar |
| A8 | **Acceso léxico / denominación** | Nombrar un objeto visto | 24 Denominación |
| A9 | **Memoria de trabajo** | Retener un objetivo mientras busca | **Ningún instrumento del primer hito** |

**A9 no tiene instrumento, y eso es un hallazgo, no un hueco que rellenar.** Los tres
instrumentos del primer hito muestran el objetivo **a la vez** que los distractores, así
que ninguno carga memoria de trabajo. Si el colaborador dice que es una capacidad
prioritaria, hace falta un instrumento nuevo — objetivo mostrado y retirado antes del
tablero —, y eso es un **eje de dificultad nuevo**, no una perilla dentro de los dos
existentes. El sistema 4 ya dejó esa pregunta abierta.

**A5 y A6 son distintas y se configuran igual, y eso es sospechoso.** Las dos suben con
`sv`. Si el colaborador confirma que son objetivos clínicos distintos, el modelo de
dificultad necesita separarlas — probablemente `sv` sobre forma frente a `sv` sobre color o
textura. Queda como pregunta.

---

## Eje B — Limitaciones a respetar

Cada limitación **acota el espacio de configuración**. Es la parte de esta taxonomía que sí
tiene consecuencia inmediata en el código, porque los rangos ya existen.

| # | Limitación | Acota | Cómo |
|---|---|---|---|
| B1 | **Control psicomotor reducido** | `t` | **Mínimo 60 px.** Y si baja de 44, la sesión se marca `ejesAcoplados` |
| B2 | **Baja visión** | `t`, contraste | `t` alto; el contraste de 4,5:1 ya es vinculante para todos |
| B3 | **Daltonismo** | El banco | La regla de que el color no separa clusters ya lo cubre para todos |
| B4 | **Sensibilidad sensorial** | Estímulo, audio | Modo de estímulo reducido (sistema 6) y silencio (sistema 7). **Confirmada en la población** |
| B5 | **Fatiga rápida** | Duración | Sesiones cortas. **No hay perilla de duración**, y no debe haberla: el terapeuta cierra |
| B6 | **Comprensión verbal limitada** | Instrucciones | Sin texto como única vía. Afecta al sistema 11 |
| B7 | **Un solo punto de activación** | Vía de acceso | Pulsador por barrido. `C` bajo: por encima de 30 el barrido deja de cumplir la vuelta |
| B8 | **Lentitud de procesamiento** | Nada, y es importante | **No se acota nada.** El anti-pilar 2 prohíbe el límite de tiempo, así que la lentitud no penaliza |
| B9 | **Perseveración o rigidez** | Variabilidad | Estructura predecible. Sin cambios de disposición entre tableros |
| B10 | **Impulsividad** | Nada | El pilar 2 ya lo cubre: un fallo no se marca, así que activar rápido y mal no castiga |

**B8 y B10 no acotan nada, y ese es el resultado interesante.** Las dos limitaciones que en
un producto convencional exigirían adaptaciones especiales **ya están cubiertas por los
anti-pilares**. Que el diseño se anticipara a ellas sin haberlas enumerado es una señal de
que los anti-pilares estaban bien elegidos.

---

## El emparejamiento

**No es una matriz de A × B.** Es un procedimiento de tres pasos, y en el primer hito los
tres los hace el terapeuta a mano:

1. **La capacidad elige el instrumento.** Una capacidad, un instrumento. Ver el eje A.
2. **Las limitaciones acotan los rangos.** Se aplican **todas** las que el paciente tenga, y
   cuando dos chocan, **gana la más restrictiva**. Un paciente B1 + B7 tiene `t ≥ 60` y
   `C ≤ 30`.
3. **Dentro de lo que quede, el terapeuta configura.** Ese espacio es lo que el pilar 3 le
   da, y ninguna automatización debe estrecharlo más.

### El conflicto que hay que saber de antemano

**B1 y B7 juntos tensan el tablero.** Control psicomotor reducido pide `t ≥ 60`; un solo
punto de activación pide `C ≤ 30` para que el barrido sea tolerable. **60 px × 30 objetivos
con separación** es mucha superficie, y puede no caber en la tableta.

Lo detecta el sistema 8, que conoce la disposición, y lo **rechaza** en lugar de ajustar
—porque ajustar movería una perilla clínica que el terapeuta no tocó. Pero es un conflicto
previsible en un perfil **plausible y frecuente**, no un caso raro, así que el sistema 11
debe avisar **antes** de que el paciente esté delante.

---

## Qué necesita validación, en orden de importancia

| # | Pregunta para el colaborador | Qué desbloquea |
|---|---|---|
| 1 | ¿Falta alguna capacidad? ¿Sobra alguna? | La lista del eje A |
| 2 | ¿**A9, memoria de trabajo**, es prioritaria? | Si sí, hace falta un instrumento nuevo y un tercer eje de dificultad |
| 3 | ¿**A5 y A6** son objetivos distintos? | Si sí, `sv` tiene que separarse en dos perillas |
| 4 | ¿El mínimo de **60 px** para B1 es correcto? | Es el valor más consecuente de la tabla y está elegido, no medido |
| 5 | ¿Qué limitaciones aparecen juntas de verdad? | Decide qué conflictos merecen aviso en el panel |
| 6 | ¿Este vocabulario le sirve para pensar? | Si no, la taxonomía se reescribe con el suyo, y esta se tira |

**La pregunta 6 es la que decide si este documento vale.** Si el colaborador no reconoce su
propio trabajo en estas palabras, la tabla es correcta y **inútil**, y lo honesto es
tirarla.

---

## Interacciones

| Sistema | Qué le da esto |
|---|---|
| 4 · Dificultad | Los límites por limitación del eje B. **Ya son aplicables**, sin validar la parte del eje A |
| 5 · Entrada | B7 elige la vía de acceso |
| 6, 7 · Estímulo y silencio | B4, confirmada en la población |
| 11 · Panel | El aviso del conflicto B1 + B7, y el vocabulario para agrupar controles |
| 16 · Presets | Un preset es un punto dentro del espacio que el eje B acota |
| 10, 21, 24 · Instrumentos | El eje A dice qué instrumento entrena qué |

## Acceptance Criteria

**AC-1 — Ningún módulo de `src/` decide un ejercicio a partir de un perfil** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de `src/`,
**ENTONCES** no existe ninguna función que reciba un perfil y devuelva una configuración.
*Es la regla 1 del aviso hecha barrera. Se retira el día que la taxonomía se valide, y no
antes.*

**AC-2 — Ninguna etiqueta de perfil llega a la vista del paciente** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** los módulos de la vista del paciente,
**ENTONCES** no importan nada de la taxonomía.

**AC-3 — Los límites del eje B son aplicables sin validación del eje A** · Unit · **BLOCKING**
**DADO** un paciente con B1 y B7,
**CUANDO** se calcula el espacio de configuración admisible,
**ENTONCES** `t ≥ 60` y `C ≤ 30`, y la combinación se marca como **posible conflicto de
disposición**.
*El eje B es la mitad de este documento que sí se puede usar hoy: son límites, no
recomendaciones, y salen de WCAG y de las tres restricciones que ya están en el código.*
