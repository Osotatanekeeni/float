import Decimal from "decimal.js";
import type { CalendarDate } from "../dates";
import { assertCurrencyCode, type CurrencyCode, minorExponent } from "./currency";
import { money, type Money } from "./money";

// A local clone so no other code can change the rounding mode under the engine.
const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN });

/** A user-entered rate (D5): 1 `from` = `rate` `to`, as stored in numeric(18,8). */
export interface FxRate {
  readonly from: CurrencyCode;
  readonly to: CurrencyCode;
  readonly rate: string;
  readonly effectiveDate: CalendarDate;
  readonly sourceNote?: string;
}

export interface Conversion {
  readonly result: Money;
  /** The rate used, so every converted figure can be labelled with its date. */
  readonly rate: FxRate;
}

const RATE_PATTERN = /^\d{1,10}(?:\.\d{1,8})?$/;

export function fxRate(input: {
  from: string;
  to: string;
  rate: string;
  effectiveDate: CalendarDate;
  sourceNote?: string;
}): FxRate {
  const from = assertCurrencyCode(input.from);
  const to = assertCurrencyCode(input.to);
  if (from === to) throw new Error("A rate needs two different currencies");
  if (!RATE_PATTERN.test(input.rate) || new D(input.rate).isZero()) {
    throw new Error("Invalid rate: expected a positive decimal with at most 8 places");
  }
  return { ...input, from, to };
}

/** Converts at the stored rate, rounding half to even exactly once. */
export function convert(value: Money, rate: FxRate): Conversion {
  if (value.currency !== rate.from) {
    throw new Error(`Currency mismatch: ${value.currency} vs rate from ${rate.from}`);
  }
  const shift = minorExponent(rate.to) - minorExponent(rate.from);
  const converted = new D(value.amountMinor)
    .times(rate.rate)
    .times(new D(10).pow(shift))
    .toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN);
  return { result: money(converted.toNumber(), rate.to), rate };
}
