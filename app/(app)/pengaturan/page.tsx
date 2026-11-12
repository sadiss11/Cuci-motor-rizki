"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { audit, syncRewards } from "@/lib/logic";
import { normalizePhone, parseAmount, rupiah, SIZES } from "@/lib/format";
import type { Service, Settings } from "@/lib/types";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";

export default function PengaturanPage() {
  const { db, role, commit, resetDemo } = useApp();
  const [s, setS] = useState<Settings>(db.settings);
  const [services, setServices] = useState<Service[]>(db.services);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const save = () => {
    setErr("");
    setMsg("");
    const wa = normalizePhone(s.businessWa);
    if (!wa) return setErr("Nomor WA usaha tidak valid");
    if (!(s.loyaltyThreshold >= 1 && s.loyaltyThreshold <= 50)) return setErr("Jumlah stempel harus 1–50");
    if (!/^\d{4,6}$/.test(s.pins.owner) || !/^\d{4,6}$/.test(s.pins.kasir)) return setErr("PIN harus 4–6 digit angka");
    if (services.some((x) => !x.name.trim() || SIZES.some((z) => !(x.prices[z] > 0)))) return setErr("Nama & harga paket wajib diisi");
    commit((d) => {
      const changes: string[] = [];
      if (d.settings.loyaltyThreshold !== s.loyaltyThreshold) changes.push(`stempel ${d.settings.loyaltyThreshold}→${s.loyaltyThreshold}`);
      if (d.settings.loyaltyRewardServiceId !== s.loyaltyRewardServiceId) changes.push(`voucher → ${s.loyaltyRewardServiceId}`);
      for (const n of services) {
        const o = d.services.find((x) => x.id === n.id);
        if (o && JSON.stringify(o) !== JSON.stringify(n)) changes.push(`paket ${n.name}`);
      }
      d.settings = {
        ...d.settings,
        businessName: s.businessName,
        businessWa: wa,
        address: s.address,
        tagline: s.tagline,
        loyaltyThreshold: s.loyaltyThreshold,
        loyaltyRewardServiceId: s.loyaltyRewardServiceId,
        promoTemplate: s.promoTemplate,
        pins: s.pins,
      };
      d.services = services;
      d.customers.forEach((c) => syncRewards(d, c.id));
      audit(d, role, "pengaturan.ubah", changes.join(", ") || "profil usaha");
    });
    setMsg("Tersimpan.");
  };

  const setPrice = (id: string, size: (typeof SIZES)[number], v: string) =>
    setServices((list) => list.map((x) => (x.id === id ? { ...x, prices: { ...x.prices, [size]: parseAmount(v) } } : x)));

  return (
    <>
      <PageHeader title="Pengaturan" desc="Hanya owner. Semua perubahan tercatat di audit trail. Gaji, komisi & bonus diatur di menu Karyawan." action={<Button onClick={save}>Simpan perubahan</Button>} />
      {(msg || err) && <p className={`mb-4 text-sm ${err ? "text-accent" : "text-ok"}`} role="status">{err || msg}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Profil usaha">
          <div className="space-y-3">
            <Field label="Nama usaha">
              <Input value={s.businessName} onChange={(e) => setS({ ...s, businessName: e.target.value })} />
            </Field>
            <Field label="Tagline (tampil di kasir)">
              <Input value={s.tagline} onChange={(e) => setS({ ...s, tagline: e.target.value })} />
            </Field>
            <Field label="Nomor WhatsApp usaha">
              <Input value={s.businessWa} onChange={(e) => setS({ ...s, businessWa: e.target.value })} inputMode="tel" />
            </Field>
            <Field label="Alamat (tampil di invoice)">
              <Input value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} />
            </Field>
          </div>
        </Card>
        <Card title="Kebijakan loyalti & promo">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stempel untuk 1 voucher">
                <Input type="number" min={1} max={50} value={s.loyaltyThreshold} onChange={(e) => setS({ ...s, loyaltyThreshold: Number(e.target.value) })} />
              </Field>
              <Field label="Voucher gratis untuk">
                <Select value={s.loyaltyRewardServiceId} onChange={(e) => setS({ ...s, loyaltyRewardServiceId: e.target.value })}>
                  {services.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <p className="text-xs text-muted">Voucher berlaku sesuai ukuran motor saat dipakai. Perubahan berlaku untuk voucher baru.</p>
            <Field label="Template promo WhatsApp" hint="Variabel: {nama}, {usaha}">
              <textarea value={s.promoTemplate} onChange={(e) => setS({ ...s, promoTemplate: e.target.value })} rows={4} className="w-full rounded-md border border-line p-2 text-sm outline-none focus:border-ink" />
            </Field>
          </div>
        </Card>
        <Card title="Paket & harga" className="lg:col-span-2">
          <div className="-m-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-line text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-2 font-medium">Paket</th>
                  <th className="py-2 font-medium">Estimasi</th>
                  {SIZES.map((z) => (
                    <th key={z} className="py-2 font-medium capitalize">{z}</th>
                  ))}
                  <th className="px-5 py-2 font-medium">Aktif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {services.map((x) => (
                  <tr key={x.id}>
                    <td className="px-5 py-2">
                      <Input className="h-9" value={x.name} onChange={(e) => setServices((l) => l.map((y) => (y.id === x.id ? { ...y, name: e.target.value } : y)))} aria-label="Nama paket" />
                    </td>
                    <td className="py-2 pr-2">
                      <Input className="h-9" value={x.duration} onChange={(e) => setServices((l) => l.map((y) => (y.id === x.id ? { ...y, duration: e.target.value } : y)))} aria-label="Estimasi" />
                    </td>
                    {SIZES.map((z) => (
                      <td key={z} className="py-2 pr-2">
                        <Input className="num h-9" inputMode="numeric" value={x.prices[z]} onChange={(e) => setPrice(x.id, z, e.target.value)} aria-label={`Harga ${z}`} title={rupiah(x.prices[z])} />
                      </td>
                    ))}
                    <td className="px-5 py-2">
                      <input type="checkbox" className="h-4 w-4 accent-black" checked={x.active} onChange={(e) => setServices((l) => l.map((y) => (y.id === x.id ? { ...y, active: e.target.checked } : y)))} aria-label="Aktif" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Akses (PIN demo)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="PIN Owner">
              <Input inputMode="numeric" value={s.pins.owner} onChange={(e) => setS({ ...s, pins: { ...s.pins, owner: e.target.value.replace(/\D/g, "") } })} />
            </Field>
            <Field label="PIN Kasir">
              <Input inputMode="numeric" value={s.pins.kasir} onChange={(e) => setS({ ...s, pins: { ...s.pins, kasir: e.target.value.replace(/\D/g, "") } })} />
            </Field>
          </div>
          <p className="mt-2 text-xs text-muted">Mode produksi memakai Supabase Auth (email/password) + peran di tabel users, bukan PIN.</p>
        </Card>
        <Card title="Data demo">
          <p className="mb-3 text-sm text-muted">Mengembalikan semua data ke contoh awal. Data di browser ini akan hilang.</p>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Reset semua data demo?")) {
                resetDemo();
                location.reload();
              }
            }}
          >
            Reset data demo
          </Button>
        </Card>
      </div>
    </>
  );
}
