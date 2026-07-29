-- Batchize sync.
--
-- Accounts are optional. The product works with no account at all, and that
-- stays the default: this table exists only for people who explicitly turn on
-- sync so their application follows them between machines.
--
-- One row per user holding the same document the export file uses, so there is
-- exactly one shape to reason about and an export is always a valid payload.

create table if not exists public.applications (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  -- The whole backup document: answers, deadline, interview, chancing,
  -- quick score and Pro draft history.
  document    jsonb       not null default '{}'::jsonb,
  -- Bumped on every write. The client compares this against the version it
  -- last saw, so a second device cannot silently overwrite newer work.
  version     bigint      not null default 1,
  updated_at  timestamptz not null default now(),
  -- Which device wrote last, so the UI can say "changed on another device"
  -- rather than the useless "conflict".
  device_label text
);

comment on table public.applications is
  'Optional cloud copy of a Batchize application. One row per user, owner-only.';

-- Row level security: a user can only ever touch their own row. There is no
-- policy granting anyone read access to anyone else, deliberately.
alter table public.applications enable row level security;

drop policy if exists "own row: select" on public.applications;
create policy "own row: select" on public.applications
  for select using (auth.uid() = user_id);

drop policy if exists "own row: insert" on public.applications;
create policy "own row: insert" on public.applications
  for insert with check (auth.uid() = user_id);

drop policy if exists "own row: update" on public.applications;
create policy "own row: update" on public.applications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own row: delete" on public.applications;
create policy "own row: delete" on public.applications
  for delete using (auth.uid() = user_id);

-- Version and timestamp are maintained by the database, not by the client,
-- so a client cannot claim to be newer than it is.
create or replace function public.touch_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.version := coalesce(old.version, 0) + 1;
  return new;
end;
$$;

drop trigger if exists applications_touch on public.applications;
create trigger applications_touch
  before update on public.applications
  for each row execute function public.touch_application();

-- Guard against a runaway client pushing something enormous. A full
-- application with drafts is a few hundred kB at the very most.
alter table public.applications
  drop constraint if exists applications_document_size;
alter table public.applications
  add constraint applications_document_size
  check (pg_column_size(document) < 2 * 1024 * 1024);
