# One-zone prototype — design (Phase 2)

**Status:** approved by Lukas 2026-10-04 with his answers to §10 (D10–D12);
the reward layer (§4.9–§4.13, restructuring in §4.5, the playtest additions
in §9) added the same day with D14, from the fun and progression review
(`docs/reviews/2026-10-04-fun-and-progression.md`).
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
- **What keeps it rewarding** (D14): the company climbs four levels the
  player earns, from the farmhouse kitchen to a headquarters in Aarhus; an
  optional offer arrives every few minutes; one named rival, Nordhav, is the
  face of everyone else's building; the game says "called it" when a bet
  pays off; jackpots, records and the player's growing footprint are
  celebrated; going bust once means restructuring, not game over.
- **Not in it:** other countries (neighbours are a price at the border),
  rivals that make their own decisions, offshore wind, hydro, nuclear,
  experimental technology, art, sound.

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
| 6–12 | 1995–98 | Turbines turning; the annual report and its first "called it" line; a calm year earns less; **level 2, co-op partner**; the first offers (a landowner's site, a municipality's community wind) | More turbines? Which sites? How much debt? Take the offer? | Weather years vary; others claim good sites too; a ready company gets the offers |
| 12–15 | 1999 | Event: "Western Denmark joins Nord Pool (July 1999)." An hourly price curve appears | Build before the switch or after? | Old turbines keep their tariff for 10 years; new ones earn the hourly price plus a premium |
| 15–25 | 2000–08 | 2 MW turbines; Nordhav, the old coal utility, announces its first wind farm; **level 3, developer**, around 2005; the bank offers to refinance as rates fall; carbon price from 2005, crash in 2007; credit tightens in 2008 | Repower old sites? Expand? Refinance? Keep a cash buffer? | Prices follow fuel and carbon; credit cycles |
| 25–30 | 2009–11 | First negative hours; "switch off below €0?" unlocks; a bankrupt co-op's turbines for sale at a discount | Set the rule per asset; buy the fire sale? | Negative prices; curtailment; cash in a crisis is an opportunity |
| 30–38 | 2012–16 | Cheap panels, a rooftop boom, then a rule change; solar parks become viable; Nordhav's solar parks appear in the pipeline, then online; the capture-price chart shows solar earning less than the average; "called it" on panel orientation | Solar or not; south or east-west; share a wind site's grid connection? | Cannibalisation — and the "why?" breakdown |
| 38–45 | 2016–21 | Batteries (expensive at first); a data-centre operator offers a 10-year fixed-price contract (a bigger one to developers); **level 4, utility**, around 2016, with a trading desk | Battery size (MW and hours); contract or hourly market | The answers to cannibalisation |
| 45–60 | 2022–25 | A 2021 offer to sell next winter's output at a fixed price; the 2022 price spike and windfall cap; negative hours spread; December 2024 windless week; payout cards and records | Take the hedge or stay exposed; let batteries work the spikes | Volatility pays flexible assets |
| End | 31 Dec 2025 | Medal screen with the score broken down, the run's three best calls, and the footprint (share of DK1's power, homes supplied) | — | — |

If a tester runs out of time before 2012, the gate question is not answered.
The prototype therefore ships a **2012 checkpoint**: a save produced by the
"diversified" bot (§9) that a tester can start from.

## 3. The three loops in the prototype
- **Operating (minutes):** the day's price curve and weather; batteries
  charge and discharge by their rule; assets switch off below their floor
  price; alerts auto-pause the game (negative-price run, price spike above
  €200/MWh, an offer arriving, a level reached, a loan due without cash).
- **Project (hours):** pick a site → choose technology, size and options →
  read the preview → finance → permit (months) → build (months) → connect →
  operate → repower or retire at end of life.
- **Era (campaign):** the selling regime changes (§4.4), technology
  generations arrive (§4.3), credit and fuel conditions shift (§6), events
  fire (§4.8).
- **Company (earned, D14):** the calendar decides what exists; the player's
  milestones decide what the company has earned: levels and their perks
  (§4.9), offers that need a level (§4.10), and the reward beats of
  §4.12–§4.13.

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
share of one park's output at a fixed price for 10 years (a card in §4.10;
a developer, level 3 in §4.9, is offered a larger share). The price offered
follows the market outlook, so contracts signed early, before saturation,
are worth more. A contract counts as earned price in every score.

### 4.5 Money
- Cash; loans of up to 80% of a project's cost [tuning], repaid in equal
  instalments over 10–15 years, at the era's interest rate (§6); in autumn
  2008 rates rise and the loan share drops to 60% for two years.
  Instalments start once the asset runs (slice 1).
- **Company loan** (the Finance screen's [Borrow], added in slice 1): the
  bank lends against the operating assets until all debt together reaches
  60% of their value [tuning], at the era's rate plus 1 point [tuning]. Without
  it, a player could not afford a 2 MW turbine's share once the small
  turbines leave the catalogue in 2003, and the middle of the game stalled
  in the bot runs (`tasks/2026-10-04-phase2-one-zone-prototype.md`).
- **Company value** = cash − debt + the value of each asset, where an asset's
  value is its trailing three-year net cash flow times an annuity factor over
  its remaining life at 7% [tuning]. A cannibalised asset therefore loses
  value the moment it earns less — the feedback the puzzle needs.
- **Restructuring, then bankruptcy** (D14). The first time cash stays below
  zero for 90 days with no loan room, the bank restructures the company
  instead of ending the game:
  1. it sells the player's assets one at a time, lowest trailing net cash
     flow first, at 70% of their asset value [tuning], until cash covers six
     months of debt service [tuning];
  2. for the next five years, 25% of each year's positive net cash flow
     [tuning] goes to the bank as a fee (not as repayment, so it costs
     company value);
  3. gold is no longer possible in this run, and the medal screen says why;
     levels already reached are kept.

  The second time in one run, "the bank takes over": game over.

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

### 4.9 Company levels (D14)
The player earns levels through milestones; the calendar never grants one.
A level is never lost, perks only add, and reaching one auto-pauses on a
card that names the new perks. Thresholds are [tuning], set by the bots: in
the median seed the diversified bot (§9) should reach level 2 by about 1998,
level 3 by about 2006 and level 4 by about 2016; the cautious bot level 3.

| Level | Reached when | Headquarters (map and header) | Perks |
|---|---|---|---|
| 1 Farm | Start | The farmhouse kitchen | — |
| 2 Co-op partner | 2 MW in operation | A shared office with the local wind co-op in Herning | New loans 0.5 points below the era's rate; co-op and municipality offers (§4.10) |
| 3 Developer | 25 MW in operation and company value ≥ €10m | An office in Aarhus | New loans 1 point below the era's rate; permit times −15%; large offers, and a larger data-centre contract (§4.4) |
| 4 Utility | 150 MW in operation and company value ≥ €60m | A headquarters on the Aarhus harbour front | A trading desk (below); refinancing on request instead of by offer |

Loan rates never fall below 0.25% [tuning]. The rationale is real: banks
lend more cheaply to proven borrowers and experienced developers permit
faster. **The trading desk** is the first rung of the vision's "chores
become delegable": for each asset the player puts "on the desk", it sets the
battery thresholds (§4.6) and switch-off floor (§4.7) each quarter to the
values that would have earned most over the trailing 90 days, using the
re-pricing of §4.12. The player can override it at any time.

### 4.10 Offers (D14)
An offer is an optional, timed proposal on a card: what is offered, what it
costs, what it pays, and a deadline. It auto-pauses (§3); declining costs
nothing. The deck is data, one entry per card: a window of years, a
condition (level, assets, cash, market state), the terms, a deadline and a
bot rule; adding a card is cheap. Cadence: about one offer every 8–12 game
months [tuning], aiming at one every 3–5 minutes of play at the playtest's
mixed speeds. At most one offer is open at a time. Each card's timing within
its window is drawn from the run's seed, so runs differ, and each card fires
once unless marked recurring.

| Card | Window | Needs | Offer | Why it is there |
|---|---|---|---|---|
| A landowner's site | 1995–98 | — | A west-coast site already half-way through its permit, for a fee; six months to decide | The first offer: a good site without the wait |
| Community wind | 1996–2002 | Level 2 | A municipality wants a set number of MW in its area by a date; if delivered, permit times there −30% for five years | A goal with a deadline |
| Bulk order | 2000–05 | Level 2 | The turbine maker offers 10% off five or more turbines ordered within a year | A reason to plan a build-out |
| Repowering partner | 2001–06 | Level 2 | A co-op with old 225 kW turbines on a strong site offers it for repowering, for a share of the new output | A strong site that history would otherwise keep |
| Refinance (recurring) | 1999–2021 | Level 2 | When the era's rate is 1.5 points or more below the player's average loan rate: refinance every loan at today's rate for a 1% fee | Falling rates (§6) become a reward |
| Fire sale | 2008–10 | Cash | A bankrupt co-op's turbines at 60% of their asset value, cash only (loans are tight), three months | A cash buffer pays off |
| Grid room on the heath | 2008–09 | Level 3 | Pay towards the central heath's 2010 grid upgrade (§4.2) for 30 MW of reserved room there | Grid room as an asset |
| Rented roofs | 2012–14 | — | A supermarket chain offers five roofs for rooftop solar | More rooftop slots during the boom |
| Data-centre contract | 2016–21 | — (a larger share from level 3) | §4.4's 10-year fixed-price contract | An answer to cannibalisation, open to every player |
| Battery pilot | 2017–19 | Level 3 | A supplier offers 30% off a first battery in exchange for its operating data | A cheaper first step into storage |
| Hedge next winter | 2021 | Assets selling at the hourly price | A trader buys next winter's output at a fixed price: the trailing 12-month average plus 10% | A bet: safety now, or the 2022 jackpot |
| Nordhav wants your site | 2005–20 | A site the player has claimed but not built | Nordhav (§4.11) offers to buy the claim at a premium | The rival, in person |
| Pension-fund buyer | 2019–25 | Level 4 | An investor offers 115% of one operating park's asset value | Cashing in; a late-game choice |

All terms are [tuning]; each card's real-world plausibility is [unverified]
beyond §4.8's sources. **Bots** accept an offer when its expected net
present value at 7% [tuning] in a normal year is positive and they can pay;
the cautious bot also keeps its cash buffer. A card that tips a strategy
into dominance therefore shows up in the nightly runs (§9).

### 4.11 Nordhav: the face of everyone else (D14)
One named rival, **Nordhav Energi**, gives the build-out of §4.1–§4.2 a
face. The name is a working name from the research report; check it against
trademarks before any public build, like the game's own name (D3). Nordhav
makes no decisions: everything it does is history's build-out, attributed.
- **Who:** Western Denmark's old coal and gas utility (invented), following
  the report's arc of a fossil incumbent that turns to wind. The coal and
  gas CHP blocks in the merit-order ladder carry its name; from the early
  2000s, so does a share of the new wind, later of the solar parks and
  batteries.
- **What is attributed to it:** about 40% [tuning] of DK1's historical
  build-out of utility-scale wind, solar parks and batteries, including the
  free sites that build-out claims (§4.2). Rooftop solar and small co-op
  turbines stay "everyone else".
- **What the player sees:** a news line when Nordhav announces a project (at
  permit start, so the warning comes early) and when it commissions one:
  "Nordhav commissions 120 MW of solar at Tønder — midday prices will
  fall." Its projects are named in the market screen's "Coming in DK1" line
  and drawn on the map in its own colour. The annual report compares the
  player with Nordhav in renewable MW and output; overtaking it in either is
  a record (§4.13).
- **What it does not do:** react to the player, bid against the player, or
  move prices beyond what history's build-out already does. Its one personal
  act is the "Nordhav wants your site" offer (§4.10). A rival that decides
  for itself belongs to Phase 3.

### 4.12 "Called it": when a bet resolves (D14)
The moment a bet resolves is the reward, as in Game Dev Tycoon's review
reveal, and it teaches the puzzle (playtest question 3).
- **What if.** For each tracked decision, the simulation re-prices the
  asset's actual output under the alternative choice against the run's own
  hourly prices, and compares the two. The asset's own effect on the price is
  held fixed, so the card says "at this year's prices". This needs the run's
  hourly DK1 prices kept, or recomputable deterministically (about 270,000
  hours for 1995–2025). Tracked in the prototype:

  | Decision | Compared with |
  |---|---|
  | Panel orientation | The other orientation |
  | Contract or hourly market | The other |
  | A turbine built before or after 1 July 1999 | The other regime for the same turbine |
  | A switch-off floor | Never switching off |
  | Battery thresholds | The default 25th/75th percentiles |
  | Refinancing | Keeping the old loans |
  | An offer accepted or declined | The other answer, where its outcome can be priced |
- **Where it shows.** Each annual report shows at most two "called it"
  lines (the largest gains) and one "missed it" line (the largest loss,
  framed as a lesson, with a "why?"), each only above €10k or 5% of the
  asset's revenue that year [tuning]. After a payoff event (§4.13) a card
  shows the calls that paid. The medal screen shows the run's three best
  calls.
- **Project scorecards.** The build preview's expected earned price and
  payback range are stored with each asset when it is built. The asset
  screen shows them against the price earned so far: "Beating the forecast
  by 8%" or "Behind the forecast by 12% — why?", linked to the breakdown.
- **Honesty (pillar 5).** Every figure comes from the simulation's own
  revenue code, and a "what if" is always labelled as one.

### 4.13 Jackpots, records and the footprint (D14)
- **Anticipation.** Payoff events get a lead-up: from mid-2021 a news line
  tracks the climbing gas price (the fuel path already drives it); the
  December 2024 windless week is announced by a forecast warning five days
  ahead [tuning].
- **Payout cards.** After a payoff event, or any week in which the player's
  revenue is at least three times the trailing 52-week weekly average
  [tuning], a card shows what was earned and by which assets: "Your
  batteries earned €2.1m in six days."
- **Records.** Best hour, day and year of revenue; best earned price
  against the DK1 average; most profitable battery cycle; first time ahead of
  Nordhav in renewable MW or output. A broken record shows as a notice that
  does not pause; the annual report lists them.
- **Footprint.** In the header and the annual report: MW owned; the
  player's share of DK1's generation this year; homes supplied, which is the
  player's output divided by an average Danish household's yearly use
  (~4 MWh [unverified; tuning]). Notices at 1, 10 and 100 MW, and at 1,000,
  10,000 and 100,000 homes.
- **The map** draws the player's assets as icons by type (turbine, panel,
  battery) sized by MW, Nordhav's in its own colour, and the headquarters of
  the current level.

## 5. Screens (rough wireframes)
Designed at 1280×800, nothing reachable only by hovering (D8).

**Main**
```
┌──────────────────────────────────────────────┐
│ 14 Mar 2013  ❚❚ ▶ ▶▶ ▶▶▶  Cash €4.2m  Value €38m│
│ Level 3 · Developer   4.1% of DK1 · 61k homes│
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
│ Nordhav commissions 120 MW solar at Tønder   │
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

**Annual report** — ends each year in one card and is the natural place to
stop a session: earnings, best and worst asset, what changed in the market,
the year's "called it" lines (§4.12), records and the footprint (§4.13).
```
┌ 2014 · Annual report ────────────────────────┐
│ Earned €14.8m · value €38m → €44m            │
│ Best: Ringkøbing wind · worst: Herning Solar │
│ Market: +310 MW solar in DK1 (Nordhav 120)   │
│ ✓ Called it: east-west panels at Herning     │
│   earned €410k more than south-facing would  │
│   have, at this year's prices                │
│ ✗ Missed it: the switch-off floor at         │
│   Aabenraa cost €38k  [Why?]                 │
│ Records: best day €96k (14 Jul)              │
│ You vs Nordhav: 212 MW vs 1,340 MW renewable │
│ Footprint: 4.1% of DK1 · 61,000 homes        │
└──────────────────────────────────────────────┘
```

**Offer** (§4.10)
```
┌ Offer · decide by 30 Jun 2009 ───────────────┐
│ A bankrupt co-op sells 6 × 600 kW turbines   │
│ at Thy for €0.9m, 60% of their value.        │
│ Cash only: banks are lending little.         │
│ Expected payback: 5–7 years                  │
│ [Accept]   [Decline]   [Why is it cheap?]    │
└──────────────────────────────────────────────┘
```

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
| 1999–2008 wind premium | ~€25/MWh on top of the hourly price for turbines online July 1999–2002 (the real ones got a fixed settlement price of about €58/MWh [unverified]), ~€13/MWh for 2003–07; each for 22,000 full-load hours (slice 1; was ~€13 for all) | [tuning] |
| 2008–2017 wind premium | ~€33/MWh for 22,000 full-load hours | [unverified] |
| Wind turbine cost | ~€1,000/kW (1995) → ~€1,000/kW (2024: $1,041/kW) with a mid-2000s bump | [report] for 2024; rest [unverified] |
| Wind capacity factor | 22% (1995 turbines) → 35% (2020s turbines), × site rating | [tuning]; Vindeby offshore 22% [report] |
| Solar system cost | ~€10/W (1995) → €3/W (2010) → €1.8/W (2012 rooftop) → ~€0.6/W (2024 parks: $691/kW) | [report] for 2024; rest [unverified]; modules follow a 24.9% learning rate [report] |
| Solar capacity factor | ~11% south; east-west ~10% with better hours | [tuning] |
| Battery cost | $2,571/kWh (2010) → $192/kWh (2024) system cost | [report] |
| Battery | 88% round trip; wear €/MWh cycled [tuning] | [tuning] |
| O&M per year | Wind €25/kW; solar €10/kW; battery €5/kWh | [tuning] |
| Lifetimes | Wind 20–25 years; solar 30 (−0.5%/yr); battery 15 years or a cycle limit | [tuning] |
| Loan | 80% of cost, 10 or 15 years; 60% in 2008–2010; company loan up to 60% of operating assets' value, +1 point | [tuning] |
| Company levels (§4.9) | 2: 2 MW · 3: 25 MW and €10m · 4: 150 MW and €60m | [tuning] |
| Level perks | Loans 0.5 / 1 point below the era's rate (floor 0.25%); permits −15% from level 3 | [tuning] |
| Offers (§4.10) | One per 8–12 game months; one open at a time | [tuning] |
| Restructuring (§4.5) | Assets sold at 70% of value; a fee of 25% of positive net cash flow for 5 years; the second time is game over | [tuning] |
| Nordhav's share (§4.11) | ~40% of DK1's utility-scale wind, solar parks and batteries | [tuning] |
| "Called it" threshold (§4.12) | €10k or 5% of the asset's revenue that year | [tuning] |
| Household use, for "homes supplied" (§4.13) | ~4 MWh a year | [unverified; tuning] |

## 7. Goals
The chapter ends on 31 December 2025. One medal is a pass; gold is mastery.

| Medal | Condition |
|---|---|
| Bronze | Solvent, company value ≥ €25m |
| Silver | Company value ≥ €100m |
| Gold | Company value ≥ €250m **and** a 2023–2025 earned price ≥ 90% of the DK1 average (energy-weighted, contracts included) |

Thresholds are set by the bots (§9): the cautious bot should reach bronze,
single-technology bots no better than silver, and the best mixed strategy
gold in a minority of seeds. A run that was restructured (§4.5) cannot win
gold.

## 8. "No single best strategy": what the prototype implements
| Counter (vision) | In the prototype |
|---|---|
| Cannibalisation | **Yes** — the core of it |
| Geography | Partly: 16 sites with different wind, sun, grid room and permits; spreading across countries waits for more zones |
| Eras change the rules | **Yes**: tariff → market + premium → market or contract |
| Rivals | Partly: Nordhav (§4.11) is the named face of history's build-out, which claims sites, so scarcity is real; a rival that decides is Phase 3 |
| Scarcity | **Yes**: site limits, shared grid room, permit times |
| Ageing | **Yes**: degradation, availability, end of life, repowering |
| Capital | **Yes**: interest path, the 2008 credit squeeze |
| Scoring by value delivered | **Yes**: company value from earnings; the gold condition |
| Batteries as a money printer | **Yes**: wear, forecast error, spreads that shrink |
| Offers or level perks that snowball | **Yes**: bots earn levels and answer offers by the same rules as the player (§4.9, §4.10), so the nightly runs catch it |
| Foreknowledge | Partly: weather reshuffled; events on the real calendar |
| Leverage loops | Partly: loan limits and rates; takeovers deferred |
| Subsidy farming | Deferred: the policy-risk meter; the 2012 rule change is scripted |
| Deliberately staying small | Not applicable: Nordhav does not react to the player |

## 9. Playtest plan
**Testers:** Lukas plus 3–5 friends, at least two who play management games
and one or two who don't. A browser link; 60–75 minutes; the observer does
not help.

**Measured automatically** (an exportable session log, no server): time to
reach each era; decisions taken; speed and pause use; when the portfolio's
earned price first falls below 80% of the average, and how long until the
first counter-move (east-west panels, a battery, a contract, a switch-off
rule, a technology change); restructurings and bankruptcies; medal.
Added with D14: the longest stretch without a decision (a build, an offer
answered, a rule changed, a loan, a sale), time at each speed, purchases per
five minutes of play, levels reached and when, offers taken and declined,
and the "called it" and "missed it" lines shown.

**Asked afterwards:**
1. Did you want to keep playing? (yes/no)
2. When your solar or wind earned less, did you feel you could do something
   about it? (1–5)
3. Why did your solar earn less in later years? (open — checks
   understanding)
4. What was boring? (open)
5. What would you do differently next time? (open — replay intent)
6. What was the most satisfying moment? (open — added with D14)
7. Was there a stretch where you were just waiting? When? (open — added
   with D14)

**The gate passes when:** at least three of four testers want to keep
playing; question 2 averages 3.5 or more; at least three of four explain
cannibalisation correctly; at least three of four made a counter-move within
three game years of the first warning.

**Bots, nightly:** six scripted strategies — all-wind, all-solar, cautious,
greedy (maximum debt), diversified, diversified + storage + contracts — over
50 seeds each. A dominant strategy exists if one bot wins gold in most seeds
while every other stays at bronze or below. Bots earn levels like the player
and answer offers by the rule in §4.10.

**What answer changes the design:**
| Finding | Change |
|---|---|
| Felt as punishment (Q2 ≤ 2.5, few counter-moves) | Earlier warning (the pipeline shows coming build-out sooner), counter-moves earlier and cheaper, gentler cannibalisation via border-link capacity |
| Not noticed (no change in decisions) | Stronger cannibalisation, louder "why?" alerts |
| Not understood (Q3 wrong) | Rework the "why?" breakdown and the market screen before anything else |
| One bot dominates | Retune costs, wear or contract prices; re-run |
| 1995–99 boring | Shorten the regulated era or start in 1999 |
| Years fly by or drag | Retune the speeds |
| Wanted to stop (Q1 no) although cannibalisation was explained (Q3) and countered | The reward loop, not the puzzle: retune levels, offers and payouts (§4.9–§4.13) before touching cannibalisation |
| No satisfying moment named (Q6), or long stretches without a decision logged (Q7) | More offers in the empty stretch; then the review's deferred proposals: local support and a Horns Rev stake for the middle, a hands-on December 2024 week for the ending |
| Offers mostly ignored | Fewer, bigger offers with the reward stated more plainly |
| Restructured testers quit anyway | Softer terms, or a restart from the last annual report |

## 10. Decisions
**Decided in this design** (builder-level; revisit after the playtest):
- Discrete sites on a stylised map, not a tile map of resource potential.
  Same decisions, far less to build; the vertical slice can revisit it.
- Neighbours are fixed price series at two borders. (This line also said
  "no rivals with names" until D14 added Nordhav, §4.11.)
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
- **Q6 → D14.** The reward layer from the fun and progression review
  (`docs/reviews/2026-10-04-fun-and-progression.md`): "called it" reveals
  and project scorecards (§4.12), company levels (§4.9), an offer deck
  (§4.10), one named rival (§4.11), jackpots, records and footprint
  (§4.13), restructuring before game over (§4.5) and the playtest additions
  (§9). Local support, a Horns Rev stake and a hands-on finale wait for the
  first playtest. The review's P6 (an electric boiler, a warning pulled
  earlier) is not adopted now; an earlier warning stays one of §9's fixes
  if the puzzle feels like punishment.
