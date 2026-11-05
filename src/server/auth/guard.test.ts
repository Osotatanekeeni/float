import { describe, expect, it, vi } from "vitest";
import { requireUserId, withAuth } from "./guard";

const session = (id?: string) => async () => (id ? { user: { id } } : null);

describe("requireUserId", () => {
  it("returns the signed-in user's id", async () => {
    expect(await requireUserId(session("u-1"))).toBe("u-1");
  });

  it("throws UnauthenticatedError with no session, or a session without an id", async () => {
    await expect(requireUserId(session())).rejects.toMatchObject({ name: "UnauthenticatedError" });
    await expect(requireUserId(async () => ({ user: {} }))).rejects.toMatchObject({ name: "UnauthenticatedError" });
  });
});

describe("withAuth (every route handler goes through this)", () => {
  const request = new Request("http://localhost/api/anything");

  it("answers 401 in the standard error shape, and never runs the handler, when signed out", async () => {
    const handler = vi.fn();
    const res = await withAuth(handler, session())(request);
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "unauthenticated" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the user id to the handler when signed in", async () => {
    const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const res = await withAuth(handler, session("u-1"))(request);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(request, { userId: "u-1" });
  });

  it("turns an unexpected failure into a 500 that leaks nothing", async () => {
    const res = await withAuth(async () => {
      throw new Error("db password is hunter2");
    }, session("u-1"))(request);
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain("hunter2");
    expect(JSON.parse(text)).toMatchObject({ code: "internal" });
  });
});
