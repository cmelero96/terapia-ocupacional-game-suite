# Technical Preferences

<!-- Populated by /setup-engine on 2026-08-24. Updated as the user makes decisions throughout development. -->
<!-- All agents reference this file for project-specific standards and conventions. -->

## Engine & Language

- **Engine**: Ninguno — plataforma web, sin motor de juego
- **Language**: JavaScript (módulos ES), tipado con JSDoc
- **Type checking**: `npm run typecheck`, configurado en `jsconfig.json` (raíz del repo).
  `prototypes/` queda excluido a propósito. `moduleResolution` es **`NodeNext`**, y eso no
  es preferencia: es lo único que hace que `tsc` **exija** la extensión `.js` en los
  imports. Con `Bundler` un import sin extensión compila y falla con un 404 en el navegador
- **Comprobación completa**: `npm run check` = tipos + invariantes de CI + tests
- **Build step**: Ninguno. Los módulos ES se sirven tal cual al navegador.
  Los imports deben incluir la extensión `.js` — el navegador la exige y no hay
  bundler que la resuelva
- **Rendering**: **DOM.** Un elemento por objeto del tablero, disposición con CSS Grid,
  separación como `gap`. Ver [ADR-0005](../../docs/architecture/0005-dom-contra-canvas.md).
  Un `<canvas>` es admisible como elemento **hoja** para un instrumento que necesite
  pintura de píxeles, con alternativa accesible equivalente; nunca como área de juego
- **Physics**: Ninguna. Los instrumentos no necesitan simulación física

## Input & Platform

<!-- Written by /setup-engine. Read by /ux-design, /ux-review, /test-setup, /team-ui, and /dev-story -->
<!-- to scope interaction specs, test helpers, and implementation to the correct input methods. -->

- **Target Platforms**: Web (navegador: escritorio y tableta). Android e iOS aplazados a una iteración posterior
- **Input Methods**: Táctil, ratón, teclado, pulsador (switch) por barrido, activación por permanencia (dwell)
- **Primary Input**: Táctil — la tableta de la consulta
- **Gamepad Support**: None — un mando no es un dispositivo de asistencia en este contexto
- **Touch Support**: Full
- **Platform Notes**: Ninguna interacción puede depender del arrastre ni del `hover`.
  Todo debe ser accesible con un solo punto de activación. El tamaño del objetivo
  es un parámetro clínico que controla el terapeuta, no una constante de estilo.
  Lee `docs/engine-reference/web/modules/accessibility.md` antes de escribir
  cualquier código de entrada, de tamaño de objetivo o de color.

## Naming Conventions

- **Classes**: PascalCase (`InputAdapter`, `BoardGenerator`)
- **Variables**: camelCase (`targetSize`, `boardItems`)
- **Signals/Events**: kebab-case en pasado (`target-found`, `session-stopped`)
- **Files**: kebab-case (`input-adapter.js`, `board-generator.js`)
- **Scenes/Prefabs**: no aplica sin motor. El equivalente es un módulo ES por instrumento
- **Constants**: UPPER_SNAKE_CASE (`MAX_BOARD_ITEMS`, `MIN_TARGET_SIZE_PX`)
- **CSS custom properties**: `--kebab-case` (`--target-min-size`, `--accent`)
- **Image bank IDs**: kebab-case estable (`taza-roja`, `silla-madera`).
  Un identificador nunca se renombra: es la clave de los datos ya registrados

## Performance Budgets

- **Target Framerate**: 60 fps
- **Frame Budget**: 16,6 ms
- **Input Latency**: **por debajo de 100 ms** entre el toque y su acuse de recibo visible.
  En este proyecto este presupuesto importa más que los dos anteriores: un acuse de
  recibo tardío se percibe como que el sistema no responde, y eso rompe el pilar 2
- **Draw Calls**: no aplica sin motor de juego
- **Memory Ceiling**: sin definir. Se fijará cuando se conozca el hardware real de la consulta

## Testing

- **Framework**: `node:test` para lógica pura — sin dependencias y sin build.
  Playwright para interacción y accesibilidad, cuando llegue el Nivel 1
- **Minimum Coverage**: sin definir todavía
- **Required Tests**: generación de tableros, cálculo de dificultad, resolución del
  manifiesto del banco de imágenes, y el cálculo de razón de contraste de los tokens de color

## Forbidden Patterns

<!-- Add patterns that should never appear in this project's codebase -->

- **Arrastre como única vía de interacción.** WCAG 2.2 — 2.5.7 exige una
  alternativa. En este proyecto el arrastre está descartado por completo: se
  implementa con dos toques (seleccionar, después destino)
- **`hover` como requisito.** No existe en táctil ni con pulsador
- **Gestos con más de un punto de activación.** Ni pellizco, ni dos dedos, ni
  pulsación larga como requisito
- **Referenciar un archivo de imagen por ruta desde el código de un instrumento.**
  Siempre por identificador contra el manifiesto del banco, para que sustituir las
  imágenes de stock no obligue a reescribir instrumentos
- **Marcar o anunciar un fallo al paciente**, ni en lo visual ni por lector de
  pantalla. Rompe el pilar 2
- **Cualquier límite de tiempo activo por defecto.** Rompe el anti-pilar 2
- **Sustituir el archivo que hay detrás de un identificador existente del banco de
  imágenes.** El identificador es la clave con la que se guarda qué estímulo vio el
  paciente, y toda la medición asume que ese estímulo no cambia entre sesiones.
  Cambiar el archivo significa retirar el identificador y crear uno nuevo. No debe
  existir una operación de "reemplazar manteniendo id"
- **Leer una fuente no determinista del entorno desde `src/`**, fuera del único borde
  impuro. La lista cerrada es `Math.random()`, `crypto.getRandomValues()`, `Date.now()`,
  `new Date()`, `performance.now()` y **`event.timeStamp`**. El último es el que se cuela:
  es un reloj monótono disfrazado de propiedad de un evento, y ninguna búsqueda de los
  otros cinco lo encuentra. Llega **como dato dentro del evento adaptado**, nunca como
  lectura de reloj. Ver el sistema 3
- **Calcular una duración entre dos lecturas de orígenes de reloj distintos.** Un
  `event.timeStamp` y una lectura del reloj monótono de otra carga de página no son
  comparables. Es la misma clase de defecto que mezclar el reloj monótono con el de pared
- **Coercionar en silencio una entrada ausente o inválida a un valor de aspecto válido.**
  `?? 0` sobre un índice que puede ser `undefined` es la misma forma que `Math.min()` sin
  guarda: en el sistema 3, ese `0` es **la semilla 0**, o sea el mismo tablero en cada
  sesión, indistinguible de uno legítimo. Un dato ausente **falla**, no se sustituye
- **`Math.min()` o `Math.max()` sin guarda de conjunto vacío en una puerta de
  validación.** `Math.min()` sobre un conjunto vacío devuelve `Infinity`, y una
  comparación del tipo `resultado >= umbral` lo aprueba. Un conjunto vacío en una
  validación significa **falta el dato**, y falta de dato **falla**
- **`forced-color-adjust: none` en el ámbito del tablero.** El usuario eligió alto
  contraste; anularlo para una población de baja visión con el fin de preservar una
  garantía de diseño está del revés
- **Declarar tokens de color en `:root`.** Los tokens del marco viven en `.frame-root` y
  los del tablero en `.board-root`, que son hermanos y por tanto no heredan entre sí. Y
  esos dos contenedores **nunca se anidan**
- **Un `<input type="range">` para una perilla de dificultad.** Se opera arrastrando, y el
  arrastre está prohibido como vía única (WCAG 2.5.7). Era la única parte del producto que
  fallaba su propia regla de entrada, y ningún test lo vio porque todos usaban `.fill()`,
  que salta el gesto. Las cuatro perillas son **escalones** — ADR-0006. Un deslizador es
  admisible sólo para un continuo que no entre en el registro, como el tiempo de vuelta del
  barrido
- **Usar el color como criterio que separa dos grupos visuales (clusters).** La
  separación debe sobrevivir en escala de grises. Si dos clusters solo se distinguen
  por matiz, un paciente con daltonismo recibe una dificultad que el terapeuta no
  configuró — rompe el pilar 3 sin que ningún test lo detecte. El color puede variar
  *dentro* de un cluster; no puede definirlo

## Allowed Libraries / Addons

<!-- Add approved third-party dependencies here -->

**El alcance está definido en `docs/architecture/0003-alcance-cero-dependencias.md`.**

| Ámbito | Regla |
|---|---|
| `src/` — runtime servido | **Cero dependencias. Absoluto** |
| `tools/`, `tests/` | Permitidas cuando compran una capacidad que si no habría que reimplementar. Cada una se declara aquí con su justificación |
| Corolario | **La salida de una herramienta se confirma en git como archivo estático.** El artefacto servido nunca depende de que la herramienta se haya ejecutado |

Herramientas declaradas:

- **`typescript`, con versión FIJADA en `package.json`.** `CLAUDE.md` impone
  `npx tsc --checkJs --noEmit` como la única comprobación del proyecto, y hoy el compilador
  **no está instalado**: ni local, ni global, ni en `node_modules`. Esa puerta no se ha
  ejecutado nunca, y tres GDD ya declaran criterios BLOCKING que dependen de ella. Sin pin,
  `npx` trae la **7.0.2**, la reimplementación nativa: un cambio de motor de versión mayor
  en la puerta de calidad, sin decisión. **Fijar la versión es parte de la instalación**
- **`@types/node`** — solo tipos, y solo en desarrollo. `tsc` no puede comprobar un
  archivo que importe `node:test` sin ellos. No aporta código a nada servido
- `node:test` — incorporado en Node, sin instalación
- **Playwright** — para tests de interacción y accesibilidad, y **como decodificador de
  imagen** en el pipeline de validación del banco. Compra un decodificador correcto y
  probado por el propio motor de render, en lugar de escribir uno a mano
- Ninguna en `src/`

## Architecture Decisions Log

<!-- Quick reference linking to full ADRs in docs/architecture/ -->

- [ADR-0001](../../docs/architecture/0001-formato-del-manifiesto.md) — formato del
  manifiesto: módulo JS con literales, inyectado y no importado
- [ADR-0002](../../docs/architecture/0002-fuente-de-verdad-tokens.md) — fuente de verdad de
  los tokens: JS normativo, CSS generado y confirmado en git
- [ADR-0003](../../docs/architecture/0003-alcance-cero-dependencias.md) — el alcance de
  cero dependencias es el artefacto servido, no el entorno de desarrollo
- [ADR-0004](../../docs/architecture/0004-marca-nominal-como-mecanismo.md) — la marca
  nominal en JSDoc como mecanismo de aplicación, en lugar de análisis semántico en CI
- [ADR-0005](../../docs/architecture/0005-dom-contra-canvas.md) — DOM para el área de
  juego. Los colores forzados del sistema operativo no funcionan sobre un canvas
- [ADR-0006](../../docs/architecture/0006-techo-del-tablero-y-escalones.md) — `Cmax` baja a
  60 y el banco a 256 imágenes; las perillas de dificultad pasan a escalones

ADR pendientes:

1. ~~**DOM contra Canvas**~~ — **resuelta**, ADR-0005
2. **Persistencia de datos de salud** — los Niveles 0 a 2 la evitan por diseño, y la
   sesión 2 con el colaborador confirmó que la primera prueba real **no necesita
   persistencia en absoluto**. Se decide cuando llegue el Nivel 1
3. **Framework de interfaz del panel del terapeuta** — se decide al diseñar el sistema 11.
   ADR-0005 no lo condiciona: el panel siempre iba a ser DOM

## Engine Specialists

<!-- Written by /setup-engine when engine is configured. -->
<!-- Read by /code-review, /architecture-decision, /architecture-review, and team skills -->
<!-- to know which specialist to spawn for engine-specific validation. -->

> **No existe un agente `web-specialist` en esta plantilla.** Hay especialistas de
> Godot, Unity y Unreal, y ninguno aplica a este proyecto. El código se enruta a
> los agentes genéricos de programación.

- **Primary**: `lead-programmer` (arquitectura y revisión de código)
- **Language/Code Specialist**: `lead-programmer` (JavaScript, JSDoc, contratos entre módulos)
- **Accessibility / capa de adaptación de entrada**: `accessibility-specialist`
  — **especialista principal en este proyecto**, no un revisor secundario
- **Shader Specialist**: no aplica
- **UI Specialist**: `ui-programmer`
- **Additional Specialists**: `gameplay-programmer` (lógica de instrumentos),
  `tools-programmer` (manifiesto y banco de imágenes), `ux-designer` (especificaciones UX),
  `qa-tester` (casos de prueba de accesibilidad)
- **Routing Notes**: La capa de adaptación de entrada la revisa siempre
  `accessibility-specialist`, nunca `ui-programmer` en solitario. Cualquier cambio
  en tamaños de objetivo, contraste o modos de activación pasa por
  `accessibility-specialist` antes de cerrarse.

### File Extension Routing

<!-- Skills use this table to select the right specialist per file type. -->
<!-- If a row says [TO BE CONFIGURED], fall back to Primary for that file type. -->

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| `.js` — lógica de instrumento | `gameplay-programmer` |
| `.js` — capa de adaptación de entrada | `accessibility-specialist` |
| `.js` — interfaz y panel del terapeuta | `ui-programmer` |
| `.css` — tema, contraste, tokens de color | `accessibility-specialist` |
| `.html` | `ui-programmer` |
| Manifiesto del banco y herramientas de datos | `tools-programmer` |
| `jsconfig.json`, configuración de tipos | `lead-programmer` |
| Shader / material files | No aplica |
| General architecture review | `lead-programmer` |
