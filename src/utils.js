// ===== Fungsi bantu (helper) =====

// Daftar kategori untuk tiap jenis transaksi
export const KATEGORI = {
  pemasukan: ['Penjualan', 'Jasa', 'Modal Awal', 'Lainnya'],
  pengeluaran: ['Bahan Baku', 'Gaji', 'Listrik & Air', 'Sewa', 'Transport', 'Pemasaran', 'Lainnya'],
}

// Format angka menjadi Rupiah, contoh: 15000 -> "Rp 15.000"
export function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(angka)
}

// Format tanggal "2026-10-17" -> "17 Okt 2026"
export function formatTanggal(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Tanggal hari ini dalam format YYYY-MM-DD (waktu lokal, bukan UTC)
export function hariIni() {
  const t = new Date()
  const bulan = String(t.getMonth() + 1).padStart(2, '0')
  const hari = String(t.getDate()).padStart(2, '0')
  return `${t.getFullYear()}-${bulan}-${hari}`
}

// Ambil "YYYY-MM" dari tanggal, dipakai untuk filter bulan
export function ambilBulan(iso) {
  return iso.slice(0, 7)
}

// Nama bulan dari "YYYY-MM" -> "Oktober 2026"

// Ringkasan periode: pemasukan/pengeluaran mengikuti filter, saldo adalah saldo berjalan semua waktu.
export function hitungRingkasan(transaksi, saldoAwal = 0, filterBulan = 'semua', filterTahun = 'semua') {
  const dasar = transaksi.filter((t) =>
    (filterBulan === 'semua' || ambilBulan(t.tanggal) === filterBulan) &&
    (filterTahun === 'semua' || t.tanggal.slice(0, 4) === filterTahun),
  )
  const jumlah = (daftar, jenis) => daftar
    .filter((t) => t.jenis === jenis)
    .reduce((total, t) => total + Number(t.nominal || 0), 0)
  const masuk = jumlah(dasar, 'pemasukan')
  const keluar = jumlah(dasar, 'pengeluaran')
  const saldoBerjalan = Number(saldoAwal || 0) + jumlah(transaksi, 'pemasukan') - jumlah(transaksi, 'pengeluaran')
  return { masuk, keluar, saldo: saldoBerjalan, dasar }
}

export function namaBulan(ym) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

// Ubah daftar transaksi menjadi teks CSV (bisa ditempel ke Excel / Google Sheets)
export function buatCSV(daftar) {
  const header = ['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal']
  const escapeCell = (nilai) => {
    let teks = String(nilai ?? '')
    // Cegah CSV formula injection saat file dibuka di spreadsheet.
    if (/^[=+@\-\t\r]/.test(teks)) teks = `'${teks}`
    if (/[",\n\r]/.test(teks)) teks = `"${teks.replace(/"/g, '""')}"`
    return teks
  }
  const baris = daftar.map((t) => [t.tanggal, t.jenis, t.kategori, t.keterangan, t.nominal])
  return [header, ...baris].map((barisData) => barisData.map(escapeCell).join(',')).join('\n')
}

// Data contoh supaya aplikasi tidak kosong saat pertama dibuka
export function dataContoh() {
  const t = new Date()
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  return [
    { id: 2, tanggal: `${y}-${m}-02`, jenis: 'pengeluaran', kategori: 'Bahan Baku', keterangan: 'Belanja tepung & gula', nominal: 450000 },
    { id: 3, tanggal: `${y}-${m}-03`, jenis: 'pemasukan', kategori: 'Penjualan', keterangan: 'Penjualan kue hari Sabtu', nominal: 850000 },
    { id: 4, tanggal: `${y}-${m}-05`, jenis: 'pengeluaran', kategori: 'Transport', keterangan: 'Bensin pengantaran', nominal: 60000 },
    { id: 5, tanggal: `${y}-${m}-07`, jenis: 'pemasukan', kategori: 'Penjualan', keterangan: 'Pesanan katering kantor', nominal: 1200000 },
  ]
}
