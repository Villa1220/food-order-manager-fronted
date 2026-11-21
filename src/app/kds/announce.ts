import { API_URL, readSession } from "@/lib/auth";
import { itemTimerStart, pendingUnits, type Order } from "@/features/orders/types";
import { dishPhrase } from "./dish-speech";

const VOICE_KEY = "kds-voice";
const ENGINE_KEY = "kds-voice-engine";
let engineMemory: "1" | "2" = "1";

export function kitchenEngine(): "1" | "2" {
  try {
    const saved = localStorage.getItem(ENGINE_KEY);
    if (saved === "1" || saved === "2") return saved;
  } catch {
    // La tele a veces no deja leer el almacenamiento.
  }
  return engineMemory;
}

export function toggleKitchenEngine(): "1" | "2" {
  const next = kitchenEngine() === "1" ? "2" : "1";
  engineMemory = next;
  try {
    localStorage.setItem(ENGINE_KEY, next);
  } catch {
    // Queda elegida durante esta visita.
  }
  return next;
}

let playback: Promise<void> = Promise.resolve();
let voiceOnMemory = false;
let speaker: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

function getSpeaker(): HTMLAudioElement {
  if (!speaker) {
    speaker = new Audio();
    speaker.setAttribute("playsinline", "true");
  }
  return speaker;
}

function kitchenAudio(): AudioContext | null {
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

export function itemPhrase(quantity: number, name: string): string {
  return dishPhrase(quantity, name);
}

function joinSpanish(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

function withDetail(phrase: string, notes?: string | null): string {
  const detail = notes?.trim();
  return detail ? `${phrase}, ${detail}` : phrase;
}

function askedFor(items: { quantity: number; name: string; notes?: string | null }[]): string {
  return `Pidieron ${joinSpanish(
    items.map((item) => withDetail(itemPhrase(item.quantity, item.name), item.notes)),
  )}.`;
}

export function isOrderFinished(order: Order): boolean {
  return order.items.length > 0 && order.items.every((item) => pendingUnits(item) <= 0);
}

export function tableVoice(order: Order): string {
  if (order.channel === "whatsapp") return "el pedido de WhatsApp";
  const table = order.table_number?.trim() ?? "";
  if (!table || table === "0" || table.toLowerCase() === "llevar") return "el pedido para llevar";
  return `la mesa ${table}`;
}

export function finishedMinutes(order: Order): number {
  const start = new Date(order.received_at).getTime();
  const readyMarks = order.items
    .map((item) => item.ready_at)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime());
  const readyAt = order.ready_at ? new Date(order.ready_at).getTime() : 0;
  const end = Math.max(readyAt, ...readyMarks, 0) || Date.now();
  return Math.max(1, Math.round((end - start) / 60000));
}

const CHEER_FALLBACK = [
  (place: string, minutes: number) =>
    `${place} salió en ${minutes} minutos. Si el apuro tuviera premio, esta tanda se lo lleva.`,
  (place: string, minutes: number) =>
    `${place} se quedó ${minutes} minutos. El plato no se escapó, pero miró la puerta.`,
  (place: string, minutes: number) =>
    `${minutes} minutos para ${place}. La mesa ya podía contar esa espera como entrada.`,
];

export function finishedFallback(place: string, minutes: number, slow: boolean): string {
  if (!slow) {
    return `${place} lista en ${minutes} minutos. Bien ahí, cocina, así da gusto.`;
  }
  return CHEER_FALLBACK[minutes % CHEER_FALLBACK.length](place, minutes);
}

export function announceFinished(order: Order) {
  const place = tableVoice(order);
  const minutes = finishedMinutes(order);
  const slow = minutes >= 20;
  void fetch(`${API_URL}/api/kitchen/cheer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(readSession()?.token ? { Authorization: `Bearer ${readSession()?.token}` } : {}),
    },
    body: JSON.stringify({ place, minutes, mood: slow ? "risa" : "aliento" }),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("sin frase");
      const data = (await response.json()) as { phrase?: string };
      if (!data.phrase) throw new Error("sin frase");
      speak(data.phrase);
    })
    .catch(() => speak(finishedFallback(place, minutes, slow)));
}

export function announceNewOrder(order: Order) {
  const via = order.channel === "whatsapp" ? "por WhatsApp" : "en mesa";
  const asked = askedFor(order.items);
  speak(`Pedido nuevo ${via}. ${asked}`);
  speak(`Repito el pedido. ${asked}`);
}

export const NUDGE_MINUTES = [10, 20, 30, 40, 50, 60, 70] as const;

export function crossedNudge(
  minutes: number,
  spoken: Set<number>,
): (typeof NUDGE_MINUTES)[number] | null {
  const levels = [...NUDGE_MINUTES].reverse();
  for (const level of levels) {
    if (minutes >= level && !spoken.has(level)) return level;
  }
  return null;
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

const NUDGE_FALLBACK: Record<(typeof NUDGE_MINUTES)[number], (list: string) => string> = {
  10: (list) => `${list} ya va en diez minutos. El fogón no adivina solo.`,
  20: (list) => `A ver, cocina: ${list} sigue esperando y ya son veinte minutos.`,
  30: (list) => `${list} lleva media hora en el tablero. La mesa ya estiró el cuello.`,
  40: (list) => `Cuarenta minutos con ${list}. Eso ya no es un aperitivo, es una novela.`,
  50: (list) => `${list} cumple cincuenta minutos. El hambre ya pidió la cuenta del tiempo.`,
  60: (list) => `Una hora con ${list}. Si el plato tuviera patas, ya se habría ido solo.`,
  70: (list) => `Setenta minutos y ${list} sigue ahí. Último jalón: a despachar eso ya.`,
};

export function nudgeFallback(minutes: number, dishes: string[]): string {
  const list = joinSpanish(dishes);
  const line = NUDGE_FALLBACK[minutes as (typeof NUDGE_MINUTES)[number]];
  return line ? line(list) : `${list} ya va en ${minutes} minutos. A despachar.`;
}

export function addedPhrase(
  items: { quantity: number; name: string; notes?: string | null }[],
): string {
  const dishes = items
    .map((item) => withDetail(itemPhrase(item.quantity, item.name), item.notes))
    .join(". ");
  return `Agregaron al pedido. ${dishes}.`;
}

export function voiceEnabled(): boolean {
  if (voiceOnMemory) return true;
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

function speakWithBrowser(text: string): Promise<void> {
  if (!window.speechSynthesis) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, 8000);
    const done = () => {
      window.clearTimeout(timer);
      resolve();
    };
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.92;
    utterance.onend = done;
    utterance.onerror = done;
    window.speechSynthesis.speak(utterance);
  });
}

function playBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  const audio = getSpeaker();
  audio.loop = false;
  audio.src = url;
  return new Promise((resolve, reject) => {
    const done = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onended = done;
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("audio"));
    };
    void audio.play().catch((error: unknown) => {
      URL.revokeObjectURL(url);
      reject(error);
    });
  });
}

function fetchKitchenAudio(text: string): Promise<Blob> {
  const token = readSession()?.token;
  return fetch(`${API_URL}/api/kitchen/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, voice: kitchenEngine() }),
  }).then(async (response) => {
    if (!response.ok) throw new Error("sin voz");
    const blob = await response.blob();
    if (blob.size < 500) throw new Error("audio corto");
    return blob;
  });
}

function sentencesOf(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]?/g) ?? [text];
  return parts.map((part) => part.trim()).filter((part) => part.length > 1);
}

export function speak(text: string) {
  const line = text.trim();
  if (!voiceEnabled() || !line) return;
  for (const sentence of sentencesOf(line)) {
    const pending = fetchKitchenAudio(sentence);
    playback = playback.then(async () => {
      try {
        await playBlob(await pending);
      } catch {
        await speakWithBrowser(sentence);
      }
    });
  }
}

/** El navegador solo suena después de un toque. Esta función debe llamarse desde un click. */
export function enableVoice(): boolean {
  voiceOnMemory = true;
  try {
    sessionStorage.setItem(VOICE_KEY, "1");
  } catch {
    // En algunas teles no se puede guardar. La voz queda activa en esta visita.
  }
  const ctx = kitchenAudio();
  if (ctx) {
    void ctx.resume();
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }
  const audio = getSpeaker();
  audio.loop = true;
  audio.src = SILENT_WAV;
  void audio.play().catch(() => undefined);
  playback = Promise.resolve();
  speak("Voz de cocina activada.");
  return true;
}

export type ItemSnapshot = Map<number, number>;

export function snapshotItems(order: Order): ItemSnapshot {
  return new Map(order.items.map((item) => [item.id, item.quantity]));
}

export function addedItems(
  previous: ItemSnapshot,
  order: Order,
): { quantity: number; name: string; notes: string | null }[] {
  const added: { quantity: number; name: string; notes: string | null }[] = [];
  for (const item of order.items) {
    const before = previous.get(item.id) ?? 0;
    if (item.quantity > before) {
      added.push({
        quantity: item.quantity - before,
        name: item.name,
        notes: item.notes,
      });
    }
  }
  return added;
}

