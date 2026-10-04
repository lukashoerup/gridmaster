/**
 * The one-zone prototype in the browser: Western Denmark, 1995–2025.
 * Holds the session (game state, the year's market, the market provider),
 * runs the clock, and draws the page. The rules live in src/game.
 */
import { loadPlaceholderInputs } from '../data/placeholder';
import {
  MODELS,
  SECONDS_PER_YEAR_AT_X1,
  START_YEAR,
  MarketProvider,
  advance,
  answerOffer,
  closeYear,
  companyValue,
  dateLabel,
  deserialize,
  dismissCard,
  newGame,
  openYear,
  resumeMarket,
  retailPrice,
  serialize,
  toDate,
  yearDone,
  type Card,
  type GameState,
  type MarketYear,
  type Speed,
  type YearReport,
} from '../game';
import { dayChartSvg } from './chart';
import { byId, h, replaceIfChanged } from './dom';
import { count, money, mw, mwh, price } from './format';
import { createMap } from './map';
import { assetsPanel, buildPanel, financePanel, reportsPanel, type DeskContext, type Panel } from './panels';
import { reportBody } from './report';
import { clearSave, readSave, tunedMode, writeSave } from './storage';
import './style.css';

const inputs = loadPlaceholderInputs();
/** Round 1's comparison mode (tasks/done/2026-10-04-fun-core-toy.md part c): `play.html?tuned=1`. */
const TUNED = tunedMode();
const HOURS_PER_SECOND = 8760 / SECONDS_PER_YEAR_AT_X1;
const HOUSEHOLD_MWH = 4;

interface Session {
  readonly state: GameState;
  market: MarketYear | null;
  readonly provider: MarketProvider;
}

let session: Session | null = null;
let speed: Speed = 0;
let lastSpeed: Speed = 1;
let selected: string | null = null;
type Tab = 'build' | 'assets' | 'finance' | 'reports';
let tab: Tab = 'build';
let preparing = false;
let viewingReport: YearReport | null = null;
let deskHover = false;
let lastSave = 0;

// ---------------------------------------------------------------------------
// Page skeleton

const app = byId<HTMLDivElement>('app');

const dateEl = h('div', { class: 'date' });
const hourEl = h('span', { class: 'hour' });
const phaseEl = h('div', { class: 'phase' });
const speedDefs: readonly { speed: Speed; label: string; title: string }[] = [
  { speed: 0, label: '❚❚', title: 'Pause (space)' },
  { speed: 1, label: '▶', title: 'Play: a year in about 2½ minutes (1)' },
  { speed: 3, label: '▶▶', title: 'Fast (2)' },
  { speed: 10, label: '▶▶▶', title: 'Fastest (3)' },
];
const speedButtons = speedDefs.map((d) => {
  const b = h('button', { type: 'button', class: 'speed', title: d.title, 'aria-label': d.title, text: d.label });
  b.addEventListener('click', () => setSpeed(d.speed));
  return b;
});
const figure = (label: string): [HTMLElement, HTMLElement] => {
  const v = h('span', { class: 'v' });
  return [h('div', { class: 'stat' }, h('span', { class: 'k', text: label }), v), v];
};
const [cashBox, cashEl] = figure('Cash');
const [valueBox, valueEl] = figure('Company value');
const [mwBox, mwEl] = figure('Running');
const [homesBox, homesEl] = figure('Homes supplied');

const topbar = h(
  'header',
  { class: 'topbar' },
  h(
    'div',
    { class: 'when' },
    h('div', { class: 'date-line' }, dateEl, hourEl),
    phaseEl,
    TUNED ? h('div', { class: 'tuned-badge', text: 'Test version: income ×3, three offers' }) : null,
  ),
  h('div', { class: 'speeds', role: 'group', 'aria-label': 'Game speed' }, ...speedButtons),
  h('div', { class: 'stats' }, cashBox, valueBox, mwBox, homesBox),
);

const mapView = createMap((id) => select(id));
const mapPane = h(
  'section',
  { class: 'map-pane', 'aria-label': 'Map' },
  h('div', { class: 'pane-title' }, h('h2', { text: 'Western Denmark' }), h('span', { class: 'muted small', text: 'Jutland and Funen: the DK1 price zone' })),
  mapView.element,
  h(
    'div',
    { class: 'legend' },
    h('span', { class: 'key free' }, 'free site'),
    h('span', { class: 'key yours' }, 'yours'),
    h('span', { class: 'key warned' }, 'being claimed'),
    h('span', { class: 'key taken' }, 'taken'),
  ),
);

const nowPriceEl = h('div', { class: 'now-price' });
const chartHost = h('div', { class: 'chart-host' });
const windBar = h('span', { class: 'bar-fill wind' });
const sunBar = h('span', { class: 'bar-fill sun' });
const windText = h('span', { class: 'bar-text' });
const sunText = h('span', { class: 'bar-text' });
const todayNote = h('p', { class: 'muted small today-note' });
const todayPane = h(
  'section',
  { class: 'today', 'aria-label': 'Today' },
  h('h2', { text: 'Today’s price' }),
  nowPriceEl,
  chartHost,
  h(
    'div',
    { class: 'bars' },
    h('div', { class: 'bar' }, h('span', { class: 'bar-label', text: 'Wind' }), h('span', { class: 'bar-track' }, windBar), windText),
    h('div', { class: 'bar' }, h('span', { class: 'bar-label', text: 'Sun' }), h('span', { class: 'bar-track' }, sunBar), sunText),
  ),
  todayNote,
);
const yearBox = h('section', { class: 'year-box', 'aria-label': 'This year so far' });
const newsList = h('ol', { class: 'news', 'aria-live': 'polite' });
const newsPane = h('section', { class: 'news-pane', 'aria-label': 'News' }, h('h2', { text: 'News' }), newsList);

const ctx: DeskContext = {
  state: () => session?.state ?? null,
  market: () => (preparing ? null : (session?.market ?? null)),
  changed: () => {
    save(true);
    slowRender(true);
  },
  select: (id) => select(id),
  selected: () => selected,
  openReport: (r) => {
    viewingReport = r;
    renderCard();
  },
};
const panels: Record<Tab, Panel> = {
  build: buildPanel(ctx),
  assets: assetsPanel(ctx),
  finance: financePanel(ctx),
  reports: reportsPanel(ctx),
};
const tabNames: Record<Tab, string> = { build: 'Build', assets: 'Your assets', finance: 'Finance', reports: 'Reports' };
const tabButtons = (Object.keys(panels) as Tab[]).map((t) => {
  const b = h('button', { type: 'button', role: 'tab', class: 'tab', id: `tab-${t}`, text: tabNames[t] });
  b.addEventListener('click', () => setTab(t));
  return b;
});
const desk = h('section', { class: 'desk', 'aria-label': 'Your desk' }, h('nav', { class: 'tabs', role: 'tablist' }, ...tabButtons), ...Object.values(panels).map((p) => p.element));
desk.addEventListener('pointerenter', () => (deskHover = true));
desk.addEventListener('pointerleave', () => (deskHover = false));

const seedEl = h('span', { class: 'seed' });
const newGameBox = h('span', { class: 'new-game' });
function renderNewGameBox(confirming: boolean): void {
  if (!confirming) {
    const b = h('button', { type: 'button', class: 'link', text: 'New game…' });
    b.addEventListener('click', () => renderNewGameBox(true));
    newGameBox.replaceChildren(b);
    return;
  }
  const yes = h('button', { type: 'button', class: 'danger', text: 'Start over' });
  const no = h('button', { type: 'button', class: 'link', text: 'Keep playing' });
  yes.addEventListener('click', () => {
    renderNewGameBox(false);
    startNewGame();
  });
  no.addEventListener('click', () => renderNewGameBox(false));
  newGameBox.replaceChildren(h('span', { text: 'Start over? This company will be lost. ' }), yes, no);
}
renderNewGameBox(false);
const footer = h(
  'footer',
  { class: 'foot' },
  h('p', {}, h('strong', { text: 'Prototype, slice 1. ' }), 'Prices come from the market simulation running on placeholder data: the shapes matter, not the exact numbers. Your game saves in this browser at every annual report.'),
  h('p', { class: 'small' }, seedEl, ' · ', newGameBox),
);

const overlay = h('div', { class: 'overlay', hidden: true });
const dialog = h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dialog-title', tabindex: '-1' });
overlay.append(dialog);

app.append(
  topbar,
  h('main', { class: 'layout' }, mapPane, h('div', { class: 'side' }, todayPane, yearBox, newsPane), desk),
  footer,
  overlay,
);

// ---------------------------------------------------------------------------
// Session

function setSpeed(s: Speed): void {
  speed = s;
  if (s > 0) lastSpeed = s;
  speedButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(speedDefs[i]?.speed === s)));
}

function setTab(t: Tab): void {
  tab = t;
  for (const [k, p] of Object.entries(panels) as [Tab, Panel][]) p.element.hidden = k !== t;
  tabButtons.forEach((b, i) => b.setAttribute('aria-selected', String((Object.keys(panels) as Tab[])[i] === t)));
  slowRender(true);
}

function select(id: string | null): void {
  selected = id;
  if (id !== null) setTab('build');
  if (session !== null) mapView.update(session.state, selected);
  slowRender(true);
  if (id !== null && window.matchMedia('(max-width: 899px)').matches) desk.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function save(force = false): void {
  if (session === null) return;
  const now = performance.now();
  if (!force && now - lastSave < 10_000) return;
  lastSave = now;
  writeSave(serialize(session.state));
}

function showBusy(title: string, line: string, progress: number | null): void {
  overlay.hidden = false;
  shownCard = null;
  const nodes: Node[] = [h('h2', { id: 'dialog-title', text: title }), h('p', { text: line })];
  if (progress !== null) nodes.push(h('div', { class: 'progress' }, h('span', { class: 'progress-fill', style: `width:${Math.round(progress * 100)}%` })));
  dialog.replaceChildren(...nodes);
}

function startNewGame(): void {
  clearSave();
  session = null;
  setSpeed(0);
  selected = null;
  viewingReport = null;
  const seed = Math.floor(Math.random() * 4294967296) >>> 0;
  showBusy('A new game', 'Preparing the weather and the market for 1995…', null);
  window.setTimeout(() => {
    const provider = new MarketProvider(inputs, seed);
    const state = newGame(seed, inputs, { tuned: TUNED });
    const market = openYear(state, provider);
    session = { state, market, provider };
    preparing = false;
    seedEl.textContent = `Seed ${seed}`;
    save(true);
    slowRender(true);
    renderCard();
  }, 30);
}

function resumeGame(state: GameState): void {
  setSpeed(0);
  const provider = new MarketProvider(inputs, state.seed);
  const gen = resumeMarket(provider, state);
  const total = Math.max(1, state.year - START_YEAR + 1);
  const step = (): void => {
    let r: IteratorResult<number, MarketYear>;
    try {
      r = gen.next();
    } catch {
      startNewGame();
      return;
    }
    if (r.done === true) {
      session = { state, market: r.value, provider };
      preparing = false;
      seedEl.textContent = `Seed ${state.seed}`;
      slowRender(true);
      renderCard();
      return;
    }
    showBusy('Welcome back', `Replaying the weather and the market: ${r.value + 1}…`, (r.value - START_YEAR + 1) / total);
    window.setTimeout(step, 0);
  };
  showBusy('Welcome back', 'Replaying the weather and the market…', 0);
  window.setTimeout(step, 30);
}

function boot(): void {
  setSpeed(0);
  setTab('build');
  const text = readSave();
  const saved = text === null ? null : deserialize(text);
  if (saved === null) {
    startNewGame();
    return;
  }
  overlay.hidden = false;
  shownCard = null;
  const cont = h('button', { type: 'button', class: 'primary', text: `Continue: ${dateLabel(saved.t)}` });
  const fresh = h('button', { type: 'button', class: 'quiet', text: 'Start a new game' });
  cont.addEventListener('click', () => resumeGame(saved));
  fresh.addEventListener('click', () => startNewGame());
  dialog.replaceChildren(
    h('h2', { id: 'dialog-title', text: 'Your company in Jutland' }),
    h('p', { text: `You left it on ${dateLabel(saved.t)}, worth ${money(companyValue(saved))}${saved.over !== null ? ', with the chapter over' : ''}.` }),
    h('div', { class: 'actions' }, cont, fresh),
  );
  cont.focus();
}

/** The year is over: report it, then prepare the next year's market behind the report card. */
function endYear(s: Session, market: MarketYear): void {
  closeYear(s.state, market);
  if (s.state.over !== null) {
    save(true);
    return;
  }
  preparing = true;
  s.market = null;
  window.setTimeout(() => {
    s.market = openYear(s.state, s.provider);
    preparing = false;
    save(true);
    renderCard(true);
    slowRender(true);
  }, 60);
}

// ---------------------------------------------------------------------------
// Cards

let shownCard: Card | YearReport | null = null;

function medalLine(state: GameState): Node | null {
  const o = state.over;
  if (o === null) return null;
  const names = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze', none: 'No medal' } as const;
  return h('div', { class: `medal ${o.medal}` }, h('span', { class: 'medal-name', text: names[o.medal] }), h('span', { class: 'medal-value', text: money(o.valueCents) }));
}

function renderCard(force = false): void {
  const s = session;
  if (s === null) return; // the start screen or a busy message owns the dialog
  const card: Card | YearReport | null = viewingReport ?? s.state.cards[0] ?? null;
  if (card === null) {
    overlay.hidden = true;
    shownCard = null;
    return;
  }
  if (card === shownCard && !force) return;
  shownCard = card;
  overlay.hidden = false;
  const state = s.state;
  const nodes: (Node | null)[] = [];
  const buttons: HTMLButtonElement[] = [];
  const dismiss = (): void => {
    if (viewingReport !== null) viewingReport = null;
    else dismissCard(state);
    shownCard = null;
    renderCard();
    save(true);
  };
  if ('ledger' in card) {
    nodes.push(h('h2', { id: 'dialog-title', text: `${card.year} · Annual report` }), ...reportBody(card, state));
    const close = h('button', { type: 'button', class: 'primary', text: 'Close' });
    close.addEventListener('click', dismiss);
    buttons.push(close);
  } else {
    nodes.push(h('h2', { id: 'dialog-title', text: card.title }));
    if (card.kind === 'annual') {
      const r = state.reports.find((x) => x.year === card.year);
      if (r !== undefined) nodes.push(...reportBody(r, state));
    } else {
      if (card.kind === 'end' || card.kind === 'gameover') nodes.push(medalLine(state));
      for (const p of card.body) nodes.push(h('p', { text: p }));
    }
    if (card.kind === 'end' || card.kind === 'gameover') {
      const again = h('button', { type: 'button', class: 'primary', text: 'Start a new game' });
      again.addEventListener('click', () => {
        dismissCard(state);
        startNewGame();
      });
      const look = h('button', { type: 'button', class: 'quiet', text: 'Look around' });
      look.addEventListener('click', dismiss);
      buttons.push(again, look);
    } else if (card.kind === 'offer') {
      // Round 1's tuned mode: accepting can fail (cash, room), which keeps the card open.
      const status = h('p', { class: 'muted small', role: 'status' });
      const answer = (accept: boolean): void => {
        const r = answerOffer(state, accept);
        if (!r.ok) {
          status.textContent = r.message;
          return;
        }
        shownCard = null;
        renderCard();
        save(true);
        slowRender(true);
      };
      const yes = h('button', { type: 'button', class: 'primary', text: 'Accept' });
      const no = h('button', { type: 'button', class: 'quiet', text: 'No, thanks' });
      yes.addEventListener('click', () => answer(true));
      no.addEventListener('click', () => answer(false));
      nodes.push(status);
      buttons.push(yes, no);
    } else {
      const next = card.kind === 'annual' && state.cards.length === 1 && state.over === null;
      const label =
        card.kind === 'welcome'
          ? 'Start'
          : next
            ? preparing
              ? `Preparing ${state.year}…`
              : `Continue to ${state.year}`
            : 'Continue';
      const go = h('button', { type: 'button', class: 'primary', text: label, disabled: next && preparing });
      go.addEventListener('click', dismiss);
      buttons.push(go);
      if (card.kind === 'welcome') {
        nodes.push(h('p', { class: 'muted small', text: 'Tip: space pauses and resumes; 1, 2 and 3 choose the speed.' }));
      }
    }
  }
  dialog.replaceChildren(...nodes.filter((n): n is Node => n !== null), h('div', { class: 'actions' }, ...buttons));
  dialog.scrollTop = 0;
  buttons[0]?.focus({ preventScroll: true });
}

// ---------------------------------------------------------------------------
// Drawing

function homesSupplied(state: GameState): number {
  let mwhYear = 0;
  for (const a of state.assets) {
    if (a.status !== 'operating') continue;
    const factor = a.kind === 'wind' ? a.windFactor : a.sunFactor;
    mwhYear += a.mw * MODELS[a.model].meanCf * factor * 8760;
  }
  return mwhYear / HOUSEHOLD_MWH;
}

function setText(el: HTMLElement, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

function fastRender(): void {
  const s = session;
  if (s === null) return;
  const state = s.state;
  const d = toDate(state.t);
  setText(dateEl, dateLabel(state.t));
  setText(hourEl, `${d.hour < 10 ? '0' : ''}${d.hour}:00`);
  const phase =
    state.over !== null
      ? 'The chapter is over'
      : preparing
        ? 'Closing the year…'
        : state.t < state.marketOpenAt
          ? 'Fixed tariffs'
          : state.t < state.negativeFromAt
            ? 'Hourly market'
            : 'Hourly market · prices can go below zero';
  setText(phaseEl, phase);
  setText(cashEl, money(state.cashCents));
  cashBox.classList.toggle('negative', state.cashCents < 0);
  setText(valueEl, money(companyValue(state)));
  let running = 0;
  for (const a of state.assets) if (a.status === 'operating') running += a.mw;
  setText(mwEl, mw(running));
  setText(homesEl, count(homesSupplied(state)));
}

let lastSlow = 0;
let lastHourDrawn = -1;

function slowRender(force = false): void {
  const now = performance.now();
  if (!force && now - lastSlow < 200) return;
  lastSlow = now;
  const s = session;
  if (s === null) return;
  const state = s.state;
  mapView.update(state, selected);
  const market = preparing ? null : s.market;

  // Today.
  if (market !== null && (force || state.t !== lastHourDrawn)) {
    lastHourDrawn = state.t;
    const h0 = Math.min(market.hours - 24, Math.floor(state.hourOfYear / 24) * 24);
    const hourNow = Math.min(23, state.hourOfYear - h0);
    const prices = Array.from(market.price.subarray(h0, h0 + 24));
    const pNow = market.price[Math.min(market.hours - 1, state.hourOfYear)] ?? 0;
    const fixed = state.t < state.marketOpenAt;
    replaceIfChanged(
      nowPriceEl,
      () => [
        h('span', { class: 'big', text: price(pNow) }),
        h('span', { class: 'muted', text: fixed ? ' fixed price for sellers' : ` at ${hourNow < 10 ? '0' : ''}${hourNow}:00` }),
      ],
      `${Math.round(pNow)}|${fixed}|${hourNow}`,
    );
    const svgText = dayChartSvg(prices, hourNow);
    if (chartHost.dataset['key'] !== svgText) {
      chartHost.dataset['key'] = svgText;
      chartHost.innerHTML = svgText;
    }
    const w = market.windCf[Math.min(market.hours - 1, state.hourOfYear)] ?? 0;
    const sun = market.solarCf[Math.min(market.hours - 1, state.hourOfYear)] ?? 0;
    windBar.style.width = `${Math.round(w * 100)}%`;
    sunBar.style.width = `${Math.round(sun * 100)}%`;
    setText(windText, `${Math.round(w * 100)}%`);
    setText(sunText, `${Math.round(sun * 100)}%`);
    setText(
      todayNote,
      fixed
        ? `Until 1 July 1999 prices are fixed: turbines are paid €80/MWh, and the barn’s panels save the farm about €${Math.round(retailPrice(state.year))}/MWh on its own bill. Bars: how hard the wind and sun are working, as a share of what turbines and panels could make.`
        : 'Prices move hour by hour. When it is windy everywhere, every turbine sells at once and the price falls. Bars: how hard the wind and sun are working right now.',
    );
  } else if (market === null) {
    replaceIfChanged(nowPriceEl, () => [h('span', { class: 'muted', text: 'Preparing the year…' })], 'prep');
  }

  // This year so far.
  if (market !== null) {
    let sum = 0;
    const n = Math.max(1, state.hourOfYear);
    for (let i = 0; i < Math.min(state.hourOfYear, market.hours); i++) sum += market.price[i] ?? 0;
    const L = state.ledger;
    replaceIfChanged(
      yearBox,
      () => [
        h('h2', { text: `${state.year} so far` }),
        h(
          'div',
          { class: 'kv-grid' },
          h('span', { class: 'k', text: 'Earned' }),
          h('span', { class: 'v', text: money(L.revenueCents) }),
          h('span', { class: 'k', text: 'Produced' }),
          h('span', { class: 'v', text: mwh(L.outputMwh) }),
          h('span', { class: 'k', text: 'Your price' }),
          h('span', { class: 'v', text: L.outputMwh > 0 ? price(L.revenueCents / 100 / L.outputMwh) : '–' }),
          h('span', { class: 'k', text: 'Zone average' }),
          h('span', { class: 'v', text: state.hourOfYear > 0 ? price(sum / n) : '–' }),
        ),
      ],
      `${state.year}|${L.revenueCents >> 8}|${Math.round(L.outputMwh)}|${Math.round(sum / n)}`,
    );
  }

  // News.
  const recent = state.notices.slice(-8).reverse();
  replaceIfChanged(
    newsList,
    () =>
      recent.length === 0
        ? [h('li', { class: 'empty muted', text: 'News about your projects, the sites and the market appears here.' })]
        : recent.map((n) => h('li', { class: n.tone }, h('time', { text: dateLabel(n.t) }), h('span', { text: n.text }))),
    `${state.notices.length}|${recent[0]?.t ?? 0}|${recent[0]?.text ?? ''}`,
  );

  // Desk.
  if (force || !deskHover || tab === 'build') panels[tab].refresh();
}

// ---------------------------------------------------------------------------
// The clock

let lastFrame = performance.now();
let carry = 0;

function frame(now: number): void {
  const dt = Math.min(0.25, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  const s = session;
  if (s !== null && s.market !== null && !preparing && speed > 0 && s.state.cards.length === 0 && viewingReport === null && s.state.over === null) {
    carry += dt * HOURS_PER_SECOND * speed;
    const n = Math.floor(carry);
    carry -= n;
    if (n > 0) {
      const market = s.market;
      advance(s.state, market, n);
      if (yearDone(s.state, market)) endYear(s, market);
      save();
    }
  } else {
    carry = 0;
  }
  if (s !== null) {
    renderCard();
    fastRender();
    slowRender();
  }
  window.requestAnimationFrame(frame);
}

document.addEventListener('keydown', (e) => {
  const target = e.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return;
  if (e.key === ' ' && target instanceof HTMLButtonElement) return; // the focused button handles its own space
  if (!overlay.hidden) return;
  if (e.key === ' ') {
    e.preventDefault();
    setSpeed(speed === 0 ? lastSpeed : 0);
  } else if (e.key === '1') setSpeed(1);
  else if (e.key === '2') setSpeed(3);
  else if (e.key === '3') setSpeed(10);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save(true);
});

boot();
window.requestAnimationFrame(frame);
