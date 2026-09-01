# Game Concept: Taller (plataforma) — primer instrumento: Busca

*Created: 2026-08-24*
*Status: Reviewed — revisado el 2026-08-24 por `/design-review` (veredicto NEEDS
REVISION; las 8 ediciones bloqueantes están aplicadas). Registro completo en
`design/gdd/reviews/game-concept-review-log.md`.*

> **Pendiente de validación clínica.** Cuatro decisiones de este documento están
> tomadas por razonamiento de diseño, no por confirmación de un terapeuta
> ocupacional: los cuatro ejes de dificultad, la separación motor/cognitivo, el
> umbral de 30 segundos y la taxonomía de perfiles funcionales. Están marcadas en
> el texto con **[PENDIENTE CLÍNICO]**. La conversación con el colaborador es el
> siguiente paso del proyecto y puede modificarlas.

> **Títulos provisionales.** "Taller" es la plataforma; "Busca" es el primer
> instrumento (búsqueda visual). Evitar el nombre "Lince": es una marca
> registrada de un juego comercial. La mecánica de búsqueda visual no es
> registrable; el nombre sí.

---

## Elevator Pitch

> Es una caja de herramientas web donde el terapeuta ocupacional configura y
> asigna un ejercicio de rehabilitación en menos de 30 segundos, y su paciente
> lo juega con controles adaptados a su capacidad motora, sin ver nunca un
> error señalado.

---

## Core Identity

| Aspect | Detail |
| ---- | ---- |
| **Genre** | Colección de instrumentos configurables de estimulación cognitiva y motora. Primer instrumento: búsqueda visual (género de objetos ocultos) |
| **Platform** | Web / navegador (escritorio y tableta). Android e iOS aplazados a una iteración posterior |
| **Target Audience** | Terapeutas ocupacionales (usuario que decide la adopción) y sus pacientes adultos. Ver "Target Player Profile" |
| **Player Count** | Un jugador supervisado: dos usuarios, un dispositivo, el terapeuta presente |
| **Session Length** | 5-15 minutos de juego dentro de una sesión de terapia de 30-60 minutos |
| **Monetization** | Ninguna decidida |
| **Estimated Scope** | Large (18-30 meses, solo, para la visión completa). Nivel 0 (prototipo): semanas |
| **Comparable Titles** | Género de objetos ocultos (tipo *¿Dónde está Wally?*) para el bucle del paciente. Plataformas profesionales de rehabilitación cognitiva del mercado español para el modelo de producto — **pendiente de verificar con el colaborador terapeuta** |

---

## Core Fantasy

Este producto tiene dos usuarios y por tanto dos fantasías. Las dos deben
cumplirse; si falla una, el producto no se usa.

**Terapeuta ocupacional:** "Mi material es mío y viene conmigo, esté donde esté
trabajando."

> **Reformulado el 2026-08-24 con datos del colaborador.** La versión anterior
> decía "tengo el material exacto para este paciente, ya, y los resultados se
> registran solos", y situaba el dolor en el **tiempo de preparación**. El dolor
> real es otro y es más grande.

El colaborador usa cartas y juegos analógicos. La fricción que describe no es
principalmente el tiempo: es que **el material pertenece al centro, no al
terapeuta**. La rotación laboral en el sector es muy alta — cambios de trabajo
frecuentes, mucha precariedad — y cada centro tiene su propio material, cuando lo
tiene. En muchos casos hay muy poco.

Consecuencias, y son de fondo:

1. **La propuesta de valor central es la portabilidad, no el ahorro de tiempo.**
   Un terapeuta que cambia de centro pierde su caja de herramientas y hereda lo que
   haya. Una plataforma web es material que le sigue. El ahorro de tiempo sigue
   importando — el pilar 1 no se toca — pero deja de ser el argumento principal.
2. **En muchos centros el competidor no son las cartas: es la nada.** Eso baja el
   umbral de calidad para ser útil, y sube el valor de existir siquiera.
3. **La precariedad del usuario es una restricción de diseño.** Nada de instalar,
   nada de pedir permiso a informática del centro, nada que dependa del hardware de
   un centro concreto. Un navegador y una cuenta. Esto refuerza la decisión de web
   sin motor y sin instalación.

**Paciente:** "Hago algo que sí puedo hacer, y nadie me señala un fallo."
La discapacidad quita competencia percibida. Este producto la devuelve por la
vía de una tarea calibrada al nivel exacto de la persona, sin exponer el
déficit.

---

## Unique Hook

Como un cuadernillo de estimulación cognitiva, **y además** cada parámetro se
adapta al paciente concreto y todo el rendimiento se registra sin que el
paciente lo note.

El hook no está en la mecánica del juego, que es deliberadamente conocida y
probada. Está en la **capa de adaptación**: el mismo instrumento sirve a un
paciente con poca precisión motora y a otro con buena precisión y déficit de
atención, porque el terapeuta mueve las perillas y el sistema se ajusta dentro
de los límites que él fija.

---

## Player Experience Analysis (MDA Framework)

### Target Aesthetics (What each user FEELS)

**Dos tablas, no una.** MDA describe la experiencia de quien manipula las
mecánicas, y aquí hay dos personas que manipulan mecánicas distintas en momentos
distintos. Una sola jerarquía de 1 a 8 mezclando las dos audiencias no es
accionable: quien lea esta sección para diseñar un sistema no sabría si diseña
para el bucle de 30 segundos del paciente o para el de configuración del
terapeuta.

#### Bucle de Ejecución — el paciente

| Aesthetic | Priority | How We Deliver It |
| ---- | ---- | ---- |
| **Submission** (relaxation, comfort) | 1 | **Dominante.** Bucle de baja tensión, sin estado de fallo, sin reloj por defecto, ritmo del paciente |
| **Discovery** (exploration) | 2 | Variedad combinatoria: cada tablero se genera del banco de imágenes, así que ninguna ronda repite exactamente |
| **Challenge** (mastery) | 3 | Presente pero acotado: la dificultad nunca cruza el techo que fija el terapeuta. Nunca es la estética dominante |
| **Sensation** (sensory pleasure) | 4 | Feedback generoso en el acierto: el elemento encontrado se ancla visiblemente, con sonido suave. Nada estridente |
| **Fantasy** / **Narrative** / **Fellowship** / **Expression** | N/A | Sin ficción, sin narrativa, sin función social (anti-pilar 1). El paciente no compone nada: eso es del terapeuta |

**Aclaración que evita el error más probable de interpretación:** *Submission*
gobierna **cómo se presenta el fallo** — nunca se señala, nunca se califica — no
**cuánta cantidad de fallo hay**. La tasa de fallo sigue gobernada por el objetivo
de ~80% de acierto, es decir un 20% de fallo por diseño. Un terapeuta que lea
"sumisión" como "sin fricción" empujará el ajuste hacia lo fácil y neutralizará
la carga terapéutica del instrumento. Comodidad no es lo mismo que ausencia de
exigencia.

#### Bucle de Preparación y Lectura — el terapeuta

| Aesthetic | Priority | How We Deliver It |
| ---- | ---- | ---- |
| **Expression** (creativity) | 1 | **Dominante.** El terapeuta compone el ejercicio: cuatro perillas, dos ejes, presets por paciente. Es la estética que impulsa la adopción |
| **Challenge** (mastery) | 2 | Dominar la herramienta: entender qué perilla produce qué efecto clínico |
| **Discovery** (exploration) | 3 | Leer la evolución del paciente y descubrir qué ajuste funciona para quién |
| **Sensation** / **Fantasy** / **Narrative** / **Fellowship** / **Submission** | N/A | El marco es una herramienta profesional, no una experiencia. Ver Visual Identity Anchor |

### Key Dynamics (Emergent player behaviors)

Del terapeuta:

- Reutilizará configuraciones que le funcionaron, así que las configuraciones
  deben poder guardarse y reusarse por paciente.
- Ajustará las perillas **durante** la sesión al ver al paciente, no solo
  antes. La configuración debe ser accesible sin salir del ejercicio.
- Comparará el rendimiento del mismo paciente a lo largo de semanas, nunca
  entre pacientes distintos.

Del paciente:

- Desarrollará una estrategia de barrido del tablero (por filas, por color,
  por zonas). Esa estrategia **es** la capacidad que se entrena.
- Con un banco de imágenes pequeño, memorizará las posiciones y los elementos
  en lugar de entrenar la búsqueda. Es el riesgo de habituación.

### Core Mechanics (Systems we build)

1. **Generación combinatoria de tableros** desde un banco de imágenes con
   metadatos (identificador, categoría semántica, nombre, y precio cuando el
   instrumento lo requiera).
2. **Capa de adaptación de entrada**: tamaño del objetivo, modo de activación
   (toque, clic, permanencia, pulsador), y ninguna dependencia del arrastre.
   Es infraestructura compartida por todos los instrumentos futuros.
3. **Dificultad adaptativa dentro de un rango** que fija el terapeuta. En el
   Nivel 0 las perillas son manuales; la adaptación llega en el Nivel 1.
   Los ejes y las perillas se definen justo abajo.
4. **Registro de rendimiento que mide el error sin mostrarlo**: cada acierto,
   fallo, latencia y recorrido se registra con precisión; el paciente nunca ve
   un fallo calificado.
5. **Configuración y asignación en menos de 30 segundos**, medido con
   cronómetro, no estimado.

### Ejes de dificultad y perillas

**Son dos ejes independientes, no una escalera única.** **CONFIRMADO por el colaborador
clínico el 2026-08-26** (sesión 2, pregunta 0.1). Era la pregunta con consecuencia
económica directa: la confirmación fija el banco en **dos ejes** —256 elementos tras ADR-0006, 384 cuando se escribió esto— y descarta la
hipótesis de ~130 que habría fusionado los dos ejes.

| Eje | Perillas | Qué exige al paciente |
| ---- | ---- | ---- |
| **Motor** | Tamaño del objetivo | Precisión de apuntado |
| **Perceptivo-cognitivo** | Cantidad de elementos · Similitud **semántica** · Similitud **visual** | Barrido visual, atención sostenida, discriminación categorial y de forma |

Son **cuatro perillas**, no tres. El prototipo de concepto descubrió que la
similitud son dos ejes clínicos distintos: **semántica** (buscar una manzana
entre frutas) y **visual** (buscar una manzana entre tomates, cerezas y fresas).
Entrenan capacidades diferentes y un terapeuta ocupacional las distingue.

**Los dos ejes se ajustan por separado, y esto no es negociable.** Un paciente
con déficit motor puro y cognición intacta necesita bajar el eje motor sin tocar
el cognitivo. El caso inverso también existe. Una escalera única que mezcle los
dos ejes hace falso el pilar 3 para esos pacientes: el terapeuta no tendría
control clínico real, solo un dial de "más difícil".

**El suelo del eje motor es 44 px** (WCAG 2.2 AAA). Por debajo, hasta el mínimo
absoluto de 24 px, existe un **modo de reto motor aparte**, que requiere
confirmación explícita del terapeuta y **queda marcado en el registro**. Motivo:
una activación fallida sobre un objetivo pequeño se registra como fallo, y eso
contamina el dato con ruido motor en lugar de déficit de búsqueda visual. El
terapeuta debe poder correlacionar el aumento de fallos con ese ajuste.

**El espacio de configuración no es libremente componible.** Las perillas
degeneran en los extremos: la cantidad alta con similitud visual máxima produce
repetición bruta de pocos iconos en lugar de discriminación, y la cantidad alta
con tamaño grande desborda la pantalla. `/design-system` debe declarar las
restricciones derivadas en Edge Cases.

---

## Player Motivation Profile

### Primary Psychological Needs Served

| Need | How This Game Satisfies It | Strength |
| ---- | ---- | ---- |
| **Autonomy** | Mínima por diseño: el terapeuta asigna el ejercicio. **Sin mitigación planificada todavía** | Minimal — sin mitigación |
| **Competence** | La dificultad calibrada es el motor de competencia. Objetivo: ~80% de acierto, el canal de flujo. Pero el canal de progreso vive en la vista del terapeuta, así que la competencia llega al paciente **mediada por otra persona**, no por una señal propia | **Core, mediada por el terapeuta** |
| **Relatedness** | La aporta el terapeuta presente en la sala. No se construye en el software. No hay funciones sociales y no las habrá | Minimal (externa) |

**Dos correcciones de honestidad aplicadas tras `/design-review`:**

La versión anterior describía la autonomía como compensada con "elecciones
baratas que no alteran la carga clínica — tema del banco, orden de búsqueda,
ritmo". Esa compensación **no aparecía en ningún nivel del roadmap**: ni en los
requisitos del MVP, ni en el Nivel 1. La Teoría de la Autodeterminación trata la
autonomía como una necesidad, no como una preferencia estética, así que describir
una mitigación que no existe en ningún build es una hoja de parra. Se retira la
descripción hasta que exista un compromiso de alcance real.

La fila de competencia decía "Core" sin matiz. Pero el documento también dice que
el paciente no ve cifras ni barras y que la mejora medida se muestra al terapeuta.
Si el único canal está fuera de la persona, lo que se devuelve es competencia
*observada por otro*. Eso es una cosa distinta, y ahora la tabla lo dice.
**Diseñar una señal de competencia perceptible por el paciente, adulta y no
infantilizante, queda como problema de diseño abierto** — registrado en Design
Risks, sin solución comprometida.

Solo la competencia hay que programarla. Las otras dos se cubren por el
contexto de uso, no por el producto.

### Player Type Appeal (Bartle Taxonomy)

La taxonomía de Bartle describe a jugadores que eligieron jugar. El paciente
no eligió estar aquí, así que la taxonomía se aplica con reservas.

- [x] **Achievers** — Se aplica al **terapeuta**: quiere ver progreso medible
  en su paciente. Se sirve con la vista de evolución, no con logros para el
  paciente.
- [x] **Explorers** — Se aplica al **terapeuta** como usuario profesional:
  quiere entender qué perilla produce qué efecto clínico. Se sirve con
  perillas nombradas de forma inteligible y con datos interpretables.
- [ ] **Socializers** — No se sirve. Excluido por anti-pilar 1.
- [ ] **Killers/Competitors** — No se sirve. Excluido por anti-pilar 1.

Para el paciente, el marco correcto no es Bartle sino la estética MDA de
**sumisión**: el placer de una tarea estructurada, absorbente y poco
exigente. Es la misma necesidad que sirven los juegos de objetos ocultos y
los match-3, cuyo público es amplio y sesga hacia edad adulta avanzada — un
solapamiento útil con la casuística de un terapeuta ocupacional.

### Flow State Design

- **Onboarding curve**: no hay tutorial. Se muestra la imagen objetivo y el
  tablero; la acción es evidente sin instrucciones. El terapeuta explica lo
  que haga falta. Esto no es negociable: un tutorial es una barrera para
  alguien con deterioro cognitivo.
- **Difficulty scaling**: Nivel 0, manual con perillas en pantalla. Nivel 1,
  adaptativa dentro del rango que fija el terapeuta, con objetivo de ~80% de
  acierto.
- **Feedback clarity**: el paciente percibe mejora por la fluidez de la
  tarea, no por una cifra. La mejora medida se muestra **al terapeuta**. Una
  barra de progreso estancada es un castigo, y eso rompe el pilar 2.
- **Recovery from failure**: no existe estado de fallo. Un toque incorrecto
  se reconoce con una onda visual suave — "te he oído" — y no se califica.
  Sin rojo, sin sonido de error, sin resta. La ausencia total de respuesta se
  descarta: se percibe como que el sistema está roto, y alguien con deterioro
  cognitivo no sabrá si su toque se registró.

---

## Core Loop

Este producto tiene **cuatro** bucles de usuario, no uno.

| Bucle | Usuario | Duración | Verbo |
| ---- | ---- | ---- | ---- |
| Preparación | Terapeuta | 30 s antes de la sesión | Configurar y asignar |
| Ejecución | Paciente | 30 s repetidos | Buscar y señalar |
| **Ajuste en vivo** | Terapeuta | 5-10 s, durante la sesión | Corregir viendo al paciente |
| Lectura | Terapeuta | 2 min después | Interpretar resultados |

Si el bucle de preparación no baja de 30 segundos, el terapeuta vuelve a las
fotocopias. Ese es el umbral real de adopción del producto.

El bucle de ajuste en vivo no estaba en la versión anterior, pese a que la sección
Key Dynamics ya afirmaba que el terapeuta ajusta las perillas *durante* la sesión.
Un bucle sin presupuesto de tiempo ni regla de interacción es un bucle que se
resolverá por implementabilidad, y eso es exactamente lo que había pasado.

### Frontera de modo entre terapeuta y paciente

El documento pedía dos cosas aparentemente incompatibles: que la configuración
sea accesible sin salir del ejercicio, y que el paciente no la vea ni la toque.
En un solo dispositivo parecían irreconciliables.

**No lo son.** La premisa falsa es que "accesible sin salir del ejercicio"
signifique "visible al mismo tiempo que el tablero". El terapeuta está en la sala,
a un brazo de la tableta. No necesita ver el tablero y las perillas a la vez:
necesita **llegar** a las perillas en un gesto, sin perder el estado de la sesión.

**La resolución, en un solo dispositivo:**

1. **El tablero ocupa la pantalla completa, con cero cromo.** Esto no es una
   concesión: es lo que el Visual Identity Anchor ya exige. La versión anterior del
   MVP ponía las perillas en la misma pantalla que el tablero, y con ello
   **violaba el propio anclaje visual de este documento**.
2. **Un único gesto de apertura, imposible para el paciente por construcción.** El
   paciente activa con un puntero, al soltar, y el arrastre está excluido por
   especificación. Por tanto una pulsación larga en esquina (≥800 ms), un toque con
   dos dedos, o una tecla física quedan **fuera de su gramática de entrada**. No es
   seguridad por oscuridad: se deriva de la especificación de entrada ya escrita.
3. **Abrir el panel pausa el tablero y lo tapa por completo.** El paciente **no ve
   al terapeuta bajar un número**. La señalización de déficit desaparece. Percibe
   una interrupción, no un juicio — y una interrupción es normal en terapia.
4. **Controles discretos (− valor +), no sliders.** Elimina el arrastre accidental
   por control motor reducido, es más rápido para el pilar 1, y **peldaños discretos
   son comparables entre sesiones; un slider continuo no lo es**.
5. **Todo cambio surte efecto en el tablero siguiente, nunca en el actual.** Mata
   el "de repente se ha vuelto más fácil sin motivo" y convierte el tablero en la
   unidad de registro con una sola configuración.

**El control de parar** vive en ese mismo panel modal, fuera del ciclo de barrido
por pulsador del paciente y fuera de su área de permanencia. `/ux-design` debe
declarar explícitamente qué elementos entran en el ciclo de barrido del paciente y
cuáles quedan excluidos por diseño.

**`Player Count` no cambia: sigue siendo un dispositivo.** El dispositivo
acompañante para el terapeuta es la respuesta correcta en el **Nivel 3**, práctica
en casa, donde el terapeuta es remoto — y ahí el concepto ya acepta servidor y
RGPD. Introducirlo antes añadiría un canal de red, lo que rompería la garantía
práctica del anti-pilar 4 y haría inaplicable la regla de CI que lo protege.

### Moment-to-Moment (30 seconds)

Ver la imagen objetivo (visible de forma permanente) → recorrer el tablero →
señalar el elemento → confirmación → siguiente objetivo.

La acción es intrínsecamente satisfactoria: la resolución de una búsqueda
visual gratifica por sí misma. Es el mismo bucle del género de objetos
ocultos, comercialmente probado durante dos décadas. No hay que inventar
diversión aquí; hay que no estropearla.

### Short-Term (5-15 minutes)

Una ronda. **Pregunta abierta pendiente de prototipo:** ¿el paciente busca un
objetivo por tablero, o vacía el tablero entero? Vaciar el tablero da mejor
satisfacción de cierre y un tablero a medias genera el impulso de "una más".
Recomendación de partida: vaciar el tablero.

### Session-Level (30-120 minutes) — adaptado

**Este bucle no aplica en su forma estándar.** Una sesión de terapia dura
30-60 minutos y el instrumento es solo una parte de ella. El bucle real son
5-15 minutos dentro de algo más grande, y **el terapeuta controla el reloj,
no el juego**.

Requisito de arquitectura que se deriva de esto: se debe poder parar en
cualquier momento sin perder datos. No existe "partida en curso" que se pueda
perder.

### Long-Term Progression

**El eje de progreso es la dificultad tolerada a precisión constante.** No es la
precisión.

Esto corrige un error de la versión anterior, que prometía tres ejes medibles e
independientes: velocidad, precisión y dificultad tolerada. En cuanto la
adaptación del pilar 3 está activa, el sistema ajusta la dificultad **para
mantener la precisión cerca del 80%**. La precisión deja entonces de ser una
salida libre y pasa a ser una variable de control fijada por el propio sistema.
Un panel que mostrara "precisión estable" como hallazgo clínico estaría mostrando
un artefacto del algoritmo.

Bien entendido, esto no es una pérdida: es el fundamento de los **métodos de
escalera de la psicofísica adaptativa**. El objeto de medida es el *umbral*, y la
tasa de acierto se mantiene fija a propósito **para poder** medirlo. La dificultad
tolerada a precisión constante es una medida clínica más fuerte que la tasa de
acierto cruda.

Ejes de progreso, corregidos:

| Eje | Estado como métrica |
| ---- | ---- |
| **Dificultad tolerada** (a precisión constante) | **Señal principal.** Qué configuración hace falta para seguir produciendo ~80% de acierto |
| **Velocidad** (latencia por objetivo) | Válida, y libre del controlador |
| **Precisión** | **No es un eje de progreso** cuando la adaptación está activa. Es la variable de control |

**Requisito derivado, obligatorio desde el Nivel 0:** cada registro guarda la
configuración exacta que lo produjo, y el historial guarda **qué perilla cambió y
cuándo**. Sin eso, el terapeuta nunca podrá separar "el paciente mejoró" de "el
algoritmo bajó el listón", ni siquiera revisándolo después.

El progreso vive en la vista del terapeuta. No hay niveles, ni experiencia,
ni barra de progreso para el paciente. No hay un estado de "juego terminado".

### Retention Hooks

La retención no la produce el software: la produce la cita con el terapeuta.
Este producto no compite por la atención del paciente en su tiempo libre.

- **Curiosity**: variedad combinatoria del tablero. Cada ronda es distinta.
- **Investment**: ninguno por diseño. No se acumula nada que se pueda perder.
- **Social**: ninguno. Excluido por anti-pilar 1.
- **Mastery**: la percibe el paciente como fluidez de la tarea, y la ve el
  terapeuta como dato.

---

## Game Pillars

### Pillar 1: Treinta segundos para el terapeuta

Preparar y asignar un ejercicio nunca cuesta más de 30 segundos.

*Design test*: Si debatimos entre añadir una opción de configuración y
mantener la pantalla simple, elegimos la pantalla simple.

### Pillar 2: El error se mide, no se muestra

El sistema registra cada fallo con precisión. El paciente nunca ve un fallo
señalado.

*Design test*: Si debatimos cómo responder a un toque incorrecto,
reconocemos el toque y no lo calificamos.

### Pillar 3: La dificultad vive en un rango que fija el terapeuta

El sistema adapta dentro de límites clínicos y nunca los cruza.

*Design test*: Si debatimos entre que el sistema optimice el rendimiento o
que respete el techo del terapeuta, respeta el techo.

### Pillar 4: Contenido combinatorio, nunca redactado

Todo ejercicio se genera desde bancos de elementos. No escribimos contenido a
mano por nivel.

*Design test*: Si debatimos entre un instrumento que necesita un corpus
redactado y uno que se genera solo, elegimos el que se genera.

### Pillar 5: Adulto, no infantil

La estética y el lenguaje tratan al paciente como el adulto que es.

*Design test*: Si debatimos entre una recompensa efusiva y una sobria,
elegimos la sobria.

**Los pilares crean tensión entre sí a propósito.** El 1 empuja hacia la
simplicidad; el 3 exige una interfaz de configuración. El 2 dice que no
muestres el error; el 3 necesita medirlo. El 4 descarta la mitad del catálogo
previsto. Esa tensión es su trabajo: si todos apuntaran en la misma dirección
no romperían ningún empate.

### Regla de arbitraje: pilar 1 contra pilar 3

Celebrar la tensión no basta. Un pilar existe para romper empates, y un empate sin
árbitro es un pilar que no trabaja. Cuando el riesgo número uno del proyecto se
materialice — la configuración pasa de 30 segundos — el documento debe decir cuál
cede, o cada implementador lo resolverá a su criterio.

**Gana el pilar 1 en la superficie. El pilar 3 se satisface por debajo.**

En concreto:

1. **Valores por defecto por perfil.** El terapeuta elige un perfil de paciente y
   las cuatro perillas se preajustan. No parte de cero nunca.
2. **Divulgación progresiva.** Una o dos perillas visibles; las demás detrás de
   "más opciones". El pilar 3 conserva su precisión clínica completa, pero no la
   cobra en tiempo de pantalla.
3. **Presets por paciente.** La segunda sesión de un paciente cuesta un toque.

Lo que el pilar 3 **nunca** cede: el rango clínico completo debe seguir siendo
alcanzable. Se esconde, no se recorta. Quitar perillas para ganar segundos es la
solución prohibida — convertiría el control clínico en un dial de "más difícil".

Esta regla resuelve además el conflicto del panel de configuración (ver
"Frontera de modo" en Core Loop) y el presupuesto de interacción de los 30
segundos.

### Anti-Pillars (What This Game Is NOT)

- **NO haremos puntuaciones comparativas entre pacientes**: comprometería los
  pilares 2 y 5. Convierte la terapia en competición y expone el déficit.
- **NO haremos presión de tiempo por defecto**: comprometería el pilar 2. El
  reloj es un castigo implícito. El cronómetro existe como perilla que el
  terapeuta activa, nunca como norma.
- **NO haremos en el MVP los instrumentos que exigen corpus lingüístico
  redactado**: comprometería el pilar 4. Esto excluye del MVP los
  instrumentos de rellenar palabras, ordenar palabras y el juego de comprar.
- **NO haremos datos de PACIENTE en servidor hasta el Nivel 3**:
  el contexto de uso es en sesión, con el terapeuta delante. Guardar datos de
  salud en un servidor abre obligaciones de RGPD que no hace falta asumir
  todavía. Se asumirán cuando llegue la práctica en casa, de forma explícita
  y planificada.

  > **Matizado el 2026-08-24 con datos del colaborador.** La versión anterior decía
  > "ni cuentas ni datos en servidor". Hace falta separar dos cosas que se habían
  > metido en el mismo saco, y la separación resulta **más simple**, no más compleja.
  >
  > | Qué | Dónde | Por qué |
  > | ---- | ---- | ---- |
  > | **Material del terapeuta**: presets, configuraciones, biblioteca | **Sincronizable con cuenta**, desde el Nivel 1 | Material profesional, sin datos personales. Es lo que debe seguirle entre centros |
  > | **Datos del paciente**: aciertos, fallos, latencias, evolución | **Local al dispositivo. Nunca viajan.** | Dato de salud, y además **no hay necesidad de negocio** de que viajen |
  >
  > La clave la aporta el colaborador: **cuando cambia de centro, cambia también de
  > pacientes.** Cada centro tiene los suyos. Así que los datos del paciente no
  > necesitan seguirle — nunca. Eso convierte "local al dispositivo" en un
  > **principio permanente de diseño**, no en un aplazamiento hasta el Nivel 3.
  >
  > Consecuencia buena: la exposición al RGPD se minimiza de forma estructural, no
  > por política. La regla estática de CI que prohíbe `fetch` en el núcleo del
  > instrumento y en el módulo de registro **no caduca en el Nivel 3**: sigue siendo
  > correcta indefinidamente para esa parte del código.
  >
  > **RESUELTO el 2026-08-26** (sesión 2, pregunta 0.4): **el dispositivo es nuestro**
  > durante la fase de pruebas internas. Desaparece la política de TI de un centro ajeno
  > como restricción, y el despliegue es copiar archivos. Sigue faltando el modelo,
  > navegador y versión concretos, que `/test-setup` necesita para medir la resolución de
  > `performance.now()`. Cuando se amplíe a centros, esta pregunta vuelve.
  >
  > **[Contexto original] ¿De quién es el dispositivo?** El documento asume "la
  > tableta de la consulta", es decir del centro. Si es así, los datos del paciente
  > se quedan en el centro por construcción y todo encaja. Si el terapeuta usa su
  > propio portátil, los datos de salud salen por la puerta cuando cambie de trabajo.
  > La respuesta la decide todo el modelo de persistencia, y hay que preguntarla.

---

## Visual Identity Anchor

**Dirección seleccionada: "Contraste dentro del tablero, sobriedad alrededor"**

**Regla de una línea:** El área de juego obedece al contraste y a nada más;
el marco de la aplicación es sobrio y profesional.

El marco y el área de juego tienen requisitos distintos porque los miran
usuarios distintos. El marco lo ve el terapeuta y debe transmitir credibilidad
profesional. El área de juego la ve el paciente, y ahí manda el contraste.

**Principios de apoyo:**

1. **Figura y fondo siempre separados por contraste alto dentro del tablero.**
   *Test*: si un elemento no alcanza una razón de contraste de 4.5:1 contra su
   fondo, se cambia el color, no el tamaño.
2. **Cero decoración dentro del área de juego.**
   *Test*: si un adorno está dentro del tablero, fuera. Cualquier elemento
   decorativo compite con la figura y falsea la dificultad.
3. **La forma identifica; el color solo refuerza.**
   *Test*: nunca el color como única señal. Debe funcionar en escala de
   grises.
4. **En el marco, la tipografía y el espaciado hacen el trabajo, no la
   ilustración.**
   *Test*: si una animación no comunica un cambio de estado, fuera.

**Filosofía de color:** el marco en grises neutros con un único acento.
Dentro del tablero, fondo plano de saturación mínima y elementos a color
pleno. **El color de acento se reserva exclusivamente al objetivo actual** y
no aparece en ningún otro lugar de la interfaz.

Esta sección es la semilla del art bible.

---

## Inspiration and References

| Reference | What We Take From It | What We Do Differently | Why It Matters |
| ---- | ---- | ---- | ---- |
| Género de objetos ocultos (tipo *¿Dónde está Wally?*) | El bucle de búsqueda visual y la satisfacción intrínseca de encontrar | Sin narrativa, sin escenas ilustradas a mano, sin reloj. Tablero generado y adulto | Valida que el bucle de 30 segundos engancha a un público adulto amplio durante décadas |
| Apps de entrenamiento físico guiado | La idea de sesión estructurada con principio y fin | La sesión la compone el terapeuta, no un algoritmo, y no hay presión de rendimiento | Valida el modelo de "ejercicio pautado" como experiencia aceptable para adultos |
| Cuadernillos de estimulación cognitiva en papel | El formato mental que el terapeuta ya domina y confía | Adaptable por paciente, y se registra solo | Es el competidor real, no otros programas. La comparación se gana en tiempo de preparación |

**Inspiraciones no lúdicas:** el material físico que el terapeuta ocupacional
usa hoy — cartas plastificadas, fichas, tableros de madera. La familiaridad de
ese material es un activo, aunque la dirección visual elegida priorice el
contraste sobre la calidez.

---

## Target Player Profile

Este producto tiene dos perfiles. El primero decide la adopción; el segundo
determina el diseño de interacción.

### Perfil 1 — Terapeuta ocupacional (usuario que decide)

| Attribute | Detail |
| ---- | ---- |
| **Age range** | 25-55 |
| **Gaming experience** | Irrelevante. No se le debe exigir ninguna |
| **Time availability** | Minutos entre pacientes. Cero tiempo para aprender una herramienta compleja |
| **Platform preference** | El portátil o la tableta de la consulta. Navegador |
| **Current tools they use** | Fotocopias, cartas plastificadas, fichas impresas, y posiblemente alguna plataforma profesional — **pendiente de averiguar** |
| **What they're looking for** | Material que se adapte a cada paciente sin rehacerlo, y un registro que no haya que transcribir a mano |
| **What would turn them away** | Que preparar un ejercicio cueste más que fotocopiarlo. Que los datos no sean interpretables. Que el sistema decida cosas clínicas por su cuenta |

### Perfil 2 — Paciente (usuario final)

| Attribute | Detail |
| ---- | ---- |
> **Corregido el 2026-08-24 con datos del colaborador.** La versión anterior asumía
> psicomotricidad reducida, deterioro cognitivo y baja visión. La casuística real de
> su práctica es **gente mayor y personas con diversidad funcional del neurodesarrollo
> — autismo, TDAH y similares**. Y de forma explícita: **los niños no son un perfil
> genérico del producto.** Esto cambia los requisitos, ver abajo.

| **Age range** | Dos grupos: adultos mayores, y personas adultas con diversidad funcional del neurodesarrollo |
| **Gaming experience** | De ninguna a moderada. No se puede asumir ninguna convención de interfaz |
| **Time availability** | 5-15 minutos, dentro de la sesión, con el terapeuta presente |
| **Platform preference** | El dispositivo que le da el terapeuta. Táctil probablemente |
| **Relevant profile** | **Gente mayor**: baja visión, psicomotricidad reducida, deterioro cognitivo, secuelas de ictus. **Neurodesarrollo**: autismo, TDAH. Y combinaciones |
| **NO es un perfil objetivo** | **Niños.** El colaborador lo descarta de forma explícita. El diseño no se orienta a población infantil, lo que refuerza el pilar 5 en lugar de contradecirlo |

### Consecuencias de la corrección de perfil

**1. El pilar 5 sube de importancia, y mucho.** "Adulto, no infantil" pasa de
principio estético a requisito clínico. Un adulto con autismo o TDAH ha tenido
muchísima más exposición a material terapéutico infantilizante que un adulto mayor,
y es el grupo que más probablemente lo rechace. Ya no es una preferencia de estilo:
es una condición de aceptación.

**2. Falta un requisito completo: sensibilidad sensorial.** El documento no lo
menciona en ninguna parte, y el autismo lo hace obligatorio. Hoy el diseño tiene un
sonido en cada acierto y una animación en cada toque, sin control de silencio. Para
una persona autista, un sonido inesperado y repetido o un movimiento no anticipado
puede ser aversivo hasta el punto de terminar la sesión. Requisitos que entran:

- **Control de silencio y de volumen, obligatorio, no opcional.** Ya estaba
  identificado como barato; ahora es un bloqueante de perfil.
- **Modo de estímulo reducido**: sin sonido, sin animación, solo confirmación
  estática. Debe poder activarlo el terapeuta antes de empezar, sin entrar en
  ajustes avanzados.
- **Predictibilidad.** Nada aparece, se mueve ni suena sin que sea consecuencia
  directa de una acción del paciente. Esto ya lo cumple el diseño actual, pero
  conviene declararlo como regla para que ningún instrumento futuro lo rompa.
- **Sin transiciones bruscas** entre tableros.

**3. El eje motor pierde peso relativo; el de atención lo gana.** Autismo y TDAH no
son principalmente perfiles motores. La separación de ejes de la edición 2 sigue
siendo correcta y ahora está mejor justificada: **un mismo instrumento sirve a un
adulto mayor por el eje motor y a un adulto con TDAH por el eje de atención**, y por
eso los dos ejes tienen que ser independientes.

**4. TDAH y el cronómetro.** El anti-pilar 2 dice que no hay presión de tiempo por
defecto, y sigue siendo correcto como valor por defecto. Pero para trabajo de
inhibición y atención sostenida en TDAH, el cronómetro es una herramienta clínica
legítima. Refuerza la decisión de que exista como perilla que el terapeuta activa,
en lugar de eliminarlo.

**5. Los perfiles concretos siguen sin nombrar.** "Gente mayor, autismo, TDAH" son
categorías diagnósticas, no perfiles funcionales de emparejamiento. `/map-systems`
necesita saber qué **capacidad** entrena cada instrumento y para qué **limitación
funcional** sirve, no la etiqueta diagnóstica.

**Estado el 2026-08-26** (sesión 2, pregunta 0.2): el colaborador **no tiene la taxonomía
clara y delega en el equipo de desarrollo**. Se construye una versión provisional en
`design/gdd/taxonomia-perfiles-funcionales.md`.

> **Esa taxonomía es un andamio de ingeniería, no un instrumento clínico.** Existe para
> que el software se pueda construir y para que el colaborador tenga algo concreto que
> corregir. **El producto no sugiere ejercicios por perfil mientras siga sin validar**: el
> terapeuta elige y configura, y el sistema solo recuerda lo que eligió.
| **Perfil NO servido por este instrumento** | **Busca exige visión funcional. No es apto para pacientes ciegos.** Una tarea de búsqueda visual no tiene equivalente significativo sin vista, y ningún trabajo de ARIA la hace usable — solo la hace no hostil. El catálogo debe ofrecer instrumentos alternativos, por ejemplo auditivos, para ese perfil. Esta línea existe para que un terapeuta no lo asigne por error y gaste la sesión |
| **What they're looking for** | Una tarea que sí puedan hacer, que no les infantilice y que no exponga su déficit |
| **What would turn them away** | Que les señalen un fallo. Que el control exija una precisión que no tienen. Estética infantil |

---

## Technical Considerations

| Consideration | Assessment |
| ---- | ---- |
| **Recommended Engine** | **Ninguno.** Stack web con JavaScript, decidido por el usuario. No Godot, no Unity, no Unreal. `/setup-engine` configurará un stack propio |
| **Key Technical Challenges** | 1) Capa de adaptación de entrada: ratón, táctil, teclado y pulsador con un solo código; el clic por permanencia y el barrido por pulsador son trabajo propio. 2) Contraste y escalado verificables, no estimados. 3) Que el banco de imágenes sea intercambiable |
| **Art Style** | 2D. Elementos de silueta clara sobre fondo plano. Ver "Visual Identity Anchor" |
| **Art Pipeline Complexity** | Baja al principio: imágenes de stock. **Sube a media o alta después**: la coherencia de estilo entre cientos de elementos de stock es el coste real oculto del proyecto |
| **Audio Needs** | Mínimas. Un sonido suave de acierto. Sin música. Sin sonido de error, por el pilar 2 |
| **Networking** | Ninguna hasta el Nivel 3 |
| **Content Volume** | **Se dimensiona por distribución, no por total.** Nivel 0: 30 imágenes. Nivel 1: `clusterMin = 16` por grupo visual × 16 grupos = **256** (ADR-0006, antes 384), o menos con reutilización de clusters. Ver "Regla de distribución" abajo |
| **Procedural Systems** | La generación de tableros es procedural por diseño (pilar 4). El banco de imágenes se referencia por identificador desde un manifiesto con metadatos; el juego nunca referencia un archivo directamente, para poder sustituir el stock sin reescribir instrumentos |

### El banco de imágenes es infraestructura compartida

Un banco de imágenes categorizado sirve a cuatro de los diez instrumentos
previstos: búsqueda visual, clasificar por categorías, denominación de objetos
y precio justo. Construido bien una vez, los instrumentos siguientes salen
baratos. Construido mal, se rehace cuatro veces.

**Consecuencia de prioridad: el banco de imágenes es el primer activo del
proyecto, antes que el código de cualquier instrumento.**

### Regla de distribución del banco

**El banco se dimensiona por elementos por grupo visual, no por total.** Una
cifra total sin distribución no dice nada: un banco de 300 mal repartido es peor
que uno de 150 bien repartido.

Con la similitud visual en su nivel máximo, el pool de distractores disponibles es
`elementos del grupo − 1`. La aritmética con 8 por grupo, es decir pool = 7:

| Cantidad en el tablero | Distractores | Repeticiones por elemento |
| ---- | ---- | ---- |
| 36 | 32 | 4,6 |
| 80 | 72 | **10,3** |
| 100 | 90 | **12,9** |

> **Actualizado el 2026-08-24 con las fórmulas del GDD del sistema 1.** Este
> documento decía "23 a 30 elementos por grupo visual". Un rango no es una entrada
> válida de validación, y así lo rechazó `qa-lead`. Ahora es un entero derivado.

**`clusterMin = ceil((Cmax − 1) / Rmax) + 1 = 16`**, con `Cmax = 60` y `Rmax = 4`.
No se fija a mano: se deriva de esas dos perillas. Bajar `Rmax` a 3 sube
`clusterMin` a 21; subirlo a 5 lo baja a 13.

> **Corregido el 2026-09-01 — ADR-0006.** Este párrafo decía 24, con `Cmax = 100` y
> `distractores(Cmax)`. Dos errores encadenados. `distractores()` es **una fórmula
> muerta**: publicaba 90 distractores en el tablero de 100 cuando el código real hace
> `nD = C − 1 = 99`, y ningún módulo del producto la invoca. Y `Cmax = 100` nunca se
> validó con nadie. Con `Cmax = 60` y la fórmula real, `clusterMin = 16`.

Con menos elementos por grupo, los niveles altos de dificultad dejan de entrenar
discriminación visual y pasan a ser repetición bruta de pocos iconos.

**Tamaño total del banco: 256 imágenes** con 16 clusters al mínimo. Baja más aún
si un mismo cluster visual sirve a más de una categoría mediante etiquetado
múltiple. **Son 128 imágenes menos que las 384 planificadas**, y sin perder ninguna
función: ver ADR-0006. El modelo antiguo de "categorías × grupos por categoría × tamaño" ya no
aplica: **las categorías son etiquetas transversales y no multiplican el coste.**
Añadir una categoría semántica cuesta cero imágenes nuevas; solo producir un
cluster visual nuevo cuesta contenido.

**Y un hallazgo que redirige trabajo:** la habituación **a lo largo de una sesión**
no se resuelve agrandando el banco. Con 15 tableros por sesión a dificultad máxima,
un mismo asset aparece unas 56 veces aunque `Rmax = 4` se cumpla perfectamente en
cada tablero. Bajar eso a 6 exigiría un cluster de **226 imágenes**, que es
imposible de producir. Se resuelve en otros dos sitios: **política de muestreo** en
la generación de tableros (no reutilizar el mismo cluster maximizado en tableros
consecutivos) e **instrumentación** en el registro. Ver F7 del GDD del sistema 1.

**Tensión que hay que resolver al diseñar el banco:** más categorías sirve a la
variedad semántica; más elementos por grupo sirve a la variedad visual con cantidad
alta. Compiten por el mismo presupuesto. La distribución se decide en el GDD del
banco de imágenes, no aquí.

**CONFIRMADO el 2026-08-26** (sesión 2, pregunta 0.5): **sí hay pacientes con
sensibilidad sensorial.** Los sistemas 6 (modo de estímulo reducido) y 7 (control de
silencio y volumen) pasan de aplazables a **obligatorios en la primera prueba real**. Y
refuerza el anti-pilar 3: un efecto de celebración no sería solo ruido innecesario, sería
un problema activo para parte de la población.

**[PENDIENTE CLÍNICO]** Antes de producir 400 imágenes, el colaborador debe
confirmar que la similitud visual es un eje que él usa de verdad. Dimensionar el
banco es el error más caro disponible: cuatro instrumentos dependen de él.

---

## Risks and Open Questions

### Design Risks

- **La configuración pasa de 30 segundos y el terapeuta vuelve a las
  fotocopias.** Es el riesgo número uno del proyecto. Mitigación: cronometrarlo
  con el colaborador en el primer playtest. Es una métrica, no una opinión.
- **Las perillas de dificultad no corresponden a los ejes clínicos que el
  terapeuta usa realmente.** Mitigación: el colaborador las valida antes de
  programarlas.
- **La estética de sumisión puede resultar aburrida sin el terapeuta
  presente.** No es un riesgo en los Niveles 0-2, pero se convierte en el
  riesgo principal del Nivel 3 (práctica en casa).
- **RIESGO DEL PACIENTE, con el mismo peso formal que el umbral de 30 segundos.**
  La Core Fantasy dice que las dos mitades deben cumplirse o el producto no se usa,
  pero hasta ahora solo la mitad del terapeuta tenía métrica. Que "reconocido pero
  no calificado" se lea como respuesta y no como avería **es un riesgo abierto, no
  un principio resuelto**: distinguir acierto de fallo exige notar la *ausencia* de
  un marcador persistente frente a una onda que se va, y eso pide memoria de trabajo
  intacta e inferencia — precisamente lo que puede faltar. Tras varios toques sin
  marca, un paciente puede concluir razonablemente que el elemento que tocó **sí**
  era correcto. El prototipo declaró esta hipótesis NO PROBADA. Medición: observar
  duda o titubeo tras un toque incorrecto, con paciente real. **[PENDIENTE CLÍNICO]**
- **No existe señal de competencia perceptible por el paciente.** Problema de diseño
  abierto, sin solución comprometida. Ver Player Motivation Profile.
- **"Sin tutorial" es una hipótesis, no un axioma.** El documento lo declaraba no
  negociable sin haberlo probado con ningún paciente. Se conserva como valor por
  defecto, pero `/ux-design` debe prever una salvaguarda barata y no verbal — por
  ejemplo una pista visual tras un umbral de inactividad, sin texto y sin puntuación.
  **[PENDIENTE CLÍNICO]**
- **La habituación es un problema de validez de la medición, no de enganche.** Si el
  paciente memoriza elementos en lugar de entrenar la búsqueda, todo lo que el
  terapeuta ve mejorando está contaminado. Más imágenes es una solución de contenido
  para un problema de medición. Hace falta **instrumentación**: registrar el
  identificador de imagen por intento y detectar la caída de latencia sobre
  elementos repetidos.

### Technical Risks

- **Riesgo técnico global: bajo.** El desarrollador tiene perfil profesional,
  no hay motor y la mecánica es simple. Los riesgos reales del proyecto son de
  adopción y de diseño clínico.
- Adaptación de entrada para pulsador y clic por permanencia: es trabajo
  propio, sin biblioteca estándar que lo resuelva. Verificar además la
  **coexistencia con el clic por permanencia del sistema operativo**: los sistemas
  de seguimiento ocular ya lo emiten, y dos temporizadores apilados duplicarían la
  espera real.
- DOM contra Canvas: **presunción fuerte a favor de DOM.** La ADR debe justificar
  cualquier desviación, no partir en blanco. Con Canvas hay que construir a mano el
  foco, el orden de tabulación, el hit-testing geométrico para toque, permanencia y
  pulsador, un árbol de accesibilidad paralelo, el reflujo de texto en cada nivel de
  zoom — el texto en Canvas es un bitmap y no fluye —, el soporte de colores
  forzados del sistema, y encima las herramientas automáticas de contraste no pueden
  leer píxeles de Canvas. Dados los requisitos de entrada y visión que este proyecto
  ya tiene escritos, no es una decisión técnica neutra: es una decisión de
  accesibilidad con otro nombre.
- **Los objetivos del tablero deben ser `<button>` reales**, no `<div>` con estilo.
  Es lo que cobra el beneficio de haber elegido DOM: foco, rol y teclado gratis.
- **Determinismo:** `generarTablero(manifiesto, config, fuenteAleatoria)` debe ser
  una función pura con la aleatoriedad **inyectada**, nunca llamando a
  `Math.random()` por dentro. Sin eso ningún test puede aserir qué tablero se
  produjo, solo el tamaño del array. Es la aplicación directa de la norma de
  inyección de dependencias que el proyecto ya tiene escrita.
- **Protección contra reactivación accidental.** Sin ventana de repetición, un
  temblor o un roce prolongado genera una ráfaga de "fallos" que contamina el
  registro de precisión que el pilar 2 promete medir con exactitud.
- **Zoom y reflujo de texto** (WCAG 1.4.4, 1.4.10, 1.4.12). El perfil incluye baja
  visión y ningún documento dice todavía qué pasa al 200% de texto o al 400% de zoom.
- **El coste de ingeniería de F2 es entrada obligatoria de la decisión ráster contra
  vector en `/art-bible`.** El GDD del sistema 2 define un procedimiento para medir el
  contraste de una silueta recortada con transparencia: umbral de alfa, erosión
  morfológica, composición del anillo perimetral contra el fondo. **Bajo ráster eso
  existe como subsistema; bajo vector casi desaparece** — una forma con relleno
  declarado no tiene recorte que medir, y el contraste se calcula directo con F1. Es el
  quinto argumento a favor del vector y el primero cuantificable en trabajo de
  ingeniería. Sin él, `/art-bible` decidiría con información de coste incompleta, que es
  el error que ya se cometió con la estimación de 30-40 horas de contenido.

### Market Risks

- **Aviso regulatorio.** Si se afirma eficacia terapéutica, el producto entra
  en la regulación de productos sanitarios (MDR en la Unión Europea).
  Posicionarlo como *una herramienta que el terapeuta usa*, y no como *un
  tratamiento que mejora una patología*, lo mantiene fuera de esa categoría.
  Cuidar el lenguaje del producto desde el primer día: reescribirlo después es
  más caro.
- Existen plataformas profesionales de rehabilitación cognitiva en el mercado
  español. Eso prueba que el mercado existe, y también que hay competencia
  establecida. **Pendiente de investigar** con el colaborador.
- Riesgo de que el mercado sea demasiado pequeño para sostenerse
  económicamente. No evaluado. No es un bloqueante en los Niveles 0-2.

### Scope Risks

- **El coste real del proyecto es el banco de imágenes, no el código.** Se
  mitiga decidiendo hoy la fuente y el estilo, no dentro de seis meses.
- El catálogo de diez instrumentos es una visión, no un plan. El pilar 4 ya
  excluye tres de ellos del MVP.
- Sin plazo fijo, el riesgo no es incumplir una fecha: es que nada llegue a
  estar terminado. Se mitiga con la regla de que cada nivel funcione y se pueda
  entregar solo.

### Open Questions

| Pregunta | Cómo se responde |
| ---- | ---- |
| ¿Qué usa hoy el colaborador terapeuta, y por qué abandonó lo anterior? | Una conversación con él. Es la mejor investigación de mercado disponible |
| ¿Un objetivo por tablero, o vaciar el tablero entero? | Prototipo, Nivel 0 |
| ¿DOM o Canvas? | ADR, antes de escribir la capa de entrada |
| ¿Las perillas de dificultad corresponden a los ejes clínicos reales? | Validación del colaborador antes de programarlas |
| ¿Cuántas imágenes hacen falta para evitar la habituación? | Criterio clínico del colaborador, más observación en uso real |
| ¿Cuáles son los perfiles funcionales concretos con los que se emparejan los instrumentos? | **No es una pregunta abierta: es una entrada obligatoria de `/map-systems`.** Es la taxonomía central del producto y la define el colaborador, no el desarrollador. `/map-systems` no puede descomponer la plataforma sin ella |
| ¿Confirma el terapeuta que la similitud **visual** es un eje que usa, y que motor y cognitivo se ajustan por separado? | Conversación con el colaborador, antes de dimensionar el banco |
| ¿Cuánto tarda de verdad el flujo de configuración del **Nivel 1**? | Cronómetro sobre el flujo del Nivel 1, no del Nivel 0. El prototipo carece de selección de paciente, panel aparte y presets, así que cronometrarlo mide un flujo más corto que el del producto y **no sirve** para decidir si el riesgo nº 1 está resuelto |

---

## MVP Definition

**El MVP es el Nivel 0: el prototipo.**

**Core hypothesis** — reescrita como dos criterios comprobables. La versión
anterior decía "un paciente real completa rondas con interés sostenido, y su
terapeuta configura en menos de 30 segundos": la segunda mitad parecía medible sin
serlo, y la primera **no podía fallar**, porque cualquier resultado se lee como
"sostenido" a posteriori.

- **H1 (terapeuta):** un terapeuta que no ha usado la herramienta antes configura
  y asigna el ejercicio — desde pantalla en blanco hasta ejercicio listo para el
  paciente — en ≤30 s, en al menos 8 de 10 intentos. Con el colaborador para el
  Nivel 1; con al menos dos terapeutas ajenos antes de comprometerse con el
  Nivel 2. **[PENDIENTE CLÍNICO]**
- **H2 (paciente):** en ≥5 sesiones con pacientes reales, el paciente vacía el
  tablero asignado sin que el terapeuta necesite reconducir su atención en ≥80% de
  las rondas observadas, y el terapeuta puntúa el interés observado 1-5 al terminar
  la sesión, con media ≥4. Instrumento débil y observacional a propósito: es lo
  proporcionado a un desarrollador solo. **[PENDIENTE CLÍNICO]**

**Required for MVP**:

1. Generación de tableros desde un banco de 30 imágenes de stock, referenciadas
   por identificador desde un manifiesto. Si el manifiesto tiene menos elementos
   de los que exige la configuración activa, la generación **falla con un error
   explícito**, nunca con un tablero incompleto en silencio.
2. **Cuatro** perillas manuales — cantidad, similitud semántica, similitud visual,
   tamaño — en un **panel modal opaco** que pausa y tapa el tablero, no en la misma
   pantalla. Ver "Frontera de modo" en Core Loop. Controles discretos, no sliders.
   Los cambios surten efecto en el tablero siguiente.
3. Feedback de acierto: el elemento **permanece visible en su posición final** y se
   dispara el acuse sonoro en <150 ms desde la entrada. Que además se perciba como
   "generoso" es Visual/Feel, con evidencia de captura y firma, no bloqueante.
4. Toque incorrecto reconocido y **nunca calificado como error**. La activación
   ocurre al soltar, y el gesto se cancela sin registrar nada si el puntero sale del
   elemento antes de soltar (WCAG 2.5.2).
5. Registro de la sesión **en memoria volátil**, visible al final para el terapeuta.
   Cada entrada guarda la configuración que la produjo y qué perilla cambió y cuándo.
6. **"Parar" significa pausar dentro de la misma pestaña, sin perder lo ya hecho.**
   Nada sobrevive a una recarga o al cierre de la pestaña en el Nivel 0. La
   persistencia local llega en el Nivel 1.

Los puntos 5 y 6 se contradecían en la versión anterior: "en memoria" y "sin perder
datos" son incompatibles si "parar" incluía cerrar la pestaña. Resuelto a favor de
memoria volátil, porque el Nivel 0 es un prototipo de consulta supervisada y porque
introducir `localStorage` antes de tiempo abre la cuestión de los datos de salud sin
necesidad.

**Explicitly NOT in MVP**:

- **Dificultad adaptativa.** Primero se valida que las perillas son las
  correctas; automatizar una perilla equivocada es trabajo perdido. La
  adaptación llega en el Nivel 1. Cuando llegue, su GDD debe especificar la
  ventana de cálculo (**≥20 objetivos acumulados, no por tablero** — con 3
  objetivos por tablero los únicos valores posibles son 0, 33, 67 y 100%, así que
  el objetivo del 80% sería matemáticamente inalcanzable y el controlador
  oscilaría para siempre), el arranque en frío, el caso `mínimo == máximo`, y qué
  ocurre antes del primer dato.
- Panel del terapeuta **como pantalla aparte**. No hay pantalla aparte: hay panel
  modal opaco desde el primer día, porque es más barato que una pantalla completa
  y porque sin él el pilar 2 queda expuesto ya en el Nivel 0.
- Perfiles de paciente y persistencia.
- Cualquier otro instrumento del catálogo.
- Android, iOS y cualquier empaquetado nativo.
- Cuentas, servidor y cualquier dato que salga del dispositivo.

### Scope Tiers

| Tier | Content | Features | Timeline |
| ---- | ---- | ---- | ---- |
| **MVP (Nivel 0 — Prototipo)** | 1 instrumento, 30 imágenes de stock | Perillas manuales en pantalla, sin persistencia | Semanas |
| **Vertical Slice (Nivel 1 — Entregable)** | 1 instrumento, banco dimensionado por distribución: **256 imágenes** (ADR-0006; antes 384), o menos con reutilización de clusters. Ver Content Volume | Añade panel del terapeuta, perfiles locales, dificultad adaptativa dentro de rango, registro exportable | 2-3 meses |
| **Alpha (Nivel 2 — Catálogo)** | 3 instrumentos reutilizando banco y capa de entrada. Candidatos: clasificar por categorías, transcribir símbolos, precio justo | Prueba que la plataforma escala con instrumentos nuevos | +4-6 meses |
| **Full Vision** | Catálogo completo, composición de sesiones, informes, práctica en casa (Nivel 3) | Cuentas, servidor, RGPD, seguridad. Las obligaciones regulatorias entran aquí, de forma explícita | 18-30 meses |

Los Niveles 0 a 2 evitan por diseño las obligaciones de RGPD, gracias al
anti-pilar 4. El Nivel 3 las asume de forma deliberada y planificada.

---

## Next Steps

- [ ] **PRIMERO — Conversación con el colaborador terapeuta.** Una sesión, menos de
      una hora. Es lo único de todo el proyecto que el desarrollador no puede hacer
      solo, y cuya respuesta tardía invalida trabajo ya hecho. Cierra cuatro
      bloqueantes: cronometrar la configuración con un cronómetro real; confirmar los
      cuatro ejes y la separación motor/cognitivo; nombrar la taxonomía de perfiles
      funcionales que `/map-systems` necesita como entrada; y decir qué usa hoy y por
      qué abandonó lo anterior, que es la mejor investigación de mercado disponible.
      Llevar el prototipo con los bugs P2 y P3 ya corregidos.
- [ ] Puerta antes de construir el Nivel 1: `/gate-check` debe tratar las cinco
      suposiciones sin probar del informe del prototipo como **bloqueo explícito**,
      no como nota al pie. Escribir GDD no está bloqueado; comprometer semanas de
      desarrollo del Nivel 1, sí.
- [ ] Tarea de arranque del Nivel 1: `/test-setup` — crear `tests/unit/`,
      `tests/integration/`, `production/qa/`, `package.json` con `node:test`, y el
      `jsconfig.json` que falta para que `npx tsc --checkJs` funcione. Cuatro de los
      seis requisitos del MVP son Logic o Integration con puerta BLOCKING, y hoy no
      existe infraestructura para satisfacerlos.
- [ ] Ejecutar `/setup-engine` para configurar el stack web (sin motor)
- [ ] Ejecutar `/prototype busqueda-visual` — validar el bucle antes de escribir
      ningún GDD (código desechable)
- [ ] Si el prototipo da PROCEED: ejecutar `/art-bible` desde el Visual Identity
      Anchor de este documento
- [ ] `/design-review design/gdd/game-concept.md` para validar este documento
- [ ] `/map-systems` — descomponer la plataforma en sistemas: banco de imágenes,
      capa de adaptación de entrada, perfiles, registro, panel del terapeuta, y
      cada instrumento
- [ ] `/design-system` por cada sistema del MVP
- [ ] `/create-architecture` y las ADR requeridas:
      1. **DOM contra Canvas** — con presunción declarada a favor de DOM
      2. **Generación de tableros y aleatoriedad** — fuente aleatoria inyectada,
         para que la generación sea testeable de forma determinista
      3. **Persistencia de datos de salud** — los Niveles 0-2 la evitan por diseño;
         el Nivel 3 la asume de forma explícita
      4. **Invariantes como barreras de CI** — el anti-pilar 4 (sin red en los
         Niveles 0-2) y el pilar 2 (ningún fallo calificado en la superficie del
         paciente) son propiedades automatizables. Convertirlas en reglas estáticas
         de CI hace que un `fetch` añadido sin mala intención rompa el build en lugar
         de convertirse en un incidente de datos de salud
- [ ] `/architecture-review` para arrancar el registro de trazabilidad
- [ ] `/gate-check` antes de comprometerse con producción
