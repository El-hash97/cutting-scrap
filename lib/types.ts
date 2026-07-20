export type Shift = "Red" | "White";
export type TimeOfDay = "Day" | "Night";
export type Role = "Operator" | "Supervisor";

/** Satu kejadian line stop: rentang waktu + keterangan manual dari operator. */
export interface LineStop {
  mulai: string; // HH:mm
  selesai: string; // HH:mm
  keterangan: string; // alasan/catatan line stop, diisi manual
}

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
  /** Potongan tambahan di luar window istirahat baku, bisa lebih dari satu kejadian. */
  lineStops: LineStop[];
}

/** Hasil kalkulasi turunan dari EntryInput. */
export interface Metrics {
  beratA: number; // kg
  beratB: number; // kg
  totalLembar: number;
  totalBerat: number; // kg
  durasiKotor: number; // menit (belum dikurangi istirahat/line stop)
  potonganIstirahat: number; // menit, potongan window istirahat baku (Day/Night)
  potonganLineStop: number; // menit, potongan tambahan dari line stop (sudah dikurangi irisan dgn istirahat)
  durasiEfektif: number; // menit
  kecepatan: number; // lembar / menit
  lintasHari: boolean; // true jika selesai di hari berikutnya
}

/** Satu baris log yang tersimpan di localStorage. */
export interface Entry extends EntryInput, Metrics {
  id: string;
  createdAt: string; // ISO
}
