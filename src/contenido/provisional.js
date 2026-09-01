/**
 * Contenido PROVISIONAL que no son imágenes: palabras, símbolos y precios.
 *
 * **El manifiesto del banco (sistema 1) asume contenido de imagen.** Los instrumentos de
 * palabra, símbolo y número necesitan una segunda fuente de contenido, y eso es una
 * decisión de arquitectura que ningún GDD había registrado.
 *
 * Buena noticia de coste: este contenido **no cuesta 416 SVG**. Se escribe.
 *
 * Igual que el banco de emoji, esto es un andamio: pequeño, curado a mano y en español de
 * España. Un terapeuta tendrá que revisarlo antes de ponerlo delante de un paciente.
 */

/**
 * Palabras con su hueco, para "rellenar palabras". El hueco es una SÍLABA, no una letra:
 * una sílaba es una unidad de lectura y una letra suelta es un ejercicio de deletreo, que
 * es otra tarea.
 *
 * @type {readonly { id: string, palabra: string, hueco: string, opciones: string[] }[]}
 */
export const PALABRAS_CON_HUECO = Object.freeze([
  { id: 'ventana', palabra: 'ven_na', hueco: 'ta', opciones: ['ta', 'te', 'to', 'da'] },
  { id: 'cuchara', palabra: 'cu_ara', hueco: 'ch', opciones: ['ch', 'll', 'rr', 'qu'] },
  { id: 'zapato', palabra: 'za_to', hueco: 'pa', opciones: ['pa', 'ba', 'po', 'pe'] },
  { id: 'camisa', palabra: 'ca_sa', hueco: 'mi', opciones: ['mi', 'me', 'ni', 'mo'] },
  { id: 'botella', palabra: 'bo_lla', hueco: 'te', opciones: ['te', 'ta', 'de', 'ti'] },
  { id: 'manzana', palabra: 'man_na', hueco: 'za', opciones: ['za', 'sa', 'ce', 'zo'] },
  // Ojo con la tilde: un distractor que solo se diferencia en el acento —`rio` frente a
  // `rió`— da la MISMA palabra mal acentuada, no una no-palabra. Eso mide ortografia, que
  // es otra tarea. Lo caza `test_ningun_distractor_se_diferencia_SOLO_en_la_tilde`.
  { id: 'periodico', palabra: 'pe_dico', hueco: 'rió', opciones: ['rió', 'ria', 'ro', 'reo'] },
  { id: 'telefono', palabra: 'te_fono', hueco: 'lé', opciones: ['lé', 'la', 'li', 'ne'] },
  { id: 'bicicleta', palabra: 'bici_ta', hueco: 'cle', opciones: ['cle', 'cla', 'que', 'gle'] },
  { id: 'escalera', palabra: 'esca_ra', hueco: 'le', opciones: ['le', 'la', 'li', 'ne'] },
  { id: 'cepillo', palabra: 'ce_llo', hueco: 'pi', opciones: ['pi', 'pe', 'bi', 'po'] },
  { id: 'armario', palabra: 'ar_rio', hueco: 'ma', opciones: ['ma', 'me', 'na', 'mo'] },
]);

/**
 * Símbolos y su palabra, para "transcribir símbolos".
 *
 * Son símbolos de la vida diaria, no abstractos: el objetivo clínico es la lectura de
 * señalización real, que es una habilidad funcional.
 *
 * @type {readonly { id: string, simbolo: string, palabra: string }[]}
 */
export const SIMBOLOS = Object.freeze([
  { id: 'prohibido-fumar', simbolo: '🚭', palabra: 'no fumar' },
  { id: 'salida', simbolo: '🚪', palabra: 'salida' },
  { id: 'telefono', simbolo: '📞', palabra: 'teléfono' },
  { id: 'aseo', simbolo: '🚻', palabra: 'aseo' },
  { id: 'ascensor', simbolo: '🛗', palabra: 'ascensor' },
  { id: 'escalera', simbolo: '🪜', palabra: 'escalera' },
  { id: 'aparcamiento', simbolo: '🅿️', palabra: 'aparcamiento' },
  { id: 'farmacia', simbolo: '💊', palabra: 'farmacia' },
  { id: 'autobus', simbolo: '🚌', palabra: 'autobús' },
  { id: 'hospital', simbolo: '🏥', palabra: 'hospital' },
  { id: 'correo', simbolo: '📮', palabra: 'correos' },
  { id: 'agua', simbolo: '🚰', palabra: 'agua potable' },
]);

/**
 * Objetos con precio, para "precio justo" y "juego de comprar".
 *
 * Precios de supermercado español, redondeados. **Envejecen**, y por eso el GDD del
 * sistema 23 los descartó del primer hito: un precio de 2019 confunde a un paciente que
 * hace la compra cada semana. Se declaran con su fecha para que se pueda ver cuándo caducan.
 *
 * @type {readonly { id: string, nombre: string, glifo: string, euros: number }[]}
 */
export const PRECIOS_2026 = Object.freeze([
  { id: 'barra-pan', nombre: 'barra de pan', glifo: '🥖', euros: 1.1 },
  { id: 'leche', nombre: 'litro de leche', glifo: '🥛', euros: 1.2 },
  { id: 'docena-huevos', nombre: 'docena de huevos', glifo: '🥚', euros: 2.9 },
  { id: 'kilo-patatas', nombre: 'kilo de patatas', glifo: '🥔', euros: 1.5 },
  { id: 'cafe', nombre: 'café en el bar', glifo: '☕', euros: 1.6 },
  { id: 'periodico', nombre: 'periódico', glifo: '📰', euros: 2.0 },
  { id: 'billete-bus', nombre: 'billete de autobús', glifo: '🚌', euros: 1.5 },
  { id: 'kilo-naranjas', nombre: 'kilo de naranjas', glifo: '🍊', euros: 2.2 },
  { id: 'pollo', nombre: 'pollo entero', glifo: '🍗', euros: 7.5 },
  { id: 'aceite', nombre: 'litro de aceite', glifo: '🫒', euros: 8.5 },
  { id: 'pasta', nombre: 'paquete de pasta', glifo: '🍝', euros: 1.3 },
  { id: 'queso', nombre: 'cuña de queso', glifo: '🧀', euros: 4.5 },
]);

/** La fecha de los precios. Se muestra al terapeuta: los precios caducan. */
export const PRECIOS_FECHA = '2026';

/**
 * Frases para "ordenar palabras". Son frases de la vida diaria, en orden correcto.
 *
 * Longitud creciente: la cantidad de palabras es la perilla natural de dificultad de este
 * instrumento, y encaja con `C` del sistema 4 sin inventar una perilla nueva.
 *
 * @type {readonly { id: string, palabras: string[] }[]}
 */
export const FRASES = Object.freeze([
  { id: 'f3-1', palabras: ['abre', 'la', 'puerta'] },
  { id: 'f3-2', palabras: ['pon', 'la', 'mesa'] },
  { id: 'f3-3', palabras: ['bebe', 'el', 'agua'] },
  { id: 'f4-1', palabras: ['el', 'perro', 'come', 'pan'] },
  { id: 'f4-2', palabras: ['guarda', 'la', 'ropa', 'limpia'] },
  { id: 'f4-3', palabras: ['hoy', 'hace', 'mucho', 'calor'] },
  { id: 'f5-1', palabras: ['voy', 'a', 'comprar', 'el', 'pan'] },
  { id: 'f5-2', palabras: ['deja', 'las', 'llaves', 'en', 'casa'] },
  { id: 'f5-3', palabras: ['el', 'autobús', 'llega', 'a', 'tiempo'] },
  { id: 'f6-1', palabras: ['por', 'la', 'mañana', 'tomo', 'un', 'café'] },
  { id: 'f6-2', palabras: ['mi', 'hija', 'viene', 'a', 'verme', 'hoy'] },
  { id: 'f6-3', palabras: ['tengo', 'que', 'ir', 'al', 'médico', 'mañana'] },
]);

/**
 * @typedef {'sumaHasta10' | 'sumaRestaHasta20' | 'multiplicar'} TipoOperacion
 */

/**
 * Los tres tipos de operación, en orden de exigencia aritmética.
 *
 * **Es un SELECTOR DE CONTENIDO, no una escala de dificultad**, y la distinción no es de
 * nomenclatura. La barrera AC-13 del sistema 14 disparó sobre la primera versión de esta
 * función, que tomaba un parámetro `nivel`, y tenía razón:
 *
 * **la dificultad aritmética no es motora ni perceptiva, así que no cabe en los dos ejes
 * del sistema 4.** Un tercer eje —carga cognitiva— es una decisión de diseño que ningún GDD
 * ha tomado, y meterla de tapadillo como un escalar llamado `nivel` habría colapsado
 * exactamente lo que el pilar 3 protege.
 *
 * Es el mismo hallazgo que el sistema 15 anticipó para la memoria de trabajo (capacidad A9),
 * llegando por otra puerta: *"si aparece, es un eje nuevo, no una perilla dentro de los dos
 * existentes"*.
 *
 * Mientras ese eje no exista, esto es un enum de qué contenido generar, y el terapeuta
 * elige el tipo igual que elige el instrumento.
 *
 * @type {readonly TipoOperacion[]}
 */
export const TIPOS_OPERACION = Object.freeze([
  'sumaHasta10', 'sumaRestaHasta20', 'multiplicar',
]);

/** @type {Record<TipoOperacion, string>} */
export const ETIQUETA_OPERACION = Object.freeze({
  sumaHasta10: 'sumar hasta 10',
  sumaRestaHasta20: 'sumar y restar hasta 20',
  multiplicar: 'multiplicar',
});

/**
 * Genera una operación del tipo pedido.
 *
 * @param {TipoOperacion} tipo
 * @param {() => number} fuenteAleatoria
 * @returns {{ enunciado: string, resultado: number }}
 */
export function operacion(tipo, fuenteAleatoria) {
  const ent = (/** @type {number} */ max) => 1 + Math.floor(fuenteAleatoria() * max);
  if (tipo === 'sumaHasta10') {
    const a = ent(9);
    const b = ent(10 - a);
    return { enunciado: `${a} + ${b}`, resultado: a + b };
  }
  if (tipo === 'sumaRestaHasta20') {
    // **El techo de 20 es una promesa de la ETIQUETA, no un detalle.** El terapeuta elige
    // «sumar y restar hasta 20» y eso significa que ningun numero de la operacion pasa de 20.
    //
    // La version anterior sorteaba `a` en [1, 19] y `b` en [1, a - 1], asi que la suma
    // llegaba a **37**: «19 + 18». El test lo dejaba pasar porque comprobaba `resultado >= 0`
    // y nunca el techo — comprobaba lo que no fallaba.
    //
    // Las dos ramas se acotan por separado, porque el limite no es el mismo:
    //   suma:  a ∈ [1, 19], b ∈ [1, 20 − a]   ->  resultado ∈ [2, 20]
    //   resta: a ∈ [2, 20], b ∈ [1, a − 1]    ->  resultado ∈ [1, 19]
    if (fuenteAleatoria() < 0.5) {
      const a = ent(19);
      const b = ent(20 - a);
      return { enunciado: `${a} + ${b}`, resultado: a + b };
    }
    const a = 1 + ent(19);
    const b = ent(a - 1);
    return { enunciado: `${a} − ${b}`, resultado: a - b };
  }
  const a = ent(9);
  const b = ent(9);
  return { enunciado: `${a} × ${b}`, resultado: a * b };
}
