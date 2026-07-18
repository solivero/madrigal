# Madrigal

A two-player turn-based card game built on [boardgame.io](https://boardgame.io). Cozy medieval theme, deployed on Google App Engine.

## Architecture

Three workspaces under one root:

- **`game/`** — `@madrigal/core`: pure game logic (rules, moves, cards). No UI.
- **`server/`** — `@madrigal/server`: boardgame.io WebSocket + lobby server (Express/Koa).
- **`frontend/`** — `@madrigal/frontend`: React 18 + Vite 6 + Tailwind v4 + Framer Motion.

All three are wired together via **npm workspaces** — no more `npm pack` / `npm link` dance.

## Prerequisites

- Node 22 (`nvm use` reads `.nvmrc`)
- npm 10+

## Setup

```bash
nvm use
npm install
npm run build:core
```

## Local dev

```bash
npm run dev
```

That runs three processes concurrently:

- `core` — `tsc --watch` on the game logic
- `server` — boardgame.io server on http://localhost:8000 (lobby API on the same port)
- `frontend` — Vite dev server on http://localhost:3000

Open two browser tabs at `http://localhost:3000`, create a match in one, join from the other.

## Production deploy (Google App Engine)

The two services deploy independently but are bundled in a `deploy.sh` script to keep the core package consistent between frontend/backend. The script builds @madrigal/core into a tarball which is uploaded to App Engine builder and installed from file without relying on the private NPM repository which kept giving 404/403 no matter what I tried.

```bash
./deploy.sh
```

Both services target the `nodejs22` runtime.

## Useful scripts

| Command           | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Watch core + run server + run frontend dev      |
| `npm run build`   | Build all workspaces                            |
| `npm run test`    | Run jest in `@madrigal/core`                    |
| `npm run lint`    | Biome lint check                                |
| `npm run format`  | Biome format write                              |

## Stack notes

- **React 18 + Vite 6** — replaced Create React App (Webpack).
- **Tailwind v4** — uses the new `@theme` CSS-variable token system, no `tailwind.config.js`.
- **Framer Motion 11** — card animations, layout transitions, reduced-motion-aware.
- **boardgame.io 0.49.13** — pinned for game-logic API stability.
- **Biome** — replaces ESLint + Prettier for a single lint/format step.
