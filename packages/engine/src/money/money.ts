import { assertCurrencyCode, type CurrencyCode, minorExponent } from "./currency";

/** An exact amount in integer minor units (kobo, cents) with its currency. */
export interface Money {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

function checked(amountMinor: number): number {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError("Amount must be a safe integer of minor units");
  }
  return amountMinor === 0 ? 0 : amountMinor; // normalise -0
}

export function money(amountMinor: number, currency: string): Money {
  return { amountMinor: checked(amountMinor), currency: assertCurrencyCode(currency) };
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: checked(a.amountMinor + b.amountMinor), currency: a.currency };
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: checked(a.amountMinor - b.amountMinor), currency: a.currency };
}

export function negate(a: Money): Money {
  return { amountMinor: checked(-a.amountMinor), currency: a.currency };
}

export function sum(items: readonly Money[], currency: CurrencyCode): Money {
  return items.reduce(add, money(0, currency));
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  return a.amountMinor < b.amountMinor ? -1 : a.amountMinor > b.amountMinor ? 1 : 0;
}

const MAJOR_PATTERN = /^(-)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?$/;

/** Parses a major-unit string ("412,300.50") into exact minor units, without going through floats. */
export function parseMajor(input: string, currency: string): Money {
  const code = assertCurrencyCode(currency);
  const match = MAJOR_PATTERN.exec(input.trim());
  if (!match) throw new Error("Not a valid amount");
  const [, sign, whole, fraction = ""] = match;
  const exponent = minorExponent(code);
  if (fraction.length > exponent) {
    throw new Error(`Too many decimal places for ${code} (max ${exponent})`);
  }
  const digits = whole.replaceAll(",", "") + fraction.padEnd(exponent, "0");
  return money((sign ? -1 : 1) * Number(digits), code);
}

/** Exact major-unit decimal string ("-2700.05"), for inputs and serialisation, not display. */
export function toMajorString(value: Money): string {
  const exponent = minorExponent(value.currency);
  const digits = Math.abs(value.amountMinor).toString().padStart(exponent + 1, "0");
  const sign = value.amountMinor < 0 ? "-" : "";
  if (exponent === 0) return sign + digits;
  return `${sign}${digits.slice(0, -exponent)}.${digits.slice(-exponent)}`;
}
