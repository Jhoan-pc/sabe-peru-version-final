# Handoff Report: Milestone 5 Specification Mining (Conserjería de Reservas y Anti-Bloqueo de WhatsApp)

**Agent ID**: `m5_explorer_1` (M5 Spec Miner - Reservation Contracts)  
**Task**: Mine and formalize exact specifications and contracts for Milestone 5 (Fase 5: Conserjería de Reservas y Anti-Bloqueo de WhatsApp)  
**Parent Conversation ID**: `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Date**: 2026-10-14  

---

## 1. Observation

Direct observations from codebase inspection, contract definitions, and test runs:

1. **Legacy Asynchronous `window.open` in Production Controllers**:
   - In `src/main.ts` (lines 809-810):
     ```typescript
     // Try to open WhatsApp
     const newWindow = window.open(waUrl, '_blank');
     ```
   - In `src/experiencia.ts` (line 192):
     ```typescript
     window.open(waUrl, '_blank');
     ```
   - Both invocations occur inside an `async (e) => { ... await addDoc(...) }` submit handler, leaving the user-gesture tick and causing mobile browser popup blockers to suppress the action (verbatim [DT-11] in `specs/SDD_MASTER.md`).

2. **Absence of Locator and Schema Deficiencies in Stored Records**:
   - In `src/main.ts` (lines 785-793) and `src/experiencia.ts` (lines 168-176), the object stored in Firestore is:
     ```typescript
     const reservationForDb = {
       customer_name: formData.get('name'),
       customer_email: formData.get('email'),
       reservation_date: formData.get('date'),
       reservation_time: formData.get('time'),
       number_of_people: parseInt(formData.get('people') as string),
       occasion: formData.get('occasion'),
       status: 'pending'
     };
     ```
   - It omits `locator` (`SP-XXXX`), omits `created_at` timestamp, does not validate input boundaries, and lacks Imperial table advisory handling.

3. **Domain Contracts in Canonical Test Suite**:
   - In `tests/contracts/reservations.mjs` (lines 6-19):
     ```javascript
     export const KITCHEN_HOURS = Object.freeze({
       0: { open: '12:00', last: '21:30' }, // Domingo
       1: { open: '12:00', last: '23:30' }, // Lunes
       2: { open: '12:00', last: '23:30' }, // Martes
       3: { open: '12:00', last: '23:30' }, // Miércoles
       4: { open: '12:00', last: '23:30' }, // Jueves
       5: { open: '12:00', last: '23:30' }, // Viernes
       6: { open: '12:00', last: '22:30' }  // Sábado
     });
     export const MAX_ACTIVE_RESERVATIONS_PER_SLOT = 4;
     export const MAX_STANDARD_GROUP_SIZE = 6;
     export const MAX_TOTAL_GUEST_CAPACITY = 20;
     export const LOCATOR_REGEX = /^SP-[A-Z0-9]{4}$/;
     ```
   - Pure functions verified:
     - `generateDaySlots(dayOfWeek)` generates 30-min intervals.
     - `checkSlotAvailability(activeCount)` returns `{ available: activeCount < 4, reason?: 'Completo' }`.
     - `validateGuestCount(people)` validates 1..20 and flags `isImperial: people > 6`.
     - `generateReservationLocator(rng)` generates `SP-XXXX` using 32 unambiguous characters (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
     - `buildWhatsAppReservationUrl({ phone, locator, name, date, time, people })` produces `https://wa.me/{cleanPhone}?text={encoded}`.

4. **Error Handling Architecture**:
   - `specs/SDD_MASTER.md` §3.2 (6):
     > "Manejo de Errores Formal (RFC 9457): Prohibido el uso de alert() nativo del navegador. Todo fallo en reservas o carga de carta debe mapearse a Problem Details (title, detail) y mostrarse en toasts flotantes acordes al Design System."
   - `tests/contracts/errors.mjs` defines `createProblemDetails` and `renderProblemToastHtml` with `.toast.error.rfc-9457[role="alert"][data-status]`.
   - `src/admin.ts` (lines 190-264) already implements this pattern, but `src/main.ts` and `src/experiencia.ts` still use inline text messages (`#form-message`).

5. **Test Baseline Status**:
   - Executed `node tests/test-runner.mjs`. Result:
     `RESULT: ALL TEST SUITES PASSED (Duration: 7.75s)`
     `Tier 1: Pipeline & Hygiene [PASS]`
     `Tier 2: Boundary & Domain Invariants [PASS]`
     `Tier 3: DOM Transitions & Pairwise [PASS]`
     `Tier 4: Real-World Scenarios [PASS]`
     `87 pass, 0 fail`.

---

## 2. Logic Chain

1. **Step 1 (Root Cause & Gap Analysis)**:
   - Comparing current `src/main.ts` and `src/experiencia.ts` against `specs/SDD_MASTER.md` [DT-11] confirms that the popup blocker vulnerability stems directly from calling `window.open` after `await addDoc()`.
   - Furthermore, `src/reservations.ts` currently only exports `getAvailableSlots` and `initReservationUI`, omitting the pure contracts (`LOCATOR_REGEX`, `generateReservationLocator`, `validateGuestCount`, `checkSlotAvailability`, `buildWhatsAppReservationUrl`).

2. **Step 2 (2-Step Concierge Flow Invariant)**:
   - To eliminate popup blocker vulnerability [DT-11], the form submission must finish by rendering a confirmation card (`#reservation-confirmation-card`) containing the generated locator code (`SP-XXXX`) and an anchor link (`#btn-whatsapp-confirm`) pointing to `https://wa.me/34662125650?text=...`.
   - Since the WhatsApp opening occurs via a voluntary user click on the link, mobile browsers will recognize it as a legitimate user action, eliminating 100% of popup suppression.

3. **Step 3 (Capacity & Group Size Governance)**:
   - `KITCHEN_HOURS` defines valid service boundaries (Sundays close at 21:30, Saturdays at 22:30, weekdays at 23:30).
   - Only active reservations (`status !== 'cancelled'`) count towards the maximum 4 bookings per 30-min slot.
   - For groups between 1 and 6 comensales, booking proceeds normally.
   - For groups between 7 and 20 comensales, the imperial table policy requires an explicit advisory banner:
     *"Grupos de más de 6 comensales requieren confirmación de mesa imperial con el maître."*
   - Any guest count < 1, > 20, or non-integer must be intercepted and rejected with an RFC 9457 Problem Details toast (Status 422).

4. **Step 4 (RFC 9457 Toast Contract)**:
   - Native `window.alert()` is strictly prohibited across the codebase.
   - Errors (slot full 409/422, invalid kitchen hour 422, past date 422, pax out of range 422, missing fields 400, DB failure 500) must trigger `showProblemToast(problem)`.
   - The toast component must use Quiet Luxury styling tokens (`#0b0b0b`, `#141414`, `#c5a880`) and auto-dismiss after 5 seconds.

---

## 3. Caveats

1. **Firestore Composite Indexing**: In `src/reservations.ts`, querying `where('status', '!=', 'cancelled')` together with `where('reservation_date', '==', dateStr)` in Firestore may require a composite index or can be safely evaluated in-memory if only querying by `reservation_date`. The implementer should ensure query resilience by filtering in memory (`snap.docs.filter(d => d.data().status !== 'cancelled')`) to guarantee zero reliance on unprovisioned Firestore indices.
2. **Dual Form Implementation**: There are two reservation forms in the codebase: one in `index.html` (handled by `src/main.ts`) and one in `experiencia.html` (handled by `src/experiencia.ts`). Both must share the unified domain logic and 2-step concierge flow from `src/reservations.ts`.
3. **No Code Implementation in this Turn**: Per the Specification Miner role constraints, this agent has performed read-only specification extraction and blueprint construction; no production code was modified.

---

## 4. Conclusion

Milestone 5 specifications and contracts have been fully mined, formalized, and documented in:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_1\plan.md`

All 5 core requirements are defined with mathematical and structural precision:
1. Formal reservation contract extraction (`ReservationInput`, `ReservationOutput`, `ReservationSlot`, `ProblemDetails`).
2. Exact locator contract (`^SP-[A-Z0-9]{4}$`, 32-char unambiguous alphabet, 1,048,576 combinations).
3. Capacity calculation rules (30-min intervals, max 4 active bookings excluding `cancelled`, 1..20 guest capacity, > 6 Imperial Table advisory).
4. 2-Step Concierge Flow contract (Step 1 DB insertion with zero `window.open` -> Step 2 confirmation card with voluntary WhatsApp CTA).
5. RFC 9457 Problem Details error catalog and Quiet Luxury toast UI contract (zero `alert()`).

---

## 5. Verification Method

To independently verify this specification and ensure implementation readiness:

1. **Verify Test Baseline**:
   ```powershell
   node tests/test-runner.mjs
   ```
   *Expected outcome*: 87 passed tests across Tiers 1-4 with zero failures.

2. **Inspect Specification Blueprint**:
   Examine `plan.md` at:
   `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_1\plan.md`
   Verify presence of the Features Discovered table (12 features) and Edge Cases table (20 edge cases).

3. **Verify Contract Parity**:
   Compare the algorithms and regexes in `plan.md` against `tests/contracts/reservations.mjs` and `tests/contracts/errors.mjs`.

4. **Invalidation Conditions**:
   This handoff is invalidated if:
   - Any controller introduces or retains `window.open()` in an asynchronous submit callback.
   - Any controller invokes native `window.alert()`.
   - Locators are generated that fail the regex `^SP-[A-Z0-9]{4}$`.
   - Cancelled reservations are counted towards the slot limit of 4.
