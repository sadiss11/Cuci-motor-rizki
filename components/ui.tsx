"use client";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={cx("rounded-lg border border-line bg-paper", className)}>
      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={cx("rounded-lg border bg-paper p-4", accent ? "border-ink" : "border-line")}>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="num mt-1 text-xl font-bold sm:text-2xl">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "outline"; size?: "sm" | "md" };
export function Button({ variant = "primary", size = "md", className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "h-8 px-3 text-sm" : "h-11 px-4 text-sm",
        variant === "primary" && "bg-ink text-white hover:bg-black",
        variant === "outline" && "border border-ink bg-paper text-ink hover:bg-soft",
        variant === "ghost" && "text-ink hover:bg-soft",
        variant === "danger" && "border border-accent bg-paper text-accent hover:bg-accent hover:text-white",
        className,
      )}
    />
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-accent">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

const inputCls = "h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-ink";
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, className)} />;
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(inputCls, className)} />;

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" | "dark" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tone === "neutral" && "bg-soft text-muted",
        tone === "ok" && "bg-[#e7f3ec] text-ok",
        tone === "warn" && "bg-[#fff4d6] text-[#7a5a00]",
        tone === "bad" && "bg-[#fde8eb] text-accent",
        tone === "dark" && "bg-ink text-white",
      )}
    >
      {children}
    </span>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === o.value}
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "min-h-11 rounded-md border px-2 py-2 text-sm font-medium",
            value === o.value ? "border-ink bg-ink text-white" : "border-line bg-paper hover:border-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-8 text-center text-sm text-muted">{children}</div>;
}

export function StampBar({ progress, threshold }: { progress: number; threshold: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Stempel ${progress} dari ${threshold}`}>
      {Array.from({ length: threshold }, (_, i) => (
        <span key={i} className={cx("h-2.5 w-2.5 rounded-full border", i < progress ? "border-accent bg-accent" : "border-line bg-paper")} />
      ))}
      <span className="num ml-1 text-xs text-muted">
        {progress}/{threshold}
      </span>
    </div>
  );
}

export const statusTone = (s: string) =>
  s === "selesai" || s === "lunas" ? "ok" : s === "batal" || s === "refund" ? "bad" : s === "diproses" ? "warn" : "neutral";
