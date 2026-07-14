"use client";

import { format } from "date-fns";
import { PauseCircle } from "@phosphor-icons/react";
import { hourTicks } from "@/lib/calc";
import type { TimelineData } from "@/lib/calc";

/**
 * Bar horizontal Jam Mulai → Jam Selesai, dengan segmen jam istirahat
 * (bila beririsan dengan jam kerja) ditandai kotak + ikon pause di kedua
 * ujungnya — terinspirasi gambar referensi (kotak highlight pada rentang
 * istirahat), tanpa kurva data palsu.
 */
export default function WorkTimeline({ start, end, breakOverlap }: TimelineData) {
  const total = end.getTime() - start.getTime();
  const pct = (d: Date) => {
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, ((d.getTime() - start.getTime()) / total) * 100));
  };

  const leftPct = breakOverlap ? pct(breakOverlap.start) : 0;
  const rightPct = breakOverlap ? pct(breakOverlap.end) : 0;
  const widthPct = Math.max(1.5, rightPct - leftPct);
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

        {breakOverlap && (
          <>
            {/* Kotak highlight jam istirahat */}
            <div
              className="absolute top-1/2 h-4 -translate-y-1/2 rounded-md border-2 border-brand-strong bg-brand/20"
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            />
            {/* Ikon pause di kedua ujung segmen istirahat */}
            <PauseCircle
              size={18}
              weight="fill"
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-strong"
              style={{ left: `${leftPct}%` }}
            />
            <PauseCircle
              size={18}
              weight="fill"
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-strong"
              style={{ left: `${rightPct}%` }}
            />
          </>
        )}
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
        {breakOverlap && (
          <span className="num text-muted">
            Istirahat {format(breakOverlap.start, "HH:mm")} -{" "}
            {format(breakOverlap.end, "HH:mm")}
          </span>
        )}
        <span className="num text-right font-semibold text-foreground">
          {format(end, "HH:mm")}
          <span className="ml-1 font-normal text-muted">Jam Selesai</span>
        </span>
      </div>
    </div>
  );
}
