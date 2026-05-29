import { db } from "../db";
import { auditLogs } from "../db/schema";
import { Request } from "express";

interface AuditLogOptions {
  customerId?: number;
  action: string;
  oldValue?: string;
  newValue?: string;
  pointsChange?: number;
  rewardId?: number;
  receiptClaimId?: number;
  reason?: string;
  approvedBy?: number;
}

export const logAudit = async (req: Request & { user?: any }, options: AuditLogOptions) => {
  try {
    const actorUserId = req.user?.id || null;
    const actorRole = req.user?.role || null;
    const ipAddress = req.ip || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    await db.insert(auditLogs).values({
      actorUserId,
      actorRole,
      customerId: options.customerId || null,
      action: options.action,
      oldValue: options.oldValue || null,
      newValue: options.newValue || null,
      pointsChange: options.pointsChange || null,
      rewardId: options.rewardId || null,
      receiptClaimId: options.receiptClaimId || null,
      ipAddress,
      userAgent,
      reason: options.reason || null,
      approvedBy: options.approvedBy || null
    });
  } catch (error) {
    // Fail-silent for audits to prevent blocking critical operational database flows
    console.error("Failed to write audit log:", error);
  }
};
