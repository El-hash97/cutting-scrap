# Cutting Scrap — Laporan Produksi V2

Aplikasi web (mobile-first) untuk pencatatan, pemantauan, dan pelaporan hasil
*cutting scrap*. Kalkulasi berat & kecepatan otomatis, dashboard analitik, dan
laporan siap dibagikan ke WhatsApp.

## Fitur

- **Input** — form dengan visual aid Type A / Type B, autocomplete nama MP
  (autosave dari data sebelumnya), dan ringkasan otomatis real-time.
- **Dashboard** (Supervisor) — total akumulasi, tren produksi, hasil per MP,
  leaderboard hasil & kecepatan.
- **Performa** — tabel per MP + kartu laporan yang bisa di-download JPG atau
  di-share ke WhatsApp.
- **Riwayat** — log lengkap, filter (tanggal/shift/MP), export CSV.

## Aturan bisnis

- Berat: Type A = 3.5 kg/lembar, Type B = 2.6 kg/lembar.
- Potongan istirahat: 11:00–13:00 (Day) atau 23:00–01:00 (Night) dikurangi dari
  durasi kerja sebelum menghitung kecepatan.
- Shift lintas hari (mis. 20:00 → 05:00) ditangani otomatis.
- Kecepatan = total lembar ÷ durasi efektif (lembar/menit).

## Tech

Next.js 16 (App Router) · Tailwind CSS v4 · date-fns · Recharts · Canvas API
(render laporan JPG). **Penyimpanan: `localStorage`** (V1; siap diganti ke
backend seperti Supabase).

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build produksi
```

## Peran (Role)

Role switcher (Operator / Supervisor) di kanan atas — tanpa password (V1).
Dashboard & kelola data penuh untuk Supervisor.

## Data

Semua data tersimpan di `localStorage` browser dengan key:
`cs_entries` (log), `cs_mp_names` (daftar nama), `cs_role` (peran aktif).
