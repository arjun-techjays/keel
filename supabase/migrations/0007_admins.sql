-- Designate admins. Dashboard (cross-engagement KPIs) is admin-only.
-- New profiles for these emails are created as 'admin'; existing ones backfilled.

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case
      when lower(new.email) in ('arjun.s@techjays.com', 'aparna@techjays.com')
        then 'admin' else 'member'
    end
  )
  on conflict (id) do nothing;
  return new;
end $$;

update profiles
   set role = 'admin'
 where lower(email) in ('arjun.s@techjays.com', 'aparna@techjays.com');
