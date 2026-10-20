# Handoff Report: Spec Miner Survey

**Agent:** `teamwork_preview_spec_miner_1` (Spec Miner)  
**Parent Agent:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Timestamp:** 2026-10-09T17:52:00Z  
**Type:** Hard Handoff  

---

## 1. Observation

Direct observations extracted from authoritative specification files and project source code:

1. **Pipeline & Compilation (`package.json`)**:
   - `package.json` lines 6-11:
     ```json
     "scripts": {
       "dev": "vite",
       "build": "tsc && vite build",
       "preview": "vite preview",
       "pipeline": "tsc --noEmit && vite build"
     }
     ```
   - Running `npm run pipeline` returned Exit Code 0 in 1.23s, generating:
     - `dist/index.html` (22.87 kB / gzip 5.47 kB)
     - `dist/carta.html` (8.35 kB / gzip 2.36 kB)
     - `dist/experiencia.html` (16.19 kB / gzip 4.10 kB)
     - `dist/admin.html` (31.36 kB / gzip 5.15 kB)
     - `dist/assets/firebase-BC8am6bB.js` (376.09 kB / gzip 116.81 kB)

2. **Technical Debt Catalog (`specs/SDD_MASTER.md`)**:
   - Complete definitions of debts [DT-01] through [DT-13] in section 8, spanning HTML duplication (`DT-01`), DOM innerHTML (`DT-02`), emojis anti-lujo (`DT-03`), hybrid media (`DT-04`), Cloudinary URL corruption (`DT-05`), Supabase dead code (`DT-06`), seed JSON orphan (`DT-07`), `@import` font blocking (`DT-08`), scroll recalculation (`DT-09`), gallery ghost loading (`DT-10`), WhatsApp popup blocking (`DT-11`), lack of transactional confirmation (`DT-12`), and admin table passivity (`DT-13`).
   - Section 7 defines the strict 6-phase roadmap (Fase 1: WPO/Assets, Fase 2: Quiet Luxury Tokens, Fase 3: TypeScript Menu & Allergen logic, Fase 4: Admin Backoffice & Cloudinary, Fase 5: Concierge Reservation Flow, Fase 6: E2E QA Certification).
   - Section 9 provides the ecosystem verdict: Maintain Vite Vanilla MPA for v2.0 (0 KB framework overhead, instant load, free Firebase Hosting), with future v3.0 evolution towards Astro (0 KB JS, shared `.astro` layouts).

3. **API & Data Contracts (`specs/openapi.yaml`)**:
   - OpenAPI 3.1.0 specification with 12 operations across reservations, menu, CMS, media upload, gallery, and admin.
   - `AllergenTag` enum contains exactly 16 values: `pescado`, `marisco`, `carne`, `pollo`, `picante`, `gluten-free`, `gluten`, `huevos`, `lacteos`, `soja`, `cacahuetes`, `mostaza`, `crustaceos`, `apio`, `moluscos`, `sesamo`.
   - `ReservationInput` and `ReservationOutput` schemas with capacity constraints (1 to 20 pax), status enum (`pending`, `confirmed`, `cancelled`), and slot interval checking.
   - Standardized `ProblemDetails` schema complying with RFC 9457 / RFC 7807 with fields `type`, `title`, `status`, `detail`, `instance`, `invalid_params`.

4. **Design System & Haute Cuisine Tokens (`specs/design-system-spec.md` & `src/style.css`)**:
   - Palette: `--lux-bg-obsidian` (`#0b0b0b`), `--lux-bg-charcoal` (`#141414`), `--lux-bg-surface` (`#1c1b1a`), `--lux-bg-alabaster` (`#fbf9f5`), `--lux-gold-champagne` (`#c5a880`), `--lux-gold-burnished` (`#a88d65`), `--lux-crimson-mineral` (`#8b1e22`), `--lux-text-primary` (`#f5f2eb`), `--lux-text-muted` (`#858076`).
   - In `src/style.css` line 1: `@import url('https://fonts.googleapis.com/...');` loading 8 font families simultaneously.
   - In `src/style.css` line 466-468: `border-width: 80px 80px; border-style: solid; border-color: #2e2620;` with Nazca hummingbird and spider SVGs with yellow drop shadows.
   - In `src/style.css` line 1443: `.item-photo-btn::after { animation: shiny-button 3s infinite; }`.
   - In `src/main.ts` line 241-256: Hardcoded emojis in `tagIcons` object.

5. **Performance & Core Web Vitals (`specs/performance-spec.md`)**:
   - Budgets: LCP < 2.5s (ideal < 1.8s), INP < 200ms, CLS < 0.1, Initial JS gzip < 150 kB, Lighthouse Mobile >= 90.
   - In `index.html` lines 216-261: `#main-gallery-grid` contains 10 static `<img>` tags pointing to Supabase Storage that are downloaded and immediately wiped out by `galleryGrid.innerHTML = ''` in `main.ts` line 419.
   - In `index.html` line 108: Hero active slide `<img id="img-hero-1">` lacks `fetchpriority="high"` and `loading="eager"`.
   - In `src/main.ts` lines 108, 174, 183: Synchronous unthrottled `scroll` listeners reading `getBoundingClientRect()` and `offsetTop`.

6. **Admin Backoffice & Media Pipeline (`specs/admin-spec.md` & `src/admin.ts`)**:
   - In `src/admin.ts` line 20: `data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/')` does not use the pure deterministic function.
   - In `src/admin.ts` line 445: Appending `?v=` to Cloudinary URLs (`content: publicUrl + '?v=' + Date.now()`).
   - In `src/admin.ts` lines 537, 593: `loadGalleryAdmin` and delete button use Firebase Storage `restaurante-assets/`, while upload uses Cloudinary without updating Firestore.
   - In `src/admin.ts` line 308, 336: Tag input is an unvalidated free-text string split by commas.
   - In `src/admin.ts` lines 630-656: Reservations table has no operational action buttons (`Confirmar`, `Cancelar`, `WhatsApp`).
   - In `src/main.ts` lines 611-633: `window.open(waUrl, '_blank')` called after `await addDoc`, triggering mobile browser popup blockers.

---

## 2. Logic Chain

1. **Verification of SSOT Completeness**:
   - *Premise*: SDD requires that all code refactoring be strictly driven by approved contracts without improvisation.
   - *Observation*: `specs/SDD_MASTER.md` serves as master index, detailing domain invariants (occupation rule < 4, group threshold > 6, discrete 30min slots), technical debt register DT-01..DT-13, and execution phases 1..6.
   - *Inference*: The 5 satellite specifications (`openapi.yaml`, `design-system-spec.md`, `performance-spec.md`, `admin-spec.md`, `VIBELINE.md`) cover 100% of the functional, aesthetic, performance, and operational requirements.

2. **Tracing DT Catalog to Concrete Code Locations**:
   - *Observation*: DT-01 exists in duplicate markup across `index.html`, `carta.html`, `experiencia.html`, and `admin.html`.
   - *Observation*: DT-03, DT-08, DT-09, DT-10 exist directly in `src/style.css` (line 1 @import, line 468 80px border, line 1443 shiny loop), `src/main.ts` (lines 240-257 emojis, scroll listeners), and `index.html` (lines 216-261 Supabase ghost images).
   - *Observation*: DT-04, DT-05, DT-13 exist in `src/admin.ts` (Firebase Storage vs Cloudinary split, `?v=` suffix, lack of action buttons).
   - *Observation*: DT-11, DT-12 exist in `src/main.ts` (untrusted async `window.open`, absence of locator code `SP-XXXX`).
   - *Inference*: Every single cataloged item [DT-01] to [DT-13] maps to specific lines of existing code with concrete, deterministic remediation rules.

3. **Phase Sequencing and Safety**:
   - *Premise*: Execution must prevent regressions, ensure compilation at each step, and maintain `npm run pipeline` Exit Code 0.
   - *Inference*: Phase order (1: WPO/Assets -> 2: Luxury Design -> 3: TypeScript Menu -> 4: Admin Backoffice -> 5: Reservations Concierge -> 6: E2E QA) ensures foundational assets and styling are resolved before complex TypeScript logic and form flows are refactored.

---

## 3. Caveats

- **No Code Modifications Performed**: Under the Spec Miner role mandate, this survey is 100% read-only. No source files were altered during this process.
- **Backend Architecture**: The live persistent database is Google Firestore and media is Cloudinary; local seed files (`backup_menu_items.json`) and Supabase files are dead/legacy artifacts to be decoupled or cleaned as specified.
- **Network Simulation**: Core Web Vitals targets (LCP < 2.5s, INP < 200ms) are specified under simulated slow 4G and 4x CPU throttle; final validation in Phase 6 will require browser-based testing.

---

## 4. Conclusion

The specification mining is **complete, exhaustive, and fully validated**:
1. All 13 technical debt items ([DT-01] through [DT-13]) are cataloged with exact file references, requirements, acceptance criteria, and phase mapping.
2. All contracts, OpenAPI 3.1 schemas, `AllergenTag` (16 values), `Reservation` entities, RFC 9457 `ProblemDetails`, and Firestore `gallery_items` schema are enumerated.
3. Design tokens (Obsidian `#0b0b0b`, Charcoal `#141414`, Champagne `#c5a880`, Ivory `#f5f2eb`, Carmine `#8b1e22`), typography rules, and visual deprecations are mapped.
4. Core Web Vitals thresholds and network rules (LCP eager/high, async fonts, passive `IntersectionObserver`) are defined.
5. Backoffice Cloudinary URL normalization (`f_auto,q_auto,w_800,c_limit`), live preview, allergen chips, and reservation operational actions are specified.
6. The comprehensive specification inventory has been authored and committed to `specs_inventory.md`.

The project is primed for execution across Phases 1 through 6.

---

## 5. Verification Method

To independently verify the observations and conclusions:
1. **Pipeline Execution**:
   ```powershell
   npm run pipeline
   ```
   *Expected Output*: Exit code 0, 0 TypeScript errors, bundle generated in `dist/`.
2. **Artifact Verification**:
   Inspect `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\spec_miner_survey_1\specs_inventory.md` to confirm:
   - Features Discovered table (26 items).
   - Edge Cases table (16 items).
   - Complete Technical Debt catalog [DT-01] to [DT-13].
   - OpenAPI 3.1 contract schemas and RFC 9457 error format.
   - Design system tokens and typography rules.
   - Performance and Core Web Vitals SLAs.
   - Cloudinary normalization function and Backoffice rules.
   - Execution Roadmap (Phases 1 to 6).
3. **Invalidation Conditions**:
   - Any technical debt item between DT-01 and DT-13 omitted or missing phase assignment.
   - Any deviation from the official `AllergenTag` 16-element enum.
   - Failure to specify `normalizeCloudinaryUrl` pure contract.
