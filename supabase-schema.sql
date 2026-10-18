-- KasKu UMKM schema. Jalankan di Supabase SQL Editor.
-- Skrip ini aman dijalankan ulang: policy lama bernama sama dihapus dahulu.

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tanggal date not null,
  jenis text not null check (jenis in ('pemasukan', 'pengeluaran')),
  kategori text not null check (length(trim(kategori)) between 1 and 60),
  keterangan text not null check (length(trim(keterangan)) between 1 and 200),
  nominal numeric(14,0) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, tanggal desc);

alter table public.transactions add column if not exists updated_at timestamptz not null default now();
-- Migrations for projects that ran an earlier version of this schema.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_nominal_positive_check'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_nominal_positive_check check (nominal > 0) not valid;
  end if;
end $$;


alter table public.transactions enable row level security;

 drop policy if exists "Users can view their own transactions" on public.transactions;
 drop policy if exists "Users can insert their own transactions" on public.transactions;
 drop policy if exists "Users can update their own transactions" on public.transactions;
 drop policy if exists "Users can delete their own transactions" on public.transactions;

create policy "Users can view their own transactions"
  on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert their own transactions"
  on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own transactions"
  on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own transactions"
  on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Pengaturan per akun: saldo awal tidak dicatat sebagai transaksi palsu.
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  saldo_awal numeric(14,0) not null default 0 check (saldo_awal >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Users can view their own settings" on public.user_settings;
drop policy if exists "Users can insert their own settings" on public.user_settings;
drop policy if exists "Users can update their own settings" on public.user_settings;

create policy "Users can view their own settings"
  on public.user_settings for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert their own settings"
  on public.user_settings for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own settings"
  on public.user_settings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Catatan: publishable/anon key boleh dipakai di frontend; jangan pernah masukkan service_role key.

-- Hak akses aplikasi diberikan hanya kepada pengguna terautentikasi; RLS tetap menjadi pembatas utama.
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update on public.user_settings to authenticated;
