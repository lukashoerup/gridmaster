Model: opus — Opus builds everything (workbench `docs/roles.md`).

# Task: round 1 of the fun core, four cheap tests

## Status
**In progress (2026-10-04): (a) built and published as a preview.** Approved by D20 ("Go"). The shape is settled by D19. The design
is `docs/design/fun-core.md` v2, and the reasons are in
`docs/reviews/2026-10-04-critical-review-of-fun-core.md`. Build (a) first.

## Goal
Find out by playing, cheaply and with one variable per test, whether
"plan a fleet of power plants across a map of hungry grid hubs, and stay
ahead of the price your own success pulls down" is fun. Also test whether
the game's own claim, that fighting your own falling price is fun, holds on
its own. The pass and fail criteria are written before coding (design,
"Round 1").

## Parts (commit per part)

### (a) Toy 1, "Hubs" (`toy.html`, `src/toy/`)
- [x] A region map: 4–6 hubs, each with a demand shape (daily and
      seasonal) and limited connection room in MW. About 10 spots for wind
      and sun, fogged until scouted (a small cost and a short delay) or
      built on. Links between hubs and to the national market, with
      capacity.
- [x] Place a wind or solar plant on a spot and connect it to a hub, at a
      cost per km; it uses the hub's room. One battery type, placed at a
      hub, with a simple rule ("charge when blue, discharge when red").
- [x] Prices:
  - [x] the national price comes from the existing merit-order core
        (`src/sim`, placeholder data, used as is; D18 allows it), so it
        reacts to the build-out;
  - [x] a hub's price follows it while the hub's links have room, and
        separates when they are full (flooded falls, hungry rises);
  - [x] the player's plants enter the hub's supply.
- [x] Each hub shows:
  - [x] its **typical day** (a 24-hour curve averaged over the last
        4 weeks), with the player's output shaded on it;
  - [x] the worst hour, marked;
  - [x] a colour from its balance: red hungry, green balanced, blue
        flooded.
- [x] The clock: a year ≈ 5 minutes at ×1 [tuning], with pause, ×1, ×3 and
      ×10. A **year review** card shows what each plant earned and one
      "what if" per plant (another hub, or no battery), at the same prices.
- [x] **External pressure:**
  - [x] one escalator, "the market opens", at a random time in a window;
  - [x] a weather stream with a calm winter or a storm year drawn from
        the seed;
  - [x] "everyone else's" build-out from the core's placeholder inputs.
- [x] **Money near-unlimited** (a setting, default on, for round 1).
- [x] **A session log** (exportable, no server): decisions with
      timestamps, time at each speed, and when the first hub turns blue
      because of the player's own plants.
- [x] **The obvious bot,** headless: "connect the nearest windy spot to the
      reddest hub with room". Its score is printed, so humans can be
      compared against it.

### (b) Toy 2, "The board" (`board.html`, `src/board/`)
- [ ] One hub's typical day as the whole screen: a merit-order ladder
      against a demand curve, hour by hour.
- [ ] The player drops wind and solar blocks and sees the curve sag where
      their own output lands, with their earned price shown live. They drag
      battery energy from blue hours to red; the spread flattens as more
      storage arrives, theirs and rivals'.
- [ ] Rivals' blocks arrive over "years", a round of a few minutes each.
- [ ] A score: money earned over the rounds; the same session log.

### (c) Slice 1, tuned, for comparison
- [ ] A setting in the existing prototype, `play.html?tuned=1`: income ×3
      and three stub offer cards. **The defaults are unchanged.** This is
      the only allowed change to `src/game` and `src/play`, and it must be
      behind the flag.

### (d) The one-screen still
- [ ] A screenshot of toy 1 at about minute 20 of a bot run, to show three
      people for 30 seconds: "where is money made, and where is the
      problem?"

### Shared
- [x] Rules pure and headless (boundary tests like `tests/game-boundary.test.ts`).
- [ ] Tests green, typecheck clean, `npm run build` builds every page.
- [ ] Private previews published.
- [ ] Lukas told, in plain words, what to try, and given the pass/fail
      questions to ask testers (design, "Round 1").

## Scope
**May change:**
- `src/toy/`, `src/board/`, `toy.html`, `board.html`, `tests/`;
- `vite.config.ts` (more pages);
- in `src/game` and `src/play`, only the flagged tuned mode;
- `docs/`, `tasks/`, and `CLAUDE.md` and `README.md` (layout).

**Must NOT:**
- change `src/sim` beyond small additions named in the PR;
- add dependencies;
- build the reward layer (D14, frozen), rivals' flags, auctions, medals or
  zoom-in days;
- claim real-data accuracy (numbers are [tuning], tuned for fun).

## Docs affected
- `docs/design/fun-core.md` (what round 1 taught);
- `docs/roadmap.md` (Phase 2 status);
- `CLAUDE.md` (layout, commands).

## Size check
About two sessions: (a) is one; (b), (c) and (d) together are one. If (a)
grows, cut from the bottom of its list. The hubs, prices, the typical day
and the year review must survive.

## Working notes (agent fills in)

### 2026-10-04 — (a) toy 1 "Hubs", first playable

**Preview:** https://claude.ai/artifact/SUq3vyxGsRbAvVnFrdjoCG (private Claude
artifact: a single-file build of `toy.html`, the Vite bundle inlined into one
page by a throwaway config outside the repo, as for slice 1). The session log
is kept in the viewer's browser and is copied out from the "Session log"
card (downloads are blocked inside the preview frame).

**Layout.** `src/toy/rules/` is pure and headless (`tests/toy-boundary.test.ts`):
`tuning.ts` (every number, all [tuning]), `region.ts` (6 hubs, 10 spots,
links), `grid.ts` (the hub price rule), `national.ts` (the core's market,
weather moods, "the market opens"), `engine.ts` (the game), `log.ts` (the
session log), `bots.ts` (the obvious bot and a planner). `src/toy/page/` is
the page: plain DOM and SVG, about 50 kB of script. `src/sim` is untouched.

**Builder-level choices** (the design left these open; smallest sensible
choice each time):
- *Hub price rule.* The hubs form a tree rooted at the national grid. A
  hub's net flows over its link up to the link's capacity; what does not fit
  is stuck. A hub's price is its parent's while nothing is stuck; a flooded
  hub falls linearly to the floor as stuck surplus reaches 30% of (demand +
  link); a hungry hub rises linearly by up to €35/MWh as the shortfall
  reaches 30% of its demand. Floor €0, −€15 from 2009 once the market is
  open. All [tuning] in `PRICE`.
- *National price.* The core's `World` over DK1, DE and NO (Spain dropped,
  as in the prototype), placeholder data, unchanged. The player's plants
  enter DK1 at each 1 January, scaled by their spot's quality. Before "the
  market opens" the national price is a flat tariff of €26/MWh [tuning],
  not the core's regulated €31, because the core's placeholder market
  prices for 1998–2003 are only €16–19 and a 40% drop at the opening
  bankrupted every plan. The opening is drawn per seed, as a whole day in
  1998–2001, and hidden from the player (the log records it).
- *Weather moods* (a calm winter: wind × 0.45 in January, February and
  December; a storm year: wind × 1.25) are applied to the weather the core
  clears with, by a wrapping `WeatherSource` in the toy, so the national
  price feels them too.
- *"Everyone else" at the hubs.* Each hub has some local wind of others; it
  grows with DK1's placeholder wind path into the hub's free room each
  1 January. So others race the player for room, and coastal hubs flood
  more as the years pass.
- *Costs are charged by the year*, hour by hour, with no up-front price,
  because money is near-unlimited; the score is total profit (earnings less
  costs, scouting and take-down fees). Lines cost per km and MW. Taking a
  plant down costs half a year of its cost, so a build is a commitment.
  With `?money=limited` a build needs cash for a year of its cost (the
  setting exists; round 1 uses the default).
- *The battery's simple rule.* "Charge when blue, discharge when red":
  blue is an hour the hub is flooded, or one of the 3 cheapest hours of its
  typical day (charging only as far as its link has spare import, so it
  does not make its own hub hungry); red is one of the 2 dearest hours.
  The literal "charge when flooded, discharge when hungry" left batteries
  idle at hungry hubs, which never flood; and discharging in every hungry
  hour emptied them by mid-morning. The plan shows under the typical day.
- *"Blue because of you"* is logged when a hub's 4-week colour is blue
  while the same hub without the player's plants would not be.
- *The year review* pauses the game and shows, per plant, its earned
  price and profit and its best other hub at the same prices (with that
  hub's own line cost); per battery, its profit and what it did to the
  player's plants at that hub. Play resumes paused, to plan the next year.
- *Start* 1 January 1997, a year ≈ 5 minutes at ×1, ×3 and ×10.
- *A planner bot* is added beside the obvious bot as a reference for
  depth: each month it tries every 5 MW block and a battery per hub against
  this year's prices (which a player cannot see) and builds the best while
  it adds profit.

**Bot scores** (placeholder data, 1997–2000, `tests/toy.test.ts`):
- seed 42: obvious bot €1.35m (160 MW), planner €3.10m (145 MW);
- seed 7: obvious bot €7.87m (160 MW), planner €8.94m (135 MW).
The obvious bot fills every hub's room with wind, so it floods the coast
and earns little when the market opens; a careful plan does better, so the
rule has some depth. Seeds differ a lot (the opening date and storm years).
After 2004 the core's placeholder prices climb (2005 averages €44/MWh), and
then whoever holds the most megawatts wins; a 15–20 minute session rarely
gets that far at ×1, but a session spent at ×10 would.

**Tuning journey, in short.** First pass: all six hubs red and every plant
profitable, so the obvious bot matched the planner. Fixes, in order:
bigger backbone links (most hubs balanced at the start, Holstebro and
Herning hungry, the coast flooding only when the player overbuilds); costs
up so inland wind and green-hub wind lose after the opening; line cost per
MW instead of per plant; the battery rule above.
