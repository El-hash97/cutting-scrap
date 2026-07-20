import { addDays, differenceInMinutes } from "date-fns";
import type { EntryInput, LineStop, Metrics, TimeOfDay } from "./types";

/** Berat per lembar (kg). Sesuai gambar referensi & PRD. */
export const BERAT_PER_LEMBAR = {
  A: 3.5,
  B: 2.6,
} as const;

/** Window istirahat per jenis waktu kerja (menit dari tengah malam). */
const BREAK_WINDOW: Record<TimeOfDay, { startMin: number; endMin: number }> = {
  // 11:00 - 13:00
  Day: { startMin: 11 * 60, endMin: 13 * 60 },
  // 23:00 - 01:00 (melintasi tengah malam → endMin > 24 jam)
  Night: { startMin: 23 * 60, endMin: 25 * 60 },
};

/** Gabungkan "YYYY-MM-DD" + "HH:mm" menjadi Date lokal. */
export function toDate(tanggal: string, jam: string): Date {
  const [y, m, d] = tanggal.split("-").map(Number);
  const [hh, mm] = jam.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}

/** Rentang waktu irisan antara dua interval (null bila tidak beririsan). */
function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): { start: Date; end: Date } | null {
  const start = new Date(Math.max(aStart.getTime(), bStart.getTime()));
  const end = new Date(Math.min(aEnd.getTime(), bEnd.getTime()));
  return end.getTime() > start.getTime() ? { start, end } : null;
}

/** Gabungkan rentang waktu yang beririsan/bersentuhan jadi satu, lalu total menitnya. */
function mergeAndSumMinutes(ranges: { start: Date; end: Date }[]): number {
  if (ranges.length === 0) return 0;
  const sorted = [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime());
  let total = 0;
  let curStart = sorted[0].start;
  let curEnd = sorted[0].end;
  for (const r of sorted.slice(1)) {
    if (r.start.getTime() <= curEnd.getTime()) {
      if (r.end.getTime() > curEnd.getTime()) curEnd = r.end;
    } else {
      total += differenceInMinutes(curEnd, curStart);
      curStart = r.start;
      curEnd = r.end;
    }
  }
  total += differenceInMinutes(curEnd, curStart);
  return total;
}

/**
 * Ubah satu LineStop (HH:mm + tanggal shift) jadi rentang Date, dengan
 * penanganan lintas hari relatif terhadap jam mulai shift (mis. shift malam
 * 20:00 → 05:00, line stop 00:30-01:00 → digeser +1 hari).
 */
function lineStopToRange(
  tanggal: string,
  ls: LineStop,
  shiftStart: Date
): { start: Date; end: Date } {
  let start = toDate(tanggal, ls.mulai);
  let end = toDate(tanggal, ls.selesai);
  if (end.getTime() <= start.getTime()) end = addDays(end, 1);
  if (start.getTime() < shiftStart.getTime()) {
    start = addDays(start, 1);
    end = addDays(end, 1);
  }
  return { start, end };
}

export type ShiftInput = Pick<EntryInput, "tanggal" | "jamMulai" | "jamSelesai" | "time">;

/**
 * Hitung rentang shift (termasuk lintas hari) & window istirahat baku mentah.
 * Dipakai bersama oleh computeMetrics & computeTimeline agar aturan
 * cross-day dan window istirahat punya satu sumber kebenaran.
 */
function computeShiftRange(input: ShiftInput): {
  start: Date;
  end: Date;
  lintasHari: boolean;
  breakStart: Date;
  breakEnd: Date;
} {
  const start = toDate(input.tanggal, input.jamMulai);
  let end = toDate(input.tanggal, input.jamSelesai);

  // Lintas hari: selesai lebih awal/sama dari mulai → tambah 1 hari.
  let lintasHari = false;
  if (end.getTime() <= start.getTime()) {
    end = addDays(end, 1);
    lintasHari = true;
  }

  // Window istirahat diukur relatif terhadap tanggal mulai (tengah malam).
  const midnight = toDate(input.tanggal, "00:00");
  const win = BREAK_WINDOW[input.time];
  const breakStart = new Date(midnight.getTime() + win.startMin * 60000);
  const breakEnd = new Date(midnight.getTime() + win.endMin * 60000);

  return { start, end, lintasHari, breakStart, breakEnd };
}

/** Bulatkan ke maksimal `d` desimal tanpa jejak nol. */
export function round(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round((n + Number.EPSILON) * f) / f;
}

/**
 * Hitung semua metrik turunan dari input.
 * Menangani pengurangan istirahat & shift lintas hari (night 20:00 → 05:00).
 */
export function computeMetrics(input: EntryInput): Metrics {
  const typeA = Math.max(0, Number(input.typeA) || 0);
  const typeB = Math.max(0, Number(input.typeB) || 0);

  const beratA = round(typeA * BERAT_PER_LEMBAR.A, 2);
  const beratB = round(typeB * BERAT_PER_LEMBAR.B, 2);
  const totalLembar = typeA + typeB;
  const totalBerat = round(beratA + beratB, 2);

  // Tanpa jam mulai/selesai lengkap, durasi & kecepatan belum bisa dihitung.
  if (!input.tanggal || !input.jamMulai || !input.jamSelesai) {
    return {
      beratA,
      beratB,
      totalLembar,
      totalBerat,
      durasiKotor: 0,
      potonganIstirahat: 0,
      potonganLineStop: 0,
      durasiEfektif: 0,
      kecepatan: 0,
      lintasHari: false,
    };
  }

  const { start, end, lintasHari, breakStart, breakEnd } = computeShiftRange(input);

  const durasiKotor = Math.max(0, differenceInMinutes(end, start));

  const breakOverlap = rangesOverlap(start, end, breakStart, breakEnd);
  const potonganIstirahat = breakOverlap
    ? differenceInMinutes(breakOverlap.end, breakOverlap.start)
    : 0;

  const lineStopOverlaps = (input.lineStops ?? [])
    .filter((ls) => ls.mulai && ls.selesai)
    .map((ls) => lineStopToRange(input.tanggal, ls, start))
    .map((r) => rangesOverlap(start, end, r.start, r.end))
    .filter((r): r is { start: Date; end: Date } => r !== null);

  const totalPotongan = mergeAndSumMinutes(
    breakOverlap ? [breakOverlap, ...lineStopOverlaps] : lineStopOverlaps
  );
  // Selisih total (setelah digabung, tanpa dobel hitung irisan dgn istirahat).
  const potonganLineStop = Math.max(0, totalPotongan - potonganIstirahat);

  const durasiEfektif = Math.max(0, durasiKotor - totalPotongan);

  const kecepatan =
    durasiEfektif > 0 ? round(totalLembar / durasiEfektif, 2) : 0;

  return {
    beratA,
    beratB,
    totalLembar,
    totalBerat,
    durasiKotor,
    potonganIstirahat,
    potonganLineStop,
    durasiEfektif,
    kecepatan,
    lintasHari,
  };
}

export interface TimelineData {
  start: Date;
  end: Date;
  /** Rentang waktu istirahat yang benar-benar beririsan dengan jam kerja. */
  breakOverlap: { start: Date; end: Date } | null;
}

/**
 * Hitung rentang shift & irisan jam istirahat untuk visualisasi timeline.
 * Return null bila tanggal/jam belum lengkap.
 */
export function computeTimeline(input: ShiftInput): TimelineData | null {
  if (!input.tanggal || !input.jamMulai || !input.jamSelesai) return null;
  const { start, end, breakStart, breakEnd } = computeShiftRange(input);
  return { start, end, breakOverlap: rangesOverlap(start, end, breakStart, breakEnd) };
}

export interface LineStopRow {
  mulai: string; // HH:mm, seperti diinput operator
  selesai: string; // HH:mm
  keterangan: string;
  /** Durasi irisan dengan jam kerja (menit); 0 bila di luar rentang shift. */
  menit: number;
}

/**
 * Ubah daftar LineStop mentah jadi baris siap tampil (tabel info), lengkap
 * dengan durasi irisan terhadap jam kerja. Dipakai oleh Input page, ShareCard,
 * dan reportImage agar tabel line stop konsisten di semua tempat.
 */
export function computeLineStopRows(
  input: Pick<EntryInput, "tanggal" | "jamMulai" | "jamSelesai" | "lineStops">
): LineStopRow[] {
  if (!input.tanggal || !input.jamMulai || !input.jamSelesai) return [];
  const start = toDate(input.tanggal, input.jamMulai);
  let end = toDate(input.tanggal, input.jamSelesai);
  if (end.getTime() <= start.getTime()) end = addDays(end, 1);

  return (input.lineStops ?? [])
    .filter((ls) => ls.mulai && ls.selesai)
    .map((ls) => {
      const range = lineStopToRange(input.tanggal, ls, start);
      const overlap = rangesOverlap(start, end, range.start, range.end);
      const menit = overlap ? differenceInMinutes(overlap.end, overlap.start) : 0;
      return { mulai: ls.mulai, selesai: ls.selesai, keterangan: ls.keterangan, menit };
    });
}

/** Titik jam bulat (HH:00) di antara start & end (eksklusif), untuk skala per jam pada timeline. */
export function hourTicks(start: Date, end: Date): Date[] {
  const ticks: Date[] = [];
  const t = new Date(start);
  t.setMinutes(0, 0, 0);
  if (t.getTime() <= start.getTime()) t.setHours(t.getHours() + 1);
  while (t.getTime() < end.getTime()) {
    ticks.push(new Date(t));
    t.setHours(t.getHours() + 1);
  }
  return ticks;
}

/** Format angka kg: hilangkan desimal .0 (539 bukan 539.0). */
export function fmtKg(n: number): string {
  return round(n, 1).toLocaleString("id-ID");
}

export function fmtLembar(n: number): string {
  return Math.round(n).toLocaleString("id-ID");
}

/** Format menit → "7j 20m". */
export function fmtDurasi(menit: number): string {
  const j = Math.floor(menit / 60);
  const m = menit % 60;
  if (j <= 0) return `${m}m`;
  if (m === 0) return `${j}j`;
  return `${j}j ${m}m`;
}

/**
 * Baris ringkasan instan untuk halaman input, contoh:
 * "Type A 154 lbr = 539 kg | Type B 0 lbr = 0 kg | Total = 154 lbr / 539 kg"
 */
export function ringkasanOutput(m: Metrics, typeA: number, typeB: number): string {
  return (
    `Type A ${fmtLembar(typeA)} lbr = ${fmtKg(m.beratA)} kg | ` +
    `Type B ${fmtLembar(typeB)} lbr = ${fmtKg(m.beratB)} kg | ` +
    `Total = ${fmtLembar(m.totalLembar)} lbr / ${fmtKg(m.totalBerat)} kg`
  );
}
