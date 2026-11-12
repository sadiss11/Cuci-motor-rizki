"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { createOrder, loyaltyOf } from "@/lib/logic";
import { normalizePhone, parseAmount, rupiah, SIZES } from "@/lib/format";
import type { Order, PayMethod, PayStatus, Size } from "@/lib/types";
import { Badge, Button, Card, Field, Input, PageHeader, Segmented, StampBar } from "@/components/ui";
import { InvoiceActions } from "@/components/InvoiceActions";

export default function KasirPage() {
  const { db, role, commit } = useApp();
  const services = db.services.filter((s) => s.active);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [size, setSize] = useState<Size>("kecil");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [discount, setDiscount] = useState("");
  const [method, setMethod] = useState<PayMethod>("tunai");
  const [payStatus, setPayStatus] = useState<PayStatus>("lunas");
  const [received, setReceived] = useState("");
  const [useVoucher, setUseVoucher] = useState<string>("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Order | null>(null);

  const svc = db.services.find((s) => s.id === serviceId);
  const price = svc?.prices[size] ?? 0;
  const normalized = normalizePhone(phone);
  const customer = normalized ? db.customers.find((c) => c.phone === normalized) : undefined;
  const loyalty = customer ? loyaltyOf(db, customer.id) : null;
  const voucher = loyalty?.available.find((v) => v.id === useVoucher);
  const disc = voucher ? price : Math.min(parseAmount(discount), price);
  const total = price - disc;
  const recv = parseAmount(received);
  const change = method === "tunai" && payStatus === "lunas" ? recv - total : 0;
  const phoneErr = phone.trim() && !normalized ? "Format tidak valid, contoh 0812xxxxxxx" : "";

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (q.length < 2 || customer) return [];
    return db.customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 4);
  }, [name, db.customers, customer]);

  const reset = () => {
    setName("");
    setPhone("");
    setPlate("");
    setDiscount("");
    setReceived("");
    setUseVoucher("");
    setPayStatus("lunas");
    setMethod("tunai");
    setError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const o = commit((d) =>
        createOrder(
          d,
          {
            serviceId,
            size,
            customerName: name,
            phone,
            plate,
            discount: disc,
            payMethod: method,
            payStatus,
            received: recv,
            voucherId: voucher?.id,
          },
          role,
        ),
      );
      setSaved(o);
      reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader title="Kasir" desc="Pilih paket, ukuran motor, lalu simpan & buat invoice." />

      {saved && (
        <Card className="mb-5 border-ink" title={`Tersimpan · ${saved.invoiceNo}`} action={<Button size="sm" variant="ghost" onClick={() => setSaved(null)}>Tutup</Button>}>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <b>{saved.serviceName}</b> · motor {saved.size} · <span className="num font-semibold">{rupiah(saved.total)}</span>
            <Badge tone={saved.payStatus === "lunas" ? "ok" : "warn"}>{saved.payStatus}</Badge>
            {saved.payMethod === "tunai" && saved.payStatus === "lunas" && saved.received > saved.total && (
              <span className="text-muted">Kembalian {rupiah(saved.received - saved.total)}</span>
            )}
          </div>
          <InvoiceActions order={db.orders.find((o) => o.id === saved.id) ?? saved} />
        </Card>
      )}

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="1. Layanan">
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Paket">
              {services.map((s) => {
                const on = s.id === serviceId;
                const locked = !!voucher && s.id !== voucher.serviceId;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={locked}
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    className={`rounded-md border p-3 text-left disabled:opacity-40 ${on ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
                  >
                    <div className="font-semibold">{s.name}</div>
                    <div className={`text-xs ${on ? "text-white/70" : "text-muted"}`}>{s.duration} (estimasi)</div>
                    <div className="num mt-1 text-sm">
                      {rupiah(s.prices.kecil)} – {rupiah(s.prices.besar)}
                    </div>
                  </button>
                );
              })}
            </div>
            {svc?.note && <p className="mt-2 text-xs text-muted">Catatan: {svc.note}</p>}
            <div className="mt-4">
              <Field label="Ukuran motor">
                <Segmented
                  label="Ukuran motor"
                  value={size}
                  onChange={setSize}
                  options={SIZES.map((s) => ({
                    value: s,
                    label: (
                      <span className="flex flex-col leading-tight">
                        <span className="capitalize">{s}</span>
                        <span className="num text-xs opacity-70">{rupiah(svc?.prices[s] ?? 0)}</span>
                      </span>
                    ),
                  }))}
                />
              </Field>
            </div>
          </Card>

          <Card title="2. Pelanggan (opsional)">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nama pelanggan">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama / cari pelanggan" autoComplete="off" />
              </Field>
              <Field label="Nomor WhatsApp" error={phoneErr} hint="Wajib untuk stempel loyalti">
                <Input value={phone} onChange={(e) => { setPhone(e.target.value); setUseVoucher(""); }} inputMode="tel" placeholder="0812xxxxxxx" />
              </Field>
              <Field label="Nomor polisi">
                <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="B 1234 XYZ" className="uppercase" />
              </Field>
            </div>
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    className="rounded-full border border-line px-3 py-1 text-xs hover:border-ink"
                    onClick={() => {
                      setName(c.name);
                      setPhone("0" + c.phone.slice(2));
                    }}
                  >
                    {c.name} · …{c.phone.slice(-4)}
                  </button>
                ))}
              </div>
            )}
            {customer && loyalty && (
              <div className="mt-3 rounded-md border border-line bg-soft p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Pelanggan terdaftar: <b>{customer.name}</b>
                  </span>
                  <StampBar progress={loyalty.progress} threshold={loyalty.threshold} />
                </div>
                {loyalty.available.length > 0 && (
                  <label className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#c8102e]"
                      checked={!!voucher}
                      onChange={(e) => {
                        const v = loyalty.available[0];
                        setUseVoucher(e.target.checked ? v.id : "");
                        if (e.target.checked) setServiceId(v.serviceId);
                      }}
                    />
                    Pakai voucher gratis ({loyalty.available.length} tersedia) —{" "}
                    {db.services.find((s) => s.id === loyalty.available[0].serviceId)?.name}
                  </label>
                )}
              </div>
            )}
          </Card>

          <Card title="3. Pembayaran">
            {voucher ? (
              <p className="text-sm">Dibayar dengan voucher loyalti. Transaksi voucher tidak menambah stempel.</p>
            ) : (
              <div className="space-y-4">
                <Field label="Metode bayar">
                  <Segmented
                    label="Metode bayar"
                    value={method}
                    onChange={setMethod}
                    options={[
                      { value: "tunai", label: "Tunai" },
                      { value: "transfer", label: "Transfer" },
                      { value: "qris", label: "QRIS" },
                    ]}
                  />
                </Field>
                {method !== "tunai" && (
                  <p className="text-xs text-muted">Konfirmasi manual: pastikan dana sudah masuk sebelum menandai lunas. Belum ada integrasi payment gateway.</p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Diskon (Rp)">
                    <Input inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/[^\d]/g, ""))} placeholder="0" />
                  </Field>
                  <Field label="Status pembayaran">
                    <Segmented
                      label="Status pembayaran"
                      value={payStatus}
                      onChange={setPayStatus}
                      options={[
                        { value: "lunas", label: "Lunas" },
                        { value: "belum", label: "Belum bayar" },
                      ]}
                    />
                  </Field>
                  {method === "tunai" && payStatus === "lunas" && (
                    <Field label="Nominal diterima (Rp)" error={recv > 0 && recv < total ? "Kurang dari total" : ""}>
                      <Input inputMode="numeric" value={received} onChange={(e) => setReceived(e.target.value.replace(/[^\d]/g, ""))} placeholder={String(total)} />
                    </Field>
                  )}
                </div>
                {method === "tunai" && payStatus === "lunas" && (
                  <div className="flex flex-wrap gap-2">
                    {[total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, 100000]
                      .filter((v, i, a) => v >= total && a.indexOf(v) === i)
                      .map((v) => (
                        <button type="button" key={v} onClick={() => setReceived(String(v))} className="num rounded-full border border-line px-3 py-1 text-xs hover:border-ink">
                          {rupiah(v)}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card title="Ringkasan">
            <dl className="num space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{svc?.name} · {size}</dt>
                <dd>{rupiah(price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{voucher ? "Voucher loyalti" : "Diskon"}</dt>
                <dd>−{rupiah(disc)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-lg font-bold">
                <dt>Total</dt>
                <dd>{rupiah(total)}</dd>
              </div>
              {change > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Kembalian</dt>
                  <dd>{rupiah(change)}</dd>
                </div>
              )}
            </dl>
            {error && <p className="mt-3 rounded-md bg-[#fde8eb] p-2 text-sm text-accent" role="alert">{error}</p>}
            <Button type="submit" className="mt-4 w-full" disabled={!!phoneErr || (method === "tunai" && payStatus === "lunas" && !voucher && recv < total)}>
              Simpan & Buat Invoice
            </Button>
            {method === "tunai" && payStatus === "lunas" && !voucher && recv < total && (
              <p className="mt-2 text-center text-xs text-muted">Isi nominal diterima untuk pembayaran tunai.</p>
            )}
          </Card>
        </div>
      </form>
    </>
  );
}
