# Time Circle Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two native `<input type="time">` fields ("Jam Mulai" / "Jam Selesai") on the Input page with a custom 24-hour circular clock-face picker component, per `docs/superpowers/specs/2026-07-12-time-circle-picker-design.md`.

**Architecture:** A single self-contained controlled component, `components/TimeCirclePicker.tsx`, renders a trigger button (styled like the existing text input) plus a centered modal dialog containing a digital header, an SVG clock face (dual-ring for hours 0–23, single-ring for minutes in steps of 5), and Batal/OK footer buttons. `app/page.tsx` swaps both native inputs for this component; no other files change.

**Tech Stack:** Next.js 16 / React 19 / TypeScript, Tailwind CSS v4 (existing design tokens in `app/globals.css`), `@phosphor-icons/react` for the clock icon, native SVG + Pointer Events (no new dependencies).

## Global Constraints

- Output contract is exactly `"HH:mm"` (zero-padded 24h string) or `""` — identical to the native time input. Do not touch `lib/calc.ts`, `lib/types.ts`, or the validation logic in `app/page.tsx` (`!form.jamMulai` / `!form.jamSelesai`).
- No new npm dependencies — build with SVG + native Pointer Events only, consistent with the existing stack.
- Follow existing design tokens only (`var(--surface)`, `var(--surface-2)`, `var(--border)`, `var(--foreground)`, `var(--muted)`, `var(--brand-strong)`) and existing UI primitives from `components/ui.tsx` (`Button`, `inputClass`). Do not introduce new colors.
- **No test framework exists in this repository** (confirmed: no `*.test.*`/`*.spec.*` outside `node_modules`, no Jest/Vitest config). Per the spec's own "Testing manual" section, verification for every task in this plan is: (a) `npx tsc --noEmit` for type correctness, (b) `npm run build` to confirm the production build succeeds, and (c) a manual check in the running dev server (`npm run dev`) as described in each task's Verify step. Do not add a test framework — that is out of scope for this feature.
- Keep the whole component in the single file `components/TimeCirclePicker.tsx` (matches spec's file plan and existing convention of self-contained ~200-400 line components like `components/VisualAid.tsx`).

---

## File Structure

- **Create:** `components/TimeCirclePicker.tsx` — trigger button, dialog, geometry helpers, `HourFace`/`MinuteFace` sub-renderers, pointer interaction. Single responsibility: turn a `"HH:mm"` string into/out of a circular-clock picker UI.
- **Modify:** `app/page.tsx:181-205` — replace the two `<input type="time">` elements inside the existing `<Field>` wrappers with `<TimeCirclePicker>`.

---

### Task 1: Static picker scaffold (dialog lifecycle + non-interactive clock face)

**Files:**
- Create: `components/TimeCirclePicker.tsx`
- Modify: `app/page.tsx:181-205`

**Interfaces:**
- Produces: `export default function TimeCirclePicker({ id, value, onChange }: { id?: string; value: string; onChange: (value: string) => void })` — a controlled component. `value` is `""` or `"HH:mm"`. Calls `onChange("HH:mm")` only when the user presses OK.

- [ ] **Step 1: Write `components/TimeCirclePicker.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
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

function roundToStep(minute: number, step = 5): number {
  return (Math.round(minute / step) * step) % 60;
}

function defaultDraft(value: string): { hour: number; minute: number } {
  const parsed = parseValue(value);
  if (parsed) return parsed;
  const now = new Date();
  return { hour: now.getHours(), minute: roundToStep(now.getMinutes()) };
}

/** Sudut tick index 0..11 dalam radian; index 0 = arah jam 12 (atas), searah jarum jam. */
function tickAngle(index: number): number {
  return (index / 12) * Math.PI * 2 - Math.PI / 2;
}

function tickPoint(index: number, radius: number): { x: number; y: number } {
  const angle = tickAngle(index);
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

export default function TimeCirclePicker({ id, value, onChange }: TimeCirclePickerProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"hour" | "minute">("hour");
  const [draftHour, setDraftHour] = useState(0);
  const [draftMinute, setDraftMinute] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

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
            fill={active ? "#fff" : "var(--foreground)"}
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
            fill={active ? "#fff" : "var(--muted)"}
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
            fill={active ? "#fff" : "var(--foreground)"}
          >
            {pad(i * 5)}
          </text>
        );
      })}
    </g>
  );
}
```

- [ ] **Step 2: Wire into `app/page.tsx`**

Add the import near the other component imports (`app/page.tsx:13-14`):

```tsx
import VisualAid from "@/components/VisualAid";
import TimeCirclePicker from "@/components/TimeCirclePicker";
import { Button, Card, Field, inputClass, Segmented, StatTile } from "@/components/ui";
```

Replace the "Jam Mulai" / "Jam Selesai" block (`app/page.tsx:181-205`):

```tsx
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Jam Mulai" htmlFor="jamMulai" error={errors.jamMulai}>
              <TimeCirclePicker
                id="jamMulai"
                value={form.jamMulai}
                onChange={(v) => set({ jamMulai: v })}
              />
            </Field>
            <Field
              label="Jam Selesai"
              htmlFor="jamSelesai"
              error={errors.jamSelesai}
              hint={metrics.lintasHari ? "Terdeteksi lintas hari (+1 hari)." : undefined}
            >
              <TimeCirclePicker
                id="jamSelesai"
                value={form.jamSelesai}
                onChange={(v) => set({ jamSelesai: v })}
              />
            </Field>
          </div>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`, open the Input page in a browser, and manually confirm:
- The "Jam Mulai" / "Jam Selesai" fields now show a button with `--:--` (or the current value) and a small clock icon instead of the native time input.
- Clicking the button opens a centered modal with a digital header (e.g. `14 : 30`), a static hour clock face (dual ring, numbers 0–11 outer / 12–23 inner, needle pointing at the current draft hour), and Batal/OK buttons.
- Tapping the minute segment in the header (e.g. `30`) switches the face to the single-ring minute clock (00, 05, …, 55); tapping the hour segment switches back.
- Clicking "Batal", the dark backdrop, or pressing Escape closes the dialog and leaves the field's value unchanged.
- Clicking "OK" closes the dialog and commits the currently-displayed draft value into the field (drag/tap-to-change comes in Task 2, so OK will just re-commit the initial draft for now).

- [ ] **Step 4: Commit**

```bash
git add components/TimeCirclePicker.tsx app/page.tsx
git commit -m "feat: add static time circle picker scaffold"
```

---

### Task 2: Pointer interaction (tap + drag to select hour/minute)

**Files:**
- Modify: `components/TimeCirclePicker.tsx`

**Interfaces:**
- Consumes: `SIZE`, `CENTER`, `OUTER_R`, `INNER_R` constants and `tickPoint`/`tickAngle` from Task 1.
- Produces: pointer handling wired to the `<svg>` element; `pointToHour`/`pointToMinute` used only within this file.

- [ ] **Step 1: Add geometry-to-value helpers**

Insert after the `tickPoint` function (still in `components/TimeCirclePicker.tsx`):

```tsx
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
```

- [ ] **Step 2: Add the pointer-event handler inside the component**

In `components/TimeCirclePicker.tsx`, change the import line to also pull in the React pointer-event type:

```tsx
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
```

Add a dragging ref next to the existing `svgRef` declaration:

```tsx
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);
```

Add these functions inside `TimeCirclePicker`, after `confirm`:

```tsx
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
```

- [ ] **Step 3: Wire the handler onto the SVG element**

Replace the `<svg ...>` opening tag:

```tsx
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              onPointerDown={handlePointerDown}
              className="mx-auto block aspect-square w-full max-w-[240px] touch-none select-none"
            >
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`, open the Input page, and manually confirm:
- Tapping anywhere on the outer ring (0–11) of the hour face jumps the needle/number to that hour and immediately advances to the minute step.
- Tapping the inner ring (12–23) selects the corresponding afternoon/night hour and also advances to minute step.
- Pressing down and dragging around the hour ring live-updates the selection as the pointer moves, and releasing advances to the minute step.
- On the minute face, tap and drag snap only to 5-minute ticks (00, 05, 10, …, 55) — never an in-between value.
- Pressing OK after selecting hour/minute stores the exact `HH:mm` into the form field and closes the dialog.

- [ ] **Step 5: Commit**

```bash
git add components/TimeCirclePicker.tsx
git commit -m "feat: add tap/drag interaction to time circle picker"
```

---

### Task 3: Full manual QA pass against the spec checklist

**Files:** none (verification only; fix forward in `components/TimeCirclePicker.tsx` if any check fails)

- [ ] **Step 1: Run the spec's manual testing checklist**

Run: `npm run dev`, open the Input page, and walk through every bullet in the spec's "Testing manual" section (`docs/superpowers/specs/2026-07-12-time-circle-picker-design.md:64-73`):
- Open the dialog from an empty field → draft defaults to the current time, minute rounded to the nearest 5.
- Tap & drag on the outer ring (0–11) and inner ring (12–23) → hour value changes correctly for both rings.
- After releasing the hour needle → dialog auto-advances to the minute ring; tap & drag snaps to 5-minute steps.
- Tap the hour/minute segment in the header → manually switches `step` back and forth.
- OK button → value is saved into `form.jamMulai` / `form.jamSelesai`, dialog closes.
- Batal, backdrop click, and Escape → dialog closes, form value unchanged.
- Resize the browser to a small/mobile viewport (e.g. 360px wide) → dialog and clock face do not overflow the screen.
- Set "Jam Selesai" earlier than "Jam Mulai" → confirm the "Terdeteksi lintas hari" hint still appears under the Jam Selesai field.

- [ ] **Step 2: Fix any failing checklist item**

If a check fails, fix it directly in `components/TimeCirclePicker.tsx`, re-run `npx tsc --noEmit` and `npm run build`, and re-check the specific failing bullet in the browser before moving on.

- [ ] **Step 3: Commit (only if Step 2 required changes)**

```bash
git add components/TimeCirclePicker.tsx
git commit -m "fix: address time circle picker QA findings"
```
