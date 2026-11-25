// Transcripción de docs/politicas_y_condiciones_de_vitrina_vintage.md §1–5 (reclamos: 5 días).
// Cada bloque: { title, items[] } o { title, text }.
import { PICKUP_POINTS } from '../../shared/checkoutRules.js'

export const POLICY_TABS = [
  {
    id: 'lima',
    label: 'Lima gratis',
    intro: 'Entregas sin costo en puntos de encuentro de Lima. Aquí sí puedes pagar en efectivo al recibir.',
    blocks: [
      { title: 'Puntos de encuentro gratuitos', items: [...PICKUP_POINTS, 'Otras estaciones del Metropolitano, previa consulta.'] },
      {
        title: 'Motorizado gestionado por la tienda (InDrive)',
        text: 'Elegimos conductores verificados. Te cotizamos el envío antes; el envío se paga al recibir y el producto se paga antes del despacho.',
      },
      {
        title: 'Motorizado gestionado por ti',
        text: 'Si pides tu propio motorizado al punto que te indiquemos, asumes toda la responsabilidad del seguimiento, el pago al motorizado y la recepción.',
      },
      {
        title: 'Pagos en Perú',
        items: [
          'Efectivo: solo en entregas gratuitas contraentrega en Lima.',
          'Transferencia bancaria: BCP, BBVA, Interbank o Scotiabank.',
          'Billeteras digitales: Yape y Plin.',
          'Tarjeta de crédito con link seguro de Mercado Pago: se agrega una comisión aproximada del 7 % que cobra la pasarela.',
        ],
      },
    ],
  },
  {
    id: 'envios-peru',
    label: 'Envíos Perú',
    intro: 'Solo trabajamos con Olva Courier y Shalom. El costo de envío lo asume el comprador y el producto se paga antes del envío.',
    blocks: [
      {
        title: 'Olva Courier',
        text: 'Llega a agencia o a domicilio. El producto y el costo de envío (cotizado y aprobado por ti) se depositan antes del envío.',
      },
      {
        title: 'Shalom',
        text: 'Solo llega a la agencia del distrito que elijas. El producto se paga antes de enviarse; el envío se paga contraentrega al recoger en destino.',
      },
      {
        title: 'Si algo pasa en el camino',
        text: 'Ante accidentes, robos, pérdidas o maltrato durante el transporte, la tienda no es responsable directa, pero interviene y gestiona todo lo necesario para que el courier te indemnice o atienda tu reclamo.',
      },
      {
        title: 'Tiempos de entrega',
        text: 'Dependen de cada operador (tráfico, demoras logísticas, programación interna). No podemos acelerar sus procesos, pero te damos seguimiento hasta la entrega.',
      },
    ],
  },
  {
    id: 'internacional',
    label: 'Internacional DHL',
    intro: 'Enviamos al extranjero exclusivamente por DHL. El producto y el envío cotizado se pagan antes del despacho.',
    blocks: [
      {
        title: 'Destinos con envíos comprobados',
        text: 'México, Costa Rica, Chile, Bolivia, España, Argentina, Brasil, Italia, El Salvador, Ecuador, Francia y Estados Unidos.',
      },
      {
        title: 'Tarifa referencial',
        text: 'Aproximadamente $55–80 USD por un paquete de 3 a 4 kg. Varía según peso, volumen, ciudad y código postal.',
      },
      {
        title: 'Para ahorrar en el flete',
        text: 'Agrupa varias colecciones hasta aprovechar el peso cotizado, incluso en compras grupales entre coleccionistas. También enviamos un solo producto.',
      },
      {
        title: 'Pagos desde el extranjero',
        items: [
          'Western Union o MoneyGram: asumes en tu país la comisión por girar el dinero a Perú.',
          'PayPal: comisión fija de $10 USD por retiro (obligatoria) y una comisión aproximada del 8 % por depósito, que aplica normalmente en toda América y no en Europa o Asia (se valida al momento de comprar).',
          'Compara qué te conviene más según las comisiones de tu país.',
        ],
      },
    ],
  },
  {
    id: 'preventas',
    label: 'Preventas',
    intro: 'Aplica a Vitrina Vintage y a REX ¡Colecciónalos!. Al comprar en preventa declaras haber leído y aceptado estas condiciones.',
    blocks: [
      { title: 'Separación', text: 'Cualquier producto en preventa se separa con el pago total.' },
      {
        title: 'Pagos en partes (excepcional)',
        text: 'Si excepcionalmente aceptamos pago fraccionado, completar el pago antes del cierre de la preventa es tu responsabilidad: no enviamos recordatorios. Si no lo completas a tiempo, pierdes el precio de preventa, pagas el precio regular vigente y los montos abonados no se reembolsan.',
      },
      {
        title: 'Preventas sin fecha de cierre',
        text: 'Podemos cerrarlas en cualquier momento sin aviso. Si al cierre no terminaste de pagar, pasas a precio regular y los abonos no se devuelven.',
      },
      {
        title: 'Cancelación o cambio por fuerza mayor',
        text: 'Si la preventa se modifica o cancela por motivos ajenos a la tienda (fabricante, distribuidor, importador, producción, disponibilidad o logística), eliges entre el reembolso total de lo pagado o el cambio por otro producto.',
      },
      {
        title: 'Si no cumplimos',
        text: 'Si el producto no coincide con lo ofrecido o no se entrega en la fecha o rango indicado, puedes pedir el reembolso total o el cambio por otro producto.',
      },
    ],
  },
  {
    id: 'garantia',
    label: 'Garantía y reclamos',
    intro: 'Cada colección se revisa antes de la entrega. La publicación detalla el precio, si está completa o incompleta y qué incluye exactamente.',
    blocks: [
      {
        title: 'Plazo de reclamos: 5 días',
        text: 'Solo se aceptan reclamos dentro de los 5 días calendario posteriores a la entrega o envío de una colección completa, semicolección o lote (álbum con set a pegar, set de cards, taps, etc.), según las condiciones de la publicación original.',
      },
      {
        title: 'Originales y réplicas',
        text: 'La mayoría de los productos son originales. Si un artículo es réplica, reimpresión o no oficial, se aclara en la publicación y lleva la etiqueta Réplica.',
      },
      {
        title: 'Paquetones y sobres sellados',
        text: 'Jamás se abren, manipulan ni "paquetean". No respondemos por el azar: cantidad de especiales, repetidas, figuras pegadas de fábrica o si completas la colección con 1 a 5 paquetones.',
      },
      {
        title: 'Cambios y cancelaciones',
        items: [
          'Si desistes de una compra sin adelanto o quieres un cambio, avísanos el mismo día.',
          'Con depósito o adelanto no se acepta cancelación: el producto se retira de la venta para otros clientes y el adelanto no se devuelve.',
        ],
      },
      {
        title: 'Calificaciones',
        text: 'Puedes ver calificaciones recientes de compradores de Lima, provincias y el extranjero en la sección "Calificación" de nuestro Facebook, además de Instagram y TikTok.',
      },
    ],
  },
]
