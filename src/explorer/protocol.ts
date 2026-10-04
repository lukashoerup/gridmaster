/**
 * The explorer's requests to the simulation and the answers it gets back.
 * Shared by the Web Worker and the main-thread fallback, so both run exactly
 * the same code.
 *
 * The long run ("series") is the baseline world of one seed replayed from
 * 1995 to 2025 in order, without the solar slider. It records the world's
 * state at every 1 January. A single-year view (and the "what solar earns"
 * curve) starts from that year's recorded state once the long run has
 * reached it, so its numbers match the long-run charts for the same seed and
 * year; before that it starts from the fresh state and is marked
 * provisional (`start: 'fresh'`).
 */
import { loadPlaceholderInputs } from '../data/placeholder';
import { SyntheticWeather, World, type StackRecord, type WorldInputs, type WorldState, type ZoneStats } from '../sim';

export { MAX_SEED } from '../sim';
export const FIRST_YEAR = 1995;
export const LAST_YEAR = 2025;

/** Where a single-year run started: the long run's state of 1 January, or the fresh state (provisional). */
export type StartState = 'long-run' | 'fresh';

/** Every request carries a generation id; a newer request of the same kind supersedes older ones. */
export interface YearRequest {
  readonly kind: 'year';
  readonly gen: number;
  readonly seed: number;
  readonly zone: string;
  readonly year: number;
  readonly extraSolarGw: number;
}

export interface SeriesRequest {
  readonly kind: 'series';
  readonly gen: number;
  readonly seed: number;
}

export interface CannibalRequest {
  readonly kind: 'cannibal';
  readonly gen: number;
  readonly seed: number;
  readonly zone: string;
  readonly year: number;
  readonly maxGw: number;
}

export type Request = YearRequest | SeriesRequest | CannibalRequest;
export type RequestKind = Request['kind'];

export interface LinkPayload {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly capacityMw: number;
  readonly flow: Float64Array;
  readonly congested: Uint8Array;
}

export interface ZoneYearPayload {
  readonly seed: number;
  readonly extraSolarGw: number;
  readonly start: StartState;
  readonly zone: string;
  readonly year: number;
  readonly hours: number;
  readonly marketOpenFromHour: number;
  readonly negativeFromHour: number;
  readonly priceFloor: number;
  readonly priceCap: number;
  readonly price: Float64Array;
  /** The computed hourly market price (differs from `price` only before the market opened). */
  readonly marginalPrice: Float64Array;
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
  readonly gen: number;
  readonly payload: ZoneYearPayload;
  readonly ms: number;
}

export interface SeriesYearResponse {
  readonly kind: 'seriesYear';
  readonly gen: number;
  readonly seed: number;
  readonly year: number;
  readonly stats: Readonly<Record<string, ZoneStats>>;
}

export interface SeriesDoneResponse {
  readonly kind: 'seriesDone';
  readonly gen: number;
  readonly seed: number;
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
  readonly gen: number;
  readonly seed: number;
  readonly zone: string;
  readonly year: number;
  readonly start: StartState;
  readonly points: readonly CannibalPoint[];
  readonly ms: number;
}

export interface ErrorResponse {
  readonly kind: 'error';
  readonly gen: number;
  readonly request: RequestKind;
  readonly message: string;
}

export type Response = YearResponse | SeriesYearResponse | SeriesDoneResponse | CannibalResponse | ErrorResponse;

let cachedInputs: WorldInputs | null = null;
let cachedWeather: SyntheticWeather | null = null;

function inputs(): WorldInputs {
  if (cachedInputs === null) cachedInputs = loadPlaceholderInputs();
  return cachedInputs;
}

function newWorld(seed: number): World {
  if (cachedWeather === null) cachedWeather = new SyntheticWeather(inputs());
  return new World(inputs(), cachedWeather, seed);
}

export function zoneIds(): readonly string[] {
  return inputs().zones.map((z) => z.id);
}

export function zoneName(id: string): string {
  return inputs().zones.find((z) => z.id === id)?.name ?? id;
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : 0);

// ---------------------------------------------------------------------------
// The long run of a seed, kept so that switching zone or year never reruns it.

interface LongRun {
  readonly seed: number;
  readonly world: World;
  /** Next year to simulate (LAST_YEAR + 1 when done). */
  next: number;
  readonly stats: Map<number, Readonly<Record<string, ZoneStats>>>;
  /** The world's state at 1 January of each year reached so far. */
  readonly states: Map<number, WorldState>;
  /** Milliseconds spent simulating. */
  ms: number;
}

/** Long runs kept in memory (most recently used last). */
const MAX_LONG_RUNS = 4;
const longRuns = new Map<number, LongRun>();

function longRun(seed: number): LongRun {
  let run = longRuns.get(seed);
  if (run === undefined) {
    const world = newWorld(seed);
    run = { seed, world, next: FIRST_YEAR, stats: new Map(), states: new Map([[FIRST_YEAR, world.snapshot()]]), ms: 0 };
    longRuns.set(seed, run);
    while (longRuns.size > MAX_LONG_RUNS) {
      const oldest = longRuns.keys().next().value;
      if (oldest === undefined) break;
      longRuns.delete(oldest);
    }
  } else {
    longRuns.delete(seed);
    longRuns.set(seed, run);
  }
  return run;
}

/** Simulate the long run's next year; returns that year's statistics for every zone. */
function stepLongRun(run: LongRun): { year: number; stats: Readonly<Record<string, ZoneStats>> } {
  const year = run.next;
  const t0 = now();
  const r = run.world.simulateYear(year);
  const stats: Record<string, ZoneStats> = {};
  for (const zid of r.zones) {
    const z = r.byZone[zid];
    if (z !== undefined) stats[zid] = z.stats;
  }
  run.stats.set(year, stats);
  run.next = year + 1;
  if (run.next <= LAST_YEAR) run.states.set(run.next, run.world.snapshot());
  run.ms += now() - t0;
  return { year, stats };
}

/** The long run's state at 1 January of `year`, if it has got that far (1995 always has). */
export function longRunState(seed: number, year: number): WorldState | null {
  if (year === FIRST_YEAR) return longRun(seed).states.get(FIRST_YEAR) ?? null;
  return longRuns.get(seed)?.states.get(year) ?? null;
}

/** Forget every cached long run (tests). */
export function clearLongRuns(): void {
  longRuns.clear();
}

/** A world for one year: the long run's 1 January state if known, plus the slider's solar. */
function yearWorld(seed: number, zone: string, year: number, extraSolarGw: number): { world: World; start: StartState } {
  if (!zoneIds().includes(zone)) throw new Error(`unknown zone ${zone}`);
  const world = newWorld(seed);
  const state = longRunState(seed, year);
  if (state !== null) world.restore(state);
  if (extraSolarGw > 0) world.addCapacity(zone, 'solar', extraSolarGw * 1000);
  return { world, start: state === null ? 'fresh' : 'long-run' };
}

/** One year of one zone, from the long run's state of 1 January when known. */
export function runYear(req: YearRequest): YearResponse {
  const t0 = now();
  const { world, start } = yearWorld(req.seed, req.zone, req.year, req.extraSolarGw);
  const r = world.simulateYear(req.year, { recordStacks: [req.zone] });
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
    seed: req.seed,
    extraSolarGw: req.extraSolarGw,
    start,
    zone: z.zone,
    year: z.year,
    hours: z.hours,
    marketOpenFromHour: z.marketOpenFromHour,
    negativeFromHour: z.negativeFromHour,
    priceFloor: z.priceFloor,
    priceCap: z.priceCap,
    price: z.price,
    marginalPrice: z.marginalPrice,
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
  return { kind: 'year', gen: req.gen, payload, ms: now() - t0 };
}

/**
 * The long run of a seed, year by year. Years already simulated are reported
 * at once; `shouldStop` is asked between simulated years, so a superseded run
 * stops early (and resumes where it left off the next time it is asked for).
 */
export function runSeries(
  req: SeriesRequest,
  onYear: (r: SeriesYearResponse) => void,
  shouldStop: () => boolean = () => false,
): SeriesDoneResponse | null {
  const run = longRun(req.seed);
  for (let year = FIRST_YEAR; year < run.next; year++) {
    const stats = run.stats.get(year);
    if (stats !== undefined) onYear({ kind: 'seriesYear', gen: req.gen, seed: req.seed, year, stats });
  }
  while (run.next <= LAST_YEAR) {
    if (shouldStop()) return null;
    const { year, stats } = stepLongRun(run);
    onYear({ kind: 'seriesYear', gen: req.gen, seed: req.seed, year, stats });
  }
  return { kind: 'seriesDone', gen: req.gen, seed: req.seed, ms: run.ms };
}

/** The share points of the solar curve. */
export const CANNIBAL_SHARES: readonly number[] = [0, 0.1, 0.25, 0.5, 0.75, 1];

/** Solar's earnings as more solar is added to the zone, for one year (from the same start as the year view). */
export function runCannibal(req: CannibalRequest, shouldStop: () => boolean = () => false): CannibalResponse | null {
  const t0 = now();
  const points: CannibalPoint[] = [];
  let start: StartState = 'fresh';
  for (const share of CANNIBAL_SHARES) {
    if (shouldStop()) return null;
    const gw = Math.round(req.maxGw * share * 10) / 10;
    const y = yearWorld(req.seed, req.zone, req.year, gw);
    start = y.start;
    const r = y.world.simulateYear(req.year);
    const z = r.byZone[req.zone];
    if (z === undefined) continue;
    const s = z.stats.byTech.solar;
    points.push({ gw, capturePrice: s.capturePrice, captureRate: s.captureRate, meanPrice: z.stats.meanPrice, solarTwh: s.generationTwh });
  }
  return { kind: 'cannibal', gen: req.gen, seed: req.seed, zone: req.zone, year: req.year, start, points, ms: now() - t0 };
}

/** Run one request to the end and post its answers (errors become error responses). */
export function handle(req: Request, post: (r: Response) => void): void {
  try {
    switch (req.kind) {
      case 'year':
        post(runYear(req));
        break;
      case 'series': {
        const done = runSeries(req, post);
        if (done !== null) post(done);
        break;
      }
      case 'cannibal': {
        const r = runCannibal(req);
        if (r !== null) post(r);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    post({ kind: 'error', gen: req.gen, request: req.kind, message: err instanceof Error ? err.message : String(err) });
  }
}
