-- The transactions <-> transaction_participants RLS policies each queried
-- the other table to check ownership/participation, which re-triggers the
-- other policy and recurses infinitely. Route those checks through
-- SECURITY DEFINER helpers (owned by the migration role, which bypasses its
-- own tables' RLS) so the lookup doesn't re-enter policy evaluation.

create or replace function public.is_transaction_owner(txn_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.transactions t
    where t.id = txn_id and t.user_id = auth.uid()
  );
$$;

create or replace function public.is_transaction_participant(txn_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.transaction_participants tp
    where tp.transaction_id = txn_id and tp.participant_id = auth.uid()
  );
$$;

drop policy if exists "select own or participated transactions" on public.transactions;
create policy "select own or participated transactions"
  on public.transactions for select
  to authenticated
  using (user_id = auth.uid() or public.is_transaction_participant(id));

drop policy if exists "select participants of visible transactions" on public.transaction_participants;
create policy "select participants of visible transactions"
  on public.transaction_participants for select
  to authenticated
  using (participant_id = auth.uid() or public.is_transaction_owner(transaction_id));

drop policy if exists "payer manages participants" on public.transaction_participants;
create policy "payer manages participants"
  on public.transaction_participants for insert
  to authenticated
  with check (public.is_transaction_owner(transaction_id));

drop policy if exists "payer deletes participants" on public.transaction_participants;
create policy "payer deletes participants"
  on public.transaction_participants for delete
  to authenticated
  using (public.is_transaction_owner(transaction_id));
