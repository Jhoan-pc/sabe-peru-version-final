# Handoff Report: Milestone 3 — Test Alignment & Visual Harmony

**Agent**: `m3_explorer_3` (M3 Explorer - Test Alignment & Visual Harmony)  
**Parent Conversation ID**: `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Date**: 2026-10-13  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

### Obs 1.1: Existing Test Suites and Coverage Inventory
- Test suite on disk contains 8 test files:
  - `tests/tier1-pipeline-hygiene.test.mjs` (5 suites, 16 tests)
  - `tests/tier2-domain-invariants.test.mjs` (4 suites, 22 tests; suite title: `"Tier 2: Boundary & Domain Invariants"`)
  - `tests/tier3-dom-transitions.test.mjs` (5 suites, 25 tests; suite title: `"Tier 3: Cross-Feature & DOM Transitions"`)
  - `tests/tier4-customer-journeys.test.mjs` (4 suites, 20 tests)
  - `tests/tier5-m1-adversarial.test.mjs` (4 suites, 16 tests)
  - `tests/tier5-m1-challenger.test.mjs` (4 suites, 14 tests)
  - `tests/tier5-m2-challenger.test.mjs` (4 suites, 12 tests)
  - `tests/tier5-m2-typography-adversarial.test.mjs` (5 suites, 34 tests)
- Running `npm test` executes all 8 suites with **159 tests passing, 0 failures, duration 9.6s**.
- Running `npm run pipeline` (`tsc --noEmit && vite build`) executes cleanly with **Exit Code 0 in 1.47s**. Output bundle `dist/assets/style-Cr1z32es.css` is **24.74 kB raw** (< 35 kB SLA) and **6.16 kB gzip** (< 10 kB SLA).

### Obs 1.2: Tier 2 Boundary Invariants Assertions
In `tests/tier2-domain-invariants.test.mjs`:
- Feature 2.3 (lines 145–187): Tests dual pricing formatting:
  - Positive price formats as `XX.XX€` (`menu-item-price`).
  - Price of `0` delegates to description or fallback `'Precio según mercado'` (`menu-item-price dual`).
  - Boundaries: `0.00` is market price; `0.01` is numeric (`0.01€`).
- Feature 2.4 (lines 189–228): Tests AllergenTag enum:
  - Exactly 16 canonical enum values matching `specs/openapi.yaml`.
  - Rejection of unauthorized tags (`nuez`, `vegano`, etc.).
  - Deduplication and validation in `validateDishAllergenTags`.
  - Uppercase pill rendering with `data-allergen` and `.allergen-pill`.

### Obs 1.3: Tier 3 Cross-Feature & DOM Assertions vs. `src/main.ts` Disconnect
- In `tests/tier3-dom-transitions.test.mjs`:
  - Lines 36–62 define a mock pure dish renderer `renderMenuItemHtml(item)` used exclusively for testing.
  - Lines 65–70 define `sanitizeDishName(name)` stripping pictographs, regional flags, and variation selectors while preserving Spanish accents.
  - Features 3.1 & 3.2 verify zero emojis in output, `.allergen-pill` markup, and `.dish-photo-trigger`.
- However, in `src/main.ts` (lines 303–345):
  - Lines 303–320 still contain 16 hardcoded emoji mappings:
    `'pescado': '<span class="menu-tag" tabindex="0" data-tooltip="Pescado">🐟</span>'`, `'marisco': '🦐'`, `'carne': '🥩'`, `'pollo': '🍗'`, `'picante': '🌶️'`, `'gluten-free': '🌾'`, `'gluten': '🌾'`, `'huevos': '🥚'`, `'lacteos': '🥛'`, `'soja': '🫘'`, `'cacahuetes': '🥜'`, `'mostaza': '🟡'`, `'crustaceos': '🦐'`, `'apio': '🥬'`, `'moluscos': '🦪'`, `'sesamo': '🥯'`.
  - Line 341 still contains the emoji camera button:
    `<span style="font-size: 1.1em; margin-right: 3px; pointer-events: none;">📸</span> Ver` inside `.item-photo-btn`.
  - Line 348 embeds icons and button directly inside `<h3>`: `<h3>${item.name}${icons}${photoBtn}</h3>`.
  - No sanitization is performed on incoming dish titles or subcategory titles.

### Obs 1.4: Reviewer 1's Finding in `src/style.css` (Wikimedia PNG Geoglyphs)
- In `src/style.css`:
  - Lines 385–404: `.page-carta .menu-section::before` loads `https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Nazca_hummingbird.svg/1200px-Nazca_hummingbird.svg.png`.
  - Lines 406–424: `.page-carta .menu-section::after` loads `https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Nazca_monkey.svg/1024px-Nazca_monkey.svg.png`.
  - Lines 447–484: `.page-carta .menu-section::before` loads 4 Wikimedia URLs simultaneously (Hummingbird 640px, Monkey 1024px, Spider 800px, Hands 800px) with `filter: invert(1) drop-shadow(0 0 5px rgba(212, 175, 55, 0.2));`.
  - Lines 567–581: `.menu-subcategory-title::before, ::after` load embedded SVG zigzag lines (`stroke='%23cd5c5c'`).
  - Lines 552–553: `.menu-subcategory-title` uses `color: #e6b800; /* Bright Inca Gold */`.
  - Lines 534–535: `.page-carta .serif-title` uses `color: #d4af37; /* Rich Gold */`.

### Obs 1.5: Existing Styling for `.allergen-pill` and `.dish-photo-trigger`
- In `src/style.css`:
  - Lines 648–662: `.allergen-pill` is defined with `font-size: 9px; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 600; color: var(--lux-text-muted); background: transparent; border: 1px solid var(--lux-border-hairline); border-radius: 2px;`.
  - Lines 1400–1435: `.dish-photo-trigger` is defined with `font-size: 10px; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase; color: var(--lux-gold-champagne);` and animated underline `.trigger-line`.

---

## 2. Logic Chain

1. **Premise**: In Milestone 2, the team eradicated the 80px brown stone border and Nazca SVGs on `.page-carta .section-container::before/::after` (lines 511–518).
2. **From Obs 1.4**: However, `.page-carta .menu-section::before` and `::after` (lines 384–424 and 446–489) were left intact, loading 6 remote PNG assets from `upload.wikimedia.org` into the document.
3. **Deduction**: Loading un-cached external Wikimedia images directly violates the Quiet Luxury specification (`specs/design-system-spec.md` §3.B: "Se eliminan las figuras vectoriales embebidas en pseudo-elementos (monos, arañas, colibríes con drop-shadow amarillo)") as well as CWV performance goals (`specs/performance-spec.md`). Purging these rules is required in Milestone 3.
4. **From Obs 1.3**: Existing tests in `tier3-dom-transitions.test.mjs` passed because the test exercised its own local `renderMenuItemHtml` function rather than `src/main.ts`.
5. **Deduction**: `src/main.ts` has not yet undergone the Milestone 3 refactor. The 16 allergen emojis (`🐟`, etc.) and `📸 Ver` button remain active in production code.
6. **From Obs 1.5**: The CSS rules for `.allergen-pill` and `.dish-photo-trigger` already exist in `src/style.css` and adhere strictly to Quiet Luxury design tokens.
7. **Deduction**: The styling prerequisite is already met; the implementer only needs to:
   - Add `.menu-item-footer` to align the pill container and photo trigger on the same row.
   - Refactor `src/main.ts` to output `.allergen-pill` and `.dish-photo-trigger` while sanitizing names with `sanitizeDishName`.
8. **From Obs 1.1**: The project test runner and pipeline are fully functional (`tsc --noEmit && vite build` in 1.47s; 159 tests in 9.6s).
9. **Deduction**: Introducing a dedicated `tests/tier5-m3-challenger.test.mjs` will guarantee that any future regression or omission of M3 requirements immediately breaks the test suite.

---

## 3. Caveats

- **No Caveats Regarding Investigation**: All relevant test files, contracts, specifications, and style sheets were inspected directly.
- **Scope Boundary**: As an Explorer agent, no source code files (`src/main.ts`, `src/style.css`, etc.) were modified. Implementation will be performed by `m3_implementer_1`.
- **Database SSOT**: Tests verify the rendering contracts with mock and sample data; live Firestore synchronization depends on existing collections (`menu_items`).

---

## 4. Conclusion

1. **Reviewer 1's finding is 100% confirmed**: Lines 384–424 and 446–489 in `src/style.css` load Wikimedia PNG geoglyphs and must be purged.
2. **Additional CSS polish needed**: Replace red zigzag SVG lines in `.menu-subcategory-title::before/::after` with gold hairlines (`var(--lux-border-gold-subtle)`), and replace bright gold `#e6b800` / `#d4af37` with `var(--lux-gold-champagne)`. Add `.menu-item-footer`.
3. **Implementer Action Plan for `src/main.ts`**:
   - Strip all hardcoded emoji spans from `tagIcons`.
   - Render `.allergen-pill` spans inside `.menu-item-allergens` using `AllergenTag` validation.
   - Replace `.item-photo-btn` with `.dish-photo-trigger` (`<span>FOTOGRAFÍA</span><span class="trigger-line"></span>`).
   - Implement `sanitizeDishName` to remove emojis from incoming Firestore titles and subcategories.
   - Enforce dual pricing (`menu-item-price dual` when `price <= 0`).
4. **Test Alignment**: Create `tests/tier5-m3-challenger.test.mjs` to enforce zero emojis in `src/main.ts` and `dist/`, zero Wikimedia URLs in CSS, and dual pricing compliance.

---

## 5. Verification Method

To independently verify these findings, run:

1. **Verify Wikimedia PNG Geoglyphs in CSS**:
   ```powershell
   Select-String -Path "src/style.css" -Pattern "wikimedia"
   ```
   *Expected Current Output*: 6 matching lines (393, 414, 458, 459, 460, 461).  
   *Expected Post-Fix Output*: 0 matches.

2. **Verify Hardcoded Emojis in `src/main.ts`**:
   ```powershell
   Select-String -Path "src/main.ts" -Pattern "🐟|📸|tagIcons"
   ```
   *Expected Current Output*: Lines 303–320 and 341 match.  
   *Expected Post-Fix Output*: 0 matches.

3. **Verify Build Pipeline & Typecheck**:
   ```powershell
   npm run pipeline
   ```
   *Expected Output*: Exit code 0, build completes in < 3s, CSS bundle < 35 kB.

4. **Verify Full Automated Test Suite**:
   ```powershell
   npm test
   ```
   *Expected Output*: 159 tests passing, 0 failures.
