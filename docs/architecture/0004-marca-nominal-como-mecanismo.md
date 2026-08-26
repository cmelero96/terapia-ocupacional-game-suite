# ADR-0004 — La marca nominal en JSDoc como mecanismo de aplicación

> **Status**: Accepted
> **Fecha**: 2026-08-26
> **Decide**: `creative-director`, tras `/design-review` del sistema 3
> **Alcance**: todo el proyecto

## Context

El proyecto tiene un patrón de fallo característico, nombrado en la revisión del sistema
2 y con cuatro apariciones: **una entrada del entorno entrando en silencio en el espacio
de parámetros clínicos**. Un tema del sistema operativo que mueve el fondo del tablero.
Un tamaño de objetivo por debajo de 44 px que convierte ruido motor en fallo de búsqueda.
Un daltonismo que convierte similitud semántica en visual. Y un reloj de pared cuyo salto
corrompe una latencia.

Cuando aparece uno, la pregunta siempre es la misma: **cómo se impide, no cómo se
detecta.** Y hasta ahora la respuesta se ha inventado tres veces por separado.

El sistema 3 trajo el caso más limpio. Tiene dos pares de valores que son
**estructuralmente idénticos y semánticamente incompatibles**:

| Par | Firma compartida | Por qué confundirlos es un defecto |
|---|---|---|
| Reloj monótono contra reloj de pared | `now(): number` | Medir una duración con el reloj de pared la corrompe si el reloj salta. Una latencia negativa entra en el registro clínico con forma de dato válido |
| Fuente aleatoria de producción contra fuente fija de test | `() => number` | `() => 0.42` en producción da el mismo tablero en cada sesión. Nadie lo ve: el tablero es válido |

El GDD del sistema 3 afirmaba que *"nada en JavaScript ni en JSDoc las distingue en
compilación"*, y encargaba al sistema 14 un analizador que buscase "una función flecha
conectada a un parámetro de fuente aleatoria o de reloj".

**Las dos cosas eran falsas o caras.** La afirmación es falsa, y se refuta compilando. Y
el encargo es resolución de firmas: exige la API del compilador de TypeScript, sube el
sistema 14 de esfuerzo M a L, y mete `typescript` como dependencia de `tools/` — lo que
choca con el corolario de ADR-0003, porque un analizador semántico no es un archivo
estático confirmado en git, es un programa que hay que mantener y ejecutar.

## Decision

**Cuando dos valores comparten forma y no significado, se les pone una marca nominal en
el tipo JSDoc, y la incompatibilidad la hace cumplir `tsc --checkJs`.**

La marca es una propiedad discriminante **obligatoria**, con un tipo literal:

```js
/** @typedef {{ (): number, kind: 'aleatoria' }} FuenteAleatoria */
/** @typedef {{ kind: 'monotono', now: () => number }} RelojMonotono */
/** @typedef {{ kind: 'pared',    now: () => number }} RelojPared */
```

Y tres reglas de uso, verificadas compilando contra el `jsconfig.json` del proyecto:

1. **`kind` es obligatorio, nunca opcional.** Con `kind` opcional la comprobación
   estructural sigue aceptando el intercambio y la marca es decoración.
2. **Funciona también sobre un tipo invocable**, no solo sobre objetos. Es lo que permite
   marcar la fuente aleatoria, que es una función.
3. **Exactamente una función acuña cada marca**, y vive en el borde impuro. El cast que la
   marca necesita se escribe **una sola vez**; aguas abajo no hay ninguno.

## Consequences

### Lo que se compra

Los cuatro errores dejan de compilar, con mensajes que nombran el problema:

```
error TS2345: Argument of type 'RelojPared' is not assignable to parameter of
  type 'RelojMonotono'.
  Types of property 'kind' are incompatible.
    Type '"pared"' is not assignable to type '"monotono"'.

error TS2345: Argument of type '() => number' is not assignable to parameter of
  type 'FuenteAleatoria'.
  Property 'kind' is missing in type '() => number' but required in type 'FuenteAleatoria'.
```

**El sistema 14 gana cero capacidad nueva.** Lo único que queda por vigilar es la
falsificación deliberada de la marca — un doble cast la forja y compila —, y eso es
léxico, porque forjarla obliga a escribir el nombre del acuñador, el nombre del tipo o la
propiedad literal en el archivo. Es la misma infraestructura de listas de literales que ya
usan los sistemas 1 y 2.

### Lo que se paga, y es real

**Un módulo que recibe un valor marcado importa su typedef.** El caso concreto: el sistema
1 recibe una `FuenteAleatoria` y pasa a importar un typedef del sistema 3, así que su
"cero dependencias" deja de ser literal.

La contabilidad honesta es que **son dos clases distintas de dependencia**, y el índice de
sistemas las registra por separado:

| Clase | Existe en ejecución | Ejemplo |
|---|---|---|
| **Dura** | Sí | El sistema 8 llama a `crearFuenteDeProduccion` |
| **De tipos** | **No.** Un `@import` de JSDoc vive dentro de un comentario y se borra al servir el archivo | El sistema 1 nombra `FuenteAleatoria` |

Una dependencia de tipos no tiene arista de ejecución, ni orden de inicialización, ni
ciclo posible, ni puede producir un 404 en la tableta de la consulta. Y la razón declarada
de que el sistema 1 sea capa Foundation no se toca: **es Foundation porque no *obtiene* la
fuente, no porque no sepa nombrar su tipo.**

### Por qué no la alternativa

Dejar los tipos estructurales y detectar el error en CI con análisis semántico pierde en
las tres dimensiones a la vez:

- **Momento.** La marca falla en el editor del programador; el analizador falla en CI,
  después de subir el cambio.
- **Coste.** Cero contra un analizador que hay que escribir y mantener, más `typescript`
  en `tools/`.
- **Coherencia con ADR-0003.** La salida de una herramienta se confirma en git como
  archivo estático. Un analizador no es un artefacto: tiene que correr. Y a fecha de esta
  ADR el proyecto **todavía no ha conseguido ejecutar `tsc` una sola vez**.

## Notas

Es la tercera vez en el proyecto que la respuesta a "análisis semántico contra nada" es
**hacer la cosa greppable por construcción**: los contenedores hermanos `.frame-root` y
`.board-root` del sistema 2, el marcador de exención del borde impuro, y ahora la marca.
Esta ADR existe para que la cuarta no se vuelva a inventar desde cero.

**Límite conocido, declarado a propósito:** la marca no ve **precisión**. Cierra "este es
el reloj equivocado" y no cierra "este es el reloj correcto con una granularidad que no
sirve para lo que se mide" — el caso de `performance.now()` degradado por mitigaciones de
Spectre. Para eso no hay puerta de tipos: hay que declarar la resolución de cada medida y
medirla en el hardware real.
