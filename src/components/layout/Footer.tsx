"use client";

import { MapPin, Phone, Clock, Facebook, Instagram } from "lucide-react";
import { CONTACT } from "@/lib/contact";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();

  const navLinks = [
    { href: "#menu", label: t.nav.menu },
    { href: "#nosotros", label: t.nav.about },
    { href: "#ubicacion", label: t.nav.location },
  ];

  return (
    <footer className="border-t border-border-subtle bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3">
        <div className="flex flex-col gap-4 sm:col-span-1">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="La Ruta del Sabor"
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-border-subtle"
            />
            <span className="font-display text-xl font-black italic tracking-tight text-brand-600">
              La Ruta del Sabor
            </span>
          </div>
          <p className="max-w-xs text-sm text-foreground-muted">{t.footer.blurb}</p>
          <div className="flex items-center gap-3">
            <a
              href={CONTACT.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.visit.followFacebook}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-foreground/70 transition hover:border-brand-500 hover:text-brand-600"
            >
              <Facebook className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.visit.followInstagram}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-foreground/70 transition hover:border-brand-500 hover:text-brand-600"
            >
              <Instagram className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
            {t.footer.explore}
          </p>
          <ul className="flex flex-col gap-2 text-sm text-foreground-muted">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition hover:text-brand-500">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
            {t.footer.contact}
          </p>
          <ul className="flex flex-col gap-2 text-sm text-foreground-muted">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
              <a
                href={CONTACT.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-brand-500"
              >
                {CONTACT.addressLabel}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
              <a
                href={`tel:${CONTACT.phoneTel}`}
                className="transition hover:text-brand-500"
              >
                {CONTACT.phoneDisplay}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
              <div>
                <p>{t.visit.hoursLabel}</p>
                {t.visit.hoursLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border-subtle py-6 text-center text-sm text-foreground-muted">
        © {new Date().getFullYear()} La Ruta del Sabor. {t.footer.rights}
      </div>
    </footer>
  );
}
