-- Personal access tokens — let an agent (Claude Code / Codex) authenticate to the
-- MCP server as a specific user. Only the SHA-256 hash is stored; the raw token
-- is shown once at creation.

create table personal_access_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles on delete cascade,
  name         text,
  token_hash   text not null unique,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

create index on personal_access_tokens (token_hash);
create index on personal_access_tokens (user_id);

alter table personal_access_tokens enable row level security;

-- Users manage only their own tokens (the service uses service_role to verify).
create policy "pat_select_own" on personal_access_tokens
  for select to authenticated using (user_id = auth.uid());
create policy "pat_insert_own" on personal_access_tokens
  for insert to authenticated with check (user_id = auth.uid());
create policy "pat_update_own" on personal_access_tokens
  for update to authenticated using (user_id = auth.uid());
