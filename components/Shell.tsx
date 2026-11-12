"use client";
// Tata letak mengikuti JHOPTIK: sidebar kiri (bisa diciutkan), kartu akun di bawah,
// navigasi bawah + lembar "Lainnya" di HP.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronUp,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Settings2,
  ShoppingCart,
  UserRound,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cx } from "./ui";

export const NAV: { href: string; label: string; roles: Role[]; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["owner"], icon: LayoutDashboard },
  { href: "/kasir", label: "Kasir", roles: ["owner", "kasir"], icon: ShoppingCart },
  { href: "/pesanan", label: "Pesanan", roles: ["owner", "kasir"], icon: ReceiptText },
  { href: "/pelanggan", label: "Pelanggan", roles: ["owner", "kasir"], icon: UserRound },
  { href: "/kas", label: "Kas", roles: ["owner", "kasir"], icon: Wallet },
  { href: "/laporan", label: "Laporan", roles: ["owner"], icon: BarChart3 },
  { href: "/karyawan", label: "Karyawan", roles: ["owner"], icon: Users },
  { href: "/pengaturan", label: "Pengaturan", roles: ["owner"], icon: Settings2 },
];

export function Logo({ small, light }: { small?: boolean; light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={cx(
          "font-display inline-flex shrink-0 items-center justify-center rounded-lg text-[15px] leading-none tracking-wide",
          light ? "border-2 border-white text-white" : "bg-accent text-white",
          small ? "size-9" : "size-10",
        )}
        aria-hidden
      >
        CMR
      </span>
      {!small && (
        <span className="leading-tight">
          <span className={cx("font-display block text-[17px] uppercase tracking-wide", light ? "text-white" : "text-stone-900")}>Cuci Motor Rizky</span>
          <span className={cx("block text-[11px]", light ? "text-white/80" : "text-stone-500")}>Kasir & loyalti</span>
        </span>
      )}
    </span>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { db, role, logout } = useStore();
  const path = usePathname();
  const router = useRouter();
  const isOn = (href: string) => path === href || path.startsWith(href + "/");
  const item = NAV.find((n) => isOn(n.href));
  const allowed = !!role && (!item || item.roles.includes(role));
  const [open, setOpen] = useState(true);
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("cmr_sidebar") === "0") setOpen(false);
    } catch {}
  }, []);
  useEffect(() => {
    if (!db) return;
    if (!role) router.replace("/login");
    else if (!allowed) router.replace("/kasir");
  }, [db, role, allowed, router]);
  useEffect(() => {
    if (!menu) return;
    const h = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menu]);
  useEffect(() => setSheet(false), [path]);

  if (!db || !role || !allowed) return <div className="p-8 text-sm text-muted">Memuat…</div>;
  const links = NAV.filter((n) => n.roles.includes(role));
  const bottom = links.length > 5 ? links.slice(0, 4) : links;
  const toggle = () => {
    setOpen(!open);
    try {
      localStorage.setItem("cmr_sidebar", open ? "0" : "1");
    } catch {}
  };
  const doLogout = () => {
    logout();
    router.replace("/login");
  };
  const roleName = role === "owner" ? "Owner" : "Kasir";

  return (
    <div className="min-h-dvh">
      <a href="#konten-utama" className="sr-only focus:not-sr-only">
        Lewati ke konten
      </a>
      <aside className={cx("no-print fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-side transition-all md:flex", open ? "w-[245px]" : "w-14")}>
        <div className={cx("flex flex-col items-center pt-2.5", open && "items-stretch px-2.5")}>
          <button
            onClick={toggle}
            title={open ? "Sembunyikan" : "Tampilkan menu"}
            className={cx("inline-flex items-center gap-1 rounded-full bg-white/80 text-stone-600 hover:bg-white", open ? "mx-auto h-7 px-3 text-xs" : "size-7 justify-center")}
          >
            {open ? (
              <>
                <ChevronLeft className="size-3.5" /> Sembunyikan
              </>
            ) : (
              <Menu className="size-4" />
            )}
          </button>
          <Link href={role === "owner" ? "/dashboard" : "/kasir"} className={cx("flex justify-center", open ? "my-5" : "my-4")}>
            <Logo small={!open} />
          </Link>
        </div>
        <nav className={cx("flex-1 overflow-y-auto", open ? "px-2.5" : "px-2")} aria-label="Navigasi utama">
          {links.map((n) => {
            const on = isOn(n.href);
            const Icon = n.icon;
            return open ? (
              <Link
                key={n.href}
                href={n.href}
                className={cx("mb-0.5 flex h-[37px] items-center gap-3 rounded-lg px-3 text-[13.5px]", on ? "bg-white font-semibold text-accent-hover shadow-sm" : "text-stone-600 hover:bg-white/70")}
              >
                <Icon className="size-[18px]" /> {n.label}
              </Link>
            ) : (
              <Link
                key={n.href}
                href={n.href}
                title={n.label}
                className={cx("mb-1 flex size-10 items-center justify-center rounded-lg", on ? "bg-white text-accent-hover shadow-sm" : "text-stone-500 hover:bg-white/70 hover:text-stone-800")}
              >
                <Icon className="size-[18px]" />
              </Link>
            );
          })}
        </nav>
        <div ref={menuRef} className={cx("relative border-t border-line", open ? "p-2.5" : "flex justify-center py-3")}>
          {menu && (
            <div className={cx("absolute bottom-full z-50 mb-2 w-52 rounded-lg border border-line bg-white p-2 shadow-lg", open ? "left-2.5" : "left-2")}>
              <p className="border-b border-line px-2 pb-2 text-[13px] font-medium">Akun</p>
              <button onClick={doLogout} className="block w-full rounded px-2 py-2 text-left text-[12.5px] text-stone-700 hover:bg-stone-50">
                Keluar
              </button>
            </div>
          )}
          <button onClick={() => setMenu(!menu)} className={cx("flex items-center gap-2.5", open && "w-full rounded-lg bg-white/70 px-2.5 py-2 hover:bg-white")}>
            <span className="inline-flex size-8 items-center justify-center rounded-full border border-stone-300 bg-white text-xs font-semibold">{roleName.slice(0, 2).toUpperCase()}</span>
            {open && (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[13px] font-medium">{roleName}</span>
                  <span className="block truncate text-[11.5px] text-stone-500">{db.settings.businessName}</span>
                </span>
                <ChevronUp className="size-4 text-stone-400" />
              </>
            )}
          </button>
        </div>
      </aside>

      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-white md:hidden"
        style={{ gridTemplateColumns: `repeat(${bottom.length + (bottom.length < links.length ? 1 : 0)}, minmax(0,1fr))` }}
        aria-label="Navigasi utama"
      >
        {bottom.map((n) => {
          const Icon = n.icon;
          return (
            <Link key={n.href} href={n.href} className={cx("flex flex-col items-center gap-0.5 py-2 text-[11px]", isOn(n.href) ? "font-medium text-accent-hover" : "text-stone-500")}>
              <Icon className="size-5" /> {n.label}
            </Link>
          );
        })}
        {bottom.length < links.length && (
          <button onClick={() => setSheet(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-stone-500">
            <Menu className="size-5" /> Lainnya
          </button>
        )}
      </nav>
      {sheet && (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setSheet(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <Logo />
              <button onClick={() => setSheet(false)} aria-label="Tutup">
                <X className="size-5" />
              </button>
            </div>
            {links.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.href} className="border-b border-stone-100 py-2">
                  <Link href={n.href} className={cx("flex items-center gap-3 py-1.5 font-medium", isOn(n.href) && "text-accent-hover")}>
                    <Icon className="size-4" /> {n.label}
                  </Link>
                </div>
              );
            })}
            <button onClick={doLogout} className="mt-3 w-full rounded-lg border border-stone-300 py-2 text-sm">
              Keluar
            </button>
          </div>
        </div>
      )}

      <main id="konten-utama" className={cx("min-h-full px-4 pt-6 pb-24 transition-all sm:px-6 md:pt-8 md:pb-10 lg:px-[26px]", open ? "md:ml-[245px]" : "md:ml-14")}>
        <div className="mx-auto max-w-[1600px]">
          <div className="no-print mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] text-amber-900">
            <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
            Mode demo — data tersimpan di browser ini, belum persisten di server.
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
