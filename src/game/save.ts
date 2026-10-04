/**
 * Saving and resuming. The game state is plain data; the market's carried
 * state (reservoirs, storage, price history) is not saved but rebuilt by
 * replaying the run's years with the capacity the player had in each, which
 * reproduces the same prices exactly (determinism test).
 */
import { SAVE_VERSION, openYear } from './engine';
import type { MarketProvider, MarketYear } from './market';
import type { GameState } from './state';
import { START_YEAR } from './tuning';

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

/** A saved state, or null if the text is not a save of this version. */
export function deserialize(text: string): GameState | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Partial<GameState>;
  if (o.version !== SAVE_VERSION) return null;
  if (typeof o.seed !== 'number' || typeof o.t !== 'number' || typeof o.year !== 'number') return null;
  if (!Array.isArray(o.assets) || !Array.isArray(o.loans) || typeof o.capacityLog !== 'object' || o.capacityLog === null) return null;
  return raw as GameState;
}

/**
 * Rebuild the market for a resumed game: yields each earlier year as it is
 * replayed (for a progress bar), and returns the current year's market.
 * The provider must be fresh and have the state's seed.
 */
export function* resumeMarket(provider: MarketProvider, state: GameState): Generator<number, MarketYear, void> {
  if (provider.seed !== state.seed) throw new Error('the market provider has a different seed');
  for (let y = START_YEAR; y < state.year; y++) {
    const cap = state.capacityLog[String(y)];
    if (cap === undefined) throw new Error(`the save has no capacity for ${y}`);
    provider.simulate(y, cap);
    yield y;
  }
  const cap = state.capacityLog[String(state.year)];
  return cap === undefined ? openYear(state, provider) : provider.simulate(state.year, cap);
}
