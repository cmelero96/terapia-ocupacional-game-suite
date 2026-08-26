# Prototypes Index

Historia completa de lo que se probó y lo que se aprendió. Cada fila apunta a su
informe. Ningún código de esta carpeta se refactoriza a producción.

## Concept prototypes

| Concepto | Fecha | Camino | Veredicto | Informe |
|---|---|---|---|---|
| Búsqueda visual ("Busca") | 2026-08-24 | HTML | **PROCEED** | [REPORT.md](busqueda-visual-concept/REPORT.md) |

### Notas

**Búsqueda visual** — Hipótesis principal CONFIRMADA (las tres perillas dan un
rango de dificultad separable, el pilar 3 se sostiene). Hipótesis secundaria NO
PROBADA (si el acuse de recibo sin calificación se lee como respuesta). Evidencia
débil: un solo probador, que es el desarrollador, y debrief abreviado. Sin cadena
de PIVOT previa.

Hallazgo de diseño principal: **la similitud son dos ejes, no uno** — semántica
(misma categoría) y visual (misma forma y color). Deben modelarse como dos
perillas separadas en el GDD.

Requisito estructural: el banco de imágenes se dimensiona **por elementos por
grupo visual**, no por total. Orden de magnitud real: **23 a 30 por grupo**, unos
400 en total.

> **Corregido el 2026-08-24 tras `/design-review`.** Este índice y el informe
> decían "8 o más por grupo visual". Era una extrapolación desde un solo punto de
> prueba (cantidad ≈ 36) que no se reverificó en el extremo alto del rango. Con 8
> por grupo, a cantidad 100 salen 12,9 repeticiones por elemento: eso no es
> discriminación visual, es repetición bruta.

**Revisión posterior:** `/design-review` sobre el documento de concepto dio
veredicto NEEDS REVISION con 8 ediciones bloqueantes, todas aplicadas. Los cuatro
bugs del prototipo (P1 a P4) están corregidos. Detalle completo en
[`design/gdd/reviews/game-concept-review-log.md`](../design/gdd/reviews/game-concept-review-log.md).

## Spikes

*(Ninguno todavía. Se registran aquí cuando el proyecto entre en producción.)*
