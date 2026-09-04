"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LanguageToggle() {
  const { locale, toggleLocale, t } = useLanguage();
  const nextIsEn = locale === "es";

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={nextIsEn ? t.language.switchToEn : t.language.switchToEs}
      title={nextIsEn ? t.language.switchToEn : t.language.switchToEs}
      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 text-sm font-bold text-foreground shadow-sm transition hover:border-gold-400 hover:text-gold-500"
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span className="min-w-[1.5rem] text-center tracking-wide">
        {nextIsEn ? "EN" : "ES"}
      </span>
    </button>
  );
}
