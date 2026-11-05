import { describe, expect, it } from "vitest";
import { apiError } from "./api-error";

describe("apiError (CLAUDE.md: { code, message, fields?, requestId })", () => {
  it("returns the standard shape with a request id and the right status", async () => {
    const res = apiError(401, "unauthenticated", "Sign in to continue");
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["code", "message", "requestId"]);
    expect(body).toMatchObject({ code: "unauthenticated", message: "Sign in to continue" });
    expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("includes field errors when given", async () => {
    const body = await apiError(400, "validation_failed", "Check the form", { fields: { email: "Enter a valid email" } }).json();
    expect(body.fields).toEqual({ email: "Enter a valid email" });
  });

  it("reuses a supplied request id and echoes it in a header", async () => {
    const res = apiError(404, "not_found", "Not found", { requestId: "req-123" });
    expect((await res.json()).requestId).toBe("req-123");
    expect(res.headers.get("x-request-id")).toBe("req-123");
  });

  it("never caches error responses", () => {
    expect(apiError(500, "internal", "Something went wrong").headers.get("cache-control")).toBe("no-store");
  });
});
