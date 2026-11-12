"use client";
// Store mode DEMO: data disimpan di localStorage browser (tidak persisten di server).
// Saat Supabase dihubungkan, ganti fungsi `commit` dengan panggilan RPC/server action
// yang menjalankan logika yang sama di dalam transaksi database.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { DB, Role } from "./types";
import { DB_VERSION, migrate, seedDB } from "./seed";

const KEY = "cmr_db_v1";
const SESSION = "cmr_session";

interface Ctx {
  db: DB | null;
  role: Role | null;
  commit: <T>(fn: (db: DB) => T) => T;
  login: (role: Role, pin: string) => boolean;
  logout: () => void;
  resetDemo: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = migrate(JSON.parse(raw) as DB);
      if (parsed.version === DB_VERSION) {
        save(parsed);
        return parsed;
      }
    }
  } catch {}
  const fresh = seedDB();
  save(fresh);
  return fresh;
}

function save(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {}
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const ref = useRef<DB | null>(null);

  useEffect(() => {
    const d = load();
    ref.current = d;
    setDb(d);
    try {
      const r = sessionStorage.getItem(SESSION) as Role | null;
      if (r === "owner" || r === "kasir") setRole(r);
    } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        const next = migrate(JSON.parse(e.newValue) as DB);
        ref.current = next;
        setDb(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback(<T,>(fn: (db: DB) => T): T => {
    if (!ref.current) throw new Error("Data belum siap");
    const next = structuredClone(ref.current);
    const result = fn(next); // jika error, perubahan dibuang (atomik)
    ref.current = next;
    save(next);
    setDb(next);
    return result;
  }, []);

  const login = useCallback((r: Role, pin: string) => {
    if (!ref.current || ref.current.settings.pins[r] !== pin) return false;
    setRole(r);
    try {
      sessionStorage.setItem(SESSION, r);
    } catch {}
    return true;
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    try {
      sessionStorage.removeItem(SESSION);
    } catch {}
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = seedDB();
    ref.current = fresh;
    save(fresh);
    setDb(fresh);
  }, []);

  return <StoreCtx.Provider value={{ db, role, commit, login, logout, resetDemo }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider hilang");
  return c;
}

/** Untuk halaman di dalam aplikasi: db & role dijamin ada. */
export function useApp() {
  const c = useStore();
  return c as Ctx & { db: DB; role: Role };
}
