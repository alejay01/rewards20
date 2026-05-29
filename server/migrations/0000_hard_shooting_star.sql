CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actor_user_id` int,
	`actor_role` varchar(30),
	`customer_id` int,
	`action` varchar(50) NOT NULL,
	`old_value` text,
	`new_value` text,
	`points_change` int,
	`reward_id` int,
	`receipt_claim_id` int,
	`ip_address` varchar(45),
	`user_agent` varchar(255),
	`reason` text,
	`approved_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`public_id` varchar(36) NOT NULL,
	`first_name` varchar(50) NOT NULL,
	`last_name` varchar(50) NOT NULL,
	`email` varchar(100),
	`phone` varchar(20),
	`birthday` date,
	`favorite_category` varchar(50),
	`consent_promotions` boolean DEFAULT false,
	`status` varchar(20) DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_public_id_unique` UNIQUE(`public_id`),
	CONSTRAINT `customers_email_unique` UNIQUE(`email`),
	CONSTRAINT `customers_phone_unique` UNIQUE(`phone`),
	CONSTRAINT `customer_email_idx` UNIQUE(`email`),
	CONSTRAINT `customer_phone_idx` UNIQUE(`phone`),
	CONSTRAINT `customer_public_id_idx` UNIQUE(`public_id`)
);
--> statement-breakpoint
CREATE TABLE `integration_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integration_name` varchar(50) NOT NULL,
	`action` varchar(100) NOT NULL,
	`status` varchar(20) NOT NULL,
	`message` text,
	`raw_error` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `integration_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyalty_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`rewards_number` varchar(50) NOT NULL,
	`public_qr_token` varchar(100) NOT NULL,
	`barcode_value` varchar(50),
	`points_balance` int NOT NULL DEFAULT 0,
	`lifetime_points` int NOT NULL DEFAULT 0,
	`total_visits` int NOT NULL DEFAULT 0,
	`lifetime_spend` decimal(10,2) NOT NULL DEFAULT '0.00',
	`current_tier_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyalty_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `loyalty_accounts_customer_id_unique` UNIQUE(`customer_id`),
	CONSTRAINT `loyalty_accounts_rewards_number_unique` UNIQUE(`rewards_number`),
	CONSTRAINT `loyalty_accounts_public_qr_token_unique` UNIQUE(`public_qr_token`),
	CONSTRAINT `loyalty_accounts_barcode_value_unique` UNIQUE(`barcode_value`),
	CONSTRAINT `loyalty_qr_token_idx` UNIQUE(`public_qr_token`),
	CONSTRAINT `loyalty_rewards_num_idx` UNIQUE(`rewards_number`),
	CONSTRAINT `loyalty_barcode_idx` UNIQUE(`barcode_value`)
);
--> statement-breakpoint
CREATE TABLE `loyverse_customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`local_customer_id` int NOT NULL,
	`loyverse_customer_id` varchar(100) NOT NULL,
	`email` varchar(100),
	`phone` varchar(20),
	`barcode` varchar(50),
	`raw_json` text,
	`last_synced_at` datetime,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyverse_customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `loyverse_customers_local_customer_id_unique` UNIQUE(`local_customer_id`),
	CONSTRAINT `loyverse_customers_loyverse_customer_id_unique` UNIQUE(`loyverse_customer_id`),
	CONSTRAINT `loyverse_cust_id_idx` UNIQUE(`loyverse_customer_id`)
);
--> statement-breakpoint
CREATE TABLE `loyverse_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loyverse_receipt_id` varchar(100) NOT NULL,
	`local_customer_id` int,
	`receipt_number` varchar(100) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`receipt_date` datetime NOT NULL,
	`status` varchar(20) NOT NULL,
	`raw_json` text,
	`last_synced_at` datetime,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyverse_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `loyverse_receipts_loyverse_receipt_id_unique` UNIQUE(`loyverse_receipt_id`),
	CONSTRAINT `loyverse_rcpt_id_idx` UNIQUE(`loyverse_receipt_id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(50) NOT NULL,
	`description` text,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `points_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`loyalty_account_id` int NOT NULL,
	`staff_user_id` int,
	`type` varchar(30) NOT NULL,
	`points_change` int NOT NULL,
	`balance_after` int NOT NULL,
	`reason` text,
	`source` varchar(20) NOT NULL,
	`related_visit_id` int,
	`related_purchase_id` int,
	`related_redemption_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `points_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`audience_type` varchar(50) DEFAULT 'all',
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`active` boolean DEFAULT true,
	`featured` boolean DEFAULT false,
	`image_url` varchar(255),
	`linked_reward_id` int,
	`double_points` boolean DEFAULT false,
	`created_by` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`loyalty_account_id` int NOT NULL,
	`staff_user_id` int,
	`amount` decimal(10,2) NOT NULL,
	`points_awarded` int NOT NULL,
	`source` varchar(20) NOT NULL,
	`receipt_number` varchar(100),
	`loyverse_receipt_id` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qr_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(100) NOT NULL,
	`token_type` varchar(20) DEFAULT 'customer',
	`customer_id` int NOT NULL,
	`loyalty_account_id` int NOT NULL,
	`expires_at` datetime NOT NULL,
	`revoked_at` datetime,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `qr_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `qr_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `receipt_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receipt_number` varchar(100) NOT NULL,
	`customer_id` int,
	`claimant_name` varchar(100) NOT NULL,
	`claimant_email` varchar(100),
	`claimant_phone` varchar(20),
	`purchase_date` date NOT NULL,
	`purchase_total` decimal(10,2) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`source` varchar(20) NOT NULL DEFAULT 'web',
	`reviewed_by` int,
	`review_notes` text,
	`approved_at` datetime,
	`rejected_at` datetime,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receipt_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_redemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`loyalty_account_id` int NOT NULL,
	`reward_id` int NOT NULL,
	`staff_user_id` int NOT NULL,
	`manager_approved_by` int,
	`points_spent` int NOT NULL DEFAULT 0,
	`status` varchar(20) DEFAULT 'redeemed',
	`notes` text,
	`redeemed_at` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `reward_redemptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`reward_type` varchar(20) NOT NULL,
	`points_required` int NOT NULL DEFAULT 0,
	`visits_required` int NOT NULL DEFAULT 0,
	`spend_required` decimal(10,2) NOT NULL DEFAULT '0.00',
	`tier_required_id` int,
	`high_value` boolean DEFAULT false,
	`manager_approval_required` boolean DEFAULT false,
	`active` boolean DEFAULT true,
	`start_date` date,
	`end_date` date,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` int NOT NULL,
	`permission_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updated_by` int,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `staff_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`pin_hash` varchar(255),
	`role_id` int NOT NULL,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `tablet_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staff_user_id` int NOT NULL,
	`device_name` varchar(100) NOT NULL,
	`device_fingerprint` varchar(100) NOT NULL,
	`active` boolean DEFAULT true,
	`last_seen_at` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `tablet_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` text,
	`visits_required` int NOT NULL DEFAULT 0,
	`spend_required` decimal(10,2) NOT NULL DEFAULT '0.00',
	`points_required` int NOT NULL DEFAULT 0,
	`badge_image` varchar(255) NOT NULL,
	`unlock_message` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`loyalty_account_id` int NOT NULL,
	`staff_user_id` int,
	`source` varchar(20) NOT NULL,
	`visit_date` date NOT NULL,
	`points_awarded` int NOT NULL DEFAULT 0,
	`duplicate_override` boolean DEFAULT false,
	`manager_approved_by` int,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `visits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `audit_actor_date_idx` ON `audit_logs` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ledger_cust_date_idx` ON `points_ledger` (`customer_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `promo_active_date_idx` ON `promotions` (`active`,`start_date`,`end_date`);--> statement-breakpoint
CREATE INDEX `purchase_receipt_idx` ON `purchases` (`receipt_number`);--> statement-breakpoint
CREATE INDEX `purchase_loyverse_receipt_idx` ON `purchases` (`loyverse_receipt_id`);--> statement-breakpoint
CREATE INDEX `claim_status_idx` ON `receipt_claims` (`status`);--> statement-breakpoint
CREATE INDEX `claim_receipt_num_idx` ON `receipt_claims` (`receipt_number`);--> statement-breakpoint
CREATE INDEX `role_permission_idx` ON `role_permissions` (`role_id`,`permission_id`);