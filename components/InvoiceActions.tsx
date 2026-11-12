"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { invoiceMessage, invoiceUrl } from "@/lib/logic";
import { waLink } from "@/lib/format";
import type { Order } from "@/lib/types";
import { Button } from "./ui";

export function InvoiceActions({ order, compact }: { order: Order; compact?: boolean }) {
  const { db } = useApp();
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const phone = order.customerId ? db.customers.find((c) => c.id === order.customerId)?.phone : undefined;
  const msg = invoiceMessage(db, order, origin);
  const url = invoiceUrl(db, order, origin);
  const size = compact ? "sm" : "md";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size={size} variant="outline" onClick={() => window.open(url, "_blank", "noopener")}>
          Lihat / cetak bukti
        </Button>
        <Button
          size={size}
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
        >
          {copied ? "Tersalin ✓" : "Salin link"}
        </Button>
        <Button size={size} variant="ghost" onClick={() => setPreview((p) => !p)}>
          {preview ? "Tutup pesan" : "Preview pesan"}
        </Button>
        <Button
          size={size}
          disabled={!phone}
          title={phone ? "" : "Pelanggan tanpa nomor WA"}
          onClick={() => phone && window.open(waLink(phone, msg), "_blank", "noopener")}
        >
          Kirim via WhatsApp
        </Button>
      </div>
      {preview && <pre className="whitespace-pre-wrap rounded-md border border-line bg-soft p-3 text-xs">{msg}</pre>}
      {!phone && <p className="text-xs text-muted">Tidak ada nomor WA — salin link lalu kirim manual.</p>}
    </div>
  );
}
