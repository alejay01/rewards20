"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsWebhookRouter = exports.smsAdminRouter = void 0;
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../utils/audit");
const twilioClient_1 = require("../integrations/twilio/twilioClient");
exports.smsAdminRouter = (0, express_1.Router)();
exports.smsWebhookRouter = (0, express_1.Router)();
exports.smsAdminRouter.use(auth_1.authenticateToken);
exports.smsAdminRouter.use(auth_1.requirePasswordAuth);
const campaignSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(3).max(120),
    message: zod_1.z.string().trim().min(1).max(1000),
    audienceType: zod_1.z.enum(["all", "rookie", "boss", "vip", "birthday", "lapsed"]).default("all"),
    scheduledAt: zod_1.z.string().datetime().optional().nullable()
});
const getEligibleRecipients = async (audienceType) => {
    const rows = await db_1.db.select({
        id: schema_1.customers.id,
        firstName: schema_1.customers.firstName,
        phone: schema_1.customers.phone,
        birthday: schema_1.customers.birthday,
        tierName: schema_1.tiers.name,
        lifetimeSpend: schema_1.loyaltyAccounts.lifetimeSpend,
        pointsBalance: schema_1.loyaltyAccounts.pointsBalance
    })
        .from(schema_1.customers)
        .leftJoin(schema_1.loyaltyAccounts, (0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, schema_1.customers.id))
        .leftJoin(schema_1.tiers, (0, drizzle_orm_1.eq)(schema_1.tiers.id, schema_1.loyaltyAccounts.currentTierId))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.customers.status, "active"), (0, drizzle_orm_1.eq)(schema_1.customers.smsMarketingConsent, true)));
    let lapsedIds = null;
    if (audienceType === "lapsed") {
        const allVisits = await db_1.db.select({
            customerId: schema_1.visits.customerId,
            visitedAt: schema_1.visits.visitDate
        }).from(schema_1.visits).orderBy((0, drizzle_orm_1.desc)(schema_1.visits.visitDate));
        const latestByCustomer = new Map();
        for (const visit of allVisits) {
            if (!latestByCustomer.has(visit.customerId) && visit.visitedAt) {
                latestByCustomer.set(visit.customerId, new Date(visit.visitedAt));
            }
        }
        const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
        lapsedIds = new Set(rows
            .filter(row => {
            const lastVisit = latestByCustomer.get(row.id);
            return !lastVisit || lastVisit.getTime() < cutoff;
        })
            .map(row => row.id));
    }
    const month = new Date().getMonth() + 1;
    const vipSpend = parseFloat(process.env.SMS_VIP_SPEND_THRESHOLD || "100");
    return rows
        .map(row => ({ ...row, normalizedPhone: (0, twilioClient_1.normalizePhoneNumber)(row.phone) }))
        .filter(row => Boolean(row.normalizedPhone))
        .filter(row => {
        const tier = (row.tierName || "").toLowerCase();
        if (audienceType === "rookie")
            return tier.includes("rookie");
        if (audienceType === "boss")
            return tier.includes("boss");
        if (audienceType === "vip")
            return parseFloat(row.lifetimeSpend || "0") >= vipSpend;
        if (audienceType === "birthday") {
            if (!row.birthday)
                return false;
            return new Date(row.birthday).getUTCMonth() + 1 === month;
        }
        if (audienceType === "lapsed")
            return lapsedIds?.has(row.id) || false;
        return true;
    });
};
const isLiveSendWindow = () => {
    if (process.env.SMS_ENFORCE_QUIET_HOURS === "false")
        return true;
    const timezone = process.env.SMS_TIMEZONE || "America/Chicago";
    const currentHour = Number(new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        hour12: false,
        timeZone: timezone
    }).format(new Date()));
    const startHour = parseInt(process.env.SMS_SEND_WINDOW_START || "9", 10);
    const endHour = parseInt(process.env.SMS_SEND_WINDOW_END || "20", 10);
    return currentHour >= startHour && currentHour < endHour;
};
exports.smsAdminRouter.get("/status", (0, auth_1.requirePermission)("manage_promotions"), async (_req, res) => {
    const status = (0, twilioClient_1.getTwilioStatus)();
    const optedIn = await db_1.db.select({ id: schema_1.customers.id })
        .from(schema_1.customers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.customers.status, "active"), (0, drizzle_orm_1.eq)(schema_1.customers.smsMarketingConsent, true)));
    return res.json({
        ...status,
        optedInCustomers: optedIn.length,
        sendWindow: {
            timezone: process.env.SMS_TIMEZONE || "America/Chicago",
            startHour: parseInt(process.env.SMS_SEND_WINDOW_START || "9", 10),
            endHour: parseInt(process.env.SMS_SEND_WINDOW_END || "20", 10)
        }
    });
});
exports.smsAdminRouter.get("/campaigns", (0, auth_1.requirePermission)("manage_promotions"), async (_req, res, next) => {
    try {
        return res.json(await db_1.db.select().from(schema_1.smsCampaigns).orderBy((0, drizzle_orm_1.desc)(schema_1.smsCampaigns.createdAt)));
    }
    catch (error) {
        next(error);
    }
});
exports.smsAdminRouter.post("/campaigns", (0, auth_1.requirePermission)("manage_promotions"), async (req, res, next) => {
    try {
        const data = campaignSchema.parse(req.body);
        await db_1.db.insert(schema_1.smsCampaigns).values({
            name: data.name,
            message: data.message,
            audienceType: data.audienceType,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
            status: "draft",
            createdBy: req.user.id
        });
        const created = await db_1.db.select().from(schema_1.smsCampaigns).orderBy((0, drizzle_orm_1.desc)(schema_1.smsCampaigns.id)).limit(1);
        await (0, audit_1.logAudit)(req, {
            action: "SMS_CAMPAIGN_CREATED",
            reason: `Created SMS campaign: ${data.name}`
        });
        return res.status(201).json(created[0]);
    }
    catch (error) {
        next(error);
    }
});
exports.smsAdminRouter.get("/campaigns/:id/preview", (0, auth_1.requirePermission)("manage_promotions"), async (req, res, next) => {
    try {
        const campaignId = parseInt(req.params.id, 10);
        const rows = await db_1.db.select().from(schema_1.smsCampaigns).where((0, drizzle_orm_1.eq)(schema_1.smsCampaigns.id, campaignId));
        if (!rows[0])
            return res.status(404).json({ error: "Campaign not found." });
        const recipients = await getEligibleRecipients(rows[0].audienceType);
        return res.json({
            eligibleRecipients: recipients.length,
            sample: recipients.slice(0, 5).map(recipient => ({
                firstName: recipient.firstName,
                phone: recipient.normalizedPhone
                    ? `***-***-${recipient.normalizedPhone.slice(-4)}`
                    : null
            })),
            renderedMessage: (0, twilioClient_1.appendComplianceFooter)(rows[0].message)
        });
    }
    catch (error) {
        next(error);
    }
});
exports.smsAdminRouter.get("/campaigns/:id/messages", (0, auth_1.requirePermission)("manage_promotions"), async (req, res, next) => {
    try {
        const campaignId = parseInt(req.params.id, 10);
        const messages = await db_1.db.select()
            .from(schema_1.smsMessages)
            .where((0, drizzle_orm_1.eq)(schema_1.smsMessages.campaignId, campaignId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.smsMessages.createdAt));
        return res.json(messages);
    }
    catch (error) {
        next(error);
    }
});
exports.smsAdminRouter.post("/campaigns/:id/send", (0, auth_1.requirePermission)("manage_promotions"), async (req, res, next) => {
    try {
        const campaignId = parseInt(req.params.id, 10);
        const rows = await db_1.db.select().from(schema_1.smsCampaigns).where((0, drizzle_orm_1.eq)(schema_1.smsCampaigns.id, campaignId));
        const campaign = rows[0];
        if (!campaign)
            return res.status(404).json({ error: "Campaign not found." });
        if (!["draft", "failed"].includes(campaign.status)) {
            return res.status(409).json({ error: `Campaign cannot send from status '${campaign.status}'.` });
        }
        const twilioStatus = (0, twilioClient_1.getTwilioStatus)();
        if (!twilioStatus.dryRun && !twilioStatus.configured) {
            return res.status(400).json({
                error: "Twilio is not configured. Add credentials and a sender before disabling dry-run mode."
            });
        }
        if (!twilioStatus.dryRun && !isLiveSendWindow()) {
            return res.status(409).json({
                error: "Live SMS is restricted to the configured daytime send window."
            });
        }
        const recipients = await getEligibleRecipients(campaign.audienceType);
        if (recipients.length === 0) {
            return res.status(400).json({
                error: "No active customers in this audience have explicit SMS consent and a valid phone number."
            });
        }
        if (recipients.length > twilioStatus.maxRecipientsPerRun) {
            return res.status(400).json({
                error: `Audience has ${recipients.length} recipients; the per-run safety cap is ${twilioStatus.maxRecipientsPerRun}.`
            });
        }
        await db_1.db.update(schema_1.smsCampaigns).set({
            status: "sending",
            startedAt: new Date(),
            recipientCount: recipients.length,
            sentCount: 0,
            failedCount: 0
        }).where((0, drizzle_orm_1.eq)(schema_1.smsCampaigns.id, campaignId));
        let sentCount = 0;
        let failedCount = 0;
        for (const recipient of recipients) {
            const personalizedMessage = campaign.message.replace(/\{\{first_name\}\}/gi, recipient.firstName);
            const result = await (0, twilioClient_1.sendSms)(recipient.normalizedPhone, personalizedMessage);
            if (result.status === "failed")
                failedCount++;
            else
                sentCount++;
            await db_1.db.insert(schema_1.smsMessages).values({
                campaignId,
                customerId: recipient.id,
                direction: "outbound",
                fromNumber: process.env.TWILIO_FROM_NUMBER || null,
                toNumber: recipient.normalizedPhone,
                body: (0, twilioClient_1.appendComplianceFooter)(personalizedMessage),
                status: result.status,
                providerMessageSid: result.sid || null,
                errorCode: result.errorCode || null,
                errorMessage: result.errorMessage || null,
                sentAt: result.status === "failed" ? null : new Date()
            });
        }
        const finalStatus = failedCount === recipients.length
            ? "failed"
            : failedCount > 0
                ? "partial"
                : twilioStatus.dryRun
                    ? "simulated"
                    : "sent";
        await db_1.db.update(schema_1.smsCampaigns).set({
            status: finalStatus,
            completedAt: new Date(),
            sentCount,
            failedCount
        }).where((0, drizzle_orm_1.eq)(schema_1.smsCampaigns.id, campaignId));
        await (0, audit_1.logAudit)(req, {
            action: twilioStatus.dryRun ? "SMS_CAMPAIGN_SIMULATED" : "SMS_CAMPAIGN_SENT",
            reason: `Campaign ${campaign.name}: ${sentCount} accepted, ${failedCount} failed.`
        });
        return res.json({
            campaignId,
            status: finalStatus,
            dryRun: twilioStatus.dryRun,
            recipientCount: recipients.length,
            sentCount,
            failedCount
        });
    }
    catch (error) {
        next(error);
    }
});
const validateWebhook = (req, res) => {
    const signature = req.header("x-twilio-signature");
    const url = (0, twilioClient_1.getWebhookUrl)(req.originalUrl);
    if (!(0, twilioClient_1.validateTwilioSignature)(url, req.body, signature)) {
        res.status(403).send("Invalid Twilio signature");
        return false;
    }
    return true;
};
const xmlEscape = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
exports.smsWebhookRouter.post("/inbound", async (req, res, next) => {
    try {
        if (!validateWebhook(req, res))
            return;
        const from = (0, twilioClient_1.normalizePhoneNumber)(req.body.From);
        const to = (0, twilioClient_1.normalizePhoneNumber)(req.body.To) || String(req.body.To || "");
        const body = String(req.body.Body || "").trim();
        const optOutType = String(req.body.OptOutType || "").toUpperCase();
        const keyword = optOutType || body.toUpperCase();
        const allCustomers = await db_1.db.select().from(schema_1.customers);
        const customer = from
            ? allCustomers.find(item => (0, twilioClient_1.normalizePhoneNumber)(item.phone) === from)
            : undefined;
        if (customer) {
            await db_1.db.insert(schema_1.smsMessages).values({
                customerId: customer.id,
                direction: "inbound",
                fromNumber: from,
                toNumber: to,
                body,
                status: "received",
                providerMessageSid: req.body.MessageSid || null
            });
        }
        const stopKeywords = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "REVOKE", "OPTOUT"];
        const startKeywords = ["START", "UNSTOP"];
        let reply = "Thanks for contacting Boudin Rewards. Reply HELP for help or STOP to opt out.";
        if (customer && stopKeywords.includes(keyword)) {
            await db_1.db.update(schema_1.customers).set({
                smsMarketingConsent: false,
                smsOptOutAt: new Date()
            }).where((0, drizzle_orm_1.eq)(schema_1.customers.id, customer.id));
            reply = "You are unsubscribed from Boudin Rewards marketing texts. Reply START to resubscribe.";
        }
        else if (customer && startKeywords.includes(keyword)) {
            await db_1.db.update(schema_1.customers).set({
                smsMarketingConsent: true,
                smsConsentAt: new Date(),
                smsConsentSource: "twilio-inbound-keyword",
                smsOptOutAt: null
            }).where((0, drizzle_orm_1.eq)(schema_1.customers.id, customer.id));
            reply = "You are subscribed to Boudin Rewards texts. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out.";
        }
        else if (keyword === "HELP") {
            reply = process.env.SMS_HELP_MESSAGE ||
                "Boudin Rewards support: contact the restaurant directly. Msg frequency varies. Reply STOP to opt out.";
        }
        const responseBody = optOutType
            ? `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`
            : `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${xmlEscape(reply)}</Message></Response>`;
        res.type("text/xml").send(responseBody);
    }
    catch (error) {
        next(error);
    }
});
exports.smsWebhookRouter.post("/status", async (req, res, next) => {
    try {
        if (!validateWebhook(req, res))
            return;
        const sid = String(req.body.MessageSid || "");
        const status = String(req.body.MessageStatus || "unknown");
        if (sid) {
            await db_1.db.update(schema_1.smsMessages).set({
                status,
                errorCode: req.body.ErrorCode ? String(req.body.ErrorCode) : null,
                errorMessage: req.body.ErrorMessage ? String(req.body.ErrorMessage) : null,
                deliveredAt: status === "delivered" ? new Date() : null
            }).where((0, drizzle_orm_1.eq)(schema_1.smsMessages.providerMessageSid, sid));
        }
        return res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
