import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { fmtDurasi, fmtKg, fmtLembar } from "./calc";
import type { Entry } from "./types";

/**
 * Render kartu laporan langsung ke <canvas> (bukan lewat DOM-to-image).
 * Deterministik & cepat, tidak bergantung pada embedding font/SVG yang rawan
 * menggantung. Hasilnya identik dengan tampilan komponen ShareCard.
 */

const W = 720;
const PAD = 28;
const SCALE = 2;

const INK = "#1c1917";
const MUTED = "#6b6b66";
const BRAND = "#f59e0b";
const BRAND_INK = "#7c4a03";
const TYPE_A = "#d97706";
const TYPE_B = "#0284c7";
const LINE = "#ececea";
const CHIP_BG = "#f5f5f4";
const METRIC_BG = "#faf7ef";
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function tanggalPanjang(iso: string): string {
  try {
    return format(parseISO(iso), "EEEE, d MMMM yyyy", { locale: idLocale });
  } catch {
    return iso;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function renderReportCanvas(entry: Entry): HTMLCanvasElement {
  const H = 524;
  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "alphabetic";

  // Background putih + border kartu.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // ---- Header (amber) ----
  const headerH = 96;
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, W, headerH);

  ctx.fillStyle = BRAND_INK;
  ctx.font = `700 13px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("LAPORAN CUTTING SCRAP", PAD, 36);

  ctx.fillStyle = INK;
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText(entry.namaMP, PAD, 68);

  ctx.fillStyle = BRAND_INK;
  ctx.font = `600 13px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(tanggalPanjang(entry.tanggal), W - PAD, 54);

  // ---- Chips ----
  let cx = PAD;
  const chipY = headerH + 18;
  const chipH = 48;
  const chips: [string, string][] = [
    ["Shift", entry.shift],
    ["Waktu", entry.time],
    [
      "Jam kerja",
      `${entry.jamMulai} - ${entry.jamSelesai}${entry.lintasHari ? " (+1)" : ""}`,
    ],
  ];
  ctx.textAlign = "left";
  for (const [label, value] of chips) {
    ctx.font = `600 11px ${FONT}`;
    const lw = ctx.measureText(label).width;
    ctx.font = `700 15px ${FONT}`;
    const vw = ctx.measureText(value).width;
    const cw = Math.max(lw, vw) + 24;
    ctx.fillStyle = CHIP_BG;
    roundRect(ctx, cx, chipY, cw, chipH, 10);
    ctx.fill();
    ctx.fillStyle = MUTED;
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText(label, cx + 12, chipY + 19);
    ctx.fillStyle = INK;
    ctx.font = `700 15px ${FONT}`;
    ctx.fillText(value, cx + 12, chipY + 38);
    cx += cw + 10;
  }

  // ---- Total besar ----
  const totalY = chipY + chipH + 22;
  ctx.fillStyle = MUTED;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText("TOTAL BERAT", PAD, totalY);
  ctx.fillStyle = INK;
  ctx.font = `800 52px ${FONT}`;
  const bigVal = fmtKg(entry.totalBerat);
  ctx.fillText(bigVal, PAD, totalY + 46);
  const bigW = ctx.measureText(bigVal).width;
  ctx.fillStyle = MUTED;
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText("kg", PAD + bigW + 10, totalY + 46);
  ctx.font = `400 15px ${FONT}`;
  ctx.fillText(
    `${fmtLembar(entry.totalLembar)} lembar total`,
    PAD,
    totalY + 70
  );

  // ---- Breakdown A / B ----
  const bY = totalY + 92;
  const bH = 92;
  const gap = 14;
  const bW = (W - PAD * 2 - gap) / 2;
  drawBreakdown(ctx, PAD, bY, bW, bH, TYPE_A, "Type A", entry.typeA, entry.beratA);
  drawBreakdown(
    ctx,
    PAD + bW + gap,
    bY,
    bW,
    bH,
    TYPE_B,
    "Type B",
    entry.typeB,
    entry.beratB
  );

  // ---- Metrik ----
  const mY = bY + bH + 16;
  const mH = 72;
  const mW = (W - PAD * 2 - gap) / 2;
  drawMetric(ctx, PAD, mY, mW, mH, "Durasi efektif", fmtDurasi(entry.durasiEfektif));
  drawMetric(
    ctx,
    PAD + mW + gap,
    mY,
    mW,
    mH,
    "Kecepatan",
    `${entry.kecepatan.toLocaleString("id-ID")} lbr/mnt`
  );

  // ---- Footer ----
  const fY = mY + mH + 18;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, fY);
  ctx.lineTo(W, fY);
  ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = `400 12px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("Cutting Scrap · Laporan Produksi V2", PAD, fY + 22);
  ctx.textAlign = "right";
  ctx.fillText("Type A 3.5 kg/lbr · Type B 2.6 kg/lbr", W - PAD, fY + 22);

  return canvas;
}

function drawBreakdown(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  label: string,
  lembar: number,
  berat: number
) {
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 14);
  ctx.stroke();
  // Bar warna kiri.
  ctx.fillStyle = color;
  roundRect(ctx, x, y + 8, 4, h - 16, 2);
  ctx.fill();

  const tx = x + 18;
  ctx.textAlign = "left";
  ctx.fillStyle = color;
  ctx.font = `700 14px ${FONT}`;
  ctx.fillText(label, tx, y + 28);
  ctx.fillStyle = INK;
  ctx.font = `800 22px ${FONT}`;
  const v = fmtKg(berat);
  ctx.fillText(v, tx, y + 54);
  const vw = ctx.measureText(v).width;
  ctx.fillStyle = MUTED;
  ctx.font = `400 14px ${FONT}`;
  ctx.fillText("kg", tx + vw + 6, y + 54);
  ctx.fillText(`${fmtLembar(lembar)} lembar`, tx, y + 76);
}

function drawMetric(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string
) {
  ctx.fillStyle = METRIC_BG;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.fillStyle = MUTED;
  ctx.font = `600 12px ${FONT}`;
  ctx.fillText(label, x + 16, y + 28);
  ctx.fillStyle = INK;
  ctx.font = `800 20px ${FONT}`;
  ctx.fillText(value, x + 16, y + 54);
}

/** Kanvas → Blob JPEG. */
export function reportBlob(entry: Entry): Promise<Blob> {
  const canvas = renderReportCanvas(entry);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob gagal"))),
      "image/jpeg",
      0.95
    );
  });
}

export function reportFilename(entry: Entry): string {
  return `laporan-${entry.namaMP.replace(/\s+/g, "-").toLowerCase()}-${entry.tanggal}.jpg`;
}
