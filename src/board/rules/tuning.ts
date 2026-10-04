/**
 * Toy 2 "The board" (docs/design/fun-core.md, round 1; task part b).
 * Every number here is [tuning], chosen for play, not real data (D17, D18).
 * One grid hub, one typical day of 24 hours, ten rounds ("years").
 */

export const HOURS = 24;
export const YEARS = 10;
/** Sample days per year in the reveal: one per month. */
export const SAMPLE_DAYS = 12;
export const DAYS_PER_YEAR = 365;

export type Kind = 'wind' | 'solar' | 'battery';
export const KINDS: readonly Kind[] = ['wind', 'solar', 'battery'];

/** One block of wind or solar is this many MW; one battery block is this many MW … */
export const BLOCK_MW = 10;
/** … and stores this many MWh. */
export const BATTERY_MWH = 20;
/** Round-trip efficiency: energy out per energy in. */
export const BATTERY_EFF = 0.85;
/** One drag on the board moves this much energy into the battery. */
export const SLICE_MWH = 5;

/** What a block costs: once when built, then every year it is owned. Euro. */
export const COSTS: Readonly<Record<Kind, { readonly build: number; readonly yearly: number }>> = {
  wind: { build: 1_200_000, yearly: 1_600_000 },
  solar: { build: 600_000, yearly: 1_000_000 },
  battery: { build: 400_000, yearly: 300_000 },
};

/** The hub's demand on a typical day, MW, hour 0 to 23 (night low, two peaks). */
export const DEMAND_MW: readonly number[] = [
  72, 70, 68, 68, 70, 76, 88, 102, 110, 108, 106, 105,
  104, 103, 102, 104, 110, 120, 131, 129, 120, 106, 94, 82,
];
/** Demand grows this much a year (fraction). */
export const DEMAND_GROWTH = 0.015;

/**
 * The supply ladder behind the hub, cheapest first: up to `toMw` of residual
 * demand is served at a price rising from `from` to `to` €/MWh. Above the last
 * step the hub imports at the scarcity price.
 */
export interface Step {
  readonly name: string;
  readonly toMw: number;
  readonly from: number;
  readonly to: number;
  /** Gas steps follow the gas price. */
  readonly gas: boolean;
}
export const LADDER: readonly Step[] = [
  { name: 'Coal at minimum', toMw: 20, from: 4, to: 6, gas: false },
  { name: 'Coal', toMw: 70, from: 38, to: 45, gas: false },
  { name: 'Gas CHP', toMw: 100, from: 62, to: 70, gas: true },
  { name: 'Gas peakers', toMw: 125, from: 115, to: 135, gas: true },
];
export const SCARCITY_PRICE = 220;
/** When renewables and batteries cover all demand the surplus is dumped at this price. */
export const FLOODED_PRICE = -15;

/** Wind's typical capacity factor by hour: a little more at night and in the evening. */
export const WIND_CF: readonly number[] = Array.from({ length: 24 }, (_, h) => 0.33 + 0.06 * Math.cos((2 * Math.PI * (h - 1)) / 24));
/** Solar's typical capacity factor by hour: a bell from 6:00 to 20:00, peaking at 13:00. */
export const SOLAR_CF: readonly number[] = Array.from({ length: 24 }, (_, h) => (h <= 6 || h >= 20 ? 0 : 0.7 * Math.pow(Math.sin((Math.PI * (h - 6)) / 14), 1.5)));

/** Everyone else's plants at the start. */
export const RIVALS_START: Readonly<Record<Kind, number>> = { wind: 20, solar: 10, battery: 0 };
/** Rivals build when last year paid them this much (€/MWh: midday for solar, the day's mean for wind, the spread for batteries) … */
export const RIVAL_TRIGGER: Readonly<Record<Kind, number>> = { wind: 65, solar: 55, battery: 80 };
/** … this many MW at a time. */
export const RIVAL_STEP: Readonly<Record<Kind, number>> = { wind: 10, solar: 10, battery: 10 };
/** Rivals never grow beyond these, MW. */
export const RIVALS_MAX: Readonly<Record<Kind, number>> = { wind: 120, solar: 120, battery: 60 };

/** Seasonal weather by month for the reveal: wind, sun and demand factors. */
export const SEASONS: readonly { readonly month: string; readonly wind: number; readonly sun: number; readonly demand: number }[] = [
  { month: 'Jan', wind: 1.3, sun: 0.35, demand: 1.12 },
  { month: 'Feb', wind: 1.25, sun: 0.55, demand: 1.1 },
  { month: 'Mar', wind: 1.15, sun: 0.85, demand: 1.04 },
  { month: 'Apr', wind: 1.0, sun: 1.1, demand: 0.98 },
  { month: 'May', wind: 0.85, sun: 1.35, demand: 0.94 },
  { month: 'Jun', wind: 0.75, sun: 1.5, demand: 0.92 },
  { month: 'Jul', wind: 0.7, sun: 1.5, demand: 0.92 },
  { month: 'Aug', wind: 0.75, sun: 1.35, demand: 0.93 },
  { month: 'Sep', wind: 0.95, sun: 1.05, demand: 0.97 },
  { month: 'Oct', wind: 1.1, sun: 0.75, demand: 1.02 },
  { month: 'Nov', wind: 1.2, sun: 0.45, demand: 1.07 },
  { month: 'Dec', wind: 1.3, sun: 0.3, demand: 1.12 },
];
/** Day-to-day noise on wind in the reveal (standard deviation, as a factor). */
export const WIND_NOISE = 0.35;
