"use client";

import { useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { es } from "date-fns/locale";
import "react-day-picker/style.css";
import { apiFetch } from "@/lib/api";
import { dailyTicketNumber } from "@/features/orders/types";
import { reportPdfBlob, type DailyReport } from "@/features/reports/reportPdf";

type ReportOrder = {
  id: number;
  order_code: string;
  table_number: string | null;
  channel: string;
  status: string;
  subtotal: string;
  received_at: string;
  items_label: string;
  payment_label: string;
};

const STATUS_LABEL: Record<string, string> = {
  recibido: "Pendiente",
  en_preparacion: "En cocina",
  listo: "Listo",
  entregado: "Entregado",
};

function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function hourLabel(iso: string, withDay: boolean): string {
  const time = new Date(iso).toLocaleTimeString("es-EC", {
    timeZone: "America/Guayaquil",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  if (!withDay) return time;
  const day = new Date(iso).toLocaleDateString("es-EC", {
    timeZone: "America/Guayaquil",
    day: "2-digit",
    month: "2-digit",
  });
  return `${day} ${time}`;
}

function pretty(date: Date): string {
  return date.toLocaleDateString("es-EC", { day: "numeric", month: "short" });
}

function selectedBounds(range: DateRange | undefined): { from: string; to: string } {
  if (!range?.from) {
    throw new Error("Elige el primer día y luego el último.");
  }
  const from = isoDate(range.from);
  const to = isoDate(range.to ?? range.from);
  return from <= to ? { from, to } : { from: to, to: from };
}

function money(value: string | number): string {
  return `$${Number(value).toFixed(2)}`;
}

export default function ReportesPage() {
  const [range, setRange] = useState<DateRange | undefined>({ from: today(), to: today() });
  const [orders, setOrders] = useState<ReportOrder[] | null>(null);
  const [searched, setSearched] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [whatsappOk, setWhatsappOk] = useState<boolean | null>(null);

  async function search() {
    setLoading(true);
    setError(null);
    try {
      const bounds = selectedBounds(range);
      const data = await apiFetch<{ orders: ReportOrder[] }>(
        `/api/reports?from=${bounds.from}&to=${bounds.to}`,
      );
      setOrders(data.orders);
      setSearched(`${bounds.from}:${bounds.to}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los pedidos");
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const bounds = selectedBounds(range);
      const data = await apiFetch<{
        report: DailyReport;
        whatsapp: { ok: boolean };
      }>("/api/reports", {
        method: "POST",
        body: JSON.stringify(bounds),
      });
      setReport(data.report);
      setWhatsappOk(data.whatsapp.ok);
      const blob = reportPdfBlob(data.report);
      const url = URL.createObjectURL(blob);
      setPdfUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return url;
      });
      const list = await apiFetch<{ orders: ReportOrder[] }>(
        `/api/reports?from=${bounds.from}&to=${bounds.to}`,
      );
      setOrders(list.orders);
      setSearched(`${bounds.from}:${bounds.to}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el reporte");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="pb-16">
      <h1 className="font-display text-4xl font-black italic text-brand-600">Reportes</h1>
      <p className="mt-1 max-w-xl text-sm text-foreground/60">
        Toca el primer día y luego el último. Buscar muestra esas comandas y Generar
        reporte suma los dos días. Sábado y domingo a las 6 de la tarde se envía el cierre de ese día.
      </p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="report-calendar rounded-3xl border border-border-subtle bg-surface p-4 shadow-sm">
          <DayPicker
            mode="range"
            locale={es}
            weekStartsOn={1}
            selected={range}
            onSelect={setRange}
            disabled={{ after: today() }}
            captionLayout="label"
          />
          <p className="px-3 pb-2 text-center text-sm text-foreground/60">
            {range?.from
              ? range.to && isoDate(range.to) !== isoDate(range.from)
                ? `${pretty(range.from)} al ${pretty(range.to)}`
                : pretty(range.from)
              : "Toca el primer día y luego el último."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 px-2 pb-2">
            <button
              type="button"
              onClick={() => void search()}
              disabled={loading}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {loading ? "Buscando…" : "Buscar"}
            </button>
            <button
              type="button"
              onClick={() => void generate()}
              disabled={generating}
              className="rounded-xl border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 disabled:opacity-40"
            >
              {generating ? "Generando…" : "Generar reporte"}
            </button>
          </div>
        </div>

        <section>
          {error ? (
            <p className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          {orders == null ? (
            <p className="rounded-xl border border-dashed border-border-subtle p-8 text-sm text-foreground/50">
              Elige un día y pulsa Buscar.
            </p>
          ) : orders.length === 0 ? (
            <p className="rounded-xl border border-border-subtle bg-surface p-6 text-sm text-foreground/60">
              Ese día no tiene pedidos.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border-subtle text-xs uppercase tracking-wide text-foreground/45">
                  <tr>
                    <th className="px-4 py-3">Nº</th>
                    <th className="px-4 py-3">Hora</th>
                    <th className="px-4 py-3">Mesa</th>
                    <th className="px-4 py-3">Pedido</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Pago</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-3 font-display text-xl font-black text-brand-600">
                        {dailyTicketNumber(order.order_code)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {hourLabel(
                          order.received_at,
                          Boolean(searched && searched.slice(0, 10) !== searched.slice(11)),
                        )}
                      </td>
                      <td className="px-4 py-3">{order.table_number ?? "—"}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-foreground/45">{order.order_code}</p>
                        <p>{order.items_label}</p>
                      </td>
                      <td className="px-4 py-3">{STATUS_LABEL[order.status] ?? order.status}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.payment_label}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {money(order.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {searched ? (
                <p className="px-4 py-3 text-xs text-foreground/45">
                  {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {report ? (
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border-subtle bg-surface p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/50">
              Mensaje
            </h2>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {report.message}
            </pre>
            <p className="mt-3 text-xs text-foreground/50">
              {whatsappOk
                ? "Enviado por WhatsApp a 0984266777, 0987478066, 0963079890 y 0995064050."
                : "El mensaje está listo, pero WhatsApp no lo entregó. Cada número tiene que haber escrito al negocio en las últimas 24 horas."}
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/50">
                PDF
              </h2>
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  download={`cierre-${report.from}${report.to === report.from ? "" : `-${report.to}`}.pdf`}
                  className="text-xs font-semibold text-brand-700"
                >
                  Descargar
                </a>
              ) : null}
            </div>
            {pdfUrl ? (
              <iframe title="Cierre del día" src={pdfUrl} className="h-[520px] w-full bg-white" />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
