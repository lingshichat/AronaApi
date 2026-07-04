# sub2api redemption / balance / subscription flow research

## Snapshot

Reference clone: `E:\A_programming\AronaApi\.codex-temp\research\sub2api`
Observed commit: `7dc7cfce chore: sync VERSION to 0.1.142 [skip ci]`

## Data model

- Redeem codes are a single table with typed benefits. `E:\A_programming\AronaApi\.codex-temp\research\sub2api\backend\ent\schema\redeem_code.go` defines `code`, `type`, `value`, `status`, `used_by`, `used_at`, `expires_at`, and subscription-specific `group_id` + `validity_days`.
- Redeem types are explicit constants in `E:\A_programming\AronaApi\.codex-temp\research\sub2api\backend\internal\domain\constants.go`: `balance`, `concurrency`, `subscription`, `invitation`.
- Subscription entitlement is not wallet balance. It is `user_subscriptions`, keyed by `user_id` + `group_id`, with start/end/status and daily/weekly/monthly usage windows in `E:\A_programming\AronaApi\.codex-temp\research\sub2api\backend\ent\schema\user_subscription.go`.
- Subscription plans are modeled as groups. `groups.subscription_type` distinguishes `standard` balance billing from `subscription` quota-window billing in `E:\A_programming\AronaApi\.codex-temp\research\sub2api\backend\ent\schema\group.go`.

## User redeem flow

`RedeemService.Redeem` is the decisive flow: `E:\A_programming\AronaApi\.codex-temp\research\sub2api\backend\internal\service\redeem_service.go:378`.

1. Rate-limit failed attempts and take a short redeem-code lock.
2. Fetch code, reject missing/expired/used.
3. In a DB transaction, first claim the code with optimistic `status = unused` semantics.
4. Dispatch by type:
   - `balance`: add/subtract user balance; negative values are clamped so balance does not go below zero (`redeem_service.go:442`).
   - `concurrency`: add/subtract concurrency, also clamped.
   - `subscription`: requires `group_id`; positive `validity_days` calls `AssignOrExtendSubscription`, negative days reduce/cancel subscription (`redeem_service.go:462`, `redeem_service.go:473`).
5. Invalidate relevant auth/billing/subscription caches after commit (`redeem_service.go:495`, `redeem_service.go:512`).

Important property: subscription redemption never spends user balance. It grants or adjusts a `user_subscriptions` record.

## Admin / external purchase integration

The documented external integration is `POST /api/v1/admin/redeem-codes/create-and-redeem`.

- Handler: `E:\A_programming\AronaApi\.codex-temp\research\sub2api\backend\internal\handler\admin\redeem_handler.go:168`.
- Request DTO supports caller-provided `code`, `type`, `value`, `user_id`, `group_id`, `validity_days`, `notes`, and expiry (`redeem_handler.go:48`).
- For `subscription`, the handler requires `group_id` and non-zero `validity_days` (`redeem_handler.go:186`).
- It runs through admin idempotency middleware with `Idempotency-Key` (`redeem_handler.go:203`).
- If the same code was already used by the same user, it returns success; if used by another user, it returns conflict (`redeem_handler.go:239`).

The doc `E:\A_programming\AronaApi\.codex-temp\research\sub2api\docs\ADMIN_PAYMENT_INTEGRATION_API.md` describes this as the server-to-server boundary for an external payment system: after third-party success, call create-and-redeem using an admin API key.

## Built-in payment flow in sub2api

Sub2api also has a full payment subsystem, but it is optional for our desired scope.

- `PaymentService.CreateOrder` defaults to balance orders; subscription orders require a plan (`E:\A_programming\AronaApi\.codex-temp\research\sub2api\backend\internal\service\payment_order.go:23`, `payment_order.go:120`).
- Balance payment fulfillment creates/reuses a `balance` redeem code and redeems it (`E:\A_programming\AronaApi\.codex-temp\research\sub2api\backend\internal\service\payment_fulfillment.go:223`, `payment_fulfillment.go:275`).
- Subscription payment fulfillment directly calls `AssignOrExtendSubscription` after payment success (`payment_fulfillment.go:396`, `payment_fulfillment.go:437`).

For AronaApi, the relevant reusable idea is not the gateway subsystem. The useful pattern is the typed redemption code plus an idempotent admin API that can be called by a third-party seller.

## Fit for AronaApi

AronaApi already has the simpler version of the useful pieces:

- `E:\A_programming\AronaApi\model\redemption.go` supports `quota` and `subscription` redemption types. Subscription redemption calls `CreateUserSubscriptionFromPlanTx` without touching user quota/balance (`model\redemption.go:184`, `model\redemption.go:192`).
- `E:\A_programming\AronaApi\controller\redemption.go` lets admins create subscription redemption codes by selecting a plan (`controller\redemption.go:231`).
- `E:\A_programming\AronaApi\web\default\src\features\wallet\purchase-page.tsx` already exposes an embedded purchase page for buying quota/subscription codes externally, then redeeming inside Wallet.

The mismatch is current subscription purchase: AronaApi still exposes direct subscription purchase via wallet balance and gateway endpoints. That conflicts with the requested rule.
