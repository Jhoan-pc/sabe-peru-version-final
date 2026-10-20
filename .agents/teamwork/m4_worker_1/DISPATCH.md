## 2026-10-14T08:18:15Z

You are m4_worker_1 (M4 Worker - Backoffice Hardening & Cloudinary Unification).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_worker_1
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Relevant domain skill:
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\especialista-admin-backoffice\SKILL.md
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\luxury-web-design\SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

READ THE IMPLEMENTATION BLUEPRINTS FIRST:
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_1\plan.md (Spec Miner Contracts & Data Schemas)
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_2\plan.md (Codebase & DOM Architecture Blueprint)
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_3\plan.md (Test Matrix & Safety Rules)

WRITE OWNERSHIP:
You have exclusive write ownership of:
- src/admin.ts
- admin.html
- src/main.ts
- src/style.css

TASK:
Implement Milestone 4 (Fase 4: Blindaje del Backoffice y Unificación en Cloudinary):

1. Pure `normalizeCloudinaryUrl` in `src/admin.ts`:
   - Export `export function normalizeCloudinaryUrl(url: string, width = 800): string`.
   - Strip any query strings (`?v=...`), check for `'cloudinary.com'` and `'/upload/'`.
   - Discard previous transformation segment if `parts[0].includes('_')` (`parts.shift()`).
   - Inject `f_auto,q_auto,w_${width},c_limit/`.
   - Return clean URL. Must be completely idempotent and handle invalid/empty/non-Cloudinary inputs gracefully.

2. Unification of Gallery in Firestore `gallery_items`:
   - In `src/admin.ts`: Completely eradicate `firebase/storage` imports (`ref`, `uploadBytes`, `getDownloadURL`, `deleteObject`, `listAll`) and binding `storage` from `./firebase`.
   - In `src/admin.ts`:
     * Upload image to Cloudinary via REST (`https://api.cloudinary.com/v1_1/dhvbqs2ba/image/upload`, preset `sabeaperu_firm`).
     * Normalize returned URL using `normalizeCloudinaryUrl(secure_url, 800)`.
     * Persist record in Firestore collection `gallery_items` storing both canonical fields and aliases (`image_url`, `secure_url`, `public_id`, `created_at`, `title`, `caption_title`, `description`, `caption_desc`).
     * `loadGalleryAdmin`: Query Firestore collection `gallery_items` with `orderBy('created_at', 'desc')`. Render cards with delete button.
     * Deletion: Call `deleteDoc(doc(db, 'gallery_items', id))`. Zero calls to Firebase Storage.
   - In `src/main.ts`:
     * Update `loadGallery()` to query Firestore collection `gallery_items` instead of Firebase Storage, normalizing URLs via `normalizeCloudinaryUrl(d.image_url || d.secure_url, 600)`.
     * Eradicate remaining `: any` types in `src/main.ts` lines 542, 567, 568, 602.
     * Remove `storage` and `firebase/storage` imports in `src/main.ts`.

3. Interactive 16-Chip Allergen Selector:
   - In `admin.html`: Replace `<input type="text" id="item-tags">` with `<div id="allergen-chips-container" class="allergen-chips-grid"></div>`.
   - In `src/admin.ts`:
     * Dynamically initialize the 16 chip buttons matching `OFFICIAL_ALLERGEN_TAGS` (`pescado, marisco, carne, pollo, picante, gluten-free, gluten, huevos, lacteos, soja, cacahuetes, mostaza, crustaceos, apio, moluscos, sesamo`).
     * Button markup: `<button type="button" class="tag-chip" data-tag="{allergen}">{ALLERGEN}</button>`.
     * Click handler toggles class `.active`.
     * On dish edit modal open: clear all chips, and add `.active` to chips whose `data-tag` is in `item.tags`.
     * On dish form submit: extract active chips via `Array.from(container.querySelectorAll('.tag-chip.active')).map(el => el.getAttribute('data-tag'))`.
     * On dish modal close/cancel: remove `.active` from all chips.

4. Live Image Preview & Strict 10 MB Validation:
   - In `admin.html`:
     * Add preview containers with IDs strictly conforming to `T1.4.3` (`id="preview-..."`):
       - `<div id="dish-preview-container" class="image-preview-wrapper" style="display:none;"><img id="preview-item-image" src="" alt="Previsualización del plato"></div>`
       - `<div id="gallery-preview-container" class="image-preview-wrapper" style="display:none;"><img id="preview-gallery-image" src="" alt="Previsualización de galería"></div>`
   - In `src/admin.ts`:
     * In file change handlers (`#dish-image-file` and `#gallery-image-file`):
     * Check `file.size > 10 * 1024 * 1024` -> reject with toast / RFC 9457 Problem Details and reset input.
     * Check MIME type (`image/jpeg`, `image/png`, `image/webp`) -> reject if invalid.
     * Cleanly revoke previous object URL if any (`URL.revokeObjectURL(...)`).
     * Set `previewImg.src = URL.createObjectURL(file)` and display preview container.

5. Reservations Operational Hub & Filter Tabs:
   - In `admin.html`:
     * Add filter tabs above the table:
       `<div id="reservations-tabs" class="reservation-filter-tabs"><button type="button" class="tab-btn active" id="tab-pending" data-filter="pending">Pendientes</button><button type="button" class="tab-btn" id="tab-today" data-filter="today">Hoy</button><button type="button" class="tab-btn" id="tab-all" data-filter="all">Todas</button></div>`
     * Table columns: `Localizador`, `Fecha`, `Hora`, `Comensales`, `Cliente`, `Teléfono`, `Estado`, `Acciones`.
   - In `src/admin.ts`:
     * Filter reservations based on active tab: `pending` (`status === 'pending'`), `today` (date matches current `YYYY-MM-DD`), or `all`.
     * In table rows render operational buttons:
       - `<button type="button" class="btn-confirm-res" data-id="${res.id}">Confirmar</button>` -> updates status to `confirmed`.
       - `<button type="button" class="btn-cancel-res" data-id="${res.id}">Cancelar</button>` -> confirms cancellation -> updates status to `cancelled`.
       - `<a class="btn-wa-client" href="https://wa.me/${cleanPhone}?text=..." target="_blank" rel="noopener">WhatsApp</a>`.
     * Eradicate all native `alert()` calls, replacing with floating toast messages.

6. Strict TypeScript Interfaces & Styles:
   - In `src/admin.ts`: Replace all `: any` occurrences with typed interfaces (`DishItem`, `GalleryItem`, `ReservationAdminItem`, `SiteContentItem`, `ProblemDetails`).
   - In `src/style.css`: Add Quiet Luxury styles for `.tag-chip`, `.tag-chip.active`, `.reservation-filter-tabs`, `.tab-btn`, `.btn-confirm-res`, `.btn-cancel-res`, `.btn-wa-client`, and preview wrappers using `--lux-*` tokens.

7. Verification:
   - Run `npm run pipeline` (`tsc --noEmit && vite build`) -> verify Exit Code 0 and 0 errors.
   - Run `npm test` -> verify all tests pass (202+ tests).
   - Run `npm run test:all` -> verify 87/87 tests pass.
   - Write your complete handoff report to: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_worker_1\handoff.md`.
   - Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
