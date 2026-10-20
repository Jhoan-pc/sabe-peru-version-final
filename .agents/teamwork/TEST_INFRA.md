# Test Infrastructure & Specification Guide (TEST_INFRA.md)
**Project:** Sabe a Perú — Saneamiento Integral de Deuda Técnica (v2.0.0-SDD)  
**Track:** E2E Testing Track (Requirement-Driven, Opaque-Box Testing)  
**Author:** `e2e_test_writer_1`  
**Test Engine:** Node.js v24 Native Test Runner (`node:test` + `node:assert/strict`)  
**Status:** Certified & Passing (87 / 87 Tests Passing)

---

## 1. Overview and Design Principles

The testing architecture for Sabe a Perú is structured across **4 progressive tiers**, designed to ensure complete opaque-box requirements verification without tight coupling to internal implementation details:

1. **Zero External Dependencies:** Built on the native Node.js v24 test runner (`node:test`) and strict assertion library (`node:assert/strict`), executing in milliseconds without requiring external heavy test runners or daemons.
2. **Progressive Testability & Independence:** Every test file is completely isolated and self-contained, setting up its own fixtures and mocks without cross-test state leakage.
3. **Authoritative Specification Derivation:** Expected outputs and boundary limits are strictly derived from the approved formal specifications in `specs/`:
   - `specs/openapi.yaml` (SSOT API & schema contracts: `AllergenTag`, `ProblemDetails`, `ReservationInput/Output`)
   - `specs/SDD_MASTER.md` (System invariants: occupancy limit < 4, KITCHEN_HOURS, dual pricing)
   - `specs/admin-spec.md` (Pure contract for `normalizeCloudinaryUrl`, 10 MB media validation, interactive chips)
   - `specs/design-system-spec.md` (Quiet Luxury design tokens, 0 emojis in titles, typography rules)
   - `specs/performance-spec.md` (CWV standards, image priority, asynchronous font loading)

---

## 2. Directory Layout

```
tests/
├── contracts/
│   ├── allergens.mjs           # 16 AllergenTag enum definitions & pill markup renderer
│   ├── cloudinary.mjs          # Pure deterministic contract for normalizeCloudinaryUrl
│   ├── errors.mjs              # RFC 9457 Problem Details schema validator & toast builder
│   ├── pricing.mjs             # Dual pricing domain formatting logic (numeric € vs market)
│   └── reservations.mjs        # KITCHEN_HOURS, slot capacity (<4), SP-XXXX locator & WA url builder
├── helpers/
│   ├── mock-dom.mjs            # Lightweight zero-dependency Mock DOM & event simulator
│   ├── openapi-parser.mjs      # OpenAPI 3.1 YAML parser and contract extractor
│   └── sanitize.mjs            # Unicode emoji and pictograph sanitizer helper
├── test-runner.mjs             # Standalone unified test runner with structured reporting
├── tier1-pipeline-hygiene.test.mjs    # Tier 1: Build pipeline & static hygiene (20 tests)
├── tier2-domain-invariants.test.mjs   # Tier 2: Boundary & pure contracts (22 tests)
├── tier3-dom-transitions.test.mjs    # Tier 3: DOM transitions & pairwise coverage (25 tests)
└── tier4-customer-journeys.test.mjs   # Tier 4: End-to-end customer & admin journeys (20 tests)
```

---

## 3. Test Tiers & Coverage Matrix

### Tier 1: Feature Coverage & Pipeline Hygiene (`tests/tier1-pipeline-hygiene.test.mjs`)
- **Feature 1.1: TypeScript Compilation (`tsc --noEmit`) [5 tests]**
  - T1.1.1: `tsc --noEmit` exits with status code 0.
  - T1.1.2: `tsconfig.json` exists, is valid JSONC, and enforces `strict: true` and `noEmit: true`.
  - T1.1.3: Core TypeScript source files in `src/` exist and compile without syntax errors.
  - T1.1.4: Node.js strip-types engine verifies `src/reservations.ts` exports required interfaces.
  - T1.1.5: Typecheck execution finishes in under 20 seconds.
- **Feature 1.2: Production Bundling (`vite build`) [5 tests]**
  - T1.2.1: `vite build` completes successfully with exit code 0.
  - T1.2.2: Multi-page HTML entrypoints emitted in `dist/` (`index.html`, `carta.html`, `admin.html`, `experiencia.html`).
  - T1.2.3: Production assets directory contains generated CSS and JS bundles.
  - T1.2.4: Generated HTML files reference valid asset bundles without 404 links.
  - T1.2.5: Build output files are non-empty and satisfy size limits.
- **Feature 1.3: Zero Active Supabase References in `src/` [5 tests]**
  - T1.3.1: `src/main.ts` contains zero active imports of Supabase.
  - T1.3.2: `src/admin.ts` contains zero active imports of Supabase.
  - T1.3.3: `src/reservations.ts` contains zero references to Supabase.
  - T1.3.4: Production bundle in `dist/assets` does not instantiate active Supabase client.
  - T1.3.5: No production module imports `src/supabase.ts`.
- **Feature 1.4: HTML Image Integrity (No Duplicate or Broken Image Tags) [5 tests]**
  - T1.4.1: `index.html` has zero duplicate `src` attributes across all `img` tags.
  - T1.4.2: Content images in `index.html`, `carta.html`, and `experiencia.html` do not contain broken undefined/null values.
  - T1.4.3: `admin.html` preview placeholders all have explicit preview IDs and handle dynamic hydration.
  - T1.4.4: Local asset images referenced in HTML exist in `public/assets/`.
  - T1.4.5: All static `img` tags in `index.html` and `experiencia.html` include `alt` attributes.

### Tier 2: Boundary & Domain Invariants (`tests/tier2-domain-invariants.test.mjs`)
- **Feature 2.1: `normalizeCloudinaryUrl` Pure Contract [6 tests]**
  - T2.1.1: Standard Cloudinary URL receives `f_auto,q_auto,w_800,c_limit` transformation.
  - T2.1.2: Query strings (e.g. `?v=123`) are stripped clean to prevent cache-busting corruption.
  - T2.1.3: Prevents nested/duplicate transformations if existing transforms are present.
  - T2.1.4: Respects custom width parameter (`w_400`, `w_1200`, `w_1600`).
  - T2.1.5: Edge cases return input unchanged (null, undefined, non-Cloudinary, missing `/upload/`).
  - T2.1.6: Adversarial edge cases (complex queries, multi-segment paths, encoded chars).
- **Feature 2.2: Slot Capacity Limits (Max 4 per 30m Slot) [6 tests]**
  - T2.2.1: Slot with 0 active bookings reports `available: true`.
  - T2.2.2: Boundary: Slot with 3 active bookings reports `available: true`.
  - T2.2.3: Boundary: Slot with exactly 4 active bookings reports `available: false` with reason `"Completo"`.
  - T2.2.4: Slot with more than 4 bookings reports `available: false`.
  - T2.2.5: Cancelled reservations (`status === 'cancelled'`) are strictly excluded from capacity calculations.
  - T2.2.6: Slot generation adheres to `KITCHEN_HOURS` 30m intervals for each day of the week.
- **Feature 2.3: Dual Pricing Formatting [5 tests]**
  - T2.3.1: Positive price formats with two decimal places and € symbol (`24.50€`, `18.00€`).
  - T2.3.2: Price of 0 delegates description as market price indicator (`"Precio según mercado"`).
  - T2.3.3: Price of 0 with custom description delegates custom market text.
  - T2.3.4: Boundary values: `0.00` is market price, `0.01` is numeric price.
  - T2.3.5: Formatting handles numeric strings and invalid inputs with fallback.
- **Feature 2.4: 16 AllergenTag Enum Verification [5 tests]**
  - T2.4.1: `AllergenTag` enum matches the 16 canonical items in `specs/openapi.yaml`.
  - T2.4.2: Validates all 16 official allergen tags.
  - T2.4.3: Strictly rejects unknown or unstandardized allergen tags.
  - T2.4.4: `validateDishAllergenTags` enforces uniqueness and reports invalid tags.
  - T2.4.5: Allergen pill markup outputs uppercase text and semantic class `allergen-pill`.

### Tier 3: Cross-Feature & DOM Transitions (`tests/tier3-dom-transitions.test.mjs`)
- **Feature 3.1: Zero Hardcoded Emojis in Dish Titles & Headers [5 tests]**
  - T3.1.1: `sanitizeDishName` removes all food/animal emojis while preserving Spanish accents (`ñ`, `á`, `é`, `í`, `ó`, `ú`).
  - T3.1.2: Dish card renderer outputs pure serif title with zero emoji icons.
  - T3.1.3: Subcategory titles do not contain emojis.
  - T3.1.4: Dish card markup has no inline emoji tags.
  - T3.1.5: Pairwise test: Dish with 3 allergen tags renders title and clean allergen pills.
- **Feature 3.2: Allergen Pills Styling & DOM Semantics [5 tests]**
  - T3.2.1: Allergen pills are containerized in `.menu-item-allergens` with class `.allergen-pill`.
  - T3.2.2: Allergen pills text is strictly uppercase (Quiet Luxury typography).
  - T3.2.3: `src/style.css` defines Quiet Luxury tokens for `.allergen-pill`.
  - T3.2.4: Dish with zero tags omits `.menu-item-allergens` container cleanly.
  - T3.2.5: Pairwise test: Dual price (`price=0`) dish renders market text alongside allergen pills.
- **Feature 3.3: Interactive Allergen Chips in Admin Backoffice [5 tests]**
  - T3.3.1: Admin chip panel renders exactly 16 chip buttons matching `OFFICIAL_ALLERGEN_TAGS`.
  - T3.3.2: Clicking an inactive chip adds the `active` class to the button.
  - T3.3.3: Clicking an active chip deactivates it and removes it from selected list.
  - T3.3.4: Form extraction gathers multiple active chips into clean tags string array.
  - T3.3.5: Form population in edit mode pre-selects existing dish tags accurately.
- **Feature 3.4: 2-Step WhatsApp Reservation Flow with `SP-XXXX` Locator [5 tests]**
  - T3.4.1: Reservation locator strictly conforms to regex `^SP-[A-Z0-9]{4}$`.
  - T3.4.2: Consecutive locator generations produce unique codes (collision resistance).
  - T3.4.3: Step 1 submission creates pending record and does not invoke asynchronous `window.open`.
  - T3.4.4: Step 2 renders voluntary CTA link with properly encoded WhatsApp message.
  - T3.4.5: Pairwise test: Group > 6 pax triggers Imperial Table notice in confirmation card.
- **Feature 3.5: RFC 9457 Problem Details Toast Generation [5 tests]**
  - T3.5.1: Problem Details object validates mandatory RFC 9457 fields (`type`, `title`, `status`).
  - T3.5.2: `renderProblemToastHtml` generates structured DOM toast with `role="alert"`.
  - T3.5.3: Prohibits native `window.alert` in production controllers (Toast fallback).
  - T3.5.4: Toast lifecycle: fade-out class and DOM cleanup handling.
  - T3.5.5: Pairwise test: Invalid capacity error creates RFC 9457 Problem Details toast.

### Tier 4: Real-World Scenarios (`tests/tier4-customer-journeys.test.mjs`)
- **Scenario 4.1: Customer Menu Journey [5 tests]**
  - T4.1.1: Category filtering (`comida` vs `coctel`) updates visible dish items.
  - T4.1.2: Menu items are sorted strictly by `sort_order` ascending.
  - T4.1.3: Allergen filtering (`tag=marisco`) isolates matching dishes.
  - T4.1.4: Editorial photo trigger opens preview modal and closes on dismiss.
  - T4.1.5: Dual pricing dishes render properly without NaN errors.
- **Scenario 4.2: Customer Reservation Booking Journey [5 tests]**
  - T4.2.1: Available slots calculate based on `KITCHEN_HOURS` and existing bookings.
  - T4.2.2: Standard reservation produces pending record and `SP-XXXX` locator.
  - T4.2.3: Zero asynchronous `window.open` is triggered on submission (Anti-Blocker Protection).
  - T4.2.4: Voluntary click on WhatsApp CTA generates well-formed `wa.me` link with locator.
  - T4.2.5: Large group (> 6 guests up to 20) triggers Imperial Table advisory.
- **Scenario 4.3: Admin Reservation State Management Journey [5 tests]**
  - T4.3.1: Admin filters reservations table by tabs (`Pendientes` vs `Hoy` vs `Todas`).
  - T4.3.2: Admin confirms reservation (`btn-confirm-res`) mutating status to `confirmed`.
  - T4.3.3: Admin cancels reservation (`btn-cancel-res`) freeing up slot capacity.
  - T4.3.4: Admin clicks WhatsApp client button (`btn-wa-client`) generating direct chat URL.
  - T4.3.5: Error during state update maps to RFC 9457 Problem Details toast.
- **Scenario 4.4: Admin Dish & Multimedia Management Journey [5 tests]**
  - T4.4.1: File validation rejects files exceeding 10 MB limit.
  - T4.4.2: File validation rejects unsupported MIME types.
  - T4.4.3: Cloudinary upload result is passed through `normalizeCloudinaryUrl`.
  - T4.4.4: Allergen chips panel toggle extracts clean tags string array.
  - T4.4.5: Resetting the dish form resets tags to empty array.

---

## 4. How to Run the Tests

### Execute All Tiers (Recommended)
```bash
npm run test:all
```
or directly via npm:
```bash
npm test
```

### Execute by Individual Tier
```bash
npm run test:tier1   # Pipeline & Hygiene
npm run test:tier2   # Boundary & Invariants
npm run test:tier3   # DOM Transitions & Pairwise
npm run test:tier4   # Customer & Admin Journeys
```

### Direct Node.js v24 Execution
```bash
node --test tests/**/*.test.mjs
```

---

## 5. Verification Results Summary

- **Total Test Cases Executed:** 87
- **Total Test Suites:** 21
- **Passed:** 87 (100%)
- **Failed:** 0
- **Execution Time:** ~5.7 seconds
- **Production Pipeline (`npm run pipeline`):** Exit Code 0 (`tsc --noEmit && vite build`)
