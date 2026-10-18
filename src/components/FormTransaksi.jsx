import { useState } from 'react'
import { KATEGORI, hariIni } from '../utils.js'

// Form untuk menambah / mengedit transaksi.
// Prop `awal` berisi transaksi yang diedit (null = mode tambah).
export default function FormTransaksi({ awal, onSimpan, onBatal }) {
  const [jenis, setJenis] = useState(awal?.jenis ?? 'pemasukan')
  const [tanggal, setTanggal] = useState(awal?.tanggal ?? hariIni())
  const [kategori, setKategori] = useState(awal?.kategori ?? KATEGORI.pemasukan[0])
  const [keterangan, setKeterangan] = useState(awal?.keterangan ?? '')
  const [nominal, setNominal] = useState(awal ? String(awal.nominal) : '')
  const [error, setError] = useState('')

  // Saat jenis berganti, kategori ikut disesuaikan
  function gantiJenis(j) {
    setJenis(j)
    setKategori(KATEGORI[j][0])
  }

  async function kirim(e) {
    e.preventDefault()
    const angka = Number(nominal)

    // ----- VALIDASI -----
    if (!tanggal) return setError('Tanggal wajib diisi.')
    if (!keterangan.trim()) return setError('Keterangan wajib diisi.')
    if (!nominal || Number.isNaN(angka) || angka <= 0) return setError('Nominal harus angka lebih dari 0.')
    if (!Number.isInteger(angka)) return setError('Nominal harus bilangan bulat (tanpa koma).')

    setError('')
    const berhasil = await onSimpan({
      id: awal?.id, // undefined bila transaksi baru
      tanggal,
      jenis,
      kategori,
      keterangan: keterangan.trim(),
      nominal: angka,
    })

    // Jangan hapus input apabila penyimpanan ke cloud gagal.
    if (berhasil && !awal) {
      setKeterangan('')
      setNominal('')
    }
  }

  return (
    <form onSubmit={kirim} noValidate>
      <div className="pilih-jenis" role="group" aria-label="Jenis transaksi">
        <button
          type="button"
          className={jenis === 'pemasukan' ? 'aktif masuk' : ''}
          onClick={() => gantiJenis('pemasukan')}
        >
          ＋ Pemasukan
        </button>
        <button
          type="button"
          className={jenis === 'pengeluaran' ? 'aktif keluar' : ''}
          onClick={() => gantiJenis('pengeluaran')}
        >
          － Pengeluaran
        </button>
      </div>

      <label>
        Tanggal
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </label>

      <label>
        Kategori
        <select value={kategori} onChange={(e) => setKategori(e.target.value)}>
          {KATEGORI[jenis].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>

      <label>
        Keterangan
        <input
          type="text"
          placeholder="Contoh: Penjualan kue pesanan"
          value={keterangan}
          maxLength={80}
          onChange={(e) => setKeterangan(e.target.value)}
        />
      </label>

      <label>
        Nominal (Rp)
        <input
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          placeholder="50000"
          value={nominal}
          onChange={(e) => setNominal(e.target.value)}
        />
      </label>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="form-aksi">
        <button type="submit" className="tombol tombol-utama">
          {awal ? 'Simpan Perubahan' : 'Tambah Transaksi'}
        </button>
        {awal && (
          <button type="button" className="tombol tombol-garis" onClick={onBatal}>
            Batal
          </button>
        )}
      </div>
    </form>
  )
}
