# Decisions

The log of what is decided, and the questions waiting for Lukas. A decided
item is not re-opened by an agent; only Lukas re-opens it. Decisions Lukas
makes in chat are added here in the same session, with his words quoted.

## Decided

D6–D9 were answered in chat on 2026-10-04, right after Lukas read the
research summary; each was the recommended option, chosen as offered.

### D9 — First-release scope as proposed (Lukas, 2026-10-04)
Chose: "Yes, that size". The table in `docs/roadmap.md` ("First-release
scope") is the scope: 10 zones, a 1990–2030 campaign plus sandbox, about 12
technologies including three experimental bets (liquid-air storage,
power-to-X, wave), three AI rivals, Windows and macOS. Everything else ships
as updates. Changing the table needs Lukas.

### D8 — Computers first; tablets reconsidered after launch (Lukas, 2026-10-04)
Chose: "Computers first". Windows and macOS on Steam; the phone is for
reviewing builds in a browser; no hover-only information, so a tablet
version stays possible. Answers D4's open "maybe mobile".

### D7 — Technology: TypeScript web stack (Lukas, 2026-10-04)
Chose: "Yes, web technology". Approved now, for Phases 1–2: **TypeScript,
Vite, Vitest, ECharts, fast-check**. Still needing their own approval when
the time comes: PixiJS (only if the map needs it; plain SVG first),
Electron and a Steam library (Phase 4, after a technical spike), and the
preview host for phone links (Phase 1, terms checked first). Any other
dependency still needs Lukas.

### D6 — The vision is approved (Lukas, 2026-10-04)
Chose: "Yes, go with it". `docs/vision.md` is the direction: the market
fights back, history sets the difficulty, real weather drives computed
prices. Its open design questions are for the design task; changing a
pillar needs Lukas.

### D5 — Scope: realistic, without compromising quality or fun (Lukas, 2026-10-04)
> "We also need to scope the game realistically so it is not too big of a task
> to create, but we cannot compromise on quality and fun."

Honoured by `docs/roadmap.md`: scope by systems, not content; a small first
release, polished, grown afterwards; gates that test fun before content.

### D4 — Platforms: Windows and macOS; mobile only if it proves better (Lukas, 2026-10-04)
> "I want it to be playable on macos and windows at some point. Maybe mobile if
> we think it is better."

Windows and macOS through Steam are requirements. Mobile: settled by D8.

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
Q1–Q4 were answered on 2026-10-04 and are D6–D9 above. The reasons behind
each recommendation are in the research report
(`docs/research/reports/Renewable energy tycoon game research.md`).

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
