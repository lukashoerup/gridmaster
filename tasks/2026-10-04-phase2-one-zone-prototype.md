Model: opus — Opus builds everything (workbench `docs/roles.md`).

# Task: Phase 2 — the one-zone prototype, built in slices

## Status
**In progress.** Started 2026-10-04 by Lukas's decision D16: build the
prototype now, in parallel with Phase 1, on the Phase 1 simulation core and
its placeholder data. **Slice 1 done 2026-10-04** (playable; preview
published). **Playtest 1 (Lukas, 2026-10-04): "not fun yet".** It is
passive, a cash-waiting loop, with no stats per asset after interest, no
offshore and expensive setups out of reach
(`docs/reviews/2026-10-04-playtest-1.md`). A redesign with a new slice order
was proposed (`docs/design/running-the-company.md`, Q8), then set aside by
**D17 (fun first)**. **Slices 2–5 are paused.** The next step is the
fun-core toy (`docs/design/fun-core.md`, Q9;
`tasks/done/2026-10-04-fun-core-toy.md`, built; results in
`tasks/2026-10-04-round1-results.md`). Once the toy shows a fun core, this
task is re-planned on top of it.

## Goal
Turn `docs/design/one-zone-prototype.md` (Western Denmark, 1995–2025,
approved with D10–D12 and D14) into something playable in a browser, slice
by slice, until the Phase 2 gate can be run: does cannibalisation read as a
puzzle rather than a punishment, and do testers want to keep going?

## Slices
1. **First playable (this session).** The farm with 10 kWp on the barn; wind
   turbines on the 16 sites (225/500/600 kW, then 2, 3 and 4 MW
   generations); rooftop panels on the farm; fixed tariffs until
   30 June 1999, then the hourly market with premiums by commissioning
   date; money in integer cents, project loans at the era's rates, the 2008
   credit squeeze, repay early, sell; company value (§4.5); restructuring,
   then game over; speed controls; the annual report; the historical news
   calendar; sites claimed by history over time; the end-of-chapter medal
   screen; save and resume in the browser.
2. **Solar parks and the puzzle.** Solar parks from 2010, south or
   east-west; switching off at negative prices (§4.7); the "why?" breakdown
   on every price; the market screen (ladder, capture rates, the pipeline);
   your own building's effect on the price in the build preview.
3. **Answers to cannibalisation.** Batteries (§4.6), the data-centre
   contract (§4.4), the hedge offer, the trading desk.
4. **The reward layer (D14).** Company levels (§4.9), the offer deck
   (§4.10), Nordhav (§4.11), "called it" and scorecards (§4.12), jackpots,
   records and the footprint (§4.13).
5. **Playtest kit.** The 2012 checkpoint, the session log export (§9), the
   six bots over 50 seeds, tuning to the bots' targets.

## Acceptance criteria — slice 1
- [x] Game rules in `src/game/`, pure like the simulation core (no DOM,
      clock, `Math.random`; imports only from `src/game` and `src/sim`),
      enforced by a boundary test
- [x] The player's assets enter the DK1 supply stack through
      `World.addCapacity`, so the player's own building moves the price
      (from the following year; see working notes)
- [x] Tariffs: turbines online before 1 July 1999 earn the fixed tariff for
      10 years, then the hourly price; later turbines the hourly price plus
      the premium of their commissioning period; rooftop output offsets the
      farm's own bill, the surplus is sold
- [x] Money: integer cents; loans up to 80% (60% from October 2008 for two
      years) at the era's rate, 10 or 15 years, instalments from
      commissioning; repay early; sell an asset; company value per §4.5
- [x] Restructuring after 90 days below zero, game over the second time
- [x] Speed controls: pause, ×1 (a year ≈ 2.4 min), ×3, ×10
- [x] Annual report every 31 December; medal screen at the end of 2025
- [x] Deterministic: the same seed and the same decisions give the same
      game, also after saving and resuming (test)
- [x] A scripted bot plays 1995–2025 headless without errors (test)
- [x] Tests green, typecheck clean, `npm run build` builds the game page
- [x] Published as a private preview; Lukas told what to test

## Scope
**May change:** `src/game/`, `src/play/`, `play.html`, `tests/`, `docs/`,
`tasks/`, `vite.config.ts` (the second page), `CLAUDE.md` and `README.md`
(layout and status).
**Must NOT:** change `src/sim/`, `src/data/`, `src/explorer/` or
`data/placeholder/` beyond small additions named in the PR — another
session is working on the simulation core and the explorer (D16); add
dependencies; change a decision or pillar.

## Docs affected
`docs/roadmap.md` (status), `CLAUDE.md` (layout, commands), `README.md`
(status), `docs/licences.md` (the hand-drawn map outline), the design's
numbers if a slice changes them (said so in the commit).

## Size check
Large: one session per slice, roughly. Commit per slice.

## Working notes (agent fills in)

### 2026-10-04 — slice 1, first playable

**Preview:** https://claude.ai/artifact/XcBxzvTpjkW7V1ssWT2nsg (private
Claude artifact, as Lukas asked: a single-file build of `play.html`, the
Vite single-entry bundle inlined into one page by a throwaway config outside
the repo). Saves live in the viewer's browser (localStorage).

**Layout.** `src/game/` is the rules, pure and headless (boundary test):
`tuning.ts` (every number, with the design's markers), `money.ts` (cents,
annuities), `clock.ts` (absolute hours from 1995-01-01 on the sim's
calendar), `catalogue.ts`, `sites.ts`, `market.ts` (`MarketProvider`: a
`World` over DK1, DE and NO only — Spain has no link and dropping it saves a
quarter of the time — plus a memo so the game reads the exact weather the
market cleared with), `state.ts` (plain JSON state), `engine.ts`,
`value.ts`, `events.ts`, `save.ts`, `bots.ts`. `src/play/` is the page:
plain DOM and SVG, no ECharts (the bundle is ~120 kB, 24 kB gzipped).
Outside these folders only `vite.config.ts` (the second page) and
`package.json`'s description changed; `src/sim/`, `src/data/`,
`src/explorer/` and `data/placeholder/` are untouched.

**How the player moves the price.** At each 1 January the game asks the
World for the year with the player's assets added to DK1's wind and solar
through `World.addCapacity`: each asset's MW scaled to its energy (its
capacity factor × site rating ÷ the zone's mean) and to the share of the
year it runs, as far as known then. The World simulates whole years, so an
asset ordered mid-year is a price-taker until the next 1 January; permits
and building take months, so most assets start in a later year anyway.
Changing that needs sub-year simulation in the core (another session's
area). A year of the three-zone market takes ~0.3 s in Node; 1995–2025
~9 s. The page computes the next year behind the annual-report card.

**Saves.** The state is plain JSON; the market's carried state (reservoirs,
storage, price windows) is rebuilt by replaying the years with the
capacity logged for each (`capacityLog`). A save taken mid-1998 and
resumed continues byte-identically to an uninterrupted run (test).

**Tuning changed, and why** (design §6 updated in the same commit).
- The 1999–2002 premium: €25/MWh for 22,000 full-load hours, then €13 for
  2003–07. With the design's €13 on the placeholder DK1 prices of
  1999–2003 (~€16–20/MWh), turbines built after the switch lost money and
  the wind bot went bust in 2010. The real 2000–02 turbines had a fixed
  settlement price of about €58/MWh [unverified].
- A company loan (the Finance wireframe's [Borrow], which the design left
  unspecified): debt may reach 60% of the operating assets' value, at the
  era's rate + 1 point. Without it the small turbines leave the catalogue
  in 2003 and a 2 MW turbine's equity (~€400k) is out of reach: the bots
  stopped building from 2003 to 2025.
- Bot results (seed 42, placeholder data): a cautious wind bot (a year of
  instalments as buffer) ends at €0.5m, no medal; a leveraged wind bot ends
  at €29m, bronze, after a late surge on the 2021–23 prices. The middle
  (2003–2020) is thin for wind alone; solar parks, batteries and offers
  (slices 2–4) are meant to fill it, and the slice 5 bots set the numbers.

**History's site claims.** Ten of the sixteen sites have a claim window
(`sites.ts`, [tuning]); the month is drawn from the seed; a notice comes six
months ahead; the claim takes only the room the player has not used, so
squatting with one small turbine does not block history.

**Not in slice 1** (design items for later slices): solar parks and
east-west panels, switching off at negative prices, the "why?" breakdown,
the market screen, the build preview's own price effect, batteries,
contracts, the hedge, levels, offers, Nordhav, "called it", records,
payout cards, auto-pause on price spikes and negative runs, hurricane
damage, the 2012 net-metering change, the 2022 windfall cap, the 2012
checkpoint, the session log, the six bots.

**Placeholder-price observations for Phase 1's calibration.** DK1's
1995–2003 market price is ~€16–20/MWh; its hourly prices in 1999–2003 move
in steps (28 distinct values in the second half of 1999), because the
placeholder German stack is flat; 2020s negative hours run 700–1,500 a
year.

**Checked in a browser.** Playwright (the environment's own install, not a
repo dependency) drove the built page in Chromium: welcome card, a turbine
at Thy and at Lemvig, ×10 through the annual reports 1995–2000 and the
Nord Pool card, the finance and assets tabs, a reload that resumed on the
same date; no page errors; no sideways scroll at 390 px; dark mode.

### 2026-10-04 — playtest 1 and the measured slice 1 economy
The stock `runHeadless` runner on placeholder data gives:

| Bot | Seed | Last purchase | Result |
|---|---|---|---|
| Cautious wind | 42 | 2003 | €0.46m, no medal |
| Cautious wind | 7 | 2003 | €0.49m, no medal |
| Leveraged wind | 42 | 2025 | €29m, bronze |
| Leveraged wind | 7 | 2006 | −€0.65m |

The first 600 kW turbine nets about €53k a year after its loan, so the next
one is about 5½ minutes away at ×1. Lukas's diagnosis, "waiting for cash",
is the measured structure, not a feeling. The proposed redesign and its
targets are in `docs/design/running-the-company.md` (§12): a decision at
least once a minute, the cautious bot building in every era, and the
defaults bot reaching bronze in most seeds.

