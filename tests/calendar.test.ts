import { describe, expect, it } from 'vitest';
import { dayOfWeek, hourFromDate, hourOfYear, hoursInYear, isLeapYear, labelForHour, monthOfDay, parseDate } from '../src/sim';

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

  it('rejects malformed dates', () => {
    expect(() => parseDate('1999-7-1')).toThrow();
    expect(() => parseDate('1999-13-01')).toThrow();
  });
});
