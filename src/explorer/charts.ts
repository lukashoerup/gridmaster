/**
 * ECharts option builders for the explorer. Pure functions from simulation
 * payloads to chart options; no DOM access here.
 */
import type { CustomSeriesRenderItemAPI, CustomSeriesRenderItemParams, CustomSeriesRenderItemReturn, EChartsOption } from 'echarts';
import { TECHS, TRANCHE, labelForHour, priceDuration, type TechId, type ZoneStats } from '../sim';
import type { CannibalPoint, ZoneYearPayload } from './protocol';

export const TECH_LABEL: Readonly<Record<TechId, string>> = {
  nuclear: 'Nuclear',
  lignite: 'Lignite',
  coal: 'Coal',
  gas_ccgt: 'Gas (CCGT/CHP)',
  gas_ocgt: 'Gas peakers',
  oil: 'Oil',
  biomass: 'Biomass',
  hydro_ror: 'Hydro, run-of-river',
  hydro_res: 'Hydro, reservoir',
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
// top leaves room for a one-line legend above the axis names.
const GRID = { left: 56, right: 56, top: 60, bottom: 44 };

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

function fmt(n: number, digits = 0): string {
  return Number.isFinite(n) ? n.toFixed(digits) : '–';
}

/** One week of hourly prices and the generation that met demand. */
export function weekOption(p: ZoneYearPayload, weekIndex: number): EChartsOption {
  const start = Math.min(weekIndex * 168, Math.max(0, p.hours - 168));
  const n = Math.min(168, p.hours - start);
  const labels: string[] = [];
  for (let i = 0; i < n; i++) labels.push(labelForHour(p.year, start + i));
  const series: NonNullable<EChartsOption['series']> = [];
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
    });
  }
  const demand: number[] = [];
  const price: number[] = [];
  for (let i = 0; i < n; i++) {
    demand.push(Math.round(p.demand[start + i] ?? 0));
    price.push(Math.round(((p.price[start + i] ?? 0) + Number.EPSILON) * 10) / 10);
  }
  series.push({
    name: 'Demand',
    type: 'line',
    data: demand,
    symbol: 'none',
    lineStyle: { color: DEMAND_COLOR, width: 1.5, type: 'dashed' },
    itemStyle: { color: DEMAND_COLOR },
    yAxisIndex: 0,
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
  });
  return {
    animation: false,
    grid: GRID,
    tooltip: { trigger: 'axis', valueFormatter: (v) => (typeof v === 'number' ? fmt(v, v < 100 ? 1 : 0) : String(v)) },
    legend: { type: 'scroll', top: 0, textStyle: { fontSize: 11 } },
    xAxis: { type: 'category', data: labels, axisLabel: { formatter: (v: string) => v.slice(5, 10), interval: 23 } },
    yAxis: [
      { type: 'value', name: 'MW', nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 11 } },
      { type: 'value', name: '€/MWh', nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 11 }, splitLine: { show: false } },
    ],
    series,
  };
}

/** Prices of the year sorted from dearest to cheapest. */
export function durationOption(p: ZoneYearPayload): EChartsOption {
  const sorted = priceDuration(p.price);
  const data: number[] = [];
  for (let i = 0; i < sorted.length; i++) data.push(Math.round((sorted[i] ?? 0) * 10) / 10);
  const neg = p.stats.negativeHours;
  return {
    animation: false,
    grid: GRID,
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const first = Array.isArray(params) ? params[0] : params;
        if (first === undefined || typeof first !== 'object') return '';
        const idx = Number((first as { dataIndex?: number }).dataIndex ?? 0);
        return `${idx + 1} of ${sorted.length} hours at or above ${fmt(data[idx] ?? 0, 1)} €/MWh`;
      },
    },
    xAxis: { type: 'category', data: data.map((_, i) => i + 1), axisLabel: { interval: Math.max(1, Math.floor(sorted.length / 6) - 1) }, name: 'hours', nameLocation: 'middle', nameGap: 26 },
    yAxis: { type: 'value', name: '€/MWh', scale: true, axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'line',
        data,
        symbol: 'none',
        areaStyle: { color: '#9bbbd4', opacity: 0.35 },
        lineStyle: { color: '#2f6fb3', width: 2 },
        markLine: {
          symbol: 'none',
          label: { formatter: neg > 0 ? `${neg} negative hours` : 'no negative hours', position: 'insideEndTop', fontSize: 11 },
          lineStyle: { color: '#888', type: 'dashed' },
          data: [{ yAxis: 0 }],
        },
      },
    ],
  };
}

export type SeriesByYear = ReadonlyMap<number, Readonly<Record<string, ZoneStats>>>;

/** Annual mean price (line) and negative-price hours (bars) across the years. */
export function annualOption(series: SeriesByYear, zone: string, firstYear: number, lastYear: number, others: readonly string[]): EChartsOption {
  const years: number[] = [];
  for (let y = firstYear; y <= lastYear; y++) years.push(y);
  const mean = years.map((y) => {
    const s = series.get(y)?.[zone];
    return s === undefined ? null : Math.round(s.meanPrice * 10) / 10;
  });
  const negative = years.map((y) => series.get(y)?.[zone]?.negativeHours ?? null);
  const otherSeries: NonNullable<EChartsOption['series']> = others.map((o) => ({
    name: `${o} mean`,
    type: 'line',
    data: years.map((y) => {
      const s = series.get(y)?.[o];
      return s === undefined ? null : Math.round(s.meanPrice * 10) / 10;
    }),
    symbol: 'none',
    lineStyle: { width: 1, type: 'dotted', opacity: 0.8 },
    yAxisIndex: 0,
  }));
  return {
    animation: false,
    grid: GRID,
    tooltip: { trigger: 'axis' },
    legend: { type: 'scroll', top: 0, textStyle: { fontSize: 11 } },
    xAxis: { type: 'category', data: years.map(String), axisLabel: { interval: 4 } },
    yAxis: [
      { type: 'value', name: '€/MWh', axisLabel: { fontSize: 11 } },
      { type: 'value', name: 'hours < 0', axisLabel: { fontSize: 11 }, splitLine: { show: false } },
    ],
    series: [
      { name: 'Negative hours', type: 'bar', data: negative, yAxisIndex: 1, itemStyle: { color: '#d9a2c5' } },
      { name: `${zone} mean price`, type: 'line', data: mean, symbol: 'circle', symbolSize: 4, lineStyle: { color: PRICE_COLOR, width: 2 }, itemStyle: { color: PRICE_COLOR }, yAxisIndex: 0 },
      ...otherSeries,
    ],
  };
}

/** Capture rate (earned price ÷ average price) per technology across years. */
export function captureOption(series: SeriesByYear, zone: string, firstYear: number, lastYear: number): EChartsOption {
  const years: number[] = [];
  for (let y = firstYear; y <= lastYear; y++) years.push(y);
  const techs: TechId[] = ['wind', 'solar', 'hydro_res', 'gas_ccgt', 'coal', 'nuclear'];
  const out: NonNullable<EChartsOption['series']> = [];
  for (const t of techs) {
    const data = years.map((y) => {
      const r = series.get(y)?.[zone]?.byTech[t];
      return r === undefined || r.captureRate === null || r.generationTwh < 0.05 ? null : Math.round(r.captureRate * 1000) / 10;
    });
    if (data.every((v) => v === null)) continue;
    out.push({ name: TECH_LABEL[t], type: 'line', data, symbol: 'none', connectNulls: false, lineStyle: { color: TECH_COLOR[t], width: t === 'solar' || t === 'wind' ? 2.5 : 1.2 }, itemStyle: { color: TECH_COLOR[t] } });
  }
  return {
    animation: false,
    grid: GRID,
    tooltip: { trigger: 'axis', valueFormatter: (v) => (typeof v === 'number' ? `${fmt(v, 0)} %` : '–') },
    legend: { type: 'scroll', top: 0, textStyle: { fontSize: 11 } },
    xAxis: { type: 'category', data: years.map(String), axisLabel: { interval: 4 } },
    yAxis: { type: 'value', name: '% of mean price', min: 0, axisLabel: { fontSize: 11 } },
    series: [
      ...out,
      { name: '100 %', type: 'line', data: years.map(() => 100), symbol: 'none', lineStyle: { color: '#999', type: 'dashed', width: 1 }, itemStyle: { color: '#999' }, tooltip: { show: false } },
    ],
  };
}

interface LadderBlock {
  x0: number;
  x1: number;
  bid: number;
  tech: TechId;
  tranche: number;
  mw: number;
  dispatched: number;
}

/** The supply offers of one hour, cheapest first, against the demand local plants had to cover. */
export function ladderOption(p: ZoneYearPayload, hour: number): EChartsOption {
  const stacks = p.stacks;
  const blocks: LadderBlock[] = [];
  let served = 0;
  if (stacks !== null) {
    const a = stacks.offsets[hour] ?? 0;
    const b = stacks.offsets[hour + 1] ?? a;
    const idx: number[] = [];
    for (let i = a; i < b; i++) idx.push(i);
    idx.sort((i, j) => (stacks.bid[i] ?? 0) - (stacks.bid[j] ?? 0) || i - j);
    let x = 0;
    for (const i of idx) {
      const mw = stacks.mw[i] ?? 0;
      const tech = TECHS[stacks.tech[i] ?? 0] ?? 'coal';
      blocks.push({ x0: x, x1: x + mw, bid: stacks.bid[i] ?? 0, tech, tranche: stacks.tranche[i] ?? 0, mw, dispatched: stacks.dispatched[i] ?? 0 });
      x += mw;
      served += stacks.dispatched[i] ?? 0;
    }
  }
  const price = p.price[hour] ?? 0;
  const demand = p.demand[hour] ?? 0;
  const lo = Math.min(-5, ...blocks.map((b) => b.bid));
  const hi = Math.max(price, 10, ...blocks.filter((b) => b.x0 < served * 1.6 + 1).map((b) => b.bid)) * 1.15;
  const floor = Math.floor(lo);
  const xMax = Math.ceil(Math.max(served * 1.6, demand * 1.2, 1) / 500) * 500;
  const renderItem = (_params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI): CustomSeriesRenderItemReturn => {
    const x0 = Number(api.value(0));
    const x1 = Number(api.value(1));
    const bid = Number(api.value(2));
    const dispatched = Number(api.value(4));
    const colorIndex = Number(api.value(3));
    // Columns rise from the chart's floor to the offer price, so offers at or
    // near zero (most wind and solar) stay visible instead of collapsing onto
    // the zero line.
    const start = api.coord([x0, bid]);
    const end = api.coord([x1, floor]);
    const tech = TECHS[colorIndex] ?? 'coal';
    const sx = start[0] ?? 0;
    const sy = start[1] ?? 0;
    const ex = end[0] ?? 0;
    const ey = end[1] ?? 0;
    return {
      type: 'rect',
      shape: { x: sx, y: Math.min(sy, ey), width: Math.max(1, ex - sx), height: Math.max(1, Math.abs(ey - sy)) },
      style: { fill: TECH_COLOR[tech], opacity: dispatched > 0.5 ? 0.95 : 0.35, stroke: '#fff', lineWidth: 0.5 },
    };
  };
  return {
    animation: false,
    grid: GRID,
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const v = (params as { value?: unknown }).value;
        if (!Array.isArray(v)) return '';
        const tech = TECHS[Number(v[3])] ?? 'coal';
        const tranche = Number(v[5]);
        const kind =
          tranche === TRANCHE.MUST_RUN
            ? 'must-run'
            : tranche === TRANCHE.FLEX_RENEWABLE
              ? 'switches off below zero'
              : tranche === TRANCHE.LEGACY_RENEWABLE
                ? 'keeps running (support)'
                : tranche === TRANCHE.STORAGE
                  ? 'discharge'
                  : tranche === TRANCHE.HYDRO_FORCED
                    ? 'forced (reservoir full)'
                    : tranche === TRANCHE.HYDRO
                      ? 'water value'
                      : 'marginal cost';
        return `${TECH_LABEL[tech]} (${kind})<br/>offer ${fmt(Number(v[2]), 1)} €/MWh · ${fmt(Number(v[1]) - Number(v[0]))} MW · ran ${fmt(Number(v[4]))} MW`;
      },
    },
    xAxis: { type: 'value', name: 'MW offered, cheapest first', nameLocation: 'middle', nameGap: 26, max: xMax, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', name: '€/MWh', min: floor, max: Math.ceil(hi), axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'custom',
        renderItem,
        encode: { x: [0, 1], y: 2 },
        data: blocks.map((b) => [b.x0, b.x1, b.bid, TECHS.indexOf(b.tech), b.dispatched, b.tranche]),
        markLine: {
          symbol: 'none',
          lineStyle: { color: PRICE_COLOR, width: 1.5 },
          label: { fontSize: 11 },
          data: [
            { xAxis: served, label: { formatter: `local supply ${fmt(served)} MW`, position: 'insideEndTop' }, lineStyle: { type: 'solid' } },
            { xAxis: demand, label: { formatter: `demand ${fmt(demand)} MW`, position: 'insideStartTop' }, lineStyle: { type: 'dashed', color: DEMAND_COLOR } },
            { yAxis: price, label: { formatter: `price ${fmt(price, 1)}`, position: 'insideEndTop' }, lineStyle: { type: 'dotted' } },
          ],
        },
      },
    ],
  };
}

/** Solar's earnings as solar is added to the zone. */
export function cannibalOption(points: readonly CannibalPoint[], currentGw: number, current: CannibalPoint | null): EChartsOption {
  const xs = points.map((p) => p.gw);
  const capture = points.map((p) => (p.capturePrice === null ? null : Math.round(p.capturePrice * 10) / 10));
  const meanPrice = points.map((p) => Math.round(p.meanPrice * 10) / 10);
  const rate = points.map((p) => (p.captureRate === null ? null : Math.round(p.captureRate * 1000) / 10));
  const series: NonNullable<EChartsOption['series']> = [
    { name: 'Solar earns (€/MWh)', type: 'line', data: xs.map((x, i) => [x, capture[i]]), symbol: 'circle', lineStyle: { color: TECH_COLOR.solar, width: 2.5 }, itemStyle: { color: TECH_COLOR.solar } },
    { name: 'Average price (€/MWh)', type: 'line', data: xs.map((x, i) => [x, meanPrice[i]]), symbol: 'none', lineStyle: { color: PRICE_COLOR, width: 1.5, type: 'dashed' }, itemStyle: { color: PRICE_COLOR } },
    { name: 'Capture rate (%)', type: 'line', data: xs.map((x, i) => [x, rate[i]]), symbol: 'none', yAxisIndex: 1, lineStyle: { color: '#d65c9d', width: 1.5 }, itemStyle: { color: '#d65c9d' } },
  ];
  if (current !== null && current.capturePrice !== null) {
    series.push({
      name: 'Now',
      type: 'scatter',
      data: [[currentGw, Math.round(current.capturePrice * 10) / 10]],
      symbolSize: 12,
      itemStyle: { color: '#1b1b1f' },
    });
  }
  return {
    animation: false,
    grid: GRID,
    tooltip: { trigger: 'axis' },
    legend: { type: 'scroll', top: 0, textStyle: { fontSize: 11 } },
    xAxis: { type: 'value', name: 'GW of solar added', nameLocation: 'middle', nameGap: 26, axisLabel: { fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '€/MWh', axisLabel: { fontSize: 11 } },
      { type: 'value', name: '%', min: 0, axisLabel: { fontSize: 11 }, splitLine: { show: false } },
    ],
    series,
  };
}
