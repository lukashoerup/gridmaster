/**
 * Hourly market clearing with zone coupling.
 *
 * Every zone contributes supply blocks (bid €/MWh, size MW) and firm demand,
 * plus optional price-sensitive demand blocks (storage charging with a
 * willingness to pay). Zones joined by links are cleared together as one
 * merged merit order ("market splitting", as Nord Pool did): the merged price
 * holds for all zones in the group, net positions give the link flows, and
 * when a flow exceeds a link's capacity that link is fixed at its limit, the
 * group splits and the parts are cleared again. Uncongested zones therefore
 * share one price exactly; congested links separate prices.
 *
 * A scarcity adder lifts every bid toward the price cap as spare capacity in
 * the group runs out: eff = bid + (cap − bid) × s³, with s rising from 0 at
 * the reserve margin to 1 when spare capacity is gone. The adder is applied
 * to the bids before clearing, so storage and hydro see it consistently.
 *
 * Everything is preallocated and reused hour after hour; the engine owns no
 * state between hours apart from its buffers.
 */

export const TRANCHE = {
  NORMAL: 0,
  MUST_RUN: 1,
  FLEX_RENEWABLE: 2,
  LEGACY_RENEWABLE: 3,
  STORAGE: 4,
  HYDRO_FORCED: 5,
  HYDRO: 6,
} as const;
export type Tranche = (typeof TRANCHE)[keyof typeof TRANCHE];

export interface LinkSpec {
  readonly from: number;
  readonly to: number;
  readonly capacityMw: number;
}

const EPS_MW = 1e-6;

export class ClearingEngine {
  readonly nZones: number;

  // Zone parameters for the hour, set by the caller before clear().
  readonly demand: Float64Array;
  readonly floor: Float64Array;
  readonly cap: Float64Array;
  readonly reserveFraction: Float64Array;

  // Supply blocks.
  readonly bZone: Int32Array;
  readonly bTech: Int32Array;
  readonly bTranche: Int32Array;
  readonly bBid: Float64Array;
  readonly bEff: Float64Array;
  readonly bMw: Float64Array;
  readonly bDisp: Float64Array;
  nBlocks = 0;

  // Price-sensitive demand blocks (storage charging).
  readonly cZone: Int32Array;
  readonly cTech: Int32Array;
  readonly cWtp: Float64Array;
  readonly cMw: Float64Array;
  readonly cDisp: Float64Array;
  nCharges = 0;

  // Outputs per zone.
  readonly price: Float64Array;
  readonly unserved: Float64Array;
  readonly scarcity: Float64Array;
  readonly netPosition: Float64Array;
  /** Count of fixed links whose exporter ended up dearer than its importer (diagnostic). */
  wrongWayLinks = 0;

  // Links.
  private links: readonly LinkSpec[] = [];
  flow: Float64Array = new Float64Array(0);
  linkFixed: Uint8Array = new Uint8Array(0);
  private repaired: Uint8Array = new Uint8Array(0);

  // Scratch.
  private readonly fixedExport: Float64Array;
  private readonly groupOf: Int32Array;
  private readonly uf: Int32Array;
  private readonly genSum: Float64Array;
  private readonly chargeSum: Float64Array;
  private readonly sortedBlocks: number[] = [];
  private readonly sortedCharges: number[] = [];
  private readonly visited: Uint8Array;
  private readonly parentLink: Int32Array;
  private readonly parentZone: Int32Array;
  private readonly depth: Int32Array;
  private readonly subtree: Float64Array;
  private readonly order: number[] = [];
  private inTree: Uint8Array = new Uint8Array(0);
  private readonly maxBlocks: number;
  private readonly maxCharges: number;

  constructor(nZones: number, maxBlocks = 512, maxCharges = 64) {
    this.nZones = nZones;
    this.maxBlocks = maxBlocks;
    this.maxCharges = maxCharges;
    this.demand = new Float64Array(nZones);
    this.floor = new Float64Array(nZones);
    this.cap = new Float64Array(nZones);
    this.reserveFraction = new Float64Array(nZones);
    this.bZone = new Int32Array(maxBlocks);
    this.bTech = new Int32Array(maxBlocks);
    this.bTranche = new Int32Array(maxBlocks);
    this.bBid = new Float64Array(maxBlocks);
    this.bEff = new Float64Array(maxBlocks);
    this.bMw = new Float64Array(maxBlocks);
    this.bDisp = new Float64Array(maxBlocks);
    this.cZone = new Int32Array(maxCharges);
    this.cTech = new Int32Array(maxCharges);
    this.cWtp = new Float64Array(maxCharges);
    this.cMw = new Float64Array(maxCharges);
    this.cDisp = new Float64Array(maxCharges);
    this.price = new Float64Array(nZones);
    this.unserved = new Float64Array(nZones);
    this.scarcity = new Float64Array(nZones);
    this.netPosition = new Float64Array(nZones);
    this.fixedExport = new Float64Array(nZones);
    this.groupOf = new Int32Array(nZones);
    this.uf = new Int32Array(nZones);
    this.genSum = new Float64Array(nZones);
    this.chargeSum = new Float64Array(nZones);
    this.visited = new Uint8Array(nZones);
    this.parentLink = new Int32Array(nZones);
    this.parentZone = new Int32Array(nZones);
    this.depth = new Int32Array(nZones);
    this.subtree = new Float64Array(nZones);
  }

  /** Links available this hour (zero-capacity links should be left out). */
  setLinks(links: readonly LinkSpec[]): void {
    this.links = links;
    if (this.flow.length !== links.length) {
      this.flow = new Float64Array(links.length);
      this.linkFixed = new Uint8Array(links.length);
      this.inTree = new Uint8Array(links.length);
      this.repaired = new Uint8Array(links.length);
    }
  }

  get linkCount(): number {
    return this.links.length;
  }

  link(i: number): LinkSpec {
    const l = this.links[i];
    if (l === undefined) throw new Error(`no link ${i}`);
    return l;
  }

  beginHour(): void {
    this.nBlocks = 0;
    this.nCharges = 0;
  }

  /** Add a supply block. Bids are clamped into the zone's [floor, cap]. */
  addBlock(zone: number, tech: number, tranche: Tranche, bid: number, mw: number): void {
    if (!(mw > EPS_MW)) return;
    if (this.nBlocks >= this.maxBlocks) throw new Error('too many supply blocks');
    const i = this.nBlocks++;
    const fl = this.floor[zone] ?? -Infinity;
    const cp = this.cap[zone] ?? Infinity;
    this.bZone[i] = zone;
    this.bTech[i] = tech;
    this.bTranche[i] = tranche;
    this.bBid[i] = Math.min(cp, Math.max(fl, bid));
    this.bMw[i] = mw;
    this.bDisp[i] = 0;
  }

  /** Add a price-sensitive demand block (buys when the price is at or below `wtp`). */
  addCharge(zone: number, tech: number, wtp: number, mw: number): void {
    if (!(mw > EPS_MW)) return;
    if (this.nCharges >= this.maxCharges) throw new Error('too many charge blocks');
    const i = this.nCharges++;
    const fl = this.floor[zone] ?? -Infinity;
    const cp = this.cap[zone] ?? Infinity;
    this.cZone[i] = zone;
    this.cTech[i] = tech;
    this.cWtp[i] = Math.min(cp, Math.max(fl, wtp));
    this.cMw[i] = mw;
    this.cDisp[i] = 0;
  }

  private find(z: number): number {
    let r = z;
    while ((this.uf[r] ?? r) !== r) r = this.uf[r] ?? r;
    // path compression
    let c = z;
    while ((this.uf[c] ?? c) !== r) {
      const next = this.uf[c] ?? c;
      this.uf[c] = r;
      c = next;
    }
    return r;
  }

  /** Clear the hour: merged merit orders per coupled group, flows, congestion splitting. */
  clear(): void {
    const nz = this.nZones;
    const nl = this.links.length;
    this.fixedExport.fill(0);
    this.flow.fill(0);
    this.linkFixed.fill(0);
    this.wrongWayLinks = 0;

    this.repaired.fill(0);
    // Each link can be fixed, released once (repair) and fixed again: at most
    // 3·nl changes, each followed by a fresh clearing, so the final state is
    // always a clearing consistent with the flows.
    const maxChanges = 3 * nl;
    for (let changes = 0; ; ) {
      // Connected components over free links.
      for (let z = 0; z < nz; z++) this.uf[z] = z;
      for (let l = 0; l < nl; l++) {
        if (this.linkFixed[l]) continue;
        const link = this.links[l];
        if (link === undefined) continue;
        const a = this.find(link.from);
        const b = this.find(link.to);
        if (a !== b) this.uf[Math.max(a, b)] = Math.min(a, b);
      }
      for (let z = 0; z < nz; z++) this.groupOf[z] = this.find(z);

      // A group whose fixed imports exceed its demand cannot absorb them:
      // scale those imports down (the importer, not the link, is the limit).
      for (let r = 0; r < nz; r++) {
        if (this.groupOf[r] !== r) continue;
        let dG = 0;
        for (let z = 0; z < nz; z++) if (this.groupOf[z] === r) dG += (this.demand[z] ?? 0) + (this.fixedExport[z] ?? 0);
        if (dG >= -EPS_MW) continue;
        let imports = 0;
        for (let l = 0; l < nl; l++) {
          if (!this.linkFixed[l]) continue;
          const link = this.links[l];
          if (link === undefined) continue;
          const f = this.flow[l] ?? 0;
          if (f > 0 && this.groupOf[link.to] === r && this.groupOf[link.from] !== r) imports += f;
          else if (f < 0 && this.groupOf[link.from] === r && this.groupOf[link.to] !== r) imports -= f;
        }
        if (imports <= 0) continue;
        const scale = Math.max(0, (imports + dG) / imports);
        for (let l = 0; l < nl; l++) {
          if (!this.linkFixed[l]) continue;
          const link = this.links[l];
          if (link === undefined) continue;
          const f = this.flow[l] ?? 0;
          const intoGroup =
            (f > 0 && this.groupOf[link.to] === r && this.groupOf[link.from] !== r) ||
            (f < 0 && this.groupOf[link.from] === r && this.groupOf[link.to] !== r);
          if (!intoGroup) continue;
          const exporter = f > 0 ? link.from : link.to;
          const importer = f > 0 ? link.to : link.from;
          const cut = Math.abs(f) * (1 - scale);
          this.fixedExport[exporter] = (this.fixedExport[exporter] ?? 0) - cut;
          this.fixedExport[importer] = (this.fixedExport[importer] ?? 0) + cut;
          this.flow[l] = f * scale;
        }
      }

      // Clear each group.
      for (let z = 0; z < nz; z++) if (this.groupOf[z] === z) this.clearGroup(z);

      // Net positions for the free-link flow solve.
      this.genSum.fill(0);
      this.chargeSum.fill(0);
      for (let i = 0; i < this.nBlocks; i++) {
        const z = this.bZone[i] ?? 0;
        this.genSum[z] = (this.genSum[z] ?? 0) + (this.bDisp[i] ?? 0);
      }
      for (let i = 0; i < this.nCharges; i++) {
        const z = this.cZone[i] ?? 0;
        this.chargeSum[z] = (this.chargeSum[z] ?? 0) + (this.cDisp[i] ?? 0);
      }
      for (let z = 0; z < nz; z++) {
        this.netPosition[z] =
          (this.genSum[z] ?? 0) - (this.chargeSum[z] ?? 0) - ((this.demand[z] ?? 0) + (this.fixedExport[z] ?? 0)) + (this.unserved[z] ?? 0);
      }
      if (nl === 0) break;
      this.solveFreeFlows();
      if (changes >= maxChanges) break;

      // Most violated free link.
      let worst = -1;
      let worstRatio = 1 + 1e-9;
      for (let l = 0; l < nl; l++) {
        if (this.linkFixed[l]) continue;
        const link = this.links[l];
        if (link === undefined) continue;
        const ratio = Math.abs(this.flow[l] ?? 0) / link.capacityMw;
        if (ratio > worstRatio) {
          worstRatio = ratio;
          worst = l;
        }
      }
      if (worst >= 0) {
        // Fix it at its limit, in the direction it wanted to flow.
        const link = this.links[worst];
        if (link === undefined) break;
        const dir = (this.flow[worst] ?? 0) >= 0 ? 1 : -1;
        const exporter = dir > 0 ? link.from : link.to;
        const importer = dir > 0 ? link.to : link.from;
        let f = link.capacityMw;
        const importerRoom = (this.demand[importer] ?? 0) + (this.fixedExport[importer] ?? 0);
        if (f > importerRoom) f = Math.max(0, importerRoom);
        this.fixedExport[exporter] = (this.fixedExport[exporter] ?? 0) + f;
        this.fixedExport[importer] = (this.fixedExport[importer] ?? 0) - f;
        this.flow[worst] = dir * f;
        this.linkFixed[worst] = 1;
        changes++;
        continue;
      }

      // Repair: a link fixed earlier may now flow from the dearer zone to the
      // cheaper one (its flow was over-committed while another link was still
      // free). Release it once and let the merged clearing find its flow.
      let released = false;
      for (let l = 0; l < nl && !released; l++) {
        if (!this.linkFixed[l] || this.repaired[l]) continue;
        const link = this.links[l];
        if (link === undefined) continue;
        const f = this.flow[l] ?? 0;
        if (f === 0) continue;
        const exporter = f > 0 ? link.from : link.to;
        const importer = f > 0 ? link.to : link.from;
        if ((this.price[exporter] ?? 0) > (this.price[importer] ?? 0) + 1e-6) {
          this.fixedExport[exporter] = (this.fixedExport[exporter] ?? 0) - Math.abs(f);
          this.fixedExport[importer] = (this.fixedExport[importer] ?? 0) + Math.abs(f);
          this.flow[l] = 0;
          this.linkFixed[l] = 0;
          this.repaired[l] = 1;
          released = true;
        }
      }
      if (!released) break;
      changes++;
    }

    // Net positions include every link now; diagnostics on fixed links.
    this.netPosition.fill(0);
    for (let l = 0; l < nl; l++) {
      const link = this.links[l];
      if (link === undefined) continue;
      const f = this.flow[l] ?? 0;
      this.netPosition[link.from] = (this.netPosition[link.from] ?? 0) + f;
      this.netPosition[link.to] = (this.netPosition[link.to] ?? 0) - f;
      if (this.linkFixed[l] && f !== 0) {
        const exporter = f > 0 ? link.from : link.to;
        const importer = f > 0 ? link.to : link.from;
        if ((this.price[exporter] ?? 0) > (this.price[importer] ?? 0) + 1e-6) this.wrongWayLinks++;
      }
    }
  }

  /** Merged merit-order clearing of one coupled group (identified by its root zone). */
  private clearGroup(root: number): void {
    const nz = this.nZones;
    const blocks = this.sortedBlocks;
    const charges = this.sortedCharges;
    blocks.length = 0;
    charges.length = 0;
    let dFirm = 0;
    let totalMw = 0;
    let rfMax = 0;
    let capG = Infinity;
    for (let z = 0; z < nz; z++) {
      if (this.groupOf[z] !== root) continue;
      // A zone's adjusted demand may be negative inside a group (it passes
      // fixed imports on to a neighbour); the group total is what clears.
      dFirm += (this.demand[z] ?? 0) + (this.fixedExport[z] ?? 0);
      rfMax = Math.max(rfMax, this.reserveFraction[z] ?? 0);
      capG = Math.min(capG, this.cap[z] ?? Infinity);
    }
    for (let i = 0; i < this.nBlocks; i++) {
      if (this.groupOf[this.bZone[i] ?? 0] !== root) continue;
      blocks.push(i);
      totalMw += this.bMw[i] ?? 0;
    }
    for (let i = 0; i < this.nCharges; i++) {
      if (this.groupOf[this.cZone[i] ?? 0] !== root) continue;
      charges.push(i);
    }
    dFirm = Math.max(0, dFirm);

    // Scarcity: lift bids toward the cap as spare capacity runs out.
    const spare = totalMw - dFirm;
    const reserve = rfMax * dFirm;
    let s: number;
    if (reserve > 0) s = Math.min(1, Math.max(0, (reserve - spare) / reserve));
    else s = spare < 0 ? 1 : 0;
    const s3 = s * s * s;
    const eff = this.bEff;
    for (const i of blocks) {
      const bid = this.bBid[i] ?? 0;
      eff[i] = bid + (capG - bid) * s3;
    }
    blocks.sort((a, b) => (eff[a] ?? 0) - (eff[b] ?? 0) || a - b);
    const wtp = this.cWtp;
    charges.sort((a, b) => (wtp[b] ?? 0) - (wtp[a] ?? 0) || a - b);

    const nb = blocks.length;
    const nc = charges.length;
    for (const i of blocks) this.bDisp[i] = 0;
    for (const c of charges) this.cDisp[c] = 0;

    let supplied = 0;
    let prevP = -Infinity;
    let settled = false;
    let priceG = capG;
    let unservedG = 0;

    // Try to settle at a demand step (a charge's willingness to pay) in [prevP, upper).
    const settleAtCharge = (upper: number): boolean => {
      for (let k = nc - 1; k >= 0; k--) {
        const c = charges[k] ?? 0;
        const w = wtp[c] ?? 0;
        if (w < prevP) continue;
        if (w >= upper) break;
        let dExcl = dFirm;
        for (let m = 0; m < k; m++) dExcl += this.cMw[charges[m] ?? 0] ?? 0;
        if (supplied >= dExcl - EPS_MW) {
          priceG = w;
          for (let m = 0; m < k; m++) {
            const cm = charges[m] ?? 0;
            this.cDisp[cm] = this.cMw[cm] ?? 0;
          }
          this.cDisp[c] = Math.min(this.cMw[c] ?? 0, Math.max(0, supplied - dExcl));
          return true;
        }
      }
      return false;
    };

    let i = 0;
    while (i < nb) {
      const bi = blocks[i] ?? 0;
      const p = eff[bi] ?? 0;
      let j = i + 1;
      while (j < nb && (eff[blocks[j] ?? 0] ?? 0) === p) j++;
      let groupMw = 0;
      for (let k = i; k < j; k++) groupMw += this.bMw[blocks[k] ?? 0] ?? 0;

      if (nc > 0 && settleAtCharge(p)) {
        settled = true;
        break;
      }

      let dAtP = dFirm;
      for (let k = 0; k < nc; k++) {
        const c = charges[k] ?? 0;
        if ((wtp[c] ?? 0) >= p) dAtP += this.cMw[c] ?? 0;
      }
      if (supplied + groupMw >= dAtP - EPS_MW) {
        const need = Math.max(0, dAtP - supplied);
        const frac = groupMw > 0 ? Math.min(1, need / groupMw) : 0;
        for (let k = i; k < j; k++) {
          const b = blocks[k] ?? 0;
          this.bDisp[b] = (this.bMw[b] ?? 0) * frac;
        }
        for (let k = 0; k < nc; k++) {
          const c = charges[k] ?? 0;
          if ((wtp[c] ?? 0) >= p) this.cDisp[c] = this.cMw[c] ?? 0;
        }
        priceG = p;
        settled = true;
        break;
      }

      for (let k = i; k < j; k++) {
        const b = blocks[k] ?? 0;
        this.bDisp[b] = this.bMw[b] ?? 0;
      }
      supplied += groupMw;
      prevP = p;
      i = j;
    }

    if (!settled && nc > 0 && settleAtCharge(Infinity)) settled = true;
    if (!settled) {
      priceG = capG;
      unservedG = Math.max(0, dFirm - supplied);
    }

    let positiveDemand = 0;
    for (let z = 0; z < nz; z++) {
      if (this.groupOf[z] === root) positiveDemand += Math.max(0, (this.demand[z] ?? 0) + (this.fixedExport[z] ?? 0));
    }
    for (let z = 0; z < nz; z++) {
      if (this.groupOf[z] !== root) continue;
      const fl = this.floor[z] ?? -Infinity;
      const cp = this.cap[z] ?? Infinity;
      this.price[z] = Math.min(cp, Math.max(fl, priceG));
      this.scarcity[z] = s;
      const dz = Math.max(0, (this.demand[z] ?? 0) + (this.fixedExport[z] ?? 0));
      this.unserved[z] = positiveDemand > 0 ? (unservedG * dz) / positiveDemand : 0;
    }
  }

  /**
   * Flows on the free links from the zones' net positions. A spanning tree
   * gives unique flows; each cycle-closing link's flow is then chosen to
   * minimise the highest utilisation around its cycle.
   */
  private solveFreeFlows(): void {
    const nz = this.nZones;
    const nl = this.links.length;
    for (let l = 0; l < nl; l++) if (!this.linkFixed[l]) this.flow[l] = 0;
    this.visited.fill(0);
    this.parentLink.fill(-1);
    this.parentZone.fill(-1);
    this.depth.fill(0);
    this.inTree.fill(0);
    this.order.length = 0;
    for (let z0 = 0; z0 < nz; z0++) {
      if (this.visited[z0]) continue;
      this.visited[z0] = 1;
      const stack = [z0];
      while (stack.length > 0) {
        const u = stack.pop() ?? 0;
        this.order.push(u);
        for (let l = 0; l < nl; l++) {
          if (this.linkFixed[l]) continue;
          const link = this.links[l];
          if (link === undefined) continue;
          let v = -1;
          if (link.from === u) v = link.to;
          else if (link.to === u) v = link.from;
          if (v < 0 || this.visited[v]) continue;
          this.visited[v] = 1;
          this.parentLink[v] = l;
          this.parentZone[v] = u;
          this.depth[v] = (this.depth[u] ?? 0) + 1;
          this.inTree[l] = 1;
          stack.push(v);
        }
      }
    }
    for (let z = 0; z < nz; z++) this.subtree[z] = this.netPosition[z] ?? 0;
    for (let idx = this.order.length - 1; idx >= 0; idx--) {
      const z = this.order[idx] ?? 0;
      const l = this.parentLink[z] ?? -1;
      if (l < 0) continue;
      const link = this.links[l];
      if (link === undefined) continue;
      const s = this.subtree[z] ?? 0;
      this.flow[l] = link.from === z ? s : -s;
      const pz = this.parentZone[z] ?? 0;
      this.subtree[pz] = (this.subtree[pz] ?? 0) + s;
    }
    // Cycle closers.
    for (let l = 0; l < nl; l++) {
      if (this.linkFixed[l] || this.inTree[l]) continue;
      const link = this.links[l];
      if (link === undefined) continue;
      const cycleLinks: number[] = [l];
      const coef: number[] = [1];
      let a = link.to;
      let b = link.from;
      // Walk both ends up to their common ancestor; pushing t along l (from→to)
      // returns along the tree path to→…→from.
      while (a !== b) {
        if ((this.depth[a] ?? 0) >= (this.depth[b] ?? 0)) {
          const pl = this.parentLink[a] ?? -1;
          const pz = this.parentZone[a] ?? 0;
          const tl = this.links[pl];
          if (pl < 0 || tl === undefined) break;
          cycleLinks.push(pl);
          coef.push(tl.from === a ? 1 : -1); // child → parent, towards the ancestor
          a = pz;
        } else {
          const pl = this.parentLink[b] ?? -1;
          const pz = this.parentZone[b] ?? 0;
          const tl = this.links[pl];
          if (pl < 0 || tl === undefined) break;
          cycleLinks.push(pl);
          coef.push(tl.from === pz ? 1 : -1); // parent → child, towards `from`
          b = pz;
        }
      }
      let range = 0;
      for (const cl of cycleLinks) range = Math.max(range, this.links[cl]?.capacityMw ?? 0);
      range *= 2;
      const util = (t: number): number => {
        let worst = 0;
        for (let k = 0; k < cycleLinks.length; k++) {
          const cl = cycleLinks[k] ?? 0;
          const c = this.links[cl]?.capacityMw ?? 1;
          const f = (this.flow[cl] ?? 0) + t * (coef[k] ?? 0);
          worst = Math.max(worst, Math.abs(f) / c);
        }
        return worst;
      };
      let lo = -range;
      let hi = range;
      for (let it = 0; it < 60; it++) {
        const m1 = lo + (hi - lo) / 3;
        const m2 = hi - (hi - lo) / 3;
        if (util(m1) <= util(m2)) hi = m2;
        else lo = m1;
      }
      const t = (lo + hi) / 2;
      for (let k = 0; k < cycleLinks.length; k++) {
        const cl = cycleLinks[k] ?? 0;
        this.flow[cl] = (this.flow[cl] ?? 0) + t * (coef[k] ?? 0);
      }
    }
  }
}
