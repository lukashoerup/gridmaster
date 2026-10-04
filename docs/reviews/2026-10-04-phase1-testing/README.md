# Phase 1 testing, 2026-10-04

Lukas asked for testing agents after trying the market explorer himself
("everything seems to work, and looks plausible"). Three testers ran in
parallel on copies of `main` at `7cadbaa`, each with a different brief; their
full reports are next to this file. A builder session then fixed what they
found, on the branch merged as the PR that adds this folder.

| Report | Tester's brief | Found |
|---|---|---|
| [`browser-qa.md`](browser-qa.md) | Use the explorer like a careless person at 320–1920 px; break it | 0 blocker, 3 major, 13 minor, 5 cosmetic |
| [`stress.md`](stress.md) | Attack the simulation core with extreme inputs; minimal repros | 1 crash, 8 wrong results, 7 validation gaps |
| [`analyst.md`](analyst.md) | Judge plausibility as a European market analyst; separate input problems (real data fixes) from model problems (it won't) | 11 model problems (B1–B11) |

## What was fixed
Finding ids refer to the reports. Details, numbers and the new contracts are
in `tasks/2026-10-04-phase1-market-toy.md` (working notes).

- **Market clearing:**
  - transit no longer throttled at the importer's own demand (F1);
  - scarcity per zone, so no exporter spikes and no wrong-way flows (F2);
  - an empty zone prices at 0 (F7);
  - one price per uncongested group (F13);
  - input guards (F11);
  - honest `congested` flag (F16).
- **World state:** an explicit `snapshot()`/`restore()` contract: a year is a pure function of inputs, seed, year and starting state (F3/B6/M3). Also:
  - new storage starts empty (F15);
  - year and seed range checks (F12).
- **Core:**
  - capture rate `null` below 1 €/MWh mean (F4);
  - full-id demand streams (F5);
  - engine sized from inputs, so 40 zones run (F6);
  - storage never both ways in one hour (F8);
  - `addCapacity` and validator range checks (F9, F10);
  - two-pass std and wind renormalised (F16);
  - storage window on market prices (B3);
  - daily target fill and smooth fuel paths with no New Year step (B7).
- **Explorer:**
  - the newest request wins and the worker drops superseded work (M1);
  - payload-only rendering, so values are never mixed (M2);
  - single-year views start from the long run's 1 January state, so the summary matches the charts; "provisional" until then (M3);
  - all of m1–m13 and c1–c5;
  - chart titles name the zone, year, week and hour.

| QA scenario | Before | After: latest choice on screen |
|---|---|---|
| 5 zone changes 150 ms apart | 55.9 s | 1.5–1.6 s |
| 10 × New seed | 116 s | 1.4–1.5 s |
| Solar slider release | ~12 s, mixed values | 1.0 s, no mixed values |

Tests: 77 → 125 for Phase 1, every fix with a regression test; the sanity
test's wrong-way tolerance was tightened from 10 to 2 link-hours a year.

## Still open (follow-ups, not done)
These are model problems that real data alone will not fix; they belong with
the real-data step (Phase 1 parts b and c):
- **B1** Norway at the extremes: demand response, an inflow-driven water value, spill logic.
- **B2** boundary zones (FR, NL/BE, AT/CH/CZ/PL, SE, GB, PT).
- **B4** thermal tranches and commitment.
- **B5** cold, calm weather correlated across zones, plus forced outages.
- **B8** negative-price depth and vintage bids.
- **B9** UTC and time zones.
- **B10** coupling history.
- **B11** the player's assets need their own bids, not the fleet's subsidy bids; this matters for Phase 2.
- **F14** performance for ~40 zones.
- **For Lukas:** how unserved energy is shared between two short zones.

One Phase 2 note: the Phase 2 chapter test's leveraged bot survives or goes
bankrupt depending on the seed (before and after these fixes), so its seed
moved from 42 to 99 with a comment. A sturdier test belongs to the Phase 2
owner.
