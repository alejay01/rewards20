"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const logAudit = async (req, options) => {
    try {
        const actorUserId = req.user?.id || null;
        const actorRole = req.user?.role || null;
        const ipAddress = req.ip || req.socket.remoteAddress || "";
        const userAgent = req.headers["user-agent"] || "";
        await db_1.db.insert(schema_1.auditLogs).values({
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
    }
    catch (error) {
        // Fail-silent for audits to prevent blocking critical operational database flows
        console.error("Failed to write audit log:", error);
    }
};
exports.logAudit = logAudit;
