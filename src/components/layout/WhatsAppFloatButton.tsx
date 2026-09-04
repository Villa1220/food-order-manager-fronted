"use client";

import { MessageCircle } from "lucide-react";
import { CONTACT } from "@/lib/contact";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { trackEvent } from "@/lib/analytics";

export function WhatsAppFloatButton() {
  const { t } = useLanguage();

  return (
    <a
      href={CONTACT.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.whatsappAria}
      onClick={() => trackEvent("whatsapp_click", { place: "float" })}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/30 transition hover:scale-105 hover:brightness-105 sm:hidden"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}
