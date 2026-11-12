"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { decodePayload, invoicePayload, type InvoicePayload } from "@/lib/logic";
import { fmtDateTime, rupiah } from "@/lib/format";

// Halaman invoice read-only. Mode demo: data diambil dari penyimpanan lokal (jika dibuka di
// perangkat kasir) atau dari fragmen URL (#...) yang tidak pernah dikirim ke server.
// Mode Supabase: ambil via server berdasarkan token acak di tabel invoice_tokens.
export default function InvoicePage() {
  const { token } = useParams<{ token: string }>();
  const { db } = useStore();
  const [data, setData] = useState<InvoicePayload | null | undefined>(undefined);

  useEffect(() => {
    if (!db) return;
    const local = db.orders.find((o) => o.token === token);
    if (local) return setData(invoicePayload(db, local));
    const hash = window.location.hash.slice(1);
    setData(hash ? decodePayload(hash) : null);
  }, [db, token]);

  if (data === undefined) return <div className="p-8 text-sm text-muted">Memuat…</div>;
  if (!data)
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-lg font-bold">Invoice tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted">Tautan tidak valid atau tidak lengkap.</p>
      </main>
    );

  const paid = data.ps === "lunas";
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <article className="rounded-lg border border-line bg-paper p-6 print:border-0">
        <header className="mb-5 border-b border-line pb-4">
          <div className="mb-2 h-1 w-10 bg-accent" />
          <h1 className="text-xl font-extrabold tracking-tight">{data.n}</h1>
          <p className="text-xs text-muted">{data.a}</p>
        </header>
        <dl className="space-y-1 text-sm">
          <Row k="No. invoice" v={<span className="num font-semibold">{data.i}</span>} />
          <Row k="Tanggal" v={fmtDateTime(data.d)} />
          {data.c && <Row k="Pelanggan" v={data.c} />}
          {data.p && <Row k="Kendaraan" v={data.p} />}
        </dl>
        <div className="num my-5 space-y-1 border-y border-line py-4 text-sm">
          <Row k={`${data.s} · motor ${data.z}`} v={rupiah(data.pr)} />
          {data.ds > 0 && <Row k={data.m === "voucher" ? "Voucher loyalti" : "Diskon"} v={"−" + rupiah(data.ds)} />}
          <div className="flex justify-between pt-2 text-lg font-bold">
            <span>Total</span>
            <span>{rupiah(data.t)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Pembayaran ({data.m.toUpperCase()})</span>
          <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${paid ? "bg-[#e7f3ec] text-ok" : "bg-[#fde8eb] text-accent"}`}>
            {data.st === "batal" ? "batal" : data.ps}
          </span>
        </div>
        <p className="mt-6 text-center text-xs text-muted">Terima kasih! Kumpulkan stempel untuk cuci gratis.</p>
      </article>
      <div className="no-print mt-4 text-center">
        <button onClick={() => window.print()} className="h-10 rounded-md bg-ink px-4 text-sm font-medium text-white">
          Cetak / simpan PDF
        </button>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
