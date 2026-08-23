import type { CdejRole } from "../drizzle/schema";

export type SecureDomain = "health" | "finance" | "administration" | "audit" | "participants" | "staff" | "activities" | "inventory" | "reports";

const domainPermissions: Record<SecureDomain, readonly CdejRole[]> = {
  health: ["pastor", "coordinator", "facilitator"],
  finance: ["pastor", "cpc", "coordinator"],
  administration: ["pastor", "coordinator"],
  audit: ["pastor", "cpc", "coordinator"],
  participants: ["pastor", "cpc", "coordinator", "facilitator", "volunteer"],
  staff: ["pastor", "cpc", "coordinator"],
  activities: ["pastor", "cpc", "coordinator", "facilitator", "volunteer"],
  inventory: ["pastor", "cpc", "coordinator", "volunteer"],
  reports: ["pastor", "cpc", "coordinator"],
};

export function canAccessDomain(role: CdejRole, domain: SecureDomain) {
  return domainPermissions[domain].includes(role);
}

export function canManageRole(actorRole: CdejRole, targetRole: CdejRole) {
  const rank: Record<CdejRole, number> = {
    pastor: 6,
    cpc: 5,
    coordinator: 4,
    facilitator: 3,
    volunteer: 2,
    participant: 1,
  };
  return rank[actorRole] > rank[targetRole] || actorRole === "pastor";
}
