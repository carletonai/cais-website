import { easterSunday, holidaysIn, holidaysInMonth } from "./holidays";

const dateOf = (year: number, id: string) =>
  holidaysIn(year).find((holiday) => holiday.id === id)?.date;

describe("easterSunday", () => {
  it.each([
    [2024, "2024-03-31"],
    [2025, "2025-04-20"],
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
    [2028, "2028-04-16"],
    [2038, "2038-04-25"], // the latest Easter this century
  ])("in %i falls on %s", (year, date) => {
    expect(easterSunday(year)).toBe(date);
  });
});

describe("holidaysIn", () => {
  it("places the moveable holidays of 2026", () => {
    expect(dateOf(2026, "family-day")).toBe("2026-02-16");
    expect(dateOf(2026, "good-friday")).toBe("2026-04-03");
    expect(dateOf(2026, "victoria-day")).toBe("2026-05-18");
    expect(dateOf(2026, "labour-day")).toBe("2026-09-07");
    expect(dateOf(2026, "thanksgiving")).toBe("2026-10-12");
  });

  it("places the moveable holidays of 2027", () => {
    expect(dateOf(2027, "family-day")).toBe("2027-02-15");
    expect(dateOf(2027, "good-friday")).toBe("2027-03-26");
    expect(dateOf(2027, "victoria-day")).toBe("2027-05-24");
    expect(dateOf(2027, "labour-day")).toBe("2027-09-06");
    expect(dateOf(2027, "thanksgiving")).toBe("2027-10-11");
  });

  it("keeps Victoria Day before May 25, whatever the weekday", () => {
    // May 25 is a Monday in 2026, so Victoria Day is the Monday before it.
    expect(dateOf(2026, "victoria-day")).toBe("2026-05-18");
    // May 24 is a Monday in 2027 and is the day itself.
    expect(dateOf(2027, "victoria-day")).toBe("2027-05-24");
    expect(dateOf(2025, "victoria-day")).toBe("2025-05-19");
  });

  it("keeps the fixed dates fixed", () => {
    for (const year of [2025, 2026, 2027]) {
      expect(dateOf(year, "new-years-day")).toBe(`${year}-01-01`);
      expect(dateOf(year, "canada-day")).toBe(`${year}-07-01`);
      expect(dateOf(year, "truth-and-reconciliation")).toBe(`${year}-09-30`);
      expect(dateOf(year, "remembrance-day")).toBe(`${year}-11-11`);
      expect(dateOf(year, "christmas-day")).toBe(`${year}-12-25`);
      expect(dateOf(year, "boxing-day")).toBe(`${year}-12-26`);
    }
  });

  it("only knows the National Day for Truth and Reconciliation from 2021", () => {
    expect(dateOf(2020, "truth-and-reconciliation")).toBeUndefined();
    expect(dateOf(2021, "truth-and-reconciliation")).toBe("2021-09-30");
  });

  it("lists the ten federal holidays plus Family Day, in date order", () => {
    const holidays = holidaysIn(2026);
    expect(holidays).toHaveLength(11);
    expect(holidays.map((h) => h.date)).toEqual(
      [...holidays.map((h) => h.date)].sort(),
    );
    expect(new Set(holidays.map((h) => h.id)).size).toBe(11);
    expect(holidays.filter((h) => h.scope === "Ontario")).toEqual([
      expect.objectContaining({ id: "family-day" }),
    ]);
    // Easter Monday is a federal public-service day, not a statutory one.
    expect(dateOf(2026, "easter-monday")).toBeUndefined();
  });
});

test("holidaysInMonth picks a month's holidays", () => {
  expect(holidaysInMonth(2026, 9).map((h) => h.name)).toEqual([
    "Labour Day",
    "National Day for Truth and Reconciliation",
  ]);
  expect(holidaysInMonth(2026, 10).map((h) => h.name)).toEqual([
    "Thanksgiving",
  ]);
  expect(holidaysInMonth(2026, 6)).toEqual([]);
});
