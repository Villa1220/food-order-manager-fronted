import { API_URL, readSession } from "@/lib/auth";
import { itemTimerStart, pendingUnits, type Order } from "@/features/orders/types";
import { dishPhrase } from "./dish-speech";

const VOICE_KEY = "kds-voice";

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

export function announceNewOrder(order: Order) {
  const via = order.channel === "whatsapp" ? "por WhatsApp" : "en mesa";
  const asked = askedFor(order.items);
  speak(`Pedido nuevo ${via}. ${asked}`);
  speak(`Repito el pedido. ${asked}`);
}

export const NUDGE_MINUTES = [10, 20, 30, 40, 50, 60] as const;

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

export function nudgeFallback(minutes: number, dishes: string[]): string {
  const list = joinSpanish(dishes);
  if (minutes >= 20) {
    return `Qué fue con ${list}. Ya van ${minutes} minutos y los clientes están con hambre.`;
  }
  return `Chuta, ${list} lleva ${minutes} minutos. Ya toca moverse.`;
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
    body: JSON.stringify({ text }),
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

