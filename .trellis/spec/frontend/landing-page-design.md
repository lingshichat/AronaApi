# Landing Page Design

## AronaApi-style minimal hero

The default public homepage uses a restrained dark hero inspired by minimalist
AI SaaS landing pages.

## Composition

- Full viewport hero.
- Left top: compact uppercase brand derived from `systemName`.
- Right top: only authentication entry points.
- Center: large `systemName` wordmark.
- Center subtitle: short slogan.
- Under subtitle: compact copyable Base URL field in the original New API split
  style: base domain on the left, endpoint suffix on the right.
- Footer uses `AronaApi` as the primary copyright display while preserving
  `New API` / `QuantumNous` as secondary attribution.

## Visual language

- Background: near-black, subtle SVG grain, dynamic blue-purple aurora glow
  centered behind the wordmark.
- Typography: large, light-weight wordmark with tight tracking.
- Accent: only the trailing `Api` suffix uses blue-purple gradient glow.
- Base URL material: small smoky glass capsule, low-contrast violet hairline,
  muted text, and no bright SaaS card treatment.
- UI chrome: no dashboard panels, model cards, charts, code waterfalls, or
  network-node decoration in the hero.

## Runtime rules

- Brand text must come from `useSystemConfig().systemName`.
- The default fallback is `AronaApi`.
- Shared brand rendering lives in `web/default/src/components/brand-wordmark.tsx`.
- Non-component brand helpers live in `web/default/src/lib/brand.ts` so React
  Fast Refresh does not warn about mixed component/helper exports.
- The compact icon mark is `web/default/public/arona-mark.svg`. It is a
  transparent SVG based on the `A` letterform, with a white left stroke and
  blue-purple right stroke. Use it through `BrandIconImage` for auth pages,
  dashboard sidebar, setup, and loading states.
- `DEFAULT_LOGO` must point at `/arona-mark.svg`. `index.html` should register
  the SVG favicon first and keep PNG/ICO fallbacks for browser compatibility.
- Base URL must come from `/api/status` `server_address` when present.
- If `server_address` is missing, fall back to `window.location.origin`.
- The copy action must copy only the base domain/address, not the endpoint
  suffix.
- The endpoint suffix is displayed separately and may rotate between common
  OpenAI-compatible paths such as `/v1/responses` and
  `/v1/chat/completions`.
- Use the shared `CopyButton` for clipboard behavior.

## Brand system contract

### Signatures

```ts
// web/default/src/lib/brand.ts
getBrandDisplayName(name?: string | null): string

// web/default/src/components/brand-wordmark.tsx
<BrandWordmark name={systemName} size="xs|sm|md|lg|hero" animated />
<BrandIconImage name={systemName} size="xs|sm|md|lg" />
```

### Good / Base / Bad cases

- Good: homepage hero uses `BrandWordmark` with `size="hero"` and animates only
  the gradient `Api` suffix.
- Base: auth/setup/sidebar use `BrandIconImage` with `/arona-mark.svg`.
- Bad: do not create another generic `A` tile, robot, circuit, cube, or
  independent app icon. The icon must stay visually tied to the homepage
  wordmark.

### Required checks

- `bun run typecheck`
- `bun run lint`
- Browser check: `/sign-in` contains an image with `src="/arona-mark.svg"`.
- Browser check: `link[rel~="icon"]` includes `/arona-mark.svg`.

## Copy

- Slogan key: `Convenient model access for everyone`.
- Chinese translation: `为所有人提供便捷的模型接入服务`.
