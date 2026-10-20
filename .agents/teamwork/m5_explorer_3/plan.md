# Milestone 5: Test Verification Matrix & Safety Assurance Plan
**Conserjería de Reservas, Flujo Anti-Bloqueo de WhatsApp y Blindaje de Aforo RFC 9457**

- **Agent**: `m5_explorer_3` (M5 Explorer - Test Matrix & Safety Assurance)
- **Working Directory**: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_3`
- **Timestamp**: 2026-10-14T09:05:00Z
- **Status**: COMPLETE & VERIFIED — READY FOR ORCHESTRATOR & M5 WORKER/CHALLENGER EXECUTION

---

## 1. Executive Summary

Milestone 5 executes **Fase 5: Conserjería de Reservas y Anti-Bloqueo de WhatsApp** ([DT-11], [DT-12], [DT-13] in `specs/SDD_MASTER.md`, `specs/openapi.yaml`, and `PROJECT.md` Features 22–26).

Through rigorous read-only forensic inspection of the codebase, contracts, and test suites, five primary findings were established:

1. **Current Pipeline & Test Baseline**:
   - Master pipeline `npm run pipeline` (`tsc --noEmit && vite build`) executes cleanly with **Exit Code 0 in 2.10s**, bundling all 4 HTML entrypoints (`index.html`, `carta.html`, `admin.html`, `experiencia.html`).
   - Automated test suite passes **259/259 tests across 68 suites with 0 failures** (`npm test` / `node --test tests/**/*.test.mjs`).
   - Tier 1–4 runner passes **87/87 tests across 21 suites in 8.75s** (`npm run test:all`).

2. **Severe Production Deficiencies in Customer Reservation Controllers**:
   - **Critical Vulnerability [DT-11] Active in Production**:
     In `src/main.ts` (lines 809–810) and `src/experiencia.ts` (lines 191–193), `window.open(waUrl, '_blank')` is executed **asynchronously inside the form submit handler** after `await addDoc(...)`. This triggers standard popup blocker defenses in mobile browsers (iOS Safari, Android Chrome).
   - **Missing Locator Generation [DT-12]**:
     Neither `src/main.ts` nor `src/experiencia.ts` generates a booking locator. The Firestore document is saved without `locator`, and the WhatsApp message contains no reference code.
   - **Missing Pre-Submit Concurrency Re-Check**:
     While `src/reservations.ts` fetches available slots initially, there is **zero capacity validation during submission**. If a slot becomes saturated (>= 4 active bookings) between page load and form submission, the system writes an overbooking into Firestore.
   - **Missing Imperial Table Validation & Advisory**:
     Neither controller checks if `people > 6`. Valid inputs between 7 and 20 are accepted without Maître advisory, and invalid counts (< 1 or > 20) are not validated before network dispatch.
   - **Missing RFC 9457 Toast Engine in Customer Pages**:
     Customer pages (`index.html`, `experiencia.html`) lack `#toast-container` and CSS rules for `.toast.error.rfc-9457`. Errors simply write raw text to `#form-message` or fail silently.

3. **Locator Format Conformance SSOT**:
   - Locator format is strictly governed by `^SP-[A-Z0-9]{4}$` using Crockford-inspired 32 unambiguous alphanumeric characters (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, excluding confusing glyphs `0`, `O`, `1`, `I`).
   - Must be collision-resistant and exported as a pure function `generateReservationLocator()`.

4. **Capacity & Slot Saturation Rejection SSOT**:
   - Limit: Maximum 4 active reservations (`status !== 'cancelled'`) per 30-minute interval within `KITCHEN_HOURS`.
   - Rejection: If slot is full upon submission, the controller MUST reject creation and display an RFC 9457 Problem Details toast with **HTTP Status 409 (Conflict)** (or 422 if domain constraint), title `"Franja horaria completa"`, and detail `"El aforo máximo de 4 mesas concurrentes ha sido alcanzado."`.

5. **Static Integrity & Safety Invariants**:
   - `src/reservations.ts`, `src/main.ts`, and `src/experiencia.ts` must contain **exactly 0 occurrences of `alert(`**.
   - The booking flow must contain **exactly 0 occurrences of asynchronous `window.open`**.

---

## 2. Inventory of Existing Tests Validating Milestone 5

The repository already includes contract specifications and unit/journey tests for reservation logic:

### 2.1 Domain Contract (`tests/contracts/reservations.mjs`)
- `KITCHEN_HOURS`: Object mapping days 0–6 to operational intervals (Sundays 12:00–21:30, Mon–Fri 12:00–23:30, Sat 12:00–22:30).
- `MAX_ACTIVE_RESERVATIONS_PER_SLOT = 4`: Enforces 4-table capacity cap.
- `MAX_STANDARD_GROUP_SIZE = 6`: Groups 1–6 are standard; groups 7–20 trigger Imperial table advisory.
- `MAX_TOTAL_GUEST_CAPACITY = 20`: Hard upper bound on reservation guest count.
- `LOCATOR_REGEX = /^SP-[A-Z0-9]{4}$/`: Formal locator format regex.
- `generateDaySlots(dayOfWeek)`: Pure 30-minute generator.
- `checkSlotAvailability(activeCount)`: Evaluates availability (`< 4`) and reason (`'Completo'`).
- `validateGuestCount(people)`: Pure validator returning `{ valid, isImperial, notice, error }`.
- `generateReservationLocator(rng)`: Collision-resistant locator generator.
- `buildWhatsAppReservationUrl(data)`: Generates voluntary `https://wa.me/` direct chat URL.

### 2.2 Error Contract (`tests/contracts/errors.mjs`)
- `createProblemDetails({ type, title, status, detail, instance })`: Strict RFC 9457 schema builder.
- `renderProblemToastHtml(problem)`: Produces Quiet Luxury markup `<div class="toast error rfc-9457" role="alert" data-status="...">`.

### 2.3 Tier 1: Pipeline Hygiene (`tests/tier1-pipeline-hygiene.test.mjs`)
| Test ID | Scope | Verification Assertion |
|---|---|---|
| **T1.1.1** | TypeScript | `npx tsc --noEmit` exits with 0 |
| **T1.1.4** | Syntax & Exports | `src/reservations.ts` exports `ReservationSlot` and `getAvailableSlots` |
| **T1.2.1** | Bundling | `npx vite build` exits with 0 |
| **T1.3.3** | Clean Architecture | `src/reservations.ts` contains zero references to Supabase |

### 2.4 Tier 2: Domain Invariants (`tests/tier2-domain-invariants.test.mjs`)
| Test ID | Scope | Verification Assertion |
|---|---|---|
| **T2.2.1** | Slot Capacity | Active count 0 -> `available: true`, `reason: undefined` |
| **T2.2.2** | Boundary Capacity | Active count 3 -> `available: true`, `reason: undefined` |
| **T2.2.3** | Boundary Capacity | Active count 4 -> `available: false`, `reason: 'Completo'` |
| **T2.2.4** | Capacity Overflow | Active count 5 -> `available: false`, `reason: 'Completo'` |
| **T2.2.5** | Cancellation Isolation | Cancelled bookings (`status === 'cancelled'`) are strictly excluded from count |
| **T2.2.6** | Kitchen Hours | 30m intervals match Sunday (12:00–21:30), Mon (12:00–23:30), Sat (12:00–22:30) |

### 2.5 Tier 3: DOM Transitions & Flow Simulation (`tests/tier3-dom-transitions.test.mjs`)
| Test ID | Scope | Verification Assertion |
|---|---|---|
| **T3.4.1** | Locator Conformance | 50 consecutive locators strictly match `^SP-[A-Z0-9]{4}$` |
| **T3.4.2** | Collision Resistance | 100 consecutive generations produce 100 unique codes |
| **T3.4.3** | Anti-Blocker Step 1 | Form submit creates `pending` record with locator; 0 async `window.open` |
| **T3.4.4** | Anti-Blocker Step 2 | Renders voluntary `#btn-whatsapp-confirm` link with encoded URL & locator |
| **T3.4.5** | Imperial Table Pairwise | Group > 6 pax renders `.imperial-notice` in `#reservation-confirmation-card` |
| **T3.5.1** | RFC 9457 Schema | Mandatory fields: `type`, `title`, `status` validated |
| **T3.5.2** | Toast DOM Structure | Toast element contains `role="alert"`, `data-status="400"`, `.toast-title`, `.toast-detail` |
| **T3.5.3** | Zero Alert Invariant | Native `window.alert()` is forbidden in favor of toast notification |
| **T3.5.4** | Toast Lifecycle | Fade-out animation class applied before DOM cleanup |
| **T3.5.5** | Capacity Error Toast | Saturated slot produces RFC 9457 Problem Details toast with error status |

### 2.6 Tier 4: Real-World Scenarios (`tests/tier4-customer-journeys.test.mjs`)
| Test ID | Scope | Verification Assertion |
|---|---|---|
| **T4.2.1** | Slot Query | Slot 14:00 with 4 bookings reports `available: false`, `reason: 'Completo'` |
| **T4.2.2** | Booking Creation | 4-guest booking produces `status: 'pending'` and `SP-XXXX` locator |
| **T4.2.3** | Anti-Blocker Protection | Zero `window.open` invoked during submission handling |
| **T4.2.4** | Voluntary WhatsApp CTA | Voluntary user click targets `https://wa.me/34662125650?text=...` with locator |
| **T4.2.5** | Imperial Group Boundaries | 8 guests -> `isImperial: true` with notice; 25 guests -> `valid: false` |

### 2.7 Tier 5: Static Integrity in Existing Challenger Suite (`tests/tier5-m4-challenger.test.mjs`)
| Test ID | Scope | Verification Assertion |
|---|---|---|
| **M4.7.3** | Storage Purge | `src/reservations.ts` contains 0 occurrences of `firebase/storage` imports |
| **M4.7.6** | Zero Native Alert | `src/reservations.ts` contains exactly 0 active `alert(` calls |

---

## 3. Milestone 5 Verification Matrix

| # | Feature | Formal SSOT | Primary Invariant / Requirement | Existing Verification Tests | Production Gap in `src/` | Required Implementation in Milestone 5 | Proposed Challenger Tests (Tier 5) |
|---|---|---|---|---|---|---|---|
| **F22** | **Flujo Anti-Bloqueo de WhatsApp en Reservas** | `specs/SDD_MASTER.md` [DT-11], `PROJECT.md` Feature 22 | Prohibit asynchronous `window.open` after submit. Implement 2-step flow: save to DB + render `#reservation-confirmation-card` with voluntary WhatsApp link `#btn-whatsapp-confirm`. | T3.4.3, T3.4.4, T4.2.3, T4.2.4 | `src/main.ts:810` and `src/experiencia.ts:192` call `window.open(waUrl, '_blank')` directly after `await addDoc()`. | Remove `window.open`. Replace `#form-message` with `#reservation-confirmation-card` containing locator, details, and voluntary CTA button. | **T5.M5.1**: AST check: 0 occurrences of `window.open` in booking flow.<br>**T5.M5.2**: Submit event returns confirmation card without opening popups.<br>**T5.M5.3**: Voluntary click on CTA opens WhatsApp chat. |
| **F23** | **Generación de Localizador Único `SP-XXXX`** | `specs/SDD_MASTER.md` [DT-12], `PROJECT.md` Feature 23 | Conforms strictly to `^SP-[A-Z0-9]{4}$`. Collision-resistant Base32. Saved in Firestore record and included in WhatsApp message. | T3.4.1, T3.4.2, T4.2.2 | No locator generated or stored in `src/main.ts` or `src/experiencia.ts`. `src/reservations.ts` lacks pure export. | Implement and export `generateReservationLocator` in `src/reservations.ts`. Store `locator` in Firestore record. Inject into confirmation card and WhatsApp text. | **T5.M5.4**: Regex validation over 1,000 generated locators.<br>**T5.M5.5**: Zero collisions in 1,000 locators.<br>**T5.M5.6**: Disallow ambiguous chars (`0, O, 1, I`).<br>**T5.M5.7**: Locator presence in Firestore write payload. |
| **F24** | **Validación de Aforo Ordinario (< 4 Mesas) y Rechazo 409** | `specs/SDD_MASTER.md` §3.2 (1), `specs/openapi.yaml`, `PROJECT.md` Feature 24 | Max 4 active bookings per 30m slot in `KITCHEN_HOURS`. If full upon submit -> reject with RFC 9457 Problem Details toast with status 409 (Conflict). | T2.2.1–T2.2.5, T4.2.1 | Pre-submit capacity validation missing in form handlers. Race conditions allow overbooking. No RFC 9457 toast emitted. | Re-query slot active count in `src/reservations.ts` before creating booking. If `>= 4`, emit RFC 9457 toast (Status 409: `"Franja horaria completa"`). | **T5.M5.8**: Slot with 4 bookings rejects 5th booking with HTTP 409.<br>**T5.M5.9**: Problem Details toast has `role="alert"`, `data-status="409"`.<br>**T5.M5.10**: Cancelled reservations do not block availability. |
| **F25** | **Validación de Grupos Especiales (> 6 Comensales)** | `specs/SDD_MASTER.md` §3.2 (2), `PROJECT.md` Feature 25 | Guests 1–6: standard. Guests 7–20: trigger Imperial Table advisory banner and WhatsApp message notice. Guests < 1 or > 20: strictly rejected. | T3.4.5, T4.2.5 | No guest count boundary checks in JS controllers. No imperial table advisory rendered in UI. | Implement and export `validateGuestCount(people)`. Enforce bounds 1..20. For 7..20, show `.imperial-notice` in confirmation card and include Maître note in WhatsApp URL. | **T5.M5.11**: Boundaries: 1, 6, 7, 20 guest states.<br>**T5.M5.12**: Rejection of 0, -1, 21, 50, NaN, floats.<br>**T5.M5.13**: `.imperial-notice` DOM element present when people > 6.<br>**T5.M5.14**: WhatsApp URL contains "mesa imperial" when people > 6. |
| **F26** | **Manejo Formal de Errores RFC 9457 (Toasts)** | `specs/SDD_MASTER.md` §3.2 (6), `specs/openapi.yaml`, `PROJECT.md` Feature 26 | 0 occurrences of `alert(` in `src/reservations.ts`, `src/main.ts`, `src/experiencia.ts`. Floating toasts with Quiet Luxury styling. | T3.5.1–T3.5.5, M4.7.4–M4.7.6 | Customer pages lack `#toast-container` and CSS rules. Error feedback uses raw `#form-message`. | Export toast engine from `src/reservations.ts` or shared module. Ensure `#toast-container` exists in `index.html` & `experiencia.html`. Add toast CSS to `src/style.css`. | **T5.M5.15**: AST check: 0 active `alert(` in `src/reservations.ts`, `src/main.ts`, `src/experiencia.ts`.<br>**T5.M5.16**: Toast container present in all HTML entrypoints.<br>**T5.M5.17**: XSS sanitization in toast title and detail payloads. |
| **PIPE** | **Pipeline & Test Baseline Integrity** | `ORIGINAL_REQUEST.md` Acceptance Criteria | `npm run pipeline` Exit Code 0 in < 20s. 100% of baseline 259/259 tests passing without regressions. | Tier 1, 2, 3, 4, 5 test suites | None (currently green). | Worker must maintain zero compilation errors, zero type errors, and zero test failures across all 259+ tests. | **T5.M5.18**: Typecheck passes with zero errors.<br>**T5.M5.19**: Bundle generates clean dist without dead code.<br>**T5.M5.20**: All 259 baseline tests + new M5 tests pass. |

---

## 4. Architectural Safety Invariants & Traps

The M5 Worker and Challengers must strictly respect the following design rules:

### 4.1 Trap 1: Asynchronous `window.open` (The DT-11 Popup Blocker Trap)
- **Problem**: Modern mobile browsers (iOS Safari, Android Chrome) block `window.open` if it is invoked outside a synchronous, user-initiated execution frame. In an async submit handler (`async (e) => { await dbCall(); window.open(...) }`), the user gesture token expires during the `await`, causing browser popup blockers to silently drop the window.
- **Solution**: The submission handler must NEVER call `window.open`. Instead, it renders an inline confirmation card (`#reservation-confirmation-card`) featuring a prominent anchor tag `<a id="btn-whatsapp-confirm" href="${waUrl}" target="_blank">Confirmar por WhatsApp →</a>`. When the customer taps this button, the action is 100% synchronous and guaranteed to open WhatsApp without interference.

### 4.2 Trap 2: Concurrency & Slot Saturation (Status 409 vs 422)
- **Problem**: Selecting a slot in the dropdown does not lock the slot in Firestore. Another user might complete a booking for the 4th table in the interim.
- **Solution**: At the moment of form submission, the controller must perform an atomic or re-validated query to count active reservations for that `(date, time)`.
  If `count >= 4`:
  - Do NOT call `addDoc`.
  - Trigger RFC 9457 Problem Details toast with status **409 Conflict** (Title: `"Franja horaria completa"`, Detail: `"La franja seleccionada ya ha alcanzado el cupo máximo de 4 mesas."`).
  - Refresh the slot selector options to mark the slot as `(Lleno)`.

### 4.3 Trap 3: Zero `alert(` Static Invariant
- **Rule**: Native `window.alert()` is strictly forbidden in all production code.
- **Enforcement**: Static regex check stripping comments and testing `/\balert\s*\(/`. Any violation will fail `tests/tier5-m4-challenger.test.mjs` test `M4.7.6` and `M4.7.5` immediately.

### 4.4 Trap 4: Dual Customer Entrypoints (`index.html` and `experiencia.html`)
- **Risk**: `index.html` and `experiencia.html` both implement `#reservation-form` and handle submissions. Fixing only `src/main.ts` while leaving `src/experiencia.ts` with legacy `window.open` will leave a critical bug in the hotel invitation flow.
- **Solution**: `src/reservations.ts` should encapsulate the core booking submission handler or export modular helpers (`submitReservation`, `renderConfirmationCard`, `showProblemToast`) that both `src/main.ts` and `src/experiencia.ts` consume consistently.

### 4.5 Trap 5: DOM Invariant for Admin Previews (`T1.4.3`)
- While working on styles or shared markup, do NOT add generic `<img>` tags to `admin.html` without `id="preview-..."`. Milestone 4's invariant `T1.4.3` strictly monitors all `<img>` tags in `admin.html`.

---

## 5. Proposed Tier 5 Challenger Suite: `tests/tier5-m5-challenger.test.mjs`

To guarantee adversarial hardening for Milestone 5, the following test scenarios must be implemented in a dedicated Challenger suite:

```
tests/tier5-m5-challenger.test.mjs
├── Scenario M5.1: Anti-Blocker 2-Step Flow & Zero window.open AST Verification
│   ├── M5.1.1: Static AST: Exactly 0 occurrences of window.open in src/reservations.ts
│   ├── M5.1.2: Static AST: Exactly 0 occurrences of window.open in src/main.ts reservation handler
│   ├── M5.1.3: Static AST: Exactly 0 occurrences of window.open in src/experiencia.ts reservation handler
│   ├── M5.1.4: Form submission renders #reservation-confirmation-card without popup triggers
│   └── M5.1.5: Voluntary CTA anchor contains href conforming to wa.me specification
│
├── Scenario M5.2: Collision-Resistant Locator Generation & Alphabet Security
│   ├── M5.2.1: 1,000 consecutive generated locators strictly match ^SP-[A-Z0-9]{4}$
│   ├── M5.2.2: 1,000 consecutive locators have exactly 0 collisions (100% uniqueness)
│   ├── M5.2.3: Locator generator strictly excludes ambiguous glyphs: 0, O, 1, I
│   └── M5.2.4: Firestore reservation payload contains mandatory locator field
│
├── Scenario M5.3: Slot Capacity Saturated Rejection (RFC 9457 Status 409)
│   ├── M5.3.1: Slot with exactly 4 active bookings rejects 5th booking with HTTP 409
│   ├── M5.3.2: Problem Details payload contains title, status=409, and detail
│   ├── M5.3.3: Rendered toast HTML contains role="alert" and data-status="409"
│   └── M5.3.4: Cancelled reservation frees capacity, allowing subsequent booking
│
├── Scenario M5.4: Guest Count Boundaries & Imperial Table Advisory (> 6 Pax)
│   ├── M5.4.1: Standard party (1 to 6 guests) renders clean card without imperial warning
│   ├── M5.4.2: Imperial party (7 to 20 guests) triggers .imperial-notice in confirmation card
│   ├── M5.4.3: Imperial party WhatsApp message explicitly requests Maître imperial table confirmation
│   ├── M5.4.4: Boundary rejection: 0 guests, -5 guests, 21 guests, 100 guests strictly rejected
│   └── M5.4.5: Adversarial inputs: NaN, Infinity, strings, floats (3.5) safely rejected
│
├── Scenario M5.5: RFC 9457 Toast Engine & Zero Native alert() Invariant
│   ├── M5.5.1: Static AST: Exactly 0 active alert( calls in src/reservations.ts
│   ├── M5.5.2: Static AST: Exactly 0 active alert( calls in src/main.ts
│   ├── M5.5.3: Static AST: Exactly 0 active alert( calls in src/experiencia.ts
│   ├── M5.5.4: #toast-container element exists in index.html, admin.html, and experiencia.html
│   └── M5.5.5: XSS neutralization in toast title, detail, customer_name, and occasion
│
└── Scenario M5.6: WhatsApp Link URL Encoding & Escaping
    ├── M5.6.1: Customer name with accents and quotes (e.g. D'Angelo Peña) properly encoded
    ├── M5.6.2: Occasion with multiline text and special characters properly encoded
    └── M5.6.3: Phone number strictly sanitized to digits-only
```

---

## 6. Execution Roadmap & Safety Checklist for M5 Worker

When the orchestrator dispatches the M5 Worker, execution should follow this staged sequence:

1. **Step 1: Domain Logic & Pure Function Exports (`src/reservations.ts`)**:
   - Implement and export `generateReservationLocator(): string`.
   - Implement and export `validateGuestCount(people: number): { valid: boolean, isImperial: boolean, notice?: string, error?: string }`.
   - Implement and export `checkSlotAvailability(activeCount: number): { available: boolean, reason?: string }`.
   - Implement and export `buildWhatsAppReservationUrl(params): string`.
   - Export RFC 9457 toast utilities `showProblemToast` and `renderProblemToastHtml` for consumer controllers.

2. **Step 2: Customer UI Markup & Design Tokens (`index.html`, `experiencia.html`, `src/style.css`)**:
   - Add `<div id="toast-container"></div>` to `index.html` and `experiencia.html`.
   - Add Quiet Luxury toast styles and confirmation card styles to `src/style.css` (`#toast-container`, `.toast.error.rfc-9457`, `#reservation-confirmation-card`, `.locator-code`, `.imperial-notice`, `#btn-whatsapp-confirm`).

3. **Step 3: Controller Refactoring (`src/main.ts` & `src/experiencia.ts`)**:
   - Eradicate `window.open` in both files.
   - Add pre-submission capacity verification against Firestore.
   - If full: emit status 409 Problem Details toast.
   - If invalid guests (< 1 or > 20): emit validation error toast.
   - If valid: generate `SP-XXXX` locator, save to Firestore, and replace `#reservation-form` content with `#reservation-confirmation-card` containing voluntary WhatsApp CTA.

4. **Step 4: Verification & Test Execution**:
   - Run `npx tsc --noEmit` -> ensure 0 errors.
   - Run `npx vite build` -> ensure exit code 0.
   - Run `npm test` -> ensure all 259 existing + new M5 tests pass without regressions.
