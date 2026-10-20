# Handoff Report — Milestone 4 (Blindaje del Backoffice y Unificación en Cloudinary)

**Agent:** `m4_worker_1` (M4 Worker - Backoffice Hardening & Cloudinary Unification)  
**Parent:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Date:** 2026-10-14T08:40:00Z  
**Type:** Hard Handoff (Task Complete)  

---

## 1. Observation

1. **Pure `normalizeCloudinaryUrl` in `src/admin.ts`**:
   - `src/admin.ts` previously used unsafe manual string replacement (`data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/')`) and dirty query appending in section saves (`+ '?v=' + Date.now()`).
   - We implemented and exported:
     ```typescript
     export function normalizeCloudinaryUrl(url: string | null | undefined, width = 800): string
     ```
     strictly following the canonical transformation rule (`f_auto,q_auto,w_${width},c_limit`), stripping `?v=...`, discarding nested transformation segments (segments containing `_`), and returning unaltered clean URLs for non-Cloudinary / non-upload endpoints or falsy inputs.

2. **Unification of Gallery in Firestore `gallery_items`**:
   - `src/admin.ts` and `src/main.ts` previously imported `storage` from `./firebase` and `ref, listAll, getDownloadURL, getMetadata, deleteObject` from `firebase/storage` targeting `restaurante-assets`.
   - In `src/admin.ts`: Completely eradicated all `firebase/storage` imports. Gallery items are uploaded via Cloudinary REST API (`https://api.cloudinary.com/v1_1/dhvbqs2ba/image/upload`, preset `sabeaperu_firm`), normalized via `normalizeCloudinaryUrl(secure_url, 800)`, and persisted in Firestore collection `gallery_items` (`image_url`, `secure_url`, `public_id`, `created_at`, `title`, `caption_title`, `description`, `caption_desc`).
   - Gallery listing in admin uses `query(collection(db, 'gallery_items'), orderBy('created_at', 'desc'))`. Deletion uses `deleteDoc(doc(db, 'gallery_items', id))`.
   - In `src/main.ts`: Completely eradicated all `firebase/storage` imports. `loadGallery()` now queries `gallery_items` from Firestore with fallback to local assets if empty, normalizing URLs via `normalizeCloudinaryUrl(rawUrl, 600)`. Eradicated all residual `: any` types.

3. **Interactive 16-Chip Allergen Selector**:
   - In `admin.html`: Replaced `<input type="text" id="item-tags">` with `<div id="allergen-chips-container" class="allergen-chips-grid">` populated with 16 `.tag-chip` buttons matching the exact `OFFICIAL_ALLERGEN_TAGS` catalog.
   - In `src/admin.ts`: Implemented `initAllergenChips()`, `resetAllergenChips()`, `populateAllergenChips()`, and `getSelectedAllergenTags()`. Clicks toggle `.active`. Edit modal populates active tags from `item.tags`. Dish submit extracts active tags as `AllergenTag[]`. Modal close/cancel resets chips.

4. **Live Image Preview & Strict 10 MB Validation**:
   - In `admin.html`: Injected preview containers conforming strictly to static invariant `T1.4.3`:
     * `<div id="dish-preview-container" class="image-preview-wrapper" style="display:none;"><img id="preview-item-image" src="" alt="Previsualización del plato"></div>`
     * `<div id="gallery-preview-container" class="image-preview-wrapper" style="display:none;"><img id="preview-gallery-image" src="" alt="Previsualización de galería"></div>`
   - In `src/admin.ts`: Implemented `validateUploadFile` enforcing <= 10 MB (`10 * 1024 * 1024` bytes) and allowed MIME types (`image/jpeg`, `image/png`, `image/webp`). File inputs invoke `URL.createObjectURL(file)` for zero-latency preview and call `URL.revokeObjectURL(...)` on cleanup to avoid memory leaks.

5. **Reservations Operational Hub & Filter Tabs**:
   - In `admin.html`: Injected `<div id="reservations-tabs" class="reservation-filter-tabs">` with filter buttons (`#tab-pending`, `#tab-today`, `#tab-all`) and updated table headers to 8 columns (`Localizador`, `Fecha`, `Hora`, `Comensales`, `Cliente`, `Teléfono`, `Estado`, `Acciones`).
   - In `src/admin.ts`: Rendered operational buttons per row:
     * `.btn-confirm-res`: updates `status` to `'confirmed'`.
     * `.btn-cancel-res`: prompts confirmation dialog, then updates `status` to `'cancelled'`.
     * `.btn-wa-client`: generates direct `https://wa.me/${cleanPhone}?text=...` link.
   - Replaced all native `alert()` calls with structured RFC 9457 Problem Details toast notifications.

6. **Strict TypeScript Interfaces & Quiet Luxury Styles**:
   - In `src/admin.ts`: Eradicated all 21 `: any` occurrences. Added strongly typed interfaces: `DishItem`, `DishItemInput`, `GalleryItem`, `ReservationAdminItem`, `SiteContentItem`, `ProblemDetails`, `FileValidationResult`.
   - In `src/style.css`: Appended Quiet Luxury CSS rules using official `--lux-*` design tokens for chips, tabs, status badges, action buttons, preview containers, and RFC 9457 toasts without hardcoded unauthorized font families.

---

## 2. Logic Chain

1. **Cloudinary Unification**: By shifting all gallery operations to Firestore collection `gallery_items` and removing `firebase/storage` from both `src/admin.ts` and `src/main.ts`, Cloudinary becomes the single, consolidated multimedia CDN across the entire application, eliminating broken storage references and orphaned uploads ([DT-04], [DT-10]).
2. **Deterministic URL Normalization**: The pure `normalizeCloudinaryUrl` algorithm guarantees that every Cloudinary image receives `f_auto,q_auto,w_${width},c_limit`, while stripping query parameters (`?v=...`) that invalidate CDN edge caching. Checking for `_` in existing URL segments ensures idempotency and prevents directive nesting (`/upload/f_auto.../f_auto...`).
3. **Decoupled Architecture**: Inlining `normalizeCloudinaryUrl` in `src/main.ts` avoids importing the admin dashboard bundle into the customer-facing MPA entrypoint, keeping `dist/assets/main-*.js` lightweight and preserving the required `dist/assets/style-*.css` bundle naming convention expected by Tier 5 adversarial tests.
4. **Interactive Allergen Integrity**: Replacing the free-text input with 16 discrete buttons bound to the `OFFICIAL_ALLERGEN_TAGS` enum guarantees that only validated tags enter the database payload, preventing corruption from unstandardized strings or emojis ([DT-03], [DT-05]).
5. **Memory and Network Safety**: Pre-upload validation blocks oversized files (> 10 MB) and unsupported MIME types before network calls occur. Object URLs are generated for instant local preview and strictly revoked upon upload or modal close.
6. **Mobile Anti-Blocker WhatsApp Operations**: Building the WhatsApp button as a direct user-clicked anchor/button with pre-filled locator information ensures that mobile browsers (Safari iOS, Chrome Mobile) never block the chat window, establishing an operational workflow for the dining room staff.

---

## 3. Caveats

- Deleting a gallery item removes the Firestore document from `gallery_items`. If deletion from Cloudinary via the Admin API is required in the future, it should be proxied through a secure backend cloud function, since client-side deletion from Cloudinary requires an API Secret which must never be exposed in frontend bundles.
- Fallback local images in `src/main.ts` (`/assets/Hero1.webp`, etc.) remain in place if the Firestore `gallery_items` collection is empty or unreachable during offline execution.
- No caveats regarding test suites or build hygiene: all 53 test suites (202 tests) pass, all 21 test suites in `test:all` (87 tests) pass, and `npm run pipeline` builds with Exit Code 0.

---

## 4. Conclusion

Milestone 4 (Fase 4: Blindaje del Backoffice y Unificación en Cloudinary) is 100% complete, fully typed, resilient, and verified against all automated test suites and architectural constraints.

Key Deliverables:
- `src/admin.ts`: Rewritten with zero `: any`, zero `firebase/storage`, pure `normalizeCloudinaryUrl`, 16-chip allergen selector logic, 10 MB & MIME guard, reservations action hub, and RFC 9457 toasts.
- `admin.html`: Updated with compliant preview elements (`#preview-item-image`, `#preview-gallery-image`), 16 allergen chips, reservation filter tabs, and 8-column operations table.
- `src/main.ts`: Decoupled from `firebase/storage`, unified on Firestore `gallery_items`, zero `: any` remaining.
- `src/style.css`: Enriched with Quiet Luxury design tokens for backoffice controls.

---

## 5. Verification Method

To independently verify the implementation, execute the following commands in sequence:

1. **Pipeline & Multi-Page Bundling Check**:
   ```bash
   npm run pipeline
   ```
   *Expected outcome:* Exit code 0, clean `tsc --noEmit` check, Vite emits all 4 pages and `dist/assets/style-*.css`.

2. **Full Test Runner (All Tiers)**:
   ```bash
   npm test
   ```
   *Expected outcome:* 202/202 tests pass across 53 test suites in ~10s.

3. **Domain Contracts & Journeys Check**:
   ```bash
   npm run test:all
   ```
   *Expected outcome:* 87/87 tests pass across 21 test suites in ~7s.

4. **Specific Hygiene & Image Invariant Check**:
   ```bash
   node --test tests/tier1-pipeline-hygiene.test.mjs
   ```
   *Expected outcome:* 20/20 tests pass, including T1.4.3 preview image ID assertion.

5. **Cloudinary & Allergen Domain Invariant Check**:
   ```bash
   node --test tests/tier2-domain-invariants.test.mjs
   ```
   *Expected outcome:* 22/22 tests pass, including T2.1 normalizeCloudinaryUrl contract tests.

6. **Admin Journey Check**:
   ```bash
   node --test tests/tier4-customer-journeys.test.mjs
   ```
   *Expected outcome:* 20/20 tests pass, including Scenario 4.3 (Reservations) and Scenario 4.4 (Admin multimedia).
