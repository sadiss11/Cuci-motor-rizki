"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const { db, role } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!db) return;
    router.replace(role === "owner" ? "/dashboard" : role === "kasir" ? "/kasir" : "/login");
  }, [db, role, router]);
  return <div className="p-8 text-sm text-muted">Memuat…</div>;
}
