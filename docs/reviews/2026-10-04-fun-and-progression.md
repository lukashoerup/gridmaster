# Fun and progression review — 2026-10-04

**Asked by Lukas, in chat:** "Will it be fun enough with the current plan? Are
there enough satisfying progression steps? Is it rewarding enough? Please
analyse it by comparing it to other successful games and review it. Suggest
potential changes."

**Status:** a review with proposals. Nothing here is decided. Under the
contract, anything players will see or feel is Lukas's call, so every
proposal except P10 waits for him as **Q6** in `docs/decisions.md`. The
pillars (D6), the first-release scope (D9) and D10–D12 are not re-opened.

**Read for it:** `docs/original-brief.md`, `docs/vision.md`,
`docs/roadmap.md`, `docs/decisions.md`, `docs/design/one-zone-prototype.md`
("the design"), the research report's design sections, and the tycoon-design
research notes ("the notes"). Game facts taken from the notes keep their
sources there. Facts added here are linked, or marked [unverified] when they
are background knowledge.

## Verdict

The plan is strong where most indie tycoons are weak, and weak where most
successful tycoons are strong.

- **Strong: the decision space.** The market pushes back, eras change the
  best strategy, assets age, sites are scarce, every number is honest and
  has a "why?", bots hunt for dominant strategies, and the prototype's gate
  tests the riskiest idea before any content is built. That already avoids
  the three things that sank comparable games: a fake economy (Cities:
  Skylines II), one strategy forever (Turmoil, Rise of Industry) and flat
  costs (Transport Fever 2).
- **Weak: the reward side.** The plan sets out in detail how success is
  pushed back, and says very little about how success should feel. Unlocks
  arrive by the calendar rather than through anything the player did. Goals
  exist only at the end of the hour, and the first half of the prototype has
  one technology that pays. Most scripted events are bad news, the
  opposition has no face, and growth barely shows on screen.

So, to "will it be fun enough?": **the puzzle probably will be, but the hour
around it may not feel rewarding enough to make players want another.**
That is a risk to the Phase 2 gate itself. If testers say no, the design's
"what answer changes the design" table (§9) points only at the puzzle
(cannibalisation). The real cause may be a thin reward loop, and §9 cannot
yet tell the two apart. Most fixes below are cheap, touch no pillar, and
make the gate test what it is meant to test.

## The lens: what makes a management game rewarding

Successful tycoons share seven reward ingredients. This list is a synthesis
of the notes' sections 1–6 and the comparison table below. It is design
judgement, not a measured framework.

| Ingredient | Meaning | Prototype as designed | Full-game plan |
|---|---|---|---|
| Goals at three horizons | Something to aim for in the next few minutes, in this era, and in the whole game | **Weak:** medals judged only on 31 Dec 2025; nothing in between | Medium: era chapters with medals |
| Meaningful choices | Trade-offs, not just "build another" | **Strong:** where, what, how to sell, how to pay, when to switch off | Strong |
| Consequences you can see | The player learns quickly whether a choice was good | Medium: the preview and "why?" are excellent, but bets resolve silently inside annual totals, and payback takes 9–12 game years | Same |
| Growth you can see | The empire visibly gets bigger | **Weak:** 16 dots on a map, cash and company value | Medium: more zones, megaprojects |
| Drama | Surprises, crises, jackpots | Medium: nine events, five of them setbacks | Medium to strong: ~15 events, crisis scenarios |
| Mastery | Skill shows, and there is always a better way | **Strong:** gold needs a 90% earned price; bots tune the thresholds | Strong |
| Earned progression | New things arrive because of what the player did | **Weak:** every unlock is a date | Medium: delegation "as the company grows" (one sentence in the vision) |

## Where the plan is at risk

### R1 — Long on challenge, short on reward
The vision's anti-snowball table lists eight ways success is pushed back.
The rewards of growth get one sentence ("chores become delegable"). Here
is the prototype's event calendar (design §4.8), seen by an owner of wind
and solar:

- **Setbacks:** the 1999 hurricane, the 2007 carbon crash, the 2008 credit
  squeeze, negative prices, the 2012 net-metering change.
- **Mixed:** joining Nord Pool; the 2021–23 spike, followed by the windfall
  cap; the December 2024 windless week, which pays batteries and idles wind.
- **Plainly good news:** the 2005 carbon market.

That is five setbacks, three mixed events and one gift. Cannibalisation,
ageing, tariff expiry and others taking sites come on top. Each of these is
realistic and defensible. Together they risk a game whose main feeling is
being *squeezed*. Successful tycoons do not flatten the snowball: they let
it roll, then change the slope (Anno's next tier, Factorio's next
research). Growth is the fantasy. What kills a late game is not money
growing but having "nothing new to want" (notes §4: Mad Games Tycoon, the
Software Inc forum, itch.io). The plan answers the late game mostly with
rising costs and too little with new wants.

### R2 — Progression comes from the calendar, not the player
Every technology, selling regime and offer in the prototype appears on a
historical date. In Anno 1800 a tier upgrades because the player met its
needs. In Factorio a technology arrives because the player researched it.
In Game Dev Tycoon, moving from the garage to an office is a milestone the
player reaches ([Bearing News](https://bearingnews.org/256791/opinion/256791/),
attribution approximate). History as the difficulty curve is the right
pillar, but "the year changed" is not an achievement. Between the start and
the medal screen, the player earns money and nothing else.

### R3 — A thin middle
From 1995 to 2011, about the first 30 of the 60 minutes (design §2), only
wind turbines and a few rooftop panels pay. Solar parks exist from 2010 but
pay from about 2015, and batteries from about 2020. The wind decisions are
real: site, size, debt, repowering, and building before or after 1999. But
"build another turbine" is the Rise of Industry trap: "once you have built
one production lot, all you can do is build another one" (notes §5).
Minutes 15–25 (2000–08) are the most exposed: one technology, a new event
every few minutes, nothing to unlock.

### R4 — The pain arrives before the cure
The puzzle bites from 2012, around minute 30. The strong counters come
later: the data-centre contract in 2016 (around minute 38), and batteries
that pay around 2020 (around minute 43). East-west panels and switch-off
rules exist earlier, but they are weak. So the gate's "puzzle or
punishment?" question meets the player during an 8–13-minute stretch when
the main tools are still missing. §9 lists "earlier warning, counter-moves
earlier and cheaper" as the fix *after* a failed playtest. Starting there
is cheaper.

### R5 — The opposition has no face
"Everyone else" builds history's capacity and takes free sites (design §4.2;
§10, "no rivals with names"). A loss to an invisible system reads as
punishment; a loss to a named opponent reads as a contest. The precedents
agree: Turmoil's race against oil barons, Offworld's rivals, and players'
complaint that Anno 2205's NPC corporations gave "no meaningful
competition" (notes §4). The simulation already contains the build-out. It
only lacks a face.

### R6 — Feedback is slow and goals are far away
A project pays back in 9–12 game years. At normal speed that is roughly
20–30 minutes of play (design §5, §6). The annual report is the main
feedback, and the medals are judged once, at the very end. Two Point
Hospital, by contrast, always has a goal on screen: star objectives, plus
optional challenges from staff that pay out reputation and Kudosh
([Wikipedia](https://en.wikipedia.org/wiki/Two_Point_Hospital);
[TheGamer](https://www.thegamer.com/two-point-hospital-making-kudosh-guide/)).
The prototype has no short-term goal at all.

### R7 — Growth is hard to see
The diagram style is deliberate, and right: Mini Metro shows that diagrams
can delight. But the screens show cash, company value and a map of 16 sites.
Nothing shows the player's footprint growing: their share of Western
Denmark's power, the homes they supply, the records they break. Tycoon
players stay to watch their creation get big.

### R8 — Smaller risks
- **Bankruptcy ends the hour** (design §4.5). A tester who goes bust in the
  2008 squeeze around minute 22 never reaches the gate question. The 2012
  checkpoint helps only if they choose to restart from it.
- **A fixed calendar is solved after one play.** That is fine for the
  prototype. But the first release's "randomised variants" (D9) must change
  decisions, not just dates, or replay becomes Turmoil's "same strategy every
  level".
- **The operating loop is mostly automatic,** with rules for batteries and
  switch-off. That is right for chores, but it leaves the player no
  hands-on moment in the whole hour. The vision's "zoom-in" weeks are not
  in the prototype.

## How it compares

| Game | What makes it rewarding | Gridmaster today | What to take |
|---|---|---|---|
| Anno 1800 | A tier upgrades once the player meets its needs; the city visibly grows; each tier brings new goods and new problems (notes §1) | Eras change the problem (good), but by date; no tiers in the prototype | Company tiers the player earns (P2) |
| Factorio | Something new unlocks every few minutes; the factory sprawls; problems grow with size (notes §1) | Five technologies; the first half is mostly wind | Fill the middle (P5) |
| Game Dev Tycoon | Each game is a bet with a dramatic review reveal; garage → office → studio | Bets resolve silently inside annual totals | "Called it" reveals (P1); a headquarters that moves (P2) |
| Two Point Hospital | Stars and optional challenges are always on screen, each with a reward | One goal, at the end | An offer deck (P3) |
| Railroad Tycoon II | Historical scenarios with medal deadlines (notes §2) | Medals: same idea | Keep; add goals in between |
| Offworld Trading Company | The market is the opponent, and the opponents have faces (notes §1) | The market is the opponent (good), but faceless | One named rival (P4) |
| Turmoil | A tight yearly loop that hooks players, but the strategy never changes (notes §5) | Eras change the strategy (good); a fixed calendar on replay | Event variants that matter; origins (L4) |
| Big Ambitions | From doing it yourself to running a company; 91% positive (notes §3) | Delegation is in the vision, not the prototype | Delegation as something the player buys (L2) |
| Transport Tycoon | New models arrive with teething problems, so "adopt now or wait?" is a bet (notes §2) | Generations arrive, with no reliability bet | Turbine-model bets (P5) |
| Transport Fever 2, Mad Games Tycoon | Cautionary: rich players have nothing new to want (notes §4) | Answered with rising costs | Answer with new wants too (L1, L3) |

## Proposed changes

Ranked by value for cost. "P" = for the Phase 2 prototype, where it protects
the gate. "L" = later: the vertical slice or the first release. All
amounts in examples are illustrative.

### For the prototype

**P1 — "Called it": show the player when their bets pay off.** *Low cost.*
After each annual report and each big event, the game computes one or two
"what ifs" for the player's own decisions and shows them, for example:
"Your 2014 east-west park earned €410k more than a south-facing one would
have." Or: "Signing the contract in 2016 earned €1.2m more than selling
every hour." The deterministic core re-runs the asset against the same
prices, so this is a number the simulation computes (pillar 5), labelled as
a "what if". Add a live scorecard per project: the price forecast at build
time against the price earned so far ("beating the forecast by 8%"). The
precedent is Game Dev Tycoon's review reveal: the moment a bet resolves is
the reward. It also teaches the puzzle, which serves playtest question 3
directly.

**P2 — Company tiers the player earns.** *Low to medium cost.*
Farm → co-op partner → developer → utility. Each tier is reached by a
milestone [tuning], such as the first 2 MW, the first €5m of company value,
or the first 50 MW. Each tier changes something visible: the kitchen table
in the farmhouse, then an office in Herning, then a headquarters in Aarhus.
Each perk *adds* rather than restricts: better loan terms, access to bigger
sites and offers (the data-centre contract goes to developers), or a
"trading desk" that tunes battery thresholds for you. The calendar still
decides what exists; tiers decide what the player has earned. The
precedents are Anno's tiers and Game Dev Tycoon's office moves.

**P3 — An offer deck: a short-term goal every few minutes.** *Medium cost;
mostly data.* The design already auto-pauses for "an offer arriving", but it
has only one offer, the data centre. Extend it to a deck of historically
plausible offers and requests. One arrives every 3–5 minutes, and each is
optional, timed and rewarded:
- A landowner offers a west-coast site for six months.
- A municipality wants community wind by 2002. Reward: faster permits.
- The bank offers to refinance old loans as rates fall from about 8% to
  0.5% (design §6). Refinancing is a natural and real reward lever.
- In 2008–09 a bankrupt co-op sells its turbines at a discount. This is the
  vision's "catch-up as opportunity", made concrete.
- A neighbouring co-op wants a partner to repower its turbines.

This is Two Point's challenge system with a Danish skin, and it adds good
news to the calendar (R1).

**P4 — Give "everyone else" a face.** *Low cost; changes a choice in design
§10.* Credit part of the historical build-out to one named rival, using an
invented name as the report advises. A news line appears whenever they
build: "Nordhav commissions 120 MW of solar at Tønder — midday prices will
fall." Nothing in the simulation changes. Cannibalisation now has a cause
the player can resent, race and outplay. The full rival system stays in
Phase 3.

**P5 — Fill 2000–2011 with decisions, not just more turbines.** *Medium
cost.* Three candidates, each grounded in DK1 history:
- *Local shares and local support.* Co-ops owned about half of Danish wind
  in the 1980s and early 1990s (report). From 2009 the Renewable Energy
  Act required developers to offer at least 20% of each new onshore project
  to local residents
  ([IEA](https://www.iea.org/policies/17800-denmark-community-ownership-of-renewables)).
  Each area gets a "local support" level. Offering shares raises it, at the
  cost of some profit; building fast and big lowers it. It speeds up or
  slows down permits. This second currency turns every turbine into a
  two-sided decision. It is the vision's "reputation that eases planning
  approval", brought forward into the prototype.
- *A stake in Horns Rev.* The world's first large offshore wind farm, 160 MW,
  came online in 2002 off the DK1 coast, operated from Esbjerg
  ([Wikipedia](https://en.wikipedia.org/wiki/Horns_Rev_Offshore_Wind_Farm)).
  Offshore wind is out of the prototype, but a minority stake in the
  consortium is a financial asset, not a new technology. It gives a
  big-ticket, mid-game "wonder" to save up for. This changes the
  prototype's scope.
- *Turbine-model bets.* Each new generation launches with a reliability
  penalty that eases over a few years [tuning]. "Buy the new 3 MW turbine
  now, or the proven 2 MW?" becomes a real bet, as in Transport Tycoon.

**P6 — Bring the cure closer to the pain, within history.** *Low to medium
cost.* Pillar 1 says each mechanic arrives when history introduced it, so
the dates do not move. Two ways keep to that:
- *Warn earlier.* The "Coming in DK1" pipeline (design §5) shows the 2012
  rooftop wave from 2010–11. A prepared player can then get ahead of it:
  build east-west, keep cash for batteries, sell before the sag. Seeing
  the hit coming turns it into a test the player can pass.
- *An asset that profits from the problem.* An electric boiler for a local
  district-heating plant buys power when it is cheap or negative. Danish
  district heating does exactly this, with growth documented since 2019
  ([DOI](https://www.doi.dk/en/vindkraft/artikel/fjernvarmen-sluger-el-som-aldrig-foer)).
  Whether boilers were common by 2012 is [unverified]; check it in the
  verification pass before choosing a date. This lets the player profit
  *from* everyone else's overbuilding, the satisfying side of the puzzle.
  It adds a technology to the prototype.

**P7 — Celebrate jackpots, and make growth visible.** *Low cost.*
- Build anticipation before payoff events: gas prices climbing through
  2021, a forecast warning a few days before the December 2024 lull. Then
  show a payout card: "Your batteries earned €2.1m in six days."
- Keep records: best day, best year, best single hour.
- Add footprint counters, computed by the simulation: the player's share
  of DK1 generation, and the homes they supply (generation divided by an
  average household's use).
- Fill the map with the player's assets as icons by type, not just dots.

**P8 — A hands-on finale.** *Medium cost.* Play the December 2024 windless
week as the vision's "zoom-in" set piece. The game runs at hourly
resolution, and the player dispatches batteries and switches assets by
hand for six days. It is a change of pace after an hour of rules, and a
finale that the whole hour of preparation pays into.

**P9 — Restructuring instead of game over.** *Low cost.* When cash stays
below zero for 90 days, the bank restructures the company instead of
ending the game. The worst assets are sold at a discount, the bank takes a
share of profits for some years, and gold is no longer possible. The
player stays in the hour, and the stakes stay real.

**P10 — Measure reward in the playtest.** *Low cost; builder-level, so it
goes in with the Phase 2 build either way; amends design §9.*
- Add two questions: "What was the most satisfying moment?" and "Was there
  a stretch where you were just waiting?"
- Add three measures to the session log: the longest stretch without a
  decision, the time spent at top speed, and purchases per five minutes.
- Add a row to "what answer changes the design": *the tester wanted to
  stop but understood and handled cannibalisation* → the reward loop is the
  problem, not the puzzle (P1–P8).

Without these, the gate cannot tell the two failures apart.

### Later: vertical slice and first release

**L1 — Megaprojects to aim for, visible from day one.** An offshore farm,
a share in a nuclear plant, a power-to-X plant, an energy island. They are
shown early, greyed out, with what they need ("€2bn, utility tier, local
support 80"). This gives a rich player something to want, which is what
Transport Fever 2's late game lacked. The model is Anno's prestige
buildings and Civilization's wonders [unverified as named precedents].

**L2 — Delegation as a progression the player buys.** The vision's
"chores become delegable", turned into departments the player buys:
maintenance crews, a trading desk, an auto-bidder, a development team,
portfolio policies. Each is a purchase with a visible effect: Big
Ambitions' arc from running errands to running an empire.

**L3 — Adopting early as a bet.** The calendar decides when a technology
exists. The player can adopt it earlier as a pilot project, at a premium
and with teething risk, in return for reputation or a grant. That turns
"waiting for 2015" into a first-mover decision.

**L4 — Origins and starting points for replay.** The player starts as a
farmer, a co-op, a former utility engineer or a small fund, each with a
perk and a flaw. They can also start in another zone or year, such as Spain
in 2005. With event variants that change decisions (already in D9's
scope), this drives replay for the Planner audience. Those players write
their Steam reviews after 50+ hours (notes §6).

## What not to change
- **Keep the market pushing back.** None of the above makes money easy.
  The proposals add things to want and moments that feel good. The nightly
  bots (design §9) still catch any proposal that creates a dominant
  strategy.
- **Keep every number honest.** "What ifs" and footprint counters must be
  computed by the simulation and labelled as such. No number may be faked
  for fun (pillar 5).
- **No idle or clicker mechanics** (vision, "What it is not"). Rewards come
  from decisions, not from tapping.
- **Keep the prototype small.** If Lukas wants only a few of these, take P1,
  P3, P7 and P10 first. They are cheap, only the offer deck is a new
  system, and they make the gate measure the right thing.

## Open question for Lukas
Recorded as **Q6** in `docs/decisions.md`: which proposals go into the
prototype design before Phase 2 is built.

**Recommendation:**
- **Now:** P1, P3, P7, P9 and P10.
- **If he likes them:** P2, P4 and P6.
- **After the first playtest,** only if testers report a dull middle or a
  flat ending: P5 and P8.

## Sources added in this review
- Two Point Hospital's challenges and Kudosh: [Wikipedia](https://en.wikipedia.org/wiki/Two_Point_Hospital); [TheGamer](https://www.thegamer.com/two-point-hospital-making-kudosh-guide/)
- Game Dev Tycoon's garage-to-office progression: [Bearing News](https://bearingnews.org/256791/opinion/256791/) (search snippet; attribution approximate)
- Denmark's 20% local-ownership offer, from 2009: [IEA](https://www.iea.org/policies/17800-denmark-community-ownership-of-renewables)
- Horns Rev 1: 160 MW, 2002, operated from Esbjerg: [Wikipedia](https://en.wikipedia.org/wiki/Horns_Rev_Offshore_Wind_Farm); [Vattenfall](https://powerplants.vattenfall.com/en/horns-rev)
- Electric boilers and heat pumps in Danish district heating: [DOI](https://www.doi.dk/en/vindkraft/artikel/fjernvarmen-sluger-el-som-aldrig-foer)

Everything else cites the research report and its notes.
