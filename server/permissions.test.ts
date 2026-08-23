import { describe, expect, it } from "vitest";
import { canAccessDomain, canManageRole } from "./permissions";

describe("CDEJ role permissions", () => {
  it("protects health and financial domains from volunteers and participants", () => {
    expect(canAccessDomain("volunteer", "health")).toBe(false);
    expect(canAccessDomain("participant", "finance")).toBe(false);
    expect(canAccessDomain("coordinator", "health")).toBe(true);
    expect(canAccessDomain("cpc", "finance")).toBe(true);
  });

  it("preserves the CDEJ hierarchy for management actions", () => {
    expect(canManageRole("coordinator", "facilitator")).toBe(true);
    expect(canManageRole("facilitator", "coordinator")).toBe(false);
    expect(canManageRole("pastor", "cpc")).toBe(true);
  });
});
