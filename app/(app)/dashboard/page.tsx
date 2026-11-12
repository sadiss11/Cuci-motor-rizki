"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { loyaltyOf } from "@/lib/logic";
import { fmtDateTime, rupiah } from "@/lib/format";
import { groupRows, presetRange, summarize, type Range } from "@/lib/report";
import { Badge, Card, Empty, PageHeader, Stat, StampBar, statusTone } from "@/components/ui";
import { RangePicker } from "@/components/RangePicker";

export default function DashboardPage() {
  const { db } = useApp();
  const [range, setRange] = useState<Range>(presetRange("hari"));
  const s = useMemo(() => summarize(db, range), [db, range]);
  const trend = useMemo(() => groupRows(db, presetRange("7hari"), "harian").reverse(), [db]);
  const maxTrend = Math.max(1, ...trend.map((t) => t.omzet));
  const loyal = useMemo(
    () =>
      db.customers
        .map((c) => ({ c, l: loyaltyOf(db, c.id) }))
        .sort((a, b) => b.l.totalStamps - a.l.totalStamps)
        .slice(0, 5),
    [db],
  );
  const maxSvc = Math.max(1, ...s.topServices.map((t) => t.count));

  return (
    <>
      <PageHeader title="Dashboard" desc="Ringkasan operasional. Selisih operasional = kas masuk − kas keluar tercatat (bukan laba bersih akuntansi)." />
      <div className="mb-4">
        <RangePicker value={range} onChange={setRange} />
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Pemasukan" value={rupiah(s.kasMasuk)} hint={`Omzet layanan ${rupiah(s.omzet)}`} />
        <Stat label="Pengeluaran" value={rupiah(s.kasKeluar)} />
        <Stat label="Selisih operasional" value={rupiah(s.selisih)} accent />
        <Stat label="Transaksi" value={String(s.jumlahTransaksi)} hint={`${s.belumBayar} belum bayar · ${s.batal} batal`} />
        <Stat label="Voucher dipakai" value={String(s.paid.filter((o) => o.voucherId).length)} hint={`Nilai ${rupiah(s.voucher)}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Omzet 7 hari terakhir" className="lg:col-span-2">
          <div className="flex h-40 items-end gap-2" role="img" aria-label="Grafik omzet 7 hari">
            {trend.map((t) => (
              <div key={t.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="num text-[10px] text-muted">{t.omzet ? Math.round(t.omzet / 1000) + "k" : ""}</span>
                <div className="w-full max-w-10 rounded-t bg-ink" style={{ height: `${(t.omzet / maxTrend) * 100}%`, minHeight: t.omzet ? 2 : 0 }} title={rupiah(t.omzet)} />
                <span className="text-[10px] text-muted">{t.key.slice(8)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Top paket">
          {s.topServices.length === 0 ? (
            <Empty>Belum ada transaksi.</Empty>
          ) : (
            <ul className="space-y-3 text-sm">
              {s.topServices.map((t) => (
                <li key={t.name}>
                  <div className="flex justify-between">
                    <span>{t.name}</span>
                    <span className="num text-muted">{t.count}x</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-soft">
                    <div className="h-1.5 rounded bg-accent" style={{ width: `${(t.count / maxSvc) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Transaksi terakhir" className="lg:col-span-2" action={<Link href="/pesanan" className="text-xs underline">Semua</Link>}>
          <div className="-m-4 overflow-x-auto">
            <table className="num w-full min-w-[520px] text-sm">
              <thead className="border-b border-line text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Waktu</th>
                  <th className="py-2 font-medium">Paket</th>
                  <th className="py-2 font-medium">Pelanggan</th>
                  <th className="py-2 text-right font-medium">Total</th>
                  <th className="px-4 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {db.orders.slice(0, 8).map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2 text-xs text-muted">{fmtDateTime(o.createdAt)}</td>
                    <td className="py-2">
                      {o.serviceName} <span className="text-muted">· {o.size}</span>
                    </td>
                    <td className="py-2">{o.customerName}</td>
                    <td className="py-2 text-right">{o.voucherId ? "voucher" : rupiah(o.total)}</td>
                    <td className="space-x-1 px-4 py-2 text-right">
                      <Badge tone={statusTone(o.payStatus)}>{o.payStatus}</Badge>
                      <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Pelanggan loyal" action={<Link href="/pelanggan" className="text-xs underline">Semua</Link>}>
          <ul className="space-y-3 text-sm">
            {loyal.map(({ c, l }) => (
              <li key={c.id} className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted">{l.totalStamps} stempel{l.available.length ? ` · ${l.available.length} voucher` : ""}</span>
                </div>
                <StampBar progress={l.progress} threshold={l.threshold} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
