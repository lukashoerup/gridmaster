# Tycoon & Economic-Management Game Design Lessons (for "Gridmaster")

> Research note, 2026-10-04. **Source constraint, read first:** the network egress proxy blocked every full-page fetch I tried (Wikipedia, PC Gamer, GameSpot, Shacknews, designer-notes.com, the OpenTTD wiki, PCGamesN, Notebookcheck, VaporLens, Dedoimedo, TheSixthAxis), and the session's shared web-search budget ran out partway through. So every cited finding below comes from search-result snippets or summaries tied to the linked URL. I give quotes only where the snippet contained them; everything else is paraphrased. When a snippet could have come from more than one result, I link every candidate and mark it "(attribution approximate)". VaporLens pages are AI-generated summaries of Steam reviews. Steam, Reddit, Lemmy, itch.io and forum items are player opinion, not designer statements. Background knowledge I could not verify is listed under each "Gaps" heading as **unverified leads**. Do not state those as fact without checking them first.

---

## 1. Core loops and progression in the most successful tycoon/management games (incl. how Factorio, Satisfactory and Oxygen Not Included make power interesting)

### Takeaway
The games that last run a short, readable loop: earn, reinvest, unlock. Every so often they change the problem in front of the player: a new population tier, a new region, a new rival or a new way to fail. Usually a market or the infrastructure itself is the antagonist. Power systems in factory games are compelling because they create linked problems that change over time: day/night output curves, storage limited by both capacity and charge rate, wire/grid capacity caps, cascading brownouts and load-shedding priorities. Those are close cousins of the real problems a renewable-energy tycoon is about.

### Cited Findings

#### Markets as the core loop
- **Offworld Trading Company** (Mohawk Games, designer Soren Johnson) is an economic RTS with no combat, described as "a competitive city builder, and a stock market valuation simulator all rolled into one" — [Shacknews](https://www.shacknews.com/article/93533/offworld-trading-company-taking-stock-in-space); [Game-Wisdom](https://game-wisdom.com/analysis/offworld-trading-company) (attribution approximate)
- Johnson found that games with a market inside them had "a really interesting dynamic aspect" he didn't see elsewhere. Unit control was stripped out to make room for "the free market gameplay" — [Matchstickeyes interview](https://www.matchstickeyes.com/2014/10/01/offworld-trading-company-interview-with-soren-johnson/)
- Up to 8 human or AI players profit by producing or buying low and selling high. A single on-screen market sets the price of every resource, and prices move with random events and with every player's buying and selling — [Giant Bomb](https://giantbomb.com/wiki/Games/Offworld_Trading_Company)
- An earlier OTC design had players deliver resources to colonies with location-specific demand (steel worth $10 at a nearby colony vs $100 at a distant one) — [Designer Notes: OTC #2 "Free Markets"](https://www.designer-notes.com/otc-designer-notes-2-free-markets/). The shipped game uses the shared market above. Why the design changed could not be read (see Gaps).
- If you fail to produce an input you need, the game buys it for you on debt. Too much debt pushes your stock price down and makes you a cheaper buyout target. You win by buying out rivals, either by collecting their shares over time or in one hostile takeover — [GameSpot review](https://gamespot.com/reviews/offworld-trading-company-review/1900-6416420/); [Gameranx review](https://gameranx.com/features/id/49930/article/offworld-trading-company-review-cutthroat-capitalism-at-its-finest/) (attribution approximate)
- **Turmoil** (Gamious; Steam Early Access 2015, full release 2016) is set in the 19th-century North American oil rush. Each level is one in-game year on one plot: find oil pockets, build rigs and pipes, sell the oil, buy land and grow the town, in a race against NPC oil barons — [Wikipedia](https://en.wikipedia.org/wiki/Turmoil_%282016_video_game%29); [SLUG Magazine](https://www.slugmag.com/community/reviews/game-reviews/review-turmoil/); [Tech-Gaming](https://www.tech-gaming.com/turmoil/) (attribution approximate)
- **Capitalism Lab** (Enlight; successor to Capitalism II) covers manufacturing, retail, R&D, advertising and investing, with 70+ products and 40 semi-products in 25+ classes, up to 30 competitors and "a fluctuating and responsive economy". This is the developer's own description — [Capitalism Lab](https://capitalismlab.com). The developer also markets it as a microeconomics teaching tool — [Capitalism Lab guide](https://www.capitalismlab.com/?p=7614)

#### Production, tier and region loops
- **Anno 1800** has five resident tiers in the Old World (Farmers, Workers, Artisans, Engineers, Investors) and two in the New World (Jornaleros → Obreros). A tier upgrades once its needs are met — [Wikipedia](https://en.wikipedia.org/wiki/Anno_1800); [Anno 1800 Wiki](https://anno1800.fandom.com/wiki/Anno_1800)
- Anno 1800 is "at its core... a game about trade routes and production chains". Chains often span several islands that must be linked into a trade network, using a "slick system for automating trade routes". Reaching the Artisan tier unlocks the expedition to the New World. By the endgame the player runs several Old World towns plus New World colonies that trade with each other and with rivals — [GameRevolution](https://www.gamerevolution.com/review/532599-anno-1800-review); [Wayward Strategy](https://waywardstrategy.com/2020/01/16/anno-1800-review/); [Wikipedia](https://en.wikipedia.org/wiki/Anno_1800) (attribution approximate)
- **Anno 117: Pax Romana** (reviewed late 2025) sits in OpenCritic's 91st percentile. IGN gave it 9/10 ("a gorgeous antique city-builder"). Reviewers singled out a "fantastic, deep trade system". One 8/10 review called it "an incredibly rich historical strategy game that adapts to whatever the player needs it to be". The minor criticisms were campaign pacing and how long single-player stays interesting — [OpenCritic](https://opencritic.com/game/19134/-/reviews); [Ubisoft review roundup](https://news.ubisoft.com/en-au/article/5HjgMAmKyYeA3P0cj9802q/anno-117-pax-romana-review-roundup); [ETV Bharat review](https://www.etvbharat.com/en/technology/anno-117-pax-romana-review-enn25112204126)
- **Big Ambitions** comes from Hovgaard Games, the Danish studio behind Startup Company. It entered Early Access in 2023, reached 1.0 after about 3.5 years, and had a 91% positive Steam user score at 1.0 — [PCGamesN](https://www.pcgamesn.com/big-ambitions/1-0-tycoon-life-sim). Progression goes: work in your own shop, then hire and schedule staff, then manage warehouse stock, then match factory output to sales — [Prima Games](https://primagames.com/reviews/big-ambitions-review). The city is part of the management layer. You don't click "buy"; you drive to stores, buy items and haul them back — [GGRecon](https://www.ggrecon.com/articles/big-ambitions-early-hours/); [Prima Games](https://primagames.com/reviews/big-ambitions-review) (attribution approximate)
- **Production Line** (Positech) is pitched at "the efficiency geek". You progress by researching better methods and splitting large general-purpose production slots into smaller specialised ones ("the division of labor and the merits of purpose-built machinery") — [Steam store page](https://store.steampowered.com/app/591370/Production_Line/). It is rated "Very Positive" on Steam — [GameGeeker](https://gamegeeker.com/games/production-line-car-factory-simulation)
- **Two Point Hospital**: each hospital (level) can earn up to three stars. One star, from the first set of goals, unlocks the next hospital. More stars force deeper use of the systems, and players can return to old hospitals at any time — [Wikipedia](https://en.wikipedia.org/wiki/Two_Point_Hospital); [Hardcore Gamer](https://hardcoregamer.com/reviews/review-two-point-hospital/310988/)
- **Railroad Tycoon II** has an 18-scenario campaign. Each scenario's goals (connect named points, haul set cargo volumes, build a personal fortune) must be met by a date for bronze, with tighter deadlines for silver and gold — [Wikipedia](https://en.wikipedia.org/wiki/Railroad_Tycoon_II)
- **Mini Metro** (Dinosaur Polo Club, 2015, by brothers Peter and Robert Curry) began as a Ludum Dare game-jam entry on the theme "minimalism". The London Underground map was the visual model, and they chose abstract, procedural art because neither founder was an artist — [MCV/Develop](https://www.mcvuk.com/business-news/going-underground-the-story-of-dinosaur-polo-clubs-mini-metro/); [Pocket Tactics (GDC 2023)](https://www.pockettactics.com/mini-metro/london). The minimalism "was one of the things that made the game hard to make" — [Indieorama](https://www.indieorama.com/mini-metro-and-robert-curry-the-minimalism-was-one-of-the-things-that-made-the-game-hard-to-make)

#### Power as a problem generator (Factorio, Satisfactory, Oxygen Not Included)
- **Factorio solar** follows a fixed daily curve: full output for 50% of the day, a linear fall over 20%, zero for 10%, then a linear rise over the last 20%. A panel averages 42 kW over a day and needs 0.84 accumulators to hold constant output through the night. The community ratio is 21 accumulators per 25 panels — [Factorio forums](https://forums.factorio.com/viewtopic.php?p=356188); [Steam discussion](https://steamcommunity.com/app/427520/discussions/0/3820796493683242325) (attribution approximate)
- A Factorio accumulator holds 5 MJ but charges or discharges at most 300 kW, so at full draw it empties in about 16 s. Adding more panels does not charge it faster. Storage is therefore limited by both **energy** and **power** — [Steam discussion](https://steamcommunity.com/app/427520/discussions/0/3247565033764985920) (attribution approximate)
- Factorio uses power in a fixed order: solar first, then steam engines, then accumulators. At night it burns steam fuel before drawing on full accumulators — [Steam discussion](https://steamcommunity.com/app/427520/discussions/0/135514507323614391) (attribution approximate)
- The **"power death spiral"**: when power runs short, the electric drills mining coal for the boilers slow down, coal deliveries drop and power falls further. Laser turrets and bot networks are named as common triggers. Community fixes are self-fuelling burner inserters on the boilers and temporarily cutting the rest of the base off the power plant — [XGamingServer guide](https://xgamingserver.com/blog/power-management-in-factorio-a-comprehensive-guide/); [Steam discussion](https://steamcommunity.com/app/427520/discussions/0/715609968122793250)
- Factorio's **Space Age** expansion varies solar output by planet: Nauvis is 100% with a 420 s day/night cycle, Vulcanus 400% with a 90 s cycle — [Factorio forums](https://forums.factorio.com/viewtopic.php?p=631830)
- **Oxygen Not Included**: a wire is overloaded, and damaged, when the devices on it draw more than its rating, including when a battery discharges into it. Power Transformers split circuits (the small one supplies up to 1,000 W from an internal battery). The community rule is to keep consumer circuits under about 2 kW behind transformers and use heavy-watt wire for the generator backbone. A Smart Battery's automation signal can switch generators off when it is full and on when it is empty — [ONI wiki: Power Transformer](https://oxygennotincluded.wiki.gg/wiki/Power_Transformer); [Steam discussion](https://steamcommunity.com/app/457140/discussions/0/1628539187783867086) (attribution approximate)
- **Satisfactory**: when demand exceeds supply, the grid's fuse trips. The Priority Power Switch lets players put sub-grids into 8 priority groups that shut off in order (group 8 first, group 1 last) when a trip is about to happen. The wiki advises putting generators in group 1 — [Satisfactory wiki](https://satisfactory.wiki.gg/wiki/Priority_Power_Switch). A "blown fuse" state on an isolated sub-grid can spread and trip the whole network when it is reconnected — [Steam discussion](https://steamcommunity.com/app/526870/discussions/1/4845399746425459057)

### Inferences
*(My synthesis: design lessons for Gridmaster, each tied to the evidence above.)*
1. **Make the market the antagonist (Offworld).** Offworld's prices respond to every seller, so whatever everyone overproduces crashes in value. Real power markets do the same: under the merit-order effect, each MW of zero-marginal-cost solar the player adds pushes down the price in exactly the hours it produces. *(This is a premise from the energy domain; check it against the market-data research notes.)* If Gridmaster models this inside the simulation, it gets an Offworld-style self-correcting market for free, and batteries and geographic spread appear as *answers to a felt problem* rather than as arbitrary unlocks.
2. **Three nested loops.** (a) Minutes: forecast → dispatch, curtail or store → revenue. (b) Hours: site → permit → finance → build → connect. (c) Eras: the policy regime, the available tech and the market structure change. Turmoil shows that one tight yearly loop can carry a whole game. Anno and Two Point show that the large-scale loop has to keep changing the problem (see Q5 on Turmoil's repetitiveness).
3. **Tier gates should change the product, not just the numbers (Anno 1800).** Gridmaster's equivalent of Anno's population tiers would be market and regulatory tiers: self-consumption on a farm roof → feed-in-tariff projects → utility-scale auctions and PPAs → merchant plus balancing markets → cross-border trading and flexibility services → hydrogen/power-to-X offtake. Each tier adds a new "need" (a new revenue stream or a new risk) and a new production chain, as each Anno tier does.
4. **Do it yourself, then delegate (Big Ambitions, Production Line).** Early on, the player places a handful of panels and sells surplus by hand. Later they hire O&M crews, a trading desk and an auto-bidder. Late game, they set portfolio policies. Automation is itself the progression reward, and Big Ambitions shows this "from counter clerk to conglomerate" arc can earn 91% user approval.
5. **Treat regions like Anno's sessions and Factorio's planets.** Factorio's 100% vs 400% solar planets and Anno's Old World vs New World show that the same technology should be worth different amounts in different places. Each European bidding zone should differ in resource multipliers (sunshine, wind, hydro inflow), price shape, policy and grid congestion. Interconnectors play the role of Anno's automated trade routes.
6. **Power problems are content.**
   - Factorio's daily curve and 21:25 ratio show players enjoy sizing storage against a known curve.
   - Its 5 MJ / 300 kW accumulator teaches energy vs power (MWh vs MW) without a lecture.
   - Its death spiral and Satisfactory's fuse show that cascading failure followed by recovery (a black start) makes a memorable event.
   - ONI's wire limits and transformers map onto grid-connection capacity and congestion.
   - Satisfactory's priority groups map onto demand response and interruptible contracts.
   - ONI's smart-battery on/off thresholds map onto rule-based dispatch.
7. **Layer pass and mastery (Two Point stars, Railroad Tycoon II medals).** This is the cleanest way to be "casual but not too easy": one star means the scenario is finished, three stars means mastery under tighter deadlines or constraints.
8. **Use one readable abstraction (Mini Metro).** A schematic Europe map (zones, interconnectors, weather fronts) can carry a lot of simulation. Making a minimal UI is costly design work, not a shortcut.

### Gaps
- **Unverified leads** (background knowledge, not checked this session):
  - Mini Metro's weekly upgrade choice and its "a station overcrowds = game over" failure state.
  - Railroad Tycoon II's stock market (buying on margin, short selling, mergers and takeovers).
  - Railroad Tycoon 3's per-town supply-and-demand cargo prices.
  - Factorio machines running slower in proportion to power shortfall. The death-spiral sources imply this but don't state it.
  - Space Age solar multipliers for Gleba, Fulgora and Aquilo.
  - When Satisfactory added Power Storage and the Priority Power Switch.
  - Whether ONI batteries lose charge over time.
- **No usable sources retrieved** for Industry Giant II, Software Inc, the Workers & Resources core loop, the Cities: Skylines I loop, the OpenTTD/Transport Tycoon money loop, or Two Point Campus.
- For **Kapital: Sparks of Revolution**, the only find was a low-quality aggregator saying reviewers variously call it "a masterpiece of systems", call it "repetitive", or focus on performance — [GeekChamp](https://geekchamp.com/?p=632345). Treat it as unreliable.
- **Soren Johnson's Designer Notes** on OTC could not be fetched. Missing as a result: why the game moved from colony-specific prices to one shared market, how sharply prices react, and any GDC-level detail.

---

## 2. Using real history as structure (eras, tech unlocks, real events as scenarios, the step from real past to speculative future)

### Takeaway
History works best as a **timeline of rules** rather than a backdrop. Real dates gate technology (Transport Tycoon). Real chronology is kept even when names are fictional (Game Dev Tycoon). Real episodes become time-limited scenarios with tiered goals (Railroad Tycoon II). The smoothest way into the speculative future is to keep extending the same recognisable line (Transport Tycoon's monorail, maglev and "futuristic looking airplanes"), and to give each new technology teething problems.

### Cited Findings
- **Transport Tycoon (Deluxe)**: new vehicle models appear over the years and replace older ones. New models are generally better but may have reliability problems. Every vehicle has its own reliability, maintenance cost, speed, capacity and lifespan. Ageing vehicles break down more and cost more to maintain, so fleets have to be renewed — [Wikipedia: Transport Tycoon](https://en.wikipedia.org/wiki/Transport_Tycoon); [Transport Tycoon semi-FAQ](https://mail.transporttycoon.net/semifaq/ttfaq10.html) (attribution approximate)
- The Transport Tycoon timeline runs into a speculative future with new vehicle types: electric trains, monorail, maglev, "futuristic looking airplanes". Community documentation puts monorail around 1998 and maglev from about 2020 onwards — [Giant Bomb](https://www.giantbomb.com/games/3030-9515/); [semi-FAQ](https://mail.transporttycoon.net/semifaq/ttfaq10.html) (dates approximate)
- Transport Tycoon (MicroProse, 1994; Deluxe a year later) has been called "one of the most important simulation games ever made". Sawyer's successor, Locomotion, came out in 2004 — [Wikipedia: Chris Sawyer](https://en.wikipedia.org/wiki/Chris_Sawyer)
- **Game Dev Tycoon** (Greenheart Games) covers a player-chosen career of 25–35 years, starting at the dawn of the PC era — [Giant Bomb](https://giantbomb.com/wiki/Games/Game_Dev_Tycoon). The platform holders are parodies (Micronoft, Ninvento, Vonny, Grapple, Vena, KickIT, Govadore International). The platforms, from the PC and the G64 through to the Wuu, Playsystem 4, mPad and GrPad, launch in the same order as their real counterparts. The parody names avoid licensing — [Giant Bomb user article](https://giantbomb.com/users/5976/articles/my-game-development-career); [Steam discussion](https://steamcommunity.com/app/239820/discussions/0/864977564484544424); [Bearing News](https://bearingnews.org/256791/opinion/256791/) (attribution approximate). Critics place it in the line of MicroProse's Railroad Tycoon and RollerCoaster Tycoon — [Hardcore Gaming 101](https://www.hardcoregaming101.net/game-dev-tycoon/)
- **Railroad Tycoon II**'s campaign is a series of historical scenarios with medal goals and deadlines. For example, "Which Way To The Coast?" allows 40 years for the objective, and silver or gold requires doing it in 30 or 20 years. The final campaign score combines the difficulty level with the medals earned — [Wikipedia](https://en.wikipedia.org/wiki/Railroad_Tycoon_II); [Gamicus](https://gamicus.fandom.com/wiki/Railroad_Tycoon_II) (attribution approximate)
- **Railroad Tycoon 3** kept the format of themed historical scenarios with explicit win conditions — [StrategyWiki: "Go West!"](https://strategywiki.org/wiki/Railroad_Tycoon_3/Go_West!); [StrategyWiki: "The War Effort"](https://strategywiki.org/wiki/Railroad_Tycoon_3/The_War_Effort)
- **Anno**: Anno 1800 uses industrial-era social classes as its progression ladder (Q1). Anno 117 was praised as "an incredibly rich historical strategy game that adapts to whatever the player needs it to be" — [Ubisoft review roundup](https://news.ubisoft.com/en-au/article/5HjgMAmKyYeA3P0cj9802q/anno-117-pax-romana-review-roundup)

### Inferences
1. **Gate tech by date and give it teething problems (Transport Tycoon).** Gridmaster can introduce each technology generation in its historical year (small 1990s turbines → multi-MW → offshore; costly early PV → cheap PV; Li-ion arrives once price volatility makes it pay). Each new model should carry a reliability or performance penalty that eases as the fleet gains experience. That mirrors Transport Tycoon's "new models may suffer reliability issues", and it is also realistic.
2. **Ageing and replacement cycles (Transport Tycoon).** Panel degradation, turbine wear and subsidy expiry lead to repower-or-retire decisions. This gives a realistic money sink in the mid and late game (Q4).
3. **Keep the chronology, fictionalise the brands (Game Dev Tycoon).** Gridmaster can follow real policy and tech chronology (the feed-in-tariff era, the auction era, the storage era) while using fictional equipment makers, utilities and grid operators to avoid licensing. For a mature audience, plausible fictional names will likely suit better than Game Dev Tycoon-style puns. That is a judgement call; no evidence was found either way.
4. **Turn real events into time-limited scenarios with medals (Railroad Tycoon II).** Candidate scenarios, all of which need their own verification: Danish wind pioneers in the 1990s; the German feed-in boom of the 2000s; negative prices and solar cannibalisation in the 2010s; post-Fukushima nuclear phase-out decisions in 2011; the 2021–22 European gas and price crisis; grid-stability events. Each can use a bronze/silver/gold deadline ladder like "Which Way To The Coast?".
5. **Bridge into the future along the same line (Transport Tycoon's monorail and maglev).** Gridmaster's experimental tech (cryogenic storage, wave power, power-to-X) should arrive as "the next model", not as a sci-fi jump: low-reliability, costly, small-scale prototypes that improve with deployment. After the present day (2026), let players choose between a scripted "historical continuation" and seeded "alternate history" so the future is not fixed.
6. **History should change the best strategy, not just the scenery.** This follows from the repetitiveness complaints in Q5/Q6 (Turmoil, Rise of Industry). If the 1990s, 2000s, 2010s and 2020s all reward the same build order, history is just a skin.

### Gaps
- **Unverified leads:**
  - Civilization VI: Gathering Storm (2019) reportedly added electricity and power plants, CO2-driven climate change and sea-level rise, nuclear accidents, and renewable buildings (solar, wind, offshore wind, geothermal). That is probably the closest big-budget precedent for an energy mix with consequences in a history-structured game, and it deserves its own check.
  - Civilization's "Future Era / Future Tech".
  - Transport Fever 2's start dates from 1850 with era-appropriate vehicles.
  - Workers & Resources' period-accurate Eastern Bloc vehicles and choice of start year.
  - OpenTTD's "vehicles never expire" option.
  - What Game Dev Tycoon does once real console history runs out.
  - Victoria 3's 1836–1936 span.
  - Whether Game Dev Tycoon was first released in Dec 2012 or Apr 2013. Sources conflict, so no date is stated above.
- No source was found on how players react to scripted real events, for example whether knowing a historical price spike in advance counts as an exploit. See Q5.

---

## 3. Realism vs fun (welcome complexity vs tedium, surfacing deep simulation through UI, layering, onboarding, automation)

### Takeaway
Players reward deep simulation when three things hold: (a) what the UI shows is what the simulation actually uses; (b) routine work automates as the player scales up; (c) the depth is layered or can be switched on and off. Games are punished for fake or opaque depth (Cities: Skylines II, SimCity 2013), for depth with no onboarding (Workers & Resources), and for simplification that removes the decisions (Anno 2205, Transport Fever 2).

### Cited Findings

#### When the simulation isn't what it claims to be
- **Cities: Skylines II**: Colossal Order CEO Mariina Hallikainen said, "At release, the economy did not meet the quality standard we strive for and I apologize for the frustration this has caused." Problems with money, exports and land value continued after launch. Mods rebalance imports, exports and building profitability — [PCGamesN](https://www.pcgamesn.com/cities-skylines-2/broken-economy)
- Community testing found numbers, graphs and features in CS2's UI that "don't actually correlate to existing parts of the simulation" — [Lemmy thread](https://lemm.ee/comment/7041491)
- Steam review themes (AI summary): the economy is unrealistic and shallow, swings unpredictably, gives little meaningful feedback and needs mods to work properly — [VaporLens](https://vaporlens.app/app/949230/cities_skylines_ii). Example bug: city services imported from outside connections even when storage companies inside the city held the goods — [Steam discussion](https://steamcommunity.com/app/949230/discussions/0/3877095833484753236) (attribution approximate)
- **SimCity (2013)**'s GlassBox engine simulated individual citizens — [Giant Bomb](https://giantbomb.com/wiki/Games/SimCity_2013). These agents took the shortest route rather than the quickest and ignored congestion, which caused mass gridlock; Maxis promised "additional fixes with the pathing" — [GameWatcher](https://www.gamewatcher.com/2013-15-03-maxis-begins-turning-attention-to-improving-the-simulation-in-simcity). Creative director Ocean Quigley defended the small city plots as a fidelity trade-off: "it's better to make cities with dense activity and visual detail over cities that are sprawling, but low resolution and inert" — [PC Gamer](https://pcgamer.com/sim-city-size-restriction-explained). One critic said it could be renamed "TrafficPlanner", since about 90% of play is spent on the road system — [Scientific Gamer](https://scientificgamer.com/thoughts-simcity/); [PCWorld](https://www.pcworld.com/article/457152/review-simcity-rebuilds-the-sandbox.html) (attribution approximate)

#### When the depth is real but the player has to babysit it
- **Victoria 3**: PC Gamer said the economic systems pushed players into real-world strategies, and Eurogamer called the economic simulation "utterly absorbing". Kotaku disliked the economic micromanagement, and a recurring criticism was "too little concrete gameplay", with play revolving around watching graphs and bars grow. IGN called the wars "very fiddly and confusing" — [Wikipedia](https://en.wikipedia.org/wiki/Victoria_3)
- A reviewer complained that the economy "won't move unless you do", so you keep stopping to fix it, like a general interrupting war planning because fish demand is high — [Wargamer](https://www.wargamer.com/victoria-3/review); [ItemLevel](https://itemlevel.net/victoria-3-review-simplified-complexity/) (attribution approximate)
- German press praised it while Steam players were split — [GameStar](https://www.gamestar.de/artikel/victoria-3-presse-bejubelt-fans-steam-uneinig,3386027.html)
- **Paradox's fix**: Patch 1.2 added "Autonomous Investment". With that game rule switched on, the population automatically starts private construction projects using money in the investment pool — [Paradox Dev Diary #78 (1.2 changelog)](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-78-update-1-2-changelog); [Dev Diary #71 forum thread](https://admin-forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-71-autonomous-investment-in-1-2.1565414/page-10)

#### When the depth is real but there's no way in
- **Workers & Resources: Soviet Republic** is about 90% positive on Steam, yet it is billed as "not for beginners" and "the Dark Souls of city builders" — [Notebookcheck](https://www.notebookcheck.net/Not-for-beginners-Complex-city-builder-90-positive-drops-below-10-on-Steam.1342440.0.html); [Notebookcheck (RU)](https://www.notebookcheck-ru.com/The-Dark-Souls-of-City-Builders-cena-na-ehtu-slozhnuju-strategicheskuju-igru-v-Steam-opustilas-nizhe-10-dollarov.1379484.0.html). The "drops below 10" in the English headline means the sale price fell under $10, according to the Russian edition's headline. It does not mean the reviews collapsed.
- Steam review themes (AI summary): the steep learning curve, missing onboarding, flood of UI information and late-game performance problems "stack up into a wall" that turns many players away — [VaporLens](https://vaporlens.app/app/784150/workers_resources_soviet_republic). Players report spending about 12 hours on YouTube and forums just to learn the basics — [Lemmy](https://lemm.ee/post/3040508); [Steam discussion](https://steamcommunity.com/app/784150/discussions/0/4029096129883500876) (attribution approximate)
- W&R's realistic mode is "anything but chill", and some players never get past the early money hump. But each aspect can be switched separately: infinite money, simplified electricity, housing built instantly — [Galaxus](https://galaxus.fr/en/page/i-rule-over-my-own-soviet-nation-in-workers-resources-soviet-republic-33630)
- German coverage describes a cumbersome UI and tutorials that don't explain every system. It calls the game considerably more demanding than Cities: Skylines or SimCity and aimed at players who enjoy intensive micromanagement — [GIGA](https://www.giga.de/games/75-prozent-sparen-steam-bietet-einzigartige-aufbau-sim-zum-tiefpreis-an--01J5QXYRRHDTKKN2XTNPSC5PGB)

#### When simplification removes the decisions
- **Anno 2205** "isn't a very challenging game", with every resource "inexhaustible, or close to it" — [GameSpot](https://www.gamespot.com/reviews/anno-2205-review/1900-6416317/); [PC Gamer](https://www.pcgamer.com/anno-2205-review) (attribution approximate). Players likened it to "an Anno version of Civilization Revolution" — [Quarter to Three forum](https://forum.quartertothree.com/t/anno-1800-city-building-in-the-industrial-revolution/131265?page=59) (attribution approximate)
- **Transport Fever 2**: players call the economy "noob proof": you build lines, deliver anything and collect the cash — [Steam discussion](https://steamcommunity.com/app/1066780/discussions/0/4625853071149245248). One review's verdict was "Very pretty, too easy" — [Dedoimedo](https://www.dedoimedo.com/games/transport-fever-2.html). Another warned that the new demand and production mechanics "may annoy" experienced players — [TheSixthAxis](https://www.thesixthaxis.com/2020/01/13/transport-fever-2-review/)

#### Automation and abstraction that players liked
- Anno 1800's "slick system for automating trade routes" between islands and regions — [GameRevolution](https://www.gamerevolution.com/review/532599-anno-1800-review)
- Big Ambitions: players praise its "great interface" and its level of execution for an Early Access game — [Gamepressure](https://www.gamepressure.com/S013-amp.asp?ID=21074). Its hands-on errands give way to staff, warehouses and factories — [Prima Games](https://primagames.com/reviews/big-ambitions-review)
- Mini Metro's deliberately abstract, transit-map presentation — [MCV/Develop](https://www.mcvuk.com/business-news/going-underground-the-story-of-dinosaur-polo-clubs-mini-metro/)
- Factorio's clean, solvable ratios (21 accumulators to 25 panels) — [Factorio forums](https://forums.factorio.com/viewtopic.php?p=356188)

### Inferences
1. **The "truthful glass box" rule (Cities: Skylines II).** Every number on screen must come from the simulation and be explainable on hover. For example, "why did my solar farm earn €31/MWh?" should break down into wholesale price, cannibalisation, curtailment and imbalance cost. A mature, numerate audience will test this; CS2 shows communities expose fake numbers quickly and the damage to reputation lasts (Q6).
2. **Simulate aggregates, not individual electrons (SimCity 2013).** Clear the market per bidding zone and time step (merit order), with zone-to-zone transmission limits. Avoid agent-level or per-household simulation: SimCity shows it caps the scale and produces visible pathologies (shortest-path gridlock) that become the whole game ("TrafficPlanner").
3. **Automate the routine, keep the strategic (Victoria 3 patch 1.2, Anno trade routes, ONI smart battery).** Dispatch and bidding should run automatically on player-written policies (price thresholds, how much to hedge, risk appetite). That frees attention for siting, hedging, portfolio shape and policy shocks. This avoids Victoria 3's "won't move unless you do".
4. **Make realism switchable in modules (W&R toggles).** For example: permitting delays, forecast error, grid-connection queues, degradation, imbalance penalties, interest-rate eras. Bundle them into presets such as "Casual / Realistic / Analyst". W&R shows a game can stay about 90% positive with brutal realism if players are allowed to switch parts of it off.
5. **Onboarding is a feature (W&R's cautionary tale).** Gridmaster's planned "a few solar panels" start is a natural tutorial: one asset, one market, one weather variable. Add one complication per milestone, the way each Two Point level adds a mechanic.
6. **Don't simplify away the tension (Anno 2205, Transport Fever 2).** Limited good sites, limited grid capacity, real weather variation and price risk *are* the decisions. Removing them for accessibility produces "noob proof" and "not very challenging".
7. **Hands-on early, abstract later (Big Ambitions).** Early site visits, surveys or inspections can be literal actions, which later turn into reports and KPIs.

### Gaps
- No fetched sources on specific UI devices (data overlays and heatmaps, nested tooltips, advisors, notification design) in Cities: Skylines, Victoria 3, Factorio or Two Point. Treat UI-pattern recommendations as design judgement unless another researcher sources them.
- Not retrievable: what CS2's later economy patches ("Economy 2.0") changed, and whether review sentiment recovered.
- **Unverified lead:** a "1.6 Free Market Construction" Victoria 3 result appeared in search, but its URL is a Steam Workshop changelog, so it is probably a mod, not an official patch. Do not cite it as official.

---

## 4. Challenge and difficulty (rivals, loans, bankruptcy, goals, events, crashes, difficulty settings) and how to avoid the late-game snowball where money stops mattering

### Takeaway
Snowballing happens when income grows with size but costs and threats don't: Transport Fever 2's flat operating costs, Anno 2205's inexhaustible resources and missing rivals. Documented fixes:
- upkeep that grows faster than linearly with size (OpenTTD infrastructure maintenance);
- ageing assets (Transport Tycoon);
- rivals who can buy you out when you are over-leveraged (Offworld);
- deadlines and tiered goals (Railroad Tycoon II, Two Point);
- catastrophes the player can recover from (Factorio, Satisfactory);
- moving the measure of success away from money (Megaquarium, according to players).

### Cited Findings
- **OpenTTD "infrastructure maintenance"** is an opt-in setting under Settings → Accounting. Maintenance costs grow faster than linearly with network size; the community wiki says "exponentially", so large companies are hit harder. Size counts track and road pieces and their complexity: rail pieces per tile are modelled as n², and tunnel pieces count ×8 for road and ×4 for rail. Dense networks full of junctions cost more than spread-out ones. In the late game, short connections can lose money even when the finance report shows income — [OpenTTD wiki](https://wiki.openttd.org/en/Archive/Community/Infrastructure%20maintenance)
- **Transport Tycoon**: ageing vehicles break down more and cost more to maintain, which forces fleet renewal — [Wikipedia](https://en.wikipedia.org/wiki/Transport_Tycoon)
- **Transport Fever 2**:
  - Operating costs never rise, so profitable lines stay profitable "forever without ever touching them again".
  - Players say "once you start turning a profit it just gets bigger and bigger and all difficulty goes out the window", with nothing to do beyond "feed town make go bigger".
  - Some players believe the economy was made easier because people complained Transport Fever 1 was too hard. This is player speculation.
  - Sources: [Steam discussion](https://steamcommunity.com/app/1066780/discussions/0/3963662507768894840); [Steam discussion](https://steamcommunity.com/app/1066780/discussions/0/4625853071149245248) (attribution approximate)
- **Anno 2205**: players missed same-map competition and the "race" to get somewhere first, which earlier Anno games had. Its NPC corporations offer no meaningful competition on shared maps — [Steam discussion](https://steamcommunity.com/app/916440/discussions/0/3022387599798548347) (attribution approximate). Combine this with its inexhaustible resources (Q3).
- **Offworld**: inputs you don't produce are bought on debt, debt lowers your share price, and a lower share price invites a takeover — [GameSpot](https://gamespot.com/reviews/offworld-trading-company-review/1900-6416420/); [Gameranx](https://gameranx.com/features/id/49930/article/offworld-trading-company-review-cutthroat-capitalism-at-its-finest/) (attribution approximate)
- **Turmoil**: a race against NPC rivals for land and for control of the town — [SLUG Magazine](https://www.slugmag.com/community/reviews/game-reviews/review-turmoil/)
- **Railroad Tycoon II**: medals with deadlines, and a campaign score weighted by difficulty — [Wikipedia](https://en.wikipedia.org/wiki/Railroad_Tycoon_II). **Two Point Hospital**: extra stars force players "to get creative" — [Hardcore Gamer](https://hardcoregamer.com/reviews/review-two-point-hospital/310988/)
- **Community diagnosis of the genre's late game:**
  - Business tycoons often have "no other motivation beyond the making of money", which players can usually achieve within about an hour — [Steam discussion (app 362620, apparently Software Inc's forum)](https://steamcommunity.com/app/362620/discussions/0/3117024613289520969) (attribution approximate)
  - "Once you'd bought every building, the game stopped giving you anything new to want" — [itch.io](https://itch.io/post/10035758) (attribution approximate)
  - Mad Games Tycoon players: you eventually have so much money that nothing is a problem any more — [Steam (Mad Games Tycoon)](https://steamcommunity.com/app/341000/discussions/0/537402115077827163)
- **Remedies players propose:**
  - Events that sharply cut passive income, and recurring costs on assets you already own (maintenance, repairs, bills, even robberies) — [Steam (Mad Games Tycoon 2)](https://steamcommunity.com/app/1342330/discussions/0/3192493519700283368) (attribution approximate)
  - Megaquarium as a model: money is tight early, research is the mid-game focus, and the late game is about keeping prestige — [itch.io](https://itch.io/post/15852194) (attribution approximate)
- **Catastrophes the player can recover from:** Factorio's power death spiral and Satisfactory's grid-wide fuse trips with priority load-shedding (Q1 sources).

### Inferences
*An anti-snowball toolkit for Gridmaster:*
1. **Price cannibalisation inside the simulation (Offworld).** The more of one technology the player (and rivals) own in a zone, the lower the price it captures. The "solar spam" strategy defeats itself, as Offworld's overproduced resources do. *(This is an energy-domain premise; check it with the market-data notes.)*
2. **System costs that grow faster than linearly (OpenTTD).** Grid-connection fees, balancing responsibility and congestion/curtailment should rise with how densely the player has built in one zone. That pushes them to spread geographically, which is exactly the European diversification play Gridmaster intends. It mirrors OpenTTD penalising dense networks.
3. **Ageing (Transport Tycoon).** Degradation, rising O&M and subsidy or contract expiry lead to repower-or-retire decisions. Do not ship Transport Fever 2's "operating costs don't increase".
4. **Rivals and takeovers (Offworld, Turmoil; avoid Anno 2205).** AI utilities and investment funds should bid for the same sites, auctions and grid-connection slots. Leverage should lower your valuation and invite takeover bids. Offworld's link from debt to share price to takeover is richer than a simple "bankruptcy at €0" wall.
5. **A new type of problem each era (Anno tiers, Two Point levels).** For example: permits and finance in the 1990s, subsidy-boom saturation in the 2000s, negative prices and cannibalisation in the 2010s, volatility and storage in the 2020s, flexibility, hydrogen and grid stability in the 2030s and later.
6. **Move the measure of success away from money (Megaquarium, per players).** Use reputation and social licence (which gate planning approvals), share of decarbonisation, a system-stability score, and endgame prestige goals such as "keep a country's lights on through a two-week wind lull".
7. **Deadlines and stars (Railroad Tycoon II, Two Point).** Medal ladders keep pressure on even when the player is rich: the question becomes *how fast*, not *whether*.
8. **Catastrophe followed by recovery (Factorio, Satisfactory).** Grid emergencies that need black-start capacity and priority load-shedding make memorable events, and they punish over-optimised, fragile portfolios.
9. **Difficulty presets should change systems, not just multipliers (W&R).** On "Realistic", forecast error and imbalance penalties are on; on "Casual", forecasts are perfect.
10. **Interest-rate eras as a historical difficulty driver.** Energy projects need a lot of up-front capital and are sensitive to interest rates, so a low-rate 2010s and a post-2022 rate rise could change the difficulty historically. *(Domain premise; verify. It extends Offworld's debt mechanic.)*

### Gaps
- **Unverified leads:**
  - Railroad Tycoon II's bonds, interest and bankruptcy rules.
  - How Capitalism Lab's AI competitors behave.
  - Two Point's disasters and epidemics.
  - OpenTTD's inflation setting.
  - Offworld's Black Market sabotage items (e.g., EMP, pirates, mutiny) as catch-up tools.
  - Anno 1800's AI rival personalities and difficulty presets.
- No designer-side source (postmortem or GDC talk) on anti-snowball design could be retrieved. All evidence above comes from press and players.

---

## 5. "Optimal playstyle" and dominant strategies; sandbox vs campaign vs scenarios vs challenges; time controls; session length; replayability

### Takeaway
Players will find the best strategy and exploit it. The games that last either make that best strategy shift (Offworld's player-driven prices) or let players change the rules (OpenTTD settings, W&R toggles). Procedurally generated levels alone do not create replayability if the winning strategy never changes (Turmoil, Rise of Industry). Short, self-contained matches or levels sit comfortably alongside long sandboxes: Offworld matches often under 30 minutes, Turmoil's one year per level, Two Point's per-hospital stars.

### Cited Findings
- **Turmoil**: levels are randomly generated, but "the basic strategy never really changing", and once the details are discovered the game becomes less satisfying — [Tech-Gaming](https://www.tech-gaming.com/turmoil/); [HonestGamers](https://www.honestgamers.com/14763/switch/turmoil/review.html); [SLUG Magazine](https://www.slugmag.com/community/reviews/game-reviews/review-turmoil/) (attribution approximate). The same coverage says "it's easy to get caught up in playing the levels and lose track of time". The core loop hooks players; it is the variety that runs out.
- **Rise of Industry / Rise of Industry 2** (RoI2 reviewed November 2025): "once you have built one production lot, all you can do is build another one", and network management is mostly menu buttons — [TheXboxHub (RoI2)](https://www.thexboxhub.com/rise-of-industry-2-review/); [TheSixthAxis (RoI2)](https://www.thesixthaxis.com/2025/11/05/rise-of-industry-2-review/) (attribution approximate; the snippet doesn't make clear which game or review this is). Steam themes for the first game: the loop becomes repetitive within a few hours, with no meaningful progression or interesting challenges after the initial setup — [VaporLens](https://vaporlens.app/app/671440/rise_of_industry)
- **Transport Fever 2**'s winning approach is "just build lines, deliver anything you want, and get the cash" — [Steam discussion](https://steamcommunity.com/app/1066780/discussions/0/4625853071149245248)
- **Offworld**'s market reacts to all players' buying and selling (Q1) — [Giant Bomb](https://giantbomb.com/wiki/Games/Offworld_Trading_Company). Matches mostly last under an hour, and many under 30 minutes — [Gameranx](https://gameranx.com/features/id/49930/article/offworld-trading-company-review-cutthroat-capitalism-at-its-finest/); [GameSpot](https://gamespot.com/reviews/offworld-trading-company-review/1900-6416420/) (attribution approximate)
- **Session units:**
  - Turmoil: one level is one in-game year on one plot — [Wikipedia](https://en.wikipedia.org/wiki/Turmoil_%282016_video_game%29)
  - Two Point: replay old hospitals for extra stars — [Hardcore Gamer](https://hardcoregamer.com/reviews/review-two-point-hospital/310988/)
  - Railroad Tycoon II: medal tiers and a campaign score weighted by difficulty — [Wikipedia](https://en.wikipedia.org/wiki/Railroad_Tycoon_II)
- **Rules the player controls:**
  - W&R lets players switch individual challenges on or off — [Galaxus](https://galaxus.fr/en/page/i-rule-over-my-own-soviet-nation-in-workers-resources-soviet-republic-33630)
  - OpenTTD's anti-snowball maintenance rule is opt-in — [OpenTTD wiki](https://wiki.openttd.org/en/Archive/Community/Infrastructure%20maintenance)
- **Solved systems become recipes:** the Factorio community worked out an exact optimal solar-to-accumulator ratio (21:25) — [Factorio forums](https://forums.factorio.com/viewtopic.php?p=356188)
- **Mods as a crutch:** CS2 players rely on mods to rebalance its economy — [PCGamesN](https://www.pcgamesn.com/cities-skylines-2/broken-economy). Development of Cities: Skylines II moves to Paradox's Iceflake Studios from the start of 2026 — [Paradox](https://www.paradoxinteractive.com/games/cities-skylines-ii/news/an-update-on-cities-skylines-ii); [CGMagazine](https://www.cgmagonline.com/news/cities-skylines-iceflake-studios/)
- **Anno 117** is praised for replayability and for adapting "to whatever the player needs it to be", with reservations about how long single-player stays interesting — [Ubisoft review roundup](https://news.ubisoft.com/en-au/article/5HjgMAmKyYeA3P0cj9802q/anno-117-pax-romana-review-roundup); [OpenCritic](https://opencritic.com/game/19134/-/reviews)

### Inferences
1. **Make the best strategy move.** Three things will keep shifting what the "best" asset is over time and place: cannibalisation inside the simulation, era changes in policy (feed-in tariffs → auctions → merchant markets → capacity and flexibility markets), and differences between zones. That is the fix for Turmoil's "same strategy every level".
2. **Degenerate strategies to expect in Gridmaster, with counters:**
   - *Solar spam in the sunniest zone.* Counter with capture-price cannibalisation, curtailment and grid-connection queues.
   - *Battery arbitrage as a money printer when price curves are predictable.* Counter with forecast uncertainty, wear per charge cycle, and price spreads that shrink as storage fleets grow (Offworld-like, inside the simulation).
   - *Build once, earn forever (Transport Fever 2).* Counter with degradation, rising O&M and subsidy expiry.
   - *Historical foreknowledge* (the player knows when the 2022 price spike hits). Counter with randomised timing and size of events outside the strict campaign, plus seeded "alternate history" runs.
   - *Correlation tuning.* Perfectly correlated markets make spreading out pointless, and fully independent ones make it trivially safe. Tune weather and price correlations (e.g., Europe-wide wind lulls) so spreading out is valuable but not free.
   - *Leverage loops (borrow cheap, buy everything).* Counter with Offworld-style debt → valuation → takeover risk, plus interest-rate eras.
3. **Modes:**
   - A historical campaign from the 1990s to the present, with medals per chapter, continuing into a speculative future.
   - Standalone crisis scenarios, Railroad Tycoon II style.
   - A sandbox with W&R-style per-system toggles.
   - Challenge or ironman runs.
   - Possibly seeded "weather year" challenges with leaderboards (unverified lead: Mini Metro's daily challenges).
4. **Time controls and session shape.** Pause plus several speeds is the genre baseline (unverified here). The harder problem is the mismatch between timescales: the campaign spans decades, while markets clear hourly or faster. Two answers: (a) automatic dispatch run by player policies; (b) optional "zoom-in" set pieces for critical weeks (a heatwave, a winter wind lull) that are played at hourly resolution. An annual report gives a natural checkpoint for each session, like Turmoil's year per level and its "lose track of time" pull.
5. **Replayability.** Procedural variety has to change strategy, not just layout (Turmoil, Rise of Industry). Seeded weather years and price paths help. Data-driven tech and market definitions allow modding, but never ship a simulation that *needs* mods to work (CS2).

### Gaps
- **Unverified leads:**
  - Mini Metro's daily challenge, leaderboards and endless/creative modes.
  - Paradox-style pause plus five speeds.
  - Factorio map seeds and mod portal.
  - OpenTTD's NewGRF content and BaNaNaS download service.
  - The scale of Cities: Skylines I's Steam Workshop.
  - Stock-market exploits in Railroad Tycoon II.
  - Game Dev Tycoon's hidden genre/topic ratings, which players reportedly solved together.
  - Two Point's sandbox mode.
  - Offworld's daily challenge.
- No sourced data on typical session lengths for long-form simulators (Anno, Factorio, W&R) or on median Steam playtime.

---

## 6. Common negative-review themes in the genre (shallow late game, opaque economy, bad UI, performance, lack of goals, too easy/too hard)

### Takeaway
Complaints cluster into six themes:
1. a repetitive or empty late game;
2. an economy that is opaque, fake or broken;
3. passive "watch the numbers" play, or forced chores;
4. too easy (money stops mattering), or too hard without onboarding;
5. UI and performance problems;
6. no goals.

An unfinished economy at launch can damage a franchise for years (Cities: Skylines II). Harsh difficulty, by contrast, is forgiven by a loyal niche if the depth is genuine (W&R, about 90% positive).

### Cited Findings
- **Repetitive or empty late game:**
  - Rise of Industry (and RoI2): "once you have built one production lot, all you can do is build another one"; Steam reviews report boredom within a few hours — [VaporLens](https://vaporlens.app/app/671440/rise_of_industry); [TheXboxHub](https://www.thexboxhub.com/rise-of-industry-2-review/) (attribution approximate)
  - Turmoil: "too repetitive", with the same basic strategy every level — [Tech-Gaming](https://www.tech-gaming.com/turmoil/) (attribution approximate)
- **Opaque, fake or broken economy:**
  - CS2: developer apology, UI graphs that don't match the simulation, mods needed to fix it — [PCGamesN](https://www.pcgamesn.com/cities-skylines-2/broken-economy); [Lemmy](https://lemm.ee/comment/7041491); [VaporLens](https://vaporlens.app/app/949230/cities_skylines_ii)
  - SimCity 2013: gridlock from shortest-path agents — [GameWatcher](https://www.gamewatcher.com/2013-15-03-maxis-begins-turning-attention-to-improving-the-simulation-in-simcity)
- **What it cost CS2:** Paradox and Colossal Order ended their partnership on the game, and Iceflake Studios (Surviving the Aftermath) takes over all Cities: Skylines II development from the start of 2026. This follows "a very rocky launch for the game in 2023, and two years of challenges with patches and DLC content" — [Screenhub](https://www.screenhub.com.au/news/games/cities-skylines-2-take-over-iceflake-2686597/); [CGMagazine](https://www.cgmagonline.com/news/cities-skylines-iceflake-studios/); [TheSixthAxis](https://www.thesixthaxis.com/2025/11/17/paradox-and-colossal-order-split-cities-skylines-2-development-moves-to-iceflake-studios/)
- **Passive play and forced chores:**
  - Victoria 3: "too little concrete gameplay", watching graphs and bars grow, and an economy that "won't move unless you do" — [Wikipedia](https://en.wikipedia.org/wiki/Victoria_3); [Wargamer](https://www.wargamer.com/victoria-3/review) (attribution approximate)
  - Critics and Steam players diverged — [GameStar](https://www.gamestar.de/artikel/victoria-3-presse-bejubelt-fans-steam-uneinig,3386027.html)
- **Too easy, or money stops mattering:**
  - Transport Fever 2: "Very pretty, too easy"; "all difficulty goes out the window" — [Dedoimedo](https://www.dedoimedo.com/games/transport-fever-2.html); [Steam discussion](https://steamcommunity.com/app/1066780/discussions/0/3963662507768894840)
  - Anno 2205: inexhaustible resources and no real rivals — [GameSpot](https://www.gamespot.com/reviews/anno-2205-review/1900-6416317/); [Steam discussion](https://steamcommunity.com/app/916440/discussions/0/3022387599798548347) (attribution approximate)
  - Mad Games Tycoon: so much money that nothing matters — [Steam](https://steamcommunity.com/app/341000/discussions/0/537402115077827163)
- **Too hard, poor onboarding, UI overload, late-game performance:**
  - W&R — [VaporLens](https://vaporlens.app/app/784150/workers_resources_soviet_republic); [GIGA](https://www.giga.de/games/75-prozent-sparen-steam-bietet-einzigartige-aufbau-sim-zum-tiefpreis-an--01J5QXYRRHDTKKN2XTNPSC5PGB); [Lemmy](https://lemm.ee/post/3040508)
  - SimCity 2013 visibly shrank its map size to protect simulation fidelity and performance — [PC Gamer](https://pcgamer.com/sim-city-size-restriction-explained)
- **No goals:**
  - "No other motivation beyond the making of money" — [Steam discussion (app 362620)](https://steamcommunity.com/app/362620/discussions/0/3117024613289520969) (attribution approximate)
  - "Stopped giving you anything new to want" — [itch.io](https://itch.io/post/10035758) (attribution approximate)
- **Counter-examples (what good looks like):**
  - Big Ambitions: 91% user score at 1.0 after a long Early Access — [PCGamesN](https://www.pcgamesn.com/big-ambitions/1-0-tycoon-life-sim)
  - Anno 117: 91st percentile on OpenCritic — [OpenCritic](https://opencritic.com/game/19134/-/reviews)
  - Production Line: "Very Positive" — [GameGeeker](https://gamegeeker.com/games/production-line-car-factory-simulation)
  - W&R: about 90% positive despite (or because of) its difficulty — [Notebookcheck](https://www.notebookcheck.net/Not-for-beginners-Complex-city-builder-90-positive-drops-below-10-on-Steam.1342440.0.html)

### Inferences

**Pre-launch checklist for Gridmaster** (each line answers one complaint theme above):
1. *Late game:* each era must add a new type of problem, and there must be at least three anti-snowball forces at once: cannibalisation, ageing, and rivals or system costs. Playtest specifically at hours 20, 40 and 80 for "money stopped mattering".
2. *Economy:* every displayed figure is computed and has a breakdown on hover. Run community-style audits internally before launch (CS2).
3. *Chores:* every repeated action can be automated through a player-set policy (Victoria 3 patch 1.2, Anno trade routes).
4. *Difficulty:* presets that switch systems, plus per-system toggles (W&R), plus star or medal goals (Two Point, Railroad Tycoon II). Avoid "noob proof" (Transport Fever 2) and "Dark Souls with no tutorial" (W&R) at the same time.
5. *Onboarding:* grow complexity from the "few solar panels" start, adding one system per milestone.
6. *Performance:* an aggregate market simulation (not agents) sized for the late game: hundreds of assets, 25 or more zones, sub-daily steps, several decades. W&R's late-game performance and SimCity's shrunken maps show what happens when this is skipped.
7. *Goals:* campaign medals, scenario deadlines and endgame objectives that are not money-based.
8. *Launch:* do not ship the economy unfinished (CS2). Early Access can work when the core loop is already strong (Big Ambitions: Early Access 2023, then 1.0 at 91%).
9. *Audience split:* press and Steam players judge differently (Victoria 3). Steam reviews reflect 50+ hour play, so optimise for the long-run experience, not the first-hour impression.

**Cross-cutting synthesis (strongest-evidenced lessons first):**
- (a) Let the market fight back: endogenous prices, Offworld-style. This doubles as the main anti-snowball and anti-degenerate-strategy device.
- (b) Never show a number the simulation doesn't use (CS2).
- (c) Costs, ageing and rivals must grow with the player (OpenTTD, Transport Tycoon, Offworld). Flat costs kill the late game (Transport Fever 2, Anno 2205).
- (d) Automate chores as the player scales (Victoria 3, Anno, Big Ambitions).
- (e) Layer pass vs mastery goals (Two Point, Railroad Tycoon II).
- (f) Make realism modular, but put real effort into onboarding (W&R).
- (g) Each era and region must change the best strategy, not just the scenery (Turmoil, Rise of Industry, Factorio planets, Anno regions).
- (h) Power-system failure modes (Factorio death spiral, Satisfactory fuses, ONI overloads) are proven sources of memorable, recoverable drama, and they map almost one-to-one onto real grid problems.

### Gaps
- No measured frequency of review themes across the genre: VaporLens and SteamDB pages could not be fetched.
- No Steam review data retrieved for Kapital: Sparks of Revolution, Industry Giant II, Software Inc, Capitalism Lab or Two Point Campus. Their negative-review themes are unknown here.
- Not retrievable: the Rise of Industry 2 review verdicts and scores, and whether Victoria 3's or CS2's Steam sentiment has since recovered.
- Real-world energy-system premises used in the inferences are out of scope for this note and should be checked against the energy and market-data research notes: merit-order effect, solar cannibalisation, negative prices, the 2021–22 crisis, interest-rate sensitivity, grid-stability events.
