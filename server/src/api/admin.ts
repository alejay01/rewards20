import { Router, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "../db";
import { 
  customers, 
  loyaltyAccounts, 
  tiers, 
  rewards, 
  rewardRedemptions, 
  pointsLedger, 
  visits, 
  purchases, 
  promotions, 
  receiptClaims, 
  loyverseCustomers, 
  loyverseReceipts, 
  integrationLogs, 
  auditLogs, 
  staffUsers, 
  settings 
} from "../db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { AuthenticatedRequest, authenticateToken, requireRole, requirePermission } from "../middleware/auth";
import { logAudit } from "../utils/audit";
import { loyverseClient } from "../integrations/loyverse/loyverseClient";
import { updateCustomerTier } from "./tablet";
import { z } from "zod";

const router = Router();

// Helper: Pull general system settings as key-value map
const getSystemSettings = async (): Promise<Record<string, string>> => {
  const dbSettings = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const s of dbSettings) {
    map[s.key] = s.value;
  }
  return map;
};

// 1. Admin Dashboard Overview Metrics
router.get("/overview", authenticateToken, requirePermission("view_analytics"), async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekAgoStr = oneWeekAgo.toISOString().split("T")[0];

    // Counts
    const membersCount = await db.select({ count: sql<number>`count(*)` }).from(customers);
    const newMembersToday = await db.select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(sql`DATE(created_at) = DATE(${todayStr})`);
    
    const newMembersThisWeek = await db.select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(sql`created_at >= ${weekAgoStr}`);

    const visitsCount = await db.select({ count: sql<number>`count(*)` }).from(visits);
    
    const pointsQuery = await db.select({ sum: sql<number>`sum(points_change)` })
      .from(pointsLedger)
      .where(sql`points_change > 0`);
    
    const redemptionsCount = await db.select({ count: sql<number>`count(*)` }).from(rewardRedemptions);

    // Sum Spend
    const spendQuery = await db.select({ sum: sql<number>`sum(amount)` }).from(purchases);

    // Unmatched receipt claims count
    const pendingClaims = await db.select({ count: sql<number>`count(*)` })
      .from(receiptClaims)
      .where(eq(receiptClaims.status, "PENDING"));

    // Suspicious activity (duplicate claim numbers or flagged statuses)
    const suspiciousClaims = await db.select({ count: sql<number>`count(*)` })
      .from(receiptClaims)
      .where(or(eq(receiptClaims.status, "FLAGGED"), eq(receiptClaims.status, "ALREADY_CLAIMED")));

    // Top Customers
    const topCustomersList = await db.select({
      id: customers.id,
      name: sql<string>`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
      email: customers.email,
      pointsBalance: loyaltyAccounts.pointsBalance,
      lifetimePoints: loyaltyAccounts.lifetimePoints,
      totalVisits: loyaltyAccounts.totalVisits,
      lifetimeSpend: loyaltyAccounts.lifetimeSpend
    })
    .from(customers)
    .innerJoin(loyaltyAccounts, eq(customers.id, loyaltyAccounts.customerId))
    .orderBy(desc(loyaltyAccounts.pointsBalance))
    .limit(5);

    // Most Popular Rewards
    const popularRewardsList = await db.select({
      rewardName: rewards.name,
      count: sql<number>`count(*)`
    })
    .from(rewardRedemptions)
    .innerJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
    .groupBy(rewards.name)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

    return res.json({
      metrics: {
        totalMembers: membersCount[0]?.count || 0,
        newMembersToday: newMembersToday[0]?.count || 0,
        newMembersThisWeek: newMembersThisWeek[0]?.count || 0,
        totalVisits: visitsCount[0]?.count || 0,
        totalPointsIssued: pointsQuery[0]?.sum || 0,
        totalRedemptions: redemptionsCount[0]?.count || 0,
        totalLifetimeSpend: spendQuery[0]?.sum || 0,
        pendingClaims: pendingClaims[0]?.count || 0,
        suspiciousCount: suspiciousClaims[0]?.count || 0
      },
      topCustomers: topCustomersList,
      popularRewards: popularRewardsList
    });
  } catch (error) {
    next(error);
  }
});

// 2. Customer Management: List & Search
router.get("/customers", authenticateToken, async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = db.select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      status: customers.status,
      createdAt: customers.createdAt,
      pointsBalance: loyaltyAccounts.pointsBalance,
      totalVisits: loyaltyAccounts.totalVisits,
      rewardsNumber: loyaltyAccounts.rewardsNumber,
      publicQrToken: loyaltyAccounts.publicQrToken,
      tierName: tiers.name
    })
    .from(customers)
    .innerJoin(loyaltyAccounts, eq(customers.id, loyaltyAccounts.customerId))
    .innerJoin(tiers, eq(loyaltyAccounts.currentTierId, tiers.id));

    if (search) {
      const searchStr = `%${search}%`;
      query = query.where(
        or(
          like(customers.firstName, searchStr),
          like(customers.lastName, searchStr),
          like(customers.email, searchStr),
          like(customers.phone, searchStr),
          like(loyaltyAccounts.rewardsNumber, searchStr)
        )
      ) as any;
    }

    const list = await query.orderBy(desc(customers.createdAt));
    return res.json(list);
  } catch (error) {
    next(error);
  }
});

// 2.5. Customer Management: Create Customer
router.post("/customers", authenticateToken, requirePermission("manage_staff"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const schema = z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional().or(z.literal("")),
      birthday: z.string().optional().or(z.literal("")),
      favoriteCategory: z.string().optional().or(z.literal("")),
      consentPromotions: z.boolean().default(false),
      startingPoints: z.number().default(0)
    }).refine(data => data.email || data.phone, {
      message: "Either Email or Phone Number must be provided.",
      path: ["email"]
    });

    const data = schema.parse(req.body);

    // Check unique email
    if (data.email) {
      const existing = await db.select().from(customers).where(eq(customers.email, data.email));
      if (existing.length > 0) {
        return res.status(400).json({ error: "A customer with this email already exists." });
      }
    }

    // Check unique phone
    if (data.phone) {
      const existing = await db.select().from(customers).where(eq(customers.phone, data.phone));
      if (existing.length > 0) {
        return res.status(400).json({ error: "A customer with this phone number already exists." });
      }
    }

    const publicId = crypto.randomUUID();
    const rewardsNumber = "BCR-" + Math.floor(100000 + Math.random() * 900000);
    const publicQrToken = crypto.randomBytes(32).toString("hex");

    // Fetch Rookie Roller tier ID
    const dbTiers = await db.select().from(tiers).where(eq(tiers.name, "Rookie Roller"));
    const rookieTierId = dbTiers[0]?.id || 1;

    // Create customer profile
    await db.insert(customers).values({
      publicId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      birthday: data.birthday ? new Date(data.birthday) : null,
      favoriteCategory: data.favoriteCategory || null,
      consentPromotions: data.consentPromotions,
      status: "active"
    });

    const newCustomers = await db.select().from(customers).where(eq(customers.publicId, publicId));
    const customer = newCustomers[0];

    // Create loyalty account with starting points
    await db.insert(loyaltyAccounts).values({
      customerId: customer.id,
      rewardsNumber,
      publicQrToken,
      barcodeValue: `BAR-${rewardsNumber}`,
      pointsBalance: data.startingPoints,
      lifetimePoints: data.startingPoints,
      totalVisits: data.startingPoints > 0 ? 1 : 0,
      lifetimeSpend: "0.00",
      currentTierId: rookieTierId
    });

    // If starting points > 0, log a manual adjustment in ledger
    if (data.startingPoints > 0) {
      const loyalty = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, customer.id));
      await db.insert(pointsLedger).values({
        customerId: customer.id,
        loyaltyAccountId: loyalty[0].id,
        staffUserId: req.user?.id || null,
        type: "manual_add",
        pointsChange: data.startingPoints,
        balanceAfter: data.startingPoints,
        reason: "Initial starting points allocated by administrator.",
        source: "admin"
      });
    }

    // Log to audits
    await logAudit(req, {
      action: "CUSTOMER_CREATED",
      reason: `Admin created loyalty customer: ${data.firstName} ${data.lastName} (Card: ${rewardsNumber})`
    });

    return res.status(201).json({
      success: true,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        rewardsNumber
      }
    });
  } catch (error) {
    next(error);
  }
});

// 3. Customer Detail
router.get("/customers/:id", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const custId = parseInt(id);

    const custList = await db.select().from(customers).where(eq(customers.id, custId));
    if (custList.length === 0) return res.status(404).json({ error: "Customer not found." });
    
    const loyaltyList = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, custId));
    const loyalty = loyaltyList[0];

    const currentTier = await db.select().from(tiers).where(eq(tiers.id, loyalty.currentTierId));

    // Pull ledger logs
    const ledger = await db.select().from(pointsLedger).where(eq(pointsLedger.customerId, custId)).orderBy(desc(pointsLedger.createdAt)).limit(10);
    const cVisits = await db.select().from(visits).where(eq(visits.customerId, custId)).orderBy(desc(visits.createdAt)).limit(10);
    const cPurchases = await db.select().from(purchases).where(eq(purchases.customerId, custId)).orderBy(desc(purchases.createdAt)).limit(10);
    const cClaims = await db.select().from(receiptClaims).where(eq(receiptClaims.customerId, custId)).orderBy(desc(receiptClaims.createdAt));

    // Audit logs for this customer
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.customerId, custId)).orderBy(desc(auditLogs.createdAt)).limit(10);

    return res.json({
      customer: custList[0],
      loyalty: {
        ...loyalty,
        tierName: currentTier[0]?.name || "Rookie Roller"
      },
      ledger,
      visits: cVisits,
      purchases: cPurchases,
      claims: cClaims,
      auditLogs: logs
    });
  } catch (error) {
    next(error);
  }
});

// 4. Update Customer Profile
router.patch("/customers/:id", authenticateToken, requirePermission("full_access"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, status } = req.body;

    await db.update(customers)
      .set({ firstName, lastName, email, phone, status })
      .where(eq(customers.id, parseInt(id)));

    await logAudit(req, {
      customerId: parseInt(id),
      action: "CUSTOMER_UPDATED",
      reason: `Admin updated customer profile settings: status set to '${status}'`
    });

    return res.json({ success: true, message: "Customer profile updated." });
  } catch (error) {
    next(error);
  }
});

// 5. Manual Points Adjustments (Add / Subtract)
router.post("/customers/:id/add-points", authenticateToken, requirePermission("add_points"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { points, reason } = req.body;

    const pointsNum = parseInt(points);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      return res.status(400).json({ error: "Invalid points amount." });
    }

    if (!reason) {
      return res.status(400).json({ error: "A detailed reason is required for manual point adjustments." });
    }

    const custId = parseInt(id);
    const accounts = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, custId));
    if (accounts.length === 0) return res.status(404).json({ error: "Account not found." });
    const loyalty = accounts[0];

    // Shift limit validation for Team Members
    if (req.user?.role === "Team Member") {
      const shiftLimitSetting = await db.select().from(settings).where(eq(settings.key, "max_manual_points_per_team_shift"));
      const limit = parseInt(shiftLimitSetting[0]?.value || "100");

      // Count what they've added today
      const today = new Date().toISOString().split("T")[0];
      const addedToday = await db.select({ sum: sql<number>`sum(points_change)` })
        .from(pointsLedger)
        .where(
          and(
            eq(pointsLedger.staffUserId, req.user.id),
            eq(pointsLedger.type, "manual_add"),
            sql`DATE(created_at) = DATE(${today})`
          )
        );

      const totalAdded = (addedToday[0]?.sum || 0) + pointsNum;
      if (totalAdded > limit) {
        return res.status(403).json({
          error: "LIMIT_EXCEEDED",
          message: `Manual additions exceed your shift adjustment limit of ${limit} points. Current Shift: ${addedToday[0]?.sum || 0} pts.`
        });
      }
    }

    const newBalance = loyalty.pointsBalance + pointsNum;
    const newLifetime = loyalty.lifetimePoints + pointsNum;

    await db.update(loyaltyAccounts)
      .set({ pointsBalance: newBalance, lifetimePoints: newLifetime })
      .where(eq(loyaltyAccounts.id, loyalty.id));

    await db.insert(pointsLedger).values({
      customerId: custId,
      loyaltyAccountId: loyalty.id,
      staffUserId: req.user?.id || null,
      type: "manual_add",
      pointsChange: pointsNum,
      balanceAfter: newBalance,
      reason,
      source: "admin"
    });

    // Recalculate tier
    await updateCustomerTier(custId);

    await logAudit(req, {
      customerId: custId,
      action: "POINTS_ADDED",
      pointsChange: pointsNum,
      reason: `Manually added points. Reason: ${reason}`
    });

    return res.json({ success: true, newPointsBalance: newBalance });
  } catch (error) {
    next(error);
  }
});

router.post("/customers/:id/subtract-points", authenticateToken, requirePermission("subtract_points"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { points, reason } = req.body;

    const pointsNum = parseInt(points);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      return res.status(400).json({ error: "Invalid points amount." });
    }

    if (!reason) {
      return res.status(400).json({ error: "A detailed reason is required for manual point adjustments." });
    }

    const custId = parseInt(id);
    const accounts = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, custId));
    if (accounts.length === 0) return res.status(404).json({ error: "Account not found." });
    const loyalty = accounts[0];

    if (loyalty.pointsBalance < pointsNum) {
      return res.status(400).json({ error: "Cannot subtract more points than customer currently possesses." });
    }

    const newBalance = loyalty.pointsBalance - pointsNum;

    await db.update(loyaltyAccounts)
      .set({ pointsBalance: newBalance })
      .where(eq(loyaltyAccounts.id, loyalty.id));

    await db.insert(pointsLedger).values({
      customerId: custId,
      loyaltyAccountId: loyalty.id,
      staffUserId: req.user?.id || null,
      type: "manual_subtract",
      pointsChange: -pointsNum,
      balanceAfter: newBalance,
      reason,
      source: "admin"
    });

    await logAudit(req, {
      customerId: custId,
      action: "POINTS_SUBTRACTED",
      pointsChange: -pointsNum,
      reason: `Manually deducted points. Reason: ${reason}`
    });

    return res.json({ success: true, newPointsBalance: newBalance });
  } catch (error) {
    next(error);
  }
});

// 6. Admin Manual Log Visit
router.post("/customers/:id/add-visit", authenticateToken, requirePermission("add_points"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const custId = parseInt(req.params.id);
    const { notes } = req.body;

    const accounts = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, custId));
    if (accounts.length === 0) return res.status(404).json({ error: "Account not found." });
    const loyalty = accounts[0];

    const checkinPoints = 10;
    
    await db.insert(visits).values({
      customerId: custId,
      loyaltyAccountId: loyalty.id,
      staffUserId: req.user?.id || null,
      source: "admin",
      visitDate: new Date(),
      pointsAwarded: checkinPoints,
      notes: notes || "Manual check-in logged by administrator"
    });

    const newBalance = loyalty.pointsBalance + checkinPoints;
    const newLifetime = loyalty.lifetimePoints + checkinPoints;
    const newTotalVisits = loyalty.totalVisits + 1;

    await db.update(loyaltyAccounts)
      .set({ pointsBalance: newBalance, lifetimePoints: newLifetime, totalVisits: newTotalVisits })
      .where(eq(loyaltyAccounts.id, loyalty.id));

    // Ledger
    await db.insert(pointsLedger).values({
      customerId: custId,
      loyaltyAccountId: loyalty.id,
      staffUserId: req.user?.id || null,
      type: "earn_visit",
      pointsChange: checkinPoints,
      balanceAfter: newBalance,
      reason: "Manual store check-in credited by admin",
      source: "admin"
    });

    await updateCustomerTier(custId);

    await logAudit(req, {
      customerId: custId,
      action: "VISIT_ADDED",
      pointsChange: checkinPoints,
      reason: "Logged store check-in."
    });

    return res.json({ success: true, newPointsBalance: newBalance });
  } catch (error) {
    next(error);
  }
});

// 7. Rewards CRUD
router.get("/rewards", authenticateToken, async (req, res, next) => {
  try {
    const list = await db.select().from(rewards).orderBy(desc(rewards.createdAt));
    return res.json(list);
  } catch (error) {
    next(error);
  }
});

router.post("/rewards", authenticateToken, requirePermission("manage_rewards"), async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      rewardType: z.string(),
      pointsRequired: z.number().default(0),
      visitsRequired: z.number().default(0),
      spendRequired: z.string().default("0.00"),
      highValue: z.boolean().default(false),
      managerApprovalRequired: z.boolean().default(false)
    });

    const data = schema.parse(req.body);
    await db.insert(rewards).values(data);

    await logAudit(req, {
      action: "REWARD_CHANGED",
      reason: `Created loyalty reward: ${data.name}`
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.patch("/rewards/:id", authenticateToken, requirePermission("manage_rewards"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const rId = parseInt(id);

    const schema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      rewardType: z.string().optional(),
      pointsRequired: z.number().optional(),
      visitsRequired: z.number().optional(),
      spendRequired: z.string().optional(),
      highValue: z.boolean().optional(),
      managerApprovalRequired: z.boolean().optional(),
      active: z.boolean().optional()
    });

    const data = schema.parse(req.body);
    await db.update(rewards).set(data).where(eq(rewards.id, rId));

    await logAudit(req, {
      action: "REWARD_CHANGED",
      reason: `Updated loyalty reward ID ${rId}`
    });

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete("/rewards/:id", authenticateToken, requirePermission("manage_rewards"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const rId = parseInt(id);

    await db.update(rewards).set({ active: false }).where(eq(rewards.id, rId));

    await logAudit(req, {
      action: "REWARD_CHANGED",
      reason: `Deactivated loyalty reward ID ${rId}`
    });

    return res.json({ success: true, message: "Reward deactivated successfully." });
  } catch (error) {
    next(error);
  }
});

// 8. Tiers CRUD
router.get("/tiers", authenticateToken, async (req, res, next) => {
  try {
    const list = await db.select().from(tiers).orderBy(tiers.sortOrder);
    return res.json(list);
  } catch (error) {
    next(error);
  }
});

router.post("/tiers", authenticateToken, requirePermission("manage_tiers"), async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string(),
      description: z.string().optional(),
      visitsRequired: z.number().default(0),
      spendRequired: z.string().default("0.00"),
      pointsRequired: z.number().default(0),
      badgeImage: z.string(),
      unlockMessage: z.string().optional(),
      sortOrder: z.number().default(0)
    });

    const data = schema.parse(req.body);
    await db.insert(tiers).values(data);

    await logAudit(req, {
      action: "TIER_CHANGED",
      reason: `Created loyalty tier: ${data.name}`
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.patch("/tiers/:id", authenticateToken, requirePermission("manage_tiers"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tId = parseInt(id);

    const schema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      visitsRequired: z.number().optional(),
      spendRequired: z.string().optional(),
      pointsRequired: z.number().optional(),
      badgeImage: z.string().optional(),
      unlockMessage: z.string().optional(),
      sortOrder: z.number().optional(),
      active: z.boolean().optional()
    });

    const data = schema.parse(req.body);
    await db.update(tiers).set(data).where(eq(tiers.id, tId));

    await logAudit(req, {
      action: "TIER_CHANGED",
      reason: `Updated loyalty tier ID ${tId}`
    });

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// 9. Promotions CRUD
router.get("/promotions", authenticateToken, async (req, res, next) => {
  try {
    const list = await db.select().from(promotions).orderBy(desc(promotions.createdAt));
    return res.json(list);
  } catch (error) {
    next(error);
  }
});

router.post("/promotions", authenticateToken, requirePermission("manage_promotions"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const schema = z.object({
      title: z.string(),
      description: z.string(),
      audienceType: z.string().default("all"),
      startDate: z.string(),
      endDate: z.string(),
      featured: z.boolean().default(false),
      doublePoints: z.boolean().default(false),
      imageUrl: z.string().optional()
    });

    const data = schema.parse(req.body);

    await db.insert(promotions).values({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdBy: req.user?.id || 1
    });

    await logAudit(req, {
      action: "SETTINGS_CHANGED",
      reason: `Created shop promotion: ${data.title}`
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.patch("/promotions/:id", authenticateToken, requirePermission("manage_promotions"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const pId = parseInt(id);

    const schema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      audienceType: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      active: z.boolean().optional(),
      featured: z.boolean().optional(),
      doublePoints: z.boolean().optional(),
      imageUrl: z.string().optional()
    });

    const data = schema.parse(req.body);
    const updateData: any = { ...data };
    
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    await db.update(promotions).set(updateData).where(eq(promotions.id, pId));

    await logAudit(req, {
      action: "SETTINGS_CHANGED",
      reason: `Updated shop promotion ID ${pId}`
    });

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// 10. Receipt Claims Review: List Pending
router.get("/receipt-claims", authenticateToken, async (req, res, next) => {
  try {
    const list = await db.select().from(receiptClaims).orderBy(desc(receiptClaims.createdAt));
    return res.json(list);
  } catch (error) {
    next(error);
  }
});

// 11. Approve Receipt Claim
router.post("/receipt-claims/:id/approve", authenticateToken, requirePermission("approve_overrides"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const claimId = parseInt(id);

    const claimList = await db.select().from(receiptClaims).where(eq(receiptClaims.id, claimId));
    if (claimList.length === 0) return res.status(404).json({ error: "Receipt claim not found." });
    const claim = claimList[0];

    if (claim.status !== "PENDING" && claim.status !== "FLAGGED") {
      return res.status(400).json({ error: `Claim has already been resolved with status: ${claim.status}` });
    }

    let customerId = claim.customerId;
    
    // Check if customer ID needs resolution (can match by claimant email or phone if empty)
    if (!customerId) {
      let matchedCust: any[] = [];
      if (claim.claimantEmail) {
        matchedCust = await db.select().from(customers).where(eq(customers.email, claim.claimantEmail));
      }
      if (matchedCust.length === 0 && claim.claimantPhone) {
        matchedCust = await db.select().from(customers).where(eq(customers.phone, claim.claimantPhone));
      }

      if (matchedCust.length === 0) {
        return res.status(422).json({ error: "CUSTOMER_NOT_FOUND", message: "This claimant is not registered in loyalty app. Register them first or link manually." });
      }
      customerId = matchedCust[0].id;
    }

    const resolvedCustomerId = customerId as number;

    const accounts = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, resolvedCustomerId));
    if (accounts.length === 0) return res.status(404).json({ error: "Customer loyalty account not found." });
    const loyalty = accounts[0];

    // Check duplicate claims again
    const duplicates = await db.select()
      .from(receiptClaims)
      .where(
        and(
          eq(receiptClaims.receiptNumber, claim.receiptNumber),
          eq(receiptClaims.status, "APPROVED")
        )
      );

    if (duplicates.length > 0) {
      await db.update(receiptClaims)
        .set({ status: "ALREADY_CLAIMED", reviewNotes: "Rejected automatically: receipt was already claimed by another user." })
        .where(eq(receiptClaims.id, claimId));
        
      return res.status(400).json({ error: "ALREADY_CLAIMED", message: "This receipt number has already been claimed." });
    }

    const sysSettings = await getSystemSettings();
    const pointsPerDollar = parseInt(sysSettings["points_per_dollar"] || "1");
    const pointsToAward = Math.floor(parseFloat(claim.purchaseTotal) * pointsPerDollar);

    // Record purchase transaction
    await db.insert(purchases).values({
      customerId: resolvedCustomerId,
      loyaltyAccountId: loyalty.id,
      staffUserId: req.user?.id || null,
      amount: claim.purchaseTotal,
      pointsAwarded: pointsToAward,
      source: "receipt_claim",
      receiptNumber: claim.receiptNumber
    } as any);

    const purchaseList = await db.select().from(purchases).where(eq(purchases.customerId, resolvedCustomerId)).orderBy(desc(purchases.id)).limit(1);
    const purchaseId = purchaseList[0]?.id;

    // Record Visit (if above minimum spend threshold)
    const minVisitSpend = parseFloat(sysSettings["min_purchase_amount_to_count_visit"] || "5.00");
    let isVisitQualified = parseFloat(claim.purchaseTotal) >= minVisitSpend;
    let visitPoints = 0;

    if (isVisitQualified) {
      visitPoints = parseInt(sysSettings["points_per_visit"] || "10");
      await db.insert(visits).values({
        customerId: resolvedCustomerId,
        loyaltyAccountId: loyalty.id,
        staffUserId: req.user?.id || null,
        source: "receipt_claim",
        visitDate: claim.purchaseDate,
        pointsAwarded: visitPoints
      } as any);
    }

    // Accumulate total points
    const totalAwarded = pointsToAward + visitPoints;
    const newBalance = loyalty.pointsBalance + totalAwarded;
    const newLifetime = loyalty.lifetimePoints + totalAwarded;
    const newVisits = loyalty.totalVisits + (isVisitQualified ? 1 : 0);
    const newSpend = (parseFloat(loyalty.lifetimeSpend) + parseFloat(claim.purchaseTotal)).toFixed(2);

    await db.update(loyaltyAccounts)
      .set({
        pointsBalance: newBalance,
        lifetimePoints: newLifetime,
        totalVisits: newVisits,
        lifetimeSpend: newSpend
      })
      .where(eq(loyaltyAccounts.id, loyalty.id));

    // Ledger
    await db.insert(pointsLedger).values({
      customerId: resolvedCustomerId,
      loyaltyAccountId: loyalty.id,
      staffUserId: req.user?.id || null,
      type: "earn_spend",
      pointsChange: totalAwarded,
      balanceAfter: newBalance,
      reason: `Receipt claim approved for Receipt #${claim.receiptNumber}. Spent $${parseFloat(claim.purchaseTotal).toFixed(2)}.`,
      source: "receipt_claim",
      relatedPurchaseId: purchaseId
    } as any);

    // Update claim status
    await db.update(receiptClaims)
      .set({
        customerId: resolvedCustomerId,
        status: "APPROVED",
        reviewedBy: req.user?.id || null,
        approvedAt: new Date(),
        reviewNotes: `Approved by manager. Credited $${claim.purchaseTotal} purchase. Total: ${totalAwarded} points.`
      } as any)
      .where(eq(receiptClaims.id, claimId));

    // Check tier promotion
    await updateCustomerTier(resolvedCustomerId);

    // Audit logs
    await logAudit(req, {
      customerId: resolvedCustomerId,
      action: "RECEIPT_CLAIM_APPROVED",
      receiptClaimId: claimId,
      pointsChange: totalAwarded,
      reason: `Approved receipt claim #${claim.receiptNumber}. Credited ${totalAwarded} points.`
    });

    return res.json({ success: true, message: `Receipt claim approved successfully. Credited ${totalAwarded} pts.` });
  } catch (error) {
    next(error);
  }
});

// 12. Reject Receipt Claim
router.post("/receipt-claims/:id/reject", authenticateToken, requirePermission("approve_overrides"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const claimId = parseInt(id);

    const claimList = await db.select().from(receiptClaims).where(eq(receiptClaims.id, claimId));
    if (claimList.length === 0) return res.status(404).json({ error: "Receipt claim not found." });

    await db.update(receiptClaims)
      .set({
        status: "REJECTED",
        reviewedBy: req.user?.id || null,
        rejectedAt: new Date(),
        reviewNotes: reason || "Rejected by store manager."
      })
      .where(eq(receiptClaims.id, claimId));

    await logAudit(req, {
      customerId: claimList[0].customerId || undefined,
      action: "RECEIPT_CLAIM_REJECTED",
      receiptClaimId: claimId,
      reason: `Rejected receipt claim #${claimList[0].receiptNumber}. Reason: ${reason || "N/A"}`
    });

    return res.json({ success: true, message: "Receipt claim rejected." });
  } catch (error) {
    next(error);
  }
});

// 13. Loyverse Sync & Mappings Status
router.get("/integrations/loyverse/status", authenticateToken, async (req, res, next) => {
  try {
    const status = await loyverseClient.testConnection();
    
    const logs = await db.select().from(integrationLogs).orderBy(desc(integrationLogs.createdAt)).limit(10);
    const mappingsCount = await db.select({ count: sql<number>`count(*)` }).from(loyverseCustomers);
    const unmatchedCount = await db.select({ count: sql<number>`count(*)` })
      .from(loyverseReceipts)
      .where(eq(loyverseReceipts.status, "unmatched"));

    return res.json({
      status: status.success ? "connected" : "failed",
      connectionMessage: status.message,
      demoMode: process.env.LOYVERSE_DEMO_MODE !== "false",
      mappingsCount: mappingsCount[0]?.count || 0,
      unmatchedReceiptsCount: unmatchedCount[0]?.count || 0,
      logs
    });
  } catch (error) {
    next(error);
  }
});

// Test Connection
router.post("/integrations/loyverse/test", authenticateToken, async (req, res, next) => {
  try {
    const status = await loyverseClient.testConnection();
    return res.json(status);
  } catch (error) {
    next(error);
  }
});

// Sync Customers
router.post("/integrations/loyverse/sync-customers", authenticateToken, requirePermission("full_access"), async (req, res, next) => {
  try {
    const lyCustomers = await loyverseClient.getCustomers();
    let synced = 0;

    for (const c of lyCustomers) {
      if (!c.email && !c.phoneNumber) continue;

      // Find local customer by email or phone
      const matchedLocal = await db.select()
        .from(customers)
        .where(
          or(
            c.email ? eq(customers.email, c.email) : undefined,
            c.phoneNumber ? eq(customers.phone, c.phoneNumber) : undefined
          )
        );

      if (matchedLocal.length > 0) {
        const localCust = matchedLocal[0];

        // Insert or update mapping
        const existingMap = await db.select().from(loyverseCustomers).where(eq(loyverseCustomers.localCustomerId, localCust.id));
        
        if (existingMap.length === 0) {
          await db.insert(loyverseCustomers).values({
            localCustomerId: localCust.id,
            loyverseCustomerId: c.id,
            email: c.email || null,
            phone: c.phoneNumber || null,
            barcode: c.barcode || null,
            rawJson: JSON.stringify(c),
            lastSyncedAt: new Date()
          });
          synced++;
        }
      }
    }

    return res.json({ success: true, message: `Sync completed. Mapped ${synced} Loyverse customer accounts.` });
  } catch (error) {
    next(error);
  }
});

// Sync Receipts
router.post("/integrations/loyverse/sync-receipts", authenticateToken, requirePermission("full_access"), async (req, res, next) => {
  try {
    const receipts = await loyverseClient.getReceipts();
    let synced = 0;

    for (const r of receipts) {
      const existing = await db.select().from(loyverseReceipts).where(eq(loyverseReceipts.loyverseReceiptId, r.id));
      if (existing.length === 0) {
        let localCustId: number | null = null;

        // Match loyverse customer ID mapping
        if (r.customerId) {
          const mapping = await db.select().from(loyverseCustomers).where(eq(loyverseCustomers.loyverseCustomerId, r.customerId));
          if (mapping.length > 0) {
            localCustId = mapping[0].localCustomerId;
          }
        }

        await db.insert(loyverseReceipts).values({
          loyverseReceiptId: r.id,
          localCustomerId: localCustId,
          receiptNumber: r.receiptNumber,
          total: r.total.toFixed(2),
          receiptDate: new Date(r.receiptDate),
          status: localCustId ? "synced" : "unmatched",
          rawJson: JSON.stringify(r),
          lastSyncedAt: new Date()
        });

        // If local customer is matched, award points automatically!
        if (localCustId) {
          const accounts = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, localCustId));
          if (accounts.length > 0) {
            const loyalty = accounts[0];
            const sysSettings = await getSystemSettings();
            const pointsPerDollar = parseInt(sysSettings["points_per_dollar"] || "1");
            const pointsToAward = Math.floor(r.total * pointsPerDollar);

            const newBalance = loyalty.pointsBalance + pointsToAward;
            await db.update(loyaltyAccounts)
              .set({
                pointsBalance: newBalance,
                lifetimePoints: loyalty.lifetimePoints + pointsToAward,
                lifetimeSpend: (parseFloat(loyalty.lifetimeSpend) + r.total).toFixed(2)
              })
              .where(eq(loyaltyAccounts.id, loyalty.id));

            await db.insert(pointsLedger).values({
              customerId: localCustId,
              loyaltyAccountId: loyalty.id,
              type: "earn_spend",
              pointsChange: pointsToAward,
              balanceAfter: newBalance,
              reason: `Automatic point sync from Loyverse receipt #${r.receiptNumber}`,
              source: "loyverse"
            });

            await updateCustomerTier(localCustId);
          }
        }

        synced++;
      }
    }

    return res.json({ success: true, message: `Successfully fetched and synced ${synced} Loyverse receipts.` });
  } catch (error) {
    next(error);
  }
});

// Persistence helper to write back token
function persistEnvVariable(key: string, value: string) {
  try {
    // Try to update .env in root
    const rootEnv = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(rootEnv)) {
      let content = fs.readFileSync(rootEnv, "utf8");
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }
      fs.writeFileSync(rootEnv, content, "utf8");
    }

    // Try to update .env in server/
    const serverEnv = path.resolve(process.cwd(), "server", ".env");
    if (fs.existsSync(serverEnv)) {
      let content = fs.readFileSync(serverEnv, "utf8");
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }
      fs.writeFileSync(serverEnv, content, "utf8");
    }
  } catch (error) {
    console.error("Could not write persistent env variable:", error);
  }
}

// 13a. Get OAuth URL
router.get("/integrations/loyverse/oauth-url", authenticateToken, (req, res) => {
  const clientId = process.env.LOYVERSE_CLIENT_ID || "iDfDyJ1ofLHj91d3dgsF";
  const redirectUri = encodeURIComponent(process.env.LOYVERSE_REDIRECT_URI || "https://theboudincompany.com/test/rewards10");
  const oauthUrl = `https://r.loyverse.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=customers:read%20receipts:read`;
  return res.json({ oauthUrl });
});

// 13b. Authorize OAuth Code
router.post("/integrations/loyverse/authorize-code", authenticateToken, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Authorization code is required." });
    }

    const clientId = process.env.LOYVERSE_CLIENT_ID || "iDfDyJ1ofLHj91d3dgsF";
    const clientSecret = "H2HlKTNi60c-UnbMzKaF77-kkVcyREPieTVzNpCl0ySJ6x6Yl7AuMw=="; // Live App Secret
    const redirectUri = process.env.LOYVERSE_REDIRECT_URI || "https://theboudincompany.com/test/rewards10";

    console.log("Exchanging Loyverse code for access token...");
    
    const response = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth token exchange failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json() as any;
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("No access_token returned by Loyverse.");
    }

    // Persist the newly acquired token in env and .env files
    process.env.LOYVERSE_API_KEY = accessToken;
    process.env.LOYVERSE_DEMO_MODE = "false";
    
    persistEnvVariable("LOYVERSE_API_KEY", accessToken);
    persistEnvVariable("LOYVERSE_DEMO_MODE", "false");

    await db.insert(integrationLogs).values({
      integrationName: "loyverse",
      action: "oauth_authorize",
      status: "success",
      message: "Successfully exchanged code for OAuth Access Token. Production sync active!"
    });

    return res.json({ success: true, message: "Loyverse connected and authorized successfully!" });
  } catch (error: any) {
    await db.insert(integrationLogs).values({
      integrationName: "loyverse",
      action: "oauth_authorize",
      status: "failed",
      message: "Failed to authorize Loyverse: " + error.message
    });
    return res.status(500).json({ error: error.message });
  }
});

// View integration logs
router.get("/integrations/loyverse/logs", authenticateToken, async (req, res, next) => {
  try {
    const list = await db.select().from(integrationLogs).orderBy(desc(integrationLogs.createdAt)).limit(30);
    return res.json(list);
  } catch (error) {
    next(error);
  }
});

// Export customer database (Admin role only)
router.get("/export-customers", authenticateToken, requireRole(["Administrator"]), async (req, res, next) => {
  try {
    const list = await db.select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      rewardsNumber: loyaltyAccounts.rewardsNumber,
      pointsBalance: loyaltyAccounts.pointsBalance,
      lifetimePoints: loyaltyAccounts.lifetimePoints,
      totalVisits: loyaltyAccounts.totalVisits,
      lifetimeSpend: loyaltyAccounts.lifetimeSpend,
      createdAt: customers.createdAt
    })
    .from(customers)
    .innerJoin(loyaltyAccounts, eq(customers.id, loyaltyAccounts.customerId));

    await logAudit(req, {
      action: "EXPORTS_RUN",
      reason: "Administrator exported full loyalty customers CSV/JSON database dump."
    });

    return res.json(list);
  } catch (error) {
    next(error);
  }
});

// Settings CRUD
router.get("/settings", authenticateToken, async (req, res, next) => {
  try {
    const list = await db.select().from(settings);
    return res.json(list);
  } catch (error) {
    next(error);
  }
});

router.post("/settings", authenticateToken, requirePermission("manage_settings"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { settingsMap } = req.body; // e.g. { points_per_visit: "15", allow_same_day_duplicate_visits: "true" }

    if (!settingsMap || typeof settingsMap !== "object") {
      return res.status(400).json({ error: "Invalid settings format." });
    }

    for (const [key, val] of Object.entries(settingsMap)) {
      await db.update(settings)
        .set({ 
          value: String(val),
          updatedBy: req.user?.id || null
        })
        .where(eq(settings.key, key));
    }

    await logAudit(req, {
      action: "SETTINGS_CHANGED",
      reason: "System-wide loyalty variables modified by administrator."
    });

    return res.json({ success: true, message: "System variables updated successfully." });
  } catch (error) {
    next(error);
  }
});

// Audit Logs fetch
router.get("/audit-logs", authenticateToken, requirePermission("view_audit_logs"), async (req, res, next) => {
  try {
    const list = await db.select({
      id: auditLogs.id,
      actorUserId: auditLogs.actorUserId,
      actorRole: auditLogs.actorRole,
      action: auditLogs.action,
      pointsChange: auditLogs.pointsChange,
      ipAddress: auditLogs.ipAddress,
      reason: auditLogs.reason,
      createdAt: auditLogs.createdAt,
      customerName: sql<string>`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`
    })
    .from(auditLogs)
    .leftJoin(customers, eq(auditLogs.customerId, customers.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

    return res.json(list);
  } catch (error) {
    next(error);
  }
});

export default router;
