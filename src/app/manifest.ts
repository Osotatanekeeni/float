import type { MetadataRoute } from "next";
import { lightTokens } from "@/design/tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/home",
    name: "Float",
    short_name: "Float",
    description: "Know what you can safely spend, and why.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: lightTokens.appBackground,
    theme_color: lightTokens.appBackground,
    lang: "en",
    categories: ["finance"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Add expense", url: "/add?type=expense", description: "Record an expense" },
      { name: "Can I afford...", url: "/what-if", description: "Test a purchase before you make it" },
    ],
  };
}
