"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Barbell,
  Medal,
  Package,
  Stack,
  UsersThree,
  Lightning,
} from "@phosphor-icons/react";
import { format, parseISO, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Card, EmptyState, Segmented, StatTile } from "@/components/ui";
import { useEntries } from "@/lib/hooks";
import { dailyTrend, statsByMp, totals } from "@/lib/aggregate";
import { fmtKg, fmtLembar } from "@/lib/calc";
import type { Entry } from "@/lib/types";

type Period = "today" | "week" | "all";

function inPeriod(e: Entry, period: Period, today: string): boolean {
  if (period === "all") return true;
  if (period === "today") return e.tanggal === today;
  const from = format(subDays(parseISO(today), 6), "yyyy-MM-dd");
  return e.tanggal >= from && e.tanggal <= today;
}

function shortDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM", { locale: idLocale });
  } catch {
    return iso;
  }
}

export default function DashboardPage() {
  const [entries] = useEntries();
  const [period, setPeriod] = useState<Period>("week");
  const today = format(new Date(), "yyyy-MM-dd");

  const filtered = useMemo(
    () => entries.filter((e) => inPeriod(e, period, today)),
    [entries, period, today]
  );

  const t = useMemo(() => totals(filtered), [filtered]);
  const byMp = useMemo(() => statsByMp(filtered), [filtered]);
  const trend = useMemo(() => dailyTrend(filtered), [filtered]);
  const topSpeed = useMemo(
    () => [...byMp].sort((a, b) => b.kecepatan - a.kecepatan).slice(0, 5),
    [byMp]
  );
  const maxBerat = Math.max(1, ...byMp.map((m) => m.totalBerat));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Ringkasan operasional & tren produksi.
          </p>
        </div>
        <div className="w-full sm:w-[280px]">
          <Segmented<Period>
            value={period}
            onChange={setPeriod}
            options={[
              { value: "today", label: "Hari ini" },
              { value: "week", label: "7 hari" },
              { value: "all", label: "Semua" },
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title="Belum ada data pada periode ini"
          desc="Tambahkan hasil cutting di halaman Input untuk melihat ringkasan."
        />
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Total berat"
              value={fmtKg(t.totalBerat)}
              unit="kg"
              accent="brand"
            />
            <StatTile label="Total lembar" value={fmtLembar(t.totalLembar)} unit="lbr" />
            <StatTile label="Jumlah entry" value={fmtLembar(t.count)} />
            <StatTile label="Jumlah MP" value={fmtLembar(t.mpCount)} />
          </div>

          {/* Trend chart */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Stack size={18} weight="bold" className="text-brand-strong" />
              <h2 className="font-semibold">Tren produksi (kg)</h2>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="tanggal"
                    tickFormatter={shortDate}
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--surface-2)" }}
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                      fontSize: 13,
                    }}
                    labelFormatter={(l) => shortDate(String(l))}
                    formatter={(v) => [`${fmtKg(Number(v))} kg`, "Berat"]}
                  />
                  <Bar dataKey="berat" fill="var(--brand)" radius={[6, 6, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Kontribusi per MP */}
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <UsersThree size={18} weight="bold" className="text-brand-strong" />
                <h2 className="font-semibold">Hasil per MP</h2>
              </div>
              <ul className="space-y-3">
                {byMp.map((m) => (
                  <li key={m.nama}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">{m.nama}</span>
                      <span className="num text-muted">{fmtKg(m.totalBerat)} kg</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${(m.totalBerat / maxBerat) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Leaderboard */}
            <div className="space-y-4">
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Barbell size={18} weight="bold" className="text-brand-strong" />
                  <h2 className="font-semibold">Top hasil (kg)</h2>
                </div>
                <Ranking
                  rows={byMp.slice(0, 5).map((m) => ({
                    nama: m.nama,
                    value: `${fmtKg(m.totalBerat)} kg`,
                  }))}
                />
              </Card>
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Lightning size={18} weight="bold" className="text-brand-strong" />
                  <h2 className="font-semibold">Kecepatan terbaik</h2>
                </div>
                <Ranking
                  rows={topSpeed.map((m) => ({
                    nama: m.nama,
                    value: `${m.kecepatan.toLocaleString("id-ID")} lbr/mnt`,
                  }))}
                />
              </Card>
            </div>
          </div>

          <p className="text-center text-xs text-muted">
            Butuh detail per orang?{" "}
            <Link href="/performance" className="font-semibold underline underline-offset-2">
              Buka halaman Performa
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}

function Ranking({ rows }: { rows: { nama: string; value: string }[] }) {
  const medal = ["text-amber-500", "text-zinc-400", "text-amber-700"];
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li key={r.nama} className="flex items-center gap-3">
          <span className="grid size-6 shrink-0 place-items-center">
            {i < 3 ? (
              <Medal size={20} weight="fill" className={medal[i]} />
            ) : (
              <span className="num text-sm font-semibold text-muted">{i + 1}</span>
            )}
          </span>
          <span className="flex-1 truncate text-sm font-medium">{r.nama}</span>
          <span className="num text-sm text-muted">{r.value}</span>
        </li>
      ))}
    </ol>
  );
}
