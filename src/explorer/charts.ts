/**
 * ECharts option builders for the explorer, plus the titles, captions and
 * notes that go with them. Pure functions from simulation payloads to chart
 * options and text; no DOM access here. Everything a chart shows comes from
 * the payload it is given (its zone, year, seed and added solar), never from
 * the page's current control values.
 */
import type { CustomSeriesRenderItemAPI, CustomSeriesRenderItemReturn, EChartsOption } from 'echarts';
import { TECHS, TRANCHE, labelForHour, priceDuration, type TechId, type ZoneStats } from '../sim';
import type { CannibalPoint, ZoneYearPayload } from './protocol';

export const TECH_LABEL: Readonly<Record<TechId, string>> = {
  nuclear: 'Nuclear',
  lignite: 'Lignite',
  coal: 'Coal',
  gas_ccgt: 'Gas',
  gas_ocgt: 'Gas peakers',
  oil: 'Oil',
  biomass: 'Biomass',
  hydro_ror: 'River hydro',
  hydro_res: 'Reservoir hydro',
  pumped: 'Pumped hydro',
  battery: 'Batteries',
  wind: 'Wind',
  solar: 'Solar',
};

export const TECH_COLOR: Readonly<Record<TechId, string>> = {
  nuclear: '#8e6bbf',
  lignite: '#6b4a2b',
  coal: '#8c8275',
  gas_ccgt: '#e8873a',
  gas_ocgt: '#d9534f',
  oil: '#8b1a1a',
  biomass: '#5a9e4b',
  hydro_ror: '#7fb8e6',
  hydro_res: '#2f6fb3',
  pumped: '#2aa198',
  battery: '#d65c9d',
  wind: '#4fb3d9',
  solar: '#f2c236',
};

const PRICE_COLOR = '#1b1b1f';
const DEMAND_COLOR = '#444';
const RATE_COLOR = '#7a3fa0';
const FONT = 11;

/** Chart width in CSS pixels, for layout choices (legend rows, label density). */
export interface Layout {
  readonly width: number;
}

const DEFAULT_LAYOUT: Layout = { width: 600 };
const narrow = (l: Layout): boolean => l.width < 480;

/** Stacking order for generation: inflexible and cheap at the bottom. */
const STACK_ORDER: readonly TechId[] = [
  'nuclear',
  'lignite',
  'coal',
  'hydro_ror',
  'biomass',
  'gas_ccgt',
  'gas_ocgt',
  'oil',
  'hydro_res',
  'pumped',
  'battery',
  'wind',
  'solar',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A number with fixed decimals, '–' when missing, never "-0". */
export function fmt(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '–';
  const s = n.toFixed(digits);
  return /^-0(\.0*)?$/.test(s) ? s.slice(1) : s;
}

/** "1 Jul" for an hour index of a year. */
export function shortDate(year: number, hour: number): string {
  const label = labelForHour(year, hour); // "2024-07-01 13:00"
  return `${Number(label.slice(8, 10))} ${MONTHS[Number(label.slice(5, 7)) - 1] ?? ''}`;
}

/** "1 Jul 13:00" for an hour index of a year. */
export function shortDateTime(year: number, hour: number): string {
  return `${shortDate(year, hour)} ${labelForHour(year, hour).slice(11, 16)}`;
}

/** A round number at or above `v` (1, 2, 2.5 or 5 × a power of ten). */
export function niceCeil(v: number): number {
  if (v === 0) return 0;
  if (v < 0) return -niceFloor(-v);
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v - 1e-9 * p) return m * p;
  return 10 * p;
}

/** A round number at or below `v`. */
export function niceFloor(v: number): number {
  if (v === 0) return 0;
  if (v < 0) return -niceCeil(-v);
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [10, 5, 2.5, 2, 1]) if (m * p <= v + 1e-9 * p) return m * p;
  return p;
}

// ---------------------------------------------------------------------------
// Weeks: 7-day steps from 1 January; the last step is the year's final 7 days.

/** Number of week positions in a year of `hours` hours (52 for 365 or 366 days). */
export function weekCount(hours: number): number {
  return Math.max(1, Math.floor(hours / 168));
}

/** First hour of week position `i`: 7-day steps, the last one ending on 31 December. */
export function weekStart(hours: number, i: number): number {
  const n = weekCount(hours);
  const k = Math.min(Math.max(0, Math.round(i)), n - 1);
  return k === n - 1 ? Math.max(0, hours - 168) : k * 168;
}

// ---------------------------------------------------------------------------
// Legends: plain (wrapping) legends, with room made above the plot for every row.

function legendRows(names: readonly string[], width: number): number {
  const avail = Math.max(120, width - 16);
  let rows = 1;
  let x = 0;
  for (const n of names) {
    const w = 18 + 5 + n.length * 6.4 + 10;
    if (x > 0 && x + w > avail) {
      rows++;
      x = 0;
    }
    x += w;
  }
  return rows;
}

function legendAndGrid(names: readonly string[], layout: Layout, extra: { left?: number; right?: number; bottom?: number } = {}): Pick<EChartsOption, 'legend' | 'grid'> {
  const rows = names.length === 0 ? 0 : legendRows(names, layout.width);
  return {
    legend: { type: 'plain', top: 0, left: 8, right: 8, data: [...names], itemGap: 10, itemWidth: 18, itemHeight: 10, textStyle: { fontSize: FONT } },
    grid: { left: extra.left ?? 52, right: extra.right ?? 52, top: 12 + rows * 20 + 18, bottom: extra.bottom ?? 40 },
  };
}

// ---------------------------------------------------------------------------
// Titles, captions and notes

export function zoneYear(p: ZoneYearPayload, name: string): string {
  return `${name}, ${p.year}`;
}

export function weekTitle(p: ZoneYearPayload, name: string, weekIndex: number): string {
  const s = weekStart(p.hours, weekIndex);
  return `One week, hour by hour: ${zoneYear(p, name)}, ${shortDate(p.year, s)}–${shortDate(p.year, Math.min(p.hours - 1, s + 167))}`;
}

export function ladderTitle(p: ZoneYearPayload, name: string, hour: number): string {
  return `The offers in one hour: ${zoneYear(p, name)}, ${shortDateTime(p.year, hour)}`;
}

/** Plain-language state of the market in a year: regulated all year, part of it, or not at all. */
function regulatedNote(p: ZoneYearPayload, name: string): string {
  const tariff = p.price[0] ?? 0;
  if (p.marketOpenFromHour >= p.hours) return ` In ${p.year} ${name} had no hourly market yet: everyone paid a flat regulated tariff of ${fmt(tariff, 1)} €/MWh, which is why the price is flat.`;
  if (p.marketOpenFromHour > 0) return ` Until ${shortDate(p.year, p.marketOpenFromHour)} ${p.year} the price was a flat regulated tariff of ${fmt(tariff, 1)} €/MWh; the hourly market set it after that.`;
  return '';
}

export function weekCaption(p: ZoneYearPayload, name: string): string {
  return (
    'The price (black line, right axis, €/MWh) over the generation that met demand (stacked, left axis, MW; storage counts when it discharges). Wind and solar push the price down when they are plentiful. Where the stack falls short of the dashed demand line the zone imported the rest; where it overshoots, it exported or charged storage.' +
    regulatedNote(p, name)
  );
}

export function ladderCaption(): string {
  return 'Every supply offer in the chosen hour, cheapest first, coloured by technology: the solid part of each block ran, the faded part did not. When a local offer sets the price, it is where local supply (solid vertical line) meets the demand local plants had to cover: demand plus exports and storage charging, minus imports. When the zone is coupled to a neighbour, the price can be set there instead, and the note above the chart says so. Offers below zero come from plants that would rather pay than switch off.';
}

/** What set the price in this hour, in a sentence, with the demand and supply figures. */
export function ladderNote(p: ZoneYearPayload, hour: number): string {
  const blocks = ladderBlocks(p, hour);
  const market = hour >= p.marketOpenFromHour;
  const mp = p.marginalPrice[hour] ?? 0;
  const demand = p.demand[hour] ?? 0;
  const served = blocks.reduce((s, b) => s + b.dispatched, 0);
  const net = p.netExport[hour] ?? 0;
  const trade = Math.abs(net) < 0.5 ? 'traded nothing on balance' : net > 0 ? `exported ${fmt(net)} MW` : `imported ${fmt(-net)} MW`;
  const setter = blocks.find((b) => Math.abs(b.bid - mp) < 0.005);
  let who: string;
  if (setter !== undefined) who = `set by a local ${TECH_LABEL[setter.tech].toLowerCase()} offer`;
  else if (Math.abs(net) >= 0.5) who = `set in the neighbouring zone it was coupled to (no local offer at that price; the zone ${net > 0 ? 'exported' : 'imported'})`;
  else if (mp <= p.priceFloor + 1e-6 || mp >= p.priceCap - 1e-6) who = 'at the price limit';
  else who = 'set by a buyer: storage charging';
  const priceText = market
    ? `Price ${fmt(mp, 1)} €/MWh, ${who}.`
    : `The hourly market had not opened: everyone paid a regulated tariff of ${fmt(p.price[hour] ?? 0, 1)} €/MWh. The market computed underneath came to ${fmt(mp, 1)} €/MWh, ${who}.`;
  return `${priceText} Demand ${fmt(demand)} MW (dashed line); local plants supplied ${fmt(served)} MW (solid line) and the zone ${trade}.`;
}

export function durationTitle(p: ZoneYearPayload, name: string): string {
  return `All hours of the year, sorted: ${zoneYear(p, name)}`;
}

export function durationCaption(p: ZoneYearPayload, name: string): string {
  return 'Every hour of the year from the dearest to the cheapest. A steep left end means scarcity spikes; a long flat tail at or below zero means hours of renewable surplus.' + regulatedNote(p, name);
}

export function cannibalTitle(zoneName: string, year: number): string {
  return `What solar earns as more solar is built: ${zoneName}, ${year}`;
}

export function cannibalCaption(p: ZoneYearPayload | null, name: string): string {
  let regulated = '';
  if (p !== null && p.marketOpenFromHour >= p.hours) regulated = ` In ${p.year} ${name} paid a flat regulated tariff, so solar earned the tariff whatever was built.`;
  else if (p !== null && p.marketOpenFromHour > 0) regulated = ' Before the market opened that year, solar earned the flat tariff.';
  return (
    'Each point simulates the chosen year with that much solar added to this zone; the black dot is where the “Add solar to this zone” slider at the top stands now. The more solar there is, the lower the midday price it sells into, so solar earns less than the average price (its capture rate: dashed line, right axis) even while the average price falls.' +
    regulated
  );
}

export function annualTitle(name: string): string {
  return `Prices and negative hours, 1995–2025: ${name}`;
}

/** The long-run caption: neighbours and reservoirs only where they exist. */
export function annualCaption(name: string, neighbours: readonly string[], reservoirs: readonly string[]): string {
  const parts = ['The average price of each year (line) and the number of hours with a negative price (bars), for the baseline world: the solar slider does not change these charts. Before a zone opened its market it paid a flat regulated price.'];
  if (neighbours.length > 0) parts.push(`${listText(neighbours)} ${neighbours.length === 1 ? 'is' : 'are'} dotted for comparison.`);
  else parts.push(`${name} has no modelled neighbour.`);
  if (reservoirs.length > 0) parts.push(`The years run in sequence, so wet or dry years carry over through ${listText(reservoirs.map((r) => `${r}’s`))} reservoirs.`);
  else parts.push('The years run in sequence, so storage carries over from one year to the next.');
  return parts.join(' ');
}

export function captureTitle(name: string): string {
  return `What each technology earned, as a share of the average price, 1995–2025: ${name}`;
}

export function captureCaption(): string {
  return 'The price a technology captured divided by the year’s average price, for the baseline world (the solar slider does not change it). Solar sinks below 100 % as solar grows: it produces when everyone else’s solar does. Wind suffers a milder version of the same; dispatchable plants earn above average because they run in dear hours. A gap means the rate is not defined: the technology produced next to nothing, or the average price was at or below 1 €/MWh.';
}

function listText(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1] ?? ''}`;
}

// ---------------------------------------------------------------------------
// The week

/** One week of hourly prices and the generation that met demand. */
export function weekOption(p: ZoneYearPayload, weekIndex: number, layout: Layout = DEFAULT_LAYOUT): EChartsOption {
  const start = weekStart(p.hours, weekIndex);
  const n = Math.min(168, p.hours - start);
  const hours: number[] = [];
  for (let i = 0; i < n; i++) hours.push(start + i);
  const series: NonNullable<EChartsOption['series']> = [];
  const names: string[] = ['Price', 'Demand'];
  const mw = (v: unknown): string => (typeof v === 'number' ? `${fmt(v)} MW` : '–');
  for (const t of STACK_ORDER) {
    const g = p.generation[t];
    if (g === undefined) continue;
    const data: number[] = [];
    let any = false;
    for (let i = 0; i < n; i++) {
      const v = g[start + i] ?? 0;
      if (v > 0.5) any = true;
      data.push(Math.round(v));
    }
    if (!any) continue;
    names.push(TECH_LABEL[t]);
    series.push({
      name: TECH_LABEL[t],
      type: 'line',
      stack: 'gen',
      areaStyle: { color: TECH_COLOR[t], opacity: 0.9 },
      lineStyle: { width: 0 },
      itemStyle: { color: TECH_COLOR[t] },
      symbol: 'none',
      data,
      yAxisIndex: 0,
      tooltip: { valueFormatter: mw },
    });
  }
  const demand: number[] = [];
  const price: number[] = [];
  for (let i = 0; i < n; i++) {
    demand.push(Math.round(p.demand[start + i] ?? 0));
    price.push(Math.round((p.price[start + i] ?? 0) * 10) / 10);
  }
  series.push({
    name: 'Demand',
    type: 'line',
    data: demand,
    symbol: 'none',
    lineStyle: { color: DEMAND_COLOR, width: 1.5, type: 'dashed' },
    itemStyle: { color: DEMAND_COLOR },
    yAxisIndex: 0,
    tooltip: { valueFormatter: mw },
  });
  series.push({
    name: 'Price',
    type: 'line',
    data: price,
    symbol: 'none',
    lineStyle: { color: PRICE_COLOR, width: 2 },
    itemStyle: { color: PRICE_COLOR },
    yAxisIndex: 1,
    z: 10,
    tooltip: { valueFormatter: (v) => (typeof v === 'number' ? `${fmt(v, 1)} €/MWh` : '–') },
  });
  // One short date per day, every other day on a phone, at midnight.
  const step = narrow(layout) ? 48 : 24;
  return {
    animation: false,
    ...legendAndGrid(names, layout),
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
    xAxis: {
      type: 'category',
      data: hours.map((h) => shortDateTime(p.year, h)),
      axisLabel: {
        fontSize: FONT,
        interval: (index: number) => ((hours[index] ?? 1) - (hours[0] ?? 0)) % step === 0 && (hours[index] ?? 1) % 24 === 0,
        formatter: (v: string) => v.slice(0, v.lastIndexOf(' ')),
        hideOverlap: true,
      },
      axisTick: { interval: 23 },
    },
    yAxis: [
      { type: 'value', name: 'MW', nameTextStyle: { fontSize: FONT }, axisLabel: { fontSize: FONT } },
      { type: 'value', name: '€/MWh', nameTextStyle: { fontSize: FONT }, axisLabel: { fontSize: FONT }, splitLine: { show: false } },
    ],
    series,
  };
}

// ---------------------------------------------------------------------------
// The offers of one hour

interface LadderBlock {
  x0: number;
  x1: number;
  bid: number;
  tech: TechId;
  tranche: number;
  mw: number;
  dispatched: number;
}

function ladderBlocks(p: ZoneYearPayload, hour: number): LadderBlock[] {
  const stacks = p.stacks;
  const blocks: LadderBlock[] = [];
  if (stacks === null) return blocks;
  const a = stacks.offsets[hour] ?? 0;
  const b = stacks.offsets[hour + 1] ?? a;
  const idx: number[] = [];
  for (let i = a; i < b; i++) idx.push(i);
  idx.sort((i, j) => (stacks.bid[i] ?? 0) - (stacks.bid[j] ?? 0) || i - j);
  let x = 0;
  for (const i of idx) {
    const mw = stacks.mw[i] ?? 0;
    const tech = TECHS[stacks.tech[i] ?? 0] ?? 'coal';
    blocks.push({ x0: x, x1: x + mw, bid: stacks.bid[i] ?? 0, tech, tranche: stacks.tranche[i] ?? 0, mw, dispatched: Math.min(mw, Math.max(0, stacks.dispatched[i] ?? 0)) });
    x += mw;
  }
  return blocks;
}

const TRANCHE_TEXT: Readonly<Record<number, string>> = {
  [TRANCHE.MUST_RUN]: 'must-run',
  [TRANCHE.FLEX_RENEWABLE]: 'switches off below zero',
  [TRANCHE.LEGACY_RENEWABLE]: 'keeps running (support)',
  [TRANCHE.STORAGE]: 'storage discharge',
  [TRANCHE.HYDRO_FORCED]: 'forced (reservoir full)',
  [TRANCHE.HYDRO]: 'water value',
  [TRANCHE.NORMAL]: 'marginal cost',
};

/** The supply offers of one hour, cheapest first, against the demand local plants had to cover. */
export function ladderOption(p: ZoneYearPayload, hour: number, layout: Layout = DEFAULT_LAYOUT): EChartsOption {
  const blocks = ladderBlocks(p, hour);
  const served = blocks.reduce((s, b) => s + b.dispatched, 0);
  const mp = p.marginalPrice[hour] ?? 0;
  const tariff = hour < p.marketOpenFromHour ? (p.price[hour] ?? null) : null;
  const demand = p.demand[hour] ?? 0;
  const xMax = niceCeil(Math.max(served * 1.6, demand * 1.2, 1));
  const shown = blocks.filter((b) => b.x0 < xMax);
  const lo = Math.min(-5, mp, ...shown.map((b) => b.bid));
  const hi = Math.max(10, mp, tariff ?? 0, ...shown.filter((b) => b.x0 < served * 1.3 + 1).map((b) => b.bid)) * 1.15;
  const yMin = niceFloor(lo);
  const yMax = niceCeil(hi);
  const renderItem = (_params: unknown, api: CustomSeriesRenderItemAPI): CustomSeriesRenderItemReturn => {
    const x0 = Number(api.value(0));
    const x1 = Number(api.value(1));
    const bid = Number(api.value(2));
    const tech = TECHS[Number(api.value(3))] ?? 'coal';
    const ran = Number(api.value(4));
    // Columns rise from the chart's floor to the offer price, so offers at or
    // near zero stay visible; the part that ran is solid, the rest faded.
    const top = api.coord([x0, bid]);
    const split = api.coord([x0 + ran, yMin]);
    const end = api.coord([x1, yMin]);
    const sx = top[0] ?? 0;
    const sy = top[1] ?? 0;
    const mx = split[0] ?? sx;
    const ex = end[0] ?? 0;
    const ey = end[1] ?? 0;
    const y = Math.min(sy, ey);
    const h = Math.max(1, Math.abs(ey - sy));
    const children: object[] = [];
    if (mx - sx > 0.2) children.push({ type: 'rect', shape: { x: sx, y, width: mx - sx, height: h }, style: { fill: TECH_COLOR[tech], opacity: 0.95 } });
    if (ex - mx > 0.2) children.push({ type: 'rect', shape: { x: mx, y, width: ex - mx, height: h }, style: { fill: TECH_COLOR[tech], opacity: 0.3 } });
    children.push({ type: 'rect', shape: { x: sx, y, width: Math.max(1, ex - sx), height: h }, style: { fill: 'none', stroke: '#fff', lineWidth: 0.5 } });
    return { type: 'group', children } as unknown as CustomSeriesRenderItemReturn;
  };
  const markData: object[] = [
    { xAxis: served, lineStyle: { type: 'solid', color: PRICE_COLOR } },
    { xAxis: demand, lineStyle: { type: 'dashed', color: DEMAND_COLOR } },
    { yAxis: mp, lineStyle: { type: 'dotted', color: PRICE_COLOR }, label: { show: true, formatter: `${tariff === null ? 'price' : 'market'} ${fmt(mp, 1)}`, position: 'insideEndTop', fontSize: FONT } },
  ];
  if (tariff !== null) {
    markData.push({ yAxis: tariff, lineStyle: { type: 'solid', color: '#b07a00' }, label: { show: true, formatter: `tariff ${fmt(tariff, 1)}`, position: 'insideStartTop', fontSize: FONT, color: '#8a6000' } });
  }
  return {
    animation: false,
    grid: { left: 52, right: 20, top: 16, bottom: 40 },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const v = (params as { value?: unknown }).value;
        if (!Array.isArray(v)) return '';
        const tech = TECHS[Number(v[3])] ?? 'coal';
        const kind = TRANCHE_TEXT[Number(v[5])] ?? 'offer';
        return `${TECH_LABEL[tech]} (${kind})<br/>offer ${fmt(Number(v[2]), 1)} €/MWh · ${fmt(Number(v[1]) - Number(v[0]))} MW · ran ${fmt(Number(v[4]))} MW`;
      },
    },
    xAxis: { type: 'value', name: narrow(layout) ? 'MW, cheapest first' : 'MW offered, cheapest first', nameLocation: 'middle', nameGap: 26, min: 0, max: xMax, axisLabel: { fontSize: FONT, hideOverlap: true } },
    yAxis: { type: 'value', name: '€/MWh', min: yMin, max: yMax, axisLabel: { fontSize: FONT } },
    series: [
      {
        type: 'custom',
        renderItem: renderItem as never,
        clip: true,
        encode: { x: [0, 1], y: 2 },
        data: blocks.map((b) => [b.x0, b.x1, b.bid, TECHS.indexOf(b.tech), b.dispatched, b.tranche]),
        markLine: { symbol: 'none', silent: true, label: { show: false }, lineStyle: { width: 1.5 }, data: markData as never },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// The sorted year

/** Prices of the year sorted from dearest to cheapest. */
export function durationOption(p: ZoneYearPayload, layout: Layout = DEFAULT_LAYOUT): EChartsOption {
  const sorted = priceDuration(p.price);
  const n = sorted.length;
  const data: [number, number][] = [];
  for (let i = 0; i < n; i++) data.push([i + 1, Math.round((sorted[i] ?? 0) * 10) / 10]);
  const neg = p.stats.negativeHours;
  return {
    animation: false,
    grid: { left: 52, right: 20, top: 24, bottom: 40 },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const first = Array.isArray(params) ? params[0] : params;
        const v = (first as { value?: unknown } | undefined)?.value;
        if (!Array.isArray(v)) return '';
        return `${fmt(Number(v[1]), 1)} €/MWh in the hour ranked ${fmt(Number(v[0]))} of ${n} (dearest first)`;
      },
    },
    xAxis: { type: 'value', min: 1, max: n, name: narrow(layout) ? 'hours' : 'hours, dearest first', nameLocation: 'middle', nameGap: 26, axisLabel: { fontSize: FONT, hideOverlap: true }, splitNumber: narrow(layout) ? 3 : 5 },
    yAxis: { type: 'value', name: '€/MWh', scale: true, axisLabel: { fontSize: FONT } },
    series: [
      {
        type: 'line',
        data,
        symbol: 'none',
        areaStyle: { color: '#9bbbd4', opacity: 0.35 },
        lineStyle: { color: '#2f6fb3', width: 2 },
        markLine: {
          symbol: 'none',
          silent: true,
          label: { formatter: neg > 0 ? `${neg} negative hours` : 'no negative hours', position: 'insideEndTop', fontSize: FONT },
          lineStyle: { color: '#888', type: 'dashed' },
          data: [{ yAxis: 0 }],
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// The long run

export type SeriesByYear = ReadonlyMap<number, Readonly<Record<string, ZoneStats>>>;

/** Annual mean price (line) and negative-price hours (bars) across the years. */
export function annualOption(series: SeriesByYear, zone: string, firstYear: number, lastYear: number, others: readonly string[], layout: Layout = DEFAULT_LAYOUT): EChartsOption {
  const years: number[] = [];
  for (let y = firstYear; y <= lastYear; y++) years.push(y);
  const round1 = (v: number): number => Math.round(v * 10) / 10;
  const mean = years.map((y) => {
    const s = series.get(y)?.[zone];
    return s === undefined ? null : round1(s.meanPrice);
  });
  const negative = years.map((y) => series.get(y)?.[zone]?.negativeHours ?? null);
  const euro = (v: unknown): string => (typeof v === 'number' ? `${fmt(v, 1)} €/MWh` : '–');
  const otherSeries: NonNullable<EChartsOption['series']> = others.map((o) => ({
    name: `${o} average`,
    type: 'line',
    data: years.map((y) => {
      const s = series.get(y)?.[o];
      return s === undefined ? null : round1(s.meanPrice);
    }),
    symbol: 'none',
    lineStyle: { width: 1.2, type: 'dotted', opacity: 0.9 },
    yAxisIndex: 0,
    tooltip: { valueFormatter: euro },
  }));
  const names = [`${zone} average price`, 'Negative hours', ...others.map((o) => `${o} average`)];
  return {
    animation: false,
    ...legendAndGrid(names, layout),
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: years.map(String), axisLabel: { interval: narrow(layout) ? 9 : 4, fontSize: FONT } },
    yAxis: [
      { type: 'value', name: '€/MWh', axisLabel: { fontSize: FONT } },
      { type: 'value', name: 'hours < 0', minInterval: 1, axisLabel: { fontSize: FONT }, splitLine: { show: false } },
    ],
    series: [
      { name: `${zone} average price`, type: 'line', data: mean, symbol: 'circle', symbolSize: 4, lineStyle: { color: PRICE_COLOR, width: 2 }, itemStyle: { color: PRICE_COLOR }, yAxisIndex: 0, z: 10, tooltip: { valueFormatter: euro } },
      { name: 'Negative hours', type: 'bar', data: negative, yAxisIndex: 1, itemStyle: { color: '#d9a2c5' }, tooltip: { valueFormatter: (v) => (typeof v === 'number' ? `${fmt(v)} hours` : '–') } },
      ...otherSeries,
    ],
  };
}

/** Capture rate (earned price ÷ average price) per technology across years; gaps where it is not defined. */
export function captureOption(series: SeriesByYear, zone: string, firstYear: number, lastYear: number, layout: Layout = DEFAULT_LAYOUT): EChartsOption {
  const years: number[] = [];
  for (let y = firstYear; y <= lastYear; y++) years.push(y);
  const techs: TechId[] = ['wind', 'solar', 'hydro_res', 'gas_ccgt', 'coal', 'nuclear'];
  const out: NonNullable<EChartsOption['series']> = [];
  const names: string[] = [];
  for (const t of techs) {
    const data = years.map((y) => {
      const r = series.get(y)?.[zone]?.byTech[t];
      return r === undefined || r.captureRate === null || r.generationTwh < 0.05 ? null : Math.round(r.captureRate * 1000) / 10;
    });
    if (data.every((v) => v === null)) continue;
    names.push(TECH_LABEL[t]);
    out.push({ name: TECH_LABEL[t], type: 'line', data, symbol: 'none', connectNulls: false, lineStyle: { color: TECH_COLOR[t], width: t === 'solar' || t === 'wind' ? 2.5 : 1.2 }, itemStyle: { color: TECH_COLOR[t] } });
  }
  return {
    animation: false,
    ...legendAndGrid(names, layout),
    tooltip: { trigger: 'axis', valueFormatter: (v) => (typeof v === 'number' ? `${fmt(v, 0)} % of the average price` : '–') },
    xAxis: { type: 'category', data: years.map(String), axisLabel: { interval: narrow(layout) ? 9 : 4, fontSize: FONT } },
    // No fixed minimum: a rate can fall below zero when a technology sells into negative prices.
    yAxis: { type: 'value', name: '% of average', scale: true, axisLabel: { fontSize: FONT } },
    series: [
      ...out,
      {
        type: 'line',
        data: [],
        markLine: { symbol: 'none', silent: true, label: { formatter: '100 %', position: 'insideEndTop', fontSize: FONT }, lineStyle: { color: '#999', type: 'dashed', width: 1 }, data: [{ yAxis: 100 }] },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// The solar curve

/** Solar's earnings as solar is added to the zone; `current` is the year view's own point (its added GW and capture price). */
export function cannibalOption(points: readonly CannibalPoint[], current: { gw: number; capturePrice: number | null } | null, layout: Layout = DEFAULT_LAYOUT): EChartsOption {
  const round1 = (v: number | null): number | null => (v === null ? null : Math.round(v * 10) / 10);
  const series: NonNullable<EChartsOption['series']> = [
    { name: 'Solar earns', type: 'line', data: points.map((p) => [p.gw, round1(p.capturePrice)]), symbol: 'circle', symbolSize: 6, lineStyle: { color: TECH_COLOR.solar, width: 2.5 }, itemStyle: { color: '#c99a10' } },
    { name: 'Average price', type: 'line', data: points.map((p) => [p.gw, round1(p.meanPrice)]), symbol: 'none', lineStyle: { color: PRICE_COLOR, width: 1.5 }, itemStyle: { color: PRICE_COLOR } },
    {
      name: 'Capture rate (right axis)',
      type: 'line',
      data: points.map((p) => [p.gw, p.captureRate === null ? null : Math.round(p.captureRate * 1000) / 10]),
      symbol: 'triangle',
      symbolSize: 6,
      yAxisIndex: 1,
      lineStyle: { color: RATE_COLOR, width: 1.5, type: 'dashed' },
      itemStyle: { color: RATE_COLOR },
    },
  ];
  const names = ['Solar earns', 'Average price', 'Capture rate (right axis)'];
  if (current !== null && current.capturePrice !== null) {
    names.push('Now');
    series.push({ name: 'Now', type: 'scatter', data: [[current.gw, round1(current.capturePrice)]], symbolSize: 12, itemStyle: { color: PRICE_COLOR } });
  }
  return {
    animation: false,
    ...legendAndGrid(names, layout),
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const first = list[0] as { value?: unknown } | undefined;
        const x = Array.isArray(first?.value) ? Number(first.value[0]) : NaN;
        const lines = [`${fmt(x, 1)} GW of solar added`];
        for (const item of list) {
          const it = item as { seriesName?: string; value?: unknown; marker?: string };
          const y = Array.isArray(it.value) ? it.value[1] : null;
          const rate = it.seriesName?.startsWith('Capture') === true;
          lines.push(`${it.marker ?? ''}${it.seriesName ?? ''}: ${typeof y === 'number' ? (rate ? `${fmt(y, 0)} % of average` : `${fmt(y, 1)} €/MWh`) : '–'}`);
        }
        return lines.join('<br/>');
      },
    },
    xAxis: { type: 'value', name: 'GW of solar added', nameLocation: 'middle', nameGap: 26, axisLabel: { fontSize: FONT } },
    yAxis: [
      { type: 'value', name: '€/MWh', scale: true, axisLabel: { fontSize: FONT } },
      { type: 'value', name: '% (dashed)', scale: true, axisLabel: { fontSize: FONT, color: RATE_COLOR }, nameTextStyle: { color: RATE_COLOR, fontSize: FONT }, splitLine: { show: false } },
    ],
    series,
  };
}
