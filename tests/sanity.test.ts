/**
 * Qualitative sanity checks on the placeholder world. These describe shapes
 * the real markets show; the placeholder data is tuned only roughly, so the
 * thresholds are loose. Calibration (task part c) tightens them.
 */
import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs } from '../src/data/placeholder';
import { SyntheticWeather, World, meanByHourOfDay, type YearResult } from '../src/sim';

const inputs = loadPlaceholderInputs();
const weather = new SyntheticWeather(inputs);
const SEEDS = [42, 7];

function run(seed: number, year: number, setup?: (w: World) => void): YearResult {
  const w = new World(inputs, weather, seed);
  if (setup) setup(w);
  return w.simulateYear(year);
}

function mean(xs: readonly number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

describe('Germany', () => {
  it('shows a midday price sag in the 2020s and none in 2005', () => {
    for (const seed of SEEDS) {
      const late = meanByHourOfDay(run(seed, 2024).byZone['DE']?.price ?? new Float64Array(0));
      const midday = mean(late.slice(11, 15));
      const morning = mean(late.slice(6, 9));
      const evening = mean(late.slice(18, 21));
      expect(midday, `seed ${seed} midday < morning`).toBeLessThan(morning);
      expect(midday, `seed ${seed} midday < evening`).toBeLessThan(evening);
      expect(midday, `seed ${seed} midday < day mean`).toBeLessThan(mean(late));

      const early = meanByHourOfDay(run(seed, 2005).byZone['DE']?.price ?? new Float64Array(0));
      const middayEarly = mean(early.slice(11, 15));
      const nightEarly = mean(early.slice(1, 5));
      expect(middayEarly, `seed ${seed} 2005 midday ≥ night`).toBeGreaterThanOrEqual(nightEarly);
    }
  });

  it('has negative hours after late 2008 and none before', () => {
    for (const seed of SEEDS) {
      expect(run(seed, 2007).byZone['DE']?.stats.negativeHours).toBe(0);
      expect(run(seed, 2009).byZone['DE']?.stats.negativeHours ?? 0).toBeGreaterThan(0);
      expect(run(seed, 2024).byZone['DE']?.stats.negativeHours ?? 0).toBeGreaterThan(100);
    }
  });

  it("solar's capture rate falls as solar's share rises", () => {
    for (const seed of SEEDS) {
      const rates: number[] = [];
      for (const extraGw of [0, 20, 50]) {
        const r = run(seed, 2020, (w) => w.addCapacity('DE', 'solar', extraGw * 1000));
        const s = r.byZone['DE']?.stats.byTech.solar;
        expect(s?.captureRate).not.toBeNull();
        rates.push(s?.captureRate ?? NaN);
      }
      expect(rates[1], `seed ${seed}: +20 GW`).toBeLessThan(rates[0] ?? NaN);
      expect(rates[2], `seed ${seed}: +50 GW`).toBeLessThan(rates[1] ?? NaN);
      // Across history: solar earned about the average price when it was small.
      const early = run(seed, 2008).byZone['DE']?.stats.byTech.solar.captureRate ?? NaN;
      const late = run(seed, 2024).byZone['DE']?.stats.byTech.solar.captureRate ?? NaN;
      expect(late).toBeLessThan(early);
      expect(early).toBeGreaterThan(0.85);
    }
  });

  it('adding solar never raises the annual mean price', () => {
    for (const seed of SEEDS) {
      const base = run(seed, 2020).byZone['DE']?.stats.meanPrice ?? NaN;
      const more = run(seed, 2020, (w) => w.addCapacity('DE', 'solar', 30000)).byZone['DE']?.stats.meanPrice ?? NaN;
      expect(more).toBeLessThanOrEqual(base + 1e-9);
    }
  });
});

describe('Norway and Western Denmark', () => {
  it("Norway's prices are smoother than Western Denmark's in most modern years", () => {
    // Checked for 2019 onwards. Earlier the placeholder German stack is so flat
    // that DK1, coupled to it, is smoother than the real DK1 was (calibration
    // item), and a wet synthetic year parks Norway near zero when hydro is
    // forced and at the German price when coupled, which widens its spread.
    let smoother = 0;
    let total = 0;
    let noStd = 0;
    let dkStd = 0;
    for (const seed of SEEDS) {
      for (const year of [2019, 2022, 2024, 2025]) {
        const r = run(seed, year);
        const no = r.byZone['NO']?.stats.stdPrice ?? NaN;
        const dk = r.byZone['DK1']?.stats.stdPrice ?? NaN;
        total++;
        if (no < dk) smoother++;
        noStd += no;
        dkStd += dk;
      }
    }
    expect(smoother / total).toBeGreaterThanOrEqual(0.75);
    expect(noStd).toBeLessThan(dkStd);
  });

  it('Western Denmark shares its neighbour price whenever the link is not full', () => {
    for (const seed of SEEDS) {
      const r = run(seed, 2015);
      const dk = r.byZone['DK1'];
      const de = r.byZone['DE'];
      const link = r.links.find((l) => l.id === 'DK1-DE');
      if (dk === undefined || de === undefined || link === undefined) throw new Error('missing');
      let coupled = 0;
      let separated = 0;
      let diffWhenFull = 0;
      for (let h = 0; h < r.hours; h++) {
        const full = (link.congested[h] ?? 0) === 1;
        const diff = Math.abs((dk.price[h] ?? 0) - (de.price[h] ?? 0));
        if (!full) {
          expect(diff, `seed ${seed} hour ${h}`).toBeLessThan(1e-6);
          coupled++;
        } else {
          separated++;
          if (diff > 1) diffWhenFull++;
        }
      }
      expect(coupled).toBeGreaterThan(500);
      expect(separated).toBeGreaterThan(500);
      expect(diffWhenFull).toBeGreaterThan(100);
      // When the link is full the exporter is never dearer than the importer.
      for (let h = 0; h < r.hours; h++) {
        const f = link.flow[h] ?? 0;
        if ((link.congested[h] ?? 0) === 0 || f === 0) continue;
        if (f > 0) expect(dk.price[h] ?? 0).toBeLessThanOrEqual((de.price[h] ?? 0) + 1e-6);
        else expect(de.price[h] ?? 0).toBeLessThanOrEqual((dk.price[h] ?? 0) + 1e-6);
      }
    }
  });
});

describe('the whole placeholder world', () => {
  it('runs 1995–2025 without unserved energy in normal years and with plausible annual means', () => {
    const w = new World(inputs, weather, 42);
    const means: Record<string, number[]> = {};
    let wrongWay = 0;
    for (let year = 1995; year <= 2025; year++) {
      const r = w.simulateYear(year);
      // The wrong-way repair leaves no congested link flowing from the dearer
      // zone in the tested worlds; a couple of hours a year are tolerated.
      expect(r.wrongWayLinkHours, `${year} wrong-way link hours`).toBeLessThanOrEqual(2);
      wrongWay += r.wrongWayLinkHours;
      for (const zid of r.zones) {
        const s = r.byZone[zid]?.stats;
        if (s === undefined) continue;
        (means[zid] ??= []).push(s.meanPrice);
        expect(s.meanPrice, `${zid} ${year} mean`).toBeGreaterThan(0);
        expect(s.meanPrice, `${zid} ${year} mean`).toBeLessThan(400);
        expect(s.unservedMwh, `${zid} ${year} unserved`).toBeLessThan(5000);
      }
    }
    expect(wrongWay).toBeLessThanOrEqual(5);
    // 2022 was the dearest year everywhere.
    for (const zid of ['DK1', 'DE', 'ES']) {
      const m = means[zid] ?? [];
      const i2022 = 2022 - 1995;
      expect(Math.max(...m)).toBe(m[i2022]);
    }
  });
});
