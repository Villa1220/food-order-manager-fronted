/**
 * En Vercel la página es HTTPS y el backend del VPS es HTTP, así que el
 * navegador llama al mismo dominio y Next reenvía al servidor 2.28.111.55.
 * En local, .env.local sigue apuntando a localhost:4000.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000");

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "mesero" | "cliente";
};

const STORAGE_KEY = "rutadelsabor.session";

export function saveSession(token: string, user: SessionUser) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

export function postLoginPath(role: SessionUser["role"]): string {
  if (role === "mesero") return "/panel/pedidos";
  if (role === "admin") return "/panel";
  return "/";
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function readSession(): { token: string; user: SessionUser } | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { token: string; user: SessionUser };
  } catch {
    return null;
  }
}

export async function loginWithGoogle(credential: string) {
  const response = await fetch(`${API_URL}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const data = (await response.json()) as {
    error?: string;
    token?: string;
    user?: SessionUser;
  };
  if (!response.ok || !data.token || !data.user) {
    throw new Error(data.error ?? "No se pudo iniciar sesión.");
  }
  saveSession(data.token, data.user);
  return data.user;
}
