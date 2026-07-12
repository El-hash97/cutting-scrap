"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  CheckCircle,
  FloppyDisk,
  Info,
  WarningCircle,
} from "@phosphor-icons/react";
import VisualAid from "@/components/VisualAid";
import { Button, Card, Field, inputClass, Segmented, StatTile } from "@/components/ui";
import { computeMetrics, fmtDurasi, fmtKg, fmtLembar } from "@/lib/calc";
import { saveEntry } from "@/lib/storage";
import { useMpNames } from "@/lib/hooks";
import type { EntryInput, Shift, TimeOfDay } from "@/lib/types";

const EMPTY = {
  namaMP: "",
  shift: "Red" as Shift,
  time: "Day" as TimeOfDay,
  tanggal: "",
  jamMulai: "",
  jamSelesai: "",
  typeA: "",
  typeB: "",
};

export default function InputPage() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<null | { nama: string; total: string }>(
    null
  );
  const [mpNames] = useMpNames();

  // Default tanggal = hari ini (di-set setelah mount agar tidak hydration-mismatch).
  useEffect(() => {
    setForm((f) => (f.tanggal ? f : { ...f, tanggal: format(new Date(), "yyyy-MM-dd") }));
  }, []);

  const typeA = Number(form.typeA) || 0;
  const typeB = Number(form.typeB) || 0;

  const metrics = useMemo(
    () =>
      computeMetrics({
        ...form,
        typeA,
        typeB,
      } as EntryInput),
    [form, typeA, typeB]
  );

  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved(null);
  };

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.namaMP.trim()) e.namaMP = "Nama MP wajib diisi.";
    if (!form.tanggal) e.tanggal = "Tanggal wajib diisi.";
    if (!form.jamMulai) e.jamMulai = "Jam mulai wajib diisi.";
    if (!form.jamSelesai) e.jamSelesai = "Jam selesai wajib diisi.";
    if (typeA <= 0 && typeB <= 0)
      e.hasil = "Isi minimal salah satu hasil (Type A atau Type B).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    saveEntry({ ...form, typeA, typeB } as EntryInput);
    setSaved({
      nama: form.namaMP.trim(),
      total: `${fmtLembar(metrics.totalLembar)} lbr / ${fmtKg(metrics.totalBerat)} kg`,
    });
    // Pertahankan nama/shift/time/tanggal, kosongkan hasil untuk entry berikutnya.
    setForm((f) => ({ ...f, typeA: "", typeB: "" }));
    setErrors({});
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Input Hasil Cutting</h1>
        <p className="mt-1 text-sm text-muted">
          Catat hasil kerja per shift. Berat & kecepatan dihitung otomatis.
        </p>
      </div>

      {/* Visual aid */}
      <section>
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted">
          <Info size={16} weight="fill" className="text-brand-strong" />
          Referensi bentuk & berat per lembar
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <VisualAid variant="A" />
          <VisualAid variant="B" />
        </div>
      </section>

      {saved && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Tersimpan</p>
            <p className="text-sm">
              {saved.nama} — {saved.total}. Data masuk ke Riwayat.
            </p>
          </div>
          <Link
            href="/performance"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold underline underline-offset-2"
          >
            Lihat performa <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Kiri: form */}
        <Card className="space-y-5 p-5">
          <Field label="Nama MP" htmlFor="namaMP" error={errors.namaMP} hint="Ketik nama; rekomendasi muncul dari data sebelumnya.">
            <input
              id="namaMP"
              list="mp-names"
              autoComplete="off"
              className={inputClass}
              placeholder="mis. Andi Saputra"
              value={form.namaMP}
              onChange={(e) => set({ namaMP: e.target.value })}
            />
            <datalist id="mp-names">
              {mpNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Shift">
              <Segmented<Shift>
                value={form.shift}
                onChange={(v) => set({ shift: v })}
                options={[
                  { value: "Red", label: "Red", dotClass: "bg-red-500" },
                  { value: "White", label: "White", dotClass: "bg-zinc-300 border border-zinc-400" },
                ]}
              />
            </Field>
            <Field label="Waktu">
              <Segmented<TimeOfDay>
                value={form.time}
                onChange={(v) => set({ time: v })}
                options={[
                  { value: "Day", label: "Day" },
                  { value: "Night", label: "Night" },
                ]}
              />
            </Field>
          </div>

          <Field label="Tanggal" htmlFor="tanggal" error={errors.tanggal}>
            <input
              id="tanggal"
              type="date"
              className={inputClass}
              value={form.tanggal}
              onChange={(e) => set({ tanggal: e.target.value })}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Jam Mulai" htmlFor="jamMulai" error={errors.jamMulai}>
              <input
                id="jamMulai"
                type="time"
                className={inputClass}
                value={form.jamMulai}
                onChange={(e) => set({ jamMulai: e.target.value })}
              />
            </Field>
            <Field
              label="Jam Selesai"
              htmlFor="jamSelesai"
              error={errors.jamSelesai}
              hint={metrics.lintasHari ? "Terdeteksi lintas hari (+1 hari)." : undefined}
            >
              <input
                id="jamSelesai"
                type="time"
                className={inputClass}
                value={form.jamSelesai}
                onChange={(e) => set({ jamSelesai: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Type A (lembar)" htmlFor="typeA">
              <input
                id="typeA"
                type="number"
                inputMode="numeric"
                min={0}
                className={inputClass}
                placeholder="0"
                value={form.typeA}
                onChange={(e) => set({ typeA: e.target.value })}
              />
            </Field>
            <Field label="Type B (lembar)" htmlFor="typeB">
              <input
                id="typeB"
                type="number"
                inputMode="numeric"
                min={0}
                className={inputClass}
                placeholder="0"
                value={form.typeB}
                onChange={(e) => set({ typeB: e.target.value })}
              />
            </Field>
          </div>

          {errors.hasil && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
              <WarningCircle size={16} weight="fill" /> {errors.hasil}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full py-3 text-base">
            <FloppyDisk size={20} weight="bold" /> Simpan Hasil
          </Button>
        </Card>

        {/* Kanan: ringkasan real-time (sticky di desktop) */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="space-y-4 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Ringkasan Otomatis
            </h2>

            <div className="rounded-xl bg-surface-2 p-3">
              <p className="num text-sm leading-relaxed text-foreground">
                <span className="text-type-a">
                  Type A {fmtLembar(typeA)} lbr = {fmtKg(metrics.beratA)} kg
                </span>
                <br />
                <span className="text-type-b">
                  Type B {fmtLembar(typeB)} lbr = {fmtKg(metrics.beratB)} kg
                </span>
                <br />
                <span className="font-bold">
                  Total = {fmtLembar(metrics.totalLembar)} lbr / {fmtKg(metrics.totalBerat)} kg
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Durasi efektif"
                value={fmtDurasi(metrics.durasiEfektif)}
                accent="brand"
              />
              <StatTile
                label="Kecepatan"
                value={metrics.kecepatan ? metrics.kecepatan.toLocaleString("id-ID") : "0"}
                unit="lbr/mnt"
              />
            </div>

            <p className="text-xs text-muted">
              Durasi kotor {fmtDurasi(metrics.durasiKotor)}
              {metrics.potonganIstirahat > 0 &&
                ` · potongan istirahat ${metrics.potonganIstirahat} mnt`}
              .
            </p>
          </Card>
        </div>
      </form>
    </div>
  );
}
