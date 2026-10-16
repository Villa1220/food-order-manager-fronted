"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type StaffRole = "admin" | "mesero" | "pendiente";

type StaffMember = {
  id: string;
  email: string;
  full_name: string;
  role: StaffRole;
  created_at: string;
};

const ROLE_LABEL: Record<StaffRole, string> = {
  pendiente: "En espera",
  mesero: "Mesero",
  admin: "Administrador",
};

export default function MeserosPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ staff: StaffMember[] }>("/api/staff");
      setStaff(data.staff);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el personal");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function assign(member: StaffMember, role: StaffRole) {
    if (member.role === role) return;
    setSavingId(member.id);
    setError(null);
    try {
      await apiFetch(`/api/staff/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el rol");
    } finally {
      setSavingId(null);
    }
  }

  const waiting = staff.filter((member) => member.role === "pendiente");

  return (
    <div>
      <h1 className="font-display text-3xl font-black italic text-brand-600">
        Meseros
      </h1>
      <p className="mt-2 max-w-xl text-sm text-foreground/70">
        Quien inicia sesión con Google queda en espera. Aquí eliges si entra como
        mesero o como administrador.
      </p>
      {error ? (
        <p className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <p className="mt-6 text-xs font-bold uppercase tracking-wide text-foreground/45">
        En espera ({waiting.length})
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {staff.length === 0 ? (
          <li className="text-sm text-foreground/45">Nadie ha iniciado sesión todavía.</li>
        ) : (
          staff.map((member) => (
            <li
              key={member.id}
              className={cn(
                "rounded-xl border bg-surface p-4",
                member.role === "pendiente"
                  ? "border-gold-400"
                  : "border-border-subtle",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{member.full_name}</p>
                  <p className="text-sm text-foreground/60">{member.email}</p>
                </div>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs font-bold">
                  {ROLE_LABEL[member.role]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["mesero", "admin", "pendiente"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    disabled={savingId === member.id || member.role === role}
                    onClick={() => void assign(member, role)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40",
                      member.role === role
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-border-subtle hover:border-brand-400",
                    )}
                  >
                    {ROLE_LABEL[role]}
                  </button>
                ))}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
