"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { postLoginPath, readSession } from "@/lib/auth";

export function RequireStaff({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const session = readSession();
    if (!session?.user || session.user.role === "cliente") {
      router.replace("/login");
      return;
    }
    if (session.user.role === "pendiente") {
      router.replace("/esperando");
    }
  }, [router]);

  const session = typeof window === "undefined" ? null : readSession();
  if (!session?.user || session.user.role === "cliente" || session.user.role === "pendiente") {
    return (
      <p className="p-8 text-sm text-foreground/70">Comprobando sesión…</p>
    );
  }

  return children;
}
