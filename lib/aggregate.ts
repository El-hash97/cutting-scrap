import { round } from "./calc";
import type { Entry } from "./types";

export interface MpStat {
  nama: string;
  count: number;
  totalTypeA: number;
  totalTypeB: number;
  totalLembar: number;
  totalBerat: number;
  totalDurasiEfektif: number; // menit
  kecepatan: number; // lembar/menit gabungan
}

/** Ringkasan total global. */
export function totals(entries: Entry[]) {
  const totalBerat = round(
    entries.reduce((s, e) => s + e.totalBerat, 0),
    1
  );
  const totalLembar = entries.reduce((s, e) => s + e.totalLembar, 0);
  const mp = new Set(entries.map((e) => e.namaMP.toLowerCase())).size;
  return { totalBerat, totalLembar, count: entries.length, mpCount: mp };
}

/** Statistik per MP, diurutkan berdasar total berat (desc). */
export function statsByMp(entries: Entry[]): MpStat[] {
  const map = new Map<string, MpStat>();
  for (const e of entries) {
    const key = e.namaMP.trim().toLowerCase();
    const cur =
      map.get(key) ??
      ({
        nama: e.namaMP.trim(),
        count: 0,
        totalTypeA: 0,
        totalTypeB: 0,
        totalLembar: 0,
        totalBerat: 0,
        totalDurasiEfektif: 0,
        kecepatan: 0,
      } satisfies MpStat);
    cur.count += 1;
    cur.totalTypeA += e.typeA;
    cur.totalTypeB += e.typeB;
    cur.totalLembar += e.totalLembar;
    cur.totalBerat = round(cur.totalBerat + e.totalBerat, 1);
    cur.totalDurasiEfektif += e.durasiEfektif;
    map.set(key, cur);
  }
  const list = [...map.values()];
  for (const s of list) {
    s.kecepatan =
      s.totalDurasiEfektif > 0
        ? round(s.totalLembar / s.totalDurasiEfektif, 2)
        : 0;
  }
  return list.sort((a, b) => b.totalBerat - a.totalBerat);
}

/** Tren produksi harian (berat kg & lembar) diurutkan menaik per tanggal. */
export function dailyTrend(
  entries: Entry[]
): { tanggal: string; berat: number; lembar: number }[] {
  const map = new Map<string, { berat: number; lembar: number }>();
  for (const e of entries) {
    const cur = map.get(e.tanggal) ?? { berat: 0, lembar: 0 };
    cur.berat = round(cur.berat + e.totalBerat, 1);
    cur.lembar += e.totalLembar;
    map.set(e.tanggal, cur);
  }
  return [...map.entries()]
    .map(([tanggal, v]) => ({ tanggal, ...v }))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}
