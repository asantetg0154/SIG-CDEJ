import { describe, expect, it } from "vitest";

describe("GitHub write authorization", () => {
  it("authenticates the configured GitHub token without exposing it", async () => {
    const token = process.env.GITHUB_TOKEN;
    expect(token).toBeTruthy();

    const response = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.ok).toBe(true);
  });
});
