-- ⚠️ TEMPORARY — DEV ONLY. Lets the anon (publishable) key READ so the app shows
-- data before Google auth is wired. REMOVE this migration's policies once login
-- is in place (a follow-up migration should drop every dev_anon_read_* policy).
-- Demo data only; do not leave enabled with real client data.

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','constitutions','projects','locks','snapshots','dimensions',
    'research_methods','questions','decision_log','renders','review_runs',
    'review_findings','activity'
  ]
  loop
    execute format(
      'create policy %I on %I for select to anon using (true);',
      'dev_anon_read_' || t, t
    );
  end loop;
end $$;
