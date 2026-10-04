Model: fable — this is the architecture every later phase stands on, and a wrong market model is expensive to detect: prices can look plausible while behaving wrongly.

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
sees it. **Coupling:** zones joined by links are cleared as one merged merit
order (Nord Pool style market splitting): when a resulting flow exceeds a
link, that link is fixed at its limit, the group splits and is re-cleared;
a link fixed earlier that ends up flowing from the dearer zone is released
once and re-solved. Uncongested zones therefore share one price exactly.
**Water value:** ref × exp(4 × (monthly target fill − fill)), collapsing
above 90 % fill; ref is the trailing 30-day capacity-weighted price of the
linked zones (the cheapest thermal cost for Spain, which has no link), times
a zone factor. Three tranches at 0.8/1.0/1.3 × value; forced output when the
reservoir would overflow. **Storage:** charge below the rolling 25th
percentile, discharge above the 75th, over the last 168 hours, with a
minimum spread; charging is a price-sensitive demand block, discharge a
supply block, so storage sets the price when marginal. Money: no ledger yet
(nothing is bought or sold in the toy); the rule "integer cents" applies
when Phase 2 adds one.

**Speed measured.** One simulated year, four zones, including statistics:
median 0.45–0.50 s over five runs in Node 22 on the session's container
(min 0.40 s, max 0.72 s). Target < 1 s met. Thirty-one years in sequence:
12.3 s. `npm run bench` prints the per-year figure.

**Determinism.** `hashYearResult` (two FNV-1a streams over prices, dispatch,
flows, storage, reservoir) is identical across runs and differs by seed;
`tests/world.test.ts` holds a golden hash for seed 42, 2019
(`18e65696d6daa883`) — recompute it on any intended model or data change.

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
surpluses overstated. No forced outages. The splitting heuristic can leave a
congested link flowing from the dearer zone in rare hours (≤ 1 hour a year
observed; a full LP would not). Must-run CHP has no heat storage or bypass.
Hydro has one reservoir per zone. The explorer simulates the selected year on
its own from standard starting levels (reservoir 62 %, storage half full)
while the long-run charts replay 1995–2025 in sequence; the page says so.
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
