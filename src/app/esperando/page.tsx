"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  clearSession,
  postLoginPath,
  readSession,
  saveSessionUser,
  type SessionUser,
} from "@/lib/auth";

export default function WaitingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const session = readSession();
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    if (session.user.role !== "pendiente") {
      router.replace(postLoginPath(session.user.role));
      return;
    }
    setEmail(session.user.email);

    const check = async () => {
      try {
        const data = await apiFetch<{ user: SessionUser }>("/api/auth/me");
        if (data.user.role !== "pendiente") {
          saveSessionUser(data.user);
          router.replace(postLoginPath(data.user.role));
        }
      } catch {
        // sigue en espera si la sesión todavía no tiene rol
      }
    };
    void check();
    const timer = setInterval(() => void check(), 8000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-3xl border border-border-subtle bg-surface p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
          La Ruta del Sabor
        </p>
        <h1 className="mt-3 font-display text-4xl font-black italic text-brand-600">
          En espera
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-foreground/70">
          Tu correo quedó registrado. El administrador tiene que asignarte un rol
          para entrar a pedidos o a cocina.
        </p>
        {email ? (
          <p className="mt-4 rounded-xl bg-background px-3 py-2 text-sm font-semibold">
            {email}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            clearSession();
            router.replace("/login");
          }}
          className="mt-6 text-sm text-foreground/55 underline"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
