# Local Development Environment

The default frontend lives in `web/default/`. Use the project-local Bun binary
and the existing `node_modules` / Rsbuild setup for local preview and checks.

## Scenario: Local frontend preview

### 1. Scope / Trigger

- Trigger: starting the frontend dev server or checking the public homepage.
- Goal: connect the frontend dev server to the local backend without changing
  checked-in env files.

### 2. Signatures

```powershell
..\..\.tools\bun-windows-x64\bun.exe run dev
.\node_modules\.bin\rsbuild.cmd dev --port 5173
```

### 3. Contracts

- Frontend working directory is `web/default/`.
- Local backend URL is passed through `VITE_REACT_APP_SERVER_URL`.
- Frontend preview should use port `5173` when backend uses port `3000`.
- Rsbuild proxies `/api`, `/mj`, and `/pg` to `VITE_REACT_APP_SERVER_URL`.

Frontend preview command:

```powershell
cd web/default
$env:VITE_REACT_APP_SERVER_URL="http://127.0.0.1:3000"
.\node_modules\.bin\rsbuild.cmd dev --port 5173
```

### 4. Validation & Error Matrix

- Missing backend URL -> Rsbuild falls back to `http://localhost:3000`.
- Frontend on port `3000` while backend uses port `3000` -> port conflict.
- Backend not ready -> proxied `/api/status` requests fail.

### 5. Good/Base/Bad Cases

- Good: backend on `127.0.0.1:3000`, frontend on `127.0.0.1:5173`, API proxied
  through Rsbuild.
- Base: `bun run dev` is fine if the port does not conflict with the backend.
- Bad: edit checked-in env/config files just to point preview at a local backend.

### 6. Tests Required

- Browser smoke: `http://127.0.0.1:5173/` returns the frontend HTML.
- API smoke: `http://127.0.0.1:3000/api/status` returns HTTP 200 before checking
  UI behavior.
- Landing smoke: homepage renders the compact copyable Base URL row and does
  not render the New API-compatible integration guide.

### 7. Wrong vs Correct

#### Wrong

```powershell
cd web/default
.\node_modules\.bin\rsbuild.cmd dev --port 3000
```

#### Correct

```powershell
cd web/default
$env:VITE_REACT_APP_SERVER_URL="http://127.0.0.1:3000"
.\node_modules\.bin\rsbuild.cmd dev --port 5173
```
