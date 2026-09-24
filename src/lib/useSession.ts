"use client";

import { useEffect, useState } from "react";
import { readSession, type SessionUser } from "@/lib/auth";

export function useSession() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    setUser(readSession()?.user ?? null);
  }, []);

  return user;
}
