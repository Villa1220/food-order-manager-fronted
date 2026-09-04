"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { readSession } from "@/lib/auth";

export function RequireStaff({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const session = readSession();
    if (!session?.user || session.user.role === "cliente") {
      router.replace("/login");
    }
  }, [router]);

  const session = typeof window === "undefined" ? null : readSession();
  if (!session?.user || session.user.role === "cliente") {
    return (
      <p className="p-8 text-sm text-foreground/70">Comprobando sesión…</p>
    );
  }

  return children;
}
