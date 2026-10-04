/**
 * Toy 2 "The board": one hub's day is the board. Each round is a year: plan
 * (buy or sell blocks of wind, solar and battery; drag battery energy from
 * cheap hours to dear ones), then run the year and see what it paid.
 * Rivals build where it pays and surprises shift the year. Pure and
 * deterministic: the same seed and the same actions give the same game.
 */
import { Rng } from '../../sim';
import { clearDay, greedyBattery, type LadderShift } from './market';
import {
  BATTERY_EFF,
  BATTERY_MWH,
  BLOCK_MW,
  COSTS,
  DAYS_PER_YEAR,
  DEMAND_GROWTH,
  DEMAND_MW,
  HOURS,
  KINDS,
  RIVAL_STEP,
  RIVAL_TRIGGER,
  RIVALS_MAX,
  RIVALS_START,
  SAMPLE_DAYS,
  SEASONS,
  SLICE_MWH,
  SOLAR_CF,
  WIND_CF,
  WIND_NOISE,
  YEARS,
  type Kind,
} from './tuning';

export type Blocks = Record<Kind, number>;

/** The player's battery plan for the typical day, MWh per hour (MW over one hour). */
export interface BatteryPlan {
  readonly charge: number[];
  readonly discharge: number[];
}

export interface Surprise {
  readonly id: 'quiet' | 'gas' | 'calm' | 'sunny' | 'datacentre' | 'coal' | 'cable';
  readonly title: string;
  readonly text: string;
}

/** What is known at the start of a year, before the player plans. */
export interface Conditions {
  readonly year: number;
  readonly demandFactor: number;
  readonly extraDemandMw: number;
  readonly shift: LadderShift;
  readonly windFactor: number;
  readonly sunFactor: number;
  readonly surprise: Surprise | null;
  readonly rivalNews: readonly string[];
}

export interface KindResult {
  readonly mwh: number;
  readonly earned: number;
  readonly cost: number;
  readonly profit: number;
  /** Euro earned per MWh produced (for the battery: per MWh discharged). */
  readonly perMwh: number;
}

/** One day on the board: the layers drawn and the prices paid. */
export interface DayView {
  readonly label: string;
  readonly demand: number[];
  readonly playerWind: number[];
  readonly playerSolar: number[];
  readonly rivalRenewables: number[];
  readonly playerBattery: number[];
  readonly rivalBattery: number[];
  readonly price: number[];
}

export interface Outlook {
  readonly day: DayView;
  /** The same day without any of the player's plants or battery: the price the player is pulling down. */
  readonly priceWithoutYou: number[];
  readonly byKind: Readonly<Record<Kind, KindResult>>;
  readonly profit: number;
  /** Time-weighted average hub price, with and without the player. */
  readonly hubAverage: number;
  readonly hubAverageWithoutYou: number;
}

export interface YearResult {
  readonly year: number;
  readonly days: readonly DayView[];
  readonly byKind: Readonly<Record<Kind, KindResult>>;
  readonly profit: number;
  readonly forecastProfit: number;
  readonly hubAverage: number;
  readonly surprise: Surprise | null;
  readonly blocks: Blocks;
}

export interface BoardState {
  readonly seed: number;
  /** 1 … YEARS while playing; YEARS + 1 when over. */
  year: number;
  over: boolean;
  blocks: Blocks;
  plan: BatteryPlan;
  /** Everyone else's capacity, MW. */
  rivals: Blocks;
  /** Changes that stay once they happen. */
  permanent: { dataCentreMw: number; coalClosedMw: number; linkPull: number; used: string[] };
  conditions: Conditions;
  /** Money made so far: earnings minus yearly costs minus build fees. */
  profit: number;
  history: YearResult[];
}

const STREAM_EVENTS = 101;
const STREAM_WEATHER = 202;

const zeros = (): number[] => new Array<number>(HOURS).fill(0);
const emptyPlan = (): BatteryPlan => ({ charge: zeros(), discharge: zeros() });

export function newGame(seed: number): BoardState {
  const state: BoardState = {
    seed: seed >>> 0,
    year: 1,
    over: false,
    blocks: { wind: 0, solar: 0, battery: 0 },
    plan: emptyPlan(),
    rivals: { ...RIVALS_START },
    permanent: { dataCentreMw: 0, coalClosedMw: 0, linkPull: 0, used: [] },
    conditions: {
      year: 1,
      demandFactor: 1,
      extraDemandMw: 0,
      shift: { gasFactor: 1, coalClosedMw: 0, linkPull: 0, linkPrice: 45 },
      windFactor: 1,
      sunFactor: 1,
      surprise: null,
      rivalNews: ['Nordhav runs the hub today: 20 MW of wind, 10 MW of solar and its old coal and gas plants.'],
    },
    profit: 0,
    history: [],
  };
  return state;
}

// ---------------------------------------------------------------- actions

export function batteryPowerMw(state: BoardState): number {
  return state.blocks.battery * BLOCK_MW;
}
export function batteryEnergyMwh(state: BoardState): number {
  return state.blocks.battery * BATTERY_MWH;
}
export function storedMwh(plan: BatteryPlan): number {
  return plan.charge.reduce((a, b) => a + b, 0);
}

export function buy(state: BoardState, kind: Kind): boolean {
  if (state.over) return false;
  state.blocks[kind] += 1;
  state.profit -= COSTS[kind].build;
  return true;
}

/** Sell a block. The build fee is gone; the yearly cost stops. Selling a battery clears its plan if it no longer fits. */
export function sell(state: BoardState, kind: Kind): boolean {
  if (state.over || state.blocks[kind] <= 0) return false;
  state.blocks[kind] -= 1;
  if (kind === 'battery' && !planFits(state.plan, batteryPowerMw(state), batteryEnergyMwh(state))) state.plan = emptyPlan();
  return true;
}

function planFits(plan: BatteryPlan, powerMw: number, energyMwh: number): boolean {
  if (storedMwh(plan) > energyMwh + 1e-9) return false;
  for (let h = 0; h < HOURS; h++) {
    if ((plan.charge[h] ?? 0) > powerMw + 1e-9 || (plan.discharge[h] ?? 0) > powerMw + 1e-9) return false;
  }
  return true;
}

export type MoveResult = 'ok' | 'no-battery' | 'same-hour' | 'full' | 'charge-limit' | 'discharge-limit';

/** Drag one slice of energy: charge it in hour `from`, give it back (minus losses) in hour `to`. */
export function moveEnergy(state: BoardState, from: number, to: number): MoveResult {
  if (state.blocks.battery <= 0) return 'no-battery';
  if (from === to) return 'same-hour';
  if (storedMwh(state.plan) + SLICE_MWH > batteryEnergyMwh(state) + 1e-9) return 'full';
  const power = batteryPowerMw(state);
  if ((state.plan.charge[from] ?? 0) + SLICE_MWH > power + 1e-9) return 'charge-limit';
  if ((state.plan.discharge[to] ?? 0) + SLICE_MWH * BATTERY_EFF > power + 1e-9) return 'discharge-limit';
  state.plan.charge[from] = (state.plan.charge[from] ?? 0) + SLICE_MWH;
  state.plan.discharge[to] = (state.plan.discharge[to] ?? 0) + SLICE_MWH * BATTERY_EFF;
  return 'ok';
}

export function clearPlan(state: BoardState): void {
  state.plan = emptyPlan();
}

// ---------------------------------------------------------------- the day

interface Weather {
  readonly wind: number;
  readonly sun: number;
  readonly demand: number;
}

function netPlan(plan: BatteryPlan): number[] {
  return Array.from({ length: HOURS }, (_, h) => (plan.discharge[h] ?? 0) - (plan.charge[h] ?? 0));
}

function buildDay(state: BoardState, w: Weather, withPlayer: boolean, label: string): DayView {
  const c = state.conditions;
  const demand = DEMAND_MW.map((d) => d * c.demandFactor * w.demand + c.extraDemandMw);
  const windCf = WIND_CF.map((cf) => cf * c.windFactor * w.wind);
  const sunCf = SOLAR_CF.map((cf) => cf * c.sunFactor * w.sun);
  const pw = withPlayer ? state.blocks.wind * BLOCK_MW : 0;
  const ps = withPlayer ? state.blocks.solar * BLOCK_MW : 0;
  const playerWind = windCf.map((cf) => pw * cf);
  const playerSolar = sunCf.map((cf) => ps * cf);
  const rivalRenewables = windCf.map((cf, h) => state.rivals.wind * cf + state.rivals.solar * (sunCf[h] ?? 0));
  const playerBattery = withPlayer ? netPlan(state.plan) : zeros();
  // Rivals' batteries follow a rule on the prices they see without themselves.
  const firstPass = clearDay({ demand, playerWind, playerSolar, rivalRenewables, playerBattery, rivalBattery: zeros(), shift: c.shift });
  const rivalBattery = greedyBattery(firstPass.price, state.rivals.battery, state.rivals.battery * (BATTERY_MWH / BLOCK_MW), BATTERY_EFF, SLICE_MWH);
  const { price } = clearDay({ demand, playerWind, playerSolar, rivalRenewables, playerBattery, rivalBattery, shift: c.shift });
  return { label, demand, playerWind, playerSolar, rivalRenewables, playerBattery, rivalBattery, price };
}

function sum(xs: readonly number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function dayEarnings(day: DayView): Record<Kind, { mwh: number; earned: number }> {
  let wE = 0;
  let sE = 0;
  let bE = 0;
  let bOut = 0;
  for (let h = 0; h < HOURS; h++) {
    const p = day.price[h] ?? 0;
    wE += (day.playerWind[h] ?? 0) * p;
    sE += (day.playerSolar[h] ?? 0) * p;
    const b = day.playerBattery[h] ?? 0;
    bE += b * p;
    if (b > 0) bOut += b;
  }
  return {
    wind: { mwh: sum(day.playerWind), earned: wE },
    solar: { mwh: sum(day.playerSolar), earned: sE },
    battery: { mwh: bOut, earned: bE },
  };
}

function summarise(blocks: Blocks, totals: Record<Kind, { mwh: number; earned: number }>): Record<Kind, KindResult> {
  const out = {} as Record<Kind, KindResult>;
  for (const k of KINDS) {
    const t = totals[k];
    const cost = blocks[k] * COSTS[k].yearly;
    out[k] = { mwh: t.mwh, earned: t.earned, cost, profit: t.earned - cost, perMwh: t.mwh > 1e-9 ? t.earned / t.mwh : 0 };
  }
  return out;
}

/**
 * What the coming year looks like at today's plans: the twelve seasonal days
 * at normal weather (no noise), so the forecast and the year agree on average.
 * The board draws their average, hour by hour: the hub's typical day.
 */
export function outlook(state: BoardState): Outlook {
  const days: DayView[] = [];
  const without: DayView[] = [];
  // Each month twice, a windier and a calmer day (one standard deviation either
  // side), so the forecast carries the year's weather swings and agrees with
  // the reveal on average.
  for (let m = 0; m < SAMPLE_DAYS; m++) {
    for (const swing of [1 - WIND_NOISE, 1 + WIND_NOISE]) {
      const w = seasonWeather(m, swing, 1);
      days.push(buildDay(state, w, true, SEASONS[m % SEASONS.length]!.month));
      without.push(buildDay(state, w, false, 'Without you'));
    }
  }
  const day = averageDay(days, 'Typical day');
  const priceWithoutYou = averageDay(without, 'Without you').price;
  const totals: Record<Kind, { mwh: number; earned: number }> = { wind: { mwh: 0, earned: 0 }, solar: { mwh: 0, earned: 0 }, battery: { mwh: 0, earned: 0 } };
  const scale = DAYS_PER_YEAR / days.length;
  for (const d of days) {
    const e = dayEarnings(d);
    for (const k of KINDS) {
      totals[k].mwh += e[k].mwh * scale;
      totals[k].earned += e[k].earned * scale;
    }
  }
  const byKind = summarise(state.blocks, totals);
  return {
    day,
    priceWithoutYou,
    byKind,
    profit: KINDS.reduce((a, k) => a + byKind[k].profit, 0),
    hubAverage: sum(day.price) / HOURS,
    hubAverageWithoutYou: sum(priceWithoutYou) / HOURS,
  };
}

function averageDay(days: readonly DayView[], label: string): DayView {
  const n = days.length;
  const avg = (pick: (d: DayView) => readonly number[]): number[] =>
    Array.from({ length: HOURS }, (_, h) => days.reduce((a, d) => a + (pick(d)[h] ?? 0), 0) / n);
  return {
    label,
    demand: avg((d) => d.demand),
    playerWind: avg((d) => d.playerWind),
    playerSolar: avg((d) => d.playerSolar),
    rivalRenewables: avg((d) => d.rivalRenewables),
    playerBattery: avg((d) => d.playerBattery),
    rivalBattery: avg((d) => d.rivalBattery),
    price: avg((d) => d.price),
  };
}

function seasonWeather(m: number, windNoise: number, sunNoise: number): Weather {
  const s = SEASONS[m % SEASONS.length]!;
  return { wind: (s.wind / MEAN_WIND) * windNoise, sun: (s.sun / MEAN_SUN) * sunNoise, demand: s.demand / MEAN_DEMAND };
}

const MEAN_WIND = SEASONS.reduce((a, s) => a + s.wind, 0) / SEASONS.length;
const MEAN_SUN = SEASONS.reduce((a, s) => a + s.sun, 0) / SEASONS.length;
const MEAN_DEMAND = SEASONS.reduce((a, s) => a + s.demand, 0) / SEASONS.length;

/** Play the year out over twelve sample days (one a month) and book the money. */
export function runYear(state: BoardState): YearResult {
  if (state.over) throw new Error('the game is over');
  const forecast = outlook(state);
  const rng = Rng.fromSeed(state.seed, STREAM_WEATHER, state.year);
  const days: DayView[] = [];
  const totals: Record<Kind, { mwh: number; earned: number }> = { wind: { mwh: 0, earned: 0 }, solar: { mwh: 0, earned: 0 }, battery: { mwh: 0, earned: 0 } };
  const scale = DAYS_PER_YEAR / SAMPLE_DAYS;
  let priceSum = 0;
  for (let m = 0; m < SAMPLE_DAYS; m++) {
    const w = seasonWeather(m, Math.max(0.1, 1 + WIND_NOISE * rng.gaussian()), Math.max(0.3, 1 + 0.15 * rng.gaussian()));
    const day = buildDay(state, w, true, SEASONS[m % SEASONS.length]!.month);
    days.push(day);
    const e = dayEarnings(day);
    for (const k of KINDS) {
      totals[k].mwh += e[k].mwh * scale;
      totals[k].earned += e[k].earned * scale;
    }
    priceSum += sum(day.price);
  }
  const byKind = summarise(state.blocks, totals);
  const profit = KINDS.reduce((a, k) => a + byKind[k].profit, 0);
  const result: YearResult = {
    year: state.year,
    days,
    byKind,
    profit,
    forecastProfit: forecast.profit,
    hubAverage: priceSum / (HOURS * SAMPLE_DAYS),
    surprise: state.conditions.surprise,
    blocks: { ...state.blocks },
  };
  state.profit += profit;
  state.history.push(result);
  state.year += 1;
  if (state.year > YEARS) {
    state.over = true;
  } else {
    nextConditions(state, result);
  }
  return result;
}

// ---------------------------------------------------------------- rivals and surprises

const SURPRISES: readonly (Surprise & { readonly weight: number; readonly once: boolean })[] = [
  { id: 'quiet', title: 'A quiet year', text: 'Nothing unusual is expected.', weight: 3, once: false },
  { id: 'gas', title: 'Gas crisis', text: 'Gas costs more than double this year: the gas plants and imports set much higher prices.', weight: 2, once: false },
  { id: 'calm', title: 'A calm year', text: 'Forecasters expect a quarter less wind than usual this year.', weight: 2, once: false },
  { id: 'sunny', title: 'A sunny year', text: 'A fifth more sun than usual is expected this year.', weight: 2, once: false },
  { id: 'datacentre', title: 'A data centre opens', text: 'A data centre joins the hub: 15 MW more demand, day and night, from now on.', weight: 2, once: true },
  { id: 'coal', title: 'The old coal plant closes', text: 'The coal plant shuts for good: the gas plants take over sooner, and prices rise.', weight: 2, once: true },
  { id: 'cable', title: 'A new cable to Norway', text: 'A cable to Norway opens: prices are pulled toward Norway’s steadier price from now on.', weight: 2, once: true },
];

function drawSurprise(state: BoardState): Surprise {
  const rng = Rng.fromSeed(state.seed, STREAM_EVENTS, state.year);
  const open = SURPRISES.filter((s) => !(s.once && state.permanent.used.includes(s.id)));
  const total = open.reduce((a, s) => a + s.weight, 0);
  let x = rng.next() * total;
  for (const s of open) {
    x -= s.weight;
    if (x < 0) return { id: s.id, title: s.title, text: s.text };
  }
  const last = open[open.length - 1]!;
  return { id: last.id, title: last.title, text: last.text };
}

function nextConditions(state: BoardState, last: YearResult): void {
  // Rivals build where last year paid.
  const hourly = zeros();
  for (const d of last.days) for (let h = 0; h < HOURS; h++) hourly[h] = (hourly[h] ?? 0) + (d.price[h] ?? 0) / last.days.length;
  const midday = (hourly.slice(10, 16).reduce((a, b) => a + b, 0)) / 6;
  const mean = sum(hourly) / HOURS;
  const spread = Math.max(...hourly) - Math.min(...hourly);
  const news: string[] = [];
  const add = (k: Kind, mw: number, why: string): void => {
    const room = RIVALS_MAX[k] - state.rivals[k];
    const got = Math.max(0, Math.min(mw, room));
    if (got > 0) {
      state.rivals[k] += got;
      news.push(`Nordhav adds ${got} MW of ${k === 'battery' ? 'batteries' : k} (${why}).`);
    }
  };
  if (midday > RIVAL_TRIGGER.solar) add('solar', RIVAL_STEP.solar, `midday paid €${Math.round(midday)}/MWh last year`);
  if (mean > RIVAL_TRIGGER.wind) add('wind', RIVAL_STEP.wind, `the hub averaged €${Math.round(mean)}/MWh`);
  if (state.year >= 4 && spread > RIVAL_TRIGGER.battery) add('battery', RIVAL_STEP.battery, `the day's spread was €${Math.round(spread)}`);
  if (news.length === 0) news.push('Nordhav builds nothing this year: prices are too low to tempt it.');

  const surprise = drawSurprise(state);
  if (surprise.id === 'datacentre') state.permanent.dataCentreMw += 15;
  if (surprise.id === 'coal') state.permanent.coalClosedMw += 25;
  if (surprise.id === 'cable') state.permanent.linkPull = 0.3;
  if (['datacentre', 'coal', 'cable'].includes(surprise.id)) state.permanent.used.push(surprise.id);

  state.conditions = {
    year: state.year,
    demandFactor: Math.pow(1 + DEMAND_GROWTH, state.year - 1),
    extraDemandMw: state.permanent.dataCentreMw,
    shift: {
      gasFactor: surprise.id === 'gas' ? 2.2 : 1,
      coalClosedMw: state.permanent.coalClosedMw,
      linkPull: state.permanent.linkPull,
      linkPrice: 45,
    },
    windFactor: surprise.id === 'calm' ? 0.75 : 1,
    sunFactor: surprise.id === 'sunny' ? 1.2 : 1,
    surprise,
    rivalNews: news,
  };
}
