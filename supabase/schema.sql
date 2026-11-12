-- Skema produksi CUCI MOTOR RIZKY (Supabase / PostgreSQL)
-- Jalankan di Supabase SQL Editor. Mode demo aplikasi belum memakai skema ini.

create extension if not exists pgcrypto;

create type user_role as enum ('owner', 'kasir');
create type motor_size as enum ('kecil', 'sedang', 'besar');
create type order_status as enum ('baru', 'diproses', 'selesai', 'batal');
create type pay_method as enum ('tunai', 'transfer', 'qris', 'voucher');
create type pay_status as enum ('belum', 'lunas', 'refund');

-- Profil pengguna (terhubung ke auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role user_role not null default 'kasir',
  created_at timestamptz not null default now()
);

create table settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'CUCI MOTOR RIZKY',
  business_wa text not null,
  address text,
  loyalty_threshold int not null default 10 check (loyalty_threshold between 1 and 50),
  loyalty_reward_service_id text not null default 'kinclong',
  promo_template text not null default ''
);

create table services (
  id text primary key,
  name text not null,
  duration text not null,
  price_kecil int not null check (price_kecil > 0),
  price_sedang int not null check (price_sedang > 0),
  price_besar int not null check (price_besar > 0),
  note text,
  active boolean not null default true
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique check (phone ~ '^628[0-9]{7,11}$'),
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references users(id),
  customer_id uuid references customers(id),
  customer_name text not null default 'Umum',
  plate text,
  status order_status not null default 'baru',
  done_at timestamptz,
  cancel_reason text
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  service_id text not null references services(id),
  service_name text not null,
  size motor_size not null,
  price int not null check (price >= 0),
  discount int not null default 0 check (discount >= 0 and discount <= price)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id), -- 1 pembayaran per order (idempoten)
  method pay_method not null,
  status pay_status not null default 'belum',
  amount int not null check (amount >= 0),
  received int,
  paid_at timestamptz
);

create table cash_entries (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null default now(),
  type text not null check (type in ('masuk', 'keluar')),
  category text not null,
  amount int not null check (amount > 0),
  note text,
  pic text,
  source text not null check (source in ('order', 'manual')),
  order_id uuid references orders(id),
  voided_at timestamptz,
  voided_by uuid references users(id),
  void_reason text,
  created_by uuid not null references users(id)
);
-- cegah pemasukan ganda dari satu order
create unique index cash_one_active_per_order on cash_entries(order_id) where order_id is not null and voided_at is null;

create table loyalty_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  order_id uuid not null references orders(id),
  at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index loyalty_one_active_per_order on loyalty_events(order_id) where revoked_at is null;

create table loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  service_id text not null references services(id),
  issued_at timestamptz not null default now(),
  used_order_id uuid unique references orders(id), -- voucher sekali pakai
  used_at timestamptz
);

create table invoice_tokens (
  token text primary key default encode(gen_random_bytes(18), 'base64'),
  order_id uuid not null unique references orders(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table promo_consents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  granted boolean not null,
  source text not null,
  at timestamptz not null default now(),
  recorded_by uuid references users(id)
); -- riwayat lengkap; status terkini = baris terbaru per customer

create table audit_logs (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid references users(id),
  action text not null,
  detail jsonb
);

-- ===== Helper peran =====
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from users where id = auth.uid()
$$;

-- ===== RLS =====
alter table users enable row level security;
alter table settings enable row level security;
alter table services enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table cash_entries enable row level security;
alter table loyalty_events enable row level security;
alter table loyalty_rewards enable row level security;
alter table invoice_tokens enable row level security;
alter table promo_consents enable row level security;
alter table audit_logs enable row level security;

-- Semua staf login boleh membaca data operasional
create policy staff_read_services on services for select using (auth_role() is not null);
create policy staff_read_settings on settings for select using (auth_role() is not null);
create policy staff_rw_customers on customers for all using (auth_role() is not null) with check (auth_role() is not null);
create policy staff_read_orders on orders for select using (auth_role() is not null);
create policy staff_read_items on order_items for select using (auth_role() is not null);
create policy staff_read_payments on payments for select using (auth_role() is not null);
create policy staff_read_cash on cash_entries for select using (auth_role() is not null);
create policy staff_insert_cash on cash_entries for insert with check (auth_role() is not null and source = 'manual' and voided_at is null);
create policy staff_read_loyalty on loyalty_events for select using (auth_role() is not null);
create policy staff_read_rewards on loyalty_rewards for select using (auth_role() is not null);
create policy staff_rw_consents on promo_consents for all using (auth_role() is not null) with check (auth_role() is not null);
create policy self_read_user on users for select using (id = auth.uid() or auth_role() = 'owner');

-- Hanya owner: pengaturan, paket, audit
create policy owner_write_settings on settings for update using (auth_role() = 'owner');
create policy owner_write_services on services for all using (auth_role() = 'owner') with check (auth_role() = 'owner');
create policy owner_read_audit on audit_logs for select using (auth_role() = 'owner');

-- Tulis order/pembayaran/stempel/void kas HANYA lewat fungsi RPC security definer
-- (create_order, mark_paid, set_order_status, void_cash) yang menjalankan logika
-- yang sama dengan lib/logic.ts di dalam satu transaksi + menulis audit_logs.
-- invoice_tokens tidak punya policy select publik: halaman invoice membaca lewat
-- route server (service role) dan hanya mengembalikan field minimal (tanpa nomor WA).

-- ===== Data awal =====
insert into services (id, name, duration, price_kecil, price_sedang, price_besar, note) values
  ('kinclong', 'Cuci Kinclong', '20–30 menit', 17000, 20000, 25000, null),
  ('premium', 'Cuci Premium', '30–60 menit', 30000, 35000, 40000, null),
  ('poles', 'Poles Body', '2–4 jam', 125000, 150000, 175000, 'Termasuk Cuci Premium. Tidak untuk body doff/matte.'),
  ('detailing', 'Full Detailing', '7–10 jam', 200000, 300000, 350000, null);
insert into settings (business_wa) values ('6281200000000');
