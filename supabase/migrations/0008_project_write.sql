-- Allow signed-in staff to create projects from the web app (they own them).
-- Other writes still go through the service (service_role).

create policy "insert_own_projects" on projects
  for insert to authenticated
  with check (created_by = auth.uid());
