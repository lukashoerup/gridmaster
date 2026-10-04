/**
 * Toy 1 "Hubs" in the browser. Holds the game, runs the clock, draws the
 * page and keeps the session log. The rules live in src/toy/rules.
 */
import { loadPlaceholderInputs } from '../../data/placeholder';
import {
  BATTERY,
  BLOCK_MW,
  COST,
  DAYS,
  HUBS,
  HubsGame,
  SECONDS_PER_YEAR_AT_X1,
  SessionLog,
  distanceKm,
  hubById,
  hubIndex,
  hubName,
  obviousBot,
  plantYearlyCost,
  runBotUntil,
  type Action,
  type ClockMode,
  type PlantKind,
  type Speed,
  type YearReview,
} from '../rules';
import { typicalDayChart } from './chart';
import { byId, h } from './dom';
import { eur, mw, pct, price, shortDate, signedEur } from './format';
import { createMap, type Selection } from './map';
import './style.css';

const inputs = loadPlaceholderInputs();
const params = new URLSearchParams(location.search);
const seedParam = params.get('seed');
const seed = seedParam !== null && /^\d+$/.test(seedParam) ? Number(seedParam) >>> 0 : 1 + Math.floor(Math.random() * 99999);
const unlimitedMoney = params.get('money') !== 'limited';
const HOURS_PER_SECOND = 8760 / SECONDS_PER_YEAR_AT_X1;
const LOG_KEY = 'gridmaster-toy1-log';

let game: HubsGame;
let log: SessionLog;
const t0 = performance.now();
const wall = (): number => performance.now() - t0;
let speed: Speed = 0;
let lastSpeed: Speed = 1;
let acc = 0;
let selection: Selection = null;
let reviewOpen = false;
let firstBlueLogged = false;
let newsSeen = 0;

// Build-form state, kept across redraws.
let formKind: PlantKind = 'wind';
let formHub = '';
let formSpot = '';
let formMw = 10;

// ---------------------------------------------------------------------------
// Skeleton

const app = byId<HTMLDivElement>('app');
const dateEl = h('div', { class: 'date' });
const marketEl = h('div', { class: 'market' });
const moneyEl = h('div', { class: 'money' });
const speedDefs: readonly { speed: Speed; label: string; title: string }[] = [
  { speed: 0, label: '❚❚', title: 'Pause (space)' },
  { speed: 1, label: '▶', title: 'Play: a year in about 5 minutes (1)' },
  { speed: 3, label: '▶▶', title: 'Fast ×3 (2)' },
  { speed: 10, label: '▶▶▶', title: 'Fastest ×10 (3)' },
];
const speedButtons = speedDefs.map((d) => {
  const b = h('button', { type: 'button', class: 'speed', title: d.title, 'aria-label': d.title, text: d.label });
  b.addEventListener('click', () => setSpeed(d.speed));
  return b;
});
const logButton = h('button', { type: 'button', class: 'ghost', text: 'Session log' });
logButton.addEventListener('click', () => openLog());
const helpButton = h('button', { type: 'button', class: 'ghost', text: 'How to play' });
helpButton.addEventListener('click', () => openHelp());

const map = createMap((s) => {
  selection = s;
  controlsKey = '';
  render(true);
});
const panelLive = h('div', { class: 'panel-live' });
const panelControls = h('div', { class: 'panel-controls' });
const panel = h('section', { class: 'panel' }, panelLive, panelControls);
const newsEl = h('ul', { class: 'news' });
const toastEl = h('div', { class: 'toast', role: 'status' });
const overlay = h('div', { class: 'overlay hidden' });

app.append(
  h(
    'header',
    { class: 'top' },
    h('div', { class: 'title' }, h('strong', { text: 'Hubs' }), h('span', { class: 'sub', text: ' toy 1 · round 1' })),
    dateEl,
    marketEl,
    h('div', { class: 'speeds' }, ...speedButtons),
    moneyEl,
    h('div', { class: 'tools' }, helpButton, logButton),
  ),
  h('main', { class: 'body' }, h('div', { class: 'mapwrap' }, map.el), panel),
  h('section', { class: 'newswrap' }, h('h3', { text: 'News' }), newsEl),
  toastEl,
  overlay,
);

// ---------------------------------------------------------------------------
// Clock

function modeOf(s: Speed): ClockMode {
  return s === 0 ? 'pause' : s === 1 ? 'x1' : s === 3 ? 'x3' : 'x10';
}

function setSpeed(s: Speed): void {
  if (reviewOpen || game.status !== 'running') return;
  speed = s;
  if (s !== 0) lastSpeed = s;
  log.clock(wall(), game.dateLabel(), modeOf(s));
  speedButtons.forEach((b, i) => b.classList.toggle('on', speedDefs[i]?.speed === s));
}

let last = performance.now();
let lastRender = 0;
function tick(now: number): void {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  if (!reviewOpen && speed > 0 && game.status === 'running') {
    acc += dt * speed * HOURS_PER_SECOND;
    const n = Math.floor(acc);
    if (n > 0) {
      acc -= n;
      game.advance(n);
      if (game.firstBlueByYou !== null && !firstBlueLogged) {
        firstBlueLogged = true;
        log.firstBlueByYou(wall(), game.dateLabel(game.firstBlueByYou.hour));
      }
      if (statusOf(game) === 'yearEnd') showReview();
    }
  }
  if (now - lastRender > 150) {
    lastRender = now;
    render(false);
  }
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------------------
// Drawing

let controlsKey = '';

function render(force: boolean): void {
  dateEl.textContent = shortDate(game.dateLabel());
  marketEl.textContent = game.marketOpen ? `Market open · national ${price(game.nationalMean())}` : `Fixed tariff ${price(game.nat.tariff)}`;
  marketEl.classList.toggle('open', game.marketOpen);
  const ytd = game.yearToDate();
  moneyEl.replaceChildren(
    h('span', { class: 'label', text: `${game.year} so far ` }),
    h('span', { class: ytd.profit >= 0 ? 'good' : 'bad', text: signedEur(ytd.profit) }),
    h('span', { class: 'label', text: ' · score ' }),
    h('strong', { text: eur(game.score) }),
  );
  map.draw(game, selection);
  renderPanel(force);
  renderNews();
}

function renderNews(): void {
  if (game.news.length === newsSeen && newsEl.childElementCount > 0) return;
  for (let i = newsSeen; i < game.news.length; i++) {
    const n = game.news[i];
    if (n !== undefined) log.event(wall(), game.dateLabel(n.hour), n.text);
    if (n !== undefined && (n.kind === 'market' || n.kind === 'weather' || (n.kind === 'you' && n.text.includes('blue')))) toast(n.text);
  }
  newsSeen = game.news.length;
  const items = game.news.slice(-7).reverse();
  newsEl.replaceChildren(...items.map((n) => h('li', { class: `n-${n.kind}` }, h('span', { class: 'when', text: shortDate(game.dateLabel(n.hour)) }), ` ${n.text}`)));
}

function renderPanel(force: boolean): void {
  if (selection === null) {
    panelLive.replaceChildren(
      h('h2', { text: 'The region' }),
      h('p', { text: 'Six grid hubs. A hub is red when it is hungry (its price is above the national price), green when balanced, blue when flooded (below).' }),
      h('p', { text: 'Click a hub to see its typical day, or a spot to scout it and build a wind or solar plant there.' }),
      overview(),
    );
    panelControls.replaceChildren();
    return;
  }
  if (selection.kind === 'hub') renderHub(selection.id, force);
  else renderSpot(selection.id, force);
}

function overview(): HTMLElement {
  const rows = HUBS.map((hub, i) => {
    const st = game.hubStatus(i);
    return h(
      'tr',
      {},
      h('td', {}, h('span', { class: `chip ${st.colour}` }), ` ${hub.name}`),
      h('td', { class: 'num', text: `${st.ratio >= 1 ? '+' : ''}${Math.round((st.ratio - 1) * 100)}%` }),
      h('td', { class: 'num', text: mw(st.playerMw) }),
      h('td', { class: 'num', text: mw(game.freeRoom(hub.id)) }),
    );
  });
  return h('table', { class: 'grid' }, h('thead', {}, h('tr', {}, h('th', { text: 'Hub' }), h('th', { class: 'num', text: 'vs national' }), h('th', { class: 'num', text: 'yours' }), h('th', { class: 'num', text: 'room left' }))), h('tbody', {}, ...rows));
}

function renderHub(id: string, force: boolean): void {
  const i = hubIndex(id);
  const hub = hubById(id);
  const st = game.hubStatus(i);
  const td = game.typicalDay(i);
  const word = st.colour === 'red' ? 'Hungry' : st.colour === 'blue' ? 'Flooded' : 'Balanced';
  const rel = Math.round((st.ratio - 1) * 100);
  const yourEffect = td.meanPrice - td.meanWithoutYou;
  const parent = hub.parent === 'grid' ? 'the national grid' : hubName(hub.parent);
  panelLive.replaceChildren(...present(
    h('h2', {}, h('span', { class: `chip ${st.colour}` }), ` ${hub.name}`),
    h('p', { class: `state ${st.colour}` }, h('strong', { text: word }), `: over the last 4 weeks its price was ${rel >= 0 ? `${rel}% above` : `${-rel}% below`} the national price (${price(td.meanPrice)} against ${price(td.meanNational)}).`),
    h('h3', { text: 'Typical day (last 4 weeks)' }),
    typicalDayChart(td, st.colour, st.batteries > 0 ? game.batteryPlanOf(i) : null),
    h(
      'div',
      { class: 'legend' },
      h('span', { class: `lg hubprice ${st.colour}`, text: 'hub price' }),
      h('span', { class: 'lg national', text: 'national' }),
      st.playerMw > 0 ? h('span', { class: 'lg without', text: 'without you' }) : null,
      h('span', { class: 'lg output', text: 'your output (MW)' }),
      h('span', { class: 'lg demand', text: 'demand (MW)' }),
      st.batteries > 0 ? h('span', { class: 'lg plan', text: 'battery: charge / discharge' }) : null,
    ),
    st.playerMw > 0 && Math.abs(yourEffect) >= 0.5
      ? h('p', { class: 'effect' }, `Your plants ${yourEffect < 0 ? 'pull this hub’s price down' : 'lift this hub’s price'} by ${price(Math.abs(yourEffect))} on average.`)
      : null,
    h(
      'dl',
      { class: 'facts' },
      h('dt', { text: 'Room' }),
      h('dd', { text: `${mw(game.freeRoom(id))} free of ${mw(hub.roomMw)} (yours ${mw(st.playerMw)}, others ${mw(st.backgroundMw)})` }),
      h('dt', { text: 'Link' }),
      h('dd', { text: `${mw(hub.linkMw)} to ${parent}, ${pct(st.linkUse)} used on average` }),
      h('dt', { text: 'Demand' }),
      h('dd', { text: `${mw(hub.demandMw)} on average (${hub.kind === 'industry' ? 'industry: weekday daytime' : hub.kind === 'town' ? 'a town: evening peak, winter' : 'countryside'})` }),
      h('dt', { text: 'Hours' }),
      h('dd', { text: `flooded ${pct(td.floodedShare)}, hungry ${pct(td.hungryShare)} of the last 4 weeks` }),
    ),
  ));
  const key = `hub:${id}:${game.plants.length}:${game.batteries.length}:${game.plants.filter((p) => p.removedAt !== null).length}:${game.batteries.filter((b) => b.removedAt !== null).length}:${Math.floor(game.freeRoom(id))}:${game.scouted.size}:${game.scouting.size}`;
  if (!force && key === controlsKey) {
    updateLedgers();
    return;
  }
  controlsKey = key;
  const mine = game.plants.filter((p) => p.hub === id && p.removedAt === null);
  const batteries = game.batteries.filter((b) => b.hub === id && b.removedAt === null).length;
  const addBattery = h('button', { type: 'button', text: `Add a battery (${BATTERY.mw} MW, ${BATTERY.mwh} MWh) · ${eur(COST.batteryPerUnitYear)}/yr` });
  addBattery.addEventListener('click', () => doAct({ type: 'battery', hub: id }, `add a battery at ${hub.name}`));
  const removeBattery = h('button', { type: 'button', class: 'ghost', text: 'Remove one', disabled: batteries === 0 });
  removeBattery.addEventListener('click', () => doAct({ type: 'removeBattery', hub: id }, `remove a battery at ${hub.name}`));
  panelControls.replaceChildren(
    h('h3', { text: `Your plants here (${mine.length})` }),
    plantList(mine.map((p) => p.id)),
    h('h3', { text: `Batteries here: ${batteries}` }),
    h('p', { class: 'hint', text: 'A battery charges in the hub’s blue hours (its cheapest hours, or when it is flooded) and discharges in its red hours (its dearest). It pays where the hub’s typical day has a spread.' }),
    h('div', { class: 'row' }, addBattery, removeBattery),
    h('h3', { text: 'Connect a plant here' }),
    buildForm('hub', id),
  );
}

function renderSpot(id: string, force: boolean): void {
  const s = game.spot(id);
  const revealed = game.isRevealed(id);
  const scouting = game.scouting.get(id);
  panelLive.replaceChildren(
    h('h2', { text: s.name }),
    h('p', { class: 'hint', text: s.hint }),
    revealed
      ? h('p', {}, `Wind ${pct(s.windQ)} of a typical site · sun ${pct(s.solarQ)} · room for ${mw(game.spotFree(id))} more (of ${mw(s.sizeMw)}).`)
      : h('p', {}, scouting !== undefined ? `Being scouted; ready ${shortDate(game.dateLabel(scouting))}.` : `Not scouted: its wind and sun are unknown until you scout it or build on it. Room for ${mw(s.sizeMw)}.`),
  );
  const key = `spot:${id}:${game.plants.length}:${game.plants.filter((p) => p.removedAt !== null).length}:${revealed}:${scouting ?? ''}:${HUBS.map((hb) => Math.floor(game.freeRoom(hb.id))).join(',')}`;
  if (!force && key === controlsKey) {
    updateLedgers();
    return;
  }
  controlsKey = key;
  const scout = h('button', { type: 'button', text: `Scout (${eur(COST.scout)}, ${DAYS.scout} days)`, disabled: revealed || scouting !== undefined });
  scout.addEventListener('click', () => doAct({ type: 'scout', spot: id }, `scout ${s.name}`));
  const mine = game.plants.filter((p) => p.spot === id && p.removedAt === null);
  panelControls.replaceChildren(...present(
    revealed ? null : h('div', { class: 'row' }, scout),
    h('h3', { text: 'Build a plant here' }),
    buildForm('spot', id),
    h('h3', { text: `Your plants here (${mine.length})` }),
    plantList(mine.map((p) => p.id)),
  ));
}

function plantList(ids: readonly string[]): HTMLElement {
  if (ids.length === 0) return h('p', { class: 'hint', text: 'None yet.' });
  return h(
    'ul',
    { class: 'plants' },
    ...ids.map((pid) => {
      const p = game.plants.find((pp) => pp.id === pid);
      if (p === undefined) return h('li');
      const rm = h('button', { type: 'button', class: 'ghost small', text: `Take down (${eur(p.yearlyCost * COST.removeShareOfYear)})` });
      rm.addEventListener('click', () => doAct({ type: 'remove', plant: p.id }, `take down ${p.mw} MW ${p.kind} at ${game.spot(p.spot).name} → ${hubName(p.hub)}`));
      const status = p.readyAt > game.now ? `building, ready ${shortDate(game.dateLabel(p.readyAt))}` : '';
      return h(
        'li',
        {},
        h('div', {}, h('strong', { text: `${p.mw} MW ${p.kind === 'wind' ? 'wind' : 'solar'}` }), ` ${game.spot(p.spot).name} → ${hubName(p.hub)} (${p.km} km)`),
        h('div', { class: 'ledger', 'data-plant': p.id, text: status }),
        h('div', { class: 'hint' }, `costs ${eur(p.yearlyCost)}/yr `, rm),
      );
    }),
  );
}

function updateLedgers(): void {
  panelControls.querySelectorAll<HTMLElement>('[data-plant]').forEach((el) => {
    const id = el.dataset['plant'] ?? '';
    const p = game.plants.find((pp) => pp.id === id);
    if (p === undefined) return;
    if (p.readyAt > game.now) {
      el.textContent = `building, ready ${shortDate(game.dateLabel(p.readyAt))}`;
      return;
    }
    const l = game.plantSoFar(id);
    if (l === null) return;
    const avg = l.mwh > 0 ? l.earned / l.mwh : 0;
    el.textContent = `${game.year} so far: earned ${eur(l.earned)} at ${price(avg)}, cost ${eur(l.cost)} → ${signedEur(l.earned - l.cost)}`;
    el.className = `ledger ${l.earned - l.cost >= 0 ? 'good' : 'bad'}`;
  });
}

/** The build form, anchored on a spot (choose the hub) or on a hub (choose the spot). */
function buildForm(anchor: 'spot' | 'hub', id: string): HTMLElement {
  if (anchor === 'spot') {
    if (formSpot !== id || formHub === '') {
      // A new spot: start from its nearest hub with room.
      const s = game.spot(id);
      formHub = [...HUBS].filter((hb) => game.freeRoom(hb.id) >= BLOCK_MW).sort((a, b) => distanceKm(s, a) - distanceKm(s, b))[0]?.id ?? formHub;
    }
    formSpot = id;
  } else {
    if (formHub !== id || formSpot === '') {
      // A new hub: start from its nearest spot with space.
      const hub = hubById(id);
      formSpot = [...game.spots].filter((s) => game.spotFree(s.id) >= BLOCK_MW).sort((a, b) => distanceKm(a, hub) - distanceKm(b, hub))[0]?.id ?? formSpot;
    }
    formHub = id;
  }
  if (formSpot === '' || game.spots.every((s) => s.id !== formSpot)) formSpot = game.spots[0]?.id ?? '';
  if (formHub === '' || HUBS.every((hb) => hb.id !== formHub)) {
    const s = game.spot(formSpot);
    formHub = [...HUBS].sort((a, b) => distanceKm(s, a) - distanceKm(s, b))[0]?.id ?? '';
  }
  const kind = h('div', { class: 'seg' });
  for (const k of ['wind', 'solar'] as const) {
    const b = h('button', { type: 'button', class: formKind === k ? 'on' : '', text: k === 'wind' ? 'Wind' : 'Solar' });
    b.addEventListener('click', () => {
      formKind = k;
      controlsKey = '';
      render(true);
    });
    kind.append(b);
  }
  let picker: HTMLSelectElement;
  if (anchor === 'spot') {
    const s = game.spot(id);
    picker = h('select', { 'aria-label': 'Hub' });
    for (const hub of [...HUBS].sort((a, b) => distanceKm(s, a) - distanceKm(s, b))) {
      const st = game.hubStatus(hubIndex(hub.id));
      const word = st.colour === 'red' ? 'hungry' : st.colour === 'blue' ? 'flooded' : 'balanced';
      const o = h('option', { value: hub.id, text: `${hub.name} · ${distanceKm(s, hub)} km · ${word} · room ${Math.floor(game.freeRoom(hub.id))} MW` });
      if (hub.id === formHub) o.selected = true;
      picker.append(o);
    }
    picker.addEventListener('change', () => {
      formHub = picker.value;
      controlsKey = '';
      render(true);
    });
  } else {
    const hub = hubById(id);
    picker = h('select', { 'aria-label': 'Spot' });
    for (const s of [...game.spots].sort((a, b) => distanceKm(a, hub) - distanceKm(b, hub))) {
      const q = game.isRevealed(s.id) ? `wind ${pct(s.windQ)} · sun ${pct(s.solarQ)}` : 'unscouted';
      const o = h('option', { value: s.id, text: `${s.name} · ${distanceKm(s, hub)} km · ${q} · room ${game.spotFree(s.id)} MW` });
      if (s.id === formSpot) o.selected = true;
      picker.append(o);
    }
    picker.addEventListener('change', () => {
      formSpot = picker.value;
      controlsKey = '';
      render(true);
    });
  }
  const max = game.maxBuild(formSpot, formHub);
  if (formMw > max) formMw = max;
  if (formMw < BLOCK_MW && max >= BLOCK_MW) formMw = Math.min(10, max);
  const size = h('select', { 'aria-label': 'Size' });
  for (let m = BLOCK_MW; m <= max; m += BLOCK_MW) {
    const o = h('option', { value: String(m), text: `${m} MW` });
    if (m === formMw) o.selected = true;
    size.append(o);
  }
  size.addEventListener('change', () => {
    formMw = Number(size.value);
    controlsKey = '';
    render(true);
  });
  const s = game.spot(formSpot);
  const hub = hubById(formHub);
  const km = distanceKm(s, hub);
  const cost = plantYearlyCost(formKind, Math.max(formMw, BLOCK_MW), km);
  const go = h('button', { type: 'button', class: 'primary', text: `Build · ${eur(cost)}/yr`, disabled: max < BLOCK_MW });
  go.addEventListener('click', () => {
    const before = game.hubStatus(hubIndex(formHub));
    doAct(
      { type: 'build', kind: formKind, spot: formSpot, hub: formHub, mw: formMw },
      `build ${formMw} MW ${formKind} at ${s.name} → ${hub.name} (${km} km; hub ${before.colour} ${Math.round((before.ratio - 1) * 100)}%; spot ${game.isRevealed(formSpot) ? `wind ${pct(s.windQ)} sun ${pct(s.solarQ)}` : 'unscouted'})`,
    );
  });
  const note =
    max < BLOCK_MW
      ? `No room: ${s.name} has ${game.spotFree(formSpot)} MW free and ${hub.name} ${Math.floor(game.freeRoom(formHub))} MW.`
      : `${km} km line. Running in ${formKind === 'wind' ? DAYS.wind : DAYS.solar} days. Costs are charged through the year; money is near-unlimited.`;
  return h('div', { class: 'build' }, kind, h('div', { class: 'row' }, picker, size), h('p', { class: 'hint', text: note }), h('div', { class: 'row' }, go));
}

function doAct(action: Action, what: string): void {
  const why = game.act(action);
  if (why !== null) {
    toast(why);
    return;
  }
  log.decision(wall(), game.dateLabel(), what);
  saveLog();
  controlsKey = '';
  render(true);
}

let toastTimer = 0;
function toast(text: string): void {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 4500);
}

// ---------------------------------------------------------------------------
// The year review

function showReview(): void {
  const r = game.reviews[game.reviews.length - 1];
  if (r === undefined) return;
  reviewOpen = true;
  log.clock(wall(), game.dateLabel(), 'review');
  log.note(wall(), game.dateLabel(), `year ${r.year} closed: profit ${Math.round(r.profit)}`);
  saveLog();
  const next = h('button', { type: 'button', class: 'primary', text: game.year >= 2025 ? 'Finish' : `Plan ${r.year + 1}` });
  next.addEventListener('click', () => {
    next.disabled = true;
    next.textContent = 'Clearing the market…';
    window.setTimeout(() => {
      game.startNextYear();
      overlay.classList.add('hidden');
      reviewOpen = false;
      speed = 0;
      log.clock(wall(), game.dateLabel(), 'pause');
      speedButtons.forEach((b, i) => b.classList.toggle('on', speedDefs[i]?.speed === 0));
      controlsKey = '';
      render(true);
      if (game.status === 'over') openLog();
    }, 30);
  });
  openOverlay(reviewBody(r), next);
}

function reviewBody(r: YearReview): HTMLElement {
  const plants = [...r.plants].sort((a, b) => a.profit - b.profit);
  const rows = plants.map((p) => {
    const alt = p.alternative;
    const altText = alt !== null && alt.profit > p.profit + 1000 ? `at ${hubName(alt.hub)}: ${signedEur(alt.profit - p.profit)}` : alt !== null ? 'this hub was the best choice' : '';
    return h(
      'tr',
      {},
      h('td', {}, `${p.mw} MW ${p.kind === 'wind' ? 'wind' : 'solar'}, ${game.spot(p.spot).name} → ${hubName(p.hub)}${p.removed ? ' (taken down)' : ''}`),
      h('td', { class: 'num', text: p.earnedPrice === null ? '–' : price(p.earnedPrice) }),
      h('td', { class: `num ${p.profit >= 0 ? 'good' : 'bad'}`, text: signedEur(p.profit) }),
      h('td', { class: 'whatif', text: altText }),
    );
  });
  const bats = r.batteries.map((b) =>
    h(
      'tr',
      {},
      h('td', {}, `${b.units} batter${b.units === 1 ? 'y' : 'ies'} at ${hubName(b.hub)}`),
      h('td', { class: 'num', text: '' }),
      h('td', { class: `num ${b.earned - b.cost >= 0 ? 'good' : 'bad'}`, text: signedEur(b.earned - b.cost) }),
      h('td', { class: 'whatif', text: Math.abs(b.plantsDelta) >= 1000 ? `without it, your plants there would have earned ${eur(Math.abs(b.plantsDelta))} ${b.plantsDelta > 0 ? 'less' : 'more'}` : '' }),
    ),
  );
  const hubs = r.hubs.map((hy) => {
    const ratio = r.nationalMean !== 0 ? hy.meanPrice / r.nationalMean : 1;
    const colour = ratio < 0.9 ? 'blue' : ratio > 1.1 ? 'red' : 'green';
    return h('li', {}, h('span', { class: `chip ${colour}` }), ` ${hubName(hy.hub)} ${price(hy.meanPrice)} · flooded ${Math.round(hy.floodedHours / 24)} days, hungry ${Math.round(hy.hungryHours / 24)} days`);
  });
  const mood = r.mood === 'normal' ? 'a normal weather year' : `a ${r.mood}`;
  return h(
    'div',
    { class: 'review' },
    h('h2', { text: `${r.year} in review` }),
    h('p', {}, `${mood[0]?.toUpperCase() ?? ''}${mood.slice(1)}. National price ${price(r.nationalMean)} on average.`),
    h('p', { class: 'big' }, 'Profit ', h('strong', { class: r.profit >= 0 ? 'good' : 'bad', text: signedEur(r.profit) }), ` · score ${eur(game.score)}`),
    r.other > 0 ? h('p', { class: 'hint', text: `Includes ${eur(r.other)} of scouting and take-down fees.` }) : null,
    rows.length + bats.length > 0
      ? h(
          'table',
          { class: 'grid' },
          h('thead', {}, h('tr', {}, h('th', { text: 'Plant' }), h('th', { class: 'num', text: 'earned' }), h('th', { class: 'num', text: 'profit' }), h('th', { text: 'what if (same prices)' }))),
          h('tbody', {}, ...rows, ...bats),
        )
      : h('p', { text: 'You had no plants this year.' }),
    h('h3', { text: 'The hubs this year' }),
    h('ul', { class: 'hubs' }, ...hubs),
  );
}

// ---------------------------------------------------------------------------
// Overlays: help, log

function openOverlay(body: HTMLElement, ...actions: HTMLElement[]): void {
  overlay.replaceChildren(h('div', { class: 'card' }, body, h('div', { class: 'row end' }, ...actions)));
  overlay.classList.remove('hidden');
}

function closeButton(): HTMLButtonElement {
  const b = h('button', { type: 'button', class: 'primary', text: 'Back to the map' });
  b.addEventListener('click', () => {
    overlay.classList.add('hidden');
    reviewOpen = false;
  });
  return b;
}

function openHelp(): void {
  if (reviewOpen) return;
  setSpeed(0);
  openOverlay(
    h(
      'div',
      { class: 'help' },
      h('h2', { text: 'Hubs: how to play' }),
      h('p', {}, h('strong', { text: 'The rule: ' }), 'your power earns your hub’s price at the hour you make it, and the more power at your hub that hour, the lower that price.'),
      h('ul', {},
        h('li', { text: 'Each hub is a grid substation with towns or industry behind it, limited room for plants, and a link to the rest of the grid.' }),
        h('li', { text: 'While its link has room, a hub’s price is the national price. When the link is full, it separates: a flooded hub (blue) falls, a hungry hub (red) rises.' }),
        h('li', { text: 'Scout a spot to learn its wind and sun, then build wind or solar there and connect it to a hub. Lines cost by the km.' }),
        h('li', { text: 'A hub’s typical day shows where its price is high and low, and your output on top. Batteries move energy from blue hours to red.' }),
        h('li', { text: 'Each year ends with a review: what each plant earned, and what it would have earned at another hub.' }),
        h('li', { text: 'Money is near-unlimited on purpose: the score is your total profit. Surprises: the market opens some time between 1998 and 2001; storms and calm winters; others build too.' }),
      ),
      h('p', { class: 'hint', text: 'Keys: space pause · 1 play · 2 fast · 3 fastest.' }),
    ),
    closeButton(),
  );
}

function openLog(): void {
  if (reviewOpen && game.status !== 'over') return;
  if (game.status === 'running') setSpeed(0);
  const t = wall();
  const sum = log.summary(t, game.dateLabel(), game.score);
  const data = log.toJSON(t, game.dateLabel(), game.score);
  const json = JSON.stringify(data, null, 1);
  const download = h('button', { type: 'button', text: 'Download the log' });
  download.addEventListener('click', () => {
    const a = h('a', { href: URL.createObjectURL(new Blob([json], { type: 'application/json' })), download: `hubs-log-seed${seed}.json` });
    document.body.append(a);
    a.click();
    a.remove();
  });
  const copy = h('button', { type: 'button', text: 'Copy the log' });
  copy.addEventListener('click', () => {
    void navigator.clipboard?.writeText(json).then(
      () => toast('Log copied.'),
      () => toast('Could not copy; use the text box.'),
    );
  });
  const botOut = h('p', { class: 'hint', text: '' });
  const bot = h('button', { type: 'button', text: 'How would the obvious bot do on this map?' });
  bot.addEventListener('click', () => {
    bot.disabled = true;
    botOut.textContent = 'The bot is playing to today’s date…';
    window.setTimeout(() => {
      const r = runBotUntil(inputs, seed, obviousBot, game.now);
      botOut.textContent = `The obvious bot ("connect the nearest windy spot to the reddest hub with room"), same map, same date: score ${eur(r.score)} with ${r.playerMw} MW. Yours: ${eur(game.score)}.`;
      log.note(wall(), game.dateLabel(), `obvious bot to this date: ${r.score}`);
      saveLog();
    }, 30);
  });
  const area = h('textarea', { class: 'logtext', readonly: true, rows: '4' });
  area.value = json;
  openOverlay(
    h(
      'div',
      { class: 'log' },
      h('h2', { text: game.status === 'over' ? 'The run is over' : 'Session log' }),
      h('dl', { class: 'facts' },
        h('dt', { text: 'Played' }), h('dd', { text: `${sum.minutes.toFixed(1)} minutes, to ${shortDate(sum.gameDate)}` }),
        h('dt', { text: 'Decisions' }), h('dd', { text: `${sum.decisions} (${sum.decisionsPerMinute.toFixed(1)} a minute)` }),
        h('dt', { text: 'Time at speed' }), h('dd', { text: `paused ${sum.minutesIn.pause.toFixed(1)} · ×1 ${sum.minutesIn.x1.toFixed(1)} · ×3 ${sum.minutesIn.x3.toFixed(1)} · ×10 ${sum.minutesIn.x10.toFixed(1)} · reviews ${sum.minutesIn.review.toFixed(1)} min` }),
        h('dt', { text: 'Top speed' }), h('dd', { text: `${pct(sum.topSpeedShare)} of the time; longest stretch ${sum.longestTopSpeedMinutes.toFixed(1)} min` }),
        h('dt', { text: 'First hub blue by you' }), h('dd', { text: sum.firstBlueByYouMinute === null ? 'not yet' : `minute ${sum.firstBlueByYouMinute.toFixed(1)} (${shortDate(sum.firstBlueByYouDate ?? '')})` }),
        h('dt', { text: 'Score' }), h('dd', { text: eur(sum.score) }),
        h('dt', { text: 'Map' }), h('dd', { text: `seed ${seed}` }),
      ),
      h('div', { class: 'row' }, bot),
      botOut,
      h('h3', { text: 'After 15–20 minutes, ask yourself' }),
      h('ol', {},
        h('li', { text: 'Did you want to keep playing?' }),
        h('li', { text: 'What was the most fun moment?' }),
        h('li', { text: 'When were you just waiting?' }),
        h('li', { text: 'In one sentence, how do you make money here?' }),
        h('li', { text: 'Is there a decision you regret?' }),
      ),
      h('p', { class: 'hint', text: 'Then download or copy the log and send it with your answers.' }),
      // Inside a preview frame downloads are blocked, so offer copying only.
      h('div', { class: 'row' }, window.self === window.top ? download : null, copy),
      area,
    ),
    closeButton(),
  );
}

function saveLog(): void {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log.toJSON(wall(), game.dateLabel(), game.score)));
  } catch {
    // Storage can be unavailable (private windows, previews); the log still exports.
  }
}

function present(...nodes: (Node | null)[]): Node[] {
  return nodes.filter((n): n is Node => n !== null);
}

/** The game's status, read afresh (TypeScript would otherwise keep the narrowing from before `advance`). */
function statusOf(g: HubsGame): HubsGame['status'] {
  return g.status;
}

// ---------------------------------------------------------------------------
// Keys and start

document.addEventListener('keydown', (ev) => {
  if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLSelectElement || ev.target instanceof HTMLTextAreaElement) return;
  if (ev.key === ' ') {
    ev.preventDefault();
    setSpeed(speed === 0 ? lastSpeed : 0);
  } else if (ev.key === '1') setSpeed(1);
  else if (ev.key === '2') setSpeed(3);
  else if (ev.key === '3') setSpeed(10);
  else if (ev.key === 'Escape' && !overlay.classList.contains('hidden') && !(reviewOpen && game.status === 'yearEnd')) {
    overlay.classList.add('hidden');
    reviewOpen = false;
  }
});

dateEl.textContent = 'Clearing the first year…';
window.setTimeout(() => {
  game = new HubsGame(inputs, seed, { unlimitedMoney });
  log = new SessionLog('hubs', seed, new Date().toISOString());
  log.note(wall(), game.dateLabel(), `market opens ${game.dateLabel(game.marketOpensAt)} (hidden from the player)`);
  speedButtons.forEach((b, i) => b.classList.toggle('on', speedDefs[i]?.speed === 0));
  render(true);
  openHelp();
  requestAnimationFrame((now) => {
    last = now;
    tick(now);
  });
}, 20);

