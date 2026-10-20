# Plan & Test Alignment Report: Milestone 3 (Carta/Menu & Visual Polish)

**Agent**: `m3_explorer_3` (M3 Explorer - Test Alignment & Visual Harmony)  
**Date**: 2026-10-13  
**Status**: INVESTIGATION COMPLETE — ACTIONABLE RECOMMENDATIONS READY  

---

## 1. Executive Summary

Milestone 3 focuses on **Fase 3: Lógica TypeScript de Carta y Alérgenos** in `src/main.ts` and ensuring complete visual alignment with the **Quiet Luxury Design System** in `src/style.css`.

Through this read-only investigation, three critical findings were uncovered:
1. **Contract vs. Production Code Disconnect**: The existing test suite in `tests/tier3-dom-transitions.test.mjs` validates a clean, zero-emoji, Quiet Luxury dish renderer (`renderMenuItemHtml`), but that function was implemented **locally within the test file**. The production controller `src/main.ts` (lines 303–345) still retains **16 hardcoded emoji spans** (`🐟`, `🥩`, `🌶️`, `🌾`, etc.), the un-curated **`📸 Ver` photo button**, and missing sanitization of dish names from Firestore.
2. **Reviewer 1's Flag Confirmed — Unpurged Wikimedia PNG Geoglyphs**: In `src/style.css` (lines 384–424 and 446–489), pseudo-elements `.page-carta .menu-section::before` and `::after` still load **multiple remote PNG files from upload.wikimedia.org** (Hummingbird, Monkey, Spider, Hands) with yellow drop-shadows. This constitutes a severe violation of both Quiet Luxury aesthetics and network performance (third-party blocking assets). Additionally, `.menu-subcategory-title::before/::after` still loads an embedded red zigzag SVG pattern (`#cd5c5c`) and uses bright Inca gold (`#e6b800`).
3. **Pill & Photo Trigger CSS Architecture**: The CSS rules for `.allergen-pill` (lines 648–662) and `.dish-photo-trigger` (lines 1400–1435) already exist in `src/style.css` and are properly styled according to Quiet Luxury tokens. What is missing is the layout container `.menu-item-footer` to place them harmoniously, plus migrating `src/main.ts` to actually output these elements.

---

## 2. Test Suite Inventory & Gap Analysis

### 2.1 File Naming Clarification
- The dispatch referenced:
  - `tests/tier2-boundary-invariants.test.mjs` → Discovered on disk as `tests/tier2-domain-invariants.test.mjs` (Suite name: `"Tier 2: Boundary & Domain Invariants"`).
  - `tests/tier3-cross-feature.test.mjs` → Discovered on disk as `tests/tier3-dom-transitions.test.mjs` (Suite name: `"Tier 3: Cross-Feature & DOM Transitions"`).
- Both test files are actively executed by `npm run test:all` (`tests/test-runner.mjs`) and `npm test` (`node --test tests/**/*.test.mjs`).

### 2.2 What Assertions Currently Exist

#### Tier 2 (`tests/tier2-domain-invariants.test.mjs`)
- **Dual Pricing Formatting (Feature 2.3, T2.3.1 – T2.3.5)**:
  - Positively priced dishes (`price > 0`) format to `XX.XX€` with class `menu-item-price` and `isMarketPrice: false`.
  - Dishes with `price == 0` or `price <= 0` delegate to `description` as market indicator with class `menu-item-price dual` and `isMarketPrice: true`.
  - Custom market text descriptions are supported; fallback is `'Precio según mercado'`.
  - Boundary values: `0.00` is market price; `0.01` formats as `0.01€`.
  - Robust handling of numeric strings (`'32.50'`) and invalid values (`NaN`).
- **AllergenTag Enum (Feature 2.4, T2.4.1 – T2.4.5)**:
  - Extracts and verifies that `specs/openapi.yaml` declares exactly the 16 canonical enum values:
    `['apio', 'cacahuetes', 'carne', 'crustaceos', 'gluten', 'gluten-free', 'huevos', 'lacteos', 'marisco', 'moluscos', 'mostaza', 'pescado', 'picante', 'pollo', 'sesamo', 'soja']`.
  - Validates `isValidAllergenTag(tag)` against all 16 tags.
  - Strictly rejects non-standard tags (`nuez`, `vegano`, `cerdo`, `alcohol`, etc.).
  - Validates `validateDishAllergenTags(tags)` for deduplication and invalid tag isolation.
  - Validates `renderAllergenPill(tag)` generating `<span class="allergen-pill" data-allergen="tag">LABEL</span>` in uppercase.

#### Tier 3 (`tests/tier3-dom-transitions.test.mjs`)
- **Zero Emojis (Feature 3.1, T3.1.1 – T3.1.5)**:
  - `sanitizeDishName` strips pictographs (`\p{Extended_Pictographic}`), regional flags (`[\u{1F1E6}-\u{1F1FF}]`), and variation selectors (`[\u{FE00}-\u{FE0F}]`) while preserving Spanish accents (`á, é, í, ó, ú, ñ`).
  - Dish title cards render with zero emoji icons.
  - Subcategory titles contain zero emojis.
  - Dish cards contain zero `.menu-tag` spans with emoji glyphs.
- **Allergen Pills & Layout (Feature 3.2, T3.2.1 – T3.2.5)**:
  - Dishes with tags render `.allergen-pill` elements inside `.menu-item-allergens`.
  - Pill labels are strictly uppercase.
  - `src/style.css` contains token definitions for allergen styling.
  - Dishes with 0 tags omit the `.menu-item-allergens` container cleanly.
  - Pairwise test: Dual pricing dish (`price = 0`) renders along with allergen pills.

### 2.3 Identified Test Gaps for Milestone 3
1. **Source Code Inspection Gap**:
   - Neither Tier 2 nor Tier 3 directly inspects `src/main.ts` or the emitted production bundle `dist/assets/main-*.js` for emojis or allergen pills.
   - As a result, the 159 tests currently pass despite `src/main.ts` still containing:
     ```typescript
     const tagIcons: { [key: string]: string } = {
       'pescado': '<span class="menu-tag" tabindex="0" data-tooltip="Pescado">🐟</span>',
       // ... 15 more hardcoded emoji spans
     };
     ```
     and the camera button:
     ```typescript
     <span style="font-size: 1.1em; margin-right: 3px; pointer-events: none;">📸</span> Ver
     ```
2. **Missing CSS Invariant Assertions for Geoglyphs**:
   - `tier5-m2-challenger.test.mjs` checks for `#2e2620`, `80px 80px`, and `shiny-button`, but **does NOT test for `upload.wikimedia.org` or geoglyph PNGs**.
   - Consequently, the remote Wikimedia image URLs escaped automated detection.
3. **Lack of Dedicated Challenger Suite for Milestone 3**:
   - Milestone 1 has `tests/tier5-m1-challenger.test.mjs` and `tests/tier5-m1-adversarial.test.mjs`.
   - Milestone 2 has `tests/tier5-m2-challenger.test.mjs` and `tests/tier5-m2-typography-adversarial.test.mjs`.
   - Milestone 3 requires `tests/tier5-m3-challenger.test.mjs` to enforce zero emojis in `src/main.ts`, zero Wikimedia URLs in `src/style.css`, and full Quiet Luxury compliance.

---

## 3. CSS Review & Visual Harmony Analysis

### 3.1 Review of `src/style.css` Regarding `.page-carta .menu-section::before`
Reviewer 1's report is fully validated. Two separate blocks inject remote Wikimedia assets:

```css
/* BLOCK 1: Lines 384-424 in src/style.css */
.page-carta .menu-section::before {
  /* El Colibrí */
  background-image: url("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Nazca_hummingbird.svg/1200px-Nazca_hummingbird.svg.png");
  /* ... */
}
.page-carta .menu-section::after {
  /* El Mono */
  background-image: url("https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Nazca_monkey.svg/1024px-Nazca_monkey.svg.png");
  /* ... */
}

/* BLOCK 2: Lines 446-489 in src/style.css */
.page-carta .menu-section::before {
  /* Multiple Lines: Hummingbird, Monkey, Spider, Hands */
  background-image:
    url("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Nazca_hummingbird.svg/640px-Nazca_hummingbird.svg.png"),
    url("https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Nazca_monkey.svg/1024px-Nazca_monkey.svg.png"),
    url("https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Nazca_spider.svg/800px-Nazca_spider.svg.png"),
    url("https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Nazca_hands.svg/800px-Nazca_hands.svg.png");
  /* ... */
}
```

**Architectural Rationale for Removal**:
- **Quiet Luxury Standard (`specs/design-system-spec.md` §3.B, §4)**: Derogates all Nazca animal figures, noisy vector drawings, and excessive ornamental watermarks in favor of generous negative space and refined hairlines.
- **Performance & Privacy (`specs/performance-spec.md`)**: Downloading 4–6 un-cached, large raster images (up to 1200px) from Wikimedia introduces blocking DNS lookups, latency, potential mixed content/CORS errors, and risk of HTTP 429 hotlink bans.
- **Action**: Completely purge or neutralize these rules (`content: none !important; display: none !important;` or direct removal).

### 3.2 Related Visual Inconsistencies in `src/style.css`
1. **Subcategory Title Pattern (Lines 567–581)**:
   ```css
   .menu-subcategory-title::before,
   .menu-subcategory-title::after {
     background-image: url("data:image/svg+xml,...stroke='%23cd5c5c'..."); /* Red/salmon zigzag */
   }
   ```
   *Recommendation*: Replace with a clean gold hairline separator:
   ```css
   .menu-subcategory-title::before,
   .menu-subcategory-title::after {
     content: '';
     height: 1px;
     width: 60px;
     background-color: var(--lux-border-gold-subtle);
   }
   ```
2. **Color Token Alignment (Lines 534 & 552)**:
   - Replace `#d4af37` in `.page-carta .serif-title` with `var(--lux-gold-champagne)` (`#c5a880`).
   - Replace `#e6b800` (Bright Inca Gold) in `.menu-subcategory-title` with `var(--lux-gold-champagne)` or `var(--lux-gold-burnished)`.

### 3.3 Verification of `.allergen-pill` and `.dish-photo-trigger`
Both classes are already implemented in `src/style.css`:
- **`.allergen-pill`** (Lines 648–662):
  - Font: `var(--font-sans)`, `9px`, `uppercase`, `letter-spacing: 0.18em`, `font-weight: 600`.
  - Color: `var(--lux-text-muted)` (`#858076`), `background: transparent`.
  - Border: `1px solid var(--lux-border-hairline)` (`rgba(245, 242, 235, 0.08)`), `border-radius: 2px`.
  - **Verdict**: 100% compliant with Quiet Luxury tokens.
- **`.dish-photo-trigger`** (Lines 1400–1435):
  - Font: `var(--font-sans)`, `10px`, `font-weight: 500`, `letter-spacing: 0.22em`, `uppercase`.
  - Color: `var(--lux-gold-champagne)` (`#c5a880`), transitions to `var(--lux-text-primary)` on hover.
  - Animated underline: `.trigger-line` expands from `width: 0%` to `100%` on hover via cubic bezier.
  - **Verdict**: 100% compliant with Quiet Luxury tokens.
- **Recommended Container Rule**:
  Add `.menu-item-footer` to ensure harmonious layout:
  ```css
  .menu-item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 10px;
  }
  ```

---

## 4. Test Alignment Recommendations for Milestone 3

### 4.1 Recommended New Test Suite: `tests/tier5-m3-challenger.test.mjs`
To ensure ironclad governance and zero regression, implement a dedicated Challenger suite following the pattern of M1 and M2:

| Test ID | Objective | Assertion Description |
|:---|:---|:---|
| **T5.M3.1** | Static Source: Zero Emojis in `src/main.ts` | Scan `src/main.ts` menu rendering logic; assert 0 occurrences of emoji glyphs (`\p{Extended_Pictographic}`, `📸`, etc.). |
| **T5.M3.2** | Static Source: Deprecate `.menu-tag` | Assert that `.menu-tag` is not emitted in `src/main.ts` for dish rendering; only `.allergen-pill` is produced. |
| **T5.M3.3** | Static Source: Quiet Luxury Photo Trigger | Assert that `src/main.ts` renders `.dish-photo-trigger` with `<span>FOTOGRAFÍA</span>` instead of `📸 Ver`. |
| **T5.M3.4** | Static Source: Dual Pricing Invariant | Assert that `src/main.ts` applies `menu-item-price dual` when `price <= 0` and delegates description/market text. |
| **T5.M3.5** | CSS Cleanliness: Zero Wikimedia URLs | Assert 0 matches for `wikimedia` or `upload.wikimedia.org` in `src/style.css` and `dist/assets/style-*.css`. |
| **T5.M3.6** | CSS Cleanliness: Zero Geoglyphs | Assert `.page-carta .menu-section::before` and `::after` do not contain background image geoglyphs. |
| **T5.M3.7** | Production JS Bundle Hygiene | Assert that `dist/assets/main-*.js` contains zero un-sanitized emoji glyphs in the menu chunk. |
| **T5.M3.8** | Subcategory Title Pattern Hygiene | Assert that `.menu-subcategory-title::before/::after` has zero occurrences of `%23cd5c5c` (red zigzag). |

### 4.2 Module Refactor Recommendation for `src/main.ts`
To make menu rendering directly testable without mocking Firestore connections:
- Extract pure helper functions in `src/main.ts` (or export them):
  1. `sanitizeDishName(name: string): string`
  2. `formatMenuItemPrice(price: number | string, description?: string): { priceClass: string, displayPrice: string, isMarketPrice: boolean }`
  3. `renderAllergenPill(tag: string): string`
  4. `renderDishCardHtml(item: MenuItem): string`
- In `loadMenu()`:
  - Sanitize item names and subcategory titles using `sanitizeDishName`.
  - Replace the `tagIcons` lookup table with `renderAllergenPills((item.tags || []).filter(isValidAllergenTag))`.
  - Replace `photoBtn` with `.dish-photo-trigger`.
  - Update photo modal event listeners to query `.dish-photo-trigger, .item-photo-btn`.

---

## 5. Build Safety Verification Checklist

Before and after any changes in Milestone 3, execute this checklist:

### Checklist Matrix

| # | Check | Command / Method | SLA / Acceptance Criteria | Status |
|:---|:---|:---|:---|:---|
| 1 | **TypeScript Compilation** | `npx tsc --noEmit` | Exit code 0, 0 typing errors, duration < 20s | Verified Clean |
| 2 | **Vite Production Bundling** | `npx vite build` | Exit code 0, emits 4 HTML entrypoints & assets | Verified Clean |
| 3 | **Unified Pipeline Execution** | `npm run pipeline` | `tsc --noEmit && vite build` exits with code 0 | Verified Clean (1.47s) |
| 4 | **CSS Bundle Size SLA** | `dist/assets/style-*.css` size | Raw size < 35 kB (currently 24.74 kB); Gzip < 10 kB (currently 6.16 kB) | Verified Clean |
| 5 | **Existing Test Suite Baseline** | `npm test` or `npm run test:all` | 159 / 159 tests passing, 0 failures, 0 skipped | Verified Clean (159 pass) |
| 6 | **Zero Supabase in Production** | Grep in `dist/assets/` | 0 occurrences of Supabase URLs or packages | Verified Clean |
| 7 | **Zero Wikimedia Hotlinks** | Grep `wikimedia` in `src/style.css` and `dist/` | Must be 0 after M3 changes (currently 6 occurrences in `src/style.css`) | Pending M3 Edit |
| 8 | **Zero Emojis in Customer Menu** | Inspection of `src/main.ts` & `dist/assets/main-*.js` | 0 food/camera emojis in menu output | Pending M3 Edit |

---

## 6. Conclusion & Handoff Preparation

- The investigation confirms all specifications, test assertions, and CSS prerequisites.
- The implementer agent (`m3_implementer_1`) has clear, risk-free targets:
  1. Purge Wikimedia PNG URLs and zigzag SVGs from `src/style.css`.
  2. Implement pure Quiet Luxury dish rendering in `src/main.ts` (0 emojis, 16 `AllergenTag` pills, `.dish-photo-trigger`, dual pricing).
  3. Ensure both `npm run pipeline` and `npm test` pass with 100% compliance.
