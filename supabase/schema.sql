-- Esquema de Cafecito para Supabase
-- Cópialo y ejecútalo en: Supabase → SQL Editor → New query → Run

-- Encuestas
create table if not exists surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  questions jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  share_link text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Respuestas
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists responses_survey_id_idx on responses(survey_id);
create index if not exists surveys_share_link_idx on surveys(share_link);

-- Row Level Security
alter table surveys enable row level security;
alter table responses enable row level security;

-- Esta app es de un solo administrador y usa la llave anónima tanto para el
-- panel como para que los encuestados respondan. Por eso las políticas permiten
-- acceso con la llave anónima. (Para producción seria, conviene Supabase Auth.)
drop policy if exists "anon read surveys" on surveys;
create policy "anon read surveys" on surveys
  for select using (true);

drop policy if exists "anon write surveys" on surveys;
create policy "anon write surveys" on surveys
  for all using (true) with check (true);

drop policy if exists "anon read responses" on responses;
create policy "anon read responses" on responses
  for select using (true);

drop policy if exists "anon insert responses" on responses;
create policy "anon insert responses" on responses
  for insert with check (true);
