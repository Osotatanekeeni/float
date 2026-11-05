// Explicit table rather than Intl data, so browser and server always agree (invariant 2).
const MINOR_EXPONENTS = {
  AED: 2,
  AUD: 2,
  CAD: 2,
  CHF: 2,
  CNY: 2,
  EUR: 2,
  GBP: 2,
  GHS: 2,
  INR: 2,
  JPY: 0,
  KES: 2,
  KWD: 3,
  NGN: 2,
  USD: 2,
  XAF: 0,
  XOF: 0,
  ZAR: 2,
} as const;

export type CurrencyCode = keyof typeof MINOR_EXPONENTS;

export const CURRENCY_CODES = Object.keys(MINOR_EXPONENTS) as CurrencyCode[];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return Object.hasOwn(MINOR_EXPONENTS, value);
}

export function assertCurrencyCode(value: string): CurrencyCode {
  if (!isCurrencyCode(value)) throw new Error(`Unsupported currency: ${value}`);
  return value;
}

export function minorExponent(currency: CurrencyCode): number {
  return MINOR_EXPONENTS[currency];
}
