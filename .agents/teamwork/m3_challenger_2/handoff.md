# Handoff Report: Milestone 3 Empirical Behavioral Stress Testing

**Agent**: `m3_challenger_2` (M3 Challenger - DOM & Behavioral Stress Testing)  
**Role**: Critic, Specialist (`qa-browser-testing`)  
**Date**: 2026-10-13  
**Status**: TASK COMPLETE (Hard Handoff)  
**Parent Agent**: `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Verdict**: **REJECT** (Milestone 3 requires targeted remediation)

---

## 1. Observation

### 1.1 Tool Commands & Test Results
1. **Pipeline Build** (`npm run pipeline` -> `tsc --noEmit && vite build`):
   ```text
   vite v7.3.1 building client environment for production...
   transforming...
   ✓ 34 modules transformed.
   rendering chunks...
   dist/assets/style-Bl_AEG0o.css   23.16 kB │ gzip:  5.82 kB
   dist/assets/main-Dlwoh5pq.js     16.74 kB │ gzip:  6.85 kB
   ✓ built in 1.25s
   Exit code: 0
   ```
2. **Native Test Suite** (`npm test` -> `node --test tests/**/*.test.mjs`):
   ```text
   ℹ tests 180
   ℹ suites 46
   ℹ pass 180
   ℹ fail 0
   ℹ duration_ms 6772.9689
   Exit code: 0
   ```
3. **Stand-alone E2E Tiers 1–4** (`npm run test:all` -> `node tests/test-runner.mjs`):
   ```text
   RESULT: ALL TEST SUITES PASSED (Duration: 5.99s)
   Tier 1: Pipeline & Hygiene           [PASS]
   Tier 2: Boundary & Domain Invariants [PASS]
   Tier 3: DOM Transitions & Pairwise   [PASS]
   Tier 4: Real-World Scenarios         [PASS]
   Exit code: 0
   ```
4. **Adversarial Challenger Suite** (`node --test tests/tier5-m3-challenger.test.mjs`):
   ```text
   ▶ Tier 5: Adversarial Challenger Stress Suite (Milestone 3)
     ✔ Scenario C1: Menu Filtering & Category State Transitions (2.5882ms)
     ✔ Scenario C2: Photo Modal Lifecycle & Dismissal Invariants (2.9835ms)
     ✔ Scenario C3: Edge-Case Inputs & Sanitization Invariants (3.2041ms)
     ✔ Scenario C4: Static Hygiene, Design Tokens & Pipeline SLA (1.7202ms)
   ℹ tests 21, suites 5, pass 21, fail 0
   Exit code: 0
   ```

### 1.2 Direct Code Observations & Defect Sites
1. **Defect 1: Photo Modal Missing Escape Key Listener (`src/main.ts:443-486`)**:
   In `src/main.ts`, the modal dismissal handlers are implemented as follows:
   ```typescript
   476:        const closeFunc = () => {
   477:          photoModal?.classList.remove('active');
   478:          if (modalImg) modalImg.src = '';
   479:          document.body.style.overflow = '';
   480:        };
   481:
   482:        closeModalBtn?.addEventListener('click', closeFunc);
   483:        photoModal?.addEventListener('click', (e) => {
   484:          if (e.target === photoModal) closeFunc();
   485:        });
   ```
   A global grep across `src/` for `keydown`, `keyup`, or `Escape` yielded **zero matches**. Pressing `Escape` does not trigger `closeFunc()`, leaving the modal open and `document.body.style.overflow = 'hidden'` locked.

2. **Defect 2: Listener Accumulation / Re-binding on Category Switch (`src/main.ts:393-486`)**:
   In `src/main.ts`, `loadMenu(category, tagFilter)` contains the event binding logic for `closeModalBtn` and `photoModal`:
   ```typescript
   393:    async function loadMenu(category: string, tagFilter: string | null = null) {
   ...
   444:        const photoModal = document.getElementById('menu-photo-modal');
   ...
   448:        const closeModalBtn = photoModal?.querySelector('.close-menu-modal');
   ...
   482:        closeModalBtn?.addEventListener('click', closeFunc);
   483:        photoModal?.addEventListener('click', (e) => {
   484:          if (e.target === photoModal) closeFunc();
   485:        });
   ```
   Both `#menu-photo-modal` and `.close-menu-modal` reside in `carta.html` outside `#menu-grid`. Every time the user clicks a category filter (`filterBtns.forEach(btn => btn.addEventListener('click', () => loadMenu(cat, null)))`), `loadMenu` runs and attaches a **new closure** to `closeModalBtn` and `photoModal`. After 5 switches, 5 duplicate listeners fire on each close interaction (empirically reproduced in `T5.M3.4`).

3. **Defect 3: Non-Array `tags` Runtime Crash (`src/main.ts:101`)**:
   In `renderMenuItemHtml`:
   ```typescript
   101:  const pillsHtml = (item.tags || [])
   102:    .filter(isValidAllergenTag)
   103:    .map(renderAllergenPill)
   104:    .join('');
   ```
   If a Firestore document contains a non-array truthy value (e.g. `tags: "pescado"` from legacy storage or administrative free-text input), `(item.tags || [])` evaluates to `"pescado"`. Calling `"pescado".filter(...)` throws `TypeError: (item.tags || []).filter is not a function`. Because `loadMenu` wraps processing in a top-level `try/catch` (`src/main.ts:487-490`), this unhandled exception aborts rendering and displays `"Estamos ordenando los sabores. Por favor, refresca en un momento."`, crashing the entire menu (empirically reproduced in `T5.M3.14`).

4. **Defect 4: HTML Attribute Quote Breakout in `data-desc` (`src/main.ts:107`)**:
   In `renderMenuItemHtml`:
   ```typescript
   107:    ? `<button class="dish-photo-trigger" data-img="${item.image_url}" data-name="${cleanName}" data-desc="${item.description || ''}" aria-label="Ver fotografía del plato">
   ```
   Double quotes inside `item.description` (e.g. `Solomillo al estilo "Chifa"`) are injected verbatim without HTML entity escaping (`&quot;`). The browser parses the closing quote prematurely, truncating `data-desc` to `"Solomillo al estilo "` and leaving trailing text as orphaned attributes (empirically reproduced in `T5.M3.17`).

5. **Defect 5: Long Market Price Header Layout Crowding (`src/main.ts:99-125` & `src/style.css:515-519`)**:
   When `price <= 0`, `formatMenuItemPrice` assigns `description` to `displayPrice`, and `renderMenuItemHtml` empties `descriptionDisplay`. This pushes descriptions up to 150+ characters inside `<span class="menu-item-price dual">` within `.menu-item-header`. Because `.menu-item-header` is `display: flex; justify-content: space-between; align-items: baseline;` without `flex-wrap: wrap`, the title and description are forced into a single horizontal baseline row, causing visual crowding on 375px mobile screens.

---

## 2. Logic Chain

1. **Premise 1 (Prompt Contract)**: The dispatch instructions explicitly mandated testing:
   *"2. Test photo modal lifecycle: verify opening via `.dish-photo-trigger`, Cloudinary URL transformation, and clean closing via escape/backdrop."*
2. **Premise 2 (Defect 1 Observation)**: Section 1.2 observed that `src/main.ts` contains zero keydown listeners for `Escape`.
3. **Deduction 1**: When a user opens `#menu-photo-modal`, `document.body.style.overflow` is set to `'hidden'`. If a keyboard-only user or customer presses `Escape`, the modal fails to dismiss, leaving the viewport scroll-locked. This violates accessibility (WAI-ARIA modal dialogs) and fails Task Item 2.
4. **Premise 3 (Defect 2 Observation)**: Section 1.2 observed that `closeModalBtn?.addEventListener('click', closeFunc)` is executed inside `loadMenu`.
5. **Deduction 2**: Every category switch (`comida` -> `bebida` -> `coctel`) invokes `loadMenu`, binding duplicate event listeners to persistent DOM nodes outside `menuGrid`. As proven in `T5.M3.4`, 5 switches result in 5 listeners firing simultaneously on a single click.
6. **Premise 4 (Defect 3 Observation)**: Section 1.2 observed that `renderMenuItemHtml` relies on `(item.tags || []).filter(...)` without checking `Array.isArray(item.tags)`.
7. **Deduction 3**: Untyped runtime data from Firestore with `tags: "pescado"` triggers an immediate `TypeError: .filter is not a function`. The resulting crash replaces the entire digital menu with a generic error state, violating data resilience invariants.
8. **Premise 5 (Defect 4 Observation)**: Double quotes in dish descriptions break the raw `data-desc="${item.description}"` attribute boundary.
9. **Deduction 4**: This breaks photo modal description retrieval (`target.getAttribute('data-desc')` truncates) and presents an attribute breakout vulnerability.
10. **Conclusion**: While emoji eradication and allergen pill rendering were successfully completed, the presence of these four behavioral and DOM defects warrants a **REJECT** verdict until remediated.

---

## 3. Caveats

1. **WhatsApp Reservation Emojis**: Operational emojis in the WhatsApp concierge generator (`src/main.ts:803-807`) belong to Milestone 5 and were appropriately not modified by the Milestone 3 worker.
2. **Network Offline Firestore**: Firestore network failure was simulated via catch blocks; live Firestore partition testing was not run as it requires cloud infrastructure beyond local scope.
3. **No other caveats**: All observations and test results were verified empirically in local execution.

---

## 4. Conclusion

**Verdict: REJECT**

Milestone 3 has achieved significant progress (0 food emojis, 16 uppercase `AllergenTag` pills, Quiet Luxury `.dish-photo-trigger`, zero Wikimedia rasters, pipeline clean in 1.25s). However, it cannot be certified due to the following 4 defects:

### Required Remediation (Action Plan for Worker):
1. **Modal Escape Dismissal**:
   Add a `keydown` listener (e.g. `document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && photoModal.classList.contains('active')) closeFunc(); });`) that closes the modal and resets `document.body.style.overflow = ''`.
2. **Decouple Modal Event Binding from `loadMenu`**:
   Move `closeModalBtn?.addEventListener('click', closeFunc)`, `photoModal?.addEventListener('click', ...)` and the Escape handler OUTSIDE `loadMenu` so they are initialized once on `DOMContentLoaded`.
3. **Defensive Array Guard on `item.tags`**:
   In `renderMenuItemHtml` and `loadMenu`, replace `(item.tags || [])` with `(Array.isArray(item.tags) ? item.tags : [])`.
4. **Escape Double Quotes in HTML Attributes**:
   In `renderMenuItemHtml`, escape `"` to `&quot;` in `data-desc` and `data-name`.
5. **Dual Pricing Header Layout**:
   Add `flex-wrap: wrap` or media queries to `.menu-item-header` in `src/style.css` so long market descriptions wrap cleanly below the title on mobile viewports.

---

## 5. Verification Method

To independently verify these findings:

1. **Execute Tier 5 Challenger Suite**:
   ```powershell
   node --test tests/tier5-m3-challenger.test.mjs
   ```
   *Expected Result*: 21 tests pass, empirically demonstrating all 4 defect reproductions and positive invariants.

2. **Execute Full Project Test Suite**:
   ```powershell
   npm test
   ```
   *Expected Result*: 180 tests pass across 46 suites.

3. **Verify Pipeline Build**:
   ```powershell
   npm run pipeline
   ```
   *Expected Result*: Exit Code 0, bundle size 23.16 kB CSS, 16.74 kB JS.

4. **Verify Escape Key Defect in Source**:
   Inspect `src/main.ts` lines 443–486; observe complete absence of `Escape` or `keydown` listeners.

5. **Verify Non-Array Crash in Node CLI**:
   ```powershell
   node -e "const item = { tags: 'pescado' }; (item.tags || []).filter(t => t);"
   ```
   *Expected Result*: `TypeError: (item.tags || []).filter is not a function`.
