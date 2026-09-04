import type { Locale } from "./types";

/** Traducciones de platos por id (precio e imagen siguen en data.ts). */
export const MENU_ITEM_I18N: Record<
  string,
  Record<Locale, { name: string; description?: string }>
> = {
  "cuy-entero": {
    es: {
      name: "Cuy entero asado",
      description:
        "Papas cocinadas, lechuga, tomate, salsa de maní y aguacate.",
    },
    en: {
      name: "Whole roasted guinea pig",
      description:
        "Boiled potatoes, lettuce, tomato, peanut sauce and avocado.",
    },
  },
  "medio-cuy": {
    es: {
      name: "1/2 Cuy asado",
      description:
        "Papas cocinadas, lechuga, tomate, salsa de maní y aguacate.",
    },
    en: {
      name: "1/2 roasted guinea pig",
      description:
        "Boiled potatoes, lettuce, tomato, peanut sauce and avocado.",
    },
  },
  "cuarto-cuy": {
    es: {
      name: "1/4 Cuy asado",
      description:
        "Papas cocinadas, lechuga, tomate, salsa de maní y aguacate.",
    },
    en: {
      name: "1/4 roasted guinea pig",
      description:
        "Boiled potatoes, lettuce, tomato, peanut sauce and avocado.",
    },
  },
  parrillada: {
    es: {
      name: "Parrillada",
      description:
        "Pollo, chuleta, longaniza, botón rojo, botón negro, choclo, papas salteadas y ensalada.",
    },
    en: {
      name: "Grill platter",
      description:
        "Chicken, pork chop, sausage, blood sausage, black pudding, corn, sautéed potatoes and salad.",
    },
  },
  borrego: {
    es: {
      name: "Borrego",
      description:
        "Borrego asado, habas, choclo, papas salteadas, queso y ensalada.",
    },
    en: {
      name: "Lamb",
      description:
        "Roasted lamb, fava beans, corn, sautéed potatoes, cheese and salad.",
    },
  },
  "costillas-bbq": {
    es: {
      name: "Costillas BBQ",
      description:
        "Costilla asada, papas fritas, choclo, ensalada y salsa BBQ.",
    },
    en: {
      name: "BBQ ribs",
      description: "Roasted ribs, fries, corn, salad and BBQ sauce.",
    },
  },
  "tilapia-frita": {
    es: {
      name: "Tilapia frita",
      description: "Tilapia frita, yucas, porción de arroz y curtido/ensalada.",
    },
    en: {
      name: "Fried tilapia",
      description: "Fried tilapia, yuca, rice portion and pickled salad.",
    },
  },
  "corvina-frita": {
    es: {
      name: "Corvina frita",
      description:
        "Corvina frita, papas fritas, porción de arroz y curtido/ensalada.",
    },
    en: {
      name: "Fried corvina",
      description: "Fried corvina, fries, rice portion and pickled salad.",
    },
  },
  "camarones-ajillo": {
    es: {
      name: "Camarones al ajillo",
      description: "Camarones al ajillo, arroz, maduros, tomate y aguacate.",
    },
    en: {
      name: "Garlic shrimp",
      description: "Garlic shrimp, rice, ripe plantains, tomato and avocado.",
    },
  },
  churrasco: {
    es: {
      name: "Churrasco",
      description:
        "Carne a la plancha, papas fritas, arroz, botón rojo, huevo frito y ensalada.",
    },
    en: {
      name: "Churrasco",
      description:
        "Grilled steak, fries, rice, blood sausage, fried egg and salad.",
    },
  },
  fritada: {
    es: {
      name: "Fritada",
      description:
        "Fritada, choclo, habas, queso, papas salteadas, tostado y curtido.",
    },
    en: {
      name: "Fritada",
      description:
        "Pork fritada, corn, fava beans, cheese, sautéed potatoes, toasted corn and pickled salad.",
    },
  },
  salchipapas: {
    es: { name: "Salchipapas" },
    en: { name: "Salchipapas (fries & sausage)" },
  },
  papipollo: {
    es: { name: "Papipollo" },
    en: { name: "Papipollo (fries & chicken)" },
  },
  yaguarlocro: {
    es: { name: "Yaguarlocro" },
    en: { name: "Yaguarlocro (potato blood broth)" },
  },
  "caldo-gallina": {
    es: { name: "Caldo de gallina" },
    en: { name: "Hen broth" },
  },
  menudo: {
    es: { name: "Menudo con morcilla de dulce" },
    en: { name: "Menudo with sweet blood sausage" },
  },
  "caldo-pata": {
    es: { name: "Caldo de pata" },
    en: { name: "Cow-foot broth" },
  },
  "gaseosa-2l": {
    es: { name: "Gaseosa retornable 2L" },
    en: { name: "Soda (returnable bottle) 2L" },
  },
  "gaseosa-personal": {
    es: { name: "Gaseosa personal" },
    en: { name: "Personal soda" },
  },
  jarra: {
    es: { name: "Jarra (mora, limonada, chicha o guanábana)" },
    en: { name: "Pitcher (blackberry, lemonade, chicha or soursop)" },
  },
  "vaso-16oz": {
    es: { name: "Vaso 16 oz (mora, limonada, chicha o guanábana)" },
    en: { name: "16 oz cup (blackberry, lemonade, chicha or soursop)" },
  },
  agua: {
    es: { name: "Agua" },
    en: { name: "Water" },
  },
  guitig: {
    es: { name: "Güitig" },
    en: { name: "Güitig (sparkling water)" },
  },
  "helado-mandarina": {
    es: { name: "Helado de mandarina" },
    en: { name: "Mandarin ice cream" },
  },
  "pastel-mandarina": {
    es: { name: "Porción de pastel de mandarina" },
    en: { name: "Mandarin cake slice" },
  },
  "pan-mandarina": {
    es: { name: "Pan de mandarina" },
    en: { name: "Mandarin bread" },
  },
};
