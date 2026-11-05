import { afterEach, describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  addDays,
  addMonthsClamped,
  calendarDate,
  compareDates,
  dateRange,
  daysBetween,
  daysInMonth,
  isCalendarDate,
  isValidTimeZone,
  todayIn,
} from "./index";

const d = calendarDate;

const anyDate = fc
  .integer({ min: Date.UTC(1990, 0, 1), max: Date.UTC(2100, 11, 31) })
  .map((ms) => d(new Date(ms).toISOString().slice(0, 10)));

describe("calendarDate()", () => {
  it("accepts real YYYY-MM-DD dates", () => {
    expect(d("2026-11-05")).toBe("2026-11-05");
    expect(d("2028-02-29")).toBe("2028-02-29");
  });

  it("rejects impossible or badly formatted dates", () => {
    for (const s of ["2026-02-29", "2026-02-30", "2026-13-01", "2026-2-3", "2026-11-05T00:00", "", "05/11/2026"]) {
      expect(isCalendarDate(s)).toBe(false);
      expect(() => d(s)).toThrow(/date/i);
    }
  });
});

describe("todayIn() — dates anchored to the user's timezone", () => {
  it("rolls over at local midnight, not UTC midnight (Africa/Lagos is UTC+1)", () => {
    expect(todayIn("Africa/Lagos", new Date("2026-11-04T22:59:59.999Z"))).toBe("2026-11-04");
    expect(todayIn("Africa/Lagos", new Date("2026-11-04T23:00:00.000Z"))).toBe("2026-11-05");
  });

  it("gives different dates for the same instant in different zones", () => {
    const instant = new Date("2026-11-04T23:30:00Z");
    expect(todayIn("UTC", instant)).toBe("2026-11-04");
    expect(todayIn("Africa/Lagos", instant)).toBe("2026-11-05");
    expect(todayIn("America/New_York", instant)).toBe("2026-11-04");
    expect(todayIn("Asia/Tokyo", instant)).toBe("2026-11-05");
  });

  it("rejects an invalid timezone", () => {
    expect(isValidTimeZone("Africa/Lagos")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(() => todayIn("Mars/Olympus", new Date("2026-11-05T00:00:00Z"))).toThrow(/time ?zone/i);
  });
});

describe("day arithmetic", () => {
  it("adds days across month, year and leap boundaries", () => {
    expect(addDays(d("2026-11-05"), 90)).toBe("2027-02-03");
    expect(addDays(d("2026-12-31"), 1)).toBe("2027-01-01");
    expect(addDays(d("2028-02-28"), 1)).toBe("2028-02-29");
    expect(addDays(d("2026-03-01"), -1)).toBe("2026-02-28");
  });

  it("counts days between dates (worked example: Nov 5 to Nov 25 is 20 days)", () => {
    expect(daysBetween(d("2026-11-05"), d("2026-11-25"))).toBe(20);
    expect(daysBetween(d("2026-11-25"), d("2026-11-05"))).toBe(-20);
  });

  it("compares dates", () => {
    expect(compareDates(d("2026-11-05"), d("2026-11-06"))).toBe(-1);
    expect(compareDates(d("2026-11-05"), d("2026-11-05"))).toBe(0);
    expect(compareDates(d("2027-01-01"), d("2026-12-31"))).toBe(1);
  });

  it("builds an inclusive range: today plus a 90-day horizon is 91 days", () => {
    const range = dateRange(d("2026-11-05"), 90);
    expect(range).toHaveLength(91);
    expect(range[0]).toBe("2026-11-05");
    expect(range[90]).toBe("2027-02-03");
  });

  it("rejects a negative or fractional range length", () => {
    expect(() => dateRange(d("2026-11-05"), -1)).toThrow(/range/);
    expect(() => dateRange(d("2026-11-05"), 1.5)).toThrow(/range/);
  });

  it("property: addDays and daysBetween are inverse", () => {
    fc.assert(
      fc.property(anyDate, fc.integer({ min: -2000, max: 2000 }), (date, n) => {
        expect(daysBetween(date, addDays(date, n))).toBe(n);
        expect(addDays(addDays(date, n), -n)).toBe(date);
      }),
    );
  });
});

describe("month arithmetic (expenses on the 31st)", () => {
  it("knows month lengths, including leap years", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(() => daysInMonth(2026, 13)).toThrow(/month/);
  });

  it("clamps to the last day of shorter months", () => {
    expect(addMonthsClamped(d("2026-01-31"), 1)).toBe("2026-02-28");
    expect(addMonthsClamped(d("2028-01-31"), 1)).toBe("2028-02-29");
    expect(addMonthsClamped(d("2026-03-31"), -1)).toBe("2026-02-28");
    expect(addMonthsClamped(d("2026-08-31"), 1)).toBe("2026-09-30");
    expect(addMonthsClamped(d("2026-11-15"), 14)).toBe("2028-01-15");
  });
});

describe("determinism (invariant 2): results don't depend on the host timezone", () => {
  const original = process.env.TZ;
  afterEach(() => {
    process.env.TZ = original;
  });

  it("gives identical results under different process timezones", () => {
    const run = () => [
      addDays(d("2026-03-28"), 2), // across a European DST change
      addDays(d("2026-11-01"), 1), // across a US DST change
      addMonthsClamped(d("2026-01-31"), 1),
      daysBetween(d("2026-03-01"), d("2026-04-01")),
      todayIn("Africa/Lagos", new Date("2026-11-04T23:00:00Z")),
    ];
    const results = ["UTC", "Europe/London", "America/New_York", "Pacific/Kiritimati", "Pacific/Pago_Pago"].map(
      (tz) => {
        process.env.TZ = tz;
        return run();
      },
    );
    for (const r of results) expect(r).toEqual(results[0]);
  });
});
