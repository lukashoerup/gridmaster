/**
 * Toy 2 "The board" page: one hub's typical day is the board. The rules live
 * in ../rules (pure, tested); this file draws, handles the battery drag, times
 * the reveal and keeps the session log (docs/design/fun-core.md, round 1).
 */
import './style.css';
import { h, svg } from '../../play/dom';
import {
  BATTERY_MWH,
  BLOCK_MW,
  COSTS,
  HOURS,
  KINDS,
  SLICE_MWH,
  YEARS,
  botScore,
  buy,
  clearPlan,
  moveEnergy,
  newGame,
  outlook,
  runYear,
  sell,
  storedMwh,
  type BoardState,
  type DayView,
  type Kind,
  type MoveResult,
  type Outlook,
  type YearResult,
} from '../rules';

// ------------------------------------------------------------- session log

interface LogEntry {
  readonly t: number;
  readonly year: number;
  readonly action: string;
  readonly detail?: string;
}
const started = performance.now();
const log: LogEntry[] = [];
function note(action: string, detail?: string): void {
  log.push(detail === undefined ? { t: Math.round(performance.now() - started), year: state.year, action } : { t: Math.round(performance.now() - started), year: state.year, action, detail });
}

// ------------------------------------------------------------- state

function seedFromUrl(): number {
  const s = new URLSearchParams(location.search).get('seed');
  if (s !== null && /^\d+$/.test(s)) return Number(s) >>> 0;
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return (a[0] ?? 1) % 1_000_000;
}

let state: BoardState = newGame(seedFromUrl());
let view: { day: DayView; without: readonly number[] | null; month: string | null } | null = null;
let fromHour: number | null = null;
let selectedHour: number | null = 18;
let animating = false;

const app = document.getElementById('app')!;

// ------------------------------------------------------------- formatting

function money(eur: number): string {
  const sign = eur < 0 ? '−' : '';
  const a = Math.abs(eur);
  if (a >= 1e6) return `${sign}€${(a / 1e6).toFixed(a >= 1e7 ? 0 : 1)}m`;
  if (a >= 1e3) return `${sign}€${Math.round(a / 1e3)}k`;
  return `${sign}€${Math.round(a)}`;
}
const perMwh = (p: number): string => `€${Math.round(p)}/MWh`;
const KIND_LABEL: Record<Kind, string> = { wind: 'Wind', solar: 'Solar', battery: 'Battery' };
const hourLabel = (h: number): string => `${String(h).padStart(2, '0')}:00`;

function priceColour(p: number): string {
  if (p < 0) return 'var(--flooded)';
  if (p < 30) return 'var(--cool)';
  if (p < 60) return 'var(--balanced)';
  if (p < 110) return 'var(--warm)';
  return 'var(--hungry)';
}

// ------------------------------------------------------------- the board

// A narrower drawing on phones keeps the labels readable without sideways scroll.
let W = 760;
const LEFT = 34;
const RIGHT = 6;
const PRICE_TOP = 22;
const PRICE_H = 120;
const STACK_TOP = 170;
const STACK_H = 170;
const H_TOTAL = STACK_TOP + STACK_H + 22;
const P_MIN = -20;
const P_MAX = 240;
const colW = (): number => (W - LEFT - RIGHT) / HOURS;
const xOf = (h: number): number => LEFT + h * colW();
const yPrice = (p: number): number => PRICE_TOP + PRICE_H * (1 - (Math.max(P_MIN, Math.min(P_MAX, p)) - P_MIN) / (P_MAX - P_MIN));

function drawBoard(day: DayView, without: readonly number[] | null, month: string | null): Node {
  W = window.innerWidth < 640 ? 420 : 760;
  const cw = colW();
  const nodes: Node[] = [];
  // Price band.
  const zero = yPrice(0);
  nodes.push(svg('text', { x: 4, y: PRICE_TOP - 8, class: 'label-strong' }, document.createTextNode('Price €/MWh: what every MWh earns in that hour')));
  for (const p of [0, 100, 200]) {
    nodes.push(svg('line', { x1: LEFT, x2: W - RIGHT, y1: yPrice(p), y2: yPrice(p), class: 'axis' }));
    nodes.push(svg('text', { x: 4, y: yPrice(p) + 4 }, document.createTextNode(String(p))));
  }
  for (let h = 0; h < HOURS; h++) {
    const p = day.price[h] ?? 0;
    const y = yPrice(p);
    nodes.push(svg('rect', { x: xOf(h) + 2, y: Math.min(y, zero), width: cw - 4, height: Math.max(1.5, Math.abs(zero - y)), fill: priceColour(p), rx: 2 }));
  }
  if (without !== null) {
    const pts = without.map((p, h) => `${xOf(h) + cw / 2},${yPrice(p)}`).join(' ');
    nodes.push(svg('polyline', { points: pts, class: 'without' }));
  }
  // Supply stack against demand.
  const peak = Math.max(...day.demand.map((d, h) => d + Math.max(0, -(day.playerBattery[h] ?? 0)) + Math.max(0, -(day.rivalBattery[h] ?? 0))), ...day.demand.map((_, h) => (day.playerWind[h] ?? 0) + (day.playerSolar[h] ?? 0) + (day.rivalRenewables[h] ?? 0)));
  const mwMax = Math.ceil((peak * 1.08) / 20) * 20;
  const yMw = (mw: number): number => STACK_TOP + STACK_H * (1 - Math.max(0, Math.min(mwMax, mw)) / mwMax);
  nodes.push(svg('text', { x: 4, y: STACK_TOP - 8, class: 'label-strong' }, document.createTextNode('Power MW: who supplies the hub, against its demand')));
  for (const mw of [0, mwMax / 2, mwMax]) {
    nodes.push(svg('line', { x1: LEFT, x2: W - RIGHT, y1: yMw(mw), y2: yMw(mw), class: 'axis' }));
    nodes.push(svg('text', { x: 4, y: yMw(mw) + 4 }, document.createTextNode(String(Math.round(mw)))));
  }
  for (let h = 0; h < HOURS; h++) {
    const pd = Math.max(0, day.playerBattery[h] ?? 0);
    const rd = Math.max(0, day.rivalBattery[h] ?? 0);
    const pc = Math.max(0, -(day.playerBattery[h] ?? 0));
    const rc = Math.max(0, -(day.rivalBattery[h] ?? 0));
    const ren = (day.playerWind[h] ?? 0) + (day.playerSolar[h] ?? 0) + (day.rivalRenewables[h] ?? 0);
    const thermal = Math.max(0, (day.demand[h] ?? 0) + pc + rc - ren - pd - rd);
    const layers: [number, string][] = [
      [day.playerWind[h] ?? 0, 'var(--wind)'],
      [day.playerSolar[h] ?? 0, 'var(--solar)'],
      [pd, 'var(--battery)'],
      [day.rivalRenewables[h] ?? 0, 'var(--rival)'],
      [rd, 'var(--rival-battery)'],
      [thermal, 'var(--thermal)'],
    ];
    let base = 0;
    for (const [mw, fill] of layers) {
      if (mw <= 0.01) continue;
      nodes.push(svg('rect', { x: xOf(h) + 2, y: yMw(base + mw), width: cw - 4, height: Math.max(0.5, yMw(base) - yMw(base + mw)), fill }));
      base += mw;
    }
    // Charging is extra demand, drawn above the demand line.
    if (pc + rc > 0.01) {
      const d = day.demand[h] ?? 0;
      nodes.push(svg('rect', { x: xOf(h) + 5, y: yMw(d + pc + rc), width: cw - 10, height: Math.max(0.5, yMw(d) - yMw(d + pc + rc)), fill: pc > 0 ? 'var(--battery)' : 'var(--rival-battery)', opacity: 0.55 }));
    }
  }
  const demandPts = day.demand.map((d, h) => `${xOf(h)},${yMw(d)} ${xOf(h) + cw},${yMw(d)}`).join(' ');
  nodes.push(svg('polyline', { points: demandPts, class: 'demand' }));
  for (const hh of [0, 6, 12, 18]) nodes.push(svg('text', { x: xOf(hh) + 2, y: H_TOTAL - 4 }, document.createTextNode(hourLabel(hh))));
  // Hit areas for the battery drag and the hour detail.
  for (let hh = 0; hh < HOURS; hh++) {
    nodes.push(svg('rect', { x: xOf(hh), y: 0, width: cw, height: H_TOTAL, class: `col-hit${fromHour === hh ? ' from' : ''}`, 'data-hour': hh }));
  }
  const board = svg('svg', { class: 'board', viewBox: `0 0 ${W} ${H_TOTAL}`, role: 'img', 'aria-label': 'The hub’s day: price per hour above, supply against demand below' }, ...nodes);
  attachDrag(board);
  const wrap = h('div', { class: 'board-wrap' }, board);
  if (month !== null) wrap.append(h('div', { class: 'month', text: month }));
  return wrap;
}

function hourAt(ev: PointerEvent, board: SVGSVGElement): number | null {
  const rect = board.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * W;
  const hh = Math.floor((x - LEFT) / colW());
  return hh >= 0 && hh < HOURS ? hh : null;
}

function attachDrag(board: SVGSVGElement): void {
  let downAt: number | null = null;
  board.addEventListener('pointerdown', (ev) => {
    if (animating) return;
    downAt = hourAt(ev, board);
    if (downAt !== null) board.setPointerCapture(ev.pointerId);
  });
  board.addEventListener('pointerup', (ev) => {
    if (animating || downAt === null) return;
    const upAt = hourAt(ev, board);
    const start = downAt;
    downAt = null;
    if (upAt === null) return;
    if (upAt !== start) {
      tryMove(start, upAt);
      fromHour = null;
    } else if (fromHour !== null && fromHour !== upAt) {
      tryMove(fromHour, upAt);
      fromHour = null;
    } else {
      selectedHour = upAt;
      fromHour = state.blocks.battery > 0 ? (fromHour === upAt ? null : upAt) : null;
    }
    render();
  });
  board.addEventListener('pointercancel', () => {
    downAt = null;
  });
}

const MOVE_TEXT: Record<Exclude<MoveResult, 'ok'>, string> = {
  'no-battery': 'Buy a battery first: then drag from a cheap hour to a dear one.',
  'same-hour': 'Drag to a different hour.',
  full: 'The battery is full for the day. Buy another battery, or clear the plan.',
  'charge-limit': 'The battery cannot charge any faster in that hour. Try another cheap hour.',
  'discharge-limit': 'The battery cannot give back any faster in that hour. Try another dear hour.',
};

function tryMove(a: number, b: number): void {
  const r = moveEnergy(state, a, b);
  note('battery-move', `${a}->${b}:${r}`);
  if (r !== 'ok') toast(MOVE_TEXT[r]);
  else toast(`Moved ${SLICE_MWH} MWh from ${hourLabel(a)} to ${hourLabel(b)}.`);
  selectedHour = b;
}

// ------------------------------------------------------------- panels

function header(): Node {
  const yearText = state.over ? 'Game over' : `Year ${state.year} of ${YEARS}`;
  return h(
    'header',
    { class: 'top' },
    h('div', {}, h('h1', { text: 'The Board · Holstebro hub' }), h('div', { class: 'muted', text: `Toy 2 for testing the fun · game ${state.seed}` })),
    h(
      'div',
      { class: 'score' },
      h('span', {}, h('span', { class: 'muted', text: 'Year ' }), h('b', { text: yearText.replace('Year ', '') })),
      h('span', { title: 'Build fees are paid up front, so this dips when you build' }, h('span', { class: 'muted', text: 'Money so far ' }), h('b', { class: state.profit >= 0 ? 'good' : 'bad', text: money(state.profit) })),
    ),
    h('div', { class: 'tools' }, button('How to play', () => showHelp()), button('Save log', () => exportLog()), button('New game', () => restart(null))),
  );
}

function button(label: string, onClick: () => void, cls = '', disabled = false): HTMLButtonElement {
  const b = h('button', { class: cls, disabled: disabled || animating, text: label });
  b.addEventListener('click', onClick);
  return b;
}

function newsPanel(): Node {
  const c = state.conditions;
  const items: Node[] = [h('h2', { text: `This year${state.over ? '' : ` (year ${state.year})`}` })];
  if (c.surprise !== null) items.push(h('p', { class: 'surprise' }, `${c.surprise.title}. `, h('span', { text: c.surprise.text })));
  for (const n of c.rivalNews) items.push(h('p', { class: 'muted', text: n }));
  return h('section', { class: 'panel news' }, ...items);
}

function plantsPanel(o: Outlook): Node {
  const cards = KINDS.map((k) => {
    const n = state.blocks[k];
    const r = o.byKind[k];
    const size = k === 'battery' ? `${n * BLOCK_MW} MW / ${n * BATTERY_MWH} MWh` : `${n * BLOCK_MW} MW`;
    const earn =
      n === 0
        ? h('div', { class: 'earn muted', text: k === 'battery' ? 'Earns by charging cheap and selling dear.' : 'None yet.' })
        : h(
            'div',
            { class: 'earn' },
            k === 'battery' ? `Earns ${perMwh(r.perMwh)} on what it sells back · ` : `Earns ${perMwh(r.perMwh)} · `,
            h('span', { class: r.profit >= 0 ? 'good' : 'bad', text: `${money(r.profit)} a year after costs` }),
          );
    const extra: Node[] = [];
    if (k === 'battery' && n > 0) {
      extra.push(
        h(
          'div',
          { class: 'row' },
          h('span', { class: 'earn muted', text: `Planned: ${Math.round(storedMwh(state.plan))} of ${n * BATTERY_MWH} MWh a day` }),
          button('Clear plan', () => {
            clearPlan(state);
            note('battery-clear');
            render();
          }, 'small'),
        ),
      );
    }
    return h(
      'div',
      { class: `plant ${k}` },
      h(
        'div',
        { class: 'row' },
        h('h3', { text: KIND_LABEL[k] }),
        h('span', { class: 'count', text: String(n) }),
        h(
          'span',
          {},
          button('−', () => {
            if (sell(state, k)) note('sell', k);
            render();
          }, 'small', state.over || n === 0),
          ' ',
          button('+', () => {
            if (buy(state, k)) note('buy', k);
            render();
          }, 'small', state.over),
        ),
      ),
      h('div', { class: 'cost muted', text: `${size} · build ${money(COSTS[k].build)}, then ${money(COSTS[k].yearly)} a year` }),
      earn,
      ...extra,
    );
  });
  return h('section', { class: 'plants' }, ...cards);
}

function forecastPanel(o: Outlook): Node {
  const lines: Node[] = [];
  lines.push(h('div', {}, h('div', { class: 'muted', text: 'Expected this year' }), h('div', { class: `big ${o.profit >= 0 ? 'good' : 'bad'}`, text: money(o.profit) })));
  const pull = o.hubAverageWithoutYou - o.hubAverage;
  lines.push(
    h(
      'div',
      {},
      h('div', { class: 'muted', text: 'Hub average price' }),
      h('div', { class: 'num', text: `${perMwh(o.hubAverage)}${pull > 0.5 ? ` · ${perMwh(o.hubAverageWithoutYou)} without you` : ''}` }),
    ),
  );
  lines.push(button(state.over ? 'Game over' : `Run year ${state.year} ▶`, () => void playYear(), 'primary', state.over));
  return h('section', { class: 'panel forecast' }, ...lines);
}

function hourDetail(day: DayView, without: readonly number[] | null): Node {
  const hh = selectedHour ?? 18;
  const p = day.price[hh] ?? 0;
  const parts = [`${hourLabel(hh)}: ${perMwh(p)}`];
  if (without !== null && Math.abs((without[hh] ?? p) - p) > 0.5) parts.push(`${perMwh(without[hh] ?? p)} without you`);
  parts.push(`demand ${Math.round(day.demand[hh] ?? 0)} MW`);
  const yours = (day.playerWind[hh] ?? 0) + (day.playerSolar[hh] ?? 0);
  if (yours > 0.05) parts.push(`your wind and sun ${yours.toFixed(1)} MW`);
  const b = day.playerBattery[hh] ?? 0;
  if (Math.abs(b) > 0.05) parts.push(b > 0 ? `your battery gives ${b.toFixed(1)} MW` : `your battery charges ${(-b).toFixed(1)} MW`);
  const tip = fromHour !== null ? ` · Battery: now tap a dear hour to move ${SLICE_MWH} MWh from ${hourLabel(fromHour)}.` : state.blocks.battery > 0 ? ` · Drag from a blue or green hour to a red one to move ${SLICE_MWH} MWh.` : '';
  return h('div', { class: 'hint', text: parts.join(' · ') + tip });
}

function legend(): Node {
  const item = (colour: string, text: string): Node => h('span', {}, h('i', { style: `background:${colour}` }), text);
  return h(
    'div',
    { class: 'legend' },
    item('var(--hungry)', 'hungry: high price'),
    item('var(--balanced)', 'balanced'),
    item('var(--flooded)', 'flooded: price below zero'),
    h('span', {}, '- - - price without your plants'),
    item('var(--wind)', 'your wind'),
    item('var(--solar)', 'your solar'),
    item('var(--battery)', 'your battery'),
    item('var(--rival)', 'Nordhav’s wind and sun'),
    item('var(--rival-battery)', 'Nordhav’s batteries'),
    item('var(--thermal)', 'coal and gas'),
  );
}

// ------------------------------------------------------------- render

function render(): void {
  const o = outlook(state);
  const day = view?.day ?? o.day;
  const without = view === null ? o.priceWithoutYou : view.without;
  app.replaceChildren(
    header(),
    newsPanel(),
    h('section', { class: 'panel' }, drawBoard(day, without, view?.month ?? null), hourDetail(day, without), legend()),
    plantsPanel(o),
    forecastPanel(o),
  );
}

// ------------------------------------------------------------- the year

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function playYear(): Promise<void> {
  if (state.over || animating) return;
  note('run-year', JSON.stringify(state.blocks));
  const planned = { ...state.blocks };
  const result = runYear(state);
  animating = true;
  for (const d of result.days) {
    view = { day: d, without: null, month: d.label };
    render();
    await sleep(260);
  }
  view = null;
  animating = false;
  render();
  showReveal(result, planned);
}

function showReveal(r: YearResult, planned: Record<Kind, number>): void {
  const rows = KINDS.filter((k) => planned[k] > 0).map((k) => {
    const x = r.byKind[k];
    return h(
      'tr',
      {},
      h('td', { text: `${KIND_LABEL[k]} × ${planned[k]}` }),
      h('td', { text: k === 'battery' ? `${perMwh(x.perMwh)} back` : perMwh(x.perMwh) }),
      h('td', { text: money(x.earned) }),
      h('td', { text: money(-x.cost) }),
      h('td', { class: x.profit >= 0 ? 'good' : 'bad', text: money(x.profit) }),
    );
  });
  const diff = r.profit - r.forecastProfit;
  const lines: Node[] = [
    h('h2', { text: `Year ${r.year}: you made ${money(r.profit)}` }),
    h('p', { class: 'muted', text: `You expected ${money(r.forecastProfit)}. ${Math.abs(diff) < 50_000 ? 'Right on the forecast.' : diff > 0 ? `The weather was kind: ${money(diff)} better.` : `The weather was against you: ${money(-diff)} worse.`} The hub averaged ${perMwh(r.hubAverage)}.` }),
  ];
  if (rows.length > 0) {
    lines.push(h('table', {}, h('thead', {}, h('tr', {}, ...['', 'Earned per MWh', 'Earned', 'Costs', 'Profit'].map((t) => h('th', { text: t })))), h('tbody', {}, ...rows)));
  } else {
    lines.push(h('p', { text: 'You owned nothing this year. Add a block, then run the next year.' }));
  }
  if (state.over) {
    lines.push(h('p', {}, 'That was the last year. ', h('b', { text: `Money made: ${money(state.profit)}.` })));
  } else {
    lines.push(h('p', { class: 'muted', text: 'Next: read the news, then plan the coming year.' }));
  }
  modal(lines, state.over ? 'See the result' : `Plan year ${state.year}`, () => {
    note('reveal-closed', String(r.year));
    if (state.over) showEnd();
  });
}

function showEnd(): void {
  const bot = botScore(state.seed);
  note('game-over', JSON.stringify({ profit: Math.round(state.profit), bot: Math.round(bot) }));
  const beat = state.profit > bot;
  modal(
    [
      h('h2', { text: `Ten years done: ${money(state.profit)}` }),
      h('p', { text: `The simple computer player made ${money(bot)} on the same game. ${beat ? 'You beat it.' : 'It beat you this time.'}` }),
      h('h3', { text: 'Three questions for the test' }),
      h('ul', {}, h('li', { text: 'Did you want to keep playing?' }), h('li', { text: 'What was the most fun moment?' }), h('li', { text: 'When were you just waiting?' })),
      h('p', { class: 'muted', text: 'Save the log (top right) so the answers can be read next to what happened.' }),
    ],
    'Play a new game',
    () => restart(null),
    [button('Same game again', () => restart(state.seed))],
  );
}

// ------------------------------------------------------------- dialogs and helpers

function modal(content: Node[], primary: string, onClose: () => void, extra: HTMLButtonElement[] = []): void {
  const scrim = h('div', { class: 'scrim' });
  const close = (): void => {
    scrim.remove();
    onClose();
  };
  const go = h('button', { class: 'primary', text: primary });
  go.addEventListener('click', close);
  for (const b of extra) b.addEventListener('click', () => scrim.remove());
  scrim.append(h('div', { class: 'card', role: 'dialog' }, ...content, h('div', { class: 'actions' }, ...extra, go)));
  document.body.append(scrim);
  go.focus();
}

function showHelp(): void {
  note('help');
  modal(
    [
      h('h2', { text: 'How to play' }),
      h(
        'ul',
        {},
        h('li', { text: 'The board is one grid hub’s day, hour by hour. Above: the price each MWh earns in that hour. Below: who supplies the power, against the hub’s demand.' }),
        h('li', { text: 'Your wind and solar earn the price of the hours they produce. The more power in an hour, the lower its price: your own plants pull your own price down. The dashed line shows the price without you.' }),
        h('li', { text: 'A battery earns the gap between hours. Drag on the board from a cheap (green or blue) hour to a dear (red) hour to move 5 MWh. On a phone: tap the cheap hour, then the dear one.' }),
        h('li', { text: 'Each year: read the news (Nordhav builds where it paid; surprises happen), buy or sell blocks, set the battery, then run the year. Building costs a fee once, then a cost every year.' }),
        h('li', { text: 'Ten years. Try to make more money than the simple computer player. Money is unlimited on purpose: this tests the fun, not your budget.' }),
      ),
    ],
    'Play',
    () => undefined,
  );
}

let toastTimer: number | null = null;
function toast(text: string): void {
  document.querySelector('.toast')?.remove();
  const t = h('div', { class: 'toast', role: 'status', text });
  document.body.append(t);
  if (toastTimer !== null) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.remove(), 2600);
}

function exportLog(): void {
  note('log-saved');
  const blob = new Blob([JSON.stringify({ toy: 'board', seed: state.seed, profit: Math.round(state.profit), year: state.year, log }, null, 1)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `board-log-${state.seed}.json` });
  document.body.append(a);
  a.click();
  a.remove();
}

function restart(seed: number | null): void {
  const s = seed ?? seedFromUrl();
  state = newGame(seed === null ? (s + 7919) % 1_000_000 : s);
  view = null;
  fromHour = null;
  note('new-game', String(state.seed));
  render();
}

window.addEventListener('resize', () => {
  if (!animating) render();
});

note('start', String(state.seed));
render();
showHelp();
