/**
 * Today's DK1 price, hour by hour, as a small SVG step chart with the
 * current hour marked. Drawn to one scale; labels only name values the
 * axis reaches.
 */

const W = 320;
const H = 150;
const PAD_L = 34;
const PAD_R = 8;
const PAD_T = 10;
const PAD_B = 22;

function niceStep(range: number): number {
  const raw = range / 3;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9))));
  for (const m of [1, 2, 2.5, 5, 10]) if (raw <= m * mag) return m * mag;
  return 10 * mag;
}

/** SVG markup for 24 hourly prices with hour `now` (0–23) marked. */
export function dayChartSvg(prices: readonly number[], now: number): string {
  const n = prices.length;
  let lo = 0;
  let hi = 40;
  for (const p of prices) {
    if (p < lo) lo = p;
    if (p > hi) hi = p;
  }
  const step = niceStep(hi - lo);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const x = (i: number): number => PAD_L + ((W - PAD_L - PAD_R) * i) / Math.max(1, n);
  const y = (p: number): number => PAD_T + ((H - PAD_T - PAD_B) * (hi - p)) / Math.max(1e-9, hi - lo);
  const parts: string[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) {
    const yy = y(v).toFixed(1);
    parts.push(`<line x1="${PAD_L}" x2="${W - PAD_R}" y1="${yy}" y2="${yy}" class="grid${Math.abs(v) < 1e-9 ? ' zero' : ''}"/>`);
    parts.push(`<text x="${PAD_L - 5}" y="${(y(v) + 3.5).toFixed(1)}" class="axis" text-anchor="end">${Math.round(v)}</text>`);
  }
  for (const hh of [0, 6, 12, 18, 24]) {
    parts.push(`<text x="${x(hh).toFixed(1)}" y="${H - 6}" class="axis" text-anchor="middle">${hh === 24 ? '24h' : `${hh}h`}</text>`);
  }
  if (now >= 0 && now < n) {
    parts.push(`<rect x="${x(now).toFixed(1)}" y="${PAD_T}" width="${(x(now + 1) - x(now)).toFixed(1)}" height="${H - PAD_T - PAD_B}" class="now"/>`);
  }
  let line = '';
  let area = `M${x(0).toFixed(1)} ${y(Math.max(lo, 0)).toFixed(1)}`;
  prices.forEach((p, i) => {
    const yy = y(p).toFixed(1);
    line += `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${yy} L${x(i + 1).toFixed(1)} ${yy} `;
    area += ` L${x(i).toFixed(1)} ${yy} L${x(i + 1).toFixed(1)} ${yy}`;
  });
  area += ` L${x(n).toFixed(1)} ${y(Math.max(lo, 0)).toFixed(1)} Z`;
  parts.push(`<path d="${area}" class="price-area"/>`);
  parts.push(`<path d="${line}" class="price-line"/>`);
  const p = prices[now];
  if (p !== undefined) parts.push(`<circle cx="${((x(now) + x(now + 1)) / 2).toFixed(1)}" cy="${y(p).toFixed(1)}" r="3.2" class="price-dot"/>`);
  return `<svg viewBox="0 0 ${W} ${H}" class="day-chart" role="img" aria-label="Today's hourly price in Western Denmark">${parts.join('')}</svg>`;
}
