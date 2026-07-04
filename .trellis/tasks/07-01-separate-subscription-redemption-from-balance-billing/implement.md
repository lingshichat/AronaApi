# Implementation plan

## Ordered checklist

1. Backend guard
   - Add explicit disabled error for subscription balance purchase.
   - Update `PurchaseSubscriptionWithBalance` or its controller entry so it cannot deduct quota or create `UserSubscription`.
   - If scope confirmed, reject user-facing subscription gateway endpoints too: Stripe, Creem, Epay, Waffo Pancake.

2. Backend tests
   - Add/adjust model test proving balance-pay subscription path does not mutate user quota.
   - Add/adjust route/controller test proving `POST /api/subscription/balance/pay` fails.
   - Ensure redemption subscription path still creates a subscription.

3. Frontend user flow
   - Remove subscription balance payment UI.
   - Replace user purchase action with redemption-code purchase guidance/CTA.
   - Remove built-in gateway purchase buttons for subscriptions if scope confirmed.

4. Admin UI cleanup
   - Remove or de-emphasize `allow_balance_pay` plan switch.
   - Keep subscription plan management and subscription redemption-code creation.

5. Validation
   - Backend targeted tests with local Go toolchain.
   - Frontend typecheck/build with project-local Bun.

## Validation commands

```powershell
$env:GOMODCACHE=(Resolve-Path .tools\gopath\pkg\mod).Path
$env:GOCACHE=(Resolve-Path .tools\gocache).Path
.\.tools\go\bin\go.exe test ./model ./controller ./router

.\.tools\bun-windows-x64\bun.exe run --filter newapi-web typecheck
.\.tools\bun-windows-x64\bun.exe run --filter newapi-web build
```

## Risk points

- `allow_balance_pay` exists in DB, backend DTO, and frontend types. Prefer leaving schema intact and making it inert instead of migration churn.
- Existing payment gateway code is broad. If the requested scope is “subscription no gateway”, reject only subscription purchase endpoints; do not touch wallet top-up gateways.
- Current local preview servers are running. Restart only if runtime verification is needed.

## Context manifests

Before `task.py start`, populate `implement.jsonl` and `check.jsonl` with these planning/research docs plus targeted code files.
