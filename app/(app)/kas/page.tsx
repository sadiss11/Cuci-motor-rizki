"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { addCash, voidCash } from "@/lib/logic";
import { dayKey, fmtDateTime, parseAmount, rupiah } from "@/lib/format";
import { groupRows, presetRange, summarize, type Range } from "@/lib/report";
import type { CashCategory } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Segmented, Select, Stat } from "@/components/ui";
import { RangePicker } from "@/components/RangePicker";

const KELUAR: CashCategory[] = ["sabun", "bahan poles", "gaji", "listrik", "sewa", "lain-lain"];

export default function KasPage() {
  const { db, role, commit } = useApp();
  const [range, setRange] = useState<Range>(presetRange("7hari"));
  const [type, setType] = useState<"keluar" | "masuk">("keluar");
  const [date, setDate] = useState(dayKey(new Date().toISOString()));
  const [category, setCategory] = useState<CashCategory>("sabun");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pic, setPic] = useState("");
  const [err, setErr] = useState("");
  const [showVoided, setShowVoided] = useState(false);

  const s = useMemo(() => summarize(db, range), [db, range]);
  const daily = useMemo(() => groupRows(db, range, "harian"), [db, range]);
  const entries = db.cash.filter((c) => (showVoided || !c.voided) && dayKey(c.date) >= range.from && dayKey(c.date) <= range.to);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const d = new Date(date + "T" + new Date().toTimeString().slice(0, 8));
      commit((db) =>
        addCash(db, { date: d.toISOString(), type, category: type === "masuk" ? "pemasukan lain" : category, amount: parseAmount(amount), note: note.trim(), pic: pic.trim() || role }, role),
      );
      setAmount("");
      setNote("");
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <>
      <PageHeader title="Kas masuk & keluar" desc="Pemasukan transaksi lunas tercatat otomatis (satu kali per pesanan)." />
      <div className="mb-4">
        <RangePicker value={range} onChange={setRange} />
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Kas masuk" value={rupiah(s.kasMasuk)} />
        <Stat label="Kas keluar" value={rupiah(s.kasKeluar)} />
        <Stat label="Selisih operasional" value={rupiah(s.selisih)} accent />
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <Card title="Catat kas manual">
            <form onSubmit={submit} className="space-y-3">
              <Segmented
                label="Jenis"
                value={type}
                onChange={setType}
                options={[
                  { value: "keluar", label: "Pengeluaran" },
                  { value: "masuk", label: "Pemasukan lain" },
                ]}
              />
              <Field label="Tanggal">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </Field>
              {type === "keluar" && (
                <Field label="Kategori">
                  <Select value={category} onChange={(e) => setCategory(e.target.value as CashCategory)}>
                    {KELUAR.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label="Nominal (Rp)">
                <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} required placeholder="0" />
              </Field>
              <Field label="Catatan">
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <Field label="Penanggung jawab">
                <Input value={pic} onChange={(e) => setPic(e.target.value)} placeholder={role} />
              </Field>
              {err && <p className="text-sm text-accent" role="alert">{err}</p>}
              <Button type="submit" className="w-full">
                Simpan
              </Button>
            </form>
          </Card>
          <Card title="Rekap harian">
            {daily.length === 0 ? (
              <Empty>Kosong.</Empty>
            ) : (
              <table className="num w-full text-sm">
                <thead className="text-left text-xs text-muted">
                  <tr>
                    <th className="py-1 font-medium">Tanggal</th>
                    <th className="py-1 text-right font-medium">Masuk</th>
                    <th className="py-1 text-right font-medium">Keluar</th>
                    <th className="py-1 text-right font-medium">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {daily.map((r) => (
                    <tr key={r.key}>
                      <td className="py-1.5">{r.key.slice(5)}</td>
                      <td className="text-right">{rupiah(r.masuk)}</td>
                      <td className="text-right">{rupiah(r.keluar)}</td>
                      <td className={`text-right font-medium ${r.masuk - r.keluar < 0 ? "text-accent" : ""}`}>{rupiah(r.masuk - r.keluar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <Card
          title={`Entri kas (${entries.length})`}
          action={
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" className="accent-[#c8102e]" checked={showVoided} onChange={(e) => setShowVoided(e.target.checked)} />
              tampilkan yang dibatalkan
            </label>
          }
        >
          {entries.length === 0 ? (
            <Empty>Tidak ada entri pada rentang ini.</Empty>
          ) : (
            <ul className="-m-4 divide-y divide-line">
              {entries.slice(0, 300).map((c) => (
                <li key={c.id} className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm ${c.voided ? "opacity-50" : ""}`}>
                  <span className="w-full text-xs text-muted sm:w-36">{fmtDateTime(c.date)}</span>
                  <span className="min-w-0 flex-1">
                    <Badge tone={c.type === "masuk" ? "ok" : "bad"}>{c.category}</Badge> <span className={c.voided ? "line-through" : ""}>{c.note || "-"}</span>
                    <span className="block text-xs text-muted">
                      PJ: {c.pic} · {c.source === "order" ? "otomatis" : "manual"}
                      {c.voided && ` · dibatalkan ${c.voided.by}: ${c.voided.reason}`}
                    </span>
                  </span>
                  <span className={`num font-semibold ${c.type === "keluar" ? "text-accent" : ""}`}>
                    {c.type === "keluar" ? "−" : "+"}
                    {rupiah(c.amount)}
                  </span>
                  {role === "owner" && c.source === "manual" && !c.voided && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const reason = window.prompt("Alasan membatalkan entri (tercatat di audit):");
                        if (reason) {
                          try {
                            commit((d) => voidCash(d, c.id, reason, role));
                          } catch (e) {
                            alert((e as Error).message);
                          }
                        }
                      }}
                    >
                      Batalkan
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-xs text-muted">Entri tidak pernah dihapus. Pembatalan hanya oleh owner, dengan alasan, dan tercatat di audit trail.</p>
        </Card>
      </div>
    </>
  );
}
