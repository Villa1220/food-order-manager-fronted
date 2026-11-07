"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/useSession";

type RankedDish = { name: string; units: number; orders: number };
type RankedPerson = { name: string; role: string; orders: number };
type MonthSales = {
  month: string;
  orders: number;
  income: string;
  efectivo: string;
  transferencia: string;
};

type DashboardReport = {
  month: string;
  months: string[];
  orders: number;
  income: string;
  efectivo: string;
  transferencia: string;
  ticket: string;
  dishes: RankedDish[];
  drinks: RankedDish[];
  soups: RankedDish[];
  desserts: RankedDish[];
  staff: RankedPerson[];
  byMonth: MonthSales[];
};

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function monthLabel(value: string): string {
  const [year, month] = value.split("-");
  const name = MONTHS[Number(month) - 1] ?? value;
  return `${name} ${year}`;
}

function money(value: string): string {
  return `$${Number(value).toFixed(2)}`;
}

function roleLabel(role: string): string {
  if (role === "admin") return "Administrador";
  if (role === "mesero") return "Mesero";
  return role;
}

function RankingChart({
  rows,
  color,
}: {
  rows: RankedDish[];
  color: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-foreground/55">Sin ventas en este período.</p>;
  }
  const height = Math.max(180, rows.length * 42);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#eadfce" />
          <XAxis type="number" allowDecimals={false} tick={{ fill: "#7c6a58", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={148}
            tick={{ fill: "#3d2b1f", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "#fdf3ec" }}
            formatter={(value, _name, item) => {
              const orders = (item.payload as RankedDish).orders;
              return [`${value} und. en ${orders} pedidos`, "Vendidos"];
            }}
          />
          <Bar dataKey="units" fill={color} radius={[0, 8, 8, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartCard({
  title,
  rows,
  color,
}: {
  title: string;
  rows: RankedDish[];
  color: string;
}) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-4">
      <h2 className="font-display text-xl font-black text-brand-700">{title}</h2>
      <div className="mt-3">
        <RankingChart rows={rows} color={color} />
      </div>
    </section>
  );
}

export function Dashboard() {
  const user = useSession();
  const [month, setMonth] = useState("all");
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch<DashboardReport>(`/api/reports/dashboard?month=${month}`)
      .then((data) => {
        if (!active) return;
        setReport(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No pude cargar el panel.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [month]);

  const monthOptions = report?.months ?? [];

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black italic text-brand-600">Panel</h1>
          <p className="mt-2 max-w-2xl text-foreground/75">
            Hola, {user?.fullName}. Aquí están las mesas atendidas: fines de semana, más el 2 y el 3
            de noviembre. No entran las pruebas de entre semana ni las comandas de solo postre.
          </p>
        </div>
        <label className="text-sm text-foreground/70">
          Período
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="mt-1 block rounded-xl border border-border-subtle bg-surface px-3 py-2 text-foreground"
          >
            <option value="all">Todo lo atendido</option>
            {monthOptions.map((value) => (
              <option key={value} value={value}>
                {monthLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}

      {loading ? <p className="mt-6 text-sm text-foreground/60">Cargando el panel…</p> : null}

      {!loading && report ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl bg-brand-600 px-4 py-4 text-white">
              <p className="text-sm text-white/80">Mesas atendidas</p>
              <p className="mt-1 font-display text-4xl font-black">{report.orders}</p>
            </article>
            <article className="rounded-2xl border border-border-subtle bg-surface px-4 py-4">
              <p className="text-sm text-foreground/60">Ingresos cobrados</p>
              <p className="mt-1 font-display text-4xl font-black text-brand-700">{money(report.income)}</p>
              <p className="mt-1 text-xs text-foreground/55">
                Efectivo {money(report.efectivo)} · Transferencia {money(report.transferencia)}
              </p>
            </article>
            <article className="rounded-2xl border border-border-subtle bg-surface px-4 py-4">
              <p className="text-sm text-foreground/60">Ticket promedio</p>
              <p className="mt-1 font-display text-4xl font-black text-brand-700">{money(report.ticket)}</p>
            </article>
          </div>

          <section className="mt-4 rounded-2xl border border-border-subtle bg-surface p-4">
            <h2 className="font-display text-xl font-black text-brand-700">Ingresos por mes</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Todos los meses atendidos, comparados. No cambia al elegir un mes arriba.
            </p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(report.byMonth ?? []).map((item) => ({
                    name: monthLabel(item.month),
                    efectivo: Number(item.efectivo),
                    transferencia: Number(item.transferencia),
                    orders: item.orders,
                  }))}
                  margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#eadfce" />
                  <XAxis dataKey="name" tick={{ fill: "#3d2b1f", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#7c6a58", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "#fdf3ec" }}
                    formatter={(value, name) => [
                      money(String(value ?? 0)),
                      name === "efectivo" ? "Efectivo" : "Transferencia",
                    ]}
                  />
                  <Bar dataKey="efectivo" stackId="ingreso" fill="#d14a04" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="transferencia" stackId="ingreso" fill="#0f766e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-foreground/55">
                <tr>
                  <th className="py-1 font-medium">Mes</th>
                  <th className="py-1 font-medium">Pedidos</th>
                  <th className="py-1 font-medium">Efectivo</th>
                  <th className="py-1 font-medium">Transferencia</th>
                  <th className="py-1 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {(report.byMonth ?? []).map((item) => (
                  <tr key={item.month} className="border-t border-border-subtle">
                    <td className="py-2 capitalize">{monthLabel(item.month)}</td>
                    <td className="py-2 tabular-nums">{item.orders}</td>
                    <td className="py-2 tabular-nums">{money(item.efectivo)}</td>
                    <td className="py-2 tabular-nums">{money(item.transferencia)}</td>
                    <td className="py-2 font-semibold tabular-nums">{money(item.income)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Platos más vendidos" rows={report.dishes} color="#d14a04" />
            <ChartCard title="Bebidas más vendidas" rows={report.drinks} color="#0f766e" />
            <ChartCard title="Sopas más vendidas" rows={report.soups} color="#b45309" />
            <ChartCard title="Postres más vendidos" rows={report.desserts} color="#be185d" />
          </div>

          <section className="mt-4 rounded-2xl border border-border-subtle bg-surface p-4">
            <h2 className="font-display text-xl font-black text-brand-700">Quién tomó los pedidos</h2>
            <ol className="mt-3 space-y-2">
              {report.staff.map((person, index) => (
                <li key={person.name} className="flex items-center justify-between gap-3 rounded-xl bg-brand-50 px-3 py-2">
                  <span>
                    <span className="mr-2 font-display text-lg font-black text-brand-600">{index + 1}</span>
                    {person.name}
                    <span className="ml-2 text-xs uppercase tracking-wide text-foreground/45">
                      {roleLabel(person.role)}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{person.orders}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : null}
    </div>
  );
}
