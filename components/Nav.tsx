"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBar,
  ClockCounterClockwise,
  Gauge,
  PencilSimpleLine,
  Scissors,
} from "@phosphor-icons/react";
import { useRole } from "@/lib/hooks";
import { setRole } from "@/lib/storage";
import { Segmented } from "@/components/ui";
import type { Role } from "@/lib/types";

type Item = {
  href: string;
  label: string;
  icon: typeof Gauge;
  supervisorOnly?: boolean;
};

const ITEMS: Item[] = [
  { href: "/", label: "Input", icon: PencilSimpleLine },
  { href: "/dashboard", label: "Dashboard", icon: ChartBar, supervisorOnly: true },
  { href: "/performance", label: "Performa", icon: Gauge },
  { href: "/history", label: "Riwayat", icon: ClockCounterClockwise },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Nav() {
  const pathname = usePathname();
  const [role] = useRole();
  const items = ITEMS.filter((i) => !i.supervisorOnly || role === "Supervisor");

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-contrast">
              <Scissors size={20} weight="bold" />
            </span>
            <span className="hidden text-[15px] leading-tight sm:block">
              Cutting Scrap
              <span className="block text-xs font-medium text-muted">
                Laporan Produksi V2
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {items.map((it) => {
              const active = isActive(pathname, it.href);
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-surface-2 text-foreground"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  <Icon size={18} weight={active ? "fill" : "regular"} />
                  {it.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto w-[188px]">
            <Segmented<Role>
              value={role}
              onChange={(v) => setRole(v)}
              options={[
                { value: "Operator", label: "Operator" },
                { value: "Supervisor", label: "Supervisor" },
              ]}
            />
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden">
        <div
          className="mx-auto grid max-w-lg px-2"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((it) => {
            const active = isActive(pathname, it.href);
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  active ? "text-brand-strong" : "text-muted"
                }`}
              >
                <Icon size={22} weight={active ? "fill" : "regular"} />
                {it.label}
              </Link>
            );
          })}
        </div>
        {/* Aman untuk home indicator iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
