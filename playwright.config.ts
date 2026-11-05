import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");

const PORT = 3123;
const testDb = process.env.TEST_DATABASE_URL_UNPOOLED ?? "";

// PRD section 10: key screens at 375, 768, 1024 and 1440 px. Locally Chrome is used so no browser download
// is needed; set PW_CHANNEL= (empty) in CI to use the Playwright-installed Chromium.
const channel = process.env.PW_CHANNEL === undefined ? "chrome" : process.env.PW_CHANNEL || undefined;
const viewports = { "375": { width: 375, height: 812 }, "768": { width: 768, height: 1024 }, "1024": { width: 1024, height: 768 }, "1440": { width: 1440, height: 900 } };

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, channel, storageState: "e2e/.auth/state.json", trace: "retain-on-failure" },
  projects: Object.entries(viewports).map(([name, viewport]) => ({
    name: `chromium-${name}`,
    use: { viewport, hasTouch: name === "375", isMobile: false },
  })),
  webServer: {
    // Production build, so the service worker is real; pointed at the Neon test branch. Vercel trusts its own
    // host automatically; a local production server has to be told.
    command: `pnpm build && pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/sign-in`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI, // locally, start the server once and iterate on tests
    env: { DATABASE_URL: testDb, DATABASE_URL_UNPOOLED: testDb, NEON_BRANCH: "test", NODE_ENV: "production", AUTH_TRUST_HOST: "true" },
  },
});
