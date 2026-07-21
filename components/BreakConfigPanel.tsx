"use client";

import { useState } from "react";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import TimeCirclePicker from "@/components/TimeCirclePicker";
import { Field, Segmented } from "@/components/ui";
import { BREAK_LABELS } from "@/lib/calc";
import { resetBreakConfig, setBreakConfig } from "@/lib/storage";
import type { BreakConfig, BreakKey, TimeOfDay } from "@/lib/types";

const KEYS: BreakKey[] = ["istirahat", "wakom1", "wakom2"];

/**
 * Panel pengaturan jeda (istirahat baku + wakom1/wakom2), per Day/Night.
 * Berlaku global untuk semua entry berikutnya, tersimpan di localStorage —
 * dipakai bersama oleh kalkulasi metrik & visualisasi timeline/share image.
 */
export default function BreakConfigPanel({
  config,
  defaultTime = "Day",
}: {
  config: BreakConfig;
  defaultTime?: TimeOfDay;
}) {
  const [time, setTime] = useState<TimeOfDay>(defaultTime);
  function update(key: BreakKey, field: "mulai" | "selesai", value: string) {
    setBreakConfig({
      ...config,
      [key]: {
        ...config[key],
        [time]: { ...config[key][time], [field]: value },
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Pengaturan Jeda
        </h2>
        <button
          type="button"
          onClick={() => resetBreakConfig()}
          className="flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
        >
          <ArrowCounterClockwise size={14} weight="bold" /> Reset default
        </button>
      </div>

      <p className="text-xs text-muted">
        Jam istirahat & waktu komunikasi (wakom) baku, dipotong otomatis dari durasi kerja.
        Bisa diubah sesuai kebutuhan — berlaku untuk entry berikutnya.
      </p>

      <Field label="Waktu">
        <Segmented<TimeOfDay>
          value={time}
          onChange={setTime}
          options={[
            { value: "Day", label: "Day" },
            { value: "Night", label: "Night" },
          ]}
        />
      </Field>

      <div className="space-y-4">
        {KEYS.map((key) => (
          <div key={key} className="space-y-2 rounded-xl border border-border p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {BREAK_LABELS[key]}
            </span>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mulai" htmlFor={`${key}-mulai`}>
                <TimeCirclePicker
                  id={`${key}-mulai`}
                  value={config[key][time].mulai}
                  onChange={(v) => update(key, "mulai", v)}
                />
              </Field>
              <Field label="Selesai" htmlFor={`${key}-selesai`}>
                <TimeCirclePicker
                  id={`${key}-selesai`}
                  value={config[key][time].selesai}
                  onChange={(v) => update(key, "selesai", v)}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
