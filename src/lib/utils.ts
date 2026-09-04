import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma segura (evita conflictos cuando se
 * mezclan clases condicionales). Es el helper estandar que usan los
 * componentes de shadcn/ui - se deja aqui desde ya para que
 * `npx shadcn@latest init` lo detecte y no lo sobrescriba con uno distinto.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
