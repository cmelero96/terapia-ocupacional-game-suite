# Prototipo de concepto — Búsqueda visual ("Busca")

**Estado:** concluido. Veredicto **PROCEED**.
**Fecha:** 2026-08-24
**Camino:** HTML, un archivo autocontenido.

## Hipótesis

**Principal:** si el terapeuta mueve las perillas de dificultad — cantidad de
elementos, similitud y tamaño del objetivo — la dificultad cambia de forma
perceptible y graduable. *Señal medible:* al menos cuatro niveles claramente
distintos entre "trivial" y "demasiado difícil", y cada perilla produce un efecto
por separado.

**Secundaria:** el acuse de recibo sin calificación se percibe como respuesta y no
como avería.

## Cómo ejecutarlo

Abre `prototype.html` en cualquier navegador, con doble clic. Sin servidor, sin
build, sin dependencias.

Para reproducir el experimento de las perillas, sigue las dos tablas de la sección
"If Proceeding" de `REPORT.md`.

## Hallazgos

**Hipótesis principal: CONFIRMADA.** Las perillas dan un rango separable, así que el
control clínico del terapeuta existe y el pilar 3 se sostiene.

**Hipótesis secundaria: SIGUE SIN PROBAR.** Requiere pacientes reales.

Los tres hallazgos que van a los GDD:

1. **La similitud son dos ejes, no uno:** semántica (misma categoría) y visual
   (misma forma y color). Entrenan capacidades distintas.
2. **El banco de imágenes se dimensiona por distribución**, no por total: 23-30
   elementos por grupo visual, unos 400 en total. *(La primera versión de este
   informe decía "8 o más" — era incorrecto, extrapolado de un solo punto de prueba.)*
3. **El eje motor y el cognitivo deben ajustarse por separado.** Suelo motor en
   44 px; por debajo, solo como modo de reto explícito marcado en el registro.

**Sesión con el terapeuta colaborador (2026-08-24):** configuró el ejercicio sin
dificultad y sin explicación previa, y se comprometió a usarlo con una versión
pulida. El riesgo número uno del proyecto (umbral de 30 segundos) queda muy
desactivado, aunque el dato es cualitativo y sobre un flujo más corto que el del
producto real.

Detalle completo, incluidas las limitaciones de la evidencia: `REPORT.md`.

## Advertencia

Este código es **desechable**. No se migra a producción: se reescribe. Ningún
archivo de `src/` puede importar nada de aquí.

Los cuatro defectos de accesibilidad que `/design-review` encontró (P1 a P4) están
corregidos, pero eso no lo convierte en código de producción. Las reglas que sí
sobreviven al prototipo están recogidas en `design/gdd/game-concept.md` y en
`docs/engine-reference/web/modules/accessibility.md`.
