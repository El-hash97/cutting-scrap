# Design: Statistik Waktu Kerja (Work Timeline)

**Date:** 2026-07-13
**Status:** Approved

## Ringkasan

Menambahkan visualisasi bar horizontal yang menampilkan Jam Mulai, jendela
istirahat (bila overlap dengan jam kerja), dan Jam Selesai — terinspirasi dari
gambar referensi (kotak highlight pada rentang istirahat + label di kedua
ujung), tanpa garis naik-turun palsu (tidak relevan untuk data shift).

## Lokasi Tampil

1. Halaman Input (`app/page.tsx`) — di dalam kartu "Ringkasan Otomatis",
   tepat di bawah baris "Durasi kotor...". Hanya render bila Jam Mulai & Jam
   Selesai sudah terisi (tidak ditampilkan pada form kosong).
2. Kartu laporan JPG (dialog "Bagikan" di halaman Performa) — baik preview
   DOM (`ShareCard.tsx`) maupun hasil render canvas yang benar-benar
   di-download/dibagikan ke WhatsApp (`reportImage.ts`).

## Logika (lib/calc.ts)

Fungsi baru `computeTimeline(input)`:
- Input: `{ tanggal, jamMulai, jamSelesai, time }`.
- Mengulang kalkulasi start/end (termasuk lintas hari) yang sudah ada di
  `computeMetrics`, agar satu sumber kebenaran untuk aturan cross-day &
  window istirahat.
- Helper overlap yang sudah ada (`overlapMinutes`) direfaktor: logika inti
  jadi `rangesOverlap()` yang mengembalikan `{start, end} | null` (rentang
  waktu overlap, bukan cuma durasinya). `overlapMinutes` memanggil ini.
- Return: `{ start: Date, end: Date, breakOverlap: {start,end} | null }`,
  atau `null` bila tanggal/jam belum lengkap.

## Komponen (components/WorkTimeline.tsx)

Props: `{ start: Date; end: Date; breakOverlap: {start,end} | null }`.

Render:
- Track bar penuh (rounded, `bg-surface-2`) merepresentasikan total durasi.
- Bila `breakOverlap` ada: kotak highlight (border `--brand-strong`, isi
  `--brand` transparan tipis) diposisikan proporsional di dalam track sesuai
  waktu overlap, dengan ikon pause kecil di kedua ujung kotak.
- Baris label di bawah bar: kiri = jam mulai (`HH:mm`), kanan = jam selesai
  (`HH:mm`); bila ada break, label "Istirahat HH:mm - HH:mm" (hyphen, bukan
  em-dash) di tengah/atas kotak highlight.
- Tanpa breakOverlap: bar tetap tampil polos, tanpa kotak & label istirahat.

Dipakai baik di halaman Input maupun `ShareCard.tsx` — kedua tempat memanggil
`computeTimeline` dengan data yang tersedia (form state / `Entry`).

## Canvas (lib/reportImage.ts)

Menambahkan bagian visual yang sama (bar + kotak highlight + label) di
render kanvas, ditempatkan setelah baris metrik Durasi Efektif/Kecepatan dan
sebelum footer — mengikuti posisi yang sama di `ShareCard.tsx`. Tinggi kanvas
laporan (`H` di reportImage.ts) bertambah untuk menampung bagian baru.

## Non-Goals

- Tidak ditambahkan ke tabel History atau Dashboard (di luar permintaan).
- Tidak ada garis/kurva data seperti grafik saham pada gambar referensi.
