# KasKu UMKM — Final Project (React + Vite + PWA)

KasKu UMKM adalah aplikasi pencatatan arus kas sederhana untuk demonstrasi/tugas kuliah. Aplikasi mendukung pencatatan pemasukan dan pengeluaran, kategori, filter, pencarian, grafik, ekspor CSV, tema terang/gelap, PWA, serta integrasi login dan database Supabase yang **harus dikonfigurasi terlebih dahulu**.

## Fitur

- Dashboard ringkasan saldo berjalan, pemasukan, dan pengeluaran.
- Saldo awal usaha dapat diatur terpisah tanpa membuat transaksi pemasukan palsu.
- Tambah, edit, hapus, pencarian, filter jenis, bulan, dan tahun transaksi.
- Grafik pengeluaran per kategori dan ekspor CSV.
- Tampilan responsif untuk desktop dan ponsel.
- PWA manifest, ikon aplikasi, dan service worker untuk cache shell aplikasi.
- Mode lokal/demo saat konfigurasi Supabase belum diisi.
- Login/daftar akun Supabase, permintaan reset kata sandi, dan CRUD transaksi cloud setelah konfigurasi selesai.
- Row Level Security (RLS) di database membatasi transaksi ke pemilik akun.

## Persyaratan

- Node.js 22 atau versi yang kompatibel dengan Vite 8.
- npm.
- Untuk fitur online: project Supabase dan koneksi internet.

## Menjalankan secara lokal

1. Ekstrak ZIP dan buka folder `KasKuUMKM_Final` di VS Code.
2. Buka terminal di folder proyek.
3. Jalankan `npm install`.
4. Jalankan `npm run dev`.
5. Buka alamat lokal yang ditampilkan Vite.

Jika Supabase belum disetel, aplikasi berjalan dalam mode demo lokal dan menampilkan pemberitahuan bahwa data hanya disimpan pada browser/perangkat tersebut.

## Mengaktifkan login dan database online

1. Buat project di [Supabase](https://supabase.com/).
2. Di Supabase, buka **Project Settings → API** (atau halaman API Keys pada dashboard baru). Salin Project URL dan publishable/anon key. Jangan pernah memasukkan `service_role` key ke aplikasi frontend.
3. Salin `.env.example` menjadi `.env`. Di Windows, pastikan nama file benar-benar `.env`, bukan `.env.txt`.
4. Isi `.env`:

   ```env
   VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

5. Buka **SQL Editor** di Supabase dan jalankan seluruh isi file `supabase-schema.sql`. Skrip membuat tabel `transactions` dan `user_settings`, mengaktifkan RLS, serta membuat kebijakan akses per pengguna. Jika tabel lama sudah ada, skrip juga menambahkan kolom/pembatas yang diperlukan; tinjau hasil eksekusi SQL sebelum dipakai.
6. Periksa **Authentication → Providers → Email**. Pilih pengaturan konfirmasi email sesuai kebutuhan demo. Jika konfirmasi email diaktifkan, pengguna harus mengonfirmasi email sebelum bisa masuk. Tambahkan URL hosting aplikasi pada **Authentication → URL Configuration → Redirect URLs** agar tautan reset kata sandi bisa kembali ke aplikasi.
7. Hentikan lalu jalankan ulang `npm run dev` agar environment variable terbaca.
8. Daftar akun baru. Setelah login, transaksi baru disimpan ke database dan dimuat kembali saat pengguna masuk di perangkat lain.

**Penting:** integrasi cloud belum aktif sampai URL, key, tabel, dan kebijakan Supabase milik Anda sudah dikonfigurasi. Jangan bagikan key rahasia atau kata sandi. Publishable/anon key memang digunakan pada frontend, tetapi keamanan tetap bergantung pada RLS.

## Build dan deploy

```bash
npm run build
npm run preview
```

Deploy folder `dist` ke hosting statis yang mendukung HTTPS (misalnya Netlify, Vercel, atau hosting kampus). Atur variabel environment yang sama di pengaturan hosting sebelum build. PWA dan service worker memerlukan HTTPS saat dipakai online, kecuali localhost.

### Pasang di perangkat

- **Android (Chrome):** buka URL HTTPS, pilih menu browser lalu **Install app / Tambahkan ke layar utama**.
- **iPhone (Safari):** buka URL HTTPS → tombol **Bagikan** → **Add to Home Screen / Tambahkan ke Layar Utama**.

Dukungan prompt instalasi otomatis berbeda menurut browser. Pada iPhone, instalasi biasanya dilakukan melalui menu Bagikan.

## Struktur penting

- `src/App.jsx` — dashboard dan alur transaksi.
- `src/components/AuthScreen.jsx` — halaman masuk/daftar.
- `src/lib/cloud.js` — integrasi Auth dan REST API Supabase tanpa SDK tambahan.
- `supabase-schema.sql` — skema tabel dan RLS.
- `public/manifest.webmanifest` — metadata PWA.
- `public/sw.js` — cache aplikasi dasar untuk kunjungan berikutnya.
- `.env.example` — contoh konfigurasi (bukan kredensial aktif).

## Batasan demo yang perlu diketahui

- Belum ada pemulihan kata sandi, verifikasi email kustom, atau manajemen multi-usaha.
- Cache offline menyediakan shell aplikasi untuk dibuka kembali, tetapi operasi database/login memerlukan koneksi internet. Transaksi offline tidak masuk antrean sinkronisasi.
- Mode demo lokal tidak menyinkronkan data antar browser/perangkat.
- Build dan unit test: jalankan `npm test`, lalu `npm run build`.
- Sebelum dipakai untuk transaksi bisnis sungguhan, lakukan pengujian keamanan, backup, validasi data, dan uji alur login/CRUD pada project Supabase milik Anda. Jangan pernah memasukkan `service_role` key ke frontend atau mengunggah file `.env` ke repositori publik.

## Perubahan pada versi penyempurnaan

- Saldo awal disimpan sebagai pengaturan terpisah; saldo berjalan dihitung dari saldo awal + seluruh pemasukan − seluruh pengeluaran. Filter bulan/tahun memengaruhi total pemasukan/pengeluaran laporan, bukan saldo berjalan.
- Perubahan transaksi cloud diterapkan ke tampilan setelah database berhasil menyimpan/menghapus, untuk menghindari tampilan seolah berhasil saat permintaan gagal.
- Token sesi diperbarui saat API mengembalikan 401 jika refresh token masih valid.
- Ekspor CSV melakukan escaping sel dan menambahkan proteksi dasar terhadap formula injection.
- PWA memakai cache versi baru, mencoba jaringan dahulu untuk navigasi, serta menyertakan ikon PNG 192/512 untuk kompatibilitas instalasi yang lebih luas.
- Unit test `node --test` memeriksa saldo, filter periode, helper tanggal, dan ekspor CSV.
