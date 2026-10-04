Model: opus

# Task: verify the research before anything depends on it

## Status
**Blocked** on decision Q5: the 2026-10-04 session's network policy blocked
almost every source site, and its shared 200-call web-search budget ran out.
Run this in a **new** session (fresh search budget) **after** Lukas has
widened the environment's network access. If a site is still blocked, record
it and move on — never route around the policy.

## Goal
Turn the report's extract-level facts into checked facts, in the order they
block work. The list and its reasons are the report's final section, "What a
follow-up verification pass must check, in priority order"
(`docs/research/reports/Renewable energy tycoon game research.md`).

## Acceptance criteria
- [ ] Items 1–3 checked (they block the next decisions):
      1. competitor reality — store pages, review counts, prices, and whether
         any title models wholesale prices, cannibalisation or storage;
      2. data licences — PECD 4.2/CDS wording, ENTSO-E re-use terms, the Global
         Solar Atlas addition, PVGIS/EMHIRES, Pink Sheet, DEA, Natural Earth;
      3. stack facts for Q2 — Electron with the Steam overlay on macOS, Linux
         and Deck; the state of steamworks-ffi-node and steamworks.js forks
- [ ] Each finding written back into the research notes with its new marker
      (`[fetched]` with the date), and contradictions flagged in the report
- [ ] Every licence confirmed for a dataset the Phase 1 task will use gets its
      row in `docs/licences.md`
- [ ] Items 4–10 checked as far as the session allows; the rest listed as
      still open in the working notes
- [ ] A short "what changed" summary for Lukas at the top of the report, in
      plain language

## Scope
**May change:** `docs/research/`, `docs/licences.md`, `docs/decisions.md`
(only to flag that a recommendation changed — never to decide), `tasks/`.
**Must NOT:** change the vision or roadmap on its own; a finding that changes a
recommendation goes to Lukas.

## Docs affected
The report, its notes, `docs/licences.md`.

## Size check
One to two sessions. Items 1–3 first; stop and commit after them.

## Working notes (agent fills in)
