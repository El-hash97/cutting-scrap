"use client";

import { useEffect, useState } from "react";
import { DEFAULT_BREAK_CONFIG } from "./calc";
import { getBreakConfig, getEntries, getMpNames, getRole, subscribe } from "./storage";
import type { BreakConfig, Entry, Role } from "./types";

/**
 * Baca sumber data localStorage secara reaktif.
 * Nilai awal = fallback (agar SSR & first paint konsisten),
 * lalu terisi setelah mount + ikut update saat storage berubah.
 */
function useStore<T>(getter: () => T, fallback: T): [T, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setValue(getter());
    sync();
    setReady(true);
    return subscribe(sync);
    // getter identitas stabil (fungsi modul), aman untuk deps kosong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, ready];
}

export function useEntries(): [Entry[], boolean] {
  return useStore<Entry[]>(getEntries, []);
}

export function useMpNames(): [string[], boolean] {
  return useStore<string[]>(getMpNames, []);
}

export function useRole(): [Role, boolean] {
  return useStore<Role>(getRole, "Operator");
}

export function useBreakConfig(): [BreakConfig, boolean] {
  return useStore<BreakConfig>(getBreakConfig, DEFAULT_BREAK_CONFIG);
}
