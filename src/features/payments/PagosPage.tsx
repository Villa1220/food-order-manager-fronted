"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Banknote, FileDown, Minus, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { downloadReceipt, type ReceiptPayment } from "@/features/payments/receipt";

type OpenOrder = {
  id: number;
  order_code: string;
  table_number: string | null;
  status: string;
  subtotal: string;
  paid_total: string;
  balance_due: string;
  received_at: string;
};

type BillItem = {
  id: number;
  name: string;
  quantity: number;
  unit_price: string;
  notes: string | null;
  paid_qty: number;
};

type ReceiptLine = {
  name: string;
  quantity: number;
  unit_price: string;
};

type Receipt = {
  id: number;
  receipt_number: string;
  amount: string;
  payment_method: "efectivo" | "transferencia";
  issued_at: string;
  lines: ReceiptLine[];
};

type Detail = {
  order: {
    id: number;
    order_code: string;
    table_number: string | null;
    subtotal: string;
    received_at: string;
  };
  items: BillItem[];
  receipts: Receipt[];
};

function money(value: string | number): string {
  return `$${Number(value).toFixed(2)}`;
}

function remaining(item: BillItem): number {
  return item.quantity - Number(item.paid_qty);
}

const CONTAINER_PRICE = 0.25;
const CONTAINER_NAME = "Contenedor para llevar";

type MenuDish = {
  id: number;
  name: string;
  price: string;
  available: boolean;
  category: string;
};

function isDessert(category: string): boolean {
  return /postre/i.test(category);
}

function dessertFirst(a: MenuDish, b: MenuDish): number {
  const rank = Number(isDessert(a.category)) - Number(isDessert(b.category));
  if (rank !== 0) return -rank;
  return a.name.localeCompare(b.name, "es");
}

export default function PagosPage() {
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [draft, setDraft] = useState<Record<number, number>>({});
  const [containers, setContainers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adderOpen, setAdderOpen] = useState(false);
  const [menu, setMenu] = useState<MenuDish[]>([]);
  const [menuReady, setMenuReady] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const searchCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadOrders = useCallback(async () => {
    const data = await apiFetch<{ orders: OpenOrder[] }>("/api/payments/open", {
      cache: "no-store",
    });
    setOrders(data.orders);
    return data.orders;
  }, []);

  const loadDetail = useCallback(async (orderId: number, keepDraft = false) => {
    const data = await apiFetch<Detail>(`/api/payments/orders/${orderId}`, {
      cache: "no-store",
    });
    setDetail(data);
    if (keepDraft) {
      setDraft((current) => {
        const next: Record<number, number> = {};
        for (const item of data.items) {
          const left = item.quantity - Number(item.paid_qty);
          const chosen = current[item.id] ?? 0;
          if (chosen > 0 && left > 0) next[item.id] = Math.min(chosen, left);
        }
        return next;
      });
      return;
    }
    setDraft({});
    setContainers(0);
  }, []);

  useEffect(() => {
    void loadOrders()
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "No se pudieron cargar los pagos"),
      )
      .finally(() => setLoading(false));
  }, [loadOrders]);

  async function openOrder(orderId: number) {
    setSelectedId(orderId);
    setAdderOpen(false);
    setMenuQuery("");
    setMenuOpen(false);
    setError(null);
    try {
      await loadDetail(orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el pedido");
    }
  }

  async function openAdder() {
    setAdderOpen((open) => !open);
    if (menuReady) return;
    try {
      const data = await apiFetch<{
        categories: { name: string; items: Omit<MenuDish, "category">[] }[];
      }>("/api/menu", { cache: "no-store" });
      const dishes = data.categories.flatMap((category) =>
        (category.items ?? [])
          .filter((item) => item.available)
          .map((item) => ({ ...item, category: category.name })),
      );
      setMenu(dishes.sort(dessertFirst));
      setMenuReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el menú");
    }
  }

  async function addDish(dish: MenuDish, quantity: number) {
    if (!detail || addingId != null) return;
    const count = Math.min(20, Math.max(1, quantity));
    setAddingId(dish.id);
    setError(null);
    try {
      await apiFetch(`/api/orders/${detail.order.id}/items`, {
        method: "POST",
        body: JSON.stringify({ items: [{ menu_item_id: dish.id, quantity: count }] }),
      });
      await loadOrders();
      await loadDetail(detail.order.id, true);
      setMenuOpen(false);
      toast.success("Plato agregado", { description: `${count} × ${dish.name}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar el plato");
    } finally {
      setAddingId(null);
    }
  }

  function setQty(item: BillItem, next: number) {
    const cap = remaining(item);
    const quantity = Math.min(cap, Math.max(0, next));
    setDraft((current) => ({ ...current, [item.id]: quantity }));
  }

  function takeAll() {
    if (!detail) return;
    const next: Record<number, number> = {};
    for (const item of detail.items) {
      const left = remaining(item);
      if (left > 0) next[item.id] = left;
    }
    setDraft(next);
  }

  const draftLines =
    detail?.items.flatMap((item) => {
      const quantity = draft[item.id] ?? 0;
      if (quantity < 1) return [];
      return [{ item, quantity, total: Number(item.unit_price) * quantity }];
    }) ?? [];
  const containerTotal = containers * CONTAINER_PRICE;
  const draftTotal = draftLines.reduce((sum, line) => sum + line.total, 0) + containerTotal;
  const canCharge = draftLines.length > 0 || containers > 0;
  const menuNeedle = menuQuery.trim().toLocaleLowerCase("es");
  const visibleMenu = menu.filter((dish) =>
    menuNeedle ? dish.name.toLocaleLowerCase("es").includes(menuNeedle) : true,
  );
  const dessertMenu = visibleMenu.filter((dish) => isDessert(dish.category));
  const otherMenu = visibleMenu.filter((dish) => !isDessert(dish.category));

  async function charge(method: "efectivo" | "transferencia") {
    if (!detail || !canCharge) return;
    setPaying(true);
    setError(null);
    try {
      const saved = await apiFetch<{ payment: ReceiptPayment }>("/api/payments", {
        method: "POST",
        body: JSON.stringify({
          order_id: detail.order.id,
          payment_method: method,
          lines: draftLines.map((line) => ({
            order_item_id: line.item.id,
            quantity: line.quantity,
          })),
          container_count: containers,
        }),
      });
      downloadReceipt(saved.payment);
      toast.success("Cuenta cobrada", {
        description: `${saved.payment.receipt_number} · ${money(saved.payment.amount)}`,
      });
      const open = await loadOrders();
      if (open.some((order) => order.id === detail.order.id)) {
        await loadDetail(detail.order.id);
      } else {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cobrar");
    } finally {
      setPaying(false);
    }
  }

  function reprint(receipt: Receipt) {
    if (!detail) return;
    downloadReceipt({
      ...receipt,
      order_code: detail.order.order_code,
      table_number: detail.order.table_number,
    });
  }

  return (
    <div className="pb-24">
      <h1 className="font-display text-4xl font-black italic text-brand-600">Pagos</h1>
      <p className="mt-1 max-w-xl text-sm text-foreground/60">
        Separa la cuenta por platos, suma contenedores para llevar si hace falta
        y cobra en efectivo o transferencia. El recibo se descarga en PDF. Los
        precios ya incluyen IVA.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground/50">
            Por cobrar
          </h2>
          {loading ? (
            <p className="text-sm text-foreground/50">Cargando pedidos…</p>
          ) : orders.length === 0 ? (
            <p className="rounded-xl border border-border-subtle bg-surface p-4 text-sm text-foreground/60">
              No hay cuentas pendientes.
            </p>
          ) : (
            <ul className="space-y-2">
              {orders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => void openOrder(order.id)}
                    className={cn(
                      "w-full rounded-xl border bg-surface p-3 text-left",
                      selectedId === order.id
                        ? "border-brand-500"
                        : "border-border-subtle hover:border-brand-300",
                    )}
                  >
                    <p className="font-semibold">
                      Mesa {order.table_number ?? "—"}
                    </p>
                    <p className="text-xs text-foreground/50">{order.order_code}</p>
                    <p className="mt-1 text-sm">
                      Pendiente{" "}
                      <span className="font-bold text-brand-700">
                        {money(order.balance_due)}
                      </span>
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          {!detail ? (
            <p className="rounded-xl border border-dashed border-border-subtle p-8 text-sm text-foreground/50">
              Elige un pedido para armar la cuenta.
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-border-subtle bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-black italic text-brand-600">
                      Mesa {detail.order.table_number ?? "—"}
                    </h2>
                    <p className="text-xs text-foreground/50">{detail.order.order_code}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void openAdder()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={takeAll}
                      className="text-xs font-semibold text-brand-700"
                    >
                      Toda la cuenta
                    </button>
                  </div>
                </div>
                {adderOpen ? (
                  <div className="mt-4 rounded-xl border border-border-subtle bg-background p-3">
                    <label className="relative block">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
                      <input
                        value={menuQuery}
                        onChange={(event) => {
                          setMenuQuery(event.target.value);
                          setMenuOpen(true);
                        }}
                        onFocus={() => {
                          if (searchCloseTimer.current) {
                            clearTimeout(searchCloseTimer.current);
                            searchCloseTimer.current = null;
                          }
                          setMenuOpen(true);
                        }}
                        onBlur={() => {
                          if (searchCloseTimer.current) clearTimeout(searchCloseTimer.current);
                          searchCloseTimer.current = setTimeout(() => {
                            searchCloseTimer.current = null;
                            setMenuOpen(false);
                          }, 200);
                        }}
                        placeholder="Buscar plato"
                        className="w-full rounded-lg border border-border-subtle bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400"
                      />
                    </label>
                    {menuOpen ? (
                    <div className="mt-2 max-h-72 space-y-3 overflow-y-auto">
                      {menuReady ? (
                        visibleMenu.length === 0 ? (
                          <p className="px-1 py-2 text-sm text-foreground/50">
                            Ningún plato coincide.
                          </p>
                        ) : (
                          <>
                            <DishChoices
                              title="Postres"
                              dishes={dessertMenu}
                              addingId={addingId}
                              onAdd={(dish, quantity) => void addDish(dish, quantity)}
                            />
                            <DishChoices
                              title="Otros platos"
                              dishes={otherMenu}
                              addingId={addingId}
                              onAdd={(dish, quantity) => void addDish(dish, quantity)}
                            />
                          </>
                        )
                      ) : (
                        <p className="px-1 py-2 text-sm text-foreground/50">Cargando menú…</p>
                      )}
                    </div>
                    ) : null}
                  </div>
                ) : null}
                <ul className="mt-4 space-y-3">
                  {detail.items.filter((item) => remaining(item) > 0).length === 0 ? (
                    <li className="text-sm text-foreground/50">Nada pendiente por cobrar.</li>
                  ) : null}
                  {detail.items.filter((item) => remaining(item) > 0).map((item) => {
                    const left = remaining(item);
                    const chosen = draft[item.id] ?? 0;
                    return (
                      <li key={item.id} className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-foreground/50">
                            {money(item.unit_price)} · {left} por cobrar
                            {Number(item.paid_qty) > 0
                              ? ` · ${item.paid_qty} ya en otra cuenta`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setQty(item, chosen - 1)}
                            disabled={chosen < 1}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle disabled:opacity-30"
                            aria-label="Quitar uno"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{chosen}</span>
                          <button
                            type="button"
                            onClick={() => setQty(item, chosen + 1)}
                            disabled={chosen >= left}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle disabled:opacity-30"
                            aria-label="Agregar uno"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 flex items-center gap-3 border-t border-border-subtle pt-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{CONTAINER_NAME}</p>
                    <p className="text-xs text-foreground/50">
                      {money(CONTAINER_PRICE)} cada uno
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setContainers((count) => Math.max(0, count - 1))}
                      disabled={containers < 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle disabled:opacity-30"
                      aria-label="Quitar un contenedor"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{containers}</span>
                    <button
                      type="button"
                      onClick={() => setContainers((count) => Math.min(40, count + 1))}
                      disabled={containers >= 40}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle disabled:opacity-30"
                      aria-label="Agregar un contenedor"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col rounded-2xl border border-border-subtle bg-surface p-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground/50">
                  Esta cuenta
                </h3>
                {!canCharge ? (
                  <p className="mt-3 text-sm text-foreground/50">
                    Suma platos con + o usa «Toda la cuenta». Los contenedores se
                    agregan aparte.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {draftLines.map((line) => (
                      <li key={line.item.id} className="flex justify-between gap-3">
                        <span>
                          {line.quantity} × {line.item.name}
                        </span>
                        <span>{money(line.total)}</span>
                      </li>
                    ))}
                    {containers > 0 ? (
                      <li className="flex justify-between gap-3">
                        <span>
                          {containers} × {CONTAINER_NAME}
                        </span>
                        <span>{money(containerTotal)}</span>
                      </li>
                    ) : null}
                  </ul>
                )}
                <div className="mt-4 border-t border-border-subtle pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{money(draftTotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/50">IVA incluido</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={paying || !canCharge}
                    onClick={() => void charge("efectivo")}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <Banknote className="h-4 w-4" />
                    Efectivo
                  </button>
                  <button
                    type="button"
                    disabled={paying || !canCharge}
                    onClick={() => void charge("transferencia")}
                    className="rounded-lg border border-brand-600 px-3 py-2 text-sm font-semibold text-brand-700 disabled:opacity-40"
                  >
                    Transferencia
                  </button>
                </div>

                {detail.receipts.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-foreground/50">
                      Cuentas cobradas
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {detail.receipts.map((receipt) => (
                        <li
                          key={receipt.id}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span>
                            {receipt.receipt_number} ·{" "}
                            {receipt.payment_method === "efectivo"
                              ? "Efectivo"
                              : "Transferencia"}{" "}
                            · {money(receipt.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => reprint(receipt)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                            PDF
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DishChoices({
  title,
  dishes,
  addingId,
  onAdd,
}: {
  title: string;
  dishes: MenuDish[];
  addingId: number | null;
  onAdd: (dish: MenuDish, quantity: number) => void;
}) {
  const [counts, setCounts] = useState<Record<number, number>>({});
  if (dishes.length === 0) return null;

  function quantityOf(id: number): number {
    return counts[id] ?? 1;
  }

  function changeQuantity(id: number, next: number) {
    setCounts((current) => ({ ...current, [id]: Math.min(20, Math.max(1, next)) }));
  }

  return (
    <div>
      <p className="px-1 text-xs font-bold uppercase tracking-wide text-foreground/45">{title}</p>
      <ul className="mt-1">
        {dishes.map((dish) => {
          const quantity = quantityOf(dish.id);
          return (
            <li key={dish.id} className="px-1 py-2">
              <p className="truncate text-sm font-medium">{dish.name}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-foreground/50">{money(dish.price)}</span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={addingId != null || quantity <= 1}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => changeQuantity(dish.id, quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border-subtle disabled:opacity-30"
                    aria-label="Bajar cantidad"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">{quantity}</span>
                  <button
                    type="button"
                    disabled={addingId != null || quantity >= 20}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => changeQuantity(dish.id, quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border-subtle disabled:opacity-30"
                    aria-label="Subir cantidad"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={addingId != null}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => onAdd(dish, quantity)}
                    className="ml-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
                  >
                    Agregar
                  </button>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
