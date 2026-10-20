# Regression & Test Safety Blueprint: Milestone 6 (Final Hardening & Delivery)

**Agent:** `m6_explorer_3` (M6 Explorer - Regression & Test Safety Matrix)  
**Parent Conversation ID:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Working Directory:** `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_3`  
**Date:** 2026-10-14  
**Status:** COMPLETE (Investigation & Blueprint Formulation)

---

## 1. Executive Summary & Root Cause Analysis of M6 Defect

During Milestone 6 review (`m6_reviewer_2/handoff.md`), a critical finding tagged as **INTEGRITY VIOLATION** was identified:
- In `experiencia.html` line 12, the stylesheet link was wrapped inside an HTML comment:
  ```html
  <!-- <link rel="stylesheet" href="/src/style.css"> -->
  ```
- **Why this was done:** Vite/Rollup chunking grouped shared CSS imported by all four entry points (`index.html`, `carta.html`, `admin.html`, `experiencia.html`) under `assets/firebase-[hash].css` because all pages transitively imported `src/firebase.ts`. To satisfy test `T5.M6.7` (which naively verified `content.includes('href="/src/style.css"')`) while avoiding chunk collision with `style-[hash].css` in `dist/assets/`, the link was commented out.
- **Why this is critical:** It left interactive UI components on `experiencia.html` (`#toast-container`, `.toast`, `#reservation-confirmation-card`, `.confirmation-card`, `#imperial-table-notice`, `--lux-*` design tokens) completely unstyled at runtime.
- **Architectural Solution:**
  1. Active, uncommented link in `experiencia.html`:
     ```html
     <link rel="stylesheet" href="/src/style.css">
     <link rel="stylesheet" href="/src/experiencia.css">
     ```
  2. Deterministic Rollup asset chunk naming in `vite.config.ts`:
     ```typescript
     output: {
         assetFileNames: (assetInfo) => {
             if (assetInfo.name === 'firebase.css' || assetInfo.name === 'style.css') {
                 return 'assets/style-[hash][extname]';
             }
             return 'assets/[name]-[hash][extname]';
         }
     }
     ```
  3. Verification that Vite produces both `dist/assets/style-[hash].css` and `dist/assets/experiencia-[hash].css`, both linked properly in `dist/experiencia.html`.

---

## 2. In-Depth Test Suite Analysis

### A. `tests/tier5-m6-pipeline-stress.test.mjs` (All 15 Tests)

| Test ID | Test Name | Assertion / Invariant Verified | Regressibility Risk & Safety Rule |
|---|---|---|---|
| **T5.M6.1** | Exactly 0 occurrences of active `alert()` across ALL TS files | Scans all `.ts` in `src/` (stripped of comments); regex `\balert\s*\(` must return 0 matches. | **HIGH**: Any debugging `alert()` introduced breaks build and violates RFC 9457 error architecture. |
| **T5.M6.2** | Exactly 0 occurrences of active `window.open()` across ALL TS files | Scans all `.ts` in `src/` (stripped of comments); regex `window\.open\s*\(` must return 0 matches. | **HIGH**: Prohibits anti-popup violations; only voluntary `<a>` anchors allowed. |
| **T5.M6.3** | Exactly 0 occurrences of `: any` or `as any` across ALL TS files | Scans all `.ts` in `src/` (stripped of comments); regex `:\s*any\b` and `\bas\s+any\b` must return 0. | **HIGH**: Strict TypeScript hygiene contract. No loose types permitted. |
| **T5.M6.4** | Exactly 0 occurrences of `firebase/storage` imports across ALL TS files | Scans all `.ts` in `src/`; regex `['"]firebase\/storage['"]` must return 0. | **CRITICAL**: Storage must be purged; media is 100% Cloudinary REST/Firestore. |
| **T5.M6.5** | Exactly 0 occurrences of `supabase` imports in production entry points | Checks `main.ts`, `admin.ts`, `experiencia.ts`, `reservations.ts` for `@supabase/supabase-js` or `./supabase`. | **CRITICAL**: Production runtime must be 100% free of Supabase. |
| **T5.M6.6** | All 4 HTML templates include font preconnect links for Google Fonts | Inspects `index.html`, `carta.html`, `admin.html`, `experiencia.html` for `fonts.googleapis.com` and `fonts.gstatic.com` crossorigin. | **MEDIUM**: Necessary for CWV font preconnection without synchronous `@import`. |
| **T5.M6.7** | Verify stylesheet links across all templates (`experiencia.html` for `/src/style.css`) | All 4 templates must include `href="/src/style.css"`. Must be ACTIVE (not commented out). | **CRITICAL**: The core locus of Finding 1. Must remain active HTML `<link>`. |
| **T5.M6.8** | Toast container element (`#toast-container`) is present in templates where notifications are dispatched | Checks `index.html`, `admin.html`, `experiencia.html` for `id="toast-container"`. | **HIGH**: Missing container silently drops RFC 9457 notifications. |
| **T5.M6.9** | Production CSS bundle size SLA (< 35 kB raw, < 10 kB gzip) | Reads `dist/assets/style-*.css`. Must be present, `< 35,840 B` raw and `< 10,240 B` gzip. | **CRITICAL**: Must match chunk pattern `style-*.css` and adhere to size limits. |
| **T5.M6.10** | Raw unbundled `src/style.css` size audit against 35 kB budget | Inspects unbundled `src/style.css` file size. Must be `< 35,840 B`. | **HIGH**: Current is 34,521 B. Margin is ~1.3 kB. Avoid bloat. |
| **T5.M6.11** | Strictly 0 occurrences of `border: 80px` or active Nazca SVG background graphics in CSS | Scans `src/style.css` for `border:\s*80px` (0 matches) and validates `.page-carta .section-container::before` has `content: none !important`. | **HIGH**: Eliminates anti-luxury relics from legacy codebase. |
| **T5.M6.12** | Strictly 0 occurrences of `.item-photo-btn::after` reflective shiny loops in CSS | Confirms absence of `@keyframes shiny` or `shiny-button` and presence of `.item-photo-btn::after { content: none !important; }`. | **HIGH**: Eliminates tacky visual animations. |
| **T5.M6.13** | All required Quiet Luxury `--lux-*` tokens are defined in `:root` | Validates all 14 canonical tokens: `--lux-bg-obsidian`, `--lux-bg-charcoal`, `--lux-bg-surface`, `--lux-bg-alabaster`, `--lux-bg-parchment`, `--lux-gold-champagne`, `--lux-gold-burnished`, `--lux-crimson-mineral`, `--lux-text-primary`, `--lux-text-secondary`, `--lux-text-muted`, `--lux-text-dark`, `--lux-border-hairline`, `--lux-border-gold-subtle`. | **CRITICAL**: SSOT design tokens for all pages and components. |
| **T5.M6.14** | `tsc --noEmit` completes with exit code 0 and 0 errors in under 20s | Spawns `npx tsc --noEmit`. Must exit 0 within 20,000ms. | **CRITICAL**: Static type safety gate. |
| **T5.M6.15** | `npm run pipeline` (`tsc --noEmit && vite build`) finishes with Exit Code 0 in under 20s | Spawns `npm run pipeline`. Must exit 0 within 20,000ms. | **CRITICAL**: CI/CD master compilation pipeline gate. |

---

### B. `tests/tier5-m6-e2e-final.test.mjs` (All 24 Tests)

| Test ID | Test Name | Invariant Description | Scope |
|---|---|---|---|
| **J1.1** | Hero LCP Priority | `#img-hero-1` has `fetchpriority="high"`, `loading="eager"`, `decoding="async"`; slides 2..4 have `loading="lazy"`. | `index.html` |
| **J1.2** | Preconnect & Async Fonts across all MPA entrypoints | Preconnect tags present in all 4 HTML templates; 0 synchronous `@import` in `src/style.css`. | HTML & CSS |
| **J1.3** | Ghost Loading Eradication & Skeleton Reservation | 0 `<img>` tags in `#main-gallery-grid`; min-height `400px` or `55vh` reserved in CSS for gallery skeleton. | `index.html`, `style.css` |
| **J1.4** | Passive IntersectionObserver Architecture | Scroll event listeners in `main.ts` must use passive observer or throttled handlers with cleanup. | `src/main.ts` |
| **J1.5** | Complete Supabase Purge in Production Modules | Zero `@supabase/supabase-js` references in `main.ts`, `admin.ts`, `reservations.ts`, `experiencia.ts`. | `src/*.ts` |
| **J2.1** | Zero Emoji Leakage under Poison Payloads | `sanitizeDishName` strips food, animal, drink, flag emojis, surrogate pairs, skin tone modifiers. | `src/main.ts` |
| **J2.2** | 16 Allergen Tags Enum & Uppercase Pills | Canonical 16 `AllergenTag` values formatted as `<span class="allergen-pill">TAG</span>`. | `contracts/allergens.mjs`, `main.ts` |
| **J2.3** | Dual Pricing Resiliency (`.dual`) | `formatMenuItemPrice(price, desc)`: if `price > 0` returns `"XX.XX €"`; if `price == 0` returns market description. | `src/main.ts` |
| **J2.4** | Dish Photo Modal DOM Structure in `carta.html` | `.close-menu-modal`, `.menu-modal-img`, `.modal-item-name`, `.modal-item-desc`. | `carta.html` |
| **J2.5** | Modal Escape Dismissal & Zero Listener Accumulation | Keydown `Escape` closes modal, restores `body.style.overflow = ''`, no listener leak. | `src/main.ts` |
| **J3.1** | Cloudinary URL Normalization Contract | `normalizeCloudinaryUrl` formats to `f_auto,q_auto,w_{width},c_limit`, strips `?v=`, leaves non-Cloudinary unchanged. | `src/admin.ts`, `src/main.ts` |
| **J3.2** | Backoffice Gallery via Firestore `gallery_items` | Zero references to Firebase Storage bucket or `restaurante-assets/`. | `src/admin.ts` |
| **J3.3** | Interactive 16-Chip Allergen Selector Form Sync | Admin panel has 16 `.tag-chip` buttons; toggling active class synchronizes array. | `admin.html`, `src/admin.ts` |
| **J3.4** | File Validation & Live Image Preview (10MB Budget) | Rejects files > 10MB (`10 * 1024 * 1024`); validates image MIME types; creates object URL. | `src/admin.ts` |
| **J3.5** | Reservation Operational Hub — State Filter Tabs & Actions | Tabs: `Pendientes`, `Hoy`, `Todas`; Buttons: `btn-confirm-res`, `btn-cancel-res`, `btn-wa-client`. | `admin.html`, `src/admin.ts` |
| **J4.1** | Anti-Popup Blocker Immunity (Zero `window.open`) | Two-step booking: Firestore reservation registration -> confirmation card with voluntary WhatsApp CTA. | `src/reservations.ts`, `main.ts` |
| **J4.2** | Crockford-32 Reservation Locator | Matches `^SP-[A-Z0-9]{4}$`; alphabet excludes I, L, O, U; 1,000 generations without collisions. | `src/reservations.ts` |
| **J4.3** | 4-Table Capacity Limit & Availability Check | Slot active count 0..3 -> available; >= 4 -> full (`Completo`); cancelled excluded. | `src/reservations.ts` |
| **J4.4** | Imperial Table Advisory Policy (> 6 Pax) | Guests 1..6 standard; 7..20 triggers `#imperial-table-notice` banner; > 20 rejected. | `src/reservations.ts`, `main.ts` |
| **J4.5** | RFC 9457 Problem Details Toasts & Zero `alert()` | Schema has `type`, `title`, `status`, `detail`; rendered as DOM toast (`role="alert"`); zero `alert()`. | `src/reservations.ts`, `main.ts` |
| **J5.1** | Quiet Luxury Color Tokens declared in `:root` | All 14 tokens in `:root` with exact color hex codes. | `src/style.css` |
| **J5.2** | Derogation of 80px Brown Border & Nazca SVGs | 0 occurrences of `80px` border; `content: none !important` on Nazca pseudo-elements. | `src/style.css` |
| **J5.3** | Neutralization of Shiny Button Animation Loop | Abolish `@keyframes shiny`; `.item-photo-btn::after { content: none !important; }`. | `src/style.css` |
| **J5.4** | Zero TypeScript `: any` Annotations Across Production | Static AST verification across all production `.ts` modules. | `src/*.ts` |

---

### C. `tests/tier4-customer-journeys.test.mjs` (20 Tests across 4 Scenarios)

1. **Scenario 4.1: Customer Menu Journey (5 tests)**
   - `T4.1.1`: Filter menu by category (`comida` vs `coctel`).
   - `T4.1.2`: Menu items sorted strictly by `sort_order` ascending.
   - `T4.1.3`: Filter by allergen tag (e.g. `tag=marisco`) isolating matching dishes.
   - `T4.1.4`: Open dish photograph modal via editorial trigger and close it via Escape or click.
   - `T4.1.5`: Dual pricing dishes render properly without `NaN` errors or missing values.
2. **Scenario 4.2: Customer Reservation Booking Journey (5 tests)**
   - `T4.2.1`: Available slots render based on `KITCHEN_HOURS` (30m intervals) and database counts.
   - `T4.2.2`: Standard reservation (4 guests) produces pending record and `SP-XXXX` locator.
   - `T4.2.3`: Zero asynchronous `window.open` triggered on submission (Anti-Blocker Protection).
   - `T4.2.4`: Voluntary user click on WhatsApp CTA generates well-formed `wa.me` link with locator.
   - `T4.2.5`: Large group (> 6 guests up to 20) triggers Imperial Table advisory.
3. **Scenario 4.3: Admin Reservation State Management Journey (5 tests)**
   - `T4.3.1`: Admin filters reservations table by tabs (`Pendientes`, `Hoy`, `Todas`).
   - `T4.3.2`: Admin confirms reservation (`btn-confirm-res`) mutating status to `confirmed`.
   - `T4.3.3`: Admin cancels reservation (`btn-cancel-res`) freeing up slot capacity.
   - `T4.3.4`: Admin clicks WhatsApp client button (`btn-wa-client`) generating direct chat URL.
   - `T4.3.5`: Error during state update maps to RFC 9457 Problem Details toast (no native `alert`).
4. **Scenario 4.4: Admin Dish & Multimedia Management Journey (5 tests)**
   - `T4.4.1`: File validation rejects files exceeding 10 MB limit.
   - `T4.4.2`: File validation rejects unsupported MIME types.
   - `T4.4.3`: Cloudinary upload result is passed through `normalizeCloudinaryUrl`.
   - `T4.4.4`: Allergen chips panel toggle extracts clean tags string array.
   - `T4.4.5`: Resetting dish form resets tags to empty array.

---

### D. `tests/tier2-domain-invariants.test.mjs` (23 Tests across 4 Features)

1. **Feature 2.1: Cloudinary URL Normalization (6 tests)**
   - Standard URL receives `f_auto,q_auto,w_800,c_limit`.
   - Query strings like `?v=123` are stripped clean.
   - Prevents nested/duplicate transformations if existing transforms are present.
   - Respects custom width parameter (`w_400`, `w_1200`, `w_1600`).
   - Edge cases return input unchanged (null, undefined, non-Cloudinary, missing `/upload/`).
   - Adversarial edge cases (complex queries, multi-segment paths, encoded characters).
2. **Feature 2.2: Slot Capacity Limits (6 tests)**
   - Slot with 0 bookings -> `available: true`.
   - Boundary: Slot with 3 bookings -> `available: true`.
   - Boundary: Slot with 4 bookings -> `available: false` with reason `"Completo"`.
   - Slot with > 4 bookings -> `available: false`.
   - Cancelled reservations strictly excluded from capacity calculation.
   - Slot generation adheres to `KITCHEN_HOURS` 30m intervals for each day of the week.
3. **Feature 2.3: Dual Pricing Formatting (5 tests)**
   - Standard positive price formats with two decimal places and `€` symbol (`"18.50 €"`).
   - Price of 0 delegates to description as market price indicator (`"Precio de mercado según lonja"`).
   - Price of 0 with custom description delegates custom market text.
   - Boundary values: `0.00` is market price, `0.01` is numeric price (`"0.01 €"`).
   - Handles numeric strings and invalid inputs with fallback.
4. **Feature 2.4: 16 AllergenTag Enum Verification (6 tests)**
   - Enum contains exactly the 16 canonical items in `specs/openapi.yaml`:
     `pescado, marisco, carne, pollo, picante, gluten-free, gluten, huevos, lacteos, soja, cacahuetes, mostaza, crustaceos, apio, moluscos, sesamo`.
   - Validates all 16 official allergen tags.
   - Rejects unknown or unstandardized allergen tags.
   - `validateDishAllergenTags` enforces uniqueness and reports invalid tags.
   - Allergen pill markup outputs uppercase text and semantic class `allergen-pill`.

---

### E. Multi-Tier Runner `npm run test:all` (87 Tests)

The multi-tier test runner (`tests/test-runner.mjs`) executes:
- **Tier 1: Pipeline & Hygiene (`tests/tier1-pipeline-hygiene.test.mjs`)**: 19 tests
  - TypeScript strict compilation & JSONC syntax
  - Vite build output entry points & asset integrity
  - Zero Supabase in `main.ts`, `admin.ts`, `reservations.ts`, and bundle
  - Image hygiene, preview IDs, zero duplicate `src`, alt tags present
- **Tier 2: Boundary & Domain Invariants (`tests/tier2-domain-invariants.test.mjs`)**: 23 tests
  - Cloudinary normalization pure contract
  - Kitchen slot capacity & 30m intervals
  - Dual pricing formatting & boundary resilience
  - 16 AllergenTag enum contract & uppercase pill rendering
- **Tier 3: DOM Transitions & Pairwise (`tests/tier3-dom-transitions.test.mjs`)**: 25 tests
  - Zero hardcoded emojis in dish titles & headers
  - Allergen pills styling & DOM semantics
  - Interactive allergen chips in Admin Backoffice
  - 2-step WhatsApp reservation flow with `SP-XXXX` locator
  - RFC 9457 Problem Details toast generation (zero `alert()`)
- **Tier 4: Customer Journeys (`tests/tier4-customer-journeys.test.mjs`)**: 20 tests
  - Customer menu browsing & filtering
  - Customer reservation flow with popup blocker protection
  - Admin reservation state management
  - Admin dish & multimedia management
- **Total:** `19 + 23 + 25 + 20 = 87 tests`. Duration: ~6.9s. Must report `ALL TEST SUITES PASSED` with Exit Code 0.

---

### F. Complete Global Test Suite (`npm test`: 360 Tests across 91 Suites)

When running `node --test tests/**/*.test.mjs`, all 16 test suites run:
- Tiers 1-4: 87 tests
- Tier 5 (M1-M6 Adversarial & Stress Suites):
  1. `tier5-m1-adversarial.test.mjs`: 12 tests
  2. `tier5-m1-challenger.test.mjs`: 20 tests
  3. `tier5-m2-challenger.test.mjs`: 20 tests
  4. `tier5-m2-typography-adversarial.test.mjs`: 20 tests
  5. `tier5-m3-challenger.test.mjs`: 20 tests
  6. `tier5-m3-challenger-gen2.test.mjs`: 23 tests
  7. `tier5-m4-challenger.test.mjs`: 32 tests
  8. `tier5-m4-behavioral-stress.test.mjs`: 25 tests
  9. `tier5-m5-challenger.test.mjs`: 31 tests
  10. `tier5-m5-behavioral-stress.test.mjs`: 31 tests
  11. `tier5-m6-e2e-final.test.mjs`: 24 tests
  12. `tier5-m6-pipeline-stress.test.mjs`: 15 tests
- **Total:** `87 + 273 = 360 tests`. Duration: ~10.15s. All 360 must pass with 0 failures, 0 cancellations, 0 skips.

---

## 3. Exact Invariant Verification Matrix

| # | Invariant | Formal Requirement | Verification Command / Check | Acceptance Criterion |
|---|---|---|---|---|
| **INV-01** | **Pipeline Clean Execution** | `npm run pipeline` compiles TypeScript without emit and runs Vite production build. | `npm run pipeline` | Exit Code 0, completed in `< 20s` (actual: ~1.26s), 0 TS compilation errors. |
| **INV-02** | **CSS Artifact Production** | Vite build must produce `dist/assets/style-*.css` (containing Quiet Luxury tokens & shared styles) AND `dist/assets/experiencia-*.css`. | `dir dist\assets\*.css` | Both files exist in `dist/assets/`: `style-[hash].css` and `experiencia-[hash].css`. |
| **INV-03** | **HTML Stylesheet Ingestion** | All 4 HTML templates in `dist/` must reference `style-[hash].css`. `dist/experiencia.html` must reference both `style-[hash].css` and `experiencia-[hash].css`. | `findstr /i "style-" dist\*.html` and `findstr /i "experiencia-" dist\experiencia.html` | Both stylesheets actively referenced in `dist/experiencia.html`; exactly 0 commented `<link>` tags. |
| **INV-04** | **Raw CSS Size Budget** | `src/style.css` on disk must be strictly under 35 kB (35,840 bytes). | `(Get-Item src/style.css).Length` | Length `<= 35,840` bytes (current: 34,521 bytes; safety margin: 1,319 bytes). |
| **INV-05** | **Bundle CSS Size Budget** | Production bundle `dist/assets/style-*.css` must be `< 35 kB` raw and `< 10 kB` gzip. | `node -e "const z=require('zlib'),f=require('fs');const b=f.readFileSync(f.readdirSync('dist/assets').filter(x=>x.startsWith('style-')&&x.endsWith('.css')).map(x=>'dist/assets/'+x)[0]);console.log(b.length, z.gzipSync(b).length);"` | Raw `< 35,840` bytes (actual: 30,187 B); Gzip `< 10,240` bytes (actual: 6,839 B). |
| **INV-06** | **Zero Active `alert()`** | 0 active `alert()` calls across all `.ts` files in `src/`. | `node --test tests/tier5-m6-pipeline-stress.test.mjs` (T5.M6.1) | Exactly 0 violations. RFC 9457 toasts used exclusively. |
| **INV-07** | **Zero Active `window.open()`** | 0 active `window.open()` calls across all `.ts` files in `src/`. | `node --test tests/tier5-m6-pipeline-stress.test.mjs` (T5.M6.2) | Exactly 0 violations. Voluntary WhatsApp links via semantic `<a>` tags. |
| **INV-08** | **Zero `: any` / `as any`** | 0 unsafe TypeScript type escapes across all `.ts` files in `src/`. | `node --test tests/tier5-m6-pipeline-stress.test.mjs` (T5.M6.3) | Exactly 0 violations. Strict static typing across all modules. |
| **INV-09** | **Zero `firebase/storage`** | 0 references to Firebase Storage module. | `node --test tests/tier5-m6-pipeline-stress.test.mjs` (T5.M6.4) | Exactly 0 imports of `firebase/storage`. Gallery uses Firestore `gallery_items`. |
| **INV-10** | **Zero Supabase in Prod** | 0 imports of `@supabase/supabase-js` or `./supabase` in production entry points. | `node --test tests/tier5-m6-pipeline-stress.test.mjs` (T5.M6.5) | Exactly 0 references. `src/supabase.ts` deleted/isolated. |
| **INV-11** | **Multi-Tier E2E Pass** | All core E2E journeys and domain invariants in Tiers 1-4 pass without warnings or failures. | `npm run test:all` | 87/87 tests PASS in `< 10s` (actual: ~6.94s). |
| **INV-12** | **Full 360-Test Hardening Pass** | All 16 test files pass without a single failure across all 91 test suites. | `npm test` | 360/360 tests PASS in `< 15s` (actual: ~10.15s). |

---

## 4. Multi-Role Verification Checklists

### 4.1 Worker Checklist (Self-Verification before Handoff)

- [ ] **Uncommented HTML Link**: Verify that `experiencia.html` has `<link rel="stylesheet" href="/src/style.css">` as an active HTML tag (NO HTML comments `<!-- ... -->`).
- [ ] **Vite Rollup Asset Mapping**: Verify that `vite.config.ts` includes `rollupOptions.output.assetFileNames` function properly mapping `style.css` and `firebase.css` to `assets/style-[hash][extname]`, preserving `[name]-[hash][extname]` for other assets like `experiencia.css`.
- [ ] **Typecheck**: Run `npx tsc --noEmit` and confirm 0 errors.
- [ ] **Build Check**: Run `npm run pipeline` and verify:
  - Exit code is 0.
  - Duration is `< 20s`.
  - `dist/assets/style-*.css` is generated.
  - `dist/assets/experiencia-*.css` is generated.
  - Both CSS files are linked in `dist/experiencia.html`.
- [ ] **Size Budget Check**:
  - `src/style.css` raw size `<= 35,840 bytes`.
  - `dist/assets/style-*.css` raw size `< 35,840 bytes` and gzip `< 10,240 bytes`.
- [ ] **Hygiene Grep**:
  - `grep` for `alert(` in `src/*.ts` -> 0 results.
  - `grep` for `window.open` in `src/*.ts` -> 0 results.
  - `grep` for `: any` / `as any` in `src/*.ts` -> 0 results.
  - `grep` for `firebase/storage` in `src/*.ts` -> 0 results.
- [ ] **Test Execution**:
  - Run `npm run test:all` -> 87/87 PASS.
  - Run `npm test` -> 360/360 PASS.

---

### 4.2 Reviewer Checklist (Adversarial Static & Structural Audit)

- [ ] **Integrity & Facade Audit**:
  - Inspect `experiencia.html` line-by-line around line 12. Ensure NO HTML comment disguises or shortcuts exist.
  - Inspect `dist/experiencia.html` and confirm both `<link rel="stylesheet" crossorigin href="/assets/style-*.css">` and `<link rel="stylesheet" crossorigin href="/assets/experiencia-*.css">` are injected into `<head>`.
- [ ] **Component Styling Verification on `experiencia.html`**:
  - Verify that `#toast-container` is present in `experiencia.html` and styled via `src/style.css`.
  - Verify that `#reservation-confirmation-card` has `.confirmation-card`, `.locator-wrapper`, `.locator-code` CSS rules active.
  - Verify that `#imperial-table-notice` has `.imperial-notice` CSS rules active.
- [ ] **Rollup Configuration Audit in `vite.config.ts`**:
  - Confirm `output.assetFileNames` is clean, robust, and does not hardcode invalid hashes or cause chunk duplication.
- [ ] **Design System Token Audit**:
  - Confirm all 14 `--lux-*` design tokens exist in `:root` in `src/style.css`.
  - Confirm absence of `border: 80px solid #2e2620`, active Nazca SVGs, and `@keyframes shiny`.
- [ ] **Adversarial Test Audit**:
  - Run `node --test tests/tier5-m6-pipeline-stress.test.mjs` and confirm all 15 tests pass.
  - Run `node --test tests/tier5-m6-e2e-final.test.mjs` and confirm all 24 tests pass.

---

### 4.3 Challenger Checklist (Empirical Stress & Boundary Probing)

- [ ] **Concurrency & Capacity Saturation Stress**:
  - Verify `checkSlotAvailability` under simultaneous bookings. 4 active -> slot marked `Completo`. 5th booking rejected with RFC 9457 Problem Details toast.
  - Verify cancellation of 1 booking dynamically reopens the slot.
- [ ] **Poison Payloads & Sanitization Stress**:
  - Execute `sanitizeDishName` with complex Unicode, emojis (`🐟`, `🥩`, `🌶️`, `🌾`, flags, surrogate pairs, skin tone modifiers) -> 0 emoji leaks.
  - Execute `renderConfirmationCardHtml` with XSS payloads in customer name, notes, email -> 100% escaped.
- [ ] **Responsive Viewport & DOM Layout Stress**:
  - Mobile (375px): verify `.section-container` padding clamp and absence of horizontal overflow.
  - Modal interaction: verify opening dish photo modal sets `overflow = 'hidden'`, Escape key or backdrop click resets `overflow = ''` with zero listener accumulation.
  - Allergen selector: verify all 16 chips toggle and sync cleanly with form submit array.
- [ ] **Performance SLA Stress**:
  - Build execution time under load (`tsc --noEmit && vite build`) must remain under 20s.
  - CSS raw and gzip budgets audited against hard thresholds.

---

### 4.4 Auditor Checklist (Zero-Trust Binary Certification)

- [ ] **SDD Contract Compliance**:
  - OpenAPI 3.1 schema adherence for `AllergenTag` (16 canonical tags), `ProblemDetails` (RFC 9457), and `Reservation` locator format (`^SP-[A-Z0-9]{4}$`).
- [ ] **Full Regression Suite Certification**:
  - `npm run test:all`: 87/87 tests pass. Exit Code 0.
  - `npm test`: 360/360 tests pass across all 91 test suites. Exit Code 0.
- [ ] **Pipeline Build Certification**:
  - `npm run pipeline`: Exit Code 0. 0 TypeScript errors. Duration `< 20s`.
- [ ] **Integrity Certification**:
  - Absence of mock shortcuts, commented test facades, dummy handlers, or disabled assertions.
  - Binary Verdict: **CERTIFIED** (All 12 Invariants Satisfied) or **VETO** (Any Invariant Failed).
