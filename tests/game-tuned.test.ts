/**
 * Round 1's tuned comparison mode (`play.html?tuned=1`, tasks/done/2026-10-04-fun-core-toy.md
 * part c): slice 1 with income ×3 and three stub offers. A normal game must be
 * untouched by it.
 */
import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs } from '../src/data/placeholder';
import {
  EVENTS,
  FIRESALE_PRICE_EUR,
  FIRESALE_UNITS,
  LANDOWNER_FEE_EUR,
  TUNED_INCOME_FACTOR,
  TUNED_OFFERS,
  advance,
  answerOffer,
  build,
  closeYear,
  dateHour,
  deserialize,
  dismissCard,
  interestRate,
  monthIndex,
  newGame,
  preview,
  serialize,
  yearDone,
  yearStart,
  type GameState,
  type MarketYear,
} from '../src/game';
import { hoursInYear } from '../src/sim';

const inputs = loadPlaceholderInputs();

function fakeMarket(year: number, price = 30): MarketYear {
  const hours = hoursInYear(year);
  const fill = (v: number): Float64Array => new Float64Array(hours).fill(v);
  return {
    year,
    hours,
    marketOpenFromHour: 0,
    negativeFromHour: hours,
    price: fill(price),
    marketPrice: fill(price),
    windCf: fill(0.3),
    solarCf: fill(0.11),
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

/** Play to hour `until`, recording every card shown (and when) before dismissing it. */
function playTo(state: GameState, until: number, seen: { kind: string; offer?: string; t: number }[] = []): void {
  let m = fakeMarket(state.year);
  const drain = (): void => {
    while (state.cards.length > 0) {
      const c = dismissCard(state);
      if (c !== undefined) seen.push({ kind: c.kind, ...(c.offer !== undefined ? { offer: c.offer } : {}), t: state.t });
    }
  };
  while (state.t < until && state.over === null) {
    drain();
    advance(state, m, until - state.t);
    if (yearDone(state, m)) {
      closeYear(state, m);
      if (state.over !== null) break;
      m = fakeMarket(state.year);
    }
  }
  drain();
}

/** A game moved to 00:00 on the first of a month, as if the years before had passed quietly. */
function gameAt(year: number, month: number, tuned: boolean): GameState {
  const s = newGame(1, inputs, { tuned });
  s.cards.length = 0;
  s.t = dateHour(year, month, 1);
  s.year = year;
  s.hourOfYear = s.t - yearStart(year);
  s.closedMonth = monthIndex(s.t) - 1;
  s.firedEvents = EVENTS.map((e) => e.id);
  for (const site of s.sites) site.announced = true;
  return s;
}

describe('a normal game is untouched', () => {
  it('has no tuned state and never shows an offer', () => {
    const s = newGame(5, inputs);
    expect(s.tuned).toBeUndefined();
    const seen: { kind: string; t: number }[] = [];
    playTo(s, yearStart(2011), seen);
    expect(seen.some((c) => c.kind === 'offer')).toBe(false);
  });
});

describe('the tuned mode', () => {
  it('says so on the welcome card', () => {
    const s = newGame(5, inputs, { tuned: true });
    expect(s.tuned?.incomeFactor).toBe(TUNED_INCOME_FACTOR);
    expect(s.cards[0]?.body.some((p) => p.startsWith('Test version'))).toBe(true);
    expect(newGame(5, inputs).cards[0]?.body.some((p) => p.startsWith('Test version'))).toBe(false);
  });

  it('multiplies what the same plants earn', () => {
    const earn = (tuned: boolean): number => {
      const s = newGame(3, inputs, { tuned });
      s.cards.length = 0;
      const m = fakeMarket(1995);
      const r = build(s, m, { siteId: 'thy', model: 'w600', units: 1, loanShare: 0.8, loanYears: 15 });
      if (!r.ok) throw new Error('build failed');
      playTo(s, r.asset.onlineAt + 24 * 90);
      return r.asset.lifetimeRevenueCents;
    };
    const normal = earn(false);
    expect(normal).toBeGreaterThan(0);
    expect(earn(true) / normal).toBeCloseTo(TUNED_INCOME_FACTOR, 3);
  });

  it('shows each offer once, on its date', () => {
    const s = newGame(5, inputs, { tuned: true });
    const seen: { kind: string; offer?: string; t: number }[] = [];
    playTo(s, yearStart(2011), seen);
    const offers = seen.filter((c) => c.kind === 'offer');
    expect(offers.map((c) => c.offer)).toEqual(TUNED_OFFERS.map((o) => o.id));
    for (const o of TUNED_OFFERS) {
      const at = offers.find((c) => c.offer === o.id)?.t ?? -1;
      expect(at).toBeGreaterThanOrEqual(dateHour(o.year, o.month, 1));
      expect(at).toBeLessThanOrEqual(dateHour(o.year, o.month, 1) + 24);
    }
    expect(s.tuned?.offersFired).toEqual(TUNED_OFFERS.map((o) => o.id));
  });

  it('closes an offer when declined, and refuses to answer when none is waiting', () => {
    expect(answerOffer(gameAt(1997, 5, true), true).ok).toBe(false);
    const s = withOffer('landowner', 1997, 6);
    const cash = s.cashCents;
    expect(answerOffer(s, false).ok).toBe(true);
    expect(s.cards.length).toBe(0);
    expect(s.cashCents).toBe(cash);
  });
});

/** A tuned game with the given offer at the front of the queue. */
function withOffer(id: 'landowner' | 'refinance' | 'firesale', year: number, month: number): GameState {
  const s = gameAt(year, month, true);
  if (s.tuned === undefined) throw new Error('not tuned');
  s.tuned.offersFired = TUNED_OFFERS.map((o) => o.id).filter((x) => x !== id);
  s.t = dateHour(year, month, 1) - 1;
  s.hourOfYear = s.t - yearStart(year);
  advance(s, fakeMarket(year), 2);
  expect(s.cards[0]?.offer).toBe(id);
  return s;
}

describe('the offers', () => {
  it('landowner: a fee buys one turbine without the permit wait', () => {
    const s = withOffer('landowner', 1997, 6);
    const m = fakeMarket(1997);
    const req = { siteId: 'thy', model: 'w600', units: 1, loanShare: 0.8, loanYears: 15 } as const;
    const waitBefore = preview(s, m, req).permitDoneAt - s.t;
    expect(waitBefore).toBeGreaterThan(24 * 30);
    const cash = s.cashCents;
    expect(answerOffer(s, true).ok).toBe(true);
    expect(s.cashCents).toBe(cash - LANDOWNER_FEE_EUR * 100);
    expect(preview(s, m, req).permitDoneAt - s.t).toBeLessThanOrEqual(24);
    s.cashCents += 1_000_000_00;
    expect(build(s, m, req).ok).toBe(true);
    // Used once: the next turbine waits as usual.
    expect(preview(s, m, req).permitDoneAt - s.t).toBe(waitBefore);
  });

  it('landowner: refused without the cash, and the card stays', () => {
    const s = withOffer('landowner', 1997, 6);
    s.cashCents = 1000_00;
    const r = answerOffer(s, true);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/cash/);
    expect(s.cards[0]?.offer).toBe('landowner');
  });

  it('refinance: moves dearer loans to today’s rate and lowers the instalment', () => {
    const s = gameAt(1996, 1, true);
    s.cashCents = 1_000_000_00;
    const r = build(s, fakeMarket(1996), { siteId: 'thy', model: 'w600', units: 1, loanShare: 0.8, loanYears: 15 });
    if (!r.ok) throw new Error('build failed');
    playTo(s, dateHour(2002, 2, 1));
    const before = s.loans[0];
    if (before === undefined || s.tuned === undefined) throw new Error('setup');
    s.tuned.offersFired = ['landowner', 'firesale'];
    playTo(s, dateHour(2002, 3, 1) - 1);
    advance(s, fakeMarket(2002), 2);
    expect(s.cards[0]?.offer).toBe('refinance');
    const old = s.loans[0];
    if (old === undefined) throw new Error('no loan');
    expect(interestRate(s.t)).toBeLessThan(old.ratePct);
    const cash = s.cashCents;
    expect(answerOffer(s, true).ok).toBe(true);
    const now = s.loans[0];
    if (now === undefined) throw new Error('no loan');
    expect(now.balanceCents).toBe(old.balanceCents);
    expect(now.ratePct).toBe(interestRate(s.t));
    expect(now.paymentCents).toBeLessThan(old.paymentCents);
    expect(now.months - now.monthsPaid).toBe(old.months - old.monthsPaid);
    expect(cash - s.cashCents).toBe(Math.round(old.balanceCents * 0.01));
  });

  it('fire sale: two old turbines for cash, running at once', () => {
    const s = withOffer('firesale', 2009, 4);
    s.cashCents = 500_000_00;
    const n = s.assets.length;
    expect(answerOffer(s, true).ok).toBe(true);
    expect(s.cashCents).toBe(500_000_00 - FIRESALE_PRICE_EUR * 100);
    expect(s.assets.length).toBe(n + 1);
    const a = s.assets[n];
    expect(a?.units).toBe(FIRESALE_UNITS);
    expect(a?.status).toBe('operating');
    expect(a?.model).toBe('w600');
    const mwh = a?.lifetimeMwh ?? 0;
    advance(s, fakeMarket(2009), 24 * 7);
    expect((a?.lifetimeMwh ?? 0) - mwh).toBeGreaterThan(0);
  });

  it('fire sale: refused without the cash', () => {
    const s = withOffer('firesale', 2009, 4);
    s.cashCents = 100_000_00;
    expect(answerOffer(s, true).ok).toBe(false);
    expect(s.cards[0]?.offer).toBe('firesale');
  });
});

describe('saving', () => {
  it('keeps the tuned mode across a save', () => {
    const s = newGame(9, inputs, { tuned: true });
    const back = deserialize(serialize(s));
    expect(back?.tuned).toEqual(s.tuned);
    expect(deserialize(serialize(newGame(9, inputs)))?.tuned).toBeUndefined();
  });
});
