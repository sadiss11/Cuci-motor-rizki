"use client";
// Grafik ringan berbasis SVG/HTML (tanpa library). Hitam-putih sesuai permintaan:
// seri-1 hitam, seri-2 abu-abu (dibedakan terang-gelap + legenda + tooltip + tabel).
import { useEffect, useRef, useState, type ReactNode } from "react";

export const VIZ = {
  s1: "#1c1917",
  s2: "#a8a29e",
  neg: "#a8a29e",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  muted: "#898781",
  text2: "#52514e",
  surface: "#ffffff",
};

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * p;
}

/** Bar dengan ujung data membulat 4px, sisi baseline persegi. */
function barPath(x: number, y0: number, w: number, h: number, up: boolean) {
  const r = Math.min(4, w / 2, Math.abs(h));
  if (h <= 0) return "";
  if (up) {
    const top = y0 - h;
    return `M${x},${y0}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${y0}Z`;
  }
  const bot = y0 + h;
  return `M${x},${y0}V${bot - r}Q${x},${bot} ${x + r},${bot}H${x + w - r}Q${x + w},${bot} ${x + w},${bot - r}V${y0}Z`;
}

export interface Series {
  name: string;
  color: string;
}

export function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-4 text-xs text-[#52514e]">
      {series.map((s) => (
        <span key={s.name} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

export function ColumnChart({
  data,
  series,
  format,
  axisFormat,
  height = 220,
  colorFor,
  labelEvery,
}: {
  data: { label: string; full?: string; values: number[] }[];
  series: Series[];
  format: (n: number) => string;
  axisFormat: (n: number) => string;
  height?: number;
  colorFor?: (value: number, seriesIndex: number) => string;
  labelEvery?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 44;
  const padB = 22;
  const padT = 10;
  const plotW = Math.max(0, width - padL - 4);
  const plotH = height - padB - padT;
  const all = data.flatMap((d) => d.values);
  const hasNeg = all.some((v) => v < 0);
  const hi = Math.max(0, ...all);
  const lo = Math.max(0, ...all.map((v) => -v));
  // langkah sumbu bulat (1/2/2,5/5 × 10^n), minimal 1
  const step = Math.max(1, niceMax((hi + lo) / 4 || 1));
  const maxV = Math.max(step, Math.ceil(hi / step) * step);
  const minV = hasNeg ? -Math.ceil(lo / step) * step : 0;
  const span = maxV - minV || 1;
  const y = (v: number) => padT + ((maxV - v) / span) * plotH;
  const zeroY = y(0);
  const band = data.length ? plotW / data.length : 0;
  const groupW = Math.min(band * 0.7, 24 * series.length + 2 * (series.length - 1));
  const barW = Math.max(2, (groupW - 2 * (series.length - 1)) / series.length);
  const ticks: number[] = [];
  for (let t = minV; t <= maxV + 1e-9; t += step) ticks.push(Math.round(t));
  const every = labelEvery ?? Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 44))));

  return (
    <div ref={ref} className="relative w-full select-none" onMouseLeave={() => setHover(null)}>
      <Legend series={series} />
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={series.map((s) => s.name).join(" dan ")}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={width - 4} y1={y(t)} y2={y(t)} stroke={t === 0 ? VIZ.axis : VIZ.grid} strokeWidth={1} />
              <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill={VIZ.muted} className="num">
                {axisFormat(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const gx = padL + i * band + (band - groupW) / 2;
            return (
              <g key={d.label + i}>
                {hover === i && <rect x={padL + i * band} y={padT} width={band} height={plotH} fill="#000" opacity={0.035} />}
                {d.values.map((v, si) => (
                  <path
                    key={si}
                    d={barPath(gx + si * (barW + 2), zeroY, barW, Math.abs(y(v) - zeroY), v >= 0)}
                    fill={colorFor ? colorFor(v, si) : series[si].color}
                  />
                ))}
                {i % every === 0 && (
                  <text x={padL + i * band + band / 2} y={height - 6} textAnchor="middle" fontSize={10} fill={VIZ.muted}>
                    {d.label}
                  </text>
                )}
                <rect
                  x={padL + i * band}
                  y={padT}
                  width={band}
                  height={plotH + padB}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onClick={() => setHover(i)}
                />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute z-10 min-w-36 rounded-md border border-line bg-paper px-3 py-2 text-xs shadow-md"
          style={{
            left: Math.min(Math.max(0, padL + hover * band + band / 2 - 72), Math.max(0, width - 160)),
            top: 24,
          }}
        >
          <div className="mb-1 font-semibold">{data[hover].full ?? data[hover].label}</div>
          {data[hover].values.map((v, si) => (
            <div key={si} className="num flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-2 w-2 rounded-sm" style={{ background: colorFor ? colorFor(v, si) : series[si].color }} />
                {series[si].name}
              </span>
              <span className="font-medium">{format(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HBarChart({ rows, color = VIZ.s1, format }: { rows: { label: string; value: number; sub?: string }[]; color?: string; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted">Belum ada data.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="group grid grid-cols-[minmax(84px,30%)_1fr] items-center gap-3 text-sm" title={`${r.label}: ${format(r.value)}${r.sub ? " · " + r.sub : ""}`}>
          <span className="truncate text-[#52514e]">{r.label}</span>
          <span className="flex items-center gap-2">
            <span className="h-3.5 rounded-r-[4px] transition-opacity group-hover:opacity-80" style={{ width: `${Math.max(1, (r.value / max) * 78)}%`, background: color }} />
            <span className="num shrink-0 text-xs font-medium">
              {format(r.value)}
              {r.sub && <span className="ml-1 font-normal text-muted">{r.sub}</span>}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Kartu grafik dengan tombol "Tabel" (tampilan data yang dapat diakses). */
export function ChartCard({ title, desc, children, table, className = "" }: { title: string; desc?: string; children: ReactNode; table: { head: string[]; rows: (string | number)[][] }; className?: string }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`min-w-0 rounded-lg border border-line bg-paper ${className}`}>
      <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {desc && <p className="text-xs text-muted">{desc}</p>}
        </div>
        <button onClick={() => setAsTable((v) => !v)} className="no-print shrink-0 rounded border border-line px-2 py-0.5 text-xs text-muted hover:border-ink hover:text-ink" aria-pressed={asTable}>
          {asTable ? "Grafik" : "Tabel"}
        </button>
      </div>
      <div className="p-4">
        {asTable ? (
          <div className="max-h-72 overflow-auto">
            <table className="num w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  {table.head.map((h, i) => (
                    <th key={h} className={`py-1 font-medium ${i ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {table.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j} className={`py-1.5 ${j ? "text-right" : ""}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
