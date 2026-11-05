import { describe, expect, it } from "vitest";
import { SESSION_COOKIE_NAMES, accessDecision } from "./access";

const signedOut = new Set<string>();
const signedIn = new Set<string>(["authjs.session-token"]);

describe("accessDecision (deny by default; the server still checks every route)", () => {
  it("lets public paths through without a session", () => {
    for (const path of ["/", "/sign-in", "/sign-in/check-email", "/api/auth/callback/email", "/api/auth/session", "/design-system", "/offline"]) {
      expect(accessDecision(path, signedOut), path).toBe("allow");
    }
  });

  it("redirects signed-out visitors from app pages to sign-in", () => {
    for (const path of ["/home", "/timeline", "/accounts/123", "/settings"]) {
      expect(accessDecision(path, signedOut), path).toBe("redirect");
    }
  });

  it("answers 401 (not a redirect) for signed-out API calls", () => {
    for (const path of ["/api/me", "/api/accounts", "/api/snapshot"]) {
      expect(accessDecision(path, signedOut), path).toBe("unauthorized");
    }
  });

  it("allows everything once a session cookie is present, in dev and production naming", () => {
    for (const name of SESSION_COOKIE_NAMES) {
      expect(accessDecision("/home", new Set([name]))).toBe("allow");
      expect(accessDecision("/api/me", new Set([name]))).toBe("allow");
    }
    expect(accessDecision("/home", signedIn)).toBe("allow");
  });

  it("is not fooled by look-alike public paths", () => {
    expect(accessDecision("/sign-in-admin", signedOut)).toBe("redirect");
    expect(accessDecision("/design-system-private", signedOut)).toBe("redirect");
    expect(accessDecision("/api/authors", signedOut)).toBe("unauthorized");
    expect(accessDecision("/sign-in/../home", signedOut)).toBe("redirect");
  });
});
