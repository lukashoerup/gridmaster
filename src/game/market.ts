/**
 * The market the game plays in: Western Denmark (DK1) with its two
 * neighbours, Germany and Norway, as the Phase 1 core computes them
 * (design §4.1). The game asks for one calendar year at a time, with the
 * player's assets added to DK1's supply stack, and reads back what it needs:
 * DK1's hourly prices and its weather.
 */
import {
  SyntheticWeather,
  World,
  type TechId,
  type WeatherSource,
  type WeatherYear,
  type WorldInputs,
  type YearResult,
  type ZoneId,
} from '../sim';

export const ZONE: ZoneId = 'DK1';
const KEEP: readonly ZoneId[] = ['DK1', 'DE', 'NO'];

/** The inputs reduced to DK1 and its neighbours: Spain has no link, and dropping it saves a quarter of the time. */
export function prototypeInputs(full: WorldInputs): WorldInputs {
  const keep = new Set(KEEP.filter((z) => full.zones.some((zz) => zz.id === z)));
  if (!keep.has(ZONE)) throw new Error(`the inputs have no ${ZONE} zone`);
  const filterMap = <V>(m: ReadonlyMap<ZoneId, V>): Map<ZoneId, V> => new Map([...m].filter(([k]) => keep.has(k)));
  const idx = full.weather.zoneOrder.map((z, i) => (keep.has(z) ? i : -1)).filter((i) => i >= 0);
  const sub = (m: readonly (readonly number[])[]): number[][] => idx.map((i) => idx.map((j) => m[i]?.[j] ?? 0));
  return {
    ...full,
    zones: full.zones.filter((z) => keep.has(z.id)),
    capacity: filterMap(full.capacity),
    mustRunOverrides: filterMap(full.mustRunOverrides),
    links: full.links.filter((l) => keep.has(l.from) && keep.has(l.to)),
    support: filterMap(full.support),
    weather: {
      ...full.weather,
      zoneOrder: idx.map((i) => full.weather.zoneOrder[i] ?? ''),
      windCorrelation: sub(full.weather.windCorrelation),
      solarCorrelation: sub(full.weather.solarCorrelation),
    },
  };
}

/** Remembers the last weather-years, so the game reads exactly the weather the market was cleared with. */
class MemoWeather implements WeatherSource {
  readonly name: string;
  private readonly memo = new Map<string, WeatherYear>();

  constructor(private readonly base: WeatherSource) {
    this.name = base.name;
  }

  year(seed: number, year: number): WeatherYear {
    const key = `${seed}/${year}`;
    let w = this.memo.get(key);
    if (w === undefined) {
      w = this.base.year(seed, year);
      this.memo.set(key, w);
      while (this.memo.size > 2) {
        const first = this.memo.keys().next().value;
        if (first === undefined) break;
        this.memo.delete(first);
      }
    }
    return w;
  }
}

/** The player's assets as extra DK1 capacity for one year, scaled to their energy (see `playerCapacity`). */
export interface PlayerCapacity {
  readonly windMw: number;
  readonly solarMw: number;
}

export interface MarketSummary {
  /** Time-weighted mean of the hourly market price over the whole year, €/MWh. */
  readonly meanPrice: number;
  /** What DK1's wind and solar fleets earned per MWh at market prices, and as a share of the mean. */
  readonly windCapturePrice: number | null;
  readonly windCaptureRate: number | null;
  readonly solarCapturePrice: number | null;
  readonly solarCaptureRate: number | null;
  /** DK1's installed wind and solar, MW, including the player's additions. */
  readonly windMw: number;
  readonly solarMw: number;
  /** DK1's generation (storage excluded) and demand, MWh. */
  readonly generationMwh: number;
  readonly demandMwh: number;
  readonly negativeHours: number;
  readonly maxPrice: number;
  readonly minPrice: number;
}

export interface MarketYear {
  readonly year: number;
  readonly hours: number;
  readonly marketOpenFromHour: number;
  readonly negativeFromHour: number;
  /** What a seller gets: the regulated price before the market opens, the hourly market price after. */
  readonly price: Float64Array;
  /** The computed hourly market price, also before the opening. */
  readonly marketPrice: Float64Array;
  /** DK1's fleet-average wind and solar capacity factors, per hour. */
  readonly windCf: Float64Array;
  readonly solarCf: Float64Array;
  /** The zone's mean capacity factors in the inputs, which an asset's own factor is scaled against. */
  readonly zoneWindMeanCf: number;
  readonly zoneSolarMeanCf: number;
  readonly added: PlayerCapacity;
  readonly summary: MarketSummary;
}

function capture(gen: Float64Array | undefined, price: Float64Array, mean: number): [number | null, number | null] {
  if (gen === undefined) return [null, null];
  let g = 0;
  let r = 0;
  for (let h = 0; h < price.length; h++) {
    const v = gen[h] ?? 0;
    g += v;
    r += v * (price[h] ?? 0);
  }
  if (g <= 1e-9) return [null, null];
  const p = r / g;
  return [p, Math.abs(mean) > 1e-9 ? p / mean : null];
}

const NOT_GENERATION: readonly string[] = ['battery', 'pumped'];

export function marketYearFrom(result: YearResult, weather: WeatherYear, inputs: WorldInputs, added: PlayerCapacity): MarketYear {
  const z = result.byZone[ZONE];
  const zin = inputs.zones.find((zz) => zz.id === ZONE);
  if (z === undefined || zin === undefined) throw new Error(`no ${ZONE} in the result`);
  const windCf = weather.wind[ZONE];
  const solarCf = weather.solar[ZONE];
  if (windCf === undefined || solarCf === undefined) throw new Error(`no ${ZONE} weather`);
  const mp = z.marginalPrice;
  let sum = 0;
  let negative = 0;
  let max = -Infinity;
  let min = Infinity;
  for (let h = 0; h < z.hours; h++) {
    const p = mp[h] ?? 0;
    sum += p;
    if (p < 0) negative++;
    if (p > max) max = p;
    if (p < min) min = p;
  }
  const mean = z.hours > 0 ? sum / z.hours : 0;
  const [windCapturePrice, windCaptureRate] = capture(z.generation['wind'], mp, mean);
  const [solarCapturePrice, solarCaptureRate] = capture(z.generation['solar'], mp, mean);
  let generationMwh = 0;
  for (const [t, g] of Object.entries(z.generation)) {
    if (NOT_GENERATION.includes(t)) continue;
    for (let h = 0; h < z.hours; h++) generationMwh += g[h] ?? 0;
  }
  return {
    year: result.year,
    hours: z.hours,
    marketOpenFromHour: z.marketOpenFromHour,
    negativeFromHour: z.negativeFromHour,
    price: z.price,
    marketPrice: mp,
    windCf,
    solarCf,
    zoneWindMeanCf: zin.wind.meanCf,
    zoneSolarMeanCf: zin.solar.meanCf,
    added,
    summary: {
      meanPrice: mean,
      windCapturePrice,
      windCaptureRate,
      solarCapturePrice,
      solarCaptureRate,
      windMw: z.capacityMw['wind'] ?? 0,
      solarMw: z.capacityMw['solar'] ?? 0,
      generationMwh,
      demandMwh: z.stats.demandTwh * 1e6,
      negativeHours: negative,
      maxPrice: max,
      minPrice: min,
    },
  };
}

/**
 * One run's market: a World over DK1 and its neighbours. Years must be asked
 * for in order, because reservoirs, storage and price history carry over.
 */
export class MarketProvider {
  readonly inputs: WorldInputs;
  readonly seed: number;
  private readonly weather: MemoWeather;
  private readonly world: World;
  private lastYear: number | null = null;

  constructor(fullInputs: WorldInputs, seed: number) {
    this.inputs = prototypeInputs(fullInputs);
    this.seed = seed >>> 0;
    this.weather = new MemoWeather(new SyntheticWeather(this.inputs));
    this.world = new World(this.inputs, this.weather, this.seed);
  }

  /** The year after the last one simulated (or null before the first). */
  get nextYear(): number | null {
    return this.lastYear === null ? null : this.lastYear + 1;
  }

  simulate(year: number, added: PlayerCapacity): MarketYear {
    if (this.lastYear !== null && year !== this.lastYear + 1) {
      throw new Error(`market years must run in order: asked for ${year} after ${this.lastYear}`);
    }
    this.world.clearAdditions();
    const add = (tech: TechId, mw: number): void => {
      if (mw > 0) this.world.addCapacity(ZONE, tech, mw, year);
    };
    add('wind', added.windMw);
    add('solar', added.solarMw);
    const result = this.world.simulateYear(year);
    this.lastYear = year;
    return marketYearFrom(result, this.weather.year(this.seed, year), this.inputs, added);
  }
}
