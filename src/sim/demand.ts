/**
 * Hourly demand: a daily shape (weekday and weekend), a weekly rhythm, a
 * seasonal cycle and a little seeded day-to-day noise (cold spells), scaled
 * so the year sums to the zone's annual demand.
 *
 * The daily shapes are generic European placeholders; the real pipeline will
 * fit them on ENTSO-E load data (report: "Demand, fuels, carbon and the
 * pre-market era use statistics plus shapes").
 */
import { dayOfWeek, daysInYear } from './calendar';
import type { ZoneInput } from './inputs';
import { interp } from './inputs';
import { Rng, hashString } from './rng';

const STREAM_DEMAND = 7;

/** Relative load by hour of a weekday (mean about 1). Placeholder shape. */
const WEEKDAY_SHAPE = [
  0.8, 0.76, 0.74, 0.73, 0.74, 0.78, 0.88, 0.99, 1.08, 1.11, 1.12, 1.12, 1.09, 1.07, 1.06, 1.05, 1.07, 1.12, 1.16, 1.14, 1.08, 1.01,
  0.93, 0.85,
];
/** Relative load by hour of a weekend day. Placeholder shape. */
const WEEKEND_SHAPE = [
  0.82, 0.78, 0.75, 0.73, 0.73, 0.74, 0.78, 0.85, 0.94, 1.02, 1.06, 1.08, 1.07, 1.03, 1.0, 0.99, 1.02, 1.08, 1.13, 1.12, 1.07, 1.01,
  0.94, 0.87,
];

/** Hourly demand in MW for one zone and year. */
export function demandSeries(zone: ZoneInput, year: number, seed: number): Float64Array {
  const days = daysInYear(year);
  const hours = days * 24;
  const out = new Float64Array(hours);
  const shape = zone.demandShape;
  // The stream id hashes the whole zone id, so every zone has its own noise (DK1 ≠ DK2 ≠ SE1 …).
  const rng = Rng.fromSeed(seed, year, STREAM_DEMAND, hashString(zone.id));
  const phi = 0.7;
  let latent = 0;
  for (let k = 0; k < 20; k++) latent = phi * latent + Math.sqrt(1 - phi * phi) * rng.gaussian();
  let sum = 0;
  for (let d = 0; d < days; d++) {
    latent = phi * latent + Math.sqrt(1 - phi * phi) * rng.gaussian();
    const noise = Math.exp(shape.dailyNoise * latent - shape.dailyNoise ** 2 / 2);
    const season = Math.cos((2 * Math.PI * (d - 15)) / 365.25);
    const summer = Math.max(0, -Math.cos((2 * Math.PI * (d - 15)) / 365.25));
    const seasonal = 1 + shape.seasonalAmplitude * season + shape.summerBump * summer * summer;
    const weekend = dayOfWeek(year, d) >= 5;
    const daily = weekend ? WEEKEND_SHAPE : WEEKDAY_SHAPE;
    const weekFactor = weekend ? shape.weekendFactor : 1;
    for (let hod = 0; hod < 24; hod++) {
      const v = (daily[hod] ?? 1) * seasonal * weekFactor * noise;
      out[d * 24 + hod] = v;
      sum += v;
    }
  }
  const annualMwh = interp(zone.demandTwh, year) * 1e6;
  const scale = sum > 0 ? annualMwh / sum : 0;
  for (let h = 0; h < hours; h++) out[h] = (out[h] ?? 0) * scale;
  return out;
}
