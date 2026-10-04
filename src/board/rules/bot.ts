/**
 * The obvious bot (docs/design/fun-core.md, round 1): each year it buys
 * whichever block the typical-day forecast says pays back over the years
 * left, one at a time, and lets its battery follow the simple cheap-in,
 * dear-out rule. It never sells and never reads the surprises. A human who
 * understands the board should beat it clearly; if not, the board has no depth.
 */
import { BATTERY_EFF, COSTS, KINDS, SLICE_MWH, YEARS, type Kind } from './tuning';
import { batteryEnergyMwh, batteryPowerMw, buy, clearPlan, newGame, outlook, runYear, sell, type BoardState } from './game';
import { greedyBattery } from './market';

function setBotPlan(state: BoardState): void {
  clearPlan(state);
  if (state.blocks.battery <= 0) return;
  const prices = outlook(state).day.price;
  const plan = greedyBattery(prices, batteryPowerMw(state), batteryEnergyMwh(state), BATTERY_EFF, SLICE_MWH);
  for (let h = 0; h < plan.length; h++) {
    const v = plan[h] ?? 0;
    if (v < 0) state.plan.charge[h] = -v;
    if (v > 0) state.plan.discharge[h] = v;
  }
}

/** One year of the bot's planning. */
export function botPlan(state: BoardState, maxBuys = 8): Kind[] {
  const bought: Kind[] = [];
  const yearsLeft = YEARS - state.year + 1;
  for (let i = 0; i < maxBuys; i++) {
    setBotPlan(state);
    const base = outlook(state).profit;
    let best: Kind | null = null;
    let bestGain = 0;
    for (const k of KINDS) {
      buy(state, k);
      state.profit += COSTS[k].build; // a trial, not a purchase
      setBotPlan(state);
      const gain = (outlook(state).profit - base) * yearsLeft - COSTS[k].build;
      sell(state, k);
      if (gain > bestGain) {
        bestGain = gain;
        best = k;
      }
    }
    if (best === null) break;
    buy(state, best);
    bought.push(best);
  }
  setBotPlan(state);
  return bought;
}

/** The bot's whole game on a seed: its final money. */
export function botScore(seed: number): number {
  const state = newGame(seed);
  while (!state.over) {
    botPlan(state);
    runYear(state);
  }
  return state.profit;
}
