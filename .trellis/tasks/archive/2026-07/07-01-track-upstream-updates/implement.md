# Implement plan: Track upstream updates

1. Ensure working tree has no staged unrelated files; keep `.codex-temp/` untracked.
2. Create/switch to `codex/track-upstream-updates` from current `main`.
3. Merge `upstream/main` into the sync branch.
4. Resolve conflicts in groups:
   - root docs and workflow instructions;
   - backend subscription/router conflicts;
   - frontend layout/auth/home/channel/key/redemption/setup/system/wallet conflicts;
   - generated i18n reports.
5. Run conflict-marker scan and `git status`.
6. Run targeted validation commands.
7. Summarize changed areas, conflict resolutions, and validation outcomes.
8. Do not push unless separately approved.

## Merge execution notes

- Created branch: `codex/track-upstream-updates`.
- Merged `upstream/main` into the branch.
- Resolved all 25 predicted conflict entries.
- Preserved local root instructions (`AGENTS.md`, `CLAUDE.md`).
- Preserved local minimal AronaApi landing hero while adopting upstream safer custom-home rendering.
- Preserved redemption subscription-code frontend logic where compatible.
- Adopted upstream payment settings and wallet components to match the updated frontend settings APIs.
- Added compatibility for legacy `/api/waffo-pancake/webhook` while also supporting upstream `/api/waffo-pancake/webhook/:env`; no-env legacy path skips env-match enforcement but keeps signature validation.
- Adjusted channel route registration order to register static routes before root wildcard routes.
- Updated local `model/redemption_test.go` for upstream database type setters.
- Hardened channel affinity cache tests against Windows timestamp key collisions.

## Validation

- `git diff --cached --check` passed.
- Conflict marker scan with `rg "^<<<<<<<|^=======|^>>>>>>>"` passed.
- `.tools/go/bin/go.exe test ./router ./model ./controller ./service` passed.
- `.tools/bun-windows-x64/bun.exe run --filter newapi-web typecheck` passed.
- `.tools/bun-windows-x64/bun.exe run --filter newapi-web build` passed.
- `.tools/go/bin/go.exe test ./...` was attempted but exceeded 6 minutes and was stopped; targeted backend package tests above passed.

## Remaining local untracked files

- `.codex-temp/` remains untracked and intentionally excluded.
