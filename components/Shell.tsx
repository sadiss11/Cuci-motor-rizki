"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cx } from "./ui";

export const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["owner"] },
  { href: "/kasir", label: "Kasir", roles: ["owner", "kasir"] },
  { href: "/pesanan", label: "Pesanan", roles: ["owner", "kasir"] },
  { href: "/pelanggan", label: "Pelanggan", roles: ["owner", "kasir"] },
  { href: "/kas", label: "Kas", roles: ["owner", "kasir"] },
  { href: "/laporan", label: "Laporan", roles: ["owner"] },
  { href: "/karyawan", label: "Karyawan", roles: ["owner"] },
  { href: "/pengaturan", label: "Pengaturan", roles: ["owner"] },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { db, role, logout } = useStore();
  const path = usePathname();
  const router = useRouter();
  const isOn = (href: string) => path === href || path.startsWith(href + "/");
  const item = NAV.find((n) => isOn(n.href));
  const allowed = !!role && (!item || item.roles.includes(role));

  useEffect(() => {
    if (!db) return;
    if (!role) router.replace("/login");
    else if (!allowed) router.replace("/kasir");
  }, [db, role, allowed, router]);

  if (!db || !role || !allowed) return <div className="p-8 text-sm text-muted">Memuat…</div>;
  const links = NAV.filter((n) => n.roles.includes(role));

  return (
    <div className="min-h-dvh">
      <header className="no-print sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href={role === "owner" ? "/dashboard" : "/kasir"} className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight">
            <span className="h-4 w-1 bg-accent" aria-hidden />
            <span className="hidden sm:inline">{db.settings.businessName}</span>
            <span className="sm:hidden">CMR</span>
          </Link>
          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Navigasi utama">
            {links.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cx("rounded-md px-3 py-1.5 text-sm", isOn(n.href) ? "bg-ink text-white" : "text-muted hover:text-ink")}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="rounded border border-line px-2 py-0.5 text-xs uppercase tracking-wide">{role}</span>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              Keluar
            </button>
          </div>
        </div>
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-1 text-center text-[11px] text-amber-900">
          Mode demo — data tersimpan di browser ini, belum persisten di server.
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 md:pb-10">{children}</main>
      <nav className="no-print fixed inset-x-0 bottom-0 z-20 flex overflow-x-auto border-t border-line bg-paper md:hidden" aria-label="Navigasi bawah">
        {links.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cx("flex h-14 min-w-[72px] flex-1 items-center justify-center px-1 text-[11px] font-medium", isOn(n.href) ? "text-ink" : "text-muted")}
          >
            <span className={cx("border-t-2 pt-1", isOn(n.href) ? "border-accent" : "border-transparent")}>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
