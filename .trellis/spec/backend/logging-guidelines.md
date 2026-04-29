# Logging Guidelines

> How logging is done in this project.

---

## Overview

The project uses three logging surfaces:

1. `common.SysLog`, `common.SysError`, and `common.FatalLog` for process/system
   logs.
2. `logger.LogInfo`, `logger.LogWarn`, `logger.LogError`, and `logger.LogDebug`
   for request-aware logs.
3. Gin access logs configured by `middleware.SetUpLogger`.

Request-aware logs should carry the request id through context. System startup,
migrations, background jobs, and cache sync may use `common.SysLog`.

---

## Log Writers and Rotation

`logger.SetupLogger()` writes Gin logs to stdout/stderr and optionally to a file
under `common.LogDir`.

Example from `logger/logger.go`:

```go
gin.DefaultWriter = io.MultiWriter(os.Stdout, fd)
gin.DefaultErrorWriter = io.MultiWriter(os.Stderr, fd)
```

`common.LogWriterMu` protects writer swaps during log rotation:

```go
common.LogWriterMu.RLock()
_, _ = fmt.Fprintf(writer, "[%s] %v | %s | %s \n", level, now.Format("2006/01/02 - 15:04:05"), id, msg)
common.LogWriterMu.RUnlock()
```

Do not write directly to `gin.DefaultWriter` while changing logger setup code
unless the lock is respected.

---

## Log Levels

### System logs

Use `common.SysLog` for startup, migration, config, cache, and background task
events.

Examples:

- `main.go`: `"memory cache enabled"`, `"pprof enabled"`.
- `model/main.go`: `"database migration started"`.
- `common/redis.go`: Redis connection state and debug operations.

Use `common.SysError` for system errors that do not belong to a request.

Use `common.FatalLog` only for unrecoverable startup/runtime failures. It exits
the process.

### Request logs

Use `logger.LogInfo(ctx, msg)` for important successful state changes.

Examples:

- `service/pre_consume_quota.go`: quota pre-consume and refund events.
- `service/billing.go`: settle delta events.
- `service/subscription_reset_task.go`: scheduled subscription maintenance start.

Use `logger.LogWarn(ctx, msg)` for recoverable anomalies.

Examples:

- `service/codex_credential_refresh_task.go`: one channel credential refresh
  failed while the task continues.
- `service/subscription_reset_task.go`: maintenance job failed.

Use `logger.LogError(ctx, msg)` for failed operations that need investigation.

Examples:

- `middleware/utils.go`: auth/rate-limit aborts log the user id and message.
- `service/error.go`: upstream bad status body is logged when hidden from user.
- `relay/helper/stream_scanner.go`: stream scanner/ping goroutine failures.

Use `logger.LogDebug(ctx, format, args...)` for verbose diagnostics. It only logs
when `common.DebugEnabled` is true.

Examples:

- `service/channel_select.go`: auto-group selection debug messages.
- `service/file_service.go`: file loading and disk-cache debug messages.
- `relay/compatible_handler.go`: converted text request body in debug mode.

---

## Request ID and Access Log Format

`middleware.RequestId()` creates a request id, stores it in Gin context, stores it
in `context.Context`, and returns it as a response header.

```go
c.Set(common.RequestIdKey, id)
ctx := context.WithValue(c.Request.Context(), common.RequestIdKey, id)
c.Request = c.Request.WithContext(ctx)
c.Header(common.RequestIdKey, id)
```

`middleware.SetUpLogger()` adds route tag and request id to Gin access logs:

```go
return fmt.Sprintf("[GIN] %s | %s | %s | %3d | %13v | %15s | %7s %s\n",
    param.TimeStamp.Format("2006/01/02 - 15:04:05"),
    tag,
    requestID,
    param.StatusCode,
    param.Latency,
    param.ClientIP,
    param.Method,
    param.Path,
)
```

Routers set route tags:

- `api`
- `old_api`
- `relay`
- `web`

New router groups should set `middleware.RouteTag` unless they intentionally
inherit an existing tag.

---

## What to Log

Log state transitions that affect money, quota, credentials, async jobs, and
system health.

Good examples:

- quota pre-consume, settle, refund, and zero-token anomalies;
- channel auto-disable decisions;
- credential refresh success/failure without secrets;
- subscription reset/expiration maintenance results;
- database migration start and migration warnings;
- upstream bad status when response body is not returned to the user;
- panic value and stack trace in recovery middleware;
- cache sync failures.

Keep logs concise. Include IDs and counts rather than full objects.

Example:

```go
logger.LogWarn(ctx, fmt.Sprintf("codex credential auto-refresh: channel_id=%d name=%s refresh failed: %v", ch.Id, ch.Name, err))
```

---

## What Not to Log

Do not log raw secrets or full sensitive payloads:

- API keys;
- session cookies;
- access tokens;
- authorization headers;
- full upstream request/response bodies outside debug-only paths;
- email addresses without masking when broad logs are enough;
- user passwords or original password fields;
- private file URLs with credentials.

Use masking helpers:

- `common.MaskSensitiveInfo`
- `common.MaskEmail`
- model-specific helpers such as `model.MaskTokenKey`

Examples:

`relay/common/relay_info.go` masks API key in `RelayInfo.ToString()`:

```go
fmt.Fprintf(b, "Token{ Id: %d, Unlimited: %t, Key: ***masked*** }, ", info.TokenId, info.TokenUnlimited)
```

```go
fmt.Fprintf(b, "User{ Id: %d, Email: %q, Group: %q, UsingGroup: %q, Quota: %d }, ",
    info.UserId, common.MaskEmail(info.UserEmail), info.UserGroup, info.UsingGroup, info.UserQuota)
```

`model/token.go` masks token keys:

```go
return key[:4] + "**********" + key[len(key)-4:]
```

---

## Debug Logging

Debug logs are guarded by `common.DebugEnabled`.

Example:

```go
func LogDebug(ctx context.Context, msg string, args ...any) {
    if common.DebugEnabled {
        if len(args) > 0 {
            msg = fmt.Sprintf(msg, args...)
        }
        logHelper(ctx, loggerDebug, msg)
    }
}
```

Only place request bodies or converted upstream payloads behind debug checks.
Prefer masked or summarized payloads even in debug logs.

---

## Background Jobs

Background jobs usually use `context.Background()` or an internal context for
logger calls.

Examples:

- `service.StartCodexCredentialAutoRefreshTask()`
- `service.StartSubscriptionQuotaResetTask()`
- `controller.StartChannelUpstreamModelUpdateTask()`

Log one start message, then aggregate counts or per-item warnings. Avoid logging
every successful scan item in large loops unless debug mode is enabled.

---

## Common Mistakes

- Using `log.Printf` in request paths and losing request id.
- Logging raw upstream URLs or headers that may contain credentials.
- Logging full request bodies outside debug-only code.
- Forgetting route tags for new router groups.
- Calling `common.FatalLog` for recoverable background task errors.
- Returning a sanitized error to the user but logging no internal diagnostic.
- Logging high-volume success paths at info level instead of debug level.
