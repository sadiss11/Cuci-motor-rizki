"use client";
import { presetRange, type Range } from "@/lib/report";
import { Input } from "./ui";

const PRESETS = [
  { k: "hari", l: "Hari ini" },
  { k: "7hari", l: "7 hari" },
  { k: "bulan", l: "Bulan ini" },
  { k: "30hari", l: "30 hari" },
] as const;

export function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => {
        const r = presetRange(p.k);
        const on = r.from === value.from && r.to === value.to;
        return (
          <button key={p.k} onClick={() => onChange(r)} className={`h-8 rounded-full border px-3 text-[12.5px] ${on ? "border-accent-200 bg-accent-50 font-semibold text-accent-hover" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"}`}>
            {p.l}
          </button>
        );
      })}
      <span className="flex items-center gap-1">
        <Input type="date" aria-label="Dari tanggal" className="h-9 w-auto text-sm" value={value.from} max={value.to} onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })} />
        <span className="text-muted">–</span>
        <Input type="date" aria-label="Sampai tanggal" className="h-9 w-auto text-sm" value={value.to} min={value.from} onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })} />
      </span>
    </div>
  );
}
