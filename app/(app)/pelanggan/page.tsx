"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { consentOf, loyaltyOf, setConsent, upsertCustomer } from "@/lib/logic";
import { fmtDate, fmtDateTime, maskPhone, normalizePhone, rupiah, waLink } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, Input, PageHeader, StampBar } from "@/components/ui";

export default function PelangganPage() {
  const { db, role, commit } = useApp();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"semua" | "promo">("semua");
  const [sel, setSel] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addErr, setAddErr] = useState("");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return db.customers
      .filter((c) => !s || c.name.toLowerCase().includes(s) || c.phone.includes(s.replace(/^0/, "62")))
      .filter((c) => tab === "semua" || consentOf(db, c.id)?.granted)
      .map((c) => ({ c, l: loyaltyOf(db, c.id), consent: consentOf(db, c.id) }))
      .sort((a, b) => b.l.totalStamps - a.l.totalStamps);
  }, [db, q, tab]);

  const selected = sel ? db.customers.find((c) => c.id === sel) : undefined;

  return (
    <>
      <PageHeader title="Pelanggan & Loyalti" desc={`${db.settings.loyaltyThreshold}x transaksi berbayar lunas & selesai = 1 voucher gratis.`} />
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["semua", "promo"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`h-9 rounded-full border px-3 text-sm ${tab === t ? "border-ink bg-ink text-white" : "border-line bg-paper"}`}>
                {t === "semua" ? "Semua pelanggan" : "Izin promosi"}
              </button>
            ))}
            <Input className="h-9 sm:ml-auto sm:w-60" placeholder="Cari nama / nomor" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Card className="overflow-hidden">
            {list.length === 0 ? (
              <Empty>Belum ada pelanggan.</Empty>
            ) : (
              <ul className="-m-4 divide-y divide-line">
                {list.map(({ c, l, consent }) => (
                  <li key={c.id}>
                    <button onClick={() => setSel(c.id)} className={`flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-soft ${sel === c.id ? "bg-soft" : ""}`}>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{c.name}</span>
                        <span className="num block text-xs text-muted">{maskPhone(c.phone)}</span>
                      </span>
                      <StampBar progress={l.progress} threshold={l.threshold} />
                      {l.available.length > 0 && <Badge tone="dark">{l.available.length} voucher</Badge>}
                      {consent?.granted ? <Badge tone="ok">promo ok</Badge> : <Badge>tanpa izin</Badge>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Tambah pelanggan">
            <form
              className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                setAddErr("");
                if (!normalizePhone(phone)) return setAddErr("Nomor WA tidak valid");
                const c = commit((d) => upsertCustomer(d, name, phone));
                setName("");
                setPhone("");
                if (c) setSel(c.id);
              }}
            >
              <Field label="Nama">
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Nomor WhatsApp" error={addErr}>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="0812xxxxxxx" required />
              </Field>
              <Button type="submit">Simpan</Button>
            </form>
          </Card>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          {selected ? <CustomerPanel key={selected.id} c={selected} /> : <Card><Empty>Pilih pelanggan untuk melihat detail, voucher, dan kirim promo.</Empty></Card>}
        </div>
      </div>
      <p className="mt-6 text-xs text-muted">
        Promosi dikirim satu per satu secara manual melalui WhatsApp, hanya ke pelanggan yang memberi izin. Tidak ada blast massal / bot. Login sebagai: {role}.
      </p>
    </>
  );
}

function CustomerPanel({ c }: { c: Customer }) {
  const { db, role, commit } = useApp();
  const l = loyaltyOf(db, c.id);
  const consent = consentOf(db, c.id);
  const [source, setSource] = useState("Kasir - persetujuan lisan saat transaksi");
  const fill = (t: string) => t.replaceAll("{nama}", c.name.split(" ")[0]).replaceAll("{usaha}", db.settings.businessName);
  const [msg, setMsg] = useState(fill(db.settings.promoTemplate));
  const orders = db.orders.filter((o) => o.customerId === c.id);
  const spent = orders.filter((o) => o.payStatus === "lunas").reduce((s, o) => s + o.total, 0);

  return (
    <Card title={c.name}>
      <div className="space-y-4 text-sm">
        <div className="num text-muted">
          {maskPhone(c.phone)} · sejak {fmtDate(c.createdAt)}
        </div>
        <div>
          <div className="mb-1 text-xs text-muted">Progres stempel</div>
          <StampBar progress={l.progress} threshold={l.threshold} />
          <div className="mt-1 text-xs text-muted">
            Total stempel {l.totalStamps} · voucher tersedia {l.available.length} · terpakai {l.used} · belanja {rupiah(spent)}
          </div>
        </div>

        <div className="rounded-md border border-line p-3">
          <div className="mb-2 flex items-center justify-between">
            <b>Izin promosi WhatsApp</b>
            {consent?.granted ? <Badge tone="ok">Diizinkan</Badge> : <Badge tone="bad">Tidak</Badge>}
          </div>
          {consent && (
            <p className="mb-2 text-xs text-muted">
              {consent.granted ? "Opt-in" : "Opt-out"} {fmtDateTime(consent.at)} · sumber: {consent.source}
            </p>
          )}
          {consent?.granted ? (
            <Button size="sm" variant="danger" onClick={() => commit((d) => setConsent(d, c.id, false, "Permintaan pelanggan (berhenti berlangganan)", role))}>
              Berhenti berlangganan (opt-out)
            </Button>
          ) : (
            <div className="space-y-2">
              <Input className="h-9 text-sm" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Sumber persetujuan" />
              <Button size="sm" variant="outline" onClick={() => commit((d) => setConsent(d, c.id, true, source || "Kasir", role))}>
                Catat persetujuan (opt-in)
              </Button>
            </div>
          )}
        </div>

        {consent?.granted && (
          <div className="space-y-2">
            <b>Kirim promo personal</b>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} className="w-full rounded-md border border-line p-2 text-sm outline-none focus:border-ink" aria-label="Isi pesan promo" />
            <Button className="w-full" onClick={() => window.open(waLink(c.phone, msg), "_blank", "noopener")}>
              Buka WhatsApp
            </Button>
          </div>
        )}

        <div>
          <b>Riwayat ({orders.length})</b>
          <ul className="mt-1 divide-y divide-line text-xs">
            {orders.slice(0, 8).map((o) => (
              <li key={o.id} className="flex justify-between py-1.5">
                <span>
                  {fmtDate(o.createdAt)} · {o.serviceName}
                </span>
                <span className="num">{o.voucherId ? "voucher" : rupiah(o.total)} · {o.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
