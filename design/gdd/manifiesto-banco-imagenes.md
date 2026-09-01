# Manifiesto del banco de imágenes

> **Status**: Revised — `/design-review` 2026-08-24, veredicto NEEDS REVISION, cambios aplicados
> **Author**: Carlos + `systems-designer`, `qa-lead`
> **Reviewed by**: `lead-programmer`, `tools-programmer`, `accessibility-specialist`,
> `analytics-engineer`, con síntesis de `technical-director`. Registro en
> `design/gdd/reviews/manifiesto-banco-imagenes-review-log.md`
> **Last Updated**: 2026-08-24
> **Sistema**: #1 del índice · Core · MVP · capa Foundation
> **Implements Pillar**: Pilar 4 — "Contenido combinatorio, nunca redactado".
> Secundariamente el pilar 3, porque la estructura del manifiesto es lo que hace
> que la perilla de similitud visual sea real.

## Overview

El manifiesto es **la única vía entre un instrumento y un archivo de imagen**.
Ningún instrumento referencia un archivo por ruta: pide un identificador estable al
manifiesto, que devuelve el asset y sus metadatos.

Existe por dos razones. La primera es que **cuatro de los diez instrumentos
previstos consumen el mismo contenido** — búsqueda visual, clasificar por
categorías, denominación de objetos y precio justo. Sin una capa común, cada uno
acumularía sus propias rutas y el contenido se rehacería una vez por instrumento.
La segunda es que el banco arranca con imágenes de stock y se sustituirá después:
esa sustitución debe ser un cambio de archivos, no una reescritura de instrumentos.

Ni el paciente ni el terapeuta lo perciben directamente. Pero **determina si la
perilla de similitud visual funciona de verdad**: cuántos elementos hay por grupo
visual es lo que hace que un tablero difícil sea una tarea de discriminación o una
repetición bruta de tres iconos. Es un sistema de datos con consecuencia clínica.

Sin ADR todavía: `docs/architecture/` está vacío. Las decisiones de implementación
que surjan aquí se anotan en Open Questions y van a `/architecture-decision`.

## Player Fantasy

**Este sistema no tiene fantasía propia. Es infraestructura**, y el paciente
experimenta su efecto, no el sistema.

Lo que habilita, en el bucle del paciente: que **ninguna ronda se repita
exactamente** — la estética de Descubrimiento, prioridad 2 de su tabla MDA. Y que
la exigencia de discriminación visual sea real en lugar de aparente.

La fantasía a la que sirve de verdad es la del terapeuta: *"el material es mío y
tiene lo que necesito"*. El manifiesto es lo que hace que su biblioteca sea un
activo con estructura en lugar de una carpeta de archivos.

**El modo de fallo sí es perceptible, y por dos vías a la vez.** Si el banco está
mal distribuido, el paciente nota que "siempre salen las mismas cosas" — eso es
habituación — y el terapeuta nota que la perilla de similitud no hace nada. Los dos
síntomas son el mismo defecto estructural.

> `creative-director` no consultado — modo Lean. Revisar el encuadre a mano antes
> de producción.

## Detailed Rules

### Core Rules

1. **El contrato de identidad: no existe la operación de sustituir el archivo
   conservando el `id`.**

   Un `id` es kebab-case, estable e inmutable. Es la clave con la que el registro de
   rendimiento guarda **qué estímulo exacto** vio el paciente, y toda la premisa
   psicofísica del producto — umbral a precisión constante — asume que el estímulo
   detrás de un `id` es idéntico entre sesiones.

   Por eso la regla es **estructural, no detectiva**. Cambiar el estímulo detrás de
   un `id` significa **retirar ese `id` y crear uno nuevo**. No existe una operación
   de "reemplazar archivo manteniendo id" que nadie pueda invocar, ni bien ni mal.

   > **Un diseño anterior de este documento usaba `hash` + `revision`** para
   > *detectar* la sustitución silenciosa. Se ha eliminado. Dos revisores
   > convergieron: un control detectivo que vive dentro del artefacto que protege,
   > editable a mano y sin revisor de PR, no es un control. Un re-encode sin pérdida,
   > un strip de EXIF o una normalización CRLF/LF en SVG sobre Windows lo disparan sin
   > que cambie un píxel, y eso entrena a incrementar `revision` por reflejo — la
   > conducta exacta que la regla existía para impedir. Es preferible que la operación
   > peligrosa **no exista** antes que detectarla después.

   **El hash sobrevive fuera del esquema.** El sistema 13 genera un fichero de
   integridad (`banco.lock`) sobre los archivos **ya normalizados**, versionado en git
   y comparado contra disco en CI. Si los parámetros de normalización cambian, se
   regenera el lock con un comando: no hay cientos de `revision` que subir a mano.

   **Consecuencia incómoda que hay que escribir, no suavizar.** Cuando el arte
   definitivo sustituya al stock, eso genera una **generación nueva de
   identificadores** y una **discontinuidad en la serie longitudinal**. Los ids viejo
   y nuevo **no se enlazan**: un campo tipo `supersedes` reconstruiría exactamente la
   falsa equivalencia que este contrato existe para impedir. La discontinuidad es
   cierta, así que debe ser **visible** en la pantalla del terapeuta, no disimulada.
   Ver la puerta de `/art-bible` en Visual/Audio Requirements.
2. **Se retira, nunca se borra.** Un asset que sale de uso pasa a
   `status: retired` con su `retiredAt`. Permanece en el manifiesto para que el
   histórico siga resolviendo, y queda excluido de la generación de tableros nuevos.
   La vuelta a `active` está permitida; borrar un `id` no.

   **Qué es mutable y qué no.** La frontera es física, no de gusto: **los píxeles son
   la medición, los metadatos son la interpretación.**

   | Campo | Mutabilidad |
   |---|---|
   | `id` | **Inmutable.** Es la clave del dato clínico |
   | `file` | **Inmutable** por el contrato de la regla 1 |
   | `cluster`, `categories`, `attrs` | **Mutables.** Reetiquetar es curación legítima y barata |
   | `name` | Mutable **por ahora**. Cuando llegue el instrumento de denominación pasa a ser criterio de acierto de un ensayo y entra en régimen de congelación. Se decide en el GDD de ese instrumento, no aquí |

   Los metadatos pueden mutar **porque el registro los congela al generar el tablero**
   y nunca los vuelve a resolver contra el manifiesto vigente. Eso cierra el agujero
   de corrupción retroactiva — reetiquetar un asset cambiaría el sentido de todo su
   histórico — **sin añadir un solo campo**, y deja libre el reetiquetado, que es justo
   lo que hace falta mientras la taxonomía se descubre.
3. **El manifiesto es la única vía al asset.** Ningún instrumento codifica un
   nombre de archivo. Es un invariante de arquitectura, no una convención.

   **La verificación de esta regla NO pertenece a este sistema.** Es una propiedad
   del código de los instrumentos, no de los datos del manifiesto: se comprueba con
   un análisis estático que busque literales de ruta de imagen fuera del módulo del
   manifiesto. Ese análisis es del **sistema 14** (invariantes como barreras de CI).
   Aquí se declara la regla; allí se hace cumplir.
4. **La validación es de tiempo de construcción, no de ejecución.** La hacen las
   herramientas del banco (sistema 13). Un manifiesto inválido falla **en bloque y
   de forma ruidosa**: nunca a medias, nunca con un tablero silenciosamente
   incompleto.
5. **Regla de distribución, con escalón de aplicación por nivel.** Cada grupo visual
   debe contener al menos `clusterMin` elementos activos. Ver Formulas.

   | Nivel | Aplicación |
   |---|---|
   | **Nivel 0** (MVP, 30 imágenes) | **Advertencia**, no bloqueo |
   | **Nivel 1 en adelante** | **Bloqueo del build** |

   **Sin este escalón, el primer manifiesto real del proyecto es inválido por
   construcción.** El MVP son 30 imágenes en total y `clusterMin` es 24, así que
   ningún reparto plausible satisface la regla. El riesgo no es que el desarrollador se
   atasque — lo verá en diez minutos. El riesgo es **cómo lo va a resolver: bajando
   `clusterMin`**. Y `clusterMin` es lo único en todo el sistema que hace real la
   perilla de similitud visual. El escalón existe para que la salida fácil no sea
   destruir el pilar 3.
6. **Las consultas son puras y reproducibles por semilla.** El manifiesto no
   contiene estado aleatorio. La fuente de aleatoriedad se inyecta desde fuera.
7. **El manifiesto declara su versión de esquema.** Un cambio incompatible sube la
   versión, y el cargador rechaza versiones que no conoce.

   La raíz del manifiesto **no es un array de assets**. Es un contenedor, para que
   la versión tenga dónde vivir:

   ```
   { schemaVersion: número, assets: [ ...ImageAsset ] }
   ```
8. **Todo cluster está contenido semánticamente.** Todos los miembros de un mismo
   `cluster` deben compartir al menos una `category` entre sí.

   Sin este invariante, la aritmética de pools de la Sección F2 se rompe: un miembro
   del cluster que no comparte ninguna categoría con el objetivo — por ejemplo una
   pelota de juguete en el cluster `redondo-liso` de una manzana — haría que
   `pool_semantica` calculado por sustracción diera un número menor que el real, o
   incluso negativo. Es una regla de validación, y sale de la Sección D.
9. **El color no puede ser el criterio que SEPARA dos clusters.** La separación entre
   clusters debe sobrevivir en **escala de grises**. El color puede variar *dentro* de
   un cluster; no puede definirlo.

   **Es un requisito del pilar 3, no una preferencia de accesibilidad.** Si dos
   clusters se distinguieran solo por matiz, un paciente con deuteranopia los
   percibiría como **un solo grupo visual**. Lo que el terapeuta configuró como
   similitud `semantica`, dificultad media, ese paciente lo recibe como `visual`, la
   más alta. El pilar 3 dice que el sistema "nunca cruza" el rango del terapeuta, y
   aquí lo cruzaría **por composición del banco, no por un bug** — que es peor, porque
   ningún test lo ve.

   El proyecto ya tenía la regla escrita: *"la forma identifica, el color solo
   refuerza; debe funcionar en escala de grises"*. Se aplicaba solo al objetivo
   resaltado, nunca al **criterio de agrupación de los distractores**. Extenderla es
   coherencia, no una restricción nueva.

   **Y fusionar clusters separados por color mejora el sistema:** unir dos grupos sube
   `clusterSize` (mejora F3 y F7), baja `G` (baja `bancoTotal`) y **sube la exigencia
   real de discriminación**, porque el color pasa a variar dentro del cluster y el
   paciente no puede apoyarse en él. Más barato y mejor clínicamente a la vez.

   Aplicación: el sistema 13 rechaza identificadores de cluster que contengan términos
   de un léxico de color fijo. Heurística imperfecta, coste cercano a cero, y hace
   visible la regla en el momento de escribir el nombre.

### Esquema del asset

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | string kebab-case | Sí | Clave estable. **Nunca cambia** |
| `file` | string | Sí | Ruta relativa dentro de `assets/art/banco/` |
| `categories` | string[] | Sí | Grupos **semánticos**. **Varios por asset.** Una manzana es `["frutas", "cocina", "alimentos"]` |
| `cluster` | string | Sí | Grupo **visual**, **global y único** por asset (`redondo-liso`). **Sin términos de color en el nombre** — regla 9 |
| `name` | string | Sí | Etiqueta en español. La consume el instrumento de denominación y la vista del terapeuta |
| `status` | `active` \| `retired` | Sí | Ver regla 2 |
| `retiredAt` | fecha ISO | **Condicional** | Obligatorio si y solo si `status: retired`. Ningún asset nace retirado, así que su coste de curación es cero |
| `attrs` | objeto | No | Atributos por instrumento. `price` para precio justo. Un asset sin el atributo que un instrumento pide queda fuera de **ese** pool, sin ser un error |

**Seis campos obligatorios**, uno condicional, uno opcional. `attrs` es el **punto de
extensión** del esquema: cuando un instrumento futuro necesite un dato propio, entra
por ahí y este esquema no cambia. Un campo aplazado a `attrs` no es deuda — es el
esquema funcionando como se diseñó.

**Por qué `retiredAt` y no solo el booleano de estado.** Si un asset se retira entre la
sesión 4 y la sesión 5 de un paciente, `clusterSize` baja y con él cambian tres
fórmulas sin que el terapeuta toque nada. Sin la fecha, el terapeuta no puede
distinguir "el paciente empeoró" de "alguien retiró una imagen".

De **once campos** que la revisión propuso, este es el único que entró. Los otros diez
se aplazaron a `attrs`, se movieron a otro sistema o se rechazaron.

### El modelo es asimétrico a propósito

**Una identidad visual, muchas pertenencias semánticas.**

El `cluster` es una propiedad **intrínseca de la imagen**: forma y color. Una
manzana es `redondo-liso` sin importar bajo qué categoría se archive. Es un solo
valor y no puede ser varios.

Las `categories` son **etiquetas semánticas ortogonales**, y son varias porque el
mundo es así: una manzana es fruta, es comida y es objeto de cocina. Forzar una sola
categoría rompería el instrumento "clasificar por categorías", donde la categoría
deja de ser un agrupador y pasa a ser el criterio del ejercicio.

Consecuencia estructural, y es la razón de que el `cluster` sea **global** en lugar
de estar contenido dentro de una categoría: si un asset pertenece a varias
categorías, su grupo visual no puede estar anidado en ninguna de ellas.

**Consecuencia económica, y es grande:** los clusters visuales cuestan contenido;
las categorías semánticas no. Añadir la categoría `cocina` cuesta **cero imágenes
nuevas** — es etiquetar assets que ya existen. Solo producir un grupo visual nuevo
cuesta imágenes. Esto reordena la estrategia de producción del banco.

**Riesgo nuevo que introduce: el sobre-etiquetado degrada el eje semántico.** Si
cada asset lleva muchas categorías, cada vez menos assets son disjuntos del
objetivo, así que el pool de similitud `ninguna` se encoge y el de `semantica` se
hincha. En el extremo, si todo comparte alguna categoría con todo, el nivel
`ninguna` desaparece y el eje semántico deja de discriminar. Cuantificación
pendiente de la Sección D.

### Estados y transiciones

**Manifiesto:**

| Desde | A | Disparador |
|---|---|---|
| `unloaded` | `loading` | Arranque de la aplicación |
| `loading` | `ready` | Esquema válido y versión conocida |
| `loading` | `invalid` | Versión desconocida, o JSON malformado |
| `ready` | — | Estado terminal en ejecución. El manifiesto es inmutable una vez cargado |

En estado `invalid` la aplicación **no arranca el instrumento**. No hay modo
degradado: un banco a medias produce tableros a medias, y eso contamina el dato.

**Asset:** `active` ⇄ `retired`. Bidireccional. Nunca se elimina.

### Interacciones con otros sistemas

| Sistema | Dirección | Interfaz |
|---|---|---|
| 8 · Generación de tableros | consume | `pool(objetivo, nivelSimilitud)` → **`ReadonlyArray<string>` de ids**. Las fórmulas F2 operan sobre assets completos, pero el mapeo `asset → asset.id` ocurre **dentro** de la función: el sistema 8 nunca ve un asset completo, solo el id. Es el invariante que el resto del documento defiende |
| 9 · Registro de rendimiento | consume | `resolve(id)` → ver contrato abajo. Debe resolver ids **retirados** para que el histórico se lea. Y **congela** `cluster` y `categories` al generar el tablero, sin volver a resolverlos después |
| 13 · Herramientas del banco | valida | `validate(manifiesto)` → lista de errores |
| 10 · Busca | consume | Indirectamente, vía 8 |
| Denominación de objetos | consume | Necesita `name` **y sus sinónimos**. El español tiene variantes reales (gafas/lentes, nevera/frigorífico) y un `name` único marcaría como fallo una respuesta correcta. Ver Open Questions |
| 21 · Clasificar por categorías | consume | Necesita `category` como criterio del ejercicio, no solo como agrupador |
| 23 · Precio justo | consume | Necesita `attrs.price` |

### El contrato de `resolve(id)`

Una sola forma de retorno, discriminada por unión. Versiones anteriores de este
documento daban **tres formas contradictorias** entre la tabla de interacciones y los
criterios de aceptación; quien lo implementara habría inventado una cuarta.

| Caso | Retorno |
|---|---|
| `id` conocido | `{ conocido: true, name, status, cluster, categories, retiredAt? }` |
| `id` ausente del manifiesto | `{ conocido: false, id }` |

**`cluster` y `categories` entran en el retorno, y no son campos nuevos**: ya estaban
en el esquema. Es ampliar un retorno, no ampliar un esquema. El sistema 9 los necesita
para poder distinguir "el paciente mejoró en búsqueda visual" de "memorizó esta
imagen concreta", que es el análisis que F7 le encarga y que con el retorno anterior
era inejecutable.

El caso `conocido: false` **nunca lanza excepción**. Un dato antiguo ilegible es
aceptable; una pantalla de histórico que se rompe al abrirse, no.

### La consulta de pool: los tres niveles de similitud

Es la interfaz que hace real la separación de ejes del pilar 3. Todas filtran a
`status: active`.

| Nivel | Pool de distractores |
|---|---|
| `ninguna` | Assets cuya `category` ≠ la del objetivo |
| `semantica` | Assets con la misma `category` y **distinto** `cluster` |
| `visual` | Assets con el **mismo** `cluster`, excluyendo el propio objetivo |

El nivel `visual` es el que impone la regla de distribución: su pool es
`tamañoDelCluster − 1`, y de ahí sale todo el dimensionado del banco.

> Especialistas de la sección de reglas no consultados — modo Lean. Solo se consultan en
> las secciones D y H, que son las de riesgo alto.

## Formulas

Convención de redondeo: `round()` = mitad hacia arriba, igual que `Math.round` de
JavaScript.

### F1 — `objetivos(C)` y `distractores(C)`

**Sustituye a `max(3, round(C × 0.1))`**, que el documento de concepto ya marcaba
como no utilizable. El defecto no eran los saltos — toda función de enteros los
tiene — sino que el suelo `max(3, …)` absorbía en silencio los valores 1 y 2, y eso
producía una meseta inicial de 26 muescas (C=9 a 34) seguida de mesetas de 10. La
cadencia era inconsistente por accidente.

```
objetivos(C) = clamp(
  round( objetivosMin + (objetivosMax − objetivosMin) × (C − Cmin) / (Cmax − Cmin) ),
  objetivosMin, objetivosMax
)

distractores(C) = C − objetivos(C)
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `C` | int | [9, 100] | Elementos totales del tablero |
| `Cmin` | int, constante | 9 | Tablero mínimo |
| `Cmax` | int, perilla | [30, 100] · **60** | Tablero máximo que el producto permite. **Bajado de 100 a 60 — ADR-0006** |
| `objetivosMin` | int, perilla | [2, 5] · **3** | Objetivos en el tablero mínimo |
| `objetivosMax` | int, perilla | [8, 15] · **10** | Objetivos en el tablero máximo |
| `objetivos(C)` | int, salida | [3, 10] | Elementos correctos a encontrar |
| `distractores(C)` | int, salida | [6, 90] | Señuelos |

**Rango de salida:** `objetivos(C)` queda acotado por construcción en
**[3, 10]** — la interpolación toca exactamente `objetivosMin` y `objetivosMax` en los
extremos del dominio, así que el `clamp` es defensivo, no necesario.
`distractores(C)` queda en **[6, 90]**.

**Cadencia:** 13 muescas constantes en todo el rango, frente a 26 + 10 + 10 de la
fórmula vieja. La densidad de objetivo pasa de ser un efecto colateral a un
parámetro declarado con dos extremos.

**`objetivosMax = 10` no es arbitrario:** preserva `distractores(100) = 90`, así que
ningún número ya citado en `game-concept.md` ni en el informe del prototipo queda
invalidado. La corrección solo repara el tramo intermedio.

| C | objetivos (vieja) | objetivos (nueva) |
|---|---|---|
| 9 | 3 | 3 |
| 16 | 3 | 4 |
| 34 | 3 (8,8% densidad) | 5 |
| 35 | 4 (+33% de golpe) | 5 |
| 80 | 8 | 8 |
| 100 | 10 | 10 |

### F2 — Pools por nivel de similitud

Con `categories: string[]`, el pool semántico se define sobre la **unión** de
categorías del objetivo, no sobre una sola.

```
pool_visual(t)    = { a ∈ activos : a.cluster = t.cluster ∧ a.id ≠ t.id }
pool_semantica(t) = { a ∈ activos : a.cluster ≠ t.cluster ∧ categories(a) ∩ categories(t) ≠ ∅ }
pool_ninguna(t)   = { a ∈ activos : categories(a) ∩ categories(t) = ∅ }
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `t` | referencia | — | Asset objetivo. Excluido de sus propios pools |
| `activos` | conjunto | — | Assets con `status: active` |
| `N` | int | [1, ∞) | `|activos|`, tamaño del banco activo |
| `clusterSize(g)` | int | ≥ `clusterMin` | Elementos del cluster `g`, igual a `|pool_visual| + 1` |
| `unionCategorias(t)` | int | [clusterSize−1, N−1] | Otros assets que comparten ≥1 categoría con `t` |
| `|pool_visual(t)|` | int, salida | [`clusterMin`−1, ∞) | Candidatos a similitud visual máxima |
| `|pool_semantica(t)|` | int, salida | [0, N−1] | Candidatos a similitud semántica |
| `|pool_ninguna(t)|` | int, salida | [0, N−1] | Candidatos sin similitud declarada |

**Rango de salida:** los tres conjuntos son disjuntos por construcción, y su suma no
puede pasar de `N − 1`. Ninguno puede ser negativo. Si alguno da 0, la generación
falla explícito (AC-10), nunca en silencio. `|pool_visual| = clusterSize − 1`, y de
ahí sale todo el dimensionado del banco.

**Atajo aritmético y su precondición.** Si todos los miembros de un cluster comparten
al menos una categoría entre sí — la **regla 8**, que existe precisamente por esto —
entonces `|pool_semantica| = unionCategorias(t) − |pool_visual(t)|` y
`|pool_ninguna| = (N−1) − unionCategorias(t)`. Sin esa regla, la sustracción daría un
número menor que el real, o incluso negativo.

**Ejemplo** con `N = 384` (el banco de entonces; hoy 256 — ADR-0006), objetivo `manzana-roja` (`["frutas","cocina","alimentos"]`,
cluster `redondo-liso`, clusterSize 24):

| Pool | Cálculo | Tamaño |
|---|---|---|
| `visual` | 24 − 1 | 23 |
| `semantica` | 200 − 23 | 177 |
| `ninguna` | 383 − 200 | 183 |

Orden esperado: `|visual| ≤ |semantica| ≤ |ninguna|`. Ver AC-16.

### F3 — `repeticiones(C, nivel)`

```
repeticiones(C, nivel, t) = distractores(C) / |pool_nivel(t)|
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `distractores(C)` | int | [6, 90] | Señuelos del tablero. Ver F1 |
| `nivel` | enum | {visual, semantica, ninguna} | Nivel de similitud activo en la perilla |
| `|pool_nivel(t)|` | int | [1, N−1] | Tamaño del pool correspondiente. Ver F2 |
| `repeticiones` | float, salida | (0, ∞) | Apariciones medias de cada elemento único del pool |

**Rango de salida:** float en (0, ∞), **deliberadamente sin acotar por arriba**.
`repeticiones` es la señal de alarma, no un valor que la fórmula deba limitar: el
límite lo impone `clusterMin` sobre el denominador.

**Ejemplo** con C=100, clusterSize=24:

| Nivel | pool | repeticiones |
|---|---|---|
| visual | 23 | **3,91** |
| semantica | 177 | 0,51 |
| ninguna | 183 | 0,49 |

Confirma la premisa del concepto: **el nivel visual es el único donde la repetición
es un problema real**. En los otros dos, un elemento casi nunca sale dos veces en el
mismo tablero.

**Restricción de implementación que sale de aquí:** esta fórmula describe la *media*
bajo muestreo con reemplazo. Para un techo duro **por semilla** y no solo en media,
el generador (sistema 8) debe barajar **sin reemplazo** hasta agotar el pool y
rebarajar. Sigue siendo puro y reproducible; solo cambia el algoritmo de consumo.

### F4 — `clusterMin(Cmax, Rmax)`

> **CORREGIDA el 2026-09-01 — ADR-0006.** La versión anterior decía
> `ceil(distractores(Cmax) / Rmax) + 1 = 24`, con `Cmax = 100`. Dos errores encadenados:
>
> 1. **`distractores()` es una fórmula muerta.** Publicaba 90 distractores en el tablero de
>    100; el código hace `nD = C − 1 = 99`, y **ningún módulo de `src/` invoca F1**. El
>    producto entero asume UN objetivo por tablero.
> 2. **`Cmax = 100` nunca se validó con nadie.** Era un número redondo, y arrastraba el
>    activo más caro del proyecto.
>
> Corregidas las dos: **el banco pasa de 384 a 256 imágenes.** 128 menos que producir, sin
> perder ninguna función.

```
clusterMin(Cmax, Rmax) = ceil( (Cmax − 1) / Rmax ) + 1
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `Cmax` | int, perilla | [30, 100] · **60** | Tablero máximo |
| `Rmax` | int, perilla | [2, 6] · **4** | Repeticiones medias máximas por distractor, nivel visual, en el tablero máximo |
| `Cmax − 1` | int | **59** | Distractores en el tablero máximo. Un objetivo por tablero |
| `clusterMin` | int, **derivada** | **[2, ∞) · 16** | Mínimo de elementos activos por grupo visual |

**Rango de salida:** entero en [2, ∞), sin techo. Crece cuando `Rmax` baja o `Cmax`
sube. **Es la variable con más impacto económico de todo el sistema**, porque
multiplica por `G` para dar el coste total de contenido.

| `Rmax` | `clusterMin` | Banco (× 16 clusters) |
|---|---|---|
| 5 | 13 | 208 |
| **4** | **16** | **256** |
| 3 | 21 | 336 |
| 2 | 31 | 496 |

**Valor fijado: `clusterMin = 16`.** Esto sustituye el rango "aproximadamente 23-30"
que aparecía en `game-concept.md` y en el informe del prototipo. Un rango no es una
entrada válida de una validación: ahora es un entero derivado de dos perillas.

### F5 — `solapamiento(t)`: cuantifica el riesgo de sobre-etiquetado

```
solapamiento(t) = unionCategorias(t) / (N − 1)
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `unionCategorias(t)` | int | [0, N−1] | Otros assets que comparten ≥1 categoría con `t`. Ver F2 |
| `N − 1` | int | [0, ∞) | Total de otros assets activos |
| `solapamiento(t)` | float, salida | **[0, 1]** | Fracción del banco no disponible como distractor `ninguna` |

**Rango de salida:** [0, 1]. Cuando tiende a 1, el nivel "sin similitud" deja de
existir para ese asset — no por un bug, sino por etiquetado excesivo.

**`solapamientoMax = 0,7`**, perilla de diseño. Deja al menos un 30% del banco como
distractor sin relación semántica. Incumplirlo es **advertencia de calidad de datos,
no error bloqueante**: es una decisión de etiquetado, no de esquema.

**Dos huecos declarados, porque `solapamiento` es un proxy de autoría y no una
salvaguarda de medición:** no ve el filtrado por atributo — un asset puede pasar el
umbral y aun así quedarse con un pool `ninguna` degenerado para "precio justo" — y es
global y estático, no por paciente. Lo que contamina la medición es la **exposición
realizada** por un paciente concreto, que solo se sabe con telemetría.

El detector automático de verdad es **AC-16** (`|visual| ≤ |semantica| ≤ |ninguna|`
para todo asset). El aviso de `solapamiento` se mantiene; no se le construye
alrededor un registro de acuses de recibo, que es un flujo de dos personas para un
proyecto de una.

| Caso | unionCategorias | solapamiento | pool_ninguna |
|---|---|---|---|
| Sano | 200 | 52,2% | 183 |
| Degenerado | 353 | 92,2% | 30 |

En el caso degenerado la generación no falla, pero `ninguna` se ha reducido a un
séptimo y deja de ser más variado que `semantica`.

### F6 — `bancoTotal`

El modelo "categorías × grupos por categoría × tamaño" del concepto original **ya no
encaja** con el esquema real: las categorías son etiquetas transversales y el cluster
es global. El coste depende de **cuántos clusters visuales existen**, no de cuántas
categorías los etiquetan.

```
bancoTotal = Σ clusterSize(g)      para g = 1..G
bancoTotal = G × clusterMin        si todos están en el mínimo
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `G` | int, perilla de contenido | [8, 40] · **13-16** | Clusters visuales distintos en el banco |
| `clusterSize(g)` | int | ≥ `clusterMin` (24) | Elementos activos del cluster `g` |
| `bancoTotal` | int, salida | **[312, ∞)** | Imágenes únicas totales requeridas |

**Rango de salida:** mínimo **312** con la configuración propuesta, 13 clusters al
mínimo de 24. Sin techo natural: lo fija el presupuesto de producción, no la fórmula.
Crece linealmente con `G`, y también con `clusterMin`, que a su vez sube si `Rmax`
baja. **El coste de contenido es sensible a dos perillas a la vez**, y eso lo hace
fácil de subestimar.

**Restricción derivada:** cada categoría necesita al menos **2 clusters
representados** entre sus miembros, o el nivel `semantica` se colapsa dentro de
`visual` para esa categoría. Con 8 categorías y sin reutilizar clusters: `G ≥ 16`.

Todas las cifras recalculadas el 2026-09-01 con `clusterMin = 16` — ADR-0006.

| Escenario | G | bancoTotal | Antes (clusterMin 24) |
|---|---|---|---|
| Sin reutilización cruzada | 16 | **256** | 384 |
| **Con reutilización vía etiquetado múltiple** | 13 | **208** | 312 |
| Con `Rmax = 3` en vez de 4 | 16 | 336 | 496 |

El escenario 2 es el ahorro real que el esquema multi-categoría habilita y que el
concepto original no anticipaba.

> **La cifra de coste está incompleta, y hay que decirlo.** `accessibility-specialist`
> señaló que este cálculo **no incluye ningún paso de recoloreado o descarte por
> contraste**. Con el fondo de tablero del Visual Identity Anchor, un limón amarillo
> pálido da 1,06:1 y falla por un margen enorme. Si un porcentaje no marginal de la
> fotografía de stock de alimentos falla, hay horas sin presupuestar — y eso
> invalida en silencio el número sobre el que se apoya la decisión de producción.
> `tools-programmer` estima además **30-40 horas reales** de autoría para 384
> entradas, cifra que este documento tampoco daba. Escalada a las 256 de ADR-0006 son
> **20-27 horas**, y el aviso del recoloreado sigue vigente: la estimación no lo incluye.

**La mitad oculta del coste:** cada asset exige 8 campos obligatorios curados a mano
— `id`, `file`, `categories`, `cluster`, `name`, `status` — entre
312 y 496 veces. Etiquetar es gratis en imágenes, no en trabajo.

### F7 — `tasaReaparicion(id)`: la habituación NO se resuelve dimensionando el banco

Este es el hallazgo más importante de la sección.

```
tasaReaparicion(id) = (B × k) / clusterSize(id.cluster)
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `B` | int, **medido** | [1, ~60] | Tableros por sesión. **Requiere telemetría real**, no se asume |
| `k` | float | [0, C] | Elementos del tablero extraídos del cluster del objetivo. Peor caso: `k = distractores(C)` |
| `tasaReaparicion` | float, salida | [0, ∞) | Apariciones esperadas de ese `id` en la sesión |

**Rango de salida:** float en [0, ∞), **sin acotar y a propósito**. Puede dispararse
aunque `clusterMin` (F4) esté satisfecho, porque F4 controla un solo tablero y esto
acumula toda la sesión. Ese desacoplamiento es justamente el hallazgo.

**Ejemplo** con B=15 tableros, C=100, k=90, clusterSize=24:

```
tasaReaparicion = 15 × 90 / 24 ≈ 56 apariciones por sesión
```

**Cincuenta y seis, con `Rmax = 4` perfectamente satisfecho por tablero.** F4 solo
controla un tablero; esto acumula muchos.

Si se intentara arreglar **solo** subiendo el tamaño del cluster para bajar a un
techo de sesión de 6:

```
clusterMinSesion = ceil(15 × 90 / 6) + 1 = 226
```

**226 imágenes en un solo grupo visual es imposible de producir.**

**Conclusión, y redirige trabajo lejos de un callejón sin salida:** la habituación a
nivel de sesión **no es un problema de dimensionado del banco**. Se resuelve en otros
dos sistemas:

1. **Sistema 8 (generación de tableros): política de muestreo.** No reutilizar el
   mismo cluster maximizado en tableros consecutivos de una sesión.
2. **Sistema 9 (registro): instrumentación.** Registrar el `id` por intento y
   detectar la caída de latencia sobre elementos repetidos, como ya pide el concepto.

`tasaReaparicion` queda como **fórmula de monitorización** que ejecutan las
herramientas del banco contra un perfil de uso simulado, no como entrada al cálculo
de `clusterMin`.

**Restricción de alcance:** `B` es por instrumento. Desde el Nivel 2, un paciente
puede usar en una sesión dos instrumentos que comparten banco, así que la reaparición
real es la suma entre instrumentos — generalizarla es trabajo del GDD de composición
de sesiones, no de aquí.

### Tamaño de cluster: uniforme como suelo, variable como techo

`∀g: clusterSize(g) ≥ clusterMin`. Sin excepciones por "ese cluster se usa poco".

No es preferencia de estilo: lo exige el **pilar 3**. El concepto dice que "el rango
clínico completo debe seguir siendo alcanzable" y que "quitar perillas para ganar
segundos es la solución prohibida". El terapeuta puede elegir **cualquier** categoría
a dificultad máxima, así que un cluster por debajo del suelo convertiría la similitud
visual en una perilla que solo funciona a veces.

Por encima del suelo, la asignación puede ser desigual: invertir más presupuesto de
arte en los clusters clínicamente más prescritos es una decisión de producción
válida.

## Edge Cases

- **Si un grupo visual tiene menos de `clusterMin` elementos activos**: la
  validación falla en tiempo de construcción, con el nombre del grupo y el déficit
  exacto. No es un aviso: bloquea.
- **Si un instrumento pide un atributo que el asset no tiene** (por ejemplo
  `price`): ese asset queda excluido del pool **de ese instrumento**. No es un
  error. Pero si la exclusión deja el pool por debajo del mínimo requerido, la
  generación falla por la regla de abajo.
- **Si un `file` no existe en disco**: error de validación en construcción.
- **Si hay dos assets con el mismo `id`**: error de validación. Es el fallo más
  peligroso del sistema, porque silenciosamente mezclaría datos de dos assets
  distintos en el registro del paciente.
- **Si una consulta devuelve cero assets**: la generación de tableros falla con un
  error explícito. Nunca produce un tablero incompleto en silencio. Esto implementa
  el requisito 1 del MVP del documento de concepto.
- **Si el registro referencia un `id` retirado**: resuelve con normalidad y se
  muestra marcado como retirado. El histórico clínico se conserva legible.
- **Si el registro referencia un `id` que no está en el manifiesto**: se muestra el
  `id` crudo, sin nombre. **Nunca lanza excepción.** Un dato antiguo ilegible es
  aceptable; una pantalla del terapeuta que se rompe al abrir un histórico, no.
- **Si un cluster tiene un miembro que no comparte ninguna categoría con el resto**:
  error de validación (regla 8). Es el fallo que rompe la aritmética de pools, y es
  silencioso si no se comprueba: el manifiesto es sintácticamente válido.
- **Si `solapamiento(t) > solapamientoMax` para algún asset**: **advertencia**, no
  error. El etiquetado es excesivo y el nivel `ninguna` se está encogiendo, pero la
  generación sigue funcionando. Es calidad de datos, no esquema.
- **Si `file` apunta a un formato animado o entrelazado** (GIF animado, APNG, PNG
  entrelazado, WebP animado): error de validación. Introduce movimiento que el
  paciente no ha pedido, lo que rompe `prefers-reduced-motion` (WCAG 2.3.3) y la
  regla de predictibilidad del concepto: *"nada aparece, se mueve ni suena sin ser
  consecuencia directa de una acción del paciente"*. Solo raster estático sin
  entrelazado. Es una comprobación mecánica barata, del mismo tipo que "archivo
  ausente".
- **Si un asset se retira a mitad de tratamiento**: el histórico sigue resolviendo
  (regla 2), pero `clusterSize` baja para ese grupo y eso **altera tres fórmulas a
  la vez sin que el terapeuta toque ninguna perilla** — `pool_visual` se encoge,
  `repeticiones` sube y `tasaReaparicion` sube, las dos últimas porque comparten
  denominador. Si la precisión del paciente cae en la sesión siguiente, el terapeuta
  no puede distinguir "empeoró" de "alguien retiró una imagen". Consecuencia: el
  registro debe estampar el `clusterSize` y los tamaños de pool **vigentes en el
  momento de la generación**, no recalculados después. El manifiesto es inmutable
  *dentro* de una carga, pero mutable *entre* cargas — y esa es justo la escala
  temporal en la que el terapeuta compara.
- **Si el manifiesto declara una versión de esquema desconocida**: estado
  `invalid`, el instrumento no arranca. Preferible a interpretar campos que quizá
  cambiaron de significado.
- **Si un asset está `retired` pero un histórico lo referencia y el terapeuta
  filtra por "solo activos"**: el filtro afecta a la generación, nunca a la lectura
  del histórico. Son dos consultas distintas sobre el mismo manifiesto.

> `systems-designer` no consultado para esta sección — modo Lean. Los casos límite
> derivados de las fórmulas se revisan al cerrar la Sección D.

## Dependencies

**Dependencias de entrada: ninguna.** Es un sistema de capa Foundation, y por eso
va primero en el orden de diseño.

**Sistemas que dependen de este** (todos son dependencias **duras**: no funcionan
sin el manifiesto):

| Sistema | Prioridad | Qué necesita |
|---|---|---|
| 8 · Generación de tableros | MVP | La consulta de pool y la regla de distribución |
| 9 · Registro de rendimiento | MVP | `resolve(id)`, incluidos ids retirados |
| 10 · Instrumento Busca | MVP | Vía 8 |
| 13 · Herramientas del banco | MVP | El esquema, para poder validarlo |
| 21 · Clasificar por categorías | Alpha | `category` como criterio del ejercicio |
| 23 · Precio justo | Alpha | `attrs.price` |

**Dependencia blanda:** el sistema 19 (biblioteca portable del terapeuta) sincroniza
material profesional. Si algún día el terapeuta puede añadir sus propias imágenes,
el manifiesto deja de ser un artefacto de construcción y pasa a tener parte de
ejecución. **No está en el alcance del MVP**, pero el esquema debería no impedirlo.

Consistencia bidireccional verificada contra `design/gdd/systems-index.md`: los seis
sistemas de arriba declaran el 1 entre sus dependencias.

## Tuning Knobs

Valores fijados en la Sección D. Los derivados no se tocan a mano.

| Perilla | Rango seguro | Propuesto | Qué controla |
|---|---|---|---|
| `Cmin` | constante | **9** | Dominio inferior de `objetivos(C)` |
| `Cmax` | [50, 150] | **100** | Techo de tablero. Dimensiona todo lo demás |
| `objetivosMin` | [2, 5] | **3** | Objetivos en el tablero mínimo |
| `objetivosMax` | [8, 15] | **10** | Objetivos en el tablero máximo |
| `Rmax` | [2, 6] | **4** | Repetición media máxima por tablero, nivel visual |
| `clusterMin` | **derivada** | **24** | Mínimo por grupo visual. Ver F4 |
| `solapamientoMax` | [0,5, 0,8] | **0,7** | Techo de etiquetado cruzado por asset |
| `G` | [13, 20] | **13-16** | Clusters visuales totales. Es el coste de producción |
| `Rsesion` | [4, 10] | **pendiente** | Techo de reaparición por sesión. Necesita telemetría real de `B` antes de fijarse |



| Perilla | Qué controla | Quién la toca | Si se pone mal |
|---|---|---|---|
| `Rmax` | Repeticiones máximas aceptables por distractor en similitud visual | Diseño, una vez | Demasiado alto: los tableros difíciles degeneran en repetición y la medición se contamina. Demasiado bajo: el banco se vuelve carísimo de producir |
| `Cmax` | Tamaño máximo de tablero que el producto permite | Diseño, una vez | Es lo que dimensiona el banco entero. Subirlo después obliga a producir más contenido |
| `clusterMin` | Mínimo de elementos por grupo visual | **Derivada**, no se fija a mano | Ver Formulas |
| Nº de categorías | Variedad semántica disponible | Producción de contenido | Pocas: el nivel `ninguna` tiene poco pool. Muchas: coste de contenido sin beneficio en el nivel `visual` |
| Grupos por categoría | Granularidad del eje visual | Producción de contenido | Uno solo por categoría colapsa `semantica` y `visual` en el mismo nivel |

**Interacción entre perillas que hay que vigilar:** `Cmax` y `Rmax` fijan juntas
`clusterMin`, y `clusterMin` multiplicado por categorías y grupos fija el coste
total de producción. Son las dos únicas perillas con consecuencia económica directa
en todo el proyecto.

## Visual/Audio Requirements

El sistema no tiene representación propia. Pero **impone requisitos estructurales al
arte**, y el formato del arte no se decide aquí.

### Requisitos estructurales que el arte debe satisfacer

| Requisito | Por qué |
|---|---|
| Agrupable en clusters de ≥ `clusterMin` elementos | F4. Sin esto la perilla de similitud visual no es real |
| Separabilidad entre clusters **en escala de grises** | Regla 9. El color no puede separar clusters |
| Legible a **24 px** (suelo del modo de reto motor) | Si la silueta se vuelve una mancha, el pool `visual` deja de discriminar |
| Contraste verificable contra los tokens del sistema 2 | El contraste se mide contra un fondo que es un token: se comprueba contra los tokens vigentes, no se congela por asset |
| **Un solo formato** por banco | Simplifica normalización, integridad y la posible derivación de `file` desde `id` |
| Sin animación ni entrelazado | Movimiento que el paciente no pidió. Rompe `prefers-reduced-motion` y la predictibilidad |
| Reconocible culturalmente para la población objetivo | Un objeto desconocido mide reconocimiento, no búsqueda visual |

### La puerta: `/art-bible` antes del sistema 18, no antes del MVP

Un revisor propuso decidir **ahora** entre fotografía de stock y arte vectorial,
porque tres problemas de accesibilidad — contraste por asset, metodología de medición
sobre siluetas, y legibilidad a 24 px — son estructuralmente más baratos con vector.

**El cálculo estaba mal, y es importante entender por qué.** El argumento era "antes
de 30-40 horas de sourcing". Pero esas horas son del **Nivel 1**: el MVP son **30
imágenes**. Y por el contrato de identidad de la regla 1, esas 30 son **desechables
por diseño**, porque el MVP no tiene persistencia — el registro vive en memoria — así
que una generación nueva de identificadores no rompe ninguna serie longitudinal.

Eso reubica la puerta con precisión:

> **El art bible debe cerrarse antes de que aterrice la persistencia local (sistema
> 18, Nivel 1). No antes del MVP.**
>
> Después de la persistencia, sustituir stock por arte definitivo cuesta una
> discontinuidad en datos clínicos reales de un paciente real. Antes, cuesta 30
> archivos.

Regla operativa: **prohibido sourcing masivo antes de `/art-bible`.** Las 30 del MVP
se declaran desechables por escrito, para que nadie sienta que hay atadura.

**Posición para que `/art-bible` no arranque de cero:** el caso a favor del vector
converge desde cuatro sitios independientes — el ancla visual del propio concepto
("silueta clara sobre fondo plano"), el suelo motor de 24 px, el contraste corregible
por token en lugar de por reexportación, y la eliminación completa del pipeline de
normalización. Pero es una decisión de dirección de arte, y no se toma desde un
documento de datos.

## UI Requirements

**Ninguna en el MVP.** El manifiesto no tiene superficie.

Dos vistas futuras lo consumirán: la vista de biblioteca del terapeuta (sistema 19)
y la resolución de nombres en el histórico (sistema 20). Ninguna es de este GDD.

## Acceptance Criteria

> Validados por `qa-lead`. Los criterios que dependen de constantes numéricas
> exactas están marcados **BLOQUEADO POR SECCIÓN D** y no son escribibles hasta
> que las fórmulas fijen `Cmax` y `Rmax` con valor, no con rango.

**Decisión de propiedad tomada aquí:** `resolve(id)` pertenece a **este** sistema,
no al 9 (registro de rendimiento). Razón: es resolución de datos del manifiesto. El
registro guarda ids y le pide al manifiesto que los traduzca; si la lógica viviera en
el registro, duplicaría conocimiento del esquema del manifiesto en dos sistemas.

### Validación del manifiesto

**AC-1 — IDs únicos** · Unit · **BLOCKING**
**DADO** un manifiesto con dos entradas que comparten el mismo `id`,
**CUANDO** se ejecuta el validador,
**ENTONCES** reporta error nombrando el `id` duplicado, termina con código distinto
de cero y **no** produce manifiesto de salida.

**AC-2 — Continuidad de ids entre versiones** · Integration · **BLOCKING**
**DADO** el manifiesto del tag anterior y el de HEAD,
**CUANDO** se comparan,
**ENTONCES** todo `id` del anterior sigue presente; un `id` que desaparece sin que su
entrada esté en `status: retired` es un error.
**IMPLEMENTADO** — `tools/banco/diff-manifiestos.js`. **Decidido: contra `origin/main`.** El
proyecto es de desarrollo troncal y no tiene tags, así que "último tag" no existe hoy y
elegirlo sería aplazar la comprobación con apariencia de haberla resuelto.

Detecta además un caso que este criterio no pedía: un `file` o un `cluster` que **cambia bajo
un id que se queda**. Es la misma clase de defecto que sustituir el archivo.

**AC-3a — El importador se niega a escribir sobre un id existente** · Unit · **BLOCKING**
**DADO** un manifiesto que ya contiene el `id` `manzana-liso-01`,
**CUANDO** el importador recibe un asset nuevo con ese mismo `id`,
**ENTONCES** se niega con un error que nombra el `id` y **no** escribe nada. No existe
bandera ni opción que fuerce la sobrescritura.

**AC-3b — El fichero de integridad cuadra con el disco** · Integration · **BLOCKING**
**DADO** `banco.lock` versionado en git y los archivos normalizados en disco,
**CUANDO** CI recalcula los hashes desde disco y los compara con el lock,
**ENTONCES** cuadran; cualquier discrepancia rompe el build nombrando los `id`
afectados. **CI nunca confía en un hash almacenado dentro del manifiesto** — lo
recalcula siempre.

**AC-3c — `retiredAt` es obligatorio al retirar** · Unit · **BLOCKING**
**DADO** una entrada con `status: retired` y sin `retiredAt`,
**CUANDO** se ejecuta el validador,
**ENTONCES** falla nombrando el `id`. Y a la inversa: un asset `active` con
`retiredAt` también falla.

**AC-4 — Validación total, nunca parcial** · Unit · **BLOCKING**
**DADO** un manifiesto inválido, por ejemplo una entrada sin `categories`,
**CUANDO** se ejecuta el validador,
**ENTONCES** falla nombrando entrada y campo, y **no** escribe ningún archivo de
salida validado.

**AC-5a — Archivo ausente, lógica** · Unit · **BLOCKING**
**DADO** que la función inyectada `existeArchivo(ruta)` devuelve `false` para el
`file` de una entrada,
**CUANDO** se ejecuta el validador con esa función inyectada,
**ENTONCES** reporta error nombrando el `id` afectado.
**IMPLEMENTADO** — `tools/banco/validar.js`, con `existeArchivo` inyectado. Y el motivo que
importa a largo plazo no es el test: ADR-0001 lo pide para que el mismo validador sirva en una
futura ruta de ejecución, si el terapeuta sube sus propias imágenes. Un validador que abre
archivos sólo sirve en construcción.

**AC-5b — Archivo ausente, comprobación real** · Integration · **BLOCKING**
**DADO** el manifiesto y el directorio `assets/` reales,
**CUANDO** se ejecuta el validador con el comprobador real,
**ENTONCES** todo `file` existe, o el build falla con el mismo formato de error.

**AC-6 — Cluster por debajo del mínimo** · Unit · **BLOCKING**
*Desbloqueado: la Sección D fija `Cmax = 60`, `Rmax = 4`, `clusterMin = 16` (ADR-0006).*
**DADO** un manifiesto con un cluster de exactamente **15** elementos activos
(`clusterMin − 1`, con `clusterMin = 16` tras ADR-0006),
**CUANDO** se ejecuta el validador,
**ENTONCES** falla nombrando el cluster, su recuento real y el mínimo requerido.
**IMPLEMENTADO**, y con su escalón por nivel: mientras el banco tenga menos entradas activas
que su objetivo, `clusterMin` es ADVERTENCIA. El escalón se decide **por un dato, no por una
bandera**: una `--permisivo` acabaría puesta en CI para siempre.

### Consultas de pool

**AC-7 — Los retirados nunca entran en generación** · Unit · **BLOCKING**
**DADO** un manifiesto con assets `retired` y `active`,
**CUANDO** se consulta un pool con cualquier combinación de objetivo y nivel de
similitud,
**ENTONCES** ningún asset retirado aparece en el resultado.

**AC-8 — Los tres niveles de similitud devuelven conjuntos distintos** · Unit · **BLOCKING**
**DADO** un objetivo con al menos dos categorías y un cluster poblado,
**CUANDO** se consultan los niveles `ninguna`, `semantica` y `visual`,
**ENTONCES** `visual` ⊆ assets del mismo cluster; `semantica` comparte al menos una
categoría y tiene cluster distinto; `ninguna` no comparte **ninguna** categoría. Los
tres conjuntos son disjuntos entre sí.

**AC-9 — Atributo ausente excluye, no rompe** · Unit · **BLOCKING**
**DADO** un manifiesto donde algunos assets tienen `attrs.price` y otros no,
**CUANDO** se pide un pool con `atributoRequerido: 'price'`,
**ENTONCES** solo aparecen los que lo tienen; los demás se excluyen en silencio, sin
error.

**AC-10 — Pool vacío falla explícito** · Unit · **BLOCKING**
**DADO** una consulta cuyos filtros no casan con ningún asset activo,
**CUANDO** la generación de tableros la invoca,
**ENTONCES** devuelve un error nombrado que identifica el filtro responsable.
**Nunca** un tablero parcial.

**AC-11 — Reproducible con la misma semilla** · Unit · **BLOCKING**
**DADO** una fuente aleatoria inyectada fija y un manifiesto fijo,
**CUANDO** se llama dos veces a la consulta con los mismos argumentos,
**ENTONCES** devuelve los mismos ids **en el mismo orden** (`assert.deepStrictEqual`).

**AC-12 — Aserción determinista, ejemplo concreto** · Unit · **BLOCKING**
**DADO** `fuenteFija = () => 0.42` y el fixture `tests/fixtures/manifiesto-minimo.js`,
**CUANDO** se pide el pool `visual` para el objetivo `manzana-roja`,
**ENTONCES** el resultado es **exactamente** `['tomate', 'cereza', 'fresa']`, por
igualdad de array ordenado. Nunca una aserción estadística tipo "contiene al menos
tres" ni "la distribución es aproximadamente uniforme".

### Resolución de histórico

**AC-13 — Un id retirado resuelve** · Unit · **BLOCKING**
**DADO** un registro que referencia un `id` con `status: retired`,
**CUANDO** se llama a `resolve(id)`,
**ENTONCES** devuelve `name` y `file` más `retirado: true`, sin lanzar excepción.

**AC-14 — Un id desconocido no rompe la pantalla** · Unit · **BLOCKING**
**DADO** un registro que referencia un `id` ausente del manifiesto,
**CUANDO** se llama a `resolve(id)`,
**ENTONCES** devuelve el `id` crudo con `desconocido: true`, **sin lanzar excepción**.

**AC-16 — El orden de los pools se respeta** · Unit · **BLOCKING**
**DADO** cualquier asset activo del manifiesto como objetivo,
**CUANDO** se calculan los tres pools,
**ENTONCES** `|pool_visual| ≤ |pool_semantica| ≤ |pool_ninguna|`.
*Si el orden se invierte para algún asset, su calibración semántica está rota aunque
el esquema sea válido y todas las validaciones estructurales pasen. Es el criterio
que detecta sobre-etiquetado sin necesidad de mirar `solapamiento` asset por asset.*

**AC-17 — Todo cluster está contenido semánticamente** · Unit · **BLOCKING**
**DADO** un manifiesto con un cluster cuyos miembros no comparten ninguna categoría
común,
**CUANDO** se ejecuta el validador,
**ENTONCES** falla nombrando el cluster y el miembro discrepante. Implementa la
regla 8.

**AC-18 — El color no separa clusters** · Unit · **BLOCKING**
**DADO** un identificador de cluster que contiene un término del léxico de color
(`rojo`, `verde`, `azul`, `amarillo`, `naranja`, `morado`, `rosa`, `marrón`),
**CUANDO** se ejecuta el validador,
**ENTONCES** falla nombrando el cluster y citando la regla 9.
*Heurística deliberada: no comprueba la separabilidad real en escala de grises, que no
es automatizable sobre fotografía variada. Comprueba el síntoma más común y hace la
regla visible al escribir el nombre. La separabilidad real se revisa una vez, en
galería de escala de grises, al cerrar la composición del banco.*

### Lo que este sistema NO comprueba

**AC-15 — Ningún instrumento referencia un archivo por ruta** · Integration/tooling ·
**BLOCKING** · **propiedad del sistema 14**
**DADO** el árbol de código de los instrumentos,
**CUANDO** el análisis estático busca literales de ruta de imagen fuera del módulo del
manifiesto,
**ENTONCES** no encuentra ninguno; cualquier coincidencia rompe el build señalando
archivo y línea.
*Se declara aquí para trazabilidad, pero es la regla 3 y su verificación pertenece al
sistema 14. La herramienta no existe.*

### Infraestructura de test que no existe todavía

Ninguno de los criterios de arriba puede ejecutarse hoy. Va a `/test-setup`:

- `tests/unit/manifiesto-banco-imagenes/`, `tests/integration/…`, `tests/fixtures/`
- `package.json` con `node:test`
- El propio validador, con `existeArchivo` inyectable
- La herramienta de diff de manifiestos (AC-2)
- El analizador estático de rutas (AC-15, sistema 14)
- Cinco fixtures: id duplicado, archivo ausente, cluster corto, asset retirado,
  atributo ausente
- `Cmax` y `Rmax` como constantes con valor exacto (AC-6)

## Open Questions

| Pregunta | Quién resuelve | Cuándo |
|---|---|---|
| ¿La similitud semántica y la visual son ejes distintos para el terapeuta? | Colaborador clínico | **Antes de producir contenido.** Si dice que no, el eje `semantica` desaparece y el banco baja a ~130 elementos |
| ~~¿Formato del manifiesto: JSON o módulo JS?~~ | **CERRADA** | **Módulo ES con literales, en `src/banco/`.** Sin paso de build, `tsc --checkJs` solo comprueba de verdad literales en ficheros incluidos: un JSON cargado en ejecución tipa como `any` y la comprobación se evapora justo donde 384 registros curados a mano la necesitan. Ver `docs/architecture/0001-formato-del-manifiesto.md` |
| ¿El terapeuta podrá añadir imágenes propias? | Producto | Nivel 1 o después. Cambia el manifiesto de artefacto de construcción a artefacto de ejecución |
| ~~¿Un asset puede estar en más de una categoría?~~ | **CERRADA** | **Sí.** `categories` es un array; el `cluster` es único y global. Ver "El modelo es asimétrico a propósito" |
| ¿`file` puede derivarse de `id` y desaparecer como campo obligatorio? | Diseño | Cuando `/art-bible` fije un formato único. Elimina una clase entera de errores de desincronización y refuerza la regla 3. Reversible si algún día hay formatos mixtos |
| ¿Cómo se mide el contraste sobre una silueta no rectangular con transparencia? | Sistema 2 (tokens de tema) | WCAG 1.4.11 se escribió para componentes de color plano, no para recortes. Propuesta a evaluar: medir sobre el contorno con alfa > 50% y tomar el **peor caso**, no la media |
