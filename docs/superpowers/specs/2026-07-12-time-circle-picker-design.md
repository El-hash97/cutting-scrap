# Time Circle Picker — Design Spec

**Date:** 2026-07-12
**Scope:** Ganti input jam native (`<input type="time">`) di halaman Input (`app/page.tsx`, field "Jam Mulai" & "Jam Selesai") dengan komponen kustom berbentuk jam analog lingkaran 24 jam.

## Latar belakang

Saat ini field "Jam Mulai" dan "Jam Selesai" memakai `<input type="time">` bawaan browser. Permintaan: ubah tampilan input jam menjadi UI jam lingkaran (analog) dengan format 24 jam.

## Komponen baru

`components/TimeCirclePicker.tsx` — komponen terkontrol (controlled), menggantikan dua `<input type="time">` di `app/page.tsx`. Dipakai 2x secara independen (Jam Mulai & Jam Selesai), masing-masing dengan state sendiri di parent.

```ts
type TimeCirclePickerProps = {
  id?: string;
  value: string;       // "" atau "HH:mm" (zero-padded, format sama seperti native time input)
  onChange: (value: string) => void; // dipanggil dengan "HH:mm" saat user menekan OK
};
```

Output tetap string `"HH:mm"` 24-jam — **tidak ada perubahan** di `lib/calc.ts` (parsing `jam.split(":")`) atau validasi (`!form.jamMulai` / `!form.jamSelesai`) di `app/page.tsx`. Hint "Terdeteksi lintas hari" tetap berjalan karena hanya bergantung pada nilai akhir `jamMulai`/`jamSelesai`.

## Trigger

Sebuah `<button type="button">` bergaya sama seperti `inputClass` (border, radius, padding dari `components/ui.tsx`) yang:
- Menampilkan teks jam terpilih (mis. `14:30`) dengan class `.num` (tabular mono), atau placeholder `--:--` bila `value` kosong.
- Menampilkan ikon jam kecil (phosphor `Clock`) di sisi kanan.
- `onClick` membuka dialog picker.

Tetap dibungkus oleh `<Field>` yang sudah ada (label, error, hint) — tidak berubah.

## Dialog picker

**Gaya:** modal terpusat dengan backdrop gelap transparan (bukan dropdown menempel di field), agar tidak overflow di layar kecil/HP. Backdrop klik, tombol Batal, atau tombol Escape menutup dialog **tanpa** memanggil `onChange` (draft dibuang).

**State internal saat dialog dibuka:**
- `step: "hour" | "minute"` — mulai dari `"hour"`.
- `draftHour: number` (0–23), `draftMinute: number` (0/5/10/…/55).
- Inisialisasi draft: jika `value` sudah terisi, parse dari situ. Jika `value` kosong, default ke waktu saat ini (`new Date()`), menit dibulatkan ke kelipatan 5 terdekat.

**Header dialog:** preview digital besar, mis. `"14 : 30"`, pakai class `.num`. Segmen jam dan menit masing-masing bisa ditap untuk pindah `step` (misalnya tap "30" saat masih di step jam akan lompat balik ke step menit). Segmen yang aktif (sesuai `step` saat ini) diberi warna aksen (`text-brand-strong` + underline) untuk menandakan sedang diedit.

**Clock face — step "hour":**
- Dua ring konsentris dalam satu SVG: ring luar berisi 12 angka (0–11), ring dalam (lebih kecil, radius lebih pendek, di dalam ring luar) berisi 12 angka (12–23).
- Style ring: lingkaran latar `bg-surface`/`stroke` border warna `--border`, teks angka `text-foreground`.
- Jarum: garis dari titik tengah SVG ke posisi tick terpilih + dot bulat di ujung, warna `--brand-strong`.
- Interaksi: `pointerdown` pada SVG langsung memilih tick terdekat (tap-to-select instan); `pointermove` (selama pointer down, listener di `document`) & `pointerup` untuk drag fine-adjust. Sudut dihitung dengan `Math.atan2` relatif ke titik tengah SVG (`getBoundingClientRect`), dipetakan ke jam 0–23 berdasarkan radius (radius besar → ring luar 0–11, radius kecil → ring dalam 12–23) dan sudut (12 posisi per ring, 30° per posisi, offset agar 0/12 di atas).
- `pointerup` → `step` otomatis pindah ke `"minute"`.

**Clock face — step "minute":**
- Satu ring dengan 12 tick pada kelipatan 5 menit (00, 05, 10, …, 55), style sama (border, jarum amber).
- Interaksi sama (tap instan + drag), snap ke tick terdekat (kelipatan 5) — tidak ada tick per 1 menit.

**Footer dialog:** dua tombol pakai komponen `Button` yang sudah ada — "Batal" (`variant="ghost"`, menutup dialog, buang draft) dan "OK" (`variant="primary"`, memanggil `onChange(`${pad(draftHour)}:${pad(draftMinute)}`)` lalu menutup dialog).

## Kompatibilitas & non-goals

- Tidak ada perubahan pada `lib/calc.ts`, `lib/types.ts`, atau validasi form — kontrak data (`"HH:mm"` string) identik dengan `<input type="time">` sebelumnya.
- Tidak menyediakan fallback input angka manual (keyboard typing) di dalam dialog — pemilihan jam sepenuhnya lewat tap/drag di clock face, sesuai kebutuhan.
- Tidak ada dukungan keyboard arrow-key untuk navigasi tick (di luar scope; drag/tap adalah interaksi utama untuk konteks input di lapangan/tablet).
- Tidak menambah dependency eksternal — dibangun dengan SVG + pointer events native React, konsisten dengan stack yang sudah ada (Tailwind, phosphor-icons).

## Testing manual (sesuai skill verify sebelum selesai)

- Buka dialog dari field kosong → draft default = waktu sekarang (dibulatkan 5 menit).
- Tap & drag di ring luar (0–11) dan ring dalam (12–23) → nilai jam berubah sesuai posisi.
- Setelah lepas jarum jam → otomatis pindah ke ring menit; tap & drag snap ke kelipatan 5.
- Tap segmen jam/menit di header untuk pindah step secara manual.
- Tombol OK → nilai tersimpan ke form (`form.jamMulai`/`form.jamSelesai`), dialog tertutup.
- Tombol Batal, klik backdrop, dan tombol Escape → dialog tertutup, nilai form **tidak** berubah.
- Cek di viewport kecil (mobile width) dialog tidak overflow keluar layar.
- Cek hint "Terdeteksi lintas hari" pada field Jam Selesai masih muncul saat `jamSelesai < jamMulai`.
