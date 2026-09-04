---
name: design-inspiration
description: Busca inspiración web (Exa), extrae lo mejor de páginas (Firecrawl) e implementa desde Figma. Usar al pedir referencias de restaurantes, landing, menú, UI de comida, clonar ideas de diseño o traer un frame de Figma a código.
---

# Design Inspiration — Web + Figma

## Herramientas

| MCP | Uso |
|-----|-----|
| **exa** | Buscar páginas similares / mejores landings de restaurantes |
| **firecrawl** | Scrapear una URL: contenido, estructura, branding, screenshot |
| **figma** | Leer frames/links de Figma y generar código fiel |
| **browser** (Cursor) | Verificar visualmente la app local |

## Flujo: inspirarse en la web

1. **Buscar** con Exa, p. ej. “best restaurant landing page UX Ecuador food delivery”
2. Elegir 2–3 URLs fuertes
3. **Scrapear** cada una con Firecrawl (markdown + branding si está disponible)
4. Extraer solo patrones útiles: hero, menú, CTA, tipografía, espaciado — **no copiar marca ajena**
5. Adaptar a **La Ruta del Sabor** (`restaurant-brand`, tokens `gold-*` / `brand-*`)
6. Implementar en `features/` + verificar light/dark

## Flujo: desde Figma

1. Usuario pega link de frame/archivo Figma
2. Usar MCP **figma** para contexto (layout, variables, assets)
3. Si el MCP devuelve imagen/SVG en `localhost`, usar esa URL tal cual (no inventar placeholders)
4. No añadir icon packs extra si los iconos ya vienen del payload
5. Mapear a componentes existentes (`ButtonLink`, layout, tokens)

## Qué NO hacer

- No clonar logos, fotos ni copy de otros restaurantes
- No sustituir la paleta del logo por la de la referencia
- No meter cards/stats en el hero solo porque la referencia los tiene

## Prompt útil (usuario)

> “Busca landings de restaurantes con buen menú y CTA WhatsApp, scrapea las 3 mejores y propón mejoras para La Ruta del Sabor sin cambiar la marca.”
