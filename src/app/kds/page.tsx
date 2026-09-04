"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Maximize2, Minimize2 } from "lucide-react";
import { API_URL, clearSession, readSession } from "@/lib/auth";
import { RequireStaff } from "@/features/staff/RequireStaff";
import { useRouter } from "next/navigation";

type OrderRow = {
  id: number;
  order_code: string;
  channel: string;
  status: string;
  table_number: string | null;
  received_at: string;
};

const COLUMNS: { status: string; label: string; className: string }[] = [
  {
    status: "recibido",
    label: "Nuevos",
    className: "border-red-700/40 bg-red-950/40",
  },
  {
    status: "en_preparacion",
    label: "En preparación",
    className: "border-amber-600/40 bg-amber-950/30",
  },
  {
    status: "listo",
    label: "Listos",
    className: "border-emerald-600/40 bg-emerald-950/30",
  },
];

function isFullscreen(): boolean {
  return Boolean(document.fullscreenElement);
}

async function enterFullscreen(el: HTMLElement) {
  const node = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };
  if (node.requestFullscreen) {
    await node.requestFullscreen();
    return;
  }
  await node.webkitRequestFullscreen?.();
}

async function exitFullscreen() {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>;
  };
  if (document.fullscreenElement && document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }
  await doc.webkitExitFullscreen?.();
}

function KdsBoard() {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);
  const user = readSession()?.user;
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setFullscreen(isFullscreen());
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  useEffect(() => {
    void fetch(`${API_URL}/api/orders`)
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los pedidos");
        const data = (await res.json()) as { orders: OrderRow[] };
        setOrders(data.orders);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error de red");
      });
  }, []);

  async function toggleFullscreen() {
    try {
      if (isFullscreen()) {
        await exitFullscreen();
        return;
      }
      if (boardRef.current) {
        await enterFullscreen(boardRef.current);
      }
    } catch {
      setError("El navegador bloqueó la pantalla completa. Prueba F11 o permite el permiso.");
    }
  }

  return (
    <div ref={boardRef} className="flex min-h-screen flex-col bg-ink text-cream">
      <header className="flex items-center justify-between border-b border-cream/10 px-6 py-4">
        <div>
          <p className="font-display text-2xl font-black italic">Cocina · KDS</p>
          <p className="text-xs text-cream/60">{user?.fullName}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex items-center gap-2 rounded-full border border-cream/20 px-3 py-1.5 text-cream/80 transition hover:border-gold-400 hover:text-gold-400"
            aria-pressed={fullscreen}
            title="Pantalla completa"
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
            {fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          </button>
          <Link href="/panel" className="text-gold-400 hover:underline">
            Panel
          </Link>
          <button
            type="button"
            className="text-cream/50 hover:text-cream"
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
          >
            Salir
          </button>
        </div>
      </header>
      {error ? <p className="px-6 py-4 text-red-300">{error}</p> : null}
      <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = orders.filter((o) => o.status === col.status);
          return (
            <section
              key={col.status}
              className={`rounded-xl border p-4 ${col.className}`}
            >
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">
                {col.label} ({items.length})
              </h2>
              {items.length === 0 ? (
                <p className="text-sm text-cream/40">Sin pedidos</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((order) => (
                    <li
                      key={order.id}
                      className="rounded-lg bg-ink-soft p-3 text-sm"
                    >
                      <p className="font-bold">{order.order_code}</p>
                      <p className="text-cream/70">
                        Mesa {order.table_number ?? "—"} · {order.channel}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function KdsPage() {
  return (
    <RequireStaff>
      <KdsBoard />
    </RequireStaff>
  );
}
