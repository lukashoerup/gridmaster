/**
 * The hub price rule, one hour at a time.
 *
 * > Your power earns your hub's price at the hour you make it, and the more
 * > power at your hub that hour, the lower that price.
 *
 * The hubs form a tree whose root is the national grid. Each hub's net
 * (generation − demand, plus whatever its children push through it) flows
 * over its link to its parent, up to the link's capacity. What does not fit
 * is **stuck**: a surplus that cannot leave (the hub is flooded, blue) or a
 * shortfall that cannot be imported (the hub is hungry, red).
 *
 * Prices then run from the root down. While a hub's link has room its price
 * is its parent's; a flooded hub falls toward the floor as its stuck surplus
 * grows, and a hungry hub rises above its parent's by up to a fixed premium
 * as its shortfall grows. The slopes are [tuning] (`PRICE`).
 */
import { HUBS, hubsLeavesFirst, type HubDef } from './region';
import { PRICE } from './tuning';

export const HUB_COUNT = HUBS.length;
const ORDER: readonly number[] = hubsLeavesFirst().map((h) => HUBS.indexOf(h));
const PARENT: readonly number[] = HUBS.map((h) => (h.parent === 'grid' ? -1 : HUBS.findIndex((p) => p.id === h.parent)));
/** Top-down order: the reverse of leaves-first. */
const TOP_DOWN: readonly number[] = [...ORDER].reverse();

export interface Cleared {
  readonly price: Float64Array;
  /** Positive: surplus stuck at the hub; negative: shortfall that could not be imported (MW). */
  readonly stuck: Float64Array;
  /** Flow over the hub's link toward its parent (MW, negative = importing). */
  readonly flow: Float64Array;
}

export function newCleared(): Cleared {
  return { price: new Float64Array(HUB_COUNT), stuck: new Float64Array(HUB_COUNT), flow: new Float64Array(HUB_COUNT) };
}

/** A hub's price from its parent's and what is stuck at it. */
export function hubPrice(hub: HubDef, parentPrice: number, stuck: number, floor: number): number {
  if (stuck > 0) {
    if (parentPrice <= floor) return parentPrice;
    const x = stuck / Math.max(5, hub.demandMw + hub.linkMw);
    return parentPrice + (floor - parentPrice) * Math.min(1, x / PRICE.floodSpan);
  }
  if (stuck < 0) {
    const x = -stuck / Math.max(5, hub.demandMw);
    return parentPrice + PRICE.hungryMax * Math.min(1, x / PRICE.hungrySpan);
  }
  return parentPrice;
}

/**
 * Clear one hour. `supply` and `demand` are MW per hub (in `HUBS` order);
 * supply already includes any battery discharge and demand any charging.
 */
export function clearHour(national: number, floor: number, supply: ArrayLike<number>, demand: ArrayLike<number>, out: Cleared): void {
  const net = new Float64Array(HUB_COUNT);
  for (let i = 0; i < HUB_COUNT; i++) net[i] = (supply[i] ?? 0) - (demand[i] ?? 0);
  for (const i of ORDER) {
    const hub = HUBS[i] as HubDef;
    const n = net[i] ?? 0;
    const f = Math.max(-hub.linkMw, Math.min(hub.linkMw, n));
    out.flow[i] = f;
    out.stuck[i] = Math.abs(n - f) < 1e-9 ? 0 : n - f;
    const p = PARENT[i] ?? -1;
    if (p >= 0) net[p] = (net[p] ?? 0) + f;
  }
  for (const i of TOP_DOWN) {
    const p = PARENT[i] ?? -1;
    const parentPrice = p >= 0 ? (out.price[p] ?? national) : national;
    out.price[i] = hubPrice(HUBS[i] as HubDef, parentPrice, out.stuck[i] ?? 0, floor);
  }
}

export function parentIndex(i: number): number {
  return PARENT[i] ?? -1;
}
