"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Maximize2, Minimize2, Moon, Sun } from "lucide-react";
import { clearSession, readSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { RequireStaff } from "@/features/staff/RequireStaff";
import {
  ACTIVE_STATUSES,
  doneItems,
  elapsedSince,
  formatElapsed,
  itemTimerStart,
  pendingItems,
  type Order,
} from "@/features/orders/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const KDS_THEME_KEY = "kds-theme";

const COLUMNS: {
  key: "pendiente" | "listo";
  label: string;
  darkClass: string;
  lightClass: string;
}[] = [
  {
    key: "pendiente",
    label: "Pendiente",
    darkClass: "border-red-700/40 bg-red-950/40",
    lightClass: "border-red-200 bg-red-50",
  },
  {
    key: "listo",
    label: "Listo",
    darkClass: "border-emerald-600/40 bg-emerald-950/30",
    lightClass: "border-emerald-200 bg-emerald-50",
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

/** Platos que cocina aún debe preparar (sin visto del mesero). */
function kitchenTotals(orders: Order[]): { name: string; quantity: number }[] {
  const map = new Map<string, number>();
  for (const order of orders) {
    for (const item of pendingItems(order)) {
      map.set(item.name, (map.get(item.name) ?? 0) + item.quantity);
    }
  }
  return [...map.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, "es"));
}

function timerTone(minutes: number, light: boolean, stopped: boolean) {
  if (stopped) {
    return light ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/20 text-emerald-300";
  }
  if (minutes >= 15) {
    return light ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-300";
  }
  if (minutes >= 8) {
    return light ? "bg-amber-100 text-amber-800" : "bg-amber-500/20 text-amber-300";
  }
  return light ? "bg-ink/5 text-ink/55" : "bg-cream/10 text-cream/60";
}

function upsertOrder(list: Order[], order: Order): Order[] {
  const isActive = (ACTIVE_STATUSES as readonly string[]).includes(order.status);
  const without = list.filter((o) => o.id !== order.id);
  if (!isActive) return without;
  return [order, ...without].sort(
    (a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime(),
  );
}

function KdsBoard() {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);
  const user = readSession()?.user;
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [light, setLight] = useState(false);
  const [, forceTick] = useState(0);

  useEffect(() => {
    try {
      setLight(localStorage.getItem(KDS_THEME_KEY) === "light");
    } catch {
      // sin persistencia el tablero sigue en oscuro
    }
  }, []);

  // El reloj de cada comanda avanza cada segundo.
  useEffect(() => {
    const timer = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const sync = () => setFullscreen(isFullscreen());
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiFetch<{ orders: Order[] }>("/api/orders?active=1");
      setOrders(
        [...data.orders].sort(
          (a, b) =>
            new Date(a.received_at).getTime() - new Date(b.received_at).getTime(),
        ),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    }
  }, []);

  // Carga inicial + suscripción en tiempo real.
  useEffect(() => {
    void loadOrders();
    const socket = getSocket();
    const onOrder = (order: Order) => {
      setOrders((prev) => upsertOrder(prev, order));
    };
    socket.on("order:new", onOrder);
    socket.on("order:status", onOrder);
    socket.on("connect", () => void loadOrders()); // re-sincroniza tras reconexión
    // En Vercel el socket no cruza hasta el HTTP del VPS. La pantalla de
    // cocina igual se entera de un pedido tomado en el celular.
    const poll = setInterval(() => void loadOrders(), 1500);
    return () => {
      clearInterval(poll);
      socket.off("order:new", onOrder);
      socket.off("order:status", onOrder);
    };
  }, [loadOrders]);

  function toggleLight() {
    const next = !light;
    setLight(next);
    try {
      localStorage.setItem(KDS_THEME_KEY, next ? "light" : "dark");
    } catch {
      // el cambio aplica igual en esta sesión
    }
  }

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

  const pending = useMemo(() => kitchenTotals(orders), [orders]);
  const pendingPlates = pending.reduce((sum, row) => sum + row.quantity, 0);
  const pendingTickets = orders.filter((o) => pendingItems(o).length > 0).length;

  const headerBtn = light
    ? "border-ink/15 text-ink/70 hover:border-brand-500 hover:text-brand-600"
    : "border-cream/20 text-cream/80 hover:border-gold-400 hover:text-gold-400";

  return (
    <div
      ref={boardRef}
      className={cn(
        "flex min-h-screen flex-col",
        light ? "bg-[#faf6ef] text-ink" : "bg-ink text-cream",
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between border-b px-6 py-4",
          light ? "border-ink/10" : "border-cream/10",
        )}
      >
        <div>
          <p className="font-display text-2xl font-black italic">Cocina · KDS</p>
          <p className={cn("text-xs", light ? "text-ink/55" : "text-cream/60")}>
            {user?.fullName}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition",
              headerBtn,
            )}
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
          <button
            type="button"
            onClick={toggleLight}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition",
              headerBtn,
            )}
            aria-pressed={light}
            title={light ? "Cambiar a fondo oscuro" : "Cambiar a fondo claro"}
          >
            {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {light ? "Fondo oscuro" : "Fondo claro"}
          </button>
          <Link href="/panel" className="text-gold-500 hover:underline">
            Panel
          </Link>
          <button
            type="button"
            className={cn(light ? "text-ink/45 hover:text-ink" : "text-cream/50 hover:text-cream")}
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
          >
            Salir
          </button>
        </div>
      </header>
      {error ? (
        <p className={cn("px-6 py-4", light ? "text-red-700" : "text-red-300")}>
          {error}
        </p>
      ) : null}

      <section
        className={cn(
          "sticky top-0 z-20 border-b px-4 py-3 md:px-6",
          light ? "border-ink/10 bg-[#faf6ef]" : "border-cream/10 bg-ink",
        )}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-xs font-bold uppercase tracking-wide text-gold-500">
            Por despachar
          </p>
          <p className="font-display text-2xl font-black italic tabular-nums">
            {pendingPlates}
            <span className="ml-2 text-sm font-sans font-semibold not-italic opacity-60">
              {pendingPlates === 1 ? "plato" : "platos"} · {pendingTickets}{" "}
              {pendingTickets === 1 ? "comanda" : "comandas"}
            </span>
          </p>
        </div>
        {pending.length === 0 ? (
          <p className={cn("mt-2 text-sm", light ? "text-ink/40" : "text-cream/40")}>
            Nada pendiente de preparar.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {pending.map((row) => (
              <li
                key={row.name}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
                  light ? "bg-white shadow-sm" : "bg-ink-soft",
                )}
              >
                <span className="font-mono text-lg font-black tabular-nums text-brand-600">
                  {row.quantity}×
                </span>
                <span className="font-medium">{row.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2">
        {COLUMNS.map((col) => {
          const tickets = orders
            .map((order) => ({
              order,
              items: col.key === "pendiente" ? pendingItems(order) : doneItems(order),
            }))
            .filter((row) => row.items.length > 0);
          return (
            <section
              key={col.key}
              className={cn(
                "rounded-xl border p-4",
                light ? col.lightClass : col.darkClass,
              )}
            >
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">
                {col.label} ({tickets.length})
              </h2>
              {tickets.length === 0 ? (
                <p className={cn("text-sm", light ? "text-ink/40" : "text-cream/40")}>
                  Sin pedidos
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {tickets.map(({ order, items }) => (
                    <li
                      key={`${col.key}-${order.id}`}
                      className={cn(
                        "rounded-lg p-3 text-sm",
                        light ? "bg-white shadow-sm" : "bg-ink-soft",
                      )}
                    >
                      <div>
                        <p className="font-bold">{order.order_code}</p>
                        <p className={cn(light ? "text-ink/65" : "text-cream/70")}>
                          Mesa {order.table_number ?? "—"} · {order.channel}
                        </p>
                      </div>
                      <ul
                        className={cn(
                          "mt-2 space-y-2 border-t pt-2",
                          light ? "border-ink/10" : "border-cream/10",
                        )}
                      >
                        {items.map((item) => {
                          const start = itemTimerStart(item, order);
                          const stopped = Boolean(item.ready_at);
                          const { minutes } = elapsedSince(start, item.ready_at);
                          return (
                            <li
                              key={item.id}
                              className="flex items-start justify-between gap-2"
                            >
                              <span>
                                <span className="font-semibold">{item.quantity}×</span>{" "}
                                {item.name}
                                {item.notes ? (
                                  <span className="block text-xs italic text-brand-600">
                                    {item.notes}
                                  </span>
                                ) : null}
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-2 py-0.5 font-mono text-xs font-bold tabular-nums",
                                  timerTone(minutes, light, stopped),
                                )}
                              >
                                {formatElapsed(start, item.ready_at)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {order.customer_note ? (
                        <p
                          className={cn(
                            "mt-2 text-xs italic",
                            light ? "text-ink/55" : "text-cream/60",
                          )}
                        >
                          Nota: {order.customer_note}
                        </p>
                      ) : null}
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
