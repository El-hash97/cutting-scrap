"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Clock } from "@phosphor-icons/react";
import { Button, inputClass } from "@/components/ui";

type TimeCirclePickerProps = {
  id?: string;
  value: string; // "" atau "HH:mm"
  onChange: (value: string) => void;
};

const SIZE = 240;
const CENTER = SIZE / 2;
const OUTER_R = 88;
const INNER_R = 56;
const RING_R = 108;
const NEEDLE_DOT_R = 14;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseValue(value: string): { hour: number; minute: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function defaultDraft(value: string): { hour: number; minute: number } {
  const parsed = parseValue(value);
  if (parsed) return parsed;
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const rounded = Math.round(totalMinutes / 5) * 5;
  return { hour: Math.floor(rounded / 60) % 24, minute: rounded % 60 };
}

/** Sudut tick index 0..11 dalam radian; index 0 = arah jam 12 (atas), searah jarum jam. */
function tickAngle(index: number): number {
  return (index / 12) * Math.PI * 2 - Math.PI / 2;
}

function tickPoint(index: number, radius: number): { x: number; y: number } {
  const angle = tickAngle(index);
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

/** Ubah offset pointer (relatif titik tengah SVG) jadi index tick 0..11 terdekat. */
function pointToIndex(dx: number, dy: number): number {
  let angle = Math.atan2(dy, dx) + Math.PI / 2;
  if (angle < 0) angle += Math.PI * 2;
  return Math.round(angle / (Math.PI / 6)) % 12;
}

function pointToHour(dx: number, dy: number): number {
  const index = pointToIndex(dx, dy);
  const distance = Math.hypot(dx, dy);
  const outer = distance >= (OUTER_R + INNER_R) / 2;
  return outer ? index : index + 12;
}

function pointToMinute(dx: number, dy: number): number {
  return pointToIndex(dx, dy) * 5;
}

export default function TimeCirclePicker({ id, value, onChange }: TimeCirclePickerProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"hour" | "minute">("hour");
  const [draftHour, setDraftHour] = useState(0);
  const [draftMinute, setDraftMinute] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);

  function openDialog() {
    const draft = defaultDraft(value);
    setDraftHour(draft.hour);
    setDraftMinute(draft.minute);
    setStep("hour");
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
  }

  function confirm() {
    onChange(`${pad(draftHour)}:${pad(draftMinute)}`);
    setOpen(false);
  }

  function pointerToOffset(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { dx: 0, dy: 0 };
    const rect = svg.getBoundingClientRect();
    const scale = SIZE / rect.width;
    return { dx: (clientX - rect.left) * scale - CENTER, dy: (clientY - rect.top) * scale - CENTER };
  }

  function selectFromPoint(clientX: number, clientY: number) {
    const { dx, dy } = pointerToOffset(clientX, clientY);
    if (step === "hour") {
      setDraftHour(pointToHour(dx, dy));
    } else {
      setDraftMinute(pointToMinute(dx, dy));
    }
  }

  function handlePointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    e.preventDefault();
    draggingRef.current = true;
    selectFromPoint(e.clientX, e.clientY);

    function onMove(ev: PointerEvent) {
      if (!draggingRef.current) return;
      selectFromPoint(ev.clientX, ev.clientY);
    }
    function onUp() {
      draggingRef.current = false;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      setStep((s) => (s === "hour" ? "minute" : s));
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDialog();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        id={id}
        onClick={openDialog}
        className={`${inputClass} flex items-center justify-between gap-2`}
      >
        <span className="num">{value || "--:--"}</span>
        <Clock size={20} className="text-muted" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-border bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-center gap-1 text-3xl font-bold">
              <button
                type="button"
                onClick={() => setStep("hour")}
                className={`num rounded-lg px-1 ${
                  step === "hour" ? "text-brand-strong underline underline-offset-4" : "text-foreground"
                }`}
              >
                {pad(draftHour)}
              </button>
              <span className="text-foreground">:</span>
              <button
                type="button"
                onClick={() => setStep("minute")}
                className={`num rounded-lg px-1 ${
                  step === "minute" ? "text-brand-strong underline underline-offset-4" : "text-foreground"
                }`}
              >
                {pad(draftMinute)}
              </button>
            </div>

            <svg
              ref={svgRef}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              onPointerDown={handlePointerDown}
              className="mx-auto block aspect-square w-full max-w-[240px] touch-none select-none"
            >
              {step === "hour" ? (
                <HourFace draftHour={draftHour} />
              ) : (
                <MinuteFace draftMinute={draftMinute} />
              )}
            </svg>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Batal
              </Button>
              <Button type="button" variant="primary" onClick={confirm}>
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HourFace({ draftHour }: { draftHour: number }) {
  const isOuter = draftHour < 12;
  const selectedIndex = isOuter ? draftHour : draftHour - 12;
  const needle = tickPoint(selectedIndex, isOuter ? OUTER_R : INNER_R);

  return (
    <g>
      <circle cx={CENTER} cy={CENTER} r={RING_R} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1} />
      <line x1={CENTER} y1={CENTER} x2={needle.x} y2={needle.y} stroke="var(--brand-strong)" strokeWidth={2} />
      <circle cx={needle.x} cy={needle.y} r={NEEDLE_DOT_R} fill="var(--brand-strong)" />
      {Array.from({ length: 12 }, (_, i) => {
        const p = tickPoint(i, OUTER_R);
        const active = isOuter && i === selectedIndex;
        return (
          <text
            key={`o-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            className={`num text-sm ${active ? "font-bold" : ""}`}
            fill={active ? "var(--brand-contrast)" : "var(--foreground)"}
          >
            {i}
          </text>
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const p = tickPoint(i, INNER_R);
        const active = !isOuter && i === selectedIndex;
        return (
          <text
            key={`i-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            className={`num text-xs ${active ? "font-bold" : ""}`}
            fill={active ? "var(--brand-contrast)" : "var(--muted)"}
          >
            {i + 12}
          </text>
        );
      })}
    </g>
  );
}

function MinuteFace({ draftMinute }: { draftMinute: number }) {
  const selectedIndex = draftMinute / 5;
  const needle = tickPoint(selectedIndex, OUTER_R);

  return (
    <g>
      <circle cx={CENTER} cy={CENTER} r={RING_R} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1} />
      <line x1={CENTER} y1={CENTER} x2={needle.x} y2={needle.y} stroke="var(--brand-strong)" strokeWidth={2} />
      <circle cx={needle.x} cy={needle.y} r={NEEDLE_DOT_R} fill="var(--brand-strong)" />
      {Array.from({ length: 12 }, (_, i) => {
        const p = tickPoint(i, OUTER_R);
        const active = i === selectedIndex;
        return (
          <text
            key={`m-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            className={`num text-sm ${active ? "font-bold" : ""}`}
            fill={active ? "var(--brand-contrast)" : "var(--foreground)"}
          >
            {pad(i * 5)}
          </text>
        );
      })}
    </g>
  );
}
