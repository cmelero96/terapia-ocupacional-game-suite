# Generación de tableros

> **Status**: In Design
> **Author**: Carlos + `systems-designer`, `gameplay-programmer`
> **Last Updated**: 2026-08-26
> **Sistema**: #8 del índice · Instrumento · MVP · capa Core · esfuerzo **M**
> **Implements Pillar**: **4 — el contenido combinatorio nunca se escribe a mano**

## Overview

Convierte un vector de dificultad en un tablero concreto: **un objetivo y `C − 1`
distractores**, con las proporciones de similitud que el terapeuta pidió, reproducible a
partir de su semilla.

```
{ t, C, sv, ss }  +  semilla  +  manifiesto  ──▶  { objetivo, distractores[], svEfectiva, ssEfectiva }
```

Devuelve **datos, nunca coordenadas de píxel**: lo fija ADR-0005, la disposición es del
CSS. Y es puro: la fuente aleatoria y el manifiesto llegan como parámetros.

Su trabajo real son dos cosas que suenan pequeñas y no lo son: **resolver el solapamiento
entre los dos ejes de similitud**, que el sistema 4 le delegó por escrito, y **agotar el
pool sin reemplazo** para que el techo de repeticiones sea duro y no una media.

## Player Fantasy

**Del paciente: que el tablero no se repita.** Es lo único que percibe de este sistema, y
lo percibe solo si falla. Un tablero repetido no se ve como un fallo del software: se ve
como que ya sabe dónde está la respuesta, y la medición de esa ronda ya no mide nada.

**Del terapeuta: que la perilla que ha movido sea la que se note.** Si sube la similitud
visual y lo que cambia es la cantidad, el pilar 3 está roto aunque los números cuadren.

## Detailed Rules

### Core Rules

1. **Los dos ejes de similitud controlan grupos DISJUNTOS.**

   | Grupo | Pool | Cuántos |
   |---|---|---|
   | Visual | El cluster del objetivo, menos el objetivo | `nV = round(sv · nD)` |
   | Semántico | Las categorías del objetivo, **menos su cluster**, menos el objetivo | `nS = round(ss · nD)` |
   | Resto | Todo lo demás | `nD − nV − nS` |

   Restar el cluster del pool semántico es lo que hace que las dos perillas tengan efectos
   **independientes y sumables**. Sin eso, un elemento del mismo cluster *y* la misma
   categoría contaría en las dos y el terapeuta no sabría qué ha movido.
2. **Si `sv + ss > 1`, gana la visual y la semántica se queda con lo que sobre.**

   El sistema 4 declaró que `sv + ss > 1` es legítimo y no se normaliza, y delegó aquí la
   resolución. La visual tiene prioridad porque su peso en `dp` es el doble
   (`wV = 0,40` contra `wS = 0,20`): es el eje que el terapeuta nota más, así que es el que
   debe cumplirse.

   ```
   nV = min( round(sv · nD) ,  nD )
   nS = min( round(ss · nD) ,  nD − nV )
   ```
3. **El tablero devuelve las proporciones EFECTIVAS, y el registro usa esas.**

   Es la regla más importante de este documento, y no estaba en ningún sitio.

   `dp` se calcula a partir de `sv` y `ss` **pedidas**. Y hay exactamente **dos** casos en
   que lo conseguido es otra cosa:

   | Caso | Qué pasa |
   |---|---|
   | **`sv + ss > 1`** | La semántica se recorta por la regla 2. `ssEfectiva < ss` |
   | **Un pool vacío** — un cluster cuyo único elemento activo es el objetivo | No hay de dónde sacar. `svEfectiva = 0` |

   **Un cluster pequeño pero no vacío NO reduce la proporción**, y esto solo se vio al
   implementar: la regla 4 reutiliza, así que un pool de un solo elemento da los nueve
   distractores pedidos. Lo que cambia es la variedad, no la proporción.

   Si el registro guarda la pedida y el paciente vio otra cosa, **`dp` miente**, y miente
   siempre hacia arriba porque las proporciones solo pueden bajar.

   Así que el tablero devuelve `svEfectiva` y `ssEfectiva`, y **el sistema 9 registra `dp`
   recalculada con esas**. La pedida se guarda también, y la diferencia es un dato: significa
   que la configuración no era realizable con el banco que hay.
4. **Muestreo sin reemplazo, agotando y rebarajando DENTRO de un tablero.**

   Es lo que el F3 del sistema 1 exige para que el techo de repeticiones sea **duro por
   semilla** y no una media. El cursor nace y muere dentro de un tablero: no hay estado que
   sobreviva entre tableros, y por eso la semilla sola reproduce el tablero.

   El techo es `ceil(n / |pool|)` apariciones de cada elemento. Con el pool visual de 23 y
   90 distractores, son 4 — que es exactamente `Rmax`, de donde salió `clusterMin = 24`.
   **Corregido el 2026-09-01, ADR-0006:** los 90 venían de `distractores()`, una fórmula
   muerta; el código hace `nD = C − 1`. Con `Cmax = 60`, `clusterMin = 16`.
5. **Un objetivo, siempre exactamente uno.** El instrumento decide cuál es el correcto; este
   sistema garantiza que hay uno y solo uno, y que **no aparece también como distractor**.
6. **Un tablero se reproduce con la semilla más la configuración más la versión del
   manifiesto.** Nada más. Si con esos tres el tablero sale distinto, es un defecto.
7. **Nada de este sistema mira el reloj.** Un tablero no depende de cuándo se genera. Es lo
   que hace que reproducir uno de la sesión 4 dé el mismo resultado en la sesión 12.

### Qué NO es de este sistema

| No es de aquí | De quién es |
|---|---|
| Qué objetivo es el correcto para el ejercicio | El instrumento: 10, 21, 24 |
| Dónde se coloca cada elemento en pantalla | CSS. ADR-0005 y F3 del sistema 2 |
| Obtener la fuente aleatoria | Sistema 3. Aquí llega como parámetro |
| Guardar el tablero y su semilla | Sistema 9 |
| El conflicto entre `C` y `t` cuando el tablero no cabe | **Sí es de aquí**: solo este sistema conoce la disposición. Lo detecta y lo **rechaza**, no lo ajusta |
| La habituación entre sesiones | Sistema 9, instrumentación. F7 del sistema 1 demostró que no se resuelve agrandando el banco |

### Interacciones con otros sistemas

| Sistema | Dirección | Interfaz |
|---|---|---|
| 1 · Manifiesto | consume | `resolve(id)`, los pools por cluster y por categoría, y `schemaVersion` |
| 3 · Inyección | consume | `FuenteAleatoria` marcada y `barajar`. **Y es quien la obtiene y la pasa al sistema 1** |
| 4 · Dificultad | consume | El vector `{ t, C, sv, ss }` resuelto |
| 9 · Registro | produce | El tablero, la semilla, y **las proporciones efectivas** |
| 10, 21, 24 · Instrumentos | produce | El tablero |

## Formulas

### F1 — `reparto(nD, sv, ss)`: cuántos de cada grupo

```
nV = min( round(sv · nD) ,  nD )
nS = min( round(ss · nD) ,  nD − nV )
nR = nD − nV − nS
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `nD` | int, entrada | [2, 99] | Distractores. Es `C − 1` |
| `sv`, `ss` | float, entrada | [0, 1] | Proporciones pedidas |
| `nV`, `nS`, `nR` | int, salida | [0, nD] | Suman exactamente `nD` |

**Ejemplos, calculados:**

| `nD` | `sv` | `ss` | `nV` | `nS` | `nR` | Nota |
|---|---|---|---|---|---|---|
| 11 | 0,00 | 0,00 | 0 | 0 | 11 | Ninguno parecido |
| 11 | 0,25 | 0,25 | 3 | 3 | 5 | Configuración propuesta |
| 11 | 0,50 | 0,50 | 6 | 5 | 0 | Justo lleno |
| 11 | 0,80 | 0,80 | 9 | 2 | 0 | **`sv+ss=1,6`: la visual gana** |
| 11 | 1,00 | 1,00 | 11 | 0 | 0 | Todo del cluster |
| 99 | 0,25 | 0,25 | 25 | 25 | 49 | |

### F2 — `svEfectiva`, `ssEfectiva`: lo que el paciente vio de verdad

```
svEfectiva = conseguidosV / nD
ssEfectiva = conseguidosS / nD
```

Son **iguales a las pedidas salvo redondeo** siempre que el pool tenga al menos un
elemento, porque la regla 4 reutiliza. Bajan en los dos casos de la regla 3.

**Ejemplo 1 — un cluster de 5 elementos NO recorta.** `nD = 11`, `sv = 0,80`:

| | Valor |
|---|---|
| `nV` pedido | 9 |
| Pool visual disponible | 4 |
| Con agotar y rebarajar | **9 conseguidos**, techo `ceil(9/4) = 3` apariciones |
| `svEfectiva` | **0,82** — igual que la pedida salvo redondeo |

Sin reutilización habrían salido 4, `svEfectiva = 0,36`, y `dp` estaría **17,6 puntos por
encima** de lo que el paciente vio. **Esa es la razón de existir de la regla 4**, y el
cálculo mide lo que la reutilización evita, no lo que ocurre.

**Ejemplo 2 — `sv + ss > 1` SÍ recorta.** `nD = 11`, `sv = 0,80`, `ss = 0,80`:

| | Valor |
|---|---|
| `nV` | 9. `svEfectiva = 0,82` |
| `nS` | **2**, no 9. `ssEfectiva = 0,18` contra 0,80 pedida |
| `dp` pedida contra efectiva | **51,7 contra 40,1**: 11,6 puntos de diferencia |

**Ejemplo 3 — un pool vacío.** Un cluster cuyo único elemento activo es el objetivo:
`svEfectiva = 0` sea cual sea `sv`, y el resto se rellena del pool de resto.

### F3 — `muestrear(pool, n, fuente)`: sin reemplazo, con techo duro

```
pasadas = ceil(n / |pool|)
resultado = concat( barajar(pool, fuente) × pasadas )[0 .. n−1]
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `pool` | id[] | longitud ≥ 1 | Candidatos |
| `n` | int | ≥ 0 | Cuántos hacen falta |
| salida | id[] | longitud `n` | Cada elemento aparece **como máximo `ceil(n/|pool|)`** veces |

**Con `|pool| = 0` y `n > 0` no hay muestreo posible.** No devuelve un array corto en
silencio: devuelve `n` conseguidos menor que pedido, y el llamante decide. Un array corto
haría que el tablero tuviera menos elementos de los que `C` dice, y `C` es una perilla
clínica.

**Se rebaraja entre pasadas**, con la misma fuente. Si no, las pasadas 2 y 3 tendrían el
mismo orden que la 1 y los primeros elementos del pool aparecerían siempre antes.

## Edge Cases

- **Si el cluster del objetivo tiene menos elementos que `nV`**: se agota y se rebaraja
  (regla 4), y `svEfectiva` puede quedar por encima o por debajo de la pedida según el
  redondeo. Lo que **no** ocurre es que el tablero salga con menos de `C` elementos.
- **Si el pool visual está vacío** — un cluster con un solo elemento activo, que es el
  objetivo: `nV` conseguido es 0, `svEfectiva = 0`, y **el resto se rellena del pool de
  resto**. El tablero es válido y `dp` recalculada lo refleja.
- **Si `C − 1` supera el banco entero**: se **rechaza** la configuración nombrando `C` y el
  tamaño del banco. Es el único caso en que este sistema rechaza por cantidad.
- **Si `C` y `t` juntos no caben en la pantalla**: se **rechaza la combinación**, no se
  ajusta ninguna de las dos. El sistema 4 lo declaró y este lo detecta, porque es el único
  que conoce la disposición.
- **Si un id del manifiesto está `retirado`**: no entra en ningún pool. Un tablero histórico
  que lo contenía sigue siendo legible — `resolve(id)` devuelve `conocido: true` con
  `retiredAt` — pero no se genera uno nuevo con él.
- **Si la fuente aleatoria no lleva marca**: no compila. Es la marca de ADR-0004.

## Dependencies

**Dependencias de entrada:** 1 (dura), 3 (dura), 4 (dura), 2 (blanda, solo para el
conflicto de disposición).

**Sistemas que dependen de este:** 9, 10, 21, 24.

**Consistencia bidireccional:** el índice declara que 8 depende de 1, 2, 3 y 4, y que 9, 10,
21 y 24 dependen del 8. Coincide.

## Tuning Knobs

**Ninguna propia, y eso es lo correcto.** Todo lo que este sistema usa viene del sistema 4
o del manifiesto. Si aparece una perilla aquí, es que se ha colado un parámetro clínico
fuera de su sitio.

## Visual/Audio Requirements

**Ninguna.** Devuelve datos.

## UI Requirements

Uno, para el sistema 11: **si `svEfectiva` difiere de la pedida, el panel lo dice.**
Significa que el banco no da para la configuración puesta, y el terapeuta necesita saberlo
antes de interpretar el resultado — no después.

## Acceptance Criteria

**AC-1 — Canario de F1: la tabla publicada, exacta** · Unit · **BLOCKING**
**DADO** las seis filas de la tabla de F1,
**ENTONCES** `nV`, `nS` y `nR` coinciden, y **suman `nD`** en las seis.

**AC-2 — Con `sv + ss > 1` gana la visual** · Unit · **BLOCKING**
**DADO** `nD = 11`, `sv = 0,80`, `ss = 0,80`,
**ENTONCES** `nV = 9` y `nS = 2`. La visual cumple lo pedido y la semántica se recorta.

**AC-3 — El reparto siempre suma `nD`** · Unit · **BLOCKING**
**DADO** todo `nD` en [2, 99] y `sv`, `ss` en pasos de 0,05,
**ENTONCES** `nV + nS + nR == nD` **sin excepción**, y ninguno es negativo.

**AC-4 — Muestreo con techo duro** · Unit · **BLOCKING**
**DADO** un pool de 4 elementos y `n = 9`,
**ENTONCES** salen 9 ids, y **ningún id aparece más de 3 veces** (`ceil(9/4)`).

**AC-5 — Se rebaraja entre pasadas** · Unit · **BLOCKING**
**DADO** un pool de 4 y `n = 12` — tres pasadas exactas —,
**ENTONCES** las tres pasadas de 4 elementos **no tienen las tres el mismo orden**.
*Sin rebarajar, los primeros elementos del pool aparecerían siempre antes.*

**AC-6 — Semilla fija, tablero idéntico** · Unit · **BLOCKING**
**DADO** la misma semilla, la misma configuración y el mismo manifiesto,
**ENTONCES** los dos tableros son idénticos por `assert.deepStrictEqual`, **incluido el
orden**.

**AC-7 — Semillas distintas, tableros distintos** · Unit · **BLOCKING**
**DADO** 100 semillas distintas con la misma configuración,
**ENTONCES** al menos 95 de los 100 tableros son distintos entre sí.
*No es estadístico sobre una distribución: es un umbral de cordura sobre un dato fijo y
reproducible.*

**AC-8 — El objetivo nunca aparece como distractor** · Unit · **BLOCKING**
**DADO** 200 tableros con semillas distintas y `sv = 1,0` — el caso peor, todo del cluster
del objetivo —,
**ENTONCES** en ninguno el id del objetivo está en `distractores`.

**AC-9 — El tablero tiene exactamente `C` elementos** · Unit · **BLOCKING**
**DADO** `C` de 3 a 100 y un cluster deliberadamente pequeño,
**ENTONCES** `1 + distractores.length == C` **siempre**. Un pool pequeño reutiliza; nunca
devuelve un tablero corto.

**AC-10 — Las proporciones efectivas nunca superan las pedidas** · Unit · **BLOCKING**
**DADO** cualquier configuración y cualquier manifiesto,
**ENTONCES** `svEfectiva ≤ sv` y `ssEfectiva ≤ ss`, salvo el redondeo declarado de F2.

**AC-11 — `dp` se recalcula con las efectivas** · Unit · **BLOCKING**
**DADO** `sv = 0,80` y `ss = 0,80` con `nD = 11`, que por la regla 2 da `ssEfectiva = 0,18`,
**CUANDO** se compara `dp` con las pedidas contra `dp` con las efectivas,
**ENTONCES** son **51,7 y 40,1**, y el tablero lleva las cuatro proporciones.
*Sin esto, el registro guardaría una dificultad 11,6 puntos por encima de lo que el
paciente vio, y el error va siempre en la misma dirección: hacia arriba.*

**AC-11b — Un pool vacío da proporción efectiva 0, no un tablero corto** · Unit · **BLOCKING**
**DADO** un cluster cuyo único elemento activo es el objetivo, y `sv = 1,0`,
**ENTONCES** `svEfectiva = 0`, el tablero **sigue teniendo `C` elementos**, y los
distractores salen del pool de resto.

**AC-12 — Un id retirado no entra en ningún pool** · Unit · **BLOCKING**
**DADO** un manifiesto con un id `retirado` dentro del cluster del objetivo,
**ENTONCES** no aparece en `distractores` en 200 tableros.

**AC-13 — Este sistema no mira el reloj** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** `src/tablero/`,
**ENTONCES** no contiene ninguna lectura de reloj, ni recibe un `RelojMonotono` o
`RelojPared` en ninguna firma.
*Un tablero no puede depender de cuándo se genera: es lo que hace que reproducir uno de la
sesión 4 dé el mismo resultado en la sesión 12.*

## Open Questions

| Pregunta | Quién | Cuándo |
|---|---|---|
| ¿Qué hacer con la habituación DENTRO de una sesión? | Sistema 9 | F7 del sistema 1 demostró que 15 tableros por sesión dan ~56 reapariciones y que agrandar el banco no lo arregla. La respuesta es política de muestreo entre tableros, y necesita datos reales |
| ¿El umbral de 95 de 100 de AC-7 es el correcto? | Al implementar | Es un umbral de cordura elegido, no derivado |
