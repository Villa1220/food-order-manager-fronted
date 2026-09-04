# food-order-manager-fronted

Frontend del Sistema Inteligente de Gestión de Pedidos — Restaurante Perucho.

**Stack:** Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4 +
shadcn/ui + Motion + React Hook Form + Zod + TanStack Query + Socket.IO
client.

## ⚠️ Antes de nada: instalar y correr en tu máquina

Este scaffold se armó a mano, archivo por archivo, **sin poder correr
`npm install` en este entorno** (el sandbox donde trabajo no tiene acceso al
registro de npm por política de red — no es un problema del proyecto, es una
restricción del entorno cloud). Todo el código sigue las convenciones
estándar y actuales de Next.js 16 / Tailwind v4 / shadcn, pero la primera
vez que lo corras en tu laptop es importante que valides que instala y
levanta sin errores:

```powershell
npm install
npm run dev
```

Abre `http://localhost:3000`. Si algo truena, pégame el error exacto de la
terminal y lo arreglamos de inmediato — es mucho más rápido corregir un
detalle puntual que quedarnos sin poder probar nada.

## Siguiente paso: inicializar shadcn/ui

No dejé pre-armado `components.json` ni las variables de tema de shadcn a
propósito — es mejor que lo genere el CLI real (así queda exactamente
sincronizado con la versión actual de shadcn, no con lo que yo recuerde):

```powershell
npx shadcn@latest init
```

Cuando pregunte por el estilo, base color, etc., cualquier respuesta por
defecto sirve (podemos ajustar colores después con la paleta de marca que ya
dejé en `src/app/globals.css`). Después, para ir agregando componentes:

```powershell
npx shadcn@latest add button card navigation-menu dialog form table badge
```

## Agregar bloques de Magic UI / Tailark

Ambos publican sus componentes como registros compatibles con el CLI de
shadcn, así que se agregan igual (sin instalar un paquete npm aparte):

```powershell
npx shadcn@latest add "https://magicui.design/r/marquee.json"
```

(reemplaza `marquee` por el nombre del componente que quieras de
[magicui.design](https://magicui.design/docs/components) o
[tailark.com](https://tailark.com)).

## Estructura del proyecto

```
src/
  app/            → páginas (App Router de Next.js)
  components/ui/  → componentes de shadcn/ui (se llenan con el CLI)
  features/       → un folder por dominio, espejo del backend:
                     auth, users, menu, orders, payments
  hooks/          → hooks compartidos (useAuth, useSocket, useOrders...)
  lib/            → utilidades (cn(), clientes de API, etc.)
```

`features/` usa exactamente los mismos nombres que `modules/` en el backend
— es intencional, para que sea fácil dividir tareas entre agentes/personas
sin que se pisen.

## Variables de entorno

Copia `.env.example` a `.env.local` y ajusta la URL del backend cuando esté
desplegado:

```
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_SOCKET_URL=https://api.tudominio.com
```

## Qué ya existe

- Landing pública (`src/app/page.tsx`) con navbar, hero, sección "sobre
  nosotros", menú destacado y CTA de contacto — con marcadores de posición
  donde van las fotos reales del restaurante.
- Paleta de marca (tonos cálidos) y tipografía (Playfair Display +
  Plus Jakarta Sans) ya configuradas en `globals.css` y `layout.tsx`.
- Estructura de carpetas lista para las siguientes pantallas (login,
  panel admin, KDS, portal del cliente).

## Qué falta (siguientes pasos)

1. Correr `npm install` y `npm run dev` para confirmar que todo levanta.
2. `npx shadcn@latest init` + agregar los primeros componentes.
3. Reemplazar los bloques de foto placeholder por fotografía real del local.
4. Construir `features/auth` (login con Google) en cuanto el backend tenga
   el endpoint listo.
