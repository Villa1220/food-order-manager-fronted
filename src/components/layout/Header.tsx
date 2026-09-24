"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ButtonLink } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useSession } from "@/lib/useSession";
import { trackEvent } from "@/lib/analytics";

export function Header() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const sessionUser = useSession();

  const navLinks = [
    { href: "/#menu", label: t.nav.menu },
    { href: "/#nosotros", label: t.nav.about },
    { href: "/#ubicacion", label: t.nav.location },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="La Ruta del Sabor"
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-border-subtle"
          />
          <span className="font-display text-xl font-black italic tracking-tight text-brand-600">
            La Ruta del Sabor
          </span>
        </a>

        <div className="hidden gap-8 text-sm font-medium text-foreground/80 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-brand-500">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageToggle />
          <ButtonLink
            href={sessionUser ? "/panel" : "/login"}
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() =>
              trackEvent(sessionUser ? "panel_click" : "login_click", {
                place: "header",
              })
            }
          >
            {sessionUser ? "Panel" : t.nav.order}
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface text-foreground transition hover:border-gold-400 hover:text-gold-500 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-border-subtle bg-background md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground/80 transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30"
                >
                  {link.label}
                </a>
              ))}
              <ButtonLink
                href={sessionUser ? "/panel" : "/login"}
                onClick={() => {
                  setOpen(false);
                  trackEvent(sessionUser ? "panel_click" : "login_click", {
                    place: "header_mobile",
                  });
                }}
                size="sm"
                className="mt-2 justify-center sm:hidden"
              >
                {sessionUser ? "Panel" : t.nav.order}
              </ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
