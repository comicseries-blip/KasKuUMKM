import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Ringkasan from './components/Ringkasan.jsx'
import FormTransaksi from './components/FormTransaksi.jsx'
import DaftarTransaksi from './components/DaftarTransaksi.jsx'
import GrafikKategori from './components/GrafikKategori.jsx'
import { ambilBulan, buatCSV, dataContoh, hitungRingkasan, namaBulan } from './utils.js'
import AuthScreen from './components/AuthScreen.jsx'
import { clearTransactions, cloudConfigured, deleteTransaction, getAccountSettings, getTransactions, readSession, saveAccountSettings, signOut, upsertTransaction } from './lib/cloud.js'

const KUNCI_PENYIMPANAN = 'kasku-umkm-transaksi'
const KUNCI_SALDO_AWAL = 'kasku-umkm-saldo-awal'

// Membaca data dari localStorage; bila kosong/rusak, pakai data contoh
function muatData() {
  try {
    const simpan = localStorage.getItem(KUNCI_PENYIMPANAN)
    if (simpan) {
      const data = JSON.parse(simpan)
      if (Array.isArray(data)) return data
    }
  } catch {
    // data rusak -> abaikan, pakai data contoh
  }
  return dataContoh()
}

function Dashboard({ session, cloudMode, onLogout }) {
  // ----- STATE UTAMA -----
  const [transaksi, setTransaksi] = useState(() => cloudMode ? [] : muatData())
  const [sedangDiedit, setSedangDiedit] = useState(null) // transaksi yg diedit (atau null)
  const [filterJenis, setFilterJenis] = useState('semua')
  const [filterBulan, setFilterBulan] = useState('semua')
  const [filterTahun, setFilterTahun] = useState('semua')
  const [kataKunci, setKataKunci] = useState('')
  const [konfirmasi, setKonfirmasi] = useState(null) // {pesan, aksi} untuk dialog konfirmasi
  const [notif, setNotif] = useState('') // pesan singkat (toast)
  const [temaGelap, setTemaGelap] = useState(() => localStorage.getItem('kasku-umkm-tema') === 'dark')
  const [cloudReady, setCloudReady] = useState(!cloudMode)
  const [cloudLoadError, setCloudLoadError] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [saldoAwal, setSaldoAwal] = useState(() => {
    try { return Number(localStorage.getItem(cloudMode && session ? `${KUNCI_SALDO_AWAL}:${session.user.id}` : KUNCI_SALDO_AWAL) || 0) } catch { return 0 }
  })
  const [inputSaldoAwal, setInputSaldoAwal] = useState(() => {
    try { return localStorage.getItem(cloudMode && session ? `${KUNCI_SALDO_AWAL}:${session.user.id}` : KUNCI_SALDO_AWAL) || '0' } catch { return '0' }
  })
  const [menyimpanSaldo, setMenyimpanSaldo] = useState(false)

  // Ambil transaksi akun dari database setelah login; data contoh tidak dikirim ke cloud.
  useEffect(() => {
    if (!cloudMode || !session) return
    let aktif = true
    Promise.all([getTransactions(session), getAccountSettings(session)]).then(([data, settings]) => {
      if (!aktif) return
      setCloudLoadError(false)
      setTransaksi(data)
      setSaldoAwal(settings.saldoAwal)
      setInputSaldoAwal(String(settings.saldoAwal))
      localStorage.setItem(`${KUNCI_PENYIMPANAN}:${session.user.id}`, JSON.stringify(data))
      localStorage.setItem(`${KUNCI_SALDO_AWAL}:${session.user.id}`, String(settings.saldoAwal))
    }).catch((err) => { if (aktif) { setCloudLoadError(true); setTransaksi([]); tampilNotif(`Gagal memuat data akun: ${err.message}`) } })
      .finally(() => { if (aktif) setCloudReady(true) })
    return () => { aktif = false }
  }, [cloudMode, session])

  useEffect(() => {
    const handler = (event) => { event.preventDefault(); setInstallPrompt(event) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Tampilkan pesan singkat selama 2,5 detik
  function tampilNotif(pesan) {
    setNotif(pesan)
    setTimeout(() => setNotif(''), 2500)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = temaGelap ? 'dark' : 'light'
    localStorage.setItem('kasku-umkm-tema', temaGelap ? 'dark' : 'light')
  }, [temaGelap])

  // Simpan otomatis setiap kali data berubah
  useEffect(() => {
    try {
      localStorage.setItem(cloudMode && session ? `${KUNCI_PENYIMPANAN}:${session.user.id}` : KUNCI_PENYIMPANAN, JSON.stringify(transaksi))
    } catch {
      // penyimpanan penuh/diblokir -> aplikasi tetap jalan tanpa penyimpanan
    }
  }, [transaksi])

  useEffect(() => {
    const key = cloudMode && session ? `${KUNCI_SALDO_AWAL}:${session.user.id}` : KUNCI_SALDO_AWAL
    try { localStorage.setItem(key, String(saldoAwal)) } catch { /* storage may be unavailable */ }
  }, [saldoAwal, cloudMode, session])

  async function simpanSaldoAwal(event) {
    event.preventDefault()
    const nilai = Number(inputSaldoAwal)
    if (!Number.isFinite(nilai) || nilai < 0 || !Number.isInteger(nilai)) {
      tampilNotif('Saldo awal harus berupa angka bulat nol atau lebih.')
      return
    }
    setMenyimpanSaldo(true)
    try {
      if (cloudMode && session) await saveAccountSettings(nilai, session)
      setSaldoAwal(nilai)
      setInputSaldoAwal(String(nilai))
      tampilNotif('Saldo awal berhasil disimpan.')
    } catch (err) {
      tampilNotif(`Saldo awal gagal disimpan: ${err.message}`)
    } finally {
      setMenyimpanSaldo(false)
    }
  }

  // ----- AKSI (CRUD) -----
  async function simpanTransaksi(data) {
    const dataSimpan = data.id ? { ...data, id: String(data.id) } : {
      ...data,
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }
    if (cloudMode && session) {
      try { await upsertTransaction(dataSimpan, session) }
      catch (err) { tampilNotif(`Gagal menyimpan ke cloud: ${err.message}`); return false }
    }
    setTransaksi((lama) => data.id
      ? lama.map((t) => (String(t.id) === String(data.id) ? dataSimpan : t))
      : [...lama, dataSimpan])
    setSedangDiedit(null)
    return true
  }

  // Hapus dan reset meminta konfirmasi lewat dialog di dalam halaman
  function hapusTransaksi(id) {
    setKonfirmasi({
      pesan: 'Hapus transaksi ini?',
      tombol: 'Hapus',
      aksi: async () => {
        try {
          if (cloudMode && session) await deleteTransaction(id, session)
          setTransaksi((lama) => lama.filter((t) => String(t.id) !== String(id)))
          if (sedangDiedit && String(sedangDiedit.id) === String(id)) setSedangDiedit(null)
          tampilNotif('Transaksi berhasil dihapus.')
        } catch (err) {
          tampilNotif(`Gagal menghapus transaksi: ${err.message}`)
        }
      },
    })
  }

  function resetData() {
    setKonfirmasi({
      pesan: cloudMode ? 'Hapus seluruh transaksi pada akun online ini? Tindakan ini tidak dapat dibatalkan.' : 'Kembalikan transaksi lokal ke data contoh? Saldo awal tidak berubah.',
      tombol: 'Reset',
      aksi: () => {
        if (cloudMode && session) {
          clearTransactions(session).then(() => { setTransaksi([]); tampilNotif('Transaksi online berhasil dihapus.') }).catch((err) => tampilNotif(`Gagal menghapus data: ${err.message}`))
        } else setTransaksi(dataContoh())
        setSedangDiedit(null)
      },
    })
  }

  function unduhCSV() {
    if (tampil.length === 0) return tampilNotif('Tidak ada transaksi untuk diekspor.')
    const blob = new Blob(['\ufeff', buatCSV(tampil)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-kasku-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    tampilNotif('Laporan CSV berhasil diunduh.')
  }

  // Salin laporan (sesuai filter) sebagai teks CSV ke clipboard
  async function salinCSV() {
    const teks = buatCSV(tampil)
    try {
      await navigator.clipboard.writeText(teks)
      tampilNotif('Laporan CSV disalin. Tempel di Excel atau Google Sheets.')
    } catch {
      tampilNotif('Gagal menyalin. Izinkan akses clipboard pada browser.')
    }
  }

  // ----- DATA TURUNAN -----
  // Daftar bulan yang ada di data, untuk pilihan filter
  const daftarBulan = useMemo(() => {
    const set = new Set(transaksi.map((t) => ambilBulan(t.tanggal)))
    return [...set].sort().reverse()
  }, [transaksi])
  const daftarTahun = useMemo(() => [...new Set(transaksi.map((t) => t.tanggal.slice(0, 4)))].sort().reverse(), [transaksi])

  // Transaksi setelah difilter & diurutkan (terbaru di atas)
  const tampil = useMemo(() => {
    const kunci = kataKunci.trim().toLowerCase()
    return transaksi
      .filter((t) => filterJenis === 'semua' || t.jenis === filterJenis)
      .filter((t) => filterBulan === 'semua' || ambilBulan(t.tanggal) === filterBulan)
      .filter((t) => filterTahun === 'semua' || t.tanggal.slice(0, 4) === filterTahun)
      .filter(
        (t) =>
          !kunci ||
          t.keterangan.toLowerCase().includes(kunci) ||
          t.kategori.toLowerCase().includes(kunci),
      )
      .sort((a, b) => {
        const bedaTanggal = b.tanggal.localeCompare(a.tanggal)
        if (bedaTanggal) return bedaTanggal
        const idA = Number(a.id), idB = Number(b.id)
        return Number.isFinite(idA) && Number.isFinite(idB) ? idB - idA : String(b.id).localeCompare(String(a.id))
      })
  }, [transaksi, filterJenis, filterBulan, filterTahun, kataKunci])

  // Ringkasan dihitung dari transaksi yang tampil (mengikuti filter bulan)
  const ringkasanData = useMemo(
    () => hitungRingkasan(transaksi, saldoAwal, filterBulan, filterTahun),
    [transaksi, saldoAwal, filterBulan, filterTahun],
  )

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">K</div>
          <div>
            <p className="eyebrow">MANAJEMEN KEUANGAN USAHA</p>
            <h1>KasKu <span>UMKM</span></h1>
            <p className="subjudul">Semua arus kas usaha, dalam satu tempat.</p>
          </div>
        </div>
        <div className="header-aksi">
          {cloudMode && <span className="account-chip">☁ {session?.user?.email}</span>}
          {cloudMode && <button className="tombol tombol-garis" onClick={onLogout}>Keluar</button>}
          <button className="tombol tombol-garis" onClick={() => setTemaGelap((v) => !v)} aria-label="Ganti tema">
            {temaGelap ? '☀️ Tema terang' : '🌙 Tema gelap'}
          </button>
          <button className="tombol tombol-garis" onClick={salinCSV} disabled={tampil.length === 0} title="Salin agar bisa ditempel ke Excel">
            ⧉ Salin CSV
          </button>
          <button className="tombol tombol-utama" onClick={unduhCSV} disabled={tampil.length === 0}>
            ↓ Ekspor laporan
          </button>
          <button className="tombol tombol-garis" onClick={resetData} title="Kembalikan aplikasi ke data contoh">
            ↺ Reset
          </button>
        </div>
      </header>

      {cloudMode && <div className="mode-banner cloud-banner">☁ Mode online {cloudReady ? (cloudLoadError ? 'belum siap — gagal memuat data' : 'terhubung') : 'sedang memuat data'} — {cloudLoadError ? 'periksa konfigurasi Supabase, tabel, kebijakan RLS, dan koneksi.' : 'transaksi disimpan pada akun Anda setelah server mengonfirmasi.'}</div>}
      {!cloudMode && <div className="mode-banner">ℹ Mode demonstrasi lokal: data tersimpan di browser ini saja. Isi konfigurasi Supabase untuk mengaktifkan login dan sinkronisasi antarperangkat.</div>}
      {installPrompt && <div className="mode-banner install-banner">Pasang KasKu di perangkat Anda <button className="tombol tombol-utama" onClick={async () => { await installPrompt.prompt(); setInstallPrompt(null) }}>Pasang aplikasi</button></div>}
      <section className="sambutan">
        <div>
          <span className="status-pill"><span className="status-dot" /> Dashboard keuangan</span>
          <h2>Ringkasan usaha Anda</h2>
          <p>Pantau pemasukan, kendalikan pengeluaran, dan ambil keputusan dengan lebih percaya diri.</p>
        </div>
        <div className="periode-box">
          <span>PERIODE LAPORAN</span>
          <strong>{filterBulan !== 'semua' ? namaBulan(filterBulan) : filterTahun !== 'semua' ? `Tahun ${filterTahun}` : 'Semua waktu'}</strong>
          <small>{transaksi.length} transaksi tercatat</small>
        </div>
      </section>

      <main>
        <Ringkasan masuk={ringkasanData.masuk} keluar={ringkasanData.keluar} saldo={ringkasanData.saldo} />

        <section className="kartu saldo-awal-panel">
          <div className="panel-heading">
            <div className="panel-icon">Rp</div>
            <div><h2>Saldo awal usaha</h2><p>Modal atau saldo yang sudah tersedia sebelum transaksi dicatat.</p></div>
          </div>
          <form className="saldo-awal-form" onSubmit={simpanSaldoAwal}>
            <label htmlFor="saldo-awal">Saldo awal (Rupiah)</label>
            <div className="saldo-awal-controls">
              <input id="saldo-awal" type="number" min="0" step="1" inputMode="numeric" value={inputSaldoAwal} onChange={(e) => setInputSaldoAwal(e.target.value)} required />
              <button className="tombol tombol-utama" type="submit" disabled={menyimpanSaldo || (cloudMode && !cloudReady)}>{menyimpanSaldo ? 'Menyimpan…' : 'Simpan saldo awal'}</button>
            </div>
            <small>Saldo awal saat ini: <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(saldoAwal)}</strong>. {cloudMode ? 'Tersimpan pada akun online setelah berhasil disimpan.' : 'Tersimpan di browser ini saja.'}</small>
          </form>
        </section>

        <div className="kolom">
          <section className="kartu panel-form">
            <div className="panel-heading">
              <div className="panel-icon">＋</div>
              <div>
                <h2>{sedangDiedit ? 'Edit transaksi' : 'Catat transaksi baru'}</h2>
                <p>{sedangDiedit ? 'Perbarui detail transaksi di bawah.' : 'Masukkan pemasukan atau pengeluaran usaha.'}</p>
              </div>
            </div>
            <FormTransaksi
              key={sedangDiedit ? sedangDiedit.id : 'baru'}
              awal={sedangDiedit}
              onSimpan={async (data) => {
                const berhasil = await simpanTransaksi(data)
                if (berhasil) tampilNotif(data.id ? 'Perubahan transaksi disimpan.' : 'Transaksi berhasil ditambahkan.')
                return berhasil
              }}
              onBatal={() => setSedangDiedit(null)}
            />
          </section>

          <section className="kartu panel-grafik">
            <div className="panel-heading">
              <div className="panel-icon grafik-icon">▥</div>
              <div>
                <h2>Pengeluaran per kategori</h2>
                <p>Ketahui pos biaya terbesar pada periode ini.</p>
              </div>
            </div>
            <GrafikKategori transaksi={ringkasanData.dasar} />
          </section>
        </div>

        <section className="kartu panel-riwayat">
          <div className="riwayat-heading">
            <div className="panel-heading">
              <div className="panel-icon riwayat-icon">↔</div>
              <div>
                <h2>Riwayat transaksi</h2>
                <p>Telusuri, saring, atau kelola catatan keuangan Anda.</p>
              </div>
            </div>
            <span className="jumlah-data">{tampil.length} data ditampilkan</span>
          </div>
          <div className="filter">
            <input
              type="search"
              placeholder="⌕  Cari keterangan atau kategori..."
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              aria-label="Cari transaksi"
            />
            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} aria-label="Filter jenis">
              <option value="semua">Semua jenis</option>
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </select>
            <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} aria-label="Filter bulan">
              <option value="semua">Semua bulan</option>
              {daftarBulan.map((b) => (
                <option key={b} value={b}>{namaBulan(b)}</option>
              ))}
            </select>
            <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} aria-label="Filter tahun">
              <option value="semua">Semua tahun</option>
              {daftarTahun.map((tahun) => <option key={tahun} value={tahun}>{tahun}</option>)}
            </select>
          </div>
          <DaftarTransaksi data={tampil} onEdit={setSedangDiedit} onHapus={hapusTransaksi} />
        </section>
      </main>

      {konfirmasi && (
        <div className="lapisan" role="dialog" aria-modal="true" aria-label="Konfirmasi">
          <div className="dialog">
            <div className="dialog-symbol">!</div>
            <h2>Konfirmasi tindakan</h2>
            <p>{konfirmasi.pesan}</p>
            <div className="form-aksi">
              <button className="tombol tombol-garis" onClick={() => setKonfirmasi(null)}>Batal</button>
              <button className="tombol tombol-bahaya" onClick={() => { konfirmasi.aksi(); setKonfirmasi(null) }}>
                {konfirmasi.tombol}
              </button>
            </div>
          </div>
        </div>
      )}

      {notif && <div className="notif" role="status"><span>✓</span>{notif}</div>}

      <footer className="footer">
        <div className="footer-brand"><span className="footer-mark">K</span><strong>KasKu UMKM</strong></div>
        <span>Kelola keuangan dengan lebih terarah.</span>
        <span className="footer-version">Versi 3.1 · {cloudMode ? 'Sinkronisasi akun online' : 'Mode lokal / demonstrasi'}</span>
      </footer>
    </div>
  )
}


export default function App() {
  const [session, setSession] = useState(() => readSession())
  const [sessionChecked, setSessionChecked] = useState(false)
  useEffect(() => { setSessionChecked(true) }, [])
  function logout() { signOut(); setSession(null) }
  if (cloudConfigured && session && !sessionChecked) return <div className="loading-screen">Memuat KasKu UMKM…</div>
  if (cloudConfigured && !session) return <AuthScreen onAuthenticated={(nextSession) => setSession(nextSession)} />
  return <Dashboard session={session} cloudMode={cloudConfigured} onLogout={logout} />
}
