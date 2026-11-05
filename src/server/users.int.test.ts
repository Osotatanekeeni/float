import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { withUser } from "@/db/client";
import { adminPool, appDb, seedUser } from "@/db/test/helpers";
import { getProfile } from "./users";

// Permission test for GET /api/me (CLAUDE.md: every endpoint gets one that tries another user's data).
const app = appDb(1);
let admin: Pool;
let alice: string;
let bob: string;

beforeAll(async () => {
  admin = adminPool();
  const stamp = Date.now();
  alice = await seedUser(admin, `me-alice-${stamp}@example.test`);
  bob = await seedUser(admin, `me-bob-${stamp}@example.test`);
});
afterAll(async () => {
  await app.close();
  await admin.end();
});

describe("getProfile", () => {
  it("returns the caller's own profile with Float's defaults", async () => {
    const profile = await withUser(app.db, alice, (tx) => getProfile(tx, alice));
    expect(profile).toMatchObject({ id: alice, baseCurrency: "NGN", timezone: "Africa/Lagos", bufferMinor: 0, defaultMode: "cautious" });
    expect(profile?.email).toContain("me-alice");
  });

  it("returns undefined (404) for another user's id, from either barrier", async () => {
    expect(await withUser(app.db, alice, (tx) => getProfile(tx, bob))).toBeUndefined();
  });

  it("never exposes fields beyond the profile", async () => {
    const profile = await withUser(app.db, alice, (tx) => getProfile(tx, alice));
    expect(Object.keys(profile ?? {}).sort()).toEqual(["baseCurrency", "bufferMinor", "defaultMode", "email", "id", "name", "timezone"]);
  });
});
