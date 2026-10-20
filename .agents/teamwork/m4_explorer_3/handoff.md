# Handoff Report: Milestone 4 Test Alignment & Safety Exploration

**Agent**: `m4_explorer_3` (M4 Explorer - Test Alignment & Safety Assurance)  
**Date**: 2026-10-14  
**Type**: Hard Handoff (Investigation Complete)  
**Recipient**: `ed44eb6a-a075-4b06-a258-caefe2915195` (Orchestrator / Parent)

---

## 1. Observation

1. **Test Suite Baseline**:
   - Executing `npm test` (`node --test tests/**/*.test.mjs`) ran 53 test suites and **202 tests**, with **202 pass, 0 fail**, total duration 7.71s.
   - Executing `npm run pipeline` (`tsc --noEmit && vite build`) exited with **code 0 in 875ms**, emitting all 4 HTML entrypoints (`dist/index.html`, `dist/carta.html`, `dist/admin.html`, `dist/experiencia.html`) and asset bundles.

2. **Existing Milestone 4 Test Specifications**:
   - `tests/tier4-customer-journeys.test.mjs`:
     - **Scenario 4.3 (Admin Reservation State Management Journey)** lines 271–345: tests tab filtering (`T4.3.1`), status mutation to `confirmed` (`T4.3.2`), cancellation freeing slot capacity (`T4.3.3`), WhatsApp client link generation (`T4.3.4`), and RFC 9457 Problem Details toast generation on mutation error (`T4.3.5`).
     - **Scenario 4.4 (Admin Dish & Multimedia Management Journey)** lines 347–406: tests 10 MB limit rejection (`T4.4.1`), unsupported MIME rejection (`T4.4.2`), `normalizeCloudinaryUrl` usage on upload response (`T4.4.3`), allergen chips toggle extracting clean tags array (`T4.4.4`), and form reset clearing tags (`T4.4.5`).
   - `tests/tier2-domain-invariants.test.mjs`:
     - Feature 2.1 lines 32–85: tests standard `f_auto,q_auto,w_800,c_limit` transformation (`T2.1.1`), query string stripping `?v=` (`T2.1.2`), duplicate/nested transform prevention & idempotency (`T2.1.3`), custom width support (`T2.1.4`), edge cases like null/undefined/non-Cloudinary (`T2.1.5`), and complex query paths (`T2.1.6`).
     - Feature 2.4 lines 189–228: verifies `AllergenTag` enum contains exactly 16 canonical items in `specs/openapi.yaml` (`T2.4.1`), validates all 16 tags (`T2.4.2`), rejects non-standard tags (`T2.4.3`), and tests `validateDishAllergenTags` (`T2.4.4`).
   - `tests/tier3-dom-transitions.test.mjs`:
     - Feature 3.3 lines 180–250: tests 16 chip buttons matching `OFFICIAL_ALLERGEN_TAGS` (`T3.3.1`), click toggle adding `.active` (`T3.3.2`), click toggle removing `.active` (`T3.3.3`), extracting active chips into `string[]` (`T3.3.4`), and edit mode pre-population (`T3.3.5`).
   - `tests/tier1-pipeline-hygiene.test.mjs`:
     - Line 178: `assert.match(attrs, /\bid=["']preview-[^"']+["']/i, 'Every img tag in admin.html must be a designated preview element with id="preview-..."')`.

3. **Current Production Code in `src/admin.ts` and `admin.html` (The Implementation Gap)**:
   - `src/admin.ts`:
     - Lines 2–5: `import { ref, getDownloadURL, listAll, deleteObject } from 'firebase/storage';` (Active dependency on Firebase Storage).
     - Lines 10–21: `uploadToCloudinary` uses raw string replacement `data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/')`. `normalizeCloudinaryUrl` is **not exported or defined**.
     - Lines 302–308 & 336–340: Dish tags read/written to `<input type="text" id="item-tags">` via comma-separated string splitting.
     - Lines 533–604: `loadGalleryAdmin` queries `ref(storage, 'restaurante-assets')` via `listAll` and `getDownloadURL`. Deletion calls `deleteObject(ref(storage, 'restaurante-assets/' + fileName))`.
     - Lines 606–626: Gallery upload calls `uploadToCloudinary(file)` but never creates any document in Firestore `gallery_items`.
     - Lines 630–656: Reservations view is an un-interactive 6-column table without status badges, filter tabs, or action buttons (`btn-confirm-res`, `btn-cancel-res`, `btn-wa-client`).
   - `admin.html`:
     - Line 678: `<input type="text" id="item-tags" style="width:100%; padding:8px;" placeholder="Separadas por comas">` (free-text input present, chips absent).
     - Lines 617–636: Reservations table has no filter tabs and no action button column.
     - Line 682: Dish modal lacks a live preview element.

---

## 2. Logic Chain

1. From Observation 1, the test baseline is currently green (202/202 passing, pipeline builds in 875ms). Any change made in Milestone 4 must preserve this passing state.
2. From Observation 2, existing tests in Tiers 1–4 already define the contractual interface and invariants for Milestone 4 (pure `normalizeCloudinaryUrl`, 16-chip allergen selector, 10 MB limit, Firestore `gallery_items`, and reservation actions).
3. From Observation 3, the existing 202 tests pass only because Tiers 2–4 execute against standalone contract files (`tests/contracts/*.mjs`) and DOM mock objects. Production files `src/admin.ts` and `admin.html` have not yet been modified to implement Milestone 4.
4. Specifically:
   - `src/admin.ts` still relies on Firebase Storage for gallery instead of Firestore `gallery_items`, directly causing the bug where uploaded images are lost.
   - `admin.html` still has a free-text input `#item-tags` instead of the 16-chip selector.
   - `src/admin.ts` does not export `normalizeCloudinaryUrl` and uses fragile `.replace('/upload/', ...)`.
5. Furthermore, from Observation 2 (T1.4.3), `admin.html` enforces a strict invariant that all `<img>` elements must have an `id` attribute matching `/^preview-/`. If the Worker adds an image preview element for dish creation without following this convention, `npm run test:tier1` will fail.
6. Therefore, the implementation plan must guide the Worker to:
   - Export and use `normalizeCloudinaryUrl(url: string, width = 800): string` in `src/admin.ts`.
   - Purge `firebase/storage` imports and migrate gallery operations entirely to Firestore `gallery_items`.
   - Replace `<input id="item-tags">` in `admin.html` with `#allergen-chips-container` rendering 16 buttons with class `tag-chip` and `data-tag="{allergen}"`.
   - Add zero-latency live preview using an element named `id="preview-item-image"` along with 10 MB and MIME checks.
   - Add filter tabs (`Pendientes`, `Hoy`, `Todas`) and action buttons (`btn-confirm-res`, `btn-cancel-res`, `btn-wa-client`) in the reservations view.
   - Replace native `alert()` calls with RFC 9457 Problem Details toasts.
7. To guarantee zero regressions, a dedicated Challenger suite `tests/tier5-m4-challenger.test.mjs` must be established.

---

## 3. Caveats

1. **Public Gallery Interaction (`index.html` & `src/main.ts`)**:
   - `src/main.ts` lines 538–591 currently attempt to load gallery assets from Firebase Storage `restaurante-assets` with fallback to local assets. While Milestone 4 specifically targets `src/admin.ts` and `admin.html`, the Worker or subsequent milestone should ensure `src/main.ts` also consumes `gallery_items` from Firestore so that admin uploads appear in the public gallery.
2. **Firebase Auth Mocking in Unit Tests**:
   - In automated Node tests, live Firebase credentials are not invoked; tests rely on AST checks and mock DOM/event simulations.
3. **Modal for Reservation Cancellation**:
   - `specs/admin-spec.md` line 104 mentions a confirmation modal for reservation cancellation. A Quiet Luxury modal or custom confirmation overlay should be used instead of native `window.confirm()` or `window.alert()`.

---

## 4. Conclusion

The test suite expectations, coverage matrix, and safety boundaries for Milestone 4 are fully mapped and verified:
1. Complete verification matrix established in `plan.md`, aligning Features 16–21 with existing tests (T2.1, T2.4, T3.3, T4.3, T4.4, T1.4) and defining new Tier 5 Challenger requirements.
2. Critical safety invariants cataloged:
   - `T1.4.3` Preview ID naming rule (`id="preview-..."`).
   - Zero `firebase/storage` imports in `src/admin.ts`.
   - Zero native `alert()` calls.
   - Idempotent `normalizeCloudinaryUrl` with query string stripping.
   - Exactly 16 canonical `AllergenTag` chips.
3. The Worker has clear, unambiguous instructions and test criteria to execute Milestone 4 safely and cleanly.

---

## 5. Verification Method

To independently reproduce and verify this investigation:

1. **Run full baseline test suite**:
   ```powershell
   npm test
   ```
   *Expected*: 202 tests pass, 0 fail across 53 test suites.

2. **Run production build pipeline**:
   ```powershell
   npm run pipeline
   ```
   *Expected*: `tsc --noEmit && vite build` exits with code 0 in under 2 seconds.

3. **Inspect M4 test specifications**:
   - `tests/tier4-customer-journeys.test.mjs` (Scenarios 4.3 & 4.4)
   - `tests/tier2-domain-invariants.test.mjs` (Features 2.1 & 2.4)
   - `tests/tier3-dom-transitions.test.mjs` (Feature 3.3)
   - `tests/tier1-pipeline-hygiene.test.mjs` (T1.4.3)

4. **Inspect artifacts created**:
   - `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_3\plan.md`
   - `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_3\handoff.md`
