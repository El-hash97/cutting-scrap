"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  DownloadSimple,
  Gauge,
  ShareNetwork,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react";
import { Button, Card, EmptyState, inputClass, StatTile } from "@/components/ui";
import ShareCard from "@/components/ShareCard";
import { useEntries } from "@/lib/hooks";
import { statsByMp } from "@/lib/aggregate";
import { fmtKg, fmtLembar } from "@/lib/calc";
import { reportBlob, reportFilename } from "@/lib/reportImage";
import type { Entry } from "@/lib/types";

function shortDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy", { locale: idLocale });
  } catch {
    return iso;
  }
}

export default function PerformancePage() {
  const [entries] = useEntries();
  const [mp, setMp] = useState("all");
  const [share, setShare] = useState<Entry | null>(null);

  const names = useMemo(() => statsByMp(entries).map((s) => s.nama), [entries]);

  const rows = useMemo(
    () =>
      mp === "all"
        ? entries
        : entries.filter((e) => e.namaMP.toLowerCase() === mp.toLowerCase()),
    [entries, mp]
  );

  const summary = useMemo(() => {
    const totalBerat = rows.reduce((s, e) => s + e.totalBerat, 0);
    const totalLembar = rows.reduce((s, e) => s + e.totalLembar, 0);
    const dur = rows.reduce((s, e) => s + e.durasiEfektif, 0);
    return {
      totalBerat,
      totalLembar,
      kecepatan: dur > 0 ? totalLembar / dur : 0,
      count: rows.length,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performa</h1>
          <p className="mt-1 text-sm text-muted">
            Detail kerja per MP & laporan siap dibagikan.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <label htmlFor="mp" className="sr-only">
            Pilih MP
          </label>
          <select
            id="mp"
            className={inputClass}
            value={mp}
            onChange={(e) => setMp(e.target.value)}
          >
            <option value="all">Semua MP</option>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Gauge size={40} />}
          title="Belum ada data performa"
          desc="Data akan muncul setelah ada hasil cutting yang tersimpan."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Total berat" value={fmtKg(summary.totalBerat)} unit="kg" accent="brand" />
            <StatTile label="Total lembar" value={fmtLembar(summary.totalLembar)} unit="lbr" />
            <StatTile
              label="Kecepatan rata2"
              value={summary.kecepatan ? summary.kecepatan.toFixed(2) : "0"}
              unit="lbr/mnt"
            />
            <StatTile label="Jumlah shift" value={fmtLembar(summary.count)} />
          </div>

          {/* Tabel (desktop) */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <Th>Tanggal</Th>
                    <Th>MP</Th>
                    <Th>Shift · Waktu</Th>
                    <Th>Jam</Th>
                    <Th right>Type A</Th>
                    <Th right>Type B</Th>
                    <Th right>Total</Th>
                    <Th right>Kecepatan</Th>
                    <Th right>Aksi</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <Td>{shortDate(e.tanggal)}</Td>
                      <Td className="font-medium">{e.namaMP}</Td>
                      <Td>
                        {e.shift} · {e.time}
                      </Td>
                      <Td className="num">
                        {e.jamMulai}-{e.jamSelesai}
                        {e.lintasHari && <span className="text-muted"> +1</span>}
                      </Td>
                      <Td right className="num text-type-a">
                        {fmtLembar(e.typeA)}
                      </Td>
                      <Td right className="num text-type-b">
                        {fmtLembar(e.typeB)}
                      </Td>
                      <Td right className="num font-semibold">
                        {fmtKg(e.totalBerat)} kg
                      </Td>
                      <Td right className="num">
                        {e.kecepatan.toLocaleString("id-ID")}
                      </Td>
                      <Td right>
                        <Button
                          variant="ghost"
                          className="px-2 py-1.5"
                          onClick={() => setShare(e)}
                        >
                          <ShareNetwork size={16} weight="bold" /> Bagikan
                        </Button>
                      </Td>
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
                      {shortDate(e.tanggal)} · {e.shift} · {e.time}
                    </p>
                  </div>
                  <p className="num text-right text-lg font-bold">
                    {fmtKg(e.totalBerat)}
                    <span className="text-xs font-medium text-muted"> kg</span>
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <MiniStat label="Type A" value={`${fmtLembar(e.typeA)} lbr`} className="text-type-a" />
                  <MiniStat label="Type B" value={`${fmtLembar(e.typeB)} lbr`} className="text-type-b" />
                  <MiniStat label="Kecepatan" value={`${e.kecepatan.toLocaleString("id-ID")}`} />
                </div>
                <Button
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => setShare(e)}
                >
                  <ShareNetwork size={16} weight="bold" /> Bagikan laporan
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      {share && <ShareDialog entry={share} onClose={() => setShare(null)} />}
    </div>
  );
}

function ShareDialog({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [cardHeight, setCardHeight] = useState(0);
  const [busy, setBusy] = useState<null | "jpg" | "wa">(null);
  const [error, setError] = useState<string | null>(null);

  const filename = reportFilename(entry);

  // Skalakan kartu preview (lebar asli 720px) agar selalu pas di lebar layar
  // yang tersedia — tidak ada scroll horizontal/vertikal di HP. File JPG/WA
  // yang dibagikan tetap dirender penuh 720px lewat lib/reportImage.ts.
  useLayoutEffect(() => {
    function measure() {
      const availableWidth = previewBoxRef.current?.clientWidth ?? 720;
      setScale(Math.min(1, availableWidth / 720));
      setCardHeight(cardRef.current?.offsetHeight ?? 0);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (previewBoxRef.current) ro.observe(previewBoxRef.current);
    return () => ro.disconnect();
  }, [entry]);

  function triggerDownload(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function download() {
    setError(null);
    setBusy("jpg");
    try {
      triggerDownload(await reportBlob(entry));
    } catch {
      setError("Gagal membuat gambar. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  async function shareWa() {
    setError(null);
    setBusy("wa");
    const text = `Laporan Cutting ${entry.namaMP} (${entry.tanggal}) — ${fmtKg(
      entry.totalBerat
    )} kg / ${fmtLembar(entry.totalLembar)} lbr, kecepatan ${entry.kecepatan} lbr/mnt.`;
    try {
      const blob = await reportBlob(entry);
      const file = new File([blob], filename, { type: "image/jpeg" });
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
      };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text, title: "Laporan Cutting Scrap" });
      } else {
        // Fallback: unduh gambar lalu buka WhatsApp dengan teks ringkasan.
        triggerDownload(blob);
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError")
        setError("Gagal membagikan. Gambar diunduh sebagai cadangan.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-surface p-4 sm:rounded-2xl sm:p-6"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Bagikan Laporan</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2"
            aria-label="Tutup"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Preview kartu, diskalakan agar pas di lebar layar tanpa scroll */}
        <div className="rounded-xl bg-surface-2 p-3">
          <div ref={previewBoxRef} className="overflow-hidden">
            <div style={{ height: cardHeight * scale }}>
              <div
                ref={cardRef}
                style={{ width: 720, transform: `scale(${scale})`, transformOrigin: "top left" }}
              >
                <ShareCard entry={entry} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="primary" onClick={shareWa} disabled={busy !== null} className="py-3">
            <WhatsappLogo size={20} weight="fill" />
            {busy === "wa" ? "Menyiapkan…" : "Share ke WhatsApp"}
          </Button>
          <Button variant="secondary" onClick={download} disabled={busy !== null} className="py-3">
            <DownloadSimple size={20} weight="bold" />
            {busy === "jpg" ? "Menyiapkan…" : "Download JPG"}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          Di HP, tombol WhatsApp langsung melampirkan gambar. Di desktop, gambar
          diunduh lalu WhatsApp Web terbuka dengan teks ringkasan.
        </p>
      </div>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-4 py-3 font-semibold ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  right,
  className = "",
}: {
  children: React.ReactNode;
  right?: boolean;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 ${right ? "text-right" : "text-left"} ${className}`}>
      {children}
    </td>
  );
}

function MiniStat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-lg bg-surface-2 py-2">
      <p className="text-[10px] uppercase text-muted">{label}</p>
      <p className={`num text-sm font-semibold ${className}`}>{value}</p>
    </div>
  );
}
