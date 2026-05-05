-- Altegra Forms — initial schema, indexes, triggers, RLS, and RPCs.
-- Run once on a fresh Supabase project.

create extension if not exists pgcrypto;

------------------------------------------------------------------------------
-- App settings (used by the SECURITY DEFINER signup trigger)
------------------------------------------------------------------------------
-- We store the allowed email domain in a single-row settings table so the
-- trigger doesn't need access to env vars. Update via:
--   update public.app_settings set allowed_email_domain = 'altegra.com';
create table if not exists public.app_settings (
  id boolean primary key default true,
  allowed_email_domain text not null default 'altegra.com',
  constraint app_settings_singleton check (id = true)
);
insert into public.app_settings (id) values (true) on conflict do nothing;

------------------------------------------------------------------------------
-- profiles
------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

------------------------------------------------------------------------------
-- forms
------------------------------------------------------------------------------
create table public.forms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled form',
  description text,
  slug text unique not null,
  public_token text unique,
  status text not null default 'draft'
    check (status in ('draft','published','closed')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index forms_owner_id_idx on public.forms(owner_id);
create index forms_slug_idx on public.forms(slug);
create index forms_public_token_idx on public.forms(public_token);

------------------------------------------------------------------------------
-- questions
------------------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  type text not null check (type in
    ('short_text','long_text','single_choice','multi_choice','rating','date','number')),
  label text not null,
  description text,
  position int not null,
  required boolean not null default false,
  options jsonb
);

create index questions_form_position_idx on public.questions(form_id, position);

------------------------------------------------------------------------------
-- responses
------------------------------------------------------------------------------
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  respondent_id uuid references public.profiles(id) on delete set null,
  respondent_name text,
  respondent_email text,
  submitted_via text not null check (submitted_via in ('internal','public')),
  ip_hash text,
  user_agent text,
  submitted_at timestamptz not null default now()
);

create index responses_form_submitted_at_idx
  on public.responses(form_id, submitted_at desc);

-- One response per user (when the form opts in).
create unique index one_response_per_user
  on public.responses(form_id, respondent_id)
  where respondent_id is not null;

------------------------------------------------------------------------------
-- answers
------------------------------------------------------------------------------
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  value jsonb not null
);

create index answers_response_id_idx on public.answers(response_id);
create index answers_question_id_idx on public.answers(question_id);

------------------------------------------------------------------------------
-- audit_log
------------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_actor_idx on public.audit_log(actor_id);
create index audit_log_created_idx on public.audit_log(created_at desc);

------------------------------------------------------------------------------
-- notifications (Phase 7 burst detection)
------------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  message text not null,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx
  on public.notifications(user_id, read_at);

------------------------------------------------------------------------------
-- spam_blocks (Phase 7 abuse silencing)
------------------------------------------------------------------------------
create table public.spam_blocks (
  ip_hash text primary key,
  count int not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

------------------------------------------------------------------------------
-- updated_at trigger for forms
------------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger forms_set_updated_at
before update on public.forms
for each row execute function public.set_updated_at();

------------------------------------------------------------------------------
-- Signup trigger: enforce domain + create profile row
------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed_domain text;
  v_email_domain text;
begin
  select allowed_email_domain into v_allowed_domain
  from public.app_settings where id = true;

  v_email_domain := lower(split_part(new.email, '@', 2));

  if v_allowed_domain is not null
     and v_email_domain is distinct from lower(v_allowed_domain) then
    raise exception 'email_domain_not_allowed'
      using errcode = '22023',
            hint = 'Sign-ups are restricted to ' || v_allowed_domain;
  end if;

  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null)
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

------------------------------------------------------------------------------
-- Row-level security
------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.forms enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;
alter table public.audit_log enable row level security;
alter table public.notifications enable row level security;
alter table public.spam_blocks enable row level security;

-- profiles
create policy "profiles read for authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- forms
create policy "forms read own or published"
  on public.forms for select
  to authenticated
  using (owner_id = auth.uid() or status = 'published');

create policy "forms insert own"
  on public.forms for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "forms update own"
  on public.forms for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "forms delete own"
  on public.forms for delete
  to authenticated
  using (owner_id = auth.uid());

-- questions (mirror parent form access)
create policy "questions read via form"
  on public.questions for select
  to authenticated
  using (
    exists (
      select 1 from public.forms f
      where f.id = questions.form_id
        and (f.owner_id = auth.uid() or f.status = 'published')
    )
  );

create policy "questions write owner only"
  on public.questions for all
  to authenticated
  using (
    exists (
      select 1 from public.forms f
      where f.id = questions.form_id and f.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.forms f
      where f.id = questions.form_id and f.owner_id = auth.uid()
    )
  );

-- responses
-- Internal insert only; public submissions go through service role.
create policy "responses insert internal"
  on public.responses for insert
  to authenticated
  with check (
    auth.uid() is not null
    and submitted_via = 'internal'
    and respondent_id = auth.uid()
    and exists (
      select 1 from public.forms f
      where f.id = responses.form_id and f.status = 'published'
    )
  );

create policy "responses select owner or self"
  on public.responses for select
  to authenticated
  using (
    respondent_id = auth.uid()
    or exists (
      select 1 from public.forms f
      where f.id = responses.form_id and f.owner_id = auth.uid()
    )
  );

create policy "responses delete owner or respondent"
  on public.responses for delete
  to authenticated
  using (
    respondent_id = auth.uid()
    or exists (
      select 1 from public.forms f
      where f.id = responses.form_id and f.owner_id = auth.uid()
    )
  );

-- answers (mirror parent response access)
create policy "answers select via response"
  on public.answers for select
  to authenticated
  using (
    exists (
      select 1 from public.responses r
      where r.id = answers.response_id
        and (
          r.respondent_id = auth.uid()
          or exists (
            select 1 from public.forms f
            where f.id = r.form_id and f.owner_id = auth.uid()
          )
        )
    )
  );

create policy "answers insert via internal response"
  on public.answers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.responses r
      where r.id = answers.response_id
        and r.respondent_id = auth.uid()
        and r.submitted_via = 'internal'
    )
  );

create policy "answers delete via response"
  on public.answers for delete
  to authenticated
  using (
    exists (
      select 1 from public.responses r
      where r.id = answers.response_id
        and (
          r.respondent_id = auth.uid()
          or exists (
            select 1 from public.forms f
            where f.id = r.form_id and f.owner_id = auth.uid()
          )
        )
    )
  );

-- audit_log: read own; inserts only via service role
create policy "audit_log read own"
  on public.audit_log for select
  to authenticated
  using (actor_id = auth.uid());

-- notifications: read/update own
create policy "notifications read own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications update own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- spam_blocks: not readable from clients; service role only

------------------------------------------------------------------------------
-- RPCs
------------------------------------------------------------------------------

-- Internal submission. Caller's RLS applies.
create or replace function public.submit_internal_response(
  p_form_id uuid,
  p_answers jsonb
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_response_id uuid;
  v_form public.forms%rowtype;
  v_one_per_user boolean;
  v_close_at timestamptz;
  v_answer jsonb;
begin
  select * into v_form from public.forms where id = p_form_id;
  if not found then
    raise exception 'form_not_found';
  end if;
  if v_form.status <> 'published' then
    raise exception 'form_not_published';
  end if;

  v_close_at := nullif(v_form.settings->>'close_at','')::timestamptz;
  if v_close_at is not null and v_close_at < now() then
    raise exception 'form_closed';
  end if;

  v_one_per_user := coalesce((v_form.settings->>'one_response_per_user')::boolean, false);
  if v_one_per_user and exists (
    select 1 from public.responses
    where form_id = p_form_id and respondent_id = auth.uid()
  ) then
    raise exception 'already_responded';
  end if;

  insert into public.responses (form_id, respondent_id, submitted_via)
  values (p_form_id, auth.uid(), 'internal')
  returning id into v_response_id;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    insert into public.answers (response_id, question_id, value)
    values (
      v_response_id,
      (v_answer->>'question_id')::uuid,
      v_answer->'value'
    );
  end loop;

  return v_response_id;
end;
$$;

-- Public submission. Service role calls this; trust boundary enforced by API.
create or replace function public.submit_public_response(
  p_form_id uuid,
  p_answers jsonb,
  p_name text,
  p_email text,
  p_ip_hash text,
  p_user_agent text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_response_id uuid;
  v_form public.forms%rowtype;
  v_close_at timestamptz;
  v_allow_anon boolean;
  v_answer jsonb;
begin
  select * into v_form from public.forms where id = p_form_id;
  if not found then
    raise exception 'form_not_found';
  end if;
  if v_form.status <> 'published' then
    raise exception 'form_not_published';
  end if;

  v_close_at := nullif(v_form.settings->>'close_at','')::timestamptz;
  if v_close_at is not null and v_close_at < now() then
    raise exception 'form_closed';
  end if;

  v_allow_anon := coalesce((v_form.settings->>'allow_anonymous')::boolean, false);
  if not v_allow_anon then
    raise exception 'public_not_enabled';
  end if;

  insert into public.responses (
    form_id, respondent_id, respondent_name, respondent_email,
    submitted_via, ip_hash, user_agent
  )
  values (
    p_form_id, null, p_name, p_email,
    'public', p_ip_hash, left(coalesce(p_user_agent,''), 200)
  )
  returning id into v_response_id;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    insert into public.answers (response_id, question_id, value)
    values (
      v_response_id,
      (v_answer->>'question_id')::uuid,
      v_answer->'value'
    );
  end loop;

  return v_response_id;
end;
$$;

revoke all on function public.submit_public_response(uuid, jsonb, text, text, text, text)
  from public, anon, authenticated;
