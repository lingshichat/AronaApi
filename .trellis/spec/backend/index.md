# Backend Development Guidelines

> Best practices for backend development in this project.

---

## Overview

This directory documents the actual backend conventions used by this Go API
gateway. The backend is layered as Router -> Controller -> Service -> Model, with
provider relay code under `relay/`.

All backend changes must preserve:

- SQLite, MySQL, and PostgreSQL compatibility;
- OpenAI/Claude/Gemini/provider API compatibility;
- quota and billing correctness;
- safe logging and secret masking;
- project identity and attribution.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | Filled |
| [Database Guidelines](./database-guidelines.md) | ORM patterns, queries, migrations | Filled |
| [Error Handling](./error-handling.md) | Error types, handling strategies | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | Filled |
| [Logging Guidelines](./logging-guidelines.md) | Structured logging, log levels | Filled |
| [Local Development Environment](./local-development-environment.md) | Local toolchain, cache, preview contracts | Filled |

---

## Pre-Development Checklist

Before backend implementation:

1. Read [Directory Structure](./directory-structure.md) to place code in the
   right layer.
2. Read [Database Guidelines](./database-guidelines.md) for any model, migration,
   quota, cache, or SQL change.
3. Read [Error Handling](./error-handling.md) for controller, middleware, relay,
   or provider error changes.
4. Read [Logging Guidelines](./logging-guidelines.md) before adding logs or
   touching request/background jobs.
5. Read [Quality Guidelines](./quality-guidelines.md) before changing DTOs,
   relay providers, billing, or tests.
6. Read [Local Development Environment](./local-development-environment.md)
   before starting backend preview, checks, or tests.
7. For tiered/dynamic billing, also read `pkg/billingexpr/expr.md`.
8. For cross-layer changes, read `../guides/cross-layer-thinking-guide.md`.
9. When adding helpers, constants, or config, read
   `../guides/code-reuse-thinking-guide.md` and search for existing patterns.

---

## Fast Rules

- Use `common.*` JSON wrappers for marshal/unmarshal in business code.
- Use pointer optional scalar fields in upstream request DTOs.
- Use GORM by default. Branch raw SQL by dialect.
- Use `commonGroupCol` and `commonKeyCol` for reserved DB columns.
- Use `gorm.Expr` for quota and counter mutations.
- Use `common.ApiError*` / `common.ApiSuccess*` for dashboard/admin APIs.
- Use `types.NewAPIError` and provider-compatible shapes for relay APIs.
- Use `logger.Log*` for request-aware logs and `common.SysLog` for system logs.
- Mask secrets in logs and returned relay errors.
- Use project-local Go caches under `.tools/` for local preview and checks.
- Register relay providers through `relay/relay_adaptor.go`.
- Update `streamSupportedChannels` when a provider supports `StreamOptions`.
- Add focused tests near the changed package.

---

## Reference Flow

```text
HTTP request
  -> router/<domain>.go
  -> middleware/*
  -> controller/<domain>.go
  -> service/<domain>.go
  -> model/<domain>.go
  -> database/cache
```

Relay flow:

```text
HTTP relay request
  -> router/relay-router.go
  -> controller.Relay
  -> relay/*_handler.go
  -> relay.GetAdaptor
  -> relay/channel/<provider>
  -> service quota/billing settlement
```

---

## Documentation Rules

Keep these guideline files factual. Update them when the codebase adopts a new
pattern or when a bug reveals a missing convention.
