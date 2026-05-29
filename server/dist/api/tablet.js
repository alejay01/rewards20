"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerTier = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../utils/audit");
const router = (0, express_1.Router)();
// Helper: Recalculate and update Customer Tier level
const updateCustomerTier = async (customerId) => {
    const accounts = await db_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, customerId));
    if (accounts.length === 0)
        throw new Error("Customer loyalty account not found.");
    const account = accounts[0];
    const totalVisits = account.totalVisits;
    const lifetimeSpend = parseFloat(account.lifetimeSpend);
    const lifetimePoints = account.lifetimePoints;
    // Pull all active tiers sorted by threshold requirements descending
    const dbTiers = await db_1.db.select()
        .from(schema_1.tiers)
        .where((0, drizzle_orm_1.eq)(schema_1.tiers.active, true))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.tiers.visitsRequired), (0, drizzle_orm_1.desc)(schema_1.tiers.spendRequired));
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
        await db_1.db.update(schema_1.loyaltyAccounts)
            .set({ currentTierId: newTierId })
            .where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, customerId));
        return {
            oldTierId,
            newTierId,
            unlocked: true,
            message: qualifiedTier.unlockMessage || `Congrats! You hit ${qualifiedTier.name}!`
        };
    }
    return { oldTierId, newTierId, unlocked: false, message: "" };
};
exports.updateCustomerTier = updateCustomerTier;
// Helper: Pull general system settings as key-value map
const getSystemSettings = async () => {
    const dbSettings = await db_1.db.select().from(schema_1.settings);
    const map = {};
    for (const s of dbSettings) {
        map[s.key] = s.value;
    }
    return map;
};
// Helper: Verify if a PIN belongs to a Manager or Admin staff
const verifyManagerPin = async (pin) => {
    const staff = await db_1.db.select().from(schema_1.staffUsers);
    for (const member of staff) {
        if (member.active && member.pinHash) {
            const match = bcryptjs_1.default.compareSync(pin, member.pinHash);
            if (match) {
                // Fetch role
                const memberRoleList = await db_1.db.select().from(schema_1.roles).where((0, drizzle_orm_1.eq)(schema_1.roles.id, member.roleId));
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
router.get("/customer/:qrToken", auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { qrToken } = req.params;
        const accounts = await db_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.publicQrToken, qrToken));
        if (accounts.length === 0) {
            return res.status(404).json({ error: "Invalid QR code. Rewards account not found." });
        }
        const account = accounts[0];
        const customerList = await db_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.id, account.customerId));
        if (customerList.length === 0) {
            return res.status(404).json({ error: "Customer profile not found." });
        }
        const customer = customerList[0];
        if (customer.status !== "active") {
            return res.status(403).json({ error: "This rewards account is deactivated." });
        }
        // Get current tier
        const activeTiers = await db_1.db.select().from(schema_1.tiers).where((0, drizzle_orm_1.eq)(schema_1.tiers.active, true));
        const currentTier = activeTiers.find(t => t.id === account.currentTierId);
        // Recent check-in / ledger history
        const recentActivity = await db_1.db.select({
            id: schema_1.pointsLedger.id,
            type: schema_1.pointsLedger.type,
            pointsChange: schema_1.pointsLedger.pointsChange,
            reason: schema_1.pointsLedger.reason,
            createdAt: schema_1.pointsLedger.createdAt
        })
            .from(schema_1.pointsLedger)
            .where((0, drizzle_orm_1.eq)(schema_1.pointsLedger.customerId, customer.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.pointsLedger.createdAt))
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
    }
    catch (error) {
        next(error);
    }
});
// 2. Tablet Add Visit (Qualified check-in)
router.post("/add-visit", auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { customerId, pinOverride } = req.body;
        if (!customerId) {
            return res.status(400).json({ error: "Customer ID is required." });
        }
        const accounts = await db_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, customerId));
        if (accounts.length === 0)
            return res.status(404).json({ error: "Loyalty account not found." });
        const loyalty = accounts[0];
        // Load fraud limits & configuration settings
        const sysSettings = await getSystemSettings();
        const pointsPerVisit = parseInt(sysSettings["points_per_visit"] || "10");
        const allowSameDay = sysSettings["allow_same_day_duplicate_visits"] === "true";
        // Date calculations
        const todayStr = new Date().toISOString().split("T")[0];
        // Check duplicate check-ins today
        const checkinsToday = await db_1.db.select()
            .from(schema_1.visits)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.visits.customerId, customerId), (0, drizzle_orm_1.eq)(schema_1.visits.visitDate, (0, drizzle_orm_1.sql) `DATE(${todayStr})`)));
        let managerApprovedBy = null;
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
        await db_1.db.insert(schema_1.visits).values({
            customerId,
            loyaltyAccountId: loyalty.id,
            staffUserId: req.user?.id || null,
            source: "tablet",
            visitDate: new Date(),
            pointsAwarded: pointsPerVisit,
            duplicateOverride: overrideUsed,
            managerApprovedBy
        });
        const visitList = await db_1.db.select().from(schema_1.visits).where((0, drizzle_orm_1.eq)(schema_1.visits.customerId, customerId)).orderBy((0, drizzle_orm_1.desc)(schema_1.visits.id)).limit(1);
        const visitId = visitList[0]?.id;
        // Update balances
        const newPointsBalance = loyalty.pointsBalance + pointsPerVisit;
        const newLifetimePoints = loyalty.lifetimePoints + pointsPerVisit;
        const newTotalVisits = loyalty.totalVisits + 1;
        await db_1.db.update(schema_1.loyaltyAccounts)
            .set({
            pointsBalance: newPointsBalance,
            lifetimePoints: newLifetimePoints,
            totalVisits: newTotalVisits
        })
            .where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.id, loyalty.id));
        // Ledger record
        await db_1.db.insert(schema_1.pointsLedger).values({
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
        const tierUpdate = await (0, exports.updateCustomerTier)(customerId);
        // Audit logs
        await (0, audit_1.logAudit)(req, {
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
    }
    catch (error) {
        next(error);
    }
});
// 3. Tablet Add Purchase Total
router.post("/add-purchase", auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { customerId, amount, receiptNumber } = req.body;
        if (!customerId || !amount) {
            return res.status(400).json({ error: "Customer ID and purchase amount are required." });
        }
        const floatAmount = parseFloat(amount);
        if (isNaN(floatAmount) || floatAmount <= 0) {
            return res.status(400).json({ error: "Invalid purchase amount." });
        }
        const accounts = await db_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, customerId));
        if (accounts.length === 0)
            return res.status(404).json({ error: "Account not found." });
        const loyalty = accounts[0];
        const sysSettings = await getSystemSettings();
        const pointsPerDollar = parseInt(sysSettings["points_per_dollar"] || "1");
        const pointsToAward = Math.floor(floatAmount * pointsPerDollar);
        // Record purchase
        await db_1.db.insert(schema_1.purchases).values({
            customerId,
            loyaltyAccountId: loyalty.id,
            staffUserId: req.user?.id || null,
            amount: floatAmount.toFixed(2),
            pointsAwarded: pointsToAward,
            source: "tablet",
            receiptNumber: receiptNumber || null
        });
        const purchaseList = await db_1.db.select().from(schema_1.purchases).where((0, drizzle_orm_1.eq)(schema_1.purchases.customerId, customerId)).orderBy((0, drizzle_orm_1.desc)(schema_1.purchases.id)).limit(1);
        const purchaseId = purchaseList[0]?.id;
        // Update loyalty balances
        const newPointsBalance = loyalty.pointsBalance + pointsToAward;
        const newLifetimePoints = loyalty.lifetimePoints + pointsToAward;
        const newSpend = (parseFloat(loyalty.lifetimeSpend) + floatAmount).toFixed(2);
        await db_1.db.update(schema_1.loyaltyAccounts)
            .set({
            pointsBalance: newPointsBalance,
            lifetimePoints: newLifetimePoints,
            lifetimeSpend: newSpend
        })
            .where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.id, loyalty.id));
        // Ledger
        await db_1.db.insert(schema_1.pointsLedger).values({
            customerId,
            loyaltyAccountId: loyalty.id,
            staffUserId: req.user?.id || null,
            type: "earn_spend",
            pointsChange: pointsToAward,
            balanceAfter: newPointsBalance,
            reason: `Earned points for purchase total: $${floatAmount.toFixed(2)}${receiptNumber ? ' (Receipt #' + receiptNumber + ')' : ''}`,
            source: "tablet",
            relatedPurchaseId: purchaseId
        });
        // Check tier promotion
        const tierUpdate = await (0, exports.updateCustomerTier)(customerId);
        // Audit logs
        await (0, audit_1.logAudit)(req, {
            customerId,
            action: "PURCHASE_ADDED",
            pointsChange: pointsToAward,
            reason: `Recorded shop purchase of $${floatAmount.toFixed(2)}. Awarded ${pointsToAward} pts.`
        });
        return res.json({
            success: true,
            pointsAwarded: pointsToAward,
            newPointsBalance,
            newLifetimeSpend: newSpend,
            tierUnlocked: tierUpdate.unlocked,
            tierMessage: tierUpdate.message
        });
    }
    catch (error) {
        next(error);
    }
});
// 4. Tablet Redeem Loyalty Reward
router.post("/redeem-reward", auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { customerId, rewardId, pinOverride } = req.body;
        if (!customerId || !rewardId) {
            return res.status(400).json({ error: "Customer ID and Reward ID are required." });
        }
        const accounts = await db_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, customerId));
        if (accounts.length === 0)
            return res.status(404).json({ error: "Account not found." });
        const loyalty = accounts[0];
        const rewardList = await db_1.db.select().from(schema_1.rewards).where((0, drizzle_orm_1.eq)(schema_1.rewards.id, rewardId));
        if (rewardList.length === 0 || !rewardList[0].active) {
            return res.status(404).json({ error: "Selected reward is invalid or deactivated." });
        }
        const reward = rewardList[0];
        // Check balances
        if (loyalty.pointsBalance < reward.pointsRequired) {
            return res.status(400).json({ error: "Customer does not have enough points to claim this reward." });
        }
        // High Value or Manager override checks
        let managerApprovedBy = null;
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
        await db_1.db.update(schema_1.loyaltyAccounts)
            .set({ pointsBalance: newPointsBalance })
            .where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.id, loyalty.id));
        // Record redemption
        await db_1.db.insert(schema_1.rewardRedemptions).values({
            customerId,
            loyaltyAccountId: loyalty.id,
            rewardId,
            staffUserId: req.user?.id || 0,
            managerApprovedBy,
            pointsSpent: reward.pointsRequired,
            status: "redeemed",
            notes: managerApprovedBy ? `Redemption verified via Manager ID ${managerApprovedBy}` : "Redemption processed standard"
        });
        const redemptionList = await db_1.db.select().from(schema_1.rewardRedemptions).where((0, drizzle_orm_1.eq)(schema_1.rewardRedemptions.customerId, customerId)).orderBy((0, drizzle_orm_1.desc)(schema_1.rewardRedemptions.id)).limit(1);
        const redemptionId = redemptionList[0]?.id;
        // Ledger deduction
        await db_1.db.insert(schema_1.pointsLedger).values({
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
        await (0, audit_1.logAudit)(req, {
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
    }
    catch (error) {
        next(error);
    }
});
// 5. Tablet Verify Manager PIN
router.post("/request-manager-approval", auth_1.authenticateToken, async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
});
// 6. Tablet Recent Activities
router.get("/recent-activity", auth_1.authenticateToken, async (req, res, next) => {
    try {
        // Show last 10 visits/redemptions on this tablet
        const list = await db_1.db.select({
            id: schema_1.pointsLedger.id,
            type: schema_1.pointsLedger.type,
            pointsChange: schema_1.pointsLedger.pointsChange,
            reason: schema_1.pointsLedger.reason,
            createdAt: schema_1.pointsLedger.createdAt,
            customerName: (0, drizzle_orm_1.sql) `CONCAT(${schema_1.customers.firstName}, ' ', ${schema_1.customers.lastName})`
        })
            .from(schema_1.pointsLedger)
            .innerJoin(schema_1.customers, (0, drizzle_orm_1.eq)(schema_1.pointsLedger.customerId, schema_1.customers.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.pointsLedger.createdAt))
            .limit(10);
        return res.json(list);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
