# Connect New Frontend Pages

## Goal
Make the new web/default frontend match backend runtime routes closely enough that enabled pages do not fail from missing API routes, trailing-slash redirects, or static asset rate limiting during normal navigation.

## Requirements
- Keep the default frontend active.
- Fix confirmed missing backend routes used by the new frontend.
- Normalize obvious frontend API paths that currently rely on backend slash redirects.
- Reduce false page failures from web static asset rate limiting in local/default runtime.
- Remove the public homepage footer when the minimal homepage is active.
- Keep global branding consistent with the homepage wordmark and compact A mark.
- Avoid broad UI rewrites or unrelated feature work.
- Preserve current auth boundaries: admin/root pages should still require admin/root auth.

## Acceptance Criteria
- [x] Waffo Pancake wallet calls have matching backend routes when the feature is enabled.
- [x] /api/group/ and /api/prefill_group/ calls avoid redirect-only forms from the new frontend.
- [x] Static web assets are not blocked by the default web rate limiter during normal page navigation.
- [x] Homepage footer is removed from the default minimal landing page.
- [x] Login, setup, dashboard/sidebar, loading state, and favicon use the same AronaApi brand system.
- [x] Router changes are formatted with gofmt.
- [x] Frontend API changes build or typecheck if feasible in local environment.
- [x] Existing unrelated change .opencode/package.json is not touched.

## Technical Notes
- Backend routes live in `router/api-router.go` and `router/web-router.go`.
- Frontend API wrappers live under web/default/src/features/*/api.ts.
- Waffo Pancake controller functions already exist in controller/topup_waffo_pancake.go.
- Current logs show many web 429s for /static/js/async/...; this can break lazy-loaded pages.
- Some admin/root failures are expected auth behavior and should not be weakened.
- Brand assets live in `web/default/public/arona-mark.svg`, `logo.png`, and `favicon.ico`.
