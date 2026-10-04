/**
 * Annual statistics per zone: price level and spread, negative-price hours,
 * generation and capture prices per technology.
 */
import { TECHS, type TechId } from './inputs';

export interface TechStat {
  readonly generationTwh: number;
  /** Generation-weighted average price earned, €/MWh; null when nothing was generated. */
  readonly capturePrice: number | null;
  /**
   * Capture price divided by the time-weighted mean price. Null when nothing
   * was generated, or when the mean price is at or below 1 €/MWh: a ratio to
   * a mean near or below zero flips sign or explodes and means nothing.
   */
  readonly captureRate: number | null;
  readonly capacityMw: number;
}

export interface ZoneStats {
  readonly zone: string;
  readonly year: number;
  readonly hours: number;
  /** Hours in which the hourly market was open (prices are market prices). */
  readonly marketHours: number;
  readonly meanPrice: number;
  readonly stdPrice: number;
  readonly minPrice: number;
  readonly maxPrice: number;
  readonly negativeHours: number;
  readonly zeroOrBelowHours: number;
  readonly capHours: number;
  readonly demandTwh: number;
  readonly unservedMwh: number;
  readonly curtailedTwh: number;
  readonly netExportTwh: number;
  readonly renewableShare: number;
  readonly byTech: Readonly<Record<TechId, TechStat>>;
}

export interface ZoneSeriesForStats {
  readonly zone: string;
  readonly year: number;
  readonly hours: number;
  readonly marketOpenFromHour: number;
  readonly price: Float64Array;
  readonly demand: Float64Array;
  readonly generation: Readonly<Record<string, Float64Array>>;
  readonly available: Readonly<Record<string, Float64Array>>;
  readonly unserved: Float64Array;
  readonly netExport: Float64Array;
  readonly capacityMw: Readonly<Record<string, number>>;
  readonly priceCap: number;
}

const RENEWABLE: readonly TechId[] = ['wind', 'solar', 'hydro_ror', 'hydro_res', 'biomass'];

/** Below this mean price (€/MWh) a capture rate is not defined (null). */
export const CAPTURE_RATE_MIN_MEAN_PRICE = 1;

export function zoneStats(z: ZoneSeriesForStats): ZoneStats {
  const n = z.hours;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let negative = 0;
  let zeroOrBelow = 0;
  let capHours = 0;
  let demandMwh = 0;
  let unservedMwh = 0;
  let netExportMwh = 0;
  for (let h = 0; h < n; h++) {
    const p = z.price[h] ?? 0;
    sum += p;
    if (p < min) min = p;
    if (p > max) max = p;
    if (p < 0) negative++;
    if (p <= 0) zeroOrBelow++;
    if (p >= z.priceCap - 1e-6) capHours++;
    demandMwh += z.demand[h] ?? 0;
    unservedMwh += z.unserved[h] ?? 0;
    netExportMwh += z.netExport[h] ?? 0;
  }
  const mean = n > 0 ? sum / n : 0;
  // Two passes over prices shifted by the first one: stable, and exactly 0 for a flat price.
  const shift = z.price[0] ?? 0;
  let shiftedSum = 0;
  for (let h = 0; h < n; h++) shiftedSum += (z.price[h] ?? 0) - shift;
  const shiftedMean = n > 0 ? shiftedSum / n : 0;
  let sumSqDev = 0;
  for (let h = 0; h < n; h++) {
    const d = (z.price[h] ?? 0) - shift - shiftedMean;
    sumSqDev += d * d;
  }
  const variance = n > 0 ? sumSqDev / n : 0;

  const byTech = {} as Record<TechId, TechStat>;
  let renewableMwh = 0;
  let totalMwh = 0;
  let curtailedMwh = 0;
  for (const t of TECHS) {
    const g = z.generation[t];
    let gen = 0;
    let revenue = 0;
    if (g !== undefined) {
      for (let h = 0; h < n; h++) {
        const v = g[h] ?? 0;
        gen += v;
        revenue += v * (z.price[h] ?? 0);
      }
    }
    const avail = z.available[t];
    if (avail !== undefined) {
      for (let h = 0; h < n; h++) curtailedMwh += Math.max(0, (avail[h] ?? 0) - (g?.[h] ?? 0));
    }
    if (RENEWABLE.includes(t)) renewableMwh += gen;
    if (t !== 'battery' && t !== 'pumped') totalMwh += gen;
    const capturePrice = gen > 1e-9 ? revenue / gen : null;
    byTech[t] = {
      generationTwh: gen / 1e6,
      capturePrice,
      captureRate: capturePrice !== null && mean > CAPTURE_RATE_MIN_MEAN_PRICE ? capturePrice / mean : null,
      capacityMw: z.capacityMw[t] ?? 0,
    };
  }

  return {
    zone: z.zone,
    year: z.year,
    hours: n,
    marketHours: Math.max(0, n - z.marketOpenFromHour),
    meanPrice: mean,
    stdPrice: Math.sqrt(variance),
    minPrice: n > 0 ? min : 0,
    maxPrice: n > 0 ? max : 0,
    negativeHours: negative,
    zeroOrBelowHours: zeroOrBelow,
    capHours,
    demandTwh: demandMwh / 1e6,
    unservedMwh,
    curtailedTwh: curtailedMwh / 1e6,
    netExportTwh: netExportMwh / 1e6,
    renewableShare: totalMwh > 0 ? renewableMwh / totalMwh : 0,
    byTech,
  };
}

/** Price-duration curve: prices sorted from highest to lowest. */
export function priceDuration(price: Float64Array): Float64Array {
  const sorted = Float64Array.from(price);
  sorted.sort();
  sorted.reverse();
  return sorted;
}

/** Average price by hour of day (24 values). */
export function meanByHourOfDay(price: Float64Array): number[] {
  const sums = new Array<number>(24).fill(0);
  const counts = new Array<number>(24).fill(0);
  for (let h = 0; h < price.length; h++) {
    const hod = h % 24;
    sums[hod] = (sums[hod] ?? 0) + (price[h] ?? 0);
    counts[hod] = (counts[hod] ?? 0) + 1;
  }
  return sums.map((s, i) => ((counts[i] ?? 0) > 0 ? s / (counts[i] ?? 1) : 0));
}
