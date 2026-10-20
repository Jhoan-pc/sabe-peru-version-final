# Empirical Challenge Report: Milestone 3 (Carta TypeScript Logic & Visual Polish)

**Agent**: `m3_challenger_1` (M3 Challenger - Static & Bundle Adversarial Suite)  
**Date**: 2026-10-13  
**Verdict**: **APPROVE**  
**Parent Agent**: `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Test Suite Created**: `tests/tier5-m3-challenger.test.mjs`

---

## 1. Observation

### 1.1 Source Code & Asset Inspections
1. **Menu Rendering Emojis (`src/main.ts`)**:
   - Lines 1–450 of `src/main.ts` contain strictly 0 emoji pictographs (`\p{Extended_Pictographic}` count: 0).
   - The legacy `tagIcons` dictionary (previously at lines 303–320) has 0 occurrences across `src/main.ts`.
   - The legacy camera emoji `📸` has 0 occurrences in `src/main.ts`. The Quiet Luxury photo trigger is implemented as:
     ```typescript
     <button class="dish-photo-trigger" data-img="${item.image_url}" data-name="${cleanName}" data-desc="${item.description || ''}" aria-label="Ver fotografía del plato">
       <span>FOTOGRAFÍA</span>
       <span class="trigger-line"></span>
     </button>
     ```
   - Gallery titles at lines 511–513 have 0 occurrences of cocktail (`🍸`) or cake (`🍰`) emojis.
   - The only remaining emojis in `src/main.ts` are lines 770–774 (`📅`, `⏰`, `👤`, `📝`, `🎉`), which belong to the reservation WhatsApp concierge template governed under Milestone 5.
2. **Remote Raster & Vector Purge (`src/style.css` and `dist/assets/`)**:
   - `upload.wikimedia.org`: 0 occurrences in `src/style.css`, 0 occurrences in `dist/assets/style-Bl_AEG0o.css`, and 0 occurrences in `dist/assets/experiencia-B0fP9rJR.css`.
   - Nazca geoglyph raster filenames (`Nazca_hummingbird`, `Nazca_monkey`, `Nazca_spider`, `Nazca_hands`): 0 occurrences in `src/style.css` and compiled bundles.
   - Red zigzag SVG & colors (`#cd5c5c`, `%23cd5c5c`, `rgb(205, 92, 92)`, `#e6b800`): 0 occurrences in `src/style.css` and compiled bundles.
   - Subcategory titles (`src/style.css` lines 470–491) now use:
     ```css
     .menu-subcategory-title {
       font-family: var(--font-serif);
       font-size: 2.2rem;
       color: var(--lux-gold-champagne);
       ...
     }
     .menu-subcategory-title::before,
     .menu-subcategory-title::after {
       content: '';
       height: 1px;
       width: 60px;
       background-color: var(--lux-border-gold-subtle);
     }
     ```
   - `.menu-item-footer` is declared at lines 530–538 with `display: flex; justify-content: space-between; align-items: flex-end;`.

### 1.2 Empirical Test Execution Results
1. **Adversarial Challenger Suite (`node --test tests/tier5-m3-challenger.test.mjs`)**:
   - 31 adversarial tests executed across 5 scenarios:
     * Scenario C1: Menu Emoji Eradication & Strict Unicode Hygiene (9/9 pass)
     * Scenario C2: Remote Assets & Deprecated Pattern Purge (7/7 pass)
     * Scenario C3: Dual Pricing Domain & Boundary Invariants (7/7 pass)
     * Scenario C4: Canonical 16 AllergenTag Enum & Pill Rendering Invariants (6/6 pass)
     * Scenario C5: Headless Browser Empirical DOM & Computed Style Audit (2/2 pass via Chrome/Edge CDP)
   - Result: 31/31 passed in 4.01s (0 failed).
2. **Master Build Pipeline (`npm run pipeline` -> `tsc --noEmit && vite build`)**:
   - Exit code: 0
   - TypeScript error count: 0
   - Bundles emitted: 4 HTML pages, 2 CSS bundles, 5 JS bundles in 1.28s.
3. **Automated Test Run (`npm test` -> `node --test tests/**/*.test.mjs`)**:
   - Tests: 190 total (increased from 159).
   - Pass: 190, Fail: 0, Duration: 7.85s, Exit code: 0.
4. **Standalone E2E Runner (`npm run test:all` -> `node tests/test-runner.mjs`)**:
   - Tests: 87 pass, 0 fail across Tiers 1–4, Duration: 6.28s, Exit code: 0.

---

## 2. Logic Chain

1. **Premise 1**: Technical debt items [DT-02], [DT-03], and [DT-07] mandate 0 customer-facing emojis in menu titles, 0 remote `upload.wikimedia.org` geoglyphs, 0 red zigzag subcategory SVGs, dual pricing resilience (`price <= 0` fallback to market indicator), and strict 16 `AllergenTag` enum compliance.
2. **Premise 2**: Observation 1.1 confirms that `tagIcons`, camera buttons (`📸`), external Wikimedia raster URLs, salmon red `#cd5c5c`, and bright Inca gold `#e6b800` are completely purged from `src/main.ts` and `src/style.css`.
3. **Premise 3**: Adversarial fuzzing with 500 randomized inputs in `T5.M3.21` demonstrates 100% equivalence between `src/main.ts` `formatMenuItemPrice` and the formal contract `tests/contracts/pricing.mjs`. Negative and zero prices consistently trigger `.menu-item-price.dual` with description or fallback `'Precio según mercado'`, preventing negative price injection exploits.
4. **Premise 4**: Testing against `specs/openapi.yaml` in `T5.M3.23` confirms that `OFFICIAL_ALLERGEN_TAGS` in `src/main.ts` strictly contains all 16 canonical enum values. Adversarial XSS injection tests (`T5.M3.26` and `T5.M3.27`) confirm that invalid or malicious allergen tags return empty strings and are never injected into the DOM.
5. **Premise 5**: Headless Chrome/Edge evaluation in `T5.M3.29` and `T5.M3.30` proves that `.menu-subcategory-title` computes to Champagne Gold (`rgb(197, 168, 128)`), renders 1px hairline separators, and generates 0 console errors or network 404s.
6. **Premise 6**: The build pipeline compiles with Exit Code 0 and all 190 tests pass with zero regressions across Tiers 1 through 5.
7. **Conclusion**: Milestone 3 satisfies all contractual and adversarial criteria. Verdict is **APPROVE**.

---

## 3. Caveats

1. **Non-printing ZWJ Control Characters (Advisory)**:
   - When sanitizing composite Unicode sequences with Zero-Width Joiners (U+200D), `\p{Extended_Pictographic}` strips all visible pictographs completely (0 emoji glyphs appear on screen).
   - However, U+200D is a format control character (category `Cf`), so an invisible zero-width joiner byte may remain in the string if compound emojis (e.g. `👨‍🍳`) were present.
   - This does not cause any visual regression or break DOM rendering, but could be hardened in a future RFC by adding `[\u{200C}\u{200D}]` to the sanitization regex.
2. **WhatsApp Template Emojis**:
   - Operational emojis in `src/main.ts` lines 770–774 belong to Milestone 5 (Reservation Concierge) and remain properly scoped to that future milestone.
3. **No other caveats**: All contractual invariants for Milestone 3 have been empirically verified.

---

## 4. Conclusion

Milestone 3 is **APPROVED**:
- 0 emoji glyphs in menu rendering logic.
- 0 occurrences of `upload.wikimedia.org` in CSS and compiled bundles.
- 0 occurrences of red zigzag SVGs in subcategories.
- Dual pricing invariants validated across positive, zero, negative, and invalid price boundaries.
- Allergen pill rendering and 16 canonical `AllergenTag` enum strictly enforced.
- 190/190 automated tests pass with 0 regressions.
- `npm run pipeline` completes cleanly in 1.28s with Exit Code 0.

---

## 5. Verification Method

To independently reproduce and verify this empirical challenge:

1. **Run the Milestone 3 Adversarial Test Suite**:
   ```powershell
   node --test tests/tier5-m3-challenger.test.mjs
   ```
   *Expected Output*: 31 tests passed, 0 failed in ~4s.

2. **Run Master Pipeline Build**:
   ```powershell
   npm run pipeline
   ```
   *Expected Output*: Exit Code 0, `tsc --noEmit` reports 0 errors, Vite builds all assets in < 2s.

3. **Run Complete Automated Test Suites**:
   ```powershell
   npm test
   ```
   *Expected Output*: 190 tests passed, 0 failed, duration ~8s.

4. **Run Standalone Multi-Tier Runner**:
   ```powershell
   npm run test:all
   ```
   *Expected Output*: 87 tests passed across Tiers 1–4, Exit Code 0.
