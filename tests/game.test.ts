/**
 * The game rules against a fake market (constant prices and weather), so
 * each rule can be checked by hand: tariffs, premiums, net metering, loans,
 * sales, the company loan, restructuring, history's site claims, the year's
 * close and the end of the chapter.
 */
import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs } from '../src/data/placeholder';
import {
  EVENTS,
  FARM_USE_MWH,
  MODELS,
  SITES,
  advance,
  annuityFactor,
  borrow,
  build,
  closeYear,
  companyValue,
  creditRoomCents,
  dateHour,
  dateLabel,
  debtCents,
  dismissCard,
  groupThousands,
  interestRate,
  maxLoanShare,
  monthIndex,
  monthlyPayment,
  newGame,
  preview,
  repay,
  retailPrice,
  sell,
  toDate,
  windRegime,
  yearDone,
  yearStart,
  type GameState,
  type MarketYear,
} from '../src/game';
import { hoursInYear } from '../src/sim';

const inputs = loadPlaceholderInputs();

interface FakeOptions {
  readonly price?: number;
  readonly windCf?: number;
  readonly solarCf?: number;
}

function fakeMarket(year: number, o: FakeOptions = {}): MarketYear {
  const hours = hoursInYear(year);
  const price = o.price ?? 30;
  const fill = (v: number): Float64Array => new Float64Array(hours).fill(v);
  return {
    year,
    hours,
    marketOpenFromHour: 0,
    negativeFromHour: hours,
    price: fill(price),
    marketPrice: fill(price),
    windCf: fill(o.windCf ?? 0.3),
    solarCf: fill(o.solarCf ?? 0.11),
    zoneWindMeanCf: 0.3,
    zoneSolarMeanCf: 0.11,
    added: { windMw: 0, solarMw: 0 },
    summary: {
      meanPrice: price,
      windCapturePrice: price,
      windCaptureRate: 1,
      solarCapturePrice: price,
      solarCaptureRate: 1,
      windMw: 1000,
      solarMw: 0,
      generationMwh: 2e7,
      demandMwh: 2e7,
      negativeHours: 0,
      maxPrice: price,
      minPrice: price,
    },
  };
}

/** Play until absolute hour `until`, dismissing cards and closing years on fake markets. */
function playTo(state: GameState, until: number, market: (year: number) => MarketYear = (y) => fakeMarket(y)): MarketYear {
  let m = market(state.year);
  while (state.t < until && state.over === null) {
    while (state.cards.length > 0) dismissCard(state);
    advance(state, m, until - state.t);
    if (yearDone(state, m)) {
      closeYear(state, m);
      if (state.over !== null) break;
      m = market(state.year);
    }
  }
  while (state.cards.length > 0) dismissCard(state);
  return m;
}

/** A new game moved to 00:00 on 1 January of `year`, as if the years before had passed quietly. */
function gameIn(year: number, seed = 1): GameState {
  const s = newGame(seed, inputs);
  s.cards.length = 0;
  s.t = yearStart(year);
  s.year = year;
  s.closedMonth = monthIndex(s.t) - 1;
  s.firedEvents = EVENTS.map((e) => e.id);
  for (const site of s.sites) site.announced = true;
  return s;
}

function ledgerBalances(r: GameState['reports'][number]): boolean {
  const L = r.ledger;
  const expected = r.cashStartCents + L.revenueCents - L.fixedCostCents - L.interestCents - L.repaidCents - L.feeCents - L.investedCents + L.borrowedCents + L.salesCents;
  return expected === r.cashEndCents;
}

describe('money', () => {
  it('computes annuity instalments that clear the loan', () => {
    const principal = 1_000_000_00;
    const pay = monthlyPayment(principal, 6, 120);
    expect(pay).toBe(1_110_205);
    let balance = principal;
    for (let m = 0; m < 120; m++) {
      const interest = Math.round((balance * 6) / 1200);
      const p = m === 119 ? balance : pay - interest;
      balance -= p;
    }
    expect(balance).toBe(0);
    expect(monthlyPayment(1200, 0, 12)).toBe(100);
    expect(annuityFactor(0.07, 20)).toBeCloseTo(10.594, 3);
  });

  it('groups thousands without a locale', () => {
    expect(groupThousands(1234567)).toBe('1,234,567');
    expect(groupThousands(-1000)).toBe('-1,000');
    expect(groupThousands(999.6)).toBe('1,000');
    expect(groupThousands(0)).toBe('0');
  });
});

describe('clock', () => {
  it('counts hours from 1 January 1995', () => {
    expect(yearStart(1995)).toBe(0);
    expect(yearStart(1996)).toBe(8760);
    expect(yearStart(1997)).toBe(8760 + 8784);
    expect(dateHour(1999, 7, 1)).toBe(yearStart(1999) + 181 * 24);
    expect(toDate(dateHour(2012, 2, 29) + 5)).toEqual({ year: 2012, month: 2, day: 29, hour: 5 });
    expect(dateLabel(dateHour(2013, 3, 14))).toBe('14 Mar 2013');
    expect(monthIndex(dateHour(1996, 2, 1))).toBe(13);
  });
});

describe('a new game', () => {
  it('starts on the farm with panels on the barn and a welcome card', () => {
    const s = newGame(42, inputs);
    expect(s.t).toBe(0);
    expect(s.year).toBe(1995);
    expect(s.cashCents).toBe(150_000_00);
    expect(s.assets.length).toBe(1);
    expect(s.assets[0]?.name).toBe('Barn roof');
    expect(s.assets[0]?.status).toBe('operating');
    expect(s.assets[0]?.mw).toBeCloseTo(0.01, 9);
    expect(s.cards[0]?.kind).toBe('welcome');
    expect(s.marketOpenAt).toBe(dateHour(1999, 7, 1));
    expect(companyValue(s)).toBeGreaterThan(150_000_00);
  });

  it('draws history’s site claims from the seed', () => {
    const a = newGame(1, inputs).sites.map((x) => x.claimAt);
    const b = newGame(1, inputs).sites.map((x) => x.claimAt);
    const c = newGame(2, inputs).sites.map((x) => x.claimAt);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a.filter((x) => x !== null).length).toBe(SITES.filter((x) => x.claimWindow !== null).length);
  });
});

describe('selling power', () => {
  it('values the barn’s output at the retail price until the farm’s own use is covered, then at the hourly price', () => {
    const s = newGame(1, inputs);
    s.cards.length = 0;
    const m = fakeMarket(1995, { price: 20 });
    advance(s, m, 24 * 10);
    expect(s.ledger.outputMwh).toBeGreaterThan(0);
    expect(s.ledger.revenueCents / 100 / s.ledger.outputMwh).toBeCloseTo(retailPrice(1995), 1);
    s.netMeterLeftMwh = 0;
    const before = { rev: s.ledger.revenueCents, out: s.ledger.outputMwh };
    advance(s, m, 24 * 10);
    expect((s.ledger.revenueCents - before.rev) / 100 / (s.ledger.outputMwh - before.out)).toBeCloseTo(20, 1);
    expect(FARM_USE_MWH).toBeGreaterThan(0);
  });

  it('pays turbines online before July 1999 the fixed tariff for ten years, then the hourly price', () => {
    const s = newGame(1, inputs);
    s.cards.length = 0;
    const m0 = fakeMarket(1995, { price: 10 });
    const p = preview(s, m0, { siteId: 'thy', model: 'w600', units: 1, loanShare: 0.8, loanYears: 15 });
    expect(p.ok).toBe(true);
    expect(p.regime).toBe('tariff');
    expect(p.costCents).toBe(600_000_00);
    expect(p.equityCents).toBe(120_000_00);
    expect(p.ratePct).toBe(8);
    const r = build(s, m0, { siteId: 'thy', model: 'w600', units: 1, loanShare: 0.8, loanYears: 15 });
    expect(r.ok).toBe(true);
    expect(s.cashCents).toBe(30_000_00);
    expect(debtCents(s)).toBe(480_000_00);
    const a = s.assets[1];
    if (a === undefined) throw new Error('no asset');
    expect(a.status).toBe('permitting');
    expect(a.onlineAt).toBeGreaterThan(a.permitDoneAt);
    playTo(s, a.onlineAt + 24 * 60, (y) => fakeMarket(y, { price: 10 }));
    expect(a.status).toBe('operating');
    expect(s.notices.some((n) => n.text.startsWith('Permit granted for Thy 1'))).toBe(true);
    expect(s.notices.some((n) => n.text.startsWith('Thy 1 is online'))).toBe(true);
    expect(a.year.revenueCents / 100 / a.year.outputMwh).toBeCloseTo(80, 1);
    // Thy is ×1.30: a 600 kW turbine's capacity factor is 0.23 × 1.30 at the zone's average wind.
    expect(a.year.outputMwh / (a.mw * (s.t - Math.max(a.onlineAt, yearStart(s.year))))).toBeCloseTo(0.23 * 1.3, 3);
    // The first instalment is paid after the month it came online.
    const loan = s.loans[0];
    expect(loan?.monthsPaid).toBeGreaterThan(0);
    expect(loan?.balanceCents).toBeLessThan(480_000_00);
    // Ten years on, the tariff has ended.
    playTo(s, a.tariffUntil + 24 * 30, (y) => fakeMarket(y, { price: 10 }));
    expect(s.notices.some((n) => n.text.includes('fixed tariff has ended'))).toBe(true);
    expect(a.year.revenueCents / 100 / a.year.outputMwh).toBeLessThan(80);
    for (const rep of s.reports) expect(ledgerBalances(rep)).toBe(true);
  });

  it('sets the selling regime by commissioning date', () => {
    const s = newGame(1, inputs);
    expect(windRegime(s, dateHour(1999, 6, 30)).regime).toBe('tariff');
    expect(windRegime(s, dateHour(1999, 7, 1))).toMatchObject({ regime: 'premium', premiumPerMwh: 25 });
    expect(windRegime(s, dateHour(2003, 1, 1))).toMatchObject({ regime: 'premium', premiumPerMwh: 13 });
    expect(windRegime(s, dateHour(2008, 1, 1))).toMatchObject({ regime: 'premium', premiumPerMwh: 33, premiumFullLoadHours: 22_000 });
    expect(windRegime(s, dateHour(2017, 1, 1)).regime).toBe('market');
  });

  it('pays the premium on top of the hourly price until its full-load hours are used up', () => {
    const s = gameIn(2001);
    s.cashCents = 5_000_000_00;
    const m = fakeMarket(2001, { price: 20 });
    const r = build(s, m, { siteId: 'aalborg', model: 'w2000', units: 1, loanShare: 0, loanYears: 10 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const a = r.asset;
    expect(a.regime).toBe('premium');
    expect(a.premiumMwhLeft).toBe(22_000 * 2);
    playTo(s, a.onlineAt + 24 * 30, (y) => fakeMarket(y, { price: 20 }));
    expect(a.year.revenueCents / 100 / a.year.outputMwh).toBeCloseTo(45, 1);
    a.premiumMwhLeft = 0;
    const before = { rev: a.year.revenueCents, out: a.year.outputMwh };
    playTo(s, s.t + 24 * 10, (y) => fakeMarket(y, { price: 20 }));
    expect((a.year.revenueCents - before.rev) / 100 / (a.year.outputMwh - before.out)).toBeCloseTo(20, 1);
  });
});

describe('building', () => {
  it('names what stands in the way', () => {
    const s = newGame(1, inputs);
    const m = fakeMarket(1995);
    const cash = preview(s, m, { siteId: 'thy', model: 'w600', units: 20, loanShare: 0.8, loanYears: 15 });
    expect(cash.ok).toBe(false);
    expect(cash.problems.join(' ')).toContain('in cash');
    const early = preview(s, m, { siteId: 'thy', model: 'w4000', units: 1, loanShare: 0.8, loanYears: 15 });
    expect(early.problems.join(' ')).toContain('2015–2025');
    const roof = preview(s, m, { siteId: null, model: 'roof50', units: 2, loanShare: 0, loanYears: 10 });
    expect(roof.problems.join(' ')).toContain('roofs have room');
    const noSite = preview(s, m, { siteId: null, model: 'w225', units: 1, loanShare: 0.8, loanYears: 10 });
    expect(noSite.problems.join(' ')).toContain('need a site');

    const rich = gameIn(2005);
    rich.cashCents = 100_000_000_00;
    const m5 = fakeMarket(2005);
    const site = preview(rich, m5, { siteId: 'aarhus', model: 'w2000', units: 8, loanShare: 0.8, loanYears: 15 });
    expect(site.problems.join(' ')).toContain('Aarhus has room for 15 MW more');
    const grid = preview(rich, m5, { siteId: 'herning', model: 'w2000', units: 13, loanShare: 0.8, loanYears: 15 });
    expect(grid.problems.join(' ')).toContain('Central heath grid has room for 25 MW');
    expect(preview(rich, m5, { siteId: 'herning', model: 'w2000', units: 12, loanShare: 0.8, loanYears: 15 }).ok).toBe(true);
  });

  it('tightens credit in the 2008 crisis', () => {
    expect(maxLoanShare(dateHour(2008, 9, 30))).toBe(0.8);
    expect(maxLoanShare(dateHour(2009, 3, 1))).toBe(0.6);
    expect(maxLoanShare(dateHour(2010, 10, 1))).toBe(0.8);
    expect(interestRate(dateHour(2009, 3, 1)) - interestRate(dateHour(2008, 9, 30))).toBeGreaterThan(1);
    const s = gameIn(2009);
    s.cashCents = 10_000_000_00;
    const p = preview(s, fakeMarket(2009), { siteId: 'aalborg', model: 'w2000', units: 1, loanShare: 0.8, loanYears: 15 });
    expect(p.problems.join(' ')).toContain('at most 60%');
  });
});

describe('finance', () => {
  it('sells an asset and repays its loan from the proceeds', () => {
    const s = newGame(1, inputs);
    s.cards.length = 0;
    const m = fakeMarket(1995);
    const r = build(s, m, { siteId: 'thy', model: 'w600', units: 1, loanShare: 0.8, loanYears: 15 });
    if (!r.ok) throw new Error('build failed');
    const cashBefore = s.cashCents;
    expect(sell(s, r.asset.id)).toBe(true);
    expect(r.asset.status).toBe('sold');
    expect(debtCents(s)).toBe(0);
    // Under construction it is worth its cost; a sale fetches 90% of that, less the loan.
    expect(s.cashCents - cashBefore).toBe(Math.round(600_000_00 * 0.9) - 480_000_00);
    expect(sell(s, r.asset.id)).toBe(false);
  });

  it('repays a loan early from cash', () => {
    const s = newGame(1, inputs);
    s.cards.length = 0;
    s.cashCents = 1_000_000_00;
    const r = build(s, fakeMarket(1995), { siteId: 'thy', model: 'w600', units: 1, loanShare: 0.8, loanYears: 15 });
    if (!r.ok) throw new Error('build failed');
    const loan = s.loans[0];
    if (loan === undefined) throw new Error('no loan');
    expect(repay(s, loan.id)).toBe(true);
    expect(loan.balanceCents).toBe(0);
    expect(s.cashCents).toBe(1_000_000_00 - 120_000_00 - 480_000_00);
    expect(repay(s, loan.id)).toBe(false);
  });

  it('lends against operating assets up to the limit', () => {
    const s = newGame(1, inputs);
    s.cards.length = 0;
    const r = build(s, fakeMarket(1995, { price: 30 }), { siteId: 'thy', model: 'w600', units: 1, loanShare: 0.8, loanYears: 15 });
    if (!r.ok) throw new Error('build failed');
    expect(creditRoomCents(s)).toBe(0); // the turbine is not running yet; the barn alone does not cover the project loan
    playTo(s, r.asset.onlineAt + 24, (y) => fakeMarket(y, { price: 30 }));
    const room = creditRoomCents(s);
    expect(room).toBeGreaterThan(0);
    expect(borrow(s, room + 100, 10)).toBe(false);
    expect(borrow(s, room, 12)).toBe(false); // terms are 10 or 15 years
    const cash = s.cashCents;
    expect(borrow(s, room, 10)).toBe(true);
    expect(s.cashCents - cash).toBe(room);
    expect(creditRoomCents(s)).toBeLessThanOrEqual(1);
    expect(s.loans.some((l) => l.label === 'Company loan')).toBe(true);
  });
});

describe('going bust', () => {
  it('restructures after 90 days below zero, then the bank takes over the second time', () => {
    const s = newGame(1, inputs);
    s.cards.length = 0;
    const r = build(s, fakeMarket(1995), { siteId: 'thy', model: 'w600', units: 1, loanShare: 0.8, loanYears: 15 });
    if (!r.ok) throw new Error('build failed');
    playTo(s, r.asset.onlineAt + 24 * 40);
    s.cashCents = -50_000_00;
    const m = fakeMarket(s.year, { price: 30, windCf: 0 });
    // A calm spell: nothing earns. The first day below zero raises a warning card.
    advance(s, m, 24);
    expect(s.cards[0]?.kind).toBe('cash');
    let guard = 0;
    while (s.restructurings === 0 && guard++ < 200) {
      while (s.cards.length > 0) dismissCard(s);
      advance(s, m, 24);
    }
    expect(s.restructurings).toBe(1);
    expect(s.cards.some((c) => c.kind === 'restructured')).toBe(true);
    expect(s.goldBlocked).toBe(true);
    expect(s.cashCents).toBeGreaterThanOrEqual(0);
    expect(s.assets.some((a) => a.status === 'sold')).toBe(true);
    while (s.cards.length > 0) dismissCard(s);
    s.cashCents = -1_000_00;
    guard = 0;
    while (s.over === null && guard++ < 200) {
      while (s.cards.length > 0) dismissCard(s);
      advance(s, m, 24);
    }
    expect(s.over?.kind).toBe('bank');
    expect(s.cards.some((c) => c.kind === 'gameover')).toBe(true);
  });
});

describe('history claims sites', () => {
  it('announces a claim, then takes the room the player has not used', () => {
    const s = newGame(3, inputs);
    s.cards.length = 0;
    const ss = s.sites.find((x) => x.claimAt !== null);
    const site = SITES.find((x) => x.id === ss?.id);
    if (ss === undefined || ss.claimAt === null || site === undefined) throw new Error('no claim');
    playTo(s, ss.claimAt - 24);
    expect(s.notices.some((n) => n.text.includes(`applied to build at ${site.name}`))).toBe(true);
    expect(ss.claimedMw).toBe(0);
    playTo(s, ss.claimAt + 24);
    expect(ss.claimedMw).toBe(site.maxMw);
    expect(s.notices.some((n) => n.text.includes(`taken the rest of ${site.name}`))).toBe(true);
  });

  it('leaves the player’s own turbines on a claimed site', () => {
    const s = newGame(3, inputs);
    s.cards.length = 0;
    s.cashCents = 10_000_000_00;
    const ss = s.sites.find((x) => x.claimAt !== null && x.claimAt > 24 * 400);
    if (ss === undefined || ss.claimAt === null) throw new Error('no late claim');
    const r = build(s, fakeMarket(1995), { siteId: ss.id, model: 'w600', units: 5, loanShare: 0.8, loanYears: 15 });
    expect(r.ok).toBe(true);
    playTo(s, ss.claimAt + 24);
    const site = SITES.find((x) => x.id === ss.id);
    expect(ss.claimedMw).toBeCloseTo((site?.maxMw ?? 0) - 3, 9);
  });
});

describe('the year and the chapter', () => {
  it('closes a year with an annual report whose cash adds up', () => {
    const s = newGame(1, inputs);
    s.cards.length = 0;
    build(s, fakeMarket(1995), { siteId: 'thy', model: 'w600', units: 1, loanShare: 0.8, loanYears: 15 });
    playTo(s, yearStart(1997));
    expect(s.year).toBe(1997);
    expect(s.reports.map((r) => r.year)).toEqual([1995, 1996]);
    for (const r of s.reports) expect(ledgerBalances(r)).toBe(true);
    const r96 = s.reports[1];
    expect(r96?.mwOperating).toBeCloseTo(0.61, 9);
    expect(r96?.earnedPrice).toBeGreaterThan(70);
    expect(r96?.valueStartCents).toBe(s.reports[0]?.valueEndCents);
    expect(s.ledger.revenueCents).toBe(0);
  });

  it('ends on 31 December 2025 with a medal verdict', () => {
    const s = gameIn(2025);
    const m = fakeMarket(2025);
    playTo(s, yearStart(2026), () => m);
    expect(s.over?.kind).toBe('end');
    expect(s.over?.medal).toBe('none');
    expect(s.reports.at(-1)?.year).toBe(2025);
    expect(MODELS.w4000.fromYear).toBe(2015);
  });
});
