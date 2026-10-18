"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Plus, Trash2, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import {
  ACTIVE_STATUSES,
  dailyTicketNumber,
  formatElapsed,
  isItemDone,
  itemTimerStart,
  type Order,
  type OrderItem,
} from "@/features/orders/types";
import { NewOrderModal } from "@/features/orders/NewOrderModal";
import { cn } from "@/lib/utils";

const STATUS_BADGE = {
  recibido: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  listo:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

function isOrderReady(order: Order) {
  return order.items.length > 0 && order.items.every(isItemDone);
}

function MesaField({
  order,
  onSaved,
  onError,
}: {
  order: Order;
  onSaved: (order: Order) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(order.table_number ?? "");

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setValue(order.table_number ?? "");
    }
  }, [order.id, order.table_number]);

  async function save() {
    const next = value.trim();
    if (next === (order.table_number ?? "")) return;
    try {
      const data = await apiFetch<{ order: Order }>(`/api/orders/${order.id}`, {
        method: "PATCH",
        body: JSON.stringify({ table_number: next }),
      });
      onSaved(data.order);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo guardar la mesa");
    }
  }

  return (
    <label className="mt-1 flex items-center gap-2 text-foreground/60">
      <span>Mesa</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => void save()}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        name="mesa-pedido"
        inputMode="numeric"
        enterKeyHint="done"
        autoComplete="off"
        placeholder="número"
        aria-label="Número de mesa"
        className="w-16 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm text-foreground outline-none focus:border-brand-400 focus:bg-background"
      />
      <span>· ${Number(order.subtotal).toFixed(2)}</span>
    </label>
  );
}

function ItemNote({
  order,
  item,
  onSaved,
  onError,
}: {
  order: Order;
  item: OrderItem;
  onSaved: (order: Order) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(item.notes ?? "");

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setValue(item.notes ?? "");
    }
  }, [item.id, item.notes]);

  async function save() {
    const next = value.trim();
    if (next === (item.notes ?? "")) {
      setOpen(false);
      return;
    }
    try {
      const data = await apiFetch<{ order: Order }>(
        `/api/orders/${order.id}/items/${item.id}/notes`,
        { method: "PATCH", body: JSON.stringify({ notes: next }) },
      );
      onSaved(data.order);
      setOpen(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo guardar el detalle");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "mt-0.5 block text-left text-[11px] leading-tight",
          item.notes
            ? "italic text-foreground/55"
            : "text-foreground/35 hover:text-brand-700",
        )}
      >
        {item.notes || "Detalle"}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      autoFocus
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => void save()}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      placeholder="Sin ají, término medio…"
      aria-label={`Detalle de ${item.name}`}
      className="mt-1 w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-xs outline-none focus:border-brand-400"
    />
  );
}

function OrderCard({
  order,
  onToggleItem,
  onAdd,
  onCancel,
  onTable,
  onError,
  onCall,
  onRemoveItem,
}: {
  order: Order;
  onToggleItem: (order: Order, item: OrderItem, readyCount: number) => void;
  onAdd: (order: Order) => void;
  onCancel: (order: Order) => void;
  onTable: (order: Order) => void;
  onError: (message: string) => void;
  onCall: (order: Order) => void;
  onRemoveItem: (order: Order, item: OrderItem) => void;
}) {
  const ready = isOrderReady(order);
  return (
    <article className="rounded-xl border border-border-subtle bg-surface p-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="flex min-w-0 items-baseline gap-2">
          <span className="font-display text-2xl font-black tabular-nums leading-none text-brand-600">
            {dailyTicketNumber(order.order_code)}
          </span>
          <span className="truncate text-xs text-foreground/45">{order.order_code}</span>
        </p>
        <span className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onCall(order)}
            className="rounded-full p-1.5 text-foreground/35 hover:bg-brand-50 hover:text-brand-700"
            aria-label="Hacer que cocina escuche este pedido"
            title="Avisar a cocina"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onCancel(order)}
            className="rounded-full p-1.5 text-foreground/30 hover:bg-red-50 hover:text-red-600"
            aria-label="Eliminar pedido"
            title="Eliminar pedido"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              ready ? STATUS_BADGE.listo : STATUS_BADGE.recibido
            }`}
          >
            {ready ? "Listo" : "Pendiente"}
          </span>
        </span>
      </div>
      <MesaField order={order} onSaved={onTable} onError={onError} />
      <ul className="mt-3 space-y-2">
        {order.items.map((item) => {
          const done = isItemDone(item);
          const marked = item.ready_count ?? (done ? item.quantity : 0);
          const start = itemTimerStart(item, order);
          return (
            <li key={item.id} className="flex items-start gap-2">
              <span className="flex shrink-0 flex-nowrap gap-1">
                {Array.from({ length: item.quantity }, (_, index) => {
                  const checked = index < marked;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        onToggleItem(order, item, checked ? index : index + 1)
                      }
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-md border transition",
                        checked
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-border-subtle bg-background hover:border-brand-400",
                      )}
                      aria-pressed={checked}
                      aria-label={
                        checked
                          ? `Desmarcar ${item.name} ${index + 1} de ${item.quantity}`
                          : `Marcar ${item.name} ${index + 1} de ${item.quantity}`
                      }
                    >
                      {checked ? (
                        <Check className="h-4 w-4" strokeWidth={3} />
                      ) : null}
                    </button>
                  );
                })}
              </span>
              <span className={cn("min-w-0 flex-1", done && "text-foreground/45")}>
                <span className="flex items-center gap-1">
                  <span className={done ? "line-through" : undefined}>
                    {item.quantity}× {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(order, item)}
                    className="rounded-full p-0.5 text-foreground/30 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Quitar ${item.name}`}
                    title="Quitar este plato"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
                <ItemNote
                  order={order}
                  item={item}
                  onSaved={onTable}
                  onError={onError}
                />
              </span>
              <span
                className={cn(
                  "shrink-0 font-mono text-xs font-bold tabular-nums",
                  done ? "text-emerald-700" : "text-foreground/55",
                )}
              >
                {formatElapsed(start, item.ready_at)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onAdd(order)}
          className="inline-flex items-center gap-1 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-brand-700 hover:border-brand-400"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>
    </article>
  );
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [addingTo, setAddingTo] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiFetch<{ orders: Order[] }>("/api/orders?active=1");
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    }
  }, []);

  useEffect(() => {
    void loadOrders();
    const socket = getSocket();
    const refresh = () => void loadOrders();
    socket.on("order:new", refresh);
    socket.on("order:status", refresh);
    const poll = setInterval(refresh, 1500);
    return () => {
      clearInterval(poll);
      socket.off("order:new", refresh);
      socket.off("order:status", refresh);
    };
  }, [loadOrders]);

  async function toggleItem(order: Order, item: OrderItem, readyCount: number) {
    try {
      const data = await apiFetch<{ order: Order }>(
        `/api/orders/${order.id}/items/${item.id}`,
        { method: "PATCH", body: JSON.stringify({ ready_count: readyCount }) },
      );
      setOrders((prev) =>
        prev.map((row) => (row.id === data.order.id ? data.order : row)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo marcar el plato");
    }
  }

  async function removeItem(order: Order, item: OrderItem) {
    if (!window.confirm(`¿Quitar ${item.name} de esta comanda?`)) return;
    try {
      const data = await apiFetch<{ order: Order; empty: boolean }>(
        `/api/orders/${order.id}/items/${item.id}`,
        { method: "DELETE" },
      );
      if (data.empty) {
        setOrders((prev) => prev.filter((row) => row.id !== order.id));
        toast.success("Pedido eliminado", {
          description: "Era el único plato, así que se quitó la comanda.",
        });
      } else {
        setOrders((prev) =>
          prev.map((row) => (row.id === data.order.id ? data.order : row)),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar el plato");
    }
  }

  async function callKitchen(order: Order) {
    try {
      await apiFetch(`/api/orders/${order.id}/call`, { method: "POST" });
      toast.success("Cocina avisada", {
        description: `Mesa ${order.table_number ?? "sin número"}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo avisar a cocina");
    }
  }

  async function cancelOrder(order: Order) {
    const which = order.table_number
      ? `la mesa ${order.table_number}`
      : `el pedido ${dailyTicketNumber(order.order_code)}`;
    if (!window.confirm(`¿Eliminar ${which}? Se quita de pedidos y de cocina.`)) return;
    try {
      await apiFetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelado" }),
      });
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar");
    }
  }

  const activeOrders = orders.filter((o) =>
    (ACTIVE_STATUSES as readonly string[]).includes(o.status),
  );
  const byKitchenOrder = (a: Order, b: Order) =>
    new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
  const pendingOrders = activeOrders
    .filter((order) => !isOrderReady(order))
    .sort(byKitchenOrder);
  const readyOrders = activeOrders
    .filter((order) => isOrderReady(order))
    .sort(byKitchenOrder);

  function openAdd(order: Order) {
    setError(null);
    setOkMsg(null);
    setAddingTo(order);
    setModalOpen(true);
  }

  function renderGrid(list: Order[]) {
    if (list.length === 0) {
      return <p className="text-sm text-foreground/40">Ninguno por ahora.</p>;
    }
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onToggleItem={(current, item, readyCount) =>
              void toggleItem(current, item, readyCount)
            }
            onAdd={openAdd}
            onCancel={(current) => void cancelOrder(current)}
            onTable={(current) =>
              setOrders((prev) =>
                prev.map((row) => (row.id === current.id ? current : row)),
              )
            }
            onError={setError}
            onCall={(current) => void callKitchen(current)}
            onRemoveItem={(current, item) => void removeItem(current, item)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-24">
      <h1 className="font-display text-3xl font-black italic text-brand-600">
        Pedidos
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        Pulsa el check de cada plato cuando cocina lo pase. El cronómetro de ese plato se detiene ahí.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {okMsg ? (
        <p className="mt-4 rounded-lg bg-emerald-100 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          {okMsg}
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-red-600/80">
          Pendientes ({pendingOrders.length})
        </h2>
        {renderGrid(pendingOrders)}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-emerald-700/80">
          Listos ({readyOrders.length})
        </h2>
        {renderGrid(readyOrders)}
      </section>

      <button
        type="button"
        onClick={() => {
          setError(null);
          setOkMsg(null);
          setAddingTo(null);
          setModalOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-700"
        aria-label="Nueva comanda"
        title="Nueva comanda"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <NewOrderModal
        open={modalOpen}
        targetOrder={addingTo}
        onClose={() => {
          setModalOpen(false);
          setAddingTo(null);
        }}
        onSaved={(order) => {
          setModalOpen(false);
          setAddingTo(null);
          setOkMsg(
            addingTo
              ? `Platos agregados a ${order.order_code}.`
              : `Pedido ${order.order_code} enviado a cocina.`,
          );
          void loadOrders();
        }}
      />
    </div>
  );
}
