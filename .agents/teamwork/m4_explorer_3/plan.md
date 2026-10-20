# Milestone 4: Test Alignment, Verification Matrix & Safety Plan
**Panel de Administración, Unificación en Cloudinary y Operaciones de Sala**

- **Agent**: `m4_explorer_3` (M4 Explorer - Test Alignment & Safety Assurance)
- **Working Directory**: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_3`
- **Timestamp**: 2026-10-14T08:16:00Z
- **Status**: COMPLETE & VERIFIED — READY FOR ORCHESTRATOR & WORKER EXECUTION

---

## 1. Executive Summary

Milestone 4 addresses **Fase 4: Blindaje del Backoffice y Unificación en Cloudinary** ([DT-04], [DT-05], [DT-10], [DT-11], [DT-12], [DT-13] in `specs/SDD_MASTER.md` and `specs/admin-spec.md`).

Through this read-only investigation, five major findings were verified:
1. **Existing Test Coverage vs. Production Reality Gap**:
   - The test suite currently passes **202/202 tests** with `npm test`, but tests in `tests/tier4-customer-journeys.test.mjs` (Scenarios 4.3 and 4.4) and `tests/tier2-domain-invariants.test.mjs` test isolated domain contract helpers in `tests/contracts/*.mjs` and mock elements.
   - Production controller `src/admin.ts` (659 lines) and `admin.html` (707 lines) **have NOT yet implemented Milestone 4**:
     - `normalizeCloudinaryUrl` is **not exported or defined** in `src/admin.ts`. Instead, `src/admin.ts` line 20 uses unsafe `.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/')`.
     - `src/admin.ts` lines 2-5 still import and query Google **Firebase Storage** (`ref, getDownloadURL, listAll, deleteObject` on `restaurante-assets`), ignoring Firestore `gallery_items`.
     - `admin.html` line 678 still contains a free-text input `<input type="text" id="item-tags">` instead of the 16-chip interactive selector based on `AllergenTag`.
     - `src/admin.ts` lacks 10 MB file validation, image MIME type validation, and zero-latency preview.
     - `src/admin.ts` and `admin.html` lack reservation operational action buttons (`Confirmar`, `Cancelar`, `WhatsApp`) and filter tabs (`Pendientes`, `Hoy`, `Todas`).
2. **Critical Static Invariant Trap (`T1.4.3`)**:
   - `tests/tier1-pipeline-hygiene.test.mjs` test `T1.4.3` strictly requires:
     `Every img tag in admin.html must be a designated preview element with id="preview-...". Found: <img ${attrs}>` (lines 173–181).
   - Any new image element added to `admin.html` (e.g. for dish creation preview) **MUST** have an `id` attribute starting with `preview-` (e.g. `id="preview-item-image"`). If an `<img>` tag without `id="preview-..."` is introduced, `T1.4.3` will fail immediately!
3. **Storage Extinction Contract**:
   - `specs/admin-spec.md` §1.B dictates that Cloudinary is the **ONLY** storage provider. Firebase Storage must be completely eliminated from the gallery pipeline. All gallery documents belong in Firestore `gallery_items`.
   - `src/admin.ts` must completely purge `import { ref, getDownloadURL, listAll, deleteObject } from 'firebase/storage'`.
4. **Current Pipeline & Test Baseline**:
   - `npm test`: 202 passed, 0 failed, 53 suites in 7.71s.
   - `npm run pipeline`: `tsc --noEmit && vite build` exits with code 0 in 875ms, generating 4 HTML entrypoints.
5. **Challenger Hardening Requirement**:
   - Milestone 4 requires a dedicated `tests/tier5-m4-challenger.test.mjs` suite to enforce AST hygiene, source exports, idempotent Cloudinary normalization, chip extraction, and zero `alert()` calls.

---

## 2. Inventory of Existing Tests Validating Milestone 4

The following existing tests in `tests/` directly establish contracts and expectations for Milestone 4 features:

### 2.1 Tier 1: Pipeline Hygiene (`tests/tier1-pipeline-hygiene.test.mjs`)
| Test ID | Line | Verification Scope | M4 Impact / Safety Rule |
|---------|------|-------------------|--------------------------|
| **T1.1.1** | 20–28 | `tsc --noEmit` exits with 0 | Worker changes in `src/admin.ts` must be strictly typed (zero `tsc` errors). |
| **T1.1.3** | 42–50 | `src/admin.ts` exists and is non-empty | File integrity of `src/admin.ts`. |
| **T1.2.1** | 69–77 | `vite build` exits with 0 | Multi-page bundling must succeed without broken imports. |
| **T1.2.2** | 79–87 | Emits `dist/admin.html` | Generated admin entrypoint must remain intact. |
| **T1.3.2** | 125–129 | Zero active Supabase imports in `src/admin.ts` | No regression introducing Supabase references. |
| **T1.4.3** | 173–181 | All `<img>` tags in `admin.html` have `id="preview-..."` | **CRITICAL INVARIANT**: Any preview image in `admin.html` must match `^preview-`. |

### 2.2 Tier 2: Domain Invariants (`tests/tier2-domain-invariants.test.mjs`)
| Test ID | Line | Verification Scope | M4 Impact / Safety Rule |
|---------|------|-------------------|--------------------------|
| **T2.1.1** | 33–37 | Standard transformation `f_auto,q_auto,w_800,c_limit` | Default transformation must match exactly. |
| **T2.1.2** | 39–47 | Query strings like `?v=123` stripped | Strips cache-busting dirty params. |
| **T2.1.3** | 49–56 | Prevents nested/duplicate transforms; Idempotency | Re-normalizing already normalized URL returns identical string. |
| **T2.1.4** | 58–68 | Custom width support (`w_400`, `w_1200`, `w_1600`) | Width parameter passed down to transform string. |
| **T2.1.5** | 70–78 | Edge cases: null, undefined, empty, non-Cloudinary | Returns input cleanly or empty string without throwing. |
| **T2.1.6** | 80–84 | Adversarial edge cases (complex queries, folder paths) | Handles encoded chars and complex paths cleanly. |
| **T2.2.5** | 112–123 | Cancelled reservations excluded from capacity | Cancel button mutating to `cancelled` frees slot. |
| **T2.4.1** | 190–195 | Exact 16 canonical items in `AllergenTag` enum | Chip selector must render exactly these 16 tags. |
| **T2.4.2** | 197–201 | All 16 official allergen tags validated | Chip values must match enum strings. |
| **T2.4.3** | 203–208 | Strictly rejects unknown/unstandardized tags | Prevents dirty/free-text tags. |
| **T2.4.4** | 210–216 | `validateDishAllergenTags` uniqueness & sanitization | Extracted tags array must be sanitized and deduplicated. |

### 2.3 Tier 3: DOM Transitions & Interactive Chips (`tests/tier3-dom-transitions.test.mjs`)
| Test ID | Line | Verification Scope | M4 Impact / Safety Rule |
|---------|------|-------------------|--------------------------|
| **T3.3.1** | 210–216 | Chip panel renders exactly 16 buttons with `OFFICIAL_ALLERGEN_TAGS` | UI requirement for `#allergen-chips-container`. |
| **T3.3.2** | 218–225 | Inactive chip click adds `active` class | Button click toggles `.tag-chip.active`. |
| **T3.3.3** | 227–235 | Active chip click removes `active` class | Deactivation removes tag from selected set. |
| **T3.3.4** | 237–246 | Form extraction collects active chips into `string[]` | Form submit extracts `tags: string[]`. |
| **T3.3.5** | 248–250 | Edit mode pre-selects existing dish tags accurately | Opening edit modal syncs `.active` classes. |

### 2.4 Tier 4: Real-World Scenarios (`tests/tier4-customer-journeys.test.mjs`)
| Test ID | Line | Verification Scope | M4 Impact / Safety Rule |
|---------|------|-------------------|--------------------------|
| **T4.3.1** | 278–288 | Admin filters table by tabs (`Pendientes`, `Hoy`, `Todas`) | Header tabs filter reservations by date and status. |
| **T4.3.2** | 290–297 | Admin confirms reservation (`btn-confirm-res` -> `confirmed`) | Firestore `updateDoc` sets `status: 'confirmed'`. |
| **T4.3.3** | 299–310 | Admin cancels reservation (`btn-cancel-res` -> `cancelled`) | Confirmation modal + `updateDoc` sets `status: 'cancelled'`. |
| **T4.3.4** | 312–326 | WhatsApp client button (`btn-wa-client`) generates wa.me link | Generates direct chat URL with clean phone & locator. |
| **T4.3.5** | 327–344 | Mutation errors map to RFC 9457 Problem Details toast | Zero native `alert()`; emits floating toast. |
| **T4.4.1** | 365–373 | Rejects files exceeding 10 MB limit | Pre-upload guard with warning toast. |
| **T4.4.2** | 375–380 | Rejects unsupported MIME types (non-JPEG/PNG/WebP) | Pre-upload guard with warning toast. |
| **T4.4.3** | 382–391 | Cloudinary upload result passed through `normalizeCloudinaryUrl` | `secure_url` stored in DB is normalized. |
| **T4.4.4** | 393–398 | Allergen chips panel toggle extracts clean tags array | Validated tag array saved to `menu_items`. |
| **T4.4.5** | 400–405 | Resetting dish form resets tags to empty array | Opening create modal clears active chips. |

---

## 3. Milestone 4 Verification Matrix

| Feature # | PROJECT.md Feature | Primary SSOT Spec | Existing Test IDs | Required Production Implementation | Target File(s) & Lines | Proposed Challenger Checks (Tier 5) |
|---|---|---|---|---|---|---|
| **F16** | Pure `normalizeCloudinaryUrl` Function | `specs/admin-spec.md` §2, `PROJECT.md` Contract #1 | T2.1.1–T2.1.6, T4.4.3 | Export pure function `normalizeCloudinaryUrl(url: string, width = 800): string`. Eradicate raw `.replace('/upload/', ...)` | `src/admin.ts` (lines 10–22) | T5.M4.1–T5.M4.5: Export AST check, idempotency, query stripping, non-Cloudinary passthrough, custom widths |
| **F17** | Unify Gallery in Firestore `gallery_items` | `specs/admin-spec.md` §1.B, §3 | T4.4.3, T1.3.2 | Completely purge `firebase/storage` imports. Query `gallery_items` collection. Save `{ public_id, secure_url, created_at }`. Delete via `deleteDoc`. | `src/admin.ts` (lines 2–5, 529–627) | T5.M4.6–T5.M4.10: Zero storage imports AST check, zero `restaurante-assets`, collection query, deleteDoc call |
| **F18** | Interactive 16-Chip Allergen Selector | `specs/admin-spec.md` §4, `specs/openapi.yaml` | T2.4.1–T2.4.5, T3.3.1–T3.3.5, T4.4.4, T4.4.5 | Eradicate `<input type="text" id="item-tags">`. Create `#allergen-chips-container` with 16 `.tag-chip` buttons. Wire toggle, reset on create, populate on edit. | `admin.html` (line 678), `src/admin.ts` (lines 302–308, 336–340) | T5.M4.11–T5.M4.15: Zero `#item-tags` input, exactly 16 chips rendered, toggle behavior, clean string array extract |
| **F19** | Live Preview & 10 MB / MIME Guard | `specs/admin-spec.md` §3 | T4.4.1, T4.4.2, T1.4.3 | Instant `URL.createObjectURL(file)` preview. File size <= 10 MB check. MIME whitelist (`image/jpeg, image/png, image/webp`). Preview image MUST have `id="preview-item-image"` | `admin.html` (line 682), `src/admin.ts` (lines 255–284) | T5.M4.16–T5.M4.19: 10 MB rejection, invalid MIME rejection, zero-latency preview, preview element ID naming compliance |
| **F20** | Action Buttons in Reservations Table | `specs/admin-spec.md` §5.A, `PROJECT.md` Feature 20 | T4.3.2, T4.3.3, T4.3.4, T4.3.5 | Add `Confirmar` (`.btn-confirm-res`), `Cancelar` (`.btn-cancel-res`), `WhatsApp` (`.btn-wa-client`) to table rows. Implement status mutations and direct wa.me link generation. | `admin.html` (line 620), `src/admin.ts` (lines 629–657) | T5.M4.20–T5.M4.23: Action buttons rendered, confirm status mutation, cancel capacity liberation, WhatsApp URL encoding |
| **F21** | Room Management Filter Tabs | `specs/admin-spec.md` §5.B, `PROJECT.md` Feature 21 | T4.3.1 | Add tabs above reservations table: `Pendientes` (default), `Hoy`, `Todas`. Wire dynamic filtering logic. | `admin.html` (line 618), `src/admin.ts` (lines 629–657) | T5.M4.24–T5.M4.26: Tab container and active classes, default to Pendientes, date filtering for Hoy |

---

## 4. Invariant Assertions & Edge Cases for Tier 5 Challenger Suite

A dedicated Challenger test suite `tests/tier5-m4-challenger.test.mjs` must be implemented to protect against regressions and enforce compliance:

### 4.1 `normalizeCloudinaryUrl` Contract Hardening
1. **Source Export Check**:
   - `src/admin.ts` MUST contain `export function normalizeCloudinaryUrl` matching signature `(url: string, width?: number): string`.
2. **Strict Idempotency**:
   - For any URL `U`: `normalizeCloudinaryUrl(normalizeCloudinaryUrl(U)) === normalizeCloudinaryUrl(U)`.
   - Re-normalizing must NEVER produce `/upload/f_auto.../f_auto...`.
3. **Dirty `?v=` Parameter Eradication**:
   - Input: `https://res.cloudinary.com/dhvbqs2ba/image/upload/v1720000000/ceviche.jpg?v=123`
   - Output: `https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1720000000/ceviche.jpg`
4. **Existing Transformation Overwrite**:
   - Input: `https://res.cloudinary.com/demo/image/upload/c_scale,w_500,q_80/v1234/dish.jpg`
   - Output: `https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/v1234/dish.jpg`
5. **Robust Non-Cloudinary Passthrough**:
   - `null`, `undefined`, `""` return `""` without throwing TypeError.
   - External URLs (`https://images.unsplash.com/...`, `https://example.com/asset.png`) return unaltered.
   - Cloudinary raw/video endpoints without `/upload/` return unaltered.

### 4.2 Firestore `gallery_items` & Firebase Storage Eradication
1. **Zero Storage Imports in `src/admin.ts`**:
   - Regex check: `assert.doesNotMatch(adminTs, /from\s+['"]firebase\/storage['"]/)`.
   - Regex check: `assert.doesNotMatch(adminTs, /restaurante-assets/)`.
2. **Firestore Operations on `gallery_items`**:
   - Querying: uses `collection(db, 'gallery_items')` and `orderBy('created_at', 'desc')`.
   - Addition: uses `addDoc(collection(db, 'gallery_items'), { public_id, secure_url, created_at })`.
   - Deletion: uses `deleteDoc(doc(db, 'gallery_items', id))`.

### 4.3 16-Chip Allergen Selector Invariants
1. **Zero Free-Text Input in `admin.html`**:
   - Invariant: `assert.doesNotMatch(adminHtml, /<input[^>]+id=["']item-tags["']/i)`.
2. **16 Standard Buttons**:
   - `#allergen-chips-container` contains exactly 16 buttons with `class="tag-chip"` and `data-tag` matching `OFFICIAL_ALLERGEN_TAGS`.
3. **Tag Array Extraction**:
   - Active chips extracted into a clean `string[]` array. Empty selection returns `[]`.
4. **Form Lifecycle Synchronization**:
   - Create modal (`openCreateModal`): all chips have `.active` removed.
   - Edit modal (`openEditModal`): only chips matching `item.tags` have `.active` added.
   - Non-array or legacy string tags (e.g. `'pescado, picante'`) are gracefully normalized into arrays without crashing.

### 4.4 Live Preview & Security Budget Invariants
1. **File Size Limit (10 MB)**:
   - Files > `10 * 1024 * 1024` bytes are blocked before network fetch with error toast.
2. **MIME Whitelist**:
   - Only `image/jpeg`, `image/png`, `image/webp` allowed. All other MIME types (e.g. `image/gif`, `application/pdf`, `video/mp4` for dish photos) rejected.
3. **Naming Convention Guard for `T1.4.3`**:
   - Any preview `<img>` element added to `admin.html` MUST have an ID starting with `preview-` (e.g. `<img id="preview-item-image">`).

### 4.5 Reservations Operations & RFC 9457 Invariants
1. **Filter Tabs**:
   - Admin header has `.reservation-filter-tabs` with `Pendientes`, `Hoy`, `Todas`.
   - Default active tab is `Pendientes`.
2. **Row Operational Buttons**:
   - Each reservation row contains `.btn-confirm-res`, `.btn-cancel-res`, `.btn-wa-client`.
3. **Zero Native `alert()` Calls**:
   - Invariant: `assert.doesNotMatch(adminTs, /\balert\s*\(/)`.
   - Errors emit RFC 9457 Problem Details toast with `title` and `detail`.

---

## 5. Build Safety & Baseline Requirements for the Worker

The Worker MUST adhere to these strict verification checkpoints:

```
[Worker Checkpoint 1] -> Implement normalizeCloudinaryUrl in src/admin.ts & export it.
[Worker Checkpoint 2] -> Eradicate firebase/storage imports in src/admin.ts & switch to gallery_items collection.
[Worker Checkpoint 3] -> Replace #item-tags with #allergen-chips-container in admin.html & wire click/extract/populate in src/admin.ts.
[Worker Checkpoint 4] -> Implement 10 MB & MIME checks, live preview with id="preview-item-image", and loading states.
[Worker Checkpoint 5] -> Add filter tabs and action buttons (Confirmar, Cancelar, WhatsApp) to reservations view.
[Worker Checkpoint 6] -> Replace native alert() calls with RFC 9457 Problem Details toasts.
[Worker Checkpoint 7] -> Run `npm run pipeline` (must finish with exit code 0).
[Worker Checkpoint 8] -> Run `npm test` (all 202 existing + new Challenger tests must pass).
```

### Safety Commands:
1. `npm run pipeline`: Validates TypeScript strict compilation and Vite bundling across all 4 HTML entrypoints.
2. `npm test`: Validates full test runner across all tiers.
3. `node --test tests/tier1-pipeline-hygiene.test.mjs`: Fast sanity check on hygiene & preview ID invariant.
4. `node --test tests/tier2-domain-invariants.test.mjs`: Fast check on Cloudinary and Allergen contracts.
5. `node --test tests/tier4-customer-journeys.test.mjs`: Fast check on end-to-end customer and admin journeys.
