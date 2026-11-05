import { Construction } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { moreLinks } from "@/components/nav/items";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSection, sections } from "./sections";

type Props = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: isSection(section) ? sections[section].title : "Not found" };
}

export default async function SectionPage({ params }: Props) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  const { title, description } = sections[section];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink md:text-[1.75rem]">{title}</h1>
      {section === "more" ? (
        <ul className="flex flex-col gap-2">
          {moreLinks.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex min-h-12 items-center gap-3 rounded-card border border-line bg-surface px-4 text-base text-ink"
              >
                <Icon aria-hidden className="size-5 text-brand" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <CardHeader>
            <Construction aria-hidden className="size-6 text-brand" />
            <CardTitle>Coming soon</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
