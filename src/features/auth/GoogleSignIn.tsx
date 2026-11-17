"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  GOOGLE_CLIENT_ID,
  loginWithGoogle,
  postLoginPath,
} from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            el: HTMLElement,
            options: {
              theme: string;
              size: string;
              text: string;
              locale: string;
              shape: string;
              width: number;
              logo_alignment: string;
            },
          ) => void;
        };
      };
    };
  }
}

function buttonWidth(container: HTMLElement): number {
  const available = Math.floor(container.clientWidth);
  return Math.max(200, Math.min(available, 400));
}

export function GoogleSignIn() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const frameRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let painted = 0;
    const paint = () => {
      const frame = frameRef.current;
      const slot = buttonRef.current;
      if (!window.google || !frame || !slot) return;
      const width = buttonWidth(frame);
      if (width === painted && slot.childElementCount > 0) return;
      painted = width;
      slot.innerHTML = "";
      window.google.accounts.id.renderButton(slot, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        locale: locale === "en" ? "en" : "es",
        shape: "pill",
        width,
        logo_alignment: "left",
      });
    };

    const start = () => {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          setBusy(true);
          setError(null);
          void loginWithGoogle(response.credential)
            .then((signedIn) => {
              router.replace(postLoginPath(signedIn.role));
            })
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Error al entrar.");
            })
            .finally(() => setBusy(false));
        },
      });
      paint();
    };

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = start;
    document.body.appendChild(script);

    const frame = frameRef.current;
    const observer = new ResizeObserver(() => paint());
    if (frame) observer.observe(frame);

    return () => {
      observer.disconnect();
      script.remove();
    };
  }, [locale, router]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="flex gap-3 rounded-2xl border border-border-subtle bg-brand-50 px-4 py-3 text-sm text-foreground/80 dark:bg-brand-950/40">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p>{t.login.missingClient}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-4">
      <div ref={frameRef} className="w-full min-w-0 overflow-hidden">
        <div
          className={busy ? "pointer-events-none opacity-40" : undefined}
          ref={buttonRef}
        />
      </div>
      {busy ? (
        <p className="flex items-center gap-2 text-sm text-foreground/60">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          {t.login.entering}
        </p>
      ) : null}
      {error ? (
        <div className="flex w-full gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}
    </div>
  );
}
