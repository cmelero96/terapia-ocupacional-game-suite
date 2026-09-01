# Sistema 13 — Herramientas del banco: validador, integridad, continuidad e importador

| Campo | Valor |
|---|---|
| **Capa** | Meta |
| **Hito** | MVP |
| **Estado** | Designed · implementado y ejecutable |
| **Depende de** | 1 (manifiesto), 4 (de donde se deriva `clusterMin`) |
| **Del que dependen** | Toda la producción de contenido. Sin esto, ninguna imagen entra |
| **Código** | `tools/banco/`, `src/banco/` |

## Summary

Cuatro herramientas que protegen **un solo invariante** desde cuatro sitios distintos:

> Un `id` es la clave con la que se guarda qué estímulo vio el paciente, y toda la medición
> asume que ese estímulo **no cambia entre sesiones**.

## Overview

El banco de imágenes es el activo más caro del proyecto: **256 imágenes**, dimensionadas en
ADR-0006. Y es contenido curado a mano, entrada por entrada.

Este sistema existe porque **el tipo de dato no puede proteger lo que hay que proteger**. El
`typedef` del sistema 1 da forma: que `id` sea una cadena y `categories` un array. Lo que no
puede expresar es que el `id` sea único, que la fecha de retirada esté si y sólo si el asset
está retirado, que el archivo exista, o que el cluster tenga suficientes elementos.

Cuatro herramientas, y cada una ve algo que las otras no:

| Herramienta | Qué protege | Qué no ve |
|---|---|---|
| **Validador** | La forma y las cuatro invariantes que JSDoc no expresa | Que el archivo de detrás haya cambiado |
| **`banco.lock`** | Que el archivo detrás de un id **no se sustituya** | Que un id desaparezca |
| **Diff de continuidad** | Que un id **no se borre**, y que `file` o `cluster` no muten bajo un id que se queda | El contenido de los archivos |
| **Importador** | Que no se cree un id que ya existe | Nada de lo anterior |

**La combinación es la que cierra el invariante.** Con validador y sin lock, alguien
reemplaza un PNG y todo pasa en verde: el id sigue, el `file` sigue, y el paciente ve otra
cosa. Con lock y sin diff, alguien borra una entrada y los datos de sesiones anteriores se
quedan sin estímulo.

## Player Fantasy

No aplica: el usuario es quien produce el contenido, no el paciente ni el terapeuta.

La sensación buscada es: *«si me equivoco al preparar el banco, me lo dice ahora y me dice
qué entrada y qué campo — no lo descubro dentro de tres meses en la sesión de un paciente.»*

De ahí la regla de los mensajes: **cada error nombra la entrada, el campo y la vía correcta**,
no sólo que algo está mal.

## Detailed Rules

### R1 — Funciones PURAS con predicados inyectados

`validarManifiesto` recibe `existeArchivo`. `construirLock` recibe `leer`. Ninguna toca el
disco. Todo lo impuro vive en `tools/banco/cli.js`.

Dos motivos, y el segundo es el que importa a largo plazo:

1. Los estándares de test del proyecto prohíben que un test unitario toque el disco.
2. **ADR-0001 lo pide explícitamente**, para que el mismo validador sirva en construcción y en
   una futura ruta de ejecución — el sistema 19, si algún día el terapeuta sube sus propias
   imágenes. **Un validador que abre archivos sólo sirve en construcción.**

### R2 — Validación TOTAL, nunca parcial

El validador **recoge todos los problemas y después decide**. No aborta en el primero.

Con 256 entradas curadas a mano, un validador que aborta obliga a 256 ejecuciones para
encontrar 256 erratas.

Y con un solo error **no aprueba nada**: no existe «manifiesto parcialmente válido», porque un
banco a medias produce tableros a medias y eso contamina el dato.

### R3 — No existe «reemplazar manteniendo el id»

El importador **se niega a escribir sobre un id existente, y no hay bandera que lo fuerce**.

No es una precaución: es la consecuencia directa de qué es un `id`. Sobrescribir uno significa
que la sesión 4 y la sesión 7 de un paciente dicen que vio lo mismo, y vio dos cosas
distintas.

La vía correcta es **retirar el id y crear otro**. Cuesta una fila más y conserva la validez de
todo lo medido.

**`--forzar` no existe y no se va a añadir.** Una bandera así acaba siempre puesta.

### R4 — Retirar conserva la fila; borrarla está prohibido

`retiredAt` es obligatorio al retirar, y **se comprueba en las dos direcciones**: un asset
activo con `retiredAt` también falla. Un `if (retired && !retiredAt)` deja pasar la mitad del
caso.

Sin la fecha, el terapeuta no puede distinguir «el paciente empeoró» de «alguien retiró una
imagen» — retirar baja `clusterSize`, y con él cambian tres fórmulas sin que nadie toque una
perilla.

### R5 — La fecha de retirada NO se toma del reloj

`retirar` la exige como parámetro. Leer el reloj haría la herramienta no determinista, y quien
retira sabe la fecha.

### R6 — El escalón de `clusterMin` se decide por un DATO, no por una bandera

Mientras el banco tenga menos entradas activas que su objetivo, `clusterMin` es
**advertencia**; cuando esté completo, **bloquea**.

Es el escalón por nivel del sistema 1: ningún reparto de las primeras imágenes satisface un
mínimo de 16, así que el primer manifiesto sería inválido por construcción.

**Se decide por el recuento y no por `--permisivo`**, porque una bandera así acabaría puesta en
CI para siempre. Y el escalón existe para que la salida fácil no sea **bajar** `clusterMin`,
que es lo único que hace real la perilla de similitud visual.

### R7 — La integridad vive FUERA del manifiesto

`banco.lock` es un archivo aparte. CI **nunca** confía en un hash almacenado dentro del
manifiesto.

El motivo: quien sustituye un archivo puede actualizar el hash en la misma edición si los dos
viven en el mismo sitio. Separarlos hace que cambiar el lock sea **un acto visible en la
revisión**.

Y el hash se calcula sobre los archivos **ya normalizados**. Calcularlo antes rompería el lock
en cada ejecución del pipeline, y la única salida sería regenerarlo — o sea, desactivar la
comprobación.

### R8 — El lock NO es JSON, y eso es deliberado

Formato de una línea por asset, `id  hash`, ordenado por id.

Un diff de git sobre líneas `id hash` se lee de un vistazo; sobre JSON con llaves y comas, no.
**Este archivo existe para ser leído en una revisión.**

Y el orden estable importa: un lock que cambia de orden entre ejecuciones produce un diff
enorme en cada commit, y nadie vuelve a leerlo.

### R9 — Una línea malformada del lock LANZA, no se ignora

Un lock a medias aprobaría archivos que nadie ha comprobado, y eso es peor que no tener lock.

### R10 — La continuidad se compara contra `origin/main`

El GDD del sistema 1 dejaba la decisión abierta: *«último tag o último commit en `main`»*.

**Decidido: `origin/main`.** El proyecto es de desarrollo troncal y **no tiene tags**, así que
«último tag» no existe hoy, y elegirlo sería aplazar la comprobación con apariencia de haberla
resuelto.

Consecuencia asumida: se compara contra la rama publicada, no contra una versión liberada. El
día que haya tags, el criterio se revisa — y entonces habrá algo real contra lo que comparar.

### R11 — Sólo dos cosas rompen el build en el diff

`borrados` y `mutados`. Las altas, las retiradas y las reactivaciones son operaciones
legítimas; convertirlas en error obligaría a una bandera para saltarse la comprobación, y una
bandera así acaba siempre puesta.

Una **reactivación avisa**: un asset que vuelve cambia `clusterSize`, y con él tres fórmulas.

### R12 — La regla del color distingue MATIZ de LUMINANCIA

La regla 9 del sistema 1 dice que la separación entre clusters debe sobrevivir en escala de
grises.

**Matiz → error.** Un cluster llamado `redondo-rojo` viola la regla: si dos clusters sólo se
distinguen por matiz, un paciente con daltonismo recibe una dificultad que el terapeuta no
configuró.

**Luminancia → advertencia, y por otro motivo.** `claro` contra `oscuro` **no** viola la regla:
la luminancia sobrevive en escala de grises y también en el modo de colores forzados. Lo que
trae es otro riesgo: **el pipeline de contraste puede descartar el cluster claro entero.** El
GDD del sistema 1 ya lo cuantificó — sobre el fondo del tablero, un limón amarillo pálido da
1,06:1.

La primera versión de esta comprobación metía `claro` y `oscuro` como error, y estaba mal.

**Y es una aproximación declarada, no una comprobación.** Se vigila el **nombre** del cluster.
Un cluster llamado `frutas-caras` puede estar separado por matiz sin que ninguna palabra lo
delate. Lo que la lista impide es el caso obvio y frecuente.

## Formulas

### F1 — `clusterMin`, y su canario

```
clusterMin = ceil( (Cmax − 1) / Rmax ) + 1 = ceil(59 / 4) + 1 = 16
bancoTotal = clusterMin × G = 16 × 16 = 256
```

| Variable | Valor | Origen |
|---|---|---|
| `Cmax` | 60 | Sistema 4. **No se redeclara**: se reexporta |
| `Rmax` | 4 | Perilla de proyecto, **sin validar** |
| `G` | 16 | Clusters visuales |
| `clusterMin` | **16**, derivada | — |
| `bancoTotal` | **256** | — |

**Hay un test canario que comprueba que la constante declarada coincide con su derivación.**
Existe por una razón concreta: ADR-0006 encontró que `clusterMin` estaba derivada de una
fórmula **muerta**, y eso arrastró el presupuesto de contenido entero durante meses. El canario
hace que mover `Cmax` sin recalcular falle en un test en lugar de aparecer en una factura de
arte.

### F2 — `hash(contenido)`

```
hash(c) = primeros(32, hex(SHA-256(c)))
```

**128 bits, y truncar aquí no es un atajo peligroso.** Esto no es una firma: es detección de
cambio accidental o de una sustitución que alguien intentó pasar sin decirlo. Contra un
adversario capaz de construir colisiones, este archivo no es la defensa — la defensa es la
revisión de código.

### F3 — `comparar(enGit, enDisco)`

Tres salidas **distinguibles a propósito**, porque piden acciones distintas:

| Salida | Qué pasó | Gravedad |
|---|---|---|
| `sustituidos` | El id sigue y el contenido cambió | **ERROR** |
| `nuevos` | Un id en disco que no está en el lock | aviso |
| `desaparecidos` | Un id en el lock que ya no está activo | aviso |

## Edge Cases

| Caso | Qué pasa |
|---|---|
| Manifiesto vacío | **Válido por forma**, con advertencia explícita: *«no sirve para jugar»*. Es el estado de hoy |
| Sin `banco.lock` y banco vacío | «Nada que comprobar». No falla |
| Sin `banco.lock` y banco con entradas | **Falla**, y dice cómo generarlo |
| Un archivo activo que falta en disco | El validador lo nombra; el lock **no lo hashea** y lo reporta como ausente |
| El archivo de un asset **retirado** que ya no existe | **No es un error.** Exigirlo para siempre convertiría cada retirada en un archivo eterno |
| Dos entradas con el mismo `file` | **Error.** Dos ids para un estímulo hacen ambigua la medición |
| Un lote que se pisa a sí mismo | **Rechazado.** Sin esta comprobación, la última entrada ganaría y las anteriores desaparecerían sin aviso |
| Un alta con `status: retired` | **Rechazada.** Nadie nace retirado |
| Retirar un id ya retirado, o desconocido | Rechazado, con su código propio |
| Una línea malformada en el lock | **Lanza** `SyntaxError` |
| Un id repetido en el lock | **Lanza** |
| No hay manifiesto en `origin/main` | «Nada que comparar». No falla. Es el estado de hoy |
| Un `id` con mayúsculas o acentos | **Error.** Dos claves que un humano lee como una |

## Dependencies

| Sistema | Relación |
|---|---|
| **1 — manifiesto** | Este sistema **implementa** sus criterios AC-1, AC-2, AC-3a, AC-3b, AC-3c, AC-4, AC-5a, AC-5b y AC-6, que estaban escritos y no tenían nada que los comprobara |
| **4 — modelo de dificultad** | `clusterMin` se deriva de `C_MAX`. Se **reexporta**, no se redeclara: tener dos copias del techo del tablero es el defecto que ADR-0006 encontró en `Cmin` |
| **8 — generación de tableros** | Consume el manifiesto validado. No depende de las herramientas |
| **19 — biblioteca portable** | Dependencia **futura**: la pureza de R1 existe para que este validador sirva ese día |

## Tuning Knobs

| Perilla | Valor | Quién la mueve |
|---|---|---|
| `R_MAX` | 4, **sin validar** | Subirla encoge el banco y empeora la habituación. Es el intercambio coste-validez, sin resolver |
| `G` | 16 | Arte y clínica juntos. Ver la biblia de arte |
| `CLUSTER_MIN` | **Derivada.** No se elige | Nadie |
| Términos de matiz y luminancia | Dos listas en `validar.js` | Se amplían cuando aparezca un caso que se escape |
| Longitud del hash | 32 hex | Sin motivo para cambiarla. Ver F2 |

## Acceptance Criteria

| # | Criterio | Nivel | Estado |
|---|---|---|---|
| AC-1 | Un id duplicado es un error que nombra el id | BLOCKING | **Pasa** |
| AC-2 | Un id borrado sin retirar rompe el build | BLOCKING | **Pasa** |
| AC-3 | El importador se niega a escribir sobre un id existente | BLOCKING | **Pasa** |
| AC-4 | No existe bandera que fuerce la sobrescritura | BLOCKING | **Pasa** — se comprueba la ausencia |
| AC-5 | Un archivo sustituido bajo un id intacto rompe el build | BLOCKING | **Pasa** |
| AC-6 | `retiredAt` se comprueba en las **dos** direcciones | BLOCKING | **Pasa** |
| AC-7 | Validación total: tres defectos distintos producen tres errores | BLOCKING | **Pasa** |
| AC-8 | Un cluster por debajo del mínimo bloquea con el banco completo | BLOCKING | **Pasa** |
| AC-9 | El escalón por nivel convierte el bloqueo en aviso | BLOCKING | **Pasa** |
| AC-10 | Un cluster exactamente en el mínimo pasa | BLOCKING | **Pasa** — el límite, donde un `<` se vuelve `<=` |
| AC-11 | Un término de matiz en el nombre del cluster es error; uno de luminancia, aviso | BLOCKING | **Pasa**, en las dos direcciones y con falsos positivos comprobados |
| AC-12 | `clusterMin` declarada coincide con su derivación | BLOCKING | **Pasa** — canario |
| AC-13 | El manifiesto serializado se puede volver a evaluar | BLOCKING | **Pasa** — ida y vuelta real |
| AC-14 | Un lock malformado lanza en lugar de ignorarse | BLOCKING | **Pasa** |
| AC-15 | El resumen no dice «cuadra» si hay descuadres | ADVISORY | **Pasa** — la primera versión lo decía |
| AC-16 | Los códigos de salida son 1 en cada fallo | BLOCKING | **Verificado a mano** con archivo ausente e id duplicado |
| AC-17 | El manifiesto real del repositorio es válido | BLOCKING | **Pasa** |

## Lo que este sistema NO comprueba, y hace falta

1. **Que el cluster sea visualmente coherente.** Eso lo ve una persona. Falta la **galería de
   clusters**: una página HTML estática que pinte cada cluster en escala de grises al tamaño
   mínimo, para revisar a ojo. Es la cuarta herramienta que ADR-0001 nombra y **la única que no
   está**. No se construye antes de que exista una imagen: una galería vacía no se puede
   revisar.
2. ~~**Que la imagen cumpla contraste.**~~ **CERRADO el 2026-09-01, y no como estaba
   previsto.**

   Estaba declarado como «el hueco más caro»: el GDD del sistema 1 avisa de que el coste de
   contenido no incluye ningún paso de recoloreado, y que si un porcentaje no marginal del arte
   falla el contraste, hay horas sin presupuestar.

   **Ese coste no existe.** Con `mask-image` y `currentColor`, el color del dibujo **no es una
   propiedad del archivo**: lo pone el documento. Los píxeles pintados toman exactamente
   `--board-ink` sobre `--board-bg`, cuya razón es **16,07:1** y ya tiene puerta propia en el
   generador de tokens. No hay 256 imágenes que auditar: hay **dos tokens**, ya auditados.

   Lo que sí queda es **otra cosa**: el grosor del trazo contra el tamaño mínimo. A 24 px un
   trazo de 4 unidades sobre 100 mide menos de un píxel de dispositivo. Medido con el núcleo
   del trazo —percentil 90 de cobertura— el peor de los 64 dibujos da **6,69:1**, así que pasa
   el 3:1 de WCAG 1.4.11. Puerta en `tests/navegador/banco-contraste.spec.js`.

   **Cuidado al medir esto**, porque el primer intento dio 2,05:1 y parecía un fallo. Usaba la
   MEDIANA de cobertura, que promedia el borde suavizado con el núcleo. Se vio porque el
   resultado **no era monótono**: grosor 5 pasaba, 6 fallaba, 7 pasaba — y un trazo más gordo
   no puede tener menos contraste.
3. **Que el nombre sea el que usaría el paciente.** Criterio clínico.
4. **Que el color no separe dos clusters de verdad.** Ver R12: se vigila el nombre, que es una
   aproximación.
5. **La normalización de los archivos.** El lock asume archivos ya normalizados y nadie los
   normaliza todavía. Hoy no hace falta porque los 64 los genera una herramienta que cumple los
   requisitos por construcción; hará falta el día que entre arte de fuera.
6. **Si el trazo es lo bastante gordo para 24 px.** El peor dibujo tiene **15 píxeles** a media
   cobertura o más a ese tamaño: es legible y es fino. Que se RECONOZCA no lo decide ninguna
   medida — está en la galería y en la hoja de revisión.

   Y no es un cambio gratis: subir el grosor cambiaría los 64 archivos **bajo sus
   identificadores**, que es exactamente lo que el proyecto prohíbe. La vía sería retirar los 64
   y crear otros.
