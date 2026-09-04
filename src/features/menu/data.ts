export type MenuCategoryId =
  | "platos-fuertes"
  | "sopas-caldos"
  | "bebidas"
  | "postres";

export interface MenuCategory {
  id: MenuCategoryId;
  label: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: string;
  description?: string;
  category: MenuCategoryId;
  featured?: boolean;
  image?: string;
}

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: "platos-fuertes", label: "Platos fuertes" },
  { id: "sopas-caldos", label: "Sopas / Caldos" },
  { id: "bebidas", label: "Bebidas" },
  { id: "postres", label: "Postres" },
];

export const MENU_ITEMS: MenuItem[] = [
  // Platos fuertes
  {
    id: "cuy-entero",
    name: "Cuy entero asado",
    price: "$18.00",
    description:
      "Papas cocinadas, lechuga, tomate, salsa de maní y aguacate.",
    category: "platos-fuertes",
    featured: true,
    image: "/platos/cuy-entero.jpg",
  },
  {
    id: "medio-cuy",
    name: "1/2 Cuy asado",
    price: "$9.50",
    description:
      "Papas cocinadas, lechuga, tomate, salsa de maní y aguacate.",
    category: "platos-fuertes",
    featured: true,
  },
  {
    id: "cuarto-cuy",
    name: "1/4 Cuy asado",
    price: "$6.00",
    description:
      "Papas cocinadas, lechuga, tomate, salsa de maní y aguacate.",
    category: "platos-fuertes",
  },
  {
    id: "parrillada",
    name: "Parrillada",
    price: "$7.50",
    description:
      "Pollo, chuleta, longaniza, botón rojo, botón negro, choclo, papas salteadas y ensalada.",
    category: "platos-fuertes",
    image: "/platos/parillada.jpg",
  },
  {
    id: "borrego",
    name: "Borrego",
    price: "$7.50",
    description:
      "Borrego asado, habas, choclo, papas salteadas, queso y ensalada.",
    category: "platos-fuertes",
  },
  {
    id: "costillas-bbq",
    name: "Costillas BBQ",
    price: "$6.00",
    description: "Costilla asada, papas fritas, choclo, ensalada y salsa BBQ.",
    category: "platos-fuertes",
    image: "/platos/costilla.jpg",
  },
  {
    id: "tilapia-frita",
    name: "Tilapia frita",
    price: "$6.00",
    description: "Tilapia frita, yucas, porción de arroz y curtido/ensalada.",
    category: "platos-fuertes",
    image: "/platos/tilapia.jpg",
  },
  {
    id: "corvina-frita",
    name: "Corvina frita",
    price: "$6.00",
    description:
      "Corvina frita, papas fritas, porción de arroz y curtido/ensalada.",
    category: "platos-fuertes",
    image: "/platos/corvina.jpg",
  },
  {
    id: "camarones-ajillo",
    name: "Camarones al ajillo",
    price: "$6.00",
    description: "Camarones al ajillo, arroz, maduros, tomate y aguacate.",
    category: "platos-fuertes",
    image: "/platos/camarones.jpg",
  },
  {
    id: "churrasco",
    name: "Churrasco",
    price: "$5.50",
    description:
      "Carne a la plancha, papas fritas, arroz, botón rojo, huevo frito y ensalada.",
    category: "platos-fuertes",
    image: "/platos/churrasco.jpg",
  },
  {
    id: "fritada",
    name: "Fritada",
    price: "$6.00",
    description:
      "Fritada, choclo, habas, queso, papas salteadas, tostado y curtido.",
    category: "platos-fuertes",
    image: "/platos/fritada.jpg",
  },
  {
    id: "salchipapas",
    name: "Salchipapas",
    price: "$2.00",
    category: "platos-fuertes",
  },
  {
    id: "papipollo",
    name: "Papipollo",
    price: "$2.50",
    category: "platos-fuertes",
  },

  // Sopas / Caldos
  {
    id: "yaguarlocro",
    name: "Yaguarlocro",
    price: "$4.50",
    category: "sopas-caldos",
    image: "/platos/yaguarlocro.jpg",
  },
  {
    id: "caldo-gallina",
    name: "Caldo de gallina",
    price: "$4.50",
    category: "sopas-caldos",
  },
  {
    id: "menudo",
    name: "Menudo con morcilla de dulce",
    price: "$4.50",
    category: "sopas-caldos",
  },
  {
    id: "caldo-pata",
    name: "Caldo de pata",
    price: "$4.50",
    category: "sopas-caldos",
  },

  // Bebidas
  {
    id: "gaseosa-2l",
    name: "Gaseosa retornable 2L",
    price: "$3.00",
    category: "bebidas",
  },
  {
    id: "gaseosa-personal",
    name: "Gaseosa personal",
    price: "$1.00",
    category: "bebidas",
  },
  {
    id: "jarra",
    name: "Jarra (mora, limonada, chicha o guanábana)",
    price: "$3.50",
    category: "bebidas",
  },
  {
    id: "vaso-16oz",
    name: "Vaso 16 oz (mora, limonada, chicha o guanábana)",
    price: "$1.50",
    category: "bebidas",
  },
  {
    id: "agua",
    name: "Agua",
    price: "$1.00",
    category: "bebidas",
  },
  {
    id: "guitig",
    name: "Güitig",
    price: "$1.00",
    category: "bebidas",
  },

  // Postres
  {
    id: "helado-mandarina",
    name: "Helado de mandarina",
    price: "$1.00",
    category: "postres",
  },
  {
    id: "pastel-mandarina",
    name: "Porción de pastel de mandarina",
    price: "$1.00",
    category: "postres",
  },
  {
    id: "pan-mandarina",
    name: "Pan de mandarina",
    price: "$1.00",
    category: "postres",
  },
];
