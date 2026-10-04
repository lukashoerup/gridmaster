/**
 * The explorer's requests to the simulation and the answers it gets back.
 * Shared by the Web Worker and the main-thread fallback, so both run exactly
 * the same code.
 */
import { loadPlaceholderInputs } from '../data/placeholder';
import { SyntheticWeather, World, type StackRecord, type WorldInputs, type ZoneStats } from '../sim';

export const FIRST_YEAR = 1995;
export const LAST_YEAR = 2025;

export interface YearRequest {
  readonly kind: 'year';
  readonly id: number;
  readonly seed: number;
  readonly zone: string;
  readonly year: number;
  readonly extraSolarGw: number;
}

export interface SeriesRequest {
  readonly kind: 'series';
  readonly id: number;
  readonly seed: number;
  readonly zone: string;
  readonly extraSolarGw: number;
}

export interface CannibalRequest {
  readonly kind: 'cannibal';
  readonly id: number;
  readonly seed: number;
  readonly zone: string;
  readonly year: number;
  readonly maxGw: number;
}

export type Request = YearRequest | SeriesRequest | CannibalRequest;

export interface LinkPayload {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly capacityMw: number;
  readonly flow: Float64Array;
  readonly congested: Uint8Array;
}

export interface ZoneYearPayload {
  readonly zone: string;
  readonly year: number;
  readonly hours: number;
  readonly marketOpenFromHour: number;
  readonly negativeFromHour: number;
  readonly priceFloor: number;
  readonly priceCap: number;
  readonly price: Float64Array;
  readonly demand: Float64Array;
  readonly generation: Readonly<Record<string, Float64Array>>;
  readonly charging: Readonly<Record<string, Float64Array>>;
  readonly available: Readonly<Record<string, Float64Array>>;
  readonly netExport: Float64Array;
  readonly capacityMw: Readonly<Record<string, number>>;
  readonly stats: ZoneStats;
  readonly stacks: StackRecord | null;
  readonly neighbourPrices: Readonly<Record<string, Float64Array>>;
  readonly links: readonly LinkPayload[];
}

export interface YearResponse {
  readonly kind: 'year';
  readonly id: number;
  readonly payload: ZoneYearPayload;
  readonly ms: number;
}

export interface SeriesYearResponse {
  readonly kind: 'seriesYear';
  readonly id: number;
  readonly year: number;
  readonly stats: Readonly<Record<string, ZoneStats>>;
}

export interface SeriesDoneResponse {
  readonly kind: 'seriesDone';
  readonly id: number;
  readonly ms: number;
}

export interface CannibalPoint {
  readonly gw: number;
  readonly capturePrice: number | null;
  readonly captureRate: number | null;
  readonly meanPrice: number;
  readonly solarTwh: number;
}

export interface CannibalResponse {
  readonly kind: 'cannibal';
  readonly id: number;
  readonly points: readonly CannibalPoint[];
}

export interface ErrorResponse {
  readonly kind: 'error';
  readonly id: number;
  readonly message: string;
}

export type Response = YearResponse | SeriesYearResponse | SeriesDoneResponse | CannibalResponse | ErrorResponse;

let cachedInputs: WorldInputs | null = null;
let cachedWeather: SyntheticWeather | null = null;

function world(seed: number, zone: string, extraSolarGw: number): World {
  if (cachedInputs === null) cachedInputs = loadPlaceholderInputs();
  if (cachedWeather === null) cachedWeather = new SyntheticWeather(cachedInputs);
  const w = new World(cachedInputs, cachedWeather, seed);
  if (extraSolarGw > 0) w.addCapacity(zone, 'solar', extraSolarGw * 1000);
  return w;
}

export function zoneIds(): readonly string[] {
  if (cachedInputs === null) cachedInputs = loadPlaceholderInputs();
  return cachedInputs.zones.map((z) => z.id);
}

export function zoneName(id: string): string {
  if (cachedInputs === null) cachedInputs = loadPlaceholderInputs();
  return cachedInputs.zones.find((z) => z.id === id)?.name ?? id;
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : 0);

/** One year of one zone, simulated on its own from standard starting levels. */
export function runYear(req: YearRequest): YearResponse {
  const t0 = now();
  const w = world(req.seed, req.zone, req.extraSolarGw);
  const r = w.simulateYear(req.year, { recordStacks: [req.zone] });
  const z = r.byZone[req.zone];
  if (z === undefined) throw new Error(`unknown zone ${req.zone}`);
  const neighbourPrices: Record<string, Float64Array> = {};
  for (const l of r.links) {
    const other = l.from === req.zone ? l.to : l.to === req.zone ? l.from : null;
    if (other === null) continue;
    const n = r.byZone[other];
    if (n !== undefined) neighbourPrices[other] = n.price;
  }
  const payload: ZoneYearPayload = {
    zone: z.zone,
    year: z.year,
    hours: z.hours,
    marketOpenFromHour: z.marketOpenFromHour,
    negativeFromHour: z.negativeFromHour,
    priceFloor: z.priceFloor,
    priceCap: z.priceCap,
    price: z.price,
    demand: z.demand,
    generation: z.generation,
    charging: z.charging,
    available: z.available,
    netExport: z.netExport,
    capacityMw: z.capacityMw,
    stats: z.stats,
    stacks: z.stacks,
    neighbourPrices,
    links: r.links
      .filter((l) => l.from === req.zone || l.to === req.zone)
      .map((l) => ({ id: l.id, from: l.from, to: l.to, capacityMw: l.capacityMw, flow: l.flow, congested: l.congested })),
  };
  return { kind: 'year', id: req.id, payload, ms: now() - t0 };
}

/** All years in sequence (reservoirs and storage carry over), reporting each year's statistics as it finishes. */
export function runSeries(req: SeriesRequest, onYear: (r: SeriesYearResponse) => void): SeriesDoneResponse {
  const t0 = now();
  const w = world(req.seed, req.zone, req.extraSolarGw);
  for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
    const r = w.simulateYear(year);
    const stats: Record<string, ZoneStats> = {};
    for (const zid of r.zones) {
      const z = r.byZone[zid];
      if (z !== undefined) stats[zid] = z.stats;
    }
    onYear({ kind: 'seriesYear', id: req.id, year, stats });
  }
  return { kind: 'seriesDone', id: req.id, ms: now() - t0 };
}

/** Solar's earnings as more solar is added to the zone, for one year. */
export function runCannibal(req: CannibalRequest): CannibalResponse {
  const points: CannibalPoint[] = [];
  for (const share of [0, 0.1, 0.25, 0.5, 0.75, 1]) {
    const gw = Math.round(req.maxGw * share * 10) / 10;
    const w = world(req.seed, req.zone, gw);
    const r = w.simulateYear(req.year);
    const z = r.byZone[req.zone];
    if (z === undefined) continue;
    const s = z.stats.byTech.solar;
    points.push({ gw, capturePrice: s.capturePrice, captureRate: s.captureRate, meanPrice: z.stats.meanPrice, solarTwh: s.generationTwh });
  }
  return { kind: 'cannibal', id: req.id, points };
}

export function handle(req: Request, post: (r: Response) => void): void {
  try {
    switch (req.kind) {
      case 'year':
        post(runYear(req));
        break;
      case 'series':
        post(runSeries(req, post));
        break;
      case 'cannibal':
        post(runCannibal(req));
        break;
      default:
        break;
    }
  } catch (err) {
    post({ kind: 'error', id: req.id, message: err instanceof Error ? err.message : String(err) });
  }
}
