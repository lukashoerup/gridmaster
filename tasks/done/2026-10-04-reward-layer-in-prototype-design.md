Model: opus

# Task: put the reward layer (D14) into the one-zone prototype design

## Status
**Done 2026-10-04.**

## Goal
Lukas answered Q6 in chat: "Go with your recommendation, including company
levels and the rival." Record it as D14 and turn the chosen proposals from
`docs/reviews/2026-10-04-fun-and-progression.md` into design a builder can
implement without guessing: P1 "called it", P2 company levels, P3 offers,
P4 a named rival, P7 jackpots/records/footprint, P9 restructuring, P10
playtest measures.

## Acceptance criteria
- [x] D14 in `docs/decisions.md` with Lukas's words; Q6 closed
- [x] `docs/design/one-zone-prototype.md`: §4.9 levels, §4.10 offer deck,
      §4.11 Nordhav, §4.12 "called it" and scorecards, §4.13 jackpots,
      records and footprint; restructuring in §4.5; the walkthrough (§2),
      loops (§3), wireframes (§5), numbers (§6), goals (§7), counters (§8),
      playtest (§9) and decisions (§10) updated to match
- [x] Every new number marked [tuning] or [unverified]; bots play by the
      same rules as the player, so the nightly runs catch a dominant offer
      or perk
- [x] Roadmap, review status and the Phase 1 task (an architecture note
      for re-pricing assets) updated

## Scope
**May change:** `docs/design/`, `docs/decisions.md`, `docs/roadmap.md`,
`docs/reviews/` (status only), `tasks/`.
**Must NOT:** change a pillar; add a dependency; write code; adopt the
deferred proposals (P5, P8) or P6.

## Docs affected
All listed above. `docs/vision.md` is unchanged: the reward layer fits its
pillars ("rivals under invented names", "chores become delegable").

## Working notes (agent fills in)
- Nordhav Energi is the research report's working name; it needs a
  trademark check before any public build (like the game's name, D3).
- "Homes supplied" uses ~4 MWh per Danish household a year [unverified];
  check it in the verification pass.
- The trading desk and "called it" both re-price an asset against the run's
  stored hourly prices; the Phase 1 task now asks the core to keep them
  retrievable.
- No code or tests exist yet; nothing to run before committing.
