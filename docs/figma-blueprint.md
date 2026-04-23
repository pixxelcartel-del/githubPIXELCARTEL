# Figma Blueprint

The current environment does not expose a callable `use_figma` tool, so the implementation includes this blueprint for the Figma file that should be created when the Figma MCP write tool is available.

## Design Direction

- Core system: Obra/shadcn style components.
- Dashboard patterns: Untitled UI and Educa LMS references.
- Chart language: Fikri-style analytics cards adapted to the product.
- Implementation parity: match Tailwind tokens in `src/app/globals.css` and shadcn-style primitives in `src/components/ui`.

## Pages

- Design System: buttons, badges, cards, progress, side nav, paper page frame, hint modal, audit rows.
- Student Dashboard: readiness, score trend, skill heatmap, cohort rank, improvement plan.
- Paper Cover: official paper preview beside strategy instructions.
- Star Scan Mode: locked answer panel, star-first controls, question map.
- Answering Mode: native paper diary, floating answer cards, `Next page`, `Next *`, single coaching hint modal.
- Re-star Prompt: next star-batch prompt.
- Results Audit: score, mark-by-mark feedback, strengths, next practice.
- Mobile Views: dashboard, exam, hint modal, results.

## Prototype Links

- Dashboard start button -> Paper Cover.
- Cover CTA -> Star Scan Mode.
- Star button toggles selected state.
- Finish scan -> Answering Mode.
- `Next *` -> next starred question state.
- Hint buttons -> Hint Modal.
- Submit -> Results Audit.
