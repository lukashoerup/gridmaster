/**
 * Hourly market clearing with zone coupling.
 *
 * Every zone contributes supply blocks (bid €/MWh, size MW) and firm demand,
 * plus optional price-sensitive demand blocks (storage charging with a
 * willingness to pay). Zones joined by links are cleared together as one
 * merged merit order ("market splitting", as Nord Pool did): the merged price
 * holds for all zones in the group, net positions give the link flows, and
 * when a flow exceeds a link's capacity that link is fixed at its limit, the
 * group splits and the parts are cleared again.
 *
 * - **One price per coupled group.** Uncongested zones share one price
 *   exactly. Offers are dispatched in the order of their own bids, and the
 *   group's price is held inside the tightest limits of its zones: the
 *   highest floor and the lowest cap. So while one zone still forbids
 *   negative prices, a group it is coupled to prices at zero, not below;
 *   a storage charge bidding below that floor does not buy.
 * - **Fixed links carry their full capacity** whenever the importing side can
 *   use it: to meet demand, to charge storage, or to pass it on to a
 *   neighbour. Only when a whole group cannot absorb its fixed imports (its
 *   firm demand plus every storage charge it could buy is smaller than the
 *   imports) are those imports scaled down.
 * - **Wrong-way repair.** A link fixed earlier can end up flowing from the
 *   dearer zone to the cheaper one once later links are fixed. Such a link is
 *   released and the clearing repeats, the largest mismatch first; a link may
 *   be released up to `MAX_RELEASES` times, so the loop always ends and the
 *   repair converges in the cases sequential fixing creates. `wrongWayLinks`
 *   counts what is left (a diagnostic: zero in the stress worlds and in
 *   20,000 fuzzed meshes with equal floors). The one known leftover needs
 *   different floors: a group held at a higher floor (say 0) that passes
 *   power on to a zone priced below it shows as wrong-way by price although
 *   the power comes from offers below both prices.
 * - **Scarcity.** A scarcity adder lifts every bid toward the zone's price cap
 *   as spare capacity runs out: eff = bid + (cap − bid) × s³, with s rising
 *   from 0 at the reserve margin (reserveFraction × the zone's own demand) to
 *   1 when spare capacity is gone. s is computed per zone, once per hour and
 *   before clearing, from the zone's own firm demand (exports are not firm)
 *   and its spare capacity: its own offers minus its own demand, plus what
 *   each link could bring in from the neighbour's own spare (up to the link's
 *   capacity). Because the lifted bids do not depend on how the zones end up
 *   grouped, a coupled group and its split parts price consistently, and an
 *   exporter is never lifted above the zone it exports to by its exports.
 *   The adder is applied to the bids before clearing, so storage and hydro
 *   see it consistently.
 * - **Empty zones.** A group with no offers and no demand forms no price; it
 *   is reported at 0 €/MWh (inside its floor and cap), never at the cap.
 *   Unserved energy is shared among a group's zones in proportion to their
 *   demand (a design question for Lukas, see the Phase 1 task notes).
 *
 * Inputs are checked: non-finite or negative sizes, non-finite bids and
 * demand, bad links and unknown zones throw a clear error rather than
 * leaking NaN into prices. The engine is sized by the caller (`World` sizes
 * it from the inputs); it owns no state between hours apart from its buffers.
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
/** Prices closer than this (€/MWh) count as equal for congestion and wrong-way checks. */
const EPS_PRICE = 1e-6;
/** How often one link may be released by the wrong-way repair within one hour. */
const MAX_RELEASES = 3;
/** Default buffer sizes per zone when the caller does not size the engine. */
const DEFAULT_BLOCKS_PER_ZONE = 64;
const DEFAULT_CHARGES_PER_ZONE = 8;

function fail(msg: string): never {
  throw new Error(`ClearingEngine: ${msg}`);
}

export class ClearingEngine {
  readonly nZones: number;
  readonly maxBlocks: number;
  readonly maxCharges: number;

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
  /** Effective bid after the scarcity adder and the group's floor/cap, set by clear(). */
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
  /** 1 where the clearing held the link at a fixed flow (its capacity, or less if the importer could not absorb it). */
  linkFixed: Uint8Array = new Uint8Array(0);
  /** 1 where the link was fixed and the prices on its two sides differ: the link separated the zones. */
  congested: Uint8Array = new Uint8Array(0);
  private releases: Uint8Array = new Uint8Array(0);
  /** Direction of a fixed link: +1 from→to, −1 to→from. */
  private fixedDir: Int8Array = new Int8Array(0);

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

  /**
   * @param nZones number of zones
   * @param maxBlocks most supply blocks in one hour (default 64 per zone)
   * @param maxCharges most storage-charging blocks in one hour (default 8 per zone)
   */
  constructor(nZones: number, maxBlocks = nZones * DEFAULT_BLOCKS_PER_ZONE, maxCharges = nZones * DEFAULT_CHARGES_PER_ZONE) {
    if (!Number.isInteger(nZones) || nZones <= 0) fail(`nZones must be a positive integer, got ${nZones}`);
    if (!Number.isInteger(maxBlocks) || maxBlocks < 0) fail(`maxBlocks must be a non-negative integer, got ${maxBlocks}`);
    if (!Number.isInteger(maxCharges) || maxCharges < 0) fail(`maxCharges must be a non-negative integer, got ${maxCharges}`);
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

  /** Links available this hour: two different known zones and a finite capacity ≥ 0 (a closed link is best left out). */
  setLinks(links: readonly LinkSpec[]): void {
    links.forEach((l, i) => {
      if (!this.isZone(l.from)) fail(`link ${i}: unknown zone ${l.from}`);
      if (!this.isZone(l.to)) fail(`link ${i}: unknown zone ${l.to}`);
      if (l.from === l.to) fail(`link ${i} joins zone ${l.from} to itself`);
      if (!(Number.isFinite(l.capacityMw) && l.capacityMw >= 0)) fail(`link ${i}: capacity must be finite and non-negative, got ${l.capacityMw}`);
    });
    this.links = links;
    if (this.flow.length !== links.length) {
      this.flow = new Float64Array(links.length);
      this.linkFixed = new Uint8Array(links.length);
      this.congested = new Uint8Array(links.length);
      this.inTree = new Uint8Array(links.length);
      this.releases = new Uint8Array(links.length);
      this.fixedDir = new Int8Array(links.length);
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

  private isZone(z: number): boolean {
    return Number.isInteger(z) && z >= 0 && z < this.nZones;
  }

  private checkZone(zone: number, what: string): void {
    if (!this.isZone(zone)) fail(`${what}: unknown zone ${zone}`);
  }

  /** Add a supply block. Bids are clamped into the zone's [floor, cap]; blocks of (nearly) zero size are skipped. */
  addBlock(zone: number, tech: number, tranche: Tranche, bid: number, mw: number): void {
    this.checkZone(zone, 'addBlock');
    if (!Number.isFinite(bid)) fail(`addBlock: bid must be finite, got ${bid} (zone ${zone}, tech ${tech})`);
    if (!(Number.isFinite(mw) && mw >= -EPS_MW)) fail(`addBlock: size must be finite and non-negative, got ${mw} MW (zone ${zone}, tech ${tech})`);
    if (!(mw > EPS_MW)) return;
    if (this.nBlocks >= this.maxBlocks) fail(`too many supply blocks (more than ${this.maxBlocks}); size the engine for the inputs`);
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
    this.checkZone(zone, 'addCharge');
    if (!Number.isFinite(wtp)) fail(`addCharge: willingness to pay must be finite, got ${wtp} (zone ${zone}, tech ${tech})`);
    if (!(Number.isFinite(mw) && mw >= -EPS_MW)) fail(`addCharge: size must be finite and non-negative, got ${mw} MW (zone ${zone}, tech ${tech})`);
    if (!(mw > EPS_MW)) return;
    if (this.nCharges >= this.maxCharges) fail(`too many charge blocks (more than ${this.maxCharges}); size the engine for the inputs`);
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

  private checkZoneInputs(): void {
    for (let z = 0; z < this.nZones; z++) {
      const d = this.demand[z] ?? NaN;
      const fl = this.floor[z] ?? NaN;
      const cp = this.cap[z] ?? NaN;
      const rf = this.reserveFraction[z] ?? NaN;
      if (!(Number.isFinite(d) && d >= 0)) fail(`zone ${z}: demand must be finite and non-negative, got ${d}`);
      if (!(Number.isFinite(fl) && Number.isFinite(cp) && fl <= cp)) fail(`zone ${z}: floor and cap must be finite with floor ≤ cap, got ${fl} and ${cp}`);
      if (!(Number.isFinite(rf) && rf >= 0 && rf <= 1)) fail(`zone ${z}: reserveFraction must be within 0..1, got ${rf}`);
    }
  }

  /**
   * Fixed links carry their full capacity in their direction; recomputed on
   * every pass, so a scale-down in one pass does not outlive the grouping
   * that caused it.
   */
  private applyFixedFlows(): void {
    this.fixedExport.fill(0);
    for (let l = 0; l < this.links.length; l++) {
      if (!this.linkFixed[l]) continue;
      const link = this.links[l];
      if (link === undefined) continue;
      const f = (this.fixedDir[l] ?? 1) * link.capacityMw;
      this.flow[l] = f;
      this.fixedExport[link.from] = (this.fixedExport[link.from] ?? 0) + f;
      this.fixedExport[link.to] = (this.fixedExport[link.to] ?? 0) - f;
    }
  }

  /**
   * Scarcity per zone, once per hour and before any clearing, so a coupled
   * group and its split parts see the same lifted bids. A zone's spare
   * capacity is its own offers minus its own demand, plus what each of its
   * links could bring in from the neighbour's own spare (up to the link's
   * capacity). s rises from 0 at the reserve margin (reserveFraction × own
   * demand) to 1 when no spare is left, and every bid in the zone is lifted
   * to bid + (cap − bid) × s³.
   */
  private computeScarcity(): void {
    const nz = this.nZones;
    const own = this.genSum;
    own.fill(0);
    for (let i = 0; i < this.nBlocks; i++) {
      const z = this.bZone[i] ?? 0;
      own[z] = (own[z] ?? 0) + (this.bMw[i] ?? 0);
    }
    for (let z = 0; z < nz; z++) own[z] = (own[z] ?? 0) - (this.demand[z] ?? 0);
    const spare = this.chargeSum;
    for (let z = 0; z < nz; z++) spare[z] = own[z] ?? 0;
    for (const l of this.links) {
      spare[l.from] = (spare[l.from] ?? 0) + Math.min(l.capacityMw, Math.max(0, own[l.to] ?? 0));
      spare[l.to] = (spare[l.to] ?? 0) + Math.min(l.capacityMw, Math.max(0, own[l.from] ?? 0));
    }
    for (let z = 0; z < nz; z++) {
      const reserve = (this.reserveFraction[z] ?? 0) * (this.demand[z] ?? 0);
      const sp = spare[z] ?? 0;
      let s: number;
      if (reserve > 0) s = Math.min(1, Math.max(0, (reserve - sp) / reserve));
      else s = sp < 0 ? 1 : 0;
      this.scarcity[z] = s;
    }
    const eff = this.bEff;
    for (let i = 0; i < this.nBlocks; i++) {
      const z = this.bZone[i] ?? 0;
      const s = this.scarcity[z] ?? 0;
      const bid = this.bBid[i] ?? 0;
      eff[i] = bid + ((this.cap[z] ?? bid) - bid) * s * s * s;
    }
  }

  /** Clear the hour: merged merit orders per coupled group, flows, congestion splitting. */
  clear(): void {
    this.checkZoneInputs();
    this.computeScarcity();
    const nz = this.nZones;
    const nl = this.links.length;
    this.fixedExport.fill(0);
    this.flow.fill(0);
    this.linkFixed.fill(0);
    this.congested.fill(0);
    this.releases.fill(0);
    this.fixedDir.fill(0);
    this.wrongWayLinks = 0;

    // A link is fixed at most MAX_RELEASES + 1 times and released at most
    // MAX_RELEASES times, so the loop ends; every pass ends with a fresh
    // clearing, so the final state is a clearing consistent with the flows.
    for (;;) {
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

      this.applyFixedFlows();
      this.scaleDownUnabsorbableImports();

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

      // Most violated free link: fix it at its full capacity, in the direction
      // it wanted to flow. The importer's group absorbs it (meeting demand,
      // charging storage or passing it on); a group that cannot is scaled
      // down above.
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
        this.fixedDir[worst] = (this.flow[worst] ?? 0) >= 0 ? 1 : -1;
        this.linkFixed[worst] = 1;
        continue;
      }

      // Wrong-way repair: release the fixed link with the largest price
      // mismatch (exporter dearer than importer) and clear again.
      let release = -1;
      let releaseGap = EPS_PRICE;
      for (let l = 0; l < nl; l++) {
        if (!this.linkFixed[l] || (this.releases[l] ?? 0) >= MAX_RELEASES) continue;
        const link = this.links[l];
        if (link === undefined) continue;
        const f = this.flow[l] ?? 0;
        if (Math.abs(f) <= EPS_MW) continue;
        const exporter = f > 0 ? link.from : link.to;
        const importer = f > 0 ? link.to : link.from;
        const gap = (this.price[exporter] ?? 0) - (this.price[importer] ?? 0);
        if (gap > releaseGap) {
          releaseGap = gap;
          release = l;
        }
      }
      if (release < 0) break;
      this.linkFixed[release] = 0;
      this.releases[release] = (this.releases[release] ?? 0) + 1;
    }

    // Net positions include every link now; diagnostics on fixed links.
    this.netPosition.fill(0);
    for (let l = 0; l < nl; l++) {
      const link = this.links[l];
      if (link === undefined) continue;
      const f = this.flow[l] ?? 0;
      this.netPosition[link.from] = (this.netPosition[link.from] ?? 0) + f;
      this.netPosition[link.to] = (this.netPosition[link.to] ?? 0) - f;
      if (!this.linkFixed[l]) continue;
      const pFrom = this.price[link.from] ?? 0;
      const pTo = this.price[link.to] ?? 0;
      if (Math.abs(pFrom - pTo) > EPS_PRICE) this.congested[l] = 1;
      if (Math.abs(f) > EPS_MW) {
        const pExp = f > 0 ? pFrom : pTo;
        const pImp = f > 0 ? pTo : pFrom;
        if (pExp > pImp + EPS_PRICE) this.wrongWayLinks++;
      }
    }
  }

  /**
   * A group whose fixed imports exceed everything it can take (its firm
   * demand, its fixed exports and every storage charge it could buy) cannot
   * absorb them: scale those imports down (the importer, not the link, is the
   * limit). Transit and storage charging count, so a link feeding a zone that
   * passes power on or charges storage keeps its full capacity.
   */
  private scaleDownUnabsorbableImports(): void {
    const nz = this.nZones;
    const nl = this.links.length;
    for (let r = 0; r < nz; r++) {
      if (this.groupOf[r] !== r) continue;
      let dG = 0;
      let floorG = -Infinity;
      for (let z = 0; z < nz; z++) {
        if (this.groupOf[z] !== r) continue;
        dG += (this.demand[z] ?? 0) + (this.fixedExport[z] ?? 0);
        floorG = Math.max(floorG, this.floor[z] ?? -Infinity);
      }
      for (let i = 0; i < this.nCharges; i++) {
        if (this.groupOf[this.cZone[i] ?? 0] === r && (this.cWtp[i] ?? 0) >= floorG) dG += this.cMw[i] ?? 0;
      }
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
  }

  /** Merged merit-order clearing of one coupled group (identified by its root zone). */
  private clearGroup(root: number): void {
    const nz = this.nZones;
    const blocks = this.sortedBlocks;
    const charges = this.sortedCharges;
    blocks.length = 0;
    charges.length = 0;
    // Firm demand to clear: own demand plus fixed exports minus fixed imports.
    // It may be negative when fixed imports exceed the group's own demand;
    // storage charging then absorbs the rest (guaranteed by the scale-down).
    let dFirm = 0;
    let capG = Infinity;
    let floorG = -Infinity;
    for (let z = 0; z < nz; z++) {
      if (this.groupOf[z] !== root) continue;
      dFirm += (this.demand[z] ?? 0) + (this.fixedExport[z] ?? 0);
      capG = Math.min(capG, this.cap[z] ?? Infinity);
      floorG = Math.max(floorG, this.floor[z] ?? -Infinity);
    }
    let chargeMw = 0;
    for (let i = 0; i < this.nBlocks; i++) {
      if (this.groupOf[this.bZone[i] ?? 0] !== root) continue;
      blocks.push(i);
    }
    for (let i = 0; i < this.nCharges; i++) {
      if (this.groupOf[this.cZone[i] ?? 0] !== root) continue;
      this.cDisp[i] = 0;
      // A charge bidding below the group's floor never sees its price.
      if ((this.cWtp[i] ?? 0) < floorG) continue;
      charges.push(i);
      chargeMw += this.cMw[i] ?? 0;
    }
    // Safety: never ask charges to absorb more than they can (the scale-down prevents it).
    dFirm = Math.max(-chargeMw, dFirm);

    const eff = this.bEff;
    blocks.sort((a, b) => (eff[a] ?? 0) - (eff[b] ?? 0) || a - b);
    const wtp = this.cWtp;
    charges.sort((a, b) => (wtp[b] ?? 0) - (wtp[a] ?? 0) || a - b);

    const nb = blocks.length;
    const nc = charges.length;
    for (const i of blocks) this.bDisp[i] = 0;

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
      unservedG = Math.max(0, dFirm - supplied);
      // Short of supply: the cap. Nothing short (no offers and no demand): no
      // price forms; report 0 inside the group's limits rather than the cap.
      priceG = unservedG > EPS_MW ? capG : Math.min(capG, Math.max(floorG, 0));
      if (unservedG <= EPS_MW) unservedG = 0;
    }

    let positiveDemand = 0;
    for (let z = 0; z < nz; z++) {
      if (this.groupOf[z] === root) positiveDemand += Math.max(0, (this.demand[z] ?? 0) + (this.fixedExport[z] ?? 0));
    }
    // One price for the group, inside the tightest floor and cap of its zones.
    priceG = Math.min(capG, Math.max(floorG, priceG));
    for (let z = 0; z < nz; z++) {
      if (this.groupOf[z] !== root) continue;
      this.price[z] = priceG;
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
