/**
 * Property tests on the clearing engine with fast-check.
 */
import fc from 'fast-check';
import { describe, it } from 'vitest';
import { ClearingEngine, TRANCHE } from '../src/sim';

const CAP = 3000;
const FLOOR = -500;

interface Block {
  bid: number;
  mw: number;
}

const blockArb = fc.record({
  bid: fc.double({ min: -100, max: 500, noNaN: true, noDefaultInfinity: true }),
  mw: fc.double({ min: 1, max: 5000, noNaN: true, noDefaultInfinity: true }),
});

function setup(nZones: number, reserve: number, links: { from: number; to: number; capacityMw: number }[]): ClearingEngine {
  const e = new ClearingEngine(nZones);
  for (let z = 0; z < nZones; z++) {
    e.floor[z] = FLOOR;
    e.cap[z] = CAP;
    e.reserveFraction[z] = reserve;
  }
  e.setLinks(links);
  e.beginHour();
  return e;
}

function load(e: ClearingEngine, zone: number, blocks: readonly Block[]): void {
  blocks.forEach((b, i) => e.addBlock(zone, i % 12, TRANCHE.NORMAL, b.bid, b.mw));
}

describe('clearing properties', () => {
  it('the price is the bid of a marginal block, cheaper blocks run fully and dearer ones not at all', () => {
    fc.assert(
      fc.property(fc.array(blockArb, { minLength: 1, maxLength: 12 }), fc.double({ min: 0, max: 1, noNaN: true }), (blocks, share) => {
        const total = blocks.reduce((s, b) => s + b.mw, 0);
        const demand = total * share;
        const e = setup(1, 0, []);
        e.demand[0] = demand;
        load(e, 0, blocks);
        e.clear();
        const price = e.price[0] ?? NaN;
        if (demand > total) return false; // not generated
        const bids = new Set(blocks.map((b) => Math.max(FLOOR, Math.min(CAP, b.bid))));
        if (!bids.has(price)) return false;
        let dispatched = 0;
        for (let i = 0; i < e.nBlocks; i++) {
          const bid = e.bBid[i] ?? 0;
          const mw = e.bMw[i] ?? 0;
          const d = e.bDisp[i] ?? 0;
          dispatched += d;
          if (bid < price && Math.abs(d - mw) > 1e-9) return false;
          if (bid > price && d > 1e-9) return false;
          if (d < -1e-9 || d > mw + 1e-9) return false;
        }
        return Math.abs(dispatched - demand) < 1e-6 && (e.unserved[0] ?? 0) < 1e-6;
      }),
      { numRuns: 300 },
    );
  });

  it('adding zero-cost supply never raises the price of a single zone, with or without scarcity pricing', () => {
    fc.assert(
      fc.property(
        fc.array(blockArb, { minLength: 1, maxLength: 10 }),
        fc.double({ min: 0, max: 1.3, noNaN: true }),
        fc.double({ min: 0, max: 0.3, noNaN: true }),
        fc.double({ min: 1, max: 3000, noNaN: true }),
        (blocks, share, reserve, extraMw) => {
          const total = blocks.reduce((s, b) => s + b.mw, 0);
          const demand = total * share;
          const before = setup(1, reserve, []);
          before.demand[0] = demand;
          load(before, 0, blocks);
          before.clear();
          const after = setup(1, reserve, []);
          after.demand[0] = demand;
          load(after, 0, blocks);
          after.addBlock(0, 11, TRANCHE.FLEX_RENEWABLE, 0, extraMw);
          after.clear();
          return (after.price[0] ?? Infinity) <= (before.price[0] ?? -Infinity) + 1e-9;
        },
      ),
      { numRuns: 300 },
    );
  });

  it('adding zero-cost supply in one of two coupled zones never raises either price', () => {
    fc.assert(
      fc.property(
        fc.array(blockArb, { minLength: 1, maxLength: 8 }),
        fc.array(blockArb, { minLength: 1, maxLength: 8 }),
        fc.double({ min: 0, max: 0.9, noNaN: true }),
        fc.double({ min: 0, max: 0.9, noNaN: true }),
        fc.double({ min: 0, max: 4000, noNaN: true }),
        fc.double({ min: 1, max: 3000, noNaN: true }),
        fc.boolean(),
        (blocksA, blocksB, shareA, shareB, linkCap, extraMw, inA) => {
          const run = (extra: boolean): [number, number] => {
            const e = setup(2, 0, [{ from: 0, to: 1, capacityMw: linkCap }]);
            e.demand[0] = blocksA.reduce((s, b) => s + b.mw, 0) * shareA;
            e.demand[1] = blocksB.reduce((s, b) => s + b.mw, 0) * shareB;
            load(e, 0, blocksA);
            load(e, 1, blocksB);
            if (extra) e.addBlock(inA ? 0 : 1, 11, TRANCHE.FLEX_RENEWABLE, 0, extraMw);
            e.clear();
            return [e.price[0] ?? NaN, e.price[1] ?? NaN];
          };
          const [a0, b0] = run(false);
          const [a1, b1] = run(true);
          return a1 <= a0 + 1e-9 && b1 <= b0 + 1e-9;
        },
      ),
      { numRuns: 300 },
    );
  });

  it('coupled zones respect the link limit and share one price when the link is slack', () => {
    fc.assert(
      fc.property(
        fc.array(blockArb, { minLength: 1, maxLength: 8 }),
        fc.array(blockArb, { minLength: 1, maxLength: 8 }),
        fc.double({ min: 0, max: 0.9, noNaN: true }),
        fc.double({ min: 0, max: 0.9, noNaN: true }),
        fc.double({ min: 1, max: 4000, noNaN: true }),
        (blocksA, blocksB, shareA, shareB, linkCap) => {
          const e = setup(2, 0, [{ from: 0, to: 1, capacityMw: linkCap }]);
          e.demand[0] = blocksA.reduce((s, b) => s + b.mw, 0) * shareA;
          e.demand[1] = blocksB.reduce((s, b) => s + b.mw, 0) * shareB;
          load(e, 0, blocksA);
          load(e, 1, blocksB);
          e.clear();
          const flow = e.flow[0] ?? NaN;
          if (!(Math.abs(flow) <= linkCap + 1e-6)) return false;
          const pa = e.price[0] ?? NaN;
          const pb = e.price[1] ?? NaN;
          if (Math.abs(flow) < linkCap - 1e-6) return Math.abs(pa - pb) < 1e-9;
          // Congested: the exporter is never dearer than the importer.
          return flow > 0 ? pa <= pb + 1e-9 : pb <= pa + 1e-9;
        },
      ),
      { numRuns: 300 },
    );
  });

  it('energy balances in every zone for any stack, demand and links', () => {
    fc.assert(
      fc.property(
        fc.array(fc.array(blockArb, { minLength: 1, maxLength: 6 }), { minLength: 3, maxLength: 3 }),
        fc.array(fc.double({ min: 0, max: 1.2, noNaN: true }), { minLength: 3, maxLength: 3 }),
        fc.array(fc.double({ min: 0, max: 3000, noNaN: true }), { minLength: 3, maxLength: 3 }),
        (stacks, shares, caps) => {
          const e = setup(3, 0.1, [
            { from: 0, to: 1, capacityMw: Math.max(1, caps[0] ?? 1) },
            { from: 0, to: 2, capacityMw: Math.max(1, caps[1] ?? 1) },
            { from: 1, to: 2, capacityMw: Math.max(1, caps[2] ?? 1) },
          ]);
          stacks.forEach((blocks, z) => {
            e.demand[z] = blocks.reduce((s, b) => s + b.mw, 0) * (shares[z] ?? 0);
            load(e, z, blocks);
          });
          e.clear();
          for (let z = 0; z < 3; z++) {
            let gen = 0;
            for (let i = 0; i < e.nBlocks; i++) if (e.bZone[i] === z) gen += e.bDisp[i] ?? 0;
            const balance = gen - (e.netPosition[z] ?? 0) + (e.unserved[z] ?? 0) - (e.demand[z] ?? 0);
            if (Math.abs(balance) > 1e-6) return false;
            const p = e.price[z] ?? NaN;
            if (!(p >= FLOOR && p <= CAP)) return false;
          }
          for (let l = 0; l < 3; l++) if (Math.abs(e.flow[l] ?? 0) > e.link(l).capacityMw + 1e-6) return false;
          return true;
        },
      ),
      { numRuns: 300 },
    );
  });
});
