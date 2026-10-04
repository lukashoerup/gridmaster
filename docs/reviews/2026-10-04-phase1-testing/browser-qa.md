# QA report — Gridmaster market explorer (Phase 1)

Tester: a browser QA subagent, 2026-10-04, against a fresh `npm run build` of a copy
of main at `7cadbaa`. `dist/` served from a nested subfolder with `python3 -m http.server`
and driven with Playwright Chromium at:
- 390×844 phone (deviceScaleFactor 3, touch, isMobile), 390×844 at 1×, 320×640 with touch;
- 768×1024, 900×900, 1280×800;
- width sweeps 320–1920 px.

Scripts (`t01`–`t20`) and screenshots (`shots/`) are in the session scratchpad
`qa-browser/`.

**Totals:** 0 blocker, 3 major, 13 minor, 5 cosmetic.

**Baseline timings** (laptop, settled, nothing queued):
- first year on screen ~1.0 s; all 31 long-run years 11–12 s;
- the "What solar earns" chart last, at ~14 s;
- zone change: 0.5 s for the per-year charts, ~13 s for everything;
- year change: 0.4 s for the per-year charts, ~2.3 s for the solar chart;
- memory flat over 10 settled changes (~530–600 MB).

## Major
**M1. Quick changes pile up; the page shows the old zone/year/seed for up to two minutes.** Every replaced request still runs to the end in the worker, one after another, and the latest choice waits behind all of them.

| Action | Latest choice on screen after |
|---|---|
| 5 zone changes 150 ms apart | 55.9 s (everything 68.7 s) |
| 10 × New seed | 116 s (127 s) |
| 15 × Year ArrowUp | 35 s |
| 8 solar-slider key presses | 87 s |
| 5 seed-spinner steps | ~70 s |
| Year change during the initial load | 13.1 s |

Meanwhile:
- every chart and the summary show the previous selection under the new control values;
- no chart title names the zone or year, so the mismatch is invisible;
- the status line reports long-run progress or "All 31 years simulated in …" while the user's own change still waits.

Results never arrived out of order.

**M2. After moving the solar slider, the summary contradicts itself and the per-year charts lag ~12 s.**
- Releasing the slider sends the 31-year rerun first; the single-year request follows 120 ms later and waits behind it.
- Any re-render in that window mixes the new slider value with the old results, e.g. "solar earned 47.6 €/MWh (68 %) from 3.0 GW, of which 5.0 GW added by the slider".
- The "Now" dot moves to 5 GW but keeps the 0 GW price.
- Each keyboard arrow press starts a full rerun.

**M3. Summary numbers disagree with the long-run charts for the same zone, year and seed** (Norway by up to 2×):
- NO 2008: 97.7 vs 48.2 €/MWh;
- NO 2022: 67.7 vs 28.1;
- NO 1999: 18.2 vs 7.1;
- DK1 2022: 126.0 vs 118.3 (negative hours 700 vs 702).

The summary year runs on its own from standard starting levels, while the long run carries reservoirs over. That is explained only in the footer.

## Minor
- **m1. The hourglass never clears.** It stays on after two quick changes, because replies to replaced requests are ignored without lowering the pending count.
- **m2. The offers chart draws blocks outside its axes:** past the x-axis end and above the y-axis top, nearly into the card title on a phone.
- **m3. "What solar earns" stays empty ~14 s** after load and after every zone or seed change, because it waits behind the long run. The status already says "All 31 years simulated…" while it is still empty.
- **m4. Week chart dates are unreadable on a phone:** "07-0107-0207-…" at 390 and 320 px.
- **m5. Legends hide the key series and cut names off.** They page ("1/2" laptop, "1/4" phone) with Price on a later page, and names are truncated ("De", "Batteri", "Gas (CCGT/CH").
- **m6. The offers-chart caption is often false.** "Price settles where offers meet demand" fails when a neighbour sets the price: DK1 2024 seed 1 week 26 hour 60 has a price of 36.4 with no local offer at 36.4. That happens in 2,513 of 8,784 h for DK1 2024 and 919 for DE. In regulated years the price line sits flat at the tariff while offers meet demand elsewhere. Partly-run blocks are drawn as fully run (~7,000 in DK1 2024).
- **m7. Other captions don't match what's shown:**
  - The week chart says "imports or storage filled the gap", but storage is already in the stack, so a shortfall is always imports.
  - In regulated years, the duration and solar captions sit under flat lines.
  - Spain's annual caption promises dotted neighbours and mentions Norwegian reservoirs.
- **m8. The solar slider silently changes the long-run charts for every year since 1995** (e.g. 8 TWh of solar in DK1 in 1995). Solar's capture rate goes negative in 2011–14 ("Solar −40 %"), and the y-axis minimum of 0 hides it.
- **m9. The Seed box accepts or ignores input silently.**
  - `-1` is ignored: the box shows −1 while the charts stay on the old seed.
  - Empty, `abc`, spaces and `1e400` all become seed 0.
  - `1e12` and `4294967296` are accepted although above the maximum; the latter wraps to seed 0. The URL they produce is rejected on reload and falls back to seed 42, so a copied link doesn't reproduce the view.
- **m10. If the worker cannot start, the page hangs or freezes without saying so.**
  - Worker 404: "Simulating… ⏳" forever, empty charts, no error message.
  - No Worker support: the inline fallback freezes the page ~14 s on load and after each zone change.
- **m11. Editing the URL hash in an open tab is ignored.** There is no hashchange listener. Also, `#solar=3.33` puts the thumb at 3.5 with the label "3.3 GW", and `#week=` (empty) is read as 0.
- **m12. Dragging Week or Hour re-renders all four per-year charts**, re-sorting 8,784 prices and rebuilding the solar chart at every step (50–70 ms each).
- **m13. Phone tap targets are below 44 px:** controls 36 px, sliders 32 px with a ~16 px thumb, legend entries 12–15 px. Text sizes are fine (smallest 12.3 px; chart labels 11 px).

## Cosmetic
- **c1.** Offers-chart labels collide: the "demand…" and "local supply…" labels overprint, and "local" is cut off. Odd ticks:
  - offers x-axis ends on a stray "88,500", y floor shows −7 / −18 / −43;
  - duration x ticks are 1, 1465, 2929…;
  - Spain's "hours < 0" axis shows 0.2–1.
- **c2.** "Highest" can read below "lowest" (DE 1999 "lowest 38.4, highest 38"), because the maximum is rounded to whole euros.
- **c3.** "net exports −14.4 TWh" should read "net imports 14.4 TWh". Early years say "from 0.0 GW".
- **c4.** Tooltips lack units:
  - week chart MW and €/MWh are unlabelled, with inconsistent decimals;
  - the solar chart header is a bare "2.50";
  - the annual mean has no unit;
  - duration "8509 of 8784 hours at or above −0.5" is wrong in flat stretches (it is a rank).
- **c5.** The last Week-slider step moves only 2 days (Dec 23–29 → Dec 25–31).

## First impression (energy-literate, not a programmer)
- **What's clear:** the placeholder warning, the chart titles and most captions.
- **No chart names the zone, year, week or hour it shows.** The offers chart's hour appears only as the slider label, two screens up on a phone.
- **"Seed" is unexplained.** It means "a different random weather year".
- **The solar chart's "Move the slider" refers to a slider out of sight** on a phone.
- **Summary vs long-run differences are unexplained** nearby (M3).
- **The capture-rate (%) and average-price (€/MWh) lines nearly coincide** (68 % vs 69.7), which invites misreading.

## Checked and working
- **Hosting:** works from a nested subfolder, relative assets and worker; no 404s, failed requests or console errors.
- **Layout:** no horizontal scroll at 320, 360, 390, 414, 600, 601, 768, 899, 900, 1024, 1280 or 1920 px; two columns from 900 px.
- **Zones and years:**
  - every zone × 1995/1996/1999/2000/2008/2022/2025 renders;
  - a scan of every zone × every year (seed 42) found no NaN, undefined, Infinity, null or "−0.0";
  - market-opening notes are correct;
  - leap years 2000 and 2024 have 8,784 h, and the last week ends at "…-12-31 23:00".
- **Sliders:** Week and Hour labels are correct at both ends. Each zone's solar maximum (DK1 10, DE 100, NO 20, ES 60 GW) is enforced, and the "Now" dot matches once settled.
- **Ordering and recovery:**
  - results never arrive out of order;
  - odd URL hashes fall back cleanly and the address is rewritten clean;
  - reloading mid-computation recovers.
- **Touch, memory and balance:**
  - tooltips work on tap;
  - memory is flat;
  - the week data's generation − charging − demand = net export.
