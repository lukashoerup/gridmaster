Model: opus

# Task: review the plan for fun, progression and reward

## Status
**Done 2026-10-04.** Review written; its proposals wait for Lukas as Q6.

## Goal
Lukas asked in chat (2026-10-04): "Will it be fun enough with the current
plan? Are there enough satisfying progression steps? Is it rewarding enough?
Please analyse it by comparing it to other successful games and review it.
Suggest potential changes." Answer from the vision, roadmap, decisions,
prototype design and research. Compare the plan against successful
management games and propose changes, without re-opening pillars or
decisions.

## Acceptance criteria
- [x] `docs/reviews/2026-10-04-fun-and-progression.md`: verdict, risks,
      comparison with successful games, ranked proposals, what not to change
- [x] Each proposal marked with its cost; the ones needing Lukas named
- [x] Facts beyond the research are linked or marked [unverified]
- [x] Proposals needing Lukas recorded as Q6 in `docs/decisions.md`
- [x] Plain-language summary to Lukas in chat

## Scope
**May change:** `docs/reviews/`, `docs/decisions.md` (open questions only),
`docs/roadmap.md` (open-question lines), `CLAUDE.md` layout and routing,
`tasks/`.
**Must NOT:** edit the approved design or vision; re-open D6–D13; write code.

## Docs affected
`CLAUDE.md` layout and routing tables (new `docs/reviews/`); the roadmap's
open-question line and Phase 2 build note.

## Working notes (agent fills in)
- No code or tests exist yet, so "tests before commit" has nothing to run
  for this docs-only change.
- Web search worked in this session for five facts; their sources are in the
  review. Q5 still stands for bulk data downloads and the verification pass.
- The central finding: the plan has eight anti-snowball forces and one
  sentence on the rewards of growth. In the prototype's calendar, five of
  the nine events are setbacks, three are mixed and one is good news.
