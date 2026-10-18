# Panduan Penggunaan KasKu UMKM

## A. Menjalankan demo di komputer

1. Ekstrak ZIP proyek.
2. Instal Node.js versi 22.12 atau lebih baru (disarankan Node.js 22 LTS).
3. Buka folder `KasKuUMKM_Final` di VS Code.
4. Buka terminal di folder yang berisi `package.json`.
5. Jalankan `npm install` dan tunggu sampai selesai.
6. Jalankan `npm test` untuk menguji helper perhitungan dan CSV.
7. Jalankan `npm run dev`, lalu buka alamat lokal yang dicetak Vite.

Tanpa konfigurasi Supabase, aplikasi memakai data contoh lokal. Data lokal hanya ada di browser/perangkat yang sama dan tidak otomatis berpindah perangkat. Tombol Reset pada mode lokal mengembalikan transaksi ke data contoh.

## B. Mengatur saldo awal

1. Buka bagian **Saldo awal usaha**.
2. Masukkan saldo yang sudah tersedia sebelum transaksi yang tercatat di aplikasi, misalnya `1000000`.
3. Tekan **Simpan saldo awal**.
4. Saldo berjalan dihitung dengan rumus:

   `Saldo awal + total pemasukan seluruh waktu - total pengeluaran seluruh waktu`

Saldo awal bukan transaksi pemasukan, jadi tidak akan membuat angka pemasukan laporan menjadi lebih besar. Jika Anda menggunakan data contoh, ingat bahwa transaksi contoh tetap ikut dihitung; hapus atau ubah transaksi contoh bila tidak mewakili usaha Anda.

## C. Membuat database dan login online

1. Buat project di Supabase.
2. Salin `.env.example` menjadi `.env`.
3. Isi `VITE_SUPABASE_URL` dengan Project URL dan `VITE_SUPABASE_ANON_KEY` dengan publishable/anon key milik project. Jangan gunakan `service_role` key.
4. Di Supabase, buka SQL Editor lalu jalankan seluruh isi `supabase-schema.sql`.
5. Pada Authentication, tentukan apakah konfirmasi email diperlukan.
6. Tambahkan URL aplikasi yang sudah di-deploy ke daftar Redirect URLs supaya reset kata sandi bisa kembali ke aplikasi.
7. Hentikan server dev lalu jalankan kembali `npm run dev`.
8. Buat akun melalui tab **Buat akun**. Jika konfirmasi email diaktifkan, buka email dan konfirmasi terlebih dahulu.
9. Setelah login, atur saldo awal dan mulai catat transaksi.

Setiap akun hanya boleh mengakses baris miliknya sendiri melalui kebijakan Row Level Security (RLS). Uji dengan dua akun berbeda sebelum demonstrasi. Jangan publikasikan file `.env` atau kredensial rahasia.

## D. Laporan

- Gunakan filter jenis untuk melihat pemasukan/pengeluaran.
- Gunakan filter bulan dan/atau tahun untuk laporan periode tertentu.
- Tombol **Ekspor laporan** mengunduh transaksi yang sedang ditampilkan sebagai CSV.
- CSV dapat dibuka di Excel atau Google Sheets. Nilai keterangan yang berpotensi dianggap formula spreadsheet diberi awalan proteksi.
- Kartu **Saldo berjalan** selalu menunjukkan saldo saat ini dari semua transaksi, meskipun filter laporan memilih bulan atau tahun tertentu.

## E. Memasang PWA di HP

Aplikasi perlu di-deploy ke hosting yang memakai HTTPS terlebih dahulu.

- Android: buka URL HTTPS di Chrome, buka menu browser, lalu pilih **Install app / Tambahkan ke layar utama**.
- iPhone: buka URL HTTPS di Safari, tekan **Bagikan**, lalu **Add to Home Screen / Tambahkan ke Layar Utama**.

Service worker menyimpan shell aplikasi untuk membantu membuka kembali halaman saat offline. Login, membaca/menyimpan transaksi, dan sinkronisasi tetap memerlukan internet; transaksi offline belum disimpan dalam antrean.

## F. Pengujian sebelum presentasi

Jalankan:

```bash
npm test
npm run build
npm run preview
```

Checklist manual:

- [ ] Saldo awal dapat disimpan dan memengaruhi saldo berjalan.
- [ ] Pemasukan menaikkan saldo; pengeluaran menurunkan saldo.
- [ ] Edit transaksi memperbarui catatan yang tepat.
- [ ] Hapus transaksi hanya menghapus setelah konfirmasi.
- [ ] Filter bulan/tahun mengubah angka pemasukan/pengeluaran laporan.
- [ ] Ekspor CSV bisa dibuka di spreadsheet.
- [ ] Akun A tidak bisa melihat transaksi akun B.
- [ ] Data online tetap tersedia setelah login di browser/perangkat lain.
- [ ] PWA dapat dipasang melalui HTTPS di perangkat target.

Untuk tugas kuliah, jelaskan dengan jujur fitur mana yang sudah diuji lokal dan fitur online mana yang baru dapat diuji setelah Supabase milik Anda dikonfigurasi.
