import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { calendarDate } from "../dates";
import { convert, fxRate, money } from "./index";

const asOf = calendarDate("2026-11-01");
const usdToNgn = fxRate({ from: "USD", to: "NGN", rate: "1520.5", effectiveDate: asOf });

describe("fxRate()", () => {
  it("accepts a positive decimal with up to 8 places (numeric 18,8)", () => {
    expect(usdToNgn.rate).toBe("1520.5");
    expect(() => fxRate({ from: "USD", to: "NGN", rate: "0.00000001", effectiveDate: asOf })).not.toThrow();
  });

  it("rejects zero, negative, malformed or over-precise rates", () => {
    for (const rate of ["0", "-1", "abc", "1e3", "1.123456789", ""]) {
      expect(() => fxRate({ from: "USD", to: "NGN", rate, effectiveDate: asOf })).toThrow(/rate/i);
    }
  });

  it("rejects a rate between the same currency", () => {
    expect(() => fxRate({ from: "NGN", to: "NGN", rate: "1", effectiveDate: asOf })).toThrow(/currenc/i);
  });
});

describe("convert()", () => {
  it("converts minor units exactly at the stored rate", () => {
    // $250.00 at 1,520.50 = ₦380,125.00
    const { result } = convert(money(25_000, "USD"), usdToNgn);
    expect(result).toEqual(money(38_012_500, "NGN"));
  });

  it("labels the result with the rate and its date (invariant 3)", () => {
    const { rate } = convert(money(100, "USD"), usdToNgn);
    expect(rate).toEqual(usdToNgn);
    expect(rate.effectiveDate).toBe("2026-11-01");
  });

  it("uses banker's rounding (half to even), once", () => {
    const half = fxRate({ from: "USD", to: "NGN", rate: "2.5", effectiveDate: asOf });
    expect(convert(money(1, "USD"), half).result.amountMinor).toBe(2); // 2.5 -> 2
    expect(convert(money(3, "USD"), half).result.amountMinor).toBe(8); // 7.5 -> 8
    expect(convert(money(-1, "USD"), half).result.amountMinor).toBe(-2); // -2.5 -> -2
  });

  it("does not suffer floating-point error", () => {
    // 0.1 * 3 in floats is 0.30000000000000004; at 4 minor units this would round the wrong way
    const r = fxRate({ from: "USD", to: "NGN", rate: "0.1", effectiveDate: asOf });
    expect(convert(money(35, "USD"), r).result.amountMinor).toBe(4); // 3.5 -> 4
    expect(convert(money(25, "USD"), r).result.amountMinor).toBe(2); // 2.5 -> 2
  });

  it("handles currencies with different minor-unit exponents", () => {
    const jpy = fxRate({ from: "JPY", to: "NGN", rate: "10.25", effectiveDate: asOf });
    // ¥1,000 -> ₦10,250.00
    expect(convert(money(1000, "JPY"), jpy).result).toEqual(money(1_025_000, "NGN"));
    const kwd = fxRate({ from: "NGN", to: "KWD", rate: "0.0002", effectiveDate: asOf });
    // ₦10,000.00 -> KWD 2.000
    expect(convert(money(1_000_000, "NGN"), kwd).result).toEqual(money(2000, "KWD"));
  });

  it("refuses money whose currency doesn't match the rate", () => {
    expect(() => convert(money(100, "EUR"), usdToNgn)).toThrow(/currency/i);
  });

  it("property: result is always an integer and deterministic", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1e11, max: 1e11 }),
        fc.integer({ min: 1, max: 99_999_999 }),
        (minor, rateMicro) => {
          const r = fxRate({ from: "USD", to: "NGN", rate: (rateMicro / 1e4).toFixed(4), effectiveDate: asOf });
          const a = convert(money(minor, "USD"), r).result.amountMinor;
          expect(Number.isSafeInteger(a)).toBe(true);
          expect(convert(money(minor, "USD"), r).result.amountMinor).toBe(a);
        },
      ),
    );
  });

  it("property: conversion is sign-symmetric", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e11 }), (minor) => {
        const pos = convert(money(minor, "USD"), usdToNgn).result.amountMinor;
        const neg = convert(money(-minor, "USD"), usdToNgn).result.amountMinor;
        expect(neg).toBe(-pos || 0);
      }),
    );
  });
});
