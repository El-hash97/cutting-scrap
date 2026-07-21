import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  BREAK_LABELS,
  computeLineStopRows,
  computeTimeline,
  fmtDurasi,
  fmtKg,
  fmtLembar,
  hourTicks,
} from "./calc";
import { getBreakConfig } from "./storage";
import type { LineStopRow, TimelineData } from "./calc";
import type { BreakKey, Entry } from "./types";

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
const LINE_STOP = "#dc2626";
const CHIP_BG = "#f5f5f4";
const METRIC_BG = "#faf7ef";
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

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
/** Tinggi tambahan untuk baris label istirahat/wakom/line stop di bawah timeline (bila ada). */
const EXTRA_LABEL_ROW_H = 18;

/** Tinggi blok tabel line stop (judul + header tabel + N baris + gap sebelum footer). */
const LS_TITLE_H = 20;
const LS_HEADER_H = 26;
const LS_ROW_H = 28;
const LS_GAP = 18;

function lineStopBlockHeight(rowCount: number): number {
  if (rowCount === 0) return 0;
  return LS_TITLE_H + LS_HEADER_H + rowCount * LS_ROW_H + LS_GAP;
}

export async function renderReportCanvas(entry: Entry): Promise<HTMLCanvasElement> {
  const timeline = computeTimeline(entry, getBreakConfig());
  const lineStopRows = computeLineStopRows(entry);
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
  const hasExtraLabelRow =
    !!timeline && (timeline.breakOverlaps.length > 0 || timeline.lineStopOverlaps.length > 0);
  const afterTimelineY = timeline
    ? tlY + TIMELINE_BLOCK_H + (hasExtraLabelRow ? EXTRA_LABEL_ROW_H : 0) + TIMELINE_GAP
    : mY + mH + 18;
  const lsY = afterTimelineY;
  const fY = lsY + lineStopBlockHeight(lineStopRows.length);

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
  const totalLembarVal = fmtLembar(entry.totalLembar);
  ctx.fillStyle = INK;
  ctx.font = `800 18px ${FONT}`;
  ctx.fillText(totalLembarVal, PAD, totalY + 72);
  const totalLembarW = ctx.measureText(totalLembarVal).width;
  ctx.fillStyle = MUTED;
  ctx.font = `600 14px ${FONT}`;
  ctx.fillText(" lembar total", PAD + totalLembarW, totalY + 72);

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

  // ---- Jadwal kerja (timeline, tetap menampilkan jam istirahat) ----
  if (timeline) {
    drawTimeline(ctx, PAD, tlY, W - PAD * 2, timeline);
  }

  // ---- Tabel info line stop (terpisah dari timeline istirahat) ----
  if (lineStopRows.length > 0) {
    drawLineStopTable(ctx, PAD, lsY, W - PAD * 2, lineStopRows);
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

  const lembarVal = fmtLembar(lembar);
  ctx.fillStyle = INK;
  ctx.font = `700 16px ${FONT}`;
  ctx.fillText(lembarVal, tx, y + 78);
  const lembarW = ctx.measureText(lembarVal).width;
  ctx.fillStyle = MUTED;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText(" lembar", tx + lembarW, y + 78);
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
 * istirahat/wakom & line stop yang beririsan (bila ada). Mengikuti tampilan
 * ScheduleTimeline di ShareCard.tsx.
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

  for (const b of tl.breakOverlaps) {
    const left = pct(b.start) * w;
    const right = pct(b.end) * w;
    const boxW = Math.max(8, right - left);
    const color = BREAK_COLOR[b.key];
    ctx.fillStyle = `${color}2e`;
    roundRect(ctx, x + left, barCenterY - 8, boxW, 16, 6);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundRect(ctx, x + left, barCenterY - 8, boxW, 16, 6);
    ctx.stroke();
  }

  for (const ls of tl.lineStopOverlaps) {
    const left = pct(ls.start) * w;
    const right = pct(ls.end) * w;
    const boxW = Math.max(8, right - left);
    ctx.fillStyle = "rgba(220,38,38,0.14)";
    roundRect(ctx, x + left, barCenterY - 8, boxW, 16, 6);
    ctx.fill();
    ctx.strokeStyle = LINE_STOP;
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

  // Baris label istirahat/wakom/line stop, di bawah label jam mulai/selesai.
  if (tl.breakOverlaps.length > 0 || tl.lineStopOverlaps.length > 0) {
    const chips = [
      ...tl.breakOverlaps.map((b) => ({
        text: `${BREAK_LABELS[b.key]} ${format(b.start, "HH:mm")}-${format(b.end, "HH:mm")}`,
        color: BREAK_COLOR[b.key],
      })),
      ...tl.lineStopOverlaps.map((ls) => ({
        text: `Line stop ${format(ls.start, "HH:mm")}-${format(ls.end, "HH:mm")}`,
        color: LINE_STOP,
      })),
    ];
    drawLabelChips(ctx, x, labelY + EXTRA_LABEL_ROW_H, w, chips);
  }
}

/**
 * Gambar deretan label berwarna (mis. "Istirahat 11:00-13:00") sejajar
 * horizontal, berhenti + elipsis bila kepanjangan (canvas tidak wrap teks
 * otomatis seperti DOM).
 */
function drawLabelChips(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxW: number,
  chips: { text: string; color: string }[]
) {
  ctx.textAlign = "left";
  ctx.font = `400 12px ${FONT}`;
  const sepW = ctx.measureText(", ").width;
  const ellipsisW = ctx.measureText("…").width;
  let cx = x;
  for (let i = 0; i < chips.length; i++) {
    const chip = chips[i];
    const isLast = i === chips.length - 1;
    const chipW = ctx.measureText(chip.text).width;
    const needed = chipW + (isLast ? 0 : sepW);
    if (cx + needed > x + maxW && cx !== x) {
      if (cx + ellipsisW <= x + maxW) {
        ctx.fillStyle = MUTED;
        ctx.fillText("…", cx, y);
      }
      return;
    }
    ctx.fillStyle = chip.color;
    ctx.fillText(chip.text, cx, y);
    cx += chipW;
    if (!isLast) {
      ctx.fillStyle = MUTED;
      ctx.fillText(", ", cx, y);
      cx += sepW;
    }
  }
}

/** Potong teks dengan elipsis bila melebihi lebar maksimum. */
function truncateText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

/**
 * Gambar tabel info line stop (Jam | Keterangan | Durasi), terpisah dari
 * bar timeline istirahat. Tinggi tabel mengikuti jumlah baris.
 */
function drawLineStopTable(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  w: number,
  rows: LineStopRow[]
) {
  ctx.textAlign = "left";
  ctx.fillStyle = MUTED;
  ctx.font = `600 12px ${FONT}`;
  ctx.fillText("LINE STOP", x, top + 12);

  const tableTop = top + LS_TITLE_H;
  const tableH = LS_HEADER_H + rows.length * LS_ROW_H;

  // Header background.
  ctx.fillStyle = CHIP_BG;
  ctx.fillRect(x, tableTop, w, LS_HEADER_H);

  const col1X = x + 14; // Jam
  const col2X = x + 130; // Keterangan
  const col3XRight = x + w - 14; // Durasi (rata kanan)

  ctx.fillStyle = MUTED;
  ctx.font = `600 10px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("JAM", col1X, tableTop + 17);
  ctx.fillText("KETERANGAN", col2X, tableTop + 17);
  ctx.textAlign = "right";
  ctx.fillText("DURASI", col3XRight, tableTop + 17);

  const maxKetW = col3XRight - 70 - col2X;
  rows.forEach((r, i) => {
    const rowY = tableTop + LS_HEADER_H + i * LS_ROW_H;
    if (i > 0) {
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, rowY);
      ctx.lineTo(x + w, rowY);
      ctx.stroke();
    }
    const textY = rowY + LS_ROW_H / 2 + 4;

    ctx.textAlign = "left";
    ctx.fillStyle = INK;
    ctx.font = `700 12px ${FONT}`;
    ctx.fillText(`${r.mulai}-${r.selesai}`, col1X, textY);

    ctx.fillStyle = MUTED;
    ctx.font = `400 12px ${FONT}`;
    ctx.fillText(truncateText(ctx, r.keterangan || "-", maxKetW), col2X, textY);

    ctx.textAlign = "right";
    ctx.fillStyle = INK;
    ctx.font = `600 12px ${FONT}`;
    ctx.fillText(fmtDurasi(r.menit), col3XRight, textY);
  });

  // Border luar tabel.
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  roundRect(ctx, x, tableTop, w, tableH, 10);
  ctx.stroke();
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
