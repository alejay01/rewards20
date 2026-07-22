import crypto from "crypto";

export interface SmsSendResult {
  sid: string;
  status: string;
  dryRun: boolean;
  errorCode?: string;
  errorMessage?: string;
}

const boolFromEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

export const normalizePhoneNumber = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+") && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;

  return null;
};

export const appendComplianceFooter = (body: string) => {
  const clean = body.trim();
  if (/reply\s+stop\s+to\s+(end|opt\s*out)/i.test(clean)) return clean;
  return `${clean}\nReply STOP to opt out.`;
};

export const getTwilioStatus = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || "";
  const fromNumber = normalizePhoneNumber(process.env.TWILIO_FROM_NUMBER);
  const dryRun = boolFromEnv(process.env.SMS_DRY_RUN, true);
  const configured = Boolean(accountSid && authToken && (messagingServiceSid || fromNumber));

  return {
    configured,
    dryRun,
    accountSidMasked: accountSid ? `${accountSid.slice(0, 6)}...${accountSid.slice(-4)}` : null,
    sender: messagingServiceSid ? "Messaging Service" : fromNumber,
    validateSignatures: boolFromEnv(
      process.env.TWILIO_VALIDATE_SIGNATURES,
      process.env.NODE_ENV === "production"
    ),
    maxRecipientsPerRun: Math.max(1, parseInt(process.env.SMS_MAX_RECIPIENTS_PER_RUN || "50", 10))
  };
};

export const validateTwilioSignature = (
  url: string,
  params: Record<string, unknown>,
  providedSignature: string | undefined
) => {
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const status = getTwilioStatus();

  if (!status.validateSignatures) return true;
  if (!authToken || !providedSignature) return false;

  const payload = Object.keys(params)
    .sort()
    .reduce((result, key) => result + key + String(params[key] ?? ""), url);

  const expected = crypto
    .createHmac("sha1", authToken)
    .update(payload, "utf8")
    .digest("base64");

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(providedSignature);
  return expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

export const getWebhookUrl = (path: string) => {
  const base = (
    process.env.TWILIO_WEBHOOK_BASE_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}${path}`;
};

export const sendSms = async (to: string, rawBody: string): Promise<SmsSendResult> => {
  const status = getTwilioStatus();
  const normalizedTo = normalizePhoneNumber(to);
  if (!normalizedTo) {
    return {
      sid: "",
      status: "failed",
      dryRun: status.dryRun,
      errorCode: "INVALID_PHONE",
      errorMessage: "Phone number is not a valid E.164 or US number."
    };
  }

  const body = appendComplianceFooter(rawBody);
  if (status.dryRun) {
    return {
      sid: `DRYRUN-${crypto.randomUUID()}`,
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

  const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
  const authToken = process.env.TWILIO_AUTH_TOKEN as string;
  const form = new URLSearchParams({
    To: normalizedTo,
    Body: body,
    StatusCallback: getWebhookUrl("/api/sms/webhooks/status")
  });

  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    form.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
  } else if (process.env.TWILIO_FROM_NUMBER) {
    form.set("From", normalizePhoneNumber(process.env.TWILIO_FROM_NUMBER) || process.env.TWILIO_FROM_NUMBER);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form
    }
  );

  const payload = await response.json() as {
    sid?: string;
    status?: string;
    code?: number;
    message?: string;
  };

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
