# CUCI MOTOR RIZKY — Kasir & Loyalti (MVP)

Aplikasi kasir web untuk gerai cuci motor: POS, kas masuk-keluar, laporan, loyalti 10x gratis 1, invoice via tautan WhatsApp, dan promosi personal berbasis izin. Responsif untuk HP dan desktop. Bahasa Indonesia.

> **Mode demo.** Supabase belum dihubungkan, jadi data contoh disimpan di `localStorage` browser masing-masing perangkat. Data **belum persisten di server** dan tidak dibagikan antar-perangkat. Skema produksi tersedia di [`supabase/schema.sql`](supabase/schema.sql).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Login demo: **Owner** PIN `1234` · **Kasir** PIN `0000`. Reset data contoh: Pengaturan → Reset data demo.

## Halaman

| Rute | Akses | Isi |
|---|---|---|
| `/dashboard` | Owner | Pemasukan, pengeluaran, selisih operasional, transaksi, top paket, pelanggan loyal, transaksi terakhir |
| `/kasir` | Owner, Kasir | POS: paket, ukuran, pelanggan, diskon, metode bayar, nominal diterima, Simpan & Buat Invoice |
| `/pesanan` | Owner, Kasir | Status baru → diproses → selesai / batal, tandai lunas, invoice & WhatsApp |
| `/pelanggan` | Owner, Kasir | Stempel 0/10, voucher, opt-in/opt-out promo, kirim promo personal |
| `/kas` | Owner, Kasir | Catat pengeluaran/pemasukan lain, rekap harian; pembatalan entri hanya owner |
| `/laporan` | Owner | Ringkasan, rekap harian/mingguan/bulanan, ekspor CSV, audit trail |
| `/pengaturan` | Owner | Nama usaha, WA usaha, paket & harga, kebijakan voucher, template promo, PIN |
| `/i/[token]` | Publik | Invoice read-only (data minimal, tanpa nomor WA) |
| `/pitch`, `/prospektus` | Publik | Pitch deck 8 slide & prospektus, siap cetak |

## Aturan bisnis yang diterapkan

- **Kas**: transaksi lunas otomatis menjadi 1 entri kas masuk (idempoten per pesanan). Entri tidak pernah dihapus; pembatalan butuh alasan dan tercatat di audit trail.
- **Loyalti**: 1 stempel per transaksi *berbayar, lunas, selesai* dengan nomor WA. Setiap 10 stempel → 1 voucher Cuci Kinclong sesuai ukuran motor. Voucher tidak memberi stempel dan sekali pakai. Batal/refund mencabut stempel; pembatalan transaksi voucher mengembalikan voucher.
- **Invoice**: token acak 24 karakter. Di mode demo, data invoice minimal dikodekan di fragmen URL (`#…`, tidak dikirim ke server) agar bisa dibuka di HP pelanggan. Nomor WA tidak pernah masuk URL.
- **WhatsApp**: hanya membuka `wa.me` dengan pesan siap kirim; staf menekan kirim sendiri. Tidak ada auto-send, blast, atau bot.
- **Pembayaran**: transfer/QRIS hanya konfirmasi manual. Tidak ada integrasi payment gateway.
- **Laporan** memakai istilah *selisih operasional* (kas masuk − kas keluar tercatat), bukan laba bersih.

## Struktur

```
app/(app)/*        halaman aplikasi (dijaga role di components/Shell.tsx)
app/i/[token]      invoice publik
lib/logic.ts       semua aturan bisnis (murni, mudah dipindah ke RPC Supabase)
lib/store.tsx      penyimpanan demo (localStorage), commit atomik per aksi
lib/seed.ts        data contoh 4 minggu
lib/report.ts      perhitungan laporan
supabase/schema.sql  tabel, index anti-ganda, RLS
docs/              pitch deck, prospektus, checklist pengujian
```

## Menghubungkan Supabase (langkah berikutnya)

1. Buat proyek Supabase, jalankan `supabase/schema.sql`.
2. Isi `.env.local` dari `.env.example` (service role key **hanya** di server).
3. Ganti `commit` di `lib/store.tsx` dengan panggilan RPC (`create_order`, `mark_paid`, `set_order_status`, `void_cash`) yang menjalankan logika `lib/logic.ts` dalam satu transaksi database.
4. Ganti login PIN dengan Supabase Auth; peran diambil dari tabel `users`.
5. Halaman `/i/[token]` membaca invoice via route server berdasarkan `invoice_tokens`.

## Dokumen

- [Pitch deck 8 slide](docs/pitch-deck.md) — web: `/pitch`
- [Prospektus model bisnis](docs/prospektus.md) — web: `/prospektus`
- [Checklist pengujian](docs/checklist-pengujian.md)
