import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { computeTimeline, fmtDurasi, fmtKg, fmtLembar } from "@/lib/calc";
import type { Entry } from "@/lib/types";

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
        <div style={{ fontSize: 15, color: MUTED, marginTop: 2 }}>
          {fmtLembar(entry.totalLembar)} lembar total
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
        <span>Cutting Scrap · Laporan Produksi V2</span>
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
      <div style={{ fontSize: 13, color: MUTED }}>{fmtLembar(lembar)} lembar</div>
    </div>
  );
}

function ScheduleTimeline({ entry }: { entry: Entry }) {
  const tl = computeTimeline(entry);
  if (!tl) return null;

  const total = tl.end.getTime() - tl.start.getTime();
  const pct = (d: Date) =>
    total > 0
      ? Math.min(100, Math.max(0, ((d.getTime() - tl.start.getTime()) / total) * 100))
      : 0;
  const left = tl.breakOverlap ? pct(tl.breakOverlap.start) : 0;
  const right = tl.breakOverlap ? pct(tl.breakOverlap.end) : 0;
  const width = Math.max(1.5, right - left);

  return (
    <div style={{ padding: "0 28px 20px" }}>
      <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 10 }}>
        JADWAL KERJA
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
        {tl.breakOverlap && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              height: 16,
              transform: "translateY(-50%)",
              left: `${left}%`,
              width: `${width}%`,
              borderRadius: 8,
              border: `2px solid ${BRAND_STRONG}`,
              background: "rgba(245,158,11,0.18)",
            }}
          />
        )}
      </div>
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
        {tl.breakOverlap && (
          <span>
            Istirahat {format(tl.breakOverlap.start, "HH:mm")} -{" "}
            {format(tl.breakOverlap.end, "HH:mm")}
          </span>
        )}
        <span>
          <span style={{ fontWeight: 700, color: INK }}>{format(tl.end, "HH:mm")}</span> Jam
          Selesai
        </span>
      </div>
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
