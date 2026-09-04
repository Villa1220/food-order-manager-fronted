---
name: ui-shadcn-workflow
description: Añade y personaliza componentes UI con shadcn MCP/CLI respetando la marca del restaurante. Usar al instalar shadcn, Magic UI, formularios, dialogs, tablas o bloques de UI.
---

# UI / shadcn Workflow

## MCPs

- **shadcn**: buscar e instalar componentes del registry
- **context7**: docs actualizadas de React Hook Form, Zod, TanStack Query, Motion
- **next-devtools**: errores/rutas en vivo con `npm run dev`

## Instalación preferida

1. Si no existe `components.json` → `npx shadcn@latest init`
2. Instalar vía MCP shadcn o CLI:
   ```bash
   npx shadcn@latest add button card dialog form table badge
   ```
3. Magic UI / Tailark (registry compatible):
   ```bash
   npx shadcn@latest add "https://magicui.design/r/marquee.json"
   ```

## Adaptar a la marca

Tras instalar un componente shadcn:

1. Mapear colores a `brand-*` / `gold-*` / tokens semánticos
2. Preferir `rounded-full` en botones/CTAs (ver `src/components/ui/Button.tsx`)
3. Tipografía: no sustituir Playfair Display/Lato
4. Verificar contraste en `.dark`

## Formularios

- React Hook Form + Zod (`@hookform/resolvers`)
- Componentes Form de shadcn cuando existan
- Mensajes de error en español

## Verificación

Con el dev server activo, usar **next-devtools** (`get_errors`, rutas) y el browser de Cursor para validar visualmente light/dark y mobile.
