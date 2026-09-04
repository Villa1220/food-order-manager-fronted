"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

const SECTIONS = [
  { id: "menu", label: "menu" },
  { id: "nosotros", label: "about" },
  { id: "ubicacion", label: "location" },
] as const;

/** Marca qué secciones de la landing se vieron (una vez por sección). */
export function SectionViewTracker() {
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          if (seen.current.has(section.label)) return;
          seen.current.add(section.label);
          trackEvent("section_view", { section: section.label });
          observer.disconnect();
        },
        { threshold: 0.35 },
      );

      observer.observe(el);
      observers.push(observer);
    }

    return () => {
      for (const observer of observers) observer.disconnect();
    };
  }, []);

  return null;
}
