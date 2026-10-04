/**
 * Game time: one absolute hour counter from 00:00 on 1 January of the start
 * year, on the simulation's pure calendar (no Date objects).
 */
import { dayOfYear, hoursInYear, monthOfDay } from '../sim';
import { START_YEAR } from './tuning';

/** Hours in an average month, for durations given in months (permits, builds). */
export const HOURS_PER_MONTH = 730;

/** Absolute hour of 00:00 on 1 January of `year`. */
export function yearStart(year: number): number {
  let t = 0;
  if (year >= START_YEAR) for (let y = START_YEAR; y < year; y++) t += hoursInYear(y);
  else for (let y = year; y < START_YEAR; y++) t -= hoursInYear(y);
  return t;
}

/** Absolute hour of 00:00 on a calendar date. */
export function dateHour(year: number, month: number, day = 1): number {
  return yearStart(year) + dayOfYear({ year, month, day }) * 24;
}

export interface YearHour {
  readonly year: number;
  /** Hour within the year, 0-based. */
  readonly hour: number;
}

export function toYearHour(t: number): YearHour {
  let year = START_YEAR;
  let start = 0;
  if (t >= 0) {
    for (;;) {
      const n = hoursInYear(year);
      if (t < start + n) break;
      start += n;
      year++;
    }
  } else {
    while (t < start) {
      year--;
      start -= hoursInYear(year);
    }
  }
  return { year, hour: t - start };
}

export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
}

export function toDate(t: number): CalendarDate {
  const { year, hour } = toYearHour(t);
  const doy = Math.floor(hour / 24);
  const month = monthOfDay(year, doy);
  const day = doy - dayOfYear({ year, month, day: 1 }) + 1;
  return { year, month, day, hour: hour % 24 };
}

/** Months since January of the start year (0 = January 1995). */
export function monthIndex(t: number): number {
  const d = toDate(t);
  return (d.year - START_YEAR) * 12 + d.month - 1;
}

/** Fractional calendar year, for interpolating annual keyframes smoothly. */
export function fractionalYear(t: number): number {
  const { year, hour } = toYearHour(t);
  return year + hour / hoursInYear(year);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function monthName(month: number, long = false): string {
  return (long ? MONTHS_LONG : MONTHS)[month - 1] ?? '?';
}

/** "14 Mar 1995". */
export function dateLabel(t: number): string {
  const d = toDate(t);
  return `${d.day} ${monthName(d.month)} ${d.year}`;
}

/** "March 1995". */
export function monthLabel(t: number): string {
  const d = toDate(t);
  return `${monthName(d.month, true)} ${d.year}`;
}
