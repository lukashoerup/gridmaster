/**
 * Headless players for toy 1.
 *
 * - **The obvious bot** (design, "Round 1"): "connect the nearest windy spot
 *   to the reddest hub with room". Thoughtful humans must score clearly above
 *   it, or the money rule has no depth.
 * - **The planner** is a reference, not a player: each month it tries every
 *   5 MW block (wind or sun, every spot, every hub) and one battery per hub
 *   against an estimate of this year's prices and weather, which it can see
 *   and a player cannot, and builds the best while it adds profit. It shows
 *   how much better than the obvious bot a careful plan can do.
 */
import { HUBS, distanceKm } from './region';
import { BLOCK_MW, COST } from './tuning';
import { HubsGame, type Action, type PlantKind } from './engine';
import type { WorldInputs } from '../../sim';

export interface Bot {
  readonly name: string;
  /** Called every `everyHours`; returns the actions to take now. */
  decide(game: HubsGame): Action[];
}

/** Decide once a month. */
export const BOT_EVERY_HOURS = 24 * 30;

export const obviousBot: Bot = {
  name: 'obvious',
  decide(game) {
    const actions: Action[] = [];
    for (const s of game.spots) if (!game.isRevealed(s.id) && !game.scouting.has(s.id)) actions.push({ type: 'scout', spot: s.id });
    if (actions.length > 0) return actions;
    // The reddest hub with room (and not blue).
    const hubs = HUBS.map((h, i) => ({ h, st: game.hubStatus(i) }))
      .filter((x) => game.freeRoom(x.h.id) >= BLOCK_MW && x.st.colour !== 'blue')
      .sort((a, b) => b.st.ratio - a.st.ratio);
    const target = hubs[0];
    if (target === undefined) return [];
    // The nearest windy spot with space; failing that, the nearest with space.
    const bySpace = game.spots.filter((s) => game.spotFree(s.id) >= BLOCK_MW).sort((a, b) => distanceKm(a, target.h) - distanceKm(b, target.h));
    const spot = bySpace.find((s) => s.windQ >= 1) ?? bySpace[0];
    if (spot === undefined) return [];
    const mw = Math.min(10, game.maxBuild(spot.id, target.h.id));
    if (mw < BLOCK_MW) return [];
    return [{ type: 'build', kind: 'wind', spot: spot.id, hub: target.h.id, mw }];
  },
};

export const plannerBot: Bot = {
  name: 'planner',
  decide(game) {
    const actions: Action[] = [];
    for (const s of game.spots) if (!game.isRevealed(s.id) && !game.scouting.has(s.id)) actions.push({ type: 'scout', spot: s.id });
    if (actions.length > 0) return actions;
    const extraPlants: { kind: PlantKind; spot: string; hub: string; mw: number }[] = [];
    const extraBatteries: string[] = [];
    let base = game.estimatePortfolio(extraPlants, extraBatteries, 9);
    // Up to three additions a month.
    for (let round = 0; round < 3; round++) {
      let best: { gain: number; action: Action } | null = null;
      for (const s of game.spots) {
        const spotFree = game.spotFree(s.id) - extraPlants.filter((e) => e.spot === s.id).reduce((a, e) => a + e.mw, 0);
        if (spotFree < BLOCK_MW) continue;
        for (const hub of HUBS) {
          const room = game.freeRoom(hub.id) - extraPlants.filter((e) => e.hub === hub.id).reduce((a, e) => a + e.mw, 0);
          if (room < BLOCK_MW || distanceKm(s, hub) > 45) continue;
          for (const kind of ['wind', 'solar'] as const) {
            const cand = { kind, spot: s.id, hub: hub.id, mw: BLOCK_MW };
            const v = game.estimatePortfolio([...extraPlants, cand], extraBatteries, 9);
            const gain = v - base;
            if (gain > 0 && (best === null || gain > best.gain)) best = { gain, action: { type: 'build', ...cand } };
          }
        }
      }
      for (const hub of HUBS) {
        const v = game.estimatePortfolio(extraPlants, [...extraBatteries, hub.id], 9);
        const gain = v - base;
        if (gain > 0 && (best === null || gain > best.gain)) best = { gain, action: { type: 'battery', hub: hub.id } };
      }
      if (best === null) break;
      const a = best.action;
      if (a.type === 'build') extraPlants.push({ kind: a.kind, spot: a.spot, hub: a.hub, mw: a.mw });
      else if (a.type === 'battery') extraBatteries.push(a.hub);
      actions.push(a);
      base += best.gain;
    }
    // Take down up to three plants whose removal adds most (after the fee).
    const gone: string[] = [];
    for (let round = 0; round < 3; round++) {
      let best: { gain: number; id: string } | null = null;
      const now = game.estimatePortfolio(extraPlants, extraBatteries, 9, gone);
      for (const p of game.plants) {
        if (p.removedAt !== null || game.now < p.readyAt || gone.includes(p.id)) continue;
        const gain = game.estimatePortfolio(extraPlants, extraBatteries, 9, [...gone, p.id]) - now - p.yearlyCost * COST.removeShareOfYear;
        if (gain > 0 && (best === null || gain > best.gain)) best = { gain, id: p.id };
      }
      if (best === null) break;
      gone.push(best.id);
      actions.push({ type: 'remove', plant: best.id });
    }
    return actions;
  },
};

export interface BotRun {
  readonly bot: string;
  readonly seed: number;
  readonly years: number;
  readonly score: number;
  readonly perYear: readonly number[];
  readonly plants: number;
  readonly batteries: number;
  readonly playerMw: number;
}

/** Play `years` whole years headless with a bot. */
export function runBot(inputs: WorldInputs, seed: number, bot: Bot, years: number): BotRun {
  return play(inputs, seed, bot, years, Infinity);
}

/** Play headless with a bot until the absolute hour `until` (the player's date), for a fair comparison. */
export function runBotUntil(inputs: WorldInputs, seed: number, bot: Bot, until: number): BotRun {
  return play(inputs, seed, bot, Infinity, until);
}

function play(inputs: WorldInputs, seed: number, bot: Bot, years: number, until: number): BotRun {
  const game = new HubsGame(inputs, seed);
  let sinceDecision = BOT_EVERY_HOURS;
  let y = 0;
  while (game.status !== 'over' && y < years && game.now < until) {
    while (game.status === 'running' && game.now < until) {
      if (sinceDecision >= BOT_EVERY_HOURS) {
        for (const a of bot.decide(game)) game.act(a);
        sinceDecision = 0;
      }
      sinceDecision += game.advance(Math.min(24, until - game.now));
    }
    if (game.status === 'yearEnd') {
      y++;
      if (y < years && game.now < until) game.startNextYear();
    }
  }
  let mw = 0;
  for (const p of game.plants) if (p.removedAt === null) mw += p.mw;
  return {
    bot: bot.name,
    seed,
    years: game.reviews.length,
    score: Math.round(game.score),
    perYear: game.reviews.map((r) => Math.round(r.profit)),
    plants: game.plants.filter((p) => p.removedAt === null).length,
    batteries: game.batteries.filter((b) => b.removedAt === null).length,
    playerMw: mw,
  };
}
