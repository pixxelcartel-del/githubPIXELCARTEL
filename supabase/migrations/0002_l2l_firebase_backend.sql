create schema if not exists l2l;

grant usage on schema l2l to anon, authenticated, service_role;
grant all on all tables in schema l2l to authenticated, service_role;
grant all on all routines in schema l2l to authenticated, service_role;
grant all on all sequences in schema l2l to authenticated, service_role;

create table if not exists l2l.student_profiles (
  firebase_uid text primary key,
  email text not null,
  display_name text,
  board text not null default 'Cambridge',
  qualification text not null default 'O Level',
  curriculum_track text not null default 'International',
  registered_subjects jsonb not null default '["Physics"]'::jsonb,
  primary_subject text not null default 'Physics',
  target_session text,
  weekly_mock_target int not null default 2,
  onboarding_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists l2l.exam_boards (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists l2l.qualifications (
  id text primary key,
  board_id text not null references l2l.exam_boards(id),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists l2l.subjects (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists l2l.syllabi (
  id text primary key,
  board_id text not null references l2l.exam_boards(id),
  qualification_id text not null references l2l.qualifications(id),
  subject_id text not null references l2l.subjects(id),
  code text not null,
  title text not null,
  created_at timestamptz default now()
);

create table if not exists l2l.student_subject_registrations (
  id bigint generated always as identity primary key,
  firebase_uid text not null references l2l.student_profiles(firebase_uid) on delete cascade,
  syllabus_id text not null references l2l.syllabi(id),
  status text not null default 'active',
  created_at timestamptz default now(),
  unique(firebase_uid, syllabus_id)
);

create table if not exists l2l.papers (
  id text primary key,
  syllabus_id text references l2l.syllabi(id),
  board text not null,
  qualification text not null,
  curriculum_track text not null,
  syllabus_code text not null,
  code text not null,
  subject text not null,
  component text not null,
  session text not null,
  duration_minutes int not null,
  total_marks int not null,
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists l2l.source_documents (
  id bigint generated always as identity primary key,
  paper_id text not null references l2l.papers(id) on delete cascade,
  source_type text not null check (source_type in ('question_paper', 'mark_scheme', 'structured_json', 'diagram_asset')),
  storage_path text not null,
  original_path text,
  extraction_status text not null default 'needs-review',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists l2l.extraction_artifacts (
  id bigint generated always as identity primary key,
  source_document_id bigint not null references l2l.source_documents(id) on delete cascade,
  artifact_type text not null,
  storage_path text not null,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists l2l.questions (
  id text primary key,
  paper_id text not null references l2l.papers(id) on delete cascade,
  number int not null,
  title text not null,
  page_start int not null,
  page_end int not null,
  total_marks int not null,
  prompt text not null,
  strategy_hint text not null,
  created_at timestamptz default now()
);

create table if not exists l2l.question_parts (
  id text primary key,
  question_id text not null references l2l.questions(id) on delete cascade,
  label text not null,
  prompt text not null,
  marks int not null,
  topic text not null,
  subtopic text,
  skill text not null,
  answer_type text not null,
  created_at timestamptz default now()
);

create table if not exists l2l.diagram_specs (
  id text primary key,
  paper_id text not null references l2l.papers(id) on delete cascade,
  question_id text references l2l.questions(id) on delete cascade,
  spec jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists l2l.mark_scheme_items (
  id text primary key,
  question_id text not null references l2l.questions(id) on delete cascade,
  sub_question_id text not null,
  label text not null,
  marks int not null,
  mark_type text,
  dependencies jsonb not null default '[]'::jsonb,
  acceptable jsonb not null default '[]'::jsonb,
  required_concepts jsonb not null default '[]'::jsonb,
  numeric_tolerance numeric,
  unit_requirement jsonb not null default '[]'::jsonb,
  forbidden_contradictions jsonb not null default '[]'::jsonb,
  avoid_reveal_hint text not null,
  evidence_hint text,
  student_feedback text
);

create table if not exists l2l.attempts (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null references l2l.student_profiles(firebase_uid) on delete cascade,
  paper_id text not null references l2l.papers(id),
  phase text not null default 'cover',
  star_rounds jsonb not null default '[]'::jsonb,
  active_batch_question_ids jsonb not null default '[]'::jsonb,
  batch_history jsonb not null default '[]'::jsonb,
  completed_question_ids jsonb not null default '[]'::jsonb,
  scan_visited_question_ids jsonb not null default '[]'::jsonb,
  attempt_order jsonb not null default '[]'::jsonb,
  score int,
  total_marks int,
  grade_provenance text,
  started_at timestamptz default now(),
  submitted_at timestamptz
);

create table if not exists l2l.responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references l2l.attempts(id) on delete cascade,
  sub_question_id text not null,
  response text not null default '',
  awarded int,
  max_marks int,
  feedback jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique(attempt_id, sub_question_id)
);

create table if not exists l2l.exam_events (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references l2l.attempts(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists l2l.resource_chunks (
  id bigint generated always as identity primary key,
  paper_id text not null references l2l.papers(id) on delete cascade,
  source_type text not null check (source_type in ('question_paper', 'mark_scheme', 'resource')),
  source_ref text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1536)
);

create table if not exists l2l.student_skill_stats (
  id bigint generated always as identity primary key,
  firebase_uid text not null references l2l.student_profiles(firebase_uid) on delete cascade,
  skill text not null,
  mastery numeric not null default 0,
  attempts int not null default 0,
  hint_dependency numeric not null default 0,
  updated_at timestamptz default now(),
  unique(firebase_uid, skill)
);

create table if not exists l2l.progress_snapshots (
  id bigint generated always as identity primary key,
  firebase_uid text not null references l2l.student_profiles(firebase_uid) on delete cascade,
  paper_id text references l2l.papers(id),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create or replace function l2l.firebase_uid()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

create or replace function l2l.match_resource_chunks (
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
  from l2l.resource_chunks
  where resource_chunks.paper_id = target_paper_id
    and resource_chunks.source_type <> 'mark_scheme'
    and coalesce((resource_chunks.metadata ->> 'answer_bearing')::boolean, false) = false
    and 1 - (resource_chunks.embedding <=> query_embedding) > match_threshold
  order by resource_chunks.embedding <=> query_embedding
  limit least(match_count, 20);
$$;

alter table l2l.student_profiles enable row level security;
alter table l2l.student_subject_registrations enable row level security;
alter table l2l.attempts enable row level security;
alter table l2l.responses enable row level security;
alter table l2l.exam_events enable row level security;
alter table l2l.student_skill_stats enable row level security;
alter table l2l.progress_snapshots enable row level security;
alter table l2l.exam_boards enable row level security;
alter table l2l.qualifications enable row level security;
alter table l2l.subjects enable row level security;
alter table l2l.syllabi enable row level security;
alter table l2l.papers enable row level security;
alter table l2l.source_documents enable row level security;
alter table l2l.extraction_artifacts enable row level security;
alter table l2l.questions enable row level security;
alter table l2l.question_parts enable row level security;
alter table l2l.diagram_specs enable row level security;
alter table l2l.mark_scheme_items enable row level security;
alter table l2l.resource_chunks enable row level security;

create policy "Students own their profile" on l2l.student_profiles for all using (firebase_uid = l2l.firebase_uid()) with check (firebase_uid = l2l.firebase_uid());
create policy "Student registrations are private" on l2l.student_subject_registrations for all using (firebase_uid = l2l.firebase_uid()) with check (firebase_uid = l2l.firebase_uid());
create policy "Student attempts are private" on l2l.attempts for all using (firebase_uid = l2l.firebase_uid()) with check (firebase_uid = l2l.firebase_uid());
create policy "Student skill stats are private" on l2l.student_skill_stats for all using (firebase_uid = l2l.firebase_uid()) with check (firebase_uid = l2l.firebase_uid());
create policy "Student progress snapshots are private" on l2l.progress_snapshots for all using (firebase_uid = l2l.firebase_uid()) with check (firebase_uid = l2l.firebase_uid());

create policy "Responses follow attempt owner" on l2l.responses for all using (
  exists (select 1 from l2l.attempts where attempts.id = responses.attempt_id and attempts.firebase_uid = l2l.firebase_uid())
) with check (
  exists (select 1 from l2l.attempts where attempts.id = responses.attempt_id and attempts.firebase_uid = l2l.firebase_uid())
);

create policy "Events follow attempt owner" on l2l.exam_events for all using (
  exists (select 1 from l2l.attempts where attempts.id = exam_events.attempt_id and attempts.firebase_uid = l2l.firebase_uid())
) with check (
  exists (select 1 from l2l.attempts where attempts.id = exam_events.attempt_id and attempts.firebase_uid = l2l.firebase_uid())
);

create policy "Catalog boards are readable" on l2l.exam_boards for select using (true);
create policy "Catalog qualifications are readable" on l2l.qualifications for select using (true);
create policy "Catalog subjects are readable" on l2l.subjects for select using (true);
create policy "Catalog syllabi are readable" on l2l.syllabi for select using (true);
create policy "Catalog papers are readable" on l2l.papers for select using (true);
create policy "Public-safe source documents are readable" on l2l.source_documents for select using (source_type in ('question_paper', 'structured_json', 'diagram_asset'));
create policy "Extraction artifacts are readable" on l2l.extraction_artifacts for select using (true);
create policy "Question text is readable" on l2l.questions for select using (true);
create policy "Question parts are readable" on l2l.question_parts for select using (true);
create policy "Diagram specs are readable" on l2l.diagram_specs for select using (true);
create policy "Non-answer chunks are readable" on l2l.resource_chunks for select using (
  source_type <> 'mark_scheme'
  and coalesce((metadata ->> 'answer_bearing')::boolean, false) = false
);

create index if not exists l2l_resource_chunks_paper_source_idx on l2l.resource_chunks (paper_id, source_type);
create index if not exists l2l_resource_chunks_embedding_idx on l2l.resource_chunks using hnsw (embedding extensions.vector_cosine_ops);
create index if not exists l2l_attempts_firebase_uid_idx on l2l.attempts (firebase_uid, paper_id);

insert into storage.buckets (id, name, public)
values
  ('l2l-source-documents', 'l2l-source-documents', false),
  ('l2l-extraction-artifacts', 'l2l-extraction-artifacts', false),
  ('l2l-diagram-assets', 'l2l-diagram-assets', false)
on conflict (id) do nothing;
