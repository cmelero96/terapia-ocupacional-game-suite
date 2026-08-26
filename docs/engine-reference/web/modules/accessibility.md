# Web Platform — Accessibility Reference

*Last verified: 2026-08-24*

Referencia de la capa que **es** el producto en este proyecto. Consúltala antes
de escribir cualquier código de entrada, de tamaño de objetivo o de color.

Los agentes que deben leer este archivo: `accessibility-specialist` (siempre),
`ui-programmer`, `gameplay-programmer`.

---

## 1. Tamaño del objetivo

El tamaño del objetivo es un **parámetro clínico** en este proyecto, no una
constante de estilo. El terapeuta lo controla. Estos son los suelos, no los
valores de uso.

| Norma | Mínimo | Nota |
|-------|--------|------|
| WCAG 2.2 — 2.5.8 Target Size (Minimum), nivel AA | 24 × 24 px CSS | Suelo absoluto. No bajar nunca de aquí |
| WCAG 2.1 — 2.5.5 Target Size (Enhanced), nivel AAA | 44 × 44 px CSS | Objetivo de referencia para uso general |
| Recomendación para psicomotricidad reducida | 60 px CSS o más | Por encima de AAA. Es donde debería empezar el rango del terapeuta |

**Implementación:** expón el tamaño como una propiedad personalizada de CSS
(`--target-min-size`) y no lo codifiques en ningún sitio más. El separador
entre objetivos escala con el tamaño: objetivos grandes muy juntos producen
activaciones accidentales, que en este producto se registrarían como fallos
falsos.

---

## 2. Contraste

| Norma | Razón mínima | Aplica a |
|-------|--------------|----------|
| WCAG 2.2 — 1.4.3, nivel AA | 4.5:1 | Texto normal |
| WCAG 2.2 — 1.4.6, nivel AAA | 7:1 | Texto normal, objetivo deseable |
| WCAG 2.2 — 1.4.11 | 3:1 | Componentes de interfaz y gráficos |

**Regla del proyecto (del Visual Identity Anchor):** dentro del tablero, todo
elemento debe alcanzar 4.5:1 contra su fondo. Si no lo alcanza, se cambia el
color, no el tamaño.

**Verifícalo, no lo estimes.** La razón de contraste se calcula; no se juzga a
ojo. Escribe una prueba automática sobre los tokens de color en lugar de
revisarlos visualmente.

**WCAG 2.2 — 1.4.1 Use of Color:** el color nunca puede ser la única señal.
Todo debe funcionar en escala de grises. En una tarea de búsqueda visual esto
es doblemente importante: si el objetivo se distingue solo por color, no estás
midiendo búsqueda visual, estás midiendo visión del color.

---

## 3. Modos de activación

El proyecto debe soportar cuatro modos con un solo código. Ninguno puede
depender del arrastre ni del `hover`.

| Modo | API | Notas |
|------|-----|-------|
| **Táctil y ratón** | Pointer Events (`pointerdown`, `pointerup`) | Usa Pointer Events, no Mouse Events ni Touch Events. Unifica los dos y da `pointerType`, `width`, `height` y `pressure` |
| **Teclado** | `focus`, `keydown` (Enter y Espacio) | Cada objetivo debe ser enfocable y tener un indicador de foco visible que cumpla WCAG 2.2 — 2.4.11 Focus Not Obscured |
| **Activación por permanencia (dwell)** | `pointerover` más un temporizador propio | No hay API estándar. Se implementa a mano. El tiempo de permanencia debe ser configurable (rango habitual: 500 a 2000 ms) y debe mostrar un progreso visible mientras cuenta |
| **Pulsador (switch) por barrido** | `keydown` de una sola tecla, más un escáner propio | No hay API estándar. Un pulsador se presenta al navegador como una tecla. El escáner recorre los objetivos por turnos y el pulsador confirma. La velocidad de barrido debe ser configurable |

### Reglas de implementación

- **Nunca `hover` como requisito.** `hover` no existe en táctil ni con
  pulsador. Se puede usar como refuerzo, nunca como única vía.
- **Nunca arrastre como única vía.** WCAG 2.2 — 2.5.7 Dragging Movements
  exige una alternativa sin arrastre. En este proyecto el arrastre está
  descartado por completo: cualquier instrumento que lo necesite se
  implementa con dos toques (seleccionar, después destino).
- **`pointercancel` importa.** En táctil el navegador puede cancelar un
  puntero (gesto de desplazamiento, llamada entrante). Trátalo como "no ha
  pasado nada", nunca como fallo del paciente.
- **Desactiva los gestos del navegador** dentro del tablero:
  `touch-action: none` evita que un desplazamiento accidental se coma un
  toque. Sin esto, un paciente con temblor no puede usar la aplicación.
- **Un solo punto de activación.** Ningún gesto de dos dedos, ningún
  pellizco, ninguna pulsación larga como requisito.

---

## 4. Movimiento y estímulo

| Norma | Regla |
|-------|-------|
| WCAG 2.2 — 2.3.3 Animation from Interactions | Respeta `prefers-reduced-motion`. No es opcional |
| WCAG 2.2 — 2.3.1 Three Flashes | Nada que destelle más de tres veces por segundo |
| WCAG 2.2 — 2.2.1 Timing Adjustable | Cualquier límite de tiempo debe poder ajustarse o desactivarse |

La última fila coincide con el anti-pilar 2 del proyecto: sin presión de tiempo
por defecto. El cronómetro es una perilla que el terapeuta activa.

```css
@media (prefers-reduced-motion: reduce) {
  /* Sin animación de recorrido. La confirmación del acierto sigue siendo
     visible, pero instantánea en lugar de animada. */
}
```

---

## 5. ARIA y estructura

- **Prefiere HTML nativo antes que ARIA.** Un `<button>` trae foco, teclado y
  rol sin escribir nada. La primera regla de ARIA es no usar ARIA si hay un
  elemento nativo que sirve.
- Si el área de juego se implementa en **Canvas**, nada de lo anterior es
  gratis: el foco, el rol y el nombre accesible hay que construirlos a mano.
  Este es el argumento principal a favor del DOM en la ADR pendiente.
- **Anuncios de estado:** usa `aria-live="polite"` para confirmar un acierto.
  Nunca `assertive`: interrumpe y agobia.
- **Nunca anuncies un fallo.** Contradice el pilar 2 del proyecto. Un lector
  de pantalla que dice "incorrecto" es exactamente el castigo que el diseño
  prohíbe.

---

## 6. Lista de verificación antes de cerrar cualquier historia de interfaz

- [ ] Todo objetivo alcanza al menos 24 × 24 px CSS, y el rango del terapeuta empieza por encima de 44
- [ ] Todo elemento del tablero alcanza 4.5:1 de contraste contra su fondo, comprobado por cálculo
- [ ] Todo funciona en escala de grises
- [ ] Todo objetivo es alcanzable y activable solo con teclado
- [ ] El indicador de foco es visible y no queda tapado
- [ ] Nada depende de `hover`, de arrastre ni de gestos con más de un punto
- [ ] `touch-action: none` está aplicado en el área de juego
- [ ] `prefers-reduced-motion` está respetado
- [ ] Ningún límite de tiempo está activo por defecto
- [ ] Ningún fallo se anuncia ni se marca, en lo visual ni en el lector de pantalla
- [ ] `pointercancel` se trata como "no ha pasado nada", no como fallo

---

## Fuentes

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Understanding WCAG 2.2 — Target Size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- Pointer Events Level 3: https://www.w3.org/TR/pointerevents3/
- MDN Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
