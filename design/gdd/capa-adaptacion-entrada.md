# Capa de adaptación de entrada

> **Status**: In Design
> **Author**: Carlos + `accessibility-specialist` (principal), `ux-designer`
> **Last Updated**: 2026-08-26
> **Sistema**: #5 del índice · Adaptación · MVP · capa Core · esfuerzo **L**
> **Implements Pillar**: Ninguno directamente. Es lo que hace que **exista** el producto
> para la mitad de su población

## Overview

Cinco vías de acceso —táctil, ratón, teclado, pulsador por barrido y activación por
permanencia— **colapsan en un único evento**. Ningún instrumento sabe nunca cómo se activó
un objetivo.

```
táctil ─┐
ratón ──┤
teclado ┼──▶  capa de adaptación  ──▶  { idObjetivo, tActivacion }  ──▶  instrumento
pulsador┤
dwell ──┘
```

**El punto de colapso es donde la accesibilidad se gana o se pierde.** Si un instrumento
llega a ramificar por modo de entrada, la abstracción ha fallado y cada instrumento nuevo
paga el coste de las cinco vías otra vez. Con diez instrumentos previstos, eso es la
diferencia entre un producto y cuatro prototipos.

Este sistema es de esfuerzo **L** y es el más grande del MVP. También es el que decide si
el producto sirve: un paciente que no puede activar un objetivo no tiene producto, tenga el
banco de imágenes que tenga.

## Player Fantasy

**Del paciente, y es la única fantasía del producto que le pertenece a él:** *"esto
responde a mí"*.

No "puedo jugar a pesar de mi limitación". No hay versión adaptada ni modo especial: hay un
instrumento, y el instrumento se ajusta a la vía de acceso que la persona ya usa. Un
paciente que maneja el mundo con un pulsador de barbilla no debería percibir que está usando
una función de accesibilidad, igual que nadie percibe que usar el ratón sea una.

La sensación concreta que hay que proteger es **el acuse de recibo**. Menos de 100 ms entre
la activación y algo visible. Por encima de eso el paciente no piensa "va lento": piensa
*"no me ha hecho caso"*, prueba otra vez, y el registro anota dos intentos donde hubo uno.

**Del terapeuta:** *"lo configuro una vez y no lo vuelvo a tocar"*. El modo de acceso de un
paciente cambia poco; el ejercicio cambia cada sesión. Los dos ajustes no pueden vivir en el
mismo sitio.

## Detailed Rules

### Core Rules

1. **Un solo tipo de evento sale de esta capa.**

   ```
   EventoActivacion = { idObjetivo, tActivacion, modo }
   ```

   `modo` viaja **solo para el registro**, nunca para ramificar comportamiento. Un
   instrumento que lo lea para decidir qué hacer está roto, y el sistema 14 lo vigila.
2. **Ninguna interacción depende del arrastre, del `hover` ni de más de un punto de
   activación.** WCAG 2.2 — 2.5.7 exige una alternativa al arrastre; aquí el arrastre
   **no existe**. Donde un instrumento necesite origen y destino, son dos activaciones
   independientes: seleccionar, después destino.
3. **La activación ocurre al SOLTAR, sobre el mismo objetivo, y se puede abortar.**
   WCAG 2.2 — 2.5.2.

   | Momento | Qué pasa |
   |---|---|
   | `pointerdown` sobre un objetivo | Se marca como candidato. **Nada se registra** |
   | El puntero sale del objetivo antes de soltar | **Se aborta.** No hay activación, y **no hay fallo** |
   | `pointerup` sobre el mismo objetivo | **Activación** |

   El aborto no es un fallo, no se registra como intento, y no se anuncia. Un paciente con
   temblor toca y se desliza fuera constantemente; contar eso como error convertiría el
   temblor en un dato de búsqueda.
4. **El barrido por pulsador se implementa MOVIENDO EL FOCO.** No hay cursor propio, ni
   estado de "elemento resaltado" paralelo al foco del navegador.

   Lo fija ADR-0005: en el DOM el foco ya existe, ya es visible con `:focus-visible`, ya lo
   anuncia el lector de pantalla y ya está sincronizado con lo que se ve. Un cursor propio
   sería un segundo modelo de foco que hay que mantener de acuerdo con el primero.
5. **Dos variantes de barrido, y las dos existen porque las dos se usan.**

   | Variante | Pulsadores | Cómo avanza | Cómo activa |
   |---|---|---|---|
   | **Automático** | 1 | Solo, con cadencia `msPorPaso` | Pulsar |
   | **Manual** | 2 | Pulsar el de avance | Pulsar el de selección |

   El automático es el único que necesita temporizador, y es lo que obliga a la regla 7.
6. **La activación por permanencia mide con el reloj monótono y dispara con el
   programador.** Mantener el puntero o el foco sobre un objetivo durante
   `msPermanencia` activa.

   Y necesita una **zona de tolerancia**: un movimiento por debajo de `pxTolerancia` no
   reinicia la cuenta. Sin ella, la permanencia es inservible para quien tiene temblor —
   que es buena parte de quien la necesita.
7. **El tiempo se programa a través de un `Programador` inyectado. Es el contrato que el
   sistema 3 dejó reservado.**

   ```
   Programador = { programar(callback, ms) -> id,  cancelar(id) }
   ```

   Con esto, los tres temporizadores —`setTimeout`, `setInterval`,
   `requestAnimationFrame`— **entran en la lista prohibida de la regla 1 del sistema 3**, y
   su única implementación real vive en el borde impuro. La fila que ese documento dejó
   reservada se rellena aquí.

   Y es lo que hace posible el criterio que el sistema 3 no pudo escribir: **avanzar un
   reloj simulado treinta minutos y aserir que nada expira**, en microsegundos.
8. **La cadencia de barrido y la permanencia SON temporizadores, y NO violan el
   anti-pilar 2.** Hay que decirlo explícitamente porque parece una contradicción.

   La prueba que las distingue de un límite de tiempo es una sola pregunta: **¿que el
   temporizador expire cuenta alguna vez como fallo?**

   | Temporizador | ¿Expirar es fallo? | Veredicto |
   |---|---|---|
   | Cadencia de barrido | No. El cursor sigue al siguiente, y vuelve a pasar | Es una propiedad de la **vía de acceso** |
   | Permanencia | No. Si el puntero se va, la cuenta se reinicia sin más | Es una propiedad de la **vía de acceso** |
   | Límite por objetivo | **Sí** | **Prohibido por defecto** |
   | Límite de sesión | **Sí** | **Prohibido por defecto** |

   Un temporizador que solo puede producir "todavía no" es un mecanismo de acceso. Uno que
   puede producir "has fallado" es presión de tiempo.
9. **El tamaño de objetivo no lo decide esta capa.** Viene del sistema 4 como parámetro
   clínico. Esta capa lo **consume** para el acierto por proximidad y para nada más.

   Y hereda su regla 5: por debajo de 44 px el ruido motor contamina el eje perceptivo.
   Esta capa no lo corrige — no puede —, solo pasa la marca hacia el registro.
10. **`event.timeStamp` entra como dato, y este es el único sitio de `src/` que lo lee.**
    Es la regla 7 del sistema 3, y el archivo que la ejerce se declara exento **aquí**.

    Se lee una vez, en el borde de entrada, y viaja dentro del `EventoActivacion`. Ningún
    módulo aguas abajo lo obtiene por su cuenta.

    Y la condición dura del sistema 3 se mantiene: **una latencia solo se calcula entre dos
    valores del mismo origen de reloj.** `event.timeStamp` y `performance.now()` comparten
    origen dentro de una misma carga de página; entre cargas, no.

### Qué NO es de este sistema

| No es de aquí | De quién es |
|---|---|
| Qué objetivo es el correcto | El instrumento: 10, 21, 24 |
| Registrar la latencia y el acierto | Sistema 9 |
| El aspecto del indicador de foco | Sistema 2, tokens `--board-scan-cursor` y `--board-dwell-progress`, **ya reservados** |
| La disposición y la separación del tablero | Sistema 2, F3 |
| El tamaño de objetivo como valor | Sistema 4 |
| Configurar el modo de acceso en pantalla | Sistema 11 |
| Qué modo de acceso le va bien a qué paciente | Sistema 15 |
| El modo de estímulo reducido | Sistema 6 |

### Interacciones con otros sistemas

| Sistema | Dirección | Interfaz |
|---|---|---|
| 3 · Inyección | consume | El reloj **monótono** para la permanencia. Y **rellena** la fila reservada de la regla 1 con el `Programador` |
| 4 · Modelo de dificultad | consume | El tamaño de objetivo `t` y la marca `ejesAcoplados` |
| 2 · Tokens | consume | Los dos tokens reservados del cursor de barrido y del progreso de permanencia |
| 9 · Registro | produce | `EventoActivacion`, más el `modo` y el origen del reloj |
| 10, 21, 24 · Instrumentos | produce | `EventoActivacion`, y **nada más** |
| 11 · Panel | consume | La configuración de acceso, que es de paciente y no de ejercicio |
| 14 · CI | valida | Las reglas 1, 7 y 10 |

## Formulas

**Convención de redondeo:** los tiempos son enteros en milisegundos. Las distancias son
enteros en píxeles CSS.

### F1 — `esActivacion(gesto, t)`: la decisión de puntero

> Excepción declarada a la norma de fórmulas del proyecto: el dominio es una máquina de
> estados, no una relación numérica. La tabla es su especificación completa.

```
esActivacion = (fase == 'up')  ∧  (objetivoActual == objetivoInicial)
```

| Estado | Entrada | Salida | Se registra |
|---|---|---|---|
| `reposo` | `down` sobre `id` | `candidato(id)` | No |
| `candidato(id)` | movimiento dentro de `id` | `candidato(id)` | No |
| `candidato(id)` | movimiento fuera de `id` | `reposo` | **No. Ni como fallo** |
| `candidato(id)` | `up` sobre `id` | **ACTIVACIÓN** | Sí |
| `candidato(id)` | `up` fuera de `id` | `reposo` | **No** |
| `candidato(id)` | `cancel` del navegador | `reposo` | No |

**"Dentro de `id`" incluye la zona de tolerancia de F3**, no solo la caja del elemento. Es
lo que hace que un temblor no aborte una activación intencionada.

### F2 — `msPorPaso(nPasos, msVuelta)`: la cadencia del barrido automático

```
msPorPaso = clamp( msVuelta / nPasos ,  msPasoMin ,  msPasoMax )
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `nPasos` | int, entrada | [3, 100] | Objetivos enfocables. Es `C` del sistema 4 |
| `msVuelta` | int, **perilla clínica** | [3000, 60000] · **12000** | Tiempo de una vuelta completa |
| `msPasoMin` | int, constante | **400** | Suelo. Por debajo nadie llega a reaccionar |
| `msPasoMax` | int, constante | **4000** | Techo. Por encima la espera es cruel |
| `msPorPaso` | int, salida | [400, 4000] | Ver la tabla |

**Por qué la perilla es la VUELTA y no el paso.** Un terapeuta piensen en "cuánto tarda en
recorrerlo todo", no en "cuántos milisegundos por casilla". Y sobre todo: con la perilla en
el paso, subir `C` de 12 a 40 multiplicaría por 3,3 el tiempo de vuelta **sin que el
terapeuta tocara nada** — una entrada moviendo un parámetro clínico en silencio, que es el
modo de fallo característico del proyecto en su quinta aparición.

Con la perilla en la vuelta, subir `C` acorta el paso hasta el suelo de 400 ms y **ahí se
detiene**, con un aviso. Es una degradación declarada en lugar de silenciosa.

**Valores, calculados con `msVuelta = 12000`:**

| `nPasos` | `msVuelta / nPasos` | `msPorPaso` | Nota |
|---|---|---|---|
| 3 | 4000 | **4000** | En el techo |
| 6 | 2000 | 2000 | |
| 12 | 1000 | 1000 | Configuración propuesta |
| 30 | 400 | **400** | Justo en el suelo |
| 40 | 300 | **400** | **Recortado. Aviso al terapeuta** |
| 100 | 120 | **400** | Recortado. La vuelta real son 40 s, no 12 |

**A partir de `nPasos = 30` el barrido automático deja de cumplir la vuelta pedida.** Es un
límite real del método, no un defecto: recorrer 100 objetivos de uno en uno con un solo
pulsador es inviable, y la respuesta correcta es que el terapeuta **baje `C`** o use barrido
en dos fases, que es alcance del Nivel 1.

### F3 — `dentroDeTolerancia(dx, dy, t)`: la zona que el temblor necesita

```
pxTolerancia(t) = max( pxToleranciaMin ,  ratioTolerancia · t )
dentroDeTolerancia = hypot(dx, dy) ≤ pxTolerancia(t)
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `t` | int, entrada | [24, 140] px | Tamaño de objetivo, del sistema 4 |
| `pxToleranciaMin` | int, constante | **8** | Suelo absoluto |
| `ratioTolerancia` | float, **sin validar** | [0, 0,5] · **0,25** | Fracción del tamaño de objetivo |
| `pxTolerancia` | int, salida | [8, 35] | Radio de tolerancia |

**Escala con el tamaño de objetivo a propósito.** Un objetivo de 140 px con 8 px de
tolerancia sería igual de intolerante que uno de 24 px, cuando el terapeuta ha subido el
tamaño precisamente porque el paciente no apunta fino.

**Valores, calculados:**

| `t` | `0,25 · t` | `pxTolerancia` |
|---|---|---|
| 24 | 6,0 | **8** (suelo) |
| 32 | 8,0 | 8 |
| 44 | 11,0 | 11 |
| 60 | 15,0 | 15 |
| 100 | 25,0 | 25 |
| 140 | 35,0 | 35 |

**Interacción con `separacion(t)` del sistema 2**, y es un conflicto real que hay que
resolver: la separación entre objetivos es `max(8, 0,18·t)`, y la tolerancia es
`max(8, 0,25·t)`. **Por encima de `t = 32` la tolerancia supera la separación** — a `t = 60`
son 15 px contra 10,8, y a `t = 140` son 35 contra 25,2 —, así que la zona de tolerancia de
un objetivo se solapa con el objetivo vecino. Comprobado por ejecución. Por debajo de 32
las dos están en su suelo de 8 px y coinciden.

**Resolución:** la tolerancia **nunca captura un punto que caiga dentro de otro objetivo.**
Se aplica solo al espacio vacío entre objetivos, y en caso de duda gana el objetivo cuyo
centro esté más cerca. Se declara aquí; lo hace cumplir el instrumento con la geometría real.

> Este conflicto no lo vio ninguno de los dos GDD por separado. Aparece solo al poner las
> dos fórmulas juntas, y es un argumento a favor de `/consistency-check` antes de
> implementar.

### F4 — `progresoPermanencia(msTranscurridos)`: la cuenta de la permanencia

```
progreso = clamp( msTranscurridos / msPermanencia , 0 , 1 )
activa   = msTranscurridos ≥ msPermanencia
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `msTranscurridos` | int | [0, ∞) | Diferencia de dos lecturas del reloj **monótono** |
| `msPermanencia` | int, **perilla clínica** | [300, 5000] · **800** | Tiempo sobre el objetivo |
| `progreso` | float, salida | [0, 1] | Alimenta `--board-dwell-progress` |

**El progreso es visible y eso no viola el pilar 2.** Muestra *"te estoy escuchando"*, no
*"vas bien"* ni *"has fallado"*. Sin él, la permanencia es un misterio de 800 ms.

**Y no se anuncia por lector de pantalla.** Un anuncio de progreso cada fotograma sería
insoportable, y con sensibilidad sensorial confirmada en la población, activamente
perjudicial. El progreso es visual y nada más.

**Si el puntero sale de la tolerancia, la cuenta se REINICIA a 0**, no se pausa. Pausar
haría que dos toques accidentales separados por un minuto activaran algo.

## Edge Cases

- **Si el paciente activa dos objetivos casi a la vez** —dos dedos, o un pulsador con
  rebote—: **gana el primero y el segundo se descarta**, sin registrarse. Un rebote de
  pulsador es un fallo de hardware, no un intento.
- **Si `event.timeStamp` viene a 0 o ausente** (algunos eventos sintéticos): se usa la
  lectura del reloj monótono en su lugar, y el evento se marca `origenTiempo: 'reloj'` en
  vez de `'evento'`. **Nunca se mezclan los dos en un mismo cálculo de latencia.**
- **Si el barrido llega al final de la lista**: vuelve al principio. **Sin límite de
  vueltas**, porque un límite sería presión de tiempo por la puerta de atrás.
- **Si `nPasos` es tan alto que `msPorPaso` toca el suelo**: se opera al suelo y **el panel
  avisa** de que la vuelta real es más larga que la configurada. No se recorta en silencio.
- **Si un objetivo desaparece mientras está enfocado** (no debería ocurrir en el Nivel 0,
  donde el tablero es estático): el foco pasa al siguiente y **no se registra nada**.
- **Si el paciente mantiene pulsado el pulsador**: se trata como **una** activación. No hay
  autorrepetición. La autorrepetición con un pulsador de barbilla produce activaciones que
  la persona no quería.
- **Si están activos táctil y permanencia a la vez**: un `pointerup` deliberado activa
  antes de que la permanencia cumpla. **La vía más rápida gana**, y no hay conflicto: las
  dos producen el mismo evento.
- **Si el reloj monótono no avanza entre dos lecturas** (granularidad gruesa): la latencia
  se registra como **0 y marcada `resolucionInsuficiente`**, nunca como `undefined`. Aquí sí
  hubo un evento, a diferencia del caso del sistema 4.

## Dependencies

**Dependencias de entrada:**

| Sistema | Dureza | Qué necesita |
|---|---|---|
| 3 · Inyección | **dura** | Reloj monótono, y el `Programador` que este sistema define |
| 4 · Modelo de dificultad | **dura** | `t` y la marca `ejesAcoplados` |
| 2 · Tokens | **dura** | Los dos tokens reservados del cursor y del progreso |

**Sistemas que dependen de este:** 6, 7, 9, 10, 11, 21, 22, 23, 24 y 14. Es el sistema con
más consumidores del proyecto, y por eso su interfaz tiene que ser pequeña: **un tipo de
evento y una configuración**.

**Consistencia bidireccional:** el índice declara que 6, 7, 10, 11, 14, 21, 22, 23 y 24
dependen del 5. **El 9 no lo declara y debe**: recibe el `EventoActivacion` con su origen de
reloj. Corregido en el índice en esta pasada.

## Tuning Knobs

### Perillas clínicas — de PACIENTE, no de ejercicio

Y esa distinción es de diseño: viven en un sitio distinto del panel, porque el modo de
acceso cambia poco y el ejercicio cambia cada sesión.

| Perilla | Rango | Propuesto | Qué cambia |
|---|---|---|---|
| `modosActivos` | subconjunto de los cinco | táctil + teclado | Qué vías responden |
| `msVuelta` | [3000, 60000] | **12000** | Cadencia del barrido automático |
| `msPermanencia` | [300, 5000] | **800** | Tiempo sobre el objetivo para activar |
| `variantePulsador` | `automatico` \| `manual` | `automatico` | Uno o dos pulsadores |

### Perillas de proyecto

| Perilla | Valor | Validación |
|---|---|---|
| `msPasoMin` | 400 | **Ninguna** |
| `msPasoMax` | 4000 | **Ninguna** |
| `pxToleranciaMin` | 8 | **Ninguna** |
| `ratioTolerancia` | 0,25 | **Ninguna** |

Cuatro más, que suman **trece** constantes sin validación empírica en el proyecto. Las
cuatro de aquí son las más fáciles de validar de todas, porque se observan en una sola
sesión con un paciente que use pulsador o permanencia.

## Visual/Audio Requirements

| Requisito | Detalle |
|---|---|
| Cursor de barrido | El indicador de foco. `--board-scan-cursor`, ya reservado |
| Progreso de permanencia | Anillo o barra sobre el objetivo. `--board-dwell-progress`, ya reservado |
| Acuse de recibo | **Obligatorio, por debajo de 100 ms.** Es el pilar de esta capa |
| Movimiento | Respeta `prefers-reduced-motion`. Con movimiento reducido, el progreso de permanencia es **escalonado**, no continuo |
| Audio | **Ninguno por defecto.** Con sensibilidad sensorial confirmada, el silencio es el valor por defecto y no una opción |

**Y un requisito negativo:** el acuse de recibo de una activación **no indica acierto ni
fallo**. Es idéntico en los dos casos. El pilar 2 lo exige, y es lo primero que se rompería
"por claridad".

## UI Requirements

Para el sistema 11:

1. **La configuración de acceso vive separada de la del ejercicio**, con un rótulo que diga
   que es del paciente. Si están en la misma pantalla, alguien cambiará el modo de acceso
   creyendo que ajusta la dificultad.
2. **Al activar el barrido, el panel dice qué `msPorPaso` sale** con el `C` actual. Es el
   único sitio donde el terapeuta puede ver el recorte de F2 antes de que el paciente lo
   sufra.
3. **Los cinco modos se pueden probar en el propio panel**, sin iniciar sesión con un
   paciente. Configurar un pulsador a ciegas y descubrir en la sesión que no responde es el
   peor momento posible para enterarse.

## Acceptance Criteria

> El `Programador` inyectado es lo que hace ejecutable casi todo este bloque. Sin él,
> probar "nada expira en 30 minutos" exigiría esperar 30 minutos.

### El colapso a un solo evento

**AC-1 — Los cinco modos producen eventos indistinguibles salvo en `modo`** · Unit · **BLOCKING**
**DADO** el mismo objetivo activado por táctil, ratón, teclado, pulsador y permanencia,
**CUANDO** se comparan los cinco `EventoActivacion` resultantes,
**ENTONCES** los cinco tienen el mismo `idObjetivo`, y **difieren únicamente en `modo` y
`tActivacion`**. Ningún otro campo cambia.

**AC-2 — Ningún instrumento ramifica por modo de entrada** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de `src/` fuera de `src/entrada/`,
**CUANDO** se busca una comparación contra un literal de modo — `'tactil'`, `'raton'`,
`'teclado'`, `'pulsador'`, `'permanencia'` —,
**ENTONCES** no aparece ninguna.
*Es la regla 1 hecha barrera, y previene el modo de fallo que haría caro cada instrumento
nuevo: `if (modo === 'pulsador')` dentro de un instrumento.*

### Cancelación de puntero, WCAG 2.5.2

**AC-3 — La activación ocurre al soltar, no al pulsar** · Unit · **BLOCKING**
**DADO** un `pointerdown` sobre un objetivo y ningún `pointerup`,
**CUANDO** se inspecciona la salida de la capa,
**ENTONCES** **no se ha emitido ningún evento**.

**AC-4 — Salir antes de soltar aborta, y NO registra un fallo** · Unit · **BLOCKING**
**DADO** `pointerdown` sobre el objetivo A, movimiento fuera de A y de su tolerancia, y
`pointerup`,
**CUANDO** se inspecciona la salida,
**ENTONCES** **no hay activación y no hay intento registrado**. Ni acierto, ni fallo, ni
nada.
*Un paciente con temblor toca y se desliza fuera constantemente. Contar eso como error
convertiría el temblor en un dato de búsqueda.*

**AC-5 — Un movimiento dentro de la tolerancia NO aborta** · Unit · **BLOCKING**
**DADO** `t = 60` y por tanto `pxTolerancia = 15`; un `pointerdown` sobre el objetivo, un
movimiento de 12 px y un `pointerup`,
**ENTONCES** **hay activación**. Con un movimiento de 20 px, no la hay.

### Barrido por pulsador

**AC-6 — Canario de F2: la tabla publicada, exacta** · Unit · **BLOCKING**
**DADO** `msVuelta = 12000` y `nPasos = 3, 6, 12, 30, 40, 100`,
**CUANDO** se calcula `msPorPaso`,
**ENTONCES** el resultado es **4000 · 2000 · 1000 · 400 · 400 · 400**. Y para `nPasos ≥ 40`
la función señala que **ha recortado**.

**AC-7 — El barrido mueve el FOCO, no un cursor propio** · Integration (Playwright) · **BLOCKING**
**DADO** un tablero con el barrido automático activo,
**CUANDO** el programador avanza un paso,
**ENTONCES** `document.activeElement` es el objetivo siguiente. **No existe ninguna clase ni
atributo de "resaltado" que no sea el foco.**
*ADR-0005 hecho criterio: un cursor propio sería un segundo modelo de foco que hay que
mantener de acuerdo con el primero.*

**AC-8 — El barrido no tiene límite de vueltas** · Unit · **BLOCKING**
**DADO** un tablero de 6 objetivos y un programador que avanza 500 pasos,
**ENTONCES** el barrido sigue activo, ha dado 83 vueltas, y **no ha emitido ningún evento de
expiración ni de fin**.

**AC-9 — Mantener pulsado es UNA activación, sin autorrepetición** · Unit · **BLOCKING**
**DADO** un pulsador mantenido durante 10 segundos simulados,
**ENTONCES** se emite **exactamente un** `EventoActivacion`.

### Activación por permanencia

**AC-10 — Canario de F3: la tabla de tolerancia, exacta** · Unit · **BLOCKING**
**DADO** `t = 24, 32, 44, 60, 100, 140` con `ratioTolerancia = 0,25` y `pxToleranciaMin = 8`,
**ENTONCES** `pxTolerancia` es **8 · 8 · 11 · 15 · 25 · 35**.

**AC-11 — La permanencia activa al cumplir, y no antes** · Unit · **BLOCKING**
**DADO** `msPermanencia = 800` y un reloj monótono inyectado,
**CUANDO** el puntero lleva 799 ms sobre el objetivo,
**ENTONCES** no hay activación. **A 800 ms, la hay.**

**AC-12 — Salir de la tolerancia REINICIA la cuenta, no la pausa** · Unit · **BLOCKING**
**DADO** 700 ms sobre el objetivo, una salida de la tolerancia, y otra entrada,
**CUANDO** pasan 700 ms más,
**ENTONCES** **no hay activación**: la cuenta empezó de cero. A 800 ms desde la reentrada,
la hay.
*Pausar haría que dos toques accidentales separados por un minuto activaran algo.*

**AC-13 — El progreso de permanencia no se anuncia por lector de pantalla** · Integration (Playwright) · **BLOCKING**
**DADO** una permanencia en curso,
**CUANDO** se inspecciona el DOM,
**ENTONCES** el elemento de progreso **no está dentro de ninguna región `aria-live`** y no
tiene `role="progressbar"` con `aria-valuenow` cambiante.
*Un anuncio por fotograma sería insoportable, y con sensibilidad sensorial confirmada,
activamente perjudicial.*

### El anti-pilar 2, ahora sí ejecutable

**AC-14 — Nada expira tras 30 minutos simulados** · Integration · **BLOCKING**
**DADO** un `Programador` inyectado, una sesión iniciada sin cronómetro y el barrido activo,
**CUANDO** el programador avanza **30 minutos simulados** en pasos discretos, sin ninguna
llamada real a `setTimeout`,
**ENTONCES** no se dispara ningún evento de expiración, ninguna ronda se marca fallida por
tiempo, y la sesión sigue activa hasta una acción explícita de una persona.

**Este es el criterio que el sistema 3 declaró y no pudo escribir**, porque su sujeto —un
temporizador real— no existía. El `Programador` de la regla 7 lo crea, y con él este
criterio pasa de imposible a instantáneo.

**AC-15 — Ningún temporizador de esta capa puede producir un fallo** · Unit · **BLOCKING**
**DADO** los dos temporizadores del sistema: cadencia de barrido y permanencia,
**CUANDO** cada uno expira sin acción del paciente,
**ENTONCES** el resultado es **avanzar** o **reiniciar**, y en ningún caso un intento
registrado, un fallo, ni un evento de expiración.
*Es la regla 8 hecha criterio, y es lo que distingue un mecanismo de acceso de la presión de
tiempo.*

### Invariantes de arquitectura

**AC-16 — Los tres temporizadores solo existen en el borde impuro** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de `src/` fuera del borde impuro,
**CUANDO** se busca `setTimeout(`, `setInterval(` y `requestAnimationFrame(`,
**ENTONCES** no aparece ninguno.
*Rellena la fila que la regla 1 del sistema 3 dejó reservada. Hasta hoy eran AVISO; desde
hoy rompen el build.*

**AC-17 — `event.timeStamp` solo se lee en el borde de entrada** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de `src/` fuera de `src/entrada/borde-eventos.js`,
**CUANDO** se busca `.timeStamp`,
**ENTONCES** no aparece.
*Es la excepción que la regla 7 del sistema 3 reservó, y este es el archivo que la ejerce.*

**AC-18 — El acuse de recibo no distingue acierto de fallo** · Integration (Playwright) · **BLOCKING**
**DADO** una activación sobre el objetivo correcto y otra sobre un distractor,
**CUANDO** se comparan los estilos calculados y los atributos del acuse de recibo,
**ENTONCES** son **idénticos**.
*Es lo primero que se rompería "por claridad", y rompería el pilar 2 con él.*

### Infraestructura que falta

| Falta | Nota |
|---|---|
| `src/entrada/` | Nuevo. Y `src/entrada/borde-eventos.js` es el **segundo** archivo exento de `src/`, por `.timeStamp` |
| El `Programador` real, en el borde impuro | Envuelve `setTimeout`. El de test avanza a mano |
| **Playwright** | AC-7, AC-13 y AC-18 lo necesitan. **Primer sistema del proyecto que no se puede cerrar sin navegador** |
| Las cuatro constantes en el registro | `msPasoMin`, `msPasoMax`, `pxToleranciaMin`, `ratioTolerancia` |

> **AC-2 del sistema 3 tiene que cambiar, y es un cambio real.** Decía que el archivo exento
> es **exactamente uno**. Con `borde-eventos.js` son **dos**, cada uno con su literal
> exento: el borde impuro para las fuentes y los temporizadores, y el borde de eventos para
> `.timeStamp` y nada más.
>
> Se propaga al GDD del sistema 3 y a `tools/ci/invariantes.js`: el conteo pasa de 1 a una
> **lista blanca de dos rutas, cada una con su lista de literales permitidos**. Es más
> estricto que el conteo, no menos: hoy el borde impuro podría leer `.timeStamp` y nadie lo
> vería.

## Open Questions

| Pregunta | Quién resuelve | Cuándo |
|---|---|---|
| ¿`msVuelta = 12000` y `msPermanencia = 800` son valores útiles? | El colaborador, con un paciente que use esas vías | Son las constantes más fáciles de validar del proyecto: se ven en una sesión |
| ¿Hace falta barrido en dos fases (fila, luego columna)? | Producto | Es la respuesta correcta a `C > 30`, y es alcance del Nivel 1 |
| ¿Cómo se conecta un pulsador real? | Tú, con el hardware | La mayoría se presentan como teclado o ratón, así que probablemente no haga falta nada. **Hay que confirmarlo con el dispositivo real antes de cerrar el sistema** |
