/**
 * The national market behind the hubs: the Phase 1 merit-order core over
 * Western Denmark and its two neighbours, on placeholder data, used as is
 * (D18). The toy adds three things around it, none inside `src/sim`:
 * - **weather moods**: a calm winter or a storm year, drawn per year from the
 *   seed, applied to the weather the core clears with, so the national price
 *   feels them too;
 * - **"the market opens"**: before a random hour in 1998–2001 the national
 *   price is a flat tariff [tuning]; after it, the core's hourly price;
 * - **the player's plants** enter Western Denmark's supply at each
 *   1 January, so the national price reacts to the player's build-out as well
 *   as everyone else's (the core's placeholder capacity path).
 */
import {
  SyntheticWeather,
  World,
  annualPath,
  hoursInYear,
  monthOfDay,
  type WeatherSource,
  type WeatherYear,
  type WorldInputs,
  type ZoneId,
} from '../../sim';
import { rngFor } from './random';
import { MARKET_OPENS_FROM, MARKET_OPENS_TO, TARIFF, WEATHER } from './tuning';

export const ZONE: ZoneId = 'DK1';
const KEEP: readonly ZoneId[] = ['DK1', 'DE', 'NO'];

export type WeatherMood = 'normal' | 'calm winter' | 'storm year';

/** The inputs reduced to DK1 and its neighbours (Spain has no link; dropping it saves time). */
export function toyInputs(full: WorldInputs): WorldInputs {
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

/** The weather mood of a year, from the seed alone. */
export function weatherMood(seed: number, year: number): WeatherMood {
  const u = rngFor(seed, 'toy-weather-mood', year).next();
  if (u < WEATHER.calmWinterChance) return 'calm winter';
  if (u < WEATHER.calmWinterChance + WEATHER.stormYearChance) return 'storm year';
  return 'normal';
}

/** The core's synthetic weather with the year's mood applied, remembered so the toy reads exactly what the market cleared with. */
export class MoodWeather implements WeatherSource {
  readonly name: string;
  private readonly memo = new Map<string, WeatherYear>();

  constructor(private readonly base: WeatherSource) {
    this.name = `${base.name} + moods`;
  }

  year(seed: number, year: number): WeatherYear {
    const key = `${seed}/${year}`;
    const hit = this.memo.get(key);
    if (hit !== undefined) return hit;
    const w = applyMood(this.base.year(seed, year), weatherMood(seed, year));
    this.memo.set(key, w);
    while (this.memo.size > 2) {
      const first = this.memo.keys().next().value;
      if (first === undefined) break;
      this.memo.delete(first);
    }
    return w;
  }
}

function applyMood(w: WeatherYear, mood: WeatherMood): WeatherYear {
  if (mood === 'normal') return w;
  const wind: Record<ZoneId, Float64Array> = {};
  for (const [zone, cf] of Object.entries(w.wind)) {
    const out = new Float64Array(cf.length);
    for (let h = 0; h < cf.length; h++) {
      const v = cf[h] ?? 0;
      if (mood === 'storm year') out[h] = Math.min(1, v * WEATHER.stormFactor);
      else {
        const m = monthOfDay(w.year, Math.floor(h / 24));
        out[h] = m <= 2 || m === 12 ? v * WEATHER.calmWinterFactor : v;
      }
    }
    wind[zone] = out;
  }
  return { ...w, wind };
}

/** The hour (absolute, from 1 January of `startYear`) when the market opens, drawn from the seed. */
export function marketOpensAt(seed: number, startYear: number): number {
  let total = 0;
  for (let y = MARKET_OPENS_FROM; y <= MARKET_OPENS_TO; y++) total += hoursInYear(y);
  // Whole days, opening at midnight.
  const day = Math.floor(rngFor(seed, 'toy-market-opens').next() * (total / 24));
  let before = 0;
  for (let y = startYear; y < MARKET_OPENS_FROM; y++) before += hoursInYear(y);
  return before + day * 24;
}

/** What the hubs need from the national market for one year. */
export interface NationalYear {
  readonly year: number;
  readonly hours: number;
  readonly mood: WeatherMood;
  /** The national price a seller sees: the tariff before the opening, the hourly market after (€/MWh). */
  readonly price: Float64Array;
  /** Western Denmark's wind and solar capacity factors, per hour (mood applied). */
  readonly windCf: Float64Array;
  readonly solarCf: Float64Array;
  /** Western Denmark's demand per hour, divided by its yearly mean (the shape towns follow). */
  readonly demandShape: Float64Array;
  /** Western Denmark's wind fleet, MW, from the placeholder path (drives "everyone else" at the hubs). */
  readonly nationalWindMw: number;
  readonly tariff: number;
  readonly meanCfWind: number;
  readonly meanCfSolar: number;
}

export interface PlayerAdded {
  readonly windMw: number;
  readonly solarMw: number;
}

/**
 * One run's national market. Years must be asked for in order, because the
 * core carries reservoirs, storage and price history across years.
 */
export class NationalMarket {
  readonly inputs: WorldInputs;
  readonly seed: number;
  readonly startYear: number;
  readonly opensAt: number;
  private readonly weather: MoodWeather;
  private readonly world: World;
  private lastYear: number | null = null;

  constructor(fullInputs: WorldInputs, seed: number, startYear: number) {
    this.inputs = toyInputs(fullInputs);
    this.seed = seed >>> 0;
    this.startYear = startYear;
    this.opensAt = marketOpensAt(this.seed, startYear);
    this.weather = new MoodWeather(new SyntheticWeather(this.inputs));
    this.world = new World(this.inputs, this.weather, this.seed);
  }

  /** Absolute hour of 1 January of `year`, counted from 1 January of the start year. */
  yearStartHour(year: number): number {
    let h = 0;
    for (let y = this.startYear; y < year; y++) h += hoursInYear(y);
    return h;
  }

  simulate(year: number, added: PlayerAdded): NationalYear {
    if (this.lastYear !== null && year !== this.lastYear + 1) {
      throw new Error(`national years must run in order: asked for ${year} after ${this.lastYear}`);
    }
    this.world.clearAdditions();
    if (added.windMw > 0) this.world.addCapacity(ZONE, 'wind', added.windMw, year);
    if (added.solarMw > 0) this.world.addCapacity(ZONE, 'solar', added.solarMw, year);
    const result = this.world.simulateYear(year);
    this.lastYear = year;
    const z = result.byZone[ZONE];
    const zin = this.inputs.zones.find((zz) => zz.id === ZONE);
    const w = this.weather.year(this.seed, year);
    const windCf = w.wind[ZONE];
    const solarCf = w.solar[ZONE];
    if (z === undefined || zin === undefined || windCf === undefined || solarCf === undefined) throw new Error(`no ${ZONE} in the result`);
    const hours = z.hours;
    const tariff = TARIFF;
    const start = this.yearStartHour(year);
    const price = new Float64Array(hours);
    for (let h = 0; h < hours; h++) price[h] = start + h < this.opensAt ? tariff : (z.marginalPrice[h] ?? 0);
    let dSum = 0;
    for (let h = 0; h < hours; h++) dSum += z.demand[h] ?? 0;
    const dMean = dSum / Math.max(1, hours);
    const demandShape = new Float64Array(hours);
    for (let h = 0; h < hours; h++) demandShape[h] = (z.demand[h] ?? dMean) / dMean;
    const windPath = this.inputs.capacity.get(ZONE)?.get('wind');
    return {
      year,
      hours,
      mood: weatherMood(this.seed, year),
      price,
      windCf,
      solarCf,
      demandShape,
      nationalWindMw: windPath === undefined ? 0 : annualPath(windPath, year, 0.5),
      tariff,
      meanCfWind: zin.wind.meanCf,
      meanCfSolar: zin.solar.meanCf,
    };
  }
}
