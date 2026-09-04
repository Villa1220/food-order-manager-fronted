"use client";

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
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloatButton } from "@/components/layout/WhatsAppFloatButton";
import { ButtonLink } from "@/components/ui/Button";
import { MenuSection } from "@/features/menu/MenuSection";
import { HeroContent } from "@/features/home/HeroContent";
import { CONTACT } from "@/lib/contact";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SectionViewTracker } from "@/components/analytics/SectionViewTracker";
import { trackEvent } from "@/lib/analytics";

const HERO_PHOTOS = [
  "/instalaciones/instalaciones1.jpg",
  "/instalaciones/instalaciones2.jpg",
  "/instalaciones/instalaciones3.jpg",
  "/instalaciones/instalaciones4.jpg",
] as const;

const INSTALACIONES_GALLERY = [
  "/instalaciones/instalaciones2.jpg",
  "/instalaciones/instalaciones3.jpg",
  "/instalaciones/instalaciones4.jpg",
] as const;

const FEATURE_ICONS = [Flame, ChefHat, Clock, Users] as const;

export function HomePage() {
  const { t } = useLanguage();

  const features = [
    { icon: FEATURE_ICONS[0], ...t.about.features.charcoal },
    { icon: FEATURE_ICONS[1], ...t.about.features.recipes },
    { icon: FEATURE_ICONS[2], ...t.about.features.noLines },
    { icon: FEATURE_ICONS[3], ...t.about.features.family },
  ];

  const heroPhotos = HERO_PHOTOS.map((src, i) => ({
    src,
    alt: t.about.heroAlts[i],
  }));

  return (
    <div id="top">
      <Header />
      <SectionViewTracker />
      <main>
        <section className="relative overflow-hidden bg-background text-foreground">
          <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
            <HeroContent />
            <div className="relative flex items-center justify-center">
              <PhotoCarousel photos={heroPhotos} />
            </div>
          </div>
        </section>

        <section
          id="nosotros"
          className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20"
        >
          <div className="mb-12 max-w-2xl">
            <h2 className="font-display text-4xl font-black italic tracking-tight text-brand-600">
              {t.about.title}
            </h2>
            <p className="mt-4 text-foreground-muted">{t.about.body}</p>
          </div>

          <div className="mb-12 grid grid-cols-3 gap-4">
            {INSTALACIONES_GALLERY.map((src, i) => (
              <div
                key={src}
                className="group relative h-40 w-full overflow-hidden rounded-2xl sm:h-56 md:h-64"
              >
                <Image
                  src={src}
                  alt={t.about.galleryAlts[i]}
                  fill
                  sizes="(max-width: 640px) 33vw, 260px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
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

        <section
          id="menu"
          className="scroll-mt-24 bg-background py-20 text-foreground"
        >
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-2 font-display text-4xl font-black italic tracking-tight text-brand-600">
              {t.menu.title}
            </h2>
            <p className="mb-10 text-foreground-muted">{t.menu.subtitle}</p>
            <MenuSection />
          </div>
        </section>

        <section
          id="ubicacion"
          className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20"
        >
          <h2 className="mb-2 font-display text-4xl font-black italic tracking-tight text-brand-600">
            {t.visit.title}
          </h2>
          <p className="mb-10 max-w-2xl text-foreground-muted">
            {t.visit.subtitle}
          </p>

          <div className="grid overflow-hidden rounded-3xl border border-border-subtle bg-surface text-foreground shadow-sm md:grid-cols-2">
            <div className="flex flex-col gap-6 p-8 md:p-12">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{t.visit.where}</p>
                  <p className="text-foreground-muted">{CONTACT.addressLabel}</p>
                  <p className="mt-2 max-w-xs text-sm text-foreground-muted">
                    {t.visit.howToGetHint}
                  </p>
                  <a
                    href={CONTACT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("maps_click", { place: "visit" })}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-500 bg-brand-500/10 px-4 py-2 text-sm font-bold text-brand-600 transition hover:bg-brand-500 hover:text-white"
                  >
                    <Navigation className="h-4 w-4" aria-hidden="true" />
                    {t.visit.howToGet}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{t.visit.hours}</p>
                  <p className="text-foreground-muted">{t.visit.hoursLabel}</p>
                  {t.visit.hoursLines.map((line) => (
                    <p key={line} className="text-foreground-muted">
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{t.visit.contact}</p>
                  <a
                    href={`tel:${CONTACT.phoneTel}`}
                    onClick={() => trackEvent("phone_click", { place: "visit" })}
                    className="text-foreground-muted transition hover:text-foreground"
                  >
                    {CONTACT.phoneDisplay}
                  </a>
                </div>
              </div>

              <div id="pedir" className="flex scroll-mt-24 items-start gap-3">
                <MessageCircle className="mt-1 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{t.visit.orderOnline}</p>
                  <ButtonLink
                    href={CONTACT.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="primary"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      trackEvent("whatsapp_click", { place: "visit" })
                    }
                  >
                    {t.visit.writeWhatsApp}
                  </ButtonLink>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3 border-t border-border-subtle pt-6">
                <a
                  href={CONTACT.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.visit.followFacebook}
                  onClick={() =>
                    trackEvent("social_click", { network: "facebook", place: "visit" })
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-foreground-muted transition hover:border-brand-500 hover:text-brand-600"
                >
                  <Facebook className="h-5 w-5" aria-hidden="true" />
                </a>
                <a
                  href={CONTACT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.visit.followInstagram}
                  onClick={() =>
                    trackEvent("social_click", { network: "instagram", place: "visit" })
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-foreground-muted transition hover:border-brand-500 hover:text-brand-600"
                >
                  <Instagram className="h-5 w-5" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="min-h-[320px]">
              <iframe
                src={CONTACT.mapsEmbedUrl}
                title={t.visit.mapTitle}
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
