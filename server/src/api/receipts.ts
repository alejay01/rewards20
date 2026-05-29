import { Router } from "express";
import { db } from "../db";
import { receiptClaims, customers, loyaltyAccounts, settings } from "../db/schema";
import { eq, and, or } from "drizzle-orm";
import { logAudit } from "../utils/audit";
import { z } from "zod";

const router = Router();

// Helper: Pull settings value by key
const getSettingVal = async (key: string, defaultVal: string): Promise<string> => {
  const sList = await db.select().from(settings).where(eq(settings.key, key));
  return sList[0]?.value || defaultVal;
};

// 1. Submit Receipt Claim (Customer facing)
router.post("/", async (req, res, next) => {
  try {
    const claimSchema = z.object({
      receiptNumber: z.string().min(2, "Receipt number is required."),
      purchaseDate: z.string().min(1, "Purchase date is required."),
      purchaseTotal: z.string().min(1, "Purchase total is required."),
      claimantName: z.string().min(2, "Name is required."),
      claimantEmail: z.string().email("Invalid email format.").optional().or(z.literal("")),
      claimantPhone: z.string().optional().or(z.literal("")),
      rewardsNumber: z.string().optional() // Loyalty card identifier if logged in
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
    const existing = await db.select()
      .from(receiptClaims)
      .where(eq(receiptClaims.receiptNumber, data.receiptNumber));

    if (existing.length > 0) {
      const isApproved = existing.some(e => e.status === "APPROVED");
      const status = isApproved ? "ALREADY_CLAIMED" : "FLAGGED";

      // Insert flagged duplicate record for audits
      await db.insert(receiptClaims).values({
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
    let matchedCustomerId: number | null = null;
    
    // Look up via loyalty account number if supplied
    if (data.rewardsNumber) {
      const maps = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.rewardsNumber, data.rewardsNumber));
      if (maps.length > 0) matchedCustomerId = maps[0].customerId;
    }

    // Fallback: lookup by contact info
    if (!matchedCustomerId) {
      const matches = await db.select()
        .from(customers)
        .where(
          or(
            data.claimantEmail ? eq(customers.email, data.claimantEmail) : undefined,
            data.claimantPhone ? eq(customers.phone, data.claimantPhone) : undefined
          )
        );
      if (matches.length > 0) matchedCustomerId = matches[0].id;
    }

    // Step C: Check manual review fraud triggers (high receipt total)
    const limitStr = await getSettingVal("receipt_claim_review_threshold", "50.00");
    const reviewLimit = parseFloat(limitStr);

    let claimStatus: "PENDING" | "FLAGGED" = "PENDING";
    let reviewNotes = "";

    if (totalFloat >= reviewLimit) {
      claimStatus = "FLAGGED";
      reviewNotes = `Flagged: Receipt amount ($${totalFloat.toFixed(2)}) is equal or higher than the review threshold ($${reviewLimit.toFixed(2)}).`;
    }

    // Create receipt claim row
    await db.insert(receiptClaims).values({
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

    const insertedClaims = await db.select().from(receiptClaims).where(eq(receiptClaims.receiptNumber, data.receiptNumber));
    const claimId = insertedClaims[0]?.id;

    // Audit log
    await logAudit(req as any, {
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
  } catch (error) {
    next(error);
  }
});

export default router;
