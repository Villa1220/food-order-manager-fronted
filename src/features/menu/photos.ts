import { API_URL } from "@/lib/auth";

export const PHOTO_BY_NAME: Record<string, string> = {
  "Cuy entero asado": "/platos/cuy-entero.jpg",
  "1/2 Cuy asado": "/platos/medio%20cuy.jpg",
  "1/4 Cuy asado": "/platos/cuarto%20de%20cuy.jpg",
  Parrillada: "/platos/parillada.jpg",
  "Costillas BBQ": "/platos/costilla.jpg",
  "Tilapia frita": "/platos/tilapia.jpg",
  "Corvina frita": "/platos/corvina.jpg",
  "Camarones al ajillo": "/platos/camarones.jpg",
  Churrasco: "/platos/churrasco.jpg",
  Fritada: "/platos/fritada.jpg",
  Salchipapas: "/platos/salchipapa.jpg",
  Papipollo: "/platos/papipollo.jpg",
  "Menestra con chuleta": "/platos/Menestra.jpg",
  Yaguarlocro: "/platos/yaguarlocro.jpg",
  "Caldo de gallina": "/platos/caldo%20de%20gallina.jpg",
  "Menudo con morcilla de dulce": "/platos/Menudo%20con%20morcilla.jpg",
  "Caldo de pata": "/platos/Caldo%20de%20pata.jpg",
  "Gaseosa retornable 2L": "/platos/gaseosa%202l.jpg",
  "Gaseosa personal": "/platos/gaseosa%20personal.jpg",
  Agua: "/platos/Agua.jpg",
  Guitig: "/platos/guitig.jpg",
  Güitig: "/platos/guitig.jpg",
};

export function mediaUrl(path: string | null | undefined, name?: string): string | null {
  const source = path || (name ? PHOTO_BY_NAME[name] : null);
  if (!source) return null;
  if (source.startsWith("http")) return source;
  if (source.startsWith("/uploads")) return `${API_URL}${source}`;
  return source;
}
