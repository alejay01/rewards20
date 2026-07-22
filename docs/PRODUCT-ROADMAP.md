# Boudin Rewards 7-22 product plan

This repository starts from `alejay01/rewards20` and is being evolved into an original restaurant loyalty, guest-experience, and marketing platform. It should not copy Ovation's source code, brand, wording, or interface. Ovation is used only as a public product-category benchmark.

## Current platform strengths

The existing application already provides:

- Customer signup, profiles, points, tiers, QR membership cards, visits, purchases, and reward redemption
- Staff roles, permissions, password/PIN login, audit logs, receipt-claim review, and device controls
- Promotions, PWA/offline support, Docker-based MySQL testing, and a Hostinger-compatible single-process build
- Loyverse customer/receipt synchronization

## Capability map

| Product capability | Status | Notes |
| --- | --- | --- |
| Loyalty accounts, QR check-in, points, tiers, rewards | Existing | Core rewards engine |
| Permission-based SMS marketing | Implemented foundation | Twilio adapter, audience segments, dry-run, send cap, daylight window |
| Consent and opt-out controls | Implemented foundation | Separate SMS consent, source/time audit, STOP/START/HELP |
| Delivery tracking | Implemented foundation | Twilio status webhook and message log |
| Campaign console | Implemented foundation | Draft, preview, simulate/live-send controls |
| Customer feedback surveys | Next | Two-question SMS/web survey, QR entry points, order/location context |
| Guest recovery inbox | Next | Low-rating alerts, staff assignments, templates, offers, resolution SLA |
| Multi-location operational insights | Next | Locations, role scoping, category heatmaps, trends, goals |
| Reputation management | Next | Review-link routing, review-source aggregation through approved APIs |
| Win-back automations | Next | Lapsed segments exist; scheduled journeys need a reliable worker/cron |
| POS/order context | Partial | Loyverse exists; harden OAuth/token storage and add webhook-based sync |
| AI-assisted replies and insight summaries | Later | Add only with review/approval, brand voice controls, and privacy safeguards |

## SMS audience segments

- All opted-in active members
- Rookie tier
- Boss tier
- VIP by lifetime-spend threshold
- Birthdays in the current month
- Lapsed members with no visit in 30 days

Every segment requires an active customer, a valid phone number, and explicit `sms_marketing_consent`. The system appends `Reply STOP to opt out.` and records provider results.

Use `{{first_name}}` in a campaign to personalize the message.

## Delivery phases

### Phase 1 ? safe SMS release

1. Apply the generated MySQL migration.
2. Test campaigns with `SMS_DRY_RUN=true`.
3. Complete Twilio account verification and US A2P 10DLC or toll-free verification as applicable.
4. Configure inbound and status webhooks over HTTPS.
5. Review signup wording, privacy policy, terms, and campaign practices with qualified counsel.
6. Enable live sending for a small internal opt-in list, then gradually expand.

### Phase 2 ? guest feedback and recovery

Add locations, survey definitions, survey invitations, responses, issue categories, recovery cases, assignments, notes, offers, and resolution timestamps. Trigger a short feedback request after eligible purchases. High scores can receive a neutral public-review invitation; low scores should open a private recovery case without review gating.

### Phase 3 ? operations and reputation

Add location-level dashboards, role scoping, service/food/accuracy/speed tags, trend and heatmap views, goals, and approved review-platform integrations. Use official APIs and respect each platform's review-solicitation policies.

## Open-source comparison policy

Other public GitHub projects may inform architecture and user-flow ideas, but code should only be incorporated after checking the exact license, maintenance state, security posture, and dependency risk. This implementation does not copy source from the repositories found during the initial search.
