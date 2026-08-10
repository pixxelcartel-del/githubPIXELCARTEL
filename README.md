# githubPIXELCARTEL

Pixel-art trading card marketplace — monorepo.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend  | Node.js + Express + TypeScript + PostgreSQL |
| Testing  | Vitest |
| CI/CD    | GitHub Actions |

## Quick Start

```bash
# Clone
git clone https://github.com/pixxelcartel-del/githubPIXELCARTEL.git
cd githubPIXELCARTEL

# Install all workspace deps
npm install

# Run frontend + backend (separate terminals)
npm run dev:frontend   # → http://localhost:5173
npm run dev:backend    # → http://localhost:3001

# Backend env
cp src/backend/.env.example src/backend/.env
# then fill in DATABASE_URL, etc.
```

## Branch Strategy

| Branch      | Purpose |
|-------------|---------|
| `main`      | Production — protected, requires PR + review + CI |
| `develop`   | Integration — protected, requires PR + review |
| `work`      | Active dev base |
| `feature/*` | Feature branches off `work` |
| `fix/*`     | Bug fixes off `work` or `develop` |

## Repo Structure

```
src/
├── frontend/    Vite + React + TypeScript + Tailwind
└── backend/     Express + TypeScript + PostgreSQL
.github/
├── workflows/ci.yml          CI gate (lint → test → build)
├── CODEOWNERS                Required reviewers
├── pull_request_template.md
└── ISSUE_TEMPLATE/           Bug / Feature / Chore
docs/
└── architecture.md
```

## Contributing

1. Branch from `work` — `git checkout -b feature/my-thing`
2. Open a PR to `develop` (fill out the PR template)
3. Get 1 review + CI green → merge
4. `develop` → `main` follows the same flow

See [`docs/architecture.md`](docs/architecture.md) for full technical details.

## License

MIT — see [`LICENSE`](LICENSE).
