# Phase 1 simulation core — adversarial stress report

Tester: a stress-test subagent, 2026-10-04, on main at `7cadbaa` (later `c89ebf9`
changes one task-file line only). Method: temporary vitest files using the public
API (`src/sim/index.ts`) and the placeholder loader; every number came from a run
in Node 22.22.0; every reproduction was executed. Baseline suite green (77 tests).

**Findings:** 1 crash (no hang), 8 wrong results, 7 robustness/validation gaps.

| # | Finding | Severity | In the unmodified placeholder world? |
|---|---|---|---|
| F1 | A fixed link's flow is capped at the importer's own demand: transit and imports for storage charging are throttled | wrong result | **yes**: all 201 seeds, ~165 link-hours/yr |
| F2 | Scarcity adder in split groups treats fixed exports as firm demand: exporter price spikes (10 → 539), links flow from the dearer zone | wrong result | 0–4 h/yr baseline; 68–202 h/yr in tight but plausible systems |
| F3 | `simulateYear` depends on earlier calls (hidden state); explorer shows two prices for the same seed and year | wrong result (contract) | **yes** |
| F4 | `captureRate` flips sign or explodes when the mean price is ≤ 0 or near 0 | wrong result | with large player additions |
| F5 | Demand noise identical for zone ids of equal length and first letter (DK1 = DK2) | wrong result (latent) | not with today's ids |
| F6 | 17+ zones crash: "too many supply blocks" | crash | — |
| F7 | A zone with no demand and no supply is priced at the cap every hour | wrong result | — |
| F8 | Storage charges and discharges in the same hour at deeply negative prices | wrong result | with large player additions |
| F9 | `addCapacity` gaps: `hydro_res` silent no-op without a reservoir, `hydro_ror` runs flat, `fromYear` unchecked, `mw` unbounded (SOC → Infinity) | robustness | via the hook |
| F10 | Validator accepts values that break energy balance, push output over capacity, or produce NaN | robustness | — |
| F11 | `ClearingEngine` (exported) has no input guards; a NaN bid's effect depends on insertion order | robustness | — |
| F12 | `simulateYear` accepts any year (NaN, fractional, 1900); seeds alias modulo 2^32 | robustness | — |
| F13 | Coupled zones with different floors show different prices on an uncongested link | wrong result (low) | not in sweeps |
| F14 | Cost grows superlinearly with links and zones (10 fully connected zones: 40 s/yr) | performance | — |
| F15 | Storage SOC silently clamped when capacity shrinks; new storage starts half full | low | out-of-order years only |
| F16 | `congested` set with equal prices; one-pass `stdPrice`; wind clipping lowers realised CF | low | yes |

Common preamble for the reproductions (run with `npx vitest run <file> --reporter=verbose`):
```ts
import { it } from 'vitest';
import { loadPlaceholderInputs, placeholderRaw } from '../src/data/placeholder';
import { runSeries, runYear } from '../src/explorer/protocol';
import { ClearingEngine, SyntheticWeather, TRANCHE, World, demandSeries, hashYearResult, validateInputs } from '../src/sim';
const inputs = loadPlaceholderInputs();
const weather = new SyntheticWeather(inputs);
const worldFrom = (mutate: (r: any) => void, seed = 1): World => {
  const r = structuredClone(placeholderRaw) as any; mutate(r);
  const i = validateInputs(r); return new World(i, new SyntheticWeather(i), seed);
};
const engine = (n: number, reserve = 0): ClearingEngine => {
  const e = new ClearingEngine(n);
  for (let z = 0; z < n; z++) { e.floor[z] = -500; e.cap[z] = 3000; e.reserveFraction[z] = reserve; }
  return e;
};
```

## F1 — A fixed link's flow is capped at the importer's own demand
Engine: A cheap, B no demand, C dear; A–B 100 MW, B–C 1000 MW.
```ts
const e = engine(3);
e.setLinks([{ from: 0, to: 1, capacityMw: 100 }, { from: 1, to: 2, capacityMw: 1000 }]); e.beginHour();
e.demand[0] = 0; e.demand[1] = 0; e.demand[2] = 500;
e.addBlock(0, 0, TRANCHE.NORMAL, 10, 1000); e.addBlock(2, 1, TRANCHE.NORMAL, 100, 1000);
e.clear(); // → price [10,100,100], flow [0,0], linkFixed [1,0]
```
Expected A→B 100 and B→C 100; actual A–B fixed ("congested") at 0 MW (with B's demand at 30, flow 30, either link order).
World: `new World(inputs, weather, 42).simulateYear(2019)` → 178 link-hours congested below capacity, each with flow = DK1's own demand while DK1 passes 1.5–2.2 GW onward to DE (17,471 MWh unused across a price spread). Seeds 0–200 in 2024: 201/201 affected, 33,202 link-hours. DK1 at zero demand in 2010: DK1–NO fixed at 0 MW for 7,723 h.
Variant — imports for storage charging capped at firm demand:
```ts
const e = engine(2); e.setLinks([{ from: 0, to: 1, capacityMw: 100 }]); e.beginHour();
e.demand[0] = 0; e.demand[1] = 50;
e.addBlock(0, 0, TRANCHE.NORMAL, 10, 1000); e.addBlock(1, 1, TRANCHE.NORMAL, 100, 1000);
e.addCharge(1, 10, 50, 200);
e.clear(); // → price [10,50], flow 50 (fixed), charged 0; expected flow 100 with 50 MW charged at 50
```
Cause: `market.ts` `ClearingEngine.clear()` lines 309–311 — `importerRoom = demand[importer] + fixedExport[importer]` ignores the importer's onward free links and its storage charging, and depends on which link is fixed first. The group-level scale-down (lines 231–265) already handles the real failure case, so this per-zone cap looks redundant and too tight.

## F2 — Scarcity adder after a split spikes the exporter; wrong-way flows
```ts
const e = engine(2, 0.12); e.setLinks([{ from: 0, to: 1, capacityMw: 90 }]); e.beginHour();
e.demand[0] = 100; e.demand[1] = 100;
e.addBlock(0, 0, TRANCHE.NORMAL, 10, 200); e.addBlock(1, 1, TRANCHE.NORMAL, 50, 150);
e.clear(); // → A 539.05, B 50, flow A→B 90, wrongWayLinks 1 (A alone clears at 10)
```
Plausible worlds (sanity tolerance is 10): DE demand +20 % 2024 seed 1 → 101 wrong-way link-hours; seed 2 → 68; all demand +15 % 2022 seeds 1/2 → 202/26; reserve fraction 0.25, 2022 → 32/20; NO reservoir 0 TWh 2010 → 127. Baseline 0–4/yr.
Cause: `market.ts` `clearGroup()` (lines 372–402): `dFirm` includes `fixedExport`, so spare falls and every bid is lifted by `(cap − bid)·s³`; `clear()` releases a wrong-way link only once (`repaired`, lines 320–342).

## F3 — `simulateYear` depends on earlier calls
```ts
const w = new World(inputs, weather, 42);
hashYearResult(w.simulateYear(2019)); // 18e65696d6daa883 (golden)
hashYearResult(w.simulateYear(2019)); // ef9d065d034aac4f
const w2 = new World(inputs, weather, 5); w2.simulateYear(2010);
w2.simulateYear(2000).byZone.NO!.stats.meanPrice;                          // 36.61
new World(inputs, weather, 5).simulateYear(2000).byZone.NO!.stats.meanPrice; // 25.28
runYear({ kind: 'year', id: 1, seed: 42, year: 2019, zone: 'NO', extraSolarGw: 0 }).payload.stats.meanPrice; // 39.33
// runSeries(... seed 42, zone NO ...) → NO 2019 meanPrice 20.06
```
Running 2019 twice changes 548 DE hours by up to 16.28 €/MWh. The D14 note ("recomputable deterministically from inputs, seed and year") holds only for a fresh World. No API exports or imports the carried state (reservoir, SOC, `PriceWindow`, `RollingMean`), so a game save must replay from 1995. `reset()` restores the fresh result (verified).
Cause: `world.ts` fields `reservoir`, `soc`, `windows`, `neighbourPrice` (lines 236–240) mutated by `simulateYear()` (line 302), with no state passed in or returned.

## F4 — `captureRate` meaningless when the mean price is ≤ 0 or near 0
```ts
const w = new World(inputs, weather, 4); w.addCapacity('DK1', 'wind', 500_000);
const s = w.simulateYear(2025).byZone.DK1!.stats; // mean -2.342, wind capture -2.395, rate 1.022
const w2 = new World(inputs, weather, 4); w2.addCapacity('DK1', 'wind', 100_000);
w2.simulateYear(2006).byZone.DK1!.stats; // mean 0.0249, coal capture 0.081, rate 3.25
```
+500 GW solar in DK1 2025: solar rate −0.074. A synthetic series with mean 2.5e-5 gives 400,002. Expected below 1 when a technology earns below average, or `null` when ill-defined. Cause: `stats.ts` `zoneStats()` line 107 guards only |mean| > 1e-9.

## F5 — Demand noise collides for zone ids of equal length and first letter
```ts
const dk1 = inputs.zones.find((z) => z.id === 'DK1')!;
const a = demandSeries(dk1, 2015, 42), b = demandSeries({ ...dk1, id: 'DK2' }, 2015, 42);
a.every((v, i) => v === b[i]); // true (also 'DXX'; false for 'NDK')
```
Cause: `demand.ts` `demandSeries()` line 185, stream id = `id.length * 131 + id.codePointAt(0)`. Bites with DK2, SE1–SE4, NO1–NO5.

## F6 — 17+ zones crash
16 DE-sized zones run; 17 throw "too many supply blocks" (16 if every zone has hydro and two storage techs). Europe has ~40 bidding zones. Cause: `world.ts` line 249 `new ClearingEngine(nZones)` with defaults `maxBlocks = 512`, `maxCharges = 64` (`market.ts` line 100); `addBlock` throws at line 165.

## F7 — An empty zone is priced at the cap
`engine(1)` with demand 0 and no blocks → price 3000. World: ES with no capacity and 0 demand → meanPrice 3000, capHours 8784. Cause: `market.ts` `clearGroup()` lines 484–488: with no blocks, `!settled` sets `priceG = capG` although `dFirm − supplied = 0`.

## F8 — Storage charges and discharges in the same hour at deep negative prices
`addCapacity('DE','wind',500_000)`, 2012: pumped storage both charges and discharges in 1,668 h (h24: charge 6,326.7 MW, discharge 4,038.0 MW at −57.5 €/MWh; 5.7 TWh overlapped). Zero demand everywhere 2009: 6,246.7 MW both ways in 8,696 h. Not seen in baseline sweeps or with +30–100 GW in 2024/25. Cause: `world.ts` `case 'storage'` lines 541–548: `dischargeBid = max(p75, (p25+2)/rt)` and `chargeWtp = min(p25, p75·rt − 2)` both collapse to p25 below −2/(1−rt) (−8 €/MWh pumped, −16.7 battery).

## F9 — `addCapacity` gaps
```ts
const w = new World(inputs, weather, 5); w.addCapacity('DK1', 'hydro_res', 5000); w.addCapacity('DK1', 'hydro_ror', 5000);
const z = w.simulateYear(2020).byZone.DK1!; // hydro_res: 5000 MW, 0 TWh; hydro_ror flat 2750 MW every hour
const a = new World(inputs, weather, 1); a.addCapacity('DK1', 'solar', 1000, NaN); a.capacityMw('DK1', 'solar', 2020); // 950: never applies
const b = new World(inputs, weather, 5); b.addCapacity('DE', 'battery', 1e308);
b.simulateYear(2024).byZone.DE!.stateOfCharge.battery![0]; // Infinity
```
`fromYear` Infinity accepted; string `'2020'` coerced; 2020.5 applies from 2021. Correctly rejected: negative/NaN/Infinity/string `mw`, unknown zones and techs. Cause: `world.ts` `addCapacity()` (lines 257–262) checks only `mw`; `hydro_res` breaks when `z.hydro === null` (line 504); `hydro_ror` defaults inflow to 1 (line 499); SOC set to `energyMwh / 2` (line 399).

## F10 — Validator accepts values that break invariants
| Mutation (`worldFrom(mutate, 7).simulateYear(year)`) | Result |
|---|---|
| `zones[3].demandShape.seasonalAmplitude = 1.5` | negative demand; imbalance up to 13,541 MW in 2,208 h |
| `weekendFactor = -1` | imbalance in 2,496 h |
| `demandTwh = [[1995, -100]]` | imbalance in 8,784 h (up to 15,453 MW) |
| `capacity.mustRunOverrides.DK1.coal = -1` | DK1 coal 3,369 MW from 3,000 MW capacity (295 h) |
| `weather.windDailyPhi = 1.5` | NaN wind availability; `curtailedTwh` NaN; wind silently drops out |
| `weather.inflowDailyPhi = 1.2` | NaN reservoir; NO at 3,000 all year, 110 TWh unserved |
| DE `wind.seasonalAmplitude = 2` | negative available wind |
| NO `reservoirTwh = -85` | NO priced at 0 all year |
| ES `waterValueSlope = 2000`, `waterValueRefFactor = 0` | `0 × exp(900)` = NaN: 9,129 NaN bids in 3,043 h, never dispatched |
| `marketOpen = "1999-02-31"` | accepted, treated as 3 March |
| negative `inflowShape`, `initialFill` > 1, negative availability, `reserveFraction = 10` | accepted (last: 5,006 wrong-way link-hours) |

Cause: `inputs.ts` `parseZone()`, `parseTech()`, the `mustRunOverrides` loop (lines 393–403, skips the 0..1 check) and the weather block (lines 453–463) check only finiteness; `calendar.ts` `parseDate()` allows day 31 in any month.

## F11 — `ClearingEngine` has no input guards
NaN block added before a 20 €/MWh block → price 20 (NaN block dispatched first); added after → price NaN. Infinity-MW block → NaN dispatch; NaN demand → price 3000 with 0 unserved; infinite demand → NaN unserved and scarcity; NaN link capacity → unlimited; link to a missing zone silently ignored; NaN cap → NaN price. Cause: `market.ts` `addBlock`/`addCharge` (lines 163–189) guard only `mw`; sort comparator (line 403) turns NaN into index order.

## F12 — Any year accepted; seeds alias
`simulateYear(NaN)` runs (8,760 h, DE mean 58.94). Years Infinity, 2019.5, 1900, 0, −4 run; 2019.5 uses interpolated data but 2019's weather (`id | 0`). Seeds 0, 2^32, NaN, ±Infinity, 2^53 identical; −1 = 4,294,967,295; 1.9 = 1. Cause: `world.ts` line 247 (`seed >>> 0`), line 302, `rng.ts` `hashStream()`.

## F13 — Different floors give different prices on an uncongested link
Two zones, floor[0] = 0, 5,000 MW link → prices [0, −30], flow −100, not fixed — contradicts the `market.ts` header. World: only with zero demand in 2009 (6,552 h). Cause: `clearGroup()` clamps per zone (line 498); `capG = min(cap)` (line 378) has the same issue.

## F14 — Performance
| World | Time per year |
|---|---|
| Placeholder 2024, seeds 0–200 | median 427 ms, max 663 ms |
| Placeholder slowest years | 2022: 468 ms; 2023: 455 ms |
| Placeholder, all 6 zone pairs linked at 1 MW | 1,202 ms |
| Synthetic fully connected 4 / 6 / 8 / 10 zones | 1.3 / 5.4 / 15.7 / 39.6 s |
| 14 zones in a chain | 9.3 s |
| 31 years in sequence | 12.4–12.7 s |
No hang (loop bounded by 3 × link changes). Cause: `clear()` re-clears every group with a full sort after each link change; `solveFreeFlows()` runs a 60-step ternary search per cycle-closing link.

## F15 — Storage SOC clamp and free initial charge
After 2025, simulating 2016 on the same World: DE battery SOC 17,434 → 300 MWh (17.1 GWh vanish). New stores start at 50 % SOC (+100 GW of 2-hour battery gets 100 GWh free). Cause: `world.ts` lines 399, 614.

## F16 — Nits
- `LinkYear.congested` set with equal prices on both sides (~650 link-hours per seed in 2009), contrary to its doc.
- One-pass `stdPrice` (`stats.ts` line 80): constant 2,999.99 → std 0.0018 instead of 0.
- Wind clipping at 0.98 in `weather.ts` `normaliseMean()` puts realised wind CF 1.9 % (DK1) and 1.1 % (NO) below configured.

## Design question (for Lukas)
When coupled zones are both short, unserved energy is shared in proportion to demand: a zone with 900 MW for 1,000 MW of load exports 300 MW and sheds 400 MW (demands 1000/1000; blocks 900 @ 50 and 100 @ 3000; 300 MW link). Players will see this choice.

## Withstood
- Seeds 0–200 (2024, 2009): no NaN/Infinity, no price outside [floor, cap], no energy imbalance, no flow over capacity; flows matched net exports; no unserved energy below the cap; wrong-way ≤ 4 link-hours per seed.
- Large, negative and fractional seeds held the invariants. Fresh-world determinism over 5 years; `recordStacks` neutral; `reset()` restores; 10,000 × 1 MW = 1 × 10,000 MW.
- 31 years in sequence (two seeds): no hard violation; reservoir mass balance error ~1e-6 MWh of 3.4e9 MWh inflow; SOC within bounds.
- Extreme legal worlds, all bounded and solvent: zero demand; demand ×100; no thermal; zero/huge/tiny links; all six pairs linked; fuel 0 and 10,000; CO₂ 0 and 2,000; reservoir empty/full/over-full; zero inflow; 0 TWh reservoir; 5 TW pumped storage; negative-price date before market opening; NO at zero demand with a huge surplus; a year of zero wind and solar (capture `null`); constant 0.98 wind.
- Hook additions held every hard invariant: 500 GW of solar, wind, battery, pumped, nuclear or `hydro_res`; 5 TW and 1e9 MW of wind; 1e12 MW of solar; 1.7e308 MW of coal and lignite.
- Coupling fuzz, 20,000 cases (ties, storage charges, zero-demand zones, mixed floors, triangle plus spur): no imbalance, no price out of bounds, no flow over capacity.
- Stats: zero hours and zero generation give `null` or zero, never NaN.
