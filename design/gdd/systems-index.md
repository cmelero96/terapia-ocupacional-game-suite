# Systems Index: Taller (plataforma) — primer instrumento: Busca

> **Status**: Draft
> **Created**: 2026-08-24
> **Last Updated**: 2026-08-24
> **Source Concept**: `design/gdd/game-concept.md` (Status: Reviewed)

---

## Overview

Esto no es un juego con sistemas: es una **plataforma con infraestructura
compartida y varios instrumentos encima**. Esa distinción manda en toda la
descomposición.

De los diez instrumentos previstos, cuatro dependen del mismo banco de imágenes y
**todos** dependen de la misma capa de adaptación de entrada. Por eso la mayoría de
los sistemas del MVP no son el juego: son la infraestructura que hace que el
segundo, tercer y cuarto instrumento salgan baratos. Construirla mal significa
rehacerla cuatro veces, y el documento de concepto ya identifica el banco de
imágenes como "el primer activo del proyecto" y "el coste real".

Dos pilares mandan sobre la arquitectura más que ningún otro. **El pilar 2** ("el
error se mide, no se muestra") separa físicamente el modelo de datos de la capa de
presentación orientada al paciente: el registro lo sabe todo, la pantalla del
paciente no sabe nada. **El pilar 3** (la dificultad vive en un rango que fija el
terapeuta) convierte el modelo de dificultad en un sistema propio y central, no en
un puñado de parámetros dentro del instrumento.

Y hay un sistema que no venía del concepto original sino del propio usuario: la
**biblioteca portable del terapeuta**. La rotación laboral en el sector es muy alta
y el material pertenece al centro, no al profesional. Que su material le siga entre
trabajos es la propuesta de valor central del producto, no una función secundaria.

---

## Alcance revisado tras la sesión 2 con el colaborador (2026-08-26)

Las respuestas de `production/therapist-session-2.md` cambian el alcance de la primera
prueba real en tres puntos. **Este bloque manda sobre la columna `Prioridad` de la tabla
de abajo mientras dure la fase de pruebas internas.**

| Cambio | Sistemas afectados |
|---|---|
| **"Múltiples juegos" es requisito de "pulida"** | Entran los instrumentos **21** (clasificar por categorías) y **24** (denominación de objetos) junto al **10** (Busca). Se eligen por coste marginal: los tres comparten banco, capa de entrada y registro |
| **Hay pacientes con sensibilidad sensorial** | **6** (modo de estímulo reducido) y **7** (control de silencio y volumen) pasan de aplazables a **obligatorios** |
| **"Pulida" no incluye guardar nada** | **18** (persistencia local), **19** (biblioteca portable), **16** (presets) y **20** (evolución longitudinal) **salen** de la primera prueba |

**El banco es de 384 elementos**, confirmado: la similitud semántica y la visual son ejes
distintos, así que no se fusionan y no hay rama de ~130.

**El sistema 15 (taxonomía de perfiles) se diseña pero no se implementa.** El colaborador
delegó la taxonomía en el equipo, así que la versión que exista es un andamio de
ingeniería: el producto **no sugiere** ejercicios por perfil hasta que un clínico la
valide. El terapeuta elige y configura a mano.

### Sistemas de la primera prueba real, en orden

```
Foundation   1 manifiesto ·  2 tokens ·  3 inyección ·  4 modelo de dificultad
Core         5 capa de adaptación de entrada ·  8 generación de tableros
             9 registro (en memoria, sin persistir)
Adaptación   6 estímulo reducido ·  7 silencio y volumen
Instrumentos 10 Busca ·  21 clasificar ·  24 denominación
UI           11 frontera de modo y panel ·  12 resultados de sesión
Meta         13 herramientas del banco (necesarias para validar 384 elementos)
             14 invariantes de CI  ← el único candidato honesto a aplazar
```

Tres diseñados de los quince. `14` es aplazable para una prueba interna: sus
comprobaciones se pueden correr a mano al principio, con el riesgo declarado de que las
reglas que declara dejan de estar vigiladas.

---

## Systems Enumeration

| # | Sistema | Categoría | Prioridad | Estado | Design Doc | Depende de |
|---|---------|-----------|-----------|--------|------------|------------|
| 1 | Manifiesto del banco de imágenes | Core | MVP | **Revisado** (NEEDS REVISION, cambios aplicados) | [manifiesto-banco-imagenes.md](manifiesto-banco-imagenes.md) | 3 *(solo tipos)* |
| 2 | Tokens de tema y contraste | Core | MVP | **Revisado** (NEEDS REVISION, cambios aplicados) | [tokens-tema-contraste.md](tokens-tema-contraste.md) | — |
| 3 | Inyección de no determinismo (aleatoriedad y reloj) *(inferido)* | Core | MVP | **Revisado** (NEEDS REVISION, cambios aplicados) | [inyeccion-no-determinismo.md](inyeccion-no-determinismo.md) | — |
| 4 | Modelo de dificultad: dos ejes, cuatro perillas | Clínico | MVP | **Designed** (pendiente de revisión) · **implementado** | [modelo-dificultad.md](modelo-dificultad.md) | — |
| 5 | Capa de adaptación de entrada | Adaptación | MVP | **Designed** (pendiente de revisión) · **implementado** (lógica pura) | [capa-adaptacion-entrada.md](capa-adaptacion-entrada.md) | 2, 3, 4 |
| 6 | Modo de estímulo reducido *(inferido)* | Adaptación | MVP | Not Started | — | 2, 5 |
| 7 | Control de silencio y volumen *(inferido)* | Adaptación | MVP | Not Started | — | 6 |
| 8 | Generación de tableros | Instrumento | MVP | **Designed** (pendiente de revisión) · **implementado** | [generacion-tableros.md](generacion-tableros.md) | 1, 2, 3, 4 |
| 9 | Registro de rendimiento | Registro | MVP | **Designed** (pendiente de revisión) · **implementado** | [registro-rendimiento.md](registro-rendimiento.md) | 1, 3, 4, 5, **8** |
| 10 | Instrumento: Busca (búsqueda visual) — **posee la raíz de composición del MVP** | Instrumento | MVP | Not Started | — | 2, **3**, 5, 8, 9 |
| 11 | Frontera de modo y panel del terapeuta | UI | MVP | Not Started | — | 2, 4, 5 |
| 12 | Pantalla de resultados de sesión | UI | MVP | Not Started | — | 2, 9 |
| 13 | Herramientas del banco: validador, importador de lote, reexportador, galería de clusters, diff, normalización *(inferido)* | Meta | MVP | Not Started | — | 1, 2 |
| 14 | Invariantes como barreras de CI: analizadores estáticos + tokenizador de CSS + **detección de fuente aleatoria o reloj constante fuera de `tests/`** *(inferido)* | Meta | MVP | Not Started | — | 1, 2, 3, 5, 9 |
| 15 | Taxonomía de perfiles funcionales | Clínico | Vertical Slice | **BLOQUEADO** | — | — |
| 16 | Presets y perfiles del terapeuta | Clínico | Vertical Slice | Not Started | — | 4, 15 |
| 17 | Dificultad adaptativa | Clínico | Vertical Slice | Not Started | — | 4, 9 |
| 18 | Persistencia local | Registro | Vertical Slice | Not Started | — | 9 |
| 19 | Biblioteca portable del terapeuta (sincronización) | Registro | Vertical Slice | Not Started | — | 16, 18 |
| 20 | Vista de evolución longitudinal | UI | Vertical Slice | Not Started | — | 18 |
| 21 | Instrumento: clasificar por categorías | Instrumento | Alpha | Not Started | — | 1, 5, 8, 9 |
| 22 | Instrumento: transcribir símbolos | Instrumento | Alpha | Not Started | — | 3, 5, 9 |
| 23 | Instrumento: precio justo | Instrumento | Alpha | Not Started | — | 1, 5, 9 |
| 24 | Instrumento: denominación de objetos | Instrumento | Alpha | Not Started | — | 1, 5, 9 |
| 25 | Composición de sesiones | Clínico | Full Vision | Not Started | — | 16, 17 |
| 26 | Informes para el terapeuta | UI | Full Vision | Not Started | — | 20 |
| 27 | Práctica en casa (cuentas, servidor, RGPD) | Registro | Full Vision | Not Started | — | 18, 19 |

---

## Categories

Categorías adaptadas a este producto. Las del template genérico (Economy,
Narrative, Audio, Progression) no aplican y se han retirado.

| Categoría | Descripción | Sistemas |
|-----------|-------------|----------|
| **Core** | Infraestructura de la que depende todo | Manifiesto del banco, tokens de tema, inyección de no determinismo |
| **Adaptación** | La capa que hace el producto accesible. **En este proyecto no es una categoría de soporte: es el producto** | Adaptación de entrada, estímulo reducido, silencio |
| **Clínico** | Lo que traduce criterio terapéutico en parámetros del software | Modelo de dificultad, taxonomía de perfiles, presets, adaptación, composición de sesiones |
| **Instrumento** | Los ejercicios en sí. Intercambiables sobre la misma infraestructura | Generación de tableros, Busca, y los tres instrumentos del Nivel 2 |
| **Registro** | Datos: captura, esquema, persistencia y portabilidad | Registro de rendimiento, persistencia local, biblioteca portable, práctica en casa |
| **UI** | Superficies del terapeuta. **El paciente no tiene UI más allá del tablero**, y eso es deliberado | Panel modal, resultados de sesión, evolución longitudinal, informes |
| **Meta** | Herramientas y barreras que protegen los pilares | Herramientas del banco, invariantes de CI |

---

## Priority Tiers

Los niveles del documento de concepto mapean así:

| Tier del template | Nivel del concepto | Definición aquí |
|-------------------|--------------------|-----------------|
| **MVP** | Nivel 0 — Prototipo de producción | Un instrumento, perillas manuales, panel modal, registro en memoria, sin persistencia |
| **Vertical Slice** | Nivel 1 — Entregable | El colaborador lo usa un mes solo. Perfiles, presets, adaptativa, persistencia, biblioteca portable |
| **Alpha** | Nivel 2 — Catálogo | Tres instrumentos más, reutilizando banco y capa de entrada |
| **Full Vision** | Nivel 3 y más allá | Práctica en casa, composición de sesiones, informes |

---

## Dependency Map

### Foundation Layer (sin dependencias)

1. **Manifiesto del banco de imágenes** — cuatro instrumentos lo consumen. Todo lo
   demás en el catálogo depende de que su esquema y su distribución sean correctos.
2. **Tokens de tema y contraste** — el contraste es un requisito clínico, no
   estético. Debe existir como sistema verificable antes de que se dibuje nada.
3. **Inyección de no determinismo** — la aleatoriedad y el reloj se inyectan, nunca
   se llaman directamente. Sin esto, ni la generación de tableros ni el cronómetro
   son testeables de forma determinista.
4. **Modelo de dificultad** — define los parámetros que consumen la generación de
   tableros, el registro, los presets y la adaptación. Es el pilar 3 hecho sistema.
5. **Taxonomía de perfiles funcionales** — **BLOQUEADO**, requiere criterio del
   colaborador terapeuta. No bloquea el MVP: solo bloquea el sistema 16.

### Core Layer

1. **Capa de adaptación de entrada** — depende de: tokens (tamaño de objetivo),
   inyección de reloj (temporizador de permanencia). Cuatro modos de activación con
   un solo código: toque y ratón, teclado, permanencia, barrido por pulsador.
2. **Generación de tableros** — depende de: manifiesto, aleatoriedad inyectada,
   modelo de dificultad.
3. **Registro de rendimiento** — depende de: reloj inyectado, modelo de dificultad
   (guarda la configuración que produjo cada entrada).

### Feature Layer

1. **Modo de estímulo reducido** — depende de: tokens, adaptación de entrada.
2. **Control de silencio y volumen** — depende de: estímulo reducido.
3. **Instrumento Busca** — depende de: adaptación de entrada, generación de
   tableros, registro.
4. **Presets y perfiles del terapeuta** *(VS)* — depende de: modelo de dificultad,
   taxonomía.
5. **Dificultad adaptativa** *(VS)* — depende de: modelo de dificultad, registro.

### Presentation Layer

1. **Frontera de modo y panel del terapeuta** — depende de: modelo de dificultad,
   adaptación de entrada.
2. **Pantalla de resultados de sesión** — depende de: registro.
3. **Vista de evolución longitudinal** *(VS)* — depende de: persistencia local.

### Polish / Infrastructure Layer

1. **Herramientas del banco de imágenes** — validador de esquema y de distribución.
2. **Invariantes como barreras de CI** — pilar 2 y anti-pilar 4 como fallos de build.
3. **Persistencia local** *(VS)* — depende de: registro.
4. **Biblioteca portable del terapeuta** *(VS)* — depende de: presets, persistencia.

---

## Recommended Design Order

> **AVISO: la columna `Orden` es una POSICIÓN, no un identificador de sistema.** Las dos
> tablas de este documento usan numeraciones distintas, y coinciden solo del 1 al 5.
> Esta tabla omite ocho sistemas y fusiona dos, así que desde la posición 6 divergen:
> aquí la 9 es el instrumento Busca y en Systems Enumeration el 9 es el Registro de
> rendimiento.
>
> **El identificador canónico es el `#` de Systems Enumeration**, y es el que usan todos
> los GDD. Cuando un documento diga "sistema N", se refiere a esa tabla. Si necesitas
> citar una fila de aquí, cita su nombre, nunca su número.

| Orden | Sistema | # canónico | Prioridad | Capa | Agente(s) | Esfuerzo |
|-------|---------|-----------|-----------|------|-----------|----------|
| 1 | Manifiesto del banco de imágenes | **1** | MVP | Foundation | `systems-designer`, `tools-programmer` | M |
| 2 | Tokens de tema y contraste | **2** | MVP | Foundation | `accessibility-specialist`, `art-director` | S |
| 3 | Inyección de no determinismo | **3** | MVP | Foundation | `lead-programmer` | S |
| 4 | Modelo de dificultad | **4** | MVP | Foundation | `systems-designer`, `game-designer` | M |
| 5 | **Capa de adaptación de entrada** | **5** | MVP | Core | `accessibility-specialist` (principal) | **L** |
| 6 | Generación de tableros | **8** | MVP | Core | `systems-designer`, `gameplay-programmer` | M |
| 7 | Registro de rendimiento | **9** | MVP | Core | `systems-designer` | M |
| 8 | Modo de estímulo reducido + silencio | **6, 7** | MVP | Feature | `accessibility-specialist` | S |
| 9 | Instrumento Busca | **10** | MVP | Feature | `gameplay-programmer`, `game-designer` | M |
| 10 | Frontera de modo y panel del terapeuta | **11** | MVP | Presentation | `ux-designer`, `ui-programmer` | M |
| 11 | Pantalla de resultados de sesión | **12** | MVP | Presentation | `ux-designer` | M |
| 12 | Herramientas del banco de imágenes | **13** | MVP | Polish | `tools-programmer` | **L** |
| 13 | Invariantes como barreras de CI | **14** | MVP | Polish | `qa-lead`, `devops-engineer` | **M** |
| 14 | Taxonomía de perfiles funcionales | **15** | VS | Foundation | `game-designer` + **colaborador clínico** | M |
| 15 | Presets y perfiles del terapeuta | **16** | VS | Feature | `ux-designer`, `systems-designer` | M |
| 16 | Dificultad adaptativa | **17** | VS | Feature | `systems-designer` | **L** |
| 17 | Persistencia local | **18** | VS | Polish | `lead-programmer`, `security-engineer` | M |
| 18 | Biblioteca portable del terapeuta | **19** | VS | Polish | `lead-programmer`, `security-engineer` | **L** |
| 19 | Vista de evolución longitudinal | **20** | VS | Presentation | `ux-designer` | M |

Esfuerzo: S = 1 sesión, M = 2-3 sesiones, L = 4 o más.

**Por qué el orden empieza donde empieza.** El manifiesto del banco va primero
porque el concepto lo declara el primer activo del proyecto y porque cuatro
instrumentos dependen de su esquema. Los tokens y la inyección de no determinismo
van antes que cualquier código porque son restricciones que se aplican a todo lo
que venga después y son baratos. El modelo de dificultad va cuarto porque es el
pilar 3 hecho sistema, y la generación de tableros, el registro, los presets y la
adaptación consumen todos su forma.

**La capa de adaptación de entrada es el sistema más caro del MVP y el más
importante.** Es la única infraestructura que usan los diez instrumentos, no solo
cuatro. Su GDD lo lidera `accessibility-specialist`, no `ui-programmer`.

---

## Circular Dependencies

**Capa de adaptación de entrada ↔ Frontera de modo del terapeuta.**

El ciclo: el panel del terapeuta necesita quedar **fuera** del ciclo de barrido por
pulsador y del área de permanencia del paciente, así que necesita saber qué hace la
capa de entrada. Pero la capa de entrada necesita saber qué elementos excluir, que
es lo que define el panel.

**Resolución por contrato.** La capa de entrada expone un registro de alcance de
barrido (`scanScope`) con dos ámbitos declarados: `paciente` y `terapeuta`. Cada
elemento interactivo se registra en uno de los dos al montarse. La capa de entrada
no sabe qué es un panel; solo sabe que hay dos ámbitos y que el barrido del paciente
nunca recorre el ámbito del terapeuta. El ciclo se rompe y la regla queda
verificable con un test.

No hay más ciclos en el grafo.

---

## High-Risk Systems

| Sistema | Tipo de riesgo | Descripción | Mitigación |
|---------|----------------|-------------|------------|
| **Capa de adaptación de entrada** | Técnico | Cuatro modos de activación con un solo código. El barrido por pulsador y la permanencia no tienen biblioteca estándar: son trabajo propio. Y la coexistencia con el clic por permanencia del sistema operativo (seguimiento ocular) está sin verificar: dos temporizadores apilados duplicarían la espera real | Prototipo específico de modos de entrada **antes** del Nivel 1. El prototipo de concepto cortó teclado y pulsador a propósito, así que esta hipótesis sigue entera |
| **Manifiesto del banco de imágenes** | Alcance | Es el coste real del proyecto, no el código. La regla de distribución exige 23-30 elementos por grupo visual, unos 400 en total. Mal distribuido, se rehace cuatro veces | No producir contenido hasta que el colaborador confirme que la similitud visual es un eje que usa. Si dice que no, el banco baja a ~130 |
| **Taxonomía de perfiles funcionales** | Diseño — **BLOQUEADO** | Es el emparejamiento paciente↔instrumento, o sea la pieza central del producto. Hoy solo hay etiquetas diagnósticas (gente mayor, autismo, TDAH), no perfiles funcionales | Sesión con el colaborador: qué capacidad entrena cada instrumento y para qué limitación sirve. Sigue pendiente tras la sesión del 2026-08-24 |
| **Dificultad adaptativa** | Diseño | El controlador está sin especificar: ventana de cálculo, arranque en frío, `mínimo == máximo`, división por cero. Y con ventana por tablero el objetivo del 80% es inalcanzable y el controlador oscila | Ventana sobre ≥20 objetivos acumulados, no por tablero. Especificar los cuatro casos límite antes de escribir código |
| **Registro de rendimiento** | Diseño — validez de medición | Si no distingue **ruido motor**, **error de memoria del objetivo** y **error de búsqueda**, todo lo que el terapeuta vea está contaminado. Y sin instrumentación de habituación, la mejora aparente puede ser memorización | El esquema de datos lo decide todo. Diseñarlo antes del instrumento, no después |
| **Biblioteca portable del terapeuta** | Alcance y legal | Es el primer código de red del proyecto y la propuesta de valor central a la vez. Un preset asociado a un paciente nombrado sí es dato personal | Presets por **perfil funcional**, nunca por paciente nombrado. Los datos del paciente no salen del dispositivo: no es un aplazamiento, es permanente |
| **Modo de estímulo reducido** | Diseño | Nuevo, salido de la corrección del perfil de paciente. El autismo lo hace obligatorio y el diseño actual tiene sonido en cada acierto y animación en cada toque | Confirmar con el colaborador si tiene pacientes que rechacen sonido o movimiento |

---

## Nota sobre el bloqueo de la taxonomía

La revisión de concepto decía que la taxonomía de perfiles funcionales era "entrada
obligatoria de `/map-systems`". **Al hacer la descomposición resulta que no lo era.**

La taxonomía determina el *contenido* del sistema 15 y bloquea el 16 (presets), que
son de Nivel 1. No determina qué sistemas existen ni cómo dependen entre sí. Los 14
sistemas del MVP se pueden diseñar sin ella.

Consecuencia práctica: **el diseño del MVP no está bloqueado.** Lo que está
bloqueado es el Nivel 1, y hay 13 GDD que escribir antes de llegar ahí.

---

## Progress Tracker

| Métrica | Cuenta |
|---------|--------|
| Sistemas identificados | 27 |
| GDD empezados | 3 |
| GDD revisados | 3 |
| GDD diseñados sin revisar | 4 |
| Sistemas con código en `src/` | **5** (3, 4, 5, 8 y 9) |
| GDD aprobados | 0 |
| Sistemas MVP diseñados | 3 / 14 |
| Sistemas Vertical Slice diseñados | 0 / 6 |
| Sistemas bloqueados por criterio clínico | 1 (taxonomía de perfiles) |

---

## Next Steps

- [ ] `/design-system manifiesto-banco-imagenes` — primer sistema del orden de diseño
- [ ] `/design-review design/gdd/[sistema].md` tras cada GDD, en sesión limpia
- [ ] `/gate-check systems-design` cuando los 14 sistemas del MVP estén diseñados
- [ ] Sesión pendiente con el colaborador: taxonomía de perfiles funcionales,
      similitud visual como eje, sensibilidad sensorial, y de quién es el dispositivo
- [ ] Prototipo de modos de entrada (teclado, permanencia, pulsador) antes del Nivel 1
