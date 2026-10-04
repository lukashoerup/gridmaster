import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs, placeholderRaw } from '../src/data/placeholder';
import { SyntheticWeather, TECHS, annualPath, interp, validateInputs } from '../src/sim';

describe('inputs', () => {
  it('loads and validates the placeholder data files', () => {
    const inputs = loadPlaceholderInputs();
    expect(inputs.status).toContain('placeholder');
    expect(inputs.zones.map((z) => z.id)).toEqual(['DK1', 'DE', 'NO', 'ES']);
    for (const t of TECHS) expect(inputs.technologies.has(t)).toBe(true);
    expect(inputs.links.map((l) => l.id)).toEqual(['DK1-DE', 'DK1-NO', 'DE-NO']);
    // Spain has no modelled neighbour.
    expect(inputs.links.some((l) => l.from === 'ES' || l.to === 'ES')).toBe(false);
  });

  it('marks every data file as a placeholder', () => {
    for (const [name, file] of Object.entries(placeholderRaw)) {
      const status = (file as { status?: unknown }).status;
      expect(status, name).toBe('placeholder, unverified');
    }
  });

  it('carries the agreed market dates', () => {
    const inputs = loadPlaceholderInputs();
    const byId = new Map(inputs.zones.map((z) => [z.id, z]));
    expect(byId.get('DK1')?.marketOpen).toEqual({ year: 1999, month: 7, day: 1 });
    expect(byId.get('DE')?.marketOpen.year).toBe(2000);
    expect(byId.get('NO')?.marketOpen.year).toBe(1996);
    expect(byId.get('ES')?.marketOpen.year).toBe(1998);
    expect(byId.get('DE')?.negativePricesFrom).toEqual({ year: 2008, month: 10, day: 1 });
    expect(byId.get('DK1')?.negativePricesFrom).toEqual({ year: 2009, month: 10, day: 1 });
    expect(byId.get('NO')?.negativePricesFrom).toEqual({ year: 2009, month: 10, day: 1 });
    expect(byId.get('ES')?.negativePricesFrom.year).toBeGreaterThan(2009);
  });

  it('has a carbon price of zero before 2005 and positive after', () => {
    const inputs = loadPlaceholderInputs();
    expect(interp(inputs.co2, 1995)).toBe(0);
    expect(interp(inputs.co2, 2004)).toBe(0);
    expect(interp(inputs.co2, 2005)).toBeGreaterThan(0);
    expect(interp(inputs.co2, 2023)).toBeGreaterThan(50);
  });

  it('interpolates keyframes linearly and holds outside the range', () => {
    const kf = [
      [2000, 10],
      [2010, 20],
      [2020, 0],
    ] as const;
    expect(interp(kf, 1990)).toBe(10);
    expect(interp(kf, 2000)).toBe(10);
    expect(interp(kf, 2005)).toBe(15);
    expect(interp(kf, 2010)).toBe(20);
    expect(interp(kf, 2015)).toBe(10);
    expect(interp(kf, 2030)).toBe(0);
    expect(interp([], 2000)).toBe(0);
  });

  it('has positive-definite weather correlation matrices', () => {
    expect(() => new SyntheticWeather(loadPlaceholderInputs())).not.toThrow();
  });

  it('rejects broken files with a path in the message', () => {
    const broken = { ...placeholderRaw, fuels: { status: 'placeholder, unverified', fuels: {}, co2: [[2000, 0]] } };
    expect(() => validateInputs(broken)).toThrow(/fuels\.fuels\.coal/);
    const noStatus = { ...placeholderRaw, links: { links: [] } };
    expect(() => validateInputs(noStatus)).toThrow(/links\.status/);
    const badYears = {
      ...placeholderRaw,
      fuels: { ...(placeholderRaw.fuels as object), co2: [[2010, 1], [2005, 2]] },
    };
    expect(() => validateInputs(badYears)).toThrow(/strictly increasing/);
  });

  // Stress finding F10: every mutation of the report must be rejected with the path in the message.
  it('range-checks shares, persistence, demand, capacities, reservoirs, amplitudes and dates', () => {
    type Raw = Record<string, any>; // free-form mutations of the raw JSON
    const zone = (r: Raw, id: string): Raw => r['zones'].zones.find((z: Raw) => z.id === id);
    const cases: [string, (r: Raw) => void, RegExp][] = [
      ['seasonal amplitude 1.5', (r) => (r['zones'].zones[3].demandShape.seasonalAmplitude = 1.5), /demandShape\.seasonalAmplitude/],
      ['weekend factor −1', (r) => (r['zones'].zones[0].demandShape.weekendFactor = -1), /weekendFactor/],
      ['negative demand', (r) => (r['zones'].zones[0].demandTwh = [[1995, -100]]), /demandTwh\[0\]\[1\]/],
      ['must-run override −1', (r) => (r['capacity'].mustRunOverrides.DK1.coal = -1), /mustRunOverrides\.DK1\.coal/],
      ['must-run override 1.5', (r) => (r['capacity'].mustRunOverrides.DK1.coal = 1.5), /mustRunOverrides\.DK1\.coal/],
      ['wind persistence 1.5', (r) => (r['weather'].windDailyPhi = 1.5), /windDailyPhi/],
      ['wind persistence 1', (r) => (r['weather'].windHourlyPhi = 1), /windHourlyPhi/],
      ['inflow persistence 1.2', (r) => (r['weather'].inflowDailyPhi = 1.2), /inflowDailyPhi/],
      ['wind seasonal amplitude 2', (r) => (zone(r, 'DE')['wind'].seasonalAmplitude = 2), /wind\.seasonalAmplitude/],
      ['negative reservoir', (r) => (zone(r, 'NO')['hydro'].reservoirTwh = -85), /reservoirTwh/],
      ['water-value slope 2000', (r) => (zone(r, 'ES')['hydro'].waterValueSlope = 2000), /waterValueSlope/],
      ['31 February', (r) => (zone(r, 'DK1')['marketOpen'] = '1999-02-31'), /marketOpen: bad date/],
      ['negative inflow shape', (r) => (zone(r, 'NO')['hydro'].inflowShape[0] = -1), /inflowShape\[0\]/],
      ['initial fill above 1', (r) => (zone(r, 'NO')['hydro'].initialFill = 1.2), /initialFill/],
      ['target fill above 1', (r) => (zone(r, 'NO')['hydro'].targetFill[5] = 1.1), /targetFill\[5\]/],
      ['negative availability', (r) => (r['technologies'].technologies[0].availability = -0.5), /availability/],
      ['reserve fraction 10', (r) => (zone(r, 'DE')['reserveFraction'] = 10), /reserveFraction/],
      ['negative capacity', (r) => (r['capacity'].capacity.DE.coal = [[1995, -1]]), /capacity\.DE\.coal/],
      ['negative link capacity', (r) => (r['links'].links[0].capacityMw = [[1995, -5]]), /links\.links\[0\]\.capacityMw/],
      ['flexible share above 1', (r) => (r['support'].support.DE.wind.flexShare = [[1995, 2]]), /flexShare/],
      ['negative fuel price', (r) => (r['fuels'].fuels.gas = [[1995, -3]]), /fuels\.fuels\.gas/],
      ['efficiency 0', (r) => (r['technologies'].technologies[0].efficiency = [[1995, 0]]), /efficiency/],
      ['correlation above 1', (r) => (r['weather'].windCorrelation[0][1] = r['weather'].windCorrelation[1][0] = 1.5), /windCorrelation/],
      ['years reversed', (r) => (r['zones'].years = [2025, 1995]), /zones\.years/],
    ];
    for (const [name, mutate, path] of cases) {
      const raw = structuredClone(placeholderRaw) as unknown as Raw;
      mutate(raw);
      expect(() => validateInputs(raw as never), name).toThrow(path);
    }
  });
});

describe('fuel and carbon path through the year (analyst B7)', () => {
  const gas = [
    [2019, 14],
    [2020, 9.5],
    [2021, 47],
    [2022, 125],
    [2023, 40],
  ] as const;

  it('has no step at New Year', () => {
    for (let y = 2019; y < 2023; y++) expect(annualPath(gas, y, 1)).toBeCloseTo(annualPath(gas, y + 1, 0), 12);
  });

  it('averages to each year’s value and never goes negative', () => {
    for (let y = 2019; y <= 2023; y++) {
      let sum = 0;
      const n = 100_000;
      for (let i = 0; i < n; i++) {
        const v = annualPath(gas, y, (i + 0.5) / n);
        expect(v).toBeGreaterThanOrEqual(0);
        sum += v;
      }
      expect(sum / n).toBeCloseTo(interp(gas, y), 6);
    }
    // The old blend stepped from 66.5 (December 2021) to 105.5 (January 2022).
    expect(annualPath(gas, 2021, 1)).toBeCloseTo(86, 9);
  });

  it('starts carbon pricing at zero on 1 January 2005', () => {
    const co2 = loadPlaceholderInputs().co2;
    expect(annualPath(co2, 2004, 0.5)).toBe(0);
    expect(annualPath(co2, 2005, 0)).toBe(0);
    expect(annualPath(co2, 2005, 0.5)).toBeGreaterThan(0);
  });
});
