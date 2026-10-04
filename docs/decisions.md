# Decisions

The log of what is decided, and the questions waiting for Lukas. A decided
item is not re-opened by an agent; only Lukas re-opens it. Decisions Lukas
makes in chat are added here in the same session, with his words quoted.

## Decided

### D15 — The goal: lead Europe's energy transition (Lukas, 2026-10-04)
> "A"

Lukas chose option A in chat, answering Q7 from
`docs/reviews/2026-10-04-competition-and-goals.md`:
- **The goal.** The campaign is won by becoming the leading company of
  Europe's energy transition. That means number one by company value and by
  renewable output, in a league table against the named rivals and
  everyone else. Chapter medals stay as designed. Owning the whole market is
  not a goal.
- **Rivals.** The three named archetypes (D9) race the player for sites,
  grid room and tenders. They announce their plans, follow corporate arcs,
  and sell assets when they overbuild. Example cast: Nordhav (an incumbent
  turned green that overreaches), a federation of wind co-ops, and an
  infrastructure fund.
- **Share cap.** Above about 25% [tuning] of a zone's generation, new builds
  and purchases there need the competition authority's approval, which
  comes with a forced sale of capacity to a rival at fair value. The anchor
  is the 2006 DONG/Elsam remedy: about 2,400 MW sold to Vattenfall. Success
  therefore pushes growth abroad. Not in the one-zone prototype.
- **Ranks.** D14's levels continue in the full game: regional champion,
  then European major, then a top rank. Each opens rights: licences in new
  countries, tender prequalification, larger loans, departments.
- **"Fully renewable"** is the sandbox's shared mission to 2050, scored by
  the player's share of it. Prestige goals such as a windless week carried
  on renewables stay.
- **Takeovers** stay later (D9) and arrive first as scenario victories.

Phase 1 and the Phase 2 prototype are unchanged. `docs/vision.md` and the
first-release table in `docs/roadmap.md` carry the additions.

### D14 — The prototype gets a reward layer: the review's recommendation (Lukas, 2026-10-04)
> "Go with your recommendation, including company levels and the rival."

Answers Q6. From the fun and progression review
(`docs/reviews/2026-10-04-fun-and-progression.md`), these go into the
one-zone prototype design (`docs/design/one-zone-prototype.md`):
- **P1** "called it" reveals and project scorecards (§4.12);
- **P2** company levels the player earns: farm → co-op partner → developer
  → utility (§4.9);
- **P3** an offer deck, one optional offer every few minutes (§4.10);
- **P4** one named rival, Nordhav, as the face of history's build-out, with
  no decisions of its own (§4.11), replacing the design's "no rivals with
  names";
- **P7** jackpots, records and the player's footprint (§4.13);
- **P9** restructuring the first time the company goes bust, game over the
  second (§4.5);
- **P10** reward measures in the playtest (§9).

Deferred to after the first playtest, if testers report a dull middle or a
flat ending: P5 (local support, a Horns Rev stake, turbine-model bets) and
P8 (a hands-on December 2024 week). Not adopted now: P6 (an electric
boiler, a warning pulled earlier). The pillars are unchanged; the numbers
are tuning values for the bots and playtests to set.

### D13 — Sessions merge their own pull requests; Lukas tests and answers (Lukas, 2026-10-04)
> "But do I have to merge the PRs? I would rather spend my time testing."
> "And answering questions you ask me here."

Lukas's role in this repo is **testing** what sessions build and
**answering the questions they ask in chat**. He does not merge.

A session merges its own pull request into `main` when all of these hold:
- the work is inside an approved task file (or records Lukas's own answers);
- CI is green on the PR's head commit (once CI exists) and there is no
  merge conflict;
- the PR description says what changed and, in plain language, what Lukas
  should test, if anything.

A session never merges, and asks Lukas in chat instead, when the PR adds a
dependency not already approved (D7), changes a pillar or a decision beyond
recording his answers, or commits money. The PR stays the record and a
revert is one click. Astra reviews stay optional and never block (workbench
`docs/roles.md`).

Scope: this repo only. Elsewhere — erhvervsklubben deploys from `main` —
the workbench's own rules still apply.

D6–D12 were answered in chat on 2026-10-04: D6–D9 after the research
summary, D10–D12 after the prototype design. Each time Lukas chose the
recommended option as offered.

### D12 — Fossil plants: never built; late-game conversion only (Lukas, 2026-10-04)
Chose: "Convert, never build". The player never builds fossil plants; they
are the backdrop that sets prices. Late in the game the player may buy
retiring fossil plants for their grid connections and convert them (storage,
power-to-X). Applies to the full game; the prototype has no fossil ownership.

### D11 — The opening: panels on the barn, wind first (Lukas, 2026-10-04)
Chose: "Panels on the barn, wind first". The game starts with a few solar
panels already on the barn, earning a small trickle; the first big purchase
is a wind turbine. Historically honest (1990s Danish solar barely paid, wind
did) while keeping the brief's "start with a few solar panels".

### D10 — The prototype is set in Western Denmark (DK1), 1995–2025 (Lukas, 2026-10-04)
Chose: "Western Denmark". Reasons in `docs/design/one-zone-prototype.md` §1:
the player's own building visibly moves prices, the zone has the whole
history, and Energinet's CC BY data can calibrate it. Germany remains the
strongest candidate for the vertical slice.

### D9 — First-release scope as proposed (Lukas, 2026-10-04)
Chose: "Yes, that size". The table in `docs/roadmap.md` ("First-release
scope") is the scope: 10 zones, a 1990–2030 campaign plus sandbox, about 12
technologies including three experimental bets (liquid-air storage,
power-to-X, wave), three AI rivals, Windows and macOS. Everything else ships
as updates. Changing the table needs Lukas.

### D8 — Computers first; tablets reconsidered after launch (Lukas, 2026-10-04)
Chose: "Computers first". Windows and macOS on Steam; the phone is for
reviewing builds in a browser; no hover-only information, so a tablet
version stays possible. Answers D4's open "maybe mobile".

### D7 — Technology: TypeScript web stack (Lukas, 2026-10-04)
Chose: "Yes, web technology". Approved now, for Phases 1–2: **TypeScript,
Vite, Vitest, ECharts, fast-check**. Still needing their own approval when
the time comes: PixiJS (only if the map needs it; plain SVG first),
Electron and a Steam library (Phase 4, after a technical spike), and the
preview host for phone links (Phase 1, terms checked first). Any other
dependency still needs Lukas.

### D6 — The vision is approved (Lukas, 2026-10-04)
Chose: "Yes, go with it". `docs/vision.md` is the direction: the market
fights back, history sets the difficulty, real weather drives computed
prices. Its open design questions are for the design task; changing a
pillar needs Lukas.

### D5 — Scope: realistic, without compromising quality or fun (Lukas, 2026-10-04)
> "We also need to scope the game realistically so it is not too big of a task
> to create, but we cannot compromise on quality and fun."

Honoured by `docs/roadmap.md`: scope by systems, not content; a small first
release, polished, grown afterwards; gates that test fun before content.

### D4 — Platforms: Windows and macOS; mobile only if it proves better (Lukas, 2026-10-04)
> "I want it to be playable on macos and windows at some point. Maybe mobile if
> we think it is better."

Windows and macOS through Steam are requirements. Mobile: settled by D8.

### D3 — The name waits; "Gridmaster" is the internal working title (Lukas, 2026-10-04)
> "Lets wait on the name for a while until we know what we want."

Constraint for whoever picks it up: a Steam game titled exactly "Gridmaster"
already exists (app 2678560), so the public name must differ. Options and the
criteria for choosing: the report's naming section. Renaming is cheapest
before a Steam "Coming Soon" page starts collecting wishlists, so the name is
due by the end of Phase 3 at the latest.

### D2 — The repo is private (2026-10-04)
Created by Lukas on request. Private is the reversible choice for a commercial
game: making it public later is one click; un-publishing is impossible.

### D1 — The founding brief (Lukas, 2026-10-04)
`docs/original-brief.md`.

## Open — waiting for Lukas
Q1–Q4 were answered on 2026-10-04 and are D6–D9 above; Q6 is D14; Q7 is D15. The reasons behind
each recommendation are in the research report
(`docs/research/reports/Renewable energy tycoon game research.md`).

### Q5 — Network access for verification and data (access; can wait)
This session's environment blocked most websites (Steam, Copernicus, ENTSO-E,
Wikipedia, trademark registers), and the session's web-search budget ran out,
which is why much of the report is marked unverified. A later session needs
wider network access to verify facts and download weather data. Lukas changes
it in the environment's settings (cloud environment menu → Edit → Network
access: a broader level, or Custom with the needed domains added); steps:
https://code.claude.com/docs/en/cloud-environments#network-access.
A new session starts with a fresh search budget.

No decision above costs money. The first money decisions (art, music, the
Steam fee, accountant, Apple developer account) arise in Phase 3 and are
listed in `docs/roadmap.md`.
