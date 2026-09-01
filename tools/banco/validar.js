/**
 * Validador del manifiesto del banco de imágenes. Sistema 13.
 *
 * **Función PURA con predicados inyectados.** No lee el disco por sí misma: recibe
 * `existeArchivo`. Dos motivos, y el segundo es el que importa a largo plazo:
 *
 * 1. Los estándares de test del proyecto prohíben que un test unitario toque el disco.
 * 2. **ADR-0001 lo pide explícitamente**, para que el mismo validador sirva en construcción
 *    y en una futura ruta de ejecución, si algún día el terapeuta sube sus propias imágenes
 *    (sistema 19). Un validador que abre archivos sólo sirve en construcción.
 *
 * ## Validación TOTAL, nunca parcial
 *
 * El validador **recoge todos los problemas** y después decide. No aborta en el primero.
 *
 * Con 256 entradas curadas a mano, un validador que aborta obliga a 256 ejecuciones para
 * encontrar 256 erratas. Y con un solo error no aprueba nada: no existe «manifiesto
 * parcialmente válido», porque un banco a medias produce tableros a medias y eso contamina
 * el dato.
 *
 * ## Lo que este validador NO comprueba
 *
 * - **Que el cluster sea visualmente coherente.** Eso lo ve una persona, en la galería.
 * - **Que el nombre sea el que usaría el paciente.** Criterio clínico.
 * - **Que la imagen cumpla contraste.** Necesita decodificar el archivo; es otra herramienta.
 * - **Que el color no separe dos clusters.** Se vigila por el NOMBRE del cluster (regla 9),
 *   que es una aproximación declarada, no una comprobación real.
 */

import { CLUSTER_MIN } from '../../src/banco/constantes.js';

/** Un id de banco es kebab-case: minúsculas, dígitos y guiones. Nunca acentos. */
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Fecha ISO de día, `2026-09-01`. No se admite hora: la precisión sería falsa. */
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Términos de MATIZ prohibidos en el nombre de un cluster — regla 9 del sistema 1.
 *
 * La regla dice: *«la separación debe sobrevivir en escala de grises. Si dos clusters sólo se
 * distinguen por matiz, un paciente con daltonismo recibe una dificultad que el terapeuta no
 * configuró.»*
 *
 * **La palabra clave es MATIZ.** El primer intento de esta lista incluía `claro` y `oscuro`, y
 * está mal: la luminancia **sí** sobrevive en escala de grises, que es exactamente lo que la
 * regla pide. Van abajo, como advertencia y por otro motivo.
 *
 * **Es una aproximación declarada, no una comprobación.** Un cluster llamado `frutas-caras`
 * puede estar separado por matiz sin que ninguna palabra lo delate. Lo que esta lista impide
 * es el caso obvio y frecuente: `redondo-rojo`.
 *
 * Los términos van en singular: la comparación quita la `s` final, y la lista incluye las
 * formas en femenino. `frutas-verdes` se detecta por `verde`.
 */
const MATICES = [
  'rojo', 'roja', 'verde', 'azul', 'amarillo', 'amarilla', 'naranja', 'morado', 'morada',
  'violeta', 'rosa', 'marron', 'marrón', 'dorado', 'dorada', 'plateado', 'plateada',
  'turquesa', 'ocre', 'granate', 'lila', 'beige',
];

/**
 * Términos de LUMINANCIA. **Advertencia, no error**, y por un motivo distinto.
 *
 * Un cluster separado por claro contra oscuro **no** rompe la regla 9: la luminancia
 * sobrevive en escala de grises y también en el modo de colores forzados del sistema
 * operativo. Un paciente con daltonismo distingue claro de oscuro.
 *
 * Lo que sí trae es un riesgo del que avisar: **el pipeline de contraste puede descartar el
 * cluster claro entero.** El GDD del sistema 1 ya lo señaló con un caso concreto: sobre el
 * fondo del tablero, un limón amarillo pálido da 1,06:1 y falla por un margen enorme. Un
 * cluster cuyo criterio ES ser claro corre ese riesgo por definición.
 *
 * `negro`, `blanco` y `gris` van aquí y no arriba: son luminancia, no matiz.
 */
const LUMINANCIA = [
  'claro', 'clara', 'oscuro', 'oscura', 'palido', 'pálido', 'palida', 'pálida',
  'negro', 'negra', 'blanco', 'blanca', 'gris',
];

/**
 * @param {object} entrada
 * @param {readonly import('../../src/banco/esquema.js').ImageAsset[]} entrada.manifiesto
 * @param {(file: string) => boolean} entrada.existeArchivo
 *   Inyectado. En construcción lo aporta el CLI; en test, un doble.
 * @param {number} [entrada.clusterMin]
 * @param {'advertencia' | 'bloqueo'} [entrada.escalonClusterMin]
 *   **El escalón por nivel del sistema 1.** En el Nivel 0 —MVP, 30 imágenes en total—
 *   `clusterMin` es ADVERTENCIA, porque ningún reparto de 30 imágenes satisface un mínimo de
 *   16 y el primer manifiesto sería inválido por construcción. Del Nivel 1 en adelante
 *   BLOQUEA.
 *
 *   El escalón existe para que la salida fácil no sea bajar `clusterMin`, que es lo único
 *   que hace real la perilla de similitud visual.
 * @returns {import('../../src/banco/esquema.js').Informe}
 */
export function validarManifiesto({
  manifiesto,
  existeArchivo,
  clusterMin = CLUSTER_MIN,
  escalonClusterMin = 'bloqueo',
}) {
  /** @type {import('../../src/banco/esquema.js').Problema[]} */
  const errores = [];
  /** @type {import('../../src/banco/esquema.js').Problema[]} */
  const advertencias = [];

  /** @type {Map<string, number>} */
  const vistos = new Map();
  /** @type {Map<string, number>} */
  const porCluster = new Map();
  /** @type {Map<string, string[]>} */
  const porArchivo = new Map();
  let activos = 0;
  let retirados = 0;

  manifiesto.forEach((a, i) => {
    // `donde` nombra la entrada aunque el `id` sea el campo que falta.
    const donde = typeof a?.id === 'string' && a.id.length > 0 ? a.id : `entrada #${i}`;

    // --- id
    if (typeof a?.id !== 'string' || a.id.length === 0) {
      errores.push({
        codigo: 'idAusente', id: donde, campo: 'id',
        mensaje: `${donde}: falta 'id', o no es una cadena.`,
      });
    } else {
      if (!KEBAB.test(a.id)) {
        errores.push({
          codigo: 'idNoKebab', id: a.id, campo: 'id',
          mensaje: `'${a.id}': el id debe ser kebab-case sin acentos ni mayusculas.`,
        });
      }
      vistos.set(a.id, (vistos.get(a.id) ?? 0) + 1);
    }

    // --- campos obligatorios de cadena
    for (const campo of /** @type {const} */ (['file', 'cluster', 'name'])) {
      const v = a?.[campo];
      if (typeof v !== 'string' || v.trim().length === 0) {
        errores.push({
          codigo: 'campoAusente', id: donde, campo,
          mensaje: `${donde}: falta '${campo}', o esta vacio.`,
        });
      }
    }

    // --- categories
    if (!Array.isArray(a?.categories) || a.categories.length === 0) {
      errores.push({
        codigo: 'categoriesAusente', id: donde, campo: 'categories',
        mensaje: `${donde}: 'categories' debe ser un array con al menos una categoria.`,
      });
    } else if (a.categories.some((c) => typeof c !== 'string' || c.trim().length === 0)) {
      errores.push({
        codigo: 'categoriaVacia', id: donde, campo: 'categories',
        mensaje: `${donde}: alguna categoria esta vacia o no es una cadena.`,
      });
    } else if (new Set(a.categories).size !== a.categories.length) {
      // No es un error de forma, y sí de dato: una categoría repetida hincha el pool
      // semántico de ese asset sin que nadie lo haya decidido.
      errores.push({
        codigo: 'categoriaRepetida', id: donde, campo: 'categories',
        mensaje: `${donde}: hay una categoria repetida.`,
      });
    }

    // --- status y retiredAt: la condicional del esquema, en las DOS direcciones
    if (a?.status !== 'active' && a?.status !== 'retired') {
      errores.push({
        codigo: 'statusInvalido', id: donde, campo: 'status',
        mensaje: `${donde}: 'status' debe ser 'active' o 'retired'.`,
      });
    } else if (a.status === 'retired') {
      retirados += 1;
      if (typeof a.retiredAt !== 'string' || !FECHA_ISO.test(a.retiredAt)) {
        errores.push({
          codigo: 'retiredAtAusente', id: donde, campo: 'retiredAt',
          mensaje: `${donde}: retirado sin 'retiredAt' valido (AAAA-MM-DD). Sin la fecha, `
            + 'el terapeuta no puede distinguir "el paciente empeoro" de "alguien retiro '
            + 'una imagen".',
        });
      }
    } else {
      activos += 1;
      if (a.retiredAt !== undefined) {
        // La otra dirección, que un `if (retired && !retiredAt)` deja pasar.
        errores.push({
          codigo: 'retiredAtSobrante', id: donde, campo: 'retiredAt',
          mensaje: `${donde}: esta activo y lleva 'retiredAt'. Uno de los dos esta mal.`,
        });
      }
      if (typeof a.cluster === 'string' && a.cluster.length > 0) {
        porCluster.set(a.cluster, (porCluster.get(a.cluster) ?? 0) + 1);
      }
    }

    // --- el archivo existe
    if (typeof a?.file === 'string' && a.file.length > 0) {
      if (!existeArchivo(a.file)) {
        errores.push({
          codigo: 'archivoAusente', id: donde, campo: 'file',
          mensaje: `${donde}: el archivo '${a.file}' no existe.`,
        });
      }
      porArchivo.set(a.file, [...(porArchivo.get(a.file) ?? []), donde]);
    }

    // --- regla 9: el nombre del cluster no lleva color
    if (typeof a?.cluster === 'string') {
      // Se quita la `s` final antes de comparar: la lista tiene `verde` y un cluster puede
      // llamarse `frutas-verdes`. Sin esto, el plural se escapaba — lo cazó el test.
      const partes = a.cluster.toLowerCase().split('-')
        .map((pt) => (pt.endsWith('s') ? pt.slice(0, -1) : pt));
      const matiz = partes.find((pt) => MATICES.includes(pt));
      if (matiz !== undefined) {
        errores.push({
          codigo: 'clusterConMatiz', id: donde, campo: 'cluster', cluster: a.cluster,
          mensaje: `${donde}: el cluster '${a.cluster}' lleva el termino de matiz `
            + `'${matiz}'. La separacion entre clusters debe sobrevivir en escala de grises: `
            + 'si dos clusters solo se distinguen por matiz, un paciente con daltonismo '
            + 'recibe una dificultad que el terapeuta no configuro.',
        });
      }
      const luz = partes.find((pt) => LUMINANCIA.includes(pt));
      if (luz !== undefined) {
        advertencias.push({
          codigo: 'clusterConLuminancia', id: donde, campo: 'cluster', cluster: a.cluster,
          mensaje: `${donde}: el cluster '${a.cluster}' lleva el termino de luminancia `
            + `'${luz}'. NO rompe la regla 9 —la luminancia sobrevive en escala de grises— `
            + 'pero el pipeline de contraste puede descartar el cluster entero: un limon '
            + 'amarillo palido da 1,06:1 sobre el fondo del tablero.',
        });
      }
    }
  });

  // --- ids duplicados
  for (const [id, n] of vistos) {
    if (n > 1) {
      errores.push({
        codigo: 'idDuplicado', id, campo: 'id',
        mensaje: `'${id}': aparece ${n} veces. Un id es la clave con la que se guarda que `
          + 'estimulo vio el paciente; duplicarlo hace ambigua toda la medicion.',
      });
    }
  }

  // --- dos entradas apuntando al mismo archivo
  for (const [file, ids] of porArchivo) {
    if (ids.length > 1) {
      // No es un error de forma: es dos ids para un estímulo, o sea el mismo estímulo
      // registrado con dos claves. La medición asume que un id es un estímulo.
      errores.push({
        codigo: 'archivoCompartido', campo: 'file',
        mensaje: `'${file}': lo usan ${ids.length} entradas (${ids.join(', ')}). Dos ids `
          + 'para el mismo estimulo hacen ambigua la medicion.',
      });
    }
  }

  // --- clusterMin, con su escalón por nivel
  for (const [cluster, n] of porCluster) {
    if (n < clusterMin) {
      const p = {
        codigo: 'clusterPorDebajoDelMinimo', cluster,
        mensaje: `cluster '${cluster}': ${n} elementos activos, minimo ${clusterMin}. `
          + 'Con menos elementos, los niveles altos de dificultad dejan de entrenar '
          + 'discriminacion visual y pasan a ser repeticion bruta de pocos iconos.',
      };
      if (escalonClusterMin === 'bloqueo') errores.push(p);
      else advertencias.push(p);
    }
  }

  // --- un manifiesto vacío no es válido, y no por su forma
  if (manifiesto.length === 0) {
    advertencias.push({
      codigo: 'manifiestoVacio',
      mensaje: 'El manifiesto esta vacio. Es valido por forma, y no sirve para jugar.',
    });
  }

  return { errores, advertencias, activos, retirados, porCluster };
}
