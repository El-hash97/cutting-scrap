import { addDays, differenceInMinutes } from "date-fns";
import type { EntryInput, Metrics, TimeOfDay } from "./types";

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

/** Menit irisan antara dua rentang waktu (0 bila tidak beririsan). */
function overlapMinutes(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): number {
  const o = rangesOverlap(aStart, aEnd, bStart, bEnd);
  return o ? Math.round((o.end.getTime() - o.start.getTime()) / 60000) : 0;
}

export type ShiftInput = Pick<EntryInput, "tanggal" | "jamMulai" | "jamSelesai" | "time">;

/**
 * Hitung rentang shift (termasuk lintas hari) & window istirahat mentah.
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
      durasiEfektif: 0,
      kecepatan: 0,
      lintasHari: false,
    };
  }

  const { start, end, lintasHari, breakStart, breakEnd } = computeShiftRange(input);

  const durasiKotor = Math.max(0, differenceInMinutes(end, start));
  const potonganIstirahat = overlapMinutes(start, end, breakStart, breakEnd);
  const durasiEfektif = Math.max(0, durasiKotor - potonganIstirahat);

  const kecepatan =
    durasiEfektif > 0 ? round(totalLembar / durasiEfektif, 2) : 0;

  return {
    beratA,
    beratB,
    totalLembar,
    totalBerat,
    durasiKotor,
    potonganIstirahat,
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
