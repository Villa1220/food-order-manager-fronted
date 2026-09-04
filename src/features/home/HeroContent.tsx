"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { CONTACT } from "@/lib/contact";

export function HeroContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col justify-center gap-6"
    >
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground-muted">
        <Flame className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
        Sabor con fuego, tradición y sazón
      </span>
      <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
        La <span className="italic text-brand-500">Ruta</span> del{" "}
        <span className="italic text-gold-500">Sabor</span>
      </h1>
      <p className="max-w-md text-lg text-foreground-muted">
        Cuy asado, parrilladas, caldos de siempre y mucho más. Comida
        ecuatoriana con toda la sazón, para pedir en línea y disfrutar sin
        filas ni esperas.
      </p>
      <div className="flex flex-wrap gap-4">
        <ButtonLink
          href={CONTACT.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
        >
          Pedir por WhatsApp
        </ButtonLink>
        <ButtonLink href="#menu" variant="ghost">
          Ver el menú
        </ButtonLink>
      </div>
    </motion.div>
  );
}
