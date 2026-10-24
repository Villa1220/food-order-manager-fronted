"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, Search, Send, Trash2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Order } from "@/features/orders/types";

export type SearchableItem = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  available: boolean;
  category: string;
};

type CartLine = { item: SearchableItem; quantity: number; notes: string };

type Props = {
  open: boolean;
  targetOrder?: Order | null;
  onClose: () => void;
  onSaved: (order: Order) => void;
};

export function NewOrderModal({ open, targetOrder, onClose, onSaved }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const searchCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [results, setResults] = useState<SearchableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addingTo = targetOrder ?? null;
  const isAdd = Boolean(addingTo);

  useEffect(() => {
    if (!open) return;
    setTableNumber(addingTo?.table_number ?? "");
    setSearchOpen(false);
  }, [open, addingTo?.id, addingTo?.table_number]);

  useEffect(() => {
    if (!open) {
      setKeyboardInset(0);
      return;
    }
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardInset(covered > 80 ? covered : 0);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const path = query.trim()
        ? `/api/menu/items?q=${encodeURIComponent(query.trim())}`
        : "/api/menu/items";
      void apiFetch<{ items: SearchableItem[] }>(path)
        .then((data) => {
          if (!controller.signal.aborted) setResults(data.items);
        })
        .catch((err: unknown) => {
          if (!controller.signal.aborted) {
            setError(err instanceof Error ? err.message : "No se pudo buscar");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 220);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, query]);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + Number(line.item.price) * line.quantity, 0),
    [cart],
  );

  function openSearch() {
    if (searchCloseTimer.current) {
      clearTimeout(searchCloseTimer.current);
      searchCloseTimer.current = null;
    }
    setSearchOpen(true);
  }

  function closeSearchSoon() {
    if (searchCloseTimer.current) clearTimeout(searchCloseTimer.current);
    searchCloseTimer.current = setTimeout(() => {
      searchCloseTimer.current = null;
      if (document.activeElement !== searchRef.current) setSearchOpen(false);
    }, 200);
  }

  function reset() {
    if (searchCloseTimer.current) clearTimeout(searchCloseTimer.current);
    setQuery("");
    setSearchOpen(false);
    setCart([]);
    setTableNumber("");
    setError(null);
    setSending(false);
  }

  function close() {
    reset();
    onClose();
  }

  function addToCart(item: SearchableItem) {
    if (!item.available) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { item, quantity: 1, notes: "" }];
    });
    setQuery("");
    setSearchOpen(false);
  }

  function changeQty(itemId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.item.id === itemId ? { ...l, quantity: l.quantity + delta } : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }

  function setLineNotes(itemId: number, notes: string) {
    setCart((prev) =>
      prev.map((l) => (l.item.id === itemId ? { ...l, notes } : l)),
    );
  }

  async function submitOrder() {
    if (cart.length === 0) return;
    setSending(true);
    setError(null);
    const payload = {
      table_number: tableNumber,
      items: cart.map((l) => ({
        menu_item_id: l.item.id,
        quantity: l.quantity,
        notes: l.notes.trim() || undefined,
      })),
    };
    try {
      const data = addingTo
        ? await apiFetch<{ order: Order }>(`/api/orders/${addingTo.id}/items`, {
            method: "POST",
            body: JSON.stringify({ items: payload.items }),
          })
        : await apiFetch<{ order: Order }>("/api/orders", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      if (addingTo && tableNumber.trim() !== (addingTo.table_number ?? "")) {
        const patched = await apiFetch<{ order: Order }>(`/api/orders/${addingTo.id}`, {
          method: "PATCH",
          body: JSON.stringify({ table_number: tableNumber.trim() }),
        });
        data.order = patched.order;
      }
      reset();
      onSaved(data.order);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isAdd
            ? "No se pudo agregar al pedido"
            : "No se pudo crear el pedido",
      );
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Cerrar"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-order-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl"
        style={
          keyboardInset > 0
            ? {
                marginBottom: keyboardInset,
                maxHeight: `calc(100dvh - ${keyboardInset + 12}px)`,
              }
            : undefined
        }
      >
        <header className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2
            id="new-order-title"
            className="font-display text-xl font-black italic text-brand-600"
          >
            {isAdd ? `Agregar a ${addingTo?.order_code}` : "Nueva comanda"}
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-full p-2 text-foreground/50 hover:bg-brand-50 hover:text-brand-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
          {error ? (
            <p className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <label className="mb-4 block shrink-0 text-sm">
              <span className="mb-1 block text-foreground/60">Mesa</span>
              <input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                onFocus={(event) => {
                  window.setTimeout(() => {
                    event.target.scrollIntoView({ block: "center" });
                  }, 280);
                }}
                name="mesa"
                inputMode="numeric"
                enterKeyHint="done"
                autoComplete="off"
                placeholder="Ej. 4"
                className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2"
            />
          </label>

          <label className="relative block shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              ref={searchRef}
              type="search"
              enterKeyHint="search"
              name="buscar-plato"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                openSearch();
              }}
              onFocus={openSearch}
              onBlur={closeSearchSoon}
              placeholder="Escribe el nombre del plato…"
              className="w-full rounded-xl border border-border-subtle bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-400"
            />
          </label>

          {searchOpen ? (
          <ul className="mt-2 max-h-28 shrink-0 space-y-1 overflow-y-auto">
            {loading ? (
              <li className="px-2 py-3 text-sm text-foreground/40">Buscando…</li>
            ) : results.length === 0 ? (
              <li className="px-2 py-3 text-sm text-foreground/40">
                {query.trim()
                  ? "Ningún plato coincide con esa búsqueda."
                  : "No hay platos disponibles."}
              </li>
            ) : (
              results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={!item.available}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => addToCart(item)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-brand-50 disabled:opacity-40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.name}</span>
                      <span className="text-xs text-foreground/50">
                        {item.category}
                        {!item.available ? " · agotado" : ""}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-brand-700">
                      ${Number(item.price).toFixed(2)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          ) : null}

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-border-subtle pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/50">
              Comanda
            </h3>
            {cart.length === 0 ? (
              <p className="mt-2 text-sm text-foreground/40">
                Busca un plato y tócalo para agregarlo.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {cart.map((line) => (
                  <li
                    key={line.item.id}
                    className="rounded-xl border border-border-subtle bg-background p-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 flex-1 font-medium">
                        {line.item.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => changeQty(line.item.id, -1)}
                          className="rounded-md border border-border-subtle p-1 hover:border-brand-400"
                          aria-label="Quitar uno"
                        >
                          {line.quantity === 1 ? (
                            <Trash2 className="h-3.5 w-3.5" />
                          ) : (
                            <Minus className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <span className="w-6 text-center font-bold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(line.item.id, 1)}
                          className="rounded-md border border-border-subtle p-1 hover:border-brand-400"
                          aria-label="Agregar uno"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </span>
                      <span className="w-14 text-right text-foreground/70">
                        ${(Number(line.item.price) * line.quantity).toFixed(2)}
                      </span>
                    </div>
                    <input
                      value={line.notes}
                      onChange={(e) => setLineNotes(line.item.id, e.target.value)}
                      name="detalle-plato"
                      autoComplete="off"
                      placeholder="Detalle de este plato (sin ají, término medio…)"
                      className="mt-2 w-full rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs outline-none focus:border-brand-400"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="space-y-3 border-t border-border-subtle px-5 py-4">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>{isAdd ? "A agregar" : "Total"}</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            type="button"
            disabled={cart.length === 0 || sending}
            onClick={() => void submitOrder()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {sending
              ? "Enviando…"
              : isAdd
                ? "Agregar a la comanda"
                : "Enviar a cocina"}
          </button>
        </footer>
      </div>
    </div>
  );
}
