"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  ANALYTICS_EXCLUDE_KEY,
  GA_MEASUREMENT_ID,
  isAnalyticsConfigured,
} from "@/lib/analytics";

/**
 * Carga GA4 solo en producción, con ID configurado, y si el visitante
 * no se excluyó (p. ej. dueño con ?analytics=off).
 */
export function SiteAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isAnalyticsConfigured()) return;

    const params = new URLSearchParams(window.location.search);
    const flag = params.get("analytics");

    if (flag === "off") {
      window.localStorage.setItem(ANALYTICS_EXCLUDE_KEY, "1");
      return;
    }
    if (flag === "on") {
      window.localStorage.removeItem(ANALYTICS_EXCLUDE_KEY);
    }

    if (window.localStorage.getItem(ANALYTICS_EXCLUDE_KEY) === "1") return;

    setAllowed(true);
  }, []);

  if (!allowed || !GA_MEASUREMENT_ID) return null;

  return <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
