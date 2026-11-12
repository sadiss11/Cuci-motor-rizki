import type { Metadata } from "next";
import { mdToHtml, readDoc } from "@/lib/md";
import { PrintBar } from "@/components/PrintBar";

export const metadata: Metadata = { title: "Pitch Deck — Cuci Motor Rizky" };

export default async function PitchPage() {
  const md = await readDoc("pitch-deck.md");
  // slide dipisah dengan baris '---'; bagian sebelum slide pertama (judul dokumen) dilewati
  const slides = md.split(/\n---\n/).slice(1).map((s) => s.trim()).filter(Boolean);
  return (
    <>
      <PrintBar title="Pitch deck · 8 slide" />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {slides.map((s, i) => (
          <section key={i} className="slide slide-print relative flex flex-col justify-center overflow-hidden rounded-lg border border-line bg-paper p-6 sm:p-12">
            <span className="absolute top-0 left-0 h-1 w-16 bg-accent" />
            <span className="num absolute right-4 bottom-3 text-xs text-muted">{i + 1} / {slides.length}</span>
            <div className="prose-doc text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: mdToHtml(s) }} />
          </section>
        ))}
      </main>
    </>
  );
}
