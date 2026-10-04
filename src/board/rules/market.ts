/**
 * Clearing the hub, hour by hour: residual demand (demand minus wind, sun and
 * battery discharge, plus battery charging) climbs a short supply ladder.
 * Pure functions; every number from ./tuning is [tuning].
 */
import { FLOODED_PRICE, HOURS, LADDER, SCARCITY_PRICE } from './tuning';

/** Conditions that shift the ladder for a year. */
export interface LadderShift {
  /** Gas steps' prices are multiplied by this (a gas crisis raises it). */
  readonly gasFactor: number;
  /** Coal capacity removed, MW (a closed plant). Steps above slide down. */
  readonly coalClosedMw: number;
  /** Prices are pulled this share of the way toward `linkPrice` (a new cable). */
  readonly linkPull: number;
  readonly linkPrice: number;
}

export const NO_SHIFT: LadderShift = { gasFactor: 1, coalClosedMw: 0, linkPull: 0, linkPrice: 45 };

/** Price for one hour's residual demand, €/MWh. Never decreases as residual rises. */
export function clearPrice(residualMw: number, shift: LadderShift = NO_SHIFT): number {
  let raw: number;
  if (residualMw <= 0) {
    raw = FLOODED_PRICE;
  } else {
    raw = scarcity(shift);
    let lower = 0;
    for (let i = 0; i < LADDER.length; i++) {
      const step = LADDER[i]!;
      // The closure removes coal capacity: the coal step and everything above it ends earlier.
      const upper = i >= 1 ? Math.max(lower, step.toMw - shift.coalClosedMw) : step.toMw;
      if (residualMw <= upper) {
        const span = upper - lower;
        const at = span > 0 ? (residualMw - lower) / span : 1;
        const factor = step.gas ? shift.gasFactor : 1;
        raw = (step.from + (step.to - step.from) * at) * factor;
        break;
      }
      lower = upper;
    }
  }
  if (shift.linkPull > 0) raw = raw + shift.linkPull * (shift.linkPrice - raw);
  return raw;
}

function scarcity(shift: LadderShift): number {
  return SCARCITY_PRICE * Math.max(1, 0.5 + 0.5 * shift.gasFactor);
}

/** The hour-by-hour supply picture the board draws and the money is paid on. */
export interface DayInput {
  readonly demand: readonly number[];
  /** Wind and solar output of the player and of everyone else, MW per hour. */
  readonly playerWind: readonly number[];
  readonly playerSolar: readonly number[];
  readonly rivalRenewables: readonly number[];
  /** Battery net output per hour, MW: positive discharges, negative charges. */
  readonly playerBattery: readonly number[];
  readonly rivalBattery: readonly number[];
  readonly shift: LadderShift;
}

export interface DayResult {
  readonly residual: number[];
  readonly price: number[];
}

export function clearDay(input: DayInput): DayResult {
  const residual: number[] = [];
  const price: number[] = [];
  for (let h = 0; h < HOURS; h++) {
    const r =
      (input.demand[h] ?? 0) -
      (input.playerWind[h] ?? 0) -
      (input.playerSolar[h] ?? 0) -
      (input.rivalRenewables[h] ?? 0) -
      (input.playerBattery[h] ?? 0) -
      (input.rivalBattery[h] ?? 0);
    residual.push(r);
    price.push(clearPrice(r, input.shift));
  }
  return { residual, price };
}

/**
 * A simple battery rule (used for rivals and for the obvious bot): charge in
 * the cheapest hours and discharge in the dearest, one slice at a time, while
 * the spread still pays for the losses. Prices are taken as given (no feedback
 * within the day), which is what a rule-following fleet does.
 */
export function greedyBattery(prices: readonly number[], powerMw: number, energyMwh: number, eff: number, sliceMwh: number): number[] {
  const plan = new Array<number>(HOURS).fill(0);
  if (powerMw <= 0 || energyMwh <= 0) return plan;
  const order = prices.map((p, h) => ({ p, h }));
  const cheap = [...order].sort((a, b) => a.p - b.p || a.h - b.h);
  const dear = [...order].sort((a, b) => b.p - a.p || a.h - b.h);
  let stored = 0;
  let ci = 0;
  let di = 0;
  while (stored + sliceMwh <= energyMwh + 1e-9 && ci < HOURS && di < HOURS) {
    const c = cheap[ci]!;
    const d = dear[di]!;
    if (c.h === d.h || d.p * eff <= c.p) break;
    const chargeRoom = powerMw + (plan[c.h] ?? 0); // plan is negative while charging
    const dischargeRoom = powerMw - (plan[d.h] ?? 0);
    if (chargeRoom < sliceMwh - 1e-9) {
      ci++;
      continue;
    }
    if (dischargeRoom < sliceMwh * eff - 1e-9) {
      di++;
      continue;
    }
    plan[c.h] = (plan[c.h] ?? 0) - sliceMwh;
    plan[d.h] = (plan[d.h] ?? 0) + sliceMwh * eff;
    stored += sliceMwh;
  }
  return plan;
}
