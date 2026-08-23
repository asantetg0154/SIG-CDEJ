CREATE TABLE `activityStaffAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`staffId` int NOT NULL,
	`assignmentType` enum('facilitation','support','logistics','nutrition','supervision') NOT NULL DEFAULT 'support',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityStaffAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `activity_staff_activity_idx` ON `activityStaffAssignments` (`activityId`);--> statement-breakpoint
CREATE INDEX `activity_staff_person_idx` ON `activityStaffAssignments` (`staffId`);