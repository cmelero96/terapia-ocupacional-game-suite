# Sistema 32 — Eje de contenido: la dificultad que no es motora ni perceptiva

| Campo | Valor |
|---|---|
| **Capa** | Clínico |
| **Hito** | MVP |
| **Estado** | Designed |
| **Depende de** | 4 (modelo de dificultad), 9 (registro), 11 (panel) |
| **Del que dependen** | 22, 23, 28, 29, 30, 31 — los seis instrumentos de contenido |

## Summary

Un tercer eje de dificultad, **ordinal y local a cada instrumento**, para la dificultad que
no cabe en los dos ejes del sistema 4. «Sumar hasta 10» contra «multiplicar» no es una
diferencia de tamaño de objetivo ni de parecido entre distractores: es otra cosa, y hoy vive
fuera del modelo.

## Overview

El sistema 4 tiene dos ejes: **motor** (`dm`, del tamaño del objetivo) y
**perceptivo-cognitivo** (`dp`, de la cantidad y del parecido). Los dos son independientes a
propósito, y el pilar 3 depende de que lo sigan siendo.

Seis de los nueve instrumentos tienen una dificultad que **ninguno de los dos captura**. El
caso claro es el tres en raya: el paciente resuelve una operación para poner ficha, y
«3 + 4» y «7 × 8» no se distinguen por el tamaño de las cifras ni por su parecido.

Hoy eso está aparcado a un lado del modelo: `TIPOS_OPERACION` es un enum en el módulo de
contenido, el instrumento lo recibe por parámetro, y **el registro no lo guarda**. O sea que
una sesión de tres en raya no dice a qué aritmética jugó el paciente, y dos sesiones a
dificultades aritméticas distintas se comparan como si fueran la misma.

Este sistema le da sitio en el modelo, **sin convertirlo en un número que se pueda promediar
con los otros dos**.

## Player Fantasy

Esta sección no aplica en el sentido habitual: el usuario del eje es el terapeuta, no el
paciente. El paciente **no debe notar nada**. Cambiar de «sumar hasta 10» a «multiplicar» no
cambia la interfaz, ni el acuse de recibo, ni el silencio ante el fallo.

Para el terapeuta, la sensación buscada es: *«elijo la operación que quiero trabajar, y sé
que la comparación entre sesiones sigue siendo válida porque el sistema sabe cuál elegí».*

## Detailed Rules

### R1 — El eje es ORDINAL, no de intervalo

Un nivel de contenido tiene un orden (`multiplicar` es más difícil que `sumaHasta10`) pero
**no una distancia**. Nadie sabe si el salto de sumar a restar es «el mismo» que el de restar
a multiplicar, y no hay forma de averiguarlo sin un estudio que este proyecto no va a hacer.

De ahí sale la restricción central, y es la que más protege:

> **Sobre el nivel de contenido no se hace aritmética.** No se promedia, no se interpola, no
> se convierte a porcentaje, y no entra en `dp` ni en `dm`. Solo se **agrupa** y se
> **ordena**.

Un `dc = 2,4` no significa nada, y un «dificultad total = 0,4·dm + 0,4·dp + 0,2·dc» es
exactamente el control escalar que la barrera AC-13 del sistema 4 prohíbe: colapsa en un
número tres cosas que el terapeuta necesita mover por separado.

### R2 — El eje es LOCAL a cada instrumento

Los niveles de un instrumento **no son comparables con los de otro**. «Nivel 2» del tres en
raya y «nivel 2» de rellenar palabras no tienen ninguna relación.

Por eso el eje no es una escala del producto: es una **lista ordenada que cada instrumento
declara**, con identificadores estables.

### R3 — Un instrumento puede no tener niveles, y eso es lo normal

Hoy **solo el tres en raya tiene niveles**. Busca, denominación y clasificar no los
necesitan: su dificultad *es* los dos ejes. Y los otros cinco instrumentos de contenido
—rellenar, símbolos, precios, ordenar, comprar— **podrían** tenerlos y todavía no los tienen.

Esto es deliberado, y es la misma disciplina que el contenido provisional: **inventar niveles
clínicos sin un terapeuta es peor que no tenerlos.** Un instrumento sin niveles declara la
lista vacía, y el panel no le muestra ningún control.

Candidatos anotados, **para que los decida un terapeuta, no yo**:

| Instrumento | Candidato a nivel | Por qué no está decidido |
|---|---|---|
| Rellenar palabras | Posición de la sílaba (inicial, media, final), o frecuencia de la palabra | Las dos son hipótesis de dificultad, no hechos. La frecuencia léxica en español necesita una fuente |
| Símbolos | Señal normalizada contra pictograma libre | Requiere sustituir los emoji por señalización real primero |
| Precio justo | Rango de precio, o número de decimales | El decimal puede ser aritmética disfrazada |
| Ordenar palabras | Longitud de la frase | **Ya está cubierto por `C`**, así que probablemente no necesita eje propio |
| Comprar | Tamaño de la lista contra tamaño del lineal | Puede ser un segundo uso de `C`, o carga de memoria, que es otra capacidad |

### R4 — El nivel viaja en el registro, junto a cada tablero

Cada tablero registrado lleva su nivel de contenido, o `null` si el instrumento no tiene
ninguno. Sin esto, el eje no sirve para nada: el terapeuta lo configura y el dato se pierde.

### R5 — El progreso se mide DENTRO de un nivel, nunca cruzándolo

`dificultadTolerada` responde: *¿cuál es la dificultad más alta que el paciente tolera
manteniendo la precisión objetivo?* Si mezcla intentos de «sumar hasta 10» con intentos de
«multiplicar», el número no significa nada.

**Consecuencia que hay que decir en voz alta, porque es un coste real:** particionar por
nivel **reduce los intentos disponibles en cada celda**. Con `N_MIN = 5` intentos mínimos por
nivel de dificultad, añadir una partición hace que haga falta más sesión para que la métrica
tenga dato. La respuesta correcta cuando falta dato ya existe y es `datosInsuficientes`, no
un número inventado.

Es el mismo intercambio que el proyecto ya eligió dos veces: **antes falta de dato que dato
falso.**

### R6 — Cambiar de nivel es un cambio de configuración, con todas sus consecuencias

Cambiar el nivel a mitad de sesión pasa por el mismo camino que cambiar `t` o `C`: el tablero
en curso se cierra marcado incompleto, y el siguiente usa el nivel nuevo. No hay una vía
especial.

### R7 — El paciente nunca ve el nivel

No aparece en la pantalla del paciente, ni en el nombre del ejercicio, ni por lector de
pantalla. Un «nivel 3» visible es una etiqueta de capacidad, y eso rompe el pilar 2 igual que
marcar un fallo.

## Formulas

### F1 — `nivelesDe(instrumento)`

```
nivelesDe(instrumento) -> [ { id, etiqueta, ordinal } ]
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `id` | string, kebab-case | estable, nunca se renombra | Clave con la que se guarda el dato. Misma regla que un identificador del banco |
| `etiqueta` | string | — | Lo que lee el terapeuta. **Sí** se puede cambiar |
| `ordinal` | int | [1, n] | Orden de dificultad. **Solo para ordenar y agrupar** |

**Rango de salida:** lista, posiblemente **vacía**. Una lista vacía significa «este
instrumento no tiene eje de contenido», y es un resultado válido, no un error.

### F2 — `nivelValido(instrumento, id)`

```
nivelValido(instrumento, id) = id ∈ ids(nivelesDe(instrumento))
```

Un `id` que no está en la lista **falla**. No se sustituye por el primer nivel: un nivel
plausible e inventado es la forma de defecto que este proyecto persigue, y aquí el valor
sustituido decidiría a qué aritmética juega un paciente.

### F3 — `celdasDeProgreso(sesion)`

```
celdasDeProgreso(sesion) = agrupar(sesion.tableros, por: (dm, dp, contenido.id))
```

La clave de agrupación **añade `contenido.id`** a las dos que ya había. `null` es una clave
legítima: agrupa los tableros de instrumentos sin eje de contenido.

**No hay fórmula que combine los tres ejes en un número.** Su ausencia es la decisión.

## Edge Cases

| Caso | Qué pasa |
|---|---|
| Instrumento sin niveles | La lista es vacía. El panel no muestra control, y el registro guarda `null` |
| El terapeuta no elige nivel | Se usa el de `ordinal` 1, **el más fácil**. Si hay que equivocarse, se equivoca hacia el lado que no frustra al paciente |
| Un `id` de nivel desconocido llega por URL | **Falla y el panel se abre mostrando el conflicto.** Es el mismo camino que una `C` irrealizable |
| Un `id` de nivel desconocido llega en un dato ANTIGUO del registro | **No falla.** Se muestra como «nivel retirado: `<id>`». Misma regla que un id desconocido del banco: un dato viejo incompleto es aceptable, una pantalla que se rompe al abrirlo no |
| Se retira un nivel del catálogo | Los datos que lo referencian **se conservan**. Un `id` no se reutiliza nunca para otro nivel |
| Un tablero incompleto con nivel | Se registra igual, marcado incompleto. Los dos campos son independientes |
| Todos los tableros de un nivel son incompletos | `dificultadTolerada` de ese nivel da `datosInsuficientes`, no un número bajo |

## Dependencies

| Sistema | Qué necesita de él, o le da |
|---|---|
| **4 — modelo de dificultad** | El eje **no entra** en `dm` ni en `dp`. La dependencia es que el sistema 4 siga teniendo dos ejes y no tres |
| **9 — registro** | Añade `contenido` a `TableroRegistrado`, y `contenido.id` a la clave de agrupación de `dificultadTolerada` |
| **11 — panel** | Un control de escalones más, visible **solo** si el instrumento declara niveles |
| **12 — resultados** | Cuando hay más de un nivel en la sesión, la pantalla lo dice: los números de niveles distintos no se suman |
| **31 — tres en raya** | El único que hoy declara niveles |
| **22, 23, 28, 29, 30** | Declaran lista vacía, con los candidatos anotados en R3 |

## Tuning Knobs

| Perilla | Valor | Quién la mueve |
|---|---|---|
| Lista de niveles por instrumento | Ver R3 | **Un terapeuta.** Hoy solo el tres en raya tiene lista, y es provisional |
| Nivel activo en la sesión | El del ordinal 1 por defecto | El terapeuta, en el panel |
| `N_MIN` por celda de progreso | 5, heredado del sistema 4 | Sin validar. Puede tener que subir al particionar más |

## Acceptance Criteria

| # | Criterio | Nivel | Cómo se comprueba |
|---|---|---|---|
| AC-1 | Un instrumento sin niveles declara lista vacía y el panel no le muestra control | BLOCKING | Test de navegador, los nueve instrumentos |
| AC-2 | El nivel activo viaja en cada tablero registrado | BLOCKING | Test unitario |
| AC-3 | **Ninguna operación aritmética toca el ordinal.** Ni suma, ni media, ni porcentaje | BLOCKING | **Barrera de CI**: el ordinal no aparece en ninguna expresión aritmética en `src/` |
| AC-4 | `dificultadTolerada` particiona por `contenido.id` | BLOCKING | Test unitario: dos niveles con precisiones distintas dan dos métricas, no una media |
| AC-5 | Un `id` desconocido por URL falla; uno en un dato antiguo no rompe la pantalla | BLOCKING | Dos tests unitarios, uno por dirección |
| AC-6 | El nivel no aparece en la pantalla del paciente, ni en el árbol de accesibilidad | BLOCKING | Test de navegador sobre el DOM del tablero |
| AC-7 | Cambiar de nivel cierra el tablero en curso marcado incompleto | BLOCKING | Test de navegador |
| AC-8 | El valor por defecto es el ordinal 1, el más fácil | ADVISORY | Test unitario |
| AC-9 | Cuando la sesión tiene más de un nivel, los resultados lo dicen | ADVISORY | Test unitario del texto |

## Lo que este documento NO decide

1. **Los niveles de los otros cinco instrumentos.** Ver R3. Los inventaría yo, y ese es el
   error que la hoja de revisión de contenido existe para no repetir.
2. **Si los tres niveles de aritmética del tres en raya son los correctos.** Son
   `sumaHasta10`, `sumaRestaHasta20` y `multiplicar`, y los elegí yo. Van a la hoja de
   revisión del terapeuta.
3. **Si `N_MIN = 5` sigue valiendo** al añadir una partición. Es empírico.
4. **Si hace falta un cuarto eje.** La carga de memoria de trabajo del juego de comprar
   —capacidad A9 del sistema 15— no es motora, ni perceptiva, ni de contenido. Puede que sea
   un eje, o puede que sea `C` mirado de otra forma. **No se decide aquí**, y meterla a la
   fuerza en el eje de contenido sería el mismo error que el sistema 4 cometió al no dejar
   sitio para la aritmética.
