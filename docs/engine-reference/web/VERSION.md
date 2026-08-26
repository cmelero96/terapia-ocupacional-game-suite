# Web Platform — Version Reference

| Field | Value |
|-------|-------|
| **Engine** | Ninguno — plataforma web, sin motor de juego |
| **Language** | JavaScript (módulos ES), tipado con JSDoc |
| **Type checking** | `npx tsc --checkJs --noEmit` |
| **Build step** | Ninguno |
| **Project Pinned** | 2026-08-24 |
| **Last Docs Verified** | 2026-08-24 |
| **LLM Knowledge Cutoff** | January 2026 |
| **Risk Level** | **LOW** — la plataforma web relevante está dentro de los datos de entrenamiento |

## Por qué el riesgo es bajo

Esta skill existe para cubrir la brecha entre lo que el modelo sabe y la versión
del motor. Aquí no hay motor, así que se evalúa el equivalente:

| Área | Estado | Riesgo |
|------|--------|--------|
| JavaScript / ES2024, módulos ES | Cubierto y estable | BAJO |
| WCAG 2.2 (octubre 2023) | Cubierto | BAJO |
| ARIA, Pointer Events, Web Speech API | Cubierto y estable | BAJO |
| Patrones de activación por permanencia y barrido por pulsador | Nicho, no nuevo. Poca documentación estándar, pero no hay información posterior al corte que falte | MEDIO |

Por eso **no** se crean `breaking-changes.md`, `deprecated-apis.md` ni
`current-best-practices.md`: para la plataforma web no hay una versión que
rompa, y esos archivos añadirían coste de contexto sin valor.

Se crea **un solo módulo**: `modules/accessibility.md`. La accesibilidad no es
un detalle en este proyecto, es el producto.

## Decisiones aplazadas a una ADR

Estas no se deciden aquí. Están registradas como preguntas abiertas en
`design/gdd/game-concept.md`.

| Decisión | Por qué importa |
|----------|-----------------|
| **DOM contra Canvas** para el área de juego | Afecta al coste del port a móvil y a cómo se implementa la accesibilidad. El DOM da ARIA y foco de teclado gratis; el Canvas obliga a construirlos a mano |
| **Persistencia de datos de salud** | Los datos de progreso del paciente son categoría especial en el RGPD. Los Niveles 0 a 2 los evitan por diseño (anti-pilar 4). El Nivel 3 los asume de forma explícita |
| **Framework de interfaz para el panel del terapeuta** | El Nivel 0 no tiene panel. Se decide cuando llegue el Nivel 1 |

## Fuentes verificadas

- MDN Web Docs: https://developer.mozilla.org/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- Pointer Events: https://www.w3.org/TR/pointerevents3/

## Cómo actualizar

Ejecuta `/setup-engine refresh` si aparece una versión nueva de WCAG o si un
patrón de accesibilidad relevante cambia.
