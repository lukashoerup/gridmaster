/**
 * The world: inputs + weather source + seed, simulated one year at a time on
 * a fixed timestep of one hour. State that carries across years (reservoir
 * levels, storage state of charge, the rolling price windows storage uses)
 * lives here; `reset()` returns it to the starting point.
 */
import { hourFromDate, hoursInYear, monthOfDay } from './calendar';
import { demandSeries } from './demand';
import { Hasher } from './hash';
import { TECHS, interp, type Keyframes, type TechId, type WorldInputs, type ZoneId } from './inputs';
import { ClearingEngine, TRANCHE, type LinkSpec } from './market';
import { zoneStats, type ZoneStats } from './stats';
import type { WeatherSource, WeatherYear } from './weather';

export interface CapacityAddition {
  readonly zone: ZoneId;
  readonly tech: TechId;
  readonly mw: number;
  /** First year the capacity exists. */
  readonly fromYear: number;
}

export interface SimulateOptions {
  /** Record every hour's supply stack for these zones (for a merit-order view). */
  readonly recordStacks?: readonly ZoneId[];
}

/** One zone's supply stacks for a year, packed: blocks of hour h are offsets[h] … offsets[h+1]. */
export interface StackRecord {
  readonly offsets: Int32Array;
  readonly tech: Int8Array;
  readonly tranche: Int8Array;
  /** Effective bid (after the scarcity adder), €/MWh. */
  readonly bid: Float32Array;
  readonly mw: Float32Array;
  readonly dispatched: Float32Array;
}

export interface ZoneYear {
  readonly zone: ZoneId;
  readonly year: number;
  readonly hours: number;
  /** First hour with the hourly market open (`hours` if it never opens that year). */
  readonly marketOpenFromHour: number;
  /** First hour in which negative prices are allowed (`hours` if never). */
  readonly negativeFromHour: number;
  readonly priceFloor: number;
  readonly priceCap: number;
  /** The price a participant sees: regulated tariff before the market opens, market price after. */
  readonly price: Float64Array;
  /** The computed hourly market price, also before the opening date. */
  readonly marginalPrice: Float64Array;
  readonly demand: Float64Array;
  /** Dispatched MW per technology present in the zone (storage: discharge). */
  readonly generation: Readonly<Record<string, Float64Array>>;
  /** Charging MW per storage technology. */
  readonly charging: Readonly<Record<string, Float64Array>>;
  /** State of charge in MWh per storage technology, end of hour. */
  readonly stateOfCharge: Readonly<Record<string, Float64Array>>;
  /** Available (pre-curtailment) MW for wind and solar. */
  readonly available: Readonly<Record<string, Float64Array>>;
  readonly reservoirMwh: Float64Array | null;
  readonly inflowMw: Float64Array | null;
  readonly spillMw: Float64Array | null;
  readonly unserved: Float64Array;
  /** Scarcity measure s in 0..1 (0 = comfortable margin, 1 = no spare capacity). */
  readonly scarcity: Float64Array;
  /** Net export MW (positive = exporting). */
  readonly netExport: Float64Array;
  readonly capacityMw: Readonly<Record<string, number>>;
  readonly stacks: StackRecord | null;
  readonly stats: ZoneStats;
}

export interface LinkYear {
  readonly id: string;
  readonly from: ZoneId;
  readonly to: ZoneId;
  readonly capacityMw: number;
  /** Flow MW, positive from `from` to `to`. */
  readonly flow: Float64Array;
  /**
   * 1 where the clearing held the link at a fixed flow (its capacity, or less
   * when the importer could not absorb more) and the two zones' prices differ.
   */
  readonly congested: Uint8Array;
  readonly congestedHours: number;
}

export interface YearResult {
  readonly year: number;
  readonly hours: number;
  readonly seed: number;
  readonly zones: readonly ZoneId[];
  readonly byZone: Readonly<Record<ZoneId, ZoneYear>>;
  readonly links: readonly LinkYear[];
  /** Diagnostic: hours × links where a congested link flowed from the dearer zone. */
  readonly wrongWayLinkHours: number;
}

/** Rolling window of recent prices with cheap percentile lookup. */
class PriceWindow {
  private readonly ring: Float64Array;
  private readonly sorted: number[] = [];
  private head = 0;
  private count = 0;

  constructor(private readonly size: number) {
    this.ring = new Float64Array(size);
  }

  get length(): number {
    return this.count;
  }

  push(p: number): void {
    if (this.count === this.size) {
      const old = this.ring[this.head] ?? 0;
      const idx = this.indexOf(old);
      if (idx >= 0) this.sorted.splice(idx, 1);
      this.ring[this.head] = p;
      this.head = (this.head + 1) % this.size;
    } else {
      this.ring[(this.head + this.count) % this.size] = p;
      this.count++;
    }
    let lo = 0;
    let hi = this.sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((this.sorted[mid] ?? 0) < p) lo = mid + 1;
      else hi = mid;
    }
    this.sorted.splice(lo, 0, p);
  }

  private indexOf(v: number): number {
    let lo = 0;
    let hi = this.sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((this.sorted[mid] ?? 0) < v) lo = mid + 1;
      else hi = mid;
    }
    return this.sorted[lo] === v ? lo : this.sorted.indexOf(v);
  }

  percentile(q: number): number {
    if (this.count === 0) return 0;
    const idx = Math.min(this.count - 1, Math.max(0, Math.round(q * (this.count - 1))));
    return this.sorted[idx] ?? 0;
  }

  reset(): void {
    this.sorted.length = 0;
    this.head = 0;
    this.count = 0;
  }
}

/** Running mean over a fixed window of hours. */
class RollingMean {
  private readonly ring: Float64Array;
  private head = 0;
  private count = 0;
  private sum = 0;

  constructor(private readonly size: number) {
    this.ring = new Float64Array(size);
  }

  get length(): number {
    return this.count;
  }

  push(v: number): void {
    if (this.count === this.size) {
      this.sum -= this.ring[this.head] ?? 0;
      this.ring[this.head] = v;
      this.head = (this.head + 1) % this.size;
    } else {
      this.ring[(this.head + this.count) % this.size] = v;
      this.count++;
    }
    this.sum += v;
  }

  mean(): number {
    return this.count > 0 ? this.sum / this.count : 0;
  }

  reset(): void {
    this.head = 0;
    this.count = 0;
    this.sum = 0;
  }
}

/** Hours of neighbour-price history a reservoir's water value is anchored to (about a month). */
const WATER_VALUE_WINDOW_HOURS = 720;
/** Hours of history needed before the neighbour anchor replaces the thermal one. */
const WATER_VALUE_WARMUP_HOURS = 168;

/** Hours of price history storage looks back on for its charge/discharge thresholds. */
const STORAGE_WINDOW_HOURS = 168;
/** Storage needs this many hours of history before it starts trading. */
const STORAGE_WARMUP_HOURS = 24;
/** Minimum spread (€/MWh) storage insists on between buying and selling. */
const STORAGE_MIN_SPREAD = 2;

const TECH_INDEX = new Map<TechId, number>(TECHS.map((t, i) => [t, i]));

/**
 * An annual value for a month of the year: the year's value, blended towards
 * the previous year in January–February and the next in November–December,
 * so the annual mean is nearly preserved while New Year is not a step.
 */
function blendAnnual(kf: Keyframes, year: number, month?: number): number {
  const v = interp(kf, year);
  if (month === undefined) return v;
  if (month === 1) return 0.75 * v + 0.25 * interp(kf, year - 1);
  if (month === 2) return 0.9 * v + 0.1 * interp(kf, year - 1);
  if (month === 11) return 0.9 * v + 0.1 * interp(kf, year + 1);
  if (month === 12) return 0.75 * v + 0.25 * interp(kf, year + 1);
  return v;
}

/** Share of a thermal fleet and its efficiency relative to the technology average. */
const THERMAL_TRANCHES: readonly (readonly [number, number])[] = [
  [0.3, 0.85],
  [0.4, 1.0],
  [0.3, 1.15],
];

export class World {
  readonly inputs: WorldInputs;
  readonly weather: WeatherSource;
  readonly seed: number;
  private readonly additions: CapacityAddition[] = [];
  private readonly reservoir = new Map<ZoneId, number>();
  private readonly soc = new Map<string, number>();
  private readonly windows = new Map<ZoneId, PriceWindow>();
  private readonly neighbourPrice = new Map<ZoneId, RollingMean>();
  private readonly engine: ClearingEngine;
  private readonly zoneIndex = new Map<ZoneId, number>();

  constructor(inputs: WorldInputs, weather: WeatherSource, seed: number) {
    this.inputs = inputs;
    this.weather = weather;
    this.seed = seed >>> 0;
    inputs.zones.forEach((z, i) => this.zoneIndex.set(z.id, i));
    this.engine = new ClearingEngine(inputs.zones.length);
    for (const z of inputs.zones) {
      this.windows.set(z.id, new PriceWindow(STORAGE_WINDOW_HOURS));
      this.neighbourPrice.set(z.id, new RollingMean(WATER_VALUE_WINDOW_HOURS));
    }
  }

  /** Extra capacity on top of the data: the hook for the player's assets and the explorer's slider. */
  addCapacity(zone: ZoneId, tech: TechId, mw: number, fromYear = -Infinity): void {
    if (!this.zoneIndex.has(zone)) throw new Error(`unknown zone ${zone}`);
    if (!TECH_INDEX.has(tech)) throw new Error(`unknown technology ${tech}`);
    if (!(mw >= 0) || !Number.isFinite(mw)) throw new Error('capacity must be a finite non-negative number');
    this.additions.push({ zone, tech, mw, fromYear });
  }

  clearAdditions(): void {
    this.additions.length = 0;
  }

  getAdditions(): readonly CapacityAddition[] {
    return this.additions;
  }

  /** Forget reservoir levels, storage charge and price history. */
  reset(): void {
    this.reservoir.clear();
    this.soc.clear();
    for (const w of this.windows.values()) w.reset();
    for (const m of this.neighbourPrice.values()) m.reset();
  }

  /** Installed capacity in MW of a technology in a zone for a year, including additions. */
  capacityMw(zone: ZoneId, tech: TechId, year: number): number {
    const kf = this.inputs.capacity.get(zone)?.get(tech);
    let mw = kf === undefined ? 0 : interp(kf, year);
    for (const a of this.additions) if (a.zone === zone && a.tech === tech && year >= a.fromYear) mw += a.mw;
    return mw;
  }

  /**
   * Marginal cost of a thermal technology (€/MWh electric) for a year, or for
   * one month of it (1–12): annual fuel and carbon prices are blended with
   * the neighbouring year's around New Year so costs do not step on 1 January.
   */
  marginalCost(tech: TechId, year: number, month?: number): number {
    const t = this.inputs.technologies.get(tech);
    if (t === undefined || t.kind !== 'thermal' || t.fuel === null) return 0;
    const fuel = blendAnnual(this.inputs.fuels.get(t.fuel) ?? [], year, month);
    const co2 = blendAnnual(this.inputs.co2, year, month);
    const eff = Math.max(0.05, interp(t.efficiency, year));
    return fuel / eff + (co2 * t.emissionFactor) / eff + t.variableOm;
  }

  simulateYear(year: number, options: SimulateOptions = {}): YearResult {
    const inputs = this.inputs;
    const zones = inputs.zones;
    const nz = zones.length;
    const hours = hoursInYear(year);
    const weather: WeatherYear = this.weather.year(this.seed, year);
    if (weather.hours !== hours) throw new Error(`weather year has ${weather.hours} hours, expected ${hours}`);
    const engine = this.engine;

    // Marginal costs by month: annual keyframes are interpolated through the
    // year so fuel moves gradually rather than in a New Year step.
    const mcByMonth: Map<TechId, number>[] = [];
    const cheapestByMonth: number[] = [];
    for (let m = 1; m <= 12; m++) {
      const mc = new Map<TechId, number>();
      for (const t of TECHS) mc.set(t, this.marginalCost(t, year, m));
      mcByMonth.push(mc);
      cheapestByMonth.push(Math.max(3, Math.min(mc.get('coal') ?? Infinity, mc.get('gas_ccgt') ?? Infinity)));
    }

    const demand = zones.map((z) => demandSeries(z, year, this.seed));
    const capacity = zones.map((z) => {
      const rec: Record<string, number> = {};
      for (const t of TECHS) {
        const mw = this.capacityMw(z.id, t, year);
        if (mw > 0) rec[t] = mw;
      }
      return rec;
    });
    const marketOpenHour = zones.map((z) => hourFromDate(year, z.marketOpen));
    const negativeHour = zones.map((z) => hourFromDate(year, z.negativePricesFrom));
    const regulated = zones.map((z) => interp(z.regulatedPrice, year));
    const premium = zones.map((z) => {
      const rec: Record<string, number> = {};
      const s = inputs.support.get(z.id);
      if (s !== undefined) for (const [t, v] of s) rec[t] = Math.max(0, interp(v.premiumPerMwh, year));
      return rec;
    });
    const flexShare = zones.map((z) => {
      const rec: Record<string, number> = {};
      const s = inputs.support.get(z.id);
      if (s !== undefined) for (const [t, v] of s) rec[t] = Math.min(1, Math.max(0, interp(v.flexShare, year)));
      return rec;
    });

    // Links in force this year.
    const linkSpecs: LinkSpec[] = [];
    const linkInputs: { id: string; from: ZoneId; to: ZoneId; capacityMw: number }[] = [];
    for (const l of inputs.links) {
      const capMw = interp(l.capacityMw, year);
      if (capMw <= 0) continue;
      const from = this.zoneIndex.get(l.from);
      const to = this.zoneIndex.get(l.to);
      if (from === undefined || to === undefined) continue;
      linkSpecs.push({ from, to, capacityMw: capMw });
      linkInputs.push({ id: l.id, from: l.from, to: l.to, capacityMw: capMw });
    }
    engine.setLinks(linkSpecs);
    // Link-capacity weights of each zone's neighbours, for the water-value anchor.
    const neighbourWeights: { zone: number; w: number }[][] = zones.map(() => []);
    for (const l of linkSpecs) {
      neighbourWeights[l.from]?.push({ zone: l.to, w: l.capacityMw });
      neighbourWeights[l.to]?.push({ zone: l.from, w: l.capacityMw });
    }
    const flows = linkSpecs.map(() => new Float64Array(hours));
    const congested = linkSpecs.map(() => new Uint8Array(hours));

    // Hydro reservoirs.
    const hydroCapMwh = zones.map((z) => (z.hydro === null ? 0 : z.hydro.reservoirTwh * 1e6));
    const hydroMinMwh = zones.map((z, i) => (z.hydro === null ? 0 : z.hydro.minFill * (hydroCapMwh[i] ?? 0)));
    const inflowMwPerFactor = zones.map((z) => (z.hydro === null ? 0 : (interp(z.hydro.inflowTwh, year) * 1e6) / hours));
    zones.forEach((z, i) => {
      if (z.hydro !== null && !this.reservoir.has(z.id)) this.reservoir.set(z.id, z.hydro.initialFill * (hydroCapMwh[i] ?? 0));
    });
    const resTech = inputs.technologies.get('hydro_res');
    const rorTech = inputs.technologies.get('hydro_ror');
    if (resTech === undefined || rorTech === undefined) throw new Error('hydro technologies missing');

    // Storage parameters.
    interface StorageParams {
      tech: TechId;
      powerMw: number;
      energyMwh: number;
      etaC: number;
      etaD: number;
      rt: number;
      key: string;
    }
    const storage: StorageParams[][] = zones.map((z, zi) => {
      const list: StorageParams[] = [];
      for (const t of ['pumped', 'battery'] as const) {
        const mw = capacity[zi]?.[t] ?? 0;
        const tech = inputs.technologies.get(t);
        if (mw <= 0 || tech === undefined) continue;
        const eta = Math.sqrt(tech.roundTripEfficiency);
        const key = `${z.id}/${t}`;
        const energyMwh = mw * tech.storageHours;
        if (!this.soc.has(key)) this.soc.set(key, energyMwh / 2);
        list.push({ tech: t, powerMw: mw, energyMwh, etaC: eta, etaD: eta, rt: tech.roundTripEfficiency, key });
      }
      return list;
    });

    // Output buffers.
    const price = zones.map(() => new Float64Array(hours));
    const marginalPrice = zones.map(() => new Float64Array(hours));
    const unserved = zones.map(() => new Float64Array(hours));
    const scarcity = zones.map(() => new Float64Array(hours));
    const netExport = zones.map(() => new Float64Array(hours));
    const generation: Record<string, Float64Array>[] = zones.map((_z, zi) => {
      const rec: Record<string, Float64Array> = {};
      for (const t of Object.keys(capacity[zi] ?? {})) rec[t] = new Float64Array(hours);
      return rec;
    });
    const charging: Record<string, Float64Array>[] = zones.map((_z, zi) => {
      const rec: Record<string, Float64Array> = {};
      for (const s of storage[zi] ?? []) rec[s.tech] = new Float64Array(hours);
      return rec;
    });
    const stateOfCharge: Record<string, Float64Array>[] = zones.map((_z, zi) => {
      const rec: Record<string, Float64Array> = {};
      for (const s of storage[zi] ?? []) rec[s.tech] = new Float64Array(hours);
      return rec;
    });
    const available: Record<string, Float64Array>[] = zones.map((_z, zi) => {
      const rec: Record<string, Float64Array> = {};
      for (const t of ['wind', 'solar'] as const) if ((capacity[zi]?.[t] ?? 0) > 0) rec[t] = new Float64Array(hours);
      return rec;
    });
    const reservoirMwh = zones.map((z) => (z.hydro === null ? null : new Float64Array(hours)));
    const inflowMw = zones.map((z) => (z.hydro === null ? null : new Float64Array(hours)));
    const spillMw = zones.map((z) => (z.hydro === null ? null : new Float64Array(hours)));
    const inflowThisHour = new Float64Array(nz);

    // Stack recording.
    const recordSet = new Set(options.recordStacks ?? []);
    interface Rec {
      offsets: Int32Array;
      tech: number[];
      tranche: number[];
      bid: number[];
      mw: number[];
      dispatched: number[];
    }
    const recs: (Rec | null)[] = zones.map((z) =>
      recordSet.has(z.id) ? { offsets: new Int32Array(hours + 1), tech: [], tranche: [], bid: [], mw: [], dispatched: [] } : null,
    );

    let wrongWay = 0;

    for (let h = 0; h < hours; h++) {
      const doy = Math.floor(h / 24);
      const month = monthOfDay(year, doy);
      const winterness = (1 + Math.cos((2 * Math.PI * (doy - 15)) / 365.25)) / 2;
      const mc = mcByMonth[month - 1] ?? new Map<TechId, number>();
      const cheapestThermal = cheapestByMonth[month - 1] ?? 3;

      engine.beginHour();
      for (let zi = 0; zi < nz; zi++) {
        const z = zones[zi];
        if (z === undefined) continue;
        engine.demand[zi] = demand[zi]?.[h] ?? 0;
        engine.floor[zi] = h >= (negativeHour[zi] ?? hours) ? z.priceFloor : 0;
        engine.cap[zi] = z.priceCap;
        engine.reserveFraction[zi] = z.reserveFraction;
      }

      for (let zi = 0; zi < nz; zi++) {
        const z = zones[zi];
        const cap = capacity[zi];
        if (z === undefined || cap === undefined) continue;
        const floor = engine.floor[zi] ?? 0;
        for (const t of TECHS) {
          const mw = cap[t];
          if (mw === undefined || mw <= 0) continue;
          const tech = inputs.technologies.get(t);
          if (tech === undefined) continue;
          const ti = TECH_INDEX.get(t) ?? 0;
          switch (tech.kind) {
            case 'thermal': {
              // Maintenance is scheduled for summer, so more of the fleet is available in winter.
              const avail = mw * Math.min(0.98, tech.availability * (0.94 + 0.12 * winterness));
              let share = inputs.mustRunOverrides.get(z.id)?.get(t) ?? tech.mustRunShare;
              // Heat-led plant (CHP) must run more in winter than in summer.
              if (tech.fuel === 'coal' || tech.fuel === 'gas' || tech.fuel === 'biomass') share *= 0.7 + 0.6 * winterness;
              const mustRun = avail * Math.min(1, share);
              if (mustRun > 0) engine.addBlock(zi, ti, TRANCHE.MUST_RUN, tech.mustRunBid, mustRun);
              // A fleet is many plants of different vintages: spread its marginal
              // cost over efficiency tranches rather than bidding one flat block.
              const flexible = avail - mustRun;
              const fuelPart = (mc.get(t) ?? 0) - tech.variableOm;
              for (const [tShare, effMul] of THERMAL_TRANCHES) {
                engine.addBlock(zi, ti, TRANCHE.NORMAL, fuelPart / effMul + tech.variableOm, flexible * tShare);
              }
              break;
            }
            case 'hydro_ror': {
              const f = weather.inflow[z.id]?.[h] ?? 1;
              engine.addBlock(zi, ti, TRANCHE.MUST_RUN, tech.bid, Math.min(mw, mw * tech.meanCf * f));
              break;
            }
            case 'hydro_res': {
              if (z.hydro === null) break;
              const level = this.reservoir.get(z.id) ?? 0;
              const capMwh = hydroCapMwh[zi] ?? 0;
              const inflow = (inflowMwPerFactor[zi] ?? 0) * (weather.inflow[z.id]?.[h] ?? 1);
              inflowThisHour[zi] = inflow;
              const genCap = mw * tech.availability;
              const forced = Math.min(genCap, Math.max(0, level + inflow - capMwh));
              const availFromLevel = Math.max(0, level + inflow - (hydroMinMwh[zi] ?? 0));
              const avail = Math.min(genCap, availFromLevel);
              const fill = capMwh > 0 ? level / capMwh : 0;
              const target = z.hydro.targetFill[month - 1] ?? 0.5;
              // Water is worth what it would fetch: the recent price of the linked
              // zones, or the cheapest thermal cost where there is no link yet.
              const anchor = this.neighbourPrice.get(z.id);
              const hasNeighbours = (neighbourWeights[zi]?.length ?? 0) > 0;
              const ref =
                hasNeighbours && anchor !== undefined && anchor.length >= WATER_VALUE_WARMUP_HOURS ? anchor.mean() : cheapestThermal;
              // Near a full reservoir water is about to be spilled, so its value collapses.
              const spillRisk = fill > 0.9 ? Math.max(0, (1 - fill) / 0.1) : 1;
              const wv = Math.min(
                z.priceCap,
                Math.max(0, z.hydro.waterValueRefFactor * ref) * Math.exp(z.hydro.waterValueSlope * (target - fill)) * spillRisk,
              );
              if (forced > 0) engine.addBlock(zi, ti, TRANCHE.HYDRO_FORCED, Math.max(floor, tech.bid), forced);
              const flexible = Math.max(0, avail - forced);
              if (flexible > 0) {
                engine.addBlock(zi, ti, TRANCHE.HYDRO, wv * 0.8, flexible * 0.3);
                engine.addBlock(zi, ti, TRANCHE.HYDRO, wv, flexible * 0.4);
                engine.addBlock(zi, ti, TRANCHE.HYDRO, wv * 1.3, flexible * 0.3);
              }
              break;
            }
            case 'storage': {
              const sp = storage[zi]?.find((s) => s.tech === t);
              const history = this.windows.get(z.id);
              if (sp === undefined || history === undefined || history.length < STORAGE_WARMUP_HOURS) break;
              const soc = this.soc.get(sp.key) ?? 0;
              const p25 = history.percentile(0.25);
              const p75 = history.percentile(0.75);
              const dischargeBid = Math.max(p75, (p25 + STORAGE_MIN_SPREAD) / sp.rt);
              const chargeWtp = Math.min(p25, p75 * sp.rt - STORAGE_MIN_SPREAD);
              const discharge = Math.min(sp.powerMw, soc * sp.etaD);
              if (discharge > 0) engine.addBlock(zi, ti, TRANCHE.STORAGE, dischargeBid, discharge);
              const charge = Math.min(sp.powerMw, (sp.energyMwh - soc) / sp.etaC);
              if (charge > 0) engine.addCharge(zi, ti, chargeWtp, charge);
              break;
            }
            case 'variable': {
              const cf = (t === 'wind' ? weather.wind[z.id]?.[h] : weather.solar[z.id]?.[h]) ?? 0;
              const avail = mw * cf;
              const av = available[zi]?.[t];
              if (av !== undefined) av[h] = avail;
              const prem = premium[zi]?.[t] ?? 0;
              const flex = avail * (flexShare[zi]?.[t] ?? 0);
              engine.addBlock(zi, ti, TRANCHE.FLEX_RENEWABLE, prem > 0 ? -0.5 : 0, flex);
              engine.addBlock(zi, ti, TRANCHE.LEGACY_RENEWABLE, -prem, avail - flex);
              break;
            }
            default:
              break;
          }
        }
      }

      engine.clear();
      wrongWay += engine.wrongWayLinks;

      // Read out.
      for (let zi = 0; zi < nz; zi++) {
        const mp = engine.price[zi] ?? 0;
        const mpArr = marginalPrice[zi];
        const pArr = price[zi];
        if (mpArr !== undefined) mpArr[h] = mp;
        if (pArr !== undefined) pArr[h] = h >= (marketOpenHour[zi] ?? 0) ? mp : (regulated[zi] ?? 0);
        const u = unserved[zi];
        if (u !== undefined) u[h] = engine.unserved[zi] ?? 0;
        const sc = scarcity[zi];
        if (sc !== undefined) sc[h] = engine.scarcity[zi] ?? 0;
        const ne = netExport[zi];
        if (ne !== undefined) ne[h] = engine.netPosition[zi] ?? 0;
      }
      for (let i = 0; i < engine.nBlocks; i++) {
        const zi = engine.bZone[i] ?? 0;
        const t = TECHS[engine.bTech[i] ?? 0];
        if (t === undefined) continue;
        const g = generation[zi]?.[t];
        if (g !== undefined) g[h] = (g[h] ?? 0) + (engine.bDisp[i] ?? 0);
      }
      for (let i = 0; i < engine.nCharges; i++) {
        const zi = engine.cZone[i] ?? 0;
        const t = TECHS[engine.cTech[i] ?? 0];
        if (t === undefined) continue;
        const c = charging[zi]?.[t];
        if (c !== undefined) c[h] = (c[h] ?? 0) + (engine.cDisp[i] ?? 0);
      }
      for (let l = 0; l < linkSpecs.length; l++) {
        const arr = flows[l];
        if (arr !== undefined) arr[h] = engine.flow[l] ?? 0;
        const c = congested[l];
        if (c !== undefined) c[h] = engine.congested[l] ?? 0;
      }

      // State updates.
      for (let zi = 0; zi < nz; zi++) {
        const z = zones[zi];
        if (z === undefined) continue;
        for (const sp of storage[zi] ?? []) {
          const ch = charging[zi]?.[sp.tech]?.[h] ?? 0;
          const dis = generation[zi]?.[sp.tech]?.[h] ?? 0;
          let soc = (this.soc.get(sp.key) ?? 0) + ch * sp.etaC - dis / sp.etaD;
          soc = Math.min(sp.energyMwh, Math.max(0, soc));
          this.soc.set(sp.key, soc);
          const socArr = stateOfCharge[zi]?.[sp.tech];
          if (socArr !== undefined) socArr[h] = soc;
        }
        if (z.hydro !== null) {
          const capMwh = hydroCapMwh[zi] ?? 0;
          const gen = generation[zi]?.hydro_res?.[h] ?? 0;
          const inflow = inflowThisHour[zi] ?? 0;
          let level = (this.reservoir.get(z.id) ?? 0) + inflow - gen;
          const spill = Math.max(0, level - capMwh);
          level = Math.max(0, level - spill);
          this.reservoir.set(z.id, level);
          const r = reservoirMwh[zi];
          const inf = inflowMw[zi];
          const sp = spillMw[zi];
          if (r !== null && r !== undefined) r[h] = level;
          if (inf !== null && inf !== undefined) inf[h] = inflow;
          if (sp !== null && sp !== undefined) sp[h] = spill;
        }
        this.windows.get(z.id)?.push(price[zi]?.[h] ?? 0);
        const nw = neighbourWeights[zi];
        if (z.hydro !== null && nw !== undefined && nw.length > 0) {
          let sum = 0;
          let wsum = 0;
          for (const { zone, w } of nw) {
            sum += (marginalPrice[zone]?.[h] ?? 0) * w;
            wsum += w;
          }
          this.neighbourPrice.get(z.id)?.push(wsum > 0 ? sum / wsum : 0);
        }
      }

      // Stacks.
      for (let zi = 0; zi < nz; zi++) {
        const rec = recs[zi];
        if (rec === null || rec === undefined) continue;
        for (let i = 0; i < engine.nBlocks; i++) {
          if (engine.bZone[i] !== zi) continue;
          rec.tech.push(engine.bTech[i] ?? 0);
          rec.tranche.push(engine.bTranche[i] ?? 0);
          rec.bid.push(engine.bEff[i] ?? 0);
          rec.mw.push(engine.bMw[i] ?? 0);
          rec.dispatched.push(engine.bDisp[i] ?? 0);
        }
        rec.offsets[h + 1] = rec.tech.length;
      }
    }

    // Assemble.
    const byZone: Record<ZoneId, ZoneYear> = {};
    zones.forEach((z, zi) => {
      const rec = recs[zi];
      const stacks: StackRecord | null =
        rec === null || rec === undefined
          ? null
          : {
              offsets: rec.offsets,
              tech: Int8Array.from(rec.tech),
              tranche: Int8Array.from(rec.tranche),
              bid: Float32Array.from(rec.bid),
              mw: Float32Array.from(rec.mw),
              dispatched: Float32Array.from(rec.dispatched),
            };
      const base = {
        zone: z.id,
        year,
        hours,
        marketOpenFromHour: marketOpenHour[zi] ?? 0,
        negativeFromHour: negativeHour[zi] ?? hours,
        priceFloor: z.priceFloor,
        priceCap: z.priceCap,
        price: price[zi] ?? new Float64Array(hours),
        marginalPrice: marginalPrice[zi] ?? new Float64Array(hours),
        demand: demand[zi] ?? new Float64Array(hours),
        generation: generation[zi] ?? {},
        charging: charging[zi] ?? {},
        stateOfCharge: stateOfCharge[zi] ?? {},
        available: available[zi] ?? {},
        reservoirMwh: reservoirMwh[zi] ?? null,
        inflowMw: inflowMw[zi] ?? null,
        spillMw: spillMw[zi] ?? null,
        unserved: unserved[zi] ?? new Float64Array(hours),
        scarcity: scarcity[zi] ?? new Float64Array(hours),
        netExport: netExport[zi] ?? new Float64Array(hours),
        capacityMw: capacity[zi] ?? {},
        stacks,
      };
      byZone[z.id] = { ...base, stats: zoneStats(base) };
    });
    const links: LinkYear[] = linkInputs.map((l, i) => {
      const c = congested[i] ?? new Uint8Array(hours);
      let n = 0;
      for (let h = 0; h < hours; h++) n += c[h] ?? 0;
      return { ...l, flow: flows[i] ?? new Float64Array(hours), congested: c, congestedHours: n };
    });
    return { year, hours, seed: this.seed, zones: zones.map((z) => z.id), byZone, links, wrongWayLinkHours: wrongWay };
  }
}

/** Deterministic hash of a year's main outputs (prices, dispatch, flows, storage). */
export function hashYearResult(r: YearResult): string {
  const hasher = new Hasher();
  hasher.updateNumber(r.year).updateNumber(r.seed);
  for (const zid of r.zones) {
    const z = r.byZone[zid];
    if (z === undefined) continue;
    hasher.updateString(zid).update(z.price).update(z.marginalPrice).update(z.unserved);
    for (const t of Object.keys(z.generation).sort()) {
      const g = z.generation[t];
      if (g !== undefined) hasher.updateString(t).update(g);
    }
    for (const t of Object.keys(z.stateOfCharge).sort()) {
      const s = z.stateOfCharge[t];
      if (s !== undefined) hasher.updateString(t).update(s);
    }
    if (z.reservoirMwh !== null) hasher.update(z.reservoirMwh);
  }
  for (const l of r.links) hasher.updateString(l.id).update(l.flow);
  return hasher.digest();
}
