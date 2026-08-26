# ADR-0005 — DOM contra Canvas para el área de juego

> **Status**: Accepted
> **Fecha**: 2026-08-26
> **Decide**: `technical-director`, con `accessibility-specialist` como especialista principal
> **Alcance**: todo el código de presentación del paciente

## Context

Es la decisión que el concepto identificó desde el primer día y que se aplazó tres veces.
Bloquea todo el código de presentación, y el sistema 2 ya avisó de que resolverla a favor
de Canvas sería **rediseño y no ajuste**.

El área de juego muestra hasta `Cmax = 100` elementos, de los que el paciente debe
encontrar uno. Las vías de activación son cinco: táctil, ratón, teclado, pulsador por
barrido y activación por permanencia. No hay arrastre, no hay `hover` como requisito, y no
hay gestos de más de un punto.

La población incluye baja visión, control psicomotor reducido y —confirmado el 2026-08-26—
sensibilidad sensorial.

## Decision

**DOM para el área de juego. Sin ambigüedad.**

Un elemento por objeto del tablero, con `role`, nombre accesible y foco real. La
disposición es CSS Grid; la separación la fija `separacion(t)` de F3 del sistema 2 como
`gap`; el tamaño de objetivo es `min-inline-size` y `min-block-size` sobre un token.

**Se permite un `<canvas>` como elemento hoja** para un instrumento concreto que necesite
pintura de píxeles de verdad — el candidato es *transcribir símbolos*, en Alpha y fuera del
alcance actual. Con dos condiciones no negociables: no puede ser el área de juego completa,
y tiene que llevar su propia alternativa accesible equivalente. Ese canvas es una
excepción justificada por instrumento, no una puerta abierta.

## Consequences

### Los cuatro argumentos que deciden

**1. Los colores forzados, y este solo casi basta.** Windows tiene un modo de alto
contraste que el sistema operativo impone, y el sistema 2 le dedica una fórmula entera (F4)
más una capa de cascada. En el DOM funciona: el navegador sustituye los colores y las
palabras clave del sistema — `Canvas`, `CanvasText`, `Highlight` — resuelven a lo que el
usuario eligió.

**Sobre un `<canvas>`, `forced-colors` no hace nada.** Son píxeles pintados: el navegador
no sabe qué es fondo y qué es texto. Habría que detectar el modo y repintar todo a mano,
reimplementando la fórmula F4 en código de dibujo. Para una población de baja visión que
**ha elegido activamente** el alto contraste, eso no es un coste de ingeniería: es la
función más importante del sistema operativo para ese usuario, desactivada.

**2. El barrido por pulsador ES navegación de foco.** Un paciente con un solo punto de
activación recorre los objetivos y confirma. En el DOM eso es mover el foco por elementos
enfocables, con `:focus-visible` para el indicador. Sobre Canvas hay que construir un
modelo de foco virtual completo: qué está enfocado, en qué orden, cómo se anuncia, y cómo
no se desincroniza de lo pintado.

**3. Con Canvas se construyen las dos cosas, no una.** La técnica estándar para hacer
accesible un canvas es mantener un árbol DOM paralelo que describa lo pintado. O sea: el
DOM que dice haberse evitado, **más** el código de dibujo, **más** la sincronización entre
los dos. Es estrictamente más trabajo, no menos.

**4. Rompería ADR-0002 y sus criterios de aceptación.** Los tokens son normativos en JS y
el CSS es un archivo generado y confirmado en git. Un canvas no consume propiedades
personalizadas de CSS: habría que leerlas con `getComputedStyle` y repintar, que es
exactamente el problema de *"dos implementaciones que deben coincidir por suerte"* que
ADR-0002 eliminó.

Y peor para la verificación: **el tamaño de objetivo y la razón de contraste dejan de ser
observables**. Hoy Playwright puede leer el tamaño calculado de un elemento y su color;
sobre un canvas solo puede sacar una captura. Los criterios de aceptación del sistema 2 que
dependen de `forced-colors` y de tamaños calculados pasarían de comprobables a manuales, y
el tamaño de objetivo es un **parámetro clínico**, no un detalle de estilo.

### Lo que se pierde, y por qué no pesa

| Argumento a favor de Canvas | Por qué no aplica aquí |
|---|---|
| Rendimiento con muchos elementos | El tablero es **estático entre interacciones**. No hay bucle de render, no hay física, no hay animación continua. La cota son 100 elementos que no se mueven |
| Control de píxeles para efectos | El anti-pilar 3 prohíbe la gamificación extrínseca y el pilar 2 prohíbe marcar el fallo. Con sensibilidad sensorial confirmada, **menos efectos es un requisito, no una renuncia** |
| Disposición arbitraria y solapamiento | El tablero es una rejilla con separación mínima calculada. CSS Grid lo hace, y `solapamientoMax` ya está en el registro de constantes |

### El presupuesto de rendimiento: predicción, no afirmación

Este proyecto ya se ha llevado un disgusto por publicar afirmaciones sin medirlas, así que
lo que sigue es una **predicción falsable y sin verificar**, no un dato:

> Se predice que 100 elementos DOM estáticos con imagen, sin animación, se mantienen
> holgadamente por debajo del presupuesto de 16,6 ms por fotograma y por debajo de los
> 100 ms de latencia de acuse de recibo, en la tableta de la consulta.

**No está medido.** Se mide con Playwright cuando exista el instrumento Busca, y el número
entra en el GDD del sistema 10. Si la predicción falla, la salida **no** es Canvas: es
reducir `Cmax`, que además es una perilla clínica que el terapeuta ya controla.

### Consecuencias para los sistemas pendientes

| Sistema | Qué queda fijado |
|---|---|
| 5 · Adaptación de entrada | El barrido por pulsador se implementa **moviendo el foco**, no gestionando un cursor propio. La activación por permanencia cuelga del elemento enfocado |
| 8 · Generación de tableros | Devuelve **datos**, nunca coordenadas de píxel. La disposición es del CSS |
| 10 · Busca | Un elemento por objeto, con nombre accesible. Y **aquí se mide la predicción de rendimiento** |
| 11 · Panel del terapeuta | Sin conflicto: el panel siempre iba a ser DOM |
| 2 · Tokens | Se confirma la presunción fuerte que el GDD ya declaraba. Cero retrabajo |

## Notas

**El nombre accesible de cada objeto sale del campo `name` del manifiesto**, no de la ruta
del archivo ni del identificador. El manifiesto ya lo tiene, y `resolve(id)` ya lo
devuelve: la decisión no añade un campo nuevo al esquema del sistema 1.

**Sigue pendiente, y no lo resuelve este ADR:** qué se anuncia y qué no. El pilar 2 prohíbe
marcar o anunciar un fallo al paciente, ni visualmente ni por lector de pantalla, así que
la política de regiones activas (`aria-live`) es una decisión del sistema 10 y del 11. Que
el DOM lo haga fácil no significa que haya que anunciarlo todo — al contrario: con
sensibilidad sensorial confirmada, el valor por defecto es el silencio.
