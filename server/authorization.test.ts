import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { canAccessDomain } from "./permissions";

type CdejRole = "pastor" | "cpc" | "coordinator" | "facilitator" | "volunteer" | "participant";

function contextFor(cdejRole: CdejRole): TrpcContext {
  return {
    user: {
      id: 91,
      openId: `test-${cdejRole}`,
      name: `Test ${cdejRole}`,
      email: "test@example.test",
      loginMethod: "test",
      role: "user",
      cdejRole,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("protected CDEJ route authorization", () => {
  it("rejects a volunteer from confidential health data", async () => {
    const caller = appRouter.createCaller(contextFor("volunteer"));
    await expect(caller.health.list({})).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });

  it("rejects a participant from finance, audit, and dashboard records", async () => {
    const caller = appRouter.createCaller(contextFor("participant"));
    await expect(caller.finance.list()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.audit.list()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.dashboard.summary({ period: "month" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });

  it("recognizes the allowed roles for protected domains", () => {
    expect(canAccessDomain("coordinator", "health")).toBe(true);
    expect(canAccessDomain("cpc", "finance")).toBe(true);
    expect(canAccessDomain("cpc", "audit")).toBe(true);
  });
});
