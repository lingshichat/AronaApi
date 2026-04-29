# Error Handling

> How errors are handled in this project.

---

## Overview

The project has two main error surfaces:

1. Dashboard/admin API errors usually return HTTP 200 with:

```json
{"success": false, "message": "..."}
```

2. Relay/API-compatible errors return provider-shaped errors, usually OpenAI-style:

```json
{"error": {"message": "...", "type": "new_api_error", "code": "..."}}
```

Use the error shape already used by the route family. Do not mix dashboard
`success:false` responses into relay endpoints.

---

## Error Types

### Simple Go errors

Model and service functions often return normal `error` values.

Examples:

- `model.CheckUserExistOrDeleted` returns `(bool, error)`.
- `model.SearchUserTokens` returns user-safe errors for invalid search patterns.
- `service.EstimateRequestToken` returns `error` for invalid request metadata.

### Sentinel errors

Use sentinel errors where callers need `errors.Is`.

Example from `common/gin.go`:

```go
var ErrRequestBodyTooLarge = errors.New("request body too large")

func IsRequestBodyTooLargeError(err error) bool {
    if errors.Is(err, ErrRequestBodyTooLarge) {
        return true
    }
    var mbe *http.MaxBytesError
    return errors.As(err, &mbe)
}
```

Example from `model/user.go`:

```go
switch {
case errors.Is(err, model.ErrDatabase):
    common.ApiErrorI18n(c, i18n.MsgDatabaseError)
case errors.Is(err, model.ErrUserEmptyCredentials):
    common.ApiErrorI18n(c, i18n.MsgInvalidParams)
default:
    common.ApiErrorI18n(c, i18n.MsgUserUsernameOrPasswordError)
}
```

### Relay `types.NewAPIError`

Relay flows use `*types.NewAPIError` to preserve:

- underlying error;
- relay/provider error payload;
- error type;
- error code;
- status code;
- retry/logging options.

Examples from `types/error.go`:

```go
return types.NewError(err, types.ErrorCodeConvertRequestFailed, types.ErrOptionWithSkipRetry())
```

```go
return types.NewOpenAIError(err, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)
```

```go
return types.NewErrorWithStatusCode(err, types.ErrorCodeReadRequestBodyFailed, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
```

Use these constructors in relay code instead of returning raw errors to the
handler.

### Task errors

Async task providers use `dto.TaskError` wrappers in `service/error.go`:

- `TaskErrorWrapper`
- `TaskErrorWrapperLocal`
- `MidjourneyErrorWrapper`
- `MidjourneyErrorWithStatusCodeWrapper`

Use the task-specific wrapper when the route is part of task submission or polling.

---

## Controller Error Responses

Use the common helpers for normal dashboard/admin API routes:

`common/gin.go`

```go
func ApiError(c *gin.Context, err error) {
    c.JSON(http.StatusOK, gin.H{
        "success": false,
        "message": err.Error(),
    })
}
```

```go
func ApiSuccess(c *gin.Context, data any) {
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "message": "",
        "data":    data,
    })
}
```

Example:

`controller/prefill_group.go`

```go
if err := g.Insert(); err != nil {
    common.ApiError(c, err)
    return
}
common.ApiSuccess(c, &g)
```

For translated user-facing messages, use i18n helpers:

```go
common.ApiErrorI18n(c, i18n.MsgInvalidParams)
common.ApiSuccessI18n(c, i18n.MsgSettingSaved, nil)
```

Examples:

- `controller/user.go` uses `common.ApiErrorI18n` for login/register errors.
- `controller/user.go` uses `common.ApiSuccessI18n` when saving user settings.

Some legacy controllers return `c.JSON` directly. Prefer common helpers for new
dashboard/admin code unless the existing route has a different response contract.

---

## Relay Error Flow

Relay handlers should convert lower-level errors into `*types.NewAPIError`.

Example from `relay/compatible_handler.go`:

```go
adaptor := GetAdaptor(info.ApiType)
if adaptor == nil {
    return types.NewError(
        fmt.Errorf("invalid api type: %d", info.ApiType),
        types.ErrorCodeInvalidApiType,
        types.ErrOptionWithSkipRetry(),
    )
}
```

Request conversion error:

```go
convertedRequest, err := adaptor.ConvertOpenAIRequest(c, info, request)
if err != nil {
    return types.NewError(err, types.ErrorCodeConvertRequestFailed, types.ErrOptionWithSkipRetry())
}
```

Upstream HTTP status error:

```go
if httpResp.StatusCode != http.StatusOK {
    newApiErr := service.RelayErrorHandler(c.Request.Context(), httpResp, false)
    service.ResetStatusCode(newApiErr, statusCodeMappingStr)
    return newApiErr
}
```

Provider adapters should return provider-compatible errors from `DoResponse`.
Do not write dashboard-style JSON from provider adapters.

---

## Middleware Errors

Middleware abort helpers live in `middleware/utils.go`.

OpenAI-compatible middleware error:

```go
c.JSON(statusCode, gin.H{
    "error": gin.H{
        "message": common.MessageWithRequestId(message, c.GetString(common.RequestIdKey)),
        "type":    "new_api_error",
        "code":    codeStr,
    },
})
c.Abort()
logger.LogError(c.Request.Context(), fmt.Sprintf("user %d | %s", userId, message))
```

Midjourney-compatible middleware error:

```go
c.JSON(statusCode, gin.H{
    "description": description,
    "type":        "new_api_error",
    "code":        code,
})
c.Abort()
logger.LogError(c.Request.Context(), description)
```

Middleware must stop the chain with `c.Abort()` after writing an error response.

---

## Panic Handling

Global Gin recovery is installed in `main.go`.

Relay-specific recovery exists in `middleware/recover.go`.

Example:

```go
defer func() {
    if err := recover(); err != nil {
        common.SysLog(fmt.Sprintf("panic detected: %v", err))
        common.SysLog(fmt.Sprintf("stacktrace from panic: %s", string(debug.Stack())))
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": gin.H{
                "message": fmt.Sprintf("Panic detected, error: %v...", err),
                "type":    "new_api_panic",
            },
        })
        c.Abort()
    }
}()
```

Do not rely on panic recovery for normal control flow. Return errors.

---

## Sensitive Error Data

Errors that may contain upstream URLs, keys, headers, tokens, or provider payloads
must be masked before being returned or logged broadly.

Examples:

`types/error.go`

```go
func (e *NewAPIError) MaskSensitiveError() string {
    errStr := e.Err.Error()
    if e.errorCode == ErrorCodeCountTokenFailed {
        return errStr
    }
    return common.MaskSensitiveInfo(errStr)
}
```

`types/error.go`

```go
func (e *NewAPIError) ToOpenAIError() OpenAIError {
    if e.errorCode != ErrorCodeCountTokenFailed {
        result.Message = common.MaskSensitiveInfo(result.Message)
    }
    return result
}
```

`service/error.go`

```go
if strings.Contains(lowerText, "post") || strings.Contains(lowerText, "dial") || strings.Contains(lowerText, "http") {
    common.SysLog(fmt.Sprintf("error: %s", text))
    text = common.MaskSensitiveInfo(text)
}
```

Log the detailed internal error only when needed. Return user-safe messages.

---

## API Error Response Rules

### Dashboard/admin API

Use:

```go
common.ApiError(c, err)
common.ApiErrorMsg(c, msg)
common.ApiErrorI18n(c, i18n.MsgInvalidParams)
```

Expected shape:

```json
{"success": false, "message": "..."}
```

Most of these routes still use HTTP 200 for business errors.

### Relay API

Use `types.NewAPIError` and relay response conversion.

Expected shape:

```json
{
  "error": {
    "message": "...",
    "type": "new_api_error",
    "code": "..."
  }
}
```

Keep provider compatibility. Preserve upstream status code unless
`service.ResetStatusCode` maps it through channel configuration.

### Task APIs

Use `dto.TaskError` wrappers for submit/fetch flows.

Expected shape depends on the platform compatibility mode. Follow the existing
task adaptor for that provider.

---

## Common Mistakes

- Returning raw upstream errors that include API keys, URLs with credentials, or
  request bodies.
- Mixing dashboard `success:false` JSON into relay routes.
- Forgetting `return` after writing `common.ApiError` or `c.JSON`.
- Forgetting `c.Abort()` in middleware after writing an error response.
- Wrapping a `*types.NewAPIError` in a way that loses its status code or retry flag.
- Treating `gorm.ErrRecordNotFound` as a database outage.
- Logging errors with `log.Printf` in request flows instead of `logger.LogError`
  or `common.SysLog`.
