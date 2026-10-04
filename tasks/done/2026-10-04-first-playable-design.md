Model: opus

# Task: design the one-zone prototype (Phase 2), on paper

## Status
**Done 2026-10-04.** Design approved by Lukas with D10–D12.

## Goal
Turn `docs/vision.md` into a one-to-three-page design for the Phase 2
prototype: one zone, the panel-to-market loop. A builder must be able to
implement it without guessing, and Lukas must be able to read it in five
minutes. The test of the design: it names what the player decides in the
first 45 minutes and why each decision is interesting — and it sets up the
gate question, "does cannibalisation read as a puzzle rather than a
punishment?".

## Acceptance criteria
- [x] `docs/design/one-zone-prototype.md`: the first 45 minutes, step by step —
      what the player sees, decides and learns
- [x] The three loops (operating / project / era) as they exist in the prototype
- [x] Starting numbers — money, costs, tariffs, interest, site quality — taken
      from the report and its notes, each marked as a tuning value
- [x] Pass and master goals (bronze/silver/gold) for the prototype chapter
- [x] Rough wireframes of the screens: zone map, site, merit-order ladder,
      finance, "why did my price drop?"
- [x] Each "no single best strategy" counter in the vision marked as
      implemented in the prototype or deferred
- [x] What the playtest measures, and what answer would change the design
- [x] The vision's open design questions answered, or put to Lukas if taste
- [x] Lukas has read it; his answers are committed to `docs/decisions.md`

## Scope
**May change:** `docs/design/`, `docs/vision.md` (only to resolve its open
questions, said so in the commit), `docs/decisions.md`, `tasks/`.
**Must NOT:** write code; change the pillars without Lukas; quote Power Grid
rule numbers before they are verified against the rulebook.

## Docs affected
`docs/vision.md` open questions; `docs/roadmap.md` if Phase 2 moves.

## Size check
One session.

## Working notes (agent fills in)
- Output: `docs/design/one-zone-prototype.md` (Western Denmark, 1995–2025).
- The 45-minute walkthrough reaches about 2016–2021 at mixed speeds; the full
  chapter is about an hour, so the playtest slot is 60–75 minutes and a 2012
  checkpoint save covers testers who run out of time.
- Most starting numbers are [unverified] or [tuning]; the Phase 1 toy's
  calibration and the verification pass replace them. Danish tariff and
  premium rules, interest rates and the 1999/2009/2012 dates are the ones to
  check first.
- Taste questions went to Lukas as P1–P3; he chose the recommended option
  each time (D10 DK1, D11 panels on the barn and wind first, D12 fossil
  conversion only). Builder-level choices are in the design's §10.
- No Power Grid rule numbers are quoted (they are unverified).
