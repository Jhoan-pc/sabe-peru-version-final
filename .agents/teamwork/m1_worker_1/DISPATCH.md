## 2026-10-09T18:05:43Z
[Message] timestamp=2026-10-09T18:05:43Z sender=ed44eb6a-a075-4b06-a258-caefe2915195 priority=MESSAGE_PRIORITY_HIGH content=You are m1_worker (M1 Worker).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_worker_1
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Relevant domain skill:
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\web-performance\SKILL.md

Read the implementation blueprints before starting:
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_explorer_1\plan.md (HTML & Assets)
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_explorer_2\plan.md (TS & Observers)
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_explorer_3\plan.md (Verification & TS Scoping Fix)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

WRITE OWNERSHIP:
You have exclusive write ownership of:
- index.html
- carta.html
- admin.html
- experiencia.html
- src/style.css
- src/main.ts
- src/supabase.ts (remove/purge)
- src/experiencia.ts

TASK:
Implement Milestone 1 (Fase 1: Rendimiento Web y Saneamiento de Assets):
1. HTML & Asset Saneamiento:
   - In `index.html`: Remove the 10 residual Supabase `<img>` tags in `#main-gallery-grid` (lines 216–261). Replace with clean skeleton placeholder items (`.gallery-skeleton`) with reserved dimensions (`height: 55vh; min-height: 400px;`) so no ghost downloads occur and CLS = 0.
   - In `index.html`: Replace Supabase `og:image` with `https://www.sabeaperu.es/assets/Hero1.webp`.
   - In `experiencia.html`: Replace 4 Supabase image references with local `/assets/...` WebP images.
   - In `src/style.css`: Delete line 1 (`@import` synchronous font loading). Add `.gallery-skeleton` styling.
   - In `index.html`, `carta.html`, `admin.html`, `experiencia.html`: Add `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, and `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;600&display=swap">` in `<head>`.
   - In `index.html`: Assign `fetchpriority="high"`, `loading="eager"`, and `decoding="async"` to `#img-hero-1` (Hero LCP). Set `loading="lazy"` and `decoding="async"` on slides 2..4 and below-the-fold content images.
2. TypeScript & Scroll Observers / Timers:
   - In `src/main.ts`: Refactor `.reveal` animations to a passive `IntersectionObserver` (`rootMargin: '0px 0px -80px 0px', threshold: 0.1`) that calls `obs.unobserve(entry.target)` when active.
   - Refactor Section Navigation (scroll spy) to an `IntersectionObserver` on `section[id]`, eliminating forced reflows (`section.offsetTop`).
   - Refactor Sticky Header to a single `{ passive: true }` listener throttled with `requestAnimationFrame` (`isScrollTicking`).
   - CRITICAL SCOPE FIX (from m1_explorer_3): Hoist lifecycle handles (`startHeroSlideshow`, `stopHeroSlideshow`, `startAutoScroll`, `stopAutoScroll`, `isHeroInView`, `isGalleryInView`) to the top-level `DOMContentLoaded` scope so that `visibilitychange` listener does not throw `TS2304`.
   - Implement `visibilitychange` listener to pause slideshow and gallery auto-scroll when `document.visibilityState === 'hidden'` and resume when `visible`.
   - Purge Supabase: remove or isolate `src/supabase.ts`, sanitize warnings in `src/main.ts:90` and `src/experiencia.ts:43`. Ensure 0 imports of `@supabase/supabase-js` in `src/`.
3. Verification:
   - Run `npm run pipeline` (`tsc --noEmit && vite build`) and verify it finishes with Exit Code 0 and 0 errors.
   - Verify 0 Supabase references in `src/` and HTML.
   - Write your complete handoff report to `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_worker_1\handoff.md`.
   - Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
