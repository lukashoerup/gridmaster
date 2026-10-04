Model: opus — Opus builds everything (workbench `docs/roles.md`).

# Task: read round 1's playtests and decide what passes

## Status
**Waiting for the playtests (2026-10-04).** All four tests of round 1 are
built (`tasks/done/2026-10-04-fun-core-toy.md`). Lukas and three or four
testers play them, and each session is recorded on the test sheet.

## Goal
Turn the playtests into a verdict per toy, using the pass and fail rules
written before coding (`docs/design/fun-core.md`, "Round 1"). Then propose
the next step to Lukas: rebuild the prototype on the core that passes, or,
if a toy is mixed, one iteration on its weakest rule, then decide.

## Where the data is
- **The test sheet** (private artifact):
  https://claude.ai/artifact/CuULHBA3XAWhQgrmi9Wf2M. Answers are in its
  `db`, collection `sessions`; read them with ArtifactData `list` (add
  `out_dir` when there are many). Each document holds:
  - tester and toy (`hubs`, `board`, `tuned`), minutes played, and
    `pastStop` (kept playing past 15 minutes, unasked);
  - `keep` (1–5), and `moneyWords` with Lukas's `moneyJudged`;
  - `regret`, `fun` plus `funWatching`, `waiting` and `notes`;
  - `score` and `bot`, the parsed `logSummary`, and the raw `log`.
- The sheet's scorecard computes the same rules live. This task checks it,
  reads the raw logs and the testers' own words, and writes down what the
  numbers alone miss.
- Lukas may also report results in chat. Record what he says in the
  repo in the same session.

## Steps
- [ ] Read every session; check that the scorecard's numbers match the logs.
- [ ] Per toy: the verdict (pass, mixed, fail), the weakest rule, and the
      testers' words that explain it.
- [ ] Add the human results to "Round 1 so far" in `docs/design/fun-core.md`.
- [ ] Put the proposed next step to Lukas in plain words. A choice of core
      or a change of plan is his decision: record it in `docs/decisions.md`.
- [ ] Update `docs/roadmap.md` (Phase 2 status).

## Scope
**May change:** `docs/`, `tasks/`. A follow-up build (an iteration on a
toy, or the rebuild) gets its own task file after Lukas decides.
**Must NOT:** change code; judge a toy on fewer than three testers without
saying so.

## Docs affected
`docs/design/fun-core.md`, `docs/roadmap.md`, `docs/decisions.md`.
