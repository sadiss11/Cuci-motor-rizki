import type { DB, PayMethod, Service, Size } from "./types";
import { addCash, createOrder, markPaid, setClock, setConsent, setStatus } from "./logic";

export const DB_VERSION = 1;

export const DEFAULT_SERVICES: Service[] = [
  { id: "kinclong", name: "Cuci Kinclong", duration: "20–30 menit", prices: { kecil: 17000, sedang: 20000, besar: 25000 }, active: true },
  { id: "premium", name: "Cuci Premium", duration: "30–60 menit", prices: { kecil: 30000, sedang: 35000, besar: 40000 }, active: true },
  {
    id: "poles",
    name: "Poles Body",
    duration: "2–4 jam",
    prices: { kecil: 125000, sedang: 150000, besar: 175000 },
    note: "Termasuk Cuci Premium. Tidak untuk body doff/matte.",
    active: true,
  },
  { id: "detailing", name: "Full Detailing", duration: "7–10 jam", prices: { kecil: 200000, sedang: 300000, besar: 350000 }, active: true },
];

export function emptyDB(): DB {
  return {
    version: DB_VERSION,
    settings: {
      businessName: "CUCI MOTOR RIZKY",
      businessWa: "6281200000000",
      address: "Alamat gerai (ubah di Pengaturan)",
      loyaltyThreshold: 10,
      loyaltyRewardServiceId: "kinclong",
      promoTemplate:
        "Halo {nama}! Motor sudah waktunya dicuci lagi? Datang ke {usaha} minggu ini ya. Balas STOP jika tidak ingin menerima info promo.",
      pins: { owner: "1234", kasir: "0000" },
    },
    services: structuredClone(DEFAULT_SERVICES),
    customers: [],
    orders: [],
    cash: [],
    loyaltyEvents: [],
    loyaltyRewards: [],
    consents: [],
    audit: [],
    seq: 0,
  };
}

// RNG deterministik supaya data contoh konsisten
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const PEOPLE = [
  { name: "Andi Saputra", phone: "081234560001", plate: "B 3421 KZT", visits: 11 },
  { name: "Budi Hartono", phone: "081234560002", plate: "B 6612 PLM", visits: 9 },
  { name: "Citra Lestari", phone: "081234560003", plate: "F 2190 AB", visits: 5 },
  { name: "Dewi Anggraini", phone: "081234560004", plate: "B 4455 UYT", visits: 3 },
  { name: "Eko Prasetyo", phone: "081234560005", plate: "B 7788 QWE", visits: 2 },
  { name: "Fajar Nugroho", phone: "081234560006", plate: "B 1020 NNA", visits: 1 },
];

export function seedDB(): DB {
  const db = emptyDB();
  const r = rng(42);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const methods: PayMethod[] = ["tunai", "tunai", "tunai", "transfer", "qris"];
  const sizes: Size[] = ["kecil", "kecil", "sedang", "sedang", "besar"];
  const DAYS = 28;
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const at = (daysAgo: number, hour: number, min = 0) => {
    const d = new Date(base);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  };

  type Job = { day: number; hour: number; person?: (typeof PEOPLE)[number] };
  const jobs: Job[] = [];
  for (const p of PEOPLE) {
    for (let i = 0; i < p.visits; i++) jobs.push({ day: Math.floor((i * DAYS) / p.visits + r() * 2), hour: 8 + Math.floor(r() * 9), person: p });
  }
  for (let i = 0; i < 40; i++) jobs.push({ day: Math.floor(r() * DAYS), hour: 8 + Math.floor(r() * 9) });
  jobs.sort((a, b) => b.day - a.day || a.hour - b.hour);

  for (const j of jobs) {
    const day = Math.min(DAYS, Math.max(0, j.day));
    setClock(at(day, j.hour, Math.floor(r() * 60)));
    const roll = r();
    const serviceId = roll < 0.55 ? "kinclong" : roll < 0.85 ? "premium" : roll < 0.96 ? "poles" : "detailing";
    const size = pick(sizes);
    const method = pick(methods);
    const price = db.services.find((s) => s.id === serviceId)!.prices[size];
    const isToday = day === 0;
    const o = createOrder(
      db,
      {
        serviceId,
        size,
        customerName: j.person?.name ?? "",
        phone: j.person?.phone ?? "",
        plate: j.person?.plate ?? "",
        discount: r() < 0.1 ? 2000 : 0,
        payMethod: method,
        payStatus: "belum",
        received: 0,
      },
      "kasir",
    );
    setClock(at(day, j.hour + 1));
    if (isToday && r() < 0.5) {
      // biarkan sebagian pesanan hari ini masih berjalan
      if (r() < 0.5) setStatus(db, o.id, "diproses", "kasir");
      continue;
    }
    markPaid(db, o.id, method, method === "tunai" ? Math.ceil(price / 10000) * 10000 : o.total, "kasir");
    setStatus(db, o.id, "selesai", "kasir");
  }

  // satu pembatalan sebagai contoh audit
  const cancelTarget = db.orders.find((o) => !o.customerId && o.status === "selesai");
  if (cancelTarget) {
    setClock(cancelTarget.doneAt ?? null);
    setStatus(db, cancelTarget.id, "batal", "owner", "Salah input paket (contoh data)");
  }

  // pengeluaran contoh
  const expenses: [number, "sabun" | "bahan poles" | "gaji" | "listrik" | "sewa" | "lain-lain", number, string][] = [
    [27, "sewa", 1500000, "Sewa tempat bulan ini"],
    [25, "sabun", 180000, "Sabun & shampo motor 5L"],
    [20, "bahan poles", 250000, "Compound + wax"],
    [18, "listrik", 320000, "Token listrik"],
    [14, "gaji", 700000, "Gaji mingguan 2 pencuci"],
    [11, "sabun", 150000, "Sabun & semir ban"],
    [7, "gaji", 700000, "Gaji mingguan 2 pencuci"],
    [5, "lain-lain", 85000, "Lap microfiber"],
    [1, "bahan poles", 120000, "Wax"],
  ];
  for (const [d, cat, amt, note] of expenses) {
    setClock(at(d, 18));
    addCash(db, { date: at(d, 18), type: "keluar", category: cat, amount: amt, note, pic: "Rizky" }, "owner");
  }
  setClock(at(9, 12));
  addCash(db, { date: at(9, 12), type: "masuk", category: "pemasukan lain", amount: 50000, note: "Jual parfum motor", pic: "Rizky" }, "owner");

  // persetujuan promosi
  db.customers.forEach((c, i) => {
    setClock(c.createdAt);
    if (i % 3 !== 2) setConsent(db, c.id, true, "Kasir - persetujuan lisan saat transaksi", "kasir");
  });

  setClock(null);
  return db;
}
