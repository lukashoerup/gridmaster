/**
 * Weather behind an interface. The game will ship resampled real weather-years
 * (ERA5 / PECD) behind `WeatherSource`; until the data pipeline exists, the
 * `SyntheticWeather` placeholder generates seeded hourly wind and solar
 * capacity factors and hydro inflow with daily and seasonal shapes, multi-day
 * persistence (a daily AR(1) process) and cross-zone correlation.
 *
 * A different "weather year" is drawn for every (seed, year) pair, and each
 * one is reproducible on its own without generating the years before it.
 */
import { daysInYear, monthOfDay } from './calendar';
import type { WorldInputs, ZoneId, ZoneInput } from './inputs';
import { Rng } from './rng';

export interface WeatherYear {
  readonly year: number;
  readonly hours: number;
  /** Wind capacity factor 0..1 per zone and hour. */
  readonly wind: Readonly<Record<ZoneId, Float64Array>>;
  /** Solar capacity factor 0..1 per zone and hour. */
  readonly solar: Readonly<Record<ZoneId, Float64Array>>;
  /** Hydro inflow factor per hour (mean about 1 over a normal year); only zones with hydro. */
  readonly inflow: Readonly<Record<ZoneId, Float64Array>>;
}

export interface WeatherSource {
  readonly name: string;
  year(seed: number, year: number): WeatherYear;
}

// Stream ids so the sub-generators of one (seed, year) never overlap.
const STREAM_YEAR = 1;
const STREAM_DAILY = 2;
const STREAM_HOURLY = 3;
const STREAM_INFLOW = 4;

/** Lower-triangular Cholesky factor of a correlation matrix. Throws if it is not positive definite. */
export function cholesky(m: readonly (readonly number[])[]): number[][] {
  const n = m.length;
  const L: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = m[i]?.[j] ?? 0;
      for (let k = 0; k < j; k++) sum -= (L[i]?.[k] ?? 0) * (L[j]?.[k] ?? 0);
      const rowI = L[i];
      if (rowI === undefined) throw new Error('cholesky: bad row');
      if (i === j) {
        if (sum <= 1e-12) throw new Error('correlation matrix is not positive definite');
        rowI[j] = Math.sqrt(sum);
      } else {
        const ljj = L[j]?.[j] ?? 0;
        rowI[j] = sum / ljj;
      }
    }
  }
  return L;
}

function applyLower(L: number[][], eps: Float64Array, out: Float64Array): void {
  const n = L.length;
  for (let i = 0; i < n; i++) {
    let s = 0;
    const row = L[i];
    if (row === undefined) continue;
    for (let k = 0; k <= i; k++) s += (row[k] ?? 0) * (eps[k] ?? 0);
    out[i] = s;
  }
}

/** Sun elevation (radians) for a latitude, day of year and solar hour. */
function solarElevation(latDeg: number, doy: number, hour: number): number {
  const lat = (latDeg * Math.PI) / 180;
  const decl = ((23.44 * Math.PI) / 180) * Math.sin((2 * Math.PI * (doy - 80)) / 365.25);
  const hourAngle = ((hour - 12) * Math.PI) / 12;
  const sinEl = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
  return Math.asin(Math.max(-1, Math.min(1, sinEl)));
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Scale a series so that its mean, after clipping at `max`, equals `target`.
 * Clipping (wind output tops out at 0.98 of capacity) removes energy from
 * the peaks, so the scale is raised until the clipped mean matches; a target
 * the clipped shape cannot reach ends as close as it gets.
 */
export function normaliseMean(series: Float64Array, target: number, max: number): void {
  const n = series.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += series[i] ?? 0;
  if (n === 0 || !(sum > 0) || !(target > 0)) {
    series.fill(0);
    return;
  }
  let scale = target / (sum / n);
  if (Number.isFinite(max)) {
    // The clipped mean is concave and increasing in the scale, so this
    // fixed-point iteration climbs monotonically to the target.
    for (let it = 0; it < 60; it++) {
      let clipped = 0;
      for (let i = 0; i < n; i++) clipped += Math.min(max, (series[i] ?? 0) * scale);
      const m = clipped / n;
      if (m >= target * (1 - 1e-12) || m >= max) break;
      scale *= target / m;
    }
  }
  for (let i = 0; i < n; i++) series[i] = Math.min(max, (series[i] ?? 0) * scale);
}

export class SyntheticWeather implements WeatherSource {
  readonly name = 'synthetic placeholder';
  private readonly zones: readonly ZoneInput[];
  private readonly order: readonly ZoneId[];
  private readonly windL: number[][];
  private readonly solarL: number[][];
  private readonly params: WorldInputs['weather'];

  constructor(inputs: WorldInputs) {
    this.params = inputs.weather;
    this.order = inputs.weather.zoneOrder;
    const byId = new Map(inputs.zones.map((z) => [z.id, z]));
    this.zones = this.order.map((id) => {
      const z = byId.get(id);
      if (z === undefined) throw new Error(`weather: zone ${id} not in inputs`);
      return z;
    });
    this.windL = cholesky(inputs.weather.windCorrelation);
    this.solarL = cholesky(inputs.weather.solarCorrelation);
  }

  year(seed: number, year: number): WeatherYear {
    const days = daysInYear(year);
    const hours = days * 24;
    const n = this.zones.length;
    const p = this.params;

    // Year-level factors: a wet or dry, windy or calm, sunny or dull year.
    const yearRng = Rng.fromSeed(seed, year, STREAM_YEAR);
    const windYear = new Float64Array(n);
    const solarYear = new Float64Array(n);
    const inflowYear = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const z = this.zones[i];
      if (z === undefined) continue;
      windYear[i] = Math.exp(z.wind.yearSigma * yearRng.gaussian() - z.wind.yearSigma ** 2 / 2);
      solarYear[i] = Math.exp(z.solar.yearSigma * yearRng.gaussian() - z.solar.yearSigma ** 2 / 2);
      const hs = z.hydro?.yearSigma ?? 0;
      inflowYear[i] = Math.exp(hs * yearRng.gaussian() - hs ** 2 / 2);
    }

    // Daily latents with persistence and cross-zone correlation.
    const dailyRng = Rng.fromSeed(seed, year, STREAM_DAILY);
    const windLatent = new Float64Array(n);
    const cloudLatent = new Float64Array(n);
    const windDaily = new Float64Array(days * n);
    const cloudDaily = new Float64Array(days * n);
    const eps = new Float64Array(n);
    const eta = new Float64Array(n);
    const windInnov = new Float64Array(n);
    const solarInnov = new Float64Array(n);
    const phiW = p.windDailyPhi;
    const phiC = p.cloudDailyPhi;
    const rho = p.windSolarCorrelation;
    const rhoC = Math.sqrt(Math.max(0, 1 - rho * rho));
    // Burn in so day 0 is drawn from the stationary distribution.
    for (let d = -30; d < days; d++) {
      for (let i = 0; i < n; i++) {
        eps[i] = dailyRng.gaussian();
        eta[i] = dailyRng.gaussian();
      }
      applyLower(this.windL, eps, windInnov);
      applyLower(this.solarL, eta, solarInnov);
      for (let i = 0; i < n; i++) {
        windLatent[i] = phiW * (windLatent[i] ?? 0) + Math.sqrt(1 - phiW * phiW) * (windInnov[i] ?? 0);
        const cloudInnov = rho * (windInnov[i] ?? 0) + rhoC * (solarInnov[i] ?? 0);
        cloudLatent[i] = phiC * (cloudLatent[i] ?? 0) + Math.sqrt(1 - phiC * phiC) * cloudInnov;
        if (d >= 0) {
          windDaily[d * n + i] = windLatent[i] ?? 0;
          cloudDaily[d * n + i] = cloudLatent[i] ?? 0;
        }
      }
    }

    // Hourly series.
    const hourlyRng = Rng.fromSeed(seed, year, STREAM_HOURLY);
    const wind: Record<ZoneId, Float64Array> = {};
    const solar: Record<ZoneId, Float64Array> = {};
    const inflow: Record<ZoneId, Float64Array> = {};
    const phiH = p.windHourlyPhi;
    const hourlyWindLatent = new Float64Array(n);
    const windSeries = this.zones.map(() => new Float64Array(hours));
    const solarSeries = this.zones.map(() => new Float64Array(hours));
    for (let h = 0; h < hours; h++) {
      const d = Math.floor(h / 24);
      const hod = h % 24;
      const season = Math.cos((2 * Math.PI * (d - 15)) / 365.25); // +1 mid-January, -1 mid-July
      for (let i = 0; i < n; i++) {
        const z = this.zones[i];
        if (z === undefined) continue;
        // Wind: seasonal mean × lognormal daily regime × lognormal hourly wobble.
        hourlyWindLatent[i] = phiH * (hourlyWindLatent[i] ?? 0) + Math.sqrt(1 - phiH * phiH) * hourlyRng.gaussian();
        const sd = z.wind.dailySigma;
        const sh = z.wind.hourlySigma;
        const seasonal = 1 + z.wind.seasonalAmplitude * season;
        const lognormal = Math.exp(sd * (windDaily[d * n + i] ?? 0) + sh * (hourlyWindLatent[i] ?? 0) - (sd * sd + sh * sh) / 2);
        const ws = windSeries[i];
        if (ws !== undefined) ws[h] = Math.min(0.98, z.wind.meanCf * seasonal * lognormal);
        // Solar: clear-sky geometry × daily cloudiness × small hourly flicker.
        const elev = solarElevation(z.latitude, d, hod + 0.5);
        const clear = elev > 0 ? Math.pow(Math.sin(elev), 1.2) : 0;
        const cloudSeason = -z.solar.cloudSeasonal * season; // sunnier summers
        const cloud = 0.22 + 0.78 * sigmoid(1.1 * (cloudDaily[d * n + i] ?? 0) + cloudSeason);
        const flicker = Math.max(0.5, 1 + 0.12 * hourlyRng.gaussian());
        const ss = solarSeries[i];
        if (ss !== undefined) ss[h] = clear * cloud * flicker;
      }
    }
    for (let i = 0; i < n; i++) {
      const z = this.zones[i];
      const ws = windSeries[i];
      const ss = solarSeries[i];
      if (z === undefined || ws === undefined || ss === undefined) continue;
      normaliseMean(ws, z.wind.meanCf * (windYear[i] ?? 1), 0.98);
      normaliseMean(ss, z.solar.meanCf * (solarYear[i] ?? 1), 1);
      wind[z.id] = ws;
      solar[z.id] = ss;
    }

    // Hydro inflow: monthly shape × daily AR(1) noise × wet/dry year.
    const inflowRng = Rng.fromSeed(seed, year, STREAM_INFLOW);
    for (let i = 0; i < n; i++) {
      const z = this.zones[i];
      if (z === undefined || z.hydro === null) continue;
      const series = new Float64Array(hours);
      const phi = p.inflowDailyPhi;
      const sigma = p.inflowDailySigma;
      let latent = 0;
      for (let k = 0; k < 30; k++) latent = phi * latent + Math.sqrt(1 - phi * phi) * inflowRng.gaussian();
      for (let d = 0; d < days; d++) {
        latent = phi * latent + Math.sqrt(1 - phi * phi) * inflowRng.gaussian();
        const month = monthOfDay(year, d);
        const shape = z.hydro.inflowShape[month - 1] ?? 1;
        const noise = Math.exp(sigma * latent - (sigma * sigma) / 2);
        for (let hod = 0; hod < 24; hod++) series[d * 24 + hod] = shape * noise;
      }
      normaliseMean(series, inflowYear[i] ?? 1, Infinity);
      inflow[z.id] = series;
    }

    return { year, hours, wind, solar, inflow };
  }
}
