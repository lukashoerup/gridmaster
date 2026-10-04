import { describe, expect, it } from 'vitest';
import { dailyFromMonthly, dayOfWeek, daysInMonth, hourFromDate, hourOfYear, hoursInYear, isLeapYear, labelForHour, monthOfDay, parseDate } from '../src/sim';

describe('calendar', () => {
  it('knows leap years and hours per year', () => {
    expect(isLeapYear(1996)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(1995)).toBe(false);
    expect(hoursInYear(1995)).toBe(8760);
    expect(hoursInYear(1996)).toBe(8784);
  });

  it('computes days of the week (0 = Monday)', () => {
    expect(dayOfWeek(1995, 0)).toBe(6); // 1 Jan 1995 was a Sunday
    expect(dayOfWeek(2000, 0)).toBe(5); // 1 Jan 2000 was a Saturday
    expect(dayOfWeek(2024, 0)).toBe(0); // 1 Jan 2024 was a Monday
    expect(dayOfWeek(2025, 364)).toBe(2); // 31 Dec 2025 is a Wednesday
  });

  it('maps dates to hour indices and back to labels', () => {
    expect(hourOfYear({ year: 1999, month: 7, day: 1 })).toBe(181 * 24);
    expect(hourOfYear({ year: 2000, month: 3, day: 1 })).toBe((31 + 29) * 24);
    expect(labelForHour(1999, 181 * 24)).toBe('1999-07-01 00:00');
    expect(labelForHour(2000, (31 + 29) * 24 + 7)).toBe('2000-03-01 07:00');
    expect(monthOfDay(2000, 59)).toBe(2);
    expect(monthOfDay(2000, 60)).toBe(3);
    expect(monthOfDay(1995, 364)).toBe(12);
  });

  it('places a date within, before or after a year', () => {
    const open = parseDate('1999-07-01');
    expect(hourFromDate(1999, open)).toBe(181 * 24);
    expect(hourFromDate(2000, open)).toBe(0);
    expect(hourFromDate(1998, open)).toBe(8760);
  });

  it('rejects malformed dates and days a month does not have (stress F10)', () => {
    expect(() => parseDate('1999-7-1')).toThrow();
    expect(() => parseDate('1999-13-01')).toThrow();
    expect(() => parseDate('1999-02-31')).toThrow(/no such day/);
    expect(() => parseDate('1999-02-29')).toThrow(/no such day/);
    expect(() => parseDate('1999-04-31')).toThrow(/no such day/);
    expect(parseDate('2000-02-29')).toEqual({ year: 2000, month: 2, day: 29 });
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2024, 12)).toBe(31);
  });

  it('interpolates monthly values daily without a step on the 1st (analyst B7)', () => {
    const monthly = [0.62, 0.52, 0.42, 0.34, 0.36, 0.56, 0.7, 0.78, 0.82, 0.85, 0.8, 0.72];
    for (const year of [2019, 2020]) {
      const daily = dailyFromMonthly(monthly, year);
      expect(daily.length).toBe(isLeapYear(year) ? 366 : 365);
      // The largest day-to-day change is a normal daily slope, not a monthly jump (biggest monthly step: 0.20).
      let maxStep = 0;
      for (let d = 1; d < daily.length; d++) maxStep = Math.max(maxStep, Math.abs((daily[d] ?? 0) - (daily[d - 1] ?? 0)));
      expect(maxStep).toBeLessThan(0.2 / 25);
      // Across New Year it continues from December towards January.
      const dec31 = daily[daily.length - 1] ?? 0;
      const jan1 = daily[0] ?? 0;
      expect(Math.abs(jan1 - dec31)).toBeLessThan(0.01);
      // Mid-month values equal the monthly ones (15 July at noon is within half a day of mid-month).
      expect(daily[hourOfYear({ year, month: 7, day: 16 }) / 24] ?? 0).toBeCloseTo(0.7, 2);
      for (const v of daily) expect(v >= 0.34 - 1e-12 && v <= 0.85 + 1e-12).toBe(true);
    }
  });
});
