/**
 * The region: six grid hubs in a west-coast region, ten spots for wind and
 * sun, and the links between hubs and to the national grid. Names are
 * scenery (west Jutland towns); positions, sizes and qualities are
 * [tuning], hand-placed so the region has hungry hubs, a flood-prone coast
 * and a first choice between windy-and-far and calm-and-near.
 *
 * Coordinates are km on a 120 × 100 map, west at x = 0.
 */
import { rngFor } from './random';

export type DemandKind = 'town' | 'industry' | 'rural';

export interface HubDef {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly kind: DemandKind;
  /** Mean demand, MW. */
  readonly demandMw: number;
  /** Connection room for generation, MW (everyone's plants share it). */
  readonly roomMw: number;
  /** Where its link goes: another hub's id, or 'grid' (the national market). */
  readonly parent: string;
  /** The link's capacity, MW, in either direction. */
  readonly linkMw: number;
  /** "Everyone else's" wind at the hub in the reference year, MW; it grows with the national build-out. */
  readonly backgroundMw: number;
}

export interface SpotDef {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  /** How much can be built here, MW. */
  readonly sizeMw: number;
  /** The visible hint before scouting. */
  readonly hint: string;
  /** Typical qualities before the seed's jitter (capacity factor multipliers). */
  readonly wind: number;
  readonly solar: number;
}

export interface Spot extends SpotDef {
  /** The seed's actual qualities (revealed by scouting or building). */
  readonly windQ: number;
  readonly solarQ: number;
}

export const GRID = { id: 'grid', name: 'National grid', x: 116, y: 42 } as const;

export const HUBS: readonly HubDef[] = [
  { id: 'thy', name: 'Thyborøn', x: 12, y: 16, kind: 'rural', demandMw: 6, roomMw: 35, parent: 'lem', linkMw: 15, backgroundMw: 8 },
  { id: 'lem', name: 'Lemvig', x: 32, y: 27, kind: 'town', demandMw: 16, roomMw: 30, parent: 'str', linkMw: 25, backgroundMw: 6 },
  { id: 'str', name: 'Struer', x: 58, y: 18, kind: 'town', demandMw: 22, roomMw: 30, parent: 'grid', linkMw: 60, backgroundMw: 4 },
  { id: 'hol', name: 'Holstebro', x: 62, y: 46, kind: 'town', demandMw: 46, roomMw: 40, parent: 'grid', linkMw: 45, backgroundMw: 3 },
  { id: 'rkb', name: 'Ringkøbing', x: 20, y: 72, kind: 'rural', demandMw: 14, roomMw: 40, parent: 'her', linkMw: 18, backgroundMw: 8 },
  { id: 'her', name: 'Herning', x: 88, y: 72, kind: 'industry', demandMw: 52, roomMw: 40, parent: 'grid', linkMw: 50, backgroundMw: 2 },
];

export const SPOTS: readonly SpotDef[] = [
  { id: 'harb', name: 'Harboøre dunes', x: 4, y: 30, sizeMw: 30, hint: 'coast, open to the west', wind: 1.35, solar: 0.95 },
  { id: 'agg', name: 'Agger tange', x: 27, y: 7, sizeMw: 20, hint: 'coast, a narrow spit', wind: 1.4, solar: 0.9 },
  { id: 'bov', name: 'Bovbjerg cliff', x: 14, y: 46, sizeMw: 25, hint: 'coast, a cliff top', wind: 1.3, solar: 0.95 },
  { id: 'hum', name: 'Humlum heath', x: 41, y: 5, sizeMw: 25, hint: 'fjord shore', wind: 1.1, solar: 1.0 },
  { id: 'vin', name: 'Vinderup fields', x: 44, y: 37, sizeMw: 30, hint: 'inland farmland', wind: 0.95, solar: 1.1 },
  { id: 'tvis', name: 'Tvis moor', x: 80, y: 40, sizeMw: 30, hint: 'inland moor', wind: 0.9, solar: 1.15 },
  { id: 'hvide', name: 'Hvide Sande', x: 5, y: 62, sizeMw: 35, hint: 'coast, between sea and fjord', wind: 1.4, solar: 1.0 },
  { id: 'nor', name: 'Nørre Omme', x: 46, y: 85, sizeMw: 30, hint: 'inland heath', wind: 1.0, solar: 1.15 },
  { id: 'sun', name: 'Sunds lakes', x: 106, y: 58, sizeMw: 20, hint: 'inland, sheltered', wind: 0.8, solar: 1.2 },
  { id: 'ikast', name: 'Ikast heath', x: 104, y: 88, sizeMw: 25, hint: 'inland heath', wind: 0.85, solar: 1.2 },
];

/** The seed's spots: each typical quality jittered by up to ±0.15 [tuning], so scouting matters. */
export function spotsFor(seed: number): Spot[] {
  const rng = rngFor(seed, 'toy-spots');
  return SPOTS.map((s) => {
    const jw = rng.uniform(-0.15, 0.15);
    const js = rng.uniform(-0.1, 0.1);
    return { ...s, windQ: round2(s.wind + jw), solarQ: round2(s.solar + js) };
  });
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function distanceKm(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y));
}

export function hubById(id: string): HubDef {
  const h = HUBS.find((hh) => hh.id === id);
  if (h === undefined) throw new Error(`no hub ${id}`);
  return h;
}

/** Hubs ordered so that every hub comes before its parent (leaves first). */
export function hubsLeavesFirst(): HubDef[] {
  const depth = (h: HubDef): number => (h.parent === 'grid' ? 0 : 1 + depth(hubById(h.parent)));
  return [...HUBS].sort((a, b) => depth(b) - depth(a));
}
