-- Safe to run again. It updates the tables and rules in place.
-- Run this in the Supabase SQL editor before the site goes on a domain.
-- It stores applications, keeps financial need and phone numbers off student
-- readers' screens, and opens the reading desk for the emails listed at the bottom.

create table if not exists public.readers (
  email text primary key,
  kind text not null check (kind in ('adult', 'student')),
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  file_number text not null default '',
  status text not null default 'draft',
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  applicant_name text not null default '',
  place text not null default '',
  body jsonb not null default '{}'::jsonb
);

create table if not exists public.application_need (
  user_id uuid primary key references public.applications (user_id) on delete cascade,
  need jsonb not null default '{}'::jsonb
);

create table if not exists public.application_contact (
  user_id uuid primary key references public.applications (user_id) on delete cascade,
  contact jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists applications_file_number_unique
  on public.applications (file_number)
  where file_number <> '';

create table if not exists public.review_notes (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applications (user_id) on delete cascade,
  author_id uuid not null references auth.users (id),
  author_name text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.status_events (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applications (user_id) on delete cascade,
  author_id uuid,
  status text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.readers enable row level security;
alter table public.applications enable row level security;
alter table public.application_need enable row level security;
alter table public.application_contact enable row level security;
alter table public.review_notes enable row level security;
alter table public.status_events enable row level security;

create or replace function public.readers_email()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.email := lower(btrim(new.email));
  return new;
end;
$$;

drop trigger if exists readers_email on public.readers;
create trigger readers_email
  before insert or update on public.readers
  for each row
  execute function public.readers_email();

create or replace function public.reader_kind()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select kind
  from public.readers
  where lower(email) = lower(auth.jwt() ->> 'email')
  limit 1;
$$;

revoke all on function public.reader_kind() from public;
grant execute on function public.reader_kind() to authenticated;

drop trigger if exists applications_guard on public.applications;
drop function if exists public.guard_application_update();

create or replace function public.guard_application_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
  tries int := 0;
begin
  if current_setting('her.moving', true) = '1' then
    new.updated_at := now();
    return new;
  end if;

  if auth.uid() is not null and new.user_id is distinct from auth.uid() then
    raise exception 'You can only edit your own application.';
  end if;

  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'The file owner cannot change.';
  end if;

  if new.status is null or btrim(new.status) = '' then
    new.status := 'draft';
  end if;

  if tg_op = 'UPDATE' and old.status <> 'draft' then
    raise exception 'This file is submitted.';
  end if;

  if new.status not in ('draft', 'submitted') then
    raise exception 'Students cannot post a review status.';
  end if;

  if new.status = 'submitted' and new.submitted_at is null then
    new.submitted_at := now();
  end if;

  if new.status <> 'draft' and (
    new.file_number is null
    or btrim(new.file_number) = ''
    or exists (
      select 1
      from public.applications existing
      where existing.file_number = new.file_number
        and existing.user_id <> new.user_id
    )
  ) then
    loop
      tries := tries + 1;
      candidate := 'HER-' || lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
      exit when not exists (
        select 1 from public.applications existing where existing.file_number = candidate
      );
      if tries > 30 then
        candidate := 'HER-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
        exit;
      end if;
    end loop;
    new.file_number := candidate;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger applications_guard
  before insert or update on public.applications
  for each row
  execute function public.guard_application_write();

create or replace function public.move_application(applicant uuid, next_status text, note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
begin
  if public.reader_kind() is distinct from 'adult' then
    raise exception 'Only an adult reader can move a file.';
  end if;
  select status into current_status
  from public.applications
  where user_id = applicant;
  if current_status is null or current_status = 'draft' then
    raise exception 'That file is not submitted.';
  end if;
  if not (
    (current_status = 'submitted' and next_status = 'in_review')
    or (current_status = 'in_review' and next_status in ('round_2', 'not_advanced'))
    or (current_status = 'round_2' and next_status in ('finalist', 'not_advanced'))
    or (current_status = 'finalist' and next_status in ('awarded', 'not_advanced'))
  ) then
    raise exception 'That move is not open.';
  end if;
  perform set_config('her.moving', '1', true);
  update public.applications
    set status = next_status
    where user_id = applicant;
  insert into public.status_events (applicant_id, author_id, status, note)
  values (applicant, auth.uid(), next_status, left(coalesce(note, ''), 1000));
end;
$$;

revoke all on function public.move_application(uuid, text, text) from public;
revoke all on function public.move_application(uuid, text, text) from anon;
grant execute on function public.move_application(uuid, text, text) to authenticated;

create or replace function public.submit_application(
  next_file_number text,
  next_name text,
  next_place text,
  next_body jsonb,
  next_need jsonb,
  next_contact jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing text;
  saved public.applications%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in again before sending the file.';
  end if;

  select status into existing
  from public.applications
  where user_id = auth.uid();
  if existing is not null and existing <> 'draft' then
    raise exception 'This file is submitted.';
  end if;

  if coalesce(jsonb_typeof(next_body), '') <> 'object' then
    next_body := '{}'::jsonb;
  end if;
  if coalesce(jsonb_typeof(next_need), '') <> 'object' then
    next_need := '{}'::jsonb;
  end if;
  if coalesce(jsonb_typeof(next_contact), '') <> 'object' then
    next_contact := '{}'::jsonb;
  end if;
  next_body := next_body - 'contact';

  if length(regexp_replace(coalesce(next_contact->>'studentPhone', ''), '\D', '', 'g')) < 8
    or length(regexp_replace(coalesce(next_contact->>'parentPhone', ''), '\D', '', 'g')) < 8
    or position('@' in coalesce(next_contact->>'studentEmail', '')) = 0
    or position('@' in coalesce(next_contact->>'parentEmail', '')) = 0
    or length(btrim(coalesce(next_contact->>'parentName', ''))) < 2
  then
    raise exception 'Add student and parent contact before submitting.';
  end if;

  insert into public.applications (
    user_id, file_number, status, submitted_at, applicant_name, place, body
  )
  values (
    auth.uid(),
    left(coalesce(next_file_number, ''), 40),
    'submitted',
    now(),
    left(coalesce(next_name, ''), 200),
    left(coalesce(next_place, ''), 200),
    next_body
  )
  on conflict (user_id) do update
    set file_number = left(coalesce(next_file_number, ''), 40),
        status = 'submitted',
        submitted_at = coalesce(public.applications.submitted_at, now()),
        applicant_name = left(coalesce(next_name, ''), 200),
        place = left(coalesce(next_place, ''), 200),
        body = excluded.body
    where public.applications.status = 'draft'
  returning * into saved;

  if saved.user_id is null then
    raise exception 'This file is submitted.';
  end if;

  insert into public.application_need (user_id, need)
  values (auth.uid(), next_need)
  on conflict (user_id) do update
    set need = excluded.need;

  insert into public.application_contact (user_id, contact, updated_at)
  values (auth.uid(), next_contact, now())
  on conflict (user_id) do update
    set contact = excluded.contact,
        updated_at = now();

  return jsonb_build_object(
    'status', saved.status,
    'submitted_at', saved.submitted_at,
    'file_number', saved.file_number
  );
end;
$$;

revoke all on function public.submit_application(text, text, text, jsonb, jsonb, jsonb) from public;
revoke all on function public.submit_application(text, text, text, jsonb, jsonb, jsonb) from anon;
grant execute on function public.submit_application(text, text, text, jsonb, jsonb, jsonb) to authenticated;

drop policy if exists "read own reader row" on public.readers;
create policy "read own reader row"
  on public.readers for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "owner reads application" on public.applications;
create policy "owner reads application"
  on public.applications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "readers read submitted" on public.applications;
create policy "readers read submitted"
  on public.applications for select
  to authenticated
  using (public.reader_kind() is not null and status <> 'draft');

drop policy if exists "owner inserts application" on public.applications;
create policy "owner inserts application"
  on public.applications for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "owner updates application" on public.applications;
create policy "owner updates application"
  on public.applications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "owner reads need" on public.application_need;
create policy "owner reads need"
  on public.application_need for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "adults read need" on public.application_need;
drop policy if exists "readers read need" on public.application_need;
create policy "readers read need"
  on public.application_need for select
  to authenticated
  using (
    public.reader_kind() is not null
    and exists (
      select 1
      from public.applications
      where applications.user_id = application_need.user_id
        and applications.status <> 'draft'
    )
  );

drop policy if exists "owner inserts need" on public.application_need;
create policy "owner inserts need"
  on public.application_need for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.applications
      where applications.user_id = application_need.user_id
        and applications.status = 'draft'
    )
  );

drop policy if exists "owner updates need" on public.application_need;
create policy "owner updates need"
  on public.application_need for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.applications
      where applications.user_id = application_need.user_id
        and applications.status = 'draft'
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.applications
      where applications.user_id = application_need.user_id
        and applications.status = 'draft'
    )
  );

drop policy if exists "owner reads contact" on public.application_contact;
create policy "owner reads contact"
  on public.application_contact for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "adults read contact" on public.application_contact;
create policy "adults read contact"
  on public.application_contact for select
  to authenticated
  using (
    public.reader_kind() = 'adult'
    and exists (
      select 1
      from public.applications
      where applications.user_id = application_contact.user_id
        and applications.status <> 'draft'
    )
  );

drop policy if exists "owner inserts contact" on public.application_contact;
create policy "owner inserts contact"
  on public.application_contact for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.applications
      where applications.user_id = application_contact.user_id
        and applications.status = 'draft'
    )
  );

drop policy if exists "owner updates contact" on public.application_contact;
create policy "owner updates contact"
  on public.application_contact for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.applications
      where applications.user_id = application_contact.user_id
        and applications.status = 'draft'
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.applications
      where applications.user_id = application_contact.user_id
        and applications.status = 'draft'
    )
  );

drop policy if exists "readers read notes" on public.review_notes;
create policy "readers read notes"
  on public.review_notes for select
  to authenticated
  using (public.reader_kind() = 'adult');

drop policy if exists "readers write notes" on public.review_notes;
create policy "readers write notes"
  on public.review_notes for insert
  to authenticated
  with check (public.reader_kind() = 'adult' and author_id = auth.uid());

drop policy if exists "owner reads events" on public.status_events;
create policy "owner reads events"
  on public.status_events for select
  to authenticated
  using (applicant_id = auth.uid());

drop policy if exists "readers read events" on public.status_events;
create policy "readers read events"
  on public.status_events for select
  to authenticated
  using (public.reader_kind() is not null);

revoke all on public.readers from anon;
revoke all on public.applications from anon;
revoke all on public.application_need from anon;
revoke all on public.application_contact from anon;
revoke all on public.review_notes from anon;
revoke all on public.status_events from anon;

grant select on public.readers to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select, insert, update on public.application_need to authenticated;
grant select, insert, update on public.application_contact to authenticated;
grant select, insert on public.review_notes to authenticated;
grant select on public.status_events to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'transcripts',
  'transcripts',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owner reads transcripts" on storage.objects;
create policy "owner reads transcripts"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'transcripts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "readers read transcripts" on storage.objects;
create policy "readers read transcripts"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'transcripts'
    and public.reader_kind() is not null
    and exists (
      select 1
      from public.applications
      where applications.user_id::text = (storage.foldername(name))[1]
        and applications.status <> 'draft'
    )
  );

drop policy if exists "owner uploads transcripts" on storage.objects;
create policy "owner uploads transcripts"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'transcripts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owner updates transcripts" on storage.objects;
create policy "owner updates transcripts"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'transcripts'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'transcripts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owner deletes transcripts" on storage.objects;
create policy "owner deletes transcripts"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'transcripts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

insert into public.readers (email, kind)
values ('ameliefairweather7@gmail.com', 'adult')
on conflict (email) do update set kind = excluded.kind;

update public.readers set email = lower(email) where email <> lower(email);

-- Add a student reader. Phone numbers stay with adult readers. Financial answers are visible to every reader:
-- insert into public.readers (email, kind) values ('reader@school.edu', 'student');
