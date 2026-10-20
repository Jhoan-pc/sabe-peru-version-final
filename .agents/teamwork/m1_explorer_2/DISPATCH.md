## 2026-10-09T17:54:32Z
You are m1_explorer_2 (M1 Explorer - TypeScript & Scroll Observers).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_explorer_2
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Relevant domain skill:
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\web-performance\SKILL.md

TASK:
Formulate the exact implementation blueprint for Milestone 1 regarding `src/main.ts` and Supabase purge:
1. [DT-04 / DT-09] Refactor all continuous scroll listeners in `src/main.ts` (`revealOnScroll`, section offset navigation, header scroll) into a single passive `IntersectionObserver` with `unobserve` on elements once active, and declare passive `{ passive: true }` listeners with requestAnimationFrame throttle where needed.
2. Pause carousels/slideshow timers on `visibilitychange` (when document.visibilityState is 'hidden').
3. [DT-06] Purge active Supabase references in `src/`: isolate or remove `src/supabase.ts`, ensure no runtime modules in `src/` import `@supabase/supabase-js`.

DELIVERABLES:
Write your implementation plan and exact code recommendations to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_explorer_2\plan.md`
And write your handoff report to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_explorer_2\handoff.md`
Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
