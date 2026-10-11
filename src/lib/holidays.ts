/**
 * Public holidays, computed from their rules rather than typed in each year.
 *
 * The national list is Canada's federal statutory holidays. Family Day is
 * added because the club is in Ontario, where it is a statutory holiday;
 * its scope says so. Each holiday is shown on its actual date, not the
 * weekday an employer may observe it on when it falls on a weekend.
 */

export type HolidayScope = "Canada" | "Ontario";

export interface Holiday {
  /** Stable across years: "thanksgiving", "good-friday". */
  id: string;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  scope: HolidayScope;
}

const ymd = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/** YYYY-MM-DD for `days` after a date, in UTC arithmetic (no DST here). */
const shift = (date: string, days: number) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/** The nth (1-based) given weekday of a month; `n` of -1 means the last. */
const nthWeekday = (
  year: number,
  month: number,
  weekday: number,
  n: number,
) => {
  if (n > 0) {
    const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return ymd(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
  }
  const lastDay = new Date(Date.UTC(year, month, 0));
  const back = (lastDay.getUTCDay() - weekday + 7) % 7;
  return ymd(year, month, lastDay.getUTCDate() - back);
};

/** Easter Sunday (Gregorian), by the anonymous algorithm of Meeus. */
export const easterSunday = (year: number) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return ymd(year, month, day);
};

/** Victoria Day: the last Monday before May 25. */
const victoriaDay = (year: number) => {
  const may24 = new Date(Date.UTC(year, 4, 24));
  return ymd(year, 5, 24 - ((may24.getUTCDay() - 1 + 7) % 7));
};

/** Every holiday in a calendar year, in date order. */
export const holidaysIn = (year: number): Holiday[] => {
  const easter = easterSunday(year);
  const canada = (id: string, name: string, date: string): Holiday => ({
    id,
    name,
    date,
    scope: "Canada",
  });
  const ontario = (id: string, name: string, date: string): Holiday => ({
    id,
    name,
    date,
    scope: "Ontario",
  });
  return [
    canada("new-years-day", "New Year's Day", ymd(year, 1, 1)),
    ontario("family-day", "Family Day", nthWeekday(year, 2, 1, 3)),
    canada("good-friday", "Good Friday", shift(easter, -2)),
    canada("easter-monday", "Easter Monday", shift(easter, 1)),
    canada("victoria-day", "Victoria Day", victoriaDay(year)),
    canada("canada-day", "Canada Day", ymd(year, 7, 1)),
    canada("labour-day", "Labour Day", nthWeekday(year, 9, 1, 1)),
    canada(
      "truth-and-reconciliation",
      "National Day for Truth and Reconciliation",
      ymd(year, 9, 30),
    ),
    canada("thanksgiving", "Thanksgiving", nthWeekday(year, 10, 1, 2)),
    canada("remembrance-day", "Remembrance Day", ymd(year, 11, 11)),
    canada("christmas-day", "Christmas Day", ymd(year, 12, 25)),
    canada("boxing-day", "Boxing Day", ymd(year, 12, 26)),
  ].sort((a, b) => a.date.localeCompare(b.date));
};

/** The holidays in a given month (1-12), in date order. */
export const holidaysInMonth = (year: number, month: number) =>
  holidaysIn(year).filter(
    (holiday) => Number(holiday.date.slice(5, 7)) === month,
  );
