/**
 * Carta de Pizza José Villegas.
 *
 * Los textos y precios son la carta real del restaurante y se transcriben
 * LITERALMENTE, erratas incluidas ("SALSA BBO", "QUESO CUARDO", "QUEDAR").
 * No reescribir sin confirmarlo antes con el cliente.
 *
 * Alérgenos y etiquetas (vegetariano, picante) se retiraron a propósito:
 * deducirlos de los ingredientes producía afirmaciones falsas. Hace falta la
 * tabla oficial por plato antes de volver a mostrarlos.
 */
import pizza from '../assets/pizza.png';
import bocadillo from '../assets/bocadillo.png';
import rosca from '../assets/rosca.png';
import panini from '../assets/panini.png';
import calzone from '../assets/calzone.png';
// Relleno de la franja: la zona con textura de cada foto, recortada por
// scripts/make-band-fills.mjs. Ver el README.
import pizzaFill from '../assets/fills/pizza.jpg';
import bocadilloFill from '../assets/fills/bocadillo.jpg';
import roscaFill from '../assets/fills/rosca.jpg';
import paniniFill from '../assets/fills/panini.jpg';
import calzoneFill from '../assets/fills/calzone.jpg';

export interface Dish {
  name: string;
  ingredients: string;
  /** Cadena tal cual se imprime ("8,50€"). Vacía cuando el precio es "a consultar". */
  price: string;
}

export interface Group {
  /** Cabecera de subgrupo. Ausente cuando la categoría no se subdivide. */
  title?: string;
  /** Segundo precio que aplica a todos los platos del grupo ("Individual 6€"). */
  alt?: string;
  /** Nota al pie del subgrupo. */
  note?: string;
  items: Dish[];
}

export interface Category {
  /** Identificador estable para anclas y data-attributes. */
  slug: string;
  name: string;
  /** Tono oklch del acento de la categoría. */
  hue: number;
  photo: ImageMetadata;
  /** Foto que rellena la cuña de la franja, a baja opacidad. */
  fill: ImageMetadata;
  /** Tamaño nominal en px de la foto cuando la franja está activa. */
  w: number;
  h: number;
  side: 'left' | 'right';
  /** Filas etiqueta/precio sobre la lista de platos. */
  intro?: Array<[label: string, price: string]>;
  footnote?: string;
  groups: Group[];
}

const dishes = (rows: string[][]): Dish[] =>
  rows.map(([name, ingredients, price]) => ({ name, ingredients, price }));

export const CATEGORIES: Category[] = [
  {
    slug: 'pizzas',
    name: 'PIZZAS',
    hue: 38,
    photo: pizza,
    fill: pizzaFill,
    w: 196,
    h: 218,
    side: 'left',
    intro: [
      ['Base pizza individual', '1,20€/ud.'],
      ['Pack pizzas familiares', '7,00€/5 uds.'],
    ],
    footnote: '0,50€ por ingrediente extra',
    groups: [
      {
        title: 'Pizzas normales',
        alt: 'Individual 6€',
        note: '* Individuales 6€',
        items: dishes([
          ['ATUN', 'TOMATE, MOZZARELLA, ATÚN', '8€'],
          ['YORK', 'TOMATE, MOZZARELLA, JAMÓN YORK', '8€'],
          ['PEPPERONI', 'TOMATE, MOZZARELLA, PEPPERONI', '8€'],
          ['VEGETAL', 'TOMATE, MOZZARELLA, CEBOLLA, TOMATE NATURAL Y CALABACÍN', '8€'],
          ['BACON', 'Tomate o nata, mozzarella, bacon', '8€'],
        ]),
      },
      {
        title: 'Pizzas especiales',
        alt: 'Individual 6€',
        note: '* Individuales 6€',
        items: dishes([
          ['HAWAIANA', 'TOMATE, MOZZARELLA, BACON, PIÑA Y ORÉGANO', '8,50€'],
          ['NEW YORK', 'TOMATE, MOZZARELLA, YORK, BACON', '8,50€'],
          ['FUSIÓN', 'TOMATE, MOZZARELLA, BACON, ATÚN, ORÉGANO', '8,50€'],
          ['MEDITERRANEA', 'TOMATE, MOZZARELLA, ATÚN, YORK Y ORÉGANO', '8,50€'],
          ['FRANKFURT', 'TOMATE, MOZZARELLA, BACON, SALCHICHAS, ORÉGANO', '8,50€'],
          ['PHILADELPHIA', 'PHILADELPHIA, MOZARELLA, BACON, POLLO, ORÉGANO', '8,50€'],
          ['CARBONARA', 'NATA, MOZZARELLA, BACON, CEBOLLA, POLLO, ORÉGANO', '8,50€'],
          ['BIANCA', 'NATA, MOZARELLA, BACON, CHAMPIÑÓN, ORÉGANO', '8,50€'],
          ['GAUCHA', 'TOMATE, MOZZARELLA, POLLO, BACON, SALSA GAUCHA, OREGANO', '8,50€'],
          ['BBQ', 'TOMATE, MOZZARELLA, BACON, CARNE PICADA O POLLO, SALSA BBO, OREGANO', '8,50€'],
        ]),
      },
      {
        title: 'Pizzas gourmet',
        items: dishes([
          ['DELICIOSA', 'NATA, MOZZARELLA, BACON, POLLO, QUESO AZUL y ORÉGANO', '9€'],
          ['CREMOSITA', 'PHILADELPHIA, MOZZARELLA, BACON, POLLO, CEBOLLA CARAMELIZADA', '9€'],
          ['5 QUESOS', 'TOMATE, MOZZARELLA, QUESO RULO DE CABRA, QUEDAR, AZUL Y QUESO CURADO', '9€'],
          ['KEBAB', 'KÉTCHUP, MOZZARELLA, CARNE KEBAB POLLO, SALSA KEBAB', '9€'],
          ['Pizza Caramelizada', 'tomate, mozzarella, bacon, queso de cabra y cebolla caramelizada', '10€'],
          ['Pizza Pulled pork', 'tomate, mozzarella, pulled pork, queso de cabra y salsa bbq', '11,50€'],
          ['Pizza Nórdica', 'queso Filadelfia, mozzarella, salmón, gambas y orégano', '10€'],
          ['CHAPARRA', 'TOMATE, MOZZARELLA, ATÚN, BACON, JAMÓN SERRANO, YORK', '10€'],
          ['PULLED PORK', 'TOMATE, BACON, PULLED PORK, QUESO DE CABRA, SALSA BBQ', '11,50€'],
          ['SUPREMA', 'TOMATE, MOZZARELLA, BACON, CARNE PICADA, POLLO, QUESO CUARDO, CEBOLLA MORADA, SALSA BBQ, OREGANO', '11,50€'],
          ['BACON BURGER', 'TOMATE, MOZZARELLA, BACON, TOMATE NATURAL, MINI BURGER, CEBOLLA MORADA, QUESO CHEDDAR, SALSA BURGER, OREGANO', '11,50€'],
          ['Pizza mexicana', 'Salsa mexicana, mozzarella, queso cheddar, salsa picante o pollo, pimientos', '11,50€'],
          ['Pizza marinera', 'tomate, mozzarella, anchoas, atún, palitos de mar, mejillones y gambas', '11,50€'],
        ]),
      },
    ],
  },
  {
    slug: 'bocadillos-xxl',
    name: 'BOCADILLOS XXL',
    hue: 145,
    photo: bocadillo,
    fill: bocadilloFill,
    w: 268,
    h: 150,
    side: 'right',
    groups: [
      {
        items: dishes([
          ['Lomo adobado o magreta completa', 'tomate natural, lechuga, lomo adobado o magreta y queso', '5,50€'],
          ['Lomo', 'tomate natural, lechuga, bacon, lomo y queso', '6,50€'],
          ['Burger', 'tomate natural, salsa burger, bacon, cebolla morada, mini burger y queso cheddar', '7,50€'],
          ['Big burger', 'Tomate natural, lechuga, carne de pollo, jamón York, tortilla francesa y queso', '8,00€'],
          ['POLLO', 'TOMATE NATURAL, LECHUGA, POLLO, QUESO', '6€'],
          ['CAMPERO DE POLLO', 'TOMATE NATURAL, POLLO, TORTILLA FRANCESA, QUESO', '7€'],
          ['CAMPERO', 'TOMATE NATURAL, JAMÓN YORK, QUESO, LECHUGA', '5€'],
          ['SERRANITO', 'TOMATE NATURAL, POLLO O LOMO, PIMIENTO VERDE, JAMÓN SERRANO, QUESO', '7,50€'],
          ['GOURMET', 'QUESO PHILADELPHIA, POLLO, BACON, CEBOLLA CARAMELIZADA, QUESO', '7,50€'],
        ]),
      },
    ],
  },
  {
    slug: 'roscas',
    name: 'ROSCAS',
    hue: 78,
    photo: rosca,
    fill: roscaFill,
    w: 194,
    h: 194,
    side: 'left',
    groups: [
      {
        items: dishes([
          ['LOMO AL CURRY', 'TOMATE NATURAL, LOMO, CEBOLLA FRITA, SALSA CURRY, QUESO', '8€'],
          ['GAUCHO', 'TOMATE NATURAL, SALSA GAUCHA, POLLO, QUESO', '8€'],
          ['SERRANITO', 'TOMATE NATURAL, POLLO O LOMO, PIMIENTO VERDE, JAMÓN SERRANO, QUESO', '10€'],
          ['BRUTA', 'TOMATE NATURAL, POLLO, TORTILLA FRANCESA, JAMÓN SERRANO, QUESO', '12€'],
          ['LOMITO', 'TOMATE NATURAL, LOMO, TORTILLA PATATAS, PIMIENTOS VERDES, QUESO', '12€'],
          ['BURGER', 'TOMATE NATURAL, SALSA BURGER, BACON, MINI BURGER, QUESO CHEDDAR', '10€'],
        ]),
      },
    ],
  },
  {
    slug: 'paninis-xxl',
    name: 'PANINIS XXL',
    hue: 300,
    photo: panini,
    fill: paniniFill,
    w: 248,
    h: 200,
    side: 'right',
    groups: [
      {
        items: dishes([
          ['ATÚN', 'TOMATE, MOZZARELLA, ATÚN', '5€'],
          ['YORK', 'TOMATE, MOZZARELLA, JAMÓN YORK', '5€'],
          ['ANDALUZA', 'TOMATE, MOZZARELLA, YORK, ATÚN, OLIVAS', '5€'],
          ['KEBAB', 'KÉTCHUP, SALSA KEBAB, CARNE KEBAB, MOZZARELLA', '6€'],
          ['BBQ', 'TOMATE, MOZZARELLA, CARNE PICADA, SALCHICHAS, SALSA BBQ', '6€'],
        ]),
      },
    ],
  },
  {
    slug: 'calzones',
    name: 'CALZONES',
    hue: 195,
    photo: calzone,
    fill: calzoneFill,
    w: 218,
    h: 176,
    side: 'left',
    footnote: 'Calzone XXL: +1,50€ por unidad',
    groups: [
      {
        items: dishes([
          ['Carbonara', 'nata, mozzarella, bacon, pollo y huevo', '6,50€'],
          ['Pollo cheddar', 'tomate, mozzarella, bacon, pollo y cheddar', '6,50€'],
          ['Mexicana', 'tomate, mozzarella, carne picada, pimientos variados y salsa', '6,50€'],
          ['Kebab', 'Ketchup, mozzarella, carne kebab, salsa kebab y orégano', '6,50€'],
          ['Burger', 'tomate, mozzarella, salsa, bacon, cebolla morada, mini burger, queso cheddar', '7,50€'],
          ['Al gusto', 'Tomate, mozzarella + 3 ingredientes', ''],
        ]),
      },
    ],
  },
];

/** Nº de platos de una categoría, para el CTA "Ver los N platos". */
export const dishCount = (c: Category): number =>
  c.groups.reduce((n, g) => n + g.items.length, 0);

/**
 * Acento de la categoría. Sobre el fondo oscuro hace falta subir la luminosidad
 * (0,56 → 0,72 en oklch): así los cinco tonos quedan entre 7,1:1 y 8,4:1 de
 * contraste, frente a los 4,2–4,8:1 que daban sobre el papel claro.
 */
export const accent = (hue: number): string => `oklch(0.72 0.15 ${hue})`;

/** Fondo de la franja activa: un tinte apenas por encima del fondo. */
export const tint = (hue: number): string => `oklch(0.245 0.03 ${hue})`;
