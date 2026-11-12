"use client";
// Komponen dasar — gaya mengikuti JHOPTIK (merah merek, netral stone, kartu rounded-xl).
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-stone-900">{title}</h1>
        {desc && <p className="mt-0.5 text-[13px] text-stone-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={cx("min-w-0 rounded-xl border border-line bg-paper", className)}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold leading-snug">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={cx("rounded-lg border bg-paper px-3.5 py-3", accent ? "border-accent-200 bg-accent-50" : "border-line")}>
      <div className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">{label}</div>
      <div className={cx("num mt-1 text-[22px] font-bold leading-tight", accent && "text-accent-hover")}>{value}</div>
      {hint && <div className="text-[12px] text-stone-500">{hint}</div>}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "outline"; size?: "sm" | "md" };
export function Button({ variant = "primary", size = "md", className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13.5px]",
        variant === "primary" && "bg-accent text-white hover:bg-accent-hover",
        variant === "outline" && "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
        variant === "ghost" && "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
        variant === "danger" && "border border-accent-200 bg-white text-accent hover:bg-accent-50",
        className,
      )}
    />
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-stone-800">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[12px] text-accent">{error}</span> : hint ? <span className="mt-1 block text-[12px] text-stone-500">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-stone-900 outline-none placeholder:text-stone-400 focus:border-accent focus:ring-2 focus:ring-accent-100";
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, className)} />;
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(inputCls, className)} />;

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" | "dark" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "neutral" && "bg-stone-100 text-stone-600",
        tone === "ok" && "bg-stone-900 text-white",
        tone === "warn" && "bg-stone-200 text-stone-800",
        tone === "bad" && "border border-stone-400 bg-white text-stone-500 line-through",
        tone === "dark" && "bg-stone-900 text-white",
      )}
    >
      {children}
    </span>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-0.5 rounded-lg border border-stone-200 bg-stone-50 p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === o.value}
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "min-h-9 rounded-md px-2 py-1.5 text-[13px]",
            value === o.value ? "bg-white font-semibold text-accent-hover shadow-sm" : "text-stone-600 hover:text-stone-900",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center text-[13px] text-stone-500">{children}</div>;
}

export function StampBar({ progress, threshold }: { progress: number; threshold: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Stempel ${progress} dari ${threshold}`}>
      {Array.from({ length: threshold }, (_, i) => (
        <span key={i} className={cx("h-2.5 w-2.5 rounded-full border", i < progress ? "border-accent bg-accent" : "border-stone-300 bg-white")} />
      ))}
      <span className="num ml-1 text-[12px] text-stone-500">
        {progress}/{threshold}
      </span>
    </div>
  );
}

export const statusTone = (s: string) =>
  s === "selesai" || s === "lunas" ? "ok" : s === "batal" || s === "refund" ? "bad" : s === "diproses" ? "warn" : "neutral";
