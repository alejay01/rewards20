"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../utils/audit");
const router = (0, express_1.Router)();
// 1. Get QR Info for Admin / Staff
router.get("/customer/:customerId", auth_1.authenticateToken, async (req, res, next) => {
    try {
        const custId = parseInt(req.params.customerId);
        const loyalty = await db_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, custId));
        if (loyalty.length === 0) {
            return res.status(404).json({ error: "Customer loyalty account not found." });
        }
        return res.json({
            customerId: custId,
            publicQrToken: loyalty[0].publicQrToken,
            rewardsNumber: loyalty[0].rewardsNumber
        });
    }
    catch (error) {
        next(error);
    }
});
// 2. Rotate Customer QR Token (fraud recovery)
router.post("/rotate-customer-token", auth_1.authenticateToken, (0, auth_1.requirePermission)("full_access"), async (req, res, next) => {
    try {
        const { customerId } = req.body;
        if (!customerId) {
            return res.status(400).json({ error: "Customer ID is required." });
        }
        const custId = parseInt(customerId);
        const loyalty = await db_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, custId));
        if (loyalty.length === 0) {
            return res.status(404).json({ error: "Customer loyalty account not found." });
        }
        const newQrToken = crypto_1.default.randomBytes(32).toString("hex");
        await db_1.db.update(schema_1.loyaltyAccounts)
            .set({ publicQrToken: newQrToken })
            .where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, custId));
        // Audit logs
        await (0, audit_1.logAudit)(req, {
            customerId: custId,
            action: "CUSTOMER_UPDATED",
            reason: "Security reset: rotated customer public QR check-in token."
        });
        return res.json({
            success: true,
            message: "Customer check-in QR token rotated successfully.",
            newQrToken
        });
    }
    catch (error) {
        next(error);
    }
});
// 3. Generic QR codes metadata fetcher
router.get("/join", (req, res) => {
    return res.json({
        description: "Scan to Join Boudin Boss Rewards!",
        joinUrl: `${process.env.APP_URL || "https://theboudincompany.com"}/join`
    });
});
router.get("/claim", (req, res) => {
    return res.json({
        description: "Scan receipt QR to claim points!",
        claimUrl: `${process.env.APP_URL || "https://theboudincompany.com"}/claim`
    });
});
exports.default = router;
