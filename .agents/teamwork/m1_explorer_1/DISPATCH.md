## 2026-10-09T17:54:32Z
You are m1_explorer_1 (M1 Explorer - Assets & HTML).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_explorer_1
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Relevant domain skill:
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\web-performance\SKILL.md

TASK:
Formulate the exact implementation blueprint for Milestone 1 (Fase 1: Rendimiento Web y Saneamiento de Assets) regarding HTML files (`index.html`, `carta.html`, `admin.html`, `experiencia.html`) and font loading:
1. [DT-01 / DT-10] Eradication of 10 residual Supabase `<img>` tags in `#main-gallery-grid` in `index.html`. Specify exact replacement (clean skeleton container with reserved dimensions: min-height 400px / 55vh to prevent CLS).
2. [DT-02 / DT-08] Replacement of synchronous `@import` in `src/style.css` with asynchronous `<link rel="preconnect">` and `<link rel="stylesheet">` tags in the `<head>` of `index.html`, `carta.html`, `admin.html`, `experiencia.html` (only the 2 official families: Cormorant Garamond and Inter with display=swap).
3. [DT-03] Configuration of `#img-hero-1` with `fetchpriority="high"`, `loading="eager"`, `decoding="async"`, and ensuring subsequent hero slides use `loading="lazy"`.
4. Removal of Supabase `og:image` in `index.html`.

DELIVERABLES:
Write your implementation plan and exact diffs/recommendations to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_explorer_1\plan.md`
And write your handoff report to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_explorer_1\handoff.md`
Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
