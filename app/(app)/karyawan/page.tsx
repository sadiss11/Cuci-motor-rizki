"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { audit } from "@/lib/logic";
import { computePayroll, deleteEmployee, employeeHistory, overlappingPayroll, savePayroll, slipText, voidPayroll } from "@/lib/payroll";
import { Trash2 } from "lucide-react";
import { fmtDateTime, normalizePhone, parseAmount, rupiah, uid, waLink } from "@/lib/format";
import type { Range } from "@/lib/report";
import type { BonusTier, CommissionRule, Employee, PayPeriod, PayrollRecord } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select } from "@/components/ui";
import { RangePicker } from "@/components/RangePicker";

type Tab = "karyawan" | "bonus" | "gaji";

export default function KaryawanPage() {
  const [tab, setTab] = useState<Tab>("gaji");
  return (
    <>
      <PageHeader title="Karyawan & Gaji" desc="Gaji pokok per orang, komisi per motor, bonus target, dan slip gaji." />
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {(
          [
            ["gaji", "Penggajian"],
            ["karyawan", "Data karyawan"],
            ["bonus", "Skema komisi & bonus"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-8 rounded-full border px-3.5 text-[12.5px] ${tab === k ? "border-accent-200 bg-accent-50 font-semibold text-accent-hover" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === "karyawan" && <EmployeesTab />}
      {tab === "bonus" && <BonusTab />}
      {tab === "gaji" && <PayrollTab />}
    </>
  );
}

/* ================= DATA KARYAWAN ================= */

const PAY_LABEL: Record<PayPeriod, string> = { harian: "per hari", mingguan: "per minggu", bulanan: "per bulan" };

function blankEmployee(): Employee {
  return {
    id: uid(),
    name: "",
    position: "pencuci",
    phone: "",
    payType: "harian",
    baseRate: 50000,
    allowance: 15000,
    commissionMode: "standar",
    customCommission: {},
    targetBonus: true,
    active: true,
    joinedAt: new Date().toISOString(),
  };
}

function EmployeesTab() {
  const { db, role, commit } = useApp();
  const [edit, setEdit] = useState<Employee | null>(null);
  const [err, setErr] = useState("");

  const save = () => {
    if (!edit) return;
    setErr("");
    if (!edit.name.trim()) return setErr("Nama wajib diisi");
    if (edit.phone && !normalizePhone(edit.phone)) return setErr("Nomor WA tidak valid");
    if (edit.baseRate < 0 || edit.allowance < 0) return setErr("Nominal tidak boleh negatif");
    const e = { ...edit, name: edit.name.trim(), phone: edit.phone ? normalizePhone(edit.phone)! : "" };
    commit((d) => {
      const i = d.employees.findIndex((x) => x.id === e.id);
      if (i >= 0) d.employees[i] = e;
      else d.employees.push(e);
      audit(d, role, i >= 0 ? "karyawan.ubah" : "karyawan.tambah", `${e.name}: ${e.payType} ${e.baseRate}, makan ${e.allowance}, komisi ${e.commissionMode}`);
    });
    setEdit(null);
  };

  const remove = (emp: Employee) => {
    const h = employeeHistory(db, emp.id);
    const extra = h.orders || h.payrolls ? `

${emp.name} punya riwayat ${h.orders} pesanan dan ${h.payrolls} slip gaji. Riwayat tetap tersimpan, tapi karyawan tidak bisa dipilih lagi.` : "";
    if (!confirm(`Hapus karyawan ${emp.name}?${extra}

Tips: jika hanya berhenti sementara, cukup hilangkan centang "Aktif".`)) return;
    try {
      commit((d) => deleteEmployee(d, emp.id, role));
      setEdit(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <Card title={`${db.employees.length} karyawan`} action={<Button size="sm" onClick={() => setEdit(blankEmployee())}>+ Tambah</Button>}>
        <ul className="-m-5 divide-y divide-line">
          {db.employees.map((e) => (
            <li key={e.id}>
              <button onClick={() => setEdit(structuredClone(e))} className={`flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-left hover:bg-soft ${edit?.id === e.id ? "bg-soft" : ""}`}>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{e.name}</span> <Badge>{e.position}</Badge> {!e.active && <Badge tone="bad">nonaktif</Badge>}
                  <span className="num block text-xs text-muted">
                    {rupiah(e.baseRate)} {PAY_LABEL[e.payType]}
                    {e.allowance ? ` · makan ${rupiah(e.allowance)}/hari` : ""} · komisi {e.commissionMode}
                    {e.targetBonus ? " · ikut bonus target" : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {db.employees.length === 0 && <li className="px-5 py-8 text-center text-[13px] text-stone-500">Belum ada karyawan.</li>}
        </ul>
      </Card>
      <div className="lg:sticky lg:top-24 lg:self-start">
        {edit ? (
          <Card title={db.employees.some((x) => x.id === edit.id) ? `Ubah ${edit.name}` : "Karyawan baru"}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nama">
                  <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                </Field>
                <Field label="Posisi">
                  <Select value={edit.position} onChange={(e) => setEdit({ ...edit, position: e.target.value as Employee["position"] })}>
                    <option value="pencuci">Pencuci</option>
                    <option value="kasir">Kasir</option>
                    <option value="lainnya">Lainnya</option>
                  </Select>
                </Field>
              </div>
              <Field label="Nomor WA (untuk kirim slip)">
                <Input value={edit.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} inputMode="tel" placeholder="0812xxxxxxx" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Jenis gaji pokok">
                  <Select value={edit.payType} onChange={(e) => setEdit({ ...edit, payType: e.target.value as PayPeriod })}>
                    <option value="harian">Harian</option>
                    <option value="mingguan">Mingguan</option>
                    <option value="bulanan">Bulanan</option>
                  </Select>
                </Field>
                <Field label={`Gaji pokok ${PAY_LABEL[edit.payType]}`}>
                  <Input inputMode="numeric" value={edit.baseRate} onChange={(e) => setEdit({ ...edit, baseRate: parseAmount(e.target.value) })} />
                </Field>
              </div>
              <Field label="Uang makan per hari masuk" hint="Isi 0 jika tidak ada">
                <Input inputMode="numeric" value={edit.allowance} onChange={(e) => setEdit({ ...edit, allowance: parseAmount(e.target.value) })} />
              </Field>
              <Field label="Komisi per motor">
                <Select value={edit.commissionMode} onChange={(e) => setEdit({ ...edit, commissionMode: e.target.value as Employee["commissionMode"] })}>
                  <option value="standar">Ikut skema standar</option>
                  <option value="khusus">Khusus untuk karyawan ini</option>
                  <option value="tanpa">Tanpa komisi</option>
                </Select>
              </Field>
              {edit.commissionMode === "khusus" && (
                <div className="rounded-md border border-line p-3">
                  <p className="mb-2 text-xs text-muted">Kosongkan nilai untuk memakai skema standar pada paket itu.</p>
                  <CommissionEditor
                    value={edit.customCommission}
                    fallback={db.settings.commission}
                    onChange={(v) => setEdit({ ...edit, customCommission: v })}
                  />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[#c8102e]" checked={edit.targetBonus} onChange={(e) => setEdit({ ...edit, targetBonus: e.target.checked })} />
                Ikut bonus target jumlah motor
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[#c8102e]" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />
                Aktif
              </label>
              {err && <p className="text-sm text-accent" role="alert">{err}</p>}
              <div className="flex gap-2">
                <Button onClick={save} className="flex-1">
                  Simpan
                </Button>
                <Button variant="ghost" onClick={() => setEdit(null)}>
                  Batal
                </Button>
              </div>
              {db.employees.some((x) => x.id === edit.id) && (
                <Button variant="danger" className="w-full" onClick={() => remove(edit)}>
                  <Trash2 className="size-4" /> Hapus karyawan
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <Empty>Pilih karyawan untuk mengubah gaji & komisinya, atau tambah karyawan baru.</Empty>
          </Card>
        )}
      </div>
    </div>
  );
}

function CommissionEditor({
  value,
  onChange,
  fallback,
}: {
  value: Record<string, CommissionRule>;
  onChange: (v: Record<string, CommissionRule>) => void;
  fallback?: Record<string, CommissionRule>;
}) {
  const { db } = useApp();
  return (
    <div className="space-y-2">
      {db.services.map((s) => {
        const r = value[s.id];
        const fb = fallback?.[s.id];
        return (
          <div key={s.id} className="grid grid-cols-[1fr_96px_110px] items-center gap-2 text-sm">
            <span className="truncate">{s.name}</span>
            <Select
              className="h-9 text-sm"
              value={r?.type ?? fb?.type ?? "nominal"}
              onChange={(e) => onChange({ ...value, [s.id]: { type: e.target.value as CommissionRule["type"], value: r?.value ?? 0 } })}
              aria-label={`Jenis komisi ${s.name}`}
            >
              <option value="nominal">Rp</option>
              <option value="persen">%</option>
            </Select>
            <Input
              className="num h-9 text-sm"
              inputMode="numeric"
              placeholder={fb ? (fb.type === "persen" ? `${fb.value}%` : String(fb.value)) : "0"}
              value={r?.value ? r.value : ""}
              onChange={(e) => {
                const n = parseAmount(e.target.value);
                const next = { ...value };
                if (!n && fallback) delete next[s.id];
                else next[s.id] = { type: r?.type ?? fb?.type ?? "nominal", value: n };
                onChange(next);
              }}
              aria-label={`Nilai komisi ${s.name}`}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ================= SKEMA KOMISI & BONUS ================= */

function BonusTab() {
  const { db, role, commit } = useApp();
  const [commission, setCommission] = useState(db.settings.commission);
  const [tiers, setTiers] = useState<BonusTier[]>(db.settings.bonusTiers);
  const [msg, setMsg] = useState("");

  const save = () => {
    commit((d) => {
      d.settings.commission = commission;
      d.settings.bonusTiers = tiers.filter((t) => t.minMotors > 0 && t.amount > 0);
      audit(d, role, "bonus.ubah", `komisi ${Object.keys(commission).length} paket, ${tiers.length} target`);
    });
    setMsg("Tersimpan.");
    setTimeout(() => setMsg(""), 1500);
  };

  // contoh hitung untuk motor sedang
  const example = db.services.map((s) => {
    const r = commission[s.id];
    const v = !r ? 0 : r.type === "persen" ? (s.prices.sedang * r.value) / 100 : r.value;
    return { name: s.name, v };
  });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Komisi standar per motor" action={<Button size="sm" onClick={save}>Simpan</Button>}>
        <CommissionEditor value={commission} onChange={setCommission} />
        <p className="mt-3 text-xs text-muted">
          Komisi dihitung dari harga paket (sebelum diskon/voucher) untuk pesanan berstatus <b>selesai</b>, dibagi rata jika dikerjakan lebih dari satu pencuci.
          Karyawan dengan komisi &quot;khusus&quot; memakai angka sendiri.
        </p>
        <div className="mt-3 rounded-md bg-soft p-3 text-xs">
          <div className="mb-1 font-medium">Contoh untuk motor sedang:</div>
          {example.map((e) => (
            <div key={e.name} className="num flex justify-between">
              <span>{e.name}</span>
              <span>{rupiah(e.v)}</span>
            </div>
          ))}
        </div>
        {msg && <p className="mt-2 text-sm text-ok">{msg}</p>}
      </Card>
      <Card
        title="Bonus target jumlah motor"
        action={
          <Button size="sm" variant="outline" onClick={() => setTiers([...tiers, { id: uid(), period: "harian", minMotors: 10, amount: 20000 }])}>
            + Target
          </Button>
        }
      >
        {tiers.length === 0 ? (
          <Empty>Belum ada target.</Empty>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_1fr_32px] gap-2 text-xs text-muted">
              <span>Dihitung per</span>
              <span>Min. motor</span>
              <span>Bonus (Rp)</span>
              <span />
            </div>
            {tiers.map((t, i) => (
              <div key={t.id} className="grid grid-cols-[1fr_80px_1fr_32px] items-center gap-2">
                <Select className="h-9 text-sm" value={t.period} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, period: e.target.value as PayPeriod } : x)))} aria-label="Periode target">
                  <option value="harian">Hari</option>
                  <option value="mingguan">Minggu</option>
                  <option value="bulanan">Bulan</option>
                </Select>
                <Input className="num h-9 text-sm" inputMode="numeric" value={t.minMotors} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, minMotors: parseAmount(e.target.value) } : x)))} aria-label="Minimal motor" />
                <Input className="num h-9 text-sm" inputMode="numeric" value={t.amount} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, amount: parseAmount(e.target.value) } : x)))} aria-label="Nominal bonus" />
                <button className="h-9 rounded text-muted hover:text-accent" onClick={() => setTiers(tiers.filter((_, j) => j !== i))} aria-label="Hapus target">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          Untuk setiap hari/minggu/bulan, karyawan mendapat bonus dari <b>tingkat tertinggi</b> yang tercapai pada periode itu (tidak dijumlah antar tingkat yang sama). Contoh: target harian 8 motor = Rp15.000 dan 12 motor = Rp30.000 → hari dengan 13 motor dapat Rp30.000.
        </p>
        <Button className="mt-3 w-full" onClick={save}>
          Simpan skema
        </Button>
      </Card>
    </div>
  );
}

/* ================= PENGGAJIAN ================= */

function weekRange(offset = 0): Range {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  const e = new Date(d);
  e.setDate(e.getDate() + 6);
  const k = (x: Date) => x.toISOString().slice(0, 10);
  return { from: k(d), to: k(e) };
}

function PayrollTab() {
  const { db } = useApp();
  const [range, setRange] = useState<Range>(weekRange(0));
  const [sel, setSel] = useState<string | null>(null);
  const emps = db.employees.filter((e) => e.active || db.payrolls.some((p) => p.employeeId === e.id));
  const calcs = useMemo(() => emps.map((e) => ({ e, c: computePayroll(db, e, range), paid: overlappingPayroll(db, e.id, range) })), [db, emps, range]);
  const selected = calcs.find((x) => x.e.id === sel);
  const total = calcs.reduce((s, x) => s + x.c.gross, 0);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setRange(weekRange(-1))} className="h-8 rounded-full border border-stone-200 bg-white px-3 text-[12.5px] text-stone-700 hover:bg-stone-50">
          Minggu lalu
        </button>
        <button onClick={() => setRange(weekRange(0))} className="h-8 rounded-full border border-stone-200 bg-white px-3 text-[12.5px] text-stone-700 hover:bg-stone-50">
          Minggu ini
        </button>
        <RangePicker value={range} onChange={setRange} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-5">
          <Card title={`Estimasi gaji ${range.from} s.d. ${range.to}`} action={<span className="num text-sm font-semibold">{rupiah(total)}</span>}>
            <div className="-m-5 overflow-x-auto">
              <table className="num w-full min-w-[620px] text-sm">
                <thead className="border-b border-line text-left text-xs text-muted">
                  <tr>
                    <th className="px-5 py-2 font-medium">Karyawan</th>
                    <th className="py-2 text-right font-medium">Hari</th>
                    <th className="py-2 text-right font-medium">Motor</th>
                    <th className="py-2 text-right font-medium">Pokok + makan</th>
                    <th className="py-2 text-right font-medium">Komisi</th>
                    <th className="py-2 text-right font-medium">Bonus</th>
                    <th className="px-5 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {calcs.map(({ e, c, paid }) => (
                    <tr key={e.id} onClick={() => setSel(e.id)} className={`cursor-pointer hover:bg-soft ${sel === e.id ? "bg-soft" : ""}`}>
                      <td className="px-5 py-2.5">
                        <span className="font-medium">{e.name}</span> {paid && <Badge tone="ok">dibayar</Badge>}
                        <span className="block text-xs text-muted">{e.position}</span>
                      </td>
                      <td className="text-right">{c.daysWorked}</td>
                      <td className="text-right">{c.motors}</td>
                      <td className="text-right">{rupiah(c.base + c.allowance)}</td>
                      <td className="text-right">{rupiah(c.commission)}</td>
                      <td className="text-right">{rupiah(c.targetBonus)}</td>
                      <td className="px-5 text-right font-semibold">{rupiah(c.gross)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-xs text-muted">Klik baris untuk detail, tambah bonus/potongan (kasbon), lalu bayar. Pembayaran otomatis tercatat sebagai kas keluar kategori gaji.</p>
          </Card>
          <PayrollHistory />
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          {selected ? (
            <PayrollDetail key={selected.e.id + range.from + range.to} emp={selected.e} range={range} />
          ) : (
            <Card>
              <Empty>Pilih karyawan untuk melihat rincian dan membayar gaji.</Empty>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function PayrollDetail({ emp, range }: { emp: Employee; range: Range }) {
  const { db, role, commit } = useApp();
  const base = computePayroll(db, emp, range);
  const [days, setDays] = useState(base.defaultDays);
  const [adj, setAdj] = useState<{ label: string; amount: string; neg: boolean }[]>([]);
  const [err, setErr] = useState("");
  const c = computePayroll(db, emp, range, days);
  const adjustments = adj.map((a) => ({ label: a.label, amount: (a.neg ? -1 : 1) * parseAmount(a.amount) }));
  const total = c.gross + adjustments.reduce((s, a) => s + a.amount, 0);
  const paid = overlappingPayroll(db, emp.id, range);

  const pay = () => {
    setErr("");
    if (!confirm(`Bayar gaji ${emp.name} sebesar ${rupiah(total)} dan catat ke kas?`)) return;
    try {
      commit((d) => savePayroll(d, d.employees.find((x) => x.id === emp.id)!, range, days, adjustments, role));
      setAdj([]);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <Card title={`Rincian · ${emp.name}`}>
      <div className="space-y-4 text-sm">
        {paid && (
          <div className="rounded-md border border-ok bg-[#e7f3ec] p-2 text-xs text-ok">
            Sudah dibayar untuk {paid.from} s.d. {paid.to} ({rupiah(paid.total)}). Lihat riwayat di bawah.
          </div>
        )}
        <Field label="Hari masuk" hint={`Otomatis: ${base.defaultDays} hari (${emp.position === "pencuci" ? "hari ada motor dikerjakan" : "hari gerai buka"}). Ubah bila perlu.`}>
          <Input type="number" min={0} max={c.periodDays} value={days} onChange={(e) => setDays(Math.max(0, Math.min(c.periodDays, Number(e.target.value) || 0)))} />
        </Field>
        <dl className="num space-y-1.5">
          <Line k={`Gaji pokok (${c.baseNote})`} v={c.base} />
          {emp.allowance > 0 && <Line k={`Uang makan ${days} × ${rupiah(emp.allowance)}`} v={c.allowance} />}
          <Line k={`Komisi ${c.motors} motor (${emp.commissionMode})`} v={c.commission} />
          {c.perService.map((p) => (
            <div key={p.name} className="flex justify-between pl-3 text-xs text-muted">
              <span>
                {p.name} × {p.count}
              </span>
              <span>{rupiah(p.amount)}</span>
            </div>
          ))}
          <Line k="Bonus target" v={c.targetBonus} />
          {c.bonusLines.map((b) => (
            <div key={b.label} className="flex justify-between gap-2 pl-3 text-xs text-muted">
              <span>{b.label}</span>
              <span>{rupiah(b.amount)}</span>
            </div>
          ))}
          {!emp.targetBonus && <p className="pl-3 text-xs text-muted">Karyawan ini tidak ikut bonus target.</p>}
        </dl>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <b className="text-xs">Bonus lain / potongan</b>
            <span className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setAdj([...adj, { label: "Bonus kerajinan", amount: "", neg: false }])}>
                + Bonus
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdj([...adj, { label: "Kasbon", amount: "", neg: true }])}>
                + Potongan
              </Button>
            </span>
          </div>
          {adj.map((a, i) => (
            <div key={i} className="grid grid-cols-[1fr_110px_28px] items-center gap-2">
              <Input className="h-9 text-sm" value={a.label} onChange={(e) => setAdj(adj.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label="Keterangan" />
              <Input
                className={`num h-9 text-sm ${a.neg ? "text-accent" : ""}`}
                inputMode="numeric"
                placeholder={a.neg ? "−0" : "+0"}
                value={a.amount}
                onChange={(e) => setAdj(adj.map((x, j) => (j === i ? { ...x, amount: e.target.value.replace(/\D/g, "") } : x)))}
                aria-label="Nominal"
              />
              <button className="text-muted hover:text-accent" onClick={() => setAdj(adj.filter((_, j) => j !== i))} aria-label="Hapus">
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="num flex justify-between border-t border-line pt-3 text-lg font-bold">
          <span>Total diterima</span>
          <span>{rupiah(total)}</span>
        </div>
        {err && <p className="text-accent" role="alert">{err}</p>}
        <Button className="w-full" onClick={pay} disabled={!!paid || total < 0}>
          {paid ? "Periode ini sudah dibayar" : "Bayar & catat ke kas"}
        </Button>
      </div>
    </Card>
  );
}

const Line = ({ k, v }: { k: string; v: number }) => (
  <div className="flex justify-between gap-3">
    <dt className="text-muted">{k}</dt>
    <dd className="font-medium">{rupiah(v)}</dd>
  </div>
);

function PayrollHistory() {
  const { db, role, commit } = useApp();
  const [slip, setSlip] = useState<PayrollRecord | null>(null);
  const printSlip = () => {
    document.body.classList.add("printing-slip");
    window.print();
    setTimeout(() => document.body.classList.remove("printing-slip"), 500);
  };
  const emp = (id: string) => db.employees.find((e) => e.id === id);

  return (
    <Card title="Riwayat slip gaji">
      {db.payrolls.length === 0 ? (
        <Empty>Belum ada gaji dibayar.</Empty>
      ) : (
        <ul className="-m-5 divide-y divide-line">
          {db.payrolls.map((p) => (
            <li key={p.id} className={`px-5 py-3 text-sm ${p.voided ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="min-w-0 flex-1">
                  <b>{p.employeeName}</b> · {p.from} s.d. {p.to}
                  <span className="block text-xs text-muted">
                    Dibayar {fmtDateTime(p.paidAt)}
                    {p.voided && ` · DIBATALKAN: ${p.voided.reason}`}
                  </span>
                </span>
                <span className="num font-semibold">{rupiah(p.total)}</span>
                <Button size="sm" variant="ghost" onClick={() => setSlip(slip?.id === p.id ? null : p)}>
                  Slip
                </Button>
                {!p.voided && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const reason = prompt("Alasan membatalkan slip gaji (kas gaji ikut dibatalkan):");
                      if (reason)
                        try {
                          commit((d) => voidPayroll(d, p.id, reason, role));
                        } catch (e) {
                          alert((e as Error).message);
                        }
                    }}
                  >
                    Batalkan
                  </Button>
                )}
              </div>
              {slip?.id === p.id && (
                <div className="mt-3">
                  <div className="print-area rounded-md border border-line bg-paper p-4">
                    <div className="mb-3 border-b border-line pb-2">
                      <div className="h-1 w-8 bg-accent" />
                      <div className="font-display mt-1 text-lg uppercase">{db.settings.businessName}</div>
                      <div className="text-xs text-muted">Slip gaji · {p.from} s.d. {p.to}</div>
                    </div>
                    <div className="mb-2 text-sm">
                      <b>{p.employeeName}</b> · {p.daysWorked} hari · {p.motors} motor
                    </div>
                    <dl className="num space-y-1 text-sm">
                      <Line k="Gaji pokok" v={p.base} />
                      {p.allowance > 0 && <Line k="Uang makan" v={p.allowance} />}
                      <Line k="Komisi" v={p.commission} />
                      {p.targetBonus > 0 && <Line k="Bonus target" v={p.targetBonus} />}
                      {p.adjustments.map((a, i) => (
                        <Line key={i} k={a.label} v={a.amount} />
                      ))}
                      <div className="flex justify-between border-t border-line pt-2 font-bold">
                        <span>Total diterima</span>
                        <span>{rupiah(p.total)}</span>
                      </div>
                    </dl>
                    <div className="mt-8 grid grid-cols-2 gap-6 text-center text-xs text-muted">
                      <div>
                        Owner
                        <div className="mt-10 border-t border-line" />
                      </div>
                      <div>
                        Karyawan
                        <div className="mt-10 border-t border-line" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={printSlip}>
                      Cetak slip
                    </Button>
                    <Button size="sm" disabled={!emp(p.employeeId)?.phone} onClick={() => window.open(waLink(emp(p.employeeId)!.phone!, slipText(db, p)), "_blank", "noopener")}>
                      Kirim slip via WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
