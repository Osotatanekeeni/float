import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const valid = {
  DATABASE_URL: "postgresql://user:secret-pw@host-pooler.neon.tech/db?sslmode=require",
  DATABASE_URL_UNPOOLED: "postgresql://user:secret-pw@host.neon.tech/db?sslmode=require",
  AUTH_SECRET: "a".repeat(32),
};

describe("parseEnv (M0 scaffold)", () => {
  it("accepts the required variables and leaves optional ones undefined", () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it("rejects an AUTH_SECRET shorter than 32 characters", () => {
    expect(() => parseEnv({ ...valid, AUTH_SECRET: "short" })).toThrow(/AUTH_SECRET/);
  });

  it("rejects a malformed OPENAI_BASE_URL", () => {
    expect(() => parseEnv({ ...valid, OPENAI_BASE_URL: "not a url" })).toThrow(/OPENAI_BASE_URL/);
  });

  it("never includes a variable's value in the error message", () => {
    let message = "";
    try {
      parseEnv({ ...valid, AUTH_SECRET: "tooshort-secret-value" });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain("AUTH_SECRET");
    expect(message).not.toContain("tooshort-secret-value");
  });
});
