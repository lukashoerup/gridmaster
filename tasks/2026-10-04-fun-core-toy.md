Model: opus — Opus builds everything (workbench `docs/roles.md`).

# Task: the fun-core toy, "build a power network on a living map"

## Status
**Waiting for Q9** (Lukas). Start only once Q9 is answered yes. If he
changes the core, update this task first.

## Goal
Find out by playing, fast, whether the core proposed in
`docs/design/fun-core.md` (§3) is fun. This is a toy, not a slice: small,
honest about being rough, and built for one test. Do 15–20 minutes of it
make Lukas want to keep playing?

## Acceptance criteria
- [ ] `toy.html` + `src/toy/`: a page beside the prototype. `src/sim`,
      `src/game`, `src/play` and `src/explorer` unchanged; the money and
      clock helpers may be imported from `src/game` (no edits there)
- [ ] One map, northwest Jutland: about 8 towns with daily and seasonal
      demand curves, about 12 resource spots fogged until scouted or built
      on, and a backbone with 2–3 substations at a national price
- [ ] Place wind turbines and solar on spots. Draw lines A→B with
      auto-routing and a cost per km; capacity shown as thickness, and
      congested lines in red
- [ ] Hunger pricing: each town's price per hour follows its supply ÷
      demand (red hungry, green satisfied, blue flooded); surplus sold to
      the backbone at the national price
- [ ] Visible flow: moving dots along lines, "+€" per town per day,
      spinning turbines, a visible day and night
- [ ] Storage, available early for the toy: charges when its town is
      blue, discharges when red
- [ ] Nordhav: baseload on the backbone; flags on spots it takes over time
- [ ] One supply-contract auction (a town tenders; sealed bid against
      Nordhav)
- [ ] Pick one of three bonuses each new year
- [ ] Chapter 1 goals, with bronze, silver and gold; a dark contracted town
      starts a countdown
- [ ] Pause and three speeds; towns grow when kept lit
- [ ] A session log: decisions per minute, and the time to the first
      self-made problem (congestion or flooding)
- [ ] Tests for the rules (pure, headless), typecheck clean, `npm run
      build` builds `toy.html`; published as a private preview; Lukas told
      what to try and the three questions

## Scope
**May change:** `src/toy/`, `toy.html`, `tests/`, `vite.config.ts` (a
third page), `docs/`, `tasks/`, `CLAUDE.md` and `README.md` (layout).
**Must NOT:** add dependencies; change `src/sim`, `src/game`, `src/play` or
`src/explorer`; use real-data claims in the toy's numbers (they are
[tuning], tuned for fun).

## Docs affected
`docs/design/fun-core.md` (what the toy taught), `docs/roadmap.md`
(Phase 2 status), `CLAUDE.md` (layout, commands).

## Size check
One session, at most two. If it grows beyond that, cut features from the
bottom of the criteria list. The flow, the hunger and the self-made
problem must survive.
