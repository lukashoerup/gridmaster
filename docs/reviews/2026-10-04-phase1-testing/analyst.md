# Phase 1 market toy — plausibility review (energy-market analyst)

Reviewer: an analyst subagent, 2026-10-04, on main at `7cadbaa` (the later
`c89ebf9` changes one task-file line only). Five seeds (1, 7, 42, 123, 2024), each
run 1995→2025 in sequence (reservoirs and storage carry over, as in the
explorer's long-run charts); lever experiments use single-year runs, as the
explorer's slider does; four in-memory sensitivity experiments.

Verdicts: (A) input problem — real data fixes it; (B) model problem — real data
won't; (C) fine. **R≈** marks real-world values from the reviewer's own knowledge,
rounded and not looked up in this session; read them as ±10–20 % or as the range given.

## 1. Summary of the ten areas
| # | Area | Verdict | One line |
|---|---|---|---|
| 1 | Annual price levels, fuel/CO₂ | A, plus some B | Thermal zones track fuel well (DE mean vs coal cost r = 0.98). Levels off where inputs are invented (DE 2022: 129 vs R≈235). NO 2000s mean (77) and the weak spread of the 2022 crisis to Norway have model causes (B1, B2) |
| 2 | Daily/seasonal shapes | C (2020s duck, weekends, seasons); B (thermal-era flatness, weak evening peak) | ES 2025 evening/midday 3.4, April middays ~2 €/MWh. But DE peak/base 1.11–1.15 in 2000–15 (R≈1.25–1.45); DE summer-2024 evening only 85 (R≈130–150) |
| 3 | Negative prices | C onset/timing; B frequency; B/A depth and Spain | Onset right (DE 2008/09, DK1 2009/10); hours migrate from windy weekend nights to sunny summer middays. But DE has 2–3× the real count from 2016 (2022: 815 vs R≈70), every negative price is exactly −0.5, and ES never goes negative |
| 4 | Capture rates | C; B where missing neighbours bite | DE solar 0.61 in 2024 (R≈0.59), 0.55 in 2025 (R≈0.5); ES deepest. DE 2022 solar 0.69 (R≈0.94). NO wind > 1.0 is an artefact |
| 5 | Coupling and Norway | C mechanics; A link capacities; B Norway | Equal prices when links are free, importer dearer when congested, ≈0 wrong-way hours/yr. Norway hydro-like in normal years, breaks at both extremes |
| 6 | Scarcity | C 2000s; B 2020s and Norway | DE 2000s spikes plausible. From 2020 DE never above 294 €/MWh; a calm winter week raises prices only ×1.05–1.33. Only unserved energy anywhere is Norway (seed 1) |
| 7 | Storage | C direction and erosion; B levels | Batteries buy cheap and sell dear; spread shrinks with fleet size. But the DE battery earns 12 €/kW-yr (R≈60–90); DE pumped storage 2–4 cycles/yr in 2005–10 (R≈120–150) |
| 8 | "Add X GW of solar" lever | C | Monotonic in 220/220 steps, plausible magnitudes |
| 9 | DK1 1999 switch | C, minor B quirk | Only the reported price changes: 30 → 17 €/MWh (R≈15 in 2000). Dispatch unchanged |
| 10 | Other | B | New Year price step; Norway price jumps at month boundaries; DE a net importer every year; year view and long-run view disagree |

## 2. Model problems (B), ranked by how much they would mislead a player

### B1. Norway breaks at both extremes
- **Dry** (seed 1, 2004–07, inflows 75/77/82 TWh vs ~103 expected): reservoir drains to its 5 % minimum; NO annual mean 116 / 885 / 947 / 522 €/MWh with 1,977 / 2,309 / 1,256 hours at the 3,000 cap; **unserved 18.1 / 24.0 / 9.5 TWh** (~15–20 % of demand: a months-long blackout).
- **Wet** (4 of 5 seeds): 1,000–2,571 hours at exactly 0 €/MWh, spill up to 32 TWh/yr, annual means 4–8 €/MWh. NO wind capture rate 1.03–1.13 is an artefact of this.
- **Reality:** Norway has never had unserved energy; dry years (1996, 2002–03, 2010, 2018) averaged ~30–55 €/MWh; the wettest (2020) ~9 €/MWh in NO1 with few exact-zero hours.
- **Mechanism** (`world.ts` `simulateYear`, `hydro_res` case): demand is perfectly inelastic (`market.ts` `clearGroup`); Norway has only hydro, 150 MW of gas and 1–3 GW of links. The water value `ref·exp(4·(targetFill[month] − fill))` only reacts once the reservoir is already below target and never anticipates a dry season. `spillRisk` drives the value to zero above 90 % fill in any season; forced output bids exactly 0.
- **Sensitivity** (seed 1, 2006) — no single input fix removes the blackout: inflow +10 % → 12.5 TWh unserved; links ×2 → 11.3 TWh; 3 GW backstop at oil cost → 3.4 TWh. Wet years: links ×2 cut zero-price hours 2,455 → 1,054, seed 123 still ~1,450/yr.
- **Fix:** price-responsive demand blocks (industrial curtailment and electric boilers at ~100–300 and ~500–1,000 €/MWh, then a value-of-lost-load step); a water value driven by expected remaining seasonal inflow, with targets interpolated daily; spill risk from reservoir headroom against expected inflow, and a small positive bid for forced output; boundary zones (B2).

### B2. Missing neighbours: every zone is close to an island
- DE is a net importer every year (−2.5 to −26 TWh; R≈ net exporter 2003–22, near +50 TWh in 2017); DE has 2–3× the real negative hours; ES has 1,833 hours at exactly 0 in 2024 (R≈750 at or below 0) and curtails ~20 % of its solar; NO stays at 40 €/MWh in 2022 (R≈140 load-weighted); DK1–NO congested 77–98 % of hours.
- **Mechanism:** the zone and link scope in `zones.json` / `links.json`; the engine handles any network. Real data for the four zones won't fix it.
- **Sensitivity:** DE demand +7 % (a stand-in for export pull) cuts 2024 negative hours 1,258 → 974 and lifts the 2022 mean 133 → 151.
- **Fix:** boundary zones with external price series or simple supply curves and historical link capacities: FR, NL/BE, an AT/CH/CZ/PL ring, SE, GB, and PT (MIBEL) for Spain.

### B3. Storage rule earns about a fifth of real arbitrage
- DE battery in 2024: 122 cycles, 12 €/kW-yr — ~40 % of the simulation's own perfect-foresight value (~30 €/kW-yr). DE pumped storage 2–4 cycles/yr in 2005–10.
- **Mechanism:** `world.ts` storage case trades fixed p25/p75 thresholds over a 168 h window, no look-ahead.
- **Bug in the regulated period:** line ~634 pushes the *participant* price (the flat regulated tariff before market opening) into the storage window, so DE pumped storage sits at 100 % charge with zero dispatch from 1995 to June 2000.
- **Fix:** schedule storage day by day against a short price forecast, or bid by state of charge; feed the computed `marginalPrice` into the window.

### B4. Thermal-era days too flat; 2020s evening peak too weak
- DE peak/base 1.11–1.15 in 2000–15 (R≈1.25–1.45); DE 2010 annual maximum 53 €/MWh. Summer 2024 DE evening 85 vs night ~75 (R≈ night ~85, evening ~130–150). Daily best-two minus worst-two hours spread in DE 2024: 47 €/MWh (R≈90–110) — halves storage value and suppresses solar's value at low shares.
- **Mechanism:** `world.ts` `THERMAL_TRANCHES`: every fleet in three fixed tranches at ±15 % efficiency, no start-up or commitment costs.
- **Fix:** data-driven efficiency curves with 5–10 tranches, plus a simple commitment or ramping mark-up.

### B5. No Dunkelflaute spikes in the 2020s
- DE never above 294 €/MWh in 2020–25 (R≈820–940 in Nov–Dec 2024).
- **Mechanism:** `demand.ts` `demandSeries` draws demand noise independently per zone, so demand is uncorrelated with wind (r = −0.04) and with other zones (0.02); in reality cold spells are regional and often calm. No forced outages for thermal plants.
- **Fix:** drive demand from the same weather year (shared temperature); add seeded forced outages.

### B6. Explorer year view and long-run view disagree
- Same seed and year: NO 2022 is 92 €/MWh in the year view vs 40 in the long-run view; 2005 differs by up to 793 €/MWh.
- **Mechanism:** `protocol.ts` `runYear` builds a fresh world (reservoir 62 %, storage half full).
- **Fix:** snapshot the state each 1 January during the long run and start single-year runs from it.

### B7. Calendar step artefacts
- **New Year step:** DE 101 → 145 €/MWh from late Dec 2021 to early Jan 2022; 152 → 119 into 2023. Despite its comment, `blendAnnual` still leaves half the annual change as a jump (gas 66.5 in December vs 105.5 in January, €/MWh thermal). Annual-only keyframes also lose the 2021–22 timing.
- **Month boundaries in Norway:** the daily price changes by 10.4 €/MWh on the 1st of a month vs 1.2 on other days (e.g. 13 → 27 May → June); monthly `targetFill` steps amplified by `exp(4·Δ)`.
- **Fix:** monthly fuel and CO₂ series interpolated daily; target fill interpolated daily.

### B8. Negative-price depth and Spain
- Every negative price is −0.5: median and 5th percentile both −0.5 from 2015; no hour ever at or below −100; the −500 floor never reached. ES never goes negative (no subsidy, so all its wind and solar bid exactly 0).
- **Fix:** split wind and solar into vintage tranches with different bids, plus a small production-linked bid (~−1 to −10 €/MWh). Partly an input question.

### B9. No time zones or daylight saving
- Hour-of-day is local solar time everywhere (`weather.ts` `solarElevation(hod + 0.5)`) with generic demand shapes, so Spain's solar and its 21–22 h evening peak are mistimed.
- **Fix:** run in UTC, with local-time demand shapes and daylight saving per zone.

### Minor
- **B10:** perfect market coupling from 1995 (DK1–DE used explicit auctions until ~2010); plus the storage-window bug in B3.
- **B11 (for Phase 2):** capacity the player adds inherits the fleet's subsidy bidding — in DE 2024, 20 % of a player's solar output would bid −40 €/MWh. Player assets need their own bids.

## 3. Details by area

### 3.1 Price levels by era (mean over seeds, €/MWh; R≈ after the slash)
"Reg." = flat regulated tariff before market opening; the price computed underneath is in brackets.

| Era | DK1 | DE | NO | ES |
|---|---|---|---|---|
| 1995–99 | 30 reg. (17–18 computed) / Nord Pool ~15–25 | 39 reg. | 16 / ~16 | 33 (1998–99: 20–24) / ~25–27 |
| 2000–09 | 30 / ~33 | 34 / ~38 | **77** (seed median 32) / ~31 | 37 / ~40 |
| 2010–19 | 32 / ~36 | 36 / ~39 | 27 / ~36 | 36 / ~47 |
| 2021–23 | 87 / ~128 | 96 / ~142 | 38 / south ~115 | 107 / ~122 |
| 2024–25 | 66 / ~70 | 68 / ~80 | 51 / ~40–45 | 48 / ~63 |

Fuel pass-through: DE mean vs coal cost r = 0.98, vs gas (CCGT) cost r = 0.95; ES vs gas r = 0.98. DE 2022 (seed 42): coal sets the price in 40 % of hours, gas in 16 % — inputs (coal 166 vs gas 250 €/MWh) plus the missing export pull (B2).

### 3.2 Daily shapes (seed means)
| | DE evening/midday | DE peak/base | ES evening/midday |
|---|---|---|---|
| 2005 | 1.29 | 1.15 | 1.03 |
| 2010 | 1.12 | 1.11 | 1.04 |
| 2024 | 1.81 | 0.99 | 2.50 |
| 2025 | 2.09 | 0.95 | 3.40 |

DE 2024 winter shows a realistic double hump (80 at 8 h, 74 midday, 90 at 18 h). Weekend/weekday 0.82–0.87 in DE (R≈0.80–0.85). NO flat within the day (peak/base ~1.05). Minor (A): DK1 cheaper in winter than summer in 2000–19 (ratio 0.85–0.95; R≈1.05–1.2).

### 3.3 Negative hours per year (DE)
| | 2009 | 2012 | 2015 | 2017 | 2019 | 2020 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|---|---|---|---|
| DE sim | 20 | 17 | 124 | 292 | 518 | 591 | 815 | 968 | 1,260 | 1,534 |
| R≈ | 71 | 56 | 126 | 146 | 211 | 298 | 70 | 300 | 457 | 575 |

DK1 matches DE's count from 2015 (coupled in surplus hours). NO 0 except 3–17 h/yr in 2020–21. ES 0, with 1,833 hours at exactly 0 in 2024 and 2,239 in 2025.

Where DE's negative hours fall: 2009–14 — 7 % at 10–16 h, 18 % in Apr–Sep, 77 % on weekends, wind CF 0.84 in those hours (0.21 overall). 2023–25 — 56 % at 10–16 h, 73 % in Apr–Sep, 43 % on weekends, solar CF 0.33 in those hours (0.11 overall).

### 3.4 Capture rates
| | DE solar | ES solar | DK1 solar |
|---|---|---|---|
| 2019 | 0.92 (R≈0.90) | 1.02 (R≈0.95) | 0.98 |
| 2022 | 0.69 (R≈0.94) | 0.88 (R≈0.9) | 0.74 |
| 2023 | 0.67 (R≈0.76) | 0.67 (R≈0.75) | 0.70 |
| 2024 | 0.61 (R≈0.59) | 0.55 (R≈0.63) | 0.64 |
| 2025 | 0.55 (R≈0.5) | 0.47 (R≈0.55) | 0.57 |

DE wind 0.80–0.91 in 2019–25 (R≈0.75–0.85), probably a bit high from synthetic weather (A). DK1 wind 0.73 in 2022 rising to 0.91 in 2025. NO wind 1.03–1.13 (B1 artefact).

### 3.5 Coupling (share of hours, seed mean)
| | DK1 = DE | DK1 = NO | DE = NO | DK1–DE congested | DK1–NO congested | DE–NO congested |
|---|---|---|---|---|---|---|
| 2010 | 68 % | 12 % | – | 44 % | 88 % | – |
| 2019 | 73 % | 21 % | – | 32 % | 79 % | – |
| 2024 | 90 % | 24 % | 16 % | 11 % | 77 % | 84 % |

R≈ DK1 = DE in roughly a third to two-thirds of hours, so 70–90 % is input (A): full nominal link capacity rather than what TSOs give the market. When congested, the importer is dearer in 73–100 % of hours, the rest ties. Norway: intraday std 1–4 €/MWh (DK1 4–37); annual NO price vs 1 January reservoir fill r = −0.58. NO placeholder energy balance (inflow + run-of-river + wind − demand): +0.5 to +2 TWh in 2000–10, −14 TWh in a one-σ dry year against 8.8 TWh of maximum imports; +19 to +22 TWh in the 2020s against 15–27 TWh of export capacity.

### 3.6 Scarcity (per seed-year)
DE 2000–09: 41.5 h with any scarcity lift, 0.9 h above 500 €/MWh, max 2,572. DE 2010–19: 7.2 h, max 1,160. DE 2020–25: 0.4 h, max 294. NO 2000–09: 111 h per seed-year at the cap; 51.6 TWh unserved in total across five seeds. Calmest DE winter week (wind CF 0.08–0.10 vs 0.25 normal): prices ×1.05–1.33 only.

### 3.7 Storage (DE 2024, batteries added)
| Added (GW) | 0 | 10 | 40 |
|---|---|---|---|
| Spread (€/MWh) | 51 | 42 | 32 |
| Margin (€/kW-yr) | 11.6 | 7.8 | 3.9 |
| Cycles/yr | 126 | 107 | 80 |

ES margin 14.3 → 6.3 €/kW-yr with 10 GW added. DE pumped storage cycles: 4 (2005), 2 (2010), 48 (2024).

### 3.8 The solar lever
| | +0 GW | +10 GW | +20 GW | +50 GW |
|---|---|---|---|---|
| DE 2024 solar capture rate / zone mean | 0.63 / 68.8 | 0.57 / 66.8 | 0.52 / 65.1 | 0.44 / 61.5 |
| DE 2010 solar capture rate | 1.02 | 0.99 | 0.95 | 0.77 |
| ES 2024 solar capture rate / curtailed TWh | 0.55 / 11.7 | 0.41 / 21 | 0.32 / 32.7 | 0.18 / 74 |

### 3.9 DK1 switch on 1 July 1999
Reported price 30.0 (regulated, first half) → 17.2 (market, second half); computed price 17.1 underneath both; std 0 → 1.9; wind capture rate 1.00 → 0.96 by 2000.

## 4. Three input (A) items to verify first when real data arrives
1. **Norway's hydro and energy balance:** inflow, run-of-river, demand, target-fill curve, water-value parameters (factor 0.9, slope 4). The placeholder swings from ~0 surplus in the 2000s to +22 TWh in the 2020s; R≈ normal-year surplus ~10–20 TWh.
2. **Germany's fleet and effective link capacities:** gas/coal/lignite split and costs (including the "DE gas includes other" stand-in), availability, and the capacity actually given to the market each hour. These drive the 2022 level, which fuel sets the price, the 2020s scarcity margin and DK1 = DE convergence.
3. **Subsidy and bidding inputs by vintage, plus monthly fuel and CO₂ prices:** these drive negative-hour counts and depth, Spain's onset (real: April 2024) and capture rates.

## 5. What clearly works
- Clearing and coupling: exact convergence when links are free, correct direction under congestion, ≈0 wrong-way hours.
- Fuel and CO₂ pass-through and the overall 1995–2025 shape.
- Negative-price onset years and the migration from windy nights to sunny middays.
- The 2020s duck in DE and ES, including DE's winter double hump.
- Strictly monotonic solar cannibalisation with plausible magnitudes.
- Storage buys cheap and sells dear; arbitrage erodes as the fleet grows.
- Norway hydro-like in normal years (seed-median 2000s mean 32 vs R≈31).
- A clean 1999 regime switch.
- No unserved energy in DE, DK1 or ES in any year or seed.

## Reproduction
Scripts in the session scratchpad (`analyst/scripts/`): `zz-analyst.test.ts` (stages `dump`, `levers`, `fresh`, `sens`; copy into `tests/`, set `ANALYST_OUT`, run `ANALYST_STAGE=<stage> npx vitest run tests/zz-analyst.test.ts`; ~65 s, 150 s, 17 s, 80 s), then `node scripts/aN-*.mjs` for tables `a1`–`a11`.
