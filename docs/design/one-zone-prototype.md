# One-zone prototype — design (Phase 2)

**Status:** approved by Lukas 2026-10-04 with his answers to §10 (D10–D12).
Built after the Phase 1 market toy, on top of its simulation core.
Implements the vision (D6) within the approved stack (D7). Numbers are tuning
values; changing the design's choices in §10 needs Lukas.

## The five-minute version
- **Where and when:** Western Denmark (the DK1 price zone: Jutland and Funen),
  1 January 1995 to 31 December 2025, in about an hour of play.
- **The start:** a farm in Jutland with a few solar panels on the barn roof
  and €150,000. The panels earn a trickle from the first sunny morning; the
  first real decision is the first wind turbine.
- **What happens:** 1995–99 you sell at fixed tariffs — safe, a time to learn
  to build. In July 1999 Western Denmark joins the Nordic power exchange and
  prices start moving hour by hour. From about 2009 they can go negative.
  From 2012 solar gets cheap and everyone builds it, so midday prices sag —
  including the price *your* panels earn. Batteries arrive around 2015 and
  start to pay around 2020. 2022 brings a price explosion; December 2024 a
  windless winter week.
- **What you decide:** where to build (16 sites with different wind, sun,
  grid room and permit times), what (wind, rooftop solar, solar parks,
  batteries), how (south- or east-west-facing panels; how big a battery), how
  to sell (tariff, the hourly market, or a 10-year contract with a data
  centre), how to pay (loans at the interest rates of the day), and when to
  switch off at negative prices.
- **The one question it answers:** when your solar earns less because
  everyone built solar, does that feel like a puzzle you can solve, or a
  punishment?
- **Goals:** bronze, silver and gold by 2025, measured in company value and
  in how well the portfolio dodged cannibalisation.
- **Not in it:** other countries (neighbours are a price at the border),
  named rivals, offshore wind, hydro, nuclear, experimental technology, art,
  sound.

## 1. Why one zone, and why Western Denmark
The core loop must prove itself before Europe is built (roadmap, Phase 2).
One zone is enough to test it if the zone has the whole arc and the player
can matter in it.

| Need | Western Denmark (DK1) | Germany (the alternative) |
|---|---|---|
| The whole history in one place | Tariffs → Nord Pool 1999 → negative prices → solar boom → batteries → 2022 → 2024 | The same, plus the clearest solar-first story (1,000-roofs programme, EEG 2000) |
| The player's own building moves the price | Yes: peak demand ~3.7 GW [unverified], so hundreds of MW show | Barely: ~80 GW peak; cannibalisation comes almost only from everyone else |
| Open price data to calibrate against | Energinet, CC BY 4.0, commercial use explicit [report] | Energinet republishes DE too; ENTSO-E terms unverified |
| Neighbours available from Phase 1 | Germany and Norway are toy zones | Its neighbours are mostly not toy zones |
| Story and marketing | Lukas's home; the wind-cooperative country; a "Danish tycoon" angle [report] | Energiewende |

**Decided: DK1** (D10). One cost: the brief starts with solar panels, and in
1990s Denmark solar barely paid while wind did — settled by starting with
panels already on the barn and wind as the first big buy (D11). Germany stays
the strongest candidate for the vertical slice.

## 2. The first 45 minutes, step by step
Times are targets at mixed speeds, tuned in playtests (§6).

| Real time | Game time | The player sees | Decides | Learns |
|---|---|---|---|---|
| 0–2 min | Jan 1995 | Jutland map, the farm, panels producing on a sunny day, cash ticking up | Un-pause; try the speeds | Sun → kWh → money; time controls |
| 2–6 | 1995 | Advisor card: "The utility must buy wind power at a fixed price." Sites light up with wind ratings | First site; 225, 500 or 600 kW turbine; an 80% loan | Site quality; permits take months; loans |
| 6–12 | 1995–98 | Turbines turning; the annual report; a calm year earns less | More turbines? Which sites? How much debt? | Weather years vary; others claim good sites too |
| 12–15 | 1999 | Event: "Western Denmark joins Nord Pool (July 1999)." An hourly price curve appears | Build before the switch or after? | Old turbines keep their tariff for 10 years; new ones earn the hourly price plus a premium |
| 15–25 | 2000–08 | 2 MW turbines; carbon price from 2005, crash in 2007; credit tightens in 2008 | Repower old sites? Expand? Keep a cash buffer? | Prices follow fuel and carbon; credit cycles |
| 25–30 | 2009–11 | First negative hours; "switch off below €0?" unlocks | Set the rule per asset | Negative prices; curtailment |
| 30–38 | 2012–16 | Cheap panels, a rooftop boom, then a rule change; solar parks become viable; the capture-price chart shows solar earning less than the average | Solar or not; south or east-west; share a wind site's grid connection? | Cannibalisation — and the "why?" breakdown |
| 38–45 | 2016–21 | Batteries (expensive at first); a data-centre operator offers a 10-year fixed-price contract | Battery size (MW and hours); contract or hourly market | The answers to cannibalisation |
| 45–60 | 2022–25 | 2022 price spike and windfall cap; negative hours spread; December 2024 windless week | Hold cash or hedge; let batteries work the spikes | Volatility pays flexible assets |
| End | 31 Dec 2025 | Medal screen with the score broken down | — | — |

If a tester runs out of time before 2012, the gate question is not answered.
The prototype therefore ships a **2012 checkpoint**: a save produced by the
"diversified" bot (§9) that a tester can start from.

## 3. The three loops in the prototype
- **Operating (minutes):** the day's price curve and weather; batteries
  charge and discharge by their rule; assets switch off below their floor
  price; alerts auto-pause the game (negative-price run, price spike above
  €200/MWh, an offer arriving, a loan due without cash).
- **Project (hours):** pick a site → choose technology, size and options →
  read the preview → finance → permit (months) → build (months) → connect →
  operate → repower or retire at end of life.
- **Era (campaign):** the selling regime changes (§4.4), technology
  generations arrive (§4.3), credit and fuel conditions shift (§6), events
  fire (§4.8).

## 4. Systems

### 4.1 Market
Comes from the Phase 1 simulation core; the prototype adds the player's
assets as blocks in the DK1 supply stack.
- Hourly merit order for DK1: the historical thermal fleet (coal CHP, gas
  CHP, decentral CHP, peakers) at fuel- and carbon-driven marginal costs;
  wind, solar and batteries from **everyone else** following DK1's historical
  build-out ("the market"); the player's assets on top.
- Two borders: **North** (Norway and Sweden) and **South** (Germany), each a
  link with a historical capacity [tuning] to a neighbour price taken from
  the Phase 1 toy's NO and DE zones. Exports flow while DK1 is cheaper and the
  link has room; when links fill on windy or sunny hours, DK1's price
  separates and falls. That is where the player feels cannibalisation.
- Regulated mode until 30 June 1999: wind and rooftop solar are paid fixed
  rates, regardless of the hour. Market mode from 1 July 1999 (DK1 joined
  Nord Pool in 1999 [notes, unverified]).
- Price floor 0 until 2009, then negative prices allowed [unverified; tuning].
  Price cap from the toy.

### 4.2 Sites
Sixteen sites in five areas, plus rooftop slots on the farm and on rented
roofs. Values are tuning placeholders until the Global Wind Atlas layer
(CC BY 4.0 [report]) replaces them.

| Area | Sites | Wind | Sun | Grid room | Land | Permits |
|---|---|---|---|---|---|---|
| West coast (Thy, Ringkøbing, Esbjerg) | 4 | ×1.25 | ×1.00 | medium | cheap | slow |
| North (Aalborg, Himmerland) | 3 | ×1.10 | ×0.97 | good | medium | medium |
| Central heath (Herning, Viborg) | 4 | ×1.00 | ×1.00 | limited until a 2010 upgrade | cheap | fast |
| East (Aarhus, Vejle) | 3 | ×0.85 | ×1.02 | strong | expensive | medium |
| South (Aabenraa, Tønder) | 2 | ×1.05 | ×1.05 | strong, near the German link | medium | medium |

Each site has a MW limit and shares its area's grid room. Everyone else's
build-out claims free sites over time, following history, so the best sites
do not wait for the player. Several assets on one site share one grid
connection (cheaper), which makes "add a battery to my wind site" a real
choice.

### 4.3 Technologies
| Technology | From | Unit choices | Notes |
|---|---|---|---|
| Rooftop solar | 1995 | 5, 10, 50 kWp | Rooftop slots; no site needed |
| Small wind turbine | 1995 (until 2003) | 225, 500, 600 kW | The 1990s workhorse |
| MW wind turbine | 2000 | 2 MW → 3 MW (2008) → 4 MW (2015) | Larger generations need larger sites; repowering replaces old ones |
| Solar park | 2010 (pays from ~2015) | 1–50 MW | South-facing (most energy) or east-west (less energy, better hours) |
| Battery | 2015 | MW × 1, 2 or 4 hours | Arbitrage; wear per cycle |

Every asset has capital cost, fixed O&M, lifetime and ageing (solar output
degrades; turbines lose availability with age), and can be sold or retired.

### 4.4 How power is sold
| Period | New wind | New solar | Existing assets |
|---|---|---|---|
| 1995 → June 1999 | Fixed tariff | Rooftop: offsets the farm's own bill (net metering) | — |
| July 1999 → 2008 | Hourly price + a premium for a set amount of output | Rooftop: net metering | Pre-1999 turbines keep the fixed tariff for 10 years from commissioning |
| 2008 → 2017 | Hourly price + a larger premium for 22,000 full-load hours [unverified] | Rooftop: yearly net metering, hourly from late 2012 [unverified]; parks: hourly price | Premiums run out |
| 2016 onward | Hourly price, or a 10-year fixed-price contract | Same | — |

The real Danish rules are simplified here; the "how much" is in §6.
**Contracts:** from 2016 a data-centre operator (invented name) offers to buy a
share of one park's output at a fixed price for 10 years. The price offered
follows the market outlook, so contracts signed early, before saturation,
are worth more. A contract counts as earned price in every score.

### 4.5 Money
- Cash; loans of up to 80% of a project's cost [tuning], repaid in equal
  instalments over 10–15 years, at the era's interest rate (§6); in autumn
  2008 rates rise and the loan share drops to 60% for two years.
- **Company value** = cash − debt + the value of each asset, where an asset's
  value is its trailing three-year net cash flow times an annuity factor over
  its remaining life at 7% [tuning]. A cannibalised asset therefore loses
  value the moment it earns less — the feedback the puzzle needs.
- **Bankruptcy:** cash below zero for 90 days with no loan room → "the bank
  takes over", game over.

### 4.6 Batteries
Rule-based, as the report recommends: charge below the rolling 25th price
percentile, discharge above the 75th; the player can tune both thresholds.
Forecast error, round-trip losses and wear per cycle keep it from being a
money printer, and everyone else's batteries (history) flatten the spreads
over time.

### 4.7 Switching off at negative prices
Unlocked with the first negative hour. Per asset, "switch off below
€X/MWh" (default €0). Tariff and premium rules decide whether switching off
loses support payments; the "why?" breakdown shows the trade-off.

### 4.8 Events (historical calendar in the prototype)
| When | Event | Effect | Source |
|---|---|---|---|
| Jul 1999 | Western Denmark joins Nord Pool | Market mode | [notes, unverified] |
| Dec 1999 | Hurricane over Denmark | Turbines trip; some damage; insured or not | [unverified]; storm Lothar the same month [report] |
| 2005 | EU carbon market starts | Coal and gas bid higher | [report] |
| 2007 | Carbon price crashes to about €0 | Thermal bids fall | [report] |
| Autumn 2008 | Financial crisis | Rates up, loan share down for two years | [unverified] |
| ~2009 | Negative prices allowed | Switch-off rule unlocks | [unverified] |
| 2012 | Rooftop solar boom, then a net-metering rule change | Cheap rooftop solar; hourly settlement afterwards | [unverified] |
| 2021–23 | Gas crisis; EU windfall cap at €180/MWh, Dec 2022 – Jun 2023 | Price spike, then clawback above the cap | [report] |
| Dec 2024 | Windless winter week | Price spike via the German link | [report]: €936/MWh in Germany, 12 Dec 2024 |

Randomised event timing ("alternate history") is deferred; weather is
already reshuffled per game (§4.1), so no two runs are the same.

## 5. Screens (rough wireframes)
Designed at 1280×800, nothing reachable only by hovering (D8).

**Main**
```
┌──────────────────────────────────────────────┐
│ 14 Mar 2013  ❚❚ ▶ ▶▶ ▶▶▶  Cash €4.2m  Value €38m│
├──────────────────────────┬───────────────────┤
│  JUTLAND (DK1)           │ TODAY €/MWh       │
│   ○ Thy      ● Aalborg   │ 60┤    ╭╮         │
│ ● Ringkøbing  ○ Viborg   │ 30┤╭───╯╰╮   ╭─   │
│ ○ Esbjerg  ● Herning     │  0┼╯     ╰───╯    │
│      ○ Vejle  ● Aarhus   │   0h   12h   24h  │
│ ○ Tønder  ● Aabenraa     │ Wind ▮▮▮▯  Sun ▮▯ │
│ North link ▲ 1.2 GW full │ South link ▼ 0.4  │
├──────────────────────────┴───────────────────┤
│ ⚠ Solar earned 71% of the average  [Why?]    │
│ [Build] [Market] [Finance] [Assets] [Report] │
└──────────────────────────────────────────────┘
```

**Build, with the preview**
```
┌ Herning heath · site 7 ─────────────────────┐
│ Wind ×1.00  Sun ×1.00  Grid room 40 MW       │
│ Permit ~14 months  ·  Land €3k/MW/yr         │
├──────────────────────────────────────────────┤
│ Solar park 20 MW   (•) South  ( ) East-west  │
│ Cost €11.0m  ·  loan 80% at 2.1%             │
│ Yield: normal year 21 GWh · bad year 19 GWh  │
│ Expected price earned €38/MWh (average €52)  │
│   your park lowers midday prices by €0.6     │
│ Payback 9–12 years                           │
│ Sell: (•) hourly market  ( ) contract €45    │
│ [Build]   [Compare: + battery 10 MW / 20 MWh]│
└──────────────────────────────────────────────┘
```

**Market: the merit-order ladder, capture rates, the pipeline**
```
┌ Market · 14 Mar 2013 · 13:00 ────────────────┐
│ €/MWh                                        │
│  90┤                         ███ peakers     │
│  60┤                 ████████ gas CHP        │
│  40┤         ████████ coal CHP  ← price      │
│   0┤▓▓▓▓▓▓▓▓▓ wind + solar  (▓ = yours)      │
│    └──────────────│─────────────── MW        │
│            demand + exports                  │
│ Earned vs average, 2013: wind 88% solar 74%  │
│ Coming in DK1: +300 MW solar, +150 MW wind   │
└──────────────────────────────────────────────┘
```

**"Why?" — on every price the game shows**
```
┌ Why did Herning Solar earn €31/MWh in June? ┐
│ DK1 average price                     €52   │
│ − sold mostly in sunny hours          −€15  │
│ − switched off 11 negative hours       −€4  │
│ − forecast errors                      −€2  │
│ = earned                              €31   │
│ Could help: east-west panels · a battery ·  │
│ a fixed-price contract                      │
└─────────────────────────────────────────────┘
```

**Finance**
```
┌ Finance · 2013 ──────────────────────────────┐
│ Cash €4.2m   Debt €61m   Company value €38m  │
│ Loans: 9 · average rate 3.4% · next due €2.1m│
│ This year: revenue  €14.8m   O&M     −€3.1m  │
│            interest −€2.2m   repaid  −€4.9m  │
│ Assets: 31 turbines (5 near end of tariff)   │
│         3 solar parks · 0 batteries          │
│ [Borrow]  [Repay early]  [Sell an asset]     │
└──────────────────────────────────────────────┘
```

**Annual report**
ends each year in one card — earnings, best and worst asset, what changed in
the market — and is the natural place to stop a session.

## 6. Starting numbers
All are **tuning values**. Markers: [report]/[notes] = from the 2026-10-04
research; [unverified] = background knowledge to check in the verification
pass; [tuning] = invented to make the prototype run, to be set by bot runs
and playtests. The Phase 1 toy's calibration replaces the price levels.

| Item | Value | Marker |
|---|---|---|
| Start | 1 Jan 1995; €150,000 cash; 10 kWp on the barn | [tuning] |
| Currency | Euro, nominal, throughout | design choice |
| Speeds | Pause, ×1 (a year ≈ 2.4 min), ×3, ×10 | [tuning] |
| Interest rate | ~8% (1995) → 6% (2000) → 4% (2005) → 3% (2010) → 1% (2015) → 0.5% (2020) → 4% (2023) | [unverified] |
| 1990s wind tariff | ~€80/MWh, fixed | [unverified]: Danish 85%-of-consumer-price rule plus subsidies [notes] |
| Rooftop solar value | Avoided retail price, ~€130/MWh (1995) rising with taxes | [unverified] |
| 1999–2008 wind premium | ~€13/MWh on top of the hourly price | [tuning] |
| 2008–2017 wind premium | ~€33/MWh for 22,000 full-load hours | [unverified] |
| Wind turbine cost | ~€1,000/kW (1995) → ~€1,000/kW (2024: $1,041/kW) with a mid-2000s bump | [report] for 2024; rest [unverified] |
| Wind capacity factor | 22% (1995 turbines) → 35% (2020s turbines), × site rating | [tuning]; Vindeby offshore 22% [report] |
| Solar system cost | ~€10/W (1995) → €3/W (2010) → €1.8/W (2012 rooftop) → ~€0.6/W (2024 parks: $691/kW) | [report] for 2024; rest [unverified]; modules follow a 24.9% learning rate [report] |
| Solar capacity factor | ~11% south; east-west ~10% with better hours | [tuning] |
| Battery cost | $2,571/kWh (2010) → $192/kWh (2024) system cost | [report] |
| Battery | 88% round trip; wear €/MWh cycled [tuning] | [tuning] |
| O&M per year | Wind €25/kW; solar €10/kW; battery €5/kWh | [tuning] |
| Lifetimes | Wind 20–25 years; solar 30 (−0.5%/yr); battery 15 years or a cycle limit | [tuning] |
| Loan | 80% of cost, 10–15 years; 60% in 2008–2010 | [tuning] |

## 7. Goals
The chapter ends on 31 December 2025. One medal is a pass; gold is mastery.

| Medal | Condition |
|---|---|
| Bronze | Solvent, company value ≥ €25m |
| Silver | Company value ≥ €100m |
| Gold | Company value ≥ €250m **and** a 2023–2025 earned price ≥ 90% of the DK1 average (energy-weighted, contracts included) |

Thresholds are set by the bots (§9): the cautious bot should reach bronze,
single-technology bots no better than silver, and the best mixed strategy
gold in a minority of seeds.

## 8. "No single best strategy": what the prototype implements
| Counter (vision) | In the prototype |
|---|---|
| Cannibalisation | **Yes** — the core of it |
| Geography | Partly: 16 sites with different wind, sun, grid room and permits; spreading across countries waits for more zones |
| Eras change the rules | **Yes**: tariff → market + premium → market or contract |
| Rivals | Deferred; history's build-out claims sites, so scarcity is real |
| Scarcity | **Yes**: site limits, shared grid room, permit times |
| Ageing | **Yes**: degradation, availability, end of life, repowering |
| Capital | **Yes**: interest path, the 2008 credit squeeze |
| Scoring by value delivered | **Yes**: company value from earnings; the gold condition |
| Batteries as a money printer | **Yes**: wear, forecast error, spreads that shrink |
| Foreknowledge | Partly: weather reshuffled; events on the real calendar |
| Leverage loops | Partly: loan limits and rates; takeovers deferred |
| Subsidy farming | Deferred: the policy-risk meter; the 2012 rule change is scripted |
| Deliberately staying small | Not applicable without rivals |

## 9. Playtest plan
**Testers:** Lukas plus 3–5 friends, at least two who play management games
and one or two who don't. A browser link; 60–75 minutes; the observer does
not help.

**Measured automatically** (an exportable session log, no server): time to
reach each era; decisions taken; speed and pause use; when the portfolio's
earned price first falls below 80% of the average, and how long until the
first counter-move (east-west panels, a battery, a contract, a switch-off
rule, a technology change); bankruptcies; medal.

**Asked afterwards:**
1. Did you want to keep playing? (yes/no)
2. When your solar or wind earned less, did you feel you could do something
   about it? (1–5)
3. Why did your solar earn less in later years? (open — checks
   understanding)
4. What was boring? (open)
5. What would you do differently next time? (open — replay intent)

**The gate passes when:** at least three of four testers want to keep
playing; question 2 averages 3.5 or more; at least three of four explain
cannibalisation correctly; at least three of four made a counter-move within
three game years of the first warning.

**Bots, nightly:** six scripted strategies — all-wind, all-solar, cautious,
greedy (maximum debt), diversified, diversified + storage + contracts — over
50 seeds each. A dominant strategy exists if one bot wins gold in most seeds
while every other stays at bronze or below.

**What answer changes the design:**
| Finding | Change |
|---|---|
| Felt as punishment (Q2 ≤ 2.5, few counter-moves) | Earlier warning (the pipeline shows coming build-out sooner), counter-moves earlier and cheaper, gentler cannibalisation via border-link capacity |
| Not noticed (no change in decisions) | Stronger cannibalisation, louder "why?" alerts |
| Not understood (Q3 wrong) | Rework the "why?" breakdown and the market screen before anything else |
| One bot dominates | Retune costs, wear or contract prices; re-run |
| 1995–99 boring | Shorten the regulated era or start in 1999 |
| Years fly by or drag | Retune the speeds |

## 10. Decisions
**Decided in this design** (builder-level; revisit after the playtest):
- Discrete sites on a stylised map, not a tile map of resource potential.
  Same decisions, far less to build; the vertical slice can revisit it.
- Neighbours are fixed price series at two borders; no rivals with names.
- Euro, nominal, for all years.
- "Gridmaster" as an in-game rank waits for the naming decision (D3).

**Decided by Lukas** (2026-10-04, each the recommended option):
- **P1 → D10.** The prototype is Western Denmark. (Alternative was Germany.)
- **P2 → D11.** Start with a few panels already on the barn earning a trickle;
  wind is the first big buy. (Alternative was buying panels that pay well
  thanks to a generous grant.)
- **P3 → D12.** In the full game the player never builds fossil plants, but
  late on can buy retiring ones for their grid connections and convert them.
  (Alternatives were never touching fossil, or owning it like DONG/Ørsted.)
