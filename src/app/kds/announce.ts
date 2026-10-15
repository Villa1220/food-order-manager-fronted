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

export function newOrderPhrase(order: Order): string {
  const via = order.channel === "whatsapp" ? "por WhatsApp" : "en mesa";
  const dishes = order.items
    .map((item) => itemPhrase(item.quantity, item.name))
    .join(". ");
  return `Pedido nuevo ${via}. ${dishes}.`;
}

export function addedPhrase(items: { quantity: number; name: string }[]): string {
  const dishes = items.map((item) => itemPhrase(item.quantity, item.name)).join(". ");
  return `Agregaron al pedido. ${dishes}.`;
}

export function nudgeFallback(minutes: number, dishes: string[]): string {
  const list = dishes.join(" y ");
  if (minutes >= 30) return `Urgente. Llevan ${minutes} minutos. Faltan ${list}.`;
  if (minutes >= 20) return `Apúrense. Llevan ${minutes} minutos. Faltan ${list}.`;
  return `Atención. Llevan ${minutes} minutos. Faltan ${list}.`;
}

export function voiceEnabled(): boolean {
  try {
    return sessionStorage.getItem(VOICE_KEY) === "1";
  } catch {
    return false;
  }
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const spanish = voices.filter((voice) => voice.lang.toLowerCase().startsWith("es"));
  return (
    spanish.find((voice) => voice.lang.toLowerCase().startsWith("es-ec")) ??
    spanish.find((voice) => voice.lang.toLowerCase().startsWith("es-mx")) ??
    spanish[0] ??
    null
  );
}

function drain() {
  if (draining || queue.length === 0 || !window.speechSynthesis) return;
  const text = queue.shift();
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-EC";
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 1;
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
  utterance.lang = "es-EC";
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

