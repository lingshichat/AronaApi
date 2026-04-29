# Directory Structure

> How backend code is organized in this project.

---

## Overview

This backend follows a layered shape:

```
main.go
  -> router/
  -> middleware/
  -> controller/
  -> service/
  -> model/
  -> relay/
  -> common/, dto/, types/, setting/, constant/
```

HTTP routes are registered in `router/`. Handlers live in `controller/`.
Business rules live in `service/`. Database structs and queries live in `model/`.
Provider proxy logic lives in `relay/` and `relay/channel/<provider>/`.

New code should match the existing layer that owns the behavior. Do not hide business
logic in routers. Do not put database writes in frontend-facing DTO packages.

---

## Directory Layout

```
.
├── main.go
├── router/
│   ├── main.go
│   ├── api-router.go
│   ├── relay-router.go
│   ├── dashboard.go
│   ├── video-router.go
│   └── web-router.go
├── controller/
│   ├── user.go
│   ├── channel.go
│   ├── subscription.go
│   └── *_test.go
├── service/
│   ├── quota.go
│   ├── billing_session.go
│   ├── error.go
│   └── *_test.go
├── model/
│   ├── main.go
│   ├── user.go
│   ├── token.go
│   ├── channel.go
│   └── *_test.go
├── relay/
│   ├── compatible_handler.go
│   ├── responses_handler.go
│   ├── relay_adaptor.go
│   ├── common/
│   ├── helper/
│   └── channel/
│       ├── adapter.go
│       ├── openai/
│       ├── claude/
│       ├── gemini/
│       └── task/
├── middleware/
│   ├── auth.go
│   ├── logger.go
│   ├── request-id.go
│   └── utils.go
├── common/
│   ├── gin.go
│   ├── json.go
│   ├── sys_log.go
│   ├── redis.go
│   └── *_test.go
├── dto/
├── types/
├── constant/
├── setting/
├── i18n/
├── logger/
└── pkg/
```

---

## Layer Responsibilities

### `main.go`

Owns process startup and global resource wiring.

Examples:

- `InitResources()` loads environment, logger, settings, HTTP clients, DB, Redis,
  system monitor, i18n, and OAuth providers.
- `main()` installs Gin recovery, request id, i18n, logger, sessions, then calls
  `router.SetRouter`.
- Long-running background jobs are started here or through service/controller
  startup functions.

Do not register feature routes directly in `main.go`.

### `router/`

Owns URL shape and middleware order.

Examples:

- `router/api-router.go` registers `/api` dashboard/admin routes and applies
  `RouteTag("api")`, gzip, body cleanup, and API rate limiting.
- `router/relay-router.go` registers OpenAI-compatible, Claude, Gemini, image,
  audio, task, and Midjourney relay routes.
- `router/main.go` composes API, dashboard, relay, video, and web routers.

Routes should call controller functions or small inline adapters that only choose
relay format or channel type.

### `controller/`

Owns Gin request handling:

- read params, query, session, and request body;
- check request-specific permissions that are not middleware-owned;
- call `service/` or `model/`;
- return the API response shape.

Examples:

- `controller/user.go` handles login, registration, profile, quota transfer,
  and user setting endpoints.
- `controller/prefill_group.go` is a small CRUD controller that validates input,
  calls `model.PrefillGroup`, and returns `common.ApiSuccess`.
- `controller/channel.go` handles admin channel CRUD and channel operations.

Controllers may call `model/` directly for simple CRUD. Use `service/` when the
logic has billing, relay, external API calls, async work, or non-trivial state.

### `service/`

Owns business rules and reusable operations.

Examples:

- `service/quota.go` calculates quota, handles pre/post consumption, and writes
  usage logs.
- `service/billing_session.go` coordinates wallet/subscription reserve, settle,
  and refund flows.
- `service/error.go` normalizes upstream errors, maps status codes, and masks
  sensitive data.

Services should return `error` or project error types. They should not write Gin
responses unless the existing API already passes `*gin.Context` through the flow.

### `model/`

Owns GORM structs, migrations, queries, cache updates, and transaction boundaries
that protect persisted state.

Examples:

- `model/main.go` opens SQLite/MySQL/PostgreSQL, runs `AutoMigrate`, and handles
  database-specific migrations.
- `model/token.go` owns token lookup, quota updates, Redis cache sync, and token
  search.
- `model/user.go` owns user queries, user quota mutation, and registration-side
  persistence helpers.

Model methods should not return client response objects.

### `relay/`

Owns provider proxy flow and format conversion.

Examples:

- `relay/channel/adapter.go` defines the provider `Adaptor` and `TaskAdaptor`
  interfaces.
- `relay/relay_adaptor.go` maps channel/api type constants to provider adapters.
- `relay/compatible_handler.go` performs the main text relay flow: init metadata,
  map model, convert request, marshal, apply overrides, send upstream, parse
  response, settle quota.
- `relay/common/relay_info.go` stores per-request relay metadata and the
  `streamSupportedChannels` map.

New provider support normally belongs under `relay/channel/<provider>/`, plus
the switch in `relay/relay_adaptor.go`, constants, model metadata, and tests.

### Shared packages

- `common/`: cross-cutting helpers, request body reuse, JSON wrappers, Redis,
  logging primitives, validation, crypto, env parsing, rate limiting, SSRF guards.
- `dto/`: request/response structs. Optional upstream scalar request fields should
  use pointer types with `omitempty`.
- `types/`: shared non-DTO domain types and relay error types.
- `constant/`: stable constants and context keys.
- `setting/`: runtime configuration groups and default model/provider settings.
- `logger/`: request-aware logging and quota formatting.
- `pkg/`: internal packages with their own subdomain, such as billing expressions.
- `i18n/`: backend translations and language selection.

---

## Common Feature Placement

### Admin or dashboard CRUD

1. Register the endpoint in `router/api-router.go`.
2. Add handler code in `controller/<domain>.go`.
3. Put simple persistence in `model/<domain>.go`.
4. Put cross-entity behavior in `service/<domain>.go`.
5. Add focused tests near the package being changed.

Example: `PrefillGroup` uses `controller/prefill_group.go` and
`model/prefill_group.go`.

### Relay provider support

1. Add/extend channel constants in `constant/`.
2. Implement the adapter under `relay/channel/<provider>/`.
3. Register it in `relay/relay_adaptor.go`.
4. Add DTOs in `dto/` or provider-local DTO files.
5. If streaming usage is supported, add the channel to
   `relay/common/relay_info.go` `streamSupportedChannels`.
6. Add conversion and response tests.

Example: `relay/channel/openai/adaptor.go` implements OpenAI-compatible request
URL, headers, conversion, request, and response handling.

### Billing or quota changes

1. Read `pkg/billingexpr/expr.md` before changing tiered/dynamic billing.
2. Keep reserve/settle/refund lifecycle in `service/`.
3. Keep persisted quota mutations in `model/`.
4. Add tests in `service/*_test.go` or `model/*_test.go`.

Examples: `service/billing_session.go`, `service/quota.go`,
`service/tiered_settle_test.go`.

---

## Naming Conventions

- Go package directories are lowercase snake-free names where possible:
  `controller`, `service`, `model`, `middleware`.
- File names use lowercase snake or hyphen only where the existing package uses it:
  `channel_affinity.go`, `request-id.go`, `rate-limit.go`.
- Controllers use action-style exported functions:
  `GetAllUsers`, `CreateUser`, `UpdateChannel`, `RelayTask`.
- Model structs use exported singular names:
  `User`, `Token`, `Channel`, `SubscriptionPlan`.
- Model methods use persistence verbs:
  `Insert`, `Update`, `Delete`, `SelectUpdate`, `Get...`, `Search...`.
- JSON fields use snake_case.
- GORM columns use snake_case when explicitly set.
- Context keys should use `constant.ContextKey` plus `common.SetContextKey` /
  `common.GetContextKey...` helpers for new typed flows.

---

## Real Examples

### Router to controller

`router/api-router.go`

```go
userRoute.POST("/login", middleware.CriticalRateLimit(), middleware.TurnstileCheck(), controller.Login)
```

The router owns middleware order. `controller.Login` owns request parsing and
response.

### Controller to model

`controller/prefill_group.go`

```go
groups, err := model.GetAllPrefillGroups(groupType)
if err != nil {
    common.ApiError(c, err)
    return
}
common.ApiSuccess(c, groups)
```

Small CRUD may call the model directly.

### Relay adapter registration

`relay/relay_adaptor.go`

```go
case constant.APITypeOpenAI:
    return &openai.Adaptor{}
```

Provider registration is centralized. Do not instantiate provider adapters
from controllers.

### Startup resource order

`main.go`

```go
common.InitEnv()
logger.SetupLogger()
ratio_setting.InitRatioSettings()
service.InitHttpClient()
service.InitTokenEncoders()
err = model.InitDB()
```

Resource initialization order matters because later layers depend on settings,
logger, database, and cache state.

---

## Forbidden Patterns

- Do not register long feature routes directly in `main.go`.
- Do not put DB mutations in `dto/`, `types/`, or `router/`.
- Do not add provider-specific conversion code to generic controllers.
- Do not bypass `relay/channel/adapter.go` for new relay providers.
- Do not introduce new JSON marshal/unmarshal call sites in business code; use
  `common.Marshal`, `common.Unmarshal`, `common.DecodeJson`, or
  `common.UnmarshalJsonStr`.
- Do not remove or rename protected project identity, module path, attribution,
  package metadata, image names, or related branding.
