/**
 * The explorer's simulation protocol and chart builders, run headless (no DOM).
 */
import { describe, expect, it } from 'vitest';
import { annualOption, cannibalOption, captureOption, durationOption, ladderOption, weekOption } from '../src/explorer/charts';
import {
  FIRST_YEAR,
  LAST_YEAR,
  clearLongRuns,
  handle,
  longRunState,
  runCannibal,
  runSeries,
  runYear,
  zoneIds,
  zoneName,
  type Response,
  type SeriesYearResponse,
} from '../src/explorer/protocol';
import type { ZoneStats } from '../src/sim';

function seriesLength(option: { series?: unknown }): number {
  return Array.isArray(option.series) ? option.series.length : 0;
}

describe('explorer protocol', () => {
  it('starts a year from the long run’s 1 January state once the long run is there (QA M3, analyst B6)', () => {
    clearLongRuns();
    // Before the long run: 1995 is the long run's own start, later years are provisional.
    expect(runYear({ kind: 'year', gen: 1, seed: 5, zone: 'NO', year: 1995, extraSolarGw: 0 }).payload.start).toBe('long-run');
    const early = runYear({ kind: 'year', gen: 2, seed: 5, zone: 'NO', year: 1998, extraSolarGw: 0 });
    expect(early.payload.start).toBe('fresh');
    // Run the long run through 1997 only, then stop it (as a superseded run would).
    const seen: SeriesYearResponse[] = [];
    const done = runSeries({ kind: 'series', gen: 3, seed: 5 }, (r) => seen.push(r), () => seen.length >= 3);
    expect(done).toBeNull();
    expect(seen.map((r) => r.year)).toEqual([1995, 1996, 1997]);
    expect(longRunState(5, 1998)).not.toBeNull();
    expect(longRunState(5, 1999)).toBeNull();
    // The year view now starts where the long run was on 1 January and matches it exactly.
    const y1997 = runYear({ kind: 'year', gen: 4, seed: 5, zone: 'NO', year: 1997, extraSolarGw: 0 });
    expect(y1997.payload.start).toBe('long-run');
    expect(y1997.payload.stats).toEqual(seen[2]?.stats['NO']);
    const y1998 = runYear({ kind: 'year', gen: 5, seed: 5, zone: 'NO', year: 1998, extraSolarGw: 0 });
    expect(y1998.payload.start).toBe('long-run');
    // A resumed long run reports the cached years first, then continues.
    const again: number[] = [];
    runSeries({ kind: 'series', gen: 6, seed: 5 }, (r) => again.push(r.year), () => again.length >= 5);
    expect(again).toEqual([1995, 1996, 1997, 1998, 1999]);
    clearLongRuns();
  });

  it('knows the zones', () => {
    expect(zoneIds()).toEqual(['DK1', 'DE', 'NO', 'ES']);
    expect(zoneName('DK1')).toBe('Western Denmark');
    expect(FIRST_YEAR).toBe(1995);
    expect(LAST_YEAR).toBe(2025);
  });

  it('answers a year request with the zone, its stacks, neighbours and links', () => {
    const r = runYear({ kind: 'year', gen: 1, seed: 42, zone: 'DK1', year: 2015, extraSolarGw: 0 });
    expect(r.kind).toBe('year');
    expect(r.payload.zone).toBe('DK1');
    expect(r.payload.hours).toBe(8760);
    expect(r.payload.stacks).not.toBeNull();
    expect(Object.keys(r.payload.neighbourPrices).sort()).toEqual(['DE', 'NO']);
    expect(r.payload.links.map((l) => l.id).sort()).toEqual(['DK1-DE', 'DK1-NO']);
    expect(r.payload.stats.meanPrice).toBeGreaterThan(0);
  });

  it('applies the added solar and reports falling solar earnings', () => {
    const base = runYear({ kind: 'year', gen: 1, seed: 42, zone: 'DE', year: 2020, extraSolarGw: 0 });
    const more = runYear({ kind: 'year', gen: 2, seed: 42, zone: 'DE', year: 2020, extraSolarGw: 40 });
    expect((more.payload.capacityMw['solar'] ?? 0) - (base.payload.capacityMw['solar'] ?? 0)).toBeCloseTo(40000, 6);
    expect(more.payload.stats.byTech.solar.capturePrice ?? 0).toBeLessThan(base.payload.stats.byTech.solar.capturePrice ?? 0);

    const curve = runCannibal({ kind: 'cannibal', gen: 3, seed: 42, zone: 'DE', year: 2020, maxGw: 100 });
    if (curve === null) throw new Error('no curve');
    expect(curve.points.length).toBe(6);
    expect(curve.points[0]?.gw).toBe(0);
    expect(curve.points[5]?.gw).toBe(100);
    for (let i = 1; i < curve.points.length; i++) {
      expect(curve.points[i]?.captureRate ?? 1).toBeLessThan(curve.points[i - 1]?.captureRate ?? 0);
    }
  });

  it('reports errors instead of throwing', () => {
    const out: Response[] = [];
    handle({ kind: 'year', gen: 9, seed: 1, zone: 'XX', year: 2000, extraSolarGw: 0 }, (r) => out.push(r));
    expect(out.length).toBe(1);
    expect(out[0]?.kind).toBe('error');
  });
});

describe('explorer charts', () => {
  const r = runYear({ kind: 'year', gen: 1, seed: 42, zone: 'DE', year: 2024, extraSolarGw: 0 });
  const p = r.payload;

  it('builds the week, duration and ladder charts', () => {
    const week = weekOption(p, 26);
    expect(seriesLength(week)).toBeGreaterThan(4);
    const duration = durationOption(p);
    expect(seriesLength(duration)).toBe(1);
    const ladder = ladderOption(p, 26 * 168 + 12);
    expect(seriesLength(ladder)).toBe(1);
    const data = (ladder.series as { data?: unknown[] }[])[0]?.data;
    expect(Array.isArray(data) && data.length > 5).toBe(true);
    // Last-week and last-hour edges do not throw.
    expect(() => weekOption(p, 52)).not.toThrow();
    expect(() => ladderOption(p, p.hours - 1)).not.toThrow();
  });

  it('builds the long-run charts from partial series', () => {
    const series = new Map<number, Record<string, ZoneStats>>();
    const years: SeriesYearResponse[] = [];
    for (const year of [2019, 2020]) {
      const y = runYear({ kind: 'year', gen: 1, seed: 42, zone: 'DE', year, extraSolarGw: 0 });
      years.push({ kind: 'seriesYear', gen: 1, seed: 42, year, stats: { DE: y.payload.stats } });
    }
    for (const y of years) series.set(y.year, { ...y.stats });
    const annual = annualOption(series, 'DE', FIRST_YEAR, LAST_YEAR, ['DK1']);
    expect(seriesLength(annual)).toBe(3);
    const capture = captureOption(series, 'DE', FIRST_YEAR, LAST_YEAR);
    expect(seriesLength(capture)).toBeGreaterThan(2);
    const cannibal = cannibalOption([], 0, null);
    expect(seriesLength(cannibal)).toBe(3);
  });
});
