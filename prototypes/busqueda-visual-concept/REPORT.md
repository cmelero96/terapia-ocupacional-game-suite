# Concept Prototype Report: Búsqueda visual ("Busca")

> **Date**: 2026-08-24
> **Prototype Path**: HTML
> **Concept File**: `design/gdd/game-concept.md`

---

## Hypothesis

**Principal (probada):**

> Si el terapeuta mueve las tres perillas — cantidad de elementos, similitud y
> tamaño del objetivo — la dificultad cambia de forma perceptible y graduable.
> **Señal medible:** se pueden construir al menos cuatro niveles claramente
> distintos entre "trivial" y "demasiado difícil", y cada perilla produce un
> efecto por separado al moverla sola.

**Secundaria (NO probada — ver "Result"):**

> El acuse de recibo sin calificación se percibe como respuesta y no como avería.
> **Señal:** el probador nunca duda de si su toque se registró.

---

## Riskiest Assumption Tested

La suposición más arriesgada era **que las tres perillas dan un rango real**.

Se eligió esta y no la comprensión ni el enganche porque el bucle de búsqueda
visual ya está probado comercialmente por el género de objetos ocultos. Probar
"¿es divertido buscar cosas?" habría gastado un día en confirmar lo obvio.

Lo que no estaba probado era la premisa del *producto*: que el terapeuta tiene
control clínico real. Si solo la cantidad importara, no habría tres perillas
sino una, y el pilar 3 ("La dificultad vive en un rango que fija el terapeuta")
sería una ilusión.

**Resultado: la suposición se sostiene**, con las reservas de evidencia
recogidas más abajo.

---

## Approach

Un solo archivo HTML autocontenido, sin dependencias, sin servidor y sin paso de
build. Se abre con doble clic. Construido en una sesión.

**Path chosen:** HTML

**Reason for path:** Caso poco habitual — **el camino más rápido y el de mayor
fidelidad son el mismo**. La skill advierte que un prototipo HTML miente sobre la
sensación de juego porque el navegador añade de 50 a 133 ms de variación. Esa
advertencia no aplica aquí: el producto final *es* un juego de navegador, así que
la latencia del navegador no es un artefacto del prototipo, es la latencia real
del producto.

**Shortcuts taken (intentional):**

- Valores hardcodeados en todo el archivo
- Emojis como banco de imágenes, en lugar de imágenes reales
- Sin persistencia, sin menús, sin sonido, sin panel del terapeuta separado
- Sin dificultad adaptativa: las perillas son manuales y están en pantalla
- **Sin teclado ni pulsador.** Obligatorios en producción, pero son una hipótesis
  distinta. Este build probaba las perillas
- Sin manejo de errores

**Decisión de contenido y su consecuencia:** se eligió emoji sobre formas SVG
paramétricas. Esto convirtió la perilla de similitud de un dial continuo en
**tres niveles discretos curados a mano**. A cambio, desdobló la similitud en dos
ejes clínicos distintos (ver "Lessons Learned").

---

## Result

**Hipótesis principal: CONFIRMADA.** El desarrollador movió las tres perillas y
reportó que las tres cambian la dificultad de forma clara, con niveles distintos
construibles entre trivial y demasiado difícil.

**Hipótesis secundaria: NO PROBADA.** A la pregunta del peor momento la respuesta
fue "nada destacable". Eso indica ausencia de fricción, no que la onda de acuse de
recibo se lea como respuesta. La ausencia de queja no es confirmación. La
hipótesis secundaria sigue abierta.

**Dato técnico obtenido:** el build renderiza correctamente en Windows 11 con
navegador actual, incluidos los 64 emojis del banco. No generaliza a otras
plataformas ni a versiones antiguas de fuentes de emoji.

### Calidad de la evidencia — leer antes de dar peso a este informe

| Limitación | Consecuencia |
|---|---|
| **Un solo probador, y es el desarrollador** | Quien probó las perillas también las diseñó y sabe qué deberían hacer. Riesgo alto de sesgo de confirmación |
| **Debrief abreviado: 2 de 5 preguntas** | Faltan mejor momento, sorpresa y detalle. Menos observaciones que las previstas |
| ~~Ningún terapeuta lo ha probado~~ → **Lo probó el colaborador el 2026-08-24** | Riesgo nº 1 muy desactivado: configuró sin dificultad y la interfaz le resultó obvia sin explicación. Pero es un reporte **cualitativo, no cronometrado**, y sobre el flujo del Nivel 0, que carece de selección de paciente y presets |
| **Ningún paciente lo ha probado** | La comprensión sin instrucciones sigue sin probar |
| **Los niveles de similitud están curados a mano** | "La similitud funciona" puede reflejar la curación de los grupos de emojis y no el concepto |
| **Una sola sesión** | La habituación no se puede observar sin sesiones repetidas |

Esta confirmación es suficiente para pasar a diseñar. **No es suficiente para
considerar validado el producto.**

**Actualización del 2026-08-24 — sesión con el terapeuta colaborador.** Dos
suposiciones quedan desactivadas (el umbral de configuración y la adopción); tres
siguen abiertas y **todas necesitan pacientes, no terapeutas**. Y una pregunta con
consecuencia económica directa sigue sin respuesta: si la similitud semántica y la
visual son ejes distintos para él, lo que decide un banco de ~400 imágenes frente a
uno de ~130. Ver la tabla actualizada en "If Proceeding".

---

## Metrics

| Metric | Value |
|--------|-------|
| Path used | HTML |
| Iterations to playable | N/A (una sola escritura; sintaxis verificada con `node --check`, no verificada visualmente por el agente) |
| Prototype duration | Una sesión |
| Playtesters | **1 interno (el desarrollador) / 1 externo (terapeuta ocupacional colaborador, 2026-08-24)**. Cero pacientes |
| Feel assessment | No caracterizado con precisión. La respuesta fue "se ve bastante bien"; no se recogieron cifras de latencia percibida ni descripciones específicas |
| Hypothesis verdict | **Principal: CONFIRMED. Secundaria: NOT TESTED** |

---

## Recommendation: PROCEED

La hipótesis principal se cumplió: las tres perillas producen un rango de
dificultad separable, así que el control clínico del terapeuta existe de verdad y
el pilar 3 se sostiene. Esa era la premisa del producto y era lo único que
justificaba prototipar antes de escribir GDD. Con eso resuelto, seguir prototipando
no aporta: los riesgos que quedan abiertos — el umbral de 30 segundos, la
comprensión del paciente, la lectura del acuse de recibo, la habituación — **no se
pueden responder con otro prototipo hecho por el desarrollador**. Necesitan un
terapeuta y pacientes reales, y eso pertenece al Nivel 1, no al Nivel 0. El
siguiente paso correcto es diseñar, con estos hallazgos dentro de los GDD.

---

## If Proceeding

- **Core tuning values discovered** — escalera de dificultad candidata, obtenida
  del barrido.

  > **CORREGIDA el 2026-08-24 tras `/design-review`.** La versión original de esta
  > tabla mezclaba el eje motor con el eje cognitivo y bajaba de los 44 px, por
  > debajo del suelo de accesibilidad motora que el propio `prototype.html` muestra
  > en pantalla. Ver "Correcciones" al final del informe.

  **Dos ejes independientes, no una escalera única.** El tamaño es exigencia motora;
  la cantidad y las dos similitudes son carga perceptivo-cognitiva. Un paciente con
  déficit motor puro y cognición intacta necesita ajustarlos por separado.

  *Eje cognitivo-perceptivo:*

  | Nivel | Cantidad | Similitud |
  |---|---|---|
  | Trivial | 12 | Ninguna |
  | Fácil | 30 | Ninguna |
  | Medio | 50 | Semántica |
  | Difícil | 80 | Semántica y visual |
  | Máximo | 100 | Semántica y visual |

  *Eje motor (tamaño del objetivo):*

  | Nivel | Tamaño | Nota |
  |---|---|---|
  | Holgado | 120 px | Muy por encima del suelo recomendado |
  | Estándar | 90 px | |
  | Exigente | 64 px | Por encima de AAA (44 px) |
  | **Suelo de la escalera estándar** | **44 px** | AAA. No bajar de aquí sin fricción explícita |
  | Reto motor | 24-44 px | **Modo aparte**, con confirmación explícita del terapeuta y marca en el registro. No es un peldaño normal |

  El rango de 24 a 44 px no se elimina, pero deja de ser un peldaño de la escalera
  estándar. Motivo: una activación fallida sobre un objetivo pequeño se registra como
  "fallo", contaminando el dato con **ruido motor** en lugar de déficit de búsqueda
  visual. Si el terapeuta lo elige a propósito, el registro debe guardar que se usó
  ese modo para que pueda correlacionarlo con el aumento de fallos.

  **Fórmula de objetivos por tablero: `max(3, round(cantidad × 0.1))` — NO usar tal
  cual.** Es una función escalón, no una rampa: mantiene 3 objetivos fijos desde
  cantidad 9 hasta 34 (25 muescas sin cambio) y luego salta. De 34 a 35 el número
  de objetivos sube un 33%. La densidad oscila entre el 33%, el 8,8% y el 10% a lo
  largo del rango. Un terapeuta que mueva la cantidad de 30 a 35 entre dos sesiones
  cambia la duración de la ronda por un artefacto de la fórmula, no por el paciente
  — y eso contamina la comparación longitudinal que el producto promete. La fórmula
  definitiva se especifica en `/design-system`, con densidad de objetivo declarada
  como parámetro propio o constante.

- **Assumptions confirmed:**
  - Las tres perillas dan un rango separable (pilar 3 se sostiene)
  - "Vaciar el tablero" en lugar de "un objetivo por tablero" funcionó sin
    fricción. Confirma la recomendación del documento de concepto
  - El bucle no necesita tutorial ni texto de instrucciones

- **Assumptions disproved:** ninguna. Nada de lo que el documento de concepto
  asumía resultó falso en esta sesión.

- **Assumptions still untested** — actualizado el 2026-08-24 tras la sesión con el
  terapeuta colaborador:

  | Suposición | Estado |
  | ---- | ---- |
  | Umbral de 30 s de configuración — **riesgo nº 1** | **MUY DESACTIVADO.** El terapeuta "no tardó prácticamente nada" y la interfaz le resultó obvia sin explicación. Reservas: es cualitativo, no cronometrado, y el flujo del Nivel 0 carece de selección de paciente y presets. Se vuelve a medir en el Nivel 1 |
  | Que el terapeuta adoptaría la herramienta | **DESACTIVADO.** Compromiso condicional explícito: la usaría con una versión pulida. "Pulida" sigue sin definir |
  | Que las perillas correspondan a los ejes clínicos reales | **SIGUE ABIERTA.** Sin respuesta sobre si semántica y visual son ejes distintos. Decide ~400 contra ~130 imágenes |
  | Comprensión del paciente sin instrucciones | **SIGUE ABIERTA.** Ningún paciente lo ha probado |
  | Que el acuse de recibo sin calificar se lea como respuesta | **SIGUE ABIERTA.** Ningún paciente lo ha probado |
  | Habituación con banco pequeño | **SIGUE ABIERTA.** Requiere sesiones repetidas |

  Las tres últimas necesitan **pacientes**, no terapeutas. Son la puerta del Nivel 2,
  no del Nivel 1.

- **Emergent findings (inferencia de construcción, no observación de playtest):**

  **El banco de imágenes se dimensiona por elementos por grupo visual, no por
  total. Orden de magnitud: 23 a 30 por grupo.**

  > **CORREGIDO el 2026-08-24 tras `/design-review`.** La versión original de este
  > informe decía "8 o más por grupo visual". Ese número era una extrapolación
  > desde un solo punto de prueba (cantidad ≈ 36) y no se reverificó en el extremo
  > alto del rango. Es incorrecto.

  Con la similitud en su nivel máximo, el pool de distractores es `grupo − 1`.
  Aritmética con grupo = 8, es decir pool = 7:

  | Cantidad | Distractores | Repeticiones por elemento |
  |---|---|---|
  | 36 (el punto donde se probó) | 32 | 4,6 |
  | 80 (Difícil) | 72 | **10,3** |
  | 100 (Máximo) | 90 | **12,9** |

  Para sostener 3 o 4 repeticiones a cantidad 100 hacen falta **23 a 30 elementos
  por grupo visual**. Con 8, los dos niveles superiores de la escalera dejan de ser
  tareas de similitud visual y pasan a ser repetición bruta de 3 a 7 iconos — que
  es el mecanismo exacto de la habituación que este mismo informe lista como riesgo
  aparte. Los dos ejes colisionan justo en la esquina alta del rango.

  **La similitud no es una perilla: son dos.** Ver "Lessons Learned".

  **El espacio de configuración no está acotado.** Las perillas dejan de ser
  libremente componibles en los extremos: cantidad 100 con tamaño 140 px produce
  un tablero de unos 4100 px de alto, que no cabe en ninguna tableta sin
  desplazamiento vertical — y el desplazamiento nunca se aprobó como interacción,
  además de contradecir el género de referencia, donde se ve el tablero entero de
  un vistazo. `/design-system` debe declarar una restricción derivada del tipo
  `tamaño × cantidad ≤ área del tablero` en Edge Cases.

> Nota: el camino HTML no dejó incertidumbre sobre la sensación, porque el
> navegador es la plataforma real del producto. No hace falta un prototipo en
> motor. Sí hace falta, antes del Nivel 1, un prototipo específico de los **modos
> de entrada** (teclado, permanencia, pulsador), que este build cortó a propósito.

**Next steps:**
1. `/design-review design/gdd/game-concept.md`
2. `/gate-check`
3. `/art-bible`
4. `/map-systems`
5. `/design-system busqueda-visual` (usar la escalera de dificultad en Tuning Knobs y la fórmula de objetivos en Formulas)

---

## Lessons Learned

- **What assumptions were broken by actually building this?**

  Ninguna se rompió, pero una se enriqueció. El documento de concepto trata la
  similitud visual como una perilla. Al construirlo con emojis quedó claro que
  **son dos ejes clínicos distintos**: similitud **semántica** (misma categoría —
  buscar una manzana entre frutas) y similitud **visual** (misma forma y color —
  buscar una manzana entre tomates, cerezas y fresas). Un terapeuta ocupacional
  distingue esos dos ejes: entrenan capacidades diferentes. El GDD debe modelarlos
  como dos perillas separadas, no como una.

  Esto salió de una decisión que parecía menor — usar emojis en lugar de formas
  generadas — y es el hallazgo de diseño más valioso de la sesión.

- **What surprised us that didn't show up in the brainstorm?**

  Que el banco de imágenes tiene un **requisito estructural mínimo por grupo
  visual**, no solo un tamaño total. El brainstorm concluyó "cientos de imágenes
  para evitar la habituación". Faltaba: esas imágenes deben estar distribuidas de
  forma que cada grupo visual tenga suficientes elementos para poblar un tablero
  difícil sin repetir. Un banco de 300 imágenes mal distribuido puede ser peor que
  uno de 150 bien distribuido.

- **What would we test differently next time?**

  **Que el barrido de perillas lo haga el terapeuta colaborador, no el
  desarrollador.** Quien diseña las perillas sabe qué deberían hacer, así que su
  confirmación es barata. El terapeuta traería además la respuesta al riesgo
  número uno del proyecto — el umbral de 30 segundos — que esta sesión no pudo
  medir. Pasarle este mismo archivo HTML cuesta enviar un enlace.

  También: recoger el debrief completo. Dos de cinco preguntas dejaron el informe
  más pobre de lo necesario, y el coste de las otras tres eran tres minutos.

---

> *Prototype code location: `prototypes/busqueda-visual-concept/`*
> *This code is throwaway. Never refactor into production.*
