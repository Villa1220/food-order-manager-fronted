"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/features/menu/photos";

type MenuItemRow = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  available: boolean;
  image_url: string | null;
};

type MenuCategory = {
  id: number;
  name: string;
  display_order: number;
  items: MenuItemRow[];
};

type Draft = {
  id: number | null;
  category_id: string;
  name: string;
  description: string;
  price: string;
  available: boolean;
  image_url: string | null;
  file: File | null;
  preview: string | null;
};

function emptyDraft(categoryId = ""): Draft {
  return {
    id: null,
    category_id: categoryId,
    name: "",
    description: "",
    price: "",
    available: true,
    image_url: null,
    file: null,
    preview: null,
  };
}

export default function MenuAdmin() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await apiFetch<{ categories: MenuCategory[] }>("/api/menu");
    setCategories(data.categories);
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "No se pudo cargar el menú");
    });
  }, [load]);

  function openCreate() {
    setError(null);
    const first = categories[0];
    setDraft(emptyDraft(first ? String(first.id) : ""));
  }

  function openEdit(categoryId: number, item: MenuItemRow) {
    setError(null);
    setDraft({
      id: item.id,
      category_id: String(categoryId),
      name: item.name,
      description: item.description ?? "",
      price: Number(item.price).toFixed(2),
      available: item.available,
      image_url: item.image_url,
      file: null,
      preview: mediaUrl(item.image_url, item.name),
    });
  }

  function onFile(file: File | null) {
    setDraft((current) => {
      if (!current) return current;
      if (current.preview?.startsWith("blob:")) URL.revokeObjectURL(current.preview);
      return {
        ...current,
        file,
        preview: file ? URL.createObjectURL(file) : mediaUrl(current.image_url, current.name),
      };
    });
  }

  async function save() {
    if (!draft) return;
    const price = Number(draft.price);
    if (!draft.name.trim() || !Number.isFinite(price) || price < 0) {
      setError("Escribe el nombre y un precio válido.");
      return;
    }
    if (!draft.category_id) {
      setError("Elige una categoría.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        category_id: Number(draft.category_id),
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price,
        available: draft.available,
      };
      const saved = draft.id
        ? await apiFetch<{ item: MenuItemRow }>(`/api/menu/items/${draft.id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : await apiFetch<{ item: MenuItemRow }>("/api/menu/items", {
            method: "POST",
            body: JSON.stringify(body),
          });
      if (draft.file) {
        const dataUrl = await readFile(draft.file);
        await apiFetch(`/api/menu/items/${saved.item.id}/image`, {
          method: "POST",
          body: JSON.stringify({ data_url: dataUrl }),
        });
      }
      const savedName = draft.name.trim();
      const wasEdit = Boolean(draft.id);
      setDraft(null);
      await load();
      toast.success("Cambios aplicados", {
        description: wasEdit
          ? `${savedName} se actualizó en el menú.`
          : `${savedName} ya está en el menú.`,
        duration: 4500,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black italic text-brand-600">
            Menú
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Agrega platos, cambia el precio o reemplaza la foto.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo plato
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-8">
        {categories.map((category) => (
          <section key={category.id}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground/50">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {category.items.map((item) => {
                const photo = mediaUrl(item.image_url, item.name);
                return (
                  <article
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-border-subtle bg-surface p-3"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-background">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-foreground/30">
                          <ImagePlus className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-foreground/60">
                        ${Number(item.price).toFixed(2)}
                        {!item.available ? " · Agotado" : ""}
                      </p>
                      <button
                        type="button"
                        onClick={() => openEdit(category.id, item)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {draft ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-black italic text-brand-600">
                {draft.id ? "Editar plato" : "Nuevo plato"}
              </h2>
              <button type="button" onClick={() => setDraft(null)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <label className="block">
                <span className="font-semibold">Categoría</span>
                <select
                  value={draft.category_id}
                  onChange={(event) =>
                    setDraft({ ...draft, category_id: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-background px-3 py-2"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-semibold">Nombre</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-background px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="font-semibold">Descripción</span>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-background px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="font-semibold">Precio</span>
                <input
                  inputMode="decimal"
                  value={draft.price}
                  onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-background px-3 py-2"
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.available}
                  onChange={(event) =>
                    setDraft({ ...draft, available: event.target.checked })
                  }
                />
                Disponible
              </label>
              <div>
                <p className="font-semibold">Foto</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-24 w-24 overflow-hidden rounded-lg bg-background">
                    {draft.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={draft.preview} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <label
                    className={cn(
                      "cursor-pointer rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold",
                    )}
                  >
                    {draft.preview ? "Cambiar foto" : "Agregar foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => onFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="mt-5 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}
