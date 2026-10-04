import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs } from '../src/data/placeholder';
import { SyntheticWeather, demandSeries, hoursInYear } from '../src/sim';

function dailyMeans(series: Float64Array): number[] {
  const days = series.length / 24;
  const out: number[] = [];
  for (let d = 0; d < days; d++) {
    let s = 0;
    for (let h = 0; h < 24; h++) s += series[d * 24 + h] ?? 0;
    out.push(s / 24);
  }
  return out;
}

function mean(xs: readonly number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function correlation(a: readonly number[], b: readonly number[]): number {
  const ma = mean(a);
  const mb = mean(b);
  let sab = 0;
  let saa = 0;
  let sbb = 0;
  for (let i = 0; i < a.length; i++) {
    const da = (a[i] ?? 0) - ma;
    const db = (b[i] ?? 0) - mb;
    sab += da * db;
    saa += da * da;
    sbb += db * db;
  }
  return sab / Math.sqrt(saa * sbb);
}

describe('synthetic weather placeholder', () => {
  const inputs = loadPlaceholderInputs();
  const weather = new SyntheticWeather(inputs);

  it('is reproducible per (seed, year) and differs across seeds and years', () => {
    const a = weather.year(11, 2010);
    const b = weather.year(11, 2010);
    const c = weather.year(12, 2010);
    const d = weather.year(11, 2011);
    expect(Array.from(a.wind['DK1'] ?? [])).toEqual(Array.from(b.wind['DK1'] ?? []));
    expect(Array.from(a.wind['DK1'] ?? [])).not.toEqual(Array.from(c.wind['DK1'] ?? []));
    expect(Array.from(a.solar['DE'] ?? []).slice(0, 2000)).not.toEqual(Array.from(d.solar['DE'] ?? []).slice(0, 2000));
    expect(a.hours).toBe(8760);
    expect(weather.year(1, 1996).hours).toBe(8784);
  });

  it('keeps capacity factors within 0..1 and near the zone means', () => {
    const w = weather.year(3, 2015);
    for (const z of inputs.zones) {
      const wind = w.wind[z.id];
      const solar = w.solar[z.id];
      expect(wind).toBeDefined();
      expect(solar).toBeDefined();
      if (wind === undefined || solar === undefined) continue;
      let ws = 0;
      let ss = 0;
      for (let h = 0; h < w.hours; h++) {
        const cw = wind[h] ?? -1;
        const cs = solar[h] ?? -1;
        expect(cw).toBeGreaterThanOrEqual(0);
        expect(cw).toBeLessThanOrEqual(1);
        expect(cs).toBeGreaterThanOrEqual(0);
        expect(cs).toBeLessThanOrEqual(1);
        ws += cw;
        ss += cs;
      }
      expect(Math.abs(ws / w.hours / z.wind.meanCf - 1)).toBeLessThan(0.2);
      expect(Math.abs(ss / w.hours / z.solar.meanCf - 1)).toBeLessThan(0.15);
    }
  });

  it('has no solar output at night and a midday peak', () => {
    const w = weather.year(5, 2015);
    const solar = w.solar['DK1'];
    expect(solar).toBeDefined();
    if (solar === undefined) return;
    const byHour = new Array<number>(24).fill(0);
    for (let h = 0; h < w.hours; h++) byHour[h % 24] = (byHour[h % 24] ?? 0) + (solar[h] ?? 0);
    expect(byHour[0]).toBe(0);
    expect(byHour[1]).toBe(0);
    const peak = byHour.indexOf(Math.max(...byHour));
    expect(peak).toBeGreaterThanOrEqual(11);
    expect(peak).toBeLessThanOrEqual(13);
  });

  it('gives wind a winter maximum and solar a summer maximum', () => {
    const w = weather.year(9, 2012);
    const wind = dailyMeans(w.wind['DE'] ?? new Float64Array(0));
    const solar = dailyMeans(w.solar['DE'] ?? new Float64Array(0));
    const winter = (xs: number[]): number => mean([...xs.slice(0, 60), ...xs.slice(305)]);
    const summer = (xs: number[]): number => mean(xs.slice(150, 240));
    expect(winter(wind)).toBeGreaterThan(summer(wind));
    expect(summer(solar)).toBeGreaterThan(winter(solar) * 2);
  });

  it('correlates wind across zones as configured and persists over days', () => {
    const corr = { dkDe: [] as number[], dkNo: [] as number[], dkEs: [] as number[], lag1: [] as number[] };
    for (const seed of [1, 2, 3, 4, 5]) {
      const w = weather.year(seed, 2000);
      const dk = dailyMeans(w.wind['DK1'] ?? new Float64Array(0));
      const de = dailyMeans(w.wind['DE'] ?? new Float64Array(0));
      const no = dailyMeans(w.wind['NO'] ?? new Float64Array(0));
      const es = dailyMeans(w.wind['ES'] ?? new Float64Array(0));
      corr.dkDe.push(correlation(dk, de));
      corr.dkNo.push(correlation(dk, no));
      corr.dkEs.push(correlation(dk, es));
      corr.lag1.push(correlation(dk.slice(1), dk.slice(0, -1)));
    }
    expect(mean(corr.dkDe)).toBeGreaterThan(0.5);
    expect(mean(corr.dkNo)).toBeGreaterThan(0.2);
    expect(mean(corr.dkNo)).toBeLessThan(mean(corr.dkDe));
    expect(mean(corr.dkEs)).toBeLessThan(0.25);
    expect(mean(corr.lag1)).toBeGreaterThan(0.3);
  });

  it('gives Norway a spring-melt inflow peak and varies the year', () => {
    const a = weather.year(21, 2003);
    const b = weather.year(22, 2003);
    const inflowA = a.inflow['NO'];
    const inflowB = b.inflow['NO'];
    expect(inflowA).toBeDefined();
    expect(inflowB).toBeDefined();
    expect(a.inflow['DK1']).toBeUndefined();
    if (inflowA === undefined || inflowB === undefined) return;
    const daysA = dailyMeans(inflowA);
    const meltA = mean(daysA.slice(120, 181));
    const winterA = mean(daysA.slice(0, 59));
    expect(meltA).toBeGreaterThan(winterA * 2.5);
    expect(mean(daysA)).not.toBeCloseTo(mean(dailyMeans(inflowB)), 3);
  });
});

describe('demand shape', () => {
  const inputs = loadPlaceholderInputs();

  it('sums to the annual demand and has daily, weekly and seasonal structure', () => {
    for (const z of inputs.zones) {
      const year = 2010;
      const d = demandSeries(z, year, 42);
      expect(d.length).toBe(hoursInYear(year));
      let sum = 0;
      for (let h = 0; h < d.length; h++) sum += d[h] ?? 0;
      const annualTwh = sum / 1e6;
      const target = z.demandTwh.find((k) => k[0] === year)?.[1];
      if (target !== undefined) expect(annualTwh).toBeCloseTo(target, 6);
      const days = dailyMeans(d);
      // Weekend days are lighter: 2010-01-02 was a Saturday (day index 1).
      let weekend = 0;
      let weekday = 0;
      let nWe = 0;
      let nWd = 0;
      for (let i = 0; i < days.length; i++) {
        const dow = (i + 4) % 7; // 1 Jan 2010 was a Friday → index 4 with Monday = 0
        if (dow >= 5) {
          weekend += days[i] ?? 0;
          nWe++;
        } else {
          weekday += days[i] ?? 0;
          nWd++;
        }
      }
      expect(weekend / nWe).toBeLessThan(weekday / nWd);
      // Night demand below midday demand.
      let night = 0;
      let noon = 0;
      for (let h = 0; h < d.length; h += 24) {
        night += d[h + 3] ?? 0;
        noon += d[h + 12] ?? 0;
      }
      expect(night).toBeLessThan(noon);
      if (z.id !== 'ES') expect(mean(days.slice(0, 59))).toBeGreaterThan(mean(days.slice(180, 240)));
      // Peak-to-mean ratio in a plausible band.
      const peak = Math.max(...Array.from(d));
      expect(peak / (sum / d.length)).toBeGreaterThan(1.2);
      expect(peak / (sum / d.length)).toBeLessThan(1.7);
    }
  });
});
