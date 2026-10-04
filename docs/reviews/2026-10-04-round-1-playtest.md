# Round 1 playtest: Lukas's verdict and a diagnosis — 2026-10-04

**Status:** analysis. The proposal at the end waits for Lukas as **Q11** in
`docs/decisions.md`. Nothing here changes a decision.

## What Lukas said (verbatim)

> This is not fun tbh. Non of the game types works. I am honeslty not sure
> if it is just a bad idea in general, or because it is too simple right now
> when testing. The map thing is a little weird as these places are so close
> together that it does not make sense that there are different prices in
> these cities. That is easily fixable by just having the same functionality
> on a larger map, but it is still not fun. Three is so much text on all
> pages. It is overwhelming. Looking past that, it is just so basic to buy
> these and just follow them. And it feels so random if it suceeds or not,
> thus, it feels unimportant what you build where.
> The old game mode is still not fun. In many ways due to the same faults
> just mentioned, but also the ones we discussed earlier.
> The board mode is maybe the worst. It is done in under 5 minutes, and you
> do not care about what you do. It is just so damn basic. And the pricing
> is off. You know exaclty what you get out of each round. The game is
> finished completely in about 50 clicks, where you just optimize for the
> highest expected this year. Which is achieved by not building too much
> (around 4 windmills), so the prices sky-rocket. Batteries never works.
> Honestly, I am not sure what to do from here.

## Verdict against the round 1 rules
All three games fail, by the owner's own play. The rules' fail signals
(design, "Round 1") are visible without the test sheet's numbers:

- **Toy 1 "Hubs".** "It feels unimportant what you build where."
  - Outcomes read as random, so no decision feels like it mattered.
  - The hubs' price differences make no sense at that distance.
- **Toy 2 "The board".** "Done in under 5 minutes, and you do not care."
  - The forecast told the player exactly what each year would pay, so the
    game is solved in about 50 clicks.
  - The best play is restraint: about four wind blocks, so prices soar. A
    monopolist withholds supply.
  - Batteries never paid.
- **Slice 1, tuned.** "Still not fun". Tripling the income did not fix it,
  which answers the comparison: the old core was broken, not only its
  numbers.
- **All three:** "so much text on all pages. It is overwhelming."

## Diagnosis
Four faults are shared by all three games, so they come from the core
idea, not from one toy's tuning.

1. **The antagonist is your own success.** The fun-core thesis was "stay
   ahead of the price your own success pulls down" (`docs/design/fun-core.md`).
   - In every toy the market punishes building more, so the strongest play
     is to build little and wait. The board made it explicit: four blocks
     and soaring prices.
   - A tycoon's pleasure is growth. Transport Tycoon, Railroads! and
     Factorio reward building more, and make *how* to build more the
     challenge. We made restraint the winning move, which turns the
     builder's verb against the builder.
2. **Choices do not show their consequences.** The two toys failed in
   opposite directions:
   - Toy 1 was too noisy. Weather and placeholder prices swamped the
     player's choice, so success felt random.
   - Toy 2 was too certain. An average-day forecast made every year
     known, so it was solved.

   Neither gave "I did that, and look what happened". Good uncertainty is
   something the player can read and prepare for, such as a calm evening
   or a cold snap, not a dice roll after the fact.
3. **Nothing to build, nothing grows.**
   - The verb was "buy a block" and the feedback a number.
   - The games Lukas named have the player construct something visible
     that works: track, belts, trains moving.
   - Nothing in our toys grows because of the player: no town, no network,
     no company shape.
4. **Told, not shown.**
   - Every rule was explained in text.
   - The price colours were the only thing the eye could read.
   - The reward layer (D14) was frozen for round 1, and with it went the
     goals and progression a player could care about.

## Is the idea bad?
The theme is not the problem. The board game *Power Grid* is entirely
about electricity and is a long-standing classic. Factorio's power network
is a part its players love. In both, the fun comes from something other
than a realistic market:
- in Power Grid, racing and bidding against other people for plants and
  cities;
- in Factorio, building a machine you can see working, and keeping it fed
  as it grows.

What round 1 showed is narrower and cheaper to learn now than later:
**an electricity market, used as the puzzle, is not fun.** Realistic prices
make a good backdrop and a poor game.

## Proposal (for Q11)
Flip the core from "beat the market" to **"build the grid that keeps a
growing region lit"**: a building game whose constraint is physical and
visible, with money as the means, not the puzzle.

- **A big map** (Lukas: "a larger map"), real geography. Towns and
  industry ask for power and grow when they get it.
- **Build plants and draw power lines**, the way you lay track. Lines have
  capacity and cost by length, so where you build is a spatial puzzle.
- **Legible money.** Towns pay a known contract price for power delivered.
  Revenue follows the network you built, not the hour's spot price. Era
  prices are a slow tide, not the puzzle.
- **A visible enemy: the gap between supply and demand.**
  - The wind drops at dusk, the sun sets in winter, a cold snap arrives.
    The forecast shows it coming a day ahead, so it is readable, not random.
  - Short supply browns a town out: its lights go dark on the map, and it
    costs money and goodwill.
  - Batteries, backup plants, more lines and wind spread over the map are
    the answers, so storage matters.
- **Growth as the reward.**
  - Towns kept lit grow, and demand climbs.
  - New towns and industries appear, and the network has to keep up. The
    snowball is the builder's pleasure, as in Mini Metro and Transport
    Tycoon.
- **Shown, not told.** Light, colour and flow along the lines. A few words
  on screen at most.
- **Later layers,** once the core is fun:
  - a rival company racing for towns and the best sites (Power Grid's
    lesson);
  - history as surprises (D19);
  - the reward layer (D14).

**Test it the round 1 way:** one small visual toy and twenty minutes of
play. The same three questions apply: would you keep playing, which
decision do you regret, and when were you waiting. If that is not fun
either, the project's premise needs a harder look before more is built.

**What it would change.**
- Vision pillar 2, "The market fights back", would move from core to
  backdrop. Pillar 4, "Every megawatt is a bet", would shift from how to
  sell toward where and how to build. Both are pillar changes and need
  Lukas.
- The fun-core design (D19's "plants on a map of hungry grid hubs") would
  be reshaped. Its map, longer plans, surprises and campaign length
  survive.
