import { Router } from "express";
import crypto from "crypto";
import { db } from "../db";
import { loyaltyAccounts, customers } from "../db/schema";
import { eq } from "drizzle-orm";
import { authenticateToken, requirePermission } from "../middleware/auth";
import { logAudit } from "../utils/audit";

const router = Router();

// 1. Get QR Info for Admin / Staff
router.get("/customer/:customerId", authenticateToken, async (req, res, next) => {
  try {
    const custId = parseInt(req.params.customerId);
    const loyalty = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, custId));
    
    if (loyalty.length === 0) {
      return res.status(404).json({ error: "Customer loyalty account not found." });
    }

    return res.json({
      customerId: custId,
      publicQrToken: loyalty[0].publicQrToken,
      rewardsNumber: loyalty[0].rewardsNumber
    });
  } catch (error) {
    next(error);
  }
});

// 2. Rotate Customer QR Token (fraud recovery)
router.post("/rotate-customer-token", authenticateToken, requirePermission("full_access"), async (req, res, next) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required." });
    }

    const custId = parseInt(customerId);
    const loyalty = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, custId));
    
    if (loyalty.length === 0) {
      return res.status(404).json({ error: "Customer loyalty account not found." });
    }

    const newQrToken = crypto.randomBytes(32).toString("hex");

    await db.update(loyaltyAccounts)
      .set({ publicQrToken: newQrToken })
      .where(eq(loyaltyAccounts.customerId, custId));

    // Audit logs
    await logAudit(req, {
      customerId: custId,
      action: "CUSTOMER_UPDATED",
      reason: "Security reset: rotated customer public QR check-in token."
    });

    return res.json({
      success: true,
      message: "Customer check-in QR token rotated successfully.",
      newQrToken
    });
  } catch (error) {
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

export default router;
