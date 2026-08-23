import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

  it("permits health to a coordinator and finance/audit to CPC", async () => {
    const coordinator = appRouter.createCaller(contextFor("coordinator"));
    const cpc = appRouter.createCaller(contextFor("cpc"));
    await expect(coordinator.health.list({})).resolves.toBeDefined();
    await expect(cpc.finance.list()).resolves.toBeDefined();
    await expect(cpc.audit.list()).resolves.toBeDefined();
  });
});
