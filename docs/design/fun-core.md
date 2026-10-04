# The fun core (v2, proposed)

**Status:** v2, 2026-10-04, after Lukas's answers (D19) and the critical
review (`docs/reviews/2026-10-04-critical-review-of-fun-core.md`). Waiting
for Lukas's go to build round 1 (Q9). It follows D17 (fun first) and D18
(realism work paused).

v1 ("a power network: draw lines to hungry towns") is in git history. The
review found four flaws in it:
- its hourly money rule was invisible at the planned clock;
- it was a grid owner's fantasy, not a power company's;
- a fixed-price backbone was a dominant strategy;
- it stopped testing the game's own claim.

v2 fixes them with Lukas's answers.

## What Lukas decided (D19)
| Question | His answer | What it means here |
|---|---|---|
| Whose shoes? | "plants" | You own power plants and sell into a market. You pay to connect them to grid hubs that someone else owns, as in Denmark. No lines to towns |
| How long? | "a 3-4 hour campaign in chapters. But players should be able and want to replay, and or play slower to optimize gameplay and play better … Longer campaigns as in other games" | Chapters of about 50 minutes. Built for replay. Free pause and a slow speed for players who want to optimise |
| Act on what? | "longer plans" | The player decides on structure (what, where, which hub, storage, contracts), not on today's weather. The hourly market runs underneath, and the player reads days, weeks and seasons |
| "A train game with turbines"? | "a warning if its all they say" | What a player should mention is the market: their own plants pulling their own price down, and staying ahead of it |
| History? | "suprises I think. Maybe scenery" | Events come as surprises, with randomised timing and size, drawn from a deck shaped by real history; eras and places are scenery. No calendar to study |
| How rough? | "It can be rough" | The toys are judged on play, not looks |

## In one sentence
**Plan a fleet of power plants across a map of hungry grid hubs, and stay
ahead of the price your own success pulls down.**

The sentence a player should say to a friend: *"You build where the grid is
hungry, and the game is staying one step ahead while your own plants, your
rivals and some nasty surprises flood or starve it."*

## The ten principles
§1 of v1 drew eight principles from Transport Tycoon, Sid Meier's
Railroads!, Factorio, RTS games and Mini Metro:
1. a toy on a map;
2. it visibly works;
3. your own growth makes the problems;
4. one money rule with levers;
5. something new often;
6. rivals racing;
7. stakes and a shape;
8. low friction.

The review adds two, and both fit "longer plans":
9. **the bottleneck is attention, not cash;**
10. **uncertainty with a visible reveal.**

## The core

### The map: plants, hubs, connections
- **Hubs** are grid substations, a handful in a region. Each has a demand
  behind it (towns and industry with daily and seasonal shapes) and
  **limited connection room** in MW. Grid upgrades that add room arrive as
  surprises.
- **Spots** for wind and sun are fogged until scouted or built on.
- **Connecting a plant.** You place a plant on a spot and connect it to a
  hub. The connection costs per km and uses the hub's room. That is the
  real producer's job: the grid operator owns the grid, and producers pay to
  connect.
- **Links.** Hubs link to each other and to the national market through
  links with a capacity.

### The money rule
> **Your power earns your hub's price at the hour you make it, and the more
> power at your hub that hour, the lower that price.**

- **The price.** A hub's price is the national market price (cleared by
  the existing merit-order core, so it reacts to everyone's building) while
  its links have room. When the links are full, the hub's price separates
  from it: flooded hubs fall, hungry hubs rise.
- **What the player reads**, so the rule is readable without watching
  hours:
  - each hub's **typical day**: a 24-hour curve averaged over recent weeks,
    with the player's own output shaded on it;
  - the **worst hour** marked;
  - a colour from its balance: red is hungry, green balanced, blue
    flooded.
- **This is cannibalisation made visible.** Put too much wind on the Lemvig
  hub and Lemvig turns blue on windy nights; your earned price there sags,
  and you see why. The answers are the levers:
  - another hub;
  - another kind of plant (sun when the wind fails);
  - storage at the hub, to move energy from blue hours to red;
  - a contract that fixes the price.

### The clock: plans, not weather
- **The pace.** A year lasts about 5 minutes at ×1 [tuning]. Play is
  continuous, with pause, ×1, ×3 and ×10. The hourly simulation runs
  underneath; the player reads weeks and seasons, not hours.
- **Decisions are plans:**
  - what to build and where;
  - which hub to connect to;
  - how big a store, and its simple rule;
  - whether to take a contract;
  - when to sell or repower.
- **Rhythm.** Each year closes with a **review that reveals your bets**:
  what each plant earned, against what the alternative would have earned
  ("called it", principle 10). It is also the natural moment to plan the
  next year. Surprises during the year force re-plans.

### Surprises: history as a deck, not a calendar
- **Events** are drawn from a deck shaped by real history: a gas crisis, a
  calm winter, a credit crunch, a sudden fall in solar prices, a storm, a
  grid upgrade, a policy change. Each has a window and a range of size, so
  every run differs (replay).
- **Escalators still escalate,** but their timing varies within a window.
  For example, "the market opens" some time in 1998–2001, and "cheap solar"
  some time in 2009–2013. This keeps the late game moving, which is the
  review's point about history as pacing.
- **Scenery:** the era's machines, places, names and news lines.
- **Later, perhaps:** a fixed historical calendar as an option.

### The bottleneck: attention and room, not cash
- **Money flows faster than in slice 1** [tuning]. The limit is hub room,
  good spots and timing: what to do next, not when you can afford it.
- **Round 1 tests the core with money near-unlimited.** If it is dull when
  rich, the core is wrong; if it is fun, money is tuning.

### Rivals (after round 1)
- **Nordhav and others** add plants to hubs: they flood your hubs and race
  you for spots and room.
- **In round 1** they appear only as "everyone else's" background build-out,
  which already moves the national price.

### Campaign and replay
- **The campaign** runs 3–4 hours in about four chapters of about 50
  minutes, with goals, as in Railroads! scenarios.
- **Replay** comes from the surprise deck, fogged spots, seeds and medal
  goals. A player can pause freely and play at ×1 to optimise, or at speed.
- **Longer play** comes later: a sandbox running past 2025.

## Round 1: test before rebuilding
Round 1 has one variable per test; it is the review's §2, reshaped by
D19. Task: `tasks/2026-10-04-fun-core-toy.md`.

| Test | What it answers | Cost |
|---|---|---|
| **One-screen still** | Can three people point to where money is made and where the problem is, in 30 seconds? | Tiny |
| **Toy 1, "Hubs"** | Is planning plants across hungry hubs fun, with the bottleneck on attention? | One session |
| **Toy 2, "The board"** (review's F) | Is fighting your own falling price fun? One hub's typical day as the board: drop wind and sun blocks and watch the curve sag; drag battery energy from blue hours to red; rivals' blocks arrive | One session |
| **Slice 1, tuned** | Was the old core broken, or only its numbers? Income ×3 and three stub offers | Tiny |

**Recording:** a private test sheet records each tester, and its scorecard
applies the rules below (task file, "Shared").

**Pass** (written before coding; review §2):
- three of four testers play past the 15-minute stop unprompted;
- the median is at least one logged decision a minute;
- no stretch longer than two minutes at top speed;
- three of four state the money rule correctly;
- at least two name a decision they regret;
- the toy beats tuned slice 1 on "keep playing";
- the **obvious bot** ("connect the nearest windy spot to the reddest hub
  with room") scores clearly below thoughtful humans.

**Fail:**
- more than 30% of time at top speed;
- the "most fun" moment is the animation;
- nobody regrets a decision;
- the obvious bot matches the humans.

**Mixed:** one iteration on the weakest measure, then decide.

**Not in round 1:**
- the reward layer (D14, frozen until a pass);
- the share cap (D15, parked until a second zone);
- auctions, the pick-one-of-three, medals, countdowns;
- rivals' flags and zoom-in days.

## What this changes
- **Vision pillar 1** becomes "history arrives as surprises and scenery"
  (D19). Pillars 2–6 stand.
- **Length.** The prototype's "about an hour" (D10) becomes a 3–4 hour
  campaign in chapters (D19).
- **D15:** the goal is kept, and the share cap parked until a second zone.
- **D14:** frozen, then re-derived after round 1 for whichever core passes.
