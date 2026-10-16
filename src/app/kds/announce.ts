import { itemTimerStart, pendingUnits, type Order } from "@/features/orders/types";

const VOICE_KEY = "kds-voice";
const NUMBERS = [
  "",
  "un",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
];

const queue: string[] = [];
let draining = false;

function feminine(name: string): boolean {
  return /gaseosa|sopa|fritada|corvina|tilapia|porci[oó]n|costilla|menestra|parrillada|salchipapa/i.test(
    name,
  );
}

export function itemPhrase(quantity: number, name: string): string {
  const count = Math.max(1, quantity);
  if (count === 1) return feminine(name) ? `Una ${name}` : `Un ${name}`;
  const word = NUMBERS[count] ?? String(count);
  return `${word} ${name}`;
}

function joinSpanish(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

function askedFor(items: { quantity: number; name: string }[]): string {
  return `Pidieron ${joinSpanish(items.map((item) => itemPhrase(item.quantity, item.name)))}.`;
}

export function announceNewOrder(order: Order) {
  const via = order.channel === "whatsapp" ? "por WhatsApp" : "en mesa";
  const asked = askedFor(order.items);
  speak(`Pedido nuevo ${via}. ${asked}`);
  speak(`Repito el pedido. ${asked}`);
}

export function addedPhrase(items: { quantity: number; name: string }[]): string {
  const dishes = items.map((item) => itemPhrase(item.quantity, item.name)).join(". ");
  return `Agregaron al pedido. ${dishes}.`;
}

export function nudgeFallback(minutes: number, dishes: string[]): string {
  const list = joinSpanish(dishes);
  const one = dishes.length === 1 && /^(un|una)\b/i.test(dishes[0] ?? "");
  const verb = one ? "Falta" : "Faltan";
  if (minutes >= 30) return `Urgente. Llevan ${minutes} minutos. ${verb} ${list}.`;
  if (minutes >= 20) return `Apúrense. Llevan ${minutes} minutos. ${verb} ${list}.`;
  return `Atención. Llevan ${minutes} minutos. ${verb} ${list}.`;
}

export function voiceEnabled(): boolean {
  try {
    return sessionStorage.getItem(VOICE_KEY) === "1";
  } catch {
    return false;
  }
}

function availableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) return voices;
  return [];
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = availableVoices();
  const spanish = voices.filter((voice) => voice.lang.toLowerCase().startsWith("es"));
  const score = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    let points = 0;
    if (name.includes("natural") || name.includes("neural")) points += 50;
    if (name.includes("google")) points += 40;
    if (name.includes("dalia") || name.includes("elvira") || name.includes("alvaro")) points += 30;
    if (voice.lang.toLowerCase().startsWith("es-mx")) points += 8;
    if (voice.lang.toLowerCase().startsWith("es-ec")) points += 8;
    return points;
  };
  return spanish.sort((a, b) => score(b) - score(a))[0] ?? null;
}

function drain() {
  if (draining || queue.length === 0 || !window.speechSynthesis) return;
  const text = queue.shift();
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-MX";
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.92;
  draining = true;
  const next = () => {
    draining = false;
    drain();
  };
  utterance.onend = next;
  utterance.onerror = next;
  window.speechSynthesis.speak(utterance);
}

export function speak(text: string) {
  if (!voiceEnabled() || !text.trim() || !window.speechSynthesis) return;
  queue.push(text.trim());
  drain();
}

/** Resumen de lo que cocina aún no despacha, con la cantidad de cada plato. */
export function dispatchBoardPhrase(orders: Order[]): string | null {
  const totals = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      const left = pendingUnits(item);
      if (left > 0) totals.set(item.name, (totals.get(item.name) ?? 0) + left);
    }
  }
  if (totals.size === 0) return null;
  const list = [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .map(([name, quantity]) => itemPhrase(quantity, name));
  return `Recuerden que tenemos que despachar lo siguiente. ${joinSpanish(list)}.`;
}

/** El navegador solo habla después de un toque. Esta función debe llamarse desde un click. */
export function enableVoice(): boolean {
  if (!window.speechSynthesis) return false;
  try {
    sessionStorage.setItem(VOICE_KEY, "1");
  } catch {
    return false;
  }
  window.speechSynthesis.cancel();
  queue.length = 0;
  draining = false;
  const utterance = new SpeechSynthesisUtterance("Voz de cocina activada.");
  utterance.lang = "es-MX";
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function pendingDishes(
  order: Order,
  minMinutes: number,
  now = Date.now(),
): { name: string; phrase: string }[] {
  const dishes: { name: string; phrase: string }[] = [];
  for (const item of order.items) {
    const left = pendingUnits(item);
    if (left <= 0) continue;
    const start = new Date(itemTimerStart(item, order)).getTime();
    const minutes = Math.floor((now - start) / 60000);
    if (minutes >= minMinutes) {
      dishes.push({ name: item.name, phrase: itemPhrase(left, item.name) });
    }
  }
  return dishes;
}

export function oldestPendingMinutes(order: Order, now = Date.now()): number {
  let oldest = 0;
  for (const item of order.items) {
    if (pendingUnits(item) <= 0) continue;
    const start = new Date(itemTimerStart(item, order)).getTime();
    const minutes = Math.floor((now - start) / 60000);
    if (minutes > oldest) oldest = minutes;
  }
  return oldest;
}

export type ItemSnapshot = Map<number, number>;

export function snapshotItems(order: Order): ItemSnapshot {
  return new Map(order.items.map((item) => [item.id, item.quantity]));
}

export function addedItems(
  previous: ItemSnapshot,
  order: Order,
): { quantity: number; name: string }[] {
  const added: { quantity: number; name: string }[] = [];
  for (const item of order.items) {
    const before = previous.get(item.id) ?? 0;
    if (item.quantity > before) {
      added.push({ quantity: item.quantity - before, name: item.name });
    }
  }
  return added;
}

export function crossedNudge(minutes: number, spoken: Set<number>): 10 | 20 | 30 | null {
  const levels = [30, 20, 10] as const;
  for (const level of levels) {
    if (minutes >= level && !spoken.has(level)) return level;
  }
  return null;
}

