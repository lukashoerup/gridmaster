# Running the company: operations, funding and offshore (Phase 2, proposed)

**Status: an idea bank, not the plan (D17, 2026-10-04).** It was proposed
after Lukas's first playtest of slice 1
(`docs/reviews/2026-10-04-playtest-1.md`) as Q8. Lukas then set realism and
management depth aside in favour of finding a fun core first
(`docs/design/fun-core.md`, Q9). Its ideas (ledger, maintenance, funding
tools, charters, offshore stages) are candidates for layers *on top of* a
proven core. Numbers are [tuning] unless marked otherwise; the bots (§12) and
playtests set them.

## The one-minute version
- **The problem.** The game has one verb, "build", and a savings timer gates
  it, so the player fast-forwards. Assets have no dials once built, and the
  player cannot see what an asset really earns after its loan.
- **The answer.** Every asset gets dials, every dial is a bet, and the
  ledger shows whether the bet paid:
  - maintenance plans and faults, repairs, upgrades (among them automatic
    shutdown at low prices) and insurance (§2);
  - economies of scale (§3);
  - sites with a character worth discovering (§4);
  - real ways to fund a project besides waiting (§5);
  - a rhythm instead of a fast-forward button (§6);
  - a company charter that sets a playstyle (§7);
  - offshore wind (§8).
- **Realism is dialled back** only where it creates no decisions (§9). The
  market, the weather and cannibalisation stay as they are.

## The principle: every minute a decision, every asset a dial
| Loop | Slice 1 | With this design |
|---|---|---|
| Operating (seconds to minutes) | Nothing. Rules were to come in slices 2–3. | Faults and repair choices, warnings, the quarterly review (§2.2, §6) |
| Asset (minutes) | Nothing | Maintenance plan and service month, upgrades, insurance, selling, all shown in the ledger (§1, §2) |
| Project (several minutes) | Build and loan | Measure the site first, choose the funding, build to keep or to sell, offshore (§4, §5, §8) |
| Company (the run) | Levels were to come (D14) | Charter, service bases, departments, levels (§3, §7) |

**Guard against chores (the Victoria 3 lesson).** Every dial has a company
default that new assets inherit, "apply to all" in an area, and rules for
faults. A player who never touches a dial plays a sound game. A player who
tunes them earns a visible edge: the target is 10–25% more company value
(§12).

## 1. The asset ledger: know what each asset earns
Each asset gets a page. Its numbers come from the engine's own bookkeeping,
because a number the simulation does not use is never shown (pillar 5).

| Block | Contents (this year · lifetime) |
|---|---|
| Output | MWh; capacity factor; **availability** (hours running ÷ hours possible); **capture rate** (earned price ÷ DK1 average) |
| Revenue | Energy sales; tariff or premium top-up; contract |
| Costs | O&M; land; insurance; service and repairs; **interest on its loan** |
| Result | Operating profit; − loan principal = **net cash to you**; minus the co-op's or partner's share (§5) |
| Your money | Equity put in; cash returned so far; **paid back: 64%**, as a bar; **cash return on equity** this year |
| Charts | Monthly net cash (bars) with the running total (line); two **12 × 24 heatmaps**, month × hour, of output and of earned price; a timeline of faults and services |
| Forecast | The build preview's expected price and payback, stored at build time, against the result so far (D14's scorecard, §4.12 of the prototype design) |

- **The assets table** gains these columns: area, age, availability,
  capture, net to you this year, return on equity, paid back, maintenance
  plan and insurance. It sorts by any column and marks the best and worst
  asset.
- **Per-area summary rows** show the same totals for each area, which is
  where the patterns of §4 show up.
- **"Called it"** (D14) gains the new tracked decisions. Each is compared
  with the company default, at the same prices and weather:
  - the maintenance plan and service month;
  - each upgrade;
  - insurance;
  - measuring a site or building blind;
  - funding.

## 2. Operations: every asset has dials

### 2.1 Maintenance plan, per asset (default set company-wide)
| Plan | O&M | Faults | Planned downtime | Needs |
|---|---|---|---|---|
| Run to failure | €17/kW·yr | Major ×2.0, minor ×1.5 | None | — |
| Annual service, in a month the player picks | €25/kW·yr (today's single O&M figure) | ×1.0 | 2 days in that month | — |
| Condition monitoring | €28/kW·yr | ×0.6. Most major faults arrive first as a **warning** (§2.2) | 2 days in that month | The sensors upgrade (§2.3) |

**The service month is the first pattern to exploit.** Two days of downtime
in a calm, cheap month cost little; in a stormy January they cost a lot.
The heatmaps (§1) show each area's calm months (§4).

### 2.2 Faults and repairs
- **Minor faults** (about 2 a turbine-year) are handled automatically:
  1–3 days down and a small cost, visible in the ledger. They never raise a
  card.
- **Major faults** (gearbox, generator, blade) happen about 0.08 a
  turbine-year. The rate is multiplied by:
  - age: ×1.5 in the first two years (teething), ×1.0 to year 15, then +6%
    a year;
  - the area (§4);
  - the maintenance plan;
  - upgrades.
  The gearbox being the most failure-prone part is real (review, sources).
- **A major fault raises a card:**
  - **Fast:** a crane now, the repair at 150% of cost, back in 2 weeks;
  - **Standard:** the next crane slot, back in 8 weeks, or 4 with a service
    base (§3);
  - **Retire** the asset.

  A repair costs 10% of the turbine's cost (gearbox replacements:
  [unverified]). A **company rule** ("always standard", "fast if the asset
  earns more than €X a week", "ask me") answers cards without a click.
- **Warnings** come only with condition monitoring. "Gearbox bearing wearing
  at Thy 2: plan a repair now for 40% of the cost and 3 weeks down, or run
  on and risk a major fault." This mirrors the real case of 3 weeks instead
  of 10 (review). Ignored for two months, a warning becomes a major fault.
- **The odds are always shown.** For example: "about 1 in 9 a year on this
  turbine". Faults use the run's seeded random stream, so a save replays
  exactly.

### 2.3 Upgrades, per asset (bought once, from the year shown)
| Upgrade | From | Cost | Effect | The catch |
|---|---|---|---|---|
| **Remote control and price shutdown** | 1999 | €5k a turbine | Unlocks "switch off below €X/MWh" (prototype §4.7) and remote resets (minor faults −1 day) | None. It is the entry upgrade, worth most once prices go negative (from about 2009) |
| Aero kit (vortex generators) | 2005 | €12k/MW | +2% output; +3% on turbines aged 10 or more | Real gains are 1–3% (review) |
| Power boost (software uprate) | 2010 | €3k/MW | +4% output | Major faults ×1.3: a risk-lover's upgrade |
| Condition-monitoring sensors | 2003 [unverified] | €8k a turbine | Enables the condition-monitoring plan | — |
| Lifetime extension | Last 2 years of life | 15% of today's new cost | +8 years | Fault rate as at age 18 throughout; or repower instead |

### 2.4 Insurance (company default, per-asset override)
| Cover | Premium a year | Pays |
|---|---|---|
| None | — | — |
| Standard | 1.2% of the asset's cost | Repair costs above a €20k/MW excess |
| Full | 1.8% | Repairs above the excess, plus revenue lost while a major fault is fixed |

Premiums are set so that insurance loses money on average, as real insurance
does. The risk-averse player pays for smooth cash flow; the risk-lover keeps
the premium and the risk.

## 3. Economies of scale
- **Service base, per area.**
  - *Requires* 5 turbines or 10 MW of the player's own in the area.
  - *Costs* €200k once and €40k a year.
  - *Gives, in that area:* O&M −20%, standard repair waits halved, and
    planned service 1 day instead of 2.
  - *The trade-off is real:* clustering is cheaper to run, while spreading
    across areas smooths output and local risks (§4).
  - Offshore gets a port base in Esbjerg (§8).
- **Bulk orders** (the offer card, prototype §4.10) and **shared grid
  connections** (prototype §4.2) already exist.
- **Departments**: company-wide, bought with D14's levels. This brings the
  review's L2 forward:
  - *Maintenance department* (from level 2): €100k a year; repairs −15%,
    standard waits −25%.
  - *Development team* (from level 3): €150k a year; permits −20%,
    measurement campaigns at half price.
  - *Trading desk* (level 4, D14): tunes shutdown floors and, later, battery
    thresholds.

## 4. Site character: patterns to find and exploit
Within DK1 every site gets the same hourly price. Sites therefore differ in
*when* they produce and *how often they are down*, which shows as capture
rate and availability in the ledger.

| Area | Wind shape | Storms (major faults) | Other | Calm month |
|---|---|---|---|---|
| West coast | Strongest; winter-heavy (seasonal swing ±35%) | ×1.3 | Salt air: O&M +€2/kW; the windiest 3% of hours curtailed for local grid congestion from 2005 until a 2012 grid upgrade | July |
| North | Steady (±20%) | ×1.1 | Good grid | June |
| Central heath | Average; more wind in the afternoon (+10%, 12–17 h) | ×1.0 | Cheap land, fast permits; grid limited until 2010 (exists) | August |
| East | Weaker, but more in the evening (+15%, 16–21 h), when prices are higher | ×0.9 | Expensive land | July |
| South | Moderate wind; the best sun (×1.05) | ×1.0 | Near the German link | June |

All of this is [tuning]. It is inspired by real geography but is a game
abstraction, labelled as such; the Global Wind Atlas layer can replace the
ratings later.

- **Implementation.** A site's hourly output is the zone's hourly wind
  capacity factor × the area's seasonal weight (by month) × its daily weight
  (by hour) × the site rating. The weights are normalised so the annual mean
  is unchanged.
  - The market still receives the player's MW on the zone's own profile
    (`World.addCapacity`). The shapes therefore change the player's revenue,
    not prices.
  - At prototype scale the player is a few percent of DK1, so the mismatch
    is acceptable. Note it for Phase 3.
- **Measure before you build.**
  - An unmeasured site shows its rating as a range (true rating ±0.15). The
    true value is drawn from the seed within the range around today's
    design value.
  - A **measurement campaign** costs €40k and takes 12 months. A real
    bankable campaign needs one full year (review). It narrows the range to
    ±0.02.
  - Owning an asset in an area reveals its shapes; owning one on a site
    reveals its rating.
  - The bet: build blind and fast, or measure and risk history claiming the
    site (prototype §4.2) in the meantime. The build preview's normal-year
    and bad-year yields widen when the site is unmeasured.

## 5. Funding: more ways to pay than waiting
| Tool | From | How it works | The trade-off | Real anchor |
|---|---|---|---|---|
| Bank loan (exists) | 1995 | Up to 80% of cost | Interest | — |
| Company loan (exists) | 1995 | Debt up to 60% of operating assets' value | +1 point | — |
| **Co-op shares** | 1995, onshore wind | Local members pay up to 50% of the equity. They receive that share of the asset's net cash after its loan, for its whole life | Less upside; the project's permits −25% (local support) | Danish co-ops; the 2009 20% rule (review) |
| **Project finance** | 1995 | Loan up to 90% (75% in the 2008–10 squeeze) when the revenue is fixed: tariff, contract or tender price | Only with fixed revenue, so safety buys leverage | Standard practice [unverified] |
| **Partner** | Level 3 | A fund takes 30–50% of a project of 10 MW or more, paying its share of every cost for its share of every cash flow. You get a development fee of 3% of cost | Halves the upside; makes big projects possible | — |
| **Build to sell** | 2000 | At commissioning an investor buys the project at the present value of its expected net cash flow at **5%**. You value it at 7% (prototype §4.5), so a good project sells above cost and a poor one below. The loan is repaid from the price | Cash now and no income later; the site counts as "everyone else's" | European Energy's develop-build-sell model (review) |

**Effect.** The first turbines need far less waiting, big projects become
reachable, and capital becomes a set of choices that define a playstyle. The
honest price formula in "build to sell" rewards good projects: a measured
site, good timing, low cost. It cannot be farmed with bad ones.

## 6. Pacing: a rhythm instead of a fast-forward button
- **The clock.** A year at ×1 lasts **4 minutes** (was 2.4); ×3 and ×10 stay.
  With decisions every minute, slower is better (Lukas: "time passes too
  quickly"). The full chapter grows to roughly 1½–2 hours, so testers start
  from checkpoints: 1999, 2008 and 2012.
- **Smart speed.** A card pauses the game, as now. An alert, such as a
  fault ruled automatically or a record, drops the speed to ×1 (a setting).
- **The quarterly review.** Every 3 game months an inbox card lists:
  - faults and repairs pending, and services due next quarter;
  - tariffs, premiums or loans ending within a year;
  - upgrades newly available, with their payback on this asset;
  - the best and worst asset this quarter;
  - one suggestion.

  A setting chooses "every quarter", "only when something needs me" or
  "never". It is the hub that makes "nothing to do" impossible to miss.
- **"Save for…".** An unaffordable build offers "save for this": an
  estimated date from today's net cash, "run until affordable" (auto-pause),
  and the funding tools of §5 that would make it affordable *now*.

## 7. Playstyles: a company charter
The player picks one charter at the start. This brings the review's L4
(origins) forward.

| Charter | Perk | Flaw | Suits |
|---|---|---|---|
| **Wind co-op** | Co-op shares up to 70% of equity; permits −25% on onshore projects | Bank loans at most 70%; no build to sell | The careful builder |
| **Developer** | Buyers in "build to sell" discount at 4.5% (a better price); measurement campaigns at half price | O&M +10% until it has a service base | The fast grower who recycles capital |
| **Trader** | The trading desk from the start; power boost from 2005 | Insurance ×1.5; no co-op shares (locals distrust it) | The risk-lover |

Every dial previews a normal year and a bad year, as the build preview
already does. A risk-averse player can therefore see what they are buying.

## 8. Offshore wind
Offshore follows DK1's real offshore history, as a stake first and then as
tenders. It fills the thin middle with the big projects Lukas wants to
afford.

| When | Project | The player's role |
|---|---|---|
| 2000–01 (an offer card) | **Horns Rev 1**, 160 MW off Esbjerg, online 2002 (review) | Buy 5–25% of the consortium led by Nordhav (D14): a share of every cost and every MWh. It sells at a fixed price for a set number of full-load hours [unverified; tuning: €60/MWh for 42,000 hours]. The first "wonder" to save for |
| Tender closes 7 April 2010 | **Anholt**, 400 MW, about DKK 10bn of investment (review). Historically it drew one bid, from DONG | Bid against Nordhav: a sealed price per MWh for a set number of full-load hours [terms unverified]. The lowest bid wins. Needs level 3 and a partner (§5). Built 2011–13 |
| About 2015 | **Horns Rev 3**, about 400 MW [unverified] | A second tender |

- **The offshore asset:**
  - capacity factor about 45% [tuning];
  - capital cost about €3.4m/MW in 2010 (DKK 10bn for 400 MW [calc]);
  - major faults ×0.8, but repairs cost ×3 and take ×2 as long;
  - repairs wait for a calm-sea window, twice as long in winter. This is a
    weather pattern to exploit: offshore service is a summer job.
- **Nordhav's bid** is drawn from a range around its cost estimate. A
  winner's curse is real: bid too low and the farm loses money for 20 years.
  This is the D15 rival race in miniature, for the first release's rivals to
  build on.
- **Scope.** This removes "offshore wind" from the prototype's "Not in it"
  list. D9 already has fixed offshore in the first release; D14 had deferred
  the Horns Rev stake to after the first playtest.

## 9. Realism, dialled back where it creates no decisions
- **Dial back:**
  - the prototype defaults to the vision's **Casual** preset: permits ×0.6,
    and faults ×0.5 (OpenTTD's lesson: let players turn breakdowns down or
    off);
  - support rules shown simply ("€25/MWh on top, for about 10 years");
  - starting cash stays, but co-op shares make the first turbines
    affordable. The bots set the rest.
- **Keep, because it is the game:** the hourly market and cannibalisation,
  real weather, costs and rates by era.
- **Add realism that is fun:** co-ops, partners, measurement masts,
  maintenance and offshore tenders. Each is real, and each is a decision.

## 10. What changes in the prototype design and its slices
Proposed slice order. Slices 2–5 in the current task become 5–8, and the
gate is unchanged.

| Slice | Content |
|---|---|
| 2. Know and run your assets | The ledger (§1); maintenance plans, faults, repairs and rules, warnings (§2.1–2.2); upgrades, including price shutdown (§2.3); insurance (§2.4); company defaults; the quarterly review, smart speed, "save for…" and the slower clock (§6); "called it" and scorecards (D14), whose home is the ledger |
| 3. Fund and grow | Co-op shares, project finance, partners, build to sell (§5); site character and measurement (§4); service bases and departments (§3); charters (§7); the offer deck (D14), which delivers the fire sale and the stake |
| 4. Offshore | The Horns Rev 1 stake; the Anholt and Horns Rev 3 tenders against Nordhav (§8) |
| 5. Solar parks and the puzzle | Old slice 2 |
| 6. Answers to cannibalisation | Old slice 3: batteries, the contract, the hedge |
| 7. The rest of the reward layer | Levels, Nordhav's news, jackpots, records, the footprint (D14) |
| 8. Playtest kit | Old slice 5, with the new bots and targets of §12 |

## 11. Risks, and the answer to each
- **Chores.** Defaults, apply-to-all, fault rules and the quarterly review's
  "only when something needs me" all help. A bot on defaults must stay
  competitive (§12).
- **Randomness feels unfair.** The odds are shown; insurance, condition
  monitoring and service bases reduce risk; Casual halves faults; a setting
  switches them off.
- **A dominant dial.** If, say, power boost is always right, the bots catch
  it.
- **Scope.** Three slices are added. They replace the waiting, which is the
  core problem; solar and storage still follow.

## 12. Bots and targets
New bots:
- **Defaults:** never touches a dial.
- **Attentive operator:** services in each area's calm month, buys upgrades
  with a positive net present value, measures before building, insures only
  on the west coast.
- **Flipper:** builds to sell.
- **Co-op:** maximum co-op shares.

Targets, measured with the session log of prototype §9:
- On average a meaningful decision is available at least once a minute at
  ×1, and no stretch without one lasts more than 3 minutes.
- The cautious bot builds in every era.
- The defaults bot reaches bronze in most seeds; the attentive operator
  beats it by 10–25% of company value.
- No maintenance plan is best on every site, no charter wins most seeds, and
  the flipper does not dominate.
