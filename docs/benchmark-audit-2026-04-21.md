# L2L Benchmark Audit - 2026-04-21

## Scope

Benchmarked the local production demo at `http://127.0.0.1:3001` for the current L^2 L / Learn2 Learn guided mock-practice flow:

`dashboard -> practice library -> exam diary -> hint/grade APIs -> saved results/resit`

The audit covered static health, production build, E2E behavior, browser runtime errors, route timings, basic accessibility/layout heuristics, API contracts, dependency security, and data/security architecture risks.

## Verification Summary

| Check | Result | Evidence |
| --- | --- | --- |
| Manual app server on `3001` | Initially down, restarted | First `Invoke-WebRequest /dashboard` could not connect; after restart `/dashboard` returned `200` and PID `14868` listened on `3001`. |
| TypeScript | Pass | `npm run typecheck` exited `0`. |
| Lint | Pass | `npm run lint` exited `0`. |
| Unit tests | Pass | `18` tests passed across `5` files. |
| Production build | Pass | `next build` completed; routes generated successfully. |
| E2E tests | Pass | `10` Playwright tests passed across desktop and mobile. |
| Browser console/page errors | Pass | Benchmark captured `0` console warnings/errors and `0` page errors. |
| Route load health | Pass | `10/10` desktop/mobile route loads returned `200`. |
| Layout heuristics | Pass | `0` horizontal overflow, `0` unlabeled interactive elements, `0` tiny text hits in benchmarked routes. |
| API contracts | Pass when called correctly | `/api/hint`, `/api/grade`, `/api/audit`, and `/api/dashboard-summary` returned `200` with expected keys. |
| Dependency audit | Pass | `npm audit --audit-level=moderate` found `0` vulnerabilities. |

Generated benchmark artifacts:

- JSON report: `test-results/benchmark-2026-04-21/benchmark-report.json`
- Screenshots: `test-results/benchmark-2026-04-21/*.png`
- Finish-scan transition check: `test-results/benchmark-2026-04-21/finish-scan-after.png`

## Route Benchmarks

| Viewport | Route | Load ms | DOM nodes | Interactive | Transfer KB | Overflow | Unlabeled |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop | Dashboard | 3860 | 541 | 20 | 267.7 | 0 | 0 |
| Desktop | Library | 2394 | 490 | 27 | 18.1 | 0 | 0 |
| Desktop | Exam cover | 1256 | 108 | 5 | 127.6 | 0 | 0 |
| Desktop | Results | 2370 | 634 | 21 | 36.0 | 0 | 0 |
| Desktop | Login | 1341 | 184 | 20 | 18.1 | 0 | 0 |
| Mobile | Dashboard | 1395 | 541 | 20 | 267.7 | 0 | 0 |
| Mobile | Library | 1794 | 490 | 27 | 18.1 | 0 | 0 |
| Mobile | Exam cover | 996 | 108 | 5 | 127.6 | 0 | 0 |
| Mobile | Results | 1513 | 634 | 21 | 36.0 | 0 | 0 |
| Mobile | Login | 841 | 184 | 20 | 18.1 | 0 | 0 |

Largest emitted static files:

| Asset | Size |
| --- | ---: |
| `0jarsh5.rb4y7.js` | 415.6 KB |
| `0n~dq4kpx9xxx.js` | 222.2 KB |
| `0y3~cortx~or~.js` | 189.3 KB |
| `03~yq9q893hmn.js` | 110.0 KB |
| `10o2cdaa0ebni.css` | 54.3 KB |

## Critical Findings

### P0 - Mark-scheme data leaks into the client bundle

The demo currently ships structured mark-scheme material in shared/client-imported code. Evidence:

- `src/lib/paper-data.ts` contains `markScheme`, `acceptable`, and `avoidRevealHint` data.
- Client components import `demoPaper` and `gradeResponses`, including `src/app/dashboard/page.tsx`, `src/components/exam-workspace.tsx`, and `src/components/results-audit.tsx`.
- Built client chunks contain mark-scheme labels such as `Change in momentum`, `Orbital speed substitution`, and grading logic.
- Supabase migration currently makes `mark_scheme_items` and `resource_chunks` readable with `using (true)`.

Impact:

Students can inspect browser bundles or public-readable database rows to recover mark-scheme points. That breaks the core mock-exam integrity model.

Recommended fix:

Split paper data into `publicPaperData` and `serverMarkSchemeData`. The client should receive question text, marks, diagrams, topic tags, and answer field metadata only. Mark-scheme points, acceptable-answer strings, grading logic, and RAG resource chunks should live behind server routes or protected DB access. Add an import guard/test so client components cannot import mark-scheme modules.

### P1 - Production demo was not running at audit start

The local manual-test URL was down when the audit began. It was fixed by restarting `next start` on port `3001`.

Impact:

Manual review can fail for operational reasons even when the code is good.

Recommended fix:

Use `scripts/start-local-demo.ps1` or an equivalent health-check wrapper as the only way to launch demos. It should stop stale listeners, run build if needed, start `next start -p 3001`, wait for `/dashboard`, and print a clear pass/fail status.

### P1 - Dashboard route is heavier than it should be

Dashboard desktop cold benchmark took `3860ms`, and the largest static chunks are `415.6 KB`, `222.2 KB`, and `189.3 KB`.

Likely causes:

- Dashboard is a large client component.
- Client imports grading/paper seed logic.
- Shared app chunks include heavy UI/animation/data paths.

Recommended fix:

Move static dashboard copy/structure into server components where possible, dynamically load chart/animation-heavy islands, and remove mark-scheme/grading imports from client paths. This will also help fix the P0 leak.

## UX / Flow Findings

### P2 - Finish-scan reset has an animation delay

The state machine correctly resets to `currentQuestionId: q1` after the first scan batch begins. However, the outgoing page animation can keep the previous question visible for about `800ms`.

Evidence:

- Immediate state after finish scan: `phase: answer`, `currentQuestionId: q1`, active batch `["q1"]`.
- Visible heading briefly showed Q9 before settling on Q1.

Impact:

The user may think the star system routed incorrectly even when state is correct.

Recommended fix:

For phase changes that reset the strategy state, reduce or disable outgoing page animation, or show a short "Returning to page 1" transition label. Add an E2E assertion that Q1 is visible after the transition completes.

### P2 - E2E coverage passed but missed the transient reset perception

Existing E2E verifies the re-star bug does not return to completed questions, but it does not explicitly check the first answer batch visibly lands on Q1 after finish scan.

Recommended fix:

Add a Playwright test:

1. Start fresh attempt.
2. Star Q1.
3. Visit all scan pages.
4. Finish scan.
5. Expect visible `Q1.` within an acceptable transition budget.
6. Assert `Q9.` is no longer visible.

## Architecture / Maintainability Findings

### P2 - `exam-workspace.tsx` is too large

`src/components/exam-workspace.tsx` is about `33 KB`. It owns hydration, persistence, hint fetching, grading submission, star navigation, diary rendering, answer cards, modal logic, and restar flow.

Impact:

High chance of regressions when changing UI/UX logic, especially around star phases.

Recommended split:

- `ExamWorkspace` orchestration shell
- `QuestionRail`
- `DiarySpread`
- `QuestionPaperPage`
- `AnswerPage`
- `AnswerCards`
- `HintCoachModal`
- `RestarPrompt`
- `ExamNavigation`

### P2 - Seed data is monolithic

`src/lib/paper-data.ts` is about `23 KB` and mixes public question content with private mark-scheme content.

Recommended split:

- `paper-public-data.ts`
- `paper-server-mark-scheme.ts`
- later, generated JSON seed + DB loader instead of large hand-edited TS data.

### P2 - API routes work but not all are wired into the UI

Search found client calls to `/api/hint` and `/api/grade`. `/api/audit` and `/api/dashboard-summary` return valid data, but are not currently called by the UI.

Recommended fix:

Either wire `/api/audit` and `/api/dashboard-summary` into results/dashboard refresh flows or remove them from the MVP surface until the Supabase-backed flow needs them.

## Database / Memory Assessment

Good:

- Supabase schema includes catalog hierarchy, attempts, responses, events, source documents, extraction artifacts, resource chunks, skill stats, progress snapshots.
- `pgvector` extension and HNSW index are present.
- Attempt/response/event/student stats tables have owner-based RLS policies.

Needs correction before real student data:

- Mark schemes and resource chunks should not be globally readable if they contain answer-bearing material.
- RAG retrieval should happen server-side with exact question/sub-question context first, semantic fallback second.
- Add seed validation that confirms total marks, question-part marks, mark-scheme point counts, source refs, and diagram specs before a paper goes live.

## Security / Dependency Notes

- `npm audit --audit-level=moderate`: `0` vulnerabilities.
- Patch updates available:
  - `@supabase/supabase-js` `2.103.2 -> 2.104.0`
  - `react` / `react-dom` `19.2.4 -> 19.2.5`
- Major updates available but should not be taken casually:
  - `eslint` `9 -> 10`
  - `typescript` `5.9 -> 6`
  - `@types/node` `20 -> 25`

## Recommended Next Execution Order

1. Fix P0 mark-scheme leakage:
   - split public and private paper data
   - move grading and mark-scheme access server-side
   - lock down Supabase mark-scheme/resource policies
   - add tests that client bundles do not contain known mark-scheme strings
2. Fix finish-scan visual transition:
   - reduce/disable stale outgoing page during phase reset
   - add E2E assertion for Q1 landing after first scan
3. Reduce dashboard bundle/client weight:
   - server-render static shell
   - lazy-load chart/animation islands
   - remove grading/data imports from dashboard client
4. Split `exam-workspace.tsx` into focused components.
5. Decide whether `/api/audit` and `/api/dashboard-summary` are active MVP routes or future stubs.
