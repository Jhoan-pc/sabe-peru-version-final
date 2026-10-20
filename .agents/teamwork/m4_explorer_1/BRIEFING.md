# BRIEFING — 2026-10-14T08:16:30Z

## Mission
Discover, mine, and formalize exact specifications, data schemas, DOM structures, and operational contracts for Milestone 4 (Fase 4: Blindaje del Backoffice y Unificación en Cloudinary).

## 🔒 My Identity
- Archetype: Specification Miner
- Roles: M4 Spec Miner - Backoffice & Cloudinary Contracts
- Working directory: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_1
- Original parent: ed44eb6a-a075-4b06-a258-caefe2915195
- Milestone: Milestone 4 (Fase 4: Backoffice y Cloudinary)

## 🔒 Key Constraints
- Pure specification and contracts miner: do NOT implement source code in production directly.
- Strictly adhere to SSOT: `specs/admin-spec.md`, `specs/openapi.yaml`, `specs/SDD_MASTER.md`.
- Eradicate Firebase Storage references in admin panel in favor of Cloudinary + Firestore `gallery_items`.
- 16 Allergen tags must match `AllergenTag` canonical enum from `specs/openapi.yaml`.
- Cloudinary URLs must be normalized deterministically: `f_auto,q_auto,w_${width},c_limit`, query stripping, idempotency.
- File upload constraints: 10 MB strict limit, allowed MIME types `image/jpeg`, `image/png`, `image/webp`, instant preview with `URL.createObjectURL` and cleanup.
- Reservations operations: action buttons (`Confirmar`, `Cancelar`, `WhatsApp Directo`) and fast filter tabs (`Pendientes`, `Hoy`, `Todas`).

## Current Parent
- Conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195
- Updated: 2026-10-14T08:11:44Z

## Task Summary
- **What to build**: Comprehensive contract blueprint and specification handoff for M4 implementation.
- **Success criteria**: Formalized contracts for `normalizeCloudinaryUrl`, Firestore `gallery_items`, 16-Chip Allergen Selector, Live Preview & File Validation, and Reservations Operations & Filter Tabs.
- **Interface contracts**: `PROJECT.md` § Interface Contracts, `specs/admin-spec.md`, `specs/openapi.yaml`.
- **Code layout**: `src/admin.ts`, `admin.html`, `src/main.ts`.

## Loaded Skills
- **Source**: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\especialista-admin-backoffice\SKILL.md`
  - **Local copy**: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_1\skills\especialista-admin-backoffice.md`
  - **Core methodology**: Cloudinary single media store, URL normalization, real-time preview, chip allergen selector, direct reservation ops.
- **Source**: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\arquitecto-sdd\SKILL.md`
  - **Local copy**: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_1\skills\arquitecto-sdd.md`
  - **Core methodology**: Spec-Driven Development, SSOT governance in `specs/`, formal contracts via OpenAPI 3.1.

## Key Decisions Made
- Canonical schema for `gallery_items` documents: `id`, `image_url` (with `secure_url` alias for full OpenAPI / admin-spec compatibility), `public_id`, `created_at`, `title` (alias `caption_title`), `description` (alias `caption_desc`).
- Normalization function `normalizeCloudinaryUrl` exported as a pure function with default `width = 800`, full query parameter strip, single transform segment replacement, and safe fallbacks.
- Allergen chip selector in `admin.html`: Replace free-text input with 16 `.tag-chip` buttons containing `data-tag="<tag>"` inside `#allergen-chips-container` plus hidden `<input type="hidden" id="item-tags">`.
- Live preview lifecycle: `URL.createObjectURL` on file select, memory release via `URL.revokeObjectURL` on upload completion or reset, and immediate rejection of > 10MB or invalid MIME files.
- Reservations operations: 3 action buttons per row (`btn-confirm-res`, `btn-cancel-res`, `btn-wa-client`) and 3 filter tabs (`Pendientes`, `Hoy`, `Todas`) with direct Firestore updates and voluntary WhatsApp URL generation.

## Artifact Index
- `DISPATCH.md` — Record of assignment instructions.
- `skills/` — Local copies of domain expertise skills.
- `plan.md` — Implementation blueprint and contract specification for M4.
- `handoff.md` — 5-component self-contained handoff report for M4 workers and challengers.
- `progress.md` — Liveness heartbeat and milestone tracking.
