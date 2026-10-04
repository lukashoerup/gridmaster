Model: opus — Opus builds everything (workbench `docs/roles.md`).

# Task: round 1 of the fun core, four cheap tests

## Status
**Waiting for Q9** (Lukas's go). The shape is settled by D19. The design
is `docs/design/fun-core.md` v2, and the reasons are in
`docs/reviews/2026-10-04-critical-review-of-fun-core.md`.

## Goal
Find out by playing, cheaply and with one variable per test, whether
"plan a fleet of power plants across a map of hungry grid hubs, and stay
ahead of the price your own success pulls down" is fun. Also test whether
the game's own claim, that fighting your own falling price is fun, holds on
its own. The pass and fail criteria are written before coding (design,
"Round 1").

## Parts (commit per part)

### (a) Toy 1, "Hubs" (`toy.html`, `src/toy/`)
- [ ] A region map: 4–6 hubs, each with a demand shape (daily and
      seasonal) and limited connection room in MW. About 10 spots for wind
      and sun, fogged until scouted (a small cost and a short delay) or
      built on. Links between hubs and to the national market, with
      capacity.
- [ ] Place a wind or solar plant on a spot and connect it to a hub, at a
      cost per km; it uses the hub's room. One battery type, placed at a
      hub, with a simple rule ("charge when blue, discharge when red").
- [ ] Prices:
  - [ ] the national price comes from the existing merit-order core
        (`src/sim`, placeholder data, used as is; D18 allows it), so it
        reacts to the build-out;
  - [ ] a hub's price follows it while the hub's links have room, and
        separates when they are full (flooded falls, hungry rises);
  - [ ] the player's plants enter the hub's supply.
- [ ] Each hub shows:
  - [ ] its **typical day** (a 24-hour curve averaged over the last
        4 weeks), with the player's output shaded on it;
  - [ ] the worst hour, marked;
  - [ ] a colour from its balance: red hungry, green balanced, blue
        flooded.
- [ ] The clock: a year ≈ 5 minutes at ×1 [tuning], with pause, ×1, ×3 and
      ×10. A **year review** card shows what each plant earned and one
      "what if" per plant (another hub, or no battery), at the same prices.
- [ ] **External pressure:**
  - [ ] one escalator, "the market opens", at a random time in a window;
  - [ ] a weather stream with a calm winter or a storm year drawn from
        the seed;
  - [ ] "everyone else's" build-out from the core's placeholder inputs.
- [ ] **Money near-unlimited** (a setting, default on, for round 1).
- [ ] **A session log** (exportable, no server): decisions with
      timestamps, time at each speed, and when the first hub turns blue
      because of the player's own plants.
- [ ] **The obvious bot,** headless: "connect the nearest windy spot to the
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
- [ ] Rules pure and headless (boundary tests like `tests/game-boundary.test.ts`).
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
