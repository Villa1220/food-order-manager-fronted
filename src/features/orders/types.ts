export type OrderItem = {
  id: number;
  name: string;
  quantity: number;
  unit_price: string;
  notes: string | null;
  status: "pendiente" | "listo";
  ready_at: string | null;
  created_at: string;
};

export type Order = {
  id: number;
  order_code: string;
  channel: "presencial" | "whatsapp";
  status: "recibido" | "en_preparacion" | "listo" | "entregado" | "cancelado";
  table_number: string | null;
  customer_note: string | null;
  subtotal: string;
  demand_band: "pico" | "baja" | null;
  received_at: string;
  kitchen_notified_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  items: OrderItem[];
};

export const ACTIVE_STATUSES = ["recibido", "en_preparacion", "listo"] as const;

export const STATUS_LABEL: Record<Order["status"], string> = {
  recibido: "Pendiente",
  en_preparacion: "Pendiente",
  listo: "Listo",
  entregado: "Terminado",
  cancelado: "Cancelado",
};

export function isItemDone(item: OrderItem): boolean {
  return item.status === "listo";
}

export function pendingItems(order: Order): OrderItem[] {
  return order.items.filter((item) => !isItemDone(item));
}

export function doneItems(order: Order): OrderItem[] {
  return order.items.filter((item) => isItemDone(item));
}

/** Minutos transcurridos; si hay `untilIso` el reloj queda congelado. */
export function elapsedSince(
  iso: string,
  untilIso?: string | null,
): {
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  const end = untilIso ? new Date(untilIso).getTime() : Date.now();
  const totalSeconds = Math.max(
    0,
    Math.floor((end - new Date(iso).getTime()) / 1000),
  );
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  };
}

export function minutesSince(iso: string, untilIso?: string | null): number {
  return elapsedSince(iso, untilIso).minutes;
}

/** Reloj de cocina: 0:07, 13:42, 1:05:03 si supera una hora. */
export function formatElapsed(iso: string, untilIso?: string | null): string {
  const { minutes, seconds, totalSeconds } = elapsedSince(iso, untilIso);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (totalSeconds >= 3600) {
    const hours = Math.floor(totalSeconds / 3600);
    return `${hours}:${pad(minutes % 60)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

export function itemTimerStart(item: OrderItem, order: Order): string {
  return item.created_at || order.received_at;
}

