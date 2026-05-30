import { Router, Response } from "express";
import bcrypt from "bcryptjs";
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
  settings, 
  staffUsers, 
  roles 
} from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";
import { logAudit } from "../utils/audit";
import { z } from "zod";

const router = Router();

// Helper: Recalculate and update Customer Tier level
export const updateCustomerTier = async (customerId: number): Promise<{ oldTierId: number; newTierId: number; unlocked: boolean; message: string }> => {
  const accounts = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, customerId));
  if (accounts.length === 0) throw new Error("Customer loyalty account not found.");
  
  const account = accounts[0];
  const totalVisits = account.totalVisits;
  const lifetimeSpend = parseFloat(account.lifetimeSpend);
  const lifetimePoints = account.lifetimePoints;

  // Pull all active tiers sorted by threshold requirements descending
  const dbTiers = await db.select()
    .from(tiers)
    .where(eq(tiers.active, true))
    .orderBy(desc(tiers.visitsRequired), desc(tiers.spendRequired));

  // Determine the highest tier they qualify for
  let qualifiedTier = dbTiers[dbTiers.length - 1]; // Fallback to lowest sorted
  
  for (const tier of dbTiers) {
    const visitsMatch = totalVisits >= tier.visitsRequired;
    const spendMatch = lifetimeSpend >= parseFloat(tier.spendRequired);
    const pointsMatch = lifetimePoints >= tier.pointsRequired;

    // Must satisfy at least visits OR spend OR points to make it flexible and rewarding
    if (visitsMatch || spendMatch || pointsMatch) {
      qualifiedTier = tier;
      break;
    }
  }

  const oldTierId = account.currentTierId;
  const newTierId = qualifiedTier.id;

  if (oldTierId !== newTierId) {
    await db.update(loyaltyAccounts)
      .set({ currentTierId: newTierId })
      .where(eq(loyaltyAccounts.customerId, customerId));
    
    return {
      oldTierId,
      newTierId,
      unlocked: true,
      message: qualifiedTier.unlockMessage || `Congrats! You hit ${qualifiedTier.name}!`
    };
  }

  return { oldTierId, newTierId, unlocked: false, message: "" };
};

// Helper: Pull general system settings as key-value map
const getSystemSettings = async (): Promise<Record<string, string>> => {
  const dbSettings = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const s of dbSettings) {
    map[s.key] = s.value;
  }
  return map;
};

// Helper: Verify if a PIN belongs to a Manager or Admin staff
const verifyManagerPin = async (pin: string): Promise<any | null> => {
  const staff = await db.select().from(staffUsers);
  
  for (const member of staff) {
    if (member.active && member.pinHash) {
      const match = bcrypt.compareSync(pin, member.pinHash);
      if (match) {
        // Fetch role
        const memberRoleList = await db.select().from(roles).where(eq(roles.id, member.roleId));
        const roleName = memberRoleList[0]?.name || "Team Member";
        
        if (roleName === "Administrator" || roleName === "Manager") {
          return { id: member.id, name: member.name, role: roleName };
        }
      }
    }
  }
  return null;
};

// 1. Tablet QR Lookup Customer
router.get("/customer/:qrToken", authenticateToken, async (req, res, next) => {
  try {
    const { qrToken } = req.params;

    const accounts = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.publicQrToken, qrToken));
    if (accounts.length === 0) {
      return res.status(404).json({ error: "Invalid QR code. Rewards account not found." });
    }

    const account = accounts[0];
    const customerList = await db.select().from(customers).where(eq(customers.id, account.customerId));
    
    if (customerList.length === 0) {
      return res.status(404).json({ error: "Customer profile not found." });
    }

    const customer = customerList[0];

    if (customer.status !== "active") {
      return res.status(403).json({ error: "This rewards account is deactivated." });
    }

    // Get current tier
    const activeTiers = await db.select().from(tiers).where(eq(tiers.active, true));
    const currentTier = activeTiers.find(t => t.id === account.currentTierId);

    // Recent check-in / ledger history
    const recentActivity = await db.select({
      id: pointsLedger.id,
      type: pointsLedger.type,
      pointsChange: pointsLedger.pointsChange,
      reason: pointsLedger.reason,
      createdAt: pointsLedger.createdAt
    })
    .from(pointsLedger)
    .where(eq(pointsLedger.customerId, customer.id))
    .orderBy(desc(pointsLedger.createdAt))
    .limit(5);

    return res.json({
      customer: {
        id: customer.id,
        publicId: customer.publicId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        favoriteCategory: customer.favoriteCategory,
        birthday: customer.birthday
      },
      loyalty: {
        id: account.id,
        rewardsNumber: account.rewardsNumber,
        pointsBalance: account.pointsBalance,
        lifetimePoints: account.lifetimePoints,
        totalVisits: account.totalVisits,
        lifetimeSpend: account.lifetimeSpend,
        currentTierName: currentTier?.name || "Rookie Roller",
        badgeImage: currentTier?.badgeImage
      },
      activity: recentActivity
    });
  } catch (error) {
    next(error);
  }
});

// 2. Tablet Add Visit (Qualified check-in)
router.post("/add-visit", authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, pinOverride } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required." });
    }

    const accounts = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, customerId));
    if (accounts.length === 0) return res.status(404).json({ error: "Loyalty account not found." });
    const loyalty = accounts[0];

    // Load fraud limits & configuration settings
    const sysSettings = await getSystemSettings();
    const pointsPerVisit = parseInt(sysSettings["points_per_visit"] || "10");
    const allowSameDay = sysSettings["allow_same_day_duplicate_visits"] === "true";

    // Date calculations
    const todayStr = new Date().toISOString().split("T")[0];

    // Check duplicate check-ins today
    const checkinsToday = await db.select()
      .from(visits)
      .where(
        and(
          eq(visits.customerId, customerId),
          eq(visits.visitDate, sql`DATE(${todayStr})`)
        )
      );

    let managerApprovedBy: number | null = null;
    let overrideUsed = false;

    if (checkinsToday.length > 0 && !allowSameDay) {
      // Duplicate visit blocked! Check manager override
      if (!pinOverride) {
        return res.status(422).json({
          error: "DUPLICATE_VISIT",
          message: "Customer already checked in today. Manager PIN required to override."
        });
      }

      // Verify manager PIN
      const manager = await verifyManagerPin(pinOverride);
      if (!manager) {
        return res.status(401).json({ error: "Invalid Manager PIN." });
      }

      managerApprovedBy = manager.id;
      overrideUsed = true;
    }

    // Insert visit
    await db.insert(visits).values({
      customerId,
      loyaltyAccountId: loyalty.id,
      staffUserId: req.user?.id || null,
      source: "tablet",
      visitDate: new Date(),
      pointsAwarded: pointsPerVisit,
      duplicateOverride: overrideUsed,
      managerApprovedBy
    });

    const visitList = await db.select().from(visits).where(eq(visits.customerId, customerId)).orderBy(desc(visits.id)).limit(1);
    const visitId = visitList[0]?.id;

    // Update balances
    const newPointsBalance = loyalty.pointsBalance + pointsPerVisit;
    const newLifetimePoints = loyalty.lifetimePoints + pointsPerVisit;
    const newTotalVisits = loyalty.totalVisits + 1;

    await db.update(loyaltyAccounts)
      .set({
        pointsBalance: newPointsBalance,
        lifetimePoints: newLifetimePoints,
        totalVisits: newTotalVisits
      })
      .where(eq(loyaltyAccounts.id, loyalty.id));

    // Ledger record
    await db.insert(pointsLedger).values({
      customerId,
      loyaltyAccountId: loyalty.id,
      staffUserId: req.user?.id || null,
      type: "earn_visit",
      pointsChange: pointsPerVisit,
      balanceAfter: newPointsBalance,
      reason: overrideUsed 
        ? `Points earned from visit check-in (Duplicate Override by Manager ID ${managerApprovedBy})`
        : "Points earned from standard visit check-in",
      source: "tablet",
      relatedVisitId: visitId
    });

    // Check automated tier qualification status
    const tierUpdate = await updateCustomerTier(customerId);

    // Audit logs
    await logAudit(req, {
      customerId,
      action: overrideUsed ? "DUPLICATE_VISIT_OVERRIDE" : "VISIT_ADDED",
      pointsChange: pointsPerVisit,
      approvedBy: managerApprovedBy || undefined,
      reason: `Logged store visit check-in. Awarded ${pointsPerVisit} pts.`
    });

    return res.json({
      success: true,
      message: overrideUsed ? "Duplicate visit overridden & points added!" : "Points added successfully!",
      pointsAwarded: pointsPerVisit,
      newPointsBalance,
      tierUnlocked: tierUpdate.unlocked,
      tierMessage: tierUpdate.message
    });
  } catch (error) {
    next(error);
  }
});

// 3. Tablet Add Purchase Total
router.post("/add-purchase", authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, amount, receiptNumber, pinOverride } = req.body;

    if (!customerId || !amount) {
      return res.status(400).json({ error: "Customer ID and purchase amount are required." });
    }

    const floatAmount = parseFloat(amount);
    if (isNaN(floatAmount) || floatAmount <= 0) {
      return res.status(400).json({ error: "Invalid purchase amount." });
    }

    const accounts = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, customerId));
    if (accounts.length === 0) return res.status(404).json({ error: "Account not found." });
    const loyalty = accounts[0];

    // Date calculations
    const todayStr = new Date().toISOString().split("T")[0];

    // Check duplicate transactions today
    const purchasesToday = await db.select()
      .from(purchases)
      .where(
        and(
          eq(purchases.customerId, customerId),
          sql`DATE(${purchases.createdAt}) = DATE(${todayStr})`
        )
      );

    let managerApprovedBy: number | null = null;
    let overrideUsed = false;

    if (purchasesToday.length > 0) {
      // Duplicate transaction blocked! Check manager override
      if (!pinOverride) {
        return res.status(422).json({
          error: "DUPLICATE_TRANSACTION",
          message: "Customer already has a transaction purchase logged today. Manager PIN required to override."
        });
      }

      // Verify manager PIN
      const manager = await verifyManagerPin(pinOverride);
      if (!manager) {
        return res.status(401).json({ error: "Invalid Manager PIN." });
      }

      managerApprovedBy = manager.id;
      overrideUsed = true;
    }

    const sysSettings = await getSystemSettings();
    const pointsPerDollar = parseInt(sysSettings["points_per_dollar"] || "1");
    const pointsToAward = Math.floor(floatAmount * pointsPerDollar);

    // Record purchase
    await db.insert(purchases).values({
      customerId,
      loyaltyAccountId: loyalty.id,
      staffUserId: req.user?.id || null,
      amount: floatAmount.toFixed(2),
      pointsAwarded: pointsToAward,
      source: "tablet",
      receiptNumber: receiptNumber || null
    });

    const purchaseList = await db.select().from(purchases).where(eq(purchases.customerId, customerId)).orderBy(desc(purchases.id)).limit(1);
    const purchaseId = purchaseList[0]?.id;

    // Update loyalty balances
    const newPointsBalance = loyalty.pointsBalance + pointsToAward;
    const newLifetimePoints = loyalty.lifetimePoints + pointsToAward;
    const newSpend = (parseFloat(loyalty.lifetimeSpend) + floatAmount).toFixed(2);

    await db.update(loyaltyAccounts)
      .set({
        pointsBalance: newPointsBalance,
        lifetimePoints: newLifetimePoints,
        lifetimeSpend: newSpend
      })
      .where(eq(loyaltyAccounts.id, loyalty.id));

    // Ledger
    await db.insert(pointsLedger).values({
      customerId,
      loyaltyAccountId: loyalty.id,
      staffUserId: req.user?.id || null,
      type: "earn_spend",
      pointsChange: pointsToAward,
      balanceAfter: newPointsBalance,
      reason: overrideUsed
        ? `Earned points for purchase total: $${floatAmount.toFixed(2)}${receiptNumber ? ' (Receipt #' + receiptNumber + ')' : ''} (Duplicate Override by Manager ID ${managerApprovedBy})`
        : `Earned points for purchase total: $${floatAmount.toFixed(2)}${receiptNumber ? ' (Receipt #' + receiptNumber + ')' : ''}`,
      source: "tablet",
      relatedPurchaseId: purchaseId
    });

    // Check tier promotion
    const tierUpdate = await updateCustomerTier(customerId);

    // Audit logs
    await logAudit(req, {
      customerId,
      action: overrideUsed ? "DUPLICATE_PURCHASE_OVERRIDE" : "PURCHASE_ADDED",
      pointsChange: pointsToAward,
      approvedBy: managerApprovedBy || undefined,
      reason: `Recorded shop purchase of $${floatAmount.toFixed(2)}. Awarded ${pointsToAward} pts. ${overrideUsed ? '(Duplicate Override)' : ''}`
    });

    return res.json({
      success: true,
      pointsAwarded: pointsToAward,
      newPointsBalance,
      newLifetimeSpend: newSpend,
      tierUnlocked: tierUpdate.unlocked,
      tierMessage: tierUpdate.message
    });
  } catch (error) {
    next(error);
  }
});

// 4. Tablet Redeem Loyalty Reward
router.post("/redeem-reward", authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, rewardId, pinOverride } = req.body;

    if (!customerId || !rewardId) {
      return res.status(400).json({ error: "Customer ID and Reward ID are required." });
    }

    const accounts = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, customerId));
    if (accounts.length === 0) return res.status(404).json({ error: "Account not found." });
    const loyalty = accounts[0];

    const rewardList = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    if (rewardList.length === 0 || !rewardList[0].active) {
      return res.status(404).json({ error: "Selected reward is invalid or deactivated." });
    }
    const reward = rewardList[0];

    // Check balances
    if (loyalty.pointsBalance < reward.pointsRequired) {
      return res.status(400).json({ error: "Customer does not have enough points to claim this reward." });
    }

    // High Value or Manager override checks
    let managerApprovedBy: number | null = null;
    let managerBypassRequired = reward.highValue || reward.managerApprovalRequired;

    if (managerBypassRequired) {
      if (!pinOverride) {
        return res.status(422).json({
          error: "APPROVAL_REQUIRED",
          message: `${reward.name} is a high-value item and requires a Manager PIN to redeem.`
        });
      }

      const manager = await verifyManagerPin(pinOverride);
      if (!manager) {
        return res.status(401).json({ error: "Invalid Manager PIN." });
      }

      managerApprovedBy = manager.id;
    }

    // Deduct points
    const newPointsBalance = loyalty.pointsBalance - reward.pointsRequired;
    await db.update(loyaltyAccounts)
      .set({ pointsBalance: newPointsBalance })
      .where(eq(loyaltyAccounts.id, loyalty.id));

    // Record redemption
    await db.insert(rewardRedemptions).values({
      customerId,
      loyaltyAccountId: loyalty.id,
      rewardId,
      staffUserId: req.user?.id || 0,
      managerApprovedBy,
      pointsSpent: reward.pointsRequired,
      status: "redeemed",
      notes: managerApprovedBy ? `Redemption verified via Manager ID ${managerApprovedBy}` : "Redemption processed standard"
    });

    const redemptionList = await db.select().from(rewardRedemptions).where(eq(rewardRedemptions.customerId, customerId)).orderBy(desc(rewardRedemptions.id)).limit(1);
    const redemptionId = redemptionList[0]?.id;

    // Ledger deduction
    await db.insert(pointsLedger).values({
      customerId,
      loyaltyAccountId: loyalty.id,
      staffUserId: req.user?.id || null,
      type: "redeem",
      pointsChange: -reward.pointsRequired,
      balanceAfter: newPointsBalance,
      reason: `Claimed loyalty reward: ${reward.name}`,
      source: "tablet",
      relatedRedemptionId: redemptionId
    });

    // Audit logs
    await logAudit(req, {
      customerId,
      action: "REWARD_REDEEMED",
      rewardId,
      pointsChange: -reward.pointsRequired,
      approvedBy: managerApprovedBy || undefined,
      reason: `Redeemed reward: ${reward.name}. Deducted ${reward.pointsRequired} pts.`
    });

    return res.json({
      success: true,
      message: `Reward '${reward.name}' redeemed successfully!`,
      newPointsBalance
    });
  } catch (error) {
    next(error);
  }
});

// 5. Tablet Verify Manager PIN
router.post("/request-manager-approval", authenticateToken, async (req, res, next) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: "PIN is required." });
    }

    const manager = await verifyManagerPin(pin);
    if (!manager) {
      return res.status(401).json({ error: "Unauthorized. PIN is invalid or is not a Manager/Admin." });
    }

    return res.json({
      success: true,
      message: "Manager approval authorized.",
      approver: manager
    });
  } catch (error) {
    next(error);
  }
});

// 6. Tablet Recent Activities
router.get("/recent-activity", authenticateToken, async (req, res, next) => {
  try {
    // Show last 10 visits/redemptions on this tablet
    const list = await db.select({
      id: pointsLedger.id,
      type: pointsLedger.type,
      pointsChange: pointsLedger.pointsChange,
      reason: pointsLedger.reason,
      createdAt: pointsLedger.createdAt,
      customerName: sql<string>`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`
    })
    .from(pointsLedger)
    .innerJoin(customers, eq(pointsLedger.customerId, customers.id))
    .orderBy(desc(pointsLedger.createdAt))
    .limit(10);

    return res.json(list);
  } catch (error) {
    next(error);
  }
});

export default router;
