import { formatRupiah } from '../utils.js'

// Grafik batang sederhana (hanya CSS) untuk pengeluaran per kategori
export default function GrafikKategori({ transaksi }) {
  // Jumlahkan pengeluaran per kategori
  const total = {}
  transaksi
    .filter((t) => t.jenis === 'pengeluaran')
    .forEach((t) => {
      total[t.kategori] = (total[t.kategori] || 0) + t.nominal
    })

  const baris = Object.entries(total).sort((a, b) => b[1] - a[1])
  const terbesar = baris.length ? baris[0][1] : 0

  if (baris.length === 0) {
    return (
      <div className="kosong">
        <p>Belum ada pengeluaran.</p>
        <small>Grafik muncul setelah Anda mencatat pengeluaran.</small>
      </div>
    )
  }

  return (
    <ul className="grafik">
      {baris.map(([kategori, jumlah]) => (
        <li key={kategori}>
          <div className="grafik-label">
            <span>{kategori}</span>
            <strong>{formatRupiah(jumlah)}</strong>
          </div>
          <div className="batang">
            <div className="isi" style={{ width: `${(jumlah / terbesar) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
