"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button, Field, Input, Segmented } from "@/components/ui";
import type { Role } from "@/lib/types";

export default function LoginPage() {
  const { db, login } = useStore();
  const router = useRouter();
  const [role, setRole] = useState<Role>("kasir");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(role, pin)) router.replace(role === "owner" ? "/dashboard" : "/kasir");
    else setErr("PIN salah.");
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8">
        <div className="mb-3 h-1 w-10 bg-accent" />
        <h1 className="text-2xl font-extrabold tracking-tight">{db?.settings.businessName ?? "CUCI MOTOR RIZKY"}</h1>
        <p className="text-sm text-muted">Sistem kasir & loyalti pelanggan</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-line bg-paper p-5">
        <Field label="Masuk sebagai">
          <Segmented
            label="Peran"
            value={role}
            onChange={(v) => {
              setRole(v);
              setErr("");
            }}
            options={[
              { value: "kasir", label: "Kasir" },
              { value: "owner", label: "Owner" },
            ]}
          />
        </Field>
        <Field label="PIN" error={err}>
          <Input type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus required />
        </Field>
        <Button type="submit" className="w-full" disabled={!db}>
          Masuk
        </Button>
      </form>
      <div className="mt-4 rounded-md border border-dashed border-line p-3 text-xs text-muted">
        <b className="text-ink">Mode demo.</b> PIN Owner <code>1234</code>, Kasir <code>0000</code>. Data contoh tersimpan di browser ini saja (belum
        persisten di server) sampai Supabase dihubungkan.
      </div>
      <div className="mt-4 flex gap-4 text-xs text-muted">
        <Link href="/pitch" className="underline">
          Pitch deck
        </Link>
        <Link href="/prospektus" className="underline">
          Prospektus
        </Link>
      </div>
    </main>
  );
}
