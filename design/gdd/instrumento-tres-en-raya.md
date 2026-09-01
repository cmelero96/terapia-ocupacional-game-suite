# Sistema 31 — Tres en raya con cálculo

| Campo | Valor |
|---|---|
| **Capa** | Instrumento |
| **Hito** | MVP |
| **Estado** | Designed · implementado y ejecutable |
| **Depende de** | 3, 5, 9, 11, 12, **32 (eje de contenido)** |
| **Código** | `src/instrumentos/tres-en-raya.js` |

## Summary

Para poner ficha hay que resolver una operación. Es el único instrumento del proyecto con
**partida y con oponente**, y eso obliga a tres decisiones que ningún otro necesitó: el
oponente no compite, el resultado no se anuncia, y la posición sí importa.

## Overview

Un tablero de 3 × 3 y, al lado, una operación con varias respuestas. Acertar la operación da
**derecho a colocar una ficha**. Fallar no coloca, no marca nada, y sortea otra operación.

Es el instrumento más distinto de los nueve, y la razón es que **es un juego con un ganador**.
Todos los demás son tareas: hay algo que encontrar, elegir u ordenar, y cuando se hace, se
hace. Aquí hay un adversario, un final, y un resultado — y el pilar 2 prohíbe casi todo lo
que un juego con ganador normalmente hace.

Este documento es, sobre todo, el registro de cómo se resuelve esa tensión.

## Player Fantasy

*«Estoy jugando a algo, no haciendo un ejercicio.»*

Es la única de las nueve fantasías que apela al juego como juego. Un tres en raya es
reconocible: la mayoría de los pacientes lo han jugado, y esa familiaridad es terapéutica por
sí misma — reduce la sensación de examen que las otras ocho tareas tienen que combatir por
otros medios.

**Lo que el paciente NO debe sentir:** que ha perdido. Ni que ha ganado, y esa mitad es la que
cuesta explicar. Ver R2.

## Detailed Rules

### R1 — El oponente no compite: juega al azar

La máquina elige **al azar entre las casillas libres**, sin estrategia, sin bloquear una raya
del paciente y sin buscar la suya.

**No existe para ganar: existe para que el tablero se llene y la partida tenga forma.**

Una máquina que juega bien convierte esto en una derrota repetida, que es lo contrario del
pilar 2. Y una máquina que se deja ganar es condescendencia, que es peor: un adulto nota
cuándo le están dejando.

El azar resuelve las dos: nadie está midiendo su fuerza contra nada.

**Esto rompe el anti-pilar 1 si se mira mal**, y hay que decirlo: el anti-pilar prohíbe
puntuación comparativa. Una máquina que juega al azar no es puntuación comparativa, pero el
paciente **puede** interpretar el resultado de una partida como una comparación aunque el
producto no la publique. Es un riesgo aceptado, no un problema resuelto.

### R2 — Ganar y perder NO se anuncian

Cuando la partida acaba —tres en raya de cualquiera, o tablero lleno— **empieza otra**. El
tablero se vacía y aparece una operación nueva.

**El registro sabe quién hizo raya. La pantalla del paciente no.** No hay texto, ni sonido, ni
cambio de color, ni anuncio por lector de pantalla.

Es el pilar 2 aplicado a un juego que estructuralmente tiene un ganador, y es la decisión más
incómoda del instrumento. Consecuencias que hay que asumir:

- **Un paciente puede no entender por qué el tablero se vació.** No hay forma de decírselo sin
  decir quién ganó. Se acepta.
- **Un paciente que sí lo entiende puede llevar la cuenta él mismo.** El producto no puede
  impedirlo, y tampoco debería intentarlo.
- **El terapeuta sí ve el resultado**, en el registro. Es un dato clínico legítimo: alguien
  que hace raya está planificando, y eso es información.

### R3 — Acertar da derecho a colocar UNA vez, y se consume

El derecho no se acumula. Acertar dos operaciones seguidas sin colocar no da dos fichas: la
segunda activación de respuesta con derecho pendiente **no registra nada**.

Sin esta regla, un paciente rápido en cálculo llenaría el tablero de una vez y la partida
dejaría de tener estructura.

### R4 — Fallar la operación no coloca, no marca, y sortea otra

Se registra el intento y aparece **otra operación**, sin decir por qué.

Cambiar de operación tras un fallo es deliberado: repetir la misma operación fallada es
insistir sobre un error, y en un instrumento donde el fallo no se marca, el paciente no tiene
forma de saber que se está repitiendo a propósito.

**Consecuencia en el registro, y es la que produce la limitación de R8:** un fallo cierra la
operación en curso. Así que una operación fallada es un tablero cerrado **sin resolver**, y va
al registro marcada `incompleto`.

### R5 — Una casilla ocupada no hace nada, y no es un fallo

Activar una casilla ocupada no registra intento. **Es una acción imposible, no un error.**

La distinción importa para la medición: contarla como fallo bajaría la precisión por algo que
no es una equivocación de cálculo ni de gesto.

### R6 — Las nueve casillas están inactivas hasta que se acierta

Mientras no hay derecho a colocar, las casillas llevan `disabled`. No son alcanzables por
barrido, ni por tabulación, ni por permanencia.

Sin esto, el barrido por pulsador recorrería nueve casillas inertes en cada vuelta, y una
vuelta de barrido pasaría de 4 objetivos útiles a 13 paradas — el ejercicio se volvería
inutilizable justo para la población que más necesita el barrido.

### R7 — La posición SÍ importa, y por eso `C` no aplica

Es el único instrumento donde el tablero no es una rejilla intercambiable: son **nueve
casillas, siempre**, y cuál se elige tiene consecuencia.

`C` se reusa para otra cosa: **cuántas respuestas se ofrecen a la operación**, acotada a
[2, 6].

### R8 — La dificultad aritmética es el eje de contenido, y es ORDINAL

Tres variantes, en orden de dificultad propuesto:

| `id` | Etiqueta | Ordinal |
|---|---|---|
| `sumaHasta10` | sumar hasta 10 | 1 |
| `sumaRestaHasta20` | sumar y restar hasta 20 | 2 |
| `multiplicar` | multiplicar | 3 |

**Es el único instrumento con variantes de contenido hoy** (sistema 32). El ordinal sirve para
ordenar y agrupar, y sobre él no se hace aritmética: hay una barrera de CI que lo vigila.

**El orden lo propuse yo y no está validado.** Con algunos pacientes, restar cuesta más que
multiplicar. Está en la hoja de revisión del terapeuta.

**LIMITACIÓN DECLARADA del registro.** `tableroNumero` cuenta **partidas**, mientras que la
forma de tablero que este instrumento expone describe **la operación en curso**. Así que el
registro de una partida lleva la última operación como objetivo, no todas.

Es coherente con contar una partida como un tablero, pero **los datos de reproducción de ese
registro describen sólo el último paso.** No se arregla aquí: hacerlo bien exige que el
registro admita un tablero con varios estímulos, y eso es un cambio del sistema 9.

### R9 — Los distractores son resultados PLAUSIBLES

Se generan a partir del resultado correcto con desplazamientos de ±1, ±2, ±3 y ±10, se
descartan los negativos y los repetidos, y se barajan.

Un número muy lejano se descarta sin calcular, y la tarea deja de medir aritmética. Verificado
sobre 200 semillas: ningún distractor a más de 10 del correcto, ninguno negativo, ninguno
repetido, y la correcta siempre presente.

### R10 — El derecho a colocar no sobrevive a la pausa

Al abrir el panel se descarta. Reanudar exige acertar otra operación.

## Formulas

### F1 — `hayRaya(casillas)`

```
hayRaya(c) = dueño(l) para la primera l ∈ LINEAS con c[l₀] = c[l₁] = c[l₂] ≠ null
           = null si ninguna
LINEAS = 3 filas + 3 columnas + 2 diagonales = 8
```

| Variable | Rango |
|---|---|
| `casillas` | 9 valores en {`'paciente'`, `'maquina'`, `null`} |
| salida | `'paciente'` \| `'maquina'` \| `null` |

Verificado sobre **las ocho líneas**, una por una, y sobre el caso que un `for` mal escrito
aprueba: dos dueños distintos en la misma línea deben dar `null`.

### F2 — `reto(tipo, fuenteAleatoria)`

```
{ enunciado, resultado } = operacion(tipo, f)
cerca      = [ resultado + d  para d ∈ {1,−1,2,−2,3,−3,10,−10} ]  , filtrado a ≥ 0, sin repetir
opciones   = barajar([ resultado, ...primeros(n−1, barajar(cerca, f)) ], f)
```

| Variable | Rango |
|---|---|
| `n` | [2, 6], de `C` |
| `resultado` | `sumaHasta10`: [2, 10] · `sumaRestaHasta20`: [1, 20] · `multiplicar`: [1, 81] |
| `opciones` | todos ≥ 0, todos a distancia ≤ 10 del resultado, sin repetidos, con el correcto dentro |

**El filtro de negativos no es cosmético.** `sumaRestaHasta20` puede dar `resultado = 1`, y
sin el filtro las opciones incluirían −2 y −9. Un número negativo como opción de un ejercicio
de suma y resta hasta 20 es una tarea distinta.

> **Y aquí había un defecto real, encontrado al medir los rangos para escribir esta tabla.**
> La etiqueta que lee el terapeuta —«sumar y restar hasta 20»— **es una promesa clínica**, y
> el generador la rompía: sorteaba `a` en [1, 19] y `b` en [1, `a` − 1], así que la suma
> llegaba a **37**. El terapeuta elegía «hasta 20» y el paciente recibía «19 + 18».
>
> Peor: **el test lo dejaba pasar** porque comprobaba `resultado >= 0` y nunca el techo.
> Comprobaba lo que no fallaba.
>
> Corregido acotando las dos ramas por separado, porque el límite no es el mismo:
>
> ```
> suma:  a ∈ [1, 19], b ∈ [1, 20 − a]   ->  resultado ∈ [2, 20]
> resta: a ∈ [2, 20], b ∈ [1, a − 1]    ->  resultado ∈ [1, 19]
> ```
>
> El test nuevo comprueba **los operandos y el resultado**, no sólo el resultado: «25 − 5 = 20»
> cumple el techo en el resultado y lo rompe en el enunciado. Verificado sobre 2.000 semillas,
> y verificado también en la dirección del fallo.

### F3 — `dp` de este instrumento

```
dp = dp(C acotada a [3, 60], sv = 0, ss = 0)
```

Mismo problema medido que los otros instrumentos sin banco: con `C` efectiva en [2, 6], el
rango accesible de `dp` es de **2,1 puntos sobre 100**.

**Pero aquí importa menos, y es el único instrumento del que se puede decir eso**, porque tiene
eje de contenido: la graduación de dificultad real está en las tres variantes de aritmética,
no en `dp`. Es exactamente para lo que el sistema 32 existe.

## Edge Cases

| Caso | Qué pasa |
|---|---|
| El paciente hace raya | Se registra, **no se anuncia**, empieza otra partida |
| La máquina hace raya | Igual |
| Tablero lleno sin raya | Empate. Se registra, no se anuncia |
| La jugada del paciente cierra la partida | La máquina **no** responde: la partida ya acabó |
| Sólo queda una casilla libre y la coge el paciente | Tablero lleno, la máquina no juega |
| Activar una casilla sin derecho | No registra. Ver R5 |
| Activar una casilla ocupada | No registra. Ver R5 |
| Acertar dos veces sin colocar | La segunda no registra. Ver R3 |
| `C = 40` | Se ofrecen 6 respuestas |
| `C = 1` | Se ofrecen 2 |
| Cambiar de variante a media partida | La partida se cierra marcada **incompleta**, y empieza otra con la aritmética nueva |
| Una variante inexistente por URL | **Falla**, y el panel se abre mostrando las válidas |
| Una variante retirada en un dato antiguo | Se muestra como retirada, no rompe la pantalla |

## Dependencies

| Sistema | Relación |
|---|---|
| **3** | Semilla y fuente inyectadas. `TresEnRaya` es puro, incluidas las jugadas de la máquina |
| **5** | Las cinco vías de acceso. R6 existe **por** esta dependencia |
| **9** | Un registro por partida, con `incompleto` y `contenido`. Limitación declarada en R8 |
| **11** | `t`, `C` y la variante de contenido |
| **12** | Los resultados **no** muestran partidas ganadas: es un dato del registro, no de la pantalla |
| **32** | El único instrumento que declara variantes |

## Tuning Knobs

| Perilla | Valor | Quién la mueve |
|---|---|---|
| Variante de aritmética | 3, **PROVISIONALES y sin validar el orden** | El terapeuta, en el panel |
| `C` → respuestas ofrecidas | [2, 6] | El terapeuta |
| `t` | Escalones de ADR-0006 | El terapeuta |
| Estrategia de la máquina | **Azar. No configurable** | Nadie. Ver R1 |
| Desplazamientos de distractor | ±1, ±2, ±3, ±10 | Sin validar |
| Tamaño del tablero | 3 × 3. **No configurable** | Nadie |

## Acceptance Criteria

| # | Criterio | Nivel | Estado |
|---|---|---|---|
| AC-1 | `hayRaya` detecta las ocho líneas | BLOCKING | **Pasa** |
| AC-2 | `hayRaya` no confunde dos dueños en la misma línea | BLOCKING | **Pasa** |
| AC-3 | No se puede colocar sin acertar la operación | BLOCKING | **Pasa** |
| AC-4 | Acertar da derecho a colocar **una** vez, y se consume | BLOCKING | **Pasa** |
| AC-5 | Fallar no coloca, registra el intento y sortea otra operación | BLOCKING | **Pasa** |
| AC-6 | Una casilla ocupada no registra y no es un fallo | BLOCKING | **Pasa** |
| AC-7 | La máquina responde tras la jugada del paciente, salvo fin de partida | BLOCKING | **Pasa** |
| AC-8 | La partida acaba, empieza otra, y **el resultado no llega a la pantalla** | BLOCKING | **Pasa** — test de navegador sobre el DOM y los atributos |
| AC-9 | El recuento de partidas cuadra con las partidas jugadas | BLOCKING | **Pasa** |
| AC-10 | Los distractores son plausibles: ≥ 0, a ≤ 10 del correcto, sin repetir, con el correcto dentro, sobre 200 semillas | BLOCKING | **Pasa** |
| AC-11 | Las casillas están inactivas hasta que hay derecho a colocar | BLOCKING | **Pasa** |
| AC-12 | La variante activa viaja en el tablero registrado | BLOCKING | **Pasa** |
| AC-13 | La variante no aparece en la pantalla del paciente ni en sus atributos | BLOCKING | **Pasa** |
| AC-14 | Cambiar de variante cierra la partida marcada incompleta | BLOCKING | **Pasa** |
| AC-15 | El derecho a colocar no sobrevive a la pausa | BLOCKING | **Pasa** |
| AC-16 | La etiqueta de la variante no miente sobre el techo aritmético: ningún operando ni resultado pasa del número que nombra | BLOCKING | **Pasa** — encontró un defecto real |

## Lo que este documento NO decide

1. **Si el orden de las tres variantes es el correcto.** Lo propuse yo. Hoja de revisión.
2. **Si un paciente entiende que el tablero se vacíe sin explicación.** Es la consecuencia
   directa de R2, y sólo se sabe con una persona delante. **Es la pregunta número uno de este
   instrumento para la primera prueba real.**
3. **Si el riesgo del anti-pilar 1 es aceptable.** Ver R1: el producto no publica comparación,
   pero el paciente puede construirla. No hay forma de resolverlo desde el código.
4. **Si el registro debe admitir un tablero con varios estímulos.** Es lo que haría falta para
   arreglar la limitación de R8, y es un cambio del sistema 9, no de este instrumento.
5. **Si hacen falta más variantes de aritmética.** Dividir es la ausencia obvia, y no está
   porque una división con resto es otra tarea.
6. **Si `multiplicar` necesita techo declarado.** Su etiqueta no promete ningún número, así
   que hoy no miente — pero llega a 9 × 9 = 81, y un paciente que multiplica hasta 5 × 5 no
   tiene variante. Es un candidato a dividir la variante en dos.
