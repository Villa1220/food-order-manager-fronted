"use client";

import { useSession } from "@/lib/useSession";

export default function PanelHomePage() {
  const user = useSession();

  return (
    <div>
      <h1 className="font-display text-3xl font-black italic text-brand-600">
        Panel
      </h1>
      <p className="mt-2 max-w-xl text-foreground/75">
        Hola, {user?.fullName}. Desde aquí se gestiona el restaurante. La cocina
        (KDS) es una pantalla aparte, pensada para el monitor del turno — no se
        desarrolla dentro de Iniciar sesión.
      </p>
    </div>
  );
}
