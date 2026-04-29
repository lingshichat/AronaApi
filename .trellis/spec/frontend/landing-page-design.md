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
- Footer remains after the hero to preserve project attribution.

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
- The default fallback remains `New API`.
- Base URL must come from `/api/status` `server_address` when present.
- If `server_address` is missing, fall back to `window.location.origin`.
- The copy action must copy only the base domain/address, not the endpoint
  suffix.
- The endpoint suffix is displayed separately and may rotate between common
  OpenAI-compatible paths such as `/v1/responses` and
  `/v1/chat/completions`.
- Use the shared `CopyButton` for clipboard behavior.

## Copy

- Slogan key: `Convenient model access for everyone`.
- Chinese translation: `为所有人提供便捷的模型接入服务`.
