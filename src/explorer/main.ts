/**
 * The explorer page: controls, charts and plain-language captions. The
 * simulation runs in a Web Worker, or in the page when the worker cannot
 * start (the page then says so).
 *
 * How the page stays truthful and quick:
 * - Control changes are coalesced (about 250 ms), and every request carries
 *   a generation id; the worker drops superseded work and checks between
 *   simulated years, and runs the chosen year first, then the solar curve,
 *   then the long run (`Scheduler` in `protocol.ts`).
 * - The long run is the baseline of a seed, so changing zone, year or the
 *   solar slider never restarts it; only a new seed does.
 * - Every chart and the summary are drawn only from the payload they belong
 *   to, and every title names its zone and year, so an older result can never
 *   pass for the new choice.
 */
import { BarChart, CustomChart, LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { type ZoneStats } from '../sim';
import {
  annualCaption,
  annualOption,
  annualTitle,
  cannibalCaption,
  cannibalOption,
  cannibalTitle,
  captureCaption,
  captureOption,
  captureTitle,
  durationCaption,
  durationOption,
  durationTitle,
  fmt,
  ladderCaption,
  ladderNote,
  ladderOption,
  ladderTitle,
  shortDate,
  shortDateTime,
  weekCaption,
  weekCount,
  weekOption,
  weekStart,
  weekTitle,
  type Layout,
  type SeriesByYear,
} from './charts';
import {
  FIRST_YEAR,
  LAST_YEAR,
  MAX_SEED,
  Scheduler,
  parseSeed,
  zoneHasReservoir,
  zoneIds,
  zoneName,
  zoneNeighbours,
  type CannibalRequest,
  type CannibalResponse,
  type Request,
  type RequestKind,
  type Response,
  type SeriesRequest,
  type YearRequest,
  type ZoneYearPayload,
} from './protocol';
import './style.css';

echarts.use([LineChart, BarChart, CustomChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, CanvasRenderer]);

const YEARS = LAST_YEAR - FIRST_YEAR + 1;
/** Coalescing delay for control changes, ms. */
const DEBOUNCE_MS = 250;
/** How long the worker gets to say it is alive before the page runs the simulation itself, ms. */
const READY_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Simulation client: a worker, with the same scheduler in the page as the fallback.

interface SimClient {
  send(req: Request): void;
}

function inlineScheduler(dispatch: (r: Response) => void): Scheduler {
  return new Scheduler(dispatch, (fn) => setTimeout(fn, 0));
}

function makeClient(dispatch: (r: Response) => void, onFallback: (reason: string) => void): SimClient {
  // The newest unanswered request of each kind, replayed if the worker has to be replaced.
  const open = new Map<RequestKind, Request>();
  const answered = (r: Response): void => {
    if (r.kind === 'year' || r.kind === 'cannibal') {
      if (open.get(r.kind)?.gen === r.gen) open.delete(r.kind);
    } else if (r.kind === 'seriesDone') {
      if (open.get('series')?.gen === r.gen) open.delete('series');
    } else if (r.kind === 'error') {
      if (open.get(r.request)?.gen === r.gen) open.delete(r.request);
    }
  };
  const forward = (r: Response): void => {
    answered(r);
    dispatch(r);
  };
  let inline: Scheduler | null = null;
  const goInline = (reason: string): void => {
    if (inline !== null) return;
    inline = inlineScheduler(forward);
    for (const req of open.values()) inline.submit(req);
    onFallback(reason);
  };
  let worker: Worker | null = null;
  if (typeof Worker === 'undefined') {
    goInline('This browser cannot run the simulation in the background');
  } else {
    try {
      worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    } catch {
      goInline('The background simulation could not be started');
    }
  }
  if (worker !== null) {
    const w = worker;
    let ready = false;
    const fail = (reason: string): void => {
      clearTimeout(timer);
      w.terminate();
      worker = null;
      goInline(reason);
    };
    const timer = setTimeout(() => {
      if (!ready) fail('The background simulation did not answer');
    }, READY_TIMEOUT_MS);
    w.onmessage = (e: MessageEvent<Response>) => {
      if (e.data.kind === 'ready') {
        ready = true;
        clearTimeout(timer);
        return;
      }
      forward(e.data);
    };
    w.onerror = (e) => {
      e.preventDefault();
      fail('The background simulation failed to load');
    };
    w.onmessageerror = () => fail('The background simulation sent an unreadable answer');
  }
  return {
    send: (req) => {
      open.set(req.kind, req);
      if (inline !== null) inline.submit(req);
      else worker?.postMessage(req);
    },
  };
}

// ---------------------------------------------------------------------------
// State and the address bar

interface State {
  zone: string;
  year: number;
  seed: number;
  week: number;
  hourInWeek: number;
  extraGw: number;
}

const MAX_GW: Readonly<Record<string, number>> = { DK1: 10, DE: 100, NO: 20, ES: 60 };
const SOLAR_STEP = 0.5;
const MAX_WEEK = weekCount(8760) - 1; // 51: weeks are 7-day steps, the last one ending on 31 December

const maxGw = (zone: string): number => MAX_GW[zone] ?? 100;

/** The slider's own value for a requested amount: rounded to its step and kept within the zone's maximum. */
function solarValue(gw: number, zone: string): number {
  return Math.min(maxGw(zone), Math.max(0, Math.round(gw / SOLAR_STEP) * SOLAR_STEP));
}

function readHash(): Partial<State> {
  const out: Partial<State> = {};
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const int = (key: string, lo: number, hi: number): number | undefined => {
    const raw = params.get(key);
    if (raw === null || !/^\d+$/.test(raw.trim())) return undefined;
    const v = Number(raw);
    return v >= lo && v <= hi ? v : undefined;
  };
  const zone = params.get('zone');
  if (zone !== null && zoneIds().includes(zone)) out.zone = zone;
  const year = int('year', FIRST_YEAR, LAST_YEAR);
  if (year !== undefined) out.year = year;
  const seed = parseSeed(params.get('seed') ?? '');
  if (seed !== null) out.seed = seed;
  const week = int('week', 0, 52);
  if (week !== undefined) out.week = Math.min(MAX_WEEK, week);
  const hour = int('hour', 0, 167);
  if (hour !== undefined) out.hourInWeek = hour;
  const solar = params.get('solar');
  if (solar !== null && /^\d+(\.\d+)?$/.test(solar.trim())) out.extraGw = Number(solar);
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

const state: State = { zone: 'DK1', year: 2024, seed: 42, week: 26, hourInWeek: 60, extraGw: 0 };
function applyHash(): void {
  Object.assign(state, readHash());
  state.extraGw = solarValue(state.extraGw, state.zone);
}
applyHash();

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

// ---------------------------------------------------------------------------
// Page

const app = byId<HTMLDivElement>('app');

const zoneSelect = el('select', { id: 'zone' });
for (const z of zoneIds()) zoneSelect.append(el('option', { value: z, text: `${zoneName(z)} (${z})` }));

const yearSelect = el('select', { id: 'year' });
for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) yearSelect.append(el('option', { value: String(y), text: String(y) }));

const seedInput = el('input', { id: 'seed', type: 'text', inputmode: 'numeric', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': 'seed-hint seed-error' });
const seedButton = el('button', { type: 'button', id: 'new-seed', text: 'New' });
const seedHint = el('span', { id: 'seed-hint', class: 'hint', text: 'Each number draws different weather for every year; the same number always gives the same weather.' });
const seedError = el('span', { id: 'seed-error', class: 'error', role: 'alert' });

const weekInput = el('input', { id: 'week', type: 'range', min: '0', max: String(MAX_WEEK), step: '1' });
const weekLabel = el('span', { class: 'value' });
const hourInput = el('input', { id: 'hour', type: 'range', min: '0', max: '167', step: '1' });
const hourLabel = el('span', { class: 'value' });
const solarInput = el('input', { id: 'solar', type: 'range', min: '0', step: String(SOLAR_STEP) });
const solarLabel = el('span', { class: 'value' });
const solarHint = el('span', { class: 'hint', text: 'Changes the chosen year and the solar curve; the 1995–2025 charts stay the baseline.' });
const notice = el('div', { id: 'notice', class: 'notice', hidden: '' });
const status = el('div', { id: 'status' }, [el('span', { id: 'status-main', text: 'Starting the simulation…' }), el('span', { id: 'status-more' })]);
const statusMain = status.firstChild as HTMLSpanElement;
const statusMore = status.lastChild as HTMLSpanElement;
const summary = el('div', { id: 'summary', class: 'summary' });

/** A control: its label (with the current value, for sliders) above the input, any hint or error below. */
function control(label: string, input: HTMLElement, ...extra: HTMLElement[]): HTMLElement {
  const value = extra.filter((e) => e.classList.contains('value'));
  const button = extra.filter((e) => e.tagName === 'BUTTON');
  const below = extra.filter((e) => !e.classList.contains('value') && e.tagName !== 'BUTTON');
  const head = el('span', { class: 'head' }, [el('span', { class: 'label', text: label }), ...value]);
  return el('label', { class: 'control' }, [head, el('div', { class: 'row' }, [input, ...button]), ...below]);
}

interface Card {
  readonly title: HTMLHeadingElement;
  readonly note: HTMLParagraphElement;
  readonly caption: HTMLParagraphElement;
  readonly box: HTMLDivElement;
}

function card(id: string, title: string): Card & { section: HTMLElement } {
  const t = el('h2', { text: title });
  const note = el('p', { class: 'note', hidden: '' });
  const box = el('div', { id, class: 'chart' });
  const caption = el('p', { class: 'caption' });
  return { title: t, note, caption, box, section: el('section', { class: 'card' }, [t, note, box, caption]) };
}

const cards = {
  week: card('chart-week', 'One week, hour by hour'),
  ladder: card('chart-ladder', 'The offers in one hour'),
  duration: card('chart-duration', 'All hours of the year, sorted'),
  cannibal: card('chart-cannibal', 'What solar earns as more solar is built'),
  annual: card('chart-annual', 'Prices and negative hours, 1995–2025'),
  capture: card('chart-capture', 'What each technology earned, as a share of the average price'),
};

app.append(
  el('header', {}, [
    el('h1', { text: 'Gridmaster market explorer' }),
    el('p', { class: 'warning', text: 'Placeholder inputs. Every number behind these charts is an invented stand-in for real data; the shapes are the point, not the values. Real weather, fleets and fuel prices come in the next step.' }),
    el('div', { class: 'controls' }, [
      control('Zone', zoneSelect),
      control('Year', yearSelect),
      control('Weather variation (seed)', seedInput, seedButton, seedHint, seedError),
      control('Week of the year', weekInput, weekLabel),
      control('Hour in that week', hourInput, hourLabel),
      control('Add solar to this zone', solarInput, solarLabel, solarHint),
    ]),
    notice,
    status,
    summary,
  ]),
  el('main', { class: 'grid' }, Object.values(cards).map((c) => c.section)),
  el('footer', {}, [
    el('p', {
      text: 'Phase 1 market toy. The two long-run charts replay 1995–2025 in sequence for the chosen weather variation (seed), so reservoirs and storage carry over from year to year; they show the baseline world without the solar slider. The chosen year starts from the long run’s levels on 1 January of that year, so its numbers match the long-run charts (until the long run gets there, it is marked provisional). Prices are day-ahead style hourly prices in €/MWh. Nothing here is real data yet.',
    }),
  ]),
);

const charts = {
  week: echarts.init(cards.week.box),
  ladder: echarts.init(cards.ladder.box),
  duration: echarts.init(cards.duration.box),
  cannibal: echarts.init(cards.cannibal.box),
  annual: echarts.init(cards.annual.box),
  capture: echarts.init(cards.capture.box),
};

const layoutOf = (c: Card): Layout => ({ width: c.box.clientWidth || 600 });

function setNote(c: Card, text: string | null, kind: 'info' | 'provisional' = 'info'): void {
  c.note.hidden = text === null;
  c.note.textContent = text ?? '';
  c.note.classList.toggle('provisional', kind === 'provisional');
}

// ---------------------------------------------------------------------------
// Results held by the page, each with the parameters it was computed for.

let gen = 0;
const sent: { year: YearRequest | null; cannibal: CannibalRequest | null; series: SeriesRequest | null } = { year: null, cannibal: null, series: null };
const waiting = new Set<RequestKind>();
let yearPayload: ZoneYearPayload | null = null;
let yearMs = 0;
let cannibal: CannibalResponse | null = null;
let seriesSeed = -1;
let seriesYears = new Map<number, Readonly<Record<string, ZoneStats>>>();
let seriesDoneMs: number | null = null;
let errorText: string | null = null;

function send(req: Request): void {
  waiting.add(req.kind);
  if (req.kind === 'year') sent.year = req;
  else if (req.kind === 'cannibal') sent.cannibal = req;
  else sent.series = req;
  client.send(req);
  updateBusy();
}

function updateBusy(): void {
  document.body.classList.toggle('busy', waiting.size > 0);
}

const sameYear = (a: { seed: number; zone: string; year: number }, b: { seed: number; zone: string; year: number }): boolean =>
  a.seed === b.seed && a.zone === b.zone && a.year === b.year;

/** Send whatever the current controls need and the page does not already have or await. */
function requestUpdates(force: { year?: boolean; cannibal?: boolean } = {}): void {
  errorText = null;
  if (sent.series === null || sent.series.seed !== state.seed) {
    seriesSeed = state.seed;
    seriesYears = new Map();
    seriesDoneMs = null;
    send({ kind: 'series', gen: ++gen, seed: state.seed });
    renderSeries();
  }
  const y = sent.year;
  if (force.year === true || y === null || !sameYear(y, state) || y.extraSolarGw !== state.extraGw) {
    send({ kind: 'year', gen: ++gen, seed: state.seed, zone: state.zone, year: state.year, extraSolarGw: state.extraGw });
  }
  const c = sent.cannibal;
  if (force.cannibal === true || c === null || !sameYear(c, state)) {
    send({ kind: 'cannibal', gen: ++gen, seed: state.seed, zone: state.zone, year: state.year, maxGw: maxGw(state.zone) });
    if (cannibal === null) cards.cannibal.title.textContent = cannibalTitle(zoneName(state.zone), state.year);
    setNote(cards.cannibal, `Computing the curve for ${zoneName(state.zone)} ${state.year}…`);
  }
  updateStatus();
}

let requestTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleUpdates(): void {
  if (requestTimer !== null) clearTimeout(requestTimer);
  requestTimer = setTimeout(() => {
    requestTimer = null;
    requestUpdates();
  }, DEBOUNCE_MS);
  updateStatus();
}

/** A provisional (fresh-start) result is redone once the long run has reached its year. */
function upgradeProvisional(): void {
  const reached = (seed: number, year: number): boolean => seed === seriesSeed && (year === FIRST_YEAR || seriesYears.has(year - 1));
  const y = sent.year;
  const yearDue = yearPayload !== null && yearPayload.start === 'fresh' && y !== null && !waiting.has('year') && sameYear(y, yearPayload) && reached(y.seed, y.year);
  const c = sent.cannibal;
  const cannibalDue = cannibal !== null && cannibal.start === 'fresh' && c !== null && !waiting.has('cannibal') && sameYear(c, cannibal) && reached(c.seed, c.year);
  if (!yearDue && !cannibalDue) return;
  if (yearDue && y !== null) send({ ...y, gen: ++gen });
  if (cannibalDue && c !== null) send({ ...c, gen: ++gen });
  updateStatus();
}

// ---------------------------------------------------------------------------
// Rendering, each piece from its own payload

function hourOf(p: ZoneYearPayload): number {
  return Math.min(p.hours - 1, weekStart(p.hours, state.week) + state.hourInWeek);
}

function renderLabels(): void {
  const p = yearPayload;
  const hours = p !== null && p.year === state.year ? p.hours : state.year % 4 === 0 ? 8784 : 8760;
  const s = weekStart(hours, state.week);
  weekLabel.textContent = `${shortDate(state.year, s)}–${shortDate(state.year, Math.min(hours - 1, s + 167))}`;
  hourLabel.textContent = shortDateTime(state.year, Math.min(hours - 1, s + state.hourInWeek));
  solarLabel.textContent = `${fmt(state.extraGw, 1)} GW`;
}

function renderWeek(): void {
  const p = yearPayload;
  if (p === null) return;
  const name = zoneName(p.zone);
  cards.week.title.textContent = weekTitle(p, name, state.week);
  cards.week.caption.textContent = weekCaption(p, name);
  charts.week.setOption(weekOption(p, state.week, layoutOf(cards.week)), true);
}

function renderLadder(): void {
  const p = yearPayload;
  if (p === null) return;
  const hour = hourOf(p);
  cards.ladder.title.textContent = ladderTitle(p, zoneName(p.zone), hour);
  setNote(cards.ladder, ladderNote(p, hour));
  cards.ladder.caption.textContent = ladderCaption();
  charts.ladder.setOption(ladderOption(p, hour, layoutOf(cards.ladder)), true);
}

function renderDuration(): void {
  const p = yearPayload;
  if (p === null) return;
  const name = zoneName(p.zone);
  cards.duration.title.textContent = durationTitle(p, name);
  cards.duration.caption.textContent = durationCaption(p, name);
  charts.duration.setOption(durationOption(p, layoutOf(cards.duration)), true);
}

function renderCannibal(): void {
  const c = cannibal;
  if (c === null) return;
  const name = zoneName(c.zone);
  cards.cannibal.title.textContent = cannibalTitle(name, c.year);
  const p = yearPayload !== null && sameYear(yearPayload, c) ? yearPayload : null;
  cards.cannibal.caption.textContent = cannibalCaption(p, name);
  const current = p === null ? null : { gw: p.extraSolarGw, capturePrice: p.stats.byTech.solar.capturePrice };
  const pending = sent.cannibal !== null && !sameYear(sent.cannibal, c);
  if (pending) setNote(cards.cannibal, `Showing ${name} ${c.year}; computing the curve for ${zoneName(state.zone)} ${state.year}…`);
  else if (c.start === 'fresh') setNote(cards.cannibal, `Provisional: ${c.year} from standard starting levels; it updates once the long run reaches ${c.year}.`, 'provisional');
  else setNote(cards.cannibal, null);
  charts.cannibal.setOption(cannibalOption(c.points, current, layoutOf(cards.cannibal)), true);
}

function renderSummary(): void {
  const p = yearPayload;
  if (p === null) return;
  const s = p.stats;
  const name = zoneName(p.zone);
  const open = p.marketOpenFromHour < p.hours;
  const opensLater = p.marketOpenFromHour > 0 && open;
  const solar = s.byTech.solar;
  const wind = s.byTech.wind;
  const pct = (r: number | null): string => (r === null ? 'not defined' : `${fmt(r * 100, 0)} % of average`);
  const fleet = (mw: number): string => (mw <= 0 ? 'with no capacity yet' : mw < 1000 ? `from ${fmt(mw)} MW` : `from ${fmt(mw / 1000, 1)} GW`);
  const trade = Math.abs(s.netExportTwh) < 0.05 ? 'no net trade' : s.netExportTwh > 0 ? `net exports ${fmt(s.netExportTwh, 1)} TWh` : `net imports ${fmt(-s.netExportTwh, 1)} TWh`;
  const parts: string[] = [
    `${name}, ${p.year}, weather variation ${p.seed}${p.extraSolarGw > 0 ? `, with ${fmt(p.extraSolarGw, 1)} GW of solar added by the slider` : ''}${open ? '' : ' (regulated tariff all year, no hourly market yet)'}${opensLater ? ` (hourly market from ${shortDate(p.year, p.marketOpenFromHour)})` : ''}.`,
    `Average price ${fmt(s.meanPrice, 1)} €/MWh; spread (standard deviation) ${fmt(s.stdPrice, 1)}; lowest ${fmt(s.minPrice, 1)}, highest ${fmt(s.maxPrice, 1)} €/MWh.`,
    `${s.negativeHours} negative hours; ${s.capHours} hours at the price cap; ${fmt(s.unservedMwh, 0)} MWh unserved.`,
    `Demand ${fmt(s.demandTwh, 1)} TWh; renewables ${fmt(s.renewableShare * 100, 0)} % of generation; ${trade}; ${fmt(s.curtailedTwh, 2)} TWh of wind and solar curtailed.`,
    `Wind earned ${fmt(wind.capturePrice, 1)} €/MWh (${pct(wind.captureRate)}) ${fleet(wind.capacityMw)}; solar earned ${fmt(solar.capturePrice, 1)} €/MWh (${pct(solar.captureRate)}) ${fleet(solar.capacityMw)}${p.extraSolarGw > 0 ? `, of which ${fmt(p.extraSolarGw, 1)} GW added by the slider` : ''}.`,
  ];
  if (p.links.length > 0) {
    parts.push(
      `Links: ${p.links
        .map((l) => {
          let full = 0;
          for (let h = 0; h < l.congested.length; h++) full += l.congested[h] ?? 0;
          return `${l.id} ${fmt(l.capacityMw / 1000, 1)} GW, full ${fmt((full / p.hours) * 100, 0)} % of hours`;
        })
        .join('; ')}.`,
    );
  }
  const nodes = parts.map((t) => el('p', { text: t }));
  if (p.start === 'fresh') {
    nodes.unshift(
      el('p', {
        class: 'provisional',
        text: `Provisional: ${p.year} started from standard levels (reservoirs at their usual fill, storage empty). It updates by itself once the long run below has reached ${p.year}, so the numbers match those charts.`,
      }),
    );
  }
  summary.replaceChildren(...nodes);
}

function renderYear(): void {
  renderLabels();
  renderSummary();
  renderWeek();
  renderLadder();
  renderDuration();
  renderCannibal(); // its "Now" dot comes from the year payload
}

function renderSeries(): void {
  const zone = state.zone;
  const name = zoneName(zone);
  const neighbours = zoneNeighbours(zone);
  const reservoirs = [zone, ...neighbours].filter(zoneHasReservoir).map(zoneName);
  const series: SeriesByYear = seriesYears;
  const seedText = seriesSeed >= 0 ? ` (weather variation ${seriesSeed})` : '';
  cards.annual.title.textContent = annualTitle(name) + seedText;
  cards.annual.caption.textContent = annualCaption(name, neighbours.map(zoneName), reservoirs);
  cards.capture.title.textContent = captureTitle(name) + seedText;
  cards.capture.caption.textContent = captureCaption();
  const progress = seriesDoneMs === null ? `Replaying 1995–2025: ${seriesYears.size} of ${YEARS} years so far.` : null;
  setNote(cards.annual, progress);
  setNote(cards.capture, progress);
  charts.annual.setOption(annualOption(series, zone, FIRST_YEAR, LAST_YEAR, neighbours, layoutOf(cards.annual)), true);
  charts.capture.setOption(captureOption(series, zone, FIRST_YEAR, LAST_YEAR, layoutOf(cards.capture)), true);
}

function describe(r: { seed: number; zone: string; year: number; extraSolarGw?: number }): string {
  const gw = r.extraSolarGw ?? 0;
  return `${zoneName(r.zone)} ${r.year}, weather variation ${r.seed}${gw > 0 ? `, +${fmt(gw, 1)} GW solar` : ''}`;
}

/** The status line: first the user's current choice, then the background work. */
function updateStatus(): void {
  let main: string;
  const y = sent.year;
  const controlsAhead = y === null || !sameYear(y, state) || y.extraSolarGw !== state.extraGw;
  if (errorText !== null) main = errorText;
  else if (controlsAhead || requestTimer !== null) main = `Simulating ${describe({ ...state, extraSolarGw: state.extraGw })}…`;
  else if (waiting.has('year') && y !== null) main = `Simulating ${describe(y)}…`;
  else if (yearPayload !== null) {
    main = `${describe(yearPayload)}: simulated in ${fmt(yearMs)} ms${yearPayload.start === 'fresh' ? `, provisional until the long run reaches ${yearPayload.year}` : ', from the long run’s 1 January levels'}.`;
  } else main = 'Starting the simulation…';
  const more: string[] = [];
  if (waiting.has('cannibal')) more.push('solar curve: computing');
  more.push(seriesDoneMs === null ? `long run: ${seriesYears.size} of ${YEARS} years` : `long run: all ${YEARS} years (${fmt(seriesDoneMs / 1000, 1)} s)`);
  statusMain.textContent = main;
  statusMore.textContent = ` · ${more.join(' · ')}`;
}

// ---------------------------------------------------------------------------
// Answers

function onResponse(r: Response): void {
  switch (r.kind) {
    case 'year':
      if (r.gen !== sent.year?.gen) return;
      waiting.delete('year');
      yearPayload = r.payload;
      yearMs = r.ms;
      renderYear();
      upgradeProvisional();
      break;
    case 'cannibal':
      if (r.gen !== sent.cannibal?.gen) return;
      waiting.delete('cannibal');
      cannibal = r;
      renderCannibal();
      upgradeProvisional();
      break;
    case 'seriesYear':
      if (r.gen !== sent.series?.gen) return;
      seriesYears.set(r.year, r.stats);
      if (r.year % 3 === 0 || r.year === LAST_YEAR) renderSeries();
      upgradeProvisional();
      break;
    case 'seriesDone':
      if (r.gen !== sent.series?.gen) return;
      waiting.delete('series');
      seriesDoneMs = r.ms;
      renderSeries();
      break;
    case 'error': {
      const current = sent[r.request];
      if (current === null || r.gen !== current.gen) return;
      waiting.delete(r.request);
      errorText = `Simulation error: ${r.message}`;
      break;
    }
    default:
      return;
  }
  updateBusy();
  updateStatus();
}

const client = makeClient(onResponse, (reason) => {
  notice.hidden = false;
  notice.textContent = `${reason}, so it runs inside this page instead. The page may pause for a moment while each year is computed.`;
});

// ---------------------------------------------------------------------------
// Controls

function syncControls(): void {
  zoneSelect.value = state.zone;
  yearSelect.value = String(state.year);
  seedInput.value = String(state.seed);
  seedError.textContent = '';
  seedInput.removeAttribute('aria-invalid');
  weekInput.value = String(state.week);
  hourInput.value = String(state.hourInWeek);
  solarInput.max = String(maxGw(state.zone));
  solarInput.value = String(state.extraGw);
  renderLabels();
}

zoneSelect.addEventListener('change', () => {
  state.zone = zoneSelect.value;
  state.extraGw = solarValue(state.extraGw, state.zone);
  solarInput.max = String(maxGw(state.zone));
  solarInput.value = String(state.extraGw);
  writeHash(state);
  renderLabels();
  renderSeries(); // the long run holds every zone: no need to wait
  scheduleUpdates();
});

yearSelect.addEventListener('change', () => {
  state.year = Number(yearSelect.value);
  writeHash(state);
  renderLabels();
  scheduleUpdates();
});

function applySeed(seed: number): void {
  state.seed = seed;
  seedInput.value = String(seed);
  seedError.textContent = '';
  seedInput.removeAttribute('aria-invalid');
  writeHash(state);
  scheduleUpdates();
}

seedInput.addEventListener('input', () => {
  const ok = seedInput.value.trim() === '' || parseSeed(seedInput.value) !== null;
  seedError.textContent = ok ? '' : `Use a whole number from 0 to ${MAX_SEED}.`;
  if (ok) seedInput.removeAttribute('aria-invalid');
  else seedInput.setAttribute('aria-invalid', 'true');
});

seedInput.addEventListener('change', () => {
  const v = parseSeed(seedInput.value);
  if (v === null) {
    seedInput.setAttribute('aria-invalid', 'true');
    seedError.textContent = `Use a whole number from 0 to ${MAX_SEED}; still showing ${state.seed}.`;
    return;
  }
  if (v !== state.seed) applySeed(v);
  else seedInput.value = String(v);
});

seedButton.addEventListener('click', () => {
  // A fresh weather variation for the player; the simulation itself stays deterministic for it.
  applySeed(Math.floor(Math.random() * 1_000_000));
});

weekInput.addEventListener('input', () => {
  state.week = Number(weekInput.value);
  writeHash(state);
  renderLabels();
  renderWeek();
  renderLadder();
});

hourInput.addEventListener('input', () => {
  state.hourInWeek = Number(hourInput.value);
  writeHash(state);
  renderLabels();
  renderLadder();
});

solarInput.addEventListener('input', () => {
  state.extraGw = solarValue(Number(solarInput.value), state.zone);
  writeHash(state);
  renderLabels();
  scheduleUpdates();
});

window.addEventListener('hashchange', () => {
  applyHash();
  syncControls();
  writeHash(state);
  renderWeek();
  renderLadder();
  renderSeries();
  scheduleUpdates();
});

let resizeFrame = 0;
window.addEventListener('resize', () => {
  for (const c of Object.values(charts)) c.resize();
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (yearPayload !== null) renderYear();
    renderSeries();
  });
});

// ---------------------------------------------------------------------------
// Go

syncControls();
writeHash(state);
renderSeries();
requestUpdates();
