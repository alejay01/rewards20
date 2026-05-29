"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const audit_1 = require("../utils/audit");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Helper: Pull settings value by key
const getSettingVal = async (key, defaultVal) => {
    const sList = await db_1.db.select().from(schema_1.settings).where((0, drizzle_orm_1.eq)(schema_1.settings.key, key));
    return sList[0]?.value || defaultVal;
};
// 1. Submit Receipt Claim (Customer facing)
router.post("/", async (req, res, next) => {
    try {
        const claimSchema = zod_1.z.object({
            receiptNumber: zod_1.z.string().min(2, "Receipt number is required."),
            purchaseDate: zod_1.z.string().min(1, "Purchase date is required."),
            purchaseTotal: zod_1.z.string().min(1, "Purchase total is required."),
            claimantName: zod_1.z.string().min(2, "Name is required."),
            claimantEmail: zod_1.z.string().email("Invalid email format.").optional().or(zod_1.z.literal("")),
            claimantPhone: zod_1.z.string().optional().or(zod_1.z.literal("")),
            rewardsNumber: zod_1.z.string().optional() // Loyalty card identifier if logged in
        }).refine(data => data.claimantEmail || data.claimantPhone, {
            message: "Please enter your Email or Phone Number so we can match your account.",
            path: ["claimantEmail"]
        });
        const data = claimSchema.parse(req.body);
        const totalFloat = parseFloat(data.purchaseTotal);
        if (isNaN(totalFloat) || totalFloat <= 0) {
            return res.status(400).json({ error: "Invalid receipt purchase total." });
        }
        // Step A: Check if receipt number was already APPROVED or PENDING
        const existing = await db_1.db.select()
            .from(schema_1.receiptClaims)
            .where((0, drizzle_orm_1.eq)(schema_1.receiptClaims.receiptNumber, data.receiptNumber));
        if (existing.length > 0) {
            const isApproved = existing.some(e => e.status === "APPROVED");
            const status = isApproved ? "ALREADY_CLAIMED" : "FLAGGED";
            // Insert flagged duplicate record for audits
            await db_1.db.insert(schema_1.receiptClaims).values({
                receiptNumber: data.receiptNumber,
                claimantName: data.claimantName,
                claimantEmail: data.claimantEmail || null,
                claimantPhone: data.claimantPhone || null,
                purchaseDate: new Date(data.purchaseDate),
                purchaseTotal: totalFloat.toFixed(2),
                status,
                source: "web",
                reviewNotes: "Flagged: duplicate submission of the same receipt number."
            });
            return res.status(409).json({
                error: "ALREADY_CLAIMED",
                message: "This receipt has already been claimed or is currently in review. Duplicate claims are flagged for staff security audit."
            });
        }
        // Step B: Resolve local customer
        let matchedCustomerId = null;
        // Look up via loyalty account number if supplied
        if (data.rewardsNumber) {
            const maps = await db_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.rewardsNumber, data.rewardsNumber));
            if (maps.length > 0)
                matchedCustomerId = maps[0].customerId;
        }
        // Fallback: lookup by contact info
        if (!matchedCustomerId) {
            const matches = await db_1.db.select()
                .from(schema_1.customers)
                .where((0, drizzle_orm_1.or)(data.claimantEmail ? (0, drizzle_orm_1.eq)(schema_1.customers.email, data.claimantEmail) : undefined, data.claimantPhone ? (0, drizzle_orm_1.eq)(schema_1.customers.phone, data.claimantPhone) : undefined));
            if (matches.length > 0)
                matchedCustomerId = matches[0].id;
        }
        // Step C: Check manual review fraud triggers (high receipt total)
        const limitStr = await getSettingVal("receipt_claim_review_threshold", "50.00");
        const reviewLimit = parseFloat(limitStr);
        let claimStatus = "PENDING";
        let reviewNotes = "";
        if (totalFloat >= reviewLimit) {
            claimStatus = "FLAGGED";
            reviewNotes = `Flagged: Receipt amount ($${totalFloat.toFixed(2)}) is equal or higher than the review threshold ($${reviewLimit.toFixed(2)}).`;
        }
        // Create receipt claim row
        await db_1.db.insert(schema_1.receiptClaims).values({
            receiptNumber: data.receiptNumber,
            customerId: matchedCustomerId,
            claimantName: data.claimantName,
            claimantEmail: data.claimantEmail || null,
            claimantPhone: data.claimantPhone || null,
            purchaseDate: new Date(data.purchaseDate),
            purchaseTotal: totalFloat.toFixed(2),
            status: claimStatus,
            source: "web",
            reviewNotes
        });
        const insertedClaims = await db_1.db.select().from(schema_1.receiptClaims).where((0, drizzle_orm_1.eq)(schema_1.receiptClaims.receiptNumber, data.receiptNumber));
        const claimId = insertedClaims[0]?.id;
        // Audit log
        await (0, audit_1.logAudit)(req, {
            customerId: matchedCustomerId || undefined,
            receiptClaimId: claimId,
            action: "RECEIPT_CLAIM_CREATED",
            reason: `Claim submitted for Receipt #${data.receiptNumber}. Total: $${totalFloat.toFixed(2)}. Status: ${claimStatus}.`
        });
        return res.status(201).json({
            success: true,
            status: claimStatus,
            message: claimStatus === "FLAGGED"
                ? "Receipt claim submitted. Since the amount is high, it has been placed in review. Points will credit after verification!"
                : "Receipt claim submitted. Staff will verify your receipt number shortly to award points!"
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
