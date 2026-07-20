"use client";

import { fmtDurasi } from "@/lib/calc";
import type { LineStopRow } from "@/lib/calc";

/** Tabel info line stop (jam, keterangan, durasi) — dipakai di halaman Input sebagai preview. */
export default function LineStopTable({ rows }: { rows: LineStopRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Line Stop
      </h3>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Jam</th>
              <th className="px-3 py-2 font-semibold">Keterangan</th>
              <th className="px-3 py-2 text-right font-semibold">Durasi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="num px-3 py-2 whitespace-nowrap">
                  {r.mulai}-{r.selesai}
                </td>
                <td className="px-3 py-2 text-muted">{r.keterangan || "-"}</td>
                <td className="num px-3 py-2 text-right whitespace-nowrap">
                  {fmtDurasi(r.menit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
