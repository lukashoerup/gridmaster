/**
 * The game state: plain data, so a save is `JSON.stringify(state)`. Money is
 * in integer cents; times are absolute hours (see `clock.ts`).
 */
import type { AssetKind, ModelId } from './catalogue';
import type { PlayerCapacity } from './market';

export type AssetStatus = 'permitting' | 'building' | 'operating' | 'retired' | 'sold';

/** How an asset's output is paid, fixed when it is ordered from its commissioning date (§4.4). */
export type Regime = 'tariff' | 'premium' | 'market' | 'netmeter';

export interface AssetYear {
  outputMwh: number;
  revenueCents: number;
  fixedCostCents: number;
  /** What the output would have fetched at the hourly market price, cents. */
  marketValueCents: number;
}

export interface Asset {
  readonly id: number;
  readonly name: string;
  readonly model: ModelId;
  readonly kind: AssetKind;
  readonly units: number;
  readonly mw: number;
  /** Null for the farm's roofs. */
  readonly siteId: string | null;
  readonly windFactor: number;
  readonly sunFactor: number;
  readonly orderedAt: number;
  readonly permitDoneAt: number;
  readonly onlineAt: number;
  readonly retireAt: number;
  endedAt: number | null;
  status: AssetStatus;
  readonly costCents: number;
  /** Fixed operating cost plus land, cents a year. */
  readonly fixedCentsPerYear: number;
  readonly regime: Regime;
  /** End of the fixed tariff (regime 'tariff'). */
  readonly tariffUntil: number;
  readonly premiumPerMwh: number;
  premiumMwhLeft: number;
  /** Net cash flow expected in a normal year when ordered, cents: stands in for history in the asset's value. */
  readonly expectedNetCents: number;
  /** Price expected per MWh when ordered, €/MWh. */
  readonly expectedPrice: number;
  loanId: number | null;
  /** Net cash flow per closed month, cents, most recent last (at most 36). */
  monthNet: number[];
  monthRevenueCents: number;
  monthHours: number;
  /** Fractions of a cent not yet booked, so hourly rounding never drifts. */
  revenueCarry: number;
  marketValueCarry: number;
  year: AssetYear;
  lifetimeMwh: number;
  lifetimeRevenueCents: number;
}

export interface Loan {
  readonly id: number;
  readonly assetId: number | null;
  readonly label: string;
  readonly principalCents: number;
  balanceCents: number;
  readonly ratePct: number;
  readonly months: number;
  monthsPaid: number;
  readonly paymentCents: number;
  /** Instalments start in the first month after this hour (the asset's commissioning). */
  readonly firstPaymentAfter: number;
}

export interface SiteState {
  readonly id: string;
  /** When history announces and takes the site's free room; null = never. */
  readonly announceAt: number | null;
  readonly claimAt: number | null;
  readonly claimant: string;
  announced: boolean;
  claimedMw: number;
}

export type Tone = 'good' | 'bad' | 'info' | 'event';

export interface Notice {
  readonly t: number;
  readonly text: string;
  readonly tone: Tone;
}

export type CardKind = 'welcome' | 'event' | 'annual' | 'cash' | 'restructured' | 'gameover' | 'end' | 'offer';

/** The three stub offers of round 1's tuned comparison mode (tasks/2026-10-04-fun-core-toy.md part c). */
export type OfferId = 'landowner' | 'refinance' | 'firesale';

/**
 * Round 1's comparison mode, `play.html?tuned=1`: slice 1 with its income
 * multiplied and three offers added, to test whether the old core was broken
 * or only its numbers. Absent in a normal game, which is unchanged.
 */
export interface Tuned {
  readonly incomeFactor: number;
  offersFired: OfferId[];
  /** Until this hour the next turbine skips its permit wait (the landowner's offer). */
  readyPermitUntil: number;
}

export interface Card {
  readonly kind: CardKind;
  readonly title: string;
  readonly body: readonly string[];
  readonly year?: number;
  /** For an offer card: which offer it is. */
  readonly offer?: OfferId;
}

export interface Ledger {
  revenueCents: number;
  fixedCostCents: number;
  interestCents: number;
  repaidCents: number;
  feeCents: number;
  /** Full cost of projects ordered, cents (the borrowed part is in `borrowedCents`). */
  investedCents: number;
  /** Project loans and company loans drawn, cents. */
  borrowedCents: number;
  salesCents: number;
  outputMwh: number;
  marketValueCents: number;
}

export interface YearReport {
  readonly year: number;
  readonly ledger: Ledger;
  readonly cashStartCents: number;
  readonly cashEndCents: number;
  readonly valueStartCents: number;
  readonly valueEndCents: number;
  readonly debtEndCents: number;
  /** Revenue per MWh, tariffs and premiums included, €/MWh; null without output. */
  readonly earnedPrice: number | null;
  /** The output's value at the hourly market price per MWh, €/MWh; null without output. */
  readonly marketEarnedPrice: number | null;
  readonly dk1: {
    readonly meanPrice: number;
    readonly windCapturePrice: number | null;
    readonly windCaptureRate: number | null;
    readonly windMw: number;
    readonly solarMw: number;
    readonly windMwBefore: number | null;
    readonly solarMwBefore: number | null;
    readonly negativeHours: number;
    readonly maxPrice: number;
    readonly marketOpen: boolean;
  };
  readonly best: { readonly name: string; readonly netPerMwEur: number } | null;
  readonly worst: { readonly name: string; readonly netPerMwEur: number } | null;
  readonly mwOperating: number;
  readonly mwBuilding: number;
  readonly sharePct: number;
  readonly homes: number;
  readonly headlines: readonly string[];
}

export type Medal = 'gold' | 'silver' | 'bronze' | 'none';

export interface Outcome {
  readonly kind: 'end' | 'bank';
  readonly medal: Medal;
  readonly valueCents: number;
  readonly earnedShare: number | null;
  readonly why: readonly string[];
}

export interface GameState {
  readonly version: number;
  readonly seed: number;
  /** Absolute hour of the next hour to play. */
  t: number;
  year: number;
  /** Hour within `year` of the next hour to play. */
  hourOfYear: number;
  cashCents: number;
  assets: Asset[];
  loans: Loan[];
  nextId: number;
  sites: SiteState[];
  /** When DK1's hourly market opens and negative prices begin (absolute hours). */
  readonly marketOpenAt: number;
  readonly negativeFromAt: number;
  /** Rooftop output still offsetting the farm's own use this year, MWh. */
  netMeterLeftMwh: number;
  ledger: Ledger;
  cashStartCents: number;
  valueStartCents: number;
  /** DK1 as it was last year, for the report's "what changed" and the build preview. */
  lastMarket: { readonly year: number; readonly windMw: number; readonly solarMw: number; readonly windCapturePrice: number | null; readonly solarCapturePrice: number | null; readonly meanPrice: number } | null;
  reports: YearReport[];
  notices: Notice[];
  cards: Card[];
  firedEvents: string[];
  headlines: string[];
  /** Last month index (since January of the start year) whose costs and instalments are settled. */
  closedMonth: number;
  negativeCashSince: number | null;
  restructurings: number;
  feeUntil: number;
  goldBlocked: boolean;
  over: Outcome | null;
  /** The player's capacity the market was simulated with, by year: replayed when a save is resumed. */
  capacityLog: Record<string, PlayerCapacity>;
  /** Round 1's tuned comparison mode; absent in a normal game. */
  tuned?: Tuned;
}
