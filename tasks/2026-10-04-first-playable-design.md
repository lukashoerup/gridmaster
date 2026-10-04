Model: opus

# Task: design the one-zone prototype (Phase 2), on paper

## Status
**Blocked** on decision Q1 (vision approved). Needs no code, so it can run
in parallel with the Phase 1 market toy once Q1 is answered.

## Goal
Turn `docs/vision.md` into a one-to-three-page design for the Phase 2
prototype: one zone, the panel-to-market loop. A builder must be able to
implement it without guessing, and Lukas must be able to read it in five
minutes. The test of the design: it names what the player decides in the
first 45 minutes and why each decision is interesting — and it sets up the
gate question, "does cannibalisation read as a puzzle rather than a
punishment?".

## Acceptance criteria
- [ ] `docs/design/one-zone-prototype.md`: the first 45 minutes, step by step —
      what the player sees, decides and learns
- [ ] The three loops (operating / project / era) as they exist in the prototype
- [ ] Starting numbers — money, costs, tariffs, interest, site quality — taken
      from the report and its notes, each marked as a tuning value
- [ ] Pass and master goals (bronze/silver/gold) for the prototype chapter
- [ ] Rough wireframes of the screens: zone map, site, merit-order ladder,
      finance, "why did my price drop?"
- [ ] Each "no single best strategy" counter in the vision marked as
      implemented in the prototype or deferred
- [ ] What the playtest measures, and what answer would change the design
- [ ] The vision's open design questions answered, or put to Lukas if taste
- [ ] Lukas has read it; his answers are committed to `docs/decisions.md`

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
