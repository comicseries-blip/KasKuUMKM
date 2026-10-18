import { formatRupiah } from '../utils.js'

// Tiga kartu ringkasan: saldo, total pemasukan, total pengeluaran
export default function Ringkasan({ masuk, keluar, saldo }) {
  return (
    <div className="ringkasan">
      <div className="kartu ringkasan-item saldo">
        <span className="label">Saldo berjalan</span>
        <strong className={saldo < 0 ? 'negatif' : ''}>{formatRupiah(saldo)}</strong>
      </div>
      <div className="kartu ringkasan-item masuk">
        <span className="label">Pemasukan</span>
        <strong>{formatRupiah(masuk)}</strong>
      </div>
      <div className="kartu ringkasan-item keluar">
        <span className="label">Pengeluaran</span>
        <strong>{formatRupiah(keluar)}</strong>
      </div>
    </div>
  )
}
