## 2026-10-13T13:40:29Z
You are m3_worker_1 (M3 Worker - Carta TypeScript Logic & Visual Polish).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m3_worker_1
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Read the implementation blueprints before starting:
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m3_explorer_1\plan.md (Allergen Contracts & Specs)
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m3_explorer_2\plan.md (TypeScript Carta Implementation)
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m3_explorer_3\plan.md (Visual Polish & Test Alignment)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

WRITE OWNERSHIP:
You have exclusive write ownership of:
- src/main.ts
- src/style.css

TASK:
Implement Milestone 3 (Fase 3: Lógica TypeScript de Carta y Alérgenos & Polish Visual):
1. In `src/main.ts`:
   - Declare canonical contracts & types: `OFFICIAL_ALLERGEN_TAGS`, `AllergenTag`, `MenuCategory`, `MenuItem`, `FormattedPrice`.
   - Implement pure functions:
     * `sanitizeDishName(name: string): string` (strips emojis/flags/pictographs while preserving Spanish accents).
     * `isValidAllergenTag(tag: string): tag is AllergenTag`.
     * `renderAllergenPill(tag: string): string` (renders uppercase `.allergen-pill` with `data-allergen`).
     * `formatMenuItemPrice(price: number | string, description?: string): FormattedPrice` (handles `price <= 0` or market price text as `.menu-item-price.dual` with description or "Precio según mercado", and numeric `price > 0` as `XX.XX€`).
     * `renderMenuItemHtml(item: MenuItem): string` (uses clean title, price, description, `.menu-item-footer`, `.menu-item-allergens` with pills, and `.dish-photo-trigger` with `<span>FOTOGRAFÍA</span><span class="trigger-line"></span>`).
   - In `loadMenu`:
     * Eradicate the `tagIcons` object (remove all emojis: 🐟, 🥩, 🌶️, 🌾, etc.).
     * Sanitize subcategory names with `sanitizeDishName(sub)`.
     * Render items using `renderMenuItemHtml`.
     * Update photo modal event listeners to bind to `.dish-photo-trigger, .item-photo-btn`.
     * Eliminate explicit `: any` types across carta functions.
     * Clean up secondary emojis in gallery items if needed (e.g. cocktails/desserts titles).
2. In `src/style.css`:
   - Purge the un-cached Wikimedia PNG geoglyphs in `.page-carta .menu-section::before` and `::after` (lines 384–424 and 446–489), setting `content: none !important; display: none !important;` or removing them cleanly.
   - Clean up `.menu-subcategory-title::before, ::after` (replace salmon zigzag SVG with subtle hairline `var(--lux-border-gold-subtle)`).
   - Ensure `.menu-item-footer` rule is defined (`display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; flex-wrap: wrap; gap: 8px;`).
3. Verification:
   - Run `npm run pipeline` (`tsc --noEmit && vite build`) -> verify Exit Code 0 and 0 errors.
   - Run `npm test` -> verify all tests pass (159+ passing tests).
   - Deliverables: write your complete handoff report to `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m3_worker_1\handoff.md`.
   - Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
