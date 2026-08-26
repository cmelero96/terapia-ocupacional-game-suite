# ADR-0003 — Alcance de la regla de cero dependencias

> **Status**: Accepted
> **Fecha**: 2026-08-25
> **Decide**: `creative-director`, tras `/design-review` del sistema 2
> **Alcance**: todo el proyecto

## Context

`technical-preferences.md` dice, en la sección de bibliotecas permitidas: *"Ninguna. El
stack es la plataforma web sin dependencias."*

Nunca se declaró **a qué se aplica esa regla**. Y la ambigüedad bloqueó una decisión
real: la fórmula F2 del sistema 2 exige decodificar píxeles de imagen y erosionar una
máscara alfa. Un revisor enumeró cuatro opciones y dejó explícito que la elección
dependía de una regla que nadie había escrito:

> *"Ejecutar un binario externo viola la letra de 'cero dependencias' **solo si esa
> regla se interpreta como aplicable a las herramientas de construcción y no solo al
> runtime servido al navegador. Esto no está decidido en ningún documento.**"*

Y la regla **ya no se estaba aplicando a herramientas**, sin que nadie lo hubiera
declarado: `technical-preferences.md` admite `node:test` y Playwright, y Playwright
arrastra un navegador entero.

## Decision

**La regla de cero dependencias se aplica al artefacto servido, no al entorno de
desarrollo.**

| Ámbito | Regla |
|---|---|
| **`src/`** — runtime servido al navegador | **Cero dependencias. Absoluto.** Sin excepciones |
| **`tools/`, `tests/`** — entorno de desarrollo | Dependencias permitidas **cuando compran una capacidad que si no habría que reimplementar**. Cada una se declara en `technical-preferences.md` con su justificación |
| **Corolario, y es la parte que importa** | **La salida de una herramienta se confirma en git como archivo estático.** El artefacto servido nunca depende de que la herramienta se haya ejecutado |

## Consequences

### La justificación sale de documentos propios del proyecto, no de conveniencia

ADR-0001 rechazó TypeScript *"para que el despliegue sea copiar archivos y para que el
proyecto siga funcionando dentro de diez años sin arreglar una cadena de
herramientas"*. **Las dos mitades hablan del artefacto servido y del runtime. Ninguna
habla de la máquina del desarrollador.**

Y la prueba de los diez años discrimina bien: si la cadena de herramientas se podre, el
producto sigue funcionando, porque lo servido son archivos estáticos.

### Qué legaliza el corolario

Dos decisiones tomadas en la misma revisión, y las dos dependen de esta:

1. **El CSS de tokens generado y confirmado** (ADR-0002). Una herramienta lo produce; el
   navegador recibe un archivo.
2. **El navegador como decodificador de imagen** para F2 del sistema 2. Playwright abre
   una página, dibuja el asset en un canvas y lee píxeles. **No se escribe ningún
   decodificador de PNG**, y encima se usa el mismo decodificador que renderizará el
   asset al paciente, así que medir y servir son una sola operación en lugar de dos
   implementaciones que deben coincidir por suerte.

### Lo que sigue prohibido

Cualquier dependencia en `src/`. Cualquier artefacto servido que exija ejecutar una
herramienta para existir. Cualquier paso de build en el camino del despliegue.

### Consecuencia para el sistema 13

Las herramientas del banco de imágenes pueden usar Playwright. Esto elimina de su
alcance el elemento más caro que tenía: escribir y mantener un decodificador de formato
de imagen, estimado en semanas de trabajo de bajo nivel con riesgo real de errores de
decodificación silenciosos.

## Alternatives considered

**Cero dependencias en todas partes, herramientas incluidas.** Rechazado: obligaría a
escribir un decodificador de PNG a mano para F2, y ya estaba de facto incumplido por
`node:test` y Playwright. Una regla que ya no se cumple y que nadie ha declarado
derogada es peor que ninguna regla.

**Permitir dependencias en runtime si son pequeñas.** Rechazado sin discusión. La
ausencia de paso de build y de dependencias en runtime es lo que hace que el despliegue
sea copiar archivos, y eso es un requisito de producto para un usuario con alta rotación
laboral que no puede pedir permiso a informática de cada centro.

## GDD Requirements Addressed

- Sistema 2: implementación de F2 sin decodificador propio
- Sistema 2: CSS de tokens generado (vía ADR-0002)
- Sistema 13: alcance de las herramientas del banco

## ADR Dependencies

Ninguna aguas arriba. **ADR-0002 depende de esta.**

## Engine Compatibility

| Campo | Valor |
|---|---|
| **Dominio** | Proyecto entero |
| **Riesgo de conocimiento** | BAJO |
| **Nota** | Cada dependencia de herramienta nueva se declara en `technical-preferences.md`. Esta ADR autoriza la categoría, no una lista abierta |
