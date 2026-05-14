# Local Development Environment

This project keeps its Windows development toolchain and caches under
`.tools/`. Use these paths before falling back to user-global caches.

## Scenario: Local backend preview and checks

### 1. Scope / Trigger

- Trigger: starting the backend locally, running backend checks, or debugging a
  preview issue.
- Goal: reuse the existing project-local Go module/build caches and avoid
  redownloading dependencies.

### 2. Signatures

```powershell
.\.tools\go\bin\go.exe run . -port 3000
.\.tools\go\bin\go.exe test ./...
```

### 3. Contracts

- `GOMODCACHE` must point to `.tools/gopath/pkg/mod`.
- `GOCACHE` must point to `.tools/gocache`.
- `PORT` must be exactly `3000` for the default local backend preview.
- Do not create `.gomodcache-temp` or `.gocache-temp` for normal preview,
  build, lint, or test work.

Backend preview command:

```powershell
$env:GOMODCACHE=(Resolve-Path .tools\gopath\pkg\mod).Path
$env:GOCACHE=(Resolve-Path .tools\gocache).Path
$env:PORT="3000"
.\.tools\go\bin\go.exe run . -port 3000
```

### 4. Validation & Error Matrix

- `PORT="3000 "` -> Go attempts to listen on an invalid port and startup fails.
- Missing `GOMODCACHE` -> Go may fall back to a user-global module cache.
- New `.gomodcache-temp` / `.gocache-temp` -> dependencies may be downloaded
  again and should be removed after use.
- `http://127.0.0.1:3000/api/status` not returning 200 -> backend preview is not
  ready.

### 5. Good/Base/Bad Cases

- Good: use `.tools/go/bin/go.exe` with `.tools/gopath/pkg/mod` and
  `.tools/gocache`.
- Base: system `go` is acceptable only if it is the same project Go version and
  the cache env vars point at `.tools/`.
- Bad: create fresh `.gomodcache-temp` or `.gocache-temp` and redownload the
  dependency graph.

### 6. Tests Required

- Preview smoke: `GET http://127.0.0.1:3000/api/status` returns HTTP 200.
- Process check: backend listens on port `3000`.
- Cache check: no `.gomodcache-temp` or `.gocache-temp` remains after preview.

### 7. Wrong vs Correct

#### Wrong

```powershell
$env:GOMODCACHE=(Resolve-Path .gomodcache-temp).Path
$env:GOCACHE=(Resolve-Path .gocache-temp).Path
go run . -port 3000
```

#### Correct

```powershell
$env:GOMODCACHE=(Resolve-Path .tools\gopath\pkg\mod).Path
$env:GOCACHE=(Resolve-Path .tools\gocache).Path
$env:PORT="3000"
.\.tools\go\bin\go.exe run . -port 3000
```
