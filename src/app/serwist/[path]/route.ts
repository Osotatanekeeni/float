import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";
import { OFFLINE_URL } from "@/pwa/caching";

// The revision versions the precached offline page so an updated page replaces the old copy.
const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  (spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout.trim() || crypto.randomUUID());

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ url: OFFLINE_URL, revision }],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});
