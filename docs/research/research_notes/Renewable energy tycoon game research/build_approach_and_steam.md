# Gridmaster: build approach, engine/stack choice, architecture and Steam publishing (verified to 4 Oct 2026)

*Source note: the session-wide WebSearch budget (200 calls, shared with parallel researchers) ran out early. The egress proxy also blocked partner.steamgames.com, unity.com, godotengine.org (including docs), naturalearthdata.com, ec.europa.eu, store.steampowered.com, steamcommunity.com, codeberg.org, Wikipedia and most news sites. Facts marked † come from search-engine extracts of the official page cited; I could not open that page directly. Engine and library facts were checked against the projects' own GitHub repositories and docs sources, and against the npm and crates.io registries, on 4 Oct 2026. Anything I could not check is listed under Gaps.*

## 1. AI-agent friendliness: which stacks coding agents handle best, 2024–2026 evidence, pitfalls

### Takeaway
Three properties matter most for a non-programmer who directs AI agents and reviews from a phone:
- Everything is plain text.
- Everything builds and tests headless on a standard CI runner.
- Every pull request produces a link that can be played on a phone.

A TypeScript web stack meets all three natively. Godot 4 with GDScript meets them with caveats: editor-generated `uid://` references, a single-threaded WebGL2 web build, and a GDScript corpus that exists only for Godot. Unity and Unreal workflows are tied to the editor; Unity's own MCP bridge needs a running Unity Editor. Since 16 Jan 2026, Steam no longer requires developers to disclose AI coding assistants, so AI-coded games cannot be counted from Steam data. I could not verify any named commercial case study this session.

### Cited Findings
**Text formats, headless operation, CI**
- Godot's TSCN scene format "has the advantage of being mostly human-readable and easy for version control systems to manage". Scenes and resources reference each other by string UIDs, for example `[gd_scene format=3 uid="uid://cecaux1sm7mo0"]` and `[ext_resource type="Material" uid="uid://c4cp0al3ljsjv" path="res://material.tres" id="1_7bt6s"]`. — [godot-docs: TSCN file format](https://github.com/godotengine/godot-docs/blob/master/engine_details/file_formats/tscn.rst)
- Godot's command line has these headless and CI flags — [godot-docs: command line tutorial](https://github.com/godotengine/godot-docs/blob/master/tutorials/editor/command_line_tutorial.rst):
  - `--headless`: "Useful for servers and with `--script`"
  - `-s/--script <script>`: run a script
  - `--check-only`: "Only parse for errors and quit"
  - `--quit-after <n>`
  - `--import`
  - `--export-release <preset> <path>` and `--export-debug`
- Ready-made Godot CI exists:
  - godot-ci is a "Docker image to export Godot Engine games and deploy to GitLab/GitHub Pages and Itch.io using GitLab CI and GitHub Actions" — [abarichello/godot-ci](https://github.com/abarichello/godot-ci)
  - setup-godot installs Godot 4.x, with or without .NET, on Ubuntu, macOS and Windows GitHub Actions runners, with caching — [chickensoft-games/setup-godot](https://github.com/chickensoft-games/setup-godot)

**Agent tooling now shipped by vendors and communities**
- Godot MCP (MIT) "enables AI agents to launch the Godot editor, run projects, capture debug output, and control project execution". It also offers scene creation, node editing and "UID Management (for Godot 4.4+)". — [Coding-Solo/godot-mcp](https://github.com/Coding-Solo/godot-mcp)
- MCP for Unity — [CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp):
  - It "bridges AI assistants — Claude, Codex, VS Code, local LLMs, and more — with your Unity Editor via Model Context Protocol".
  - It offers "48 focused MCP tool entrypoints … free & MIT".
  - It requires Unity 2021.3 LTS to 6.x plus Python 3.10+.
  - v10.0.0 was released on 30 Jun 2026.
- Phaser's repository now includes "a comprehensive set of AI agent skills covering every major Phaser subsystem … Point your AI coding agent at the skills/ folder and it will understand Phaser 4's architecture, APIs, patterns, and gotchas in depth." — [phaserjs/phaser README](https://github.com/phaserjs/phaser)

**Version churn, the main source of agent errors**
- Phaser 4 "is a major release built on a brand-new WebGL renderer. The entire rendering pipeline from v3 has been replaced". Phaser 4.2.1 was published on 9 Jul 2026. — [phaserjs/phaser README](https://github.com/phaserjs/phaser); [npm registry: phaser](https://registry.npmjs.org/phaser)
- Bevy: "still in the early stages of development. Important features are missing. Documentation is sparse. A new version of Bevy containing breaking changes to the API is released approximately once every 3 months" — [bevyengine/bevy README](https://github.com/bevyengine/bevy). The latest stable release is 0.19.1, with 0.20.0-rc.2 in testing (checked 4 Oct 2026). — [crates.io index: bevy](https://index.crates.io/be/vy/bevy)
- GDScript is a custom language. The Godot FAQ says it exists because general-purpose VMs (Lua, Python, JavaScript and others) had poor threading support, poor class-extension support and poor C++ bindings for Godot's needs. All GDScript training data is therefore Godot-specific. — [godot-docs FAQ](https://github.com/godotengine/godot-docs/blob/master/about/faq.rst)

**Steam's stance on AI-assisted code**
- On 16 Jan 2026 Valve rewrote Steam's AI-disclosure rules:
  - No disclosure is needed for "GitHub Copilot and other code-assist tools, or AI-powered developer software and efficiency tools".
  - Disclosure is still required for AI-generated in-game content, store-page assets or marketing materials, and for content generated live during gameplay.

  Sources: [Slashdot (19 Jan 2026)](https://games.slashdot.org/story/26/01/19/1735231/valve-has-significantly-rewritten-steams-rules-for-how-developers-must-disclose-ai-use); [Notebookcheck](https://www.notebookcheck.net/Steam-updates-AI-disclosure-form-requiring-developers-to-report-visible-and-in-game-AI-but-not-background-tools.1206103.0.html); [Outlook Respawn](https://respawn.outlookindia.com/amp/story/gaming/gaming-news/valve-clarifies-steam-ai-policy-focus-shifts-to-content-consumed); [Automaton (17 Jan 2026)](https://automaton-media.com/articles/newsjp/steam-ai-20260117-407801/); [tbreak](https://tbreak.com/steam-ai-disclosure-policy-update-developers/). These were read as search extracts; the primary page [Steamworks content survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey) was blocked.

### Inferences
**Agent-friendliness ranking for this project**
1. **TypeScript web stack.** It is the most common language in agents' training data (an assumption, not measured here). Strict typechecking catches agent mistakes. There is no editor and no binary assets, and tests run in Node.
2. **Godot 4 + GDScript.** Text scenes, a headless CLI, CI images and MCP tooling exist. However, GDScript has a smaller corpus, and agents mix up Godot 3 and Godot 4 APIs.
3. **Godot 4 + C#.** Models know C# well, but a C# project cannot export to the web (see section 6).
4. **Unity 6.** Models know C# and Unity well, but scenes, prefabs, assets, licence activation and MCP all assume a running editor.
5. **Bevy.** The Rust compiler gives agents good feedback, but the 3-month breaking cadence means models' knowledge is usually one or more versions behind.
6. **Defold, LÖVE and MonoGame.** Small ecosystems and little UI or chart tooling.
7. **Unreal.** Blueprints are binary assets, and the engine is overkill for this game.

**The phone review loop**
Each pull request should run, in CI:
1. Typecheck and unit/property tests.
2. A seeded headless simulation smoke run.
3. A web build deployed to a preview URL (GitHub Pages or Cloudflare Pages).
4. Screenshots of key screens (map, market chart, build menu) posted to the PR.

Lukas then plays or inspects the result on his phone before merging. A web stack supports this out of the box. Godot (GDScript only) can do the same via godot-ci, with WebGL2 and single-thread limits. Unity would need a licensed editor running in CI.

**Pitfalls and mitigations**
- **Version drift.** Agents produce Godot 3 syntax in Godot 4, Phaser 3 in Phaser 4, or stale Bevy APIs. Pin exact versions, keep a short API cheat-sheet in the repo's CLAUDE.md (Phaser's agent skills are the vendor version of this), and let the typechecker or `--check-only` act as the judge.
- **Editor-generated identifiers.** Godot `uid://` references and `.uid` sidecar files, or Unity `.meta` GUIDs, must not be invented by agents. Prefer UI built in code, and regenerate IDs with the engine (`--import`) in CI.
- **Agents cannot judge feel or readability.** Require screenshot artifacts and a human taste check for every UI change.
- **Silent simulation bugs.** Use invariant and property tests plus seeded "golden" runs (section 3).
- **Codebase sprawl.** Enforce module boundaries with lint rules (the simulation core may not import UI). Keep files small so tasks fit an agent's context.

**AI disclosure on Steam**
Gridmaster only has to disclose AI if AI-generated art, audio or text ships in the game or appears on the store page. Code written with Claude Code does not need disclosure.

### Gaps
- **No named case study.** I could not verify any 2024–2026 commercially successful Steam game built largely with AI coding agents (search budget exhausted; news sites blocked). Leads to verify:
  - Pieter Levels' browser flight game fly.pieter.com (Feb–Mar 2025, widely described as "vibe-coded"; browser, not Steam).
  - GDC State of the Game Industry 2025 and 2026 figures on AI use.
  - Steam-wide counts of AI disclosures, such as Totally Human Software's 2025 analysis.
  - Backlash cases such as the Indie Game Awards controversy around Clair Obscur: Expedition 33 (Dec 2025).
- **No measured LLM accuracy per engine or language.** The claim that TypeScript and C# have far more training data than GDScript is an inference. GitHub Octoverse 2025 (reportedly TypeScript as #1 language on GitHub) could not be opened because github.blog was blocked.
- **Unity CI licence activation.** The exact GameCI requirements could not be read (game.ci blocked), and the game-ci/documentation paths returned 404.
- **Godot 3/4 confusion in LLM output** is widely reported anecdotally, but I found no citable source this session.

## 2. Commercially successful Steam games built with web technology: verification and reported issues

### Takeaway
These four games are verified from project or primary sources:
- **Game Dev Tycoon:** node-webkit (now NW.js) plus greenworks; greenworks was built for this game.
- **CrossCode:** listed as an NW.js app; its community mod loader is JavaScript.
- **shapez:** a custom JavaScript engine on Electron.
- **Bitburner:** TypeScript/React in the browser and on Steam via Electron.

The issues these games document are:
- JavaScript performance tuning (shapez avoided "too slow" ES2015 features in hot loops).
- Electron needing special GPU flags for the Steam overlay.
- A fragile Steamworks-binding ecosystem: greenworks went stale, steamworks.js has had no release since Aug 2024, and Bitburner uses a fork.

shapez's developer moved to shapez 2 rather than extend the JS codebase. I could not verify Vampire Survivors' move from Phaser to Unity, Cookie Clicker's Steam build or Melvor Idle's technology this session.

### Cited Findings
- "Game Dev Tycoon was one of the first node-webkit powered games on Steam and uses greenworks to integrate node-webkit with Steamworks." — [NW.js wiki: list of apps and companies using NW.js](https://github.com/nwjs/nw.js/wiki/List-of-apps-and-companies-using-nw.js)
- Greenworks — [greenheartgames/greenworks](https://github.com/greenheartgames/greenworks); [npm registry: greenworks](https://registry.npmjs.org/greenworks):
  - It is a Node.js addon "enabling Steam integration for HTML5 games".
  - Greenheart Games created it for Game Dev Tycoon, then open-sourced it (MIT). It supports NW.js and Electron.
  - Its README says: "This project is maintained on a best-effort basis. While it is stable and used in production by many, please be aware that active development is not a priority."
  - Its last npm publish is 0.1.0, dated 9 Nov 2016.
- CrossCode is on the NW.js app list — [NW.js wiki](https://github.com/nwjs/nw.js/wiki/List-of-apps-and-companies-using-nw.js). Its community loader is "A Modloader for CrossCode written in javascript", installed by copying it into the game folder. — [CCDirectLink/CCLoader](https://github.com/CCDirectLink/CCLoader)
- shapez — [tobspr-games/shapez.io](https://github.com/tobspr-games/shapez.io):
  - "The game is based on a custom engine which itself is based on the YORG.io 3 game engine."
  - "This project is based on ES5 (If I would develop it again, I would definitely use TypeScript). Some ES2015 features are used but most of them are too slow, especially when polyfilled. For example, `Array.prototype.forEach` is only used within non-critical loops since its slower than a plain for loop."
  - The repository is "no longer actively maintained, we have moved over to shapez 2 development" (shapez 2 is Steam app 2162800). Mods are distributed via mod.io, and there is a playable online demo at shapez.io.
- Electron and the Steam overlay:
  - shapez's desktop wrapper uses Electron 16.2.8 and launches with `--disable-direct-composition --in-process-gpu` — [shapez electron/package.json](https://github.com/tobspr-games/shapez.io/blob/master/electron/package.json).
  - steamworks.js's `electronEnableSteamOverlay()` appends exactly these two Chromium switches to make the Steam overlay work — [ceifa/steamworks.js index.js](https://github.com/ceifa/steamworks.js/blob/main/index.js).
- Bitburner is "a programming-based incremental game". It can be played in the browser or "installed through Steam" (app 1812820) — [bitburner-src README](https://github.com/bitburner-official/bitburner-src). Its Electron wrapper (v3.0.2) depends on `@catloversg/steamworks.js` 0.0.3, a community fork, plus electron-store — [bitburner electron/package.json](https://github.com/bitburner-official/bitburner-src/blob/dev/electron/package.json). The fork was last published on 19 Mar 2026. — [npm registry](https://registry.npmjs.org/@catloversg/steamworks.js)
- steamworks.js — [ceifa/steamworks.js](https://github.com/ceifa/steamworks.js); [npm registry: steamworks.js](https://registry.npmjs.org/steamworks.js):
  - Its author gave up on greenworks because "It's not being maintained anymore", "It's not up to date" and "You have to build the binaries by yourself", and because it has no TypeScript definitions.
  - steamworks.js itself has had no npm release since 0.4.0 on 6 Aug 2024.
  - The repository has no GitHub releases and 52 open issues.

### Inferences
- **Strong precedent for this genre.** Game Dev Tycoon is a tycoon/management sim and Bitburner is a UI-heavy incremental; both shipped on Steam using web technology.
- **Where JS performance bit.** The documented performance pain was in shapez, a factory game that updates thousands of entities every frame. A regional energy sim with tens of regions is much lighter per frame. Its risk is long-horizon batch simulation (hourly × decades) and headless balancing runs, which must be designed for (section 3).
- **The Steamworks binding is the chronic risk of web stacks on Steam.** There have been three generations in about ten years: greenworks, then steamworks.js, then forks and steamworks-ffi-node. Put every Steam call behind a small adapter interface (achievements, cloud, workshop, overlay) so the binding can be swapped, and keep the browser build working with a no-op adapter.
- **The precedent games ship a free browser version or demo alongside the Steam version** (Bitburner, shapez). This doubles as a playtest channel, which suits a developer who reviews from a phone.

### Gaps
- Vampire Survivors: reportedly written originally in Phaser/JavaScript and ported to Unity by poncle in 2023 for performance and console ports. Not verified (Wikipedia and news blocked).
- Cookie Clicker's Steam version (Sep 2021): reportedly Electron with Steam integration. Not verified.
- Melvor Idle: technology (web/TypeScript) and current publisher not verified.
- CrossCode's console ports: reportedly needed porting work away from browser JavaScript. Not verified.
- No sales or performance postmortems from Greenheart Games, Radical Fish, tobspr or poncle could be retrieved.

## 3. Architecture best practice for the simulation/tycoon core (and the map of Europe)

### Takeaway
Build Gridmaster as a deterministic, headless simulation library separate from the rendering and UI:
- Fixed timestep (one tick = one game hour).
- Seeded RNG whose state is saved in the save file.
- No wall-clock time or engine calls inside the simulation.

Around it:
- Data-driven content (CSV/YAML/JSON validated by schemas).
- Versioned saves with migration functions.
- Mods as data packs, later shared through Steam Workshop.
- CI that runs property tests, seeded golden runs and scripted "bot" playthroughs.

For the map:
- **Natural Earth** is public domain and safe for a commercial game.
- **Eurostat GISCO/NUTS boundaries** are licensed "not … for commercial purposes"; commercial use needs a EuroGeographics licence.
- **geoBoundaries** (CC BY 4.0 / ODbL, attribution only) is an alternative.

### Cited Findings
- Game Programming Patterns, "Game Loop" chapter — [game-loop.markdown](https://github.com/munificent/game-programming-patterns/blob/master/book/game-loop.markdown):
  - It recommends a fixed-update loop: a `lag` accumulator advanced in `MS_PER_UPDATE` steps, with rendering decoupled from updates.
  - It warns that a variable time step "makes gameplay non-deterministic and unstable".
  - It defines the term: "'Deterministic' means that every time you run the program, if you give it the same inputs, you get the exact same outputs back… it's much easier to track down bugs in deterministic programs".
- Data-driven content: the "Type Object" chapter — [type-object.markdown](https://github.com/munificent/game-programming-patterns/blob/master/book/type-object.markdown):
  - Designers want to "create and tune breeds without *any* programmer intervention at all".
  - The engine creates breeds "by loading a JSON file that defines them".
  - "Over time, games are getting more data-driven."
- Godot's official save tutorial serializes per-node dictionaries to JSON lines (noting "Vector2 is not supported by JSON"). Save format design is left to the developer. — [godot-docs saving_games.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/io/saving_games.rst)
- **Headless bot runs.** Godot supports `--headless` with `--script` — [godot-docs command line](https://github.com/godotengine/godot-docs/blob/master/tutorials/editor/command_line_tutorial.rst). For TypeScript, fast-check (MIT, a property-based testing library) is at 4.10.2, published 19 Sep 2026. — [npm registry: fast-check](https://registry.npmjs.org/fast-check)
- **Workshop and mod APIs reachable from JavaScript:**
  - steamworks.js exposes `workshop`, `cloud`, `achievement`, `stats`, `overlay` and `input` namespaces — [steamworks.js client.d.ts](https://github.com/ceifa/steamworks.js/blob/main/client.d.ts).
  - steamworks-ffi-node advertises "Complete Steam Workshop/UGC integration (38 functions)" and "Complete Steam Cloud (Remote Storage) integration (17 functions)" — [ArtyProf/steamworks-ffi-node](https://github.com/ArtyProf/steamworks-ffi-node).
  - shapez distributes mods via mod.io, with documented example mods — [shapez.io README](https://github.com/tobspr-games/shapez.io).
- **Natural Earth.** "Natural Earth is a public domain map dataset available at 1:10m, 1:50m, and 1:110 million scales" — [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector). The master branch VERSION file reads 5.2.0-pre. — [VERSION](https://github.com/nvkelso/natural-earth-vector/blob/master/VERSION)
- **Eurostat GISCO.** The administrative/statistical units clause, as reproduced by the rOpenGov eurostat package — [rOpenGov/eurostat R/eurostat-package.R](https://github.com/rOpenGov/eurostat/blob/master/R/eurostat-package.R):
  - "The Commission agrees to grant the non-exclusive and not transferable right to use and process the Eurostat/GISCO geographical data … The permission to use the data is granted on condition that: the data will not be used for commercial purposes; the source will be acknowledged."
  - The required notice is "© EuroGeographics for the administrative boundaries".
  - "If you intend to use the data commercially, please contact EuroGeographics for information regarding their licence agreements."
  - Eurostat's own Nuts2json repository adds: "The Eurostat NUTS dataset is copyrighted. There are specific provisions for the usage of this dataset which must be respected." — [eurostat/Nuts2json](https://github.com/eurostat/Nuts2json)
- **geoBoundaries** is "an online, open license (CC BY 4.0 / ODbL) resource of information on administrative boundaries … the only requirement for use is acknowledgement" — [wmgeolab/geoBoundaries](https://github.com/wmgeolab/geoBoundaries)

### Inferences
**Layering.** These rules apply in any engine; the paths are for the TypeScript case.
- `sim/`: pure TypeScript with no DOM, no `Date.now()` and no `Math.random()`. A state struct plus `step(state, inputs) → state`. It runs in Node (tests, bots), in a Web Worker (game) and in CI.
- `content/`: CSV for numeric tables (technology costs and learning curves by year, efficiencies, lifetimes) and YAML/JSON for events, policies and regions. JSON Schemas are checked in CI and compiled into one typed bundle at build time.
- `ui/`: panels and charts.
- `map/`: the map renderer.
- `platform/`: the Electron main process, the Steam adapter and save storage.
- `tools/`: bots and balance reports.
- A lint rule forbids `sim/` from importing anything else in the repo.

**Time model**
- One tick is one game hour, which matches "hourly-ish" weather, demand and price.
- UI speed controls change ticks per frame. The UI only receives aggregated snapshots (daily/monthly series for charts) from the worker.

**Rough sizing (my estimate)**
- About 35 market regions × 8,760 hours × 60 years (1990–2050) ≈ 18 million region-hours per full campaign.
- If each hour costs O(regions × technologies) work (merit-order dispatch plus a greedy or iterative interconnector coupling), a full campaign is on the order of 10⁹–10¹⁰ simple operations. That is seconds to tens of seconds in JIT-compiled JavaScript or C#, and potentially minutes in interpreted GDScript.
- Live play is far cheaper. One game-year per 30 s is about 300 game-hours per second, which is trivial for any language.
- The risks are a general LP solver per hour (avoid it) and large headless balancing batches. Keep the per-hour algorithm linear. If needed, fast-forward with representative days per season, and keep full hourly resolution for the year the player is viewing.

**Determinism details for JavaScript**
- Use a seedable PRNG (for example PCG32 or sfc32) and save its state.
- Store money in integer cents or k€ to avoid drift.
- Iterate collections in a defined order (arrays sorted by ID).
- ECMAScript leaves `Math.exp`, `Math.sin` and similar functions "implementation-approximated". V8 (Electron, Chrome) and JavaScriptCore (Safari on the iPhone used for review) can therefore differ in the last bits. Run golden-hash tests in Node only, and treat a phone/browser build as "same rules, not bit-identical", or use your own polynomial/lookup implementations in the simulation.

**Saves**
- Format: `{saveVersion, gameVersion, contentHash, seed, rngState, state}` as gzipped JSON.
- Migrations are pure functions `vN → vN+1`. CI loads a fixture save from every past version.
- Steam Cloud covers the save folder: Auto-Cloud or the cloud API through the adapter (Auto-Cloud not verified this session).

**Mods**
- Phase 1: data packs that override or add records by ID, in a defined load order, validated by the same schemas. Steam Workshop items are just such folders.
- Phase 2, optional: sandboxed scripting. Avoid arbitrary code mods at launch.

**Automated balancing**
- **Scripted bots.** For example: "all-in wind", "gas-then-solar", "cautious", "greedy ROI". Run them N seeds × M scenarios headless in a nightly CI job.
- **Invariants checked by property tests:**
  - Energy balance holds every hour (generation + imports − exports − storage charge + unserved = demand).
  - Prices stay within floor and cap.
  - Cash moves only through modelled flows.
  - No NaN or infinite values.
- **KPI tracking.** Track KPIs per commit (median net worth by 2010/2030, share of bankrupt runs, renewables share, price volatility). Publish them as charts in the PR or nightly report, which is readable on a phone.

**Map pipeline**
1. Start from Natural Earth admin-0 and admin-1 at 1:10m or 1:50m.
2. Merge admin-1 units into game regions.
3. Simplify and topologically clean the shapes (mapshaper/TopoJSON) at build time.
4. Project to an equal-area European projection (ETRS89-LAEA, EPSG:3035, the projection Eurostat uses; not verified this session).
5. Render as SVG (~40 regions) or with PixiJS for animated flows.

Using NUTS codes as region identifiers is likely fine. Avoid shipping GISCO/NUTS geometry unless EuroGeographics licenses it. Credit Natural Earth anyway.

### Gaps
- **Natural Earth terms page.** naturalearthdata.com/about/terms-of-use was blocked. The public-domain status is confirmed via the project's official GitHub README only. Natural Earth's disputed-boundary "point of view" variants were not checked; this matters for Cyprus, Kosovo and Crimea in a Europe map.
- EuroGeographics' open datasets (EuroGlobalMap reportedly became open data under CC BY 4.0 around 2023): not verified.
- GADM's licence (reportedly non-commercial only): not verified.
- No published postmortem on automated balancing with headless bots for a tycoon game could be retrieved. Unity ML-Agents' README path returned 404, and Factorio's FFF posts on determinism and Gaffer On Games' "Fix Your Timestep!" were not fetched (blocked or no budget).
- The ECMAScript "implementation-approximated" Math behaviour is stated from knowledge of the spec. tc39.es was not fetched.

## 4. Steam publishing practicalities (as of Oct 2026)

### Takeaway
- **Fee:** $100 per app via Steam Direct, recouped after $1,000 adjusted gross revenue.
- **Waiting period:** 30 days after paying before the first release.
- **Coming Soon page:** must be live at least 2 weeks before release.
- **Store-page review:** 3–5 business days; submit at least 7 business days ahead. Build review is a separate step.
- **Next Fest:** one appearance per game, with a public demo. The Oct 2026 edition runs 19–26 Oct, registration closed 31 Aug, and Feb 2027 and Jun 2027 editions are already documented.
- **Steam Playtest:** a free child app with sign-up on the main store page.
- **Early Access:** no promises, no higher price than elsewhere, and no discount for 30 days after a price increase.
- **Revenue share:** Valve takes 30%, falling to 25% above $10M and 20% above $50M.
- **AI disclosure:** only for AI content that players see (since 16 Jan 2026).
- **Steam Deck/Steam Machine "Verified":** full controller access and text at least 9 px at 1280×800.

I could not verify Denmark-specific tax, VAT and payout details this session.

### Cited Findings
**Fees and lead times**
- "$100 USD … for each new app"; "not refundable, but will be recoupable in the payment made after your product has at least $1,000.00 Adjusted Gross Revenue for Steam Store or in-app purchases". There is "a 30-day waiting period between when you paid the app fee and when you can release your game" so Valve can "confirm that they know who they're doing business with". — [Steamworks: Steam Direct Fee](https://partner.steamgames.com/doc/gettingstarted/appfee)†
- A Coming Soon page is required "for at least two weeks before releasing". Store-presence review "typically takes 3-5 business days"; submit "at least 7 business days before you want your page live". The store page must be approved before the build can be submitted for review, and release requires both. — [Steamworks: Coming Soon](https://partner.steamgames.com/doc/store/coming_soon)†; [Release Process](https://partner.steamgames.com/doc/store/releasing)†

**Next Fest**
- Eligibility:
  - A Steamworks account in good standing.
  - A published public store page.
  - A publicly playable demo by the start of the Fest.
  - The game must not be released before that edition ends.
  - Registration is done from the base game.
  - "A game may only appear once in Steam Next Fest."

  — [Steamworks: Steam Next Fest](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest)†
- The Oct 2026 edition runs from 19 Oct 10:00 PDT to 26 Oct 10:00 PDT. Registration deadline: 31 Aug. Deadline to submit the demo build and store page for the press preview: 14 Sep. Trailer opt-out deadline: 1 Oct. — [Next Fest: October 2026](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/2026october)†
- Doc pages already exist for the February 2027 and June 2027 editions. — [Feb 2027](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/feb_2027)†; [June 2027](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/june_2027)†

**Playtest**
- Steam Playtest uses a separate "child" appID. There is no separate store page; sign-up sits on the main game's page, so players can still wishlist. It has the same technical Steamworks features as the main game. "Your Playtest does not require a public signup, and you can generate and distribute keys for a Playtest even if your store page is not live yet." — [Steamworks: Steam Playtest](https://partner.steamgames.com/doc/features/playtest)†

**Early Access**
- Rules from [Steamworks: Early Access](https://partner.steamgames.com/doc/store/earlyaccess)†:
  - "Do not make specific promises about future events."
  - The Early Access price must be "no higher than that offered on any other service".
  - The game must be on Steam no later than anywhere else.
  - Keys sold on third-party sites need Early Access branding.
  - Developers must be transparent if updates will break save files.
  - Most developers start below the target launch price.
  - "You will not be able to run a discount within 30 days following a price increase, including a launch discount when your title transitions from Early Access to fully released."

**Discounting**
- No discount for 30 days after release (Early Access or full) except an optional Launch Discount, which must be set up before release. Other rules:
  - 30 days must pass between discounts.
  - No discount for 30 days after a price increase in any currency.
  - Launch discounts last 7–14 days, with a maximum of 40% off.
  - The cooldown was cut from 6 weeks to 30 days in March 2022.

  Sources: [Steamworks: Discounting](https://partner.steamgames.com/doc/marketing/discounts)† and the secondary [Steam Page Analyzer](https://www.steampageanalyzer.com/blog/steam-discount-rules-2026). The 40% cap and the 2022 date come from the secondary source.

**Revenue share**
- Valve takes 30%. That falls to 25% on revenue above $10M and 20% above $50M. The tiers apply to sales from 1 Oct 2018 onward, and the revenue counted includes DLC, in-game sales and Community Market game fees. — [TechCrunch (3 Dec 2018)](https://techcrunch.com/2018/12/03/valve-changes-revenue-sharing-tiers-on-steam/embed/); [Neowin](https://www.neowin.net/news/valve-introduces-new-revenue-share-tiers-for-steam-promising-bigger-cuts-for-studios/)

**AI disclosure**
- Since 16 Jan 2026, disclose only AI-generated in-game content, store or marketing assets, and live-generated content. Code-assist and efficiency tools are exempt. — [Slashdot (19 Jan 2026)](https://games.slashdot.org/story/26/01/19/1735231/valve-has-significantly-rewritten-steams-rules-for-how-developers-must-disclose-ai-use); [Notebookcheck](https://www.notebookcheck.net/Steam-updates-AI-disclosure-form-requiring-developers-to-report-visible-and-in-game-AI-but-not-background-tools.1206103.0.html); primary page (blocked): [Steamworks content survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey)†

**Steam Deck / Steam Machine verification**
- The compatibility page is now titled "Steam Deck and Steam Machine Compatibility Review". A separate "Steam Frame Standalone Compatibility Review" exists. — [Steamworks: compat review](https://partner.steamgames.com/doc/steamhardware/compat)†; [Steam Frame](https://partner.steamgames.com/doc/steamhardware/steamframe/compat)†
- "Verified" means the game passes all compatibility checks. Requirements — [Steamworks: compat review](https://partner.steamgames.com/doc/steamhardware/compat)†:
  - The default controller configuration must give access to all content without changing in-game settings.
  - On-screen glyphs must match the input device.
  - Text must be readable at 12 in / 30 cm: "the smallest on-screen font character should never fall below 9 pixels in height at 1280x800".
  - Text entry must use the Steamworks on-screen keyboard API or a built-in controller-friendly entry.

### Inferences
**A realistic order of steps for Gridmaster**
1. Pay the Steam Direct fee early; the 30-day clock and identity/tax checks run in parallel with development.
2. Open the Coming Soon page as soon as there is a decent capsule image, five or more screenshots and a short trailer, so wishlists accumulate. Allow at least 7 business days for review.
3. Use Steam Playtest with keys for closed testing before the store page is public.
4. Hold Next Fest (one shot) until there is a polished, time-boxed demo: Jun 2027 at the earliest realistic date, otherwise a later edition. Registration closes about 7 weeks before the event, and demo and store-page review is due about 5 weeks before.
5. Decide between Early Access and 1.0. Early Access is common for sims, but the 30-day discount block after a price increase also applies at the Early Access to 1.0 transition.

**Steam Deck**
A chart-heavy UI must be designed at 1280×800 with text of at least 9 px from day one. For a mouse-driven tycoon, "Playable" (trackpad as mouse) is a realistic first target. "Verified" requires every screen to be fully controller-navigable, which is a deliberate UI investment.

**Revenue**
Plan revenue on about 70% of net sales, after refunds, chargebacks and VAT. The Steam Direct fee is effectively free once sales pass $1,000.

**AI-generated assets**
Keeping store art and in-game art non-AI avoids the disclosure label entirely. Because code assistance is exempt, the AI-agent workflow itself creates no label.

### Gaps
- The Steamworks pages could not be opened (blocked). The figures above are from search-engine extracts of those pages and should be re-checked before launch.
- Not verified this session:
  - Store-page asset requirements: capsule image sizes, screenshot count, trailer rules.
  - Build-review turnaround.
  - Demo app rules: separate free app, own store page, reviews.
  - Valve's regional pricing recommendations and minimum prices.
  - Payout timing (commonly reported as monthly, about 30 days after month-end).
- **Denmark: unverified items to check with Skat or an accountant:**
  - Steamworks onboarding as an individual versus a company.
  - The US tax interview (W-8BEN for an individual, W-8BEN-E for an entity) to claim the US–Denmark treaty rate on royalties (believed 0%).
  - Whether a CVR-registered sole proprietorship (enkeltmandsvirksomhed) is needed or hobby income treatment applies; the two differ in whether losses are deductible.
  - Danish VAT registration. The threshold is believed to be DKK 50,000 per 12 months. Valve, as the platform selling to consumers, is believed to handle consumer VAT; the developer's supply to Valve (a US business) is believed to fall outside Danish VAT.
  - The EU Digital Services Act "trader" declaration on Steam. It is believed to be required since Feb 2024 and would publish a trader's address and phone number on the store page; this matters for a hobbyist's privacy.
- No data was found on how AI-disclosure labels affect wishlists or sales.
- Steam Machine and Steam Frame launch details and their review turnaround: not checked.

## 5. Art and audio for a solo non-artist

### Takeaway
Verified free-licence building blocks:
- Kenney sprites and 3D models: CC0.
- game-icons.net: CC BY 3.0, or CC0 where marked.
- Google Fonts: per-family licences that allow redistribution.
- Chart libraries: Apache-2.0 or MIT.

A diagrammatic, data-visualization style fits a map-and-chart energy sim best, and is the style agents can produce in code. In the style of Mini Metro, shapez or the Offworld map, the "art" is mostly typography, palette, icons and a clean map.

Spend real money on what drives store conversion: Steam capsule/key art, logo, trailer, and possibly music. AI-generated art, audio or text that ships in the game or on the store page triggers Steam's disclosure label. I could not verify budget ranges or data on how art quality affects tycoon sales this session.

### Cited Findings
- game-icons.net: "Icons provided under the Creative Commons 3.0 BY or CC0 if mentioned below" (contributors include Lorc and Delapouite). — [game-icons/icons license.txt](https://github.com/game-icons/icons/blob/master/license.txt)
- Kenney's Godot 4.6 "3D city builder" starter kit includes building and removing structures, saving and loading, and "Sprites and 3D Models (CC0 licensed)". — [KenneyNL/Starter-Kit-City-Builder](https://github.com/KenneyNL/Starter-Kit-City-Builder)
- Google Fonts: "all the fonts available here are licensed with permission to redistribute, subject to the license terms". Each family directory contains its own licence file. — [google/fonts](https://github.com/google/fonts)
- Chart libraries:
  - JavaScript: ECharts 6.1.0 (Apache-2.0, 19 May 2026), uPlot 1.6.32 (MIT) and Chart.js 4.5.1 (MIT) — [npm: echarts](https://registry.npmjs.org/echarts); [npm: uplot](https://registry.npmjs.org/uplot); [npm: chart.js](https://registry.npmjs.org/chart.js)
  - Unity: XCharts's core library is MIT and free for commercial use, with a paid VIP tier for advanced features — [XCharts README](https://github.com/XCharts-Team/XCharts)
  - Godot 4: Easy Charts has Bar, Line and Pie plotters and real-time charts, but "is open source and still evolving" — [fenix-hub/godot-engine.easy-charts](https://github.com/fenix-hub/godot-engine.easy-charts)
- Steam requires disclosure of AI-generated in-game content and store or marketing assets (rule rewritten 16 Jan 2026). — [Slashdot](https://games.slashdot.org/story/26/01/19/1735231/valve-has-significantly-rewritten-steams-rules-for-how-developers-must-disclose-ai-use); [Notebookcheck](https://www.notebookcheck.net/Steam-updates-AI-disclosure-form-requiring-developers-to-report-visible-and-in-game-AI-but-not-background-tools.1206103.0.html)

### Inferences
**A recommended visual direction: an "energy-system control room / data-viz" look**
- **Map:** flat, desaturated land; region fills encode data (price, CO₂, renewables share) using colour-blind-safe sequential and diverging palettes; animated interconnector flow lines; strong legible labels.
- **Panels:** charts as first-class citizens (price duration curves, merit-order stacks, hourly dispatch area charts, Sankey energy flows).
- **Icons:** one coherent icon set for technologies, from game-icons.net (CC BY, credit required) or a commissioned set.
- **Decade theming:** era-specific UI chrome and colours (1990s CRT-green, 2000s, 2020s) give "progression" cheaply.

**Division of labour**
- **Agents can build:** the map renderer, charts, UI layout, theming, and simple procedural visuals (weather overlays, flow animations).
- **Buy or commission:**
  - Capsule/key art and logo, which every store surface uses.
  - One coherent icon set if the free sets clash.
  - Music, either licensed tracks or a commissioned composer.
  - Sound effects from royalty-free libraries.

**Art quality and sales in this genre**
This genre is judged by readability and depth more than fidelity. That reasoning comes from Game Dev Tycoon and Bitburner (section 2), not from sales data. The capsule and first screenshots still decide click-through, so that is where art money pays.

**Avoid AI-generated store art**
It must be disclosed, and it invites reviews about AI rather than the game.

### Gaps
- No verified figures on typical indie art or audio budgets (capsule art, icon sets, music per minute). Leads: Chris Zukowski's How To Market A Game articles and freelancer rate surveys. Get real quotes.
- No verified data on how art quality or style affects tycoon or sim sales, or on reception of AI-disclosed games.
- Engine and sales facts for the style references were not verified: Mini Metro (Dinosaur Polo Club), Offworld Trading Company (Mohawk Games), Plague Inc. and Rebel Inc. (Ndemic), and Democracy 4 (Positech).
- Kenney's licence was checked only via a Kenney-published starter kit, not kenney.nl. Audio sources (Sonniss GDC bundles, Freesound licence mix) were not checked.

## 6. Engine/stack options: comparison, trade-offs and ranked recommendation

### Takeaway
Ranked for Gridmaster, a non-programmer plus AI agents with a phone review loop, a UI- and chart-heavy 2D map sim, a strong simulation core, Steam on Win/macOS/Linux/Deck, and a browser playtest build:
1. **TypeScript web stack.** Pure-TS simulation core in a worker, DOM UI with ECharts/uPlot, SVG or PixiJS map, Electron plus a Steam adapter for Steam, and the same build in the browser.
2. **Godot 4.7 with GDScript** (with GodotSteam, which is now hosted on Codeberg).
3. **Godot 4 with C#.** No web export, so no phone playtests.
4. **Unity 6.** Free under $200K, but editor-bound.
5. **Defold.**
6. **MonoGame.**
7. **Bevy.**
8. **LÖVE.**
9. **Unreal**, which is overkill.

The web stack wins on agent-friendliness, chart and UI ecosystem, phone-playable previews, and genre precedent. Its weak points are the Steamworks binding, Electron overhead, and the JavaScript performance ceiling for heavy batch simulation. All three have known mitigations.

### Cited Findings
**Licences, versions and costs (checked 4 Oct 2026)**
- **Unity:**
  - Personal is free for "up to $200,000 in revenue and funding".
  - Pro is required above that and costs $2,310/yr per seat prepaid or $210/month: "a 5% price increase for Unity Pro, starting January 12th, 2026".
  - Enterprise is required above $25M in annual revenue.

  — [Unity: Changes to subscription plans and pricing](https://unity.com/products/pricing-updates)†
- The Runtime Fee was cancelled before it took effect: "Unity cancels Runtime Fee before controversial pricing structure even goes into effect in Unity 6". — [Notebookcheck](https://www.notebookcheck.net/Unity-cancels-Runtime-Fee-before-controversial-pricing-structure-even-goes-into-effect-in-Unity-6.887828.0.html) (headline only); [Blue's News: "Unity Dropping Per Install Fee"](https://www.bluesnews.com/s/275818/unity-dropping-per-install-fee) (headline only)
- **Godot:**
  - It is MIT-licensed ("Permission is hereby granted, free of charge…") — [godot LICENSE.txt](https://github.com/godotengine/godot/blob/master/LICENSE.txt).
  - Releases ([godotengine/godot releases](https://github.com/godotengine/godot/releases)):
    - 4.6: 26 Jan 2026
    - 4.6.3: 20 May 2026
    - 4.7: 18 Jun 2026
    - 4.7.1: 14 Jul 2026
    - 4.7.2: 18 Aug 2026 (current stable)
- **MonoGame:** Microsoft Public License (Ms-PL) — [MonoGame LICENSE.txt](https://github.com/MonoGame/MonoGame/blob/develop/LICENSE.txt). It targets "desktop, mobile, and console", with Vulkan and DirectX 12 in preview for 3.8.5. — [MonoGame README](https://github.com/MonoGame/MonoGame)
- **LÖVE:** "License: zlib" — [love license.txt](https://github.com/love2d/love/blob/main/license.txt)
- **Defold:** uses its own "Defold License, Version 1.0, May 2020" — [defold LICENSE.txt](https://github.com/defold/defold/blob/dev/LICENSE.txt)
- **Bevy:** early-stage with about 3-monthly breaking releases; latest 0.19.1 (section 1) — [bevyengine/bevy](https://github.com/bevyengine/bevy)
- **Web runtimes and renderers (npm, 4 Oct 2026):**
  - Electron 44.5.1 (30 Sep 2026, MIT) — [npm: electron](https://registry.npmjs.org/electron)
  - NW.js 0.117.0 (26 Sep 2026) — [npm: nw](https://registry.npmjs.org/nw)
  - Tauri API 2.12.1 (30 Sep 2026, Apache-2.0 or MIT) — [npm: @tauri-apps/api](https://registry.npmjs.org/@tauri-apps/api)
  - PixiJS 8.22.0 (1 Oct 2026, MIT) — [npm: pixi.js](https://registry.npmjs.org/pixi.js)
  - Phaser 4.2.1 (9 Jul 2026, MIT) — [npm: phaser](https://registry.npmjs.org/phaser)
- **Phaser** can be "compiled to iOS, Android, Steam and native apps using 3rd party tools". The minified build is 345 KB gzipped. — [phaserjs/phaser](https://github.com/phaserjs/phaser)
- **Tauri** renders through the system webview: "WKWebView on macOS & iOS, WebView2 on Windows, WebKitGTK on Linux". Tauri v2 needs webkit2gtk 4.1 on Linux. — [tauri-apps/tauri README](https://github.com/tauri-apps/tauri)

**Web export and browser builds**
- Godot web export ([godot-docs exporting_for_web.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/export/exporting_for_web.rst)):
  - "Projects written in C# using Godot 4 currently cannot be exported to the web… To use C# on web platforms, use Godot 3 instead."
  - "Godot 4 can only target WebGL 2.0 (using the Compatibility rendering method)… Godot currently does not support WebGPU."
  - Multi-threaded web builds need "complete cross-origin isolation (meaning no ads, nor third-party integrations…)". Since 4.3 a single-threaded export is "the preferred and now default way", with some audio-effect limits.
  - "The Web export can run on mobile platforms with some caveats", and native exports "will always perform better by a significant margin".
- Godot C# web export is in progress. On 14 Nov 2025 a contributor wrote "C# web support is in work", referencing PR #106125; it was "not ready yet" in late Dec 2025. — [godot-proposals discussion #13076](https://github.com/godotengine/godot-proposals/discussions/13076)

**Performance and UI**
- Godot FAQ ([godot-docs FAQ](https://github.com/godotengine/godot-docs/blob/master/about/faq.rst)):
  - "In general, the performance of C# and GDScript is within the same order of magnitude, and C++ is faster than both."
  - "C# can be slower than GDScript when making many Godot API calls, due to the cost of marshalling. C#'s performance can also be brought down by garbage collection."
  - It recommends "C++ and GDExtensions for performance-heavy tasks and GDScript (or C#) for the rest".
  - "Godot features an extensive built-in UI system, and its small distribution size can make it a suitable alternative to frameworks like Electron or Qt."
- shapez's JavaScript engine needed hand-tuning, avoiding slower ES2015 features in hot loops (section 2). — [shapez.io README](https://github.com/tobspr-games/shapez.io)

**Steamworks integration by stack**
- **GodotSteam** ("An ecosystem of tools for Godot Engine and Valve's Steam. For Linux, Mac, and Windows"; 3,754 stars):
  - The GitHub repository was archived on 4 Sep 2026 and "moved to Codeberg" — [GodotSteam/GodotSteam](https://github.com/GodotSteam/GodotSteam).
  - The GodotSteam-Server, MultiplayerPeer, Docs and Skillet repositories are also archived on GitHub, with a Codeberg link — [GodotSteam org](https://github.com/GodotSteam).
- **Steamworks.NET (Unity or any C#):**
  - "fully supports Windows (32 and 64 bit), OSX, and Linux. Currently building against Steamworks SDK 1.65"; MIT licence — [rlabrecque/Steamworks.NET](https://github.com/rlabrecque/Steamworks.NET).
  - The last release is 2025.164.1 (2 Aug 2025, SDK 1.64) — [releases](https://github.com/rlabrecque/Steamworks.NET/releases).
- **Facepunch.Steamworks:** MIT; Windows, Linux and macOS; Unity and Unity IL2CPP support; "Single C# dll (no native requirements apart from Steam)". — [Facepunch/Facepunch.Steamworks](https://github.com/Facepunch/Facepunch.Steamworks)
- **steamworks.js (Electron/NW.js)** — [ceifa/steamworks.js](https://github.com/ceifa/steamworks.js); [client.d.ts](https://github.com/ceifa/steamworks.js/blob/main/client.d.ts):
  - Namespaces: achievement, apps, auth, callback, cloud, input, localplayer, matchmaking, networking, overlay, stats, utils, workshop.
  - Using it in the renderer needs `contextIsolation: false` and `nodeIntegration: true`.
  - The overlay needs `electronEnableSteamOverlay()`.
  - Last npm release: 0.4.0 (6 Aug 2024).
- **steamworks-ffi-node (Node/Electron, MIT)** — [ArtyProf/steamworks-ffi-node](https://github.com/ArtyProf/steamworks-ffi-node); [npm](https://registry.npmjs.org/steamworks-ffi-node):
  - Version 0.11.3, published 24 Sep 2026; "Steamworks SDK v1.64 integration" via Koffi FFI.
  - "16 Complete API Managers", including achievements, stats, leaderboards, cloud and workshop.
  - "EXPERIMENTAL: Native Overlay for Electron – Metal (macOS), OpenGL (Windows), OpenGL 3.3 (Linux/SteamOS)".
- **greenworks:** "maintained on a best-effort basis … active development is not a priority"; last npm publish 0.1.0 in 2016. — [greenheartgames/greenworks](https://github.com/greenheartgames/greenworks); [npm registry](https://registry.npmjs.org/greenworks)

**Chart and UI ecosystems**
- JavaScript has mature chart libraries: ECharts (Apache-2.0), uPlot and Chart.js (MIT). — [npm: echarts](https://registry.npmjs.org/echarts); [npm: uplot](https://registry.npmjs.org/uplot); [npm: chart.js](https://registry.npmjs.org/chart.js)
- Godot's main chart add-on (Easy Charts) is "still evolving". — [fenix-hub/godot-engine.easy-charts](https://github.com/fenix-hub/godot-engine.easy-charts)
- Unity has XCharts (MIT core plus paid VIP). — [XCharts README](https://github.com/XCharts-Team/XCharts)

**Agent tooling**
- Godot MCP — [Coding-Solo/godot-mcp](https://github.com/Coding-Solo/godot-mcp)
- MCP for Unity, which needs a running Unity Editor — [CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp)
- Phaser's agent skills — [phaserjs/phaser](https://github.com/phaserjs/phaser)

### Inferences
**Comparison (my synthesis of the cited facts above)**

| Stack | Cost/licence | Browser build for phone playtests | Steam route (achievements/cloud/Workshop) | Charts/UI for this genre | Sim performance | Agent-friendliness |
|---|---|---|---|---|---|---|
| **TypeScript + Electron** (DOM UI, ECharts/uPlot, SVG or PixiJS map) | Free (MIT/Apache) | Native: same code | steamworks.js (stale), community fork, or steamworks-ffi-node (young); keep behind an adapter | Best ecosystem | JIT is fast enough for linear per-hour algorithms; add a worker or WASM if needed | Best: text only, typechecked, headless Node tests |
| **Godot 4.7 + GDScript** | Free (MIT) | Yes, WebGL2, single-thread by default | GodotSteam (mature; now on Codeberg) | Good UI system; charts must be hand-built or use Easy Charts | Interpreted; same order as C# per the FAQ; GDExtension for hot loops | Good: text scenes, headless CLI, godot-ci, MCP. Watch 3/4 drift and UIDs |
| **Godot 4 + C#** | Free | **No** (in progress) | GodotSteam C# or Steamworks.NET (route not verified) | As above | Better than GDScript for pure computation; GC caveat | Good code, but loses phone playtests |
| **Unity 6** | Free ≤ $200K; Pro $2,310/yr | WebGL build exists (not verified here) | Steamworks.NET or Facepunch (both MIT) | XCharts, UGUI/UI Toolkit | Strong (C#, Burst/Jobs) | Medium: editor-bound, licence activation in CI, MCP needs the editor |
| **Defold** | Custom Defold License 1.0 | Reportedly strong HTML5 (not verified) | Not verified | Basic GUI | Lua | Medium-low: editor-centric, small corpus |
| **MonoGame** | Ms-PL | Not first-class (not verified) | Steamworks.NET or Facepunch | None built in | C# | Code-only (good), but you build all UI yourself |
| **Bevy** | (MIT/Apache, not verified) | WASM possible (not verified) | Not verified | Immature UI | Excellent (Rust ECS) | Low: breaking changes every ~3 months, steep learning curve |
| **LÖVE** | zlib | Unofficial (not verified) | Community bindings (not verified) | DIY | LuaJIT | Code-only, but DIY everything |
| **Unreal** | Royalty model (not verified) | No practical route | Built-in subsystem (not verified) | Heavy UMG | Overkill | Low: Blueprints are binary, huge editor |

**Ranked recommendation and reasons**

1. **TypeScript web stack, packaged with Electron for Steam.**

   *Reasons:*
   - It is the most agent-friendly stack: plain text, a strict typechecker, headless Node tests, and no editor or licence in CI.
   - It has the richest chart, table and map ecosystem for a game whose main screens are charts and a map.
   - Every PR can produce a phone-playable preview URL, which fits Lukas's review loop.
   - There is direct genre precedent on Steam (Game Dev Tycoon, Bitburner; plus shapez and CrossCode).
   - The same build doubles as a free browser demo or playtest.

   *Concrete shape:*
   - `sim/` as a pure-TS package running in a Web Worker.
   - React for UI (the largest training corpus; Svelte is a lighter alternative).
   - ECharts for rich charts (Sankey, heatmaps, stacked areas) and uPlot for long hourly time series.
   - SVG for the base map, with PixiJS v8 if animated flows need WebGL.
   - Electron (not Tauri: Tauri's system webviews mean WebKitGTK on Linux/Steam Deck and no Chromium overlay path), packaged for Win/macOS/Linux.
   - A `SteamAdapter` interface with a no-op browser implementation. Start with steamworks-ffi-node or a maintained steamworks.js fork pinned to an exact version, plus `in-process-gpu` and `disable-direct-composition` for the overlay.

   *Main risks and mitigations:*
   - **Steamworks-binding churn:** keep the adapter small and pin the version; touch only achievements, cloud and workshop.
   - **Electron size and memory:** acceptable for a PC sim.
   - **Heavy batch simulation:** use linear per-hour algorithms and a worker; WebAssembly (for example Rust) for the market-clearing hot loop is a later escape hatch, not a day-one choice.

2. **Godot 4.7 + GDScript.** The best conventional engine for this game. It is free (MIT) with a strong built-in UI system, text scenes and a headless CLI. It has CI images and actions, a web export for GDScript, GodotSteam for Steam, native Linux/Deck builds, and better controller and animation tooling than a web stack.

   It ranks second because:
   - GDScript has a smaller corpus, and agents mix up Godot 3 and 4 APIs.
   - Editor-managed `uid://` references are easy for agents to break.
   - Chart widgets must be hand-built.
   - Heavy simulation would push toward GDExtension (C++/Rust), which complicates CI for agents, or C#, which kills the web build.
   - GodotSteam's move to Codeberg (Sep 2026) changes where CI fetches it from.

   Pick Godot instead of web only if visual ambitions grow (2.5D map with shaders, lots of animation) or Steam Deck "Verified" with full controller UI becomes a priority.

3. **Godot 4 + C#.** C# is better for computation and well known to models, but C# projects cannot be exported to the web (C# web export is still a work in progress as of Oct 2026). That removes phone-playable previews, a core requirement. Revisit if C# web export ships.

4. **Unity 6.** Free below $200K revenue and funding, with mature Steam bindings (Steamworks.NET, Facepunch) and charts (XCharts).

   It ranks fourth because:
   - The workflow is editor-bound: scenes, prefabs and `.meta` GUIDs. Unity's own MCP bridge needs a running Editor, and CI needs licence activation.
   - Unity changed its pricing several times: the Runtime Fee was announced and then cancelled, and Pro rose 5% on 12 Jan 2026. That counts against long-term trust for a decade-long hobby project.

5. **Defold.** Good web export reputation, but editor-centric, Lua and limited GUI.
6. **MonoGame.** Code-only C#, but no UI toolkit, so the whole UI framework would have to be built.
7. **Bevy.** Ideal ECS performance, but immature UI and breaking releases every 3 months put agents permanently behind.
8. **LÖVE.** Do-it-yourself UI, charts and web build.
9. **Unreal.** Overkill for a 2D chart and map sim, and Blueprints are binary.

**What would change the ranking**
- If prototyping shows the hourly multi-region market sim cannot run fast enough in TypeScript even with a worker and linear algorithms, move only the market-clearing kernel to WebAssembly. Do not change engines.
- If Valve-side Steam features break in Electron (overlay, input), the adapter isolates the damage. Godot becomes the fallback engine, with the TypeScript simulation rules ported or re-specified from the data files and the test suite.

### Gaps
- **Unreal licence terms** (reportedly a 5% royalty on gross revenue above $1M per product): not verified (unrealengine.com blocked).
- **Unity Runtime Fee dates:** commonly reported as announced 12 Sep 2023 and cancelled 12 Sep 2024 by CEO Matt Bromberg, alongside Unity 6. Not verified: unity.com, Wikipedia and the news articles could not be opened, and only the headlines above were seen.
- **Unity 6 Personal details:** the optional splash screen and the 2025 Pro price ($2,200, consistent with $2,310 being a 5% rise) were not verified.
- **GodotSteam on Codeberg:** current feature coverage (UGC/Workshop, Remote Storage, Input) and latest release could not be read (codeberg.org blocked). The archived GitHub content did not render.
- **Steam overlay outside Electron:** whether it works in Tauri or NW.js was not verified. Electron's overlay quirks on Steam Deck/Linux were not checked.
- **Other engines' details not verified:** Defold's licence terms beyond the title and its HTML5 export; MonoGame's and LÖVE's web options; Bevy's exact licence; Unity WebGL build specifics.
- **Electron size and memory:** no measurements were collected.
- **macOS:** code signing and notarization cost (Apple Developer Program) was not verified.
- **Godot 4.7 "wasm64 web export":** claimed only by a weak secondary source ([gtstu.com](https://gtstu.com/?p=4758)); not verified against release notes (godotengine.org blocked).
- **Balatro on LÖVE:** a frequently cited proof of LÖVE's commercial viability, not verified this session.
