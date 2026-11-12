# Prospektus Model Bisnis — Aplikasi Kasir CUCI MOTOR RIZKY

*Dokumen ringkas untuk diskusi dengan calon pemilik usaha. Tidak memuat proyeksi trafik, jumlah pelanggan, atau keuntungan aktual.*

## 1. Produk

Aplikasi kasir berbasis web untuk **satu gerai cuci motor**: kasir (POS), kas masuk-keluar, laporan sederhana, loyalti 10x gratis 1, invoice via tautan WhatsApp, dan promosi personal berbasis izin pelanggan. Dapat diadaptasi untuk layanan serupa (detailing, cuci mobil skala kecil).

Daftar layanan awal (dari spanduk):

| Paket | Estimasi | Kecil | Sedang | Besar |
|---|---|---:|---:|---:|
| Cuci Kinclong | 20–30 menit | Rp17.000 | Rp20.000 | Rp25.000 |
| Cuci Premium | 30–60 menit | Rp30.000 | Rp35.000 | Rp40.000 |
| Poles Body* | 2–4 jam | Rp125.000 | Rp150.000 | Rp175.000 |
| Full Detailing | 7–10 jam | Rp200.000 | Rp300.000 | Rp350.000 |

\*Termasuk Cuci Premium; tidak untuk body doff/matte. Durasi adalah estimasi.

## 2. Target pengguna

- Usaha cuci motor, detailing, dan cuci mobil skala kecil.
- Tahap awal: **satu outlet**, 1 owner + 1–3 kasir/staf.

## 3. Nilai yang ditawarkan

- **Digitalisasi transaksi**: nomor invoice, status pesanan, metode bayar tercatat.
- **Catatan kas**: pemasukan otomatis dari transaksi lunas, pengeluaran per kategori, tanpa pencatatan ganda.
- **Retensi pelanggan**: program stempel dan voucher yang dihitung sistem, bukan kartu kertas.
- **Komunikasi terstruktur**: invoice dan promo lewat WhatsApp, dikirim manual dan hanya ke pelanggan yang setuju.

## 4. Monetisasi (sisi developer)

| Komponen | Keterangan |
|---|---|
| Biaya pembuatan / setup | Satu kali: penyesuaian paket, harga, branding, data awal |
| Dukungan & hosting | Opsional, bulanan: pemeliharaan, backup, bantuan teknis |
| Fitur kustom | Berdasarkan permintaan, dihitung per lingkup |

**Tidak ada harga paket baku** — penawaran disusun setelah kebutuhan dan kompleksitas jelas.

## 5. Biaya yang perlu dihitung

Hosting aplikasi · database · domain · waktu pengembangan · backup · support · pelatihan staf.

## 6. Rumus simulasi (isi dengan data gerai sendiri)

- **Omzet layanan** = jumlah transaksi berbayar × rata-rata nilai transaksi
- **Selisih operasional** = total pemasukan − pengeluaran tercatat
- **Biaya program loyalti** = jumlah voucher dipakai × harga paket voucher (sesuai ukuran)
- **Total potongan** = diskon manual + nilai voucher

Contoh pengisian: *jika* tercatat **T** transaksi berbayar dengan rata-rata **R**, maka omzet = T × R. Angka T dan R diambil dari laporan aplikasi, bukan asumsi.

## 7. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Salah input kas | Entri tidak dihapus; pembatalan hanya oleh owner, wajib alasan, tercatat di audit trail |
| Privasi nomor WA | Opt-in tercatat (waktu & sumber), opt-out kapan saja, nomor tidak tampil di URL publik |
| Voucher ganda | Voucher terikat ke pelanggan, sekali pakai, dicek sistem |
| Koneksi internet | Pesan error yang jelas; tahap lanjut: antrean offline |
| Keamanan data | Login berperan (owner/kasir), RLS di database, backup berkala |

## 8. Roadmap

1. **MVP 1 outlet** — fitur inti seperti di demo
2. **Uji coba** di gerai, kumpulkan masukan kasir dan owner
3. **Rapikan laporan** sesuai kebutuhan nyata
4. **Multi-outlet** bila dibutuhkan

## 9. Batasan saat ini (jujur)

- Belum ada integrasi payment gateway; QRIS dicatat manual.
- Belum ada WhatsApp API otomatis; semua pesan dikirim manual oleh staf lewat wa.me.
- Versi demo menyimpan data di browser; versi produksi memakai Supabase (PostgreSQL + Auth).
