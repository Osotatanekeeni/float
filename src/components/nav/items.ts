import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  ChartLine,
  Ellipsis,
  House,
  Plus,
  Settings,
  SlidersHorizontal,
  Tags,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
}

// Mobile: Home, Timeline, Add, Accounts, More (DESIGN.md 4). The tabs are icons with short labels.
export const bottomTabs: NavItem[] = [
  { label: "Home", href: "/home", icon: House },
  { label: "Timeline", href: "/timeline", icon: CalendarDays },
  { label: "Add", href: "/add", icon: Plus, primary: true },
  { label: "Accounts", href: "/accounts", icon: Wallet },
  { label: "More", href: "/more", icon: Ellipsis },
];

// What More contains on phones; the sidebar lists these too.
export const moreLinks: NavItem[] = [
  { label: "Forecast", href: "/forecast", icon: ChartLine },
  { label: "What-if simulator", href: "/what-if", icon: SlidersHorizontal },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const sidebarSections: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [{ label: "Home", href: "/home", icon: House }] },
  {
    title: "Money",
    items: [
      { label: "Accounts", href: "/accounts", icon: Wallet },
      { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
      { label: "Income", href: "/income", icon: ArrowDownLeft },
      { label: "Expenses", href: "/expenses", icon: ArrowUpRight },
      { label: "Commitments", href: "/commitments", icon: Target },
    ],
  },
  {
    title: "Planning",
    items: [
      { label: "Cash-flow timeline", href: "/timeline", icon: CalendarDays },
      { label: "Forecast", href: "/forecast", icon: ChartLine },
      { label: "What-if simulator", href: "/what-if", icon: SlidersHorizontal },
    ],
  },
  {
    title: "Personal",
    items: [
      { label: "Categories", href: "/categories", icon: Tags },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** More is highlighted for itself and for every page that lives under it. */
export function isTabActive(pathname: string, tab: NavItem): boolean {
  if (tab.href === "/more") return isActive(pathname, "/more") || moreLinks.some((l) => isActive(pathname, l.href));
  return isActive(pathname, tab.href);
}
