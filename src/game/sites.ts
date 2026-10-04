/**
 * The sixteen sites in five areas (design §4.2). Every value is a tuning
 * placeholder until the Global Wind Atlas layer replaces it. Positions are
 * approximate longitude and latitude, for the stylised map.
 */
import { interp, type Keyframes } from '../sim';

export type AreaId = 'west' | 'north' | 'central' | 'east' | 'south';

export interface Area {
  readonly id: AreaId;
  readonly name: string;
  /** MW of the player's assets the area's grid can take, by year. [tuning] */
  readonly gridRoomMw: Keyframes;
  /** Land lease, € per MW a year. [tuning] */
  readonly landPerMw: number;
  readonly permitMonths: number;
}

export const AREAS: Readonly<Record<AreaId, Area>> = {
  west: { id: 'west', name: 'West coast', gridRoomMw: [[1995, 80]], landPerMw: 3000, permitMonths: 12 },
  north: { id: 'north', name: 'North', gridRoomMw: [[1995, 100]], landPerMw: 4500, permitMonths: 8 },
  // Limited until the 2010 grid upgrade (§4.2).
  central: { id: 'central', name: 'Central heath', gridRoomMw: [[2009, 25], [2010, 120]], landPerMw: 3000, permitMonths: 4 },
  east: { id: 'east', name: 'East', gridRoomMw: [[1995, 150]], landPerMw: 7000, permitMonths: 8 },
  south: { id: 'south', name: 'South', gridRoomMw: [[1995, 150]], landPerMw: 4500, permitMonths: 8 },
};

export const AREA_IDS: readonly AreaId[] = ['west', 'north', 'central', 'east', 'south'];

export interface Site {
  readonly id: string;
  readonly name: string;
  readonly area: AreaId;
  readonly lon: number;
  readonly lat: number;
  /** Wind and sun relative to the zone average. [tuning] */
  readonly wind: number;
  readonly sun: number;
  /** Most MW the site holds. [tuning] */
  readonly maxMw: number;
  /** Years in which history (a co-op, a developer) may claim the site's free room; null = never. [tuning] */
  readonly claimWindow: readonly [number, number] | null;
}

const site = (
  id: string,
  name: string,
  area: AreaId,
  lon: number,
  lat: number,
  wind: number,
  sun: number,
  maxMw: number,
  claimWindow: readonly [number, number] | null,
): Site => ({ id, name, area, lon, lat, wind, sun, maxMw, claimWindow });

export const SITES: readonly Site[] = [
  site('thy', 'Thy', 'west', 8.62, 56.98, 1.3, 1.0, 40, [1996, 1999]),
  site('lemvig', 'Lemvig', 'west', 8.3, 56.55, 1.27, 1.0, 30, [1997, 2001]),
  site('ringkobing', 'Ringkøbing', 'west', 8.26, 56.08, 1.23, 1.0, 40, [1999, 2003]),
  site('esbjerg', 'Esbjerg', 'west', 8.52, 55.55, 1.2, 1.0, 30, [2002, 2008]),
  site('hirtshals', 'Hirtshals', 'north', 9.96, 57.48, 1.15, 0.97, 25, [1998, 2003]),
  site('aalborg', 'Aalborg', 'north', 9.92, 57.03, 1.08, 0.97, 30, null),
  site('himmerland', 'Himmerland', 'north', 9.62, 56.8, 1.07, 0.97, 30, [2003, 2008]),
  site('herning', 'Herning', 'central', 8.97, 56.14, 1.0, 1.0, 30, [2010, 2013]),
  site('viborg', 'Viborg', 'central', 9.4, 56.45, 0.98, 1.0, 25, null),
  site('skive', 'Skive', 'central', 9.03, 56.57, 1.03, 1.0, 25, [2011, 2015]),
  site('silkeborg', 'Silkeborg', 'central', 9.55, 56.17, 0.97, 1.0, 20, null),
  site('djursland', 'Djursland', 'east', 10.65, 56.4, 0.9, 1.02, 25, [2005, 2012]),
  site('aarhus', 'Aarhus', 'east', 10.12, 56.12, 0.84, 1.02, 15, null),
  site('vejle', 'Vejle', 'east', 9.5, 55.72, 0.82, 1.02, 20, null),
  site('tonder', 'Tønder', 'south', 8.87, 54.95, 1.08, 1.05, 30, [2000, 2006]),
  site('aabenraa', 'Aabenraa', 'south', 9.38, 55.05, 1.02, 1.05, 25, null),
];

/** The farm, where the game starts: its roofs hold the rooftop panels. */
export const FARM = { name: 'The farm', lon: 9.25, lat: 56.32, sun: 1.0 } as const;

export function siteById(id: string): Site | undefined {
  return SITES.find((s) => s.id === id);
}

export function gridRoomMw(area: AreaId, year: number): number {
  return interp(AREAS[area].gridRoomMw, year);
}
