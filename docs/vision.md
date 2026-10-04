# Vision — approved by Lukas 2026-10-04 (decision D6)

Interprets `docs/original-brief.md` in the light of the 2026-10-04 research
report (`docs/research/reports/Renewable energy tycoon game research.md`,
"the report"; section names below refer to it). This is the direction:
changing a pillar needs Lukas; the open design questions at the end belong to
the design task.

## In one sentence
Grow a European energy company from a few solar panels in 1990 into a
continental power player, in markets and weather that behave like the real
thing and push back.

## Why this game
- **The slot is empty.** No verified game — on Steam, mobile or the tabletop —
  turns Europe's wholesale electricity market into play: merit order, price
  cannibalisation, negative prices, storage arbitrage. Nearby titles are
  freemium or idle (Energy Manager, GridEnergy) or engineering and operator
  sims (Power Network Tycoon, Nucleares). The slot is filling with small
  titles (ten or more energy-business store pages since late 2025), so
  distinctiveness and polish win it, not speed.
- **The real economics are the progression.** More renewables lower the price
  renewables earn; more negative-price hours make storage pay. The brief's
  instinct — batteries arrive *because* volatility grows — is exactly what
  happened in Europe, and no game has built on it.
- **The audience exists, and the case is modest.** Planners aged 30–55 who buy
  pausable, authentic management sims at about $20. Small Danish studios have
  sold hundreds of thousands to a million copies (Big Ambitions, Software
  Inc.), but the median Steam game earns little: plan for tens of thousands
  of dollars, hope for more.

## Pillars
1. **History is the difficulty curve.** Four real eras, each a new problem:
   1990s flat feed-in tariffs (low variance — learn to build); the 2000s
   subsidy gold rush (lock in tariffs before the caps); the 2010s hangover
   (retroactive cuts, market exposure); 2020–2026 volatility (storage,
   collapsing capture prices, windfall clawbacks). Each mechanic arrives when
   history introduced it: negative prices are impossible before late 2008;
   15-minute trading unlocks after October 2025.
2. **The market fights back.** Every zone's hourly price is a merit order the
   player is part of. Fill Spain with solar and *you* depress Spain's midday
   price. One authentic rule delivers the realism, recreates the history, and
   stops any single strategy or the late-game snowball from winning.
3. **Real Europe, real weather — never a replay.** Real weather-years,
   reshuffled every playthrough: pan-European wind lulls, Iberian summers, dry
   Nordic years — authentic, but not predictable from a history book. Prices
   are computed from it, never replayed.
4. **Every megawatt is a bet.** Where (site, grid access, market), what (cheap
   now or cheaper later), how to sell (tariff, spot, contract) and how to pay
   (debt or equity, at the interest rates of the day).
5. **The game does the arithmetic, the player keeps the judgement.** Never
   show a number the simulation does not use; every figure breaks down on
   hover ("why did my solar farm earn €31/MWh?"); every build gets a preview
   of its effect on the price curve and its payback in a normal and a bad year.
6. **Mature, optimistic, never preachy.** A company-owner fantasy in which
   renewables win because the player makes them pay. Nuclear is trade-offs,
   not a position. Real crises are set pieces, not lectures. Rivals follow
   real corporate arcs under invented names (a fossil incumbent turned
   offshore champion that overreaches, a nuclear champion with correlated
   outages, a turbine maker with a serial defect).

## How it plays — the "optimal playstyle"
- **Real-time with pause and speeds.** The market runs every hour underneath;
  the player sees days, weeks and months. Auto-pause on alerts (a run of
  negative prices, a scarcity spike, a tender opening); optional "zoom-in"
  weeks at hourly resolution for crises; an annual report as the natural end
  of a session.
- **Three loops.** *Operating* (minutes): read the forecast, dispatch, curtail,
  store. *Project* (hours): site, permit, finance, build, connect. *Era*
  (campaign): policy regime, technology and market structure change.
- **Progression changes the kind of business,** not just the numbers:
  rooftop self-consumption → feed-in-tariff projects → utility-scale auctions
  and long-term contracts → merchant sales → cross-border trading and
  flexibility → power-to-X offtake. Each tier adds one revenue stream and one
  risk. Chores become delegable as the company grows: maintenance crews, a
  trading desk, an auto-bidder, then portfolio policies.
- **Revenue is energy delivered times the price it earned** — never nameplate
  capacity (Power Grid's "cities powered, not cities built").
- **The merit-order ladder is a first-class screen:** each zone's supply stack
  against demand, the player's own blocks highlighted.
- **Optimal play moves.** A strong player builds low-variance projects under
  1990s tariffs, rides the 2000s boom while watching each country's policy
  risk, moves into zones before they saturate and hedges with contracts, and
  in the 2020s owns both sides — generation plus the storage, flexibility and
  power-to-X that profit from everyone else's overbuilding. Spread across
  zones whose weather is not perfectly correlated, with moderate debt.
- **Modes.** A 1990–2030 campaign in four era chapters with bronze/silver/gold
  goals (pass with one, master with three); a sandbox running on to 2050;
  2–3 crisis scenarios (the 2022 gas shock, the 2024 Dunkelflaute, storm
  Lothar).
- **Difficulty switches whole systems** (the Workers & Resources lesson), with
  each one also toggleable on its own:

  | Preset | Forecasts | Permits and grid queues | Imbalance penalties |
  |---|---|---|---|
  | Casual | Perfect | Short | Off |
  | Realistic | With error | On | On |
  | Analyst | With error | On | On, plus interest-rate eras and degradation |

- **Success is more than money:** reputation that eases planning approval,
  share of decarbonisation, system stability, prestige goals such as keeping
  a country lit through a two-week wind lull.

## No single best strategy — every counter comes from the simulation
| Degenerate strategy | Counter |
|---|---|
| Solar spam in the sunniest zone | Cannibalised capture price, curtailment, grid queues, congestion costs |
| Batteries as a money printer | Forecast error, wear per cycle, spreads that shrink as storage fleets grow |
| Build once, earn forever | Degradation, rising maintenance, tariffs and contracts that expire |
| Foreknowledge of 2022 | Randomised event timing outside the strict campaign; resampled weather |
| Pointless or trivially safe spreading | Tuned cross-zone correlation, e.g. Europe-wide wind lulls |
| Leverage loops | Debt lowers valuation and invites takeover bids; interest-rate eras |
| Subsidy farming | A per-country policy-risk meter (Italy's 2013 cap, Spain's retroactive cuts) |
| Deliberately staying small | Never rewarded; catch-up comes as opportunity, never as a penalty for leading |

Dominance is caught by measurement, not argument: headless bot players with
scripted strategies play many seeds nightly; if one wins everywhere, the
design changes.

## The biggest risk
No playtest anywhere shows that price cannibalisation is *fun*. It is reasoned
design. The first playable prototype exists to test exactly this: does it
read as a puzzle rather than a punishment? (`docs/roadmap.md`, Phase 2.)

## What it is not (scope guardrails)
- Not a grid-physics engineering sim: no voltage, frequency or power flow.
- Not a city builder: no terrain sculpting, roads or individual citizens.
- Not 3D: a diagrammatic "control-room" map and charts.
- Not idle, clicker or free-to-play; no microtransactions.
- Not a political game: policy is history and mechanics, not commentary.
- Not multiplayer in the first release.

## Platforms
Windows and macOS through Steam (decision D4); Linux and Steam Deck if cheap.
The interface is designed at 1280×800 with nothing reachable only by
hovering, which serves the Deck now and keeps a tablet version possible.
Mobile is not a launch platform (decision D8); the phone is where Lukas
reviews builds in a browser.

## Design questions, as resolved by the prototype design (2026-10-04)
- **Fossil plants:** never built by the player; late in the game, retiring
  ones can be bought for their grid connections and converted (D12).
- **Sites or tiles:** discrete sites on a stylised map for the prototype;
  the vertical slice may revisit it (`docs/design/one-zone-prototype.md` §10).
- **"Gridmaster" as an in-game rank:** waits for the naming decision (D3).
