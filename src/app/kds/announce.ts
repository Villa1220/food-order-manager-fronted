import { API_URL, readSession } from "@/lib/auth";
import type { Order } from "@/features/orders/types";

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

let playback: Promise<void> = Promise.resolve();
let voiceOnMemory = false;
let speaker: HTMLAudioElement | null = null;

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

function getSpeaker(): HTMLAudioElement {
  if (!speaker) {
    speaker = new Audio();
    speaker.setAttribute("playsinline", "true");
  }
  return speaker;
}

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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.92;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

function playBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  const audio = getSpeaker();
  audio.src = url;
  return new Promise((resolve) => {
    const done = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    void audio.play().catch(done);
  });
}

async function speakWithLorenzo(text: string): Promise<void> {
  const token = readSession()?.token;
  const response = await fetch(`${API_URL}/api/kitchen/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("sin voz");
  const blob = await response.blob();
  if (blob.size < 500) throw new Error("audio corto");
  await playBlob(blob);
}

export function speak(text: string) {
  const line = text.trim();
  if (!voiceEnabled() || !line) return;
  playback = playback.then(async () => {
    try {
      await speakWithLorenzo(line);
    } catch {
      await speakWithBrowser(line);
    }
  });
}

/** El navegador solo suena después de un toque. Esta función debe llamarse desde un click. */
export function enableVoice(): boolean {
  voiceOnMemory = true;
  try {
    sessionStorage.setItem(VOICE_KEY, "1");
  } catch {
    // En algunas teles no se puede guardar. La voz queda activa en esta visita.
  }
  const audio = getSpeaker();
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

