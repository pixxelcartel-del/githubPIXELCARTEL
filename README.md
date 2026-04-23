# L^2 L - Learn2 Learn

Preloaded guided mock-practice for O/A-Level and national-curriculum students. The demo ships with Cambridge O Level Physics `5054/21`, October/November 2025, using the supplied QP/MS files for seeded content.

## What Is Built

- Next.js App Router, TypeScript, Tailwind, shadcn-style primitives.
- Student dashboard with board/level/registered-subject context, topic/subtopic mastery, timing, hint reliance, attempt-order efficiency, mark-loss patterns and improvement plan.
- Guided exam simulator with cover instructions, scan-only star batch marking, `Next *`, re-star loop, final phase, native paper layers and one coaching hint per sub-question.
- Mark-scheme-aware hint and grading API routes with deterministic local fallbacks.
- Supabase schema for auth, attempts, responses, events, resource chunks, pgvector search and learner memory.
- Native typed question rendering with editable-style React diagrams for the demo paper.
- Extracted QP/MS text artifacts in `data/extracted`.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The first route redirects to `/dashboard`; the demo exam is at `/exam/demo-attempt`.

For manual review in Codex Desktop, run the built demo on port `3001` and keep the terminal open:

```bash
npm run build
powershell -ExecutionPolicy Bypass -File scripts/start-local-demo.ps1
```

Open `http://127.0.0.1:3001/dashboard`.

## Environment

Copy `.env.example` to `.env.local` when connecting external services:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

Without these keys, the demo still runs locally with fallback hints and deterministic grading.

## Supabase

Apply `supabase/migrations/0001_initial.sql` to a Supabase project. It creates:

- public paper/question/mark-scheme tables
- per-student attempts, responses and event logs
- learner skill/progress memory
- `resource_chunks` with `pgvector`
- RLS policies for user-owned learning data

## Seed Source

The seed content is based on:

- `E:/Downloads/5054_w25_qp_21.pdf`
- `E:/Downloads/5054_w25_ms_21.pdf`

The question paper says the total mark is `80`; the mark-scheme cover says `75`. The app stores `80` as the paper total and keeps both values in source metadata.

Regenerate extracted text:

```bash
python scripts/extract-paper.py
```

## Figma Direction

The functional demo follows the Figma file `9G1NryeaCO9cf0firS0stI`: paper diary surfaces, translucent cards, neon chart accents, a single hint modal, and star-batch navigation.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
```

Playwright may need browser installation with `npx playwright install` on a fresh machine.
