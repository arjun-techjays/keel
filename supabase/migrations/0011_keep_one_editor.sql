-- A project must always keep at least one editor. Allow deletes by creator/admin
-- only when more than one editor remains.

drop policy if exists "members_delete" on project_members;

create policy "members_delete" on project_members
  for delete to authenticated
  using (
    (
      exists (select 1 from projects p where p.id = project_id and p.created_by = auth.uid())
      or exists (select 1 from profiles pr where pr.id = auth.uid() and pr.role = 'admin')
    )
    and (select count(*) from project_members m2 where m2.project_id = project_members.project_id) > 1
  );
