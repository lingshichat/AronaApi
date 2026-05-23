# Embedded purchase page and subscription redemption codes

## Goal

Add a self-hosted purchase path that bypasses the built-in New API payment gateways by routing users to an embedded purchase page, while extending redemption codes so sold codes can grant either quota balance or subscription plans.

## What I already know

* The current wallet purchase fallback is `TopUpLink`, exposed by `/api/user/topup/info` as `topup_link` and rendered in `web/default/src/features/wallet/components/recharge-form-card.tsx` as `Need a code? Purchase here`.
* That fallback currently opens an external link in a new tab and expects users to redeem a balance code afterward.
* Existing redemption codes only support quota: `model.Redemption` has `Quota` but no plan/type fields, and `model.Redeem()` only updates `users.quota`.
* Existing subscription binding already has a no-payment path: `model.AdminBindSubscription(userId, planId, "")`, used by admin APIs.
* Existing user subscription purchase supports Epay/Stripe/Creem only; the desired feature should bypass those gateways.
* Payment gateway settings live in `web/default/src/features/system-settings/integrations/payment-settings-section.tsx`.
* Settings/options are stored through `model.Option`, `common.OptionMap`, and `/api/option` root-admin updates.

## Assumptions (temporary)

* The embedded purchase page is an internal authenticated AronaApi route, not a third-party checkout SDK.
* MVP can use external/manual fulfillment: user buys on embedded page, receives a redemption code, then redeems it in wallet.
* Subscription redemption should reuse existing subscription plan definitions and binding logic instead of inventing a parallel subscription system.
* The embedded page uses iframe plus administrator-provided fallback instructions/links for MVP.

## Requirements (evolving)

* Add redemption code types:
  * quota code: current behavior, adds quota balance.
  * subscription code: grants a selected subscription plan.
* Extend admin redemption-code create/edit/list UI to support selecting quota vs subscription and selecting a plan for subscription codes.
* Extend backend redemption model, migrations, create/update APIs, and redeem logic for cross-database compatibility: SQLite, MySQL, PostgreSQL.
* Keep existing quota redemption codes backward-compatible.
* Add an “embedded page purchase” gateway/config block under system settings → integrations/payment settings.
* The embedded purchase page must be authenticated-only; guests should be redirected to sign in before viewing it.
* Let admins enable/disable embedded purchase and configure how it opens from user purchase flows.
* When enabled, both wallet purchase links and subscription purchase buttons should open the same embedded purchase page instead of relying on Epay/Stripe/Creem/Waffo.
* The embedded page should show an iframe purchase site plus fallback instructions and an external-open link, without requiring built-in payment gateways.

## Acceptance Criteria (evolving)

* [ ] Existing quota redemption codes still redeem quota exactly as before.
* [ ] Admin can create a subscription redemption code linked to a subscription plan.
* [ ] A user redeeming a subscription code receives the plan benefits via existing subscription logic.
* [ ] Used/expired/disabled subscription codes cannot be redeemed.
* [ ] Subscription codes linked to missing or disabled plans cannot be redeemed.
* [ ] Redemption logs clearly distinguish quota redemption and subscription redemption.
* [ ] System settings → payment gateway area includes embedded purchase settings for enable switch, purchase URL, and fallback instructions.
* [ ] When embedded purchase is enabled, wallet purchase links and subscription purchase buttons open the same authenticated internal embedded purchase page with iframe plus fallback instructions.
* [ ] Guests cannot access the embedded purchase page directly and are redirected to sign in.
* [ ] If embedded purchase is disabled, existing payment gateway behavior remains unchanged.
* [ ] Frontend i18n is updated for all supported locales: en, zh, fr, ja, ru, vi.
* [ ] Backend migration works across SQLite, MySQL, and PostgreSQL.

## Definition of Done

* Backend tests cover quota redemption compatibility and subscription redemption success/failure paths.
* Frontend type-check/build passes with the project-local Bun/Rsbuild toolchain.
* Browser smoke verifies admin configuration, code creation, purchase page opening, and redemption flow.
* Specs/notes updated if a new payment/redemption convention is introduced.

## Technical Approach

### Backend

* Extend `model.Redemption` with minimal fields:
  * `Type` or `Kind`: `quota` / `subscription`.
  * `PlanId`: subscription plan id for subscription codes.
* Add migration columns using project cross-DB migration patterns.
* Update create/update validation:
  * quota code requires positive quota.
  * subscription code requires a valid enabled plan id at creation time.
  * subscription code redemption requires the linked plan to still exist and remain enabled.
* Update `model.Redeem()` to perform a single transaction:
  * lock redemption row.
  * validate status and expiry.
  * for quota: update `users.quota`.
  * for subscription: create user subscription from plan inside transaction, using shared subscription logic or a transaction-safe variant.
  * mark code used.
* Update API response so frontend can show what was redeemed.

### Frontend

* Redemption code admin UI:
  * add type selector.
  * conditionally show quota input or subscription plan selector.
  * show code type and plan in table/details.
* Wallet UI:
  * keep code redemption entry.
  * update success messages for quota vs subscription.
* Payment settings UI:
  * add an embedded purchase block near gateway settings.
  * suggested config fields:
    * enabled: boolean.
    * mode: fixed MVP behavior: iframe plus fallback instructions/external link.
    * purchase URL and fallback instructions.
    * open behavior: internal authenticated page; page includes external-open fallback.
* Purchase page:
  * authenticated internal route such as `/wallet/purchase`.
  * shows configured iframe or instructions.
  * includes a direct redemption input or link back to wallet redemption section.

## Proposed MVP

Recommended MVP:

* Implement subscription-capable redemption codes.
* Implement internal purchase page with iframe plus fallback instructions/external-open link.
* Configure it from system settings → integrations/payment settings.
* Route wallet “Purchase here” and subscription purchase buttons to the same internal purchase page when enabled.
* Do not implement automatic payment confirmation in this task.

## Future Evolution

* Add webhook/API integration for the external shop to generate or bind redemption codes automatically.
* Add order tracking inside AronaApi.
* Add one-click post-purchase redeem if the external shop can redirect with a code.
* Add per-plan purchase URLs or per-plan embedded checkout pages.

## Failure & Edge Cases

* Iframe may fail if purchase site sets `X-Frame-Options` or CSP `frame-ancestors`; instructions mode must be available as fallback.
* Subscription plans can be deleted/disabled after a code is created; redeem must reject subscription codes whose linked plan no longer exists or is disabled.
* Concurrent redemption must remain single-use.
* Existing codes without type should be treated as quota codes.
* Need clear permission boundary: only admins/root can configure embedded purchase and create subscription codes.

## Out of Scope

* Building a full payment gateway inside AronaApi.
* Automatically confirming third-party payments.
* Handling refunds/chargebacks.
* Migrating existing quota codes to subscription codes.
* Replacing existing Epay/Stripe/Creem/Waffo flows.

## Technical Notes

* Existing wallet purchase fallback:
  * `controller/topup.go` → `GetTopUpInfo()` returns `topup_link`.
  * `common/constants.go` → `TopUpLink`.
  * `model/option.go` → `TopUpLink` option storage.
  * `web/default/src/features/wallet/components/recharge-form-card.tsx` renders `Purchase here`.
* Existing redemption flow:
  * `model/redemption.go` → `Redemption`, `Redeem()`.
  * `controller/user.go` → `TopUp()` calls `model.Redeem()`.
  * `web/default/src/features/redemption-codes/*` admin UI currently quota-only.
* Existing subscription no-payment binding:
  * `model/subscription.go` → `AdminBindSubscription()`.
  * `controller/subscription.go` → admin bind/create subscription endpoints.
* Existing payment settings UI:
  * `web/default/src/features/system-settings/integrations/payment-settings-section.tsx`.

## Decision Log

* Embedded purchase page access: authenticated-only. Guests should be redirected to sign in.
* Subscription redemption plan availability: require the linked plan to exist and remain enabled at redemption time.
* Embedded purchase page content: iframe plus fallback instructions/external-open link for MVP.
* Embedded purchase routing: wallet purchase links and subscription purchase buttons both route to the same embedded purchase page.

## Open Questions

* Final confirmation pending before implementation.





