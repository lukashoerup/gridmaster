/**
 * The explorer's simulation protocol and chart builders, run headless (no DOM).
 */
import { describe, expect, it } from 'vitest';
import {
  annualCaption,
  annualOption,
  cannibalOption,
  captureOption,
  durationCaption,
  durationOption,
  fmt,
  ladderNote,
  ladderOption,
  ladderTitle,
  niceCeil,
  niceFloor,
  weekCaption,
  weekCount,
  weekOption,
  weekStart,
  weekTitle,
} from '../src/explorer/charts';
import {
  FIRST_YEAR,
  LAST_YEAR,
  Scheduler,
  clearLongRuns,
  handle,
  parseSeed,
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
    const cannibal = cannibalOption([], null);
    expect(seriesLength(cannibal)).toBe(3);
    expect(seriesLength(cannibalOption([], { gw: 2.5, capturePrice: 40 }))).toBe(4);
  });
});

describe('explorer scheduling (QA M1, M2, m3)', () => {
  /** A scheduler whose deferred steps run only when pumped, so the test controls time. */
  function harness(): { s: Scheduler; out: Response[]; pump: (steps?: number) => void } {
    const queue: (() => void)[] = [];
    const out: Response[] = [];
    const s = new Scheduler((r) => out.push(r), (fn) => queue.push(fn));
    const pump = (steps = Infinity): void => {
      for (let i = 0; i < steps && queue.length > 0; i++) queue.shift()?.();
    };
    return { s, out, pump };
  }

  it('drops superseded requests and answers only the newest of each kind', () => {
    clearLongRuns();
    const { s, out, pump } = harness();
    s.submit({ kind: 'year', gen: 1, seed: 3, zone: 'DK1', year: 1995, extraSolarGw: 0 });
    s.submit({ kind: 'year', gen: 2, seed: 3, zone: 'DE', year: 1995, extraSolarGw: 0 });
    s.submit({ kind: 'year', gen: 1, seed: 3, zone: 'NO', year: 1995, extraSolarGw: 0 }); // stale: ignored
    pump();
    expect(out.map((r) => [r.kind, (r as { gen: number }).gen])).toEqual([['year', 2]]);
    expect((out[0] as { payload: { zone: string } }).payload.zone).toBe('DE');
    expect(s.busy).toBe(false);
  });

  it('runs the year first, then the solar curve, then the long run, and stops a stale long run between years', () => {
    clearLongRuns();
    const { s, out, pump } = harness();
    s.submit({ kind: 'series', gen: 1, seed: 8 });
    pump(2); // two long-run years
    expect(out.filter((r) => r.kind === 'seriesYear').map((r) => (r as { year: number }).year)).toEqual([1995, 1996]);
    s.submit({ kind: 'cannibal', gen: 2, seed: 8, zone: 'DK1', year: 1996, maxGw: 1 });
    s.submit({ kind: 'year', gen: 3, seed: 8, zone: 'DK1', year: 1996, extraSolarGw: 0 });
    pump(1);
    expect(out[out.length - 1]?.kind).toBe('year'); // the user's year jumps the queue
    pump(6);
    expect(out[out.length - 1]?.kind).toBe('cannibal');
    // A new seed supersedes the long run: the old one stops at the next year boundary.
    s.submit({ kind: 'series', gen: 4, seed: 9 });
    pump();
    const seeds = new Set(out.filter((r) => r.kind === 'seriesYear' && (r as { gen: number }).gen === 1).map((r) => (r as { year: number }).year));
    expect(seeds.size).toBe(2); // seed 8 never got past 1996
    expect(out[out.length - 1]?.kind).toBe('seriesDone');
    // Asking for seed 8 again resumes from its cache (1995 and 1996 are reported without being recomputed).
    s.submit({ kind: 'series', gen: 5, seed: 8 });
    pump(1);
    expect(out.filter((r) => r.kind === 'seriesYear' && (r as { gen: number }).gen === 5).map((r) => (r as { year: number }).year)).toEqual([1995, 1996, 1997]);
    clearLongRuns();
  });

  it('reports a failing request as an error for that request', () => {
    const { s, out, pump } = harness();
    s.submit({ kind: 'year', gen: 1, seed: 1, zone: 'XX', year: 2000, extraSolarGw: 0 });
    pump();
    expect(out).toEqual([{ kind: 'error', gen: 1, request: 'year', message: 'unknown zone XX' }]);
  });
});

describe('explorer inputs (QA m9, c5)', () => {
  it('accepts only whole seeds 0…4294967295 written in digits', () => {
    for (const [text, seed] of [
      ['0', 0],
      ['42', 42],
      [' 007 ', 7],
      ['4294967295', 4294967295],
    ] as const) {
      expect(parseSeed(text), text).toBe(seed);
    }
    for (const text of ['', ' ', '-1', 'abc', '1e400', '1e12', '4294967296', '1.5', '+3', '0x10']) expect(parseSeed(text), text).toBeNull();
  });

  it('steps the week slider in whole weeks, the last one ending on 31 December', () => {
    for (const hours of [8760, 8784]) {
      expect(weekCount(hours)).toBe(52);
      expect(weekStart(hours, 0)).toBe(0);
      for (let i = 1; i < 51; i++) expect(weekStart(hours, i) - weekStart(hours, i - 1)).toBe(168);
      expect(weekStart(hours, 51) + 168).toBe(hours);
      expect(weekStart(hours, 51) - weekStart(hours, 50)).toBeGreaterThanOrEqual(168); // never a 1–2 day step
      expect(weekStart(hours, 99)).toBe(weekStart(hours, 51));
    }
  });
});

describe('explorer titles, captions and notes (QA m6, m7, c1–c4, first impression)', () => {
  const de = runYear({ kind: 'year', gen: 1, seed: 42, zone: 'DE', year: 2024, extraSolarGw: 0 }).payload;
  const dk = runYear({ kind: 'year', gen: 1, seed: 1, zone: 'DK1', year: 2024, extraSolarGw: 0 }).payload;
  const dk98 = runYear({ kind: 'year', gen: 1, seed: 1, zone: 'DK1', year: 1998, extraSolarGw: 0 }).payload;

  it('names the zone and year, and the week or hour, in every year chart title', () => {
    expect(weekTitle(de, 'Germany', 26)).toMatch(/Germany, 2024, 1 Jul–7 Jul$/);
    expect(weekTitle(de, 'Germany', 51)).toMatch(/25 Dec–31 Dec$/);
    expect(ladderTitle(de, 'Germany', 26 * 168 + 13)).toMatch(/Germany, 2024, 1 Jul 13:00$/);
  });

  it('says when a neighbour or the regulated tariff set the price, and when a local offer did', () => {
    let neighbour = -1;
    let local = -1;
    for (let h = 0; h < dk.hours && (neighbour < 0 || local < 0); h++) {
      const note = ladderNote(dk, h);
      if (neighbour < 0 && note.includes('neighbouring zone')) neighbour = h;
      if (local < 0 && note.includes('set by a local')) local = h;
    }
    expect(neighbour).toBeGreaterThanOrEqual(0);
    expect(local).toBeGreaterThanOrEqual(0);
    expect(ladderNote(dk98, 100)).toMatch(/regulated tariff of 30\.5 €\/MWh/);
    const option = ladderOption(dk98, 100);
    const lines = ((option.series as { markLine: { data: { yAxis?: number }[] } }[])[0]?.markLine.data ?? []).filter((d) => d.yAxis !== undefined);
    expect(lines.length).toBe(2); // the computed market price and the tariff
    expect((option.series as { clip?: boolean }[])[0]?.clip).toBe(true);
  });

  it('describes what is shown: imports, flat tariffs, neighbours and reservoirs that exist', () => {
    expect(weekCaption(de, 'Germany')).toMatch(/imported the rest/);
    expect(weekCaption(de, 'Germany')).not.toMatch(/storage filled the gap/);
    expect(durationCaption(dk98, 'Western Denmark')).toMatch(/no hourly market yet: everyone paid a flat regulated tariff/);
    const spain = annualCaption('Spain', [], ['Spain']);
    expect(spain).toMatch(/Spain has no modelled neighbour/);
    expect(spain).toMatch(/through Spain’s reservoirs/);
    expect(spain).not.toMatch(/dotted|Norw/);
    expect(annualCaption('Western Denmark', ['Germany', 'Norway'], ['Norway'])).toMatch(/Germany and Norway are dotted.*Norway’s reservoirs/);
  });

  it('gives capture rates no fixed floor, so negative rates and gaps show', () => {
    const series = new Map<number, Record<string, ZoneStats>>([[2024, { DE: de.stats }]]);
    const option = captureOption(series, 'DE', 2024, 2024);
    expect((option.yAxis as { min?: unknown }).min).toBeUndefined();
    expect((option.yAxis as { scale?: boolean }).scale).toBe(true);
  });

  it('rounds numbers without "-0" and picks round axis limits', () => {
    expect(fmt(-0.04, 1)).toBe('0.0');
    expect(fmt(-0, 0)).toBe('0');
    expect(fmt(null)).toBe('–');
    expect(niceCeil(88_100)).toBe(100_000);
    expect(niceCeil(7_300)).toBe(10_000);
    expect(niceCeil(2_100)).toBe(2_500);
    expect(niceFloor(-7)).toBe(-10);
    expect(niceFloor(-43)).toBe(-50);
    expect(niceFloor(-18)).toBe(-20);
  });
});
