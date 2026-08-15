-- PostgREST embeds tables using foreign keys between them directly. The app
-- queries transaction_participants(...profiles(display_name)), which needs
-- participant_id to point at public.profiles, not auth.users (both work at
-- the DB level, but only an FK to profiles is discoverable for embedding).

do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.transaction_participants'::regclass
      and contype = 'f'
      and conname like '%participant_id%'
  loop
    execute format('alter table public.transaction_participants drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.transaction_participants
  add constraint transaction_participants_participant_id_fkey
  foreign key (participant_id) references public.profiles (id) on delete cascade;
