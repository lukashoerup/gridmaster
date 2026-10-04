/**
 * Company value (design §4.5): cash − debt + the value of each asset, where
 * an asset is worth its trailing three-year net cash flow times an annuity
 * factor over its remaining life at 7%. Until an asset has three years of
 * history, the months it lacks count at the net cash flow expected when it
 * was ordered. A project still being permitted or built is worth its cost.
 */
import { annuityFactor } from './money';
import type { Asset, GameState } from './state';
import { VALUE_DISCOUNT, VALUE_WINDOW_MONTHS } from './tuning';

const HOURS_PER_YEAR = 8766;

/** Net cash flow a year behind the asset's value, cents. */
export function trailingAnnualNet(asset: Asset): number {
  const n = Math.min(asset.monthNet.length, VALUE_WINDOW_MONTHS);
  let sum = 0;
  for (let i = asset.monthNet.length - n; i < asset.monthNet.length; i++) sum += asset.monthNet[i] ?? 0;
  const missing = VALUE_WINDOW_MONTHS - n;
  sum += (asset.expectedNetCents / 12) * missing;
  return (sum / VALUE_WINDOW_MONTHS) * 12;
}

export function assetValue(asset: Asset, t: number): number {
  switch (asset.status) {
    case 'permitting':
    case 'building':
      return asset.costCents;
    case 'operating': {
      const years = Math.max(0, (asset.retireAt - t) / HOURS_PER_YEAR);
      return Math.max(0, Math.round(trailingAnnualNet(asset) * annuityFactor(VALUE_DISCOUNT, years)));
    }
    default:
      return 0;
  }
}

export function debtCents(state: GameState): number {
  let d = 0;
  for (const l of state.loans) d += l.balanceCents;
  return d;
}

export function assetsValue(state: GameState): number {
  let v = 0;
  for (const a of state.assets) v += assetValue(a, state.t);
  return v;
}

export function companyValue(state: GameState): number {
  return state.cashCents - debtCents(state) + assetsValue(state);
}
