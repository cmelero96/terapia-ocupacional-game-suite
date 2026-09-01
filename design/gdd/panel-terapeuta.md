# Frontera de modo y panel del terapeuta

> **Status**: In Design
> **Author**: Carlos + `ux-designer`, `ui-programmer`
> **Last Updated**: 2026-08-26
> **Sistema**: #11 del índice · UI · MVP · capa Presentation · esfuerzo **M**
> **Implements Pillar**: **1 — treinta segundos para el terapeuta.** Este sistema es donde
> ese pilar se cumple o se incumple

## Overview

Dos modos, una frontera dura. **El modo paciente y el modo terapeuta no comparten pantalla**,
y el paso de uno a otro es explícito y visible.

Y es el sumidero de la interfaz: seis sistemas le dejaron aquí un requisito por escrito.

| De | Requisito heredado |
|---|---|
| 4 | Las cuatro perillas **agrupadas por eje**, no en lista plana |
| 4 | Aviso al bajar `t` de 44 px: la medición del eje perceptivo queda acoplada |
| 4 | Un rango degenerado y uno abierto **se distinguen a la vista** |
| 5 | La configuración de **acceso** vive separada de la de **ejercicio** |
| 5 | Al activar el barrido, decir qué `msPorPaso` sale con el `C` actual |
| 5 | Los cinco modos se pueden **probar en el panel**, sin paciente delante |
| 6 | Si `prefers-reduced-motion` está activo, el interruptor lo dice y **no se puede apagar** |
| 7 | El interruptor de silencio, **deshabilitado con nota** de que no hay audio |
| 8 | Si `svEfectiva` difiere de la pedida, decirlo |
| 15 | El conflicto B1 + B7, **antes** de que el paciente esté delante |

## Player Fantasy

**Del terapeuta: treinta segundos.** Si configurar un ejercicio tarda más que sacar unas
tarjetas de un cajón, el producto no se usa. Es el pilar 1, y es una medida, no una
aspiración.

**Del paciente: no ver el panel nunca.** La frontera existe para eso.

## Detailed Rules

### Core Rules

1. **La frontera es un panel modal OPACO que cubre el tablero y pausa la sesión.**

   No es una barra lateral, ni un cajón, ni una superposición semitransparente. Mientras el
   panel está abierto, el paciente **no ve el tablero**: si lo viera, seguiría intentando
   resolverlo mientras el terapeuta cambia la configuración, y esos intentos entrarían al
   registro bajo una configuración que ya no es la que se estaba usando.

   Al cerrarse, **la sesión continúa con el tablero siguiente**, no con el que estaba a
   medias. Un tablero cuya configuración cambió a mitad no es un dato interpretable.
2. **Abrir el panel exige una acción deliberada, y no una que un paciente haga por accidente.**

   El disparador es un botón fuera del tablero, en una esquina, con tamaño de objetivo
   normal. **No** una pulsación larga, ni un gesto, ni una esquina invisible: eso violaría la
   regla de un solo punto de activación del sistema 5, y además haría el panel inalcanzable
   para un terapeuta que use pulsador.

   > **Decisión declarada, y con la que no estoy del todo cómodo:** un botón visible es
   > alcanzable por el paciente. La alternativa —un gesto— es peor por accesibilidad. Se
   > queda el botón, y **el riesgo se observa en la primera prueba real**: si un paciente lo
   > pulsa, la respuesta es moverlo, no esconderlo tras un gesto.
3. **Dos grupos de configuración, en pestañas separadas y rotuladas por a quién pertenecen.**

   | Grupo | Cambia | Frecuencia |
   |---|---|---|
   | **Acceso** — del paciente | Modo de entrada, cadencia, permanencia, estímulo reducido | Casi nunca |
   | **Ejercicio** — de la sesión | `t`, `C`, `sv`, `ss` | Cada sesión |

   Si están en la misma pantalla, alguien cambiará el modo de acceso creyendo que ajusta la
   dificultad. La separación la pidieron el sistema 4 y el 5 por separado.
4. **Las cuatro perillas del ejercicio van agrupadas por EJE, con los dos grupos separados
   visualmente.**

   Presentarlas como una lista plana de cuatro controles hace que el terapeuta no descubra
   que son dos ejes independientes, y la capacidad que el pilar 3 le da se queda sin usar.
5. **Ninguna configuración inválida se puede aplicar.** El botón de aplicar está
   deshabilitado mientras haya un conflicto, y **el conflicto se nombra**.

   Los cuatro conflictos que este panel debe detectar:

   | Conflicto | Mensaje |
   |---|---|
   | `C` y `t` no caben | *"Con 100 objetos de 140 px hacen falta 1627 px y hay 1280. Baja la cantidad o el tamaño."* |
   | `C` mayor que el banco | *"El banco tiene 32 objetos activos: no se pueden poner 100."* |
   | Barrido con `C` alto | *"Con 40 objetos el barrido tarda 16 s por vuelta, no los 12 configurados."* |
   | B1 + B7 | *"Este perfil pide objetivos de 60 px y como máximo 30 objetos. Compruébalo antes de empezar."* |
6. **Aplicar surte efecto en el tablero siguiente, y el panel lo dice.**

   La revisión del sistema 2 identificó esto como su hallazgo mejor razonado y lo dejó aquí:
   **si los cambios surten efecto en el tablero siguiente, el propio botón de aplicar ES la
   confirmación.** No hace falta un diálogo de "¿seguro?" encima. Un segundo paso de
   confirmación en un flujo que debe durar treinta segundos es exactamente lo que lo rompe.
7. **El panel muestra el progreso de la sesión. La pantalla del paciente NO.**

   Fue uno de los cuatro defectos que la revisión del prototipo encontró: el contador estaba
   en la pantalla del paciente. Aquí es donde pertenece.
8. **Los cinco modos de acceso se pueden probar dentro del panel.** Un área de prueba con
   tres objetivos falsos, que responde igual que el tablero real.

   Configurar un pulsador a ciegas y descubrir en la sesión que no responde es el peor
   momento posible para enterarse.

### Qué NO es de este sistema

| No es de aquí | De quién es |
|---|---|
| Los valores y sus límites | Sistema 4 |
| Qué modo de acceso existe | Sistema 5 |
| Guardar la configuración con nombre | Sistema 16, presets. **Fuera del primer hito** |
| Mostrar los resultados de la sesión | Sistema 12 |
| Qué configuración le va a qué paciente | Sistema 15, y **no sugiere nada** mientras siga sin validar |

## Formulas

### F1 — `conflictos(config, acceso, banco, anchoDisponible)`

> Excepción declarada: el dominio es una lista de comprobaciones, no una relación numérica.

```
conflictos = [
  si  disposicion(C, t).anchoNecesario > anchoDisponible   →  'noCabe'
  si  C - 1 > |banco activo| - 1                           →  'bancoInsuficiente'
  si  acceso.barrido ∧ cadenciaBarrido(C, msVuelta).recortado  →  'barridoRecortado'
  si  acceso.limitaciones ⊇ {B1, B7} ∧ (t < 60 ∨ C > 30)   →  'perfilTenso'
]
aplicable = conflictos está vacío
```

| Código | Bloquea aplicar | Por qué |
|---|---|---|
| `noCabe` | **Sí** | El tablero no se puede pintar |
| `bancoInsuficiente` | **Sí** | El generador lo rechazaría |
| `barridoRecortado` | **No, avisa** | Es una degradación declarada, no un error |
| `perfilTenso` | **No, avisa** | El terapeuta manda |

**Dos bloquean y dos avisan, y la distinción importa:** bloquear algo que el terapeuta
tiene derecho a hacer es peor que avisarle. Solo se bloquea lo que **físicamente no
funciona**.

### F2 — `avisos(config)`: lo que hay que decir sin bloquear

| Condición | Aviso |
|---|---|
| `t < 44` | *"Por debajo de 44 px, el error de gesto y el de búsqueda no se pueden separar en la medición."* |
| `prefersReducedMotion` | *"Tu sistema pide movimiento reducido: el interruptor no se puede apagar."* |
| `svEfectiva ≠ svPedida` en el último tablero | *"El banco no da para la similitud visual pedida: el paciente vio 0,36 en lugar de 0,80."* |
| Rango degenerado | *"Valor fijo"* frente a *"Rango 44–100, política fija: se usa 44."* |

## Edge Cases

- **Si se abre el panel a mitad de tablero**: la sesión se pausa, el tablero **se descarta**
  y sus intentos parciales se conservan marcados como incompletos. Un tablero interrumpido
  es un dato; un tablero cuya configuración cambió a mitad no lo es.
- **Si se cierra el panel sin aplicar**: nada cambia, y la sesión sigue con un tablero nuevo
  bajo la configuración anterior.
- **Si el paciente pulsa el botón del panel**: se abre. **No hay protección**, y es una
  decisión declarada, no un olvido. Ver la regla 2.
- **Si la configuración guardada ya no es válida** —el banco se redujo entre sesiones—: el
  panel abre mostrando el conflicto y **sin permitir empezar** hasta resolverlo.
- **Si `prefers-reduced-motion` cambia con el panel abierto**: el interruptor se actualiza y
  se explica. No hay estado intermedio silencioso.

## Dependencies

**De entrada:** 2, 4, 5, 6, 7, 8, 10 — todas duras. Y 9 para el progreso de la sesión.

**Dependen de este:** 12, **los nueve instrumentos** —10, 21, 24, y los seis documentados el
2026-09-01: 22, 23, 28, 29, 30 y 31—, y el 16 cuando llegue.

**Y el 32, que le añadió un control.** El eje de contenido aparece en el panel **sólo** en los
instrumentos que declaran variantes, que hoy es uno: el tres en raya. Un control desactivado
en los otros ocho le diría al terapeuta que hay algo que configurar cuando no lo hay.

Los seis instrumentos nuevos añadieron además dos avisos que no existían, los dos del pilar 3:
que el contenido puede servir **menos opciones de las pedidas** —rellenar da 4 aunque se pidan
6, medido en 300 de 300 rondas— y que en los instrumentos sin banco **el eje perceptivo no
mide progreso**, porque su rango accesible es de 2,1 puntos sobre 100.

## Tuning Knobs

**Ninguna propia.** Todas las que muestra son de los sistemas 4 y 5.

| Perilla de proyecto | Valor | Nota |
|---|---|---|
| `objetivoSegundos` | **30** | El pilar 1 hecho número. Se mide, no se estima |

## Visual/Audio Requirements

| Elemento | Requisito |
|---|---|
| Panel | **Opaco**, cubre el tablero por completo. Ámbito `.frame-root` |
| Frontera | El panel usa tokens del **marco**, nunca del tablero. Son contenedores hermanos y no se anidan |
| Botón de apertura | Fuera del tablero, tamaño de objetivo normal, siempre visible |
| Grupos de eje | Separados por un separador visible con rótulo, no solo por espacio |
| Conflictos | Texto, no solo color. Un icono de aviso **más** la frase |
| Audio | Ninguno |

**Y el requisito que se rompe primero:** los mensajes de conflicto **no pueden depender del
color**. Un terapeuta con daltonismo tiene que poder distinguir bloqueo de aviso, y la
distinción es de palabra, no de tono.

## UI Requirements

1. **El panel abre en la pestaña de ejercicio**, no en la de acceso. Es la que se toca cada
   sesión.
2. **Los valores actuales son visibles sin desplegar nada.** Si hay que abrir un menú para
   ver a qué está `t`, el flujo de treinta segundos ya se rompió.
3. **El área de prueba de modos no registra nada.** Es una prueba, no una sesión.

## Acceptance Criteria

**AC-1 — El panel es opaco y cubre el tablero** · Integration (Playwright) · **BLOCKING**
**DADO** el panel abierto,
**ENTONCES** ningún elemento con `role="button"` del tablero es visible ni alcanzable por
teclado, y el fondo del panel tiene **opacidad total**.

**AC-2 — La sesión se pausa con el panel abierto** · Integration (Playwright) · **BLOCKING**
**DADO** el panel abierto,
**CUANDO** se intenta activar un objetivo del tablero por teclado o por puntero,
**ENTONCES** **no se registra ningún intento**.

**AC-3 — Aplicar surte efecto en el tablero siguiente, sin diálogo de confirmación** · Integration (Playwright) · **BLOCKING**
**DADO** un cambio de `t` de 60 a 100,
**CUANDO** se pulsa aplicar,
**ENTONCES** el panel se cierra, **no aparece ningún diálogo de confirmación**, y el tablero
nuevo tiene objetos de 100 px.

**AC-4 — Las cuatro perillas están agrupadas por eje** · Integration (Playwright) · **BLOCKING**
**DADO** la pestaña de ejercicio,
**ENTONCES** `t` está en un grupo rotulado como motor, y `C`, `sv` y `ss` en otro rotulado
como perceptivo, y los dos grupos son elementos distintos con nombre accesible.

**AC-5 — Canario de F1: los cuatro conflictos** · Unit · **BLOCKING**
**DADO** las cuatro condiciones de F1,
**ENTONCES** se detectan las cuatro, y **solo `noCabe` y `bancoInsuficiente` bloquean**
aplicar.

**AC-6 — Una configuración inválida no se puede aplicar** · Integration (Playwright) · **BLOCKING**
**DADO** `C = 100` con el banco de 32,
**ENTONCES** el botón de aplicar está deshabilitado y el mensaje **nombra el número real de
objetos del banco**.

**AC-7 — El aviso de `t < 44` aparece y NO bloquea** · Integration (Playwright) · **BLOCKING**
**DADO** `t = 32`,
**ENTONCES** aparece el aviso de ejes acoplados **y el botón de aplicar sigue habilitado**.
*El terapeuta manda: hay casos en que entrenar precisión fina es el objetivo.*

**AC-8 — Los mensajes no dependen del color** · Integration (Playwright) · **BLOCKING**
**DADO** un bloqueo y un aviso simultáneos,
**CUANDO** se leen sus contenidos de texto,
**ENTONCES** cada uno dice **con palabras** si impide continuar o no.

**AC-9 — El progreso está en el panel y NO en la pantalla del paciente** · Integration (Playwright) · **BLOCKING**
**DADO** una sesión con tres tableros resueltos,
**ENTONCES** el número aparece en el panel, y **ningún elemento fuera del panel contiene un
contador de progreso**.
*Fue uno de los cuatro defectos de la revisión del prototipo.*

**AC-10 — Treinta segundos, MEDIDO** · Integration (Playwright) · **BLOCKING**
**DADO** el flujo completo: abrir el panel, cambiar las cuatro perillas del ejercicio,
aplicar, y ver el tablero nuevo,
**CUANDO** se mide con el reloj monótono,
**ENTONCES** el tiempo de **interacción del software** —sin el tiempo de decisión humana—
se publica en el informe.
*El pilar 1 son 30 s para una persona. Un test mide el coste del software; el resto se mide
con el colaborador y un cronómetro. **Este criterio no puede sustituir esa medición**, y
decirlo es parte del criterio.*

**AC-11 — El interruptor de estímulo reducido no se puede apagar si el sistema lo pide** · Integration (Playwright) · **BLOCKING**
**DADO** `prefers-reduced-motion: reduce` emulado,
**ENTONCES** el interruptor está marcado, **deshabilitado**, y con una explicación visible.

**AC-12 — El área de prueba de modos no registra nada** · Unit · **BLOCKING**
**DADO** activaciones en el área de prueba,
**ENTONCES** el registro de la sesión no gana ningún intento.

## Open Questions

| Pregunta | Quién | Cuándo |
|---|---|---|
| ¿El paciente llega a pulsar el botón del panel? | Observación, primera prueba real | Si ocurre, se mueve. **No se esconde tras un gesto** |
| ¿Treinta segundos se cumplen con una persona? | El colaborador y un cronómetro | Tres intentos, y se apunta el número |
| ¿Hace falta un modo de pantalla completa? | El colaborador | Una tableta con barra de navegación pierde altura útil |
