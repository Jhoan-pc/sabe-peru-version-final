## 2026-10-14T08:11:44Z
You are m4_explorer_1 (M4 Spec Miner - Backoffice & Cloudinary Contracts).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_1
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Relevant domain skill:
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\especialista-admin-backoffice\SKILL.md
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\arquitecto-sdd\SKILL.md

Relevant specs:
- specs/admin-spec.md
- specs/openapi.yaml
- specs/SDD_MASTER.md

TASK:
Mine, analyze, and formalize the exact specifications and contracts for Milestone 4 (Fase 4: Blindaje del Backoffice y Unificación en Cloudinary):
1. Contract for `normalizeCloudinaryUrl(url: string, width = 800): string`:
   - Extraction of Cloudinary URL parts (`/upload/` injection point).
   - Transformation string: `f_auto,q_auto,w_${width},c_limit`.
   - Idempotency rules: stripping dirty query strings (e.g. `?v=...`) and avoiding duplicate transform segments.
   - Fallback behavior for non-Cloudinary or malformed URLs.
2. Contract for Firestore `gallery_items` collection:
   - Document schema (`image_url`, `created_at`, `title`, `description`).
   - Pure Firestore operations (add, list ordered by `created_at desc`, delete by ID).
   - Permanent eradication of Firebase Storage `restaurante-assets/`.
3. Contract for Interactive 16-Chip Allergen Selector in `admin.html`:
   - Strict enumeration matching the 16 `AllergenTag` enums in `specs/openapi.yaml`.
   - Chip HTML structure, data attributes (`data-tag`), active toggling, styling tokens.
   - Form synchronization: pre-selecting chips on dish edit, reading active chips into tags array on submit, resetting on form clear.
4. Contract for Live Image Preview & File Validation:
   - `URL.createObjectURL(file)` behavior, cleanup via `URL.revokeObjectURL`.
   - Strict 10 MB limit (`10 * 1024 * 1024` bytes) and allowed MIME types (`image/jpeg`, `image/png`, `image/webp`).
5. Contract for Reservations Operations & Filter Tabs in Backoffice:
   - Action buttons per row: `Confirmar` (`status: confirmed`), `Cancelar` (`status: cancelled` with confirm dialog/modal), `WhatsApp` (`https://wa.me/...`).
   - Filter tabs: `Pendientes` (default), `Hoy` (filter by current local date), `Todas`.

DELIVERABLES:
Write your implementation blueprint to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_1\plan.md`
And write your handoff report to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_1\handoff.md`
Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
