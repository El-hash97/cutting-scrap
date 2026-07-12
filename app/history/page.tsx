"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  DownloadSimple,
  FunnelSimple,
  ClockCounterClockwise,
  Trash,
} from "@phosphor-icons/react";
import { Button, Card, EmptyState, inputClass } from "@/components/ui";
import { useEntries } from "@/lib/hooks";
import { deleteEntry } from "@/lib/storage";
import { statsByMp } from "@/lib/aggregate";
import { entriesToCsv, downloadCsv } from "@/lib/csv";
import { fmtDurasi, fmtKg, fmtLembar } from "@/lib/calc";
import type { Shift } from "@/lib/types";

function shortDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy", { locale: idLocale });
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const [entries] = useEntries();
  const [tanggal, setTanggal] = useState("");
  const [shift, setShift] = useState<"all" | Shift>("all");
  const [mp, setMp] = useState("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const names = useMemo(() => statsByMp(entries).map((s) => s.nama), [entries]);

  const rows = useMemo(
    () =>
      entries.filter(
        (e) =>
          (!tanggal || e.tanggal === tanggal) &&
          (shift === "all" || e.shift === shift) &&
          (mp === "all" || e.namaMP.toLowerCase() === mp.toLowerCase())
      ),
    [entries, tanggal, shift, mp]
  );

  const anyFilter = tanggal || shift !== "all" || mp !== "all";

  function exportCsv() {
    const stamp = format(new Date(), "yyyyMMdd-HHmm");
    downloadCsv(`riwayat-cutting-${stamp}.csv`, entriesToCsv(rows));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Cutting</h1>
          <p className="mt-1 text-sm text-muted">
            Log lengkap hasil kerja harian.
          </p>
        </div>
        <Button variant="primary" onClick={exportCsv} disabled={rows.length === 0}>
          <DownloadSimple size={18} weight="bold" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted">
          <FunnelSimple size={16} weight="bold" /> Filter
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="date"
            className={inputClass}
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            aria-label="Filter tanggal"
          />
          <select
            className={inputClass}
            value={shift}
            onChange={(e) => setShift(e.target.value as "all" | Shift)}
            aria-label="Filter shift"
          >
            <option value="all">Semua shift</option>
            <option value="Red">Red</option>
            <option value="White">White</option>
          </select>
          <select
            className={inputClass}
            value={mp}
            onChange={(e) => setMp(e.target.value)}
            aria-label="Filter MP"
          >
            <option value="all">Semua MP</option>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        {anyFilter && (
          <button
            onClick={() => {
              setTanggal("");
              setShift("all");
              setMp("all");
            }}
            className="mt-3 text-sm font-semibold text-brand-strong hover:underline"
          >
            Reset filter
          </button>
        )}
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ClockCounterClockwise size={40} />}
          title={anyFilter ? "Tidak ada data cocok" : "Riwayat masih kosong"}
          desc={
            anyFilter
              ? "Coba ubah atau reset filter."
              : "Hasil cutting yang disimpan akan muncul di sini."
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted">
            {fmtLembar(rows.length)} entry ditampilkan.
          </p>

          {/* Tabel (desktop) */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">MP</th>
                    <th className="px-4 py-3 font-semibold">Shift · Waktu</th>
                    <th className="px-4 py-3 font-semibold">Jam</th>
                    <th className="px-4 py-3 text-right font-semibold">A</th>
                    <th className="px-4 py-3 text-right font-semibold">B</th>
                    <th className="px-4 py-3 text-right font-semibold">Total kg</th>
                    <th className="px-4 py-3 text-right font-semibold">Durasi</th>
                    <th className="px-4 py-3 text-right font-semibold">Kec.</th>
                    <th className="px-4 py-3 text-right font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-4 py-3">{shortDate(e.tanggal)}</td>
                      <td className="px-4 py-3 font-medium">{e.namaMP}</td>
                      <td className="px-4 py-3">
                        {e.shift} · {e.time}
                      </td>
                      <td className="num px-4 py-3">
                        {e.jamMulai}-{e.jamSelesai}
                        {e.lintasHari && <span className="text-muted"> +1</span>}
                      </td>
                      <td className="num px-4 py-3 text-right text-type-a">{fmtLembar(e.typeA)}</td>
                      <td className="num px-4 py-3 text-right text-type-b">{fmtLembar(e.typeB)}</td>
                      <td className="num px-4 py-3 text-right font-semibold">{fmtKg(e.totalBerat)}</td>
                      <td className="num px-4 py-3 text-right">{fmtDurasi(e.durasiEfektif)}</td>
                      <td className="num px-4 py-3 text-right">{e.kecepatan.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setConfirmId(e.id)}
                          className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          aria-label="Hapus"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Kartu (mobile) */}
          <div className="space-y-3 md:hidden">
            {rows.map((e) => (
              <Card key={e.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{e.namaMP}</p>
                    <p className="text-xs text-muted">
                      {shortDate(e.tanggal)} · {e.shift} · {e.time} · {e.jamMulai}-{e.jamSelesai}
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmId(e.id)}
                    className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    aria-label="Hapus"
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </div>
                <div className="num mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="text-type-a">A {fmtLembar(e.typeA)}</span>
                  <span className="text-type-b">B {fmtLembar(e.typeB)}</span>
                  <span className="font-semibold">{fmtKg(e.totalBerat)} kg</span>
                  <span className="text-muted">{fmtDurasi(e.durasiEfektif)}</span>
                  <span className="text-muted">{e.kecepatan.toLocaleString("id-ID")} lbr/mnt</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {confirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface p-5"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Hapus entry ini?</h2>
            <p className="mt-1 text-sm text-muted">
              Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmId(null)}>
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteEntry(confirmId);
                  setConfirmId(null);
                }}
              >
                <Trash size={16} weight="bold" /> Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
