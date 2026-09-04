---
name: nextjs-devtools
description: Diagnostica y corrige la app Next.js 16 con next-devtools MCP (errores runtime, rutas, logs, docs). Usar cuando el usuario reporta bugs, pantallas en blanco, errores de build/hidratación, o al verificar rutas tras cambios.
---

# Next.js DevTools

## Prerrequisito

```bash
npm run dev
```

Next.js 16 expone `/_next/mcp`. El MCP `next-devtools` lo descubre solo.

## Flujo

1. Llamar herramientas de **next-devtools** (descubrir server → `get_errors` / `get_routes` / logs)
2. Leer docs versionadas vía gateway del MCP si la API es dudosa
3. Corregir en el código del proyecto
4. Re-chequear errores hasta limpio

## Casos típicos

| Síntoma | Acción |
|---------|--------|
| Hydration mismatch | Theme script, `suppressHydrationWarning`, evitar `Date`/`random` en SSR |
| 404 de imagen | Rutas bajo `public/`, `next/image` |
| Cliente innecesario | Quitar `"use client"` si no hay estado/efectos |
| API fallida | Revisar `NEXT_PUBLIC_API_URL` en `.env.local` |

## No hacer

- No inventar APIs de Next desactualizadas: usar docs del MCP / `node_modules/next/dist/docs`
- No reiniciar el MCP a ciegas: primero confirmar que `npm run dev` está corriendo
