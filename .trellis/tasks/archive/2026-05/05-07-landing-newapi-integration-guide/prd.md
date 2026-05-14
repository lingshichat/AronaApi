# Landing New API integration guide

## Goal

Update the local AronaApi public landing page so it keeps the current minimal AronaApi visual style while exposing a clear, New API-compatible onboarding path for developers.

## What I already know

* User wants the local AronaApi landing page to follow the standard New API integration/onboarding convention.
* User asked to use the brainstorm flow first and create a new task for review before implementation.
* Current homepage hero lives in `web/default/src/features/home/components/sections/hero.tsx`.
* Current hero already reads `server_address` from `/api/status`, falls back to `window.location.origin`, displays rotating OpenAI-compatible suffixes, and copies only the base domain.
* Frontend spec requires the public homepage to stay minimal, keep short copy, use `systemName`, and preserve New API / QuantumNous attribution.
* Existing API example logic exists in `web/default/src/features/pricing/components/model-details-api.tsx` and should be referenced or reused conceptually instead of inventing a conflicting convention.

## Assumptions (temporary)

* “New API 接入规范” means the landing page should make the standard OpenAI-compatible access pattern obvious: Base URL, `/v1` suffix, Bearer token, API key acquisition, common endpoint examples.
* The landing page should not become a full documentation page.
* The accepted direction is option A: keep the onboarding inside the hero as a compact block.
* Option A does not block future scroll-based homepage sections; this task only adds a lightweight onboarding entry inside the first hero screen.
* AronaApi branding remains primary; New API is preserved as compatibility/attribution.

## Open Questions

* Resolved: use option A — add a compact integration block inside the existing hero, not a separate section.

## Requirements (evolving)

* Keep current AronaApi minimal dark hero and `BrandWordmark` behavior.
* Keep Base URL sourced from `/api/status` `server_address`, with `window.location.origin` fallback.
* Add a compact hero-internal integration block.
* Display New API-compatible access details in a concise way:
  * Base URL for SDKs: `<server>/v1`
  * Auth header: `Authorization: Bearer <API_KEY>`
  * Common endpoints: `/v1/responses`, `/v1/chat/completions`, `/v1/images/generations`, `/v1/embeddings`
  * Primary action to create/manage API keys, preferably routing authenticated users to the keys page and guests to sign-in/sign-up.
* Avoid dense dashboard panels, charts, model cards, a separate long section, or a documentation wall.
* Preserve New API / QuantumNous attribution.
* Add or update i18n keys for all user-facing copy across supported frontend locales if new text is introduced.

## Acceptance Criteria (evolving)

* [ ] Landing page clearly shows how to connect using New API-compatible OpenAI SDK conventions inside the hero.
* [ ] Base URL display and copy behavior remain correct.
* [ ] CTA path for API key access is present and works for guest/authenticated states.
* [ ] Page still follows `.trellis/spec/frontend/landing-page-design.md` visual constraints.
* [ ] Frontend typecheck and lint pass from `web/default/`.
* [ ] Relevant i18n files are updated or verified.

## Definition of Done

* PRD approved by user before implementation.
* `implement.jsonl` and `check.jsonl` include relevant frontend spec context.
* Implementation is done by the Trellis implement flow after approval.
* Trellis check flow verifies the result.
* No push.

## Out of Scope

* Full documentation site rewrite.
* Changing backend API behavior.
* Changing billing or model pricing logic.
* Removing New API / QuantumNous attribution.
* Pushing to GitHub.

## Technical Notes

* Frontend spec index: `.trellis/spec/frontend/index.md`.
* Landing spec: `.trellis/spec/frontend/landing-page-design.md`.
* Current hero: `web/default/src/features/home/components/sections/hero.tsx`.
* Existing detailed API samples: `web/default/src/features/pricing/components/model-details-api.tsx`.
* Current repository also has an in-progress upstream merge task; this landing task should remain in planning until the user approves scope.




