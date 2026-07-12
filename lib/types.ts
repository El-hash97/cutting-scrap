export type Shift = "Red" | "White";
export type TimeOfDay = "Day" | "Night";
export type Role = "Operator" | "Supervisor";

/** Nilai input mentah dari operator (sebelum kalkulasi). */
export interface EntryInput {
  namaMP: string;
  shift: Shift;
  time: TimeOfDay;
  tanggal: string; // YYYY-MM-DD (tanggal jam mulai)
  jamMulai: string; // HH:mm
  jamSelesai: string; // HH:mm
  typeA: number; // lembar
  typeB: number; // lembar
}

/** Hasil kalkulasi turunan dari EntryInput. */
export interface Metrics {
  beratA: number; // kg
  beratB: number; // kg
  totalLembar: number;
  totalBerat: number; // kg
  durasiKotor: number; // menit (belum dikurangi istirahat)
  potonganIstirahat: number; // menit
  durasiEfektif: number; // menit
  kecepatan: number; // lembar / menit
  lintasHari: boolean; // true jika selesai di hari berikutnya
}

/** Satu baris log yang tersimpan di localStorage. */
export interface Entry extends EntryInput, Metrics {
  id: string;
  createdAt: string; // ISO
}
