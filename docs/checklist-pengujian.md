# Checklist Pengujian — MVP Kasir CUCI MOTOR RIZKY

Jalankan di HP dan desktop. Tandai `[x]` jika lolos. Mulai dari **Pengaturan → Reset data demo** agar data awal sama.

## 1. Role & akses
- [ ] Login Kasir (PIN `0000`) → diarahkan ke Kasir; menu Dashboard, Laporan, Pengaturan tidak tampil
- [ ] Kasir membuka `/laporan` atau `/pengaturan` langsung lewat URL → dialihkan ke Kasir
- [ ] Kasir tidak melihat tombol "Batalkan" pada entri kas
- [ ] Login Owner (PIN `1234`) → semua menu tampil
- [ ] PIN salah → pesan "PIN salah", tidak masuk
- [ ] Keluar → kembali ke halaman login, halaman aplikasi tidak bisa diakses

## 2. Kasir (POS)
- [ ] Pilih paket + ukuran → harga sesuai tabel spanduk
- [ ] Diskon tidak bisa melebihi harga; total tidak negatif
- [ ] Tunai lunas: tombol simpan nonaktif jika nominal diterima < total; kembalian benar
- [ ] Nomor WA tidak valid (mis. `12345`) → pesan error, tidak tersimpan
- [ ] Nomor `0812…`, `812…`, `+62812…` dikenali sebagai pelanggan yang sama
- [ ] Simpan → nomor invoice terbit (`INV-YYYYMMDD-xxxx`), panel invoice muncul
- [ ] Transaksi tanpa nama/WA tersimpan sebagai "Umum"
- [ ] Navigasi keyboard (Tab/Enter/Spasi) dapat memilih paket, ukuran, dan menyimpan

## 3. Pendapatan & kas
- [ ] Transaksi **lunas** → 1 entri kas masuk "transaksi" otomatis
- [ ] Transaksi **belum bayar** → tidak ada entri kas; setelah "Tandai lunas" → 1 entri
- [ ] Klik "Tandai lunas" dua kali / refresh → tetap 1 entri (tidak ganda)
- [ ] Batalkan pesanan lunas → entri kas ditandai dibatalkan, status bayar "refund"
- [ ] Batalkan tanpa alasan → ditolak
- [ ] Catat pengeluaran (tanggal, kategori, nominal, catatan, PJ) → muncul di daftar & rekap harian
- [ ] Nominal 0 → ditolak
- [ ] Owner membatalkan entri manual dengan alasan → tercatat di audit trail
- [ ] Selisih operasional = kas masuk − kas keluar pada rentang yang sama

## 4. Laporan
- [ ] Preset Hari ini / 7 hari / Bulan ini / 30 hari dan tanggal kustom bekerja
- [ ] Rekap harian, mingguan, bulanan konsisten dengan total
- [ ] Ekspor CSV transaksi, kas, rekap terbuka benar di Excel (karakter Indonesia aman)
- [ ] Istilah yang dipakai "selisih operasional", bukan "laba bersih"

## 5. Voucher loyalti
- [ ] Transaksi lunas + selesai + pelanggan ber-WA → stempel +1
- [ ] Transaksi selesai tapi belum lunas → belum dapat stempel; setelah lunas → +1
- [ ] Transaksi tanpa WA → tidak dapat stempel
- [ ] Stempel ke-10 → 1 voucher Cuci Kinclong tersedia, progres kembali 0/10
- [ ] Pakai voucher: paket terkunci ke Cuci Kinclong, total Rp0, metode "voucher"
- [ ] Transaksi voucher tidak menambah stempel
- [ ] Voucher yang sudah dipakai tidak muncul lagi (tidak bisa dipakai dua kali)
- [ ] Batalkan transaksi voucher → voucher kembali tersedia
- [ ] Batalkan transaksi berbayar yang sudah memberi stempel → stempel dicabut
- [ ] Owner ubah aturan (mis. 5 stempel) → voucher baru diterbitkan sesuai aturan

## 6. Invoice link
- [ ] Token di URL acak 24 karakter, berbeda tiap transaksi
- [ ] Halaman invoice hanya menampilkan nama depan, plat tersamar, paket, harga, status — **tanpa nomor WA**
- [ ] Link dibuka di perangkat lain → invoice tampil (data dari fragmen URL)
- [ ] Token asal-asalan tanpa data → "Invoice tidak ditemukan"
- [ ] Tombol cetak menghasilkan tampilan rapi (tanpa tombol)
- [ ] "Kirim via WhatsApp" membuka wa.me dengan pesan: nama toko, nomor invoice, paket, harga, tautan
- [ ] Pelanggan tanpa WA → tombol WA nonaktif, salin link tersedia

## 7. WhatsApp opt-in / promosi
- [ ] Tab "Izin promosi" hanya menampilkan pelanggan dengan opt-in aktif
- [ ] Catat opt-in menyimpan waktu dan sumber persetujuan
- [ ] Opt-out → pelanggan hilang dari daftar promo, form promo tidak tampil
- [ ] Template promo terisi `{nama}` dan `{usaha}`; dapat diedit sebelum kirim
- [ ] Hanya satu pelanggan per pengiriman (tidak ada blast massal)

## 8. Responsif & umum
- [ ] Lebar 360px: tidak ada scroll horizontal halaman, navigasi bawah tampil
- [ ] Format rupiah `Rp17.000` konsisten
- [ ] Banner "mode demo" tampil di semua halaman aplikasi
