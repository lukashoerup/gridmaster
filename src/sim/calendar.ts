/**
 * A pure calendar: no Date objects, no time zones. The simulation runs on a
 * fixed timestep of one hour; hour 0 of a year is 00:00 on 1 January.
 */

export interface DateYMD {
  readonly year: number;
  readonly month: number; // 1–12
  readonly day: number; // 1–31
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export function hoursInYear(year: number): number {
  return daysInYear(year) * 24;
}

const CUMULATIVE_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** 0-based day of year of a calendar date. */
export function dayOfYear(date: DateYMD): number {
  const base = CUMULATIVE_DAYS[date.month - 1];
  if (base === undefined) throw new Error(`bad month ${date.month}`);
  const leapShift = date.month > 2 && isLeapYear(date.year) ? 1 : 0;
  return base + leapShift + date.day - 1;
}

/** Hour index within the year (0-based) for a date at the given hour. */
export function hourOfYear(date: DateYMD, hour = 0): number {
  return dayOfYear(date) * 24 + hour;
}

/** Month (1–12) of a 0-based day of year. */
export function monthOfDay(year: number, doy: number): number {
  const leap = isLeapYear(year) ? 1 : 0;
  for (let m = 11; m >= 0; m--) {
    const start = (CUMULATIVE_DAYS[m] ?? 0) + (m >= 2 ? leap : 0);
    if (doy >= start) return m + 1;
  }
  return 1;
}

/** Days since 1970-01-01 of a civil date (Howard Hinnant's algorithm). */
export function daysFromCivil(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = (month + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Day of week, 0 = Monday … 6 = Sunday, for a 0-based day of the year. */
export function dayOfWeek(year: number, doy: number): number {
  const days = daysFromCivil(year, 1, 1) + doy;
  // 1970-01-01 was a Thursday (3 with Monday = 0).
  return (((days + 3) % 7) + 7) % 7;
}

/** Compare two dates: negative if a < b, 0 if equal, positive if a > b. */
export function compareDates(a: DateYMD, b: DateYMD): number {
  return daysFromCivil(a.year, a.month, a.day) - daysFromCivil(b.year, b.month, b.day);
}

/** First hour index (within `year`) at or after which `date` applies; 0 if before the year, hours if after it. */
export function hourFromDate(year: number, date: DateYMD): number {
  if (date.year < year) return 0;
  if (date.year > year) return hoursInYear(year);
  return hourOfYear(date);
}

/** Calendar label for an hour index, e.g. "2015-03-14 07:00". */
export function labelForHour(year: number, h: number): string {
  const doy = Math.floor(h / 24);
  const hour = h % 24;
  const month = monthOfDay(year, doy);
  const leap = isLeapYear(year) ? 1 : 0;
  const monthStart = (CUMULATIVE_DAYS[month - 1] ?? 0) + (month > 2 ? leap : 0);
  const day = doy - monthStart + 1;
  const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:00`;
}

/** Parse "YYYY-MM-DD" (data files). Throws on anything else. */
export function parseDate(s: string): DateYMD {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error(`bad date "${s}" (expected YYYY-MM-DD)`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) throw new Error(`bad date "${s}"`);
  return { year, month, day };
}
