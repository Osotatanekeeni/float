import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

interface Step {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, string>;
}
interface Job {
  "runs-on": string;
  needs?: string | string[];
  steps: Step[];
  concurrency?: { group: string; "cancel-in-progress"?: boolean };
  env?: Record<string, string>;
  "timeout-minutes"?: number;
}
interface Workflow {
  on: { push?: { branches?: string[] }; pull_request?: unknown };
  permissions?: Record<string, string>;
  concurrency?: { group: string; "cancel-in-progress"?: boolean };
  jobs: Record<string, Job>;
}

const raw = readFileSync(".github/workflows/ci.yml", "utf8");
const wf = parse(raw) as Workflow;
const jobs = wf.jobs;
const runs = (job: Job) => job.steps.map((s) => s.run ?? "").join("\n");

describe("CI workflow (CLAUDE.md: no pull requests; migrations and every check run in CI)", () => {
  it("runs on every push, since work happens on feature branches and there are no PRs", () => {
    expect(wf.on.push).toBeDefined();
    expect(wf.on.push?.branches ?? ["**"]).toEqual(expect.arrayContaining(["**"]));
  });

  it("does not run untrusted pull-request code with secrets", () => {
    expect(JSON.stringify(wf.on)).not.toContain("pull_request_target");
  });

  it("has least-privilege permissions", () => {
    expect(wf.permissions).toEqual({ contents: "read" });
  });

  it("cancels superseded runs of the same ref", () => {
    expect(wf.concurrency?.["cancel-in-progress"]).toBe(true);
  });

  it("has the jobs the PRD lists: quality, integration, e2e, build", () => {
    expect(Object.keys(jobs)).toEqual(expect.arrayContaining(["quality", "integration", "e2e", "build"]));
  });

  it("quality runs lint, type-check and unit tests with the 95% engine coverage gate", () => {
    const r = runs(jobs.quality);
    expect(r).toContain("pnpm lint");
    expect(r).toContain("pnpm typecheck");
    expect(r).toContain("pnpm test:coverage");
  });

  it("quality fails if the schema and the committed migrations disagree", () => {
    const r = runs(jobs.quality);
    expect(r).toContain("drizzle-kit generate");
    expect(r).toMatch(/git diff --exit-code|git status --porcelain/);
  });

  it("quality scans production dependencies for known vulnerabilities (PRD section 8)", () => {
    expect(runs(jobs.quality)).toMatch(/pnpm audit/);
  });

  it("integration and e2e share one Neon test branch, so they never run at the same time", () => {
    const groups = [jobs.integration, jobs.e2e].map((j) => j.concurrency?.group);
    expect(groups[0]).toBeTruthy();
    expect(groups[0]).toBe(groups[1]);
    for (const j of [jobs.integration, jobs.e2e]) expect(j.concurrency?.["cancel-in-progress"]).toBe(false);
  });

  it("integration runs the Drizzle migrations on the test branch through its global setup", () => {
    expect(runs(jobs.integration)).toContain("pnpm test:int");
  });

  it("e2e installs the browsers, uses Chromium rather than the local Chrome, and uploads reports on failure", () => {
    const j = jobs.e2e;
    expect(runs(j)).toContain("playwright install");
    expect(JSON.stringify(j)).toContain("PW_CHANNEL");
    expect(j.steps.some((s) => s.uses?.startsWith("actions/upload-artifact@") && JSON.stringify(s).includes("failure()"))).toBe(true);
  });

  it("the build job needs the quality job and builds the app", () => {
    expect(jobs.build.needs).toContain("quality");
    expect(runs(jobs.build)).toContain("pnpm build");
  });

  it("every action is pinned to a version, never a branch", () => {
    const uses = Object.values(jobs).flatMap((j) => j.steps.map((s) => s.uses).filter(Boolean)) as string[];
    expect(uses.length).toBeGreaterThan(0);
    for (const u of uses) expect(u, u).toMatch(/@(v\d+(\.\d+){0,2}|[0-9a-f]{40})$/);
  });

  it("uses the Node and pnpm versions the repo declares", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { packageManager: string };
    expect(readFileSync(".nvmrc", "utf8").trim()).toBe("24");
    for (const j of Object.values(jobs)) {
      const node = j.steps.find((s) => s.uses?.startsWith("actions/setup-node@"));
      expect(node?.with?.["node-version-file"]).toBe(".nvmrc");
      expect(node?.with?.cache).toBe("pnpm");
    }
    expect(pkg.packageManager).toMatch(/^pnpm@\d/);
  });

  it("installs from the lockfile only", () => {
    for (const j of Object.values(jobs)) expect(runs(j)).toContain("pnpm install --frozen-lockfile");
  });

  it("gets credentials only from repository secrets, and never prints them", () => {
    expect(raw).toMatch(/\$\{\{ secrets\.TEST_DATABASE_URL_UNPOOLED \}\}/);
    expect(raw).toMatch(/\$\{\{ secrets\.AUTH_SECRET \}\}/);
    expect(raw).not.toMatch(/postgres(ql)?:\/\//);
    expect(raw).not.toMatch(/echo[^\n]*(secrets\.|DATABASE_URL|AUTH_SECRET)/);
    expect(raw).not.toMatch(/set -x|--debug/);
  });

  it("every job has a timeout, so a hung browser cannot hold the shared test branch", () => {
    for (const [name, j] of Object.entries(jobs)) expect(j["timeout-minutes"], name).toBeGreaterThan(0);
  });
});
