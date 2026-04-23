# L2L UX Click Audit

## Focus

Manual-testable flows for the guided mock demo:

- Dashboard start
- Cover to scan
- Scan-all-pages gate
- Star batch selection
- `Next *` navigation
- Hint modal
- Submit and saved record creation
- Results coach
- Resit paper

## Findings Fixed

- The dashboard previously reopened a fixed `demo-attempt`, which could reopen an already submitted paper. It now creates a fresh attempt id for a new guided mock.
- Results previously linked back to the same attempt for retry. It now has a `Resit paper` action that creates a blank attempt and routes to that attempt.
- Attempt persistence only tracked one last attempt. It now keeps a local saved-record index for recent test records.
- Save status was mostly invisible. Save/resit/submit actions now expose status messages with `role="status"` / `aria-live`.
- The E2E flow only checked the first scan screen. It now checks saved records and resit behavior.

## Verification Heuristics

- A visible action that mutates records must have feedback.
- Retrying must never mutate or reopen the completed attempt.
- Results must show the saved record and allow review later.
- Scan flow must remain gated until every top-level question has been visited.
- Hint text must not leak final numeric answers before submission.

## References

- MDN Web Storage API: local browser storage is appropriate for this demo persistence layer.
- WCAG 4.1.3 Status Messages: save/submission/resit state changes should be programmatically available.
- Nielsen Norman Group usability heuristics: keep users oriented with visible system status after actions.
