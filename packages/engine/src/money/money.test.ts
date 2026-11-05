import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  add,
  compare,
  isCurrencyCode,
  minorExponent,
  money,
  negate,
  parseMajor,
  subtract,
  sum,
  toMajorString,
} from "./index";

const ngn = (minor: number) => money(minor, "NGN");
const safeMinor = fc.integer({ min: -1e13, max: 1e13 });

describe("currency codes", () => {
  it("accepts supported ISO 4217 codes and rejects anything else", () => {
    expect(isCurrencyCode("NGN")).toBe(true);
    expect(isCurrencyCode("USD")).toBe(true);
    expect(isCurrencyCode("ngn")).toBe(false);
    expect(isCurrencyCode("NAIRA")).toBe(false);
    expect(isCurrencyCode("XYZ")).toBe(false);
  });

  it("knows each currency's minor-unit exponent", () => {
    expect(minorExponent("NGN")).toBe(2);
    expect(minorExponent("JPY")).toBe(0);
    expect(minorExponent("KWD")).toBe(3);
  });
});

describe("money()", () => {
  it("stores integer minor units with a currency code", () => {
    expect(ngn(41_500_000)).toEqual({ amountMinor: 41_500_000, currency: "NGN" });
  });

  it("rejects fractional, non-finite and unsafe amounts", () => {
    expect(() => ngn(1.5)).toThrow(/integer/);
    expect(() => ngn(Number.NaN)).toThrow(/integer/);
    expect(() => ngn(Number.MAX_SAFE_INTEGER + 1)).toThrow(/integer/);
  });

  it("rejects an unknown currency", () => {
    expect(() => money(100, "XYZ")).toThrow(/currency/i);
  });
});

describe("arithmetic", () => {
  it("adds and subtracts in the same currency", () => {
    expect(add(ngn(50_000_000), ngn(-2_000_000))).toEqual(ngn(48_000_000));
    // FLT-ACC-03: entering 412,300 when Float shows 415,000 is a -2,700 difference
    expect(subtract(ngn(41_230_000), ngn(41_500_000))).toEqual(ngn(-270_000));
  });

  it("refuses to mix currencies", () => {
    expect(() => add(ngn(100), money(100, "USD"))).toThrow(/currency/i);
    expect(() => sum([ngn(1), money(1, "USD")], "NGN")).toThrow(/currency/i);
  });

  it("throws instead of losing precision past the safe-integer range", () => {
    expect(() => add(ngn(Number.MAX_SAFE_INTEGER), ngn(1))).toThrow(/safe/);
  });

  it("sums an empty list to zero in the requested currency", () => {
    expect(sum([], "NGN")).toEqual(ngn(0));
  });

  it("compares amounts", () => {
    expect(compare(ngn(1), ngn(2))).toBe(-1);
    expect(compare(ngn(2), ngn(2))).toBe(0);
    expect(compare(ngn(3), ngn(2))).toBe(1);
  });

  it("property: addition is commutative and associative", () => {
    fc.assert(
      fc.property(safeMinor, safeMinor, safeMinor, (a, b, c) => {
        expect(add(ngn(a), ngn(b))).toEqual(add(ngn(b), ngn(a)));
        expect(add(add(ngn(a), ngn(b)), ngn(c))).toEqual(add(ngn(a), add(ngn(b), ngn(c))));
      }),
    );
  });

  it("property: subtracting what was added restores the original", () => {
    fc.assert(
      fc.property(safeMinor, safeMinor, (a, b) => {
        expect(subtract(add(ngn(a), ngn(b)), ngn(b))).toEqual(ngn(a));
        expect(add(ngn(a), negate(ngn(a))).amountMinor).toBe(0);
      }),
    );
  });
});

describe("parseMajor / toMajorString", () => {
  it("parses user input in major units into exact minor units", () => {
    expect(parseMajor("412,300", "NGN")).toEqual(ngn(41_230_000));
    expect(parseMajor("0.1", "NGN")).toEqual(ngn(10));
    expect(parseMajor("-2,700.05", "NGN")).toEqual(ngn(-270_005));
    expect(parseMajor("1500", "JPY")).toEqual(money(1500, "JPY"));
    expect(parseMajor("1.234", "KWD")).toEqual(money(1234, "KWD"));
  });

  it("rejects more decimals than the currency allows, and garbage", () => {
    expect(() => parseMajor("1.005", "NGN")).toThrow(/decimal/);
    expect(() => parseMajor("1.5", "JPY")).toThrow(/decimal/);
    expect(() => parseMajor("", "NGN")).toThrow();
    expect(() => parseMajor("12abc", "NGN")).toThrow();
    expect(() => parseMajor("1e5", "NGN")).toThrow();
    expect(() => parseMajor("1,2,3.4.5", "NGN")).toThrow();
  });

  it("formats minor units as an exact major-unit decimal string", () => {
    expect(toMajorString(ngn(41_230_000))).toBe("412300.00");
    expect(toMajorString(ngn(-270_005))).toBe("-2700.05");
    expect(toMajorString(ngn(-5))).toBe("-0.05");
    expect(toMajorString(money(1500, "JPY"))).toBe("1500");
  });

  it("property: parseMajor(toMajorString(m)) round-trips exactly", () => {
    fc.assert(
      fc.property(safeMinor, fc.constantFrom("NGN", "JPY", "KWD"), (minor, currency) => {
        const m = money(minor, currency);
        expect(parseMajor(toMajorString(m), currency)).toEqual(m);
      }),
    );
  });
});
