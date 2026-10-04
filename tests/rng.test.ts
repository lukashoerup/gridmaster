import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { Rng, hashStream, mix32 } from '../src/sim';

describe('Rng (sfc32)', () => {
  it('is deterministic for a seed and differs between seeds', () => {
    const a = Rng.fromSeed(1234);
    const b = Rng.fromSeed(1234);
    const c = Rng.fromSeed(1235);
    const sa = Array.from({ length: 20 }, () => a.next());
    const sb = Array.from({ length: 20 }, () => b.next());
    const sc = Array.from({ length: 20 }, () => c.next());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
  });

  it('saves and restores its state exactly', () => {
    const r = Rng.fromSeed(99);
    for (let i = 0; i < 10; i++) r.next();
    const state = r.state();
    const expected = Array.from({ length: 50 }, () => r.gaussian());
    r.restore(state);
    const again = Array.from({ length: 50 }, () => r.gaussian());
    expect(again).toEqual(expected);
    const fresh = new Rng(state);
    expect(Array.from({ length: 50 }, () => fresh.gaussian())).toEqual(expected);
  });

  it('keeps uniform draws in [0, 1) with a plausible mean', () => {
    const r = Rng.fromSeed(7);
    let sum = 0;
    const n = 100_000;
    for (let i = 0; i < n; i++) {
      const u = r.next();
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
      sum += u;
    }
    expect(Math.abs(sum / n - 0.5)).toBeLessThan(0.01);
  });

  it('produces gaussians with mean 0 and variance 1', () => {
    const r = Rng.fromSeed(8);
    let s = 0;
    let s2 = 0;
    const n = 100_000;
    for (let i = 0; i < n; i++) {
      const g = r.gaussian();
      s += g;
      s2 += g * g;
    }
    const mean = s / n;
    const variance = s2 / n - mean * mean;
    expect(Math.abs(mean)).toBeLessThan(0.02);
    expect(Math.abs(variance - 1)).toBeLessThan(0.03);
  });

  it('separates streams by id', () => {
    expect(hashStream(1, 2000, 1)).not.toBe(hashStream(1, 2000, 2));
    expect(hashStream(1, 2000, 1)).not.toBe(hashStream(1, 2001, 1));
    expect(hashStream(1, 2000, 1)).toBe(hashStream(1, 2000, 1));
    expect(mix32(0)).not.toBe(mix32(1));
  });

  it('property: any seed replays identically', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 1, max: 40 }), (seed, n) => {
        const a = Rng.fromSeed(seed, 3);
        const b = Rng.fromSeed(seed, 3);
        for (let i = 0; i < n; i++) if (a.nextUint32() !== b.nextUint32()) return false;
        return true;
      }),
    );
  });
});
