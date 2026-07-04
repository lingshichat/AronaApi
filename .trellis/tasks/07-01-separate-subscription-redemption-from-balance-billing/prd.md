# PRD: Separate subscription redemption from balance billing

## Goal

Make subscription entitlement acquisition independent from wallet/quota balance. Users must not be able to buy subscriptions with internal balance. Balance is only for metered pay-as-you-go API usage. Subscription access should come from redemption codes purchased or issued externally, or from explicit admin assignment.

## User value

Operators can sell subscription redemption codes through a third-party channel without wiring a payment gateway into AronaApi. Users redeem codes inside AronaApi to activate subscription plans. Wallet balance remains a pure pay-as-you-go balance and cannot be converted into subscription entitlement.

## Confirmed reference findings: sub2api

Reference clone: `E:\A_programming\AronaApi\.codex-temp\research\sub2api`.
Detailed research: `E:\A_programming\AronaApi\.trellis\tasks\07-01-separate-subscription-redemption-from-balance-billing\research\sub2api-flow.md`.

- `sub2api` uses typed redeem codes: `balance`, `concurrency`, `subscription`, `invitation`.
- A subscription redeem code has `group_id` and `validity_days`; redeeming it creates or extends subscription entitlement, not user balance.
- Its external purchase integration centers on `POST /api/v1/admin/redeem-codes/create-and-redeem`, with admin API key + `Idempotency-Key` semantics.
- It also has a built-in payment subsystem, but that is not the part needed for this request. The relevant pattern is typed code redemption and idempotent external fulfillment.

## Confirmed AronaApi facts

Already aligned:

- `E:\A_programming\AronaApi\model\redemption.go` supports quota and subscription redemption code types.
- `E:\A_programming\AronaApi\model\redemption.go:184` dispatches subscription redemption separately from quota redemption.
- `E:\A_programming\AronaApi\model\redemption.go:192` grants subscription via `CreateUserSubscriptionFromPlanTx(..., "redemption")` without spending wallet quota.
- `E:\A_programming\AronaApi\controller\redemption.go:231` validates admin-created subscription redemption codes against an enabled subscription plan.
- `E:\A_programming\AronaApi\web\default\src\features\wallet\purchase-page.tsx` already provides an embedded external purchase page pattern for buying quota/subscription codes, followed by in-app redemption.

Conflicting with the requested rule:

- `E:\A_programming\AronaApi\router\api-router.go:158` exposes `POST /api/subscription/balance/pay`.
- `E:\A_programming\AronaApi\controller\subscription.go:100` handles subscription balance payment.
- `E:\A_programming\AronaApi\model\subscription.go:727` deducts user quota/balance and creates a subscription through `PurchaseSubscriptionWithBalance`.
- `E:\A_programming\AronaApi\model\subscription.go:205` and `E:\A_programming\AronaApi\controller\subscription.go:168` default `allow_balance_pay` to true.
- `E:\A_programming\AronaApi\web\default\src\features\subscriptions\components\dialogs\subscription-purchase-dialog.tsx:239` calls balance purchase, and `:362` renders “Pay with Balance”.
- Built-in subscription gateway purchase endpoints also exist at `E:\A_programming\AronaApi\router\api-router.go:159-162`.

## Requirements

R1. Wallet/quota balance must never be accepted as payment for subscription acquisition.

R2. Subscription code redemption must remain supported:
- admin can create subscription redemption codes bound to a plan;
- user redeems code in Wallet;
- successful redemption creates a `UserSubscription` with source `redemption`.

R3. Balance/quota redemption must remain supported for metered pay-as-you-go usage.

R4. Subscription plans remain admin-managed entitlement templates, including duration, quota, reset period, group upgrade/downgrade, max purchase count, and wallet overflow behavior.

R5. User-facing direct subscription purchase via balance must be removed or blocked in both UI and API.

R6. Built-in subscription payment gateways are out of scope for this phase. If implemented now, the user-facing subscription gateway buttons/endpoints should be hidden or rejected, while wallet top-up gateways are not necessarily affected.

R7. Keep database compatibility and avoid destructive migrations. Existing `allow_balance_pay` columns may stay for compatibility, but must not make subscription balance purchase possible.

## Acceptance criteria

AC1. Calling `POST /api/subscription/balance/pay` cannot create a subscription and cannot deduct user quota/balance.

AC2. The user-facing subscription purchase UI does not show “Pay with Balance”.

AC3. The user-facing subscription acquisition path directs users to purchase/redeem a redemption code instead of paying from wallet balance.

AC4. Admin-created subscription redemption code still redeems successfully into a `UserSubscription`.

AC5. Quota/balance redemption code behavior is unchanged.

AC6. No payment gateway integration is added for this task.

AC7. Validation includes targeted backend tests and frontend typecheck/build where feasible.

## Out of scope

- Implementing a new payment gateway.
- Building a full third-party seller backend.
- Removing wallet top-up/pay-as-you-go balance usage.
- Destroying or migrating historical subscription orders.

## Planning artifacts

- Design: `E:\A_programming\AronaApi\.trellis\tasks\07-01-separate-subscription-redemption-from-balance-billing\design.md`
- Implementation plan: `E:\A_programming\AronaApi\.trellis\tasks\07-01-separate-subscription-redemption-from-balance-billing\implement.md`
- Reference research: `E:\A_programming\AronaApi\.trellis\tasks\07-01-separate-subscription-redemption-from-balance-billing\research\sub2api-flow.md`

## Open question

Should this phase disable only wallet-balance subscription purchase, or also disable all built-in subscription payment gateway purchase endpoints/buttons and leave subscription acquisition exclusively to redemption codes/admin assignment?

Recommended answer: disable all user-facing direct subscription purchase endpoints/buttons for this phase. Trade-off: stricter and matches “payment gateway 暂时不想弄”, but existing Stripe/Creem/Epay/Waffo subscription purchase flows become unavailable until deliberately re-enabled later.
