# Handoff Report: Milestone 4 (Backoffice & Admin Architecture)

**Agent:** `m4_explorer_2` (M4 Explorer - Admin Codebase & DOM Architecture)  
**Parent Conversation ID:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Date:** 2026-10-14  
**Type:** Hard Handoff (Investigation & Blueprint Complete)  
**Deliverable Plan:** `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_2\plan.md`

---

## 1. Observation

### A. Firebase Storage Residues and Architectural Split
1. In `src/admin.ts:2`:
   ```typescript
   import { db, auth, storage } from './firebase';
   ```
2. In `src/admin.ts:5`:
   ```typescript
   import { ref, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
   ```
3. In `src/admin.ts:537-549`:
   ```typescript
   const listFolderRef = ref(storage, 'restaurante-assets');
   const res = await listAll(listFolderRef);
   data = res.items;
   ```
4. In `src/admin.ts:562`:
   ```typescript
   const fileUrl = await getDownloadURL(file);
   ```
5. In `src/admin.ts:593`:
   ```typescript
   await deleteObject(ref(storage, 'restaurante-assets/' + fileName));
   ```
6. In `src/main.ts:2,4`:
   ```typescript
   import { db, storage } from './firebase';
   import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
   ```
7. In `src/main.ts:538-591`:
   `loadGallery()` executes `listAll(ref(storage, 'restaurante-assets'))` and ignores any images uploaded to Cloudinary via the backoffice.

### B. Ocurrences of `: any` Type Compromise
1. In `src/admin.ts`:
   - Line 82: `let error: any = null;`
   - Line 146: `let allMenuItems: any[] = [];`
   - Line 151: `let data: any[] = [];`
   - Line 152: `let error: any = null;`
   - Line 191: `function renderMenuTable(items: any[])`
   - Line 276: `catch(uploadError: any)`
   - Line 286: `function openEditModal(id: string | null, item: any)`
   - Line 349: `let error: any = null;`
   - Line 352: `(itemData as any)['created_at'] = new Date().toISOString();`
   - Line 374: `let error: any = null;`
   - Line 387: `let data: any[] = []; let error: any = null;`
   - Line 458: `catch (err: any)`
   - Line 494: `let data: any[] = []; let error: any = null;` and `(item: any)`
   - Line 537: `let data: any[] = []; let error: any = null;`
   - Line 544: `(file: any)`
   - Line 545: `(a: any, b: any)`
   - Line 593: `let error: any = null;`
   - Line 635: `let data: any[] = []; let error: any = null;`
   - Line 644: `(res: any)`
2. In `src/main.ts`:
   - Line 542: `let galleryFiles: any[] = [];`
   - Line 567: `.filter((file: any) => ...)`
   - Line 568: `.sort((a: any, b: any) => ...)`
   - Line 602: `const baseName = (isFallback ? fileRef.name : (((fileRef as any).name || '')))...`

### C. DOM Fragility and Missing Elements in `admin.html`
1. Free-text allergen input in `admin.html:678-680`:
   ```html
   <label>Etiquetas (picante, pescado, marisco, carne, pollo, gluten-free)
       <input type="text" id="item-tags" style="width:100%; padding:8px;" placeholder="Separadas por comas">
   </label>
   ```
2. Missing live preview containers:
   - Neither `#dish-preview-container` nor `#gallery-preview-container` exists in `admin.html`.
   - File uploads in `src/admin.ts:259-284` lack local `URL.createObjectURL(file)` zero-latency rendering and 10 MB limit enforcement.
3. Passive reservations table in `admin.html:616-637`:
   - Lacks tabs header `#reservations-tabs` (`#tab-pending`, `#tab-today`, `#tab-all`).
   - Lacks action buttons per row (`btn-confirm-res`, `btn-cancel-res`, `btn-wa-client`).
   - Lacks `Estado` and `Localizador` table headers.

### D. Current Pipeline and Test Baseline
- `npm test` runs with **Exit Code 0** (202 pass, 0 fail across 53 test suites).
- `npm run pipeline` (`tsc --noEmit && vite build`) executes cleanly in ~1.89 seconds with **Exit Code 0**.

---

## 2. Logic Chain

1. **Storage Disconnection Cause:** Observation A.3-A.5 and A.7 show that while the admin upload handler posts images to Cloudinary, both the admin gallery loader and `main.ts:loadGallery()` query Firebase Storage bucket `'restaurante-assets'`. Because Cloudinary uploads never write to Firebase Storage, files uploaded via the backoffice are orphaned and never rendered in either view.
2. **Unification Solution:** By creating and reading exclusively from the Firestore collection `gallery_items` (with documents storing `secure_url`, `public_id`, `created_at`, `caption_title`, and `caption_desc`), both the admin panel and the customer-facing gallery grid (`src/main.ts`) gain a Single Source of Truth (SSOT).
3. **Pure Normalization:** Observation in `specs/admin-spec.md §2` and `tests/contracts/cloudinary.mjs` proves that deterministic transformation via `normalizeCloudinaryUrl` (applying `f_auto,q_auto,w_{width},c_limit` and stripping dirty `?v=` parameters) eliminates image distortion and URL corruption across successive edits.
4. **Allergen Integrity:** Observation C.1 reveals that comma-separated free-text inputs produce inconsistent casing, whitespace, and typos. Replacing `#item-tags` with a 16-chip button panel bound to `OFFICIAL_ALLERGEN_TAGS` ensures only canonical `AllergenTag` values are committed to Firestore.
5. **Zero-Latency Feedback & Size Safety:** Observation C.2 shows that users receive no visual confirmation when selecting images. Implementing a 10 MB pre-upload validation guard and `URL.createObjectURL(file)` instant preview guarantees immediate user feedback while blocking oversized payloads before network transmission.
6. **Room Operations Enablement:** Observation C.3 confirms the reservations table is purely informational. Adding state tabs (`#tab-pending`, `#tab-today`, `#tab-all`) and action buttons (`Confirmar`, `Cancelar` with confirmation modal, `WhatsApp Directo`) transforms the table into an active operational hub matching `specs/admin-spec.md §5`.
7. **Type Safety & Pipeline SLA:** Replacing the 21 `: any` in `src/admin.ts` and 4 `: any` in `src/main.ts` with explicit interfaces (`DishItem`, `GalleryItem`, `ReservationAdminItem`, `SiteContentItem`) eliminates compiler blind spots without degrading `tsc --noEmit` performance.

---

## 3. Caveats

1. **Page Isolation Guard in `src/admin.ts`:** Because `src/main.ts` imports `normalizeCloudinaryUrl` from `./admin`, `src/admin.ts` must defensively guard its top-level `DOMContentLoaded` listener (`if (!document.getElementById('login-screen') && !document.getElementById('dashboard-screen')) return;`). Otherwise, running `main.ts` on customer-facing pages (`index.html`, `carta.html`) would execute admin authentication checks and attempt to manipulate non-existent admin DOM elements.
2. **Cloudinary Upload Preset:** The upload preset `sabeaperu_firm` is configured for unsigned uploads to cloud `dhvbqs2ba`. If testing offline, mock fallback logic preserves application stability.
3. **Gallery Data Migration:** Existing production environments may have items in Firebase Storage that need one-time seeding into Firestore `gallery_items`. Fallback logic in `loadGallery()` preserves local default assets when `gallery_items` is empty.

---

## 4. Conclusion

The backoffice and admin architecture has been mapped down to exact file lines, DOM nodes, and interface definitions. The implementation blueprint in `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_2\plan.md` provides complete, drop-in replacement specifications:
- Complete eradication of `firebase/storage` across `src/admin.ts` and `src/main.ts`.
- Pure deterministic implementation of `normalizeCloudinaryUrl(url, width)`.
- 16-chip interactive allergen selector and 10 MB pre-upload validation with instant preview.
- Room operations hub with tabs and action handlers for reservations.
- Eradication of all 25 occurrences of `: any` across `admin.ts` and `main.ts`.

---

## 5. Verification Method

1. **Pipeline & Typecheck Command:**
   ```bash
   npm run pipeline
   ```
   *Expected result:* Exit Code 0, clean build with 0 TypeScript diagnostics.

2. **Full Automated Test Suite:**
   ```bash
   npm test
   ```
   *Expected result:* 202/202 tests pass, specifically:
   - `tests/tier2-domain-invariants.test.mjs` (Feature 2.1: `normalizeCloudinaryUrl` invariants).
   - `tests/tier3-dom-transitions.test.mjs` (Feature 3.3: Interactive Allergen Chips).
   - `tests/tier4-customer-journeys.test.mjs` (Scenario 4.3: Admin Reservation State Management & Scenario 4.4: Admin Multimedia Management).

3. **Static Hygiene Inspection:**
   - Confirm zero occurrences of `from 'firebase/storage'` in `src/admin.ts` and `src/main.ts`.
   - Confirm zero occurrences of `: any` in `src/admin.ts` and `src/main.ts:542, 567, 568, 602`.
   - Confirm presence of `#allergen-chips-container`, `#dish-preview-container`, and `#reservations-tabs` in `admin.html`.
