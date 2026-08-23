CREATE TABLE `activityReminderSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`leadHours` int NOT NULL DEFAULT 24,
	`scheduleCronTaskUid` varchar(65),
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activityReminderSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activityStaffAssignments` ADD `reminderSentAt` timestamp;--> statement-breakpoint
CREATE INDEX `activity_reminder_task_idx` ON `activityReminderSettings` (`scheduleCronTaskUid`);