# Claim the empty energy-market tycoon slot

**No verified game turns Europe's wholesale electricity market into play.** That holds across Steam, mobile and the tabletop, and covers merit order, price cannibalisation, negative prices and storage arbitrage. **The opening:** a premium, single-player, history-driven renewable-energy tycoon has an open slot between free or idle energy games (Energy Manager, GridEnergy) and hardcore engineering sims (Power Network Tycoon, Nucleares). Steam app-ID ranges suggest, however, that at least ten new energy-business store pages have appeared since roughly late 2025. **The buyer:** a 30–55-year-old, male-leaning PC strategy and sim player who wants pausable, authentic economic building, will pay about $19.99, and is reached through community and wishlists rather than ads. Copenhagen's Hovgaard Games and the one-man studio Coredumping show that small Danish teams can sell hundreds of thousands to a million copies, though the median Steam outcome stays in the tens of thousands of dollars. **The design:** "fun, realistic, not too easy" comes from letting **the market fight back**. Each zone gets an hourly merit-order price that falls whenever anyone overbuilds the same technology. Batteries, hydro, geographic spread and hedging then become answers to a problem the player feels, and no single build order can dominate. **The data:** the game should compute that price itself from real weather, demand and fuel data, because historical price series are mostly proprietary and cannot react to the player. Weather comes from ERA5, licensed **CC BY 4.0 since July 2025**, and from its derived Pan-European Climate Database (licence to be confirmed); Renewables.ninja data is CC BY-NC and barred by the repo's licence rule. **The history:** four eras form a real difficulty curve: flat feed-in tariffs in the 1990s, the 2000s subsidy gold rush, the 2010s retroactive hangover, and the volatility of 2020–2026. Events from storm Lothar to the €936/MWh Dunkelflaute and the 2025 Iberian blackout fill the event deck. **The build:** a deterministic TypeScript simulation with a web interface, packaged with Electron for Steam on Windows and macOS. The same build runs in a phone browser for review, which is the right role for mobile at launch. A first release with about ten zones, the years 1990–2030, one polished market loop and three experimental technologies is realistic; the rest waits. **The name:** "Gridmaster" is already the exact title of a Steam app, so it stays a codename. Supergrid, Terawatt, Watt Street, Merit Order and Megawatt are free as Steam titles but untested against trademark registers. **The caveat:** most findings rest on search-engine extracts, because the network policy blocked most source pages and the shared search budget ran out. The final section ranks what a verification pass must check.

## Read this first: most figures come from search extracts

The research ran on 4 October 2026 under two limits that shape every claim below.

**Blocked pages.** The session's network egress policy refused direct page fetches for nearly every source domain — Steam's store and API, SteamDB, SteamSpy, Gamalytic and VG Insights; Wikipedia, BoardGameGeek and news sites; the Copernicus and ENTSO-E portals and Energi Data Service; the Steamworks documentation; and the search engines and every trademark register — so researchers could open essentially only GitHub, raw GitHub files, and the npm, PyPI and crates.io registries.

**Exhausted search budget.** The 200-call web-search budget, shared by the parallel researchers behind the eight notes, ran out early: the competitor researcher got three searches through and the naming researcher none.

As a result, **most figures come from search-engine summaries of the cited pages, not the pages themselves**, and many links below point to pages nobody read in full; no Steam review counts, owner estimates or review texts were collected for any energy-specific game; and no trademark register was searched.

The report carries the notes' verification markers through. Facts the notes held only as background knowledge are never stated as fact; they appear as flagged leads, mostly in the closing verification list.

| Marker | Meaning |
|---|---|
| *(none)* | Read from a search-engine extract of the linked page, not from the full page |
| **[fetched]** | Read first-hand from the primary file: GitHub repositories, package registries, or the daily GitHub mirror of Steam's app list |
| **[estimate]** | Third-party sales or revenue estimate whose method could not be inspected (Raijin.gg, steamdata.ai, Vorythic, Gamesensor and similar) |
| **[stale]** | Data at least three years old (for example Quantic Foundry's 2016–17 surveys) |
| **[approx.]** | One search summary drew on several pages, so which linked page holds the claim is uncertain |
| **[calc]** | Researchers' own arithmetic on cited figures |
| **[unverified]** | Background knowledge not checked this session. Never stated as fact; it appears as a lead to check |
| **[speculative]** | Projections for 2026–2060, or design suggestions with no source behind them |

## No verified rival simulates a European power market

### Energy games split into freemium, idle, engineering and board-game camps

The closest feature match is a Danish mobile title, Trophy Games' **Energy Manager**, on iOS, Android and the browser. It advertises "Real-life Weather Integration", land ownership, alliances, a stock market for *company shares* in which players can invest in rival energy companies, and a fuel mix that includes hydrogen from electrolysis. It drew **more than 150,000 Google Play pre-registrations** before launch ([Inderes](https://www.inderes.fi/en/releases/trophy-games-releases-energy-manager)) and was still live in 2026 as "Energy Manager - 2026" ([AppFollow](https://apps.appfollow.io/ios/energy-manager-2026/6474616285?country=br)). Its monetisation was not confirmed. On Steam the field is a handful of small titles, each coming at the theme from a different angle:

| Game | Status | Angle |
|---|---|---|
| **Power Grid** (digital) | Released **8 July 2024** at **$9.99**; AI and online opponents; eight separate maps, including Germany, France, Benelux, Eastern Europe and Italy ([Steam](https://store.steampowered.com/agecheck/app/2983910/)) | Adaptation of Friedemann Friese's board game |
| **Power Network Tycoon** | **1.0 on 30 September 2026** for Windows, Mac, Linux and Steam Deck ([IndieDB](https://www.indiedb.com/games/power-network-tycoon/news/power-network-tycoon-finally-launches-version-10-today)) | Built by a power engineer on "physics-based calculations found in industrial electrical design software"; the player moves a grid from oil to solar, wind and batteries ([Steam](https://store.steampowered.com/app/2429930/Power_Network_Tycoon/)) |
| **GridEnergy** | Released **21 September 2026** ([Steam](https://store.steampowered.com/app/5040690/GridEnergy/)) | Incremental game: coal, then wind, solar and batteries, plus a speculative stock market |
| **Nucleares** | About **84% positive on roughly 1,100 reviews**; median playtime 6.8 hours, mean 21.5 hours [estimate] ([steamdata.ai](https://steamdata.ai/game/1428420)) | A solo-developed reactor-operator sim with 200+ parameters and 150 switches that deliberately "doesn't hold your hand" ([Steam](https://store.steampowered.com/app/1428420)) |

**Two signals from these titles.** First, the gap between Nucleares' median and mean playtime points to a long tail of very deep players. Second, Power Network Tycoon's app ID implies a store page from about 2023 [calc]: roughly three years to 1.0, a pacing warning.

**A name scan of Steam's full app list** (190,338 game apps) [fetched] ([jsnli/steamappidlist](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json)) found **at least ten energy-business titles with app IDs above roughly 4.0 million**, which implies late 2025 to 2026: ARCWATT: Power Empire, PowerCorp, Prestige Electric Company, Nuclear Engineer Tycoon, 电网大亨 ("power-grid tycoon"), GOBLIN ELECTRIC LTD., Idle Energy, COALCOM: Power Station, Hakoniwa Electric, and Arcana, Gas & Waterworks Inc. The same scan found **no title named "Energy Tycoon", "Power Tycoon", "Power Plant Tycoon/Simulator", "Solar Farm …" or "Wind Farm …"**, although the genres, prices and reception of most of these titles could not be read because their store pages were blocked.

The lesson is twofold. **"Real weather" alone is no longer a unique hook**, because Energy Manager already claims it on mobile, and **no verified title models wholesale power prices**, volatility, negative prices, merit-order cannibalisation or cross-border flows: their "markets" are company-share markets (Energy Manager, GridEnergy) or a board-game fuel market (Power Grid), whose European maps are separate boards rather than one coupled continent.

That leaves Gridmaster's intended slot empty: **a premium, mid-core, single-player renewable-energy business tycoon with real market dynamics, historical progression and European risk-spreading**. It sits between the free or idle tier and the hardcore engineering tier. The main competitive risk is crowding, not a direct rival.

### Adjacent tycoons show what makes markets fun and what kills late games

The management-sim canon converges on four lessons.

**1. A market can be the antagonist.** Offworld Trading Company runs one on-screen market where every player's buying and selling moves every price ([Giant Bomb](https://giantbomb.com/wiki/Games/Offworld_Trading_Company)). Debt lowers a company's share price until it invites a buyout ([GameSpot](https://gamespot.com/reviews/offworld-trading-company-review/1900-6416420/) [approx.]). Yet its abstract Mars theme stalled at about **100,000 copies**, including Early Access ([Game Developer](https://gamedeveloper.com/business/-i-offworld-trading-company-i-surpasses-100-000-sales)). Concrete themes sell where abstract markets alone do not.

**2. Late games die when the best strategy never changes or costs stop rising.** Turmoil hooks players with one in-game year per level, but its "basic strategy never really chang[es]" ([Tech-Gaming](https://www.tech-gaming.com/turmoil/) [approx.]). Rise of Industry and its sequel were called repetitive because "once you have built one production lot, all you can do is build another one" ([TheXboxHub](https://www.thexboxhub.com/rise-of-industry-2-review/) [approx.]; [VaporLens](https://vaporlens.app/app/671440/rise_of_industry)). The first game sold **350,000+ copies** yet left its developer about €140,000 in deficit, and the whole IP was later sold for **$5,000** ([Automaton](https://automaton-media.com/articles/newsjp/rise-of-industry-20250815-353504/)). Transport Fever 2's operating costs never rise, so "all difficulty goes out the window" ([Steam discussion](https://steamcommunity.com/app/1066780/discussions/0/3963662507768894840) [approx.]). One review's verdict: "Very pretty, too easy" ([Dedoimedo](https://www.dedoimedo.com/games/transport-fever-2.html)). Anno 2205 "isn't a very challenging game", because its resources are "inexhaustible, or close to it" ([GameSpot](https://www.gamespot.com/reviews/anno-2205-review/1900-6416317/) [approx.]).

**3. Realism must be truthful, switchable and explained.** Cities: Skylines II shipped an economy its studio's CEO apologised for ([PCGamesN](https://www.pcgamesn.com/cities-skylines-2/broken-economy)). Players found UI numbers that "don't actually correlate" with the simulation ([Lemmy](https://lemm.ee/comment/7041491)), and development moved to another studio from 2026 ([CGMagazine](https://www.cgmagonline.com/news/cities-skylines-iceflake-studios/)). Workers & Resources: Soviet Republic is about **90% positive** despite being "the Dark Souls of city builders" ([Notebookcheck](https://www.notebookcheck.net/Not-for-beginners-Complex-city-builder-90-positive-drops-below-10-on-Steam.1342440.0.html)). Players can switch off individual systems such as money or electricity ([Galaxus](https://galaxus.fr/en/page/i-rule-over-my-own-soviet-nation-in-workers-resources-soviet-republic-33630)). Its missing onboarding still turns many away ([VaporLens](https://vaporlens.app/app/784150/workers_resources_soviet_republic)). Victoria 3's economy "won't move unless you do" ([Wargamer](https://www.wargamer.com/victoria-3/review) [approx.]), until Paradox added opt-in "Autonomous Investment" ([Paradox](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-78-update-1-2-changelog)). Big Ambitions, from Copenhagen, moves the player from running errands to managing staff, warehouses and factories ([Prima Games](https://primagames.com/reviews/big-ambitions-review)). It hit **91% positive at 1.0** ([PCGamesN](https://www.pcgamesn.com/big-ambitions/1-0-tycoon-life-sim)).

**4. Power systems and history are proven content.** Factorio players happily size storage against a known solar curve, settling on 21 accumulators per 25 panels ([Factorio forums](https://forums.factorio.com/viewtopic.php?p=356188)). Its "power death spiral" makes memorable, recoverable crises ([XGamingServer](https://xgamingserver.com/blog/power-management-in-factorio-a-comprehensive-guide/)). Satisfactory sorts sub-grids into priority groups that shed load in order ([Satisfactory wiki](https://satisfactory.wiki.gg/wiki/Priority_Power_Switch)). History works best as a timeline of rules: Transport Tycoon introduced vehicles by date, with teething reliability problems and ageing fleets ([Wikipedia](https://en.wikipedia.org/wiki/Transport_Tycoon)). Game Dev Tycoon kept the real order of platform launches under parody names ([Giant Bomb](https://giantbomb.com/wiki/Games/Game_Dev_Tycoon)). Railroad Tycoon II turned historical scenarios into bronze, silver and gold deadlines ([Wikipedia](https://en.wikipedia.org/wiki/Railroad_Tycoon_II)).

### Board and serious games already solved pacing, intermittency and explanation

**Power Grid** (*Funkenschlag*, 2001/2004) still rates about **7.8 on BoardGameGeek**, at rank #76 and complexity weight 3.3 ([Board Game Oracle](https://boardgameoracle.com/boardgame/price/2RKvF7EFGx/power-grid)). Four systems interlock: a fuel price ladder that players drain and a schedule refills; a two-row plant market that shows the plants coming next; "Steps" triggered by player progress, such as a network reaching 7 cities ([rules PDF](https://edp.org/Games/PowerGrid.pdf)); and payment for cities actually powered rather than cities built.

Critics call the arithmetic the real game ("where calculators are the real power plants"). They call its catch-up rules "massively gamey", rewarding players who deliberately hang back ([Zatu](https://zatu.com/en-au/blogs/reviews/power-grid-second-opinion-where-calculators-are-the-real-power-plants); [There Will Be Games](https://therewillbe.games/articles-boardgame-reviews/1874-power-grid-a-calculated-assessment) [approx.]). Its European maps double as rule modules: France, for example, gets more uranium and earlier nuclear ([Rio Grande](https://www.riograndegames.com/wp-content/uploads/2013/02/PGRecharged-FranceItaly.pdf)). *The Robots* expansion builds AI opponents from five modular behaviour tiles ([Board Game Bliss](https://www.boardgamebliss.com/products/power-grid-the-robots-recharged)). The official app's **2.5/5** rating ([App Store](https://apps.apple.com/app/id1434690170)) says: borrow the system dynamics, not the phase-by-phase interface.

**The wider tabletop shelf** isolates one lever each. CO2 trades emission permits on a floating market against a shared pollution threshold ([UltraBoardGames](https://www.ultraboardgames.com/co2/game-rules.php)). Barrage treats water as a reusable flow and locks capital in a construction wheel ([Board Game Quest](https://www.boardgamequest.com/barrage-review/)). GigaWatt races six European regions off coal and gas, with sun and wind dice, resident protests and accelerating demand ([Tabletopia rules](https://c.tabletopia.com/games/gigawatt-2022/rules/20211208-gigawatt-rules-en/en)). Daybreak was praised for its "we can do this" optimism and QR-linked explainers ([Tabletop Gaming](https://tabletopgaming.co.uk/reviews/daybreak-game-review)). Watts the Deal? makes households meet demand exactly with solar, batteries and trading ([CREDS](https://www.creds.ac.uk/energy-trading-board-game-online-and-easy-to-print/)). 18xx makes obsolescence a planning skill, because trains "rust" on a visible schedule ([Wikipedia](https://en.wikipedia.org/wiki/18XX)).

**Serious games show what makes realism teachable.** Classroom electricity-market games put student teams in the role of generators bidding into a merit-order exchange, and draw "highly positive" feedback ([UNSW CEEM](https://ceem.unsw.edu.au/sites/default/files/migration_files/ceem/publication-documents/cau_marketgame_aupec04.pdf); [PolyU](https://www.polyu.edu.hk/edc/tdg/showres.php?rid=106); both [approx.]). En-ROADS' instant what-if sliders raised both knowledge and a sense of empowerment ([MIT DSpace](https://dspace.mit.edu/handle/1721.1/136266)). *Fate of the World* was accurate but "frustratingly badly explained" ([Wikipedia](https://en.wikipedia.org/wiki/Fate_of_the_World)).

**None of the sourced games turns price cannibalisation, negative prices or storage arbitrage into a mechanic**, so that ground is open. The table condenses what to take from each.

| Game | Proven lesson | What Gridmaster takes |
|---|---|---|
| Energy Manager | Weather-linked renewables appeal at mobile scale | Differentiate on premium depth, wholesale prices and history, not on "real weather" |
| Power Network Tycoon / Nucleares | Engineering realism has a deep but narrow audience | Stay a business tycoon; keep engineering in the background |
| Offworld Trading Company | Prices that react to every player make the market the opponent | Prices produced by the simulation; debt that hurts valuation |
| Turmoil, Rise of Industry | Random maps without strategic change get repetitive | Each era and region must change the best strategy |
| Transport Fever 2, Anno 2205 | Flat costs and endless resources kill the challenge | Ageing assets, rising system costs, scarce sites |
| Cities: Skylines II | Fake or opaque numbers destroy trust | Every figure computed by the simulation and explained on hover |
| Workers & Resources | Hard realism sells if parts of it can be switched off | Realism toggles and difficulty presets |
| Victoria 3, Big Ambitions | Players want chores automated as they scale | Do-it-yourself early, delegate through policies later |
| Factorio, Satisfactory | Storage sizing and grid failures are fun | Energy-versus-power choices; recoverable blackouts |
| Power Grid (board) | A visible price ladder, a future-market window, progress-triggered Steps | A merit-order screen, a project pipeline view, threshold-triggered market changes |
| CO2, GigaWatt, Barrage | Permits, intermittency dice, water flows, locked capital | Carbon price, weather-year variance, hydro cascades, construction lead times |
| Fate of the World vs En-ROADS | Unexplained realism frustrates; instant feedback empowers | One-click "why?" on every price; previews before every build |

## Planners aged 30 to 55 will pay about $20

### The buyer is an older strategy player who wants pausable, honest economics

No 2023–2026 dataset on buyers of tycoon games turned up, but older survey data point to a clear core. Quantic Foundry found Strategy (thinking ahead, making complex decisions) to be the one gamer motivation that does not decline with age, while Competition declines most ([Quantic Foundry](https://quanticfoundry.com/2016/02/10/gamer-generation/) [stale]); older players prefer economic, scientific or cultural victories to conquest ([Quantic Foundry](https://quanticfoundry.com/2016/03/02/4x-strategy/) [stale]); and grand strategy is only **7% female**, while Cities: Skylines draws a larger female share than Football Manager, Total War or Europa Universalis IV ([Quantic Foundry](https://quanticfoundry.com/2017/01/19/female-gamers-by-genre/) [stale]). Paradox targets "35-plus males", reaching them mainly through its own channels and spending more on retention than acquisition ([DFC Intelligence](https://www.dfcint.com/paradoxs-grand-strategy/)), and the average player worldwide, across all platforms, is now about **41** ([Guru3D on the ESA 2025 global study](https://www.guru3d.com/story/global-gamers-are-getting-older-average-gamer-age-now-41-worldwide/)).

**The counterweight:** across 1.5 million respondents, the average Strategy score fell to the **33rd percentile of its 2015 baseline** by 2024 ([Quantic Foundry](https://quanticfoundry.com/2024/05/21/strategy-decline/)). Game Developer countered that strategy sales have held up ([Game Developer](https://www.gamedeveloper.com/business/if-strategy-game-sales-are-persistent-why-are-players-less-interested-in-strategic-thinking-)). The decline still argues for "casual on the surface, realistic underneath" rather than a spreadsheet-first design. Four personas follow [speculative; inferred, not measured]:

| Persona | Who | What they want | Basis |
|---|---|---|---|
| **The Planner** (primary) | About 35–55, mostly male, in German-speaking countries, the Nordics, Benelux, the UK or North America; often in engineering, IT or finance. Plays Anno, Transport Fever, Cities: Skylines, Workers & Resources and Factorio. | Authentic charts and history; hour-long paused sessions; buys DLC; dislikes grind, fake numbers and preaching | The age and motivation data above |
| **The Sim Hobbyist** | Prefers running a concrete machine to abstract strategy | Something like running a real wind farm or grid | Farming Simulator 25 sold **4M+ in its first year** ([GamesMarket](https://www.gamesmarket.global/giants-farming-simulator-25-sold-4-million-copies/)); Nucleares is about 84% positive |
| **The Energy-Curious** | Follows or works in the energy transition; buys for the theme | Spreads the game through professional circles; likely a more balanced gender mix | Analogy only |
| **Chinese sim players** (optional) | Worth testing if a Simplified Chinese translation is affordable | Not known | Quantic Foundry finds China has "a very different gaming motivation profile" |

### Steam is saturated, but building and management sims beat the median

**Volume and hit rate.** Trackers counted about **20,000 Steam releases in 2025**: GameDiscoverCo 20,558, Gamalytic 20,353, VG Insights 20,282 ([How To Market A Game](https://howtomarketagame.com/2026/01/08/how-many-games-were-released-in-2025/)). Only **608 of 20,282 (2.99%)** reached 1,000 reviews ([How To Market A Game](https://howtomarketagame.com/2026/01/27/what-the-hell-happened-in-2025/)), and nearly half had fewer than ten ([GamingOnLinux](https://www.gamingonlinux.com/2025/12/over-19000-games-have-released-on-steam-in-2025-with-nearly-half-seeing-fewer-than-10-reviews/page=1/)).

**The median game.** It reportedly grosses about **$1,000 in its lifetime**. The median is $3,285 for self-published games and $16,222 for publisher-backed ones, a correlation rather than proof that publishers cause the difference ([Steam Page Analyzer](https://www.steampageanalyzer.com/blog/median-steam-game-2026) [estimate]).

**Building and strategy tags do better:**

| Tag | Median revenue |
|---|---|
| Colony Sim | $44k |
| 4X | $35k |
| City Builder | $22k |
| Grand Strategy | $19k |
| Baseline (all games) | ~$5k |

These are GameDiscoverCo's figures, roughly four to nine times the baseline. The analysis date is unconfirmed and may be about 2021 ([GameDiscoverCo](https://newsletter.gamediscover.co/p/which-genre-should-your-next-pc-game) [stale]). Older VG Insights data show **14–15%** of indie simulation and strategy games earning over $200k, while 54% earned under $10k, including 11% that earned nothing ([Statista/VG Insights](https://www.statista.com/statistics/1356730/steam-indie-game-revenue-genre/) [stale]).

**Unresolved: is "Management" a weaker tag than "City Builder"?** One summary of Chris Zukowski's 2025 analysis gives success rates of **6.4% for city builders and 3.4% for management**, without confirming what the rates measure. Another summary gives 0.5% for city builders ([How To Market A Game](https://howtomarketagame.com/2026/01/27/what-the-hell-happened-in-2025/)).

**Early Access rarely improves the picture.** Only **20% of the 225 games that left Early Access in 2025 earned more at 1.0**, after a median 437 days in Early Access ([GameDiscoverCo](https://newsletter.gamediscover.co/p/the-state-of-steam-early-access-graduates)).

**The base case** for a solo developer's first sim is therefore **low tens of thousands of dollars**, with a fat upside tail that depends on the hook and the wishlist count. The comparables show both:

| Title | Outcome | Lesson |
|---|---|---|
| Big Ambitions (Hovgaard, Copenhagen) | 100,000 copies in 7 days of Early Access ([Hovgaard on X](https://x.com/hovgaardgames/status/1636768237776928769)); **1.1M** later, date unconfirmed ([Hovgaard](https://www.hovgaard.com/news/)) | Danish small studios can open big with a broad hook |
| Software Inc. (Coredumping, Danish solo developer) | ~295k copies, **~$3.5M gross** [estimate] ([Vorythic](https://vorythic.com/games/2856/software-inc)) | A long-tail solo success |
| Mad Games Tycoon 2 | ~307k copies, $5.11M [estimate] ([steamdata.ai](https://steamdata.ai/en-US/game/1342330/mad-games-tycoon-2)) | Tycoon sequels sustain |
| Workers & Resources: Soviet Republic | ~599k copies, **$14.4M** [estimate] ([Raijin.gg](https://raijin.gg/app/784150/Workers_Resources_Soviet_Republic)) | Punishing realism sells as a niche |
| Transport Fever 2 | **2M+** ([Wikipedia](https://en.wikipedia.org/wiki/Transport_Fever_2)) | Mid-sized studio, broad appeal |
| Car Mechanic Simulator 2021 | ~839k Steam copies, $12.6M [estimate] ([Raijin.gg](https://raijin.gg/app/1190000/Car_Mechanic_Simulator_2021)) | Tactile realism converts |
| Rise of Industry | 350k+ copies, yet the developer ended in deficit ([Automaton](https://automaton-media.com/articles/newsjp/rise-of-industry-20250815-353504/)) | Copies sold are not income; read publisher terms |
| Offworld Trading Company | ~100k ([Game Developer](https://gamedeveloper.com/business/-i-offworld-trading-company-i-surpasses-100-000-sales)) | An abstract hook caps reach |
| Frostpunk | **5M+** ([WN Hub](https://wnhub.io/news/investment/item-46200)) | Climate themes sell as drama |
| Terra Nil | 300k players in week one, across stores and the Netflix mobile version ([Game World Observer](https://gameworldobserver.com/2023/04/06/terra-nil-300000-players-free-lives-tree-planting)) | Optimistic eco-building sells |

### Price at $19.99 and sell competence, not a lecture

Realised revenue per copy — gross divided by copies, after discounts and before Steam's cut — clusters between about $12 and $24 [calc on estimates]: about $11.9 for Software Inc., $15.0 for Car Mechanic Simulator 2021, $16.7 for Mad Games Tycoon 2 and $24.1 for Workers & Resources.

Kapital: Sparks of Revolution launched at $19.99 ([GamingOnLinux](https://www.gamingonlinux.com/2022/05/society-management-city-builder-kapital-sparks-of-revolution-is-out-now/comment_id=225578)) and was later discounted 80–88% ([Gamers Unchained](https://www.gamersunchained.com/game/kapital-sparks-of-revolution); [Nuuvem](https://www.nuuvem.com/catalog/os/mac/page/17)). The median Steam price is reportedly "drifting down toward $15" ([Steam Page Analyzer](https://www.steampageanalyzer.com/blog/median-steam-game-2026)).

**The recommended list price is $19.99/€19.99**, or $14.99–19.99 in Early Access rising to $19.99–24.99 at 1.0, and never below $10, which signals low ambition and leaves no room to discount. Steam blocks discounts for 30 days after any price increase, and that rule applies at the move to 1.0 (see the build section).

**Theme framing.** The theme sells when framed as competence and optimism, as with Terra Nil and Eco (**400,000+** copies, [Wikipedia](https://en.wikipedia.org/wiki/Eco_(2018_video_game))), or as drama, as with Frostpunk. *Fate of the World* cast the player as a planet-saving policymaker; it won praise but never disclosed sales ([Wikipedia](https://en.wikipedia.org/wiki/Fate_of_the_World)).

**Recommended positioning:** a company-owner fantasy in which renewables win because the player makes them pay. Nuclear is presented as trade-offs, not a moral position; Nucleares' reception shows that technical nuclear realism has an audience. No evidence was found on the size of any political backlash risk.

**Store tags:** use only tags that genuinely fit, such as Simulation, Strategy, Economy, Resource Management and Building. Simon Carless warns that tag medians apply only "if they truly apply to your game".

### Marketing runs on wishlists, the store page and one Next Fest

**Genre is the first marketing decision.** Zukowski argues that "the moment you say 'I'm gonna make this type of game,' you've actually made the biggest marketing decision". Building and sim games convert because Steam's audience goes looking for them ([Valadria podcast](https://www.valadria.com/steam-game-marketing-with-chris-zukowski/)).

Wishlist benchmarks put about **7,000** as the threshold for Steam's Popular Upcoming list, **10,000+** as a "healthy" launch and 25,000+ as a "strong" one ([presskit.gg](https://presskit.gg/field-guides/how-many-wishlists-to-launch)).

**Next Fest is crowded:** over 3,500 demos took part in February 2026. In February 2025, **68–88% of the wishlists gained during Next Fest came from people who never played the demo** ([presskit.gg](https://presskit.gg/field-guides/analyzing-next-fest-results); [presskit.gg](https://presskit.gg/blog/steam-next-fest-2026-results)). The capsule art, trailer and store page therefore matter more than the demo itself.

The plan this supports is to aim for 10,000–20,000 wishlists before launch, build a Paradox-style dev-log and Discord community, cut a trailer that *shows* weather fronts crossing wind farms and price charts reacting, and pitch press with the "Danish tycoon" angle and country stories such as Danish wind, the Energiewende, French nuclear and Norwegian hydro. Because few games earn more at 1.0 than at their Early Access launch, **the first paid launch effectively is the launch**, and Early Access should open only with a polished, substantial slice.

**Open points.** German-first localisation, followed by Simplified Chinese, is an unsourced inference; Steam language shares were not retrieved. The creator list (Nookrium, Splattercat, Aavak, Wanderbots, Orbital Potato, Biffa; Steinwallen in German) is [unverified]. No ratio for converting wishlists into sales was found.

## Let the market fight back so no single strategy wins

### Three nested loops turn on one visible price

Real power markets already contain the game's central tension, as a chain of three sourced effects. (1) Renewables have "virtually zero marginal costs" and push more expensive plants out of the merit order ([Kyon Energy](https://www.kyon-energy.de/en/glossar/merit-order)). (2) More variable renewables mean more negative-price hours ([*Energy Policy*, 2022](https://www.sciencedirect.com/science/article/pii/S0301421522002981)). (3) More frequent negative prices make storage arbitrage more profitable ([Flex Power](https://flex-power.energy/school-of-flex/bess-energy-markets/)).

That chain is the brief's progression from solar, through saturation, to batteries. **The real economics supply the arc**; the design job is to make it readable. Three nested loops carry it:

| Loop | Timescale | What happens | Precedent |
|---|---|---|---|
| Operating | Minutes of play | The player reads the forecast, then dispatches, curtails or stores, and banks revenue | Turmoil shows one tight loop can carry a game |
| Project | Hours of play | The player sites, permits, finances, builds and connects new assets | — |
| Era | Across the campaign | Policy regime, available technology and market structure change | Anno and Two Point keep play fresh by changing the problem |

**The merit-order ladder is a first-class screen** — Power Grid's fuel ladder turned upside down. For each zone and hour it shows the supply stack against the demand line, with renewables near €0 and nuclear, coal, gas and imports above them, highlights the player's own blocks, and previews each build's effect on the clearing price.

**Revenue comes from what is delivered.** It equals delivered megawatt-hours times the capture price (the average price a technology actually earns when it produces), never nameplate capacity. This mirrors Power Grid's "cities powered, not cities built".

### Progression should change the product, not just the numbers

**The opening is a prosumer puzzle.** Watts the Deal? asks households to "meet their daily electricity demand exactly" with solar panels, batteries and trading ([CREDS](https://www.creds.ac.uk/energy-trading-board-game-online-and-easy-to-print/)). That fits the brief's "few solar panels" start: one asset, one market, one weather variable, with each milestone adding a single new system [speculative].

**Tiers change the *kind* of business,** the way Anno 1800 upgrades a population tier once its needs are met ([Wikipedia](https://en.wikipedia.org/wiki/Anno_1800)). Each tier adds a revenue stream and a risk [speculative]: (1) rooftop self-consumption; (2) feed-in-tariff projects; (3) utility-scale auctions and PPAs (long-term fixed-price sales contracts); (4) merchant sales with balancing; (5) cross-border trading and flexibility services; and (6) power-to-X offtake, turning electricity into hydrogen or fuels for a buyer.

**Automation is the reward for scale.** Early on the player places panels and sells surplus by hand. Later they hire O&M (operations and maintenance) crews, a trading desk and an auto-bidder, and finally they set portfolio policies. Big Ambitions and Victoria 3's opt-in Autonomous Investment show players welcome that arc.

**Technology and markets change on a visible schedule.** Technologies arrive on the historical calendar with Transport Tycoon-style teething problems and ageing ([Wikipedia](https://en.wikipedia.org/wiki/Transport_Tycoon)); obsolescence is announced ahead, as 18xx's rusting is, through support-scheme expiry, panel degradation and turbine wear; and Power Grid-style thresholds trigger regime changes, so that negative-price hours begin once variable renewables pass a set share in a zone and storage becomes bankable once price spreads widen enough.

### Difficulty should switch systems on and off, not just scale numbers

**"Not too easy" needs anti-snowball forces that grow with the player**, and the evidence names five: system costs that grow faster than size, as OpenTTD's opt-in infrastructure maintenance charges dense networks disproportionately ([OpenTTD wiki](https://wiki.openttd.org/en/Archive/Community/Infrastructure%20maintenance)); ageing assets, as in Transport Tycoon; rivals who bid for the same sites, auctions and grid slots, with debt lowering valuation and inviting takeovers, as in Offworld; deadlines and medals, as in Railroad Tycoon II; and recoverable catastrophes, as in Factorio and Satisfactory.

Rivals can be assembled from The Robots' five behaviour tiles (siting, bidding, input purchasing, expansion and a special ability) into archetypes such as an incumbent utility, an oil major pivoting to wind, an infrastructure fund and a citizens' cooperative.

**Interest rates are a real lever.** Ørsted cited rising rates, alongside supply-chain problems, when it cancelled two US offshore projects in 2023 ([CNBC](https://www.cnbc.com/2023/11/01/orsted-axes-two-new-jersey-wind-projects-takes-4-billion-writedown.html)).

**"Casual but realistic" comes from presets that switch whole systems,** as Workers & Resources does, with every component also toggleable on its own [speculative]:

| Preset | Forecasts | Permitting and grid queues | Imbalance penalties |
|---|---|---|---|
| Casual | Perfect | Short | Off |
| Realistic | With error | On | On |
| Analyst | With error | On | On, plus interest-rate eras and degradation |

**Medal ladders keep pressure on rich players.** One star finishes a scenario; three stars demand mastery against tighter deadlines. This follows Railroad Tycoon II's bronze/silver/gold deadlines ([Wikipedia](https://en.wikipedia.org/wiki/Railroad_Tycoon_II)) and Two Point Hospital's stars ([Wikipedia](https://en.wikipedia.org/wiki/Two_Point_Hospital)). The question becomes *how fast*, not *whether*.

**Success should also be measured beyond money** — through reputation that eases planning approval, the share of decarbonisation, a system-stability score, and prestige goals such as keeping a country lit through a two-week wind lull. Players hold up Megaquarium, where money is tight early, research drives the middle game and prestige the end, as the model ([itch.io](https://itch.io/post/15852194) [approx.]).

### The optimal playstyle should be a moving, hedged portfolio

The brief asks for "the optimal playstyle". The research's answer: the design should make optimal play **shift by era and place**. A good player: (1) builds small, low-variance projects under the fixed tariffs of the 1990s; (2) rides the 2000s feed-in boom while watching each country's policy risk; (3) moves into new zones before they saturate, hedging with PPAs or contracts for difference (CfDs, which guarantee a strike price in exchange for paying back revenue above it); and (4) in the 2020s, owns both sides of the problem: generation, plus the storage, flexibility and power-to-X that profit from everyone else's overbuilding and from scarcity spikes. Throughout, the portfolio is spread across zones whose weather is not perfectly correlated, with moderate leverage.

Turmoil and Rise of Industry show what happens when one build order wins everywhere: players solve it and leave. Each degenerate strategy therefore needs a counter grounded in the simulation:

| Degenerate strategy | Counter |
|---|---|
| Solar spam in the sunniest zone | Capture-price cannibalisation from the simulation itself; curtailment; grid-connection queues; congestion costs that rise with density |
| Batteries as a money printer | Forecast error; wear per cycle; spreads that shrink as storage fleets grow, because storage bids into the same stack |
| Build once, earn forever (Transport Fever 2) | Degradation; rising O&M; tariff and contract expiry |
| Historical foreknowledge of the 2022 price spike | Randomised timing and size of events outside the strict campaign; seeded alternate-history runs; resampled weather-years |
| Diversification that is pointless or trivially safe | Tuned cross-zone correlation, for example Europe-wide wind lulls |
| Leverage loops | Debt lowers valuation and invites takeover bids; interest-rate eras |
| Subsidy farming | A per-country policy-risk meter that rises with cumulative subsidy cost. Italy's PV scheme closed at a **€6.7bn-a-year cap** ([Solarserver](https://www.solarserver.de/2013/06/04/italiens-photovoltaik-einspeiseverguetung-wird-auslaufen-obergrenze-des-foerderprogramms-conto-energia-fast-erreicht/)); Spain cut tariffs retroactively ([pv magazine](https://www.pv-magazine.com/2013/02/21/spain-publishes-retroactive-pv-fit-cuts_100010298/)) |
| Sandbagging (deliberately staying small), Power Grid's flaw | Never rewarded; catch-up comes as opportunity (distressed assets, cheaper late technology), never as a penalty for leading |

**Dominance should be caught by measurement rather than argument.** Headless bot players ("all-in wind", "gas then solar", "cautious", "greedy return on investment") run nightly across many seeds and scenarios, and if one bot wins everywhere a dominant strategy exists; targeted playtests at hours 20, 40 and 80 then check whether "money stopped mattering".

**One caution stands: no playtest evidence was found that price cannibalisation is fun.** That idea is reasoned design, and the first prototype must test it.

### Explain every number, and let the player act on it

**Never show a number the simulation does not use.** Every figure is computed and breaks down on hover. "Why did my solar farm earn €31/MWh?" answers with the wholesale price, cannibalisation, curtailment and imbalance costs.

**Every major build gets an En-ROADS-style preview** of the projected capture price, the effect on the zone's price curve, the payback range, and expected-year (P50) and bad-year (P90) yields.

**The game does the arithmetic and leaves the judgement.** Power Grid's calculators and analysis paralysis are the cautionary tale. Uncertainty from weather-years, rivals and policy keeps an automated model from feeling solved.

**Time controls.** Pause with several speeds is assumed to be the genre baseline [unverified]. On top of that, Gridmaster adds auto-pause on alerts, such as a run of negative prices, a scarcity event or a tender opening; optional "zoom-in" set pieces that play a critical week, such as a winter wind lull, at hourly resolution; an annual report as the natural end-of-session checkpoint; and a codex linking mechanics to real-world explainers, as Daybreak's QR codes do.

## Ship real weather, but compute the prices

### An hourly zonal merit order reproduces what matters at trivial cost

The brief's first attempt replayed real data, because prices and weather seemed too hard to model. The research recommends **real weather but computed prices**, for two reasons: real price history is mostly proprietary — Nord Pool's history became a paid service at **€600 a year** ([ERR News](https://news.err.ee/1608701422/nord-pool-puts-historical-price-data-access-fees-down-to-rising-costs)) and EEX sells its daily carbon index ([EEX](https://webshop.eex-group.com/data-type/eex-ecarbix-sftp)) — and a replayed price cannot react to the player's own solar farms, which is the whole game.

**The simplest credible design** comes from the data researcher's reasoning [speculative; standard practice in open energy models, untested for this game]. **Zones and time.** About **30–40 zones**: one per country, split where gameplay needs it (DK1/DK2, Norway, Sweden, Italy). An interconnector graph links them; its capacity limit (NTC, net transfer capacity) grows with historical projects and player-financed lines. The simulation runs every hour internally while the interface advances by day, week or month.

**Price formation.** Each zone's supply stack is a set of plant blocks bidding their marginal cost: fuel price ÷ efficiency, plus carbon price × emission factor ÷ efficiency, plus variable O&M. Five rules sit on top:

| Rule | What it does | What it produces |
|---|---|---|
| Near-zero renewable bids | Wind and solar bid about zero, or *minus* any subsidy paid only while producing; inflexible plants bid below zero to avoid shutting down | Negative prices |
| Scarcity adder | Climbs toward a price cap as spare capacity runs out | Dunkelflaute spikes |
| Coupling | Neighbouring zones trade, by an iterative heuristic or a small linear programme per hour, until prices converge or a line congests | Cross-border price convergence and splits |
| Water values | Hydro reservoirs bid an opportunity cost that rises as the reservoir empties | Nordic prices that track wet and dry years |
| Storage rule | Storage charges below a rolling price quantile and discharges above it, bidding into the same stack | A growing battery fleet erodes its own arbitrage margin |

**Cannibalisation then emerges with no special rule:** solar lowers midday net demand until solar itself sets the price.

**Compute cost is trivial.** About 40 zones × 15 blocks × 8,760 hours is roughly **5.3 million block evaluations per simulated year** [calc]. Hourly resolution is worth keeping. Representative days would cut the data about thirtyfold, but they erase multi-day Dunkelflaute persistence and inter-day storage value, which is where the drama lives [calc].

**Calibration** compares simulated 2015–2024 statistics — annual mean prices, price-duration curves, wind and solar capture rates and negative-price hours — with real Energinet, Elexon and ENTSO-E data until the shapes match, without replaying history. The widely cited Hirth (2013) estimates of how wind and solar market value falls as penetration rises could not be fetched [unverified] and must be checked before they serve as targets.

### Resampled real weather-years beat synthetic weather generators

**Why resample real years.** Real weather-years keep what synthetic generators tend to lose: cross-country correlation, such as pan-European wind lulls; the joint behaviour of wind, solar, temperature and hydro; true daily and seasonal shapes; and the extremes and multi-day persistence that generators under-represent unless explicitly fitted.

**The source.** The obvious choice is the **Pan-European Climate Database (PECD 4.2)**, produced by Copernicus with ENTSO-E. It covers **1950–2024 at hourly, 0.25° resolution**, with wind and solar capacity factors, hydro inflows and climate-projection years ([CDS](https://cds.climate.copernicus.eu/datasets/sis-energy-pecd)).

**Varying the draw.** Seventy-five years is a finite set that players might learn, so the game varies how it samples: a "historical" mode plays the real calendar year; a "dynamic" mode draws years at random from a seeded generator, or bootstraps week-blocks within a season, with ±5–10% multiplicative noise; future years draw from projection-adjusted series; and a weather-regime chain that picks real analogue weeks is a possible hybrid [speculative].

**Two corrections keep it honest.** Wind needs era-appropriate turbines, because the EU Joint Research Centre's alternative EMHIRES dataset bakes the end-2015 fleet into its capacity factors ([SETIS](https://setis.ec.europa.eu/emhires-dataset-part-i-wind-power-generation_en)), and reanalysis winds need bias correction against observed fleet output, which the open VWF model applies [fetched] ([VWF](https://raw.githubusercontent.com/renewables-ninja/vwf/master/README.md)).

**Site quality.** The Global Wind and Solar Atlases are long-term maps, not hourly series. They are useful for scaling a zone's hourly shape so that one ridge beats the next.

**Data size.** Raw ERA5 for Europe would run to 200–400 GB, so all preprocessing happens offline. The shipped zonal series are small: 40 zones × 5 series × 45 years is about **79 MB** at one byte per value, or 158 MB at half precision [calc].

### Demand, fuels, carbon and the pre-market era use statistics plus shapes

**Demand.** Uniform hourly European load data begins only in **2015**, with the ENTSO-E Transparency Platform under Regulation 543/2013 ([ENTSO-E](https://annualreport2020.entsoe.eu/transparency-regulation)). Earlier demand combines two parts: annual national consumption from Eurostat or Ember, and an hourly shape driven by ERA5 temperature, the calendar and a slow electrification trend, fitted on 2015-onward data. The open model PyPSA-Eur ships exactly this kind of weather-driven synthetic demand under CC BY [fetched] ([PyPSA-Eur data inventory](https://raw.githubusercontent.com/PyPSA/pypsa-eur/master/doc/data_inventory.csv)).

**Fuels.** Coal, gas and oil prices follow the World Bank Pink Sheet, monthly since 1960 and CC BY 4.0 ([World Bank](https://thedocs.worldbank.org/en/doc/386771467756369668-0050022016/render/CMOHistoricalDataMonthly.pdf)). After the present day they follow a mean-reverting random path with occasional shocks.

**Carbon.** The carbon price is zero before 2005, then follows a path calibrated to widely reported annual averages. No openly licensed daily EU ETS price series was found.

**The pre-market era.** Before each country's market opens, a **regulated-tariff mode** pays flat feed-in rates regardless of the hour. It flips to market mode on the historical opening dates: the England and Wales Pool from 1990, replaced by NETA in March 2001 ([UK Data Service](https://doc.ukdataservice.ac.uk/doc/5247/mrdoc/UKDA/UKDA_Study_5247_Information.htm)); Nord Pool from 1996 ([Wikipedia](https://en.wikipedia.org/wiki/Nord_Pool)); APX in May 1999 ([Wikipedia](https://en.wikipedia.org/wiki/APX_Group)); Leipzig's LPX on 15 June 2000 ([EEX](https://www.eex-group.com/en/about/milestones)); and Powernext on 26 November 2001 ([EPEX SPOT](https://epexspot.com/en/news/epex-spot-celebrates-20-years-first-day-ahead-auction)). The same 1990s assets later meet hourly prices and cannibalisation, which makes a teachable historical arc.

**Technology costs.** These come from the Danish Energy Agency's technology data and NREL's Annual Technology Baseline, both CC BY 4.0 ([ENS](https://ens.dk/media/3289/download); [NREL](https://data.nrel.gov/submissions/145)), plus IRENA figures carrying "© IRENA [year]", with third-party material excluded ([IRENA](https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2019/Mar/IRENA_RE_Capacity_Statistics_2019.pdf)).

**Learning curves.** Costs follow cost = C₀ × (Q/Q₀)^−b, with b = −log₂(1 − learning rate). Q is *global* cumulative capacity, so heavy player investment pulls costs down faster. A 20% learning rate gives b ≈ 0.32.

### Licences decide what ships, and the repo bars non-commercial terms

The repo's rule allows CC0, CC BY, the Copernicus licence and other licences that explicitly permit commercial use, never allows non-commercial terms, and allows share-alike licences only with Lukas's written approval. Applied to the licence statements the research found — most of them search extracts that must be re-read before anything is committed — it gives this register:

| Source | Provides | Licence as found | Recommended use |
|---|---|---|---|
| ERA5 / Copernicus Climate Data Store | Hourly reanalysis weather | **CC BY 4.0 since 2 July 2025**, commercial use allowed with credit ([ECMWF forum](https://forum.ecmwf.int/t/cc-by-licence-to-replace-licence-to-use-copernicus-products-on-02-july-2025/13464)) | Ship derived zonal series |
| PECD 4.2 (C3S with ENTSO-E) | 1950–2024 capacity factors, hydro inflows, projection years | Probably CC BY like the rest of the CDS; confirm on its licence tab | Primary weather backbone |
| C3S European energy indicators | Older derived set | Superseded; updates scheduled to stop 1 July 2026, deprecation at end-2026 ([CDS](https://cds.climate.copernicus.eu/datasets/sis-energy-derived-reanalysis)) | Avoid; use PECD or the global successor |
| Renewables.ninja data | Ready-made wind and solar output | **CC BY-NC 4.0** ([Renewables.ninja](https://renewables.ninja/downloads)) | **Barred.** Calibration use for a commercial game is doubtful under "NC"; ask the team or skip |
| GSEE (solar) and VWF (wind) code | The models behind Renewables.ninja | BSD-3-Clause [fetched] ([GSEE](https://raw.githubusercontent.com/renewables-ninja/gsee/master/README.md)); VWF's `power_curves` folder excluded | Rebuild "ninja-style" profiles from ERA5 offline |
| atlite, PyPSA, oemof | Conversion and modelling tools | MIT [fetched] ([atlite](https://raw.githubusercontent.com/PyPSA/atlite/master/README.rst)) | Offline tools only |
| PyPSA-Eur assembled dataset | Ready-made European model data | Mixed: includes non-commercial and no-redistribution inputs [fetched] | Never ship wholesale |
| Global Wind Atlas 3 | Long-term site wind map | CC BY 4.0 with a long mandatory credit ([World Bank](https://datacatalog.worldbank.org/search/dataset/0038957/global-wind-atlas)) | Ship as a site-quality layer |
| Global Solar Atlas 2 | Long-term site solar map | CC BY 4.0 **plus an unread "mandatory and binding addition"** ([Solargis](https://solargis.com/maps-and-gis-data/download/world)) | Read the addition first |
| PVGIS, EMHIRES (JRC) | Solar and wind series | PVGIS: "free for public use if the source is acknowledged", no explicit commercial clause ([JRC](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/pvgis-5-tools/hourly-radiation_en)); EMHIRES licence not retrieved | Check before any use |
| ENTSO-E Transparency, OPSD | Load, generation, prices from 2015 | ENTSO-E has a free re-use list, but PyPSA-Eur records its demand data as licence "unknown" [fetched] | Calibration only |
| Energinet (Energi Data Service) | DK, DE, SE and NO prices and data | **CC BY 4.0, commercial use explicit** ([licence](https://www.energidataservice.dk/Conditions_for_use_of_Danish_public_sector_data-License_for_use_of_data_in_ED.pdf)) | Ship as "real history" reference charts |
| Elexon BMRS (GB) | British market data | Open licence, commercial use explicit, mandatory credit ([Elexon](https://www.elexon.co.uk/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/)) | Ship GB reference charts |
| Ember; Eurostat balances; powerplantmatching | Capacity, generation, demand, plant vintages | CC BY 4.0 ([Ember](https://ember-energy.org/data/electricity-data-explorer/)); Eurostat and powerplantmatching per PyPSA-Eur's inventory [fetched] | Script the historical fleet and demand |
| World Bank Pink Sheet | Monthly fuel prices since 1960 | CC BY 4.0 (two secondary sources) | Ship |
| DEA Technology Data; NREL ATB | Plant parameters, costs, projections | CC BY 4.0 | Ship |
| IRENA | Historical cost trajectories | Free reuse with "© IRENA [year]"; third-party material excluded | Ship IRENA's own figures |
| Nord Pool, EPEX/EEX, OMIE, Lazard, BNEF | Prices, cost benchmarks | Paid or proprietary; OMIE allows attributed use, but commercial redistribution is unconfirmed ([OMIE](https://www.omie.es/en/file-access-list)) | Calibration facts only, where terms permit |

**The credits screen** — a draft for legal review, not legal advice — needs the Copernicus CC BY notice in the exact wording on the dataset page, the full Global Wind Atlas sentence, the Global Solar Atlas credit and its addition, "Source: Energinet", "Contains BMRS data © Elexon Limited copyright and database right [year]", credits for Ember, the World Bank, the Danish Energy Agency, NREL and "© IRENA [year]", and the BSD and MIT notices for any reused code. A short review by an IP lawyer should also cover EU database rights in parameters calibrated on ENTSO-E data.

## Four policy eras give every decade a new problem

### Real policy history already reads like a difficulty curve

Europe went from national monopolies to a coupled, liberalised and increasingly renewable market. Each step changed how an independent producer got paid, which makes a natural era structure. The era names below are design labels; the facts are sourced.

| Era | Defining facts | New problem for the player |
|---|---|---|
| **1990–1999 "Monopolies crack"** | The England and Wales Pool opened on 31 March 1990 ([EPRG](https://jbs.cam.ac.uk/wp-content/uploads/2023/12/eprg-wp26.pdf)). Germany's feed-in law (StrEG) took effect on 1 January 1991, paying wind and solar **90%** of the previous year's mean revenue per kWh ([IEA](https://www.iea.org/policies/3477-electricity-feed-in-law-of-1991-stromeinspeisungsgesetz)). Nord Pool formed in 1996; Denmark joined in 1999–2000 ([Wikipedia](https://en.wikipedia.org/wiki/Nord_Pool)). Cooperatives owned about **50% of Danish wind** in the 1980s and early 1990s ([Green Economy Coalition](https://www.greeneconomycoalition.org/news-and-resources/people-power-denmarks-energy-cooperatives)). The first offshore farm opened in 1991 ([Vindeby](https://en.wikipedia.org/wiki/Vindeby_Offshore_Wind_Farm)). | Permits, finance, grid access and unreliable small turbines; flat tariffs keep variance low |
| **2000–2009 "Feed-in gold rush"** | Germany's EEG fixed tariffs for **20 years** from 2000 ([wind-works.org](https://wind-works.org/evolution-of-feed-in-tariffs/)). Italy's first PV premium paid **€0.445–0.490/kWh** in 2005–06 ([IEA](https://prod.iea.org/policies/4902-old-feed-in-premium-for-photovoltaic-systems-i-ii-iii-iv-conto-energia)). Spain's 2007 decree (RD 661) triggered a rush ([Renewable Energy Magazine](https://www.renewableenergymagazine.com/panorama/espana-pierde-su-primer-arbitraje-internacional-por-20170505)). The EU carbon price crashed to about €0 in 2007 ([CER](https://www.cer.eu/publications/archive/bulletin-article/2009/carbon-price-collapse-threatens-eus-climate-agenda)). France, Belgium and the Netherlands coupled their markets in 2006 ([EPEX SPOT](https://epexspot.com/en/news/10-years-first-market-coupling-initiative-tlc)). Germany saw its **first negative price in October 2008** ([MPRA](https://mpra.ub.uni-muenchen.de/31834/1/MPRA_paper_31834.pdf)). | Lock in rich tariffs before the caps arrive; carbon volatility; the first negative hours |
| **2010–2019 "The hangover"** | Central-West European coupling went live in 2010 ([TenneT](https://www.tennet.eu/nl-en/markets/dutch-market/market-coupling)). Spain made retroactive PV cuts in 2010–2013 ([pv magazine](https://www.pv-magazine.com/2013/02/21/spain-publishes-retroactive-pv-fit-cuts_100010298/)) and lost the first arbitration case in 2017 ([Energías Renovables](https://www.energias-renovables.com/panorama/espana-pierde-su-primer-arbitraje-internacional-por-20170505)). Italy's €6.7bn-a-year cap closed its PV scheme in 2013. After Fukushima, Germany accelerated its nuclear exit ([Enerdata](https://www.enerdata.net/publications/daily-energy-news/germany-shuts-down-its-last-remaining-nuclear-reactors-4-gw.html)). | Policy and retroactivity risk; growing exposure to the market |
| **2020–2026 "Volatility"** | German day-ahead power hit **€552/MWh** on 17 August 2022, and French futures topped €1,100 ([AleaSoft](https://aleasoft.com/price-records-european-electricity-markets-after-highs-gas/)). The EU capped "inframarginal" revenues at **€180/MWh** ([Ashurst](https://www.ashurst.com/en/insights/emergency-legal-measure-in-the-energy-sector/)). Spain and Portugal capped the gas price used for power at €40/MWh ([Columbia CGEP](https://www.energypolicy.columbia.edu/wp-content/uploads/2023/05/Iberian-Exception_Commentary_CGEP_051723-2.pdf)). Germany's Dunkelflaute pushed prices to **€936/MWh** on 12 December 2024 ([Bundesnetzagentur](https://www.bundesnetzagentur.de/SharedDocs/Pressemitteilungen/EN/2025/20251021_Preisspitzen.html)). Day-ahead trading moved to **15-minute products on 1 October 2025** ([OTE](https://www.ote-cr.cz/en/about-ote/ote-news/market-coupling-steering-committee-confirms-go-live-of-15-minute-mtu-in-sdac-on-trading-day-30-september-2025-for-delivery-day-1-october-2025)). The EU logged **1,223 negative-price hours in Q1 2026**, and Spain alone **347, or 16% of all hours** ([pv magazine](https://www.pv-magazine.com/2026/05/08/europes-negative-electricity-price-hours-double-in-q1-amid-renewables-surpluses-market-imbalances/)). | Volatility, storage, collapsing capture prices, windfall clawbacks, stability rules |
| **2027 onward** [speculative] | Two-way CfDs become the default for new subsidised low-carbon plants from about July 2027 ([Cuatrecasas](https://www.cuatrecasas.com/en/spain/energy-infrastructure/art/reform-european-electricity-market-design)). SMRs are planned for the early 2030s. The Bornholm energy island is due to deliver power from 2034. | First-of-a-kind delays, offtake risk, experimental bets |

These facts translate directly into rules. **Negative prices** are impossible before late 2008, then rare and wind-driven in Germany, then frequent in sunny markets by the mid-2020s. Spain's 16% is the high-end benchmark. **The windfall clawback** above €180/MWh applies only from December 2022 to June 2023 in history mode. **15-minute trading** unlocks after October 2025 and raises the value of fast storage. **The subsidy windfall** is itself a teaching moment. Italy's first PV premium was about **ten times** 2024's global PV cost of $0.043/kWh [calc]. That makes rooftop PV in 2005–2012 the most lucrative small-player asset, with a matching retroactivity risk. **Battery arbitrage** stays unaffordable while system costs exceed $2,000/kWh, before about 2015. It turns strongly profitable around 2021–2024, when price spikes and negative hours coexist with falling costs. No sourced return (IRR) data by era was found. The return bands in the notes are design suggestions, to be tuned in playtests.

### The tech tree runs from a 33 kW prototype to 15 MW giants

Unlock dates follow real anchors. The experimental tier follows the real, mixed record of first-of-a-kind projects. Maturity judgements are the history researcher's own.

| Technology | Real anchor | Suggested role in the game |
|---|---|---|
| Small onshore wind | Vestas' first V10 was **33 kW** in 1979 ([Wikipedia](https://en.wikipedia.org/wiki/Vestas)); Vindeby used 450 kW turbines in 1991 | Starting technology, 1990 |
| Solar PV | Modules fell from **$106/W (1976) to about $0.10/W**, a 24.9% learning rate ([pv magazine USA](https://pv-magazine-usa.com/?p=13146)); utility PV's levelised cost fell **90% from 2010 to 2024**, to $0.043/kWh ([IRENA](https://www.irena.org/Publications/2025/Jun/Renewable-Power-Generation-Costs-in-2024)) | Available from 1990 but very expensive; boom from 2005 |
| Multi-MW onshore wind | $1,041/kW and $0.034/kWh in 2024 (IRENA) | Size tiers from about 2000; the 1990–2025 size progression is [unverified] |
| Fixed offshore wind | Vindeby: 4.95 MW at about a **22%** capacity factor [calc]. He Dreiht in 2025: **15 MW** Vestas V236 turbines at about **61%** [calc] ([Recharge](https://www.rechargenews.com/suppliers/vestas-powers-up-first-of-its-huge-flagship-offshore-wind-turbines/2-1-1906824)) | Demo in 1991, then "turbine generation" tiers; output per turbine grew about 180-fold [calc] |
| Floating wind | Hywind Demo 2.3 MW in 2009; Hywind Scotland 30 MW in 2017 ([Wikipedia](https://en.wikipedia.org/wiki/Hywind_Scotland)) | Late offshore tier |
| Li-ion batteries | System cost **$2,571 → $192/kWh** (2010–2024) ([IRENA](https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2025/Jul/IRENA_TEC_RPGC_in_2024_Summary_2025.pdf)); stationary packs **$70/kWh** in 2025 ([BNEF](https://about.bnef.com/insights/clean-energy/lithium-ion-battery-pack-prices-fall-to-108-per-kilowatt-hour-despite-rising-metal-prices-bloombergnef/)) | Niche in the mid-2010s, mainstream by about 2020 [speculative]; costs approach a materials floor |
| Hydro | Levelised cost $0.057/kWh in 2024 (IRENA); pumped-storage and Nordic reservoir figures are [unverified] | Run-of-river, reservoir and pumped storage with water values |
| Large nuclear | Olkiluoto 3 took **2005–2023** at about **€11bn** ([NEI Magazine](https://www.neimagazine.com/news/final-takeover-of-ol3-complete/)); Flamanville 3 cost **€23.7bn against €3.3bn planned** ([ANS](https://www.ans.org/news/2025-12-17/article-7625/flamanville3-reaches-full-power/)) | A megaproject mechanic with delay and overrun risk, roughly €7–14bn/GW [calc] |
| SMRs | Rolls-Royce SMR contract for three units (~1.4 GWe) at Wylfa; press release dated 13 April 2026, though another source's URL suggests January 2026 ([Rolls-Royce](https://www.rolls-royce.com/media/press-releases/2026/13-04-2026-rr-welcomes-contract-with-uk-government-for-delivery-of-small-modular-reactors.html); [NucNet](https://www.nucnet.org/news/rolls-royce-smr-signs-landmark-agreement-for-three-reactors-at-wylfa-4-1-2026)) | Early 2030s, carrying first-of-a-kind risk |
| Compressed air (CAES) | Huntorf, 1978: 290 MW at about 42% efficiency ([PDH Online](https://pdhonline.com/courses/e365/e365content.pdf)) | Niche storage, available from the start |
| **Liquid-air ("cryogenic") storage** | Highview's 300 MWh Carrington plant targets 2026–27 (sources differ); 2.5 GWh is planned at Hunterston ([UKRI](https://www.ukri.org/who-we-are/how-we-are-doing/research-outcomes-and-impact/energy-storage-innovation-powers-highview-scale-up/)) | The brief's "cryo storage": experimental from about 2026 |
| Gravity storage | Rudong, 25 MW / 100 MWh, 2023–24 ([Business Wire](https://www.businesswire.com/news/home/20240507725790/en/Energy-Vault-Announces-Successful-Testing-and-Commissioning-of-First-EVx-100-MWh-Gravity-Energy-Storage-System-by-China-Tianying-Extension-of-Atlas-Renewable-Licensing-Agreement-to-15-Years)) | Experimental |
| Tidal stream | MeyGen first power November 2016, 1.5 MW turbines ([Wikipedia](https://en.wikipedia.org/wiki/MeyGen)) | Experimental from 2016 |
| **Wave** | Pelamis' 2.25 MW Aguçadoura farm went offline in 2008; the company entered administration in 2014 ([Wikipedia](https://en.wikipedia.org/wiki/Pelamis_Wave_Power)) | The brief's "wave": experimental with high failure risk |
| **Power-to-X** | Kassø e-methanol (42,000 t/yr) inaugurated 13 May 2025 ([European Energy](https://europeanenergy.com/2025/04/03/kasso-e-methanol-facility-produces-industry-grade-e-methanol-for-the-first-time/); [LEGO Group](https://www.lego.com/aboutus/news/2025/may/kass-e-methanol-facility-officially-inaugurated)); FlagshipONE cancelled in 2024 for lack of offtake "at a viable price" ([S&P Global](https://spglobal.com/commodityinsights/en/market-insights/latest-news/energy-transition/081524-orsted-scraps-swedish-flagshipone-e-methanol-project-under-development)) | Experimental from 2025; offtake contracts decide success |
| Airborne wind; energy islands | Makani shut in 2020 and Ampyx went bankrupt in 2022 ([Data Center Knowledge](https://www.datacenterknowledge.com/google-alphabet/google-shuts-down-its-moonshot-wind-energy-unit-makani); [Silicon Canals](https://siliconcanals.com/ampyx-power-bankrupt-wind-energy-technology/)); Bornholm agreed in January 2026, power from 2034, with a €645.2m EU grant ([Danish ministry](https://www.en.kefm.dk/news/news-archive/2026/jan/milestone-reached-denmark-and-germany-conclude-bilateral-agreement-to-invest-in-bornholm-energy-island-and-strengthen-european-energy-security)) | Experimental failure risk; late-game megaproject |

**Experimental technology should arrive as "the next model", not a sci-fi jump**, the way Transport Tycoon introduced its monorail and maglev. Prototypes start small, costly and unreliable, improve with deployment, and carry an explicit chance that the vendor collapses, calibrated to Pelamis, Makani, Ampyx and FlagshipONE.

**Extrapolation past 2026 is speculative.** Two more doublings of cumulative PV shipments at a 24.9% learning rate would cut module prices by about 44% [calc]. Offshore nameplate grew about 11% a year from 1991 to 2025. A slowdown to 3–5% a year implies 20–25 MW turbines by about 2035–2040 [speculative]. Fusion and enhanced geothermal belong only as optional bets that can fail. After the present day, players should choose between a scripted "historical continuation" and seeded "alternate history" runs.

### A dated event deck turns real crises into set pieces

| Event | Real date and magnitude | Suggested game effect |
|---|---|---|
| Storm Lothar | 26 December 1999; more than 3 million households without power; over €15bn in losses, €8.6bn insured ([Swiss Re](https://www.swissre.com/risk-knowledge/mitigating-climate-risk/winter-storms-in-europe/storms-lothar-martin-wreak-havoc-across-europe.html)) | Lines down for days; insurance as a purchasable mitigation; cheap biomass from about 200 million m³ of felled timber |
| Italy blackout | 28 September 2003; a line touched a tree in Switzerland; about 56 million people without power for about 12 hours ([Wikipedia](https://en.wikipedia.org/wiki/2003_Italy_blackout)) | An import-dependent zone goes dark; local generation earns a reliability bonus |
| European grid split | 4 November 2006; switching a line off for a ship's passage split the grid into three islands; 15 million+ customers affected ([Wikipedia](https://en.wikipedia.org/wiki/2006_European_blackout)) | Fast frequency response pays; inflexible plants trip |
| Carbon crash; first negative prices | 2007 (about €0/t); October 2008 | Coal margins rise; a "curtail" action unlocks |
| Retroactive cut; subsidy cap | Spain 2010–2013 (more than 48 arbitration claims followed) ([Kluwer](https://arbitrationblog.kluwerarbitration.com/2019/12/30/royal-decree-law-17-2019-an-opportunity-for-spain-to-leave-behind-the-renewable-energy-arbitrations/?output=pdf)); Italy 2013 | Existing tariffs cut; an arbitration claim pays out years later |
| Gas shock and windfall cap | 2021–2023; €552/MWh peaks; a €180/MWh revenue cap | Gas costs multiply, followed by a clawback |
| French corrosion slump | 2022; nuclear output **279 TWh**, the lowest since 1988; France a net importer for the first time since 1980 ([Enerdata](https://www.enerdata.net/publications/daily-energy-news/edfs-power-generation-france-reached-record-low-2022.html); [S&P Global](https://www.spglobal.com/energy/en/news-research/latest-news/electric-power/021723-edfs-new-ceo-confirms-2023-french-nuclear-output-target-despite-further-delays)) | A correlated fleet outage; neighbours' prices spike and exporters profit |
| Serial turbine defect | 2023; Siemens Gamesa's €1.6bn of quarterly charges and €7.5bn of state guarantees ([Siemens Energy](https://assets.siemens-energy.com/dam/b728c2d0-16f7-492f-a6fe-b07401238716/2023-08-07-Press-Release-Q3-FY23-EN-pdf_Original%20file.pdf); [Malay Mail/Reuters](https://www.malaymail.com/news/money/2023/11/16/after-rescue-deal-siemens-energy-unveils-massive-loss/102298)) | Owners of one turbine model lose availability |
| Offshore overreach | Ørsted: DKK 28.4bn impairments (2023); a US stop-work order on an 80%-complete farm and a **DKK 60bn** rights issue (2025) ([CNBC](https://www.cnbc.com/2023/11/01/orsted-axes-two-new-jersey-wind-projects-takes-4-billion-writedown.html); [Euronews](https://euronews.com/business/2025/08/25/orsted-sees-shares-plunge-as-us-halts-work-on-offshore-wind-farm)) | Fixed-price bids turn loss-making when rates rise; political freezes; rival rescues |
| Dunkelflaute | December 2024; **€936/MWh** | The payoff event for batteries, liquid air and peakers |
| Baltic resync | 8–9 February 2025; ran islanded for more than a day ([Interfax](https://interfax.com/newsroom/top-stories/109685/)) | Frequency-reserve prices spike |
| Iberian blackout | 28 April 2025; up to 16 hours. ENTSO-E's chair: "The problem is not renewable energy, but voltage control" ([ENTSO-E](https://entsoe.eu/publications/blackout/28-april-2025-iberian-blackout); [pv magazine](https://www.pv-magazine.com/2026/03/23/entso-e-report-finds-systemic-failures-behind-2025-iberian-blackout/)) | New voltage-control rules; a grid-forming inverter upgrade |
| Negative-price epidemic | Q1 2026; 16% of Spanish hours | Unhedged solar loses value; co-located storage gains |

### Rivals should follow real corporate arcs under invented names

**The best-documented arc is DONG → Ørsted** ([Ørsted](https://orsted.com/en/about-us/history-and-transformation)): a 2006 merger of state fossil and utility companies; an IPO in June 2016; the sale of oil and gas, and a renaming, in 2017; and the 2023–25 overreach and rescue.

**Other arcs.** The Danish turbine industry consolidated when Vestas absorbed NEG Micon and Siemens bought Bonus, both in 2004 ([Wikipedia](https://en.wikipedia.org/wiki/List_of_Danish_wind_turbine_manufacturers)). EDF lost **€17.9bn in 2022** ([Enerdata](https://www.enerdata.net/publications/daily-energy-news/edf-france-posted-eu179bn-loss-2022-lower-nuclear-and-hydro-output.html)).

**Keep the chronology, invent the brands.** Following Game Dev Tycoon, Gridmaster should avoid real company names and logos, with archetypes [speculative] such as "Nordhav Energi", a fossil incumbent turned offshore champion that overextends; "Atomique Nationale", a nuclear champion with correlated outages and 3–7× cost overruns; "Vindsmeden", a turbine maker exposed to serial defects; and start-ups in liquid air, wave and kite power that carry explicit bankruptcy risk. The player's own path mirrors Danish cooperatives and independent developers: community wind, then solar parks, then power-to-X.

## A TypeScript core reaches Steam, the Mac and the phone review loop

### Plain-text, headless, previewable stacks suit AI agents best

Because Lukas directs AI coding agents and reviews from a phone, three properties matter more than raw engine power: everything is plain text, everything builds and tests headless on a standard CI runner with no editor open, and every pull request produces a link that plays on a phone. Ranked against those properties:

| Rank | Stack | Why | Main weakness |
|---|---|---|---|
| 1 | **TypeScript web stack, packaged with Electron for Steam.** Pure-TS simulation in a Web Worker, DOM interface, ECharts or uPlot for charts, SVG or PixiJS for the map | Plain text; a strict typechecker catches agent mistakes; tests run headless in Node. The richest chart ecosystem. The same build runs in a browser. Steam genre precedent: Game Dev Tycoon shipped on node-webkit with greenworks ([NW.js wiki](https://github.com/nwjs/nw.js/wiki/List-of-apps-and-companies-using-nw.js) [fetched]), Bitburner is TypeScript and React on Electron ([bitburner-src](https://github.com/bitburner-official/bitburner-src) [fetched]), and shapez is JavaScript on Electron | **Steam bindings churn.** greenworks has not been published to npm since 2016; steamworks.js has had no release since August 2024; steamworks-ffi-node (0.11.3, September 2026) is young ([steamworks-ffi-node](https://github.com/ArtyProf/steamworks-ffi-node) [fetched]). shapez had to avoid slow JavaScript features in hot loops ([shapez](https://github.com/tobspr-games/shapez.io) [fetched]) |
| 2 | **Godot 4.7 with GDScript** | MIT licence; text scenes; a headless command line (`--headless`, `--check-only`, `--export-release`) ([godot-docs](https://github.com/godotengine/godot-docs/blob/master/tutorials/editor/command_line_tutorial.rst) [fetched]); CI images; GodotSteam (moved to Codeberg in September 2026) | GDScript code exists only for Godot, so training data is smaller. Agents reportedly mix up Godot 3 and 4 [unverified]. Agents can break editor-generated `uid://` references. Charts must be hand-built |
| 3 | Godot 4 with C# | Models know C# well | "Projects written in C# using Godot 4 currently cannot be exported to the web" ([godot-docs](https://github.com/godotengine/godot-docs/blob/master/tutorials/export/exporting_for_web.rst) [fetched]), which kills phone previews |
| 4 | Unity 6 | Free up to $200,000 of revenue and funding; Pro costs $2,310 a year from January 2026 ([Unity](https://unity.com/products/pricing-updates)) | Editor-bound: scenes, `.meta` GUIDs, licence activation in CI. Its MCP bridge needs a running editor ([unity-mcp](https://github.com/CoplayDev/unity-mcp) [fetched]) |
| 5–9 | Defold, MonoGame, Bevy, LÖVE, Unreal | — | Small ecosystems or no built-in UI. Bevy ships breaking changes about every three months ([Bevy](https://github.com/bevyengine/bevy) [fetched]). Unreal is overkill |

The web building blocks are permissively licensed [fetched from npm] — Electron 44.5.1 (MIT), ECharts 6.1.0 (Apache-2.0), uPlot (MIT) and PixiJS 8.22.0 (MIT) — and Electron beats Tauri, which renders through the system web view (WebKitGTK on Linux and the Steam Deck) and has no proven Steam-overlay path [unverified]. **Each of these is a dependency Lukas must approve** under the repo rule (open question Q2). Two risks could change the ranking, and both have contained fixes: if the TypeScript market simulation proves too slow, only the market-clearing kernel moves to WebAssembly; if Steam features break under Electron, a small `SteamAdapter` interface isolates the damage while keeping a no-op browser build working and a later move to Godot open.

**AI coding needs no store label.** Since 16 January 2026, Steam requires disclosure only of AI-generated in-game content, store and marketing assets, and content generated live during play ([Slashdot](https://games.slashdot.org/story/26/01/19/1735231/valve-has-significantly-rewritten-steams-rules-for-how-developers-must-disclose-ai-use); [Notebookcheck](https://www.notebookcheck.net/Steam-updates-AI-disclosure-form-requiring-developers-to-report-visible-and-in-game-AI-but-not-background-tools.1206103.0.html)). The agent workflow itself triggers nothing.

### A deterministic simulation library makes agent work checkable from a phone

**The game should be a headless simulation library, separate from the interface**: a fixed timestep of one game hour, since *Game Programming Patterns* warns that a variable time step "makes gameplay non-deterministic and unstable" ([game-loop chapter](https://github.com/munificent/game-programming-patterns/blob/master/book/game-loop.markdown) [fetched]); a seeded random-number generator whose state is saved; no wall-clock time or engine calls inside the simulation; money in integer cents and collections iterated in ID order; content as schema-checked CSV, YAML or JSON ([type-object chapter](https://github.com/munificent/game-programming-patterns/blob/master/book/type-object.markdown) [fetched]); versioned saves with pure migration functions tested against a fixture save from every past version; and a lint rule that forbids the simulation from importing anything else.

**Every pull request runs** (1) a typecheck with unit and property tests (fast-check 4.10.2, MIT [fetched]), (2) a seeded headless smoke run, (3) a web build deployed to a preview URL, and (4) screenshots of the map, the market chart and the build menu. A nightly job runs bot players across many seeds, checks invariants — energy balances every hour, prices stay between floor and cap, cash moves only through modelled flows, no NaN values appear — and charts KPIs that read well on a phone: median net worth by 2010 and 2030, the share of bankrupt runs, renewable share and price volatility. Agents cannot judge feel, so every interface change also needs a human taste check.

**One determinism caveat.** JavaScript's maths functions may differ in the last bits between Chrome's and Safari's engines [unverified]. Golden-hash tests should therefore run in Node only. The phone build follows the same rules without being bit-identical.

**The map must come from a commercially clean source:**

| Source | Licence | Use |
|---|---|---|
| Natural Earth | Public domain ([natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) [fetched]) | **The safe base.** Merge regions into zones, simplify, and project to an equal-area map |
| Eurostat GISCO boundaries | "not … for commercial purposes"; commercial use needs a EuroGeographics licence ([eurostat package](https://github.com/rOpenGov/eurostat/blob/master/R/eurostat-package.R) [fetched]) | **Barred** |
| geoBoundaries | CC BY 4.0 / ODbL ([geoBoundaries](https://github.com/wmgeolab/geoBoundaries) [fetched]) | ODbL is share-alike, so it needs Lukas's written approval under the repo rule |

How Natural Earth draws disputed borders (Cyprus, Kosovo, Crimea) has not been checked.

**A diagrammatic "control-room" look** fits a chart-and-map sim, and agents can build it in code from Kenney assets (CC0) and game-icons.net (CC BY 3.0 or CC0; [licence](https://github.com/game-icons/icons/blob/master/license.txt) [fetched]). Money belongs where conversion happens: capsule art, logo, trailer and music. AI-generated store or in-game art would carry Steam's disclosure label and invite reviews about AI instead of the game.

### Steam asks $100, 30 days and one Next Fest

These rules come from search extracts of Steamworks pages, which were blocked (marked † in the notes). Re-check them before acting.

| Item | Rule | Implication |
|---|---|---|
| Fee | **$100 per app**, recouped after $1,000 of adjusted gross revenue; a **30-day wait** between paying and releasing ([Steamworks](https://partner.steamgames.com/doc/gettingstarted/appfee)) | Pay early so the clock and the identity and tax checks run in parallel |
| Store page | "Coming Soon" for **at least two weeks** before release; review takes 3–5 business days, so submit 7 business days ahead ([Steamworks](https://partner.steamgames.com/doc/store/coming_soon)) | Open it as soon as the capsule art and trailer exist, to collect wishlists |
| Playtest | A free child app; keys can be distributed before the store page is live ([Steamworks](https://partner.steamgames.com/doc/features/playtest)) | Use for closed testing |
| Next Fest | **Once per game**, with a public demo. The October 2026 edition runs 19–26 October; February and June 2027 editions are documented ([Steamworks](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest)) | June 2027 at the earliest; registration closes about seven weeks before |
| Early Access | No promises about the future; never priced higher than elsewhere; **no discount within 30 days of a price increase**, including at the move to 1.0 ([Steamworks](https://partner.steamgames.com/doc/store/earlyaccess)) | Plan the 1.0 price step around this |
| Launch discount | 7–14 days, at most 40% off. The 40% cap comes from a secondary source ([Steam Page Analyzer](https://www.steampageanalyzer.com/blog/steam-discount-rules-2026)) | — |
| Revenue share | Valve takes **30%**, falling to 25% above $10M and 20% above $50M ([TechCrunch](https://techcrunch.com/2018/12/03/valve-changes-revenue-sharing-tiers-on-steam/embed/)) | Plan on about 70% of net sales |
| Steam Deck | "Verified" requires full controller access and text of at least **9 px at 1280×800** ([Steamworks](https://partner.steamgames.com/doc/steamhardware/compat)) | Design at 1280×800 from day one; aim for "Playable" first |

Three costs and obligations remain unverified and need an accountant or the primary pages: macOS signing and notarisation through Apple's developer programme; Danish business set-up, including tax status, US tax forms and the VAT threshold; and the EU "trader" declaration, which may publish an address and phone number on the store page.

### Mobile: use the phone for review and demos, not as a launch platform

Windows and macOS are requirements (decision D4), and mobile counts only if it proves better. **The evidence says it is not better at launch**, for four reasons. The audience is wrong: the buyer is a premium PC strategy player. Mobile's energy slot is held by a free player-versus-player game with 150,000+ pre-registrations, so a paid single-player sim would compete against free. The interface is wrong: the main screens are dense charts and a map. Steam's own legibility floor for a handheld is 9 px text at 1280×800, and phones are smaller still. Power Grid's maths-heavy mobile app sits at 2.5 stars. The engineering costs too much: Godot's documentation, for example, says web builds run on mobile "with some caveats" and that native builds "will always perform better by a significant margin" ([godot-docs](https://github.com/godotengine/godot-docs/blob/master/tutorials/export/exporting_for_web.rst) [fetched]). Separate stores, certification and touch interaction would add scope a solo developer cannot afford under decision D5 [speculative]. And the evidence from ports is thin: Game Dev Tycoon's iOS launch sold 1,463 copies on day one ([Game Developer](https://www.gamedeveloper.com/business/game-dev-tycoon-ios-release-day-1-report-a-rough-start)), a single weak data point. Turmoil reached iOS, Android and Switch only after its PC release ([Playdigious](https://playdigious.com/press/sheet.php?p=turmoil)), which is the safer order.

**The steelman for mobile:** the theme has proven mobile demand, and a web stack makes a later tablet port comparatively cheap. That is why the recommendation is *computers first, tablets reassessed after the PC launch* (open question Q3), not *never*.

**The phone still matters now, as a browser.** The same build runs there for Lukas's reviews and as a free web demo; Bitburner and shapez likewise pair their Steam releases with browser versions.

### First release: ten zones, four decades, one polished loop

Scope has to respect a hard fact: for most games, the first paid launch is the big one. Only 20% of Early Access graduates earned more at 1.0. Power Network Tycoon took about three years from store page to 1.0, and Big Ambitions spent about 3.5 years in Early Access. Cities: Skylines II shows what an unfinished economy costs. Turmoil and Rise of Industry show that adding maps does not fix repetitive strategy.

The answer is a small first release that is fully polished, with depth instead of breadth. The table is the research's concrete proposal [speculative; for Lukas's decision Q4]:

| Area | In the first release | Deferred to updates or DLC |
|---|---|---|
| Map | About **10 zones** with contrasting weather and markets: DK1, DK2, Germany, Netherlands, Belgium, France, Great Britain, Norway, Sweden, Spain. This covers wind, hydro, a nuclear neighbour and solar with negative prices | The full 30–40-zone Europe, as map packs (Power Grid proved that model) |
| Time | A **1990–2030 campaign** in four era chapters with medal goals, plus a sandbox that runs on to 2050 on resampled weather | Most of the 2030–2060 speculative tree |
| Simulation | Hourly zonal merit order: interconnector limits, scarcity pricing, negative bids, hydro water values, rule-based storage. Regulated-tariff mode switching to market mode. Policy cards: feed-in tariff, then premium, then auctions and CfDs. Fuel and carbon paths | 15-minute products, ancillary-service markets, retail tariffs, flow-based coupling |
| Technology | Small and multi-MW onshore wind, rooftop and utility solar, fixed offshore wind, Li-ion batteries, run-of-river, reservoir and pumped hydro, large nuclear as a megaproject. **Three experimental bets: liquid-air storage, power-to-X with offtake contracts, and wave power with failure risk** | Floating wind, tidal, CSP, compressed-air and gravity storage, airborne wind, SMRs, fusion, energy islands |
| Rivals and finance | Three AI archetypes competing for sites, auctions and grid slots; loans across interest-rate eras; a policy-risk meter | Stock market, hostile takeovers, multiplayer |
| Events and modes | About 15 dated historical events with randomised variants; 2–3 crisis scenarios (the 2022 gas shock, the 2024 Dunkelflaute, storm Lothar); three difficulty presets plus individual toggles | Seeded weekly challenges, Workshop data-pack mods (designed for, shipped later) |
| Platforms and languages | Windows and macOS on Steam; Linux and Deck "Playable" if cheap; English first, then probably German [speculative] | Mobile and tablet, a controller-complete "Verified" interface, more languages |
| Presentation | Diagrammatic map and charts, one icon set, commissioned capsule art, logo and trailer, licensed music | 3D views, animated plants |

**Each phase should earn the next.** (1) A **one-zone prototype of the panel-to-market loop** tests whether cannibalisation feels like a puzzle rather than a punishment. (2) Only then does the slice grow to ten zones. (3) Steam Playtest keys open closed testing. (4) A Coming Soon page goes live as soon as the art exists. (5) One Next Fest follows, June 2027 at the earliest. (6) Launch happens only with about 10,000 or more wishlists and a polished slice.

## "Gridmaster" is taken on Steam, and its replacement awaits clearance

**"Gridmaster" cannot be the public title as things stand.** Steam's app list [fetched] already holds three close matches ([jsnli/steamappidlist](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json)): an app titled exactly **"Gridmaster"** (app 2678560, store data last changed December 2023); **"Grid Masters"** (449330, 2016); and **"Hover Idle: Grid Master"** (5209990), an idle game active in September 2026, at the opposite end from the intended mature positioning.

What app 2678560 actually is could not be seen, because its store page was blocked. The name also has software uses: PyPI's `gridmaster` is an AutoML framework ([PyPI](https://pypi.org/pypi/gridmaster/json) [fetched]), and npm has `grid-master` ([npm](https://registry.npmjs.org/grid-master) [fetched]). Decision D3 already records that the public name must differ.

**The name also fits the game poorly** [fetched counts across 275,016 Steam entries]. "Grid" mostly signals racing on Steam: 73 entries begin with it, led by the GRID franchise. "Master" appears in **880** entries. Neither word says renewables, Europe, history or trading. The everyday German and Danish words for the power network are "Netz" and "elnet" [unverified]. Keeping "Gridmaster" as an in-game rank ("become Europe's Gridmaster") preserves it at no risk.

Management games name themselves with a genre suffix (Game Dev Tycoon, Software Inc.), an evocative coined or single word (Turmoil, Factorio, Frostpunk), or an ownable title plus a descriptive subtitle (Kapital: Sparks of Revolution, and the energy rivals ARCWATT: Power Empire and COALCOM: Power Station).

**The hybrid fits best: "<ownable title>: A European Energy Tycoon".** No Steam game is titled "Energy Tycoon" [fetched], so the subtitle would own that search phrase while the title stays protectable. Avoid words rivals already use: Manager, Empire, Corp./Company, Baron, and Tycoon as a main title.

**The shortlist below is grouped by type, not ranked**, because the naming decision is deferred (D3). Every option is clean as a Steam title on 4 October 2026 [fetched]. **None has been checked against trademark registers, app stores, itch.io, Google, YouTube, domains or company registers.**

| Option | Type | Package registries [fetched] | Strengths | Risks |
|---|---|---|---|---|
| **Supergrid** | Industry term | npm taken; PyPI free | Names the pan-European interconnected grid, a natural endgame; implies growth from panels to a continent | Established policy term; organisations using it likely exist [unverified] |
| **Terawatt** | Unit word | Free on both | Continental scale; the kilowatt-to-terawatt arc; spelled the same in English, German and Danish | Possible existing companies [unverified] |
| **Megawatt** | Unit word | Free on both | Instantly says "energy"; easy everywhere | Heavy web noise; hard to own |
| **Watt Street** | Pun | Free on both | The only name that foregrounds trading, the game's differentiator | Tone may read lighter than "mature" |
| **Merit Order** | Market term | Free on both | The authentic mechanism of European power prices; signals depth | Jargon; can be misread as "Order of Merit" |
| Baseload / Duck Curve | Insider terms | Free on both | Serious (Baseload) or playful and battery-themed (Duck Curve) | English-only jargon; cute tone; "duck curve" originated in California [unverified] |

**Dropped because they are already Steam titles** [fetched]: "Windfall" (four titles); Power to the People, Keep the Lights On, PowerShift, Load Factor, Dispatch, Inertia, Electrify, Current, Surge; and crowded words such as "Blackout" (58 entries) and "Volt" (11). Several still make good in-game labels: a "windfall tax" event, "Black Start" and "Dunkelflaute" events, and a "Grid Parity" milestone.

**When naming resumes, five criteria apply:** (1) a clean exact match on Steam, itch.io and the app stores; (2) a professional trademark clearance in Nice classes 9, 41 and 42 (EUIPO, TMview including the Danish and German offices, WIPO, USPTO), which this report is not; (3) available domains and social handles; (4) a native German and Danish read; and (5) a subtitle that carries the genre. Changing the name costs least now, before a Coming Soon page starts collecting wishlists under it.

## Conclusion

**One mechanism does three jobs.** A zonal merit-order price produced by the simulation delivers the realism the target audience pays for, reproduces the difficulty curve history already wrote — flat tariffs, then cannibalisation, then the volatility that makes storage pay — and counters dominant strategies and the late-game snowball, because overbuilding anything erodes its own price. The project's central risk is therefore not the amount of content but whether that single loop reads as a puzzle rather than a punishment, which a one-zone prototype can test cheaply before Europe is built. The first attempt's two problems also have answers now: price becomes an *output* of the simulation rather than an input, and since July 2025 the real weather it consumes can ship in a commercial game, provided it comes from Copernicus rather than Renewables.ninja.

**The market case is real but modest.** The slot between idle energy games and engineering sims holds no verified rival, yet it is filling with small titles, so distinctiveness wins it rather than speed: market realism, European geography, history, and polish that survives the hour-40 test. At about $20, the plan should assume tens of thousands of dollars, not millions. Three uncertainties should gate the next money and content decisions: no sales data exists for any energy-specific game, no playtest yet shows that cannibalisation is fun, and every licence and trademark fact is extract-level.

## What a follow-up verification pass must check, in priority order

Checks are ordered by what they block first. Those that confirm the report's core thesis or gate the first commits come before those needed only at launch or in the content phase.

| # | Check | Why it ranks here | How |
|---|---|---|---|
| 1 | **Competitor reality.** Open the store pages, review counts, prices and descriptions of Power Network Tycoon, GridEnergy, the Steam "Energy Manager" (3814290), ARCWATT: Power Empire, PowerCorp, Prestige Electric Company, Nuclear Engineer Tycoon, 电网大亨, Wind Giants, Load Factor and Power to the People. Check whether any models wholesale prices, cannibalisation or storage arbitrage. Also check Energy Manager's business model and installs, and whether Turmoil or Rise of Industry 2 add energy markets | The "empty slot" thesis rests on names and store blurbs; no review or sales data was collected | Steam, SteamDB, Gamalytic or VG Insights |
| 2 | **Data licences before any dataset is committed:** the CDS/PECD 4.2 licence tab and exact attribution wording; ENTSO-E's free re-use list and terms (load 6.1.A, generation 16.1, prices 12.1.D); the Global Solar Atlas "mandatory and binding addition"; PVGIS and EMHIRES commercial clauses; Eurostat's copyright notice; the World Bank Pink Sheet and Danish Energy Agency licences on the editions used; the NESO licence; OMIE's terms; Natural Earth's terms and its disputed-border variants; whether Renewables.ninja's non-commercial terms permit any calibration use | The repo rule says "licences before content"; a wrong call forces data to be rebuilt or removed | Read each live licence page, record it in `docs/licences.md`, and get a short IP-lawyer review covering EU database rights and CC BY credits in games |
| 3 | **Stack facts for approval (Q2):** Electron's Steam overlay and input on macOS, Linux and Steam Deck; the stability of steamworks-ffi-node or a maintained steamworks.js fork; GodotSteam's coverage on Codeberg; Godot 4.7 release notes; cross-engine determinism of JavaScript maths; Electron's size and memory; any named, commercially successful AI-coded Steam game | Approving the stack is the next open decision | A one-week technical spike plus primary docs |
| 4 | **Calibration targets for the market model:** Hirth (2013) market-value factors; negative-price hours by country, 2015–2025; the price floor and cap in EU day-ahead coupling (SDAC); Dunkelflaute frequency and cross-country correlation; capacity factors by era; annual wholesale averages; annual ETS averages; pre-liberalisation tariff levels (the Danish 85% rule, UK NFFO, EEG rates) | The prototype's credibility depends on matching real price shapes | Journals; Energinet, Elexon and ENTSO-E data (calibration only); policy texts |
| 5 | **Steamworks and Apple rules from primary pages:** fee and waiting period, Coming Soon and review times, Next Fest 2027 dates and deadlines, Playtest, Early Access and discount rules (including the 40% launch cap), the AI content-survey wording after 16 January 2026, Deck compatibility, Apple developer membership cost and notarisation | Dates and money in the roadmap depend on them; all were search extracts | Steamworks partner documentation; Apple developer site |
| 6 | **Danish business, tax and privacy set-up:** onboarding as an individual or a company; US tax forms and the treaty rate; sole proprietorship versus hobby income; the VAT threshold (believed DKK 50,000); whether the EU trader declaration publishes Lukas's address and phone number | A legal and financial obligation before the Steam fee is paid | Accountant or Skat |
| 7 | **Market figures:** GameDiscoverCo tag medians (date, definitions); the meaning of Zukowski's 6.4% versus 3.4%, and the conflicting 0.5%; third-party sales estimates against Gamalytic or VG Insights; the date of Big Ambitions' 1.1M; Steam language shares for the localisation order; wishlist-to-sales conversion; the creator list | They inform price, budget and localisation, not whether to build | Primary newsletters; Gamalytic; Steam Hardware & Software Survey |
| 8 | **Name clearance** (deferred by D3, but due before any public use): what Steam app 2678560 is; trademark searches per finalist (EUIPO, TMview incl. DKPTO and DPMA, WIPO, USPTO; classes 9, 41, 42); itch.io, App Store, Google Play and consoles; Google and YouTube noise; domains and handles; CVR, Handelsregister and Companies House; native German and Danish reads; the unverified cautions on Supergrid, Terawatt and Duck Curve | A collision is already proven on Steam; rebranding after wishlists is costly | Trademark attorney; manual store searches |
| 9 | **History and technology gaps and conflicts:** onshore turbine sizes 1990–2025; Horns Rev 1 and other offshore milestones; pumped hydro and Nordic reservoir data; CSP plants; heatwaves, droughts, cold snaps, cyber and sabotage events; utility arcs (RWE, E.ON, Iberdrola, Enel, Statkraft, the Uniper nationalisation); the conflicts the notes flag: Carrington timing, the Wylfa contract date, the Hinkley impairment, Hornsea 4 figures, EDF's 2022 loss metric, French availability in August 2022, the first negative price (4 or 5 October 2008), Middelgrunden's membership | Needed for the tech tree and event deck, which come after the core loop | Company reports, TSO data, the primary documents behind encyclopedia entries |
| 10 | **Design details:** Power Grid's rule numbers (payment table, resource track, plant market) before they are quoted in design documents; Barrage's conduit rule; the Turmoil and Offworld mechanics listed as unverified; and, above all, whether price cannibalisation is *fun* | Research cannot settle the last item; only the prototype can | Rulebooks; the one-zone prototype and its playtests |
