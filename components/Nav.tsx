"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBar,
  ClockCounterClockwise,
  Gauge,
  LockKey,
  LockKeyOpen,
  PencilSimpleLine,
  Scissors,
} from "@phosphor-icons/react";
import { useRole } from "@/lib/hooks";
import { setRole } from "@/lib/storage";
import LoginDialog from "@/components/LoginDialog";

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
  const [loginOpen, setLoginOpen] = useState(false);
  const items = ITEMS.filter((i) => !i.supervisorOnly || role === "Supervisor");

  function handleAuthClick() {
    if (role === "Supervisor") {
      setRole("Operator");
    } else {
      setLoginOpen(true);
    }
  }

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
                Report 2026
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

          <button
            type="button"
            onClick={handleAuthClick}
            title={role === "Supervisor" ? "Keluar dari mode Supervisor" : "Login Supervisor"}
            aria-label={role === "Supervisor" ? "Keluar dari mode Supervisor" : "Login Supervisor"}
            className={`ml-auto grid size-10 place-items-center rounded-xl border transition ${
              role === "Supervisor"
                ? "border-brand-strong bg-brand text-brand-contrast"
                : "border-border bg-surface text-muted hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            {role === "Supervisor" ? (
              <LockKeyOpen size={20} weight="bold" />
            ) : (
              <LockKey size={20} />
            )}
          </button>
        </div>
      </header>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />

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
