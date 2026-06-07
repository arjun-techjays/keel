-- Keel phase 2 — Row Level Security
-- Internal tool: domain restriction happens at the auth layer (Google provider
-- + allowed domain), so any authenticated user is trusted staff and may READ
-- everything. All WRITES go through the Python service using the service_role
-- key, which bypasses RLS — so we deliberately grant no write policies here.

-- Helper: enable RLS + grant authenticated read on a table.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','constitutions','projects','locks','snapshots','dimensions',
    'research_methods','questions','decision_log','renders','review_runs',
    'review_findings','activity'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy %I on %I for select to authenticated using (true);',
      'read_' || t, t
    );
  end loop;
end $$;

-- Profiles: a user may update their own row (display name, color, initials).
create policy "update_own_profile" on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Auto-create a profile row when a new auth user is provisioned.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
