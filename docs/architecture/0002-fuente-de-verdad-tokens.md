# ADR-0002 — Fuente de verdad de los tokens de color

> **Status**: Accepted
> **Fecha**: 2026-08-25
> **Decide**: `creative-director`, tras `/design-review` del sistema 2
> **Sistema**: #2 — Tokens de tema y contraste

## Context

El GDD del sistema 2 contenía **dos fuentes de verdad incompatibles conviviendo** para
el mismo valor hexadecimal, y ningún especialista pudo determinar cuál era la
autoritativa:

- La regla 1 dice "los tokens son propiedades personalizadas de CSS"
- El criterio AC-2 valida "el módulo de tokens" con forma de objeto JavaScript
- Las fórmulas F1 a F6 son funciones que operan sobre literales RGB

No es un detalle de implementación aplazable. Determina si el criterio de cálculo de
contraste (aritmética en JS) y el criterio de "ningún literal de color fuera del módulo"
(análisis léxico sobre CSS) hablan del mismo dato o de **dos copias que se pueden
desincronizar en silencio**.

Dos especialistas propusieron soluciones opuestas:

| Propuesta | Coste declarado |
|---|---|
| **JS es la fuente**, CSS es proyección inyectada en arranque con `style.setProperty` | Parpadeo sin tema antes de la primera pintura. Con presupuesto de 100 ms y población de baja visión, no es cosmético |
| **CSS es la fuente**, el registro JS **lee** los valores con `getComputedStyle` | Pierde la cobertura de `tsc --checkJs`, que era el argumento entero de ADR-0001 |

## Decision

**JavaScript es la fuente normativa. El CSS es un archivo estático generado y
confirmado en git.**

| Capa | Artefacto | Regla |
|---|---|---|
| **Fuente normativa** | `src/theme/tokens-datos.js` | Literales, tipado JSDoc, comprobado por `tsc --checkJs` |
| **Proyección** | `src/theme/tokens.css` | **Generado** por `tools/theme/generar-css.js` y **confirmado en git**. Nunca se produce en ejecución |
| **Garantía de sincronía** | Invariante de CI | Regenerar y comparar. Si el CSS confirmado no coincide con la salida del generador, **el build rompe** |

Estructura de módulos, siguiendo el patrón de ADR-0001 — puro separado de impuro,
inyección en lugar de importación directa:

```
src/theme/
  esquema.js        # solo typedefs JSDoc. Sin código ejecutable
  tokens-datos.js   # export default con literales de tokens
  pares-datos.js    # export default con literales de pares declarados
  tokens.css        # GENERADO. No editar a mano
  contraste.js      # F1, pura
  silueta.js        # F2, pura sobre píxeles ya decodificados
  separacion.js     # F3, pura
  lab.js            # F6, pura
  resolver-tema.js  # pura: recibe resultados de matchMedia ya evaluados

tools/theme/
  generar-css.js    # único escritor legítimo de tokens.css
  validar-tokens.js
  validar-pares.js
  auditoria-contraste.js
```

## Consequences

### El parpadeo desaparece por completo

La objeción del FOUC existía **solo** porque la propuesta original proyectaba el CSS en
tiempo de arranque. Con un archivo estático generado, **el primer fotograma ya pinta
tokens correctos** porque el CSS es un archivo real servido tal cual.

### Las dos verificaciones quedan hablando del mismo dato por construcción

El análisis léxico sobre CSS y la aritmética en JS operan sobre el mismo origen, con un
diff en CI que lo garantiza. Ese era el agujero que las dos propuestas dejaban abierto.

### Por qué se rechazó CSS-como-fuente

No solo pierde cobertura de tipos. **`getComputedStyle` exige un navegador**, así que
los tres criterios de aceptación de aritmética de contraste dejarían de ser tests de
`node:test` y pasarían a ser tests de Playwright — que no está instalado. Mover tres o
cuatro criterios BLOCKING a infraestructura inexistente, para ahorrar un parpadeo que la
generación estática ya elimina, no está cerca de ser un buen intercambio.

### Reconciliación con ADR-0001

Directa: **el generador es a los tokens lo que `tools/banco/importar.js` es al
manifiesto** — el único escritor legítimo, con salida confirmada en git. El despliegue
sigue siendo copiar archivos, y el proyecto sigue funcionando dentro de diez años sin
arreglar una cadena de herramientas, porque la salida servida es estática.

### Consecuencia operativa

`tokens.css` lleva una cabecera de "archivo generado, no editar". Editarlo a mano rompe
el build en el siguiente diff de CI, que es el comportamiento deseado.

## Alternatives considered

**CSS como fuente única, sin registro JS.** Rechazado: las fórmulas de contraste no
tendrían valores contra los que operar sin un navegador, y el proyecto perdería la
comprobación de tipos sobre los valores.

**JS como fuente con inyección en arranque.** Rechazado por el parpadeo, que en esta
población no es cosmético.

**Un paso de build que genere el CSS en cada despliegue.** Rechazado: reintroduce
exactamente la cadena de herramientas que ADR-0001 rechazó. Generar y **confirmar**
mantiene el artefacto estático.

## GDD Requirements Addressed

- Sistema 2, regla 1: un color existe solo como token
- Sistema 2, regla 6: todo par declarado se verifica por cálculo
- Sistema 2, AC-1, AC-2, AC-9, AC-10

## ADR Dependencies

Depende de **ADR-0001** (precedente de dato como módulo JS en `src/`) y de
**ADR-0003** (el alcance de cero dependencias, que legaliza una herramienta cuya salida
se confirma).

## Engine Compatibility

| Campo | Valor |
|---|---|
| **Dominio** | Core / tema |
| **Motor** | Ninguno — plataforma web |
| **Riesgo de conocimiento** | BAJO |
| **Dependencia pendiente** | **La ADR de DOM contra Canvas.** Todo este sistema asume render DOM. Una resolución por Canvas exigiría rediseño, no ajuste |
