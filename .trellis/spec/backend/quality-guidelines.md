# Quality Guidelines

> Code quality standards for backend development.

---

## Overview

Backend changes must preserve provider compatibility, database portability, quota
correctness, and security. This codebase is a gateway: small DTO, billing, relay,
or database mistakes can affect many upstream providers and users.

Prefer narrow changes. Keep behavior in the owning layer. Add focused tests for
edge cases, especially around zero values, billing, relay conversion, and database
updates.

---

## Required Patterns

### Use project JSON wrappers in business code

Use:

- `common.Marshal`
- `common.Unmarshal`
- `common.UnmarshalJsonStr`
- `common.DecodeJson`
- `common.GetJsonType`

Example:

`relay/compatible_handler.go`

```go
jsonData, err := common.Marshal(convertedRequest)
if err != nil {
    return types.NewError(err, types.ErrorCodeJsonMarshalFailed, types.ErrOptionWithSkipRetry())
}
```

Example:

`service/error.go`

```go
err = common.Unmarshal(responseBody, &errResponse)
```

The standard `encoding/json` package may be used for type declarations such as
`json.RawMessage` and `json.Number`. Do not add new direct marshal/unmarshal calls
in business logic.

### Preserve explicit zero values in upstream request DTOs

Optional scalar fields that are parsed from client JSON and re-marshaled upstream
must use pointer types with `omitempty`.

Example:

`dto/openai_request.go`

```go
Stream              *bool    `json:"stream,omitempty"`
MaxTokens           *uint    `json:"max_tokens,omitempty"`
Temperature         *float64 `json:"temperature,omitempty"`
TopP                *float64 `json:"top_p,omitempty"`
N                   *int     `json:"n,omitempty"`
```

Reason:

- absent field => `nil` => omitted upstream;
- explicit `0` or `false` => non-nil pointer => preserved upstream.

Tests should cover this when adding relay DTO fields. See
`dto/openai_request_zero_value_test.go`.

### Keep database code cross-dialect

All DB code must support SQLite, MySQL, and PostgreSQL.

Required:

- use GORM for normal CRUD;
- use `commonGroupCol` and `commonKeyCol` for reserved columns;
- branch raw SQL by `common.UsingSQLite`, `common.UsingMySQL`,
  `common.UsingPostgreSQL`;
- avoid SQLite `ALTER COLUMN`;
- use additive, idempotent migrations.

Example:

`model/main.go`

```go
if common.UsingPostgreSQL {
    commonGroupCol = `"group"`
    commonKeyCol = `"key"`
} else {
    commonGroupCol = "`group`"
    commonKeyCol = "`key`"
}
```

### Use the relay adapter interface for providers

Provider code must fit `relay/channel/adapter.go`.

Example:

```go
type Adaptor interface {
    Init(info *relaycommon.RelayInfo)
    GetRequestURL(info *relaycommon.RelayInfo) (string, error)
    SetupRequestHeader(c *gin.Context, req *http.Header, info *relaycommon.RelayInfo) error
    ConvertOpenAIRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeneralOpenAIRequest) (any, error)
    DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (any, error)
    DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (usage any, err *types.NewAPIError)
}
```

Register providers in `relay/relay_adaptor.go`, not in controllers.

### Confirm StreamOptions support for new channels

If an upstream supports stream usage options, add its channel type to
`relay/common/relay_info.go`:

```go
var streamSupportedChannels = map[int]bool{
    constant.ChannelTypeOpenAI: true,
    constant.ChannelTypeGemini: true,
    constant.ChannelTypeCodex:  true,
}
```

`relay/compatible_handler.go` removes `StreamOptions` when unsupported:

```go
if !info.SupportStreamOptions || !lo.FromPtrOr(request.Stream, false) {
    request.StreamOptions = nil
}
```

### Use typed context helpers for new relay state

Prefer:

- `common.SetContextKey`
- `common.GetContextKey`
- `common.GetContextKeyString`
- `common.GetContextKeyInt`
- `common.GetContextKeyType[T]`

with keys from `constant.ContextKey`.

This avoids string drift and type assertion mistakes.

### Read billing expression docs before billing changes

Before changing tiered or dynamic billing, read:

`pkg/billingexpr/expr.md`

Billing changes must preserve the documented lifecycle:

```text
editor -> storage -> pre-consume -> settlement -> log display
```

Keep token normalization, quota conversion, and expression versioning aligned
with that document.

---

## Forbidden Patterns

- New direct calls to `json.Marshal`, `json.Unmarshal`, or `json.NewDecoder`
  in business logic.
- Non-pointer optional scalar fields with `omitempty` in upstream request DTOs.
- MySQL-only, PostgreSQL-only, or SQLite-breaking SQL without fallback.
- Updating quota/counters with read-modify-write in Go.
- Hiding business logic in `router/`.
- Writing Gin responses from `model/`.
- Returning raw upstream errors that may contain secrets.
- Logging API keys, tokens, cookies, passwords, full auth headers, or unmasked
  private URLs.
- Removing or renaming protected project identity, module path, attribution,
  package metadata, Docker/image names, or branding.
- Adding a relay provider without registering it through the existing adapter map.
- Changing tiered billing without reading `pkg/billingexpr/expr.md`.

Legacy code may violate some newer rules, especially direct `encoding/json` use.
Do not copy legacy patterns into new code.

---

## Testing Requirements

### Run focused Go tests for changed packages

Use package-level tests when possible:

```bash
go test ./service
go test ./model
go test ./relay/common
go test ./dto
```

For cross-layer relay changes, run the touched packages and nearby conversion
tests.

### Add table-driven tests for pure logic

Existing pattern:

`service/error_test.go`

```go
testCases := []struct {
    name             string
    statusCode       int
    statusCodeConfig string
    expectedCode     int
}{...}

for _, tc := range testCases {
    tc := tc
    t.Run(tc.name, func(t *testing.T) {
        t.Parallel()
        ...
    })
}
```

Use `testify/require` for setup and fatal assertions. Use `assert` for follow-up
checks when continuing is useful.

### Use SQLite in-memory for model tests

Existing pattern:

`model/task_cas_test.go`

```go
db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
require.NoError(t, err)
DB = db
LOG_DB = db
common.UsingSQLite = true
common.RedisEnabled = false
```

Set global flags back when tests mutate them, or use cleanup helpers.

### Test zero-value request semantics

When adding upstream request fields, test that explicit `0`, `0.0`, or `false`
survives marshal when the field is set.

Relevant existing test:

- `dto/openai_request_zero_value_test.go`

### Test billing and quota transitions

Billing tests should cover:

- pre-consume;
- post-settle;
- refund;
- subscription vs wallet source;
- tiered expression result;
- zero usage edge cases.

Examples:

- `service/task_billing_test.go`
- `service/text_quota_test.go`
- `service/tiered_settle_test.go`

---

## Code Review Checklist

Check these before merging backend changes:

- Does the change belong to the edited layer?
- Are all new JSON marshal/unmarshal calls using `common.*` wrappers?
- Are optional upstream scalar DTO fields pointers?
- Does the code preserve SQLite/MySQL/PostgreSQL behavior?
- Does raw SQL use correct quoting and dialect branches?
- Are quota/counter updates atomic?
- Are Redis/cache side effects updated when persisted data changes?
- Are relay errors returned as `types.NewAPIError` where appropriate?
- Are user-facing messages translated when the surrounding controller uses i18n?
- Are secrets masked in logs and returned errors?
- Does a new channel update `relay/relay_adaptor.go` and
  `streamSupportedChannels` if needed?
- Do tests cover the changed behavior and edge cases?
- Was `pkg/billingexpr/expr.md` followed for billing expression changes?
- Are protected project identity and attribution untouched?

---

## Common Mistakes

- Adding a field to a DTO as `int` or `bool` with `omitempty`, causing explicit
  zero values to disappear upstream.
- Adding direct `encoding/json` calls because nearby legacy code uses them.
- Making a MySQL migration that fails on SQLite.
- Updating `remain_quota` in Go instead of with `gorm.Expr`.
- Forgetting cache invalidation after token, user, or channel writes.
- Returning HTTP 200 `success:false` from a relay endpoint.
- Logging full request bodies while debugging and leaving it enabled.
- Changing billing code without tests for refund or settlement deltas.
