import type { Size } from "./types";

export const rupiah = (n: number) =>
  "Rp" + Math.round(n || 0).toLocaleString("id-ID");

export const SIZES: Size[] = ["kecil", "sedang", "besar"];
export const sizeLabel = (s: Size) => "Motor " + s;

export function normalizePhone(raw: string): string | null {
  let d = (raw || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (!d) return null;
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  if (!/^628\d{7,11}$/.test(d)) return null;
  return d;
}

export const maskPhone = (p: string) =>
  p ? p.slice(0, 4) + "•".repeat(Math.max(0, p.length - 7)) + p.slice(-3) : "-";

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function weekKey(iso: string) {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7; // senin = 0
  d.setDate(d.getDate() - day);
  return "Minggu " + dayKey(d.toISOString());
}

export const monthKey = (iso: string) => dayKey(iso).slice(0, 7);

export function randomToken(len = 24) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (x) => chars[x % chars.length]).join("");
}

export const uid = () => randomToken(12);

export function parseAmount(v: string): number {
  const n = Number(String(v).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function toCsv(rows: (string | number)[][]) {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
