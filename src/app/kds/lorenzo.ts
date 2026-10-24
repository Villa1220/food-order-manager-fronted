const WIN_EPOCH_OFFSET = 11644473600;
const S_TO_NS = 1_000_000_000;
const GEC_PREFIX_LENGTH = 57;
const EDGE_API_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const GEC_PREFIX_WORDS = [
  0x79706f43, 0x68676972, 0x43282074, 0x694d2029, 0x736f7263, 0x2074666f, 0x70726f43, 0x7461726f,
  0x2e6e6f69, 0x6c6c4120, 0x67697220, 0x20737468, 0x65736572, 0x64657672, 0x0000002e,
];
const VOICE_URL = "wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1";
const VOICE_VERSION = "2-155.0.4283.45";

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

const rol16 = (value: number) => ((value << 16) | (value >>> 16)) >>> 0;

const toWords = (bytes: Uint8Array) => {
  const padded = new Uint8Array(Math.ceil(bytes.length / 8) * 8);
  padded.set(bytes);
  const view = new DataView(padded.buffer);
  return Array.from({ length: padded.length / 4 }, (_, index) => view.getUint32(index * 4, true));
};

const cs64WordSwap = (words: number[], a: number, b: number) => {
  let acc = 0;
  let last = 0;
  for (let index = 0; index < words.length; index += 2) {
    const x = words[index] ?? 0;
    const y = words[index + 1] ?? 0;
    let t = rol16((Math.imul(rol16(x), 0xef0569fb) + Math.imul(x, a)) >>> 0);
    let q = Math.imul(t, 0x76f50f34) >>> 0;
    acc = (acc + Math.imul(rol16(q), 0xc3efea97) + q) >>> 0;
    t = rol16((Math.imul(rol16(y), 0xc31713db) + Math.imul(y, b)) >>> 0);
    q = Math.imul(t, 0x1881ce3c) >>> 0;
    last = (Math.imul(rol16(q), 0x35bd1ec9) + q) >>> 0;
    acc = (acc + last) >>> 0;
  }
  return [last, acc];
};

const cs64Reversible = (words: number[], a: number, b: number) => {
  let state = 0;
  let acc = 0;
  for (let index = 0; index < words.length; index += 2) {
    state = Math.imul(state + (words[index] ?? 0), a) >>> 0;
    for (const constant of [0xcf98b111, 0x87085b9f, 0x12ceb96d, 0x257e1d83]) {
      state = Math.imul(rol16(state), constant) >>> 0;
    }
    let t = Math.imul((words[index + 1] ?? 0) + state, b) >>> 0;
    t = Math.imul(rol16(t), 0xa27416f5) >>> 0;
    t = rol16(Math.imul(rol16(t), 0xd38396ff) >>> 0);
    acc = (acc + state) >>> 0;
    state = Math.imul(rol16(Math.imul(t, 0x7c932b89) >>> 0), 0xbfa49f69) >>> 0;
    acc = (acc + state) >>> 0;
  }
  return [state, acc];
};

async function voiceToken(now = Date.now()): Promise<string> {
  let ticks = Math.floor(now / 1000) + WIN_EPOCH_OFFSET;
  ticks -= ticks % 300;
  ticks *= S_TO_NS / 100;
  const suffix = new TextEncoder().encode(`${ticks.toFixed(0)}${EDGE_API_TOKEN}`);
  const data = new Uint8Array(GEC_PREFIX_LENGTH + suffix.length);
  const view = new DataView(data.buffer);
  GEC_PREFIX_WORDS.forEach((word, index) => view.setUint32(index * 4, word, true));
  data.set(suffix, GEC_PREFIX_LENGTH);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  const words = toWords(data);
  const [key0, key1] = toWords(digest);
  const a = ((key0 ?? 0) | 1) >>> 0;
  const b = ((key1 ?? 0) | 1) >>> 0;
  const [swap0, swap1] = cs64WordSwap(words, a, b);
  const [reverse0, reverse1] = cs64Reversible(words, a, b);
  const cs64 = new DataView(new ArrayBuffer(8));
  cs64.setUint32(0, (swap0 ?? 0) ^ (reverse0 ?? 0), true);
  cs64.setUint32(4, (swap1 ?? 0) ^ (reverse1 ?? 0), true);
  return `${toHex(new Uint8Array(cs64.buffer))}-${toHex(digest)}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function requestId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Lorenzo, leído en esta pantalla. El servidor ya no alcanza el servicio de voz. */
export function synthesizeLorenzo(text: string): Promise<Blob> {
  const line = text.trim();
  if (!line) return Promise.reject(new Error("vacio"));
  const id = requestId();
  return voiceToken().then(
    (token) =>
      new Promise<Blob>((resolve, reject) => {
        const url =
          `${VOICE_URL}?Ocp-Apim-Subscription-Key=${EDGE_API_TOKEN}` +
          `&Sec-MS-GEC=${token}&Sec-MS-GEC-Version=${VOICE_VERSION}&ConnectionId=${id}`;
        const socket = new WebSocket(url);
        socket.binaryType = "arraybuffer";
        const chunks: Uint8Array[] = [];
        let settled = false;
        const timer = window.setTimeout(() => finish(new Error("tiempo")), 12000);
        const finish = (error?: Error) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          socket.close();
          if (error) {
            reject(error);
            return;
          }
          const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
          if (blob.size < 500) reject(new Error("audio corto"));
          else resolve(blob);
        };
        socket.onerror = () => finish(new Error("socket"));
        socket.onopen = () => {
          const now = new Date().toUTCString();
          socket.send(
            `X-Timestamp:${now}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
              `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":false},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`,
          );
          const ssml =
            `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-CL">` +
            `<voice name="es-CL-LorenzoNeural"><prosody rate="-8%" pitch="+0Hz" volume="+0%">` +
            `${escapeXml(line)}</prosody></voice></speak>`;
          socket.send(
            `X-RequestId:${id}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${now}\r\nPath:ssml\r\n\r\n${ssml}`,
          );
        };
        socket.onmessage = (event) => {
          if (typeof event.data === "string") {
            if (event.data.includes("Path:turn.end")) finish();
            return;
          }
          const data = new Uint8Array(event.data as ArrayBuffer);
          if (data.length < 2) return;
          const headerLength = (data[0] << 8) | data[1];
          const header = new TextDecoder().decode(data.subarray(2, 2 + headerLength));
          if (!/Path:\s*audio/i.test(header)) return;
          const body = data.subarray(2 + headerLength);
          if (body.length > 0) chunks.push(body);
        };
      }),
  );
}
