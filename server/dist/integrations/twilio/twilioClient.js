"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = exports.getWebhookUrl = exports.validateTwilioSignature = exports.getTwilioStatus = exports.appendComplianceFooter = exports.normalizePhoneNumber = void 0;
const crypto_1 = __importDefault(require("crypto"));
const boolFromEnv = (value, fallback) => {
    if (value === undefined)
        return fallback;
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};
const normalizePhoneNumber = (value) => {
    if (!value)
        return null;
    const trimmed = value.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (trimmed.startsWith("+") && digits.length >= 8 && digits.length <= 15) {
        return `+${digits}`;
    }
    if (digits.length === 10)
        return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1"))
        return `+${digits}`;
    return null;
};
exports.normalizePhoneNumber = normalizePhoneNumber;
const appendComplianceFooter = (body) => {
    const clean = body.trim();
    if (/reply\s+stop\s+to\s+(end|opt\s*out)/i.test(clean))
        return clean;
    return `${clean}\nReply STOP to opt out.`;
};
exports.appendComplianceFooter = appendComplianceFooter;
const getTwilioStatus = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || "";
    const fromNumber = (0, exports.normalizePhoneNumber)(process.env.TWILIO_FROM_NUMBER);
    const dryRun = boolFromEnv(process.env.SMS_DRY_RUN, true);
    const configured = Boolean(accountSid && authToken && (messagingServiceSid || fromNumber));
    return {
        configured,
        dryRun,
        accountSidMasked: accountSid ? `${accountSid.slice(0, 6)}...${accountSid.slice(-4)}` : null,
        sender: messagingServiceSid ? "Messaging Service" : fromNumber,
        validateSignatures: boolFromEnv(process.env.TWILIO_VALIDATE_SIGNATURES, process.env.NODE_ENV === "production"),
        maxRecipientsPerRun: Math.max(1, parseInt(process.env.SMS_MAX_RECIPIENTS_PER_RUN || "50", 10))
    };
};
exports.getTwilioStatus = getTwilioStatus;
const validateTwilioSignature = (url, params, providedSignature) => {
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";
    const status = (0, exports.getTwilioStatus)();
    if (!status.validateSignatures)
        return true;
    if (!authToken || !providedSignature)
        return false;
    const payload = Object.keys(params)
        .sort()
        .reduce((result, key) => result + key + String(params[key] ?? ""), url);
    const expected = crypto_1.default
        .createHmac("sha1", authToken)
        .update(payload, "utf8")
        .digest("base64");
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(providedSignature);
    return expectedBuffer.length === actualBuffer.length &&
        crypto_1.default.timingSafeEqual(expectedBuffer, actualBuffer);
};
exports.validateTwilioSignature = validateTwilioSignature;
const getWebhookUrl = (path) => {
    const base = (process.env.TWILIO_WEBHOOK_BASE_URL ||
        process.env.APP_URL ||
        "http://localhost:3000").replace(/\/$/, "");
    return `${base}${path}`;
};
exports.getWebhookUrl = getWebhookUrl;
const sendSms = async (to, rawBody) => {
    const status = (0, exports.getTwilioStatus)();
    const normalizedTo = (0, exports.normalizePhoneNumber)(to);
    if (!normalizedTo) {
        return {
            sid: "",
            status: "failed",
            dryRun: status.dryRun,
            errorCode: "INVALID_PHONE",
            errorMessage: "Phone number is not a valid E.164 or US number."
        };
    }
    const body = (0, exports.appendComplianceFooter)(rawBody);
    if (status.dryRun) {
        return {
            sid: `DRYRUN-${crypto_1.default.randomUUID()}`,
            status: "simulated",
            dryRun: true
        };
    }
    if (!status.configured) {
        return {
            sid: "",
            status: "failed",
            dryRun: false,
            errorCode: "TWILIO_NOT_CONFIGURED",
            errorMessage: "Twilio credentials and a sender are required when SMS_DRY_RUN=false."
        };
    }
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const form = new URLSearchParams({
        To: normalizedTo,
        Body: body,
        StatusCallback: (0, exports.getWebhookUrl)("/api/sms/webhooks/status")
    });
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
        form.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
    }
    else if (process.env.TWILIO_FROM_NUMBER) {
        form.set("From", (0, exports.normalizePhoneNumber)(process.env.TWILIO_FROM_NUMBER) || process.env.TWILIO_FROM_NUMBER);
    }
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: form
    });
    const payload = await response.json();
    if (!response.ok || !payload.sid) {
        return {
            sid: payload.sid || "",
            status: "failed",
            dryRun: false,
            errorCode: payload.code ? String(payload.code) : `HTTP_${response.status}`,
            errorMessage: payload.message || "Twilio rejected the message."
        };
    }
    return {
        sid: payload.sid,
        status: payload.status || "queued",
        dryRun: false
    };
};
exports.sendSms = sendSms;
