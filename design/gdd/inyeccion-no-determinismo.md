# Inyección de no determinismo

> **Status**: Revisado (NEEDS REVISION, cambios aplicados)
> **Author**: Carlos + `lead-programmer`, `qa-lead`
> **Last Updated**: 2026-08-26 (revisado el mismo dia)
> **Sistema**: #3 del índice · Core · MVP · capa Foundation · esfuerzo **S**
> **Implements Pillar**: Ninguno directamente. Es lo que hace **comprobables** el
> pilar 4 (contenido combinatorio) y el anti-pilar 2 (sin presión de tiempo por defecto).

## Overview

Las dos entradas no deterministas que el producto necesita — **aleatoriedad y tiempo** —
existen solo como **parámetros inyectados**. Nada en `src/` llama a `Math.random()`,
`Date.now()`, `new Date()` ni `performance.now()`.

Existe por dos razones concretas, y las dos son de comprobabilidad:

1. **El pilar 4 hace que el contenido sea generado.** Sin inyección, ningún test puede
   aserir *qué tablero* se produjo — solo el tamaño del array. Las normas del proyecto
   exigen determinismo, y una mecánica procedural sin aleatoriedad inyectada no es
   testeable.
2. **El anti-pilar 2 es un invariante automatizable, pero solo con un reloj inyectado.**
   Comprobar que ningún límite de tiempo está activo por defecto exige adelantar un
   reloj simulado varios minutos y aserir que nada expira. Con `setTimeout` real, ese
   test tardaría minutos y sería inestable.

Es la aplicación directa de una norma que el proyecto ya tenía escrita: *"dependency
injection over singletons"*.

**Este sistema debe ser el más pequeño del orden de diseño, y hoy no lo es.** Su trabajo
entero es pasar dos cosas como parámetro. Salió de su primera revisión con 878 líneas
frente a las 570 con que entró, porque la revisión añadió una fórmula (F5, el acuñador) y
una regla (la 7, `event.timeStamp`). Las dos pertenecen aquí, pero el dato es incómodo y
la próxima revisión debe atacarlo: si el documento no baja, es que se ha convertido en dos
sistemas con un nombre.

## Player Fantasy

**Ninguna.** Es infraestructura de comprobabilidad, y el paciente no experimenta ni su
efecto — a diferencia del manifiesto o de los tokens, que sí tienen consecuencia
perceptible.

Lo que habilita es indirecto y va todo al terapeuta: **que los datos de su paciente sean
comparables entre sesiones**, porque las mediciones de latencia no las corrompe un salto
de reloj; y **que un tablero se pueda reproducir exactamente**, porque la semilla queda
registrada.

Esa segunda propiedad tiene un valor clínico que no es obvio: si el terapeuta quiere
volver a presentar el mismo tablero, o si quiere revisar qué vio exactamente el paciente
en la sesión 4, la semilla más la configuración lo reconstruyen. **Cuesta guardar un
entero.**

> `creative-director` no consultado — modo Lean, y sin fantasía que encuadrar.

## Detailed Rules

### Core Rules

1. **Ninguna llamada directa a una fuente no determinista dentro de `src/`**, fuera del
   borde impuro de la regla 4. La lista es cerrada y **este sistema la posee**:

   | Literal prohibido | Qué es |
   |---|---|
   | `Math.random()` | Aleatoriedad global |
   | `crypto.getRandomValues()` | **Aleatoriedad fuerte. Es la fuente de la propia F3** |
   | `Date.now()`, `new Date()` | Reloj de pared |
   | `performance.now()` | Reloj monótono |
   | `event.timeStamp` | **Reloj monótono disfrazado de propiedad de un evento.** Ver la regla 7 |

   **Los temporizadores — `setTimeout`, `setInterval`, `requestAnimationFrame` — ENTRARON
   en la lista el 2026-08-26**, cuando el sistema 5 publicó el contrato del `Programador`.
   Hasta entonces eran aviso y no fallo, por la razón que sigue: Inyectar el reloj hace el tiempo *legible*;
   no hace el disparo *programable*. Prohibirlos antes de que exista el contrato de un
   programador de tiempo inyectable dejaría al sistema 5 sin forma de implementar la
   activación por permanencia, y lo empujaría a inventarse una exención ad hoc — que es
   exactamente lo que AC-2 existe para impedir. **Entran en esta lista el día que el
   sistema 5 publique ese contrato**. Ya lo hizo: `Programador = { programar, cancelar }`,
   con su única implementación real en el borde impuro. La reserva queda cerrada.

   Es un invariante sobre **código fuente**, no sobre comportamiento, así que su
   verificación es del **sistema 14**. Aquí se declara; allí se hace cumplir.
2. **La aleatoriedad es un parámetro de tipo `FuenteAleatoria`, con marca nominal**, y
   **existe exactamente una función en todo `src/` que la acuña**:
   `envolverConValidacion(fn)`, en el borde impuro. Esa función valida **cada valor que
   la fuente envuelta devuelve**: si sale de `[0, 1)`, lanza `RangeError` nombrando el
   valor y el rango.

   Un acuñador único hace tres cosas a la vez: da sujeto invocable a la validación,
   convierte `() => 0.42` en un error de compilación, y deja un solo literal que el
   sistema 14 tiene que vigilar.
3. **Dos relojes, no uno.**

   | Reloj | Para qué | Prohibido usarlo para |
   |---|---|---|
   | **Monótono** | Medir latencia: tiempo por objetivo, duración de permanencia | Sellar un registro con fecha. No tiene relación con el calendario |
   | **De pared** | Sellar registros: `retiredAt`, fecha de sesión | **Calcular diferencias de tiempo** |

   **Confundirlos es un defecto, no un descuido de estilo.** El reloj de pared puede
   saltar, y un salto a mitad de sesión **corrompería la latencia de un paciente**: una
   latencia negativa, o de dos horas, entraría en el registro como dato clínico.

   **La causa, y no es el cambio de hora estacional.** El horario de verano **no mueve**
   `Date.now()`: devuelve milisegundos de epoch UTC, y el cambio estacional solo afecta a
   cómo se *formatea* una fecha en hora local. La causa que sí produce un salto de horas
   aquí es **una tableta que pasa semanas apagada, acumula desviación en su reloj de tiempo
   real, y da la corrección de golpe al reconectarse.** Una sincronización rutinaria
   corrige milisegundos; el primer arranque tras un parón corrige lo que haga falta.

   **Y la mezcla es imposible de compilar, no solo de recordar.** Los dos relojes llevan
   una **marca nominal** en su tipo — `kind: 'monotono' | 'pared'` — aunque los dos
   expongan `now(): number`. La compatibilidad estructural de JSDoc no basta por sí sola:
   sin la marca, pasar uno donde se espera el otro compilaría sin queja.

   `kind` es **discriminante obligatorio**, nunca una propiedad opcional: si es opcional,
   la comprobación estructural sigue aceptando el intercambio y la marca es decoración.

   Y esto conecta con el patrón que el sistema 2 nombró: un salto de reloj es
   exactamente **una entrada del entorno entrando en el espacio de parámetros clínicos**.
   Aquí se cierra por construcción.
4. **El borde impuro es un solo módulo, y no es el que reparte.** Son dos cosas
   distintas, y la primera redacción las trataba como una:

   | Pieza | Ruta | Qué hace | ¿Exenta de la regla 1? |
   |---|---|---|---|
   | **Fábrica impura** | `src/plataforma/borde-impuro.js` | Llama a `crypto.getRandomValues`, `performance.now` y `Date.now`. Acuña las tres marcas. ~30 líneas | **Sí. Es el único archivo exento de todo `src/`** |
   | **Tipos marcados** | `src/plataforma/esquema.js` | Solo typedefs JSDoc de `FuenteAleatoria`, `RelojMonotono` y `RelojPared` | No aplica: no tiene código |
   | **Raíz de composición** | del sistema 10 | Importa la fábrica y pasa los valores hacia abajo | **No la necesita**: no llama a ninguna fuente, solo mueve parámetros |

   **La ruta es parte de la decisión, no un detalle** — el precedente es ADR-0001. Sin
   ruta declarada, AC-1 y AC-2 son puertas bloqueantes por ruta sin ruta que comprobar.

   Y la raíz de composición hay que adjudicarla, porque las dos lecturas de la redacción
   anterior dejaban el índice falso: si la fábrica también cablea, el sistema 3 pasa a
   depender de 5, 8, 9 y 10 y su fila "Depende de: —" es mentira; si cablea otro, entonces
   al sistema 10 le falta el 3 en su columna. **Se adjudica al sistema 10 para el MVP**, y
   su fila del índice se corrige en esta pasada.
5. **Una semilla fija produce una secuencia exactamente reproducible**, para que los
   tests aseveren igualdad en lugar de propiedades estadísticas.
6. **La semilla nunca queda inaccesible, y nunca entra sin validar.**

   `crearFuenteDeProduccion()` devuelve `{ semilla, fuenteAleatoria }`, no solo la
   función: un consumidor no puede generar sin poder recuperar qué semilla generó.

   Y en el otro sentido, `crearFuenteAleatoria(semilla)` **valida su entrada**. Sin
   guarda, `semilla >>> 0` coerciona en silencio:

   | Entrada | `>>> 0` |
   |---|---|
   | `undefined`, `NaN`, `null` | **0** |
   | `4294967296` — el desbordamiento por uno más previsible | **0** |
   | `-1` | 4294967295 |
   | `3.7` | 3 |

   Las cuatro primeras producen la **misma secuencia exacta** que `semilla = 0`. Junto al
   caso límite "un registro histórico sin semilla se muestra como no reproducible", un
   `undefined` que se escape **reconstruye un tablero con semilla 0 y lo presenta como
   reproducción correcta**. La guarda es `Number.isInteger(semilla)` más el rango; si no,
   lanza nombrando el valor.

   Aquí acaba lo que este sistema garantiza sobre la semilla. La fábrica **no toma el
   manifiesto como argumento**, así que estructuralmente no puede leerlo. Que la semilla
   acabe escrita en el registro es del sistema 9.
7. **`event.timeStamp` llega como dato, nunca como lectura de reloj.**

   Es un `DOMHighResTimeStamp` con el mismo origen que `performance.now()`, viene en todo
   evento de puntero, y **es más preciso que llamar al reloj dentro del manejador**, porque
   marca el evento de hardware en lugar de incluir la latencia de despacho. Por eso no se
   prohíbe a secas: prohibirlo degradaría justo la medida que el presupuesto de 100 ms
   necesita.

   La resolución es estructural: **el borde de entrada del sistema 5 lo lee y lo pasa
   hacia abajo como un valor dentro del evento adaptado.** Sigue siendo inyectado, sigue
   siendo preciso, y ningún módulo aguas abajo lo obtiene por su cuenta.

   Con una condición dura: **una latencia solo se calcula entre dos valores del mismo
   origen de reloj.** Mezclar un `timeStamp` de evento con una lectura del reloj monótono
   de otra carga de página es la misma clase de defecto que mezclar los dos relojes.

### Qué NO es de este sistema

Enumerado a propósito, porque es un sistema de esfuerzo `S` y la tentación de meterle
cosas es alta:

| No es de aquí | De quién es |
|---|---|
| Cómo se generan los tableros | Sistema 8 |
| El temporizador de permanencia y el barrido por pulsador | Sistema 5 |
| El esquema del registro de sesión | Sistema 9 |
| El análisis estático que hace cumplir las reglas 1 y 4 | Sistema 14 |
| Cuántas veces se reutiliza un distractor | Sistema 1, F3 |
| **Que la semilla acabe escrita en el registro** | Sistema 9 |
| **Que `schemaVersion` viaje junto a la semilla** | Sistema 9 |
| **Que un manifiesto distinto produzca un tablero distinto a igual semilla** | Sistema 8 |
| **La guarda de conjunto vacío en `Math.min()`** | Sistema 14. **Este sistema no reduce colecciones** — genera escalares. Incluirla habría sido el mismo sobrealcance que los dos GDD anteriores cometieron y corrigieron |
| **La guarda de diferencia negativa del reloj monótono** — latencia indefinida en lugar de cero | Sistema 9. Es una decisión de **registro**, no de inyección: aquí se entrega el reloj, allí se decide qué se anota cuando su lectura no tiene sentido. Mismo reparto que la guarda de `Math.min()` |
| **Que el registro no use el sello de pared como única clave de orden** | Sistema 9. Este documento acepta que el sello se desplace; el consumidor necesita además un orden de inserción para que "es aceptable" no se convierta en sesiones mostradas fuera de orden al terapeuta |
| **El diseño de un programador de tiempo inyectable** (para sustituir a `setTimeout`) | Sistema 5. Ver la reserva de la regla 1 |
| **La resolución con la que se registra una latencia** | Sistema 9. Este sistema declara la granularidad del reloj que entrega; el 9 declara la de su medida |

Este sistema aporta **dos parámetros y su contrato**. Nada más.

### Interacciones con otros sistemas

| Sistema | Dirección | Interfaz |
|---|---|---|
| 5 · Adaptación de entrada | consume | El reloj **monótono**, para el temporizador de permanencia |
| 8 · Generación de tableros | consume | La fuente aleatoria y el barajado. **Y es quien se la pasa al sistema 1** |
| 9 · Registro de rendimiento | consume | El reloj **monótono** para latencias y el de **pared** para sellar. Y guarda la semilla más la versión de esquema del manifiesto |
| 22 · Instrumento: transcribir símbolos | consume | Fuente aleatoria. Alpha |
| 12 · Resultados de sesión | consume | Indirectamente, vía el sistema 9 |
| 10 · Instrumento Busca | **compone** | **Posee la raíz de composición**: construye la fábrica al arrancar y reparte los valores hacia abajo. No está exenta de la regla 1, porque no llama a ninguna fuente |
| 14 · Invariantes de CI | valida | Las reglas 1, 4 y 7, más la acuñación de marcas de F5. Tres listas de literales sobre la infraestructura que ya tiene |

**El sistema 1 tiene con este una dependencia de tipos, no dura.** Sus consultas de pool
*reciben* una fuente aleatoria como parámetro pero no la *obtienen* — quien la consigue y
la pasa hacia abajo es el sistema 8. Lo que cambia es el tipo de ese parámetro:
`FuenteAleatoria` con marca nominal en lugar de `() => number`, así que el sistema 1
importa un typedef de `src/plataforma/esquema.js`.

**Un `@import` de JSDoc no existe en ejecución.** Se borra al servir el archivo: no hay
arista de ejecución, ni orden de inicialización, ni ciclo, ni un 404 en la tableta. El
sistema 1 conserva **cero dependencias de runtime** y adquiere **una de tipos**, y el
índice registra esa clase aparte. Su "cero dependencias" nunca fue pureza de ejecución por
sí misma: es Foundation porque **no obtiene** la fuente, no porque no sepa nombrar su tipo.

Ver ADR-0004 para el argumento completo del canje.

## Formulas

**Sin convención de redondeo.** Este sistema no redondea. El único truncamiento es el
`Math.floor()` interno de F2, que es parte de la definición del algoritmo y no una
convención de dominio elegida aparte.

### F1 — `crearFuenteAleatoria(semilla)`: PRNG con semilla, mulberry32

```js
function crearFuenteAleatoria(semilla) {
  if (!Number.isInteger(semilla) || semilla < 0 || semilla > 4294967295) {
    throw new RangeError(`semilla invalida: ${semilla}, se esperaba entero en [0, 4294967295]`);
  }
  let a = semilla >>> 0;
  return function fuenteAleatoria() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `semilla` | int, entrada | [0, 2³²−1] | Entero sin signo de 32 bits. Único parámetro. **Validado, no coercionado** — ver la regla 6 |
| `a` | uint32, estado | [0, 2³²−1] | No se expone fuera del cierre |
| valor devuelto | float, salida | **[0, 1)** | 2³² valores discretos, paso ≈ 2,33 × 10⁻¹⁰ |

**Rango de salida:** [0, 1), con 2³² valores posibles. **El 0 exacto es alcanzable** — el
numerador es un entero de 32 bits y puede valer 0 — y es benigno: F2 lo convierte en
`j = 0`, un índice válido. El otro extremo está probado en F2.

**Periodo, demostrable y no estimado.** `a` avanza en una secuencia de Weyl con
incremento impar (`0x6D2B79F5`), coprimo con 2³², así que el estado recorre sus **2³²
valores** antes de repetirse. Es aritmética modular, no una propiedad observada.

**Por qué mulberry32 y no un generador congruencial lineal.** Barajando 2000000 de veces
y contando permutaciones con la prueba de chi cuadrado:

| `n` | mulberry32 | LCG estándar | RANDU, un LCG mal elegido | umbral al 0,1% |
|---|---|---|---|---|
| 4 | 24,9 | 20,5 | 22,7 | 49,7 |
| 5 | 142,1 | 94,3 | **1451,9** | 177,8 |
| 6 | 698,7 | 773,7 | **7383,6** | 842,0 |

**Un LCG bien elegido no sesga las permutaciones a ninguna `n` de este rango de uso. Uno
mal elegido falla de forma catastrófica desde `n = 5`.** El modo de fallo depende del
multiplicador, no de la familia.

Así que la razón de elegir mulberry32 no es que un LCG falle: es que **con mulberry32 no
hay multiplicador que elegir mal**. Cuatro líneas, se siembra con un entero de 32 bits sin
ceremonia, y su periodo es demostrable por aritmética modular en lugar de depender de una
constante que alguien tiene que acertar. En un proyecto sin dependencias, donde nadie va a
auditar una tabla de multiplicadores dentro de diez años, eso es el argumento.

> **Cuidado con el argumento que este párrafo sustituye**, porque es el que aparece en
> cualquier tutorial y es **falso en la dirección contraria**: que los bits bajos de un LCG
> tienen periodos cortos y que el barajado consume esos bits al multiplicar por un rango
> pequeño. `floor(r · m)` con `r = x/2³²` es `floor(x·m / 2³²)`, que depende de los bits
> **altos**; es la receta clásica para *evitar* los bajos.

**Ejemplo trabajado — canario de test.** `semilla = 42`, primeras seis salidas.
Verificadas ejecutando el bloque de código de arriba con `node`:

```
0.6011037519201636
0.44829055899754167
0.8524657934904099
0.6697340414393693
0.17481389874592423
0.5265925421845168
```

**Y `semilla = 0`**, canario de la guarda de entrada de la regla 6:

```
0.26642920868471265
0.0003297457005828619
0.2232720274478197
0.1462021479383111
```

Sirve doble: fija el comportamiento con la semilla mínima, y detecta una regresión de la
guarda, porque es exactamente la secuencia que produciría un `undefined` colado.

### F2 — `barajar(array, fuenteAleatoria)`: Fisher-Yates (Durstenfeld)

```js
function barajar(array, fuenteAleatoria) {
  const copia = array.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(fuenteAleatoria() * (i + 1));
    const tmp = /** @type {T} */ (copia[i]);
    copia[i] = /** @type {T} */ (copia[j]);
    copia[j] = tmp;
  }
  return copia;
}
```

> **Los dos casts no son opcionales.** Con `noUncheckedIndexedAccess`, que el
> `jsconfig.json` del proyecto activa, el intercambio destructurado en una línea
> —`[copia[i], copia[j]] = [copia[j], copia[i]]`— da dos `TS2322: Type 'T | undefined' is
> not assignable to type 'T'`. Los casts son correctos porque `i` y `j` están dentro de
> rango por construcción.

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `array` | T[], entrada | longitud `n` ≥ 0 | **No se muta** |
| `fuenteAleatoria` | función, entrada | `() → [0,1)` | Inyectada. Nunca `Math.random()` |
| `i` | int, interno | [1, n−1] | Índice descendente |
| `j` | int, interno | **[0, i]** | Rango de sorteo **decreciente con `i`** |
| valor devuelto | T[], salida | longitud `n` | Permutación |

**Rango de salida:** una de las `n!` permutaciones, **cada una con probabilidad
exactamente `1/n!`** si la fuente es uniforme. Con `n = 0` o `n = 1` devuelve el array
sin cambios. Consume `max(0, n − 1)` llamadas a la fuente: la fórmula `n − 1` sin la
guarda daba **−1 para `n = 0`**, y el conteo real es 0.

**Por qué el rango de sorteo tiene que decrecer, y qué pasa si no.** La implementación
ingenua más común sortea `j` sobre el **rango completo** en cada iteración
(`floor(r * n)` en lugar de `floor(r * (i+1))`). Eso produce `nⁿ` resultados de sorteo
equiprobables mapeados sobre `n!` permutaciones — y para `n ≥ 3`, `n!` no divide a `nⁿ`,
así que **el mapeo no puede ser uniforme**: algunas permutaciones salen más que otras.

El sesgo es invisible a inspección casual y solo se detecta contando. En este producto
eso significa que **qué distractores ve el paciente dejaría de ser uniforme sin que
ningún test funcional lo notara** — una contaminación silenciosa de la medición, que es
la clase de defecto que este proyecto ya ha encontrado tres veces.

Reducir el rango a `i + 1` — el tamaño de la porción todavía no fijada — hace que el
mapeo sea exactamente `n!` resultados, uno por permutación.

**Relación con F3 del sistema 1.** Esta es la primitiva de "muestreo sin reemplazo con
techo duro por semilla" que esa fórmula exige: devuelve una permutación completa del
pool, de la que el sistema 8 toma los primeros `distractores(C)` elementos. **La política
de agotar y rebarajar es del sistema 8**, no de aquí; este sistema entrega la primitiva y
su garantía de uniformidad.

> **El agotamiento vive dentro de un solo tablero, no entre tableros.** El sistema 1 pide
> "techo duro **por semilla**", y una semilla es un tablero: en el nivel visual el pool son
> 23 elementos y el tablero pide hasta 90 señuelos, así que hacen falta cuatro pasadas —
> `ceil(90/23) = 4 = Rmax`, de donde sale `clusterMin = 24` (recalculada a **16** el
> 2026-09-01, ADR-0006). El cursor nace y muere dentro
> de un tablero, y no hay nada que registrar aparte de la semilla.
>
> Decirlo "entre tableros consecutivos" importaría un cursor que sobrevive a la generación
> de un tablero, y eso **sí** rompería la reproducibilidad por semilla de F3.

**El extremo superior del rango, probado y no supuesto.** `r_max = (2³²−1)/2³²`, y
`floor(r_max · n)` da `n − 1` para toda `n` de este proyecto: la distancia a `n` es
`n · 2⁻³²` y el medio-ULP es `n · 2⁻⁵³`, veintiún órdenes binarios de margen,
independiente de `n`. Comprobado hasta `n = 10⁶`. **F2 nunca produce un índice fuera de
rango.**

> **Trampa para quien escriba los tests de F2.** Una fuente constante *cercana a 1* hace
> que `j = i` en cada iteración, así que `barajar` devuelve la **permutación identidad**:
> llama a la fuente el número correcto de veces, devuelve un array del tamaño correcto y
> **no reordena nada**. Comprobado: con `r_max` fijo, `['a','b','c','d','e']` sale
> `abcde`. Un test escrito con esa constante pasa sin verificar nada. Con `0,42` sale
> `eadbc` y con `0` sale `bcdea`.

**Ejemplo trabajado**, `['tomate','cereza','fresa','pera','uva']` con la fuente de F1 y
`semilla = 42`. Verificado ejecutando el bloque de código de arriba con `node`:

| `i` | `fuenteAleatoria()` | `j` | Intercambio |
|---|---|---|---|
| 4 | 0,601104 | 3 | `[4] ↔ [3]` |
| 3 | 0,448291 | 1 | `[3] ↔ [1]` |
| 2 | 0,852466 | 2 | sin efecto |
| 1 | 0,669734 | 1 | sin efecto |

Resultado: `['tomate', 'uva', 'fresa', 'cereza', 'pera']`.

### F3 — `semillaProduccion()`: de dónde sale la semilla real

> **Excepción declarada a la norma de fórmulas del proyecto**, mismo precedente que F4
> del sistema 2: el dominio es un único punto de entrada impuro, no una relación
> numérica. La tabla es su especificación completa.

```js
function semillaProduccion() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const semilla = buf[0];
  if (semilla === undefined) throw new Error('semillaProduccion: crypto no devolvio valor');
  return semilla;
}
```

> **La versión de una línea no compila, y el arreglo cómodo está prohibido.**
> `crypto.getRandomValues(new Uint32Array(1))[0]` tipa `number | undefined` bajo
> `noUncheckedIndexedAccess`: `TS2322`. Y `?? 0` es la misma forma que el patrón vetado de
> `Math.min()` sin guarda de conjunto vacío — un dato ausente convertido en un valor de
> aspecto válido. Aquí ese valor sería **la semilla 0**, o sea el mismo tablero en cada
> sesión, indistinguible de uno legítimo. Tiene que lanzar.

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| valor devuelto | uint32 | [0, 4294967295] | Nueva semilla. **Una llamada por tablero** |

**Vive exclusivamente en el módulo impuro.** Web Crypto es una API nativa del navegador,
no una dependencia — el mismo razonamiento que ADR-0003 aplicó a `canvas.getImageData`:
el navegador ya trae la capacidad, así que no hay nada que empaquetar ni mantener.

**Por qué esta fuente y no `Date.now()`: la granularidad.** F3 declara una llamada por
tablero, y `Date.now()` tiene resolución de milisegundo: dos tableros generados en el mismo
milisegundo — precargar dos, o un terapeuta avanzando rápido — **reciben la misma semilla y
producen el mismo tablero**. Y un tablero repetido no es un fallo visible: es contaminación
por habituación entrando en el registro como dato clínico limpio.

Nada de esto exige que el generador sea criptográfico. **Sembrar un generador rápido con
una fuente fuerte es la práctica normal**: la propiedad que se compra es unicidad de la
semilla, no imprevisibilidad de la secuencia.

**Y la salida de este generador no vale para nada que deba ser imprevisible.** Ni tokens,
ni códigos de emparejamiento, ni identificadores. mulberry32 tiene 32 bits de estado y se
recupera por fuerza bruta en tiempo trivial. Hoy no importa — sin puntuación comparativa
ni competición no hay nada que ganar adivinando el siguiente señuelo — pero el Nivel 3 del
roadmap introduce un dispositivo acompañante, y el error previsible es reutilizar esta
fuente porque "ya resuelve la aleatoriedad". Esas necesidades llaman a
`crypto.getRandomValues` directamente.

**Una semilla por tablero, no por sesión.** Decidido así: el módulo impuro llama una vez
justo antes de generar cada tablero, y el sistema 9 graba esa semilla junto al tablero.
Reproducir un tablero histórico es `crearFuenteAleatoria(semillaGuardada)` y repetir la
lógica de generación — **sin necesidad de rastrear cuántas llamadas se consumieron
antes**, porque cada tablero tiene su propio origen.

Una semilla de sesión con descuento de posición habría sido más compacta, pero introduce
un subsistema de seguimiento de desplazamiento que un sistema de esfuerzo `S` no
necesita.

**Ningún otro módulo de `src/` puede llamar a `semillaProduccion()`.** Todo lo demás
recibe `fuenteAleatoria` ya construida, como parámetro.

### F4 — Los dos relojes: interfaces, no fórmulas numéricas

> Misma excepción declarada que F3.

**Los dos son objetos, no funciones desnudas.** La primera redacción los escribía como
funciones y AC-7 los describía como objetos con `now()`. Se elige el objeto: `{ kind, now }`
es más legible en la firma del consumidor y no necesita `Object.assign` para llevar la
marca.

```js
/** @typedef {{ kind: 'monotono', now: () => number }} RelojMonotono */
/** @typedef {{ kind: 'pared',    now: () => number }} RelojPared */

const relojMonotono = { kind: 'monotono', now: () => performance.now() };
const relojPared    = { kind: 'pared',    now: () => Date.now() };
```

| Interfaz | Salida | Resolución | Uso permitido | Uso PROHIBIDO |
|---|---|---|---|---|
| `relojMonotono.now()` | float ms, **no decreciente** | **Depende del navegador y de la política de privacidad. Ver abajo** | Duraciones: latencia por objetivo (sistema 9), temporizador de permanencia (sistema 5) | **Nunca** como marca de calendario. Su origen no está anclado a una fecha y puede diferir entre cargas |
| `relojPared.now()` | epoch ms UTC, **puede saltar** | 1 ms | Marcas de calendario: inicio y fin de sesión | **Nunca** para medir una duración ni una diferencia entre dos lecturas |

**La resolución del reloj monótono es un hueco que hay que cerrar antes de confiarle el
presupuesto de latencia.** La primera redacción documentaba tipo, signo y monotonicidad
con precisión quirúrgica y **nada** sobre granularidad, y eso es un problema concreto:
`performance.now()` está deliberadamente degradado en resolución como mitigación de
Spectre, y el grado depende del navegador, del modo de privacidad y del aislamiento
cross-origin. En los modos de privacidad reforzada puede llegar al orden de **100 ms** —
**el mismo orden que el presupuesto de latencia que este proyecto declara el más
importante de los tres**. Un reloj así no puede medir ese presupuesto.

Queda como entrada obligatoria de `/test-setup`: **medir la resolución real en el
navegador y el hardware de la tableta de consulta**, y anotarla aquí. No es una
suposición que se pueda dejar implícita.

**`retiredAt` ya no figura como consumidor del reloj de pared en `src/`.** Según ADR-0001
el único escritor de entradas del manifiesto es `tools/banco/importar.js`, que está en
`tools/` y por tanto exento de la regla 1. Consecuencia útil: **el reloj de pared tiene un
solo consumidor en `src/`, el sistema 9.**

**Por qué la separación es estructural.** Un salto de reloj de pared — sincronización
horaria, cambio de hora estacional, o alguien ajustando la hora del sistema — mueve
`ahoraPared()` hacia atrás o adelante **sin que transcurra tiempo real**. Dos
consecuencias concretas:

- Si el temporizador de permanencia del sistema 5 midiera con el reloj de pared, un salto
  podría **disparar la activación antes de tiempo o congelarla**.
- Si la latencia del sistema 9 se midiera con el reloj de pared, un salto a mitad de
  medición **corrompería el dato de un paciente real en silencio** — el número seguiría
  teniendo forma de latencia válida, así que ni el terapeuta ni el sistema lo detectarían.

Dos relojes con contratos distintos, en lugar de uno con una norma de "úsalo con
cuidado", es lo que hace la separación comprobable en vez de dependiente de que nadie se
despiste.

**El presupuesto de latencia del proyecto** — menos de 100 ms entre toque y acuse de
recibo — se mide con `ahoraMonotono()`, nunca con el de pared. Es la razón de ser de ese
reloj.

### F5 — `envolverConValidacion(fn)`: el acuñador único

> Misma excepción declarada que F3 y F4: el dominio es un contrato, no una relación
> numérica.

```js
/** @typedef {{ (): number, kind: 'aleatoria' }} FuenteAleatoria */

/** @param {() => number} fn @returns {FuenteAleatoria} */
function envolverConValidacion(fn) {
  const validada = () => {
    const v = fn();
    if (!(v >= 0 && v < 1)) throw new RangeError(`fuente aleatoria devolvio ${v}, se esperaba [0, 1)`);
    return v;
  };
  return /** @type {FuenteAleatoria} */ (Object.assign(validada, { kind: 'aleatoria' }));
}
```

Esta función pequeña hace tres cosas, y las tres verificadas compilando:

**Uno: da sujeto a la validación de la regla 2.** Sin ella, ningún código de este documento
comprobaba un valor: F1 genera el suyo por aritmética y F2 usa el resultado sin mirarlo.

**Dos: hace incompilable la fuente degenerada.** Una marca nominal funciona también sobre
un tipo invocable, así que `() => 0.42` deja de valer donde se espera una fuente de
producción — y sigue valiendo en `tests/`, que es donde debe estar.

```
error TS2345: Argument of type '() => number' is not assignable to parameter of
  type 'FuenteAleatoria'.
  Property 'kind' is missing in type '() => number' but required in type 'FuenteAleatoria'.
```

`Object.assign` **sin** el cast no vale: `kind` se ensancha a `string` y falla con
`TS2322`. El cast es obligatorio y vive aquí, una sola vez. Aguas abajo no hay ninguno.

**Tres: deja la vigilancia en un grep en lugar de un analizador semántico.** `tsc` rechaza
el error accidental; lo único que queda es la **falsificación deliberada** de la marca, y
forjarla obliga a escribir uno de estos literales:

| Literal | Por qué delata |
|---|---|
| `envolverConValidacion` | El nombre del acuñador, fuera del borde impuro |
| `FuenteAleatoria`, `RelojMonotono`, `RelojPared` | El cast del tipo marcado |
| `kind: 'aleatoria'`, `kind: 'monotono'`, `kind: 'pared'` | La propiedad, escrita a mano |

Es la misma infraestructura que AC-1 ya usa, con una lista de literales nueva: **el sistema
14 gana cero capacidad.** La alternativa — vigilar "una función flecha conectada a un
parámetro de fuente" — es resolución de firmas, exige la API del compilador, y subiría el
sistema 14 de esfuerzo M a L.

Tercera vez en este proyecto que la respuesta a "análisis semántico contra nada" es **hacer
la cosa greppable por construcción**: los contenedores hermanos del sistema 2, el marcador
de exención de AC-2, y ahora la marca.

### Tuning Knobs de esta sección

**Ninguna.** La constante de mezcla de F1, el algoritmo de F2, las fuentes de entropía de
F3 y F4 y el rango que valida F5 son decisiones de ingeniería fijas, no parámetros
clínicos ni de producción.
**No hay ningún valor aquí que el terapeuta, el diseño de contenido o una perilla de
dificultad deban tocar**, y eso es coherente con lo que este sistema es.


## Edge Cases

- **Si el reloj de pared salta a mitad de sesión** (sincronización horaria, cambio de
  hora): **las latencias no se ven afectadas**, porque solo leen el monótono. Es el
  motivo de existir de la regla 3. Los sellos de fecha posteriores al salto quedan
  desplazados, y eso es aceptable: un sello sirve para ordenar sesiones, no para medir.
- **Si el reloj monótono retrocede**: no debería ocurrir con la fuente monótona real,
  pero si una diferencia sale negativa, el registro anota la latencia como **indefinida**
  y **no** como cero. Cero es un dato clínico plausible — un acierto instantáneo — y
  registrar un fallo del reloj como acierto instantáneo contaminaría la medición.
  **La guarda es del sistema 9**, no de aquí: ver la tabla "Qué NO es de este sistema".
- **Si `crypto.getRandomValues` no está disponible**: el borde impuro **falla de forma
  explícita al arrancar la sesión**, con un mensaje nombrado. Nunca degrada en silencio a
  `Date.now()`, porque eso reintroduciría la colisión de semillas por milisegundo que F3
  existe para evitar. `getRandomValues` **no exige contexto seguro** — es el único miembro
  de `Crypto` exento, a diferencia de `crypto.subtle` y de `crypto.randomUUID` —, así que
  funciona sobre HTTP plano y desde `file://`. El riesgo real no es el protocolo: es un
  navegador empobrecido en una tableta vieja, y el modelo de despliegue del proyecto es
  copiar archivos al equipo que haya en la consulta.
  > **Corolario, y es una trampa de mantenimiento:** F3 usa `getRandomValues`, no
  > `randomUUID`. "Simplificar" hacia `randomUUID` introduciría el requisito de contexto
  > seguro que hoy no existe.
- **Si un registro histórico no tiene semilla** (por venir de una versión anterior): se
  muestra como **no reproducible**. Nunca lanza excepción. Mismo principio que el `id`
  desconocido del sistema 1: un dato antiguo incompleto es aceptable, una pantalla que se
  rompe al abrirlo no.
- **Si la semilla existe pero la versión de esquema del manifiesto ha cambiado**: se
  muestra como **reproducible solo aproximadamente**, con la versión anotada. **Esa
  decisión es del sistema 9**, y aquí se anota solo porque este sistema le entrega la
  semilla. La primera redacción la justificaba invocando "la regla 7", que no existía: era
  una referencia colgante a una regla que la propia autoría había eliminado.
- **Si un test inyecta una fuente constante** — por ejemplo, siempre 0,42: es legítimo y
  necesario para aserciones exactas. Y ya **no compila** si alguien la conecta donde se
  espera una fuente de producción, porque le falta la marca. Ver F5.
- **Si un consumidor pide una diferencia de tiempo al reloj de pared**: el contrato del
  reloj de pared **no expone una operación de diferencia**. No es una convención que
  alguien deba recordar: la operación no existe.

## Dependencies

**Dependencias de entrada: ninguna.** Capa Foundation, y por eso va tercero en el orden
de diseño.

**Sistemas que dependen de este**, todos con dependencia **dura**:

| Sistema | Prioridad | Qué necesita |
|---|---|---|
| 5 · Adaptación de entrada | MVP | Reloj monótono |
| 8 · Generación de tableros | MVP | Fuente aleatoria y barajado |
| 9 · Registro | MVP | Los dos relojes, más la semilla |
| 14 · Invariantes de CI | MVP | Las reglas 1 y 4, para hacerlas cumplir |
| 22 · Transcribir símbolos | MVP | Fuente aleatoria |
| 23 · Precio justo | MVP | Fuente aleatoria |
| 28 · Rellenar palabras | MVP | Fuente aleatoria |
| 29 · Ordenar palabras | MVP | Fuente aleatoria y barajado |
| 30 · Juego de comprar | MVP | Fuente aleatoria y barajado |
| 31 · Tres en raya | MVP | Fuente aleatoria, **también para las jugadas de la máquina** |

| 1 · Manifiesto | MVP | **Dependencia de tipos, no dura**: el typedef `FuenteAleatoria` |
| 10 · Instrumento Busca | MVP | **La raíz de composición.** Construye la fábrica y reparte los valores |

**Consistencia bidireccional: comprobada ejecutando la comprobación, no afirmada.** Los
sistemas 5, 8, 9 y 22 ya declaraban el 3. El **14 no lo declaraba** y debía — corregido
en el índice. El **12 tampoco, y es correcto**: consume vía el 9.

**Actualizado el 2026-09-01** al documentar los seis instrumentos que faltaban. Los seis
declaran el 3, y el 22 se corrige de Alpha a MVP: está jugable. El **32** no aparece en esta
tabla y es correcto — el eje de contenido no lee ninguna fuente no determinista: recibe el
identificador de la variante como parámetro.

**Y la comprobación tenía un punto ciego que la revisión encontró.** Preguntaba "quién
consume" y nunca "quién construye y reparte". Con la raíz de composición adjudicada al
sistema 10, su fila del índice gana el 3; y con la marca nominal, el sistema 1 gana una
dependencia de tipos. Dos filas que ninguna cantidad de comprobación en el eje del consumo
habría encontrado.

## Tuning Knobs

**Casi ninguna, y eso es lo correcto para este sistema.**

| Perilla | Rango | Propuesto | Nota |
|---|---|---|---|
| Semilla de producción | entero | derivada al arrancar la sesión | Ver Formulas. No la fija una persona |
| Semilla de test | entero | fija por test | Es lo que hace exactas las aserciones |

No hay perillas clínicas aquí. Si aparece una, pertenece a otro sistema.

## Visual/Audio Requirements

**No aplica.** No tiene representación.

## UI Requirements

**Ninguna propia.** Un requisito indirecto para el sistema 12: si un registro histórico
no es reproducible — sin semilla, o con la versión del manifiesto cambiada — la pantalla
de resultados debería poder decirlo, en lugar de ofrecer una reproducción que no
reproduce.

## Acceptance Criteria

> Validados por `qa-lead`, revisados por `qa-tester`. **Regla de propiedad, igual que en
> los sistemas 1 y 2:** lo que verifica una propiedad del **código fuente** se declara
> aquí y lo hace cumplir el **sistema 14**. Lo que verifica el **comportamiento** de este
> sistema es suyo.
>
> **Ninguno de estos criterios se puede ejecutar hoy**, y no es un defecto de este
> documento: es una propiedad de todo GDD de capa Foundation en este proyecto, que se
> diseña antes de que exista el código. El bloqueante compartido es `/test-setup`. Lo que
> **sí** es un problema de proyecto, y más grave, está al final de esta sección.

### Invariantes de arquitectura — declaradas aquí, exigidas por el sistema 14

**AC-1 — Ninguna llamada directa a una fuente no determinista fuera del borde impuro** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de **`src/`** fuera de `src/plataforma/borde-impuro.js`,
**CUANDO** un análisis léxico busca los seis literales de la regla 1 — `Math.random(`,
**`crypto.getRandomValues(`**, `Date.now(`, `new Date(`, `performance.now(` y
**`.timeStamp`** —,
**ENTONCES** no encuentra ninguna coincidencia; cualquiera rompe el build señalando
archivo y línea. El propio borde impuro está exento por definición.
*Excepción para `.timeStamp`: el borde de entrada del sistema 5 lo lee una vez y lo pasa
como dato. Ese archivo se declara exento en el GDD del sistema 5, no aquí.*

> **AC-2 cambió el 2026-08-26, y el cambio lo trajo el sistema 5.** La primera redacción
> contaba archivos exentos y exigía **exactamente 1**. El sistema 5 necesita un **segundo**
> borde —`src/entrada/borde-eventos.js`— para leer `event.timeStamp` una vez y pasarlo como
> dato, así que el conteo dejaba de servir.
>
> Se sustituye por una **lista blanca por archivo, cada uno con sus literales permitidos**, y
> es **más estricto que el conteo, no menos**: con un solo número, el borde impuro podía leer
> `.timeStamp` y nadie lo veía. Ahora cada borde solo puede tocar lo que su razón de existir
> justifica.

**AC-2 — La lista de bordes exentos es exactamente la declarada** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de **`src/`** — no "el código fuente": `tools/` está exento por ADR-0003 —,
**CUANDO** se comparan los archivos con el marcador `@borde-impuro` contra la lista blanca,
**ENTONCES** los dos conjuntos coinciden **exactamente**, y cada archivo solo contiene los
literales que su entrada de la lista le permite:

| Borde | Literales permitidos |
|---|---|
| `src/plataforma/borde-impuro.js` | Las cinco fuentes no deterministas más los temporizadores |
| `src/entrada/borde-eventos.js` | **`.timeStamp` y nada más** |

Un archivo marcado que no esté en la lista, uno de la lista sin marcador, o un literal fuera
de su entrada, rompen el build nombrando el archivo y la línea.
*El conteo por sí solo no basta: si la exención es una marca que el propio archivo se pone,
un archivo trivial marcado, con la lógica real sin marcar en otro sitio, **pasaría AC-1 y
AC-2 a la vez**. Anclar la ruta lo cierra. Y AC-2 existe porque fragmentar el borde es la
forma de cumplir la regla 1 a la letra e incumplirla en espíritu.*

**AC-2b — La marca no se falsifica fuera del borde impuro** · Análisis estático · **BLOCKING** · aplica el **sistema 14**
**DADO** el árbol de `src/` fuera del borde impuro, y `tests/` excluido,
**CUANDO** el análisis busca los literales de acuñación de F5 — `envolverConValidacion`,
los nombres de tipo `FuenteAleatoria`, `RelojMonotono` y `RelojPared` usados **como cast**,
y las propiedades `kind: 'aleatoria'`, `kind: 'monotono'`, `kind: 'pared'` escritas a mano —,
**ENTONCES** no encuentra ninguna coincidencia.
*Existe porque `tsc` cierra el error **accidental** y no el **deliberado**: un doble cast
compila, y es un atajo de depuración plausible. Un `@import` del typedef no es un cast y no
cuenta: se vigila la acuñación, no la lectura del tipo.*

### El contrato de la fuente aleatoria

**AC-3 — La aleatoriedad entra como parámetro marcado, nunca como dependencia implícita** · Tipo (`tsc --checkJs`) · **BLOCKING**
**DADO** `barajar`, la única función pública de este sistema que **consume** una fuente
inyectada — F1 recibe una semilla y F3 no recibe nada —,
**CUANDO** se inspecciona su firma JSDoc,
**ENTONCES** la fuente es un parámetro **obligatorio** de tipo `FuenteAleatoria`, no
`() => number`; llamarla sin él, o con una función desnuda, falla la compilación con
`TS2345`. **Ninguna firma importa un generador global** — y como la fábrica tampoco recibe
el manifiesto, estructuralmente no puede leerlo.
*Límite conocido, y por eso no va solo: `tsc` verifica **firma**, no **uso**. Una función
puede declarar el parámetro bien tipado y **no leerlo nunca**, llamando a `Math.random()`
dentro. Quien cierra eso es AC-1.*

**AC-4 — `envolverConValidacion` rechaza un valor fuera de `[0, 1)`** · Unit · **BLOCKING**
**DADO** `envolverConValidacion(fn)` con `fn` devolviendo `1.0`, `-0.001` y `NaN`,
**CUANDO** se invoca la fuente envuelta,
**ENTONCES** lanza `RangeError` en los tres casos, y su `.message` contiene el valor
recibido según `String(valor)` y la subcadena literal `[0, 1)`. Con `0.42` devuelve `0.42`
sin lanzar.
*El sujeto importa: sin F5 no existe ninguna función a la que inyectarle una fuente mala,
porque F1 genera su valor por aritmética y F2 usa el resultado sin comprobarlo.*

**AC-4b — `crearFuenteAleatoria` rechaza una semilla que no es un uint32** · Unit · **BLOCKING**
**DADO** las entradas `undefined`, `NaN`, `null`, `-1`, `3.7`, `4294967296` y `'42'`,
**CUANDO** se llama a `crearFuenteAleatoria` con cada una,
**ENTONCES** lanza `RangeError` en los siete casos, nombrando el valor. Con `0` y con
`4294967295` no lanza.
*Sin la guarda, `semilla >>> 0` coerciona en silencio y las cuatro primeras entradas
producen la **misma secuencia exacta** que `semilla = 0`. Con el caso límite del registro
histórico sin semilla, un `undefined` fugado reconstruye un tablero con semilla 0 y **lo
presenta como reproducción correcta**.*

### Reproducibilidad por semilla

**AC-5 — Semilla fija, secuencia exactamente reproducible** · Unit · **BLOCKING**
**DADO** una semilla fija y dos llamadas independientes al generador con esa semilla,
**CUANDO** se extraen **al menos 20** valores de cada secuencia,
**ENTONCES** los dos arrays son idénticos por `assert.deepStrictEqual`. **Nunca** una
aserción estadística tipo "la media se acerca a 0,5".
*El mínimo de 20 no es decorativo: con `N = 1` el criterio es casi trivial, y un bug de
aliasing — el estado `a` en el ámbito del módulo en lugar de dentro del cierre — no se
manifiesta hasta la segunda o tercera llamada.*

**AC-5b — Canario del PRNG, las dos semillas** · Unit · **BLOCKING**
**DADO** el algoritmo fijado en Formulas,
**CUANDO** se extraen los **seis** primeros valores con `semilla = 42` y los **cuatro**
primeros con `semilla = 0`,
**ENTONCES** los dos arrays coinciden elemento por elemento, por `assert.deepStrictEqual`,
con los arrays publicados en F1.
*El array de `semilla = 0` sirve doble: fija el extremo inferior y detecta una regresión de
la guarda de AC-4b, porque es la secuencia que produciría un `undefined` colado.*

**AC-6 — La semilla nunca queda inaccesible** · Unit · **BLOCKING**
**DADO** `crearFuenteDeProduccion()`, en el borde impuro,
**CUANDO** se invoca,
**ENTONCES** devuelve `{ semilla, fuenteAleatoria }`: la semilla como uint32 y la fuente
ya marcada y validada. Un consumidor no puede obtener una sin la otra.
*Apunta al envoltorio, no a `crearFuenteAleatoria`: F1 devuelve solo la función, y F2, el
ejemplo trabajado y AC-5b la invocan directamente. Es donde la semilla y la fuente nacen
juntas, y es lo único de la cadena de reproducibilidad que pertenece a este sistema — sin
esto, ni el 8 ni el 9 pueden cumplir su parte.*

### Los dos relojes

**AC-7 — Los dos relojes son tipos incompatibles, y la marca es obligatoria** · Tipo (`tsc --checkJs`) · **BLOCKING**
**DADO** que `RelojMonotono` y `RelojPared` llevan `kind` como **discriminante
obligatorio**, no como propiedad opcional, aunque los dos expongan `now(): number`,
**CUANDO** se pasa uno donde se espera el otro,
**ENTONCES** **falla la compilación** con `TS2345: Types of property 'kind' are
incompatible`. Y un fixture donde `kind` sea **opcional** debe **fallar este criterio**, no
pasarlo.
*La obligatoriedad no es un detalle de estilo: con `kind` opcional la comprobación
estructural sigue aceptando el intercambio y la marca es decoración. Este criterio se
blinda **antes** de degradar AC-8, porque AC-8 delega en él toda la prueba de inmunidad.*

**Este criterio es el que demuestra la separación de relojes.** Y el contraste explica por
qué importa: si alguien calculara una latencia con el reloj de pared durante un salto de
una hora hacia atrás, el resultado sería `16 − 3.600.000 = −3.599.984 ms`. **Una latencia
negativa entrando en el registro clínico de un paciente**, con forma de dato válido, que
ni el terapeuta ni el sistema detectarían. No hace falta un criterio de ejecución para
eso: aquí ese código **no compila**.

**AC-8 — El cálculo de latencia con el reloj monótono** · Unit · **BLOCKING**
**DADO** un `RelojMonotono` de prueba que avanza de `1000` a `1016` entre dos llamadas,
**CUANDO** se mide la latencia,
**ENTONCES** el resultado es **16**: signo positivo, orden de operandos correcto, sin
redondeo.

*Este criterio no prueba inmunidad a un salto, y no debe pretenderlo.* Añadirle un
`RelojPared` que salta no cambia nada: el 16 sale de `1016 − 1000` igual si el salto fuera
de cero, de una hora o de diez años, porque la función de latencia **ni siquiera recibe**
ese reloj. La inmunidad la prueba **AC-7**, en compilación. Esto es resta de enteros, y
vale como regresión barata: un error de signo cuesta poco y se paga en dato clínico.

**Lo que sí aporta este sistema:** sin un reloj inyectable, construir el escenario de un
salto exigiría esperar a que ocurra uno real o falsear un reloj global del entorno — la
dependencia oculta que la regla 1 prohíbe. Con el reloj como parámetro es una línea.

### Anti-pilar 2 — ningún límite de tiempo por defecto

> **AC-9 eliminado.** Exigía que nada expirase tras avanzar un reloj simulado 30 minutos, y
> estaba marcado BLOCKING.
>
> **Su sujeto es un temporizador real con expiración, y el anti-pilar 2 prohíbe los límites
> de tiempo activos por defecto.** No es el caso de "infraestructura que aún no existe":
> puede no existir nunca. Un semáforo BLOCKING que, si el diseño logra su objetivo, **nunca
> pasa a verde**, no es una puerta. Y su condición — "sin ninguna llamada real a
> `setTimeout`" — era inaplicable, porque ninguna regla los prohíbe todavía.
>
> **En su lugar:** cuando un sistema diseñe un temporizador real — el candidato es el 5, con
> la activación por permanencia —, su GDD incluye un criterio equivalente sobre el reloj
> monótono que este sistema entrega. El razonamiento ya vive en el punto 2 del Overview.

### Infraestructura que no existe todavía

| Falta | Compartido con |
|---|---|
| `tests/unit/`, `package.json` con `node:test` | Mismo bloqueante que los sistemas 1 y 2. Es `/test-setup` |
| **`typescript` instalado y con versión fijada** | **Ver el bloqueante de proyecto de abajo. No es de este sistema y le afecta más que nada** |
| **El módulo del borde impuro**, `src/plataforma/borde-impuro.js` — sujeto de todos los criterios | Nuevo de este sistema |
| Las tres marcas nominales, en `src/plataforma/esquema.js` | AC-3 y AC-7 dependen de que existan para poder fallar la compilación |
| **Un arnés de compilación NEGATIVA** — `@ts-expect-error` o un ejecutor que invierta el criterio de éxito | AC-7 es el primer criterio del proyecto que exige que un fixture **no** compile. Es un mecanismo distinto del arnés positivo que usa AC-3, y no estaba declarado |
| **El mecanismo de marcado de exención** que AC-2 cuenta: ¿comentario pragma, o lista en la configuración del sistema 14? | Sistema 14. AC-2 no es implementable sin elegirlo |
| El análisis léxico de AC-1, AC-2 y AC-2b | Extensión del que ya usan los sistemas 1 y 2: tres listas de literales sobre infraestructura existente del sistema 14 |
| **La medición de la resolución real de `performance.now()`** en el navegador y el hardware de la tableta | `/test-setup`. Sin ese número, el presupuesto de latencia no tiene reloj demostrado. Ver F4 |

**Y una simplificación real que aporta el esfuerzo `S`: ningún criterio de este documento
necesita Playwright.** A diferencia de los sistemas 1 y 2, este sistema no tiene
superficie de render.

### Bloqueante de proyecto, no de este documento

**No hay `package.json` ni `typescript` en el repositorio** — ni local, ni global, ni en
`node_modules`. Así que `npx tsc --checkJs --noEmit`, la única comprobación que `CLAUDE.md`
impone al proyecto entero, **no se ha ejecutado nunca**. Tres GDD declaran criterios
BLOCKING de tipo `tsc --checkJs`; ninguno se ha corrido.

Y sin versión fijada, `npx` trae hoy la **7.0.2**, que es la reimplementación nativa: un
cambio de motor de versión mayor en la puerta de calidad de todo el proyecto, sin que nadie
lo haya decidido.

Hay un segundo hueco en la misma configuración. `moduleResolution: "Bundler"` **no exige la
extensión `.js`** en los imports, aunque el comentario del propio `jsconfig.json` la declara
obligatoria porque el navegador la necesita. Comprobado: `import './mod-a'` sin extensión
compila sin un solo error. La norma no la vigila nadie, y su modo de fallo es un **404 en la
tableta de la consulta**. Con `"NodeNext"` o `"Node16"`, `tsc` lo marcaría.

Los tres van a `lead-programmer` y a `/test-setup`. **No condicionan la aprobación de este
documento; condicionan `/gate-check`**, porque una puerta que pasa con tres criterios
bloqueantes jamás ejecutados es un adorno.

## Open Questions

| Pregunta | Quién resuelve | Cuándo |
|---|---|---|
| ¿Hace falta reproducir tableros en el Nivel 0? | Producto | El Nivel 0 no tiene persistencia, así que la semilla no sobrevive a la recarga. Registrarla sigue siendo correcto — cuesta un entero — pero su valor llega con el Nivel 1 |
| ¿Qué resolución real tiene `performance.now()` en la tableta de la consulta? | `/test-setup`, midiéndolo | Si la granularidad es peor que unos pocos milisegundos, el presupuesto de latencia de menos de 100 ms no tiene reloj que lo mida. Ver F4 |
| ¿El objeto semilla más configuración de una sesión necesita marca de tipo propia? | Sistema 9, o el 19 al diseñar la sincronización | Los presets del terapeuta se sincronizan desde el Nivel 1; los datos del paciente **nunca** salen del dispositivo. Si los dos objetos comparten forma estructural, un futuro import o export puede confundirlos — el mismo peligro que la marca nominal cierra para los relojes |

> **La pregunta "¿por sesión o por tablero?" se eliminó: F3 ya la decide** — por tablero, y
> con el argumento escrito. Dejarla abierta invitaba a redecidir algo cerrado.
