# Terapia Ocupacional — Game Suite

Plataforma web de **instrumentos terapéuticos** para personas con diversidad funcional,
diseñada para que la gestione un Terapeuta Ocupacional en la tableta de su consulta.

No es un juego con niveles ni puntuación. Es un banco de ejercicios configurables que el
terapeuta ajusta en segundos, y que registra lo que el paciente hace sin mostrárselo.

> **Estado: fase de diseño.** No hay código de producción todavía. Hay tres documentos de
> diseño de sistemas revisados, cuatro decisiones de arquitectura registradas y un
> prototipo desechable validado con un terapeuta real. Ver [Estado](#estado) abajo.

---

## El problema, tal como lo contó el terapeuta

La entrevista con el colaborador clínico cambió la premisa del producto. Está en
[`production/therapist-session-1.md`](production/therapist-session-1.md).

Lo que se asumía: el dolor es el **tiempo de preparación** del material.

Lo que dijo: el dolor es que **la rotación laboral del sector es muy alta**, y el material
pertenece al centro, no al profesional. Cambiar de trabajo significa empezar de cero.

Así que la propuesta de valor no es ahorrar tiempo. Es **portabilidad**: *"mi material es
mío y viene conmigo"*.

Y una aclaración suya que simplificó todo el diseño: al cambiar de centro cambian también
los pacientes. **Solo el material necesita viajar. Los datos del paciente no, nunca.** Eso
convirtió "datos del paciente locales al dispositivo" en un principio permanente en lugar
de un aplazamiento, y con ello la postura ante el RGPD dejó de ser un problema pendiente.

## Los cinco pilares

1. **Treinta segundos para el terapeuta.** Si configurar un ejercicio tarda más que
   sacar unas tarjetas de un cajón, el producto no se usa.
2. **El error se mide, no se muestra.** El registro lo sabe todo; la pantalla del paciente
   no sabe nada. No hay rojo que leer, ni sonido de fallo, ni anuncio por lector de
   pantalla. No existe un token de color de error en el ámbito del paciente.
3. **La dificultad vive en un rango que fija el terapeuta**, en dos ejes independientes:
   motor (tamaño del objetivo) y perceptivo-cognitivo (cantidad y similitud).
4. **El contenido combinatorio nunca se escribe a mano.** Los tableros se generan.
5. **Adulto, no infantil.** La población son personas mayores y adultos con diversidad del
   neurodesarrollo. Los niños no son un perfil del producto.

Y cuatro anti-pilares, que son las cosas que el producto **no** hace: sin puntuación
comparativa, sin presión de tiempo por defecto, sin gamificación extrínseca, y **sin que
los datos de salud salgan del dispositivo**.

## Stack

| | |
|---|---|
| Motor de juego | **Ninguno.** Plataforma web |
| Lenguaje | JavaScript, módulos ES nativos, tipado con JSDoc |
| Comprobación de tipos | `npx tsc --checkJs --noEmit` — configurado en `jsconfig.json` |
| Paso de build | **Ninguno.** Los módulos se sirven tal cual |
| Dependencias en `src/` | **Cero. Absoluto.** Ver [ADR-0003](docs/architecture/0003-alcance-cero-dependencias.md) |
| Objetivo | Navegador en tableta Windows de consulta. Android e iOS aplazados |

La accesibilidad no es un detalle de este proyecto: es el producto. Las entradas
soportadas son táctil, ratón, teclado, pulsador por barrido y activación por permanencia.
Nada depende del arrastre ni del `hover`, y el tamaño del objetivo es un **parámetro
clínico** que controla el terapeuta, no una constante de estilo.

## Estado

### Sistemas diseñados

| # | Sistema | Estado |
|---|---|---|
| 1 | [Manifiesto del banco de imágenes](design/gdd/manifiesto-banco-imagenes.md) | Revisado |
| 2 | [Tokens de tema y contraste](design/gdd/tokens-tema-contraste.md) | Revisado |
| 3 | [Inyección de no determinismo](design/gdd/inyeccion-no-determinismo.md) | Revisado |

Quedan once sistemas del MVP. El índice completo, con las 27 piezas y el orden de diseño,
está en [`design/gdd/systems-index.md`](design/gdd/systems-index.md).

Cada sistema pasa por un panel de revisión adversario y su resultado queda registrado en
[`design/gdd/reviews/`](design/gdd/reviews/). Esos logs son la parte más útil del
repositorio si quieres entender **por qué** el diseño es como es: registran también los
hallazgos que se consideraron equivocados, y por qué.

### Decisiones de arquitectura

| ADR | Decisión |
|---|---|
| [0001](docs/architecture/0001-formato-del-manifiesto.md) | El manifiesto es un módulo JS con literales, inyectado y no importado |
| [0002](docs/architecture/0002-fuente-de-verdad-tokens.md) | Los tokens son normativos en JS; el CSS se genera y se confirma en git |
| [0003](docs/architecture/0003-alcance-cero-dependencias.md) | "Cero dependencias" se aplica al artefacto servido, no al entorno de desarrollo |
| [0004](docs/architecture/0004-marca-nominal-como-mecanismo.md) | La marca nominal en JSDoc como mecanismo de aplicación, en lugar de análisis semántico en CI |

### Prototipo

[`prototypes/busqueda-visual-concept/`](prototypes/busqueda-visual-concept/) — un HTML
desechable del primer instrumento, **Busca**. Se validó con el terapeuta colaborador: lo
configuró sin explicación y sin apenas tardar, y dijo que lo usaría en cuanto hubiese una
versión pulida.

El informe honesto, con las cinco suposiciones que el prototipo **no** validó, está en su
[`REPORT.md`](prototypes/busqueda-visual-concept/REPORT.md).

### Lo que falta antes de escribir código

- **`/test-setup`.** No hay `package.json`, ni `typescript` instalado, ni `tests/`. Los
  criterios de aceptación de los tres GDD **no se pueden ejecutar todavía**, y eso está
  declarado en cada uno.
- **Dos ADR pendientes**: DOM contra Canvas para el área de juego, y el framework de
  interfaz del panel del terapeuta.
- **Cinco datos del colaborador clínico**, listados en
  [`design/gdd/game-concept.md`](design/gdd/game-concept.md). El que más pesa: si la
  similitud semántica y la visual son ejes distintos, porque decide si el banco de imágenes
  necesita ~400 elementos o ~130.

---

## Cómo está organizado

```
design/gdd/          Documentos de diseño de sistemas, y sus logs de revisión
design/registry/     Constantes y fórmulas con nombre, en un solo sitio
docs/architecture/   Decisiones de arquitectura (ADR)
docs/engine-reference/web/   Referencia de accesibilidad — WCAG, ARIA, modos de activación
prototypes/          Prototipos desechables, aislados de src/
production/          Gestión: entrevistas, estado, modo de revisión
src/                 Vacío todavía
.claude/             Agentes, skills y reglas que producen todo lo anterior
```

## Sobre la plantilla de la que deriva

Este repositorio parte de
[**claude-code-game-studios**](https://github.com/Donchitos/claude-code-game-studios) de
Donchitos, una plantilla de Claude Code con 49 subagentes y 73 skills para desarrollo de
videojuegos. Se conserva bajo licencia MIT — ver [`LICENSE`](LICENSE), cuyo copyright es
del autor de la plantilla.

El README original de la plantilla, que explica esa arquitectura de agentes, está en
[`docs/UPSTREAM-TEMPLATE-README.md`](docs/UPSTREAM-TEMPLATE-README.md).

Este proyecto la adapta a un caso que la plantilla no contemplaba: **no hay motor de
juego**, así que los especialistas de Godot, Unity y Unreal no aplican y el código se
enruta a los agentes genéricos de programación. Y el `accessibility-specialist` deja de ser
un revisor secundario para convertirse en el especialista principal de la capa de
adaptación de entrada.
