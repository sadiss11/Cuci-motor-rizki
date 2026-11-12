# BRIEF UNTUK CLAUDE — CUCI MOTOR RIZKY

## Tujuan
Buat MVP aplikasi kasir web sederhana, cepat digunakan, mobile-friendly, untuk CUCI MOTOR RIZKY; sekaligus buat naskah pitch deck 8 slide dan prospektus bisnis singkat. Desain bersih, hitam-putih dengan aksen merah tipis sesuai spanduk. Hindari template generik/neon/animasi berlebihan. Gunakan Bahasa Indonesia.

## A. Daftar layanan (data awal dari spanduk)
| Paket | Estimasi waktu | Motor kecil | Motor sedang | Motor besar |
|---|---|---:|---:|---:|
| Cuci Kinclong | 20–30 menit | Rp17.000 | Rp20.000 | Rp25.000 |
| Cuci Premium | 30–60 menit | Rp30.000 | Rp35.000 | Rp40.000 |
| Poles Body | 2–4 jam | Rp125.000 | Rp150.000 | Rp175.000 |
| Full Detailing | 7–10 jam | Rp200.000 | Rp300.000 | Rp350.000 |

Catatan paket: Poles Body termasuk Cuci Premium; tidak untuk body doff/matte. Durasi adalah estimasi dan tidak menjanjikan waktu pasti.

## B. Fitur MVP prioritas
1. **Login dan peran**: Owner (semua akses) serta Kasir (transaksi dan pelanggan, tanpa pengaturan sensitif).
2. **POS Kasir**: pilih paket + ukuran motor, input nama/nomor WA pelanggan opsional, nomor polisi opsional, subtotal/diskon, metode pembayaran tunai/transfer/QRIS *konfirmasi manual*, status pesanan (baru–diproses–selesai–batal), simpan dan cetak bukti.
3. **Kas masuk & keluar**: pemasukan otomatis dari transaksi **lunas** dan pemasukan lain manual; catat pengeluaran (sabun, bahan poles, gaji, listrik, sewa, lain-lain); filter tanggal; rekap kas harian; hindari pencatatan ganda.
4. **Laporan sederhana**: total transaksi, omzet layanan, kas masuk, kas keluar, selisih kas operasional, paket populer, rekap harian/mingguan/bulanan, ekspor CSV. Sebut 'selisih operasional', bukan laba bersih akuntansi penuh.
5. **Loyalti 10x gratis 1**: setiap *transaksi berbayar yang lunas dan selesai* memberi 1 stempel ke pelanggan teridentifikasi dengan nomor WA. Saat mencapai 10, pelanggan mendapat 1 voucher gratis layanan **Cuci Kinclong** sesuai ukuran motor; pemilik bisa ubah aturan di pengaturan. Voucher gratis tidak memberi stempel dan tidak dapat dipakai dua kali. Transaksi batal/refund membatalkan stempel terkait. Tampilkan progres 0/10.
6. **Invoice by WhatsApp link**: terbitkan nomor invoice dan halaman faktur read-only di URL dengan token acak sulit ditebak; tombol 'Kirim via WhatsApp' membuka wa.me dengan pesan yang sudah disiapkan (nama toko, nomor invoice, paket, harga, tautan). Pengiriman tetap dilakukan manual oleh staf, *bukan* auto-send.
7. **Promosi WhatsApp sederhana**: daftar pelanggan yang **memberi izin menerima promosi**, pilih satu pelanggan, template promo personal, tombol buka WhatsApp. Jangan implementasi blast massal atau bot nonresmi. Simpan waktu dan sumber persetujuan (opt-in), tombol berhenti berlangganan/opt-out.
8. **Dashboard Owner**: kartu pemasukan, pengeluaran, selisih operasional, jumlah transaksi, pelanggan loyal, dan top paket; tabel transaksi terakhir.
9. **Pengaturan sederhana**: nama usaha, nomor WA usaha, paket/harga, kebijakan voucher.

## C. Form / layar yang dibuat
- **Kasir**: layanan, ukuran motor, nama pelanggan, nomor WA, plat motor, diskon, metode bayar, nominal diterima, status pembayaran, tombol Simpan & Buat Invoice.
- **Kas keluar**: tanggal, kategori, nominal, catatan, penanggung jawab.
- **Pelanggan**: nama, nomor WA, jumlah stempel, voucher tersedia, persetujuan promosi.
- **Kirim WA**: pilih invoice atau promo, preview pesan, tombol 'Buka WhatsApp'.
- **Laporan**: rentang tanggal, ringkasan, rincian, ekspor CSV.

## D. Alur transaksi
Kasir login → pilih paket dan ukuran → pilih/tambah pelanggan → cek nominal → pilih metode bayar → tandai lunas → simpan pesanan → proses cuci → selesai → stempel loyalti masuk → invoice dibuat → staf klik kirim WhatsApp → owner melihat laporan.

## E. Teknologi dan aturan kualitas
- Pilih stack yang paling cepat disiapkan untuk MVP: **Next.js + TypeScript + Tailwind + Supabase** (Auth + PostgreSQL). Jika Supabase belum dihubungkan, buat demo dengan data contoh dan jelaskan bahwa demo belum persisten.
- Responsive desktop & smartphone. Form singkat, navigasi jelas, aksesibilitas keyboard, validasi nominal dan nomor telepon, format rupiah Indonesia.
- Tabel minimum: users, services, customers, orders, order_items, payments, cash_entries, loyalty_events, loyalty_rewards, invoice_tokens, promo_consents.
- Transaksi pembayaran dan perhitungan stempel harus atomik/idempoten; kasir tidak boleh bisa memodifikasi laporan tanpa audit trail.
- Gunakan RLS/otorisasi di server, rahasiakan private keys, invoice hanya menampilkan data secukupnya. Jangan ungkap nomor WA penuh pada URL publik.
- Jangan klaim integrasi payment gateway/WA API otomatis sudah tersedia. QRIS hanya pencatatan manual sampai integrasi resmi disepakati.

## F. Pitch deck 8 slide — naskah untuk calon pemilik usaha
1. Cover: CUCI MOTOR RIZKY — Sistem Kasir & Loyalti Pelanggan.
2. Masalah: pencatatan manual, uang masuk-keluar tidak rapi, pelanggan sulit dipertahankan.
3. Solusi: POS, kas, laporan, loyalti, invoice WhatsApp, promosi sederhana.
4. Demo alur kasir: dari pilih paket hingga invoice dikirim.
5. Loyalty: 10 transaksi berbayar → 1 voucher cuci gratis.
6. Dashboard & laporan: pemilik bisa membaca operasional harian.
7. Manfaat: lebih cepat mencatat, transparan, dan menjaga hubungan pelanggan (tanpa mengklaim angka ROI pasti).
8. Implementasi & CTA: demo, penyesuaian, uji operasional, pelatihan; **harga disesuaikan dengan kebutuhan dan kompleksitas**.

## G. Prospektus model bisnis singkat
- **Produk**: aplikasi kasir untuk satu gerai cuci motor, dapat diadaptasi ke layanan serupa.
- **Target**: usaha cuci motor, detailing, cuci mobil skala kecil; tahap awal satu outlet.
- **Nilai**: digitalisasi transaksi, catatan kas, retensi pelanggan, komunikasi terstruktur.
- **Monetisasi developer**: biaya pembuatan/setup satu kali; dukungan/hosting opsional bulanan; custom fitur berdasarkan permintaan. **Tidak ada harga paket baku.**
- **Biaya yang harus dihitung**: hosting, database, domain, pengembangan, backup, support, pelatihan.
- **Rumus simulasi**: omzet = jumlah transaksi berbayar × rata-rata nilai transaksi; selisih operasional = total pemasukan − pengeluaran tercatat. Biaya voucher dan diskon harus diperhitungkan; jangan mengarang trafik, jumlah pelanggan, atau profit aktual.
- **Risiko & mitigasi**: salah input kas (audit trail), nomor WA/privasi (opt-in), voucher ganda (aturan sistem), konektivitas internet (penanganan error), keamanan data (auth dan backup).
- **Roadmap**: MVP 1 outlet → uji coba → rapikan laporan → multi-outlet jika dibutuhkan.

## H. Output yang saya minta dari Claude
1. Kode MVP yang dapat dijalankan dengan README instalasi dan data contoh.
2. Halaman UI: dashboard, kasir, pesanan, pelanggan/loyalti, kas masuk-keluar, laporan, pengaturan.
3. Naskah pitch deck 8 slide dan prospektus bisnis 2–3 halaman dalam Markdown; jika memungkinkan tambahkan tampilan web print-friendly.
4. Checklist pengujian untuk kasir, pendapatan, voucher loyalti, invoice link, WhatsApp opt-in, dan role akses.

**Mulai dari MVP, jangan menambah fitur rumit (gudang multi-cabang, akuntansi double-entry, bot blast WhatsApp, pembayaran otomatis, atau AI) tanpa diminta.**
