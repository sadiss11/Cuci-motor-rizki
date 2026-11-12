// Perhitungan gaji karyawan: gaji pokok + uang makan + komisi per motor + bonus target ± penyesuaian.
import type { CommissionRule, DB, Employee, Order, PayrollRecord, Role } from "./types";
import { dayKey, monthKey, uid, weekKey } from "./format";
import { audit, now } from "./logic";
import type { Range } from "./report";

const DAY = 86400000;
export const daysBetween = (r: Range) => Math.round((Date.parse(r.to) - Date.parse(r.from)) / DAY) + 1;
const daysInMonth = (ymd: string) => {
  const [y, m] = ymd.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};

export const workDate = (o: Order) => dayKey(o.doneAt ?? o.createdAt);

export function commissionRule(db: DB, emp: Employee, serviceId: string): CommissionRule | undefined {
  if (emp.commissionMode === "tanpa") return undefined;
  if (emp.commissionMode === "khusus" && emp.customCommission[serviceId]) return emp.customCommission[serviceId];
  return db.settings.commission[serviceId];
}

/** Komisi dihitung dari HARGA PAKET (sebelum diskon/voucher) — tenaga tetap dibayar — dibagi rata antar pencuci. */
export function commissionFor(db: DB, emp: Employee, o: Order) {
  const rule = commissionRule(db, emp, o.serviceId);
  if (!rule || !(rule.value > 0)) return 0;
  const raw = rule.type === "persen" ? (o.price * rule.value) / 100 : rule.value;
  return Math.round(raw / Math.max(1, o.workerIds?.length ?? 1));
}

export function workedOrders(db: DB, empId: string, r: Range) {
  return db.orders.filter((o) => o.status === "selesai" && o.workerIds?.includes(empId) && workDate(o) >= r.from && workDate(o) <= r.to);
}

export function computePayroll(db: DB, emp: Employee, r: Range, daysOverride?: number) {
  const orders = workedOrders(db, emp.id, r);
  const ownDays = new Set(orders.map(workDate)).size;
  const openDays = new Set(db.orders.filter((o) => o.status !== "batal" && dayKey(o.createdAt) >= r.from && dayKey(o.createdAt) <= r.to).map((o) => dayKey(o.createdAt))).size;
  const defaultDays = emp.position === "pencuci" ? ownDays : openDays;
  const daysWorked = daysOverride ?? defaultDays;
  const periodDays = daysBetween(r);

  let base = 0;
  let baseNote = "";
  if (emp.payType === "harian") {
    base = emp.baseRate * daysWorked;
    baseNote = `${daysWorked} hari × ${emp.baseRate.toLocaleString("id-ID")}`;
  } else if (emp.payType === "mingguan") {
    base = Math.round((emp.baseRate * periodDays) / 7);
    baseNote = `${periodDays}/7 minggu × ${emp.baseRate.toLocaleString("id-ID")}`;
  } else {
    const dim = daysInMonth(r.from);
    base = Math.round(emp.baseRate * Math.min(1, periodDays / dim));
    baseNote = periodDays >= dim ? "1 bulan" : `${periodDays}/${dim} hari × ${emp.baseRate.toLocaleString("id-ID")}`;
  }
  const allowance = emp.allowance * daysWorked;

  const perService = new Map<string, { name: string; count: number; amount: number }>();
  let commission = 0;
  for (const o of orders) {
    const c = commissionFor(db, emp, o);
    commission += c;
    const e = perService.get(o.serviceId) ?? { name: o.serviceName, count: 0, amount: 0 };
    e.count++;
    e.amount += c;
    perService.set(o.serviceId, e);
  }

  const bonusLines: { label: string; amount: number }[] = [];
  if (emp.targetBonus) {
    for (const period of ["harian", "mingguan", "bulanan"] as const) {
      const tiers = db.settings.bonusTiers.filter((t) => t.period === period && t.minMotors > 0).sort((a, b) => b.minMotors - a.minMotors);
      if (!tiers.length) continue;
      const key = period === "harian" ? dayKey : period === "mingguan" ? weekKey : monthKey;
      const buckets = new Map<string, number>();
      for (const o of orders) {
        const k = key(o.doneAt ?? o.createdAt);
        buckets.set(k, (buckets.get(k) ?? 0) + 1);
      }
      for (const [k, n] of buckets) {
        const hit = tiers.find((t) => n >= t.minMotors);
        if (hit) bonusLines.push({ label: `Target ${period} ${k}: ${n} motor (≥${hit.minMotors})`, amount: hit.amount });
      }
    }
  }
  const targetBonus = bonusLines.reduce((s, b) => s + b.amount, 0);

  return {
    orders,
    motors: orders.length,
    defaultDays,
    daysWorked,
    periodDays,
    base,
    baseNote,
    allowance,
    commission,
    perService: [...perService.values()],
    bonusLines,
    targetBonus,
    gross: base + allowance + commission + targetBonus,
  };
}
export type PayrollCalc = ReturnType<typeof computePayroll>;

export function overlappingPayroll(db: DB, empId: string, r: Range) {
  return db.payrolls.find((p) => !p.voided && p.employeeId === empId && r.from <= p.to && r.to >= p.from);
}

export function savePayroll(db: DB, emp: Employee, r: Range, daysWorked: number, adjustments: { label: string; amount: number }[], by: Role): PayrollRecord {
  if (by !== "owner") throw new Error("Hanya owner yang dapat membayar gaji");
  const clash = overlappingPayroll(db, emp.id, r);
  if (clash) throw new Error(`Periode bertumpuk dengan slip ${clash.from} s.d. ${clash.to} yang sudah dibayar`);
  const calc = computePayroll(db, emp, r, daysWorked);
  const adj = adjustments.filter((a) => a.amount !== 0).map((a) => ({ label: a.label.trim() || (a.amount > 0 ? "Bonus lain" : "Potongan"), amount: Math.round(a.amount) }));
  const total = calc.gross + adj.reduce((s, a) => s + a.amount, 0);
  if (total < 0) throw new Error("Total gaji tidak boleh negatif");
  const rec: PayrollRecord = {
    id: uid(),
    employeeId: emp.id,
    employeeName: emp.name,
    from: r.from,
    to: r.to,
    daysWorked: calc.daysWorked,
    motors: calc.motors,
    base: calc.base,
    allowance: calc.allowance,
    commission: calc.commission,
    targetBonus: calc.targetBonus,
    adjustments: adj,
    total,
    paidAt: now(),
    paidBy: by,
  };
  if (total > 0) {
    const cashId = uid();
    db.cash.unshift({
      id: cashId,
      date: now(),
      type: "keluar",
      category: "gaji",
      amount: total,
      note: `Gaji ${emp.name} ${r.from} s.d. ${r.to}`,
      pic: by,
      source: "payroll",
      createdBy: by,
    });
    rec.cashEntryId = cashId;
  }
  db.payrolls.unshift(rec);
  audit(db, by, "gaji.bayar", `${emp.name} ${r.from}..${r.to} total ${total}`);
  return rec;
}

export function voidPayroll(db: DB, id: string, reason: string, by: Role) {
  if (by !== "owner") throw new Error("Hanya owner");
  if (!reason.trim()) throw new Error("Alasan wajib diisi");
  const p = db.payrolls.find((x) => x.id === id);
  if (!p || p.voided) throw new Error("Slip tidak ditemukan");
  p.voided = { at: now(), by, reason };
  const c = db.cash.find((x) => x.id === p.cashEntryId);
  if (c && !c.voided) c.voided = { at: now(), by, reason: "Slip gaji dibatalkan: " + reason };
  audit(db, by, "gaji.batal", `${p.employeeName} ${p.from}..${p.to}: ${reason}`);
}

export function slipText(db: DB, p: PayrollRecord) {
  const f = (n: number) => "Rp" + n.toLocaleString("id-ID");
  return [
    `*Slip gaji ${db.settings.businessName}*`,
    `${p.employeeName} · ${p.from} s.d. ${p.to}`,
    ``,
    `Gaji pokok: ${f(p.base)}`,
    p.allowance ? `Uang makan (${p.daysWorked} hari): ${f(p.allowance)}` : "",
    `Komisi (${p.motors} motor): ${f(p.commission)}`,
    p.targetBonus ? `Bonus target: ${f(p.targetBonus)}` : "",
    ...p.adjustments.map((a) => `${a.label}: ${a.amount < 0 ? "−" : ""}${f(Math.abs(a.amount))}`),
    ``,
    `*Total diterima: ${f(p.total)}*`,
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
}
