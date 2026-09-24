"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import {
  Beef,
  CupSoda,
  Expand,
  IceCream2,
  Soup,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MENU_CATEGORIES, MENU_ITEMS, type MenuCategoryId, type MenuItem } from "./data";
import { mediaUrl } from "./photos";
import { API_URL } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { MENU_ITEM_I18N } from "@/lib/i18n/menu-i18n";

function isSoldOutSlide(slide: object): boolean {
  return "soldOut" in slide && slide.soldOut === true;
}

type FilterId = "todos" | MenuCategoryId;

const CATEGORY_ICONS: Record<FilterId, LucideIcon> = {
  todos: UtensilsCrossed,
  "platos-fuertes": Beef,
  "sopas-caldos": Soup,
  bebidas: CupSoda,
  postres: IceCream2,
};

type ApiMenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  available: boolean;
  image_url: string | null;
};

type ApiCategory = {
  id: number;
  name: string;
  items: ApiMenuItem[];
};

function categoryIdFromName(name: string): MenuCategoryId {
  const value = name.toLowerCase();
  if (value.includes("sopa")) return "sopas-caldos";
  if (value.includes("bebida")) return "bebidas";
  if (value.includes("postre")) return "postres";
  return "platos-fuertes";
}

function money(price: string | number): string {
  return `$${Number(price).toFixed(2)}`;
}

export function MenuSection() {
  const { locale, t } = useLanguage();
  const [active, setActive] = useState<FilterId>("todos");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [catalog, setCatalog] = useState<MenuItem[]>(MENU_ITEMS);

  useEffect(() => {
    let cancelled = false;
    void fetch(`${API_URL}/api/menu`)
      .then((response) => response.json())
      .then((data: { categories?: ApiCategory[] }) => {
        if (cancelled || !data.categories?.length) return;
        const next: MenuItem[] = [];
        for (const category of data.categories) {
          const categoryId = categoryIdFromName(category.name);
          for (const item of category.items) {
            const known = MENU_ITEMS.find((row) => row.name === item.name);
            next.push({
              id: known?.id ?? `db-${item.id}`,
              name: item.name,
              price: money(item.price),
              description: item.description ?? undefined,
              category: categoryId,
              featured: item.available ? known?.featured : false,
              image: mediaUrl(item.image_url, item.name) ?? undefined,
              available: item.available,
            });
          }
        }
        if (next.length > 0) setCatalog(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const filters: { id: FilterId; label: string }[] = useMemo(
    () => [
      { id: "todos", label: t.menu.all },
      ...MENU_CATEGORIES.map((cat) => ({
        id: cat.id,
        label: t.menu.categories[cat.id] ?? cat.label,
      })),
    ],
    [t],
  );

  const localizedItems = useMemo(
    () =>
      catalog.map((item) => {
        const i18n = MENU_ITEM_I18N[item.id]?.[locale];
        return {
          ...item,
          name: i18n?.name ?? item.name,
          description: i18n?.description ?? item.description,
        };
      }),
    [catalog, locale],
  );

  const items = useMemo(
    () =>
      active === "todos"
        ? localizedItems
        : localizedItems.filter((item) => item.category === active),
    [active, localizedItems],
  );

  const itemsWithImage = useMemo(
    () => items.filter((item) => Boolean(item.image)),
    [items],
  );

  const slides = useMemo(
    () =>
      itemsWithImage.map((item) => ({
        src: item.image!,
        alt: item.name,
        soldOut: item.available === false,
        description: (
          <div className="mx-auto flex max-w-md flex-col items-center gap-1.5 text-center">
            <span className="font-display text-lg font-black italic text-gold-400">
              {item.name}
            </span>
            <span className="rounded-full bg-gold-400 px-2.5 py-0.5 text-xs font-bold text-black">
              {item.price}
            </span>
            {item.description && (
              <span className="text-sm text-cream/75">{item.description}</span>
            )}
          </div>
        ),
      })),
    [itemsWithImage],
  );

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-3">
        {filters.map((filter) => {
          const isActive = filter.id === active;
          const Icon = CATEGORY_ICONS[filter.id];
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActive(filter.id)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                isActive
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                  : "border border-border-subtle bg-surface text-foreground-muted hover:border-gold-400 hover:text-gold-500"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {filter.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${active}-${locale}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => {
            const soldOut = item.available === false;
            const imageIndex = item.image
              ? itemsWithImage.findIndex((i) => i.id === item.id)
              : -1;

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-lg",
                  !item.image && "p-6",
                )}
              >
                {item.featured && !soldOut && (
                  <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gold-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-black shadow">
                    <Star className="h-3 w-3 fill-black" aria-hidden="true" />
                    {t.menu.specialty}
                  </span>
                )}

                {item.image && (
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(imageIndex)}
                    aria-label={`${t.menu.enlarge}: ${item.name}`}
                    className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-background"
                  >
                    {item.image.startsWith("http") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className={cn(
                          "h-full w-full object-cover transition duration-300",
                          soldOut
                            ? "grayscale"
                            : "group-hover:scale-105",
                        )}
                      />
                    ) : (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                        className={cn(
                          "object-cover transition duration-300",
                          soldOut
                            ? "grayscale"
                            : "group-hover:scale-105",
                        )}
                      />
                    )}
                    {soldOut ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <span className="rounded-md bg-white/90 px-3 py-1 text-lg font-black uppercase tracking-wide text-red-600">
                          Agotado
                        </span>
                      </span>
                    ) : null}
                    <div className={cn(
                      "absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition duration-300 group-hover:bg-black/40 group-hover:opacity-100",
                      soldOut && "hidden",
                    )}>
                      <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-black shadow">
                        <Expand className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.menu.enlarge}
                      </span>
                    </div>
                  </button>
                )}

                <div className={cn("flex flex-col gap-2", item.image && "p-6")}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-sans text-lg font-bold leading-snug text-foreground">
                      {item.name}
                    </h3>
                    <span className="whitespace-nowrap rounded-full bg-gold-400 px-3 py-1 text-sm font-bold text-black">
                      {item.price}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-foreground-muted">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <Lightbox
        open={lightboxIndex !== null}
        close={() => setLightboxIndex(null)}
        index={lightboxIndex ?? 0}
        slides={slides}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
        plugins={[Zoom, Captions]}
        render={{
          slideContainer: ({ slide, children }) => (
            <div className={cn(isSoldOutSlide(slide) && "[&_img]:grayscale")}>{children}</div>
          ),
          slideHeader: ({ slide }) =>
            isSoldOutSlide(slide) ? (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                <span className="rounded-md bg-white/90 px-4 py-1.5 text-3xl font-black uppercase tracking-wide text-red-600">
                  Agotado
                </span>
              </div>
            ) : null,
        }}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true, doubleTapDelay: 250 }}
        styles={{
          container: { backgroundColor: "rgba(15, 12, 9, 0.96)" },
          captionsDescriptionContainer: {
            backgroundColor: "rgba(15, 12, 9, 0.88)",
            padding: "24px 20px 20px",
          },
          captionsDescription: {
            display: "block",
            WebkitLineClamp: "unset",
            overflow: "visible",
            textAlign: "center",
            color: "inherit",
            fontFamily: "var(--font-lato)",
          },
        }}
      />
    </div>
  );
}
