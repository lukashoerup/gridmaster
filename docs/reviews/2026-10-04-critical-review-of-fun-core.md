# A critical second opinion on the fun core — 2026-10-04

**Status:** an independent review, read-only, written before the toy is built.
Nothing here is a decision; proposals become decisions only in
`docs/decisions.md`. Facts I checked are marked as such; everything else is
design judgement, and anything I could not check is marked [unverified].

## 0. For Lukas, in plain language

- The team is right about what went wrong: the first version had one thing
  to do (buy a turbine) and a long wait in between. Measured, not guessed.
- The new idea (place turbines, draw lines to towns, watch power flow, towns
  pay more when hungry) is a real step up and worth testing. It is also the
  design most likely to end up as "a train game with wind turbines".
- The biggest hidden flaw is the clock. The money rule works hour by hour
  (evening peak, windy night), but the game will run at years per minute.
  Players will never see the thing that is supposed to make them money.
  Settle this before anything is built.
- Second hidden flaw: the new idea quietly stops testing the game's one
  original claim, that your own building lowers your own prices and that
  this can be fun. Test that too, or we build on a core other games have.
- The toy tests too much at once (rival, auction, medals, yearly bonus,
  growing towns); if it fails, nobody will know why. Cut it to the bone and
  test with money switched off, so boredom cannot be blamed on being poor.
- Before any code: one hour with a printed map, coins and a die. It answers
  half the open questions this week.
- Judge the test by what people do (keep playing unasked, come back the
  next day, never sit on fast-forward), not only by what they say.
- Some earlier decisions now pull against each other: a rule that punishes
  you for dominating a region versus a core that rewards lighting a whole
  town; a 30-year story in one hour versus four 45-minute chapters; a
  reward layer built for the old economy.
- Keep the realism that creates decisions (weather, scarce grid room,
  storage, deadlines you can see coming such as 2022). Drop the realism
  that only creates paperwork.
- Five questions for you are at the end. None costs money.

## 1. The "power network" core: steelman, then stress test

### What is genuinely strong
1. **The diagnosis is right and measured.** In the bot runs the cautious
   bot's median gap between builds is 2.8 real minutes at ×1, and after
   2003 it never builds again while sitting on €250–460k of cash for 22
   game years. One verb, gated by a savings timer.
2. **Scaling the market down to the player.** In DK1 the player is a few
   per cent of the zone, so the player's own effect on prices is invisible.
   Town hunger shrinks the market to a size where the player's own output
   visibly moves the price. This is the best idea in the document, and it
   does not depend on drawing lines.
3. **Self-made problems** (congestion, flooding, the evening gap) are proven
   tycoon fun. Flooding is cannibalisation made legible.
4. **A thematic anti-snowball.** Hunger gives diminishing returns per town
   for a reason the player can see, where Power Grid needs a payout table
   its critics call "gamey" (research notes).
5. **Process discipline:** a toy beside the prototype; nothing thrown away.

### Where it will most likely fail

**Minutes 0–5.** Place, draw, dots flow, "+€". Mini Metro's first minute is
exactly this and it works. But where is the first *dilemma*? If the nearest
windy spot and the nearest town are visible, the opening is execution, not
decision, and fog only helps once scouting is a real trade-off, which at
minute 2, with no money, it is not. Make the first choice a visible
trade-off between two spots (windy and far versus calm and near), as the
first route in Transport Tycoon is.

**Minute 20: the hunger rule and the return of the cash timer.** Red, green,
blue is readable. Interesting is another matter. The dominant move is
"connect the reddest town you can afford"; once a town is green there is
nothing to do there, and the loop becomes coverage: find the next red town,
wait for cash, connect. That is slice 1's loop in a new skin, unless either
cash stops being the bottleneck and attention becomes it, or green towns
keep producing decisions (weather, growth, the rival). The document never
says which bottleneck it wants. In Transport Tycoon money comes fast and
building is the constraint. The toy should settle this directly: run it
with money effectively unlimited. If it is dull with free money, the core
is wrong; if it is fun, money is tuning.

**The clock contradiction: the top design flaw.** The money rule is hourly
("flood a town at night, reach it at the evening peak"). Chapter 1 is seven
game years in about 45 minutes: 6.5 minutes a year, about one second a
day. The evening peak is a 40-millisecond flicker, and "+€ per day" pops
about 2,500 times a chapter. The player cannot perceive, let alone exploit,
the pattern that is supposed to be the skill. Mini Metro and Transport
Tycoon work because the unit of the money rule (a trip, a week) runs at the
speed the player watches. Pick one:
- (i) the player acts on daily patterns, so a day lasts 5–10 seconds, a
  year 30–60 minutes, and a 30-year campaign is impossible; or
- (ii) the player acts on structure (siting, line size, storage ratio,
  rules) and the daily curve is background. Then hunger must be a
  rolling-week or seasonal meter with a "worst hour" marker, and hourly
  play happens only in optional zoom-in days (a storm, a lull).

I recommend (ii) for the toy, with one zoom-in day, because it fits "the
game does the arithmetic" and a 45-minute chapter. Whichever it is, write it
down; today the design silently assumes both.

**Hour 3 and the late game.** Everything green, lines upgraded, spots taken:
a plateau. Every proposed counter is self-inflicted, so each is solved once.
What keeps Anno and Factorio alive late is an external escalator that
changes the problem, and the proposal demotes the one escalator this game
has, history, to "flavour". That is backwards: history here is pacing, not
realism. Keep era changes as escalators (1999 the backbone price starts
moving; 2009 negative prices; 2012 the solar flood; 2022 the spike) even
with loose realism. Second snowball: a backbone that "always buys at the
national price" is a floor, and the dominant strategy becomes "windiest spot
beside a substation, dump everything into the backbone". Either the backbone
price is endogenous (the Phase 1 core already clears a merit order) or
backbone capacity congests.

**"Mini Metro with wind turbines".** The research found the empty slot to be
market realism plus European historical progression plus storage
arbitrage. The proposal keeps storage and a legible local market, drops
history to flavour and finance from the core. The vision's "biggest risk",
whether cannibalisation is fun, is no longer tested; the toy tests whether a
network toy is fun, which Mini Metro already answered. The danger is proving
the fun of a borrowed core and never testing your own.

**Lines and the energy-company fantasy.** Checked: in Denmark the
state-owned Energinet owns and operates the transmission grid; wind-farm
owners pay connection fees and tariffs, and developers build the connection
to the onshore substation (for recent offshore farms even the platform and
sea cable). So "draw a line to a substation and pay for it" is real;
"run lines to towns and sell to them" is a grid-owner fantasy, not the
brief's producer fantasy. Fun first says this may not matter, but the fix
is free: lines connect to substations with limited room (real west-coast
congestion and queues), the substation's local price is the hunger meter (a
nodal price in all but name), and the backbone links substations. Same toy,
same verbs, truthful, and it keeps the "scarce grid room" decision the
vision wanted.

**Competitors.** Power Grid's literal premise is plants plus a network to
cities, scored by cities powered, with a 2024 digital version. Power
Network Tycoon is a physics grid sim (the notes say 1.0 shipped on 30
September 2026; my search found it in Early Access with 26 reviews at 96%
positive, so one source is stale [unverified either way]). A
connect-the-towns toy puts the game in their lane; market, history and
finance are the way out of it.

**The single riskiest assumption:** that the problems your own network makes
are frequent and varied enough to replace the cash timer as the pacing
device for 45 minutes, that is, that the bottleneck moves from cash to
attention. Readability, fantasy and uniqueness are fixable by tuning or
reframing. This one is the core.

## 2. The process

**Is the toy the right next step?** In spirit, yes. Two caveats.

First, the evidence that *the core* is broken is thinner than the documents
suggest. Playtest 1 tested slice 1, a quarter of the design (no solar
puzzle, offers, levels, Nordhav or batteries), on placeholder prices, with
a tuning cliff: small turbines leave the catalogue in 2003 and the cautious
bot then sits €300–460k short of a 2 MW turbine's equity for 22 years. Part
of "passive" is tuning. And the proposal's scorecard rates slice 1 as
built, not the design as approved; scored honestly the design fails about
three principles (1, 2, partly 6), not six, since cannibalisation *is*
"your own growth makes the problems" and offers are "something new". D17 is
decided and I am not reopening it. But the toy should be **comparative**:
the same four testers, 15 minutes each, on (A) the network toy and (B)
slice 1 with income tripled and three offer cards stubbed in. B costs
almost nothing. If A is not clearly more fun than a tuned B, the problem was
never the map.

Second, the toy as scoped is a slice in disguise. Thirteen acceptance
criteria, including Nordhav, an auction, pick-one-of-three, medals, a
countdown, growing towns and a session log. "One session, at most two" is
optimistic, and worse, five systems tested at once cannot be attributed. If
it is fun you will not know which part did it; if not, you will not know
what to cut.

**What to cut and add.** Toy 1: a map with six towns and eight spots; place,
connect, flow, hunger; one storage unit; congestion; money near-unlimited;
one era switch (the backbone price starts moving in 1999) as the escalator;
a weather stream (storm, lull) as external pressure; the session log; and
an **obvious bot** (connect the reddest nearest town) whose score is the bar
a human must beat. If the obvious bot scores like a human, the rule has no
depth. Drop for now: the auction, pick-one-of-three, medals, the countdown,
town growth, Nordhav's flags. They are reward-layer items for once the core
has a pulse.

**Are three questions and 2–4 testers meaningful?** As a *kill* test, yes:
if Lukas and three friends do not want to keep playing a 15-minute toy, it
is dead. As a *pass*, no: four people enjoying 15 minutes measures novelty,
and moving dots are fun for ten minutes in anything. Add behaviour from the
log: time at top speed (fast-forward is waiting), decisions per minute,
whether they stop at 15 minutes or carry on unasked, whether they ask to
play again tomorrow, whether they can state the money rule in one sentence,
and whether the "most fun moment" was about *their* network or about the
animation.

**Pass and fail.**
- *Pass:* at least three of four play past the 15-minute stop unprompted;
  a median of at least one logged decision a minute; no stretch above two
  minutes at top speed; three of four state the money rule correctly; at
  least two name a decision they regret (that is depth); and the toy beats
  tuned slice 1 on "keep playing".
- *Fail:* more than 30% of time at top speed; "most fun" is the "+€" pops;
  nobody regrets anything; the obvious bot matches the humans.
- *Mixed:* one iteration on the weakest measure, then toy F (§4).

**Designing by document instead of by play?** Yes: eight design documents
and three reviews in one day, and no paper. A sharper plan:
1. **Paper test, this week, one hour.** A printed map, six towns, coins for
   MW, a die for wind, cards for hours of the day; Lukas and a friend play
   ten "days". Does red, green, blue start arguments about where to build?
   Paper exposes the clock problem in five minutes.
2. **One-screen test.** A still of the map at minute 20, shown to three
   people for 30 seconds: "where is money made, and where is the problem?"
   If they cannot point, readability fails before any code.
3. **Fun in one sentence.** Write the sentence a player would use to
   recommend the game. "You connect turbines to towns" is Power Grid. "You
   catch the evening peak before the wind dies" is yours.
4. **Two or three micro-toys of one session each** instead of one toy of
   two: A (network and hunger), F (the price curve as the board, §4) and a
   bare storage-timing toy, compared with the same testers.

## 3. Consistency check: D6–D16 against D17 and the proposal

| Decision | Conflict | Verdict |
|---|---|---|
| D6 pillar 1, history is the difficulty curve | Demoted to flavour by the proposal | **Change** to "history is the escalator": era changes alter the problem on a schedule, with loose realism; never a study requirement |
| D6 pillar 2, the market fights back | Kept as town hunger only | **Keep**, as hunger *and* an endogenous backbone price |
| D6 pillar 3, real weather, never a replay | Not needed for the toy | **Keep** the shapes (free from the core); defer fidelity |
| D6 pillars 4–6 | None | **Keep** |
| D7 stack; PixiJS only if the map needs it | Hundreds of moving dots on SVG may stutter | **Keep**; a toy can stutter. Note it so nobody adds a dependency on the quiet |
| D9 first-release scope | Unknowable until a core exists | **Mark provisional**; do not revisit now |
| D10 DK1, 1995–2025 | The prototype design promised about one hour for 30 years; the proposal implies four chapters of 45 minutes. The length changed silently. Hunger pricing in 1995 Denmark is also anachronistic (fixed tariffs) | **Decide the length** (question 2 below). The anachronism is fine under fun first; just never market "a realistic 1990s" |
| D11 barn panels; D12 fossil converted late | None | **Keep**; the barn is town zero, Nordhav's coal sits on the backbone |
| D14 reward layer | Built for slice 1's economy. "Called it" re-prices against hourly DK1 prices; the offer deck overlaps pick-one-of-three and the auctions | **Change:** keep levels, records, jackpots, restructuring; merge offers, picks and auctions into one card system; re-derive "called it". **Freeze** until the toy passes |
| D15 goal and share cap | A cap that punishes zonal dominance against a core that rewards lighting whole towns ("towns you keep lit grow"); the cap is also a multi-zone device | **Keep the goal, park the cap.** Hunger already punishes over-supply thematically; revisit with a second zone |
| D16 build Phase 2 in parallel | Superseded in practice (slices 2–8 wait) | Fine; record it |
| Real-time with hourly simulation | Fine as an engine; as presentation it collides with the hourly money rule (§1) | **Change the interface clock**, not the core |
| D18 pause realism | Consistent | Add: the merit-order core should feed the backbone price too |

## 4. Alternative cores

First, the principles. Principle 1 ("a toy you build on a map with your
hands") is read off the games Lukas named, but his dislike of OpenTTD and
his liking for "aspects of Factorio" and RTS games read to me as *pressure
and agency every minute*, not necessarily a map toy. Football Manager, Game
Dev Tycoon, Turmoil and Frostpunk have little or no free-form building;
what they have is a tight loop with a reveal. Two principles are missing:
**(9) the bottleneck is attention, not cash**, and **(10) uncertainty with a
visible reveal** ("called it"). Principle 4 is right, but hunger is not the
only candidate for the one money rule.

**E. The season bet** (shaped like Turmoil and Football Manager). A run is a
sequence of years: a planning phase of two to three minutes (forecasts with
error bands; place assets, contracts, storage, rules), then a 60-second
animated "season" in which weather, prices and rivals play out on the map
and the ladder, ending in payout cards and "called it". The fun is the bet
and the reveal; the pacing is honest by construction. Weak on principles 1
and 2 during the season (you watch), strong on 5, 7, 9 and 10, and it keeps
everything unique, with history as a per-season escalator.

**F. The price curve as the board** (shaped like Offworld). The main screen
is the zone's 24-hour price curve and merit-order ladder, the player's
blocks lit when in the money. Drop a solar block and the midday valley
deepens, visibly your own doing; drop a battery and *drag* energy from the
blue valley to the red peak; watch the spread flatten as you and the rivals
add storage. Sites are a side map. The fun is shaping a curve that fights
back, and it is the honest test of the vision's biggest risk on one screen.
Strong on 1 (hands on blocks), 2, 3 (you flatten your own spread) and 4
("energy × hour"); 6 needs rivals' blocks (cheap); 7 needs chapters.

**G. Customers, not towns** (Power Grid's "cities powered" plus real supply
contracts). The player wins *customers*: the farm, a dairy, a village co-op,
a supermarket chain, a data centre, each a contract with a demand profile,
a price and a fine for darkness. The fun is matching portfolio, storage and
backbone top-ups to a profile under weather, then bidding for bigger
customers against Nordhav. The money rule is readable and true ("a customer
pays what you agreed and fines you when you leave them dark"); corporate
power-purchase agreements are real [background knowledge]. The spatial
layer is light: connections to substations.

| Principle | A network | E season bet | F price board | G customers |
|---|---|---|---|---|
| 1 toy on a map | Y | ~ | Y (blocks) | ~ |
| 2 visibly works | Y | ~ | Y | Y |
| 3 self-made problems | Y | Y | Y | Y |
| 4 one money rule | Y | Y | Y | Y |
| 5 something new often | ~ | Y | ~ | Y |
| 6 rivals racing | Y | Y | ~ | Y |
| 7 stakes and shape | Y | Y | ~ | Y |
| 8 low friction | Y | Y | Y | Y |
| 9 bottleneck is attention | ? | Y | Y | Y |
| 10 uncertainty and reveal | N | Y | ~ | Y |
| Tests the unique claim | ~ | Y | Y | Y |
| Clock is honest | N | Y | Y | ~ |

A stays the first toy: it has momentum and Lukas's own inspirations behind
it, *reframed* as §1 says (substations, an endogenous backbone, one era
escalator, a fixed clock). F is the second micro-toy in the same session,
because it is small and tests the claim A avoids. The eventual game is
probably A's map, F's board and E's reveal.

## 5. Realism against fun: what the blended games teach

**Hearts of Iron IV** (background knowledge unless noted; the focus-tree
structure and the 70-day focus duration are confirmed by search).
- *Abstraction.* No soldiers; divisions are templates, and the division
  designer is a toy you build with your hands inside a realistic frame.
  Supply is hubs and railways, not trucks. Production is factory lines with
  efficiency ramps. Fidelity stays where it makes decisions (terrain,
  weather, supply, doctrine) and goes where it would be chores.
- *Showing complexity.* Deep combat arithmetic, surfaced through nested
  tooltips, which is pillar 5 exactly. Battle plans delegate the front
  line, which is "chores become delegable".
- *History made fun.* The national focus tree turns history into a timed
  build order with branches; the historical path is the default and a game
  rule lets players choose fidelity or chaos. Above all, **foreknowledge is
  the clock**: everyone knows 1939 is coming, and the fun is preparing for
  a deadline you can see. Play Poland in 1936 and you have three years,
  which is Railroad Tycoon II's medal deadline in another skin.
- *Caution.* A wall of a first hour and years of onboarding work; take the
  devices, not the scale.
- *For Gridmaster:* make the dated events deadlines the player sees coming
  on a timeline (1999 market opening, 2008 credit squeeze, 2012 solar flood,
  2022 spike, December 2024 lull), with branches when randomised, and
  "called it" as the reveal. The calendar already exists, so this realism
  is cheap and *is* fun.

**Other Paradox titles.** Victoria 3: depth without agency ("won't move
unless you do"), answered by the autonomous-investment patch (research
notes): automate the routine, keep the strategic. Crusader Kings 3 turns dry
history into character drama; Nordhav's arc of overreach and rescue is this
game's version.

**Football Manager.** The deepest simulation in sport, fun because the match
is a reveal you set up but do not fully control, the attributes are honest,
anything can be delegated to the assistant without losing the fun, and
stories emerge from the numbers. For Gridmaster: the annual report as the
reveal; delegation as progression; never a fake number.

**Frostpunk** (laws, meters and consequences confirmed by search). One
visible heart (the Generator), two readable meters (Hope, Discontent), a
Book of Laws where you pick one of two, irreversibly, with short, medium
and long effects and story consequences, and a 45-day scenario with a storm
on a known date. For Gridmaster: one heart (the ladder or the grid), two
meters (cash and hunger or reputation), picks that are irreversible and
consequential rather than small buffs, and a storm with a date.

**Anno 1800, Kerbal Space Program, Two Point Hospital, Cities: Skylines.**
Anno keeps realism in the production chain and is cartoonish about ships,
money and time; for Gridmaster, realism in the chain (weather → MWh → price
→ cash), cartoon in the clock. Kerbal makes real physics fun through
spectacular, visible, recoverable failure and by doing the arithmetic for
you; brownouts and congestion should be dramatic and recoverable, never a
quiet line in a report. Two Point is a silly skin over a real queue sim with
star goals: "mature" does not mean grey. Cities: Skylines made traffic the
visible face of its simulation; its sequel is the cautionary tale for
numbers the simulation does not use (research notes).

**Lessons for Gridmaster.**
- *Keep, because it creates fun:* intermittency with real weather shapes
  (free from the core); your own output lowering your own price, *if* shown
  on a curve where you see your blocks; storage as time transport; scarce
  grid room (queues, congestion, curtailment, real on the west coast);
  dated history as visible deadlines; sealed-bid tenders with a winner's
  curse; rival corporate arcs.
- *Drop, because it creates chores or nothing:* year-exact tariff schedules;
  nominal inflation; year-accurate price floors; permit paperwork; forecast
  error in the early game; hand dispatch outside zoom-in days; the
  2.4-minute year; loan arithmetic the player must do; any number the
  player cannot act on.

## 6. Recommendations

**Changes to the fun-core proposal before the toy is built, in order:**
1. **Fix the clock in the document.** Choose structural play: a rolling
   hunger meter with a worst-hour marker, a day of two to three seconds,
   one zoom-in day per chapter, and chapter 1 covering three or four game
   years, not seven.
2. **Test with money switched off.** Near-unlimited cash in toy 1, so
   boredom cannot be blamed on tuning. If it is fun poor, it is fun; if it
   is dull rich, the core is wrong.
3. **Make the backbone price endogenous**, from the merit-order core, or
   give the backbone a capacity that congests. Otherwise "dump to the
   backbone" is the dominant strategy.
4. **Lines become connections to substations with limited room**; the
   substation's local price is the hunger meter. Same toy, truthful fantasy,
   keeps scarce grid room as a decision.
5. **Keep one era escalator** (1999) and a weather stream in the toy, so
   the test includes something that changes the problem from outside.
6. **Cut the toy to the core.** Drop the auction, pick-one-of-three, medals,
   countdown, town growth and flags from toy 1; freeze D14 until a pass.
7. **Write the pass and fail criteria before coding** (§2), add the obvious
   bot, and run the tuned slice 1 comparison with the same testers.
8. **Paper test and one-screen test this week**, before the code.
9. **Build toy F** (the price curve as the board) as a second one-session
   micro-toy in the same round.

**Questions Lukas must answer:**
1. Whose shoes are you in? A company that owns the wires and keeps towns
   lit, or one that owns the power plants and sells into a market? Both can
   be fun; they are different games, and drawing lines to towns makes the
   first one.
2. How long is one sitting, and should the whole 30-year story fit in one
   evening, or is it a three-to-four-hour campaign played in chapters?
3. When the game asks you to act, would you rather act on *today's weather*
   (fast, hands-on, many small moves) or on *this year's plan* (fewer,
   bigger bets, then watch them pay off)? Pick the one you would happily do
   a hundred times.
4. If a friend plays the toy and says "fun, like a train game with
   turbines", is that a win or a warning?
5. Do you want history as deadlines you can see coming (2022 is on the
   calendar, be ready), as surprises, or as scenery?
6. How rough may the toy look and still be judged fairly? (This sets what
   the test can conclude.)

**Top three risks, each with a cheap reduction:**
1. *Novelty mistaken for a core.* Moving dots are fun for ten minutes in
   anything. Reduce: judge at minutes 20–30, ask for a second session the
   next day, compare against tuned slice 1, run the obvious bot.
2. *The clock contradiction makes the money rule unreadable.* Reduce: the
   paper test and the one-screen mock before any code.
3. *Five systems tested at once.* Reduce: one variable per toy; freeze the
   reward layer; attribute every finding to a mechanic before adding the
   next.

## What is verified and what is opinion
- *Verified in the repository:* the bot pacing figures; slice 1's content;
  the test suite passes (110 tests in 15 files).
- *Verified by search:* Mini Metro's weekly pick and overcrowding game over;
  Railroads!' ten-year patent auctions with rivals bidding; Energinet owning
  Danish transmission and wind owners paying connection charges; Frostpunk's
  laws and meters; the Hearts of Iron IV focus structure.
- *Opinion:* every verdict, the alternative cores, the pass and fail
  criteria and the ordering of the recommendations.
- *[Unverified]:* Power Network Tycoon's current release status; corporate
  power-purchase agreements as described (background knowledge).
