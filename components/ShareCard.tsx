import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { CSSProperties } from "react";
import {
  BREAK_LABELS,
  computeLineStopRows,
  computeTimeline,
  fmtDurasi,
  fmtKg,
  fmtLembar,
  hourTicks,
} from "@/lib/calc";
import { getBreakConfig } from "@/lib/storage";
import type { BreakKey, Entry } from "@/lib/types";

/**
 * Kartu laporan digital untuk di-export jadi JPG & dibagikan ke WhatsApp.
 * Sengaja pakai inline style + warna hex (bukan util Tailwind/oklch)
 * agar hasil tangkapan html-to-image konsisten di semua tema/browser.
 */

const INK = "#1c1917";
const MUTED = "#6b6b66";
const BRAND = "#f59e0b";
const BRAND_STRONG = "#d97706";
const TYPE_A = "#d97706";
const TYPE_B = "#0284c7";
const LINE = "#ececea";
const LINE_STOP = "#dc2626";

/** Warna kotak highlight per jenis jeda baku (istirahat/wakom) — seragam kuning/brand. */
const BREAK_COLOR: Record<BreakKey, string> = {
  istirahat: BRAND_STRONG,
  wakom1: BRAND_STRONG,
  wakom2: BRAND_STRONG,
};

function tanggalPanjang(iso: string): string {
  try {
    return format(parseISO(iso), "EEEE, d MMMM yyyy", { locale: idLocale });
  } catch {
    return iso;
  }
}

export default function ShareCard({ entry }: { entry: Entry }) {
  return (
    <div
      style={{
        width: 720,
        background: "#ffffff",
        color: INK,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${LINE}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: BRAND,
          padding: "22px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#7c4a03", letterSpacing: 1 }}>
            LAPORAN CUTTING SCRAP
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: INK, marginTop: 2 }}>
            {entry.namaMP}
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 13, color: "#7c4a03", fontWeight: 600 }}>
          {tanggalPanjang(entry.tanggal)}
        </div>
      </div>

      {/* Chips */}
      <div style={{ display: "flex", gap: 10, padding: "18px 28px 0" }}>
        <Chip label="Shift" value={entry.shift} />
        <Chip label="Waktu" value={entry.time === "Day" ? "Day" : "Night"} />
        <Chip
          label="Jam kerja"
          value={`${entry.jamMulai} - ${entry.jamSelesai}${entry.lintasHari ? " (+1)" : ""}`}
        />
      </div>

      {/* Total besar */}
      <div style={{ padding: "18px 28px 6px" }}>
        <div style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>TOTAL BERAT</div>
        <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.05 }}>
          {fmtKg(entry.totalBerat)}{" "}
          <span style={{ fontSize: 22, fontWeight: 700, color: MUTED }}>kg</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: INK, marginTop: 4 }}>
          {fmtLembar(entry.totalLembar)}{" "}
          <span style={{ fontSize: 14, fontWeight: 600, color: MUTED }}>lembar total</span>
        </div>
      </div>

      {/* Breakdown A / B */}
      <div style={{ display: "flex", gap: 14, padding: "14px 28px 0" }}>
        <Breakdown
          color={TYPE_A}
          label="Type A"
          lembar={entry.typeA}
          berat={entry.beratA}
        />
        <Breakdown
          color={TYPE_B}
          label="Type B"
          lembar={entry.typeB}
          berat={entry.beratB}
        />
      </div>

      {/* Metrik bawah */}
      <div
        style={{
          display: "flex",
          gap: 14,
          padding: "18px 28px 24px",
        }}
      >
        <Metric label="Durasi efektif" value={fmtDurasi(entry.durasiEfektif)} />
        <Metric
          label="Kecepatan"
          value={`${entry.kecepatan.toLocaleString("id-ID")} lbr/mnt`}
        />
      </div>

      {/* Jadwal kerja (timeline) */}
      <ScheduleTimeline entry={entry} />

      {/* Tabel info line stop (terpisah dari timeline istirahat) */}
      <LineStopSection entry={entry} />

      {/* Referensi bentuk & berat per lembar */}
      <ReferenceImages />

      {/* Footer */}
      <div
        style={{
          borderTop: `1px solid ${LINE}`,
          padding: "12px 28px",
          fontSize: 12,
          color: MUTED,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Cutting Scrap Report 2026</span>
        <span>Type A 3.5 kg/lbr · Type B 2.6 kg/lbr</span>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#f5f5f4",
        borderRadius: 10,
        padding: "8px 12px",
      }}
    >
      <div style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Breakdown({
  color,
  label,
  lembar,
  berat,
}: {
  color: string;
  label: string;
  lembar: number;
  berat: number;
}) {
  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        padding: "14px 16px",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>
        {fmtKg(berat)} <span style={{ fontSize: 14, color: MUTED }}>kg</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 2 }}>
        {fmtLembar(lembar)} <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>lembar</span>
      </div>
    </div>
  );
}

function ScheduleTimeline({ entry }: { entry: Entry }) {
  const tl = computeTimeline(entry, getBreakConfig());
  if (!tl) return null;

  const total = tl.end.getTime() - tl.start.getTime();
  const pct = (d: Date) =>
    total > 0
      ? Math.min(100, Math.max(0, ((d.getTime() - tl.start.getTime()) / total) * 100))
      : 0;
  const ticks = hourTicks(tl.start, tl.end);

  return (
    <div style={{ padding: "0 28px 20px" }}>
      <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 10 }}>
        JAM KERJA
      </div>
      <div style={{ position: "relative", height: 18 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 8,
            transform: "translateY(-50%)",
            borderRadius: 999,
            background: "#f1f1ef",
          }}
        />
        {ticks.map((t) => (
          <div
            key={t.getTime()}
            style={{
              position: "absolute",
              left: `${pct(t)}%`,
              top: "50%",
              height: 12,
              width: 1,
              transform: "translate(-50%, -50%)",
              background: LINE,
            }}
          />
        ))}
        {tl.breakOverlaps.map((b, i) => {
          const l = pct(b.start);
          const r = pct(b.end);
          const w = Math.max(1.5, r - l);
          const color = BREAK_COLOR[b.key];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                height: 16,
                transform: "translateY(-50%)",
                left: `${l}%`,
                width: `${w}%`,
                borderRadius: 8,
                border: `2px solid ${color}`,
                background: `${color}2e`,
              }}
            />
          );
        })}
        {tl.lineStopOverlaps.map((ls, i) => {
          const l = pct(ls.start);
          const r = pct(ls.end);
          const w = Math.max(1.5, r - l);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                height: 16,
                transform: "translateY(-50%)",
                left: `${l}%`,
                width: `${w}%`,
                borderRadius: 8,
                border: `2px solid ${LINE_STOP}`,
                background: "rgba(220,38,38,0.14)",
              }}
            />
          );
        })}
      </div>
      {ticks.length > 0 && (
        <div style={{ position: "relative", height: 14, marginTop: 4 }}>
          {ticks.map((t) => (
            <span
              key={t.getTime()}
              style={{
                position: "absolute",
                left: `${pct(t)}%`,
                transform: "translateX(-50%)",
                fontSize: 10,
                color: MUTED,
              }}
            >
              {format(t, "HH")}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontSize: 12,
          color: MUTED,
        }}
      >
        <span>
          <span style={{ fontWeight: 700, color: INK }}>{format(tl.start, "HH:mm")}</span>{" "}
          Jam Mulai
        </span>
        <span>
          <span style={{ fontWeight: 700, color: INK }}>{format(tl.end, "HH:mm")}</span> Jam
          Selesai
        </span>
      </div>

      {(tl.breakOverlaps.length > 0 || tl.lineStopOverlaps.length > 0) && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "2px 12px",
            marginTop: 6,
            fontSize: 12,
          }}
        >
          {tl.breakOverlaps.map((b, i) => (
            <span key={`b${i}`} style={{ color: BREAK_COLOR[b.key] }}>
              {BREAK_LABELS[b.key]} {format(b.start, "HH:mm")}-{format(b.end, "HH:mm")}
            </span>
          ))}
          {tl.lineStopOverlaps.map((ls, i) => (
            <span key={`ls${i}`} style={{ color: LINE_STOP }}>
              Line stop {format(ls.start, "HH:mm")}-{format(ls.end, "HH:mm")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const th: CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  fontSize: 11,
  fontWeight: 600,
  color: MUTED,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const td: CSSProperties = {
  padding: "10px 12px",
  fontSize: 13,
  verticalAlign: "top",
};

function LineStopSection({ entry }: { entry: Entry }) {
  const rows = computeLineStopRows(entry);
  if (rows.length === 0) return null;

  return (
    <div style={{ padding: "0 28px 20px" }}>
      <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 10 }}>
        LINE STOP
      </div>
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f4" }}>
              <th style={th}>Jam</th>
              <th style={th}>Keterangan</th>
              <th style={{ ...th, textAlign: "right" }}>Durasi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${LINE}` }}>
                <td style={{ ...td, fontWeight: 700, color: INK, whiteSpace: "nowrap" }}>
                  {r.mulai}-{r.selesai}
                </td>
                <td style={{ ...td, color: MUTED }}>{r.keterangan || "-"}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {fmtDurasi(r.menit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReferenceImages() {
  return (
    <div style={{ padding: "0 28px 20px" }}>
      <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 10 }}>
        REFERENSI BENTUK &amp; BERAT PER LEMBAR
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        <ReferenceImage variant="A" />
        <ReferenceImage variant="B" />
      </div>
    </div>
  );
}

function ReferenceImage({ variant }: { variant: "A" | "B" }) {
  const src = variant === "A" ? "/type-a.png" : "/type-b.png";
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${LINE}`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Referensi Type ${variant}`}
        style={{ display: "block", width: "100%", height: "auto" }}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: "#faf7ef",
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{value}</div>
    </div>
  );
}
