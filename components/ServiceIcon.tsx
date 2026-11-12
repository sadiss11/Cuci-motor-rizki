// Ikon paket bergaya spanduk: lingkaran hitam, gambar putih, kilau bintang.
const star = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;

function Scooter() {
  return (
    <g stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx={21} cy={45} r={5.5} />
      <circle cx={45} cy={45} r={5.5} />
      <path d="M13 43c0-7 5-11 12-11h7l3 7h6l4-15" />
      <path d="M41 24h7" />
      <path d="M21 28h11" strokeWidth={4} />
      <path d="M27 39h9" />
    </g>
  );
}

export function ServiceIcon({ id, size = 64 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <circle cx={32} cy={32} r={31} fill="#111" />
      {id === "kinclong" && (
        <>
          <Scooter />
          <path d={star(18, 15, 5)} fill="#fff" />
          <path d={star(32, 11, 3)} fill="#fff" />
          <path d={star(46, 14, 4)} fill="#fff" />
        </>
      )}
      {id === "premium" && (
        <>
          <Scooter />
          <path d={star(20, 14, 5)} fill="#fff" />
          <path d={star(34, 10, 3)} fill="#fff" />
          <g fill="none" stroke="#fff" strokeWidth={1.6}>
            <circle cx={12} cy={53} r={2.5} />
            <circle cx={33} cy={54} r={2} />
            <circle cx={52} cy={53} r={3} />
            <circle cx={47} cy={15} r={2.5} />
          </g>
        </>
      )}
      {id === "poles" && (
        <>
          <ellipse cx={26} cy={46} rx={14} ry={5} fill="#fff" />
          <path d="M14 43h24" stroke="#111" strokeWidth={1.5} />
          <path d="M26 41 42 24" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
          <path d="M39 21l6 6" stroke="#111" strokeWidth={1.6} />
          <path d="M44 30l6 4" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
          <path d={star(16, 18, 5)} fill="#fff" />
          <path d={star(50, 46, 4)} fill="#fff" />
          <path d={star(28, 12, 3)} fill="#fff" />
        </>
      )}
      {id === "detailing" && (
        <>
          <path d="M15 30h13l2 4v18a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V34z" fill="#fff" />
          <path d="M17 30v-6h9l6 2v3h-6v1" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinejoin="round" />
          <path d="M26 31l3 6" stroke="#111" strokeWidth={1.6} />
          <rect x={34} y={40} width={18} height={12} rx={3} fill="#fff" />
          <g fill="#111">
            <circle cx={39} cy={45} r={1.2} />
            <circle cx={45} cy={47} r={1.2} />
            <circle cx={48} cy={43.5} r={1} />
          </g>
          <path d={star(42, 18, 5)} fill="#fff" />
          <path d={star(52, 28, 3)} fill="#fff" />
          <g fill="none" stroke="#fff" strokeWidth={1.4}>
            <circle cx={35} cy={24} r={1.5} />
            <circle cx={37} cy={30} r={1.2} />
          </g>
        </>
      )}
      {!["kinclong", "premium", "poles", "detailing"].includes(id) && (
        <>
          <Scooter />
          <path d={star(32, 13, 5)} fill="#fff" />
        </>
      )}
    </svg>
  );
}

export function CheckDot() {
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" aria-hidden className="mt-0.5 shrink-0">
      <circle cx={8} cy={8} r={8} fill="#111" />
      <path d="M4.5 8.3 7 10.6l4.6-5" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const priceK = (n: number) => (n % 1000 === 0 ? `${n / 1000}k` : `${(n / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}k`);
