/**
 * The prototype's numbers, from `docs/design/one-zone-prototype.md` §6.
 * Markers as in the design: [report]/[notes] from the research, [unverified]
 * background knowledge to check, [tuning] invented to make the prototype run
 * and to be set by bot runs and playtests.
 */
import type { Keyframes } from '../sim';

/** First and last calendar year of the chapter. */
export const START_YEAR = 1995;
export const END_YEAR = 2025;

/** Starting cash, euro. [tuning] */
export const START_CASH_EUR = 150_000;
/** The panels already on the barn, MW (10 kWp). [tuning] */
export const BARN_PANELS_MW = 0.01;
/** Room on the farm's roofs for more panels, MW. [tuning] */
export const FARM_ROOF_MW = 0.06;
/** What the farm itself uses in a year; rooftop output up to this offsets the bill. [tuning] */
export const FARM_USE_MWH = 30;

/** Real seconds per game year at ×1 (design §6: a year ≈ 2.4 min). [tuning] */
export const SECONDS_PER_YEAR_AT_X1 = 144;
export const SPEEDS = [1, 3, 10] as const;
export type Speed = 0 | (typeof SPEEDS)[number];

/** Fixed tariff for turbines online before the market opens, €/MWh, for 10 years. [unverified] */
export const WIND_TARIFF = 80;
export const TARIFF_YEARS = 10;

/** Premium periods by commissioning date (year, month), €/MWh for a number of full-load hours. */
export interface PremiumPeriod {
  readonly from: readonly [number, number];
  readonly perMwh: number;
  readonly fullLoadHours: number;
}
export const PREMIUMS: readonly PremiumPeriod[] = [
  // Real 2000–02 turbines got a fixed settlement price of about €58/MWh [unverified]; as a premium on the toy's prices: [tuning]
  { from: [1999, 7], perMwh: 25, fullLoadHours: 22_000 },
  // 2003–07: a thin premium; Danish onshore building nearly stopped [unverified].
  { from: [2003, 1], perMwh: 13, fullLoadHours: 22_000 },
  { from: [2008, 1], perMwh: 33, fullLoadHours: 22_000 }, // [unverified]
  { from: [2017, 1], perMwh: 0, fullLoadHours: 0 },
];

/** What the farm saves per MWh of its own use covered by its panels (avoided retail price), €/MWh. [unverified; tuning] */
export const RETAIL_PRICE: Keyframes = [
  [1995, 130],
  [2000, 160],
  [2005, 190],
  [2010, 230],
  [2012, 250],
  [2020, 270],
  [2025, 300],
];

/** The era's interest rate, % a year, by (fractional) year. [unverified] */
export const INTEREST_RATE: Keyframes = [
  [1995, 8],
  [2000, 6],
  [2005, 4],
  [2010, 3],
  [2015, 1],
  [2020, 0.5],
  [2022, 1.5],
  [2023, 4],
  [2025, 3.5],
];
/** The 2008 credit squeeze: from (year, month) for this many months. [unverified; tuning] */
export const CRISIS_FROM: readonly [number, number] = [2008, 10];
export const CRISIS_MONTHS = 24;
/** Extra interest during the squeeze, percentage points. [tuning] */
export const CRISIS_RATE_ADD = 1.5;
/** Loan share of a project's cost: normally, and during the squeeze. [tuning] */
export const LOAN_SHARE = 0.8;
export const CRISIS_LOAN_SHARE = 0.6;
export const LOAN_TERMS_YEARS = [10, 15] as const;
/**
 * The company loan (the Finance screen's [Borrow], §5): all debt together may
 * reach this share of the operating assets' value, at the era's rate plus a
 * margin. [tuning]
 */
export const CREDIT_SHARE = 0.6;
export const CREDIT_RATE_ADD = 1;
/** Loan rates never fall below this, % a year. [tuning] */
export const MIN_RATE = 0.25;

/** Discount rate for an asset's value (§4.5). [tuning] */
export const VALUE_DISCOUNT = 0.07;
/** Months of trailing net cash flow behind an asset's value (§4.5). */
export const VALUE_WINDOW_MONTHS = 36;
/** A sale fetches this share of an asset's value. [tuning] */
export const SALE_SHARE = 0.9;

/** Restructuring (§4.5). [tuning] */
export const DAYS_BELOW_ZERO = 90;
export const RESTRUCTURE_SALE_SHARE = 0.7;
export const RESTRUCTURE_BUFFER_MONTHS = 6;
export const RESTRUCTURE_FEE_SHARE = 0.25;
export const RESTRUCTURE_FEE_YEARS = 5;

/** Ageing: turbines lose availability, panels lose output, per year of age. [tuning] */
export const WIND_AGEING_PER_YEAR = 0.005;
export const SOLAR_DEGRADATION_PER_YEAR = 0.005;

/** Fixed operating cost, € per kW a year (design §6). [tuning] */
export const OM_WIND_PER_KW = 25;
export const OM_SOLAR_PER_KW = 10;

/** Average Danish household use, for "homes supplied". [unverified; tuning] */
export const HOUSEHOLD_MWH = 4;

/** Medals at the end of 2025 (§7), euro of company value. [tuning] */
export const MEDAL_BRONZE_EUR = 25e6;
export const MEDAL_SILVER_EUR = 100e6;
export const MEDAL_GOLD_EUR = 250e6;
export const MEDAL_GOLD_EARNED_SHARE = 0.9;

/**
 * Round 1's tuned comparison mode (`play.html?tuned=1`, tasks/2026-10-04-fun-core-toy.md
 * part c): income multiplied, and three stub offers on fixed dates. [tuning]
 */
export const TUNED_INCOME_FACTOR = 3;
export const TUNED_OFFERS: readonly { readonly id: 'landowner' | 'refinance' | 'firesale'; readonly year: number; readonly month: number }[] = [
  { id: 'landowner', year: 1997, month: 6 },
  { id: 'refinance', year: 2002, month: 3 },
  { id: 'firesale', year: 2009, month: 4 },
];
export const LANDOWNER_FEE_EUR = 60_000;
export const REFINANCE_FEE_SHARE = 0.01;
export const FIRESALE_PRICE_EUR = 300_000;
export const FIRESALE_UNITS = 2;
export const FIRESALE_AGE_YEARS = 12;

/** History claims a site this many months after announcing it. [tuning] */
export const CLAIM_NOTICE_MONTHS = 6;
