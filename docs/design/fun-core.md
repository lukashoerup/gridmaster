# The fun core (proposed)

**Status:** proposed on 2026-10-04 and waiting for Lukas as **Q9** in
`docs/decisions.md`. It follows D17 ("fun first"): where realism and fun
conflict, fun wins. It supersedes `running-the-company.md` as the next step;
that document stays as an idea bank for layers built on top of a fun core
later.

> "I think we should try and hold off a bit on the realism part. I want to
> focus on making features/game design that is essentially more fun and
> rewarding. My ideas were just examples, and not necessarily all of them
> good. … we should get inspired by what works well in other similar games.
> Such as transport tycoon, Sid meiers railroads, OpenTTD (although I do not
> particularly like that game), and maybe aspects of games like factorio
> (although quite different), and maybe RTS games … It is alpha omega that
> it is fun, rewarding and engaging. So we need a fun core, that we can
> built on top of I think." — Lukas, 2026-10-04

## In one sentence
**Build a power network on a living map.** Put turbines and panels where the
wind and sun are, and string lines to hungry towns. Keep the towns lit, and
earn the most when and where power is scarce. Meanwhile your own growth
floods the towns you supply, and rivals race you for the best spots.

*Transport Tycoon moves goods through space. Gridmaster moves energy through
space, along lines, and through time, in storage.*

## 1. What the games Lukas named have in common

| Game | Where the fun comes from | The mechanism |
|---|---|---|
| **Transport Tycoon / OpenTTD** | Building routes on a map and watching them work | Pay = cargo × distance × speed, readable and exploitable ([OpenTTD wiki](https://wiki.openttd.org/en/Manual/Game%20Mechanics/Cargo%20income)); trains visibly carry cargo; money pops at the station; your own network makes the problems (congestion, breakdowns); new engines by year. OpenTTD's fiddliness (signals, complex junctions) is what Lukas dislikes |
| **Sid Meier's Railroads!** | The same toy with friction removed, plus rivalry | New technology is **auctioned as a 10-year patent**; industries, power plants among them, can be bought; rival tycoons (Gould, Vanderbilt) bid against you for industries and patents ([Wikipedia](https://en.wikipedia.org/wiki/Sid_Meier%27s_Railroads!); [GamesRadar](https://gamesradar.com/sid-meiers-railroads-review/2)); demand at a destination changes as you deliver to it [unverified detail] |
| **Factorio** | "Every improvement unlocks a better improvement, and every upgrade creates a new puzzle"; the factory itself is the feedback ([Supercraft](https://supercraft.host/article/factorio-retrospective-time-disappear/)) | A bottleneck loop: a line stalls, fix it upstream, then it demands more downstream; constant research unlocks; visible flow; ratios to solve (storage per panel) |
| **RTS** (Command & Conquer, Age of Empires, the economic RTS Offworld) | Pressure, a race and map control | Expand to resource spots before the enemy does; fog of war to scout; power as a base resource (in C&C, low power halves production and switches off defences and radar ([C&C wiki](https://cnc.fandom.com/wiki/Power_Plant_(Red_Alert_1)))); short matches with a clear winner |
| **Mini Metro** (not named, but the cleanest example of the same toy) | A network you draw, under growing pressure | Draw a line and passengers flow. Each week, choose one upgrade. An overcrowded station counts down to game over ([Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))) |

**The eight principles that follow.** Each is a test the core must pass:
1. **A toy you build on a map with your hands.** Placing and connecting is
   the pleasure, and the creation is visibly yours.
2. **Your creation visibly works.** Flow moves along it, and money appears
   where the work is done.
3. **Your own growth makes the problems.** Congestion, starved lines,
   overcrowding: the challenge always concerns *your* system, and fixing it
   feels good.
4. **One short money rule with levers on the map.** It is readable at once
   and exploitable with skill ("cargo × distance × speed").
5. **Something new every few minutes:** research, new models, the weekly
   pick.
6. **Rivals racing for the same visible things:** spots, cities, auctions.
7. **Stakes and a shape:** scenarios with goals and deadlines, and a way to
   fail.
8. **Low friction:** OpenTTD's depth without its fiddliness, in the
   Railroads! way.

## 2. Our current core against the principles

| Principle | Slice 1 today |
|---|---|
| 1 Toy on a map | ✗ Pick a site from a list, then pick a model |
| 2 Visibly works | ✗ Cash ticks up; nothing moves |
| 3 Self-made problems | ✗ Problems come from outside, through history and prices; nothing to fix |
| 4 One money rule with levers | ✗ Price × output, set by an invisible market; few levers |
| 5 Something new often | ✗ A few unlocks, by calendar |
| 6 Rivals racing | ✗ Faceless history claims sites |
| 7 Stakes and a shape | ~ One 30-year run; a medal at the very end; bankruptcy |
| 8 Low friction | ✓ Simple to operate |

This is why slice 1 is passive (playtest 1). No layer of management depth
fixes a core that fails 1–6, which is the lesson of Turmoil and Rise of
Industry (the research report).

## 3. The proposed core: a power network

### The map
- **Region:** a stylised region, starting with northwest Jutland (DK1, D10).
- **Towns:** dots sized by population, plus a few industries (a dairy, a
  cement works; later a data centre).
- **Resource spots:** windy coasts and hills, sunny fields. Their quality is
  **fogged** until scouted or built on.
- **The national grid:** a backbone with a few substations, where power can
  always be sold or bought at the national price.

### The money rule (one sentence the player learns in a minute)
> **A town pays more the hungrier it is.**

- Each town has a hunger meter: demand this hour minus the power it gets.
  Demand follows a daily curve with morning and evening peaks, and is higher
  in winter.
- A **hungry town (red)** pays a high price. A **satisfied town (green)**
  pays a normal one. A **flooded town (blue)** pays almost nothing.
- Surplus flows on to the backbone, where it earns the safe, lower national
  price.
- This is the market fighting back (pillar 2) as a meter anyone can read.
  Flood a town with wind at night and it pays nothing; reach it at the
  evening peak and it pays a lot. It is Transport Tycoon's "cargo × distance
  × speed" turned into "energy × hunger × timing".

### What the player does
- **Place** a turbine or panels on a spot with one click; the cost is shown.
- **Draw** a line from it to a town, to another line or to the backbone:
  click A, click B, and it routes itself (Railroads!, never OpenTTD's
  fiddliness). Cost is per km. The line's **capacity** is shown as its
  thickness.
- **Watch** power flow as moving dots, denser for more MW. Each town pops
  "+€" for each day's sales; turbines spin with the wind and panels glint by
  day. Day and night pass visibly, and the evening peak glows.
- **Fix what your growth breaks:**
  - **Congestion.** On a windy night your line to Holstebro is full. It
    turns red, the farthest turbines stop, and you lose money you can see.
    Upgrade the line, build a second route, or put storage at the wind farm.
  - **Flooding.** Your wind has made Lemvig blue at night. Connect another
    town, sell to the backbone, add storage to move the energy to the
    evening peak, or add solar to reach the midday need.
  - **The evening gap.** Calm evenings leave your towns red while you earn
    nothing. Storage (time transport), a second region whose wind blows when
    yours doesn't, or a supply contract that pays a fixed price.
- **Grow the map.**
  - Towns you keep lit grow, as in Transport Tycoon, and growth means more
    demand.
  - Regions you make green and cheap attract industry: "A data centre wants
    to build near Viborg if 50 MW of green supply is connected by 2014." It
    is a goal you earn, and real in spirit, since Danish data centres came
    for green power.

### Rivals, the RTS layer
- **Nordhav** owns the old coal plants on the backbone, a steady baseload
  that keeps prices calm. Later it builds wind of its own, and its flags go
  up on spots you wanted: a visible **race for the windy coast**.
- **Supply contracts are auctioned.** "Holstebro tenders its power for
  2000–2010; sealed bids in 60 days." Win, and a town pays your price
  whatever its hunger, in return for keeping it lit. Lose, and Nordhav
  supplies it.
- **Technology is auctioned as patents,** in the Railroads! way. "The first
  2 MW turbine: the winning bid gets it two years early and a cost
  advantage." Rivals bid too.
- **Scouting:** measure a spot to clear the fog, before the rival does.

### Something new every few minutes
- **Era unlocks:** bigger turbines, cheaper solar, batteries, offshore
  (with long sea cables to shore), heat stores at district-heating plants (a
  Danish way to soak up cheap power).
- **Pick one of three each new year,** in the Mini Metro way: a crew
  discount, a free survey, a line upgrade, a grant. It is a quick, rewarding
  choice that varies every run.
- **Milestones and company levels** (D14), and town growth you can see.

### Stakes and a shape
- **Chapters of about 45 minutes,** each a scenario with bronze, silver and
  gold, in the Railroads! and Railroad Tycoon II way. For example:
  1. "Wind pioneers", Thy, 1995–2002;
  2. "The big build-out", all of Jutland plus offshore, 2002–2012;
  3. "Too much of a good thing", 2012–2020;
  4. "Volatility", 2020–2025.

  This matches the vision's four era chapters.
- **A way to fail that creates tension:** a town you have contracted that
  stays dark starts a Mini Metro-style countdown. Lose it and you lose the
  contract and reputation, not the game.

### What realism becomes
- **History** is flavour and unlocks: the era's machines, prices that drift
  by era, and the big set pieces. In 2022 the backbone price soars and
  anyone with spare power cashes in; in December 2024 a windless week turns
  every town red. History is no longer a difficulty curve the player must
  study.
- **Weather** can keep its real shapes from the Phase 1 core, because they
  make wind and sun feel alive. Exact market numbers drop out of the
  player's view.
- **Kept, because these truths are the fun:** intermittency, the value of
  being where and when power is scarce, storage, and your own success
  flooding the market.

## 4. Alternatives considered
| Core | Feels like | Why not first |
|---|---|---|
| **B. Site layout puzzle** (Factorio-like): lay out each farm's turbines, cables and transformers on a grid, with wake losses | A satisfying optimisation puzzle | It drifts into the engineering sim the vision rules out, and it is fun per site, not as a company |
| **C. Claim race** (Offworld/Turmoil-like): short matches on today's site map; claim spots against rivals; one shared price that reacts | Tense, replayable | No toy to build and nothing visibly working (principles 1–3). It is a good *mode* on top of A, not a core |
| **D. Keep the current core and add management depth** (`running-the-company.md`) | A deeper spreadsheet | Fails principles 1–4 at the root; Lukas has set it aside |

## 5. How we find out: a toy, not a slice
No design guarantees fun, and only playing does. The next build should
therefore be a **toy**, small and fast: one session, at most two.

**In the toy:**
- one map (northwest Jutland): 8 towns, 12 fogged spots, a backbone;
- wind, solar and lines; storage early (time-shifted for the toy);
- hunger pricing, flow animation and "+€" pops;
- Nordhav and its flags;
- one contract auction;
- the pick-one-of-three each year;
- chapter 1's goals;
- pause and speeds.

**Not in the toy:** loans beyond one simple loan, the real market data,
saves, tutorials, art.

**The test, about 15–20 minutes of play.** Lukas, then 2–3 friends, answer
three questions:
1. Did you want to keep playing?
2. What was the most fun moment?
3. When were you just waiting?

The game logs decisions per minute and the time until the first problem
caused by the player's own network. **Targets:** a decision at least once a
minute; the first self-made problem within 10 minutes.

**If it is fun,** the toy becomes the core the prototype builds on:
- slice 1's money, loans, saves and history calendar are reused;
- the reward layer (D14) and the goal (D15) sit on top;
- the idea bank (`running-the-company.md`) feeds later layers.

**If it is not,** one iteration on its weakest principle. If it still is not
fun, toy C.

**Where it lives:** a new page and folder (`toy.html`, `src/toy/`) beside the
prototype. `src/sim` and `src/game` stay untouched, so nothing is thrown
away while we find out.

## 6. What this changes, if Lukas approves
- **The vision.** The pillars stay in spirit, in a new order of priority,
  "fun first" (D17):
  - "History is the difficulty curve" becomes "history is flavour and
    unlocks";
  - "The market fights back" is kept as town hunger;
  - the scope guardrail "not a grid-physics sim" still holds, since lines
    are a transport network, not power flow.

  These edits follow the toy, once the core is proven.
- **The roadmap.** Phase 2 becomes "find the fun core (toy), then build the
  prototype on it". The gate question stays: do players want to keep going?
- **The Phase 2 task.** Slices 2–8 wait. The toy is the next task.
- **Risk.** Power Network Tycoon (1.0 in September 2026, report) is a grid
  game built on engineering physics. Gridmaster stays a business tycoon:
  money, rivals, history, hunger prices. The toy should feel like Railroads!,
  not like a circuit simulator.
