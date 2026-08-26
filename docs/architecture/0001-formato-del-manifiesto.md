# ADR-0001 — Formato y ubicación del manifiesto del banco de imágenes

> **Status**: Accepted
> **Fecha**: 2026-08-24
> **Decide**: `technical-director`, tras `/design-review` del sistema 1
> **Sistema**: #1 — Manifiesto del banco de imágenes

## Context

El manifiesto indexa entre 312 y 384 assets de imagen, cada uno con seis campos
obligatorios curados a mano. Lo consumen cinco sistemas y es la infraestructura
compartida de la que dependen cuatro de los instrumentos del catálogo.

El stack del proyecto es plataforma web sin motor, **sin paso de build**, con módulos
ES nativos y tipos declarados en JSDoc verificados por `npx tsc --checkJs --noEmit`.
Sin dependencias.

El GDD del sistema 1 dejó abierta la pregunta de formato: fichero `.json` o módulo
`.js`. La revisión la cerró, y descubrió que en realidad ya estaba cerrada de forma
incoherente: un criterio de aceptación nombraba un fixture `.json` mientras la sección
de preguntas abiertas decía que estaba por decidir.

## Decision

**Módulo ES con literales, ubicado dentro de `src/`.**

```
src/banco/
  esquema.js            # solo typedefs JSDoc. Sin código, sin imports
  manifiesto-datos.js   # export default con los literales de los assets
  pool-queries.js       # poolVisual / poolSemantica / poolNinguna, puras
  resolve.js            # resolve(manifiesto, id)
  muestreo.js           # barajado sin reemplazo, con fuente aleatoria inyectada
  validador.js          # validar(manifiesto, { existeArchivo }), pura

tools/banco/
  importar.js           # único escritor legítimo de entradas
  validar-cli.js        # conecta validador.js con fs real y process.exit
  integridad.js         # genera y comprueba banco.lock
  galeria-clusters.js   # galería HTML estática para revisar clusters a ojo
  diff-manifiestos.js   # continuidad de ids entre versiones
```

**El manifiesto se inyecta, no se importa desde dentro de las consultas.**
`pool*()` y `resolve()` reciben el manifiesto como argumento en cada llamada.

**La ruta es parte de la decisión, no un detalle.** Los binarios de imagen viven en
`assets/art/banco/`; los datos del manifiesto viven en `src/banco/`. Son dos cosas
distintas.

## Consequences

### Por qué módulo JS y no JSON

**Sin paso de build, `tsc --checkJs` solo comprueba de verdad literales de código en
ficheros incluidos.** Un JSON cargado en ejecución con `fetch` más `JSON.parse` tipa
como `any`; con `import ... with { type: 'json' }` tipa según lo que infiera el
compilador, no contra el typedef del proyecto. La comprobación de tipos se evapora
exactamente en la frontera donde 384 registros curados a mano la necesitan.

Un `export default /** @type {ImageAsset[]} */ ([...])` con literales obtiene
comprobación de tipo y de propiedades excedentes **entrada por entrada, gratis**.

Generarlo con herramienta no es más difícil: `JSON.stringify(data, null, 2)` con
`export default ` delante.

Y evita una superficie de riesgo: los atributos de importación para JSON cambiaron de
sintaxis (`assert` → `with`) y son relativamente recientes. El `VERSION.md` del
proyecto marca esa clase de superficie como riesgo medio.

### Por qué la ruta importa tanto como el formato

El `jsconfig.json` del repositorio tiene
`include: ["src/**/*.js", "tools/**/*.js", "tests/**/*.js"]`.

**Si el manifiesto viviera en `assets/art/banco/` o en `design/`, `tsc` no lo miraría
nunca** y todo el argumento anterior se caería. Fijar el formato sin fijar la ruta
habría sido una decisión vacía.

### Riesgo aceptado, degradado de "rediseño" a "costura declarada"

Un módulo JS es un artefacto **estático**. El GDD del sistema 1 señala como
dependencia blanda que el sistema 19 (biblioteca portable del terapeuta) podría
convertir el manifiesto en artefacto de **ejecución**, si algún día el terapeuta sube
sus propias imágenes.

Un revisor lo calificó de "rediseño de arquitectura". **Se degrada a nota de diseño**,
porque la costura ya existe: con el manifiesto **inyectado** en `resolve()` y en
`pool*()` en lugar de importado desde dentro, un manifiesto de ejecución cambia el
**proveedor**, no la arquitectura. El proyecto ya obliga a inyección de dependencias
por norma propia y ya la aplica a la aleatoriedad y al reloj (sistema 3).

Lo que sí habría que construir ese día: una ruta de validación en ejecución. Por eso
el validador se diseña como función pura con predicados inyectados, para poder
reutilizarse tanto en construcción como en una futura subida.

### Consecuencias operativas

- **`tools/banco/importar.js` es el único escritor legítimo** de entradas del
  manifiesto. Se niega a escribir sobre un `id` existente, sin bandera que lo fuerce.
- **La integridad vive fuera del manifiesto**, en `banco.lock`, generado sobre los
  archivos **ya normalizados** y comparado contra disco en CI. CI nunca confía en un
  hash almacenado dentro del propio manifiesto.
- Los fixtures de test son `.js`, no `.json`.
- `esquema.js` no contiene código ejecutable, solo typedefs, para que cualquier
  módulo pueda importarlo sin arrastrar dependencias.

### Lo que JSDoc no puede expresar, y por tanto es del validador

El typedef da **forma**, no invariantes. Estos cuatro son responsabilidad exclusiva
del validador y ningún sistema de tipos estructural los alcanza:

| Invariante | Criterio |
|---|---|
| Unicidad de `id` dentro del manifiesto | AC-1 |
| `categories` no vacío, `id` y `cluster` en kebab-case | Regex en el validador |
| Contención semántica del cluster (regla 8) | AC-17 |
| `clusterMin` por grupo visual (regla 5, con escalón por nivel) | AC-6 |

## Alternatives considered

**JSON.** Más fácil de leer en crudo y de generar con cualquier herramienta. Rechazado
porque pierde la comprobación de tipos exactamente donde hace falta, y porque la
supuesta ventaja de generación no resiste comparación: anteponer `export default ` a un
`JSON.stringify` es una línea.

**Módulo JS en `assets/art/banco/`, junto a las imágenes.** Rechazado: queda fuera del
`include` de `jsconfig.json`, así que no se comprobaría. Los datos y los binarios son
artefactos distintos y viven en árboles distintos.

**TypeScript.** Fuera de discusión: introduce un paso de build, que el proyecto rechaza
por diseño para que el despliegue sea copiar archivos y para que el proyecto siga
funcionando dentro de diez años sin arreglar una cadena de herramientas.

## GDD Requirements Addressed

- Sistema 1, regla 3: el manifiesto es la única vía al asset
- Sistema 1, regla 6: las consultas son puras y reproducibles por semilla
- Sistema 1, regla 7: el manifiesto declara su versión de esquema
- Sistema 1, regla 1: el contrato de identidad, vía `importar.js` y `banco.lock`

## ADR Dependencies

Ninguna: es la primera ADR del proyecto.

**ADR futuras que dependen de esta:** generación de tableros y aleatoriedad;
persistencia de datos de salud; invariantes como barreras de CI.

## Engine Compatibility

| Campo | Valor |
|---|---|
| **Dominio** | Core / datos |
| **Motor** | Ninguno — plataforma web |
| **Versión fijada** | Módulos ES nativos, ES2022 |
| **Riesgo de conocimiento** | BAJO. Los módulos ES son estables y están dentro de los datos de entrenamiento |
| **Superficie evitada** | Atributos de importación de JSON (`assert` → `with`), marcados como riesgo medio en `VERSION.md` |
