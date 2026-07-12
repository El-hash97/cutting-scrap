import { computeMetrics } from "./calc";
import type { Entry, EntryInput, Role } from "./types";

const KEY_ENTRIES = "cs_entries";
const KEY_NAMES = "cs_mp_names";
const KEY_ROLE = "cs_role";

/** Event yang di-dispatch setiap kali data berubah, agar UI ikut refresh. */
const CHANGE_EVENT = "cs:change";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
}

/** Subscribe ke perubahan storage (dari tab ini maupun tab lain). */
export function subscribe(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

// ---- Entries ----------------------------------------------------------------

export function getEntries(): Entry[] {
  const list = read<Entry[]>(KEY_ENTRIES, []);
  // Terbaru dulu.
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveEntry(input: EntryInput): Entry {
  const metrics = computeMetrics(input);
  const entry: Entry = {
    ...input,
    ...metrics,
    id:
      isBrowser() && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  const list = read<Entry[]>(KEY_ENTRIES, []);
  write(KEY_ENTRIES, [entry, ...list]);
  addMpName(input.namaMP);
  return entry;
}

export function deleteEntry(id: string): void {
  const list = read<Entry[]>(KEY_ENTRIES, []);
  write(
    KEY_ENTRIES,
    list.filter((e) => e.id !== id)
  );
}

// ---- Nama MP (autosave) -----------------------------------------------------

export function getMpNames(): string[] {
  return read<string[]>(KEY_NAMES, []).sort((a, b) =>
    a.localeCompare(b, "id-ID")
  );
}

/** Tambah nama ke daftar rekomendasi bila belum ada (case-insensitive). */
export function addMpName(nama: string): void {
  const clean = nama.trim();
  if (!clean) return;
  const list = read<string[]>(KEY_NAMES, []);
  if (list.some((n) => n.toLowerCase() === clean.toLowerCase())) return;
  write(KEY_NAMES, [...list, clean]);
}

export function removeMpName(nama: string): void {
  const list = read<string[]>(KEY_NAMES, []);
  write(
    KEY_NAMES,
    list.filter((n) => n.toLowerCase() !== nama.toLowerCase())
  );
}

// ---- Role -------------------------------------------------------------------

export function getRole(): Role {
  return read<Role>(KEY_ROLE, "Operator");
}

export function setRole(role: Role): void {
  write(KEY_ROLE, role);
}
