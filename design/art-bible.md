# Biblia de arte — banco de imágenes

> **Status**: Draft
> **Fecha**: 2026-08-26
> **Autor**: `art-director`, con `accessibility-specialist` como especialista principal
> **Alcance**: los 384 elementos del banco. No cubre la interfaz del terapeuta

---

## 0. Por qué este documento existe antes que las imágenes

El concepto llama al banco *"el primer activo del proyecto"* y *"el coste real"*. Es el
carril de plazo más largo y el único que no depende de una línea de código, así que puede
avanzar en paralelo a todo lo demás.

Y hay una restricción que no aparece en ninguna biblia de arte normal: **el identificador
de una imagen es la clave con la que se guarda qué estímulo vio el paciente.** No existe
una operación de "reemplazar manteniendo el id". Si una imagen resulta mala, se **retira**
el identificador y se crea uno nuevo. Eso significa que el coste de equivocarse aquí no se
paga rehaciendo un archivo: se paga perdiendo la comparabilidad de los datos ya
registrados.

Por eso este documento decide antes de que exista una sola imagen.

---

## 1. La decisión: vector

**Formato: SVG.** Un archivo por elemento del banco.

Cinco argumentos, y el quinto es el que lo cierra.

**1. `forced-colors` funciona.** ADR-0005 acaba de decidir DOM porque el modo de alto
contraste de Windows no toca los píxeles de un canvas. El mismo argumento aplica al
formato del activo: un SVG en línea, o referenciado con `<img>` y `currentColor`, responde
al modo de colores forzados. **Un PNG no.** Para una población de baja visión que eligió
activamente el alto contraste, un banco de 384 PNG es un banco de 384 elementos que ignoran
esa elección.

**2. Escala sin pérdida, y el tamaño es un parámetro clínico.** El tamaño de objetivo lo
mueve el terapeuta en un rango que va de 24 px a 140 px según el registro de constantes. Un
ráster obliga a elegir una resolución base y aceptar reescalado en todo el resto del rango
— y el sistema 2 ya avisó del problema del **doble reescalado**: medir el contraste a una
resolución y servirlo a otra son dos operaciones que deben coincidir por suerte. Con vector
coinciden por construcción.

**3. F2 del sistema 2 casi desaparece.** El sistema 2 define un procedimiento para medir el
contraste de una silueta recortada con transparencia: umbral de alfa, erosión morfológica,
composición del anillo perimetral contra el fondo. **Bajo ráster eso es un subsistema.**
Bajo vector, una forma con relleno declarado no tiene recorte que medir: el contraste se
calcula directo con F1 sobre los colores del propio SVG.

Es el argumento que la revisión del sistema 2 elevó explícitamente contra el propio sesgo
del revisor sénior a recortar alcance, y quedó escrito en el concepto como entrada
obligatoria de este documento. Se cumple.

**4. Peso.** 384 SVG de línea simple pesan menos que 384 PNG a resolución suficiente para
140 px en pantalla de alta densidad. Importa porque el despliegue es copiar archivos y
porque la consulta puede no tener buena conexión.

**5. Y el que cierra: el color deja de estar cocido en el archivo.** Esta es la razón real.

El sistema 1 tiene una regla que parece menor y no lo es: **el color no puede ser el
criterio que separa dos clusters.** Si dos grupos visuales solo se distinguen por matiz, un
paciente con daltonismo recibe una dificultad que el terapeuta no configuró. Con ráster,
cumplir eso exige auditar 384 archivos y confiar en que nadie suba uno nuevo que la rompa.
**Con vector, el color es un atributo que el proyecto controla desde los tokens**, así que
la regla pasa de auditoría a construcción.

### Lo que se paga por elegir vector

| Coste | Magnitud |
|---|---|
| El stock vectorial de calidad es más escaso y más caro que el ráster | Real. Ver la sección 5 |
| Un SVG mal hecho puede traer trampas: texto sin convertir a trazo, filtros, imágenes ráster incrustadas | Se resuelve con una normalización en el pipeline, no con vigilancia humana |
| No sirve para elementos fotorrealistas | **No es un caso de este producto.** El estilo es de línea, ver sección 2 |

### Lo que NO se decide aquí

**No se prohíbe el ráster para siempre.** Si un instrumento futuro necesita fotografía
—reconocimiento de caras, por ejemplo— eso es una decisión de ese instrumento, con su
propio identificador de formato en el manifiesto y su propio pipeline de validación. Lo que
se decide es que **el banco compartido de los tres primeros instrumentos es vectorial**.

---

## 2. Estilo visual

El pilar 5 dice **adulto, no infantil**, y con la población confirmada — personas mayores y
adultos con diversidad del neurodesarrollo — eso no es una preferencia estética: un dibujo
infantil es condescendiente con un adulto de 70 años.

| Atributo | Decisión |
|---|---|
| **Trazo** | Contorno de peso uniforme, esquinas ligeramente redondeadas. Sin trazo variable ni caligráfico |
| **Relleno** | Plano. **Sin degradados, sin sombras, sin texturas** |
| **Perspectiva** | Frontal o tres cuartos, la más reconocible de cada objeto. Nunca escorzos difíciles |
| **Detalle** | El mínimo que identifica el objeto. Un detalle decorativo es ruido perceptivo |
| **Composición** | Objeto único y centrado, sin fondo, sin escena, sin base ni sombra de apoyo |
| **Recorte** | Ninguno. El objeto entero dentro del lienzo, con margen |

**Y una regla que sale del pilar 2:** ningún elemento del banco puede tener carga
emocional. Sin caras sonrientes, sin pulgares arriba, sin marcas de correcto o incorrecto
dibujadas en el propio activo. El error se mide, no se muestra — y un activo con expresión
lo mostraría por la puerta de atrás.

---

## 3. Los 16 clusters visuales

Un **cluster** es un grupo de elementos visualmente confundibles entre sí. Es lo que hace
real la perilla de similitud visual: subirla significa poblar el tablero con distractores
del mismo cluster que el objetivo.

**Reglas que el sistema 1 ya impone y que esta tabla debe respetar:**

- Cada elemento pertenece a **exactamente un** cluster, global.
- Un cluster debe ser **semánticamente contenido**: sus elementos comparten forma sin
  compartir necesariamente significado, o al revés — pero el cluster tiene que poder
  describirse en una frase.
- **El color no separa clusters.** La separación debe sobrevivir en escala de grises.
- Mínimo **24 elementos activos** por cluster (`clusterMin`, derivada, no elegida).

| # | Cluster | Criterio de forma | Ejemplos |
|---|---|---|---|
| 1 | Recipientes abiertos | Cilindro o cono con boca visible | taza, vaso, cubo, maceta, cazo |
| 2 | Recipientes cerrados | Volumen cerrado con tapa o cuello | botella, frasco, lata, termo |
| 3 | Asientos | Superficie horizontal con respaldo o patas | silla, banco, taburete, sillón |
| 4 | Superficies con patas | Plano horizontal elevado | mesa, escritorio, mesilla |
| 5 | Herramientas de mango largo | Eje dominante con cabeza en un extremo | martillo, escoba, paraguas, rastrillo |
| 6 | Herramientas de mano | Compacta, dos partes articuladas o pinza | tijeras, alicates, grapadora |
| 7 | Cubiertos y utensilios finos | Eje fino con extremo funcional | cuchara, tenedor, cuchillo, espátula |
| 8 | Frutas y verduras redondeadas | Volumen esférico u ovoide | manzana, naranja, tomate, cebolla |
| 9 | Frutas y verduras alargadas | Eje dominante curvo o recto | plátano, zanahoria, pepino, puerro |
| 10 | Prendas de torso | Silueta simétrica con aberturas | camisa, jersey, chaqueta, camiseta |
| 11 | Calzado | Suela con empeine, asimétrico | zapato, bota, sandalia, zapatilla |
| 12 | Objetos planos rectangulares | Dos dimensiones dominantes | libro, cuaderno, sobre, tableta |
| 13 | Objetos de escritura | Cilindro fino y alargado | lápiz, bolígrafo, rotulador, pincel |
| 14 | Animales de cuatro patas | Cuerpo horizontal con cuatro apoyos | perro, gato, caballo, vaca |
| 15 | Animales con alas | Cuerpo con apéndices laterales extendidos | pájaro, mariposa, gallina, murciélago |
| 16 | Vehículos con ruedas | Cuerpo horizontal sobre círculos | coche, bicicleta, autobús, carro |

**24 elementos × 16 clusters = 384.** Coincide con `bancoTotal` del registro, y no por
casualidad: `clusterMin = 24` se deriva de `Cmax` y `Rmax`, y `G = 16` es el número de
clusters que hace falta para que la perilla de similitud tenga recorrido.

### Cómo se comprueba que un cluster está bien formado

Un cluster está bien si **un adulto sin daltonismo, viendo los 24 elementos en escala de
grises al tamaño mínimo de 24 px, los confunde entre sí más que con elementos de otro
cluster.** Eso es exactamente la propiedad que la perilla necesita, y es medible con
personas antes de producir las 384.

> **Aviso, y es el mismo tipo que el de la taxonomía de perfiles:** esta tabla de 16
> clusters es **una propuesta de ingeniería y arte, no una taxonomía validada.** Está
> construida sobre criterios de forma que se pueden defender, pero **nadie ha comprobado
> con personas** que los agrupamientos se confundan como esta tabla predice. Ver la
> sección 6.

### Categorías, que son otra cosa

El manifiesto tiene **dos** campos distintos, y confundirlos rompería la perilla:

| Campo | Cardinalidad | Para qué |
|---|---|---|
| `cluster` | **Uno**, global | Similitud **visual**. Lo de arriba |
| `categories[]` | **Varias** | Similitud **semántica**. Cocina, ropa, animales, oficina, jardín, aseo… |

Un tomate está en el cluster 8 (redondeados) y en las categorías `alimento` y `cocina`. Una
taza está en el cluster 1 y en `cocina` y `bebida`. **Los dos ejes son independientes y el
colaborador lo confirmó**, y es lo que sostiene el banco de 384 en lugar de ~130.

---

## 4. Requisitos técnicos de cada archivo

| Requisito | Valor | Por qué |
|---|---|---|
| Formato | SVG 1.1, sin `<foreignObject>` | Compatibilidad y sin superficies de ejecución |
| Lienzo | `viewBox="0 0 100 100"`, cuadrado | Un solo sistema de coordenadas para los 384 |
| Margen interior | 6 unidades mínimo por lado | El objeto no toca el borde a ningún tamaño |
| Texto | **Ninguno.** Convertido a trazo si el original lo tenía | Un texto sin convertir depende de fuentes del sistema |
| Ráster incrustado | **Prohibido** | Anularía las cinco razones de elegir vector |
| Filtros y máscaras | **Prohibidos** | Coste de render y comportamiento inconsistente bajo `forced-colors` |
| Grupos y transformaciones | Aplanados | Simplifica la normalización y el diff |
| Color | Declarado con tokens del proyecto, no con literales hex | Es lo que hace que la regla del color se cumpla por construcción |
| Peso | Objetivo por debajo de 4 KB por archivo | 384 × 4 KB ≈ 1,5 MB de banco completo |
| Nombre de archivo | El identificador más `.svg` | El identificador es la clave. Nunca se renombra |

**El pipeline de normalización es del sistema 13**, no de aquí: aplanar grupos, convertir
texto a trazo, rechazar ráster incrustado y filtros, comprobar el `viewBox` y el margen, y
sustituir literales de color por tokens. Este documento define **qué** es válido; esa
herramienta lo hace cumplir.

---

## 5. De dónde salen las 384

Cuatro vías, y hay que combinarlas.

| Vía | Coste | Riesgo | Veredicto |
|---|---|---|---|
| **Bibliotecas de iconos con licencia permisiva** — Material Symbols, Tabler, Lucide, Phosphor | Cero | Cobertura sesgada hacia interfaz. Muchos objetos cotidianos no existen | **Base. Cubre quizá el 40-60% de la lista** |
| **Stock vectorial de pago** | Medio | Estilo heterogéneo entre autores. Requiere normalización fuerte | **Relleno de huecos** |
| **Encargo a un ilustrador** | Alto | Plazo | **Solo para los huecos que no cubra nada, y para unificar estilo** |
| **Generación asistida** | Bajo | Calidad irregular y licencias turbias. Un SVG generado suele traer basura estructural | **No para el banco. Sirve para maquetas** |

**Antes de gastar nada:** hay que auditar la cobertura. Para cada uno de los 16 clusters,
cuántos de los 24 elementos existen ya en una biblioteca de licencia permisiva. **Esa
auditoría es la primera tarea real del carril de arte**, y decide el presupuesto.

**Y la revisión de licencias no es opcional.** Cada archivo del banco necesita su licencia
registrada, porque el producto se va a usar en consulta y algún día se va a distribuir. El
campo `attrs` del manifiesto puede llevar la atribución; el sistema 1 ya lo tiene.

### El orden de producción, y no es de 1 a 16

Se producen **primero los clusters que los tres instrumentos del primer hito necesitan de
verdad**, no los 16 en orden:

1. **Cuatro clusters completos** (96 elementos) bastan para que Busca tenga recorrido real
   en la perilla de similitud visual. Candidatos: 1, 8, 13 y 16 — recipientes, redondeados,
   escritura y vehículos, que son formas muy distintas entre sí.
2. **Categorías semánticas sobre esos cuatro clusters**, para que *clasificar por
   categorías* funcione.
3. Los doce clusters restantes, después de la primera prueba real.

**96 elementos, no 384, para llegar al primer hito.** Con `Cmax` reducido mientras el banco
crece — y `Cmax` es una perilla clínica que el terapeuta ya controla, así que no es un
apaño: es el uso previsto del parámetro.

---

## 6. Qué está sin validar, y lo digo aquí

| Suposición | Cómo se comprueba |
|---|---|
| **Que los 16 clusters se confundan como esta tabla predice** | Con personas, en escala de grises, al tamaño mínimo. Antes de producir los 384 |
| Que el estilo de línea plana sea reconocible para personas mayores | Con el colaborador, sobre 20 elementos de muestra |
| Que 24 elementos por cluster den la sensación de dificultad que el terapeuta espera | En la primera prueba real |
| Que el objetivo de 4 KB por archivo sea alcanzable con el estilo elegido | Midiendo los primeros 20 |
| Que exista cobertura de licencia permisiva para al menos la mitad de la lista | La auditoría de la sección 5 |

**Ninguna de las cinco está medida.** Se declaran aquí para que no se conviertan en
supuestos silenciosos, que es exactamente el modo de fallo que este proyecto ya ha
encontrado cuatro veces.

---

## 7. Lo que este documento le pasa a otros

| Destino | Qué |
|---|---|
| **Sistema 13** — herramientas del banco | El pipeline de normalización de SVG y el validador de los requisitos de la sección 4 |
| **Sistema 2** — tokens | El color de los activos sale de tokens, no de literales. **Reduce F2 a casi nada**, tal como la revisión del sistema 2 predijo |
| **Sistema 1** — manifiesto | Los 16 clusters de la sección 3 son los valores válidos del campo `cluster`. El campo `attrs` lleva la atribución de licencia |
| **Sistema 10** — Busca | Con cuatro clusters completos ya hay recorrido en la perilla visual. No hace falta el banco entero |
| **`/gate-check`** | Las cinco suposiciones de la sección 6, como bloqueantes declarados |
