"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/* ---- Card ----------------------------------------------------------------- */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface ${className}`}
    >
      {children}
    </div>
  );
}

/* ---- Button --------------------------------------------------------------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({
  variant = "secondary",
  className = "",
  children,
  ...props
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:translate-y-px disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong";
  const styles: Record<string, string> = {
    primary:
      "bg-brand text-brand-contrast hover:bg-brand-strong shadow-sm",
    secondary:
      "border border-border bg-surface text-foreground hover:bg-surface-2",
    ghost: "text-foreground hover:bg-surface-2",
    danger:
      "border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/* ---- Field (label di atas, hint/error di bawah) --------------------------- */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---- Input dasar ---------------------------------------------------------- */
export const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground placeholder:text-muted focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand/40";

/* ---- Segmented control (toggle) ------------------------------------------- */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; dotClass?: string }[];
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl border border-border bg-surface-2 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {o.dotClass && (
              <span className={`size-2.5 rounded-full ${o.dotClass}`} />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Stat tile ------------------------------------------------------------ */
export function StatTile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: "a" | "b" | "brand";
}) {
  const accentColor =
    accent === "a"
      ? "text-type-a"
      : accent === "b"
        ? "text-type-b"
        : accent === "brand"
          ? "text-brand-strong"
          : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={`num mt-1 text-2xl font-bold ${accentColor}`}>
        {value}
        {unit && (
          <span className="ml-1 text-sm font-medium text-muted">{unit}</span>
        )}
      </p>
    </div>
  );
}

/* ---- Empty state ---------------------------------------------------------- */
export function EmptyState({
  title,
  desc,
  icon,
}: {
  title: string;
  desc?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {desc && <p className="max-w-xs text-sm text-muted">{desc}</p>}
    </div>
  );
}
