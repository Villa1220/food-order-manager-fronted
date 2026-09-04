---
name: feature-architecture
description: Organiza código en features de dominio (menu, orders, auth, payments) espejando el backend. Usar al crear pantallas, módulos nuevos, hooks de dominio o integrar API/Socket.IO.
---

# Feature Architecture

## Estructura

```
src/features/<dominio>/
  data.ts          # tipos + datos estáticos o mappers
  *Section.tsx     # UI de sección / página parcial
  hooks/           # hooks del dominio (opcional)
  api.ts           # llamadas HTTP (opcional)
```

Dominios esperados (alineados al backend): `home`, `menu`, `auth`, `users`, `orders`, `payments`.

## Reglas

1. **Rutas en `app/`**, lógica en `features/` — pages solo componen features.
2. **Layout compartido** en `components/layout/`; primitivos en `components/ui/`.
3. **Utilidades puras** en `lib/` (`cn`, `CONTACT`, clientes API).
4. **API:** base URL desde `NEXT_PUBLIC_API_URL`; sockets desde `NEXT_PUBLIC_SOCKET_URL`.
5. **Menú:** no hardcodear platos fuera de `features/menu/data.ts`.

## Flujo al agregar feature

1. Crear `src/features/<nombre>/`
2. Tipar entidades (Zod o interfaces TS)
3. Exportar componentes/hooks desde el folder
4. Montar en `src/app/.../page.tsx`
5. Si necesita realtime → Socket.IO client en hook del feature

## Ejemplo

```tsx
// src/app/menu/page.tsx
import { MenuSection } from "@/features/menu/MenuSection";

export default function MenuPage() {
  return <MenuSection />;
}
```
