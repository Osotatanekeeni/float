import { Plus, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/ui/status-pill";
import { darkTokens, lightTokens, type ThemeTokens } from "@/design/tokens";

export const metadata: Metadata = { title: "Design system" };

const swatches: { label: string; key: keyof ThemeTokens }[] = [
  { label: "Brand primary", key: "brandPrimary" },
  { label: "Brand secondary", key: "brandSecondary" },
  { label: "Brand soft", key: "brandSoft" },
  { label: "App background", key: "appBackground" },
  { label: "Surface", key: "surface" },
  { label: "Text primary", key: "textPrimary" },
  { label: "Text muted", key: "textMuted" },
  { label: "Border strong", key: "borderStrong" },
];

function ThemePanel({ theme, tokens }: { theme: "light" | "dark"; tokens: ThemeTokens }) {
  const id = `${theme}-heading`;
  return (
    <section
      data-theme={theme}
      aria-labelledby={id}
      className="flex flex-col gap-5 rounded-card border border-line bg-app p-4 text-ink md:p-6"
    >
      <h2 id={id} className="text-lg font-semibold capitalize md:text-xl">
        {theme} theme
      </h2>

      <div>
        <h3 className="mb-2 text-base font-semibold">Colour tokens</h3>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {swatches.map(({ label, key }) => (
            <li key={key} className="flex flex-col gap-1 text-xs">
              <span
                aria-hidden
                className="h-8 rounded-input border border-line-strong"
                style={{ backgroundColor: tokens[key] }}
              />
              <span className="text-ink-2">{label}</span>
              <span className="font-mono text-ink-muted">{tokens[key]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-base font-semibold">Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <Button>Add income</Button>
          <Button variant="secondary">Reserve money</Button>
          <Button variant="outline">View forecast</Button>
          <Button variant="ghost">Edit commitment</Button>
          <Button variant="destructive">
            <Trash2 aria-hidden />
            Delete
          </Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="icon" aria-label="Quick add">
            <Plus aria-hidden />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-base font-semibold">Status</h3>
        <div className="flex flex-wrap gap-2">
          <StatusPill state="available">Available</StatusPill>
          <StatusPill state="income">Confirmed income</StatusPill>
          <StatusPill state="planned">Planned expense</StatusPill>
          <StatusPill state="caution">Close to buffer</StatusPill>
          <StatusPill state="shortfall">Projected shortfall</StatusPill>
          <StatusPill state="info">Estimated</StatusPill>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Card with a field</CardTitle>
          <CardDescription>Cards use a soft border, a 16px radius and a minimal shadow.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${theme}-amount`}>Amount</Label>
            <Input id={`${theme}-amount`} inputMode="decimal" placeholder="0.00" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${theme}-amount-error`}>Amount with an error</Label>
            <Input
              id={`${theme}-amount-error`}
              inputMode="decimal"
              defaultValue="0"
              aria-invalid="true"
              aria-describedby={`${theme}-amount-help`}
            />
            <p id={`${theme}-amount-help`} className="text-[0.8125rem] text-status-shortfall-ink">
              Enter an amount greater than zero.
            </p>
          </div>
          <p className="money text-2xl font-bold">1,234,567.89</p>
          <p className="text-[0.8125rem] text-ink-muted">Example figure: DM Sans with tabular numerals.</p>
        </CardContent>
      </Card>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand md:text-[1.75rem]">Float design system</h1>
          <p className="text-ink-2">Core components in both themes. Use the toggle to switch the whole page.</p>
        </div>
        <ThemeToggle />
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <ThemePanel theme="light" tokens={lightTokens} />
        <ThemePanel theme="dark" tokens={darkTokens} />
      </div>
    </main>
  );
}
