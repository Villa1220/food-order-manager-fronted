"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import {
  ACTIVE_STATUSES,
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

function OrderCard({
  order,
  onToggleItem,
  onAdd,
  onCancel,
}: {
  order: Order;
  onToggleItem: (order: Order, item: OrderItem) => void;
  onAdd: (order: Order) => void;
  onCancel: (order: Order) => void;
}) {
  const ready = isOrderReady(order);
  return (
    <article className="rounded-xl border border-border-subtle bg-surface p-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold">{order.order_code}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            ready ? STATUS_BADGE.listo : STATUS_BADGE.recibido
          }`}
        >
          {ready ? "Listo" : "Pendiente"}
        </span>
      </div>
      <p className="mt-1 text-foreground/60">
        Mesa {order.table_number ?? "—"} · ${Number(order.subtotal).toFixed(2)}
      </p>
      <ul className="mt-3 space-y-2">
        {order.items.map((item) => {
          const done = isItemDone(item);
          const start = itemTimerStart(item, order);
          return (
            <li key={item.id} className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => onToggleItem(order, item)}
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition",
                  done
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border-subtle bg-background hover:border-brand-400",
                )}
                aria-pressed={done}
                aria-label={
                  done
                    ? `Desmarcar ${item.name}`
                    : `Marcar ${item.name} como salido`
                }
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
              </button>
              <span className={cn("min-w-0 flex-1", done && "text-foreground/45")}>
                <span className={done ? "line-through" : undefined}>
                  {item.quantity}× {item.name}
                </span>
                {item.notes ? (
                  <span className="block text-xs italic text-foreground/50">
                    {item.notes}
                  </span>
                ) : null}
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
        <button
          type="button"
          onClick={() => onCancel(order)}
          className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-foreground/60 hover:border-red-400 hover:text-red-500"
        >
          Cancelar
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
    return () => {
      socket.off("order:new", refresh);
      socket.off("order:status", refresh);
    };
  }, [loadOrders]);

  async function toggleItem(order: Order, item: OrderItem) {
    const next = isItemDone(item) ? "pendiente" : "listo";
    try {
      const data = await apiFetch<{ order: Order }>(
        `/api/orders/${order.id}/items/${item.id}`,
        { method: "PATCH", body: JSON.stringify({ status: next }) },
      );
      setOrders((prev) =>
        prev.map((row) => (row.id === data.order.id ? data.order : row)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo marcar el plato");
    }
  }

  async function cancelOrder(order: Order) {
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
  const pendingOrders = activeOrders.filter((order) => !isOrderReady(order));
  const readyOrders = activeOrders.filter((order) => isOrderReady(order));

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
            onToggleItem={(current, item) => void toggleItem(current, item)}
            onAdd={openAdd}
            onCancel={(current) => void cancelOrder(current)}
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
