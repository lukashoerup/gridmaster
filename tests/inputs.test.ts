import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs, placeholderRaw } from '../src/data/placeholder';
import { SyntheticWeather, TECHS, interp, validateInputs } from '../src/sim';

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
});
