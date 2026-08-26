# Review Log — `design/gdd/manifiesto-banco-imagenes.md`

---

## Review — 2026-08-24 — Verdict: NEEDS REVISION (cambios aplicados)

Scope signal: **M** para la revisión del GDD. **L** para el sistema 13, que sostiene
todos los controles estructurales que esta revisión impuso.

Specialists: `lead-programmer`, `tools-programmer`, `accessibility-specialist`,
`analytics-engineer`. Síntesis sénior: `technical-director`.

**`systems-designer` y `qa-lead` fueron excluidos del panel** porque habían escrito las
secciones de Fórmulas y Criterios de Aceptación respectivamente. Revisar su propio
trabajo no es independiente.

**Desviación de la skill, declarada:** la síntesis sénior la hizo `technical-director`
y no `creative-director`. La skill enruta al director creativo porque asume un GDD de
mecánica de juego; este es de infraestructura, y la disputa central era de frontera
entre sistemas y de triaje de alcance.

**Limitación de independencia, declarada:** la sesión que escribió el documento es la
misma que ejecutó la revisión, contra la instrucción explícita de `/design-system`.
Mitigación: los cuatro especialistas y el sénior tenían contexto limpio, y la síntesis
de la sesión principal se sustituyó por la del director técnico.

Blocking items reportados: ~22 | Aplicados como cambio real: 8 sustantivos + 9 de forma
| Campos propuestos: 11 | Campos aceptados: **1**

### Resumen

**El dato decisivo es un silencio.** Cuatro especialistas adversarios con contexto
limpio no atacaron el modelo central: el modelo asimétrico (una identidad visual,
muchas pertenencias semánticas), los tres niveles de pool como implementación del
pilar 3, ni la derivación de `clusterMin`. Ninguna de las siete fórmulas cayó.

Los 22 bloqueantes se reparten en tres montones y ninguno significa "el diseño está
mal": defectos de forma de interfaz (6-7), herramientas inexistentes que son de otro
sistema (5-6), y propuestas de campos nuevos (11). El primer montón es lo que le pasa
a cualquier documento de interfaces escrito antes de que exista código. El segundo es
el documento haciendo bien su trabajo. El tercero era el trabajo real de la revisión.

### Adjudicación de las cinco decisiones

| # | Decisión | Fallo |
|---|---|---|
| 1 | `hash` + `revision` | **Se eliminan del esquema.** La regla 1 pasa de detectiva a estructural: no existe la operación de sustituir el archivo conservando el `id`. El hash sobrevive fuera, en `banco.lock`, sobre archivos ya normalizados |
| 2 | Frontera del manifiesto | **Snapshot en el registro.** El manifiesto no lleva metadatos de medición. Los píxeles son la medición, los metadatos son la interpretación: el registro puede fotografiar `cluster` y `categories`, no puede fotografiar una imagen. Cierra el agujero con **cero campos nuevos** |
| 3 | Ráster contra vector | **Se aplaza a `/art-bible`**, con la puerta reubicada: antes del sistema 18 (persistencia), no antes del MVP |
| 4 | Ceguera al color | **Regla 9 de validación**, no un campo. El color no puede ser el criterio que separa dos clusters |
| 5 | JSON contra módulo JS | **Módulo ES en `src/banco/`.** Open Question cerrada, ADR-0001 escrita |

### Triaje de los once campos propuestos: entra uno

| Bucket | Campos |
|---|---|
| **EN EL ESQUEMA AHORA** | `retiredAt` |
| **APLAZAR a `attrs`** | `aliases` (instrumento de denominación) · `visualComplexity` (sistema 6) · `dificultadCluster` (sistema 4, se **mide**, no se autorea) |
| **OTRO SISTEMA** | `license`/`source` (expediente lateral del sistema 13) · contraste (sistema 2: se mide contra un token, congelarlo lo deja obsoleto) |
| **RECHAZADOS** | dimensiones · `recognitionValidated` · `clusterAccessibilityReviewed` · `metaRevision` · `revisionKind` |

**Balance: de 9 campos a 8.** Entra `retiredAt`, salen `hash` y `revision`.

Herramienta de triaje que el sénior aplicó de forma sistemática: **`attrs` ya es el
punto de extensión.** Un campo aplazado a `attrs` no es deuda; es el esquema
funcionando como se diseñó.

### El defecto que los cuatro especialistas no vieron

Sale de cruzar el GDD con el concepto: **el MVP son 30 imágenes, y la regla 5 bloquea
el build si algún cluster tiene menos de 24 elementos activos.** El primer manifiesto
real del proyecto es inválido por construcción.

El riesgo no es que el desarrollador se atasque — lo verá en diez minutos. El riesgo es
**cómo lo va a resolver: bajando `clusterMin`**, que es lo único en todo el sistema que
hace real la perilla de similitud visual. Solución: escalón de aplicación por nivel —
Nivel 0 advertencia, Nivel 1 en adelante bloqueo.

### Lo único que tenía que cambiar

> El contrato de identidad pasa de detectivo a estructural.

Justificación del sénior, comparando modos de fallo: `clusterMin` sin escalón falla
**fuerte, pronto y a la vista** — el primer build no pasa. El contrato de identidad
falla **en silencio, tarde y sin vuelta atrás** — nadie se entera hasta que un
terapeuta compara la sesión 2 con la sesión 12 sobre datos ya contaminados, y en ese
momento el dato no se repara. Un fallo silencioso, tardío e irrecuperable gana siempre
a uno ruidoso y temprano.

### Consecuencia incómoda aceptada por escrito

Cuando el arte definitivo sustituya al stock, eso genera una **generación nueva de
identificadores** y una discontinuidad en la serie longitudinal. El sénior tentó un
campo `supersedes` y **lo rechazó**: enlazar los dos ids reconstruye exactamente la
falsa equivalencia que el contrato existe para impedir. La discontinuidad es cierta,
así que debe ser visible en la pantalla del terapeuta, no disimulada.

### Hallazgos que el sénior consideró equivocados o exagerados

| Hallazgo | Corrección |
|---|---|
| "El módulo JS convierte el sistema 19 en un rediseño" | Exagerado. Con el manifiesto **inyectado**, un manifiesto de ejecución cambia el proveedor, no la arquitectura. Baja a nota de diseño |
| Contraste por asset como bloqueante de **este** GDD | Problema real, ubicación equivocada. Se mide contra un token del sistema 2; congelarlo por asset lo deja obsoleto al cambiar el tema |
| `attrs.recognitionValidated` | Contraproducente. Si el objeto no es reconocible, **no entra en el banco** |
| `metaRevision` **y** `revisionKind` juntos | Dos fuentes de verdad para el mismo hecho. El diagnóstico del agujero era excelente; la solución lo duplicaba |
| Las 30-40 horas como bloqueante del GDD | Riesgo de producción del **Nivel 1**. Presentado como bloqueante, distorsionó la Decisión 3 y casi forzó una decisión de arte antes de tiempo |
| F7 generalizada a multi-instrumento | Cierto y prematuro. Una frase, no una fórmula nueva |
| Maquinaria de acuses para los avisos de `solapamiento` | Flujo de dos personas para un proyecto de una. **AC-16** ya es el detector automático real |
| Precomputar `Map<id, asset>` | Correcto pero es implementación: va a la ADR, no al GDD |

Y uno que endosó **contra su propio sesgo a recortar alcance**: el sistema 13 estaba
subestimado. De `S` a `L`. Es el sistema que sostiene todos los controles estructurales
impuestos aquí; si se subestima, los controles no se construyen y las decisiones 1 y 4
quedan en prosa.

### Cascada aplicada

| Archivo | Cambio |
|---|---|
| `manifiesto-banco-imagenes.md` | Decisiones 1, 2, 4, 5 · `retiredAt` · regla 9 · ejemplos de cluster corregidos · escalón de la regla 5 · contrato único de `resolve()` · requisitos estructurales de arte y puerta de art bible · AC-3a/b/c, AC-18 |
| `docs/architecture/0001-formato-del-manifiesto.md` | **Nueva.** Módulo ES en `src/banco/`, manifiesto inyectado |
| `design/registry/entities.yaml` | `clusterMin` gana la nota de escalón por nivel |
| `design/gdd/systems-index.md` | Sistema 13 de `S` a `L` y ampliado a seis herramientas · instrumento de denominación numerado (27) · sistema 9 depende del 1 |
| `design/gdd/game-concept.md` | Contradicción interna resuelta: Scope Tiers decía ~150 imágenes, Content Volume decía 384. Vigente: 384 |
| `.claude/docs/technical-preferences.md` | Dos patrones prohibidos nuevos: sustituir el archivo tras un `id` existente, y el color como criterio separador de clusters |

### Criterios de éxito que el sénior fijó

Sabremos que estas decisiones fueron correctas si: (a) el desarrollador nunca necesita
editar el manifiesto a mano para arreglar un asset; (b) al llegar el arte definitivo,
la discontinuidad longitudinal es visible en la pantalla del terapeuta en lugar de
estar oculta; (c) los GDD 2 a 14 no vuelven a proponer campos para el sistema 1,
porque `attrs` absorbe sus necesidades; y (d) el esquema sigue teniendo 8 campos
cuando se cierre el MVP.
