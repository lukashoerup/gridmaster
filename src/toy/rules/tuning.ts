/**
 * Every number in toy 1 "Hubs". All of them are [tuning]: chosen so the toy
 * plays, never claimed as real data (design `docs/design/fun-core.md`,
 * "Round 1"). Money is in euros (the toy has no loans or cents to keep).
 */

/** The run starts on 1 January of this year. */
export const START_YEAR = 1997;
/** The inputs end in 2025; the toy stops there. */
export const LAST_YEAR = 2025;

/** A year lasts about this many real seconds at ×1 [tuning]. */
export const SECONDS_PER_YEAR_AT_X1 = 300;
export const SPEEDS = [0, 1, 3, 10] as const;
export type Speed = (typeof SPEEDS)[number];

/** "The market opens": a random hour in this window, drawn from the seed. */
export const MARKET_OPENS_FROM = 1998;
export const MARKET_OPENS_TO = 2001; // inclusive: by 31 December 2001 at the latest
/** The flat national price before the market opens, €/MWh [tuning]: a little above the core's market prices of those years. */
export const TARIFF = 26;

/** Hub price rule [tuning]. */
export const PRICE = {
  /** A flooded hub's price falls from the parent's to the floor as stuck surplus reaches this share of (demand + link). */
  floodSpan: 0.3,
  /** A hungry hub's price rises above the parent's by up to `hungryMax` as the shortfall reaches this share of demand. */
  hungrySpan: 0.3,
  hungryMax: 35,
  /** The floor before and after negative prices are allowed. */
  floorBefore: 0,
  floorAfter: -15,
  negativeFromYear: 2009,
} as const;

/** The rolling window behind the typical day and the hub colour: 4 weeks. */
export const WINDOW_HOURS = 24 * 28;
/** Hub colour from its 4-week mean price against the national mean: below → blue, above → red. */
export const COLOUR = { blueBelow: 0.9, redAbove: 1.1 } as const;
/** An hour counts as flooded (blue) or hungry (red) when the hub's price departs from its parent's by this much (€/MWh). */
export const SEPARATED_EUR = 0.5;

/** Costs are charged by the year, hour by hour, so a plant's profit reads directly in the year review [tuning]. */
export const COST = {
  windPerMwYear: 56_000,
  solarPerMwYear: 30_000,
  /** A connection line, per km and MW connected, per year. */
  linePerKmMwYear: 250,
  batteryPerUnitYear: 35_000,
  /** One-off fee to take a plant or battery down: this share of its yearly cost. */
  removeShareOfYear: 0.5,
  scout: 10_000,
} as const;

/** Delays in days [tuning]: short, because attention, not cash, should be the bottleneck. */
export const DAYS = {
  scout: 30,
  wind: 60,
  solar: 45,
  battery: 30,
} as const;

/** Plants are built in blocks of this many MW, up to the spot's free size and the hub's free room. */
export const BLOCK_MW = 5;

/** The one battery type [tuning]. */
export const BATTERY = { mw: 10, mwh: 20, efficiency: 0.85, minSpread: 5 } as const;

/** Money near-unlimited (round 1's default). With it off, a build needs this much cash for a year of its cost. */
export const STARTING_CASH_LIMITED = 300_000;

/** Weather moods drawn per year from the seed [tuning]. */
export const WEATHER = {
  calmWinterChance: 0.2,
  stormYearChance: 0.2,
  /** Wind capacity factors in January, February and December of a calm winter are multiplied by this. */
  calmWinterFactor: 0.45,
  /** Wind capacity factors in a storm year are multiplied by this (capped at 1). */
  stormFactor: 1.25,
} as const;
