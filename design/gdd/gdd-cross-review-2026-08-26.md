# Revisión cruzada de GDD — 2026-08-26

> **Veredicto: FAIL**
> GDD revisados: **13 de sistema** (16 sistemas), más el concepto, el índice, la biblia de
> arte y el registro de entidades. **6.741 líneas de GDD.**
> Pases: consistencia (`systems-designer`, **incompleto**), teoría de diseño
> (`game-designer`, completo), paseo por escenarios (sesión principal, 5 escenarios).

**Contexto que cambia el peso de todo lo que sigue: once de los dieciséis sistemas ya
tienen código**, con 157 tests de Node y 33 de navegador en verde. Nueve de los trece
bloqueantes **ya están en el código**, así que no son correcciones de documento.

---

## Aviso de alcance, primero

**El pase de consistencia no terminó.** Agotó su límite de turnos tras 237.000 tokens y 37
llamadas de herramienta, y declaró sus huecos:

| Apartado | Estado |
|---|---|
| 2a bidireccionalidad | Cubierto para los sistemas 1-12, 21, 24. **No** para 13-20, 22, 23, 25-27 |
| 2b contradicciones de regla | **Parcial.** No revisó "qué puede tocar el paciente" |
| 2c referencias obsoletas | Un hallazgo. Una pista del brief sin confirmar |
| 2d propiedad de perillas | Cubierto para las cuatro pedidas |
| 2e compatibilidad de fórmulas | Los cinco pares, con números |
| **2f criterios cruzados** | **SIN CUBRIR** |
| No leídos | `game-concept.md`, `art-bible.md`, los cuatro logs de revisión |

**Con 166 criterios de aceptación declarados en trece documentos, 2f es el apartado con más
superficie sin revisar.** Este informe no es una revisión completa, y presentarlo como tal
sería el mismo defecto que el proyecto ya ha castigado dos veces: sobredeclarar rigor.

Y el incidente es en sí un dato: **el volumen de documentación ya excede lo que un revisor
procesa de una pasada.** Los tres GDD más largos —1120, 968 y 899 líneas— son exactamente
los tres que pasaron revisión adversaria, y los diez sin revisar promedian 246. La revisión
mejora la calidad y empeora la legibilidad, y eso importa para decidir cómo se revisan los
nueve pendientes.

---

## Bloqueantes de consistencia

### C1 — `Cmin` está definida dos veces con valores distintos

| Valor | Fuente |
|---|---|
| **9** | `manifiesto-banco-imagenes.md` |
| **3** | `modelo-dificultad.md` |

El código usa 3. **Ya en el código.**

### C2 — El concepto exige un gesto para abrir el panel; el sistema 11 usa un botón visible

`game-concept.md` línea 317: *"**Un único gesto de apertura, imposible para el paciente por
construcción.** El paciente activa con un puntero, al soltar, y el arrastre está excluido por
especificación. Por tanto una pulsación larga en esquina (≥800 ms), un toque con dos dedos, o
una tecla física quedan fuera de su gramática de entrada. **No es seguridad por oscuridad:**
se deriva de la especificación de entrada ya escrita."*

`panel-terapeuta.md` regla 2: *"El disparador es un botón fuera del tablero... **No** una
pulsación larga, ni un gesto."*

**Los dos argumentan, y no me corresponde decidir.** Pero el argumento del concepto es más
fuerte de lo que el sistema 11 le concedió: la restricción de un solo punto de activación
protege al **paciente**, no al terapeuta, y el terapeuta sí puede hacer una pulsación larga.
**Ya en el código.**

### C3 — El concepto prohíbe sliders; el panel usa sliders

`game-concept.md` línea 325: *"**Controles discretos (− valor +), no sliders.** Elimina el
arrastre accidental por control motor reducido, es más rápido para el pilar 1, y **peldaños
discretos son comparables entre sesiones; un slider continuo no lo es**."*

`src/panel/panel-dom.js` usa `input type="range"` en las cuatro perillas.

**El tercer argumento es el que ningún GDD posterior recogió**, y es el que decide: un valor
continuo hace que dos sesiones no sean comparables, y eso ataca la premisa de medición del
producto. **Ya en el código.**

### C4 — `objetivos(C)` y `distractores(C)` son fórmulas muertas, y `clusterMin` está derivada de ellas

`manifiesto-banco-imagenes.md` F1 publica `objetivos(100) = 10`, luego `distractores(100) = 90`.

Pero `generacion-tableros.md` usa `nD = C − 1`, `instrumento-busca.md` declara **un** objetivo,
y `src/tablero/generador.js:106` hace `const nD = C - 1`. F1 no se invoca desde ningún módulo
de `src/`.

**Y arrastra el presupuesto de contenido**, que es lo que ningún documento vio:

```
clusterMin = ceil(distractores(Cmax) / Rmax) + 1

con distractores = 90  (F1, muerta)  →  clusterMin = 24  →  banco = 384
con distractores = 99  (el código)   →  clusterMin = 26  →  banco = 416
```

**`clusterMin = 24` está derivada de una fórmula que el producto no usa.** El valor correcto
es 26 y el banco 416: **32 imágenes más, un 8,3% de coste de contenido** sobre *"el primer
activo del proyecto"*. Propaga a `entities.yaml`, el manifiesto, el concepto y la biblia de
arte, que fija los clusters en 24. **Ya en el código y en la biblia de arte.**

### C5 — La fila 24 del índice omite el sistema 8

`systems-index.md`, sistema 24: *"Depende de: 1, 5, 9, 10"*. Pero `generacion-tableros.md`
lista el 24 entre sus dependientes, y el GDD de los instrumentos declara que reutiliza la
generación de tableros. Solo documentación.

---

## Bloqueantes de teoría de diseño

### D1 — Los tres mecanismos que el concepto diseñó para que el pilar 1 sobreviva al pilar 3 no están implementados

`game-concept.md`, *"Regla de arbitraje: pilar 1 contra pilar 3"* (líneas 471-484):

> *"Gana el pilar 1 en la superficie. El pilar 3 se satisface por debajo. En concreto:
> 1. **Valores por defecto por perfil**... 2. **Divulgación progresiva. Una o dos perillas
> visibles; las demás detrás de 'más opciones'**... 3. **Presets por paciente**..."*
> *"Esta regla resuelve además el conflicto del panel de configuración y el presupuesto de
> interacción de los 30 segundos."*

Estado real:

| Mecanismo | Estado |
|---|---|
| Valores por defecto por perfil | Sistema 15, **provisional sin validar**, y el producto no sugiere nada |
| Divulgación progresiva | **No implementada.** El panel muestra las cuatro perillas a la vez |
| Presets por paciente | Sistema 16, **fuera del primer hito** |

**Los tres están ausentes, y el sistema 11 está marcado como implementado y ejecutable.** El
propio panel declara que su AC-10 *"no puede sustituir esa medición"* con una persona. **Ya en
el código.**

### D2 — La mitigación de la habituación no tiene dueño, y el código excluye lo que haría falta

Un triángulo cerrado, verificado línea por línea:

| Documento | Línea | Asigna la política de muestreo a… |
|---|---|---|
| `manifiesto-banco-imagenes.md` | 593 | **Sistema 8** — *"No reutilizar el mismo cluster maximizado en tableros consecutivos"* |
| `generacion-tableros.md` | 107 | **Sistema 9** |
| `generacion-tableros.md` | 320 | **Sistema 9** |
| `registro-rendimiento.md` | 100 | **Sistema 8** |

**Ningún documento contiene la regla.** Y el sistema 8 excluye por diseño el estado que la
haría posible, en el GDD (línea 86) y en el código (`generador.js:63`): *"El cursor nace y
muere dentro de un tablero: no hay estado que sobreviva entre tableros."*

F7 del sistema 1 cuantificó el problema: **~56 reapariciones en 15 tableros**. Y el concepto
lo llama el peor defecto posible: *"todo lo que el terapeuta ve mejorando está contaminado."*
**Ya en el código, y en los dos instrumentos nuevos que comparten el mismo banco.**

---

## Bloqueantes del paseo por escenarios

Cinco escenarios recorridos **en el código**, no en teoría. Los cuatro hallazgos están
demostrados con ejecución.

### S1 — Aplicar una configuración destruye el registro de la sesión

Medido en el navegador:

```
ANTES de aplicar : 2 intentos, 2 tableros, sesión orden 0
DESPUÉS          : 0 intentos, 0 tableros, sesión orden 0
```

`index.html` `alAplicar` hace `location.href = url`: una recarga completa, y el registro vive
en memoria. **Es el flujo central del producto** —el terapeuta ajusta una perilla a mitad de
sesión— y borra en silencio todo lo medido. Sin aviso.

### S2 — El registro no es por tablero, así que el eje de progreso reporta un número falso

`raiz.js:84` mete **todos** los intentos en un único registro de tablero con el `dp` del
tablero actual. Demostrado:

```
intentos repartidos en 4 niveles de dp   →  dificultadTolerada = 60
los mismos 40 intentos, todos con d=80  →  dificultadTolerada = 80
```

**No falla: reporta 80 en lugar de 60.** Sobrestima la dificultad tolerada en veinte puntos,
con plena confianza, y en la dirección peligrosa. Es el eje de progreso del producto entero.

### S3 — Dos de las cinco vías de acceso no están conectadas

`Barrido` y `Permanencia` están implementadas y probadas con 22 tests… y **nadie las monta**.
Comprobado por grep: `Barrido` solo lo referencia `conflictos.js` para el aviso de cadencia;
`Permanencia` no la importa nadie.

El producto responde a táctil, ratón y teclado. **No responde a pulsador por barrido ni a
activación por permanencia** — las dos vías que necesita la población para la que existe.

Y es peor que un hueco: **el panel avisa de la cadencia del barrido**, lo que hace creer al
terapeuta que funciona. AC-7, AC-11, AC-12 y AC-13 del sistema 5 quedan sin cubrir.

### S4 — El caso límite de intentos incompletos no existe

`panel-terapeuta.md`: *"el tablero se descarta y sus intentos parciales se conservan marcados
como incompletos."* No existe ningún campo `incompleto` en `src/`.

---

## Avisos

| # | Hallazgo | Dónde |
|---|---|---|
| A1 | El índice sigue citando *"23-30 elementos, unos 400 en total"*, corregido hace tres revisiones | `systems-index.md` |
| A2 | `t` se declara como perilla propia en el sistema **2 y** en el 4. Los rangos coinciden; la propiedad no. El 5 sí cede explícitamente | tokens, dificultad |
| A3 | El GDD de los instrumentos 21/24 es el **único sin párrafo de comprobación bidireccional**, y su lista de dependencias no coincide con ninguna fila del índice | clasificar-y-denominar |
| A4 | Con el banco provisional (8 por cluster), a `C = 32` y `sv = 1,0` el techo de reutilización es `ceil(31/7) = 5`, **por encima de `Rmax = 4`**. Ninguno de los cuatro conflictos del panel lo detecta | provisional + panel |
| A5 | **La estrategia dominante es no tocar nada.** Con los valores por defecto visibles y sin presets ni defaults por perfil, un terapeuta con prisa abre, no toca, aplica. Eso maximiza el pilar 1 y vacía el 3 — y **H1 puede pasar sin que el producto demuestre su propuesta de valor**, porque ningún criterio comprueba que el terapeuta *modificó* algo | concepto + 4 + 11 |
| A6 | **Subir `C` degrada el barrido y no se marca en el registro.** Con `t < 44` el sistema 4 marca `ejesAcoplados` y excluye la métrica. Con `C ≥ 30` el barrido toca el suelo de 400 ms y el fallo de ritmo se lee como fallo de búsqueda — y `barridoRecortado` **no es uno de los cuatro motivos** del sistema 9. Mismo patrón, rigor distinto | 4, 5, 9, 11 |
| A7 | La fantasía de Descubrimiento de Busca —*"ninguna ronda repite exactamente"*— está desmentida por F7, y el GDD del instrumento no lo menciona | concepto, 1, 10 |
| A8 | El sistema 15 **no tiene sección Player Fantasy**, contra el estándar del propio proyecto, que los sistemas 1, 2 y 3 sí cumplen declarándola vacía por escrito | taxonomía |
| A9 | El sistema 11 promete *"del paciente: no ver el panel nunca"* y su propio caso límite dice que si lo pulsa, se abre | panel |
| A10 | El bucle de Lectura (2 min) no tiene el mismo rigor de medición que los 30 s, y el sistema 12 exige leer bastante texto por sesión | concepto, 12 |

---

## La respuesta a la pregunta transversal

**¿Invita el diseño a sobreinterpretar un número? Sí, por dos vías concretas que ningún
documento había señalado.**

**El formato contradice la advertencia.** `modelo-dificultad.md` publica `dm` y `dp` **con un
decimal**, y esos valores dependen de cinco constantes marcadas `validated: false`. El sistema
12 hace un trabajo real de mitigación —limitación adyacente, ningún juicio, motivos en vez de
ceros— pero **no toca el formato**. Publicar «60,0» es la señal visual de precisión que la
frase de al lado intenta desactivar por texto. Un profesional ocupado lee el número antes que
el párrafo, y el número dice *"medido con precisión de una décima"* mientras el texto dice
*"no confíes en la magnitud"*. Dos señales contradictorias en el mismo elemento.

**Y falta una advertencia.** `dm` y `dp` se muestran en la misma escala [0,100] con el mismo
formato, pero una es logarítmica derivada de la ley de Fitts y la otra lineal con pesos sin
validar. El sistema 12 advierte contra comparar dos pacientes; **no advierte contra comparar
`dm` con `dp` del mismo paciente** — una comparación cruzada que la arquitectura de dos ejes
hace parecer natural y que no tiene ninguna base matemática común.

Las trece constantes sin validar y la frase de «ordinal, no calibrada» son **necesarias y no
suficientes**.

---

## Lo que NO se encontró, y vale decirlo

- **3a — competencia de bucles de progresión: sin hallazgos.** Los sistemas 4, 9 y 12 son
  consistentes en que el único eje es la dificultad tolerada a precisión constante. El
  concepto ya corrigió un error previo de tres ejes, y la corrección se propagó bien.
- **3f — ningún sistema viola un anti-pilar.** Ninguna puntuación comparativa, ninguna presión
  de tiempo por defecto, ninguna gamificación extrínseca se cuela en ningún documento.
- **2b — sin contradicciones nuevas de regla** más allá de C1, en lo que se llegó a revisar.
  Qué se registra y qué no es consistente en los cinco sistemas que lo tocan.
- **2e — `dp` frente a las proporciones efectivas: verificado sin contradicción.** El ejemplo
  publicado (51,7 y 40,1) se rehizo a mano y coincide.
- Las fantasías del terapeuta entre sí son coherentes, y las del paciente entre sí también.

---

## GDD marcados para revisión

| GDD | Motivo | Tipo | Prioridad |
|---|---|---|---|
| `manifiesto-banco-imagenes.md` | F1 muerta; `clusterMin` derivada de ella; `Cmin` duplicada | Consistencia | **Bloqueante** |
| `modelo-dificultad.md` | `Cmin` duplicada; formato de un decimal | Consistencia | **Bloqueante** |
| `panel-terapeuta.md` | Sin divulgación progresiva; sliders; botón contra gesto; fantasía absoluta | Ambos | **Bloqueante** |
| `generacion-tableros.md` | Triángulo de propiedad de la habituación | Diseño | **Bloqueante** |
| `registro-rendimiento.md` | Triángulo de propiedad; falta el motivo `barridoRecortado` | Diseño | **Bloqueante** |
| `game-concept.md` | Banco de 384 a 416; la regla de arbitraje no se cumplió | Consistencia | **Bloqueante** |
| `design/art-bible.md` | Clusters de 24 a 26; banco de 384 a 416 | Consistencia | **Bloqueante** |
| `systems-index.md` | Fila 24 sin el 8; rango «23-30, ~400» obsoleto | Consistencia | Aviso |
| `tokens-tema-contraste.md` | Declara `t` como perilla propia sin ceder al sistema 4 | Consistencia | Aviso |
| `instrumento-busca.md` | Fantasía de Descubrimiento desmentida por F7 | Diseño | Aviso |
| `capa-adaptacion-entrada.md` | `Barrido` y `Permanencia` sin conectar; se atribuye el 7 como dependiente directo | Consistencia | **Bloqueante** |
| `instrumentos-clasificar-y-denominar.md` | Sin comprobación bidireccional; dependencias que no cuadran | Consistencia | Aviso |
| `taxonomia-perfiles-funcionales.md` | Sin sección Player Fantasy | Consistencia | Aviso |
| `resultados-sesion.md` | Falta advertencia contra comparar `dm` con `dp` | Diseño | Aviso |

---

## Acciones requeridas antes de volver a ejecutar

Ordenadas por lo que arreglan, no por esfuerzo.

**Los cuatro que impiden que el producto mida:**

1. **S2 — el registro por tablero.** Sin esto, el eje de progreso reporta un número falso 20
   puntos alto. Es el arreglo más importante de la lista.
2. **S1 — aplicar sin recargar la página.** Sin esto, el flujo central borra los datos.
3. **D2 — adjudicar la política de muestreo contra la habituación**, y decidir si el sistema 8
   necesita estado entre tableros. Hoy su diseño lo excluye.
4. **S3 — conectar `Barrido` y `Permanencia`**, o quitar del panel el aviso que hace creer que
   funcionan. Las dos cosas son aceptables; dejarlo como está no.

**Los tres que son decisiones tuyas, no mías:**

5. **C2 — botón contra gesto** para abrir el panel. Los dos documentos argumentan.
6. **C3 — sliders contra controles discretos.** El argumento de comparabilidad entre sesiones
   del concepto es fuerte y el sistema 11 no lo consideró.
7. **D1 — divulgación progresiva**, o aceptar por escrito que el pilar 1 se mide sin la
   mitigación que el concepto diseñó.

**Los dos de aritmética, que propagan a cuatro documentos:**

8. **C4 — `clusterMin` de 24 a 26 y el banco de 384 a 416**, o declarar `objetivos(C)` muerta
   y rederivar. **Decidir esto antes de encargar una sola imagen.**
9. **C1 — `Cmin`**: un solo dueño.

---

## Veredicto: FAIL

Trece bloqueantes, **nueve ya en el código**. Y dos de ellos —S2 y D2— hacen que el producto
publique mediciones contaminadas sin señalarlo, que es exactamente lo que el pilar 2 existe
para evitar.

**Con el aviso de alcance de arriba:** el apartado 2f no se revisó, y el concepto y la biblia
de arte no los leyó el pase de consistencia. Un FAIL con un pase incompleto significa que el
recuento real de bloqueantes es un **suelo**, no un total.
