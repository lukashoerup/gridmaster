/**
 * The game page's pure parts, headless: how numbers are written, the day
 * chart's markup, the map's projection and how a site looks.
 */
import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs } from '../src/data/placeholder';
import { SITES, newGame } from '../src/game';
import { dayChartSvg } from '../src/play/chart';
import { money, moneyDelta, mw, mwh, pct, price, years } from '../src/play/format';
import { project, siteLook } from '../src/play/map';

describe('page wording', () => {
  it('writes money, energy and prices plainly', () => {
    expect(money(150_000_00)).toBe('€150,000');
    expect(money(-30_857_00)).toBe('−€30,857');
    expect(money(1_240_000_00)).toBe('€1.24m');
    expect(money(12_400_000_00)).toBe('€12.4m');
    expect(money(250_000_000_00)).toBe('€250m');
    expect(moneyDelta(0)).toBe('€0');
    expect(moneyDelta(1_000_00)).toBe('+€1,000');
    expect(moneyDelta(-1_000_00)).toBe('−€1,000');
    expect(mw(0.6)).toBe('600 kW');
    expect(mw(2.5)).toBe('2.5 MW');
    expect(mw(39.4)).toBe('39.4 MW');
    expect(mw(1450)).toBe('1,450 MW');
    expect(mwh(1572.4)).toBe('1,572 MWh');
    expect(mwh(21_000)).toBe('21.0 GWh');
    expect(price(-3.4)).toBe('−€3/MWh');
    expect(price(null)).toBe('–');
    expect(pct(0.885)).toBe('89%');
    expect(years(null)).toBe('never, at these prices');
    expect(years(6.4)).toBe('about 6 years');
  });
});

describe('day chart', () => {
  it('draws 24 hours to one scale with the hour marked', () => {
    const prices = Array.from({ length: 24 }, (_, i) => 20 + i);
    const svg = dayChartSvg(prices, 13);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('class="now"');
    expect(svg).toContain('class="price-line"');
    expect(svg).not.toContain('NaN');
    // Negative prices pull the axis below zero.
    const neg = dayChartSvg(prices.map((p) => p - 40), 0);
    expect(neg).toContain('>-20<');
    expect(neg).not.toContain('NaN');
  });
});

describe('map', () => {
  it('keeps every site inside the drawing', () => {
    for (const s of SITES) {
      const [x, y] = project(s.lon, s.lat);
      expect(x).toBeGreaterThan(20);
      expect(y).toBeGreaterThan(10);
      expect(x).toBeLessThan(210);
      expect(y).toBeLessThan(320);
    }
  });

  it('shows a site as free, taken or yours', () => {
    const s = newGame(1, loadPlaceholderInputs());
    const thy = SITES.find((x) => x.id === 'thy');
    if (thy === undefined) throw new Error('no Thy');
    expect(siteLook(s, thy)).toBe('free');
    const ss = s.sites.find((x) => x.id === 'thy');
    if (ss === undefined) throw new Error('no Thy state');
    ss.claimedMw = thy.maxMw;
    expect(siteLook(s, thy)).toBe('taken');
  });
});
