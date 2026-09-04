const WHATSAPP_MESSAGE = "Hola, quisiera hacer un pedido en La Ruta del Sabor 🔥";

export const CONTACT = {
  addressLabel: "Quito - Perucho",
  mapsUrl: "https://maps.app.goo.gl/bePwZyXn1WyH1sxU6",
  mapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m3!2m1!1s0.1010763,-78.4164288!6i16",
  phoneDisplay: "096 307 9890",
  phoneTel: "+593963079890",
  whatsappUrl: `https://wa.me/593963079890?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
  facebookUrl: "https://www.facebook.com/profile.php?id=100067814567472",
  instagramUrl: "https://www.instagram.com/larutadelsaborec/",
  hoursLabel: "Fines de semana y feriados",
  hoursLines: [
    "Sábados: 11:00 a. m. – 6:00 p. m.",
    "Domingos: 10:00 a. m. – 6:00 p. m.",
  ],
} as const;
