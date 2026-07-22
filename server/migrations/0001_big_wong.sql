CREATE TABLE IF NOT EXISTS `authorized_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`device_name` varchar(100) NOT NULL,
	`device_fingerprint` varchar(100) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`device_type` varchar(50),
	`operating_system` varchar(50),
	`browser_name` varchar(50),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`last_ip` varchar(45),
	`user_agent` varchar(255),
	`allow_remote` boolean NOT NULL DEFAULT false,
	`approved_by` int,
	`approved_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authorized_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `authorized_devices_device_fingerprint_unique` UNIQUE(`device_fingerprint`),
	CONSTRAINT `device_fingerprint_idx` UNIQUE(`device_fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `sms_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`message` text NOT NULL,
	`audience_type` varchar(30) NOT NULL DEFAULT 'all',
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`scheduled_at` datetime,
	`started_at` datetime,
	`completed_at` datetime,
	`recipient_count` int NOT NULL DEFAULT 0,
	`sent_count` int NOT NULL DEFAULT 0,
	`failed_count` int NOT NULL DEFAULT 0,
	`created_by` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sms_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_id` int,
	`customer_id` int,
	`direction` varchar(10) NOT NULL,
	`from_number` varchar(25),
	`to_number` varchar(25) NOT NULL,
	`body` text NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'queued',
	`provider_message_sid` varchar(50),
	`error_code` varchar(20),
	`error_message` text,
	`sent_at` datetime,
	`delivered_at` datetime,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sms_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `sms_messages_provider_message_sid_unique` UNIQUE(`provider_message_sid`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `sms_marketing_consent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `sms_consent_at` datetime;--> statement-breakpoint
ALTER TABLE `customers` ADD `sms_consent_source` varchar(50);--> statement-breakpoint
ALTER TABLE `customers` ADD `sms_opt_out_at` datetime;--> statement-breakpoint
CREATE INDEX `sms_campaign_status_created_idx` ON `sms_campaigns` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `sms_message_campaign_status_idx` ON `sms_messages` (`campaign_id`,`status`);--> statement-breakpoint
CREATE INDEX `sms_message_customer_created_idx` ON `sms_messages` (`customer_id`,`created_at`);
