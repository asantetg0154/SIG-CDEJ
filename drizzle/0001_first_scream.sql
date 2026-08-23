CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`category` varchar(100) NOT NULL,
	`objective` text,
	`location` varchar(200),
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp,
	`status` enum('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
	`facilitatorId` int,
	`groupId` int,
	`report` text,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activityParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`participantId` int NOT NULL,
	`attendanceStatus` enum('expected','present','absent','excused') NOT NULL DEFAULT 'expected',
	CONSTRAINT `activityParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attendanceDate` timestamp NOT NULL,
	`subjectType` enum('participant','staff') NOT NULL,
	`participantId` int,
	`staffId` int,
	`activityId` int,
	`status` enum('present','absent','late','excused') NOT NULL,
	`reason` text,
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendanceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` varchar(100),
	`metadata` json,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(240) NOT NULL,
	`category` varchar(120) NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`storageUrl` varchar(500) NOT NULL,
	`originalFilename` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`participantId` int,
	`staffId` int,
	`leaveRequestId` int,
	`activityId` int,
	`uploadedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `educationRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`termLabel` varchar(100) NOT NULL,
	`averageScore` decimal(5,2),
	`resultStatus` enum('progressing','stable','needs_support','repeat') NOT NULL,
	`difficulties` text,
	`supportPlan` text,
	`observations` text,
	`recordedByUserId` int,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `educationRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financeTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`category` varchar(120) NOT NULL,
	`amount` decimal(14,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`activityId` int,
	`description` text,
	`recordedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financeTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`ageRange` varchar(60),
	`facilitatorId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `healthRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`visitAt` timestamp NOT NULL,
	`visitType` varchar(100) NOT NULL,
	`summary` text NOT NULL,
	`treatment` text,
	`referral` text,
	`confidentialNotes` text,
	`recordedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `healthRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(60) NOT NULL,
	`name` varchar(200) NOT NULL,
	`category` varchar(120) NOT NULL,
	`quantity` decimal(12,2) NOT NULL DEFAULT '0',
	`unit` varchar(40) NOT NULL,
	`alertThreshold` decimal(12,2) NOT NULL DEFAULT '0',
	`supplierId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventoryItems_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `leaveRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`leaveType` enum('annual','permission','sick','maternity','paternity','training','mission','exceptional','unpaid','other') NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`requestedDays` decimal(6,2) NOT NULL,
	`reason` text,
	`status` enum('pending_manager','pending_coordinator','approved','rejected','cancelled') NOT NULL DEFAULT 'pending_manager',
	`managerDecisionBy` int,
	`coordinatorDecisionBy` int,
	`managerComment` text,
	`finalComment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaveRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientUserId` int NOT NULL,
	`type` enum('leave','attendance','inventory','report','activity','system') NOT NULL,
	`title` varchar(240) NOT NULL,
	`message` text NOT NULL,
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`isRead` boolean NOT NULL DEFAULT false,
	`actionUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nutritionRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int,
	`mealDate` timestamp NOT NULL,
	`mealType` varchar(100) NOT NULL,
	`servedCount` int NOT NULL DEFAULT 0,
	`menu` text,
	`nutritionNote` text,
	`recordedByUserId` int,
	CONSTRAINT `nutritionRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantCode` varchar(40) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`gender` enum('female','male','other') NOT NULL,
	`birthDate` timestamp NOT NULL,
	`school` varchar(160),
	`classLevel` varchar(100),
	`educationLevel` varchar(100),
	`guardianName` varchar(200),
	`guardianPhone` varchar(40),
	`address` text,
	`groupId` int,
	`facilitatorId` int,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('active','paused','graduated','archived') NOT NULL DEFAULT 'active',
	`photoKey` varchar(500),
	`photoUrl` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `participants_participantCode_unique` UNIQUE(`participantCode`)
);
--> statement-breakpoint
CREATE TABLE `staffProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`employeeCode` varchar(40) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`gender` enum('female','male','other') NOT NULL,
	`cdejRole` enum('pastor','cpc','coordinator','facilitator','volunteer') NOT NULL,
	`volunteerCategory` enum('teacher','cook','supervisor','other'),
	`phone` varchar(40),
	`email` varchar(320),
	`startedAt` timestamp,
	`status` enum('active','leave','inactive','archived') NOT NULL DEFAULT 'active',
	`managerId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staffProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `staffProfiles_employeeCode_unique` UNIQUE(`employeeCode`)
);
--> statement-breakpoint
CREATE TABLE `stockMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryItemId` int NOT NULL,
	`movementType` enum('in','out','adjustment') NOT NULL,
	`quantity` decimal(12,2) NOT NULL,
	`note` text,
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`contactName` varchar(160),
	`phone` varchar(40),
	`email` varchar(320),
	`category` varchar(120),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `cdejRole` enum('pastor','cpc','coordinator','facilitator','volunteer','participant') DEFAULT 'coordinator' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `activity_start_idx` ON `activities` (`startsAt`);--> statement-breakpoint
CREATE INDEX `activity_group_idx` ON `activities` (`groupId`);--> statement-breakpoint
CREATE INDEX `activity_participant_idx` ON `activityParticipants` (`activityId`,`participantId`);--> statement-breakpoint
CREATE INDEX `attendance_date_idx` ON `attendanceRecords` (`attendanceDate`);--> statement-breakpoint
CREATE INDEX `attendance_participant_idx` ON `attendanceRecords` (`participantId`);--> statement-breakpoint
CREATE INDEX `audit_actor_idx` ON `auditLogs` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `auditLogs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `document_category_idx` ON `documents` (`category`);--> statement-breakpoint
CREATE INDEX `document_participant_idx` ON `documents` (`participantId`);--> statement-breakpoint
CREATE INDEX `education_participant_idx` ON `educationRecords` (`participantId`);--> statement-breakpoint
CREATE INDEX `finance_date_idx` ON `financeTransactions` (`transactionDate`);--> statement-breakpoint
CREATE INDEX `finance_type_idx` ON `financeTransactions` (`type`);--> statement-breakpoint
CREATE INDEX `health_participant_idx` ON `healthRecords` (`participantId`);--> statement-breakpoint
CREATE INDEX `inventory_category_idx` ON `inventoryItems` (`category`);--> statement-breakpoint
CREATE INDEX `leave_staff_idx` ON `leaveRequests` (`staffId`);--> statement-breakpoint
CREATE INDEX `leave_status_idx` ON `leaveRequests` (`status`);--> statement-breakpoint
CREATE INDEX `notification_recipient_idx` ON `notifications` (`recipientUserId`,`isRead`);--> statement-breakpoint
CREATE INDEX `nutrition_date_idx` ON `nutritionRecords` (`mealDate`);--> statement-breakpoint
CREATE INDEX `participant_name_idx` ON `participants` (`lastName`,`firstName`);--> statement-breakpoint
CREATE INDEX `participant_group_idx` ON `participants` (`groupId`);--> statement-breakpoint
CREATE INDEX `participant_facilitator_idx` ON `participants` (`facilitatorId`);--> statement-breakpoint
CREATE INDEX `staff_role_idx` ON `staffProfiles` (`cdejRole`);--> statement-breakpoint
CREATE INDEX `staff_manager_idx` ON `staffProfiles` (`managerId`);