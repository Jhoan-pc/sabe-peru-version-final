# BRIEFING — 2026-10-09T18:00:00Z

## Mission
Formulate exact implementation blueprint for Milestone 1 regarding `src/main.ts` scroll optimization, visibility change carousel pauses, and Supabase purge.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_explorer_2
- Original parent: ed44eb6a-a075-4b06-a258-caefe2915195
- Milestone: Milestone 1 (LCP, INP, CSS & Main Thread Hygiene)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- DT-04/DT-09: Refactor continuous scroll listeners in `src/main.ts` to passive IntersectionObserver with unobserve where applicable, and rAF throttled passive listeners where needed.
- Pause carousels/slideshow timers on `visibilitychange`.
- DT-06: Purge active Supabase references in `src/`, isolate or remove `src/supabase.ts`, ensure no runtime modules in `src/` import `@supabase/supabase-js`.

## Current Parent
- Conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195
- Updated: 2026-10-09T18:00:00Z

## Investigation State
- **Explored paths**: `src/main.ts`, `src/supabase.ts`, `src/experiencia.ts`, `package.json`, `specs/SDD_MASTER.md`, `specs/performance-spec.md`, `PROJECT.md`, `ORIGINAL_REQUEST.md`.
- **Key findings**:
  1. `src/main.ts` contains 3 continuous non-passive scroll listeners causing forced reflows (`revealOnScroll`, section offset navigation, sticky header).
  2. Hero slideshow and Gallery auto-scroll continue running when hidden or offscreen without `visibilitychange` controls.
  3. `src/supabase.ts` is the single source of `@supabase/supabase-js` imports in `src/` and is never imported by any other runtime module; can be safely removed/isolated.
  4. Formulated complete replacement code chunks with `IntersectionObserver` (with unobserve), rAF throttled passive scroll, and unified visibility controller.
- **Unexplored areas**: None within the scope of M1 TS & scroll/Supabase tasks.

## Key Decisions Made
- Architected reveal animation using `IntersectionObserver` with `{ rootMargin: '0px 0px -80px 0px', threshold: 0.1 }` and `obs.unobserve(entry.target)`.
- Architected section spy using `IntersectionObserver` on `section[id]` with `{ rootMargin: '-20% 0px -70% 0px', threshold: 0 }` to eliminate `section.offsetTop` DOM layout reads.
- Architected sticky header using a single passive `{ passive: true }` listener throttled with `requestAnimationFrame` (`isScrollTicking`).
- Architected unified visibility and viewport controller for Hero and Gallery timers responding to `visibilitychange` and viewport intersections.
- Defined complete purge of `src/supabase.ts` and sanitized residual console logs.

## Artifact Index
- `.agents/teamwork/m1_explorer_2/plan.md` — Complete implementation plan with exact code blueprints.
- `.agents/teamwork/m1_explorer_2/handoff.md` — 5-component handoff report for implementer and parent agent.
- `.agents/teamwork/m1_explorer_2/progress.md` — Liveness heartbeat.
