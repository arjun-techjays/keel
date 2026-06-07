-- Project editors. View stays open to all authenticated staff; only editors can
-- change a project (enforced in the service for pull/push/answer). The creator is
-- auto-added; any editor can add more; only the creator or an admin can remove.

create table project_members (
  project_id uuid not null references projects on delete cascade,
  user_id    uuid not null references profiles on delete cascade,
  role       text not null default 'editor' check (role in ('editor')),
  added_by   uuid references profiles,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index on project_members (user_id);

alter table project_members enable row level security;

create or replace function is_project_editor(pid uuid, uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    exists (select 1 from project_members m where m.project_id = pid and m.user_id = uid)
    or exists (select 1 from projects p where p.id = pid and p.created_by = uid)
    or exists (select 1 from profiles pr where pr.id = uid and pr.role = 'admin');
$$;

-- read: anyone signed in can see who can edit
create policy "members_select" on project_members
  for select to authenticated using (true);

-- insert: any current editor of the project may add people
create policy "members_insert" on project_members
  for insert to authenticated
  with check (is_project_editor(project_id, auth.uid()));

-- delete: only the project creator or an admin
create policy "members_delete" on project_members
  for delete to authenticated
  using (
    exists (select 1 from projects p where p.id = project_id and p.created_by = auth.uid())
    or exists (select 1 from profiles pr where pr.id = auth.uid() and pr.role = 'admin')
  );

-- creator becomes an editor automatically
create or replace function add_creator_as_editor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into project_members (project_id, user_id, role, added_by)
    values (new.id, new.created_by, 'editor', new.created_by)
    on conflict do nothing;
  end if;
  return new;
end $$;

create trigger trg_project_creator_editor
  after insert on projects
  for each row execute function add_creator_as_editor();

-- backfill creators of any existing projects
insert into project_members (project_id, user_id, role, added_by)
select id, created_by, 'editor', created_by from projects where created_by is not null
on conflict do nothing;
