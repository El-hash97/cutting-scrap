/**
 * Kartu referensi visual Type A & Type B.
 * Replika gambar yang dikirim operator (profil scrap, kode REUSE, IMV kg),
 * digambar ulang sebagai SVG agar tajam di semua ukuran layar.
 */

type Variant = "A" | "B";

const CONFIG: Record<
  Variant,
  {
    label: string;
    fill: string;
    ink: string;
    imv: string;
    codes: [string, string];
    // Path profil scrap (white shape) di dalam viewBox 0 0 1000 250.
    profile: string;
  }
> = {
  A: {
    label: "TYPE A",
    fill: "#F5B301", // safety yellow
    ink: "#111111",
    imv: "3.5 KG",
    codes: ["51133,34", "51116,26"],
    profile:
      "M40,150 L52,60 L60,150 C160,152 260,150 360,138 C470,124 520,70 600,66 " +
      "C640,64 660,66 690,80 C760,110 850,150 940,164 L960,150 L972,66 L980,164 " +
      "L980,240 L40,240 Z",
  },
  B: {
    label: "TYPE B",
    fill: "#1E76C8", // industrial blue
    ink: "#0b0b0b",
    imv: "2.6 KG",
    codes: ["51111,21", "51131,32"],
    profile:
      "M40,70 L52,44 L64,70 C64,110 60,150 120,158 C240,172 360,150 520,196 " +
      "C610,222 660,214 720,206 C820,192 900,186 936,186 L950,178 L960,150 " +
      "L968,60 L980,150 L980,240 L40,240 Z",
  },
};

export default function VisualAid({ variant }: { variant: Variant }) {
  const c = CONFIG[variant];
  return (
    <figure
      className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
      aria-label={`Referensi ${c.label}, berat per lembar ${c.imv}`}
    >
      <svg
        viewBox="0 0 1000 470"
        className="block h-auto w-full"
        role="img"
      >
        <title>{`Referensi ${c.label}`}</title>
        {/* Title bar */}
        <g>
          <rect
            x="16"
            y="14"
            width="968"
            height="96"
            fill={c.fill}
            stroke={c.ink}
            strokeWidth="4"
          />
          <text
            x="500"
            y="78"
            textAnchor="middle"
            fontSize="62"
            fontWeight="800"
            fill={c.ink}
            style={{ fontFamily: "system-ui, sans-serif", letterSpacing: 2 }}
          >
            {c.label}
          </text>
        </g>

        {/* Body box */}
        <rect
          x="16"
          y="126"
          width="968"
          height="330"
          fill={c.fill}
          stroke={c.ink}
          strokeWidth="4"
        />

        {/* Profile scrap (inset group) */}
        <g transform="translate(16,150) scale(0.968,0.72)">
          <path d={c.profile} fill="#ffffff" stroke={c.ink} strokeWidth="5" />
        </g>

        {/* Divider above info row */}
        <line x1="16" y1="360" x2="984" y2="360" stroke={c.ink} strokeWidth="4" />

        {/* Info row: REUSE | codes | IMV */}
        <line x1="330" y1="360" x2="330" y2="456" stroke={c.ink} strokeWidth="4" />
        <line x1="640" y1="360" x2="640" y2="456" stroke={c.ink} strokeWidth="4" />
        <line x1="330" y1="408" x2="640" y2="408" stroke={c.ink} strokeWidth="3" />

        <text
          x="173"
          y="420"
          textAnchor="middle"
          fontSize="40"
          fontWeight="800"
          fill={c.ink}
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          REUSE
        </text>
        <text
          x="485"
          y="398"
          textAnchor="middle"
          fontSize="32"
          fontWeight="800"
          fill={c.ink}
          style={{ fontFamily: "ui-monospace, monospace" }}
        >
          {c.codes[0]}
        </text>
        <text
          x="485"
          y="446"
          textAnchor="middle"
          fontSize="32"
          fontWeight="800"
          fill={c.ink}
          style={{ fontFamily: "ui-monospace, monospace" }}
        >
          {c.codes[1]}
        </text>
        <text
          x="812"
          y="420"
          textAnchor="middle"
          fontSize="34"
          fontWeight="800"
          fill={c.ink}
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          NEW IMV = {c.imv}
        </text>
      </svg>
    </figure>
  );
}
