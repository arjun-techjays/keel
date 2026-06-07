-- Remove the temporary dev-only anon read policies from 0005. Real Google auth
-- is now wired, so reads require an authenticated session (RLS `to authenticated`).

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','constitutions','projects','locks','snapshots','dimensions',
    'research_methods','questions','decision_log','renders','review_runs',
    'review_findings','activity'
  ]
  loop
    execute format('drop policy if exists %I on %I;', 'dev_anon_read_' || t, t);
  end loop;
end $$;
