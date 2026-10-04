/**
 * How the game page writes numbers: money, energy, prices. Pure, so the
 * wording is tested headless (tests/play.test.ts).
 */
import { groupThousands } from '../game';

const MINUS = '−';

/** Money from cents: "€150,000" below a million, "€1.24m" and "€12.4m" above. */
export function money(c: number): string {
  const eur = c / 100;
  const sign = eur < 0 ? MINUS : '';
  const a = Math.abs(eur);
  if (a >= 1e9) return `${sign}€${(a / 1e9).toFixed(2)}bn`;
  if (a >= 1e8) return `${sign}€${Math.round(a / 1e6)}m`;
  if (a >= 1e7) return `${sign}€${(a / 1e6).toFixed(1)}m`;
  if (a >= 1e6) return `${sign}€${(a / 1e6).toFixed(2)}m`;
  return `${sign}€${groupThousands(a)}`;
}

/** Money with a sign for changes: "+€12,000", "−€3,400". */
export function moneyDelta(c: number): string {
  if (c === 0) return money(0);
  return c > 0 ? `+${money(c)}` : money(c);
}

export function mw(v: number): string {
  if (v <= 0) return '0 MW';
  if (v < 1) return `${Math.round(v * 1000)} kW`;
  if (v < 10) return `${(Math.round(v * 100) / 100).toString()} MW`;
  if (v < 100) return `${(Math.round(v * 10) / 10).toString()} MW`;
  return `${groupThousands(v)} MW`;
}

export function mwh(v: number): string {
  if (v < 10) return `${v.toFixed(1)} MWh`;
  if (v < 10_000) return `${groupThousands(v)} MWh`;
  if (v < 10_000_000) return `${(v / 1000).toFixed(v < 100_000 ? 1 : 0)} GWh`;
  return `${(v / 1e6).toFixed(1)} TWh`;
}

export function price(p: number | null): string {
  if (p === null || !Number.isFinite(p)) return '–';
  const sign = p < 0 ? MINUS : '';
  return `${sign}€${Math.round(Math.abs(p))}/MWh`;
}

export function pct(share: number | null, digits = 0): string {
  if (share === null || !Number.isFinite(share)) return '–';
  return `${(share * 100).toFixed(digits)}%`;
}

export function count(n: number): string {
  return groupThousands(n);
}

export function years(y: number | null): string {
  if (y === null || !Number.isFinite(y)) return 'never, at these prices';
  if (y > 40) return 'more than 40 years';
  return `about ${Math.max(1, Math.round(y))} years`;
}
