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
  elapsedSince,
  formatElapsed,
  itemTimerStart,
  pendingUnits,
  type Order,
} from "@/features/orders/types";
import { cn } from "@/lib/utils";
import {
  addedItems,
  addedPhrase,
  announceNewOrder,
  crossedNudge,
  enableVoice,
  NUDGE_MINUTES,
  nudgeFallback,
  oldestPendingMinutes,
  pendingDishes,
  snapshotItems,
  speak,
  voiceEnabled,
  type ItemSnapshot,
} from "@/app/kds/announce";
import { useRouter } from "next/navigation";

const KDS_THEME_KEY = "kds-theme";

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

/** Platos que cocina aún debe preparar, restando las unidades ya marcadas. */
function kitchenTotals(orders: Order[]): { name: string; quantity: number }[] {
  const map = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      const left = pendingUnits(item);
      if (left > 0) map.set(item.name, (map.get(item.name) ?? 0) + left);
    }
  }
  return [...map.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, "es"));
}

function kitchenClock(now = new Date()): { time: string; period: string } {
  const parts = new Intl.DateTimeFormat("es-EC", {
    timeZone: "America/Guayaquil",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(now);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    time: `${pick("hour")}:${pick("minute")}`,
    period: pick("dayPeriod").replace(/\s+/g, "").toLowerCase(),
  };
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

function byArrival(a: Order, b: Order): number {
  return new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
}

function upsertOrder(list: Order[], order: Order): Order[] {
  const isActive = (ACTIVE_STATUSES as readonly string[]).includes(order.status);
  const without = list.filter((o) => o.id !== order.id);
  if (!isActive) return without;
  return [order, ...without].sort(byArrival);
}

function KdsBoard() {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);
  const user = readSession()?.user;
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [light, setLight] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [, forceTick] = useState(0);
  const ordersRef = useRef<Order[]>([]);
  const voiceOnRef = useRef(false);
  const seenRef = useRef<{
    primed: boolean;
    orders: Map<number, { items: ItemSnapshot; nudges: Set<number> }>;
  }>({ primed: false, orders: new Map() });
  ordersRef.current = orders;
  voiceOnRef.current = voiceOn;

  useEffect(() => {
    setVoiceOn(voiceEnabled());
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const seen = seenRef.current;
    if (!seen.primed) {
      for (const order of orders) {
        const nudges = new Set<number>();
        const minutes = oldestPendingMinutes(order);
        for (const level of NUDGE_MINUTES) {
          if (minutes >= level) nudges.add(level);
        }
        seen.orders.set(order.id, { items: snapshotItems(order), nudges });
      }
      seen.primed = true;
      return;
    }

    const currentIds = new Set(orders.map((order) => order.id));
    for (const id of seen.orders.keys()) {
      if (!currentIds.has(id)) seen.orders.delete(id);
    }

    if (!voiceOn) {
      for (const order of orders) {
        const previous = seen.orders.get(order.id);
        seen.orders.set(order.id, {
          items: snapshotItems(order),
          nudges: previous?.nudges ?? new Set(),
        });
      }
      return;
    }

    for (const order of orders) {
      const previous = seen.orders.get(order.id);
      if (!previous) {
        announceNewOrder(order);
        seen.orders.set(order.id, { items: snapshotItems(order), nudges: new Set() });
        continue;
      }
      const added = addedItems(previous.items, order);
      if (added.length > 0) speak(addedPhrase(added));
      seen.orders.set(order.id, { items: snapshotItems(order), nudges: previous.nudges });
    }
  }, [loaded, orders, voiceOn]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!voiceOnRef.current || !seenRef.current.primed) return;
      const now = Date.now();
      for (const order of ordersRef.current) {
        const tracked = seenRef.current.orders.get(order.id);
        if (!tracked) continue;
        const minutes = oldestPendingMinutes(order, now);
        const level = crossedNudge(minutes, tracked.nudges);
        if (!level) continue;
        for (const step of NUDGE_MINUTES) {
          if (step <= level) tracked.nudges.add(step);
        }
        const dishes = pendingDishes(order, level, now);
        if (dishes.length === 0) continue;
        const phrases = dishes.map((dish) => dish.phrase);
        void apiFetch<{ phrase: string }>("/api/kitchen/nudge", {
          method: "POST",
          body: JSON.stringify({ minutes: level, dishes: phrases }),
        })
          .then((data) => speak(data.phrase))
          .catch(() => speak(nudgeFallback(level, phrases)));
      }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
        [...data.orders].sort(byArrival),
      );
      setError(null);
      setLoaded(true);
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

  useEffect(() => {
    const heard = { after: null as number | null };
    const pull = async () => {
      try {
        const path =
          heard.after == null
            ? "/api/kitchen/calls"
            : `/api/kitchen/calls?after=${heard.after}`;
        const data = await apiFetch<{
          latest: number;
          calls: { id: number; phrase: string }[];
        }>(path);
        if (heard.after == null) {
          heard.after = data.latest;
          return;
        }
        for (const call of data.calls) {
          heard.after = call.id;
          if (voiceOnRef.current && call.phrase) speak(call.phrase);
        }
      } catch {
        // el siguiente ciclo vuelve a intentar
      }
    };
    void pull();
    const timer = setInterval(() => void pull(), 1500);
    return () => clearInterval(timer);
  }, []);

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
  const pendingTickets = orders.filter((order) =>
    order.items.some((item) => pendingUnits(item) > 0),
  ).length;

  const clock = kitchenClock();
  const headerBtn = light
    ? "border-ink/15 text-ink/70 hover:border-brand-500 hover:text-brand-600"
    : "border-cream/20 text-cream/80 hover:border-gold-400 hover:text-gold-400";

  return (
    <div
      ref={boardRef}
      className={cn(
        "flex h-screen flex-col overflow-hidden",
        light ? "bg-[#faf6ef] text-ink" : "bg-ink text-cream",
      )}
    >
      <header
        className={cn(
          "relative flex items-center justify-between border-b px-6 py-3",
          light ? "border-ink/10" : "border-cream/10",
        )}
      >
        <div className="shrink-0">
          <p className="font-display text-2xl font-black italic">Cocina · KDS</p>
          <p className={cn("text-xs", light ? "text-ink/55" : "text-cream/60")}>
            {user?.fullName}
          </p>
        </div>
        <p
          className="pointer-events-none absolute inset-x-0 flex items-baseline justify-center gap-3"
          aria-live="polite"
        >
          <span
            className={cn(
              "font-display text-6xl font-black tabular-nums leading-none tracking-tight sm:text-7xl",
              light ? "text-ink" : "text-cream",
            )}
          >
            {clock.time}
          </span>
          <span className="text-2xl font-bold uppercase tracking-wide text-gold-500">
            {clock.period}
          </span>
        </p>
        <div className="relative z-10 flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setVoiceOn(enableVoice())}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition",
              headerBtn,
              voiceOn && "border-emerald-500 text-emerald-600",
            )}
            aria-pressed={voiceOn}
          >
            {voiceOn ? "Voz activa" : "Activar voz"}
          </button>
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
      <div className="flex min-h-0 flex-1 flex-col p-4">
        {(() => {
          const tickets = orders
            .map((order) => ({
              order,
              items: order.items.flatMap((item) => {
                const quantity = pendingUnits(item);
                return quantity > 0 ? [{ ...item, quantity }] : [];
              }),
            }))
            .filter((row) => row.items.length > 0)
            .sort((a, b) => byArrival(a.order, b.order));
          return (
            <section
              className={cn(
                "flex min-h-0 flex-1 flex-col rounded-xl border p-4",
                light ? "border-red-200 bg-red-50" : "border-red-700/40 bg-red-950/40",
              )}
            >
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <h2 className="font-display text-3xl font-black italic tracking-wide">
                  Pendiente ({tickets.length})
                </h2>
                <p className={cn("text-xs", light ? "text-ink/55" : "text-cream/55")}>
                  De arriba hacia abajo. Llega primero quien pidió antes.
                </p>
              </div>
              {tickets.length === 0 ? (
                <p className={cn("text-sm", light ? "text-ink/40" : "text-cream/40")}>
                  Sin pedidos
                </p>
              ) : (
                <ul className="flex min-h-0 flex-1 flex-col flex-wrap content-start items-start gap-3 overflow-hidden">
                  {tickets.map(({ order, items }) => {
                    const wide = items.length > 7;
                    return (
                    <li
                      key={order.id}
                      className={cn(
                        "shrink-0 rounded-lg p-3 text-sm",
                        wide ? "w-[34rem]" : "w-72",
                        light ? "bg-white shadow-sm" : "bg-ink-soft",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-3xl font-black leading-none text-brand-600">
                            {order.table_number?.trim() ? `Mesa ${order.table_number.trim()}` : "Sin mesa"}
                          </p>
                          <p className={cn("mt-1 truncate text-xs", light ? "text-ink/40" : "text-cream/40")}>
                            {order.channel === "whatsapp" ? "WhatsApp" : "Salón"}
                          </p>
                        </div>
                      </div>
                      <ul
                        className={cn(
                          "mt-2 border-t pt-2",
                          wide ? "grid grid-cols-2 gap-x-4 gap-y-1" : "space-y-1",
                          light ? "border-ink/10" : "border-cream/10",
                        )}
                      >
                        {items.map((item) => {
                          const start = itemTimerStart(item, order);
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
                                  timerTone(minutes, light, false),
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
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })()}
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
