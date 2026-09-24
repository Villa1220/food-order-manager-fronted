export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

export const ANALYTICS_EXCLUDE_KEY = "lrds_analytics_exclude";

/** Solo envía datos en producción y si hay ID configurado. */
export function isAnalyticsConfigured(): boolean {
  return Boolean(GA_MEASUREMENT_ID) && process.env.NODE_ENV === "production";
}

export type AnalyticsEventName =
  | "whatsapp_click"
  | "maps_click"
  | "phone_click"
  | "menu_view"
  | "section_view"
  | "social_click"
  | "login_click"
  | "panel_click";

export function trackEvent(
  name: AnalyticsEventName,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  if (!isAnalyticsConfigured()) return;
  if (window.localStorage.getItem(ANALYTICS_EXCLUDE_KEY) === "1") return;

  const gtag = (
    window as Window & {
      gtag?: (...args: unknown[]) => void;
    }
  ).gtag;

  if (typeof gtag !== "function") return;
  gtag("event", name, params);
}
