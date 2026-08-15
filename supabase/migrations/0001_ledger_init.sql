-- Ledger feature: manual transaction logging, categories, payment methods,
-- and closed-circle shared expenses between the app's registered users.
-- See PRD sections 4.1, 4.2, 4.7, 4.8.

create extension if not exists pgcrypto;

-- ============================================================================
-- Tables (created first — several RLS policies below reference each other's
-- tables, so every table must exist before any policy is added).
-- ============================================================================

-- One row per auth user. Populated automatically on signup (trigger below).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Fixed v1 default set (PRD 4.1 — custom categories are a fast-follow).
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  category_id uuid not null references public.categories (id),
  payment_method text not null check (payment_method in ('cash', 'card', 'digital_wallet', 'bank_transfer')),
  txn_date date not null,
  note text,
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_txn_date_idx on public.transactions (user_id, txn_date desc);

create table if not exists public.transaction_participants (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  participant_id uuid not null references auth.users (id) on delete cascade,
  share_amount numeric(12, 2) not null check (share_amount > 0),
  created_at timestamptz not null default now(),
  unique (transaction_id, participant_id)
);

-- Manually recorded "I paid you back" entries. No money actually moves.
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  payer_id uuid not null references auth.users (id) on delete cascade,
  payee_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  created_by uuid not null references auth.users (id),
  settled_at timestamptz not null default now(),
  check (payer_id <> payee_id)
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_participants enable row level security;
alter table public.settlements enable row level security;

-- profiles: everyone signed in can see the small set of team profiles
-- (needed to show names in the Balances view) but can only edit their own row.
create policy "profiles are readable by any signed-in user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users manage their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- categories: fixed, read-only reference data.
create policy "categories are readable by any signed-in user"
  on public.categories for select
  to authenticated
  using (true);

-- transactions: owners see their own; shared-expense participants can see
-- (read-only) the transactions they were tagged on, needed for balances.
create policy "select own or participated transactions"
  on public.transactions for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.transaction_participants tp
      where tp.transaction_id = transactions.id
        and tp.participant_id = auth.uid()
    )
  );

create policy "insert own transactions"
  on public.transactions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "update own transactions"
  on public.transactions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "delete own transactions"
  on public.transactions for delete
  to authenticated
  using (user_id = auth.uid());

-- transaction_participants: only the payer can add/remove participants;
-- a tagged participant can see their own rows to compute balances.
create policy "select participants of visible transactions"
  on public.transaction_participants for select
  to authenticated
  using (
    participant_id = auth.uid()
    or exists (
      select 1 from public.transactions t
      where t.id = transaction_participants.transaction_id
        and t.user_id = auth.uid()
    )
  );

create policy "payer manages participants"
  on public.transaction_participants for insert
  to authenticated
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_participants.transaction_id
        and t.user_id = auth.uid()
    )
  );

create policy "payer deletes participants"
  on public.transaction_participants for delete
  to authenticated
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_participants.transaction_id
        and t.user_id = auth.uid()
    )
  );

-- settlements: either party to a settlement can see and record it.
create policy "select own settlements"
  on public.settlements for select
  to authenticated
  using (payer_id = auth.uid() or payee_id = auth.uid());

create policy "record settlement between self and counterpart"
  on public.settlements for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (payer_id = auth.uid() or payee_id = auth.uid())
  );

-- ============================================================================
-- Auto-create a profile row whenever someone signs up.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Seed default categories
-- ============================================================================

insert into public.categories (name, sort_order) values
  ('Food', 1),
  ('Transport', 2),
  ('Rent', 3),
  ('Utilities', 4),
  ('Entertainment', 5),
  ('Health', 6),
  ('Shopping', 7),
  ('Income', 8),
  ('Other', 9)
on conflict (name) do nothing;
