/** Number formats for the toys' pages (euros, MW, prices, dates). */

export function eur(v: number): string {
  const sign = v < 0 ? '−' : '';
  const a = Math.abs(v);
  if (a >= 1e6) return `${sign}€${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}m`;
  if (a >= 1e3) return `${sign}€${Math.round(a / 1e3)}k`;
  return `${sign}€${Math.round(a)}`;
}

export function signedEur(v: number): string {
  return v > 0 ? `+${eur(v)}` : eur(v);
}

export function price(v: number): string {
  return `€${v.toFixed(0)}/MWh`;
}

export function mw(v: number): string {
  return `${Math.round(v)} MW`;
}

export function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export function hourLabel(hod: number): string {
  return `${hod < 10 ? '0' : ''}${hod}:00`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "1998-03-14 07:00" → "14 Mar 1998". */
export function shortDate(label: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(label);
  if (m === null) return label;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ''} ${m[1]}`;
}
