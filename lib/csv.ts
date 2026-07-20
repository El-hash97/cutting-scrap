import { fmtDurasi } from "./calc";
import type { Entry } from "./types";

const HEADERS = [
  "Tanggal",
  "Nama MP",
  "Shift",
  "Waktu",
  "Jam Mulai",
  "Jam Selesai",
  "Type A (lbr)",
  "Type B (lbr)",
  "Total Lembar",
  "Berat A (kg)",
  "Berat B (kg)",
  "Total Berat (kg)",
  "Potongan Istirahat (mnt)",
  "Potongan Line Stop (mnt)",
  "Detail Line Stop",
  "Durasi Efektif",
  "Kecepatan (lbr/mnt)",
];

function cell(v: string | number): string {
  const s = String(v);
  // Escape untuk CSV bila mengandung koma/kutip/newline.
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function entriesToCsv(entries: Entry[]): string {
  const rows = entries.map((e) =>
    [
      e.tanggal,
      e.namaMP,
      e.shift,
      e.time,
      e.jamMulai,
      e.jamSelesai + (e.lintasHari ? " (+1)" : ""),
      e.typeA,
      e.typeB,
      e.totalLembar,
      e.beratA,
      e.beratB,
      e.totalBerat,
      e.potonganIstirahat,
      e.potonganLineStop,
      e.lineStops.map((ls) => `${ls.mulai}-${ls.selesai} ${ls.keterangan}`).join(" | "),
      fmtDurasi(e.durasiEfektif),
      e.kecepatan,
    ]
      .map(cell)
      .join(",")
  );
  return [HEADERS.join(","), ...rows].join("\n");
}

/** Trigger download file CSV di browser (UTF-8 BOM agar Excel rapi). */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
