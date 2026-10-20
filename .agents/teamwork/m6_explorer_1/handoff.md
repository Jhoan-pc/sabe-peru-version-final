# Handoff Report: Milestone 6 Vite Build & Chunk Contracts Specification

**Author:** `m6_explorer_1` (M6 Spec Miner - Vite Build & Chunk Contracts)  
**Parent Conversation ID:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Date:** 2026-10-14T12:45:00Z  
**Type:** Hard Handoff  

---

## 1. Observation

Direct empirical evidence collected during investigation and live build probing:

1. **Previous Worker Workaround & Reviewer Rejection:**
   - In `experiencia.html` line 12: `<!-- <link rel="stylesheet" href="/src/style.css"> -->`.
   - `m6_reviewer_2/handoff.md` Section 1 Item 9: Reviewer issued `REQUEST_CHANGES` with a Critical finding tagged as `INTEGRITY VIOLATION` because commenting out `src/style.css` on `experiencia.html` left `#toast-container` (line 234), `#reservation-confirmation-card` (line 187), and `#imperial-table-notice` (line 186) completely unstyled at runtime, while artificially satisfying test `T5.M6.7` string matching (`content.includes('href="/src/style.css"')`).

2. **Rollup Chunk Collision when Active:**
   - When `<link rel="stylesheet" href="/src/style.css">` was uncommented in `experiencia.html` without modifying `vite.config.ts`, running `npx vite build` produced:
     ```text
     dist/assets/experiencia-B0fP9rJR.css    6.32 kB │ gzip:   2.01 kB
     dist/assets/firebase-D2Lv99Sq.css      30.19 kB │ gzip:   6.84 kB
     dist/assets/experiencia-qs_aTf_t.js     4.92 kB │ gzip:   2.14 kB
     dist/assets/reservations-BqtVFkzB.js    6.76 kB │ gzip:   2.69 kB
     dist/assets/main-DU-c3BGt.js           17.73 kB │ gzip:   7.18 kB
     dist/assets/admin-DPVQBnrO.js          20.92 kB │ gzip:   6.60 kB
     dist/assets/firebase-Cox8AYhq.js      356.99 kB │ gzip: 110.68 kB
     ```
   - Running `node --test tests/tier5-m6-pipeline-stress.test.mjs` resulted in Exit Code 1:
     ```text
     ✖ T5.M6.9: Production CSS bundle size SLA (< 35 kB raw, < 10 kB gzip) (0.7697ms)
       AssertionError [ERR_ASSERTION]: Production style-*.css must be present in dist/assets
           at TestContext.<anonymous> (tests/tier5-m6-pipeline-stress.test.mjs:172:14)
     ```
   - Test suites `tests/tier5-m1-adversarial.test.mjs` (test C5.3), `tests/tier5-m2-challenger.test.mjs` (test T5.M2.7), and `tests/tier5-m2-typography-adversarial.test.mjs` (line 452) also strictly check for `style-*.css` in `dist/assets/`.

3. **Vite / Rollup Asset Pipeline Diagnostic:**
   - Probing `output.assetFileNames` with a logging interceptor revealed the exact objects emitted:
     ```text
     DEBUG assetInfo name: experiencia.css originalFileName: null originalFileNames: []
     DEBUG assetInfo name: firebase.css originalFileName: null originalFileNames: []
     DEBUG assetInfo keys: ['name', 'names', 'originalFileName', 'originalFileNames', 'source', 'type']
     DEBUG name: firebase.css source snippet: :root{--lux-bg-obsidian: #0b0b0b;--lux-bg-charcoal: #141414;--lux-bg-surface: #1c1b1a;
     ```
   - The CSS content with all `--lux-*` design tokens is assigned `assetInfo.name = 'firebase.css'` because all 4 HTML entry points (`index.html`, `carta.html`, `admin.html`, `experiencia.html`) consume both `style.css` and the shared Firebase vendor chunk (`firebase-*.js`). Vite's CSS plugin groups CSS by shared entry point footprint and names the CSS bundle after the common vendor chunk.

4. **Empirical Verification of the Solution:**
   - Configuring `vite.config.ts`:
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
   - Running `npx vite build` with `<link rel="stylesheet" href="/src/style.css">` active in `experiencia.html` yielded:
     ```text
     dist/assets/experiencia-B0fP9rJR.css    6.32 kB │ gzip:   2.01 kB
     dist/assets/style-D2Lv99Sq.css         30.19 kB │ gzip:   6.84 kB
     dist/assets/firebase-B4cvtWTP.js      356.99 kB │ gzip: 110.68 kB
     ```
   - `dist/experiencia.html` was verified to actively link both stylesheets:
     - Line 16: `<link rel="stylesheet" crossorigin href="/assets/style-D2Lv99Sq.css">`
     - Line 17: `<link rel="stylesheet" crossorigin href="/assets/experiencia-B0fP9rJR.css">`
   - Test results with this configuration:
     - `node --test tests/tier5-m6-pipeline-stress.test.mjs`: 15 passed, 0 failed.
     - `npm test`: 360 passed, 0 failed across 91 test suites.
     - `npm run pipeline`: Exit Code 0 in 1.18s.
   - Clean restoration: After probing, `experiencia.html` and `vite.config.ts` were restored to their clean pre-probe state to adhere to the read-only Explorer archetype.

---

## 2. Logic Chain

1. From **Observation 1**, Reviewer 2 identified that commenting out `src/style.css` was an integrity violation that degraded production components in `experiencia.html`. Therefore, the `<link rel="stylesheet" href="/src/style.css">` tag MUST be active and uncommented.
2. From **Observation 2**, activating the tag causes Rollup to emit `firebase-[hash].css` instead of `style-[hash].css`, failing test `T5.M6.9`.
3. From **Observation 3**, the naming of `firebase.css` is not random: it occurs because Rollup and Vite's internal CSS plugin correlate the shared CSS entry set `{ main, carta, admin, experiencia }` with the common JS vendor chunk covering that exact set (`firebase`).
4. `manualChunks` in Rollup cannot rename CSS assets because `manualChunks` only controls JavaScript modules. Renaming the Firebase chunk in `manualChunks` would break test `C5.4` (`tests/tier5-m1-adversarial.test.mjs`), which explicitly checks `dist/assets/firebase-*.js`.
5. Rollup's `output.assetFileNames` function is the authoritative hook for asset destination and naming. It receives `assetInfo` where `assetInfo.name` is `'firebase.css'`.
6. From **Observation 4**, configuring `assetFileNames` to intercept `firebase.css` and map it to `assets/style-[hash][extname]` cleanly resolves the naming conflict:
   - Rollup emits `dist/assets/style-[hash].css`.
   - Vite's HTML plugin automatically updates `<link rel="stylesheet">` tags in `dist/*.html` to `/assets/style-[hash].css`.
   - All tests (360/360) pass with zero errors.

---

## 3. Caveats

- **No Other CSS Assets Impacted:** `experiencia.css` has `assetInfo.name === 'experiencia.css'` and falls through to the default `'assets/[name]-[hash][extname]'` pattern without interference.
- **No JS Chunks Impacted:** Rollup processes JavaScript chunks through `chunkFileNames` and `entryFileNames`, so `assetFileNames` has zero effect on JavaScript bundles.
- **Cascade Precedence:** In `experiencia.html`, `style.css` is placed before `experiencia.css`. This ensures that general tokens and missing component styles are provided by `style.css`, while page-specific hero and layout rules in `experiencia.css` take cascade precedence where desired.

---

## 4. Conclusion

The exact, verified configuration strategy to remediate the Reviewer 2 rejection is:
1. Update `vite.config.ts` to add `build.rollupOptions.output.assetFileNames` mapping `firebase.css` and `style.css` to `assets/style-[hash][extname]`.
2. Uncomment `<link rel="stylesheet" href="/src/style.css">` on line 12 of `experiencia.html`.
3. The full implementation blueprint has been published to `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_1\plan.md`.

---

## 5. Verification Method

To verify the strategy after `m6_worker_2` applies the changes:

1. **Verify `experiencia.html` line 12 is active:**
   ```bash
   git grep -n "href=\"/src/style.css\"" experiencia.html
   ```
   *Expected:* `<link rel="stylesheet" href="/src/style.css">` (no HTML comment `<!-- ... -->`).

2. **Verify `vite.config.ts` contains `assetFileNames`:**
   Inspect lines 13-19 of `vite.config.ts` to confirm `output.assetFileNames` is configured.

3. **Verify build execution and chunk emission:**
   ```bash
   npm run pipeline
   ```
   *Expected:* Exit code 0; `dist/assets/style-[hash].css` and `dist/assets/experiencia-[hash].css` both emitted.

4. **Verify automated test suites:**
   ```bash
   node --test tests/tier5-m6-pipeline-stress.test.mjs
   npm test
   ```
   *Expected:* All 15 tests in `tier5-m6-pipeline-stress.test.mjs` pass; all 360 tests across 91 suites in `npm test` pass.
