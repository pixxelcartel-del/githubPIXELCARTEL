create extension if not exists vector with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  exam_track text default 'Cambridge O Level',
  board text default 'Cambridge',
  qualification text default 'O Level',
  curriculum_track text default 'International',
  registered_subjects jsonb not null default '[]'::jsonb,
  primary_subject text default 'Physics',
  target_session text,
  weekly_mock_target int not null default 2,
  onboarding_completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.exam_boards (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.qualifications (
  id text primary key,
  board_id text not null references public.exam_boards(id),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.subjects (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.syllabi (
  id text primary key,
  board_id text not null references public.exam_boards(id),
  qualification_id text not null references public.qualifications(id),
  subject_id text not null references public.subjects(id),
  code text not null,
  title text not null,
  created_at timestamptz default now()
);

create table if not exists public.student_subject_registrations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  syllabus_id text not null references public.syllabi(id),
  status text not null default 'active',
  created_at timestamptz default now(),
  unique(user_id, syllabus_id)
);

create table if not exists public.papers (
  id text primary key,
  syllabus_id text references public.syllabi(id),
  board text not null default 'Cambridge',
  qualification text not null default 'O Level',
  curriculum_track text not null default 'International',
  syllabus_code text not null default '5054',
  code text not null,
  subject text not null,
  component text not null,
  session text not null,
  duration_minutes int not null,
  total_marks int not null,
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.source_documents (
  id bigint generated always as identity primary key,
  paper_id text not null references public.papers(id) on delete cascade,
  source_type text not null check (source_type in ('question_paper', 'mark_scheme', 'structured_json', 'diagram_asset')),
  storage_path text not null,
  original_path text,
  extraction_status text not null default 'needs-review',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.extraction_artifacts (
  id bigint generated always as identity primary key,
  source_document_id bigint not null references public.source_documents(id) on delete cascade,
  artifact_type text not null,
  storage_path text not null,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.questions (
  id text primary key,
  paper_id text not null references public.papers(id) on delete cascade,
  number int not null,
  title text not null,
  page_start int not null,
  page_end int not null,
  total_marks int not null,
  prompt text not null,
  strategy_hint text not null,
  created_at timestamptz default now()
);

create table if not exists public.question_parts (
  id text primary key,
  question_id text not null references public.questions(id) on delete cascade,
  label text not null,
  prompt text not null,
  marks int not null,
  topic text not null,
  subtopic text,
  skill text not null,
  answer_type text not null,
  created_at timestamptz default now()
);

create table if not exists public.diagram_specs (
  id text primary key,
  paper_id text not null references public.papers(id) on delete cascade,
  question_id text references public.questions(id) on delete cascade,
  spec jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.mark_scheme_items (
  id text primary key,
  question_id text not null references public.questions(id) on delete cascade,
  sub_question_id text not null,
  label text not null,
  marks int not null,
  acceptable jsonb not null default '[]'::jsonb,
  avoid_reveal_hint text not null
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id text not null references public.papers(id),
  phase text not null default 'cover',
  star_rounds jsonb not null default '[]'::jsonb,
  active_batch_question_ids jsonb not null default '[]'::jsonb,
  batch_history jsonb not null default '[]'::jsonb,
  completed_question_ids jsonb not null default '[]'::jsonb,
  scan_visited_question_ids jsonb not null default '[]'::jsonb,
  attempt_order jsonb not null default '[]'::jsonb,
  score int,
  total_marks int,
  started_at timestamptz default now(),
  submitted_at timestamptz
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  sub_question_id text not null,
  response text not null default '',
  awarded int,
  max_marks int,
  feedback jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique(attempt_id, sub_question_id)
);

create table if not exists public.exam_events (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.resource_chunks (
  id bigint generated always as identity primary key,
  paper_id text not null references public.papers(id) on delete cascade,
  source_type text not null check (source_type in ('question_paper', 'mark_scheme', 'resource')),
  source_ref text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1536)
);

create table if not exists public.student_skill_stats (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null,
  mastery numeric not null default 0,
  attempts int not null default 0,
  hint_dependency numeric not null default 0,
  updated_at timestamptz default now(),
  unique(user_id, skill)
);

create table if not exists public.progress_snapshots (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id text references public.papers(id),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create or replace function public.match_resource_chunks (
  query_embedding extensions.vector(1536),
  match_threshold float,
  match_count int,
  target_paper_id text
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    resource_chunks.id,
    resource_chunks.content,
    resource_chunks.metadata,
    1 - (resource_chunks.embedding <=> query_embedding) as similarity
  from public.resource_chunks
  where resource_chunks.paper_id = target_paper_id
    and 1 - (resource_chunks.embedding <=> query_embedding) > match_threshold
  order by resource_chunks.embedding <=> query_embedding
  limit least(match_count, 20);
$$;

alter table public.profiles enable row level security;
alter table public.exam_boards enable row level security;
alter table public.qualifications enable row level security;
alter table public.subjects enable row level security;
alter table public.syllabi enable row level security;
alter table public.student_subject_registrations enable row level security;
alter table public.papers enable row level security;
alter table public.source_documents enable row level security;
alter table public.extraction_artifacts enable row level security;
alter table public.questions enable row level security;
alter table public.question_parts enable row level security;
alter table public.diagram_specs enable row level security;
alter table public.mark_scheme_items enable row level security;
alter table public.attempts enable row level security;
alter table public.responses enable row level security;
alter table public.exam_events enable row level security;
alter table public.resource_chunks enable row level security;
alter table public.student_skill_stats enable row level security;
alter table public.progress_snapshots enable row level security;

create policy "Profiles are owned by user" on public.profiles for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Subject registrations owned by user" on public.student_subject_registrations for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Attempts are owned by user" on public.attempts for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Responses follow attempt owner" on public.responses for all using (
  exists (select 1 from public.attempts where attempts.id = responses.attempt_id and attempts.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.attempts where attempts.id = responses.attempt_id and attempts.user_id = (select auth.uid()))
);
create policy "Events follow attempt owner" on public.exam_events for all using (
  exists (select 1 from public.attempts where attempts.id = exam_events.attempt_id and attempts.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.attempts where attempts.id = exam_events.attempt_id and attempts.user_id = (select auth.uid()))
);
create policy "Skill stats owned by user" on public.student_skill_stats for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Progress snapshots owned by user" on public.progress_snapshots for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Exam boards are readable" on public.exam_boards for select using (true);
create policy "Qualifications are readable" on public.qualifications for select using (true);
create policy "Subjects are readable" on public.subjects for select using (true);
create policy "Syllabi are readable" on public.syllabi for select using (true);
create policy "Papers are readable" on public.papers for select using (true);
create policy "Public source documents are readable" on public.source_documents for select using (source_type in ('question_paper', 'structured_json', 'diagram_asset'));
create policy "Extraction artifacts are readable" on public.extraction_artifacts for select using (true);
create policy "Questions are readable" on public.questions for select using (true);
create policy "Question parts are readable" on public.question_parts for select using (true);
create policy "Diagram specs are readable" on public.diagram_specs for select using (true);

create index if not exists resource_chunks_paper_source_idx on public.resource_chunks (paper_id, source_type);
create index if not exists resource_chunks_embedding_idx on public.resource_chunks using hnsw (embedding extensions.vector_cosine_ops);
