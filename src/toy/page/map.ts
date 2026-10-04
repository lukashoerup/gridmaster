/**
 * The region map: plain SVG, redrawn a few times a second. Hubs are
 * coloured by their balance (red hungry, green balanced, blue flooded);
 * links are drawn by capacity and turn orange when they run full; spots are
 * fogged until scouted or built on; the player's plants are drawn on their
 * spots with their connection line to the hub.
 */
import { GRID, HUBS, hubById, hubIndex, type HubsGame } from '../rules';
import { svg } from './dom';

export type Selection = { kind: 'hub'; id: string } | { kind: 'spot'; id: string } | null;

const COAST: readonly (readonly [number, number])[] = [
  [5, -6], [6, 4], [3, 12], [4, 22], [9, 30], [12, 40], [8, 50], [3, 58], [2, 66], [5, 74], [9, 82], [10, 92], [13, 106],
];

export function createMap(onSelect: (s: Selection) => void): { el: SVGSVGElement; draw: (game: HubsGame, sel: Selection) => void } {
  const el = svg('svg', { viewBox: '-6 -8 132 116', class: 'map', role: 'img', 'aria-label': 'Map of the region' });
  // Pointer-down, not click: the map is redrawn while the clock runs, and a
  // click whose press and release land on different redraws never fires.
  el.addEventListener('pointerdown', (ev) => {
    const t = (ev.target as Element).closest('[data-sel]');
    if (t === null) {
      onSelect(null);
      return;
    }
    const [kind, id] = (t.getAttribute('data-sel') ?? '').split(':');
    if ((kind === 'hub' || kind === 'spot') && id !== undefined) onSelect({ kind, id });
  });
  let lastKey = '';
  const draw = (game: HubsGame, sel: Selection): void => {
    const key = mapKey(game, sel);
    if (key === lastKey) return;
    lastKey = key;
    const nodes: SVGElement[] = [];
    nodes.push(svg('rect', { x: -6, y: -8, width: 132, height: 116, class: 'sea' }));
    const land = `M${COAST.map(([x, y]) => `${x},${y}`).join(' L')} L126,106 L126,-6 Z`;
    nodes.push(svg('path', { d: land, class: 'land' }));
    nodes.push(svg('text', { x: -3, y: 100, class: 'sea-label' }, document.createTextNode('North Sea')));

    // Links.
    HUBS.forEach((hub, i) => {
      const to = hub.parent === 'grid' ? GRID : hubById(hub.parent);
      const st = game.hubStatus(i);
      const cls = st.linkUse > 0.85 ? 'full' : st.linkUse > 0.6 ? 'busy' : '';
      nodes.push(svg('line', { x1: hub.x, y1: hub.y, x2: to.x, y2: to.y, class: `link ${cls}`, 'stroke-width': (0.5 + hub.linkMw / 25).toFixed(2) }));
      const mx = (hub.x + to.x) / 2;
      const my = (hub.y + to.y) / 2;
      nodes.push(svg('text', { x: mx, y: my + 3, class: 'link-label', 'text-anchor': 'middle' }, document.createTextNode(`${hub.linkMw} MW`)));
    });

    // Connection lines of the player's plants.
    const drawn = new Set<string>();
    for (const p of game.plants) {
      if (p.removedAt !== null) continue;
      const key = `${p.spot}>${p.hub}`;
      if (drawn.has(key)) continue;
      drawn.add(key);
      const s = game.spot(p.spot);
      const hub = hubById(p.hub);
      const building = game.plants.every((q) => q.spot !== p.spot || q.hub !== p.hub || q.removedAt !== null || q.readyAt > game.now);
      nodes.push(svg('line', { x1: s.x, y1: s.y, x2: hub.x, y2: hub.y, class: `conn ${building ? 'building' : ''}` }));
    }

    // The national grid.
    nodes.push(svg('rect', { x: GRID.x - 4, y: GRID.y - 4, width: 8, height: 8, class: 'gridnode' }));
    nodes.push(svg('text', { x: GRID.x, y: GRID.y + 9, class: 'hub-label', 'text-anchor': 'middle' }, document.createTextNode('National')));
    nodes.push(svg('text', { x: GRID.x, y: GRID.y + 14, class: 'hub-sub', 'text-anchor': 'middle' }, document.createTextNode(`€${game.nationalMean().toFixed(0)}`)));

    // Spots.
    for (const s of game.spots) {
      const revealed = game.isRevealed(s.id);
      const scouting = game.scouting.has(s.id);
      const mine = game.plants.filter((p) => p.spot === s.id && p.removedAt === null);
      const wind = mine.filter((p) => p.kind === 'wind').reduce((a, p) => a + p.mw, 0);
      const sun = mine.filter((p) => p.kind === 'solar').reduce((a, p) => a + p.mw, 0);
      const selected = sel?.kind === 'spot' && sel.id === s.id;
      const g = svg('g', { 'data-sel': `spot:${s.id}`, class: `spot ${revealed ? 'revealed' : 'fogged'} ${selected ? 'selected' : ''}` });
      g.append(svg('circle', { cx: s.x, cy: s.y, r: 3.4, class: 'spot-dot' }));
      if (wind > 0) g.append(turbine(s.x - 1.2, s.y));
      if (sun > 0) g.append(svg('rect', { x: s.x + (wind > 0 ? 0.3 : -1.3), y: s.y - 1.1, width: 2.6, height: 2.2, class: 'panel' }));
      if (wind === 0 && sun === 0) g.append(svg('text', { x: s.x, y: s.y + 1.3, class: 'spot-q', 'text-anchor': 'middle' }, document.createTextNode(revealed ? '·' : scouting ? '…' : '?')));
      const sub = revealed ? `wind ${Math.round(s.windQ * 100)}% · sun ${Math.round(s.solarQ * 100)}%` : scouting ? 'scouting…' : 'unscouted';
      g.append(svg('text', { x: s.x, y: s.y + 6, class: 'spot-label', 'text-anchor': 'middle' }, document.createTextNode(s.name)));
      g.append(svg('text', { x: s.x, y: s.y + 9.5, class: 'spot-sub', 'text-anchor': 'middle' }, document.createTextNode(wind + sun > 0 ? `you: ${wind > 0 ? `${wind} MW wind` : ''}${wind > 0 && sun > 0 ? ', ' : ''}${sun > 0 ? `${sun} MW sun` : ''}` : sub)));
      nodes.push(g);
    }

    // Hubs.
    HUBS.forEach((hub, i) => {
      const st = game.hubStatus(i);
      const selected = sel?.kind === 'hub' && sel.id === hub.id;
      const g = svg('g', { 'data-sel': `hub:${hub.id}`, class: `hub ${st.colour} ${selected ? 'selected' : ''}` });
      if (selected) g.append(svg('circle', { cx: hub.x, cy: hub.y, r: 7.6, class: 'ring' }));
      g.append(svg('circle', { cx: hub.x, cy: hub.y, r: 5.4, class: 'hub-dot' }));
      const rel = Math.round((st.ratio - 1) * 100);
      g.append(svg('text', { x: hub.x, y: hub.y + 1.5, class: 'hub-pct', 'text-anchor': 'middle' }, document.createTextNode(`${rel > 0 ? '+' : ''}${rel}%`)));
      g.append(svg('text', { x: hub.x, y: hub.y - 7.5, class: 'hub-label', 'text-anchor': 'middle' }, document.createTextNode(hub.name)));
      const free = game.freeRoom(hub.id);
      const bat = st.batteries > 0 ? ` · ${st.batteries}🔋` : '';
      g.append(svg('text', { x: hub.x, y: hub.y + 10, class: 'hub-sub', 'text-anchor': 'middle' }, document.createTextNode(`room ${Math.floor(free)} MW${bat}`)));
      nodes.push(g);
    });
    el.replaceChildren(...nodes);
  };
  return { el, draw };
}

/** Everything the map shows, so it is redrawn only when something visible changed. */
function mapKey(game: HubsGame, sel: Selection): string {
  const hubs = HUBS.map((hub, i) => {
    const st = game.hubStatus(i);
    return `${st.colour}${Math.round((st.ratio - 1) * 100)}/${st.linkUse > 0.85 ? 2 : st.linkUse > 0.6 ? 1 : 0}/${Math.floor(game.freeRoom(hub.id))}/${st.batteries}`;
  }).join(',');
  const plants = game.plants.map((p) => `${p.id}${p.removedAt === null ? '' : 'x'}${p.readyAt > game.now ? 'b' : ''}`).join(',');
  return `${sel?.kind ?? ''}:${sel?.id ?? ''}|${hubs}|${plants}|${[...game.scouted].join(',')}|${[...game.scouting.keys()].join(',')}|${Math.round(game.nationalMean())}`;
}

function turbine(x: number, y: number): SVGElement {
  const g = svg('g', { class: 'turbine' });
  g.append(svg('line', { x1: x, y1: y - 0.3, x2: x, y2: y + 2, class: 'tower' }));
  for (const a of [0, 120, 240]) {
    const r = (a * Math.PI) / 180;
    g.append(svg('line', { x1: x, y1: y - 0.3, x2: x + 1.7 * Math.sin(r), y2: y - 0.3 - 1.7 * Math.cos(r), class: 'blade' }));
  }
  return g;
}

export function hubOfSelection(sel: Selection): number | null {
  return sel?.kind === 'hub' ? hubIndex(sel.id) : null;
}
