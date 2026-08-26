# Tokens de tema y contraste

> **Status**: Revised — `/design-review` 2026-08-25, veredicto NEEDS REVISION, cambios aplicados
> **Author**: Carlos + `accessibility-specialist`, `qa-lead`
> **Last Updated**: 2026-08-25
> **Sistema**: #2 del índice · Core · MVP · capa Foundation
> **Implements Pillar**: **Pilar 2** — "El error se mide, no se muestra". Este sistema
> es el que lo hace estructuralmente cierto en lugar de una convención. Sirve también
> al pilar 5 (adulto, no infantil) a través del Visual Identity Anchor.

## Overview

Es la **única fuente de verdad de todo color del producto**, más la maquinaria que
**demuestra por cálculo** que cada emparejamiento cumple su requisito de contraste.

Existe por dos razones. La primera es que en este producto **el contraste es un
requisito clínico, no estético**: la población incluye baja visión, y la regla del
propio proyecto dice que el contraste *se calcula, nunca se estima*. Sin un sistema de
tokens, cada componente inventa sus colores y no hay invariante que comprobar.

La segunda es más interesante. Este sistema es el que convierte el pilar 2 en una
propiedad **estructural**: en el ámbito del paciente **no existe un token de error**.
No es que esté prohibido pintar un fallo en rojo — es que no hay rojo que leer. Un
pilar que no se puede incumplir por construcción es más fuerte que uno que depende de
que nadie se despiste.

Hereda además un problema que el sistema 1 le pasó de forma explícita: **cómo se mide
el contraste de una silueta recortada con transparencia**. WCAG 1.4.11 se escribió para
componentes de interfaz de color plano, no para fotografías con brillo, sombra y
canal alfa. Sin un procedimiento computable, "se calcula, no se estima" es una
instrucción sin método.

## Player Fantasy

**Es infraestructura y no tiene fantasía propia.** El paciente no percibe un sistema de
tokens; percibe que puede distinguir las cosas.

Lo que habilita, y no es poco: **que el paciente nunca vea un juicio.** El ámbito de
color del paciente no contiene rojo de error, ni verde de acierto-frente-a-fallo, ni
ninguna pareja semántica de aprobado y suspenso. La superficie que mira no tiene
vocabulario para reprobarle.

Y en el otro lado del dispositivo, sirve a la fantasía del terapeuta por la vía de la
credibilidad: el marco se ve como una herramienta profesional, no como un juguete ni
como un aparato médico. Eso es el Visual Identity Anchor, y este sistema es donde deja
de ser una intención y pasa a ser un conjunto de valores.

**El modo de fallo perceptible:** si el contraste está mal, un paciente con baja visión
falla objetivos que sí veía y el registro lo anota como déficit de búsqueda visual. El
dato queda contaminado con ruido óptico, y ni el terapeuta ni el sistema tienen forma
de saberlo. Por eso el contraste es de este sistema y se comprueba por cálculo.

> `art-director` no consultado — modo Lean. La dirección de arte ya existe como el
> Visual Identity Anchor del documento de concepto, y este GDD la ejecuta en lugar de
> reabrirla.

## Detailed Rules

### Core Rules

1. **Un color existe solo como token.** Ningún literal de color — hexadecimal, `rgb()`,
   `hsl()` ni palabra clave — aparece en ningún componente. Los tokens son propiedades
   personalizadas de CSS.
2. **Dos ámbitos, y no se cruzan.** El **marco** (cromo del terapeuta, sobrio) y el
   **tablero** (área de juego del paciente, donde el contraste manda). Un componente del
   tablero no puede leer un token del marco, ni al revés.

   Esto ejecuta la decisión del Visual Identity Anchor — *"contraste dentro del tablero,
   sobriedad alrededor"* — al nivel donde es comprobable.

   **El aislamiento es estructural, no vigilado.** Es la filosofía de la regla 4 — "no
   hay rojo que leer" — aplicada a la regla que no la aplicaba.

   | Elemento | Decisión |
   |---|---|
   | Nombre del token | Prefijo obligatorio: `--frame-*` o `--board-*` |
   | **Dónde se declara** | **`--frame-*` solo en `.frame-root`; `--board-*` solo en `.board-root`. NINGUNO en `:root`** |
   | Ubicación del componente | `src/ui/frame/` o `src/ui/board/` |

   **Por qué contiene de verdad.** Las propiedades personalizadas heredan por posición
   en el árbol DOM. `.frame-root` y `.board-root` son **hermanos** en la estructura
   real, así que **no existe ruta de herencia entre ellos**. Un nodo del tablero no
   puede resolver `--frame-ink`: obtiene el fallback inválido, que es un fallo visible
   en lugar de un color equivocado. No es que esté prohibido leerlo — **la búsqueda
   termina sin encontrar nada.**

   **INVARIANTE, no nota al pie: `.frame-root` y `.board-root` nunca se anidan.** El
   panel modal opaco que el documento de concepto ya compromete es exactamente donde
   esto se va a violar — un `<dialog>` envolviendo el tablero por comodidad de
   maquetación. **El panel es hermano también.**

   **`@scope` NO resuelve esto**, y conviene decirlo porque es el error que alguien
   cometerá después: `@scope` limita **qué selectores se aplican**, no la herencia de
   propiedades personalizadas. Parece que aísla variables y solo aísla selectores.

   Descartados: `@property { inherits: false }` rompe la herencia también *dentro* del
   marco y tiene soporte desigual. Shadow DOM daría aislamiento real al precio de todo
   el modelo de estilos, con interacciones desconocidas en foco, ARIA y colores
   forzados, para un beneficio que los hermanos ya entregan.

   **El grep baja de mecanismo de aplicación a aviso temprano.** Se queda porque es
   gratis y da buen mensaje, pero **la contención ya no depende de él**. Sus tres
   derrotas conocidas, documentadas y ahora inocuas: nombre de token construido
   dinámicamente, componente compartido fuera de las dos carpetas, y herencia.
3. **El acento tiene exactamente un hogar: el objetivo actual.** Ningún otro componente
   puede leerlo.

   > Esto fue un defecto real del prototipo desechable, no una precaución teórica: el
   > acento se filtró a los deslizadores, al borde de la barra de objetivo y al aro de
   > "encontrado". Usar el mismo tono para "esto busco" y "esto ya lo encontré" diluye
   > la única señal que el documento declara única.
4. **En el ámbito del paciente no existe token de error ni de fallo.** Ni rojo, ni la
   pareja semántica acierto/fallo, ni ningún color con carga de juicio.

   Es el pilar 2 aplicado en la capa de tokens. No se prohíbe pintar un fallo en rojo:
   **no hay rojo que leer**. Y a diferencia de una convención, esto se comprueba.
5. **El contraste es propiedad de un PAR, no de un token.** Un token suelto no tiene
   contraste; un par (primer plano, fondo) sí. El sistema declara el conjunto de pares
   legales con su razón exigida. **Emparejar dos tokens no declarados es un error.**
6. **Todo par declarado se verifica por cálculo, en los temas que tienen tokens
   propios: claro y oscuro.** Nunca a ojo, nunca por captura de pantalla. Es aritmética
   pura sobre valores declarados, así que es la cosa más testeable del sistema.

   **Colores forzados queda fuera de esta regla a propósito.** En ese modo el color no
   lo fija el token: lo sustituye el sistema operativo o el motor del navegador, así
   que no hay nada propio que calcular. Escribir un criterio de "cálculo" para ese tema
   sería inventar un número sin significado. Se verifica de otra forma — conformidad
   estructural — y eso está en Acceptance Criteria.
7. **Todo funciona en escala de grises.** El color puede reforzar, nunca identificar.
   Extiende la regla 9 del sistema 1 — donde el color no podía *separar* dos clusters —
   a toda la interfaz.

   **Son dos preguntas distintas y solo una es matemática.** La primera: ¿la razón de
   contraste sobrevive al desaturar? Eso se calcula, y es un test. La segunda: ¿el
   paciente distingue de verdad figura de fondo sin el matiz? Eso es percepción, se
   comprueba con captura y firma del especialista de accesibilidad, y **no** se
   convierte en un criterio automático — hacerlo daría la impresión de que un número la
   resuelve.
8. **El tamaño del objetivo es un token y es un parámetro clínico.** `--target-min-size`,
   controlado por el terapeuta entre 24 px y 140 px, con **44 px como suelo de la
   escalera estándar**. El rango 24-44 px existe solo como **modo de reto motor**
   explícito, con confirmación del terapeuta y marca en el registro.
9. **El fondo del tablero es invariante al tema. Los dos ámbitos tienen temas
   desacoplados.**

   | Ámbito | Temas | Origen |
   |---|---|---|
   | **Marco** | Claro, oscuro, colores forzados | Sigue al terapeuta y a `prefers-color-scheme` con libertad. Solo exige 3:1 y lo mira un adulto sin déficit visual declarado |
   | **Tablero** | **Un solo fondo, claro, fijo** | **Nunca deriva de `prefers-color-scheme`.** Un tablero oscuro es un **ajuste clínico del Nivel 1**, explícito y registrado en el log |

   > **Esta regla sustituye a un "tres temas completos en los tres" que era
   > mutuamente imposible con F1.** Doce objetos plausibles de un banco terapéutico
   > medidos contra el fondo del tablero: **seis fallan el umbral en claro, seis en
   > oscuro, y ninguno falla en ambos.** Los conjuntos son complementarios — los assets
   > claros necesitan fondo oscuro y los oscuros fondo claro. Con un banco fijo y un
   > tema conmutable, **la mitad del banco queda fuera de norma en el tema activo.**
   >
   > | Asset | vs claro | vs oscuro |
   > |---|---|---|
   > | Limón | 1,02 FALLA | 17,30 pasa |
   > | Camiseta blanca | 1,02 FALLA | 17,27 pasa |
   > | Manzana roja | 4,87 pasa | 3,61 FALLA |
   > | Zapato negro | 15,96 pasa | 1,10 FALLA |

   **Y el encuadre no es de accesibilidad, es del pilar 3.** El contraste es un
   parámetro de dificultad en este producto. Si el fondo del tablero cambia con el
   tema, **conmutar a oscuro altera la dificultad clínica sin que el terapeuta toque
   una perilla** — el sistema cruzando su rango por causas ajenas a su configuración.

   Y peor: si la tableta Windows viene en oscuro de fábrica, cada vez más habitual,
   **el tablero del paciente heredaría oscuro sin que ningún terapeuta lo decidiera.**

   El valor por defecto debe ser **claro**, no solo fijo: fondo oscuro con siluetas
   claras produce **halación** en adultos mayores con cataratas, el mismo mecanismo de
   ruido óptico contaminando el dato que este documento ya reconoce para el contraste.

   Consecuencia práctica, y es una simplificación: **desaparece toda la validación de
   pares de un tema completo del ámbito tablero.**
10. **`prefers-reduced-motion` se respeta, y el acuse de recibo se vuelve instantáneo,
    nunca desaparece.**

    > Otro defecto real del prototipo: la regla ponía `opacity: 0`, eliminando la señal
    > por completo. Eso cae exactamente en el escenario que el concepto rechaza — *"la
    > ausencia total de respuesta se percibe como que el sistema está roto"* — y afecta
    > justo a pacientes con deterioro motor o vestibular, que son quienes más
    > probablemente tienen esa opción activada en el sistema.

### El patrón que hay que nombrar: el entorno entrando en el espacio clínico

Esta es la **tercera aparición** del mismo modo de fallo en dos GDD:

| Sistema | Entrada del entorno | Qué cruzaba |
|---|---|---|
| 1 | Daltonismo del paciente | Convertía similitud `semantica` en `visual` |
| 2 | Tamaño de objetivo bajo 44 px | Ruido motor registrado como fallo de búsqueda |
| 2 | **Tema del sistema operativo** | **Cambia el fondo del tablero, y con él la dificultad** |

Tres veces no es coincidencia: es **el modo de fallo característico de este
proyecto** — una entrada del entorno entrando en silencio en el espacio de parámetros
clínicos, sin que el terapeuta lo vea ni lo haya decidido.

Va a reaparecer en los sistemas 5, 6, 8 y 11. Escribirlo aquí vale más que cualquiera
de los arreglos individuales: **cuando un GDD futuro exponga un parámetro que el
entorno pueda mover, tiene que declararlo y registrarlo, no heredarlo.**

### Resolución del tema: precedencia

**La primera versión de esta tabla hacía lo contrario de lo que decía.**
`:root[data-theme]` tiene especificidad **0,2,0**; una regla de
`@media (forced-colors: active)` sobre `:root` tiene **0,1,0**. Así que con un tema
explícito fijado, **el tema del terapeuta vencía a los colores forzados** — el revés
exacto de la intención. No depende del orden de las reglas: es especificidad pura, y
nadie lo detecta sin una tableta Windows con Alto Contraste activo **y** un tema
explícito puesto a la vez.

**Se implementa con capas de cascada, que dan precedencia independiente de la
especificidad:**

```css
@layer scheme, theme, forced;
```

| Ámbito | Pila de capas | Por qué |
|---|---|---|
| **Marco** | `scheme, theme, forced` | Sigue `prefers-color-scheme` |
| **Tablero** | **`theme, forced`** | **No lee `prefers-color-scheme`** (regla 9). La pila es más corta a propósito |

**Dos trampas que hay que documentar o el mecanismo se rompe en silencio:**

1. **Toda regla de color tiene que vivir dentro de una capa.** Cualquier regla suelta
   fuera de `@layer` pertenece a una capa implícita **posterior a todas las
   nombradas**, y **le gana a `forced`** sin que nadie lo note.
2. **Nunca `!important` en este sistema.** Dentro de la cascada por capas,
   `!important` **invierte** el orden de prioridad entre capas.

**`data-theme` vive en `<html>`**, no en `<body>`. `:root[data-theme]` es lo que las
reglas escriben, y un panel que lo ponga en `<body>` no coincide nunca.

El tamaño del objetivo **no** participa en esta precedencia: es un parámetro clínico
que fija el terapeuta y ningún ajuste del sistema operativo lo sobreescribe.

### Interacciones con otros sistemas

| Sistema | Dirección | Interfaz |
|---|---|---|
| 5 · Capa de adaptación de entrada | consume | `--target-min-size` y el separador derivado de él |
| 6 · Modo de estímulo reducido | consume | **La regla de movimiento, no color.** Ver abajo |
| 10 · Instrumento Busca | consume | Tokens del ámbito **tablero**, exclusivamente |
| 11 · Panel del terapeuta | consume | Tokens del ámbito **marco**, exclusivamente |
| 12 · Pantalla de resultados | consume | Ámbito marco |
| 13 · Herramientas del banco | consume | **El token de fondo del tablero**, para medir el contraste de cada asset contra él |
| 14 · Invariantes como barreras de CI | valida | Las reglas 1 a 4 son invariantes sobre **código fuente**, no sobre comportamiento. Se comprueban con análisis estático, y ese análisis es del sistema 14 |

La fila del sistema 13 es la herencia de la revisión del sistema 1: **el contraste de un
asset se mide contra un token que vive aquí**, así que congelar un número de contraste
por asset lo dejaría obsoleto el día que cambie el tema. Se recalcula contra los tokens
vigentes.

**El modo de estímulo reducido NO define tokens de color.** Actúa sobre movimiento y
sonido. El documento de concepto es explícito — *"sin sonido, sin animación, solo
confirmación estática"* — y decirlo aquí elimina un cuarto conjunto de tokens con su
propia rama de validación de pares.

Había una tensión real detrás: el tablero necesita saturación alta para que la tarea
de discriminación sea válida, y un paciente con sensibilidad sensorial necesita lo
contrario. Se resuelve declarando que **ese modo no toca el color**, en lugar de
dejarlo ambiguo con la frase "variante de tema".

**Dos roles visuales reservados para el sistema 5**, porque si no quien implemente la
capa de entrada **inventará un color** y la regla 1 lo prohíbe:

| Token | Ámbito | Umbral | Quién fija el valor |
|---|---|---|---|
| `--board-scan-cursor` | tablero | 3:1 (indicador de estado) | Sistema 5, con su par declarado |
| `--board-dwell-progress` | tablero | 3:1 | Sistema 5 |

**Ninguno de los dos puede reutilizar `--board-accent`**, que tiene un solo hogar.
Este sistema declara que existen y les reserva entrada; los valores son del sistema 5.

La fila del sistema 14 sigue el precedente que fijó el sistema 1 al entregarle su regla
de "ninguna ruta codificada": **aquí se declaran las reglas, allí se hacen cumplir.**

## Formulas

Convención de redondeo: `round()` = mitad hacia arriba, igual que `Math.round`. Coincide
con la del sistema 1.

### F1 — `contraste(c1, c2)`: razón de contraste WCAG

```
srgbToLin(c) = c/255 <= 0,03928 ? (c/255)/12,92
                                : (((c/255)+0,055)/1,055)^2,4

L(r,g,b) = 0,2126*srgbToLin(r) + 0,7152*srgbToLin(g) + 0,0722*srgbToLin(b)

contraste(A,B) = (L_claro + 0,05) / (L_oscuro + 0,05)
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `c` | int | [0, 255] | Componente R, G o B en sRGB de 8 bits |
| `srgbToLin(c)` | float | [0, 1] | Linealización gamma del componente |
| `L(·)` | float | [0, 1] | Luminancia relativa. Coeficientes ITU-R BT.709 |
| `L_claro` | float | [0, 1] | **`= max(L(A), L(B))`**. Definido explícitamente: una implementación que asigne `L_claro = L(A)` sin comparar produce 0,0476 para el par invertido, fuera del rango declarado |
| `L_oscuro` | float | [0, 1] | **`= min(L(A), L(B))`** |
| `contraste(A,B)` | float, salida | **[1, 21]** | Razón de contraste |

**Rango de salida:** [1, 21]. El 1 es negro sobre negro; el 21 es negro puro sobre
blanco puro.

**Umbral vinculante dentro del tablero: 4.5:1, no 7:1.** Cierra la primera pregunta
abierta, y la decisión sale de los datos de la auditoría de este documento, no de una
opinión.

Si el umbral fuera AAA, tres pares del prototipo pasarían de aprobados a bloqueantes:
`ink-soft`/`panel` en oscuro (6,01) y `ink-soft`/`bg` en los dos temas (6,99 y 6,93).
Los tres están al borde **por construcción, no por descuido**: son los tokens de texto
secundario, que es donde más presión de paleta hay.

Subir el suelo a 7:1 no mejora la accesibilidad real del proyecto — **agota la paleta
disponible** para fotografía de stock con matices limitados, y empuja a recortar
variedad visual justo donde el pilar 3 la necesita para que la perilla de similitud sea
real. El sistema 1 ya documentó un limón amarillo pálido a 1,06:1 como muestra de cuánto
puede fallar un asset de stock.

| Umbral | Norma | Aplica a |
|---|---|---|
| 3:1 | SC 1.4.11 | Componentes de interfaz y bordes, ámbito **marco** |
| **4.5:1** | SC 1.4.3 | **Vinculante y bloqueante** para todo par declarado del tablero |
| 7:1 | SC 1.4.6 | Deseable. Se reporta en la auditoría, no bloquea |

Y resuelve de paso el caso de `line`/`bg` (1,37 y 1,70): **no le basta ni el 3:1 de un
componente**, así que falla contra cualquier umbral. No es un caso límite de la decisión
AA/AAA — es un token roto de raíz.

**La razón de contraste de F1 es acromática por construcción.** No contiene término
de matiz: se computa exclusivamente desde luminancia relativa. Un par que pasa F1 pasa
"en escala de grises" **por definición**.

> **Por eso no existe una fórmula de escala de grises aparte.** Una versión anterior de
> este documento tenía una F5 (`grisesSeparables`) que reutilizaba el contraste de F1
> con un umbral de 3. Era **tautológica**: no podía fallar si el par ya había pasado
> F1. Una fórmula que no puede fallar no es una puerta, y peor: daba al curador un
> número tranquilizador que le servía de licencia para saltarse la revisión humana de
> la regla 7 — exactamente lo que esa regla existe para evitar. Eliminada, junto a su
> criterio de aceptación.
>
> La regla 7 se queda **entera**, con revisión humana, captura y firma. **Sale
> fortalecida al perder su acompañante automático.**

**Ejemplo trabajado**, `--ink-soft` (`#57534e`) sobre `--bg` (`#f5f5f4`), tema claro:

```
srgbToLin(87)=0,09525   srgbToLin(245)=0,91322
srgbToLin(83)=0,08635   srgbToLin(245)=0,91322
srgbToLin(78)=0,07613   srgbToLin(244)=0,90422

L(ink-soft) = 0,08751        L(bg) = 0,91248
contraste   = 0,96248 / 0,13751 = 6,9934
```

**6,99:1 — AA, no AAA.** Coincide con la auditoría y con AC-9.

### F2 — `contrasteSilueta(asset, fondo)`: el problema que el sistema 1 delegó aquí

WCAG 1.4.11 se escribió para un componente de color plano con borde nítido. Un asset
recortado tiene canal alfa, suavizado en el borde, y brillo o sombra interiores. Sin
procedimiento, "se calcula, no se estima" es una frase sin método.

**Procedimiento, no consejo:**

1. **Se muestrea el borde, no el interior.** Los brillos y sombras interiores son
   decisión de estilo del asset y no amenazan la separación figura/fondo, que es lo
   único que 1.4.11 protege. Lo que sí la amenaza es el **anillo perimetral**, donde el
   alfa cae de opaco a transparente.
2. **El anillo se define por erosión de la máscara alfa:**
   `boundary = subjectMask AND NOT erosión(subjectMask, w)`, con
   `subjectMask(x,y) = A(x,y) >= Θ`.
3. **Cada píxel del anillo se compone contra el fondo real**, porque eso es lo que ve
   el paciente. Un píxel con alfa parcial no es "el color del asset": es una mezcla.
   `compositeColor = (A/255)*subjectColor + (1 - A/255)*fondo`
4. **Se calcula F1 para cada píxel del anillo** contra el fondo, y se toma el
   **mínimo**.
5. **Pasa si `rMin >= 4,5`.**

**Tres casos límite que hay que fijar aquí, porque el primero es un falso aprobado
catastrófico:**

| Caso | Regla |
|---|---|
| `boundary` vacío — ningún píxel alcanza `Θ` | `rMin` es **indefinido**, e indefinido **FALLA**. **Nunca `Infinity`** |
| Imagen **sin canal alfa** | Se trata `A = 255` en todo píxel. Declarado, porque la confusión de leer 0 en el cuarto byte de un búfer sin inicializar es real |
| `erosión(componente, w)` vacío — objeto más delgado que `2w` | F2 **no reporta valor** para ese componente y escala a revisión humana |

**Por qué el primero es el defecto de línea más importante de toda la revisión.**
`Math.min()` sobre un conjunto vacío devuelve `Infinity` en JavaScript, e
`Infinity >= 4,5` es `true`. Así que un asset cuyo borde se ha desvanecido por
completo — exactamente el que el procedimiento existe para atrapar — **pasaría por
defecto**. Silencioso, tardío e irrecuperable.

**Por qué el tercero no puede dejarse pasar.** Si la erosión vacía la región, entonces
`boundary = subjectMask` **entera, interior incluido** — invirtiendo la regla 1 de este
mismo procedimiento, que dice que los brillos y sombras interiores no se miden. Produce
falsos positivos sistemáticos en cubiertos, tallos, joyería y papelería: los objetos
más comunes de un banco de objetos cotidianos.

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `A(x,y)` | int | [0, 255] | Canal alfa del píxel |
| `Θ` | int, perilla | [1, 254] · **128** · *no validado empíricamente* | Alfa desde el que un píxel cuenta como sujeto |
| `w` | int, perilla | [1, 4] px · **2** | Ancho del anillo muestreado |
| `fondo` | RGB | token | El fondo real de render (`--board-bg`) |
| `rMin` | float, salida | **[1, 21]** | Mínimo de `contraste()` sobre el anillo |

**Rango de salida:** [1, 21], igual que F1, porque es un mínimo sobre valores de F1.

**Por qué `Θ` tiene que existir, que el documento no decía.** Un píxel de alfa casi
nulo compone a **casi el fondo**, así que su contraste contra el fondo tiende a
**1,0** — el peor valor posible — para *cualquier* asset con borde suavizado, siempre.
Sin un umbral que excluya del sujeto los píxeles casi transparentes, **F2 fallaría el
100% de los assets con borde suave, incondicionalmente.** Eso es lo que `Θ` resuelve.

El valor 128 se queda como perilla **etiquetada como no validada empíricamente**, igual
que `k` y `separacionMin`. Elegirlo bien exige un barrido sobre recortes reales con
bordes de verdad difíciles — pelo, vidrio, comida con brillo. Etiquetado honesto en
lugar de derivación inventada.

**Por qué el mínimo y no la media.** 1.4.11 es pasa/falla por componente, no una
distribución. Un solo tramo de contorno bajo el umbral es **un hueco real en la
silueta** — típicamente en zonas de suavizado complejo, plumas o pelo, donde el alfa
parcial abunda — y promediarlo lo esconde justo donde es más probable. Es el mismo
principio que rige `clusterMin` y el tamaño de objetivo: **peor caso, no media.**

**Por qué se mide al tamaño de despliegue más pequeño.** Reducir la escala reintroduce
mezcla en el borde y empeora `rMin`. La verificación corre contra los **24 px** del modo
de reto motor, que es la cota más exigente, no contra el tamaño del asset fuente.

### Cómo se implementa F2, y por qué NO se escribe un decodificador

**No se escribe ningún decodificador de imagen en este proyecto. Nunca.**

La revisión planteó un trilema — decodificador PNG propio sobre `node:zlib`, WebP
inviable, o binario externo que rompe la regla de dependencias — y **los tres aceptan
una premisa falsa**: que el proyecto deba poseer un decodificador o delegar en un
binario.

**El navegador ya tiene uno.** Es alcanzable con `canvas.getImageData`, y **es el mismo
decodificador que renderizará el asset al paciente**. Gana a las tres opciones en coste
y en corrección a la vez.

Y resuelve de paso el problema del doble reescalado: el algoritmo de reducción de escala
no está definido por ningún estándar y difiere entre motores, así que una herramienta
con su propio resampler mediría un número de un pipeline distinto al que pinta. Usando
el navegador, **medir y servir dejan de ser dos implementaciones que deben coincidir por
suerte y pasan a ser una sola operación.**

Es el principio estructural-sobre-detectivo del proyecto aplicado al pipeline de medida.

**Reparto de responsabilidad:** este documento define F2 y su criterio de aprobado.
**La implementación es del sistema 13**, por el mismo precedente que el sistema 14: aquí
se declaran las reglas, allí se hacen cumplir. Salen de este GDD el formato y la
decodificación, el pipeline de reescalado, los perfiles ICC, la calidad del recorte, el
presupuesto de CI y los fixtures del decodificador.

**Escalón de aplicación por nivel**, con el precedente de `clusterMin`:

| Nivel | Estatus de F2 | Cómo se mide |
|---|---|---|
| **Nivel 0** (30 imágenes desechables) | **Advertencia** | En navegador, `getImageData`, manual. Cero infraestructura nueva |
| **Nivel 1 en adelante** | **Bloqueante** | Playwright sobre el mismo motor. Sigue sin decodificador propio |

No es un argumento de calendario — no hay plazo. Es de valor: bloquear sobre 30
imágenes que se van a sustituir no compra nada, y el camino del navegador hace que la
versión bloqueante del Nivel 1 cueste casi lo mismo.

### F2 bajo colores forzados: la garantía no se sostiene, y se declara

`--board-bg` pasa a ser `Canvas`, cuyo valor real elige el tema de Windows del usuario y
es **desconocido en tiempo de diseño**. Y a diferencia del texto de interfaz, **la
fotografía no la toca el modo**. Así que `rMin >= 4,5` **deja de valer justo en el caso
de alto contraste**, que es el que más le importa a la baja visión.

**Prohibido usar `forced-color-adjust: none` en el tablero para recuperar la garantía.**
El usuario eligió alto contraste; anularlo para una población de baja visión con el fin
de preservar una garantía de diseño está del revés.

La posición honesta: **la estructura sobrevive** vía el borde obligatorio de F4; **la
separación de silueta no**. Declarado por escrito, y comunicado al terapeuta — nota para
el sistema 11. Si el colaborador clínico reporta después pacientes con Alto Contraste y
problemas de segmentación, se reabre: como limitación registrada, no oculta.

**Ejemplo trabajado**, y es el que justifica todo el procedimiento. Sujeto
`(200, 60, 40)` sobre `--board-bg` (`#fafaf9`), un píxel del anillo con `A = 140`
(alfa 0,549):

```
compositeColor = 0,549*(200,60,40) + 0,451*(250,250,249) = (222,6 · 145,7 · 134,3)

contraste(compositeColor, board-bg) = 2,349  -> FALLA
contraste(sujeto opaco,   board-bg) = 4,865  -> pasa, por poco
```

**El color opaco pasa por un margen estrecho; el píxel del borde cae a 2,35.** La
silueta se desvanece exactamente donde el ojo necesita el contorno para reconocer la
forma. Muestrear solo píxeles opacos habría dado un **falso aprobado** a un asset cuyo
borde es casi invisible en pantalla.

### F3 — `separacion(tamañoObjetivo)`

```
separacion(t) = max(separacionMin, k * t)
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `t` | int, perilla clínica | [24, 140] px | `--target-min-size`, lo fija el terapeuta |
| `k` | float, perilla | [0,12, 0,25] · **0,18** | Fracción del tamaño reservada como hueco |
| `separacionMin` | int, perilla | [6, 12] px · **8** | Piso absoluto, independiente del tamaño |
| `separacion(t)` | float, salida | **[8, 25,2] px** | Hueco mínimo entre bordes de celdas vecinas |

**Rango de salida:** [8, 25,2] px sobre el rango completo de la perilla clínica.

**Por qué escala con el tamaño en lugar de ser constante.** El riesgo no es "objetivo
pequeño mal apuntado" — eso lo cubre el suelo de tamaño. Es **"objetivo grande mal
delimitado"**: si el hueco queda fijo en píxeles absolutos mientras el objetivo crece,
la proporción de borde compartido entre celdas vecinas se encoge relativa al tamaño, y
un toque con temblor tiene más superficie de celda vecina disponible para invadir.
Mantener la separación proporcional mantiene esa probabilidad **aproximadamente
constante en todo el rango**, en lugar de degradarse en silencio a medida que el
terapeuta sube el tamaño.

**Por qué hay piso absoluto, y por qué vale 8.** Bajo 44 px, `k*t` se vuelve demasiado
pequeño para tener sentido físico (0,18 × 24 = 4,32 px). Y `separacionMin = 8` está
elegido para que la fracción y el piso se cruzen **en t = 44,4** — porque
`8 / 0,18 = 44,44` — es decir, prácticamente en el punto donde acaba el modo de reto
motor y empieza la escalera estándar.

> **Corrección:** una versión anterior decía que se cruzaban "exactamente en t = 44", y
> en la misma frase escribía "0,18 × 44 = 7,92 ≈ 8". No es exacto: 7,92 ≠ 8. Con `t`
> entero el efecto práctico es nulo — `separacion(44) = 8` por el piso y
> `separacion(45) = 8,1` por la fracción — pero "exactamente" era falso y el documento
> se contradecía dentro de una sola oración.

Una sola fórmula, sin salto discontinuo perceptible en una frontera clínica que ya
existía.

| `t` (px) | `separacion(t)` | Régimen |
|---|---|---|
| 24 | 8,00 | Piso (reto motor) |
| 44 | 8,00 | **Frontera: los dos términos coinciden** |
| 60 | 10,80 | Fracción |
| 100 | 18,00 | Fracción |
| 140 | 25,20 | Fracción |

**F3 agrava el desbordamiento, y aquí está la cifra que el sistema 8 necesita.** A
`Cmax = 100` y `t = 140`, `separacion(140) = 25,2`. Una cuadrícula de 10×10:

```
huella sin separación = 10 × 140              = 1400 px
huella con separación = 10 × 140 + 9 × 25,2   = 1626,8 px
incremento                                     = 16,2 %
```

F3 añade **226,8 px obligatorios** sobre un peor caso que el concepto ya marcaba como
riesgoso. F3 no resuelve el desbordamiento — es del sistema 8 — pero **entregarle el
número es parte del trabajo de F3**, y 1626,8 px es un mínimo optimista: un empaquetado
que no sea cuadrícula perfecta crece de forma no lineal.

**[PENDIENTE CLÍNICO]** `k` y `separacionMin` salen de razonamiento de ingeniería, no
de medición de temblor real. Mismo estatus que el resto de perillas sin validar del
concepto. Se confirman con telemetría de activaciones accidentales por proximidad.

**Decisión de ubicación:** la fórmula se queda en este documento. Deriva un token de
otro token, y los dos son datos de este sistema; tener las relaciones entre tokens en un
solo sitio vale más que acercar la fórmula a quien la consume. El sistema 5 consume el
resultado para el diseño del tablero.

### F4 — Resolución de paleta bajo `forced-colors`

No es una fórmula numérica: es una **función de mapeo determinista**, y es obligatoria
porque el hardware objetivo son tabletas Windows de consulta.

> **Excepción declarada a la norma de fórmulas del proyecto.** Las demás fórmulas de
> esta sección llevan tabla de variables y rango de salida. F4 no lleva ninguna de las
> dos, y no es una omisión: su dominio es un conjunto finito de tokens y su codominio un
> conjunto finito de palabras clave del sistema. La tabla de mapeo **es** su
> especificación completa. No hay variable continua que acotar.



**Qué ocurre sin intervención.** Con `forced-colors: active`, el navegador ignora casi
todas las propiedades de color de autor y las sustituye por unas 15 palabras clave del
sistema, elegidas por el tema de Windows del usuario y no por este producto.

**Y aquí hay un fallo que ningún test de contraste normal detecta:** `box-shadow` se
anula por defecto en la mayoría de motores, así que **un foco construido solo con
`box-shadow` desaparece por completo** bajo alto contraste. Es un incumplimiento de
SC 2.4.11 invisible en modo normal.

**Qué sí se conserva:** forma, geometría, tamaño, separación, texto real y contenido
rasterizado. El canal alfa y los píxeles de una foto no son propiedades CSS de color, y
el sistema operativo no los toca.

**Mapeo obligatorio, declarado a mano en lugar de dejarlo al valor por defecto:**

| Token | Palabra clave | Por qué esta |
|---|---|---|
| `--ink`, `--ink-soft` | `CanvasText` | Texto y silueta principal |
| `--bg`, `--panel`, `--board-bg` | `Canvas` | Fondo |
| `--line` | `CanvasText` vía `border` | Ver regla de bordes obligatorios |
| **`--board-accent`** | **`Highlight`, y solo `Highlight`** | Es la única palabra clave que el sistema reserva a "esto es lo activo ahora", que es exactamente la semántica del objetivo actual |
| Foco de teclado | `Highlight` vía `outline-color`, **nunca** `box-shadow` | "Esto, ahora" es la misma idea en las dos superficies |
| Botones del panel del terapeuta | `ButtonFace` / `ButtonText` | **Deliberadamente distinto de `Highlight`** |

**Cómo sobrevive la regla 3 bajo alto contraste, y por qué es el defecto más difícil de
detectar.** Si un botón del panel usara también `Highlight` por comodidad de estilo, la
regla del "un solo hogar" **se rompería por el sistema operativo, no por el código** — y
ningún test en modo normal lo vería. Sobrevive porque el bloque
`@media (forced-colors: active)` **elige a mano** qué palabra clave recibe cada rol, en
lugar de dejar que dos roles coincidan por casualidad.

Es la misma regla un nivel más abajo: el "un solo hogar" pasa de ser una propiedad de
los valores hexadecimales a ser una propiedad de la **asignación de palabras clave**.

**Regla de bordes, obligatoria y no recomendada:** todo objetivo del tablero y todo
control interactivo necesita `border` explícito bajo `forced-colors`. El relleno plano
en el que se apoya el Visual Identity Anchor desaparece entero cuando los fondos
colapsan a `Canvas`. Sin borde, una celda del tablero es un hueco sin forma — el fallo
exacto que el principio "la forma identifica" existe para evitar, y ocurre precisamente
cuando el color deja de estar disponible.

> **No hay F5.** Existió y se eliminó por tautológica (ver F1). El hueco de
> numeración se conserva a propósito: renumerar rompería las referencias del registro
> de entidades y del log de revisión por ninguna ganancia.

### F6 — `distanciaPerceptual(c1, c2)`: ΔE\*ab (CIELAB, CIE76)

**Dominio: token contra token.** No assets fotográficos. Ver el recorte al final de
esta sección.

F1 mide una sola cosa: diferencia de luminancia **figura contra fondo**. No cubre la
pregunta **figura contra figura**: dos colores pueden tener buen contraste cada uno
contra el fondo y ser casi indistinguibles *entre sí*.

**F1 y F6 no son puertas en pie de igualdad, y la asimetría es demostrable.**

| Dirección | Se cumple |
|---|---|
| `contraste >= 4,5` → `ΔE` alto | **Sí, siempre.** Barrido de 200.000 pares: el ΔE mínimo entre pares que pasan 4,5 es **42,73**, más del doble del umbral de 20 |
| `ΔE >= 20` → contraste suficiente | **No.** Manzana `(200,60,40)` contra morado `(90,90,180)`: **ΔE = 95,93** y contraste **1,16** |

Es decir: **F1 subsume a F6 para figura contra fondo, y el recíproco es falso.** Quien
consultara solo F6 en ese par concluiría "colores bien diferenciados" sobre un par
prácticamente indistinguible en luminancia para baja visión.

Por eso F6 **nunca se presenta al lado de F1** como una verificación equivalente. Solo
aporta información sobre pares que F1 no cubre.

```
XYZ desde lineal:  X = 0,4124*Rl + 0,3576*Gl + 0,1805*Bl
                   Y = 0,2126*Rl + 0,7152*Gl + 0,0722*Bl   (= L de F1)
                   Z = 0,0193*Rl + 0,1192*Gl + 0,9505*Bl

f(t) = t^(1/3)  si t > (6/29)^3 ; en otro caso  t/(3*(6/29)^2) + 4/29

L* = 116*f(Y/Yn) - 16
a* = 500*(f(X/Xn) - f(Y/Yn))
b* = 200*(f(Y/Yn) - f(Z/Zn))        blanco D65: Xn=0,95047 Yn=1 Zn=1,08883

distanciaPerceptual = sqrt((dL*)^2 + (da*)^2 + (db*)^2)
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `L*` | float | [0, 100] | Claridad perceptual |
| `a*` | float | (−128, 128) | Eje verde–rojo |
| `b*` | float | (−128, 128) | Eje azul–amarillo |
| `distanciaPerceptual` | float, salida | **[0, ~150)** | Distancia euclídea en CIELAB |

**Rango de salida:** 0 son colores idénticos. ΔE ≈ 2,3 es el umbral clásico de
diferencia justo perceptible. Este proyecto propone **`distanciaPerceptualMin = 20`**
como piso de advertencia para pares que deben verse claramente distintos bajo visión
subóptima — pantalla de tableta, baja visión, deslumbramiento de consulta. Más exigente
que el umbral de laboratorio, coherente con el resto de umbrales del proyecto, que ya
eligen el extremo conservador.

**Por qué CIE76 y no CIEDE2000.** CIEDE2000 es más preciso, pero añade correcciones de
croma y matiz que multiplican el coste de implementación sin build ni dependencias. Para
un uso de **advertencia** — el mismo estatus que `solapamiento` en el sistema 1 — CIE76
es proporcionado: barato, verificable a mano, y suficiente para detectar el caso que
importa, que es "dos colores casi idénticos".

**Ejemplo trabajado**, con dos tokens del ámbito marco:

```
--frame-ink      (28,25,23)  -> Lab ( 9,02 · 1,00 · 1,93)
--frame-ink-soft (87,83,78)  -> Lab (35,52 · 0,62 · 3,50)

distanciaPerceptual = 26,55  -> por encima del piso de 20: se ven distintos
```

> Verificado por ejecución. La primera redacción de este ejemplo llevaba cifras
> inventadas — 25,80 en lugar de 26,55 — que es exactamente el defecto que esta
> revisión corrigió tres veces en otras partes del documento.

### Recorte de dominio, y por qué

**Una versión anterior de esta sección afirmaba que F6 daba al sistema 1 "una
herramienta barata que no tenía"** para señalar assets de clusters distintos
sospechosamente cercanos. **Esa afirmación se retira**, y con ella el ejemplo de
manzana, tomate y plátano.

Razón: **F6 no tiene procedimiento de entrada definido para un asset fotográfico.** F2
especifica con precisión de qué píxeles se muestrea y cómo se componen; F6 usaba colores
planos como si representaran un asset entero, sin decir si la entrada debe ser la media,
el color dominante, la mediana del histograma o algo más. Sin ese procedimiento el
ejemplo era una ilustración de intención, **no algo ejecutable contra archivos reales**.

Si el sistema 13 quiere distancia perceptual entre assets, **primero define la
extracción de color, y eso es su GDD.**

**Y con el dominio recortado, CIE76 se queda.** La objeción de que CIE76 está sesgado en
la región de croma alto es correcta, y aplica a fotografía de comida saturada — que
acaba de salir del dominio de F6. Las entradas reales son un puñado de grises neutros
más un acento. CIEDE2000 con los vectores de Sharma es la decisión correcta el día que
el sistema 13 traiga colores de asset, y es su GDD quien la toma.


## Edge Cases

- **Si un componente empareja dos tokens que no forman un par declarado**: error de
  validación. La razón de contraste de un par no declarado es desconocida por
  definición, y "desconocida" no es aceptable en la superficie que mira un paciente con
  baja visión.
- **Si un par declarado incumple su umbral en algún tema**: error, nombrando **el par y
  el tema**. Un par que pasa en claro y falla en oscuro es un fallo, no un matiz.
- **Si un token existe en un tema y falta en otro**: error de completitud. Un token
  ausente cae en el valor heredado o en el del navegador, y eso es contraste no
  verificado entrando por la puerta de atrás.
- **Si `forced-colors` está activo**: los tokens de color se ignoran y manda la paleta
  del sistema operativo. Lo que el producto conserva es la **estructura**: forma,
  tamaño, separación y foco. Ver Formulas para qué se expresa en palabras clave de
  color del sistema.
- **Si un componente del tablero lee un token del marco, o al revés**: error de análisis
  estático (regla 2).
- **Si un componente que no es el objetivo actual lee el token de acento**: error de
  análisis estático (regla 3).
- **Si alguien introduce un literal de color en un componente**: error de análisis
  estático (regla 1).
- **Si `prefers-reduced-motion` está activo**: el acuse de recibo pasa a ser **estático
  e instantáneo**, visible el mismo tiempo. **Nunca `opacity: 0`, nunca ausencia de
  señal.**
- **Si el terapeuta baja `--target-min-size` por debajo de 44 px**: entra el modo de reto
  motor. Requiere confirmación explícita y **queda marcado en el registro**, para que el
  terapeuta pueda correlacionar el aumento de fallos con ese ajuste en lugar de leerlo
  como deterioro del paciente.
- **Si el terapeuta baja `--target-min-size` por debajo de 24 px**: imposible. Es el
  mínimo absoluto de WCAG 2.2 (2.5.8) y el control no lo permite.
- **Si la separación entre objetivos cae por debajo del mínimo derivado del tamaño**:
  error de disposición. Objetivos grandes muy juntos producen activaciones accidentales,
  y este producto las registra como **fallos falsos** — ruido motor contaminando el dato
  que el pilar 2 promete medir con exactitud.

## Dependencies

**Dependencias de entrada: ninguna.** Es capa Foundation, y por eso va segundo en el
orden de diseño, justo detrás del manifiesto del banco.

**Sistemas que dependen de este:**

| Sistema | Prioridad | Qué necesita | Dureza |
|---|---|---|---|
| 5 · Adaptación de entrada | MVP | `--target-min-size` y el separador derivado | **Dura** |
| 6 · Estímulo reducido | MVP | Variante de tema y la regla de movimiento | **Dura** |
| 10 · Busca | MVP | Tokens del ámbito tablero | **Dura** |
| 11 · Panel del terapeuta | MVP | Tokens del ámbito marco | **Dura** |
| 12 · Resultados de sesión | MVP | Ámbito marco | **Dura** |
| 13 · Herramientas del banco | MVP | El token de fondo del tablero, para medir contraste de assets | **Dura** |
| 14 · Invariantes de CI | MVP | Las reglas 1 a 4, para hacerlas cumplir | Blanda: el sistema funciona sin ellas, pero las reglas dejan de ser reales |

**Relación con el sistema 1**, que no es de dependencia sino de reparto: el sistema 1
indexa las imágenes, este define el fondo contra el que se miden. Ninguno depende del
otro para funcionar; el pipeline de validación del banco necesita los dos.

**Consistencia bidireccional, comprobada y corregida.** Al verificarla resultó que
solo los sistemas 5 y 6 declaraban el 2 entre sus dependencias. Los sistemas 10, 11,
12, 13 y 14 **no lo declaraban**, pese a consumirlo. Los cinco corregidos en el índice
en esta pasada.

La regla del proyecto — *"si el sistema A depende de B, el documento de B debe
mencionar A"* — solo funciona si se comprueba, no si se afirma. Una primera versión de
esta sección daba la consistencia por buena sin verificarla.

## Tuning Knobs

| Perilla | Rango seguro | Propuesto | Quién la toca | Si se pone mal |
|---|---|---|---|---|
| `--target-min-size` | 24-140 px | Por perfil | **El terapeuta**, en sesión | Es el eje motor entero. Por debajo de 44 px contamina el dato con ruido motor |
| Umbral vinculante del tablero | fijo por decisión | **4.5:1 (AA)** | Cerrado en F1 | Bloquea todo par declarado del tablero |
| Umbral deseable | informativo | 7:1 (AAA) | Cerrado en F1 | Se reporta en la auditoría; no bloquea |
| `Θ` (umbral de alfa) | [1, 254] | **128** | Diseño, una vez | F2. Qué cuenta como sujeto al medir el borde de una silueta |
| `w` (ancho del anillo) | [1, 4] px | **2** | Diseño, una vez | F2. Anillo perimetral muestreado |
| `k` (factor de separación) | [0,12, 0,25] | **0,18** | Diseño · **[PENDIENTE CLÍNICO]** | F3. Demasiado bajo produce activaciones accidentales, que se registran como fallos falsos |
| `separacionMin` | [6, 12] px | **8** | Diseño · **[PENDIENTE CLÍNICO]** | F3. Piso activo bajo 44 px. Elegido para cruzar la fracción exactamente en 44 |
| `contrasteMinGrises` | [1,5, 3] | **3** | Diseño, una vez | F5. Piso de advertencia de "no es el mismo gris" entre dos tokens |
| `distanciaPerceptualMin` | [15, 30] | **20** | Diseño, una vez | F6. Piso de advertencia de "se ven claramente distintos" |
| Valores de los tokens | — | Los del prototipo pasan AA, salvo `--line` | Diseño, con validación | Cualquier cambio reejecuta la validación de **todos** los pares |

### Auditoría, con ámbito declarado

> **Rehecha.** La primera versión de esta tabla **no distinguía ámbito**: usaba nombres
> sin prefijo, así que era imposible saber qué pares eran de marco (umbral 3:1) y qué
> pares de tablero (4,5:1). El documento afirma "se calcula, no se estima" y **el ámbito
> marco no tenía datos** — precisamente el ámbito donde el terapeuta juzga la
> credibilidad profesional del producto, que es territorio del pilar 5, y el terapeuta
> es quien decide la adopción.

**Pares del ámbito MARCO — umbral 3:1**

| Par | Claro | Oscuro | |
|---|---|---|---|
| `--frame-ink` / `--frame-bg` | 16,03 | 16,03 | pasa |
| `--frame-ink` / `--frame-panel` | 17,49 | 13,90 | pasa |
| `--frame-ink-soft` / `--frame-bg` | 6,99 | 6,93 | pasa |
| `--frame-ink-soft` / `--frame-panel` | 7,63 | 6,01 | pasa |
| **`--frame-line` / `--frame-bg`** | **1,37** | **1,70** | **FALLA incluso 3:1** |

**Pares del ámbito TABLERO — umbral 4,5:1. Fondo invariante (regla 9), una sola columna**

| Par | Valor | |
|---|---|---|
| `--board-ink` / `--board-bg` | 16,74 | pasa |
| `--board-accent` / `--board-bg` | 6,42 | pasa |
| `--board-scan-cursor` / `--board-bg` | *pendiente, sistema 5* | umbral 3:1 |
| `--board-dwell-progress` / `--board-bg` | *pendiente, sistema 5* | umbral 3:1 |

**`--frame-line` / `--frame-bg` no alcanza ni el 3:1 de su propio ámbito**, en ninguno
de los dos temas. Y no es decorativo: en el prototipo, `button.ghost` usa
`border: 1px solid var(--line)` como **su único límite visual**. El borde de ese botón
está a 1,37:1 — invisible para baja visión. Un botón cuyo contorno no se ve es un botón
que no existe para parte de la población objetivo.

Esto es exactamente lo que el modelo de **pares declarados** existe para atrapar. Ni la
revisión del prototipo ni la primera versión de este GDD lo vieron, porque ambos
miraron los pares que alguien pensó en comprobar. Un barrido de todos los pares
plausibles lo encontró en segundos. **Es el argumento de la regla 5 hecho dato.**

Consecuencias: `--line` necesita valor nuevo, o los componentes que dependen de él como
único delimitador necesitan otro token. Se resuelve al fijar los valores definitivos.

**Interacción nueva que F3 introduce:** `k` y `separacionMin` no son independientes del
tamaño máximo de tablero del sistema de dificultad. Un `--target-min-size` alto con
`Cmax = 100` puede desbordar la pantalla, como ya señala el concepto. F3 fija el hueco
correcto entre celdas; **no resuelve el desbordamiento**, que es del sistema 8.

**Interacción entre perillas que hay que vigilar:** el umbral de contraste y los valores
de los tokens no son independientes. Si el umbral dentro del tablero es AAA (7:1),
**tres pares del prototipo dejan de pasar**: `ink-soft`/`bg` en los dos temas (6,99 y
6,93) y `ink-soft`/`panel` en oscuro (6,01). Los tres están al borde, así que la
decisión del umbral y el ajuste de la paleta son una sola decisión, no dos.

## Visual/Audio Requirements

Este sistema **es** el cimiento visual, así que la sección no es opcional. Ejecuta el
Visual Identity Anchor del documento de concepto; no lo reabre.

| Principio del Anchor | Cómo lo ejecuta este sistema |
|---|---|
| El área de juego obedece al contraste y a nada más | Ámbito de tokens separado para el tablero, con su propio umbral y sus propios pares declarados |
| Figura y fondo separados por contraste alto | Cada par declarado se verifica por cálculo en los tres temas |
| Cero decoración dentro del área de juego | El ámbito del tablero no contiene tokens decorativos: ni sombra, ni degradado, ni textura |
| La forma identifica; el color solo refuerza | Regla 7: todo funciona en escala de grises |
| El acento se reserva exclusivamente al objetivo actual | Regla 3, comprobada por análisis estático |
| En el marco, tipografía y espaciado hacen el trabajo | El ámbito del marco es de grises neutros con un único acento |

**Audio: ninguno.** Este sistema no produce sonido. Pero fija una consecuencia para
quien sí lo produzca: **no existe token de sonido de error**, por la misma razón que no
existe color de error. El pilar 2 se aplica en las dos modalidades.

## UI Requirements

**Ninguna propia.** El sistema no tiene superficie: es consumido por las superficies de
los demás.

Un requisito que sí impone a la interfaz del terapeuta (sistema 11): el control de
`--target-min-size` debe mostrar en qué tramo está — estándar por encima de 44 px, o
reto motor por debajo — y exigir confirmación al cruzar ese umbral. El terapeuta tiene
que saber que ha entrado en un modo que marca el dato.

## Acceptance Criteria

> Validados por `qa-lead`. **Regla de propiedad, coherente con el precedente del
> sistema 1:** los criterios que verifican una propiedad del **código de los
> componentes** — qué token lee un archivo, si existe un literal de color — se declaran
> aquí pero los hace cumplir el **sistema 14**. Los que verifican los **datos propios**
> de este sistema — el registro de tokens, el registro de pares, la aritmética de
> contraste — son de este sistema.

### El registro de tokens

**AC-1 — Ningún literal de color fuera del módulo de tokens** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de código fuera del módulo único que declara los tokens,
**CUANDO** un análisis léxico busca `#rgb`, `#rrggbb`, `rgb()`, `rgba()`, `hsl()`,
`hsla()` y la lista fija de nombres de color de CSS,
**ENTONCES** no encuentra ninguno; cualquier coincidencia rompe el build señalando
archivo y línea. *El propio módulo de tokens está exento por definición: ahí sí viven
los literales.*

**AC-2 — El registro de tokens está bien formado** · Unit · **BLOCKING**
**DADO** el módulo de tokens,
**CUANDO** se ejecuta el validador de esquema,
**ENTONCES** cada entrada tiene `nombre`, `ámbito` (`frame` o `board`) y un valor por
tema (`light`, `dark`). Un token sin ámbito, o presente en los dos a la vez, falla
nombrando el token.
*AC-1 prueba que no hay colores sueltos; AC-2 prueba que los que sí existen como token
están bien formados. Son complementarios, no redundantes.*

### Separación de ámbitos

**AC-3 — Un componente de tablero no lee un token de marco, ni al revés** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** archivos de componente bajo `src/ui/frame/` y `src/ui/board/`,
**CUANDO** el análisis busca `var(--frame-…)` dentro de `board/` o `var(--board-…)`
dentro de `frame/`,
**ENTONCES** no encuentra ninguno; cualquier coincidencia rompe el build señalando
archivo, línea y token.

### El acento tiene un solo hogar

**AC-4 — `--board-accent` solo se lee en el indicador del objetivo actual** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de código del área de juego,
**CUANDO** el análisis busca el token de acento fuera del archivo del componente que
renderiza el objetivo actual,
**ENTONCES** no encuentra ninguna coincidencia.

**AC-4b — Regresión del defecto real del prototipo** · Análisis estático · **BLOCKING**
**DADO** el defecto ya documentado — el acento se filtró a `input[type=range]`, al
borde de la barra de objetivo y al aro de "encontrado",
**CUANDO** se ejecuta AC-4 contra el código de producción,
**ENTONCES** ninguno de esos tres puntos aparece. **Se fija como fixture explícito**
para que la regresión no pueda volver en silencio.

### La ausencia de color de fallo — cómo se prueba que algo no puede existir

Probar una ausencia exige dos capas: que el dato no exista, y que nadie lo reconstruya
por otra vía.

**AC-5 — Capa de datos: no hay token con rol de fallo en el ámbito del tablero** · Unit · **BLOCKING**
**DADO** el registro de tokens completo,
**CUANDO** se filtran las entradas de ámbito `board`,
**ENTONCES** ninguna tiene rol `error`, `fallo`, `incorrecto` ni ningún sinónimo de una
lista fija que mantiene este sistema; el validador falla si alguien añade uno.
**No es un test de comportamiento: es un test de que la capacidad no se puede declarar.**

**AC-6 — Capa renderizada: nadie reconstruyó el fallo a mano** · Integration (Playwright) · **BLOCKING**
**DADO** el tablero con un objetivo y un elemento incorrecto visibles,
**CUANDO** el paciente toca el incorrecto y se lee `getComputedStyle` del indicador de
acuse,
**ENTONCES** el color usado es un token de ámbito `board` con rol neutro o de
confirmación — nunca un valor ausente del registro de AC-5 — y **ninguna clase cuyo
nombre case `/error|fail|incorrect/i` se añade al DOM** en ningún momento del ciclo de
vida del toque.
*AC-5 prueba que el dato no existe; AC-6 prueba que nadie lo rehízo con una clase CSS
ad hoc que no pasa por el registro.*

### Pares declarados

**AC-7 — Todo par declarado está bien formado** · Unit · **BLOCKING**
**DADO** el registro de pares legales `{ fg, bg, ratioMinimo, ámbito }[]`,
**CUANDO** se valida cada entrada,
**ENTONCES** `fg` y `bg` referencian tokens existentes **del mismo ámbito** y
`ratioMinimo` es 3, 4.5 o 7; cualquier otro valor falla nombrando el par.

**AC-8 — Ningún componente usa un par no declarado** · Análisis estático · **BLOCKING**, hoy **NO EJECUTABLE**
**DADO** un archivo de componente que fija a la vez `color` y `background`,
**CUANDO** el analizador extrae el par de tokens,
**ENTONCES** ese par existe en el registro de AC-7.
*Deliberadamente distinto de AC-3 y AC-4, que son un grep de un solo token. Este exige
emparejar dos declaraciones que pueden vivir en selectores distintos — herencia,
`currentColor`, variables anidadas. Un grep no basta: hace falta un tokenizador de CSS
mínimo y sin dependencias. Ver infraestructura faltante.*

### Aritmética de contraste

**AC-9 — Cálculo exacto de un par ancla** · Unit · **BLOCKING**
**DADO** `fg = #57534e` y `bg = #f5f5f4` (tokens reales del prototipo),
**CUANDO** se ejecuta la razón de contraste con la luminancia relativa de WCAG,
**ENTONCES** el resultado redondeado a dos decimales es **exactamente `6.99`**.
Igualdad tras `toFixed(2)`, nunca "aproximadamente 7" ni tolerancia amplia.
*Verificado dos veces de forma independiente: por `qa-lead` a mano y por cálculo
directo en esta sesión. Es el canario — si alguien cambia la fórmula de luminancia,
este número lo delata.*

**AC-10 — Todo par pasa su mínimo en claro y en oscuro** · Unit · **BLOCKING**
**DADO** el registro de pares y el de tokens para `light` y `dark`,
**CUANDO** se calcula la razón de cada par en cada tema,
**ENTONCES** cada resultado es `≥ ratioMinimo`, comparado en coma flotante con épsilon
`1e-9`. **Nunca se redondea antes de comparar el umbral** — el redondeo es solo para el
ancla de AC-9, no para la puerta.
*Alcance explícito: claro y oscuro. Colores forzados no entra, porque en ese modo no hay
valor propio contra el que calcular.*

> **AC-11 eliminado**, junto con F5. Comprobaba que un par siguiera pasando "tras
> desaturar", usando el canal de luminosidad HSL como definición de gris. Dos problemas:
> era tautológico, porque el contraste de F1 no contiene término de matiz; y la
> luminosidad HSL es un modelo malo y conocido de claridad percibida — mapea amarillo
> puro y azul puro al mismo 0,5 — así que habría producido **fallos falsos**.

**AC-11 — Canario de F2: el ejemplo trabajado, exacto** · Unit · **BLOCKING**
**DADO** sujeto `(200,60,40)` sobre `--board-bg`, y un píxel de anillo con `A = 140`,
**CUANDO** se calcula el contraste de silueta según el procedimiento de F2,
**ENTONCES** el píxel del anillo da **2,35** y el sujeto opaco da **4,87**, ambos a dos
decimales. Si alguien cambia la fórmula, estos dos números lo delatan.

**AC-11b — Canario de F2: el conjunto vacío FALLA** · Unit · **BLOCKING**
**DADO** un asset en el que ningún píxel alcanza `Θ`, de modo que `boundary` queda vacío,
**CUANDO** se evalúa F2,
**ENTONCES** el resultado es **fallo**, nunca aprobado. Prohibido devolver `Infinity`.
*Es el defecto de línea más importante de la revisión: `Math.min()` sobre un conjunto
vacío da `Infinity` en JavaScript, e `Infinity >= 4,5` es `true`.*

**AC-11c — Canario de F3: la tabla publicada, exacta** · Unit · **BLOCKING**
**DADO** `t = 24, 44, 60, 100, 140` con `k = 0,18` y `separacionMin = 8`,
**CUANDO** se llama a `separacion(t)`,
**ENTONCES** el resultado es **8,00 · 8,00 · 10,80 · 18,00 · 25,20** respectivamente.

**AC-11d — Canario de F6: el ejemplo trabajado, exacto** · Unit · **BLOCKING**
**DADO** `--frame-ink` `(28,25,23)` y `--frame-ink-soft` `(87,83,78)`,
**CUANDO** se calcula la distancia perceptual,
**ENTONCES** el resultado es **26,55** a dos decimales.

### Tamaño del objetivo

**AC-12 — El rango se aplica y el modo de reto motor queda registrado** · Unit · **BLOCKING**
**DADO** un intento de fijar `--target-min-size` a un valor `v`,
**CUANDO** se valida la configuración,
**ENTONCES**: si `v < 44` sin `modoRetoMotor: true`, se rechaza nombrando el suelo de
44; si `v < 24`, se rechaza **siempre**; si `24 ≤ v < 44` con el modo activo, se acepta
y el registro guarda `modoRetoMotor: true` junto al valor; si `v > 140`, se rechaza.

**AC-13 — Los límites se comprueban en ambos extremos** · Unit · **BLOCKING**
**DADO** los valores exactos 24, 44 y 140,
**CUANDO** se validan con y sin el modo de reto motor,
**ENTONCES** 24 y 140 son válidos en sus condiciones, y **23 y 141 se rechazan
siempre**. Fronteras explícitas, no un rango descrito en prosa.

### Movimiento reducido

**AC-14 — El acuse es instantáneo, no ausente** · Integration (Playwright) · **BLOCKING**
**DADO** la página con `prefers-reduced-motion: reduce` emulado y un toque incorrecto
ya realizado,
**CUANDO** se lee `getComputedStyle` del indicador en el primer fotograma disponible,
**ENTONCES** su opacidad computada es igual a su valor en estado estable — nunca `0` —
y ninguna `transition` ni `animation` con duración mayor que cero está activa sobre
`opacity` en ese elemento.
*Regresión directa del defecto P1 del prototipo, que ponía `opacity: 0` y borraba la
señal. "Instantáneo" queda definido como medible: duración cero, no una impresión.*

**AC-15a — La tabla de F4 es exhaustiva contra el registro** · Unit · **BLOCKING**
**DADO** el registro de tokens y la tabla de mapeo de F4,
**CUANDO** se comparan,
**ENTONCES** todo token del registro tiene una entrada explícita en F4. Añadir un token
sin mapeo declarado **rompe el build**.

**AC-15b — Bajo colores forzados, nada más computa a `Highlight`** · Integration (Playwright) · **BLOCKING**
**DADO** el tablero y el marco renderizados con `forced-colors: active` emulado,
**CUANDO** se lee el color y el color de borde computados de todo elemento interactivo
que **no** sea el indicador del objetivo actual,
**ENTONCES** ninguno resuelve a `Highlight`.
*Cierra en código el agujero que el propio documento describía en prosa: un botón del
panel que usara `Highlight` por comodidad de estilo rompería la regla del "un solo hogar"
**por el sistema operativo, no por el código** — y ningún test en modo normal lo vería.*

### Colores forzados — y la respuesta honesta sobre CI

**AC-15 — Conformidad estructural con colores forzados, en CI** · Integration (Playwright) · **BLOCKING**
**DADO** la página con `forced-colors: active` emulado,
**CUANDO** se inspeccionan los elementos del tablero y del marco,
**ENTONCES** ningún elemento usa `forced-color-adjust: none` sin justificación
registrada, el indicador de foco sigue visible, y ninguna información se transmite solo
por un color que el modo sustituiría.

**Y aquí está el dato que no tenía:** esto **sí** se puede ejecutar en CI sin una
máquina Windows, porque el modo de colores forzados lo implementa el **motor de
renderizado**, no el sistema operativo. Chromium lo aplica de forma consistente entre
sistemas cuando se emula. Lo que **no** reproduce es la paleta real de un tema de Alto
Contraste concreto elegido por un usuario.

**AC-16 — Verificación manual en un tema de Alto Contraste real** · Visual/Feel manual · **ADVISORY**
**DADO** una tableta Windows con un tema de Alto Contraste activado desde el sistema,
**CUANDO** se abre el instrumento,
**ENTONCES** tablero y marco siguen legibles y operables, con captura y firma
archivadas en `production/qa/evidence/`.
*No puede subir a BLOCKING: no hay máquina Windows en el pipeline, y fingir que AC-15
la sustituye sería inventar una capacidad de verificación que no existe.*

### Infraestructura que no existe todavía

**Ningún criterio de esta sección se puede ejecutar hoy.** Es información para el gate,
no una razón para no fijarlos por escrito.

| Falta | Compartido con |
|---|---|
| `tests/unit/`, `tests/integration/`, `tests/fixtures/`, `package.json` con `node:test` | Mismo bloqueante que el sistema 1. Es `/test-setup`, no una tarea nueva |
| Módulo de cálculo de contraste (luminancia relativa WCAG), función pura sin dependencias | Nuevo de este sistema |
| Módulo de conversión a escala de grises, puro | Nuevo de este sistema |
| El registro de tokens y el registro de pares como datos | Son el objeto de AC-2 y AC-7: no se validan antes de escribirse |
| Script de análisis léxico de literales de color | Sistema 14 |
| **Tokenizador de CSS mínimo y sin dependencias** para AC-8 | Nuevo, y **no trivial**: sin `postcss` por la regla de cero dependencias, sería un analizador ad hoc limitado a la sintaxis que el propio proyecto escribe. Tarea de alcance propio antes de comprometer AC-8 en el gate |
| Playwright | Declarado como permitido "cuando llegue el Nivel 1", hoy sin instalar. AC-6, AC-14 y AC-15 dependen de él |
| Plantilla de evidencia manual de Alto Contraste en `production/qa/evidence/` | AC-16 no puede cerrarse ni una vez sin ella |

## Open Questions

| Pregunta | Quién resuelve | Cuándo |
|---|---|---|
| ~~¿Umbral de contraste dentro del tablero: AA o AAA?~~ | **CERRADA** | **4.5:1 (AA) vinculante; 7:1 deseable y no bloqueante.** Ver F1: con AAA, tres pares del prototipo caen, y todos son de texto secundario donde la presión de paleta es máxima. Subir el suelo agotaría la paleta sin mejorar la accesibilidad real |
| ~~¿Se puede comprobar `forced-colors` en CI sin máquina Windows?~~ | **CERRADA** | **Sí, parcialmente.** El modo lo implementa el motor de renderizado, no el sistema operativo, así que Playwright lo emula. Verifica conformidad estructural (AC-15, BLOCKING) pero **no** la paleta real de un tema concreto, que queda como verificación manual (AC-16, ADVISORY) |
| ~~¿La equivalencia en escala de grises es computable?~~ | **CERRADA** | **A nivel de token sí; a nivel de silueta fotográfica no.** La luminancia de F1 ya es el equivalente acromático, así que F5 no necesita fórmula nueva. La separabilidad entre siluetas fotográficas es comparación de forma, no de luminancia: se hereda del sistema 1 y no se reabre |
| ¿Los tokens del prototipo se adoptan tal cual? | Diseño | **Casi.** Con el umbral AA fijado, todos pasan **menos `--line`**, que falla incluso el 3:1 de componentes en los dos temas (1,37 y 1,70). `--line` necesita valor nuevo antes de adoptarse |
| ¿Hace falta un tema de alto contraste **propio**, además del forzado por el sistema? | Colaborador clínico | Nivel 1. Un terapeuta puede querer subir el contraste sin que el paciente cambie los ajustes de Windows |
