import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activities,
  activityStaffAssignments,
  attendanceRecords,
  auditLogs,
  documents,
  educationRecords,
  financeTransactions,
  groups,
  healthRecords,
  inventoryItems,
  leaveRequests,
  notifications,
  participants,
  staffProfiles,
  suppliers,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    values.cdejRole = "pastor";
    updateSet.role = "admin";
    updateSet.cdejRole = "pastor";
  } else if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  if (user.email) {
    const account = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (account[0]) {
      await db.update(staffProfiles).set({ userId: account[0].id }).where(eq(staffProfiles.email, user.email));
    }
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function logAudit(actorUserId: number | null, action: string, entityType: string, entityId?: string | number, metadata?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    actorUserId: actorUserId ?? null,
    action,
    entityType,
    entityId: entityId === undefined ? null : String(entityId),
    metadata: metadata ?? null,
  });
}

async function hasRows(table: typeof participants) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ count: sql<number>`count(*)` }).from(table);
  return Number(result[0]?.count ?? 0) > 0;
}

/**
 * Fictitious seed records for a safe, testable prototype. These records are not
 * real CDEJ records and are only created once when the database is empty.
 */
export async function ensureDemoData() {
  const db = await getDb();
  if (!db) return;
  if (await hasRows(participants)) {
    const existingAssignments = await db.select().from(activityStaffAssignments).limit(1);
    if (!existingAssignments.length) {
      const [activityRows, staffRows] = await Promise.all([db.select().from(activities), db.select().from(staffProfiles)]);
      const byCode = new Map(staffRows.map(member => [member.employeeCode, member]));
      const reading = activityRows.find(activity => activity.title === "Atelier de lecture");
      const health = activityRows.find(activity => activity.title === "Sensibilisation santé");
      const leaders = activityRows.find(activity => activity.title === "Club des jeunes leaders");
      const pending = [
        reading && byCode.get("CDEJ-006") ? { activityId: reading.id, staffId: byCode.get("CDEJ-006")!.id, assignmentType: "support" as const } : null,
        health && byCode.get("CDEJ-007") ? { activityId: health.id, staffId: byCode.get("CDEJ-007")!.id, assignmentType: "nutrition" as const } : null,
        leaders && byCode.get("CDEJ-006") ? { activityId: leaders.id, staffId: byCode.get("CDEJ-006")!.id, assignmentType: "supervision" as const } : null,
      ].filter((row): row is { activityId: number; staffId: number; assignmentType: "support" | "nutrition" | "supervision" } => Boolean(row));
      if (pending.length) await db.insert(activityStaffAssignments).values(pending);
    }
    return;
  }

  await db.insert(staffProfiles).values([
    { employeeCode: "CDEJ-001", firstName: "Élie", lastName: "Kamba", gender: "male", cdejRole: "pastor", phone: "+243 810 000 001", email: "elie.kamba@example.test", status: "active", startedAt: new Date("2024-01-10") },
    { employeeCode: "CDEJ-002", firstName: "Nadine", lastName: "Ilunga", gender: "female", cdejRole: "cpc", phone: "+243 810 000 002", email: "nadine.ilunga@example.test", status: "active", startedAt: new Date("2024-02-05") },
    { employeeCode: "CDEJ-003", firstName: "Patrick", lastName: "Mbuyi", gender: "male", cdejRole: "coordinator", phone: "+243 810 000 003", email: "patrick.mbuyi@example.test", status: "active", startedAt: new Date("2024-03-01") },
    { employeeCode: "CDEJ-004", firstName: "Sarah", lastName: "Tshibola", gender: "female", cdejRole: "facilitator", phone: "+243 810 000 004", email: "sarah.tshibola@example.test", status: "active", startedAt: new Date("2024-04-11") },
    { employeeCode: "CDEJ-005", firstName: "David", lastName: "Mwamba", gender: "male", cdejRole: "facilitator", phone: "+243 810 000 005", email: "david.mwamba@example.test", status: "active", startedAt: new Date("2024-05-03") },
    { employeeCode: "CDEJ-006", firstName: "Grâce", lastName: "Kasongo", gender: "female", cdejRole: "volunteer", volunteerCategory: "teacher", phone: "+243 810 000 006", email: "grace.kasongo@example.test", status: "active", startedAt: new Date("2025-01-19") },
    { employeeCode: "CDEJ-007", firstName: "Solange", lastName: "Kabeya", gender: "female", cdejRole: "volunteer", volunteerCategory: "cook", phone: "+243 810 000 007", email: "solange.kabeya@example.test", status: "active", startedAt: new Date("2025-02-04") },
  ]);
  const seededStaff = await db.select().from(staffProfiles);
  const byCode = new Map(seededStaff.map(member => [member.employeeCode, member]));
  const coordinator = byCode.get("CDEJ-003")!;
  const facilitatorA = byCode.get("CDEJ-004")!;
  const facilitatorB = byCode.get("CDEJ-005")!;
  await db.update(staffProfiles).set({ managerId: coordinator.id }).where(and(eq(staffProfiles.cdejRole, "facilitator"), eq(staffProfiles.status, "active")));

  await db.insert(groups).values([
    { name: "Espoir", description: "Groupe des 8 à 11 ans", ageRange: "8–11 ans", facilitatorId: facilitatorA.id },
    { name: "Avenir", description: "Groupe des 12 à 15 ans", ageRange: "12–15 ans", facilitatorId: facilitatorB.id },
    { name: "Impact", description: "Groupe des 16 à 18 ans", ageRange: "16–18 ans", facilitatorId: facilitatorB.id },
  ]);
  const seededGroups = await db.select().from(groups);
  const byGroup = new Map(seededGroups.map(group => [group.name, group]));
  const espoir = byGroup.get("Espoir")!;
  const avenir = byGroup.get("Avenir")!;
  const impact = byGroup.get("Impact")!;

  await db.insert(participants).values([
    { participantCode: "P-2026-001", firstName: "Aïcha", lastName: "Banza", gender: "female", birthDate: new Date("2015-04-18"), school: "École Lumière", classLevel: "CM1", educationLevel: "Primaire", guardianName: "Maman Banza", guardianPhone: "+243 900 000 101", address: "Quartier Centre", groupId: espoir.id, facilitatorId: facilitatorA.id, status: "active" },
    { participantCode: "P-2026-002", firstName: "Junior", lastName: "Kalala", gender: "male", birthDate: new Date("2014-08-03"), school: "École Lumière", classLevel: "CM2", educationLevel: "Primaire", guardianName: "Papa Kalala", guardianPhone: "+243 900 000 102", address: "Quartier Centre", groupId: espoir.id, facilitatorId: facilitatorA.id, status: "active" },
    { participantCode: "P-2026-003", firstName: "Noella", lastName: "Kabongo", gender: "female", birthDate: new Date("2012-12-21"), school: "Institut Avenir", classLevel: "6e", educationLevel: "Secondaire", guardianName: "Maman Kabongo", guardianPhone: "+243 900 000 103", address: "Quartier Nord", groupId: avenir.id, facilitatorId: facilitatorB.id, status: "active" },
    { participantCode: "P-2026-004", firstName: "Moïse", lastName: "Kitenge", gender: "male", birthDate: new Date("2011-03-09"), school: "Institut Avenir", classLevel: "5e", educationLevel: "Secondaire", guardianName: "Tante Kitenge", guardianPhone: "+243 900 000 104", address: "Quartier Nord", groupId: avenir.id, facilitatorId: facilitatorB.id, status: "active" },
    { participantCode: "P-2026-005", firstName: "Esther", lastName: "Mwamba", gender: "female", birthDate: new Date("2009-11-28"), school: "Lycée Horizon", classLevel: "3e", educationLevel: "Secondaire", guardianName: "Maman Mwamba", guardianPhone: "+243 900 000 105", address: "Quartier Sud", groupId: impact.id, facilitatorId: facilitatorB.id, status: "active" },
    { participantCode: "P-2026-006", firstName: "Joël", lastName: "Mulumba", gender: "male", birthDate: new Date("2008-02-14"), school: "Lycée Horizon", classLevel: "Terminale", educationLevel: "Secondaire", guardianName: "Papa Mulumba", guardianPhone: "+243 900 000 106", address: "Quartier Sud", groupId: impact.id, facilitatorId: facilitatorB.id, status: "paused" },
  ]);
  const seededParticipants = await db.select().from(participants);

  await db.insert(activities).values([
    { title: "Atelier de lecture", category: "Éducation", objective: "Renforcer la compréhension écrite", location: "Salle Espoir", startsAt: new Date("2026-08-21T09:00:00Z"), endsAt: new Date("2026-08-21T10:30:00Z"), status: "completed", facilitatorId: facilitatorA.id, groupId: espoir.id },
    { title: "Sensibilisation santé", category: "Santé", objective: "Promouvoir les bonnes pratiques d'hygiène", location: "Salle polyvalente", startsAt: new Date("2026-08-24T11:00:00Z"), endsAt: new Date("2026-08-24T12:00:00Z"), status: "planned", facilitatorId: facilitatorB.id, groupId: avenir.id },
    { title: "Club des jeunes leaders", category: "Leadership", objective: "Développer les compétences de prise de parole", location: "Espace Impact", startsAt: new Date("2026-08-27T14:00:00Z"), endsAt: new Date("2026-08-27T15:30:00Z"), status: "planned", facilitatorId: facilitatorB.id, groupId: impact.id },
  ]);

  const seededActivities = await db.select().from(activities);
  const byActivity = new Map(seededActivities.map(activity => [activity.title, activity]));
  await db.insert(activityStaffAssignments).values([
    { activityId: byActivity.get("Atelier de lecture")!.id, staffId: byCode.get("CDEJ-006")!.id, assignmentType: "support" },
    { activityId: byActivity.get("Sensibilisation santé")!.id, staffId: byCode.get("CDEJ-007")!.id, assignmentType: "nutrition" },
    { activityId: byActivity.get("Club des jeunes leaders")!.id, staffId: byCode.get("CDEJ-006")!.id, assignmentType: "supervision" },
  ]);

  await db.insert(attendanceRecords).values(seededParticipants.map((participant, index) => ({
    attendanceDate: new Date("2026-08-23T08:00:00Z"),
    subjectType: "participant" as const,
    participantId: participant.id,
    status: index === 3 ? "late" as const : index === 5 ? "absent" as const : "present" as const,
    reason: index === 5 ? "Motif familial communiqué" : null,
    recordedByUserId: 1,
  })));

  await db.insert(leaveRequests).values([
    { staffId: facilitatorA.id, leaveType: "permission", startsAt: new Date("2026-08-25"), endsAt: new Date("2026-08-25"), requestedDays: "1", reason: "Rendez-vous administratif", status: "pending_manager" },
    { staffId: byCode.get("CDEJ-006")!.id, leaveType: "training", startsAt: new Date("2026-09-01"), endsAt: new Date("2026-09-03"), requestedDays: "3", reason: "Formation pédagogique", status: "pending_coordinator" },
  ]);

  await db.insert(educationRecords).values([
    { participantId: seededParticipants[0]!.id, termLabel: "Trimestre 3", averageScore: "76.5", resultStatus: "progressing", supportPlan: "Lecture guidée hebdomadaire", recordedByUserId: 1 },
    { participantId: seededParticipants[2]!.id, termLabel: "Trimestre 3", averageScore: "68.0", resultStatus: "stable", supportPlan: "Révisions en mathématiques", recordedByUserId: 1 },
    { participantId: seededParticipants[3]!.id, termLabel: "Trimestre 3", averageScore: "54.0", resultStatus: "needs_support", difficulties: "Compréhension des fractions", supportPlan: "Tutorat deux fois par semaine", recordedByUserId: 1 },
  ]);
  await db.insert(healthRecords).values({ participantId: seededParticipants[1]!.id, visitAt: new Date("2026-08-18"), visitType: "Consultation de suivi", summary: "Suivi préventif sans urgence.", treatment: "Conseils d'hydratation", recordedByUserId: 1 });
  await db.insert(suppliers).values([{ name: "Marché Solidaire", contactName: "Jean M.", phone: "+243 820 000 001", category: "Alimentation" }, { name: "Fournitures Horizon", contactName: "Marie L.", phone: "+243 820 000 002", category: "Papeterie" }]);
  const seededSuppliers = await db.select().from(suppliers);
  await db.insert(inventoryItems).values([
    { sku: "NUT-001", name: "Haricots", category: "Nutrition", quantity: "9", unit: "kg", alertThreshold: "12", supplierId: seededSuppliers[0]!.id },
    { sku: "EDU-004", name: "Cahiers A5", category: "Éducation", quantity: "48", unit: "unités", alertThreshold: "20", supplierId: seededSuppliers[1]!.id },
    { sku: "HYG-003", name: "Savon liquide", category: "Hygiène", quantity: "4", unit: "litres", alertThreshold: "5", supplierId: seededSuppliers[0]!.id },
  ]);
  await db.insert(financeTransactions).values([
    { transactionDate: new Date("2026-08-03"), type: "income", category: "Contribution", amount: "2500", currency: "USD", description: "Contribution mensuelle fictive", recordedByUserId: 1 },
    { transactionDate: new Date("2026-08-09"), type: "expense", category: "Nutrition", amount: "620", currency: "USD", description: "Approvisionnement alimentaire fictif", recordedByUserId: 1 },
  ]);
  await db.insert(notifications).values([
    { recipientUserId: 1, type: "leave", title: "Permission à examiner", message: "Une demande de permission attend une validation du responsable.", priority: "high", actionUrl: "/leaves" },
    { recipientUserId: 1, type: "inventory", title: "Stock bas : Haricots", message: "Le niveau disponible est inférieur au seuil défini.", priority: "high", actionUrl: "/inventory" },
    { recipientUserId: 1, type: "report", title: "Rapport mensuel", message: "Préparez les données pour le rapport mensuel.", priority: "normal", actionUrl: "/reports" },
  ]);
  await logAudit(null, "seeded_demo_data", "system", "demo", { note: "Fictitious prototype records created" });
}

function ageFrom(date: Date) {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const month = now.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < date.getDate())) age -= 1;
  return age;
}

export async function getParticipantList(filters: { query?: string; groupId?: number; status?: string }) {
  await ensureDemoData();
  const db = await getDb();
  if (!db) return [];
  const [rows, groupRows, staffRows] = await Promise.all([db.select().from(participants).orderBy(desc(participants.updatedAt)), db.select().from(groups), db.select().from(staffProfiles)]);
  const groupMap = new Map(groupRows.map(group => [group.id, group.name]));
  const staffMap = new Map(staffRows.map(staff => [staff.id, `${staff.firstName} ${staff.lastName}`]));
  const normalized = filters.query?.trim().toLocaleLowerCase();
  return rows
    .filter(row => !filters.status || row.status === filters.status)
    .filter(row => !filters.groupId || row.groupId === filters.groupId)
    .filter(row => !normalized || `${row.firstName} ${row.lastName} ${row.participantCode} ${row.school ?? ""}`.toLocaleLowerCase().includes(normalized))
    .map(row => ({ ...row, age: ageFrom(row.birthDate), groupName: row.groupId ? groupMap.get(row.groupId) ?? "Non attribué" : "Non attribué", facilitatorName: row.facilitatorId ? staffMap.get(row.facilitatorId) ?? "Non attribué" : "Non attribué" }));
}

export async function getStaffList() {
  await ensureDemoData();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(staffProfiles).orderBy(staffProfiles.cdejRole, staffProfiles.lastName);
  const byId = new Map(rows.map(row => [row.id, `${row.firstName} ${row.lastName}`]));
  return rows.map(row => ({ ...row, managerName: row.managerId ? byId.get(row.managerId) ?? "—" : "—" }));
}

export async function getActivityList() {
  await ensureDemoData();
  const db = await getDb();
  if (!db) return [];
  const [rows, groupRows, staffRows] = await Promise.all([db.select().from(activities).orderBy(desc(activities.startsAt)), db.select().from(groups), db.select().from(staffProfiles)]);
  const groupMap = new Map(groupRows.map(group => [group.id, group.name]));
  const staffMap = new Map(staffRows.map(staff => [staff.id, `${staff.firstName} ${staff.lastName}`]));
  return rows.map(row => ({ ...row, groupName: row.groupId ? groupMap.get(row.groupId) ?? "Général" : "Général", facilitatorName: row.facilitatorId ? staffMap.get(row.facilitatorId) ?? "Non attribué" : "Non attribué" }));
}

export async function getLeaveList() {
  await ensureDemoData();
  const db = await getDb();
  if (!db) return [];
  const [rows, staff] = await Promise.all([db.select().from(leaveRequests).orderBy(desc(leaveRequests.updatedAt)), db.select().from(staffProfiles)]);
  const staffMap = new Map(staff.map(member => [member.id, `${member.firstName} ${member.lastName}`]));
  return rows.map(row => ({ ...row, staffName: staffMap.get(row.staffId) ?? "Membre inconnu" }));
}

export async function getInventoryList() {
  await ensureDemoData();
  const db = await getDb();
  if (!db) return [];
  const [rows, supplierRows] = await Promise.all([db.select().from(inventoryItems).orderBy(inventoryItems.name), db.select().from(suppliers)]);
  const suppliersById = new Map(supplierRows.map(supplier => [supplier.id, supplier.name]));
  return rows.map(row => ({ ...row, supplierName: row.supplierId ? suppliersById.get(row.supplierId) ?? "—" : "—", isLow: Number(row.quantity) <= Number(row.alertThreshold) }));
}

export async function getDashboardSnapshot(period: "week" | "month" | "quarter", includeFinance = false, scope?: { userId: number; role: "pastor" | "cpc" | "coordinator" | "facilitator" | "volunteer" | "participant" }) {
  await ensureDemoData();
  const db = await getDb();
  if (!db) return null;
  const [allParticipantRows, staffRows, allActivityRows, attendanceRows, leaveRows, educationRows, healthRows, inventoryRows, notificationRows, financeRows, assignments, allGroupRows] = await Promise.all([
    db.select().from(participants), db.select().from(staffProfiles), db.select().from(activities), db.select().from(attendanceRecords), db.select().from(leaveRequests), db.select().from(educationRecords), db.select().from(healthRecords), db.select().from(inventoryItems), db.select().from(notifications).orderBy(desc(notifications.createdAt)), includeFinance ? db.select().from(financeTransactions) : Promise.resolve([]), db.select().from(activityStaffAssignments), db.select().from(groups),
  ]);
  const scopedRole = scope?.role === "facilitator" || scope?.role === "volunteer";
  const staffProfile = scopedRole ? staffRows.find(staff => staff.userId === scope?.userId) : undefined;
  const assignedActivityIds = new Set(staffProfile ? assignments.filter(assignment => assignment.staffId === staffProfile.id).map(assignment => assignment.activityId) : []);
  const participantRows = scope?.role === "facilitator" ? allParticipantRows.filter(participant => participant.facilitatorId === staffProfile?.id) : scope?.role === "volunteer" ? [] : allParticipantRows;
  const activityRows = scope?.role === "facilitator" ? allActivityRows.filter(activity => activity.facilitatorId === staffProfile?.id || assignedActivityIds.has(activity.id)) : scope?.role === "volunteer" ? allActivityRows.filter(activity => assignedActivityIds.has(activity.id)) : allActivityRows;
  const groupRows = scope?.role === "facilitator" ? allGroupRows.filter(group => group.facilitatorId === staffProfile?.id) : scope?.role === "volunteer" ? [] : allGroupRows;
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - (period === "week" ? 7 : period === "month" ? 30 : 90));
  const periodActivities = activityRows.filter(activity => activity.startsAt >= periodStart);
  const visibleParticipantIds = new Set(participantRows.map(participant => participant.id));
  const currentAttendance = attendanceRows.filter(record => record.participantId !== null && visibleParticipantIds.has(record.participantId)).slice(-Math.max(1, participantRows.length));
  const attendancePresent = currentAttendance.filter(row => row.status === "present" || row.status === "late").length;
  const ageBuckets = [{ label: "8–11", count: 0 }, { label: "12–15", count: 0 }, { label: "16–18", count: 0 }];
  participantRows.forEach(participant => { const age = ageFrom(participant.birthDate); const bucket = age <= 11 ? ageBuckets[0] : age <= 15 ? ageBuckets[1] : ageBuckets[2]; bucket.count += 1; });
  const groupCounts = new Map<number | null, number>();
  participantRows.forEach(participant => groupCounts.set(participant.groupId, (groupCounts.get(participant.groupId) ?? 0) + 1));
  const scopedNotifications = scopedRole ? notificationRows.filter(item => item.recipientUserId === scope?.userId) : notificationRows;
  const includeInventoryAlerts = !scopedRole || (scope?.role === "volunteer" && Boolean(staffProfile && assignedActivityIds.size));
  const inventoryAlerts = includeInventoryAlerts ? inventoryRows.filter(item => Number(item.quantity) <= Number(item.alertThreshold)).map(item => ({ id: `stock-${item.id}`, title: `Stock bas : ${item.name}`, message: `${item.quantity} ${item.unit} disponible(s), seuil ${item.alertThreshold}.`, priority: "high" as const, href: "/inventory" })) : [];
  const alerts = [
    ...scopedNotifications.filter(item => !item.isRead).slice(0, 4).map(item => ({ id: `notification-${item.id}`, title: item.title, message: item.message, priority: item.priority, href: item.actionUrl ?? "/" })),
    ...inventoryAlerts,
  ].slice(0, 5);
  const financeByCategory = Array.from(new Set(financeRows.map(row => row.category))).map(category => {
    const categoryRows = financeRows.filter(row => row.category === category);
    return {
      label: category,
      income: categoryRows.filter(row => row.type === "income").reduce((total, row) => total + Number(row.amount), 0),
      expense: categoryRows.filter(row => row.type === "expense").reduce((total, row) => total + Number(row.amount), 0),
    };
  });
  const financeSummary = includeFinance ? {
    income: financeRows.filter(row => row.type === "income").reduce((total, row) => total + Number(row.amount), 0),
    expense: financeRows.filter(row => row.type === "expense").reduce((total, row) => total + Number(row.amount), 0),
    byCategory: financeByCategory,
  } : null;
  return {
    cards: {
      participants: participantRows.filter(row => row.status === "active").length,
      facilitators: staffRows.filter(row => row.cdejRole === "facilitator" && row.status === "active").length,
      volunteers: staffRows.filter(row => row.cdejRole === "volunteer" && row.status === "active").length,
      cpc: staffRows.filter(row => row.cdejRole === "cpc" && row.status === "active").length,
      plannedActivities: periodActivities.filter(row => row.status === "planned").length,
      completedActivities: periodActivities.filter(row => row.status === "completed").length,
      presentToday: attendancePresent,
      absentToday: currentAttendance.filter(row => row.status === "absent").length,
      pendingLeaves: leaveRows.filter(row => row.status === "pending_manager" || row.status === "pending_coordinator").length,
      healthVisits: healthRows.filter(row => row.visitAt >= periodStart).length,
    },
    attendanceChart: [
      { label: "Lun", present: Math.max(0, attendancePresent - 1), absent: 1 },
      { label: "Mar", present: attendancePresent, absent: 1 },
      { label: "Mer", present: Math.max(0, attendancePresent - 2), absent: 2 },
      { label: "Jeu", present: attendancePresent, absent: 1 },
      { label: "Ven", present: Math.max(0, attendancePresent - 1), absent: 1 },
      { label: "Sam", present: attendancePresent, absent: 1 },
    ],
    genderChart: [
      { label: "Filles", value: participantRows.filter(row => row.gender === "female").length, fill: "#E57A65" },
      { label: "Garçons", value: participantRows.filter(row => row.gender === "male").length, fill: "#3E7CB1" },
    ],
    ageBuckets,
    groups: groupRows.map(group => ({ label: group.name, count: groupCounts.get(group.id) ?? 0 })),
    education: educationRows.map(row => ({ term: row.termLabel, score: Number(row.averageScore ?? 0), status: row.resultStatus })),
    financeSummary,
    scope: scopedRole ? { role: scope!.role, linkedProfile: Boolean(staffProfile), assignedActivities: activityRows.length, assignedParticipants: participantRows.length } : null,
    alerts,
  };
}

export async function getGlobalSearch(query: string) {
  await ensureDemoData();
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [];
  const [participantRows, staffRows, activityRows, documentRows] = await Promise.all([getParticipantList({}), getStaffList(), getActivityList(), (await getDb())?.select().from(documents) ?? []]);
  return [
    ...participantRows.filter(row => `${row.firstName} ${row.lastName} ${row.participantCode}`.toLocaleLowerCase().includes(term)).map(row => ({ type: "Participant", label: `${row.firstName} ${row.lastName}`, detail: row.participantCode, href: `/participants/${row.id}` })),
    ...staffRows.filter(row => `${row.firstName} ${row.lastName} ${row.employeeCode}`.toLocaleLowerCase().includes(term)).map(row => ({ type: "Personnel", label: `${row.firstName} ${row.lastName}`, detail: row.cdejRole, href: `/staff/${row.id}` })),
    ...activityRows.filter(row => `${row.title} ${row.category}`.toLocaleLowerCase().includes(term)).map(row => ({ type: "Activité", label: row.title, detail: row.category, href: "/activities" })),
    ...documentRows.filter(row => `${row.title} ${row.originalFilename}`.toLocaleLowerCase().includes(term)).map(row => ({ type: "Document", label: row.title, detail: row.category, href: "/documents" })),
  ].slice(0, 12);
}
