/**
 * Full-year invariants on the placeholder world, storage and hydro bounds,
 * determinism, the capacity-addition hook and the market-era rules.
 */
import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs } from '../src/data/placeholder';
import { SyntheticWeather, World, hashYearResult, hourOfYear, type YearResult } from '../src/sim';

const inputs = loadPlaceholderInputs();
const weather = new SyntheticWeather(inputs);

function world(seed: number): World {
  return new World(inputs, weather, seed);
}

function finite(arr: Float64Array, name: string): void {
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v === undefined || !Number.isFinite(v)) throw new Error(`${name}[${i}] is not finite: ${v}`);
  }
}

function checkInvariants(r: YearResult): void {
  for (const zid of r.zones) {
    const z = r.byZone[zid];
    expect(z).toBeDefined();
    if (z === undefined) continue;
    finite(z.price, `${zid}.price`);
    finite(z.marginalPrice, `${zid}.marginalPrice`);
    finite(z.unserved, `${zid}.unserved`);
    finite(z.netExport, `${zid}.netExport`);
    for (const [t, g] of Object.entries(z.generation)) finite(g, `${zid}.generation.${t}`);
    for (const [t, c] of Object.entries(z.charging)) finite(c, `${zid}.charging.${t}`);
    for (const [t, s] of Object.entries(z.stateOfCharge)) finite(s, `${zid}.soc.${t}`);
    if (z.reservoirMwh !== null) finite(z.reservoirMwh, `${zid}.reservoir`);

    let worstBalance = 0;
    for (let h = 0; h < z.hours; h++) {
      const floor = h >= z.negativeFromHour ? z.priceFloor : 0;
      const p = z.marginalPrice[h] ?? NaN;
      if (p < floor - 1e-9 || p > z.priceCap + 1e-9) throw new Error(`${zid} hour ${h}: price ${p} outside [${floor}, ${z.priceCap}]`);
      let gen = 0;
      for (const g of Object.values(z.generation)) gen += g[h] ?? 0;
      let charge = 0;
      for (const c of Object.values(z.charging)) charge += c[h] ?? 0;
      const balance = gen - (z.netExport[h] ?? 0) + (z.unserved[h] ?? 0) - charge - (z.demand[h] ?? 0);
      worstBalance = Math.max(worstBalance, Math.abs(balance));
      for (const t of ['wind', 'solar'] as const) {
        const a = z.available[t]?.[h];
        const g = z.generation[t]?.[h];
        if (a !== undefined && g !== undefined) {
          if (g < -1e-9 || g > a + 1e-6) throw new Error(`${zid} ${t} hour ${h}: dispatched ${g} vs available ${a}`);
        }
      }
    }
    expect(worstBalance, `${zid} energy balance`).toBeLessThan(1e-5);
  }
  // Flows within limits and consistent with net exports.
  const net: Record<string, Float64Array> = {};
  for (const zid of r.zones) net[zid] = new Float64Array(r.hours);
  for (const l of r.links) {
    finite(l.flow, `${l.id}.flow`);
    for (let h = 0; h < r.hours; h++) {
      const f = l.flow[h] ?? 0;
      if (Math.abs(f) > l.capacityMw + 1e-6) throw new Error(`${l.id} hour ${h}: flow ${f} exceeds ${l.capacityMw}`);
      const a = net[l.from];
      const b = net[l.to];
      if (a !== undefined) a[h] = (a[h] ?? 0) + f;
      if (b !== undefined) b[h] = (b[h] ?? 0) - f;
    }
  }
  for (const zid of r.zones) {
    const z = r.byZone[zid];
    const n = net[zid];
    if (z === undefined || n === undefined) continue;
    for (let h = 0; h < r.hours; h++) {
      if (Math.abs((n[h] ?? 0) - (z.netExport[h] ?? 0)) > 1e-6) throw new Error(`${zid} hour ${h}: flows do not match net export`);
    }
  }
}

describe('a simulated year', () => {
  it('balances energy every hour, keeps prices within floor and cap, and has no NaN', () => {
    const w = world(7);
    for (const year of [2019, 2024]) checkInvariants(w.simulateYear(year));
  });

  it('holds the invariants in the leap year and the pre-market era too', () => {
    const w = world(3);
    checkInvariants(w.simulateYear(1996));
    checkInvariants(w.simulateYear(2000));
  });

  it('reports leap-year hours', () => {
    expect(world(1).simulateYear(2000).hours).toBe(8784);
    expect(world(1).simulateYear(2001).hours).toBe(8760);
  });
});

describe('storage', () => {
  it('stays within its energy limits and balances charge and discharge with losses', () => {
    const r = world(11).simulateYear(2019);
    const de = r.byZone['DE'];
    expect(de).toBeDefined();
    if (de === undefined) return;
    const tech = inputs.technologies.get('pumped');
    if (tech === undefined) throw new Error('no pumped tech');
    const powerMw = de.capacityMw['pumped'] ?? 0;
    const energyMwh = powerMw * tech.storageHours;
    const eta = Math.sqrt(tech.roundTripEfficiency);
    const soc = de.stateOfCharge['pumped'];
    const charge = de.charging['pumped'];
    const discharge = de.generation['pumped'];
    expect(soc).toBeDefined();
    expect(charge).toBeDefined();
    expect(discharge).toBeDefined();
    if (soc === undefined || charge === undefined || discharge === undefined) return;
    let totalCharge = 0;
    let totalDischarge = 0;
    let prev = soc[0] ?? 0;
    for (let h = 1; h < de.hours; h++) {
      const s = soc[h] ?? -1;
      expect(s).toBeGreaterThanOrEqual(-1e-6);
      expect(s).toBeLessThanOrEqual(energyMwh + 1e-6);
      const ch = charge[h] ?? 0;
      const dis = discharge[h] ?? 0;
      expect(ch).toBeLessThanOrEqual(powerMw + 1e-6);
      expect(dis).toBeLessThanOrEqual(powerMw + 1e-6);
      const expected = prev + ch * eta - dis / eta;
      expect(Math.abs(s - expected)).toBeLessThan(1e-6);
      prev = s;
      totalCharge += ch;
      totalDischarge += dis;
    }
    expect(totalCharge).toBeGreaterThan(0);
    expect(totalDischarge).toBeGreaterThan(0);
    // Round-trip losses: energy out is less than energy in (up to the change in stored energy).
    const stored = (soc[de.hours - 1] ?? 0) - (soc[0] ?? 0);
    expect(totalDischarge).toBeLessThan(totalCharge - stored + 1e-6);
    expect(totalDischarge / Math.max(1, totalCharge)).toBeLessThan(tech.roundTripEfficiency + 0.1);
  });

  it('buys low and sells high', () => {
    const r = world(11).simulateYear(2019);
    const de = r.byZone['DE'];
    const charge = de?.charging['pumped'];
    const discharge = de?.generation['pumped'];
    if (de === undefined || charge === undefined || discharge === undefined) throw new Error('no storage');
    let buy = 0;
    let buyMwh = 0;
    let sell = 0;
    let sellMwh = 0;
    for (let h = 0; h < de.hours; h++) {
      buy += (charge[h] ?? 0) * (de.price[h] ?? 0);
      buyMwh += charge[h] ?? 0;
      sell += (discharge[h] ?? 0) * (de.price[h] ?? 0);
      sellMwh += discharge[h] ?? 0;
    }
    expect(sell / sellMwh).toBeGreaterThan(buy / buyMwh);
  });
});

describe('reservoir hydro', () => {
  it('stays within the reservoir bounds and balances inflow, generation and spill', () => {
    const w = world(5);
    const no = inputs.zones.find((z) => z.id === 'NO');
    if (no === undefined || no.hydro === null) throw new Error('no NO hydro');
    const capMwh = no.hydro.reservoirTwh * 1e6;
    const minMwh = no.hydro.minFill * capMwh;
    let prevLevel = no.hydro.initialFill * capMwh;
    for (const year of [2003, 2004]) {
      const r = w.simulateYear(year);
      const z = r.byZone['NO'];
      if (z === undefined || z.reservoirMwh === null || z.inflowMw === null || z.spillMw === null) throw new Error('no reservoir output');
      const gen = z.generation['hydro_res'];
      if (gen === undefined) throw new Error('no hydro generation');
      const genCap = (z.capacityMw['hydro_res'] ?? 0) * (inputs.technologies.get('hydro_res')?.availability ?? 1);
      let totalGen = 0;
      let totalInflow = 0;
      for (let h = 0; h < z.hours; h++) {
        const level = z.reservoirMwh[h] ?? -1;
        expect(level).toBeGreaterThanOrEqual(minMwh - 1e-3);
        expect(level).toBeLessThanOrEqual(capMwh + 1e-3);
        const g = gen[h] ?? 0;
        expect(g).toBeGreaterThanOrEqual(-1e-9);
        expect(g).toBeLessThanOrEqual(genCap + 1e-6);
        const spill = z.spillMw[h] ?? 0;
        expect(spill).toBeGreaterThanOrEqual(0);
        const expected = prevLevel + (z.inflowMw[h] ?? 0) - g - spill;
        expect(Math.abs(level - expected)).toBeLessThan(1e-3);
        prevLevel = level;
        totalGen += g;
        totalInflow += z.inflowMw[h] ?? 0;
      }
      expect(totalGen / 1e6).toBeGreaterThan(50);
      expect(totalGen).toBeLessThanOrEqual(totalInflow + capMwh);
    }
  });

  it('bids a water value that rises as the reservoir empties', () => {
    // The same world started with a nearly empty reservoir must price Norwegian
    // hydro higher (and generate less of it) than when started comfortably full.
    const dryInputs = {
      ...inputs,
      zones: inputs.zones.map((z) => (z.id === 'NO' && z.hydro !== null ? { ...z, hydro: { ...z.hydro, initialFill: 0.12 } } : z)),
    };
    const full = new World(inputs, weather, 21).simulateYear(2010);
    const dry = new World(dryInputs, weather, 21).simulateYear(2010);
    const noFull = full.byZone['NO'];
    const noDry = dry.byZone['NO'];
    if (noFull === undefined || noDry === undefined) throw new Error('no NO');
    expect(noDry.stats.meanPrice).toBeGreaterThan(noFull.stats.meanPrice * 1.2);
    expect(noDry.stats.byTech.hydro_res.generationTwh).toBeLessThan(noFull.stats.byTech.hydro_res.generationTwh);
    // The emptier reservoir imports more (or exports less).
    expect(noDry.stats.netExportTwh).toBeLessThan(noFull.stats.netExportTwh);
    // Within the normal year the reservoir is lower in spring than in autumn.
    if (noFull.reservoirMwh === null) return;
    const april = hourOfYear({ year: 2010, month: 4, day: 1 });
    const october = hourOfYear({ year: 2010, month: 10, day: 1 });
    expect(noFull.reservoirMwh[april] ?? 0).toBeLessThan(noFull.reservoirMwh[october] ?? 0);
  });
});

describe('determinism', () => {
  it('gives an identical hash for the same seed and a different one for another seed', () => {
    const a = hashYearResult(world(2024).simulateYear(2015));
    const b = hashYearResult(world(2024).simulateYear(2015));
    const c = hashYearResult(world(2025).simulateYear(2015));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
  });

  it('replays a multi-year sequence identically', () => {
    const w1 = world(77);
    const w2 = world(77);
    for (const y of [1999, 2000, 2001]) expect(hashYearResult(w1.simulateYear(y))).toBe(hashYearResult(w2.simulateYear(y)));
  });

  it('matches the golden hash of the placeholder world (update it when the model or data change)', () => {
    // Node only: JavaScript maths may differ in the last bits between engines.
    const hash = hashYearResult(world(42).simulateYear(2019));
    expect(hash).toBe(GOLDEN_HASH_2019_SEED_42);
  });
});

/** Golden hash of seed 42, year 2019, fresh world. Recompute after any intended change to the model or the placeholder data. */
const GOLDEN_HASH_2019_SEED_42 = '18e65696d6daa883';

describe('capacity additions', () => {
  it('adds capacity from a given year and affects the result', () => {
    const w = world(9);
    w.addCapacity('DE', 'solar', 20000, 2020);
    expect(w.capacityMw('DE', 'solar', 2019)).toBeCloseTo(49000, 6);
    expect(w.capacityMw('DE', 'solar', 2020)).toBeCloseTo(53700 + 20000, 6);
    const base = world(9).simulateYear(2020);
    const more = w.simulateYear(2020);
    expect(more.byZone['DE']?.capacityMw['solar']).toBeCloseTo(73700, 6);
    expect(hashYearResult(more)).not.toBe(hashYearResult(base));
    w.clearAdditions();
    expect(w.capacityMw('DE', 'solar', 2020)).toBeCloseTo(53700, 6);
  });

  it('rejects unknown zones, technologies and bad sizes', () => {
    const w = world(1);
    expect(() => w.addCapacity('FR', 'solar', 1)).toThrow();
    expect(() => w.addCapacity('DE', 'fusion' as never, 1)).toThrow();
    expect(() => w.addCapacity('DE', 'solar', -1)).toThrow();
    expect(() => w.addCapacity('DE', 'solar', NaN)).toThrow();
  });
});

describe('market eras', () => {
  it('pays the regulated tariff before the market opens and market prices after', () => {
    const w = world(4);
    const r98 = w.simulateYear(1998);
    const dk98 = r98.byZone['DK1'];
    if (dk98 === undefined) throw new Error('no DK1');
    expect(dk98.marketOpenFromHour).toBe(8760);
    expect(dk98.stats.stdPrice).toBe(0);
    const r99 = w.simulateYear(1999);
    const dk99 = r99.byZone['DK1'];
    if (dk99 === undefined) throw new Error('no DK1');
    const open = hourOfYear({ year: 1999, month: 7, day: 1 });
    expect(dk99.marketOpenFromHour).toBe(open);
    const before = new Set<number>();
    for (let h = 0; h < open; h++) before.add(dk99.price[h] ?? 0);
    expect(before.size).toBe(1);
    const after = new Set<number>();
    for (let h = open; h < dk99.hours; h++) after.add(dk99.price[h] ?? 0);
    expect(after.size).toBeGreaterThan(10);
    // The computed marginal price exists all year.
    expect(dk99.marginalPrice.some((p) => p !== dk99.marginalPrice[0])).toBe(true);
  });

  it('allows negative prices only from the negative-price date', () => {
    const r = world(8).simulateYear(2008);
    const de = r.byZone['DE'];
    if (de === undefined) throw new Error('no DE');
    const from = hourOfYear({ year: 2008, month: 10, day: 1 });
    expect(de.negativeFromHour).toBe(from);
    for (let h = 0; h < from; h++) expect(de.marginalPrice[h] ?? -1).toBeGreaterThanOrEqual(0);
    const r2007 = world(8).simulateYear(2007);
    expect(r2007.byZone['DE']?.stats.negativeHours).toBe(0);
    expect(r2007.byZone['DE']?.negativeFromHour).toBe(8760);
  });
});
