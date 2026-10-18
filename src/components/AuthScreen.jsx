import { useEffect, useState } from 'react'
import { requestPasswordReset, signIn, signUp, updatePassword } from '../lib/cloud.js'

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [recoveryToken, setRecoveryToken] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    if (params.get('type') === 'recovery' && params.get('access_token')) {
      setRecoveryToken(params.get('access_token'))
      setMode('new-password')
      setInfo('Buat kata sandi baru untuk akun Anda.')
    }
  }, [])

  async function submit(event) {
    event.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    try {
      if (mode === 'reset') {
        await requestPasswordReset(email.trim())
        setInfo('Jika email terdaftar, tautan pemulihan kata sandi akan dikirim. Periksa juga folder spam.')
      } else if (mode === 'new-password') {
        await updatePassword(password, recoveryToken)
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
        setRecoveryToken('')
        setPassword('')
        setMode('login')
        setInfo('Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.')
      } else if (mode === 'login') {
        const session = await signIn(email.trim(), password)
        onAuthenticated(session)
      } else {
        const result = await signUp(email.trim(), password)
        if (result.access_token) onAuthenticated(result)
        else setInfo('Akun berhasil didaftarkan. Periksa email untuk konfirmasi, lalu masuk kembali.')
      }
    } catch (err) {
      setError(err.message || 'Tidak dapat memproses akun. Periksa koneksi dan konfigurasi Supabase.')
    } finally { setBusy(false) }
  }

  return <main className="auth-shell">
    <section className="auth-card">
      <div className="auth-logo">K</div>
      <p className="eyebrow">MANAJEMEN KEUANGAN USAHA</p>
      <h1>KasKu <span>UMKM</span></h1>
      <p className="auth-lead">Catat arus kas usaha dan akses data Anda di perangkat yang berbeda.</p>
      {mode !== 'reset' && mode !== 'new-password' && <div className="auth-tabs">
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setInfo('') }}>Masuk</button>
        <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); setInfo('') }}>Buat akun</button>
      </div>}
      <form onSubmit={submit} className="auth-form">
        {mode !== 'new-password' && <label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" /></label>}
        {mode !== 'reset' && <label>{mode === 'new-password' ? 'Kata sandi baru' : 'Kata sandi'}<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter" /></label>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {info && <p className="auth-info" role="status">{info}</p>}
        <button className="tombol tombol-utama auth-submit" type="submit" disabled={busy}>{busy ? 'Memproses…' : mode === 'login' ? 'Masuk ke KasKu' : mode === 'reset' ? 'Kirim tautan pemulihan' : 'Daftar akun'}</button>
      </form>
      <div className="auth-extra">
        {mode === 'login' ? <button type="button" onClick={() => { setMode('reset'); setError(''); setInfo('') }}>Lupa kata sandi?</button> : mode !== 'new-password' ? <button type="button" onClick={() => { setMode('login'); setError(''); setInfo('') }}>Kembali ke halaman masuk</button> : null}
      </div>
      <p className="auth-foot">Akun dan database online memerlukan konfigurasi Supabase dari pemilik aplikasi.</p>
    </section>
  </main>
}
