# Decisions

The log of what is decided, and the questions waiting for Lukas. A decided
item is not re-opened by an agent; only Lukas re-opens it. Decisions Lukas
makes in chat are added here in the same session, with his words quoted.

## Decided

### D5 — Scope: realistic, without compromising quality or fun (Lukas, 2026-10-04)
> "We also need to scope the game realistically so it is not too big of a task
> to create, but we cannot compromise on quality and fun."

Honoured by `docs/roadmap.md`: scope by systems, not content; a small first
release, polished, grown afterwards; gates that test fun before content.

### D4 — Platforms: Windows and macOS; mobile only if it proves better (Lukas, 2026-10-04)
> "I want it to be playable on macos and windows at some point. Maybe mobile if
> we think it is better."

Windows and macOS through Steam are requirements. Mobile: see Q3.

### D3 — The name waits; "Gridmaster" is the internal working title (Lukas, 2026-10-04)
> "Lets wait on the name for a while until we know what we want."

Constraint for whoever picks it up: a Steam game titled exactly "Gridmaster"
already exists (app 2678560), so the public name must differ. Options and the
criteria for choosing: the report's naming section. Renaming is cheapest
before a Steam "Coming Soon" page starts collecting wishlists, so the name is
due by the end of Phase 3 at the latest.

### D2 — The repo is private (2026-10-04)
Created by Lukas on request. Private is the reversible choice for a commercial
game: making it public later is one click; un-publishing is impossible.

### D1 — The founding brief (Lukas, 2026-10-04)
`docs/original-brief.md`.

## Open — waiting for Lukas
Recommendations come from the 2026-10-04 research report
(`docs/research/reports/Renewable energy tycoon game research.md`).

### Q1 — Approve the direction (taste)
`docs/vision.md`: the pillars, how it plays, and what it is not. The one idea
everything rests on: prices come from a simulated market the player is part
of, so the market "fights back" when everyone builds the same thing.

### Q2 — Approve the technology (dependency rule)
**Recommended: a TypeScript web stack**, packaged with Electron for Steam.
Why: AI agents write and test it most reliably; it has the best charts and
maps; every change can be played from a link on a phone; Windows and macOS
come from the same code; Game Dev Tycoon, Bitburner and shapez shipped on
Steam this way. Runner-up: Godot 4 with GDScript.

Approval is staged so each step is a real decision:
- **Now, for Phases 1–2:** TypeScript, Vite (build), Vitest (tests),
  ECharts (charts), fast-check (property tests). All permissively licensed.
- **Phase 2–3, if the map needs it:** PixiJS (otherwise plain SVG, no
  dependency).
- **Phase 4, after a technical spike:** Electron and a Steam library
  (steamworks-ffi-node or a maintained steamworks.js fork) — the weakest
  link of this stack, isolated behind one adapter so it can be swapped.
- **Preview hosting** for phone links is decided with Phase 1 (check the
  terms: free tiers of some hosts are for non-commercial use only).

### Q3 — Mobile: computers first, tablets reassessed after the PC launch
**Recommended: not a launch platform.** The buyer is a premium PC strategy
player; the energy slot on mobile is held by a free game (Energy Manager);
the main screens are dense charts and a map; separate stores and touch
design would add scope that D5 rules out. The phone still matters now — as
the browser where Lukas reviews every build. The interface avoids
hover-only information, which keeps a tablet version possible.

### Q4 — Approve the first-release scope
`docs/roadmap.md`, "First-release scope": 10 zones, a 1990–2030 campaign,
about 12 technologies including three experimental bets (liquid-air storage,
power-to-X, wave), three AI rivals, Windows and macOS. Everything else as
updates.

### Q5 — Network access for verification and data (access; can wait)
This session's environment blocked most websites (Steam, Copernicus, ENTSO-E,
Wikipedia, trademark registers), and the session's web-search budget ran out,
which is why much of the report is marked unverified. A later session needs
wider network access to verify facts and download weather data. Lukas changes
it in the environment's settings (cloud environment menu → Edit → Network
access: a broader level, or Custom with the needed domains added); steps:
https://code.claude.com/docs/en/cloud-environments#network-access.
A new session starts with a fresh search budget.

No decision above costs money. The first money decisions (art, music, the
Steam fee, accountant, Apple developer account) arise in Phase 3 and are
listed in `docs/roadmap.md`.
