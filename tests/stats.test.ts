/**
 * Annual statistics: capture rates near a zero mean price (stress F4) and a
 * spread that is exactly zero for a flat price (stress F16).
 */
import { describe, expect, it } from 'vitest';
import { CAPTURE_RATE_MIN_MEAN_PRICE, zoneStats } from '../src/sim';

function series(prices: readonly number[], solar: readonly number[]): Parameters<typeof zoneStats>[0] {
  const n = prices.length;
  return {
    zone: 'X',
    year: 2020,
    hours: n,
    marketOpenFromHour: 0,
    price: Float64Array.from(prices),
    demand: new Float64Array(n).fill(100),
    generation: { solar: Float64Array.from(solar) },
    available: { solar: Float64Array.from(solar) },
    unserved: new Float64Array(n),
    netExport: new Float64Array(n),
    capacityMw: { solar: 100 },
    priceCap: 3000,
  };
}

describe('capture rate (stress F4)', () => {
  it('is null when the mean price is at or below 1 €/MWh, and defined above', () => {
    expect(CAPTURE_RATE_MIN_MEAN_PRICE).toBe(1);
    // Mean 2.5e-5: the old ratio was 400,002.
    const tiny = zoneStats(series([0.00005, 0, 0.00005, -0.00005], [0, 1, 1, 0]));
    expect(tiny.byTech.solar.capturePrice).not.toBeNull();
    expect(tiny.byTech.solar.captureRate).toBeNull();
    // Negative mean: the old ratio flipped sign.
    expect(zoneStats(series([-5, -1, 2, -4], [0, 1, 1, 0])).byTech.solar.captureRate).toBeNull();
    expect(zoneStats(series([1, 1, 1, 1], [0, 1, 1, 0])).byTech.solar.captureRate).toBeNull();
    const ok = zoneStats(series([10, 2, 2, 10], [0, 1, 1, 0]));
    expect(ok.byTech.solar.captureRate).toBeCloseTo(2 / 6, 12);
  });
});

describe('price spread (stress F16)', () => {
  it('is exactly zero for a flat price and right for a known series', () => {
    expect(zoneStats(series(new Array(8784).fill(2999.99), new Array(8784).fill(0))).stdPrice).toBe(0);
    expect(zoneStats(series([1, 3, 1, 3], [0, 0, 0, 0])).stdPrice).toBeCloseTo(1, 12);
  });
});
