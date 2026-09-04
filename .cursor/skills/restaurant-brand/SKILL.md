---
name: restaurant-brand
description: Aplica la identidad visual de La Ruta del Sabor (paleta gold/brand, tipografía, CTAs, WhatsApp, menú). Usar al diseñar o editar UI, landing, menú, hero, footer o cualquier pantalla del restaurante.
---

# Restaurant Brand — La Ruta del Sabor

## Cuándo usar

Diseño, landing, menú, CTAs, tema light/dark, o copy orientado a clientes.

## Identidad

- **Nombre:** La Ruta del Sabor (Quito–Perucho)
- **Voz:** cálida, familiar, ecuatoriana; sin jerga técnica en UI pública
- **Contacto canónico:** `src/lib/contact.ts` → `CONTACT` (WhatsApp, maps, redes)

## Tokens

Definidos en `src/app/globals.css`:

| Uso | Token / clase |
|-----|----------------|
| Primario CTA | `brand-600` / `bg-brand-600` |
| Acento dorado | `gold-400` |
| Fondo / texto | `background`, `foreground`, `surface` |
| Display | `font-display` |
| Cuerpo | `font-sans` |

## Checklist UI

1. ¿Usa la paleta del logo (no purple genérico)?
2. ¿Títulos con `font-display`?
3. ¿CTA con `ButtonLink` / `buttonVariants`?
4. ¿WhatsApp apunta a `CONTACT.whatsappUrl`?
5. ¿Platos/precios vienen de `src/features/menu/data.ts`?
6. ¿Se ve bien en light y dark?

## Hero

Primera viewport: marca + un headline + una frase + grupo CTA + imagen dominante. Sin stats, chips flotantes ni cards en el hero.
