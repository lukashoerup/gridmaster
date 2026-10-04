# Competition, the end goal and progression — 2026-10-04

**Asked by Lukas, in chat:** "But should it not be a complete market? I mean,
a goal would be to take over the entire market, to make it fully renewable?
Or what? I am quite uncertain as to how we should build the competitive
aspect of the game with rivals and other producers, and how it can be a fun
factor in the game. As well as the progressive system. How do other games
do this? Any market simulation/tycoon games that do this?"

**Status:** analysis with a recommendation. The choice is **Q7** in
`docs/decisions.md`; nothing here is decided. It builds on D9 (the first
release has three AI rival archetypes competing for sites, auctions and grid
slots; the stock market and takeovers come later) and on D14 (Nordhav as
the face of history's build-out in the prototype). It changes nothing in
Phase 1 or the Phase 2 prototype.

## Short answer

- **The market is already complete.** The Phase 1 core clears an hourly
  merit order over every producer in the zone: the thermal fleet, everyone's
  wind and solar, and imports and exports. What is incomplete is *agency*.
  In the prototype the other producers follow history; in the first release
  three named rivals act (D9).
- **"Take over the whole market" and "make it fully renewable" are two
  different goals. Neither works well as the main goal on its own.**
  - *Owning 100% switches off the central pillar.* "The market fights back"
    needs other producers. With none left, the player only cannibalises
    themselves, and the contest is over. It is also unrealistic: the
    European Commission cleared the 2006 DONG/Elsam merger only because DONG
    had agreed to sell about 2,400 MW of power stations and wind to
    Vattenfall ([Ørsted](https://orsted.com/en/company-announcement-list/2006/03/782867);
    [Oil & Gas Journal](https://www.ogj.com/general-interest/article/17279896/ec-clears-dongs-merger-of-power-providers)).
  - *"Fully renewable" mostly happens without the player in a
    history-faithful campaign.* In 2024 wind made 59% of Denmark's
    electricity and solar 11%
    ([Wikipedia](https://en.wikipedia.org/wiki/Wind_power_in_Denmark)), and
    renewables overall 88%, the highest share in the EU
    ([Invest in Denmark, citing Eurostat](https://investindk.com/insights/denmark-1-in-share-of-renewables-in-net-electricity-generation-for-2024-in-the-eu/)).
    As a win condition it would reward waiting. The hard last stretch is a
    better *prestige* goal: windless winter weeks, which only storage and
    flexibility can cover.
- **Recommended: "become the leading company of Europe's transition."**
  - Be number one by company value and by renewable output, measured
    against named rivals.
  - The rivals race the player for scarce sites, grid room and tenders.
  - A competition authority caps the player's share of any one zone, so
    success pushes the company abroad. The European map becomes the
    progression.
  - A rank ladder carries the progression.
  - Takeovers come later as a scenario and sandbox victory, which D9 already
    schedules for later.

  The vision's one sentence already says this: grow "into a continental
  power player".

## How other games set the goal

| Game | How rivals compete | How you win | Lesson for Gridmaster |
|---|---|---|---|
| Offworld Trading Company | One shared market that every trade moves; black-market sabotage (notes) | Buy out every rival's shares. The campaign is a seven-match tournament with nine characters, perks bought between matches, eliminations from match three, and a finale where buyouts leave one monopolist ([Giant Bomb](https://giantbomb.com/wiki/Games/Offworld_Trading_Company); [Mohawk Games](https://mohawkgames.com/?p=435)) | Total takeover works as the end of a *short match*, not of a 40-year campaign |
| Capitalism Lab | AI firms undercut prices, steal share and launch better products; mergers and acquisitions | Scenario goals: industry dominance, profit, market value, net worth. "Dominance" means the biggest share, not all of it: 20% wins if every rival is below 20% ([Capitalism Lab](https://www.capitalismlab.com/?p=9061)) | Define dominance as being first, not owning everything |
| Railway Empire | AI rivals race to connect the same cities; the player buys their shares, and a "Merge" button buys the rest at a 10% premium ([Thumb Culture](https://www.thumbculture.co.uk/railway-empire-switch-review-i-choo-choo-choose-you)) | Dated scenario objectives | Races for the same scarce connection are the fun |
| Anno 1800 | AI rivals with personalities; buy shares in their islands; enough shares allow a hostile takeover ([Twinfinite](https://twinfinite.net/guides/anno-1800-how-to-buy-shares-in-a-rival-company/); [Anno wiki](https://anno1800.fandom.com/wiki/Competitors)) | Campaign and sandbox goals | Takeover as a late-game power fantasy |
| Imagine Earth | Rival corporations; buy shares and take them over; emissions warm the planet and rising seas destroy colonies ([Steam](https://store.steampowered.com/app/280720/Imagine_Earth/)) | Mission goals | The nearest theme: profit against climate, with rivals that can be bought |
| Railroad Tycoon II | Stock market with mergers and takeovers [unverified] | Medals by deadline (notes) | Medals and a corporate game can coexist |
| Turmoil | Land auctions against AI oil barons (notes) | Control of the town | Auctions and land races |
| Power Grid (board) | Plant auctions, a race for cities, a shared fuel market (report) | Most cities *powered* when the end triggers | Auctions as punctuation; its leader handicaps were called "massively gamey" (report) |
| CO2 (board) | Companies compete for points while sharing a pollution track; all lose if it passes 500 ppm (notes) | Points | A shared mission with private competition |

## What makes rivals fun, by pattern

1. **Races for scarce things.** Turmoil's land, Railway Empire's cities and
   Power Grid's cities are all races. In Gridmaster the scarce things are
   real: good sites, grid connections, and tender slots.
2. **Auctions as punctuation.** Power Grid's plant auction is its
   heartbeat. Real Europe moved support to auctions: Germany's EEG from
   2017, with zero-subsidy offshore bids that April, and the UK's CfD rounds
   (history notes). A sealed-bid tender carries a winner's curse and pauses
   the game: a natural set piece.
3. **Readable rivals.** Power Grid shows the next plants to come. Nordhav's
   announcements in the prototype (design §4.11) do the same for rivals'
   pipelines. The player should be able to read a rival's plan and get
   there first.
4. **Rivals with arcs, and mistakes the player can use.** Real corporate
   arcs (report: DONG → Ørsted, the 2023 offshore overreach) turn rivals
   into stories. An overbuilt rival sells assets cheaply, which the
   prototype's fire-sale offer already does (design §4.10).
5. **Shares and takeovers.** This is the empire fantasy in Offworld, Anno
   1800, Railway Empire, Imagine Earth and Capitalism Lab. It cuts both
   ways: in Offworld, debt lowers your share price and invites a takeover
   (notes).
6. **A shared fate.** CO2 makes competitors share one track that can sink
   them all. In Gridmaster that track is security of supply and the
   transition.

**Pitfalls to avoid:**
- Catch-up rules that reward hanging back. Power Grid is criticised for
  this, and the vision bans it.
- Faceless AI that offers "no meaningful competition" (Anno 2205, notes).
- AI that visibly cheats. The research found no direct evidence on this; it
  is design judgement.

## How other games do progression

| Game | Progression | What it unlocks |
|---|---|---|
| The Patrician series | Ranks from Shopkeeper through Trader, Merchant, Travelling Merchant, Councillor and Patrician to Lord Mayor and Alderman, earned by wealth and popularity ([Wikipedia](https://en.wikipedia.org/wiki/Patrician_II:_Quest_for_Power), attribution approximate) | Rights and offices: more of the map and of politics |
| Anno 1800 | Population tiers upgrade when their needs are met (notes) | New goods, new problems, the New World |
| Game Dev Tycoon | Garage → office → large studio | Staff, bigger projects |
| Offworld | Perks bought between campaign matches | A character tailored over the tournament |
| Railway Empire, Anno sessions | New regions | New markets with different rules |
| Capitalism Lab | Scenario goals | Harder scenarios |

Gridmaster can stack four of these, each already half present in the plan:

1. **Rank, earned.** D14's four levels (farm → co-op partner → developer →
   utility) continue in the full game, e.g. → regional champion → European
   major → the top rank. The game's name could be that top rank, once D3
   is settled. Each rank unlocks rights: licences in new countries,
   prequalification for big tenders (real tenders vet bidders' experience
   and finances [unverified]), larger loans, and departments to delegate to.
2. **Geography, earned and pushed.** Zones open by rank, and the
   competition-authority cap (below) pushes the player outward. This is the
   brief's "geography … to mitigate risks/tap into different markets".
3. **Technology, by history.** The eras, as planned.
4. **The company, by delegation.** Departments the player buys (review L2).

## Recommendation in one picture

### The goal
- **Campaign (1990–2030, D9):** become Europe's leading renewable energy
  company. Chapter medals stay as designed (company value plus earned
  price). Add a league table against the three named rivals and "everyone
  else", by company value and by renewable output. Topping it is gold
  territory.
- **Prestige goals:** for example, the first company to carry a zone
  through a windless week on renewables plus storage (already in the
  vision).
- **Sandbox (to 2050):** a fully renewable Europe as the world's mission.
  It is a shared track in the CO2 style, and the player is scored on their
  share of it.
- **Scenarios, later:** short Offworld-style matches won by buying out the
  rivals. Takeovers are already scheduled for later (D9).

### The competitors, in three layers

| Layer | Who | How they compete | When |
|---|---|---|---|
| The crowd | Everyone else's historical build-out | Moves prices; takes free sites | Phase 1–2 (exists) |
| Named rivals | Three archetypes (D9), for example: Nordhav, an incumbent turned green that overreaches; a federation of wind co-ops, cheap to permit and slow to grow; an infrastructure fund, rich and patient, that buys rather than builds. Behaviour comes from Power Grid's Robots-style tiles: siting, bidding, expansion and a special ability (report) | Race for sites, grid room and tenders; buy distressed assets, the player's included; announce plans; follow arcs | First release (D9); Nordhav as a face in the prototype (D14) |
| The corporate game | Shares and takeovers, in both directions | Buy a rival; debt invites bids | Later (D9); a scenario victory first |

### The cap: success pushes you abroad
- **Real anchor:** the DONG/Elsam merger of 2006 was cleared only with about
  2,400 MW sold to Vattenfall (sources above).
- **Mechanic:** above a share of a zone's generation (25% [tuning]), new
  builds and purchases there need the competition authority's approval.
  Approval comes with a forced sale of capacity to a rival, at fair value.
- **Effect:** the monopoly strategy is answered by a real institution,
  matching the vision's "dominance is caught by the simulation". Growth
  turns into a European expansion, which is the brief's risk-spreading
  fantasy.
- **Not in the one-zone prototype.** It tests nothing there, and a single
  zone cannot offer the way out.

## The decision (Q7)

| Option | What it means | Changes |
|---|---|---|
| **A. Lead the transition** (recommended) | Be number one by value and output against named rivals; a share cap pushes you abroad; ranks; takeovers later | Nothing decided; fits the vision and D9 |
| B. Take over everything | Buyouts are the main victory (Offworld) | Moves the stock market and takeovers into the first release (D9); risks switching off the market pillar in the late game |
| C. Make it fully renewable | A mission-first, shared goal (CO2) | Shifts the vision's emphasis from company to mission; history largely does it for the player in Denmark |

Under every option, Phase 1 and the Phase 2 prototype are unchanged: one
zone, and Nordhav without decisions of its own.

## Sources added in this review
- DONG/Elsam merger cleared with about 2,400 MW sold to Vattenfall: [Ørsted company announcement, 2006](https://orsted.com/en/company-announcement-list/2006/03/782867); [Oil & Gas Journal](https://www.ogj.com/general-interest/article/17279896/ec-clears-dongs-merger-of-power-providers)
- Danish electricity shares, 2024: [Wikipedia: Wind power in Denmark](https://en.wikipedia.org/wiki/Wind_power_in_Denmark); [Invest in Denmark (Eurostat)](https://investindk.com/insights/denmark-1-in-share-of-renewables-in-net-electricity-generation-for-2024-in-the-eu/)
- Offworld's campaign: [Giant Bomb](https://giantbomb.com/wiki/Games/Offworld_Trading_Company); [Mohawk Games](https://mohawkgames.com/?p=435)
- Capitalism Lab's goals and "dominance": [Capitalism Lab](https://www.capitalismlab.com/?p=9061)
- Railway Empire's shares and merge: [Thumb Culture](https://www.thumbculture.co.uk/railway-empire-switch-review-i-choo-choo-choose-you)
- Anno 1800's shares and takeovers: [Twinfinite](https://twinfinite.net/guides/anno-1800-how-to-buy-shares-in-a-rival-company/); [Anno 1800 wiki](https://anno1800.fandom.com/wiki/Competitors)
- Imagine Earth: [Steam](https://store.steampowered.com/app/280720/Imagine_Earth/)
- Patrician ranks: [Wikipedia: Patrician II](https://en.wikipedia.org/wiki/Patrician_II:_Quest_for_Power) (attribution approximate)

Everything else cites the research report and its notes.
