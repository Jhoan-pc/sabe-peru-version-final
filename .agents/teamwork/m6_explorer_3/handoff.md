# Handoff Report: Milestone 6 Regression & Test Safety Matrix

**Agent:** `m6_explorer_3` (M6 Explorer - Regression & Test Safety Matrix)  
**Parent Conversation ID:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Working Directory:** `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_3`  
**Date & Timestamp:** 2026-10-14T12:45:00Z  
**Type:** Hard Handoff (Investigation & Test Safety Blueprint Complete)

---

## 1. Observation

Direct empirical evidence collected across the codebase, build pipeline, and test suites:

### 1.1 Root Cause & Remediated Files
1. **`experiencia.html` Line 12:**
   - Previous state documented in `m6_reviewer_2/handoff.md`:
     ```html
     <!-- <link rel="stylesheet" href="/src/style.css"> -->
     ```
   - Current inspected state (`experiencia.html` lines 10-15):
     ```html
     10:     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
     11:     <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;600&display=swap">
     12:     <link rel="stylesheet" href="/src/style.css">
     13:     <link rel="stylesheet" href="/src/experiencia.css">
     14:     <meta name="description" content="Invitación exclusiva a la coctelería de autor de Sabe a Perú en Oviedo.">
     ```
   - Active HTML `<link>` is present without comment wrappers.
2. **`vite.config.ts` Lines 10-21:**
   - Output asset naming configuration:
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
   - Ensures that shared CSS bundled across all 4 entry points is emitted deterministically as `assets/style-[hash].css`, while secondary stylesheets (`experiencia.css`) retain their name `assets/experiencia-[hash].css`.

### 1.2 Build Output & Asset Generation
- **Command Executed:** `npm run pipeline` (`tsc --noEmit && vite build`)
- **Result:** Exit Code 0, completed in 1.26s (< 20s SLA), 0 TypeScript compilation errors.
- **Generated Assets in `dist/assets/`:**
  - `dist/assets/style-D2Lv99Sq.css`: 30,187 bytes raw (< 35 kB SLA) / 6,839 bytes gzip (< 10 kB SLA).
  - `dist/assets/experiencia-B0fP9rJR.css`: 6,316 bytes raw / 2,010 bytes gzip.
  - `dist/assets/main-DXb0uNxv.js`: 17,729 bytes.
  - `dist/assets/admin-MWqVsui8.js`: 20,922 bytes.
  - `dist/assets/experiencia-BSYn5vGK.js`: 4,923 bytes.
  - `dist/assets/reservations-Dc8FlDjG.js`: 6,761 bytes.
  - `dist/assets/firebase-B4cvtWTP.js`: 356,985 bytes.
- **HTML Stylesheet Ingestion in `dist/experiencia.html`:**
  ```html
  16:   <link rel="stylesheet" crossorigin href="/assets/style-D2Lv99Sq.css">
  17:   <link rel="stylesheet" crossorigin href="/assets/experiencia-B0fP9rJR.css">
  ```
  Both stylesheets are injected into production `<head>`.

### 1.3 CSS Source Code Budget
- **File:** `src/style.css`
- **Measured Size:** 34,521 bytes.
- **Budget Threshold:** `<= 35,840 bytes` (35 kB). Margin: `+1,319 bytes` available.
- **Design Tokens:** All 14 canonical Quiet Luxury tokens defined in `:root` (lines 1-15).
- **Anti-Luxury Relics:** 0 occurrences of `border: 80px solid #2e2620`, 0 active Nazca SVGs (`content: none !important`), 0 `@keyframes shiny` or `.item-photo-btn::after` animations.

### 1.4 Codebase AST Static Invariants (`src/*.ts`)
- `alert()`: Exactly 0 active calls across all `.ts` files (enforced by `T5.M6.1`, `J4.5`, `T3.5.3`).
- `window.open()`: Exactly 0 active calls across all `.ts` files (enforced by `T5.M6.2`, `J4.1`, `T3.4.3`).
- `: any` / `as any`: Exactly 0 occurrences across all `.ts` files (enforced by `T5.M6.3`, `J5.4`).
- `firebase/storage`: Exactly 0 imports across all `.ts` files (enforced by `T5.M6.4`, `J3.2`).
- `supabase`: Exactly 0 imports of `@supabase/supabase-js` or `./supabase` in production entry points (enforced by `T5.M6.5`, `J1.5`).

### 1.5 Automated Test Suite Execution
1. **Multi-Tier E2E Runner (`npm run test:all`):**
   - Executed `node tests/test-runner.mjs`.
   - Result: 87/87 tests passed across 21 suites (Duration: 6.94s).
     - Tier 1 (Pipeline & Hygiene): 19 passed.
     - Tier 2 (Boundary & Domain Invariants): 23 passed.
     - Tier 3 (DOM Transitions & Pairwise): 25 passed.
     - Tier 4 (Real-World Scenarios): 20 passed.
2. **Master Stress & Adversarial Suite (`npm test`):**
   - Executed `node --test tests/**/*.test.mjs`.
   - Result: 360/360 tests passed across 91 suites (Duration: 10.15s).
   - 0 failed, 0 cancelled, 0 skipped, 0 todo.

---

## 2. Logic Chain

1. **Premise 1 (The Defect):** In the previous iteration, `experiencia.html` wrapped `<link rel="stylesheet" href="/src/style.css">` inside an HTML comment. This was a facade that passed the string check `content.includes('href="/src/style.css"')` in `T5.M6.7` while preventing browser CSS application.
2. **Premise 2 (Runtime Failure):** `experiencia.html` contains interactive DOM elements (`#toast-container`, `.toast`, `#reservation-confirmation-card`, `.confirmation-card`, `#imperial-table-notice`, `.imperial-notice`, `--lux-*` design tokens). Because `src/experiencia.css` contains zero rules for these classes, they rely entirely on `src/style.css`. Leaving the link commented rendered them unstyled and broken in production.
3. **Premise 3 (Rollup Grouping Mechanism):** Vite/Rollup grouped shared CSS under `firebase-[hash].css` when all four HTML entry points imported `src/firebase.ts`.
4. **Premise 4 (Legitimate Remediation):** By configuring `output.assetFileNames` in `vite.config.ts`, Rollup is instructed to emit shared CSS as `assets/style-[hash].css` while allowing `experiencia.css` to emit as `assets/experiencia-[hash].css`.
5. **Premise 5 (Verification of Emission):** Running `npm run pipeline` with uncommented `<link rel="stylesheet" href="/src/style.css">` in `experiencia.html` and the updated `vite.config.ts` generates both `dist/assets/style-D2Lv99Sq.css` (30.19 kB) and `dist/assets/experiencia-B0fP9rJR.css` (6.32 kB).
6. **Premise 6 (Verification of Injection):** Inspecting `dist/experiencia.html` proves that Vite successfully injected `<link rel="stylesheet" crossorigin href="/assets/style-D2Lv99Sq.css">` alongside `assets/experiencia-B0fP9rJR.css`.
7. **Premise 7 (Zero Regressions Across Matrix):** All 12 formal invariants in the Invariant Verification Matrix are satisfied:
   - `npm run pipeline` Exit Code 0 in 1.26s with 0 TS errors.
   - Emits both `style-*.css` and `experiencia-*.css`.
   - Raw `src/style.css` is 34,521 B (<= 35,840 B).
   - Zero active `alert()`, `window.open()`, `: any`, `firebase/storage`, `supabase`.
   - Multi-tier runner passes 87/87 tests.
   - Global test suite passes 360/360 tests.
8. **Deduction:** The regression and test safety matrix is complete, verified, and ready for multi-role execution by Worker, Reviewers, Challengers, and Auditor.

---

## 3. Caveats

1. **Vite Dynamic Chunk Hashing:** The exact hash in `dist/assets/style-[hash].css` and `dist/assets/experiencia-[hash].css` is content-dependent (`style-D2Lv99Sq.css` and `experiencia-B0fP9rJR.css`). Any subsequent edits to CSS files will alter this hash; automated tests must always filter by `f.startsWith('style-') && f.endsWith('.css')` rather than hardcoding hash strings.
2. **CSS Size Margin:** `src/style.css` currently measures 34,521 bytes against the hard threshold of 35,840 bytes. This leaves a safety buffer of 1,319 bytes. No large CSS rules should be added to `style.css` without pruning or moving page-specific rules to page-specific stylesheets.
3. **Headless Browser Execution vs Mock DOM:** While `npm test` runs 360 tests in `node:test` utilizing regex, AST parsing, and mock DOM environments, full visual layout and live browser interaction should additionally be spot-checked or verified via Playwright/Puppeteer per the `qa-browser-testing` guidelines.

---

## 4. Conclusion

- The regression and test safety matrix for Milestone 6 has been exhaustively investigated and mapped.
- The root cause of the previous INTEGRITY VIOLATION is resolved: `experiencia.html` actively links `/src/style.css`, and `vite.config.ts` deterministically produces `dist/assets/style-[hash].css` and `dist/assets/experiencia-[hash].css`.
- The full 12-point invariant matrix has been verified empirically.
- Role-specific checklists have been formulated for Worker, Reviewers, Challengers, and Auditor in `plan.md`.
- All automated test suites (87/87 multi-tier, 360/360 global) pass with Exit Code 0.

---

## 5. Verification Method

To independently verify all findings and invariants:

1. **Verify `experiencia.html` has active, uncommented link:**
   ```bash
   git grep -n "href=\"/src/style.css\"" experiencia.html
   ```
   *Expected output:* Line 12 shows `<link rel="stylesheet" href="/src/style.css">` without `<!-- -->`.

2. **Verify `vite.config.ts` asset configuration:**
   ```bash
   git grep -n "assetFileNames" vite.config.ts
   ```
   *Expected output:* Maps `firebase.css` and `style.css` to `assets/style-[hash][extname]`.

3. **Verify `src/style.css` raw budget:**
   ```powershell
   powershell -Command "(Get-Item src/style.css).Length"
   ```
   *Expected output:* Number `<= 35840` (actual: 34521).

4. **Run Master Pipeline Build:**
   ```bash
   npm run pipeline
   ```
   *Expected output:* Exit Code 0, completed in `< 20s`, 0 TS errors, outputs `style-*.css` and `experiencia-*.css`.

5. **Verify Compiled HTML Ingestion:**
   ```bash
   git grep -n "style-" dist/experiencia.html
   git grep -n "experiencia-" dist/experiencia.html
   ```
   *Expected output:* Both stylesheets are referenced in `dist/experiencia.html`.

6. **Execute Multi-Tier E2E Runner:**
   ```bash
   npm run test:all
   ```
   *Expected output:* 87 tests passed across Tiers 1-4. Exit Code 0.

7. **Execute Global Hardening Test Suite:**
   ```bash
   npm test
   ```
   *Expected output:* 360 passed, 0 failed across 91 suites. Exit Code 0.
