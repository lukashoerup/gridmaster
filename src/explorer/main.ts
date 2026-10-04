/**
 * The explorer page: controls, charts and plain-language captions. Runs the
 * simulation in a Web Worker (or inline where workers are unavailable).
 */
import { BarChart, CustomChart, LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { labelForHour, type ZoneStats } from '../sim';
import { annualOption, cannibalOption, captureOption, durationOption, ladderOption, weekOption, type SeriesByYear } from './charts';
import { FIRST_YEAR, LAST_YEAR, handle, zoneIds, zoneName, type CannibalPoint, type Request, type Response, type ZoneYearPayload } from './protocol';
import './style.css';

echarts.use([LineChart, BarChart, CustomChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, CanvasRenderer]);

// ---------------------------------------------------------------------------
// Simulation client: worker with an inline fallback.

type Listener = (r: Response) => void;

interface SimClient {
  send(req: Request): void;
  onMessage(listener: Listener): void;
}

function makeClient(): SimClient {
  const listeners: Listener[] = [];
  const dispatch = (r: Response): void => {
    for (const l of listeners) l(r);
  };
  if (typeof Worker !== 'undefined') {
    try {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<Response>) => dispatch(e.data);
      return { send: (req) => worker.postMessage(req), onMessage: (l) => listeners.push(l) };
    } catch {
      // fall through to inline
    }
  }
  return {
    send: (req) => {
      setTimeout(() => handle(req, dispatch), 0);
    },
    onMessage: (l) => listeners.push(l),
  };
}

// ---------------------------------------------------------------------------
// State

interface State {
  zone: string;
  year: number;
  seed: number;
  week: number;
  hourInWeek: number;
  extraGw: number;
}

const MAX_GW: Readonly<Record<string, number>> = { DK1: 10, DE: 100, NO: 20, ES: 60 };

function readHash(): Partial<State> {
  const out: Partial<State> = {};
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const zone = params.get('zone');
  if (zone !== null && zoneIds().includes(zone)) out.zone = zone;
  const num = (key: string, lo: number, hi: number): number | undefined => {
    const v = Number(params.get(key));
    return params.has(key) && Number.isFinite(v) && v >= lo && v <= hi ? v : undefined;
  };
  const year = num('year', FIRST_YEAR, LAST_YEAR);
  if (year !== undefined) out.year = Math.round(year);
  const seed = num('seed', 0, 4294967295);
  if (seed !== undefined) out.seed = Math.round(seed);
  const week = num('week', 0, 52);
  if (week !== undefined) out.week = Math.round(week);
  const hour = num('hour', 0, 167);
  if (hour !== undefined) out.hourInWeek = Math.round(hour);
  const gw = num('solar', 0, 200);
  if (gw !== undefined) out.extraGw = gw;
  return out;
}

function writeHash(s: State): void {
  const params = new URLSearchParams({
    zone: s.zone,
    year: String(s.year),
    seed: String(s.seed),
    week: String(s.week),
    hour: String(s.hourInWeek),
    solar: String(s.extraGw),
  });
  history.replaceState(null, '', `#${params.toString()}`);
}

const state: State = { zone: 'DK1', year: 2024, seed: 42, week: 26, hourInWeek: 60, extraGw: 0, ...readHash() };
if (state.extraGw > (MAX_GW[state.zone] ?? 100)) state.extraGw = MAX_GW[state.zone] ?? 100;

// ---------------------------------------------------------------------------
// DOM helpers

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, children: (Node | string)[] = []): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (node === null) throw new Error(`missing #${id}`);
  return node as T;
}

function fmt(n: number | null | undefined, digits = 0): string {
  return n === null || n === undefined || !Number.isFinite(n) ? '–' : n.toFixed(digits);
}

// ---------------------------------------------------------------------------
// Page

const app = byId<HTMLDivElement>('app');

const zoneSelect = el('select', { id: 'zone' });
for (const z of zoneIds()) zoneSelect.append(el('option', { value: z, text: `${zoneName(z)} (${z})` }));
zoneSelect.value = state.zone;

const yearSelect = el('select', { id: 'year' });
for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) yearSelect.append(el('option', { value: String(y), text: String(y) }));
yearSelect.value = String(state.year);

const seedInput = el('input', { id: 'seed', type: 'number', min: '0', max: '4294967295', step: '1', value: String(state.seed) });
const seedButton = el('button', { type: 'button', text: 'New seed' });

const weekInput = el('input', { id: 'week', type: 'range', min: '0', max: '52', step: '1', value: String(state.week) });
const weekLabel = el('span', { class: 'value' });
const hourInput = el('input', { id: 'hour', type: 'range', min: '0', max: '167', step: '1', value: String(state.hourInWeek) });
const hourLabel = el('span', { class: 'value' });
const solarInput = el('input', { id: 'solar', type: 'range', min: '0', max: String(MAX_GW[state.zone] ?? 100), step: '0.5', value: String(state.extraGw) });
const solarLabel = el('span', { class: 'value' });
const status = el('div', { id: 'status', text: 'Starting the simulation…' });

const summary = el('div', { id: 'summary', class: 'summary' });

function control(label: string, input: HTMLElement, extra?: HTMLElement): HTMLElement {
  const children: (Node | string)[] = [el('span', { class: 'label', text: label }), input];
  if (extra !== undefined) children.push(extra);
  return el('label', { class: 'control' }, children);
}

function card(id: string, title: string, caption: string): HTMLElement {
  return el('section', { class: 'card' }, [
    el('h2', { text: title }),
    el('div', { id, class: 'chart' }),
    el('p', { class: 'caption', text: caption }),
  ]);
}

app.append(
  el('header', {}, [
    el('h1', { text: 'Gridmaster market explorer' }),
    el('p', { class: 'warning', text: 'Placeholder inputs. Every number behind these charts is an invented stand-in for real data; the shapes are the point, not the values. Real weather, fleets and fuel prices come in the next step.' }),
    el('div', { class: 'controls' }, [
      control('Zone', zoneSelect),
      control('Year', yearSelect),
      control('Seed', seedInput, seedButton),
      control('Week of the year', weekInput, weekLabel),
      control('Hour in that week', hourInput, hourLabel),
      control('Add solar to this zone', solarInput, solarLabel),
    ]),
    status,
    summary,
  ]),
  el('main', { class: 'grid' }, [
    card(
      'chart-week',
      'One week, hour by hour',
      'The price (black line, right axis) over the generation that met demand (stacked, left axis). Wind and solar push the price down when they are plentiful; where the stack falls short of the dashed demand line, imports or storage filled the gap, and where it overshoots, the zone was exporting or charging storage.',
    ),
    card(
      'chart-ladder',
      'The offers in one hour',
      'Every supply offer in the chosen hour, cheapest first and coloured by technology; faded blocks did not run. The price settles where the offers meet the demand the local plants had to cover, which is demand plus exports and storage charging, minus imports. Offers below zero come from plants that would rather pay than switch off.',
    ),
    card(
      'chart-duration',
      'All hours of the year, sorted',
      'Every hour of the year from the dearest to the cheapest. A steep left end means scarcity spikes; a long flat tail at or below zero means hours of renewable surplus.',
    ),
    card(
      'chart-cannibal',
      'What solar earns as more solar is built',
      'Move the slider to add solar to this zone. The more solar there is, the lower the midday price it sells into, so solar earns less than the average price even while the average price itself falls. Each point simulates the chosen year on its own.',
    ),
    card(
      'chart-annual',
      'Prices and negative hours, 1995–2025',
      'The average price of each year (line) and the number of hours with a negative price (bars). Before a zone opened its market it paid a flat regulated price. Neighbouring zones are dotted for comparison. The years run in sequence, so wet or dry Norwegian reservoirs carry over.',
    ),
    card(
      'chart-capture',
      'What each technology earned, as a share of the average price',
      'The price a technology captured divided by the year’s average price. Solar sinks below 100 % as solar grows: it produces when everyone else’s solar does. Wind suffers a milder version of the same; dispatchable plants earn above average because they run in dear hours.',
    ),
  ]),
  el('footer', {}, [
    el('p', {
      text: 'Phase 1 market toy. Each year in the first four charts is simulated on its own from standard starting levels; the two long-run charts replay 1995–2025 in sequence. Prices are day-ahead style hourly prices in €/MWh. Nothing here is real data yet.',
    }),
  ]),
);

const charts = {
  week: echarts.init(byId('chart-week')),
  ladder: echarts.init(byId('chart-ladder')),
  duration: echarts.init(byId('chart-duration')),
  cannibal: echarts.init(byId('chart-cannibal')),
  annual: echarts.init(byId('chart-annual')),
  capture: echarts.init(byId('chart-capture')),
};
window.addEventListener('resize', () => {
  for (const c of Object.values(charts)) c.resize();
});

// ---------------------------------------------------------------------------
// Requests and responses

const client = makeClient();
let nextId = 1;
let yearRequestId = 0;
let seriesRequestId = 0;
let cannibalRequestId = 0;
let currentYear: ZoneYearPayload | null = null;
let seriesYears: Map<number, Readonly<Record<string, ZoneStats>>> = new Map();
let cannibalPoints: readonly CannibalPoint[] = [];
let pending = 0;

function setStatus(text: string): void {
  status.textContent = text;
}

function busy(delta: number): void {
  pending = Math.max(0, pending + delta);
  document.body.classList.toggle('busy', pending > 0);
}

function requestYear(): void {
  yearRequestId = nextId++;
  busy(1);
  setStatus(`Simulating ${state.zone} ${state.year}…`);
  client.send({ kind: 'year', id: yearRequestId, seed: state.seed, zone: state.zone, year: state.year, extraSolarGw: state.extraGw });
}

function requestSeries(): void {
  seriesRequestId = nextId++;
  seriesYears = new Map();
  busy(1);
  client.send({ kind: 'series', id: seriesRequestId, seed: state.seed, zone: state.zone, extraSolarGw: state.extraGw });
}

function requestCannibal(): void {
  cannibalRequestId = nextId++;
  cannibalPoints = [];
  busy(1);
  client.send({ kind: 'cannibal', id: cannibalRequestId, seed: state.seed, zone: state.zone, year: state.year, maxGw: MAX_GW[state.zone] ?? 100 });
}

function currentCannibalPoint(): CannibalPoint | null {
  if (currentYear === null) return null;
  const s = currentYear.stats.byTech.solar;
  return { gw: state.extraGw, capturePrice: s.capturePrice, captureRate: s.captureRate, meanPrice: currentYear.stats.meanPrice, solarTwh: s.generationTwh };
}

function renderYear(): void {
  if (currentYear === null) return;
  const p = currentYear;
  const maxWeek = Math.max(0, Math.ceil(p.hours / 168) - 1);
  if (state.week > maxWeek) state.week = maxWeek;
  weekInput.max = String(maxWeek);
  const start = Math.min(state.week * 168, Math.max(0, p.hours - 168));
  const hour = Math.min(p.hours - 1, start + state.hourInWeek);
  weekLabel.textContent = `${labelForHour(p.year, start).slice(0, 10)} →`;
  hourLabel.textContent = labelForHour(p.year, hour);
  charts.week.setOption(weekOption(p, state.week), true);
  charts.ladder.setOption(ladderOption(p, hour), true);
  charts.duration.setOption(durationOption(p), true);
  charts.cannibal.setOption(cannibalOption(cannibalPoints, state.extraGw, currentCannibalPoint()), true);

  const s = p.stats;
  const open = p.marketOpenFromHour < p.hours;
  const opensLater = p.marketOpenFromHour > 0 && open;
  const solar = s.byTech.solar;
  const wind = s.byTech.wind;
  const parts: string[] = [
    `${zoneName(p.zone)}, ${p.year}${open ? '' : ' (regulated tariff all year, no hourly market yet)'}${opensLater ? ` (hourly market from ${labelForHour(p.year, p.marketOpenFromHour).slice(0, 10)})` : ''}.`,
    `Average price ${fmt(s.meanPrice, 1)} €/MWh, spread (standard deviation) ${fmt(s.stdPrice, 1)}, lowest ${fmt(s.minPrice, 1)}, highest ${fmt(s.maxPrice, 0)}.`,
    `${s.negativeHours} negative hours; ${s.capHours} hours at the price cap; ${fmt(s.unservedMwh, 0)} MWh unserved.`,
    `Demand ${fmt(s.demandTwh, 1)} TWh; renewables ${fmt(s.renewableShare * 100, 0)} % of generation; net exports ${fmt(s.netExportTwh, 1)} TWh; ${fmt(s.curtailedTwh, 2)} TWh of wind and solar curtailed.`,
    `Wind earned ${fmt(wind.capturePrice, 1)} €/MWh (${fmt(wind.captureRate === null ? null : wind.captureRate * 100, 0)} % of average) from ${fmt(wind.capacityMw / 1000, 1)} GW; solar earned ${fmt(solar.capturePrice, 1)} €/MWh (${fmt(solar.captureRate === null ? null : solar.captureRate * 100, 0)} %) from ${fmt(solar.capacityMw / 1000, 1)} GW${state.extraGw > 0 ? `, of which ${fmt(state.extraGw, 1)} GW added by the slider` : ''}.`,
  ];
  if (p.links.length > 0) {
    parts.push(
      `Links: ${p.links
        .map((l) => {
          let hoursFull = 0;
          for (let h = 0; h < l.congested.length; h++) hoursFull += l.congested[h] ?? 0;
          return `${l.id} ${fmt(l.capacityMw / 1000, 1)} GW, full ${fmt((hoursFull / p.hours) * 100, 0)} % of hours`;
        })
        .join('; ')}.`,
    );
  }
  summary.replaceChildren(...parts.map((t) => el('p', { text: t })));
  solarLabel.textContent = `${fmt(state.extraGw, 1)} GW`;
}

function renderSeries(): void {
  const series: SeriesByYear = seriesYears;
  const others = zoneIds().filter((z) => z !== state.zone && (z === 'DK1' || z === 'DE' || z === 'NO') && (state.zone === 'DK1' || state.zone === 'DE' || state.zone === 'NO'));
  charts.annual.setOption(annualOption(series, state.zone, FIRST_YEAR, LAST_YEAR, others), true);
  charts.capture.setOption(captureOption(series, state.zone, FIRST_YEAR, LAST_YEAR), true);
}

client.onMessage((r) => {
  switch (r.kind) {
    case 'year':
      if (r.id !== yearRequestId) return;
      busy(-1);
      currentYear = r.payload;
      renderYear();
      setStatus(`Simulated ${state.zone} ${state.year} in ${r.ms.toFixed(0)} ms${seriesYears.size < LAST_YEAR - FIRST_YEAR + 1 ? `; long-run charts: ${seriesYears.size} of ${LAST_YEAR - FIRST_YEAR + 1} years` : ''}.`);
      break;
    case 'seriesYear':
      if (r.id !== seriesRequestId) return;
      seriesYears.set(r.year, r.stats);
      if (r.year % 3 === 0 || r.year === LAST_YEAR) renderSeries();
      if (pending > 0) setStatus(`Long-run charts: ${seriesYears.size} of ${LAST_YEAR - FIRST_YEAR + 1} years simulated…`);
      break;
    case 'seriesDone':
      if (r.id !== seriesRequestId) return;
      busy(-1);
      renderSeries();
      setStatus(`All ${LAST_YEAR - FIRST_YEAR + 1} years simulated in ${(r.ms / 1000).toFixed(1)} s.`);
      break;
    case 'cannibal':
      if (r.id !== cannibalRequestId) return;
      busy(-1);
      cannibalPoints = r.points;
      charts.cannibal.setOption(cannibalOption(cannibalPoints, state.extraGw, currentCannibalPoint()), true);
      break;
    case 'error':
      busy(-1);
      setStatus(`Simulation error: ${r.message}`);
      break;
    default:
      break;
  }
});

// ---------------------------------------------------------------------------
// Controls

let yearTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleYear(): void {
  if (yearTimer !== null) clearTimeout(yearTimer);
  yearTimer = setTimeout(() => {
    yearTimer = null;
    requestYear();
  }, 120);
}

zoneSelect.addEventListener('change', () => {
  state.zone = zoneSelect.value;
  const max = MAX_GW[state.zone] ?? 100;
  solarInput.max = String(max);
  if (state.extraGw > max) {
    state.extraGw = max;
    solarInput.value = String(max);
  }
  writeHash(state);
  requestYear();
  requestSeries();
  requestCannibal();
});

yearSelect.addEventListener('change', () => {
  state.year = Number(yearSelect.value);
  writeHash(state);
  requestYear();
  requestCannibal();
});

function applySeed(seed: number): void {
  state.seed = seed;
  seedInput.value = String(seed);
  writeHash(state);
  requestYear();
  requestSeries();
  requestCannibal();
}

seedInput.addEventListener('change', () => {
  const v = Math.round(Number(seedInput.value));
  if (Number.isFinite(v) && v >= 0) applySeed(v);
});

seedButton.addEventListener('click', () => {
  // A fresh seed for the player; the simulation itself stays deterministic for that seed.
  applySeed(Math.floor(Math.random() * 1_000_000));
});

weekInput.addEventListener('input', () => {
  state.week = Number(weekInput.value);
  writeHash(state);
  renderYear();
});

hourInput.addEventListener('input', () => {
  state.hourInWeek = Number(hourInput.value);
  writeHash(state);
  renderYear();
});

solarInput.addEventListener('input', () => {
  state.extraGw = Number(solarInput.value);
  solarLabel.textContent = `${fmt(state.extraGw, 1)} GW`;
  writeHash(state);
  scheduleYear();
});

solarInput.addEventListener('change', () => {
  requestSeries();
});

// ---------------------------------------------------------------------------
// Go

writeHash(state);
solarLabel.textContent = `${fmt(state.extraGw, 1)} GW`;
requestYear();
requestSeries();
requestCannibal();
