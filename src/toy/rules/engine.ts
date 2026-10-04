/**
 * Toy 1 "Hubs": the game, headless and deterministic. The same inputs, seed
 * and actions at the same game hours give the same run.
 *
 * The page (src/toy/page) calls `advance(hours)` from its clock, stops at
 * the year's end to show the review, then calls `startNextYear()`, which
 * clears the next national year (the slow step, about 0.3 s).
 */
import { dayOfWeek, hoursInYear, labelForHour, type WorldInputs } from '../../sim';
import { HUB_COUNT, clearHour, newCleared, type Cleared } from './grid';
import { NationalMarket, type NationalYear, type WeatherMood } from './national';
import { HUBS, distanceKm, spotsFor, type HubDef, type Spot } from './region';
import {
  BATTERY,
  BLOCK_MW,
  COLOUR,
  COST,
  DAYS,
  LAST_YEAR,
  PRICE,
  SEPARATED_EUR,
  STARTING_CASH_LIMITED,
  START_YEAR,
  WINDOW_HOURS,
} from './tuning';

export type PlantKind = 'wind' | 'solar';

export interface Plant {
  readonly id: string;
  readonly kind: PlantKind;
  readonly spot: string;
  readonly hub: string;
  readonly mw: number;
  readonly km: number;
  readonly yearlyCost: number;
  readonly orderedAt: number;
  readonly readyAt: number;
  removedAt: number | null;
}

/** What output needs to know about a plant (a real one, or a planner's candidate). */
export interface PlantLike {
  readonly kind: PlantKind;
  readonly spot: string;
  readonly hub: string;
  readonly mw: number;
  readonly readyAt: number;
  readonly removedAt: number | null;
}

export interface Battery {
  readonly id: string;
  readonly hub: string;
  readonly orderedAt: number;
  readonly readyAt: number;
  removedAt: number | null;
}

export interface Settings {
  /** Money near-unlimited (round 1's default): building is never blocked by cash. */
  readonly unlimitedMoney: boolean;
}

export const DEFAULT_SETTINGS: Settings = { unlimitedMoney: true };

export type Action =
  | { readonly type: 'scout'; readonly spot: string }
  | { readonly type: 'build'; readonly kind: PlantKind; readonly spot: string; readonly hub: string; readonly mw: number }
  | { readonly type: 'remove'; readonly plant: string }
  | { readonly type: 'battery'; readonly hub: string }
  | { readonly type: 'removeBattery'; readonly hub: string };

export interface ActionRecord {
  readonly hour: number;
  readonly action: Action;
}

export interface NewsItem {
  readonly hour: number;
  readonly text: string;
  readonly kind: 'market' | 'weather' | 'you' | 'build' | 'grid';
}

interface Ledger {
  mwh: number;
  earned: number;
  cost: number;
  /** What the same output would have earned at each hub's price, hour by hour. */
  readonly whatIf: Float64Array;
}

interface BatteryLedger {
  earned: number;
  cost: number;
  /** What the player's plants at the hub earned because of the bank (its price effect). */
  plantsDelta: number;
  chargedMwh: number;
  dischargedMwh: number;
}

export interface PlantReview {
  readonly id: string;
  readonly kind: PlantKind;
  readonly spot: string;
  readonly hub: string;
  readonly mw: number;
  readonly removed: boolean;
  readonly mwh: number;
  readonly earned: number;
  readonly cost: number;
  readonly profit: number;
  /** Mean price earned, €/MWh (null without output). */
  readonly earnedPrice: number | null;
  /** The best other hub for the same output, at the same prices, with its own line cost. */
  readonly alternative: { readonly hub: string; readonly profit: number; readonly km: number } | null;
}

export interface BatteryReview {
  readonly hub: string;
  readonly units: number;
  readonly earned: number;
  readonly cost: number;
  readonly plantsDelta: number;
  readonly chargedMwh: number;
  readonly dischargedMwh: number;
}

export interface HubYear {
  readonly hub: string;
  readonly meanPrice: number;
  readonly floodedHours: number;
  readonly hungryHours: number;
  readonly playerMwh: number;
}

export interface YearReview {
  readonly year: number;
  readonly mood: WeatherMood;
  readonly nationalMean: number;
  readonly earned: number;
  readonly cost: number;
  readonly profit: number;
  readonly other: number;
  readonly plants: readonly PlantReview[];
  readonly batteries: readonly BatteryReview[];
  readonly hubs: readonly HubYear[];
}

export type Colour = 'red' | 'green' | 'blue';

export interface TypicalDay {
  readonly hours: number;
  readonly price: readonly number[];
  readonly national: readonly number[];
  readonly withoutYou: readonly number[];
  readonly playerMw: readonly number[];
  readonly demandMw: readonly number[];
  /** Hour of the day that departs most from the national price, and which way. */
  readonly worstHour: number;
  readonly worstKind: 'flooded' | 'hungry' | null;
  readonly meanPrice: number;
  readonly meanNational: number;
  readonly meanWithoutYou: number;
  readonly floodedShare: number;
  readonly hungryShare: number;
}

export interface HubStatus {
  readonly hub: HubDef;
  readonly colour: Colour;
  /** 4-week mean price over the national mean. */
  readonly ratio: number;
  readonly roomUsedMw: number;
  readonly playerMw: number;
  readonly backgroundMw: number;
  readonly batteries: number;
  /** Mean |flow| over the window as a share of the link (0..1). */
  readonly linkUse: number;
}

const ZERO_LEDGER = (): Ledger => ({ mwh: 0, earned: 0, cost: 0, whatIf: new Float64Array(HUB_COUNT) });
const ZERO_BATTERY = (): BatteryLedger => ({ earned: 0, cost: 0, plantsDelta: 0, chargedMwh: 0, dischargedMwh: 0 });

export function plantYearlyCost(kind: PlantKind, mw: number, km: number): number {
  return ((kind === 'wind' ? COST.windPerMwYear : COST.solarPerMwYear) + COST.linePerKmMwYear * km) * mw;
}

export class HubsGame {
  readonly seed: number;
  readonly settings: Settings;
  readonly spots: readonly Spot[];
  private readonly market: NationalMarket;
  year = START_YEAR;
  /** Hour within the current year. */
  hour = 0;
  nat!: NationalYear;
  status: 'running' | 'yearEnd' | 'over' = 'running';
  money: number;
  readonly scouted = new Set<string>();
  readonly scouting = new Map<string, number>();
  readonly plants: Plant[] = [];
  readonly batteries: Battery[] = [];
  readonly backgroundMw = new Float64Array(HUB_COUNT);
  readonly news: NewsItem[] = [];
  readonly actions: ActionRecord[] = [];
  readonly reviews: YearReview[] = [];
  firstBlueByYou: { readonly hour: number; readonly hub: string } | null = null;
  private marketOpenAnnounced = false;
  private nextId = 1;
  private yearStart = 0;

  // Per-hub battery bank: stored energy, MWh.
  private readonly soc = new Float64Array(HUB_COUNT);
  // Year ledgers.
  private ledgers = new Map<string, Ledger>();
  private batteryLedgers: BatteryLedger[] = HUBS.map(ZERO_BATTERY);
  private hubYear = HUBS.map(() => ({ priceSum: 0, flooded: 0, hungry: 0, playerMwh: 0 }));
  private natSum = 0;
  private yearHours = 0;
  private otherCost = 0;

  // The rolling 4-week window, hour-major: index = slot * HUB_COUNT + hub.
  private readonly ringPrice = new Float64Array(WINDOW_HOURS * HUB_COUNT);
  private readonly ringWithout = new Float64Array(WINDOW_HOURS * HUB_COUNT);
  private readonly ringPlayer = new Float64Array(WINDOW_HOURS * HUB_COUNT);
  private readonly ringDemand = new Float64Array(WINDOW_HOURS * HUB_COUNT);
  private readonly ringFlow = new Float64Array(WINDOW_HOURS * HUB_COUNT);
  private readonly ringNational = new Float64Array(WINDOW_HOURS);
  private readonly ringHod = new Uint8Array(WINDOW_HOURS);
  private ringHead = 0;
  private ringCount = 0;

  // Scratch for the hourly loop.
  private readonly supply = new Float64Array(HUB_COUNT);
  private readonly demand = new Float64Array(HUB_COUNT);
  private readonly bgSupply = new Float64Array(HUB_COUNT);
  private readonly playerOut = new Float64Array(HUB_COUNT);
  private readonly charge = new Float64Array(HUB_COUNT);
  private readonly discharge = new Float64Array(HUB_COUNT);
  private readonly before = newCleared();
  private readonly after = newCleared();
  private readonly without = newCleared();

  constructor(inputs: WorldInputs, seed: number, settings: Settings = DEFAULT_SETTINGS) {
    this.seed = seed >>> 0;
    this.settings = settings;
    this.spots = spotsFor(this.seed);
    this.money = settings.unlimitedMoney ? 0 : STARTING_CASH_LIMITED;
    this.market = new NationalMarket(inputs, this.seed, START_YEAR);
    this.beginYear(START_YEAR);
    this.warmUp();
  }

  // -------------------------------------------------------------------------
  // Time

  /** Absolute hour since 1 January of the start year. */
  get now(): number {
    return this.yearStart + this.hour;
  }

  get marketOpensAt(): number {
    return this.market.opensAt;
  }

  get marketOpen(): boolean {
    return this.now >= this.market.opensAt;
  }

  dateLabel(hour: number = this.now): string {
    let y = START_YEAR;
    let h = hour;
    while (h >= hoursInYear(y)) {
      h -= hoursInYear(y);
      y++;
    }
    return labelForHour(y, h);
  }

  /** Run up to `hours` whole hours; stops at the end of the year. Returns the hours run. */
  advance(hours: number): number {
    let done = 0;
    while (done < hours && this.status === 'running') {
      this.step();
      done++;
      if (this.hour >= this.nat.hours) this.closeYear();
    }
    return done;
  }

  /** After the year review: clear the next national year (or end the run). */
  startNextYear(): void {
    if (this.status !== 'yearEnd') return;
    if (this.year >= LAST_YEAR) {
      this.status = 'over';
      return;
    }
    this.beginYear(this.year + 1);
    this.status = 'running';
  }

  private beginYear(year: number): void {
    this.yearStart = this.market.yearStartHour(year);
    this.year = year;
    this.hour = 0;
    let wind = 0;
    let solar = 0;
    for (const p of this.plants) {
      if (p.removedAt !== null) continue;
      const s = this.spot(p.spot);
      if (p.kind === 'wind') wind += p.mw * s.windQ;
      else solar += p.mw * s.solarQ;
    }
    this.nat = this.market.simulate(year, { windMw: wind, solarMw: solar });
    const ref = this.refNationalWind ?? this.nat.nationalWindMw;
    this.refNationalWind ??= ref;
    // "Everyone else" grows with the national build-out, into the room nobody has taken.
    HUBS.forEach((hub, i) => {
      const want = hub.backgroundMw * (this.nat.nationalWindMw / Math.max(1, ref));
      const free = hub.roomMw - this.playerRoom(hub.id);
      const cur = this.backgroundMw[i] ?? 0;
      this.backgroundMw[i] = Math.max(cur, Math.min(want, free));
      if (year > START_YEAR && (this.backgroundMw[i] ?? 0) - cur >= 1) {
        this.pushNews('grid', `Others connected ${Math.round((this.backgroundMw[i] ?? 0) - cur)} MW of wind at ${hub.name}.`);
      }
    });
    this.ledgers = new Map();
    this.batteryLedgers = HUBS.map(ZERO_BATTERY);
    this.hubYear = HUBS.map(() => ({ priceSum: 0, flooded: 0, hungry: 0, playerMwh: 0 }));
    this.natSum = 0;
    this.yearHours = 0;
    this.otherCost = 0;
    if (this.nat.mood === 'storm year') this.pushNews('weather', `${year}: a storm year. Wind blows harder all year.`);
    if (this.nat.mood === 'calm winter') this.pushNews('weather', `${year}: a calm winter. Little wind in January, February and December.`);
  }

  private refNationalWind: number | null = null;

  /** Per hub and hour of the day: +1 a blue hour (charge), −1 a red hour (discharge), from the typical day. */
  private readonly batteryPlan = new Int8Array(HUB_COUNT * 24);

  private planBatteries(): void {
    for (let i = 0; i < HUB_COUNT; i++) {
      const plan = batteryPlanFor(this.typicalDay(i).price);
      for (let hod = 0; hod < 24; hod++) this.batteryPlan[i * 24 + hod] = plan[hod] ?? 0;
    }
  }

  /** The battery plan of a hub for the page: +1 charge, −1 discharge, per hour of the day. */
  batteryPlanOf(i: number): number[] {
    return Array.from(this.batteryPlan.subarray(i * 24, i * 24 + 24));
  }

  /** Fill the 4-week window before play starts, from the first weeks of the start year with no plants (a forecast). */
  private warmUp(): void {
    for (let h = 0; h < WINDOW_HOURS; h++) {
      this.hourInputs(h);
      clearHour(this.nat.price[h] ?? 0, this.floorAt(h), this.bgSupply, this.demand, this.without);
      this.pushRing(h, this.without, this.without, this.nat.price[h] ?? 0);
    }
    this.planBatteries();
  }

  private floorAt(h: number): number {
    return this.year >= PRICE.negativeFromYear && this.yearStart + h >= this.market.opensAt ? PRICE.floorAfter : PRICE.floorBefore;
  }

  /** Demand and everyone's supply at each hub for hour `h` of the current year. */
  private hourInputs(h: number, plants: readonly PlantLike[] = this.plants, all = false): void {
    const doy = Math.floor(h / 24);
    const hod = h % 24;
    const shape = this.nat.demandShape[h] ?? 1;
    const windCf = this.nat.windCf[h] ?? 0;
    const solarCf = this.nat.solarCf[h] ?? 0;
    const weekday = dayOfWeek(this.year, doy) < 5;
    HUBS.forEach((hub, i) => {
      let f: number;
      if (hub.kind === 'town') f = 1 + 1.6 * (shape - 1);
      else if (hub.kind === 'rural') f = 1 + 0.8 * (shape - 1);
      else f = (weekday && hod >= 7 && hod < 18 ? 1.3 : 0.75) * (1 + 0.3 * (shape - 1));
      this.demand[i] = hub.demandMw * Math.max(0.2, f);
      this.bgSupply[i] = (this.backgroundMw[i] ?? 0) * windCf;
      this.playerOut[i] = 0;
    });
    const abs = this.yearStart + h;
    for (const p of plants) {
      if (!all && (p.removedAt !== null || p.readyAt > abs)) continue;
      const i = hubIndex(p.hub);
      this.playerOut[i] = (this.playerOut[i] ?? 0) + this.plantOutput(p, windCf, solarCf);
    }
  }

  private plantOutput(p: PlantLike, windCf: number, solarCf: number): number {
    const s = this.spot(p.spot);
    return p.kind === 'wind' ? p.mw * Math.min(1, windCf * s.windQ) : p.mw * Math.min(1, solarCf * s.solarQ);
  }

  private step(): void {
    const h = this.hour;
    const abs = this.now;
    this.arrivals(abs);
    if (!this.marketOpenAnnounced && abs >= this.market.opensAt) {
      this.marketOpenAnnounced = true;
      this.pushNews('market', 'The market opens. From today the national price moves hour by hour, and it is lower than the old tariff.');
    }
    this.hourInputs(h);
    const national = this.nat.price[h] ?? 0;
    const floor = this.floorAt(h);
    const windCf = this.nat.windCf[h] ?? 0;
    const solarCf = this.nat.solarCf[h] ?? 0;

    // Without the player's plants (the "without you" line, and "blue because of you").
    clearHour(national, floor, this.bgSupply, this.demand, this.without);

    // Before batteries.
    for (let i = 0; i < HUB_COUNT; i++) this.supply[i] = (this.bgSupply[i] ?? 0) + (this.playerOut[i] ?? 0);
    clearHour(national, floor, this.supply, this.demand, this.before);

    // Batteries: charge when the hub is blue, discharge when it is red.
    let acted = false;
    const units = this.activeBatteryUnits(abs);
    for (let i = 0; i < HUB_COUNT; i++) {
      this.charge[i] = 0;
      this.discharge[i] = 0;
      const n = units[i] ?? 0;
      if (n === 0) continue;
      const [c, d, soc] = batteryHour(n, this.soc[i] ?? 0, this.before.stuck[i] ?? 0, this.batteryPlan[i * 24 + (h % 24)] ?? 0, spareImport(i, this.before));
      this.charge[i] = c;
      this.discharge[i] = d;
      this.soc[i] = soc;
      if (c > 0 || d > 0) acted = true;
    }
    let final = this.before;
    if (acted) {
      const supply2 = new Float64Array(HUB_COUNT);
      const demand2 = new Float64Array(HUB_COUNT);
      for (let i = 0; i < HUB_COUNT; i++) {
        supply2[i] = (this.supply[i] ?? 0) + (this.discharge[i] ?? 0);
        demand2[i] = (this.demand[i] ?? 0) + (this.charge[i] ?? 0);
      }
      clearHour(national, floor, supply2, demand2, this.after);
      final = this.after;
    }

    // Plant ledgers.
    const hrsInYear = this.nat.hours;
    for (const p of this.plants) {
      if (p.removedAt !== null && p.removedAt <= abs) continue;
      let l = this.ledgers.get(p.id);
      if (l === undefined) {
        l = ZERO_LEDGER();
        this.ledgers.set(p.id, l);
      }
      l.cost += p.yearlyCost / hrsInYear;
      if (p.readyAt > abs) continue;
      const out = this.plantOutput(p, windCf, solarCf);
      if (out <= 0) continue;
      const i = hubIndex(p.hub);
      l.mwh += out;
      l.earned += out * (final.price[i] ?? 0);
      for (let j = 0; j < HUB_COUNT; j++) l.whatIf[j] = (l.whatIf[j] ?? 0) + out * (final.price[j] ?? 0);
    }
    // Battery ledgers.
    for (let i = 0; i < HUB_COUNT; i++) {
      const bl = this.batteryLedgers[i];
      if (bl === undefined) continue;
      const owned = this.ownedBatteryUnits(abs, i);
      bl.cost += (owned * COST.batteryPerUnitYear) / hrsInYear;
      const p = final.price[i] ?? 0;
      bl.earned += ((this.discharge[i] ?? 0) - (this.charge[i] ?? 0)) * p;
      bl.chargedMwh += this.charge[i] ?? 0;
      bl.dischargedMwh += this.discharge[i] ?? 0;
      if (acted) bl.plantsDelta += (this.playerOut[i] ?? 0) * (p - (this.before.price[i] ?? 0));
    }
    // Hub year stats.
    for (let i = 0; i < HUB_COUNT; i++) {
      const hy = this.hubYear[i];
      if (hy === undefined) continue;
      const p = final.price[i] ?? 0;
      hy.priceSum += p;
      hy.playerMwh += this.playerOut[i] ?? 0;
      if (p < national - SEPARATED_EUR) hy.flooded++;
      else if (p > national + SEPARATED_EUR) hy.hungry++;
    }
    this.natSum += national;
    this.yearHours++;

    // Money: the hour's earnings less the hour's costs.
    this.pushRing(h, final, this.without, national);
    this.hour++;
    if (this.hour % 24 === 0) this.dailyChecks();
  }

  private arrivals(abs: number): void {
    for (const [spot, at] of this.scouting) {
      if (at <= abs) {
        this.scouting.delete(spot);
        this.scouted.add(spot);
        const s = this.spot(spot);
        this.pushNews('you', `Scouted ${s.name}: wind ${pct(s.windQ)}, sun ${pct(s.solarQ)}.`);
      }
    }
    for (const p of this.plants) {
      if (p.readyAt === abs && p.removedAt === null) {
        this.pushNews('build', `${p.mw} MW ${p.kind} at ${this.spot(p.spot).name} is running, connected to ${hubName(p.hub)}.`);
      }
    }
    for (const b of this.batteries) {
      if (b.readyAt === abs && b.removedAt === null) this.pushNews('build', `A battery at ${hubName(b.hub)} is running.`);
    }
  }

  private dailyChecks(): void {
    this.planBatteries();
    if (this.firstBlueByYou !== null) return;
    for (let i = 0; i < HUB_COUNT; i++) {
      const st = this.hubStatus(i);
      if (st.colour !== 'blue' || st.playerMw <= 0) continue;
      const td = this.typicalDay(i);
      const withoutRatio = td.meanNational !== 0 ? td.meanWithoutYou / td.meanNational : 1;
      if (withoutRatio >= COLOUR.blueBelow) {
        this.firstBlueByYou = { hour: this.now, hub: HUBS[i]?.id ?? '' };
        this.pushNews('you', `${HUBS[i]?.name ?? ''} turned blue, and it is your plants that flood it.`);
        return;
      }
    }
  }

  private closeYear(): void {
    const plants: PlantReview[] = [];
    let earned = 0;
    let cost = 0;
    for (const p of this.plants) {
      const l = this.ledgers.get(p.id);
      if (l === undefined) continue;
      earned += l.earned;
      cost += l.cost;
      let alternative: PlantReview['alternative'] = null;
      const spot = this.spot(p.spot);
      HUBS.forEach((hub, j) => {
        if (hub.id === p.hub) return;
        const km = distanceKm(spot, hub);
        const share = l.cost / Math.max(1, p.yearlyCost);
        const altProfit = (l.whatIf[j] ?? 0) - plantYearlyCost(p.kind, p.mw, km) * share;
        if (alternative === null || altProfit > alternative.profit) alternative = { hub: hub.id, profit: altProfit, km };
      });
      plants.push({
        id: p.id,
        kind: p.kind,
        spot: p.spot,
        hub: p.hub,
        mw: p.mw,
        removed: p.removedAt !== null,
        mwh: l.mwh,
        earned: l.earned,
        cost: l.cost,
        profit: l.earned - l.cost,
        earnedPrice: l.mwh > 1e-9 ? l.earned / l.mwh : null,
        alternative,
      });
    }
    const batteries: BatteryReview[] = [];
    this.batteryLedgers.forEach((bl, i) => {
      if (bl.cost <= 0 && bl.earned === 0) return;
      earned += bl.earned;
      cost += bl.cost;
      batteries.push({
        hub: HUBS[i]?.id ?? '',
        units: this.ownedBatteryUnits(this.now - 1, i),
        earned: bl.earned,
        cost: bl.cost,
        plantsDelta: bl.plantsDelta,
        chargedMwh: bl.chargedMwh,
        dischargedMwh: bl.dischargedMwh,
      });
    });
    const profit = earned - cost - this.otherCost;
    this.money += profit;
    this.reviews.push({
      year: this.year,
      mood: this.nat.mood,
      nationalMean: this.natSum / Math.max(1, this.yearHours),
      earned,
      cost,
      profit,
      other: this.otherCost,
      plants,
      batteries,
      hubs: HUBS.map((hub, i) => {
        const hy = this.hubYear[i];
        return {
          hub: hub.id,
          meanPrice: (hy?.priceSum ?? 0) / Math.max(1, this.yearHours),
          floodedHours: hy?.flooded ?? 0,
          hungryHours: hy?.hungry ?? 0,
          playerMwh: hy?.playerMwh ?? 0,
        };
      }),
    });
    this.status = 'yearEnd';
  }

  // -------------------------------------------------------------------------
  // The window

  private pushRing(h: number, final: { price: Float64Array; flow: Float64Array }, without: { price: Float64Array }, national: number): void {
    const slot = this.ringHead;
    for (let i = 0; i < HUB_COUNT; i++) {
      const k = slot * HUB_COUNT + i;
      this.ringPrice[k] = final.price[i] ?? 0;
      this.ringWithout[k] = without.price[i] ?? 0;
      this.ringPlayer[k] = this.playerOut[i] ?? 0;
      this.ringDemand[k] = this.demand[i] ?? 0;
      this.ringFlow[k] = Math.abs(final.flow[i] ?? 0);
    }
    this.ringNational[slot] = national;
    this.ringHod[slot] = h % 24;
    this.ringHead = (this.ringHead + 1) % WINDOW_HOURS;
    this.ringCount = Math.min(WINDOW_HOURS, this.ringCount + 1);
  }

  /** The hub's typical day: each hour of the day averaged over the last 4 weeks. */
  typicalDay(i: number): TypicalDay {
    const sums = { price: zeros(), national: zeros(), without: zeros(), player: zeros(), demand: zeros(), n: zeros() };
    let flooded = 0;
    let hungry = 0;
    for (let s = 0; s < this.ringCount; s++) {
      const hod = this.ringHod[s] ?? 0;
      const k = s * HUB_COUNT + i;
      const p = this.ringPrice[k] ?? 0;
      const nat = this.ringNational[s] ?? 0;
      add(sums.price, hod, p);
      add(sums.national, hod, nat);
      add(sums.without, hod, this.ringWithout[k] ?? 0);
      add(sums.player, hod, this.ringPlayer[k] ?? 0);
      add(sums.demand, hod, this.ringDemand[k] ?? 0);
      add(sums.n, hod, 1);
      if (p < nat - SEPARATED_EUR) flooded++;
      else if (p > nat + SEPARATED_EUR) hungry++;
    }
    const avg = (a: number[]): number[] => a.map((v, hod) => v / Math.max(1, sums.n[hod] ?? 0));
    const price = avg(sums.price);
    const national = avg(sums.national);
    let worstHour = 0;
    let worstGap = 0;
    price.forEach((p, hod) => {
      const gap = p - (national[hod] ?? 0);
      if (Math.abs(gap) > Math.abs(worstGap)) {
        worstGap = gap;
        worstHour = hod;
      }
    });
    const mean = (a: number[]): number => a.reduce((x, y) => x + y, 0) / 24;
    const without = avg(sums.without);
    return {
      hours: this.ringCount,
      price,
      national,
      withoutYou: without,
      playerMw: avg(sums.player),
      demandMw: avg(sums.demand),
      worstHour,
      worstKind: Math.abs(worstGap) < SEPARATED_EUR ? null : worstGap < 0 ? 'flooded' : 'hungry',
      meanPrice: mean(price),
      meanNational: mean(national),
      meanWithoutYou: mean(without),
      floodedShare: flooded / Math.max(1, this.ringCount),
      hungryShare: hungry / Math.max(1, this.ringCount),
    };
  }

  hubStatus(i: number): HubStatus {
    const hub = HUBS[i] as HubDef;
    let pSum = 0;
    let nSum = 0;
    let flowSum = 0;
    for (let s = 0; s < this.ringCount; s++) {
      pSum += this.ringPrice[s * HUB_COUNT + i] ?? 0;
      nSum += this.ringNational[s] ?? 0;
      flowSum += this.ringFlow[s * HUB_COUNT + i] ?? 0;
    }
    const ratio = Math.abs(nSum) > 1e-9 ? pSum / nSum : 1;
    const colour: Colour = ratio < COLOUR.blueBelow ? 'blue' : ratio > COLOUR.redAbove ? 'red' : 'green';
    const playerMw = this.playerRoom(hub.id);
    return {
      hub,
      colour,
      ratio,
      roomUsedMw: playerMw + (this.backgroundMw[i] ?? 0),
      playerMw,
      backgroundMw: this.backgroundMw[i] ?? 0,
      batteries: this.ownedBatteryUnits(this.now, i),
      linkUse: this.ringCount > 0 ? flowSum / this.ringCount / hub.linkMw : 0,
    };
  }

  /** The national price's mean over the window. */
  nationalMean(): number {
    let s = 0;
    for (let k = 0; k < this.ringCount; k++) s += this.ringNational[k] ?? 0;
    return s / Math.max(1, this.ringCount);
  }

  /**
   * Estimated yearly profit of the player's plants and batteries (every one
   * still owned, counted as running), plus optional extras, over every
   * `everyNthDay`-th day of this year's national prices and weather, at
   * today's background. A planner's tool: it sees the whole year, which a
   * player does not.
   */
  estimatePortfolio(
    extraPlants: readonly { kind: PlantKind; spot: string; hub: string; mw: number }[] = [],
    extraBatteries: readonly string[] = [],
    everyNthDay = 6,
    without: readonly string[] = [],
  ): number {
    const plants: PlantLike[] = this.plants.filter((p) => p.removedAt === null && !without.includes(p.id));
    for (const e of extraPlants) plants.push({ ...e, readyAt: 0, removedAt: null });
    const units = new Array<number>(HUB_COUNT).fill(0);
    for (const b of this.batteries) if (b.removedAt === null) bump(units, hubIndex(b.hub));
    for (const hb of extraBatteries) bump(units, hubIndex(hb));
    const days = Math.floor(this.nat.hours / 24);
    let revenue = 0;
    let sampled = 0;
    const soc = new Float64Array(HUB_COUNT);
    const supply = new Float64Array(HUB_COUNT);
    const demand = new Float64Array(HUB_COUNT);
    const cleared = newCleared();
    // Two-day blocks, empty batteries at the start, only the second day counted (no free charge).
    for (let d = 3; d < days; d += everyNthDay) {
      sampled++;
      soc.fill(0);
      for (let hh = -24; hh < 24; hh++) {
        const h = d * 24 + hh;
        const hod = (hh + 24) % 24;
        const counted = hh >= 0;
        this.hourInputs(h, plants, true);
        const national = this.nat.price[h] ?? 0;
        const floor = this.floorAt(h);
        for (let i = 0; i < HUB_COUNT; i++) supply[i] = (this.bgSupply[i] ?? 0) + (this.playerOut[i] ?? 0);
        clearHour(national, floor, supply, this.demand, cleared);
        for (let i = 0; i < HUB_COUNT; i++) {
          demand[i] = this.demand[i] ?? 0;
          const n = units[i] ?? 0;
          if (n === 0) continue;
          const [c, dd, s1] = batteryHour(n, soc[i] ?? 0, cleared.stuck[i] ?? 0, this.batteryPlan[i * 24 + hod] ?? 0, spareImport(i, cleared));
          demand[i] = (demand[i] ?? 0) + c;
          supply[i] = (supply[i] ?? 0) + dd;
          soc[i] = s1;
        }
        const charge = new Float64Array(HUB_COUNT);
        for (let i = 0; i < HUB_COUNT; i++) charge[i] = (demand[i] ?? 0) - (this.demand[i] ?? 0);
        const base = new Float64Array(HUB_COUNT);
        for (let i = 0; i < HUB_COUNT; i++) base[i] = (this.bgSupply[i] ?? 0) + (this.playerOut[i] ?? 0);
        clearHour(national, floor, supply, demand, cleared);
        for (let i = 0; i < HUB_COUNT; i++) {
          const disch = (supply[i] ?? 0) - (base[i] ?? 0);
          if (counted) revenue += ((this.playerOut[i] ?? 0) + disch - (charge[i] ?? 0)) * (cleared.price[i] ?? 0);
        }
      }
    }
    const scale = days / Math.max(1, sampled);
    let cost = 0;
    for (const p of plants) cost += plantYearlyCost(p.kind, p.mw, distanceKm(this.spot(p.spot), HUBS[hubIndex(p.hub)] as HubDef));
    for (const n of units) cost += n * COST.batteryPerUnitYear;
    return revenue * scale - cost;
  }

  // -------------------------------------------------------------------------
  // Plants, room and money

  spot(id: string): Spot {
    const s = this.spots.find((ss) => ss.id === id);
    if (s === undefined) throw new Error(`no spot ${id}`);
    return s;
  }

  isRevealed(spotId: string): boolean {
    return this.scouted.has(spotId);
  }

  /** MW the player holds at a hub, including plants still being built. */
  playerRoom(hubId: string): number {
    let mw = 0;
    for (const p of this.plants) if (p.hub === hubId && p.removedAt === null) mw += p.mw;
    return mw;
  }

  freeRoom(hubId: string): number {
    const i = hubIndex(hubId);
    const hub = HUBS[i] as HubDef;
    return Math.max(0, hub.roomMw - this.playerRoom(hubId) - (this.backgroundMw[i] ?? 0));
  }

  spotUsed(spotId: string): number {
    let mw = 0;
    for (const p of this.plants) if (p.spot === spotId && p.removedAt === null) mw += p.mw;
    return mw;
  }

  spotFree(spotId: string): number {
    return Math.max(0, this.spot(spotId).sizeMw - this.spotUsed(spotId));
  }

  /** Largest plant (in blocks) that fits the spot and the hub's room. */
  maxBuild(spotId: string, hubId: string): number {
    const mw = Math.min(this.spotFree(spotId), this.freeRoom(hubId));
    return Math.floor(mw / BLOCK_MW + 1e-9) * BLOCK_MW;
  }

  private ownedBatteryUnits(abs: number, i: number): number {
    const id = HUBS[i]?.id;
    let n = 0;
    for (const b of this.batteries) if (b.hub === id && b.orderedAt <= abs && (b.removedAt === null || b.removedAt > abs)) n++;
    return n;
  }

  private activeBatteryUnits(abs: number): number[] {
    const out = new Array<number>(HUB_COUNT).fill(0);
    for (const b of this.batteries) {
      if (b.readyAt > abs || (b.removedAt !== null && b.removedAt <= abs)) continue;
      const i = hubIndex(b.hub);
      out[i] = (out[i] ?? 0) + 1;
    }
    return out;
  }

  /** Profit so far this year (earned less costs), for the money display. */
  yearToDate(): { earned: number; cost: number; profit: number } {
    let earned = 0;
    let cost = 0;
    for (const l of this.ledgers.values()) {
      earned += l.earned;
      cost += l.cost;
    }
    for (const bl of this.batteryLedgers) {
      earned += bl.earned;
      cost += bl.cost;
    }
    return { earned, cost, profit: earned - cost - this.otherCost };
  }

  /** Score: everything earned less everything paid, so far. */
  get score(): number {
    return this.money + (this.status === 'running' ? this.yearToDate().profit : 0) - (this.settings.unlimitedMoney ? 0 : STARTING_CASH_LIMITED);
  }

  /** This year's ledger for one plant, so far. */
  plantSoFar(id: string): { mwh: number; earned: number; cost: number } | null {
    const l = this.ledgers.get(id);
    return l === undefined ? null : { mwh: l.mwh, earned: l.earned, cost: l.cost };
  }

  private canAfford(yearlyCost: number): boolean {
    return this.settings.unlimitedMoney || this.money + this.yearToDate().profit >= yearlyCost;
  }

  // -------------------------------------------------------------------------
  // Actions

  /** Apply a player action now. Returns null, or why it cannot be done. */
  act(action: Action): string | null {
    if (this.status === 'over') return 'The run is over.';
    const why = this.apply(action);
    if (why === null) this.actions.push({ hour: this.now, action });
    return why;
  }

  private apply(a: Action): string | null {
    const now = this.now;
    switch (a.type) {
      case 'scout': {
        const s = this.spot(a.spot);
        if (this.scouted.has(s.id)) return `${s.name} is already scouted.`;
        if (this.scouting.has(s.id)) return `${s.name} is being scouted.`;
        if (!this.canAfford(COST.scout)) return 'Not enough money.';
        this.scouting.set(s.id, now + DAYS.scout * 24);
        this.otherCost += COST.scout;
        return null;
      }
      case 'build': {
        const s = this.spot(a.spot);
        const hub = HUBS[hubIndex(a.hub)] as HubDef;
        if (!(a.mw > 0) || Math.abs(a.mw / BLOCK_MW - Math.round(a.mw / BLOCK_MW)) > 1e-9) return `Plants come in blocks of ${BLOCK_MW} MW.`;
        if (a.mw > this.spotFree(s.id) + 1e-9) return `${s.name} has room for ${this.spotFree(s.id)} MW more.`;
        if (a.mw > this.freeRoom(hub.id) + 1e-9) return `${hub.name} has ${Math.floor(this.freeRoom(hub.id))} MW of room left.`;
        const km = distanceKm(s, hub);
        const yearlyCost = plantYearlyCost(a.kind, a.mw, km);
        if (!this.canAfford(yearlyCost)) return 'Not enough money.';
        const days = a.kind === 'wind' ? DAYS.wind : DAYS.solar;
        this.plants.push({
          id: `p${this.nextId++}`,
          kind: a.kind,
          spot: s.id,
          hub: hub.id,
          mw: a.mw,
          km,
          yearlyCost,
          orderedAt: now,
          readyAt: now + days * 24,
          removedAt: null,
        });
        // Building on a spot reveals it.
        this.scouting.delete(s.id);
        this.scouted.add(s.id);
        return null;
      }
      case 'remove': {
        const p = this.plants.find((pp) => pp.id === a.plant);
        if (p === undefined || p.removedAt !== null) return 'No such plant.';
        p.removedAt = now;
        this.otherCost += p.yearlyCost * COST.removeShareOfYear;
        return null;
      }
      case 'battery': {
        hubIndex(a.hub);
        if (!this.canAfford(COST.batteryPerUnitYear)) return 'Not enough money.';
        this.batteries.push({ id: `b${this.nextId++}`, hub: a.hub, orderedAt: now, readyAt: now + DAYS.battery * 24, removedAt: null });
        return null;
      }
      case 'removeBattery': {
        const b = [...this.batteries].reverse().find((bb) => bb.hub === a.hub && bb.removedAt === null);
        if (b === undefined) return 'No battery there.';
        b.removedAt = now;
        this.otherCost += COST.batteryPerUnitYear * COST.removeShareOfYear;
        const i = hubIndex(a.hub);
        const left = this.batteries.filter((bb) => bb.hub === a.hub && bb.removedAt === null).length;
        this.soc[i] = Math.min(this.soc[i] ?? 0, left * BATTERY.mwh);
        return null;
      }
    }
  }

  private pushNews(kind: NewsItem['kind'], text: string): void {
    this.news.push({ hour: this.now, text, kind });
  }
}

export function hubIndex(id: string): number {
  const i = HUBS.findIndex((h) => h.id === id);
  if (i < 0) throw new Error(`no hub ${id}`);
  return i;
}

export function hubName(id: string): string {
  return HUBS[hubIndex(id)]?.name ?? id;
}

/**
 * The battery's simple rule: "charge when blue, discharge when red". Blue is
 * an hour the hub is flooded right now, or one of the cheapest hours of its
 * typical day; red is one of the dearest hours of its typical day (as many
 * as it takes to empty the battery). In a
 * cheap hour it charges only as far as its link can bring the power in
 * (`spareImport`, MW), so it does not make its own hub hungry. Returns
 * [charge MW, discharge MW, stored MWh after].
 */
export function batteryHour(units: number, soc: number, stuck: number, plan: number, spareImport: number): [number, number, number] {
  const power = units * BATTERY.mw;
  const cap = units * BATTERY.mwh;
  const s = Math.min(soc, cap);
  if (stuck > 1e-9 || (stuck >= -1e-9 && plan > 0)) {
    const limit = stuck > 1e-9 ? power : Math.min(power, Math.max(0, spareImport));
    const c = Math.max(0, Math.min(limit, (cap - s) / BATTERY.efficiency));
    return [c, 0, s + c * BATTERY.efficiency];
  }
  if (plan < 0) {
    const d = Math.max(0, Math.min(power, s));
    return [0, d, s - d];
  }
  return [0, 0, s];
}

/** Hours to fill and to empty one battery at full power. */
export const CHARGE_HOURS = Math.ceil(BATTERY.mwh / BATTERY.mw / BATTERY.efficiency);
export const DISCHARGE_HOURS = Math.ceil(BATTERY.mwh / BATTERY.mw);

/** Blue and red hours of a typical day: its cheapest and dearest hours, if the spread is worth trading. */
export function batteryPlanFor(price: readonly number[]): number[] {
  const plan = new Array<number>(24).fill(0);
  const order = price.map((p, hod) => ({ p, hod })).sort((a, b) => a.p - b.p || a.hod - b.hod);
  const lo = order[0]?.p ?? 0;
  const hi = order[order.length - 1]?.p ?? 0;
  if (!(hi - lo >= BATTERY.minSpread)) return plan;
  for (const o of order.slice(0, CHARGE_HOURS)) plan[o.hod] = 1;
  for (const o of order.slice(order.length - DISCHARGE_HOURS)) plan[o.hod] = -1;
  return plan;
}

/** MW more a hub could import over its own link this hour. */
function spareImport(i: number, c: Cleared): number {
  return (HUBS[i]?.linkMw ?? 0) + (c.flow[i] ?? 0);
}

function bump(a: number[], i: number): void {
  a[i] = (a[i] ?? 0) + 1;
}

function zeros(): number[] {
  return new Array<number>(24).fill(0);
}

function add(a: number[], i: number, v: number): void {
  a[i] = (a[i] ?? 0) + v;
}

function pct(q: number): string {
  return `${Math.round(q * 100)}%`;
}
