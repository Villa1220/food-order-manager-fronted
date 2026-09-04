import type { Dictionary } from "./types";

export const dictionaries: Record<"es" | "en", Dictionary> = {
  es: {
    nav: {
      menu: "Menú",
      about: "Nosotros",
      location: "Ubicación",
      order: "Iniciar sesión",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
    },
    hero: {
      badge: "Comida típica ecuatoriana",
      subtitle:
        "Cuy asado, parrilladas, caldos de siempre y mucho más. Comida típica ecuatoriana con toda la sazón, para pedir en línea y disfrutar sin filas ni esperas.",
      orderWhatsApp: "Pedir por WhatsApp",
      viewMenu: "Ver el menú",
    },
    about: {
      title: "Una cocina con sazón propia",
      body: "En La Ruta del Sabor preparamos comida típica ecuatoriana con recetas tradicionales y mucho fuego: cuy asado, parrilladas, borrego, mariscos y caldos que reconfortan.",
      features: {
        charcoal: {
          title: "Al carbón",
          description: "Asado tradicional a fuego lento, con todo el sabor.",
        },
        recipes: {
          title: "Recetas propias",
          description:
            "Sazón familiar transmitida de generación en generación.",
        },
        noLines: {
          title: "Pedidos sin filas",
          description:
            "Pide en línea por WhatsApp y recoge o recibe a tiempo.",
        },
        family: {
          title: "Ambiente familiar",
          description: "Ideal para compartir en grupo, fines de semana.",
        },
      },
      galleryAlts: [
        "Terraza con vista a la montaña",
        "Área cubierta decorada del restaurante",
        "Jardín y fuente del restaurante",
      ],
      heroAlts: [
        "Terraza de La Ruta del Sabor con vista a la montaña",
        "Terraza con vista a la montaña",
        "Área cubierta decorada del restaurante",
        "Jardín y fuente del restaurante",
      ],
    },
    menu: {
      title: "Nuestro menú",
      subtitle: "Filtra por categoría y encuentra tu plato favorito.",
      all: "Todos",
      specialty: "Especialidad",
      enlarge: "Ampliar",
      categories: {
        "platos-fuertes": "Platos fuertes",
        "sopas-caldos": "Sopas",
        bebidas: "Bebidas",
        postres: "Postres",
      },
    },
    visit: {
      title: "Visítanos",
      subtitle:
        "Encuéntranos, escríbenos o síguenos en redes — te esperamos con las brasas listas.",
      where: "Dónde estamos",
      howToGet: "Abrir en Google Maps",
      howToGetHint:
        "¿Quieres visitarnos? Presiona el botón y te llevamos a la ubicación en Google Maps.",
      hours: "Horario",
      hoursLabel: "Fines de semana y feriados",
      hoursLines: [
        "Sábados: 11:00 a. m. – 6:00 p. m.",
        "Domingos: 10:00 a. m. – 6:00 p. m.",
      ],
      contact: "Contáctanos",
      orderOnline: "Pide en línea",
      writeWhatsApp: "Escribir por WhatsApp",
      mapTitle: "Ubicación de La Ruta del Sabor en el mapa",
      followFacebook: "Síguenos en Facebook",
      followInstagram: "Síguenos en Instagram",
    },
    footer: {
      blurb:
        "Comida típica ecuatoriana: cuy, parrilladas, caldos y mucho sabor, listos para pedir en línea.",
      explore: "Explorar",
      contact: "Contacto",
      rights: "Todos los derechos reservados.",
    },
    language: {
      switchToEn: "Cambiar a inglés",
      switchToEs: "Cambiar a español",
    },
    whatsappAria: "Pedir por WhatsApp",
    login: {
      title: "Iniciar sesión",
      eyebrow: "Acceso del equipo",
      subtitle:
        "Entra con la cuenta de Google del restaurante. Usamos tu nombre y correo para abrirte el panel de admin o de mesero.",
      continueWith: "Continuar con Google",
      entering: "Entrando al panel…",
      staffOnly: "Solo personal autorizado",
      privacy: "No publicamos tu correo. La sesión queda en este dispositivo.",
      photoAlt: "Terraza de La Ruta del Sabor",
      photoCaption: "Perucho · Quito",
      missingClient:
        "Falta el ID de cliente de Google (NEXT_PUBLIC_GOOGLE_CLIENT_ID y GOOGLE_CLIENT_ID en el backend). En Google Cloud: APIs y servicios → Credenciales → ID de cliente OAuth (aplicación web), orígenes autorizados http://localhost:3000.",
      backHome: "Volver al inicio",
    },
  },
  en: {
    nav: {
      menu: "Menu",
      about: "About",
      location: "Location",
      order: "Log in",
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    hero: {
      badge: "Typical Ecuadorian food",
      subtitle:
        "Roasted guinea pig, grill platters, classic broths and much more. Typical Ecuadorian food with full seasoning — order online and enjoy without long lines or waits.",
      orderWhatsApp: "Order via WhatsApp",
      viewMenu: "View the menu",
    },
    about: {
      title: "A kitchen with its own seasoning",
      body: "At La Ruta del Sabor we prepare typical Ecuadorian food with traditional recipes and plenty of fire: roasted guinea pig, grill platters, lamb, seafood and comforting broths.",
      features: {
        charcoal: {
          title: "Charcoal grilled",
          description:
            "Traditional slow roasting over fire, with full flavor.",
        },
        recipes: {
          title: "House recipes",
          description:
            "Family seasoning passed down from generation to generation.",
        },
        noLines: {
          title: "Orders without lines",
          description:
            "Order online via WhatsApp and pick up or receive on time.",
        },
        family: {
          title: "Family atmosphere",
          description: "Ideal for sharing with a group on weekends.",
        },
      },
      galleryAlts: [
        "Terrace with mountain view",
        "Covered decorated area of the restaurant",
        "Garden and fountain of the restaurant",
      ],
      heroAlts: [
        "La Ruta del Sabor terrace with mountain view",
        "Terrace with mountain view",
        "Covered decorated area of the restaurant",
        "Garden and fountain of the restaurant",
      ],
    },
    menu: {
      title: "Our menu",
      subtitle: "Filter by category and find your favorite dish.",
      all: "All",
      specialty: "Specialty",
      enlarge: "Enlarge",
      categories: {
        "platos-fuertes": "Main dishes",
        "sopas-caldos": "Soups",
        bebidas: "Drinks",
        postres: "Desserts",
      },
    },
    visit: {
      title: "Visit us",
      subtitle:
        "Find us, write to us or follow us on social media — we wait for you with the coals ready.",
      where: "Where we are",
      howToGet: "Open in Google Maps",
      howToGetHint:
        "Want to visit us? Press the button and we'll take you to the location on Google Maps.",
      hours: "Hours",
      hoursLabel: "Weekends and holidays",
      hoursLines: [
        "Saturdays: 11:00 a.m. – 6:00 p.m.",
        "Sundays: 10:00 a.m. – 6:00 p.m.",
      ],
      contact: "Contact us",
      orderOnline: "Order online",
      writeWhatsApp: "Message on WhatsApp",
      mapTitle: "La Ruta del Sabor location on the map",
      followFacebook: "Follow us on Facebook",
      followInstagram: "Follow us on Instagram",
    },
    footer: {
      blurb:
        "Typical Ecuadorian food: guinea pig, grill platters, broths and plenty of flavor, ready to order online.",
      explore: "Explore",
      contact: "Contact",
      rights: "All rights reserved.",
    },
    language: {
      switchToEn: "Switch to English",
      switchToEs: "Switch to Spanish",
    },
    whatsappAria: "Order via WhatsApp",
    login: {
      title: "Log in",
      eyebrow: "Staff access",
      subtitle:
        "Sign in with the restaurant Google account. We use your name and email to open the admin or waiter panel.",
      continueWith: "Continue with Google",
      entering: "Opening the panel…",
      staffOnly: "Authorized staff only",
      privacy: "We do not publish your email. The session stays on this device.",
      photoAlt: "La Ruta del Sabor terrace",
      photoCaption: "Perucho · Quito",
      missingClient:
        "Missing Google client ID (NEXT_PUBLIC_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID on the backend). In Google Cloud: APIs & services → Credentials → OAuth client ID (web app), authorized origins http://localhost:3000.",
      backHome: "Back to home",
    },
  },
};
