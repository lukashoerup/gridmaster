# Naming: the "Gridmaster" working title and alternative names

*Checks run 2026-10-04. **Not legal advice**: a professional trademark clearance search is required before any commercial launch.*

*Access in this session was severely limited:*
- *The session's WebSearch quota (200 calls) was already used up before this task started.*
- *The egress proxy blocked Steam, itch.io, both app stores, Google, Bing, DuckDuckGo, Wikipedia, howtomarketagame.com and every trademark register.*

*Steam collisions were therefore checked offline against public mirrors of Valve's app list hosted on GitHub. App-store, Google and trademark checks remain open gaps; they are listed in each Gaps section.*

## Q1. Existing uses of "Gridmaster" / "Grid Master" / "GridMaster" (games, software, companies, trademarks)

### Takeaway
"Gridmaster" is already the **exact title of a Steam app** (appid 2678560). Two near-identical Steam titles also exist:
- "Grid Masters" (2016)
- "Hover Idle: Grid Master", an idle game whose store entry changed in Sep 2026

The name is also used by two unrelated software packages. Several things could **not** be checked in this session: itch.io, Google Play, the App Store, console stores, energy-sector products and companies, and all trademark registers (EUIPO/TMview, WIPO, USPTO).

On the evidence available, "Gridmaster" clashes on the game's main storefront and is unverified everywhere else. It should stay an internal codename, not the release title. This is not legal advice.

### Cited Findings
- **Method.** Steam checks used a public mirror of Valve's store app list. GitHub Actions refreshes it daily from `IStoreService/GetAppList/v1` — [jsnli/steamappidlist README](https://raw.githubusercontent.com/jsnli/steamappidlist/master/README.md).
  - The copy fetched on 2026-10-04 held 190,338 "game" entries, with highest appid 5,358,260 and newest `last_modified` 2026-10-04 04:56 UTC, so it was current — [games_appid.json](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json).
  - It was supplemented by an older all-app snapshot (165,498 apps including DLC, demos and soundtracks; highest appid 2,464,370) built from `ISteamApps/GetAppList/v2` — [dgibbs64/SteamCMD-AppID-List README](https://raw.githubusercontent.com/dgibbs64/SteamCMD-AppID-List/main/README.md), [steamcmd_appid.json](https://raw.githubusercontent.com/dgibbs64/SteamCMD-AppID-List/main/steamcmd_appid.json).
  - The merged set held 275,016 unique appids. It was searched with case-insensitive regexes covering spacing, hyphen and plural variants (e.g. `grid[\s\-_.]*masters?`).
  - "last modified" below is the store-data timestamp in the mirror, not the release date.
- **Exact match on Steam: "Gridmaster"**, appid 2678560, store entry last modified Dec 2023 — [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json). The store page (https://store.steampowered.com/app/2678560/) could not be opened (blocked), so its developer, genre and release status are unknown.
- **Near match: "Grid Masters"**, appid 449330, last modified Jun 2016 — [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json).
- **Near match: "Hover Idle: Grid Master"**, appid 5209990, last modified Sep 2026, so it is active right now — [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json).
- The only other regex hit, "Hack Grid - Master Levels" (appid 1746910), is a false positive — [Steam app list (older all-apps snapshot)](https://raw.githubusercontent.com/dgibbs64/SteamCMD-AppID-List/main/steamcmd_appid.json).
- **Software (Python):** the PyPI package `gridmaster` ("GridMaster") is "A lightweight multi-stage grid search AutoML framework for classifiers" by Winston Wang. Latest version is 0.5.4; source is at github.com/wins-wang/GridMaster — [PyPI JSON API](https://pypi.org/pypi/gridmaster/json) ([project page](https://pypi.org/project/gridmaster/)).
- **Software (JavaScript):** the npm package `grid-master` is "An infinite growing canvas grid that renders smoothly no matter how big it gets" (last modified 2024-02-05) — [npm registry](https://registry.npmjs.org/grid-master). The npm name `gridmaster` (no hyphen) is unregistered (HTTP 404) — [npm registry](https://registry.npmjs.org/gridmaster).

### Inferences
- **The exact-title clash on Steam is the decisive practical problem.**
  - Steam search, wishlists, press coverage and YouTube results would mix the two products.
  - The owner of the earlier app may hold prior-use or registered rights (unknown).
- "Hover Idle: Grid Master" shows the phrase already in use in the casual/idle space, the opposite of the intended mature, realistic positioning.
- Two unrelated software products in two package ecosystems suggest "GridMaster" is a natural generic compound in software (grid search, UI grids). More uses in Nice classes 9 and 42 are likely, possibly including grid-management or utility software. None were verified.
- Changing the title is cheapest now, before a Steam page, domain or trademark filing exists. Keeping "Gridmaster" as an internal codename costs nothing.

### Gaps
- **Hosts blocked in this session** (egress-policy denials, not "no results"):
  - Steam: store.steampowered.com, steamcommunity.com, api.steampowered.com, steamdb.info
  - Other stores and game databases: itch.io, itunes.apple.com (App Store search API), play.google.com, gog.com, store.epicgames.com, mobygames.com, igdb.com, boardgamegeek.com
  - Search and reference: google.com, bing.com, html.duckduckgo.com, en.wikipedia.org, howtomarketagame.com
  - Trademark registers and mirrors: euipo.europa.eu (eSearch plus), tmdn.org (TMview), branddb.wipo.int (WIPO Global Brand Database), tmsearch.uspto.gov, trademarks.justia.com, trademarkia.com
  - GitHub's search API was also refused for this session.
- **Not verified at all:**
  - itch.io, Google Play, Apple App Store, PlayStation/Xbox/Nintendo stores
  - Companies and energy/utility-sector products named GridMaster (e.g. grid-management, SCADA or inverter software)
  - Registered or pending trademarks in EUIPO, TMview (EU national offices, including Denmark's DKPTO and Germany's DPMA), the WIPO Global Brand Database (Madrid system) and USPTO, Nice classes 9 / 41 / 42
- **Unknown:** what Steam app 2678560 actually is (developer, genre, whether released, unreleased or delisted). Check https://store.steampowered.com/app/2678560/ and SteamDB manually.
- **Searches to run before any naming decision:**
  - Look for identical and similar marks, live and dead records.
  - Search terms: "GRIDMASTER", "GRID MASTER", "GRID-MASTER" and phonetic variants.
  - Classes: 9 (downloadable game software), 41 (entertainment / online games) and 42 (software / SaaS). Add 28, 16 and 25 if merchandise is planned.
  - Also check company registers (DK CVR, DE Handelsregister, UK Companies House), domains and social handles.
- **This is not legal advice.** A trademark attorney should run a professional clearance search before any commercial launch.

## Q2. Searchability and fit; how tycoon/management games name themselves; genre words and discoverability

### Takeaway
"Gridmaster" fits the game poorly:
- On Steam, "grid" mostly signals racing (the GRID franchise), puzzles or cyber/arcade themes, not electricity.
- "Master" is one of the most crowded title words (880 Steam entries).
- Neither word says renewables, Europe, history or markets.

Established management games use descriptive genre-suffix names ("X Tycoon", "X Simulator", "X Inc.") or evocative coined or single words ("Turmoil", "Factorio", "Frostpunk"), and often combine them as "Evocative title: descriptive subtitle". That hybrid is the best trade-off for this game.

Google and YouTube crowding could not be measured in this session.

### Cited Findings
- **How crowded common title words are.** These are counts of entries whose title contains the word, across the merged Steam list of 275,016 appids including DLC:

  | Word | Steam entries |
  |---|---|
  | simulator | 5,072 |
  | master | 880 |
  | manager | 782 |
  | empire | 732 |
  | tycoon | 527 |
  | power | 444 |
  | grid | 210 |
  | energy | 137 |

  Sources: [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json), [Steam app list (older all-apps snapshot)](https://raw.githubusercontent.com/dgibbs64/SteamCMD-AppID-List/main/steamcmd_appid.json).
- **73 Steam entries begin with "Grid".** They include the racing franchise "GRID" / "GRID 2" and its DLC ("GRID 2 IndyCar Pack", "GRID 2 GTR Racing Pack", "GRID 2 Drift Pack"); the first ten matches by appid were all GRID / GRID 2 items — [Steam app list (older all-apps snapshot)](https://raw.githubusercontent.com/dgibbs64/SteamCMD-AppID-List/main/steamcmd_appid.json).
- **Other non-energy uses of "grid" on Steam** — [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json):
  - 12 entries containing "Gridlock" (e.g. "Gridlock" 3135160, "Gridlock TD" 5262630)
  - "Grid Wars" (1133540), "Grid War Online" (2889420), "Gridworld" (396890)
  - "Gridlords" (3768400), "Gridkeeper" (3536380), "Gridwardens" (4546420)
  - "Power Rangers: Battle for the Grid" (1110100)
- **Energy-themed Steam titles already using the same words.** Titles only; genres were not verified. Source for all: [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json).

  | Title | Appid | Last modified |
  |---|---|---|
  | Energy Manager | 3814290 | Jun 2025 |
  | ARCWATT: Power Empire | 4661270 | Oct 2026 |
  | Prestige Electric Company | 4708440 | Jun 2026 |
  | Energy Island Corp. | 1241710 | Dec 2022 |
  | Solar Baron | 1201470 | Nov 2022 |
  | Wind Giants | 3515980 | Apr 2026 |
  | Power Grid | 2983910 | Aug 2026 |
  | Power Grid Panic | 3837330 | Nov 2025 |
  | Idle Grid | 2940220 | Feb 2025 |
  | Idle Energy | 4842750 | Aug 2026 |
  | Nuclear Engineer Tycoon | 4214910 | Sep 2026 |
  | Electric Car Tycoon | 1742250 | Sep 2021 |
  | COALCOM: Power Station | 4411610 | May 2026 |
  | Rasvyat Nuclear Power Station | 2873620 | Feb 2026 |
  | Electrician Simulator | 1080020 | not recorded |
- **Gaps in the market.** No Steam title puts an energy noun directly before "Tycoon": there is no "Energy Tycoon", "Power Tycoon", "Grid Tycoon", "Solar Tycoon" or "Wind Tycoon". None is titled "Energy Empire", "Energy Inc." or "Power Inc." — [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json).
- **How established management/tycoon games are titled.** Their existence on Steam is confirmed by appid; sales and review data were not accessible. Source for all: [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json).
  - *Genre-word or role suffix:* "Game Dev Tycoon" (239820), "Mad Games Tycoon 2" (1342330), "RollerCoaster Tycoon 3: Platinum" (2700), "Supermarket Simulator" (1532910), "Car Mechanic Simulator 2014" (270850; the series has 53 entries incl. DLC), "Software Inc." (362620), "Startup Company" (606800), "Airport CEO" (673610), "Offworld Trading Company" (271240), "Railway Empire" (503940), "Industry Giant 2" (271360), "Rise of Industry" (671440), "Captain of Industry" (1594320), "Oil Enterprise" (353630).
  - *Evocative single or coined word:* "Turmoil" (361280), "Factorio" (427520), "Frostpunk" (323190), "Satisfactory" (526870), "Timberborn" (1062090), "Banished" (242920), "Eco" (382310).
  - *Evocative title plus descriptive subtitle:* "Kapital: Sparks of Revolution" (1399700), "Workers & Resources: Soviet Republic" (784150), "Production Line : Car factory simulation" (591370). Energy competitors "ARCWATT: Power Empire" (4661270) and "COALCOM: Power Station" (4411610) use the same pattern.
  - *Two-word concept compounds:* "Big Pharma" (344850), "Prison Architect" (233450), "Two Point Hospital" (535930), "Planet Coaster" (493340), "Imagine Earth" (280720), "Terra Nil" (1593030), "Cities: Skylines" (255710), "Anno 1800" (916440), "Transport Fever 2" (1066780), "Power & Revolution" (467520).

### Inferences
- **Fit of "Gridmaster":**
  - Energy-literate players may read "grid" as the electricity grid. On Steam, though, "grid" mostly sits next to racing, puzzle, cyber and tower-defence titles.
  - "Master" reads as skill or puzzle mastery ("X Master") rather than business or empire-building.
  - In German and Danish, "grid" is not the everyday word for the power network ("Netz" / "elnet"; general knowledge). The energy meaning is therefore weaker still in the home markets.
  - The name signals nothing about renewables, Europe, the 1990s-onward history, or trading.
- **Genre words in the title: advantages.**
  - Exact keyword matches in Steam search and YouTube ("energy tycoon").
  - Instant genre signal on small capsule images.
  - "Energy Tycoon" is currently unused as a Steam title, so a subtitle containing it would own that phrase.
- **Genre words in the title: disadvantages.**
  - The words are crowded (527 "tycoon" titles, 5,072 "simulator" titles).
  - Descriptive titles get weak trademark protection.
  - "Tycoon" and "Idle" carry casual or mobile connotations that clash with a "mature, casual-but-realistic" pitch.
  - In the energy niche, "Manager", "Empire", "Corp."/"Company", "Baron" and "Tycoon" are already taken by competitors: Energy Manager, ARCWATT: Power Empire, Prestige Electric Company, Energy Island Corp., Solar Baron and Nuclear Engineer Tycoon.
- **Evocative titles** (Turmoil, Factorio, Frostpunk, Kapital) are more distinctive as trademarks and easy to own once the game is known. They need capsule art, Steam tags or a subtitle to signal the genre. A common dictionary word ("Turmoil", "Eco", "Banished") is noisy on Google until the game becomes known.
- **Recommended structure:** "<evocative, ownable title>: <descriptive subtitle containing 'Energy' and/or 'Tycoon'>". Example: "Supergrid: A European Energy Tycoon". This mirrors ARCWATT: Power Empire and Kapital: Sparks of Revolution. It captures the unused "energy tycoon" search phrase without making a generic phrase the brand.
- **Keep the main title plain ASCII.** Avoid diacritics (ø, ü) and German-only words, because players type plain ASCII into Steam and YouTube search. Keep the European flavour for the subtitle, art and in-game vocabulary.

### Gaps
- Google and YouTube result counts for "Gridmaster" and the alternatives could not be measured (search engines blocked, WebSearch quota exhausted). Recommended: a manual incognito check of Google, YouTube and Steam search for each finalist.
- howtomarketagame.com and other naming/discoverability articles could not be accessed. **Leads to verify before citing** (background knowledge, unverified):
  - Common advice is that a title should be searchable and unique, easy to spell after hearing it once, and should hint at the genre.
  - Most Steam traffic reportedly comes from tags, recommendations and the Discovery Queue rather than title search.
  - A short subtitle can carry the genre.
- How Steam search ranks partial and fuzzy title matches was not verified.
- Commercial success (review counts, sales) of the exemplar titles was not verified. The "successful games" framing rests on general familiarity.
- The genres of the energy-sounding titles above were not verified, especially "Power Grid" (2983910), "Power to the People" (1413370) and "Load Factor" (5078600). Some may be direct competitors whose naming should also be avoided.

## Q3. 12–15 alternative names: collision checks and top-5 ranking

### Takeaway
15 candidates were generated and checked against the full Steam app list, with PyPI/npm as a weak proxy for software names. **14 of the 15 have no Steam title match.** "Windfall" is taken. Several other ideas are already Steam titles and were dropped: Power to the People, Keep the Lights On, PowerShift, Load Factor, Power Grid, Dispatch, Inertia, Electrify, Current and Surge.

**Recommended top 5**, each paired with a descriptive subtitle such as "…: A European Energy Tycoon":
1. Supergrid
2. Terawatt
3. Watt Street
4. Merit Order
5. Megawatt

Trademark, app-store and Google checks for every candidate are still open. This is not legal advice; a professional clearance search is required before launch.

### Cited Findings
- **Steam: no title matches** for any of the following (regexes covered spacing and hyphen variants). Sources: [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json), [Steam app list (older all-apps snapshot)](https://raw.githubusercontent.com/dgibbs64/SteamCMD-AppID-List/main/steamcmd_appid.json).
  - *Unit words:* Terawatt (also "TerraWatt"), Megawatt, Gigawatt, Kilowatt
  - *Grid and market terms:* Supergrid / Super Grid, Merit Order, Baseload / Base Load, Black Start / Blackstart, Duck Curve, Grid Parity, Day Ahead, Spark Spread, Peak Load, Megagrid
  - *Puns and phrases:* Watt Street, Power & Profit, Master of the Grid
  - *Genre-word combinations:* Energy Tycoon, Grid Tycoon, Power (Plant) Tycoon, Energy / Power / Grid Inc., Power / Energy / Grid Baron, Energy Empire, Age of Power / Energy
  - *European words:* Dunkelflaute, Strom / Strøm, Energiewende, 50 Hertz / Fifty Hertz, Kraftwerk
  - *Other:* Energy Transition, Green Grid, Euro Grid / Euro Power, Brownout, Power to X
- **Steam: already taken.** Source: [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json).
  - "Windfall" (841290), "Project Windfall" (2804910), "Windfall: Shards of Memory" (4103140, last modified Oct 2026), "Windfallers" (1303130)
  - "Power to the People" (1413370; a demo and a playtest also exist)
  - "Keep the Lights On" (1401500), "PowerShift" (2250450), "Load Factor" (5078600, Sep 2026), "Power Grid" (2983910)
  - "Dispatch" (2592160) plus three other "Dispatch …" titles
  - "Inertia" (666330), "Electrify" (1393220), "Current" (827530), "Surge" (477130), "Powerplay" (3010280), "Phaseshift" (1372730)
  - 58 entries containing "Blackout", 13 containing "Lights Out", 11 containing "Volt"
- **Steam: conceptual near-collisions** — [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json):
  - "Solar Baron" (1201470) is relevant to "Power Baron" / "Energy Baron".
  - "ARCWATT: Power Empire" (4661270) is relevant to any "Power Empire" or "Watt Empire" title or subtitle.
- "Merit" on its own appears only in unrelated titles ("Beasts Of Merit", "Boundless Merit", "Meritaton") — [Steam app list (daily mirror)](https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json).
- **Package registries** (a weak proxy for software-name use):
  - *Exist:* `supergrid` on npm ([npm registry](https://registry.npmjs.org/supergrid)) and `gigawatt` on npm ([npm registry](https://registry.npmjs.org/gigawatt)). Their purposes were not retrieved.
  - *Free on both PyPI and npm (HTTP 404):* `baseload`, `blackstart`, `black-start`, `merit-order`, `meritorder`, `megawatt`, `terawatt`, `wattstreet`, `duckcurve`. Examples: [PyPI terawatt](https://pypi.org/pypi/terawatt/json), [npm terawatt](https://registry.npmjs.org/terawatt), [PyPI megawatt](https://pypi.org/pypi/megawatt/json), [npm wattstreet](https://registry.npmjs.org/wattstreet), [PyPI baseload](https://pypi.org/pypi/baseload/json).
  - *Free on PyPI only:* `supergrid` and `gigawatt` ([PyPI supergrid](https://pypi.org/pypi/supergrid/json)).

### Inferences
**Candidate table.** The Steam and registry columns summarise the cited findings above. Language and fit notes are judgement plus general knowledge; native speakers should confirm the German and Danish points. No candidate has been checked against trademarks, app stores or Google yet.

| # | Candidate | Type | Steam (2026-10-04) | PyPI / npm | Fit: tone; EN / DE / DK | Verdict |
|---|---|---|---|---|---|---|
| 1 | **Supergrid** | Evocative, on-theme | Clean | npm taken; PyPI free | Names the pan-European interconnected grid, i.e. the endgame of a Europe-wide energy empire. Implies scale and progression. Short; pronounceable as an anglicism in DE/DK. Real-world industry/policy term, so energy-sector marks likely exist. | **Top 5 (#1)** |
| 2 | **Terawatt** | Evocative unit word | Clean (also "TerraWatt") | Free | Continental scale; contains the arc kilowatt → terawatt; "Terra" echo hints at Earth/green. Spelled identically in EN/DE/DK. Less web noise than "Megawatt". | **Top 5 (#2)** |
| 3 | **Watt Street** | Pun | Clean | Free | Signals energy *and* trading/markets, the game's differentiator vs build-only competitors. Memorable; works for anyone who knows "Wall Street". Pun may read lighter than "mature". | **Top 5 (#3)** |
| 4 | **Merit Order** | Insider market term | Clean | Free | The mechanism that sets European wholesale power prices; fits real-data market trading and a mature audience. Used as-is in German/Danish energy debate (general knowledge). Opaque to casual players; can be misread as "Order of Merit" or as a military/strategy title. | **Top 5 (#4)** |
| 5 | **Megawatt** | Evocative unit word | Clean | Free | Instantly "energy"; identical in EN/DE/DK; easy to say and spell. Heavy web noise from energy news and companies, so it is hard to own. | **Top 5 (#5, fallback)** |
| 6 | Baseload | Insider term | Clean | Free | Serious and industry-literate, with irony (renewables undermine the "baseload" idea). English-only jargon (DE "Grundlast", DK "grundlast"); means little to casual players. | Runner-up |
| 7 | Duck Curve | Insider term, playful | Clean | Free | The midday solar dip that makes batteries pay, matching the brief's battery mechanic; mascot potential. Cute tone; may be misread as a duck game; the concept originated in California, not Europe (unverified). | Runner-up / good DLC name |
| 8 | Black Start | Insider term | Clean | Free | Dramatic grid-restoration term (DE calque "Schwarzstart"). Reads as thriller, horror or military; about crisis, not growth. | In-game event or DLC name |
| 9 | Grid Parity | Insider term | Clean | n/c | Captures renewables' historical march to cost parity. Dry, accounting-like. | Chapter or milestone name |
| 10 | Day Ahead | Market term, double meaning | Clean | n/c | References the European day-ahead auction and "the day ahead". Generic phrase; sounds like a planner app; weak to search and to protect. | Reject |
| 11 | Dunkelflaute | European loanword | Clean | n/c | Very European (dark, windless spell). Hard to spell and pronounce outside DE; poor searchability. | In-game event name |
| 12 | Energy Tycoon (or Grid Tycoon) | Descriptive | Clean as exact title | n/c | Maximum genre clarity and keyword match. Generic, barely protectable; "tycoon" crowded (527); casual/mobile connotation; mobile/Roblox duplicates likely (unverified). | Use as **subtitle**, not title |
| 13 | Energy Inc. | Descriptive, corporate pattern | Clean | n/c | Clear corporate-tycoon frame (cf. Software Inc.). Generic; likely real company names (unverified); close to "Energy Island Corp." and "Prestige Electric Company". | Reject |
| 14 | Power Baron | Descriptive, mogul pattern | Clean, but "Solar Baron" exists | n/c | Historical-mogul tone. Confusable with Solar Baron in exactly this niche. | Reject |
| 15 | Windfall | Pun (wind + windfall profits/tax) | **Taken** (4 titles) | n/c | Excellent pun for the post-2022 energy-crisis era (windfall taxes; general knowledge), but it collides on Steam. | Reject; use as in-game "windfall tax" event |

*(n/c = not checked)*

**Top-5 ranking and reasons:**
1. **Supergrid.** Clean on Steam. Most on-theme for a *European* grid empire: the pan-European supergrid is a natural late-game goal, and "super" implies growth from a few panels to a continent. Easy in EN/DE/DK; pairs naturally with a subtitle ("Supergrid: A European Energy Tycoon"). *Main risk:* it is an existing industry term, so energy-sector organisations and marks probably exist. Clearance should focus on overlap in classes 9 and 41.
2. **Terawatt.** Clean on Steam and on both registries. A single punchy word in the Turmoil/Kapital mould. Language-neutral; encodes the start-small, end-huge arc; the faint "Terra" echo suits a green-energy theme. *Main risk:* as a unit word, it may already be used by companies (unverified).
3. **Watt Street.** Clean. It is the only candidate that foregrounds the real-data electricity-market trading that sets this game apart from build-only energy titles (Energy Manager, Power Grid, Wind Giants). The pun works across EN/DE/DK. *Main risk:* tone may skew light; possible existing business names (unverified).
4. **Merit Order.** Clean. The most authentic term for European power markets; it signals depth to the mature, energy-curious audience the brief targets. *Main risk:* jargon, and possible misreading as "Order of Merit". It works best with a very explicit subtitle.
5. **Megawatt.** Clean on Steam and on both registries. Universally understood and identical in EN/DE/DK. *Main risk:* heavy web noise and low ownability. Treat it as the fallback if Supergrid and Terawatt fail clearance. Honourable mentions: **Baseload** (serious tone) and **Duck Curve** (playful, battery-centric).

**Further suggestions:**
- **Subtitle patterns:**
  - "<Title>: A European Energy Tycoon"
  - "<Title>: Energy Tycoon 1990–2050"
  - "<Title>: The Power Market Tycoon"
  - Avoid "Power Empire" (ARCWATT) and "Energy Manager" (an existing title) in subtitles.
- **Keeping "Gridmaster" alive:** the owner can still use it as an in-game rank or achievement ("Become Europe's Gridmaster"), without carrying the title-collision risk.

### Gaps
- **Not checked for any candidate:** trademark registers (EUIPO eSearch plus, TMview incl. DKPTO/DPMA, WIPO Global Brand Database, USPTO; classes 9/41/42), itch.io, Google Play, App Store, console stores, Google and YouTube results, domains (.com/.eu/.dk/.de/.game), social handles, company registers. All were blocked or out of reach in this session.
- **Limits of a clean Steam result.** "No Steam title match" does not cover games without a public store page, games announced after 2026-10-04, or Steam's fuzzy search behaviour. Re-check finalists in Steam's live search.
- **Unverified background cautions** (general knowledge, not verified this session):
  - "Supergrid" is an established European energy-policy and industry term (e.g. the "Friends of the Supergrid" association and France's "SuperGrid Institute").
  - "TeraWatt Infrastructure" may be an existing EV-charging company.
  - "Megawatt" and "Gigawatt" are likely used by many energy businesses.
  - "50Hertz" is a German transmission-system operator, so avoid "50 Hertz"-style names.
  - "Kraftwerk" is a famous band.
  - "Volt" is a pan-European political party and a Chevrolet model.
  - "Power Grid" (German "Funkenschlag") is a well-known energy-market board game. The Steam title "Power Grid" (2983910) may be its adaptation.
  - The "duck curve" originated with California's grid operator.
  - "Order of Merit" is a state honour.
- **Language claims to check.** German "Merit-Order", "Schwarzstart", "Grundlast" and "Netzparität" and Danish "elnet" / "grundlast" come from general knowledge. A native German and a native Danish speaker should confirm that each finalist reads well, and check for unintended meanings.
- **This is not legal advice.** Before committing to any name, run a professional trademark clearance search (EUIPO, national offices via TMview, WIPO Madrid, USPTO) in classes 9, 41 and 42. Consider filing early, e.g. an EU trade mark, once a finalist clears.
