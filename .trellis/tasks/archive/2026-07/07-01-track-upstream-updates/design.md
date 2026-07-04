# Design: Track upstream updates

## Approach
Use an isolated merge branch from current `main`, merge `upstream/main`, resolve conflicts, then validate. This preserves the existing `main` state until the merge branch is reviewed.

## Branching
- Source branch: `main`
- Sync branch: `codex/track-upstream-updates`
- Merge source: `upstream/main`

## Conflict resolution policy
- Project identity and agent workflow files (`AGENTS.md`, `CLAUDE.md`, `.trellis/`, `.agents/`, `.codex/`, `.opencode/`) should preserve local AronaApi/Trellis instructions unless upstream changes are required for compatibility.
- Backend business logic conflicts in subscription/redemption/payment routes should preserve local embedded purchase and subscription redemption behavior, while integrating upstream fixes and route changes.
- Frontend conflicts should keep upstream architecture and dependency/security fixes, while preserving local branding/home-page and custom payment/redemption UX where still relevant.
- Generated i18n report files may follow upstream deletion/regeneration when they are reports rather than source translations.

## Validation
- `git status --short` for unresolved conflict state.
- `git diff --check` for conflict markers/trailing whitespace issues.
- Backend build/test using project-local Go toolchain when merge compiles far enough.
- Frontend install/build using project-local Bun only if dependencies are already available and lockfile state allows it.

## Rollback
- Before commit, `git merge --abort` can return to pre-merge branch state.
- After commit, branch isolation allows deleting/resetting only the sync branch without affecting `main`.
