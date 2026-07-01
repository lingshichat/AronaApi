# PRD: Track upstream updates

## Goal
Merge the latest `upstream/main` changes from `QuantumNous/new-api` into this fork while preserving local AronaApi and Trellis customizations.

## User value
Keep this fork current with upstream provider support, bug fixes, frontend updates, and security/dependency changes, without losing local project identity or workflow tooling.

## Confirmed facts
- Remote `upstream` points to `https://github.com/QuantumNous/new-api`.
- Remote `origin` points to `https://github.com/lingshichat/AronaApi`.
- Current branch before sync is `main` at `42e463804 chore(trellis): update local workflow tooling`.
- Upstream target is `upstream/main` at `52858ad1e feat: support Wan2.7 i2v media mapping (#4984)`.
- Merge base is `e8cfb546f feat(default): add model performance badges`.
- Local is ahead of upstream merge base by 29 commits; upstream is ahead by 297 commits.
- Upstream-only range changes 1380 files with 104426 insertions and 41167 deletions.
- Local-only range changes 286 files, mainly Trellis/Codex/OpenCode tooling and AronaApi frontend/business customizations.
- `git merge-tree --write-tree HEAD upstream/main` predicts 25 conflict entries.
- `.codex-temp/` is local temporary output and must remain untracked.

## Requirements
1. Create/use a sync branch before applying upstream changes.
2. Merge `upstream/main` into the sync branch, not directly into `main` without branch isolation.
3. Resolve predicted conflicts by preserving local AronaApi branding, Trellis workflow tooling, and local business functionality unless upstream has clearly superseded the implementation.
4. Keep upstream bug fixes, dependency updates, provider updates, and security fixes wherever compatible.
5. Avoid committing temporary runtime outputs such as `.codex-temp/`.
6. Validate with targeted git checks and available project build/test commands where practical.

## Technical notes
Predicted conflict files:

- `AGENTS.md`
- `CLAUDE.md`
- `model/subscription.go`
- `router/api-router.go`
- `web/default/src/components/ai-elements/loader.tsx`
- `web/default/src/components/layout/components/footer.tsx`
- `web/default/src/components/layout/components/public-header.tsx`
- `web/default/src/components/layout/components/workspace-switcher.tsx` modify/delete
- `web/default/src/components/loading-state.tsx`
- `web/default/src/features/auth/auth-layout.tsx`
- `web/default/src/features/channels/api.ts`
- `web/default/src/features/home/components/sections/hero.tsx`
- `web/default/src/features/home/index.tsx`
- `web/default/src/features/keys/components/api-keys-dialogs.tsx`
- `web/default/src/features/redemption-codes/components/redemptions-columns.tsx`
- `web/default/src/features/redemption-codes/components/redemptions-mutate-drawer.tsx`
- `web/default/src/features/setup/setup-wizard.tsx`
- `web/default/src/features/system-settings/billing/section-registry.tsx`
- `web/default/src/features/system-settings/general/system-info-section.tsx`
- `web/default/src/features/system-settings/integrations/payment-settings-section.tsx`
- `web/default/src/features/wallet/components/recharge-form-card.tsx`
- `web/default/src/features/wallet/components/subscription-plans-card.tsx`
- `web/default/src/i18n/locales/_reports/_sync-report.json`
- `web/default/src/i18n/locales/_reports/ja.untranslated.json` modify/delete
- `web/default/src/main.tsx`

## Acceptance criteria
- A sync branch exists and contains the merge result.
- `git status` has no unresolved merge conflicts.
- Conflict resolutions preserve local identity/workflow files and local embedded purchase/subscription/redemption behavior.
- `.codex-temp/` is not staged or committed.
- Validation results are reported with exact commands and outcomes.

## Out of scope
- Pushing to `origin`.
- Opening a PR.
- Removing `.codex-temp/` unless explicitly requested.
- Reworking unrelated local features beyond what is needed for merge correctness.

## Open questions
None. The user approved proceeding with the recommended sync branch merge flow.
