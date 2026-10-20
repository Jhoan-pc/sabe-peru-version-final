# BRIEFING — 2026-10-14T12:46:00Z

## Mission
Analyze Vite build and Rollup chunk emission mechanics to formulate an exact build configuration strategy for `style-[hash].css` when `experiencia.html` has `<link rel="stylesheet" href="/src/style.css">` active, resolving Reviewer 2's failure finding.

## 🔒 My Identity
- Archetype: Specification Miner / Explorer
- Roles: Teamwork specialist, Vite Build & Chunk Contracts Miner
- Working directory: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_1
- Original parent: ed44eb6a-a075-4b06-a258-caefe2915195
- Milestone: Milestone 6 (Design System, Assets & Responsive UI)

## 🔒 Key Constraints
- Read-only investigation: Do NOT implement production changes (leave implementation to worker).
- Discover authoritative specification behaviors and constraints via probing.
- Ensure all 4 HTML templates actively load `/src/style.css`.
- Ensure `dist/assets/style-[hash].css` is emitted deterministically and satisfies T5.M6.9.
- Ensure all 360+ tests across the test suite pass.

## Current Parent
- Conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195
- Updated: 2026-10-14T12:37:04Z

## Task Summary
- **What to build**: Blueprint and exact configuration strategy for `vite.config.ts` and `experiencia.html`.
- **Success criteria**: When `<link rel="stylesheet" href="/src/style.css">` is active in `experiencia.html`, Vite outputs `dist/assets/style-[hash].css` without bundling it into `firebase-*.css`, passing T5.M6.7, T5.M6.9, and all other pipeline and E2E suites.
- **Interface contracts**: `specs/performance-spec.md`, `specs/design-system-spec.md`, `tests/tier5-m6-pipeline-stress.test.mjs`.
- **Code layout**: Root multi-page HTMLs (`index.html`, `carta.html`, `admin.html`, `experiencia.html`), TypeScript entrypoints in `src/`, Vite configuration in `vite.config.ts`.

## Loaded Skills
- **Source**: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\web-performance\SKILL.md`
- **Local copy**: N/A (read directly)
- **Core methodology**: CWV optimization, passive event listeners, bundle tuning, Rollup chunking.

## Key Decisions Made
- Confirmed root cause: Vite's `vite:css-post` assigns the shared CSS chunk the common vendor group name (`firebase.css`) when all 4 HTML entry points share both `style.css` and Firebase.
- Proved `manualChunks` cannot rename CSS assets and altering it risks breaking C5.4 (`firebase-*.js`).
- Authoritative solution identified: `build.rollupOptions.output.assetFileNames` function in `vite.config.ts` intercepting `firebase.css` and mapping it to `assets/style-[hash][extname]`.
- Verified 360/360 passing tests and accurate HTML link rewriting.
- Preserved Explorer read-only state by restoring source files after probing.

## Artifact Index
- `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_1\plan.md` — Detailed blueprint for Worker
- `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_1\handoff.md` — 5-component handoff report
- `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_1\progress.md` — Liveness and status heartbeat
