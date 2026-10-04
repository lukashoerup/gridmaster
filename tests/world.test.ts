/**
 * Full-year invariants on the placeholder world, storage and hydro bounds,
 * determinism, the capacity-addition hook and the market-era rules.
 */
import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs, placeholderRaw } from '../src/data/placeholder';
import { SyntheticWeather, World, hashYearResult, hourOfYear, validateInputs, type YearResult } from '../src/sim';

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

/**
 * Golden hash of seed 42, year 2019, fresh world. Recompute after any intended change to the model or the placeholder data.
 * History: 18e65696d6daa883 (first build); f760731eca2d0449 (2026-10-04, F1: fixed links no longer throttled to the importer's demand);
 * 8ff7768adee91c59 (2026-10-04, F15: storage starts empty; the water value's anchor is summed afresh from its window);
 * e0003bc8c6be7e77 (2026-10-04, F5 demand noise per full zone id, F8 storage bid gap, F16 wind mean after clipping,
 * B3 storage window on the computed price, B7 daily fuel/carbon path and daily target fill).
 */
const GOLDEN_HASH_2019_SEED_42 = 'e0003bc8c6be7e77';

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

  it('F9: checks the year, the size ceiling and that hydro has water to use', () => {
    const w = world(1);
    for (const y of [NaN, Infinity, -Infinity, 2020.5, 1990, 2026, '2020' as unknown as number]) {
      expect(() => w.addCapacity('DK1', 'solar', 1000, y), String(y)).toThrow(/fromYear must be an integer in 1995…2025/);
    }
    expect(() => w.addCapacity('DE', 'battery', 1e308)).toThrow(/finite|exceed/);
    expect(() => w.addCapacity('DE', 'battery', Infinity)).toThrow(/finite/);
    expect(() => w.addCapacity('DE', 'wind', 1.1e7)).toThrow(/exceed 10000000 MW/);
    w.addCapacity('DE', 'wind', 6e6);
    expect(() => w.addCapacity('DE', 'wind', 6e6)).toThrow(/exceed/); // cumulative
    expect(() => w.addCapacity('DK1', 'hydro_res', 5000)).toThrow(/no reservoir/);
    expect(() => w.addCapacity('DK1', 'hydro_ror', 5000)).toThrow(/no run-of-river profile/);
    expect(() => w.addCapacity('DE', 'hydro_res', 5000)).toThrow(/no reservoir/);
    // Allowed: run-of-river follows Norway's inflow, or Germany's own (flat) run-of-river fleet.
    w.addCapacity('NO', 'hydro_ror', 1000);
    w.addCapacity('DE', 'hydro_ror', 1000);
    w.addCapacity('NO', 'hydro_res', 1000, 2020);
    expect(w.capacityMw('NO', 'hydro_res', 2019)).toBeLessThan(w.capacityMw('NO', 'hydro_res', 2020));
  });

  it('F9: added run-of-river in Norway follows the inflow, not a flat line', () => {
    const w = world(5);
    w.addCapacity('NO', 'hydro_ror', 5000);
    const no = w.simulateYear(2020).byZone['NO'];
    const g = no?.generation['hydro_ror'];
    if (g === undefined) throw new Error('no run-of-river');
    let min = Infinity;
    let max = -Infinity;
    for (const v of g) {
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    expect(max / min).toBeGreaterThan(2);
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

describe('stress-test findings in the placeholder world', () => {
  function mutated(mutate: (raw: Record<string, unknown>) => void, seed: number): World {
    const raw = structuredClone(placeholderRaw) as unknown as Record<string, unknown>;
    mutate(raw);
    const i = validateInputs(raw as never);
    return new World(i, new SyntheticWeather(i), seed);
  }

  it('F1: a congested link carries its full capacity (was capped at the importer’s demand)', () => {
    const r = world(42).simulateYear(2019);
    let below = 0;
    let congested = 0;
    for (const l of r.links) {
      for (let h = 0; h < r.hours; h++) {
        if (!l.congested[h]) continue;
        congested++;
        if (Math.abs(l.flow[h] ?? 0) < l.capacityMw - 1e-6) below++;
      }
    }
    expect(congested).toBeGreaterThan(1000);
    expect(below).toBe(0); // was 178 link-hours
  });

  it('F2: a tight but plausible system has (almost) no wrong-way link-hours', () => {
    for (const [seed, before] of [
      [1, 101],
      [2, 68],
    ] as const) {
      const w = mutated((raw) => {
        const zones = (raw['zones'] as { zones: { id: string; demandTwh: [number, number][] }[] }).zones;
        const de = zones.find((z) => z.id === 'DE');
        if (de === undefined) throw new Error('no DE');
        de.demandTwh = de.demandTwh.map(([y, v]) => [y, v * 1.2]);
      }, seed);
      const r = w.simulateYear(2024);
      expect(r.wrongWayLinkHours, `seed ${seed} (was ${before})`).toBeLessThanOrEqual(1);
    }
  });
});

describe('world state: snapshot and restore (stress F3, F12, F15)', () => {
  it('F3: a year is a pure function of inputs, seed, year and starting state', () => {
    const w = world(42);
    const fresh = w.snapshot();
    const first = hashYearResult(w.simulateYear(2019));
    expect(first).toBe(GOLDEN_HASH_2019_SEED_42);
    // Simulating again on the same world starts from the end of 2019: a different start, a different result…
    const second = hashYearResult(w.simulateYear(2019));
    expect(second).not.toBe(first);
    // …and restoring the starting state reproduces the first run exactly.
    w.restore(fresh);
    expect(hashYearResult(w.simulateYear(2019))).toBe(first);
    w.reset();
    expect(hashYearResult(w.simulateYear(2019))).toBe(first);
  });

  it('snapshot → JSON → restore → simulate gives identical hashes, and replaying from 1995 reproduces the long run', () => {
    const long = world(5);
    for (let y = 1995; y <= 1998; y++) long.simulateYear(y);
    const jan1999 = long.snapshot();
    const json = JSON.stringify(jan1999);
    const expected = [1999, 2000].map((y) => hashYearResult(long.simulateYear(y)));

    const restored = world(5);
    restored.restore(JSON.parse(json));
    expect(restored.snapshot()).toEqual(jan1999);
    expect([1999, 2000].map((y) => hashYearResult(restored.simulateYear(y)))).toEqual(expected);

    const replay = world(5);
    for (let y = 1995; y <= 1998; y++) replay.simulateYear(y);
    expect(JSON.stringify(replay.snapshot())).toBe(json);
  });

  it('covers reservoirs, storage charge and both price windows', () => {
    const w = world(3);
    w.simulateYear(2015);
    const s = w.snapshot();
    expect(s.version).toBe(1);
    expect(Object.keys(s.reservoirMwh).sort()).toEqual(['ES', 'NO']);
    expect(Object.keys(s.storageMwh)).toContain('DE/pumped');
    expect(Object.keys(s.storageMwh)).toContain('ES/pumped');
    for (const k of Object.keys(s.storageMwh)) expect(k).toMatch(/^(DK1|DE|NO|ES)\/(pumped|battery)$/);
    expect(s.storageMwh['DE/pumped']).toBeGreaterThan(0);
    expect(s.storagePrices['DE']?.length).toBe(168);
    expect(s.neighbourPrices['NO']?.length).toBe(720);
    expect(s.neighbourPrices['ES']?.length ?? 0).toBe(0); // Spain has no link to anchor its water value to
  });

  it('rejects malformed states with a clear error and leaves the world unchanged', () => {
    const w = world(3);
    const good = w.snapshot();
    const bad: [string, unknown][] = [
      ['unknown state version', { ...good, version: 2 }],
      ['unknown zone', { ...good, reservoirMwh: { FR: 1 } }],
      ['has no reservoir', { ...good, reservoirMwh: { DK1: 1 } }],
      ['outside the reservoir', { ...good, reservoirMwh: { NO: -1 } }],
      ['bad key', { ...good, storageMwh: { 'DE/coal': 1 } }],
      ['negative', { ...good, storageMwh: { 'DE/pumped': -1 } }],
      ['finite number', { ...good, storagePrices: { DE: [1, NaN] } }],
      ['finite number', { ...good, neighbourPrices: { NO: [Infinity] } }],
    ];
    for (const [msg, state] of bad) expect(() => w.restore(state as never), msg).toThrow(msg);
    expect(w.snapshot()).toEqual(good);
  });

  it('F15: new storage starts empty instead of half full', () => {
    const w = world(9);
    w.addCapacity('DE', 'battery', 100_000, 2024);
    const r = w.simulateYear(2024);
    const de = r.byZone['DE'];
    const soc = de?.stateOfCharge['battery'];
    const charge = de?.charging['battery'];
    const discharge = de?.generation['battery'];
    if (soc === undefined || charge === undefined || discharge === undefined) throw new Error('no battery');
    const eta = Math.sqrt(inputs.technologies.get('battery')?.roundTripEfficiency ?? 1);
    expect(discharge[0]).toBe(0); // nothing to sell in the first hour
    expect(soc[0]).toBeCloseTo((charge[0] ?? 0) * eta, 9);
  });

  it('F15: stored energy above a shrunken capacity is dropped on 1 January; vanished storage loses its charge', () => {
    const w = world(9);
    const s = w.snapshot();
    w.restore({ ...s, storageMwh: { 'DE/pumped': 1e9, 'DK1/pumped': 500 } });
    const r = w.simulateYear(2019);
    const de = r.byZone['DE'];
    const energy = (de?.capacityMw['pumped'] ?? 0) * (inputs.technologies.get('pumped')?.storageHours ?? 0);
    const soc = de?.stateOfCharge['pumped'];
    if (soc === undefined) throw new Error('no pumped storage');
    for (let h = 0; h < r.hours; h++) expect(soc[h] ?? Infinity).toBeLessThanOrEqual(energy + 1e-6);
    expect(w.snapshot().storageMwh['DK1/pumped']).toBeUndefined();
  });

  it('F12: rejects years that are not integers within the inputs’ range', () => {
    const w = world(1);
    expect(inputs.firstYear).toBe(1995);
    expect(inputs.lastYear).toBe(2025);
    for (const year of [NaN, Infinity, 2019.5, 1900, 1994, 2026, 0, -4, '2019' as unknown as number]) {
      expect(() => w.simulateYear(year), String(year)).toThrow(/year must be an integer in 1995…2025/);
    }
  });

  it('F12: seeds are unsigned 32-bit integers; anything else is rejected, not wrapped', () => {
    expect(world(0).seed).toBe(0);
    expect(world(4294967295).seed).toBe(4294967295);
    for (const seed of [-1, 4294967296, 2 ** 53, 1.9, NaN, Infinity, -Infinity]) {
      expect(() => world(seed), String(seed)).toThrow(/seed must be an integer in 0…4294967295/);
    }
  });
});

describe('stress-test and analyst findings in the core (Group 3)', () => {
  it('F4: capture rates are null when the year’s mean price is at or below 1 €/MWh', () => {
    const w = world(4);
    w.addCapacity('DK1', 'wind', 500_000);
    const dk1 = w.simulateYear(2025).byZone['DK1'];
    if (dk1 === undefined) throw new Error('no DK1');
    expect(dk1.stats.meanPrice).toBeLessThanOrEqual(1);
    for (const t of Object.values(dk1.stats.byTech)) expect(t.captureRate).toBeNull();
  });

  it('F6: sizes the clearing engine from the inputs, so 40 zones run (was a crash from 17)', () => {
    const raw = structuredClone(placeholderRaw) as unknown as Record<string, any>; // free-form JSON
    const de = raw['zones'].zones.find((z: { id: string }) => z.id === 'DE');
    const ids = Array.from({ length: 40 }, (_, i) => `Z${String(i).padStart(2, '0')}`);
    raw['zones'].zones = ids.map((id) => ({ ...structuredClone(de), id, name: id }));
    raw['capacity'].capacity = Object.fromEntries(ids.map((id) => [id, structuredClone(raw['capacity'].capacity.DE)]));
    raw['capacity'].mustRunOverrides = {};
    raw['support'].support = Object.fromEntries(ids.map((id) => [id, structuredClone(raw['support'].support.DE)]));
    raw['links'].links = [];
    raw['weather'].zoneOrder = ids;
    const identity = ids.map((_, i) => ids.map((__, j) => (i === j ? 1 : 0)));
    raw['weather'].windCorrelation = identity;
    raw['weather'].solarCorrelation = identity;
    const i40 = validateInputs(raw as never);
    const t0 = performance.now();
    const r = new World(i40, new SyntheticWeather(i40), 1).simulateYear(2019);
    console.log(`speed: one year, 40 unlinked DE-sized zones: ${(performance.now() - t0).toFixed(0)} ms`);
    expect(r.zones.length).toBe(40);
    checkInvariants(r);
  });

  it('F8: storage never charges and discharges in the same hour, even at deeply negative prices', () => {
    const both = (r: YearResult): number => {
      let n = 0;
      for (const zid of r.zones) {
        const z = r.byZone[zid];
        if (z === undefined) continue;
        for (const [t, c] of Object.entries(z.charging)) {
          const g = z.generation[t];
          if (g === undefined) continue;
          for (let h = 0; h < r.hours; h++) if ((c[h] ?? 0) > 1e-6 && (g[h] ?? 0) > 1e-6) n++;
        }
      }
      return n;
    };
    const windy = world(1);
    windy.addCapacity('DE', 'wind', 500_000);
    expect(both(windy.simulateYear(2012))).toBe(0); // was 1,668 hours
    const raw = structuredClone(placeholderRaw) as unknown as { zones: { zones: { demandTwh: [number, number][] }[] } };
    for (const z of raw.zones.zones) z.demandTwh = [[1995, 0]];
    const idle = validateInputs(raw as never);
    expect(both(new World(idle, new SyntheticWeather(idle), 1).simulateYear(2009))).toBe(0); // was 8,696 hours
  });

  it('B3: storage reads the computed market price, so it trades before the market opens', () => {
    const r = world(42).simulateYear(1999);
    const de = r.byZone['DE'];
    if (de === undefined) throw new Error('no DE');
    expect(de.marketOpenFromHour).toBe(r.hours); // regulated all year
    let charged = 0;
    let discharged = 0;
    for (let h = 0; h < r.hours; h++) {
      charged += de.charging['pumped']?.[h] ?? 0;
      discharged += de.generation['pumped']?.[h] ?? 0;
    }
    expect(charged).toBeGreaterThan(100_000); // MWh; was 0 while it read the flat tariff
    expect(discharged).toBeGreaterThan(0);
  });

  it('B7: Norway’s price does not jump on the 1st of a month', () => {
    const no = world(42).simulateYear(2010).byZone['NO'];
    if (no === undefined) throw new Error('no NO');
    const days = no.hours / 24;
    const daily: number[] = [];
    for (let d = 0; d < days; d++) {
      let s = 0;
      for (let h = 0; h < 24; h++) s += no.price[d * 24 + h] ?? 0;
      daily.push(s / 24);
    }
    const firsts = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => hourOfYear({ year: 2010, month: m, day: 1 }) / 24));
    let onFirst = 0;
    let nFirst = 0;
    let other = 0;
    let nOther = 0;
    for (let d = 1; d < days; d++) {
      const step = Math.abs((daily[d] ?? 0) - (daily[d - 1] ?? 0));
      if (firsts.has(d)) {
        onFirst += step;
        nFirst++;
      } else {
        other += step;
        nOther++;
      }
    }
    // Was 10.4 vs 1.2 €/MWh across seeds (analyst table M).
    expect(onFirst / nFirst).toBeLessThan(3 * (other / nOther) + 0.5);
  });

  it('B7: fuel and carbon costs do not step at New Year', () => {
    const w = world(1);
    for (const t of ['gas_ccgt', 'coal', 'lignite'] as const) {
      for (let y = 2019; y < 2025; y++) expect(w.marginalCost(t, y, 1), `${t} ${y}`).toBeCloseTo(w.marginalCost(t, y + 1, 0), 9);
    }
  });
});
