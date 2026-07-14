import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { computeTimeline, fmtDurasi, fmtKg, fmtLembar, hourTicks } from "./calc";
import type { TimelineData } from "./calc";
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
const BRAND_STRONG = "#d97706";
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat gambar: ${src}`));
    img.src = src;
  });
}

/** Tinggi blok timeline (judul + bar + tick jam + label), termasuk gap sebelum footer. */
const TIMELINE_BLOCK_H = 86;
const TIMELINE_GAP = 18;

export async function renderReportCanvas(entry: Entry): Promise<HTMLCanvasElement> {
  const timeline = computeTimeline(entry);
  const [imgA, imgB] = await Promise.all([loadImage("/type-a.png"), loadImage("/type-b.png")]);

  // ---- Layout Y (dihitung dulu, sebelum kanvas dibuat, agar tinggi kanvas pas). ----
  const gap = 14;
  const headerH = 96;
  const chipY = headerH + 18;
  const chipH = 48;
  const totalY = chipY + chipH + 22;
  const bY = totalY + 92;
  const bH = 92;
  const mY = bY + bH + 16;
  const mH = 72;
  const tlY = mY + mH + 16;
  const fY = timeline ? tlY + TIMELINE_BLOCK_H + TIMELINE_GAP : mY + mH + 18;

  const refImgW = (W - PAD * 2 - gap) / 2;
  const refImgH = refImgW * (imgA.naturalHeight / imgA.naturalWidth);
  const refImgY = fY + 20;
  const footerY = refImgY + refImgH + 18;
  const H = Math.ceil(footerY + 50);

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

  // ---- Jadwal kerja (timeline) ----
  if (timeline) {
    drawTimeline(ctx, PAD, tlY, W - PAD * 2, timeline);
  }

  // ---- Referensi bentuk & berat per lembar ----
  ctx.textAlign = "left";
  ctx.fillStyle = MUTED;
  ctx.font = `600 12px ${FONT}`;
  ctx.fillText("REFERENSI BENTUK & BERAT PER LEMBAR", PAD, fY + 12);
  drawRoundedImage(ctx, imgA, PAD, refImgY, refImgW, refImgH, 12);
  drawRoundedImage(ctx, imgB, PAD + refImgW + gap, refImgY, refImgW, refImgH, 12);

  // ---- Footer ----
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(W, footerY);
  ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = `400 12px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("Cutting Scrap · Laporan Produksi V2", PAD, footerY + 22);
  ctx.textAlign = "right";
  ctx.fillText("Type A 3.5 kg/lbr · Type B 2.6 kg/lbr", W - PAD, footerY + 22);

  return canvas;
}

function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, r);
  ctx.stroke();
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

/**
 * Gambar bar Jam Mulai → Jam Selesai, dengan kotak highlight pada segmen
 * istirahat yang beririsan (bila ada). Mengikuti tampilan ScheduleTimeline
 * di ShareCard.tsx.
 */
function drawTimeline(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  w: number,
  tl: TimelineData
) {
  ctx.textAlign = "left";
  ctx.fillStyle = MUTED;
  ctx.font = `600 12px ${FONT}`;
  ctx.fillText("JADWAL KERJA", x, top + 12);

  const barCenterY = top + 32;
  const barH = 8;
  ctx.fillStyle = "#f1f1ef";
  roundRect(ctx, x, barCenterY - barH / 2, w, barH, 999);
  ctx.fill();

  const total = tl.end.getTime() - tl.start.getTime();
  const pct = (d: Date) =>
    total > 0
      ? Math.min(1, Math.max(0, (d.getTime() - tl.start.getTime()) / total))
      : 0;

  // Tick jam bulat (seling 1 jam).
  const ticks = hourTicks(tl.start, tl.end);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  for (const t of ticks) {
    const tx = x + pct(t) * w;
    ctx.beginPath();
    ctx.moveTo(tx, barCenterY - 6);
    ctx.lineTo(tx, barCenterY + 6);
    ctx.stroke();
  }

  if (tl.breakOverlap) {
    const left = pct(tl.breakOverlap.start) * w;
    const right = pct(tl.breakOverlap.end) * w;
    const boxW = Math.max(8, right - left);
    ctx.fillStyle = "rgba(245,158,11,0.18)";
    roundRect(ctx, x + left, barCenterY - 8, boxW, 16, 6);
    ctx.fill();
    ctx.strokeStyle = BRAND_STRONG;
    ctx.lineWidth = 2;
    roundRect(ctx, x + left, barCenterY - 8, boxW, 16, 6);
    ctx.stroke();
  }

  // Angka jam di bawah tiap tick.
  if (ticks.length > 0) {
    const hourLabelY = barCenterY + 8 + 10;
    ctx.textAlign = "center";
    ctx.font = `400 10px ${FONT}`;
    ctx.fillStyle = MUTED;
    for (const t of ticks) {
      ctx.fillText(format(t, "HH"), x + pct(t) * w, hourLabelY);
    }
  }

  const labelY = barCenterY + 8 + (ticks.length > 0 ? 36 : 20);

  // Jam mulai (kiri): "HH:mm" tebal + " Jam Mulai" muted.
  ctx.textAlign = "left";
  ctx.font = `700 13px ${FONT}`;
  const startLabel = format(tl.start, "HH:mm");
  ctx.fillStyle = INK;
  ctx.fillText(startLabel, x, labelY);
  const startW = ctx.measureText(startLabel).width;
  ctx.font = `400 12px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(" Jam Mulai", x + startW, labelY);

  // Label istirahat, tengah.
  if (tl.breakOverlap) {
    ctx.textAlign = "center";
    ctx.font = `400 12px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(
      `Istirahat ${format(tl.breakOverlap.start, "HH:mm")} - ${format(tl.breakOverlap.end, "HH:mm")}`,
      x + w / 2,
      labelY
    );
  }

  // Jam selesai (kanan): "HH:mm" tebal + " Jam Selesai" muted, rata kanan.
  const endLabel = format(tl.end, "HH:mm");
  const suffix = " Jam Selesai";
  ctx.font = `400 12px ${FONT}`;
  const suffixW = ctx.measureText(suffix).width;
  ctx.font = `700 13px ${FONT}`;
  const endW = ctx.measureText(endLabel).width;
  const rightEdge = x + w;
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = `700 13px ${FONT}`;
  ctx.fillText(endLabel, rightEdge - suffixW - endW, labelY);
  ctx.fillStyle = MUTED;
  ctx.font = `400 12px ${FONT}`;
  ctx.fillText(suffix, rightEdge - suffixW, labelY);
}

/** Kanvas → Blob JPEG. */
export async function reportBlob(entry: Entry): Promise<Blob> {
  const canvas = await renderReportCanvas(entry);
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
