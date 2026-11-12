// Logika bisnis murni (tanpa React). Semua fungsi memodifikasi `db` yang diberikan
// (store sudah meng-clone sebelum memanggil) sehingga satu aksi = satu commit atomik.
import type { CashCategory, CashEntry, Customer, DB, Order, OrderStatus, PayMethod, PayStatus, Role, Size } from "./types";
import { dayKey, normalizePhone, randomToken, uid } from "./format";

let clock: string | null = null;
export const setClock = (iso: string | null) => (clock = iso);
export const now = () => clock ?? new Date().toISOString();

export function audit(db: DB, by: Role, action: string, detail: string) {
  db.audit.unshift({ id: uid(), at: now(), by, action, detail });
  if (db.audit.length > 1000) db.audit.length = 1000;
}

export function nextInvoiceNo(db: DB) {
  db.seq += 1;
  return `INV-${dayKey(now()).replace(/-/g, "")}-${String(db.seq).padStart(4, "0")}`;
}

export function upsertCustomer(db: DB, name: string, rawPhone: string): Customer | undefined {
  const phone = normalizePhone(rawPhone);
  if (!phone) return undefined;
  let c = db.customers.find((x) => x.phone === phone);
  if (!c) {
    c = { id: uid(), name: name.trim() || "Pelanggan", phone, createdAt: now() };
    db.customers.push(c);
  } else if (name.trim() && c.name !== name.trim()) {
    c.name = name.trim();
  }
  return c;
}

export interface NewOrderInput {
  serviceId: string;
  size: Size;
  customerName: string;
  phone: string;
  plate: string;
  discount: number;
  payMethod: PayMethod;
  payStatus: PayStatus;
  received: number;
  voucherId?: string;
}

export function createOrder(db: DB, input: NewOrderInput, by: Role): Order {
  const svc = db.services.find((s) => s.id === input.serviceId);
  if (!svc) throw new Error("Paket tidak ditemukan");
  const price = svc.prices[input.size];
  let customer: Customer | undefined;
  if (input.phone.trim()) {
    customer = upsertCustomer(db, input.customerName, input.phone);
    if (!customer) throw new Error("Nomor WhatsApp tidak valid (contoh: 0812xxxxxxx)");
  }

  let discount = Math.max(0, Math.round(input.discount || 0));
  let payMethod = input.payMethod;
  let payStatus = input.payStatus;
  let voucherId: string | undefined;

  if (input.voucherId) {
    const r = db.loyaltyRewards.find((x) => x.id === input.voucherId);
    if (!r || !customer || r.customerId !== customer.id) throw new Error("Voucher tidak valid untuk pelanggan ini");
    if (r.usedOrderId) throw new Error("Voucher sudah dipakai");
    if (r.serviceId !== svc.id)
      throw new Error("Voucher hanya untuk paket " + (db.services.find((s) => s.id === r.serviceId)?.name ?? "-"));
    voucherId = r.id;
    discount = price;
    payMethod = "voucher";
    payStatus = "lunas";
  }
  if (discount > price) throw new Error("Diskon melebihi harga");
  const total = price - discount;
  if (payStatus === "lunas" && payMethod === "tunai" && total > 0 && input.received < total)
    throw new Error("Nominal diterima kurang dari total");

  const order: Order = {
    id: uid(),
    invoiceNo: nextInvoiceNo(db),
    token: randomToken(24),
    createdAt: now(),
    createdBy: by,
    customerId: customer?.id,
    customerName: customer?.name ?? (input.customerName.trim() || "Umum"),
    plate: input.plate.trim().toUpperCase(),
    serviceId: svc.id,
    serviceName: svc.name,
    size: input.size,
    price,
    discount,
    total,
    voucherId,
    payMethod,
    payStatus,
    received: payMethod === "tunai" ? input.received : total,
    paidAt: payStatus === "lunas" ? now() : undefined,
    status: "baru",
  };
  db.orders.unshift(order);
  if (voucherId) {
    const r = db.loyaltyRewards.find((x) => x.id === voucherId)!;
    r.usedOrderId = order.id;
    r.usedAt = now();
  }
  if (payStatus === "lunas") postIncome(db, order, by);
  audit(db, by, "transaksi.buat", `${order.invoiceNo} ${svc.name} (${input.size}) ${total}`);
  return order;
}

/** Idempoten: satu order lunas = maksimal satu entri kas aktif. */
export function postIncome(db: DB, order: Order, by: Role) {
  if (order.payStatus !== "lunas" || order.total <= 0) return;
  const exists = db.cash.some((c) => c.orderId === order.id && !c.voided);
  if (exists) return;
  db.cash.unshift({
    id: uid(),
    date: order.paidAt ?? now(),
    type: "masuk",
    category: "transaksi",
    amount: order.total,
    note: `${order.invoiceNo} · ${order.serviceName}`,
    pic: by,
    source: "order",
    orderId: order.id,
    createdBy: by,
  });
}

export function markPaid(db: DB, orderId: string, method: PayMethod, received: number, by: Role) {
  const o = db.orders.find((x) => x.id === orderId);
  if (!o) throw new Error("Pesanan tidak ditemukan");
  if (o.status === "batal") throw new Error("Pesanan sudah batal");
  if (o.payStatus === "lunas") return o; // idempoten
  if (method === "tunai" && received < o.total) throw new Error("Nominal diterima kurang dari total");
  o.payMethod = method;
  o.received = method === "tunai" ? received : o.total;
  o.payStatus = "lunas";
  o.paidAt = now();
  postIncome(db, o, by);
  applyLoyalty(db, o);
  audit(db, by, "transaksi.lunas", `${o.invoiceNo} via ${method}`);
  return o;
}

export function setStatus(db: DB, orderId: string, status: OrderStatus, by: Role, reason = "") {
  const o = db.orders.find((x) => x.id === orderId);
  if (!o) throw new Error("Pesanan tidak ditemukan");
  if (o.status === "batal") throw new Error("Pesanan batal tidak dapat diubah");
  if (status === "batal") return cancelOrder(db, o, by, reason);
  o.status = status;
  if (status === "selesai") {
    o.doneAt = now();
    applyLoyalty(db, o);
  }
  audit(db, by, "transaksi.status", `${o.invoiceNo} → ${status}`);
  return o;
}

function cancelOrder(db: DB, o: Order, by: Role, reason: string) {
  if (!reason.trim()) throw new Error("Alasan pembatalan wajib diisi");
  o.status = "batal";
  if (o.payStatus === "lunas") {
    o.payStatus = o.total > 0 ? "refund" : "belum";
    for (const c of db.cash) {
      if (c.orderId === o.id && !c.voided) c.voided = { at: now(), by, reason: "Pesanan batal: " + reason };
    }
  }
  for (const e of db.loyaltyEvents) {
    if (e.orderId === o.id && !e.revokedAt) e.revokedAt = now();
  }
  if (o.voucherId) {
    const r = db.loyaltyRewards.find((x) => x.id === o.voucherId);
    if (r && r.usedOrderId === o.id) {
      r.usedOrderId = undefined;
      r.usedAt = undefined;
    }
  }
  audit(db, by, "transaksi.batal", `${o.invoiceNo}: ${reason}`);
  return o;
}

/** Stempel hanya untuk transaksi berbayar, lunas, selesai, pelanggan ber-WA. Idempoten per order. */
export function applyLoyalty(db: DB, o: Order) {
  if (o.status !== "selesai" || o.payStatus !== "lunas" || o.total <= 0 || o.voucherId || !o.customerId) return;
  const has = db.loyaltyEvents.some((e) => e.orderId === o.id && !e.revokedAt);
  if (has) return;
  db.loyaltyEvents.push({ id: uid(), customerId: o.customerId, orderId: o.id, at: now() });
  syncRewards(db, o.customerId);
}

export function syncRewards(db: DB, customerId: string) {
  const t = Math.max(1, db.settings.loyaltyThreshold);
  const active = db.loyaltyEvents.filter((e) => e.customerId === customerId && !e.revokedAt).length;
  let issued = db.loyaltyRewards.filter((r) => r.customerId === customerId).length;
  while (Math.floor(active / t) > issued) {
    db.loyaltyRewards.push({
      id: uid(),
      customerId,
      serviceId: db.settings.loyaltyRewardServiceId,
      issuedAt: now(),
    });
    issued++;
  }
}

export function loyaltyOf(db: DB, customerId: string) {
  const t = Math.max(1, db.settings.loyaltyThreshold);
  const active = db.loyaltyEvents.filter((e) => e.customerId === customerId && !e.revokedAt).length;
  const rewards = db.loyaltyRewards.filter((r) => r.customerId === customerId);
  const progress = Math.max(0, Math.min(t, active - rewards.length * t));
  return {
    threshold: t,
    totalStamps: active,
    progress,
    available: rewards.filter((r) => !r.usedOrderId),
    used: rewards.filter((r) => r.usedOrderId).length,
  };
}

export function addCash(
  db: DB,
  e: { date: string; type: "masuk" | "keluar"; category: CashCategory; amount: number; note: string; pic: string },
  by: Role,
): CashEntry {
  if (!(e.amount > 0)) throw new Error("Nominal harus lebih dari 0");
  if (e.category === "transaksi") throw new Error("Kategori transaksi dicatat otomatis dari kasir");
  const entry: CashEntry = { id: uid(), ...e, source: "manual", createdBy: by };
  db.cash.unshift(entry);
  audit(db, by, "kas.tambah", `${e.type} ${e.category} ${e.amount}`);
  return entry;
}

export function voidCash(db: DB, id: string, reason: string, by: Role) {
  if (by !== "owner") throw new Error("Hanya owner yang dapat membatalkan entri kas");
  const c = db.cash.find((x) => x.id === id);
  if (!c) throw new Error("Entri tidak ditemukan");
  if (c.source === "order") throw new Error("Entri dari transaksi dibatalkan lewat pembatalan pesanan");
  if (!reason.trim()) throw new Error("Alasan wajib diisi");
  c.voided = { at: now(), by, reason };
  audit(db, by, "kas.batal", `${c.type} ${c.category} ${c.amount}: ${reason}`);
}

export function setConsent(db: DB, customerId: string, granted: boolean, source: string, by: Role) {
  db.consents = db.consents.filter((c) => c.customerId !== customerId);
  db.consents.push({ customerId, granted, at: now(), source });
  audit(db, by, granted ? "promo.optin" : "promo.optout", `${customerId} (${source})`);
}

export const consentOf = (db: DB, customerId: string) => db.consents.find((c) => c.customerId === customerId);

/** Data minimal untuk invoice publik: tanpa nomor WA, nama depan saja, plat disamarkan. */
export function invoicePayload(db: DB, o: Order) {
  const first = o.customerName.split(" ")[0];
  const parts = o.plate.split(/\s+/).filter(Boolean);
  const plate =
    parts.length >= 2
      ? [parts[0], parts[1].slice(0, 2) + "••", ...parts.slice(2)].join(" ")
      : o.plate
        ? o.plate.slice(0, 2) + "••"
        : "";
  return {
    n: db.settings.businessName,
    a: db.settings.address,
    i: o.invoiceNo,
    d: o.createdAt,
    c: first,
    p: plate,
    s: o.serviceName,
    z: o.size,
    pr: o.price,
    ds: o.discount,
    t: o.total,
    m: o.payMethod,
    ps: o.payStatus,
    st: o.status,
  };
}
export type InvoicePayload = ReturnType<typeof invoicePayload>;

export function encodePayload(p: InvoicePayload) {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePayload(s: string): InvoicePayload | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function invoiceUrl(db: DB, o: Order, origin: string) {
  return `${origin}/i/${o.token}#${encodePayload(invoicePayload(db, o))}`;
}

export function invoiceMessage(db: DB, o: Order, origin: string) {
  const fmt = (n: number) => "Rp" + n.toLocaleString("id-ID");
  return [
    `Halo ${o.customerName.split(" ")[0]}, terima kasih sudah cuci di *${db.settings.businessName}*.`,
    ``,
    `No. invoice: ${o.invoiceNo}`,
    `Paket: ${o.serviceName} (motor ${o.size})`,
    `Total: ${fmt(o.total)}${o.voucherId ? " (voucher loyalti)" : ""}`,
    `Status bayar: ${o.payStatus}`,
    ``,
    `Lihat invoice: ${invoiceUrl(db, o, origin)}`,
  ].join("\n");
}
