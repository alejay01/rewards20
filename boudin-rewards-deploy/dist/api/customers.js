"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateCustomer = void 0;
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const audit_1 = require("../utils/audit");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "boudin-boss-rewards-secret-key-2026!";
// Customer Auth Middleware
const authenticateCustomer = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const tokenFromHeader = authHeader && authHeader.split(" ")[1];
    const tokenFromCookie = req.cookies?.customerToken;
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized. Please join or log in." });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Check customer exists
        const custList = await db_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.id, decoded.id));
        if (custList.length === 0 || custList[0].status !== "active") {
            return res.status(403).json({ error: "Customer account deactivated or invalid." });
        }
        req.customer = {
            id: decoded.id,
            publicId: decoded.publicId,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
            email: decoded.email,
            phone: decoded.phone
        };
        next();
    }
    catch (error) {
        return res.status(403).json({ error: "Session expired. Please log in again." });
    }
};
exports.authenticateCustomer = authenticateCustomer;
// 1. Join Rewards
const joinSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, "First name must be at least 2 characters."),
    lastName: zod_1.z.string().min(2, "Last name must be at least 2 characters."),
    email: zod_1.z.string().email("Invalid email format").optional().or(zod_1.z.literal("")),
    phone: zod_1.z.string().optional().or(zod_1.z.literal("")),
    birthday: zod_1.z.string().optional().or(zod_1.z.literal("")),
    favoriteCategory: zod_1.z.string().optional().or(zod_1.z.literal("")),
    consentPromotions: zod_1.z.boolean().default(false)
}).refine(data => data.email || data.phone, {
    message: "Either Email or Phone Number must be provided to join.",
    path: ["email"]
});
router.post("/join", async (req, res, next) => {
    try {
        const data = joinSchema.parse(req.body);
        // Check unique email
        if (data.email) {
            const existing = await db_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.email, data.email));
            if (existing.length > 0) {
                return res.status(400).json({ error: "A customer with this email has already joined." });
            }
        }
        // Check unique phone
        if (data.phone) {
            const existing = await db_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.phone, data.phone));
            if (existing.length > 0) {
                return res.status(400).json({ error: "A customer with this phone number has already joined." });
            }
        }
        const publicId = crypto_1.default.randomUUID();
        const rewardsNumber = "BCR-" + Math.floor(100000 + Math.random() * 900000);
        const publicQrToken = crypto_1.default.randomBytes(32).toString("hex");
        // Fetch Rookie Roller tier ID
        const dbTiers = await db_1.db.select().from(schema_1.tiers).where((0, drizzle_orm_1.eq)(schema_1.tiers.name, "Rookie Roller"));
        const rookieTierId = dbTiers[0]?.id || 1;
        // Create customer profile
        await db_1.db.insert(schema_1.customers).values({
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
        const newCustomers = await db_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.publicId, publicId));
        const customer = newCustomers[0];
        // Create loyalty account
        await db_1.db.insert(schema_1.loyaltyAccounts).values({
            customerId: customer.id,
            rewardsNumber,
            publicQrToken,
            barcodeValue: `BAR-${rewardsNumber}`,
            pointsBalance: 0,
            lifetimePoints: 0,
            totalVisits: 0,
            lifetimeSpend: "0.00",
            currentTierId: rookieTierId
        });
        // Sign customer JWT for auto-login
        const token = jsonwebtoken_1.default.sign({
            id: customer.id,
            publicId: customer.publicId,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone
        }, JWT_SECRET, { expiresIn: "30d" } // Persistent customer dashboard cookie
        );
        res.cookie("customerToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: "lax"
        });
        // Log to audits
        await (0, audit_1.logAudit)(req, {
            customerId: customer.id,
            action: "CUSTOMER_CREATED",
            reason: `Customer ${data.firstName} ${data.lastName} joined Boudin Boss Rewards.`
        });
        return res.status(201).json({
            token,
            customer: {
                id: customer.id,
                publicId: customer.publicId,
                firstName: customer.firstName,
                lastName: customer.lastName,
                rewardsNumber,
                publicQrToken
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 2. Customer Lookup / Login (Web PWA)
router.post("/login", async (req, res, next) => {
    try {
        const { identifier } = req.body; // email or phone number
        if (!identifier) {
            return res.status(400).json({ error: "Email or phone number is required." });
        }
        const matched = await db_1.db.select()
            .from(schema_1.customers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.customers.status, "active"), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.customers.email, identifier), (0, drizzle_orm_1.eq)(schema_1.customers.phone, identifier))));
        if (matched.length === 0) {
            return res.status(404).json({ error: "No active rewards member found with that contact info." });
        }
        const customer = matched[0];
        const loyaltyList = await db_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, customer.id));
        const loyalty = loyaltyList[0];
        const token = jsonwebtoken_1.default.sign({
            id: customer.id,
            publicId: customer.publicId,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone
        }, JWT_SECRET, { expiresIn: "30d" });
        res.cookie("customerToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: "lax"
        });
        return res.json({
            token,
            customer: {
                id: customer.id,
                publicId: customer.publicId,
                firstName: customer.firstName,
                lastName: customer.lastName,
                rewardsNumber: loyalty?.rewardsNumber,
                publicQrToken: loyalty?.publicQrToken
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 3. Customer Dashboard Detail
router.get("/me", exports.authenticateCustomer, async (req, res, next) => {
    try {
        if (!req.customer)
            return res.status(401).json({ error: "Unauthorized." });
        const custDetail = await db_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.id, req.customer.id));
        const accountList = await db_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, req.customer.id));
        if (custDetail.length === 0 || accountList.length === 0) {
            return res.status(404).json({ error: "Loyalty account details not found." });
        }
        const customer = custDetail[0];
        const account = accountList[0];
        // Get current tier details
        const activeTiers = await db_1.db.select().from(schema_1.tiers).where((0, drizzle_orm_1.eq)(schema_1.tiers.active, true)).orderBy((0, drizzle_orm_1.desc)(schema_1.tiers.sortOrder));
        const currentTier = activeTiers.find(t => t.id === account.currentTierId);
        // Find next tier
        const reversedTiers = [...activeTiers].reverse();
        const currentTierIndex = reversedTiers.findIndex(t => t.id === account.currentTierId);
        const nextTier = currentTierIndex !== -1 && currentTierIndex < reversedTiers.length - 1
            ? reversedTiers[currentTierIndex + 1]
            : null;
        // Calculate progress percentages
        let progressToNextTier = 100;
        if (nextTier) {
            const visitsNeeded = nextTier.visitsRequired;
            const currentVisits = account.totalVisits;
            progressToNextTier = Math.min(100, Math.floor((currentVisits / visitsNeeded) * 100));
        }
        return res.json({
            customer: {
                id: customer.id,
                publicId: customer.publicId,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                birthday: customer.birthday,
                favoriteCategory: customer.favoriteCategory,
                consentPromotions: customer.consentPromotions
            },
            loyalty: {
                rewardsNumber: account.rewardsNumber,
                pointsBalance: account.pointsBalance,
                lifetimePoints: account.lifetimePoints,
                totalVisits: account.totalVisits,
                lifetimeSpend: account.lifetimeSpend,
                currentTier: currentTier ? {
                    name: currentTier.name,
                    badgeImage: currentTier.badgeImage,
                    description: currentTier.description,
                    unlockMessage: currentTier.unlockMessage
                } : null,
                nextTier: nextTier ? {
                    name: nextTier.name,
                    visitsRequired: nextTier.visitsRequired,
                    progress: progressToNextTier
                } : null
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 4. Update Profile
router.patch("/me", exports.authenticateCustomer, async (req, res, next) => {
    try {
        if (!req.customer)
            return res.status(401).json({ error: "Unauthorized." });
        const updateSchema = zod_1.z.object({
            firstName: zod_1.z.string().min(2).optional(),
            lastName: zod_1.z.string().min(2).optional(),
            birthday: zod_1.z.string().optional(),
            favoriteCategory: zod_1.z.string().optional(),
            consentPromotions: zod_1.z.boolean().optional()
        });
        const data = updateSchema.parse(req.body);
        const updateData = { ...data };
        if (data.birthday) {
            updateData.birthday = new Date(data.birthday);
        }
        await db_1.db.update(schema_1.customers)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.customers.id, req.customer.id));
        await (0, audit_1.logAudit)(req, {
            customerId: req.customer.id,
            action: "CUSTOMER_UPDATED",
            reason: `Customer ${req.customer.firstName} updated their profile details.`
        });
        return res.json({ message: "Profile updated successfully." });
    }
    catch (error) {
        next(error);
    }
});
// 5. Get Customer QR Code Info
router.get("/me/qr", exports.authenticateCustomer, async (req, res, next) => {
    try {
        if (!req.customer)
            return res.status(401).json({ error: "Unauthorized." });
        const accountList = await db_1.db.select({
            rewardsNumber: schema_1.loyaltyAccounts.rewardsNumber,
            publicQrToken: schema_1.loyaltyAccounts.publicQrToken,
            barcodeValue: schema_1.loyaltyAccounts.barcodeValue
        })
            .from(schema_1.loyaltyAccounts)
            .where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, req.customer.id));
        if (accountList.length === 0) {
            return res.status(404).json({ error: "Loyalty QR details not found." });
        }
        return res.json(accountList[0]);
    }
    catch (error) {
        next(error);
    }
});
// 6. Get Available Rewards for Customer
router.get("/me/rewards", exports.authenticateCustomer, async (req, res, next) => {
    try {
        if (!req.customer)
            return res.status(401).json({ error: "Unauthorized." });
        const accounts = await db_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, req.customer.id));
        if (accounts.length === 0)
            return res.status(404).json({ error: "Account not found." });
        const loyalty = accounts[0];
        // Load active rewards list
        const activeRewards = await db_1.db.select().from(schema_1.rewards).where((0, drizzle_orm_1.eq)(schema_1.rewards.active, true));
        // Map rewards with locked status and progress bars
        const mapped = activeRewards.map(r => {
            let progress = 0;
            let isLocked = true;
            if (r.rewardType === "visit") {
                progress = Math.min(100, Math.floor((loyalty.totalVisits / r.visitsRequired) * 100));
                isLocked = loyalty.totalVisits < r.visitsRequired;
            }
            else if (r.rewardType === "spend") {
                const floatSpend = parseFloat(loyalty.lifetimeSpend);
                const floatReq = parseFloat(r.spendRequired);
                progress = Math.min(100, Math.floor((floatSpend / floatReq) * 100));
                isLocked = floatSpend < floatReq;
            }
            else if (r.rewardType === "points") {
                progress = Math.min(100, Math.floor((loyalty.pointsBalance / r.pointsRequired) * 100));
                isLocked = loyalty.pointsBalance < r.pointsRequired;
            }
            else {
                // Birthdays or tiers
                isLocked = false;
                progress = 100;
            }
            return {
                id: r.id,
                name: r.name,
                description: r.description,
                rewardType: r.rewardType,
                pointsRequired: r.pointsRequired,
                visitsRequired: r.visitsRequired,
                spendRequired: r.spendRequired,
                highValue: r.highValue,
                managerApprovalRequired: r.managerApprovalRequired,
                progress,
                isLocked
            };
        });
        return res.json(mapped);
    }
    catch (error) {
        next(error);
    }
});
// 7. Get Recent Activity
router.get("/me/activity", exports.authenticateCustomer, async (req, res, next) => {
    try {
        if (!req.customer)
            return res.status(401).json({ error: "Unauthorized." });
        const logs = await db_1.db.select({
            id: schema_1.pointsLedger.id,
            type: schema_1.pointsLedger.type,
            pointsChange: schema_1.pointsLedger.pointsChange,
            balanceAfter: schema_1.pointsLedger.balanceAfter,
            reason: schema_1.pointsLedger.reason,
            createdAt: schema_1.pointsLedger.createdAt
        })
            .from(schema_1.pointsLedger)
            .where((0, drizzle_orm_1.eq)(schema_1.pointsLedger.customerId, req.customer.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.pointsLedger.createdAt))
            .limit(20);
        return res.json(logs);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
