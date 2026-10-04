/**
 * The typical day of a hub: each hour of the day averaged over the last
 * 4 weeks. Prices are lines (the hub's, the national, and the hub's without
 * the player's plants); the player's output is the shaded area, with the
 * town's demand as a dotted line on the same MW scale. The worst hour is
 * marked, and a battery's blue and red hours sit under the axis.
 */
import type { Colour, TypicalDay } from '../rules';
import { svg } from './dom';
import { hourLabel } from './format';

const W = 320;
const H = 160;
const L = 30;
const R = 30;
const T = 14;
const B = 26;

export function typicalDayChart(td: TypicalDay, colour: Colour, plan: readonly number[] | null): SVGSVGElement {
  const pw = W - L - R;
  const ph = H - T - B;
  const x = (hod: number): number => L + (pw * (hod + 0.5)) / 24;
  const all = [...td.price, ...td.national, ...td.withoutYou];
  const pMax = Math.max(40, Math.ceil(Math.max(...all) / 10) * 10);
  const pMin = Math.min(0, Math.floor(Math.min(...all) / 10) * 10);
  const yp = (p: number): number => T + ph * (1 - (p - pMin) / (pMax - pMin));
  const mwMax = Math.max(10, Math.ceil(Math.max(...td.playerMw, ...td.demandMw) / 10) * 10);
  const ym = (v: number): number => T + ph * (1 - v / mwMax);
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'tday', role: 'img', 'aria-label': 'Typical day' });

  // Grid and axes.
  for (let p = pMin; p <= pMax; p += pMax - pMin > 80 ? 20 : 10) {
    root.append(svg('line', { x1: L, x2: W - R, y1: yp(p), y2: yp(p), class: p === 0 ? 'axis' : 'grid' }));
    root.append(svg('text', { x: L - 4, y: yp(p) + 3, class: 'tick', 'text-anchor': 'end' }, document.createTextNode(`€${p}`)));
  }
  for (const v of [0, mwMax / 2, mwMax]) {
    root.append(svg('text', { x: W - R + 4, y: ym(v) + 3, class: 'tick mw' }, document.createTextNode(`${Math.round(v)}`)));
  }
  root.append(svg('text', { x: W - R + 4, y: T - 4, class: 'tick mw' }, document.createTextNode('MW')));
  for (const hod of [0, 6, 12, 18, 23]) {
    root.append(svg('text', { x: x(hod), y: H - B + 12, class: 'tick', 'text-anchor': 'middle' }, document.createTextNode(hourLabel(hod).slice(0, 2))));
  }

  // Battery plan strip.
  if (plan !== null) {
    plan.forEach((v, hod) => {
      if (v === 0) return;
      root.append(svg('rect', { x: x(hod) - pw / 48 + 0.5, y: H - B + 15, width: pw / 24 - 1, height: 5, class: v > 0 ? 'plan-charge' : 'plan-discharge' }));
    });
  }

  // The player's output: shaded area on the MW scale.
  if (td.playerMw.some((v) => v > 0.05)) {
    let d = `M${x(0)},${ym(0)}`;
    td.playerMw.forEach((v, hod) => (d += ` L${x(hod)},${ym(v)}`));
    d += ` L${x(23)},${ym(0)} Z`;
    root.append(svg('path', { d, class: 'output' }));
  }
  // Demand, dotted, on the MW scale.
  root.append(svg('path', { d: line(td.demandMw, x, ym), class: 'demand' }));

  // Prices.
  root.append(svg('path', { d: line(td.national, x, yp), class: 'national' }));
  if (td.playerMw.some((v) => v > 0.05)) root.append(svg('path', { d: line(td.withoutYou, x, yp), class: 'without' }));
  root.append(svg('path', { d: line(td.price, x, yp), class: `hubprice ${colour}` }));

  // The worst hour.
  if (td.worstKind !== null) {
    const hx = x(td.worstHour);
    const py = yp(td.price[td.worstHour] ?? 0);
    root.append(svg('line', { x1: hx, x2: hx, y1: T, y2: H - B, class: `worst ${td.worstKind}` }));
    root.append(svg('circle', { cx: hx, cy: py, r: 3.5, class: `worst-dot ${td.worstKind}` }));
    const anchor = td.worstHour > 16 ? 'end' : td.worstHour < 5 ? 'start' : 'middle';
    root.append(svg('text', { x: hx, y: T - 3, class: `worst-label ${td.worstKind}`, 'text-anchor': anchor }, document.createTextNode(`worst ${hourLabel(td.worstHour)}: ${td.worstKind}`)));
  }
  return root;
}

function line(values: readonly number[], x: (i: number) => number, y: (v: number) => number): string {
  return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
}
