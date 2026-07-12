/**
 * Kartu referensi visual Type A & Type B.
 * Replika gambar yang dikirim operator (profil scrap, kode REUSE, IMV kg),
 * digambar ulang sebagai SVG agar tajam di semua ukuran layar.
 *
 * Profil digambar langsung pada viewBox 0 0 1000 470:
 *   - baseline putih di y=350 (tepat di atas baris info y=360)
 *   - Type A: tab kecil + lembah di kiri, gunung membulat di tengah-kanan
 *     (puncak sedikit berundak), lalu ekor tipis memanjang + tab kecil di kanan.
 *   - Type B: paku tipis + dataran tinggi di kiri, turun kurva-S ke sisi kanan
 *     yang rendah/tipis, diakhiri paku tipis di ujung kanan.
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
      "M46,350 L46,250 L52,224 L59,250 " + // dinding kiri + tab tipis
      "C130,254 176,262 220,254 " + // lembah rendah kiri
      "C300,246 352,196 405,172 " + // mulai mendaki
      "C470,150 545,146 590,150 " + // bahu puncak kiri
      "L612,158 L638,150 " + // undakan kecil di puncak
      "C664,153 684,196 704,224 " + // turun dari puncak
      "C778,272 852,320 906,336 " + // ekor menurun landai
      "L934,332 L942,286 L949,336 " + // tab tipis kanan
      "L956,350 Z",
  },
  B: {
    label: "TYPE B",
    fill: "#1E76C8", // industrial blue
    ink: "#0b0b0b",
    imv: "2.6 KG",
    codes: ["51111,21", "51131,32"],
    profile:
      "M46,350 L46,200 L53,150 L61,200 " + // dinding kiri + paku tipis
      "C120,206 152,198 182,202 " + // dataran tinggi kiri
      "C262,214 316,290 402,316 " + // turun kurva-S ke lembah
      "C472,336 560,338 636,334 " + // dasar lembah panjang
      "C690,331 702,318 724,320 " + // gundukan kecil
      "C766,324 846,330 906,332 " + // sisi kanan rendah
      "L934,328 L942,172 L950,332 " + // paku tipis kanan
      "L956,350 Z",
  },
};

export default function VisualAid({ variant }: { variant: Variant }) {
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
