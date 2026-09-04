export type Locale = "es" | "en";

export type Dictionary = {
  nav: {
    menu: string;
    about: string;
    location: string;
    order: string;
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    badge: string;
    subtitle: string;
    orderWhatsApp: string;
    viewMenu: string;
  };
  about: {
    title: string;
    body: string;
    features: {
      charcoal: { title: string; description: string };
      recipes: { title: string; description: string };
      noLines: { title: string; description: string };
      family: { title: string; description: string };
    };
    galleryAlts: [string, string, string];
    heroAlts: [string, string, string, string];
  };
  menu: {
    title: string;
    subtitle: string;
    all: string;
    specialty: string;
    enlarge: string;
    categories: Record<string, string>;
  };
  visit: {
    title: string;
    subtitle: string;
    where: string;
    howToGet: string;
    howToGetHint: string;
    hours: string;
    hoursLabel: string;
    hoursLines: [string, string];
    contact: string;
    orderOnline: string;
    writeWhatsApp: string;
    mapTitle: string;
    followFacebook: string;
    followInstagram: string;
  };
  footer: {
    blurb: string;
    explore: string;
    contact: string;
    rights: string;
  };
  language: {
    switchToEn: string;
    switchToEs: string;
  };
  whatsappAria: string;
};
