# Architecture — githubPIXELCARTEL

## Overview

Monorepo structure using npm workspaces.

```
githubPIXELCARTEL/
├── .github/
│   ├── CODEOWNERS                   # Review requirements
│   ├── ISSUE_TEMPLATE/              # Bug / Feature / Chore templates
│   ├── pull_request_template.md     # PR checklist
│   ├── workflows/ci.yml             # Lint → Test → Build gate
│   └── scripts/protect-branches.sh # Branch protection automation
├── src/
│   ├── frontend/                    # Vite + React 18 + TypeScript + Tailwind
│   │   ├── src/
│   │   │   ├── components/          # Reusable UI components
│   │   │   ├── pages/               # Route-level page components
│   │   │   └── styles/index.css     # Tailwind entry
│   │   ├── vite.config.ts           # Vite + React plugin + API proxy
│   │   └── tailwind.config.js
│   └── backend/                     # Express + TypeScript + PostgreSQL
│       ├── src/index.ts             # App entry (health check, middleware)
│       ├── tsconfig.json
│       └── .env.example
├── docs/
│   └── architecture.md              # This file
├── package.json                     # Workspace root
└── .gitignore
```

## Branch Strategy

```
main        ← production, protected (1 review + CI + CODEOWNERS required)
develop     ← integration branch, protected (1 review required)
work        ← active development base
feature/*   ← individual features, branch from work
fix/*       ← bug fixes, branch from work or develop
```

## Dev Ports

| Service  | Port |
|----------|------|
| Frontend | 5173 |
| Backend  | 3001 |

Frontend proxies `/api/*` to `http://localhost:3001`.

## Tech Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS  |
| Backend   | Node.js, Express, TypeScript, tsx         |
| Database  | PostgreSQL (pg driver)                    |
| Testing   | Vitest                                    |
| Linting   | ESLint, Prettier                          |
| CI        | GitHub Actions                            |
