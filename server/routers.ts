import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { activities, activityReminderSettings, activityStaffAssignments, attendanceRecords, auditLogs, documents, educationRecords, financeTransactions, groups, healthRecords, leaveRequests, notifications, nutritionRecords, participants, staffProfiles, suppliers } from "../drizzle/schema";
import { getDb, getActivityList, getDashboardSnapshot, getGlobalSearch, getInventoryList, getLeaveList, getParticipantList, getStaffList, logAudit } from "./db";
import { canAccessDomain, type SecureDomain } from "./permissions";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { ACTIVITY_REMINDER_CRON, VERCEL_ACTIVITY_REMINDER_TASK_UID } from "./activityReminders";

function requireDomain(user: { role: "user" | "admin"; cdejRole: "pastor" | "cpc" | "coordinator" | "facilitator" | "volunteer" | "participant" }, domain: SecureDomain) {
  if (user.role === "admin" || canAccessDomain(user.cdejRole, domain)) return;
  throw new TRPCError({ code: "FORBIDDEN", message: "Vous n’avez pas l’autorisation requise pour ces données." });
}

const participantInput = z.object({
  participantCode: z.string().min(3).max(40),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  gender: z.enum(["female", "male", "other"]),
  birthDate: z.date(),
  school: z.string().max(160).optional(),
  classLevel: z.string().max(100).optional(),
  guardianName: z.string().max(200).optional(),
  guardianPhone: z.string().max(40).optional(),
  groupId: z.number().int().positive().optional(),
  facilitatorId: z.number().int().positive().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    summary: protectedProcedure.input(z.object({ period: z.enum(["week", "month", "quarter"]).default("month") })).query(async ({ input, ctx }) => {
      requireDomain(ctx.user, "participants");
      return getDashboardSnapshot(input.period, ctx.user.role === "admin" || canAccessDomain(ctx.user.cdejRole, "finance"), { userId: ctx.user.id, role: ctx.user.cdejRole });
    }),
  }),
  directory: router({
    assignments: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "participants");
      const db = await getDb();
      if (!db) return { groups: [], facilitators: [] };
      const [groupRows, staffRows] = await Promise.all([db.select().from(groups), db.select().from(staffProfiles)]);
      return {
        groups: groupRows.filter(group => group.isActive).map(group => ({ id: group.id, name: group.name })),
        facilitators: staffRows.filter(staff => staff.cdejRole === "facilitator" && staff.status === "active").map(staff => ({ id: staff.id, name: `${staff.firstName} ${staff.lastName}` })),
      };
    }),
  }),
  participants: router({
    list: protectedProcedure.input(z.object({ query: z.string().optional(), groupId: z.number().int().positive().optional(), status: z.enum(["active", "paused", "graduated", "archived"]).optional() })).query(async ({ input, ctx }) => {
      requireDomain(ctx.user, "participants");
      return getParticipantList(input);
    }),
    create: protectedProcedure.input(participantInput).mutation(async ({ input, ctx }) => {
      requireDomain(ctx.user, "participants");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const existing = await db.select().from(participants).where(eq(participants.participantCode, input.participantCode)).limit(1);
      if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "Cet identifiant participant existe déjà." });
      await db.insert(participants).values({ ...input, school: input.school ?? null, classLevel: input.classLevel ?? null, guardianName: input.guardianName ?? null, guardianPhone: input.guardianPhone ?? null, groupId: input.groupId ?? null, facilitatorId: input.facilitatorId ?? null });
      await logAudit(ctx.user.id, "created", "participant", input.participantCode, { source: "manual_form" });
      return { success: true };
    }),
    archive: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      requireDomain(ctx.user, "participants");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(participants).set({ status: "archived" }).where(eq(participants.id, input.id));
      await logAudit(ctx.user.id, "archived", "participant", input.id);
      return { success: true };
    }),
    importBatch: protectedProcedure.input(z.object({ rows: z.array(participantInput).min(1).max(500), sourceName: z.string().min(1).max(255) })).mutation(async ({ input, ctx }) => {
      requireDomain(ctx.user, "participants");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const existingRows = await db.select({ participantCode: participants.participantCode }).from(participants);
      const knownCodes = new Set(existingRows.map(row => row.participantCode.toLocaleLowerCase()));
      const batchCodes = new Set<string>();
      const newRows = input.rows.filter(row => {
        const code = row.participantCode.toLocaleLowerCase();
        if (knownCodes.has(code) || batchCodes.has(code)) return false;
        batchCodes.add(code);
        return true;
      });
      if (newRows.length) {
        await db.insert(participants).values(newRows.map(row => ({ ...row, school: row.school ?? null, classLevel: row.classLevel ?? null, guardianName: row.guardianName ?? null, guardianPhone: row.guardianPhone ?? null, groupId: row.groupId ?? null, facilitatorId: row.facilitatorId ?? null })));
      }
      const skipped = input.rows.length - newRows.length;
      await logAudit(ctx.user.id, "imported", "participant", input.sourceName, { sourceName: input.sourceName, received: input.rows.length, created: newRows.length, skippedDuplicates: skipped });
      return { created: newRows.length, skippedDuplicates: skipped };
    }),
  }),
  staff: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "staff");
      return getStaffList();
    }),
    assignManager: protectedProcedure.input(z.object({ staffId: z.number().int().positive(), managerId: z.number().int().positive().nullable() })).mutation(async ({ input, ctx }) => {
      requireDomain(ctx.user, "staff");
      if (!["pastor", "coordinator"].includes(ctx.user.cdejRole) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Seul le coordinateur ou le pasteur peut modifier un rattachement hiérarchique." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(staffProfiles).set({ managerId: input.managerId }).where(eq(staffProfiles.id, input.staffId));
      await logAudit(ctx.user.id, "assigned_manager", "staff_profile", input.staffId, { managerId: input.managerId });
      return { success: true };
    }),
  }),
  activities: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "activities");
      return getActivityList();
    }),
    assignmentBoard: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "staff");
      const db = await getDb();
      if (!db) return { activities: [], staff: [], assignments: [] };
      const [activityRows, staffRows, assignmentRows] = await Promise.all([db.select().from(activities).orderBy(desc(activities.startsAt)), db.select().from(staffProfiles), db.select().from(activityStaffAssignments)]);
      const staff = staffRows.filter(member => member.status === "active" && (member.cdejRole === "facilitator" || member.cdejRole === "volunteer"));
      const staffById = new Map(staff.map(member => [member.id, member]));
      const activityById = new Map(activityRows.map(activity => [activity.id, activity]));
      return {
        activities: activityRows,
        staff: staff.map(member => ({ id: member.id, name: `${member.firstName} ${member.lastName}`, role: member.cdejRole, category: member.volunteerCategory })),
        assignments: assignmentRows.map(assignment => ({
          ...assignment,
          activityTitle: activityById.get(assignment.activityId)?.title ?? "Activité supprimée",
          activityStartsAt: activityById.get(assignment.activityId)?.startsAt ?? null,
          staffName: staffById.has(assignment.staffId) ? `${staffById.get(assignment.staffId)!.firstName} ${staffById.get(assignment.staffId)!.lastName}` : "Membre indisponible",
          staffRole: staffById.get(assignment.staffId)?.cdejRole ?? "volunteer",
        })),
      };
    }),
    assignStaff: protectedProcedure.input(z.object({ activityId: z.number().int().positive(), staffId: z.number().int().positive(), assignmentType: z.enum(["facilitation", "support", "logistics", "nutrition", "supervision"]) })).mutation(async ({ input, ctx }) => {
      requireDomain(ctx.user, "staff");
      if (!["pastor", "cpc", "coordinator"].includes(ctx.user.cdejRole) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Seuls le pasteur, le CPC ou le coordinateur peuvent modifier les affectations." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [activity] = await db.select().from(activities).where(eq(activities.id, input.activityId)).limit(1);
      const [staff] = await db.select().from(staffProfiles).where(eq(staffProfiles.id, input.staffId)).limit(1);
      if (!activity) throw new TRPCError({ code: "NOT_FOUND", message: "Activité introuvable." });
      if (!staff || staff.status !== "active" || !["facilitator", "volunteer"].includes(staff.cdejRole)) throw new TRPCError({ code: "BAD_REQUEST", message: "Le membre sélectionné doit être un animateur ou volontaire actif." });
      const existing = await db.select().from(activityStaffAssignments).where(and(eq(activityStaffAssignments.activityId, input.activityId), eq(activityStaffAssignments.staffId, input.staffId))).limit(1);
      if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "Cette personne est déjà affectée à l’activité." });
      await db.insert(activityStaffAssignments).values(input);
      await logAudit(ctx.user.id, "assigned_activity", "activity_staff_assignment", `${input.activityId}:${input.staffId}`, { assignmentType: input.assignmentType });
      return { success: true };
    }),
    removeStaffAssignment: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      requireDomain(ctx.user, "staff");
      if (!["pastor", "cpc", "coordinator"].includes(ctx.user.cdejRole) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Seuls le pasteur, le CPC ou le coordinateur peuvent modifier les affectations." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(activityStaffAssignments).where(eq(activityStaffAssignments.id, input.id));
      await logAudit(ctx.user.id, "removed_activity_assignment", "activity_staff_assignment", input.id);
      return { success: true };
    }),
  }),
  activityReminders: router({
    settings: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "staff");
      const db = await getDb();
      if (!db) return { enabled: false, leadHours: 24, scheduleCronTaskUid: null };
      const [settings] = await db.select().from(activityReminderSettings).limit(1);
      return settings ?? { enabled: false, leadHours: 24, scheduleCronTaskUid: null };
    }),
    configure: protectedProcedure.input(z.object({ enabled: z.boolean(), leadHours: z.number().int().min(1).max(168) })).mutation(async ({ input, ctx }) => {
      requireDomain(ctx.user, "staff");
      if (!["pastor", "cpc", "coordinator"].includes(ctx.user.cdejRole) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Seuls le pasteur, le CPC ou le coordinateur peuvent configurer les rappels." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      let [settings] = await db.select().from(activityReminderSettings).limit(1);
      if (!settings) {
        await db.insert(activityReminderSettings).values({ enabled: false, leadHours: input.leadHours, updatedByUserId: ctx.user.id });
        [settings] = await db.select().from(activityReminderSettings).limit(1);
      }
      if (!settings) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      let taskUid = settings.scheduleCronTaskUid;
      if (process.env.VERCEL === "1") {
        taskUid = VERCEL_ACTIVITY_REMINDER_TASK_UID;
      } else if (input.enabled && !taskUid) {
        const job = await createHeartbeatJob({ name: `cdej-activity-reminders-${settings.id}`, cron: ACTIVITY_REMINDER_CRON, path: "/api/scheduled/activity-reminders", description: "Rappels internes quotidiens des activités affectées du SIG-CDEJ" }, sessionToken);
        taskUid = job.taskUid;
      } else if (taskUid) {
        await updateHeartbeatJob(taskUid, { enable: input.enabled }, sessionToken);
      }
      await db.update(activityReminderSettings).set({ enabled: input.enabled, leadHours: input.leadHours, scheduleCronTaskUid: taskUid, updatedByUserId: ctx.user.id }).where(eq(activityReminderSettings.id, settings.id));
      await logAudit(ctx.user.id, input.enabled ? "enabled_activity_reminders" : "disabled_activity_reminders", "activity_reminder_settings", settings.id, { leadHours: input.leadHours, taskUid });
      return { success: true, taskUid };
    }),
  }),
  attendance: router({
    record: protectedProcedure.input(z.object({ participantId: z.number().int().positive(), status: z.enum(["present", "absent", "late", "excused"]), reason: z.string().max(1000).optional(), attendanceDate: z.date() })).mutation(async ({ input, ctx }) => {
      requireDomain(ctx.user, "participants");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(attendanceRecords).values({ attendanceDate: input.attendanceDate, subjectType: "participant", participantId: input.participantId, status: input.status, reason: input.reason ?? null, recordedByUserId: ctx.user.id });
      await logAudit(ctx.user.id, "recorded", "attendance", input.participantId, { status: input.status });
      return { success: true };
    }),
  }),
  leaves: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "staff");
      return getLeaveList();
    }),
    decide: protectedProcedure.input(z.object({ id: z.number().int().positive(), decision: z.enum(["approve", "reject"]), comment: z.string().max(1000).optional() })).mutation(async ({ input, ctx }) => {
      requireDomain(ctx.user, "staff");
      if (!["pastor", "coordinator"].includes(ctx.user.cdejRole) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Seul le coordinateur ou le pasteur peut rendre une décision finale." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const request = await db.select().from(leaveRequests).where(eq(leaveRequests.id, input.id)).limit(1);
      await db.update(leaveRequests).set({ status: input.decision === "approve" ? "approved" : "rejected", coordinatorDecisionBy: ctx.user.id, finalComment: input.comment ?? null }).where(eq(leaveRequests.id, input.id));
      if (request[0]) {
        const requester = await db.select().from(staffProfiles).where(eq(staffProfiles.id, request[0].staffId)).limit(1);
        if (requester[0]?.userId) {
          await db.insert(notifications).values({ recipientUserId: requester[0].userId, type: "leave", title: "Décision sur votre demande", message: input.decision === "approve" ? "Votre demande de congé a été approuvée." : "Votre demande de congé a été refusée.", priority: "high", actionUrl: "/leaves" });
        }
      }
      await logAudit(ctx.user.id, input.decision === "approve" ? "approved" : "rejected", "leave_request", input.id);
      return { success: true };
    }),
  }),
  inventory: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "inventory");
      return getInventoryList();
    }),
  }),
  suppliers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "inventory");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(suppliers).orderBy(suppliers.name);
    }),
  }),
  health: router({
    list: protectedProcedure.input(z.object({ participantId: z.number().int().positive().optional() })).query(async ({ input, ctx }) => {
      requireDomain(ctx.user, "health");
      const db = await getDb();
      if (!db) return [];
      return input.participantId ? db.select().from(healthRecords).where(eq(healthRecords.participantId, input.participantId)) : db.select().from(healthRecords);
    }),
  }),
  education: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "participants");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(educationRecords).orderBy(desc(educationRecords.recordedAt));
    }),
  }),
  nutrition: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "activities");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(nutritionRecords).orderBy(desc(nutritionRecords.mealDate));
    }),
  }),
  finance: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "finance");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(financeTransactions).orderBy(desc(financeTransactions.transactionDate));
    }),
  }),
  documents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "participants");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(documents).orderBy(desc(documents.createdAt));
    }),
    upload: protectedProcedure.input(z.object({ title: z.string().min(1).max(240), category: z.string().min(1).max(120), originalFilename: z.string().min(1).max(255), mimeType: z.string().min(1).max(120), dataBase64: z.string().min(1), participantId: z.number().int().positive().optional(), staffId: z.number().int().positive().optional(), leaveRequestId: z.number().int().positive().optional(), activityId: z.number().int().positive().optional() })).mutation(async ({ input, ctx }) => {
      requireDomain(ctx.user, "participants");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const buffer = Buffer.from(input.dataBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
      if (buffer.byteLength > 8 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "La taille maximale d’un fichier est de 8 Mo." });
      const safeName = input.originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `cdej/${ctx.user.id}/attachments/${Date.now()}-${safeName}`;
      const stored = await storagePut(key, buffer, input.mimeType);
      await db.insert(documents).values({ title: input.title, category: input.category, storageKey: stored.key, storageUrl: stored.url, originalFilename: input.originalFilename, mimeType: input.mimeType, sizeBytes: buffer.byteLength, participantId: input.participantId ?? null, staffId: input.staffId ?? null, leaveRequestId: input.leaveRequestId ?? null, activityId: input.activityId ?? null, uploadedByUserId: ctx.user.id });
      await logAudit(ctx.user.id, "uploaded", "document", safeName, { storageKey: stored.key, category: input.category });
      return { success: true, url: stored.url };
    }),
  }),
  media: router({
    uploadProfilePhoto: protectedProcedure.input(z.object({ entityType: z.enum(["participant", "staff"]), entityId: z.number().int().positive(), originalFilename: z.string().min(1).max(255), mimeType: z.string().startsWith("image/"), dataBase64: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      requireDomain(ctx.user, input.entityType === "staff" ? "staff" : "participants");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const buffer = Buffer.from(input.dataBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
      if (buffer.byteLength > 5 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "La taille maximale d’une photo est de 5 Mo." });
      const safeName = input.originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const stored = await storagePut(`cdej/${ctx.user.id}/profile-photos/${Date.now()}-${safeName}`, buffer, input.mimeType);
      if (input.entityType === "participant") {
        await db.update(participants).set({ photoKey: stored.key, photoUrl: stored.url }).where(eq(participants.id, input.entityId));
      } else {
        await db.update(staffProfiles).set({ photoKey: stored.key, photoUrl: stored.url }).where(eq(staffProfiles.id, input.entityId));
      }
      await db.insert(documents).values({
        title: `Photo de profil — ${input.entityType === "participant" ? "participant" : "personnel"}`,
        category: "Photo de profil",
        storageKey: stored.key,
        storageUrl: stored.url,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        sizeBytes: buffer.byteLength,
        participantId: input.entityType === "participant" ? input.entityId : null,
        staffId: input.entityType === "staff" ? input.entityId : null,
        uploadedByUserId: ctx.user.id,
      });
      await logAudit(ctx.user.id, "uploaded_profile_photo", input.entityType, input.entityId, { storageKey: stored.key, mimeType: input.mimeType, sizeBytes: buffer.byteLength });
      return { success: true, url: stored.url };
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(notifications).where(eq(notifications.recipientUserId, ctx.user.id)).orderBy(desc(notifications.createdAt));
    }),
    read: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, input.id), eq(notifications.recipientUserId, ctx.user.id)));
      return { success: true };
    }),
  }),
  search: router({
    global: protectedProcedure.input(z.object({ query: z.string().min(1).max(120) })).query(async ({ input, ctx }) => {
      requireDomain(ctx.user, "participants");
      return getGlobalSearch(input.query);
    }),
  }),
  audit: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireDomain(ctx.user, "audit");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(auditLogs).orderBy(desc(auditLogs.occurredAt)).limit(50);
    }),
  }),
});

export type AppRouter = typeof appRouter;
