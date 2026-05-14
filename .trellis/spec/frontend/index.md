# Frontend Development Guidelines

> Frontend conventions for the default React application.

## Overview

The default frontend lives in `web/default/` and uses React, TypeScript,
Rsbuild, Tailwind CSS, Radix UI, and i18next.

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Landing Page Design](./landing-page-design.md) | Public homepage visual direction | Filled |
| [Local Development Environment](./local-development-environment.md) | Local frontend preview and cache contracts | Filled |

## Pre-Development Checklist

Before frontend implementation:

1. Read [Landing Page Design](./landing-page-design.md) before changing the
   public homepage.
2. Search for existing components, hooks, and i18n keys before adding new ones.
3. Keep `New API` and `QuantumNous` attribution intact.
4. Add or update frontend i18n keys for user-facing text.
5. Use `bun` scripts from `web/default/` for build, lint, and i18n checks.
6. Read [Local Development Environment](./local-development-environment.md)
   before starting the frontend preview.

## Fast Rules

- Use `systemName` for deploy-specific branding instead of hardcoding a fork
  name.
- Reuse shared utilities such as `CopyButton`, `useStatus`, and
  `useSystemConfig`.
- Keep landing hero copy short.
- Prefer full-viewport composition over dense dashboard-style cards for the
  public homepage.
- Use port `5173` for local frontend preview when the backend listens on `3000`.
