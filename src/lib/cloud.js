const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const SESSION_KEY = 'kasku-umkm-auth-session'

export const cloudConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('PROJECT_REF') &&
  !SUPABASE_ANON_KEY.includes('ISI_') &&
  !SUPABASE_ANON_KEY.includes('YOUR_'),
)
export const cloudConfigMissing = !cloudConfigured

function headers(token) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  }
}

export function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    if (session?.access_token && session?.user) return session
  } catch { /* ignore malformed local session */ }
  return null
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

async function authRequest(path, payload) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST', headers: headers(), body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.msg || body.message || body.error_description || body.error || 'Permintaan autentikasi gagal.')
  return body
}

export async function signIn(email, password) {
  const data = await authRequest('token?grant_type=password', { email, password })
  return saveSession(data)
}

export async function signUp(email, password) {
  const data = await authRequest('signup', { email, password })
  if (data.access_token) return saveSession(data)
  return data // email confirmation may be required
}

export async function requestPasswordReset(email) {
  return authRequest(`recover?redirect_to=${encodeURIComponent(window.location.origin)}`, { email })
}

export async function updatePassword(newPassword, accessToken) {
  if (!cloudConfigured) throw new Error('Supabase belum dikonfigurasi.')
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: { ...headers(accessToken), Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ password: newPassword }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || body.msg || 'Kata sandi tidak dapat diperbarui. Buka tautan pemulihan terbaru dari email.')
  return body
}

export function signOut() {
  const session = readSession()
  localStorage.removeItem(SESSION_KEY)
  if (session?.access_token && cloudConfigured) {
    fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: headers(session.access_token) }).catch(() => {})
  }
}

async function rest(path, options = {}, session = readSession()) {
  session = readSession() || session
  if (!cloudConfigured) throw new Error('Supabase belum dikonfigurasi.')
  if (!session?.access_token) throw new Error('Sesi login berakhir. Silakan masuk kembali.')

  const request = (token) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers(token), Prefer: 'return=representation', ...(options.headers || {}) },
  })
  let response = await request(session.access_token)
  if (response.status === 401 && session.refresh_token) {
    try {
      const refreshed = await refreshSession(session)
      response = await request(refreshed.access_token)
    } catch {
      localStorage.removeItem(SESSION_KEY)
      throw new Error('Sesi login berakhir. Silakan masuk kembali.')
    }
  }
  const body = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || body.details || body.hint || 'Gagal mengakses database. Periksa tabel dan kebijakan RLS.')
  return body
}

export async function getTransactions(session) {
  const rows = await rest('transactions?select=id,tanggal,jenis,kategori,keterangan,nominal&order=tanggal.desc', {}, session)
  return (rows || []).map((row) => ({ ...row, id: String(row.id), nominal: Number(row.nominal) }))
}

export async function getAccountSettings(session) {
  const rows = await rest(`user_settings?select=saldo_awal&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`, {}, session)
  return { saldoAwal: Number(rows?.[0]?.saldo_awal ?? 0) }
}

export async function saveAccountSettings(saldoAwal, session) {
  const row = { user_id: session.user.id, saldo_awal: Number(saldoAwal), updated_at: new Date().toISOString() }
  return rest('user_settings?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(row),
  }, session)
}

export async function upsertTransaction(transaction, session) {
  const nominal = Number(transaction.nominal)
  if (!Number.isFinite(nominal) || nominal <= 0 || !Number.isInteger(nominal)) throw new Error('Nominal harus bilangan bulat lebih dari nol.')
  if (!transaction.tanggal || !transaction.keterangan?.trim() || !transaction.kategori) throw new Error('Tanggal, kategori, dan keterangan wajib diisi.')
  if (!['pemasukan', 'pengeluaran'].includes(transaction.jenis)) throw new Error('Jenis transaksi tidak valid.')
  const row = {
    id: String(transaction.id), user_id: session.user.id, tanggal: transaction.tanggal,
    jenis: transaction.jenis, kategori: transaction.kategori, keterangan: transaction.keterangan,
    nominal,
  }
  return rest('transactions?on_conflict=id', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(row),
  }, session)
}

export async function deleteTransaction(id, session) {
  return rest(`transactions?id=eq.${encodeURIComponent(String(id))}`, { method: 'DELETE' }, session)
}

export async function clearTransactions(session) {
  return rest('transactions?user_id=eq.' + encodeURIComponent(session.user.id), { method: 'DELETE' }, session)
}

export async function refreshSession(session = readSession()) {
  if (!cloudConfigured || !session?.refresh_token) return session
  const data = await authRequest('token?grant_type=refresh_token', { refresh_token: session.refresh_token })
  return saveSession(data)
}
