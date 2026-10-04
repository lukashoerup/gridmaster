# Roadmap

**Current phase: 1 — market toy.** Phase 0 closed 2026-10-04: research done,
direction, technology, platforms and first-release scope decided (D6–D9 in
`docs/decisions.md`). Next up: the Phase 1 task and, in parallel, the design
of the one-zone prototype. Open: Q5 (network access), needed for real data
and the verification pass.

## The principle: find the fun before adding content
Lukas's constraint (decision D5) is a realistic scope with no compromise on
quality or fun. The way to honour both: **scope by systems, not content.**
Countries, technologies and events are data; once the systems that use them
are proven, adding one more is cheap. So each phase proves one thing and ends
at a gate — a question answered by playing or looking, never by an agent's
report. Content grows only after the fun is proven.

Two facts from the research shape the plan. For most games **the first paid
launch is the big one** (only 20% of 2025's Early Access graduates earned more
at 1.0), so nothing is sold before it is polished. And **adding maps does not
fix a repetitive strategy** (Turmoil, Rise of Industry), so the core loop is
proven on one zone before Europe is built.

## Phases

### Phase 0 — Research and direction ✓ (2026-10-04)
- Done: research report, vision, this plan, first task files.
- **Gate passed:** Lukas approved the vision, the TypeScript stack, computers
  first and the first-release scope (D6–D9).
- Still to run: a verification pass on the report's unverified facts, in a
  session with wider network access (Q5; `tasks/`).

### Phase 1 — Market toy: does the simulation feel real? ← now
- **Build:** the headless simulation core — real weather-years, demand, and
  an hourly merit-order price for four zones (Denmark, Germany, Norway,
  Spain), 1995–2025 — plus a web page of charts to explore it from a link on
  a phone.
- **Gate (Lukas looks):** do prices behave like the real ones? Daily and
  seasonal shapes; volatility rising with renewables; negative prices in
  Germany from 2008; solar's own price sagging as solar is built.

### Phase 2 — One-zone prototype: is the core loop fun?
- **Build:** ugly but playable in a browser. One zone, the panel-to-market
  loop: start with a few panels under a feed-in tariff, grow into solar and
  wind parks, meet the spot market, see your own building lower your price,
  answer it with a battery. Loans, speed controls, "why did my price drop?".
- **Gate:** Lukas and 3–5 friends play for 45 minutes. Does cannibalisation
  read as a puzzle rather than a punishment, and do they want to keep going?
  Iterate until yes. **This is the gate that matters most;** if the answer
  stays no, the core loop changes before any content is added.

### Phase 3 — Vertical slice: would we show it to strangers?
- **Build:** grow to 3–5 zones; the 1990–2010 chapters fully polished:
  interface, tutorial, sound, rivals, events, interconnectors.
- **Money decisions arise here** (each goes to Lukas first): commissioned
  capsule art, logo and trailer (AI-generated store art must be disclosed and
  draws reviews about AI instead of the game), licensed music; the $100 Steam
  fee, paid early because a 30-day clock starts; an accountant's check of the
  Danish business, tax and VAT set-up before that; an Apple developer account
  if signed macOS builds are needed.
- **Gate:** 1–2 hours we would proudly show strangers → Steam "Coming Soon"
  page and Playtest keys; wishlists start.

### Phase 4 — First release
- **Build:** the scope below; Steam achievements and cloud saves; Windows and
  macOS builds; a demo for one Steam Next Fest (a game gets only one; June
  2027 at the earliest; registration closes about seven weeks before).
- **Gate:** launch only with a polished slice and roughly 10,000+ wishlists.
  Early Access versus full launch is decided here, on the evidence.

### Phase 5 — Launch and grow
The rest of Europe as map packs, the speculative 2030–2060 era, more
scenarios, German first among translations, tablets reassessed.

## First-release scope — approved (decision D9)
| Area | First release | Later, as updates or DLC |
|---|---|---|
| Map | 10 zones with contrasting weather and markets: DK1, DK2, Germany, Netherlands, Belgium, France, Great Britain, Norway, Sweden, Spain | The full 30–40-zone Europe, as map packs |
| Time | A 1990–2030 campaign in four era chapters with medal goals; a sandbox running to 2050 | Most of the 2030–2060 speculative tree |
| Simulation | Hourly zonal merit order; interconnector limits; scarcity pricing; negative bids; hydro water values; rule-based storage; tariff mode switching to market mode; feed-in tariff → premium → auctions and CfDs; fuel and carbon paths | 15-minute products, balancing and capacity markets, flow-based coupling |
| Technology | Small and multi-MW onshore wind, rooftop and utility solar, fixed offshore wind, lithium batteries, run-of-river, reservoir and pumped hydro, large nuclear as a megaproject; **three experimental bets: liquid-air storage, power-to-X with offtake contracts, wave power with failure risk** | Floating wind, tidal, compressed-air and gravity storage, airborne wind, small modular reactors, energy islands, fusion |
| Rivals and finance | Three AI rival archetypes competing for sites, auctions and grid slots; loans across interest-rate eras; a policy-risk meter | Stock market, takeovers, multiplayer |
| Events and modes | About 15 dated historical events with randomised variants; 2–3 crisis scenarios; three difficulty presets plus toggles | Weekly seeded challenges; Workshop mods (designed for, shipped later) |
| Platforms and languages | Windows and macOS on Steam; Linux and Steam Deck "Playable" if cheap; English, built for translation | Tablets; a controller-complete Deck "Verified" interface; German first, then more |
| Presentation | Diagrammatic map and charts, one icon set; commissioned capsule art, logo and trailer; licensed music | 3D views, animated plants |

**Never cut for scope:** the market simulation's credibility, the
explanation behind every number, the tutorial, and the polish of the first
hour. Cut zones, technologies and modes instead — they come back as updates.
