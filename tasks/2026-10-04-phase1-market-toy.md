Model: opus — Opus builds everything since 2026-10-04 (workbench `docs/roles.md`); this task was marked `fable` as foundation work before that rule changed.

# Task: Phase 1 — the market toy

## Status
**In progress.** Parts (a) core and (d) explorer were built on 2026-10-04 on
placeholder inputs (branch `claude/wizardly-ritchie-anzv17`). Parts (b)
real-data pipeline and (c) calibration are **blocked on network access**
(decision Q5): the environment still blocks Copernicus, Ember, Energinet and
the World Bank, so no real data was fetched and none of unknown licence was
substituted. The stack is approved (decision D7): TypeScript, Vite, Vitest,
ECharts, fast-check — nothing else without Lukas.

## Goal
Prove the simulation before any gameplay exists (`docs/roadmap.md`, Phase 1).
A headless, deterministic core turns weather, demand and fuel prices into
hourly electricity prices for a few European zones over 1995–2025, and a small
web page lets Lukas explore it from a link on his phone. The gate is his
judgement: do the prices behave like the real ones?

## Acceptance criteria
- [x] Simulation core with no UI dependencies; seeded and deterministic (same
      seed and inputs → identical output, asserted by a test)
- [ ] Zones: Western Denmark (DK1 — not DK2), Germany, Norway (one zone is
      fine), Spain; years 1995–2025. DK1 needs most care: the one-zone
      prototype (`docs/design/one-zone-prototype.md` §4.1) runs on it, with
      the toy's DE and NO prices as its neighbours across two links
      (historical capacities), its historical thermal fleet and others'
      wind and solar build-out, and regulated mode until 30 June 1999
      — *mechanism done (four zones, two DK1 links plus DE–NO from 2021,
      regulated mode until 1999-07-01); capacities and fleets are placeholder
      approximations, not historical data: waits for (b)*
- [ ] Weather: zone-level hourly wind and solar capacity factors built from
      real weather years (ERA5 or the Copernicus PECD — see the data notes),
      a different weather year drawn per game year from the seed
      — *interface and per-(seed, year) draw done; the source is a seeded
      synthetic placeholder, not real weather: waits for (b)*
- [ ] Demand: an hourly shape scaled to each year's national demand
      — *shape and scaling done; the annual demand values are placeholders*
- [ ] Supply: the incumbent fleet by technology and year, marginal costs from
      historical fuel prices (World Bank Pink Sheet) and carbon prices from 2005
      — *marginal-cost formula and carbon from 2005 done; fleets and fuel
      prices are placeholders*
- [x] Price: hourly merit-order clearing per zone, with scarcity pricing,
      negative bids from subsidised output, interconnector limits (simple
      transport model) and a water-value rule for reservoir hydro
- [ ] Calibration report (markdown + charts): simulated against real
      statistics — annual mean, price-duration curve, capture rates, count of
      negative hours — from openly licensed data (Energinet covers DK, DE, SE
      and NO under CC BY 4.0; ENTSO-E for Spain only once its re-use terms are
      verified). The method is the report's section "Ship real weather, but
      compute the prices" — *blocked on Q5*
- [ ] Explorer page with a preview link: pick zone, year, seed; a slider "add
      X GW of solar to this zone" that shows cannibalisation happening
      — *page built (`npm run build` → `dist/`); the preview link is the
      coordinator's publishing step*
- [x] Headless speed recorded (target: one simulated year, four zones, < 1 s)
- [ ] Tests green in CI; `CLAUDE.md` gains the test command
      — *77 tests green locally and the workflow is in place; the first CI run
      happens when the branch is pushed; `CLAUDE.md` has the commands*

## Prerequisites to check before starting
- Every dataset gets its row in `docs/licences.md` **before** it is committed;
  non-commercial data (Renewables.ninja's datasets) is never used.
- Network access: the 2026-10-04 session could not reach Copernicus, Ember or
  Energinet through the environment's network policy. If still blocked, stop
  and ask Lukas (he changes it in the environment settings) rather than
  substituting data from a source whose licence is unknown.
- A Copernicus data-store account may be needed for ERA5 downloads: an access
  decision for Lukas, not something to create silently.
- Preview hosting for the explorer link: propose a host to Lukas with its
  terms checked (some free tiers are non-commercial only) before deploying.
- Architecture rules from the report's build section apply from the first
  commit: fixed one-hour timestep, seeded RNG in the save, no wall-clock or
  UI imports inside the simulation, money in integer cents.
- Keep each run's hourly zone prices retrievable, either stored or
  recomputable deterministically, and keep an asset's revenue a pure
  function of its output and those prices. Phase 2's "called it" reveals
  and trading desk re-price single assets against them
  (`docs/design/one-zone-prototype.md` §4.9, §4.12; D14).

## Scope
**May change:** the simulation package, `data/` (processed, licence-checked
extracts only — raw downloads stay out of git), `docs/`, `tasks/`, CI config.
**Must NOT:** add dependencies beyond the approved stack; commit raw datasets;
build gameplay (that is Phase 2).

## Docs affected
`docs/licences.md` (each dataset), `docs/roadmap.md` (phase status),
`CLAUDE.md` (commands), the data notes if a finding contradicts them.

## Size check
Large — likely 2–4 sessions. Natural split: (a) core with synthetic data and
tests; (b) real-data pipeline; (c) calibration report; (d) explorer page.
Commit after each.

## Working notes (agent fills in)
- D14 requirement (merged from main; contract corrected 2026-10-04 after
  testing, finding F3): a year's hourly zone prices are a pure function of
  the inputs (including capacity added with `addCapacity`), the seed, the
  year **and the starting state** — reservoir levels, storage charge and the
  recent-price windows of storage and the water value. The state is
  explicit: `World.snapshot()` returns it as plain JSON-safe data and
  `World.restore(state)` loads it, so a save keeps the state of 1 January;
  replaying from 1995 on a fresh world reproduces the long run exactly
  (`tests/world.test.ts`: snapshot → JSON → restore → identical hashes, and
  the golden hash). Simulating the same year twice on one world starts from
  different states, by design. A technology's capture price is computed only
  from its output and those prices (`src/sim/stats.ts`). Per-asset
  re-pricing for Phase 2's reveals and trading desk builds on that.

### 2026-10-04 — parts (a) and (d) on placeholder inputs

**Layout.** `src/sim/` is the pure core: `rng.ts` (sfc32, saveable 4×32-bit
state, stream hashing so the weather of (seed, year) is reproducible alone),
`calendar.ts` (pure dates, leap years, weekday), `inputs.ts` (types, keyframe
interpolation, a validator with path-naming errors), `weather.ts`
(`WeatherSource` interface + `SyntheticWeather`), `demand.ts`, `market.ts`
(`ClearingEngine`), `world.ts` (`World.simulateYear`, `addCapacity`,
`hashYearResult`), `stats.ts`, `hash.ts`. `src/data/placeholder.ts` loads
`data/placeholder/*.json`. `src/explorer/` holds the page (`protocol.ts` is
shared by the Web Worker and the inline fallback). Tests in `tests/`
(11 files, 77 tests). CI: `.github/workflows/ci.yml` (checkout + setup-node
only): `npm ci`, `tsc --noEmit`, `vitest run`, `vite build`.

**Market design as built.** Blocks bid fuel ÷ efficiency + CO₂ × factor ÷
efficiency + variable O&M; each thermal fleet is split into three efficiency
tranches (0.85/1.0/1.15 of the average) so the stack is not one flat step.
Must-run shares (nuclear 60 %, lignite 35 %, CHP seasonal) bid below zero.
Wind and solar bid in two tranches: a flexible share at −0.5 (or 0 without
support) and the rest at minus the support premium. Price floor 0 before the
zone's negative-price date, −500 after; cap 3000. **Scarcity:** every bid is
lifted by (cap − bid)·s³ where s rises from 0 at the reserve margin (12 % of
demand) to 1 when spare capacity is gone; applied before clearing so storage
sees it. Since the tester fixes, s is per zone (own demand; own offers plus
what the links can bring in from neighbours' spare), not per coupled group.
**Coupling:** zones joined by links are cleared as one merged merit
order (Nord Pool style market splitting): when a resulting flow exceeds a
link, that link is fixed at its full capacity, the group splits and is
re-cleared; a link that ends up flowing from the dearer zone is released and
re-solved (up to three times per link and hour). Uncongested zones therefore
share one price exactly, held inside the highest floor and lowest cap of the
group.
**Water value:** ref × exp(4 × (target fill − fill)), collapsing
above 90 % fill; ref is the trailing 30-day capacity-weighted price of the
linked zones (the cheapest thermal cost for Spain, which has no link), times
a zone factor; the twelve monthly targets are read as mid-month values and
interpolated daily. Three tranches at 0.8/1.0/1.3 × value; forced output
when the reservoir would overflow. **Storage:** charge below the rolling
25th percentile, discharge above the 75th, of the computed market price over
the last 168 hours, with a minimum spread that also holds between the two
bids, so a plant never buys and sells in the same hour; charging is a
price-sensitive demand block, discharge a supply block, so storage sets the
price when marginal. **Fuel and carbon** follow a continuous path through
the annual values (no New Year step; each year averages to its input). Money: no ledger yet
(nothing is bought or sold in the toy); the rule "integer cents" applies
when Phase 2 adds one.

**Speed measured.** One simulated year, four zones, including statistics:
median 0.45–0.50 s over five runs in Node 22 on the session's container
(min 0.40 s, max 0.72 s); 0.47 s after the tester fixes. Target < 1 s met.
Thirty-one years in sequence: 12.3 s. `npm run bench` prints the per-year
figure.

**Determinism.** `hashYearResult` (two FNV-1a streams over prices, dispatch,
flows, storage, reservoir) is identical across runs and differs by seed;
`tests/world.test.ts` holds a golden hash for seed 42, 2019 — recompute it
on any intended model or data change; its history is in the test file.

**Sanity checks on the placeholder world (seeds 42 and 7).**
- DE midday sag in the 2020s: yes (2024 hour-of-day means fall from ~75 at
  night to ~46 at 13:00 and rise to ~83 in the evening); none in 2005. Test.
- DE negative hours: 0 in 2007, 19 in 2009, ~100 in 2015, ~600 in 2019,
  ~1,200 in 2024, ~1,600 in 2025. Appears when it should, but the 2020s
  counts are 2–3× the real ones (457 in 2024): calibration item. Test.
- Solar capture rate falls with solar share: DE 2020 base → +20 GW → +50 GW
  strictly falling; DE solar capture ~1.0 in 2008, ~0.6 in 2024; ES 0.45 in
  2025. Test.
- NO smoother than DK1: true from 2019 on (e.g. 2024 sd 18 vs 29), **false
  in 2005–2015** in the toy, because the placeholder German stack is so flat
  then that DK1 (coupled to it most hours) has sd 4–8 where the real DK1 had
  ~12, and wet synthetic years park Norway near zero while coupling pulls it
  up. Test covers 2019+ only; calibration item.
- DK1 tracks its neighbours except when links are full: exact equality with
  DE whenever the DK1–DE link is not fixed; separation (>1 €/MWh) in hundreds
  of congested hours; the exporter is never dearer across a fixed link in the
  tested year. Test.
- Annual means 1995–2025, seed 42 (DE): 29 (2000), 45 (2005), 59 (2008),
  31 (2015), 35 (2019), 74 (2021), 132 (2022), 85 (2023), 70 (2024) — the
  shape of history with 2022 the dearest year everywhere, though 2022 DE is
  low (real ~235) because coal, not gas, is marginal in the toy. ES 2022: 176
  (real ~168). NO 2022: 28 (real south ~200, north ~25). No unserved energy
  in any year. Test (loose bounds).
- Not plausible yet, for calibration: DK1–NO link full ~80 % of hours;
  negative-hour counts in the 2020s; DE 2022 level; NO's price level in dry
  years; NO wind capture rate above 1.3 in 2022.

**Contradictions with the research notes.** Storage uses a 7-day window
instead of the notes' "rolling 24-hour quantile" (a day is too short to
tell a cheap day from a cheap hour). Coupling is merged clearing with
splitting rather than the iterative flow heuristic; same outcome, exact
convergence when uncongested, and a cycle (DE–NO from 2021) is handled.
The water value's anchor (neighbour prices) is an addition the notes do not
mention; anchoring to thermal cost alone made Norway far too cheap.

**What is placeholder.** Everything under `data/placeholder/`: demand,
capacities (DE gas includes "other" capacity to stand in for the neighbours
the toy lacks; ES gas includes ~5 GW of cogeneration), fuel and carbon
prices, link capacities, support premiums, the demand daily shapes in
`demand.ts`, every weather parameter, Spain's negative-price date
(2024-01-01, a guess), the regulated prices before market opening. The
weather generator itself is a placeholder to be replaced, not calibrated.

**Known gaps.** Germany has only DK1 and NO as neighbours (no FR, NL, PL,
CZ, AT, CH), so its imports in scarce hours are understated and its
surpluses overstated. No forced outages. The splitting heuristic with its
wrong-way repair is not a full LP: with different price floors in one group
it can still show a link flowing from the dearer zone (none in the placeholder
world). Must-run CHP has no heat storage or bypass.
Hydro has one reservoir per zone. The explorer's selected year starts from
the long run's state of 1 January (provisional, from standard levels, until
the long run gets there), so it matches the long-run charts.
The page was not viewed in a browser in this environment (none available);
its protocol and chart builders are tested headless. `npm install` needs
`legacy-peer-deps` (in `.npmrc`) because npm 10 crashes resolving vitest
4's optional peers; `npm ci` is unaffected. ECharts makes the bundle 657 kB
(224 kB gzipped).

**What (b) needs.** Network access (Q5) to Copernicus (PECD 4.2 or ERA5;
an account decision for Lukas), Ember/Eurostat (demand, capacity), the
World Bank Pink Sheet (fuels), a licensed carbon series, TSO link capacities;
offline preprocessing tooling (Python with xarray, or a TypeScript script)
is a dependency decision; each dataset gets its `docs/licences.md` row
first. The code is ready for it: a new `WeatherSource` for real
weather-years, and new JSON files in the same keyframe format.
**What (c) needs.** Energinet (CC BY 4.0) prices for DK1, DE, NO (and SE)
for 2015–2024; a script computing annual mean, price-duration curve,
capture rates and negative hours from them; then tuning of fleets, the
scarcity curve, support premiums and water values until the shapes match,
written up as a markdown report with charts.

### 2026-10-04 — fixes after the three Phase 1 test reports

Three testers reviewed parts (a) and (d) on `7cadbaa`: a stress tester
(findings F1–F16), an energy-market analyst (B1–B11) and a browser QA pass
(M1–M3, m1–m13, c1–c5). Their reports and scripts are in that session's
scratchpad, not in the repo. Every fix below has a regression test built
from the report's reproduction where there was one.

**Market clearing (`src/sim/market.ts`).**
- F1: the per-zone `importerRoom` cap is gone. A fixed link carries its full
  capacity whenever the importer's group can use it (demand, storage
  charging, transit); fixed links are re-applied at full capacity on every
  pass, and only a group that cannot absorb its imports at all is scaled
  down (a safety net that never triggered in 20,000 fuzzed meshes). Seed 42,
  2019: congested link-hours below capacity 178 → 0.
- F2: scarcity is computed per zone, once per hour, before clearing: own
  demand (exports are not firm) against own offers plus what each link could
  bring in from the neighbour's own spare. Because the lifted bids no longer
  depend on the grouping, merged and split groups price consistently. The
  repro prices the exporter at 10 (was 539). The wrong-way repair releases a
  link up to three times per hour, largest mismatch first, instead of once.
  Wrong-way link-hours: DE demand +20 % 2024, seeds 1/2: 101/68 → 0/0; all
  demand +15 % 2022: 202/26 → 0/0; reserve 0.25 2022: 32/20 → 0/0; NO
  reservoir 0 TWh 2010: 85 → 0; 1995–2025 seed 1: 26 → 0. Fuzz, 20,000
  four-zone meshes with storage and reserve margins: 0 with equal floors.
- F7: a group with no offers and no demand is priced at 0 (inside its
  limits), not at the cap.
- F13: a coupled group's price is held inside its highest floor and lowest
  cap; offers are still dispatched by their own bids, and a charge bidding
  below the group floor does not buy. Free links now always show one price
  (old engine: 4,764 of 20,000 fuzzed cases with mixed floors did not). Known
  leftover: with mixed floors, a group held at a floor of 0 that passes power
  on to a zone priced below 0 shows as wrong-way by price (2 in 20,000 fuzzed
  cases; impossible in the placeholder world, where only DE has the lower
  floor).
- F11: `addBlock`, `addCharge`, `setLinks` and the per-zone demand, floor,
  cap and reserve inputs throw a clear error on NaN, infinities, negative
  sizes, unknown zones and self-links.
- F16 (part): `congested` (engine and `LinkYear`) is 1 only when the link is
  fixed and the prices on its two sides differ.
- Calibration impact: annual means 1995–2025 (seeds 42 and 1, all zones)
  move by at most 0.11 €/MWh, except Norway's 2005 blackout year for seed 1
  (884.8 → 885.5); negative-hour counts change by at most one hour; DE 2009
  negative hours unchanged (19 and 34 for seeds 42/7).
- Golden hash (seed 42, 2019): `18e65696d6daa883` → `f760731eca2d0449`, from
  F1 alone (scarcity never binds in that year).

**World state and determinism (`src/sim/world.ts`, `src/explorer/protocol.ts`).**
- F3 / analyst B6 / QA M3: the carried state is explicit (`WorldState`,
  `snapshot()`, `restore()`; validated on restore) and the contract is in the
  `world.ts` header and the D14 note above. The water value's anchor is now
  summed afresh from its window, so a restored window gives a bit-identical
  mean.
- Explorer: the long run is the baseline of a seed (no slider solar), cached
  per seed in the worker, and records the state at each 1 January. A
  single-year view and the solar curve start from that state once it
  exists, so the summary equals the long-run charts for the same zone, year
  and seed (test: year view stats = long-run stats). Before that, the year
  is computed from the fresh state, marked provisional on the page, and
  recomputed automatically when the long run reaches it. Zone and year
  changes no longer restart the long run; a superseded long run stops
  between years and resumes from its cache.
- F15: new storage starts empty; when its energy capacity shrinks the energy
  above it is dropped at 1 January, and storage that disappears loses its
  charge (documented in the `world.ts` header).
- F12: `simulateYear` rejects non-integer years and years outside the
  inputs' range, which is now explicit in the data (`zones.json`
  `years: [1995, 2025]` → `WorldInputs.firstYear/lastYear`). Seeds must be
  integers in 0…4294967295 (unsigned 32-bit); others are rejected instead of
  wrapped. The explorer only offers that range (see the explorer fixes).
- Golden hash: `f760731eca2d0449` → `8ff7768adee91c59` (storage starts
  empty; anchor mean summed afresh). Speed: median 447 ms per year (was 411).

**Smaller core fixes.**
- F4: `captureRate` is `null` when the year's mean price is at or below
  1 €/MWh (`CAPTURE_RATE_MIN_MEAN_PRICE`); the explorer shows a gap or "–".
- F5: the demand-noise stream id hashes the whole zone id (`hashString`,
  FNV-1a then mixed): DK1, DK2, DXX, SE1–4 and NO1–5 all differ.
- F6: `World` sizes the engine from the technologies (39 blocks and 2
  charges per zone; any zone may hold any technology through additions); the
  engine's own defaults scale with the zone count. 40 unlinked DE-sized
  zones: 3.8 s per year. Not optimised (F14, follow-up): 14 zones in a chain
  6.7 s, 40 in a chain 56.5 s, 17 unlinked 1.4 s.
- F8: the discharge bid is at least the minimum spread above the charge bid
  at every price level (after the floor clamp), so no plant charges and
  discharges in one hour: DE +500 GW wind 2012, 1,668 → 0 hours; zero
  demand 2009, 8,696 → 0.
- F9: `addCapacity` checks `fromYear` (integer in the inputs' range,
  default the first year), the size (finite, ≥ 0, a zone's additions of one
  technology ≤ 1e7 MW), reservoir hydro only where a reservoir exists, and
  run-of-river only where there is a profile to follow (the zone's inflow,
  or its own run-of-river fleet, which runs flat in DE's placeholder data).
- F10: the validator range-checks shares and fills (0..1), persistence
  coefficients ([0, 1)), demand, capacities, links, fuel prices, reservoir
  and inflow (≥ 0), seasonal amplitudes (±1), must-run overrides (0..1),
  `reserveFraction` (0..1), the water-value slope (0..50), efficiencies
  ((0, 1]), correlations (±1), latitude, and real calendar dates
  (`parseDate` rejects 1999-02-31 and 1999-02-29).
- F16 (rest): `stdPrice` is two-pass over prices shifted by the first one (a
  flat 2,999.99 gives exactly 0); `normaliseMean` raises the scale until the
  mean after the 0.98 wind clip equals the target (realised wind CF was up
  to ~2 % low).
- B3: storage's price window reads the computed market price, not the
  regulated participant price. DE pumped storage now trades in 1999 (1.8 TWh
  charged, seed 42); 1995–1998 stay idle because the computed DE price is too
  flat in those years for a 75 % round trip plus the 2 €/MWh spread (no week
  qualifies): that is analyst B4, a follow-up, not the window.
- B7: Norway's target fill is interpolated daily from mid-month values
  (mean |Δ daily NO price| on the 1st of a month vs other days, seed 42
  2005–12: 8.65 vs 0.74 → 0.67 vs 0.70). Fuel and CO₂ follow `annualPath`:
  piecewise linear from 1 January to mid-year to 31 December, continuous at
  New Year, each year averaging exactly to its input, 1 January value capped
  so it never goes negative; `blendAnnual` is gone (gas was 66.5 in
  December 2021 and 105.5 in January 2022; now 86 on both sides). Fleet
  efficiency is read at the same point in time.
- Calibration impact (seeds 42 and 1, 1995–2025): Norway's low-price years
  move by up to 2.6 €/MWh (e.g. NO 2020 seed 42: 10.3 → 8.5), ES 2022 176 →
  183, DE within 0.5 €/MWh; DE negative hours 2024: 1,164 → 1,169 (seed 42),
  1,041 → 1,132 (seed 1).
- Golden hash: `8ff7768adee91c59` → `e0003bc8c6be7e77` (F5, F8, F16, B3, B7).

