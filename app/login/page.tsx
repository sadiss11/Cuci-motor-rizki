"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Field, Input, Segmented } from "@/components/ui";
import type { Role } from "@/lib/types";

export default function LoginPage() {
  const { db, login } = useStore();
  const router = useRouter();
  const [role, setRole] = useState<Role>("kasir");
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(role, pin)) router.replace(role === "owner" ? "/dashboard" : "/kasir");
    else setErr("PIN salah.");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white text-stone-900 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(28rem,34rem)]">
      <section className="flex flex-col justify-center border-b border-line bg-white px-6 py-5 sm:px-14 lg:border-r lg:border-b-0 lg:py-14">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="sr-only">{db?.settings.businessName ?? "CUCI MOTOR RIZKY"}</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/header.png" alt="Cuci Motor Rizky — Bersih, Kinclong, Pikiran Jernih" width={757} height={197} className="h-auto w-full" />
          <div
            aria-hidden
            className="mt-6 h-3 w-full rounded-sm"
            style={{ backgroundImage: "repeating-conic-gradient(#111 0 25%, #fff 0 50%)", backgroundSize: "12px 12px" }}
          />
          <ul className="mt-6 hidden gap-3 text-[13.5px] text-stone-700 sm:grid sm:grid-cols-3">
            {["Kasir cepat sesuai daftar harga spanduk", "Kas, laporan & grafik harian", "Loyalti 10x cuci gratis 1"].map((t) => (
              <li key={t} className="rounded-lg border border-line bg-soft px-3 py-2.5">
                <span className="mb-1 block h-1 w-6 bg-ink" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="flex flex-1 items-start justify-center bg-soft px-4 py-6 sm:px-8 lg:items-center lg:py-10">
        <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-white">
          <form onSubmit={submit} className="space-y-4 p-6">
            <div className="flex items-center gap-4">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-accent-50 text-accent">
                <Users className="size-5" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Masuk</h2>
                <p className="text-[13px] text-stone-500">Masuk ke kasir {db?.settings.businessName ?? ""}</p>
              </div>
            </div>
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
              <span className="relative block">
                <Input
                  type={show ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="Masukkan PIN…"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pr-10"
                  autoFocus
                  required
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-500" aria-label={show ? "Sembunyikan PIN" : "Tampilkan PIN"}>
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </Field>
            <Button type="submit" className="h-11 w-full" disabled={!db}>
              Masuk
            </Button>
          </form>
          <div className="space-y-2 border-t border-line bg-soft px-6 py-4 text-center text-[13px] text-stone-600">
            <p>
              <b className="text-stone-800">Mode demo</b> · PIN Owner <code>1234</code> · Kasir <code>0000</code>
            </p>
            <p className="text-[12px] text-stone-500">Data contoh tersimpan di browser ini saja sampai Supabase dihubungkan.</p>
            <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              <Link href="/pitch" className="text-accent-hover underline">
                Pitch deck
              </Link>
              <Link href="/prospektus" className="text-accent-hover underline">
                Prospektus
              </Link>
              <a href="/spanduk.jpg" target="_blank" className="text-accent-hover underline">
                Daftar harga
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
