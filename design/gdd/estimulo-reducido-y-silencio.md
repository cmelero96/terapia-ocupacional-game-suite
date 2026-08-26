# Modo de estímulo reducido, y silencio

> **Status**: In Design
> **Author**: Carlos + `accessibility-specialist`
> **Last Updated**: 2026-08-26
> **Sistemas**: **#6** (estímulo reducido) y **#7** (silencio y volumen) del índice ·
> Adaptación · MVP · esfuerzo **S** los dos
> **Implements Pillar**: Refuerza el 2 y el anti-pilar 3

Un solo documento para los dos sistemas, porque la tabla de orden de diseño del propio
proyecto ya los trata como un item, y porque el segundo resulta ser mucho más pequeño de lo
que su ficha sugería.

## Overview

**Obligatorios en el primer hito**, y no lo eran hasta el 2026-08-26: el colaborador
confirmó que **sí hay pacientes con sensibilidad sensorial**. Antes eran sistemas
aplazables; ahora son requisito.

| Sistema | Qué hace |
|---|---|
| **6** · Estímulo reducido | Quita todo movimiento y todo elemento visual que no sea el tablero |
| **7** · Silencio y volumen | **El silencio es el valor por defecto.** Y eso deja al sistema casi sin trabajo |

## Player Fantasy

**Del paciente: que la pantalla no le agreda.** Para una persona con hipersensibilidad
sensorial, una animación de acuse de recibo no es "un detalle agradable": es un estímulo que
no ha pedido y del que no puede escapar mientras dura la sesión.

**Del terapeuta: un solo interruptor.** No cinco casillas. Si reducir el estímulo exige
entender qué es una transición y qué un realce, el terapeuta no lo va a usar.

## Detailed Rules

### Sistema 6 — estímulo reducido

1. **Es un interruptor, no un panel.** Una perilla booleana de paciente, `estimuloReducido`.
   Nada de casillas por efecto.
2. **Qué desaparece al activarlo:**

   | Elemento | En modo normal | En modo reducido |
   |---|---|---|
   | Movimiento de cualquier tipo | Transiciones cortas | **Ninguno.** Los cambios son instantáneos |
   | Acuse de recibo de activación | Realce breve | **Realce estático**, sin transición. **No desaparece** |
   | Progreso de permanencia | Anillo que crece | **Escalonado**, en pasos discretos |
   | Cursor de barrido | Indicador de foco | **Igual.** Es información, no decoración |
   | Elementos decorativos del marco | Los que haya | Ninguno |

3. **El acuse de recibo NO se puede quitar.** Es la única regla dura de este sistema.

   El presupuesto de menos de 100 ms existe porque un acuse tardío se percibe como *"no me
   ha hecho caso"*. Quitarlo entero es peor que hacerlo lento. Así que en modo reducido el
   acuse **pierde el movimiento y conserva la existencia**.
4. **Este modo NO define tokens de color propios.** El sistema 2 cerró esa ambigüedad por
   escrito, y no se reabre: un cuarto conjunto de tokens habría traído toda una rama de
   infraestructura para nada. Los colores son los mismos; lo que cambia es el movimiento.
5. **`prefers-reduced-motion` del sistema operativo activa este modo, y no lo desactiva.**

   Si el usuario ha pedido movimiento reducido a su sistema, el modo se enciende sin que
   nadie lo configure. Pero **el interruptor del terapeuta puede encenderlo aunque el sistema
   operativo no lo pida**, y no puede apagarlo cuando el sistema operativo sí lo pide.

   ```
   estimuloReducidoEfectivo = perillaTerapeuta OR prefersReducedMotion
   ```

   Es un OR y no una asignación a propósito. Una entrada del entorno **puede endurecer** una
   garantía de accesibilidad; nunca puede relajarla. Es el modo de fallo característico del
   proyecto — una entrada del entorno moviendo un parámetro clínico — resuelto en la
   dirección segura por construcción.

### Sistema 7 — silencio y volumen

6. **El silencio es el valor por defecto, y ningún instrumento del primer hito emite
   sonido.**

   > **Y aquí este sistema se queda casi sin contenido, y hay que decirlo en voz alta.**
   >
   > Su ficha del índice sugería un subsistema de audio con control de volumen. Pero el
   > anti-pilar 3 prohíbe la gamificación extrínseca, el pilar 2 prohíbe anunciar un fallo, y
   > con sensibilidad sensorial confirmada el silencio pasa de opción a valor por defecto. El
   > resultado es que **no hay ningún sonido que controlar.**
   >
   > Lo que queda es un **contrato reservado**, exactamente como el sistema 2 reservó dos
   > tokens de color para el sistema 5: si algún día un instrumento necesita audio, ya está
   > escrito bajo qué condiciones.

7. **Condiciones para que un instrumento futuro emita sonido**, las cuatro a la vez:

   | # | Condición |
   |---|---|
   | 1 | El sonido es **información**, no recompensa ni celebración |
   | 2 | Está **apagado por defecto**, y el terapeuta lo enciende por paciente |
   | 3 | **Nunca** indica acierto ni fallo. El pilar 2 no se negocia |
   | 4 | Existe una **alternativa visual equivalente**, porque el sonido no puede ser la única vía |

   Un sonido que no cumpla las cuatro no entra, y **el sistema 14 lo vigila**: hoy no debe
   existir ninguna API de audio en `src/`.

8. **`estimuloReducido` implica silencio**, no al revés. Reducir el estímulo apaga cualquier
   audio que existiera; silenciar no quita el movimiento.

### Qué NO es de estos sistemas

| No es de aquí | De quién es |
|---|---|
| Los tokens de color | Sistema 2. **Cerrado, no movido** |
| Qué se anuncia por lector de pantalla | Sistemas 10 y 11 |
| El aspecto del acuse de recibo | Sistema 10 |
| Qué paciente necesita esto | Sistema 15, B4 |

## Formulas

### F1 — `estimuloReducidoEfectivo`

```
estimuloReducidoEfectivo = perillaTerapeuta OR prefersReducedMotion
```

| Variable | Tipo | Origen |
|---|---|---|
| `perillaTerapeuta` | bool | Perilla clínica, de paciente |
| `prefersReducedMotion` | bool | Consulta de medios del sistema operativo |
| salida | bool | |

**Tabla de verdad completa, porque el asimetría es el punto:**

| Perilla | Sistema operativo | Efectivo | Lectura |
|---|---|---|---|
| `false` | `false` | **`false`** | Nadie lo pidió |
| `false` | `true` | **`true`** | El sistema operativo lo endurece |
| `true` | `false` | **`true`** | El terapeuta lo pide para este paciente |
| `true` | `true` | **`true`** | Los dos |

**No existe la combinación que lo apaga.** Un `AND`, o una asignación desde el sistema
operativo, habrían permitido que una preferencia del entorno **relajara** una garantía de
accesibilidad. Con `OR`, eso es imposible por construcción.

### F2 — `hayAudioPermitido(instrumento)`

```
hayAudioPermitido = informativo ∧ apagadoPorDefecto ∧ noIndicaResultado ∧ tieneAlternativaVisual
```

Las cuatro, y en el primer hito **ninguna instancia la cumple porque no hay audio**. La
fórmula existe para que la respuesta esté escrita antes de que alguien pregunte.

## Edge Cases

- **Si el sistema operativo cambia `prefers-reduced-motion` a mitad de sesión**: el modo se
  recalcula y se aplica **en el tablero siguiente**, no a mitad de uno. Cambiar la
  presentación mientras el paciente está buscando es un estímulo en sí mismo.
- **Si el modo reducido se activa con una permanencia en curso**: el progreso pasa a
  escalonado sin reiniciar la cuenta. La cuenta es del sistema 5 y no la toca esto.
- **Si un instrumento no tiene nada que reducir**: el modo no hace nada visible, y eso es
  correcto. No hay estado de error.
- **Si el terapeuta apaga la perilla con `prefers-reduced-motion` activo**: el modo **sigue
  activo**. Y el panel lo dice, para que el terapeuta no crea que el control está roto.

## Dependencies

**De entrada:** 2 (dura, los tokens existentes), 5 (dura, el progreso de permanencia).

**Dependen de estos:** 10, 11, 21, 24 y 14.

**Consistencia bidireccional:** el índice declara que 6 depende de 2 y 5, y que 7 depende
del 6. Coincide. Y **el 14 gana una barrera nueva**: ninguna API de audio en `src/`.

## Tuning Knobs

| Perilla | Tipo | Por defecto | Ámbito |
|---|---|---|---|
| `estimuloReducido` | bool | **`false`** | Paciente |
| `silencio` | bool | **`true`** | Paciente. Y hoy no hay nada que silenciar |

**`silencio` por defecto en `true` es la decisión.** Con sensibilidad sensorial confirmada,
el silencio no es una opción que se activa: es el estado del que se sale a propósito.

## Visual/Audio Requirements

Ver la tabla de la regla 2. Y un requisito negativo que es el más importante de los dos
sistemas: **en modo reducido no queda ni una transición, ni un desvanecimiento, ni un
desplazamiento.** Instantáneo significa instantáneo.

## UI Requirements

Para el sistema 11:

1. **Un interruptor, junto a la configuración de acceso**, porque es de paciente y no de
   ejercicio.
2. **Si `prefers-reduced-motion` está activo, el interruptor lo muestra y explica que no se
   puede apagar.** Un control que parece apagado y no lo está es peor que no tenerlo.
3. **El interruptor de silencio se muestra deshabilitado con la nota "no hay audio en esta
   versión".** Ocultarlo haría que su reaparición futura pareciera una función nueva en lugar
   de una reserva cumplida.

## Acceptance Criteria

**AC-1 — Canario de F1: la tabla de verdad completa** · Unit · **BLOCKING**
**DADO** las cuatro combinaciones de `perillaTerapeuta` y `prefersReducedMotion`,
**ENTONCES** el resultado es **`false`, `true`, `true`, `true`**.

**AC-2 — El sistema operativo no puede APAGAR el modo** · Unit · **BLOCKING**
**DADO** `prefersReducedMotion = true` y `perillaTerapeuta = false`,
**ENTONCES** el modo efectivo es **`true`**.
*Una entrada del entorno puede endurecer una garantía de accesibilidad; nunca relajarla. Con
un `AND` o una asignación, este criterio fallaría.*

**AC-3 — En modo reducido no queda ninguna transición** · Integration (Playwright) · **BLOCKING**
**DADO** el tablero con el modo activo,
**CUANDO** se leen los estilos calculados de todos los elementos del tablero,
**ENTONCES** `transition-duration` y `animation-duration` son **`0s`** en todos.

**AC-4 — El acuse de recibo SIGUE EXISTIENDO en modo reducido** · Integration (Playwright) · **BLOCKING**
**DADO** una activación con el modo activo,
**ENTONCES** hay un cambio visual observable, y **no tiene transición**.
*Es la única regla dura del sistema 6: quitar el acuse entero es peor que hacerlo lento.*

**AC-5 — El modo reducido no introduce ningún token de color nuevo** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el registro de tokens del sistema 2,
**CUANDO** se compara con y sin el modo activo,
**ENTONCES** el conjunto de tokens es **idéntico**.
*El sistema 2 cerró esta ambigüedad y no se reabre.*

**AC-6 — No existe ninguna API de audio en `src/`** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de `src/`,
**CUANDO** se busca `AudioContext`, `new Audio(`, `.play()`, `HTMLAudioElement` y
`speechSynthesis`,
**ENTONCES** no aparece ninguno.
*Barrera nueva. El día que un instrumento necesite audio, este criterio se relaja **a la vez**
que se documenta el cumplimiento de las cuatro condiciones de F2, y no antes.*

**AC-7 — El cambio de `prefers-reduced-motion` se aplica en el tablero siguiente** · Integration (Playwright) · **BLOCKING**
**DADO** un tablero en curso y un cambio de la consulta de medios,
**ENTONCES** el tablero actual **no cambia de aspecto**, y el siguiente sí.
*Cambiar la presentación mientras el paciente busca es un estímulo en sí mismo.*

## Open Questions

| Pregunta | Quién | Cuándo |
|---|---|---|
| ¿Hay pacientes que necesiten lo contrario — más realce, no menos? | El colaborador | Si sí, es una perilla nueva, no la inversa de esta |
| ¿El silencio total desorienta a alguien? | Observación en uso | Es la razón por la que el contrato de audio queda reservado en lugar de prohibido para siempre |
