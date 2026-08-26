import { describe, expect, it } from "vitest";
import { buildOAuthLoginUrl } from "../client/src/const";

describe("OAuth login URL", () => {
  it("produces a redirect URL with the current deployment callback", () => {
    const url = new URL(buildOAuthLoginUrl({ oauthPortalUrl: "https://oauth.example.test", appId: "cdej-app", origin: "https://cdej.example.test", nonce: "safe-nonce" }));
    expect(url.origin).toBe("https://oauth.example.test");
    expect(url.pathname).toBe("/app-auth");
    expect(url.searchParams.get("appId")).toBe("cdej-app");
    expect(url.searchParams.get("redirectUri")).toBe("https://cdej.example.test/api/oauth/callback");
  });

  it("reports a configuration error instead of constructing an invalid URL", () => {
    expect(() => buildOAuthLoginUrl({ oauthPortalUrl: undefined, appId: undefined, origin: "https://cdej.example.test", nonce: "safe-nonce" })).toThrow("VITE_OAUTH_PORTAL_URL");
  });
});
