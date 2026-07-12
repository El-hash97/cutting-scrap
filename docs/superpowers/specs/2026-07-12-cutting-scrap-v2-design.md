# Design: Aplikasi Laporan Cutting Scrap V2

**Date:** 2026-07-12
**Status:** Approved

## Ringkasan

Aplikasi web responsif (mobile-first) untuk pencatatan, pemantauan, dan pelaporan
hasil *cutting scrap*. Kalkulasi real-time di sisi klien, penyimpanan pakai
`localStorage` (siap diganti ke Supabase). Distribusi laporan sebagai gambar JPG
untuk WhatsApp dan export CSV untuk rekap.

## Stack

- **Next.js** (App Router) + **Tailwind CSS** — murni client-side.
- **date-fns** — logika waktu (lintas hari, pengurangan istirahat).
- **recharts** — grafik dashboard.
- **html2canvas** — konversi kartu laporan HTML → JPG.
- Dokumentasi library terbaru diambil via Context7 saat implementasi.

## Arsitektur & Data

Penyimpanan `localStorage` dengan tiga key:

- `cs_entries` — array log cutting. Field: `id`, `namaMP`, `shift` (Red/White),
  `time` (Day/Night), `tanggal`, `jamMulai`, `jamSelesai`, `typeA`, `typeB`,
  serta turunan tersimpan: `beratA`, `beratB`, `totalLembar`, `totalBerat`,
  `durasiEfektif` (menit), `kecepatan` (lembar/menit), `createdAt`.
- `cs_mp_names` — daftar nama MP unik. **Autosave**: setiap submit dengan nama
  baru menambah nama ke daftar → jadi rekomendasi autocomplete (`<datalist>`).
- `cs_role` — "Operator" atau "Supervisor" (role switcher, tanpa password).

Layer terpisah:

- `lib/types.ts` — definisi tipe.
- `lib/storage.ts` — satu pintu baca/tulis localStorage (mudah diganti backend).
- `lib/calc.ts` — fungsi kalkulasi murni (dapat diuji terpisah).

## Halaman

### 1. Input (`/`)
- **Visual Aid**: dua kartu SVG replika gambar referensi — TYPE A (kuning) dan
  TYPE B (biru): profil scrap, label REUSE (51133,34 / 51116,26 untuk A;
  51111,21 / 51131,32 untuk B), dan "NEW IMV = 3.5 KG" / "2.6 KG".
- Form: Nama MP (input + autocomplete), Shift (toggle Red/White),
  Time (toggle Day/Night), Tanggal (date picker), Jam Mulai, Jam Selesai
  (time picker), Type A (lembar), Type B (lembar).
- **Auto-calc real-time**: contoh
  `Type A 154 lbr = 539 kg | Type B 0 lbr = 0 kg | Total = 154 lbr / 539 kg`,
  plus durasi efektif dan kecepatan sebelum simpan.

### 2. Dashboard (`/dashboard`) — Supervisor
- Total akumulasi kg (hari/minggu), hasil per MP, grafik tren produksi
  (bar/line), leaderboard (kg tertinggi & kecepatan terbaik).

### 3. Performance (`/performance`)
- Tabel performa per MP + kecepatan (lembar/menit).
- Kartu ringkasan shift → tombol **Download JPG** & **Share ke WhatsApp**
  (html2canvas → gambar, lalu `wa.me`).

### 4. History (`/history`)
- Tabel lengkap; filter tanggal/shift/nama MP; **Export CSV**.

## Business Rules (`lib/calc.ts`)

- **Berat**: A = lembar × 3.5 kg; B = lembar × 2.6 kg.
- **Break deduction**: durasi dikurangi irisan (overlap) dengan window istirahat
  — 11:00–13:00 (Day) atau 23:00–01:00 (Night). Full crossing = −120 menit
  (sesuai PRD); partial overlap dihitung proporsional (tak pernah error).
- **Cross-day**: jika `jamSelesai <= jamMulai`, tambah 24 jam ke selesai
  (tanggal +1). Window 23:00–01:00 ditangani melintasi tengah malam.
- **Kecepatan** = total lembar (A+B) ÷ durasi efektif (menit). Bila durasi
  efektif ≤ 0 → kecepatan = 0.
- **Role**: Operator → Input + Performance/History miliknya. Supervisor →
  semua halaman + Dashboard + kelola nama MP.

## Non-Goals (V1)

- Backend/auth nyata (pakai role switcher lokal).
- Multi-device sync (localStorage per-browser).
- Password/keamanan (ditambahkan bersama backend nanti).
