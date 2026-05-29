import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { customers, loyaltyAccounts, tiers, rewards, pointsLedger, visits, purchases, auditLogs } from "../db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { logAudit } from "../utils/audit";
import { z } from "zod";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "boudin-boss-rewards-secret-key-2026!";

// Customer Session Request type
export interface CustomerRequest extends Request {
  customer?: {
    id: number;
    publicId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

// Customer Auth Middleware
export const authenticateCustomer = async (req: CustomerRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const tokenFromHeader = authHeader && authHeader.split(" ")[1];
  const tokenFromCookie = req.cookies?.customerToken;
  
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please join or log in." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check customer exists
    const custList = await db.select().from(customers).where(eq(customers.id, decoded.id));
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
  } catch (error) {
    return res.status(403).json({ error: "Session expired. Please log in again." });
  }
};

// 1. Join Rewards
const joinSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  birthday: z.string().optional().or(z.literal("")),
  favoriteCategory: z.string().optional().or(z.literal("")),
  consentPromotions: z.boolean().default(false)
}).refine(data => data.email || data.phone, {
  message: "Either Email or Phone Number must be provided to join.",
  path: ["email"]
});

router.post("/join", async (req, res, next) => {
  try {
    const data = joinSchema.parse(req.body);

    // Check unique email
    if (data.email) {
      const existing = await db.select().from(customers).where(eq(customers.email, data.email));
      if (existing.length > 0) {
        return res.status(400).json({ error: "A customer with this email has already joined." });
      }
    }

    // Check unique phone
    if (data.phone) {
      const existing = await db.select().from(customers).where(eq(customers.phone, data.phone));
      if (existing.length > 0) {
        return res.status(400).json({ error: "A customer with this phone number has already joined." });
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

    // Create loyalty account
    await db.insert(loyaltyAccounts).values({
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
    const token = jwt.sign(
      {
        id: customer.id,
        publicId: customer.publicId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone
      },
      JWT_SECRET,
      { expiresIn: "30d" } // Persistent customer dashboard cookie
    );

    res.cookie("customerToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax"
    });

    // Log to audits
    await logAudit(req, {
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
  } catch (error) {
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

    const matched = await db.select()
      .from(customers)
      .where(
        and(
          eq(customers.status, "active"),
          or(
            eq(customers.email, identifier),
            eq(customers.phone, identifier)
          )
        )
      );

    if (matched.length === 0) {
      return res.status(404).json({ error: "No active rewards member found with that contact info." });
    }

    const customer = matched[0];
    const loyaltyList = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, customer.id));
    const loyalty = loyaltyList[0];

    const token = jwt.sign(
      {
        id: customer.id,
        publicId: customer.publicId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

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
  } catch (error) {
    next(error);
  }
});

// 3. Customer Dashboard Detail
router.get("/me", authenticateCustomer, async (req: CustomerRequest, res, next) => {
  try {
    if (!req.customer) return res.status(401).json({ error: "Unauthorized." });

    const custDetail = await db.select().from(customers).where(eq(customers.id, req.customer.id));
    const accountList = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, req.customer.id));
    
    if (custDetail.length === 0 || accountList.length === 0) {
      return res.status(404).json({ error: "Loyalty account details not found." });
    }

    const customer = custDetail[0];
    const account = accountList[0];

    // Get current tier details
    const activeTiers = await db.select().from(tiers).where(eq(tiers.active, true)).orderBy(desc(tiers.sortOrder));
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
  } catch (error) {
    next(error);
  }
});

// 4. Update Profile
router.patch("/me", authenticateCustomer, async (req: CustomerRequest, res, next) => {
  try {
    if (!req.customer) return res.status(401).json({ error: "Unauthorized." });

    const updateSchema = z.object({
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      birthday: z.string().optional(),
      favoriteCategory: z.string().optional(),
      consentPromotions: z.boolean().optional()
    });

    const data = updateSchema.parse(req.body);
    const updateData: any = { ...data };
    if (data.birthday) {
      updateData.birthday = new Date(data.birthday);
    }

    await db.update(customers)
      .set(updateData)
      .where(eq(customers.id, req.customer.id));

    await logAudit(req, {
      customerId: req.customer.id,
      action: "CUSTOMER_UPDATED",
      reason: `Customer ${req.customer.firstName} updated their profile details.`
    });

    return res.json({ message: "Profile updated successfully." });
  } catch (error) {
    next(error);
  }
});

// 5. Get Customer QR Code Info
router.get("/me/qr", authenticateCustomer, async (req: CustomerRequest, res, next) => {
  try {
    if (!req.customer) return res.status(401).json({ error: "Unauthorized." });

    const accountList = await db.select({
      rewardsNumber: loyaltyAccounts.rewardsNumber,
      publicQrToken: loyaltyAccounts.publicQrToken,
      barcodeValue: loyaltyAccounts.barcodeValue
    })
    .from(loyaltyAccounts)
    .where(eq(loyaltyAccounts.customerId, req.customer.id));

    if (accountList.length === 0) {
      return res.status(404).json({ error: "Loyalty QR details not found." });
    }

    return res.json(accountList[0]);
  } catch (error) {
    next(error);
  }
});

// 6. Get Available Rewards for Customer
router.get("/me/rewards", authenticateCustomer, async (req: CustomerRequest, res, next) => {
  try {
    if (!req.customer) return res.status(401).json({ error: "Unauthorized." });

    const accounts = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, req.customer.id));
    if (accounts.length === 0) return res.status(404).json({ error: "Account not found." });
    const loyalty = accounts[0];

    // Load active rewards list
    const activeRewards = await db.select().from(rewards).where(eq(rewards.active, true));

    // Map rewards with locked status and progress bars
    const mapped = activeRewards.map(r => {
      let progress = 0;
      let isLocked = true;

      if (r.rewardType === "visit") {
        progress = Math.min(100, Math.floor((loyalty.totalVisits / r.visitsRequired) * 100));
        isLocked = loyalty.totalVisits < r.visitsRequired;
      } else if (r.rewardType === "spend") {
        const floatSpend = parseFloat(loyalty.lifetimeSpend);
        const floatReq = parseFloat(r.spendRequired);
        progress = Math.min(100, Math.floor((floatSpend / floatReq) * 100));
        isLocked = floatSpend < floatReq;
      } else if (r.rewardType === "points") {
        progress = Math.min(100, Math.floor((loyalty.pointsBalance / r.pointsRequired) * 100));
        isLocked = loyalty.pointsBalance < r.pointsRequired;
      } else {
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
  } catch (error) {
    next(error);
  }
});

// 7. Get Recent Activity
router.get("/me/activity", authenticateCustomer, async (req: CustomerRequest, res, next) => {
  try {
    if (!req.customer) return res.status(401).json({ error: "Unauthorized." });

    const logs = await db.select({
      id: pointsLedger.id,
      type: pointsLedger.type,
      pointsChange: pointsLedger.pointsChange,
      balanceAfter: pointsLedger.balanceAfter,
      reason: pointsLedger.reason,
      createdAt: pointsLedger.createdAt
    })
    .from(pointsLedger)
    .where(eq(pointsLedger.customerId, req.customer.id))
    .orderBy(desc(pointsLedger.createdAt))
    .limit(20);

    return res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
