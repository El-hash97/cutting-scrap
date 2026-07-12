"use client";

import { useState } from "react";

/**
 * Kartu referensi visual Type A & Type B.
 *
 * Menampilkan gambar asli (JPG) dari folder /public. Bila file belum ada
 * (gagal dimuat), otomatis fallback ke gambar SVG bawaan agar UI tetap rapi.
 *
 * Taruh file gambar di:
 *   public/type-a.png   (gambar TYPE A / kuning)
 *   public/type-b.png   (gambar TYPE B / biru)
 */

type Variant = "A" | "B";

const SRC: Record<Variant, string> = {
  A: "/type-a.png",
  B: "/type-b.png",
};

const IMV: Record<Variant, string> = {
  A: "3.5 KG",
  B: "2.6 KG",
};

export default function VisualAid({ variant }: { variant: Variant }) {
  const [failed, setFailed] = useState(false);
  const label = `TYPE ${variant}`;

  if (failed) return <VisualAidSvg variant={variant} />;

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SRC[variant]}
        alt={`Referensi ${label}, berat per lembar ${IMV[variant]}`}
        className="block h-auto w-full"
        onError={() => setFailed(true)}
      />
    </figure>
  );
}

/* ---------------------------------------------------------------------------
 * Fallback SVG (dipakai bila file JPG belum tersedia).
 * ------------------------------------------------------------------------- */

const CONFIG: Record<
  Variant,
  {
    label: string;
    fill: string;
    ink: string;
    imv: string;
    codes: [string, string];
    profile: string;
  }
> = {
  A: {
    label: "TYPE A",
    fill: "#F5B301",
    ink: "#111111",
    imv: "3.5 KG",
    codes: ["51133,34", "51116,26"],
    profile:
      "M46,350 L46,250 L52,224 L59,250 " +
      "C130,254 176,262 220,254 " +
      "C300,246 352,196 405,172 " +
      "C470,150 545,146 590,150 " +
      "L612,158 L638,150 " +
      "C664,153 684,196 704,224 " +
      "C778,272 852,320 906,336 " +
      "L934,332 L942,286 L949,336 " +
      "L956,350 Z",
  },
  B: {
    label: "TYPE B",
    fill: "#1E76C8",
    ink: "#0b0b0b",
    imv: "2.6 KG",
    codes: ["51111,21", "51131,32"],
    profile:
      "M46,350 L46,200 L53,150 L61,200 " +
      "C120,206 152,198 182,202 " +
      "C262,214 316,290 402,316 " +
      "C472,336 560,338 636,334 " +
      "C690,331 702,318 724,320 " +
      "C766,324 846,330 906,332 " +
      "L934,328 L942,172 L950,332 " +
      "L956,350 Z",
  },
};

function VisualAidSvg({ variant }: { variant: Variant }) {
  const c = CONFIG[variant];
  return (
    <figure
      className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
      aria-label={`Referensi ${c.label}, berat per lembar ${c.imv}`}
    >
      <svg viewBox="0 0 1000 470" className="block h-auto w-full" role="img">
        <title>{`Referensi ${c.label}`}</title>

        {/* Title bar */}
        <rect
          x="16"
          y="14"
          width="968"
          height="96"
          fill={c.fill}
          stroke={c.ink}
          strokeWidth="5"
        />
        <text
          x="500"
          y="80"
          textAnchor="middle"
          fontSize="64"
          fontWeight="800"
          fill={c.ink}
          style={{ fontFamily: "system-ui, sans-serif", letterSpacing: 3 }}
        >
          {c.label}
        </text>

        {/* Body box */}
        <rect
          x="16"
          y="126"
          width="968"
          height="330"
          fill={c.fill}
          stroke={c.ink}
          strokeWidth="5"
        />

        {/* Profile scrap */}
        <path
          d={c.profile}
          fill="#ffffff"
          stroke={c.ink}
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Divider di atas baris info */}
        <line x1="16" y1="360" x2="984" y2="360" stroke={c.ink} strokeWidth="5" />

        {/* Baris info: REUSE | dua kode | NEW IMV */}
        <line x1="320" y1="360" x2="320" y2="456" stroke={c.ink} strokeWidth="5" />
        <line x1="560" y1="360" x2="560" y2="456" stroke={c.ink} strokeWidth="5" />
        <line x1="320" y1="408" x2="560" y2="408" stroke={c.ink} strokeWidth="4" />

        <text
          x="168"
          y="421"
          textAnchor="middle"
          fontSize="42"
          fontWeight="800"
          fill={c.ink}
          style={{ fontFamily: "system-ui, sans-serif", letterSpacing: 1 }}
        >
          REUSE
        </text>
        <text
          x="440"
          y="398"
          textAnchor="middle"
          fontSize="30"
          fontWeight="800"
          fill={c.ink}
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          {c.codes[0]}
        </text>
        <text
          x="440"
          y="446"
          textAnchor="middle"
          fontSize="30"
          fontWeight="800"
          fill={c.ink}
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          {c.codes[1]}
        </text>
        <text
          x="772"
          y="421"
          textAnchor="middle"
          fontSize="36"
          fontWeight="800"
          fill={c.ink}
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          NEW IMV= {c.imv}
        </text>
      </svg>
    </figure>
  );
}
