import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import type { Request, Response } from "express";
import { activities, activityReminderSettings, activityStaffAssignments, notifications, staffProfiles } from "../drizzle/schema";
import { getDb, logAudit } from "./db";
import { sdk } from "./_core/sdk";

export const ACTIVITY_REMINDER_CRON = "0 0 7 * * *";

export function shouldSendActivityReminder(status: string, startsAt: Date, reminderSentAt: Date | null, now: Date, leadHours: number) {
  const deadline = new Date(now.getTime() + leadHours * 60 * 60 * 1000);
  return !reminderSentAt && (status === "planned" || status === "in_progress") && startsAt >= now && startsAt <= deadline;
}

export async function runActivityReminders(taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [settings] = await db.select().from(activityReminderSettings).where(eq(activityReminderSettings.scheduleCronTaskUid, taskUid)).limit(1);
  if (!settings || !settings.enabled) return { ok: true, skipped: "disabled_or_orphan", sent: 0 };

  const now = new Date();
  const deadline = new Date(now.getTime() + settings.leadHours * 60 * 60 * 1000);
  const upcoming = await db.select().from(activities).where(and(gte(activities.startsAt, now), lte(activities.startsAt, deadline)));
  const relevantActivities = upcoming.filter(activity => shouldSendActivityReminder(activity.status, activity.startsAt, null, now, settings.leadHours));
  if (!relevantActivities.length) return { ok: true, sent: 0 };

  const activityIds = relevantActivities.map(activity => activity.id);
  const assignments = await db.select().from(activityStaffAssignments).where(and(inArray(activityStaffAssignments.activityId, activityIds), isNull(activityStaffAssignments.reminderSentAt)));
  if (!assignments.length) return { ok: true, sent: 0 };

  const activityById = new Map(relevantActivities.map(activity => [activity.id, activity]));
  const staffRows = await db.select().from(staffProfiles).where(inArray(staffProfiles.id, assignments.map(assignment => assignment.staffId)));
  const staffById = new Map(staffRows.map(staff => [staff.id, staff]));
  let sent = 0;

  for (const assignment of assignments) {
    const staff = staffById.get(assignment.staffId);
    const activity = activityById.get(assignment.activityId);
    if (!staff?.userId || !activity) continue;
    await db.insert(notifications).values({
      recipientUserId: staff.userId,
      type: "activity",
      title: `Rappel : ${activity.title}`,
      message: `Vous êtes affecté(e) à cette activité le ${activity.startsAt.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}${activity.location ? ` à ${activity.location}` : ""}.`,
      priority: "normal",
      actionUrl: "/activities",
    });
    await db.update(activityStaffAssignments).set({ reminderSentAt: now }).where(eq(activityStaffAssignments.id, assignment.id));
    await logAudit(null, "sent_activity_reminder", "activity_staff_assignment", assignment.id, { activityId: activity.id, staffId: staff.id, leadHours: settings.leadHours });
    sent += 1;
  }
  return { ok: true, sent };
}

export async function activityReminderHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await runActivityReminders(user.taskUid);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal reminder failure",
      context: { url: req.originalUrl },
      timestamp: new Date().toISOString(),
    });
  }
}
