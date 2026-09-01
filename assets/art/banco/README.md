# `assets/art/banco/` — los binarios del banco de imágenes

**Vacío todavía.** El banco real son **256 imágenes** vectoriales: 16 clusters de 16
elementos, dimensionado en [ADR-0006](../../../docs/architecture/0006-techo-del-tablero-y-escalones.md).

## Por qué los binarios están aquí y los datos no

Los datos del manifiesto viven en `src/banco/manifiesto.js`, no aquí. **La ruta es parte de
la decisión, no un detalle** — [ADR-0001](../../../docs/architecture/0001-formato-del-manifiesto.md):

`jsconfig.json` incluye `src/`, `tools/` y `tests/`. Si el manifiesto viviera en este
directorio, `tsc --checkJs` **no lo miraría nunca**, y con él se evaporaría la comprobación de
tipos de 256 registros curados a mano.

## Cómo entra una imagen

**Nunca a mano.** El único escritor legítimo del manifiesto es `tools/banco/importar.js`.

```
node tools/banco/cli.js validar          # esquema, ids, clusters, archivos
node tools/banco/cli.js lock --generar   # integridad, tras cada alta o retirada
node tools/banco/cli.js lock --comprobar # lo que ejecuta CI
node tools/banco/cli.js diff             # continuidad de ids contra origin/main
node tools/banco/cli.js retirar <id> <AAAA-MM-DD>
```

## La regla que no tiene excepción

**No existe «reemplazar manteniendo el id».** Un `id` es la clave con la que se guarda qué
estímulo vio el paciente, y toda la medición asume que ese estímulo no cambia entre sesiones.

Para cambiar una imagen: **retirar el id y crear otro.** Cuesta una fila más en el manifiesto
y conserva la validez de todo lo medido.

`banco.lock` existe para que sustituir un archivo por debajo no pase desapercibido: guarda el
hash de cada archivo y CI lo recalcula desde disco. Un hash que cambia con el id intacto rompe
el build.
