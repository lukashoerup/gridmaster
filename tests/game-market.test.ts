/**
 * The game on the real (placeholder) market: the player's building moves
 * DK1's price, runs are deterministic, a saved game resumes exactly, and a
 * bot plays the whole chapter.
 */
import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs } from '../src/data/placeholder';
import {
  MarketProvider,
  dateHour,
  deserialize,
  leveragedWindBot,
  playHeadless,
  prototypeInputs,
  resumeMarket,
  runHeadless,
  serialize,
  startHeadless,
  windBot,
  type GameState,
} from '../src/game';

const inputs = loadPlaceholderInputs();

function ledgerBalances(r: GameState['reports'][number]): boolean {
  const L = r.ledger;
  const expected = r.cashStartCents + L.revenueCents - L.fixedCostCents - L.interestCents - L.repaidCents - L.feeCents - L.investedCents + L.borrowedCents + L.salesCents;
  return expected === r.cashEndCents;
}

describe('the prototype market', () => {
  it('keeps Western Denmark and its two neighbours', () => {
    const p = prototypeInputs(inputs);
    expect(p.zones.map((z) => z.id)).toEqual(['DK1', 'DE', 'NO']);
    expect(p.links.map((l) => l.id).sort()).toEqual(['DE-NO', 'DK1-DE', 'DK1-NO']);
    expect(p.weather.zoneOrder).toEqual(['DK1', 'DE', 'NO']);
    expect(p.weather.windCorrelation.length).toBe(3);
    expect(p.weather.windCorrelation.every((row) => row.length === 3)).toBe(true);
  });

  it('runs years in order and switches to hourly prices in July 1999', () => {
    const provider = new MarketProvider(inputs, 5);
    const m99 = provider.simulate(1999, { windMw: 0, solarMw: 0 });
    expect(() => provider.simulate(2001, { windMw: 0, solarMw: 0 })).toThrow(/in order/);
    expect(m99.marketOpenFromHour).toBe(181 * 24);
    // Before the opening the seller's price is flat; after it, it moves by the hour.
    const before = new Set(Array.from(m99.price.subarray(0, m99.marketOpenFromHour)));
    const after = new Set(Array.from(m99.price.subarray(m99.marketOpenFromHour)));
    expect(before.size).toBe(1);
    expect(after.size).toBeGreaterThan(10);
  });

  it('lets the player’s own wind lower the price wind earns', () => {
    const base = new MarketProvider(inputs, 11).simulate(2015, { windMw: 0, solarMw: 0 });
    const more = new MarketProvider(inputs, 11).simulate(2015, { windMw: 1500, solarMw: 0 });
    expect(more.summary.windMw - base.summary.windMw).toBeCloseTo(1500, 6);
    expect(more.summary.windCapturePrice ?? 0).toBeLessThan(base.summary.windCapturePrice ?? 0);
    expect(more.summary.meanPrice).toBeLessThan(base.summary.meanPrice);
    // Same seed, same weather: only the price moved.
    expect(Array.from(more.windCf.subarray(0, 48))).toEqual(Array.from(base.windCf.subarray(0, 48)));
  });
});

describe('determinism', () => {
  it('gives the same game for the same seed and decisions', () => {
    const a = runHeadless(inputs, 7, leveragedWindBot(), 2000);
    const b = runHeadless(inputs, 7, leveragedWindBot(), 2000);
    expect(a.state.assets.length).toBeGreaterThan(2);
    expect(serialize(a.state)).toBe(serialize(b.state));
    const c = runHeadless(inputs, 8, leveragedWindBot(), 2000);
    expect(serialize(c.state)).not.toBe(serialize(a.state));
  });

  it('resumes a saved game exactly, mid-year', () => {
    const bot = windBot();
    const a = startHeadless(inputs, 21);
    playHeadless(a, bot, 2001, dateHour(1998, 6, 15) + 7);
    expect(a.state.year).toBe(1998);
    const saved = serialize(a.state);
    playHeadless(a, bot, 2001);

    const state = deserialize(saved);
    if (state === null) throw new Error('save did not load');
    const provider = new MarketProvider(inputs, state.seed);
    const replay = resumeMarket(provider, state);
    const years: number[] = [];
    let step = replay.next();
    while (step.done !== true) {
      years.push(step.value);
      step = replay.next();
    }
    expect(years).toEqual([1995, 1996, 1997]);
    const b = playHeadless({ state, market: step.value, provider }, bot, 2001);
    expect(serialize(b.state)).toBe(serialize(a.state));
  });

  it('refuses a save from another version', () => {
    expect(deserialize('not json')).toBeNull();
    expect(deserialize(JSON.stringify({ version: 999 }))).toBeNull();
  });
});

describe('a whole chapter', () => {
  it('lets a bot play 1995–2025 with books that balance every year', () => {
    // Whether this leveraged bot survives depends on the seed (on 2026-10-04 it
    // went bankrupt for 2–3 of seeds 1, 7, 42, 99, 123, 2024, and which ones
    // changed with the Phase 1 market fixes). Seed 99 reaches 2025 before and
    // after them; a market change can still move it, so check the seed first.
    const run = runHeadless(inputs, 99, leveragedWindBot());
    const s = run.state;
    expect(s.over?.kind).toBe('end');
    expect(s.reports.map((r) => r.year)).toEqual(Array.from({ length: 31 }, (_, i) => 1995 + i));
    for (const r of s.reports) {
      expect(ledgerBalances(r), `ledger ${r.year}`).toBe(true);
      expect(Number.isInteger(r.valueEndCents), `value ${r.year}`).toBe(true);
      expect(Number.isFinite(r.dk1.meanPrice)).toBe(true);
    }
    expect(s.assets.filter((a) => a.kind === 'wind').length).toBeGreaterThan(3);
    expect(Object.keys(s.capacityLog).length).toBe(31);
    // The run kept its turbines going through every era of the market.
    const earned = s.reports.map((r) => r.earnedPrice ?? 0);
    expect(Math.min(...earned)).toBeGreaterThan(0);
  });
});
