/**
 * Hand-checked merit-order and coupling cases on the clearing engine.
 */
import { describe, expect, it } from 'vitest';
import { ClearingEngine, TRANCHE } from '../src/sim';

const CAP = 3000;

function engine(nZones: number, opts: { floor?: number; cap?: number; reserve?: number } = {}): ClearingEngine {
  const e = new ClearingEngine(nZones);
  for (let z = 0; z < nZones; z++) {
    e.floor[z] = opts.floor ?? -500;
    e.cap[z] = opts.cap ?? CAP;
    e.reserveFraction[z] = opts.reserve ?? 0;
  }
  e.setLinks([]);
  e.beginHour();
  return e;
}

function dispatchOf(e: ClearingEngine, zone: number, tech: number): number {
  let s = 0;
  for (let i = 0; i < e.nBlocks; i++) if (e.bZone[i] === zone && e.bTech[i] === tech) s += e.bDisp[i] ?? 0;
  return s;
}

describe('merit order in one zone', () => {
  function threeBlocks(demand: number, reserve = 0): ClearingEngine {
    const e = engine(1, { reserve });
    e.demand[0] = demand;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 100);
    e.addBlock(0, 1, TRANCHE.NORMAL, 20, 100);
    e.addBlock(0, 2, TRANCHE.NORMAL, 50, 100);
    e.clear();
    return e;
  }

  it('prices at the marginal block and dispatches in cost order', () => {
    const e = threeBlocks(150);
    expect(e.price[0]).toBe(20);
    expect(dispatchOf(e, 0, 0)).toBe(100);
    expect(dispatchOf(e, 0, 1)).toBe(50);
    expect(dispatchOf(e, 0, 2)).toBe(0);
    expect(e.unserved[0]).toBe(0);
  });

  it('moves up the stack as demand rises', () => {
    expect(threeBlocks(250).price[0]).toBe(50);
    expect(threeBlocks(100).price[0]).toBe(10);
    expect(threeBlocks(1).price[0]).toBe(10);
  });

  it('goes to the cap and records unserved energy when supply runs out', () => {
    const e = threeBlocks(350);
    expect(e.price[0]).toBe(CAP);
    expect(e.unserved[0]).toBeCloseTo(50, 9);
    expect(dispatchOf(e, 0, 2)).toBe(100);
  });

  it('adds a scarcity premium as spare capacity shrinks below the reserve margin', () => {
    const relaxed = threeBlocks(200, 0.1); // spare 100 ≥ reserve 20 → no adder
    expect(relaxed.price[0]).toBe(20);
    const tight = threeBlocks(280, 0.1); // spare 20 < reserve 28 → s = 8/28
    const s = (28 - 20) / 28;
    const expected = 50 + (CAP - 50) * s ** 3;
    expect(tight.price[0]).toBeCloseTo(expected, 6);
    expect(tight.price[0]).toBeGreaterThan(50);
    expect(tight.price[0]).toBeLessThan(CAP);
    expect(tight.scarcity[0]).toBeCloseTo(s, 9);
  });

  it('clamps negative bids at the floor and lets prices go negative only below it', () => {
    const floored = engine(1, { floor: -500 });
    floored.floor[0] = 0; // before the negative-price date
    floored.demand[0] = 50;
    floored.addBlock(0, 0, TRANCHE.MUST_RUN, -20, 100);
    floored.clear();
    expect(floored.price[0]).toBe(0);
    expect(dispatchOf(floored, 0, 0)).toBe(50);

    const open = engine(1, { floor: -500 });
    open.demand[0] = 50;
    open.addBlock(0, 0, TRANCHE.MUST_RUN, -20, 100);
    open.clear();
    expect(open.price[0]).toBe(-20);
  });

  it('shares a tied marginal price pro rata', () => {
    const e = engine(1);
    e.demand[0] = 90;
    e.addBlock(0, 0, TRANCHE.FLEX_RENEWABLE, 0, 100);
    e.addBlock(0, 1, TRANCHE.FLEX_RENEWABLE, 0, 50);
    e.clear();
    expect(e.price[0]).toBe(0);
    expect(dispatchOf(e, 0, 0)).toBeCloseTo(60, 9);
    expect(dispatchOf(e, 0, 1)).toBeCloseTo(30, 9);
  });
});

describe('storage bids in the same stack', () => {
  it('charges when the price is at or below its willingness to pay', () => {
    const e = engine(1);
    e.demand[0] = 100;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 1000);
    e.addCharge(0, 9, 20, 50);
    e.clear();
    expect(e.price[0]).toBe(10);
    expect(e.cDisp[0]).toBe(50);
    expect(dispatchOf(e, 0, 0)).toBe(150);
  });

  it('does not charge above its willingness to pay', () => {
    const e = engine(1);
    e.demand[0] = 100;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 1000);
    e.addCharge(0, 9, 5, 50);
    e.clear();
    expect(e.price[0]).toBe(10);
    expect(e.cDisp[0]).toBe(0);
  });

  it('can be the marginal unit, setting the price at its bid', () => {
    const e = engine(1);
    e.demand[0] = 100;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 120);
    e.addBlock(0, 1, TRANCHE.NORMAL, 30, 100);
    e.addCharge(0, 9, 20, 50);
    e.clear();
    expect(e.price[0]).toBe(20);
    expect(e.cDisp[0]).toBeCloseTo(20, 9);
    expect(dispatchOf(e, 0, 0)).toBe(120);
    expect(dispatchOf(e, 0, 1)).toBe(0);
  });

  it('is indifferent when supply exactly meets firm demand at its bid', () => {
    const e = engine(1);
    e.demand[0] = 100;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 100);
    e.addBlock(0, 1, TRANCHE.NORMAL, 30, 100);
    e.addCharge(0, 9, 20, 50);
    e.clear();
    expect(e.price[0]).toBe(20);
    expect(e.cDisp[0]).toBe(0);
  });
});

describe('coupling', () => {
  function twoZones(linkCap: number, midBlock = false): ClearingEngine {
    const e = engine(2);
    e.setLinks([{ from: 0, to: 1, capacityMw: linkCap }]);
    e.beginHour();
    e.demand[0] = 100;
    e.demand[1] = 100;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 200);
    if (midBlock) e.addBlock(1, 1, TRANCHE.NORMAL, 30, 50);
    e.addBlock(1, 2, TRANCHE.NORMAL, 100, 200);
    e.clear();
    return e;
  }

  it('converges to one price when the link is not congested', () => {
    const e = twoZones(500);
    expect(e.price[0]).toBe(10);
    expect(e.price[1]).toBe(10);
    expect(e.flow[0]).toBeCloseTo(100, 9);
    expect(dispatchOf(e, 0, 0)).toBe(200);
    expect(dispatchOf(e, 1, 2)).toBe(0);
    expect(e.netPosition[0]).toBeCloseTo(100, 9);
    expect(e.netPosition[1]).toBeCloseTo(-100, 9);
  });

  it('separates prices and respects the limit when the link congests', () => {
    const e = twoZones(50);
    expect(e.flow[0]).toBeCloseTo(50, 9);
    expect(e.price[0]).toBe(10);
    expect(e.price[1]).toBe(100);
    expect(dispatchOf(e, 0, 0)).toBeCloseTo(150, 9);
    expect(dispatchOf(e, 1, 2)).toBeCloseTo(50, 9);
    expect(e.wrongWayLinks).toBe(0);
  });

  it('prices the importing zone at its own marginal block after the split', () => {
    const e = twoZones(60, true);
    expect(e.flow[0]).toBeCloseTo(60, 9);
    expect(e.price[0]).toBe(10);
    expect(e.price[1]).toBe(30);
    expect(dispatchOf(e, 1, 1)).toBeCloseTo(40, 9);
    expect(dispatchOf(e, 1, 2)).toBe(0);
  });

  it('flows from the cheap zone to the dear zone in either link direction', () => {
    const e = engine(2);
    e.setLinks([{ from: 0, to: 1, capacityMw: 500 }]);
    e.beginHour();
    e.demand[0] = 100;
    e.demand[1] = 100;
    e.addBlock(0, 0, TRANCHE.NORMAL, 100, 200);
    e.addBlock(1, 1, TRANCHE.NORMAL, 10, 200);
    e.clear();
    expect(e.flow[0]).toBeCloseTo(-100, 9);
    expect(e.price[0]).toBe(10);
    expect(e.price[1]).toBe(10);
  });

  it('handles a three-zone loop within every link limit', () => {
    const e = engine(3);
    e.setLinks([
      { from: 0, to: 1, capacityMw: 150 },
      { from: 0, to: 2, capacityMw: 150 },
      { from: 1, to: 2, capacityMw: 1000 },
    ]);
    e.beginHour();
    e.demand[0] = 100;
    e.demand[1] = 300;
    e.demand[2] = 300;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 1000);
    e.addBlock(1, 1, TRANCHE.NORMAL, 100, 1000);
    e.addBlock(2, 2, TRANCHE.NORMAL, 100, 1000);
    e.clear();
    for (let l = 0; l < 3; l++) expect(Math.abs(e.flow[l] ?? 0)).toBeLessThanOrEqual(e.link(l).capacityMw + 1e-9);
    expect(e.price[0]).toBe(10);
    expect(e.price[1]).toBe(100);
    expect(e.price[2]).toBe(100);
    // Zone 0 exports everything it can: both of its links are full.
    expect((e.flow[0] ?? 0) + (e.flow[1] ?? 0)).toBeCloseTo(300, 6);
    // Energy balance per zone.
    const gen = [0, 1, 2].map((z) => dispatchOf(e, z, z));
    expect(gen[0]).toBeCloseTo(100 + 300, 6);
    expect((gen[1] ?? 0) + (gen[2] ?? 0)).toBeCloseTo(300, 6);
    expect(e.wrongWayLinks).toBe(0);
  });

  it('merges a cheap hydro zone with its neighbours until the links fill', () => {
    // NO cheap, DK1 small, DE dear: NO exports through DK1 to DE; the transit
    // must not leave a link flowing from the dearer zone to the cheaper one.
    const e = engine(3);
    e.setLinks([
      { from: 0, to: 1, capacityMw: 1500 }, // DK1-DE
      { from: 0, to: 2, capacityMw: 1000 }, // DK1-NO
    ]);
    e.beginHour();
    e.demand[0] = 2000; // DK1
    e.demand[1] = 60000; // DE
    e.demand[2] = 15000; // NO
    e.addBlock(0, 0, TRANCHE.NORMAL, 40, 5000);
    e.addBlock(1, 1, TRANCHE.NORMAL, 30, 40000);
    e.addBlock(1, 2, TRANCHE.NORMAL, 60, 40000);
    e.addBlock(2, 3, TRANCHE.NORMAL, 10, 30000);
    e.clear();
    expect(e.flow[1]).toBeCloseTo(-1000, 6); // NO → DK1 full
    expect(e.flow[0]).toBeCloseTo(1500, 6); // DK1 → DE full: DK1's own 40 €/MWh plant undercuts DE's 60
    expect(e.price[2]).toBe(10);
    expect(e.price[0]).toBe(40);
    expect(e.price[1]).toBe(60);
    expect(dispatchOf(e, 0, 0)).toBeCloseTo(2000 - 1000 + 1500, 6);
    expect(e.wrongWayLinks).toBe(0);
  });
});

// Regressions for the 2026-10-04 stress test (findings F1, F2, F7, F11, F13, F16),
// built from the report's reproductions.
describe('stress-test findings', () => {
  function chain(order: 'ab-first' | 'bc-first', demandB: number): { e: ClearingEngine; ab: number; bc: number } {
    const e = engine(3);
    const ab = { from: 0, to: 1, capacityMw: 100 };
    const bc = { from: 1, to: 2, capacityMw: 1000 };
    e.setLinks(order === 'ab-first' ? [ab, bc] : [bc, ab]);
    e.beginHour();
    e.demand[0] = 0;
    e.demand[1] = demandB;
    e.demand[2] = 500;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 1000);
    e.addBlock(2, 1, TRANCHE.NORMAL, 100, 1000);
    e.clear();
    return order === 'ab-first' ? { e, ab: 0, bc: 1 } : { e, ab: 1, bc: 0 };
  }

  it('F1: a fixed link carries its full capacity when the importer passes the power on', () => {
    for (const order of ['ab-first', 'bc-first'] as const) {
      for (const demandB of [0, 30]) {
        const { e, ab, bc } = chain(order, demandB);
        expect(e.flow[ab], `${order}, B demand ${demandB}`).toBeCloseTo(100, 9);
        expect(e.flow[bc], `${order}, B demand ${demandB}`).toBeCloseTo(100 - demandB, 9);
        expect(e.congested[ab]).toBe(1);
        expect([e.price[0], e.price[1], e.price[2]]).toEqual([10, 100, 100]);
        expect(e.wrongWayLinks).toBe(0);
      }
    }
  });

  it('F1: imports for storage charging are not capped at firm demand', () => {
    const e = engine(2);
    e.setLinks([{ from: 0, to: 1, capacityMw: 100 }]);
    e.beginHour();
    e.demand[0] = 0;
    e.demand[1] = 50;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 1000);
    e.addBlock(1, 1, TRANCHE.NORMAL, 100, 1000);
    e.addCharge(1, 10, 50, 200);
    e.clear();
    expect(e.flow[0]).toBeCloseTo(100, 9);
    expect(e.cDisp[0]).toBeCloseTo(50, 9);
    expect(e.price[0]).toBe(10);
    expect(e.price[1]).toBe(50);
    expect(e.wrongWayLinks).toBe(0);
  });

  it('F2: fixed exports do not make the exporter scarce', () => {
    const e = engine(2, { reserve: 0.12 });
    e.setLinks([{ from: 0, to: 1, capacityMw: 90 }]);
    e.beginHour();
    e.demand[0] = 100;
    e.demand[1] = 100;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 200);
    e.addBlock(1, 1, TRANCHE.NORMAL, 50, 150);
    e.clear();
    expect(e.price[0]).toBe(10); // was 539 €/MWh
    expect(e.price[1]).toBe(50);
    expect(e.flow[0]).toBeCloseTo(90, 9);
    expect(e.scarcity[0]).toBe(0);
    expect(e.wrongWayLinks).toBe(0);
  });

  it('F2: a zone short on its own imports at a scarcity price instead of exporting', () => {
    // Zone 0 has 5 % spare against a 12 % reserve margin; zone 1 has plenty but dearer offers.
    const e = engine(2, { reserve: 0.12 });
    e.setLinks([{ from: 0, to: 1, capacityMw: 30 }]);
    e.beginHour();
    e.demand[0] = 1000;
    e.demand[1] = 1000;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 1050);
    e.addBlock(1, 1, TRANCHE.NORMAL, 50, 2000);
    e.clear();
    const s = (120 - (50 + 30)) / 120; // spare: own 50 + 30 MW the link can bring in
    expect(e.scarcity[0]).toBeCloseTo(s, 12);
    expect(e.price[0]).toBeCloseTo(10 + (CAP - 10) * s ** 3, 9);
    expect(e.price[1]).toBe(50);
    expect(e.flow[0]).toBeCloseTo(-30, 9); // zone 1 exports to the scarce zone
    expect(e.wrongWayLinks).toBe(0);
  });

  it('F7: a zone with no demand and no offers is not priced at the cap', () => {
    const e = engine(1);
    e.demand[0] = 0;
    e.clear();
    expect(e.price[0]).toBe(0);
    expect(e.unserved[0]).toBe(0);
    const floored = engine(1);
    floored.floor[0] = 5;
    floored.clear();
    expect(floored.price[0]).toBe(5);
  });

  it('F13: uncongested coupled zones share one price even with different floors', () => {
    const e = engine(2);
    e.floor[0] = 0; // no negative prices yet in zone 0
    e.setLinks([{ from: 0, to: 1, capacityMw: 5000 }]);
    e.beginHour();
    e.demand[0] = 100;
    e.demand[1] = 0;
    e.addBlock(1, 0, TRANCHE.LEGACY_RENEWABLE, -30, 1000);
    e.clear();
    expect(e.linkFixed[0]).toBe(0);
    expect(e.flow[0]).toBeCloseTo(-100, 9);
    expect(e.price[0]).toBe(0); // was [0, −30]
    expect(e.price[1]).toBe(0);
    // Separated by congestion, the zone that allows it still goes negative.
    const c = engine(2);
    c.floor[0] = 0;
    c.setLinks([{ from: 0, to: 1, capacityMw: 50 }]);
    c.beginHour();
    c.demand[0] = 100;
    c.demand[1] = 0;
    c.addBlock(0, 1, TRANCHE.NORMAL, 20, 1000);
    c.addBlock(1, 0, TRANCHE.LEGACY_RENEWABLE, -30, 1000);
    c.clear();
    expect(c.flow[0]).toBeCloseTo(-50, 9);
    expect(c.price[0]).toBe(20);
    expect(c.price[1]).toBe(-30);
    expect(c.congested[0]).toBe(1);
  });

  it('F16: a fixed link is reported congested only when the prices differ', () => {
    const e = engine(2);
    e.setLinks([{ from: 0, to: 1, capacityMw: 50 }]);
    e.beginHour();
    e.demand[0] = 0;
    e.demand[1] = 200;
    e.addBlock(0, 0, TRANCHE.NORMAL, 10, 1000);
    e.addBlock(1, 1, TRANCHE.NORMAL, 10, 1000);
    e.clear();
    expect(e.linkFixed[0]).toBe(1);
    expect(e.flow[0]).toBeCloseTo(50, 9);
    expect(e.price[0]).toBe(e.price[1]);
    expect(e.congested[0]).toBe(0);
  });

  it('F11: rejects NaN, infinite and out-of-range inputs with a clear error', () => {
    const fresh = (): ClearingEngine => {
      const e = engine(2);
      e.setLinks([{ from: 0, to: 1, capacityMw: 100 }]);
      e.beginHour();
      e.demand[0] = 10;
      e.demand[1] = 10;
      return e;
    };
    expect(() => fresh().addBlock(0, 0, TRANCHE.NORMAL, NaN, 10)).toThrow(/bid must be finite/);
    expect(() => fresh().addBlock(0, 0, TRANCHE.NORMAL, 10, Infinity)).toThrow(/size must be finite/);
    expect(() => fresh().addBlock(0, 0, TRANCHE.NORMAL, 10, NaN)).toThrow(/size must be finite/);
    expect(() => fresh().addBlock(0, 0, TRANCHE.NORMAL, 10, -5)).toThrow(/non-negative/);
    expect(() => fresh().addBlock(2, 0, TRANCHE.NORMAL, 10, 5)).toThrow(/unknown zone/);
    expect(() => fresh().addCharge(0, 9, NaN, 10)).toThrow(/willingness to pay must be finite/);
    expect(() => fresh().addCharge(0, 9, 10, Infinity)).toThrow(/size must be finite/);
    expect(() => engine(2).setLinks([{ from: 0, to: 1, capacityMw: NaN }])).toThrow(/capacity/);
    expect(() => engine(2).setLinks([{ from: 0, to: 1, capacityMw: Infinity }])).toThrow(/capacity/);
    expect(() => engine(2).setLinks([{ from: 0, to: 2, capacityMw: 100 }])).toThrow(/unknown zone/);
    expect(() => engine(2).setLinks([{ from: 1, to: 1, capacityMw: 100 }])).toThrow(/itself/);
    for (const [field, value, msg] of [
      ['demand', NaN, /demand/],
      ['demand', Infinity, /demand/],
      ['demand', -1, /demand/],
      ['cap', NaN, /floor and cap/],
      ['floor', -Infinity, /floor and cap/],
      ['reserveFraction', 10, /reserveFraction/],
    ] as const) {
      const e = fresh();
      e[field][0] = value;
      e.addBlock(0, 0, TRANCHE.NORMAL, 10, 100);
      expect(() => e.clear(), `${field} = ${value}`).toThrow(msg);
    }
    // The order of a NaN bid no longer matters: it never gets in.
    const e = fresh();
    expect(() => e.addBlock(0, 0, TRANCHE.NORMAL, NaN, 10)).toThrow();
    expect(e.nBlocks).toBe(0);
  });
});
