/**
 * Scripted players and a headless runner. Slice 1 has one bot, a plain wind
 * builder; the design's six bots (§9) follow with the playtest kit.
 */
import type { WorldInputs } from '../sim';
import { modelsFor } from './catalogue';
import { advance, borrow, build, creditRoomCents, closeYear, dismissCard, maxLoanShare, monthlyDebtService, newGame, openYear, preview, siteRoomMw, areaRoomMw, yearDone, type BuildRequest } from './engine';
import { MarketProvider, type MarketYear } from './market';
import { SITES } from './sites';
import type { GameState } from './state';
import { END_YEAR } from './tuning';

export type Bot = (state: GameState, market: MarketYear) => BuildRequest | null;

/**
 * Builds the biggest turbine on offer at the windiest site with room, borrowing
 * the most the bank allows, whenever it can pay its share and still keep a
 * buffer: `bufferEur`, or `bufferMonths` of instalments if that is more.
 */
export function windBot(bufferEur = 30_000, bufferMonths = 12): Bot {
  return (state, market) => {
    const buffer = Math.max(bufferEur * 100, bufferMonths * monthlyDebtService(state));
    const models = modelsFor('wind', state.year).reverse();
    const sites = [...SITES].sort((a, b) => b.wind - a.wind);
    for (const model of models) {
      for (const s of sites) {
        const room = Math.min(siteRoomMw(state, s.id), areaRoomMw(state, s.area));
        for (let units = Math.min(25, Math.floor(room / model.unitMw + 1e-9)); units > 0; units--) {
          const req: BuildRequest = { siteId: s.id, model: model.id, units, loanShare: maxLoanShare(state.t), loanYears: 15 };
          const p = preview(state, market, req);
          if (p.ok && state.cashCents - p.equityCents >= buffer) return req;
          if (p.equityCents / units > state.cashCents) break;
        }
      }
    }
    return null;
  };
}

/**
 * A bolder builder: like `windBot`, but it first borrows against its
 * operating assets whenever the bank allows, keeping six months of
 * instalments as its buffer.
 */
export function leveragedWindBot(): Bot {
  const inner = windBot(30_000, 6);
  return (state, market) => {
    const room = creditRoomCents(state);
    if (room > 100_000_00) borrow(state, room, 15);
    return inner(state, market);
  };
}

export interface HeadlessRun {
  readonly state: GameState;
  /** The current year's market; null once the run has stopped at a year's end or the game is over. */
  market: MarketYear | null;
  readonly provider: MarketProvider;
}

export function startHeadless(inputs: WorldInputs, seed: number): HeadlessRun {
  const provider = new MarketProvider(inputs, seed);
  const state = newGame(seed, inputs);
  return { state, market: openYear(state, provider), provider };
}

/**
 * Play on without a screen: cards are dismissed at once, the bot is asked at
 * the start and then once a game month, and the run stops when the clock
 * reaches `stopAt` (an absolute hour), after `untilYear`, or at the end.
 */
export function playHeadless(run: HeadlessRun, bot: Bot | null, untilYear = END_YEAR, stopAt = Infinity): HeadlessRun {
  const { state, provider } = run;
  while (run.market !== null && state.over === null && state.t < stopAt) {
    const market = run.market;
    while (state.cards.length > 0) dismissCard(state);
    if (bot !== null) {
      const req = bot(state, market);
      if (req !== null) build(state, market, req);
    }
    advance(state, market, Math.min(730, stopAt - state.t));
    if (yearDone(state, market)) {
      closeYear(state, market);
      while (state.cards.length > 0) dismissCard(state);
      run.market = state.over !== null || state.year > untilYear ? null : openYear(state, provider);
    }
  }
  return run;
}

/** A whole headless game from a seed. */
export function runHeadless(inputs: WorldInputs, seed: number, bot: Bot | null, untilYear = END_YEAR): HeadlessRun {
  return playHeadless(startHeadless(inputs, seed), bot, untilYear);
}
