"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  UtensilsCrossed,
  Users,
  Wallet,
} from "lucide-react";
import { clearSession } from "@/lib/auth";
import { useSession } from "@/lib/useSession";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "staff-sidebar";

const LINKS: {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}[] = [
  { href: "/panel", label: "Inicio", icon: LayoutDashboard, adminOnly: true },
  { href: "/kds", label: "Cocina (KDS)", icon: ChefHat },
  { href: "/panel/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/panel/menu", label: "Menú", icon: UtensilsCrossed, adminOnly: true },
  { href: "/panel/meseros", label: "Meseros", icon: Users, adminOnly: true },
  { href: "/panel/pagos", label: "Pagos", icon: Wallet },
];

function isActive(pathname: string, href: string) {
  if (href === "/panel") return pathname === "/panel";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSession();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(SIDEBAR_KEY) === "hidden");
    } catch {
      // sin persistencia el menú sigue visible
    }
  }, []);

  function toggleSidebar() {
    const next = !hidden;
    setHidden(next);
    try {
      localStorage.setItem(SIDEBAR_KEY, next ? "hidden" : "open");
    } catch {
      // el cambio aplica igual en esta sesión
    }
  }

  const links = LINKS.filter(
    (link) => !link.adminOnly || user?.role === "admin",
  );

  return (
    <div className="flex min-h-screen bg-background">
      {hidden ? null : (
        <aside className="relative flex w-64 shrink-0 flex-col border-r border-border-subtle bg-surface">
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-3 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface text-foreground/70 shadow-sm transition hover:border-brand-400 hover:text-brand-600"
            title="Ocultar menú"
            aria-label="Ocultar menú"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center border-b border-border-subtle px-5 py-6 text-center">
            <p className="font-display text-lg font-black italic leading-tight text-brand-600">
              La Ruta del Sabor
            </p>
            <p className="mt-3 truncate text-sm font-medium text-foreground">
              {user?.fullName ?? "…"}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="La Ruta del Sabor"
              className="mt-3 h-16 w-16 rounded-full object-cover ring-2 ring-gold-400/50"
            />
            <span className="mt-3 rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              {user?.role}
            </span>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-3">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                      : "text-foreground/70 hover:bg-brand-50/70 hover:text-brand-600",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-brand-600" : "text-foreground/45",
                    )}
                  />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border-subtle p-3">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground/60 transition hover:bg-brand-50 hover:text-brand-700"
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>
      )}

      <main
        className={cn(
          "relative min-w-0 flex-1 p-8 md:p-10",
          hidden && "pt-16",
        )}
      >
        {hidden ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface text-foreground/70 shadow-sm transition hover:border-brand-400 hover:text-brand-600"
            title="Mostrar menú"
            aria-label="Mostrar menú"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        ) : null}
        {children}
      </main>
    </div>
  );
}
