import type { Metadata, Viewport } from "next";
import { themeInitScript } from "@/design/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Float", template: "%s | Float" },
  description: "Personal cash-flow planning for people with irregular income.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F7F1" },
    { media: "(prefers-color-scheme: dark)", color: "#152321" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set by the inline script before hydration, so React must not warn about it.
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
