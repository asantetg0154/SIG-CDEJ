import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const cdejRoleValues = [
  "pastor",
  "cpc",
  "coordinator",
  "facilitator",
  "volunteer",
  "participant",
] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  cdejRole: mysqlEnum("cdejRole", cdejRoleValues).default("coordinator").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  ageRange: varchar("ageRange", { length: 60 }),
  facilitatorId: int("facilitatorId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const staffProfiles = mysqlTable(
  "staffProfiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    employeeCode: varchar("employeeCode", { length: 40 }).notNull().unique(),
    firstName: varchar("firstName", { length: 100 }).notNull(),
    lastName: varchar("lastName", { length: 100 }).notNull(),
    gender: mysqlEnum("gender", ["female", "male", "other"]).notNull(),
    cdejRole: mysqlEnum("cdejRole", ["pastor", "cpc", "coordinator", "facilitator", "volunteer"]).notNull(),
    volunteerCategory: mysqlEnum("volunteerCategory", ["teacher", "cook", "supervisor", "other"]),
    phone: varchar("phone", { length: 40 }),
    email: varchar("email", { length: 320 }),
    startedAt: timestamp("startedAt"),
    status: mysqlEnum("status", ["active", "leave", "inactive", "archived"]).default("active").notNull(),
    managerId: int("managerId"),
    photoKey: varchar("photoKey", { length: 500 }),
    photoUrl: varchar("photoUrl", { length: 500 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("staff_role_idx").on(table.cdejRole), index("staff_manager_idx").on(table.managerId)],
);

export const participants = mysqlTable(
  "participants",
  {
    id: int("id").autoincrement().primaryKey(),
    participantCode: varchar("participantCode", { length: 40 }).notNull().unique(),
    firstName: varchar("firstName", { length: 100 }).notNull(),
    lastName: varchar("lastName", { length: 100 }).notNull(),
    gender: mysqlEnum("gender", ["female", "male", "other"]).notNull(),
    birthDate: timestamp("birthDate").notNull(),
    school: varchar("school", { length: 160 }),
    classLevel: varchar("classLevel", { length: 100 }),
    educationLevel: varchar("educationLevel", { length: 100 }),
    guardianName: varchar("guardianName", { length: 200 }),
    guardianPhone: varchar("guardianPhone", { length: 40 }),
    address: text("address"),
    groupId: int("groupId"),
    facilitatorId: int("facilitatorId"),
    enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
    status: mysqlEnum("status", ["active", "paused", "graduated", "archived"]).default("active").notNull(),
    photoKey: varchar("photoKey", { length: 500 }),
    photoUrl: varchar("photoUrl", { length: 500 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("participant_name_idx").on(table.lastName, table.firstName),
    index("participant_group_idx").on(table.groupId),
    index("participant_facilitator_idx").on(table.facilitatorId),
  ],
);

export const activities = mysqlTable(
  "activities",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    objective: text("objective"),
    location: varchar("location", { length: 200 }),
    startsAt: timestamp("startsAt").notNull(),
    endsAt: timestamp("endsAt"),
    status: mysqlEnum("status", ["planned", "in_progress", "completed", "cancelled"]).default("planned").notNull(),
    facilitatorId: int("facilitatorId"),
    groupId: int("groupId"),
    report: text("report"),
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("activity_start_idx").on(table.startsAt), index("activity_group_idx").on(table.groupId)],
);

export const activityParticipants = mysqlTable(
  "activityParticipants",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId").notNull(),
    participantId: int("participantId").notNull(),
    attendanceStatus: mysqlEnum("attendanceStatus", ["expected", "present", "absent", "excused"]).default("expected").notNull(),
  },
  table => [index("activity_participant_idx").on(table.activityId, table.participantId)],
);

export const activityStaffAssignments = mysqlTable(
  "activityStaffAssignments",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId").notNull(),
    staffId: int("staffId").notNull(),
    assignmentType: mysqlEnum("assignmentType", ["facilitation", "support", "logistics", "nutrition", "supervision"]).default("support").notNull(),
    reminderSentAt: timestamp("reminderSentAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("activity_staff_activity_idx").on(table.activityId), index("activity_staff_person_idx").on(table.staffId)],
);

export const activityReminderSettings = mysqlTable(
  "activityReminderSettings",
  {
    id: int("id").autoincrement().primaryKey(),
    enabled: boolean("enabled").default(false).notNull(),
    leadHours: int("leadHours").default(24).notNull(),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    updatedByUserId: int("updatedByUserId"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("activity_reminder_task_idx").on(table.scheduleCronTaskUid)],
);

export const attendanceRecords = mysqlTable(
  "attendanceRecords",
  {
    id: int("id").autoincrement().primaryKey(),
    attendanceDate: timestamp("attendanceDate").notNull(),
    subjectType: mysqlEnum("subjectType", ["participant", "staff"]).notNull(),
    participantId: int("participantId"),
    staffId: int("staffId"),
    activityId: int("activityId"),
    status: mysqlEnum("status", ["present", "absent", "late", "excused"]).notNull(),
    reason: text("reason"),
    recordedByUserId: int("recordedByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("attendance_date_idx").on(table.attendanceDate), index("attendance_participant_idx").on(table.participantId)],
);

export const leaveRequests = mysqlTable(
  "leaveRequests",
  {
    id: int("id").autoincrement().primaryKey(),
    staffId: int("staffId").notNull(),
    leaveType: mysqlEnum("leaveType", ["annual", "permission", "sick", "maternity", "paternity", "training", "mission", "exceptional", "unpaid", "other"]).notNull(),
    startsAt: timestamp("startsAt").notNull(),
    endsAt: timestamp("endsAt").notNull(),
    requestedDays: decimal("requestedDays", { precision: 6, scale: 2 }).notNull(),
    reason: text("reason"),
    status: mysqlEnum("status", ["pending_manager", "pending_coordinator", "approved", "rejected", "cancelled"]).default("pending_manager").notNull(),
    managerDecisionBy: int("managerDecisionBy"),
    coordinatorDecisionBy: int("coordinatorDecisionBy"),
    managerComment: text("managerComment"),
    finalComment: text("finalComment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("leave_staff_idx").on(table.staffId), index("leave_status_idx").on(table.status)],
);

export const educationRecords = mysqlTable(
  "educationRecords",
  {
    id: int("id").autoincrement().primaryKey(),
    participantId: int("participantId").notNull(),
    termLabel: varchar("termLabel", { length: 100 }).notNull(),
    averageScore: decimal("averageScore", { precision: 5, scale: 2 }),
    resultStatus: mysqlEnum("resultStatus", ["progressing", "stable", "needs_support", "repeat"]).notNull(),
    difficulties: text("difficulties"),
    supportPlan: text("supportPlan"),
    observations: text("observations"),
    recordedByUserId: int("recordedByUserId"),
    recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  },
  table => [index("education_participant_idx").on(table.participantId)],
);

export const healthRecords = mysqlTable(
  "healthRecords",
  {
    id: int("id").autoincrement().primaryKey(),
    participantId: int("participantId").notNull(),
    visitAt: timestamp("visitAt").notNull(),
    visitType: varchar("visitType", { length: 100 }).notNull(),
    summary: text("summary").notNull(),
    treatment: text("treatment"),
    referral: text("referral"),
    confidentialNotes: text("confidentialNotes"),
    recordedByUserId: int("recordedByUserId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("health_participant_idx").on(table.participantId)],
);

export const nutritionRecords = mysqlTable(
  "nutritionRecords",
  {
    id: int("id").autoincrement().primaryKey(),
    participantId: int("participantId"),
    mealDate: timestamp("mealDate").notNull(),
    mealType: varchar("mealType", { length: 100 }).notNull(),
    servedCount: int("servedCount").default(0).notNull(),
    menu: text("menu"),
    nutritionNote: text("nutritionNote"),
    recordedByUserId: int("recordedByUserId"),
  },
  table => [index("nutrition_date_idx").on(table.mealDate)],
);

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  contactName: varchar("contactName", { length: 160 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  category: varchar("category", { length: 120 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inventoryItems = mysqlTable(
  "inventoryItems",
  {
    id: int("id").autoincrement().primaryKey(),
    sku: varchar("sku", { length: 60 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    category: varchar("category", { length: 120 }).notNull(),
    quantity: decimal("quantity", { precision: 12, scale: 2 }).default("0").notNull(),
    unit: varchar("unit", { length: 40 }).notNull(),
    alertThreshold: decimal("alertThreshold", { precision: 12, scale: 2 }).default("0").notNull(),
    supplierId: int("supplierId"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("inventory_category_idx").on(table.category)],
);

export const stockMovements = mysqlTable("stockMovements", {
  id: int("id").autoincrement().primaryKey(),
  inventoryItemId: int("inventoryItemId").notNull(),
  movementType: mysqlEnum("movementType", ["in", "out", "adjustment"]).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  recordedByUserId: int("recordedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const financeTransactions = mysqlTable(
  "financeTransactions",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionDate: timestamp("transactionDate").notNull(),
    type: mysqlEnum("type", ["income", "expense"]).notNull(),
    category: varchar("category", { length: 120 }).notNull(),
    amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("USD").notNull(),
    activityId: int("activityId"),
    description: text("description"),
    recordedByUserId: int("recordedByUserId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("finance_date_idx").on(table.transactionDate), index("finance_type_idx").on(table.type)],
);

export const documents = mysqlTable(
  "documents",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 240 }).notNull(),
    category: varchar("category", { length: 120 }).notNull(),
    storageKey: varchar("storageKey", { length: 500 }).notNull(),
    storageUrl: varchar("storageUrl", { length: 500 }).notNull(),
    originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    participantId: int("participantId"),
    staffId: int("staffId"),
    leaveRequestId: int("leaveRequestId"),
    activityId: int("activityId"),
    uploadedByUserId: int("uploadedByUserId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("document_category_idx").on(table.category), index("document_participant_idx").on(table.participantId)],
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    recipientUserId: int("recipientUserId").notNull(),
    type: mysqlEnum("type", ["leave", "attendance", "inventory", "report", "activity", "system"]).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    message: text("message").notNull(),
    priority: mysqlEnum("priority", ["low", "normal", "high", "critical"]).default("normal").notNull(),
    isRead: boolean("isRead").default(false).notNull(),
    actionUrl: varchar("actionUrl", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("notification_recipient_idx").on(table.recipientUserId, table.isRead)],
);

export const auditLogs = mysqlTable(
  "auditLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    actorUserId: int("actorUserId"),
    action: varchar("action", { length: 120 }).notNull(),
    entityType: varchar("entityType", { length: 100 }).notNull(),
    entityId: varchar("entityId", { length: 100 }),
    metadata: json("metadata"),
    occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  },
  table => [index("audit_actor_idx").on(table.actorUserId), index("audit_entity_idx").on(table.entityType, table.entityId)],
);

export type CdejRole = (typeof cdejRoleValues)[number];
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
