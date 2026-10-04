/**
 * Toy 2 "The board" (src/board/rules): the clearing, the cannibalisation the
 * toy exists to test, the battery drag, rivals, surprises, determinism and the
 * obvious bot.
 */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BATTERY_EFF,
  BATTERY_MWH,
  BLOCK_MW,
  COSTS,
  FLOODED_PRICE,
  HOURS,
  NO_SHIFT,
  SLICE_MWH,
  YEARS,
  botPlan,
  botScore,
  buy,
  clearPlan,
  clearPrice,
  greedyBattery,
  moveEnergy,
  newGame,
  outlook,
  runYear,
  sell,
  storedMwh,
} from '../src/board/rules';

const midday = (prices: readonly number[]): number => prices.slice(10, 16).reduce((a, b) => a + b, 0) / 6;

describe('clearing', () => {
  it('never lowers the price when residual demand rises', () => {
    fc.assert(
      fc.property(fc.double({ min: -50, max: 200, noNaN: true }), fc.double({ min: 0, max: 30, noNaN: true }), (r, d) => {
        expect(clearPrice(r + d)).toBeGreaterThanOrEqual(clearPrice(r) - 1e-9);
      }),
    );
  });

  it('is flooded when renewables cover everything', () => {
    expect(clearPrice(0)).toBe(FLOODED_PRICE);
    expect(clearPrice(-10)).toBe(FLOODED_PRICE);
  });

  it('lets a gas crisis raise the gas-set prices and a closed coal plant raise prices', () => {
    expect(clearPrice(90, { ...NO_SHIFT, gasFactor: 2.2 })).toBeGreaterThan(clearPrice(90));
    expect(clearPrice(60, { ...NO_SHIFT, coalClosedMw: 25 })).toBeGreaterThan(clearPrice(60));
  });
});

describe('the market fights back', () => {
  it('lowers the midday price and the price solar earns as the player adds solar', () => {
    const s = newGame(1);
    let lastMidday = midday(outlook(s).day.price);
    let lastPerMwh = Infinity;
    for (let n = 1; n <= 8; n++) {
      buy(s, 'solar');
      const o = outlook(s);
      const m = midday(o.day.price);
      expect(m).toBeLessThanOrEqual(lastMidday + 1e-9);
      expect(o.byKind.solar.perMwh).toBeLessThanOrEqual(lastPerMwh + 1e-9);
      lastMidday = m;
      lastPerMwh = o.byKind.solar.perMwh;
    }
    const o = outlook(s);
    expect(o.hubAverage).toBeLessThan(o.hubAverageWithoutYou);
  });

  it('makes each extra wind block worth less than the one before, so piling on stops paying', () => {
    const s = newGame(1);
    const totals: number[] = [];
    for (let n = 1; n <= 10; n++) {
      buy(s, 'wind');
      totals.push(outlook(s).byKind.wind.earned);
    }
    const marginal = totals.map((t, i) => t - (i === 0 ? 0 : (totals[i - 1] ?? 0)));
    expect(marginal[9] ?? 0).toBeLessThan(marginal[0] ?? 0);
    expect(marginal[9] ?? 0).toBeLessThan(COSTS.wind.yearly);
  });
});

describe('the battery drag', () => {
  it('moves energy from a cheap hour to a dear one, with losses, and earns the spread', () => {
    const s = newGame(1);
    buy(s, 'battery');
    const before = outlook(s);
    expect(moveEnergy(s, 3, 18)).toBe('ok');
    expect(s.plan.charge[3]).toBe(SLICE_MWH);
    expect(s.plan.discharge[18]).toBeCloseTo(SLICE_MWH * BATTERY_EFF);
    const after = outlook(s);
    expect(after.day.price[3] ?? 0).toBeGreaterThanOrEqual((before.day.price[3] ?? 0) - 1e-9);
    expect(after.day.price[18] ?? 0).toBeLessThanOrEqual((before.day.price[18] ?? 0) + 1e-9);
    expect(after.byKind.battery.earned).toBeGreaterThan(0);
  });

  it('enforces power per hour and energy per day', () => {
    const s = newGame(1);
    expect(moveEnergy(s, 3, 18)).toBe('no-battery');
    buy(s, 'battery');
    expect(moveEnergy(s, 5, 5)).toBe('same-hour');
    const slicesPerHour = Math.floor(BLOCK_MW / SLICE_MWH);
    for (let i = 0; i < slicesPerHour; i++) expect(moveEnergy(s, 3, 18 + (i % 2))).toBe('ok');
    expect(moveEnergy(s, 3, 20)).toBe('charge-limit');
    let result = moveEnergy(s, 4, 21);
    while (result === 'ok') result = moveEnergy(s, 4, 21);
    expect(['full', 'charge-limit', 'discharge-limit']).toContain(result);
    expect(storedMwh(s.plan)).toBeLessThanOrEqual(BATTERY_MWH + 1e-9);
    clearPlan(s);
    expect(storedMwh(s.plan)).toBe(0);
  });

  it('clears a plan that no longer fits after selling a battery', () => {
    const s = newGame(1);
    buy(s, 'battery');
    buy(s, 'battery');
    for (let i = 0; i < 6; i++) moveEnergy(s, i, 18 + (i % 3));
    expect(storedMwh(s.plan)).toBeGreaterThan(BATTERY_MWH);
    sell(s, 'battery');
    expect(storedMwh(s.plan)).toBe(0);
  });

  it('flattens the day as more storage follows the cheap-in, dear-out rule', () => {
    const prices = outlook(newGame(1)).day.price;
    const spread = (p: readonly number[]): number => Math.max(...p) - Math.min(...p);
    let last = spread(prices);
    for (const mw of [10, 20, 40]) {
      const s = newGame(1);
      s.rivals.battery = mw;
      const p = outlook(s).day.price;
      expect(spread(p)).toBeLessThanOrEqual(last + 1e-9);
      last = spread(p);
    }
    const plan = greedyBattery(prices, 10, 20, BATTERY_EFF, SLICE_MWH);
    expect(plan.length).toBe(HOURS);
    expect(plan.reduce((a, b) => a + b, 0)).toBeLessThan(0); // losses: more in than out
  });
});

describe('years, rivals and surprises', () => {
  it('plays ten years deterministically for the same seed and the same moves', () => {
    const play = (seed: number): number[] => {
      const s = newGame(seed);
      buy(s, 'wind');
      buy(s, 'solar');
      const out: number[] = [];
      while (!s.over) out.push(runYear(s).profit);
      return out;
    };
    expect(play(7)).toEqual(play(7));
    expect(play(7)).not.toEqual(play(8));
    expect(play(7).length).toBe(YEARS);
  });

  it('books build fees at once and yearly costs in the year', () => {
    const s = newGame(3);
    buy(s, 'solar');
    expect(s.profit).toBe(-COSTS.solar.build);
    const r = runYear(s);
    expect(r.byKind.solar.cost).toBe(COSTS.solar.yearly);
    expect(s.profit).toBeCloseTo(-COSTS.solar.build + r.profit);
  });

  it('lets rivals build only when last year paid them', () => {
    const rich = newGame(5);
    runYear(rich);
    const poor = newGame(5);
    for (let i = 0; i < 12; i++) buy(poor, 'solar');
    for (let i = 0; i < 12; i++) buy(poor, 'wind');
    runYear(poor);
    expect(poor.rivals.solar + poor.rivals.wind).toBeLessThanOrEqual(rich.rivals.solar + rich.rivals.wind);
  });

  it('announces a surprise every year after the first and uses each lasting one at most once', () => {
    const s = newGame(11);
    const seen: string[] = [];
    while (!s.over) {
      runYear(s);
      if (!s.over) {
        expect(s.conditions.surprise).not.toBeNull();
        seen.push(s.conditions.surprise?.id ?? '');
      }
    }
    for (const once of ['datacentre', 'coal', 'cable']) expect(seen.filter((id) => id === once).length).toBeLessThanOrEqual(1);
  });

  it('keeps the forecast honest: the reveal lands near it on average', () => {
    let fcSum = 0;
    let actualSum = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const s = newGame(seed);
      buy(s, 'wind');
      buy(s, 'wind');
      buy(s, 'solar');
      const r = runYear(s);
      fcSum += r.forecastProfit;
      actualSum += r.profit;
    }
    expect(Math.abs(actualSum - fcSum)).toBeLessThan(0.25 * Math.abs(fcSum));
  });
});

describe('the obvious bot', () => {
  it('plays a whole game and makes money on several seeds', () => {
    for (const seed of [1, 2, 3]) {
      const score = botScore(seed);
      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeGreaterThan(0);
    }
  });

  it('buys at most its limit and never sells', () => {
    const s = newGame(2);
    const bought = botPlan(s, 3);
    expect(bought.length).toBeLessThanOrEqual(3);
    expect(s.blocks.wind + s.blocks.solar + s.blocks.battery).toBe(bought.length);
  });
});
