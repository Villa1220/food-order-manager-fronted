"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Home, Lock, ShieldCheck } from "lucide-react";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { GoogleSignIn } from "@/features/auth/GoogleSignIn";
import { postLoginPath, readSession } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const session = readSession();
    if (session?.user) {
      router.replace(postLoginPath(session.user.role));
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="La Ruta del Sabor"
            className="h-11 w-11 rounded-full object-cover ring-1 ring-border-subtle"
          />
          <span className="font-display text-lg font-black italic tracking-tight text-brand-600">
            La Ruta del Sabor
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex w-full max-w-md flex-col items-center"
        >
          <div className="w-full rounded-[1.75rem] border border-border-subtle bg-surface p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
              {t.login.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl font-black italic tracking-tight text-brand-600">
              {t.login.title}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/70">
              {t.login.subtitle}
            </p>

            <div className="my-8 flex items-center gap-3">
              <span className="h-px flex-1 bg-border-subtle" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                {t.login.continueWith}
              </span>
              <span className="h-px flex-1 bg-border-subtle" />
            </div>

            <GoogleSignIn />

            <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-foreground/50">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
              {t.login.privacy}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs text-foreground/45">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              {t.login.staffOnly}
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700"
          >
            <Home className="h-4 w-4" />
            {t.login.backHome}
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
