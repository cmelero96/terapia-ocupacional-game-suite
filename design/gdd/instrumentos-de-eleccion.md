# Sistemas 22, 23 y 28 — Instrumentos de elección: símbolos, precio justo y rellenar palabras

| Campo | Valor |
|---|---|
| **Capa** | Instrumento |
| **Hito** | MVP |
| **Estado** | Designed · implementado y ejecutable |
| **Depende de** | 3 (inyección de no determinismo), 5 (capa de entrada), 9 (registro), 11 (panel), 12 (resultados), 32 (eje de contenido) |
| **NO depende de** | **1 (manifiesto del banco de imágenes)** — y esa es la decisión que da forma a este documento |
| **Código** | `src/instrumentos/elegir.js`, `src/contenido/provisional.js` |

## Summary

Un instrumento y tres juegos. Los tres tienen la misma forma —**un estímulo y varias
opciones, una correcta**— así que comparten una sola clase, `Elegir`, y se diferencian sólo
en la fuente de contenido.

## Overview

Este documento cubre tres de los nueve juegos de la lista a la vez, y **eso no es un atajo
de documentación: es la forma real del código.** `Elegir` no sabe si sus opciones son
sílabas, palabras o precios.

| Sistema | Juego | Estímulo | Opciones | Capacidad que carga |
|---|---|---|---|---|
| 28 | Rellenar palabras | `ven_na` | sílabas | Acceso léxico, con la palabra a la vista |
| 22 | Transcribir símbolos | 🚭 | palabras | Lectura de señalización de la vida diaria |
| 23 | Precio justo | 🥖 barra de pan | precios en euros | Estimación de magnitud monetaria |

**Lo que estos tres NO comparten con Busca, Denominación y Clasificar es el banco de
imágenes.** El manifiesto del sistema 1 asume contenido de imagen: clusters visuales,
categorías semánticas, `clusterMin`. Estos tres usan una **segunda fuente de contenido**,
`src/contenido/provisional.js`, que no cuesta 256 SVG porque se escribe.

Y esa es la razón por la que existen tan pronto. Cuando el banco de imágenes está bloqueado
esperando una decisión de producción, estos tres juegos **ya se pueden usar**.

## Player Fantasy

Para el paciente: *«sé la respuesta, y aquí está.»*

Los tres son tareas de **reconocimiento, no de producción**. El paciente no tiene que
generar la palabra: tiene que reconocerla entre varias. Eso es deliberado y es lo que los
separa de Denominación, donde el estímulo es la palabra y hay que encontrar el objeto.

Para un paciente con afasia de expresión, reconocer puede ser posible cuando producir no lo
es, y esa diferencia **es el dato clínico**: el mismo contenido presentado de las dos formas
mide dos cosas distintas.

Lo que el paciente **no** debe sentir en ningún momento: que se le está examinando. Sin
puntuación, sin racha, sin tiempo, y el fallo no se marca.

## Detailed Rules

### R1 — La ronda: un estímulo, `n` opciones, una correcta

Cada ronda es un tablero a efectos de registro. Contiene:

| Campo | Descripción |
|---|---|
| `id` | Identificador estable del elemento de contenido. **Nunca se renombra**: es la clave con la que queda registrado qué vio el paciente |
| `estimuloGlifo` | El símbolo, si lo hay. Vacío cuando el estímulo es sólo texto |
| `estimuloTexto` | El texto del estímulo |
| `correcta` | La opción correcta |
| `opciones` | Todas, **ya barajadas** |
| `semilla` | Para reproducir la ronda exacta |

### R2 — El barajado es del generador, no de la presentación

La opción correcta **no puede aparecer siempre en el mismo sitio**. Es el mismo defecto que
el sistema 10 tuvo y que sólo se vio en el navegador: el objetivo salía siempre en la primera
celda porque la lista se concatenaba sin barajar.

Aquí las opciones salen barajadas **de la fuente**, con la semilla registrada, así que la
posición es reproducible y no depende del orden en que la interfaz las pinte.

### R3 — Un fallo NO avanza de ronda

Fallar registra el intento y **deja la ronda puesta**. El paciente puede volver a intentarlo.

Esto es distinto de Busca, y es a propósito: en Busca hay un objetivo y `C − 1` distractores,
así que insistir es barrido visual. Aquí hay entre 2 y 6 opciones, y avanzar tras un fallo
convertiría el ejercicio en «cuántas rondas ves», no en «cuántas resuelves».

**Y no se marca el fallo.** No hay tachado, ni desactivación de la opción fallada, ni aviso.
La opción sigue ahí, activable otra vez. Un paciente que insiste sobre la misma opción
errónea es un dato del registro, no algo que la pantalla corrija.

### R4 — Los distractores tienen que ser PLAUSIBLES, y cada juego lo define distinto

Es la regla que decide si el ejercicio mide algo. Un distractor que nadie elegiría convierte
cuatro opciones en dos.

| Juego | Regla de plausibilidad | Por qué |
|---|---|---|
| Rellenar | Sílabas del mismo tamaño y forma fonológica | Ver R5 — tiene una trampa propia |
| Símbolos | Palabras de otros símbolos del mismo conjunto | Una palabra al azar del diccionario se descarta sin mirar el símbolo |
| Precio justo | **El precio del MISMO objeto**, multiplicado por factores entre 0,5 y 3 | Ver R6 |

### R5 — En rellenar, el hueco es una SÍLABA, y un distractor no puede ser la misma sílaba sin tilde

Dos reglas, y la segunda apareció al generar la hoja de revisión del terapeuta.

**El hueco es una sílaba, nunca una letra.** Rellenar una letra es ortografía, que es otra
tarea y otra capacidad.

**Y un distractor no puede diferenciarse de la correcta sólo en la tilde.** El caso real:

```
{ id: 'periodico', palabra: 'pe_dico', hueco: 'rió', opciones: ['rió','ria','rio','reo'] }
```

`rio` produce «periodico»: no una no-palabra, sino **la misma palabra mal acentuada**.
Elegirlo no es un error de acceso léxico, es un error de ortografía. Y peor: el paciente que
sabe la palabra y no la tilde recibe un fallo registrado por algo que el ejercicio no dice
medir.

Hay un test que lo impide, y encontró dos casos: `periodico` y `telefono`.

### R6 — En precio justo, los distractores son el mismo objeto

Un precio de otro producto se descarta sin pensar: si el estímulo es una barra de pan y las
opciones son 1,10 €, 8,50 € y 2,90 €, el paciente elimina las dos últimas sin estimar nada.

Los distractores son **el precio del mismo objeto multiplicado**, con factores entre 0,5 y 3.
Así la tarea es estimar la magnitud, que es la capacidad funcional que interesa: reconocer
que algo «cuesta demasiado» es lo que protege a una persona en una tienda.

### R7 — Los precios CADUCAN, y el terapeuta lo ve antes de interpretar un resultado

Los precios llevan su año, y la fuente de precios expone un `aviso` que la página muestra.
Un precio de hace siete años confunde a un paciente que hace la compra cada semana, y un
resultado obtenido con precios caducados no es comparable con uno de hoy.

**Las otras dos fuentes no llevan aviso.** Una sílaba no caduca, y un símbolo de salida
tampoco. El aviso sólo aparece donde hay algo que caduque, porque un aviso permanente se
convierte en ruido y deja de leerse.

### R8 — El número de opciones sale de `C`, acotado a [2, 6]

`C` es la perilla de cantidad del sistema 4, y aquí significa «cuántas opciones». Se acota:

- **Mínimo 2.** Con una opción no hay elección.
- **Máximo 6.** Por encima, la tarea deja de ser reconocimiento y pasa a ser barrido de una
  lista de texto, que es lo que mide Busca. Y con seis opciones de texto a `t = 140` ya no
  cabe una fila legible en la tableta.

El techo es una limitación declarada, no un valor sin razón: **el terapeuta puede pedir
`C = 40` y recibe 6.** El panel lo dice.

**Y hay un segundo techo, más bajo, que pone el CONTENIDO.** Medido: `rellenar` sirve **4
opciones en 300 de 300 rondas** aunque se pidan 6, porque cada palabra tiene cuatro sílabas
candidatas. `simbolos` y `precios` sí llegan a 6.

Sin decirlo, el terapeuta configura una dificultad y el paciente recibe otra — que es
exactamente lo que el pilar 3 protege. **No se corrige rellenando con distractores
implausibles: se avisa.** El panel muestra «el contenido no da para las 6 opciones pedidas:
el paciente ve 4».

### R9 — Los tres declaran lista VACÍA en el eje de contenido

Ninguno de los tres tiene variantes hoy (sistema 32). Podrían tenerlas, y los candidatos
están anotados en el GDD del eje, pero **inventar variantes clínicas sin un terapeuta es peor
que no tenerlas**.

## Formulas

### F1 — `ronda(n, fuenteAleatoria, semilla)`

```
ronda(n, f, s) = {
  correcta,
  opciones: barajar([correcta, ...distractores(n − 1)], f),
  ...
}
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `n` | int | [2, 6] | Opciones pedidas |
| `opciones.length` | int, salida | [2, `n`] | **Puede ser menor que `n`** si el contenido no da tantos distractores plausibles |
| `semilla` | int | — | Registrada. Reproduce la ronda exacta, incluido el orden |

**El rango de salida importa, y no es un caso raro: en `rellenar` es el caso NORMAL.** Medido:
4 opciones en 300 de 300 rondas con `n = 6`. Que `opciones.length < n` es un resultado
legítimo, no un error: si un elemento de contenido sólo tiene tres distractores plausibles,
se sirven tres. La alternativa —rellenar con distractores implausibles— falsearía la
dificultad. Ver R4 y R8.

### F2 — `distractoresDePrecio(euros, n)`

```
distractoresDePrecio(p, n) = primeros(n, [p·f para f en FACTORES]) , FACTORES ⊂ [0,5 , 3]
```

| Variable | Rango |
|---|---|
| `p` | (0, 100) € — un precio de supermercado |
| factor | [0,5 , 3] |
| salida | (0,5·`p` , 3·`p`) |

**Rango de salida comprobado por test** sobre las 12 entradas del catálogo: ningún distractor
sale fuera de [`p`/3,5 , `p`·3,5].

### F3 — `dp` de estos instrumentos

```
dp = dp(C acotada, sv = 0, ss = 0)
```

**`sv` y `ss` son 0 porque no existen aquí.** No hay similitud visual ni semántica entre una
sílaba y otra en el sentido que el sistema 4 define, y fingir un valor sería inventar
dificultad.

**Y aquí está el hallazgo más importante de este documento, que apareció al MEDIRLO y no al
diseñarlo.** No es que la escala sea «más pobre»: es que **el eje de progreso perceptivo no
funciona en estos instrumentos.**

`dp` se normaliza contra `C_MAX = 60`. Con `C` acotada a [2, 6]:

| `C` | `nC` | `dp(C, 0, 0)` |
|---|---|---|
| 3 | 0,0000 | **0** |
| 4 | 0,0175 | 0,7 |
| 5 | 0,0351 | 1,4 |
| 6 | 0,0526 | **2,1** |

**Rango accesible: 2,1 puntos sobre 100.** Busca accede a los 100 completos. Un cambio de 0 a
2,1 en la dificultad tolerada es ruido, no progreso: `dificultadTolerada` se calcula, devuelve
un número, y ese número no mide nada en estos tres instrumentos.

Lo que **sí** mide aquí: **la precisión y la latencia a configuración fija.** El panel lo dice
con esas palabras, para que nadie lea el eje tolerado de un ejercicio de elección como si
fuera comparable con el de Busca.

**Consecuencia de diseño, y no es menor:** los candidatos a variante de contenido de la regla
R3 del sistema 32 dejan de ser opcionales. Sin un eje propio, estos tres instrumentos sólo
tienen dos medidas de progreso —precisión y latencia— y ninguna forma de graduar la tarea.
Decidirlos es trabajo de un terapeuta, y ahora se sabe que hace falta.

## Edge Cases

| Caso | Qué pasa |
|---|---|
| El contenido no da `n − 1` distractores plausibles | Se sirven menos. `opciones.length < n` es válido |
| Un elemento de contenido con `opciones` que no incluye la correcta | **Falla en test.** Es un defecto de datos, y hay una invariante que lo impide |
| `C = 40` en el panel | Se sirven 6 opciones, y el panel declara la limitación |
| `C = 6` en rellenar | Se sirven **4**, y el panel lo dice. Es el caso normal, no una excepción |
| `C = 1` | Se sirven 2. Con una opción no hay elección |
| Catálogo de precios vacío | `RangeError` al construir. Un instrumento sin contenido no arranca |
| El paciente activa la misma opción errónea diez veces | Diez intentos registrados, ninguna marca en pantalla. Es un dato, no un error a corregir |
| Aplicar una configuración a media ronda | La ronda se cierra marcada **incompleta** (bloqueante S4) |
| Un `id` de contenido retirado en un dato antiguo | Se muestra como retirado, no rompe la pantalla |

## Dependencies

| Sistema | Relación |
|---|---|
| **3 — no determinismo** | La semilla y la fuente aleatoria vienen inyectadas. `Elegir` es puro |
| **5 — capa de entrada** | Las cinco vías de acceso funcionan sin que el instrumento sepa cuál |
| **9 — registro** | Un registro por ronda, con `incompleto` y `contenido` |
| **11 — panel** | `C` y `t`. Ningún control propio |
| **12 — resultados** | Sin cambios: la forma de tablero es la misma que la de Busca |
| **32 — eje de contenido** | Los tres declaran lista vacía. Ver R9 |
| **1 — manifiesto del banco** | **NO se depende de él.** Ver Overview |

## Tuning Knobs

| Perilla | Valor | Quién la mueve |
|---|---|---|
| `C` → número de opciones | [2, 6] | El terapeuta |
| `t` | Escalones de ADR-0006 | El terapeuta |
| Contenido de las tres fuentes | 12 elementos cada una, **PROVISIONAL** | **Un terapeuta**, en `docs/revision-contenido.md` |
| Factores de distractor de precio | [0,5 , 3] | Sin validar. Es una hipótesis de plausibilidad |
| Techo de 6 opciones | 6 | Sin validar. Ver R8 |

## Acceptance Criteria

| # | Criterio | Nivel | Estado |
|---|---|---|---|
| AC-1 | Las tres fuentes producen una ronda con la correcta dentro, sin opciones repetidas, para 200 semillas × 5 tamaños | BLOCKING | **Pasa** |
| AC-2 | Rellenar presenta la palabra con hueco, nunca entera | BLOCKING | **Pasa** |
| AC-3 | Los distractores de precio son del **mismo** objeto, dentro de [`p`/3,5, `p`·3,5] | BLOCKING | **Pasa** |
| AC-4 | Sólo la fuente de precios lleva aviso de caducidad | BLOCKING | **Pasa** |
| AC-5 | Un fallo registra y **no** avanza de ronda | BLOCKING | **Pasa** |
| AC-6 | Ningún distractor de sílaba se diferencia de la correcta sólo en la tilde | BLOCKING | **Pasa** — encontró 2 casos reales |
| AC-7 | El hueco reconstruye exactamente la palabra del identificador | BLOCKING | **Pasa** |
| AC-8 | El hueco tiene dos caracteres o más | BLOCKING | **Pasa** |
| AC-9 | Un registro por ronda terminada, ni uno más | BLOCKING | **Pasa** — test de navegador sobre los nueve juegos |
| AC-10 | La página avisa de que el contenido es provisional | ADVISORY | **Pasa** |
| AC-11 | La correcta no aparece siempre en la misma posición | BLOCKING | **Cubierto** por AC-1 (barajado con semilla) |
| AC-12 | `opciones.length < n` no lanza ni rellena con implausibles | BLOCKING | **Pasa** |
| AC-13 | El panel avisa cuando el contenido sirve menos opciones de las pedidas | BLOCKING | **Pasa** |
| AC-14 | El panel avisa de que el eje perceptivo no mide progreso en estos instrumentos | BLOCKING | **Pasa** |

## Lo que este documento NO decide

1. **Si el contenido vale.** Las 12 palabras, 12 símbolos y 12 precios los escribí yo. Están
   en la hoja de revisión, y sin firma de un terapeuta no se usan con un paciente.
2. **Si 12 elementos por familia son suficientes.** Un paciente que viene cada semana los ve
   repetidos, y la repetición produce habituación. Es el problema aparcado del informe
   cruzado, y aquí aparece igual que en el banco de imágenes.
3. **Si los símbolos deben ser emoji.** Varios de los actuales no son señalización
   normalizada: el de escalera (🪜) es una escalera de mano. Sustituirlos es trabajo de arte,
   no de código.
4. **Si el techo de 6 opciones es el correcto.** Sin validar.
5. **Qué variantes de contenido necesitan.** Ya no es una pregunta abierta cómoda: F3
   demuestra que sin eje propio estos tres instrumentos **no tienen medida de progreso
   graduable**. Los candidatos están en R3 del sistema 32, y hacen falta.
6. **Si `C` es la perilla correcta para el número de opciones.** Reusarla evitó inventar una
   perilla, pero arrastra la normalización contra `C_MAX = 60`, que es de dónde sale el eje
   plano de F3. La alternativa —una perilla propia con su propia normalización— es una
   decisión de diseño que no se toma aquí.
