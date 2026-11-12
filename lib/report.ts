import type { DB } from "./types";
import { dayKey, monthKey, weekKey } from "./format";

export interface Range {
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd (inklusif)
}

export const inRange = (iso: string, r: Range) => {
  const k = dayKey(iso);
  return k >= r.from && k <= r.to;
};

export function presetRange(p: "hari" | "7hari" | "bulan" | "30hari"): Range {
  const t = new Date();
  const to = dayKey(t.toISOString());
  const d = new Date(t);
  if (p === "hari") return { from: to, to };
  if (p === "7hari") d.setDate(d.getDate() - 6);
  if (p === "30hari") d.setDate(d.getDate() - 29);
  if (p === "bulan") d.setDate(1);
  return { from: dayKey(d.toISOString()), to };
}

export function summarize(db: DB, r: Range) {
  const orders = db.orders.filter((o) => inRange(o.createdAt, r));
  const valid = orders.filter((o) => o.status !== "batal");
  const paid = valid.filter((o) => o.payStatus === "lunas");
  const cash = db.cash.filter((c) => !c.voided && inRange(c.date, r));
  const kasMasuk = cash.filter((c) => c.type === "masuk").reduce((s, c) => s + c.amount, 0);
  const kasKeluar = cash.filter((c) => c.type === "keluar").reduce((s, c) => s + c.amount, 0);
  const omzet = paid.reduce((s, o) => s + o.total, 0);
  const diskon = paid.filter((o) => !o.voucherId).reduce((s, o) => s + o.discount, 0);
  const voucher = paid.filter((o) => o.voucherId).reduce((s, o) => s + o.discount, 0);

  const byService = new Map<string, { name: string; count: number; omzet: number }>();
  for (const o of valid) {
    const e = byService.get(o.serviceId) ?? { name: o.serviceName, count: 0, omzet: 0 };
    e.count++;
    if (o.payStatus === "lunas") e.omzet += o.total;
    byService.set(o.serviceId, e);
  }
  const keluarByCat = new Map<string, number>();
  for (const c of cash.filter((c) => c.type === "keluar")) keluarByCat.set(c.category, (keluarByCat.get(c.category) ?? 0) + c.amount);

  return {
    orders,
    valid,
    paid,
    cash,
    jumlahTransaksi: valid.length,
    batal: orders.length - valid.length,
    belumBayar: valid.filter((o) => o.payStatus === "belum").length,
    omzet,
    diskon,
    voucher,
    kasMasuk,
    kasKeluar,
    selisih: kasMasuk - kasKeluar,
    rataRata: paid.filter((o) => o.total > 0).length ? omzet / paid.filter((o) => o.total > 0).length : 0,
    topServices: [...byService.values()].sort((a, b) => b.count - a.count),
    keluarByCat: [...keluarByCat.entries()].sort((a, b) => b[1] - a[1]),
  };
}

export type Group = "harian" | "mingguan" | "bulanan";

export function groupRows(db: DB, r: Range, g: Group) {
  const key = g === "harian" ? dayKey : g === "mingguan" ? weekKey : monthKey;
  const rows = new Map<string, { key: string; transaksi: number; omzet: number; masuk: number; keluar: number }>();
  const get = (k: string) => {
    let e = rows.get(k);
    if (!e) rows.set(k, (e = { key: k, transaksi: 0, omzet: 0, masuk: 0, keluar: 0 }));
    return e;
  };
  for (const o of db.orders) {
    if (!inRange(o.createdAt, r) || o.status === "batal") continue;
    const e = get(key(o.createdAt));
    e.transaksi++;
    if (o.payStatus === "lunas") e.omzet += o.total;
  }
  for (const c of db.cash) {
    if (c.voided || !inRange(c.date, r)) continue;
    const e = get(key(c.date));
    if (c.type === "masuk") e.masuk += c.amount;
    else e.keluar += c.amount;
  }
  return [...rows.values()].sort((a, b) => b.key.localeCompare(a.key));
}
