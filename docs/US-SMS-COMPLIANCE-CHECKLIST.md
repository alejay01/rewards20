# Boudin Rewards 7-22: US SMS registration checklist

Updated July 22, 2026. This is an operational checklist, not legal advice. Have qualified counsel review the final consent language, privacy policy, terms, and sending practices.

## Official links

- [Start US A2P 10DLC onboarding in Twilio Console](https://console.twilio.com/us1/develop/sms/regulatory-compliance/a2p-onboarding?activeStep=usA2POnboarding%3AbrandRegistration%3AbrandNeeds)
- [Twilio A2P 10DLC registration quickstart](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/quickstart)
- [Business and Campaign information required by Twilio](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/collect-business-info)
- [Direct Standard and Low-Volume Standard registration](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/direct-standard-onboarding)
- [Twilio Campaign registration recommendations](https://help.twilio.com/hc/en-us/articles/26149060902555-A2P-10DLC-Campaign-Registration-Recommendations)
- [Twilio Messaging Policy](https://www.twilio.com/en-us/legal/messaging-policy)
- [Create and configure a Messaging Service](https://www.twilio.com/docs/messaging/services)
- [Advanced Opt-Out setup](https://help.twilio.com/hc/en-us/articles/360034798533-Getting-Started-with-Advanced-Opt-Out-for-Messaging-Services)
- [Current A2P 10DLC pricing and fees](https://help.twilio.com/articles/1260803965530)
- [Toll-free verification alternative](https://www.twilio.com/docs/messaging/compliance/toll-free/console-onboarding)

## Decide how the business is registering

Use **Direct Customer** when The Boudin Company is sending only The Boudin Company's messages to its own customers.

Use the **ISV/reseller** registration path if Boudin Rewards will let multiple unrelated client businesses send messages under their own brands. Each client business must have the appropriate business profile, Brand, Campaign, consent flow, and sender. Do not place unrelated clients under The Boudin Company's Campaign.

For a US local ten-digit number, register for A2P 10DLC. A sole proprietor without an EIN uses the Sole Proprietor path. A business or sole proprietor with an EIN uses Low-Volume Standard or Standard, as appropriate. A US/Canada toll-free number uses Toll-Free Verification instead of A2P 10DLC.

## Prepare before opening the registration form

1. Upgrade Twilio to a paid account; trial accounts cannot register for A2P 10DLC.
2. Publish a real business website using the same business identity submitted to Twilio.
3. Publish public, no-login pages for:
   - Privacy Policy: `https://YOUR-DOMAIN/privacy`
   - SMS Terms: `https://YOUR-DOMAIN/sms-terms`
   - SMS enrollment: `https://YOUR-DOMAIN/join`
4. Buy an SMS-capable US local Twilio number.
5. Collect the exact legal business information shown on IRS/government records:
   - Legal name, DBA/brand name, entity type, EIN, industry, address, website, and social profiles
   - Authorized representative's name, title, business email, and mobile number
   - Brand contact email that can complete Twilio's identity verification
6. Decide the truthful Campaign use case. Use Marketing for recurring promotions. Use Low Volume Mixed only when eligible and when the traffic genuinely combines multiple declared use cases.

As of June 30, 2026, new Campaign registrations require valid, publicly accessible Privacy Policy and Terms & Conditions URLs.

## Required web consent presentation

Use a separate, unchecked SMS checkbox. Do not bundle SMS consent with rewards membership, purchases, general terms, or the privacy policy. Suggested copy for legal review:

> By checking this box, I agree to receive recurring automated rewards and marketing text messages from The Boudin Company/Boudin Rewards at the mobile number provided. Consent is not a condition of purchase. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. View the SMS Terms and Privacy Policy.

Both ?SMS Terms? and ?Privacy Policy? must be clickable public links near the checkbox. Retain the submitted phone number, checkbox state, disclosure version, timestamp, source URL/form, and IP/user agent where legally appropriate.

The Privacy Policy should clearly state that mobile information and SMS consent will not be shared with third parties or affiliates for their marketing or promotional purposes. It should disclose operational service providers, data use, retention, security, and a contact method.

The SMS Terms should identify the program and sender, describe the message categories, disclose that message frequency varies and message/data rates may apply, explain STOP and HELP, provide support contact information, state that consent is not a condition of purchase, link to the Privacy Policy, and include any other terms counsel determines are required.

## Twilio Console order

1. Open [A2P 10DLC Onboarding](https://console.twilio.com/us1/develop/sms/regulatory-compliance/a2p-onboarding?activeStep=usA2POnboarding%3AbrandRegistration%3AbrandNeeds).
2. Create and submit the Primary Customer Profile.
3. Register the Brand and complete email/mobile identity verification.
4. Create a Messaging Service named `Boudin Rewards US`.
5. Add the US local number to its Sender Pool.
6. Register a Campaign and associate that Messaging Service.
7. Wait until both Brand and Campaign are approved/verified before live sending.
8. Configure Advanced Opt-Out and the application webhooks.

## Copy-ready Campaign worksheet

Replace all bracketed values with truthful, publicly verifiable details before submission.

**Campaign name**

`The Boudin Company Boudin Rewards`

**Campaign description**

`The Boudin Company sends recurring rewards and marketing SMS messages to customers who explicitly opt in through the Boudin Rewards enrollment form at https://[DOMAIN]/join. Messages include loyalty point updates, available rewards, limited-time restaurant offers, birthday rewards, and win-back promotions. Only customers with recorded SMS marketing consent are eligible. Customers can reply STOP to unsubscribe or HELP for assistance.`

**Message flow / how recipients opt in**

`Customers visit https://[DOMAIN]/join, enter their mobile number, and affirmatively select a separate unchecked checkbox agreeing to receive recurring automated rewards and marketing text messages from The Boudin Company/Boudin Rewards. The disclosure states that consent is not a condition of purchase, message frequency varies, message and data rates may apply, and recipients may reply STOP to unsubscribe or HELP for help. The form links to https://[DOMAIN]/sms-terms and https://[DOMAIN]/privacy. The application records the consent timestamp and source. SMS consent is optional and is not bundled with acceptance of the general rewards terms.`

**Sample message 1**

`The Boudin Company Rewards: Hi [First Name], you have [Points] points and a [Reward] available. Visit [Business URL] for details. Reply STOP to unsubscribe.`

**Sample message 2**

`The Boudin Company Rewards: Hi [First Name], enjoy [Offer] through [Expiration Date] at participating locations. Terms: [Business URL]. Reply STOP to unsubscribe or HELP for help.`

Declare embedded links and phone numbers truthfully. Use only the business's branded domain or a reputable link domain; do not use public URL shorteners.

**Opt-in keywords**

Leave blank if initial enrollment is only through the website. Do not claim keyword enrollment unless the application and published terms support it. `START` can remain a re-subscription keyword for a previously opted-out customer.

**Opt-out keywords**

Use Twilio Advanced Opt-Out defaults, including `STOP`, `STOPALL`, `UNSUBSCRIBE`, `CANCEL`, `END`, `QUIT`, `REVOKE`, and `OPTOUT`.

**Help message**

`The Boudin Company Rewards: For help, visit https://[DOMAIN]/support or call [SUPPORT NUMBER]. Message and data rates may apply. Reply STOP to unsubscribe.`

## Application connection after approval

In the Messaging Service, configure HTTP POST webhooks:

- Incoming message: `https://YOUR-DOMAIN/api/sms/webhooks/inbound`
- Delivery status callback: `https://YOUR-DOMAIN/api/sms/webhooks/status`

Set these production environment variables in Hostinger, never in GitHub:

```env
APP_URL=https://YOUR-DOMAIN
CLIENT_URL=https://YOUR-DOMAIN
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=MG...
TWILIO_WEBHOOK_BASE_URL=https://YOUR-DOMAIN
TWILIO_VALIDATE_SIGNATURES=true
SMS_DRY_RUN=true
SMS_TIMEZONE=America/Chicago
SMS_ENFORCE_QUIET_HOURS=true
SMS_SEND_WINDOW_START=9
SMS_SEND_WINDOW_END=20
```

Keep `SMS_DRY_RUN=true` until the Brand and Campaign show approved, the sender is registered, HTTPS webhooks work, and a one-number internal test passes. Then change it to `false`, restart the application, and monitor Twilio Messaging Logs.

## Operating checklist

- Send only to recipients with documented consent for this sender and message category.
- Clearly identify The Boudin Company/Boudin Rewards in every message.
- Honor STOP immediately and suppress all further marketing messages.
- Provide a working HELP response and customer-support channel.
- Do not use purchased, rented, scraped, or shared phone lists.
- Do not transfer consent between unrelated brands or clients.
- Reconfirm consent when the program or message subject materially changes.
- Send during lawful recipient-local hours; the application uses the narrower configured 9 AM?8 PM window by default.
- Keep consent and opt-out evidence, campaign content, and delivery records.
- Monitor carrier filtering, error codes, opt-out rate, complaints, and Twilio policy changes.
- Obtain legal review for TCPA, Do-Not-Call, state mini-TCPA, promotion, and record-retention obligations.
