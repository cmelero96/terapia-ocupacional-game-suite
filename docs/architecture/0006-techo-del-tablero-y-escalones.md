# ADR-0006 — El techo del tablero baja a 60, y las perillas de dificultad pasan a escalones

- **Fecha**: 2026-09-01
- **Estado**: Aceptada
- **Decide**: Carlos (propietario del producto)
- **Resuelve**: los bloqueantes C1, C2, C3 y C4 del informe cruzado del 2026-08-26.
  Registra además la postura tomada sobre D1 y D2, que **no** se resuelven aquí

## Contexto

La revisión cruzada de los 13 GDD dio veredicto FAIL con 13 bloqueantes. Seis de ellos no
eran defectos de código: eran decisiones que nadie había tomado, y que el código había
resuelto por su cuenta eligiendo un valor plausible. Esta ADR las cierra todas de una vez,
porque cuatro están acopladas por el mismo número.

## Decisión 1 — `Cmax` baja de 100 a 60, y el banco de imágenes de 384 a 256

**Es la decisión de dinero.** El mínimo de imágenes por grupo visual se deriva del tablero
máximo, así que `Cmax` dimensiona el activo más caro del proyecto.

Había **dos errores encadenados**, y sólo el primero estaba en el informe:

1. **`distractores(C)` es una fórmula muerta.** Publicaba 90 distractores en un tablero de
   100. El código hace `nD = C − 1`, o sea 99, y **ningún módulo de `src/` invoca F1**: el
   producto entero asume un objetivo por tablero, y así lo declaran `generacion-tableros.md`
   e `instrumento-busca.md`. El informe cruzado detectó esto y concluyó que el banco debía
   crecer a 416.
2. **`Cmax = 100` nunca se validó con nadie.** Era un número redondo. Nadie ha demostrado
   que un tablero de 100 objetos sea clínicamente útil, y hay un argumento fuerte de que
   **no** lo es: a 100 objetos el tamaño de objetivo cae por debajo de 44 px, que es
   justamente la frontera donde los dos ejes de dificultad **dejan de ser independientes**.
   El tablero máximo estaba en la esquina donde el pilar 3 ya está roto.

Corregidos los dos a la vez:

```
clusterMin = ceil( (Cmax − 1) / Rmax ) + 1

Cmax = 100, fórmula muerta  ->  ceil(90/4) + 1 = 24  ->  banco 384   (lo planificado)
Cmax = 100, fórmula real    ->  ceil(99/4) + 1 = 26  ->  banco 416   (lo que decía el informe)
Cmax =  60, fórmula real    ->  ceil(59/4) + 1 = 16  ->  banco 256   ACEPTADO
```

**128 imágenes menos que producir, y 160 menos que la cifra corregida.** Entre los dos
candidatos con `Cmax = 60` se eligió el más alto, que es el que sale de la fórmula real.

**Lo que se pierde:** la capacidad de configurar un tablero de más de 60 objetos. No hay
constancia de que nadie la necesite.

**Consecuencia que hay que vigilar.** `nC` se normaliza contra `Cmax`, así que mover el techo
**cambia la dificultad calculada de todos los tableros**. Tres canarios de test lo
delataron inmediatamente, que es exactamente su razón de existir: el mismo tablero de 12
objetos pasa de 3,7 a 6,3. Hoy sale gratis porque no hay ninguna sesión real registrada.
**Después de la primera sesión con un paciente, esta constante no se vuelve a tocar.**

## Decisión 2 — `Cmin` es 3, y el conflicto desaparece al retirar la fórmula muerta

El informe marcó que `Cmin` estaba definida dos veces: **9** en el manifiesto y **3** en el
modelo de dificultad, con el código usando 3.

**No era un conflicto clínico.** El 9 era el dominio inferior de `objetivos(C)`, la fórmula
muerta de la decisión 1. Al retirarla, el 9 se queda sin nada que dimensionar. `Cmin = 3` —un
objetivo y dos distractores— y vive una sola vez, con `modelo-dificultad.md` como fuente.

Las dos fórmulas se marcan `status: MUERTA` en el registro, **no se borran**: durante meses
derivaron el presupuesto de contenido, y quien encuentre el 24 antiguo en un documento sin
actualizar necesita poder llegar hasta la explicación. Si algún día hace falta un instrumento
de varios objetivos por tablero, la decisión se retoma desde cero.

## Decisión 3 — Las cuatro perillas de dificultad pasan de deslizador a escalones

El concepto prohibía los deslizadores y el panel los usaba. Aceptado el concepto: escalones.

**El argumento del concepto era la comparabilidad**, y es correcto. Con un deslizador
continuo, la sesión de marzo a 63 px y la de junio a 64 px **no son comparables**: no se
puede saber si el paciente mejoró o si el terapeuta movió el control un pelo. Todo el
producto existe para medir progreso, así que un control que impide comparar es un defecto de
producto, no una preferencia. Con escalones, dos sesiones en el mismo escalón son
comparables por construcción, y el eje de progreso deja de necesitar un margen de tolerancia
inventado para decidir si dos configuraciones "son la misma".

**Y hay un segundo argumento que el concepto no daba, más fuerte que el primero.** Un
`<input type="range">` **se opera arrastrando**. `technical-preferences.md` prohíbe el
arrastre como vía única, y el criterio 2.5.7 de WCAG 2.2 exige alternativa. Un grupo de
botones se activa con un solo punto, así que también funciona con barrido por pulsador y con
permanencia.

**El deslizador era la única parte del producto que fallaba su propia regla de entrada**, y
llevaba ahí desde que se escribió el panel. Ningún test lo detectó porque todos los tests del
panel usaban `.fill()`, que salta el gesto y escribe el valor directamente.

Escalas elegidas, en `src/dificultad/escalones.js`:

| Perilla | Escalones | Por qué |
|---|---|---|
| Tamaño `t` | 24, 32, 44, 60, 80, 100, 120, 140 | 24 es el mínimo de WCAG 2.5.8; 44 el mínimo AAA y la frontera de acoplamiento de ejes; 140 el techo de disposición. Espaciado creciente, porque la dificultad motora es logarítmica |
| Cantidad `C` | 3, 4, 6, 9, 12, 16, 20, 30, 40, 60 | Denso abajo: de 3 a 4 objetos es un salto grande de carga, de 40 a 60 es casi imperceptible |
| Similitud `sv`, `ss` | 0, 0,25, 0,50, 0,75, 1 | Cuartos. Nadie ha demostrado que 0,30 y 0,35 sean distinguibles, y fingir esa precisión es lo que rompe la comparabilidad |

Una configuración que llega por URL sin caer en un escalón **se ajusta al más cercano**, y en
caso de empate gana el más bajo: si hay que equivocarse al migrar, se equivoca hacia el
objetivo más grande y el tablero más pequeño, que es el lado que no frustra al paciente.

**Lo que se pierde:** el ajuste fino. Si un paciente necesita exactamente 63 px, se juega a
60. Es el precio de poder comparar.

## Decisión 4 — El panel se abre con un botón visible

El concepto pedía un gesto escondido; el panel usa un botón. Aceptado el botón.

Un gesto escondido tiene un coste que el concepto no valoró: un terapeuta que no recuerda el
gesto se queda fuera de su propia herramienta, y el presupuesto de 30 segundos no admite
buscarlo. La frontera de modo ya está protegida por otros medios: el barrido se pausa al
abrir el panel y su foco no entra en los controles.

## Decisión 5 — La primera prueba se hace con el panel completo (D1)

El concepto diseñó tres mecanismos para que el panel no se coma los 30 segundos: valores por
defecto por perfil, divulgación progresiva, y presets por paciente. **Los tres faltan.**

**Aceptado de forma explícita: la primera prueba se hace con las cuatro perillas a la vista.**
Es una decisión informada, no un olvido. Consecuencia que hay que registrar en la primera
sesión real: **el tiempo de configuración medido no será el del producto terminado**, y no
sirve para validar el presupuesto de 30 segundos.

## Decisión 6 — La habituación queda aparcada (D2)

El paciente que ve las mismas imágenes cada semana responde más rápido porque se las sabe:
unas 56 reapariciones en 15 tableros, calculado en F7 del sistema 1. Cuatro documentos
asignan la mitigación a otro sistema, en círculo, y ninguno contiene la regla.

**Aparcado por decisión del propietario del producto.** No se cierra, y esta ADR no lo
resuelve. Queda anotado el coste, porque es el que el concepto llama el peor defecto
posible: *"todo lo que el terapeuta ve mejorando está contaminado"*. Cualquier medida de
progreso obtenida antes de resolverlo lleva esa contaminación, y hay que decirlo al leer los
resultados.

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Banco de 416, con `Cmax = 100` | Es la respuesta correcta a la pregunta equivocada: corrige la fórmula y da por bueno un techo que nadie validó |
| Banco de 384, dejando la fórmula muerta | Es el número que la revisión demostró falso |
| Bajar `Rmax` de 4 a 5 para encoger el banco a 208 | `Rmax` es cuántas veces se repite un distractor **dentro de un tablero**. Subirlo empeora la habituación, que es el problema de la decisión 6. Ahorrar contenido empeorando la medida es cambiar coste por validez |
| Escalones sólo en `t`, deslizador en las demás | El problema de comparabilidad es idéntico en las cuatro |
| Mantener el deslizador y añadir una caja de número al lado | Dos controles para un valor, y la caja de número tampoco resuelve la comparabilidad |

## Consecuencias

- **Producción de contenido desbloqueada**: 256 imágenes, 16 clusters de 16. Se puede
  encargar la primera.
- Propagado a `entities.yaml`, `manifiesto-banco-imagenes.md`, `game-concept.md`,
  `art-bible.md`, `generacion-tableros.md`, `inyeccion-no-determinismo.md` y
  `systems-index.md`.
- Tres canarios de dificultad recalculados **ejecutando la fórmula**, no de memoria.
- El presupuesto de rendimiento se mide ahora en el techo real, 60 elementos: 0,50 ms de
  render contra 16,6 de presupuesto.
- `tests/ayudas/panel.js` centraliza el manejo de las perillas en los tests, para que el
  próximo cambio de control no rompa siete archivos.
- **Sin validación empírica**: ninguna de las escalas se ha probado con un terapeuta. Los
  escalones son una propuesta, y la primera sesión real puede moverlos.
