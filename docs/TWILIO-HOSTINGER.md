# Twilio SMS and Hostinger deployment

For the complete US registration sequence, official Twilio links, consent requirements, and copy-ready Campaign answers, see [US SMS compliance checklist](US-SMS-COMPLIANCE-CHECKLIST.md).

## Safety defaults

The application ships with `SMS_DRY_RUN=true`. In dry-run mode it creates normal campaign and message-log records but does not call Twilio. Leave this enabled until consent wording, Twilio registration, webhook validation, and an internal test list are ready.

Never commit a Twilio Auth Token, API key, database password, or application secret.

## Twilio setup

1. Create or use a Twilio account owned by the business.
2. Complete the sender registration required for the countries you will message. For US marketing traffic, follow Twilio's current A2P 10DLC or toll-free verification requirements.
3. Prefer a Twilio Messaging Service and add the approved sender to it.
4. In the Messaging Service inbound settings, set the incoming-message webhook to:
   `https://YOUR-DOMAIN.example/api/sms/webhooks/inbound`
5. The application supplies this status callback on every outbound message:
   `https://YOUR-DOMAIN.example/api/sms/webhooks/status`
6. Use HTTPS and do not place the Hostinger application behind a redirect that changes either webhook URL. Twilio signatures include the exact URL.

## Hostinger environment variables

Set these in the Hostinger Node.js application settings:

```env
APP_URL=https://YOUR-DOMAIN.example
CLIENT_URL=https://YOUR-DOMAIN.example
SMS_DRY_RUN=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=replace-in-hostinger-only
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=
TWILIO_WEBHOOK_BASE_URL=https://YOUR-DOMAIN.example
TWILIO_VALIDATE_SIGNATURES=true
SMS_MAX_RECIPIENTS_PER_RUN=50
SMS_TIMEZONE=America/Chicago
SMS_ENFORCE_QUIET_HOURS=true
SMS_SEND_WINDOW_START=9
SMS_SEND_WINDOW_END=20
SMS_VIP_SPEND_THRESHOLD=100
SMS_HELP_MESSAGE=Boudin Rewards support: call YOUR-SUPPORT-NUMBER. Reply STOP to opt out.
```

Use either `TWILIO_MESSAGING_SERVICE_SID` or `TWILIO_FROM_NUMBER`. A Messaging Service is recommended. Keep `SMS_DRY_RUN=true` for the first deployment.

## Database and build

From the project root:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run db:migrate
```

For Hostinger shared Node hosting, upload the server deployment bundle described in the main README, select `dist/index.js` as the entry file, configure the environment variables, run migrations, and restart the application.

For a Hostinger VPS, Docker can be used. The included Docker Compose configuration keeps SMS in dry-run mode by default.

## Verification checklist

1. Open `/health` and confirm the database status is active.
2. Log in as an Administrator or Manager and open **SMS Campaigns**.
3. Confirm the banner says **Dry-run mode**.
4. Opt in a test customer from the customer profile.
5. Create a draft containing `Hi {{first_name}}` and preview the audience.
6. Simulate the campaign and confirm counts and message logs.
7. In a non-production Twilio test environment, exercise webhook signature validation.
8. After business/legal approval and sender registration, set `SMS_DRY_RUN=false`, restart, and live-test with a single internal number during the configured daytime window.
9. Text STOP and confirm the customer becomes ineligible for subsequent campaigns.
10. Text START and confirm re-subscription; text HELP and verify the configured support text.

## Compliance responsibilities

The technical controls reduce risk but do not replace legal review. The business is responsible for obtaining valid consent, retaining evidence, honoring opt-outs, sending only within permitted hours, maintaining required terms/privacy disclosures, following carrier/Twilio policies, and complying with TCPA and all other laws applicable to each recipient and jurisdiction.
