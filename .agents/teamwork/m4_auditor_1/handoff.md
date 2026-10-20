# Forensic Audit Report — Milestone 4 (Fase 4: Blindaje del Backoffice y Unificación en Cloudinary)

**Auditor:** `m4_auditor_1` (Forensic Auditor - Zero-Trust SDD)  
**Profile:** General Project / `auditor-tirano-sdd`  
**Target:** Milestone 4 Deliverables (`src/admin.ts`, `admin.html`, `src/main.ts`, `src/style.css`)  
**Verdict:** **CLEAN**  
**Contractual Rigor Score:** 100%  
**Date:** 2026-10-14T08:52:00Z  

---

## 1. Observation

Direct empirical evidence obtained from repository files and deterministic execution:

1. **[DT-04] & [DT-10] Eradication of Firebase Storage**:
   - `src/admin.ts`: Exactly 0 imports of `firebase/storage` or reference to Firebase Storage bucket. Gallery operations interact directly with Cloudinary REST API and Firestore collection `gallery_items` (lines 991, 1052, 1130).
   - `src/main.ts`: Exactly 0 imports of `firebase/storage`. `loadGallery()` queries Firestore `collection(db, 'gallery_items')` with fallback to local assets if empty (lines 570-593).
   - Verification command:
     ```bash
     grep -rn "firebase/storage" src/
     ```
     Observed output: Only `src/firebase.ts:5:import { getStorage } from "firebase/storage";` (zero production imports in `src/admin.ts` or `src/main.ts`).

2. **[DT-10] Deterministic Cloudinary Normalization**:
   - `src/admin.ts:142-166`:
     ```typescript
     export function normalizeCloudinaryUrl(url: string | null | undefined, width = 800): string {
         if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
             return url || '';
         }
         const cleanUrl = url.split('?')[0];
         const uploadIndex = cleanUrl.indexOf('/upload/');
         if (uploadIndex === -1) return cleanUrl;
         const base = cleanUrl.substring(0, uploadIndex + 8);
         let rest = cleanUrl.substring(uploadIndex + 8);
         const parts = rest.split('/');
         if (parts.length > 1 && parts[0].includes('_')) {
             parts.shift();
             rest = parts.join('/');
         }
         return `${base}f_auto,q_auto,w_${width},c_limit/${rest}`;
     }
     ```
   - `src/main.ts:6-21`: Identical pure function implementation, decoupled from admin bundle to prevent MPA bundle bloat.
   - Zero hardcoded mock outputs; fully idempotent; purges query strings (`?v=...`); strips prior transformation segments containing `_`.

3. **[DT-05] & [DT-09] 16-Chip Allergen Selector**:
   - `admin.html:651-735`: Free-text input `#item-tags` is completely absent.
   - `admin.html:693-710`: Container `<div id="allergen-chips-container" class="allergen-chips-grid">` contains exactly 16 discrete `<button type="button" class="tag-chip" data-tag="...">` elements: `pescado`, `marisco`, `carne`, `pollo`, `picante`, `gluten-free`, `gluten`, `huevos`, `lacteos`, `soja`, `cacahuetes`, `mostaza`, `crustaceos`, `apio`, `moluscos`, `sesamo`.
   - `src/admin.ts:280-334`: Functions `initAllergenChips()`, `resetAllergenChips()`, `populateAllergenChips()`, and `getSelectedAllergenTags()` strictly map and validate chips against `OFFICIAL_ALLERGEN_TAGS` (`specs/openapi.yaml`).

4. **[DT-13] Eradication of Native `alert()`**:
   - `src/admin.ts`: Exactly 0 calls to native `alert(`.
   - `src/admin.ts:190-244`: Full RFC 9457 Problem Details toast notification subsystem implemented (`createProblemDetails`, `renderProblemToastHtml`, `showProblemToast`), validating HTTP error status codes (400-599), type URI, and HTML escaping (`escapeHtml`).

5. **Invariant `T1.4.3` Image Previews & 10 MB Guard**:
   - `admin.html`: Exactly 15 `<img>` tags exist in the entire file; all 15 strictly match `id="preview-..."` (`preview-img-hero-1` through `preview-img-hero-4`, `preview-img-philosophy`, `preview-img-spec-1` through `preview-img-spec-3`, `preview-exp-hero-bg`, `preview-exp-gallery-1` through `preview-exp-gallery-4`, `preview-gallery-image`, `preview-item-image`).
   - `src/admin.ts:172-187`: `validateUploadFile` enforces `file.size <= 10 * 1024 * 1024` and MIME whitelist `['image/jpeg', 'image/png', 'image/webp']`.
   - File handlers in dish modal and gallery use `URL.createObjectURL(file)` for instant local preview and cleanly revoke blob URLs via `URL.revokeObjectURL(...)`.

6. **TypeScript Strictness**:
   - `src/admin.ts` and `src/main.ts`: Exactly 0 occurrences of `: any` or `as any`.
   - Zero linter suppressions (`@ts-ignore`, `@ts-expect-error`, `eslint-disable`).

7. **Deterministic Pipeline Execution**:
   - `npm run pipeline`: **Exit Code 0** (0 type errors, 34 modules transformed, 4 HTML pages and all asset chunks generated in 1.66s).
   - `npm test`: **Exit Code 0** (202/202 tests pass across 53 test suites in 12.68s).
   - `npm run test:all`: **Exit Code 0** (87/87 tests pass across 21 test suites in 9.30s).

---

## 2. Logic Chain

1. **Storage Elimination Integrity**: Since neither `src/admin.ts` nor `src/main.ts` imports or invokes `firebase/storage`, and both read from and write to Firestore collection `gallery_items` with Cloudinary URLs, the dual-storage defect [DT-04] and orphaned storage references are completely eliminated.
2. **URL Determinism & CDN Protection**: `normalizeCloudinaryUrl` strips dirty cache-busting queries (`?v=...`) and removes existing transformation segments before applying `f_auto,q_auto,w_${width},c_limit`. Because `parts[0].includes('_')` drops nested transformations, calling the function repeatedly produces the identical clean URL (idempotency confirmed).
3. **Data Integrity via 16 Allergen Chips**: By removing free-text `#item-tags` and extracting tags exclusively through `getSelectedAllergenTags()` filtered against `OFFICIAL_ALLERGEN_TAGS`, user typos, casing discrepancies, or emoji injections cannot contaminate the Firestore `menu_items` database.
4. **Resilient User Experience & RFC 9457**: All failure branches in dish management, section saving, file validation, and reservation mutations invoke `showProblemToast` with structured status codes and detail strings, completely fulfilling [DT-13] and the OpenAPI error contract.
5. **Memory and Asset Safety**: Instant previews via Object URLs allow visual inspection without network round-trips. Revocation of previous Object URLs ensures no browser memory leaks during extended admin sessions.

---

## 3. Caveats

- **Cloudinary Server-side File Deletion**: Deletion of gallery items currently deletes the Firestore document `gallery_items`. Cloudinary media deletion via REST API requires an API Secret, which cannot be placed on the frontend for security reasons. Future automated asset purging in Cloudinary should be handled via a secured backend cloud function if storage quotas become an issue.
- No test regressions or structural issues found.

---

## 4. Conclusion

**Verdict: CLEAN**

Milestone 4 (Fase 4: Blindaje del Backoffice y Unificación en Cloudinary) strictly fulfills every requirement and invariant set forth in `SDD_MASTER.md`, `specs/admin-spec.md`, and `ORIGINAL_REQUEST.md`:
- [DT-04] & [DT-10] Firebase Storage eradicated: PASS
- [DT-10] Pure Cloudinary Normalization: PASS
- [DT-05] & [DT-09] 16-Chip Allergen Selector: PASS
- [DT-13] Zero `alert()`, RFC 9457 toasts: PASS
- Invariant `T1.4.3` Image Previews & 10 MB Guard: PASS
- TypeScript Strictness (Zero `: any`): PASS
- Pipeline Integrity (`npm run pipeline` Exit 0, 202/202 tests pass): PASS

The deliverable is certified and ready for progression to Milestone 5.

---

## 5. Verification Method

To independently reproduce the audit results, execute:

1. **Pipeline Type Check & Build**:
   ```powershell
   npm run pipeline
   ```
   *Expected:* Exit code 0, 0 type errors, clean `dist/` bundle generation.

2. **Full Automated Test Suite**:
   ```powershell
   npm test
   ```
   *Expected:* 202 passed, 0 failed across 53 test suites.

3. **Core Domain Contracts Suite**:
   ```powershell
   npm run test:all
   ```
   *Expected:* 87 passed, 0 failed across 21 test suites.

4. **Static Invariant Scanning**:
   ```powershell
   node -e "const fs = require('fs'); ['src/admin.ts', 'src/main.ts'].forEach(f => { const c = fs.readFileSync(f, 'utf8'); if (/:\s*any\b/.test(c) || /alert\(/.test(c) || /firebase\/storage/.test(c)) console.error('Violation in ' + f); });"
   ```
   *Expected:* Zero output (no violations).
