# Review Log — `design/gdd/tokens-tema-contraste.md`

---

## Review — 2026-08-25 — Verdict: NEEDS REVISION (cambios aplicados)

Scope signal: **L**

Specialists: `systems-designer`, `lead-programmer`, `ui-programmer`, `ux-designer`,
`technical-artist`. Síntesis sénior: `creative-director`.

**`accessibility-specialist` y `qa-lead` fueron excluidos del panel** porque habían
escrito las secciones de Fórmulas y Criterios de Aceptación respectivamente.

Hallazgos: ~60 | Bloqueantes: ~25 | Fórmulas: **6 → 5** | Criterios: 17 → 22

### Resumen

Cinco especialistas adversarios con contexto limpio **no atacaron ninguna de las cuatro
proposiciones centrales**: los dos ámbitos de token, el contraste como propiedad de un
par y no de un token, la ausencia estructural de token de error, y el contraste como
parámetro clínico.

Y el perfil de las correcciones confirma el veredicto: **casi todas son sustracciones o
declaraciones, no rediseños.** F5 se borra. El dominio de F6 se recorta. La
implementación de F2 se reubica. El fondo del tablero se vuelve invariante — menos
trabajo, no más. *"Un documento que se arregla quitando cosas no está mal diseñado; está
sobreextendido."*

### El golpe que no estaba en ninguna de las siete decisiones

**El documento sobredeclaraba su propio rigor.** Tres instancias comprobadas:

1. La premisa central de F5 era falsa
2. El cruce de F3 "exactamente en t=44" es 44,44, y el documento escribía "≈ 8" en la
   misma frase que decía "exactamente"
3. F2, F3 y F6 no tenían **ningún** criterio de aceptación, pese a la frase de apertura
   sobre verificación por ejecución

La frase *"las seis fórmulas se verificaron ejecutándolas"* se **borró**, no se suavizó.
*"Una afirmación de rigor sin regresión es peor que no afirmar nada, porque desactiva la
sospecha del siguiente lector."*

Y hubo una cuarta instancia, cometida **durante la propia aplicación**: al sustituir el
ejemplo de F6 por tokens del marco, la sesión inventó los valores Lab (25,80 en lugar
de 26,55) en lugar de calcularlos. Detectado por verificación posterior y corregido.

### Adjudicación de las siete decisiones

| # | Decisión | Fallo |
|---|---|---|
| 1 | Fuente de verdad (desacuerdo directo entre dos especialistas) | **Gana JS, y la objeción del parpadeo se disuelve.** El CSS es un archivo **generado y confirmado en git**, no una proyección de arranque. Sin parpadeo, y las dos verificaciones quedan hablando del mismo dato por construcción. → **ADR-0002** |
| 2 | F5 refutada | **Eliminada, junto a AC-11.** No por errónea: por **tautológica**. El contraste de F1 no contiene término de matiz, así que un par que pasa F1 pasa en escala de grises por definición |
| 3 | Viabilidad de F2 | **Sobrevive como definición, se reubica al sistema 13 como implementación, y se escalona por nivel** (advertencia en Nivel 0, bloqueo desde el 1). **No se escribe ningún decodificador de imagen** |
| 4 | F6 | **Se queda con el dominio recortado a token contra token.** Se retira la afirmación de que daba una herramienta al sistema 1. CIE76 se mantiene porque el sesgo de croma alto aplicaba al banco, que acaba de salir del dominio |
| 5 | Aislamiento de ámbitos | **Contenedores hermanos**, no `:root`. El grep baja de mecanismo de aplicación a aviso temprano |
| 6 | Tema y fondo del tablero | **`--board-bg` invariante y temas desacoplados.** Ver "lo único que importa" |
| 7 | Tabla de precedencia | **Aceptada íntegra.** `@layer scheme, theme, forced` |

### El punto ciego que el sénior encontró y cinco especialistas no

**El trilema del decodificador PNG era falso.** Las cuatro opciones que `technical-artist`
enumeró — decodificador propio sobre `node:zlib`, WebP inviable, binario externo, o
reutilizar Chromium — aceptaban que el proyecto debiera **poseer** un decodificador o
delegar en un binario.

**El navegador ya tiene uno, es alcanzable con `canvas.getImageData`, y es el mismo
decodificador que renderizará el asset al paciente.** Gana a las cuatro opciones en
coste y en corrección a la vez, y resuelve de paso el problema del doble reescalado:
medir y servir pasan a ser **una sola operación** en lugar de dos implementaciones que
deben coincidir por suerte.

Tres especialistas trabajaron sobre F2 y ninguno lo propuso.

### El defecto de línea más importante

`Math.min()` sobre un conjunto vacío devuelve `Infinity` en JavaScript, e
`Infinity >= 4,5` es `true`. Así que un asset cuyo borde se ha desvanecido por completo
— **exactamente el que F2 existe para atrapar** — pasaba por defecto. Silencioso, tardío
e irrecuperable.

Arreglado aquí y elevado a patrón prohibido del proyecto: **prohibido `Math.min()` sin
guarda de conjunto vacío en una puerta de validación.** Un conjunto vacío significa que
falta el dato, y falta de dato falla.

### Lo único que tenía que cambiar

> **El fondo del tablero deja de depender del tema.**

**El pilar 3 estaba incumplido por construcción, no por descuido.** La regla 9 (tres
temas completos) y F1 (4,5:1 vinculante en el tablero) son **mutuamente imposibles para
cualquier banco fijo**: de doce objetos plausibles medidos, seis fallan en claro, seis en
oscuro, y **cero fallan en ambos**. Los conjuntos son complementarios.

Así que conmutar el tema — o no conmutar nada y que la tableta Windows venga en oscuro de
fábrica — pone la mitad del banco bajo el umbral clínico y **mueve la dificultad sin que
el terapeuta toque una perilla.**

Dos rutas independientes llegaron a la misma conclusión: la aritmética de assets de la
sesión principal, y la halación en cataratas que aportó `ux-designer`. La segunda añade
que el valor por defecto **debe** ser claro, no solo fijo.

Y su arreglo es una **sustracción**. Eso lo decidió.

### El patrón nombrado, que vale más que cualquier arreglo individual

Tercera aparición del mismo modo de fallo en dos GDD:

| Sistema | Entrada del entorno | Qué cruzaba |
|---|---|---|
| 1 | Daltonismo del paciente | Convertía similitud semántica en visual |
| 2 | Tamaño de objetivo bajo 44 px | Ruido motor registrado como fallo de búsqueda |
| 2 | **Tema del sistema operativo** | **Cambia el fondo, y con él la dificultad** |

*"Tres veces no es coincidencia: es el modo de fallo característico del proyecto — una
entrada del entorno entrando en silencio en el espacio de parámetros clínicos."* Va a
reaparecer en los sistemas 5, 6, 8 y 11, y ahora está escrito en el GDD como regla para
GDD futuros: **cuando un sistema exponga un parámetro que el entorno pueda mover, tiene
que declararlo y registrarlo, no heredarlo.**

### Reparto de alcance

| Destino | Qué se va |
|---|---|
| **Sistema 13** (7 elementos) | Decodificación y formato · pipeline de reescalado · perfiles ICC · calidad del recorte · presupuesto de CI y caché · fixtures del decodificador · procedimiento de extracción de color de un asset |
| **Sistema 14** | Aplicación de AC-1, AC-3, AC-4, AC-8. Con la Decisión 5, el tokenizador de CSS **ya no sostiene la contención**, así que puede aplazarse sin debilitar la regla 2 |
| **Sistema 5** | Valores de `--board-scan-cursor` y `--board-dwell-progress`. **Este sistema les reserva entrada en el registro** para que nadie invente un color |
| **Sistema 6** | Ambigüedad **cerrada**, no movida: el modo de estímulo reducido **no define tokens de color**. Una frase que elimina un cuarto conjunto de tokens y toda su rama de infraestructura |
| **Sistema 11** | `GrayText` · rediseño de la confirmación de tamaño · contraste del estado "en pausa" · qué ve el paciente al abrirse el panel · zoom y reflujo |
| **Sistema 8** | La fila de dependencia se corrigió aquí. La **cuantificación** se queda: F3 añade 226,8 px, un 16,2% más de huella a `Cmax=100`, `t=140` |
| **ADR** | ADR-0002 (fuente de verdad de tokens) · ADR-0003 (alcance de cero dependencias) |

### Hallazgos que el sénior consideró equivocados o exagerados

| Hallazgo | Corrección |
|---|---|
| **El contraejemplo de la refutación de F5** | **Demuestra otra cosa.** Verde contra azul a 6,26 por F1 y 1:1 por HSL se presentó como que F1 está mal. Es lo contrario: **la claridad HSL es un modelo malo y conocido** — mapea amarillo puro y azul puro a 0,5 — y la definición defectuosa es la de AC-11. F5 muere por tautológica, no por errónea. *"Conclusión correcta, argumento equivocado, y el argumento equivocado era peligroso"*: llevado literalmente habría sustituido la luminancia de F1 por HSL, una regresión grave |
| Trilema del decodificador PNG | Falso. Ver el punto ciego arriba |
| Sesgo de CIE76 | Correcto y mal aplicado. Con el dominio recortado a tokens, las entradas son grises neutros más un acento. **Reubicado al sistema 13, no rechazado** |
| Fatiga de confirmación del tamaño | **El hallazgo mejor razonado de la revisión** y fuera del alcance de este documento. Que "los cambios surten efecto en el tablero siguiente" ya sea una ventana de previsualización, y por tanto que el botón de aplicar **ya sea** la confirmación, es elegante. Del sistema 11, y no se puede perder |
| Qué ve el paciente al abrirse el panel | Exagerado como bloqueante de este documento; **subestimado como hueco de proyecto** |
| Contraste simultáneo en tablero denso | Correcto pero prematuro. Modelarlo no es trabajo de MVP: es un proyecto de investigación |
| Ráster contra vector debe recibir el coste de F2 | **Endosado contra el propio sesgo del sénior a recortar alcance.** Bajo vector F2 casi desaparece. Escrito en `game-concept.md` como entrada obligatoria de `/art-bible` |

### Criterios de éxito

1. **Nunca se escribe un decodificador de imagen en este proyecto.** Si aparece uno en
   `tools/`, la decisión 3 se aplicó mal.
2. **El registro sigue teniendo un solo valor de `--board-bg` al cerrar el MVP.** Si
   aparece un segundo, la decisión 6 se erosionó y el pilar 3 volvió a estar expuesto.
3. **El GDD del sistema 5 no inventa ningún color.** Las dos filas reservadas absorbieron
   la necesidad, igual que `attrs` absorbió los campos del sistema 1.
4. **Los GDD 3 a 14 no vuelven a proponer fórmulas para el sistema 2.**
5. **El primer bug de tema en una tableta Windows real no es de precedencia.**
6. **Este documento pierde peso en la próxima revisión, no gana.**
