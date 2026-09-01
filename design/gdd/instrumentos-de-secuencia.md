# Sistemas 29 y 30 — Instrumentos de secuencia: ordenar palabras y juego de comprar

| Campo | Valor |
|---|---|
| **Capa** | Instrumento |
| **Hito** | MVP |
| **Estado** | Designed · implementado y ejecutable |
| **Depende de** | 3, 5, 9, 11, 12, 32 |
| **Código** | `src/instrumentos/ordenar.js`, `src/instrumentos/comprar.js` |

## Summary

Los dos primeros instrumentos con **estado que sobrevive a una activación**. En los otros
siete, cada toque cierra un tablero o no cambia nada; aquí un tablero necesita varias
activaciones correctas, y eso trae cuatro problemas que ningún instrumento anterior tuvo.

## Overview

| Sistema | Juego | Tablero | Estado que sobrevive |
|---|---|---|---|
| 29 | Ordenar palabras | Una frase desordenada | Las palabras ya colocadas |
| 30 | Juego de comprar | Una lista y un lineal | Los artículos ya cogidos |

Van juntos porque comparten la estructura, no el contenido: **`n` activaciones correctas en
un orden (ordenar) o en cualquier orden (comprar) cierran un tablero.**

Esa diferencia —orden obligado contra orden libre— es la única que los separa, y es la que
decide qué capacidad carga cada uno.

## Player Fantasy

**Ordenar palabras:** *«sé cómo se dice esta frase.»* El paciente reconstruye una frase de la
vida diaria. La sensación buscada es la de completar algo, no la de acertar un test: la frase
crece a la vista, y cuando está entera aparece otra.

**Juego de comprar:** *«tengo que acordarme de qué me falta.»* Es el único instrumento donde
la sensación buscada incluye **retener algo mientras se hace otra cosa**, y es intencionado:
es la tarea de la vida diaria que más se parece a lo que se está entrenando.

En los dos, lo que el paciente **no** debe sentir es que se le quita algo cuando falla. Ver
R3.

## Detailed Rules

### R1 — Cada paso es un intento; el tablero es la frase o la compra

En ordenar, **cada palabra colocada es un intento registrado**. En comprar, cada artículo
cogido o mal cogido.

Registrar sólo la frase completa perdería el dato que más importa: que un paciente acertó
cuatro palabras de cinco. Con un único intento por frase, cuatro aciertos y un fallo se
registran como «una frase fallada».

**Y el tablero sigue siendo la frase entera, no la palabra.** Esta distinción tuvo un
defecto medido y corregido: `avanza: true` en cada palabra hacía que el registro cerrara un
tablero por palabra, así que una frase de cuatro producía **cuatro registros con el mismo
objetivo y la misma semilla**. El criterio correcto es `tableroNumero`, que sólo cambia
cuando la frase termina.

| Instrumento | Registros antes del arreglo | Después |
|---|---|---|
| Ordenar | 4 para 1 frase | 1 |
| Comprar | 3 para 1 compra | 1 |

### R2 — El orden importa en ordenar, y no importa en comprar

En **ordenar**, la siguiente palabra correcta es una y sólo una. Activar otra es un fallo.

En **comprar**, cualquier artículo de la lista vale en cualquier momento. Coger algo que no
está en la lista es un fallo.

Esto no es un detalle de implementación: **son dos capacidades distintas.** Ordenar carga
secuenciación; comprar carga memoria de trabajo y búsqueda.

### R3 — Un fallo NO retira nada de lo ya hecho

La regla más importante de los dos instrumentos, y la que el estado con memoria pone en
riesgo.

En ordenar, fallar **no deshace** las palabras ya colocadas. En comprar, coger algo que no
toca **no tacha** nada de la lista y **no quita** el artículo pendiente.

**Deshacer sería marcar el fallo**, y el pilar 2 lo prohíbe. Un paciente que ve desaparecer
tres palabras bien colocadas por un cuarto toque recibe un castigo que ningún otro
instrumento le da.

La tentación de implementación es la contraria: «si se equivoca, reinicia la frase». Es más
sencillo de programar y está prohibido.

### R4 — La lista de la compra SE QUEDA VISIBLE

Ocultarla convertiría el ejercicio en memoria pura, que es otra tarea.

La lista se ve entera todo el tiempo. **Lo cogido lleva una marca; lo pendiente no lleva
ninguna.** La asimetría es deliberada: marcar lo pendiente convierte la lista en un
recordatorio de lo que falta, y eso se lee como reproche.

Ocultar la lista es una **perilla futura**, no el comportamiento por defecto. Cuando exista,
será un instrumento distinto midiendo otra cosa, y tendrá que decirlo.

### R5 — Lo hecho desaparece del tablero

En ordenar, la palabra colocada se va del tablero. En comprar, el artículo cogido se va del
lineal.

Dejarlos invitaría a activarlos otra vez, y una segunda activación sobre lo mismo **no es un
dato**: no se registra, y con el elemento a la vista el paciente no tiene forma de saber por
qué no pasa nada.

### R6 — La lista nunca puede ser más larga que el lineal

Si la lista pide un artículo que no está en el lineal, el paciente **no puede completarla, y
no tiene forma de saber que es imposible**.

`nLista` se acota a `C`, y la lista se sortea **del lineal ya sorteado**, no del catálogo. Es
la única forma de garantizarlo por construcción en lugar de por comprobación.

Hay un test que lo verifica sobre 300 semillas.

### R7 — Ninguna frase con palabra repetida

Con una palabra repetida, «cuál de las dos es la siguiente» no tiene respuesta única, y un
acierto se registraría como fallo.

Hay un test que lo impide. **Lo que el test NO puede comprobar** es que la frase admita un
solo orden: «hoy hace mucho calor» y «hace mucho calor hoy» son las dos correctas en español,
y eso lo tiene que ver un humano. Está en la hoja de revisión del terapeuta.

### R8 — La longitud de la frase sale de `C`

`C` es la cantidad del sistema 4, y aquí significa «cuántas palabras». Se elige la frase
**más cercana a `C`** del catálogo, no una al azar.

Si falta una longitud, `Ordenar` cae en la más cercana y el terapeuta cree que configuró una
dificultad que no configuró. Hay un test que comprueba que el catálogo cubre `C` de 3 a 6.

### R9 — La selección en curso NO sobrevive a la pausa

Al abrir el panel, las palabras colocadas y los artículos cogidos se descartan. Reanudar
empieza un tablero nuevo.

Conservar el estado a través de una pausa de duración desconocida significaría medir una
latencia que incluye el tiempo que el terapeuta estuvo hablando.

### R10 — Los dos declaran lista VACÍA en el eje de contenido

Y en ordenar hay un motivo concreto: **la longitud de la frase ya está cubierta por `C`**, así
que probablemente no necesita eje propio. En comprar, el candidato —tamaño de la lista contra
tamaño del lineal— puede ser un segundo uso de `C` o puede ser carga de memoria, que es otra
capacidad. Sin decidir.

## Formulas

### F1 — `frase(C)`

```
frase(C) = argmin_{f ∈ FRASES} |len(f.palabras) − C|
mezcladas = barajar(f.palabras, fuenteAleatoria)  , con mezcladas ≠ f.palabras
```

| Variable | Rango |
|---|---|
`C` | [3, 60] pedida; efectiva [3, 6] por el catálogo actual |
| `len(mezcladas)` | igual a `len(correcta)` |

**La restricción `mezcladas ≠ correcta` importa.** Una frase que sale ya ordenada no es un
ejercicio: el paciente activa las palabras en el orden en que están y acierta sin hacer nada.
Verificado sobre 300 semillas.

### F2 — `compra(C, nLista)`

```
lineal = primeros(C,  barajar(catalogo, f))
lista  = primeros(nLista', barajar(lineal, f))    , nLista' = min(max(nLista, 1), C)
nLista = max(2, round(C / 3))                      (valor por defecto)
```

| Variable | Rango |
|---|---|
| `C` | [2, len(catalogo)] |
| `nLista'` | [1, `C`] — **acotada al lineal**, ver R6 |
| `totalPedido` | suma de los precios de la lista, en € |

### F3 — `dp` de estos instrumentos

```
dp = dp(C acotada, sv = 0, ss = 0)
```

Igual que los instrumentos de elección, y con **el mismo problema medido**: `dp` se normaliza
contra `C_MAX = 60`, así que con `C` efectiva en [3, 6] el rango accesible es de **2,1 puntos
sobre 100**.

**El eje de progreso perceptivo no mide progreso en estos instrumentos.** Lo que mide es la
precisión y la latencia a configuración fija. En comprar hay además una medida propia que hoy
no se explota: **cuántos artículos coge sin fallar antes del primer error**, que es una medida
directa de la carga de memoria de trabajo. Ver «lo que no decide».

## Edge Cases

| Caso | Qué pasa |
|---|---|
| Frase de una sola palabra | No puede desordenarse. El catálogo empieza en 3 |
| `C = 40` en ordenar | Se usa la frase más larga del catálogo, 6 palabras. El terapeuta ve menos dificultad de la que pidió |
| `nLista` mayor que `C` | Se acota a `C`. Ver R6 |
| Catálogo de compra vacío o de un artículo | `RangeError` al construir |
| Dos artículos al mismo precio | La compra funciona, pero **el total no identifica la cesta**. Está declarado en la hoja de revisión: hay un caso hoy |
| Activar una palabra ya colocada | No registra, no cambia nada. Y no puede pasar: ha desaparecido del tablero |
| Activar un artículo ya cogido | Igual |
| Activar algo que no está en el lineal | No registra. Es una activación imposible, no un fallo |
| Aplicar configuración a media frase | La frase se cierra marcada **incompleta**, con los intentos hechos |
| Fallar la última palabra de la frase | La frase no avanza. Los aciertos anteriores siguen colocados |

## Dependencies

| Sistema | Relación |
|---|---|
| **3** | Semilla y fuente inyectadas; los dos instrumentos son puros |
| **5** | Las cinco vías de acceso, sin que el instrumento sepa cuál |
| **9** | **Un** registro por frase o por compra, con `incompleto`. Ver R1 |
| **11** | `C` y `t`. `nLista` se deriva de `C`, no es una perilla propia todavía |
| **12** | Misma forma de tablero que los demás |
| **32** | Los dos declaran lista vacía. Ver R10 |
| **15 — taxonomía de perfiles** | Comprar es el único instrumento que carga la capacidad A9, memoria de trabajo, que el sistema 15 identificó sin instrumento |

## Tuning Knobs

| Perilla | Valor | Quién la mueve |
|---|---|---|
| `C` → palabras de la frase, o artículos del lineal | [3, 6] efectivo en ordenar | El terapeuta |
| `nLista` | `max(2, round(C/3))` | **Derivada, no configurable.** Candidata a perilla propia |
| Catálogo de frases | 12, **PROVISIONAL** | Un terapeuta |
| Catálogo de precios | 12, **PROVISIONAL y CADUCA** | Un terapeuta |
| Ocultar la lista de la compra | **No existe.** Ver R4 | Decisión futura |

## Acceptance Criteria

| # | Criterio | Nivel | Estado |
|---|---|---|---|
| AC-1 | Ordenar elige la frase más cercana a `C` | BLOCKING | **Pasa** |
| AC-2 | La frase nunca se presenta ya ordenada, sobre 300 semillas | BLOCKING | **Pasa** |
| AC-3 | Cada palabra es un intento registrado | BLOCKING | **Pasa** |
| AC-4 | Un fallo no retrocede lo ya colocado | BLOCKING | **Pasa** |
| AC-5 | Lo colocado desaparece del tablero | BLOCKING | **Pasa** |
| AC-6 | La frase en curso no sobrevive a la pausa | BLOCKING | **Pasa** |
| AC-7 | Ninguna frase tiene palabra repetida | BLOCKING | **Pasa** |
| AC-8 | El catálogo cubre `C` de 3 a 6 | BLOCKING | **Pasa** |
| AC-9 | La lista de la compra sale siempre del lineal, sobre 300 semillas | BLOCKING | **Pasa** |
| AC-10 | La lista nunca es más larga que el lineal | BLOCKING | **Pasa** |
| AC-11 | Coger lo que no toca no retira nada de la lista | BLOCKING | **Pasa** |
| AC-12 | La lista queda visible, marca lo cogido y **no** marca lo pendiente | BLOCKING | **Pasa** |
| AC-13 | Completar la lista empieza otra compra | BLOCKING | **Pasa** |
| AC-14 | Una activación repetida sobre lo ya hecho no registra | BLOCKING | **Pasa** |
| AC-15 | Un catálogo demasiado pequeño se rechaza | BLOCKING | **Pasa** |
| AC-16 | El total pedido suma los precios de la lista | ADVISORY | **Pasa** |
| AC-17 | **Un** registro por frase o compra terminada, ni uno más | BLOCKING | **Pasa** — verificado también en la dirección del fallo |

## Lo que este documento NO decide

1. **Si el contenido vale.** Las 12 frases y los 12 artículos los escribí yo. Hoja de
   revisión.
2. **Si una frase admite un solo orden.** El test cubre la causa obvia —palabra repetida— y
   no puede cubrir la real. Ver R7.
3. **Si `nLista` debe ser una perilla propia.** Hoy se deriva de `C`. Separarla daría al
   terapeuta control sobre la carga de memoria independientemente del tamaño del lineal, y eso
   probablemente es lo correcto — pero es una perilla nueva, y añadir perillas tiene coste en
   el presupuesto de 30 segundos.
4. **Si «artículos cogidos antes del primer fallo» debe ser una métrica publicada.** Es la
   medida más directa de memoria de trabajo que produce el proyecto, y hoy el dato está en el
   registro sin que nadie lo calcule. No se añade sin que un terapeuta diga que la usaría.
5. **Si ocultar la lista debe existir como opción.** Ver R4.
6. **Si el eje perceptivo plano se arregla o se acepta.** Mismo problema que los instrumentos
   de elección, misma decisión pendiente.
