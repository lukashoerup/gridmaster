/**
 * Money is kept in integer euro cents (the report's architecture rule), so
 * a ledger always adds up exactly. Rates and prices stay plain numbers.
 */

export function cents(eur: number): number {
  return Math.round(eur * 100);
}

export function euros(c: number): number {
  return c / 100;
}

/**
 * Monthly instalment of an annuity loan: the payment that clears `principal`
 * cents over `months` at `ratePct` a year, rounded to the cent.
 */
export function monthlyPayment(principal: number, ratePct: number, months: number): number {
  if (months <= 0) return principal;
  const r = ratePct / 100 / 12;
  if (r <= 0) return Math.ceil(principal / months);
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -months)));
}

/** Present value of 1 a year for `years` years at `rate` (fractional years allowed). */
export function annuityFactor(rate: number, years: number): number {
  if (years <= 0) return 0;
  if (rate <= 0) return years;
  return (1 - Math.pow(1 + rate, -years)) / rate;
}

/** "1,234,567" — thousands grouped with commas, without the host's locale. */
export function groupThousands(n: number): string {
  const sign = n < 0 ? '-' : '';
  const digits = String(Math.round(Math.abs(n)));
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ',';
    out += digits[i];
  }
  return sign + out;
}
