Model: opus

# Task: analyse playtest 1 and propose an improved design

## Status
**Done 2026-10-04.** Design proposed; adoption waits for Lukas as Q8.

## Goal
Lukas played slice 1 of the prototype and found it passive, a loop of
waiting for cash. He found it short of per-asset stats, missing offshore,
and too expensive to grow. He asked to "analyze this feedback, compare to
the existing plan and come up with an improved game design".

## Acceptance criteria
- [x] `docs/reviews/2026-10-04-playtest-1.md`: his words, what he played,
      the measured economy, root causes, his points against the plan
- [x] `docs/design/running-the-company.md`: the improved design, builder-
      ready, with tuning markers, a slice order, risks and bot targets
- [x] Q8 in `docs/decisions.md`; the Phase 2 task and roadmap say slice 2
      waits on it
- [x] Plain-language summary to Lukas in chat

## Scope
**May change:** `docs/`, `tasks/`, `CLAUDE.md` (layout).
**Must NOT:** change code; change a decision; start slice 2.

## Working notes (agent fills in)
- The measurements used throwaway tests (not committed) running the stock
  `runHeadless` with `windBot` and `leveragedWindBot` on seeds 42 and 7.
- Sources for the real-world anchors (condition monitoring, vortex
  generators, measurement campaigns, develop-build-sell, the Anholt tender)
  are in the review.
