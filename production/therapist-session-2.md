# Sesión 2 — respuestas del colaborador clínico

> **Fecha**: 2026-08-26
> **Vía**: respuestas directas a las siete preguntas bloqueantes de la hoja de ruta
> **Estado**: seis respondidas en firme, una delegada al equipo de desarrollo

Estas respuestas cierran cinco preguntas abiertas que llevaban bloqueando desde la
sesión 1, y **cambian el alcance del MVP en tres puntos**. Cada consecuencia está
propagada a los documentos que indica la última columna.

---

## Respuestas

### 0.1 — ¿Similitud semántica y similitud visual son ejes distintos? **SÍ**

Es la respuesta con consecuencia económica directa, y es la rama **cara**.

| | |
|---|---|
| Confirma | El modelo de dos ejes del concepto, tal como está escrito. **Cero retrabajo de diseño** |
| Banco de imágenes | **384 elementos** — 16 clusters × `clusterMin` 24. Con reutilización de clusters, 312 |
| Descarta | La hipótesis de ~130 elementos, que habría fusionado los dos ejes en uno |

`clusterMin = ceil(distractores(Cmax) / Rmax) + 1 = ceil(90/4) + 1 = 24` se mantiene sin
cambios, y con ella `G = 16` y `Rmax = 4`.

**Propagado a:** `design/gdd/game-concept.md`, `design/registry/entities.yaml`,
`design/gdd/manifiesto-banco-imagenes.md` (F4 confirmada, no recalculada).

### 0.2 — Taxonomía de perfiles funcionales: **NO ESTÁ CLARA**

El colaborador delega en el equipo de desarrollo. Se autoriza a usar una taxonomía
provisional construida por ingeniería.

> **AVISO, y es el más importante de este documento.** La taxonomía que se escriba
> a raíz de esta respuesta es **un andamio de ingeniería, no un instrumento clínico**.
> Existe para que el software se pueda construir y para que haya algo concreto que el
> colaborador pueda corregir — que es mucho más fácil que inventarlo de cero.
>
> **Ninguna fila de esa taxonomía puede presentarse al terapeuta como recomendación
> clínica hasta que un profesional la valide.** El producto no sugiere ejercicios por
> perfil mientras la taxonomía siga sin validar: el terapeuta elige y configura, y el
> sistema solo recuerda lo que eligió.

**Propagado a:** `design/gdd/taxonomia-perfiles-funcionales.md` (sistema 15, provisional).

### 0.3 — ¿Qué significa "pulida"? **Que funcione**

Textual: *"que funcione, que se puedan iniciar múltiples juegos de forma funcional y
configurable (aunque sea a nivel básico) sin bugs evidentes"*.

Se descompone en cuatro requisitos, y el segundo cambia el alcance:

| Requisito | Consecuencia |
|---|---|
| **Que funcione** | Nivel 0 operativo en la tableta real |
| **Múltiples juegos** | **El MVP diseñado tiene UN instrumento. Entran dos más.** Ver el reparto abajo |
| **Configurable, aunque básico** | Los sistemas 11 (frontera de modo y panel) y 4 (modelo de dificultad) son obligatorios |
| **Sin bugs evidentes** | `/test-setup` y los criterios de aceptación en verde. Hoy no se puede ejecutar ninguno |

**Lo que NO pide, y por tanto sale del alcance de la primera prueba real:**

- **Persistencia entre sesiones.** Los sistemas 18 y 19 se aplazan
- Presets guardados (sistema 16)
- Vista de evolución longitudinal (sistema 20)
- Emparejamiento automático paciente-instrumento (sistema 15 como código)

> **Tensión registrada, no resuelta.** Sin persistencia el terapeuta obtiene una
> actividad, no una medición longitudinal. El sistema 9 mide **dentro** de la sesión y
> el 12 lo muestra al terminar, así que hay dato — pero no sobrevive al cierre del
> navegador. Se acepta porque es lo que el colaborador definió como suficiente, y **se
> revisita tras la primera prueba real**: es probable que el primer uso genere la
> petición de guardar.

### 0.4 — ¿De quién es la tableta? **Todo es nuestro, de momento**

| | |
|---|---|
| Desaparece | La política de TI de un centro ajeno como restricción |
| Despliegue | Copiar archivos al equipo. Coherente con ADR-0003 |
| **Sigue pendiente** | **Modelo, navegador y versión concretos.** Hacen falta para medir la resolución real de `performance.now()`, que el sistema 3 dejó como entrada obligatoria de `/test-setup` |

### 0.5 — ¿Hay pacientes con sensibilidad sensorial? **SÍ**

| | |
|---|---|
| Sistema 6 — modo de estímulo reducido | Pasa a **obligatorio en la primera prueba real** |
| Sistema 7 — control de silencio y volumen | Pasa a **obligatorio en la primera prueba real** |
| Refuerza | El anti-pilar 3 (sin gamificación extrínseca) y el pilar 2 (el error no se anuncia). Un efecto de celebración sería un problema activo, no solo ruido |

Recordatorio del sistema 2: el modo de estímulo reducido **no define tokens de color
propios**. Esa ambigüedad se cerró, no se movió.

### 0.6 — Permiso del centro: **NO APLICA de momento**

Pruebas internas con pacientes privados antes de ampliar a centros. Elimina el carril
administrativo, que era el de plazo más impredecible de la hoja de ruta.

**Queda pendiente para cuando se amplíe**, y conviene no perderlo de vista: el momento de
entrar en un centro es también el momento en que el material tiene que ser portable, que
es la propuesta de valor central. Los dos hitos coinciden.

### 0.7 — Consentimiento informado: **SÍ, por supuesto**

Confirmado. Población vulnerable — adultos mayores y personas con diversidad del
neurodesarrollo — así que hace falta antes de la primera sesión con un paciente.

**Posición sobre protección de datos, y es la limpia:** el terapeuta ya es responsable
del tratamiento de los datos de sus propios pacientes. La aplicación es una herramienta
que corre en su dispositivo y **no transmite nada**, igual que un juego de tarjetas de
papel. El anti-pilar 4 no es una promesa de producto: es lo que mantiene el proyecto
fuera del RGPD como encargado de tratamiento.

Eso se rompe el día que aparezca sincronización (sistema 19) o práctica en casa
(sistema 27). Esa frontera está escrita en el concepto y hay que respetarla.

---

## Reparto de instrumentos para la primera prueba real

"Múltiples juegos" exige adelantar instrumentos que estaban en Alpha. Se eligen por
**coste marginal**, no por interés: los tres primeros comparten banco, capa de entrada,
generación de tableros y registro, así que el segundo y el tercero son casi solo reglas.

| # | Instrumento | Depende de | Coste marginal | ¿Entra? |
|---|---|---|---|---|
| 10 | **Busca** (búsqueda visual) | 2, 3, 5, 8, 9 | Es el de referencia | **Sí** |
| 21 | **Clasificar por categorías** | 1, 5, 8, 9 | Reutiliza banco, tablero y registro. Cambia la regla de acierto y usa `categories[]`, que el manifiesto ya tiene | **Sí** |
| 24 | **Denominación de objetos** | 1, 5, 9 | Reutiliza banco y registro. No necesita generación de tableros: un estímulo cada vez | **Sí** |
| 22 | Transcribir símbolos | 3, 5, 9 | **No usa el banco de imágenes.** Contenido propio, así que su coste no es marginal | No |
| 23 | Precio justo | 1, 5, 9 | Requiere datos de precio, que son contenido nuevo y además envejecen | No |

**Tres instrumentos**, y los tres se sostienen sobre la misma infraestructura. Es
exactamente la apuesta que el índice de sistemas declaró al principio: *"la mayoría de
los sistemas del MVP no son el juego, son la infraestructura que hace que el segundo,
tercer y cuarto instrumento salgan baratos"*.

---

## Qué sigue sin respuesta

| Dato | Quién | Bloquea |
|---|---|---|
| Modelo, navegador y versión de la tableta | Tú, mirando el dispositivo | La medición de resolución de `performance.now()` en `/test-setup` |
| Validación clínica de la taxonomía provisional | El colaborador, revisando lo que escribamos | Que el producto pueda **sugerir** algo. No bloquea que el terapeuta elija a mano |
| `k`, `separacionMin` y `Θ` — las tres perillas sin validación empírica | Observación en uso real | Nada hoy. Se miden en R2 |
| Qué significa "pulida" **después** de la primera prueba | El colaborador, tras usarlo | El alcance del Nivel 1. La respuesta de hoy es una hipótesis a comprobar |
