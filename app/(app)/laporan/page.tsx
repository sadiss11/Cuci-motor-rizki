"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { downloadCsv, fmtDateTime, rupiah } from "@/lib/format";
import { groupRows, presetRange, summarize, type Group, type Range } from "@/lib/report";
import { Button, Card, Empty, PageHeader, Segmented, Stat } from "@/components/ui";
import { RangePicker } from "@/components/RangePicker";

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

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card title="Rekap" action={<div className="no-print w-64"><Segmented label="Kelompok" value={group} onChange={setGroup} options={[{ value: "harian", label: "Harian" }, { value: "mingguan", label: "Mingguan" }, { value: "bulanan", label: "Bulanan" }]} /></div>}>
          {rows.length === 0 ? (
            <Empty>Tidak ada data.</Empty>
          ) : (
            <div className="-m-4 overflow-x-auto">
              <table className="num w-full min-w-[520px] text-sm">
                <thead className="border-b border-line text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">Periode</th>
                    <th className="py-2 text-right font-medium">Transaksi</th>
                    <th className="py-2 text-right font-medium">Omzet</th>
                    <th className="py-2 text-right font-medium">Masuk</th>
                    <th className="py-2 text-right font-medium">Keluar</th>
                    <th className="px-4 py-2 text-right font-medium">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <td className="px-4 py-2">{r.key}</td>
                      <td className="py-2 text-right">{r.transaksi}</td>
                      <td className="py-2 text-right">{rupiah(r.omzet)}</td>
                      <td className="py-2 text-right">{rupiah(r.masuk)}</td>
                      <td className="py-2 text-right">{rupiah(r.keluar)}</td>
                      <td className={`px-4 py-2 text-right font-medium ${r.masuk - r.keluar < 0 ? "text-accent" : ""}`}>{rupiah(r.masuk - r.keluar)}</td>
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
        <ul className="-m-4 divide-y divide-line text-xs">
          {db.audit.slice(0, 20).map((a) => (
            <li key={a.id} className="flex flex-wrap gap-x-3 px-4 py-2">
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
