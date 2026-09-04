import Image from "next/image";
import { PhotoCarousel } from "@/features/home/PhotoCarousel";
import {
  MapPin,
  Clock,
  MessageCircle,
  ChefHat,
  Flame,
  Users,
  Phone,
  Facebook,
  Instagram,
  Navigation,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloatButton } from "@/components/layout/WhatsAppFloatButton";
import { ButtonLink } from "@/components/ui/Button";
import { MenuSection } from "@/features/menu/MenuSection";
import { HeroContent } from "@/features/home/HeroContent";
import { CONTACT } from "@/lib/contact";

const HERO_PHOTOS = [
  { src: "/instalaciones/instalaciones1.jpg", alt: "Terraza de La Ruta del Sabor con vista a la montaña" },
  { src: "/instalaciones/instalaciones2.jpg", alt: "Terraza con vista a la montaña" },
  { src: "/instalaciones/instalaciones3.jpg", alt: "Área cubierta decorada del restaurante" },
  { src: "/instalaciones/instalaciones4.jpg", alt: "Jardín y fuente del restaurante" },
];

const INSTALACIONES_GALLERY = [
  { src: "/instalaciones/instalaciones2.jpg", alt: "Terraza con vista a la montaña" },
  { src: "/instalaciones/instalaciones3.jpg", alt: "Área cubierta decorada del restaurante" },
  { src: "/instalaciones/instalaciones4.jpg", alt: "Jardín y fuente del restaurante" },
];

const FEATURES = [
  {
    icon: Flame,
    title: "Al carbón",
    description: "Asado tradicional a fuego lento, con todo el sabor.",
  },
  {
    icon: ChefHat,
    title: "Recetas propias",
    description: "Sazón familiar transmitida de generación en generación.",
  },
  {
    icon: Clock,
    title: "Pedidos sin filas",
    description: "Pide en línea por WhatsApp y recoge o recibe a tiempo.",
  },
  {
    icon: Users,
    title: "Ambiente familiar",
    description: "Ideal para compartir en grupo, fines de semana.",
  },
];

export default function Home() {
  return (
    <div id="top">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-background text-foreground">
          <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
            <HeroContent />

            <div className="relative flex items-center justify-center">
              <PhotoCarousel photos={HERO_PHOTOS} />
            </div>
          </div>
        </section>

        {/* Sobre nosotros */}
        <section
          id="nosotros"
          className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20"
        >
          <div className="mb-12 max-w-2xl">
            <h2 className="font-display text-4xl font-black italic tracking-tight text-brand-600">
              Una cocina con sazón propia
            </h2>
            <p className="mt-4 text-foreground-muted">
              En La Ruta del Sabor preparamos cada plato con recetas
              tradicionales y mucho fuego: cuy asado, parrilladas, borrego,
              mariscos y caldos que reconfortan.
            </p>
          </div>

          <div className="mb-12 grid grid-cols-3 gap-4">
            {INSTALACIONES_GALLERY.map((photo) => (
              <div
                key={photo.src}
                className="group relative w-full h-40 overflow-hidden rounded-2xl sm:h-56 md:h-64"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 33vw, 260px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600/10 text-brand-600">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="font-bold text-foreground">{feature.title}</p>
                <p className="text-sm text-foreground-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Menú */}
        <section
          id="menu"
          className="scroll-mt-24 bg-background py-20 text-foreground"
        >
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-2 font-display text-4xl font-black italic tracking-tight text-brand-600">
              Nuestro menú
            </h2>
            <p className="mb-10 text-foreground-muted">
              Filtra por categoría y encuentra tu plato favorito.
            </p>
            <MenuSection />
          </div>
        </section>

        {/* Ubicación / CTA final */}
        <section
          id="ubicacion"
          className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20"
        >
          <h2 className="mb-2 font-display text-4xl font-black italic tracking-tight text-brand-600">
            Visítanos
          </h2>
          <p className="mb-10 max-w-2xl text-foreground-muted">
            Encuéntranos, escríbenos o síguenos en redes — te esperamos con
            las brasas listas.
          </p>

          <div className="grid overflow-hidden rounded-3xl border border-border-subtle bg-surface text-foreground shadow-sm md:grid-cols-2">
            <div className="flex flex-col gap-6 p-8 md:p-12">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Dónde estamos</p>
                  <p className="text-foreground-muted">{CONTACT.addressLabel}</p>
                  <a
                    href={CONTACT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-500"
                  >
                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                    Cómo llegar
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Horario</p>
                  <p className="text-foreground-muted">{CONTACT.hoursLabel}</p>
                  {CONTACT.hoursLines.map((line) => (
                    <p key={line} className="text-foreground-muted">
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Contáctanos</p>
                  <a
                    href={`tel:${CONTACT.phoneTel}`}
                    className="text-foreground-muted transition hover:text-foreground"
                  >
                    {CONTACT.phoneDisplay}
                  </a>
                </div>
              </div>

              <div id="pedir" className="flex scroll-mt-24 items-start gap-3">
                <MessageCircle className="mt-1 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Pide en línea</p>
                  <ButtonLink
                    href={CONTACT.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="primary"
                    size="sm"
                    className="mt-2"
                  >
                    Escribir por WhatsApp
                  </ButtonLink>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3 border-t border-border-subtle pt-6">
                <a
                  href={CONTACT.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Síguenos en Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-foreground-muted transition hover:border-brand-500 hover:text-brand-600"
                >
                  <Facebook className="h-5 w-5" aria-hidden="true" />
                </a>
                <a
                  href={CONTACT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Síguenos en Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-foreground-muted transition hover:border-brand-500 hover:text-brand-600"
                >
                  <Instagram className="h-5 w-5" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="min-h-[320px]">
              <iframe
                src={CONTACT.mapsEmbedUrl}
                title="Ubicación de La Ruta del Sabor en el mapa"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full min-h-[320px] w-full border-0 grayscale-[15%]"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloatButton />
    </div>
  );
}
