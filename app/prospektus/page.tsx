import type { Metadata } from "next";
import { mdToHtml, readDoc } from "@/lib/md";
import { PrintBar } from "@/components/PrintBar";

export const metadata: Metadata = { title: "Prospektus — Cuci Motor Rizky" };

export default async function ProspektusPage() {
  const md = await readDoc("prospektus.md");
  return (
    <>
      <PrintBar title="Prospektus model bisnis" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <article className="prose-doc rounded-lg border border-line bg-paper p-6 sm:p-10 print:border-0 print:p-0" dangerouslySetInnerHTML={{ __html: mdToHtml(md) }} />
      </main>
    </>
  );
}
