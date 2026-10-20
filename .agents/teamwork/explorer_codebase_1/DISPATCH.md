## 2026-10-09T17:44:25Z

You are teamwork_preview_explorer_survey_codebase (Codebase Explorer).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\explorer_codebase_1
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

TASK:
Explore and investigate the current implementation across all source code and markup files:
- index.html
- carta.html
- admin.html
- src/style.css
- src/main.ts
- src/admin.ts
- Any other TS/JS/HTML/CSS or asset files in the project

Map the exact lines, structures, and current behaviors relating to debts [DT-01] through [DT-13]:
1. [DT-01] Leftover Supabase `<img>` tags in `#main-gallery-grid` in `index.html`.
2. [DT-02] Synchronous `@import` in `src/style.css` vs missing `<link rel="preconnect">` in HTML files.
3. [DT-03] Hero image attributes (missing `fetchpriority="high"`, `loading="eager"`).
4. [DT-04] Heavy scroll event listeners in `src/main.ts` needing refactor to `IntersectionObserver`.
5. [DT-05] Design tokens in `src/style.css`, brown 80px border, and decorative SVG elements.
6. [DT-06] Continuous reflective animation (*shiny button loop*) on dish photos.
7. [DT-07] Typography families and usage.
8. [DT-08] Hardcoded emojis (`🐟`, `🥩`, `🌶️`, `🌾`) in dish/category titles in `src/main.ts`.
9. [DT-09] Allergen tags and dual pricing resilience (`price == 0` market price).
10. [DT-10] Cloudinary URL normalization in `src/admin.ts` and Firestore `gallery_items` vs Firebase Storage.
11. [DT-11] Free-text allergen input in `admin.html` vs interactive chip selector.
12. [DT-12] Operational action buttons in admin reservation table (Confirm, Cancel, WhatsApp).
13. [DT-13] Reservation concierge flow: `window.open` popup blocking, 2-step confirmation card with `SP-XXXX` code, capacity check (1-6 vs 4 tables, >6 special notice), RFC 9457 toasts vs native `alert()`.

DELIVERABLES:
Write your full findings to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\explorer_codebase_1\codebase_state.md`
And write your final handoff report to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\explorer_codebase_1\handoff.md`
When finished, send a message to parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195) notifying completion.
