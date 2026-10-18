import { formatRupiah, formatTanggal } from '../utils.js'

// Daftar riwayat transaksi + tombol edit/hapus
export default function DaftarTransaksi({ data, onEdit, onHapus }) {
  if (data.length === 0) {
    return (
      <div className="kosong">
        <p>Belum ada transaksi yang cocok.</p>
        <small>Tambahkan transaksi baru atau ubah filter pencarian.</small>
      </div>
    )
  }

  return (
    <ul className="daftar">
      {data.map((t) => (
        <li key={t.id} className="item">
          <div className={`titik ${t.jenis === 'pemasukan' ? 'masuk' : 'keluar'}`} aria-hidden="true">
            {t.jenis === 'pemasukan' ? '＋' : '－'}
          </div>
          <div className="info">
            <strong>{t.keterangan}</strong>
            <small>
              {formatTanggal(t.tanggal)} · <span className="badge">{t.kategori}</span>
            </small>
          </div>
          <div className={`jumlah ${t.jenis === 'pemasukan' ? 'masuk' : 'keluar'}`}>
            {t.jenis === 'pemasukan' ? '+' : '−'} {formatRupiah(t.nominal)}
          </div>
          <div className="aksi">
            <button className="ikon" onClick={() => onEdit(t)} aria-label={`Edit ${t.keterangan}`} title="Edit">
              ✎
            </button>
            <button className="ikon bahaya" onClick={() => onHapus(t.id)} aria-label={`Hapus ${t.keterangan}`} title="Hapus">
              🗑
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
