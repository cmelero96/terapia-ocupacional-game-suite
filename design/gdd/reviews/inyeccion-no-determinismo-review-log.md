# Review Log — `design/gdd/inyeccion-no-determinismo.md`

---

## Review — 2026-08-26 — Verdict: NEEDS REVISION (cambios aplicados)

Scope signal: **S**

Specialists: `systems-designer`, `technical-director`, `qa-tester`, `security-engineer`.
Síntesis sénior: `creative-director`.

**`lead-programmer` y `qa-lead` fueron excluidos del panel** porque habían escrito las
secciones de Fórmulas y Criterios de Aceptación respectivamente.

Hallazgos: ~30 | Bloqueantes: 7 | Fórmulas: **4 → 5** | Reglas: **6 → 7** |
Criterios: 10 → 11 (AC-9 eliminado, AC-2b y AC-4b añadidos)

### Resumen

**Ninguna de las cinco proposiciones centrales cayó.** La inyección por parámetro fue
atacada contra dos alternativas concretas y sobrevivió **cuantificada**: la cadena más
profunda del MVP tiene tres saltos, y ninguna firma necesita dos de las tres capacidades a
la vez, así que el peor caso gana **un** parámetro. Los dos relojes con marca nominal
sobreviven y la técnica se extiende a la fuente aleatoria. Fisher-Yates con rango
decreciente, una semilla por tablero y mulberry32 sobreviven los tres.

No hubo rediseño. Hubo **dos decisiones que retomar** — la marca nominal y
`event.timeStamp` — y unas veinticinco correcciones.

### El único cambio que este documento tenía que sufrir

> **La lista de fuentes prohibidas es lo único que este sistema posee en exclusiva, y le
> faltaba la entrada que ninguna de sus tres puertas podía ver: `event.timeStamp`.**

Es un `DOMHighResTimeStamp` con el mismo origen que `performance.now()`, viene en todo
evento de puntero, y **es más preciso que llamar al reloj dentro del manejador** porque
marca el evento de hardware en lugar de incluir la latencia de despacho. Es exactamente lo
que un programador escribiría en los sistemas 5 y 9. Y era invisible a las tres puertas
del documento: no está en la lista léxica de AC-1, no es una firma para AC-3, no es un
objeto al que ponerle marca.

**La resolución no fue prohibirlo.** Prohibirlo degradaría justo la medida que el
presupuesto de 100 ms necesita. Entra **como dato dentro del evento adaptado** que produce
el sistema 5, con una condición dura: una latencia solo se calcula entre dos valores del
**mismo** origen de reloj.

El sénior lo declaró **más débil que el cambio único del sistema 2**, y con razón: allí un
pilar estaba incumplido por construcción y el arreglo era una sustracción. Aquí no hay
pilar roto — este sistema no implementa ninguno — y el arreglo son dos frases. Gana a la
raíz de composición, que es el hueco estructural mayor, por el criterio que este proyecto
ya usó para elevar la guarda de `Math.min()`: **la raíz de composición es un hueco que el
implementador choca el primer día; `event.timeStamp` es un hueco que nadie nota nunca**,
hasta que un terapeuta compara dos sesiones medidas de forma distinta.

### Adjudicación de los dos puntos de decisión

| Punto | Fallo |
|---|---|
| **Marca nominal en la fuente aleatoria** | **Se marca.** El precio es real en el índice y **nulo en el artefacto**: un `@import` de JSDoc vive dentro de un comentario y se borra al servir el archivo. El sistema 1 pasa a "cero dependencias de runtime, una de tipos", y su razón de ser Foundation no se toca — es Foundation porque **no obtiene** la fuente, no porque no sepa nombrar su tipo. La alternativa metía `typescript` en `tools/` y subía el sistema 14 de M a L. → **ADR-0004** |
| **AC-2b, la barrera de fuente fija** | **Entra, con el cuerpo reescrito contra los literales de la marca.** `technical-director` gana el coste, `qa-tester` gana el principio: `tsc` cierra el error accidental y no el deliberado, y "promesa en prosa sin criterio" es el patrón que este proyecto ya ha castigado dos veces |

### Los siete bloqueantes

| # | Hallazgo | Arreglo |
|---|---|---|
| 1 | `event.timeStamp` ausente del documento | Regla 7 nueva, más el literal en AC-1 |
| 2 | Falta la raíz de composición: el documento nombra quién *construye* y nunca quién *reparte* | Fábrica impura (del 3, ruta declarada) separada de raíz de composición (**adjudicada al sistema 10**) |
| 3 | **AC-4 no tiene sujeto invocable** | F5, `envolverConValidacion` |
| 4 | La premisa de una sección de 20 líneas es falsa | Refutada compilando; sustituida por F5 |
| 5 | La semilla no valida su entrada | Guarda en F1, más AC-4b |
| 6 | **F2 y F3 no compilan** | Tres sentencias con casts en F2; lanzar, no `?? 0`, en F3 |
| 7 | AC-6 contradice el retorno de F1 | F1 se queda; AC-6 apunta a `crearFuenteDeProduccion` |

### El hallazgo que convergió desde dos dominios

`qa-tester` y `technical-director`, con contexto limpio y encargos distintos, llegaron por
separado a que **AC-4 no tiene función sujeto** y **coincidieron en el arreglo**: un
envoltorio de validación nombrado en el borde impuro. Fue la señal más fiable del panel.

Y el diagnóstico es más duro que el de la revisión principal, que sospechaba que el punto
de validación estaba mal ubicado: *"no existe en ningún código mostrado, ni bien ni mal
ubicado"*. Eso vaciaba el arreglo estrella de la autoría — la regla 2 convertida en
invariante ejecutable.

### Hallazgos equivocados, exagerados o peligrosos aplicados a la letra

| Hallazgo | Corrección |
|---|---|
| **Prohibir `setTimeout`, `setInterval` y `requestAnimationFrame`** | **El más peligroso del panel si se aplica hoy.** Prohíbe la única primitiva de programación del navegador **antes de que exista el contrato del programador inyectable**, que es del sistema 5 y no está diseñado. El sistema 5 no podría implementar la activación por permanencia, o se inventaría una exención ad hoc — lo que AC-2 existe para impedir. **Entran el día que ese contrato aterrice**, y la fila está reservada |
| **El argumento del LCG, y sus dos sustitutos** | El documento decía que los bits bajos de un LCG tienen periodo corto y que el barajado consume esos bits al multiplicar por `(i+1)`. **Está invertido.** `floor(r·m)` con `r = x/2³²` es `floor(x·m/2³²)`, que depende de los bits **altos**; verificado: `floor(r·2)` es bit a bit idéntico al bit más significativo, y `floor(r·5)` no cambia al borrar los diez bits bajos en **200000 de 200000 muestras**. Pero **borrarlo sin sustituto es la regresión**: el siguiente lector simplifica a un LCG de una línea citando esta revisión. Y el sustituto que propuso el sénior — correlación serial que se mapea sobre sesgo de permutación — **tampoco está demostrado**: 2000000 de barajados con chi cuadrado dan `LCG estándar 94,3` contra `mulberry32 142,1` a `n = 5`, umbral 177,8, o sea **ningún sesgo detectable en ninguno de los dos**. El que sí sesga es RANDU, un LCG mal elegido: **1451,9**. El argumento verdadero, y el que se publicó, es que **el modo de fallo depende del multiplicador y no de la familia**, y con mulberry32 no hay multiplicador que elegir mal |
| **Prohibir `event.timeStamp` a secas** | Degradaría la medida. Ver el cambio único |
| **"Con la marca, la barrera del 14 casi desaparece"** | Correcto en el coste, **sobrevendido en el residuo**: la marca mata el error accidental, no el deliberado. `/** @type {FuenteAleatoria} */ (() => 0.42)` compila, y es un atajo de depuración plausible. De ahí AC-2b |
| **"AC-8 es trivial, la inmunidad la prueba AC-7"** | Cierto **solo si `kind` es discriminante obligatorio** — riesgo que el propio `qa-tester` levanta dos viñetas después. Los dos hallazgos interactúan: declarar AC-8 decorativo con AC-7 sin blindar deja cobertura cero. Orden obligatorio, aplicado: primero blindar `kind`, después degradar AC-8 |
| **La corrección del horario de verano** | Correcta — `Date.now()` es epoch UTC y el cambio estacional solo afecta al formateo — y **dejaba huérfana la cifra insignia**: un paso NTP típico corrige milisegundos, no una hora. La causa que sí produce horas: **una tableta que pasa semanas apagada, con el reloj de tiempo real desviado, y da la corrección de golpe al reconectarse** |
| **"0 de los 10 criterios se pueden ejecutar hoy"** | Cierto y **mal facturado a este documento.** Todo GDD de capa Foundation lo tiene por construcción: el sistema 3 se diseña tercero de diecinueve, a propósito. Es el bloqueante de proyecto, no un defecto del GDD |
| **La doble numeración del índice** | Real, con **impacto actual cero** porque los tres GDD usan Enumeration de forma consistente. Arreglada en el índice, no en el GDD |

### El patrón del proyecto va por su cuarta aparición, y mutó

Este es el primer documento que **existe** para cerrarlo, y su regla 3 lo cierra por
construcción para el caso canónico. Pero aparece dos veces más y la regla 3 no ve ninguna:

| Instancia | Entrada del entorno | ¿La ve la regla 3? |
|---|---|---|
| `event.timeStamp` | Reloj sin inyectar | No: no es sintácticamente una lectura de reloj |
| **Granularidad de `performance.now()`** | Navegador y política de privacidad. Hasta ~100 ms en modos de privacidad reforzada | No: es el reloj **correcto** con la precisión equivocada |

De *"parámetro equivocado"* a *"parámetro correcto, precisión equivocada"*. Y la clase de
puerta que este proyecto construye — marcas nominales, greps léxicos, comprobación de
tipos — **no puede ver precisión**.

Regla para los GDD siguientes: **cuando un sistema exponga una medida, declara su
resolución, no solo su unidad y su signo.** F4 documentaba tipo, signo y monotonicidad con
precisión quirúrgica y **nada** sobre granularidad.

### Y el segundo patrón es sobre el documento mismo, en su segunda aparición

La revisión del sistema 2 ya lo nombró: *"el documento sobredeclaraba su propio rigor"*, y
*"una afirmación de rigor sin regresión es peor que no afirmar nada, porque desactiva la
sospecha del siguiente lector"*.

Aquí: **dos de tres fórmulas no compilan** contra la puerta obligatoria del proyecto, el
argumento insignia está invertido, el arreglo insignia no tiene sujeto, y AC-9 era BLOCKING
para un sujeto que el anti-pilar 2 puede impedir que exista jamás.

Y lo venenoso es específico de esta aparición. **El documento sí verificó por ejecución** —
el canario de la semilla 42 es exacto, la traza de F2 es exacta, la corrección del décimo
decimal es real — y usó la credibilidad de esa verificación como manta sobre lo que no
verificó. *"Una afirmación de rigor parcialmente verdadera es más peligrosa que una falsa,
porque sobrevive a la comprobación al azar."* El párrafo que celebraba el décimo decimal,
junto a tres fórmulas cuya puerta nunca se corrió, es el retrato del modo de fallo.

**Se borró, no se suavizó** — mismo tratamiento que *"las seis fórmulas se verificaron
ejecutándolas"* recibió en el sistema 2. Salen los dos párrafos meta de "la primera
redacción decía", la celebración del décimo decimal y su cuenta de cifras incorrectas,
*"no es una preferencia: es el argumento concreto"*, y *"este criterio es el que demuestra
por qué existe el sistema"*.

**Y ocurrió una tercera vez durante la propia aplicación.** Al escribir el canario de
`semilla = 0` que AC-5b necesita, la sesión iba a publicar cuatro valores de memoria en
lugar de calcularlos. Los cuatro estaban mal, del octavo decimal en adelante. Se detectó
ejecutándolos — dentro de la misma edición que borraba el párrafo de autoelogio sobre ese
mismo defecto.

**Norma nueva del proyecto, que sale de aquí:** ningún GDD publica un bloque de código o
una fórmula cuyo método de verificación declarado sea compilación o ejecución sin que se
haya hecho.

### Bloqueante de proyecto, descubierto por el panel y fuera de este documento

**No hay `package.json` ni `typescript` en el repositorio** — ni local, ni global, ni en
`node_modules`. `npx tsc --checkJs --noEmit`, la única comprobación que `CLAUDE.md` impone
al proyecto entero, **no se ha ejecutado nunca**, y tres GDD ya declaran criterios BLOCKING
que dependen de ella.

Sin versión fijada, `npx` trae hoy la **7.0.2**, la reimplementación nativa: un cambio de
motor de versión mayor en la puerta de calidad, sin decisión.

Y un segundo hueco en la misma configuración: `moduleResolution: "Bundler"` **no exige la
extensión `.js`**, aunque el comentario del propio `jsconfig.json` la declara obligatoria.
Comprobado: `import './mod-a'` compila sin un error. Su modo de fallo es un **404 en la
tableta de la consulta**.

No condiciona esta aprobación. **Condiciona `/gate-check`**, porque una puerta que pasa con
tres criterios bloqueantes jamás ejecutados es un adorno.

### Reparto de alcance

| Destino | Qué se va |
|---|---|
| **Sistema 5** | El contrato del programador de tiempo inyectable, que desbloquea los tres temporizadores de la regla 1 · el borde de entrada que lee `event.timeStamp` y lo pasa como dato, con su exención declarada allí · el criterio equivalente a AC-9 cuando exista un temporizador real |
| **Sistema 9** | La guarda de diferencia negativa: latencia **indefinida**, nunca cero · el orden de inserción como criterio adicional al sello de pared · **la resolución con la que se registra una latencia**, no solo su unidad |
| **Sistema 10** | **La raíz de composición del MVP.** Su fila del índice gana el 3 |
| **Sistema 14** | AC-1, AC-2 y AC-2b: tres listas de literales sobre la infraestructura que ya tiene. **No sube de esfuerzo**, y esa es la mitad del valor de ADR-0004 |
| **Sistema 19** | Si el objeto semilla más configuración de una sesión de paciente comparte forma estructural con un preset sincronizable, un futuro import o export puede confundirlos. Queda como pregunta abierta |
| **`/test-setup`** | `package.json` con `typescript` fijado y `node:test` · **medir la resolución real de `performance.now()`** en el navegador y el hardware de la tableta · el arnés de compilación negativa que AC-7 necesita |
| **`lead-programmer`** | El pin de `typescript` y el cambio de `moduleResolution` a `NodeNext` |
| **ADR** | **ADR-0004** — la marca nominal como mecanismo de aplicación |

### Sobre el criterio heredado de perder peso: NO se cumplió

El sistema 2 fijó *"este documento pierde peso en la próxima revisión, no gana"*, y el
sénior lo convirtió en número: por debajo de 520 líneas. El documento entró con **570** y
salió con **878**.

La estimación del sénior era de +14 líneas de contenido, y estaba mal hecha: se calculó
antes de saber que la decisión de la marca **obliga a publicar una fórmula nueva** — F5,
con su código, sus tres justificaciones y su tabla de literales, 56 líneas — y que
`event.timeStamp` **obliga a una regla nueva**, la 7. Sumadas a la tabla de literales de la
regla 1, la tabla de fábrica contra raíz de composición, la tabla de coerción de la semilla,
el párrafo de granularidad de F4, el caso límite de `crypto` ausente, AC-2b y AC-4b, son
unas 230 líneas de contenido que la revisión **exigió**.

Se recortaron ~130 líneas de arqueología en dos pasadas — las notas de "la primera
redacción decía" pertenecen a este log, no al documento —, y aun así el neto sube.

**El criterio se declara incumplido y no se reinterpreta.** Un documento de esfuerzo `S` de
878 líneas es un dato incómodo que la próxima revisión debe atacar, y el candidato obvio es
si F5 y la regla 7 pertenecen aquí o si el documento se ha convertido en dos sistemas con
un nombre.

### Criterios de éxito

1. **Nunca aparece `typescript` como dependencia de `tools/`.** Si aparece, la decisión de
   la marca se aplicó al revés y el sistema 14 subió a L.
2. **`kind` es obligatorio en las tres marcas.** Si alguna es opcional, AC-7 no prueba nada
   y la marca es decoración.
3. **Exactamente una función acuña marcas en todo `src/`.** Dos acuñadores significan que
   la unificación se deshizo y que AC-2b dejó de ser greppable.
4. **`event.timeStamp` no aparece en `src/` fuera del borde de entrada del sistema 5, y
   cuando aparece llega como parámetro.** Si aparece dentro de un cálculo de latencia, la
   cuarta instancia del patrón no se cerró.
5. **El GDD del sistema 9 declara la resolución de su medida de latencia, no solo la
   unidad.** Si dice "ms" y calla la granularidad, la mutación del patrón no se aprendió.
6. **Ningún GDD del 4 al 14 publica una afirmación de verificación sin haberla hecho.** O
   se cierra la segunda aparición del patrón, o hay tercera garantizada.
7. **`npx tsc --checkJs` corre con versión fijada antes de `/gate-check`.** Si esa puerta
   pasa con criterios BLOCKING jamás ejecutados, la puerta es un adorno.
8. **Este documento sale de la próxima pasada por debajo de 700 líneas**, o se parte en dos.
   El objetivo de 520 se declaró incumplido; 878 no es una meseta aceptable.
9. **La columna `Orden` del índice no se vuelve a citar como si fuera un identificador.**
