/**
 * The desk under the map: Build, Assets, Finance and Reports. Each panel
 * keeps its form controls between refreshes (so typing and clicking are
 * never interrupted) and redraws only the parts that show changing figures.
 */
import {
  AREAS,
  LOAN_TERMS_YEARS,
  MODELS,
  SITES,
  areaRoomMw,
  assetValue,
  borrow,
  build,
  companyLoanRate,
  companyValue,
  creditRoomCents,
  debtCents,
  interestRate,
  maxLoanShare,
  modelsFor,
  monthLabel,
  monthlyDebtService,
  preview,
  repay,
  roofRoomMw,
  salePrice,
  sell,
  siteById,
  siteRoomMw,
  type Asset,
  type BuildRequest,
  type GameState,
  type MarketYear,
  type ModelId,
  type YearReport,
} from '../game';
import { h, replaceIfChanged } from './dom';
import { money, mw, mwh, price, years } from './format';
import { FARM_ID, siteLook } from './map';

export interface DeskContext {
  state(): GameState | null;
  market(): MarketYear | null;
  /** Called after the player changed the game (build, sell, borrow, repay): save and refresh. */
  changed(): void;
  select(id: string | null): void;
  selected(): string | null;
  openReport(r: YearReport): void;
}

export interface Panel {
  readonly element: HTMLElement;
  refresh(): void;
}

function statusText(a: Asset, state: GameState): string {
  switch (a.status) {
    case 'permitting':
      return `permit expected ${monthLabel(a.permitDoneAt)}`;
    case 'building':
      return `building, online ${monthLabel(a.onlineAt)}`;
    case 'operating':
      if (a.regime === 'tariff' && state.t < a.tariffUntil) return `running · fixed tariff until ${monthLabel(a.tariffUntil)}`;
      if (a.regime === 'premium' && a.premiumMwhLeft > 0) return `running · hourly price + €${a.premiumPerMwh} premium`;
      if (a.regime === 'netmeter') return 'running · covers the farm’s bill';
      return 'running · hourly price';
    case 'retired':
      return 'taken down';
    case 'sold':
      return 'sold';
  }
}

function lookOf(state: GameState, id: string): string {
  const s = siteById(id);
  return s === undefined ? '' : siteLook(state, s);
}

// ---------------------------------------------------------------------------
// Build

export function buildPanel(ctx: DeskContext): Panel {
  const element = h('div', { class: 'panel build-panel' });
  const intro = h('div', { class: 'build-intro' });
  const list = h('div', { class: 'site-list' });
  const form = h('div', { class: 'build-form' });
  element.append(intro, form, list);

  let formFor: string | null = null;
  let formYear = 0;
  let formKind = '';
  const model = h('select', { id: 'build-model' });
  const units = h('input', { id: 'build-units', type: 'number', min: '1', max: '25', step: '1', value: '1', inputmode: 'numeric' });
  const loan = h('select', { id: 'build-loan' });
  const term = h('select', { id: 'build-term' });
  for (const y of LOAN_TERMS_YEARS) term.append(h('option', { value: String(y), text: `${y} years` }));
  term.value = '15';
  const head = h('div', { class: 'site-head' });
  const previewBox = h('div', { class: 'preview', 'aria-live': 'polite' });
  const buildButton = h('button', { type: 'button', class: 'primary', id: 'build-go', text: 'Build' });
  const back = h('button', { type: 'button', class: 'link', text: '← All sites' });
  back.addEventListener('click', () => ctx.select(null));
  const minus = h('button', { type: 'button', class: 'step', 'aria-label': 'One unit fewer', text: '−' });
  const plus = h('button', { type: 'button', class: 'step', 'aria-label': 'One unit more', text: '+' });
  const setUnits = (n: number): void => {
    units.value = String(Math.max(1, Math.min(25, Math.round(n) || 1)));
    refreshPreview();
  };
  minus.addEventListener('click', () => setUnits(Number(units.value) - 1));
  plus.addEventListener('click', () => setUnits(Number(units.value) + 1));
  for (const c of [model, units, loan, term]) c.addEventListener('input', () => refreshPreview());
  form.append(
    back,
    head,
    h(
      'div',
      { class: 'fields' },
      h('label', { class: 'field', for: 'build-model' }, h('span', { text: 'What' }), model),
      h('label', { class: 'field', for: 'build-units' }, h('span', { text: 'How many' }), h('span', { class: 'stepper' }, minus, units, plus)),
      h('label', { class: 'field', for: 'build-loan' }, h('span', { text: 'Borrow' }), loan),
      h('label', { class: 'field', for: 'build-term' }, h('span', { text: 'Repay over' }), term),
    ),
    previewBox,
    buildButton,
  );

  const request = (): BuildRequest | null => {
    const sel = ctx.selected();
    const state = ctx.state();
    if (sel === null || state === null) return null;
    const share = loan.value === 'max' ? maxLoanShare(state.t) : Number(loan.value);
    return {
      siteId: sel === FARM_ID ? null : sel,
      model: model.value as ModelId,
      units: Number(units.value),
      loanShare: share,
      loanYears: Number(term.value),
    };
  };

  buildButton.addEventListener('click', () => {
    const state = ctx.state();
    const market = ctx.market();
    const req = request();
    if (state === null || market === null || req === null) return;
    const r = build(state, market, req);
    if (r.ok) {
      units.value = '1';
      ctx.changed();
    }
    refreshPreview();
  });

  function rebuildForm(state: GameState, sel: string): void {
    formFor = sel;
    formYear = state.year;
    const kind = sel === FARM_ID ? 'rooftop' : 'wind';
    const prev = model.value;
    const options = modelsFor(kind, state.year);
    model.replaceChildren(...options.map((m) => h('option', { value: m.id, text: m.label })));
    const keep = options.find((m) => m.id === prev);
    const last = options[options.length - 1];
    model.value = keep?.id ?? (kind === 'wind' ? (last?.id ?? '') : (options[0]?.id ?? ''));
    const max = Math.round(maxLoanShare(state.t) * 100);
    const prevLoan = kind === formKind ? loan.value : '';
    formKind = kind;
    loan.replaceChildren(
      h('option', { value: '0', text: 'Nothing: pay it all in cash' }),
      h('option', { value: '0.5', text: '50% of the cost' }),
      h('option', { value: 'max', text: `${max}% of the cost (the most)` }),
    );
    loan.value = prevLoan === '' ? (kind === 'wind' ? 'max' : '0') : prevLoan;
  }

  function refreshPreview(): void {
    const state = ctx.state();
    const market = ctx.market();
    const req = request();
    if (state === null || market === null || req === null) {
      replaceIfChanged(previewBox, () => [h('p', { class: 'muted', text: 'Preparing the year…' })], 'none');
      buildButton.disabled = true;
      return;
    }
    const p = preview(state, market, req);
    const key = JSON.stringify([p, state.cashCents]);
    replaceIfChanged(
      previewBox,
      () => {
        const nodes: Node[] = [];
        nodes.push(
          h('div', { class: 'kv' }, h('span', { class: 'k', text: 'Cost' }), h('span', { class: 'v', text: `${money(p.costCents)} for ${mw(p.mw)}` })),
          h(
            'div',
            { class: 'kv' },
            h('span', { class: 'k', text: 'You pay now' }),
            h('span', { class: 'v', text: p.loanCents > 0 ? `${money(p.equityCents)}; the bank lends ${money(p.loanCents)} at ${p.ratePct}%` : money(p.equityCents) }),
          ),
        );
        if (p.loanCents > 0) {
          nodes.push(h('div', { class: 'kv' }, h('span', { class: 'k', text: 'Instalments' }), h('span', { class: 'v', text: `${money(p.monthlyPaymentCents)} a month, from when it runs` })));
        }
        nodes.push(
          h('div', { class: 'kv' }, h('span', { class: 'k', text: 'Running' }), h('span', { class: 'v', text: p.permitDoneAt > state.t ? `permit ${monthLabel(p.permitDoneAt)}, running ${monthLabel(p.onlineAt)}` : `from ${monthLabel(p.onlineAt)}` })),
          h('div', { class: 'kv' }, h('span', { class: 'k', text: 'Output' }), h('span', { class: 'v', text: `${mwh(p.annualMwh)} in a normal year, ${mwh(p.badYearMwh)} in a calm one` })),
          h('div', { class: 'kv' }, h('span', { class: 'k', text: 'Expected price' }), h('span', { class: 'v', text: price(p.expectedPrice) })),
          h('p', { class: 'regime', text: p.regimeText }),
          h(
            'div',
            { class: 'kv strong' },
            h('span', { class: 'k', text: 'Net a year' }),
            h('span', { class: 'v', text: `${money(p.annualNetCents)} after running costs and land · pays back in ${years(p.paybackYears)}` }),
          ),
          h('p', { class: 'muted small', text: 'Expected, not promised: weather and prices decide.' }),
        );
        if (p.problems.length > 0) nodes.push(h('ul', { class: 'problems' }, ...p.problems.map((t) => h('li', { text: t }))));
        return nodes;
      },
      key,
    );
    buildButton.disabled = !p.ok;
    buildButton.textContent = p.ok ? `Build for ${money(p.equityCents)} now` : 'Build';
  }

  function siteSummary(state: GameState, id: string): Node[] {
    if (id === FARM_ID) {
      return [
        h('h3', { text: 'Your farm’s roofs' }),
        h('p', { class: 'muted', text: `Rooftop panels: no permit needed. Room for ${mw(roofRoomMw(state))} more. Their output first covers the farm’s own use, worth the retail price; the rest is sold.` }),
      ];
    }
    const s = siteById(id);
    const ss = state.sites.find((x) => x.id === id);
    if (s === undefined || ss === undefined) return [];
    const area = AREAS[s.area];
    const warn = siteLook(state, s) === 'warned' && ss.claimAt !== null ? h('p', { class: 'warn', text: `${ss.claimant} will take the free room here in ${monthLabel(ss.claimAt)}. Start a project first to keep your part.` }) : null;
    const nodes: Node[] = [
      h('h3', { text: `${s.name} · ${area.name}` }),
      h(
        'p',
        { class: 'muted' },
        `Wind ×${s.wind.toFixed(2)} · room for ${mw(siteRoomMw(state, id))} of ${mw(s.maxMw)} · the ${area.name.toLowerCase()} grid takes ${mw(areaRoomMw(state, s.area))} more of yours · permits take about ${area.permitMonths} months · land €${(area.landPerMw / 1000).toFixed(1)}k per MW a year`,
      ),
    ];
    if (warn !== null) nodes.push(warn);
    return nodes;
  }

  function refresh(): void {
    const state = ctx.state();
    const sel = ctx.selected();
    if (state === null) return;
    if (sel === null) {
      form.hidden = true;
      intro.hidden = false;
      list.hidden = false;
      replaceIfChanged(
        intro,
        () => [
          h('p', { text: `Choose where to build: a site on the map, or one below. The bank lends up to ${Math.round(maxLoanShare(state.t) * 100)}% of a project’s cost at ${interestRate(state.t)}% today.` }),
        ],
        `${state.year}|${maxLoanShare(state.t)}|${interestRate(state.t)}`,
      );
      const rows = [FARM_ID, ...[...SITES].sort((a, b) => b.wind - a.wind).map((s) => s.id)];
      const key = rows.map((id) => (id === FARM_ID ? String(roofRoomMw(state)) : `${siteRoomMw(state, id)}${lookOf(state, id)}`)).join('|');
      replaceIfChanged(
        list,
        () =>
          rows.map((id) => {
            const b = h('button', { type: 'button', class: 'site-row' });
            if (id === FARM_ID) {
              b.append(h('span', { class: 'name', text: 'Your farm’s roofs' }), h('span', { class: 'meta', text: `rooftop panels · room ${mw(roofRoomMw(state))}` }));
            } else {
              const s = siteById(id);
              if (s === undefined) return b;
              const look = siteLook(state, s);
              b.classList.add(look);
              b.append(
                h('span', { class: 'name', text: s.name }),
                h('span', { class: 'meta', text: `${AREAS[s.area].name} · wind ×${s.wind.toFixed(2)} · ${look === 'taken' ? 'no room left' : `room ${mw(siteRoomMw(state, id))}`}${look === 'warned' ? ' · being claimed' : ''}` }),
              );
            }
            b.addEventListener('click', () => ctx.select(id));
            return b;
          }),
        key,
      );
      return;
    }
    intro.hidden = true;
    list.hidden = true;
    form.hidden = false;
    if (formFor !== sel || formYear !== state.year) rebuildForm(state, sel);
    const headKey = sel === FARM_ID ? `farm|${roofRoomMw(state)}` : `${sel}|${siteRoomMw(state, sel)}|${areaRoomMw(state, siteById(sel)?.area ?? 'west')}|${lookOf(state, sel)}`;
    replaceIfChanged(head, () => siteSummary(state, sel), headKey);
    refreshPreview();
  }

  return { element, refresh };
}

// ---------------------------------------------------------------------------
// Assets

export function assetsPanel(ctx: DeskContext): Panel {
  const element = h('div', { class: 'panel assets-panel' });
  const body = h('div', { class: 'table-wrap' });
  element.append(body);
  let confirmSell: number | null = null;

  body.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target.closest('button[data-action]') : null;
    if (!(target instanceof HTMLButtonElement)) return;
    const id = Number(target.dataset['id']);
    const state = ctx.state();
    if (state === null) return;
    switch (target.dataset['action']) {
      case 'sell':
        confirmSell = id;
        break;
      case 'sell-yes':
        sell(state, id);
        confirmSell = null;
        ctx.changed();
        break;
      case 'sell-no':
        confirmSell = null;
        break;
      default:
        break;
    }
    body.dataset['key'] = '';
    refresh();
  });

  function refresh(): void {
    const state = ctx.state();
    if (state === null) return;
    const live = state.assets.filter((a) => a.endedAt === null);
    const gone = state.assets.filter((a) => a.endedAt !== null);
    const key = JSON.stringify([confirmSell, state.year, Math.floor(state.t / 168), live.map((a) => [a.id, a.status]), gone.length]);
    replaceIfChanged(
      body,
      () => {
        if (live.length === 0 && gone.length === 0) return [h('p', { class: 'muted', text: 'Nothing yet.' })];
        const table = h(
          'table',
          { class: 'assets' },
          h('thead', {}, h('tr', {}, ...['Asset', 'Status', 'This year', 'Earned', 'Value', ''].map((t) => h('th', { text: t })))),
        );
        const tbody = h('tbody');
        for (const a of live) {
          const value = salePrice(state, a.id);
          let action: Node;
          if (confirmSell === a.id) {
            action = h(
              'span',
              { class: 'confirm' },
              `Sell for ${money(value)}?`,
              h('button', { type: 'button', class: 'danger', 'data-action': 'sell-yes', 'data-id': String(a.id), text: 'Sell' }),
              h('button', { type: 'button', class: 'link', 'data-action': 'sell-no', 'data-id': String(a.id), text: 'Keep' }),
            );
          } else {
            action = h('button', { type: 'button', class: 'quiet', 'data-action': 'sell', 'data-id': String(a.id), text: 'Sell…' });
          }
          tbody.append(
            h(
              'tr',
              {},
              h('td', {}, h('strong', { text: a.name }), h('br'), h('span', { class: 'muted small', text: `${a.units} × ${MODELS[a.model].label} · ${mw(a.mw)}` })),
              h('td', { class: 'small', text: statusText(a, state) }),
              h('td', { class: 'num', text: a.year.outputMwh > 0 ? mwh(a.year.outputMwh) : '–' }),
              h('td', { class: 'num', text: a.year.outputMwh > 0 ? `${money(a.year.revenueCents)} · ${price(a.year.revenueCents / 100 / a.year.outputMwh)}` : '–' }),
              h('td', { class: 'num', text: money(assetValue(a, state.t)) }),
              h('td', { class: 'act' }, action),
            ),
          );
        }
        for (const a of gone.slice(-6)) {
          tbody.append(
            h(
              'tr',
              { class: 'gone' },
              h('td', {}, h('span', { text: a.name }), h('br'), h('span', { class: 'muted small', text: `${a.units} × ${MODELS[a.model].label}` })),
              h('td', { class: 'small', text: statusText(a, state) }),
              h('td', { class: 'num', text: '–' }),
              h('td', { class: 'num', text: '–' }),
              h('td', { class: 'num', text: '–' }),
              h('td'),
            ),
          );
        }
        table.append(tbody);
        return [table, h('p', { class: 'muted small', text: 'Value is what the asset’s last three years of cash flow are worth over its remaining life. A sale fetches 90% of it; any loan on the asset is repaid from the price.' })];
      },
      key,
    );
  }
  return { element, refresh };
}

// ---------------------------------------------------------------------------
// Finance

export function financePanel(ctx: DeskContext): Panel {
  const element = h('div', { class: 'panel finance-panel' });
  const figures = h('div', { class: 'figures-grid' });
  const loans = h('div', { class: 'table-wrap' });
  const amount = h('input', { id: 'borrow-amount', type: 'number', min: '0', step: '10000', value: '100000', inputmode: 'numeric' });
  const term = h('select', { id: 'borrow-term' });
  for (const y of LOAN_TERMS_YEARS) term.append(h('option', { value: String(y), text: `${y} years` }));
  const go = h('button', { type: 'button', class: 'primary', text: 'Borrow' });
  const room = h('p', { class: 'muted' });
  const borrowBox = h(
    'div',
    { class: 'borrow' },
    h('h3', { text: 'Borrow against your company' }),
    room,
    h(
      'div',
      { class: 'fields' },
      h('label', { class: 'field', for: 'borrow-amount' }, h('span', { text: 'Amount, €' }), amount),
      h('label', { class: 'field', for: 'borrow-term' }, h('span', { text: 'Repay over' }), term),
    ),
    go,
  );
  element.append(figures, h('h3', { text: 'Loans' }), loans, borrowBox);

  go.addEventListener('click', () => {
    const state = ctx.state();
    if (state === null) return;
    const want = Math.round(Number(amount.value) * 100);
    const ok = borrow(state, Math.min(want, creditRoomCents(state)), Number(term.value));
    if (ok) ctx.changed();
    refresh();
  });

  loans.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target.closest('button[data-action="repay"]') : null;
    if (!(target instanceof HTMLButtonElement)) return;
    const state = ctx.state();
    if (state === null) return;
    if (repay(state, Number(target.dataset['id']))) ctx.changed();
    loans.dataset['key'] = '';
    refresh();
  });

  function refresh(): void {
    const state = ctx.state();
    if (state === null) return;
    const L = state.ledger;
    const fig = (k: string, v: string): HTMLElement => h('div', { class: 'figure' }, h('span', { class: 'k', text: k }), h('span', { class: 'v', text: v }));
    const debt = debtCents(state);
    replaceIfChanged(
      figures,
      () => [
        fig('Cash', money(state.cashCents)),
        fig('Debt', money(debt)),
        fig('Company value', money(companyValue(state))),
        fig('Instalments a month', money(monthlyDebtService(state))),
        fig(`Sales of power in ${state.year}`, money(L.revenueCents)),
        fig('Running costs and land', money(L.fixedCostCents)),
        fig('Interest paid', money(L.interestCents)),
        fig('Loans repaid', money(L.repaidCents)),
      ],
      JSON.stringify([state.cashCents >> 10, debt, L.revenueCents >> 10, L.fixedCostCents, L.interestCents, L.repaidCents, state.assets.length]),
    );
    const open = state.loans.filter((l) => l.balanceCents > 0);
    replaceIfChanged(
      loans,
      () => {
        if (open.length === 0) return [h('p', { class: 'muted', text: 'No loans.' })];
        const tbody = h('tbody');
        for (const l of open) {
          const canRepay = state.cashCents >= l.balanceCents;
          tbody.append(
            h(
              'tr',
              {},
              h('td', { text: l.label }),
              h('td', { class: 'num', text: money(l.balanceCents) }),
              h('td', { class: 'num', text: `${l.ratePct}%` }),
              h('td', { class: 'num', text: l.firstPaymentAfter > state.t ? 'from start-up' : money(l.paymentCents) }),
              h('td', { class: 'num', text: `${Math.max(0, l.months - l.monthsPaid)}` }),
              h('td', { class: 'act' }, h('button', { type: 'button', class: 'quiet', 'data-action': 'repay', 'data-id': String(l.id), disabled: !canRepay, text: 'Repay now' })),
            ),
          );
        }
        return [h('table', { class: 'loans' }, h('thead', {}, h('tr', {}, ...['Loan', 'Owed', 'Rate', 'A month', 'Months left', ''].map((t) => h('th', { text: t })))), tbody)];
      },
      JSON.stringify([open.map((l) => [l.id, l.balanceCents, l.monthsPaid]), state.cashCents >= Math.min(...open.map((l) => l.balanceCents), Infinity)]),
    );
    const r = creditRoomCents(state);
    const roomText =
      state.t < state.feeUntil
        ? 'Not while the bank’s restructuring terms run.'
        : r > 0
          ? `The bank lends against your running turbines and panels: up to ${money(r)} more today, at ${companyLoanRate(state.t)}%, repaid monthly from next month.`
          : 'Nothing more today: all your debt together may reach 60% of what your running assets are worth.';
    if (room.textContent !== roomText) room.textContent = roomText;
    go.disabled = r <= 0;
  }
  return { element, refresh };
}

// ---------------------------------------------------------------------------
// Reports

export function reportsPanel(ctx: DeskContext): Panel {
  const element = h('div', { class: 'panel reports-panel' });
  const body = h('div', { class: 'table-wrap' });
  element.append(body);
  body.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target.closest('button[data-year]') : null;
    if (!(target instanceof HTMLButtonElement)) return;
    const state = ctx.state();
    const r = state?.reports.find((x) => x.year === Number(target.dataset['year']));
    if (r !== undefined) ctx.openReport(r);
  });
  function refresh(): void {
    const state = ctx.state();
    if (state === null) return;
    replaceIfChanged(
      body,
      () => {
        if (state.reports.length === 0) return [h('p', { class: 'muted', text: 'Your first annual report arrives on 31 December.' })];
        const tbody = h('tbody');
        for (const r of [...state.reports].reverse()) {
          tbody.append(
            h(
              'tr',
              {},
              h('td', {}, h('button', { type: 'button', class: 'link', 'data-year': String(r.year), text: String(r.year) })),
              h('td', { class: 'num', text: money(r.ledger.revenueCents) }),
              h('td', { class: 'num', text: price(r.earnedPrice) }),
              h('td', { class: 'num', text: r.dk1.marketOpen ? price(r.dk1.meanPrice) : 'fixed' }),
              h('td', { class: 'num', text: money(r.cashEndCents) }),
              h('td', { class: 'num', text: money(r.valueEndCents) }),
              h('td', { class: 'num', text: mw(r.mwOperating) }),
            ),
          );
        }
        return [
          h(
            'table',
            { class: 'reports' },
            h('thead', {}, h('tr', {}, ...['Year', 'Earned', 'Your price', 'DK1 average', 'Cash', 'Value', 'Running'].map((t) => h('th', { text: t })))),
            tbody,
          ),
        ];
      },
      String(state.reports.length),
    );
  }
  return { element, refresh };
}
