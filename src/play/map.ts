/**
 * The stylised map of Western Denmark (Jutland and Funen): a hand-drawn
 * outline from approximate coordinates (original to this repo, see
 * docs/licences.md), the sixteen sites and the farm. Diagrammatic on
 * purpose (design §10: discrete sites on a stylised map).
 */
import { AREAS, FARM, SITES, siteRoomMw, type GameState, type Site } from '../game';
import { svg } from './dom';
import { mw } from './format';

const LON0 = 7.2;
const LAT0 = 57.85;
const KX = 55.6; // 100 × cos(56°): keeps the map's proportions at Denmark's latitude
const KY = 100;
const WIDTH = (11.4 - LON0) * KX;
const HEIGHT = (LAT0 - 54.62) * KY;

export function project(lon: number, lat: number): [number, number] {
  return [(lon - LON0) * KX, (LAT0 - lat) * KY];
}

const JUTLAND: readonly (readonly [number, number])[] = [
  [10.6, 57.74], [10.4, 57.64], [10.0, 57.59], [9.6, 57.45], [9.35, 57.17], [8.95, 57.15], [8.6, 57.12], [8.4, 56.95],
  [8.22, 56.72], [8.13, 56.4], [8.12, 56.1], [8.1, 55.8], [8.08, 55.56], [8.4, 55.45], [8.6, 55.3], [8.6, 54.97],
  [8.66, 54.91], [9.1, 54.86], [9.42, 54.83], [9.65, 54.9], [9.98, 54.93], [9.95, 55.06], [9.62, 55.05], [9.45, 55.06],
  [9.55, 55.25], [9.5, 55.45], [9.75, 55.55], [9.65, 55.7], [10.0, 55.75], [9.9, 55.85], [10.25, 55.95], [10.22, 56.15],
  [10.5, 56.25], [10.7, 56.2], [10.95, 56.45], [10.75, 56.55], [10.35, 56.6], [10.35, 56.75], [10.3, 57.0], [10.5, 57.25],
  [10.55, 57.45],
];
const FUNEN: readonly (readonly [number, number])[] = [
  [9.73, 55.55], [10.1, 55.58], [10.4, 55.6], [10.6, 55.62], [10.8, 55.35], [10.75, 55.1], [10.6, 55.05], [10.25, 55.08],
  [9.95, 55.2], [9.85, 55.35],
];
const LIMFJORD: readonly (readonly [number, number])[] = [
  [8.22, 56.7], [8.6, 56.8], [9.0, 56.85], [9.2, 57.0], [9.6, 57.0], [9.92, 57.05], [10.3, 57.0],
];

function path(points: readonly (readonly [number, number])[], close: boolean): string {
  return points.map(([lon, lat], i) => `${i === 0 ? 'M' : 'L'}${project(lon, lat).map((v) => v.toFixed(1)).join(' ')}`).join(' ') + (close ? ' Z' : '');
}

/** Where each site's name sits, so names in crowded central Jutland do not collide: left, right or below. */
const LABEL_SIDE: Readonly<Record<string, 'l' | 'r' | 'b'>> = {
  thy: 'l',
  lemvig: 'l',
  ringkobing: 'l',
  esbjerg: 'l',
  tonder: 'l',
  skive: 'l',
  herning: 'l',
  silkeborg: 'b',
};

export type SiteLook = 'free' | 'yours' | 'shared' | 'taken' | 'warned';

export function siteLook(state: GameState, site: Site): SiteLook {
  const ss = state.sites.find((x) => x.id === site.id);
  const mine = state.assets.some((a) => a.endedAt === null && a.siteId === site.id);
  const room = siteRoomMw(state, site.id);
  if (mine) return room > 0 ? 'yours' : 'shared';
  if (room <= 0) return 'taken';
  if (ss !== undefined && ss.announced && ss.claimAt !== null && state.t < ss.claimAt) return 'warned';
  return 'free';
}

export interface MapView {
  readonly element: SVGSVGElement;
  /** `selected`: a site id, 'farm', or null for nothing. */
  update(state: GameState, selected: string | null): void;
}

/** The farm (its roofs) is selected as 'farm'; a site by its id. */
export const FARM_ID = 'farm';

export function createMap(select: (id: string) => void): MapView {
  const root = svg('svg', { viewBox: `0 0 ${WIDTH.toFixed(0)} ${HEIGHT.toFixed(0)}`, class: 'map', role: 'group', 'aria-label': 'Map of Western Denmark with the sites' });
  root.append(
    svg('rect', { x: 0, y: 0, width: WIDTH.toFixed(0), height: HEIGHT.toFixed(0), class: 'sea' }),
    svg('path', { d: path(JUTLAND, true), class: 'land' }),
    svg('path', { d: path(FUNEN, true), class: 'land' }),
    svg('path', { d: path(LIMFJORD, false), class: 'fjord' }),
  );
  const label = (x: number, y: number, text: string, cls: string): SVGTextElement => {
    const t = svg('text', { x: x.toFixed(1), y: y.toFixed(1), class: cls });
    t.textContent = text;
    return t;
  };
  const [gx, gy] = project(9.2, 54.72);
  root.append(label(gx, gy, 'GERMANY', 'map-region'));
  const [nx, ny] = project(7.85, 57.7);
  root.append(label(nx, ny, 'to Norway ↑', 'map-note'));
  const [kx, ky] = project(7.3, 56.3);
  root.append(label(kx, ky, 'North Sea', 'map-sea'));
  const [fx, fy] = project(10.05, 55.3);
  root.append(label(fx, fy, 'Funen', 'map-note'));

  const markers = new Map<string, { group: SVGGElement; dot: SVGCircleElement; sub: SVGTextElement }>();
  const addSite = (site: Site): void => {
    const [x, y] = project(site.lon, site.lat);
    const r = 2.2 + Math.sqrt(site.maxMw) * 0.55;
    const group = svg('g', { class: 'site', tabindex: 0, role: 'button', 'aria-label': `${site.name}, ${AREAS[site.area].name}` });
    const hit = svg('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 11, class: 'hit' });
    const dot = svg('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1), class: 'dot' });
    const side = LABEL_SIDE[site.id] ?? 'r';
    const lx = side === 'l' ? x - r - 2.5 : side === 'b' ? x : x + r + 2.5;
    const ly = side === 'b' ? y + r + 6.5 : y + 1.6;
    const anchor = side === 'l' ? 'end' : side === 'b' ? 'middle' : 'start';
    const name = label(lx, ly, site.name, 'site-name');
    const sub = label(lx, ly + 6.4, '', 'site-sub');
    name.setAttribute('text-anchor', anchor);
    sub.setAttribute('text-anchor', anchor);
    group.append(hit, dot, name, sub);
    const go = (): void => select(site.id);
    group.addEventListener('click', go);
    group.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go();
      }
    });
    markers.set(site.id, { group, dot, sub });
    root.append(group);
  };
  for (const s of SITES) addSite(s);

  const [farmX, farmY] = project(FARM.lon, FARM.lat);
  const farm = svg('g', { class: 'farm', tabindex: 0, role: 'button', 'aria-label': 'Your farm: rooftop panels' });
  const farmName = label(farmX - 6.5, farmY + 1, 'Your farm', 'site-name farm-name');
  farmName.setAttribute('text-anchor', 'end');
  farm.append(
    svg('circle', { cx: farmX.toFixed(1), cy: (farmY - 2).toFixed(1), r: 11, class: 'hit' }),
    svg('path', { d: `M${farmX - 4.5} ${farmY + 1} L${farmX - 4.5} ${farmY - 3} L${farmX} ${farmY - 7} L${farmX + 4.5} ${farmY - 3} L${farmX + 4.5} ${farmY + 1} Z`, class: 'farm-shape' }),
    farmName,
  );
  farm.addEventListener('click', () => select(FARM_ID));
  farm.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(FARM_ID);
    }
  });
  root.append(farm);

  return {
    element: root,
    update(state, selected) {
      for (const site of SITES) {
        const m = markers.get(site.id);
        if (m === undefined) continue;
        const look = siteLook(state, site);
        m.group.setAttribute('class', `site ${look}${selected === site.id ? ' selected' : ''}`);
        let mine = 0;
        for (const a of state.assets) if (a.endedAt === null && a.siteId === site.id) mine += a.mw;
        const text =
          look === 'taken'
            ? 'taken'
            : look === 'warned'
              ? 'being claimed'
              : mine > 0
                ? `yours ${mw(mine)}`
                : `wind ×${site.wind.toFixed(2)}`;
        if (m.sub.textContent !== text) m.sub.textContent = text;
      }
      farm.setAttribute('class', `farm${selected === FARM_ID ? ' selected' : ''}`);
    },
  };
}
