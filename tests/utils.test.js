import test from 'node:test'
import assert from 'node:assert/strict'
import { buatCSV, hitungRingkasan, ambilBulan, formatTanggal } from '../src/utils.js'

const data = [
  { id: 'a', tanggal: '2026-01-02', jenis: 'pemasukan', kategori: 'Penjualan', keterangan: 'Jualan', nominal: 100000 },
  { id: 'b', tanggal: '2026-01-03', jenis: 'pengeluaran', kategori: 'Bahan', keterangan: 'Beli bahan', nominal: 25000 },
  { id: 'c', tanggal: '2025-12-31', jenis: 'pemasukan', kategori: 'Jasa', keterangan: 'Jasa', nominal: 50000 },
]

test('saldo berjalan memasukkan saldo awal dan semua transaksi', () => {
  assert.equal(hitungRingkasan(data, 200000).saldo, 325000)
})

test('pemasukan dan pengeluaran mengikuti filter bulan', () => {
  const r = hitungRingkasan(data, 0, '2026-01', 'semua')
  assert.equal(r.masuk, 100000)
  assert.equal(r.keluar, 25000)
  assert.equal(r.dasar.length, 2)
})

test('filter tahun dapat membuat laporan tahunan', () => {
  const r = hitungRingkasan(data, 0, 'semua', '2025')
  assert.equal(r.masuk, 50000)
  assert.equal(r.dasar.length, 1)
})

test('helper tanggal mengambil bulan dan memformat tanggal lokal', () => {
  assert.equal(ambilBulan('2026-10-17'), '2026-10')
  assert.match(formatTanggal('2026-10-17'), /17/)
})

test('CSV mengutip pemisah dan mencegah formula injection', () => {
  const csv = buatCSV([{ tanggal: '2026-01-01', jenis: 'pemasukan', kategori: 'Lainnya', keterangan: '=HYPERLINK("x")', nominal: 1 }])
  assert.match(csv, /'=HYPERLINK/)
  assert.match(csv, /"'=HYPERLINK\(""x""\)"/)
})
