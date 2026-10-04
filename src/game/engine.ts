/**
 * The game's rules: a run is a `GameState` advanced hour by hour against the
 * market year the simulation computed for it. Pure and deterministic: the
 * same seed and the same decisions at the same hours give the same game.
 *
 * Order of a year: `openYear` asks the simulation for the year with the
 * player's assets in DK1's supply stack; `advance` plays its hours;
 * `closeYear` settles December, writes the annual report and moves to the
 * next year. The player's own building therefore moves the price from the
 * year after it is ordered; within the year it is ordered in, the asset is a
 * price-taker (task notes).
 */
import { Rng, hoursInYear, interp, type WorldInputs } from '../sim';
import { MODELS, costPerKw, type Model } from './catalogue';
import { HOURS_PER_MONTH, dateHour, dateLabel, fractionalYear, monthIndex, monthLabel, toDate, yearStart } from './clock';
import { EVENTS } from './events';
import { ZONE, type MarketProvider, type MarketYear, type PlayerCapacity } from './market';
import { cents, groupThousands, monthlyPayment } from './money';
import { AREAS, FARM, SITES, gridRoomMw, siteById, type Site } from './sites';
import type { Asset, Card, GameState, Ledger, Loan, Medal, Notice, Outcome, Regime, Tone, YearReport } from './state';
import {
  BARN_PANELS_MW,
  CLAIM_NOTICE_MONTHS,
  CRISIS_FROM,
  CRISIS_LOAN_SHARE,
  CRISIS_MONTHS,
  CREDIT_RATE_ADD,
  CREDIT_SHARE,
  CRISIS_RATE_ADD,
  DAYS_BELOW_ZERO,
  END_YEAR,
  FARM_ROOF_MW,
  FARM_USE_MWH,
  HOUSEHOLD_MWH,
  INTEREST_RATE,
  LOAN_SHARE,
  LOAN_TERMS_YEARS,
  MEDAL_BRONZE_EUR,
  MEDAL_GOLD_EARNED_SHARE,
  MEDAL_GOLD_EUR,
  MEDAL_SILVER_EUR,
  MIN_RATE,
  PREMIUMS,
  RESTRUCTURE_BUFFER_MONTHS,
  RESTRUCTURE_FEE_SHARE,
  RESTRUCTURE_FEE_YEARS,
  RESTRUCTURE_SALE_SHARE,
  RETAIL_PRICE,
  SALE_SHARE,
  SOLAR_DEGRADATION_PER_YEAR,
  START_CASH_EUR,
  START_YEAR,
  TARIFF_YEARS,
  WIND_AGEING_PER_YEAR,
  WIND_TARIFF,
} from './tuning';
import { assetValue, companyValue, debtCents, trailingAnnualNet } from './value';

export const SAVE_VERSION = 1;

const HOURS_PER_YEAR = 8766;
const MAX_NOTICES = 60;
const MAX_UNITS = 25;
/** A bad year's output relative to a normal one, for the build preview. [tuning] */
const BAD_YEAR = 0.9;
/** Wind capacity factor never exceeds this in an hour. */
const MAX_WIND_CF = 0.97;

const CLAIMANTS = ['A wind co-op', 'A farmers’ co-operative', 'A developer from Aarhus', 'A group of local investors'];

/** Round an absolute hour up to the start of a day. */
function dayCeil(t: number): number {
  return Math.ceil(t / 24) * 24;
}

function emptyLedger(): Ledger {
  return {
    revenueCents: 0,
    fixedCostCents: 0,
    interestCents: 0,
    repaidCents: 0,
    feeCents: 0,
    investedCents: 0,
    borrowedCents: 0,
    salesCents: 0,
    outputMwh: 0,
    marketValueCents: 0,
  };
}

function notice(state: GameState, text: string, tone: Tone = 'info'): void {
  const n: Notice = { t: state.t, text, tone };
  state.notices.push(n);
  if (state.notices.length > MAX_NOTICES) state.notices.splice(0, state.notices.length - MAX_NOTICES);
}

function card(state: GameState, c: Card): void {
  state.cards.push(c);
}

function eur(c: number): string {
  return `€${groupThousands(c / 100)}`;
}

// ---------------------------------------------------------------------------
// Rates and rules of the day

const crisisStart = (): number => dateHour(CRISIS_FROM[0], CRISIS_FROM[1], 1);
const crisisEnd = (): number => {
  const m = CRISIS_FROM[1] - 1 + CRISIS_MONTHS;
  return dateHour(CRISIS_FROM[0] + Math.floor(m / 12), (m % 12) + 1, 1);
};

export function inCreditSqueeze(t: number): boolean {
  return t >= crisisStart() && t < crisisEnd();
}

/** The era's interest rate for a new loan, % a year. */
export function interestRate(t: number): number {
  const base = interp(INTEREST_RATE, fractionalYear(t)) + (inCreditSqueeze(t) ? CRISIS_RATE_ADD : 0);
  return Math.max(MIN_RATE, Math.round(base * 100) / 100);
}

/** Most of a project's cost a bank will lend, 0..1. */
export function maxLoanShare(t: number): number {
  return inCreditSqueeze(t) ? CRISIS_LOAN_SHARE : LOAN_SHARE;
}

export function retailPrice(year: number): number {
  return interp(RETAIL_PRICE, year);
}

interface RegimeTerms {
  readonly regime: Regime;
  readonly tariffUntil: number;
  readonly premiumPerMwh: number;
  readonly premiumFullLoadHours: number;
}

/** How a wind asset coming online at `onlineAt` is paid (§4.4). */
export function windRegime(state: GameState, onlineAt: number): RegimeTerms {
  if (onlineAt < state.marketOpenAt) {
    return { regime: 'tariff', tariffUntil: dayCeil(onlineAt + TARIFF_YEARS * HOURS_PER_YEAR), premiumPerMwh: 0, premiumFullLoadHours: 0 };
  }
  let period = null;
  for (const p of PREMIUMS) if (onlineAt >= dateHour(p.from[0], p.from[1], 1)) period = p;
  if (period === null || period.perMwh <= 0) return { regime: 'market', tariffUntil: 0, premiumPerMwh: 0, premiumFullLoadHours: 0 };
  return { regime: 'premium', tariffUntil: 0, premiumPerMwh: period.perMwh, premiumFullLoadHours: period.fullLoadHours };
}

// ---------------------------------------------------------------------------
// New game

export function newGame(seed: number, inputs: WorldInputs): GameState {
  const zone = inputs.zones.find((z) => z.id === ZONE);
  if (zone === undefined) throw new Error(`the inputs have no ${ZONE} zone`);
  const rng = Rng.fromSeed(seed >>> 0, 0x51735);
  const sites = SITES.map((s) => {
    if (s.claimWindow === null) return { id: s.id, announceAt: null, claimAt: null, claimant: '', announced: false, claimedMw: 0 };
    const [a, b] = s.claimWindow;
    const m = Math.floor(rng.next() * (b - a + 1) * 12);
    const claimAt = dateHour(a + Math.floor(m / 12), (m % 12) + 1, 1);
    const announceAt = Math.max(0, dayCeil(claimAt - CLAIM_NOTICE_MONTHS * HOURS_PER_MONTH));
    const claimant = CLAIMANTS[Math.floor(rng.next() * CLAIMANTS.length)] ?? 'A wind co-op';
    return { id: s.id, announceAt, claimAt, claimant, announced: false, claimedMw: 0 };
  });
  const state: GameState = {
    version: SAVE_VERSION,
    seed: seed >>> 0,
    t: 0,
    year: START_YEAR,
    hourOfYear: 0,
    cashCents: cents(START_CASH_EUR),
    assets: [],
    loans: [],
    nextId: 1,
    sites,
    marketOpenAt: dateHour(zone.marketOpen.year, zone.marketOpen.month, zone.marketOpen.day),
    negativeFromAt: dateHour(zone.negativePricesFrom.year, zone.negativePricesFrom.month, zone.negativePricesFrom.day),
    netMeterLeftMwh: FARM_USE_MWH,
    ledger: emptyLedger(),
    cashStartCents: 0,
    valueStartCents: 0,
    lastMarket: null,
    reports: [],
    notices: [],
    cards: [],
    firedEvents: [],
    headlines: [],
    closedMonth: -1,
    negativeCashSince: null,
    restructurings: 0,
    feeUntil: -1,
    goldBlocked: false,
    over: null,
    capacityLog: {},
  };
  const barn = MODELS.roof10;
  const barnMwh = BARN_PANELS_MW * barn.meanCf * FARM.sun * 8760;
  addAsset(state, {
    name: 'Barn roof',
    model: barn,
    units: Math.round(BARN_PANELS_MW / barn.unitMw),
    site: null,
    orderedAt: 0,
    permitDoneAt: 0,
    onlineAt: 0,
    costCents: cents(BARN_PANELS_MW * 1000 * costPerKw(barn, START_YEAR)),
    terms: { regime: 'netmeter', tariffUntil: 0, premiumPerMwh: 0, premiumFullLoadHours: 0 },
    expectedNetCents: cents(barnMwh * retailPrice(START_YEAR) - BARN_PANELS_MW * 1000 * barn.omPerKw),
    expectedPrice: retailPrice(START_YEAR),
  });
  card(state, {
    kind: 'welcome',
    title: 'Your farm in Jutland, 1 January 1995',
    body: [
      'You own a farm in the middle of Jutland, €150,000 in the bank, and 10 kWp of solar panels on the barn roof. On sunny days they cover part of the farm’s own power bill: a trickle of money.',
      'The real opportunity is the wind. The utility must buy wind power at a fixed price, €80/MWh, for ten years from the day a turbine starts. Choose a site on the map to build your first turbine. Windier sites earn more; permits take months; the bank lends up to 80% of the cost, at 8% interest today.',
      'Nothing happens until you press play. Every 31 December your annual report shows how the year went. The chapter ends on 31 December 2025.',
    ],
  });
  state.cashStartCents = state.cashCents;
  state.valueStartCents = companyValue(state);
  return state;
}

interface NewAsset {
  readonly name: string;
  readonly model: Model;
  readonly units: number;
  readonly site: Site | null;
  readonly orderedAt: number;
  readonly permitDoneAt: number;
  readonly onlineAt: number;
  readonly costCents: number;
  readonly terms: RegimeTerms;
  readonly expectedNetCents: number;
  readonly expectedPrice: number;
}

function fixedCentsPerYear(model: Model, mw: number, site: Site | null): number {
  const land = site === null ? 0 : AREAS[site.area].landPerMw * mw;
  return cents(model.omPerKw * mw * 1000 + land);
}

function addAsset(state: GameState, a: NewAsset): Asset {
  const mw = a.units * a.model.unitMw;
  const asset: Asset = {
    id: state.nextId++,
    name: a.name,
    model: a.model.id,
    kind: a.model.kind,
    units: a.units,
    mw,
    siteId: a.site?.id ?? null,
    windFactor: a.site?.wind ?? 1,
    sunFactor: a.site?.sun ?? FARM.sun,
    orderedAt: a.orderedAt,
    permitDoneAt: a.permitDoneAt,
    onlineAt: a.onlineAt,
    retireAt: dayCeil(a.onlineAt + a.model.lifetimeYears * HOURS_PER_YEAR),
    endedAt: null,
    status: a.onlineAt <= state.t ? 'operating' : a.permitDoneAt <= state.t ? 'building' : 'permitting',
    costCents: a.costCents,
    fixedCentsPerYear: fixedCentsPerYear(a.model, mw, a.site),
    regime: a.terms.regime,
    tariffUntil: a.terms.tariffUntil,
    premiumPerMwh: a.terms.premiumPerMwh,
    premiumMwhLeft: a.terms.premiumFullLoadHours * mw,
    expectedNetCents: a.expectedNetCents,
    expectedPrice: a.expectedPrice,
    loanId: null,
    monthNet: [],
    monthRevenueCents: 0,
    monthHours: 0,
    revenueCarry: 0,
    marketValueCarry: 0,
    year: { outputMwh: 0, revenueCents: 0, fixedCostCents: 0, marketValueCents: 0 },
    lifetimeMwh: 0,
    lifetimeRevenueCents: 0,
  };
  state.assets.push(asset);
  return asset;
}

// ---------------------------------------------------------------------------
// Capacity: what the player adds to DK1's supply stack

/** Player MW still in play (ordered, building or running) on a site, or on the farm's roofs for null. */
export function playerMwOn(state: GameState, siteId: string | null): number {
  let mw = 0;
  for (const a of state.assets) if (a.endedAt === null && a.siteId === siteId) mw += a.mw;
  return mw;
}

export function playerMwInArea(state: GameState, area: string): number {
  let mw = 0;
  for (const a of state.assets) {
    if (a.endedAt !== null || a.siteId === null) continue;
    if (siteById(a.siteId)?.area === area) mw += a.mw;
  }
  return mw;
}

/** MW a site can still take from the player. */
export function siteRoomMw(state: GameState, siteId: string): number {
  const s = siteById(siteId);
  const ss = state.sites.find((x) => x.id === siteId);
  if (s === undefined || ss === undefined) return 0;
  return Math.max(0, s.maxMw - ss.claimedMw - playerMwOn(state, siteId));
}

export function areaRoomMw(state: GameState, area: keyof typeof AREAS): number {
  return Math.max(0, gridRoomMw(area, state.year) - playerMwInArea(state, area));
}

export function roofRoomMw(state: GameState): number {
  return Math.max(0, FARM_ROOF_MW - playerMwOn(state, null));
}

/**
 * The player's assets as extra DK1 wind and solar capacity for a year: each
 * asset's MW scaled to its energy relative to the zone's average turbine or
 * panel, and to the share of the year it runs (as far as known now).
 */
export function playerCapacity(state: GameState, year: number, inputs: WorldInputs): PlayerCapacity {
  const zone = inputs.zones.find((z) => z.id === ZONE);
  if (zone === undefined) throw new Error(`the inputs have no ${ZONE} zone`);
  const ys = yearStart(year);
  const ye = ys + hoursInYear(year);
  let windMw = 0;
  let solarMw = 0;
  for (const a of state.assets) {
    const end = Math.min(a.retireAt, a.endedAt ?? Infinity, ye);
    const start = Math.max(a.onlineAt, ys);
    if (end <= start) continue;
    const frac = (end - start) / (ye - ys);
    const ageMid = ((start + end) / 2 - a.onlineAt) / HOURS_PER_YEAR;
    const m = MODELS[a.model];
    if (a.kind === 'wind') {
      windMw += a.mw * ((m.meanCf * a.windFactor) / zone.wind.meanCf) * (1 - WIND_AGEING_PER_YEAR * ageMid) * frac;
    } else {
      solarMw += a.mw * ((m.meanCf * a.sunFactor) / zone.solar.meanCf) * (1 - SOLAR_DEGRADATION_PER_YEAR * ageMid) * frac;
    }
  }
  return { windMw, solarMw };
}

/** Simulate the market for the state's current year, with the player's capacity in it. */
export function openYear(state: GameState, provider: MarketProvider): MarketYear {
  const cap = playerCapacity(state, state.year, provider.inputs);
  state.capacityLog[String(state.year)] = cap;
  return provider.simulate(state.year, cap);
}

// ---------------------------------------------------------------------------
// Building

export interface BuildRequest {
  /** A site id, or null for the farm's roofs. */
  readonly siteId: string | null;
  readonly model: Model['id'];
  readonly units: number;
  /** Share of the cost borrowed, 0..maxLoanShare. */
  readonly loanShare: number;
  readonly loanYears: number;
}

export interface Preview {
  readonly ok: boolean;
  readonly problems: readonly string[];
  readonly mw: number;
  readonly costCents: number;
  readonly loanCents: number;
  readonly equityCents: number;
  readonly maxLoanShare: number;
  readonly ratePct: number;
  readonly monthlyPaymentCents: number;
  readonly permitDoneAt: number;
  readonly onlineAt: number;
  readonly regime: Regime;
  readonly regimeText: string;
  readonly annualMwh: number;
  readonly badYearMwh: number;
  /** Price expected per MWh in the first years, €/MWh. */
  readonly expectedPrice: number;
  readonly annualRevenueCents: number;
  readonly annualFixedCents: number;
  readonly annualNetCents: number;
  readonly paybackYears: number | null;
}

/** The market price the preview expects a new asset of a kind to earn: last year's capture price in DK1. */
function referencePrice(state: GameState, market: MarketYear, kind: 'wind' | 'rooftop'): number {
  const last = state.lastMarket;
  const s = market.summary;
  if (kind === 'wind') return last?.windCapturePrice ?? s.windCapturePrice ?? last?.meanPrice ?? s.meanPrice;
  return last?.solarCapturePrice ?? s.solarCapturePrice ?? last?.meanPrice ?? s.meanPrice;
}

function rooftopExpectedMwh(state: GameState): number {
  let mwh = 0;
  for (const a of state.assets) {
    if (a.endedAt !== null || a.kind !== 'rooftop') continue;
    mwh += a.mw * MODELS[a.model].meanCf * a.sunFactor * 8760;
  }
  return mwh;
}

export function preview(state: GameState, market: MarketYear, req: BuildRequest): Preview {
  const problems: string[] = [];
  const model = MODELS[req.model];
  const t = state.t;
  const site = req.siteId === null ? null : (siteById(req.siteId) ?? null);
  const units = Math.max(0, Math.floor(req.units));
  const mw = units * model.unitMw;
  if (state.over !== null) problems.push('The game is over.');
  if (req.siteId !== null && site === null) problems.push('Unknown site.');
  if (units < 1) problems.push('Choose at least one unit.');
  if (units > MAX_UNITS) problems.push(`At most ${MAX_UNITS} units in one project.`);
  if (state.year < model.fromYear || state.year > model.untilYear) {
    problems.push(`The ${model.label} can be ordered ${model.fromYear}–${model.untilYear}.`);
  }
  if (model.kind === 'wind' && site === null) problems.push('Turbines need a site.');
  if (model.kind === 'rooftop' && site !== null) problems.push('Rooftop panels go on the farm’s roofs.');
  if (site !== null) {
    const room = siteRoomMw(state, site.id);
    if (mw > room + 1e-9) problems.push(room <= 1e-9 ? `${site.name} has no room left.` : `${site.name} has room for ${fmtMw(room)} more.`);
    const grid = areaRoomMw(state, site.area);
    if (mw > grid + 1e-9) {
      problems.push(grid <= 1e-9 ? `The ${AREAS[site.area].name} grid is full for now.` : `The ${AREAS[site.area].name} grid has room for ${fmtMw(grid)} more of your projects.`);
    }
  } else if (model.kind === 'rooftop') {
    const room = roofRoomMw(state);
    if (mw > room + 1e-9) problems.push(room <= 1e-9 ? 'The farm’s roofs are full.' : `The farm’s roofs have room for ${fmtMw(room)} more.`);
  }

  const costCents = cents(mw * 1000 * costPerKw(model, fractionalYear(t)));
  const maxShare = maxLoanShare(t);
  const share = Math.min(maxShare, Math.max(0, req.loanShare));
  if (req.loanShare > maxShare + 1e-9) problems.push(`Banks lend at most ${Math.round(maxShare * 100)}% now.`);
  const loanCents = Math.round(costCents * share);
  const equityCents = costCents - loanCents;
  const loanYears = (LOAN_TERMS_YEARS as readonly number[]).includes(req.loanYears) ? req.loanYears : LOAN_TERMS_YEARS[0];
  const ratePct = interestRate(t);
  const monthlyPaymentCents = loanCents > 0 ? monthlyPayment(loanCents, ratePct, loanYears * 12) : 0;
  if (equityCents > state.cashCents) problems.push(`You need ${eur(equityCents)} in cash; you have ${eur(Math.max(0, state.cashCents))}.`);

  const permitMonths = site === null ? 0 : AREAS[site.area].permitMonths;
  const permitDoneAt = dayCeil(t + permitMonths * HOURS_PER_MONTH);
  const onlineAt = dayCeil(permitDoneAt + model.buildMonths * HOURS_PER_MONTH);
  const factor = model.kind === 'wind' ? (site?.wind ?? 1) : (site?.sun ?? FARM.sun);
  const annualMwh = mw * model.meanCf * factor * 8760;
  const ref = referencePrice(state, market, model.kind);

  let regime: Regime;
  let regimeText: string;
  let expectedPrice: number;
  if (model.kind === 'rooftop') {
    regime = 'netmeter';
    const covered = Math.min(annualMwh, Math.max(0, FARM_USE_MWH - rooftopExpectedMwh(state)));
    const retail = retailPrice(state.year);
    expectedPrice = annualMwh > 0 ? (covered * retail + (annualMwh - covered) * ref) / annualMwh : retail;
    regimeText =
      covered >= annualMwh - 1e-9
        ? `Covers the farm’s own use, worth the retail price of about €${Math.round(retail)}/MWh.`
        : `About ${Math.round(covered)} MWh a year covers the farm’s own use (€${Math.round(retail)}/MWh); the rest is sold at the market price.`;
  } else {
    const terms = windRegime(state, onlineAt);
    regime = terms.regime;
    if (terms.regime === 'tariff') {
      expectedPrice = WIND_TARIFF;
      regimeText = `Online before the market opens (1 July 1999): a fixed €${WIND_TARIFF}/MWh for ${TARIFF_YEARS} years, then the hourly price.`;
    } else if (terms.regime === 'premium') {
      expectedPrice = ref + terms.premiumPerMwh;
      const years = annualMwh > 0 ? (terms.premiumFullLoadHours * mw) / annualMwh : 0;
      regimeText = `The hourly price (wind earned about €${Math.round(ref)}/MWh last year) plus €${terms.premiumPerMwh}/MWh for its first ${groupThousands(terms.premiumFullLoadHours)} full-load hours, about ${Math.round(years)} years.`;
    } else {
      expectedPrice = ref;
      regimeText = `The hourly price alone: wind earned about €${Math.round(ref)}/MWh last year.`;
    }
  }
  const annualRevenueCents = cents(annualMwh * expectedPrice);
  const annualFixedCents = fixedCentsPerYear(model, mw, site);
  const annualNetCents = annualRevenueCents - annualFixedCents;
  return {
    ok: problems.length === 0,
    problems,
    mw,
    costCents,
    loanCents,
    equityCents,
    maxLoanShare: maxShare,
    ratePct,
    monthlyPaymentCents,
    permitDoneAt,
    onlineAt,
    regime,
    regimeText,
    annualMwh,
    badYearMwh: annualMwh * BAD_YEAR,
    expectedPrice,
    annualRevenueCents,
    annualFixedCents,
    annualNetCents,
    paybackYears: annualNetCents > 0 ? costCents / annualNetCents : null,
  };
}

function fmtMw(mw: number): string {
  return mw < 1 ? `${Math.round(mw * 1000)} kW` : `${Math.round(mw * 10) / 10} MW`;
}

export type BuildResult = { readonly ok: true; readonly asset: Asset } | { readonly ok: false; readonly problems: readonly string[] };

export function build(state: GameState, market: MarketYear, req: BuildRequest): BuildResult {
  const p = preview(state, market, req);
  if (!p.ok) return { ok: false, problems: p.problems };
  const model = MODELS[req.model];
  const site = req.siteId === null ? null : (siteById(req.siteId) ?? null);
  const n = state.assets.filter((a) => a.siteId === req.siteId).length + 1;
  const name = site === null ? `Farm roof ${n}` : `${site.name} ${n}`;
  const terms: RegimeTerms =
    model.kind === 'rooftop' ? { regime: 'netmeter', tariffUntil: 0, premiumPerMwh: 0, premiumFullLoadHours: 0 } : windRegime(state, p.onlineAt);
  const asset = addAsset(state, {
    name,
    model,
    units: Math.floor(req.units),
    site,
    orderedAt: state.t,
    permitDoneAt: p.permitDoneAt,
    onlineAt: p.onlineAt,
    costCents: p.costCents,
    terms,
    expectedNetCents: p.annualNetCents,
    expectedPrice: p.expectedPrice,
  });
  state.cashCents -= p.equityCents;
  state.ledger.investedCents += p.costCents;
  if (p.loanCents > 0) {
    const loan: Loan = {
      id: state.nextId++,
      assetId: asset.id,
      label: name,
      principalCents: p.loanCents,
      balanceCents: p.loanCents,
      ratePct: p.ratePct,
      months: (LOAN_TERMS_YEARS as readonly number[]).includes(req.loanYears) ? req.loanYears * 12 : (LOAN_TERMS_YEARS[0] ?? 10) * 12,
      monthsPaid: 0,
      paymentCents: p.monthlyPaymentCents,
      firstPaymentAfter: p.onlineAt,
    };
    state.loans.push(loan);
    asset.loanId = loan.id;
    state.ledger.borrowedCents += p.loanCents;
  }
  const what = `${asset.units} × ${model.label}`;
  notice(
    state,
    site === null
      ? `Ordered ${what} for the farm’s roofs: up and running in ${monthLabel(p.onlineAt)}.`
      : `Ordered ${name}: ${what}. Permit expected ${monthLabel(p.permitDoneAt)}, turning from ${monthLabel(p.onlineAt)}.`,
    'good',
  );
  return { ok: true, asset };
}

// ---------------------------------------------------------------------------
// Finance actions

/** Sell an asset (or a project in progress) for a share of its value; its loan is repaid from the proceeds. */
function sellAt(state: GameState, asset: Asset, share: number): number {
  const price = Math.round(assetValue(asset, state.t) * share);
  state.cashCents += price;
  state.ledger.salesCents += price;
  const loan = state.loans.find((l) => l.id === asset.loanId);
  if (loan !== undefined && loan.balanceCents > 0) {
    state.cashCents -= loan.balanceCents;
    state.ledger.repaidCents += loan.balanceCents;
    loan.balanceCents = 0;
  }
  asset.status = 'sold';
  asset.endedAt = state.t;
  return price;
}

export function salePrice(state: GameState, assetId: number): number {
  const a = state.assets.find((x) => x.id === assetId);
  return a === undefined ? 0 : Math.round(assetValue(a, state.t) * SALE_SHARE);
}

export function sell(state: GameState, assetId: number): boolean {
  const a = state.assets.find((x) => x.id === assetId);
  if (a === undefined || a.endedAt !== null || state.over !== null) return false;
  const price = sellAt(state, a, SALE_SHARE);
  notice(state, `Sold ${a.name} for ${eur(price)}.`, 'info');
  return true;
}

export function repay(state: GameState, loanId: number): boolean {
  const l = state.loans.find((x) => x.id === loanId);
  if (l === undefined || l.balanceCents <= 0 || state.cashCents < l.balanceCents || state.over !== null) return false;
  state.cashCents -= l.balanceCents;
  state.ledger.repaidCents += l.balanceCents;
  notice(state, `Repaid the loan for ${l.label} early: ${eur(l.balanceCents)}.`, 'good');
  l.balanceCents = 0;
  return true;
}

/** How much more the company may borrow against its operating assets, cents. */
export function creditRoomCents(state: GameState): number {
  if (state.over !== null || state.t < state.feeUntil) return 0;
  let base = 0;
  for (const a of state.assets) if (a.status === 'operating') base += assetValue(a, state.t);
  return Math.max(0, Math.floor(base * CREDIT_SHARE) - debtCents(state));
}

export function companyLoanRate(t: number): number {
  return Math.round((interestRate(t) + CREDIT_RATE_ADD) * 100) / 100;
}

/** Take a company loan against the operating assets, repaid monthly from next month. */
export function borrow(state: GameState, amountCents: number, years: number): boolean {
  const amount = Math.floor(amountCents);
  if (!(amount > 0) || amount > creditRoomCents(state)) return false;
  if (!(LOAN_TERMS_YEARS as readonly number[]).includes(years)) return false;
  const ratePct = companyLoanRate(state.t);
  state.loans.push({
    id: state.nextId++,
    assetId: null,
    label: 'Company loan',
    principalCents: amount,
    balanceCents: amount,
    ratePct,
    months: years * 12,
    monthsPaid: 0,
    paymentCents: monthlyPayment(amount, ratePct, years * 12),
    firstPaymentAfter: state.t,
  });
  state.cashCents += amount;
  state.ledger.borrowedCents += amount;
  notice(state, `Borrowed ${eur(amount)} against your assets, at ${ratePct}% over ${years} years.`, 'info');
  return true;
}

/** Instalments due a month on the loans still running, cents. */
export function monthlyDebtService(state: GameState): number {
  let s = 0;
  for (const l of state.loans) if (l.balanceCents > 0) s += Math.min(l.paymentCents, l.balanceCents);
  return s;
}

// ---------------------------------------------------------------------------
// Time

/** Settle a closed month: fixed costs, instalments and any restructuring fee. `t` is the first hour after it. */
function closeMonth(state: GameState, t: number): void {
  const { year: y, month: m } = toDate(t - 1);
  const hoursOfYear = hoursInYear(y);
  let net = 0;
  for (const a of state.assets) {
    if (a.monthHours === 0 && a.monthRevenueCents === 0) continue;
    const fixed = Math.round((a.fixedCentsPerYear * a.monthHours) / hoursOfYear);
    state.cashCents -= fixed;
    state.ledger.fixedCostCents += fixed;
    a.year.fixedCostCents += fixed;
    const assetNet = a.monthRevenueCents - fixed;
    a.monthNet.push(assetNet);
    if (a.monthNet.length > 36) a.monthNet.splice(0, a.monthNet.length - 36);
    net += assetNet;
    a.monthRevenueCents = 0;
    a.monthHours = 0;
  }
  for (const l of state.loans) {
    if (l.balanceCents <= 0 || l.firstPaymentAfter >= t) continue;
    const interest = Math.round((l.balanceCents * l.ratePct) / 1200);
    let principal = l.monthsPaid >= l.months - 1 ? l.balanceCents : Math.max(0, l.paymentCents - interest);
    principal = Math.min(principal, l.balanceCents);
    state.cashCents -= interest + principal;
    state.ledger.interestCents += interest;
    state.ledger.repaidCents += principal;
    l.balanceCents -= principal;
    l.monthsPaid++;
    net -= interest;
    if (l.balanceCents === 0) notice(state, `The loan for ${l.label} is paid off.`, 'good');
  }
  if (t <= state.feeUntil && net > 0) {
    const fee = Math.round(net * RESTRUCTURE_FEE_SHARE);
    state.cashCents -= fee;
    state.ledger.feeCents += fee;
  }
  state.closedMonth = (y - START_YEAR) * 12 + m - 1;
}

function fireEvents(state: GameState): void {
  for (const e of EVENTS) {
    if (state.firedEvents.includes(e.id)) continue;
    if (state.t < dateHour(e.at[0], e.at[1], e.at[2])) continue;
    state.firedEvents.push(e.id);
    state.headlines.push(e.title);
    if (e.card) card(state, { kind: 'event', title: e.title, body: e.body });
    else notice(state, e.title, 'event');
  }
}

function updateAssets(state: GameState): void {
  const t = state.t;
  for (const a of state.assets) {
    if (a.endedAt !== null) continue;
    if (a.status === 'permitting' && t >= a.permitDoneAt) {
      a.status = 'building';
      if (a.siteId !== null) notice(state, `Permit granted for ${a.name}: construction starts.`, 'info');
    }
    if (a.status === 'building' && t >= a.onlineAt) {
      a.status = 'operating';
      const first = a.kind === 'wind' && !state.assets.some((b) => b !== a && b.kind === 'wind' && b.status !== 'permitting' && b.status !== 'building');
      notice(state, `${a.name} is online: ${a.units} × ${MODELS[a.model].label}.`, 'good');
      if (first) state.headlines.push(`Your first turbine started turning at ${a.name}.`);
    }
    if (a.status === 'operating' && a.regime === 'tariff' && t === a.tariffUntil) {
      notice(state, `${a.name}’s fixed tariff has ended: it now earns the hourly price.`, 'info');
    }
    if (a.status === 'operating' && t >= a.retireAt) {
      a.status = 'retired';
      a.endedAt = t;
      notice(state, `${a.name} has reached the end of its life and is taken down.`, 'info');
    }
  }
}

function updateClaims(state: GameState): void {
  const t = state.t;
  for (const ss of state.sites) {
    if (ss.claimAt === null || ss.announceAt === null) continue;
    const site = siteById(ss.id);
    if (site === undefined) continue;
    if (!ss.announced && t >= ss.announceAt) {
      ss.announced = true;
      if (siteRoomMw(state, ss.id) > 0) {
        notice(state, `${ss.claimant} has applied to build at ${site.name}. In ${CLAIM_NOTICE_MONTHS} months the free room there is gone.`, 'bad');
      }
    }
    if (t === ss.claimAt) {
      const free = siteRoomMw(state, ss.id);
      if (free > 0) {
        ss.claimedMw += free;
        notice(state, `${ss.claimant} has taken the rest of ${site.name}: ${fmtMw(free)}.`, 'bad');
        state.headlines.push(`${ss.claimant} built at ${site.name}.`);
      }
    }
  }
}

function restructure(state: GameState): void {
  state.restructurings++;
  state.negativeCashSince = null;
  if (state.restructurings >= 2) {
    endGame(state, 'bank');
    return;
  }
  const target = RESTRUCTURE_BUFFER_MONTHS * monthlyDebtService(state);
  const candidates = state.assets
    .filter((a) => a.endedAt === null)
    .sort((a, b) => trailingAnnualNet(a) - trailingAnnualNet(b) || a.id - b.id);
  const sold: string[] = [];
  for (const a of candidates) {
    if (state.cashCents >= target && state.cashCents >= 0) break;
    sellAt(state, a, RESTRUCTURE_SALE_SHARE);
    sold.push(a.name);
  }
  if (state.cashCents < 0) {
    endGame(state, 'bank');
    return;
  }
  state.feeUntil = state.t + RESTRUCTURE_FEE_YEARS * HOURS_PER_YEAR;
  state.goldBlocked = true;
  state.headlines.push('The bank restructured the company.');
  card(state, {
    kind: 'restructured',
    title: 'The bank has restructured your company',
    body: [
      `Your cash stayed below zero for ${DAYS_BELOW_ZERO} days, so the bank stepped in.`,
      sold.length > 0 ? `It sold ${sold.join(', ')} at ${Math.round(RESTRUCTURE_SALE_SHARE * 100)}% of their value.` : 'It sold nothing: your cash just covers the next instalments.',
      `For ${RESTRUCTURE_FEE_YEARS} years, a quarter of each month’s positive cash flow goes to the bank as a fee.`,
      'Gold is no longer possible in this game. If it happens again, the bank takes over the company.',
    ],
  });
}

function checkCash(state: GameState): void {
  if (state.cashCents >= 0) {
    state.negativeCashSince = null;
    return;
  }
  if (state.negativeCashSince === null) {
    state.negativeCashSince = state.t;
    card(state, {
      kind: 'cash',
      title: 'Your cash is below zero',
      body: [
        `You have ${DAYS_BELOW_ZERO} days to get back above zero. After that the bank steps in and sells assets for you, at a poor price.`,
        'Ways out: borrow against your assets (Finance), sell an asset, or hope for a windy month. Next time keep a cash buffer for calm months and instalments.',
      ],
    });
    return;
  }
  if (state.t - state.negativeCashSince >= DAYS_BELOW_ZERO * 24) restructure(state);
}

function daily(state: GameState): void {
  const mi = monthIndex(state.t);
  if (mi - 1 > state.closedMonth && state.t > 0) closeMonth(state, state.t);
  updateAssets(state);
  fireEvents(state);
  updateClaims(state);
  checkCash(state);
}

function stepHour(state: GameState, market: MarketYear): void {
  const h = state.hourOfYear;
  const t = state.t;
  if (h % 24 === 0) daily(state);
  if (state.over !== null) return;
  const price = market.price[h] ?? 0;
  const marketPrice = market.marketPrice[h] ?? 0;
  const wind = (market.windCf[h] ?? 0) / market.zoneWindMeanCf;
  const sun = (market.solarCf[h] ?? 0) / market.zoneSolarMeanCf;
  for (const a of state.assets) {
    if (a.status !== 'operating') continue;
    const m = MODELS[a.model];
    const age = (t - a.onlineAt) / HOURS_PER_YEAR;
    let out: number;
    if (a.kind === 'wind') out = a.mw * Math.min(MAX_WIND_CF, wind * m.meanCf * a.windFactor) * Math.max(0, 1 - WIND_AGEING_PER_YEAR * age);
    else out = a.mw * Math.min(1, sun * m.meanCf * a.sunFactor) * Math.max(0, 1 - SOLAR_DEGRADATION_PER_YEAR * age);
    let rev: number;
    switch (a.regime) {
      case 'tariff':
        rev = out * (t < a.tariffUntil ? WIND_TARIFF : price);
        break;
      case 'premium': {
        const prem = Math.min(out, a.premiumMwhLeft);
        a.premiumMwhLeft -= prem;
        rev = out * price + prem * a.premiumPerMwh;
        break;
      }
      case 'netmeter': {
        const covered = Math.min(out, state.netMeterLeftMwh);
        state.netMeterLeftMwh -= covered;
        rev = covered * retailPrice(state.year) + (out - covered) * price;
        break;
      }
      default:
        rev = out * price;
    }
    const revExact = a.revenueCarry + rev * 100;
    const revCents = Math.round(revExact);
    a.revenueCarry = revExact - revCents;
    const mvExact = a.marketValueCarry + out * marketPrice * 100;
    const mv = Math.round(mvExact);
    a.marketValueCarry = mvExact - mv;
    state.cashCents += revCents;
    state.ledger.revenueCents += revCents;
    state.ledger.outputMwh += out;
    state.ledger.marketValueCents += mv;
    a.monthRevenueCents += revCents;
    a.monthHours++;
    a.year.outputMwh += out;
    a.year.revenueCents += revCents;
    a.year.marketValueCents += mv;
    a.lifetimeMwh += out;
    a.lifetimeRevenueCents += revCents;
  }
  state.hourOfYear++;
  state.t++;
}

/**
 * Play up to `maxHours` hours of the current year. Stops early at the end of
 * the year, when a card is waiting for the player, or when the game is over.
 * Returns the hours played.
 */
export function advance(state: GameState, market: MarketYear, maxHours: number): number {
  if (market.year !== state.year) throw new Error(`the market is for ${market.year}, the game is in ${state.year}`);
  let n = 0;
  while (n < maxHours && state.hourOfYear < market.hours && state.cards.length === 0 && state.over === null) {
    stepHour(state, market);
    n++;
  }
  return n;
}

export function yearDone(state: GameState, market: MarketYear): boolean {
  return state.hourOfYear >= market.hours;
}

// ---------------------------------------------------------------------------
// The end of a year, and of the game

function bestWorst(state: GameState): [YearReport['best'], YearReport['worst']] {
  const rows = state.assets
    .filter((a) => a.year.outputMwh > 0 && a.mw > 0)
    .map((a) => ({ name: a.name, netPerMwEur: (a.year.revenueCents - a.year.fixedCostCents) / 100 / a.mw }));
  if (rows.length < 2) return [null, null];
  rows.sort((a, b) => b.netPerMwEur - a.netPerMwEur);
  return [rows[0] ?? null, rows[rows.length - 1] ?? null];
}

export function closeYear(state: GameState, market: MarketYear): YearReport {
  if (!yearDone(state, market)) throw new Error('the year is not over yet');
  if (monthIndex(state.t) - 1 > state.closedMonth) closeMonth(state, state.t);
  const s = market.summary;
  const L = state.ledger;
  const [best, worst] = bestWorst(state);
  let mwOperating = 0;
  let mwBuilding = 0;
  for (const a of state.assets) {
    if (a.status === 'operating') mwOperating += a.mw;
    else if (a.status === 'permitting' || a.status === 'building') mwBuilding += a.mw;
  }
  const report: YearReport = {
    year: state.year,
    ledger: { ...L },
    cashStartCents: state.cashStartCents,
    cashEndCents: state.cashCents,
    valueStartCents: state.valueStartCents,
    valueEndCents: companyValue(state),
    debtEndCents: debtCents(state),
    earnedPrice: L.outputMwh > 0 ? L.revenueCents / 100 / L.outputMwh : null,
    marketEarnedPrice: L.outputMwh > 0 ? L.marketValueCents / 100 / L.outputMwh : null,
    dk1: {
      meanPrice: s.meanPrice,
      windCapturePrice: s.windCapturePrice,
      windCaptureRate: s.windCaptureRate,
      windMw: s.windMw,
      solarMw: s.solarMw,
      windMwBefore: state.lastMarket?.windMw ?? null,
      solarMwBefore: state.lastMarket?.solarMw ?? null,
      negativeHours: s.negativeHours,
      maxPrice: s.maxPrice,
      marketOpen: market.marketOpenFromHour < market.hours,
    },
    best,
    worst,
    mwOperating,
    mwBuilding,
    sharePct: s.generationMwh > 0 ? (100 * L.outputMwh) / s.generationMwh : 0,
    homes: L.outputMwh / HOUSEHOLD_MWH,
    headlines: [...state.headlines],
  };
  state.reports.push(report);
  card(state, { kind: 'annual', title: `${state.year} · Annual report`, body: [], year: state.year });
  state.lastMarket = {
    year: state.year,
    windMw: s.windMw,
    solarMw: s.solarMw,
    windCapturePrice: s.windCapturePrice,
    solarCapturePrice: s.solarCapturePrice,
    meanPrice: s.meanPrice,
  };
  if (state.year >= END_YEAR) {
    endGame(state, 'end');
    return report;
  }
  state.year++;
  state.hourOfYear = 0;
  state.ledger = emptyLedger();
  state.netMeterLeftMwh = FARM_USE_MWH;
  state.headlines = [];
  for (const a of state.assets) a.year = { outputMwh: 0, revenueCents: 0, fixedCostCents: 0, marketValueCents: 0 };
  state.cashStartCents = state.cashCents;
  state.valueStartCents = companyValue(state);
  return report;
}

/** Market value of the player's output per MWh against DK1's average price, over the last three years (§7's gold condition). */
export function earnedShare(state: GameState): number | null {
  const last = state.reports.filter((r) => r.year >= END_YEAR - 2);
  let mv = 0;
  let out = 0;
  let mean = 0;
  for (const r of last) {
    mv += r.ledger.marketValueCents / 100;
    out += r.ledger.outputMwh;
    mean += r.dk1.meanPrice;
  }
  if (last.length === 0 || out <= 0) return null;
  mean /= last.length;
  return mean > 0 ? mv / out / mean : null;
}

function endGame(state: GameState, kind: Outcome['kind']): void {
  const valueCents = companyValue(state);
  const share = earnedShare(state);
  const why: string[] = [];
  let medal: Medal = 'none';
  if (kind === 'bank') {
    why.push(state.restructurings >= 2 ? 'Your cash fell below zero for too long a second time, so the bank took over the company.' : 'Even after selling everything, your cash stayed below zero, so the bank took over the company.');
  } else {
    const v = valueCents / 100;
    const solvent = state.cashCents >= 0;
    if (v >= MEDAL_GOLD_EUR && share !== null && share >= MEDAL_GOLD_EARNED_SHARE && !state.goldBlocked) medal = 'gold';
    else if (v >= MEDAL_SILVER_EUR) medal = 'silver';
    else if (v >= MEDAL_BRONZE_EUR && solvent) medal = 'bronze';
    why.push(`Company value at the end of ${END_YEAR}: ${eur(valueCents)}. Bronze needs €25m, silver €100m, gold €250m.`);
    if (share !== null) {
      why.push(`In ${END_YEAR - 2}–${END_YEAR} your output earned ${Math.round(share * 100)}% of DK1’s average price at market prices; gold needs 90%.`);
    }
    if (state.goldBlocked) why.push('Gold was out of reach after the bank restructured the company.');
  }
  state.over = { kind, medal, valueCents, earnedShare: share, why };
  card(state, {
    kind: kind === 'bank' ? 'gameover' : 'end',
    title: kind === 'bank' ? 'The bank takes over' : `The end of ${END_YEAR}`,
    body: why,
  });
}

export function dismissCard(state: GameState): Card | undefined {
  return state.cards.shift();
}

/** Date label of the game's current hour. */
export function nowLabel(state: GameState): string {
  return dateLabel(state.t);
}

