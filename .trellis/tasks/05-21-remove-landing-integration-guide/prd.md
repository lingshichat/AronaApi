# Remove landing integration guide

## Goal

Remove the homepage integration-guide block under the Base URL capsule because the current landing page should only show the hero wordmark, slogan, and compact copyable Base URL row.

## Requirements

* Remove the entire New API-compatible integration block from the public homepage hero.
* Preserve the top navigation, brand wordmark, slogan, and Base URL capsule with rotating endpoint suffix.
* Remove now-unused helper code/imports/constants caused by deleting the block.
* Keep runtime Base URL behavior unchanged: `/api/status` `server_address` first, then `window.location.origin` fallback.
* Keep translations valid; no new user-facing copy is introduced.
* Update project frontend spec if its required smoke checks still expect the removed block.

## Acceptance Criteria

* [x] `http://127.0.0.1:5173/` no longer renders the selected block containing `兼容 NEW API`, SDK Base URL, Auth header, common endpoints, or API-key CTA.
* [x] `http://localhost:3000/` no longer renders that block after rebuilding frontend assets and backend binary.
* [x] The Base URL capsule remains visible and copyable.
* [x] Frontend type-check/build passes for affected code.
* [x] Browser smoke shows no console error/warn on the landing page.

## Definition of Done

* Type-check/build completed with the project-local frontend toolchain.
* Backend preview rebuilt/restarted if needed to serve updated embedded frontend assets.
* Browser verification completed against the local page.
* Trellis spec reviewed and updated if behavior contract changed.

## Technical Approach

Remove the `IntegrationGuide` render call and delete the associated component/helper imports that become unused. Because the backend serves embedded `web/default/dist` assets on port `3000`, rebuild `web/default/dist` before rebuilding the Go backend preview binary.

## Decision (ADR-lite)

**Context**: The landing design previously allowed a compact integration block, but the current product direction is to remove it from the first screen.

**Decision**: Minimal removal from the homepage hero, preserving the Base URL capsule and endpoint suffix.

**Consequences**: The homepage becomes cleaner. Users lose immediate SDK/auth-header guidance on the hero; this remains out of scope unless another page or docs entry is requested.

## Out of Scope

* Redesigning the rest of the landing page.
* Changing docs links or API documentation content.
* Changing dashboard/API-key management flows.

## Technical Notes

* Main source file: `web/default/src/features/home/components/sections/hero.tsx`.
* Current backend preview on `:3000` serves embedded/dist frontend assets, not the Rsbuild dev server.
* Relevant specs:
  * `.trellis/spec/frontend/index.md`
  * `.trellis/spec/frontend/landing-page-design.md`
  * `.trellis/spec/frontend/local-development-environment.md`
## Verification

* `bun run build:check` passed from `web/default/`.
* Browser smoke passed for `http://127.0.0.1:5173/` and `http://127.0.0.1:3000/`.
* `3000` smoke had no console messages; `5173` only showed a browser autocomplete issue unrelated to the landing hero change.
