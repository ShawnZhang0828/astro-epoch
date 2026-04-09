# Astro Epoch

Desktop app (Electron + React + TypeScript) for timed focus sessions, **Stardust** rewards, a **Market** shop, **History** and **Analytics**, and a 3D **Exhibition** built with Three.js (`@react-three/fiber`).

## Requirements

- **Node.js** (LTS recommended)
- **npm**
- **Windows x64** is the primary build target configured in `package.json` (`electron-builder`).

## Setup

```bash
npm install
```

## Scripts

| Command       | Description |
|---------------|-------------|
| `npm run dev` | Start **electron-vite** in development (main, preload, renderer with HMR). |
| `npm run build` | Production bundle (`out/`) plus **electron-builder** artifacts under `release/`. |
| `npm run preview` | Preview the production renderer build. |

## Project layout

| Path | Role |
|------|------|
| `src/main/` | Electron main process: app data store, IPC handlers, rewards, optional window monitoring (`active-win`). |
| `src/preload/` | Preload script; exposes a typed **`window.ae`** API to the renderer via `contextBridge`. |
| `src/renderer/` | React UI (Vite), routing, pages (Focus, History, Analytics, Market, Exhibition, Settings). |
| `out/` | Compiled output consumed by Electron (see `package.json` `"main"`). |
| `release/` | Packaged app output from **electron-builder** (e.g. portable `.exe` on Windows). |

Renderer code can import from the `@renderer` alias (see `electron.vite.config.ts`).

## Renderer ↔ main bridge

The preload exposes **`window.ae`** (see `src/preload/index.ts` and `src/renderer/src/env.d.ts`) for data, focus sessions, tags, shop, themes, settings, and monitor events. Use **`npm run dev`** so preload and main stay in sync with the UI.

## Building for production

```bash
npm run build
```

- **electron-builder** is configured for Windows (`dir` + `portable` x64). Output goes to **`release/`**.
- **`active-win`** is listed under `build.asarUnpack` so the native module is unpacked correctly in the packaged app.

## Tech stack (summary)

- **electron-vite**, **Vite**, **React 18**, **TypeScript**
- **react-router-dom** (hash router)
- **date-fns**, **three** / **@react-three/fiber** / **@react-three/drei**
