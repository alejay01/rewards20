import { 
  mysqlTable, 
  serial, 
  varchar, 
  text, 
  int, 
  boolean, 
  timestamp, 
  decimal, 
  date, 
  datetime,
  index,
  uniqueIndex
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// 1. Roles Table
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});

// 2. Permissions Table
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  description: text("description")
});

// 3. Role Permissions Table
export const rolePermissions = mysqlTable("role_permissions", {
  roleId: int("role_id").notNull(),
  permissionId: int("permission_id").notNull(),
}, (table) => {
  return {
    pk: index("role_permission_idx").on(table.roleId, table.permissionId)
  };
});

// 4. Staff Users Table
export const staffUsers = mysqlTable("staff_users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  pinHash: varchar("pin_hash", { length: 255 }), // Hash of 4-digit PIN for quick counter tablet actions
  roleId: int("role_id").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});

// 5. Customers Table
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("public_id", { length: 36 }).notNull().unique(), // UUID for external routing
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }).unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  birthday: date("birthday"),
  favoriteCategory: varchar("favorite_category", { length: 50 }),
  consentPromotions: boolean("consent_promotions").default(false),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => {
  return {
    emailIdx: uniqueIndex("customer_email_idx").on(table.email),
    phoneIdx: uniqueIndex("customer_phone_idx").on(table.phone),
    publicIdIdx: uniqueIndex("customer_public_id_idx").on(table.publicId)
  };
});

// 6. Loyalty Accounts Table
export const loyaltyAccounts = mysqlTable("loyalty_accounts", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").notNull().unique(),
  rewardsNumber: varchar("rewards_number", { length: 50 }).notNull().unique(),
  publicQrToken: varchar("public_qr_token", { length: 100 }).notNull().unique(), // QR specific token
  barcodeValue: varchar("barcode_value", { length: 50 }).unique(),
  pointsBalance: int("points_balance").default(0).notNull(),
  lifetimePoints: int("lifetime_points").default(0).notNull(),
  totalVisits: int("total_visits").default(0).notNull(),
  lifetimeSpend: decimal("lifetime_spend", { precision: 10, scale: 2 }).default("0.00").notNull(),
  currentTierId: int("current_tier_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => {
  return {
    publicQrIdx: uniqueIndex("loyalty_qr_token_idx").on(table.publicQrToken),
    rewardsNumIdx: uniqueIndex("loyalty_rewards_num_idx").on(table.rewardsNumber),
    barcodeIdx: uniqueIndex("loyalty_barcode_idx").on(table.barcodeValue)
  };
});

// 7. Tiers Table
export const tiers = mysqlTable("tiers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  visitsRequired: int("visits_required").default(0).notNull(),
  spendRequired: decimal("spend_required", { precision: 10, scale: 2 }).default("0.00").notNull(),
  pointsRequired: int("points_required").default(0).notNull(),
  badgeImage: varchar("badge_image", { length: 255 }).notNull(),
  unlockMessage: text("unlock_message"),
  sortOrder: int("sort_order").default(0).notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});

// 8. Visits Table
export const visits = mysqlTable("visits", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").notNull(),
  loyaltyAccountId: int("loyalty_account_id").notNull(),
  staffUserId: int("staff_user_id"), // NULL if customer claimed or automatic
  source: varchar("source", { length: 20 }).notNull(), // 'tablet', 'receipt_claim', 'admin'
  visitDate: date("visit_date").notNull(),
  pointsAwarded: int("points_awarded").default(0).notNull(),
  duplicateOverride: boolean("duplicate_override").default(false),
  managerApprovedBy: int("manager_approved_by"), // Staff user ID who approved override
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// 9. Purchases Table
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").notNull(),
  loyaltyAccountId: int("loyalty_account_id").notNull(),
  staffUserId: int("staff_user_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  pointsAwarded: int("points_awarded").notNull(),
  source: varchar("source", { length: 20 }).notNull(), // 'tablet', 'receipt_claim', 'loyverse'
  receiptNumber: varchar("receipt_number", { length: 100 }),
  loyverseReceiptId: varchar("loyverse_receipt_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    receiptNumIdx: index("purchase_receipt_idx").on(table.receiptNumber),
    loyverseReceiptIdx: index("purchase_loyverse_receipt_idx").on(table.loyverseReceiptId)
  };
});

// 10. Points Ledger Table
export const pointsLedger = mysqlTable("points_ledger", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").notNull(),
  loyaltyAccountId: int("loyalty_account_id").notNull(),
  staffUserId: int("staff_user_id"), // Optional
  type: varchar("type", { length: 30 }).notNull(), // 'earn_visit', 'earn_spend', 'earn_promo', 'redeem', 'manual_add', 'manual_subtract'
  pointsChange: int("points_change").notNull(),
  balanceAfter: int("balance_after").notNull(),
  reason: text("reason"),
  source: varchar("source", { length: 20 }).notNull(), // 'tablet', 'receipt_claim', 'admin', 'system'
  relatedVisitId: int("related_visit_id"),
  relatedPurchaseId: int("related_purchase_id"),
  relatedRedemptionId: int("related_redemption_id"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    customerDateIdx: index("ledger_cust_date_idx").on(table.customerId, table.createdAt)
  };
});

// 11. Rewards Table
export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  rewardType: varchar("reward_type", { length: 20 }).notNull(), // 'visit', 'spend', 'points', 'birthday', 'tier', 'manual'
  pointsRequired: int("points_required").default(0).notNull(),
  visitsRequired: int("visits_required").default(0).notNull(),
  spendRequired: decimal("spend_required", { precision: 10, scale: 2 }).default("0.00").notNull(),
  tierRequiredId: int("tier_required_id"), // Minimum tier required
  highValue: boolean("high_value").default(false),
  managerApprovalRequired: boolean("manager_approval_required").default(false),
  active: boolean("active").default(true),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});

// 12. Reward Redemptions Table
export const rewardRedemptions = mysqlTable("reward_redemptions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").notNull(),
  loyaltyAccountId: int("loyalty_account_id").notNull(),
  rewardId: int("reward_id").notNull(),
  staffUserId: int("staff_user_id").notNull(),
  managerApprovedBy: int("manager_approved_by"), // Optional manager override
  pointsSpent: int("points_spent").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("redeemed"), // 'pending_approval', 'redeemed', 'cancelled'
  notes: text("notes"),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// 13. Promotions Table
export const promotions = mysqlTable("promotions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  audienceType: varchar("audience_type", { length: 50 }).default("all"), // 'all', 'rookie', 'boss', etc.
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  active: boolean("active").default(true),
  featured: boolean("featured").default(false),
  imageUrl: varchar("image_url", { length: 255 }),
  linkedRewardId: int("linked_reward_id"),
  doublePoints: boolean("double_points").default(false),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => {
  return {
    activeDateIdx: index("promo_active_date_idx").on(table.active, table.startDate, table.endDate)
  };
});

// 14. QR Tokens Table
export const qrTokens = mysqlTable("qr_tokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 100 }).notNull().unique(),
  tokenType: varchar("token_type", { length: 20 }).default("customer"), // 'customer', 'join', 'claim'
  customerId: int("customer_id").notNull(),
  loyaltyAccountId: int("loyalty_account_id").notNull(),
  expiresAt: datetime("expires_at").notNull(),
  revokedAt: datetime("revoked_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// 15. Receipt Claims Table
export const receiptClaims = mysqlTable("receipt_claims", {
  id: int("id").autoincrement().primaryKey(),
  receiptNumber: varchar("receipt_number", { length: 100 }).notNull(),
  customerId: int("customer_id"), // Optional if customer was not signed up at claim time
  claimantName: varchar("claimant_name", { length: 100 }).notNull(),
  claimantEmail: varchar("claimant_email", { length: 100 }),
  claimantPhone: varchar("claimant_phone", { length: 20 }),
  purchaseDate: date("purchase_date").notNull(),
  purchaseTotal: decimal("purchase_total", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // 'PENDING', 'APPROVED', 'REJECTED', 'FLAGGED', 'ALREADY_CLAIMED'
  source: varchar("source", { length: 20 }).default("web").notNull(), // 'web', 'tablet'
  reviewedBy: int("reviewed_by"),
  reviewNotes: text("review_notes"),
  approvedAt: datetime("approved_at"),
  rejectedAt: datetime("rejected_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => {
  return {
    statusIdx: index("claim_status_idx").on(table.status),
    receiptNumIdx: index("claim_receipt_num_idx").on(table.receiptNumber)
  };
});

// 16. Loyverse Customers Table
export const loyverseCustomers = mysqlTable("loyverse_customers", {
  id: int("id").autoincrement().primaryKey(),
  localCustomerId: int("local_customer_id").notNull().unique(),
  loyverseCustomerId: varchar("loyverse_customer_id", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  barcode: varchar("barcode", { length: 50 }),
  rawJson: text("raw_json"),
  lastSyncedAt: datetime("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => {
  return {
    loyverseIdIdx: uniqueIndex("loyverse_cust_id_idx").on(table.loyverseCustomerId)
  };
});

// 17. Loyverse Receipts Table
export const loyverseReceipts = mysqlTable("loyverse_receipts", {
  id: int("id").autoincrement().primaryKey(),
  loyverseReceiptId: varchar("loyverse_receipt_id", { length: 100 }).notNull().unique(),
  localCustomerId: int("local_customer_id"),
  receiptNumber: varchar("receipt_number", { length: 100 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  receiptDate: datetime("receipt_date").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'synced', 'unmatched', 'flagged'
  rawJson: text("raw_json"),
  lastSyncedAt: datetime("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => {
  return {
    loyverseReceiptIdx: uniqueIndex("loyverse_rcpt_id_idx").on(table.loyverseReceiptId)
  };
});

// 18. Integration Logs Table
export const integrationLogs = mysqlTable("integration_logs", {
  id: int("id").autoincrement().primaryKey(),
  integrationName: varchar("integration_name", { length: 50 }).notNull(), // 'loyverse'
  action: varchar("action", { length: 100 }).notNull(), // 'sync_customers', 'sync_receipts'
  status: varchar("status", { length: 20 }).notNull(), // 'success', 'failed'
  message: text("message"),
  rawError: text("raw_error"),
  createdAt: timestamp("created_at").defaultNow()
});

// 19. Audit Logs Table
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actor_user_id"), // Can be NULL (e.g. self sign up)
  actorRole: varchar("actor_role", { length: 30 }),
  customerId: int("customer_id"),
  action: varchar("action", { length: 50 }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  pointsChange: int("points_change"),
  rewardId: int("reward_id"),
  receiptClaimId: int("receipt_claim_id"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 255 }),
  reason: text("reason"),
  approvedBy: int("approved_by"), // Manager user ID
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    actorDateIdx: index("audit_actor_date_idx").on(table.actorUserId, table.createdAt)
  };
});

// 20. Tablet Sessions Table
export const tabletSessions = mysqlTable("tablet_sessions", {
  id: int("id").autoincrement().primaryKey(),
  staffUserId: int("staff_user_id").notNull(),
  deviceName: varchar("device_name", { length: 100 }).notNull(),
  deviceFingerprint: varchar("device_fingerprint", { length: 100 }).notNull(),
  active: boolean("active").default(true),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// 21. Settings Table
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: int("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});

// Define Relations
export const staffUsersRelations = relations(staffUsers, ({ one }) => ({
  role: one(roles, {
    fields: [staffUsers.roleId],
    references: [roles.id]
  })
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id]
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id]
  })
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  loyaltyAccount: one(loyaltyAccounts, {
    fields: [customers.id],
    references: [loyaltyAccounts.customerId]
  }),
  visits: many(visits),
  purchases: many(purchases),
  redemptions: many(rewardRedemptions),
  receiptClaims: many(receiptClaims)
}));

export const loyaltyAccountRelations = relations(loyaltyAccounts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [loyaltyAccounts.customerId],
    references: [customers.id]
  }),
  tier: one(tiers, {
    fields: [loyaltyAccounts.currentTierId],
    references: [tiers.id]
  }),
  ledgerEntries: many(pointsLedger)
}));

export const visitsRelations = relations(visits, ({ one }) => ({
  customer: one(customers, {
    fields: [visits.customerId],
    references: [customers.id]
  }),
  loyaltyAccount: one(loyaltyAccounts, {
    fields: [visits.loyaltyAccountId],
    references: [loyaltyAccounts.id]
  }),
  staffUser: one(staffUsers, {
    fields: [visits.staffUserId],
    references: [staffUsers.id]
  }),
  approvedBy: one(staffUsers, {
    fields: [visits.managerApprovedBy],
    references: [staffUsers.id]
  })
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  customer: one(customers, {
    fields: [purchases.customerId],
    references: [customers.id]
  }),
  loyaltyAccount: one(loyaltyAccounts, {
    fields: [purchases.loyaltyAccountId],
    references: [loyaltyAccounts.id]
  }),
  staffUser: one(staffUsers, {
    fields: [purchases.staffUserId],
    references: [staffUsers.id]
  })
}));

export const rewardRedemptionsRelations = relations(rewardRedemptions, ({ one }) => ({
  customer: one(customers, {
    fields: [rewardRedemptions.customerId],
    references: [customers.id]
  }),
  reward: one(rewards, {
    fields: [rewardRedemptions.rewardId],
    references: [rewards.id]
  }),
  staffUser: one(staffUsers, {
    fields: [rewardRedemptions.staffUserId],
    references: [staffUsers.id]
  }),
  approvedBy: one(staffUsers, {
    fields: [rewardRedemptions.managerApprovedBy],
    references: [staffUsers.id]
  })
}));
