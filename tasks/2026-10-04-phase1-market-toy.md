Model: fable — this is the architecture every later phase stands on, and a wrong market model is expensive to detect: prices can look plausible while behaving wrongly.

# Task: Phase 1 — the market toy

## Status
**Blocked** on decision Q2 (technology stack) in `docs/decisions.md`. Do not
start, and do not add any dependency, until Lukas has approved a stack there.

## Goal
Prove the simulation before any gameplay exists (`docs/roadmap.md`, Phase 1).
A headless, deterministic core turns weather, demand and fuel prices into
hourly electricity prices for a few European zones over 1995–2025, and a small
web page lets Lukas explore it from a link on his phone. The gate is his
judgement: do the prices behave like the real ones?

## Acceptance criteria
- [ ] Simulation core with no UI dependencies; seeded and deterministic (same
      seed and inputs → identical output, asserted by a test)
- [ ] Zones: Denmark, Germany, Norway (one zone is fine), Spain; years 1995–2025
- [ ] Weather: zone-level hourly wind and solar capacity factors built from
      real weather years (ERA5 or the Copernicus PECD — see the data notes),
      a different weather year drawn per game year from the seed
- [ ] Demand: an hourly shape scaled to each year's national demand
- [ ] Supply: the incumbent fleet by technology and year, marginal costs from
      historical fuel prices (World Bank Pink Sheet) and carbon prices from 2005
- [ ] Price: hourly merit-order clearing per zone, with scarcity pricing,
      negative bids from subsidised output, interconnector limits (simple
      transport model) and a water-value rule for reservoir hydro
- [ ] Calibration report (markdown + charts): simulated against real
      statistics — annual mean, price-duration curve, capture rates, count of
      negative hours — from openly licensed data (Energinet covers DK, DE, SE
      and NO under CC BY 4.0; ENTSO-E for Spain only once its re-use terms are
      verified). The method is the report's section "Ship real weather, but
      compute the prices"
- [ ] Explorer page with a preview link: pick zone, year, seed; a slider "add
      X GW of solar to this zone" that shows cannibalisation happening
- [ ] Headless speed recorded (target: one simulated year, four zones, < 1 s)
- [ ] Tests green in CI; `CLAUDE.md` gains the test command

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
