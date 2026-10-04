/**
 * The annual report (design §5), as page content: used by the year-end card
 * and by the Reports tab.
 */
import { END_YEAR, type GameState, type YearReport } from '../game';
import { h } from './dom';
import { count, money, moneyDelta, mw, mwh, pct, price } from './format';

function row(label: string, value: string, cls = ''): HTMLElement {
  return h('div', { class: `kv ${cls}`.trim() }, h('span', { class: 'k', text: label }), h('span', { class: 'v', text: value }));
}

export function reportBody(r: YearReport, state: GameState): Node[] {
  const L = r.ledger;
  const valueChange = r.valueEndCents - r.valueStartCents;
  const out: Node[] = [];
  out.push(
    h(
      'p',
      { class: 'lead' },
      `You earned ${money(L.revenueCents)}. Company value ${money(r.valueStartCents)} → ${money(r.valueEndCents)} `,
      h('span', { class: valueChange >= 0 ? 'good' : 'bad', text: `(${moneyDelta(valueChange)})` }),
      '.',
    ),
  );
  const yours =
    L.outputMwh > 0
      ? `${mwh(L.outputMwh)}, earning ${price(r.earnedPrice)} on average${r.dk1.marketOpen ? `; at the hourly price alone it was worth ${price(r.marketEarnedPrice)}` : ''}.`
      : 'Nothing produced yet.';
  out.push(h('h3', { text: 'Your power' }), h('p', { text: yours }));
  if (r.best !== null && r.worst !== null) {
    out.push(h('p', { text: `Best: ${r.best.name} (${money(r.best.netPerMwEur * 100)} per MW after running costs). Weakest: ${r.worst.name} (${money(r.worst.netPerMwEur * 100)} per MW).` }));
  }

  out.push(h('h3', { text: 'Money' }));
  const money_ = h(
    'div',
    { class: 'ledger' },
    row('Cash on 1 January', money(r.cashStartCents)),
    row('Sales of power', moneyDelta(L.revenueCents)),
    row('Running costs and land', moneyDelta(-L.fixedCostCents)),
    row('Interest', moneyDelta(-L.interestCents)),
    row('Loans repaid', moneyDelta(-L.repaidCents)),
    L.investedCents > 0 ? row('New projects', moneyDelta(-L.investedCents)) : null,
    L.borrowedCents > 0 ? row('Borrowed', moneyDelta(L.borrowedCents)) : null,
    L.salesCents > 0 ? row('Assets sold', moneyDelta(L.salesCents)) : null,
    L.feeCents > 0 ? row('Bank fee (restructuring)', moneyDelta(-L.feeCents)) : null,
    row('Cash on 31 December', money(r.cashEndCents), 'total'),
    row('Debt on 31 December', money(r.debtEndCents)),
  );
  out.push(money_);

  out.push(h('h3', { text: 'Western Denmark' }));
  const d = r.dk1;
  const windAdded = d.windMwBefore === null ? null : d.windMw - d.windMwBefore;
  const solarAdded = d.solarMwBefore === null ? null : d.solarMw - d.solarMwBefore;
  const market: string[] = [];
  market.push(
    d.marketOpen
      ? `Average hourly price ${price(d.meanPrice)}; wind earned ${price(d.windCapturePrice)}, ${pct(d.windCaptureRate)} of the average, because it sells most when it is windy everywhere.`
      : `Prices were fixed all year. Behind the scenes the market price would have averaged ${price(d.meanPrice)}.`,
  );
  market.push(
    `Wind in the zone: ${mw(d.windMw)}${windAdded !== null && Math.abs(windAdded) >= 1 ? ` (${windAdded > 0 ? '+' : '−'}${mw(Math.abs(windAdded))} this year)` : ''}. Solar: ${mw(d.solarMw)}${solarAdded !== null && Math.abs(solarAdded) >= 1 ? ` (${solarAdded > 0 ? '+' : '−'}${mw(Math.abs(solarAdded))})` : ''}.`,
  );
  if (d.marketOpen && (d.negativeHours > 0 || d.maxPrice > 150)) {
    market.push(`${count(d.negativeHours)} hours below zero; the dearest hour cost ${price(d.maxPrice)}.`);
  }
  for (const m of market) out.push(h('p', { text: m }));

  if (r.headlines.length > 0) {
    out.push(h('h3', { text: 'The year’s news' }), h('ul', { class: 'headlines' }, ...r.headlines.map((t) => h('li', { text: t }))));
  }

  out.push(h('h3', { text: 'Footprint' }));
  out.push(
    h('p', {
      text: `${mw(r.mwOperating)} running${r.mwBuilding > 0 ? `, ${mw(r.mwBuilding)} on the way` : ''}. ${pct(r.sharePct / 100, r.sharePct < 1 ? 2 : 1)} of Western Denmark’s power: enough for about ${count(r.homes)} homes.`,
    }),
  );
  if (r.year === END_YEAR && state.over !== null) out.push(h('p', { class: 'muted', text: 'The chapter ends here; the medal follows.' }));
  return out;
}
