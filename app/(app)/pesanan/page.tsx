"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { markPaid, setStatus, setWorkers } from "@/lib/logic";
import { dayKey, fmtDateTime, rupiah } from "@/lib/format";
import type { Order, OrderStatus, PayMethod } from "@/lib/types";
import { Badge, Button, Card, Empty, Input, PageHeader, Select, statusTone } from "@/components/ui";
import { InvoiceActions } from "@/components/InvoiceActions";

const FILTERS: { v: "aktif" | OrderStatus | "semua"; l: string }[] = [
  { v: "aktif", l: "Aktif" },
  { v: "selesai", l: "Selesai" },
  { v: "batal", l: "Batal" },
  { v: "semua", l: "Semua" },
];

export default function PesananPage() {
  const { db } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["v"]>("aktif");
  const [q, setQ] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    const today = dayKey(new Date().toISOString());
    const s = q.trim().toLowerCase();
    return db.orders.filter((o) => {
      if (filter === "aktif" && (o.status === "selesai" || o.status === "batal") && o.payStatus !== "belum") return false;
      if (filter === "aktif" && o.status === "batal") return false;
      if (filter !== "aktif" && filter !== "semua" && o.status !== filter) return false;
      if (todayOnly && dayKey(o.createdAt) !== today) return false;
      if (s && !`${o.invoiceNo} ${o.customerName} ${o.plate}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [db.orders, filter, q, todayOnly]);

  return (
    <>
      <PageHeader title="Pesanan" desc="Ubah status, tandai lunas, batalkan, dan kirim invoice." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`h-9 rounded-full border px-3 text-sm ${filter === f.v ? "border-ink bg-ink text-white" : "border-line bg-paper"}`}
          >
            {f.l}
          </button>
        ))}
        <label className="ml-1 flex items-center gap-1.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[#c8102e]" checked={todayOnly} onChange={(e) => setTodayOnly(e.target.checked)} />
          Hari ini
        </label>
        <Input className="h-9 sm:ml-auto sm:w-64" placeholder="Cari invoice / nama / plat" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card className="overflow-hidden" title={`${list.length} pesanan`}>
        {list.length === 0 ? (
          <Empty>Tidak ada pesanan.</Empty>
        ) : (
          <ul className="-m-4 divide-y divide-line">
            {list.slice(0, 200).map((o) => (
              <OrderRow key={o.id} o={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function OrderRow({ o, open, onToggle }: { o: Order; open: boolean; onToggle: () => void }) {
  const { db, role, commit } = useApp();
  const washers = db.employees.filter((e) => e.position === "pencuci" && (e.active || o.workerIds?.includes(e.id)));
  const [err, setErr] = useState("");
  const [method, setMethod] = useState<PayMethod>(o.payMethod === "voucher" ? "tunai" : o.payMethod);
  const run = (fn: () => void) => {
    setErr("");
    try {
      fn();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const closed = o.status === "batal";

  return (
    <li>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-soft">
        <span className="num w-full text-xs text-muted sm:w-40">{o.invoiceNo}</span>
        <span className="min-w-0 flex-1">
          <span className="font-medium">{o.serviceName}</span>
          <span className="text-muted"> · {o.size} · {o.customerName}{o.plate ? ` · ${o.plate}` : ""}</span>
        </span>
        <span className="num font-semibold">{rupiah(o.total)}</span>
        <Badge tone={statusTone(o.payStatus)}>{o.payMethod === "voucher" ? "voucher" : o.payStatus}</Badge>
        <Badge tone={statusTone(o.status)}>{o.status}</Badge>
      </button>
      {open && (
        <div className="space-y-4 border-t border-line bg-soft px-4 py-4 text-sm">
          <div className="text-xs text-muted">
            Dibuat {fmtDateTime(o.createdAt)} oleh {o.createdBy}
            {o.paidAt && ` · Lunas ${fmtDateTime(o.paidAt)}`}
            {o.doneAt && ` · Selesai ${fmtDateTime(o.doneAt)}`}
            {o.discount > 0 && ` · Harga ${rupiah(o.price)}, potongan ${rupiah(o.discount)}`}
          </div>
          {!closed && (
            <div className="flex flex-wrap items-center gap-2">
              {o.status === "baru" && (
                <Button size="sm" variant="outline" onClick={() => run(() => commit((d) => setStatus(d, o.id, "diproses", role)))}>
                  Proses
                </Button>
              )}
              {o.status !== "selesai" && (
                <Button size="sm" onClick={() => run(() => commit((d) => setStatus(d, o.id, "selesai", role)))}>
                  Tandai selesai
                </Button>
              )}
              {o.payStatus === "belum" && (
                <span className="flex items-center gap-2">
                  <Select className="h-8 w-28 text-sm" value={method} onChange={(e) => setMethod(e.target.value as PayMethod)} aria-label="Metode bayar">
                    <option value="tunai">Tunai</option>
                    <option value="transfer">Transfer</option>
                    <option value="qris">QRIS</option>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => run(() => commit((d) => markPaid(d, o.id, method, o.total, role)))}>
                    Tandai lunas {rupiah(o.total)}
                  </Button>
                </span>
              )}
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  const reason = window.prompt("Alasan pembatalan (wajib, tercatat di audit):");
                  if (reason !== null) run(() => commit((d) => setStatus(d, o.id, "batal", role, reason)));
                }}
              >
                Batalkan
              </Button>
            </div>
          )}
          {washers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Pencuci:</span>
              {washers.map((e) => {
                const on = !!o.workerIds?.includes(e.id);
                return (
                  <button
                    key={e.id}
                    disabled={closed}
                    aria-pressed={on}
                    onClick={() =>
                      run(() => commit((d) => setWorkers(d, o.id, on ? (o.workerIds ?? []).filter((x) => x !== e.id) : [...(o.workerIds ?? []), e.id], role)))
                    }
                    className={`h-8 rounded-full border px-3 text-xs font-medium disabled:opacity-50 ${on ? "border-ink bg-ink text-white" : "border-line bg-paper"}`}
                  >
                    {on ? "✓ " : ""}
                    {e.name}
                  </button>
                );
              })}
            </div>
          )}
          {err && <p className="text-accent" role="alert">{err}</p>}
          <InvoiceActions order={o} compact />
        </div>
      )}
    </li>
  );
}
