"use client";
import Link from "next/link";

export function PrintBar({ title }: { title: string }) {
  return (
    <div className="no-print sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-4xl items-center gap-4 px-4 text-sm">
        <Link href="/login" className="text-muted hover:text-ink">← Aplikasi</Link>
        <span className="font-semibold">{title}</span>
        <button onClick={() => window.print()} className="ml-auto h-8 rounded-lg bg-accent px-3 font-semibold text-white hover:bg-accent-hover">
          Cetak / PDF
        </button>
      </div>
    </div>
  );
}
