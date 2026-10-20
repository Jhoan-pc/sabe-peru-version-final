# Handoff Report — Milestone 4 (Fase 4: Blindaje del Backoffice y Unificación en Cloudinary)

**From:** `m4_explorer_1` (M4 Spec Miner)  
**To:** `m4_worker_1`, `m4_challenger_1`, `m4_auditor_1`, Parent Orchestrator (`ed44eb6a-a075-4b06-a258-caefe2915195`)  
**Type:** Hard (Task complete)  
**Date:** 2026-10-14  

---

## 1. Observation

1. **`specs/admin-spec.md`**:
   - Lines 12-20: Documents root architectural conflicts in `src/admin.ts`: gallery uploads went to Cloudinary (`api.cloudinary.com`), but gallery listing and deletion queried Firebase Storage (`restaurante-assets/`), and successive string replacement corrupted URLs (`replace('/upload/', '/upload/f_auto...')`).
   - Lines 42-65: Defines exact canonical contract for `normalizeCloudinaryUrl(url: string, width = 800): string`.
   - Lines 71-79: Specifies strict 10 MB limit, accepted MIME types (`image/jpeg`, `image/png`, `image/webp`), and zero-latency preview via `URL.createObjectURL(file)`.
   - Lines 88-92: Deprecates free-text input and mandates chip selector matching the 16 `AllergenTag` enums.
   - Lines 99-115: Establishes row actions for reservations table: `btn-confirm-res` (`status: confirmed`), `btn-cancel-res` (`status: cancelled` with confirm dialog), and `btn-wa-client` (`https://wa.me/...`), plus filter tabs `Pendientes`, `Hoy`, `Todas`.
2. **`specs/openapi.yaml`**:
   - Lines 423-442: Canonically declares the exact 16 `AllergenTag` enum values:
     `pescado, marisco, carne, pollo, picante, gluten-free, gluten, huevos, lacteos, soja, cacahuetes, mostaza, crustaceos, apio, moluscos, sesamo`.
   - Lines 530-564: Declares `GalleryItem` and `GalleryItemInput` with fields `id`, `public_id`, `secure_url`, `created_at`, `caption_title`, `caption_desc`.
3. **`src/admin.ts`**:
   - Line 5: `import { ref, getDownloadURL, listAll, deleteObject } from 'firebase/storage';` (Active Firebase Storage dependency).
   - Line 20: `return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/');` (Primitive string replace without idempotency or query stripping).
   - Line 445: `content: publicUrl + '?v=' + Date.now()` (Appends dirty cache-busting query parameter).
   - Lines 537-602: `loadGalleryAdmin` queries Firebase Storage bucket `restaurante-assets` via `listAll()`, and deletion calls `deleteObject(ref(storage, 'restaurante-assets/' + fileName))`.
   - Line 619: Uploads to Cloudinary without persisting to Firestore.
   - Lines 630-656: Reservations table renders basic static data with zero action buttons and zero filter tabs.
4. **`admin.html`**:
   - Lines 678-680: Uses free-text `<input type="text" id="item-tags" placeholder="Separadas por comas">`.
   - Lines 616-636: Reservations section contains plain table without filter tabs (`Pendientes`, `Hoy`, `Todas`) or action buttons.
5. **Existing Test Suite (`tests/tier2-domain-invariants.test.mjs`, `tests/tier3-dom-transitions.test.mjs`, `tests/tier4-customer-journeys.test.mjs`)**:
   - Verified that `npm run test:all` executes 87 tests with 87 passing (Exit Code 0).
   - `tests/contracts/cloudinary.mjs` already contains a reference implementation of `normalizeCloudinaryUrl`.
   - `tests/tier3-dom-transitions.test.mjs` (Feature 3.3) and `tests/tier4-customer-journeys.test.mjs` (Scenario 4.3 & 4.4) already assert the exact behavior of allergen chips, reservation actions, and file validation.
6. **Master Pipeline**:
   - `npm run pipeline` runs `tsc --noEmit && vite build` and completes with Exit Code 0 in 904ms.

---

## 2. Logic Chain

1. From Observation 1 and 3, `src/admin.ts` currently suffers from architectural dissonance between Cloudinary (upload) and Firebase Storage (list/delete). In order to eradicate [DT-04] and [DT-10], Firebase Storage must be completely eliminated from `src/admin.ts`, and Firestore collection `gallery_items` must become the sole metadata store.
2. From Observation 1, 2, and 5, `normalizeCloudinaryUrl` must be exported from `src/admin.ts` as a pure function. It must strip query strings, locate `/upload/`, drop prior transformations (`parts[0].includes('_')`), and inject `f_auto,q_auto,w_${width},c_limit/`. This ensures idempotency and cache preservation.
3. From Observation 1, 2, and 4, replacing free-text input with an interactive 16-chip container in `admin.html` guarantees that only valid `AllergenTag` values can be stored in `menu_items`, preventing typing errors and broken filters on the public menu.
4. From Observation 1, 3, and 5, file upload inputs must synchronously enforce the 10 MB ceiling and allowed MIME types (`image/jpeg`, `image/png`, `image/webp`). Immediate preview via `URL.createObjectURL(file)` eliminates UI delay, and calling `URL.revokeObjectURL` releases browser memory.
5. From Observation 1, 3, and 5, transforming the reservations table into an operations hub requires three fast filter tabs (`Pendientes`, `Hoy`, `Todas`) and three action buttons per row (`btn-confirm-res`, `btn-cancel-res`, `btn-wa-client`). Direct user clicks on WhatsApp links protect the flow from popup blockers.

---

## 3. Caveats

1. **Firestore Security Rules**: The admin panel assumes authenticated operations via Firebase Auth. The frontend contract specifies client-side Firestore SDK calls (`updateDoc`, `addDoc`, `deleteDoc`). Firestore rules must allow admin read/write on `gallery_items`.
2. **Backward Compatibility of Gallery Fields**: While `specs/openapi.yaml` defines `secure_url`, `caption_title`, and `caption_desc`, some code references may expect `image_url`, `title`, and `description`. The specification in `plan.md` mandates saving both canonical keys and aliases simultaneously in every `gallery_items` document to guarantee total resilience.
3. **Public Menu Synchronization**: Milestone 4 primarily targets `admin.html` and `src/admin.ts`. However, to fulfill QA Acceptance Criterion 1 (100% gallery consistency), `src/main.ts` should also be aligned to consume `gallery_items` from Firestore rather than Firebase Storage `restaurante-assets`.

---

## 4. Conclusion

The specifications, data contracts, and UI schemas for Milestone 4 are completely mined, formalized, and cross-verified against existing test runners. All 5 core features are fully specified in `plan.md`:
1. `normalizeCloudinaryUrl(url, width = 800)` pure function contract.
2. Firestore `gallery_items` document schema and CRUD operations, completely eliminating Firebase Storage.
3. Interactive 16-Chip Allergen Selector based strictly on `AllergenTag`.
4. File validation (10 MB / JPEG, PNG, WebP) and zero-latency preview lifecycle (`URL.createObjectURL` / `URL.revokeObjectURL`).
5. Reservations operations (3 action buttons + 3 filter tabs) with RFC 9457 Problem Details toast error mapping.

The implementation plan in `plan.md` is ready for direct execution by `m4_worker_1`.

---

## 5. Verification Method

To verify the specifications and their alignment with the codebase:
1. **Inspect Blueprint File**:
   `view_file` on `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_1\plan.md`.
2. **Execute Full Test Suite**:
   Run `npm run test:all`. Must output:
   `RESULT: ALL TEST SUITES PASSED (87 tests passing)`.
3. **Execute CI/CD Pipeline**:
   Run `npm run pipeline`. Must output:
   `✓ built in <2s` with Exit Code 0.
4. **Invalidation Conditions**:
   - Any departure from the 16 `AllergenTag` values.
   - Any residual import of `firebase/storage` in `src/admin.ts`.
   - Failure of `normalizeCloudinaryUrl` to strip query strings or avoid transform nesting.
