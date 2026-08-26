# Review Log — `design/gdd/game-concept.md`

Historial de revisiones. Una entrada por sesión de `/design-review`.

---

## Review — 2026-08-24 — Verdict: NEEDS REVISION

Scope signal: **S** para la revisión del documento (8 ediciones más 5 líneas, un
día). **XL** para la plataforma completa (6 sistemas, 4 ADR requeridas,
accesibilidad transversal).

Specialists: `game-designer`, `systems-designer`, `ux-designer`, `qa-lead`,
`accessibility-specialist`, y `creative-director` como revisor sénior. Modo full,
los cinco especialistas en paralelo y de forma adversarial.

Blocking items: 8 (tras el triaje del sénior, desde ~30 reportados por los
especialistas) | Recommended: ~20 | Prior verdict resolved: primera revisión.

### Resumen

**El dato más importante es un silencio.** Cinco especialistas instruidos
explícitamente para atacar el documento no impugnaron ni un pilar, ni un
anti-pilar, ni el hook, ni la doble fantasía. El concepto es correcto; lo que
falla es la precisión.

El recuento de ~30 bloqueantes es un artefacto del método, no una medida de
calidad. Tres causas lo inflan: error de categoría (juzgar un documento de
concepto contra la norma de un GDD de sistema, cuando `/design-system` y
`/ux-design` no se han ejecutado), defectos autoinfligidos de la misma sesión
(4 bugs de código desechable y 3 errores aritméticos del informe del prototipo),
y sesgo adversarial. El sénior corrigió o degradó 6 hallazgos de los
especialistas.

Diagnóstico del sénior: el documento no estaba *incompleto*, estaba
**desactualizado respecto a su propio prototipo**. Eso solo le pasa a un proyecto
que avanza.

### Las 8 ediciones bloqueantes — TODAS APLICADAS el 2026-08-24

| # | Edición | Estado |
| ---- | ---- | ---- |
| 1 | Tres perillas pasan a cuatro: cantidad, similitud semántica, similitud visual, tamaño | Aplicada |
| 2 | Dos ejes independientes: motor (tamaño) y perceptivo-cognitivo (cantidad, similitudes), ajustables por separado. Suelo motor en 44 px, con 24-44 px como modo de reto aparte marcado en el registro | Aplicada |
| 3 | Frontera de modo terapeuta/paciente: panel modal opaco que pausa y tapa el tablero. Cuarto bucle "Ajuste en vivo" añadido a Core Loop. MVP punto 2 reescrito | Aplicada |
| 4 | El eje de progreso es **dificultad tolerada a precisión constante**, no precisión. Cada registro guarda su configuración y qué perilla cambió | Aplicada |
| 5 | Contradicción entre los puntos 5 y 6 del MVP resuelta: memoria volátil, "parar" = pausar en la pestaña, persistencia local en el Nivel 1 | Aplicada |
| 6 | Tabla MDA partida en dos: bucle del paciente y bucle del terapeuta | Aplicada |
| 7 | Regla de arbitraje pilar 1 contra pilar 3: gana el 1 en la superficie, el 3 se satisface con valores por defecto por perfil, divulgación progresiva y presets. El rango clínico se esconde, nunca se recorta | Aplicada |
| 8 | El banco de imágenes se dimensiona por distribución (23-30 por grupo visual, ~400 en total), no por total. Sustituye la cifra incorrecta de ~150 | Aplicada |

Cinco líneas adicionales aplicadas: la exclusión explícita de pacientes ciegos ·
presunción fuerte de DOM en lugar de ADR neutra · criterios H1 y H2 comprobables
en lugar de "interés sostenido" · la ADR de aleatoriedad en Next Steps · autonomía
bajada a "sin mitigación planificada" y competencia matizada a "mediada por el
terapeuta". Status: `Draft` → `Reviewed`.

### Adjudicación de C1 — la llamada de mayor riesgo

`ux-designer` sostuvo que el conflicto terapeuta/paciente podía ser irresoluble en
un dispositivo y exigir un segundo dispositivo acompañante, lo que cambiaría
`Player Count`.

**El sénior lo rechazó para los Niveles 0-2.** La premisa falsa es que "accesible
sin salir del ejercicio" signifique "visible al mismo tiempo que el tablero". El
terapeuta está a un brazo de la tableta: necesita *llegar* a las perillas en un
gesto, no verlas siempre. Resolución: tablero a pantalla completa con cero cromo,
un gesto de apertura fuera de la gramática de entrada del paciente (pulsación
larga, dos dedos o tecla física — el paciente activa con un puntero al soltar y
sin arrastre), panel modal que pausa y **tapa** el tablero, controles discretos en
lugar de sliders, y cambios que surten efecto en el tablero siguiente.

Motivo del rechazo: el canal de sincronización de dos dispositivos es una pila de
red, y eso rompe la garantía práctica del anti-pilar 4 y hace inaplicable la regla
de CI que lo protege. **El dispositivo acompañante es correcto en el Nivel 3**,
donde el terapeuta es remoto y el concepto ya acepta servidor y RGPD.

`Player Count` no cambia.

Hallazgo colateral valioso: el MVP punto 2, tal como estaba escrito, **violaba el
propio Visual Identity Anchor del documento** ("cero decoración dentro del área de
juego").

### Hallazgos que el sénior corrigió o degradó

| Hallazgo | Corrección |
| ---- | ---- |
| Infraestructura de test ausente = BLOCKING | Error de categoría. No es defecto de un concepto; `src/` está vacío porque no hay código. Baja a tarea de arranque del Nivel 1 |
| `count=100` a 140 px desborda la pantalla | Aritmética correcta, ejemplo de hombre de paja: la escalera empareja 100 con 32 px. Se resuelve con una restricción derivada en Edge Cases |
| El 80% es inalcanzable en el nivel Trivial | No es bloqueante aparte. Con la ventana definida sobre ≥20 objetivos acumulados en vez de por tablero, la cuantización desaparece |
| Punto único de fallo en la mitad del paciente | Exagerado. El terapeuta presente en la sala *es* la redundancia |
| "Solo sobrevive la dificultad tolerada" | Bien diagnosticado, mal resuelto: es derrotista. El eje pasa a ser *dificultad tolerada a precisión constante*, que es una medida clínica **más fuerte**. Es el fundamento de los métodos de escalera en psicofísica adaptativa: la tasa de acierto se fija a propósito **para poder** medir el umbral |
| "Reconocido pero no calificado" = RECOMMENDED | **Subestimado**, no exagerado. Único hallazgo promovido: ataca el mecanismo del pilar 2, que es el núcleo ético del producto |

### Defectos corregidos en artefactos de la misma sesión

En `prototype.html`, los cuatro:

- **P2** — el contador "quedan X de Y" estaba sobre el tablero, en la superficie del
  paciente. Es funcionalmente una barra de progreso, y el concepto dice que eso
  rompe el pilar 2. Movido al panel del terapeuta. *Limitación conocida: en una sola
  pantalla lo saca del campo de atención, no del campo de visión. El arreglo completo
  es el panel modal de la edición 3.*
- **P3** — la activación ocurría en `pointerdown`, incumpliendo WCAG 2.5.2. Ahora
  ocurre al soltar y el gesto se cancela sin registrar nada si el puntero sale del
  elemento antes. Un roce por temblor ya se puede abortar.
- **P1** — bajo `prefers-reduced-motion` la onda desaparecía (`opacity: 0`) en vez de
  volverse instantánea, dejando al paciente sin saber si su toque se registró: justo
  el escenario que el concepto descarta. Ahora es un anillo estático inmediato.
- **P4** — el acento se reutilizaba en sliders, barra de objetivo y aro de
  "encontrado". Ahora tiene un solo uso: la barra de objetivo.

Buena noticia verificada por cálculo: los tokens de color **pasan** (6,99:1 /
7,63:1 / 6,42:1 / 6,94:1 en oscuro). La paleta es sólida y pasa al art bible tal
cual. Lo que fallaba era el comportamiento.

En `REPORT.md`, tres errores aritméticos corregidos: el requisito de "8 o más por
grupo visual" (era una extrapolación desde un solo punto de prueba; el número real
es 23-30), la cifra de "~150 imágenes", y la escalera de dificultad, que mezclaba
los dos ejes y bajaba por debajo del suelo motor que el propio prototipo muestra en
pantalla.

### Lo único que importa más, según el sénior

**Sentar al terapeuta colaborador delante del prototipo, cronometrar la
configuración, y pedirle que nombre él los ejes clínicos y los perfiles funcionales
de su casuística.** Una sesión, menos de una hora.

Es lo único de toda la revisión que el desarrollador no puede hacer solo, y cuya
respuesta tardía invalida trabajo ya hecho. Cierra cuatro bloqueantes de golpe.
Argumento decisivo, de coste: dimensionar el banco en ~400 elementos antes de que
un terapeuta confirme que la similitud visual es una perilla que él usa es la forma
más cara posible de equivocarse, y cuatro instrumentos dependen de ese banco.

### Diferido a pasos concretos

| Destino | Qué |
| ---- | ---- |
| `/map-systems` | La taxonomía de perfiles funcionales, que es **entrada obligatoria**, no pregunta abierta |
| `/design-system busqueda-visual` | Fórmula de objetivos por tablero (la actual es una escalera con un tramo plano de 25 muescas), restricciones del espacio de configuración, suelo motor, muestreo sin adyacencia |
| `/design-system` del banco | Distribución concreta, e instrumentación de habituación (identificador por intento, caída de latencia sobre repetidos) |
| `/design-system` de la adaptación (Nivel 1) | Ventana ≥20 objetivos, arranque en frío, `mínimo == máximo`, división por cero, y registro de qué perilla cambió y cuándo |
| `/design-system` del registro | Distinguir en el modelo de datos el ruido motor, el error de memoria del objetivo y el error de búsqueda |
| `/ux-design` | Presupuesto de interacción de los 30 segundos (con preset y sin preset), control de parada, **pantalla de resultados — el hueco más grande**, alcance del ciclo de barrido, zoom y reflujo |
| ADR | DOM contra Canvas (con sesgo), aleatoriedad inyectada, persistencia de datos de salud, invariantes como barreras de CI |
| `/gate-check` | Las cinco suposiciones sin probar del prototipo, como bloqueo explícito antes de construir el Nivel 1 |
| `/test-setup` | `tests/`, `production/qa/`, `package.json`, y el `jsconfig.json` que falta |

### Aceptado y documentado como riesgo

Sin solución comprometida, por proporcionalidad para un desarrollador solo: la
señal de competencia perceptible por el paciente · fatiga y exposición continua ·
`forced-colors` de Windows · `aria-live` · fotosensibilidad en instrumentos futuros
· accesibilidad del marco del terapeuta · nivel de lectura del texto orientado al
paciente · coexistencia con el clic por permanencia del sistema operativo · el
panorama competitivo sin verificar. Excepción hecha: el control de silencio o
volumen sí se hace, porque es barato y además es un problema clínico real en una
consulta con salas contiguas.
