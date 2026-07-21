"use client";

import { format } from "date-fns";
import { ChatCircleDots, PauseCircle, Prohibit } from "@phosphor-icons/react";
import { BREAK_LABELS, hourTicks } from "@/lib/calc";
import type { TimelineData } from "@/lib/calc";
import type { BreakKey } from "@/lib/types";

/** Gaya kotak highlight + ikon per jenis jeda baku (istirahat/wakom) — semua kuning/brand seragam. */
const BREAK_STYLE: Record<
  BreakKey,
  { box: string; icon: string; label: string; Icon: typeof PauseCircle }
> = {
  istirahat: {
    box: "border-brand-strong bg-brand/20",
    icon: "text-brand-strong",
    label: "text-muted",
    Icon: PauseCircle,
  },
  wakom1: {
    box: "border-brand-strong bg-brand/20",
    icon: "text-brand-strong",
    label: "text-muted",
    Icon: ChatCircleDots,
  },
  wakom2: {
    box: "border-brand-strong bg-brand/20",
    icon: "text-brand-strong",
    label: "text-muted",
    Icon: ChatCircleDots,
  },
};

/**
 * Bar horizontal Jam Mulai → Jam Selesai, dengan segmen istirahat & wakom
 * (bila beririsan dengan jam kerja) ditandai kotak + ikon di kedua ujungnya —
 * terinspirasi gambar referensi (kotak highlight pada rentang istirahat),
 * tanpa kurva data palsu. Segmen line stop ditandai dengan gaya serupa
 * (warna merah) agar jeda di luar istirahat/wakom baku juga terlihat.
 */
export default function WorkTimeline({ start, end, breakOverlaps, lineStopOverlaps }: TimelineData) {
  const total = end.getTime() - start.getTime();
  const pct = (d: Date) => {
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, ((d.getTime() - start.getTime()) / total) * 100));
  };

  const ticks = hourTicks(start, end);

  return (
    <div>
      <div className="relative h-9">
        {/* Track dasar */}
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-surface-2" />

        {/* Tick jam bulat (seling 1 jam) */}
        {ticks.map((t) => (
          <div
            key={t.getTime()}
            className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-border"
            style={{ left: `${pct(t)}%` }}
          />
        ))}

        {breakOverlaps.map((b, i) => {
          const l = pct(b.start);
          const r = pct(b.end);
          const w = Math.max(1.5, r - l);
          const style = BREAK_STYLE[b.key];
          const Icon = style.Icon;
          return (
            <div key={i}>
              {/* Kotak highlight jam istirahat/wakom */}
              <div
                className={`absolute top-1/2 h-4 -translate-y-1/2 rounded-md border-2 ${style.box}`}
                style={{ left: `${l}%`, width: `${w}%` }}
              />
              {/* Ikon di kedua ujung segmen */}
              <Icon
                size={18}
                weight="fill"
                className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 ${style.icon}`}
                style={{ left: `${l}%` }}
              />
              <Icon
                size={18}
                weight="fill"
                className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 ${style.icon}`}
                style={{ left: `${r}%` }}
              />
            </div>
          );
        })}

        {lineStopOverlaps.map((ls, i) => {
          const l = pct(ls.start);
          const r = pct(ls.end);
          const w = Math.max(1.5, r - l);
          return (
            <div key={i}>
              {/* Kotak highlight jam line stop */}
              <div
                className="absolute top-1/2 h-4 -translate-y-1/2 rounded-md border-2 border-red-500 bg-red-500/15 dark:border-red-500"
                style={{ left: `${l}%`, width: `${w}%` }}
              />
              {/* Ikon prohibit di kedua ujung segmen line stop */}
              <Prohibit
                size={18}
                weight="fill"
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500"
                style={{ left: `${l}%` }}
              />
              <Prohibit
                size={18}
                weight="fill"
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500"
                style={{ left: `${r}%` }}
              />
            </div>
          );
        })}
      </div>

      {ticks.length > 0 && (
        <div className="relative h-3.5">
          {ticks.map((t) => (
            <span
              key={t.getTime()}
              className="num absolute -translate-x-1/2 text-[10px] text-muted"
              style={{ left: `${pct(t)}%` }}
            >
              {format(t, "HH")}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1 flex items-start justify-between text-xs">
        <span className="num font-semibold text-foreground">
          {format(start, "HH:mm")}
          <span className="ml-1 font-normal text-muted">Jam Mulai</span>
        </span>
        <span className="num text-right font-semibold text-foreground">
          {format(end, "HH:mm")}
          <span className="ml-1 font-normal text-muted">Jam Selesai</span>
        </span>
      </div>

      {(breakOverlaps.length > 0 || lineStopOverlaps.length > 0) && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {breakOverlaps.map((b, i) => (
            <span key={`b${i}`} className={`num ${BREAK_STYLE[b.key].label}`}>
              {BREAK_LABELS[b.key]} {format(b.start, "HH:mm")}-{format(b.end, "HH:mm")}
            </span>
          ))}
          {lineStopOverlaps.map((ls, i) => (
            <span key={`ls${i}`} className="num text-red-600 dark:text-red-400">
              Line stop {format(ls.start, "HH:mm")}-{format(ls.end, "HH:mm")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
