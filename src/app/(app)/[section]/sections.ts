// Placeholder screens the navigation points at. Each is replaced by its real screen in a later milestone.
export const sections = {
  timeline: { title: "Timeline", description: "Money in and out over the next 90 days arrives with the core screens." },
  accounts: { title: "Accounts", description: "Your accounts, balances and transactions arrive with the core screens." },
  add: { title: "Add", description: "Quick entry for income, expenses, transfers and commitments arrives with the core screens." },
  more: { title: "More", description: "" },
  transactions: { title: "Transactions", description: "Your transaction history arrives with the core screens." },
  income: { title: "Income", description: "Income sources and their certainty arrive with the core screens." },
  expenses: { title: "Expenses", description: "Bills, subscriptions and planned purchases arrive with the core screens." },
  commitments: { title: "Commitments", description: "Reserved money for rent and other obligations arrives with the core screens." },
  forecast: { title: "Forecast", description: "The 90-day projection arrives with the forecast engine." },
  "what-if": { title: "What-if simulator", description: "Testing a purchase before you make it arrives with the simulator." },
  categories: { title: "Categories", description: "Spending categories arrive with the core screens." },
  settings: { title: "Settings", description: "Currency, buffer, rates and notifications arrive with the core screens." },
} as const;

export type SectionSlug = keyof typeof sections;

export function isSection(value: string): value is SectionSlug {
  return Object.hasOwn(sections, value);
}
