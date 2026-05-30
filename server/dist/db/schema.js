"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizedDevicesRelations = exports.authorizedDevices = exports.rewardRedemptionsRelations = exports.purchasesRelations = exports.visitsRelations = exports.loyaltyAccountRelations = exports.customerRelations = exports.rolePermissionsRelations = exports.staffUsersRelations = exports.settings = exports.tabletSessions = exports.auditLogs = exports.integrationLogs = exports.loyverseReceipts = exports.loyverseCustomers = exports.receiptClaims = exports.qrTokens = exports.promotions = exports.rewardRedemptions = exports.rewards = exports.pointsLedger = exports.purchases = exports.visits = exports.tiers = exports.loyaltyAccounts = exports.customers = exports.staffUsers = exports.rolePermissions = exports.permissions = exports.roles = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
// 1. Roles Table
exports.roles = (0, mysql_core_1.mysqlTable)("roles", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    name: (0, mysql_core_1.varchar)("name", { length: 50 }).notNull().unique(),
    description: (0, mysql_core_1.text)("description"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
});
// 2. Permissions Table
exports.permissions = (0, mysql_core_1.mysqlTable)("permissions", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    key: (0, mysql_core_1.varchar)("key", { length: 50 }).notNull().unique(),
    description: (0, mysql_core_1.text)("description")
});
// 3. Role Permissions Table
exports.rolePermissions = (0, mysql_core_1.mysqlTable)("role_permissions", {
    roleId: (0, mysql_core_1.int)("role_id").notNull(),
    permissionId: (0, mysql_core_1.int)("permission_id").notNull(),
}, (table) => {
    return {
        pk: (0, mysql_core_1.index)("role_permission_idx").on(table.roleId, table.permissionId)
    };
});
// 4. Staff Users Table
exports.staffUsers = (0, mysql_core_1.mysqlTable)("staff_users", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 100 }).notNull().unique(),
    passwordHash: (0, mysql_core_1.varchar)("password_hash", { length: 255 }).notNull(),
    pinHash: (0, mysql_core_1.varchar)("pin_hash", { length: 255 }), // Hash of 4-digit PIN for quick counter tablet actions
    roleId: (0, mysql_core_1.int)("role_id").notNull(),
    active: (0, mysql_core_1.boolean)("active").default(true),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
});
// 5. Customers Table
exports.customers = (0, mysql_core_1.mysqlTable)("customers", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    publicId: (0, mysql_core_1.varchar)("public_id", { length: 36 }).notNull().unique(), // UUID for external routing
    firstName: (0, mysql_core_1.varchar)("first_name", { length: 50 }).notNull(),
    lastName: (0, mysql_core_1.varchar)("last_name", { length: 50 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 100 }).unique(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }).unique(),
    birthday: (0, mysql_core_1.date)("birthday"),
    favoriteCategory: (0, mysql_core_1.varchar)("favorite_category", { length: 50 }),
    consentPromotions: (0, mysql_core_1.boolean)("consent_promotions").default(false),
    status: (0, mysql_core_1.varchar)("status", { length: 20 }).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
}, (table) => {
    return {
        emailIdx: (0, mysql_core_1.uniqueIndex)("customer_email_idx").on(table.email),
        phoneIdx: (0, mysql_core_1.uniqueIndex)("customer_phone_idx").on(table.phone),
        publicIdIdx: (0, mysql_core_1.uniqueIndex)("customer_public_id_idx").on(table.publicId)
    };
});
// 6. Loyalty Accounts Table
exports.loyaltyAccounts = (0, mysql_core_1.mysqlTable)("loyalty_accounts", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    customerId: (0, mysql_core_1.int)("customer_id").notNull().unique(),
    rewardsNumber: (0, mysql_core_1.varchar)("rewards_number", { length: 50 }).notNull().unique(),
    publicQrToken: (0, mysql_core_1.varchar)("public_qr_token", { length: 100 }).notNull().unique(), // QR specific token
    barcodeValue: (0, mysql_core_1.varchar)("barcode_value", { length: 50 }).unique(),
    pointsBalance: (0, mysql_core_1.int)("points_balance").default(0).notNull(),
    lifetimePoints: (0, mysql_core_1.int)("lifetime_points").default(0).notNull(),
    totalVisits: (0, mysql_core_1.int)("total_visits").default(0).notNull(),
    lifetimeSpend: (0, mysql_core_1.decimal)("lifetime_spend", { precision: 10, scale: 2 }).default("0.00").notNull(),
    currentTierId: (0, mysql_core_1.int)("current_tier_id").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
}, (table) => {
    return {
        publicQrIdx: (0, mysql_core_1.uniqueIndex)("loyalty_qr_token_idx").on(table.publicQrToken),
        rewardsNumIdx: (0, mysql_core_1.uniqueIndex)("loyalty_rewards_num_idx").on(table.rewardsNumber),
        barcodeIdx: (0, mysql_core_1.uniqueIndex)("loyalty_barcode_idx").on(table.barcodeValue)
    };
});
// 7. Tiers Table
exports.tiers = (0, mysql_core_1.mysqlTable)("tiers", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    name: (0, mysql_core_1.varchar)("name", { length: 50 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    visitsRequired: (0, mysql_core_1.int)("visits_required").default(0).notNull(),
    spendRequired: (0, mysql_core_1.decimal)("spend_required", { precision: 10, scale: 2 }).default("0.00").notNull(),
    pointsRequired: (0, mysql_core_1.int)("points_required").default(0).notNull(),
    badgeImage: (0, mysql_core_1.varchar)("badge_image", { length: 255 }).notNull(),
    unlockMessage: (0, mysql_core_1.text)("unlock_message"),
    sortOrder: (0, mysql_core_1.int)("sort_order").default(0).notNull(),
    active: (0, mysql_core_1.boolean)("active").default(true),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
});
// 8. Visits Table
exports.visits = (0, mysql_core_1.mysqlTable)("visits", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    customerId: (0, mysql_core_1.int)("customer_id").notNull(),
    loyaltyAccountId: (0, mysql_core_1.int)("loyalty_account_id").notNull(),
    staffUserId: (0, mysql_core_1.int)("staff_user_id"), // NULL if customer claimed or automatic
    source: (0, mysql_core_1.varchar)("source", { length: 20 }).notNull(), // 'tablet', 'receipt_claim', 'admin'
    visitDate: (0, mysql_core_1.date)("visit_date").notNull(),
    pointsAwarded: (0, mysql_core_1.int)("points_awarded").default(0).notNull(),
    duplicateOverride: (0, mysql_core_1.boolean)("duplicate_override").default(false),
    managerApprovedBy: (0, mysql_core_1.int)("manager_approved_by"), // Staff user ID who approved override
    notes: (0, mysql_core_1.text)("notes"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow()
});
// 9. Purchases Table
exports.purchases = (0, mysql_core_1.mysqlTable)("purchases", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    customerId: (0, mysql_core_1.int)("customer_id").notNull(),
    loyaltyAccountId: (0, mysql_core_1.int)("loyalty_account_id").notNull(),
    staffUserId: (0, mysql_core_1.int)("staff_user_id"),
    amount: (0, mysql_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
    pointsAwarded: (0, mysql_core_1.int)("points_awarded").notNull(),
    source: (0, mysql_core_1.varchar)("source", { length: 20 }).notNull(), // 'tablet', 'receipt_claim', 'loyverse'
    receiptNumber: (0, mysql_core_1.varchar)("receipt_number", { length: 100 }),
    loyverseReceiptId: (0, mysql_core_1.varchar)("loyverse_receipt_id", { length: 100 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow()
}, (table) => {
    return {
        receiptNumIdx: (0, mysql_core_1.index)("purchase_receipt_idx").on(table.receiptNumber),
        loyverseReceiptIdx: (0, mysql_core_1.index)("purchase_loyverse_receipt_idx").on(table.loyverseReceiptId)
    };
});
// 10. Points Ledger Table
exports.pointsLedger = (0, mysql_core_1.mysqlTable)("points_ledger", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    customerId: (0, mysql_core_1.int)("customer_id").notNull(),
    loyaltyAccountId: (0, mysql_core_1.int)("loyalty_account_id").notNull(),
    staffUserId: (0, mysql_core_1.int)("staff_user_id"), // Optional
    type: (0, mysql_core_1.varchar)("type", { length: 30 }).notNull(), // 'earn_visit', 'earn_spend', 'earn_promo', 'redeem', 'manual_add', 'manual_subtract'
    pointsChange: (0, mysql_core_1.int)("points_change").notNull(),
    balanceAfter: (0, mysql_core_1.int)("balance_after").notNull(),
    reason: (0, mysql_core_1.text)("reason"),
    source: (0, mysql_core_1.varchar)("source", { length: 20 }).notNull(), // 'tablet', 'receipt_claim', 'admin', 'system'
    relatedVisitId: (0, mysql_core_1.int)("related_visit_id"),
    relatedPurchaseId: (0, mysql_core_1.int)("related_purchase_id"),
    relatedRedemptionId: (0, mysql_core_1.int)("related_redemption_id"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow()
}, (table) => {
    return {
        customerDateIdx: (0, mysql_core_1.index)("ledger_cust_date_idx").on(table.customerId, table.createdAt)
    };
});
// 11. Rewards Table
exports.rewards = (0, mysql_core_1.mysqlTable)("rewards", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    rewardType: (0, mysql_core_1.varchar)("reward_type", { length: 20 }).notNull(), // 'visit', 'spend', 'points', 'birthday', 'tier', 'manual'
    pointsRequired: (0, mysql_core_1.int)("points_required").default(0).notNull(),
    visitsRequired: (0, mysql_core_1.int)("visits_required").default(0).notNull(),
    spendRequired: (0, mysql_core_1.decimal)("spend_required", { precision: 10, scale: 2 }).default("0.00").notNull(),
    tierRequiredId: (0, mysql_core_1.int)("tier_required_id"), // Minimum tier required
    highValue: (0, mysql_core_1.boolean)("high_value").default(false),
    managerApprovalRequired: (0, mysql_core_1.boolean)("manager_approval_required").default(false),
    active: (0, mysql_core_1.boolean)("active").default(true),
    startDate: (0, mysql_core_1.date)("start_date"),
    endDate: (0, mysql_core_1.date)("end_date"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
});
// 12. Reward Redemptions Table
exports.rewardRedemptions = (0, mysql_core_1.mysqlTable)("reward_redemptions", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    customerId: (0, mysql_core_1.int)("customer_id").notNull(),
    loyaltyAccountId: (0, mysql_core_1.int)("loyalty_account_id").notNull(),
    rewardId: (0, mysql_core_1.int)("reward_id").notNull(),
    staffUserId: (0, mysql_core_1.int)("staff_user_id").notNull(),
    managerApprovedBy: (0, mysql_core_1.int)("manager_approved_by"), // Optional manager override
    pointsSpent: (0, mysql_core_1.int)("points_spent").default(0).notNull(),
    status: (0, mysql_core_1.varchar)("status", { length: 20 }).default("redeemed"), // 'pending_approval', 'redeemed', 'cancelled'
    notes: (0, mysql_core_1.text)("notes"),
    redeemedAt: (0, mysql_core_1.timestamp)("redeemed_at").defaultNow(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow()
});
// 13. Promotions Table
exports.promotions = (0, mysql_core_1.mysqlTable)("promotions", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    title: (0, mysql_core_1.varchar)("title", { length: 100 }).notNull(),
    description: (0, mysql_core_1.text)("description").notNull(),
    audienceType: (0, mysql_core_1.varchar)("audience_type", { length: 50 }).default("all"), // 'all', 'rookie', 'boss', etc.
    startDate: (0, mysql_core_1.date)("start_date").notNull(),
    endDate: (0, mysql_core_1.date)("end_date").notNull(),
    active: (0, mysql_core_1.boolean)("active").default(true),
    featured: (0, mysql_core_1.boolean)("featured").default(false),
    imageUrl: (0, mysql_core_1.varchar)("image_url", { length: 255 }),
    linkedRewardId: (0, mysql_core_1.int)("linked_reward_id"),
    doublePoints: (0, mysql_core_1.boolean)("double_points").default(false),
    createdBy: (0, mysql_core_1.int)("created_by").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
}, (table) => {
    return {
        activeDateIdx: (0, mysql_core_1.index)("promo_active_date_idx").on(table.active, table.startDate, table.endDate)
    };
});
// 14. QR Tokens Table
exports.qrTokens = (0, mysql_core_1.mysqlTable)("qr_tokens", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    token: (0, mysql_core_1.varchar)("token", { length: 100 }).notNull().unique(),
    tokenType: (0, mysql_core_1.varchar)("token_type", { length: 20 }).default("customer"), // 'customer', 'join', 'claim'
    customerId: (0, mysql_core_1.int)("customer_id").notNull(),
    loyaltyAccountId: (0, mysql_core_1.int)("loyalty_account_id").notNull(),
    expiresAt: (0, mysql_core_1.datetime)("expires_at").notNull(),
    revokedAt: (0, mysql_core_1.datetime)("revoked_at"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow()
});
// 15. Receipt Claims Table
exports.receiptClaims = (0, mysql_core_1.mysqlTable)("receipt_claims", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    receiptNumber: (0, mysql_core_1.varchar)("receipt_number", { length: 100 }).notNull(),
    customerId: (0, mysql_core_1.int)("customer_id"), // Optional if customer was not signed up at claim time
    claimantName: (0, mysql_core_1.varchar)("claimant_name", { length: 100 }).notNull(),
    claimantEmail: (0, mysql_core_1.varchar)("claimant_email", { length: 100 }),
    claimantPhone: (0, mysql_core_1.varchar)("claimant_phone", { length: 20 }),
    purchaseDate: (0, mysql_core_1.date)("purchase_date").notNull(),
    purchaseTotal: (0, mysql_core_1.decimal)("purchase_total", { precision: 10, scale: 2 }).notNull(),
    status: (0, mysql_core_1.varchar)("status", { length: 20 }).default("PENDING").notNull(), // 'PENDING', 'APPROVED', 'REJECTED', 'FLAGGED', 'ALREADY_CLAIMED'
    source: (0, mysql_core_1.varchar)("source", { length: 20 }).default("web").notNull(), // 'web', 'tablet'
    reviewedBy: (0, mysql_core_1.int)("reviewed_by"),
    reviewNotes: (0, mysql_core_1.text)("review_notes"),
    approvedAt: (0, mysql_core_1.datetime)("approved_at"),
    rejectedAt: (0, mysql_core_1.datetime)("rejected_at"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
}, (table) => {
    return {
        statusIdx: (0, mysql_core_1.index)("claim_status_idx").on(table.status),
        receiptNumIdx: (0, mysql_core_1.index)("claim_receipt_num_idx").on(table.receiptNumber)
    };
});
// 16. Loyverse Customers Table
exports.loyverseCustomers = (0, mysql_core_1.mysqlTable)("loyverse_customers", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    localCustomerId: (0, mysql_core_1.int)("local_customer_id").notNull().unique(),
    loyverseCustomerId: (0, mysql_core_1.varchar)("loyverse_customer_id", { length: 100 }).notNull().unique(),
    email: (0, mysql_core_1.varchar)("email", { length: 100 }),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }),
    barcode: (0, mysql_core_1.varchar)("barcode", { length: 50 }),
    rawJson: (0, mysql_core_1.text)("raw_json"),
    lastSyncedAt: (0, mysql_core_1.datetime)("last_synced_at"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
}, (table) => {
    return {
        loyverseIdIdx: (0, mysql_core_1.uniqueIndex)("loyverse_cust_id_idx").on(table.loyverseCustomerId)
    };
});
// 17. Loyverse Receipts Table
exports.loyverseReceipts = (0, mysql_core_1.mysqlTable)("loyverse_receipts", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    loyverseReceiptId: (0, mysql_core_1.varchar)("loyverse_receipt_id", { length: 100 }).notNull().unique(),
    localCustomerId: (0, mysql_core_1.int)("local_customer_id"),
    receiptNumber: (0, mysql_core_1.varchar)("receipt_number", { length: 100 }).notNull(),
    total: (0, mysql_core_1.decimal)("total", { precision: 10, scale: 2 }).notNull(),
    receiptDate: (0, mysql_core_1.datetime)("receipt_date").notNull(),
    status: (0, mysql_core_1.varchar)("status", { length: 20 }).notNull(), // 'synced', 'unmatched', 'flagged'
    rawJson: (0, mysql_core_1.text)("raw_json"),
    lastSyncedAt: (0, mysql_core_1.datetime)("last_synced_at"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
}, (table) => {
    return {
        loyverseReceiptIdx: (0, mysql_core_1.uniqueIndex)("loyverse_rcpt_id_idx").on(table.loyverseReceiptId)
    };
});
// 18. Integration Logs Table
exports.integrationLogs = (0, mysql_core_1.mysqlTable)("integration_logs", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    integrationName: (0, mysql_core_1.varchar)("integration_name", { length: 50 }).notNull(), // 'loyverse'
    action: (0, mysql_core_1.varchar)("action", { length: 100 }).notNull(), // 'sync_customers', 'sync_receipts'
    status: (0, mysql_core_1.varchar)("status", { length: 20 }).notNull(), // 'success', 'failed'
    message: (0, mysql_core_1.text)("message"),
    rawError: (0, mysql_core_1.text)("raw_error"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow()
});
// 19. Audit Logs Table
exports.auditLogs = (0, mysql_core_1.mysqlTable)("audit_logs", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    actorUserId: (0, mysql_core_1.int)("actor_user_id"), // Can be NULL (e.g. self sign up)
    actorRole: (0, mysql_core_1.varchar)("actor_role", { length: 30 }),
    customerId: (0, mysql_core_1.int)("customer_id"),
    action: (0, mysql_core_1.varchar)("action", { length: 50 }).notNull(),
    oldValue: (0, mysql_core_1.text)("old_value"),
    newValue: (0, mysql_core_1.text)("new_value"),
    pointsChange: (0, mysql_core_1.int)("points_change"),
    rewardId: (0, mysql_core_1.int)("reward_id"),
    receiptClaimId: (0, mysql_core_1.int)("receipt_claim_id"),
    ipAddress: (0, mysql_core_1.varchar)("ip_address", { length: 45 }),
    userAgent: (0, mysql_core_1.varchar)("user_agent", { length: 255 }),
    reason: (0, mysql_core_1.text)("reason"),
    approvedBy: (0, mysql_core_1.int)("approved_by"), // Manager user ID
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow()
}, (table) => {
    return {
        actorDateIdx: (0, mysql_core_1.index)("audit_actor_date_idx").on(table.actorUserId, table.createdAt)
    };
});
// 20. Tablet Sessions Table
exports.tabletSessions = (0, mysql_core_1.mysqlTable)("tablet_sessions", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    staffUserId: (0, mysql_core_1.int)("staff_user_id").notNull(),
    deviceName: (0, mysql_core_1.varchar)("device_name", { length: 100 }).notNull(),
    deviceFingerprint: (0, mysql_core_1.varchar)("device_fingerprint", { length: 100 }).notNull(),
    active: (0, mysql_core_1.boolean)("active").default(true),
    lastSeenAt: (0, mysql_core_1.timestamp)("last_seen_at").defaultNow(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow()
});
// 21. Settings Table
exports.settings = (0, mysql_core_1.mysqlTable)("settings", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    key: (0, mysql_core_1.varchar)("key", { length: 100 }).notNull().unique(),
    value: (0, mysql_core_1.text)("value").notNull(),
    description: (0, mysql_core_1.text)("description"),
    updatedBy: (0, mysql_core_1.int)("updated_by"),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
});
// Define Relations
exports.staffUsersRelations = (0, drizzle_orm_1.relations)(exports.staffUsers, ({ one }) => ({
    role: one(exports.roles, {
        fields: [exports.staffUsers.roleId],
        references: [exports.roles.id]
    })
}));
exports.rolePermissionsRelations = (0, drizzle_orm_1.relations)(exports.rolePermissions, ({ one }) => ({
    role: one(exports.roles, {
        fields: [exports.rolePermissions.roleId],
        references: [exports.roles.id]
    }),
    permission: one(exports.permissions, {
        fields: [exports.rolePermissions.permissionId],
        references: [exports.permissions.id]
    })
}));
exports.customerRelations = (0, drizzle_orm_1.relations)(exports.customers, ({ one, many }) => ({
    loyaltyAccount: one(exports.loyaltyAccounts, {
        fields: [exports.customers.id],
        references: [exports.loyaltyAccounts.customerId]
    }),
    visits: many(exports.visits),
    purchases: many(exports.purchases),
    redemptions: many(exports.rewardRedemptions),
    receiptClaims: many(exports.receiptClaims)
}));
exports.loyaltyAccountRelations = (0, drizzle_orm_1.relations)(exports.loyaltyAccounts, ({ one, many }) => ({
    customer: one(exports.customers, {
        fields: [exports.loyaltyAccounts.customerId],
        references: [exports.customers.id]
    }),
    tier: one(exports.tiers, {
        fields: [exports.loyaltyAccounts.currentTierId],
        references: [exports.tiers.id]
    }),
    ledgerEntries: many(exports.pointsLedger)
}));
exports.visitsRelations = (0, drizzle_orm_1.relations)(exports.visits, ({ one }) => ({
    customer: one(exports.customers, {
        fields: [exports.visits.customerId],
        references: [exports.customers.id]
    }),
    loyaltyAccount: one(exports.loyaltyAccounts, {
        fields: [exports.visits.loyaltyAccountId],
        references: [exports.loyaltyAccounts.id]
    }),
    staffUser: one(exports.staffUsers, {
        fields: [exports.visits.staffUserId],
        references: [exports.staffUsers.id]
    }),
    approvedBy: one(exports.staffUsers, {
        fields: [exports.visits.managerApprovedBy],
        references: [exports.staffUsers.id]
    })
}));
exports.purchasesRelations = (0, drizzle_orm_1.relations)(exports.purchases, ({ one }) => ({
    customer: one(exports.customers, {
        fields: [exports.purchases.customerId],
        references: [exports.customers.id]
    }),
    loyaltyAccount: one(exports.loyaltyAccounts, {
        fields: [exports.purchases.loyaltyAccountId],
        references: [exports.loyaltyAccounts.id]
    }),
    staffUser: one(exports.staffUsers, {
        fields: [exports.purchases.staffUserId],
        references: [exports.staffUsers.id]
    })
}));
exports.rewardRedemptionsRelations = (0, drizzle_orm_1.relations)(exports.rewardRedemptions, ({ one }) => ({
    customer: one(exports.customers, {
        fields: [exports.rewardRedemptions.customerId],
        references: [exports.customers.id]
    }),
    reward: one(exports.rewards, {
        fields: [exports.rewardRedemptions.rewardId],
        references: [exports.rewards.id]
    }),
    staffUser: one(exports.staffUsers, {
        fields: [exports.rewardRedemptions.staffUserId],
        references: [exports.staffUsers.id]
    }),
    approvedBy: one(exports.staffUsers, {
        fields: [exports.rewardRedemptions.managerApprovedBy],
        references: [exports.staffUsers.id]
    })
}));
// 22. Authorized Devices Table
exports.authorizedDevices = (0, mysql_core_1.mysqlTable)("authorized_devices", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    deviceName: (0, mysql_core_1.varchar)("device_name", { length: 100 }).notNull(),
    deviceFingerprint: (0, mysql_core_1.varchar)("device_fingerprint", { length: 100 }).notNull().unique(),
    status: (0, mysql_core_1.varchar)("status", { length: 20 }).default("pending").notNull(), // 'pending', 'approved', 'rejected'
    deviceType: (0, mysql_core_1.varchar)("device_type", { length: 50 }),
    operatingSystem: (0, mysql_core_1.varchar)("operating_system", { length: 50 }),
    browserName: (0, mysql_core_1.varchar)("browser_name", { length: 50 }),
    latitude: (0, mysql_core_1.decimal)("latitude", { precision: 10, scale: 8 }),
    longitude: (0, mysql_core_1.decimal)("longitude", { precision: 11, scale: 8 }),
    lastIp: (0, mysql_core_1.varchar)("last_ip", { length: 45 }),
    userAgent: (0, mysql_core_1.varchar)("user_agent", { length: 255 }),
    allowRemote: (0, mysql_core_1.boolean)("allow_remote").default(false).notNull(),
    approvedBy: (0, mysql_core_1.int)("approved_by"),
    approvedAt: (0, mysql_core_1.timestamp)("approved_at"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow()
}, (table) => {
    return {
        fingerprintIdx: (0, mysql_core_1.uniqueIndex)("device_fingerprint_idx").on(table.deviceFingerprint)
    };
});
exports.authorizedDevicesRelations = (0, drizzle_orm_1.relations)(exports.authorizedDevices, ({ one }) => ({
    approvedByUser: one(exports.staffUsers, {
        fields: [exports.authorizedDevices.approvedBy],
        references: [exports.staffUsers.id]
    })
}));
