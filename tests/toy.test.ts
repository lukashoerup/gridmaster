/**
 * Toy 1 "Hubs": the hub price rule, the game's actions, determinism, the
 * battery's rule, the session log, and the obvious bot against a careful
 * planner (round 1's depth check).
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs } from '../src/data/placeholder';
import {
  BLOCK_MW,
  HUBS,
  HUB_COUNT,
  HubsGame,
  MARKET_OPENS_FROM,
  MARKET_OPENS_TO,
  PRICE,
  SessionLog,
  START_YEAR,
  batteryPlanFor,
  clearHour,
  hubPrice,
  marketOpensAt,
  newCleared,
  obviousBot,
  plannerBot,
  runBot,
  weatherMood,
  type Action,
} from '../src/toy/rules';
import { hoursInYear } from '../src/sim';

const inputs = loadPlaceholderInputs();
const hub = HUBS[0]!;

describe('the hub price rule', () => {
  it('follows the parent while the link has room', () => {
    expect(hubPrice(hub, 30, 0, 0)).toBe(30);
  });

  it('falls toward the floor when flooded, and rises by at most the premium when hungry', () => {
    let last = 30;
    for (let stuck = 1; stuck < 40; stuck++) {
      const p = hubPrice(hub, 30, stuck, 0);
      expect(p).toBeLessThanOrEqual(last);
      expect(p).toBeGreaterThanOrEqual(0);
      last = p;
    }
    expect(last).toBe(0);
    last = 30;
    for (let short = 1; short < 40; short++) {
      const p = hubPrice(hub, 30, -short, 0);
      expect(p).toBeGreaterThanOrEqual(last);
      expect(p).toBeLessThanOrEqual(30 + PRICE.hungryMax);
      last = p;
    }
    expect(last).toBe(30 + PRICE.hungryMax);
  });

  it('keeps flows within links, conserves power, and bounds prices (property)', () => {
    const mw = fc.array(fc.double({ min: 0, max: 200, noNaN: true }), { minLength: HUB_COUNT, maxLength: HUB_COUNT });
    fc.assert(
      fc.property(mw, mw, fc.double({ min: -10, max: 150, noNaN: true }), (supply, demand, national) => {
        const out = newCleared();
        clearHour(national, -15, supply, demand, out);
        let toGrid = 0;
        let stuck = 0;
        let net = 0;
        HUBS.forEach((h, i) => {
          expect(Math.abs(out.flow[i] ?? 0)).toBeLessThanOrEqual(h.linkMw + 1e-9);
          stuck += out.stuck[i] ?? 0;
          net += (supply[i] ?? 0) - (demand[i] ?? 0);
          if (h.parent === 'grid') toGrid += out.flow[i] ?? 0;
          const p = out.price[i] ?? 0;
          expect(p).toBeGreaterThanOrEqual(Math.min(national, -15) - 1e-9);
          // At most three hubs deep, each hungry hub adding at most the premium.
          expect(p).toBeLessThanOrEqual(national + 3 * PRICE.hungryMax + 1e-9);
        });
        expect(toGrid + stuck).toBeCloseTo(net, 6);
      }),
      { numRuns: 300 },
    );
  });
});

describe('surprises from the seed', () => {
  it('opens the market inside its window', () => {
    let before = 0;
    for (let y = START_YEAR; y < MARKET_OPENS_FROM; y++) before += hoursInYear(y);
    let window = 0;
    for (let y = MARKET_OPENS_FROM; y <= MARKET_OPENS_TO; y++) window += hoursInYear(y);
    for (const seed of [1, 2, 3, 42, 99, 12345]) {
      const at = marketOpensAt(seed, START_YEAR);
      expect(at).toBeGreaterThanOrEqual(before);
      expect(at).toBeLessThan(before + window);
      expect(at % 24).toBe(0);
    }
  });

  it('draws weather moods from the seed alone, and varies them', () => {
    const moods = new Set<string>();
    for (let y = 1997; y <= 2025; y++) {
      expect(weatherMood(42, y)).toBe(weatherMood(42, y));
      moods.add(weatherMood(42, y));
    }
    expect(moods.size).toBe(3);
  });
});

describe('the game', () => {
  it('builds within the spot and the hub’s room, in blocks, and reveals the spot', () => {
    const g = new HubsGame(inputs, 7);
    expect(g.isRevealed('hvide')).toBe(false);
    expect(g.act({ type: 'build', kind: 'wind', spot: 'hvide', hub: 'rkb', mw: 7 })).not.toBeNull();
    expect(g.act({ type: 'build', kind: 'wind', spot: 'hvide', hub: 'rkb', mw: 10 })).toBeNull();
    expect(g.isRevealed('hvide')).toBe(true);
    const free = g.freeRoom('rkb');
    expect(g.act({ type: 'build', kind: 'wind', spot: 'hvide', hub: 'rkb', mw: Math.ceil(free / BLOCK_MW) * BLOCK_MW + BLOCK_MW })).not.toBeNull();
    expect(g.maxBuild('hvide', 'rkb')).toBeLessThanOrEqual(free);
  });

  it('scouts after a delay, at a cost', () => {
    const g = new HubsGame(inputs, 7);
    expect(g.act({ type: 'scout', spot: 'agg' })).toBeNull();
    expect(g.isRevealed('agg')).toBe(false);
    g.advance(24 * 31);
    expect(g.isRevealed('agg')).toBe(true);
    expect(g.yearToDate().profit).toBeLessThan(0);
  });

  it('is deterministic: the same seed and actions give the same run', () => {
    const play = (): string => {
      const g = new HubsGame(inputs, 11);
      const plan: Action[] = [
        { type: 'build', kind: 'wind', spot: 'harb', hub: 'thy', mw: 15 },
        { type: 'build', kind: 'solar', spot: 'sun', hub: 'her', mw: 10 },
        { type: 'battery', hub: 'her' },
      ];
      for (const a of plan) expect(g.act(a)).toBeNull();
      g.advance(24 * 200);
      g.act({ type: 'remove', plant: g.plants[0]!.id });
      g.advance(9000);
      return JSON.stringify({ reviews: g.reviews, score: g.score, news: g.news });
    };
    expect(play()).toBe(play());
  });

  it('lets the player flood a hub: its price falls below the price without the player', () => {
    const g = new HubsGame(inputs, 5);
    for (const spot of ['agg', 'harb']) expect(g.act({ type: 'build', kind: 'wind', spot, hub: 'thy', mw: 10 })).toBeNull();
    g.advance(24 * 120);
    const td = g.typicalDay(HUBS.findIndex((h) => h.id === 'thy'));
    expect(td.floodedShare).toBeGreaterThan(0);
    expect(td.meanPrice).toBeLessThan(td.meanWithoutYou);
  });

  it('closes the year with a review and what-ifs per plant', () => {
    const g = new HubsGame(inputs, 3);
    g.act({ type: 'build', kind: 'wind', spot: 'hvide', hub: 'rkb', mw: 10 });
    g.advance(9000);
    expect(g.status).toBe('yearEnd');
    const r = g.reviews[0]!;
    expect(r.year).toBe(START_YEAR);
    expect(r.plants).toHaveLength(1);
    expect(r.plants[0]!.alternative).not.toBeNull();
    expect(r.plants[0]!.earned).toBeGreaterThan(0);
    g.startNextYear();
    expect(g.status).toBe('running');
    expect(g.year).toBe(START_YEAR + 1);
  });
});

describe('the battery rule', () => {
  it('charges in the cheapest hours and discharges in the dearest', () => {
    const price = Array.from({ length: 24 }, (_, h) => (h >= 17 && h <= 19 ? 80 : h <= 4 ? 20 : 40));
    const plan = batteryPlanFor(price);
    expect(plan.filter((v) => v > 0).length).toBeGreaterThan(0);
    for (let h = 0; h < 24; h++) {
      if ((plan[h] ?? 0) > 0) expect(price[h]).toBe(20);
      if ((plan[h] ?? 0) < 0) expect(price[h]).toBe(80);
    }
    expect(batteryPlanFor(new Array<number>(24).fill(30)).every((v) => v === 0)).toBe(true);
  });
});

describe('the session log', () => {
  it('counts decisions, time at each speed and the longest top-speed stretch', () => {
    const log = new SessionLog('hubs', 1, 'test');
    log.clock(0, 'd', 'x1');
    log.decision(30_000, 'd', 'build');
    log.clock(60_000, 'd', 'x10');
    log.clock(180_000, 'd', 'pause');
    log.decision(200_000, 'd', 'scout');
    log.clock(240_000, 'd', 'x10');
    log.firstBlueByYou(250_000, '1998-01-01 00:00');
    const s = log.summary(300_000, 'd', 123);
    expect(s.decisions).toBe(2);
    expect(s.minutesIn.x1).toBeCloseTo(1);
    expect(s.minutesIn.x10).toBeCloseTo(3);
    expect(s.longestTopSpeedMinutes).toBeCloseTo(2);
    expect(s.topSpeedShare).toBeCloseTo(0.6);
    expect(s.firstBlueByYouMinute).toBeCloseTo(250_000 / 60_000);
  });
});

describe('the obvious bot', () => {
  it('scores below a careful planner on the same maps (round 1’s depth check)', () => {
    for (const seed of [42, 7]) {
      const obvious = runBot(inputs, seed, obviousBot, 4);
      const planner = runBot(inputs, seed, plannerBot, 4);
      console.log(`toy 1, seed ${seed}, 1997–2000: obvious bot ${obvious.score} (${obvious.playerMw} MW), planner ${planner.score} (${planner.playerMw} MW, ${planner.batteries} batteries)`);
      expect(planner.score).toBeGreaterThan(obvious.score);
    }
  });
});
