/**
 * Input data: the shape the simulation needs, and a validator that turns the
 * raw JSON data files into it with clear errors. The simulation never reads
 * files itself; the caller loads the JSON and passes it in.
 *
 * Year-dependent values are "keyframes": `[[year, value], ...]`, sorted by
 * year, interpolated linearly between keyframes and held constant outside.
 */
import { type DateYMD, parseDate } from './calendar';

export type ZoneId = string;

export const TECHS = [
  'nuclear',
  'lignite',
  'coal',
  'gas_ccgt',
  'gas_ocgt',
  'oil',
  'biomass',
  'hydro_ror',
  'hydro_res',
  'pumped',
  'battery',
  'wind',
  'solar',
] as const;
export type TechId = (typeof TECHS)[number];

export const FUELS = ['coal', 'gas', 'oil', 'lignite', 'nuclear', 'biomass'] as const;
export type FuelId = (typeof FUELS)[number];

export type TechKind = 'thermal' | 'hydro_ror' | 'hydro_res' | 'storage' | 'variable';

export type Keyframes = readonly (readonly [number, number])[];

export interface DemandShapeInput {
  /** Winter-peak amplitude of the seasonal cosine (0.14 = ±14%). */
  readonly seasonalAmplitude: number;
  /** Extra summer hump for cooling load (Spain). */
  readonly summerBump: number;
  /** Weekend demand relative to a weekday. */
  readonly weekendFactor: number;
  /** Standard deviation of the seeded day-to-day noise (cold spells etc.). */
  readonly dailyNoise: number;
}

export interface WindInput {
  readonly meanCf: number;
  readonly seasonalAmplitude: number;
  readonly dailySigma: number;
  readonly hourlySigma: number;
  readonly yearSigma: number;
}

export interface SolarInput {
  readonly meanCf: number;
  /** How much cloudier winter is than summer (0 = no seasonal cloud cycle). */
  readonly cloudSeasonal: number;
  readonly yearSigma: number;
}

export interface HydroInput {
  readonly reservoirTwh: number;
  readonly inflowTwh: Keyframes;
  readonly initialFill: number;
  readonly minFill: number;
  /** Twelve monthly target fill levels (0..1) the water value is anchored to. */
  readonly targetFill: readonly number[];
  /** Twelve monthly inflow weights (mean about 1). */
  readonly inflowShape: readonly number[];
  readonly yearSigma: number;
  /** Water value = ref × exp(slope × (target − fill)). */
  readonly waterValueSlope: number;
  /** Multiplier on the reference price: the linked zones' trailing monthly price, or the cheapest thermal cost without links. */
  readonly waterValueRefFactor: number;
}

export interface ZoneInput {
  readonly id: ZoneId;
  readonly name: string;
  readonly latitude: number;
  readonly marketOpen: DateYMD;
  readonly negativePricesFrom: DateYMD;
  readonly priceFloor: number;
  readonly priceCap: number;
  readonly reserveFraction: number;
  readonly regulatedPrice: Keyframes;
  readonly demandTwh: Keyframes;
  readonly demandShape: DemandShapeInput;
  readonly wind: WindInput;
  readonly solar: SolarInput;
  readonly hydro: HydroInput | null;
}

export interface TechInput {
  readonly id: TechId;
  readonly kind: TechKind;
  readonly fuel: FuelId | null;
  readonly efficiency: Keyframes;
  /** tCO2 per MWh of fuel burnt. */
  readonly emissionFactor: number;
  readonly variableOm: number;
  readonly availability: number;
  readonly mustRunShare: number;
  readonly mustRunBid: number;
  /** Storage only: hours of energy at full power, and round-trip efficiency. */
  readonly storageHours: number;
  readonly roundTripEfficiency: number;
  /** Run-of-river only: mean capacity factor at an average inflow. */
  readonly meanCf: number;
  /** Must-run bid of run-of-river and forced hydro output. */
  readonly bid: number;
}

export interface LinkInput {
  readonly id: string;
  readonly from: ZoneId;
  readonly to: ZoneId;
  readonly capacityMw: Keyframes;
}

export interface SupportInput {
  readonly premiumPerMwh: Keyframes;
  /** Share of output that switches off at slightly negative prices. */
  readonly flexShare: Keyframes;
}

export interface WeatherParams {
  readonly zoneOrder: readonly ZoneId[];
  readonly windCorrelation: readonly (readonly number[])[];
  readonly solarCorrelation: readonly (readonly number[])[];
  readonly windSolarCorrelation: number;
  readonly windDailyPhi: number;
  readonly windHourlyPhi: number;
  readonly cloudDailyPhi: number;
  readonly inflowDailyPhi: number;
  readonly inflowDailySigma: number;
}

export interface WorldInputs {
  readonly status: string;
  /** First and last year the inputs cover; the simulation refuses years outside them. */
  readonly firstYear: number;
  readonly lastYear: number;
  readonly zones: readonly ZoneInput[];
  readonly technologies: ReadonlyMap<TechId, TechInput>;
  readonly fuels: ReadonlyMap<FuelId, Keyframes>;
  readonly co2: Keyframes;
  /** capacity[zone][tech] in MW. */
  readonly capacity: ReadonlyMap<ZoneId, ReadonlyMap<TechId, Keyframes>>;
  /** Per-zone overrides of a technology's must-run share (CHP-heavy fleets). */
  readonly mustRunOverrides: ReadonlyMap<ZoneId, ReadonlyMap<TechId, number>>;
  readonly links: readonly LinkInput[];
  readonly support: ReadonlyMap<ZoneId, ReadonlyMap<TechId, SupportInput>>;
  readonly weather: WeatherParams;
}

/** The raw JSON files, as loaded by the caller. */
export interface RawDataFiles {
  readonly zones: unknown;
  readonly technologies: unknown;
  readonly fuels: unknown;
  readonly capacity: unknown;
  readonly links: unknown;
  readonly support: unknown;
  readonly weather: unknown;
}

// ---------------------------------------------------------------------------
// Keyframes

/** Linear interpolation between keyframes, constant outside the range. */
export function interp(kf: Keyframes, year: number): number {
  const n = kf.length;
  if (n === 0) return 0;
  const first = kf[0];
  const last = kf[n - 1];
  if (first === undefined || last === undefined) return 0;
  if (year <= first[0]) return first[1];
  if (year >= last[0]) return last[1];
  for (let i = 1; i < n; i++) {
    const a = kf[i - 1];
    const b = kf[i];
    if (a === undefined || b === undefined) continue;
    if (year <= b[0]) {
      const t = (year - a[0]) / (b[0] - a[0]);
      return a[1] + t * (b[1] - a[1]);
    }
  }
  return last[1];
}

// ---------------------------------------------------------------------------
// Validation helpers

function fail(path: string, msg: string): never {
  throw new Error(`inputs: ${path}: ${msg}`);
}

function obj(x: unknown, path: string): Record<string, unknown> {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) fail(path, 'expected an object');
  return x as Record<string, unknown>;
}

function arr(x: unknown, path: string): unknown[] {
  if (!Array.isArray(x)) fail(path, 'expected an array');
  return x;
}

function num(x: unknown, path: string): number {
  if (typeof x !== 'number' || !Number.isFinite(x)) fail(path, 'expected a finite number');
  return x;
}

function str(x: unknown, path: string): string {
  if (typeof x !== 'string' || x.length === 0) fail(path, 'expected a non-empty string');
  return x;
}

function optNum(o: Record<string, unknown>, key: string, path: string, dflt: number): number {
  return o[key] === undefined ? dflt : num(o[key], `${path}.${key}`);
}

function keyframes(x: unknown, path: string): Keyframes {
  const a = arr(x, path);
  if (a.length === 0) fail(path, 'needs at least one keyframe');
  const out: [number, number][] = [];
  let prevYear = -Infinity;
  a.forEach((row, i) => {
    const r = arr(row, `${path}[${i}]`);
    if (r.length !== 2) fail(`${path}[${i}]`, 'expected [year, value]');
    const year = num(r[0], `${path}[${i}][0]`);
    const value = num(r[1], `${path}[${i}][1]`);
    if (year <= prevYear) fail(`${path}[${i}]`, 'years must be strictly increasing');
    prevYear = year;
    out.push([year, value]);
  });
  return out;
}

function numbers(x: unknown, path: string, length: number): number[] {
  const a = arr(x, path);
  if (a.length !== length) fail(path, `expected ${length} numbers`);
  return a.map((v, i) => num(v, `${path}[${i}]`));
}

function techId(s: string, path: string): TechId {
  if (!(TECHS as readonly string[]).includes(s)) fail(path, `unknown technology "${s}"`);
  return s as TechId;
}

function fuelId(s: string, path: string): FuelId {
  if (!(FUELS as readonly string[]).includes(s)) fail(path, `unknown fuel "${s}"`);
  return s as FuelId;
}

function requireStatus(o: Record<string, unknown>, path: string): string {
  const s = str(o['status'], `${path}.status`);
  return s;
}

// ---------------------------------------------------------------------------

function parseZone(x: unknown, path: string): ZoneInput {
  const o = obj(x, path);
  const shape = obj(o['demandShape'], `${path}.demandShape`);
  const wind = obj(o['wind'], `${path}.wind`);
  const solar = obj(o['solar'], `${path}.solar`);
  let hydro: HydroInput | null = null;
  if (o['hydro'] !== null && o['hydro'] !== undefined) {
    const h = obj(o['hydro'], `${path}.hydro`);
    hydro = {
      reservoirTwh: num(h['reservoirTwh'], `${path}.hydro.reservoirTwh`),
      inflowTwh: keyframes(h['inflowTwh'], `${path}.hydro.inflowTwh`),
      initialFill: num(h['initialFill'], `${path}.hydro.initialFill`),
      minFill: num(h['minFill'], `${path}.hydro.minFill`),
      targetFill: numbers(h['targetFill'], `${path}.hydro.targetFill`, 12),
      inflowShape: numbers(h['inflowShape'], `${path}.hydro.inflowShape`, 12),
      yearSigma: num(h['yearSigma'], `${path}.hydro.yearSigma`),
      waterValueSlope: num(h['waterValueSlope'], `${path}.hydro.waterValueSlope`),
      waterValueRefFactor: num(h['waterValueRefFactor'], `${path}.hydro.waterValueRefFactor`),
    };
  }
  const floor = num(o['priceFloor'], `${path}.priceFloor`);
  const cap = num(o['priceCap'], `${path}.priceCap`);
  if (floor >= 0 || cap <= 0) fail(path, 'priceFloor must be negative and priceCap positive');
  return {
    id: str(o['id'], `${path}.id`),
    name: str(o['name'], `${path}.name`),
    latitude: num(o['latitude'], `${path}.latitude`),
    marketOpen: parseDate(str(o['marketOpen'], `${path}.marketOpen`)),
    negativePricesFrom: parseDate(str(o['negativePricesFrom'], `${path}.negativePricesFrom`)),
    priceFloor: floor,
    priceCap: cap,
    reserveFraction: num(o['reserveFraction'], `${path}.reserveFraction`),
    regulatedPrice: keyframes(o['regulatedPrice'], `${path}.regulatedPrice`),
    demandTwh: keyframes(o['demandTwh'], `${path}.demandTwh`),
    demandShape: {
      seasonalAmplitude: num(shape['seasonalAmplitude'], `${path}.demandShape.seasonalAmplitude`),
      summerBump: num(shape['summerBump'], `${path}.demandShape.summerBump`),
      weekendFactor: num(shape['weekendFactor'], `${path}.demandShape.weekendFactor`),
      dailyNoise: num(shape['dailyNoise'], `${path}.demandShape.dailyNoise`),
    },
    wind: {
      meanCf: num(wind['meanCf'], `${path}.wind.meanCf`),
      seasonalAmplitude: num(wind['seasonalAmplitude'], `${path}.wind.seasonalAmplitude`),
      dailySigma: num(wind['dailySigma'], `${path}.wind.dailySigma`),
      hourlySigma: num(wind['hourlySigma'], `${path}.wind.hourlySigma`),
      yearSigma: num(wind['yearSigma'], `${path}.wind.yearSigma`),
    },
    solar: {
      meanCf: num(solar['meanCf'], `${path}.solar.meanCf`),
      cloudSeasonal: num(solar['cloudSeasonal'], `${path}.solar.cloudSeasonal`),
      yearSigma: num(solar['yearSigma'], `${path}.solar.yearSigma`),
    },
    hydro,
  };
}

function parseTech(x: unknown, path: string): TechInput {
  const o = obj(x, path);
  const id = techId(str(o['id'], `${path}.id`), `${path}.id`);
  const kind = str(o['kind'], `${path}.kind`);
  if (!['thermal', 'hydro_ror', 'hydro_res', 'storage', 'variable'].includes(kind)) {
    fail(`${path}.kind`, `unknown kind "${kind}"`);
  }
  const fuel = o['fuel'] === undefined || o['fuel'] === null ? null : fuelId(str(o['fuel'], `${path}.fuel`), `${path}.fuel`);
  if (kind === 'thermal' && fuel === null) fail(path, 'thermal technologies need a fuel');
  const t: TechInput = {
    id,
    kind: kind as TechKind,
    fuel,
    efficiency: o['efficiency'] === undefined ? [[1995, 1]] : keyframes(o['efficiency'], `${path}.efficiency`),
    emissionFactor: optNum(o, 'emissionFactor', path, 0),
    variableOm: optNum(o, 'variableOm', path, 0),
    availability: optNum(o, 'availability', path, 1),
    mustRunShare: optNum(o, 'mustRunShare', path, 0),
    mustRunBid: optNum(o, 'mustRunBid', path, 0),
    storageHours: optNum(o, 'hours', path, 0),
    roundTripEfficiency: optNum(o, 'roundTripEfficiency', path, 1),
    meanCf: optNum(o, 'meanCf', path, 0),
    bid: optNum(o, 'bid', path, 0),
  };
  if (kind === 'storage' && (t.storageHours <= 0 || t.roundTripEfficiency <= 0 || t.roundTripEfficiency > 1)) {
    fail(path, 'storage needs hours > 0 and 0 < roundTripEfficiency <= 1');
  }
  if (t.mustRunShare < 0 || t.mustRunShare > 1) fail(path, 'mustRunShare must be within 0..1');
  return t;
}

/** Validate the raw data files and assemble the simulation inputs. */
export function validateInputs(raw: RawDataFiles): WorldInputs {
  const zonesFile = obj(raw.zones, 'zones');
  const status = requireStatus(zonesFile, 'zones');
  const years = numbers(zonesFile['years'], 'zones.years', 2);
  const [firstYear = NaN, lastYear = NaN] = years;
  if (!Number.isInteger(firstYear) || !Number.isInteger(lastYear) || firstYear > lastYear) {
    fail('zones.years', 'expected [first, last] as integers with first ≤ last');
  }
  const zones = arr(zonesFile['zones'], 'zones.zones').map((z, i) => parseZone(z, `zones.zones[${i}]`));
  if (zones.length === 0) fail('zones.zones', 'no zones');
  const zoneIds = new Set(zones.map((z) => z.id));
  if (zoneIds.size !== zones.length) fail('zones.zones', 'duplicate zone ids');

  const techFile = obj(raw.technologies, 'technologies');
  requireStatus(techFile, 'technologies');
  const technologies = new Map<TechId, TechInput>();
  arr(techFile['technologies'], 'technologies.technologies').forEach((t, i) => {
    const tech = parseTech(t, `technologies.technologies[${i}]`);
    if (technologies.has(tech.id)) fail(`technologies.technologies[${i}]`, `duplicate "${tech.id}"`);
    technologies.set(tech.id, tech);
  });
  for (const id of TECHS) if (!technologies.has(id)) fail('technologies', `missing technology "${id}"`);

  const fuelsFile = obj(raw.fuels, 'fuels');
  requireStatus(fuelsFile, 'fuels');
  const fuelsObj = obj(fuelsFile['fuels'], 'fuels.fuels');
  const fuels = new Map<FuelId, Keyframes>();
  for (const f of FUELS) fuels.set(f, keyframes(fuelsObj[f], `fuels.fuels.${f}`));
  const co2 = keyframes(fuelsFile['co2'], 'fuels.co2');

  const capFile = obj(raw.capacity, 'capacity');
  requireStatus(capFile, 'capacity');
  const capObj = obj(capFile['capacity'], 'capacity.capacity');
  const capacity = new Map<ZoneId, Map<TechId, Keyframes>>();
  for (const z of zones) {
    const perZone = new Map<TechId, Keyframes>();
    const zc = capObj[z.id];
    if (zc !== undefined) {
      const zo = obj(zc, `capacity.capacity.${z.id}`);
      for (const [k, v] of Object.entries(zo)) {
        const tid = techId(k, `capacity.capacity.${z.id}.${k}`);
        perZone.set(tid, keyframes(v, `capacity.capacity.${z.id}.${k}`));
      }
    }
    capacity.set(z.id, perZone);
  }
  for (const k of Object.keys(capObj)) if (!zoneIds.has(k)) fail(`capacity.capacity.${k}`, 'unknown zone');
  const mustRunOverrides = new Map<ZoneId, Map<TechId, number>>();
  if (capFile['mustRunOverrides'] !== undefined) {
    const ov = obj(capFile['mustRunOverrides'], 'capacity.mustRunOverrides');
    for (const [zid, techs] of Object.entries(ov)) {
      if (!zoneIds.has(zid)) fail(`capacity.mustRunOverrides.${zid}`, 'unknown zone');
      const m = new Map<TechId, number>();
      for (const [k, v] of Object.entries(obj(techs, `capacity.mustRunOverrides.${zid}`))) {
        m.set(techId(k, `capacity.mustRunOverrides.${zid}.${k}`), num(v, `capacity.mustRunOverrides.${zid}.${k}`));
      }
      mustRunOverrides.set(zid, m);
    }
  }

  const linksFile = obj(raw.links, 'links');
  requireStatus(linksFile, 'links');
  const links: LinkInput[] = arr(linksFile['links'], 'links.links').map((l, i) => {
    const o = obj(l, `links.links[${i}]`);
    const from = str(o['from'], `links.links[${i}].from`);
    const to = str(o['to'], `links.links[${i}].to`);
    if (!zoneIds.has(from) || !zoneIds.has(to)) fail(`links.links[${i}]`, 'link endpoint is not a zone');
    if (from === to) fail(`links.links[${i}]`, 'link joins a zone to itself');
    return { id: str(o['id'], `links.links[${i}].id`), from, to, capacityMw: keyframes(o['capacityMw'], `links.links[${i}].capacityMw`) };
  });

  const supportFile = obj(raw.support, 'support');
  requireStatus(supportFile, 'support');
  const supportObj = obj(supportFile['support'], 'support.support');
  const support = new Map<ZoneId, Map<TechId, SupportInput>>();
  for (const [zid, techs] of Object.entries(supportObj)) {
    if (!zoneIds.has(zid)) fail(`support.support.${zid}`, 'unknown zone');
    const m = new Map<TechId, SupportInput>();
    for (const [k, v] of Object.entries(obj(techs, `support.support.${zid}`))) {
      const p = `support.support.${zid}.${k}`;
      const so = obj(v, p);
      m.set(techId(k, p), {
        premiumPerMwh: keyframes(so['premiumPerMwh'], `${p}.premiumPerMwh`),
        flexShare: keyframes(so['flexShare'], `${p}.flexShare`),
      });
    }
    support.set(zid, m);
  }

  const wf = obj(raw.weather, 'weather');
  requireStatus(wf, 'weather');
  const zoneOrder = arr(wf['zoneOrder'], 'weather.zoneOrder').map((z, i) => str(z, `weather.zoneOrder[${i}]`));
  for (const z of zones) if (!zoneOrder.includes(z.id)) fail('weather.zoneOrder', `missing zone "${z.id}"`);
  const n = zoneOrder.length;
  const matrix = (x: unknown, path: string): number[][] => {
    const rows = arr(x, path);
    if (rows.length !== n) fail(path, `expected ${n} rows`);
    const m = rows.map((r, i) => numbers(r, `${path}[${i}]`, n));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const a = m[i]?.[j] ?? NaN;
        const b = m[j]?.[i] ?? NaN;
        if (Math.abs(a - b) > 1e-12) fail(path, 'matrix must be symmetric');
        if (i === j && Math.abs(a - 1) > 1e-12) fail(path, 'diagonal must be 1');
      }
    }
    return m;
  };
  const weather: WeatherParams = {
    zoneOrder,
    windCorrelation: matrix(wf['windCorrelation'], 'weather.windCorrelation'),
    solarCorrelation: matrix(wf['solarCorrelation'], 'weather.solarCorrelation'),
    windSolarCorrelation: num(wf['windSolarCorrelation'], 'weather.windSolarCorrelation'),
    windDailyPhi: num(wf['windDailyPhi'], 'weather.windDailyPhi'),
    windHourlyPhi: num(wf['windHourlyPhi'], 'weather.windHourlyPhi'),
    cloudDailyPhi: num(wf['cloudDailyPhi'], 'weather.cloudDailyPhi'),
    inflowDailyPhi: num(wf['inflowDailyPhi'], 'weather.inflowDailyPhi'),
    inflowDailySigma: num(wf['inflowDailySigma'], 'weather.inflowDailySigma'),
  };

  return { status, firstYear, lastYear, zones, technologies, fuels, co2, capacity, mustRunOverrides, links, support, weather };
}
