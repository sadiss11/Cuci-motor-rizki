"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { downloadCsv, fmtDateTime, rupiah } from "@/lib/format";
import { groupRows, presetRange, summarize, type Group, type Range } from "@/lib/report";
import { Button, Card, Empty, PageHeader, Segmented, Stat } from "@/components/ui";
import { RangePicker } from "@/components/RangePicker";
import { ChartCard, ColumnChart, HBarChart, VIZ } from "@/components/charts";
import { compactRp } from "@/lib/format";
import type { DB } from "@/lib/types";

export default function LaporanPage() {
  const { db } = useApp();
  const [range, setRange] = useState<Range>(presetRange("bulan"));
  const [group, setGroup] = useState<Group>("harian");
  const s = useMemo(() => summarize(db, range), [db, range]);
  const rows = useMemo(() => groupRows(db, range, group), [db, range, group]);
  const tag = `${range.from}_${range.to}`;

  const exportOrders = () =>
    downloadCsv(`transaksi_${tag}.csv`, [
      ["invoice", "waktu", "paket", "ukuran", "pelanggan", "plat", "harga", "diskon", "total", "metode", "status_bayar", "status", "kasir"],
      ...s.orders.map((o) => [o.invoiceNo, o.createdAt, o.serviceName, o.size, o.customerName, o.plate, o.price, o.discount, o.total, o.payMethod, o.payStatus, o.status, o.createdBy]),
    ]);
  const exportCash = () =>
    downloadCsv(`kas_${tag}.csv`, [
      ["tanggal", "jenis", "kategori", "nominal", "catatan", "penanggung_jawab", "sumber", "dibatalkan", "alasan_batal"],
      ...db.cash
        .filter((c) => c.date.slice(0, 10) >= range.from && c.date.slice(0, 10) <= range.to)
        .map((c) => [c.date, c.type, c.category, c.amount, c.note, c.pic, c.source, c.voided ? "ya" : "", c.voided?.reason ?? ""]),
    ]);
  const exportRekap = () =>
    downloadCsv(`rekap_${group}_${tag}.csv`, [["periode", "transaksi", "omzet_layanan", "kas_masuk", "kas_keluar", "selisih_operasional"], ...rows.map((r) => [r.key, r.transaksi, r.omzet, r.masuk, r.keluar, r.masuk - r.keluar])]);

  return (
    <>
      <PageHeader
        title="Laporan"
        desc="Laporan operasional sederhana. Selisih operasional bukan laba bersih akuntansi penuh."
        action={
          <div className="no-print flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={exportOrders}>CSV transaksi</Button>
            <Button size="sm" variant="outline" onClick={exportCash}>CSV kas</Button>
            <Button size="sm" variant="outline" onClick={exportRekap}>CSV rekap</Button>
            <Button size="sm" onClick={() => window.print()}>Cetak</Button>
          </div>
        }
      />
      <div className="no-print mb-4">
        <RangePicker value={range} onChange={setRange} />
      </div>
      <p className="mb-3 hidden text-sm print:block">Periode {range.from} s.d. {range.to}</p>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total transaksi" value={String(s.jumlahTransaksi)} hint={`${s.batal} batal · ${s.belumBayar} belum bayar`} />
        <Stat label="Omzet layanan" value={rupiah(s.omzet)} hint={`Rata-rata ${rupiah(s.rataRata)}`} />
        <Stat label="Kas masuk" value={rupiah(s.kasMasuk)} />
        <Stat label="Kas keluar" value={rupiah(s.kasKeluar)} />
        <Stat label="Selisih operasional" value={rupiah(s.selisih)} accent />
        <Stat label="Diskon diberikan" value={rupiah(s.diskon)} />
        <Stat label="Nilai voucher gratis" value={rupiah(s.voucher)} hint={`${s.paid.filter((o) => o.voucherId).length} voucher dipakai`} />
        <Stat label="Paket terpopuler" value={s.topServices[0]?.name ?? "-"} hint={s.topServices[0] ? `${s.topServices[0].count} transaksi` : ""} />
      </div>

      <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Grafik</h2>
        <div className="w-full sm:w-72">
          <Segmented label="Kelompok grafik" value={group} onChange={setGroup} options={[{ value: "harian", label: "Harian" }, { value: "mingguan", label: "Mingguan" }, { value: "bulanan", label: "Bulanan" }]} />
        </div>
      </div>
      <Charts db={db} s={s} rows={rows} group={group} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card title="Rekap" action={<div className="no-print w-full sm:w-64"><Segmented label="Kelompok" value={group} onChange={setGroup} options={[{ value: "harian", label: "Harian" }, { value: "mingguan", label: "Mingguan" }, { value: "bulanan", label: "Bulanan" }]} /></div>}>
          {rows.length === 0 ? (
            <Empty>Tidak ada data.</Empty>
          ) : (
            <div className="-m-5 overflow-x-auto">
              <table className="num w-full min-w-[520px] text-sm">
                <thead className="border-b border-line text-left text-xs text-muted">
                  <tr>
                    <th className="px-5 py-2 font-medium">Periode</th>
                    <th className="py-2 text-right font-medium">Transaksi</th>
                    <th className="py-2 text-right font-medium">Omzet</th>
                    <th className="py-2 text-right font-medium">Masuk</th>
                    <th className="py-2 text-right font-medium">Keluar</th>
                    <th className="px-5 py-2 text-right font-medium">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <td className="px-5 py-2">{r.key}</td>
                      <td className="py-2 text-right">{r.transaksi}</td>
                      <td className="py-2 text-right">{rupiah(r.omzet)}</td>
                      <td className="py-2 text-right">{rupiah(r.masuk)}</td>
                      <td className="py-2 text-right">{rupiah(r.keluar)}</td>
                      <td className={`px-5 py-2 text-right font-medium ${r.masuk - r.keluar < 0 ? "text-accent" : ""}`}>{rupiah(r.masuk - r.keluar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <div className="space-y-5">
          <Card title="Per paket">
            <ul className="num space-y-1.5 text-sm">
              {s.topServices.map((t) => (
                <li key={t.name} className="flex justify-between">
                  <span>{t.name} <span className="text-muted">({t.count}x)</span></span>
                  <span>{rupiah(t.omzet)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Pengeluaran per kategori">
            {s.keluarByCat.length === 0 ? (
              <Empty>Tidak ada.</Empty>
            ) : (
              <ul className="num space-y-1.5 text-sm">
                {s.keluarByCat.map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="capitalize">{k}</span>
                    <span>{rupiah(v)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title="Audit trail (20 terakhir)" className="mt-5">
        <ul className="-m-5 divide-y divide-line text-xs">
          {db.audit.slice(0, 20).map((a) => (
            <li key={a.id} className="flex flex-wrap gap-x-3 px-5 py-2">
              <span className="w-36 text-muted">{fmtDateTime(a.at)}</span>
              <span className="w-14 uppercase">{a.by}</span>
              <span className="font-medium">{a.action}</span>
              <span className="text-muted">{a.detail}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

const PAY_NAMES: Record<string, string> = { tunai: "Tunai", transfer: "Transfer", qris: "QRIS", voucher: "Voucher" };

function shortKey(k: string, g: Group) {
  if (g === "bulanan") return k.slice(5, 7) + "/" + k.slice(2, 4);
  const d = k.replace("Minggu ", "");
  return (g === "mingguan" ? "Mg " : "") + d.slice(8, 10) + "/" + d.slice(5, 7);
}

function Charts({ db, s, rows, group }: { db: DB; s: ReturnType<typeof summarize>; rows: ReturnType<typeof groupRows>; group: Group }) {
  const asc = [...rows].reverse();
  const pts = asc.map((r) => ({ ...r, label: shortKey(r.key, group), full: r.key }));

  const hours = Array.from({ length: 14 }, (_, i) => i + 7).map((h) => ({
    label: String(h).padStart(2, "0"),
    full: `Jam ${String(h).padStart(2, "0")}.00–${String(h).padStart(2, "0")}.59`,
    values: [s.valid.filter((o) => new Date(o.createdAt).getHours() === h).length],
  }));

  const methods = new Map<string, { n: number; amt: number }>();
  for (const o of s.paid) {
    const e = methods.get(o.payMethod) ?? { n: 0, amt: 0 };
    e.n++;
    e.amt += o.total;
    methods.set(o.payMethod, e);
  }
  const methodRows = [...methods.entries()].map(([k, v]) => ({ label: PAY_NAMES[k] ?? k, value: v.n, sub: k === "voucher" ? "" : compactRp(v.amt) })).sort((a, b) => b.value - a.value);

  const workers = db.employees
    .filter((e) => e.position === "pencuci")
    .map((e) => ({ label: e.name, value: s.valid.filter((o) => o.status === "selesai" && o.workerIds?.includes(e.id)).length }))
    .sort((a, b) => b.value - a.value);

  const fmtRp = (n: number) => rupiah(n);
  const fmtN = (n: number) => `${n} transaksi`;

  return (
    <div className="mb-5 grid gap-5 lg:grid-cols-2">
      <ChartCard title="Omzet layanan" desc="Transaksi lunas per periode" table={{ head: ["Periode", "Transaksi", "Omzet"], rows: asc.map((r) => [r.key, r.transaksi, rupiah(r.omzet)]) }}>
        <ColumnChart data={pts.map((p) => ({ label: p.label, full: p.full, values: [p.omzet] }))} series={[{ name: "Omzet", color: VIZ.s1 }]} format={fmtRp} axisFormat={compactRp} />
      </ChartCard>
      <ChartCard title="Kas masuk vs kas keluar" table={{ head: ["Periode", "Masuk", "Keluar"], rows: asc.map((r) => [r.key, rupiah(r.masuk), rupiah(r.keluar)]) }}>
        <ColumnChart
          data={pts.map((p) => ({ label: p.label, full: p.full, values: [p.masuk, p.keluar] }))}
          series={[
            { name: "Kas masuk", color: VIZ.s1 },
            { name: "Kas keluar", color: VIZ.s2 },
          ]}
          format={fmtRp}
          axisFormat={compactRp}
        />
      </ChartCard>
      <ChartCard title="Selisih operasional" desc="Kas masuk − kas keluar. Biru = surplus, merah = minus" table={{ head: ["Periode", "Selisih"], rows: asc.map((r) => [r.key, rupiah(r.masuk - r.keluar)]) }}>
        <ColumnChart
          data={pts.map((p) => ({ label: p.label, full: p.full, values: [p.masuk - p.keluar] }))}
          series={[{ name: "Selisih", color: VIZ.s1 }]}
          colorFor={(v) => (v < 0 ? VIZ.neg : VIZ.s1)}
          format={(n) => (n < 0 ? "−" : "") + rupiah(Math.abs(n))}
          axisFormat={compactRp}
        />
      </ChartCard>
      <ChartCard title="Jam ramai" desc="Jumlah transaksi per jam masuk" table={{ head: ["Jam", "Transaksi"], rows: hours.map((h) => [h.full, h.values[0]]) }}>
        <ColumnChart data={hours} series={[{ name: "Transaksi", color: VIZ.s1 }]} format={fmtN} axisFormat={(n) => String(Math.round(n))} labelEvery={1} height={200} />
      </ChartCard>
      <ChartCard title="Paket terpopuler" desc="Jumlah transaksi & omzet" table={{ head: ["Paket", "Transaksi", "Omzet"], rows: s.topServices.map((t) => [t.name, t.count, rupiah(t.omzet)]) }}>
        <HBarChart rows={s.topServices.map((t) => ({ label: t.name, value: t.count, sub: compactRp(t.omzet) }))} format={(n) => `${n}x`} />
      </ChartCard>
      <ChartCard title="Metode pembayaran" desc="Jumlah transaksi lunas & nilainya" table={{ head: ["Metode", "Transaksi", "Nilai"], rows: methodRows.map((m) => [m.label, m.value, m.sub || "-"]) }}>
        <HBarChart rows={methodRows} format={(n) => `${n}x`} />
      </ChartCard>
      <ChartCard title="Pengeluaran per kategori" table={{ head: ["Kategori", "Nominal"], rows: s.keluarByCat.map(([k, v]) => [k, rupiah(v)]) }}>
        <HBarChart rows={s.keluarByCat.map(([k, v]) => ({ label: k[0].toUpperCase() + k.slice(1), value: v }))} color={VIZ.s2} format={compactRp} />
      </ChartCard>
      <ChartCard title="Motor dikerjakan per karyawan" desc="Pesanan selesai; motor yang dikerjakan berdua dihitung untuk masing-masing" table={{ head: ["Karyawan", "Motor"], rows: workers.map((w) => [w.label, w.value]) }}>
        <HBarChart rows={workers} format={(n) => `${n} motor`} />
      </ChartCard>
    </div>
  );
}
